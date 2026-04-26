/**
 * AETHERSY AI - Cognitive Memory Service
 * Gestisce la memoria cognitiva con temporal decay e importanza
 */

const ollama = require('./ollama');
const chroma = require('./chroma');
const { Pool } = require('pg');

class MemoryService {
  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL
    });

    // Configurable parameters
    this.DECAY_RATE = 0.01; // λ - decay rate per day
    this.IMPORTANCE_THRESHOLD = 0.3; // Below this, memory is archived
    this.MAX_MEMORIES_PER_QUERY = 5;
  }

  /**
   * Inizializza database PostgreSQL
   */
  async initialize() {
    try {
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS memory_entries (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id VARCHAR(255) NOT NULL,
          content_hash VARCHAR(64) UNIQUE NOT NULL,
          content_type VARCHAR(20) NOT NULL,
          importance_score FLOAT DEFAULT 0.5,
          temporal_decay FLOAT DEFAULT 1.0,
          metadata JSONB DEFAULT '{}',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          last_accessed TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_memory_user ON memory_entries(user_id);
        CREATE INDEX IF NOT EXISTS idx_memory_content_type ON memory_entries(content_type);
        CREATE INDEX IF NOT EXISTS idx_memory_importance ON memory_entries(importance_score);
      `);
      console.log('✅ Memory database initialized');
    } catch (err) {
      console.error('Memory DB init error:', err.message);
    }
  }

  /**
   * Calcola importanza con temporal decay
   * @param {number} initialImportance - Importanza iniziale (0-1)
   * @param {Date} createdAt - Data creazione
   * @param {number} daysElapsed - Giorni trascorsi
   * @returns {number} - Importanza attuale
   */
  calculateImportance(initialImportance, createdAt, daysElapsed = null) {
    const days = daysElapsed || (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24);
    return initialImportance * Math.exp(-this.DECAY_RATE * days);
  }

  /**
   * Determina importanza basata sul contenuto
   * @param {string} content - Contenuto testo
   * @param {string} contentType - Tipo contenuto
   * @returns {Promise<number>} - Punteggio importanza
   */
  async determineImportance(content, contentType) {
    // Pattern-based importance
    const importantPatterns = [
      /preferisco/i, /odio/i, /importante/i, /ricorda/i,
      /non dimenticare/i, /sempre/i, /mai/i, /devo/i,
      /obiettivo/i, /deadline/i, /scadenza/i, /priorità/i
    ];

    let baseImportance = 0.5;

    for (const pattern of importantPatterns) {
      if (pattern.test(content)) {
        baseImportance += 0.1;
      }
    }

    // Cap at 1.0
    return Math.min(baseImportance, 1.0);
  }

  /**
   * Memorizza nuova interazione
   * @param {object} params - Parametri
   * @returns {Promise<object>} - Memoria creata
   */
  async store({ userId, content, contentType = 'text', metadata = {} }) {
    try {
      // Determina importanza
      const importance = await this.determineImportance(content, contentType);

      // Genera embedding
      const embedding = await ollama.generateEmbedding(content);

      // Crea hash contenuto
      const crypto = require('crypto');
      const contentHash = crypto.createHash('sha256').update(content).digest('hex');

      // Store in ChromaDB
      const collectionName = `memory_${userId}`;
      const memoryId = `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      await chroma.store(collectionName, memoryId, embedding, content, {
        contentType,
        importance,
        ...metadata
      });

      // Store in PostgreSQL
      const client = await this.pool.connect();
      try {
        await client.query(
          `INSERT INTO memory_entries (user_id, content_hash, content_type, importance_score, metadata)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (content_hash) DO UPDATE SET
             last_accessed = CURRENT_TIMESTAMP,
             temporal_decay = EXCLUDED.temporal_decay`,
          [userId, contentHash, contentType, importance, JSON.stringify(metadata)]
        );
      } finally {
        client.release();
      }

      console.log(`🧠 Memory stored for user ${userId}: ${contentHash.slice(0, 12)}...`);

      return {
        success: true,
        memoryId,
        contentHash,
        importance,
        embedding
      };
    } catch (err) {
      console.error('Memory store error:', err.message);
      throw err;
    }
  }

  /**
   * Cerca memorie pertinenti
   * @param {string} userId - ID utente
   * @param {string} query - Query ricerca
   * @param {number} limit - Numero risultati
   * @returns {Promise<Array>} - Memorie trovate
   */
  async search(userId, query, limit = this.MAX_MEMORIES_PER_QUERY) {
    try {
      // Genera query embedding
      const queryEmbedding = await ollama.generateEmbedding(query);

      // Cerca in ChromaDB
      const collectionName = `memory_${userId}`;
      const results = await chroma.search(collectionName, queryEmbedding, limit * 2);

      // Applica temporal decay e filtra
      const now = Date.now();
      const filteredResults = results
        .map(result => ({
          ...result,
          temporalImportance: this.calculateImportance(
            result.metadata?.importance || 0.5,
            result.metadata?.storedAt || now
          )
        }))
        .filter(result => result.temporalImportance >= this.IMPORTANCE_THRESHOLD)
        .sort((a, b) => {
          // Score combinato: similarità + importanza temporale
          const scoreA = a.similarity * 0.6 + a.temporalImportance * 0.4;
          const scoreB = b.similarity * 0.6 + b.temporalImportance * 0.4;
          return scoreB - scoreA;
        })
        .slice(0, limit);

      // Aggiorna last_accessed in PostgreSQL
      for (const result of filteredResults) {
        await this.pool.query(
          `UPDATE memory_entries SET last_accessed = CURRENT_TIMESTAMP
           WHERE content_hash = $1`,
          [result.id]
        );
      }

      return filteredResults;
    } catch (err) {
      console.error('Memory search error:', err.message);
      return [];
    }
  }

  /**
   * Ottieni contesto per chat
   * @param {string} userId - ID utente
   * @param {string} currentMessage - Messaggio corrente
   * @returns {Promise<string>} - Contesto formattato
   */
  async getContextForChat(userId, currentMessage) {
    const memories = await this.search(userId, currentMessage, 3);

    if (memories.length === 0) {
      return '';
    }

    const context = memories
      .map(m => `- ${m.content}`)
      .join('\n');

    return `Contesto dalla memoria:\n${context}`;
  }

  /**
   * Elimina memoria
   * @param {string} userId - ID utente
   * @param {string} memoryId - ID memoria
   */
  async delete(userId, memoryId) {
    try {
      const collectionName = `memory_${userId}`;
      await chroma.delete(collectionName, memoryId);

      await this.pool.query(
        `DELETE FROM memory_entries WHERE id = $1`,
        [memoryId]
      );

      return { success: true };
    } catch (err) {
      throw new Error(`Delete failed: ${err.message}`);
    }
  }

  /**
   * Archivia memorie con bassa importanza
   * @param {string} userId - ID utente
   * @returns {Promise<number>} - Memorie archiviate
   */
  async archiveOldMemories(userId) {
    try {
      const collectionName = `memory_${userId}`;
      const allMemories = await chroma.search(collectionName, [0], 1000); // Dummy search

      let archived = 0;
      for (const memory of allMemories) {
        const importance = this.calculateImportance(
          memory.metadata?.importance || 0.5,
          memory.metadata?.storedAt || Date.now()
        );

        if (importance < this.IMPORTANCE_THRESHOLD) {
          await this.delete(userId, memory.id);
          archived++;
        }
      }

      if (archived > 0) {
        console.log(`🗄️ Archived ${archived} old memories for user ${userId}`);
      }

      return archived;
    } catch (err) {
      console.error('Archive error:', err.message);
      return 0;
    }
  }

  /**
   * Ottiene statistiche memoria utente
   * @param {string} userId - ID utente
   * @returns {Promise<object>} - Statistiche
   */
  async getStats(userId) {
    try {
      const result = await this.pool.query(
        `SELECT
           COUNT(*) as total,
           AVG(importance_score) as avg_importance,
           COUNT(*) FILTER (WHERE content_type = 'text') as text_count,
           COUNT(*) FILTER (WHERE content_type = 'image') as image_count,
           COUNT(*) FILTER (WHERE content_type = 'document') as document_count,
           MIN(created_at) as first_memory,
           MAX(last_accessed) as last_accessed
         FROM memory_entries
         WHERE user_id = $1`,
        [userId]
      );

      const stats = result.rows[0];

      return {
        totalMemories: parseInt(stats.total),
        averageImportance: parseFloat(stats.avg_importance) || 0,
        byType: {
          text: parseInt(stats.text_count),
          image: parseInt(stats.image_count),
          document: parseInt(stats.document_count)
        },
        firstMemoryAt: stats.first_memory,
        lastAccessedAt: stats.last_accessed
      };
    } catch (err) {
      throw new Error(`Get stats failed: ${err.message}`);
    }
  }

  /**
   * Importa batch di memorie (per migrazione)
   * @param {string} userId - ID utente
   * @param {Array} memories - Array di memorie
   */
  async importBatch(userId, memories) {
    try {
      const collectionName = `memory_${userId}`;
      const documents = [];

      for (const memory of memories) {
        const embedding = await ollama.generateEmbedding(memory.content);
        documents.push({
          id: memory.id || `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          embedding,
          content: memory.content,
          metadata: {
            contentType: memory.contentType || 'text',
            importance: memory.importance || 0.5,
            ...memory.metadata
          }
        });
      }

      await chroma.importBatch(collectionName, documents);

      // Store metadata in PostgreSQL
      const client = await this.pool.connect();
      try {
        for (const doc of documents) {
          const crypto = require('crypto');
          const contentHash = crypto.createHash('sha256').update(doc.content).digest('hex');

          await client.query(
            `INSERT INTO memory_entries (user_id, content_hash, content_type, importance_score, metadata)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (content_hash) DO NOTHING`,
            [userId, contentHash, doc.metadata.contentType, doc.metadata.importance, JSON.stringify(doc.metadata)]
          );
        }
      } finally {
        client.release();
      }

      return { success: true, imported: documents.length };
    } catch (err) {
      throw new Error(`Batch import failed: ${err.message}`);
    }
  }
}

module.exports = new MemoryService();
