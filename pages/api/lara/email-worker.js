import { Redis } from '@upstash/redis';

// Helper function per Ollama (open source)
async function ollamaGenerate({ prompt, system = "", model = "llama3.1:8b", options = {} }) {
  const ollamaBaseUrl = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
  try {
    const res = await fetch(`${ollamaBaseUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model, prompt, system, stream: false, options: { temperature: 0.7, num_predict: 2048, ...options } })
    });
    if (!res.ok) throw new Error(`Ollama error: ${res.status}`);
    const data = await res.json();
    return { content: [{ text: data.response || "" }] };
  } catch (e) {
    console.log("Ollama error:", e.message);
    return { content: [{ text: "AI non disponibile" }] };
  }
}

// OPEN SOURCE ONLY - No Anthropic

function getRedis() {
  const url = (process.env.UPSTASH_REDIS_REST_URL || '').trim();
  const token = (process.env.UPSTASH_REDIS_REST_TOKEN || '').trim();
  return new Redis({ url, token });
}

const client = null;

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
  const ollamaBaseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
  const ollamaModel = process.env.OLLAMA_MODEL || 'llama3.1:8b';

  try {
    const res = await fetch(`${ollamaBaseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: ollamaModel,
        prompt: `Migliora questa email:\n\nOggetto: ${subject}\n\nTesto: ${body}`,
        system: LARA_EMAIL_SYSTEM,
        stream: false,
        options: { temperature: 0.7, num_predict: 1000 }
      })
    });

    if (!res.ok) return body;
    const data = await res.json();
    return data.response || body;
  } catch (e) {
    console.log('Ollama error:', e.message);
    return body;
  }
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
