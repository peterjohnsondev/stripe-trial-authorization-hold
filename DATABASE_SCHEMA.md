# Database Schema Guide

## Overview

This guide outlines the database schema needed to store persistent data for your Stripe authorization hold system. While the current implementation works without a database, production deployments should persist this data.

---

## Database Options

### Recommended
- **PostgreSQL**: Reliable, scalable, great for financial data
- **MongoDB**: Flexible schema, easy setup
- **Firebase**: Serverless, minimal ops

### Setup Examples

#### PostgreSQL
```bash
# Using Node.js
npm install pg
npm install sequelize  # ORM
```

#### MongoDB
```bash
# Using Node.js
npm install mongoose
npm install mongodb
```

---

## Data Models

### 1. Customers Table

Stores Stripe customer information.

```sql
CREATE TABLE customers (
  id SERIAL PRIMARY KEY,
  stripe_customer_id VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  phone VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB,
  INDEX idx_stripe_id (stripe_customer_id),
  INDEX idx_email (email)
);
```

**MongoDB equivalent:**
```javascript
const customerSchema = {
  stripe_customer_id: { type: String, unique: true },
  email: String,
  name: String,
  phone: String,
  created_at: { type: Date, default: Date.now },
  updated_at: Date,
  metadata: Object
};
```

---

### 2. Payment Methods Table

Stores payment method (card) information.

```sql
CREATE TABLE payment_methods (
  id SERIAL PRIMARY KEY,
  stripe_payment_method_id VARCHAR(255) UNIQUE NOT NULL,
  stripe_customer_id VARCHAR(255) NOT NULL,
  card_last_four VARCHAR(4),
  card_brand VARCHAR(50),
  card_exp_month INTEGER,
  card_exp_year INTEGER,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (stripe_customer_id) REFERENCES customers(stripe_customer_id),
  INDEX idx_customer_id (stripe_customer_id),
  INDEX idx_payment_method_id (stripe_payment_method_id)
);
```

---

### 3. Authorization Holds Table

Tracks all authorization holds.

```sql
CREATE TABLE authorization_holds (
  id SERIAL PRIMARY KEY,
  stripe_payment_intent_id VARCHAR(255) UNIQUE NOT NULL,
  stripe_customer_id VARCHAR(255) NOT NULL,
  stripe_subscription_id VARCHAR(255),
  amount_cents INTEGER DEFAULT 2900,
  currency VARCHAR(3) DEFAULT 'USD',
  status VARCHAR(50), -- 'succeeded', 'canceled', 'failed', etc.
  hold_type VARCHAR(50), -- 'free_trial_verification'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,
  released_at TIMESTAMP,
  reason_released VARCHAR(255),
  metadata JSONB,
  FOREIGN KEY (stripe_customer_id) REFERENCES customers(stripe_customer_id),
  INDEX idx_customer_id (stripe_customer_id),
  INDEX idx_payment_intent_id (stripe_payment_intent_id),
  INDEX idx_status (status)
);
```

---

### 4. Subscriptions Table

Stores subscription details.

```sql
CREATE TABLE subscriptions (
  id SERIAL PRIMARY KEY,
  stripe_subscription_id VARCHAR(255) UNIQUE NOT NULL,
  stripe_customer_id VARCHAR(255) NOT NULL,
  stripe_price_id VARCHAR(255) NOT NULL,
  stripe_product_id VARCHAR(255),
  status VARCHAR(50), -- 'trialing', 'active', 'past_due', 'canceled'
  trial_start TIMESTAMP,
  trial_end TIMESTAMP,
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  started_at TIMESTAMP,
  cancelled_at TIMESTAMP,
  cancellation_reason VARCHAR(255),
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB,
  FOREIGN KEY (stripe_customer_id) REFERENCES customers(stripe_customer_id),
  INDEX idx_customer_id (stripe_customer_id),
  INDEX idx_subscription_id (stripe_subscription_id),
  INDEX idx_status (status)
);
```

---

### 5. Events/Webhooks Table

Log all Stripe webhook events.

```sql
CREATE TABLE webhook_events (
  id SERIAL PRIMARY KEY,
  stripe_event_id VARCHAR(255) UNIQUE NOT NULL,
  stripe_customer_id VARCHAR(255),
  event_type VARCHAR(100),
  event_data JSONB,
  processed BOOLEAN DEFAULT FALSE,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  processed_at TIMESTAMP,
  INDEX idx_event_id (stripe_event_id),
  INDEX idx_event_type (event_type),
  INDEX idx_processed (processed)
);
```

