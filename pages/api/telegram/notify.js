import { Redis } from '@upstash/redis';

function getRedis() {
  const url = (process.env.UPSTASH_REDIS_REST_URL || '').trim();
  const token = (process.env.UPSTASH_REDIS_REST_TOKEN || '').trim();
  return new Redis({ url, token });
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const { telegramId, type } = req.query;
  if (!telegramId || !type) return res.status(400).json({ error: 'Parametri mancanti' });

  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return res.status(500).json({ error: 'TELEGRAM_BOT_TOKEN non configurato' });

  let text = '';
  if (type === 'approved') {
    text = `🎉 Accesso APPROVATO!\n\n` +
      `✅ Il tuo account Telegram ora ha accesso PRO gratuito a Aethersy-AI.\n\n` +
      `Puoi usare tutti i comandi premium:\n` +
      `/cerca, /deep, /monetizza, /progetto, ecc.\n\n` +
      `Accedi alla dashboard: https://aethersy.com/dashboard`;
  } else if (type === 'rejected') {
    text = `⚠️ Richiesta di accesso\n\n` +
      `La tua richiesta di accesso PRO è stata rifiutata.\n` +
      `Per maggiori informazioni contatta l'admin.`;
  } else if (type === 'granted') {
    text = `🎁 Accesso GRATUITO Attivato!\n\n` +
      `✅ Un admin ti ha concesso accesso PRO gratuito a Aethersy-AI.\n\n` +
      `Puoi usare tutti i comandi premium:\n` +
      `/cerca, /deep, /monetizza, /progetto, /finance, /crypto\n\n` +
      `Accedi alla dashboard: https://aethersy.com/dashboard`;
  } else {
    return res.status(400).json({ error: 'Tipo notifica non valido' });
  }

  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: telegramId, text }),
    });
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
