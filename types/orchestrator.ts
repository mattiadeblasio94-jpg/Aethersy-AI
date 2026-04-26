import { AgentResult } from './agent'

export interface OrchestratorTask {
  input: string
  agents: string[]
  parallel?: boolean
  context?: any
}

export interface OrchestratorResult {
  taskId: string
  results: Record<string, AgentResult>
  totalTime: number
  summary?: string
}
