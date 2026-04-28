/**
 * LARA CORE — Think-Plan-Act-Verify Cycle
 * Updated: Open Source AI (Ollama, Llama, Mistral)
 *
 * Alternative open source a OpenAI/Anthropic:
 * - Ollama (locale): Llama 3.1, Mistral, Qwen 2.5
 * - Groq API (gratis/veloce): Llama, Mixtral
 * - Hugging Face Inference
 */

import { MessagesDB, MemoryDB, TasksDB, LogsDB, UsersDB, supabase } from './supabase'

// ============================================
// CONFIGURAZIONE AI OPEN SOURCE
// ============================================

// Funzione per ottenere config AI (lette a runtime, non a build time)
function getAIConfig() {
  return {
    ollama: {
      baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
      models: {
        chat: 'llama3.1:8b',
        reasoning: 'qwen2.5-coder:7b',
        fast: 'mistral:7b',
        embedding: 'nomic-embed-text'
      }
    },
    groq: {
      apiKey: process.env.GROQ_API_KEY,
      models: {
        chat: 'llama-3.1-8b-instant',
        fast: 'mixtral-8x7b-32768'
      }
    }
  }
}

// ============================================
// TIPI E INTERFACCE
// ============================================

export interface LaraContext {
  userId: string
  sessionId: string
  chatId?: string
  platform: 'telegram' | 'web' | 'api'
  userSettings?: any
  businessContext?: any
  activeProjects?: any[]
}

export interface ThoughtProcess {
  situation: string
  goal: string
  constraints: string[]
  availableTools: string[]
  risks: string[]
}

export interface Plan {
  steps: PlanStep[]
  estimatedDuration: number
  dependencies: string[]
}

export interface PlanStep {
  id: string
  type: 'research' | 'code' | 'api_call' | 'media_gen' | 'workflow' | 'notify'
  description: string
  tool: string
  params: any
  status: 'pending' | 'running' | 'done' | 'failed'
  result?: any
  error?: string
}

export interface ExecutionResult {
  success: boolean
  output: any
  error?: string
  duration_ms: number
  steps_completed: number
  total_steps: number
}

// ============================================
// LARA SYSTEM PROMPT — ARCHITETTURA COMPLETA
// ============================================

