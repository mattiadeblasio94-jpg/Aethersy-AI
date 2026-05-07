/**
 * AI Chat API - Direct Groq call
 * Bypasses lara-core to ensure env vars are read correctly
 */

export const config = {
  runtime: 'nodejs'
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { message, userId = 'anon', sessionId = 'session-1' } = req.body

  if (!message) {
    return res.status(400).json({ error: 'Message required' })
  }

  // Read env vars at runtime
  const groqKey = process.env.GROQ_API_KEY
  const alibabaKey = process.env.ALIBABA_API_KEY
  const alibabaHost = process.env.ALIBABA_HOST_URL
  const alibabaModel = process.env.ALIBABA_MODEL

  console.log('[AI-CHAT] Env vars check:')
  console.log('  GROQ_API_KEY:', groqKey ? `${groqKey.length} chars` : 'MISSING')
  console.log('  ALIBABA_API_KEY:', alibabaKey ? `${alibabaKey.length} chars` : 'MISSING')
  console.log('  ALIBABA_HOST_URL:', alibabaHost || 'MISSING')
  console.log('  ALIBABA_MODEL:', alibabaModel || 'MISSING')

  const SYSTEM_PROMPT = `Sei Lara, AI Agent senior di Aethersy.
Sei disponibile, simpatica e intelligente.
Conosci: startup, funding, scaling, marketing, sales, product development.
Formato: CONTESTO → INSIGHT → AZIONE → NEXT STEP.`

  // Try Alibaba first
  if (alibabaKey && alibabaHost) {
    try {
      console.log('[AI-CHAT] Trying Alibaba...')
      const res = await fetch(`${alibabaHost}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${alibabaKey}`
        },
        body: JSON.stringify({
          model: alibabaModel || 'qwen-plus',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: message }
          ],
          max_tokens: 1000,
          temperature: 0.7
        })
      })

      if (res.ok) {
        const data = await res.json()
        console.log('[AI-CHAT] Alibaba success')
        return res.json({
          response: data.choices?.[0]?.message?.content || data.output?.text,
          provider: 'alibaba',
          success: true
        })
      } else {
        const err = await res.text()
        console.log('[AI-CHAT] Alibaba error:', res.status, err)
      }
    } catch (e) {
      console.log('[AI-CHAT] Alibaba exception:', e.message)
    }
  }

  // Try Groq
  if (groqKey) {
    try {
      console.log('[AI-CHAT] Trying Groq...')
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
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

      if (res.ok) {
        const data = await res.json()
        console.log('[AI-CHAT] Groq success')
        return res.json({
          response: data.choices?.[0]?.message?.content,
          provider: 'groq',
          success: true
        })
      } else {
        const err = await res.text()
        console.log('[AI-CHAT] Groq error:', res.status, err)
        return res.status(res.status).json({ error: 'Groq: ' + err })
      }
    } catch (e) {
      console.log('[AI-CHAT] Groq exception:', e.message)
    }
  }

  // No provider available
  console.error('[AI-CHAT] No AI provider available')
  return res.status(503).json({
    error: 'Nessun provider AI disponibile',
    debug: {
      groq: groqKey ? 'configured' : 'MISSING',
      alibaba: alibabaKey ? 'configured' : 'MISSING'
    }
  })
}
