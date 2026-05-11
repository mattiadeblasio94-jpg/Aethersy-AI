import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

const BOT_URL = 'https://t.me/Lara_Aethersy_AI_bot';

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [tool, setTool] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem('aiforge_user');
    if (!stored) {
      router.push('/?login=required');
      return;
    }
    setUser(JSON.parse(stored));
  }, []);

  function handleLogout() {
    localStorage.removeItem('aiforge_user');
    localStorage.removeItem('aiforge_token');
    router.push('/');
  }

  const tools = [
    { id: 'builder', icon: '🏗️', name: 'AI Builder', desc: 'Costruisci app' },
    { id: 'terminal', icon: '🖥️', name: 'AI Terminal', desc: '500+ template' },
    { id: 'chat', icon: '💬', name: 'Chat AI', desc: 'Parla con Lara' },
    { id: 'cinema', icon: '🎬', name: 'Cinema Studio', desc: 'Video AI' },
    { id: 'marketplace', icon: '🤖', name: 'Marketplace', desc: 'Agenti AI' },
    { id: 'skills', icon: '🎯', name: 'Skills Hub', desc: '15+ competenze' },
    { id: 'usage', icon: '📊', name: 'Usage', desc: 'Monitora crediti' },
    { id: 'pricing', icon: '💎', name: 'Piani', desc: 'Upgrade' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', color: '#f1f5f9', fontFamily: 'system-ui' }}>
      {/* Header */}
      <header style={{ padding: '1rem 2rem', background: '#0d0d16', borderBottom: '1px solid rgba(124,58,237,0.3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontSize: '2rem' }}>⚡</span>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800 }}>Aethersy-AI Dashboard</h1>
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>22+ Strumenti AI</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <a href={BOT_URL} target="_blank" rel="noopener noreferrer" style={{ padding: '0.5rem 1rem', background: 'rgba(0,136,204,0.2)', border: '1px solid rgba(0,136,204,0.4)', borderRadius: 8, color: '#fff', textDecoration: 'none', fontSize: '0.85rem' }}>
            📱 Telegram
          </a>
          {user && <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>👤 {user.name || user.email}</span>}
          <button onClick={handleLogout} style={{ padding: '0.5rem 1rem', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, color: '#f87171', cursor: 'pointer', fontSize: '0.85rem' }}>
            Esci
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ padding: '2rem', maxWidth: 1400, margin: '0 auto' }}>
        {/* Welcome Panel */}
        {!tool && (
          <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🚀</div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '1rem', background: 'linear-gradient(135deg, #7c3aed, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Benvenuto in Aethersy-AI
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '1.1rem', maxWidth: 600, margin: '0 auto 2rem' }}>
              La tua piattaforma AI completa con 22+ strumenti per business, marketing, sviluppo e creatività.
            </p>
          </div>
        )}

        {/* Tools Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {tools.map(t => (
            <div
              key={t.id}
              onClick={() => setTool(t.id)}
              style={{
                padding: '1.5rem',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(124,58,237,0.3)',
                borderRadius: 16,
                cursor: 'pointer',
                transition: 'all 0.3s'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = '#7c3aed';
                e.currentTarget.style.transform = 'translateY(-4px)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'rgba(124,58,237,0.3)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div style={{ fontSize: '2.5rem', marginBottom: '0.8rem' }}>{t.icon}</div>
              <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.1rem', fontWeight: 700 }}>{t.name}</h3>
              <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>{t.desc}</p>
            </div>
          ))}
        </div>

        {/* Tool Detail Panel */}
        {tool && (
          <div style={{ marginTop: '2rem', padding: '2rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0 }}>{tools.find(t => t.id === tool)?.name}</h2>
              <button onClick={() => setTool(null)} style={{ padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8, color: '#fff', cursor: 'pointer' }}>
                ← Torna alla dashboard
              </button>
            </div>
            <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🚧</div>
              <p>Strumento in sviluppo - Disponibile a breve</p>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '1.5rem', color: '#475569', fontSize: '0.8rem', textAlign: 'center' }}>
        <div>© 2025 Aethersy-AI · Lara AGENTE AI Aethersy</div>
        <div style={{ marginTop: '0.5rem' }}>P.IVA / CF su richiesta · <a href="mailto:aethersyai@gmail.com" style={{ color: '#475569' }}>aethersyai@gmail.com</a></div>
      </footer>
    </div>
  );
}
