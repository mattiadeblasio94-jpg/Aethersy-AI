import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Redis } from '@upstash/redis';

const JWT_SECRET = process.env.JWT_SECRET || 'aiforge-secret-change-in-prod';

function getRedis() {
  const url = (process.env.UPSTASH_REDIS_REST_URL || '').trim();
  const token = (process.env.UPSTASH_REDIS_REST_TOKEN || '').trim();
  if (!url.startsWith('http')) throw new Error('Redis non configurato');
  return new Redis({ url, token });
}

function makeToken(user) {
  return jwt.sign(
    { email: user.email, name: user.name, plan: user.plan },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}

export async function registerUser({ name, email, password }) {
  const r = getRedis();
  const key = `user:${email.toLowerCase()}`;
  const exists = await r.get(key);
  if (exists) throw new Error('Email già registrata');
  const passwordHash = await bcrypt.hash(password, 10);
  const user = { name, email: email.toLowerCase(), passwordHash, plan: 'free', provider: 'email', createdAt: new Date().toISOString() };
  await r.set(key, JSON.stringify(user));
  await r.lpush('users:list', email.toLowerCase());
  const safeUser = { name, email: user.email, plan: user.plan };
  return { token: makeToken(safeUser), user: safeUser };
}

export async function loginUser({ email, password }) {
  const r = getRedis();
  const raw = await r.get(`user:${email.toLowerCase()}`);
  if (!raw) throw new Error('Email o password errati');
  const user = typeof raw === 'string' ? JSON.parse(raw) : raw;
  if (!user.passwordHash) throw new Error('Account creato con Google/GitHub. Usa quel metodo per accedere.');
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new Error('Email o password errati');
  const safeUser = { name: user.name, email: user.email, plan: user.plan, avatar: user.avatar };
  return { token: makeToken(safeUser), user: safeUser };
}

export async function loginOrCreateOAuthUser({ name, email, provider, providerId, avatar }) {
  const r = getRedis();
  const key = `user:${email.toLowerCase()}`;
  const raw = await r.get(key);
  let user;
  if (!raw) {
    user = { name, email: email.toLowerCase(), provider, providerId, avatar: avatar || '', plan: 'free', createdAt: new Date().toISOString() };
    await r.set(key, JSON.stringify(user));
    await r.lpush('users:list', email.toLowerCase());
  } else {
    user = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!user.provider) { user.provider = provider; user.providerId = providerId; }
    if (avatar && !user.avatar) user.avatar = avatar;
    await r.set(key, JSON.stringify(user));
  }
  const safeUser = { name: user.name, email: user.email, plan: user.plan, avatar: user.avatar || '' };
  return { token: makeToken(safeUser), user: safeUser };
}

export function verifyToken(token) {
  try { return jwt.verify(token, JWT_SECRET); }
  catch { return null; }
}

export async function getAllUsers() {
  const r = getRedis();
  const emails = await r.lrange('users:list', 0, -1);
  const users = await Promise.all(
    emails.map(async email => {
      const raw = await r.get(`user:${email}`);
      if (!raw) return null;
      const u = typeof raw === 'string' ? JSON.parse(raw) : raw;
      return { name: u.name, email: u.email, plan: u.plan, provider: u.provider || 'email', createdAt: u.createdAt };
    })
  );
  return users.filter(Boolean);
}

export async function updateUserPlan(email, plan) {
  const r = getRedis();
  const key = `user:${email.toLowerCase()}`;
  const raw = await r.get(key);
  if (!raw) throw new Error('Utente non trovato');
  const user = typeof raw === 'string' ? JSON.parse(raw) : raw;
  user.plan = plan;
  user.planUpdatedAt = new Date().toISOString();
  await r.set(key, JSON.stringify(user));

  // Sync with Telegram if linked
  try {
    const { getLinkByEmail } = await import('./auth-sync');
    const link = await getLinkByEmail(email);
    if (link && link.telegramId) {
      // Update grant in Redis
      const { grantAccess } = await import('./admin');
      await grantAccess(String(link.telegramId), plan, 'stripe_subscription');

      // Send notification via Telegram
      try {
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'https://aethersy.com'}/api/telegram/notify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            telegramId: String(link.telegramId),
            type: plan === 'free' ? 'subscription_canceled' : 'subscription_activated',
            plan
          })
        });
      } catch (e) {
        console.error('Telegram notification error:', e.message);
      }
    }
  } catch (e) {
    // auth-sync might not exist in all deployments
    console.log('Telegram sync not available:', e.message);
  }

  return user;
}
