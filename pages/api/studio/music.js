import Replicate from 'replicate';

export const config = { api: { bodyParser: true } };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { prompt, duration = 15, model = 'stereo-large' } = req.body || {};
  if (!prompt?.trim()) return res.status(400).json({ error: 'Prompt richiesto' });
  if (!process.env.REPLICATE_API_TOKEN) return res.status(500).json({ error: 'REPLICATE_API_TOKEN non configurato' });

  const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

  try {
    const prediction = await replicate.predictions.create({
      model: 'meta/musicgen',
      input: {
        prompt: prompt.trim(),
        model_version: model,
        duration: Math.min(Math.max(Number(duration), 5), 30),
        output_format: 'wav',
        normalization_strategy: 'loudness',
      },
    });

    return res.json({ predictionId: prediction.id, status: prediction.status });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
