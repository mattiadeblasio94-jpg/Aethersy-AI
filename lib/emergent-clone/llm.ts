import axios from 'axios'

const GROQ_API_KEY = process.env.GROQ_API_KEY || ''
const GROQ_MODEL = 'llama-3.1-8b-instant'

export async function generateChatCompletion(messages: Array<{ role: string; content: string }>): Promise<string> {
  if (!GROQ_API_KEY) throw new Error('GROQ_API_KEY not configured')

  try {
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      { model: GROQ_MODEL, messages, max_tokens: 4096, temperature: 0.7 },
      {
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GROQ_API_KEY}` },
        timeout: 60000,
      }
    )
    return response.data.choices?.[0]?.message?.content || ''
  } catch (error: any) {
    console.error('LLM error:', error.message)
    throw new Error(`LLM failed: ${error.message}`)
  }
}

export async function generateCode(prompt: string, context?: string): Promise<string> {
  const systemPrompt = `Sei un esperto sviluppatore full-stack. Scrivi codice pulito, ben commentato e funzionante.`
  const messages = [{ role: 'system', content: systemPrompt }, { role: 'user', content: context ? `${context}\n\n${prompt}` : prompt }]
  return generateChatCompletion(messages)
}

export async function planTask(prompt: string): Promise<{ steps: string[]; estimate: string }> {
  const messages = [{ role: 'system', content: 'Sei un project manager AI. Crea un piano JSON con steps e stima tempo.' }, { role: 'user', content: `Piano per: ${prompt}` }]
  const response = await generateChatCompletion(messages)
  try {
    const parsed = JSON.parse(response)
    return { steps: parsed.steps || [response], estimate: parsed.estimate || '5 min' }
  } catch {
    return { steps: [response], estimate: '5 min' }
  }
}

type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

const SYSTEM_PROMPT = `
Sei un AI App Architect.
Dato il dialogo con l'utente, produci una SPECIFICA STRUTTURATA dell'app da costruire in JSON.
Non generare codice, solo struttura: pages, components, api, db_models, integrations.
`;

export async function generateAppSpec(messages: ChatMessage[]): Promise<any> {
  const payload = {
    model: process.env.LLM_MODEL_ID ?? 'gpt-4.1-mini',
    messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
    response_format: { type: 'json_object' }
  };

  const res = await fetch(process.env.LLM_API_URL!, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.LLM_API_KEY}`
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`LLM error: ${text}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.parsed ?? data.choices?.[0]?.message?.content;
}
