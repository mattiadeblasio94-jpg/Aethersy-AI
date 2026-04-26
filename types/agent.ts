export interface AgentConfig {
  id: string
  name: string
  description: string
  icon: string
  color: string
  capabilities: string[]
  systemPrompt: string
}

export interface AgentResult {
  success: boolean
  data: any
  error?: string
  executionTime: number
  agentId: string
}

export interface AgentTask {
  id: string
  agentId: string
  input: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  result?: AgentResult
  createdAt: Date
  completedAt?: Date
}

export type AgentStatus = 'idle' | 'running' | 'error'
