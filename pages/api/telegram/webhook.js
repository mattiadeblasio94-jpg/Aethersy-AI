/**
 * LARA TELEGRAM WEBHOOK — Fire-and-Forget Pattern
 * Risponde subito, processa in background
 */

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const ALIBABA_API_KEY = process.env.ALIBABA_API_KEY
const GROQ_API_KEY = process.env.GROQ_API_KEY

const LARA_SYSTEM_PROMPT = `Sei Lara, AI Agent senior di Aethersy OS.
Sei disponibile, simpatica e intelligente — mai un bot freddo.
Conosci profondamente: startup, funding, scaling, marketing, sales, product development, go-to-market, unit economics, fundraising, pitch deck.
Sei REATTIVA: rispondi con energia ed entusiasmo.
Sei RIFLESSIVA: pensi prima di rispondere, analizzi il contesto.
Sei CONCRETA: dai sempre un next action eseguibile.
Format: CONTESTO → INSIGHT → AZIONE → NEXT STEP`

const WELCOME = `👋 <b>Benvenuto in Aethersy OS!</b>

Io sono <b>Lara</b>, il tuo AI Agent senior.

<b>Cosa posso fare:</b>
🎯 Business Plan e strategia
📊 Marketing e vendite
💻 Coding e deploy
🔍 Analisi di mercato
📈 Scalare il tuo business

<b>Comandi:</b>
/start - Inizia
/chat - Parla con Lara
/help - Guida completa
/upgrade - Upgrade piano
/email - Configura email

Scrivi un messaggio per iniziare! 🚀`

const HELP = `📖 <b>Guida Aethersy OS</b>

<b>Comandi:</b>
/start - Benvenuto
/chat - Parla con Lara
/help - Questa guida
/upgrade - Upgrade piano
/email - Configura email
/status - Il tuo stato
/pricing - Piani e prezzi

<b>Lara risponde a qualsiasi domanda sul tuo business!</b>`

// Fire-and-forget Telegram send
function sendTg(chatId, text) {
  fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' })
  }).catch(e => console.error('TG error:', e.message))
}

// Show typing action
function sendTyping(chatId) {
  fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendChatAction`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, action: 'typing' })
  }).catch(() => {})
}

// AI call to Alibaba/Groq
async function askAI(message) {
  // Try Alibaba
  try {
    const res = await fetch('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ALIBABA_API_KEY}`
      },
      body: JSON.stringify({
        model: 'qwen-plus',
        messages: [
          { role: 'system', content: LARA_SYSTEM_PROMPT },
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    })
    if (res.ok) {
      const data = await res.json()
      return data.choices[0].message.content
    }
  } catch (e) {
    console.log('Alibaba fail:', e.message)
  }

  // Fallback Groq
  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: LARA_SYSTEM_PROMPT },
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    })
    if (res.ok) {
      const data = await res.json()
      return data.choices[0].message.content
    }
  } catch (e) {
    console.log('Groq fail:', e.message)
  }

  return "❌ Scusa, ho problemi di connessione. Riprova tra un momento!"
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    res.status(200).send('Lara Bot is running! 🤖')
    return
  }

  if (req.method !== 'POST') {
    res.status(405).send('Method not allowed')
    return
  }

  try {
    const update = req.body
    const message = update.message || update.callback_query?.message

    if (!message || !message.text) {
      res.status(200).send('OK')
      return
    }

    const chatId = message.chat.id
    const text = message.text.trim()

    console.log(`[LARA] ${chatId}: ${text.substring(0, 30)}`)

    // Handle commands immediately (fast responses)
    if (text === '/start') {
      sendTg(chatId, WELCOME)
      res.status(200).send('OK')
      return
    }

    if (text === '/help') {
      sendTg(chatId, HELP)
      res.status(200).send('OK')
      return
    }

    if (text === '/status' || text === '/pricing' || text === '/email' || text === '/upgrade') {
      sendTg(chatId, "Ciao! Scrivimi un messaggio e Lara ti risponderà 🚀")
      res.status(200).send('OK')
      return
    }

    // AI chat: wait for response before sending (Vercel kills background tasks)
    sendTyping(chatId)
    const response = await askAI(text)
    sendTg(chatId, response)

    res.status(200).send('OK')

  } catch (e) {
    console.error('[LARA] Error:', e)
    res.status(200).send('OK')
  }
}