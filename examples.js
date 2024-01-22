/**
 * EXAMPLE: Stripe Authorization Hold Implementation
 * ===============================================
 * This file demonstrates how to use the API for the complete flow:
 * 1. Customer signup
 * 2. Create authorization hold
 * 3. Create free trial subscription
 * 4. Release authorization hold
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Example test data
const testData = {
  customer: {
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
  },
  // Get these from Stripe Dashboard > Developers > Test Cards
  paymentMethodId: 'pm_card_visa', // Replace with actual payment method
  priceId: 'price_1234567890', // Replace with your price ID
  
  // URLs for redirect after checkout
  successUrl: 'https://yourdomain.com/success',
  cancelUrl: 'https://yourdomain.com/cancel',
};

/**
 * FLOW 1: Complete Flow - Customer Signup with Auth Hold
 */
async function completeSignupFlow() {
  console.log('\n📋 === COMPLETE SIGNUP FLOW ===\n');

  try {
    console.log('Step 1: Creating customer with authorization hold and trial...');
    const response = await axios.post(
      `${BASE_URL}/subscription/create-with-auth-hold`,
      {
        name: testData.customer.name,
        email: testData.customer.email,
        paymentMethodId: testData.paymentMethodId,
        priceId: testData.priceId,
      }
    );

    const { customer, authorizationHold, subscription } = response.data.data;

    console.log('✅ SUCCESS!\n');
    console.log('Customer:', customer);
    console.log('\nAuthorization Hold:', authorizationHold);
    console.log('\nSubscription:', subscription);

    // Store these IDs for later use
    return {
      customerId: customer.customerId,
      paymentIntentId: authorizationHold.paymentIntentId,
      subscriptionId: subscription.subscriptionId,
    };
  } catch (error) {
    console.error('❌ ERROR:', error.response?.data || error.message);
  }
}

/**
 * FLOW 2: Checkout Session Flow (Stripe Checkout)
 */
async function checkoutSessionFlow() {
  console.log('\n🛒 === CHECKOUT SESSION FLOW ===\n');

  try {
    console.log('Step 1: Creating Stripe Checkout session...');
    const response = await axios.post(
      `${BASE_URL}/checkout/create-session`,
      {
        priceId: testData.priceId,
        customerEmail: testData.customer.email,
        successUrl: testData.successUrl,
        cancelUrl: testData.cancelUrl,
      }
    );

    const { sessionId, url } = response.data.data;

    console.log('✅ Session Created!\n');
    console.log('Session ID:', sessionId);
    console.log('Checkout URL:', url);
    console.log('\n👉 Direct customer to this URL to complete signup\n');

    return sessionId;
  } catch (error) {
    console.error('❌ ERROR:', error.response?.data || error.message);
  }
}

/**
 * FLOW 3: Release Authorization Hold
 */
async function releaseAuthorizationFlow(paymentIntentId) {
  console.log('\n🔓 === RELEASE AUTHORIZATION HOLD ===\n');

  try {
    console.log(`Step 1: Releasing authorization hold (${paymentIntentId})...`);
    const response = await axios.post(
      `${BASE_URL}/authorization/release`,
      {
        paymentIntentId: paymentIntentId,
      }
    );

    console.log('✅ SUCCESS!\n');
    console.log('Authorization hold released');
    console.log('Status:', response.data.data.status);

    return response.data.data;
  } catch (error) {
    console.error('❌ ERROR:', error.response?.data || error.message);
  }
}

/**
 * FLOW 4: Check Authorization Status
 */
async function checkAuthorizationStatus(paymentIntentId) {
  console.log('\n📊 === CHECK AUTHORIZATION STATUS ===\n');

  try {
    console.log(`Retrieving status for PaymentIntent: ${paymentIntentId}\n`);
    const response = await axios.get(
      `${BASE_URL}/authorization/status/${paymentIntentId}`
    );

    const { paymentIntentId: id, status, amount, currency } = response.data.data;

    console.log('✅ Status Retrieved:\n');
    console.log('Payment Intent ID:', id);
    console.log('Status:', status);
    console.log('Amount:', (amount / 100).toFixed(2), currency.toUpperCase());

    return response.data.data;
  } catch (error) {
    console.error('❌ ERROR:', error.response?.data || error.message);
  }
}

/**
 * FLOW 5: Get Subscription Details
 */
async function getSubscriptionDetails(subscriptionId) {
  console.log('\n📋 === GET SUBSCRIPTION DETAILS ===\n');

  try {
    console.log(`Retrieving subscription: ${subscriptionId}\n`);
    const response = await axios.get(
      `${BASE_URL}/subscription/details/${subscriptionId}`
    );

    console.log('✅ Subscription Retrieved:\n');
    console.log(response.data.data);

    return response.data.data;
  } catch (error) {
    console.error('❌ ERROR:', error.response?.data || error.message);
  }
}

/**
 * FLOW 6: Cancel Subscription
 */
async function cancelSubscription(subscriptionId) {
  console.log('\n🗑️  === CANCEL SUBSCRIPTION ===\n');

  try {
    console.log(`Cancelling subscription: ${subscriptionId}\n`);
    const response = await axios.delete(
      `${BASE_URL}/subscription/cancel/${subscriptionId}`
    );

    console.log('✅ Subscription Cancelled:\n');
    console.log(response.data.data);

    return response.data.data;
  } catch (error) {
    console.error('❌ ERROR:', error.response?.data || error.message);
  }
}

/**
 * Demo Runner
 */
async function runDemo() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  🎯 Stripe Authorization Hold - Complete Demo');
  console.log('═══════════════════════════════════════════════════════════');

  // Example 1: Complete flow
  console.log('\n💡 TIP: Make sure server is running: npm run dev');
  console.log('⚠️  Update testData.paymentMethodId and testData.priceId\n');

  try {
    // Step 1: Create customer with auth hold
    const ids = await completeSignupFlow();

    if (ids) {
      // Wait a bit between requests
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Step 2: Check authorization status
      await checkAuthorizationStatus(ids.paymentIntentId);

      await new Promise(resolve => setTimeout(resolve, 1000));

      // Step 3: Get subscription details
      await getSubscriptionDetails(ids.subscriptionId);

      await new Promise(resolve => setTimeout(resolve, 1000));

      // Step 4: Release authorization (for demo purposes)
      // In production, this should happen after verification
      // await releaseAuthorizationFlow(ids.paymentIntentId);

      console.log('\n✅ DEMO COMPLETE!');
      console.log('\n📝 Next Steps:');
      console.log('1. Monitor webhook events in Stripe Dashboard');
      console.log('2. Verify funds on customer card');
      console.log('3. At trial end, subscription auto-charges');
      console.log('4. Or manually cancel with /subscription/cancel/:id');
    }
  } catch (error) {
    console.error('Demo failed:', error.message);
  }
}

// Export for use in other files
module.exports = {
  completeSignupFlow,
  checkoutSessionFlow,
  releaseAuthorizationFlow,
  checkAuthorizationStatus,
  getSubscriptionDetails,
  cancelSubscription,
  runDemo,
};

// Run demo if executed directly
if (require.main === module) {
  runDemo().catch(console.error);
}
