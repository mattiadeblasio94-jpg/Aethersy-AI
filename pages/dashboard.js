import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';

const BOT_URL = 'https://t.me/Lara_Aethersy_Bot';
const BOT_NAME = 'Lara AGENTE AI Aethersy';

async function safeJson(r) {
  const t = await r.text();
  try { return JSON.parse(t); }
  catch { return { error: `Errore server (${r.status}): ${t.slice(0, 150)}` }; }
}

const CATEGORIES = [
  {
    id: 'ricerca', icon: '🔍', label: 'Ricerca',
    tools: [
      { id: 'search', icon: '🔍', label: 'Web Search' },
      { id: 'deep', icon: '🔬', label: 'Analisi Profonda' },
    ]
  },
  {
    id: 'ai', icon: '💬', label: 'AI Assistant',
    tools: [
      { id: 'chat', icon: '💬', label: 'Chat con Lara' },
      { id: 'wiki', icon: '🧠', label: 'Second Brain' },
    ]
  },
  {
    id: 'sviluppo', icon: '⚡', label: 'Sviluppo',
    tools: [
      { id: 'code', icon: '⚡', label: 'Genera Codice' },
    ]
  },
  {
    id: 'email', icon: '📧', label: 'Email AI',
    tools: [
      { id: 'email', icon: '📧', label: 'Email AI' },
    ]
  },
  {
    id: 'business', icon: '💰', label: 'Business',
    tools: [
      { id: 'plan', icon: '📋', label: 'Piano Progetto' },
      { id: 'money', icon: '💰', label: 'Monetizzazione' },
      { id: 'finance', icon: '📈', label: 'Finanza & Crypto' },
    ]
  },
  {
    id: 'studio', icon: '✨', label: 'Generative Studio',
    tools: [
      { id: 'cinema',       icon: '🎬', label: 'Cinema Studio', link: '/cinema' },
      { id: 'studio-image', icon: '🖼', label: 'Image AI',      link: '/studio?tab=image' },
      { id: 'studio-video', icon: '📽', label: 'Video AI',      link: '/studio?tab=video' },
      { id: 'studio-music', icon: '🎵', label: 'Music AI',      link: '/studio?tab=music' },
      { id: 'studio-voice', icon: '🎙', label: 'Voice AI',      link: '/studio?tab=voice' },
    ]
  },
  {
    id: 'tools', icon: '🛠️', label: 'Strumenti Pro',
    tools: [
      { id: 'funnel', icon: '🔄', label: 'Funnel Builder' },
      { id: 'freelance', icon: '💼', label: 'Trova Lavori' },
      { id: 'contract', icon: '📝', label: 'Contratti AI' },
      { id: 'seo', icon: '🔍', label: 'SEO Analyzer' },
      { id: 'competitor', icon: '🏆', label: 'Competitor AI' },
    ]
  },
];

const ALL_TOOLS = CATEGORIES.flatMap(c => c.tools);

