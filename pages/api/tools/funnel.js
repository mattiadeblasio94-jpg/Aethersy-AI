import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { product, targetAudience, price, goal, type = 'lead-generation' } = req.body;
  if (!product || !targetAudience) return res.status(400).json({ error: 'product e targetAudience richiesti' });

  const funnelTypes = {
    'lead-generation': 'acquisizione lead (opt-in, lead magnet, nurturing)',
    'webinar': 'webinar funnel (registrazione, reminder, pitch, follow-up)',
    'product-launch': 'lancio prodotto (pre-launch, lancio, upsell)',
    'tripwire': 'tripwire funnel (offerta bassa, upsell, core, backend)',
    'membership': 'funnel membership (prova gratuita, conversione, retention)',
    'ebook': 'funnel ebook/corso (opt-in, consegna, upsell corso premium)',
  };

  try {
    const msg = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 3000,
      messages: [{
        role: 'user',
        content: `Crea un funnel di vendita COMPLETO e PROFESSIONALE per:

Prodotto/Servizio: ${product}
Target: ${targetAudience}
Prezzo: ${price ? `€${price}` : 'da definire'}
Obiettivo: ${goal || 'massimizzare conversioni'}
Tipo funnel: ${funnelTypes[type] || type}

Crea un JSON completo con questa struttura:
{
  "name": "nome del funnel",
  "type": "${type}",
  "estimatedConversionRate": "percentuale stimata",
  "estimatedROI": "ROI stimato",
  "stages": [
    {
      "id": 1,
      "name": "nome fase",
      "type": "landing|email|upsell|thank-you|webinar|checkout",
      "goal": "obiettivo della fase",
      "headline": "titolo principale",
      "subheadline": "sottotitolo",
      "body": "testo principale (2-3 paragrafi)",
      "cta": "testo del bottone CTA",
      "conversionRate": "percentuale stimata",
      "tools": ["tool 1", "tool 2"],
      "tips": "consiglio per ottimizzare questa fase"
    }
  ],
  "emailSequence": [
    {
      "day": 0,
      "subject": "oggetto email",
      "preview": "preview text",
      "body": "testo email completo",
      "goal": "obiettivo email"
    }
  ],
  "kpis": ["KPI 1", "KPI 2", "KPI 3"],
  "tools": { "page_builder": "...", "email": "...", "crm": "...", "analytics": "..." },
  "budget": { "ads": "...", "tools": "...", "total": "..." },
  "timeline": "timeline implementazione",
  "nextSteps": ["step 1", "step 2", "step 3"]
}

Rispondi SOLO con JSON valido, nessun testo aggiuntivo.`,
      }],
      system: 'Sei un esperto di marketing e funnel building con 10 anni di esperienza. Crea funnel che convertono davvero. Rispondi SOLO in JSON valido.',
    });

    const text = msg.content[0].text.trim();
    let funnel;
    try {
      const match = text.match(/\{[\s\S]*\}/);
      funnel = JSON.parse(match ? match[0] : text);
    } catch {
      funnel = { error: 'Parsing error', raw: text.slice(0, 500) };
    }

    return res.status(200).json({ ok: true, funnel });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
