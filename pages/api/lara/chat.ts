/**
 * LARA CHAT API — Think-Plan-Act-Verify Cycle
 * Updated to use lara-core.ts
 */

import { runLaraCycle } from '../../../lib/lara-core'
import { v4 as uuidv4 } from 'uuid'

// Force Node.js runtime for proper env var access
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

    // Chiama Vercel AI Gateway (con fallback a Groq diretto)
    const gatewayKey = process.env.VERCEL_AI_GATEWAY_KEY || ''
    const groqKey = process.env.GROQ_API_KEY || ''

    // Debug log
    console.log('[LARA-CHAT] GROQ_API_KEY length:', groqKey.length)
    console.log('[LARA-CHAT] VERCEL_AI_GATEWAY_KEY length:', gatewayKey.length)

    if (gatewayKey) {
      // Usa Vercel AI Gateway
      try {
        const gatewayRes = await fetch('https://ai-gateway.vercel.sh/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${gatewayKey}`
          },
          body: JSON.stringify({
            model: 'groq/llama-3.1-8b-instant',
            messages: [
              { role: 'system', content: SYSTEM_PROMPT },
              { role: 'user', content: message }
            ],
            max_tokens: 1000,
            temperature: 0.7
          })
        })

        if (gatewayRes.ok) {
          const gatewayData = await gatewayRes.json()
          return res.json({
            response: gatewayData.choices[0].message.content,
            session_id: sessionId,
            success: true,
            platform
          })
        }
      } catch (gwErr: any) {
        console.log('Gateway error:', gwErr.message)
        // Fallback a Groq diretto
      }
    }

    // Fallback: Chiama Groq direttamente
    console.log('[LARA-CHAT] Attempting direct Groq call, key length:', groqKey.length)
    if (groqKey && groqKey.length > 10) {
      try {
        const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${groqKey}`
          },
          body: JSON.stringify({
            model: 'llama-3.1-8b-instant',
            messages: [
              { role: 'system', content: SYSTEM_PROMPT },
              { role: 'user', content: message }
            ],
            max_tokens: 1000,
            temperature: 0.7
          })
        })

        console.log('[LARA-CHAT] Groq response status:', groqRes.status)
        if (groqRes.ok) {
          const groqData = await groqRes.json()
          return res.json({
            response: groqData.choices[0].message.content,
            session_id: sessionId,
            success: true,
            platform
          })
        } else {
          const errText = await groqRes.text()
          console.log('[LARA-CHAT] Groq error body:', errText)
          return res.status(groqRes.status).json({ error: 'Groq API error: ' + errText })
        }
      } catch (groqErr: any) {
        console.log('[LARA-CHAT] Groq exception:', groqErr.message)
      }
    } else {
      console.log('[LARA-CHAT] Groq key not valid, length:', groqKey.length)
    }

    // Fallback a ciclo Lara completo
    const result = await runLaraCycle({
      userId,
      sessionId,
      userMessage: message,
      chatId,
      platform
    })

    return res.json({
      response: result.response,
      session_id: sessionId,
      steps_executed: result.execution.steps_completed,
      total_steps: result.execution.total_steps,
      success: result.execution.success,
      next_actions: result.nextActions,
      duration_ms: result.execution.duration_ms
    })

  } catch (error: any) {
    console.error('Lara Chat API error:', error)
    return res.status(500).json({
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
}
