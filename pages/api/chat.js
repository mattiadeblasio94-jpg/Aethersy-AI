import { saveMessage, getHistory } from '../../lib/memory';
import { getAllPages } from '../../lib/wiki';
import { LARA_SYSTEM_PROMPT } from '../../lib/prompts/lara';
import axios from 'axios';

export const config = { api: { bodyParser: true, responseLimit: false } };

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const GROQ_API_KEY = process.env.GROQ_API_KEY || process.env.GROQ_API_KEY_WORM_GPT;

const SYSTEM = LARA_SYSTEM_PROMPT || `Sei Lara, l'AI agent di Aethersy-AI — intelligente, diretta e super competente.
Rispondi sempre in italiano a meno che l'utente scriva in un'altra lingua.
Sei esperta di: business, marketing, AI, codice, finanza, SEO, automazione, strategia.
Usa markdown per formattare (liste, bold, titoli, codice) quando rende la risposta più chiara.
Sei concisa ma completa. Non ripetere domande ovvie. Vai al punto.
Data attuale: ${new Date().toLocaleDateString('it-IT')}.`;

// OpenRouter models (Hugging Face open source)
const OPENROUTER_MODELS = [
  'qwen/qwen-2.5-72b-instruct',
  'meta-llama/llama-3.1-70b-instruct',
  'mistralai/mixtral-8x22b-instruct',
  'deepseek/deepseek-chat-v3',
];

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { message, sessionId, streaming = true, model: requestedModel } = req.body || {};
  if (!message?.trim()) return res.status(400).json({ error: 'Messaggio mancante' });

  const sid = sessionId || 'web-default';

  console.log('[Chat API] Request:', { message: message.substring(0, 50), sessionId: sid, streaming, model: requestedModel });
  console.log('[Chat API] OPENROUTER_API_KEY configured:', !!OPENROUTER_API_KEY);
  console.log('[Chat API] GROQ_API_KEY configured:', !!GROQ_API_KEY);

  let history = [];
  try { history = await getHistory(sid, 20); } catch (e) { console.log('[Chat API] getHistory error:', e.message); }

  let wikiContext = '';
  try {
    const pages = await getAllPages();
    if (pages.length > 0) {
      const q = message.toLowerCase();
      const relevant = pages
        .filter(p => p.title?.toLowerCase().includes(q.split(' ')[0]) || p.tags?.some(t => q.includes(t)))
        .slice(0, 3);
      if (relevant.length > 0) {
        wikiContext = '\n\n[Second Brain context]\n' + relevant.map(p => `${p.title}: ${p.content?.slice(0, 300)}`).join('\n\n');
      }
    }
  } catch {}

  const messages = [
    ...history.map(h => ({ role: h.role, content: h.content })),
    { role: 'user', content: message + wikiContext },
  ];

  // ── OPENROUTER STREAMING (Hugging Face Models) ─────────────────────────────────────────────────
  if (streaming && OPENROUTER_API_KEY) {
    const model = requestedModel || OPENROUTER_MODELS[0];

    try {
      console.log('[Chat API] Calling OpenRouter with model:', model);

      const orRes = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
        model: model,
        messages: [{ role: 'system', content: SYSTEM }, ...messages],
        max_tokens: 2048,
        stream: true
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://aethersy.com',
          'X-Title': 'Aethersy-AI'
        },
        responseType: 'stream'
      });

      console.log('[Chat API] OpenRouter response status:', orRes.status);

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');
      res.flushHeaders?.();

      let fullReply = '';

      orRes.data.on('data', (chunk) => {
        const lines = chunk.toString().split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ') && !line.includes('[DONE]')) {
            try {
              const data = JSON.parse(line.slice(6));
              const content = data.choices?.[0]?.delta?.content || '';
              if (content) {
                fullReply += content;
                res.write(`data: ${JSON.stringify({ t: content, model })}\n\n`);
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      });

      orRes.data.on('end', async () => {
        // Save to memory (non-blocking, ignore errors)
        try {
          await Promise.all([
            saveMessage(sid, 'user', message),
            saveMessage(sid, 'assistant', fullReply),
          ]);
        } catch (saveErr) {
          console.log('[Chat API] saveMessage error (non-blocking):', saveErr.message);
        }

        res.write(`data: ${JSON.stringify({ done: true, model })}\n\n`);
        res.end();
      });

      orRes.data.on('error', (err) => {
        console.error('[Chat API] Stream error:', err.message);
        res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
        res.end();
      });

      return;
    } catch (orErr) {
      console.error('[Chat API] OpenRouter error:', orErr.message);
    }
  }

  // ── GROQ STREAMING (Fallback) ─────────────────────────────────────────────────
  if (streaming && GROQ_API_KEY) {
    try {
      console.log('[Chat API] Calling Groq (streaming fallback)');

      const groqRes = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'system', content: SYSTEM }, ...messages],
        max_tokens: 2048,
        stream: true
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROQ_API_KEY}`
        },
        responseType: 'stream'
      });

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');
      res.flushHeaders?.();

      let fullReply = '';

      groqRes.data.on('data', (chunk) => {
        const lines = chunk.toString().split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ') && !line.includes('[DONE]')) {
            try {
              const data = JSON.parse(line.slice(6));
              const content = data.choices?.[0]?.delta?.content || '';
              if (content) {
                fullReply += content;
                res.write(`data: ${JSON.stringify({ t: content, model: 'llama-3.1-8b-instant' })}\n\n`);
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      });

      groqRes.data.on('end', async () => {
        try {
          await Promise.all([
            saveMessage(sid, 'user', message),
            saveMessage(sid, 'assistant', fullReply),
          ]);
        } catch (saveErr) {
          console.log('[Chat API] saveMessage error (non-blocking):', saveErr.message);
        }

        res.write(`data: ${JSON.stringify({ done: true, model: 'llama-3.1-8b-instant' })}\n\n`);
        res.end();
      });

      groqRes.data.on('error', (err) => {
        console.error('[Chat API] Groq stream error:', err.message);
        res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
        res.end();
      });

      return;
    } catch (groqErr) {
      console.error('[Chat API] Groq error:', groqErr.message);
    }
  }

  // ── FALLBACK non-streaming ─────────────────────────────────────────────────
  if (!GROQ_API_KEY) {
    return res.status(500).json({ error: 'Nessun provider AI configurato' });
  }

  try {
    console.log('[Chat API] Calling Groq (non-streaming fallback)');

    const groqRes = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'system', content: SYSTEM }, ...messages],
      max_tokens: 2048,
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
      }
    });

    console.log('[Chat API] Groq response status:', groqRes.status);

    const reply = groqRes.data.choices?.[0]?.message?.content || '';

    // Save to memory (non-blocking, ignore errors)
    try {
      await Promise.all([
        saveMessage(sid, 'user', message),
        saveMessage(sid, 'assistant', reply),
      ]);
    } catch (saveErr) {
      console.log('[Chat API] saveMessage error (non-blocking):', saveErr.message);
    }

    return res.json({ reply, sessionId: sid, model: 'llama-3.1-8b-instant' });
  } catch (groqErr) {
    console.error('[Chat API] Groq error:', groqErr.message);
    return res.status(500).json({ error: groqErr.message });
  }
}
