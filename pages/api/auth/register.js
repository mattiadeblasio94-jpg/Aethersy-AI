import { registerUser } from '../../../lib/auth';
import { sendWelcomeEmail } from '../../../lib/email';
import { trackRegistration } from '../../../lib/tracking';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { name, email, password } = req.body || {};
  if (!name || !email || !password) return res.status(400).json({ error: 'Campi mancanti' });
  if (password.length < 6) return res.status(400).json({ error: 'Password minimo 6 caratteri' });
  try {
    const result = await registerUser({ name, email, password });
    // Track registration
    await trackRegistration(email, name, 'email');
    // Send welcome email in background (don't await — don't block response)
    sendWelcomeEmail(email, name).catch(() => {});
    return res.status(201).json({ ok: true, token: result.token, user: result.user });
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }
}
