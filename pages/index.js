import { useState } from 'react';
import { useRouter } from 'next/router';

const BOT_USERNAME = 'Lara_Aethersy_AI_bot';
const BOT_URL = 'https://t.me/Lara_Aethersy_AI_bot';

export default function HomePage() {
  const router = useRouter();
  const [modal, setModal] = useState(false);
  const [tab, setTab] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ ok: '', err: '' });

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setMsg({ ok: '', err: '' });

    try {
      const res = await fetch(`/api/auth/${tab}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });
      const data = await res.json();

      if (data.error) {
        setMsg({ err: data.error, ok: '' });
      } else {
        localStorage.setItem('aiforge_user', JSON.stringify(data.user));
        localStorage.setItem('aiforge_token', data.token);
        router.push('/dashboard');
      }
    } catch {
      setMsg({ err: 'Errore di rete', ok: '' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', color: '#f1f5f9', fontFamily: 'system-ui' }}>
      {/* Header */}
      <header style={{ padding: '1.5rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '1.5rem', fontWeight: 900, background: 'linear-gradient(135deg, #7c3aed, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          ⚡ Aethersy-AI
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={() => { setTab('login'); setModal(true); }} style={{ padding: '0.5rem 1.5rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, color: '#fff', cursor: 'pointer' }}>
            Accedi
          </button>
          <button onClick={() => { setTab('register'); setModal(true); }} style={{ padding: '0.5rem 1.5rem', background: 'linear-gradient(135deg, #7c3aed, #06b6d4)', border: 'none', borderRadius: 8, color: '#fff', cursor: 'pointer', fontWeight: 700 }}>
            Registrati
          </button>
        </div>
      </header>

      {/* Hero */}
      <main style={{ padding: '4rem 2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🤖</div>
        <h1 style={{ fontSize: 'clamp(2rem, 5vw, 4rem)', fontWeight: 900, marginBottom: '1rem', background: 'linear-gradient(135deg, #7c3aed, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Lara AGENTE AI Aethersy
        </h1>
        <p style={{ fontSize: '1.2rem', color: '#94a3b8', maxWidth: 600, margin: '0 auto 2rem', lineHeight: 1.8 }}>
          L'AI che lavora al posto tuo.<br />
          Ricerca web reale • Email automatizzate • Codice produzione • Finanza live
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => { setTab('register'); setModal(true); }} style={{ padding: '1rem 2.5rem', background: 'linear-gradient(135deg, #7c3aed, #06b6d4)', border: 'none', borderRadius: 12, color: '#fff', fontSize: '1.1rem', fontWeight: 700, cursor: 'pointer' }}>
            🚀 Inizia gratis
          </button>
          <a href={BOT_URL} target="_blank" rel="noopener noreferrer" style={{ padding: '1rem 2.5rem', background: 'rgba(0,136,204,0.2)', border: '1px solid rgba(0,136,204,0.4)', borderRadius: 12, color: '#fff', fontSize: '1.1rem', fontWeight: 700, textDecoration: 'none' }}>
            📱 Telegram Bot
          </a>
        </div>
      </main>

      {/* Features */}
      <section style={{ padding: '4rem 2rem', background: 'rgba(255,255,255,0.02)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: '2rem', fontWeight: 800, marginBottom: '3rem' }}>
            🛠️ 22+ Strumenti AI
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {[
              { icon: '🔍', title: 'Ricerca Web AI', desc: 'Sintesi AI con citazioni verificate' },
              { icon: '💬', title: 'Chat Intelligente', desc: 'Conversa con Lara AI' },
              { icon: '⚡', title: 'Generatore Codice', desc: 'App in 15+ linguaggi' },
              { icon: '📋', title: 'Business Plan AI', desc: 'Piani con KPI e timeline' },
              { icon: '💰', title: 'Strategie Monetizzazione', desc: 'Funnel e pricing strategy' },
              { icon: '📧', title: 'Email Marketing AI', desc: 'Campagne e sequenze' },
              { icon: '🔄', title: 'Funnel Builder AI', desc: 'Landing e automazioni' },
              { icon: '💼', title: 'Trova Lavori Freelance', desc: 'Upwork, Freelancer, LinkedIn' },
              { icon: '📝', title: 'Generatore Contratti', desc: 'Documenti professionali' },
              { icon: '📈', title: 'Finanza & Crypto Live', desc: 'Dati di borsa in tempo reale' },
              { icon: '🧠', title: 'Cervello AI (Wiki)', desc: 'Carica PDF e documenti' },
              { icon: '🖥️', title: 'Terminale AI', desc: '500+ template pronti' },
            ].map(f => (
              <div key={f.title} style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16 }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.8rem' }}>{f.icon}</div>
                <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.1rem', fontWeight: 700 }}>{f.title}</h3>
                <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" style={{ padding: '5rem 2rem' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: '2rem', fontWeight: 800, marginBottom: '3rem' }}>
            Prezzi chiari, nessuna sorpresa
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
            {[
              { name: 'Free', price: '€0', features: ['5 ricerche/giorno', '10 chat AI/giorno', 'Generatore codice base', '50 template terminale'] },
              { name: 'Pro', price: '€29/mese', popular: true, features: ['Ricerche illimitate', 'Chat AI illimitate', 'Email marketing AI', 'Funnel builder', 'Trova lavori freelance', 'Cervello AI (1 GB)'] },
              { name: 'Business', price: '€99/mese', features: ['Tutto di Pro', 'Generatore contratti AI', 'CRM & Lead management', 'Automazioni avanzate', 'Cervello AI (10 GB)', 'API access'] },
            ].map(plan => (
              <div key={plan.name} style={{ padding: '2rem', background: 'rgba(255,255,255,0.03)', border: plan.popular ? '2px solid #7c3aed' : '1px solid rgba(255,255,255,0.08)', borderRadius: 20, position: 'relative' }}>
                {plan.popular && <span style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', padding: '0.25rem 1rem', background: '#7c3aed', borderRadius: 100, fontSize: '0.75rem', fontWeight: 700 }}>⭐ Più popolare</span>}
                <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.3rem', fontWeight: 800 }}>{plan.name}</h3>
                <div style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '1.5rem' }}>{plan.price}</div>
                <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                  {plan.features.map(f => (
                    <li key={f} style={{ padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>✓ {f}</li>
                  ))}
                </ul>
                <button onClick={() => { setTab('register'); setModal(true); }} style={{ width: '100%', marginTop: '1.5rem', padding: '0.75rem', background: plan.popular ? 'linear-gradient(135deg, #7c3aed, #06b6d4)' : 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 10, color: '#fff', fontWeight: 700, cursor: 'pointer' }}>
                  Inizia {plan.name}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Telegram CTA */}
      <section style={{ padding: '4rem 2rem', textAlign: 'center' }}>
        <div style={{ maxWidth: 700, margin: '0 auto', background: 'linear-gradient(135deg, rgba(0,136,204,0.15), rgba(124,58,237,0.15))', border: '1px solid rgba(0,136,204,0.3)', borderRadius: 24, padding: '3rem 2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📱</div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.8rem' }}>Controlla tutto da Telegram</h2>
          <p style={{ color: '#94a3b8', marginBottom: '1.5rem' }}>
            Parla con <strong>@{BOT_USERNAME}</strong> direttamente su Telegram.
          </p>
          <a href={BOT_URL} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', padding: '0.9rem 2rem', background: 'linear-gradient(135deg, #0088cc, #00aaff)', color: '#fff', borderRadius: 12, fontWeight: 700, textDecoration: 'none' }}>
            Apri @{BOT_USERNAME}
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '2rem', color: '#475569', fontSize: '0.85rem', textAlign: 'center' }}>
        <div style={{ marginBottom: '0.5rem' }}>© 2025 Aethersy-AI · Lara AGENTE AI Aethersy</div>
        <div>P.IVA / CF su richiesta · <a href="mailto:aethersyai@gmail.com" style={{ color: '#475569' }}>aethersyai@gmail.com</a></div>
      </footer>

      {/* Auth Modal */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={() => setModal(false)}>
          <div style={{ background: '#0e0e1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: '2rem', width: '100%', maxWidth: 400, position: 'relative' }} onClick={e => e.stopPropagation()}>
            <button onClick={() => setModal(false)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '1.5rem' }}>×</button>

            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <button onClick={() => setTab('login')} style={{ flex: 1, padding: '0.75rem', background: tab === 'login' ? 'rgba(124,58,237,0.2)' : 'transparent', border: 'none', borderRadius: 10, color: tab === 'login' ? '#a78bfa' : '#64748b', fontWeight: 700, cursor: 'pointer' }}>Accedi</button>
              <button onClick={() => setTab('register')} style={{ flex: 1, padding: '0.75rem', background: tab === 'register' ? 'rgba(124,58,237,0.2)' : 'transparent', border: 'none', borderRadius: 10, color: tab === 'register' ? '#a78bfa' : '#64748b', fontWeight: 700, cursor: 'pointer' }}>Registrati</button>
            </div>

            <form onSubmit={handleSubmit}>
              {tab === 'register' && (
                <input style={{ width: '100%', padding: '0.75rem', marginBottom: '0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#fff', fontSize: '1rem' }} placeholder="Nome" value={name} onChange={e => setName(e.target.value)} required />
              )}
              <input type="email" style={{ width: '100%', padding: '0.75rem', marginBottom: '0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#fff', fontSize: '1rem' }} placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
              <input type="password" style={{ width: '100%', padding: '0.75rem', marginBottom: '1.5rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#fff', fontSize: '1rem' }} placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />

              {msg.err && <div style={{ padding: '0.75rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, color: '#f87171', marginBottom: '1rem' }}>{msg.err}</div>}
              {msg.ok && <div style={{ padding: '0.75rem', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 10, color: '#4ade80', marginBottom: '1rem' }}>{msg.ok}</div>}

              <button type="submit" disabled={loading} style={{ width: '100%', padding: '0.75rem', background: 'linear-gradient(135deg, #7c3aed, #06b6d4)', border: 'none', borderRadius: 10, color: '#fff', fontWeight: 700, fontSize: '1rem', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}>
                {loading ? '⏳...' : (tab === 'login' ? 'Accedi' : 'Registrati')}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
