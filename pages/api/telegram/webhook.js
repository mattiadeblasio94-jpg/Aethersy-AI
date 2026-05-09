/**
 * LARA TELEGRAM WEBHOOK — Integrato con Skills & Credit System
 * Risponde su Telegram, sync su piattaforma, traccia crediti
 */

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY
const GROQ_API_KEY = process.env.GROQ_API_KEY

const LARA_SYSTEM_PROMPT = `Sei Lara, AI Agent senior di Aethersy OS.
Sei disponibile, simpatica e intelligente — mai un bot freddo.
Conosci profondamente: startup, funding, scaling, marketing, sales, product development.
Sei REATTIVA, RIFLESSIVA e CONCRETA.
Format: CONTESTO → INSIGHT → AZIONE → NEXT STEP`

const WELCOME = `👋 <b>Benvenuto in Aethersy OS!</b>

Io sono <b>Lara</b>, il tuo AI Agent senior.

<b>Cosa posso fare:</b>
🎯 Business Plan e strategia
📊 Marketing e vendite
💻 Coding e deploy
🔍 Analisi di mercato
📈 Scalare il tuo business
📧 Email AI
📄 PDF extraction
🔍 SEO analysis
🌐 Web search

<b>Comandi:</b>
/start - Inizia
/help - Guida
/skills - Lista competenze
/status - Il tuo stato
/usage - Consumo crediti
/upgrade - Upgrade piano

Scrivi un messaggio per iniziare! 🚀`

const HELP = `📖 <b>Guida Aethersy OS</b>

<b>Comandi:</b>
/start - Benvenuto
/skills - Lista competenze
/status - Verifica operatività
/usage - Consumo crediti
/help - Questa guida
/upgrade - Upgrade piano

<b>Esempi:</b>
• "Cerca ultime news su AI"
• "Analizza SEO di example.com"
• "Scrivi email per cliente"
• "Genera codice Python per..."

<b>Piattaforma:</b>
https://aethersy.com`

// Invio Telegram
function sendTg(chatId, text, options = {}) {
  fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: text.slice(0, 4000),
      parse_mode: options.parseMode || 'HTML',
      reply_markup: options.replyMarkup
    })
  }).catch(e => console.error('TG error:', e.message))
}

