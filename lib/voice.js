// Voice: STT (Whisper) + TTS (OpenAI) for Telegram

const BOT_TOKEN = () => process.env.TELEGRAM_BOT_TOKEN;
const OPENAI_KEY = () => process.env.OPENAI_API_KEY;

export async function downloadTelegramAudio(fileId) {
  const infoRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN()}/getFile?file_id=${fileId}`);
  const info = await infoRes.json();
  if (!info.ok) throw new Error('File non trovato su Telegram');
  const url = `https://api.telegram.org/file/bot${BOT_TOKEN()}/${info.result.file_path}`;
  const fileRes = await fetch(url);
  if (!fileRes.ok) throw new Error('Download audio fallito');
  return { buffer: await fileRes.arrayBuffer(), path: info.result.file_path };
}

export async function transcribeAudio(audioBuffer, mimeType = 'audio/ogg') {
  const key = OPENAI_KEY();
  if (!key) return null;
  try {
    const form = new FormData();
    form.append('file', new Blob([audioBuffer], { type: mimeType }), 'voice.ogg');
    form.append('model', 'whisper-1');
    form.append('language', 'it');
    const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}` },
      body: form,
      signal: AbortSignal.timeout(30000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.text || null;
  } catch { return null; }
}

export async function textToSpeech(text, voice = 'nova') {
  const key = OPENAI_KEY();
  if (!key) return null;
  try {
    const res = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'tts-1', input: text.slice(0, 4000), voice }),
      signal: AbortSignal.timeout(30000),
    });
    if (!res.ok) return null;
    return await res.arrayBuffer();
  } catch { return null; }
}

export async function sendVoiceMessage(chatId, audioBuffer) {
  const form = new FormData();
  form.append('chat_id', String(chatId));
  form.append('voice', new Blob([audioBuffer], { type: 'audio/mpeg' }), 'response.mp3');
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN()}/sendVoice`, {
    method: 'POST',
    body: form,
    signal: AbortSignal.timeout(30000),
  });
}

export async function sendAudio(chatId, audioBuffer, caption = '') {
  const form = new FormData();
  form.append('chat_id', String(chatId));
  form.append('audio', new Blob([audioBuffer], { type: 'audio/mpeg' }), 'lara_response.mp3');
  if (caption) form.append('caption', caption.slice(0, 1024));
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN()}/sendAudio`, {
    method: 'POST',
    body: form,
    signal: AbortSignal.timeout(30000),
  });
}
