import dbConnect from '../../../lib/dbConnect';
import Request from '../../../models/Request';

export default async function handler(req, res) {
  await dbConnect();
  const { id } = req.query;

  if (req.method === 'PUT') {
    try {
      const { status } = req.body;
      await Request.findByIdAndUpdate(id, { status });
      return res.json({ msg: 'Status updated' });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ msg: 'Server error' });
    }
  }

  res.status(405).end();
}
