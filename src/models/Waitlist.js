import mongoose from 'mongoose';

const waitlistSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String },
  email: { type: String, required: true, unique: true },
  courseInterest: { type: String },
  tierInterest: { type: String },
  domains: [{ type: String }],
  isVerified: { type: Boolean, default: false },
  verificationToken: { type: String },
  timestamp: { type: Date, default: Date.now }
});

export default mongoose.model('Waitlist', waitlistSchema);
