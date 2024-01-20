const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');
const authController = require('../controllers/authorizationController');

/**
 * POST /api/subscription/create-with-auth-hold
 * Complete flow: Create customer + set up authorization hold + create free trial subscription
 * Request body:
 * {
 *   "name": "John Doe",
 *   "email": "john@example.com",
 *   "paymentMethodId": "pm_xxx",
 *   "priceId": "price_xxx"
 * }
 */
router.post('/create-with-auth-hold', async (req, res, next) => {
  try {
    const { name, email, paymentMethodId, priceId } = req.body;

    if (!name || !email || !paymentMethodId || !priceId) {
      return res.status(400).json({
        error: 'Missing required fields: name, email, paymentMethodId, priceId',
      });
    }

    // Step 1: Create customer
    const customer = await subscriptionController.createCustomer({
      name,
      email,
      description: `Free trial signup - ${new Date().toISOString()}`,
    });

    // Step 2: Create authorization hold
    const authHold = await authController.createAuthorizationHold(
      customer.customerId,
      paymentMethodId
    );

    // Step 3: Create free trial subscription
    const subscription = await subscriptionController.createFreeTrialSubscription(
      customer.customerId,
      priceId
    );

    res.status(201).json({
      message: 'Customer created with authorization hold and trial subscription',
      data: {
        customer: {
          customerId: customer.customerId,
          email: customer.email,
          name: customer.name,
        },
        authorizationHold: {
          paymentIntentId: authHold.paymentIntentId,
          status: authHold.status,
          amount: authHold.amount,
        },
        subscription: {
          subscriptionId: subscription.subscriptionId,
          status: subscription.status,
          trialEnd: subscription.trialEnd,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/subscription/create-customer
 * Create a new customer
 * Request body:
 * {
 *   "name": "John Doe",
 *   "email": "john@example.com",
 *   "description": "Optional description"
 * }
 */
router.post('/create-customer', async (req, res, next) => {
  try {
    const { name, email, description } = req.body;

    if (!name || !email) {
      return res.status(400).json({
        error: 'Missing required fields: name, email',
      });
    }

    const customer = await subscriptionController.createCustomer({
      name,
      email,
      description,
    });

    res.status(201).json({
      message: 'Customer created successfully',
      data: customer,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/subscription/create-trial
 * Create free trial subscription for existing customer
 * Request body:
 * {
 *   "customerId": "cus_xxx",
 *   "priceId": "price_xxx"
 * }
 */
router.post('/create-trial', async (req, res, next) => {
  try {
    const { customerId, priceId } = req.body;

    if (!customerId || !priceId) {
      return res.status(400).json({
        error: 'Missing required fields: customerId, priceId',
      });
    }

    const subscription = await subscriptionController.createFreeTrialSubscription(
      customerId,
      priceId
    );

    res.status(201).json({
      message: 'Free trial subscription created successfully',
      data: subscription,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/subscription/details/:subscriptionId
 * Get subscription details
 */
router.get('/details/:subscriptionId', async (req, res, next) => {
  try {
    const { subscriptionId } = req.params;

    if (!subscriptionId) {
      return res.status(400).json({
        error: 'Missing required parameter: subscriptionId',
      });
    }

    const subscription = await subscriptionController.getSubscriptionDetails(
      subscriptionId
    );

    res.status(200).json({
      message: 'Subscription details retrieved successfully',
      data: subscription,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/subscription/cancel/:subscriptionId
 * Cancel a subscription
 */
router.delete('/cancel/:subscriptionId', async (req, res, next) => {
  try {
    const { subscriptionId } = req.params;

    if (!subscriptionId) {
      return res.status(400).json({
        error: 'Missing required parameter: subscriptionId',
      });
    }

    const result = await subscriptionController.cancelSubscription(subscriptionId);

    res.status(200).json({
      message: 'Subscription cancelled successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
