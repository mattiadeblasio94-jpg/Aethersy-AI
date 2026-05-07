import type { NextApiRequest, NextApiResponse } from 'next'
import { db } from '../../lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query
  if (req.method === 'GET') {
    const project = await db.projects.findById(id as string)
    if (!project) return res.status(404).json({ error: 'Project not found' })
    return res.json(project)
  }
  if (req.method === 'PUT') {
    const project = await db.projects.update(id as string, req.body)
    if (!project) return res.status(404).json({ error: 'Project not found' })
    return res.json(project)
  }
  if (req.method === 'DELETE') {
    await db.projects.delete(id as string)
    return res.status(204).send()
  }
  return res.status(405).json({ error: 'Method not allowed' })
}