export default function Dashboard() {
  const router = useRouter();
  const [tool, setTool] = useState('chat');
  const [user, setUser] = useState(null);
  const [openCats, setOpenCats] = useState({ ricerca: true, ai: true, sviluppo: true, email: true, business: true, tools: true });
  const [sideOpen, setSide] = useState(true);

  useEffect(() => {
    // Auth guard — redirect to home if not logged in
    const token = localStorage.getItem('aiforge_token');
    const stored = localStorage.getItem('aiforge_user');
    if (!token || !stored) {
      router.replace('/?login=required');
      return;
    }
    try { setUser(JSON.parse(stored)); } catch {}
    if (router.query.tool) setTool(router.query.tool);
    if (router.query.upgraded) {
      const plan = router.query.plan || 'pro';
      setTimeout(() => alert(`🎉 Piano ${plan.toUpperCase()} attivato! Benvenuto nel piano ${plan}.`), 500);
    }
  }, [router.query]);

  function logout() {
    localStorage.removeItem('aiforge_user');
    localStorage.removeItem('aiforge_token');
    router.push('/');
  }

  function toggleCat(id) {
    setOpenCats(prev => ({ ...prev, [id]: !prev[id] }));
  }

  const current = ALL_TOOLS.find(t => t.id === tool) || ALL_TOOLS[0];
  const isAdmin = user?.email === 'mattiadeblasio94@gmail.com';

  return (
    <div style={css.root}>
      {/* Sidebar */}
      <aside style={{ ...css.sidebar, width: sideOpen ? 220 : 54 }}>
        <div style={css.sideTop}>
          <Link href="/" style={css.logo}>{sideOpen ? '⚡ Aethersy-AI' : '⚡'}</Link>
          <button style={css.toggleBtn} onClick={() => setSide(o => !o)} title="Espandi/Riduci">
            {sideOpen ? '◀' : '▶'}
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '0.4rem 0' }}>
          {sideOpen && <div style={css.sideMottoLine}>Sogna, Realizza, Guadagna.</div>}

          {CATEGORIES.map(cat => (
            <div key={cat.id}>
              <button style={css.catHeader} onClick={() => toggleCat(cat.id)}>
                <span>{cat.icon}</span>
                {sideOpen && <span style={{ flex: 1, textAlign: 'left', fontSize: '0.77rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#475569' }}>{cat.label}</span>}
                {sideOpen && <span style={{ color: '#334155', fontSize: '0.7rem' }}>{openCats[cat.id] ? '▾' : '▸'}</span>}
              </button>
              {(openCats[cat.id] || !sideOpen) && cat.tools.map(t => (
                t.link
                  ? <Link key={t.id} href={t.link} style={{ ...css.sideBtn, textDecoration: 'none', display: 'flex' }} title={t.label}>
                      <span style={{ fontSize: '1rem', flexShrink: 0 }}>{t.icon}</span>
                      {sideOpen && <span style={{ fontSize: '0.85rem' }}>{t.label}</span>}
                    </Link>
                  : <button key={t.id}
                      style={{ ...css.sideBtn, ...(tool === t.id ? css.active : {}) }}
                      onClick={() => setTool(t.id)}
                      title={t.label}>
                      <span style={{ fontSize: '1rem', flexShrink: 0 }}>{t.icon}</span>
                      {sideOpen && <span style={{ fontSize: '0.85rem' }}>{t.label}</span>}
                    </button>
              ))}
            </div>
          ))}
        </div>

        {/* Quick links */}
        <div style={{ padding: '0.4rem', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <Link href="/terminal" style={css.quickLink('#38bdf8', 'rgba(6,182,212,0.12)', 'rgba(6,182,212,0.25)')}>
            <span>⚡</span>{sideOpen && <span>AI Terminal</span>}
          </Link>
          <Link href="/wiki" style={css.quickLink('#a78bfa', 'rgba(167,139,250,0.12)', 'rgba(167,139,250,0.25)')}>
            <span>🧠</span>{sideOpen && <span>Second Brain</span>}
          </Link>
          {isAdmin && (
            <Link href="/admin" style={css.quickLink('#f87171', 'rgba(239,68,68,0.1)', 'rgba(239,68,68,0.25)')}>
              <span>🔑</span>{sideOpen && <span>Admin Panel</span>}
            </Link>
          )}
        </div>

        <div style={css.sideBottom}>
          <a href={BOT_URL} target="_blank" rel="noopener noreferrer" style={css.tgBtn}>
            <TgIcon />
            {sideOpen && <span style={{ marginLeft: 5 }}>Telegram Bot</span>}
          </a>
          {sideOpen && user && (
            <div style={{ marginTop: '0.6rem' }}>
              <div style={{ ...css.userInfo, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {user.avatar && <img src={user.avatar} alt="" style={{ width: 18, height: 18, borderRadius: '50%', marginRight: 5, verticalAlign: 'middle' }} />}
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.78rem', color: '#f1f5f9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.15rem' }}>
                    <span style={{ ...css.planBadge, background: getPlanBadgeColor(user.plan), padding: '0.05rem 0.4rem', fontSize: '0.6rem' }}>{(user.plan || 'free').toUpperCase()}</span>
                  </div>
                </div>
              </div>
              <button style={css.logoutBtn} onClick={logout}>Esci</button>
              {/* Telegram Link Section */}
              <TelegramLink email={user.email} />
            </div>
          )}
        </div>
      </aside>

      {/* Main */}
      <main style={css.main}>
        <header style={css.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <span style={{ fontSize: '1.3rem' }}>{current?.icon}</span>
            <h1 style={css.h1}>{current?.label}</h1>
          </div>
          <div style={{ display: 'flex', gap: '0.7rem', alignItems: 'center' }}>
            {user && <span style={css.userBadge}>👤 {user.name}</span>}
            <SubscriptionButton email={user?.email} plan={user?.plan} />
            <Link href="/pricing" style={css.pricingBadge}>🚀 Piani</Link>
            <a href={BOT_URL} target="_blank" rel="noopener noreferrer" style={css.tgBadge}>
              <TgIcon /> <span style={{ marginLeft: 4 }}>{BOT_NAME}</span>
            </a>
          </div>
        </header>

        <div style={css.content}>
          {tool === 'search'   && <SearchPanel deep={false} />}
          {tool === 'deep'     && <SearchPanel deep={true} />}
          {tool === 'chat'     && <ChatPanel />}
          {tool === 'wiki'     && <WikiRedirectPanel />}
          {tool === 'code'     && <CodePanel />}
          {tool === 'email'    && <EmailPanel />}
          {tool === 'plan'     && <PlanPanel />}
          {tool === 'money'    && <MoneyPanel />}
          {tool === 'finance'  && <FinancePanel />}
          {tool === 'funnel'    && <FunnelPanel />}
          {tool === 'freelance' && <FreelancePanel />}
          {tool === 'contract'  && <ContractPanel />}
          {tool === 'seo'       && <SeoPanel />}
          {tool === 'competitor'&& <CompetitorPanel />}
        </div>
      </main>
    </div>
  );
}

/* ── SEARCH ─────────────────────────────────────────────────────────────────── */
function SearchPanel({ deep }) {
  const [q, setQ] = useState('');
  const [result, setR] = useState(null);
  const [loading, setL] = useState(false);
  const [err, setErr] = useState('');

  async function run(e) {
    e.preventDefault();
    if (!q.trim()) return;
    setL(true); setR(null); setErr('');
    try {
      const res = await fetch('/api/research', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query: q, deep }) });
      const data = await safeJson(res);
      if (data.error) setErr(data.error); else setR(data);
    } catch (e) { setErr(e.message); }
    setL(false);
  }

  return (
    <div style={css.panel}>
      <p style={css.hint}>
        {deep ? '🔬 Analisi profonda: scraping, ArXiv/PubMed, report completo. (20-40 sec)' : '🔍 Ricerca da Tavily, Google, Wikipedia, Reddit, HackerNews. (5-10 sec)'}
      </p>
      <form onSubmit={run} style={{ display: 'flex', gap: '0.7rem', marginBottom: '1.5rem' }}>
        <input style={css.input} placeholder={deep ? 'Es: mercato immobiliare Italia 2025 trend...' : 'Es: AI nel business italiano 2025...'} value={q} onChange={e => setQ(e.target.value)} />
        <Btn loading={loading} label={deep ? '🔬 Analizza' : '🔍 Cerca'} />
      </form>
      {loading && <Loading msg={deep ? 'Analisi approfondita in corso...' : 'Ricerca da 10+ fonti...'} />}
      {err && <ErrBox msg={err} />}
      {result && !err && (
        <>
          <Card title="🧠 Sintesi AI" color="#7c3aed">
            <div style={{ lineHeight: 1.9, whiteSpace: 'pre-wrap', color: '#cbd5e1', fontSize: '0.93rem' }}>{result.summary}</div>
          </Card>
          {result.results?.length > 0 && (
            <Card title={`📌 Fonti (${result.results.length})`} color="#06b6d4">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(250px,1fr))', gap: '0.7rem' }}>
                {result.results.filter(r => r.title).map((r, i) => (
                  <a key={i} href={r.url?.startsWith('http') ? r.url : '#'} target="_blank" rel="noopener noreferrer" style={css.srcCard}>
                    <Badge label={r.source} />
                    <div style={{ fontWeight: 600, fontSize: '0.82rem', color: '#e2e8f0', margin: '0.3rem 0' }}>{r.title?.slice(0, 70)}</div>
                    <div style={{ color: '#64748b', fontSize: '0.75rem' }}>{r.snippet?.slice(0, 100)}</div>
                  </a>
                ))}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

/* ── CHAT ───────────────────────────────────────────────────────────────────── */
function ChatPanel() {
  const [msgs, setMsgs] = useState([
    { role: 'assistant', text: `Ciao! Sono Lara, il tuo AI agent di Aethersy-AI.\n\nPosso aiutarti con business, marketing, codice, finanza, SEO, strategie AI e molto altro.\nOgni conversazione può essere salvata nel tuo **Second Brain**.\n\n*"Sogna, Realizza, Guadagna."* 🚀` }
  ]);
  const [input, setInput] = useState('');
  const [loading, setL] = useState(false);
  const [savingBrain, setSavingBrain] = useState(false);
  const [brainToast, setBrainToast] = useState('');
  const endRef = useRef(null);
  const sessionId = useRef(`web-${Date.now()}`);
  const streamingIdxRef = useRef(-1);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs]);

  async function send(e) {
    e?.preventDefault();
    const userMsg = input.trim();
    if (!userMsg || loading) return;
    setInput('');

    const userEntry = { role: 'user', text: userMsg };
    const assistantEntry = { role: 'assistant', text: '', streaming: true };
    setMsgs(m => { streamingIdxRef.current = m.length + 1; return [...m, userEntry, assistantEntry]; });
    setL(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, sessionId: sessionId.current, streaming: true }),
      });

      if (!res.ok || !res.body) {
        const d = await safeJson(res);
        setMsgs(m => m.map((msg, i) => i === streamingIdxRef.current ? { ...msg, text: d.error || 'Errore server', streaming: false } : msg));
        setL(false); return;
      }

      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = '';
      let full = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const parts = buf.split('\n\n'); buf = parts.pop();
        for (const part of parts) {
          if (!part.startsWith('data: ')) continue;
          try {
            const ev = JSON.parse(part.slice(6));
            if (ev.t) {
              full += ev.t;
              const idx = streamingIdxRef.current;
              setMsgs(m => m.map((msg, i) => i === idx ? { ...msg, text: full } : msg));
            }
            if (ev.error) {
              const idx = streamingIdxRef.current;
              setMsgs(m => m.map((msg, i) => i === idx ? { ...msg, text: `Errore: ${ev.error}`, streaming: false } : msg));
            }
            if (ev.done) {
              const idx = streamingIdxRef.current;
              setMsgs(m => m.map((msg, i) => i === idx ? { ...msg, streaming: false } : msg));
            }
          } catch {}
        }
      }
    } catch (e) {
      const idx = streamingIdxRef.current;
      setMsgs(m => m.map((msg, i) => i === idx ? { ...msg, text: `Errore: ${e.message}`, streaming: false } : msg));
    }
    setL(false);
  }

  async function saveConversationToBrain() {
    const conversation = msgs.filter(m => m.text).map(m => `**${m.role === 'user' ? 'Tu' : 'Lara'}:** ${m.text}`).join('\n\n');
    if (!conversation) return;
    setSavingBrain(true);
    try {
      const res = await fetch('/api/wiki/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: conversation, title: `Chat Lara — ${new Date().toLocaleDateString('it-IT')}` }),
      });
      const d = await safeJson(res);
      setBrainToast(d.ok ? `✅ ${d.count || 1} pagine salvate nel Second Brain!` : `⚠️ ${d.error}`);
    } catch (e) { setBrainToast('⚠️ Errore salvataggio'); }
    setSavingBrain(false);
    setTimeout(() => setBrainToast(''), 3500);
  }

  function copyMsg(text) {
    navigator.clipboard?.writeText(text);
  }

  const QUICK = [
    '🔍 Ultime notizie AI in Italia',
    '💰 Prezzo Bitcoin e Ethereum oggi',
    '📈 Strategia growth per SaaS B2B',
    '🚀 Come monetizzare un\'app AI nel 2025',
    '🤖 Crea un agente AI autonomo',
    '📧 Email sequence per ecommerce',
  ];

  return (
    <div style={{ ...css.panel, display: 'flex', flexDirection: 'column', height: 'calc(100vh - 180px)', position: 'relative' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#7c3aed,#06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem' }}>🤖</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#e2e8f0' }}>Lara — AI Agent</div>
            <div style={{ fontSize: '0.7rem', color: '#10b981' }}>● Online · Claude Sonnet</div>
          </div>
        </div>
        {msgs.length > 2 && (
          <button style={{ ...css.btnSm, background: 'rgba(167,139,250,0.1)', borderColor: 'rgba(167,139,250,0.3)', color: '#a78bfa' }}
            onClick={saveConversationToBrain} disabled={savingBrain}>
            {savingBrain ? '⏳' : '🧠'} Salva nel Brain
          </button>
        )}
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.2rem', marginBottom: '0.8rem' }}>
        {msgs.length === 1 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1.2rem' }}>
            {QUICK.map(q => (
              <button key={q} style={css.quickBtn} onClick={() => { setInput(q.replace(/^[^\s]+ /, '')); setTimeout(() => document.getElementById('chat-input')?.focus(), 0); }}>
                {q}
              </button>
            ))}
          </div>
        )}

        {msgs.map((m, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start', marginBottom: '0.7rem', alignItems: 'flex-start', gap: '0.5rem' }}>
            {m.role === 'assistant' && (
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#7c3aed,#06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', flexShrink: 0, marginTop: 2 }}>🤖</div>
            )}
            <div style={{ maxWidth: '78%' }}>
              <div style={{
                padding: '0.75rem 1rem',
                borderRadius: m.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                background: m.role === 'user' ? 'linear-gradient(135deg,#7c3aed,#06b6d4)' : 'rgba(255,255,255,0.05)',
                border: m.role === 'assistant' ? '1px solid rgba(255,255,255,0.07)' : 'none',
                color: '#f1f5f9', fontSize: '0.88rem', lineHeight: 1.75,
              }}>
                {m.role === 'assistant' ? (
                  <div style={{ '--md-color': '#f1f5f9' }}>
                    <ReactMarkdown components={{
                      p: ({children}) => <p style={{ margin: '0 0 0.6em', lineHeight: 1.75 }}>{children}</p>,
                      ul: ({children}) => <ul style={{ margin: '0.4em 0', paddingLeft: '1.4em' }}>{children}</ul>,
                      ol: ({children}) => <ol style={{ margin: '0.4em 0', paddingLeft: '1.4em' }}>{children}</ol>,
                      li: ({children}) => <li style={{ marginBottom: '0.2em' }}>{children}</li>,
                      strong: ({children}) => <strong style={{ color: '#e2e8f0', fontWeight: 700 }}>{children}</strong>,
                      h1: ({children}) => <h1 style={{ fontSize: '1.1em', fontWeight: 800, margin: '0.8em 0 0.4em', color: '#a78bfa' }}>{children}</h1>,
                      h2: ({children}) => <h2 style={{ fontSize: '1em', fontWeight: 700, margin: '0.7em 0 0.3em', color: '#38bdf8' }}>{children}</h2>,
                      h3: ({children}) => <h3 style={{ fontSize: '0.95em', fontWeight: 700, margin: '0.6em 0 0.3em', color: '#94a3b8' }}>{children}</h3>,
                      code: ({inline, children}) => inline
                        ? <code style={{ background: 'rgba(167,139,250,0.15)', color: '#a78bfa', borderRadius: 4, padding: '0.1em 0.4em', fontFamily: 'monospace', fontSize: '0.9em' }}>{children}</code>
                        : <pre style={{ background: '#070710', borderRadius: 8, padding: '0.8em', overflowX: 'auto', margin: '0.5em 0' }}><code style={{ color: '#a78bfa', fontFamily: 'monospace', fontSize: '0.82em' }}>{children}</code></pre>,
                    }}>{m.text}</ReactMarkdown>
                    {m.streaming && <span style={{ display: 'inline-block', width: 2, height: '1em', background: '#a78bfa', marginLeft: 2, verticalAlign: 'text-bottom', animation: 'blink 1s infinite' }} />}
                  </div>
                ) : (
                  <span style={{ whiteSpace: 'pre-wrap' }}>{m.text}</span>
                )}
              </div>
              {m.role === 'assistant' && !m.streaming && m.text && (
                <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.25rem' }}>
                  <button style={{ ...css.btnSm, fontSize: '0.65rem', padding: '2px 6px' }} onClick={() => copyMsg(m.text)}>📋 Copia</button>
                  <button style={{ ...css.btnSm, fontSize: '0.65rem', padding: '2px 6px' }} onClick={async () => {
                    await fetch('/api/wiki/ingest', { method: 'POST', headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ text: m.text, title: `Risposta Lara — ${new Date().toLocaleDateString('it-IT')}` }) });
                    setBrainToast('✅ Salvato nel Brain!');
                    setTimeout(() => setBrainToast(''), 2500);
                  }}>🧠 Brain</button>
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && !msgs[msgs.length - 1]?.streaming && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#475569', fontSize: '0.82rem', padding: '0.3rem 0' }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#7c3aed,#06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem' }}>🤖</div>
            <span style={{ animation: 'pulse 1.5s infinite' }}>Lara sta scrivendo…</span>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <form onSubmit={send} style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
        <input
          id="chat-input"
          style={{ ...css.input, flex: 1 }}
          placeholder="Chiedi qualcosa a Lara — business, AI, codice, finanza..."
          value={input}
          onChange={e => setInput(e.target.value)}
          disabled={loading}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(e); } }}
        />
        <Btn loading={loading} label="Invia" disabled={!input.trim()} />
      </form>

      {brainToast && (
        <div style={{ position: 'absolute', bottom: 60, left: '50%', transform: 'translateX(-50%)', background: brainToast.startsWith('✅') ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', border: `1px solid ${brainToast.startsWith('✅') ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)'}`, borderRadius: 10, padding: '8px 18px', color: brainToast.startsWith('✅') ? '#34d399' : '#f87171', fontSize: '0.82rem', fontWeight: 600, whiteSpace: 'nowrap', zIndex: 50 }}>
          {brainToast}
        </div>
      )}
    </div>
  );
}

/* ── CODE ───────────────────────────────────────────────────────────────────── */
function CodePanel() {
  const [prompt, setPrompt] = useState('');
  const [lang, setLang] = useState('javascript');
  const [result, setR] = useState(null);
  const [loading, setL] = useState(false);
  const [err, setErr] = useState('');
  const LANGS = ['javascript', 'typescript', 'python', 'html', 'css', 'sql', 'bash', 'rust', 'go', 'java', 'php', 'yaml'];

  async function run(e) {
    e.preventDefault();
    if (!prompt.trim()) return;
    setL(true); setR(null); setErr('');
    try {
      const res = await fetch('/api/generate-code', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt, language: lang }) });
      const data = await safeJson(res);
      if (data.error) setErr(data.error); else setR(data);
    } catch (e) { setErr(e.message); }
    setL(false);
  }

  function download() {
    if (!result?.code) return;
    const ext = { javascript: 'js', typescript: 'ts', python: 'py', html: 'html', css: 'css', sql: 'sql', bash: 'sh', rust: 'rs', go: 'go', java: 'java', php: 'php', yaml: 'yaml' }[lang] || 'txt';
    const blob = new Blob([result.code], { type: 'text/plain' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `aiforge_${Date.now()}.${ext}`; a.click();
  }

  return (
    <div style={css.panel}>
      <p style={css.hint}>⚡ Codice production-ready in 12+ linguaggi. Specifica funzionalità, input/output e requisiti per risultati migliori.</p>
      <form onSubmit={run} style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.7rem', marginBottom: '0.7rem' }}>
          <select style={{ ...css.input, width: 160, flexShrink: 0 }} value={lang} onChange={e => setLang(e.target.value)}>
            {LANGS.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
          <Btn loading={loading} label="⚡ Genera" />
        </div>
        <textarea style={{ ...css.input, height: 100, resize: 'vertical', display: 'block', width: '100%' }} placeholder="Descrivi cosa deve fare il codice..." value={prompt} onChange={e => setPrompt(e.target.value)} />
      </form>
      {loading && <Loading msg="Generazione codice..." />}
      {err && <ErrBox msg={err} />}
      {result?.code && (
        <Card title={`⚡ ${lang.toUpperCase()}`} color="#f59e0b" action={<button style={css.btnSm} onClick={download}>⬇ Scarica</button>}>
          <pre style={{ background: '#070710', borderRadius: 10, padding: '1.2rem', overflowX: 'auto', fontSize: '0.82rem', color: '#a78bfa', lineHeight: 1.6, maxHeight: 500, overflowY: 'auto' }}>{result.code}</pre>
        </Card>
      )}
    </div>
  );
}

/* ── EMAIL ──────────────────────────────────────────────────────────────────── */
function EmailPanel() {
  const [mode, setMode] = useState('compose'); // compose | sequence
  const [purpose, setPurpose] = useState('');
  const [recipient, setRecipient] = useState('');
  const [tone, setTone] = useState('professionale');
  const [context, setContext] = useState('');
  const [toEmail, setToEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [niche, setNiche] = useState('');
  const [goal, setGoal] = useState('');
  const [numEmails, setNumEmails] = useState(5);
  const [loading, setL] = useState(false);
  const [result, setR] = useState('');
  const [err, setErr] = useState('');
  const [sendLoading, setSendL] = useState(false);
  const [sendMsg, setSendMsg] = useState('');

  async function generate() {
    if (!purpose.trim()) return;
    setL(true); setR(''); setErr('');
    try {
      const res = await fetch('/api/email/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ generateWithAI: true, purpose, recipient, tone, context }) });
      const data = await safeJson(res);
      if (data.error) setErr(data.error);
      else { setR(data.content || ''); setBody(data.content || ''); }
    } catch (e) { setErr(e.message); }
    setL(false);
  }

  async function generateSequence() {
    if (!niche.trim() || !goal.trim()) return;
    setL(true); setR(''); setErr('');
    try {
      const res = await fetch(`/api/email/send?action=sequence&niche=${encodeURIComponent(niche)}&goal=${encodeURIComponent(goal)}&emails=${numEmails}`);
      const data = await safeJson(res);
      if (data.error) setErr(data.error); else setR(data.sequence || '');
    } catch (e) { setErr(e.message); }
    setL(false);
  }

  async function sendEmail() {
    if (!toEmail || !subject || !body) return;
    setSendL(true); setSendMsg('');
    try {
      const res = await fetch('/api/email/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ to: toEmail, subject, body }) });
      const data = await safeJson(res);
      if (data.ok) setSendMsg('✅ Email inviata!');
      else setSendMsg(`⚠️ ${data.error}`);
    } catch (e) { setSendMsg(`⚠️ ${e.message}`); }
    setSendL(false);
  }

  const TONES = ['professionale', 'amichevole', 'urgente', 'persuasivo', 'formale', 'informale'];

  return (
    <div style={css.panel}>
      <p style={css.hint}>📧 Scrivi email professionali con AI, crea sequenze di nurturing e invia direttamente dalla piattaforma.</p>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        {[['compose', '📝 Componi Email'], ['sequence', '📬 Sequenza Email']].map(([id, label]) => (
          <button key={id} style={{ ...css.tabBtn, ...(mode === id ? css.tabActive : {}) }} onClick={() => setMode(id)}>{label}</button>
        ))}
      </div>

      {mode === 'compose' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.7rem', marginBottom: '0.7rem' }}>
            <input style={css.input} placeholder="Scopo email (es. proposta commerciale, follow-up, newsletter)" value={purpose} onChange={e => setPurpose(e.target.value)} />
            <input style={css.input} placeholder="Destinatario (es. CEO startup fintech)" value={recipient} onChange={e => setRecipient(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: '0.7rem', marginBottom: '0.7rem' }}>
            <select style={{ ...css.input, flex: 1 }} value={tone} onChange={e => setTone(e.target.value)}>
              {TONES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <button style={css.btnPrimary} onClick={generate} disabled={loading || !purpose.trim()}>
              {loading ? '⏳...' : '🤖 Genera con AI'}
            </button>
          </div>
          <textarea style={{ ...css.input, height: 60, resize: 'vertical', display: 'block', width: '100%', marginBottom: '0.7rem' }} placeholder="Contesto aggiuntivo (opzionale)..." value={context} onChange={e => setContext(e.target.value)} />

          {loading && <Loading msg="Scrittura email in corso..." />}
          {err && <ErrBox msg={err} />}

          {result && (
            <Card title="📧 Email Generata" color="#06b6d4">
              <pre style={{ whiteSpace: 'pre-wrap', color: '#cbd5e1', fontSize: '0.9rem', lineHeight: 1.7, fontFamily: 'inherit' }}>{result}</pre>
            </Card>
          )}

          <div style={{ marginTop: '1.5rem', padding: '1.2rem', background: 'rgba(6,182,212,0.06)', border: '1px solid rgba(6,182,212,0.15)', borderRadius: 12 }}>
            <h3 style={{ fontSize: '0.88rem', fontWeight: 700, marginBottom: '0.8rem', color: '#38bdf8' }}>📤 Invia Email</h3>
            <input style={{ ...css.input, marginBottom: '0.6rem', display: 'block' }} placeholder="A: email@destinatario.com" value={toEmail} onChange={e => setToEmail(e.target.value)} />
            <input style={{ ...css.input, marginBottom: '0.6rem', display: 'block' }} placeholder="Oggetto email" value={subject} onChange={e => setSubject(e.target.value)} />
            <textarea style={{ ...css.input, height: 100, resize: 'vertical', display: 'block', width: '100%', marginBottom: '0.6rem' }} placeholder="Corpo email..." value={body} onChange={e => setBody(e.target.value)} />
            <button style={css.btnPrimary} onClick={sendEmail} disabled={sendLoading || !toEmail || !subject || !body}>
              {sendLoading ? '⏳ Invio...' : '📤 Invia Email'}
            </button>
            {sendMsg && <div style={{ marginTop: '0.6rem', fontSize: '0.85rem', color: sendMsg.startsWith('✅') ? '#34d399' : '#f87171' }}>{sendMsg}</div>}
          </div>
        </>
      )}

      {mode === 'sequence' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '0.7rem', marginBottom: '0.7rem', alignItems: 'center' }}>
            <input style={css.input} placeholder="Nicchia (es. SaaS B2B, e-commerce, consulenza)" value={niche} onChange={e => setNiche(e.target.value)} />
            <input style={css.input} placeholder="Obiettivo (es. demo booking, vendita, follow-up)" value={goal} onChange={e => setGoal(e.target.value)} />
            <select style={{ ...css.input, width: 90 }} value={numEmails} onChange={e => setNumEmails(Number(e.target.value))}>
              {[3, 5, 7, 10].map(n => <option key={n} value={n}>{n} email</option>)}
            </select>
          </div>
          <button style={css.btnPrimary} onClick={generateSequence} disabled={loading || !niche.trim() || !goal.trim()}>
            {loading ? '⏳ Generando...' : '📬 Genera Sequenza'}
          </button>
          {loading && <Loading msg="Creazione sequenza email..." />}
          {err && <ErrBox msg={err} />}
          {result && (
            <Card title={`📬 Sequenza ${numEmails} Email`} color="#a78bfa">
              <pre style={{ whiteSpace: 'pre-wrap', color: '#cbd5e1', fontSize: '0.88rem', lineHeight: 1.8, fontFamily: 'inherit', maxHeight: 600, overflowY: 'auto' }}>{result}</pre>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

/* ── PLAN ───────────────────────────────────────────────────────────────────── */
function PlanPanel() {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [type, setType] = useState('business');
  const [result, setR] = useState(null);
  const [loading, setL] = useState(false);
  const [err, setErr] = useState('');
  const TYPES = [['business', 'Business Plan'], ['startup', 'Startup'], ['saas', 'SaaS / App'], ['ecommerce', 'E-commerce'], ['immobiliare', 'Immobiliare'], ['marketing', 'Marketing']];

  async function run(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setL(true); setR(null); setErr('');
    try {
      const res = await fetch('/api/project', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, description: desc, type }) });
      const data = await safeJson(res);
      if (data.error) setErr(data.error); else setR(data);
    } catch (e) { setErr(e.message); }
    setL(false);
  }

  function download() {
    if (!result?.plan) return;
    const blob = new Blob([`# ${result.name}\n\n${result.plan}`], { type: 'text/markdown' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `piano_${(result.name || '').replace(/\s+/g, '_')}.md`; a.click();
  }

  return (
    <div style={css.panel}>
      <p style={css.hint}>📋 Business plan completo con analisi mercato, fasi, KPI, rischi e proiezioni economiche.</p>
      <form onSubmit={run} style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.7rem', marginBottom: '0.7rem', flexWrap: 'wrap' }}>
          <input style={{ ...css.input, flex: 2, minWidth: 200 }} placeholder="Nome progetto" value={name} onChange={e => setName(e.target.value)} required />
          <select style={{ ...css.input, flex: 1, minWidth: 150 }} value={type} onChange={e => setType(e.target.value)}>
            {TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        <textarea style={{ ...css.input, height: 80, resize: 'vertical', display: 'block', width: '100%', marginBottom: '0.7rem' }} placeholder="Descrizione, obiettivi, target, budget..." value={desc} onChange={e => setDesc(e.target.value)} />
        <Btn loading={loading} label="📋 Genera Piano" />
      </form>
      {loading && <Loading msg="Creazione business plan... (20-30 sec)" />}
      {err && <ErrBox msg={err} />}
      {result?.plan && (
        <Card title={`📋 ${result.name}`} color="#10b981" action={<button style={css.btnSm} onClick={download}>⬇ .md</button>}>
          <div style={{ whiteSpace: 'pre-wrap', color: '#cbd5e1', fontSize: '0.9rem', lineHeight: 1.8 }}>{result.plan}</div>
        </Card>
      )}
    </div>
  );
}

/* ── MONEY ──────────────────────────────────────────────────────────────────── */
function MoneyPanel() {
  const [niche, setNiche] = useState('');
  const [budget, setBudget] = useState('');
  const [goal, setGoal] = useState('');
  const [platform, setPlatform] = useState('general');
  const [result, setR] = useState(null);
  const [loading, setL] = useState(false);
  const [err, setErr] = useState('');
  const PLATFORMS = [['general', 'Tutti i canali'], ['meta', 'Meta / Facebook Ads'], ['google', 'Google Ads'], ['tiktok', 'TikTok Ads'], ['email', 'Email Marketing'], ['organic', 'Organico / SEO']];

  async function run(e) {
    e.preventDefault();
    if (!niche.trim()) return;
    setL(true); setR(null); setErr('');
    try {
      const res = await fetch('/api/monetize', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ niche, budget, goal, platform }) });
      const data = await safeJson(res);
      if (data.error) setErr(data.error); else setR(data);
    } catch (e) { setErr(e.message); }
    setL(false);
  }

  return (
    <div style={css.panel}>
      <p style={css.hint}>💰 Strategia di monetizzazione: canali, ROAS, funnel e roadmap 30/60/90 giorni.</p>
      <form onSubmit={run} style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.7rem', marginBottom: '0.7rem', flexWrap: 'wrap' }}>
          <input style={{ ...css.input, flex: 2, minWidth: 200 }} placeholder="Nicchia / Business" value={niche} onChange={e => setNiche(e.target.value)} required />
          <input style={{ ...css.input, flex: 1, minWidth: 120 }} placeholder="Budget €/mese" value={budget} onChange={e => setBudget(e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: '0.7rem', marginBottom: '0.7rem', flexWrap: 'wrap' }}>
          <input style={{ ...css.input, flex: 2, minWidth: 200 }} placeholder="Obiettivo (es. 10k€/mese, 100 lead)" value={goal} onChange={e => setGoal(e.target.value)} />
          <select style={{ ...css.input, flex: 1, minWidth: 150 }} value={platform} onChange={e => setPlatform(e.target.value)}>
            {PLATFORMS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        <Btn loading={loading} label="💰 Genera Strategia" />
      </form>
      {loading && <Loading msg="Elaborazione strategia... (20-30 sec)" />}
      {err && <ErrBox msg={err} />}
      {result?.strategy && (
        <Card title={`💰 Strategia — ${result.niche}`} color="#f59e0b">
          <div style={{ whiteSpace: 'pre-wrap', color: '#cbd5e1', fontSize: '0.9rem', lineHeight: 1.8 }}>{result.strategy}</div>
        </Card>
      )}
    </div>
  );
}

/* ── FINANCE ────────────────────────────────────────────────────────────────── */
function FinancePanel() {
  const [symbol, setSymbol] = useState('');
  const [coin, setCoin] = useState('');
  const [finData, setFin] = useState(null);
  const [cryptoData, setCrypto] = useState(null);
  const [loadFin, setLFin] = useState(false);
  const [loadCrypto, setLCrypto] = useState(false);
  const [errFin, setErrFin] = useState('');
  const [errCrypto, setErrCrypto] = useState('');

  async function getFinance(e) {
    e.preventDefault();
    if (!symbol.trim()) return;
    setLFin(true); setFin(null); setErrFin('');
    const res = await fetch(`/api/finance?symbol=${encodeURIComponent(symbol.toUpperCase())}`);
    const data = await safeJson(res);
    if (data.error) setErrFin(data.error); else setFin(data);
    setLFin(false);
  }

  async function getCrypto(e) {
    e.preventDefault();
    if (!coin.trim()) return;
    setLCrypto(true); setCrypto(null); setErrCrypto('');
    const res = await fetch(`/api/crypto?coin=${encodeURIComponent(coin.toLowerCase())}`);
    const data = await safeJson(res);
    if (data.error) setErrCrypto(data.error); else setCrypto(data);
    setLCrypto(false);
  }

  return (
    <div style={css.panel}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        <div>
          <h3 style={css.sectionLabel}>📈 Borsa Live</h3>
          <form onSubmit={getFinance} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.7rem' }}>
            <input style={css.input} placeholder="AAPL, TSLA, NVDA..." value={symbol} onChange={e => setSymbol(e.target.value)} />
            <Btn loading={loadFin} label="Cerca" />
          </form>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.8rem' }}>
            {['AAPL','MSFT','NVDA','TSLA','AMZN','GOOGL','META','SPY'].map(s => <button key={s} type="button" style={css.tickerBtn} onClick={() => setSymbol(s)}>{s}</button>)}
          </div>
          {errFin && <ErrBox msg={errFin} />}
          {finData && <FinCard data={finData} type="stock" />}
        </div>
        <div>
          <h3 style={css.sectionLabel}>🪙 Crypto Live</h3>
          <form onSubmit={getCrypto} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.7rem' }}>
            <input style={css.input} placeholder="bitcoin, ethereum..." value={coin} onChange={e => setCoin(e.target.value)} />
            <Btn loading={loadCrypto} label="Cerca" />
          </form>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.8rem' }}>
            {['bitcoin','ethereum','solana','binancecoin','cardano'].map(c => <button key={c} type="button" style={css.tickerBtn} onClick={() => setCoin(c)}>{c.slice(0, 3).toUpperCase()}</button>)}
          </div>
          {errCrypto && <ErrBox msg={errCrypto} />}
          {cryptoData && <FinCard data={cryptoData} type="crypto" />}
        </div>
      </div>
    </div>
  );
}

function FinCard({ data, type }) {
  if (type === 'stock') {
    const pos = Number(data.change) >= 0;
    return (
      <div style={css.finCard}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div><div style={{ fontSize: '1.2rem', fontWeight: 800 }}>{data.symbol}</div>{data.name && <div style={{ color: '#64748b', fontSize: '0.75rem' }}>{data.name}</div>}</div>
          <div style={{ textAlign: 'right' }}><div style={{ fontSize: '2rem', fontWeight: 900 }}>{data.price}</div><div style={{ color: '#64748b', fontSize: '0.75rem' }}>{data.currency}</div></div>
        </div>
        <div style={{ marginTop: '0.8rem', display: 'flex', gap: '1rem' }}>
          <Stat label="Variazione" value={`${pos ? '▲' : '▼'} ${Math.abs(Number(data.change)).toFixed(2)}%`} color={pos ? '#10b981' : '#f87171'} />
          <Stat label="Max" value={data.high} /> <Stat label="Min" value={data.low} />
        </div>
      </div>
    );
  }
  const pos = Number(data.change24h) >= 0;
  return (
    <div style={css.finCard}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div><div style={{ fontSize: '0.75rem', color: '#64748b' }}>#{data.rank}</div><div style={{ fontSize: '1.2rem', fontWeight: 800 }}>{data.name}</div></div>
        <div style={{ textAlign: 'right' }}><div style={{ fontSize: '2rem', fontWeight: 900 }}>${Number(data.price || 0).toLocaleString('en-US', { maximumFractionDigits: 2 })}</div></div>
      </div>
      <div style={{ marginTop: '0.8rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <Stat label="24h" value={`${pos ? '▲' : '▼'} ${Math.abs(Number(data.change24h)).toFixed(2)}%`} color={pos ? '#10b981' : '#f87171'} />
        <Stat label="7d" value={`${Number(data.change7d) >= 0 ? '▲' : '▼'} ${Math.abs(Number(data.change7d)).toFixed(2)}%`} color={Number(data.change7d) >= 0 ? '#10b981' : '#f87171'} />
        {data.marketCap > 0 && <Stat label="MCap" value={`$${(data.marketCap / 1e9).toFixed(1)}B`} />}
      </div>
    </div>
  );
}

/* ── SECOND BRAIN (redirect) ─────────────────────────────────────────────────── */
function WikiRedirectPanel() {
  return (
    <div style={{ ...css.panel, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, textAlign: 'center', gap: 20 }}>
      <div style={{ fontSize: 64 }}>🧠</div>
      <h2 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Second Brain</h2>
      <p style={{ color: '#94a3b8', maxWidth: 480, lineHeight: 1.6, margin: 0 }}>
        Ingesta fonti, interroga la wiki con linguaggio naturale, e lascia che l&apos;AI mantenga il tuo archivio di conoscenza strutturato.
      </p>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center', margin: '8px 0' }}>
        {['📥 Ingest', '🔍 Query', '🔧 Lint', '📋 Log'].map(f => (
          <span key={f} style={{ padding: '6px 16px', borderRadius: 20, background: 'rgba(99,102,241,0.15)', color: '#a5b4fc', fontSize: 13, fontWeight: 600, border: '1px solid rgba(99,102,241,0.3)' }}>{f}</span>
        ))}
      </div>
      <Link href="/wiki" style={{ padding: '14px 40px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', borderRadius: 12, fontWeight: 700, fontSize: 16, textDecoration: 'none', display: 'inline-block' }}>
        Apri Second Brain →
      </Link>
    </div>
  );
}

/* ── FUNNEL ─────────────────────────────────────────────────────────────────── */
function FunnelPanel() {
  const [product, setProduct] = useState('');
  const [target, setTarget] = useState('');
  const [price, setPrice] = useState('');
  const [goal, setGoal] = useState('');
  const [type, setType] = useState('lead-generation');
  const [result, setR] = useState(null);
  const [loading, setL] = useState(false);
  const [err, setErr] = useState('');

  const TYPES = [
    ['lead-generation', '🎯 Lead Generation'],
    ['webinar', '🎤 Webinar Funnel'],
    ['product-launch', '🚀 Product Launch'],
    ['tripwire', '💸 Tripwire Funnel'],
    ['membership', '👥 Membership'],
    ['ebook', '📚 Ebook/Corso'],
  ];

  async function run(e) {
    e.preventDefault();
    if (!product.trim() || !target.trim()) return;
    setL(true); setR(null); setErr('');
    try {
      const res = await fetch('/api/tools/funnel', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ product, targetAudience: target, price, goal, type }) });
      const data = await safeJson(res);
      if (data.error) setErr(data.error); else setR(data.funnel);
    } catch (e) { setErr(e.message); }
    setL(false);
  }

  function download() {
    if (!result) return;
    const text = JSON.stringify(result, null, 2);
    const blob = new Blob([text], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `funnel_${Date.now()}.json`; a.click();
  }

  return (
    <div style={css.panel}>
      <p style={css.hint}>🔄 Funnel Builder AI: crea funnel di vendita completi con landing page, email sequence e strategia step-by-step.</p>
      <form onSubmit={run} style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.7rem', marginBottom: '0.7rem' }}>
          <input style={css.input} placeholder="Prodotto/Servizio (es. corso di marketing)" value={product} onChange={e => setProduct(e.target.value)} required />
          <input style={css.input} placeholder="Target (es. imprenditori 30-50 anni)" value={target} onChange={e => setTarget(e.target.value)} required />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '0.7rem', alignItems: 'center' }}>
          <input style={css.input} placeholder="Prezzo (es. 297)" value={price} onChange={e => setPrice(e.target.value)} />
          <input style={css.input} placeholder="Obiettivo (es. 100 vendite/mese)" value={goal} onChange={e => setGoal(e.target.value)} />
          <select style={css.input} value={type} onChange={e => setType(e.target.value)}>
            {TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <Btn loading={loading} label="🔄 Genera Funnel" />
        </div>
      </form>
      {loading && <Loading msg="Creazione funnel completo..." />}
      {err && <ErrBox msg={err} />}
      {result && (
        <>
          <Card title={`🔄 ${result.name || 'Funnel Generato'}`} color="#7c3aed"
            action={<button style={css.btnSm} onClick={download}>⬇ JSON</button>}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.7rem', marginBottom: '1rem' }}>
              {[['📊 Conversione stimata', result.estimatedConversionRate], ['💰 ROI stimato', result.estimatedROI], ['⏱️ Timeline', result.timeline]].map(([l, v]) => v && (
                <div key={l} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '0.6rem 0.8rem' }}>
                  <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{l}</div>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#f1f5f9', marginTop: '0.2rem' }}>{v}</div>
                </div>
              ))}
            </div>
            {result.stages?.length > 0 && (
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#a78bfa', marginBottom: '0.6rem' }}>📋 Fasi del Funnel</div>
                {result.stages.map((stage, i) => (
                  <div key={i} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '0.8rem', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.4rem' }}>
                      <Badge label={`Step ${stage.id}`} color="#7c3aed" />
                      <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>{stage.name}</span>
                      {stage.conversionRate && <span style={{ color: '#10b981', fontSize: '0.75rem', marginLeft: 'auto' }}>conv: {stage.conversionRate}</span>}
                    </div>
                    {stage.headline && <div style={{ color: '#f1f5f9', fontWeight: 600, fontSize: '0.88rem', marginBottom: '0.2rem' }}>{stage.headline}</div>}
                    {stage.cta && <div style={{ color: '#06b6d4', fontSize: '0.8rem' }}>CTA: {stage.cta}</div>}
                    {stage.tips && <div style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '0.3rem' }}>💡 {stage.tips}</div>}
                  </div>
                ))}
              </div>
            )}
            {result.emailSequence?.length > 0 && (
              <div>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#06b6d4', marginBottom: '0.6rem' }}>📧 Sequenza Email ({result.emailSequence.length})</div>
                {result.emailSequence.slice(0, 3).map((em, i) => (
                  <div key={i} style={{ background: 'rgba(6,182,212,0.05)', border: '1px solid rgba(6,182,212,0.15)', borderRadius: 10, padding: '0.8rem', marginBottom: '0.5rem' }}>
                    <div style={{ fontSize: '0.75rem', color: '#06b6d4' }}>Giorno {em.day} · {em.goal}</div>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem', marginTop: '0.2rem' }}>{em.subject}</div>
                  </div>
                ))}
                {result.emailSequence.length > 3 && <div style={{ color: '#64748b', fontSize: '0.78rem', textAlign: 'center' }}>+{result.emailSequence.length - 3} altre email nel download JSON</div>}
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}

/* ── FREELANCE ───────────────────────────────────────────────────────────────── */
function FreelancePanel() {
  const [query, setQuery] = useState('');
  const [skills, setSkills] = useState('');
  const [minBudget, setMinBudget] = useState(0);
  const [platform, setPlatform] = useState('all');
  const [jobs, setJobs] = useState([]);
  const [loading, setL] = useState(false);
  const [err, setErr] = useState('');

  const PLATFORMS = [['all','Tutte le piattaforme'],['upwork','Upwork'],['freelancer','Freelancer'],['toptal','Toptal'],['linkedin','LinkedIn'],['fiverr','Fiverr']];
  const URGENCY_COLOR = { low: '#64748b', medium: '#f59e0b', high: '#f87171' };
  const QUICK_SEARCHES = ['React developer full-stack','Consulente marketing digitale','Copywriter italiano','Designer UI/UX freelance','Sviluppatore Python AI'];

  async function run(e) {
    e.preventDefault();
    if (!query.trim()) return;
    setL(true); setJobs([]); setErr('');
    try {
      const skillArr = skills.split(',').map(s => s.trim()).filter(Boolean);
      const res = await fetch('/api/tools/freelance', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query, skills: skillArr, minBudget, platform }) });
      const data = await safeJson(res);
      if (data.error) setErr(data.error); else setJobs(data.jobs || []);
    } catch (e) { setErr(e.message); }
    setL(false);
  }

  return (
    <div style={css.panel}>
      <p style={css.hint}>💼 Trova opportunità freelance AI-curated. Ricerche su Upwork, Freelancer, Toptal, LinkedIn e altre piattaforme.</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.8rem' }}>
        {QUICK_SEARCHES.map(q => <button key={q} type="button" style={css.quickBtn} onClick={() => setQuery(q)}>{q}</button>)}
      </div>
      <form onSubmit={run} style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '0.7rem', marginBottom: '0.7rem' }}>
          <input style={css.input} placeholder="Cosa cerchi? (es. sviluppatore React senior)" value={query} onChange={e => setQuery(e.target.value)} required />
          <Btn loading={loading} label="🔎 Cerca" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '0.7rem', alignItems: 'center' }}>
          <input style={css.input} placeholder="Skill richieste (es. React, TypeScript, Node.js)" value={skills} onChange={e => setSkills(e.target.value)} />
          <input style={{ ...css.input, width: 140 }} type="number" placeholder="Budget min €" value={minBudget || ''} onChange={e => setMinBudget(Number(e.target.value))} />
          <select style={{ ...css.input, width: 180 }} value={platform} onChange={e => setPlatform(e.target.value)}>
            {PLATFORMS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
      </form>
      {loading && <Loading msg="Ricerca opportunità freelance..." />}
      {err && <ErrBox msg={err} />}
      {jobs.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
          <div style={{ color: '#64748b', fontSize: '0.82rem', marginBottom: '0.3rem' }}>🎯 {jobs.length} opportunità trovate</div>
          {jobs.map((job, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '1.2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.6rem' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.2rem' }}>{job.title}</div>
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    <Badge label={job.platform} color="#7c3aed" />
                    <Badge label={job.category} color="#06b6d4" />
                    <span style={{ fontSize: '0.72rem', color: URGENCY_COLOR[job.urgency] || '#64748b', fontWeight: 600 }}>
                      ● {job.urgency === 'high' ? 'Urgente' : job.urgency === 'medium' ? 'Medio' : 'Normale'}
                    </span>
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontWeight: 800, color: '#10b981', fontSize: '1rem' }}>{job.budget}</div>
                  <div style={{ color: '#64748b', fontSize: '0.72rem' }}>{job.duration}</div>
                </div>
              </div>
              <p style={{ color: '#94a3b8', fontSize: '0.82rem', lineHeight: 1.6, marginBottom: '0.6rem' }}>{job.description}</p>
              {job.skills?.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginBottom: '0.6rem' }}>
                  {job.skills.slice(0, 5).map(s => <span key={s} style={{ background: 'rgba(124,58,237,0.1)', color: '#a78bfa', borderRadius: 4, padding: '0.1rem 0.5rem', fontSize: '0.72rem', fontWeight: 600 }}>{s}</span>)}
                </div>
              )}
              {job.tips && <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: 8, padding: '0.5rem 0.7rem', fontSize: '0.78rem', color: '#34d399' }}>💡 {job.tips}</div>}
              {job.clientRating && <div style={{ marginTop: '0.4rem', fontSize: '0.75rem', color: '#64748b' }}>⭐ Cliente: {job.clientRating}/5 · {job.proposals || '?'} proposte ricevute</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── CONTRACT ────────────────────────────────────────────────────────────────── */
function ContractPanel() {
  const [contractType, setContractType] = useState('freelance');
  const [form, setForm] = useState({ yourName: '', yourEmail: '', clientName: '', clientEmail: '', projectName: '', amount: '', duration: '', scope: '', paymentTerms: '' });
  const [result, setR] = useState('');
  const [loading, setL] = useState(false);
  const [err, setErr] = useState('');

  const TYPES = [
    ['freelance', '💻 Contratto Freelance'], ['nda', '🔒 NDA - Riservatezza'],
    ['partnership', '🤝 Partnership'], ['consulting', '📊 Consulenza'],
    ['saas', '☁️ SaaS / Licenza'], ['employment', '👔 Lettera Impegno'],
  ];

  function setF(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function generate(e) {
    e.preventDefault();
    setL(true); setR(''); setErr('');
    try {
      const res = await fetch('/api/tools/contract', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: contractType, ...form }) });
      const data = await safeJson(res);
      if (data.error) setErr(data.error); else setR(data.contract || '');
    } catch (e) { setErr(e.message); }
    setL(false);
  }

  function download() {
    if (!result) return;
    const blob = new Blob([result], { type: 'text/plain' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `contratto_${contractType}_${Date.now()}.txt`; a.click();
  }

  return (
    <div style={css.panel}>
      <p style={css.hint}>📝 Genera contratti professionali in italiano con AI. Pronti da usare, legalmente solidi, personalizzati.</p>
      <form onSubmit={generate} style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          {TYPES.map(([v, l]) => (
            <button key={v} type="button" style={{ ...css.tabBtn, ...(contractType === v ? css.tabActive : {}) }} onClick={() => setContractType(v)}>{l}</button>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.7rem', marginBottom: '0.7rem' }}>
          <input style={css.input} placeholder="Il tuo nome/ragione sociale" value={form.yourName} onChange={e => setF('yourName', e.target.value)} />
          <input style={css.input} placeholder="La tua email" value={form.yourEmail} onChange={e => setF('yourEmail', e.target.value)} />
          <input style={css.input} placeholder="Nome cliente" value={form.clientName} onChange={e => setF('clientName', e.target.value)} />
          <input style={css.input} placeholder="Email cliente" value={form.clientEmail} onChange={e => setF('clientEmail', e.target.value)} />
          <input style={css.input} placeholder="Nome progetto/servizio" value={form.projectName} onChange={e => setF('projectName', e.target.value)} />
          <input style={css.input} placeholder="Importo totale (€)" value={form.amount} onChange={e => setF('amount', e.target.value)} />
          <input style={css.input} placeholder="Durata (es. 3 mesi)" value={form.duration} onChange={e => setF('duration', e.target.value)} />
          <input style={css.input} placeholder="Termini pagamento (es. 50% anticipo)" value={form.paymentTerms} onChange={e => setF('paymentTerms', e.target.value)} />
        </div>
        <textarea style={{ ...css.input, height: 70, resize: 'vertical', display: 'block', width: '100%', marginBottom: '0.7rem' }} placeholder="Ambito/descrizione del lavoro..." value={form.scope} onChange={e => setF('scope', e.target.value)} />
        <Btn loading={loading} label="📝 Genera Contratto" />
      </form>
      {loading && <Loading msg="Generazione contratto professionale..." />}
      {err && <ErrBox msg={err} />}
      {result && (
        <Card title="📝 Contratto Generato" color="#10b981"
          action={<button style={css.btnSm} onClick={download}>⬇ Scarica .txt</button>}>
          <pre style={{ whiteSpace: 'pre-wrap', color: '#cbd5e1', fontSize: '0.82rem', lineHeight: 1.8, fontFamily: 'inherit', maxHeight: 600, overflowY: 'auto' }}>{result}</pre>
        </Card>
      )}
    </div>
  );
}

/* ── SEO ANALYZER ────────────────────────────────────────────────────────────── */
function SeoPanel() {
  const [url, setUrl] = useState('');
  const [keyword, setKeyword] = useState('');
  const [mode, setMode] = useState('audit');
  const [result, setR] = useState('');
  const [loading, setL] = useState(false);
  const [err, setErr] = useState('');
  const resultRef = useRef('');

  async function run(e) {
    e.preventDefault();
    if (mode === 'audit' && !url.trim()) return;
    if (mode !== 'audit' && !keyword.trim()) return;
    setL(true); setR(''); setErr(''); resultRef.current = '';
    try {
      const res = await fetch('/api/tools/seo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, url: url.trim(), keyword: keyword.trim() }),
      });
      if (!res.ok || !res.body) { const d = await safeJson(res); setErr(d.error || 'Errore server'); setL(false); return; }

      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const parts = buf.split('\n\n'); buf = parts.pop();
        for (const part of parts) {
          if (!part.startsWith('data: ')) continue;
          try {
            const ev = JSON.parse(part.slice(6));
            if (ev.t) { resultRef.current += ev.t; setR(resultRef.current); }
            if (ev.error) setErr(ev.error);
          } catch {}
        }
      }
    } catch (e) { setErr(e.message); }
    setL(false);
  }

  const MODES = [['audit', '🔍 SEO Audit'], ['keywords', '🎯 Keyword Research'], ['content', '✍️ Articolo SEO']];

  return (
    <div style={css.panel}>
      <p style={css.hint}>🔍 SEO Analyzer: audit completo, keyword research e generazione contenuti ottimizzati per i motori di ricerca.</p>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.2rem', flexWrap: 'wrap' }}>
        {MODES.map(([id, label]) => (
          <button key={id} style={{ ...css.tabBtn, ...(mode === id ? css.tabActive : {}) }} onClick={() => { setMode(id); setR(''); setErr(''); resultRef.current = ''; }}>{label}</button>
        ))}
      </div>
      <form onSubmit={run} style={{ display: 'flex', gap: '0.7rem', marginBottom: '1.5rem' }}>
        {mode === 'audit'
          ? <input style={css.input} placeholder="URL sito da analizzare (es. https://tuosito.com)" value={url} onChange={e => setUrl(e.target.value)} required />
          : <input style={css.input} placeholder={mode === 'keywords' ? 'Keyword (es. software gestione ristoranti)' : 'Argomento articolo (es. email marketing per ecommerce)'} value={keyword} onChange={e => setKeyword(e.target.value)} required />
        }
        <Btn loading={loading} label={mode === 'audit' ? '🔍 Analizza' : mode === 'keywords' ? '🎯 Ricerca' : '✍️ Genera'} />
      </form>
      {loading && !result && <Loading msg={mode === 'audit' ? 'Analisi SEO in corso...' : mode === 'keywords' ? 'Ricerca keyword...' : 'Scrittura articolo SEO...'} />}
      {err && <ErrBox msg={err} />}
      {result && (
        <Card title={mode === 'audit' ? '🔍 SEO Audit Report' : mode === 'keywords' ? '🎯 Keyword Research' : '✍️ Articolo Generato'} color="#10b981"
          action={<button style={css.btnSm} onClick={() => { const b = new Blob([resultRef.current], {type:'text/plain'}); const a = document.createElement('a'); a.href=URL.createObjectURL(b); a.download=`seo_${mode}_${Date.now()}.md`; a.click(); }}>⬇ Scarica</button>}>
          <pre style={{ whiteSpace: 'pre-wrap', color: '#cbd5e1', fontSize: '0.88rem', lineHeight: 1.8, fontFamily: 'inherit', maxHeight: 700, overflowY: 'auto' }}>{result}{loading && '▌'}</pre>
        </Card>
      )}
    </div>
  );
}

/* ── COMPETITOR AI ────────────────────────────────────────────────────────────── */
function CompetitorPanel() {
  const [business, setBusiness] = useState('');
  const [competitor, setCompetitor] = useState('');
  const [aspect, setAspect] = useState('completo');
  const [result, setR] = useState('');
  const [loading, setL] = useState(false);
  const [err, setErr] = useState('');

  const ASPECTS = [
    ['completo', '🔭 Analisi Completa'], ['pricing', '💰 Prezzi & Piani'], ['marketing', '📣 Marketing & Ads'],
    ['seo', '🔍 SEO & Contenuti'], ['social', '📱 Social Media'], ['prodotto', '🛠️ Prodotto & UX'],
  ];

  async function run(e) {
    e.preventDefault();
    if (!business.trim()) return;
    setL(true); setR(''); setErr('');
    const query = competitor
      ? `Analizza competitor: "${competitor}" vs "${business}". Aspetto: ${aspect}. Confronta: positioning, prezzi, punti forza/debolezza, strategia, opportunità per ${business}.`
      : `Analizza i principali competitor di "${business}" per aspetto: ${aspect}. Trova i top 5 competitor, confronta prezzi, positioning, punti di forza/debolezza. Identifica gap di mercato e opportunità.`;
    try {
      const res = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: query, sessionId: `comp-${Date.now()}`, streaming: false }) });
      const data = await safeJson(res);
      if (data.error) setErr(data.error); else setR(data.reply || '');
    } catch (e) { setErr(e.message); }
    setL(false);
  }

  return (
    <div style={css.panel}>
      <p style={css.hint}>🏆 Competitor AI: analizza la concorrenza, trova gap di mercato e opportunità di positioning per il tuo business.</p>
      <form onSubmit={run} style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '0.7rem', marginBottom: '0.7rem' }}>
          <input style={css.input} placeholder="Il tuo business / settore (es. SaaS HR, e-commerce moda)" value={business} onChange={e => setBusiness(e.target.value)} required />
          <input style={css.input} placeholder="Competitor specifico (opzionale, es. HubSpot, Zalando)" value={competitor} onChange={e => setCompetitor(e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.7rem' }}>
          {ASPECTS.map(([id, label]) => (
            <button key={id} type="button" style={{ ...css.tabBtn, ...(aspect === id ? css.tabActive : {}), fontSize: '0.78rem', padding: '0.35rem 0.8rem' }} onClick={() => setAspect(id)}>{label}</button>
          ))}
        </div>
        <Btn loading={loading} label="🏆 Analizza Competitor" />
      </form>
      {loading && <Loading msg="Analisi competitor con AI + ricerca web..." />}
      {err && <ErrBox msg={err} />}
      {result && (
        <Card title="🏆 Analisi Competitor" color="#f59e0b"
          action={<button style={css.btnSm} onClick={() => { const b = new Blob([result], {type:'text/plain'}); const a = document.createElement('a'); a.href=URL.createObjectURL(b); a.download=`competitor_${Date.now()}.txt`; a.click(); }}>⬇ Scarica</button>}>
          <pre style={{ whiteSpace: 'pre-wrap', color: '#cbd5e1', fontSize: '0.88rem', lineHeight: 1.8, fontFamily: 'inherit', maxHeight: 700, overflowY: 'auto' }}>{result}</pre>
        </Card>
      )}
    </div>
  );
}

