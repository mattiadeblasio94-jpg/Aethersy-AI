import { Redis } from '@upstash/redis';

function getRedis() {
  const url = (process.env.UPSTASH_REDIS_REST_URL || '').trim();
  const token = (process.env.UPSTASH_REDIS_REST_TOKEN || '').trim();
  return new Redis({ url, token });
}

async function getAccessRequest(telegramId) {
  const r = getRedis();
  const raw = await r.get(`access:request:${telegramId}`);
  return raw ? JSON.parse(raw) : null;
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const r = getRedis();
      const pending = await r.smembers('access:pending') || [];
      const requests = [];
      for (const tid of pending) {
        const req = await getAccessRequest(tid);
        if (req) requests.push(req);
      }
      return res.status(200).json({ requests });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  if (req.method === 'POST') {
    const { action, telegramId, email, name } = req.body || {};
    const r = getRedis();

    try {
      if (action === 'approve') {
        // Import grantAccess from lib/admin
        const { grantAccess } = await import('../../../lib/admin');
        await grantAccess(String(telegramId), 'pro', 'admin_web');
        await r.del(`access:request:${telegramId}`);
        await r.srem('access:pending', telegramId);

        // Salva come lead convertito
        await r.setex(`lead:telegram:${telegramId}`, 86400 * 30, JSON.stringify({
          email, name, telegramId, convertedAt: Date.now(), plan: 'pro'
        }));

        return res.status(200).json({ ok: true, message: 'Accesso approvato' });
      }

      if (action === 'reject') {
        await r.del(`access:request:${telegramId}`);
        await r.srem('access:pending', telegramId);
        return res.status(200).json({ ok: true, message: 'Richiesta rifiutata' });
      }

      return res.status(400).json({ error: 'Azione non valida' });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  res.status(405).end();
}
