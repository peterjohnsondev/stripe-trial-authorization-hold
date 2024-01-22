# Installation & Deployment Guide

## ✅ Pre-Installation Requirements

- **Node.js**: v14 or higher
- **npm**: v6 or higher
- **Stripe Account**: https://stripe.com (free account works for testing)
- **Git**: (optional but recommended)

Check your versions:
```bash
node --version
npm --version
```

---

## 📦 Installation Steps

### Step 1: Navigate to Project Directory

### Step 2: Install Dependencies
```bash
npm install
```

This installs:
- `stripe` - Stripe API SDK
- `express` - Web framework
- `dotenv` - Environment variable management
- `cors` - Cross-origin resource sharing
- `body-parser` - Request body parsing
- `nodemon` - Auto-reload in development

### Step 3: Get Stripe API Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Log in or create free account
3. Navigate to **Developers** → **API Keys**
4. Copy your **Secret Key** (starts with `sk_test_` or `sk_live_`)
5. Copy your **Publishable Key** (starts with `pk_test_` or `pk_live_`)

### Step 4: Configure Environment

```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your editor
# Add STRIPE_SECRET_KEY from step 3
nano .env
# or
open .env  # macOS
code .env  # VS Code
```

**Example .env file:**
```env
STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE
STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_SECRET_HERE
PORT=5000
NODE_ENV=development
RETURN_URL=https://example.com/return
```

### Step 5: Start Development Server

```bash
npm run dev
```

Expected output:
```
✅ Server is running on port 5000
📍 Environment: development
🔑 Stripe API Key configured: ✓
```

---

## 🔌 Configure Webhooks (Important)

### Why Webhooks?
Webhooks allow Stripe to notify your server of payment events in real-time. Essential for:
- Releasing authorization holds
- Charging at end of trial
- Handling failed payments
- Sending notifications

### Setup Steps

1. **Open Stripe Dashboard**: https://dashboard.stripe.com
2. **Go to Webhooks**: Developers → Webhooks → Add Endpoint
3. **Enter Endpoint URL**:
   - **Development**: `http://localhost:5000/api/webhook/stripe`
   - **Production**: `https://yourdomain.com/api/webhook/stripe`
4. **Select Events**:
   - `payment_intent.succeeded`
   - `payment_intent.failed`
   - `payment_intent.canceled`
   - `customer.subscription.created`
   - `customer.subscription.trial_will_end`
   - `customer.subscription.deleted`
5. **Get Webhook Secret**: Copy the "Signing secret"
6. **Add to .env**:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_YOUR_SECRET
   ```

### For Local Testing
Use Stripe CLI to forward webhook events to your local server:

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe  # macOS

# Login to Stripe
stripe login

# Forward events to local server
stripe listen --forward-to localhost:5000/api/webhook/stripe
```

---

## 🧪 Test Your Setup

### Test 1: Health Check
```bash
curl http://localhost:5000/health
```

Expected response:
```json
{
  "status": "Server is running",
  "timestamp": "2024-02-23T12:00:00.000Z"
}
```

### Test 2: Create Customer with Auth Hold

```bash
curl -X POST http://localhost:5000/api/subscription/create-with-auth-hold \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "paymentMethodId": "pm_card_visa",
    "priceId": "price_1234567890"
  }'
```

**Note**: Replace `priceId` with your actual Stripe price ID.

### Test 3: Check Server Logs

Watch for these log entries:
```
✅ PaymentIntent succeeded
✅ Authorization hold verified
✅ Subscription created
✅ Authorization hold released
```

---

## 🆔 Getting Your Stripe IDs

### Create a Price (for subscriptions)

1. Go to **Products** → **+ Add product**
2. Fill in product details:
   - **Name**: "Membership"
   - **Price**: $_/month
   - **Billing period**: Monthly
3. Copy the **Price ID** (starts with `price_`)
4. Use in API calls

### Get Customer Payment Method

For testing, Stripe provides pre-tokenized card IDs:
- Success: `pm_card_visa`
- Decline: `pm_card_chargeDeclined`
- 3D Secure: `pm_card_threeDSecure`

For production, obtain from Stripe Checkout or Payment Element.

---

## 🚀 Production Deployment Checklist

### Before Going Live

- [ ] **API Keys**: Switch to Live keys (`sk_live_`, `pk_live_`)
- [ ] **Environment**: Set `NODE_ENV=production`
- [ ] **HTTPS**: Enable SSL/TLS certificate
- [ ] **Domain**: Replace localhost with your domain
- [ ] **Webhook**: Register production webhook URL
- [ ] **Database**: Connect persistent database
- [ ] **Monitoring**: Setup error tracking (Sentry, LogRocket, etc.)
- [ ] **Rate Limiting**: Implement API rate limits
- [ ] **Logging**: Setup centralized logging
- [ ] **Backups**: Configure automated backups
- [ ] **Testing**: Complete end-to-end testing
- [ ] **Security**: Enable firewall/WAF
- [ ] **Team Access**: Grant necessary permissions

### Deployment Platforms

#### Heroku (Easy)
```bash
# Install Heroku CLI
npm install -g heroku

# Login
heroku login

# Create app
heroku create your-app-name

# Set environment variables
heroku config:set STRIPE_SECRET_KEY=sk_live_...
heroku config:set NODE_ENV=production

# Deploy
git push heroku main
```

