const express = require('express');
const router = express.Router();
const { stripe } = require('../config/stripe');

/**
 * POST /api/checkout/create-session
 * Create a Stripe Checkout session for free trial signup with authorization hold
 * Request body:
 * {
 *   "priceId": "price_xxx",
 *   "customerEmail": "customer@example.com",
 *   "successUrl": "https://example.com/success",
 *   "cancelUrl": "https://example.com/cancel"
 * }
 */
router.post('/create-session', async (req, res, next) => {
  try {
    const { priceId, customerEmail, successUrl, cancelUrl } = req.body;

    if (!priceId || !customerEmail || !successUrl || !cancelUrl) {
      return res.status(400).json({
        error: 'Missing required fields: priceId, customerEmail, successUrl, cancelUrl',
      });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      customer_email: customerEmail,
      success_url: successUrl,
      cancel_url: cancelUrl,
      subscription_data: {
        trial_period_days: 14, // 14-day free trial
        description: 'Free trial with $_ authorization hold verification',
        metadata: {
          auth_hold_amount: 2900,
          type: 'free_trial',
        },
      },
      metadata: {
        auth_hold_amount: 2900,
        type: 'free_trial_signup',
      },
    });

    res.status(201).json({
      message: 'Checkout session created successfully',
      data: {
        sessionId: session.id,
        url: session.url,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/checkout/session/:sessionId
 * Retrieve checkout session details
 */
router.get('/session/:sessionId', async (req, res, next) => {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      return res.status(400).json({
        error: 'Missing required parameter: sessionId',
      });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    res.status(200).json({
      message: 'Checkout session retrieved successfully',
      data: {
        sessionId: session.id,
        status: session.status || 'open',
        customerId: session.customer,
        subscriptionId: session.subscription,
        totalDetails: session.total_details,
        paymentStatus: session.payment_status,
        amountTotal: session.amount_total,
        currency: session.currency,
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
