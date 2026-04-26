import { saveSession } from '../../../lib/sessions';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { userId, tool, title, data, sessionId } = req.body || {};
  try {
    const session = await saveSession({ userId, tool, title, data, sessionId });
    return res.status(200).json({ ok: true, session });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
