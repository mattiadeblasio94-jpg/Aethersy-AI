// API per gestire bot Telegram su tutti i server
import fetch from 'node-fetch';

const SERVERS = [
  { name: 'Server 1 (BOT)', ip: '47.87.134.105', port: 9999 },
  { name: 'Server 2', ip: '47.87.141.18', port: 9999 },
  { name: 'Server 3', ip: '47.87.139.66', port: 9999 },
  { name: 'Server 4', ip: '47.87.141.154', port: 9999 },
];

export default async function handler(req, res) {
  const { action } = req.query;

  const sendCmd = async (server, cmd) => {
    try {
      const r = await fetch(`http://${server.ip}:${server.port}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cmd }),
      });
      return await r.json();
    } catch (e) {
      return { error: e.message };
    }
  };

  if (action === 'status') {
    const results = await Promise.all(SERVERS.map(s => sendCmd(s, 'status')));
    return res.json({ servers: SERVERS.map((s, i) => ({ ...s, ...results[i] })) });
  }

  if (action === 'deploy' || action === 'restart' || action === 'start' || action === 'stop') {
    const results = await Promise.all(SERVERS.map(s => sendCmd(s, action)));
    return res.json({ ok: true, results });
  }

  res.status(400).json({ error: 'Azione non valida' });
}
