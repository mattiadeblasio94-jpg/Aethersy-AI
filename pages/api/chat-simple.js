import axios from 'axios';

export const config = { api: { bodyParser: true } };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { message } = req.body || {};
  if (!message) return res.status(400).json({ error: 'Messaggio mancante' });

  const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

  if (!OPENROUTER_API_KEY) {
    return res.status(500).json({ error: 'OPENROUTER_API_KEY non configurato' });
  }

  try {
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'qwen/qwen-2.5-72b-instruct',
        messages: [
          { role: 'system', content: 'Sei Lara, AI assistant di Aethersy.' },
          { role: 'user', content: message }
        ],
        max_tokens: 500
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'HTTP-Referer': 'https://aethersy.com',
          'X-Title': 'Aethersy-AI'
        }
      }
    );

    const reply = response.data.choices?.[0]?.message?.content || 'Nessuna risposta';
    return res.json({ reply, model: 'qwen-2.5-72b-instruct' });

  } catch (error) {
    console.error('Chat error:', error.message);
    if (error.response) {
      return res.status(error.response.status).json({ error: error.response.data });
    }
    return res.status(500).json({ error: error.message });
  }
}
