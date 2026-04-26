import { getStripeInstance } from '../../../lib/stripe';
import { verifyToken } from '../../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const auth = req.headers.authorization?.replace('Bearer ', '');
  const decoded = auth ? verifyToken(auth) : null;
  if (!decoded) return res.status(401).json({ error: 'Non autenticato' });

  try {
    const stripe = getStripeInstance();

    // Cerca customer ID per email
    const customers = await stripe.customers.list({ email: decoded.email, limit: 1 });
    const customer = customers.data[0];

    if (!customer) {
      return res.status(404).json({ error: 'Customer non trovato' });
    }

    // Crea sessione portale clienti
    const session = await stripe.billingPortal.sessions.create({
      customer: customer.id,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://aethersy.com'}/dashboard`,
    });

    return res.status(200).json({ url: session.url });
  } catch (e) {
    console.error('Stripe portal error:', e.message);
    return res.status(500).json({ error: e.message });
  }
}
