import type { NextApiRequest, NextApiResponse } from 'next'
import { orchestrator } from '../../../../lib/agents/orchestrator'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { agentId } = req.query
    const { input, context } = req.body

    if (!input) {
      return res.status(400).json({
        success: false,
        error: 'Input è obbligatorio'
      })
    }

    const agent = orchestrator.getAgent(agentId as string)

    if (!agent) {
      return res.status(404).json({
        success: false,
        error: `Agent "${agentId}" non trovato`
      })
    }

    const result = await agent.execute(input, context)

    return res.status(200).json({ success: true, result })
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Agent execution error'
    })
  }
}
