import { getStripeInstance } from '../../lib/stripe';
import { updateUserPlan } from '../../lib/auth';
import { syncWebSubscription } from '../../lib/auth-sync';
import { Redis } from '@upstash/redis';

export const config = { api: { bodyParser: false } };

async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function getRedis() {
  const url = (process.env.UPSTASH_REDIS_REST_URL || '').trim();
  const token = (process.env.UPSTASH_REDIS_REST_TOKEN || '').trim();
  return new Redis({ url, token });
}

const PLAN_MAP = {
  pro: 'pro',
  business: 'business',
  enterprise: 'enterprise',
};

const PLAN_PRICES = {
  pro: 49,
  business: 199,
  enterprise: 999,
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const sig = req.headers['stripe-signature'];
  const rawBody = await getRawBody(req);

  let event;
  try {
    event = getStripeInstance().webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  const r = getRedis();

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const email = session.metadata?.email || session.customer_email;
        const plan = session.metadata?.plan || 'pro';
        const amount = session.amount_total ? session.amount_total / 100 : PLAN_PRICES[plan] || 0;

        if (email && plan && PLAN_MAP[plan]) {
          await updateUserPlan(email, PLAN_MAP[plan]);
          await syncWebSubscription(email, PLAN_MAP[plan]);

          // Save to revenue tracking
          await r.lpush('stripe:revenue', JSON.stringify({
            type: 'checkout',
            email,
            plan: PLAN_MAP[plan],
            amount,
            timestamp: Date.now()
          }));
          await r.ltrim('stripe:revenue', 0, 999); // Keep last 1000

          console.log(`✅ Plan updated: ${email} → ${PLAN_MAP[plan]}`);
        }
        break;
      }
      case 'customer.subscription.updated': {
        const sub = event.data.object;
        const email = sub.metadata?.email;
        const plan = sub.metadata?.plan;
        if (email && plan && PLAN_MAP[plan]) {
          const status = sub.status;
          if (status === 'active' || status === 'trialing') {
            await updateUserPlan(email, PLAN_MAP[plan]);
            await syncWebSubscription(email, PLAN_MAP[plan]);
          } else if (status === 'canceled' || status === 'unpaid' || status === 'past_due') {
            await updateUserPlan(email, 'free');
          }
        }
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        const email = sub.metadata?.email;
        if (email) {
          await updateUserPlan(email, 'free');
          await r.lpush('stripe:revenue', JSON.stringify({
            type: 'canceled',
            email,
            timestamp: Date.now()
          }));
          await r.ltrim('stripe:revenue', 0, 999);
          console.log(`⬇️ Plan downgraded to free: ${email}`);
        }
        break;
      }
      case 'payment_intent.succeeded': {
        const pi = event.data.object;
        const email = pi.receipt_email || pi.metadata?.email;
        const amount = pi.amount / 100;

        if (email) {
          await r.lpush('stripe:revenue', JSON.stringify({
            type: 'payment',
            email,
            amount,
            timestamp: Date.now()
          }));
          await r.ltrim('stripe:revenue', 0, 999);
        }
        console.log(`💰 Payment succeeded: ${pi.id} — €${amount}`);
        break;
      }
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        const email = invoice.customer_email;
        const amount = invoice.amount_paid / 100;

        if (email && amount > 0) {
          await r.lpush('stripe:revenue', JSON.stringify({
            type: 'invoice',
            email,
            amount,
            timestamp: Date.now()
          }));
          await r.ltrim('stripe:revenue', 0, 999);
        }
        break;
      }
    }
  } catch (err) {
    console.error('Webhook handler error:', err.message);
  }

  res.status(200).json({ received: true });
}
