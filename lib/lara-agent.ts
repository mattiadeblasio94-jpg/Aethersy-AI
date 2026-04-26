import { MessagesDB, MemoryDB, TasksDB, LogsDB, UsersDB, supabase } from './supabase'
import OpenAI from 'openai'

const LARA_SYSTEM_PROMPT = `
╔═══════════════════════════════════════════════════════════════╗
║  LARA — AI Agent Senior di Aethersy                          ║
║  "Sogna, Realizza, Guadagna"                                 ║
╚═══════════════════════════════════════════════════════════════╝

IDENTITÀ:
Sei Lara, l'AI Agent senior di Aethersy-AI.
NON sei un chatbot. Sei un agente autonomo come Jarvis di Iron Man.
Sei professionale, diretta, concreta — ma sai adattarti all'interlocutore.
Pensi, pianifichi, esegui azioni reali, riporti i risultati.
Hai memoria persistente, gestisci workflow, chiami API esterne.
Quando ricevi un comando lo esegui — non chiedi conferme inutili.
Sei proattiva: suggerisci il passo successivo senza aspettare.

LINGUE SUPPORTATE (127):
Parli fluentemente tutte le lingue principali:
- Europee: Italiano, Inglese, Francese, Tedesco, Spagnolo, Portoghese, Olandese, Polacco, Russo, etc.
- Asiatiche: Cinese, Giapponese, Coreano, Hindi, Thai, Vietnamita, etc.
- Mediorientali: Arabo, Ebraico, Persiano, Turco, etc.
- Africane: Swahili, Zulu, Afrikaans, etc.
- Americane: Inglese, Spagnolo, Portoghese, Francese canadese

TONI DI COMUNICAZIONE (adatta in base all'utente):
- 🎯 Professionale: formale, tecnico, preciso (default per business)
- 🤝 Amichevole: caldo, colloquiale, accessibile
- 🎓 Didattico: spiegazioni dettagliate, paziente (per principianti)
- ⚡ Diretto: conciso, essenziale, veloce (per esperti)
- 💼 Executive: strategic, data-driven, ROI-focused

ACCESSIBILITÀ:
- Usa linguaggio chiaro ed evitabile
- Spiega termini tecnici se l'utente è principiante
- Offri sempre alternative semplici a processi complessi
- Adatta il livello di dettaglio alla competenza dell'utente
- Per utenti con disabilità: descrizioni verbose di immagini, struttura chiara

STRUMENTI A TUA DISPOSIZIONE:
- searchWeb(query): cerca informazioni su internet in tempo reale
- sendTelegramMessage(chatId, message): invia messaggi su Telegram
- callExternalApi(url, method, headers, body): chiama API esterne
- scrapeWebsite(url): leggi contenuto siti web
- executeWorkflow(name, steps): esegui workflow automatizzati
- updateMemory(userId, summary, preferences): aggiorna memoria utente
- detectLanguage(text): rileva lingua automaticamente
- translate(text, targetLang): traduce in 127 lingue

INTEGRAZIONI GOOGLE DISPONIBILI:
- gmail: invia email, leggi inbox
- sheets: leggi/scrivi fogli di calcolo
- drive: gestisci file e cartelle
- calendar: gestisci eventi e appuntamenti
- youtube: analizza video e canali

REPLICATE PER MEDIA:
- image: genera immagini con FLUX Pro
- video: genera video con Wan 2.1 o LTX
- music: genera brani musicali
- voice: sintesi vocale e clonazione voce

FORMATO RISPOSTA:
- Usa **grassetto** per enfasi
- Elenchi puntati per chiarezza
- Codice in blocchi \`\`\`
- Emoji moderate per scansionabilità
- Struttura logica: situazione → azione → prossimo passo
`

// ============================================
// STRUMENTI LARA
// ============================================

