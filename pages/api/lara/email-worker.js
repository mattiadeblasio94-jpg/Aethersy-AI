import { Redis } from '@upstash/redis';
import Anthropic from '@anthropic-ai/sdk';

function getRedis() {
  const url = (process.env.UPSTASH_REDIS_REST_URL || '').trim();
  const token = (process.env.UPSTASH_REDIS_REST_TOKEN || '').trim();
  return new Redis({ url, token });
}

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || '' });

// LARA_SYSTEM_PROMPT for email processing
const LARA_EMAIL_SYSTEM = `Sei Lara, l'assistente AI di Aethersy AI Forge Pro.
Stai elaborando email da inviare per conto degli utenti.

COMPITI:
1. Rivedi e migliora il testo dell'email se necessario
2. Assicurati che sia professionale e chiara
3. Aggiungi una firma appropriata
4. Gestisci casi speciali (follow-up, risposte, ecc.)

FORMATO OUTPUT:
Restituisci SOLO il testo finale dell'email, pronto per l'invio.`;

async function processEmailQueue() {
  const r = getRedis();
  if (!r) {
    console.error('Redis non disponibile');
    return;
  }

  // Get pending emails
  const pending = await r.lrange('lara:email:queue', 0, 9);
  if (!pending.length) {
    console.log('Nessuna email in coda');
    return;
  }

  for (const item of pending) {
    try {
      const emailReq = JSON.parse(item);
      const { telegramId, to, subject, body, timestamp } = emailReq;

      console.log(`Processing email for Telegram user ${telegramId}`);

      // Get user's Google credentials
      const googleCreds = await r.get(`telegram:google:${telegramId}`);
      if (!googleCreds) {
        console.error(`Nessuna credenziale Google per ${telegramId}`);
        await tgSend(telegramId, `⚠️ Devi collegare Google con /google connect prima di inviare email.`);
        continue;
      }

      const creds = JSON.parse(googleCreds);

      // Use AI to improve email
      const improvedEmail = await improveEmail(body, subject);

      // Send email via Gmail API
      const sendResult = await sendViaGmail(creds, to, subject, improvedEmail);

      // Notify user
      await tgSend(telegramId, `✅ Email inviata!\n\n📧 A: ${to}\n📝 Oggetto: ${subject}\n📬 Message ID: ${sendResult.id}`);

      // Remove from queue
      await r.lrem('lara:email:queue', 1, item);

    } catch (e) {
      console.error('Error processing email:', e.message);
    }
  }
}

async function improveEmail(body, subject) {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1000,
    system: LARA_EMAIL_SYSTEM,
    messages: [
      {
        role: 'user',
        content: `Migliora questa email:\n\nOggetto: ${subject}\n\nTesto: ${body}`
      }
    ],
  });

  return response.content[0].text;
}

async function sendViaGmail(creds, to, subject, body) {
  const message = [
    'Content-Type: text/plain; charset="UTF-8"',
    'MIME-Version: 1.0',
    'Content-Transfer-Encoding: 7bit',
    `To: ${to}`,
    `Subject: ${subject}`,
    '',
    body,
  ].join('\n');

  const encodedMessage = Buffer.from(message)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${creds.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ raw: encodedMessage }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Errore invio email');
  }

  return response.json();
}

async function tgSend(chatId, text) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text: String(text).slice(0, 4000) }),
  });
}

// Export for cron/scheduled execution
export async function runEmailWorker() {
  await processEmailQueue();
}

// For manual trigger via API
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Metodo non consentito' });
  }

  try {
    await processEmailQueue();
    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
