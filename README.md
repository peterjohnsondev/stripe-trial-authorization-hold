# Stripe Authorization Hold API

A Node.js/Express server implementing Stripe API integration for managing $_ authorization holds on free trial signups. This system verifies customer card validity without capturing funds, then releases the hold immediately.

## Overview

This API enables:
- **Authorization Holds**: Place a $_ hold on customer cards to verify sufficient funds
- **Free Trial Subscriptions**: Create subscription with 14-day trial period
- **Automatic Release**: Release authorization holds after card verification
- **Webhook Handling**: Process Stripe events in real-time

## Architecture

```
├── server.js                 # Express server entry point
├── config/
│   └── stripe.js            # Stripe initialization
├── controllers/
│   ├── authorizationController.js   # Authorization hold logic
│   └── subscriptionController.js    # Subscription management
├── routes/
│   ├── authorization.js     # Authorization endpoints
│   ├── subscription.js      # Subscription endpoints
│   ├── checkout.js          # Checkout session endpoints
│   └── webhook.js           # Stripe webhook handler
└── middleware/
    └── errorHandler.js      # Error handling
```

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/peterjohnsondev/strripestripe-trial-authorization-hold
   cd stripe-trial-authorization-hold
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your Stripe credentials:
   ```env
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_PUBLISHABLE_KEY=pk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   PORT=5000
   NODE_ENV=development
   ```

## Getting Stripe Credentials

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **Developers** → **API Keys**
3. Copy your Secret Key and Publishable Key
4. For webhooks, go to **Developers** → **Webhooks** and create an endpoint
5. Configure webhook to listen for these events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `payment_intent.canceled`
   - `customer.subscription.created`
   - `customer.subscription.trial_will_end`

## Running the Server

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

Server will start on `http://localhost:5000`

## API Endpoints

### Health Check
- **GET** `/health` - Server status

### Authorization Hold Management

#### Create Authorization Hold
**POST** `/api/authorization/hold`

Creates a $_ authorization hold on customer's card.

Request:
```json
{
  "customerId": "cus_1234567890",
  "paymentMethodId": "pm_1234567890"
}
```

Response:
```json
{
  "message": "$_ authorization hold created successfully",
  "data": {
    "success": true,
    "paymentIntentId": "pi_1234567890",
    "status": "succeeded",
    "amount": 2900,
    "currency": "usd"
  }
}
```

#### Release Authorization Hold
**POST** `/api/authorization/release`

Cancels the PaymentIntent, releasing the authorization hold.

Request:
```json
{
  "paymentIntentId": "pi_1234567890"
}
```

Response:
```json
{
  "message": "Authorization hold released successfully",
  "data": {
    "success": true,
    "paymentIntentId": "pi_1234567890",
    "status": "canceled"
  }
}
```

#### Capture Authorization Hold
**POST** `/api/authorization/capture`

Capture the authorized amount (charge the customer).

Request:
```json
{
  "paymentIntentId": "pi_1234567890"
}
```

#### Check Authorization Status
**GET** `/api/authorization/status/:paymentIntentId`

Retrieve current status of authorization hold.

### Subscription Management

#### Create Customer with Auth Hold and Trial
**POST** `/api/subscription/create-with-auth-hold`

Complete flow: Creates customer, sets up authorization hold, and creates free trial subscription.

Request:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "paymentMethodId": "pm_1234567890",
  "priceId": "price_1234567890"
}
```

Response:
```json
{
  "message": "Customer created with authorization hold and trial subscription",
  "data": {
    "customer": {
      "customerId": "cus_1234567890",
      "email": "john@example.com",
      "name": "John Doe"
    },
    "authorizationHold": {
      "paymentIntentId": "pi_1234567890",
      "status": "succeeded",
      "amount": 2900
    },
    "subscription": {
      "subscriptionId": "sub_1234567890",
      "status": "trialing",
      "trialEnd": 1699999999
    }
  }
}
```

#### Create Customer
**POST** `/api/subscription/create-customer`

Request:
```json
{
  "name": "John Doe",
  "email": "john@example.com"
}
```

#### Create Free Trial Subscription
**POST** `/api/subscription/create-trial`

Request:
```json
{
  "customerId": "cus_1234567890",
  "priceId": "price_1234567890"
}
```

#### Get Subscription Details
**GET** `/api/subscription/details/:subscriptionId`

#### Cancel Subscription
**DELETE** `/api/subscription/cancel/:subscriptionId`

### Checkout Sessions

#### Create Checkout Session
**POST** `/api/checkout/create-session`

Creates a Stripe Checkout session for free trial signup.

Request:
```json
{
  "priceId": "price_1234567890",
  "customerEmail": "customer@example.com",
  "successUrl": "https://example.com/success",
  "cancelUrl": "https://example.com/cancel"
}
```

Response:
```json
{
  "message": "Checkout session created successfully",
  "data": {
    "sessionId": "cs_test_1234567890",
    "url": "https://checkout.stripe.com/pay/cs_test_1234567890"
  }
}
```

#### Get Checkout Session
**GET** `/api/checkout/session/:sessionId`

### Webhooks

**POST** `/api/webhook/stripe`

Stripe sends events to this endpoint. Configure in Stripe Dashboard:

**Webhook Events Handled:**
- `payment_intent.succeeded` - Auth hold created
- `payment_intent.payment_failed` - Authorization failed
- `payment_intent.canceled` - Authorization released
- `customer.subscription.created` - Trial subscription created
- `customer.subscription.updated` - Subscription changed
- `customer.subscription.deleted` - Subscription cancelled
- `customer.subscription.trial_will_end` - Trial ending soon

## Implementation Flow

### Step 1: Free Trial Signup with Authorization Hold

```
1. Customer enters checkout
   ↓
