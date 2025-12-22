const express = require("express");
const router = express.Router();
const Stripe = require("stripe");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Create Payment Intent for in-app payment
router.post("/create-payment-intent", async (req, res) => {
  try {
    const {
      amount,
      customerName,
      customerPhone,
      carModel,
      distanceKm,
      durationMin,
      pickup,
      dropoff,
    } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    console.log("Creating payment intent for amount:", amount);

    // Create Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: "usd",
      metadata: {
        customerName,
        customerPhone,
        carModel,
        distanceKm: String(distanceKm),
        durationMin: String(durationMin),
        pickup: JSON.stringify(pickup),
        dropoff: JSON.stringify(dropoff),
      },
      description: `Chauffeur Booking - ${carModel}`,
    });

    console.log("Payment intent created:", {
      id: paymentIntent.id,
      amount: paymentIntent.amount,
      status: paymentIntent.status,
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error("Payment intent creation error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Verify payment status (optional - for confirmation)
router.get("/verify-payment-intent/:paymentIntentId", async (req, res) => {
  try {
    const { paymentIntentId } = req.params;

    console.log("Verifying payment intent:", paymentIntentId);

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    res.json({
      status: paymentIntent.status,
      amount: paymentIntent.amount / 100,
      metadata: paymentIntent.metadata,
    });
  } catch (error) {
    console.error("Payment intent verification error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Stripe webhook endpoint for payment events
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    switch (event.type) {
      case "payment_intent.succeeded":
        const paymentIntent = event.data.object;
        console.log("Payment succeeded:", paymentIntent.id);
        // Save booking to DB here if needed
        // You can access booking details from paymentIntent.metadata
        break;
      case "payment_intent.payment_failed":
        const failedPayment = event.data.object;
        console.log("Payment failed:", failedPayment.id);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  }
);

module.exports = router;
