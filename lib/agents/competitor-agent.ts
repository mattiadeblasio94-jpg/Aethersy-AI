import { BaseAgent } from './base-agent'
import { AgentConfig, AgentResult } from '../../types/agent'

const config: AgentConfig = {
  id: 'competitor',
  name: 'Competitor Agent',
  description: 'Analizza competitor e mercato in tempo reale',
  icon: '🏆',
  color: 'red',
  capabilities: ['competitor analysis', 'market positioning', 'SWOT', 'pricing analysis'],
  systemPrompt: `Sei un analista di mercato esperto. Analizza competitor
  e fornisci insight strategici concreti per battere la concorrenza.
  Rispondi sempre in italiano con dati precisi e actionable.`
}

export class CompetitorAgent extends BaseAgent {
  constructor() {
    super(config)
  }

  async execute(input: string, context?: any): Promise<AgentResult> {
    const start = Date.now()
    try {
      const prompt = `
        Analizza i competitor per: "${input}"

        Fornisci:
        1. Top 3 competitor principali
        2. Punti di forza e debolezza di ciascuno
        3. Opportunità di mercato non sfruttate
        4. Strategia consigliata per differenziarsi
        5. SWOT sintetico
      `
      const response = await this.callAI(prompt)
      return this.createResult({ analysis: response, input }, Date.now() - start)
    } catch (error) {
      return this.createError(`Competitor Agent error: ${error}`, Date.now() - start)
    }
  }
}
