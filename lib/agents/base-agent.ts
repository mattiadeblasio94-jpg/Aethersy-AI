import { AgentConfig, AgentResult } from '../../types/agent'

export abstract class BaseAgent {
  protected config: AgentConfig

  constructor(config: AgentConfig) {
    this.config = config
  }

  abstract execute(input: string, context?: any): Promise<AgentResult>

  protected async callAI(prompt: string): Promise<string> {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: prompt,
        systemPrompt: this.config.systemPrompt
      })
    })
    const data = await response.json()
    return data.response || data.message || ''
  }

  protected createResult(data: any, executionTime: number): AgentResult {
    return {
      success: true,
      data,
      executionTime,
      agentId: this.config.id
    }
  }

  protected createError(error: string, executionTime: number): AgentResult {
    return {
      success: false,
      data: null,
      error,
      executionTime,
      agentId: this.config.id
    }
  }

  getConfig(): AgentConfig {
    return this.config
  }
}
