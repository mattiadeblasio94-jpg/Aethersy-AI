import axios from 'axios'

const GROQ_API_KEY = process.env.GROQ_API_KEY || ''
const GROQ_MODEL = 'llama-3.1-8b-instant'

export async function generateChatCompletion(messages: Array<{ role: string; content: string }>): Promise<string> {
  if (!GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY not configured')
  }

  try {
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: GROQ_MODEL,
        messages,
        max_tokens: 4096,
        temperature: 0.7,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROQ_API_KEY}`,
        },
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
  const systemPrompt = `Sei un esperto sviluppatore full-stack. Scrivi codice pulito, ben commentato e funzionante.
Usa TypeScript, React, Next.js, TailwindCSS quando appropriato.
Spiega brevemente le tue scelte tecniche.`

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: context ? `${context}\n\n${prompt}` : prompt },
  ]

  return generateChatCompletion(messages)
}

export async function planTask(prompt: string): Promise<{ steps: string[]; estimate: string }> {
  const systemPrompt = `Sei un project manager AI. Analizza la richiesta e crea un piano di esecuzione.
Restituisci SOLO un array JSON di step e una stima del tempo.`

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: `Crea un piano per: ${prompt}` },
  ]

  const response = await generateChatCompletion(messages)

  try {
    const parsed = JSON.parse(response)
    return {
      steps: parsed.steps || [response],
      estimate: parsed.estimate || '5 min',
    }
  } catch {
    return {
      steps: [response],
      estimate: '5 min',
    }
  }
}
