import type { NextApiRequest, NextApiResponse } from 'next'
import { db } from '../../../emergent-clone-lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const projects = await db.projects.findAll()
    return res.json(projects)
  }
  if (req.method === 'POST') {
    const { name, description } = req.body
    const project = await db.projects.create({ name, description: description || '', status: 'idle' })
    return res.status(201).json(project)
  }
  return res.status(405).json({ error: 'Method not allowed' })
}
