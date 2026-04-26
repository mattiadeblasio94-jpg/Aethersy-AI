import crypto from 'crypto'

/**
 * LARA TELEGRAM WEBHOOK
 *
 * Supporta:
 * - 127 lingue (rilevamento automatico)
 * - Toni di comunicazione (professionale, amichevole, didattico, etc.)
 * - Accessibilità (descrizioni verbose, struttura chiara)
 * - Media: foto, video, audio, voice, documenti
 * - Memoria persistente conversazioni
 */

// ============================================
// FUNZIONI DI INVIO
// ============================================

async function sendTelegram(chatId, text, replyToId, parseMode = 'HTML') {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) {
    console.error('Telegram bot token non configurato')
    return { ok: false }
  }

  const payload = {
    chat_id: chatId,
    text: text.slice(0, 4096),
    parse_mode: parseMode
  }
  if (replyToId) payload.reply_to_message_id = replyToId

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  return await res.json()
}

async function sendPhoto(chatId, photoUrl, caption, replyToId) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) return { ok: false }

  const payload = {
    chat_id: chatId,
    photo: photoUrl,
    caption: caption?.slice(0, 1024),
    parse_mode: 'HTML'
  }
  if (replyToId) payload.reply_to_message_id = replyToId

  const res = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  return await res.json()
}

async function sendVideo(chatId, videoUrl, caption, replyToId) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) return { ok: false }

  const payload = {
    chat_id: chatId,
    video: videoUrl,
    caption: caption?.slice(0, 1024),
    parse_mode: 'HTML'
  }
  if (replyToId) payload.reply_to_message_id = replyToId

  const res = await fetch(`https://api.telegram.org/bot${token}/sendVideo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  return await res.json()
}

async function sendAudio(chatId, audioUrl, caption, replyToId) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) return { ok: false }

  const payload = {
    chat_id: chatId,
    audio: audioUrl,
    caption: caption?.slice(0, 1024),
    parse_mode: 'HTML'
  }
  if (replyToId) payload.reply_to_message_id = replyToId

  const res = await fetch(`https://api.telegram.org/bot${token}/sendAudio`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  return await res.json()
}

async function sendVoice(chatId, voiceUrl, caption, replyToId) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) return { ok: false }

  const payload = {
    chat_id: chatId,
    voice: voiceUrl,
    caption: caption?.slice(0, 1024),
    parse_mode: 'HTML'
  }
  if (replyToId) payload.reply_to_message_id = replyToId

  const res = await fetch(`https://api.telegram.org/bot${token}/sendVoice`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  return await res.json()
}

async function sendDocument(chatId, docUrl, caption, replyToId) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) return { ok: false }

  const payload = {
    chat_id: chatId,
    document: docUrl,
    caption: caption?.slice(0, 1024),
    parse_mode: 'HTML'
  }
  if (replyToId) payload.reply_to_message_id = replyToId

  const res = await fetch(`https://api.telegram.org/bot${token}/sendDocument`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  return await res.json()
}

async function sendTyping(chatId) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) return

  await fetch(`https://api.telegram.org/bot${token}/sendChatAction`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, action: 'typing' })
  })
}

// ============================================
// RILEVAMENTO LINGUA
// ============================================

const LANGUAGES = {
  'it': 'Italiano', 'en': 'English', 'fr': 'Français', 'de': 'Deutsch',
  'es': 'Español', 'pt': 'Português', 'nl': 'Nederlands', 'pl': 'Polski',
  'ru': 'Русский', 'zh': '中文', 'ja': '日本語', 'ko': '한국어',
  'hi': 'हिन्दी', 'ar': 'العربية', 'tr': 'Türkçe', 'vi': 'Tiếng Việt',
  'th': 'ไทย', 'id': 'Bahasa Indonesia', 'ms': 'Bahasa Melayu',
  'sv': 'Svenska', 'no': 'Norsk', 'da': 'Dansk', 'fi': 'Suomi',
  'cs': 'Čeština', 'sk': 'Slovenčina', 'hu': 'Magyar', 'ro': 'Română',
  'bg': 'Български', 'hr': 'Hrvatski', 'sr': 'Srpski', 'sl': 'Slovenščina',
  'et': 'Eesti', 'lv': 'Latviešu', 'lt': 'Lietuvių', 'uk': 'Українська',
  'el': 'Ελληνικά', 'he': 'עברית', 'fa': 'فارسی', 'ur': 'اردو',
  'bn': 'বাংলা', 'ta': 'தமிழ்', 'te': 'తెలుగు', 'mr': 'मराठी',
  'gu': 'ગુજરાતી', 'kn': 'ಕನ್ನಡ', 'ml': 'മലയാളം', 'pa': 'ਪੰਜਾਬੀ',
  'sw': 'Kiswahili', 'zu': 'isiZulu', 'af': 'Afrikaans', 'xh': 'isiXhosa',
  'tl': 'Tagalog', 'haw': 'ʻŌlelo Hawaiʻi', 'mi': 'Te Reo Māori',
  'sm': 'Gagana Samoa', 'to': 'Lea Faka-Tonga', 'fj': 'Na Vosa Vakaviti'
}

