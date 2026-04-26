import { verifyToken } from '../../../lib/auth';
import { Redis } from '@upstash/redis';

export const config = { api: { bodyParser: { sizeLimit: '10mb' } } };

function getRedis() {
  const url = (process.env.UPSTASH_REDIS_REST_URL || '').trim();
  const token = (process.env.UPSTASH_REDIS_REST_TOKEN || '').trim();
  return new Redis({ url, token });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const auth = req.headers.authorization?.replace('Bearer ', '');
  const decoded = auth ? verifyToken(auth) : null;
  if (!decoded) return res.status(401).json({ error: 'Non autenticato' });

  const { filename, content, mimeType, size, extractedText } = req.body;
  if (!filename || !content) return res.status(400).json({ error: 'filename e content richiesti' });

  const r = getRedis();
  const fileId = `file_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const fileKey = `brain:${decoded.email}:${fileId}`;

  const fileRecord = {
    id: fileId,
    filename,
    mimeType: mimeType || 'application/octet-stream',
    size: size || content.length,
    content,
    extractedText: extractedText || '',
    uploadedAt: new Date().toISOString(),
    email: decoded.email,
  };

  await r.set(fileKey, JSON.stringify(fileRecord));
  await r.lpush(`brain:files:${decoded.email}`, fileId);

  // Keep max 100 files per user
  await r.ltrim(`brain:files:${decoded.email}`, 0, 99);

  return res.status(201).json({
    ok: true,
    file: { id: fileId, filename, mimeType: fileRecord.mimeType, size: fileRecord.size, uploadedAt: fileRecord.uploadedAt },
  });
}
