import express from 'express';
import { createOrder, captureOrder } from '../services/paypal.js';
// import { sendPaymentSuccessEmail } from '../services/resend.js';
import Order from '../models/Order.js';

const router = express.Router();


    // supporter: 29,
    // champion: 79,
    // founder: 149,
    // vip: 297,

const getPriceForTier = (tier) => {
  const prices = {
    supporter: 1,
    champion: 1,
    founder: 1,
    vip: 1,
  };
  return prices[tier] || 1;
};

router.post('/create-order', async (req, res) => {
  try {
    const { tier } = req.body;
    const price = getPriceForTier(tier);
    const orderData = await createOrder(price);
    res.json({ id: orderData.id });
  } catch (err) {
    console.error("PAYPAL ERROR:", err.message || err);
    res.status(500).json({ error: err.message || 'Failed to create order.' });
  }
});

router.post('/capture-order', async (req, res) => {
  try {
    const { orderID, email, name, tier } = req.body;

    // Check if order already captured
    const existingOrder = await Order.findOne({ paymentId: orderID });
    if (existingOrder) {
      return res.status(400).json({ error: 'Order already captured and processed.' });
    }

    const captureData = await captureOrder(orderID);

    if (captureData.status === 'COMPLETED') {
      const amount = captureData?.purchase_units?.[0]?.payments?.captures?.[0]?.amount?.value || 0;

      // Save to database
      const newOrder = new Order({
        email,
        name,
        amount: parseFloat(amount),
        paymentId: captureData.id,
        status: captureData.status,
        tier
      });
      await newOrder.save();

      // Send email
      // await sendPaymentSuccessEmail(name, email, captureData.id, amount);

      res.status(200).json(captureData);
    } else {
      res.status(400).json({ error: 'Order not completed' });
    }
  } catch (err) {
    console.error("PAYPAL ERROR:", err.message || err);
    res.status(500).json({ error: err.message || 'Failed to capture order.' });
  }
});

export default router;