---

### 6. Transactions/Invoices Table

Track all charges and payments.

```sql
CREATE TABLE transactions (
  id SERIAL PRIMARY KEY,
  stripe_invoice_id VARCHAR(255) UNIQUE,
  stripe_payment_intent_id VARCHAR(255) UNIQUE,
  stripe_customer_id VARCHAR(255) NOT NULL,
  stripe_subscription_id VARCHAR(255),
  amount_cents INTEGER,
  currency VARCHAR(3) DEFAULT 'USD',
  status VARCHAR(50), -- 'succeeded', 'failed', 'pending'
  description TEXT,
  payment_method VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  paid_at TIMESTAMP,
  failed_at TIMESTAMP,
  failure_reason TEXT,
  metadata JSONB,
  FOREIGN KEY (stripe_customer_id) REFERENCES customers(stripe_customer_id),
  INDEX idx_customer_id (stripe_customer_id),
  INDEX idx_status (status)
);
```

---

## Example Queries

### Get Customer with Active Subscription
```sql
SELECT 
  c.*, 
  s.*, 
  ah.stripe_payment_intent_id,
  ah.status as auth_hold_status
FROM customers c
LEFT JOIN subscriptions s ON c.stripe_customer_id = s.stripe_customer_id
LEFT JOIN authorization_holds ah ON s.stripe_subscription_id = ah.stripe_subscription_id
WHERE c.email = 'user@example.com'
ORDER BY s.created_at DESC;
```

### Get Auth Holds Released Today
```sql
SELECT * FROM authorization_holds
WHERE DATE(released_at) = CURRENT_DATE
ORDER BY released_at DESC;
```

### Get Failed Authorization Holds
```sql
SELECT * FROM authorization_holds
WHERE status = 'failed'
ORDER BY created_at DESC;
```

### Get Trials Ending Soon
```sql
SELECT c.*, s.*
FROM customers c
JOIN subscriptions s ON c.stripe_customer_id = s.stripe_customer_id
WHERE s.status = 'trialing'
AND s.trial_end BETWEEN NOW() AND NOW() + INTERVAL '3 days'
ORDER BY s.trial_end ASC;
```

---

## Mongoose Schema Examples

### Customer Schema
```javascript
const customerSchema = new mongoose.Schema({
  stripe_customer_id: { type: String, unique: true, required: true },
  email: { type: String, required: true, index: true },
  name: String,
  phone: String,
  created_at: { type: Date, default: Date.now },
  updated_at: Date,
  metadata: mongoose.Schema.Types.Mixed
});

const Customer = mongoose.model('Customer', customerSchema);
```

### Subscription Schema
```javascript
const subscriptionSchema = new mongoose.Schema({
  stripe_subscription_id: { type: String, unique: true, required: true },
  stripe_customer_id: { type: String, required: true, index: true },
  stripe_price_id: String,
  status: String,
  trial_start: Date,
  trial_end: Date,
  current_period_start: Date,
  current_period_end: Date,
  created_at: { type: Date, default: Date.now },
  metadata: mongoose.Schema.Types.Mixed
});

const Subscription = mongoose.model('Subscription', subscriptionSchema);
```

### Authorization Hold Schema
```javascript
const authorizationHoldSchema = new mongoose.Schema({
  stripe_payment_intent_id: { type: String, unique: true, required: true },
  stripe_customer_id: { type: String, required: true, index: true },
  stripe_subscription_id: String,
  amount_cents: { type: Number, default: 2900 },
  currency: { type: String, default: 'USD' },
  status: String,
  created_at: { type: Date, default: Date.now },
  released_at: Date,
  metadata: mongoose.Schema.Types.Mixed
});

const AuthorizationHold = mongoose.model('AuthorizationHold', authorizationHoldSchema);
```

---

## Integration with Node.js

### Store Authorization Hold

```javascript
// controllers/authorizationController.js (updated)
const createAuthorizationHold = async (customerId, paymentMethodId) => {
  const paymentIntent = await stripe.paymentIntents.create({
    amount: 2900,
    currency: 'usd',
    customer: customerId,
    payment_method: paymentMethodId,
    confirm: true,
    capture_method: 'manual',
  });

  // Persist to database
  await AuthorizationHold.create({
    stripe_payment_intent_id: paymentIntent.id,
    stripe_customer_id: customerId,
    amount_cents: paymentIntent.amount,
    currency: paymentIntent.currency,
    status: paymentIntent.status,
    created_at: new Date()
  });

  return {
    success: true,
    paymentIntentId: paymentIntent.id,
    status: paymentIntent.status
  };
};
```

