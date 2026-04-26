import { grantAccess, revokeAccess, getAllGrants } from '../../../lib/admin';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const grants = await getAllGrants();
      return res.status(200).json({ grants });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  if (req.method === 'POST') {
    const { telegramId, plan = 'pro', grantedBy = 'admin_web' } = req.body || {};
    if (!telegramId) return res.status(400).json({ error: 'telegramId richiesto' });
    try {
      const grant = await grantAccess(String(telegramId), plan, grantedBy);
      return res.status(200).json({ ok: true, grant });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  if (req.method === 'DELETE') {
    const { telegramId } = req.body || {};
    if (!telegramId) return res.status(400).json({ error: 'telegramId richiesto' });
    try {
      await revokeAccess(String(telegramId));
      return res.status(200).json({ ok: true });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  res.status(405).end();
}
