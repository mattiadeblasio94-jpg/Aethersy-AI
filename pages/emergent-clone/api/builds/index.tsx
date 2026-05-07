import type { NextApiRequest, NextApiResponse } from 'next'
import { db } from '../../lib/db'
import { executeBuild } from '../../lib/builder'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const { projectId } = req.query
    if (projectId) {
      const builds = await db.builds.findByProjectId(projectId as string)
      return res.json(builds)
    }
    return res.status(400).json({ error: 'projectId required' })
  }

  if (req.method === 'POST') {
    const { project_id, task_id, prompt, files } = req.body

    // Create build record
    const build = await db.builds.create({
      project_id,
      task_id,
      status: 'building',
    })

    // Execute build asynchronously
    const result = await executeBuild(prompt, files || {})

    // Update build record
    await db.builds.update(build.id, {
      status: result.success ? 'success' : 'failed',
      output: result.output,
      error: result.error,
    })

    return res.status(201).json({
      ...build,
      ...result,
      status: result.success ? 'success' : 'failed',
    })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