### Store Subscription

```javascript
const createFreeTrialSubscription = async (customerId, priceId) => {
  const subscription = await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
    trial_period_days: 14
  });

  // Persist to database
  await Subscription.create({
    stripe_subscription_id: subscription.id,
    stripe_customer_id: customerId,
    stripe_price_id: priceId,
    status: subscription.status,
    trial_start: new Date(subscription.trial_start * 1000),
    trial_end: new Date(subscription.trial_end * 1000),
    created_at: new Date()
  });

  return subscription;
};
```

### Log Webhook Events

```javascript
// routes/webhook.js (updated)
const handlePaymentIntentSucceeded = async (paymentIntent) => {
  // Log event
  await WebhookEvent.create({
    stripe_event_id: paymentIntent.id,
    stripe_customer_id: paymentIntent.customer,
    event_type: 'payment_intent.succeeded',
    event_data: paymentIntent,
    processed: true,
    processed_at: new Date()
  });

  // Update authorization hold
  await AuthorizationHold.updateOne(
    { stripe_payment_intent_id: paymentIntent.id },
    { 
      status: 'succeeded',
      updated_at: new Date()
    }
  );
};
```

---

## Data Retention & Cleanup

### Archive Old Records
```javascript
// Archive transactions older than 1 year
const archiveOldTransactions = async () => {
  const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
  
  const oldTransactions = await Transaction.find({
    created_at: { $lt: oneYearAgo }
  });
  
  // Archive to separate table/database
  await TransactionArchive.insertMany(oldTransactions);
  
  // Delete from main table
  await Transaction.deleteMany({
    created_at: { $lt: oneYearAgo }
  });
};
```

### Cleanup Webhook Events
```javascript
// Delete processed webhook events older than 30 days
const cleanupWebhookEvents = async () => {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  
  await WebhookEvent.deleteMany({
    processed: true,
    created_at: { $lt: thirtyDaysAgo }
  });
};
```

---

## Performance Optimization

### Indexes
```sql
-- Create indexes for common queries
CREATE INDEX idx_customer_email ON customers(email);
CREATE INDEX idx_sub_status ON subscriptions(status);
CREATE INDEX idx_auth_status ON authorization_holds(status);
CREATE INDEX idx_trial_end ON subscriptions(trial_end);

-- Composite indexes
CREATE INDEX idx_customer_sub ON subscriptions(stripe_customer_id, status);
```

### Connection Pooling
```javascript
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,  // Maximum connections
  idleTimeoutMillis: 30000
});
```

---

## Backup & Recovery

### PostgreSQL Backup
```bash
# Daily backup
pg_dump database_name > backup_$(date +%Y%m%d).sql

# Restore from backup
psql database_name < backup_20240223.sql
```

### MongoDB Backup
```bash
# Backup
mongodump --db database_name --out ./backup

# Restore
mongorestore ./backup
```

---

## Compliance & Privacy

### GDPR Compliance
- Allow data export for customers
- Implement right to be forgotten (delete records)
- Maintain audit logs
- Encrypt sensitive data

### PCI DSS Compliance
- Never store raw card data (use Stripe tokenization)
- Encrypt database
- Restrict database access
- Regular security audits

```javascript
// Example: Customer data deletion
const deleteCustomerData = async (customerId) => {
  // Delete Stripe customer
  await stripe.customers.del(customerId);
  
  // Delete database records
  await AuthorizationHold.deleteMany({ stripe_customer_id: customerId });
  await Subscription.deleteMany({ stripe_customer_id: customerId });
  await Customer.deleteOne({ stripe_customer_id: customerId });
  
  // Log deletion
  await AuditLog.create({
    action: 'CUSTOMER_DELETED',
    customer_id: customerId,
    timestamp: new Date()
  });
};
```

---

## Next Steps

1. Choose database (PostgreSQL, MongoDB, Firebase)
2. Implement schema based on your choice
3. Update controllers to persist data
4. Add logging to webhook handlers
5. Setup automated backups
6. Implement monitoring and alerts
7. Test recovery procedures

---

**Database Integration**: Follow this guide to scale your Stripe implementation to production. 🚀
