/**
 * LARA CHAT API — Direct Groq/Alibaba call
 */
import axios from 'axios'
import { v4 as uuidv4 } from 'uuid'

export const config = {
  runtime: 'nodejs'
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Metodo non consentito' })
  }

  try {
    const {
      message,
      userId = 'anonymous',
      sessionId = uuidv4(),
      chatId,
      platform = 'web'
    } = req.body

    if (!message) {
      return res.status(400).json({ error: 'Messaggio mancante' })
    }

    // System prompt con personalità imprenditoriale Lara
    const SYSTEM_PROMPT = `Sei Lara, AI Agent senior di Aethersy.
Sei disponibile, simpatica e intelligente — mai un bot freddo.
Conosci profondamente: startup, funding, scaling, marketing, sales, product development, go-to-market, unit economics, fundraising, pitch deck.
Sei REATTIVA: rispondi con energia ed entusiasmo.
Sei RIFLESSIVA: pensi prima di rispondere, analizzi il contesto.
Sei CONCRETA: dai sempre un next action eseguibile.
Parli come una partner di business in gamba. Usi "noi" quando parli di progetti.
Formato: **grassetto** per concetti chiave, emoji moderate (🎯📈💡🚀), struttura CONTESTO → INSIGHT → AZIONE → NEXT STEP.`

    // Read env vars
    const groqKey = process.env.GROQ_API_KEY
    const alibabaKey = process.env.ALIBABA_API_KEY
    const alibabaHost = process.env.ALIBABA_HOST_URL
    const alibabaModel = process.env.ALIBABA_MODEL

    console.log('[LARA] GROQ_API_KEY:', groqKey ? groqKey.length + ' chars' : 'MISSING')
    console.log('[LARA] ALIBABA_API_KEY:', alibabaKey ? alibabaKey.length + ' chars' : 'MISSING')

    // Try Groq first
    if (groqKey && groqKey.length > 10) {
      try {
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

        return res.json({
          response: groqRes.data.choices[0].message.content,
          session_id: sessionId,
          success: true,
          platform,
          provider: 'groq'
        })
      } catch (groqErr: any) {
        console.log('[LARA] Groq error:', groqErr.message)
        if (groqErr.response) {
          return res.status(groqErr.response.status).json({
            error: 'Groq: ' + (groqErr.response.data?.error?.message || 'API error')
          })
        }
      }
    }

    // Try Alibaba
    if (alibabaKey && alibabaHost) {
      try {
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
          session_id: sessionId,
          success: true,
          platform,
          provider: 'alibaba'
        })
      } catch (albErr: any) {
        console.log('[LARA] Alibaba error:', albErr.message)
      }
    }

    // No provider
    return res.status(503).json({
      error: 'Nessun provider AI disponibile',
      debug: {
        groq: groqKey ? 'configured' : 'MISSING',
        alibaba: alibabaKey ? 'configured' : 'MISSING'
      }
    })

  } catch (error: any) {
    console.error('Lara Chat API error:', error)
    return res.status(500).json({
      error: error.message
    })
  }
}
