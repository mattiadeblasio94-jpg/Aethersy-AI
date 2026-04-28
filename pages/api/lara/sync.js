import { MessagesDB, UsersDB } from '../../../lib/supabase'
import { getRedis } from '../../../lib/redis'

// MemoryDB stub per compatibilità
const MemoryDB = {
  async save(userId, key, value, category, confidence, source) {
    try {
      const r = getRedis()
      await r.setex(`memory:${userId}:${key}`, 86400 * 365, JSON.stringify({ value, category, confidence, source }))
      return { ok: true }
    } catch (e) {
      return { error: e.message }
    }
  }
}

/**
 * API DI SINBIOSE - Lara Telegram ↔ Web App ↔ Second Brain
 *
 * Questo endpoint sincronizza:
 * - Messaggi Telegram → Web App
 * - Messaggi Web App → Telegram
 * - Memoria condivisa
 * - Contesto conversazione
 * - File e media ricevuti
 */

export default async function handler(req, res) {
  const { method } = req

  if (method === 'GET') {
    // Recupera stato sincronizzazione per un utente
    const { userId, sessionId } = req.query
    return getSyncState(userId, sessionId, res)
  }

  if (method === 'POST') {
    // Sincronizza messaggio o azione
    const { userId, sessionId, type, payload } = req.body
    return syncMessage(userId, sessionId, type, payload, res)
  }

  res.status(405).json({ error: 'Method not allowed' })
}

// ============================================
// SINCRONIZZAZIONE MESSAGGI
// ============================================

async function getSyncState(userId, sessionId, res) {
  try {
    const r = getRedis()

    // Recupera ultimi messaggi da tutte le fonti
    const [telegramMessages, webMessages, brainMemories] = await Promise.all([
      r.lrange(`sync:telegram:${userId}`, 0, 49),
      r.lrange(`sync:web:${userId}`, 0, 49),
      r.lrange(`sync:brain:${userId}`, 0, 49),
    ])

    // Recupera contesto utente
    let userContext = null
    try {
      userContext = await UsersDB.get(userId)
    } catch (e) {
      // Utente non esiste ancora
    }

    // Recupera sessioni attive
    const activeSessions = await r.smembers(`sync:sessions:${userId}`)

    return res.json({
      ok: true,
      telegram: telegramMessages.map(JSON.parse),
      web: webMessages.map(JSON.parse),
      brain: brainMemories.map(JSON.parse),
      userContext,
      activeSessions,
      sessionId: sessionId || activeSessions[0]
    })
  } catch (error) {
    console.error('Sync error:', error)
    res.status(500).json({ error: error.message })
  }
}

async function syncMessage(userId, sessionId, type, payload, res) {
  try {
    const r = getRedis()
    const timestamp = Date.now()

    // Crea messaggio normalizzato
    const message = {
      id: `msg_${timestamp}_${Math.random().toString(36).slice(2, 8)}`,
      userId,
      sessionId,
      type, // 'text' | 'image' | 'video' | 'audio' | 'file' | 'voice'
      payload,
      timestamp,
      synced: true
    }

    // Determina la fonte e salva nelle code appropriate
    const source = payload.source || 'unknown' // 'telegram' | 'web' | 'api'

    if (source === 'telegram') {
      await r.lpush(`sync:telegram:${userId}`, JSON.stringify(message))
      await r.ltrim(`sync:telegram:${userId}`, 0, 99)
      // Propaga alla web app
      await r.publish(`sync:web:${userId}`, JSON.stringify(message))
    }

    if (source === 'web') {
      await r.lpush(`sync:web:${userId}`, JSON.stringify(message))
      await r.ltrim(`sync:web:${userId}`, 0, 99)
      // Propaga a Telegram se collegato
      if (payload.telegramChatId) {
        await r.publish(`sync:telegram:${payload.telegramChatId}`, JSON.stringify(message))
      }
    }

    if (source === 'brain') {
      await r.lpush(`sync:brain:${userId}`, JSON.stringify(message))
      await r.ltrim(`sync:brain:${userId}`, 0, 99)
    }

    // Aggiungi alla sessione attiva
    await r.sadd(`sync:sessions:${userId}`, sessionId)
    await r.expire(`sync:sessions:${userId}`, 86400 * 7) // 7 giorni

    // Salva su Supabase per persistenza a lungo termine
    try {
      await MessagesDB.save(
        sessionId,
        userId,
        type === 'text' ? payload.role || 'user' : 'assistant',
        payload.content || payload.caption || `[${type} allegato]`,
        {
          type,
          source,
          telegramChatId: payload.telegramChatId,
          mediaUrl: payload.url || payload.fileId,
          mimeType: payload.mimeType,
          fileSize: payload.fileSize
        }
      )
    } catch (e) {
      console.log('Supabase save fallback:', e.message)
    }

    // Notifica Lara se è un messaggio da elaborare
    if (payload.requiresLaraResponse) {
      await triggerLaraProcessing(userId, sessionId, message)
    }

    return res.json({ ok: true, messageId: message.id, synced: true })
  } catch (error) {
    console.error('Sync message error:', error)
    res.status(500).json({ error: error.message })
  }
}

