import { put } from '@vercel/blob';
import { Redis } from '@upstash/redis';

export const config = { api: { bodyParser: false } };

function getRedis() {
  return new Redis({
    url: (process.env.UPSTASH_REDIS_REST_URL || '').trim(),
    token: (process.env.UPSTASH_REDIS_REST_TOKEN || '').trim(),
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  if (!process.env.BLOB_READ_WRITE_TOKEN) return res.status(500).json({ error: 'BLOB_READ_WRITE_TOKEN not configured' });

  const contentType = req.headers['content-type'] || 'application/octet-stream';
  const rawName = req.headers['x-filename'] || `upload_${Date.now()}`;
  const filename = decodeURIComponent(rawName);
  const fileType = req.headers['x-file-type'] || 'file';

  try {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const buffer = Buffer.concat(chunks);

    const blob = await put(`wiki/${fileType}/${filename}`, buffer, {
      access: 'public',
      contentType,
    });

    const fileRecord = {
      id: `file_${Date.now()}`,
      name: filename,
      url: blob.url,
      fileType,
      size: buffer.length,
      contentType,
      uploadedAt: Date.now(),
    };

    const r = getRedis();
    await r.lpush('wiki:files', JSON.stringify(fileRecord));
    await r.ltrim('wiki:files', 0, 199);

    return res.json({ ok: true, url: blob.url, name: filename, size: buffer.length, fileType });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
