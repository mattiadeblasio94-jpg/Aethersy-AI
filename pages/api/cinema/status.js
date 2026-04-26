import Replicate from 'replicate';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const { jobId, provider, modelId } = req.query;
  if (!jobId) return res.status(400).json({ error: 'jobId required' });

  try {
    // ── fal.ai ───────────────────────────────────────────────────────────────
    if (provider === 'fal') {
      if (!process.env.FAL_KEY) return res.json({ status: 'failed', error: 'FAL_KEY not set' });

      const statusRes = await fetch(`https://queue.fal.run/${modelId}/requests/${jobId}/status`, {
        headers: { 'Authorization': `Key ${process.env.FAL_KEY}` },
      });
      const statusData = await statusRes.json();
      const falStatus = statusData.status; // IN_QUEUE | IN_PROGRESS | COMPLETED | FAILED

      if (falStatus === 'COMPLETED') {
        const resultRes = await fetch(`https://queue.fal.run/${modelId}/requests/${jobId}`, {
          headers: { 'Authorization': `Key ${process.env.FAL_KEY}` },
        });
        const result = await resultRes.json();

        // Handle all possible fal.ai output shapes
        const url =
          result.video?.url ||
          result.video ||
          result.images?.[0]?.url ||
          result.images?.[0] ||
          result.image?.url ||
          result.image ||
          result.url ||
          '';

        return res.json({ status: 'succeeded', url: typeof url === 'string' ? url : '' });
      }

      if (falStatus === 'FAILED') {
        return res.json({ status: 'failed', error: statusData.error || statusData.detail || 'Generation failed' });
      }

      // IN_QUEUE or IN_PROGRESS
      return res.json({ status: 'processing' });
    }

    // ── Replicate ─────────────────────────────────────────────────────────────
    if (provider === 'replicate') {
      if (!process.env.REPLICATE_API_TOKEN) return res.json({ status: 'failed', error: 'REPLICATE_API_TOKEN not set' });
      const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });
      const pred = await replicate.predictions.get(jobId);

      if (pred.status === 'succeeded') {
        const raw = pred.output;
        const url = Array.isArray(raw) ? String(raw[0]) : String(raw || '');
        return res.json({ status: 'succeeded', url });
      }
      if (pred.status === 'failed' || pred.status === 'canceled') {
        return res.json({ status: 'failed', error: pred.error || 'Generation failed' });
      }
      return res.json({ status: pred.status });
    }

    return res.status(400).json({ error: 'Unknown provider' });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
