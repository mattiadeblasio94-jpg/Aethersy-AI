import { runLaraAgent } from '../../../lib/lara-agent'
import { v4 as uuidv4 } from 'uuid'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Metodo non consentito' })
  }

  try {
    const { message, userId = 'anonymous', sessionId = uuidv4() } = req.body

    if (!message) {
      return res.status(400).json({ error: 'Messaggio mancante' })
    }

    const result = await runLaraAgent({
      userId,
      sessionId,
      userMessage: message
    })

    return res.json({
      response: result.response,
      session_id: result.session_id,
      steps_executed: result.steps_executed
    })

  } catch (error) {
    console.error('Lara Chat API error:', error)
    return res.status(500).json({ error: error.message })
  }
}
