import { getStripeInstance } from '../../../lib/stripe';
import { verifyToken } from '../../../lib/auth';

// Price IDs da environment variables (configurati in .env.production)
const PRICE_IDS = {
  pro: {
    monthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID || 'price_1TPZeWLhc53TBuBk731c94gW',
    annual: process.env.STRIPE_PRO_ANNUAL_PRICE_ID || 'price_1TPZeXLhc53TBuBkg6BvcrPz',
  },
  business: {
    monthly: process.env.STRIPE_BUSINESS_MONTHLY_PRICE_ID || 'price_1TPZeYLhc53TBuBkOJkcNtcO',
    annual: process.env.STRIPE_BUSINESS_ANNUAL_PRICE_ID || 'price_1TPZeZLhc53TBuBk1kn5Vesk',
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const auth = req.headers.authorization?.replace('Bearer ', '');
  const decoded = auth ? verifyToken(auth) : null;
  if (!decoded) return res.status(401).json({ error: 'Non autenticato' });

  const { plan, annual = false } = req.body;
  if (!['pro', 'business', 'enterprise'].includes(plan)) {
    return res.status(400).json({ error: 'Piano non valido' });
  }

  // Enterprise: redirect to email
  if (plan === 'enterprise') {
    return res.status(200).json({ url: 'mailto:mattiadeblasio94@gmail.com?subject=Enterprise%20Aethersy-AI' });
  }

  // Get price ID from env config
  const priceId = PRICE_IDS[plan]?.[annual ? 'annual' : 'monthly'];

  if (!priceId) {
    return res.status(400).json({ error: `Price ID non configurato per ${plan}` });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://aethersy.com';

  try {
    const stripe = getStripeInstance();
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: decoded.email,
      metadata: { email: decoded.email, plan, annual: String(annual) },
      success_url: `${appUrl}/dashboard?upgraded=1&plan=${plan}`,
      cancel_url: `${appUrl}/pricing`,
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
