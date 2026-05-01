/**
 * Market Deploy Tool - Pubblicazione agenti nel marketplace
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);

export interface Agent {
  id: string;
  creatorId: string;
  name: string;
  description: string;
  category: string;
  priceMonthly: number;
  priceLifetime?: number;
  version: string;
  configJson: Record<string, any>;
  codeBundleUrl?: string;
  requirements: string[];
  toolsAvailable: string[];
  totalSales: number;
  ratingAvg: number;
  isActive: boolean;
  status: 'draft' | 'published' | 'archived';
  createdAt: string;
  updatedAt: string;
}

export interface CreateAgentOptions {
  name: string;
  description: string;
  category: 'sales' | 'content' | 'finance' | 'admin' | 'dev' | 'marketing';
  priceMonthly?: number;
  priceLifetime?: number;
  version?: string;
  configJson?: Record<string, any>;
  requirements?: string[];
  toolsAvailable?: string[];
}

export interface AgentReview {
  id: string;
  agentId: string;
  userId: string;
  rating: number;
  comment: string;
  createdAt: string;
}

/**
 * Crea nuovo agente
 */
export async function createAgent(userId: string, options: CreateAgentOptions): Promise<Agent> {
  const agentData = {
    creator_id: userId,
    name: options.name,
    description: options.description,
    category: options.category,
    price_monthly: options.priceMonthly || 0,
    price_lifetime: options.priceLifetime,
    version: options.version || '1.0.0',
    config_json: options.configJson || {},
    requirements: options.requirements || [],
    tools_available: options.toolsAvailable || [],
    status: 'draft',
    is_active: true,
    total_sales: 0,
    rating_avg: 0
  };

  const { data, error } = await supabase
    .from('lara_marketplace')
    .insert(agentData)
    .select()
    .single();

  if (error) throw error;

  return mapAgent(data);
}

/**
 * Pubblica agente nel marketplace
 */
export async function publishAgent(agentId: string, userId: string): Promise<Agent | null> {
  const { data: agent } = await supabase
    .from('lara_marketplace')
    .select('*')
    .eq('id', agentId)
    .eq('creator_id', userId)
    .single();

  if (!agent) return null;

  const { data } = await supabase
    .from('lara_marketplace')
    .update({
      status: 'published',
      updated_at: new Date().toISOString()
    })
    .eq('id', agentId)
    .select()
    .single();

  return mapAgent(data);
}

/**
 * Ritira agente dal marketplace
 */
export async function unpublishAgent(agentId: string, userId: string): Promise<Agent | null> {
  const { data } = await supabase
    .from('lara_marketplace')
    .update({
      status: 'draft',
      updated_at: new Date().toISOString()
    })
    .eq('id', agentId)
    .eq('creator_id', userId)
    .select()
    .single();

  return mapAgent(data);
}

/**
 * Ottieni agenti per categoria
 */
export async function getAgents(
  filters?: {
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    search?: string;
    limit?: number;
  },
  publishedOnly = true
): Promise<Agent[]> {
  let query = supabase.from('lara_marketplace').select('*');

  if (publishedOnly) {
    query = query.eq('status', 'published');
  }

  if (filters?.category) {
    query = query.eq('category', filters.category);
  }

  if (filters?.minPrice !== undefined) {
    query = query.gte('price_monthly', filters.minPrice);
  }

  if (filters?.maxPrice !== undefined) {
    query = query.lte('price_monthly', filters.maxPrice);
  }

  if (filters?.search) {
    query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
  }

  query = query.order('rating_avg', { ascending: false }).limit(filters?.limit || 50);

  const { data, error } = await query;
  if (error) throw error;

  return data.map(mapAgent);
}

/**
 * Ottieni agente per ID
 */
export async function getAgent(agentId: string): Promise<Agent | null> {
  const { data } = await supabase
    .from('lara_marketplace')
    .select('*')
    .eq('id', agentId)
    .single();

  if (!data) return null;

  return mapAgent(data);
}

/**
 * Ottieni agenti di un creator
 */
export async function getCreatorAgents(creatorId: string): Promise<Agent[]> {
  const { data } = await supabase
    .from('lara_marketplace')
    .select('*')
    .eq('creator_id', creatorId)
    .order('created_at', { ascending: false });

  return data.map(mapAgent);
}

/**
 * Aggiorna agente
 */
export async function updateAgent(
  agentId: string,
  updates: Partial<CreateAgentOptions>,
  userId: string
): Promise<Agent | null> {
  const updateData: any = { updated_at: new Date().toISOString() };

  if (updates.name) updateData.name = updates.name;
  if (updates.description) updateData.description = updates.description;
  if (updates.category) updateData.category = updates.category;
  if (updates.priceMonthly !== undefined) updateData.price_monthly = updates.priceMonthly;
  if (updates.priceLifetime !== undefined) updateData.price_lifetime = updates.priceLifetime;
  if (updates.version) updateData.version = updates.version;
  if (updates.configJson) updateData.config_json = updates.configJson;
  if (updates.requirements) updateData.requirements = updates.requirements;
  if (updates.toolsAvailable) updateData.tools_available = updates.toolsAvailable;

  const { data } = await supabase
    .from('lara_marketplace')
    .update(updateData)
    .eq('id', agentId)
    .eq('creator_id', userId)
    .select()
    .single();

  if (!data) return null;

  return mapAgent(data);
}

/**
 * Elimina agente
 */
export async function deleteAgent(agentId: string, userId: string): Promise<boolean> {
  const { error } = await supabase
    .from('lara_marketplace')
    .delete()
    .eq('id', agentId)
    .eq('creator_id', userId);

  return !error;
}

