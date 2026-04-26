import { deleteSession } from '../../../lib/sessions';

export default async function handler(req, res) {
  if (req.method !== 'DELETE') return res.status(405).end();
  const { userId = 'anonymous', sessionId } = req.body || {};
  if (!sessionId) return res.status(400).json({ error: 'sessionId richiesto' });
  try {
    await deleteSession(userId, sessionId);
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
