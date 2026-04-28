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

  const { type = 'freelance', clientName, clientEmail, projectName, amount, duration, scope, paymentTerms, yourName, yourEmail } = req.body;

  const contractTypes = {
    freelance: 'contratto di prestazione professionale freelance',
    nda: 'accordo di riservatezza (NDA)',
    partnership: 'accordo di partnership commerciale',
    consulting: 'contratto di consulenza',
    agency: 'contratto agenzia/rappresentanza',
    saas: 'contratto SaaS/licenza software',
    employment: 'lettera di impegno collaboratore',
  };

  try {
    const msg = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 3000,
      messages: [{
        role: 'user',
        content: `Crea un ${contractTypes[type] || type} professionale e legalmente solido in ITALIANO.

Dettagli:
- Fornitore: ${yourName || '[TUO NOME]'} | ${yourEmail || '[TUA EMAIL]'}
- Cliente: ${clientName || '[NOME CLIENTE]'} | ${clientEmail || '[EMAIL CLIENTE]'}
- Progetto: ${projectName || '[NOME PROGETTO]'}
- Importo: €${amount || '[IMPORTO]'}
- Durata: ${duration || '[DURATA]'}
- Ambito: ${scope || '[DESCRIZIONE AMBITO]'}
- Termini pagamento: ${paymentTerms || '50% anticipo, 50% a consegna'}

Crea un contratto completo con:
1. Intestazione professionale
2. Premesse e oggetto del contratto
3. Obblighi delle parti
4. Corrispettivo e modalità di pagamento
5. Proprietà intellettuale
6. Riservatezza
7. Limitazioni di responsabilità
8. Risoluzione controversie (foro di [CITTÀ])
9. Spazio firme con data

Formatta con titoli chiari, numerazione articoli. Tono professionale e formale.
Rispondi con il testo del contratto completo, pronto da usare.`,
      }],
      system: 'Sei un avvocato esperto in diritto commerciale italiano. Crea contratti professionali e chiari.',
    });

    return res.status(200).json({ ok: true, contract: msg.content[0].text, type });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
