/**
 * Admin Config API - Gestione configurazione piattaforma
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    return getConfig(req, res);
  } else if (req.method === 'POST') {
    return saveConfig(req, res);
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}

async function getConfig(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { data } = await supabase.from('platform_config').select('key, value');

    const config: Record<string, string> = {};
    data?.forEach(row => {
      config[row.key] = row.value;
    });

    return res.status(200).json(config);
  } catch (error) {
    console.error('Failed to fetch config:', error);
    return res.status(500).json({ error: 'Failed to fetch config' });
  }
}

async function saveConfig(req: NextApiRequest, res: NextApiResponse) {
  try {
    const config = req.body as Record<string, string>;

    // Verifica auth admin (in produzione: verifica sessione/token)
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // Per sviluppo: accetta senza auth
      console.warn('Admin config saved without auth (dev mode)');
    }

    // Salva ogni chiave
    const updates = Object.entries(config).map(async ([key, value]) => {
      await supabase
        .from('platform_config')
        .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });
    });

    await Promise.all(updates);

    // Emetti aggiornamento WebSocket (se server è attivo)
    try {
      await fetch('http://localhost:3001/api/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'config-change', data: config })
      }).catch(() => {}); // Ignora se server WS non è attivo
    } catch {}

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Failed to save config:', error);
    return res.status(500).json({ error: 'Failed to save config' });
  }
}
