/**
 * LLM Provider - Multi-Model Support con LiteLLM
 * Supporta: HuggingFace, OpenAI, Anthropic, Groq, OpenRouter
 * Usage: import { getCompletion } from '@/lib/llm-provider'
 */

// Modelli disponibili per provider
export const AVAILABLE_MODELS = {
  // Hugging Face (gratuiti/economici)
  huggingface: [
    { id: 'meta-llama/Meta-Llama-3.1-70B-Instruct', name: 'Llama 3.1 70B', cost: 0.0007 },
    { id: 'mistralai/Mixtral-8x7B-Instruct-v0.1', name: 'Mixtral 8x7B', cost: 0.0005 },
    { id: 'Qwen/Qwen2.5-72B-Instruct', name: 'Qwen 2.5 72B', cost: 0.0008 },
    { id: 'deepseek-ai/DeepSeek-V3', name: 'DeepSeek V3', cost: 0.0006 },
  ],
  // OpenAI
  openai: [
    { id: 'gpt-4o', name: 'GPT-4o', cost: 0.005 },
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini', cost: 0.00015 },
    { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', cost: 0.01 },
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', cost: 0.0005 },
  ],
  // Anthropic
  anthropic: [
    { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4', cost: 0.003 },
    { id: 'claude-opus-20240229', name: 'Claude Opus', cost: 0.015 },
    { id: 'claude-haiku-20240307', name: 'Claude Haiku', cost: 0.00025 },
  ],
  // Groq (ultra-fast)
  groq: [
    { id: 'llama-3.1-70b-versatile', name: 'Llama 3.1 70B', cost: 0.00059 },
    { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B', cost: 0.00005 },
    { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B', cost: 0.00024 },
  ],
  // OpenRouter (tutti i modelli)
  openrouter: [
    { id: 'qwen/qwen-2.5-72b-instruct', name: 'Qwen 2.5 72B', cost: 0.0007 },
    { id: 'meta-llama/llama-3.1-70b-instruct', name: 'Llama 3.1 70B', cost: 0.0007 },
    { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', cost: 0.003 },
    { id: 'google/gemini-pro-1.5', name: 'Gemini Pro 1.5', cost: 0.0025 },
  ],
};

// Prezzi per token (input/output) per modello
const MODEL_PRICING = {
  // HuggingFace ($ per 1K tokens)
  'meta-llama/Meta-Llama-3.1-70B-Instruct': { input: 0.0007, output: 0.0007 },
  'mistralai/Mixtral-8x7B-Instruct-v0.1': { input: 0.0005, output: 0.0005 },
  'Qwen/Qwen2.5-72B-Instruct': { input: 0.0008, output: 0.0008 },
  'deepseek-ai/DeepSeek-V3': { input: 0.0006, output: 0.0006 },
  // OpenAI
  'gpt-4o': { input: 0.005, output: 0.015 },
  'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
  'gpt-4-turbo': { input: 0.01, output: 0.03 },
  'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 },
  // Anthropic
  'claude-sonnet-4-20250514': { input: 0.003, output: 0.015 },
  'claude-opus-20240229': { input: 0.015, output: 0.075 },
  'claude-haiku-20240307': { input: 0.00025, output: 0.00125 },
  // Groq
  'llama-3.1-70b-versatile': { input: 0.00059, output: 0.00079 },
  'llama-3.1-8b-instant': { input: 0.00005, output: 0.00008 },
  // OpenRouter
  'qwen/qwen-2.5-72b-instruct': { input: 0.0007, output: 0.0007 },
  'meta-llama/llama-3.1-70b-instruct': { input: 0.0007, output: 0.0007 },
  'anthropic/claude-3.5-sonnet': { input: 0.003, output: 0.015 },
};

/**
 * Stima il costo di una chiamata LLM
 */
export function estimateCost(modelId, inputTokens, outputTokens) {
  const pricing = MODEL_PRICING[modelId] || { input: 0.001, output: 0.002 };
  const inputCost = (inputTokens / 1000) * pricing.input;
  const outputCost = (outputTokens / 1000) * pricing.output;
  return {
    total: inputCost + outputCost,
    input: inputCost,
    output: outputCost,
    currency: 'USD'
  };
}

/**
 * Ottiene la chiave API per il provider
 */
function getApiKey(provider, userApiKey = null) {
  // Se l'utente fornisce la propria chiave, usa quella
  if (userApiKey) return userApiKey;

  // Altrimenti usa le chiavi di sistema
  const keys = {
    huggingface: process.env.HUGGINGFACE_API_KEY || process.env.HF_API_KEY,
    openai: process.env.OPENAI_API_KEY,
    anthropic: process.env.ANTHROPIC_API_KEY,
    groq: process.env.GROQ_API_KEY,
    openrouter: process.env.OPENROUTER_API_KEY,
  };

  return keys[provider];
}

/**
 * Chiama LLM con LiteLLM (via fetch a OpenRouter o API dirette)
 * @param {string} model - ID modello (es: 'huggingface:meta-llama/Meta-Llama-3.1-70B-Instruct')
 * @param {array} messages - Array di messaggi [{role, content}]
 * @param {object} options - { temperature, max_tokens, stream, userApiKey }
 */
export async function getCompletion(model, messages, options = {}) {
  const {
    temperature = 0.7,
    max_tokens = 2048,
    stream = false,
    userApiKey = null,
    systemPrompt = null
  } = options;

  // Parse model string (formato: "provider:model-id")
  let [provider, modelId] = model.includes(':') ? model.split(':') : ['openrouter', model];

  // Se solo modelId, cerca nel registry
  if (!modelId) {
    modelId = provider;
    provider = 'openrouter';
  }

  const apiKey = getApiKey(provider, userApiKey);
  if (!apiKey) {
    throw new Error(`API key non configurata per ${provider}`);
  }

  // Costruisci messaggi con system prompt
  const allMessages = systemPrompt
    ? [{ role: 'system', content: systemPrompt }, ...messages]
    : messages;

  // Endpoint e config per provider
  const configs = {
    huggingface: {
      baseURL: 'https://api-inference.huggingface.co/models',
      headers: { 'Authorization': `Bearer ${apiKey}` },
      modelPath: modelId
    },
    openai: {
      baseURL: 'https://api.openai.com/v1',
      headers: { 'Authorization': `Bearer ${apiKey}` },
      modelPath: modelId
    },
    anthropic: {
      baseURL: 'https://api.anthropic.com/v1',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'anthropic-version': '2023-06-01'
      },
      modelPath: modelId
    },
    groq: {
      baseURL: 'https://api.groq.com/openai/v1',
      headers: { 'Authorization': `Bearer ${apiKey}` },
      modelPath: modelId
    },
    openrouter: {
      baseURL: 'https://openrouter.ai/api/v1',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://aethersy.com',
        'X-Title': 'Aethersy AI Forge'
      },
      modelPath: modelId
    }
  };

  const config = configs[provider];
  if (!config) {
    throw new Error(`Provider ${provider} non supportato`);
  }

  // Chiama API
  const url = provider === 'huggingface'
    ? `${config.baseURL}/${config.modelPath}/v1/chat/completions`
    : `${config.baseURL}/chat/completions`;

  const body = {
    model: config.modelPath,
    messages: allMessages,
    temperature,
    max_tokens,
    stream
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: config.headers,
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API error (${provider}): ${error}`);
  }

  // Parse response
  const data = await response.json();

  // Estrai risultato e usage
  const content = data.choices?.[0]?.message?.content || '';
  const usage = data.usage || {
    prompt_tokens: 0,
    completion_tokens: 0,
    total_tokens: 0
  };

  // Calcola costo
  const cost = estimateCost(modelId, usage.prompt_tokens, usage.completion_tokens);

  return {
    content,
    model: modelId,
    provider,
    usage,
    cost,
    raw: data
  };
}

/**
 * Streaming completion con SSE
 */
export async function streamCompletion(model, messages, options = {}) {
  const {
    temperature = 0.7,
    max_tokens = 2048,
    userApiKey = null,
    systemPrompt = null
  } = options;

  let [provider, modelId] = model.includes(':') ? model.split(':') : ['openrouter', model];
  if (!modelId) {
    modelId = provider;
    provider = 'openrouter';
  }

  const apiKey = getApiKey(provider, userApiKey);
  if (!apiKey) {
    throw new Error(`API key non configurata per ${provider}`);
  }

  const allMessages = systemPrompt
    ? [{ role: 'system', content: systemPrompt }, ...messages]
    : messages;

  // OpenRouter supporta streaming nativo
  const url = 'https://openrouter.ai/api/v1/chat/completions';

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://aethersy.com',
      'X-Title': 'Aethersy AI Forge',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: modelId,
      messages: allMessages,
      temperature,
      max_tokens,
      stream: true
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Streaming API error: ${error}`);
  }

  return response.body; // Returns ReadableStream per SSE
}

/**
 * Lista tutti i modelli disponibili
 */
export function listModels(provider = null) {
  if (provider) {
    return AVAILABLE_MODELS[provider] || [];
  }
  return Object.entries(AVAILABLE_MODELS).flatMap(([prov, models]) =>
    models.map(m => ({ ...m, provider: prov }))
  );
}

/**
 * Verifica se un modello è disponibile
 */
export function isModelAvailable(modelId) {
  return listModels().some(m => m.id === modelId);
}