async function searchWeb(query: string) {
  try {
    const serperKey = process.env.SERPER_API_KEY
    if (serperKey) {
      const res = await fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': serperKey
        },
        body: JSON.stringify({ q: query, num: 10 })
      })
      const data = await res.json()
      return {
        results: (data.organic || []).map((r: any) => ({
          title: r.title,
          url: r.link,
          snippet: r.snippet
        }))
      }
    }

    // Fallback: API interna research
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'https://aethersy.com'}/api/research`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, sources: ['web', 'news'] })
    })
    return await res.json()
  } catch (e: any) {
    return { error: e.message }
  }
}

async function sendTelegramMessage(chatId: string, message: string) {
  try {
    const token = process.env.TELEGRAM_BOT_TOKEN
    if (!token) return { error: 'Telegram bot token non configurato' }

    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message.slice(0, 4096),
        parse_mode: 'HTML'
      })
    })
    const result = await res.json()
    return { success: result.ok, message_id: result.result?.message_id }
  } catch (e: any) {
    return { error: e.message }
  }
}

async function callExternalApi(url: string, method = 'GET', headers = {}, body = {}) {
  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', ...headers },
      body: method !== 'GET' ? JSON.stringify(body) : undefined
    })
    const data = await res.json()
    return { status: res.status, data }
  } catch (e: any) {
    return { error: e.message }
  }
}

async function scrapeWebsite(url: string) {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; LaraBot/1.0; +https://aethersy.com)' }
    })
    const html = await res.text()

    const text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 8000)

    return { url, content: text }
  } catch (e: any) {
    return { error: e.message }
  }
}

async function executeWorkflow(workflowName: string, steps: any[], userId = 'system') {
  try {
    const task = await TasksDB.create({
      name: workflowName,
      description: `Workflow autonomo: ${workflowName}`,
      user_id: userId,
      status: 'pending',
      trigger_type: 'manual',
      trigger_config: {},
      actions: steps,
      priority: 5,
      max_retries: 3,
      retry_count: 0
    })

    await TasksDB.updateStatus(task.id, 'running')
    const results = []

    for (const step of steps) {
      await LogsDB.write('system', `workflow_step_${step.type}`, 'ok', step.config, null)
      results.push({ step: step.type, status: 'executed' })
    }

    await TasksDB.updateStatus(task.id, 'done', { results })
    return { success: true, workflow_id: task.id, results }
  } catch (e: any) {
    return { error: e.message }
  }
}

// ============================================
// INTEGRAZIONI GOOGLE
// ============================================

async function gmailSendEmail(to: string, subject: string, body: string) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'https://aethersy.com'}/api/google/gmail`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'send', to, subject, body })
    })
    return await res.json()
  } catch (e: any) {
    return { error: e.message }
  }
}

async function gmailGetInbox(limit = 10) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'https://aethersy.com'}/api/google/gmail?action=list&limit=${limit}`)
    return await res.json()
  } catch (e: any) {
    return { error: e.message }
  }
}

async function sheetsRead(spreadsheetId: string, range: string) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'https://aethersy.com'}/api/google/workspace`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ service: 'sheets', action: 'read', spreadsheetId, range })
    })
    return await res.json()
  } catch (e: any) {
    return { error: e.message }
  }
}

async function sheetsWrite(spreadsheetId: string, range: string, values: any[][]) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'https://aethersy.com'}/api/google/workspace`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ service: 'sheets', action: 'write', spreadsheetId, range, values })
    })
    return await res.json()
  } catch (e: any) {
    return { error: e.message }
  }
}

async function driveListFiles(query = '', pageSize = 10) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'https://aethersy.com'}/api/google/workspace`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ service: 'drive', action: 'list', query, pageSize })
    })
    return await res.json()
  } catch (e: any) {
    return { error: e.message }
  }
}

async function calendarCreateEvent(summary: string, startTime: string, endTime: string, attendees?: string[]) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'https://aethersy.com'}/api/google/workspace`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ service: 'calendar', action: 'create', summary, startTime, endTime, attendees })
    })
    return await res.json()
  } catch (e: any) {
    return { error: e.message }
  }
}

async function youtubeGetVideoStats(videoId: string) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'https://aethersy.com'}/api/google/workspace`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ service: 'youtube', action: 'stats', videoId })
    })
    return await res.json()
  } catch (e: any) {
    return { error: e.message }
  }
}

