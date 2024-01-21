const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const { stripe } = require('../config/stripe');
const authController = require('../controllers/authorizationController');

// Webhook endpoint uses raw body, not JSON
router.post(
  '/stripe',
  bodyParser.raw({ type: 'application/json' }),
  async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
      // Handle different event types
      switch (event.type) {
        case 'payment_intent.succeeded':
          await handlePaymentIntentSucceeded(event.data.object);
          break;

        case 'payment_intent.payment_failed':
          await handlePaymentIntentFailed(event.data.object);
          break;

        case 'payment_intent.canceled':
          await handlePaymentIntentCanceled(event.data.object);
          break;

        case 'customer.subscription.created':
          await handleSubscriptionCreated(event.data.object);
          break;

        case 'customer.subscription.updated':
          await handleSubscriptionUpdated(event.data.object);
          break;

        case 'customer.subscription.deleted':
          await handleSubscriptionDeleted(event.data.object);
          break;

        case 'customer.subscription.trial_will_end':
          await handleTrialWillEnd(event.data.object);
          break;

        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      // Acknowledge receipt of event
      res.json({ received: true });
    } catch (error) {
      console.error(`Webhook handler error: ${error.message}`);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  }
);

/**
 * Handle successful payment intent
 * This would be when authorization hold is confirmed
 */
async function handlePaymentIntentSucceeded(paymentIntent) {
  console.log('[✓] Payment Intent Succeeded:', paymentIntent.id);
  console.log('   Amount:', paymentIntent.amount / 100, paymentIntent.currency.toUpperCase());
  console.log('   Customer:', paymentIntent.customer);
  console.log('   Status:', paymentIntent.status);

  // Store the successful authorization in your database
  // Add logic to track successful auth hold for your analytics
}

/**
 * Handle failed payment intent
 */
async function handlePaymentIntentFailed(paymentIntent) {
  console.log('[✗] Payment Intent Failed:', paymentIntent.id);
  console.log('   Error:', paymentIntent.last_payment_error?.message);
  console.log('   Customer:', paymentIntent.customer);

  // Notify customer of failed authorization
  // Cancel related subscription if necessary
}

/**
 * Handle cancelled payment intent
 * This is when authorization hold is released
 */
async function handlePaymentIntentCanceled(paymentIntent) {
  console.log('[⊘] Payment Intent Cancelled:', paymentIntent.id);
  console.log('   Amount:', paymentIntent.amount / 100, paymentIntent.currency.toUpperCase());
  console.log('   Customer:', paymentIntent.customer);

  // Log authorization hold release
  // Update customer status in your database
}

/**
 * Handle subscription created
 */
async function handleSubscriptionCreated(subscription) {
  console.log('[✓] Subscription Created:', subscription.id);
  console.log('   Customer:', subscription.customer);
  console.log('   Trial Start:', new Date(subscription.trial_start * 1000).toISOString());
  console.log('   Trial End:', new Date(subscription.trial_end * 1000).toISOString());
  console.log('   Items:', subscription.items.data.length);

  // Store subscription in database
  // Send welcome email to customer
}

/**
 * Handle subscription updated
 */
async function handleSubscriptionUpdated(subscription) {
  console.log('[⟳] Subscription Updated:', subscription.id);
  console.log('   Status:', subscription.status);
  console.log('   Current Period End:', new Date(subscription.current_period_end * 1000).toISOString());

  // Update subscription status in database
}

/**
 * Handle subscription deleted
 */
async function handleSubscriptionDeleted(subscription) {
  console.log('[✗] Subscription Deleted:', subscription.id);
  console.log('   Customer:', subscription.customer);

  // Mark subscription as cancelled in database
  // Clean up related data
}

/**
 * Handle trial will end (usually 3 days before)
 */
async function handleTrialWillEnd(subscription) {
  console.log('[⚠] Trial Will End Soon:', subscription.id);
  console.log('   Trial End:', new Date(subscription.trial_end * 1000).toISOString());
  console.log('   Customer:', subscription.customer);

  // Send email reminder about trial ending
  // If authorization hold exists, it will be captured at end of trial
}

module.exports = router;
