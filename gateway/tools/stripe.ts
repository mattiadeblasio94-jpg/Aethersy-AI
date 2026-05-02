/**
 * Stripe Tool - Gestione pagamenti e abbonamenti
 */

import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-03-25.dahlia' });

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  features: string[];
  trialDays?: number;
}

export const PLANS: Record<string, SubscriptionPlan> = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    currency: 'EUR',
    interval: 'month',
    features: ['100 messaggi/mese', '1GB storage', 'AI base'],
    trialDays: 0
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 2900,
    currency: 'EUR',
    interval: 'month',
    features: ['1000 messaggi/mese', '10GB storage', 'AI avanzata', 'Priority support'],
    trialDays: 14
  },
  business: {
    id: 'business',
    name: 'Business',
    price: 9900,
    currency: 'EUR',
    interval: 'month',
    features: ['Messaggi illimitati', '100GB storage', 'AI personalizzata', 'API access', 'Dedicated support'],
    trialDays: 14
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    price: 29900,
    currency: 'EUR',
    interval: 'month',
    features: ['Tutto illimitato', 'On-premise deploy', 'Custom AI training', 'SLA 99.9%', 'Account manager'],
    trialDays: 30
  }
};

/**
 * Crea customer Stripe
 */
export async function createCustomer(email: string, userId: string, name?: string): Promise<string> {
  const customer = await stripe.customers.create({
    email,
    name,
    metadata: { user_id: userId }
  });

  await supabase
    .from('lara_users')
    .update({ stripe_customer_id: customer.id })
    .eq('user_id', userId);

  return customer.id;
}

/**
 * Crea sessione checkout per abbonamento
 */
export async function createCheckoutSession(
  userId: string,
  planId: string,
  successUrl: string,
  cancelUrl: string
): Promise<string> {
  const { data: user } = await supabase
    .from('lara_users')
    .select('stripe_customer_id, email')
    .eq('user_id', userId)
    .single();

  let customerId = user?.stripe_customer_id;

  if (!customerId) {
    customerId = await createCustomer(user?.email || '', userId);
  }

  const plan = PLANS[planId];
  if (!plan || plan.price === 0) {
    throw new Error('Invalid plan');
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: plan.currency.toLowerCase(),
          product_data: {
            name: plan.name,
            description: plan.features.join(', ')
          },
          unit_amount: plan.price,
          recurring: {
            interval: plan.interval
          }
        },
        quantity: 1
      }
    ],
    mode: 'subscription',
    success_url: successUrl,
    cancel_url: cancelUrl,
    subscription_data: {
      trial_period_days: plan.trialDays
    },
    metadata: {
      user_id: userId,
      plan_id: planId
    }
  });

  return session.url!;
}

/**
 * Gestisce webhook Stripe
 */
