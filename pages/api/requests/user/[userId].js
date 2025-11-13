import dbConnect from '../../../../lib/dbConnect';
import Request from '../../../../models/Request';

export default async function handler(req, res) {
  await dbConnect();
  const { userId } = req.query;

  if (req.method === 'GET') {
    try {
      const data = await Request.find({ userId });
      return res.json(data);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ msg: 'Server error' });
    }
  }

  res.status(405).end();
}
