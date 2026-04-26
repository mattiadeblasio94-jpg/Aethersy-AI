import { getAllPages, searchPages } from '../../../lib/wiki';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();
  const { q } = req.query;
  try {
    const pages = q?.trim() ? await searchPages(q) : await getAllPages();
    return res.status(200).json(pages);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
