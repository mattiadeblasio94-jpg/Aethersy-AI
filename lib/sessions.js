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

export async function saveSession({ userId, tool, title, data, sessionId }) {
  const r = getRedis();
  const id = sessionId || `sess_${Date.now()}_${Math.random().toString(36).slice(2,6)}`;
  const userKey = userId || 'anonymous';
  const session = {
    id, userId: userKey, tool, title: title || `Sessione ${tool}`,
    data, createdAt: sessionId ? undefined : Date.now(), updatedAt: Date.now(),
  };
  await r.hset(`sessions:${userKey}`, { [id]: JSON.stringify(session) });
  return session;
}

export async function getUserSessions(userId) {
  const r = getRedis();
  const userKey = userId || 'anonymous';
  const all = await r.hgetall(`sessions:${userKey}`);
  if (!all) return [];
  return Object.values(all)
    .map(v => typeof v === 'string' ? JSON.parse(v) : v)
    .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
    .slice(0, 50);
}

export async function loadSession(userId, sessionId) {
  const r = getRedis();
  const userKey = userId || 'anonymous';
  const raw = await r.hget(`sessions:${userKey}`, sessionId);
  if (!raw) return null;
  return typeof raw === 'string' ? JSON.parse(raw) : raw;
}

export async function deleteSession(userId, sessionId) {
  const userKey = userId || 'anonymous';
  await getRedis().hdel(`sessions:${userKey}`, sessionId);
}
