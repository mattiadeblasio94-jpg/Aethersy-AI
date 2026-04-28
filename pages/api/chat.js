import { saveMessage, getHistory } from '../../lib/memory';
import { getAllPages } from '../../lib/wiki';
import { ollamaChatStream } from '../../lib/ollama';
import { detectTaskFromMessage, selectModelForTask } from '../../lib/models';
import { LARA_SYSTEM_PROMPT } from '../../lib/prompts/lara';

export const config = { api: { bodyParser: true, responseLimit: false } };

// ONLY OPEN SOURCE - Ollama primary
const SYSTEM = LARA_SYSTEM_PROMPT || `Sei Lara, l'AI agent di Aethersy-AI — intelligente, diretta e super competente.
Rispondi sempre in italiano a meno che l'utente scriva in un'altra lingua.
Sei esperta di: business, marketing, AI, codice, finanza, SEO, automazione, strategia.
Usa markdown per formattare (liste, bold, titoli, codice) quando rende la risposta più chiara.
Sei concisa ma completa. Non ripetere domande ovvie. Vai al punto.
Data attuale: ${new Date().toLocaleDateString('it-IT')}.`;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { message, sessionId, streaming = true, useOllama } = req.body || {};
  if (!message?.trim()) return res.status(400).json({ error: 'Messaggio mancante' });

  const sid = sessionId || 'web-default';

  let history = [];
  try { history = await getHistory(sid, 20); } catch {}

  // Pull wiki context for relevant queries
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

  // ── OLLAMA STREAMING (PRIMARY) ─────────────────────────────────────────────────
  if (streaming) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();

    try {
      const detectedTask = detectTaskFromMessage(message);
      const selectedModel = selectModelForTask(detectedTask);

      const ollamaMessages = [
        { role: 'system', content: SYSTEM },
        ...messages,
      ];

      const encoder = new TextEncoder();
      const generator = ollamaChatStream(ollamaMessages, { model: selectedModel, temperature: 0.7 });

      let fullReply = '';
      for await (const chunk of generator) {
        fullReply += chunk;
        res.write(encoder.encode(`data: ${JSON.stringify({ t: chunk, model: selectedModel })}\n\n`));
      }

      // Save to memory after complete
      try {
        await Promise.all([
          saveMessage(sid, 'user', message),
          saveMessage(sid, 'assistant', fullReply),
        ]);
      } catch {}

      res.write(`data: ${JSON.stringify({ done: true, model: selectedModel })}\n\n`);
      res.end();
      return;
    } catch (e) {
      res.write(`data: ${JSON.stringify({ error: e.message })}\n\n`);
      res.end();
      return;
    }
  }

  // ── Non-streaming fallback ─────────────────────────────────────────────────
  try {
    const detectedTask = detectTaskFromMessage(message);
    const selectedModel = selectModelForTask(detectedTask);

    const ollamaMessages = [
      { role: 'system', content: SYSTEM },
      ...messages,
    ];

    const res = await fetch(`${process.env.OLLAMA_BASE_URL || 'http://localhost:11434'}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: selectedModel,
        prompt: messages[messages.length - 1].content,
        stream: false,
      }),
    });

    const data = await res.json();
    const reply = data.response;

    try {
      await Promise.all([
        saveMessage(sid, 'user', message),
        saveMessage(sid, 'assistant', reply),
      ]);
    } catch {}

    return res.json({ reply, sessionId: sid, model: selectedModel });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
