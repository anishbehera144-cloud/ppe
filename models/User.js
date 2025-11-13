import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: String,
  employee_id: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, default: 'employee' }
});

const User = mongoose.models.User || mongoose.model('User', userSchema);
export default User;
