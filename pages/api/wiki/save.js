import { savePage } from '../../../lib/wiki';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const page = req.body;
  if (!page?.title?.trim()) return res.status(400).json({ error: 'Titolo obbligatorio' });
  try {
    const saved = await savePage(page);
    return res.status(200).json(saved);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