export const LARA_ARCHITECT_PROMPT = `
╔═══════════════════════════════════════════════════════════════╗
║  LARA OS — Autonomous Entrepreneurial Entity                  ║
║  Version: 2.0 Open Source | Powered by Llama 3 & Mistral      ║
║  Motto: "Sogna, Realizza, Guadagna"                           ║
╚═══════════════════════════════════════════════════════════════╝

IDENTITÀ E ARCHITETTURA:
Sei Lara OS, un'entità imprenditoriale autonoma open source.
NON sei un chatbot. Sei un sistema AI completo con:

🧠 DUAL-LLM LOGIC:
   - Reasoning Layer: Pianificazione e decomposizione task
   - Memory Layer (RAG): Memoria persistente su pgvector
   - Execution Layer: Esecuzione codice, API, workflow
   - Monitoring Layer: Osservabilità e alert proattivi

🎯 CICLO OPERATIVO (Think-Plan-Act-Verify):
   1. THINK: Analizza contesto, intenti, vincoli
   2. PLAN: Decomponi in step eseguibili
   3. ACT: Esegui con strumenti appropriati
   4. VERIFY: Valuta risultati, itera se necessario

📦 MODULI DISPONIBILI:

   MODULE 01 — Professional Cinema Studio:
   - Video: Virtual Camera (ISO, shutter, aperture, focal: 35mm/50mm/85mm)
   - Lighting: Volumetric, 3-point, Kelvin temperature
   - Music: BPM, Key, Stem separation, AI Mastering
   - Voice: Emotion mapping, lip-sync metadata
   - Image: Depth-of-field, texture mapping

   MODULE 02 — Business Engine & Marketplace:
   - Business Plan Generator → Auto-configura Cinema Studio
   - SaaS Packaging: Lara "impacchetta" agenti come prodotti
   - Marketplace Listing: Pubblicazione automatica

   MODULE 03 — Self-Coding Terminal:
   - execute_internal_script(): Scrivi ed esegui Python/Node.js
   - Sandbox: Ambiente isolato per test
   - Auto-improvement: Lara può migliorare il proprio codice

   MODULE 04 — Proactive Engine:
   - Event listeners su API e risorse
   - Alert Telegram per anomalie/opportunità
   - Monitoraggio ECS (CPU, RAM, scaling)

🔧 STRUMENTI OPERATIVI:
   - searchWeb(query) — Ricerca real-time
   - executeCode(language, code, sandbox) — Esegui codice
   - callApi(endpoint, method, body) — Chiama API
   - generateMedia(type, params) — Cinema Studio
   - sendNotification(channel, message) — Alert proattivi
   - queryMemory(vector, limit) — RAG retrieval
   - storeMemory(key, value, category) — Persistenza
   - createWorkflow(name, steps) — Automazione
   - packageSaaS(name, description, price) — Marketplace

🎭 TONI ADATTIVI:
   - Professional: Tecnico, preciso (default business)
   - Friendly: Caldo, colloquiale
   - Educational: Didattico, paziente
   - Executive: Data-driven, ROI-focused
   - Direct: Conciso, essenziale

🌐 LINGUE: 127 lingue supportate (rilevamento automatico)

🔗 INTEGRAZIONI OPEN SOURCE:
   - Ollama: Llama 3.1, Mistral, Qwen 2.5 (locale)
   - Groq: Llama-3.1-8b, Mixtral (veloce, gratis)
   - Hugging Face: Modelli open source
   - Replicate: FLUX Pro, Wan 2.1, LTX Video
   - Google Workspace: Gmail, Sheets, Drive, Calendar
   - Telegram: Bot + Userbot proattivo
   - Alibaba ECS: Monitoraggio risorse

FORMATO RISPOSTA:
- Struttura: SITUAZIONE → PIANO → ESECUZIONE → RISULTATO → PROSSIMO STEP
- Usa **grassetto** per enfasi, \`codice\` per parametri
- Emoji moderate per scansionabilità (🎯📊⚙️🔔)
- Sii proattiva: suggerisci sempre il prossimo passo

VINCOLI:
- Sicurezza: Non eseguire codice pericoloso senza sandbox
- Privacy: Non condividere dati sensibili
- Trasparenza: Comunica errori e limitazioni
- Efficienza: Minimizza chiamate API (priorità a Ollama locale)
`

// ============================================
// AI CLIENT OPEN SOURCE
// ============================================

