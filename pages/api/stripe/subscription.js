import { getStripeInstance } from '../../../lib/stripe';
import { verifyToken } from '../../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const auth = req.headers.authorization?.replace('Bearer ', '');
  const decoded = auth ? verifyToken(auth) : null;
  if (!decoded) return res.status(401).json({ error: 'Non autenticato' });

  try {
    const stripe = getStripeInstance();

    // Cerca customer ID per email
    const customers = await stripe.customers.list({ email: decoded.email, limit: 1 });
    const customer = customers.data[0];

    if (!customer) {
      return res.status(200).json({
        active: false,
        message: 'Nessun abbonamento attivo'
      });
    }

    // Cerca subscription attive
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: 'active',
      limit: 1
    });

    if (subscriptions.data.length === 0) {
      return res.status(200).json({
        active: false,
        message: 'Nessuna subscription attiva'
      });
    }

    const sub = subscriptions.data[0];
    const plan = sub.metadata?.plan || 'pro';
    const interval = sub.items.data[0]?.plan?.interval || 'month';
    const currentPeriodEnd = sub.current_period_end * 1000;

    return res.status(200).json({
      active: true,
      plan,
      interval,
      currentPeriodEnd: new Date(currentPeriodEnd).toISOString(),
      cancelAtPeriodEnd: sub.cancel_at_period_end,
      customerId: customer.id
    });
  } catch (e) {
    console.error('Stripe subscription check error:', e.message);
    return res.status(500).json({ error: e.message });
  }
}
