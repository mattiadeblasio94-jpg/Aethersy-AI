import { loginUser } from '../../../lib/auth';
import { trackLogin } from '../../../lib/tracking';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Email e password richiesti' });
  try {
    const result = await loginUser({ email, password });
    // Track login
    await trackLogin(email, 'email');
    return res.status(200).json({ ok: true, ...result });
  } catch (e) {
    return res.status(401).json({ error: e.message });
  }
}
