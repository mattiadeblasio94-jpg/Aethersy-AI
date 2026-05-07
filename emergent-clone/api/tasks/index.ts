import type { NextApiRequest, NextApiResponse } from 'next'
import { db } from '../../lib/db'
import { planTask } from '../../lib/llm'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const { projectId } = req.query
    if (projectId) {
      const tasks = await db.tasks.findByProjectId(projectId as string)
      return res.json(tasks)
    }
    return res.status(400).json({ error: 'projectId required' })
  }
  if (req.method === 'POST') {
    const { project_id, type, prompt } = req.body
    const plan = await planTask(prompt)
    const task = await db.tasks.create({ project_id, type, status: 'pending', prompt, result: JSON.stringify(plan) })
    return res.status(201).json(task)
  }
  return res.status(405).json({ error: 'Method not allowed' })
}
