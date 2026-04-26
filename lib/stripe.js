import Stripe from 'stripe';

let stripe;
function getStripe() {
  if (!stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error('STRIPE_SECRET_KEY non configurato');
    stripe = new Stripe(key);
  }
  return stripe;
}

export async function getRevenueForPeriod(days = 30) {
  try {
    const s = getStripe();
    const from = Math.floor(Date.now() / 1000) - days * 86400;
    const charges = await s.charges.list({ limit: 100, created: { gte: from } });
    const total = charges.data
      .filter(c => c.status === 'succeeded')
      .reduce((sum, c) => sum + c.amount, 0);
    return total / 100;
  } catch { return 0; }
}

export async function getRecentPayments(limit = 10) {
  try {
    const s = getStripe();
    const payments = await s.paymentIntents.list({ limit });
    return payments.data.map(p => ({
      id: p.id,
      amount: p.amount / 100,
      currency: p.currency,
      status: p.status,
      created: new Date(p.created * 1000).toISOString(),
    }));
  } catch { return []; }
}

export function getStripeInstance() { return getStripe(); }
