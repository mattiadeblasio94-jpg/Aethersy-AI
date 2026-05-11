import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'aethersy-jwt-secret-key-2025';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email e password richiesti' });
  }

  const user = {
    id: Date.now().toString(),
    email,
    name: email.split('@')[0],
    plan: 'free',
    createdAt: new Date().toISOString(),
  };

  const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '30d' });

  return res.status(200).json({
    user,
    token,
    message: 'Login effettuato con successo',
  });
}
