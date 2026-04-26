/**
 * AETHERSY AI - Telegram ↔ Web App Sync Engine
 * Sincronizza autorizzazioni tra Bot Telegram e Web App
 */

import { Redis } from '@upstash/redis';

function getRedis() {
  const url = (process.env.UPSTASH_REDIS_REST_URL || '').trim();
  const token = (process.env.UPSTASH_REDIS_REST_TOKEN || '').trim();
  return new Redis({ url, token });
}

/**
 * Link Telegram ID to web user email
 * Called when user connects Telegram to web account
 */
export async function linkTelegramToEmail(telegramId, email) {
  const r = getRedis();
  const link = {
    telegramId: String(telegramId),
    email: email.toLowerCase().trim(),
    linkedAt: Date.now(),
    active: true
  };

  // Save bidirectional mapping
  await r.setex(`link:tg2email:${telegramId}`, 86400 * 365, JSON.stringify(link)); // 1 year
  await r.setex(`link:email2tg:${email.toLowerCase().trim()}`, 86400 * 365, JSON.stringify(link));

  // Add to set of linked accounts
  await r.sadd('linked:accounts', String(telegramId));

  return link;
}

/**
 * Unlink Telegram ID from email
 */
export async function unlinkTelegram(telegramId) {
  const r = getRedis();
  const link = await getLinkByTelegram(telegramId);

  if (link) {
    await r.del(`link:tg2email:${telegramId}`);
    await r.del(`link:email2tg:${link.email}`);
    await r.srem('linked:accounts', String(telegramId));
  }

  return { success: true };
}

/**
 * Get email by Telegram ID
 */
export async function getLinkByTelegram(telegramId) {
  const r = getRedis();
  const raw = await r.get(`link:tg2email:${telegramId}`);
  if (!raw) return null;
  return typeof raw === 'string' ? JSON.parse(raw) : raw;
}

/**
 * Get Telegram ID by email
 */
export async function getLinkByEmail(email) {
  const r = getRedis();
  const raw = await r.get(`link:email2tg:${email.toLowerCase().trim()}`);
  if (!raw) return null;
  return typeof raw === 'string' ? JSON.parse(raw) : raw;
}

/**
 * Check if user has PRO access (via grant or subscription)
 */
export async function hasProAccess(telegramId) {
  const r = getRedis();

  // Check active grants
  const grant = await r.hget('admin:grants', String(telegramId));
  if (grant) {
    const g = typeof grant === 'string' ? JSON.parse(grant) : grant;
    if (g.active && g.plan !== 'free') return true;
  }

  // Check if linked to paying user
  const link = await getLinkByTelegram(telegramId);
  if (link) {
    const userPlan = await r.get(`user:plan:${link.email}`);
    if (userPlan && ['pro', 'business', 'enterprise'].includes(userPlan)) return true;
  }

  return false;
}

/**
 * Get user plan from any source (grant, subscription, link)
 */
export async function getUserPlan(telegramId) {
  const r = getRedis();

  // Priority 1: Admin grants
  const grant = await r.hget('admin:grants', String(telegramId));
  if (grant) {
    const g = typeof grant === 'string' ? JSON.parse(grant) : grant;
    if (g.active) return g.plan || 'free';
  }

  // Priority 2: Linked email subscription
  const link = await getLinkByTelegram(telegramId);
  if (link) {
    const userPlan = await r.get(`user:plan:${link.email}`);
    if (userPlan) return userPlan;
  }

  return 'free';
}

/**
 * Sync user plan to Redis (called on Stripe payment)
 */
export async function syncWebSubscription(email, plan) {
  const r = getRedis();

  // Save plan
  await r.setex(`user:plan:${email.toLowerCase().trim()}`, 86400 * 365, plan);

  // If linked to Telegram, update grant
  const link = await getLinkByEmail(email);
  if (link && link.telegramId) {
    const grantData = {
      telegramId: String(link.telegramId),
      plan,
      grantedBy: 'stripe_subscription',
      grantedAt: Date.now(),
      active: true,
      subscription: true
    };
    await r.hset('admin:grants', { [String(link.telegramId)]: JSON.stringify(grantData) });
  }

  return { success: true };
}

