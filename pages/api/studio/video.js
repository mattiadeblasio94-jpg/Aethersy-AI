import Replicate from 'replicate';

export const config = { api: { bodyParser: true } };

// Verified model IDs on Replicate
const VIDEO_MODELS = {
  wan:     'wavespeedai/wan-2.1-t2v-480p',   // Best open-source, fast
  minimax: 'minimax/video-01',               // MiniMax Hailuo, cinematic quality
  ltx:     'lightricks/ltx-video',           // LTX-Video, very fast
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { prompt, style = '', model = 'wan', aspectRatio = '16:9' } = req.body || {};
  if (!prompt?.trim()) return res.status(400).json({ error: 'Prompt richiesto' });
  if (!process.env.REPLICATE_API_TOKEN) return res.status(500).json({ error: 'REPLICATE_API_TOKEN non configurato' });

  const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });
  const fullPrompt = style ? `${prompt.trim()}, ${style}` : prompt.trim();

  try {
    let prediction;

    if (model === 'minimax') {
      prediction = await replicate.predictions.create({
        model: VIDEO_MODELS.minimax,
        input: { prompt: fullPrompt, prompt_optimizer: true },
      });
    } else if (model === 'ltx') {
      prediction = await replicate.predictions.create({
        model: VIDEO_MODELS.ltx,
        input: {
          prompt: fullPrompt,
          negative_prompt: 'low quality, worst quality, deformed, distorted, blurry',
          num_inference_steps: 50,
          guidance_scale: 3,
        },
      });
    } else {
      // Wan 2.1 — default, best quality
      prediction = await replicate.predictions.create({
        model: VIDEO_MODELS.wan,
        input: {
          prompt: fullPrompt,
          negative_prompt: 'low quality, blurry, distorted, worst quality',
          num_frames: 81,
          guidance_scale: 5,
          num_inference_steps: 30,
        },
      });
    }

    return res.json({ predictionId: prediction.id, status: prediction.status });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