/**
 * Acquista agente
 */
export async function purchaseAgent(
  agentId: string,
  buyerId: string,
  paymentMethod: 'subscription' | 'lifetime'
): Promise<{ ok: boolean; error?: string }> {
  const { data: agent } = await supabase
    .from('lara_marketplace')
    .select('price_monthly, price_lifetime, creator_id')
    .eq('id', agentId)
    .single();

  if (!agent) {
    return { ok: false, error: 'Agent not found' };
  }

  const price = paymentMethod === 'lifetime' ? agent.price_lifetime : agent.price_monthly;
  if (price === 0) {
    // Agente gratuito - accesso diretto
    await grantAgentAccess(agentId, buyerId);
    return { ok: true };
  }

  // In produzione: crea transazione Stripe
  // Qui: simula acquisto
  await supabase.from('transactions').insert({
    user_id: buyerId,
    amount: (price || 0) / 100,
    currency: 'eur',
    status: 'succeeded',
    product_type: paymentMethod === 'lifetime' ? 'one_time_agent' : 'agent_subscription',
    metadata: { agent_id: agentId, creator_id: agent.creator_id }
  });

  await grantAgentAccess(agentId, buyerId);

  // Aggiorna vendite totali
  await supabase
    .from('lara_marketplace')
    .update({ total_sales: supabase.raw('total_sales + 1') })
    .eq('id', agentId);

  return { ok: true };
}

/**
 * Concede accesso ad agente
 */
async function grantAgentAccess(agentId: string, userId: string): Promise<void> {
  await supabase.from('user_agents').insert({
    user_id: userId,
    agent_id: agentId,
    access_type: 'purchased',
    granted_at: new Date().toISOString()
  }).catch(() => {
    // Tabella potrebbe non esistere
  });
}

/**
 * Aggiungi recensione
 */
export async function addReview(
  agentId: string,
  userId: string,
  rating: number,
  comment: string
): Promise<AgentReview> {
  const { data } = await supabase
    .from('agent_reviews')
    .insert({
      agent_id: agentId,
      user_id: userId,
      rating: Math.min(5, Math.max(1, rating)),
      comment
    })
    .select()
    .single();

  // Aggiorna rating medio
  const { data: stats } = await supabase
    .from('agent_reviews')
    .select('rating')
    .eq('agent_id', agentId);

  const avgRating = stats?.reduce((sum, r) => sum + r.rating, 0) / (stats?.length || 1) || 0;

  await supabase
    .from('lara_marketplace')
    .update({ rating_avg: parseFloat(avgRating.toFixed(2)) })
    .eq('id', agentId);

  return {
    id: data.id,
    agentId: data.agent_id,
    userId: data.user_id,
    rating: data.rating,
    comment: data.comment,
    createdAt: data.created_at
  };
}

/**
 * Ottieni recensioni agente
 */
export async function getAgentReviews(agentId: string, limit = 10): Promise<AgentReview[]> {
  const { data } = await supabase
    .from('agent_reviews')
    .select('*')
    .eq('agent_id', agentId)
    .order('created_at', { ascending: false })
    .limit(limit);

  return data?.map(r => ({
    id: r.id,
    agentId: r.agent_id,
    userId: r.user_id,
    rating: r.rating,
    comment: r.comment,
    createdAt: r.created_at
  })) || [];
}

/**
 * Ottieni agenti acquistati da utente
 */
export async function getPurchasedAgents(userId: string): Promise<Agent[]> {
  const { data } = await supabase
    .from('user_agents')
    .select('agent_id')
    .eq('user_id', userId);

  if (!data || data.length === 0) return [];

  const agentIds = data.map(d => d.agent_id);

  const { data: agents } = await supabase
    .from('lara_marketplace')
    .select('*')
    .in('id', agentIds);

  return agents?.map(mapAgent) || [];
}

/**
 * Mappa dati DB a interfaccia Agent
 */
function mapAgent(data: any): Agent {
  return {
    id: data.id,
    creatorId: data.creator_id,
    name: data.name,
    description: data.description,
    category: data.category,
    priceMonthly: data.price_monthly,
    priceLifetime: data.price_lifetime,
    version: data.version,
    configJson: data.config_json || {},
    codeBundleUrl: data.code_bundle_url,
    requirements: data.requirements || [],
    toolsAvailable: data.tools_available || [],
    totalSales: data.total_sales,
    ratingAvg: data.rating_avg,
    isActive: data.is_active,
    status: data.status,
    createdAt: data.created_at,
    updatedAt: data.updated_at
  };
}

/**
 * Genera bundle codice agente
 */
export async function generateAgentBundle(agentId: string): Promise<{ url: string; expiresAt: string }> {
  const { data: agent } = await supabase
    .from('lara_marketplace')
    .select('name, config_json, requirements, tools_available')
    .eq('id', agentId)
    .single();

  if (!agent) throw new Error('Agent not found');

  // Crea struttura bundle
  const bundle = {
    name: agent.name,
    version: '1.0.0',
    config: agent.config_json,
    requirements: agent.requirements,
    tools: agent.tools_available,
    generated: new Date().toISOString()
  };

  // In produzione: upload a R2/S3 e genera URL presigned
  const bundleId = `bundle_${agentId}_${Date.now()}`;
  const url = `https://storage.aethersy.com/bundles/${bundleId}.json`;

  await supabase
    .from('lara_marketplace')
    .update({ code_bundle_url: url })
    .eq('id', agentId);

  return {
    url,
    expiresAt: new Date(Date.now() + 3600000).toISOString() // 1 ora
  };
}