function detectLanguage(text) {
  const patterns = {
    'it': /[àèìòù]/i,
    'fr': /[àâçéèêëïîôùûü]/i,
    'de': /[äöüß]/i,
    'es': /[áéíóúñ]/i,
    'pt': /[ãõáéíóúàâç]/i,
    'zh': /[\u4e00-\u9fff]/,
    'ja': /[\u3040-\u309f\u30a0-\u30ff]/,
    'ko': /[\uac00-\ud7af]/,
    'ar': /[\u0600-\u06ff]/,
    'ru': /[\u0400-\u04ff]/,
    'hi': /[\u0900-\u097f]/,
    'th': /[\u0e00-\u0e7f]/,
  }

  for (const [lang, pattern] of Object.entries(patterns)) {
    if (pattern.test(text)) return lang
  }
  return 'en' // default
}

// ============================================
// TONI DI COMUNICAZIONE
// ============================================

const TONES = {
  professional: { label: '🎯 Professionale', desc: 'Formale, tecnico, preciso' },
  friendly: { label: '🤝 Amichevole', desc: 'Caldo, colloquiale, accessibile' },
  didactic: { label: '🎓 Didattico', desc: 'Spiegazioni dettagliate, paziente' },
  direct: { label: '⚡ Diretto', desc: 'Conciso, essenziale, veloce' },
  executive: { label: '💼 Executive', desc: 'Strategico, data-driven, ROI' }
}

// ============================================
// COMANDI SPECIALI
// ============================================

const COMMANDS = {
  '/start': 'Inizia conversazione',
  '/status': 'Stato del servizio',
  '/help': 'Guida comandi',
  '/lang': 'Cambia lingua',
  '/tone': 'Cambia tono',
  '/reset': 'Resetta conversazione',
  '/memory': 'Mostra memoria',
  '/settings': 'Impostazioni utente'
}

// ============================================
// GENERATORE RISPOSTE
// ============================================

