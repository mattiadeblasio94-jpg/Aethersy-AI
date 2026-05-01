import { useState, useEffect } from 'react';

const SERVERS = [
  { name: '🤖 BOT AI', ip: '47.91.76.37', port: 9999 },
  { name: '📊 DATABASE', ip: '47.87.141.18', port: 9999 },
  { name: '⚙️ WORKER', ip: '47.87.139.66', port: 9999 },
  { name: '📈 MONITOR', ip: '47.87.141.154', port: 9999 },
];

export default function BotManager() {
  const [status, setStatus] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchStatus = async () => {
    setLoading(true);
    const r = await fetch('/api/bot/manage?action=status');
    const data = await r.json();
    setStatus(data.servers || []);
    setLoading(false);
  };

  const doAction = async (action) => {
    await fetch(`/api/bot/manage?action=${action}`, { method: 'POST' });
    fetchStatus();
  };

  useEffect(() => { fetchStatus(); }, []);

  return (
    <div style={{ padding: 20, background: '#0a0a0a', minHeight: '100vh', color: '#fff' }}>
      <h1>🤖 Lara Bot Manager</h1>

      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <button onClick={() => doAction('deploy')}>🚀 Deploy</button>
        <button onClick={() => doAction('restart')}>🔄 Restart</button>
        <button onClick={() => doAction('start')}>▶️ Start</button>
        <button onClick={() => doAction('stop')}>⏹️ Stop</button>
        <button onClick={fetchStatus}>📡 Refresh</button>
      </div>

      <div style={{ display: 'grid', gap: 10 }}>
        {status.map((s, i) => (
          <div key={i} style={{
            padding: 15,
            background: s.status === 'active' ? '#166534' : s.error ? '#991b1b' : '#333',
            borderRadius: 8
          }}>
            <strong>{s.name}</strong> ({s.ip})
            <br />
            Stato: {s.status || s.error || '...'}
          </div>
        ))}
      </div>

      <hr style={{ margin: '20px 0', borderColor: '#333' }} />

      <h2>📋 Installazione (primo setup)</h2>
      <p>Esegui su OGNI server:</p>
      <pre style={{ background: '#222', padding: 15, borderRadius: 8, overflow: 'auto' }}>
{`curl -o /tmp/agent.sh https://raw.githubusercontent.com/mattiadeblasio94-jpg/Aethersy-AI/master/bot-telegram/install-agent.sh
chmod +x /tmp/agent.sh
bash /tmp/agent.sh`}
      </pre>
    </div>
  );
}