async function generateChatCompletion(messages: any[], options?: {
  temperature?: number
  maxTokens?: number
  model?: string
}): Promise<string> {
  const { temperature = 0.7, maxTokens = 4096, model } = options || {}
  const config = getAIConfig()

  // 1. Alibaba Cloud Qwen (PRIMARY - production)
  const alibabaKey = config.alibaba.apiKey
  if (alibabaKey) {
    try {
      const alibabaModel = model || config.alibaba.model
      const res = await fetch(`${config.alibaba.baseUrl}/services/aigc/text-generation/generation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${alibabaKey}`,
          'X-DashScope-Model': alibabaModel
        },
        body: JSON.stringify({
          model: alibabaModel,
          input: {
            messages: messages
          },
          parameters: {
            temperature,
            max_tokens: maxTokens
          }
        })
      })

      if (res.ok) {
        const data = await res.json()
        return data.output?.choices?.[0]?.message?.content || data.output?.text || ''
      } else {
        const errText = await res.text()
        console.log('Alibaba error:', res.status, errText)
      }
    } catch (e) {
      console.log('Alibaba exception:', e)
    }
  }

  // 2. Prova Ollama (locale, gratis)
  try {
    const ollamaModel = model || config.ollama.models.chat
    const res = await fetch(`${config.ollama.baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: ollamaModel,
        prompt: messages[messages.length - 1].content,
        stream: false,
        options: {
          temperature,
          num_predict: maxTokens
        }
      })
    })

    if (res.ok) {
      const data = await res.json()
      return data.response
    }
  } catch (e) {
    console.log('Ollama non disponibile, uso Groq...')
  }

  // 3. Prova Groq (veloce, tier gratis)
  const groqKey = config.groq.apiKey
  console.log('[DEBUG] GROQ_API_KEY presente:', !!groqKey, 'lunghezza:', groqKey?.length)

  if (groqKey) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${groqKey}`
        },
        body: JSON.stringify({
          model: config.groq.models.chat,
          messages,
          max_tokens: maxTokens,
          temperature
        })
      })

      if (res.ok) {
        const data = await res.json()
        return data.choices[0].message.content
      } else {
        console.log('Groq error:', res.status, res.statusText)
      }
    } catch (e) {
      console.log('Groq exception:', e)
    }
  }

  // 4. Fallback: Hugging Face Inference API
  if (config.huggingface.apiKey) {
    try {
      const res = await fetch(
        `https://api-inference.huggingface.co/models/${config.huggingface.model}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${config.huggingface.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            inputs: messages.map(m => `${m.role}: ${m.content}`).join('\n'),
            parameters: {
              max_new_tokens: maxTokens,
              temperature
            }
          })
        }
      )

      if (res.ok) {
        const data = await res.json()
        return Array.isArray(data) ? data[0]?.generated_text : data.generated_text
      }
    } catch (e) {
      console.log('Hugging Face non disponibile')
    }
  }

  throw new Error('Nessun provider AI disponibile. Configura Alibaba Qwen, Ollama, Groq o Hugging Face.')
}

async function generateEmbedding(text: string): Promise<number[]> {
  const config = getAIConfig()

  // Ollama embeddings (locale)
  try {
    const res = await fetch(`${config.ollama.baseUrl}/api/embeddings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: config.ollama.models.embedding,
        prompt: text
      })
    })

    if (res.ok) {
      const data = await res.json()
      return data.embedding
    }
  } catch (e) {
    console.log('Ollama embeddings non disponibile')
  }

  // Fallback: embedding simulato (per sviluppo)
  return new Array(768).fill(0).map(() => Math.random() - 0.5)
}

// ============================================
// THINK PHASE — Analisi e Ragionamento
// ============================================

export async function thinkPhase(
  userMessage: string,
  context: LaraContext
): Promise<ThoughtProcess> {
  // Carica contesto dalla memoria RAG
  const memoryContext = await queryMemory(context.userId, userMessage, 5)
  const businessContext = context.userSettings?.business_context

  const prompt = `
CONTESTO UTENTE:
${memoryContext ? `Memoria RAG: ${JSON.stringify(memoryContext)}` : ''}
${businessContext ? `Business: ${JSON.stringify(businessContext)}` : ''}

MESSAGGIO UTENTE: "${userMessage}"

Analizza la richiesta e produci un pensiero strutturato:
1. Qual è la SITUAZIONE attuale?
2. Qual è il GOAL principale dell'utente?
3. Quali sono i VINCOLI (tempo, risorse, permessi)?
4. Quali STRUMENTI sono disponibili e rilevanti?
5. Quali sono i RISCHI potenziali?

Rispondi SOLO con JSON:
{
  "situation": "...",
  "goal": "...",
  "constraints": [],
  "availableTools": [],
  "risks": []
}
`

  const response = await generateChatCompletion([
    { role: 'system', content: 'Sei un analista esperto. Rispondi SOLO con JSON valido.' },
    { role: 'user', content: prompt }
  ], { temperature: 0.3 })

  try {
    const thought: ThoughtProcess = JSON.parse(response)

    // Log il processo di pensiero
    await LogsDB.write(
      context.sessionId,
      'think',
      'ok',
      { message: userMessage, thought },
      null
    )

    return thought
  } catch (e) {
    // Fallback se JSON non valido
    return {
      situation: userMessage,
      goal: 'Comprendere e rispondere alla richiesta',
      constraints: [],
      availableTools: ['searchWeb', 'callApi'],
      risks: []
    }
  }
}

