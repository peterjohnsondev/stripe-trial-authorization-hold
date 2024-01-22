# Quick Start Guide

## 5-Minute Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Stripe Credentials
```bash
cp .env.example .env
```

Then edit `.env` and add your Stripe API keys from https://dashboard.stripe.com/apikeys

```env
STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE
STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_SECRET_HERE
```

### 3. Start the Server
```bash
npm run dev
```

You should see:
```
✅ Server is running on port 5000
📍 Environment: development
🔑 Stripe API Key configured: ✓
```

### 4. Test the API

In another terminal, test with curl:

```bash
# Health check
curl http://localhost:5000/health

# Create a customer with trial and auth hold
curl -X POST http://localhost:5000/api/subscription/create-with-auth-hold \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "paymentMethodId": "pm_card_visa",
    "priceId": "price_1234567890"
  }'
```

## How It Works

### Authorization Hold Flow

```
┌─────────────────────────────────────────────┐
│  Customer Initiates Free Trial Signup       │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│  1. Create Stripe Customer                  │
│     → Store email, name in Stripe           │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│  2. Create $_ Authorization Hold           │
│     → Use PaymentIntent (not charged)       │
│     → Verify card has funds                 │
│     → Hold released after verification      │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│  3. Create Free Trial Subscription          │
│     → 14-day free trial                     │
│     → Start date: today                     │
│     → End date: today + 14 days             │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│  ✅ Auth Hold Verified & Released           │
│  ✅ Trial Subscription Active               │
│  ✅ Customer Ready to Use Service           │
└─────────────────────────────────────────────┘
```

## API Quick Reference

### Create Customer with Trial + Auth Hold
**Single endpoint for complete setup:**

```bash
POST /api/subscription/create-with-auth-hold
```

Request:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "paymentMethodId": "pm_1234567890",
  "priceId": "price_1234567890"
}
```

### Check Authorization Hold Status
```bash
GET /api/authorization/status/{paymentIntentId}
```

### Release Authorization Hold
```bash
POST /api/authorization/release

{
  "paymentIntentId": "pi_1234567890"
}
```

### Get Subscription Details
```bash
GET /api/subscription/details/{subscriptionId}
```

### Cancel Subscription
```bash
DELETE /api/subscription/cancel/{subscriptionId}
```

## Important Notes

### Authorization Hold Amount
- **Amount**: $_ USD
- **Not captured**: This is a hold only
- **Auto-released**: After verification
- **Visible duration**: 3-7 business days on card statement (depends on bank)

### Trial Period
- **Duration**: 14 days
- **Starts**: Immediately after signup
- **Billing**: Automatically begins after trial ends
- **Cancellation**: Customer can cancel anytime

### Webhook Configuration

For real-time updates, configure webhook in Stripe Dashboard:

1. Go to **Developers** → **Webhooks**
2. Click **+ Add Endpoint**
3. Endpoint URL: `https://yourdomain.com/api/webhook/stripe`
4. Select events:
   - `payment_intent.succeeded`
   - `payment_intent.canceled`
   - `customer.subscription.created`
   - `customer.subscription.trial_will_end`

## Payment Method IDs for Testing

| Scenario | Card Number | ID |
|----------|-------------|-----|
| Standard Success | 4242 4242 4242 4242 | pm_card_visa |
| Decline | 4000 0000 0000 0002 | pm_card_decline |
| 3D Secure | 4000 0025 0000 3155 | pm_card_threeDSecure |

**Note**: In test mode, use any future expiry date and 3-digit CVC.

## Troubleshooting

### "Stripe API Key not configured"
- Check `.env` file exists
- Verify `STRIPE_SECRET_KEY` is set
- Restart server after changing `.env`

### "Payment method not found"
- Use a valid Stripe test card ID
- In test mode: `pm_card_visa`
- Get real ones from Stripe Dashboard

### "Price ID not found"
- Create a price in Stripe Dashboard: **Products** → **+Add product**
- Use the price ID (starts with `price_`)

### Port already in use
```bash
# Change port in .env
PORT=5001

# Or kill process on port 5000
lsof -ti:5000 | xargs kill -9
```

## Production Deployment

1. **Update environment**
   - Set `NODE_ENV=production`
   - Use live Stripe keys (`sk_live_`, `pk_live_`)

2. **Setup webhook**
   - Configure webhook URL in Stripe Dashboard
   - Test webhook delivery

3. **Add database**
   - Store customer data
   - Track authorization holds
   - Log all transactions

4. **Enable HTTPS**
   - All endpoints must use HTTPS
   - Generate SSL certificate

5. **Error monitoring**
   - Setup Sentry/Rollbar
   - Monitor failed authorizations
   - Alert on subscription issues

## Next Steps

- Read full [README.md](./README.md) for complete documentation
- View [examples.js](./examples.js) for code samples
- Check Stripe docs: https://stripe.com/docs

---

**Need help?** Check the full README or Stripe API documentation.
