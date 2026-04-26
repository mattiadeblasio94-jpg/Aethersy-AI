import { Redis } from '@upstash/redis';

function getRedis() {
  const url = (process.env.UPSTASH_REDIS_REST_URL || '').trim();
  const token = (process.env.UPSTASH_REDIS_REST_TOKEN || '').trim();
  return new Redis({ url, token });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const r = getRedis();

  // Initialize Stripe config
  await r.setex('config:stripe:secretKey', 86400 * 365 * 10, process.env.STRIPE_SECRET_KEY || '');
  await r.setex('config:stripe:webhookSecret', 86400 * 365 * 10, process.env.STRIPE_WEBHOOK_SECRET || '');
  await r.setex('config:stripe:pro:monthly', 86400 * 365 * 10, process.env.STRIPE_PRO_MONTHLY_PRICE_ID || '');
  await r.setex('config:stripe:pro:annual', 86400 * 365 * 10, process.env.STRIPE_PRO_ANNUAL_PRICE_ID || '');
  await r.setex('config:stripe:business:monthly', 86400 * 365 * 10, process.env.STRIPE_BUSINESS_MONTHLY_PRICE_ID || '');
  await r.setex('config:stripe:business:annual', 86400 * 365 * 10, process.env.STRIPE_BUSINESS_ANNUAL_PRICE_ID || '');

  // Initialize Telegram config
  await r.setex('config:telegram:botToken', 86400 * 365 * 10, process.env.TELEGRAM_BOT_TOKEN || '');
  await r.setex('config:telegram:adminIds', 86400 * 365 * 10, '8074643162');
  await r.setex('config:telegram:allowedChats', 86400 * 365 * 10, process.env.TELEGRAM_ALLOWED_CHATS || '');

  // Initialize Replicate config
  await r.setex('config:replicate:apiToken', 86400 * 365 * 10, process.env.REPLICATE_API_TOKEN || '');

  // Initialize Anthropic config
  await r.setex('config:anthropic:apiKey', 86400 * 365 * 10, process.env.ANTHROPIC_API_KEY || '');

  // Initialize Ollama config
  await r.setex('config:ollama:baseUrl', 86400 * 365 * 10, process.env.OLLAMA_BASE_URL || 'http://localhost:11434');

  return res.json({ ok: true, message: 'Configurazione inizializzata con dati reali' });
}