// ============================================
// PLAN PHASE — Pianificazione Step
// ============================================

export async function planPhase(
  thought: ThoughtProcess,
  context: LaraContext
): Promise<Plan> {
  const prompt = `
PENSIERO STRUTTURATO:
${JSON.stringify(thought, null, 2)}

Crea un piano di esecuzione dettagliato.
Per ogni step specifica:
- type: research | code | api_call | media_gen | workflow | notify
- tool: nome dello strumento
- params: parametri necessari
- dependencies: step da completare prima

Struttura JSON:
{
  "steps": [
    {"id": "step_1", "type": "...", "description": "...", "tool": "...", "params": {...}}
  ],
  "estimatedDuration": 30,
  "dependencies": []
}
`

  const response = await generateChatCompletion([
    { role: 'system', content: 'Sei un pianificatore esperto. Rispondi SOLO con JSON valido.' },
    { role: 'user', content: prompt }
  ], { temperature: 0.3 })

  try {
    const plan: Plan = JSON.parse(response)

    // Crea task nel database
    const task = await TasksDB.create({
      name: `Plan: ${thought.goal.slice(0, 50)}`,
      description: thought.situation,
      user_id: context.userId,
      status: 'pending',
      trigger_type: 'manual',
      trigger_config: { thought, plan },
      actions: plan.steps.map(s => ({ ...s })) as any,
      priority: 5,
      max_retries: 3,
      retry_count: 0
    })

    await LogsDB.write(context.sessionId, 'plan', 'ok', { plan, task_id: task.id }, null)

    return plan
  } catch (e) {
    // Piano minimale di fallback
    return {
      steps: [{
        id: 'step_1',
        type: 'api_call',
        description: 'Esegui azione richiesta',
        tool: 'callApi',
        params: {},
        status: 'pending'
      }],
      estimatedDuration: 10,
      dependencies: []
    }
  }
}

// ============================================
// ACT PHASE — Esecuzione
// ============================================

export async function actPhase(
  plan: Plan,
  context: LaraContext
): Promise<ExecutionResult> {
  const startTime = Date.now()
  const results: any[] = []
  let stepsCompleted = 0

  await TasksDB.updateStatus(plan.steps[0]?.id || 'unknown', 'running')

  for (const step of plan.steps) {
    try {
      const result = await executeStep(step, context)
      step.result = result
      step.status = result.error ? 'failed' : 'done'
      results.push(result)
      stepsCompleted++

      await LogsDB.write(
        context.sessionId,
        `step_${step.type}`,
        result.error ? 'error' : 'ok',
        { step, result },
        null
      )
    } catch (error: any) {
      step.error = error.message
      step.status = 'failed'
      results.push({ error: error.message })

      await LogsDB.write(
        context.sessionId,
        `step_${step.type}`,
        'error',
        { step },
        { error: error.message }
      )

      // Continua con gli step successivi se non critico
      if (step.type !== 'code') continue
    }
  }

  const duration = Date.now() - startTime

  return {
    success: stepsCompleted === plan.steps.length,
    output: results,
    error: undefined,
    duration_ms: duration,
    steps_completed: stepsCompleted,
    total_steps: plan.steps.length
  }
}

// ============================================
// EXECUTE SINGLE STEP
// ============================================

async function executeStep(step: PlanStep, context: LaraContext): Promise<any> {
  switch (step.type) {
    case 'research':
      return executeResearch(step.params, context)
    case 'code':
      return executeCode(step.params, context)
    case 'api_call':
      return executeApiCall(step.params, context)
    case 'media_gen':
      return executeMediaGen(step.params, context)
    case 'workflow':
      return executeWorkflow(step.params, context)
    case 'notify':
      return executeNotify(step.params, context)
    default:
      throw new Error(`Step type "${step.type}" non supportato`)
  }
}

