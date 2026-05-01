/**
 * Marketplace Agents API
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    return getAgents(req, res);
  } else if (req.method === 'POST') {
    return createAgent(req, res);
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}

async function getAgents(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { category, search, limit = 50 } = req.query;

    let query = supabase
      .from('lara_marketplace')
      .select('*')
      .eq('status', 'published')
      .order('rating_avg', { ascending: false })
      .limit(Number(limit));

    if (category) {
      query = query.eq('category', category);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data } = await query;

    const agents = (data || []).map(d => ({
      id: d.id,
      name: d.name,
      description: d.description,
      category: d.category,
      priceMonthly: d.price_monthly,
      priceLifetime: d.price_lifetime,
      ratingAvg: d.rating_avg,
      totalSales: d.total_sales,
      creatorId: d.creator_id,
      toolsAvailable: d.tools_available || [],
      version: d.version
    }));

    return res.status(200).json({ agents });
  } catch (error) {
    console.error('Failed to fetch agents:', error);
    return res.status(500).json({ error: 'Failed to fetch agents' });
  }
}

async function createAgent(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { name, description, category, priceMonthly, tools } = req.body;

    if (!name || !description || !category) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // In produzione: verifica auth utente
    const userId = req.body.userId || 'anonymous';

    const { data, error } = await supabase
      .from('lara_marketplace')
      .insert({
        creator_id: userId,
        name,
        description,
        category,
        price_monthly: priceMonthly || 0,
        tools_available: tools || [],
        version: '1.0.0',
        status: 'draft'
      })
      .select()
      .single();

    if (error) throw error;

    return res.status(201).json({
      id: data.id,
      name: data.name,
      status: data.status
    });
  } catch (error) {
    console.error('Failed to create agent:', error);
    return res.status(500).json({ error: 'Failed to create agent' });
  }
}
