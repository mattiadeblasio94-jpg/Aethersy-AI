import { getLog } from '../../../lib/wiki';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();
  const limit = parseInt(req.query.limit) || 50;
  const entries = await getLog(limit);
  res.json(entries);
}
