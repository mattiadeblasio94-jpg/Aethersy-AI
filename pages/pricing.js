import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    priceYear: 0,
    color: '#475569',
    badge: '',
    desc: 'Inizia a esplorare Aethersy-AI',
    features: [
      '5 ricerche web al giorno',
      '20 messaggi chat al giorno',
      'Genera codice (base)',
      'Dati finanziari live',
      '1 progetto attivo',
      'Second Brain (3 pagine)',
    ],
    limits: ['AI Terminal limitato', 'Nessuna email AI', 'Nessuna automazione'],
    cta: 'Inizia gratis',
    ctaHref: '/#register',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 49,
    priceYear: 490,
    color: '#7c3aed',
    badge: '🔥 Più popolare',
    desc: 'Per professionisti e freelance',
    features: [
      '2000 AI generations/mese',
      'Ricerca web illimitata',
      'Chat illimitata con Lara',
      'AI Terminal + 500 template',
      'Genera codice avanzato',
      'Dati finanziari & crypto live',
      'Piano progetti illimitati',
      'Strategie di monetizzazione',
      'Second Brain illimitato',
      'Sessioni di lavoro salvabili',
      'Voce su Telegram (STT + TTS)',
      'API access',
    ],
    limits: [],
    cta: 'Attiva Pro',
    ctaHref: null,
  },
  {
    id: 'business',
    name: 'Business',
    price: 199,
    priceYear: 1990,
    color: '#06b6d4',
    badge: '⭐ Completo',
    desc: 'Per team e aziende in crescita',
    features: [
      '10000 AI generations/mese',
      'Tutto di Pro',
      'Email AI (componi + invia)',
      'Sequenze email automatiche',
      'Workflow automations',
      'Lead management avanzato',
      'Admin Panel completo',
      '5 utenti team inclusi',
      'Supporto prioritario',
      'Integrazioni webhook',
      'Export dati e report',
      'Custom workflows',
    ],
    limits: [],
    cta: 'Attiva Business',
    ctaHref: null,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: null,
    priceYear: null,
    color: '#f59e0b',
    badge: '🏆 Premium',
    desc: 'Per aziende strutturate',
    features: [
      'AI generations illimitate',
      'Tutto di Business',
      'White label + dominio custom',
      'API dedicato con custom models',
      'Utenti illimitati',
      'SAML/SSO integration',
      'SLA 99.9% uptime',
      'Supporto dedicato 24/7',
      'Onboarding personalizzato',
      'Integrazioni custom',
      'Contratto enterprise',
      'Fatturazione aziendale',
      'Dedicated instance',
    ],
    limits: [],
    cta: 'Contattaci',
    ctaHref: 'mailto:mattiadeblasio94@gmail.com?subject=Aethersy-AI Enterprise',
  },
];

const COMPARE = [
  { feature: 'Ricerca web', free: '5/giorno', pro: '∞', biz: '∞', ent: '∞' },
  { feature: 'AI Chat', free: '20/giorno', pro: '∞', biz: '∞', ent: '∞' },
  { feature: 'AI Terminal', free: '3/giorno', pro: '∞', biz: '∞', ent: '∞' },
  { feature: 'Genera codice', free: '✓ base', pro: '✓ avanzato', biz: '✓ avanzato', ent: '✓ avanzato' },
  { feature: 'Email AI', free: '✗', pro: '✗', biz: '✓', ent: '✓' },
  { feature: 'Workflow automations', free: '✗', pro: '✗', biz: '✓', ent: '✓' },
  { feature: 'Team utenti', free: '1', pro: '1', biz: '3', ent: '∞' },
  { feature: 'API Access', free: '✗', pro: '✗', biz: '✗', ent: '✓' },
  { feature: 'White label', free: '✗', pro: '✗', biz: '✗', ent: '✓' },
  { feature: 'Supporto', free: 'Community', pro: 'Email', biz: 'Prioritario', ent: 'Dedicato 24/7' },
];

