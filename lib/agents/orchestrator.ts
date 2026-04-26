import { SEOAgent } from './seo-agent'
import { CompetitorAgent } from './competitor-agent'
import { FinanceAgent } from './finance-agent'
import { SocialAgent } from './social-agent'
import { LeadAgent } from './lead-agent'
import { BaseAgent } from './base-agent'
import { OrchestratorTask, OrchestratorResult } from '../../types/orchestrator'
import { AgentResult } from '../../types/agent'

class AgentOrchestrator {
  private agents: Map<string, BaseAgent> = new Map()

  constructor() {
    this.registerAgents()
  }

  private registerAgents() {
    const agentsList: BaseAgent[] = [
      new SEOAgent(),
      new CompetitorAgent(),
      new FinanceAgent(),
      new SocialAgent(),
      new LeadAgent(),
    ]
    agentsList.forEach(agent => {
      this.agents.set(agent.getConfig().id, agent)
    })
  }

  async executeTask(task: OrchestratorTask): Promise<OrchestratorResult> {
    const taskId = `task_${Date.now()}`
    const startTime = Date.now()
    const results: Record<string, AgentResult> = {}

    if (task.parallel) {
      const promises = task.agents.map(agentId => {
        const agent = this.agents.get(agentId)
        if (!agent) return Promise.resolve(null)
        return agent.execute(task.input, task.context)
          .then(result => ({ agentId, result }))
      })
      const resolved = await Promise.all(promises)
      resolved.forEach(item => {
        if (item) results[item.agentId] = item.result
      })
    } else {
      for (const agentId of task.agents) {
        const agent = this.agents.get(agentId)
        if (!agent) continue
        results[agentId] = await agent.execute(task.input, task.context)
      }
    }

    return {
      taskId,
      results,
      totalTime: Date.now() - startTime,
    }
  }

  getAgent(id: string): BaseAgent | undefined {
    return this.agents.get(id)
  }

  getAllAgents(): BaseAgent[] {
    return Array.from(this.agents.values())
  }

  getAgentIds(): string[] {
    return Array.from(this.agents.keys())
  }
}

export const orchestrator = new AgentOrchestrator()
