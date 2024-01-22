const { stripe } = require('../config/stripe');

/**
 * Create a $_ authorization hold without capturing funds
 * Uses PaymentIntent with capture_method: 'manual' to hold funds without charging
 * @param {string} customerId - Stripe customer ID
 * @param {string} paymentMethodId - Stripe payment method ID
 * @returns {Promise<Object>} PaymentIntent object
 */
const createAuthorizationHold = async (customerId, paymentMethodId) => {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 2900, // $_.00 in cents
      currency: 'usd',
      customer: customerId,
      payment_method: paymentMethodId,
      confirm: true, // Confirm the intent immediately
      off_session: true, // Payment happens off the current session
      capture_method: 'manual', // Hold the funds without capturing
      statement_descriptor: 'TRIAL VERIFICATION',
      metadata: {
        type: 'free_trial_authorization',
        timestamp: new Date().toISOString(),
      },
      return_url: process.env.RETURN_URL || 'https://example.com/return',
    });

    return {
      success: true,
      paymentIntentId: paymentIntent.id,
      status: paymentIntent.status,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      clientSecret: paymentIntent.client_secret,
    };
  } catch (error) {
    console.error('Authorization hold creation failed:', error.message);
    throw error;
  }
};

/**
 * Release the authorization hold (cancel the PaymentIntent)
 * @param {string} paymentIntentId - Stripe PaymentIntent ID
 * @returns {Promise<Object>} Cancelled PaymentIntent
 */
const releaseAuthorizationHold = async (paymentIntentId) => {
  try {
    const cancelledIntent = await stripe.paymentIntents.cancel(paymentIntentId);

    return {
      success: true,
      paymentIntentId: cancelledIntent.id,
      status: cancelledIntent.status,
      message: 'Authorization hold released successfully',
    };
  } catch (error) {
    console.error('Authorization hold release failed:', error.message);
    throw error;
  }
};

/**
 * Capture the authorization hold (charge the customer)
 * Only use this if customer doesn't complete trial period or needs to be charged
 * @param {string} paymentIntentId - Stripe PaymentIntent ID
 * @returns {Promise<Object>} Confirmed PaymentIntent
 */
const captureAuthorizationHold = async (paymentIntentId) => {
  try {
    const capturedIntent = await stripe.paymentIntents.confirm(paymentIntentId, {
      // capture_method is already set to 'manual' from creation
    });

    return {
      success: true,
      paymentIntentId: capturedIntent.id,
      status: capturedIntent.status,
      amount: capturedIntent.amount,
      message: 'Authorization hold captured successfully',
    };
  } catch (error) {
    console.error('Authorization hold capture failed:', error.message);
    throw error;
  }
};

/**
 * Verify authorization hold status
 * @param {string} paymentIntentId - Stripe PaymentIntent ID
 * @returns {Promise<Object>} Payment Intent details
 */
const getAuthorizationStatus = async (paymentIntentId) => {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    return {
      paymentIntentId: paymentIntent.id,
      status: paymentIntent.status,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      customer: paymentIntent.customer,
      paymentMethod: paymentIntent.payment_method,
      metadata: paymentIntent.metadata,
    };
  } catch (error) {
    console.error('Failed to retrieve authorization status:', error.message);
    throw error;
  }
};

module.exports = {
  createAuthorizationHold,
  releaseAuthorizationHold,
  captureAuthorizationHold,
  getAuthorizationStatus,
};
