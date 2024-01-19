const express = require('express');
const router = express.Router();
const authController = require('../controllers/authorizationController');

/**
 * POST /api/authorization/hold
 * Create $29 authorization hold on customer's card
 * Request body:
 * {
 *   "customerId": "cus_xxx",
 *   "paymentMethodId": "pm_xxx"
 * }
 */
router.post('/hold', async (req, res, next) => {
  try {
    const { customerId, paymentMethodId } = req.body;

    if (!customerId || !paymentMethodId) {
      return res.status(400).json({
        error: 'Missing required fields: customerId and paymentMethodId',
      });
    }

    const result = await authController.createAuthorizationHold(
      customerId,
      paymentMethodId
    );

    res.status(201).json({
      message: '$29 authorization hold created successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/authorization/release
 * Release the authorization hold (cancel PaymentIntent)
 * Request body:
 * {
 *   "paymentIntentId": "pi_xxx"
 * }
 */
router.post('/release', async (req, res, next) => {
  try {
    const { paymentIntentId } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({
        error: 'Missing required field: paymentIntentId',
      });
    }

    const result = await authController.releaseAuthorizationHold(paymentIntentId);

    res.status(200).json({
      message: 'Authorization hold released successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/authorization/capture
 * Capture the authorization hold (charge the customer)
 * Request body:
 * {
 *   "paymentIntentId": "pi_xxx"
 * }
 */
router.post('/capture', async (req, res, next) => {
  try {
    const { paymentIntentId } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({
        error: 'Missing required field: paymentIntentId',
      });
    }

    const result = await authController.captureAuthorizationHold(paymentIntentId);

    res.status(200).json({
      message: 'Authorization hold captured successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/authorization/status/:paymentIntentId
 * Check status of authorization hold
 */
router.get('/status/:paymentIntentId', async (req, res, next) => {
  try {
    const { paymentIntentId } = req.params;

    if (!paymentIntentId) {
      return res.status(400).json({
        error: 'Missing required parameter: paymentIntentId',
      });
    }

    const result = await authController.getAuthorizationStatus(paymentIntentId);

    res.status(200).json({
      message: 'Authorization status retrieved successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
