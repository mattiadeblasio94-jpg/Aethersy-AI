/**
 * Admin Dashboard - Monitoraggio Lead & Activity System
 * Accesso illimitato per utente principale
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'

const ADMIN_ID = '8074643162'

export default function AdminDashboard() {
  const router = useRouter()
  const [authed, setAuthed] = useState(false)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [stats, setStats] = useState(null)
  const [leads, setLeads] = useState([])
  const [usage, setUsage] = useState([])
  const [billing, setBilling] = useState([])
  const [activity, setActivity] = useState([])
  const [loading, setLoading] = useState(false)
  const [notification, setNotification] = useState(null)
  const [searchEmail, setSearchEmail] = useState('')
  const [userDetails, setUserDetails] = useState(null)

  useEffect(() => {
    const userId = localStorage.getItem('aethersy_user_id')
    if (userId === ADMIN_ID) {
      setAuthed(true)
      loadData()
    } else {
      router.push('/dashboard')
    }
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const token = localStorage.getItem('aethersy_token') || 'admin-token'

      // Carica stats
      const statsRes = await fetch('/api/admin?endpoint=stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const statsData = await statsRes.json()
      if (statsData.success) setStats(statsData.stats)

      // Carica leads
      const leadsRes = await fetch('/api/admin?endpoint=leads', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const leadsData = await leadsRes.json()
      if (leadsData.success) setLeads(leadsData.data || [])

      // Carica billing
      const billingRes = await fetch('/api/admin?endpoint=billing', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const billingData = await billingRes.json()
      if (billingData.success) setBilling(billingData.data || [])
    } catch (e) {
      console.error('Error loading data:', e)
    }
    setLoading(false)
  }

  async function handleSearchUser(e) {
    e.preventDefault()
    if (!searchEmail) return

    setLoading(true)
    try {
      const token = localStorage.getItem('aethersy_token') || 'admin-token'
      const res = await fetch(`/api/admin?endpoint=user&email=${encodeURIComponent(searchEmail)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.success) {
        setUserDetails(data.data)
        setActiveTab('user-detail')
      } else {
        showNotification('Utente non trovato', 'error')
      }
    } catch (e) {
      showNotification('Errore nella ricerca', 'error')
    }
    setLoading(false)
  }

  function showNotification(message, type = 'info') {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 3000)
  }

  function getPlanColor(plan) {
    switch (plan) {
      case 'free': return 'bg-gray-100 text-gray-800'
      case 'pro': return 'bg-blue-100 text-blue-800'
      case 'business': return 'bg-purple-100 text-purple-800'
      case 'enterprise': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  function getStatusColor(status) {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800'
      case 'active': return 'bg-green-100 text-green-800'
      case 'converted': return 'bg-purple-100 text-purple-800'
      case 'churned': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (!authed) return null

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'leads', label: 'Lead CRM', icon: '🎯' },
    { id: 'usage', label: 'API Usage', icon: '⚡' },
    { id: 'billing', label: 'Billing Desk', icon: '💰' },
    { id: 'activity', label: 'Activity Log', icon: '📝' },
    { id: 'grant-admin', label: 'Grant Admin', icon: '🔐' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">🎛️ Admin Dashboard</h1>
              <p className="text-blue-100 mt-1">Monitoraggio Lead & Activity System</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-blue-100">Admin Access</p>
              <p className="font-mono text-xs">ID: {ADMIN_ID}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="max-w-7xl mx-auto p-6">
        <form onSubmit={handleSearchUser} className="mb-6">
          <div className="flex gap-2">
            <input
              type="email"
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              placeholder="Cerca utente per email..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              🔍 Cerca
            </button>
          </div>
        </form>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Notification */}
        {notification && (
          <div className={`mb-4 p-4 rounded-lg ${
            notification.type === 'success' ? 'bg-green-100 text-green-800' :
            notification.type === 'error' ? 'bg-red-100 text-red-800' :
            'bg-blue-100 text-blue-800'
          }`}>
            {notification.message}
          </div>
        )}

        {/* TAB: DASHBOARD */}
        {activeTab === 'dashboard' && stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Stats Cards */}
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="text-sm text-gray-500">Nuovi Utenti Oggi</div>
              <div className="text-3xl font-bold text-blue-600">{stats.newUsersToday}</div>
              <div className="text-xs text-gray-400 mt-2">Totale: {stats.totalUsers}</div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="text-sm text-gray-500">Nuovi Lead Oggi</div>
              <div className="text-3xl font-bold text-green-600">{stats.newLeadsToday}</div>
              <div className="text-xs text-gray-400 mt-2">In monitoraggio</div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="text-sm text-gray-500">Sessioni Attive</div>
              <div className="text-3xl font-bold text-purple-600">{stats.activeSessions}</div>
              <div className="text-xs text-gray-400 mt-2">Ultimi 5 minuti</div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="text-sm text-gray-500">MRR</div>
              <div className="text-3xl font-bold text-green-600">€{stats.mrr}</div>
              <div className="text-xs text-gray-400 mt-2">Monthly Recurring Revenue</div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="text-sm text-gray-500">Token Usati Oggi</div>
              <div className="text-2xl font-bold text-blue-600">{(stats.tokensUsedToday / 1000).toFixed(1)}K</div>
              <div className="text-xs text-gray-400 mt-2">Costo: ${stats.costToday}</div>
            </div>
          </div>
        )}

        {/* TAB: LEADS CRM */}
        {activeTab === 'leads' && (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold">🎯 Lead Management</h2>
              <p className="text-sm text-gray-500">Tracking completo da registrazione a conversione</p>
            </div>
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Piano</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stato</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Source</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{lead.email}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{lead.users?.full_name || '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPlanColor(lead.users?.plan || 'free')}`}>
                        {lead.users?.plan || 'free'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(lead.status)}`}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{lead.source}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(lead.created_at).toLocaleDateString('it-IT')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB: BILLING DESK */}
        {activeTab === 'billing' && (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold">💰 Billing Desk</h2>
              <p className="text-sm text-gray-500">Piani & Pagamenti Stripe</p>
            </div>
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Piano</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stripe Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {billing.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{user.email}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{user.full_name || '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPlanColor(user.plan)}`}>
                        {user.plan}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-gray-500">
                      {user.stripe_customer_id?.slice(-8) || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(user.created_at).toLocaleDateString('it-IT')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB: USER DETAIL */}
        {activeTab === 'user-detail' && userDetails && (
          <div className="space-y-6">
            <button
              onClick={() => setActiveTab('dashboard')}
              className="text-blue-600 hover:underline"
            >
              ← Torna alla dashboard
            </button>

            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-2xl font-bold mb-4">📋 Profilo Utente</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-500">Email</label>
                  <p className="font-medium">{userDetails.user.email}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Nome</label>
                  <p className="font-medium">{userDetails.user.full_name || '-'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Piano</label>
                  <p className="font-medium">{userDetails.user.plan || 'free'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Telegram ID</label>
                  <p className="font-mono text-sm">{userDetails.user.telegram_id || '-'}</p>
                </div>
              </div>
            </div>

            {userDetails.activity && userDetails.activity.length > 0 && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-lg font-bold mb-4">📝 Attività Recente</h3>
                <ul className="space-y-2">
                  {userDetails.activity.slice(0, 10).map((act, i) => (
                    <li key={i} className="text-sm">
                      <span className="text-gray-500">{new Date(act.created_at).toLocaleString()}</span>
                      {' - '}
                      <span className="font-medium">{act.event_type}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* TAB: GRANT ADMIN */}
        {activeTab === 'grant-admin' && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">🔐 Grant Admin Access</h2>
            <p className="text-sm text-gray-500 mb-4">Concedi accesso admin ad altri utenti</p>
            <form
              onSubmit={async (e) => {
                e.preventDefault()
                const email = e.target.email.value
                const token = localStorage.getItem('aethersy_token') || 'admin-token'

                const res = await fetch('/api/admin?endpoint=grant-admin', {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    targetUserEmail: email,
                    permissions: { dashboard: true, users: true, billing: true, logs: true, settings: false }
                  })
                })

                const data = await res.json()
                if (data.success || data.ok) {
                  showNotification('✅ Admin access granted', 'success')
                  e.target.email.value = ''
                } else {
                  showNotification('⚠️ ' + (data.error || 'Errore'), 'error')
                }
              }}
              className="flex gap-2"
            >
              <input
                type="email"
                name="email"
                placeholder="Email utente..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                required
              />
              <button type="submit" className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                🔐 Grant Admin
              </button>
            </form>
          </div>
        )}

        {/* Placeholder tabs */}
        {(activeTab === 'usage' || activeTab === 'activity') && (
          <div className="bg-white rounded-xl shadow-md p-6 text-center text-gray-500">
            <p>⚠️ Modulo in sviluppo - I dati verranno visualizzati qui dopo il deploy su Supabase</p>
            <p className="text-sm mt-2">Esegui la migration: supabase/migrations/0004_create_monitoring_tables.sql</p>
          </div>
        )}
      </div>
    </div>
  )
}