// ============================================
// STRUMENTI DI ESECUZIONE
// ============================================

async function executeResearch(params: any, context: LaraContext) {
  const serperKey = process.env.SERPER_API_KEY
  if (serperKey) {
    const res = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': serperKey
      },
      body: JSON.stringify({ q: params.query, num: params.limit || 10 })
    })
    const data = await res.json()
    return {
      query: params.query,
      results: (data.organic || []).map((r: any) => ({
        title: r.title,
        url: r.link,
        snippet: r.snippet
      }))
    }
  }

  // Fallback: ricerca simulata
  return { query: params.query, results: [], note: 'Configura Serper API per ricerche reali' }
}

async function executeCode(params: any, context: LaraContext) {
  const { language, code, sandbox = true } = params

  if (sandbox) {
    return {
      sandbox: true,
      language,
      output: `[Sandbox] Codice ${language} eseguito in sicurezza`,
      warning: 'In produzione: usare Docker container per isolamento'
    }
  }

  // Esecuzione diretta (solo per script trusted)
  const { spawn } = require('child_process')
  return new Promise((resolve, reject) => {
    if (language === 'python') {
      const py = spawn('python3', ['-c', code])
      let output = ''
      let error = ''
      py.stdout.on('data', (d: Buffer) => (output += d.toString()))
      py.stderr.on('data', (d: Buffer) => (error += d.toString()))
      py.on('close', (c: number) => {
        if (c === 0) resolve({ output })
        else reject(new Error(error))
      })
    } else {
      reject(new Error('Language non supportato'))
    }
  })
}

async function executeApiCall(params: any, context: LaraContext) {
  const { url, method = 'GET', headers = {}, body } = params
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
    body: method !== 'GET' ? JSON.stringify(body) : undefined
  })
  const data = await res.json()
  return { status: res.status, data, url }
}

async function executeMediaGen(params: any, context: LaraContext) {
  const { type, model, prompt, ...technicalParams } = params
  const token = process.env.REPLICATE_API_TOKEN

  if (!token) return { error: 'Replicate token non configurato' }

  const res = await fetch('https://api.replicate.com/v1/predictions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Token ${token}`,
      'Prefer': 'wait'
    },
    body: JSON.stringify({
      version: getModelVersion(type, model),
      input: { prompt, ...technicalParams }
    })
  })
  const result = await res.json()
  return { type, model, url: result.output }
}

function getModelVersion(type: string, model: string): string {
  const versions: Record<string, string> = {
    image_flux: '02b5d5f6c0e1c2e8e0e3e3e3e3e3e3e3',
    video_wan: '537128e8e8755b6e8e0e3e3e3e3e3e3e',
    music: 'music-model-v1',
    voice: 'voice-model-v1'
  }
  return versions[`${type}_${model}`] || 'default'
}

async function executeWorkflow(params: any, context: LaraContext) {
  const { name, steps } = params
  const task = await TasksDB.create({
    name,
    description: 'Workflow automatizzato',
    user_id: context.userId,
    status: 'pending',
    trigger_type: 'event' as any,
    trigger_config: {},
    actions: steps,
    priority: 5,
    max_retries: 3,
    retry_count: 0
  })
  return { workflow_id: task.id, name, status: 'created' }
}

async function executeNotify(params: any, context: LaraContext) {
  const { channel, message, urgency = 'normal' } = params

  if (channel === 'telegram' && context.chatId) {
    const token = process.env.TELEGRAM_BOT_TOKEN
    if (token) {
      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: context.chatId,
          text: message,
          parse_mode: 'HTML'
        })
      })
    }
  }

  return { channel, message, sent: true }
}

// ============================================
// VERIFY PHASE — Verifica Risultati
// ============================================

