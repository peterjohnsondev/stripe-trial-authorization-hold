# API Reference

## Base URL
```
http://localhost:5000/api
```

## Authentication
All endpoints accept `application/json` Content-Type. No authentication required for testing (add in production).

---

## Endpoints

### 1. Authorization Holds

#### Create $_ Authorization Hold
- **URL**: `/authorization/hold`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "customerId": "cus_1234567890",
    "paymentMethodId": "pm_1234567890"
  }
  ```
- **Response** (201):
  ```json
  {
    "message": "$_ authorization hold created successfully",
    "data": {
      "success": true,
      "paymentIntentId": "pi_1234567890",
      "status": "succeeded",
      "amount": 2900,
      "currency": "usd",
      "clientSecret": "pi_1234567890_secret_xxx"
    }
  }
  ```
- **Error** (400):
  ```json
  {
    "error": "Missing required fields: customerId and paymentMethodId"
  }
  ```

---

#### Release Authorization Hold
- **URL**: `/authorization/release`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "paymentIntentId": "pi_1234567890"
  }
  ```
- **Response** (200):
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

---

#### Capture Authorization Hold
- **URL**: `/authorization/capture`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "paymentIntentId": "pi_1234567890"
  }
  ```
- **Response** (200):
  ```json
  {
    "message": "Authorization hold captured successfully",
    "data": {
      "success": true,
      "paymentIntentId": "pi_1234567890",
      "status": "succeeded",
      "amount": 2900
    }
  }
  ```

---

#### Get Authorization Status
- **URL**: `/authorization/status/:paymentIntentId`
- **Method**: `GET`
- **Parameters**: `paymentIntentId` (path)
- **Response** (200):
  ```json
  {
    "message": "Authorization status retrieved successfully",
    "data": {
      "paymentIntentId": "pi_1234567890",
      "status": "succeeded",
      "amount": 2900,
      "currency": "usd",
      "customer": "cus_1234567890",
      "paymentMethod": "pm_1234567890",
      "metadata": {
        "type": "free_trial_authorization",
        "timestamp": "2024-02-23T10:30:00.000Z"
      }
    }
  }
  ```

---

### 2. Subscriptions

#### Create Customer with Auth Hold & Trial
- **URL**: `/subscription/create-with-auth-hold`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "paymentMethodId": "pm_1234567890",
    "priceId": "price_1234567890"
  }
  ```
- **Response** (201):
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

---

#### Create Customer
- **URL**: `/subscription/create-customer`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "description": "Optional description"
  }
  ```
- **Response** (201):
  ```json
  {
    "message": "Customer created successfully",
    "data": {
      "customerId": "cus_1234567890",
      "email": "john@example.com",
      "name": "John Doe"
    }
  }
  ```

---

#### Create Free Trial Subscription
- **URL**: `/subscription/create-trial`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "customerId": "cus_1234567890",
    "priceId": "price_1234567890"
  }
  ```
- **Response** (201):
  ```json
  {
    "message": "Free trial subscription created successfully",
    "data": {
      "subscriptionId": "sub_1234567890",
      "customerId": "cus_1234567890",
      "status": "trialing",
      "trialStart": 1699800000,
      "trialEnd": 1701000000
    }
  }
  ```

---

#### Get Subscription Details
- **URL**: `/subscription/details/:subscriptionId`
- **Method**: `GET`
- **Parameters**: `subscriptionId` (path)
- **Response** (200):
  ```json
  {
    "message": "Subscription details retrieved successfully",
    "data": {
      "subscriptionId": "sub_1234567890",
      "customerId": "cus_1234567890",
      "status": "trialing",
      "trialEnd": 1701000000,
      "items": [
        {
          "priceId": "price_1234567890",
          "productId": "prod_1234567890"
        }
      ]
    }
  }
  ```

---

#### Cancel Subscription
- **URL**: `/subscription/cancel/:subscriptionId`
- **Method**: `DELETE`
- **Parameters**: `subscriptionId` (path)
- **Response** (200):
  ```json
  {
    "message": "Subscription cancelled successfully",
    "data": {
      "success": true,
      "subscriptionId": "sub_1234567890",
      "status": "canceled",
      "cancelledAt": 1699900000
    }
  }
  ```

