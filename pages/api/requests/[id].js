import dbConnect from '../../../lib/dbConnect';
import Request from '../../../models/Request';

export default async function handler(req, res) {
  await dbConnect();
  const { id } = req.query;

  if (req.method === 'PUT') {
    try {
      const { status } = req.body;
      // prevent changing status if already final
      const doc = await Request.findById(id);
      if (!doc) return res.status(404).json({ msg: 'Request not found' });
      const finalStates = ['Issued', 'Rejected'];
      if (finalStates.includes(doc.status)) {
        return res.status(400).json({ msg: `Cannot change status once it's '${doc.status}'` });
      }
      // allow update to statuses (including Issued or Rejected)
      doc.status = status;
      await doc.save();
      return res.json({ msg: 'Status updated' });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ msg: 'Server error' });
    }
  }

  res.status(405).end();
}
