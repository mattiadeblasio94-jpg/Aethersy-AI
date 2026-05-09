/**
 * TELEGRAM WEBHOOK SETUP API
 * Configura il webhook di Telegram per puntare a questo endpoint
 */

export const config = {
  api: {
    bodyParser: true,
  },
}

export default async function handler(req, res) {
  // Bypass Vercel bot protection
  res.setHeader('x-vercel-protection-bypass', 'telegram-webhook-setup')

  // Proteggi endpoint - solo admin
  const { secret } = req.query;
  if (secret !== process.env.WEBHOOK_SECRET) {
    return res.status(403).json({ error: 'Accesso negato' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Metodo non consentito' });
  }

  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://aethersy.com';

  if (!BOT_TOKEN) {
    return res.status(500).json({
      error: 'TELEGRAM_BOT_TOKEN non configurato nelle variabili d\'ambiente Vercel'
    });
  }

  const webhookUrl = `${APP_URL}/api/telegram/webhook`;

  try {
    // Imposta webhook
    const setResponse = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/setWebhook?url=${encodeURIComponent(webhookUrl)}&allowed_updates=update_id,message,callback_query`,
      { method: 'GET' }
    );

    const setResult = await setResponse.json();

    if (!setResult.ok) {
      return res.status(500).json({
        success: false,
        error: setResult.description || 'Errore impostazione webhook'
      });
    }

    // Verifica webhook
    const infoResponse = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`,
      { method: 'GET' }
    );

    const infoResult = await infoResponse.json();

    return res.json({
      success: true,
      message: 'Webhook configurato con successo',
      webhookUrl,
      info: infoResult.result
    });

  } catch (error) {
    console.error('Set webhook error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
