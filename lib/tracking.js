import { Redis } from '@upstash/redis';

function getRedis() {
  const url = (process.env.UPSTASH_REDIS_REST_URL || '').trim();
  const token = (process.env.UPSTASH_REDIS_REST_TOKEN || '').trim();
  if (!url.startsWith('http')) return null;
  return new Redis({ url, token });
}

// Track user registration
export async function trackRegistration(email, name, provider = 'email') {
  const r = await getRedis();
  if (!r) return;

  const data = {
    email,
    name,
    provider,
    registeredAt: Date.now(),
    ip: null,
  };

  // Store user record
  await r.setex(`user:email:${email}`, 86400 * 365 * 10, JSON.stringify(data));

  // Add to registrations list
  await r.lpush('analytics:registrations', JSON.stringify({
    email,
    name,
    provider,
    timestamp: Date.now(),
  }));
  await r.ltrim('analytics:registrations', 0, 999);

  // Increment counter
  await r.incr('analytics:registrations:count');

  // Today's counter
  const today = new Date().toISOString().slice(0, 10);
  await r.incr(`analytics:registrations:${today}`);
}

// Track user login
export async function trackLogin(email, provider = 'email') {
  const r = await getRedis();
  if (!r) return;

  const today = new Date().toISOString().slice(0, 10);

  await r.setex(`user:lastlogin:${email}`, 86400 * 365, Date.now());
  await r.lpush('analytics:logins', JSON.stringify({
    email,
    provider,
    timestamp: Date.now(),
  }));
  await r.ltrim('analytics:logins', 0, 499);
  await r.incr(`analytics:logins:${today}`);
}

// Track Telegram user activity
export async function trackTelegramUser(telegramId, name, username = null) {
  const r = await getRedis();
  if (!r) return;

  const data = {
    telegramId,
    name,
    username,
    lastSeen: Date.now(),
  };

  await r.setex(`telegram:user:${telegramId}`, 86400 * 365 * 10, JSON.stringify(data));
  await r.lpush('analytics:telegram:users', JSON.stringify({
    telegramId,
    name,
    username,
    timestamp: Date.now(),
  }));
  await r.ltrim('analytics:telegram:users', 0, 999);
}

// Track Telegram command usage
export async function trackTelegramCommand(telegramId, command) {
  const r = await getRedis();
  if (!r) return;

  const today = new Date().toISOString().slice(0, 10);

  await r.lpush(`analytics:telegram:commands:${today}`, JSON.stringify({
    telegramId,
    command,
    timestamp: Date.now(),
  }));
  await r.ltrim(`analytics:telegram:commands:${today}`, 0, 999);

  // Increment command counter
  await r.incr(`analytics:telegram:command:${command}`);
  await r.incr(`analytics:telegram:commands:count`);
}

// Get all registrations
export async function getRegistrations(limit = 50) {
  const r = await getRedis();
  if (!r) return [];

  const data = await r.lrange('analytics:registrations', 0, limit - 1);
  return data.map(d => JSON.parse(d));
}

// Get all Telegram users
export async function getTelegramUsers(limit = 50) {
  const r = await getRedis();
  if (!r) return [];

  const data = await r.lrange('analytics:telegram:users', 0, limit - 1);
  return data.map(d => JSON.parse(d));
}

// Get active Telegram users (seen in last 24h)
export async function getActiveTelegramUsers() {
  const r = await getRedis();
  if (!r) return [];

  const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000);
  const allUsers = await r.scan(0, { match: 'telegram:user:*', count: 1000 });

  const active = [];
  for (const key of allUsers.keys) {
    const user = await r.get(key);
    if (user && user.lastSeen > twentyFourHoursAgo) {
      active.push(user);
    }
  }

  return active;
}

// Get analytics summary
export async function getAnalyticsSummary() {
  const r = await getRedis();
  if (!r) return null;

  const today = new Date().toISOString().slice(0, 10);

  const [
    totalRegistrations,
    todayRegistrations,
    todayLogins,
    telegramUsersCount,
    activeTelegramUsers,
  ] = await Promise.all([
    r.get('analytics:registrations:count') || 0,
    r.get(`analytics:registrations:${today}`) || 0,
    r.get(`analytics:logins:${today}`) || 0,
    r.scard('analytics:telegram:users:set') || 0,
    getActiveTelegramUsers(),
  ]);

  return {
    registrations: {
      total: totalRegistrations,
      today: todayRegistrations,
    },
    logins: {
      today: todayLogins,
    },
    telegram: {
      totalUsers: telegramUsersCount,
      activeToday: activeTelegramUsers.length,
    },
  };
}

// Get recent activity feed
export async function getRecentActivity(limit = 20) {
  const r = await getRedis();
  if (!r) return [];

  const [registrations, logins, telegramActivity] = await Promise.all([
    r.lrange('analytics:registrations', 0, limit - 1),
    r.lrange('analytics:logins', 0, limit - 1),
    r.lrange('analytics:telegram:users', 0, limit - 1),
  ]);

  const activity = [];

  for (const data of registrations) {
    const parsed = JSON.parse(data);
    activity.push({
      type: 'registration',
      email: parsed.email,
      name: parsed.name,
      timestamp: parsed.timestamp,
    });
  }

  for (const data of logins) {
    const parsed = JSON.parse(data);
    activity.push({
      type: 'login',
      email: parsed.email,
      timestamp: parsed.timestamp,
    });
  }

  for (const data of telegramActivity) {
    const parsed = JSON.parse(data);
    activity.push({
      type: 'telegram',
      telegramId: parsed.telegramId,
      name: parsed.name,
      timestamp: parsed.timestamp,
    });
  }

  // Sort by timestamp descending
  activity.sort((a, b) => b.timestamp - a.timestamp);

  return activity.slice(0, limit);
}
