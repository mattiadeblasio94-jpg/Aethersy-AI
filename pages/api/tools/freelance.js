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


// Usa Ollama invece

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