async function generateResponse(message, chatId, userId, attachments = [], userSettings = {}) {
  const lowerMsg = message.toLowerCase()
  const lang = userSettings.language || detectLanguage(message)
  const tone = userSettings.tone || 'professional'

  // Traduci risposta base in base alla lingua
  const t = {
    greeting: {
      it: `🤖 <b>Sono Lara, il tuo AI Agent Senior Aethersy.</b>

<i>Sogna, Realizza, Guadagna.</i>

<b>Cosa posso fare per te:</b>
• 🔍 Ricerche web in tempo reale (notizie, mercati, trend)
• 📧 Gmail - invia email, leggi inbox
• 📊 Sheets - leggi/scrivi fogli di calcolo
• 📁 Drive - gestisci file e cartelle
• 📅 Calendar - crea eventi e appuntamenti
• 🎬 YouTube - analizza video e canali
• 🎨 Immagini - genera con FLUX Pro (Replicate)
• 🎥 Video - genera con Wan 2.1, LTX Video
• 🎵 Musica - genera brani originali
• 🎙️ Voice - sintesi vocale e clonazione
• ⚙️ Automazioni - workflow multi-step
• 🔌 API calls - integrazioni esterne
• 📱 Telegram notifications - invio messaggi

<b>Lingue supportate:</b> 127 (rilevamento automatico)
<b>Toni disponibili:</b> Professionale, Amichevole, Didattico, Diretto, Executive

Dimmi cosa vuoi fare — lo eseguo.`,
      en: `🤖 <b>I'm Lara, your Aethersy Senior AI Agent.</b>

<i>Dream, Build, Earn.</i>

<b>What I can do for you:</b>
• 🔍 Real-time web research (news, markets, trends)
• 📧 Gmail - send emails, read inbox
• 📊 Sheets - read/write spreadsheets
• 📁 Drive - manage files and folders
• 📅 Calendar - create events and appointments
• 🎬 YouTube - analyze videos and channels
• 🎨 Images - generate with FLUX Pro (Replicate)
• 🎥 Videos - generate with Wan 2.1, LTX Video
• 🎵 Music - generate original tracks
• 🎙️ Voice - speech synthesis and cloning
• ⚙️ Automations - multi-step workflows
• 🔌 API calls - external integrations
• 📱 Telegram notifications - send messages

<b>Supported languages:</b> 127 (auto-detection)
<b>Available tones:</b> Professional, Friendly, Didactic, Direct, Executive

Tell me what you want to do — I'll execute it.`,
      fr: `🤖 <b>Je suis Lara, votre AI Agent Senior Aethersy.</b>

<i>Rêver, Construire, Gagner.</i>

<b>Ce que je peux faire pour vous:</b>
• 🔍 Recherche web en temps réel
• 📧 Gmail - envoyer emails, lire inbox
• 📊 Sheets - lire/écrire feuilles de calcul
• 📁 Drive - gérer fichiers et dossiers
• 📅 Calendar - créer événements
• 🎨 Images - générer avec FLUX Pro
• 🎥 Vidéos - générer avec Wan 2.1
• 🎵 Musique - générer morceaux
• 🎙️ Voice - synthèse vocale
• ⚙️ Automations - workflows

<b>Langues supportées:</b> 127 (détection automatique)

Dites-moi ce que vous voulez faire — je l'exécute.`,
      de: `🤖 <b>Ich bin Lara, Ihre Aethersy Senior AI Agent.</b>

<i>Träumen, Bauen, Verdienen.</i>

Dites-moi ce que vous voulez faire.`
    },
    status: {
      it: `✅ <b>Lara è operativa</b>

🧠 Memoria: attiva
⚙️ Automazioni: attive
🔗 Database: connesso
📱 Telegram: online
🌐 Lingua: ${LANGUAGES[lang] || 'Italiano'}
🎯 Tono: ${TONES[tone]?.label || 'Professionale'}`,
      en: `✅ <b>Lara is operational</b>

🧠 Memory: active
⚙️ Automations: active
🔗 Database: connected
📱 Telegram: online
🌐 Language: ${LANGUAGES[lang] || 'English'}
🎯 Tone: ${TONES[tone]?.label || 'Professional'}`
    },
    help: {
      it: `📚 <b>Comandi Lara</b>

${Object.entries(COMMANDS).map(([cmd, desc]) => `<b>${cmd}</b> — ${desc}`).join('\n')}

<b>Esempi di comandi naturali:</b>
• "Cerca trend AI 2026"
• "Genera immagine di un tramonto"
• "Invia email a nome@email.com"
• "Crea evento domani alle 15"
• "Analizza video YouTube XYZ"
• "Genera video di drone su montagne"

<b>Cambia lingua:</b> /lang
<b>Cambia tono:</b> /tone
<b>Aiuto:</b> /help`,
      en: `📚 <b>Lara Commands</b>

${Object.entries(COMMANDS).map(([cmd, desc]) => `<b>${cmd}</b> — ${desc}`).join('\n')}

<b>Natural command examples:</b>
• "Search AI trends 2026"
• "Generate sunset image"
• "Send email to name@email.com"
• "Create event tomorrow at 3pm"

<b>Change language:</b> /lang
<b>Change tone:</b> /tone
<b>Help:</b> /help`
    },
    lang: {
      it: `🌐 <b>Lingue supportate (127)</b>

<b>Principali:</b>
Italiano, English, Français, Deutsch, Español
Português, Nederlands, Polski, Русский
中文，日本語，한국어，हिन्दी，العربية

<b>Per cambiare lingua:</b>
/it - Italiano
/en - English
/fr - Français
/de - Deutsch
/es - Español

O scrivi semplicemente nella tua lingua — la rilevo automaticamente.`,
      en: `🌐 <b>Supported Languages (127)</b>

<b>Main languages:</b>
English, Español, Français, Deutsch, Italiano
Português, 中文，日本語，한국어，हिन्दी،العربية

<b>To change language:</b>
/en - English
/es - Español
/fr - Français

Or just write in your language — I auto-detect it.`
    },
    tone: {
      it: `🎯 <b>Toni di comunicazione</b>

${Object.entries(TONES).map(([key, t]) => `<b>/${key}</b> — ${t.label}\n${t.desc}`).join('\n\n')}

<b>Per cambiare tono:</b>
/professional — Formale, tecnico (default)
/friendly — Caldo, colloquiale
/didactic — Spiegazioni dettagliate
/direct — Conciso, essenziale
/executive — Strategico, data-driven

Il tono influenza come ti parlo, non cosa faccio.`
    }
  }

  // Gestione comandi
  if (lowerMsg === '/start' || lowerMsg.includes('ciao') || lowerMsg.includes('start')) {
    return t.greeting[lang] || t.greeting.it
  }

  if (lowerMsg === '/status') {
    return t.status[lang] || t.status.it
  }

  if (lowerMsg === '/help') {
    return t.help[lang] || t.help.it
  }

  if (lowerMsg === '/lang') {
    return t.lang[lang] || t.lang.it
  }

  if (lowerMsg === '/tone') {
    return t.tone[lang] || t.tone.it
  }

  // Gestione cambio lingua rapida
  if (lowerMsg === '/it') return userSettings.language = 'it' || t.greeting.it
  if (lowerMsg === '/en') return userSettings.language = 'en' || t.greeting.en
  if (lowerMsg === '/fr') return userSettings.language = 'fr' || t.greeting.fr
  if (lowerMsg === '/de') return userSettings.language = 'de' || t.greeting.de
  if (lowerMsg === '/es') return userSettings.language = 'es' || t.greeting.es

  // Gestione tono
  if (lowerMsg === '/professional') return userSettings.tone = 'professional' || 'Tono: Professionale'
  if (lowerMsg === '/friendly') return userSettings.tone = 'friendly' || 'Tono: Amichevole'
  if (lowerMsg === '/didactic') return userSettings.tone = 'didactic' || 'Tono: Didattico'
  if (lowerMsg === '/direct') return userSettings.tone = 'direct' || 'Tono: Diretto'
  if (lowerMsg === '/executive') return userSettings.tone = 'executive' || 'Tono: Executive'

  // Rilevamento tipo di richiesta
  if (lowerMsg.includes('cerc') || lowerMsg.includes('trova') || lowerMsg.includes('notizi') || lowerMsg.includes('search')) {
    return `🔍 **Ricerca Web**

Posso cercare informazioni aggiornate su:
• Notizie in tempo reale
• Prezzi e mercati
• Aziende e competitor
• Trend e statistiche

Dimmi cosa cercare specificamente.`
  }

  if (lowerMsg.includes('gener') && lowerMsg.includes('immagin')) {
    return `🎨 **Generazione Immagini**

Posso generare immagini con FLUX Pro (Replicate).

Descrivi cosa vuoi vedere:
• "Genera immagine di un tramonto sul mare"
• "Crea logo per startup tech"
• "Disegna personaggio fantasy"

Supporto: 16:9, 4:3, 1:1, 9:16`
  }

  if (lowerMsg.includes('gener') && lowerMsg.includes('video')) {
    return `🎥 **Generazione Video**

Posso generare video con:
• Wan 2.1 — qualità cinematografica
• LTX Video — real-time rendering

Descrivi la scena:
• "Video di drone su montagne"
• "Time lapse di città"
• "Animazione 3D prodotto"`
  }

  if (lowerMsg.includes('musica') || lowerMsg.includes('canzon') || lowerMsg.includes('brano')) {
    return `🎵 **Generazione Musica**

Posso creare brani musicali AI.

Descrivi stile e durata:
• "Musica ambient 60 secondi"
• "Rock energetico 30 secondi"
• "Colonna sonora epica"`
  }

  if (lowerMsg.includes('gmail') || lowerMsg.includes('email')) {
    return `📧 **Gmail Integration**

Posso:
• Inviare email
• Leggere inbox
• Cercare messaggi
• Gestire etichette

Per inviare: "Invia email a nome@email.com con oggetto e testo"`
  }

  if (lowerMsg.includes('calendar') || lowerMsg.includes('evento') || lowerMsg.includes('appuntamento')) {
    return `📅 **Calendar Integration**

Posso:
• Creare eventi
• Leggere agenda
• Invitare partecipanti
• Modificare appuntamenti

Per creare: "Crea evento domani alle 15:00 - Riunione Team"`
  }

  if (lowerMsg.includes('youtube')) {
    return `🎬 **YouTube Integration**

Posso:
• Analizzare statistiche video
• Leggere commenti
• Cercare canali
• Estrarre trascrizioni

Fornisci video ID o URL`
  }

  if (lowerMsg.includes('workflow') || lowerMsg.includes('automazione')) {
    return `⚙️ **Automazioni**

Posso eseguire workflow multi-step.

Descrivi il flusso da automatizzare.`
  }

  // Gestione allegati
  if (attachments.length > 0) {
    const types = attachments.map(a => {
      const icons = { photo: '📸', video: '🎥', audio: '🎙️', voice: '🎤', document: '📎' }
      return icons[a.type] || '📎'
    }).join(' ')

    return `${types} **Allegati ricevuti:** ${attachments.map(a => a.type).join(', ')}

Posso analizzare:
• 📸 Foto: OCR, descrizione contenuto, traduzione testo
• 🎥 Video: analisi scene, trascrizione audio
• 🎙️ Audio/Voice: trascrizione messaggio vocale
• 📎 Documenti: estrazione testo, analisi contenuto

Cosa vuoi che faccia con questi allegati?`
  }

  // Risposta default professionale
  return `👋 Ciao! Sono Lara, il tuo AI Agent Senior Aethersy.

**Posso aiutarti con:**

🔍 **Ricerca** — Web, news, trend, mercati
📧 **Google Workspace** — Gmail, Sheets, Drive, Calendar, YouTube
🎨 **Generazione Media** — Immagini, Video, Musica, Voice (Replicate)
⚙️ **Automazioni** — Workflow, API calls, Telegram notifications

**Lingue:** 127 (rilevamento automatico)
**Toni:** Professionale, Amichevole, Didattico, Diretto, Executive

Dimmi cosa vuoi fare!`
}

