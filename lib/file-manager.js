import { saveFileMeta, getAllFiles, getFileMeta } from './memory';
import { Redis } from '@upstash/redis';

const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;
const MAX_REDIS_FILE = 500 * 1024; // 500KB max in Redis

function getRedis() {
  return Redis.fromEnv();
}

// ── Download file from Telegram ───────────────────────────────────────────────

export async function downloadTelegramFile(fileId) {
  const infoRes = await fetch(`${TELEGRAM_API}/getFile?file_id=${fileId}`);
  const info = await infoRes.json();
  if (!info.ok) throw new Error('File non trovato su Telegram');
  const filePath = info.result.file_path;
  const fileRes = await fetch(`https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${filePath}`);
  if (!fileRes.ok) throw new Error('Download fallito');
  return { buffer: await fileRes.arrayBuffer(), path: filePath, size: info.result.file_size };
}

// ── Save file to Redis ────────────────────────────────────────────────────────

export async function saveTelegramFile(fileId, fileName, mimeType) {
  const { buffer, path, size } = await downloadTelegramFile(fileId);
  const safeName = fileName || path.split('/').pop();
  const meta = { fileId, fileName: safeName, mimeType, size, savedAt: Date.now() };

  if (size <= MAX_REDIS_FILE) {
    const base64 = Buffer.from(buffer).toString('base64');
    await getRedis().set(`file:content:${fileId}`, base64, { ex: 60 * 60 * 24 * 30 }); // 30 giorni
    meta.stored = true;
  } else {
    meta.stored = false;
    meta.note = 'File troppo grande per storage, solo metadati salvati';
  }

  await saveFileMeta(fileId, meta);
  return { ...meta, buffer };
}

// ── Get file content from Redis ───────────────────────────────────────────────

export async function getFileContent(fileId) {
  const base64 = await getRedis().get(`file:content:${fileId}`);
  if (!base64) return null;
  return Buffer.from(base64, 'base64');
}

// ── Extract text from buffer ──────────────────────────────────────────────────

export async function extractTextFromBuffer(buffer, mimeType = '') {
  const text = new TextDecoder('utf-8', { fatal: false }).decode(buffer);

  if (mimeType.includes('pdf')) {
    try {
      const pdfParse = (await import('pdf-parse')).default;
      const result = await pdfParse(Buffer.from(buffer));
      return result.text.slice(0, 5000);
    } catch { return text.slice(0, 5000); }
  }

  if (mimeType.includes('json')) {
    try { return JSON.stringify(JSON.parse(text), null, 2).slice(0, 4000); }
    catch { return text.slice(0, 4000); }
  }

  return text.slice(0, 5000);
}

// ── List all stored files ─────────────────────────────────────────────────────

export async function listFiles() {
  return getAllFiles();
}
