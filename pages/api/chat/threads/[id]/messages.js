/**
 * Chat Thread Messages API - Get messages for a thread
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Return empty messages for new threads
  return res.json([])
}
