import Replicate from 'replicate';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'id richiesto' });
  if (!process.env.REPLICATE_API_TOKEN) return res.status(500).json({ error: 'REPLICATE_API_TOKEN non configurato' });

  try {
    const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });
    const prediction = await replicate.predictions.get(id);
    const output = prediction.output;

    let url = null;
    if (output !== null && output !== undefined) {
      if (Array.isArray(output)) {
        // Could be array of strings or array of objects
        const first = output[0];
        url = typeof first === 'string' ? first : first?.url || String(first);
      } else if (typeof output === 'string') {
        url = output;
      } else if (typeof output === 'object' && output.url) {
        url = output.url;
      }
    }

    return res.json({
      status: prediction.status,
      url: url || null,
      error: prediction.error || null,
    });
  } catch (e) {
    return res.status(500).json({ error: e.message, status: 'failed' });
  }
}
