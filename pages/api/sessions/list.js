import { getUserSessions } from '../../../lib/sessions';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();
  const userId = req.query.userId || 'anonymous';
  try {
    const sessions = await getUserSessions(userId);
    return res.status(200).json({ sessions });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
