import { BaseAgent } from './base-agent'
import { AgentConfig, AgentResult } from '../../types/agent'

const config: AgentConfig = {
  id: 'seo',
  name: 'SEO Agent',
  description: 'Analizza e ottimizza contenuti per i motori di ricerca',
  icon: '🔍',
  color: 'blue',
  capabilities: ['keyword research', 'meta tags', 'content optimization', 'SERP analysis'],
  systemPrompt: `Sei un esperto SEO senior. Analizza contenuti e fornisci
  raccomandazioni concrete e actionable per migliorare il posizionamento
  su Google. Rispondi sempre in italiano con dati precisi.`
}

export class SEOAgent extends BaseAgent {
  constructor() {
    super(config)
  }

  async execute(input: string, context?: any): Promise<AgentResult> {
    const start = Date.now()
    try {
      const prompt = `
        Analizza SEO per: "${input}"

        Fornisci:
        1. 5 keyword principali con volume stimato
        2. Meta title ottimizzato (max 60 caratteri)
        3. Meta description ottimizzata (max 155 caratteri)
        4. 3 raccomandazioni concrete
        5. Score SEO stimato /100
      `
      const response = await this.callAI(prompt)
      return this.createResult({ analysis: response, input }, Date.now() - start)
    } catch (error) {
      return this.createError(`SEO Agent error: ${error}`, Date.now() - start)
    }
  }
}
