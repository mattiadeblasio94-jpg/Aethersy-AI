/**
 * TELEGRAM SEND API
 * Invia messaggi da piattaforma a Telegram
 */

export const config = { api: { bodyParser: true } };

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Metodo non consentito' });
  }

  const { chatId, message, parseMode = 'HTML' } = req.body;

  if (!chatId || !message) {
    return res.status(400).json({ error: 'chatId e message richiesti' });
  }

  if (!BOT_TOKEN) {
    return res.status(500).json({ error: 'Telegram bot token non configurato' });
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message.slice(0, 4096),
        parse_mode: parseMode
      })
    });

    const result = await response.json();

    if (result.ok) {
      return res.json({
        success: true,
        messageId: result.result.message_id,
        chatId
      });
    } else {
      return res.status(500).json({
        success: false,
        error: result.description || 'Errore invio Telegram'
      });
    }

  } catch (error) {
    console.error('Telegram Send error:', error);
    return res.status(500).json({
      error: error.message,
      success: false
    });
  }
}
