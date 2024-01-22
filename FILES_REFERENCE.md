# Project Files Reference

Quick reference guide for all project files and their purposes.

---

## 📂 Project Structure Summary

```
├── Core Files
│   ├── server.js                      🔧 Express server main entry point
│   ├── package.json                   📦 Dependencies and npm scripts
│   ├── .env.example                   🔐 Environment variables template
│   └── .gitignore                     🚫 Git ignore rules
│
├── Configuration
│   └── config/
│       └── stripe.js                  🔒 Stripe SDK setup
│
├── Business Logic
│   └── controllers/
│       ├── authorizationController.js  💳 Authorization hold logic
│       └── subscriptionController.js   📋 Subscription management
│
├── HTTP Handlers
│   └── routes/
│       ├── authorization.js            🔐 Auth hold endpoints
│       ├── subscription.js             📝 Subscription endpoints
│       ├── checkout.js                 🛒 Checkout endpoints
│       └── webhook.js                  🔔 Stripe webhook handler
│
├── Middleware
│   └── middleware/
│       └── errorHandler.js             ⚠️  Error handling
│
├── Runnable Examples
│   └── examples.js                     💡 Code examples and workflows
│
└── Documentation
    ├── README.md                       📖 Complete documentation
    ├── QUICKSTART.md                   ⚡ 5-minute setup
    ├── API_REFERENCE.md                🔍 API endpoints reference
    ├── INSTALLATION.md                 🚀 Setup and deployment guide
    ├── DATABASE_SCHEMA.md              💾 Database design guide
    ├── IMPLEMENTATION_CHECKLIST.md     ✅ Implementation checklist
    ├── PROJECT_SUMMARY.md              📊 Project overview
    └── FILES_REFERENCE.md (this file)  📑 Files reference
```

---

## 🔧 Core Application Files

### server.js
**Purpose**: Express server entry point and configuration
**Responsibilities**:
- Initialize Express app
- Setup middleware (CORS, body parser)
- Register routes
- Error handling
- Start HTTP server

**Key Exports**:
- Express app instance for testing

**Modify When**:
- Adding new middleware
- Changing port
- Adding new route groups

---

### package.json
**Purpose**: Project metadata and dependency management
**Contains**:
- Project name, version, description
- npm scripts (start, dev, test)
- Dependencies and dev dependencies

**Important Scripts**:
- `npm start` → Run production server
- `npm run dev` → Run with auto-reload
- `npm test` → Run tests

**Add Dependencies**:
```bash
npm install <package-name>
npm install --save-dev <devpackage-name>
```

---

### .env.example
**Purpose**: Template for environment variables
**Usage**: 
```bash
cp .env.example .env
# Then edit .env with your values
```

**Variables**:
- `STRIPE_SECRET_KEY` - Secret API key (required)
- `STRIPE_PUBLISHABLE_KEY` - Public API key
- `STRIPE_WEBHOOK_SECRET` - Webhook signing secret
- `PORT` - Server port (default: 5000)
- `NODE_ENV` - Environment (development/production)

---

### .gitignore
**Purpose**: Specify files to exclude from Git
**Never Commit**:
- `.env` (contains secrets)
- `node_modules/`
- `.vscode/`
- `*.log`
- `dist/`

---

## 🔒 Configuration Files

### config/stripe.js
**Purpose**: Stripe SDK initialization and configuration
**What It Does**:
- Creates Stripe instance with API key
- Sets API version
- Exports Stripe instance for use in controllers

**Usage**:
```javascript
const { stripe } = require('../config/stripe');
const customer = await stripe.customers.retrieve('cus_...');
```

**Modify When**:
- Updating Stripe API version
- Adding Stripe configuration

---

## 💼 Business Logic Files

### controllers/authorizationController.js
**Purpose**: Handle $_ authorization hold logic
**Exports Functions**:
- `createAuthorizationHold(customerId, paymentMethodId)` - Create hold
- `releaseAuthorizationHold(paymentIntentId)` - Release hold
- `captureAuthorizationHold(paymentIntentId)` - Capture hold
- `getAuthorizationStatus(paymentIntentId)` - Get hold status

