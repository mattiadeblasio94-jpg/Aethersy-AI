/**
 * Chat Threads API - List and create threads
 */
export default async function handler(req, res) {
  if (req.method === 'GET') {
    // Return mock threads for now
    return res.json([
      { id: 'default', title: 'New Chat', updated_at: new Date().toISOString() }
    ])
  }

  if (req.method === 'POST') {
    const { title = 'New Chat' } = req.body
    return res.json({
      id: 'thread-' + Date.now(),
      title,
      created_at: new Date().toISOString()
    })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
