// lib/ollama.ts
// Aethersy-AI — Lara Agent | Ollama Integration Layer

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';

// ─── TIPI ─────────────────────────────────────────────────────────

export type OllamaModel =
  | 'qwen2.5-coder:7b'
  | 'deepseek-r1:14b'
  | 'llama3.3:70b';

export interface OllamaMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OllamaOptions {
  model?: OllamaModel;
  temperature?: number;
  top_p?: number;
  stream?: boolean;
}

export interface OllamaResponse {
  model: string;
  message: OllamaMessage;
  done: boolean;
  total_duration?: number;
  eval_count?: number;
}

// ─── CHAT STANDARD ────────────────────────────────────────────────

export async function ollamaChat(
  messages: OllamaMessage[],
  options: OllamaOptions = {}
): Promise<string> {
  const {
    model = 'llama3.3:70b',
    temperature = 0.7,
    top_p = 0.9,
    stream = false,
  } = options;

  const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages,
      stream,
      options: { temperature, top_p },
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama error: ${response.status} — ${response.statusText}`);
  }

  const data: OllamaResponse = await response.json();
  return data.message.content;
}

// ─── CHAT STREAMING ───────────────────────────────────────────────

export async function* ollamaChatStream(
  messages: OllamaMessage[],
  options: OllamaOptions = {}
): AsyncGenerator<string> {
  const {
    model = 'llama3.3:70b',
    temperature = 0.7,
  } = options;

  const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages,
      stream: true,
      options: { temperature },
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama stream error: ${response.status}`);
  }

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  if (!reader) throw new Error('Stream non disponibile');

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split('\n').filter(Boolean);

    for (const line of lines) {
      try {
        const parsed: OllamaResponse = JSON.parse(line);
        if (parsed.message?.content) {
          yield parsed.message.content;
        }
      } catch {
        // chunk incompleto, ignora
      }
    }
  }
}

// ─── VERIFICA MODELLI ATTIVI ───────────────────────────────────────

export async function getActiveModels(): Promise<string[]> {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`);
    if (!response.ok) return [];
    const data = await response.json();
    return data.models?.map((m: { name: string }) => m.name) ?? [];
  } catch {
    return [];
  }
}

// ─── PING OLLAMA ──────────────────────────────────────────────────

export async function isOllamaOnline(): Promise<boolean> {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`);
    return response.ok;
  } catch {
    return false;
  }
}
