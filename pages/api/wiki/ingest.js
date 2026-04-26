import Anthropic from '@anthropic-ai/sdk';
import { savePage, getAllPages, saveIndex, addLogEntry, getIndex, getPage } from '../../../lib/wiki';
import { scrapeUrl } from '../../../lib/research';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export const config = { api: { bodyParser: { sizeLimit: '2mb' } } };

function extractWikiRefs(text) {
  return [...new Set([...(text.matchAll(/\[\[([^\]]+)\]\]/g))].map(m => m[1]))];
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { text, url, title: inputTitle } = req.body || {};
  if (!text && !url) return res.status(400).json({ error: 'text or url required' });

  let sourceText = text || '';
  let sourceTitle = inputTitle || 'Fonte senza titolo';
  let sourceUrl = url || '';

  if (url && !text) {
    const scraped = await scrapeUrl(url);
    if (!scraped.ok) return res.status(400).json({ error: scraped.error });
    sourceText = scraped.text;
    sourceTitle = scraped.title || sourceTitle;
  }

  const allPages = await getAllPages();
  const existingIndex = await getIndex();
  const pagesSummary = allPages.slice(0, 50)
    .map(p => `- [[${p.title}]] (${p.type}): ${p.content?.slice(0, 80)}`)
    .join('\n');

  const systemPrompt = `Sei il curatore di una wiki di conoscenza persistente.
Il tuo compito è leggere una fonte e aggiornare la wiki creando/modificando pagine Markdown.

TIPI DI PAGINE:
- source: riassunto fedele della fonte originale
- entity: persona, organizzazione, prodotto, luogo concreto
- concept: idea astratta, metodologia, framework
- synthesis: connessione tra più pagine, pattern emersi

REGOLE:
1. Crea SEMPRE una pagina "source" per la fonte
2. Estrai 2-6 entity/concept pages dalle informazioni chiave
3. Usa [[NomePagina]] per i cross-reference tra pagine
4. Se una pagina esiste già, aggiornala invece di duplicarla
5. Sii conciso e fattuale — la wiki è un archivio, non un blog
6. Rispondi SOLO con JSON valido

PAGINE ESISTENTI:
${pagesSummary || '(wiki vuota)'}`;

  const userMsg = `Fonte: "${sourceTitle}"
${sourceUrl ? `URL: ${sourceUrl}` : ''}

TESTO:
${sourceText.slice(0, 8000)}

Crea le pagine wiki in JSON:
{
  "pages": [
    {
      "title": "...",
      "type": "source|entity|concept|synthesis",
      "content": "...(markdown)...",
      "tags": ["...", "..."],
      "related": ["[[Pagina1]]", "[[Pagina2]]"],
      "sourceRef": "..."
    }
  ],
  "indexUpdate": "...(frase per aggiornare il catalogo index)",
  "logSummary": "...(frase breve per il log)"
}`;

  try {
    const aiRes = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMsg }],
    });

    const raw = aiRes.content[0].text;
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('AI did not return valid JSON');
    const parsed = JSON.parse(jsonMatch[0]);

    const savedPages = [];
    for (const p of (parsed.pages || [])) {
      const refs = extractWikiRefs(p.content || '');
      const links = [];
      for (const ref of refs) {
        const existing = allPages.find(pg => pg.title.toLowerCase() === ref.toLowerCase());
        if (existing) links.push(existing.id);
      }
      const saved = await savePage({
        title: p.title,
        content: p.content,
        type: p.type || 'concept',
        tags: p.tags || [],
        links,
        related: refs,
        sourceRef: p.sourceRef || sourceTitle,
        aiGenerated: true,
      });
      savedPages.push(saved);
    }

    // Update index
    const newIndexEntry = `\n- [[${sourceTitle}]] (${new Date().toLocaleDateString('it-IT')}) — ${parsed.indexUpdate || ''}`;
    const currentIndex = existingIndex?.content || '# Index\n';
    await saveIndex(currentIndex + newIndexEntry);

    // Add log entry
    await addLogEntry({
      type: 'ingest',
      title: sourceTitle,
      summary: parsed.logSummary || `Ingestita fonte: ${sourceTitle}`,
      pagesAffected: savedPages.map(p => p.id),
    });

    res.json({ ok: true, pages: savedPages, count: savedPages.length });
  } catch (e) {
    console.error('ingest error:', e);
    res.status(500).json({ error: e.message });
  }
}
