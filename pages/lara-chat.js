import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function LaraChat() {
  const router = useRouter();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState(null);
  const [telegramConnected, setTelegramConnected] = useState(false);
  const [telegramChatId, setTelegramChatId] = useState(null);
  const messagesEndRef = useRef(null);
  const pollRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Inizializza userId e carica cronologia
  useEffect(() => {
    const storedUserId = localStorage.getItem('lara_user_id') || 'web-user-' + Math.random().toString(36).slice(2, 9);
    localStorage.setItem('lara_user_id', storedUserId);
    setUserId(storedUserId);

    // Carica cronologia da Telegram
    loadHistory(storedUserId);

    // Poll per nuovi messaggi da Telegram (ogni 2 secondi)
    pollRef.current = setInterval(() => {
      loadHistory(storedUserId);
    }, 2000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const loadHistory = async (uid) => {
    try {
      const res = await fetch(`/api/telegram/history?userId=${uid}&limit=50`);
      const data = await res.json();
      if (data.messages && data.messages.length > 0) {
        setTelegramConnected(true);
        const formatted = data.messages.map(m => ({
          role: m.platform === 'telegram' ? 'telegram' : 'user',
          content: m.content,
          timestamp: m.timestamp,
          platform: m.platform,
          chatId: m.chatId
        }));
        // Unisci con messaggi locali evitando duplicati
        setMessages(prev => {
          const existing = new Set(prev.map(m => `${m.content}-${m.timestamp}`));
          const newMsgs = formatted.filter(m => !existing.has(`${m.content}-${m.timestamp}`));
          if (newMsgs.length === 0) return prev;
          return [...prev, ...newMsgs];
        });
      }
    } catch (e) {
      console.log('History load failed:', e.message);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = { role: 'user', content: input.trim(), timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      // 1. Salva per sincronizzazione Telegram
      await fetch('/api/telegram/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send',
          userId,
          message: input.trim(),
          platform: 'web'
        })
      });

      // 2. Chiama AI server (stesso usato da Telegram)
      const res = await fetch('/api/lara/server-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input.trim(), userId })
      });

      const data = await res.json();

      if (data.error) {
        setMessages(prev => [...prev, { role: 'error', content: `Errore: ${data.error}`, timestamp: Date.now() }]);
      } else {
        const laraMsg = {
          role: 'lara',
          content: data.response,
          model: data.model,
          platform: data.platform || 'server',
          timestamp: Date.now()
        };
        setMessages(prev => [...prev, laraMsg]);

        // 3. Invia risposta a Telegram se connesso
        if (telegramConnected && telegramChatId) {
          await fetch('/api/telegram/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'send',
              userId,
              chatId: telegramChatId,
              message: data.response,
              platform: 'web'
            })
          });
        }
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'error', content: `Errore connessione: ${err.message}`, timestamp: Date.now() }]);
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
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.2rem', color: '#00ff88' }}>🤖 Lara AI</h1>
          <p style={{ margin: '5px 0 0', fontSize: '0.8rem', color: '#666' }}>
            Qwen3.5-Uncensored 9B • Aethersy Platform
          </p>
        </div>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.75rem', color: '#666' }}>ID Utente</span>
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#00ff88' }}>{userId ? userId.slice(0, 12) : '...'}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.75rem', color: '#666' }}>Telegram</span>
            <p style={{ margin: 0, fontSize: '0.8rem', color: telegramConnected ? '#00ff88' : '#ff4444' }}>
              {telegramConnected ? '● Connesso' : '○ Disconnesso'}
            </p>
          </div>
        </div>
      </header>

      {/* Connection Banner */}
      {!telegramConnected && (
        <div style={{
          padding: '10px 20px',
          background: 'linear-gradient(90deg, #1a1a2e 0%, #16213e 100%)',
          borderBottom: '1px solid #00ff88',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          <div>
            <span style={{ color: '#00ff88', fontWeight: 'bold' }}>🔗 Collega Telegram per sincronizzare i messaggi</span>
            <span style={{ color: '#888', marginLeft: '10px' }}>I messaggi su Telegram appariranno qui in tempo reale</span>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <a
              href="https://t.me/Lara_Aethersy_AI_bot"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                background: '#0088cc',
                color: '#fff',
                textDecoration: 'none',
                fontWeight: 'bold',
                fontSize: '0.9rem'
              }}
            >
              Apri Bot Telegram
            </a>
            <button
              onClick={() => {
                // Simula connessione Telegram
                setTelegramConnected(true);
                setTelegramChatId('web-sync-' + Date.now());
                localStorage.setItem('telegram_sync_enabled', 'true');
              }}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: 'none',
                background: '#00ff88',
                color: '#000',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
            >
              Connetti Ora
            </button>
          </div>
        </div>
      )}

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
            {telegramConnected && (
              <p style={{ color: '#00ff88', marginTop: '15px' }}>
                ✅ Telegram connesso - i messaggi appariranno qui
              </p>
            )}
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              marginBottom: '15px',
              display: 'flex',
              justifyContent: msg.role === 'user' || msg.role === 'telegram' ? 'flex-end' : 'flex-start'
            }}
          >
            <div
              style={{
                maxWidth: '70%',
                padding: '12px 16px',
                borderRadius: '12px',
                background: msg.role === 'user' ? '#00ff88' : msg.role === 'telegram' ? '#0088cc' : msg.role === 'error' ? '#ff4444' : '#222',
                color: msg.role === 'user' ? '#000' : '#fff',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word'
              }}
            >
              <div style={{ fontSize: '0.75rem', opacity: 0.7, marginBottom: '5px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                <span>
                  {msg.role === 'user' ? '📱 Tu (Web)' : msg.role === 'telegram' ? '✈️ Telegram' : msg.role === 'error' ? '❌ Errore' : '🤖 Lara'}
                </span>
                {msg.timestamp && (
                  <span style={{ fontSize: '0.65rem' }}>
                    {new Date(msg.timestamp).toLocaleTimeString('it-IT')}
                  </span>
                )}
              </div>
              {msg.content}
              {msg.platform && (
                <div style={{ fontSize: '0.65rem', opacity: 0.5, marginTop: '5px' }}>
                  {msg.platform === 'telegram' ? '✈️ Da Telegram' : msg.platform === 'web' ? '📱 Da Web' : msg.platform}
                </div>
              )}
              {msg.chatId && (
                <div style={{ fontSize: '0.6rem', opacity: 0.4, marginTop: '3px' }}>
                  Chat ID: {msg.chatId}
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
