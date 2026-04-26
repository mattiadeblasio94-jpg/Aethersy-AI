import { deletePage } from '../../../lib/wiki';

export default async function handler(req, res) {
  if (req.method !== 'DELETE') return res.status(405).end();
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'ID mancante' });
  try {
    await deletePage(id);
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