// Show typing
function sendTyping(chatId) {
  fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendChatAction`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, action: 'typing' })
  }).catch(() => {})
}

// AI con multi-model
async function askAI(message, userId = 'telegram') {
  if (OPENROUTER_API_KEY) {
    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'HTTP-Referer': 'https://aethersy.com',
          'X-Title': 'Lara Telegram Bot'
        },
        body: JSON.stringify({
          model: 'qwen/qwen-2.5-72b-instruct',
          messages: [
            { role: 'system', content: LARA_SYSTEM_PROMPT },
            { role: 'user', content: message }
          ],
          temperature: 0.7,
          max_tokens: 1500
        })
      })
      if (res.ok) {
        const data = await res.json()
        const content = data.choices?.[0]?.message?.content
        const usage = data.usage || { total_tokens: 0 }
        return { content, usage, model: 'qwen-2.5-72b', source: 'openrouter' }
      }
    } catch (e) {
      console.log('OpenRouter fail:', e.message)
    }
  }

  if (GROQ_API_KEY) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: 'llama-3.1-70b-versatile',
          messages: [
            { role: 'system', content: LARA_SYSTEM_PROMPT },
            { role: 'user', content: message }
          ],
          temperature: 0.7,
          max_tokens: 1500
        })
      })
      if (res.ok) {
        const data = await res.json()
        return {
          content: data.choices[0].message.content,
          usage: data.usage || { total_tokens: 0 },
          model: 'llama-3.1-70b',
          source: 'groq'
        }
      }
    } catch (e) {
      console.log('Groq fail:', e.message)
    }
  }

  return { content: "❌ Scusa, ho problemi di connessione. Riprova!", usage: { total_tokens: 0 }, model: 'none', source: 'error' }
}

// Tastiera inline per skills
const SKILLS_KEYBOARD = {
  inline_keyboard: [
    [
      { text: '🔍 Web Search', callback_data: 'skill:web_search' },
      { text: '📧 Email AI', callback_data: 'skill:email_writer' }
    ],
    [
      { text: '📄 PDF Extract', callback_data: 'skill:pdf_extractor' },
      { text: '🔍 SEO Analyzer', callback_data: 'skill:seo_analyzer' }
    ],
    [
      { text: '💻 Code Gen', callback_data: 'skill:code_generator' },
      { text: '📊 Finance', callback_data: 'skill:finance_analyzer' }
    ],
    [
      { text: '📈 Usage', callback_data: 'cmd:usage' },
      { text: '💎 Upgrade', callback_data: 'cmd:upgrade' }
    ]
  ]
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
    const callbackQuery = update.callback_query

    // Handle callback query (inline buttons)
    if (callbackQuery) {
      const chatId = callbackQuery.message.chat.id
      const data = callbackQuery.data

      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callback_query_id: callbackQuery.id })
      })

      if (data.startsWith('skill:')) {
        const skillId = data.replace('skill:', '')
        sendTg(chatId, `🎯 Hai selezionato: <b>${skillId}</b>\n\nUsa la piattaforma per eseguire questa skill:\nhttps://aethersy.com/skills`, { parseMode: 'HTML' })
        res.status(200).send('OK')
        return
      }

      if (data.startsWith('cmd:')) {
        const cmd = data.replace('cmd:', '')
        if (cmd === 'usage') {
          sendTg(chatId, `📊 <b>Usage Dashboard</b>\n\nhttps://aethersy.com/usage\n\nVisualizza crediti, token e consumi in tempo reale.`, { parseMode: 'HTML' })
        } else if (cmd === 'upgrade') {
          sendTg(chatId, `💎 <b>Upgrade Piano</b>\n\n• Pro: $29/mese\n• Business: $99/mese\n• Enterprise: $499/mese\n\nhttps://aethersy.com/pricing`, { parseMode: 'HTML' })
        }
        res.status(200).send('OK')
        return
      }

      res.status(200).send('OK')
      return
    }

    if (!message || !message.text) {
      res.status(200).send('OK')
      return
    }

    const chatId = message.chat.id
    const userId = message.from?.id?.toString() || 'telegram-anon'
    const text = message.text.trim()

    console.log(`[LARA Telegram] ${userId}: ${text.substring(0, 30)}`)

    // Sync messaggio alla piattaforma
    try {
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'https://aethersy.com'}/api/telegram/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send',
          userId,
          chatId: chatId.toString(),
          message: text,
          platform: 'telegram'
        })
      })
    } catch (e) {
      console.log('Sync failed:', e.message)
    }

    // Handle commands
    if (text === '/start') {
      sendTg(chatId, WELCOME, { replyMarkup: SKILLS_KEYBOARD })
      res.status(200).send('OK')
      return
    }

    if (text === '/help') {
      sendTg(chatId, HELP, { parseMode: 'HTML' })
      res.status(200).send('OK')
      return
    }

    if (text === '/skills') {
      sendTg(chatId, `🎯 <b>Skills Disponibili</b>\n\n• 🔍 Web Search\n• 📧 Email Writer\n• 📄 PDF Extractor\n• 🔍 SEO Analyzer\n• 💻 Code Generator\n• 📊 Finance Analyzer\n• 🌐 Translator\n• 📱 Social Generator\n\nhttps://aethersy.com/skills`, { parseMode: 'HTML', replyMarkup: SKILLS_KEYBOARD })
      res.status(200).send('OK')
      return
    }

    if (text === '/status') {
      sendTg(chatId, `✅ <b>Lara è operativa</b>\n\n🧠 AI: Online\n📱 Telegram: Connesso\n🔗 Piattaforma: Sync attivo\n\nScrivi un messaggio per iniziare!`)
      res.status(200).send('OK')
      return
    }

    if (text === '/usage') {
      sendTg(chatId, `📊 <b>Il tuo utilizzo</b>\n\nhttps://aethersy.com/usage\n\nCrediti e token sono tracciati in tempo reale.`, { parseMode: 'HTML' })
      res.status(200).send('OK')
      return
    }

    if (text === '/upgrade') {
      sendTg(chatId, `💎 <b>Upgrade Piano</b>\n\n• <b>Pro</b>: $29/mese - 50 crediti, 500K token\n• <b>Business</b>: $99/mese - 200 crediti, 2M token\n• <b>Enterprise</b>: $499/mese - Illimitato\n\nhttps://aethersy.com/pricing`, { parseMode: 'HTML' })
      res.status(200).send('OK')
      return
    }

    // AI chat per messaggi normali
    sendTyping(chatId)
    const aiResult = await askAI(text, userId)

    sendTg(chatId, aiResult.content)

    // Sync risposta alla piattaforma
    try {
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'https://aethersy.com'}/api/telegram/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send',
          userId,
          chatId: chatId.toString(),
          message: aiResult.content,
          platform: 'telegram',
          model: aiResult.model,
          tokens: aiResult.usage?.total_tokens || 0
        })
      })
    } catch (e) {
      console.log('Response sync failed:', e.message)
    }

    res.status(200).send('OK')

  } catch (e) {
    console.error('[LARA Telegram] Error:', e)
    res.status(200).send('OK')
  }
}
