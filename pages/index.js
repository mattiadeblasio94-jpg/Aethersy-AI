import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

const BOT_USERNAME = 'Lara_Aethersy_Bot';
const BOT_URL = `https://t.me/${BOT_USERNAME}`;
const OPENCLAW_URL = 'http://47.87.134.105:3000';

// Social Media Links con icone SVG ufficiali
const SOCIAL_ICONS = {
  instagram: (
    <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.644-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.644 1.439-1.44s-.644-1.44-1.439-1.44z"/>
    </svg>
  ),
  facebook: (
    <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  ),
  tiktok: (
    <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
    </svg>
  ),
  linkedin: (
    <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  ),
  twitter: (
    <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.125H5.117z"/>
    </svg>
  ),
  youtube: (
    <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  ),
  reddit: (
    <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
      <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-.25-.499.399-.667a1.25 1.25 0 0 1 1.099-.139zM7.02 15.278c-.781 0-1.414-.633-1.414-1.414 0-.78.633-1.414 1.414-1.414.78 0 1.414.634 1.414 1.414 0 .781-.634 1.414-1.414 1.414zm4.219 2.556c-1.758 0-3.356-.699-4.539-1.832-.27-.254-.285-.676-.032-.946.253-.27.676-.285.946-.032.926.883 2.193 1.424 3.625 1.424 1.431 0 2.698-.541 3.624-1.424.27-.254.693-.238.946.032.253.27.238.692-.032.946-1.183 1.133-2.781 1.832-4.538 1.832zm4.727-3.645c-.781 0-1.414-.633-1.414-1.414 0-.78.633-1.414 1.414-1.414.78 0 1.414.634 1.414 1.414 0 .781-.634 1.414-1.414 1.414zm.417-3.645c-.333.026-.68.051-1.031.051-3.537 0-6.546-1.675-7.936-4.057a.752.752 0 0 0-.664-.406h-1.5a.75.75 0 0 0 0 1.5h.938c.158 2.897 3.054 5.219 6.656 5.219.432 0 .85-.037 1.25-.102V11.5a.75.75 0 0 0 1.5 0v-2.781a.75.75 0 0 0-.213-.519z"/>
    </svg>
  ),
  twitch: (
    <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
      <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"/>
    </svg>
  )
};

const SOCIAL_LINKS = [
  { id: 'instagram', label: 'Instagram', url: 'https://instagram.com' },
  { id: 'facebook', label: 'Facebook', url: 'https://facebook.com' },
  { id: 'tiktok', label: 'TikTok', url: 'https://tiktok.com' },
  { id: 'linkedin', label: 'LinkedIn', url: 'https://linkedin.com' },
  { id: 'twitter', label: 'X/Twitter', url: 'https://twitter.com' },
  { id: 'reddit', label: 'Reddit', url: 'https://reddit.com' },
  { id: 'youtube', label: 'YouTube', url: 'https://youtube.com' },
  { id: 'pinterest', label: 'Pinterest', url: 'https://pinterest.com' },
  { id: 'snapchat', label: 'Snapchat', url: 'https://snapchat.com' },
  { id: 'twitch', label: 'Twitch', url: 'https://twitch.tv' },
];

const LANGUAGES = [
  { code: 'IT', label: 'Italiano', flag: '🇮🇹' },
  { code: 'EN', label: 'English', flag: '🇬🇧' },
  { code: 'ES', label: 'Español', flag: '🇪🇸' },
  { code: 'FR', label: 'Français', flag: '🇫🇷' },
  { code: 'DE', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'PT', label: 'Português', flag: '🇵🇹' },
  { code: 'ZH', label: '中文', flag: '🇨🇳' },
  { code: 'JA', label: '日本語', flag: '🇯🇵' },
];

