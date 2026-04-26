import { getStats } from '../../../lib/admin';
import { getAllLeads } from '../../../lib/leads';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();
  try {
    const [stats, leads] = await Promise.all([
      getStats(),
      getAllLeads().catch(() => []),
    ]);
    return res.status(200).json({ stats, leadsCount: leads.length });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