// ============================================
// TRIGGER LARA PROCESSING
// ============================================

async function triggerLaraProcessing(userId, sessionId, message) {
  try {
    const r = getRedis()

    // Accoda il messaggio per l'elaborazione Lara
    await r.lpush('lara:queue:processing', JSON.stringify({
      userId,
      sessionId,
      message,
      queuedAt: Date.now()
    }))

    // Notifica via PubSub per elaborazione real-time
    await r.publish('lara:process', JSON.stringify({
      userId,
      sessionId,
      messageId: message.id
    }))

    console.log('Lara processing triggered for message:', message.id)
  } catch (e) {
    console.error('Trigger Lara error:', e.message)
  }
}

// ============================================
// GESTIONE MEDIA
// ============================================

export async function handleMediaUpload(userId, sessionId, media) {
  try {
    const r = getRedis()

    // Normalizza il media
    const mediaRecord = {
      id: `media_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      userId,
      sessionId,
      type: media.type, // 'image' | 'video' | 'audio' | 'document'
      url: media.url,
      fileId: media.fileId,
      mimeType: media.mimeType,
      size: media.size,
      caption: media.caption || '',
      uploadedAt: Date.now()
    }

    // Salva su Redis
    await r.setex(`media:${mediaRecord.id}`, 86400 * 30, JSON.stringify(mediaRecord))
    await r.lpush(`media:user:${userId}`, JSON.stringify(mediaRecord))
    await r.ltrim(`media:user:${userId}`, 0, 999)

    // Salva su Supabase per persistenza
    try {
      await MemoryDB.save(userId, `media_${mediaRecord.id}`, JSON.stringify(mediaRecord), 'media', 1.0, 'upload')
    } catch (e) {
      console.log('MemoryDB save fallback:', e.message)
    }

    return mediaRecord
  } catch (e) {
    console.error('Media upload error:', e.message)
    return null
  }
}

// ============================================
// RICERCA NEL SECOND BRAIN
// ============================================

export async function searchBrain(userId, query, options = {}) {
  try {
    const r = getRedis()

    // Crea embedding della query (Ollama - open source)
    let queryEmbedding = null
    try {
      const ollamaBaseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434'
      const res = await fetch(`${ollamaBaseUrl}/api/embeddings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'nomic-embed-text',
          prompt: query
        })
      })
      if (res.ok) {
        const data = await res.json()
        queryEmbedding = data.embedding
      }
    } catch (e) {
      console.log('Embedding fallback:', e.message)
    }

    // Ricerca full-text su Redis
    const keys = await r.keys(`brain:${userId}:*`)
    const results = []

    for (const key of keys.slice(0, 100)) {
      const data = await r.get(key)
      if (data) {
        const item = JSON.parse(data)
        const content = (item.content || '').toLowerCase()
        if (content.includes(query.toLowerCase())) {
          results.push({ key, item, score: 1 })
        }
      }
    }

    // Ordina per rilevanza
    results.sort((a, b) => b.score - a.score)

    return {
      query,
      results: results.slice(0, options.limit || 20),
      total: results.length
    }
  } catch (e) {
    console.error('Brain search error:', e.message)
    return { query, results: [], total: 0, error: e.message }
  }
}

// ============================================
// SALVATAGGIO NEL SECOND BRAIN
// ============================================

export async function saveToBrain(userId, content, metadata = {}) {
  try {
    const r = getRedis()
    const brainId = `brain_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

    const brainRecord = {
      id: brainId,
      userId,
      content,
      type: metadata.type || 'note',
      tags: metadata.tags || [],
      source: metadata.source || 'manual',
      sessionId: metadata.sessionId,
      createdAt: Date.now(),
      embeddings: metadata.embeddings || null
    }

    // Salva su Redis con expiration lungo
    await r.setex(`brain:${userId}:${brainId}`, 86400 * 365, JSON.stringify(brainRecord))

    // Aggiungi agli indici
    await r.sadd(`brain:${userId}:ids`, brainId)
    for (const tag of brainRecord.tags) {
      await r.sadd(`brain:${userId}:tags:${tag.toLowerCase()}`, brainId)
    }

    // Salva su Supabase
    try {
      await MemoryDB.save(
        userId,
        brainId,
        content,
        metadata.category || 'knowledge',
        1.0,
        metadata.source || 'brain'
      )
    } catch (e) {
      console.log('Supabase brain save fallback:', e.message)
    }

    return brainRecord
  } catch (e) {
    console.error('Save to brain error:', e.message)
    return null
  }
}
