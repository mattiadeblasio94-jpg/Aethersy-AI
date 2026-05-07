/**
 * AI Chat API - Direct Groq call
 */
import axios from 'axios'

export const config = {
  runtime: 'nodejs'
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { message, userId = 'anon', sessionId = 'session-1' } = req.body

    if (!message) {
      return res.status(400).json({ error: 'Message required' })
    }

    // Read env vars at runtime
    const groqKey = process.env.GROQ_API_KEY
    const alibabaKey = process.env.ALIBABA_API_KEY
    const alibabaHost = process.env.ALIBABA_HOST_URL
    const alibabaModel = process.env.ALIBABA_MODEL

    console.log('[AI-CHAT] Env vars:')
    console.log('  GROQ_API_KEY:', groqKey ? groqKey.length + ' chars' : 'MISSING')
    console.log('  ALIBABA_API_KEY:', alibabaKey ? alibabaKey.length + ' chars' : 'MISSING')

    const SYSTEM_PROMPT = 'Sei Lara, AI Agent senior di Aethersy. Rispondi in modo utile e conciso.'

    // Try Groq first
    if (groqKey && groqKey.length > 10) {
      console.log('[AI-CHAT] Calling Groq...')
      const groqRes = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          model: 'llama-3.1-8b-instant',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: message }
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

      console.log('[AI-CHAT] Groq response:', groqRes.status)
      return res.json({
        response: groqRes.data.choices?.[0]?.message?.content,
        provider: 'groq',
        success: true
      })
    }

    // Try Alibaba
    if (alibabaKey && alibabaHost) {
      console.log('[AI-CHAT] Calling Alibaba...')
      const alibabaRes = await axios.post(
        alibabaHost + '/chat/completions',
        {
          model: alibabaModel || 'qwen-plus',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: message }
          ],
          max_tokens: 1000,
          temperature: 0.7
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + alibabaKey
          },
          timeout: 30000
        }
      )

      return res.json({
        response: alibabaRes.data.choices?.[0]?.message?.content,
        provider: 'alibaba',
        success: true
      })
    }

    // No provider
    return res.status(503).json({
      error: 'Nessun provider AI configurato',
      debug: {
        groq: groqKey ? 'ok' : 'MISSING',
        alibaba: alibabaKey ? 'ok' : 'MISSING'
      }
    })

  } catch (error) {
    console.error('[AI-CHAT] Error:', error.message)
    if (error.response) {
      return res.status(error.response.status).json({
        error: error.response.data?.error?.message || 'AI API error'
      })
    }
    return res.status(500).json({ error: error.message })
  }
}
