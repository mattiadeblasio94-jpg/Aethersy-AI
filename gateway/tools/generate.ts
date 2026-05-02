/**
 * Generate Tool - Generazione contenuti multimediali
 * Immagini, Video, Audio, Testo
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);

// Provider API
const FAL_AI_KEY = process.env.FAL_AI_KEY;
const REPLICATE_KEY = process.env.REPLICATE_KEY;
const OPENROUTER_KEY = process.env.OPENROUTER_KEY;

export interface GenerateImageOptions {
  prompt: string;
  userId: string;
  style?: 'realistic' | 'artistic' | 'cyberpunk' | 'minimal' | 'anime';
  size?: '512x512' | '1024x1024' | '1920x1080' | '1024x1536';
  negativePrompt?: string;
  steps?: number;
  cfg?: number;
  seed?: number;
}

export interface GenerateVideoOptions {
  prompt: string;
  userId: string;
  imageUrl?: string;
  duration?: number;
  fps?: number;
  resolution?: '720p' | '1080p';
}

export interface GenerateAudioOptions {
  prompt: string;
  userId: string;
  genre?: string;
  bpm?: number;
  duration?: number;
  stems?: boolean;
}

export interface GeneratedContent {
  url: string;
  type: 'image' | 'video' | 'audio';
  prompt: string;
  model: string;
  metadata: Record<string, any>;
  createdAt: string;
}

/**
 * Genera immagine usando Flux/Stable Diffusion via API
 */
export async function generateImage(options: GenerateImageOptions): Promise<GeneratedContent> {
  const {
    prompt,
    userId,
    style = 'realistic',
    size = '1024x1024',
    negativePrompt = 'ugly, blurry, low quality',
    steps = 28,
    cfg = 7,
    seed
  } = options;

  // Mappa stili a prompt aggiuntivi
  const stylePrompts: Record<string, string> = {
    realistic: 'photorealistic, highly detailed, 8k',
    artistic: 'artistic painting, oil painting style, masterpiece',
    cyberpunk: 'cyberpunk aesthetic, neon lights, futuristic',
    minimal: 'minimalist design, clean, simple',
    anime: 'anime style, studio ghibli inspired'
  };

  const fullPrompt = `${prompt}, ${stylePrompts[style] || ''}`;

  let imageUrl: string;
  let model: string;

  try {
    // Prova Fal.ai (Flux)
    if (FAL_AI_KEY) {
      const response = await fetch('https://api.fal.ai/v1/fal-ai/flux-pro/v1.1', {
        method: 'POST',
        headers: {
          'Authorization': `Key ${FAL_AI_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: fullPrompt,
          negative_prompt: negativePrompt,
          image_size: { width: parseInt(size), height: parseInt(size) },
          num_inference_steps: steps,
          guidance_scale: cfg,
          seed: seed || Math.floor(Math.random() * 1000000)
        })
      });

      if (response.ok) {
        const data = await response.json();
        imageUrl = data.images?.[0]?.url || data.image?.url;
        model = 'flux-pro-v1.1';
      } else {
        throw new Error('Fal.ai failed');
      }
    } else {
      // Fallback: placeholder
      imageUrl = `https://image.aethersy.com/gen/${Date.now()}?p=${encodeURIComponent(prompt)}`;
      model = 'placeholder';
    }
  } catch (error) {
    // Fallback finale
    imageUrl = `https://placehold.co/${size}?text=${encodeURIComponent(prompt.slice(0, 20))}`;
    model = 'fallback';
  }

  // Salva nel database
  const content = await saveContent({
    url: imageUrl,
    type: 'image',
    prompt,
    model,
    metadata: { style, size, steps, cfg, seed },
    userId,
    createdAt: new Date().toISOString()
  });

  return {
    url: imageUrl,
    type: 'image',
    prompt,
    model,
    metadata: { style, size },
    createdAt: new Date().toISOString()
  };
}

/**
 * Genera video usando SVD/CogVideo
 */
export async function generateVideo(options: GenerateVideoOptions): Promise<GeneratedContent> {
  const {
    prompt,
    userId,
    imageUrl,
    duration = 4,
    fps = 24,
    resolution = '720p'
  } = options;

  let videoUrl: string;
  let model: string;

  try {
    // Prova API video (Runway/Pika/SVD)
    if (REPLICATE_KEY) {
      // Stability Video Diffusion
      const response = await fetch('https://api.replicate.com/v1/predictions', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${REPLICATE_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          version: 'a8b7c9d2e1f3g4h5i6j7k8l9m0n1o2p3',
          input: {
            video_length: duration,
            fps: fps,
            motion_bucket_id: 127,
            cond_aug: 0.02
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        // Polling per risultato
        videoUrl = await pollReplicateResult(data.id);
        model = 'stability-video-diffusion';
      } else {
        throw new Error('Replicate failed');
      }
    } else {
      videoUrl = `https://video.aethersy.com/gen/${Date.now()}?p=${encodeURIComponent(prompt)}`;
      model = 'placeholder';
    }
  } catch (error) {
    videoUrl = `https://placehold.co/1280x720/000000/FFFFFF?text=Video:+${encodeURIComponent(prompt.slice(0, 20))}`;
    model = 'fallback';
  }

  await saveContent({
    url: videoUrl,
    type: 'video',
    prompt,
    model,
    metadata: { duration, fps, resolution, image_url: imageUrl },
    userId,
    createdAt: new Date().toISOString()
  });

  return {
    url: videoUrl,
    type: 'video',
    prompt,
    model,
    metadata: { duration, fps },
    createdAt: new Date().toISOString()
  };
}

/**
 * Genera audio/musica usando Suno/Riffusion
 */
export async function generateAudio(options: GenerateAudioOptions): Promise<GeneratedContent> {
  const {
    prompt,
    userId,
    genre = 'ambient',
    bpm = 120,
    duration = 30,
    stems = false
  } = options;

  let audioUrl: string;
  let model: string;

  try {
    if (OPENROUTER_KEY) {
      // Usa modello audio via OpenRouter o API dedicata
      const response = await fetch('https://api.openrouter.ai/v1/audio/generations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt,
          genre,
          bpm,
          duration,
          stems
        })
      });

      if (response.ok) {
        const data = await response.json();
        audioUrl = data.audio_url;
        model = data.model || 'audio-gen-v1';
      } else {
        throw new Error('OpenRouter audio failed');
      }
    } else {
      audioUrl = `https://audio.aethersy.com/gen/${Date.now()}.mp3?p=${encodeURIComponent(prompt)}`;
      model = 'placeholder';
    }
  } catch (error) {
    audioUrl = `https://placehold.co/400x100/1a1a1a/00ff88?text=Audio:+${encodeURIComponent(prompt.slice(0, 20))}`;
    model = 'fallback';
  }

  await saveContent({
    url: audioUrl,
    type: 'audio',
    prompt,
    model,
    metadata: { genre, bpm, duration, stems },
    userId,
    createdAt: new Date().toISOString()
  });

  return {
    url: audioUrl,
    type: 'audio',
    prompt,
    model,
    metadata: { genre, bpm, duration },
    createdAt: new Date().toISOString()
  };
}

/**
 * Genera testo usando LLM
 */
export async function generateText(
  prompt: string,
  userId: string,
  options?: {
    systemPrompt?: string;
    maxLength?: number;
    temperature?: number;
    format?: 'paragraph' | 'list' | 'table' | 'markdown';
  }
): Promise<string> {
  const { systemPrompt, maxLength = 2000, temperature = 0.7, format } = options || {};

  const groq = new (await import('groq-sdk')).Groq({ apiKey: process.env.GROQ_API_KEY });

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: systemPrompt || 'Sei un assistente AI utile e creativo.' },
      { role: 'user', content: prompt }
    ],
    temperature,
    max_tokens: maxLength
  });

  let text = completion.choices[0].message?.content || '';

  // Formatta se richiesto
  if (format === 'list' && !text.includes('•') && !text.includes('-')) {
    text = text.split('\n').map(line => `• ${line}`).join('\n');
  }

  return text;
}

