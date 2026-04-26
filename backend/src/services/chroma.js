/**
 * AETHERSY AI - ChromaDB Service
 * Gestione database vettoriale per Cognitive Memory
 */

const { ChromaClient } = require('chromadb');

class ChromaService {
  constructor() {
    this.client = new ChromaClient({
      path: process.env.CHROMA_HOST || 'http://localhost:8000'
    });
    this.collections = new Map();
  }

  /**
   * Verifica connessione a ChromaDB
   */
  async isConnected() {
    try {
      await this.client.heartbeat();
      return true;
    } catch (err) {
      console.error('ChromaDB connection error:', err.message);
      return false;
    }
  }

  /**
   * Crea o ottiene collezione
   * @param {string} name - Nome collezione
   * @param {object} metadata - Metadata collezione
   * @returns {Promise<object>} - Collezione
   */
  async getOrCreateCollection(name, metadata = {}) {
    const cacheKey = name;

    if (this.collections.has(cacheKey)) {
      return this.collections.get(cacheKey);
    }

    try {
      // Cerca collezione esistente
      const collections = await this.client.listCollections();
      let collection = collections.find(c => c.name === name);

      if (!collection) {
        // Crea nuova collezione
        collection = await this.client.createCollection({
          name,
          metadata: {
            description: 'Aethersy Cognitive Memory',
            createdAt: new Date().toISOString(),
            ...metadata
          }
        });
      }

      this.collections.set(cacheKey, collection);
      return collection;
    } catch (err) {
      throw new Error(`Collection operation failed: ${err.message}`);
    }
  }

  /**
   * Memorizza contenuto con embedding
   * @param {string} collectionName - Nome collezione
   * @param {string} id - ID univoco documento
   * @param {number[]} embedding - Vettore embedding
   * @param {string} content - Contenuto testo
   * @param {object} metadata - Metadata aggiuntivi
   */
  async store(collectionName, id, embedding, content, metadata = {}) {
    try {
      const collection = await this.getOrCreateCollection(collectionName);

      await collection.upsert({
        ids: [id],
        embeddings: [embedding],
        documents: [content],
        metadatas: [{
          ...metadata,
          storedAt: new Date().toISOString()
        }]
      });

      return { success: true, id };
    } catch (err) {
      throw new Error(`Store operation failed: ${err.message}`);
    }
  }

  /**
   * Cerca documenti simili
   * @param {string} collectionName - Nome collezione
   * @param {number[]} queryEmbedding - Embedding query
   * @param {number} limit - Numero risultati
   * @param {object} filter - Filtro metadata
   * @returns {Promise<Array>} - Risultati ricerca
   */
  async search(collectionName, queryEmbedding, limit = 10, filter = {}) {
    try {
      const collection = await this.getOrCreateCollection(collectionName);

      const results = await collection.query({
        queryEmbeddings: [queryEmbedding],
        nResults: limit,
        include: ['documents', 'metadatas', 'distances'],
        where: filter
      });

      // Formatta risultati
      return results.documents.map((docs, i) => ({
        id: results.ids[i][0],
        content: docs[0],
        metadata: results.metadatas[i][0],
        distance: results.distances[i][0],
        similarity: 1 - results.distances[i][0] // Converti distanza in similarità
      }));
    } catch (err) {
      throw new Error(`Search operation failed: ${err.message}`);
    }
  }

  /**
   * Elimina documento
   * @param {string} collectionName - Nome collezione
   * @param {string} id - ID documento
   */
  async delete(collectionName, id) {
    try {
      const collection = await this.getOrCreateCollection(collectionName);
      await collection.delete({ ids: [id] });
      return { success: true };
    } catch (err) {
      throw new Error(`Delete operation failed: ${err.message}`);
    }
  }

  /**
   * Elimina intera collezione
   * @param {string} collectionName - Nome collezione
   */
  async deleteCollection(collectionName) {
    try {
      await this.client.deleteCollection(collectionName);
      this.collections.delete(collectionName);
      return { success: true };
    } catch (err) {
      throw new Error(`Delete collection failed: ${err.message}`);
    }
  }

  /**
   * Ottiene statistiche collezione
   * @param {string} collectionName - Nome collezione
   * @returns {Promise<object>} - Statistiche
   */
  async getStats(collectionName) {
    try {
      const collection = await this.getOrCreateCollection(collectionName);
      const count = await collection.count();

      return {
        name: collectionName,
        documentCount: count,
        createdAt: collection.metadata?.createdAt
      };
    } catch (err) {
      throw new Error(`Get stats failed: ${err.message}`);
    }
  }

  /**
   * Importa batch di documenti
   * @param {string} collectionName - Nome collezione
   * @param {Array} documents - Array di {id, embedding, content, metadata}
   */
  async importBatch(collectionName, documents) {
    try {
      const collection = await this.getOrCreateCollection(collectionName);

      const ids = documents.map(d => d.id);
      const embeddings = documents.map(d => d.embedding);
      const contents = documents.map(d => d.content);
      const metadatas = documents.map(d => ({
        ...d.metadata,
        storedAt: new Date().toISOString()
      }));

      await collection.upsert({
        ids,
        embeddings,
        documents: contents,
        metadatas
      });

      return { success: true, imported: documents.length };
    } catch (err) {
      throw new Error(`Batch import failed: ${err.message}`);
    }
  }

  /**
   * Ricerca ibrida (vettoriale + keyword)
   * @param {string} collectionName - Nome collezione
   * @param {number[]} queryEmbedding - Embedding query
   * @param {string} keyword - Keyword per filtro
   * @param {number} limit - Numero risultati
   * @returns {Promise<Array>} - Risultati
   */
  async hybridSearch(collectionName, queryEmbedding, keyword, limit = 10) {
    try {
      const collection = await this.getOrCreateCollection(collectionName);

      // Cerca con filtro keyword nel contenuto
      const results = await collection.query({
        queryEmbeddings: [queryEmbedding],
        nResults: limit * 2, // Prendi più risultati per filtrare
        include: ['documents', 'metadatas', 'distances']
      });

      // Filtra per keyword e prendi i primi limit
      let filtered = results.documents.map((docs, i) => ({
        id: results.ids[i][0],
        content: docs[0],
        metadata: results.metadatas[i][0],
        distance: results.distances[i][0],
        similarity: 1 - results.distances[i][0]
      }));

      if (keyword) {
        filtered = filtered.filter(item =>
          item.content.toLowerCase().includes(keyword.toLowerCase())
        );
      }

      return filtered.slice(0, limit);
    } catch (err) {
      throw new Error(`Hybrid search failed: ${err.message}`);
    }
  }

  /**
   * Esporta collezione per backup
   * @param {string} collectionName - Nome collezione
   * @returns {Promise<object>} - Dati collezione
   */
  async export(collectionName) {
    try {
      const collection = await this.getOrCreateCollection(collectionName);

      // Ottieni tutti i dati (attenzione: può essere grande)
      const count = await collection.count();
      const results = await collection.get({
        include: ['documents', 'metadatas', 'embeddings'],
        limit: count
      });

      return {
        name: collectionName,
        exportedAt: new Date().toISOString(),
        documentCount: count,
        documents: results.documents.map((doc, i) => ({
          id: results.ids[i],
          content: doc,
          metadata: results.metadatas[i],
          embedding: results.embeddings[i]
        }))
      };
    } catch (err) {
      throw new Error(`Export failed: ${err.message}`);
    }
  }
}

module.exports = new ChromaService();
