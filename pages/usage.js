/**
 * USAGE DASHBOARD - Monitora crediti, token e consumi
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

const PLANS_INFO = {
  free: { name: 'Free', color: '#64748b', price: 0 },
  pro: { name: 'Pro', color: '#00ff88', price: 29 },
  business: { name: 'Business', color: '#3b82f6', price: 99 },
  enterprise: { name: 'Enterprise', color: '#8b5cf6', price: 499 }
};

export default function UsageDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem('aiforge_user');
    if (!stored) {
      router.push('/');
      return;
    }
    const user = JSON.parse(stored);
    setUserId(user.id || user.email || 'anon');
    loadStats(user.id || user.email);
  }, []);

  async function loadStats(uid) {
    setLoading(true);
    try {
      const res = await fetch(`/api/usage/stats?userId=${encodeURIComponent(uid)}`);
      const data = await res.json();
      if (data.success) setStats(data);
    } catch (e) {
      console.error('Error loading stats:', e);
    }
    setLoading(false);
  }

  if (loading || !stats) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '10px' }}>⏳</div>
          <p>Caricamento statistiche...</p>
        </div>
      </div>
    );
  }

  const planColor = PLANS_INFO[stats.plan]?.color || '#666';
  const planName = PLANS_INFO[stats.plan]?.name || stats.plan;

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#fff', fontFamily: 'system-ui' }}>
      {/* Header */}
      <header style={{
        padding: '20px',
        background: '#111',
        borderBottom: '1px solid #333',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', color: planColor }}>📊 Usage Dashboard</h1>
          <p style={{ margin: '5px 0 0', color: '#888' }}>Piano attuale: <strong style={{ color: planColor }}>{planName}</strong></p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => router.push('/dashboard')}
            style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #333', background: '#222', color: '#fff', cursor: 'pointer' }}
          >
            ← Dashboard
          </button>
          <button
            onClick={() => router.push('/pricing')}
            style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#00ff88', color: '#000', fontWeight: 'bold', cursor: 'pointer' }}
          >
            ⬆ Upgrade
          </button>
        </div>
      </header>

      <main style={{ padding: '30px', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Credits Card */}
        <div style={{
          padding: '25px',
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
          borderRadius: '16px',
          border: `1px solid ${planColor}`,
          marginBottom: '20px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ margin: 0, fontSize: '1.2rem' }}>💳 Crediti Disponibili</h2>
            <span style={{ fontSize: '2rem', fontWeight: 'bold', color: planColor }}>
              ${stats.creditsRemaining?.toFixed(2) || '0.00'}
            </span>
          </div>

          {/* Progress Bar */}
          <div style={{ marginBottom: '15px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '0.9rem' }}>
              <span style={{ color: '#888' }}>Utilizzati questo mese</span>
              <span style={{ color: '#fff' }}>{stats.creditsUsedPercent || 0}%</span>
            </div>
            <div style={{ height: '10px', background: '#333', borderRadius: '5px', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${Math.min(stats.creditsUsedPercent || 0, 100)}%`,
                  background: `linear-gradient(90deg, ${planColor}, #00ff88)`,
                  transition: 'width 0.3s'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px', marginTop: '20px' }}>
            <div style={{ padding: '15px', background: '#222', borderRadius: '10px' }}>
              <div style={{ fontSize: '0.8rem', color: '#888' }}>Crediti mensili</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#fff' }}>
                {stats.planInfo?.monthlyCredits >= 0 ? `$${stats.planInfo.monthlyCredits}` : 'Illimitati'}
              </div>
            </div>
            <div style={{ padding: '15px', background: '#222', borderRadius: '10px' }}>
              <div style={{ fontSize: '0.8rem', color: '#888' }}>Token rimanenti</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#fff' }}>
                {stats.remainingTokens?.toLocaleString() || '0'}
              </div>
            </div>
            <div style={{ padding: '15px', background: '#222', borderRadius: '10px' }}>
              <div style={{ fontSize: '0.8rem', color: '#888' }}>Token usati</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#fff' }}>
                {stats.tokensUsed?.toLocaleString() || '0'}
              </div>
            </div>
          </div>
        </div>

        {/* Daily Requests */}
        <div style={{
          padding: '25px',
          background: '#1a1a1a',
          borderRadius: '16px',
          border: '1px solid #333',
          marginBottom: '20px'
        }}>
          <h2 style={{ margin: '0 0 15px', fontSize: '1.2rem' }}>📈 Richieste Giornaliere</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '0.9rem' }}>
                <span style={{ color: '#888' }}>Oggi: {stats.requestsToday} / {stats.planInfo?.dailyRequests || '∞'}</span>
                <span style={{ color: '#fff' }}>{stats.requestsTodayPercent || 0}%</span>
              </div>
              <div style={{ height: '8px', background: '#333', borderRadius: '4px', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${Math.min(stats.requestsTodayPercent || 0, 100)}%`,
                    background: 'linear-gradient(90deg, #3b82f6, #00ff88)'
                  }}
                />
              </div>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3b82f6' }}>
              {stats.requestsToday}
            </div>
          </div>
        </div>

        {/* Model Usage */}
        <div style={{
          padding: '25px',
          background: '#1a1a1a',
          borderRadius: '16px',
          border: '1px solid #333'
        }}>
          <h2 style={{ margin: '0 0 15px', fontSize: '1.2rem' }}>🤖 Modelli Disponibili</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
            {getAvailableModels(stats.plan).map(model => (
              <div
                key={model}
                style={{
                  padding: '12px',
                  background: '#222',
                  borderRadius: '8px',
                  border: '1px solid #333',
                  fontSize: '0.85rem',
                  color: '#ccc'
                }}
              >
                {model}
              </div>
            ))}
          </div>
        </div>

        {/* Tips */}
        <div style={{
          marginTop: '30px',
          padding: '20px',
          background: '#00ff8811',
          borderRadius: '12px',
          border: '1px solid #00ff8844'
        }}>
          <h3 style={{ margin: '0 0 10px', color: '#00ff88' }}>💡 Consigli per risparmiare crediti</h3>
          <ul style={{ margin: 0, paddingLeft: '20px', color: '#ccc', lineHeight: 1.8 }}>
            <li>Usa modelli più economici (Groq Llama 3.1 8B) per task semplici</li>
            <li>Attiva lo streaming per vedere la risposta in tempo reale</li>
            <li>Usa le Skills pre-configurate invece di prompt lunghi</li>
            <li>Salva le conversazioni importanti nel Second Brain per non ripeterle</li>
          </ul>
        </div>
      </main>
    </div>
  );
}

function getAvailableModels(plan) {
  const allModels = [
    'Qwen 2.5 72B (OpenRouter)',
    'Llama 3.1 70B (OpenRouter)',
    'Llama 3.1 8B (Groq)',
    'Mixtral 8x7B (Groq)',
    'Claude Sonnet 4',
    'GPT-4o Mini',
  ];

  if (plan === 'free') {
    return ['Qwen 2.5 72B', 'Llama 3.1 8B (Groq)'];
  }
  return allModels;
}
