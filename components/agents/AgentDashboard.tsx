'use client'

import { useState, useEffect } from 'react'
import { AgentConfig, AgentStatus, AgentResult as AgentResultType } from '../../types/agent'
import { AgentCard } from './AgentCard'
import { AgentResult } from './AgentResult'

interface AgentDashboardProps {
  initialAgents?: AgentConfig[]
}

export function AgentDashboard({ initialAgents }: AgentDashboardProps) {
  const [agents, setAgents] = useState<AgentConfig[]>([])
  const [selectedAgents, setSelectedAgents] = useState<string[]>([])
  const [input, setInput] = useState('')
  const [results, setResults] = useState<Record<string, AgentResultType>>({})
  const [statuses, setStatuses] = useState<Record<string, AgentStatus>>({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (initialAgents?.length) {
      setAgents(initialAgents)
      const initialStatuses: Record<string, AgentStatus> = {}
      initialAgents.forEach(a => { initialStatuses[a.id] = 'idle' })
      setStatuses(initialStatuses)
    } else {
      fetchAgents()
    }
  }, [initialAgents])

  async function fetchAgents() {
    try {
      const res = await fetch('/api/agents')
      const data = await res.json()
      if (data.success) {
        setAgents(data.agents)
        const initialStatuses: Record<string, AgentStatus> = {}
        data.agents.forEach((a: AgentConfig) => { initialStatuses[a.id] = 'idle' })
        setStatuses(initialStatuses)
      }
    } catch (error) {
      console.error('Failed to fetch agents:', error)
    }
  }

  function toggleAgent(agentId: string) {
    setSelectedAgents(prev =>
      prev.includes(agentId)
        ? prev.filter(id => id !== agentId)
        : [...prev, agentId]
    )
  }

  async function executeAgents() {
    if (!input.trim() || selectedAgents.length === 0) return

    setLoading(true)
    const newStatuses = { ...statuses }
    selectedAgents.forEach(id => { newStatuses[id] = 'running' })
    setStatuses(newStatuses)
    setResults({})

    try {
      const res = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input,
          agents: selectedAgents,
          parallel: true
        })
      })

      const data = await res.json()

      if (data.success) {
        const newResults: Record<string, AgentResultType> = {}
        const finalStatuses: Record<string, AgentStatus> = { ...statuses }

        Object.entries(data.result.results).forEach(([agentId, result]) => {
          const r = result as AgentResultType
          newResults[agentId] = r
          finalStatuses[agentId] = r.success ? 'idle' : 'error'
        })

        setResults(newResults)
        setStatuses(finalStatuses)
      }
    } catch (error) {
      console.error('Execution error:', error)
      const errorStatuses: Record<string, AgentStatus> = {}
      selectedAgents.forEach(id => { errorStatuses[id] = 'error' })
      setStatuses(prev => ({ ...prev, ...errorStatuses }))
    } finally {
      setLoading(false)
    }
  }

  const agentIcons: Record<string, string> = {
    seo: '🔍',
    competitor: '🏆',
    finance: '💰',
    social: '📱',
    lead: '🎯'
  }

  const agentNames: Record<string, string> = {
    seo: 'SEO Agent',
    competitor: 'Competitor Agent',
    finance: 'Finance Agent',
    social: 'Social Agent',
    lead: 'Lead Agent'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            🤖 Aethersy AI Agent Hub
          </h1>
          <p className="text-gray-400">
            Seleziona gli agenti ed esegui analisi multi-agente in parallelo
          </p>
        </div>

        {/* Agent Selection Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {agents.map(agent => (
            <AgentCard
              key={agent.id}
              agent={agent}
              status={statuses[agent.id] || 'idle'}
              onSelect={toggleAgent}
              isSelected={selectedAgents.includes(agent.id)}
            />
          ))}
        </div>

        {/* Input Section */}
        <div className="bg-gray-800/50 rounded-xl p-6 mb-8 border border-gray-700">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            📝 Descrizione task o analisi da eseguire
          </label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Es: Voglio lanciare un nuovo prodotto di corsi online sul marketing digitale..."
            className="w-full h-32 px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
          />
          <div className="flex items-center justify-between mt-4">
            <span className="text-sm text-gray-400">
              {selectedAgents.length} agenti selezionati
            </span>
            <button
              onClick={executeAgents}
              disabled={loading || !input.trim() || selectedAgents.length === 0}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? '⏳ Esecuzione...' : '🚀 Esegui Analisi'}
            </button>
          </div>
        </div>

        {/* Results Section */}
        {Object.entries(results).length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-4">
              📊 Risultati Analisi
            </h2>
            {Object.entries(results).map(([agentId, result]) => (
              <AgentResult
                key={agentId}
                agentId={agentId}
                result={result}
                agentIcon={agentIcons[agentId]}
                agentName={agentNames[agentId]}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
