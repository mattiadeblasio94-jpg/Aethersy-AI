/**
 * MARKETPLACE - Scopri e installa agenti AI pre-configurati
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

const AGENTS = [
  {
    id: 'seo-master',
    name: 'SEO Master',
    icon: '🔍',
    category: 'Marketing',
    price: 'Free',
    rating: 4.8,
    users: '2.3k',
    desc: 'Analisi SEO completa, keyword research, ottimizzazione on-page e report automatici.',
    features: ['Audit SEO automatico', 'Keyword research AI', 'Ottimizzazione contenuti', 'Report PDF'],
    color: '#10b981'
  },
  {
    id: 'email-pro',
    name: 'Email Pro',
    icon: '📧',
    category: 'Marketing',
    price: 'Free',
    rating: 4.9,
    users: '5.1k',
    desc: 'Scrivi email professionali, sequenze di nurturing e campagne automatizzate.',
    features: ['Template professionali', 'Sequenze automatiche', 'A/B testing AI', 'Analytics'],
    color: '#3b82f6'
  },
  {
    id: 'code-assistant',
    name: 'Code Assistant',
    icon: '⚡',
    category: 'Sviluppo',
    price: 'Pro',
    rating: 4.7,
    users: '8.2k',
    desc: 'Genera codice production-ready in 15+ linguaggi. Debug, refactoring e testing.',
    features: ['Multi-linguaggio', 'Debug AI', 'Unit test auto', 'Code review'],
    color: '#8b5cf6'
  },
  {
    id: 'business-analyst',
    name: 'Business Analyst',
    icon: '📊',
    category: 'Business',
    price: 'Pro',
    rating: 4.6,
    users: '1.8k',
    desc: 'Business plan, analisi di mercato, proiezioni finanziarie e strategie di growth.',
    features: ['Business plan AI', 'Analisi competitor', 'Financial projections', 'Growth strategy'],
    color: '#f59e0b'
  },
  {
    id: 'social-manager',
    name: 'Social Manager',
    icon: '📱',
    category: 'Marketing',
    price: 'Free',
    rating: 4.5,
    users: '3.4k',
    desc: 'Genera post, reel, hashtag e calendario editoriale per tutti i social.',
    features: ['Multi-platform', 'Hashtag AI', 'Content calendar', 'Analytics'],
    color: '#ec4899'
  },
  {
    id: 'finance-tracker',
    name: 'Finance Tracker',
    icon: '📈',
    category: 'Finance',
    price: 'Pro',
    rating: 4.8,
    users: '2.9k',
    desc: 'Monitoraggio mercati, crypto, azioni. Analisi tecnica AI e segnali trading.',
    features: ['Real-time data', 'Technical analysis', 'Price alerts', 'Portfolio tracking'],
    color: '#14b8a6'
  },
  {
    id: 'content-writer',
    name: 'Content Writer',
    icon: '✍️',
    category: 'Content',
    price: 'Free',
    rating: 4.7,
    users: '6.5k',
    desc: 'Articoli blog, copywriting, landing page e contenuti SEO-optimized.',
    features: ['SEO writing', 'Multi-format', 'Tone adjustment', 'Plagiarism check'],
    color: '#06b6d4'
  },
  {
    id: 'legal-assistant',
    name: 'Legal Assistant',
    icon: '⚖️',
    category: 'Business',
    price: 'Business',
    rating: 4.9,
    users: '890',
    desc: 'Contratti, termini di servizio, privacy policy e documenti legali.',
    features: ['Contract generator', 'GDPR compliant', 'Multi-language', 'Legal review'],
    color: '#6366f1'
  },
  {
    id: 'hr-recruiter',
    name: 'HR Recruiter',
    icon: '👥',
    category: 'Business',
    price: 'Business',
    rating: 4.6,
    users: '1.2k',
    desc: 'Screening CV, job description, interview questions e candidate matching.',
    features: ['CV parsing', 'Job matching', 'Interview AI', 'Onboarding'],
    color: '#f97316'
  },
  {
    id: 'data-analyst',
    name: 'Data Analyst',
    icon: '📊',
    category: 'Analytics',
    price: 'Pro',
    rating: 4.8,
    users: '2.1k',
    desc: 'Analisi dati, dashboard, report automatici e insight AI-driven.',
    features: ['Data visualization', 'Auto insights', 'Custom dashboards', 'Export formats'],
    color: '#84cc16'
  },
];

const CATEGORIES = ['Tutti', 'Marketing', 'Sviluppo', 'Business', 'Finance', 'Content', 'Analytics'];

export default function MarketplacePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [filter, setFilter] = useState('Tutti');
  const [search, setSearch] = useState('');
  const [selectedAgent, setSelectedAgent] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem('aiforge_user');
    if (!stored) {
      router.push('/?login=required');
      return;
    }
    setUser(JSON.parse(stored));
  }, []);

  const filteredAgents = AGENTS.filter(agent => {
    const matchesCategory = filter === 'Tutti' || agent.category === filter;
    const matchesSearch = agent.name.toLowerCase().includes(search.toLowerCase()) ||
                          agent.desc.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  function handleInstall(agent) {
    if (!user) {
      router.push('/?login=required');
      return;
    }
    // Check plan requirements
    if (agent.price === 'Pro' && user.plan !== 'pro' && user.plan !== 'business' && user.plan !== 'enterprise') {
      alert('Questo agente richiede un piano Pro o superiore. Vuoi fare upgrade?');
      router.push('/pricing');
      return;
    }
    if (agent.price === 'Business' && user.plan !== 'business' && user.plan !== 'enterprise') {
      alert('Questo agente richiede un piano Business o Enterprise. Vuoi fare upgrade?');
      router.push('/pricing');
      return;
    }
    alert(`✅ ${agent.name} installato con successo! Ora puoi usarlo dalla dashboard.`);
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', color: '#f1f5f9', fontFamily: 'system-ui' }}>
      {/* Header */}
      <header style={{ padding: '1rem 2rem', background: '#0d0d16', borderBottom: '1px solid rgba(124,58,237,0.3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontSize: '2rem' }}>🤖</span>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800 }}>AI Marketplace</h1>
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>Scopri e installa agenti AI pre-configurati</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={() => router.push('/dashboard')} style={{ padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#94a3b8', cursor: 'pointer' }}>
            ← Dashboard
          </button>
          <button onClick={() => router.push('/skills')} style={{ padding: '0.5rem 1rem', background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: 8, color: '#a78bfa', cursor: 'pointer' }}>
            🎯 Skills Hub
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
        {/* Filters */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '250px' }}>
            <input
              style={{ width: '100%', padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#fff', fontSize: '1rem', outline: 'none' }}
              placeholder="Cerca agenti..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                style={{
                  padding: '0.5rem 1rem',
                  background: filter === cat ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.05)',
                  border: filter === cat ? '1px solid rgba(124,58,237,0.4)' : '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 100,
                  color: filter === cat ? '#a78bfa' : '#94a3b8',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Agents Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {filteredAgents.map(agent => (
            <div
              key={agent.id}
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: `1px solid ${agent.color}40`,
                borderRadius: 16,
                padding: '1.5rem',
                transition: 'all 0.3s',
                cursor: 'pointer'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.borderColor = agent.color;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = `${agent.color}40`;
              }}
              onClick={() => setSelectedAgent(agent)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div style={{ fontSize: '2.5rem' }}>{agent.icon}</div>
                <span style={{
                  padding: '0.25rem 0.75rem',
                  background: `${agent.color}20`,
                  color: agent.color,
                  borderRadius: 100,
                  fontSize: '0.7rem',
                  fontWeight: 700
                }}>
                  {agent.price}
                </span>
              </div>

              <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.1rem', fontWeight: 700 }}>{agent.name}</h3>
              <p style={{ margin: '0 0 1rem', color: '#64748b', fontSize: '0.85rem', lineHeight: 1.5 }}>{agent.desc}</p>

              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', fontSize: '0.8rem', color: '#94a3b8' }}>
                <span>⭐ {agent.rating}</span>
                <span>👥 {agent.users}</span>
                <span style={{ color: agent.color }}>{agent.category}</span>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1rem' }}>
                {agent.features.slice(0, 3).map(f => (
                  <span key={f} style={{
                    padding: '0.2rem 0.5rem',
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: 6,
                    fontSize: '0.7rem',
                    color: '#94a3b8'
                  }}>
                    {f}
                  </span>
                ))}
              </div>

              <button
                onClick={() => handleInstall(agent)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: `linear-gradient(135deg, ${agent.color}, ${agent.color}99)`,
                  border: 'none',
                  borderRadius: 10,
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: 'pointer'
                }}
              >
                {agent.price === 'Free' ? '✅ Installa Gratis' : `🔓 Sblocca ${agent.price}`}
              </button>
            </div>
          ))}
        </div>

        {filteredAgents.length === 0 && (
          <div style={{ textAlign: 'center', padding: '4rem 2rem', color: '#64748b' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
            <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.2rem' }}>Nessun agente trovato</h3>
            <p>Prova a cambiare i filtri o la ricerca</p>
          </div>
        )}
      </main>

      {/* Agent Detail Modal */}
      {selectedAgent && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.85)',
          zIndex: 500,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          backdropFilter: 'blur(8px)'
        }} onClick={() => setSelectedAgent(null)}>
          <div style={{
            background: '#0e0e1a',
            border: `1px solid ${selectedAgent.color}`,
            borderRadius: 24,
            padding: '2.5rem',
            width: '100%',
            maxWidth: 560,
            position: 'relative',
            maxHeight: '90vh',
            overflowY: 'auto'
          }} onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedAgent(null)} style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              background: 'none',
              border: 'none',
              color: '#64748b',
              cursor: 'pointer',
              fontSize: '1.5rem'
            }}>×</button>

            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{selectedAgent.icon}</div>
            <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.5rem', fontWeight: 800 }}>{selectedAgent.name}</h2>
            <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>{selectedAgent.desc}</p>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
              <span style={{ padding: '0.35rem 0.75rem', background: `${selectedAgent.color}20`, color: selectedAgent.color, borderRadius: 100, fontSize: '0.8rem', fontWeight: 700 }}>
                {selectedAgent.category}
              </span>
              <span style={{ padding: '0.35rem 0.75rem', background: 'rgba(255,255,255,0.1)', color: '#fff', borderRadius: 100, fontSize: '0.8rem' }}>
                ⭐ {selectedAgent.rating}
              </span>
              <span style={{ padding: '0.35rem 0.75rem', background: 'rgba(255,255,255,0.1)', color: '#fff', borderRadius: 100, fontSize: '0.8rem' }}>
                👥 {selectedAgent.users} utenti
              </span>
            </div>

            <h3 style={{ margin: '0 0 1rem', fontSize: '0.9rem', fontWeight: 700, color: '#a78bfa', textTransform: 'uppercase' }}>Feature incluse:</h3>
            <ul style={{ margin: '0 0 1.5rem', paddingLeft: '1.5rem', color: '#cbd5e1', lineHeight: 2 }}>
              {selectedAgent.features.map(f => (
                <li key={f} style={{ fontSize: '0.9rem' }}>{f}</li>
              ))}
            </ul>

            <button
              onClick={() => handleInstall(selectedAgent)}
              style={{
                width: '100%',
                padding: '1rem',
                background: `linear-gradient(135deg, ${selectedAgent.color}, ${selectedAgent.color}99)`,
                border: 'none',
                borderRadius: 12,
                color: '#fff',
                fontWeight: 800,
                fontSize: '1rem',
                cursor: 'pointer'
              }}
            >
              {selectedAgent.price === 'Free' ? '✅ Installa Ora' : `🔓 Sblocca per Piano ${selectedAgent.price}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
