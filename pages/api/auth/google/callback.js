import { loginOrCreateOAuthUser } from '../../../../lib/auth';
import { saveGoogleCredentials } from '../../../../lib/google-services';
import { Redis } from '@upstash/redis';

// Inline tgSend to avoid import cycle
async function tgSend(chatId, text) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text: String(text).slice(0, 4000) }),
  });
}

function getRedis() {
  const url = (process.env.UPSTASH_REDIS_REST_URL || '').trim();
  const token = (process.env.UPSTASH_REDIS_REST_TOKEN || '').trim();
  return new Redis({ url, token });
}

export default async function handler(req, res) {
  const { code, state, error } = req.query;

  if (error) {
    console.error('Google OAuth error from query:', error);
    return res.redirect(`/?error=${encodeURIComponent(error)}`);
  }
  if (!code) return res.redirect('/?error=oauth_cancelled');

  let stateData = {};
  try { stateData = JSON.parse(state || '{}'); } catch {}

  // Use production URL by default, fallback to request origin
  const productionUrl = 'https://aethersy.com';
  const baseUrl = stateData.origin || productionUrl;
  const redirectUri = `${baseUrl}/api/auth/google/callback`;

  console.log('Using redirectUri:', redirectUri);

  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });
    const tokens = await tokenRes.json();
    if (!tokens.access_token) {
      console.error('Google token error:', tokens);
      throw new Error(tokens.error_description || 'Token non ricevuto da Google');
    }

    const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const googleUser = await userRes.json();
    if (!googleUser.email) throw new Error('Email non ricevuta da Google');

    // Check if this is a Telegram Google link
    if (stateData.action === 'link-google' && stateData.telegramId) {
      const r = getRedis();

      // Save Google credentials linked to Telegram ID
      await r.setex(`telegram:google:${stateData.telegramId}`, 86400 * 30, JSON.stringify({
        email: googleUser.email,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expiry_date: tokens.expiry_date,
      }));

      // Also link to web user by email
      const { token, user } = await loginOrCreateOAuthUser({
        name: googleUser.name || googleUser.email.split('@')[0],
        email: googleUser.email,
        provider: 'google',
        providerId: googleUser.id,
        avatar: googleUser.picture,
      });

      // Notify Telegram user
      await tgSend(stateData.telegramId,
        `✅ Google Collegato!\n\n` +
        `📧 Email: ${googleUser.email}\n\n` +
        `Ora Lara può:\n` +
        `• Inviare email per te\n` +
        `• Leggere/scrivere su Sheets\n` +
        `• Creare documenti Docs\n\n` +
        `Usa /email per inviare una email.`
      );

      return res.redirect(`/dashboard?google=linked`);
    }

    // Standard OAuth flow
    const { token, user } = await loginOrCreateOAuthUser({
      name: googleUser.name || googleUser.email.split('@')[0],
      email: googleUser.email,
      provider: 'google',
      providerId: googleUser.id,
      avatar: googleUser.picture,
    });

    const next = stateData.next && stateData.next.startsWith('/') ? stateData.next : '/dashboard';
    res.redirect(`/auth/success?token=${encodeURIComponent(token)}&user=${encodeURIComponent(JSON.stringify(user))}&next=${encodeURIComponent(next)}`);
  } catch (e) {
    console.error('Google OAuth error:', e.message);
    res.redirect(`/?error=${encodeURIComponent(e.message)}`);
  }
}
