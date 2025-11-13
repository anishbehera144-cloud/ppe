import dbConnect from '../../../lib/dbConnect';
import Request from '../../../models/Request';

export default async function handler(req, res) {
  await dbConnect();

  if (req.method === 'POST') {
    try {
      const { user, userId, equipment, quantity, reason } = req.body;
      const newReq = new Request({ user, userId, equipment, quantity, reason });
      await newReq.save();
      return res.json({ msg: 'Request submitted' });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ msg: 'Server error' });
    }
  }

  if (req.method === 'GET') {
    try {
      const data = await Request.find().sort({ createdAt: -1 });
      return res.json(data);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ msg: 'Server error' });
    }
  }

  res.status(405).end();
}
