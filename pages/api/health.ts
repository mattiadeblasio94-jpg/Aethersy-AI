/**
 * Health Check API
 * Verifica stato tutti i servizi Lara
 */

import { NextApiRequest, NextApiResponse } from 'next'
import { checkDatabase, checkReplicate, checkTelegram } from '../../lib/health-check'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const checks = await Promise.allSettled([
    checkDatabase(),
    checkReplicate(),
    checkTelegram()
  ])

  const services = {
    database: checks[0].status === 'fulfilled' && checks[0].value,
    replicate: checks[1].status === 'fulfilled' && checks[1].value,
    telegram: checks[2].status === 'fulfilled' && checks[2].value,
    nextjs: true
  }

  const allHealthy = Object.values(services).every(s => s)

  return res.status(allHealthy ? 200 : 503).json({
    status: allHealthy ? 'healthy' : 'degraded',
    services,
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    lara_os: true
  })
}
