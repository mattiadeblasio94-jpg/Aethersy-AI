import { Redis } from '@upstash/redis';

let redis;
function getRedis() {
  if (!redis) {
    const url = (process.env.UPSTASH_REDIS_REST_URL || '').trim();
    const token = (process.env.UPSTASH_REDIS_REST_TOKEN || '').trim();
    if (!url || !url.startsWith('http')) throw new Error('Redis non configurato');
    redis = new Redis({ url, token });
  }
  return redis;
}

const COLORS = {
  source:    '#06b6d4',
  entity:    '#7c3aed',
  concept:   '#10b981',
  synthesis: '#f59e0b',
  query:     '#a78bfa',
  index:     '#f87171',
  log:       '#34d399',
};

export function typeColor(type) { return COLORS[type] || '#64748b'; }

// ── Pages ─────────────────────────────────────────────────────────────────────

export async function savePage(page) {
  const r = getRedis();
  const now = Date.now();
  const id = page.id || `wiki_${now}_${Math.random().toString(36).slice(2, 7)}`;
  const data = {
    id,
    title:     page.title || 'Senza titolo',
    content:   page.content || '',
    type:      page.type || 'concept',      // source | entity | concept | synthesis | query
    tags:      page.tags || [],
    links:     page.links || [],            // linked page IDs
    related:   page.related || [],          // [[PageName]] style refs extracted
    color:     page.color || typeColor(page.type || 'concept'),
    x:         page.x ?? (200 + Math.random() * 600),
    y:         page.y ?? (200 + Math.random() * 400),
    createdAt: page.createdAt || now,
    updatedAt: now,
    sourceRef: page.sourceRef || '',        // original source title/url
    aiGenerated: page.aiGenerated || false,
    wordCount: (page.content || '').split(/\s+/).filter(Boolean).length,
  };
  await r.hset('wiki:pages', { [id]: JSON.stringify(data) });
  return data;
}

export async function getPage(id) {
  const raw = await getRedis().hget('wiki:pages', id);
  if (!raw) return null;
  return typeof raw === 'string' ? JSON.parse(raw) : raw;
}

export async function getAllPages() {
  const all = await getRedis().hgetall('wiki:pages');
  if (!all) return [];
  return Object.values(all)
    .map(v => typeof v === 'string' ? JSON.parse(v) : v)
    .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
}

export async function getPagesByType(type) {
  const all = await getAllPages();
  return all.filter(p => p.type === type);
}

export async function deletePage(id) {
  const r = getRedis();
  const all = await getAllPages();
  for (const page of all) {
    if (page.links?.includes(id)) {
      page.links = page.links.filter(l => l !== id);
      await r.hset('wiki:pages', { [page.id]: JSON.stringify(page) });
    }
  }
  await r.hdel('wiki:pages', id);
}

export async function searchPages(query) {
  const all = await getAllPages();
  const q = query.toLowerCase();
  return all.filter(p =>
    p.title?.toLowerCase().includes(q) ||
    p.content?.toLowerCase().includes(q) ||
    p.tags?.some(t => t.toLowerCase().includes(q))
  );
}

// ── Index (index.md equivalent) ───────────────────────────────────────────────

export async function getIndex() {
  const raw = await getRedis().get('wiki:index');
  if (!raw) return null;
  return typeof raw === 'string' ? JSON.parse(raw) : raw;
}

export async function saveIndex(content) {
  const r = getRedis();
  const data = { content, updatedAt: Date.now() };
  await r.set('wiki:index', JSON.stringify(data));
  return data;
}

// ── Log (log.md equivalent) ───────────────────────────────────────────────────

export async function addLogEntry(entry) {
  // entry: { type: 'ingest'|'query'|'lint'|'edit', title, summary, pagesAffected }
  const r = getRedis();
  const log = {
    id: `log_${Date.now()}`,
    type: entry.type,
    title: entry.title || '',
    summary: entry.summary || '',
    pagesAffected: entry.pagesAffected || [],
    timestamp: new Date().toISOString(),
  };
  await r.lpush('wiki:log', JSON.stringify(log));
  await r.ltrim('wiki:log', 0, 199); // keep last 200 entries
  return log;
}

export async function getLog(limit = 50) {
  const raw = await getRedis().lrange('wiki:log', 0, limit - 1);
  return (raw || []).map(r => typeof r === 'string' ? JSON.parse(r) : r);
}

// ── Stats ─────────────────────────────────────────────────────────────────────

export async function getWikiStats() {
  const pages = await getAllPages();
  const byType = {};
  let totalWords = 0;
  let totalLinks = 0;
  for (const p of pages) {
    byType[p.type] = (byType[p.type] || 0) + 1;
    totalWords += p.wordCount || 0;
    totalLinks += (p.links || []).length;
  }
  const orphans = pages.filter(p => {
    const linkedTo = pages.some(other => (other.links || []).includes(p.id));
    return !linkedTo && (p.links || []).length === 0 && p.type !== 'index';
  });
  return {
    total: pages.length,
    byType,
    totalWords,
    totalLinks,
    orphans: orphans.length,
  };
}
