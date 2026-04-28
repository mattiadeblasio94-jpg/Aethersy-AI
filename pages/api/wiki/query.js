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

import { getAllPages, getIndex, addLogEntry } from '../../../lib/wiki';

// Usa Ollama invece

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { query } = req.body || {};
  if (!query?.trim()) return res.status(400).json({ error: 'query required' });

  const allPages = await getAllPages();
  if (!allPages.length) return res.json({ answer: 'La wiki è vuota. Ingesta prima alcune fonti.', sources: [] });

  // Score pages by relevance to query
  const q = query.toLowerCase();
  const scored = allPages
    .map(p => {
      let score = 0;
      if (p.title?.toLowerCase().includes(q)) score += 10;
      if (p.content?.toLowerCase().includes(q)) score += 5;
      if (p.tags?.some(t => t.toLowerCase().includes(q))) score += 3;
      q.split(/\s+/).forEach(word => {
        if (word.length > 3) {
          if (p.title?.toLowerCase().includes(word)) score += 2;
          if (p.content?.toLowerCase().includes(word)) score += 1;
        }
      });
      return { ...p, _score: score };
    })
    .filter(p => p._score > 0)
    .sort((a, b) => b._score - a._score)
    .slice(0, 8);

  const index = await getIndex();

  const context = scored.length
    ? scored.map(p => `=== ${p.title} (${p.type}) ===\n${p.content?.slice(0, 1200)}`).join('\n\n')
    : allPages.slice(0, 5).map(p => `=== ${p.title} ===\n${p.content?.slice(0, 600)}`).join('\n\n');

  const systemPrompt = `Sei un assistente che risponde attingendo ESCLUSIVAMENTE dalla wiki di conoscenza fornita.
Cita le pagine con [[NomePagina]]. Se la wiki non contiene informazioni pertinenti, dillo chiaramente.
Non inventare nulla. Rispondi in italiano, in markdown.`;

  const userMsg = `Query: "${query}"

PAGINE WIKI RILEVANTI:
${context}

${index ? `INDEX WIKI:\n${index.content?.slice(0, 500)}` : ''}`;

  try {
    const aiRes = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMsg }],
    });

    const answer = aiRes.content[0].text;

    await addLogEntry({
      type: 'query',
      title: query,
      summary: `Query risposta con ${scored.length} pagine rilevanti`,
      pagesAffected: scored.map(p => p.id),
    });

    res.json({ answer, sources: scored.map(p => ({ id: p.id, title: p.title, type: p.type })) });
  } catch (e) {
    console.error('query error:', e);
    res.status(500).json({ error: e.message });
  }
}
