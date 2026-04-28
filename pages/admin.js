import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

const ADMIN_EMAIL = 'mattiadeblasio94@gmail.com';
const STRIPE_URL = '/api/stripe-webhook';

async function safeJson(r) {
  const t = await r.text();
  try { return JSON.parse(t); } catch { return { error: `Errore: ${t.slice(0, 100)}` }; }
}

// Metriche e KPI
const KPIS = [
  { id: 'revenue', label: 'Revenue MRR', icon: '💰', color: '#10b981' },
  { id: 'users', label: 'Utenti Totali', icon: '👥', color: '#3b82f6' },
  { id: 'active', label: 'Utenti Attivi (7g)', icon: '📈', color: '#8b5cf6' },
  { id: 'churn', label: 'Churn Rate', icon: '📉', color: '#f59e0b' },
  { id: 'credits', label: 'Crediti Venduti', icon: '💎', color: '#06b6d4' },
  { id: 'api', label: 'API Calls (oggi)', icon: '⚡', color: '#ec4899' },
];

export default function AdminPanel() {
  const router = useRouter();
  const [authed, setAuthed] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [financials, setFinancials] = useState(null);
  const [users, setUsers] = useState([]);
  const [grants, setGrants] = useState([]);
  const [requests, setRequests] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [telegramUsers, setTelegramUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  // Form states
  const [grantForm, setGrantForm] = useState({ telegramId: '', plan: 'pro', email: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);

  // Settings form state
  const [config, setConfig] = useState({
    stripe: { secretKey: '', webhookSecret: '', proMonthly: '', proAnnual: '', businessMonthly: '', businessAnnual: '' },
    telegram: { botToken: '', adminIds: '', allowedChats: '' },
    replicate: { apiToken: '' },
    anthropic: { apiKey: '' },
    ollama: { baseUrl: '' },
  });
  const [showSecrets, setShowSecrets] = useState({});
  const [savingConfig, setSavingConfig] = useState(false);

  useEffect(() => {
    const u = JSON.parse(localStorage.getItem('aiforge_user') || '{}');
    if (u.email === ADMIN_EMAIL) {
      setAuthed(true);
    } else {
      router.push('/dashboard');
    }
  }, []);

  useEffect(() => {
    if (authed) {
      initConfig(); // Initialize config with real env data
      loadAllData();
    }
  }, [authed]);

  async function initConfig() {
    try {
      await fetch('/api/admin/init', { method: 'POST' });
    } catch (e) {
      console.error('Init config error:', e);
    }
  }

  useEffect(() => {
    if (activeTab === 'settings') {
      loadConfig();
    }
  }, [activeTab]);

  async function loadAllData() {
    setLoading(true);
    await Promise.all([
      loadStats(),
      loadFinancials(),
      loadUsers(),
      loadGrants(),
      loadRequests(),
      loadAnalytics(),
    ]);
    setLoading(false);
  }

  async function loadAnalytics() {
    const res = await fetch('/api/admin/analytics');
    const data = await safeJson(res);
    if (data.summary) setAnalytics(data.summary);
    if (data.registrations) setRegistrations(data.registrations);
    if (data.telegramUsers) setTelegramUsers(data.telegramUsers);
  }

  async function loadStats() {
    const res = await fetch('/api/admin/stats');
    const data = await safeJson(res);
    if (data.stats) setStats(data.stats);
  }

  async function loadFinancials() {
    const res = await fetch('/api/admin/financials');
    const data = await safeJson(res);
    if (data.metrics) setFinancials(data.metrics);
  }

  async function loadUsers() {
    const res = await fetch('/api/admin/users');
    const data = await safeJson(res);
    if (data.users) setUsers(data.users);
  }

  async function loadGrants() {
    const res = await fetch('/api/admin/grants');
    const data = await safeJson(res);
    if (data.grants) setGrants(data.grants);
  }

  async function loadRequests() {
    const res = await fetch('/api/admin/requests');
    const data = await safeJson(res);
    if (data.requests) setRequests(data.requests);
  }

  async function loadConfig() {
    const res = await fetch('/api/admin/config');
    const data = await safeJson(res);
    if (data.config) {
      setConfig(prev => ({
        ...prev,
        stripe: {
          ...prev.stripe,
          secretKey: data.config.stripe?.secretKey || '',
          webhookSecret: data.config.stripe?.webhookSecret || '',
          proMonthly: data.config.stripe?.proMonthlyPriceId || '',
          proAnnual: data.config.stripe?.proAnnualPriceId || '',
          businessMonthly: data.config.stripe?.businessMonthlyPriceId || '',
          businessAnnual: data.config.stripe?.businessAnnualPriceId || '',
        },
        telegram: {
          ...prev.telegram,
          botToken: data.config.telegram?.botToken || '',
          adminIds: data.config.telegram?.adminIds || '',
          allowedChats: data.config.telegram?.allowedChats || '',
        },
        replicate: {
          ...prev.replicate,
          apiToken: data.config.replicate?.apiToken || '',
        },
        anthropic: {
          ...prev.anthropic,
          apiKey: data.config.anthropic?.apiKey || '',
        },
        ollama: {
          ...prev.ollama,
          baseUrl: data.config.ollama?.baseUrl || '',
        },
      }));
    }
  }

  async function handleSaveConfig(section, key, value) {
    setSavingConfig(true);
    const res = await fetch('/api/admin/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ section, key, value }),
    });
    const data = await safeJson(res);

    if (data.ok) {
      showNotification(`✅ ${section}.${key} salvato`, 'success');
      setConfig(prev => ({
        ...prev,
        [section]: { ...prev[section], [key]: value },
      }));
    } else {
      showNotification(`⚠️ ${data.error}`, 'error');
    }
    setSavingConfig(false);
  }

  async function handleGrantAccess(e) {
    e.preventDefault();
    if (!grantForm.telegramId) return;

    setLoading(true);
    const res = await fetch('/api/admin/grants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(grantForm),
    });
    const data = await safeJson(res);

    if (data.ok) {
      showNotification(`✅ Accesso ${grantForm.plan.toUpperCase()} concesso a ${grantForm.telegramId}`, 'success');
      setGrantForm({ telegramId: '', plan: 'pro', email: '' });
      await loadGrants();
    } else {
      showNotification(`⚠️ ${data.error}`, 'error');
    }
    setLoading(false);
  }

  async function handleRevokeAccess(telegramId) {
    if (!confirm(`Revocare accesso a ${telegramId}?`)) return;

    const res = await fetch('/api/admin/grants', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ telegramId }),
    });
    const data = await safeJson(res);

    if (data.ok) {
      showNotification('✅ Accesso revocato', 'success');
      await loadGrants();
    } else {
      showNotification(`⚠️ ${data.error}`, 'error');
    }
  }

  async function handleApproveRequest(req) {
    setLoading(true);
    const res = await fetch('/api/admin/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'approve', telegramId: req.telegramId, email: req.email, name: req.name }),
    });
    const data = await safeJson(res);

    if (data.ok) {
      showNotification(`✅ Approvato ${req.name}`, 'success');
      await loadRequests();
      await loadGrants();
    } else {
      showNotification(`⚠️ ${data.error}`, 'error');
    }
    setLoading(false);
  }

  async function handleRejectRequest(telegramId) {
    if (!confirm('Rifiutare richiesta?')) return;

    const res = await fetch('/api/admin/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reject', telegramId }),
    });
    const data = await safeJson(res);

    if (data.ok) {
      showNotification('✅ Richiesta rifiutata', 'success');
      await loadRequests();
    } else {
      showNotification(`⚠️ ${data.error}`, 'error');
    }
  }

  async function handleSearch(e) {
    e.preventDefault();
    if (!searchQuery) return;

    setLoading(true);
    const res = await fetch(`/api/admin/users?q=${encodeURIComponent(searchQuery)}`);
    const data = await safeJson(res);
    setSearchResults(data.users || []);
    setLoading(false);
  }

  function showNotification(message, type = 'info') {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  }

  if (!authed) return null;

  const tabs = [
    { id: 'overview', label: 'Panoramica', icon: '📊' },
    { id: 'analytics', label: 'Analytics', icon: '📈' },
    { id: 'financial', label: 'Revenue & Stripe', icon: '💰' },
    { id: 'usage', label: 'Usage & Costi', icon: '⚡' },
    { id: 'users', label: 'Utenti', icon: '👥' },
    { id: 'grants', label: 'Accessi', icon: '🔑' },
    { id: 'requests', label: 'Richieste', icon: '⏳' },
    { id: 'settings', label: 'Impostazioni', icon: '⚙️' },
  ];

  return (
    <div style={styles.root}>
      {/* Sidebar */}
      <aside style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <Link href="/dashboard" style={styles.backLink}>← Dashboard</Link>
          <h1 style={styles.logo}>🔐 Admin Panel</h1>
          <p style={styles.subtitle}>Gestione Piattaforma Aethersy-AI</p>
        </div>

        <nav style={styles.nav}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              style={{
                ...styles.navItem,
                ...(activeTab === tab.id ? styles.navItemActive : {}),
              }}
              onClick={() => setActiveTab(tab.id)}
            >
              <span style={styles.navIcon}>{tab.icon}</span>
              <span>{tab.label}</span>
              {tab.id === 'requests' && requests.length > 0 && (
                <span style={styles.badge}>{requests.length}</span>
              )}
            </button>
          ))}
        </nav>

        <div style={styles.sidebarFooter}>
          <button style={styles.refreshBtn} onClick={loadAllData} disabled={loading}>
            {loading ? '⏳' : '🔄'} Aggiorna
          </button>
          <div style={styles.adminInfo}>
            <span>👤 {ADMIN_EMAIL}</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main style={styles.main}>
        {notification && (
          <div style={{
            ...styles.notification,
            background: notification.type === 'success' ? 'rgba(16,185,129,0.15)' :
                        notification.type === 'error' ? 'rgba(239,68,68,0.15)' : 'rgba(124,58,237,0.15)',
            borderColor: notification.type === 'success' ? 'rgba(16,185,129,0.3)' :
                         notification.type === 'error' ? 'rgba(239,68,68,0.3)' : 'rgba(124,58,237,0.3)',
            color: notification.type === 'success' ? '#34d399' :
                   notification.type === 'error' ? '#f87171' : '#a78bfa',
          }}>
            {notification.message}
            <button onClick={() => setNotification(null)} style={styles.closeBtn}>×</button>
          </div>
        )}

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && stats && (
          <div>
            <h2 style={styles.pageTitle}>📊 Panoramica Piattaforma</h2>

            {/* Key Metrics */}
            <div style={styles.metricsGrid}>
              <MetricCard
                title="Utenti Totali"
                value={users.length}
                icon="👥"
                color="#7c3aed"
                trend="+12%"
              />
              <MetricCard
                title="Revenue Mensile"
                value={`$${financials?.mrr?.current?.toLocaleString() || '0'}`}
                icon="💰"
                color="#10b981"
                trend={`+${financials?.mrr?.growthMoM || 0}%`}
              />
              <MetricCard
                title="Accessi Gratuiti"
                value={grants.length}
                icon="🔑"
                color="#06b6d4"
              />
              <MetricCard
                title="Richieste Pendenti"
                value={requests.length}
                icon="⏳"
                color="#f59e0b"
              />
            </div>

            {/* Analytics Summary */}
            {analytics && (
              <div style={styles.section}>
                <h3 style={styles.sectionTitle}>📈 Analytics Oggi</h3>
                <div style={styles.usageGrid}>
                  <UsageStat label="Registrazioni" value={analytics.registrations?.today || 0} color="#7c3aed" />
                  <UsageStat label="Login" value={analytics.logins?.today || 0} color="#10b981" />
                  <UsageStat label="Telegram Attivi" value={analytics.telegram?.activeToday || 0} color="#06b6d4" />
                  <UsageStat label="Totale Telegram" value={analytics.telegram?.totalUsers || 0} color="#f59e0b" />
                </div>
              </div>
            )}

            {/* Usage Stats */}
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>📈 Utilizzo Oggi</h3>
              <div style={styles.usageGrid}>
                <UsageStat label="Ricerche" value={stats?.today?.research || 0} color="#7c3aed" />
                <UsageStat label="Chat" value={stats?.today?.chat || 0} color="#06b6d4" />
                <UsageStat label="Codice" value={stats?.total?.code || 0} color="#f59e0b" />
                <UsageStat label="Voce" value={stats?.total?.voice || 0} color="#10b981" />
              </div>
            </div>

            {/* Recent Activity */}
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>📋 Attività Recente</h3>
              <div style={styles.activityList}>
                {grants.slice(0, 5).map((grant, i) => (
                  <div key={i} style={styles.activityItem}>
                    <span style={styles.activityIcon}>🔑</span>
                    <span>Accesso {grant.plan?.toUpperCase()} concesso a {grant.telegramId}</span>
                    <span style={styles.activityTime}>{new Date(grant.grantedAt).toLocaleDateString('it-IT')}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ANALYTICS TAB */}
        {activeTab === 'analytics' && (
          <div>
            <h2 style={styles.pageTitle}>📈 Analytics Utenti</h2>

            {/* Summary Cards */}
            {analytics && (
              <div style={styles.metricsGrid}>
                <MetricCard
                  title="Registrazioni Totali"
                  value={analytics.registrations?.total || 0}
                  icon="📝"
                  color="#7c3aed"
                />
                <MetricCard
                  title="Registrati Oggi"
                  value={analytics.registrations?.today || 0}
                  icon="🆕"
                  color="#10b981"
                />
                <MetricCard
                  title="Login Oggi"
                  value={analytics.logins?.today || 0}
                  icon="🔑"
                  color="#06b6d4"
                />
                <MetricCard
                  title="Utenti Telegram"
                  value={analytics.telegram?.totalUsers || 0}
                  icon="📱"
                  color="#f59e0b"
                />
              </div>
            )}

            {/* Registrations List */}
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>📝 Ultime Registrazioni ({registrations.length})</h3>
              {registrations.length === 0 ? (
                <div style={styles.empty}>Nessuna registrazione recente</div>
              ) : (
                <div style={styles.tableWrap}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>Nome</th>
                        <th style={styles.th}>Email</th>
                        <th style={styles.th}>Provider</th>
                        <th style={styles.th}>Data</th>
                      </tr>
                    </thead>
                    <tbody>
                      {registrations.map((reg, i) => (
                        <tr key={i} style={styles.tr}>
                          <td style={styles.td}>{reg.name}</td>
                          <td style={{ ...styles.td, color: '#38bdf8' }}>{reg.email}</td>
                          <td style={styles.td}>{reg.provider || 'email'}</td>
                          <td style={{ ...styles.td, color: '#64748b', fontSize: '0.75rem' }}>
                            {new Date(reg.timestamp).toLocaleString('it-IT')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Telegram Users List */}
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>📱 Utenti Telegram ({telegramUsers.length})</h3>
              {telegramUsers.length === 0 ? (
                <div style={styles.empty}>Nessun utente Telegram</div>
              ) : (
                <div style={styles.tableWrap}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>Nome</th>
                        <th style={styles.th}>Telegram ID</th>
                        <th style={styles.th}>Username</th>
                        <th style={styles.th}>Ultimo Accesso</th>
                      </tr>
                    </thead>
                    <tbody>
                      {telegramUsers.map((user, i) => (
                        <tr key={i} style={styles.tr}>
                          <td style={styles.td}>{user.name}</td>
                          <td style={{ ...styles.td, fontFamily: 'monospace', color: '#a78bfa' }}>{user.telegramId}</td>
                          <td style={styles.td}>{user.username ? `@${user.username}` : '-'}</td>
                          <td style={{ ...styles.td, color: '#64748b', fontSize: '0.75rem' }}>
                            {new Date(user.lastSeen).toLocaleString('it-IT')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* USAGE & COSTI TAB */}
        {activeTab === 'usage' && (
          <div>
            <h2 style={styles.pageTitle}>⚡ Usage & Costi Operativi</h2>

            {/* API Usage Overview */}
            <div style={styles.metricsGrid}>
              <MetricCard
                title="API Calls (Oggi)"
                value={analytics?.apiCalls?.today?.toLocaleString() || '0'}
                icon="⚡"
                color="#ec4899"
                trend="+15%"
              />
              <MetricCard
                title="Token Generati"
                value={(analytics?.tokens?.today / 1000000).toFixed(1) + 'M'}
                icon="🔤"
                color="#8b5cf6"
              />
              <MetricCard
                title="Costo API (Oggi)"
                value={`$${(analytics?.apiCosts?.today || 0).toFixed(2)}`}
                icon="💸"
                color="#f59e0b"
              />
              <MetricCard
                title="Crediti Consumati"
                value={analytics?.credits?.consumed?.toLocaleString() || '0'}
                icon="💎"
                color="#06b6d4"
              />
            </div>

            {/* Costo per Utente */}
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>📊 Costo per Utente (Ultimi 7 giorni)</h3>
              <div style={styles.tableContainer}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Utente</th>
                      <th style={styles.th}>Piano</th>
                      <th style={styles.th}>API Calls</th>
                      <th style={styles.th}>Token</th>
                      <th style={styles.th}>Costo</th>
                      <th style={styles.th}>Revenue</th>
                      <th style={styles.th}>Margine</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.slice(0, 20).map((user, i) => {
                      const apiCalls = user.usage?.apiCalls || 0;
                      const tokens = user.usage?.tokens || 0;
                      const cost = (tokens / 1000000) * 0.50; // $0.50 per 1M tokens
                      const revenue = user.subscription?.mrr || 0;
                      const margin = revenue - cost;
                      return (
                        <tr key={i} style={styles.tr}>
                          <td style={styles.td}>{user.name || user.email}</td>
                          <td style={styles.td}>
                            <span style={{ ...styles.planBadge, background: getPlanColor(user.plan) }}>
                              {(user.plan || 'free').toUpperCase()}
                            </span>
                          </td>
                          <td style={styles.td}>{apiCalls.toLocaleString()}</td>
                          <td style={styles.td}>{(tokens / 1000).toFixed(0)}K</td>
                          <td style={{ ...styles.td, color: cost > 0 ? '#f87171' : '#94a3b8' }}>${cost.toFixed(2)}</td>
                          <td style={styles.td}>${revenue.toFixed(2)}</td>
                          <td style={{ ...styles.td, color: margin >= 0 ? '#34d399' : '#f87171' }}>${margin.toFixed(2)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Usage per Servizio */}
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>🔧 Usage per Servizio</h3>
              <div style={styles.usageGrid}>
                <UsageStat label="Groq API" value={analytics?.services?.groq?.calls?.toLocaleString() || '0'} color="#10b981" sub={`$${analytics?.services?.groq?.cost?.toFixed(2) || '0'}`} />
                <UsageStat label="Replicate" value={analytics?.services?.replicate?.calls?.toLocaleString() || '0'} color="#8b5cf6" sub={`$${analytics?.services?.replicate?.cost?.toFixed(2) || '0'}`} />
                <UsageStat label="HuggingFace" value={analytics?.services?.hf?.calls?.toLocaleString() || '0'} color="#06b6d4" sub={`$${analytics?.services?.hf?.cost?.toFixed(2) || '0'}`} />
                <UsageStat label="Serper" value={analytics?.services?.serper?.calls?.toLocaleString() || '0'} color="#f59e0b" sub={`$${analytics?.services?.serper?.cost?.toFixed(2) || '0'}`} />
              </div>
            </div>

            {/* Stripe Integration Status */}
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>🔗 Stripe Integration</h3>
              <div style={{ ...styles.stripeStatus, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 12, padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ fontSize: '2rem' }}>✅</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, color: '#34d399', marginBottom: '0.25rem' }}>Stripe Connesso</div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Webhook attivo • Subscription tracking enabled</div>
                </div>
                <a href="/api/stripe/portal" target="_blank" style={{ ...styles.btn, background: '#635bff', color: '#fff', padding: '0.5rem 1rem', borderRadius: 8, textDecoration: 'none', fontWeight: 600 }}>
                  Stripe Dashboard →
                </a>
              </div>
            </div>
          </div>
        )}

        {/* FINANCIAL TAB */}
        {activeTab === 'financial' && financials && (
          <div>
            <h2 style={styles.pageTitle}>💰 Revenue Dashboard</h2>

            {/* MRR Overview */}
            <div style={styles.financialSection}>
              <h3 style={styles.sectionTitle}>MRR - Monthly Recurring Revenue</h3>
              <div style={styles.mrrGrid}>
                <div style={{ ...styles.finCard, borderColor: '#7c3aed' }}>
                  <div style={styles.finLabel}>MRR Attuale</div>
                  <div style={{ ...styles.finValue, color: '#a78bfa' }}>${financials.mrr?.current?.toLocaleString() || 0}</div>
                  <div style={styles.finTarget}>Target Y1: $25K</div>
                  <div style={styles.progressBar}>
                    <div style={{ ...styles.progressFill, width: `${Math.min((financials.mrr?.current || 0) / 25000 * 100, 100)}%`, background: '#7c3aed' }} />
                  </div>
                </div>

                <div style={{ ...styles.finCard, borderColor: '#06b6d4' }}>
                  <div style={styles.finLabel}>ARR (Annual)</div>
                  <div style={{ ...styles.finValue, color: '#38bdf8' }}>${((financials.mrr?.current || 0) * 12).toLocaleString()}</div>
                  <div style={styles.finTarget}>Target Y1: $300K</div>
                </div>

                <div style={{ ...styles.finCard, borderColor: '#10b981' }}>
                  <div style={styles.finLabel}>Crescita MoM</div>
                  <div style={{ ...styles.finValue, color: '#34d399' }}>{financials.mrr?.growthMoM || 0}%</div>
                  <div style={styles.finTarget}>Target: 25%</div>
                </div>
              </div>
            </div>

            {/* Revenue by Tier */}
            <div style={styles.financialSection}>
              <h3 style={styles.sectionTitle}>Revenue per Piano</h3>
              <div style={styles.tierGrid}>
                {financials.revenueByTier?.map(tier => (
                  <div key={tier.name} style={{ ...styles.tierCard, borderLeftColor: tier.color }}>
                    <div style={styles.tierHeader}>
                      <span style={{ fontWeight: 700, color: tier.color }}>{tier.name}</span>
                      <span style={styles.tierCount}>{tier.customers} clienti</span>
                    </div>
                    <div style={styles.tierRevenue}>${tier.revenue.toLocaleString()}</div>
                    <div style={styles.tierPrice}>€{tier.price}/mese</div>
                  </div>
                ))}
              </div>
            </div>

            {/* KPIs */}
            <div style={styles.financialSection}>
              <h3 style={styles.sectionTitle}>🎯 KPI Principali</h3>
              <div style={styles.kpiGrid}>
                <KpiCard
                  icon="💎"
                  label="LTV (Lifetime Value)"
                  value={`$${financials.kpis?.ltv?.toLocaleString() || 0}`}
                  target="Target: $4,200"
                  color="#f59e0b"
                />
                <KpiCard
                  icon="📣"
                  label="CAC (Acquisition Cost)"
                  value={`$${financials.kpis?.cac?.toLocaleString() || 0}`}
                  target="Target: $800"
                  color="#ec4899"
                />
                <KpiCard
                  icon="📊"
                  label="LTV/CAC Ratio"
                  value={`${financials.kpis?.ltvCac || 0}x`}
                  target="Target: 5.25x"
                  color="#10b981"
                />
                <KpiCard
                  icon="🚪"
                  label="Churn Rate"
                  value={`${financials.kpis?.churn || 0}%`}
                  target="Target: 1.8%"
                  color="#ef4444"
                />
                <KpiCard
                  icon="⚡"
                  label="Activation Rate"
                  value={`${financials.kpis?.activation || 0}%`}
                  target="Target: 42%"
                  color="#8b5cf6"
                />
              </div>
            </div>

            {/* Customer Count */}
            <div style={styles.financialSection}>
              <h3 style={styles.sectionTitle}>👥 Clienti per Piano</h3>
              <div style={styles.customerGrid}>
                <CustomerCard label="PRO" value={financials.customers?.pro || 0} target={300} color="#a78bfa" />
                <CustomerCard label="BUSINESS" value={financials.customers?.business || 0} target={40} color="#38bdf8" />
                <CustomerCard label="ENTERPRISE" value={financials.customers?.enterprise || 0} target={2} color="#fbbf24" />
                <CustomerCard label="TOTALE" value={financials.customers?.total || 0} target={125} color="#34d399" />
              </div>
            </div>
          </div>
        )}

        {/* USERS TAB */}
        {activeTab === 'users' && (
          <div>
            <h2 style={styles.pageTitle}>👥 Gestione Utenti</h2>

            {/* Search */}
            <div style={styles.searchSection}>
              <form onSubmit={handleSearch} style={styles.searchForm}>
                <input
                  style={styles.searchInput}
                  placeholder="Cerca per email, Telegram ID o nome..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button type="submit" style={styles.searchBtn} disabled={loading}>
                  {loading ? '⏳' : '🔍'} Cerca
                </button>
              </form>

              {searchResults && (
                <div style={styles.searchResults}>
                  <h4 style={styles.searchTitle}>Risultati ({searchResults.length})</h4>
                  {searchResults.map((user, i) => (
                    <div key={i} style={styles.userCard}>
                      <div style={styles.userHeader}>
                        <span style={styles.userName}>{user.name}</span>
                        <span style={{ ...styles.planBadge, background: getPlanColor(user.plan) }}>{user.plan?.toUpperCase()}</span>
                      </div>
                      <div style={styles.userEmail}>{user.email}</div>
                      <div style={styles.userMeta}>
                        <span>Provider: {user.provider || 'email'}</span>
                        <span>Dal: {new Date(user.createdAt).toLocaleDateString('it-IT')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Users Table */}
            <div style={styles.tableSection}>
              <h3 style={styles.sectionTitle}>Tutti gli Utenti ({users.length})</h3>
              <div style={styles.tableWrap}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Nome</th>
                      <th style={styles.th}>Email</th>
                      <th style={styles.th}>Piano</th>
                      <th style={styles.th}>Provider</th>
                      <th style={styles.th}>Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user, i) => (
                      <tr key={i} style={styles.tr}>
                        <td style={styles.td}>{user.name}</td>
                        <td style={{ ...styles.td, color: '#38bdf8' }}>{user.email}</td>
                        <td style={styles.td}>
                          <span style={{ ...styles.planBadge, background: getPlanColor(user.plan) }}>
                            {user.plan?.toUpperCase() || 'FREE'}
                          </span>
                        </td>
                        <td style={styles.td}>{user.provider || 'email'}</td>
                        <td style={{ ...styles.td, color: '#64748b', fontSize: '0.75rem' }}>
                          {new Date(user.createdAt).toLocaleDateString('it-IT')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* GRANTS TAB */}
        {activeTab === 'grants' && (
          <div>
            <h2 style={styles.pageTitle}>🔑 Gestione Accessi Gratuiti</h2>

            {/* Grant Form */}
            <div style={styles.grantForm}>
              <h3 style={styles.formTitle}>🎁 Concedi Accesso</h3>
              <form onSubmit={handleGrantAccess}>
                <div style={styles.formGrid}>
                  <div>
                    <label style={styles.label}>Telegram ID</label>
                    <input
                      style={styles.input}
                      placeholder="Es: 8074643162"
                      value={grantForm.telegramId}
                      onChange={(e) => setGrantForm({ ...grantForm, telegramId: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={styles.label}>Email (opzionale)</label>
                    <input
                      style={styles.input}
                      placeholder="Es: mario@esempio.com"
                      value={grantForm.email}
                      onChange={(e) => setGrantForm({ ...grantForm, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={styles.label}>Piano</label>
                    <select
                      style={styles.select}
                      value={grantForm.plan}
                      onChange={(e) => setGrantForm({ ...grantForm, plan: e.target.value })}
                    >
                      <option value="free">FREE</option>
                      <option value="pro">PRO</option>
                      <option value="business">BUSINESS</option>
                      <option value="enterprise">ENTERPRISE</option>
                    </select>
                  </div>
                </div>
                <button type="submit" style={styles.submitBtn} disabled={loading || !grantForm.telegramId}>
                  {loading ? '⏳' : '✅'} Concedi Accesso
                </button>
              </form>
            </div>

            {/* Grants Table */}
            <div style={styles.tableSection}>
              <h3 style={styles.sectionTitle}>Accessi Attivi ({grants.length})</h3>
              {grants.length === 0 ? (
                <div style={styles.empty}>Nessun accesso gratuito concesso</div>
              ) : (
                <div style={styles.tableWrap}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>Telegram ID</th>
                        <th style={styles.th}>Piano</th>
                        <th style={styles.th}>Concesso da</th>
                        <th style={styles.th}>Data</th>
                        <th style={styles.th}>Azioni</th>
                      </tr>
                    </thead>
                    <tbody>
                      {grants.map((grant, i) => (
                        <tr key={i} style={styles.tr}>
                          <td style={{ ...styles.td, fontFamily: 'monospace', color: '#a78bfa' }}>{grant.telegramId}</td>
                          <td style={styles.td}>
                            <span style={{ ...styles.planBadge, background: getPlanColor(grant.plan) }}>
                              {grant.plan?.toUpperCase()}
                            </span>
                          </td>
                          <td style={styles.td}>{grant.grantedBy || 'admin'}</td>
                          <td style={{ ...styles.td, color: '#64748b', fontSize: '0.75rem' }}>
                            {new Date(grant.grantedAt).toLocaleDateString('it-IT')}
                          </td>
                          <td style={styles.td}>
                            <button
                              style={{ ...styles.actionBtn, background: 'rgba(239,68,68,0.15)', color: '#f87171' }}
                              onClick={() => handleRevokeAccess(grant.telegramId)}
                            >
                              ✕ Revoca
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* REQUESTS TAB */}
        {activeTab === 'requests' && (
          <div>
            <h2 style={styles.pageTitle}>⏳ Richieste di Accesso ({requests.length})</h2>

            {requests.length === 0 ? (
              <div style={styles.empty}>
                ✅ Nessuna richiesta pendente
                <div style={styles.emptyHint}>
                  Gli utenti possono richiedere accesso PRO gratuito via Telegram con il comando{' '}
                  <code style={styles.code}>/richiediaccesso email nome</code>
                </div>
              </div>
            ) : (
              <div style={styles.requestsGrid}>
                {requests.map((req, i) => (
                  <div key={i} style={styles.requestCard}>
                    <div style={styles.requestHeader}>
                      <span style={styles.requestName}>{req.name}</span>
                      <span style={styles.requestDate}>{new Date(req.createdAt).toLocaleDateString('it-IT')}</span>
                    </div>
                    <div style={styles.requestEmail}>{req.email}</div>
                    <div style={styles.requestId}>Telegram ID: {req.telegramId}</div>
                    <div style={styles.requestActions}>
                      <button
                        style={{ ...styles.requestBtn, background: 'rgba(16,185,129,0.15)', color: '#34d399' }}
                        onClick={() => handleApproveRequest(req)}
                        disabled={loading}
                      >
                        ✓ Approva
                      </button>
                      <button
                        style={{ ...styles.requestBtn, background: 'rgba(239,68,68,0.15)', color: '#f87171' }}
                        onClick={() => handleRejectRequest(req.telegramId)}
                        disabled={loading}
                      >
                        ✕ Rifiuta
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === 'settings' && (
          <div>
            <h2 style={styles.pageTitle}>⚙️ Impostazioni</h2>
            <p style={{ color: '#64748b', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              Configura le chiavi API e i servizi. I valori vengono salvati in Redis e persistono per 10 anni.
            </p>

            {/* Stripe Settings */}
            <div style={styles.settingsSection}>
              <h3 style={styles.sectionTitle}>💳 Stripe</h3>
              <div style={styles.configGrid}>
                <ConfigInput
                  label="Secret Key"
                  value={config.stripe.secretKey}
                  onSave={(v) => handleSaveConfig('stripe', 'secretKey', v)}
                  placeholder="sk_live_..."
                  secret
                  showSecret={showSecrets.stripeSecretKey}
                  onToggle={() => setShowSecrets(prev => ({ ...prev, stripeSecretKey: !prev.stripeSecretKey }))}
                  disabled={savingConfig}
                />
                <ConfigInput
                  label="Webhook Secret"
                  value={config.stripe.webhookSecret}
                  onSave={(v) => handleSaveConfig('stripe', 'webhookSecret', v)}
                  placeholder="whsec_..."
                  secret
                  showSecret={showSecrets.stripeWebhookSecret}
                  onToggle={() => setShowSecrets(prev => ({ ...prev, stripeWebhookSecret: !prev.stripeWebhookSecret }))}
                  disabled={savingConfig}
                />
              </div>
              <h4 style={styles.subsectionTitle}>Piani Tariffari (Price IDs)</h4>
              <div style={styles.configGrid}>
                <ConfigInput
                  label="PRO Mensile"
                  value={config.stripe.proMonthly}
                  onSave={(v) => handleSaveConfig('stripe', 'proMonthlyPriceId', v)}
                  placeholder="price_..."
                  disabled={savingConfig}
                />
                <ConfigInput
                  label="PRO Annuale"
                  value={config.stripe.proAnnual}
                  onSave={(v) => handleSaveConfig('stripe', 'proAnnualPriceId', v)}
                  placeholder="price_..."
                  disabled={savingConfig}
                />
                <ConfigInput
                  label="BUSINESS Mensile"
                  value={config.stripe.businessMonthly}
                  onSave={(v) => handleSaveConfig('stripe', 'businessMonthlyPriceId', v)}
                  placeholder="price_..."
                  disabled={savingConfig}
                />
                <ConfigInput
                  label="BUSINESS Annuale"
                  value={config.stripe.businessAnnual}
                  onSave={(v) => handleSaveConfig('stripe', 'businessAnnualPriceId', v)}
                  placeholder="price_..."
                  disabled={savingConfig}
                />
              </div>
            </div>

            {/* Telegram Settings */}
            <div style={styles.settingsSection}>
              <h3 style={styles.sectionTitle}>🤖 Telegram Bot</h3>
              <div style={styles.configGrid}>
                <ConfigInput
                  label="Bot Token"
                  value={config.telegram.botToken}
                  onSave={(v) => handleSaveConfig('telegram', 'botToken', v)}
                  placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
                  secret
                  showSecret={showSecrets.telegramBotToken}
                  onToggle={() => setShowSecrets(prev => ({ ...prev, telegramBotToken: !prev.telegramBotToken }))}
                  disabled={savingConfig}
                />
                <ConfigInput
                  label="Admin IDs (comma-separated)"
                  value={config.telegram.adminIds}
                  onSave={(v) => handleSaveConfig('telegram', 'adminIds', v)}
                  placeholder="8074643162,123456789"
                  disabled={savingConfig}
                />
                <ConfigInput
                  label="Allowed Chats (comma-separated)"
                  value={config.telegram.allowedChats}
                  onSave={(v) => handleSaveConfig('telegram', 'allowedChats', v)}
                  placeholder="-1001234567890,-1009876543210"
                  disabled={savingConfig}
                />
              </div>
            </div>

            {/* Replicate Settings */}
            <div style={styles.settingsSection}>
              <h3 style={styles.sectionTitle}>🎬 Replicate (AI Generation)</h3>
              <ConfigInput
                label="API Token"
                value={config.replicate.apiToken}
                onSave={(v) => handleSaveConfig('replicate', 'apiToken', v)}
                placeholder="r8_..."
                secret
                showSecret={showSecrets.replicateApiToken}
                onToggle={() => setShowSecrets(prev => ({ ...prev, replicateApiToken: !prev.replicateApiToken }))}
                disabled={savingConfig}
              />
            </div>

            {/* Anthropic Settings */}
            <div style={styles.settingsSection}>
              <h3 style={styles.sectionTitle}>🧠 Anthropic (Claude API)</h3>
              <ConfigInput
                label="API Key"
                value={config.anthropic.apiKey}
                onSave={(v) => handleSaveConfig('anthropic', 'apiKey', v)}
                placeholder="sk-ant-..."
                secret
                showSecret={showSecrets.anthropicApiKey}
                onToggle={() => setShowSecrets(prev => ({ ...prev, anthropicApiKey: !prev.anthropicApiKey }))}
                disabled={savingConfig}
              />
            </div>

            {/* Ollama Settings */}
            <div style={styles.settingsSection}>
              <h3 style={styles.sectionTitle}>🦙 Ollama (Local AI)</h3>
              <ConfigInput
                label="Base URL"
                value={config.ollama.baseUrl}
                onSave={(v) => handleSaveConfig('ollama', 'baseUrl', v)}
                placeholder="http://localhost:11434"
                disabled={savingConfig}
              />
            </div>

            {/* Redis Status */}
            <div style={styles.settingsSection}>
              <h3 style={styles.sectionTitle}>🗄️ Redis (Upstash)</h3>
              <div style={styles.settingItem}>
                <div style={styles.settingLabel}>Stato Connessione</div>
                <div style={styles.settingValue}>
                  {stats ? '✅ Connesso' : '⚠️ Non connesso'}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

/* ── SUBCOMPONENTS ─────────────────────────────────────────────────────────── */

function MetricCard({ title, value, icon, color, trend }) {
  return (
    <div style={{ ...styles.metricCard, borderColor: `${color}40` }}>
      <div style={styles.metricHeader}>
        <span style={{ fontSize: '1.5rem' }}>{icon}</span>
        {trend && <span style={{ ...styles.trend, color: trend.startsWith('+') ? '#34d399' : '#f87171' }}>{trend}</span>}
      </div>
      <div style={styles.metricTitle}>{title}</div>
      <div style={{ ...styles.metricValue, color }}>{value}</div>
    </div>
  );
}

function UsageStat({ label, value, color }) {
  return (
    <div style={styles.usageStat}>
      <div style={{ ...styles.usageDot, background: color }} />
      <div style={styles.usageLabel}>{label}</div>
      <div style={{ ...styles.usageValue, color }}>{value.toLocaleString()}</div>
    </div>
  );
}

function KpiCard({ icon, label, value, target, color }) {
  return (
    <div style={{ ...styles.kpiCard, borderColor: `${color}30` }}>
      <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{icon}</div>
      <div style={styles.kpiLabel}>{label}</div>
      <div style={{ ...styles.kpiValue, color }}>{value}</div>
      <div style={styles.kpiTarget}>{target}</div>
    </div>
  );
}

function CustomerCard({ label, value, target, color }) {
  const progress = Math.min((value / target) * 100, 100);
  return (
    <div style={{ ...styles.customerCard, background: `${color}15` }}>
      <div style={{ color, fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>{label}</div>
      <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#f1f5f9' }}>{value}</div>
      <div style={{ color: '#64748b', fontSize: '0.72rem' }}>Target: {target}</div>
      <div style={styles.progressBar}>
        <div style={{ ...styles.progressFill, width: `${progress}%`, background: color }} />
      </div>
    </div>
  );
}

function ConfigInput({ label, value, onSave, placeholder, secret, showSecret, onToggle, disabled }) {
  const [localValue, setLocalValue] = useState(value);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleSave = async () => {
    if (!localValue || saving) return;
    setSaving(true);
    await onSave(localValue);
    setSaving(false);
  };

  return (
    <div style={styles.configInput}>
      <label style={styles.configLabel}>{label}</label>
      <div style={styles.inputWrapper}>
        <input
          style={styles.configInputField}
          type={secret && !showSecret ? 'password' : 'text'}
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          onKeyPress={(e) => e.key === 'Enter' && handleSave()}
        />
        {secret && (
          <button
            style={styles.toggleBtn}
            onClick={onToggle}
            type="button"
            disabled={disabled}
          >
            {showSecret ? '🙈' : '👁️'}
          </button>
        )}
        <button
          style={{ ...styles.saveBtn, opacity: (disabled || saving || !localValue) ? 0.5 : 1 }}
          onClick={handleSave}
          type="button"
          disabled={disabled || saving || !localValue}
        >
          {saving ? '⏳' : '💾'} {saving ? 'Salvataggio...' : 'Salva'}
        </button>
      </div>
    </div>
  );
}

/* ── STYLES ─────────────────────────────────────────────────────────────────── */

const styles = {
  root: { display: 'flex', minHeight: '100vh', background: '#0a0a0f', color: '#f1f5f9', fontFamily: "'Inter', system-ui, sans-serif" },

  // Sidebar
  sidebar: { width: 260, background: '#0d0d16', borderRight: '1px solid rgba(255,255,255,0.07)', display: 'flex', flexDirection: 'column', flexShrink: 0 },
  sidebarHeader: { padding: '1.2rem', borderBottom: '1px solid rgba(255,255,255,0.07)' },
  backLink: { color: '#475569', fontSize: '0.8rem', textDecoration: 'none', display: 'block', marginBottom: '0.5rem' },
  logo: { fontSize: '1.1rem', fontWeight: 800, margin: 0, color: '#f1f5f9' },
  subtitle: { fontSize: '0.72rem', color: '#64748b', margin: '0.3rem 0 0' },
  nav: { flex: 1, padding: '0.8rem 0.5rem' },
  navItem: { width: '100%', display: 'flex', alignItems: 'center', gap: '0.7rem', padding: '0.7rem 0.8rem', border: 'none', background: 'transparent', color: '#64748b', borderRadius: 10, cursor: 'pointer', fontSize: '0.85rem', marginBottom: '0.2rem', fontFamily: 'inherit', position: 'relative' },
  navItemActive: { background: 'rgba(124,58,237,0.2)', color: '#a78bfa' },
  navIcon: { fontSize: '1.1rem' },
  badge: { background: 'rgba(245,158,11,0.2)', color: '#fbbf24', fontSize: '0.68rem', fontWeight: 700, padding: '0.15rem 0.4rem', borderRadius: 6, marginLeft: 'auto' },
  sidebarFooter: { padding: '0.8rem', borderTop: '1px solid rgba(255,255,255,0.07)' },
  refreshBtn: { width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', borderRadius: 8, padding: '0.5rem', fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'inherit', marginBottom: '0.5rem' },
  adminInfo: { fontSize: '0.72rem', color: '#475569', textAlign: 'center' },

  // Main
  main: { flex: 1, overflowY: 'auto', padding: '1.5rem 2rem' },
  notification: { border: '1px solid', borderRadius: 12, padding: '0.8rem 1.2rem', marginBottom: '1.5rem', fontSize: '0.88rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  closeBtn: { background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', marginLeft: '1rem', fontSize: '1.2rem' },
  pageTitle: { fontSize: '1.4rem', fontWeight: 800, marginBottom: '1.5rem', marginTop: 0 },

  // Sections
  section: { marginTop: '2rem', padding: '1.2rem', background: 'rgba(255,255,255,0.02)', borderRadius: 16 },
  sectionTitle: { fontSize: '0.95rem', fontWeight: 700, color: '#94a3b8', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' },

  // Metrics
  metricsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' },
  metricCard: { background: 'rgba(255,255,255,0.02)', borderRadius: 14, padding: '1.2rem', border: '1px solid' },
  metricHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' },
  trend: { fontSize: '0.75rem', fontWeight: 700 },
  metricTitle: { fontSize: '0.75rem', color: '#64748b', marginBottom: '0.3rem' },
  metricValue: { fontSize: '1.8rem', fontWeight: 900 },

  // Usage
  usageGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.8rem' },
  usageStat: { display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.6rem', background: 'rgba(255,255,255,0.02)', borderRadius: 10 },
  usageDot: { width: 8, height: 8, borderRadius: '50%' },
  usageLabel: { fontSize: '0.75rem', color: '#64748b', flex: 1 },
  usageValue: { fontSize: '1.1rem', fontWeight: 700 },

  // Activity
  activityList: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  activityItem: { display: 'flex', alignItems: 'center', gap: '0.7rem', padding: '0.6rem', background: 'rgba(255,255,255,0.02)', borderRadius: 8 },
  activityIcon: { fontSize: '1rem' },
  activityTime: { marginLeft: 'auto', fontSize: '0.72rem', color: '#475569' },

  // Financial
  financialSection: { marginBottom: '2rem', padding: '1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: 16 },
  mrrGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' },
  finCard: { background: 'rgba(255,255,255,0.02)', borderRadius: 14, padding: '1.2rem', border: '1px solid' },
  finLabel: { fontSize: '0.72rem', color: '#64748b', marginBottom: '0.4rem' },
  finValue: { fontSize: '1.8rem', fontWeight: 900, marginBottom: '0.3rem' },
  finTarget: { fontSize: '0.68rem', color: '#475569' },
  progressBar: { height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden', marginTop: '0.5rem' },
  progressFill: { height: '100%', borderRadius: 3, transition: 'width 0.3s' },
  tierGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.8rem' },
  tierCard: { background: 'rgba(255,255,255,0.02)', borderRadius: 12, padding: '1rem', border: '1px solid rgba(255,255,255,0.05)', borderLeftWidth: 3 },
  tierHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' },
  tierCount: { fontSize: '0.72rem', color: '#64748b' },
  tierRevenue: { fontSize: '1.4rem', fontWeight: 900, color: '#f1f5f9' },
  tierPrice: { fontSize: '0.72rem', color: '#475569', marginTop: '0.3rem' },
  kpiGrid: { display: 'flex', flexWrap: 'wrap', gap: '1rem' },
  kpiCard: { flex: '1 1 160px', background: 'rgba(255,255,255,0.02)', borderRadius: 14, padding: '1.2rem', border: '1px solid', textAlign: 'center' },
  kpiLabel: { fontSize: '0.72rem', color: '#64748b', marginBottom: '0.5rem', fontWeight: 600 },
  kpiValue: { fontSize: '1.5rem', fontWeight: 900, marginBottom: '0.3rem' },
  kpiTarget: { fontSize: '0.68rem', color: '#475569' },
  customerGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' },
  customerCard: { borderRadius: 12, padding: '1.2rem', textAlign: 'center' },

  // Users
  searchSection: { marginBottom: '2rem' },
  searchForm: { display: 'flex', gap: '0.7rem', marginBottom: '1rem' },
  searchInput: { flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#f1f5f9', padding: '0.7rem 1rem', fontSize: '0.9rem', outline: 'none' },
  searchBtn: { background: 'linear-gradient(135deg,#7c3aed,#06b6d4)', color: '#fff', border: 'none', borderRadius: 10, padding: '0.7rem 1.4rem', fontWeight: 700, cursor: 'pointer', fontSize: '0.88rem' },
  searchResults: { display: 'flex', flexDirection: 'column', gap: '0.8rem' },
  searchTitle: { fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.5rem' },
  userCard: { background: 'rgba(255,255,255,0.02)', borderRadius: 12, padding: '1rem' },
  userHeader: { display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' },
  userName: { fontWeight: 700 },
  userEmail: { color: '#38bdf8', fontSize: '0.85rem' },
  userMeta: { display: 'flex', gap: '1rem', marginTop: '0.5rem', fontSize: '0.75rem', color: '#64748b' },
  tableSection: {},
  tableWrap: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem' },
  th: { padding: '0.8rem 1rem', textAlign: 'left', color: '#64748b', fontWeight: 600, fontSize: '0.78rem', borderBottom: '1px solid rgba(255,255,255,0.05)' },
  tr: { borderBottom: '1px solid rgba(255,255,255,0.03)' },
  td: { padding: '0.7rem 1rem', color: '#cbd5e1', verticalAlign: 'middle' },
  planBadge: { background: 'rgba(124,58,237,0.2)', color: '#a78bfa', borderRadius: 6, padding: '0.15rem 0.5rem', fontSize: '0.72rem', fontWeight: 600 },
  empty: { color: '#475569', fontSize: '0.9rem', padding: '2rem', textAlign: 'center' },
  emptyHint: { marginTop: '0.5rem', fontSize: '0.78rem' },
  code: { background: 'rgba(255,255,255,0.1)', padding: '0.1rem 0.4rem', borderRadius: 4 },

  // Grants
  grantForm: { background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 14, padding: '1.5rem', marginBottom: '2rem' },
  formTitle: { fontSize: '0.95rem', fontWeight: 700, color: '#a78bfa', marginBottom: '1rem' },
  formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1rem' },
  label: { display: 'block', fontSize: '0.78rem', color: '#94a3b8', marginBottom: '0.4rem' },
  input: { width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#f1f5f9', padding: '0.6rem 0.8rem', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box' },
  select: { width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#f1f5f9', padding: '0.6rem 0.8rem', fontSize: '0.88rem', outline: 'none', cursor: 'pointer', boxSizing: 'border-box' },
  submitBtn: { background: 'linear-gradient(135deg,#7c3aed,#06b6d4)', color: '#fff', border: 'none', borderRadius: 10, padding: '0.7rem 1.4rem', fontWeight: 700, cursor: 'pointer', fontSize: '0.88rem' },
  actionBtn: { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', borderRadius: 6, padding: '0.25rem 0.6rem', fontSize: '0.75rem', cursor: 'pointer' },

  // Requests
  requestsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' },
  requestCard: { background: 'rgba(255,255,255,0.02)', borderRadius: 14, padding: '1.2rem' },
  requestHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' },
  requestName: { fontWeight: 700, fontSize: '1rem' },
  requestDate: { fontSize: '0.72rem', color: '#64748b' },
  requestEmail: { color: '#38bdf8', fontSize: '0.85rem', marginBottom: '0.3rem' },
  requestId: { fontSize: '0.75rem', color: '#a78bfa', fontFamily: 'monospace', marginBottom: '0.8rem' },
  requestActions: { display: 'flex', gap: '0.5rem' },
  requestBtn: { flex: 1, border: 'none', borderRadius: 8, padding: '0.5rem', fontWeight: 600, cursor: 'pointer', fontSize: '0.8rem' },

  // Settings
  settingsSection: { background: 'rgba(255,255,255,0.02)', borderRadius: 14, padding: '1.2rem', marginBottom: '1.5rem' },
  settingItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.8rem 0', borderBottom: '1px solid rgba(255,255,255,0.03)' },
  settingLabel: { fontSize: '0.85rem', color: '#94a3b8' },
  settingValue: { fontSize: '0.85rem', color: '#f1f5f9' },
  configGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' },
  configInput: { marginBottom: '1rem' },
  configLabel: { display: 'block', fontSize: '0.78rem', color: '#94a3b8', marginBottom: '0.4rem', fontWeight: 600 },
  inputWrapper: { display: 'flex', gap: '0.5rem', alignItems: 'center' },
  configInputField: { flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#f1f5f9', padding: '0.6rem 0.8rem', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box' },
  toggleBtn: { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '0.5rem 0.7rem', cursor: 'pointer', fontSize: '1rem' },
  saveBtn: { background: 'linear-gradient(135deg,#7c3aed,#06b6d4)', color: '#fff', border: 'none', borderRadius: 8, padding: '0.5rem 0.9rem', fontWeight: 600, cursor: 'pointer', fontSize: '0.8rem', whiteSpace: 'nowrap' },
  subsectionTitle: { fontSize: '0.8rem', color: '#64748b', marginTop: '1.2rem', marginBottom: '0.8rem', fontWeight: 600 },

  // Usage & Costi styles
  tableContainer: { overflowX: 'auto', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)' },
  stripeStatus: { display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', borderRadius: 12 },
  btn: { display: 'inline-block', fontWeight: 600, textDecoration: 'none', borderRadius: 8, padding: '0.5rem 1rem', cursor: 'pointer', border: 'none', fontSize: '0.8rem' },
};

function getPlanColor(plan) {
  switch (plan?.toLowerCase()) {
    case 'pro': return 'rgba(124,58,237,0.25)';
    case 'business': return 'rgba(6,182,212,0.25)';
    case 'enterprise': return 'rgba(245,158,11,0.25)';
    default: return 'rgba(100,116,139,0.25)';
  }
}
