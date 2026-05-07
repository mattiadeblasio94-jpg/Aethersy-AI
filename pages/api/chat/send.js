/**
 * Chat Send API - Send message and get AI response
 */
import axios from 'axios'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { thread_id, text, user_id = 'anon' } = req.body

    if (!text || !thread_id) {
      return res.status(400).json({ error: 'thread_id and text required' })
    }

    // Call Groq for AI response
    const groqKey = process.env.GROQ_API_KEY

    const SYSTEM_PROMPT = `Sei Lara, AI Agent senior di Aethersy.
Sei disponibile, simpatica e intelligente.
Conosci: startup, funding, scaling, marketing, sales, product development.
Formato: CONTESTO → INSIGHT → AZIONE → NEXT STEP.`

    let aiResponse = "Scusa, ho avuto un problema temporaneo. Riprova!"

    if (groqKey) {
      try {
        const groqRes = await axios.post(
          'https://api.groq.com/openai/v1/chat/completions',
          {
            model: 'llama-3.1-8b-instant',
            messages: [
              { role: 'system', content: SYSTEM_PROMPT },
              { role: 'user', content: text }
            ],
            max_tokens: 1000,
            temperature: 0.7
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer ' + groqKey
            },
            timeout: 30000
          }
        )
        aiResponse = groqRes.data.choices?.[0]?.message?.content || aiResponse
      } catch (e) {
        console.log('Groq error:', e.message)
      }
    }

    const now = new Date().toISOString()

    // Return both messages
    return res.json({
      user: {
        id: 'user-' + Date.now(),
        role: 'user',
        text: text,
        ts: now
      },
      assistant: {
        id: 'ai-' + Date.now(),
        role: 'assistant',
        text: aiResponse,
        ts: now
      }
    })

  } catch (error) {
    console.error('Chat send error:', error)
    return res.status(500).json({ error: error.message })
  }
}