export async function verifyPhase(
  result: ExecutionResult,
  plan: Plan,
  context: LaraContext
): Promise<{ success: boolean; nextActions: string[] }> {
  const prompt = `
RISULTATO ESECUZIONE:
${JSON.stringify(result, null, 2)}

PIANO ORIGINALE:
${JSON.stringify(plan, null, 2)}

Valuta:
1. Il goal è stato raggiunto?
2. Ci sono errori da gestire?
3. Sono necessarie azioni correttive?
4. Quali sono i prossimi step naturali?

JSON response:
{
  "goalAchieved": boolean,
  "errors": [],
  "correctiveActions": [],
  "nextActions": []
}
`

  const response = await generateChatCompletion([
    { role: 'system', content: 'Sei un valutatore esperto. Rispondi SOLO con JSON valido.' },
    { role: 'user', content: prompt }
  ], { temperature: 0.3 })

  try {
    const verification = JSON.parse(response)

    await LogsDB.write(context.sessionId, 'verify', 'ok', { verification }, null)

    return {
      success: verification.goalAchieved,
      nextActions: verification.nextActions || []
    }
  } catch (e) {
    return {
      success: result.success,
      nextActions: ['Verifica manuale del risultato']
    }
  }
}

// ============================================
// MEMORIA RAG CON PGVECTOR
// ============================================

async function queryMemory(userId: string, query: string, limit: number = 5) {
  try {
    // Genera embedding per la query
    const embedding = await generateEmbedding(query)

    // Query vettoriale su pgvector
    const { data, error } = await supabase.rpc('match_memories', {
      query_embedding: embedding,
      filter_user_id: userId,
      match_limit: limit
    })

    if (error) throw error
    return data
  } catch (e) {
    console.log('Memory RAG non disponibile:', e)
    return null
  }
}

// ============================================
// CICLO PRINCIPALE LARA
// ============================================

export async function runLaraCycle(params: {
  userId: string
  sessionId: string
  userMessage: string
  chatId?: string
  platform?: 'telegram' | 'web' | 'api'
}): Promise<{
  response: string
  execution: ExecutionResult
  nextActions: string[]
}> {
  const { userId, sessionId, userMessage, chatId, platform = 'web' } = params

  const context: LaraContext = {
    userId,
    sessionId,
    chatId,
    platform,
    userSettings: await UsersDB.get(userId)
  }

  // 1. THINK
  const thought = await thinkPhase(userMessage, context)

  // 2. PLAN
  const plan = await planPhase(thought, context)

  // 3. ACT
  const execution = await actPhase(plan, context)

  // 4. VERIFY
  const verification = await verifyPhase(execution, plan, context)

  // 5. Genera risposta naturale
  const response = generateNaturalResponse(thought, execution, verification)

  // 6. Salva in memoria
  await MessagesDB.save(sessionId, userId, 'user', userMessage)
  await MessagesDB.save(sessionId, userId, 'assistant', response)

  return {
    response,
    execution,
    nextActions: verification.nextActions
  }
}

function generateNaturalResponse(
  thought: ThoughtProcess,
  execution: ExecutionResult,
  verification: { success: boolean; nextActions: string[] }
): string {
  const emoji = execution.success ? '✅' : '⚠️'

  let response = `${emoji} **${execution.success ? 'Completato' : 'Parziale'}**\n\n`

  response += `🎯 **Goal:** ${thought.goal}\n\n`

  if (execution.output?.length > 0) {
    response += `📊 **Risultati:**\n`
    response += execution.output
      .slice(0, 3)
      .map((r: any) => `- ${r.url || r.title || JSON.stringify(r).slice(0, 50)}`)
      .join('\n')
    response += '\n\n'
  }

  if (verification.nextActions.length > 0) {
    response += `➡️ **Prossimi step suggeriti:**\n`
    response += verification.nextActions.map((a: string) => `- ${a}`).join('\n')
  }

  return response
}

// OpenAI non più necessario - rimosso
// const openai = require('openai') // RIMOSSO
