/**
 * Marketplace API - Lista agenti
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { category, search, limit = 50 } = req.query;

    let query = supabase
      .from('lara_marketplace')
      .select('*')
      .eq('status', 'published')
      .eq('is_active', true)
      .order('rating_avg', { ascending: false })
      .limit(Number(limit));

    if (category) {
      query = query.eq('category', category);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data, error } = await query;

    if (error) throw error;

    const agents = (data || []).map((d: any) => ({
      id: d.id,
      name: d.name,
      description: d.description,
      category: d.category,
      priceMonthly: d.price_monthly || 0,
      priceLifetime: d.price_lifetime,
      ratingAvg: d.rating_avg || 0,
      totalSales: d.total_sales || 0,
      creatorId: d.creator_id,
      version: d.version,
      features: d.features || []
    }));

    return res.status(200).json({ agents });
  } catch (error: any) {
    console.error('Marketplace fetch error:', error);
    return res.status(500).json({ error: 'Failed to fetch marketplace' });
  }
}