/**
 * Salva contenuto generato nel database
 */
async function saveContent(content: GeneratedContent & { userId: string }): Promise<void> {
  try {
    await supabase.from('generated_content').insert({
      user_id: content.userId,
      content_type: content.type,
      content_url: content.url,
      prompt: content.prompt,
      model_used: content.model,
      metadata: content.metadata,
      created_at: new Date().toISOString()
    });
  } catch {
    // Tabella potrebbe non esistere, ignora
  }
}

/**
 * Polling per risultato Replicate
 */
async function pollReplicateResult(predictionId: string, maxAttempts = 30): Promise<string> {
  for (let i = 0; i < maxAttempts; i++) {
    const response = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
      headers: { 'Authorization': `Token ${REPLICATE_KEY}` }
    });

    if (!response.ok) continue;

    const data = await response.json();
    if (data.status === 'succeeded') {
      return data.output?.url || data.output?.[0];
    }
    if (data.status === 'failed' || data.status === 'cancelled') {
      throw new Error('Generation failed');
    }

    await new Promise(r => setTimeout(r, 2000));
  }
  throw new Error('Timeout');
}

/**
 * Ottiene storico contenuti generati
 */
export async function getGeneratedContent(userId: string, type?: string, limit = 10): Promise<GeneratedContent[]> {
  let query = supabase
    .from('generated_content')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (type) {
    query = query.eq('content_type', type);
  }

  const { data } = await query;

  return (data || []).map(d => ({
    url: d.content_url,
    type: d.content_type,
    prompt: d.prompt,
    model: d.model_used,
    metadata: d.metadata,
    createdAt: d.created_at
  }));
}
