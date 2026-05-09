/**
 * AI BUILDER - Costruisci app full-stack conversando con Lara AI
 */

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';

export default function BuilderPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([
    { role: 'assistant', text: `Ciao! Sono Lara e ti aiuterò a costruire la tua app full-stack. 🏗️

**Cosa posso creare per te:**
• App web React/Next.js
• API backend Node.js/Python
• Database schema e migrazioni
• Componenti UI personalizzati
• Integrazioni con servizi esterni

**Come funziona:**
1. Descrivi cosa vuoi costruire
2. Io genero il codice passo-passo
3. Puoi scaricare o deployare direttamente

Dimmi: cosa vuoi costruire oggi?` }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [project, setProject] = useState(null);
  const endRef = useRef(null);

  useEffect(() => {
    const stored = localStorage.getItem('aiforge_user');
    if (!stored) {
      router.push('/?login=required');
      return;
    }
    setUser(JSON.parse(stored));
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function send(e) {
    e?.preventDefault();
    const userMsg = input.trim();
    if (!userMsg || loading) return;
    setInput('');

    const userEntry = { role: 'user', text: userMsg };
    const assistantEntry = { role: 'assistant', text: '', streaming: true };
    setMessages(m => [...m, userEntry, assistantEntry]);
    setLoading(true);

    try {
      const res = await fetch('/api/generate-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `BUILD REQUEST: ${userMsg}. Genera struttura progetto full-stack completa con file multipli.`,
          language: 'javascript'
        }),
      });

      const data = await res.json();
      if (data.error) {
        setMessages(m => m.map((msg, i) => i === m.length - 1 ? { ...msg, text: `Errore: ${data.error}`, streaming: false } : msg));
      } else {
        setMessages(m => m.map((msg, i) => i === m.length - 1 ? {
          ...msg,
          text: data.code || 'Codice generato!',
          code: data.code,
          streaming: false
        } : msg));

        if (data.code) {
          setProject({
            name: userMsg.slice(0, 30),
            code: data.code,
            timestamp: Date.now()
          });
        }
      }
    } catch (e) {
      setMessages(m => m.map((msg, i) => i === m.length - 1 ? { ...msg, text: `Errore: ${e.message}`, streaming: false } : msg));
    }
    setLoading(false);
  }

  function downloadCode() {
    if (!project?.code) return;
    const blob = new Blob([project.code], { type: 'application/javascript' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `builder_${Date.now()}.js`;
    a.click();
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', color: '#f1f5f9', fontFamily: 'system-ui' }}>
      {/* Header */}
      <header style={{ padding: '1rem 2rem', background: '#0d0d16', borderBottom: '1px solid rgba(124,58,237,0.3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontSize: '2rem' }}>🏗️</span>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800 }}>AI Builder</h1>
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>Costruisci app full-stack conversando</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={() => router.push('/dashboard')} style={{ padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#94a3b8', cursor: 'pointer' }}>
            ← Dashboard
          </button>
          {user && <span style={{ padding: '0.5rem 1rem', background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: 8, color: '#a78bfa', fontSize: '0.85rem' }}>👤 {user.name}</span>}
        </div>
      </header>

      {/* Main Content */}
      <div style={{ display: 'flex', height: 'calc(100vh - 80px)' }}>
        {/* Chat Area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '2rem', overflow: 'hidden' }}>
          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', marginBottom: '1rem', paddingRight: '0.5rem' }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', marginBottom: '1rem' }}>
                <div style={{ maxWidth: '80%', padding: '1rem 1.5rem', borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px', background: msg.role === 'user' ? 'linear-gradient(135deg, #7c3aed, #06b6d4)' : 'rgba(255,255,255,0.05)', border: msg.role === 'assistant' ? '1px solid rgba(255,255,255,0.07)' : 'none' }}>
                  <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{msg.text}</div>
                  {msg.code && (
                    <div style={{ marginTop: '1rem' }}>
                      <pre style={{ background: '#070710', borderRadius: 8, padding: '1rem', overflowX: 'auto', fontSize: '0.8rem', color: '#a78bfa' }}>{msg.code}</pre>
                      <button onClick={downloadCode} style={{ marginTop: '0.5rem', padding: '0.5rem 1rem', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 6, color: '#34d399', cursor: 'pointer', fontSize: '0.85rem' }}>⬇ Scarica Codice</button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={endRef} />
          </div>

          {/* Input */}
          <form onSubmit={send} style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              style={{ flex: 1, padding: '1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff', fontSize: '1rem', outline: 'none' }}
              placeholder="Descrivi l'app che vuoi costruire..."
              value={input}
              onChange={e => setInput(e.target.value)}
              disabled={loading}
            />
            <button type="submit" disabled={loading} style={{ padding: '1rem 2rem', background: 'linear-gradient(135deg, #7c3aed, #06b6d4)', border: 'none', borderRadius: 12, color: '#fff', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}>
              {loading ? '⏳' : '🏗️ Costruisci'}
            </button>
          </form>
        </div>

        {/* Project Preview Sidebar */}
        {project && (
          <div style={{ width: '400px', background: '#0d0d16', borderLeft: '1px solid rgba(255,255,255,0.07)', padding: '1.5rem', overflowY: 'auto' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#a78bfa', marginBottom: '1rem' }}>📁 Progetto: {project.name}</h3>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '1rem' }}>Generato: {new Date(project.timestamp).toLocaleString()}</div>
            <div style={{ padding: '1rem', background: 'rgba(124,58,237,0.05)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 8 }}>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.5rem' }}>📊 Struttura:</div>
              <ul style={{ margin: 0, paddingLeft: '1rem', fontSize: '0.75rem', color: '#64748b' }}>
                <li>package.json</li>
                <li>src/app/page.js</li>
                <li>src/components/</li>
                <li>src/api/</li>
              </ul>
            </div>
            <button onClick={downloadCode} style={{ width: '100%', marginTop: '1rem', padding: '0.75rem', background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', borderRadius: 8, color: '#fff', fontWeight: 700, cursor: 'pointer' }}>
              ⬇ Download Completo
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
