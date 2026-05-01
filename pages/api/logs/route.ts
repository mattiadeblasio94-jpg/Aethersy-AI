/**
 * Agent Logs API
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    return getLogs(req, res);
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}

async function getLogs(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { action, limit = 50, userId, sessionId } = req.query;

    if (action === 'recent') {
      // Log recenti per dashboard
      let query = supabase
        .from('lara_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(Number(limit));

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data } = await query;

      const logs = (data || []).map(d => ({
        id: d.id,
        sessionId: d.session_id || `log-${d.id}`,
        userId: d.user_id,
        action: d.action,
        phase: d.phase,
        status: d.status,
        input: d.input,
        output: d.output,
        duration: d.duration_ms,
        timestamp: d.created_at
      }));

      return res.status(200).json({ logs });
    }

    if (action === 'session' && sessionId) {
      // Log per sessione specifica
      const { data } = await supabase
        .from('lara_logs')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      return res.status(200).json({ logs: data || [] });
    }

    return res.status(400).json({ error: 'Invalid action' });
  } catch (error) {
    console.error('Failed to fetch logs:', error);
    return res.status(500).json({ error: 'Failed to fetch logs' });
  }
}
