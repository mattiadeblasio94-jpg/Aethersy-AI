// API per collegare piattaforma web al server AI (stesso endpoint di Telegram)
export const config = { api: { bodyParser: true } };

const SERVER_AI_URL = process.env.SERVER_AI_URL || 'http://47.91.76.37:5001/chat';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Metodo non consentito' });
  }

  try {
    const { message, userId = 'web-user', sessionId } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Messaggio mancante' });
    }

    // Chiama lo stesso AI server usato da Telegram
    const response = await fetch(SERVER_AI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        userId: userId || sessionId || 'web-anon',
        model: 'jaahas/qwen3.5-uncensored:9b',
        platform: 'aethersy-web'
      }),
      timeout: 120000
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: 'Errore server AI' }));
      return res.status(500).json({ error: err.error || 'AI non disponibile' });
    }

    const data = await response.json();

    return res.json({
      response: data.response,
      model: data.model,
      platform: 'aethersy',
      userId: data.userId,
      speed: data.speed || 'server'
    });

  } catch (error) {
    console.error('Server Chat API error:', error);
    return res.status(500).json({
      error: error.message,
      fallback: 'Usa /api/lara/chat per AI locale'
    });
  }
}
