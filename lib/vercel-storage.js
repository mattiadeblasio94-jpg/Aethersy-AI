/**
 * Vercel Storage - Blob, KV, Postgres
 * Unificato per file, cache e database
 */

// Vercel Blob per file
import { put, del, get, list } from '@vercel/blob';

// Vercel KV per cache/sessioni
import { kv } from '@vercel/kv';

// Vercel Postgres per DB
import { sql } from '@vercel/postgres';

// ============================================
// BLOB STORAGE (File, Immagini, Documenti)
// ============================================

export async function uploadFile(filename, data, options = {}) {
  try {
    const blob = await put(filename, data, {
      access: options.access || 'public',
      addRandomSuffix: options.addRandomSuffix ?? true,
      contentType: options.contentType,
    });

    // Salva metadata in KV
    await kv.hset(`file:${blob.pathname}`, {
      url: blob.url,
      size: blob.size,
      uploadedAt: Date.now(),
      contentType: blob.contentType,
    });

    return blob;
  } catch (error) {
    console.error('[Blob] Upload error:', error);
    throw error;
  }
}

export async function deleteFile(pathname) {
  try {
    await del(pathname);
    await kv.del(`file:${pathname}`);
    return { success: true };
  } catch (error) {
    console.error('[Blob] Delete error:', error);
    throw error;
  }
}

export async function getFile(pathname) {
  try {
    const blob = await get(pathname);
    return blob;
  } catch (error) {
    console.error('[Blob] Get error:', error);
    return null;
  }
}

export async function listFiles(prefix) {
  try {
    const { blobs } = await list({ prefix });
    return blobs;
  } catch (error) {
    console.error('[Blob] List error:', error);
    return [];
  }
}

// ============================================
// KV STORE (Cache, Sessioni, Rate Limiting)
// ============================================

export async function cacheSet(key, value, ttlSeconds = 3600) {
  try {
    await kv.setex(key, ttlSeconds, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error('[KV] Set error:', error);
    return false;
  }
}

export async function cacheGet(key) {
  try {
    const raw = await kv.get(key);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.error('[KV] Get error:', error);
    return null;
  }
}

export async function cacheDelete(key) {
  try {
    await kv.del(key);
    return true;
  } catch (error) {
    console.error('[KV] Delete error:', error);
    return false;
  }
}

// Rate limiting
export async function checkRateLimit(identifier, limit = 10, windowSeconds = 60) {
  const key = `ratelimit:${identifier}`;
  const current = await kv.incr(key);

  if (current === 1) {
    await kv.expire(key, windowSeconds);
  }

  return {
    allowed: current <= limit,
    remaining: Math.max(0, limit - current),
    reset: Date.now() + windowSeconds * 1000,
  };
}

// Sessioni utente
export async function createSession(userId, data) {
  const key = `session:${userId}`;
  await kv.setex(key, 86400 * 7, JSON.stringify(data)); // 7 giorni
  return key;
}

export async function getSession(userId) {
  const raw = await kv.get(`session:${userId}`);
  return raw ? JSON.parse(raw) : null;
}

export async function deleteSession(userId) {
  await kv.del(`session:${userId}`);
}

// ============================================
// POSTGRES (Dati strutturati, Analytics)
// ============================================

export async function initDatabase() {
  try {
    // Tabella utenti
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        name TEXT,
        plan TEXT DEFAULT 'free',
        created_at TIMESTAMP DEFAULT NOW(),
        telegram_id TEXT,
        provider TEXT
      )
    `;

    // Tabella usage/analytics
    await sql`
      CREATE TABLE IF NOT EXISTS usage_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        action TEXT NOT NULL,
        tokens INTEGER,
        cost DECIMAL(10,6),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // Tabella lead
    await sql`
      CREATE TABLE IF NOT EXISTS leads (
        id SERIAL PRIMARY KEY,
        name TEXT,
        email TEXT,
        phone TEXT,
        source TEXT,
        plan TEXT,
        contacted BOOLEAN DEFAULT FALSE,
        converted BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    console.log('[Postgres] Database tables ready');
    return true;
  } catch (error) {
    console.error('[Postgres] Init error:', error);
    return false;
  }
}

export async function saveUser(email, name, options = {}) {
  try {
    const result = await sql`
      INSERT INTO users (email, name, plan, telegram_id, provider)
      VALUES (${email}, ${name}, ${options.plan || 'free'}, ${options.telegramId}, ${options.provider || 'email'})
      ON CONFLICT (email) DO UPDATE SET name = ${name}
      RETURNING *
    `;
    return result.rows[0];
  } catch (error) {
    console.error('[Postgres] Save user error:', error);
    return null;
  }
}

export async function logUsage(userId, action, options = {}) {
  try {
    await sql`
      INSERT INTO usage_logs (user_id, action, tokens, cost)
      VALUES (${userId}, ${action}, ${options.tokens || 0}, ${options.cost || 0})
    `;
  } catch (error) {
    console.error('[Postgres] Log usage error:', error);
  }
}

export async function saveLead(data) {
  try {
    const result = await sql`
      INSERT INTO leads (name, email, phone, source, plan)
      VALUES (${data.name}, ${data.email}, ${data.phone}, ${data.source || 'web'}, ${data.plan || 'free'})
      RETURNING *
    `;
    return result.rows[0];
  } catch (error) {
    console.error('[Postgres] Save lead error:', error);
    return null;
  }
}

export async function getAnalytics(start, end) {
  try {
    const [users, usage, leads] = await Promise.all([
      sql`SELECT COUNT(*) FROM users WHERE created_at BETWEEN ${start} AND ${end}`,
      sql`SELECT action, SUM(tokens) as tokens, SUM(cost) as cost FROM usage_logs WHERE created_at BETWEEN ${start} AND ${end} GROUP BY action`,
      sql`SELECT COUNT(*) FROM leads WHERE created_at BETWEEN ${start} AND ${end}`,
    ]);

    return {
      newUsers: users.rows[0]?.count || 0,
      usage: usage.rows || [],
      newLeads: leads.rows[0]?.count || 0,
    };
  } catch (error) {
    console.error('[Postgres] Get analytics error:', error);
    return null;
  }
}