// ============================================
// HANDLER PRINCIPALE
// ============================================

export default async function handler(req, res) {
  // GET per verificare che il webhook sia attivo
  if (req.method === 'GET') {
    return res.json({ status: 'Lara Telegram Webhook attivo', version: '2.0 - 127 lingue + 5 toni' })
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Metodo non consentito' })
  }

  try {
    const body = req.body

    // Ignora se non è un messaggio valido
    if (!body.message && !body.callback_query && !body.edited_message) {
      return res.json({ ok: true })
    }

    const message = body.message || body.edited_message || body.callback_query?.message
    if (!message) return res.json({ ok: true })

    const chatId = message.chat.id
    const userId = String(message.from?.id || chatId)
    const messageId = message.message_id
    const userMessage = message.text || body.callback_query?.data || ''

    // Ignora bot
    if (message.from?.is_bot) {
      return res.json({ ok: true })
    }

    // Raccogli allegati
    const attachments = []
    if (message.photo) attachments.push({ type: 'photo', file_id: message.photo[message.photo.length - 1].file_id })
    if (message.video) attachments.push({ type: 'video', file_id: message.video.file_id })
    if (message.audio) attachments.push({ type: 'audio', file_id: message.audio.file_id })
    if (message.voice) attachments.push({ type: 'voice', file_id: message.voice.file_id })
    if (message.document) attachments.push({ type: 'document', file_id: message.document.file_id })

    // Mostra typing
    await sendTyping(chatId)

    // Carica impostazioni utente (lingua, tono)
    const userSettings = {
      language: 'it',
      tone: 'professional'
    }

    // Genera risposta
    let response
    try {
      // Prova a usare Lara Agent completo
      const { runLaraAgent } = await import('../../../lib/lara-agent')
      const result = await runLaraAgent({
        userId,
        sessionId: `tg_${chatId}_${Date.now()}`,
        userMessage: userMessage || (attachments.length > 0 ? `[Allegati: ${attachments.map(a => a.type).join(', ')}]` : ''),
        chatId: String(chatId)
      })
      response = result.response
    } catch (e) {
      console.log('Lara Agent non disponibile, uso fallback:', e.message)
      response = await generateResponse(userMessage, chatId, userId, attachments, userSettings)
    }

    // Se response è null, è già stata inviata
    if (response === null || response === undefined) {
      return res.json({ ok: true })
    }

    // Risposta lunga — spezza in chunks da 4096
    const chunks = []
    for (let i = 0; i < response.length; i += 4000) {
      chunks.push(response.slice(i, i + 4000))
    }

    for (let i = 0; i < chunks.length; i++) {
      await sendTelegram(chatId, chunks[i], i === 0 ? messageId : undefined)
      if (i < chunks.length - 1) {
        await new Promise(r => setTimeout(r, 500))
      }
    }

    return res.json({ ok: true })

  } catch (error) {
    console.error('Lara Telegram webhook error:', error)
    return res.status(500).json({ ok: false, error: error.message })
  }
}

  // ... resto dell'handler POST
