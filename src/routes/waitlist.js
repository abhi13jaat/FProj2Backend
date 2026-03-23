import express from 'express';
import crypto from 'crypto';
import Waitlist from '../models/Waitlist.js';
import Order from '../models/Order.js';
import { appendToSheet } from '../services/googleSheets.js';
import { captureOrder } from '../services/paypal.js';
// import { sendWelcomeAndVerifyEmail } from '../services/resend.js';

const router = express.Router();

router.post('/capture', async (req, res) => {
  try {
    const { orderID, waitlistData } = req.body;
    const { firstName, lastName, email, courseInterest, tierInterest, domains } = waitlistData;

    if (!firstName || !email || !orderID) {
      return res.status(400).json({ success: false, message: 'Missing required fields.' });
    }

    // Capture payment
    const captureData = await captureOrder(orderID);

    if (captureData.status === 'COMPLETED') {
      const amount = captureData?.purchase_units?.[0]?.payments?.captures?.[0]?.amount?.value || 0;

      // Ensure no duplicate payment processing
      const existingOrder = await Order.findOne({ paymentId: captureData.id });
      if (existingOrder) {
         return res.status(400).json({ success: false, message: 'Order already processed.' });
      }

      // Save Order
      const newOrder = new Order({
        email,
        name: `${firstName} ${lastName || ''}`.trim(),
        amount: parseFloat(amount),
        paymentId: captureData.id,
        status: captureData.status,
        tier: tierInterest
      });
      await newOrder.save();

      // Save to Waitlist (verified directly since they paid)
      const existingUser = await Waitlist.findOne({ email });
      if (!existingUser) {
        const newEntry = new Waitlist({ 
          firstName, 
          lastName, 
          email, 
          courseInterest, 
          tierInterest, 
          domains,
          isVerified: true // Auto-verify since they paid
        });
        await newEntry.save();
      } else {
        // Upgrade existing user if they were just on waitlist
        existingUser.isVerified = true;
        existingUser.tierInterest = tierInterest || existingUser.tierInterest;
        await existingUser.save();
      }

      // Append to Google Sheets
      const name = `${firstName} ${lastName || ''}`.trim();
      const domainStr = Array.isArray(domains) ? domains.join(', ') : domains;
      const dateStr = new Date().toLocaleString();
      
      const sheetData = [
        dateStr,                               // Timestamp
        name,                                  // Full Name
        email,                                 // Email Address
        courseInterest || 'None specified',    // Chosen Course
        tierInterest || 'None specified',      // Targeted Tier
        domainStr || 'None selected',          // Interested Domains
        'Verified (Paid) ✅'                    // Verification Status
      ];

      // Execute sheet append in background
      appendToSheet(sheetData).catch(err => {
        console.error('Background Google Sheets append failed:', err);
      });

      res.status(200).json({ success: true, captureData });
    } else {
      res.status(400).json({ success: false, message: 'Payment not completed' });
    }
  } catch (error) {
    console.error('Waitlist capture error:', error);
    res.status(500).json({ success: false, message: 'Server error during capture.' });
  }
});

// GET /api/waitlist/verify?token=...
router.get('/verify', async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) {
      return res.status(400).send('<h3>Invalid request</h3>');
    }

    const user = await Waitlist.findOne({ verificationToken: token });
    if (!user) {
      return res.status(400).send('<h3>Invalid or expired verification token.</h3>');
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();

    // We can directly inform them via HTML output
    return res.send(`
      <div style="font-family: sans-serif; text-align: center; padding: 40px;">
        <h1 style="color: #34d399;">Verification Successful! 🎉</h1>
        <p>Your email <strong>${user.email}</strong> has been successfully verified.</p>
        <p>You are now officially on the MasterFuture waiting list!</p>
        <a href="http://localhost:5173" style="display:inline-block; margin-top:20px; padding:10px 20px; background:#7c3aed; color:#fff; text-decoration:none; border-radius:5px;">Return to Website</a>
      </div>
    `);
  } catch (err) {
    console.error('Verification error:', err);
    res.status(500).send('<h3>Server error during verification.</h3>');
  }
});

export default router;
