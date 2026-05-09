import { Redis } from '@upstash/redis';
import { getRegistrations, getTelegramUsers, getActiveTelegramUsers, getAnalyticsSummary, getRecentActivity } from '../../../lib/tracking';
import { sql } from '@vercel/postgres';
import { kv } from '@vercel/kv';

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
    // Prova a prendere dati da Vercel Postgres se disponibile
    let pgData = null;
    try {
      const { rows } = await sql`SELECT COUNT(*) as count FROM users`;
      pgData = { users: Number(rows[0]?.count) || 0 };
    } catch (e) {
      // Postgres non disponibile, usa Redis
    }

    if (type === 'registrations') {
      const data = await getRegistrations(parseInt(limit));
      return res.json({ registrations: data, postgres: pgData });
    }

    if (type === 'telegram') {
      const data = await getTelegramUsers(parseInt(limit));
      return res.json({ users: data, postgres: pgData });
    }

    if (type === 'active') {
      const data = await getActiveTelegramUsers();
      return res.json({ users: data, postgres: pgData });
    }

    if (type === 'summary') {
      const data = await getAnalyticsSummary();
      // Unisci dati Postgres se disponibili
      const summary = pgData ? { ...data, postgres_users: pgData.users } : data;
      return res.json({ summary });
    }

    if (type === 'activity') {
      const data = await getRecentActivity(parseInt(limit));
      return res.json({ activity: data, postgres: pgData });
    }

    // Default: return full summary
    const summary = await getAnalyticsSummary();
    const registrations = await getRegistrations(20);
    const telegramUsers = await getTelegramUsers(20);

    // Salva snapshot in KV per storico
    await kv.incr(`analytics:snapshot:${Date.now()}`);

    return res.json({
      summary: pgData ? { ...summary, postgres_users: pgData.users } : summary,
      registrations,
      telegramUsers,
      postgres: pgData,
    });

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
