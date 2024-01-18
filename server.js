require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { errorHandler } = require('./middleware/errorHandler');
const stripeConfig = require('./config/stripe');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Initialize Stripe
const stripe = stripeConfig.getStripeInstance();

// Routes
app.use('/api/checkout', require('./routes/checkout'));
app.use('/api/subscription', require('./routes/subscription'));
app.use('/api/authorization', require('./routes/authorization'));
app.use('/api/webhook', require('./routes/webhook'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'Server is running', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n✅ Server is running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔑 Stripe API Key configured: ${process.env.STRIPE_SECRET_KEY ? '✓' : '✗'}`);
  console.log('');
});

module.exports = app;
