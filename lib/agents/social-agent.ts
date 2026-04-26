import { BaseAgent } from './base-agent'
import { AgentConfig, AgentResult } from '../../types/agent'

const config: AgentConfig = {
  id: 'social',
  name: 'Social Agent',
  description: 'Crea contenuti e strategie per i social media',
  icon: '📱',
  color: 'purple',
  capabilities: ['content creation', 'hashtag strategy', 'posting schedule', 'engagement'],
  systemPrompt: `Sei un Social Media Manager esperto. Crea contenuti
  virali, strategie di engagement e calendari editoriali ottimizzati
  per ogni piattaforma. Rispondi sempre in italiano.`
}

export class SocialAgent extends BaseAgent {
  constructor() {
    super(config)
  }

  async execute(input: string, context?: any): Promise<AgentResult> {
    const start = Date.now()
    try {
      const prompt = `
        Strategia social media per: "${input}"

        Fornisci:
        1. Post ottimizzato per Instagram (con emoji e hashtag)
        2. Post ottimizzato per LinkedIn (tono professionale)
        3. Post ottimizzato per TikTok (hook + script)
        4. 10 hashtag strategici
        5. Miglior orario di pubblicazione per ogni piattaforma
      `
      const response = await this.callAI(prompt)
      return this.createResult({ analysis: response, input }, Date.now() - start)
    } catch (error) {
      return this.createError(`Social Agent error: ${error}`, Date.now() - start)
    }
  }
}
