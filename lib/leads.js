import { Redis } from '@upstash/redis';

let redis;
function getRedis() {
  if (!redis) {
    const url = (process.env.UPSTASH_REDIS_REST_URL || '').trim();
    const token = (process.env.UPSTASH_REDIS_REST_TOKEN || '').trim();
    if (!url.startsWith('http')) throw new Error('Redis non configurato');
    redis = new Redis({ url, token });
  }
  return redis;
}

export async function captureLead({ name, email, phone, source = 'web', telegramId = null, plan = 'free' }) {
  const r = getRedis();
  const id = `lead_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const lead = {
    id, name, email: email.toLowerCase(), phone: phone || '',
    source, telegramId, plan,
    createdAt: Date.now(), contacted: false, converted: false,
  };
  await r.hset('leads:all', { [id]: JSON.stringify(lead) });
  await r.lpush('leads:recent', id);
  await r.ltrim('leads:recent', 0, 499);

  // Notify admin on Telegram
  try {
    const adminIds = (process.env.TELEGRAM_ADMIN_IDS || process.env.TELEGRAM_ALLOWED_CHATS || '').split(',').map(s => s.trim()).filter(Boolean);
    for (const adminId of adminIds.slice(0, 2)) {
      if (/^\d+$/.test(adminId)) {
        await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: adminId,
            text: `🎯 NUOVO LEAD!\n\nNome: ${name}\nEmail: ${email}\nTelefono: ${phone || 'N/A'}\nFonte: ${source}\nID: ${id}`,
          }),
        });
      }
    }
  } catch {}

  return lead;
}

export async function getAllLeads() {
  const all = await getRedis().hgetall('leads:all');
  if (!all) return [];
  return Object.values(all)
    .map(v => typeof v === 'string' ? JSON.parse(v) : v)
    .sort((a, b) => b.createdAt - a.createdAt);
}

export async function markLeadContacted(id) {
  const r = getRedis();
  const raw = await r.hget('leads:all', id);
  if (!raw) return null;
  const lead = typeof raw === 'string' ? JSON.parse(raw) : raw;
  lead.contacted = true;
  lead.contactedAt = Date.now();
  await r.hset('leads:all', { [id]: JSON.stringify(lead) });
  return lead;
}

export async function markLeadConverted(id, plan = 'pro') {
  const r = getRedis();
  const raw = await r.hget('leads:all', id);
  if (!raw) return null;
  const lead = typeof raw === 'string' ? JSON.parse(raw) : raw;
  lead.converted = true; lead.plan = plan; lead.convertedAt = Date.now();
  await r.hset('leads:all', { [id]: JSON.stringify(lead) });
  return lead;
}