export async function handleWebhook(signature: string, payload: Buffer): Promise<{ ok: boolean; event?: any }> {
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  try {
    const event = stripe.webhooks.constructEvent(payload, signature, endpointSecret);

    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.user_id;

        if (userId) {
          const planId = subscription.items.data[0]?.price?.metadata?.plan_id || 'pro';
          const status = subscription.status === 'active' ? 'active' :
                        subscription.status === 'trialing' ? 'trialing' : 'inactive';

          await supabase
            .from('lara_users')
            .update({
              subscription_status: status,
              plan_level: planId,
              stripe_subscription_id: subscription.id,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', userId);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.user_id;

        if (userId) {
          await supabase
            .from('lara_users')
            .update({
              subscription_status: 'cancelled',
              plan_level: 'free',
              stripe_subscription_id: null,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', userId);
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        const userId = invoice.metadata?.user_id;

        if (userId) {
          await supabase.from('transactions').insert({
            user_id: userId,
            stripe_payment_intent_id: (invoice as any).payment_intent || invoice.id,
            amount: invoice.amount_paid! / 100,
            currency: invoice.currency.toLowerCase(),
            status: 'succeeded',
            product_type: 'subscription',
            metadata: { invoice_id: invoice.id },
            created_at: new Date(invoice.created * 1000).toISOString()
          });
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const userId = invoice.metadata?.user_id;

        if (userId) {
          await supabase.from('transactions').insert({
            user_id: userId,
            stripe_payment_intent_id: (invoice as any).payment_intent || invoice.id,
            amount: invoice.amount_due! / 100,
            currency: invoice.currency.toLowerCase(),
            status: 'failed',
            product_type: 'subscription',
            metadata: { invoice_id: invoice.id },
            created_at: new Date(invoice.created * 1000).toISOString()
          });

          await supabase
            .from('lara_users')
            .update({ subscription_status: 'past_due' })
            .eq('user_id', userId);
        }
        break;
      }
    }

    return { ok: true, event };
  } catch (error) {
    console.error('Webhook error:', error);
    return { ok: false };
  }
}

/**
 * Crea fattura one-time
 */
export async function createInvoice(
  userId: string,
  amount: number,
  description: string,
  currency = 'EUR'
): Promise<{ invoiceId: string; hostedInvoiceUrl: string }> {
  const { data: user } = await supabase
    .from('lara_users')
    .select('stripe_customer_id')
    .eq('user_id', userId)
    .single();

  let customerId = user?.stripe_customer_id;
  if (!customerId) {
    const { email } = await supabase
      .from('lara_users')
      .select('email')
      .eq('user_id', userId)
      .single()
      .then(r => r.data) || { email: '' };

    customerId = await createCustomer(email || '', userId);
  }

  const invoice = await stripe.invoices.create({
    customer: customerId,
    auto_advance: true,
    collection_method: 'send_invoice',
    days_until_due: 30,
    currency: currency.toLowerCase(),
    description,
    metadata: { user_id: userId }
  });

  await stripe.invoiceItems.create({
    customer: customerId,
    amount,
    currency: currency.toLowerCase(),
    description,
    invoice: invoice.id
  });

  const finalizedInvoice = await stripe.invoices.finalizeInvoice(invoice.id);

  await supabase.from('transactions').insert({
    user_id: userId,
    amount: amount / 100,
    currency: currency.toLowerCase(),
    status: 'pending',
    product_type: 'one_time',
    metadata: { invoice_id: invoice.id },
    created_at: new Date().toISOString()
  });

  return {
    invoiceId: invoice.id,
    hostedInvoiceUrl: finalizedInvoice.hosted_invoice_url!
  };
}

/**
 * Ottieni stato abbonamento utente
 */
export async function getSubscriptionStatus(userId: string): Promise<{
  plan: string;
  status: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd: boolean;
}> {
  const { data: user } = await supabase
    .from('lara_users')
    .select('plan_level, subscription_status, stripe_subscription_id')
    .eq('user_id', userId)
    .single();

  if (!user?.stripe_subscription_id) {
    return {
      plan: user?.plan_level || 'free',
      status: user?.subscription_status || 'inactive',
      cancelAtPeriodEnd: false
    };
  }

  try {
    const subscription = await stripe.subscriptions.retrieve(user.stripe_subscription_id);
    const sub = subscription as any;

    return {
      plan: user.plan_level || 'free',
      status: subscription.status,
      currentPeriodEnd: new Date((sub.current_period_end || 0) * 1000).toISOString(),
      cancelAtPeriodEnd: subscription.cancel_at_period_end
    };
  } catch (error) {
    return {
      plan: user?.plan_level || 'free',
      status: 'error',
      cancelAtPeriodEnd: false
    };
  }
}

/**
 * Crea portal per gestione abbonamento
 */
export async function createPortalSession(userId: string, returnUrl: string): Promise<string> {
  const { data: user } = await supabase
    .from('lara_users')
    .select('stripe_customer_id')
    .eq('user_id', userId)
    .single();

  if (!user?.stripe_customer_id) {
    throw new Error('Customer not found');
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: user.stripe_customer_id,
    return_url: returnUrl
  });

  return session.url;
}

/**
 * Upgrade/Downgrade piano
 */
export async function updateSubscription(
  userId: string,
  newPlanId: string
): Promise<{ ok: boolean; error?: string }> {
  const { data: user } = await supabase
    .from('lara_users')
    .select('stripe_subscription_id')
    .eq('user_id', userId)
    .single();

  if (!user?.stripe_subscription_id) {
    return { ok: false, error: 'No active subscription' };
  }

  const newPlan = PLANS[newPlanId];
  if (!newPlan) {
    return { ok: false, error: 'Invalid plan' };
  }

  try {
    // Trova price ID per il nuovo piano
    const prices = await stripe.prices.list({
      product: process.env.STRIPE_PRODUCT_ID,
      active: true
    });

    const newPrice = prices.data.find(p =>
      p.unit_amount === newPlan.price &&
      p.currency === newPlan.currency.toLowerCase() &&
      p.recurring?.interval === newPlan.interval
    );

    if (!newPrice) {
      return { ok: false, error: 'Price not found' };
    }

    await stripe.subscriptions.update(user.stripe_subscription_id, {
      items: [{ id: user.stripe_subscription_id, price: newPrice.id }],
      proration_behavior: 'create_prorations'
    });

    await supabase
      .from('lara_users')
      .update({ plan_level: newPlanId, updated_at: new Date().toISOString() })
      .eq('user_id', userId);

    return { ok: true };
  } catch (error: any) {
    return { ok: false, error: error.message };
  }
}
