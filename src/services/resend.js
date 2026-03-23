import { Resend } from 'resend';
import dotenv from 'dotenv';
dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY || 're_123'); // fallback for init

export const sendWelcomeAndVerifyEmail = async (name, email, token) => {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not set. Skipping verification email.');
    return;
  }
  
  // URL to exactly match the backend express verify endpoint
  const verifyUrl = `http://localhost:3000/api/waitlist/verify?token=${token}`;

  try {
    const { data, error } = await resend.emails.send({
      from: 'MasterFuture <onboarding@resend.dev>', // Replace with your verified domain
      to: [email],
      subject: 'Welcome to the Waitlist! Please Verify Your Email ⭐',
      html: `
        <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
          <h2 style="color: #7c3aed;">Welcome to MasterFuture, ${name}! 🎉</h2>
          <p>Thank you for joining our exclusive early backer waiting list for the <strong>Futuristic Courses Launch</strong>.</p>
          <p>To securely confirm your spot and ensure you get your 21 free bonuses, please verify your email address by clicking the securely generated link below:</p>
          
          <div style="margin: 30px 0;">
            <a href="${verifyUrl}" style="background: linear-gradient(135deg,#7c3aed,#a78bfa); color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Verify My Email Address
            </a>
          </div>
          
          <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #555;"><a href="${verifyUrl}">${verifyUrl}</a></p>
          
          <p>We're thrilled to have you here and can't wait to help you build your future!</p>
          <br/>
          <p>Best regards,<br/><strong>The MasterFuture Team</strong></p>
        </div>
      `
    });
    if (error) {
      console.error('Resend error:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Error sending welcome email:', err);
    return false;
  }
};

export const sendPaymentSuccessEmail = async (name, email, orderId, amount) => {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not set. Skipping email send.');
    return;
  }
  try {
    const { data, error } = await resend.emails.send({
      from: 'MasterFuture <onboarding@resend.dev>', // Replace with your verified domain in production
      to: [email],
      subject: 'Payment Successful 🎉 - MasterFuture',
      html: `
        <h2>Payment Successful!</h2>
        <p>Hi ${name || 'there'},</p>
        <p>Thank you for supporting MasterFuture and backing our launch!</p>
        <p>Your payment of $${amount} has been securely processed.</p>
        <p><strong>Order ID:</strong> ${orderId}</p>
        <p>You can now access your exclusive bonuses and preparation materials.</p>
        <br/>
        <p>Best regards,<br/>The MasterFuture Team</p>
      `
    });
    if (error) {
      console.error('Resend error:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Error sending email:', err);
    return false;
  }
};