#### AWS (EC2)
```bash
# 1. Launch EC2 instance (Node.js AMI)
# 2. SSH into instance
# 3. Clone repository
git clone https://github.com/yourname/stripe-auth-hold.git

# 4. Install dependencies
npm install

# 5. Configure .env
nano .env

# 6. Start with PM2
npm install -g pm2
pm2 start server.js --name "stripe-api"
pm2 startup
pm2 save

# 7. Setup reverse proxy (Nginx)
# 8. Enable HTTPS (Let's Encrypt)
```

#### Docker (Containerized)
```dockerfile
FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5000
CMD ["node", "server.js"]
```

```bash
# Build image
docker build -t stripe-api .

# Run container
docker run -e STRIPE_SECRET_KEY=sk_live_... -p 5000:5000 stripe-api
```

---

## 🔒 Security Best Practices

### Environment Variables
```bash
# ❌ NEVER commit .env file
# ✅ Add to .gitignore
echo ".env" >> .gitignore

# ✅ Use environment variable management
# (Heroku, AWS Secrets Manager, HashiCorp Vault, etc.)

# ❌ NEVER hardcode secrets
# ✅ Always use process.env
const secretKey = process.env.STRIPE_SECRET_KEY;
```

### API Security
```javascript
// ✅ Enable CORS for specific domains only
cors({
  origin: 'https://yourdomain.com',
  credentials: true
})

// ✅ Rate limiting
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// ✅ Request validation
if (!body.email || !body.email.includes('@')) {
  return res.status(400).json({ error: 'Invalid email' });
}
```

### Payment Security
```javascript
// ✅ Never store raw card data
// ✅ Always use Stripe tokenization
// ✅ Verify webhook signatures
// ✅ Use HTTPS only
// ✅ Log sensitive data minimally
```

---

## 🐛 Troubleshooting

### Problem: "Cannot find module 'stripe'"
**Solution:**
```bash
npm install
```

### Problem: "STRIPE_SECRET_KEY undefined"
**Solution:**
1. Check .env file exists
2. Verify STRIPE_SECRET_KEY is set
3. Restart server: `Ctrl+C` then `npm run dev`

### Problem: "Port 5000 already in use"
**Solution:**
```bash
# Option 1: Change port in .env
PORT=5001

# Option 2: Kill process on port 5000
lsof -ti:5000 | xargs kill -9
```

### Problem: "Webhook signature verification failed"
**Solution:**
1. Check STRIPE_WEBHOOK_SECRET in .env is correct
2. Verify endpoint URL in Stripe Dashboard
3. Use Stripe CLI: `stripe listen --forward-to ...`

### Problem: "Invalid API Key"
**Solution:**
- Verify key starts with `sk_test_` (test) or `sk_live_` (live)
- Check key is in correct environment (test vs live)
- Copy full key, not partial

### Problem: "PaymentIntent not found"
**Solution:**
- Verify paymentIntentId is correct
- Check payment intent belongs to same Stripe account
- Ensure customer has active payment method

---

## 📞 Getting Help

### Server Logs
```bash
# Watch logs in development
npm run dev

# View error details in terminal or browser console
```

### Stripe Dashboard
- **Payments**: See all transactions
- **Customers**: View customer details
- **Events**: Monitor in real-time
- **Logs**: View API requests

### CLI Commands
```bash
# Test health
curl http://localhost:5000/health

# View process
ps aux | grep node

# Check port
lsof -i :5000

# Test API with curl
curl -X GET http://localhost:5000/api/authorization/status/pi_test123
```

---

## 📊 Performance Optimization

### For Production

```javascript
// ✅ Enable compression
const compression = require('compression');
app.use(compression());

// ✅ Add response caching
app.set('view cache', true);

// ✅ Use connection pooling
// (if using database)

// ✅ Monitor memory usage
setInterval(() => {
  console.log('Memory:', process.memoryUsage());
}, 60000);

// ✅ Load balancing
// Use Nginx or AWS Load Balancer
```

---

## 📈 Monitoring & Alerts

### Setup Monitoring
1. **Error Tracking**: Sentry, Rollbar, or Bugsnag
2. **Performance**: New Relic, Datadog, or AppDynamics
3. **Uptime**: Pingdom or UptimeRobot
4. **Logs**: CloudWatch, Splunk, or ELK Stack

### Key Metrics to Track
- API response time
- Authorization success rate
- Webhook delivery rate
- Error count and types
- Customer signup conversion
- Trial-to-paid conversion

---

## 🎓 Next Steps After Deployment

1. **Monitor**: Watch production logs and metrics
2. **Test**: Perform end-to-end testing with real payments
3. **Iterate**: Gather feedback and improve
4. **Document**: Update deployment procedures
5. **Train**: Educate team on operations
6. **Scale**: Optimize for growth

---

## 📚 Additional Resources

- [Stripe API Documentation](https://stripe.com/docs/api)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [Express.js Guide](https://expressjs.com/)
- [Security Checklist](https://owasp.org/www-project-web-security-testing-guide/)

---

**Status**: Ready for deployment! Follow this guide for successful setup. 🚀
