import { saveMessage, getHistory } from '../../lib/memory';
import { getAllPages } from '../../lib/wiki';
import { LARA_SYSTEM_PROMPT } from '../../lib/prompts/lara';
import axios from 'axios';
import { streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

export const config = { api: { bodyParser: true } };

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const GROQ_API_KEY = process.env.GROQ_API_KEY || process.env.GROQ_API_KEY_WORM_GPT;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

const SYSTEM = LARA_SYSTEM_PROMPT || `Sei Lara, l'AI agent di Aethersy-AI Forge Pro.
Rispondi sempre in italiano a meno che l'utente scriva in un'altra lingua.
Sei REATTIVA: rispondi con energia ed entusiasmo.
Sei RIFLESSIVA: pensi prima di rispondere, analizzi il contesto.
Sei CONCRETA: dai sempre un next action eseguibile.
Format: CONTESTO → INSIGHT → AZIONE → NEXT STEP

Esperta di: business, marketing, AI, codice, finanza, SEO, automazione, strategia, startup, funding, scaling, go-to-market, unit economics, fundraising, pitch deck.`;

const OPENROUTER_MODELS = [
  'qwen/qwen-2.5-72b-instruct',
  'meta-llama/llama-3.1-70b-instruct',
  'mistralai/mixtral-8x22b-instruct',
  'deepseek/deepseek-chat-v3',
];

// Provider configurations per Vercel AI SDK
const openrouter = createOpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: OPENROUTER_API_KEY,
  headers: {
    'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://aethersy.com',
    'X-Title': 'Aethersy AI Forge Pro'
  }
});

const groq = createOpenAI({
  baseURL: 'https://api.groq.com/openai/v1',
  apiKey: GROQ_API_KEY
});

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { message, sessionId, model: requestedModel, streaming } = req.body || {};
  if (!message?.trim()) return res.status(400).json({ error: 'Messaggio mancante' });

  const sid = sessionId || 'web-default';

  // Get history (non-blocking)
  let history = [];
  try { history = await getHistory(sid, 20); } catch {}

  // Get wiki context (non-blocking)
  let wikiContext = '';
  try {
    const pages = await getAllPages();
    if (pages.length > 0) {
      const q = message.toLowerCase();
      const relevant = pages
        .filter(p => p.title?.toLowerCase().includes(q.split(' ')[0]) || p.tags?.some(t => q.includes(t)))
        .slice(0, 3);
      if (relevant.length > 0) {
        wikiContext = '\n\n[Context]\n' + relevant.map(p => `${p.title}: ${p.content?.slice(0, 300)}`).join('\n\n');
      }
    }
  } catch {}

  const messages = [
    { role: 'system', content: SYSTEM },
    ...history.map(h => ({ role: h.role, content: h.content })),
    { role: 'user', content: message + wikiContext },
  ];

  const model = requestedModel || OPENROUTER_MODELS[0];

  // Se streaming è richiesto, usa Vercel AI SDK
  if (streaming) {
    try {
      // Determina provider dal modello
      const [provider, modelName] = model.split(':');
      let aiProvider, aiModel;

      if (provider === 'groq' && GROQ_API_KEY) {
        aiProvider = groq;
        aiModel = modelName || 'llama-3.1-8b-instant';
      } else if (OPENROUTER_API_KEY) {
        aiProvider = openrouter;
        aiModel = modelName || 'qwen/qwen-2.5-72b-instruct';
      } else if (GROQ_API_KEY) {
        aiProvider = groq;
        aiModel = 'llama-3.1-8b-instant';
      } else {
        return res.status(500).json({ error: 'Nessun provider AI configurato' });
      }

      const result = await streamText({
        model: aiProvider(aiModel),
        messages,
        maxTokens: 2048,
        temperature: 0.7,
        onError: ({ error }) => {
          console.error('[Vercel AI] Error:', error.message);
        },
      });

      // Salva la conversazione dopo il completamento
      result.finish.then(async ({ text }) => {
        try {
          await Promise.all([
            saveMessage(sid, 'user', message),
            saveMessage(sid, 'assistant', text),
          ]);
        } catch (e) { console.error('[Chat] Save error:', e); }
      });

      result.pipeDataStreamToResponse(res);
      return;

    } catch (sdkErr) {
      console.error('[Chat API] Vercel AI SDK error:', sdkErr.message);
      // Fallback a risposta non-streaming
    }
  }

  // ── OPENROUTER (Primary) ─────────────────────────────────────────────────
  if (OPENROUTER_API_KEY) {
    try {
      const response = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model: model,
          messages,
          max_tokens: 2048
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
            'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://aethersy.com',
            'X-Title': 'Aethersy-AI'
          }
        }
      );

      const reply = response.data.choices?.[0]?.message?.content || '';

      // Save to memory (non-blocking)
      try {
        await Promise.all([
          saveMessage(sid, 'user', message),
          saveMessage(sid, 'assistant', reply),
        ]);
      } catch {}

      return res.json({ reply, sessionId: sid, model, source: 'openrouter' });

    } catch (orErr) {
      console.error('[Chat API] OpenRouter error:', orErr.message);
    }
  }

  // ── GROQ (Fallback) ─────────────────────────────────────────────────
  if (GROQ_API_KEY) {
    try {
      const response = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          model: 'llama-3.1-8b-instant',
          messages,
          max_tokens: 2048
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${GROQ_API_KEY}`
          }
        }
      );

      const reply = response.data.choices?.[0]?.message?.content || '';

      try {
        await Promise.all([
          saveMessage(sid, 'user', message),
          saveMessage(sid, 'assistant', reply),
        ]);
      } catch {}

      return res.json({ reply, sessionId: sid, model: 'llama-3.1-8b-instant', source: 'groq' });

    } catch (groqErr) {
      console.error('[Chat API] Groq error:', groqErr.message);
    }
  }

  return res.status(500).json({ error: 'Nessun provider AI disponibile' });
}