export default function Pricing() {
  const router = useRouter();
  const [annual, setAnnual] = useState(false);

  async function handleCta(plan) {
    if (plan.id === 'free') { router.push('/'); return; }
    if (plan.ctaHref) { window.location.href = plan.ctaHref; return; }

    // Check if user is logged in
    const token = localStorage.getItem('aiforge_token');
    const user = JSON.parse(localStorage.getItem('aiforge_user') || '{}');

    if (!token || !user.email) {
      // Redirect to registration with plan pre-selected
      router.push(`/?plan=${plan.id}&action=register`);
      return;
    }

    // User is logged in - proceed to Stripe checkout
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          plan: plan.id,
          annual: annual
        })
      });

      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        alert('Errore: ' + (data.error || 'Impossibile procedere al pagamento'));
      }
    } catch (e) {
      alert('Errore di connessione. Riprova più tardi.');
    }
  }

  return (
    <div style={S.root}>
      {/* Nav */}
      <nav style={S.nav}>
        <Link href="/" style={S.logo}>⚡ Aethersy-AI</Link>
        <div style={{ display: 'flex', gap: '1.2rem', alignItems: 'center' }}>
          <Link href="/dashboard" style={S.navLink}>Dashboard</Link>
          <Link href="/" style={S.navBtn}>Accedi</Link>
        </div>
      </nav>

      {/* Hero */}
      <div style={S.hero}>
        <div style={S.motto}>Sogna, Realizza, Guadagna.</div>
        <h1 style={S.heroTitle}>Scegli il tuo piano</h1>
        <p style={S.heroSub}>Prezzi trasparenti. Nessuna sorpresa. Cancella quando vuoi.</p>

        {/* Annual toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginTop: '1.5rem' }}>
          <span style={{ color: annual ? '#64748b' : '#f1f5f9', fontSize: '0.9rem' }}>Mensile</span>
          <button style={{ ...S.toggle, background: annual ? '#7c3aed' : 'rgba(255,255,255,0.1)' }} onClick={() => setAnnual(a => !a)}>
            <div style={{ width: 18, height: 18, background: '#fff', borderRadius: '50%', transition: 'transform 0.2s', transform: annual ? 'translateX(20px)' : 'translateX(2px)', marginTop: 2 }} />
          </button>
          <span style={{ color: annual ? '#f1f5f9' : '#64748b', fontSize: '0.9rem' }}>
            Annuale <span style={{ background: 'rgba(16,185,129,0.2)', color: '#34d399', borderRadius: 6, padding: '0.1rem 0.4rem', fontSize: '0.75rem', fontWeight: 700 }}>-17%</span>
          </span>
        </div>
      </div>

      {/* Plans grid */}
      <div style={S.plansGrid}>
        {PLANS.map(plan => (
          <div key={plan.id} style={{ ...S.planCard, borderColor: plan.id === 'pro' ? plan.color : 'rgba(255,255,255,0.08)', boxShadow: plan.id === 'pro' ? `0 0 40px ${plan.color}30` : 'none' }}>
            {plan.badge && <div style={{ ...S.badge, background: `${plan.color}25`, color: plan.color }}>{plan.badge}</div>}
            <div style={{ color: plan.color, fontWeight: 800, fontSize: '1rem', marginBottom: '0.3rem' }}>{plan.name}</div>
            <div style={{ color: '#64748b', fontSize: '0.82rem', marginBottom: '1.2rem' }}>{plan.desc}</div>
            <div style={{ marginBottom: '1.5rem' }}>
              {plan.price === 0 ? (
                <span style={{ fontSize: '2.4rem', fontWeight: 900 }}>Gratis</span>
              ) : (
                <>
                  <span style={{ fontSize: '2.4rem', fontWeight: 900 }}>€{annual ? Math.round(plan.priceYear / 12) : plan.price}</span>
                  <span style={{ color: '#64748b', fontSize: '0.85rem' }}>/mese</span>
                  {annual && <div style={{ color: '#34d399', fontSize: '0.75rem', marginTop: '0.2rem' }}>€{plan.priceYear}/anno</div>}
                </>
              )}
            </div>
            <button
              style={{ ...S.cta, background: plan.id === 'free' ? 'rgba(255,255,255,0.06)' : `linear-gradient(135deg,${plan.color},${plan.id === 'pro' ? '#06b6d4' : plan.color}cc)` }}
              onClick={() => handleCta(plan)}>
              {plan.cta}
            </button>
            <div style={{ marginTop: '1.5rem' }}>
              {plan.features.map(f => (
                <div key={f} style={S.feature}><span style={{ color: plan.color }}>✓</span> {f}</div>
              ))}
              {plan.limits.map(l => (
                <div key={l} style={{ ...S.feature, color: '#475569' }}><span>✗</span> {l}</div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Comparison table */}
      <div style={S.compareWrap}>
        <h2 style={S.compareTitle}>Confronto completo</h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={S.table}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.04)' }}>
                <th style={{ ...S.th, textAlign: 'left' }}>Funzione</th>
                <th style={S.th}>Free</th>
                <th style={{ ...S.th, color: '#a78bfa' }}>Pro</th>
                <th style={{ ...S.th, color: '#38bdf8' }}>Business</th>
                <th style={{ ...S.th, color: '#fbbf24' }}>Enterprise</th>
              </tr>
            </thead>
            <tbody>
              {COMPARE.map(row => (
                <tr key={row.feature} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ ...S.td, fontWeight: 500, color: '#cbd5e1' }}>{row.feature}</td>
                  <td style={S.tdCenter}><CmpVal v={row.free} /></td>
                  <td style={S.tdCenter}><CmpVal v={row.pro} color="#a78bfa" /></td>
                  <td style={S.tdCenter}><CmpVal v={row.biz} color="#38bdf8" /></td>
                  <td style={S.tdCenter}><CmpVal v={row.ent} color="#fbbf24" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* FAQ */}
      <div style={S.faqWrap}>
        <h2 style={S.compareTitle}>Domande frequenti</h2>
        <div style={S.faqGrid}>
          {[
            ['Posso cambiare piano?', 'Sì, puoi fare upgrade o downgrade in qualsiasi momento. La differenza viene calcolata pro-rata.'],
            ['Come funziona il pagamento?', 'Pagamento sicuro tramite Stripe. Puoi usare carta di credito o SEPA. Nessun costo nascosto.'],
            ['Posso cancellare?', 'Sì, puoi cancellare quando vuoi dal pannello account. Non ci sono vincoli contrattuali.'],
            ['Cosa succede ai miei dati?', 'I tuoi dati sono salvati in modo sicuro e non vengono condivisi. Puoi esportarli in qualsiasi momento.'],
            ['Offrite sconti per startup?', 'Sì, contattaci per sconti startup, ONG e università.'],
            ['Il piano Free è davvero gratis?', 'Sì, nessuna carta di credito richiesta. Puoi usare Aethersy-AI gratis per sempre con i limiti indicati.'],
          ].map(([q, a]) => (
            <div key={q} style={S.faqCard}>
              <div style={{ fontWeight: 700, marginBottom: '0.5rem', color: '#e2e8f0' }}>{q}</div>
              <div style={{ color: '#64748b', fontSize: '0.85rem', lineHeight: 1.6 }}>{a}</div>
            </div>
          ))}
        </div>
      </div>

      <footer style={{ textAlign: 'center', padding: '2rem', color: '#334155', fontSize: '0.82rem' }}>
        © 2025 Aethersy-AI · Sogna, Realizza, Guadagna. ·{' '}
        <Link href="/" style={{ color: '#7c3aed' }}>Home</Link>{' · '}
        <Link href="/dashboard" style={{ color: '#06b6d4' }}>Dashboard</Link>
      </footer>
    </div>
  );
}

function CmpVal({ v, color }) {
  if (v === '✓' || v === '∞') return <span style={{ color: color || '#34d399', fontWeight: 700 }}>{v}</span>;
  if (v === '✗') return <span style={{ color: '#475569' }}>✗</span>;
  return <span style={{ color: color || '#94a3b8', fontSize: '0.82rem' }}>{v}</span>;
}

const S = {
  root: { background: '#0a0a0f', color: '#f1f5f9', minHeight: '100vh', fontFamily: "'Inter', system-ui, sans-serif" },
  nav: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 2rem', borderBottom: '1px solid rgba(255,255,255,0.07)', position: 'sticky', top: 0, background: '#0a0a0f', zIndex: 10 },
  logo: { fontWeight: 900, fontSize: '1.1rem', background: 'linear-gradient(135deg,#7c3aed,#06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', textDecoration: 'none' },
  navLink: { color: '#64748b', textDecoration: 'none', fontSize: '0.88rem' },
  navBtn: { background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.3)', color: '#a78bfa', borderRadius: 8, padding: '0.4rem 1rem', fontSize: '0.85rem', textDecoration: 'none', fontWeight: 600 },
  hero: { textAlign: 'center', padding: '5rem 2rem 3rem' },
  motto: { color: '#7c3aed', fontSize: '0.9rem', fontStyle: 'italic', marginBottom: '1rem', letterSpacing: '0.05em' },
  heroTitle: { fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 900, margin: '0 0 0.6rem' },
  heroSub: { color: '#64748b', fontSize: '1rem' },
  toggle: { width: 44, height: 24, borderRadius: 100, border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', display: 'flex', alignItems: 'center' },
  plansGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', maxWidth: 1100, margin: '0 auto', padding: '0 2rem 3rem' },
  planCard: { background: 'rgba(255,255,255,0.03)', border: '1px solid', borderRadius: 20, padding: '1.8rem', position: 'relative' },
  badge: { position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', padding: '0.2rem 0.8rem', borderRadius: 100, fontSize: '0.73rem', fontWeight: 700, whiteSpace: 'nowrap' },
  cta: { width: '100%', border: 'none', borderRadius: 12, padding: '0.85rem', fontWeight: 700, cursor: 'pointer', color: '#fff', fontSize: '0.92rem', fontFamily: 'inherit', transition: 'opacity 0.15s' },
  feature: { display: 'flex', gap: '0.5rem', padding: '0.3rem 0', fontSize: '0.82rem', color: '#94a3b8', alignItems: 'flex-start' },
  compareWrap: { maxWidth: 1000, margin: '0 auto', padding: '3rem 2rem' },
  compareTitle: { fontSize: '1.5rem', fontWeight: 800, textAlign: 'center', marginBottom: '2rem' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' },
  th: { padding: '0.8rem 1rem', textAlign: 'center', color: '#94a3b8', fontWeight: 700, fontSize: '0.82rem' },
  td: { padding: '0.75rem 1rem', color: '#64748b' },
  tdCenter: { padding: '0.75rem 1rem', textAlign: 'center' },
  faqWrap: { maxWidth: 900, margin: '0 auto', padding: '0 2rem 5rem' },
  faqGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px,1fr))', gap: '1.2rem' },
  faqCard: { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '1.2rem' },
};
