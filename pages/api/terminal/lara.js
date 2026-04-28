// OPEN SOURCE ONLY - No Anthropic

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

import { Redis } from '@upstash/redis';

export const config = { api: { bodyParser: true } };

const client = null;

// System prompt for autonomous terminal copilot
const TERMINAL_COPILOT_SYSTEM = `Sei il copilota AI del terminale Aethersy AI Forge Pro.

RUOLO:
- Esegui comandi e operazioni di sviluppo software in modo autonomo
- Analizza richieste e determina le azioni necessarie
- Fornisci output strutturato e eseguibile

CAPACITÀ:
1. GENERAZIONE CODICE - Crea file completi e funzionanti
2. ANALISI PROGETTO - Leggi e comprendi strutture esistenti
3. DEBUG - Trova e fixa errori
4. REFACTOR - Migliora codice esistente
5. TEST - Crea test comprehensivi
6. DOCUMENTAZIONE - Aggiungi docs e commenti

FORMATO OUTPUT:
Usa sempre questo formato strutturato:

## AZIONE
[cosa stai per fare]

## COMANDI
\`\`\`bash
[comandi da eseguire]
\`\`\`

## CODICE
\`\`\`[language]
[codice completo]
\`\`\`

## RESULT
[risultato atteso]

REGOLE:
- Sii conciso ma completo
- Includi sempre comandi di installazione se necessari
- Gestisci gli errori in modo elegante
- Mantieni compatibilità con Next.js 14 e Node.js 20`;

async function getRedis() {
  const url = (process.env.UPSTASH_REDIS_REST_URL || '').trim();
  const token = (process.env.UPSTASH_REDIS_REST_TOKEN || '').trim();
  if (!url.startsWith('http')) return null;
  return new Redis({ url, token });
}

// Verify Telegram admin authorization
async function verifyAdmin(telegramId) {
  const r = await getRedis();
  if (!r) return false;

  const adminIds = process.env.TELEGRAM_ADMIN_IDS || '8074643162';
  const allowed = adminIds.split(',').map(id => id.trim());
  return allowed.includes(String(telegramId));
}

// Execute terminal action with AI copilot
async function executeWithCopilot(instruction, context = {}) {
  const messages = [
    {
      role: 'user',
      content: `ISTRUZIONE: ${instruction}

CONTESTO:
- Language: ${context.language || 'javascript'}
- Mode: ${context.mode || 'generate'}
- Project: ${context.project || 'aiforge-pro'}

Esegui l'operazione in modo autonomo.`
    }
  ];

  const stream = await client.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 8000,
    system: TERMINAL_COPILOT_SYSTEM,
    messages,
  });

  let fullResponse = '';
  let tokens = 0;

  for await (const event of stream) {
    if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
      fullResponse += event.delta.text;
    }
  }

  const final = await stream.finalMessage();
  tokens = final.usage?.output_tokens || 0;

  // Parse response for commands and code
  const commands = extractCommands(fullResponse);
  const code = extractCode(fullResponse);

  return {
    response: fullResponse,
    commands,
    code,
    tokens,
    executedAt: Date.now(),
  };
}

function extractCommands(text) {
  const matches = text.match(/```bash\n([\s\S]*?)\n```/g);
  if (!matches) return [];
  return matches.map(m => {
    const code = m.replace(/```bash\n|\n```/g, '').trim();
    return code.split('\n').filter(line => line && !line.startsWith('#'));
  }).flat();
}

function extractCode(text) {
  const matches = text.match(/```(\w+)?\n([\s\S]*?)\n```/g);
  if (!matches) return [];
  return matches
    .filter(m => !m.startsWith('```bash'))
    .map(m => {
      const lang = m.match(/```(\w+)/)?.[1] || 'text';
      const code = m.replace(/```\w*\n|\n```/g, '');
      return { language: lang, code };
    });
}

// POST: Execute terminal command from Lara
async function handlePost(req, res) {
  const { telegramId, instruction, language = 'javascript', mode = 'generate', project } = req.body || {};

  if (!telegramId || !instruction) {
    return res.status(400).json({ error: 'telegramId e instruction richiesti' });
  }

  // Verify admin authorization
  const isAdmin = await verifyAdmin(telegramId);
  if (!isAdmin) {
    return res.status(403).json({ error: 'Non autorizzato. Solo admin Telegram possono usare Lara terminal.' });
  }

  try {
    // Set up SSE streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();

    // Execute with AI copilot
    const result = await executeWithCopilot(instruction, { language, mode, project });

    // Stream result back
    res.write(`data: ${JSON.stringify({
      type: 'result',
      response: result.response,
      commands: result.commands,
      code: result.code,
      tokens: result.tokens,
    })}\n\n`);

    // Store execution in Redis for history
    const r = await getRedis();
    if (r) {
      await r.lpush('lara:terminal:history', JSON.stringify({
        telegramId,
        instruction,
        result: { ...result, response: result.response.slice(0, 1000) },
        timestamp: Date.now(),
      }));
      await r.ltrim('lara:terminal:history', 0, 99); // Keep last 100
    }

    res.end();
  } catch (e) {
    res.write(`data: ${JSON.stringify({ type: 'error', error: e.message })}\n\n`);
    res.end();
  }
}

// GET: Retrieve terminal history
async function handleGet(req, res) {
  const { telegramId, limit = 10 } = req.query;

  if (!telegramId) {
    return res.status(400).json({ error: 'telegramId richiesto' });
  }

  const isAdmin = await verifyAdmin(telegramId);
  if (!isAdmin) {
    return res.status(403).json({ error: 'Non autorizzato' });
  }

  const r = await getRedis();
  if (!r) {
    return res.json({ history: [] });
  }

  const history = await r.lrange('lara:terminal:history', 0, parseInt(limit) - 1) || [];
  const parsed = history.map(h => JSON.parse(h));

  return res.json({ history: parsed });
}

export default function handler(req, res) {
  if (req.method === 'GET') return handleGet(req, res);
  if (req.method === 'POST') return handlePost(req, res);
  return res.status(405).json({ error: 'Metodo non consentito' });
}
