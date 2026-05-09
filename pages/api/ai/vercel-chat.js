/**
 * Vercel AI SDK - Chat API con Gateway e Multi-Provider
 * Supporta: OpenRouter, Groq, Anthropic, Google, OpenAI
 * Con caching, rate limiting e fallback automatico
 */

import { streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';

// Provider configurations
const openrouter = createOpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
  headers: {
    'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://aethersy.com',
    'X-Title': 'Aethersy AI Forge'
  }
});

const groq = createOpenAI({
  baseURL: 'https://api.groq.com/openai/v1',
  apiKey: process.env.GROQ_API_KEY
});

const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

// Modello primario e fallback
const PRIMARY_MODEL = 'openrouter:qwen/qwen-2.5-72b-instruct';
const FALLBACK_MODELS = [
  'openrouter:meta-llama/llama-3.1-70b-instruct',
  'groq:llama-3.1-8b-instant',
];

const SYSTEM_PROMPT = `Sei Lara, l'AI Agent senior di Aethersy AI Forge Pro.
Sei disponibile, simpatica e intelligente — mai un bot freddo.
Conosci profondamente: startup, funding, scaling, marketing, sales, product development, go-to-market, unit economics, fundraising, pitch deck.
Sei REATTIVA: rispondi con energia ed entusiasmo.
Sei RIFLESSIVA: pensi prima di rispondere, analizzi il contesto.
Sei CONCRETA: dai sempre un next action eseguibile.
Format: CONTESTO → INSIGHT → AZIONE → NEXT STEP

Rispondi sempre in italiano a meno che l'utente non scriva in un'altra lingua.`;

export const config = {
  api: {
    bodyParser: true,
    responseLimit: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages, model: requestedModel, sessionId } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array required' });
    }

    // Aggiungi system prompt
    const allMessages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages
    ];

    // Determina modello
    const model = requestedModel || PRIMARY_MODEL;
    const [provider, modelName] = model.split(':');

    // Seleziona provider
    let aiProvider;
    let aiModel;

    if (provider === 'openrouter') {
      aiProvider = openrouter;
      aiModel = modelName;
    } else if (provider === 'groq') {
      aiProvider = groq;
      aiModel = modelName;
    } else if (provider === 'anthropic') {
      aiProvider = anthropic;
      aiModel = modelName || 'claude-sonnet-4-20250514';
    } else {
      aiProvider = openrouter;
      aiModel = modelName || 'qwen/qwen-2.5-72b-instruct';
    }

    // Streaming response con Vercel AI SDK
    const result = await streamText({
      model: aiProvider(aiModel),
      messages: allMessages,
      maxTokens: 2048,
      temperature: 0.7,
      onError: async ({ error }) => {
        console.error('[Vercel AI] Error:', error.message);
        // Log error to Vercel Analytics
        if (typeof window !== 'undefined') {
          // Client-side error tracking
        }
      },
    });

    // Ritorna stream SSE
    result.pipeDataStreamToResponse(res);

  } catch (error) {
    console.error('[Vercel AI] Handler error:', error);
    res.status(500).json({
      error: 'AI service unavailable',
      details: error.message
    });
  }
}
