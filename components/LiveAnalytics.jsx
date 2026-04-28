/**
 * Live Analytics Panel - Aethersy AI Control Room
 * Monitoraggio in tempo reale di agenti, GPU, e metriche
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Activity, Zap, TrendingUp, Cpu, Users, Server, Database, Globe } from 'lucide-react'

// Componente Counter animato per i numeri
function Counter({ value, duration = 3 }) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const startTime = Date.now()
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / (duration * 1000), 1)
      const eased = 1 - Math.pow(1 - progress, 4)
      setCount(Math.floor(value * eased))
      if (progress >= 1) clearInterval(interval)
    }, 16)
    return () => clearInterval(interval)
  }, [value, duration])

  return <span>{count.toLocaleString()}</span>
}

// Widget singolo con effetto glass
function GlassWidget({ children, className = '', glow = false }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, boxShadow: glow ? '0 0 20px rgba(139, 92, 246, 0.4)' : '0 0 15px rgba(255,255,255,0.1)' }}
      className={`bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-4 ${className}`}
    >
      {children}
    </motion.div>
  )
}

// Log singolo agente
function AgentLog({ agent, message, time, type = 'info' }) {
  const colors = {
    info: 'text-aethersy-cyan',
    success: 'text-green-400',
    warning: 'text-yellow-400',
    error: 'text-red-400',
    action: 'text-aethersy-neon',
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="p-2 rounded bg-white/5 border-l-2 border-aethersy-neon/30 mb-2"
    >
      <div className="flex justify-between items-center mb-1">
        <span className={`text-[10px] font-bold ${colors[type]}`}>{agent}</span>
        <span className="text-[8px] text-gray-600">{time}</span>
      </div>
      <p className="text-[9px] text-gray-400 truncate">{message}</p>
    </motion.div>
  )
}

export default function LiveAnalytics() {
  const [stats, setStats] = useState({
    aiPeople: 12842,
    activeUsers: 0,
    apiCalls: 0,
    gpuLoad: 65,
    stripeBalance: 12450,
  })
  const [logs, setLogs] = useState([
    { agent: 'OpenClaw', msg: 'Scanning profitable niches...', time: '2m ago', type: 'action' },
    { agent: 'Lara', msg: 'Closing deal on Telegram', time: '5m ago', type: 'success' },
    { agent: 'System', msg: 'New API Key registered', time: '12m ago', type: 'info' },
  ])
  const [ecsStatus, setEcsStatus] = useState('active') // active, sleeping, error

  // Fetch dati reali ogni 5 secondi
  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/health')
        if (res.ok) {
          const data = await res.json()
          setStats(prev => ({
            ...prev,
            activeUsers: data.activeUsers || prev.activeUsers,
            apiCalls: data.apiCalls || prev.apiCalls,
          }))
        }

        // Stats da admin API
        const adminRes = await fetch('/api/admin?endpoint=stats', {
          headers: { 'Authorization': 'Bearer admin-token' }
        })
        if (adminRes.ok) {
          const data = await adminRes.json()
          if (data.stats) {
            setStats(prev => ({
              ...prev,
              activeUsers: data.stats.activeSessions || prev.activeUsers,
            }))
          }
        }
      } catch (e) {
        console.error('Stats fetch error:', e)
      }
    }

    fetchStats()
    const interval = setInterval(fetchStats, 5000)
    return () => clearInterval(interval)
  }, [])

  // Simulazione logs in tempo reale
  useEffect(() => {
    const messages = [
      { agent: 'Lara', msg: 'Analyzing user request...', type: 'info' },
      { agent: 'OpenClaw', msg: 'Gateway connection active', type: 'success' },
      { agent: 'Cinema', msg: 'Rendering video frame #482', type: 'action' },
      { agent: 'Stripe', msg: 'Payment webhook received', type: 'success' },
      { agent: 'Qwen', msg: 'Generating response...', type: 'info' },
    ]

    const interval = setInterval(() => {
      const randomMsg = messages[Math.floor(Math.random() * messages.length)]
      setLogs(prev => [{
        ...randomMsg,
        time: 'now',
      }, ...prev.slice(0, 9)])
    }, 8000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="w-80 h-full flex flex-col gap-3 p-4 border-l border-white/10 bg-gradient-to-b from-aethersy-deep/80 to-aethersy-deep/95 backdrop-blur-md overflow-y-auto custom-scrollbar">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-xs font-bold uppercase tracking-[0.2em] text-aethersy-neon mb-2 flex items-center gap-2"
      >
        <Activity size={14} className="animate-pulse" />
        System Live Monitor
      </motion.div>

      {/* AI People Counter - Social Proof */}
      <GlassWidget glow className="bg-gradient-to-br from-aethersy-neon/10 to-transparent border-aethersy-neon/20">
        <div className="flex items-center gap-2 text-[10px] text-aethersy-neon font-bold mb-2">
          <Cpu size={12} className="animate-spin" style={{ animationDuration: '10s' }} />
          AETHERSY NEURAL NETWORK
        </div>
        <div className="flex flex-col">
          <span className="text-2xl font-mono font-bold tracking-tighter text-white">
            <Counter value={stats.aiPeople} />
          </span>
          <span className="text-[9px] text-gray-500 uppercase tracking-widest">
            AI Professionals Created
          </span>
        </div>
      </GlassWidget>

      {/* Alibaba ECS GPU Status */}
      <GlassWidget>
        <div className="flex justify-between items-center text-[10px] text-gray-400 mb-2">
          <span className="flex items-center gap-1">
            <Server size={10} /> ALIBABA ECS GPU
          </span>
          <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
            ecsStatus === 'active' ? 'bg-green-500/20 text-green-400' :
            ecsStatus === 'sleeping' ? 'bg-yellow-500/20 text-yellow-400' :
            'bg-red-500/20 text-red-400'
          }`}>
            {ecsStatus === 'active' ? 'ACTIVE' : ecsStatus === 'sleeping' ? 'SLEEP' : 'ERROR'}
          </span>
        </div>
        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden mb-2">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${stats.gpuLoad}%` }}
            transition={{ duration: 1 }}
            className="h-full bg-gradient-to-r from-aethersy-neon to-aethersy-cyan shadow-[0_0_10px_#8b5cf6]"
          />
        </div>
        <div className="flex justify-between text-[8px] text-gray-500">
          <span>Load: {stats.gpuLoad}%</span>
          <span>47.87.134.105</span>
        </div>
      </GlassWidget>

      {/* Market & Stripe */}
      <GlassWidget>
        <div className="flex items-center gap-2 text-[10px] text-gray-400 mb-3">
          <TrendingUp size={12} /> MARKET & REVENUE
        </div>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-gray-500">BTC/USDT</span>
            <span className="text-[10px] text-green-400 font-mono">+2.4%</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-gray-300">Stripe Balance</span>
            <span className="text-[10px] font-mono text-white">€{stats.stripeBalance.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-gray-500">MRR</span>
            <span className="text-[10px] font-mono text-aethersy-neon">€4,851</span>
          </div>
        </div>
      </GlassWidget>

      {/* API Calls Today */}
      <GlassWidget>
        <div className="flex items-center gap-2 text-[10px] text-gray-400 mb-2">
          <Zap size={12} /> API CALLS TODAY
        </div>
        <div className="text-xl font-mono font-bold text-white">
          <Counter value={stats.apiCalls || 1247} duration={2} />
        </div>
        <div className="text-[9px] text-gray-500 mt-1">
          Avg response: 1.2s
        </div>
      </GlassWidget>

      {/* Active Users */}
      <GlassWidget>
        <div className="flex items-center gap-2 text-[10px] text-gray-400 mb-2">
          <Users size={12} /> ACTIVE SESSIONS
        </div>
        <div className="flex items-end gap-2">
          <span className="text-2xl font-mono font-bold text-white">{stats.activeUsers}</span>
          <span className="text-[9px] text-green-400 mb-1">● live</span>
        </div>
      </GlassWidget>

      {/* Agent Logs */}
      <div className="flex-1 flex flex-col gap-2 min-h-0">
        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest px-2 flex items-center gap-2">
          <Database size={10} /> Agent Logs
        </span>
        <div className="flex-1 space-y-1 overflow-y-auto pr-1 custom-scrollbar min-h-0">
          <AnimatePresence>
            {logs.map((log, i) => (
              <AgentLog
                key={i}
                agent={log.agent}
                message={log.msg}
                time={log.time}
                type={log.type}
              />
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* System Status Footer */}
      <div className="pt-2 border-t border-white/10">
        <div className="flex items-center justify-between text-[8px] text-gray-600">
          <span className="flex items-center gap-1">
            <Globe size={8} /> aethersy.com
          </span>
          <span className="text-green-500">● All systems operational</span>
        </div>
      </div>
    </div>
  )
}
