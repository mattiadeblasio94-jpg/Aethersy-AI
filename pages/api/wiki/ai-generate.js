// OPEN SOURCE ONLY - No Anthropic
import { getAllPages } from '../../../lib/wiki';

// Usa Ollama invece

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { title, context, existingPages } = req.body || {};
  if (!title?.trim()) return res.status(400).json({ error: 'Titolo obbligatorio' });

  try {
    const allPages = existingPages || await getAllPages().catch(() => []);
    const pageList = allPages.map(p => p.title).join(', ');

    const response = await ollamaGenerate({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: `Sei un esperto knowledge manager. Crea contenuti wiki dettagliati, ben strutturati e utili per imprenditori.
Scrivi SEMPRE in italiano. Usa markdown: ## per sezioni, **bold**, bullet points, esempi concreti.
Il tono è professionale ma accessibile. Includi dati, esempi pratici e collegamenti concettuali.`,
      messages: [{
        role: 'user',
        content: `Crea una pagina wiki completa per: "${title}"
${context ? `\nContesto aggiuntivo: ${context}` : ''}
${pageList ? `\nPagine già esistenti nel wiki (suggerisci collegamenti): ${pageList}` : ''}

La pagina deve includere:
1. Definizione/panoramica (2-3 paragrafi)
2. Punti chiave (bullet list)
3. Applicazioni pratiche per imprenditori
4. Metriche e KPI rilevanti (se applicabile)
5. Risorse e strumenti consigliati
6. Suggerisci 3-5 titoli di pagine correlate da creare

Formato: markdown strutturato, 400-600 parole.`,
      }],
    });

    const content = response.content[0].text;

    // Extract suggested links from the content
    const linkMatch = content.match(/pagine correlate[:\s]*\n([\s\S]*?)(?:\n\n|\n##|$)/i);
    const suggestedLinks = linkMatch
      ? linkMatch[1].split('\n').map(l => l.replace(/^[-*•\d.]+\s*/, '').trim()).filter(Boolean).slice(0, 5)
      : [];

    return res.status(200).json({ content, suggestedLinks });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