---

### 3. Checkout

#### Create Checkout Session
- **URL**: `/checkout/create-session`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "priceId": "price_1234567890",
    "customerEmail": "customer@example.com",
    "successUrl": "https://example.com/success",
    "cancelUrl": "https://example.com/cancel"
  }
  ```
- **Response** (201):
  ```json
  {
    "message": "Checkout session created successfully",
    "data": {
      "sessionId": "cs_test_1234567890",
      "url": "https://checkout.stripe.com/pay/cs_test_1234567890"
    }
  }
  ```

---

#### Get Checkout Session
- **URL**: `/checkout/session/:sessionId`
- **Method**: `GET`
- **Parameters**: `sessionId` (path)
- **Response** (200):
  ```json
  {
    "message": "Checkout session retrieved successfully",
    "data": {
      "sessionId": "cs_test_1234567890",
      "status": "complete",
      "customerId": "cus_1234567890",
      "subscriptionId": "sub_1234567890",
      "paymentStatus": "paid",
      "amountTotal": 0,
      "currency": "usd"
    }
  }
  ```

---

### 4. Webhooks

#### Stripe Webhook Endpoint
- **URL**: `/webhook/stripe`
- **Method**: `POST`
- **Headers**: 
  - `stripe-signature`: Signature from Stripe
  - `Content-Type`: application/json
- **Body**: Raw JSON from Stripe

**Handled Events**:
- `payment_intent.succeeded` - Authorization successful
- `payment_intent.payment_failed` - Authorization failed
- `payment_intent.canceled` - Authorization released
- `customer.subscription.created` - Subscription created
- `customer.subscription.updated` - Subscription modified
- `customer.subscription.deleted` - Subscription cancelled
- `customer.subscription.trial_will_end` - Trial ending reminder

---

## Error Codes

| Code | Message | Solution |
|------|---------|----------|
| 400 | Missing required fields | Check request body parameters |
| 400 | Invalid customer ID | Verify customer exists in Stripe |
| 400 | Invalid payment method | Use valid Stripe payment method |
| 401 | Stripe authentication failed | Check API keys in .env |
| 500 | Invalid request to Stripe | Check API documentation |
| 500 | Stripe API error | Check Stripe status page |

---

## Example Workflows

### Workflow 1: Basic Trial Signup
```
1. POST /subscription/create-with-auth-hold
   → Returns: customerId, paymentIntentId, subscriptionId

2. GET /authorization/status/:paymentIntentId
   → Verify: status = "succeeded"

3. POST /authorization/release
   → Release the $_ hold

4. GET /subscription/details/:subscriptionId
   → Confirm: status = "trialing"
```

### Workflow 2: Trial to Paid
```
When trial ends (day 14):

1. Webhook: customer.subscription.trial_will_end
   → Send reminder email

2. Trial expires
3. Webhook: invoice.payment_succeeded
   → Customer charged (no authorization hold)
4. Subscription: status = "active"
```

### Workflow 3: Trial Cancellation
```
1. Customer wants to cancel
2. DELETE /subscription/cancel/:subscriptionId
3. Webhook: customer.subscription.deleted
4. POST /authorization/release (if hold still active)
```

---

## Rate Limiting (Production)

Recommended rate limits:
- **Per user**: 100 requests/hour
- **Per IP**: 1000 requests/hour
- **Per endpoint**: Varies by operation

---

## Status Values

### Payment Intent Status
- `requires_payment_method` - No payment method
- `requires_confirmation` - Awaiting confirmation
- `requires_action` - Customer action needed (3D Secure)
- `processing` - Payment processing
- `requires_capture` - Authorized, awaiting capture
- `succeeded` - Completed successfully
- `canceled` - Cancelled

### Subscription Status
- `trialing` - In free trial period
- `active` - Active, being billed
- `past_due` - Payment failed
- `canceled` - Cancelled
- `unpaid` - Unpaid invoices

---

## Useful Links

- [Stripe API Reference](https://stripe.com/docs/api)
- [Stripe PaymentIntent](https://stripe.com/docs/payments/payment-intents)
- [Stripe Subscriptions](https://stripe.com/docs/billing/subscriptions/overview)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