**Implementation Details**:
- Uses PaymentIntent with `capture_method: 'manual'`
- Amount: $_ 
- Metadata tracking for analytics

---

### controllers/subscriptionController.js
**Purpose**: Handle subscription and customer management
**Exports Functions**:
- `createCustomer(customerData)` - Create Stripe customer
- `createFreeTrialSubscription(customerId, priceId)` - Create trial subscription
- `getSubscriptionDetails(subscriptionId)` - Get subscription info
- `cancelSubscription(subscriptionId)` - Cancel subscription

**Implementation Details**:
- 14-day free trial by default
- Saves payment method on file for future billing
- Tracks subscription lifecycle

---

## 🔗 Route Handler Files

### routes/authorization.js
**Purpose**: API endpoints for authorization hold management
**Endpoints**:
- `POST /authorization/hold` - Create authorization hold
- `POST /authorization/release` - Release authorization hold
- `POST /authorization/capture` - Capture authorization hold
- `GET /authorization/status/:paymentIntentId` - Check status

**Error Handling**: Comprehensive validation and error responses

---

### routes/subscription.js
**Purpose**: API endpoints for subscription management
**Endpoints**:
- `POST /subscription/create-with-auth-hold` - Complete signup flow
- `POST /subscription/create-customer` - Create customer
- `POST /subscription/create-trial` - Create trial subscription
- `GET /subscription/details/:subscriptionId` - Get details
- `DELETE /subscription/cancel/:subscriptionId` - Cancel subscription

---

### routes/checkout.js
**Purpose**: API endpoints for Stripe Checkout integration
**Endpoints**:
- `POST /checkout/create-session` - Create checkout session
- `GET /checkout/session/:sessionId` - Get session details

**Configuration**:
- 14-day trial period
- Supports subscription mode

---

### routes/webhook.js
**Purpose**: Handle incoming Stripe webhook events
**Handled Events**:
- `payment_intent.succeeded` - Auth hold succeeded
- `payment_intent.payment_failed` - Auth hold failed
- `payment_intent.canceled` - Auth hold released
- `customer.subscription.created` - Subscription created
- `customer.subscription.updated` - Subscription changed
- `customer.subscription.deleted` - Subscription cancelled
- `customer.subscription.trial_will_end` - Trial ending reminder

**Security**: Verifies webhook signature before processing

---

## ⚠️ Middleware Files

### middleware/errorHandler.js
**Purpose**: Centralized error handling
**Handles**:
- Stripe-specific errors
- Validation errors
- Server errors
- Request errors

**Usage**:
```javascript
app.use(errorHandler);
```

---

## 💡 Example Files

### examples.js
**Purpose**: Demonstrates how to use the API
**Contains Functions**:
- `completeSignupFlow()` - Customer signup with auth hold
- `checkoutSessionFlow()` - Checkout session creation
- `releaseAuthorizationFlow()` - Release authorization hold
- `checkAuthorizationStatus()` - Check hold status
- `getSubscriptionDetails()` - Get subscription info
- `cancelSubscription()` - Cancel subscription

**Run Examples**:
```bash
node examples.js
```

**Use For**:
- Learning how to use API
- Testing integration
- Building frontend

---

## 📖 Documentation Files

### README.md
**Purpose**: Complete project documentation
**Sections**:
- Overview and features
- Architecture explanation
- Installation instructions
- API reference (all endpoints)
- Testing guide
- Production deployment
- Troubleshooting
- Support information

**Pages**: ~400 lines, comprehensive

---

### QUICKSTART.md
**Purpose**: Get started in 5 minutes
**Covers**:
- Quick setup steps
- Configuration
- Testing
- API quick reference
- Common troubleshooting

**Pages**: ~150 lines, concise

---

### API_REFERENCE.md
**Purpose**: Detailed API endpoint documentation
**For Each Endpoint**:
- URL and method
- Request body format
- Response format
- Error responses
- Example usage

**Pages**: ~300 lines, reference

---

### INSTALLATION.md
**Purpose**: Complete installation and deployment guide
**Covers**:
- Prerequisites
- Step-by-step installation
- Stripe configuration
- Webhook setup
- Testing procedures
- Production deployment options
- Security best practices
- Troubleshooting

