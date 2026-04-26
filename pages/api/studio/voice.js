import Replicate from 'replicate';

export const config = { api: { bodyParser: true } };

const VOICES = {
  'uomo-en':  'v2/en_speaker_6',
  'donna-en': 'v2/en_speaker_9',
  'uomo-it':  'v2/it_speaker_0',
  'donna-it': 'v2/it_speaker_9',
  'narrator': 'v2/en_speaker_3',
  'whisper':  'v2/en_speaker_0',
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { text, voice = 'uomo-it' } = req.body || {};
  if (!text?.trim()) return res.status(400).json({ error: 'Testo richiesto' });
  if (!process.env.REPLICATE_API_TOKEN) return res.status(500).json({ error: 'REPLICATE_API_TOKEN non configurato' });

  const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

  try {
    const prediction = await replicate.predictions.create({
      model: 'suno-ai/bark',
      input: {
        prompt: text.trim(),
        history_prompt: VOICES[voice] || VOICES['uomo-it'],
        text_temp: 0.7,
        waveform_temp: 0.7,
      },
    });

    return res.json({ predictionId: prediction.id, status: prediction.status });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
