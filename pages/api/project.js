// OPEN SOURCE ONLY - No Anthropic
import { saveProject } from '../../lib/memory';

// Helper function per Ollama (open source)
async function ollamaGenerate({ prompt, system = '', model = 'llama3.1:8b', options = {} }) {
  const ollamaBaseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
  try {
    const res = await fetch(`${ollamaBaseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt,
        system,
        stream: false,
        options: { temperature: 0.7, num_predict: 2048, ...options }
      })
    });
    if (!res.ok) throw new Error(`Ollama error: ${res.status}`);
    const data = await res.json();
    return { content: [{ text: data.response || '' }] };
  } catch (e) {
    console.log('Ollama error:', e.message);
    return { content: [{ text: 'AI non disponibile' }] };
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { name, description, type = 'business' } = req.body || {};
  if (!name?.trim() || !description?.trim()) return res.status(400).json({ error: 'Nome e descrizione obbligatori' });

  try {
    const response = await ollamaGenerate({
      prompt: `Crea un piano di progetto completo per:

**Nome progetto:** ${name}
**Descrizione:** ${description}
**Tipo:** ${type}

Il piano deve includere:
1. **Executive Summary** — obiettivi e visione
2. **Analisi di mercato** — target, competitori, opportunità
3. **Fasi di sviluppo** (almeno 4 milestone con timeline realistica)
4. **Risorse necessarie** — team, budget, strumenti
5. **KPI e metriche di successo**
6. **Rischi e mitigazioni**
7. **Piano di lancio** — step concreti
8. **Proiezioni economiche** (anno 1-3)

Sii specifico, pratico e orientato ai risultati.`,
      system: `Sei un esperto project manager e business strategist. Crea piani di progetto dettagliati, pratici e azionabili.
Rispondi sempre in italiano con formattazione markdown chiara.`,
      model: 'llama3.1:8b',
    });

    const plan = response.content[0].text;

    const pid = `${Date.now()}-${name.replace(/\s+/g, '-').toLowerCase().slice(0, 30)}`;
    await saveProject(pid, { name, description, type, plan, createdAt: Date.now() }).catch(() => {});

    return res.status(200).json({ plan, name });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
