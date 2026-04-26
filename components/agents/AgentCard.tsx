'use client'

import { AgentConfig, AgentStatus } from '../../types/agent'

interface AgentCardProps {
  agent: AgentConfig
  status: AgentStatus
  onSelect: (id: string) => void
  isSelected: boolean
}

const colorMap: Record<string, string> = {
  blue: 'border-blue-500 bg-blue-500/10',
  red: 'border-red-500 bg-red-500/10',
  green: 'border-green-500 bg-green-500/10',
  purple: 'border-purple-500 bg-purple-500/10',
  orange: 'border-orange-500 bg-orange-500/10',
}

const statusMap: Record<AgentStatus, string> = {
  idle: 'bg-gray-400',
  running: 'bg-yellow-400 animate-pulse',
  error: 'bg-red-500',
}

export function AgentCard({ agent, status, onSelect, isSelected }: AgentCardProps) {
  return (
    <div
      onClick={() => onSelect(agent.id)}
      className={`
        cursor-pointer rounded-xl border-2 p-4 transition-all duration-200
        ${isSelected ? colorMap[agent.color] : 'border-gray-700 bg-gray-800/50'}
        hover:scale-105 hover:shadow-lg
      `}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-3xl">{agent.icon}</span>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${statusMap[status]}`} />
          <span className="text-xs text-gray-400 capitalize">{status}</span>
        </div>
      </div>
      <h3 className="font-bold text-white mb-1">{agent.name}</h3>
      <p className="text-sm text-gray-400 mb-3">{agent.description}</p>
      <div className="flex flex-wrap gap-1">
        {agent.capabilities.slice(0, 2).map(cap => (
          <span
            key={cap}
            className="text-xs px-2 py-0.5 rounded-full bg-gray-700 text-gray-300"
          >
            {cap}
          </span>
        ))}
      </div>
    </div>
  )
}
