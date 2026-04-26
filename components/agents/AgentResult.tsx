'use client'

import { AgentResult as AgentResultType } from '../../types/agent'

interface AgentResultProps {
  agentId: string
  result: AgentResultType
  agentIcon?: string
  agentName?: string
}

export function AgentResult({ agentId, result, agentIcon, agentName }: AgentResultProps) {
  return (
    <div className="rounded-xl border border-gray-700 bg-gray-800/50 p-5 mb-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{agentIcon || '🤖'}</span>
          <h3 className="font-bold text-white">{agentName || agentId}</h3>
          {result.success ? (
            <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400">
              ✓ Completato
            </span>
          ) : (
            <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400">
              ✗ Errore
            </span>
          )}
        </div>
        <span className="text-xs text-gray-500">
          {(result.executionTime / 1000).toFixed(1)}s
        </span>
      </div>

      {result.success ? (
        <div className="text-gray-300 text-sm whitespace-pre-wrap leading-relaxed">
          {result.data?.analysis || JSON.stringify(result.data, null, 2)}
        </div>
      ) : (
        <div className="text-red-400 text-sm">
          ⚠️ {result.error}
        </div>
      )}
    </div>
  )
}