/* ── SHARED ─────────────────────────────────────────────────────────────────── */
function Btn({ loading, label, disabled }) {
  return <button type="submit" style={{ ...css.btnPrimary, opacity: (loading || disabled) ? 0.6 : 1, cursor: (loading || disabled) ? 'not-allowed' : 'pointer' }} disabled={loading || disabled}>{loading ? '⏳ ...' : label}</button>;
}
function Loading({ msg }) {
  return <div style={{ textAlign: 'center', padding: '2.5rem', color: '#64748b' }}><div style={{ fontSize: '2rem', marginBottom: '0.7rem' }}>⏳</div>{msg}</div>;
}
function ErrBox({ msg }) {
  return <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '0.8rem 1rem', color: '#f87171', marginBottom: '1rem', fontSize: '0.88rem' }}>⚠️ {msg}</div>;
}
function Card({ title, color, children, action }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${color}40`, borderRadius: 14, padding: '1.4rem', marginBottom: '1.2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <span style={{ fontWeight: 700, color }}>{title}</span>{action}
      </div>
      {children}
    </div>
  );
}
function Badge({ label, color = '#7c3aed' }) {
  return <span style={{ background: `${color}30`, color, fontSize: '0.68rem', padding: '0.15rem 0.5rem', borderRadius: 100, fontWeight: 600, flexShrink: 0 }}>{label}</span>;
}
function Stat({ label, value, color }) {
  return <div><div style={{ fontSize: '0.7rem', color: '#64748b' }}>{label}</div><div style={{ fontWeight: 700, fontSize: '0.9rem', color: color || '#f1f5f9' }}>{value}</div></div>;
}
function TgIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.833.941z" /></svg>;
}

/* ── TELEGRAM LINK COMPONENT ────────────────────────────────────────────────── */
function TelegramLink({ email }) {
  const [linkStatus, setLinkStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [linkEmail, setLinkEmail] = useState('');

  useEffect(() => {
    checkLink();
  }, []);

  async function checkLink() {
    try {
      // Get Telegram ID from localStorage (set by user via /start command)
      const tgId = localStorage.getItem('telegram_id');
      if (!tgId) {
        setLinkStatus({ linked: false, message: 'Apri Telegram e invia /start a @Lara_Aethersy_Bot per ottenere il tuo ID' });
        return;
      }

      const res = await fetch('/api/auth/link-telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'check', telegramId: tgId })
      });
      const data = await res.json();
      setLinkStatus(data);
    } catch (e) {
      setLinkStatus({ linked: false, message: 'Errore di connessione' });
    }
  }

  async function handleLink(e) {
    e.preventDefault();
    if (!linkEmail.trim()) return;

    setLoading(true);
    const tgId = localStorage.getItem('telegram_id');
    if (!tgId) {
      alert('Prima ottieni il tuo ID Telegram inviando /start a @Lara_Aethersy_Bot');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/link-telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'link', telegramId: tgId, email })
      });
      const data = await res.json();

      if (data.success) {
        setLinkStatus({ linked: true, email, message: 'Collegato con successo!' });
        setLinkEmail('');
      } else {
        alert(data.error || 'Errore nel collegamento');
      }
    } catch (e) {
      alert('Errore: ' + e.message);
    }
    setLoading(false);
  }

  async function handleUnlink() {
    const tgId = localStorage.getItem('telegram_id');
    if (!tgId) return;

    if (!confirm('Scollegare Telegram dal tuo account web?')) return;

    try {
      const res = await fetch('/api/auth/link-telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'unlink', telegramId: tgId })
      });
      const data = await res.json();
      if (data.success) {
        setLinkStatus({ linked: false, message: 'Telegram scollegato' });
      }
    } catch (e) {
      alert('Errore: ' + e.message);
    }
  }

  return (
    <div style={{ marginTop: '0.5rem', padding: '0.5rem', background: 'rgba(0,136,204,0.08)', border: '1px solid rgba(0,136,204,0.2)', borderRadius: 8, fontSize: '0.72rem' }}>
      {linkStatus?.linked ? (
        <div>
          <div style={{ color: '#38bdf8', fontWeight: 600, marginBottom: '0.25rem' }}>✅ Telegram Collegato</div>
          <div style={{ color: '#64748b', marginBottom: '0.4rem' }}>{linkStatus.email}</div>
          <button onClick={handleUnlink} style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', borderRadius: 4, padding: '0.2rem 0.5rem', fontSize: '0.65rem', cursor: 'pointer' }}>Scollega</button>
        </div>
      ) : (
        <div>
          <div style={{ color: '#94a3b8', marginBottom: '0.4rem' }}>{linkStatus?.message || 'Collega Telegram'}</div>
          <form onSubmit={handleLink} style={{ display: 'flex', gap: '0.3rem' }}>
            <input
              type="email"
              placeholder="tua@email.com"
              value={linkEmail}
              onChange={e => setLinkEmail(e.target.value)}
              style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, color: '#f1f5f9', padding: '0.25rem 0.4rem', fontSize: '0.68rem', outline: 'none' }}
            />
            <button type="submit" disabled={loading || !linkEmail} style={{ background: 'linear-gradient(135deg,#0891b2,#06b6d4)', border: 'none', borderRadius: 4, color: '#fff', padding: '0.25rem 0.5rem', fontSize: '0.65rem', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
              {loading ? '⏳' : '🔗'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

/* ── SUBSCRIPTION BUTTON ────────────────────────────────────────────────────── */
function SubscriptionButton({ email, plan }) {
  const [sub, setSub] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showLimits, setShowLimits] = useState(false);
  const token = typeof window !== 'undefined' ? localStorage.getItem('aiforge_token') : null;

  useEffect(() => {
    if (token && email) {
      checkSubscription();
    }
  }, [email]);

  async function checkSubscription() {
    try {
      const res = await fetch('/api/stripe/subscription', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await safeJson(res);
      setSub(data);
    } catch (e) {
      console.error('Subscription check error:', e);
    }
  }

  async function openPortal() {
    setLoading(true);
    try {
      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await safeJson(res);
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (e) {
      alert('Errore: ' + e.message);
    }
    setLoading(false);
  }

  const LIMITS = {
    free: { chat: 20, search: 5, code: 3, voice: 5, terminal: 3 },
    pro: { chat: '∞', search: '∞', code: '∞', voice: 100, terminal: '∞' },
    business: { chat: '∞', search: '∞', code: '∞', voice: '∞', terminal: '∞' },
    enterprise: { chat: '∞', search: '∞', code: '∞', voice: '∞', terminal: '∞' }
  };

  const currentPlan = plan || 'free';
  const planLimits = LIMITS[currentPlan] || LIMITS.free;

  return (
    <>
      <button
        onClick={openPortal}
        disabled={loading}
        onMouseEnter={() => setShowLimits(true)}
        onMouseLeave={() => setShowLimits(false)}
        style={{
          background: sub?.active ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
          border: `1px solid ${sub?.active ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
          color: sub?.active ? '#34d399' : '#f87171',
          borderRadius: 100,
          padding: '0.25rem 0.7rem',
          fontSize: '0.75rem',
          fontWeight: 600,
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.7 : 1,
          position: 'relative'
        }}
      >
        {loading ? '⏳' : sub?.active ? `✅ ${plan.toUpperCase()}` : `${(plan || 'free').toUpperCase()}`}
      </button>

      {showLimits && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: 0,
          marginTop: '0.5rem',
          background: 'rgba(15,23,42,0.98)',
          border: '1px solid rgba(124,58,237,0.3)',
          borderRadius: 12,
          padding: '1rem',
          minWidth: 200,
          zIndex: 100,
          boxShadow: '0 10px 40px rgba(0,0,0,0.4)'
        }}>
          <div style={{ fontSize: '0.7rem', color: '#64748b', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Limiti Piano {currentPlan.toUpperCase()}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
              <span style={{ color: '#94a3b8' }}>Chat</span>
              <span style={{ color: planLimits.chat === '∞' ? '#34d399' : '#a78bfa' }}>{planLimits.chat}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
              <span style={{ color: '#94a3b8' }}>Ricerca</span>
              <span style={{ color: planLimits.search === '∞' ? '#34d399' : '#a78bfa' }}>{planLimits.search}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
              <span style={{ color: '#94a3b8' }}>Codice</span>
              <span style={{ color: planLimits.code === '∞' ? '#34d399' : '#a78bfa' }}>{planLimits.code}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
              <span style={{ color: '#94a3b8' }}>Voce</span>
              <span style={{ color: planLimits.voice === '∞' ? '#34d399' : '#a78bfa' }}>{planLimits.voice}</span>
            </div>
          </div>
          {currentPlan === 'free' && (
            <Link href="/pricing" style={{
              display: 'block',
              marginTop: '0.7rem',
              textAlign: 'center',
              background: 'linear-gradient(135deg,#7c3aed,#06b6d4)',
              color: '#fff',
              borderRadius: 8,
              padding: '0.4rem',
              fontSize: '0.72rem',
              fontWeight: 600,
              textDecoration: 'none'
            }}>
              Upgrade →
            </Link>
          )}
        </div>
      )}
    </>
  );
}

