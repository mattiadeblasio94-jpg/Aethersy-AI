import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Sparkles, ArrowRight, Check, ChevronDown, Zap, Brain, Code2, Mail, Search, TrendingUp, Bot, Users, Wand2, FileText, GitBranch, Briefcase, Receipt, Globe, ShoppingBag, BarChart3, Workflow, Microscope, Hash, MessagesSquare } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const tools = [
  { icon: Search, title: "Ricerca Web AI", desc: "Ricerca su internet in tempo reale con sintesi AI e citazioni verificate." },
  { icon: MessagesSquare, title: "Chat Intelligente", desc: "Conversa con Lara AI con memoria persistente multi-sessione." },
  { icon: Code2, title: "Generatore Codice", desc: "Crea app, script, API in 15+ linguaggi, pronti per produzione." },
  { icon: FileText, title: "Business Plan AI", desc: "Plan completi con KPI, timeline e proiezioni economiche." },
  { icon: TrendingUp, title: "Strategie Monetizzazione", desc: "Funnel, pricing, ads, ROAS e scaling per ogni nicchia." },
  { icon: Mail, title: "Email Marketing AI", desc: "Sequenze automatiche, A/B test, analytics. Resend integrato." },
  { icon: GitBranch, title: "Funnel Builder AI", desc: "Landing, email, follow-up e automazioni in un canvas." },
  { icon: Briefcase, title: "Trova Lavori Freelance", desc: "Cerca opportunità su Upwork, Freelancer, LinkedIn (in arrivo)." },
  { icon: Receipt, title: "Generatore Contratti", desc: "Contratti, preventivi e fatture personalizzati (Business)." },
  { icon: BarChart3, title: "Finanza & Crypto Live", desc: "CoinGecko + Yahoo. Dati in tempo reale e analisi tecnica AI." },
  { icon: Brain, title: "Cervello AI (Wiki)", desc: "Carica documenti. Lara impara dai tuoi file e risponde con contesto." },
  { icon: Zap, title: "Terminale AI", desc: "Copilot con tool-calling: shell, file, network. 500+ template." },
  { icon: Hash, title: "SEO & Content AI", desc: "On-page audit, keyword research e articoli ottimizzati (Business)." },
  { icon: Globe, title: "Social Media AI", desc: "Post, reel, hashtag e calendario editoriale per ogni social." },
  { icon: Users, title: "CRM & Lead Management", desc: "Kanban pipeline, follow-up automatici, scoring lead." },
  { icon: ShoppingBag, title: "Invoice & Preventivi", desc: "Fatture professionali. Export PDF e tracciamento." },
  { icon: Bot, title: "Bot Telegram AI", desc: "Controlla tutto da Telegram: ricerche, codice, email, finanza." },
  { icon: Microscope, title: "Ricerca Profonda", desc: "Multi-page scraping + paper accademici in <60s." },
  { icon: Workflow, title: "Automazioni AI", desc: "Workflow 24/7 con webhook, schedulazioni, integrazioni." },
  { icon: BarChart3, title: "Analytics & Report", desc: "Dashboard KPI, report automatici, decisioni data-driven." },
];

