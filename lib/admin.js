import { Redis } from '@upstash/redis';

let redis;
function getRedis() {
  if (!redis) {
    const url = (process.env.UPSTASH_REDIS_REST_URL || '').trim();
    const token = (process.env.UPSTASH_REDIS_REST_TOKEN || '').trim();
    redis = new Redis({ url, token });
  }
  return redis;
}

const ADMIN_IDS = () => (process.env.TELEGRAM_ADMIN_IDS || '8074643162').split(',').map(s => s.trim());

export function isAdmin(telegramId) {
  return ADMIN_IDS().includes(String(telegramId));
}

// Grant free access to a Telegram ID
export async function grantAccess(telegramId, plan = 'pro', grantedBy = 'admin') {
  const r = getRedis();
  const grant = { telegramId: String(telegramId), plan, grantedBy, grantedAt: Date.now(), active: true };
  await r.hset('admin:grants', { [String(telegramId)]: JSON.stringify(grant) });
  return grant;
}

export async function revokeAccess(telegramId) {
  await getRedis().hdel('admin:grants', String(telegramId));
}

export async function getGrant(telegramId) {
  const raw = await getRedis().hget('admin:grants', String(telegramId));
  if (!raw) return null;
  return typeof raw === 'string' ? JSON.parse(raw) : raw;
}

export async function getAllGrants() {
  const all = await getRedis().hgetall('admin:grants');
  if (!all) return [];
  return Object.values(all).map(v => typeof v === 'string' ? JSON.parse(v) : v);
}

export async function getUserPlan(telegramId) {
  const grant = await getGrant(telegramId);
  return grant?.plan || 'free';
}

// Usage tracking
export async function trackUsage(feature, chatId) {
  const r = getRedis();
  const day = new Date().toISOString().slice(0, 10);
  await r.incr(`usage:${day}:${feature}`);
  await r.incr(`usage:total:${feature}`);
  if (chatId) await r.incr(`usage:user:${chatId}:${feature}`);
}

export async function getStats() {
  const r = getRedis();
  const day = new Date().toISOString().slice(0, 10);
  const [research, chat, code, voice, grants] = await Promise.all([
    r.get(`usage:total:research`).catch(() => 0),
    r.get(`usage:total:chat`).catch(() => 0),
    r.get(`usage:total:code`).catch(() => 0),
    r.get(`usage:total:voice`).catch(() => 0),
    r.hlen('admin:grants').catch(() => 0),
  ]);
  const [todayResearch, todayChat] = await Promise.all([
    r.get(`usage:${day}:research`).catch(() => 0),
    r.get(`usage:${day}:chat`).catch(() => 0),
  ]);
  return {
    total: { research: Number(research), chat: Number(chat), code: Number(code), voice: Number(voice) },
    today: { research: Number(todayResearch), chat: Number(todayChat) },
    grants: Number(grants),
  };
}