function getPlanBadgeColor(plan) {
  switch (plan?.toLowerCase()) {
    case 'pro': return 'rgba(124,58,237,0.25)';
    case 'business': return 'rgba(6,182,212,0.25)';
    case 'enterprise': return 'rgba(245,158,11,0.25)';
    default: return 'rgba(100,116,139,0.25)';
  }
}

const css = {
  root: { display: 'flex', height: '100vh', background: '#0a0a0f', color: '#f1f5f9', overflow: 'hidden', fontFamily: "'Inter',system-ui,sans-serif" },
  sidebar: { background: '#0d0d16', borderRight: '1px solid rgba(255,255,255,0.07)', display: 'flex', flexDirection: 'column', transition: 'width 0.25s', overflow: 'hidden', flexShrink: 0 },
  sideTop: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.8rem', borderBottom: '1px solid rgba(255,255,255,0.07)', gap: '0.5rem' },
  logo: { fontWeight: 800, fontSize: '0.9rem', background: 'linear-gradient(135deg,#7c3aed,#06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', textDecoration: 'none', whiteSpace: 'nowrap' },
  toggleBtn: { background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '0.7rem', flexShrink: 0 },
  sideMottoLine: { color: '#334155', fontSize: '0.68rem', fontStyle: 'italic', padding: '0.4rem 0.8rem 0.2rem', letterSpacing: '0.03em' },
  catHeader: { width: '100%', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.8rem 0.2rem', background: 'none', border: 'none', cursor: 'pointer', color: '#334155' },
  sideBtn: { width: '100%', display: 'flex', alignItems: 'center', gap: '0.55rem', padding: '0.5rem 0.8rem', border: 'none', background: 'transparent', color: '#64748b', borderRadius: 8, cursor: 'pointer', whiteSpace: 'nowrap', marginBottom: '0.05rem' },
  active: { background: 'rgba(124,58,237,0.2)', color: '#a78bfa' },
  quickLink: (color, bg, border) => ({ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.45rem 0.6rem', background: bg, border: `1px solid ${border}`, color, borderRadius: 8, fontSize: '0.8rem', fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap' }),
  sideBottom: { padding: '0.6rem', borderTop: '1px solid rgba(255,255,255,0.07)' },
  tgBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,136,204,0.12)', border: '1px solid rgba(0,136,204,0.25)', color: '#38bdf8', borderRadius: 8, padding: '0.45rem 0.6rem', fontSize: '0.78rem', textDecoration: 'none', whiteSpace: 'nowrap', width: '100%' },
  userInfo: { color: '#64748b', fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '0.5rem' },
  planBadge: { background: 'rgba(124,58,237,0.2)', color: '#a78bfa', borderRadius: 4, padding: '0.05rem 0.35rem', fontSize: '0.62rem', fontWeight: 700, marginLeft: '0.4rem' },
  logoutBtn: { marginTop: '0.2rem', background: 'none', border: 'none', color: '#334155', fontSize: '0.72rem', cursor: 'pointer', padding: 0 },
  main: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.9rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 },
  h1: { fontSize: '1.1rem', fontWeight: 800, margin: 0 },
  userBadge: { background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', color: '#a78bfa', borderRadius: 100, padding: '0.25rem 0.7rem', fontSize: '0.75rem' },
  pricingBadge: { background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', color: '#34d399', borderRadius: 100, padding: '0.25rem 0.7rem', fontSize: '0.75rem', textDecoration: 'none', fontWeight: 600 },
  tgBadge: { display: 'flex', alignItems: 'center', background: 'rgba(0,136,204,0.12)', border: '1px solid rgba(0,136,204,0.25)', color: '#38bdf8', borderRadius: 100, padding: '0.25rem 0.8rem', fontSize: '0.75rem', textDecoration: 'none' },
  content: { flex: 1, overflowY: 'auto', padding: '1.5rem 1.8rem' },
  panel: { maxWidth: 920 },
  hint: { color: '#64748b', fontSize: '0.82rem', marginBottom: '1rem', lineHeight: 1.5 },
  input: { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#f1f5f9', padding: '0.7rem 1rem', fontSize: '0.9rem', outline: 'none', width: '100%', fontFamily: 'inherit' },
  btnPrimary: { background: 'linear-gradient(135deg,#7c3aed,#06b6d4)', color: '#fff', border: 'none', borderRadius: 10, padding: '0.7rem 1.4rem', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', fontSize: '0.88rem', fontFamily: 'inherit' },
  btnSm: { background: 'rgba(124,58,237,0.2)', color: '#a78bfa', border: '1px solid rgba(124,58,237,0.3)', borderRadius: 8, padding: '0.3rem 0.8rem', fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'inherit' },
  tabBtn: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#64748b', borderRadius: 8, padding: '0.5rem 1rem', fontSize: '0.83rem', cursor: 'pointer', fontFamily: 'inherit' },
  tabActive: { background: 'rgba(124,58,237,0.2)', borderColor: 'rgba(124,58,237,0.35)', color: '#a78bfa' },
  quickBtn: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8', borderRadius: 8, padding: '0.3rem 0.7rem', fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' },
  tickerBtn: { background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)', color: '#a78bfa', borderRadius: 6, padding: '0.25rem 0.6rem', fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'monospace', fontWeight: 700 },
  srcCard: { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '0.85rem', display: 'block', textDecoration: 'none' },
  finCard: { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '1.2rem' },
  sectionLabel: { color: '#94a3b8', fontSize: '0.88rem', fontWeight: 600, marginBottom: '0.8rem', marginTop: 0 },
};
