import mongoose from 'mongoose';

const requestSchema = new mongoose.Schema({
  user: String,
  userId: String,
  equipment: String,
  quantity: Number,
  reason: String,
  status: { type: String, default: 'Pending' }
}, { timestamps: true });

const Request = mongoose.models.Request || mongoose.model('Request', requestSchema);
export default Request;
