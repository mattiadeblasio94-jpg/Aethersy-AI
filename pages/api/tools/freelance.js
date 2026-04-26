import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { query, skills = [], minBudget = 0, platform = 'all', language = 'it' } = req.body;
  if (!query) return res.status(400).json({ error: 'query richiesta' });

  try {
    const msg = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      messages: [{
        role: 'user',
        content: `Sei un esperto di ricerca lavori freelance. Genera 8-10 opportunità freelance REALISTICHE e DETTAGLIATE basandoti su questa richiesta:

Query: "${query}"
Skill richieste: ${skills.length ? skills.join(', ') : 'qualsiasi'}
Budget minimo: €${minBudget}
Piattaforma: ${platform}

Per ogni opportunità fornisci un oggetto JSON con:
- title: titolo del progetto
- platform: piattaforma (Upwork/Freelancer/Toptal/PeoplePerHour/LinkedIn/Fiverr)
- budget: range budget in EUR (es. "€500-1500")
- duration: durata stimata
- skills: array di skill richieste
- description: descrizione dettagliata del progetto (2-3 frasi)
- clientRating: rating cliente 1-5
- proposals: numero proposte ricevute (stima)
- urgency: low/medium/high
- category: categoria lavoro
- applyUrl: URL fittizio ma realistico della piattaforma
- tips: consiglio su come fare un'ottima proposta per questo lavoro

Rispondi SOLO con un array JSON valido, nessun testo aggiuntivo.`,
      }],
      system: 'Sei un esperto recruiter freelance. Genera solo JSON valido, nessun markdown, nessuna spiegazione.',
    });

    const text = msg.content[0].text.trim();
    let jobs;
    try {
      const match = text.match(/\[[\s\S]*\]/);
      jobs = JSON.parse(match ? match[0] : text);
    } catch {
      jobs = [];
    }

    return res.status(200).json({ ok: true, jobs, query, generated: new Date().toISOString() });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
