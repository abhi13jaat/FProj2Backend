import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  email: { type: String, required: true },
  name: { type: String },
  amount: { type: Number, required: true },
  paymentId: { type: String, required: true, unique: true },
  tier: { type: String },
  status: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

export default mongoose.model('Order', orderSchema);
