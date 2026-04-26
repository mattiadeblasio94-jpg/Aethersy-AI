import Replicate from 'replicate';

export const config = { api: { bodyParser: true } };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { prompt, style = '', ratio = '1:1', model = 'schnell' } = req.body || {};
  if (!prompt?.trim()) return res.status(400).json({ error: 'Prompt richiesto' });
  if (!process.env.REPLICATE_API_TOKEN) return res.status(500).json({ error: 'REPLICATE_API_TOKEN non configurato' });

  const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });
  const fullPrompt = style ? `${prompt.trim()}, ${style}` : prompt.trim();

  try {
    if (model === 'pro') {
      const prediction = await replicate.predictions.create({
        model: 'black-forest-labs/flux-1.1-pro',
        input: { prompt: fullPrompt, aspect_ratio: ratio, output_format: 'webp', output_quality: 90, safety_tolerance: 2 },
      });
      return res.json({ predictionId: prediction.id, status: 'starting' });
    }

    if (model === 'sdxl') {
      const w = ratio === '16:9' ? 1344 : ratio === '9:16' ? 768 : ratio === '4:3' ? 1152 : 1024;
      const h = ratio === '16:9' ? 768 : ratio === '9:16' ? 1344 : ratio === '4:3' ? 896 : 1024;
      const prediction = await replicate.predictions.create({
        model: 'stability-ai/sdxl',
        input: { prompt: fullPrompt, negative_prompt: 'blurry, low quality, ugly, deformed', width: w, height: h, num_inference_steps: 30, guidance_scale: 7.5, num_outputs: 1 },
      });
      return res.json({ predictionId: prediction.id, status: 'starting' });
    }

    // FLUX Schnell — fast direct (default)
    const output = await replicate.run('black-forest-labs/flux-schnell', {
      input: { prompt: fullPrompt, aspect_ratio: ratio, output_format: 'webp', output_quality: 90, num_inference_steps: 4, go_fast: true },
    });

    const url = Array.isArray(output) ? String(output[0]) : String(output);
    return res.json({ ok: true, url, model: 'schnell' });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
