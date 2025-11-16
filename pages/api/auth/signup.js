import dbConnect from '../../../lib/dbConnect';
import User from '../../../models/User';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  await dbConnect();

  try {
    const { username, employee_id, email, password } = req.body;
    if (!username || !employee_id || !email || !password) return res.status(400).json({ msg: 'Missing fields' });

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ msg: 'Email already exists' });

    const hash = await bcrypt.hash(password, 10);
    // treat Debashish's corporate email as store incharge
    const role = email.toLowerCase() === 'debashish.behera@rhimagnesita.com' ? 'store' : 'employee';
    const newUser = new User({ username, employee_id, email, password: hash, role });
    await newUser.save();
    res.json({ msg: 'Signup successful' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
}
