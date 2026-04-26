import Replicate from 'replicate';

export const config = { api: { bodyParser: true } };

// Solo modelli Replicate - NO fal.ai
const MODELS = {
  // Video
  wan:  { id: 'wavespeedai/wan-2.1-t2v-480p', type: 'video', desc: 'Wan 2.1 - Best open-source' },
  ltx:  { id: 'lightricks/ltx-video',        type: 'video', desc: 'LTX Video - Ultra-fast' },

  // Immagini
  'flux-pro-r': { id: 'black-forest-labs/flux-1.1-pro', type: 'image', desc: 'FLUX Pro 1.1 - Highest quality' },
  schnell:      { id: 'black-forest-labs/flux-schnell', type: 'image', desc: 'FLUX Schnell - Instant' },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { prompt = '', style = '', model = 'wan', ratio = '16:9', duration = 5 } = req.body || {};
  if (!prompt.trim()) return res.status(400).json({ error: 'Prompt richiesto' });

  const cfg = MODELS[model];
  if (!cfg) return res.status(400).json({ error: `Modello "${model}" non valido. Usa: ${Object.keys(MODELS).join(', ')}` });

  if (!process.env.REPLICATE_API_TOKEN) {
    return res.status(500).json({ error: 'REPLICATE_API_TOKEN non configurato' });
  }

  const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });
  const fullPrompt = style ? `${prompt.trim()}, ${style}` : prompt.trim();

  try {
    if (cfg.type === 'video') {
      let input = { prompt: fullPrompt };

      if (model === 'wan') {
        input = {
          ...input,
          negative_prompt: 'low quality, blurry, distorted, worst quality',
          num_frames: 81,
          guidance_scale: 5,
          num_inference_steps: 30,
        };
      }

      if (model === 'ltx') {
        input = {
          ...input,
          negative_prompt: 'low quality, worst quality, deformed, distorted, blurry',
          num_inference_steps: 50,
          guidance_scale: 3,
        };
      }

      const prediction = await replicate.predictions.create({ model: cfg.id, input });
      return res.json({
        jobId: prediction.id,
        provider: 'replicate',
        type: 'video',
        model,
        status: prediction.status
      });
    }

    // Immagini
    if (cfg.type === 'image') {
      let input = {
        prompt: fullPrompt,
        aspect_ratio: ratio,
        output_format: 'webp',
        output_quality: 90,
      };

      if (model === 'flux-pro-r') {
        input = {
          ...input,
          safety_tolerance: 5,
        };
      }

      if (model === 'schnell') {
        input = {
          ...input,
          num_inference_steps: 4,
          go_fast: true,
        };
      }

      const prediction = await replicate.predictions.create({ model: cfg.id, input });
      return res.json({
        jobId: prediction.id,
        provider: 'replicate',
        type: 'image',
        model,
        status: prediction.status
      });
    }

    return res.status(400).json({ error: 'Tipo modello non valido' });
  } catch (e) {
    console.error('Cinema generation error:', e);
    return res.status(500).json({ error: e.message || 'Errore generazione' });
  }
}
