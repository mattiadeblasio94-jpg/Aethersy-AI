import { research, deepResearch } from '../../lib/research';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { query, deep } = req.body || {};
  if (!query?.trim()) return res.status(400).json({ error: 'Query mancante' });
  try {
    const result = deep ? await deepResearch(query) : await research(query);
    return res.status(200).json(result);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