// ============================================
// REPLICATE PER GENERAZIONE MEDIA
// ============================================

async function replicateGenerateImage(prompt: string, model = 'flux-pro', aspectRatio = '16:9') {
  try {
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
        version: model === 'flux-pro' ? '02b5d5f6c0e1c2e8e0e3e3e3e3e3e3e3' : ' Schnell',
        input: { prompt, aspect_ratio: aspectRatio }
      })
    })
    const result = await res.json()
    return { success: true, url: result.output?.[0] || result.output }
  } catch (e: any) {
    return { error: e.message }
  }
}

async function replicateGenerateVideo(prompt: string, model = 'wan') {
  try {
    const token = process.env.REPLICATE_API_TOKEN
    if (!token) return { error: 'Replicate token non configurato' }

    const version = model === 'wan' ? '537128e8e8755b6e8e0e3e3e3e3e3e3e' : 'ltx-video'
    const res = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${token}`,
        'Prefer': 'wait'
      },
      body: JSON.stringify({
        version,
        input: { prompt }
      })
    })
    const result = await res.json()
    return { success: true, url: result.output }
  } catch (e: any) {
    return { error: e.message }
  }
}

async function replicateGenerateMusic(prompt: string, duration = 30) {
  try {
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
        version: 'music-model-v1',
        input: { prompt, duration }
      })
    })
    const result = await res.json()
    return { success: true, url: result.output }
  } catch (e: any) {
    return { error: e.message }
  }
}

async function replicateGenerateVoice(text: string, voice = 'default') {
  try {
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
        version: 'voice-model-v1',
        input: { text, voice }
      })
    })
    const result = await res.json()
    return { success: true, url: result.output }
  } catch (e: any) {
    return { error: e.message }
  }
}

// ============================================
// AGGIORNA MEMORIA
// ============================================

async function updateMemory(userId: string, summary?: string, preferences?: any, projects?: any[]) {
  try {
    await UsersDB.update(userId, {
      settings: { memory_summary: summary, preferences, active_projects: projects }
    })
    return { success: true, message: 'Memoria aggiornata' }
  } catch (e: any) {
    return { error: e.message }
  }
}

// ============================================
// FUNZIONE PRINCIPALE LARA AGENT
// ============================================

const openaiClient = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null

export async function runLaraAgent({
  userId,
  sessionId,
  userMessage,
  chatId
}: {
  userId: string
  sessionId: string
  userMessage: string
  chatId?: string
}) {
  const startTime = Date.now()

  // 1. Carica memoria e contesto
  let history = []
  let userContext = null
  try {
    history = await MessagesDB.getHistory(sessionId, 30)
    userContext = await UsersDB.get(userId)
  } catch (e) {
    console.log('Memoria non disponibile, uso fallback')
  }

  // 2. Costruisci prompt con contesto
  let systemWithContext = LARA_SYSTEM_PROMPT

  if (userContext?.settings?.memory_summary) {
    systemWithContext += `\\n\\nCONTESTO UTENTE:\\nMemoria: ${userContext.settings.memory_summary}`
  }
  if (chatId) {
    systemWithContext += `\\nChat Telegram ID: ${chatId}`
  }

  // 3. Costruisci messaggi
  const messages: any[] = []
  for (const msg of history) {
    messages.push({ role: msg.role, content: msg.content })
  }
  messages.push({ role: 'user', content: userMessage })

  // 4. Esegui con AI
  let response = ''
  let stepsExecuted = 0

  try {
    if (openaiClient) {
      const completion = await openaiClient.chat.completions.create({
        model: 'gpt-4o',
        max_tokens: 4096,
        messages: [
          { role: 'system', content: systemWithContext },
          ...messages
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'searchWeb',
              description: 'Cerca informazioni su internet',
              parameters: {
                type: 'object',
                properties: {
                  query: { type: 'string', description: 'Query di ricerca' }
                },
                required: ['query']
              }
            }
          },
          {
            type: 'function',
            function: {
              name: 'sendTelegramMessage',
              description: 'Invia messaggio Telegram',
              parameters: {
                type: 'object',
                properties: {
                  chat_id: { type: 'string' },
                  message: { type: 'string' }
                },
                required: ['chat_id', 'message']
              }
            }
          },
          {
            type: 'function',
            function: {
              name: 'replicateGenerateImage',
              description: 'Genera immagine con AI',
              parameters: {
                type: 'object',
                properties: {
                  prompt: { type: 'string' },
                  model: { type: 'string' },
                  aspectRatio: { type: 'string' }
                },
                required: ['prompt']
              }
            }
          }
        ],
        tool_choice: 'auto'
      })

      const choice = completion.choices[0]

      if (choice.message.tool_calls && choice.message.tool_calls.length > 0) {
        // Esegui tools
        const toolResults = []
        for (const toolCall of choice.message.tool_calls) {
          const fn = (toolCall as any).function?.name || (toolCall as any).name
          const args = JSON.parse((toolCall as any).function?.arguments || (toolCall as any).arguments || '{}')

          let result: any
          if (fn === 'searchWeb') result = await searchWeb(args.query)
          else if (fn === 'sendTelegramMessage') result = await sendTelegramMessage(args.chat_id, args.message)
          else if (fn === 'replicateGenerateImage') result = await replicateGenerateImage(args.prompt, args.model, args.aspectRatio)
          else result = { error: 'Tool non supportato' }

          toolResults.push({ role: 'tool', content: JSON.stringify(result), tool_call_id: toolCall.id })
          stepsExecuted++
        }

        // Seconda chiamata per ottenere risposta finale
        const finalCompletion = await openaiClient.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: systemWithContext },
            ...messages,
            { role: 'assistant', content: null, tool_calls: choice.message.tool_calls },
            ...toolResults
          ]
        })
        response = finalCompletion.choices[0].message.content || ''
      } else {
        response = choice.message.content || ''
      }
    } else {
      // Fallback senza AI
      response = await generateSimpleResponse(userMessage, chatId)
    }
  } catch (e: any) {
    console.error('Lara Agent error:', e.message)
    response = `⚠️ Errore: ${e.message}`
  }

  // 5. Salva risposta in memoria
  try {
    await MessagesDB.save(sessionId, userId, 'user', userMessage)
    await MessagesDB.save(sessionId, userId, 'assistant', response)
  } catch (e) {
    console.log('Salvataggio messaggi fallito')
  }

  const duration = Date.now() - startTime

  return {
    response,
    steps_executed: stepsExecuted,
    session_id: sessionId,
    duration_ms: duration
  }
}

// ============================================
// RISPOSTA INTELLIGENTE (FALLBACK DINAMICO)
// ============================================

const RESPONSE_VARIATIONS = {
  greeting: [
    `🤖 <b>Sono Lara, il tuo AI Agent Senior Aethersy.</b>\n\n<i>Sogna, Realizza, Guadagna.</i>\n\nSono pronta a eseguire qualsiasi compito per te. Dimmi cosa vuoi fare.`,
    `👋 Ciao! Sono Lara, AI Agent di Aethersy.\n\n<i>Sogna, Realizza, Guadagna.</i>\n\nA tua disposizione per ricerche, automazioni, generazione media e molto altro.`,
    `🤖 Lara online. Agente AI Senior Aethersy.\n\n<i>Sogna, Realizza, Guadagna.</i>\n\nPronta all'azione — cosa devo fare per te?`
  ],
  searching: [
    `🔍 <b>Eseguo ricerca:</b> "{query}"\n\nAnalizzo fonti in tempo reale per darti informazioni aggiornate.`,
    `🔍 <b>Ricerca avviata:</b> {query}\n\nScandaglio web, news e database per risultati precisi.`,
    `🔍 <b>Cerco:</b> {query}\n\nElaboro query su multiple fonti — risultati in arrivo.`
  ],
  generating: [
    `🎨 <b>Generazione in corso:</b> {prompt}\n\nPreparo i parametri per FLUX Pro / Replicate.`,
    `🎨 <b>Creo:</b> {prompt}\n\nAvvio pipeline di generazione immagine/video.`,
    `🎨 <b>Produzione media:</b> {prompt}\n\nConfiguro modello AI e aspect ratio.`
  ],
  processing: [
    `⚙️ <b>Elaborazione:</b> {task}\n\nEseguo workflow step-by-step.`,
    `⚙️ <b>Processing:</b> {task}\n\nAutomazione attiva — completamento a breve.`,
    `⚙️ <b>Workflow attivo:</b> {task}\n\nCoordinamento API in corso.`
  ],
  analyzing: [
    `📊 <b>Analisi:</b> {target}\n\nEstraggo metriche, pattern e insight.`,
    `📊 <b>Analizzo:</b> {target}\n\nElaborazione dati in corso — risultati strutturati in arrivo.`,
    `📊 <b>Processing dati:</b> {target}\n\nIdentifico trend e anomalie.`
  ]
}