const TOOLS = [
  { icon: '🔍', title: 'Ricerca Web AI', desc: 'Ricerca su internet in tempo reale con sintesi AI e citazioni verificate. Fonti: Google, Reddit, ArXiv, PubMed.' },
  { icon: '💬', title: 'Chat Intelligente', desc: 'Conversa con Lara AI con memoria persistente e contesto multi-sessione. Risponde, ragiona, esegue.' },
  { icon: '⚡', title: 'Generatore Codice', desc: 'Crea app, script, API e automazioni in 15+ linguaggi. Pronto per la produzione immediata.' },
  { icon: '📋', title: 'Business Plan AI', desc: 'Business plan completo con fasi, KPI, timeline e proiezioni economiche generate dall\'AI.' },
  { icon: '💰', title: 'Strategie Monetizzazione', desc: 'Funnel, pricing strategy, ads, ROAS e scaling per ogni nicchia. Dati reali, tattiche concrete.' },
  { icon: '📧', title: 'Email Marketing AI', desc: 'Scrivi, personalizza e invia campagne email. Sequenze automatiche, A/B test, analytics.' },
  { icon: '🔄', title: 'Funnel Builder AI', desc: 'Crea funnel di vendita completi: landing, email sequence, follow-up e automazioni integrate.' },
  { icon: '💼', title: 'Trova Lavori Freelance', desc: 'Cerca opportunità freelance su Upwork, Freelancer, LinkedIn. Filtra per skill, budget, urgenza.' },
  { icon: '📝', title: 'Generatore Contratti', desc: 'Crea contratti professionali, preventivi e fatture personalizzati per ogni tipo di progetto.' },
  { icon: '📈', title: 'Finanza & Crypto Live', desc: 'Dati di borsa e crypto in tempo reale. Yahoo Finance e CoinGecko integrati. Analisi tecnica AI.' },
  { icon: '🧠', title: 'Cervello AI (Wiki)', desc: 'Carica documenti, PDF, immagini, video. L\'AI impara dai tuoi file e risponde con contesto.' },
  { icon: '🖥️', title: 'Terminale AI', desc: '500+ template per ogni settore. Genera, modifica ed esegui codice nel browser.' },
  { icon: '🔗', title: 'SEO & Content AI', desc: 'Analisi SEO on-page, keyword research, generazione articoli ottimizzati per i motori di ricerca.' },
  { icon: '📱', title: 'Social Media AI', desc: 'Genera post, reel, hashtag e calendario editoriale per tutti i social. Pronto da pubblicare.' },
  { icon: '🎯', title: 'CRM & Lead Management', desc: 'Gestisci prospect, pipeline di vendita, follow-up automatici e scoring dei lead con AI.' },
  { icon: '🏷️', title: 'Invoice & Preventivi', desc: 'Genera fatture professionali e preventivi dettagliati. Export PDF, tracciamento pagamenti.' },
  { icon: '🤖', title: 'Bot Telegram AI', desc: 'Controlla tutto da Telegram. Ricerche, codice, email, dati finanziari — tutto in chat.' },
  { icon: '🔬', title: 'Ricerca Profonda', desc: 'Deep research con scraping multi-pagina, paper accademici e report PDF in meno di 60 secondi.' },
  { icon: '⚙️', title: 'Automazioni AI', desc: 'Crea workflow automatici che lavorano per te 24/7. Integra API esterne, webhook, schedulazioni.' },
  { icon: '📊', title: 'Analytics & Report', desc: 'Dashboard dati, KPI tracking, report automatici. Trasforma dati grezzi in decisioni aziendali.' },
];

const PLANS = [
  {
    id: 'free', name: 'Free', price: 0, annualPrice: 0, color: '#64748b',
    desc: 'Inizia a esplorare le funzionalità base di Aethersy-AI.',
    features: ['5 ricerche/giorno', '10 chat AI/giorno', 'Generatore codice base', 'Template terminale (50)', 'Accesso dashboard'],
    cta: 'Inizia gratis', ctaStyle: 'outline',
  },
  {
    id: 'pro', name: 'Pro', price: 29, annualPrice: 24, color: '#7c3aed',
    badge: 'Più popolare',
    desc: 'Tutto ciò di cui hai bisogno per lavorare e crescere.',
    features: ['Ricerche illimitate', 'Chat AI illimitata', 'Email marketing AI', 'Funnel builder', 'Trova lavori freelance', 'Cervello AI (1 GB)', 'Template terminale (200+)', 'Bot Telegram', 'Supporto prioritario'],
    cta: 'Inizia Pro', ctaStyle: 'primary',
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID,
  },
  {
    id: 'business', name: 'Business', price: 99, annualPrice: 82, color: '#06b6d4',
    desc: 'Potenza enterprise per team e aziende in crescita.',
    features: ['Tutto di Pro', 'Generatore contratti AI', 'CRM & Lead management', 'Automazioni avanzate', 'Cervello AI (10 GB)', 'Template illimitati (500+)', 'SEO & Content AI', 'Analytics avanzate', 'API access', 'Team (5 utenti)'],
    cta: 'Inizia Business', ctaStyle: 'cyan',
    priceId: process.env.NEXT_PUBLIC_STRIPE_BUSINESS_PRICE_ID,
  },
  {
    id: 'enterprise', name: 'Enterprise', price: 299, annualPrice: 249, color: '#10b981',
    desc: 'Soluzione completa per grandi organizzazioni.',
    features: ['Tutto di Business', 'AI autonoma 24/7', 'Integrazione Gmail/Outlook', 'White-label disponibile', 'Cervello AI (100 GB)', 'Team illimitato', 'SLA garantito 99.9%', 'Onboarding dedicato', 'Account manager', 'Custom AI training'],
    cta: 'Contattaci', ctaStyle: 'green',
    priceId: process.env.NEXT_PUBLIC_STRIPE_ENTERPRISE_PRICE_ID,
  },
];

const STEPS = [
  { num: '01', icon: '🔐', title: 'Registrati gratis', desc: 'Crea il tuo account in 30 secondi con email o Google/GitHub. Nessuna carta richiesta per iniziare.' },
  { num: '02', icon: '⚡', title: 'Scegli i tuoi strumenti', desc: 'Accedi alla dashboard. Scegli tra 20+ strumenti AI per ricerca, email, codice, finanza e molto altro.' },
  { num: '03', icon: '🚀', title: 'Lavora e guadagna', desc: 'Delega le attività ripetitive all\'AI. Risparmia ore ogni giorno. Scala il tuo business.' },
];


