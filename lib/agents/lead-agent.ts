import { BaseAgent } from './base-agent'
import { AgentConfig, AgentResult } from '../../types/agent'

const config: AgentConfig = {
  id: 'lead',
  name: 'Lead Agent',
  description: 'Genera e qualifica lead per il tuo business',
  icon: '🎯',
  color: 'orange',
  capabilities: ['lead generation', 'ICP definition', 'outreach scripts', 'funnel strategy'],
  systemPrompt: `Sei un esperto di lead generation e vendite B2B/B2C.
  Crea strategie concrete per acquisire clienti qualificati,
  script di outreach efficaci e funnel ottimizzati.
  Rispondi sempre in italiano con esempi pratici.`
}

export class LeadAgent extends BaseAgent {
  constructor() {
    super(config)
  }

  async execute(input: string, context?: any): Promise<AgentResult> {
    const start = Date.now()
    try {
      const prompt = `
        Strategia lead generation per: "${input}"

        Fornisci:
        1. Definizione ICP (Ideal Customer Profile)
        2. Top 3 canali di acquisizione consigliati
        3. Script email di outreach (oggetto + corpo)
        4. Script LinkedIn DM
        5. Funnel consigliato con conversion rate stimati
      `
      const response = await this.callAI(prompt)
      return this.createResult({ analysis: response, input }, Date.now() - start)
    } catch (error) {
      return this.createError(`Lead Agent error: ${error}`, Date.now() - start)
    }
  }
}
