import Anthropic from '@anthropic-ai/sdk';
import { saveProject } from '../../lib/memory';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { name, description, type = 'business' } = req.body || {};
  if (!name?.trim() || !description?.trim()) return res.status(400).json({ error: 'Nome e descrizione obbligatori' });

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: `Sei un esperto project manager e business strategist. Crea piani di progetto dettagliati, pratici e azionabili.
Rispondi sempre in italiano con formattazione markdown chiara.`,
      messages: [
        {
          role: 'user',
          content: `Crea un piano di progetto completo per:

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
        },
      ],
    });

    const plan = response.content[0].text;

    const pid = `${Date.now()}-${name.replace(/\s+/g, '-').toLowerCase().slice(0, 30)}`;
    await saveProject(pid, { name, description, type, plan, createdAt: Date.now() }).catch(() => {});

    return res.status(200).json({ plan, name });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
