/**
 * AETHERSY AI - Ollama Service
 * Gestisce tutte le interazioni con Ollama AI
 */

const { Ollama } = require('ollama');

class OllamaService {
  constructor() {
    this.client = new Ollama({
      host: process.env.OLLAMA_BASE_URL || 'http://localhost:11434'
    });
    this.models = {
      chat: 'llama3',
      vision: 'llava',
      embedding: 'nomic-embed-text'
    };
  }

  /**
   * Verifica connessione a Ollama
   */
  async isConnected() {
    try {
      await this.client.list();
      return true;
    } catch (err) {
      console.error('Ollama connection error:', err.message);
      return false;
    }
  }

  /**
   * Genera embedding per testo
   * @param {string} text - Testo da embedding
   * @returns {Promise<number[]>} - Vettore embedding
   */
  async generateEmbedding(text) {
    try {
      const response = await this.client.embeddings({
        model: this.models.embedding,
        prompt: text
      });
      return response.embedding;
    } catch (err) {
      throw new Error(`Embedding generation failed: ${err.message}`);
    }
  }

  /**
   * Chat con Llama3
   * @param {string} prompt - Prompt utente
   * @param {Array} history - Storico conversazione
   * @param {boolean} stream - Streaming response
   * @returns {Promise<string>} - Risposta AI
   */
  async chat(prompt, history = [], stream = false) {
    try {
      const messages = [
        {
          role: 'system',
          content: `Sei Lara, l'assistente AI di Aethersy.
          Sei utile, precisa e professionale.
          Rispondi sempre in italiano.`
        },
        ...history,
        { role: 'user', content: prompt }
      ];

      if (stream) {
        const streamResponse = await this.client.chat({
          model: this.models.chat,
          messages,
          stream: true
        });

        let fullResponse = '';
        for await (const chunk of streamResponse) {
          fullResponse += chunk.message.content;
        }
        return fullResponse;
      }

      const response = await this.client.chat({
        model: this.models.chat,
        messages,
        stream: false
      });

      return response.message.content;
    } catch (err) {
      throw new Error(`Chat generation failed: ${err.message}`);
    }
  }

  /**
   * Analizza immagine con Llava
   * @param {Buffer} imageBuffer - Immagine buffer
   * @param {string} prompt - Prompt per analisi
   * @returns {Promise<string>} - Descrizione immagine
   */
  async analyzeImage(imageBuffer, prompt = 'Descrivi questa immagine in dettaglio') {
    try {
      // Converti buffer in base64
      const base64Image = imageBuffer.toString('base64');

      const response = await this.client.generate({
        model: this.models.vision,
        prompt: prompt,
        images: [base64Image],
        stream: false
      });

      return response.response;
    } catch (err) {
      throw new Error(`Image analysis failed: ${err.message}`);
    }
  }

  /**
   * Estrae testo da documento (PDF, DOCX, etc.)
   * @param {Buffer} fileBuffer - File buffer
   * @param {string} mimeType - MIME type del file
   * @returns {Promise<string>} - Testo estratto
   */
  async extractText(fileBuffer, mimeType) {
    // Placeholder per estrazione testo
    // In produzione: usare pdf-parse per PDF, mammoth per DOCX
    if (mimeType === 'application/pdf') {
      const pdfParse = require('pdf-parse');
      const data = await pdfParse(fileBuffer);
      return data.text;
    }

    if (mimeType === 'text/plain') {
      return fileBuffer.toString('utf-8');
    }

    throw new Error(`Unsupported MIME type: ${mimeType}`);
  }

  /**
   * Genera risposta contestualizzata con memoria
   * @param {string} userId - ID utente
   * @param {string} query - Query utente
   * @param {Array} memories - Memorie pertinenti
   * @returns {Promise<string>} - Risposta contestualizzata
   */
  async chatWithMemory(userId, query, memories = []) {
    const memoryContext = memories.length > 0
      ? `Contesto dalla memoria dell'utente:\n${memories.map(m => `- ${m.content}`).join('\n')}`
      : '';

    const enhancedPrompt = memoryContext
      ? `${memoryContext}\n\nDomanda dell'utente: ${query}`
      : query;

    return this.chat(enhancedPrompt, [], false);
  }

  /**
   * Genera schema markup JSON-LD per SEO
   * @param {string} domain - Dominio website
   * @param {object} data - Dati per schema
   * @returns {Promise<object>} - Schema markup
   */
  async generateSchemaMarkup(domain, data = {}) {
    const prompt = `Genera uno schema.org JSON-LD markup per il sito ${domain}.
    Includi:
    - Organization schema
    - WebSite schema
    - BreadcrumbList schema

    Dati aggiuntivi: ${JSON.stringify(data)}

    Rispondi SOLO con JSON valido, niente altro.`;

    const response = await this.chat(prompt, [], false);

    // Estrai JSON dalla risposta
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (err) {
        throw new Error('Invalid JSON in schema markup response');
      }
    }

    throw new Error('No JSON found in schema markup response');
  }

  /**
   * Analizza sentiment del testo
   * @param {string} text - Testo da analizzare
   * @returns {Promise<object>} - Risultato analisi
   */
  async analyzeSentiment(text) {
    const prompt = `Analizza il sentiment di questo testo.
    Rispondi con JSON: {"sentiment": "positive|negative|neutral", "score": 0-1, "emotions": ["emotion1", ...]}

    Testo: "${text.slice(0, 500)}"`;

    const response = await this.chat(prompt, [], false);

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    throw new Error('Sentiment analysis failed');
  }

  /**
   * Riassunto testo lungo
   * @param {string} text - Testo da riassumere
   * @param {number} maxLength - Lunghezza max parole
   * @returns {Promise<string>} - Riassunto
   */
  async summarize(text, maxLength = 200) {
    const prompt = `Riassumi questo testo in massimo ${maxLength} parole, mantenendo i punti chiave.

    Testo: "${text.slice(0, 4000)}"`;

    return this.chat(prompt, [], false);
  }
}

module.exports = new OllamaService();
