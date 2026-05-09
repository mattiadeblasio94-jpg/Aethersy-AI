import { saveMessage, getHistory } from '../../lib/memory';
import { getAllPages } from '../../lib/wiki';
import { LARA_SYSTEM_PROMPT } from '../../lib/prompts/lara';
import fetch from 'node-fetch';

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

  let history = [];
  try { history = await getHistory(sid, 20); } catch {}

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
      const orRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://aethersy.com',
          'X-Title': 'Aethersy-AI'
        },
        body: JSON.stringify({
          model: model,
          messages: [{ role: 'system', content: SYSTEM }, ...messages],
          max_tokens: 2048,
          stream: true
        })
      });

      if (!orRes.ok) {
        const errData = await orRes.json();
        throw new Error(errData.error?.message || 'OpenRouter error');
      }

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');
      res.flushHeaders?.();

      const reader = orRes.body.getReader();
      const dec = new TextDecoder();
      let buf = '';
      let fullReply = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop();
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6));
            const chunk = data.choices?.[0]?.delta?.content || '';
            if (chunk) {
              fullReply += chunk;
              res.write(`data: ${JSON.stringify({ t: chunk, model })}\n\n`);
            }
          }
        }
      }

      try {
        await Promise.all([
          saveMessage(sid, 'user', message),
          saveMessage(sid, 'assistant', fullReply),
        ]);
      } catch {}

      res.write(`data: ${JSON.stringify({ done: true, model })}\n\n`);
      res.end();
      return;
    } catch (orErr) {
      console.log('OpenRouter failed, fallback to Groq:', orErr.message);
    }
  }

  // ── GROQ STREAMING (Fallback) ─────────────────────────────────────────────────
  if (streaming && GROQ_API_KEY) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();

    try {
      const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [{ role: 'system', content: SYSTEM }, ...messages],
          max_tokens: 2048,
          stream: true
        })
      });

      if (!groqRes.ok) {
        const errData = await groqRes.json();
        throw new Error(errData.error?.message || 'Groq error');
      }

      const reader = groqRes.body.getReader();
      const dec = new TextDecoder();
      let buf = '';
      let fullReply = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop();
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6));
            const chunk = data.choices?.[0]?.delta?.content || '';
            if (chunk) {
              fullReply += chunk;
              res.write(`data: ${JSON.stringify({ t: chunk, model: 'llama-3.1-8b-instant' })}\n\n`);
            }
          }
        }
      }

      try {
        await Promise.all([
          saveMessage(sid, 'user', message),
          saveMessage(sid, 'assistant', fullReply),
        ]);
      } catch {}

      res.write(`data: ${JSON.stringify({ done: true, model: 'llama-3.1-8b-instant' })}\n\n`);
      res.end();
      return;
    } catch (groqErr) {
      res.write(`data: ${JSON.stringify({ error: groqErr.message })}\n\n`);
      res.end();
      return;
    }
  }

  // ── FALLBACK non-streaming ─────────────────────────────────────────────────
  try {
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'system', content: SYSTEM }, ...messages],
        max_tokens: 2048,
      }),
    });

    if (!groqRes.ok) {
      const errData = await groqRes.json();
      throw new Error(errData.error?.message || 'Groq error');
    }

    const groqData = await groqRes.json();
    const reply = groqData.choices?.[0]?.message?.content || '';

    try {
      await Promise.all([
        saveMessage(sid, 'user', message),
        saveMessage(sid, 'assistant', reply),
      ]);
    } catch {}

    return res.json({ reply, sessionId: sid, model: 'llama-3.1-8b-instant' });
  } catch (groqErr) {
    return res.status(500).json({ error: groqErr.message });
  }
}
