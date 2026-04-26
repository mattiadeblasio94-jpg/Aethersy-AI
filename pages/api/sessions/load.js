import { loadSession } from '../../../lib/sessions';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();
  const { userId = 'anonymous', sessionId } = req.query;
  if (!sessionId) return res.status(400).json({ error: 'sessionId richiesto' });
  try {
    const session = await loadSession(userId, sessionId);
    if (!session) return res.status(404).json({ error: 'Sessione non trovata' });
    return res.status(200).json({ session });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
