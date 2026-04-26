'use client'

import { useState, useRef, useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  steps?: number
}

interface LaraChatProps {
  userId?: string
  sessionId?: string
  placeholder?: string
}

export default function LaraChat({
  userId = 'user_' + Math.random().toString(36).slice(2),
  sessionId = uuidv4(),
  placeholder = 'Dimmi cosa vuoi fare...'
}: LaraChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: uuidv4(),
      role: 'assistant',
      content: '👋 Sono <b>Lara</b>, il tuo AI Agent Aethersy.\n\n💡 Posso cercare informazioni, creare automazioni, analizzare mercati, gestire task e molto altro.\n\nDimmi cosa vuoi fare — lo eseguo.',
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Scroll automatico
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Invio messaggio
  const sendMessage = async () => {
    if (!input.trim() || loading) return

    const userMsg: Message = {
      id: uuidv4(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/lara/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg.content,
          userId,
          sessionId
        })
      })

      const data = await res.json()

      const assistantMsg: Message = {
        id: uuidv4(),
        role: 'assistant',
        content: data.response || data.error || 'Errore nella risposta',
        timestamp: new Date(),
        steps: data.steps_executed
      }

      setMessages(prev => [...prev, assistantMsg])

    } catch (error: any) {
      setMessages(prev => [...prev, {
        id: uuidv4(),
        role: 'assistant',
        content: `❌ Errore: ${error.message}`,
        timestamp: new Date()
      }])
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  // Invio con Enter
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // Formatta testo
  const formatContent = (content: string) => {
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-gray-800 px-1 rounded text-green-400 text-sm">$1</code>')
      .replace(/```[\s\S]*?```/g, (match) => {
        const code = match.replace(/```\w*\n?/, '').replace(/```$/, '')
        return `<pre class="bg-gray-900 rounded-lg p-3 overflow-x-auto text-sm text-green-300 my-2"><code>${code}</code></pre>`
      })
      .replace(/\n/g, '<br/>')
  }

  const quickActions = [
    '🔍 Cerca trend di mercato oggi',
    '📊 Analizza un competitor',
    '🚀 Crea un business plan',
    '💰 Calcola il ROI di una campagna',
    '✍️ Scrivi un articolo SEO',
    '⚙️ Crea un\'automazione'
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#0a0a0f', color: '#f1f5f9', fontFamily: 'system-ui, sans-serif' }}>

      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.1)', background: '#0d0d16' }}>
        <div style={{ position: 'relative' }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, fontWeight: 700
          }}>L</div>
          <span style={{
            position: 'absolute', bottom: 0, right: 0,
            width: 12, height: 12, background: '#10b981',
            borderRadius: '50%', border: '2px solid #0d0d16'
          }} />
        </div>
        <div>
          <h1 style={{ fontWeight: 700, fontSize: 18, margin: 0, lineHeight: 1.2 }}>Lara</h1>
          <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>AI Agent Aethersy · Sempre operativa</p>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <span style={{
            fontSize: 11, background: 'rgba(124,58,237,0.2)', color: '#a78bfa',
            padding: '4px 8px', borderRadius: 99, border: '1px solid rgba(124,58,237,0.3)'
          }}>GPT-4o</span>
          <span style={{
            fontSize: 11, background: 'rgba(16,185,129,0.2)', color: '#34d399',
            padding: '4px 8px', borderRadius: 99, border: '1px solid rgba(16,185,129,0.3)'
          }}>Online</span>
        </div>
      </div>

      {/* MESSAGGI */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* QUICK ACTIONS */}
        {messages.length === 1 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8, marginBottom: 24 }}>
            {quickActions.map((action, i) => (
              <button
                key={i}
                onClick={() => setInput(action.replace(/^[\u{1F300}-\u{1FFFF}]\s/u, ''))}
                style={{
                  textAlign: 'left', fontSize: 12, padding: '8px 12px',
                  borderRadius: 8, background: 'rgba(255,255,255,0.05)',
                  color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)',
                  cursor: 'pointer', transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(124,58,237,0.15)'
                  e.currentTarget.style.borderColor = 'rgba(124,58,237,0.4)'
                  e.currentTarget.style.color = '#f1f5f9'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
                  e.currentTarget.style.color = '#94a3b8'
                }}
              >
                {action}
              </button>
            ))}
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{ display: 'flex', gap: 12, justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}
          >
            {/* AVATAR ASSISTANT */}
            {msg.role === 'assistant' && (
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, fontWeight: 700, flexShrink: 0, marginTop: 4
              }}>L</div>
            )}

            {/* BUBBLE */}
            <div
              style={{
                maxWidth: '80%', borderRadius: 16, padding: '12px 16px',
                fontSize: 14, lineHeight: 1.6,
                background: msg.role === 'user'
                  ? 'linear-gradient(135deg, #7c3aed, #06b6d4)'
                  : 'rgba(255,255,255,0.08)',
                color: msg.role === 'user' ? '#fff' : '#f1f5f9',
                borderTopRightRadius: msg.role === 'user' ? 4 : 16,
                borderTopLeftRadius: msg.role === 'assistant' ? 4 : 16,
                border: msg.role === 'assistant' ? '1px solid rgba(255,255,255,0.1)' : 'none'
              }}
            >
              <div dangerouslySetInnerHTML={{ __html: formatContent(msg.content) }} />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, gap: 16 }}>
                <span style={{ fontSize: 11, opacity: 0.5 }}>
                  {msg.timestamp.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                </span>
                {msg.steps && msg.steps > 0 && (
                  <span style={{
                    fontSize: 11, background: 'rgba(124,58,237,0.2)', color: '#a78bfa',
                    padding: '2px 8px', borderRadius: 99
                  }}>
                    ⚡ {msg.steps} step{msg.steps > 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>

            {/* AVATAR USER */}
            {msg.role === 'user' && (
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: 'rgba(255,255,255,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, flexShrink: 0, marginTop: 4
              }}>👤</div>
            )}
          </div>
        ))}

        {/* TYPING INDICATOR */}
        {loading && (
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-start' }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, fontWeight: 700, flexShrink: 0
            }}>L</div>
            <div style={{
              background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 16, borderTopLeftRadius: 4, padding: '12px 16px'
            }}>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', height: 20 }}>
                <span style={{ width: 8, height: 8, background: '#7c3aed', borderRadius: '50%', animation: 'bounce 1s infinite', animationDelay: '0ms' }} />
                <span style={{ width: 8, height: 8, background: '#7c3aed', borderRadius: '50%', animation: 'bounce 1s infinite', animationDelay: '150ms' }} />
                <span style={{ width: 8, height: 8, background: '#7c3aed', borderRadius: '50%', animation: 'bounce 1s infinite', animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* INPUT */}
      <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.1)', background: '#0d0d16' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', maxWidth: 960, margin: '0 auto' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              rows={1}
              disabled={loading}
              style={{
                width: '100%', background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12,
                padding: '12px 48px 12px 16px', fontSize: 14, color: '#f1f5f9',
                resize: 'none', outline: 'none', fontFamily: 'inherit',
                minHeight: 48, maxHeight: 200,
                opacity: loading ? 0.5 : 1, transition: 'all 0.2s'
              }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement
                target.style.height = 'auto'
                target.style.height = Math.min(target.scrollHeight, 200) + 'px'
              }}
            />
            <div style={{ position: 'absolute', right: 12, bottom: 12, fontSize: 12, color: '#475569' }}>
              ↵
            </div>
          </div>

          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            style={{
              width: 48, height: 48, borderRadius: 12,
              background: loading || !input.trim() ? 'rgba(124,58,237,0.3)' : 'linear-gradient(135deg, #7c3aed, #06b6d4)',
              border: 'none', cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, transition: 'all 0.2s',
              opacity: loading || !input.trim() ? 0.5 : 1
            }}
          >
            {loading ? (
              <svg style={{ animation: 'spin 1s linear infinite', width: 20, height: 20, color: '#fff' }} fill="none" viewBox="0 0 24 24">
                <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg style={{ width: 20, height: 20, color: '#fff' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </div>

        {/* FOOTER */}
        <p style={{ textAlign: 'center', fontSize: 11, color: '#475569', marginTop: 12 }}>
          Lara · Aethersy AI · Sogna, Realizza, Guadagna
        </p>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
