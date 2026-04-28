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

    // Chiama Groq con system prompt (API veloce e gratuita)
    const groqKey = process.env.GROQ_API_KEY
    if (groqKey) {
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

        if (groqRes.ok) {
          const groqData = await groqRes.json()
          return res.json({
            response: groqData.choices[0].message.content,
            session_id: sessionId,
            success: true,
            platform
          })
        }
      } catch (groqErr: any) {
        console.log('Groq error:', groqErr.message)
      }
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
