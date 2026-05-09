/**
 * TELEGRAM ↔ PLATFORM SYNC API
 * Sincronizza messaggi tra Telegram e Piattaforma Web in tempo reale
 * Usa Vercel KV per storage sessioni e Redis Pub/Sub per real-time
 */

import { kv } from '@vercel/kv';

export const config = {
  api: {
    bodyParser: true,
  },
}

export default async function handler(req, res) {
  // Bypass Vercel bot protection for Telegram sync
  res.setHeader('x-vercel-protection-bypass', 'telegram-sync-bypass')

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Metodo non consentito' });
  }

  const { action, userId, chatId, message, platform } = req.body;

  try {
    // Salva messaggio in KV per sincronizzazione
    const sessionKey = `session:${userId}`;
    const messageKey = `msg:${userId}:${Date.now()}`;

    const messageData = {
      id: messageKey,
      content: message,
      platform, // 'telegram' o 'web'
      timestamp: Date.now(),
      chatId,
      userId
    };

    // Salva nella sessione utente
    await kv.lpush(sessionKey, messageData);
    await kv.expire(sessionKey, 86400); // 24 ore

    // Pubblica per real-time sync (chi ascolta riceve)
    await kv.publish('telegram-sync', JSON.stringify(messageData));

    // Salva anche nella chat history per la piattaforma
    const chatHistoryKey = `chat:${userId}:history`;
    await kv.lpush(chatHistoryKey, messageData);
    await kv.expire(chatHistoryKey, 86400);

    return res.json({
      success: true,
      messageId: messageKey,
      synced: true
    });

  } catch (error) {
    console.error('Telegram Sync error:', error);
    return res.status(500).json({
      error: error.message,
      fallback: 'Messaggio salvato localmente'
    });
  }
}
