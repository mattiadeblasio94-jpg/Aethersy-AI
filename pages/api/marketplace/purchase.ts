/**
 * Marketplace Purchase API
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    return purchaseAgent(req, res);
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}

async function purchaseAgent(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { agentId, type = 'subscription', userId } = req.body;

    if (!agentId || !userId) {
      return res.status(400).json({ error: 'Missing agentId or userId' });
    }

    // Ottieni dettagli agente
    const { data: agent } = await supabase
      .from('lara_marketplace')
      .select('price_monthly, price_lifetime, creator_id')
      .eq('id', agentId)
      .single();

    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    const price = type === 'lifetime' ? agent.price_lifetime : agent.price_monthly;

    // Se gratuito, accesso diretto
    if (price === 0 || price === null) {
      await grantAccess(agentId, userId);
      return res.status(200).json({ success: true, price: 0 });
    }

    // In produzione: qui si crea sessione Stripe
    // Per ora: simula acquisto
    await supabase.from('transactions').insert({
      user_id: userId,
      amount: (price || 0) / 100,
      currency: 'eur',
      status: 'succeeded',
      product_type: type === 'lifetime' ? 'one_time_agent' : 'agent_subscription',
      metadata: { agent_id: agentId, creator_id: agent.creator_id }
    });

    // Concedi accesso
    await grantAccess(agentId, userId);

    // Aggiorna vendite totali
    await supabase
      .from('lara_marketplace')
      .update({ total_sales: supabase.raw('total_sales + 1') })
      .eq('id', agentId);

    // Notifica creator (in produzione: email/Telegram)
    await notifyCreator(agent.creator_id, agentId, userId, price);

    return res.status(200).json({ success: true, price: price / 100 });
  } catch (error) {
    console.error('Purchase failed:', error);
    return res.status(500).json({ error: 'Purchase failed' });
  }
}

async function grantAccess(agentId: string, userId: string) {
  await supabase.from('user_agents').insert({
    user_id: userId,
    agent_id: agentId,
    access_type: 'purchased',
    granted_at: new Date().toISOString()
  }).catch(() => {
    // Tabella potrebbe non esistere
  });
}

async function notifyCreator(creatorId: string, agentId: string, buyerId: string, price: number) {
  // In produzione: invia email o notifica Telegram al creator
  console.log(`Creator ${creatorId}: Agent ${agentId} sold to ${buyerId} for €${price / 100}`);
}