/**
 * Export all authorized users to text format (for backup/admin view)
 */
export async function exportAuthorizedUsers() {
  const r = getRedis();
  const lines = [
    '# AETHERSY AI - UTENTI AUTORIZZATI',
    `# Export: ${new Date().toISOString()}`,
    '# Formato: telegram_id|email|piano|data_grant|stato',
    ''
  ];

  // Get all grants
  const grants = await r.hgetall('admin:grants') || {};
  for (const [tgId, grantStr] of Object.entries(grants)) {
    const g = typeof grantStr === 'string' ? JSON.parse(grantStr) : grantStr;
    const link = await getLinkByTelegram(tgId);
    const email = link?.email || 'N/A';
    const data = `${tgId}|${email}|${g.plan || 'free'}|${new Date(g.grantedAt).toISOString().split('T')[0]}|${g.active ? 'active' : 'revoked'}`;
    lines.push(data);
  }

  return lines.join('\n');
}

/**
 * Get all linked accounts for admin panel
 */
export async function getAllLinkedAccounts() {
  const r = getRedis();
  const linked = await r.smembers('linked:accounts') || [];

  const accounts = [];
  for (const tgId of linked) {
    const link = await getLinkByTelegram(tgId);
    const plan = await getUserPlan(tgId);
    if (link) {
      accounts.push({
        telegramId: tgId,
        email: link.email,
        plan,
        linkedAt: link.linkedAt
      });
    }
  }

  return accounts;
}

/**
 * Check daily usage limits
 */
export async function checkDailyLimit(telegramId, feature) {
  const r = getRedis();
  const day = new Date().toISOString().slice(0, 10);
  const plan = await getUserPlan(telegramId);

  const LIMITS = {
    free: { chat: 20, search: 5, code: 3, voice: 5, terminal: 3 },
    pro: { chat: 9999, search: 9999, code: 9999, voice: 100, terminal: 9999 },
    business: { chat: 99999, search: 99999, code: 99999, voice: 9999, terminal: 99999 },
    enterprise: { chat: Infinity, search: Infinity, code: Infinity, voice: Infinity, terminal: Infinity }
  };

  const limit = LIMITS[plan]?.[feature] || 0;
  if (limit === Infinity) return { ok: true, remaining: Infinity, limit: Infinity };

  const used = await r.get(`usage:user:${telegramId}:${feature}:${day}`) || 0;
  const remaining = limit - Number(used);

  return { ok: remaining > 0, remaining, used: Number(used), limit };
}

/**
 * Increment usage counter
 */
export async function incrementUsage(telegramId, feature) {
  const r = getRedis();
  const day = new Date().toISOString().slice(0, 10);
  await r.incr(`usage:user:${telegramId}:${feature}:${day}`);
  await r.incr(`usage:user:${telegramId}:${feature}`);
  await r.incr(`usage:${day}:${feature}`);
  await r.incr(`usage:total:${feature}`);
}

/**
 * Verify if user has access to specific feature
 */
export function hasAccess(plan, feature) {
  const FREE_FEATURES = ['chat', 'search', 'code-basic', 'finance', 'crypto'];
  const PRO_FEATURES = ['chat-unlimited', 'search-unlimited', 'code-advanced', 'terminal', 'voice', 'brain', 'monetize', 'project'];
  const BIZ_FEATURES = ['email-ai', 'workflow', 'lead-mgmt', 'admin', 'webhook', 'export'];

  if (plan === 'free') return FREE_FEATURES.includes(feature);
  if (plan === 'pro') return FREE_FEATURES.includes(feature) || PRO_FEATURES.includes(feature);
  if (plan === 'business' || plan === 'enterprise') return true;

  return false;
}
