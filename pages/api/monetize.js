import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { niche, budget, goal, platform = 'general' } = req.body || {};
  if (!niche?.trim()) return res.status(400).json({ error: 'Nicchia obbligatoria' });

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: `Sei un esperto di marketing digitale, growth hacking e monetizzazione online.
Fornisci strategie concrete, basate su dati reali, con esempi pratici e numeri.
Rispondi sempre in italiano con formattazione markdown.`,
      messages: [
        {
          role: 'user',
          content: `Crea una strategia di monetizzazione completa per:

**Nicchia/Business:** ${niche}
**Budget disponibile:** ${budget || 'non specificato'}
**Obiettivo:** ${goal || 'massimizzare revenue'}
**Piattaforma/Canale:** ${platform}

Includi:
1. **Analisi della nicchia** — potenziale, competizione, trend 2025
2. **Canali di monetizzazione** (almeno 5, con stime di revenue)
3. **Strategia ads** — Google Ads, Meta, TikTok con ROAS attesi
4. **Funnel di vendita** ottimizzato
5. **Pricing strategy** — modelli e psicologia del prezzo
6. **Growth hacking** — tattiche per scalare velocemente
7. **Automazioni** per massimizzare l'efficienza
8. **Timeline e roadmap** — 30/60/90 giorni
9. **Budget allocation** ottimale
10. **Case study** simili con risultati reali

Fornisci numeri concreti e tattiche immediatamente applicabili.`,
        },
      ],
    });

    const strategy = response.content[0].text;
    return res.status(200).json({ strategy, niche });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
