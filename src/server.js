import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import waitlistRoutes from './routes/waitlist.js';
import paymentRoutes from './routes/payments.js';

dotenv.config();

const app = express();

// Production grade security headers
app.use(helmet());
app.use(cors({
  origin: ["http://localhost:5173", "https://your-frontend.vercel.app", process.env.FRONTEND_URL].filter(Boolean),
  credentials: true
})); // Apply CORS globally before rate-limits intercept

// Rate limiting against spam
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per 15 mins
  message: { error: 'Too many requests from this IP, please try again after 15 minutes' }
});

app.use('/api', apiLimiter);
app.use(express.json());

// Routes
app.use('/api/waitlist', waitlistRoutes);
app.use('/api/payments', paymentRoutes);

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error occurred.' });
});

const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/masterfuture')
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
  });
