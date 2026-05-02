/**
 * Speech API - Text-to-Speech & Speech-to-Text
 * Supporta Groq Whisper, ElevenLabs, Google TTS
 */

import type { NextApiRequest, NextApiResponse } from 'next';

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { action } = req.query;

  try {
    switch (action) {
      // ============================================
      // SPEECH-TO-TEXT (Trascrizione)
      // ============================================
      case 'transcribe':
        return transcribeAudio(req, res);

      // ============================================
      // TEXT-TO-SPEECH (Sintesi vocale)
      // ============================================
      case 'synthesize':
        return synthesizeSpeech(req, res);

      // ============================================
      // VOICE CLONING (ElevenLabs)
      // ============================================
      case 'clone-voice':
        return cloneVoice(req, res);

      default:
        res.status(400).json({
          error: 'Azione non valida',
          availableActions: ['transcribe', 'synthesize', 'clone-voice']
        });
    }
  } catch (error: any) {
    console.error('Speech API error:', error);
    res.status(500).json({ error: error.message });
  }
}

// ============================================
// SPEECH-TO-TEXT - Groq Whisper
// ============================================

async function transcribeAudio(req: NextApiRequest, res: NextApiResponse) {
  const { audioUrl, language = 'it', file } = req.body;

  if (!audioUrl && !file) {
    return res.status(400).json({ error: 'audioUrl o file richiesti' });
  }

  // Groq Whisper API
  const formData = new FormData();

  if (audioUrl) {
    const audioBlob = await fetch(audioUrl).then(r => r.blob());
    formData.append('file', audioBlob, 'audio.wav');
  }

  formData.append('model', 'whisper-large-v3');
  formData.append('language', language);
  formData.append('response_format', 'json');

  const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_API_KEY}`
    },
    body: formData
  });

  if (!response.ok) {
    throw new Error(`Groq error: ${response.statusText}`);
  }

  const data = await response.json();

  res.json({
    success: true,
    transcription: data.text,
    language: data.language,
    duration: data.duration
  });
}

// ============================================
// TEXT-TO-SPEECH - ElevenLabs / Google
// ============================================

async function synthesizeSpeech(req: NextApiRequest, res: NextApiResponse) {
  const { text, voice = 'Rachel', model = 'eleven_monolingual_v1', language = 'it' } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'text richiesto' });
  }

  // ElevenLabs API
  const voiceMap: Record<string, string> = {
    'Rachel': '21m00Tcm4TlvDq8ikWAM',
    'Adam': 'pNInz6obpgDQGcFmaJgB',
    'Antoni': 'ErXwobaYiN019PkySvjV',
    'Elli': 'MF3mGyEYCl7XYWbV9V6O',
    'Josh': 'TxGEqnHWrfWFTfGW9XjX',
    'Arnold': 'VR6AewLTigWG4xSOukaG',
  };

  const voiceId = voiceMap[voice] || voice;

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY || ''
      },
      body: JSON.stringify({
        text,
        model_id: model,
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75
        }
      })
    }
  );

  if (!response.ok) {
    throw new Error(`ElevenLabs error: ${response.statusText}`);
  }

  const audioBuffer = await response.arrayBuffer();
  const audioBase64 = Buffer.from(audioBuffer).toString('base64');

  res.json({
    success: true,
    audio: `data:audio/mpeg;base64,${audioBase64}`,
    voice,
    model,
    characters: text.length
  });
}

// ============================================
// VOICE CLONING - ElevenLabs Instant Clone
// ============================================

async function cloneVoice(req: NextApiRequest, res: NextApiResponse) {
  const { name, description, audioUrl } = req.body;

  if (!name || !audioUrl) {
    return res.status(400).json({ error: 'name e audioUrl richiesti' });
  }

  // Download audio file
  const audioBlob = await fetch(audioUrl).then(r => r.blob());
  const arrayBuffer = await audioBlob.arrayBuffer();

  const formData = new FormData();
  formData.append('name', name);
  formData.append('description', description || 'Custom voice');
  formData.append('files', new Blob([arrayBuffer]), 'sample.wav');

  const response = await fetch('https://api.elevenlabs.io/v1/voices/add', {
    method: 'POST',
    headers: {
      'xi-api-key': ELEVENLABS_API_KEY || ''
    },
    body: formData
  });

  if (!response.ok) {
    throw new Error(`ElevenLabs error: ${response.statusText}`);
  }

  const data = await response.json();

  res.json({
    success: true,
    voiceId: data.voice_id,
    name: data.name,
    category: data.category
  });
}