2. Create Stripe Checkout session
   ↓
3. Customer authorizes payment method
   ↓
4. Create customer in Stripe
   ↓
5. Create $_ authorization hold (PaymentIntent with capture_method: 'manual')
   ↓
6. Create 14-day free trial subscription
   ↓
7. Authorization hold verified - customer trial begins
   ↓
8. Hold released immediately (cancel PaymentIntent)
```

### Step 2: Trial to Paid Conversion

After 14-day trial ends:

```
1. Trial period expires
   ↓
2. Subscription billing begins
   ↓
3. Regular payment processed
   ↓
4. Customer charged actual subscription amount
```

## Key Concepts

### Authorization Hold
- Amount: $_
- Purpose: Verify card has sufficient funds
- Duration: Instant (released immediately)
- Method: `PaymentIntent` with `capture_method: 'manual'`
- No actual charge during trial period

### Safe Payment Flow
```
PaymentIntent created with:
- capture_method: 'manual' (don't charge yet)
- confirm: true (verify card immediately)
- off_session: true (happens without customer present)

If card valid:
- authorization succeeds
- hold is placed (typically 3-7 days visibility)
- hold is cancelled immediately

If card invalid:
- authorization fails
- customer notified
- no funds held
```

### Trial Period
- Duration: 14 days (configurable)
- Billing: Begins after trial ends
- Authorization: Verified at signup, charged at end of trial

## Error Handling

The API includes comprehensive error handling:

- **400 Bad Request**: Missing or invalid parameters
- **401 Unauthorized**: Authentication errors
- **500 Server Error**: Stripe API errors

Example error response:
```json
{
  "error": "Invalid request to Stripe",
  "message": "Invalid customer ID provided"
}
```

## Security Considerations

1. **Environment Variables**: Store all secrets in `.env` file (never commit)
2. **Webhook Verification**: All webhooks are verified using Stripe signature
3. **HTTPS**: Use HTTPS in production
4. **Rate Limiting**: Implement rate limiting in production
5. **CORS**: Configure CORS for your specific domain
6. **Payment Method**: Never store raw card data (use Stripe's tokenization)

## Testing with Stripe Test Cards

Use these cards in test mode:

| Card | Number | Expiry | CVC |
|------|--------|--------|-----|
| Success | `4242 4242 4242 4242` | Any future | Any |
| Decline | `4000 0000 0000 0002` | Any future | Any |
| Auth Required | `4000 0025 0000 3155` | Any future | Any |

**Test Customer Email**: Any email (e.g., `test@example.com`)

## Example cURL Commands

### Create Authorization Hold
```bash
curl -X POST http://localhost:5000/api/authorization/hold \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "cus_1234567890",
    "paymentMethodId": "pm_1234567890"
  }'
```

### Release Authorization Hold
```bash
curl -X POST http://localhost:5000/api/authorization/release \
  -H "Content-Type: application/json" \
  -d '{
    "paymentIntentId": "pi_1234567890"
  }'
```

### Create Customer with Auth Hold
```bash
curl -X POST http://localhost:5000/api/subscription/create-with-auth-hold \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "paymentMethodId": "pm_1234567890",
    "priceId": "price_1234567890"
  }'
```

## Production Deployment

1. **Environment**: Set `NODE_ENV=production`
2. **Security**: Enable HTTPS only
3. **Monitoring**: Set up logging and error tracking
4. **Database**: Connect to persistent database for storing payment/subscription data
5. **Backups**: Regular backups of customer and transaction data
6. **Rate Limiting**: Implement rate limiting for API endpoints
7. **Secrets Management**: Use secure secret management (not .env files)

## Troubleshooting

### Issue: "Invalid API Key"
- Check `.env` file has correct `STRIPE_SECRET_KEY`
- Ensure key starts with `sk_test_` (test) or `sk_live_` (production)

### Issue: "Webhook signature verification failed"
- Verify `STRIPE_WEBHOOK_SECRET` in `.env`
- Check webhook endpoint is registered in Stripe Dashboard
- Ensure webhook is configured with correct URL

### Issue: "Payment intent not found"
- Verify `paymentIntentId` is correct
- Check payment intent belongs to correct Stripe account
- Ensure customer has active payment method

## Support

For Stripe API documentation: https://stripe.com/docs/api

For support with this implementation, review:
- [Stripe Payments Documentation](https://stripe.com/docs/payments)
- [Stripe Subscriptions Documentation](https://stripe.com/docs/billing/subscriptions/overview)
- [PaymentIntent Documentation](https://stripe.com/docs/payments/payment-intents)

## License

MIT License
