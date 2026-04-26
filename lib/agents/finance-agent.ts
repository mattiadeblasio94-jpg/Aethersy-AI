import { BaseAgent } from './base-agent'
import { AgentConfig, AgentResult } from '../../types/agent'

const config: AgentConfig = {
  id: 'finance',
  name: 'Finance Agent',
  description: 'Analisi finanziaria, ROI e proiezioni business',
  icon: '💰',
  color: 'green',
  capabilities: ['ROI calculation', 'financial forecast', 'budget analysis', 'KPI tracking'],
  systemPrompt: `Sei un CFO esperto. Analizza dati finanziari e fornisci
  proiezioni concrete, calcoli ROI precisi e raccomandazioni strategiche
  per massimizzare la profittabilità. Rispondi sempre in italiano.`
}

export class FinanceAgent extends BaseAgent {
  constructor() {
    super(config)
  }

  async execute(input: string, context?: any): Promise<AgentResult> {
    const start = Date.now()
    try {
      const prompt = `
        Analisi finanziaria per: "${input}"

        Fornisci:
        1. Stima costi iniziali e operativi
        2. Proiezione ricavi 3/6/12 mesi
        3. Calcolo ROI e breakeven point
        4. Cash flow stimato
        5. 3 raccomandazioni per ottimizzare i margini
      `
      const response = await this.callAI(prompt)
      return this.createResult({ analysis: response, input }, Date.now() - start)
    } catch (error) {
      return this.createError(`Finance Agent error: ${error}`, Date.now() - start)
    }
  }
}
