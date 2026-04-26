import { Redis } from '@upstash/redis';

function getRedis() {
  const url = (process.env.UPSTASH_REDIS_REST_URL || '').trim();
  const token = (process.env.UPSTASH_REDIS_REST_TOKEN || '').trim();
  return new Redis({ url, token });
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    // Get all config values
    const r = getRedis();

    const config = {
      stripe: {
        secretKey: await r.get('config:stripe:secretKey') || null,
        webhookSecret: await r.get('config:stripe:webhookSecret') || null,
        proMonthlyPriceId: await r.get('config:stripe:pro:monthly') || null,
        proAnnualPriceId: await r.get('config:stripe:pro:annual') || null,
        businessMonthlyPriceId: await r.get('config:stripe:business:monthly') || null,
        businessAnnualPriceId: await r.get('config:stripe:business:annual') || null,
      },
      telegram: {
        botToken: await r.get('config:telegram:botToken') || null,
        adminIds: await r.get('config:telegram:adminIds') || null,
        allowedChats: await r.get('config:telegram:allowedChats') || null,
      },
      replicate: {
        apiToken: await r.get('config:replicate:apiToken') || null,
      },
      ollama: {
        baseUrl: await r.get('config:ollama:baseUrl') || null,
      },
      anthropic: {
        apiKey: await r.get('config:anthropic:apiKey') || null,
      },
    };

    return res.status(200).json({ config });
  }

  if (req.method === 'POST') {
    // Save config values
    const { section, key, value } = req.body;
    const r = getRedis();

    try {
      await r.setex(`config:${section}:${key}`, 86400 * 365 * 10, value); // 10 years
      return res.status(200).json({ ok: true, section, key, value });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  if (req.method === 'DELETE') {
    // Delete config value
    const { section, key } = req.body;
    const r = getRedis();

    try {
      await r.del(`config:${section}:${key}`);
      return res.status(200).json({ ok: true });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  return res.status(405).end();
}