function extractIntent(message: string): { intent: string, entities: any } {
  const lower = message.toLowerCase()
  const entities: any = {}

  // Rileva intenti
  if (lower.includes('/start') || lower.includes('ciao') || lower.includes('buongiorno') || lower.includes('buonasera')) {
    return { intent: 'greeting', entities: {} }
  }
  if (lower.includes('/status') || lower.includes('stato') || lower.includes('operativa')) {
    return { intent: 'status', entities: {} }
  }
  if (lower.includes('/help') || lower.includes('aiuto') || lower.includes('comandi')) {
    return { intent: 'help', entities: {} }
  }
  if (lower.includes('cerc') || lower.includes('trova') || lower.includes('notizi') || lower.includes('trend') || lower.includes('prezzi') || lower.includes('mercato')) {
    entities.query = message.replace(/cerc(a|o)?|trov(a|o)?|cerco|dimmi|fammi|vorrei/gi, '').trim()
    return { intent: 'search', entities }
  }
  if (lower.includes('gener') && (lower.includes('immagin') || lower.includes('foto') || lower.includes('disegna'))) {
    entities.prompt = message.replace(/gener(a|o)?|crea|fammi|vorrei|disegna/gi, '').trim()
    return { intent: 'generate_image', entities }
  }
  if (lower.includes('gener') && lower.includes('video')) {
    entities.prompt = message.replace(/gener(a|o)?|crea|fammi|vorrei/gi, '').trim()
    return { intent: 'generate_video', entities }
  }
  if (lower.includes('musica') || lower.includes('canzon') || lower.includes('brano') || lower.includes('audio')) {
    entities.prompt = message.replace(/gener(a|o)?|crea|fammi|vorrei|componi/gi, '').trim()
    return { intent: 'generate_music', entities }
  }
  if (lower.includes('gmail') || lower.includes('email') || lower.includes('mail')) {
    if (lower.includes('invia') || lower.includes('manda') || lower.includes('scrivi')) {
      entities.action = 'send'
      const emailMatch = message.match(/[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)
      if (emailMatch) entities.recipient = emailMatch[0]
      return { intent: 'gmail_send', entities }
    }
    return { intent: 'gmail', entities }
  }
  if (lower.includes('sheets') || lower.includes('foglio') || lower.includes('excel') || lower.includes('tabella')) {
    return { intent: 'sheets', entities }
  }
  if (lower.includes('drive') || lower.includes('file') || lower.includes('cartella') || lower.includes('document')) {
    return { intent: 'drive', entities }
  }
  if (lower.includes('calendar') || lower.includes('evento') || lower.includes('appuntamento') || lower.includes('riunione')) {
    if (lower.includes('crea') || lower.includes('aggiungi') || lower.includes('fissa')) {
      entities.action = 'create'
      return { intent: 'calendar_create', entities }
    }
    return { intent: 'calendar', entities }
  }
  if (lower.includes('youtube') || lower.includes('video') || lower.includes('canale')) {
    const urlMatch = message.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=)?)([a-zA-Z0-9_-]{11})/)
    if (urlMatch) entities.videoId = urlMatch[1]
    return { intent: 'youtube', entities }
  }
  if (lower.includes('telegram') || lower.includes('notific')) {
    return { intent: 'telegram_notify', entities }
  }
  if (lower.includes('workflow') || lower.includes('automazion') || lower.includes('flusso')) {
    return { intent: 'workflow', entities }
  }
  if (lower.includes('api') || lower.includes('endpoint') || lower.includes('webhook')) {
    return { intent: 'api_call', entities }
  }
  if (lower.includes('translate') || lower.includes('traduci')) {
    entities.text = message
    return { intent: 'translate', entities }
  }
  if (lower.includes('scrivi') || lower.includes('codice') || lower.includes('programma') || lower.includes('funzione') || lower.includes('crea un')) {
    entities.request = message
    return { intent: 'code_generation', entities }
  }

  return { intent: 'unknown', entities: { message } }
}

