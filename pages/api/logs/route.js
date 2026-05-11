/**
 * System Logs API - Real-time logs from all agents
 */

import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Fetch recent logs from Redis
    const logs = await kv.lrange('system:logs', 0, 49) || [];

    const formattedLogs = logs.map(log => {
      const data = typeof log === 'string' ? JSON.parse(log) : log;
      return {
        agent: data.agent || 'System',
        message: data.message || data.msg || 'Event',
        time: formatTime(data.timestamp || Date.now()),
        type: data.type || 'info'
      };
    });

    return res.status(200).json({ logs: formattedLogs });
  } catch (e) {
    // Return mock logs if Redis not available
    return res.status(200).json({
      logs: [
        { agent: 'System', message: 'Logs service unavailable', time: 'now', type: 'warning' }
      ]
    });
  }
}

function formatTime(timestamp) {
  const diff = Date.now() - timestamp;
  if (diff < 60000) return 'now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}
