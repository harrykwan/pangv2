// const stripe = require('stripe')('sk_test_CRl2Sto6lG7ZEjnvDIfJxtZx00uRtS3tJx');
const stripe = require("stripe")(process.env.STRIPE_KEY);

/** get the transaction amount, currency expected to be hkd, and a callback function */
async function getclientsecret(amount, callback) {
  const paymentIntent = await stripe.paymentIntents.create({
    amount: amount,
    currency: "hkd",
    // Verify your integration in this guide by including this parameter
    metadata: {
      integration_check: "accept_a_payment",
    },
  });
  console.log(paymentIntent);
  callback(paymentIntent.client_secret);
}

exports.getclientsecret = getclientsecret;
