import { useState, useRef, useEffect } from 'react';

export default function LaraChat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState('web-user-' + Math.random().toString(36).slice(2, 9));
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = { role: 'user', content: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/lara/server-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input.trim(), userId })
      });

      const data = await res.json();

      if (data.error) {
        setMessages(prev => [...prev, { role: 'error', content: `Errore: ${data.error}` }]);
      } else {
        setMessages(prev => [...prev, {
          role: 'lara',
          content: data.response,
          model: data.model,
          platform: data.platform
        }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'error', content: `Errore connessione: ${err.message}` }]);
    }

    setLoading(false);
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      background: '#0a0a0a',
      color: '#fff',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Header */}
      <header style={{
        padding: '15px 20px',
        background: '#111',
        borderBottom: '1px solid #333',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.2rem', color: '#00ff88' }}>🤖 Lara AI</h1>
          <p style={{ margin: '5px 0 0', fontSize: '0.8rem', color: '#666' }}>
            Qwen3.5-Uncensored 9B • Aethersy Platform
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: '0.75rem', color: '#666' }}>ID Utente</span>
          <p style={{ margin: 0, fontSize: '0.8rem', color: '#00ff88' }}>{userId.slice(0, 12)}</p>
        </div>
      </header>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', color: '#666', marginTop: '100px' }}>
            <h2 style={{ color: '#00ff88', marginBottom: '10px' }}>👋 Benvenuto su Lara AI</h2>
            <p>Stessa AI del bot Telegram @Lara_Aethersy_AI_bot</p>
            <p style={{ fontSize: '0.9rem', marginTop: '20px' }}>
              Modello: Qwen3.5-Uncensored 9B<br/>
              Piattaforma: Aethersy AI Cluster
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              marginBottom: '15px',
              display: 'flex',
              justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start'
            }}
          >
            <div
              style={{
                maxWidth: '70%',
                padding: '12px 16px',
                borderRadius: '12px',
                background: msg.role === 'user' ? '#00ff88' : msg.role === 'error' ? '#ff4444' : '#222',
                color: msg.role === 'user' ? '#000' : '#fff',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word'
              }}
            >
              <div style={{ fontSize: '0.75rem', opacity: 0.7, marginBottom: '5px' }}>
                {msg.role === 'user' ? 'Tu' : msg.role === 'error' ? 'Errore' : '🤖 Lara'}
              </div>
              {msg.content}
              {msg.model && (
                <div style={{ fontSize: '0.7rem', opacity: 0.5, marginTop: '8px' }}>
                  {msg.model}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
            <span style={{ display: 'inline-block', animation: 'pulse 1s infinite' }}>
              🤖 Lara sta scrivendo...
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form
        onSubmit={sendMessage}
        style={{
          padding: '20px',
          background: '#111',
          borderTop: '1px solid #333',
          display: 'flex',
          gap: '10px'
        }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Scrivi a Lara..."
          disabled={loading}
          style={{
            flex: 1,
            padding: '12px 16px',
            borderRadius: '8px',
            border: '1px solid #333',
            background: '#0a0a0a',
            color: '#fff',
            fontSize: '1rem',
            outline: 'none'
          }}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          style={{
            padding: '12px 24px',
            borderRadius: '8px',
            border: 'none',
            background: loading ? '#333' : '#00ff88',
            color: loading ? '#666' : '#000',
            fontWeight: 'bold',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '1rem'
          }}
        >
          {loading ? '...' : 'Invia'}
        </button>
      </form>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
