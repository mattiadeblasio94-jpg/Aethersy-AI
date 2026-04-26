import { Redis } from '@upstash/redis';
import { getRegistrations, getTelegramUsers, getActiveTelegramUsers, getAnalyticsSummary, getRecentActivity } from '../../../lib/tracking';

function getRedis() {
  const url = (process.env.UPSTASH_REDIS_REST_URL || '').trim();
  const token = (process.env.UPSTASH_REDIS_REST_TOKEN || '').trim();
  return new Redis({ url, token });
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const { type, limit = 50 } = req.query;
  const r = getRedis();

  try {
    if (type === 'registrations') {
      const data = await getRegistrations(parseInt(limit));
      return res.json({ registrations: data });
    }

    if (type === 'telegram') {
      const data = await getTelegramUsers(parseInt(limit));
      return res.json({ users: data });
    }

    if (type === 'active') {
      const data = await getActiveTelegramUsers();
      return res.json({ users: data });
    }

    if (type === 'summary') {
      const data = await getAnalyticsSummary();
      return res.json({ summary: data });
    }

    if (type === 'activity') {
      const data = await getRecentActivity(parseInt(limit));
      return res.json({ activity: data });
    }

    // Default: return full summary
    const summary = await getAnalyticsSummary();
    const registrations = await getRegistrations(20);
    const telegramUsers = await getTelegramUsers(20);

    return res.json({
      summary,
      registrations,
      telegramUsers,
    });

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
