import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { description, prompt, language = 'javascript' } = req.body || {};
  const desc = description || prompt;
  if (!desc?.trim()) return res.status(400).json({ error: 'Descrizione mancante' });

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: `Sei un esperto sviluppatore software. Genera codice di produzione pulito, commentato e funzionale.
Rispondi SOLO con il codice richiesto, senza spiegazioni extra prima o dopo.
Usa best practices, gestione errori appropriata e codice leggibile.
Il linguaggio richiesto è: ${language}.`,
      messages: [
        {
          role: 'user',
          content: `Crea il seguente codice in ${language}:\n\n${desc}\n\nFornisci codice completo e funzionante, pronto per la produzione.`,
        },
      ],
    });

    const code = response.content[0].text;

    const ext = {
      javascript: 'js', typescript: 'ts', python: 'py', html: 'html',
      css: 'css', rust: 'rs', go: 'go', java: 'java', php: 'php',
      bash: 'sh', sql: 'sql', json: 'json', yaml: 'yaml',
    }[language.toLowerCase()] || 'txt';

    return res.status(200).json({ code, language, extension: ext });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
