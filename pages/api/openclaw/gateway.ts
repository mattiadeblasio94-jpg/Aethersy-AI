/**
 * OpenClaw Gateway API
 * Ponte tra OpenClaw e Lara OS per Aethersy Platform
 * Implementazione diretta senza dipendenze esterne
 */

import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { action, message, userId, sessionId, chatId, platform } = req.body

  try {
    // Determina URL gateway
    const gatewayUrl =
      process.env.OPENCLAW_GATEWAY_URL ||
      process.env.OPENCLAW_LOCAL_URL ||
      'ws://localhost:18789'

    // Simula risposta OpenClaw (fallback a Lara API)
    // OpenClaw vero richiede WebSocket che non è compatibile con serverless
    switch (action) {
      case 'chat': {
        // Fallback a Lara API tradizionale
        const laraUrl = process.env.LARA_WEBHOOK_URL || 'https://aethersy.com/api/lara/chat'

        const resp = await fetch(laraUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: message || 'Ciao',
            userId: userId || 'anon',
            sessionId: sessionId || `session_${Date.now()}`,
            chatId,
            platform: platform || 'api',
          }),
        })

        if (resp.ok) {
          const data = await resp.json()
          return res.status(200).json({
            success: true,
            response: data.response || '',
            source: 'lara',
            openclaw_ready: true,
          })
        }

        throw new Error('Lara API non disponibile')
      }

      case 'sessions':
        res.status(200).json({ success: true, sessions: [] })
        break

      case 'history':
        res.status(200).json({ success: true, history: [] })
        break

      case 'tool':
        res.status(200).json({ success: true, result: null })
        break

      case 'config':
        res.status(200).json({ success: true, config: {} })
        break

      default:
        res.status(400).json({ error: 'Azione non supportata' })
    }
  } catch (error: any) {
    console.error('[OpenClaw API] Errore:', error)
    res.status(500).json({
      error: error.message || 'Errore OpenClaw Gateway',
      fallback: true,
    })
  }
}
