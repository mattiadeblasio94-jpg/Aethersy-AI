import { verifyToken } from '../../../lib/auth';
import { Redis } from '@upstash/redis';

function getRedis() {
  const url = (process.env.UPSTASH_REDIS_REST_URL || '').trim();
  const token = (process.env.UPSTASH_REDIS_REST_TOKEN || '').trim();
  return new Redis({ url, token });
}

export default async function handler(req, res) {
  const auth = req.headers.authorization?.replace('Bearer ', '');
  const decoded = auth ? verifyToken(auth) : null;
  if (!decoded) return res.status(401).json({ error: 'Non autenticato' });

  const r = getRedis();

  if (req.method === 'GET') {
    const ids = await r.lrange(`brain:files:${decoded.email}`, 0, -1);
    const files = await Promise.all(ids.map(async id => {
      const raw = await r.get(`brain:${decoded.email}:${id}`);
      if (!raw) return null;
      const f = typeof raw === 'string' ? JSON.parse(raw) : raw;
      return { id: f.id, filename: f.filename, mimeType: f.mimeType, size: f.size, uploadedAt: f.uploadedAt };
    }));
    return res.status(200).json({ files: files.filter(Boolean) });
  }

  if (req.method === 'DELETE') {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'id richiesto' });
    await r.del(`brain:${decoded.email}:${id}`);
    await r.lrem(`brain:files:${decoded.email}`, 0, id);
    return res.status(200).json({ ok: true });
  }

  // GET with content (for AI context)
  if (req.method === 'POST' && req.query.action === 'read') {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'id richiesto' });
    const raw = await r.get(`brain:${decoded.email}:${id}`);
    if (!raw) return res.status(404).json({ error: 'File non trovato' });
    const f = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return res.status(200).json({ file: f });
  }

  return res.status(405).end();
}
