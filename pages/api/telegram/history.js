/**
 * TELEGRAM HISTORY API
 * Recupera la cronologia messaggi per la piattaforma web
 */

import { kv } from '@vercel/kv';

export const config = { api: { bodyParser: true } };

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Metodo non consentito' });
  }

  const { userId, limit = 50 } = req.query;

  if (!userId) {
    return res.status(400).json({ error: 'userId richiesto' });
  }

  try {
    const chatHistoryKey = `chat:${userId}:history`;
    const messages = await kv.lrange(chatHistoryKey, 0, parseInt(limit) - 1);

    return res.json({
      success: true,
      messages: messages || [],
      count: messages?.length || 0
    });

  } catch (error) {
    console.error('Telegram History error:', error);
    return res.status(500).json({
      error: error.message,
      messages: []
    });
  }
}
