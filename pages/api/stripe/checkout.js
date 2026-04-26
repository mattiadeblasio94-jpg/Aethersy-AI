import { getStripeInstance } from '../../../lib/stripe';
import { verifyToken } from '../../../lib/auth';
import { Redis } from '@upstash/redis';

function getRedis() {
  const url = (process.env.UPSTASH_REDIS_REST_URL || '').trim();
  const token = (process.env.UPSTASH_REDIS_REST_TOKEN || '').trim();
  return new Redis({ url, token });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const auth = req.headers.authorization?.replace('Bearer ', '');
  const decoded = auth ? verifyToken(auth) : null;
  if (!decoded) return res.status(401).json({ error: 'Non autenticato' });

  const { plan, annual = false } = req.body;
  if (!['pro', 'business', 'enterprise'].includes(plan)) {
    return res.status(400).json({ error: 'Piano non valido' });
  }

  // Get price IDs from Redis config (set via admin panel)
  const r = getRedis();
  const configKey = `config:stripe:${plan}${annual ? ':annual' : ':monthly'}PriceId`;
  const priceId = await r.get(configKey);

  if (!priceId) {
    return res.status(400).json({
      error: `Price ID non configurato per ${plan} ${annual ? 'annuale' : 'mensile'}. Configuralo in /admin.`
    });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://aethersy-ai-mattiadeblasio94-8016s-projects.vercel.app';

  try {
    const stripe = getStripeInstance();
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: decoded.email,
      metadata: { email: decoded.email, plan, annual: String(annual) },
      success_url: `${appUrl}/dashboard?upgraded=1&plan=${plan}`,
      cancel_url: `${appUrl}/#pricing`,
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      subscription_data: {
        metadata: { email: decoded.email, plan },
      },
    });
    return res.status(200).json({ url: session.url });
  } catch (e) {
    console.error('Stripe checkout error:', e.message);
    return res.status(500).json({ error: e.message });
  }
}