const FAQS = [
  { q: 'Posso cancellare in qualsiasi momento?', a: 'Sì, nessun vincolo contrattuale. Cancelli quando vuoi direttamente dal pannello account.' },
  { q: 'I dati che carico sono sicuri?', a: 'Tutti i file sono crittografati e archiviati su infrastruttura Vercel/cloud. Non condividiamo mai i tuoi dati.' },
  { q: 'L\'AI funziona davvero in italiano?', a: 'Sì, Lara è ottimizzata per l\'italiano. Risponde, ragiona e genera contenuti in italiano perfetto.' },
  { q: 'Posso integrare con altri strumenti?', a: 'Il piano Business e Enterprise include accesso API per integrare Aethersy-AI con il tuo stack esistente.' },
  { q: 'Come funziona la ricerca web?', a: 'Usiamo Tavily + fonti premium per cercare in tempo reale. L\'AI sintetizza i risultati con citazioni verificabili.' },
];

export default function Home() {
  const router = useRouter();
  const [modal, setModal] = useState(false);
  const [tab, setTab] = useState('login');
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [msg, setMsg] = useState({ err: '', ok: '' });
  const [loading, setLoading] = useState(false);
  const [annual, setAnnual] = useState(false);
  const [faqOpen, setFaqOpen] = useState(null);
  const [checkoutLoading, setCheckoutLoading] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [language, setLanguage] = useState('IT');

  useEffect(() => {
    try {
      const stored = localStorage.getItem('aiforge_user');
      if (stored) setUser(JSON.parse(stored));
    } catch {}
    const params = new URLSearchParams(window.location.search);
    const plan = params.get('plan');
    const loginRequired = params.get('login');
    if (plan && plan !== 'free') { setTab('register'); setModal(true); }
    if (loginRequired === 'required') { setTab('login'); setModal(true); }
  }, []);

  function setField(k, v) { setForm(f => ({ ...f, [k]: v })); setMsg({ err: '', ok: '' }); }

  async function handleAuth(e) {
    e.preventDefault();
    setLoading(true);
    setMsg({ err: '', ok: '' });
    try {
      const endpoint = tab === 'login' ? '/api/auth/login' : '/api/auth/register';
      const body = tab === 'login'
        ? { email: form.email, password: form.password }
        : { name: form.name, email: form.email, password: form.password };
      const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) { setMsg({ err: data.error || 'Errore', ok: '' }); return; }
      if (tab === 'register') {
        const loginRes = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: form.email, password: form.password }) });
        const loginData = await loginRes.json();
        if (loginRes.ok) {
          localStorage.setItem('aiforge_user', JSON.stringify(loginData.user));
          localStorage.setItem('aiforge_token', loginData.token);
          router.push('/dashboard');
          return;
        }
        setMsg({ err: '', ok: '✅ Account creato! Accedi ora.' });
        setTab('login');
        return;
      }
      localStorage.setItem('aiforge_user', JSON.stringify(data.user));
      localStorage.setItem('aiforge_token', data.token);
      setUser(data.user);
      setModal(false);
      router.push('/dashboard');
    } catch { setMsg({ err: 'Errore di rete', ok: '' }); }
    finally { setLoading(false); }
  }

  async function handleCheckout(plan) {
    if (plan.id === 'free') { setTab('register'); setModal(true); return; }
    if (plan.id === 'enterprise') { window.location.href = 'mailto:mattiadeblasio94@gmail.com?subject=Enterprise%20Aethersy-AI'; return; }
    if (!user) { setTab('register'); setModal(true); return; }
    setCheckoutLoading(plan.id);
    try {
      const token = localStorage.getItem('aiforge_token');
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ plan: plan.id, annual }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else alert(data.error || 'Errore checkout');
    } catch { alert('Errore di rete'); }
    finally { setCheckoutLoading(''); }
  }

  function logout() {
    localStorage.removeItem('aiforge_user');
    localStorage.removeItem('aiforge_token');
    setUser(null);
  }

  const planCtaClass = (style) => {
    if (style === 'primary') return 'btn-plan btn-plan-primary';
    if (style === 'cyan') return 'btn-plan btn-plan-cyan';
    if (style === 'green') return 'btn-plan btn-plan-green';
    return 'btn-plan btn-plan-outline';
  };

  return (
    <div style={{ minHeight: '100vh', background: '#060611', color: '#fff', fontFamily: "'Inter', system-ui, sans-serif", overflowX: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        a { text-decoration: none; color: inherit; }
        ::selection { background: rgba(124,58,237,0.4); }
        ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: #060611; } ::-webkit-scrollbar-thumb { background: #7c3aed; border-radius: 3px; }

        @keyframes float { 0%,100% { transform: translateY(0px) rotate(0deg); } 50% { transform: translateY(-20px) rotate(3deg); } }
        @keyframes pulse-glow { 0%,100% { opacity: 0.4; transform: scale(1); } 50% { opacity: 0.7; transform: scale(1.05); } }
        @keyframes gradient-shift { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
        @keyframes slide-up { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes shimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }

        .hero-title { animation: slide-up 0.8s ease both; }
        .hero-sub { animation: slide-up 0.8s ease 0.15s both; }
        .hero-actions { animation: slide-up 0.8s ease 0.3s both; }
        .orb1 { position: absolute; width: 700px; height: 700px; border-radius: 50%; background: radial-gradient(circle, rgba(124,58,237,0.18) 0%, transparent 70%); top: -300px; left: -200px; animation: pulse-glow 6s ease-in-out infinite; pointer-events: none; }
        .orb2 { position: absolute; width: 500px; height: 500px; border-radius: 50%; background: radial-gradient(circle, rgba(6,182,212,0.14) 0%, transparent 70%); top: -100px; right: -100px; animation: pulse-glow 8s ease-in-out infinite 2s; pointer-events: none; }
        .orb3 { position: absolute; width: 400px; height: 400px; border-radius: 50%; background: radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%); bottom: -200px; left: 50%; transform: translateX(-50%); animation: pulse-glow 10s ease-in-out infinite 4s; pointer-events: none; }

        .btn-plan { width: 100%; padding: 0.85rem; border-radius: 10px; font-size: 0.95rem; font-weight: 700; cursor: pointer; transition: all 0.2s; border: none; font-family: inherit; }
        .btn-plan-primary { background: linear-gradient(135deg, #7c3aed, #06b6d4); color: #fff; box-shadow: 0 4px 20px rgba(124,58,237,0.4); }
        .btn-plan-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 30px rgba(124,58,237,0.5); }
        .btn-plan-cyan { background: linear-gradient(135deg, #0891b2, #06b6d4); color: #fff; box-shadow: 0 4px 20px rgba(6,182,212,0.3); }
        .btn-plan-cyan:hover { transform: translateY(-2px); box-shadow: 0 8px 30px rgba(6,182,212,0.4); }
        .btn-plan-green { background: linear-gradient(135deg, #059669, #10b981); color: #fff; box-shadow: 0 4px 20px rgba(16,185,129,0.3); }
        .btn-plan-green:hover { transform: translateY(-2px); }
        .btn-plan-outline { background: transparent; color: #94a3b8; border: 1px solid rgba(255,255,255,0.15); }
        .btn-plan-outline:hover { background: rgba(255,255,255,0.05); color: #fff; }

        .tool-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); border-radius: 16px; padding: 1.5rem; transition: all 0.3s; cursor: pointer; position: relative; overflow: hidden; }
        .tool-card:hover { border-color: rgba(124,58,237,0.4); background: rgba(124,58,237,0.07); transform: translateY(-4px); box-shadow: 0 12px 40px rgba(124,58,237,0.15); }
        .tool-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; background: linear-gradient(90deg, #7c3aed, #06b6d4); opacity: 0; transition: opacity 0.3s; }
        .tool-card:hover::before { opacity: 1; }

        .plan-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 20px; padding: 2rem; position: relative; transition: all 0.3s; }
        .plan-card:hover { transform: translateY(-4px); }
        .plan-featured { border-color: rgba(124,58,237,0.5); background: rgba(124,58,237,0.06); }

        .faq-item { border-bottom: 1px solid rgba(255,255,255,0.07); }
        .faq-q { width: 100%; padding: 1.2rem 0; display: flex; justify-content: space-between; align-items: center; background: none; border: none; color: #f1f5f9; font-size: 1rem; font-weight: 600; cursor: pointer; text-align: left; font-family: inherit; }
        .faq-a { overflow: hidden; transition: max-height 0.3s ease; }

        .nav-link { color: #94a3b8; font-size: 0.9rem; transition: color 0.2s; }
        .nav-link:hover { color: #fff; }
        .shimmer-text { background: linear-gradient(90deg, #7c3aed, #a78bfa, #06b6d4, #a78bfa, #7c3aed); background-size: 200% auto; -webkit-background-clip: text; -webkit-text-fill-color: transparent; animation: shimmer 4s linear infinite; }

        /* Toolbar Styles */
        .toolbar { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 3rem', background: 'rgba(6,6,17,0.95)', borderBottom: '1px solid rgba(124,58,237,0.2)', position: 'sticky', top: 0, zIndex: 101, backdropFilter: 'blur(20px)' }
        .toolbarLeft { display: 'flex', alignItems: 'center', gap: '1rem' }
        .openclawBtn { display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.8rem', background: 'rgba(6,182,212,0.15)', border: '1px solid rgba(6,182,212,0.4)', borderRadius: 8, color: '#22d3ee', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }
        .openclawBtn:hover { background: 'rgba(6,182,212,0.25)' }
        .socialScroll { display: 'flex', gap: '0.8rem', overflowX: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none', padding: '0.3rem 0' }
        .socialScroll::-webkit-scrollbar { display: 'none' }
        .socialBtn { display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.35rem 0.7rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 6, color: '#94a3b8', fontSize: '0.75rem', whiteSpace: 'nowrap', cursor: 'pointer', transition: 'all 0.2s' }
        .socialBtn:hover { background: 'rgba(124,58,237,0.15)', borderColor: 'rgba(124,58,237,0.4)', color: '#a78bfa' }
        .settingsBtn { display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.8rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: '#94a3b8', fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.2s' }
        .settingsBtn:hover { background: 'rgba(124,58,237,0.15)', color: '#a78bfa' }
        .dropdown { position: 'relative' }
        .dropdownMenu { position: 'absolute', top: '100%', right: 0, marginTop: '0.5rem', background: 'rgba(6,6,17,0.98)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '0.8rem', minWidth: '280px', boxShadow: '0 10px 40px rgba(0,0,0,0.4)', zIndex: 102 }
        .langGrid { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.4rem' }
        .langBtn { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem', padding: '0.4rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 6, color: '#94a3b8', fontSize: '0.7rem', cursor: 'pointer', transition: 'all 0.2s' }
        .langBtn:hover, .langBtn.active { background: 'rgba(124,58,237,0.2)', borderColor: 'rgba(124,58,237,0.4)', color: '#a78bfa' }
        .userPanel { marginTop: '0.6rem', paddingTop: '0.6rem', borderTop: '1px solid rgba(255,255,255,0.06)' }
        .userPanel p { fontSize: '0.8rem', color: '#64748b', marginBottom: '0.4rem' }
        .panelBtn { display: 'block', width: '100%', padding: '0.5rem', marginTop: '0.4rem', background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: 6, color: '#a78bfa', fontSize: '0.8rem', textAlign: 'center', cursor: 'pointer' }
      `}</style>

      {/* TOOLBAR */}
      <div className="toolbar">
        <div className="toolbarLeft">
          <a href={OPENCLAW_URL} target="_blank" rel="noopener noreferrer" className="openclawBtn">
            🔗 OpenClaw Gateway
          </a>
          <div className="socialScroll">
            {SOCIAL_LINKS.map(s => (
              <a key={s.id} href={s.url} target="_blank" rel="noopener noreferrer" className="socialBtn">
                {SOCIAL_ICONS[s.id] || SOCIAL_ICONS.instagram} {s.label}
              </a>
            ))}
          </div>
        </div>
        <div className="dropdown">
          <button className="settingsBtn" onClick={() => setSettingsOpen(!settingsOpen)}>
            ⚙️ Impostazioni
          </button>
          {settingsOpen && (
            <div className="dropdownMenu">
              <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.5rem', fontWeight: 600 }}>LINGUA</p>
              <div className="langGrid">
                {LANGUAGES.map(l => (
                  <button key={l.code} className={`langBtn ${language === l.code ? 'active' : ''}`} onClick={() => { setLanguage(l.code); setSettingsOpen(false); }}>
                    <span style={{ fontSize: '1.2rem' }}>{l.flag}</span>
                    <span>{l.code}</span>
                  </button>
                ))}
              </div>
              {user && (
                <div className="userPanel">
                  <p>Account: {user.name}</p>
                  <Link href="/dashboard" className="panelBtn">📊 Dashboard</Link>
                  <Link href="/admin" className="panelBtn">🔧 Admin</Link>
                  <button onClick={logout} className="panelBtn" style={{ background: 'rgba(239,68,68,0.15)', borderColor: 'rgba(239,68,68,0.3)', color: '#f87171' }}>Esci</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* HERO */}
      <section style={{ textAlign: 'center', padding: '7rem 2rem 5rem', position: 'relative', overflow: 'hidden', minHeight: '85vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div className="orb1" />
        <div className="orb2" />
        <div className="orb3" />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 800, margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.3)', color: '#a78bfa', padding: '0.4rem 1.2rem', borderRadius: 100, fontSize: '0.8rem', fontWeight: 600, marginBottom: '2rem' }}>
            🤖 Powered by Ollama · Open Source AI
          </div>
          <div style={{ fontSize: '1.1rem', fontStyle: 'italic', color: '#7c3aed', marginBottom: '1rem', fontWeight: 600, letterSpacing: '0.1em' }}>
            Sogna. Realizza. Guadagna.
          </div>
          <h1 className="hero-title" style={{ fontSize: 'clamp(2.4rem, 6vw, 4.5rem)', fontWeight: 900, lineHeight: 1.05, marginBottom: '1.5rem' }}>
            <span className="shimmer-text">Lara AGENTE AI Aethersy</span>
            <br />
            <span style={{ color: '#f1f5f9' }}>L&apos;AI che lavora</span>
            <br />
            <span style={{ color: '#f1f5f9' }}>al posto tuo</span>
          </h1>
          <p className="hero-sub" style={{ fontSize: '1.15rem', color: '#94a3b8', maxWidth: 580, margin: '0 auto 3rem', lineHeight: 1.75 }}>
            Ricerca web reale • Email automatizzate • Codice produzione • Funnel builder • Freelance finder • Finanza live.<br />
            <strong style={{ color: '#f1f5f9' }}>20+ strumenti AI</strong> in un&apos;unica piattaforma per imprenditori seri.
          </p>
          <div className="hero-actions" style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => { setTab('register'); setModal(true); }} style={{ padding: '1rem 2.5rem', background: 'linear-gradient(135deg, #7c3aed, #06b6d4)', color: '#fff', border: 'none', borderRadius: 14, cursor: 'pointer', fontSize: '1.05rem', fontWeight: 800, fontFamily: 'inherit', boxShadow: '0 4px 30px rgba(124,58,237,0.5)', transition: 'all 0.2s' }}>
              🚀 Inizia gratis →
            </button>
            <Link href="/terminal" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', padding: '1rem 2rem', background: 'rgba(6,182,212,0.15)', border: '1px solid rgba(6,182,212,0.4)', color: '#22d3ee', borderRadius: 14, fontSize: '1rem', fontWeight: 700 }}>
              🖥️ Terminale Live
            </Link>
            <Link href="/marketplace" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', padding: '1rem 2rem', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.4)', color: '#34d399', borderRadius: 14, fontSize: '1rem', fontWeight: 700 }}>
              🤖 Marketplace
            </Link>
          </div>
          <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            {['No carta di credito', 'Cancella quando vuoi', 'Setup in 30 secondi'].map(t => (
              <span key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.82rem', color: '#64748b' }}>
                <span style={{ color: '#10b981' }}>✓</span> {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* STATS */}
      <div style={{ background: 'rgba(255,255,255,0.02)', borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '2.5rem 2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '5rem', flexWrap: 'wrap', maxWidth: 900, margin: '0 auto' }}>
          {[
            { num: '20+', label: 'Strumenti AI integrati' },
            { num: '500+', label: 'Template terminale' },
            { num: '24/7', label: 'Sempre operativa' },
            { num: '100%', label: 'Dati reali, no simulazioni' },
            { num: '∞', label: 'Memoria AI persistente' },
          ].map(s => (
            <div key={s.num} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2.2rem', fontWeight: 900, background: 'linear-gradient(135deg, #7c3aed, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{s.num}</div>
              <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.3rem' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* TOOLS GRID */}
      <section id="tools" style={{ padding: '5rem 2rem', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <div style={{ display: 'inline-block', background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.25)', color: '#a78bfa', padding: '0.35rem 1rem', borderRadius: 100, fontSize: '0.8rem', fontWeight: 600, marginBottom: '1rem' }}>
            🛠️ 20+ Strumenti
          </div>
          <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 900, marginBottom: '1rem' }}>
            Ogni strumento che ti serve,<br /><span style={{ background: 'linear-gradient(135deg, #7c3aed, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>in un unico posto</span>
          </h2>
          <p style={{ color: '#64748b', fontSize: '1.05rem', maxWidth: 500, margin: '0 auto' }}>
            Dalla ricerca web al codice, dall&apos;email al funnel. Strumenti reali per il lavoro quotidiano.
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
          {TOOLS.map(t => (
            <div key={t.title} className="tool-card" onClick={() => user ? router.push('/dashboard') : (setTab('register'), setModal(true))}>
              <div style={{ fontSize: '2rem', marginBottom: '0.8rem' }}>{t.icon}</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.4rem', color: '#f1f5f9' }}>{t.title}</div>
              <div style={{ fontSize: '0.82rem', color: '#64748b', lineHeight: 1.6 }}>{t.desc}</div>
              <div style={{ marginTop: '0.8rem', fontSize: '0.78rem', color: '#7c3aed', fontWeight: 600 }}>Apri →</div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ padding: '5rem 2rem', background: 'rgba(255,255,255,0.015)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', fontWeight: 900, marginBottom: '3.5rem' }}>
            Come funziona
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '2rem' }}>
            {STEPS.map((s, i) => (
              <div key={i} style={{ position: 'relative' }}>
                {i < STEPS.length - 1 && (
                  <div style={{ display: 'none' }} />
                )}
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: '2rem', position: 'relative' }}>
                  <div style={{ position: 'absolute', top: '-14px', left: '1.5rem', background: 'linear-gradient(135deg, #7c3aed, #06b6d4)', color: '#fff', fontSize: '0.7rem', fontWeight: 800, padding: '0.2rem 0.7rem', borderRadius: 100 }}>{s.num}</div>
                  <div style={{ fontSize: '2.5rem', marginBottom: '1rem', marginTop: '0.5rem' }}>{s.icon}</div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.5rem' }}>{s.title}</div>
                  <div style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: 1.7 }}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" style={{ padding: '5rem 2rem' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 900, marginBottom: '1rem' }}>
              Prezzi chiari,<br /><span style={{ background: 'linear-gradient(135deg, #7c3aed, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>nessuna sorpresa</span>
            </h2>
            <p style={{ color: '#64748b', marginBottom: '2rem' }}>Scegli il piano giusto per te. Aggiorna o cancella quando vuoi.</p>
            {/* Annual toggle */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.8rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 100, padding: '0.4rem 1.2rem' }}>
              <span style={{ fontSize: '0.85rem', color: annual ? '#64748b' : '#f1f5f9', fontWeight: annual ? 400 : 600 }}>Mensile</span>
              <button onClick={() => setAnnual(a => !a)} style={{ width: 42, height: 24, background: annual ? '#7c3aed' : 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 100, cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}>
                <div style={{ position: 'absolute', top: 3, left: annual ? 21 : 3, width: 18, height: 18, background: '#fff', borderRadius: '50%', transition: 'left 0.2s' }} />
              </button>
              <span style={{ fontSize: '0.85rem', color: annual ? '#f1f5f9' : '#64748b', fontWeight: annual ? 600 : 400 }}>Annuale</span>
              {annual && <span style={{ fontSize: '0.72rem', background: 'rgba(16,185,129,0.2)', color: '#34d399', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 100, padding: '0.1rem 0.5rem', fontWeight: 700 }}>-17%</span>}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', alignItems: 'start' }}>
            {PLANS.map(plan => (
              <div key={plan.id} className={`plan-card ${plan.badge ? 'plan-featured' : ''}`}
                style={{ border: plan.badge ? '1px solid rgba(124,58,237,0.5)' : '1px solid rgba(255,255,255,0.08)', background: plan.badge ? 'rgba(124,58,237,0.07)' : 'rgba(255,255,255,0.03)' }}>
                {plan.badge && (
                  <div style={{ position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg, #7c3aed, #06b6d4)', color: '#fff', fontSize: '0.72rem', fontWeight: 800, padding: '0.25rem 1rem', borderRadius: 100, whiteSpace: 'nowrap' }}>
                    ⭐ {plan.badge}
                  </div>
                )}
                <div style={{ marginBottom: '1.5rem' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: plan.color, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.4rem' }}>{plan.name}</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.3rem', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '2.5rem', fontWeight: 900, color: '#f1f5f9' }}>
                      €{annual ? plan.annualPrice : plan.price}
                    </span>
                    {plan.price > 0 && <span style={{ color: '#64748b', fontSize: '0.85rem' }}>/mese</span>}
                  </div>
                  {annual && plan.price > 0 && (
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>fatturato annualmente · €{plan.annualPrice * 12}/anno</div>
                  )}
                  <p style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '0.5rem', lineHeight: 1.5 }}>{plan.desc}</p>
                </div>
                <button className={planCtaClass(plan.ctaStyle)} onClick={() => handleCheckout(plan)} disabled={checkoutLoading === plan.id}>
                  {checkoutLoading === plan.id ? '⏳ Caricamento...' : plan.cta}
                </button>
                <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {plan.features.map(f => (
                    <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.83rem', color: '#94a3b8' }}>
                      <span style={{ color: plan.color, flexShrink: 0 }}>✓</span> {f}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TELEGRAM CTA */}
      <section style={{ padding: '5rem 2rem' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', background: 'linear-gradient(135deg, rgba(0,136,204,0.12), rgba(124,58,237,0.12))', border: '1px solid rgba(0,136,204,0.25)', borderRadius: 28, padding: '4rem 3rem', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📱</div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '0.8rem' }}>Controlla tutto da Telegram</h2>
          <p style={{ color: '#94a3b8', marginBottom: '2.5rem', lineHeight: 1.7 }}>
            Parla con <strong style={{ color: '#38bdf8' }}>@{BOT_USERNAME}</strong> direttamente su Telegram.<br />
            Ricerche, dati finanziari, email, codice — tutto in chat, ovunque tu sia.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href={BOT_URL} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', padding: '0.9rem 2rem', background: 'linear-gradient(135deg, #0088cc, #00aaff)', color: '#fff', borderRadius: 14, fontSize: '1rem', fontWeight: 700, textDecoration: 'none', boxShadow: '0 4px 20px rgba(0,136,204,0.4)' }}>
              <TelegramIcon /> Apri @{BOT_USERNAME}
            </a>
            <Link href="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', padding: '0.9rem 2rem', background: 'linear-gradient(135deg, #7c3aed, #06b6d4)', color: '#fff', borderRadius: 14, fontSize: '1rem', fontWeight: 700, boxShadow: '0 4px 20px rgba(124,58,237,0.4)' }}>
              Usa la Dashboard →
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ padding: '5rem 2rem', background: 'rgba(255,255,255,0.015)' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', fontWeight: 900, marginBottom: '3rem', textAlign: 'center' }}>Domande frequenti</h2>
          {FAQS.map((faq, i) => (
            <div key={i} className="faq-item">
              <button className="faq-q" onClick={() => setFaqOpen(faqOpen === i ? null : i)}>
                {faq.q}
                <span style={{ color: '#7c3aed', fontSize: '1.2rem', flexShrink: 0 }}>{faqOpen === i ? '−' : '+'}</span>
              </button>
              <div className="faq-a" style={{ maxHeight: faqOpen === i ? '200px' : '0' }}>
                <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.7, paddingBottom: '1.2rem' }}>{faq.a}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <section style={{ padding: '6rem 2rem', textAlign: 'center' }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <div style={{ fontSize: '1rem', fontStyle: 'italic', color: '#7c3aed', fontWeight: 600, marginBottom: '1rem', letterSpacing: '0.08em' }}>Sogna. Realizza. Guadagna.</div>
          <h2 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 900, marginBottom: '1.5rem', lineHeight: 1.1 }}>
            Inizia oggi a delegare<br />il lavoro all&apos;AI
          </h2>
          <p style={{ color: '#64748b', fontSize: '1.05rem', marginBottom: '3rem', lineHeight: 1.7 }}>
            Unisciti a centinaia di imprenditori che usano Aethersy-AI per risparmiare ore ogni giorno e scalare il loro business.
          </p>
          <button onClick={() => { setTab('register'); setModal(true); }} style={{ padding: '1.1rem 3rem', background: 'linear-gradient(135deg, #7c3aed, #06b6d4)', color: '#fff', border: 'none', borderRadius: 14, cursor: 'pointer', fontSize: '1.1rem', fontWeight: 800, fontFamily: 'inherit', boxShadow: '0 4px 40px rgba(124,58,237,0.5)', display: 'inline-block' }}>
            🚀 Crea il tuo account gratis →
          </button>
          <div style={{ marginTop: '1.5rem', fontSize: '0.8rem', color: '#334155' }}>
            Nessuna carta di credito · Cancella quando vuoi · Setup in 30 secondi
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '3rem 2rem', color: '#334155', fontSize: '0.82rem' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '2rem' }}>
          <div>
            <div style={{ fontSize: '1.1rem', fontWeight: 900, background: 'linear-gradient(135deg, #7c3aed, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '0.5rem' }}>⚡ Aethersy-AI</div>
            <div style={{ color: '#475569' }}>Sogna. Realizza. Guadagna.</div>
          </div>
          <div style={{ display: 'flex', gap: '3rem', flexWrap: 'wrap' }}>
            <div>
              <div style={{ color: '#64748b', fontWeight: 600, marginBottom: '0.8rem', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Prodotto</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <Link href="/dashboard" style={{ color: '#475569', transition: 'color 0.2s' }}>Dashboard</Link>
                <a href="#pricing" style={{ color: '#475569' }}>Prezzi</a>
                <a href={BOT_URL} target="_blank" rel="noopener noreferrer" style={{ color: '#475569' }}>Telegram Bot</a>
              </div>
            </div>
            <div>
              <div style={{ color: '#64748b', fontWeight: 600, marginBottom: '0.8rem', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Account</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <button onClick={() => { setTab('login'); setModal(true); }} style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', fontSize: '0.82rem' }}>Accedi</button>
                <button onClick={() => { setTab('register'); setModal(true); }} style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', fontSize: '0.82rem' }}>Registrati</button>
              </div>
            </div>
          </div>
        </div>
        <div style={{ maxWidth: 1200, margin: '2rem auto 0', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1.5rem', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <span>© 2025 Aethersy-AI · Lara AGENTE AI Aethersy</span>
          <span>P.IVA / CF su richiesta · <a href="mailto:mattiadeblasio94@gmail.com" style={{ color: '#475569' }}>mattiadeblasio94@gmail.com</a></span>
        </div>
      </footer>

      {/* AUTH MODAL */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', backdropFilter: 'blur(8px)' }}
          onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div style={{ background: '#0e0e1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 24, padding: '2.5rem', width: '100%', maxWidth: 420, position: 'relative', boxShadow: '0 20px 80px rgba(0,0,0,0.5)' }}>
            <button onClick={() => setModal(false)} style={{ position: 'absolute', top: '1rem', right: '1.2rem', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '1.5rem', lineHeight: 1 }}>×</button>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.3rem' }}>{tab === 'login' ? 'Bentornato 👋' : 'Crea il tuo account'}</div>
            <div style={{ color: '#64748b', fontSize: '0.88rem', marginBottom: '1.8rem' }}>{tab === 'login' ? 'Accedi ad Aethersy-AI' : 'Sogna. Realizza. Guadagna.'}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1rem' }}>
              <a href="/api/auth/google" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', padding: '0.7rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#f1f5f9', textDecoration: 'none', fontSize: '0.88rem', fontWeight: 600 }}>
                <GoogleIcon /> Continua con Google
              </a>
              <a href="/api/auth/github" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', padding: '0.7rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#f1f5f9', textDecoration: 'none', fontSize: '0.88rem', fontWeight: 600 }}>
                <GitHubIcon /> Continua con GitHub
              </a>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', margin: '0.2rem 0' }}>
                <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
                <span style={{ color: '#475569', fontSize: '0.75rem' }}>o con email</span>
                <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '0.25rem' }}>
              {['login', 'register'].map(t => (
                <button key={t} onClick={() => { setTab(t); setMsg({ err: '', ok: '' }); }} style={{ flex: 1, padding: '0.5rem', textAlign: 'center', border: 'none', background: tab === t ? 'rgba(124,58,237,0.3)' : 'transparent', color: tab === t ? '#a78bfa' : '#64748b', borderRadius: 8, cursor: 'pointer', fontSize: '0.9rem', fontWeight: tab === t ? 600 : 400, fontFamily: 'inherit', transition: 'all 0.2s' }}>
                  {t === 'login' ? 'Accedi' : 'Registrati'}
                </button>
              ))}
            </div>
            <form onSubmit={handleAuth}>
              {tab === 'register' && (
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.4rem', fontWeight: 500 }}>Nome completo</label>
                  <input style={{ width: '100%', padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#fff', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} type="text" placeholder="Mario Rossi" value={form.name} onChange={e => setField('name', e.target.value)} required />
                </div>
              )}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.4rem', fontWeight: 500 }}>Email</label>
                <input style={{ width: '100%', padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#fff', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} type="email" placeholder="mario@esempio.com" value={form.email} onChange={e => setField('email', e.target.value)} required />
              </div>
              <div style={{ marginBottom: '0.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.4rem', fontWeight: 500 }}>Password</label>
                <input style={{ width: '100%', padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#fff', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} type="password" placeholder="Minimo 6 caratteri" value={form.password} onChange={e => setField('password', e.target.value)} required minLength={6} />
              </div>
              {msg.err && <div style={{ color: '#f87171', fontSize: '0.83rem', marginBottom: '0.8rem', textAlign: 'center' }}>{msg.err}</div>}
              {msg.ok && <div style={{ color: '#34d399', fontSize: '0.83rem', marginBottom: '0.8rem', textAlign: 'center' }}>{msg.ok}</div>}
              <button type="submit" disabled={loading} style={{ width: '100%', padding: '0.85rem', background: 'linear-gradient(135deg, #7c3aed, #06b6d4)', color: '#fff', border: 'none', borderRadius: 10, fontSize: '1rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', marginTop: '0.5rem', opacity: loading ? 0.6 : 1 }}>
                {loading ? '⏳ Attendere...' : tab === 'login' ? 'Accedi alla Dashboard' : 'Crea account e accedi'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function GoogleIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>;
}
function GitHubIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/></svg>;
}
function TelegramIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.833.941z"/></svg>;
}
