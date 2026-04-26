export default async function handler(req, res) {
  const url = (process.env.UPSTASH_REDIS_REST_URL || '').trim();
  const token = (process.env.UPSTASH_REDIS_REST_TOKEN || '').trim();

  let redisOk = false;
  let redisError = null;

  try {
    const { Redis } = await import('@upstash/redis');
    const r = new Redis({ url, token });
    await r.set('debug:ping', '1', { ex: 10 });
    const val = await r.get('debug:ping');
    redisOk = val === '1';
  } catch (e) {
    redisError = e.message;
  }

  res.json({
    redis: { ok: redisOk, error: redisError, urlSet: url.startsWith('http'), urlPrefix: url.slice(0, 30) },
    env: {
      TELEGRAM_BOT_TOKEN: !!process.env.TELEGRAM_BOT_TOKEN,
      ANTHROPIC_API_KEY: !!process.env.ANTHROPIC_API_KEY,
      TAVILY_API_KEY: !!process.env.TAVILY_API_KEY,
      SERPER_API_KEY: !!process.env.SERPER_API_KEY,
      UPSTASH_REDIS_REST_URL: !!url,
      UPSTASH_REDIS_REST_TOKEN: !!token,
    }
  });
}
