import { Redis } from '@upstash/redis';

function getRedis() {
  return new Redis({
    url: (process.env.UPSTASH_REDIS_REST_URL || '').trim(),
    token: (process.env.UPSTASH_REDIS_REST_TOKEN || '').trim(),
  });
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const r = getRedis();
      const limit = Math.min(parseInt(req.query.limit) || 100, 200);
      const raw = await r.lrange('wiki:files', 0, limit - 1);
      const files = raw.map(item => {
        try { return typeof item === 'string' ? JSON.parse(item) : item; } catch { return null; }
      }).filter(Boolean);
      return res.json({ files });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  if (req.method === 'DELETE') {
    // Remove a specific file record by id (doesn't delete from blob storage)
    const { id } = req.body || {};
    if (!id) return res.status(400).json({ error: 'id required' });
    try {
      const r = getRedis();
      const raw = await r.lrange('wiki:files', 0, 199);
      const files = raw.map(item => {
        try { return typeof item === 'string' ? JSON.parse(item) : item; } catch { return null; }
      }).filter(Boolean);
      const updated = files.filter(f => f.id !== id);
      await r.del('wiki:files');
      if (updated.length > 0) {
        await r.rpush('wiki:files', ...updated.map(f => JSON.stringify(f)));
      }
      return res.json({ ok: true });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  res.status(405).end();
}