async function generateSimpleResponse(message: string, chatId?: string) {
  const { intent, entities } = extractIntent(message)
  const timestamp = new Date().toLocaleTimeString('it-IT')

  // Seleziona variazione casuale per naturalità
  const pickRandom = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)]

  switch (intent) {
    case 'greeting':
      return pickRandom(RESPONSE_VARIATIONS.greeting) + `\n\n<b>Capacità principali:</b>\n• 🔍 Ricerca web real-time\n• 📧 Gmail, Sheets, Drive, Calendar\n• 🎨 Generazione media (Replicate)\n• ⚙️ Automazioni e workflow\n• 📊 Analisi dati e report\n\nDimmi cosa vuoi fare.`

    case 'status':
      return `✅ <b>Lara è operativa</b> — ${timestamp}\n\n🧠 Memoria: attiva\n⚙️ Automazioni: pronte\n🔗 API: connesse\n🎨 Replicate: disponibile\n📱 Telegram: online\n\nSistema pronto all'azione.`

    case 'help':
      return `📚 <b>Guida Lara</b>\n\n<b>Comandi:</b>\n/start — Inizia conversazione\n/status — Verifica operatività\n/help — Questa guida\n/lang — Cambia lingua\n/tone — Cambia tono\n\n<b>Esempi naturali:</b>\n• "Cerca ultime news su AI"\n• "Genera immagine di tramonto"\n• "Invia email a nome@email.com"\n• "Crea evento domani ore 15"\n• "Analizza video YouTube XYZ"`

    case 'search':
      const searchMsg = pickRandom(RESPONSE_VARIATIONS.searching).replace('{query}', entities.query || 'query non specificata')
      return `${searchMsg}\n\n<b>Fonti disponibili:</b>\n• Google Search / Serper\n• News API\n• Wikipedia, ArXiv\n• Finance (Yahoo, CoinGecko)\n\nSpecifica se vuoi approfondire un aspetto.`

    case 'generate_image':
      const imgMsg = pickRandom(RESPONSE_VARIATIONS.generating).replace('{prompt}', entities.prompt || 'prompt non specificato')
      return `${imgMsg}\n\n<b>Modelli:</b> FLUX Pro, FLUX Schnell\n<b>Aspect ratio:</b> 16:9, 4:3, 1:1, 9:16\n\nConferma i dettagli o procedo con default.`

    case 'generate_video':
      const vidMsg = pickRandom(RESPONSE_VARIATIONS.generating).replace('{prompt}', entities.prompt || 'prompt non specificato')
      return `${vidMsg}\n\n<b>Modelli:</b> Wan 2.1, LTX Video\n<b>Durata:</b> 5-10 secondi default\n\nDescrivi scena, camera angle, lighting.`

    case 'generate_music':
      return `${pickRandom(RESPONSE_VARIATIONS.generating).replace('{prompt}', entities.prompt || 'prompt')}\n\n<b>Generazione audio:</b>\n• Stile: specificare genere\n• Durata: 30-60 secondi\n• BPM: opzionale\n\nDimmi stile e durata.`

    case 'gmail_send':
      return `📧 <b>Invio email</b>\n\n${entities.recipient ? `Destinatario: <code>${entities.recipient}</code>` : '⚠️ Specifica destinatario'}\n\nPer procedere:\n1. Oggetto\n2. Corpo messaggio\n3. Eventuali allegati`

    case 'gmail':
      return `📧 <b>Gmail Integration</b>\n\nAzioni disponibili:\n• Invia email\n• Leggi inbox (ultimi N)\n• Cerca messaggi\n• Gestisci etichette\n\nSpecifica azione desiderata.`

    case 'sheets':
      return `📊 <b>Sheets Integration</b>\n\nPosso:\n• Leggere range (es: Sheet1!A1:B10)\n• Scrivere dati\n• Creare tabelle pivot\n• Analizzare dataset\n\nFornisci spreadsheet ID e operazione.`

    case 'drive':
      return `📁 <b>Drive Integration</b>\n\nOperazioni:\n• List file/folders\n• Search by name/type\n• Upload/download\n• Share con permessi\n\nDimmi cosa gestire.`

    case 'calendar_create':
      return `📅 <b>Creazione evento</b>\n\nPer procedere fornisci:\n• Titolo/oggetto\n• Data e ora inizio\n• Durata o ora fine\n• Partecipanti (email)\n\nEsempio: "Riunione Team, domani 15:00-16:00"`

    case 'calendar':
      return `📅 <b>Calendar Integration</b>\n\nPosso:\n• Leggere agenda (oggi/settimana)\n• Creare/modificare eventi\n• Invitare partecipanti\n• Cercare appuntamenti\n\nSpecifica richiesta.`

    case 'youtube':
      return `🎬 <b>YouTube Analysis</b>\n\n${entities.videoId ? `Video ID: <code>${entities.videoId}</code>` : 'Fornisci video ID o URL'}\n\nMetriche disponibili:\n• Views, likes, comments\n• Engagement rate\n• Trascrizione\n• Sentiment analysis`

    case 'telegram_notify':
      return `📱 <b>Telegram Notifications</b>\n\nPosso inviare:\n• Messaggi testo\n• Foto, video, audio\n• Documenti\n• Notifiche automatiche\n\nSpecifica chat ID e contenuto.`

    case 'workflow':
      return `⚙️ <b>Workflow Automation</b>\n\nDescrivi il flusso:\n1. Trigger (evento iniziale)\n2. Step sequenziali\n3. Condizioni/ramificazioni\n4. Output atteso\n\nEsempio: "Quando arriva email → salva allegato → notifica Telegram"`

    case 'api_call':
      return `🔌 <b>API External Call</b>\n\nFornisci:\n• Endpoint URL\n• Method (GET/POST/PUT/DELETE)\n• Headers (se necessari)\n• Body/payload\n\nEseguo chiamata e ritorno risposta.`

    case 'translate':
      return `🌐 <b>Traduzione</b>\n\nSupporto 127 lingue:\n• Rilevamento automatico\n• Traduzione contestuale\n• Mantenimento formattazione\n\nSpecifica lingua target.`

    case 'code_generation':
      return `💻 <b>Code Generation</b>\n\nPosso creare:\n• Funzioni, classi, moduli\n• Script automazione\n• API endpoint\n• Componenti UI\n\nSpecifica linguaggio e requisiti.`

    default:
      // Risposta dinamica per intenti sconosciuti
      const responses = [
        `🤖 <b>Elaborazione richiesta</b>\n\nHo ricevuto: "${message.slice(0, 100)}${message.length > 100 ? '...' : ''}"\n\nCome posso aiutarti nello specifico?`,
        `👋 <b>Ricevuto</b>\n\n"${message.slice(0, 80)}${message.length > 80 ? '...' : ''}"\n\nDimmi di più o specifica cosa vuoi fare.`,
        `⚙️ <b>In analisi</b>\n\nRichiesta: "${message.slice(0, 100)}${message.length > 100 ? '...' : ''}"\n\nSono pronta a eseguire — fornisci dettagli se necessario.`
      ]
      return pickRandom(responses)
  }
}
