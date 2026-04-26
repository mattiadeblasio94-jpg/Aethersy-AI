import { loginOrCreateOAuthUser } from '../../../../lib/auth';

export default async function handler(req, res) {
  const { code, state, error } = req.query;

  if (error) return res.redirect(`/?error=${encodeURIComponent(error)}`);
  if (!code) return res.redirect('/?error=oauth_cancelled');

  let stateData = {};
  try { stateData = JSON.parse(state || '{}'); } catch {}

  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers.host;
  const baseUrl = stateData.origin || `${proto}://${host}`;

  try {
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: `${baseUrl}/api/auth/github/callback`,
      }),
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) throw new Error(tokenData.error_description || 'Token non ricevuto da GitHub');

    const [userRes, emailsRes] = await Promise.all([
      fetch('https://api.github.com/user', {
        headers: { Authorization: `Bearer ${tokenData.access_token}`, Accept: 'application/vnd.github.v3+json' },
      }),
      fetch('https://api.github.com/user/emails', {
        headers: { Authorization: `Bearer ${tokenData.access_token}`, Accept: 'application/vnd.github.v3+json' },
      }),
    ]);
    const ghUser = await userRes.json();
    const emails = await emailsRes.json();

    const primaryEmail = (Array.isArray(emails) ? emails.find(e => e.primary)?.email : null) || ghUser.email;
    if (!primaryEmail) throw new Error('Email non disponibile su GitHub. Imposta un\'email pubblica nel profilo GitHub.');

    const { token, user } = await loginOrCreateOAuthUser({
      name: ghUser.name || ghUser.login,
      email: primaryEmail,
      provider: 'github',
      providerId: String(ghUser.id),
      avatar: ghUser.avatar_url,
    });

    const next = stateData.next && stateData.next.startsWith('/') ? stateData.next : '/dashboard';
    res.redirect(`/auth/success?token=${encodeURIComponent(token)}&user=${encodeURIComponent(JSON.stringify(user))}&next=${encodeURIComponent(next)}`);
  } catch (e) {
    console.error('GitHub OAuth error:', e.message);
    res.redirect(`/?error=${encodeURIComponent(e.message)}`);
  }
}