const tiers = [
  {
    id: "free", name: "Free", price: "€0", period: "",
    desc: "Inizia a esplorare le funzionalità base.",
    cta: "Inizia gratis",
    features: ["5 ricerche/giorno", "10 chat AI/giorno", "Generatore codice base", "50 template terminale", "Accesso dashboard"],
  },
  {
    id: "pro", name: "Pro", price: "€29", period: "/mese", popular: true,
    desc: "Tutto ciò di cui hai bisogno per lavorare e crescere.",
    cta: "Inizia Pro",
    features: ["Ricerche illimitate", "Chat AI illimitata", "Email marketing AI", "Funnel builder", "Cervello AI 1 GB", "200+ template", "Bot Telegram", "Supporto prioritario"],
  },
  {
    id: "business", name: "Business", price: "€99", period: "/mese",
    desc: "Potenza enterprise per team e aziende.",
    cta: "Inizia Business",
    features: ["Tutto di Pro", "Generatore contratti", "CRM & Lead mgmt", "Automazioni avanzate", "Cervello AI 10 GB", "Template illimitati", "SEO & Content AI", "Analytics", "API access", "Team 5 utenti"],
  },
  {
    id: "enterprise", name: "Enterprise", price: "€299", period: "/mese",
    desc: "Soluzione completa per grandi organizzazioni.",
    cta: "Contattaci",
    features: ["Tutto di Business", "AI autonoma 24/7", "Gmail/Outlook", "White-label", "Cervello AI 100 GB", "Team illimitato", "SLA 99.9%", "Onboarding dedicato", "Account manager"],
  },
];

const faqs = [
  { q: "Posso cancellare in qualsiasi momento?", a: "Sì. Cancelli dalla dashboard in 1 click. Nessuna penale, nessun vincolo." },
  { q: "I dati che carico sono sicuri?", a: "I file caricati nel Cervello AI restano nel tuo workspace privato e cifrati at-rest. Solo Lara vi accede." },
  { q: "L'AI funziona davvero in italiano?", a: "Sì. Lara risponde nella tua lingua automaticamente. Italiano nativo." },
  { q: "Posso integrare con altri strumenti?", a: "Pro: Telegram. Business: API access + webhook. Enterprise: Gmail/Outlook + custom integrations." },
  { q: "Come funziona la ricerca web?", a: "Ricerca in tempo reale + sintesi AI con citazioni. Sources verificate. Nessuna allucinazione." },
];

