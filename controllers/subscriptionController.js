const { stripe } = require('../config/stripe');

/**
 * Create a new customer in Stripe
 * @param {Object} customerData - Customer information
 * @returns {Promise<Object>} Created customer
 */
const createCustomer = async (customerData) => {
  try {
    const customer = await stripe.customers.create({
      email: customerData.email,
      name: customerData.name,
      description: customerData.description || 'Free trial signup',
      metadata: {
        signup_date: new Date().toISOString(),
        source: 'free_trial',
      },
    });

    return {
      customerId: customer.id,
      email: customer.email,
      name: customer.name,
    };
  } catch (error) {
    console.error('Customer creation failed:', error.message);
    throw error;
  }
};

/**
 * Create a free trial subscription (without initial charge)
 * @param {string} customerId - Stripe customer ID
 * @param {string} priceId - Stripe price ID
 * @returns {Promise<Object>} Created subscription
 */
const createFreeTrialSubscription = async (customerId, priceId) => {
  try {
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [
        {
          price: priceId,
        },
      ],
      trial_period_days: 14, // 14-day free trial
      payment_settings: {
        save_default_payment_method: 'on_subscription',
      },
      metadata: {
        trial_type: 'free_trial_with_authorization',
        auth_hold_amount: _,
      },
    });

    return {
      subscriptionId: subscription.id,
      customerId: subscription.customer,
      status: subscription.status,
      trialStart: subscription.trial_start,
      trialEnd: subscription.trial_end,
    };
  } catch (error) {
    console.error('Subscription creation failed:', error.message);
    throw error;
  }
};

/**
 * Retrieve subscription details
 * @param {string} subscriptionId - Stripe subscription ID
 * @returns {Promise<Object>} Subscription details
 */
const getSubscriptionDetails = async (subscriptionId) => {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    return {
      subscriptionId: subscription.id,
      customerId: subscription.customer,
      status: subscription.status,
      trialEnd: subscription.trial_end,
      items: subscription.items.data.map(item => ({
        priceId: item.price.id,
        productId: item.price.product,
      })),
    };
  } catch (error) {
    console.error('Failed to retrieve subscription:', error.message);
    throw error;
  }
};

/**
 * Cancel subscription
 * @param {string} subscriptionId - Stripe subscription ID
 * @returns {Promise<Object>} Cancelled subscription
 */
const cancelSubscription = async (subscriptionId) => {
  try {
    const subscription = await stripe.subscriptions.del(subscriptionId);

    return {
      success: true,
      subscriptionId: subscription.id,
      status: subscription.status,
      cancelledAt: subscription.canceled_at,
    };
  } catch (error) {
    console.error('Subscription cancellation failed:', error.message);
    throw error;
  }
};

module.exports = {
  createCustomer,
  createFreeTrialSubscription,
  getSubscriptionDetails,
  cancelSubscription,
};
