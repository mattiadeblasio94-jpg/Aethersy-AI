import { getGoogleAuthUrl, getGoogleTokens, getGoogleUserInfo } from '../../../lib/google-auth';
import { saveGoogleCredentials } from '../../../lib/google-services';
import { verifyToken } from '../../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Metodo non consentito' });
  }

  const auth = req.headers.authorization?.replace('Bearer ', '');
  const decoded = auth ? verifyToken(auth) : null;

  if (req.method === 'GET') {
    // Generate Google OAuth URL
    if (!decoded) {
      return res.status(401).json({ error: 'Non autenticato' });
    }

    const state = {
      userId: decoded.email,
      action: 'link',
      next: req.query.next || '/dashboard',
    };

    const authUrl = getGoogleAuthUrl(state);
    return res.json({ url: authUrl });
  }

  if (req.method === 'POST') {
    // Handle OAuth callback with code
    const { code, redirectUri } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Code richiesto' });
    }

    try {
      const tokens = await getGoogleTokens(code, redirectUri);

      if (!tokens.access_token) {
        throw new Error('Token non ricevuto da Google');
      }

      const userInfo = await getGoogleUserInfo(tokens.access_token);

      if (!decoded || decoded.email !== userInfo.email) {
        return res.status(403).json({ error: 'Email non corrisponde' });
      }

      // Save credentials
      await saveGoogleCredentials(decoded.email, tokens);

      return res.json({
        ok: true,
        email: userInfo.email,
        name: userInfo.name,
        picture: userInfo.picture,
      });
    } catch (e) {
      console.error('Google link error:', e.message);
      return res.status(500).json({ error: e.message });
    }
  }
}