**Pages**: ~400 lines, comprehensive

---

### DATABASE_SCHEMA.md
**Purpose**: Database design and schema guide
**Includes**:
- Database options and setup
- SQL table definitions
- MongoDB schemas
- Example queries
- Integration examples
- Data retention policies
- Compliance guidelines

**Pages**: ~350 lines

---

### IMPLEMENTATION_CHECKLIST.md
**Purpose**: Implementation and launch checklist
**Covers**:
- Pre-implementation requirements
- Setup checklist
- Testing checklist
- Security checklist
- Deployment checklist
- Monitoring setup
- Sign-off items

**Pages**: ~300 lines, actionable

---

### PROJECT_SUMMARY.md
**Purpose**: High-level project overview
**Contains**:
- Project structure diagram
- Feature summary
- Quick start guide
- API endpoints table
- Implementation flow
- Architecture diagram
- Support resources

**Pages**: ~250 lines, overview

---

### FILES_REFERENCE.md (this file)
**Purpose**: Quick reference for all project files
**Contents**:
- File structure summary
- Purpose of each file
- Key functions and exports
- When to modify each file
- Quick lookup guide

**Pages**: ~400 lines, reference

---

## 🔍 How to Use These Files

### I want to...

**...understand the project**
→ Start with README.md, then PROJECT_SUMMARY.md

**...get running quickly**
→ Read QUICKSTART.md and follow steps

**...deploy to production**
→ Read INSTALLATION.md and IMPLEMENTATION_CHECKLIST.md

**...call an API endpoint**
→ Check API_REFERENCE.md for exact format

**...add a database**
→ Follow DATABASE_SCHEMA.md

**...modify the code**
→ Find the file in this reference

**...understand authorization holds**
→ Read authorizationController.js

**...setup webhooks**
→ Read routes/webhook.js and INSTALLATION.md

**...test the API**
→ Run examples.js

**...debug errors**
→ Check INSTALLATION.md troubleshooting section

---

## ⚡ Common Tasks

### Add New API Endpoint

1. Create route handler in appropriate `routes/` file
2. Create controller function if needed
3. Add error handling
4. Document in API_REFERENCE.md
5. Test with curl or Postman

### Fix Authorization Hold Amount

Edit `controllers/authorizationController.js`:
```javascript
amount: 2900, // Change 2900 to desired amount in cents
```

### Change Trial Length

Edit `controllers/subscriptionController.js`:
```javascript
trial_period_days: 14, // Change 14 to desired days
```

### Add Database

1. Choose database (PostgreSQL/MongoDB)
2. Follow DATABASE_SCHEMA.md
3. Update controllers to persist data
4. Test persistence

### Deploy to Production

1. Follow INSTALLATION.md deployment section
2. Use IMPLEMENTATION_CHECKLIST.md
3. Switch to live Stripe keys
4. Configure webhooks

---

## 📊 File Statistics

| Category | Files | Lines |
|----------|-------|-------|
| Application | 5 | 150 |
| Configuration | 1 | 15 |
| Controllers | 2 | 200 |
| Routes | 4 | 300 |
| Middleware | 1 | 40 |
| Examples | 1 | 200 |
| Documentation | 8 | 2500+ |
| **Total** | **22** | **3400+** |

---

## 🚀 Quick Links

| Need | File |
|------|------|
| API endpoints | API_REFERENCE.md |
| Getting started | QUICKSTART.md |
| Setup guide | INSTALLATION.md |
| Authorization logic | controllers/authorizationController.js |
| Subscription logic | controllers/subscriptionController.js |
| Code examples | examples.js |
| Webhook handling | routes/webhook.js |
| Database setup | DATABASE_SCHEMA.md |
| Deployment | INSTALLATION.md |
| Checklist | IMPLEMENTATION_CHECKLIST.md |

---

**Created**: 2024-02-23  
**Status**: ✅ Complete  
**Version**: 1.0.0

---

## 📝 Note

This is a complete, production-ready implementation. All files are documented and organized for easy navigation and maintenance. Start with README.md if this is your first time reviewing the project.
