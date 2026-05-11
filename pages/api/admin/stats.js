import { getStats, getAllGrants } from '../../../lib/admin';
import { getAllLeads } from '../../../lib/leads';
import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();
  try {
    const [stats, leads, grants] = await Promise.all([
      getStats(),
      getAllLeads().catch(() => []),
      getAllGrants().catch(() => []),
    ]);

    // Get active sessions from Redis (users active in last 5 min)
    let activeSessions = 0;
    let totalUsers = 0;
    let totalApiCalls = 0;
    let mrr = 0;

    try {
      // Count unique users who were active in last 5 minutes
      const activeKeys = await kv.keys('session:*');
      activeSessions = activeKeys.length;

      // Total registered users
      const userKeys = await kv.keys('user:*');
      totalUsers = userKeys.length;

      // Total API calls today
      const day = new Date().toISOString().slice(0, 10);
      const apiCallsToday = await kv.get(`usage:${day}:api`) || 0;
      const researchToday = await kv.get(`usage:${day}:research`) || 0;
      const chatToday = await kv.get(`usage:${day}:chat`) || 0;
      totalApiCalls = Number(apiCallsToday) + Number(researchToday) + Number(chatToday);

      // MRR calculation from grants (Pro = $29, Business = $99)
      mrr = grants.reduce((sum, g) => {
        if (!g.active) return sum;
        if (g.plan === 'pro') return sum + 29;
        if (g.plan === 'business') return sum + 99;
        if (g.plan === 'enterprise') return sum + 299;
        return sum;
      }, 0);
    } catch (e) {
      console.error('Redis stats error:', e.message);
    }

    return res.status(200).json({
      stats: {
        ...stats,
        activeSessions,
        totalUsers,
        totalApiCalls,
        mrr,
        grantsCount: grants.length,
      },
      leadsCount: leads.length,
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
