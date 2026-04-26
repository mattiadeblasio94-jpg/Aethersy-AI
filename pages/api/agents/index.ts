import type { NextApiRequest, NextApiResponse } from 'next'
import { orchestrator } from '../../../lib/agents/orchestrator'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const agents = orchestrator.getAllAgents().map(agent => agent.getConfig())
      return res.status(200).json({ success: true, agents })
    } catch (error) {
      return res.status(500).json({ success: false, error: 'Failed to fetch agents' })
    }
  }

  if (req.method === 'POST') {
    try {
      const { input, agents, parallel = true, context } = req.body

      if (!input || !agents || !Array.isArray(agents)) {
        return res.status(400).json({
          success: false,
          error: 'Input e agents sono obbligatori'
        })
      }

      const result = await orchestrator.executeTask({
        input,
        agents,
        parallel,
        context
      })

      return res.status(200).json({ success: true, result })
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Orchestrator error'
      })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
