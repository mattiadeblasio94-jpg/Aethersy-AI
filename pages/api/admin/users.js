import { Redis } from '@upstash/redis';
import { getGrant, getAllGrants } from '../../../lib/admin';

function getRedis() {
  const url = (process.env.UPSTASH_REDIS_REST_URL || '').trim();
  const token = (process.env.UPSTASH_REDIS_REST_TOKEN || '').trim();
  return new Redis({ url, token });
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const { id, q } = req.query;
  const r = getRedis();

  try {
    // Search query
    if (q) {
      const query = q.toLowerCase();
      const allUsers = [];

      // Scan for all users
      let cursor = 0;
      do {
        const result = await r.scan(cursor, { match: 'user:*', count: 100 });
        cursor = result.cursor;
        for (const key of result.keys) {
          const user = await r.get(key);
          if (user) {
            const u = typeof user === 'string' ? JSON.parse(user) : user;
            // Check if matches search
            if (u.email?.toLowerCase().includes(query) ||
                u.name?.toLowerCase().includes(query) ||
                key.includes(query)) {
              allUsers.push(u);
            }
          }
        }
      } while (cursor !== 0);

      return res.status(200).json({ users: allUsers.slice(0, 50) });
    }

    // Specific ID lookup
    if (id) {
      // Cerca grant per questo Telegram ID
      const grant = await getGrant(id);

      if (grant) {
        return res.status(200).json({
          found: true,
          user: {
            telegramId: id,
            name: grant.name || 'Utente Telegram',
            plan: grant.plan,
            grantedAt: grant.grantedAt,
            grantedBy: grant.grantedBy,
          }
        });
      }

      // Cerca nei lead Telegram
      const leadRaw = await r.get(`lead:telegram:${id}`);
      if (leadRaw) {
        const lead = typeof leadRaw === 'string' ? JSON.parse(leadRaw) : leadRaw;
        return res.status(200).json({
          found: true,
          user: {
            telegramId: id,
            name: lead.name || 'Utente Telegram',
            email: lead.email,
            plan: lead.plan || 'free',
            convertedAt: lead.convertedAt,
          }
        });
      }

      // Cerca nelle richieste pendenti
      const requestRaw = await r.get(`access:request:${id}`);
      if (requestRaw) {
        const request = typeof requestRaw === 'string' ? JSON.parse(requestRaw) : requestRaw;
        return res.status(200).json({
          found: true,
          user: {
            telegramId: id,
            name: request.name || 'Utente Telegram',
            email: request.email,
            plan: 'pending',
            requestedAt: request.createdAt,
          }
        });
      }

      return res.status(404).json({ found: false, message: 'Utente non trovato' });
    }

    // List all users
    const allUsers = [];
    let cursor = 0;
    do {
      const result = await r.scan(cursor, { match: 'user:*', count: 100 });
      cursor = result.cursor;
      for (const key of result.keys) {
        const user = await r.get(key);
        if (user) {
          const u = typeof user === 'string' ? JSON.parse(user) : user;
          allUsers.push(u);
        }
      }
    } while (cursor !== 0);

    return res.status(200).json({ users: allUsers });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
