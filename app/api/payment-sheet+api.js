import stripe from "../../stripe-server";

export async function POST(request, response) {
  const {amount} = await request.json();
  const customer = await stripe.customers.create();
  const ephemeralKey = await stripe.ephemeralKeys.create(
    {customer: customer.id},
    {apiVersion: "2024-12-18.acacia"}
  );
  const paymentIntent = await stripe.paymentIntents.create({
    amount: amount * 100,
    currency: 'usd',
    customer: customer.id,
  });

  console.log('paymentIntent',paymentIntent);
  return response.status(200).json({
    customer: customer.id,
    ephemeralKey: ephemeralKey.secret,
    paymentIntent: paymentIntent.client_secret,
  });
}