export default function Landing() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [billing, setBilling] = useState("monthly");
  const [openFaq, setOpenFaq] = useState(null);

  const goPricing = (tierId) => {
    if (tierId === "enterprise") {
      window.location.href = "mailto:hello@aethersy.ai?subject=Aethersy AI Enterprise";
      return;
    }
    const cycleParam = billing === "yearly" ? "&cycle=yearly" : "";
    if (user) nav(`/pricing?tier=${tierId}${cycleParam}`);
    else nav(`/register?tier=${tierId}${cycleParam}`);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white" data-testid="landing-page">
      {/* Top nav */}
      <header className="sticky top-0 z-40 e360-glass border-b border-white/[0.08]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-cyan-400 flex items-center justify-center shadow-[0_0_20px_rgba(0,240,255,0.4)]">
              <Sparkles className="w-4 h-4 text-black" strokeWidth={2.5}/>
            </div>
            <span className="font-bold text-lg" style={{fontFamily:'Cabinet Grotesk'}}>Aethersy AI</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm text-zinc-400">
            <a href="#tools" className="hover:text-white">Strumenti</a>
            <a href="#how" className="hover:text-white">Come funziona</a>
            <a href="#pricing" className="hover:text-white">Prezzi</a>
            <a href="#faq" className="hover:text-white">FAQ</a>
          </nav>
          <div className="flex items-center gap-2">
            {user ? (
              <Link to="/dashboard" className="e360-btn-primary text-sm">Open dashboard</Link>
            ) : (
              <>
                <Link to="/login" className="text-sm text-zinc-400 hover:text-white px-3 py-2">Accedi</Link>
                <Link to="/register" className="e360-btn-primary text-sm">Inizia gratis</Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative grid-bg overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#050505]"/>
        <div className="relative max-w-6xl mx-auto px-6 pt-20 pb-24 text-center">
          <div className="inline-block e360-overline text-cyan-400 mb-4">Sogna · Realizza · Guadagna</div>
          <h1 className="text-5xl md:text-7xl font-bold leading-[1.05] mb-5" style={{fontFamily:'Cabinet Grotesk'}}>
            L'AI che lavora<br/><span className="text-cyan-400">al posto tuo</span>
          </h1>
          <p className="text-zinc-400 text-lg max-w-2xl mx-auto mb-8 leading-relaxed">
            Ricerca web reale · Email automatizzate · Codice produzione · Funnel builder · Finanza live.
            <br/>20+ strumenti AI in un'unica piattaforma per imprenditori seri.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-center">
            <Link to={user ? "/dashboard" : "/register"} className="e360-btn-primary inline-flex items-center gap-2 text-base px-6 py-3" data-testid="hero-cta-btn">
              🚀 {user ? "Apri Dashboard" : "Inizia gratis"} <ArrowRight className="w-4 h-4"/>
            </Link>
            <a href="https://t.me/Lara_Aethersy_AI_bot" target="_blank" rel="noopener noreferrer" className="text-sm border border-white/10 text-zinc-300 px-5 py-3 rounded-md hover:bg-white/5 inline-flex items-center gap-2">
              <Bot className="w-4 h-4 text-cyan-400"/> @Lara_Aethersy_AI_bot
            </a>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6 mt-6 text-xs text-zinc-500">
            <span className="inline-flex items-center gap-1"><Check className="w-3 h-3 text-emerald-400"/> No carta di credito</span>
            <span className="inline-flex items-center gap-1"><Check className="w-3 h-3 text-emerald-400"/> Cancella quando vuoi</span>
            <span className="inline-flex items-center gap-1"><Check className="w-3 h-3 text-emerald-400"/> Setup in 30 secondi</span>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-16 max-w-4xl mx-auto">
            {[
              {v:"20+", l:"Strumenti AI integrati"},
              {v:"500+", l:"Template terminale"},
              {v:"24/7", l:"Sempre operativa"},
              {v:"100%", l:"Dati reali, no simulazioni"},
              {v:"∞", l:"Memoria AI persistente"},
            ].map((s, i) => (
              <div key={i} className="e360-card p-4 text-center">
                <div className="text-3xl font-bold text-cyan-400" style={{fontFamily:'Cabinet Grotesk'}}>{s.v}</div>
                <div className="text-[11px] text-zinc-500 uppercase tracking-wider mt-1">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tools */}
      <section id="tools" className="py-24 max-w-6xl mx-auto px-6">
        <div className="text-center mb-12">
          <div className="e360-overline text-cyan-400 mb-2">🛠️ 20+ Strumenti</div>
          <h2 className="text-4xl md:text-5xl font-bold leading-tight" style={{fontFamily:'Cabinet Grotesk'}}>
            Ogni strumento che ti serve,<br/>in un unico posto
          </h2>
          <p className="text-zinc-500 mt-3">Dalla ricerca web al codice. Strumenti reali per il lavoro quotidiano.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {tools.map((t, i) => (
            <div key={i} className="e360-card e360-card-hover p-5 group" data-testid={`tool-card-${i}`}>
              <div className="w-9 h-9 rounded-md bg-cyan-400/10 border border-cyan-400/30 flex items-center justify-center mb-3 group-hover:bg-cyan-400/20 transition-colors">
                <t.icon className="w-4 h-4 text-cyan-400" strokeWidth={1.5}/>
              </div>
              <h3 className="font-semibold mb-1" style={{fontFamily:'Cabinet Grotesk'}}>{t.title}</h3>
              <p className="text-xs text-zinc-500 leading-relaxed">{t.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-24 bg-[#0a0a0a] border-y border-white/[0.06]">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-12" style={{fontFamily:'Cabinet Grotesk'}}>Come funziona</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {n:"01", icon:"🔐", t:"Registrati gratis", d:"Account in 30 secondi con email o Google. Nessuna carta richiesta."},
              {n:"02", icon:"⚡", t:"Scegli i tuoi strumenti", d:"Dashboard con 20+ strumenti AI per ogni esigenza."},
              {n:"03", icon:"🚀", t:"Lavora e guadagna", d:"Delega le attività ripetitive a Lara. Risparmia ore al giorno."},
            ].map((s, i) => (
              <div key={i} className="e360-card p-6">
                <div className="text-cyan-400 e360-overline mb-2">{s.n}</div>
                <div className="text-3xl mb-2">{s.icon}</div>
                <h3 className="text-xl font-bold mb-2" style={{fontFamily:'Cabinet Grotesk'}}>{s.t}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 max-w-6xl mx-auto px-6">
        <div className="text-center mb-10">
          <h2 className="text-4xl md:text-5xl font-bold mb-3" style={{fontFamily:'Cabinet Grotesk'}}>Prezzi chiari,<br/>nessuna sorpresa</h2>
          <p className="text-zinc-500">Scegli il piano giusto. Aggiorna o cancella quando vuoi.</p>
          <div className="inline-flex bg-black/40 border border-white/10 rounded-md p-0.5 mt-6">
            <button onClick={() => setBilling("monthly")} className={`text-xs px-4 py-1.5 rounded ${billing === "monthly" ? "bg-cyan-400 text-black font-semibold" : "text-zinc-400"}`}>Mensile</button>
            <button onClick={() => setBilling("yearly")} className={`text-xs px-4 py-1.5 rounded ${billing === "yearly" ? "bg-cyan-400 text-black font-semibold" : "text-zinc-400"}`}>Annuale (-20%)</button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {tiers.map((t) => {
            const yearlyAmount = t.id === "pro" ? 278.40 : t.id === "business" ? 950.40 : t.id === "enterprise" ? 2870.40 : 0;
            const showPrice = billing === "yearly" && t.id !== "free" ? `€${yearlyAmount}` : t.price;
            const showPeriod = billing === "yearly" && t.id !== "free" ? "/anno" : t.period;
            const monthlyEq = billing === "yearly" && t.id !== "free" ? `≈ €${(yearlyAmount/12).toFixed(2)}/mese` : null;
            return (
            <div key={t.id} className={`e360-card p-6 flex flex-col ${t.popular ? "border-cyan-400/50 shadow-[0_0_40px_rgba(0,240,255,0.08)] relative" : ""}`} data-testid={`pricing-${t.id}`}>
              {t.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-widest bg-cyan-400 text-black font-bold px-3 py-1 rounded-full">⭐ Più popolare</div>}
              <h3 className="text-xl font-bold" style={{fontFamily:'Cabinet Grotesk'}}>{t.name}</h3>
              <div className="mt-3 mb-1">
                <span className="text-4xl font-bold">{showPrice}</span>
                {showPeriod && <span className="text-zinc-500 text-sm">{showPeriod}</span>}
              </div>
              {monthlyEq && <div className="text-xs text-emerald-400 mb-1">{monthlyEq} · risparmi 20%</div>}
              <p className="text-xs text-zinc-500 mb-5 leading-relaxed">{t.desc}</p>
              <button onClick={() => goPricing(t.id)} className={`w-full text-sm py-2.5 rounded-md font-semibold transition-all ${t.popular ? "bg-cyan-400 text-black hover:bg-cyan-300 shadow-[0_0_20px_rgba(0,240,255,0.25)]" : "bg-white/5 border border-white/10 text-white hover:bg-white/10"}`} data-testid={`pricing-cta-${t.id}`}>
                {t.cta}
              </button>
              <ul className="mt-5 space-y-1.5">
                {t.features.map((f, i) => (
                  <li key={i} className="text-xs text-zinc-300 flex items-start gap-1.5"><Check className="w-3 h-3 text-emerald-400 mt-0.5 shrink-0"/> {f}</li>
                ))}
              </ul>
            </div>
            );
          })}
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-[#0a0a0a] border-y border-white/[0.06]">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-12" style={{fontFamily:'Cabinet Grotesk'}}>Chi usa Aethersy AI ogni giorno</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {s:"★★★★★", t:"Ho risparmiato 15 ore a settimana. La ricerca web AI e il funnel builder hanno triplicato le mie conversioni in 30 giorni.", n:"Marco B.", r:"E-commerce Entrepreneur", e:"👨‍💼"},
              {s:"★★★★★", t:"Finalmente un'AI che capisce il business italiano. Email marketing, SEO e social tutti in un'unica piattaforma. Eccezionale.", n:"Sara M.", r:"Digital Marketer", e:"👩‍💻"},
              {s:"★★★★★", t:"Il generatore di contratti e la ricerca freelance mi hanno fatto trovare 3 nuovi clienti in una settimana. ROI straordinario.", n:"Luca F.", r:"Freelance Developer", e:"🧑‍💻"},
            ].map((c, i) => (
              <div key={i} className="e360-card p-5">
                <div className="text-cyan-400 mb-2">{c.s}</div>
                <p className="text-sm text-zinc-300 leading-relaxed mb-4">"{c.t}"</p>
                <div className="flex items-center gap-2">
                  <div className="text-2xl">{c.e}</div>
                  <div>
                    <div className="text-sm font-semibold">{c.n}</div>
                    <div className="text-[11px] text-zinc-500">{c.r}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Telegram CTA */}
      <section className="py-20 max-w-4xl mx-auto px-6 text-center">
        <div className="text-5xl mb-3">📱</div>
        <h2 className="text-3xl md:text-4xl font-bold mb-3" style={{fontFamily:'Cabinet Grotesk'}}>Controlla tutto da Telegram</h2>
        <p className="text-zinc-400 mb-6">Parla con @Lara_Aethersy_AI_bot. Ricerche, dati, email, codice — tutto in chat, ovunque tu sia.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a href="https://t.me/Lara_Aethersy_AI_bot" target="_blank" rel="noopener noreferrer" className="e360-btn-primary inline-flex items-center gap-2 px-6 py-3">
            <Bot className="w-4 h-4"/> Apri @Lara_Aethersy_AI_bot
          </a>
          <Link to={user ? "/dashboard" : "/register"} className="text-sm border border-white/10 text-zinc-300 px-5 py-3 rounded-md hover:bg-white/5">
            Usa la Dashboard →
          </Link>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 max-w-3xl mx-auto px-6">
        <h2 className="text-4xl font-bold text-center mb-10" style={{fontFamily:'Cabinet Grotesk'}}>Domande frequenti</h2>
        <div className="space-y-2">
          {faqs.map((f, i) => (
            <div key={i} className="e360-card overflow-hidden">
              <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between p-4 text-left text-sm font-medium hover:bg-white/[0.02]">
                <span>{f.q}</span>
                <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform ${openFaq === i ? "rotate-180" : ""}`}/>
              </button>
              {openFaq === i && (
                <div className="px-4 pb-4 text-sm text-zinc-400 leading-relaxed border-t border-white/[0.04] pt-3">{f.a}</div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-24 max-w-4xl mx-auto px-6 text-center">
        <div className="e360-overline text-cyan-400 mb-3">Sogna · Realizza · Guadagna</div>
        <h2 className="text-4xl md:text-5xl font-bold mb-4" style={{fontFamily:'Cabinet Grotesk'}}>
          Inizia oggi a delegare<br/>il lavoro all'AI
        </h2>
        <p className="text-zinc-400 mb-8 max-w-xl mx-auto">Unisciti a centinaia di imprenditori che usano Aethersy AI per scalare il loro business senza assumere.</p>
        <Link to={user ? "/dashboard" : "/register"} className="e360-btn-primary inline-flex items-center gap-2 px-7 py-3.5 text-base" data-testid="bottom-cta-btn">
          🚀 {user ? "Apri Dashboard" : "Crea il tuo account gratis"} <ArrowRight className="w-4 h-4"/>
        </Link>
      </section>

      <footer className="border-t border-white/[0.08] py-8 text-center text-xs text-zinc-600">
        © 2026 Aethersy AI · Powered by Lara
      </footer>
    </div>
  );
}
