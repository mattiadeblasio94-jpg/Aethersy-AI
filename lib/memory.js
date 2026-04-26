import { Redis } from '@upstash/redis';

let redis;
function getRedis() {
  if (!redis) {
    const url = (process.env.UPSTASH_REDIS_REST_URL || '').trim();
    const token = (process.env.UPSTASH_REDIS_REST_TOKEN || '').trim();
    if (!url || !url.startsWith('http')) throw new Error('UPSTASH_REDIS_REST_URL non configurato');
    redis = new Redis({ url, token });
  }
  return redis;
}

// ── Conversation history ──────────────────────────────────────────────────────

export async function saveMessage(chatId, role, content) {
  const r = getRedis();
  await r.lpush(`chat:${chatId}:history`, JSON.stringify({ role, content, ts: Date.now() }));
  await r.ltrim(`chat:${chatId}:history`, 0, 99);
}

export async function getHistory(chatId, limit = 20) {
  const r = getRedis();
  const msgs = await r.lrange(`chat:${chatId}:history`, 0, limit - 1);
  return msgs.map(m => (typeof m === 'string' ? JSON.parse(m) : m)).reverse();
}

export async function clearHistory(chatId) {
  await getRedis().del(`chat:${chatId}:history`);
}

// ── Agent long-term memory ────────────────────────────────────────────────────

export async function rememberFact(key, value) {
  await getRedis().hset('agent:memory', {
    [key]: JSON.stringify({ value, savedAt: Date.now() }),
  });
}

export async function recallMemory(query) {
  const all = await getRedis().hgetall('agent:memory');
  if (!all) return [];
  const q = query.toLowerCase();
  return Object.entries(all)
    .map(([k, raw]) => ({ key: k, ...(typeof raw === 'string' ? JSON.parse(raw) : raw) }))
    .filter(({ key, value }) => key.toLowerCase().includes(q) || value.toLowerCase().includes(q))
    .slice(0, 8);
}

export async function getAllMemories() {
  const all = await getRedis().hgetall('agent:memory');
  if (!all) return [];
  return Object.entries(all).map(([k, raw]) => ({
    key: k,
    ...(typeof raw === 'string' ? JSON.parse(raw) : raw),
  }));
}

// ── Projects ──────────────────────────────────────────────────────────────────

export async function saveProject(id, data) {
  await getRedis().hset('projects', {
    [id]: JSON.stringify({ ...data, updatedAt: Date.now() }),
  });
}

export async function getProject(id) {
  const raw = await getRedis().hget('projects', id);
  if (!raw) return null;
  return typeof raw === 'string' ? JSON.parse(raw) : raw;
}

export async function getAllProjects() {
  const all = await getRedis().hgetall('projects');
  if (!all) return [];
  return Object.entries(all).map(([id, raw]) => ({
    id,
    ...(typeof raw === 'string' ? JSON.parse(raw) : raw),
  }));
}

export async function deleteProject(id) {
  await getRedis().hdel('projects', id);
}

// ── File metadata ─────────────────────────────────────────────────────────────

export async function saveFileMeta(fileId, meta) {
  await getRedis().hset('files:meta', {
    [fileId]: JSON.stringify({ ...meta, savedAt: Date.now() }),
  });
}

export async function getFileMeta(fileId) {
  const raw = await getRedis().hget('files:meta', fileId);
  if (!raw) return null;
  return typeof raw === 'string' ? JSON.parse(raw) : raw;
}

export async function getAllFiles() {
  const all = await getRedis().hgetall('files:meta');
  if (!all) return [];
  return Object.entries(all).map(([id, raw]) => ({
    id,
    ...(typeof raw === 'string' ? JSON.parse(raw) : raw),
  }));
}

// ── Research cache ────────────────────────────────────────────────────────────

export async function cacheResearch(query, results) {
  const key = `research:${query.toLowerCase().replace(/\s+/g, '_').slice(0, 80)}`;
  await getRedis().setex(key, 3600, JSON.stringify(results)); // 1h TTL
}

export async function getCachedResearch(query) {
  const key = `research:${query.toLowerCase().replace(/\s+/g, '_').slice(0, 80)}`;
  const raw = await getRedis().get(key);
  if (!raw) return null;
  return typeof raw === 'string' ? JSON.parse(raw) : raw;
}
