export default function handler(req, res) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) return res.status(500).json({ error: 'GOOGLE_CLIENT_ID non configurato' });

  // Always use aethersy.com for production
  const baseUrl = 'https://aethersy.com';
  const redirectUri = `${baseUrl}/api/auth/google/callback`;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'select_account',
    state: JSON.stringify({ next: req.query.next || '/dashboard', origin: baseUrl }),
  });

  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
}
