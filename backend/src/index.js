/**
 * 🚀 AETHERSY AI - Backend Server
 * Core API per Cognitive Memory, Cinema Studio, SEO Tools
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const winston = require('winston');
const rateLimit = require('express-rate-limit');
const path = require('path');

// Import services
const ollama = require('./services/ollama');
const chroma = require('./services/chroma');
const memory = require('./services/memory');
const cinema = require('./services/cinema');
const seo = require('./services/seo');

// Import routes
const memoryRoutes = require('./routes/memory');
const cinemaRoutes = require('./routes/cinema');
const seoRoutes = require('./routes/seo');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ============================================================
// LOGGING CONFIGURATION
// ============================================================

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'aethersy-backend' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

// ============================================================
// MIDDLEWARE
// ============================================================

// Security headers
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Body parsing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: { error: 'Too many requests, please try again later' }
});

const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // 50 uploads per hour
  message: { error: 'Upload limit exceeded' }
});

app.use('/api/', apiLimiter);
app.use('/api/memory/', uploadLimiter);
app.use('/api/cinema/', uploadLimiter);

// ============================================================
// HEALTH CHECK
// ============================================================

app.get('/health', async (req, res) => {
  const checks = {
    ollama: false,
    chromadb: false,
    memory: false
  };

  try {
    checks.ollama = await ollama.isConnected();
  } catch (e) {}

  try {
    checks.chromadb = await chroma.isConnected();
  } catch (e) {}

  try {
    await memory.pool.query('SELECT 1');
    checks.memory = true;
  } catch (e) {}

  const allHealthy = Object.values(checks).every(v => v);

  res.status(allHealthy ? 200 : 503).json({
    status: allHealthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    services: checks
  });
});

// ============================================================
// API ROUTES
// ============================================================

// Memory routes
app.use('/api/memory', memoryRoutes);

// Cinema routes
app.use('/api/cinema', cinemaRoutes);

// SEO routes
app.use('/api/seo', seoRoutes);

// ============================================================
// OLLAMA DIRECT API
// ============================================================

app.post('/api/ollama/chat', async (req, res) => {
  try {
    const { prompt, history = [], stream = false } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const response = await ollama.chat(prompt, history, stream);
    res.json({ response });
  } catch (err) {
    logger.error('Ollama chat error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/ollama/embed', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const embedding = await ollama.generateEmbedding(text);
    res.json({ embedding, dimensions: embedding.length });
  } catch (err) {
    logger.error('Embedding error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/ollama/vision', async (req, res) => {
  try {
    const { image, prompt = 'Descrivi questa immagine' } = req.body;

    if (!image) {
      return res.status(400).json({ error: 'Image is required' });
    }

    // image should be base64
    const imageBuffer = Buffer.from(image, 'base64');
    const description = await ollama.analyzeImage(imageBuffer, prompt);

    res.json({ description });
  } catch (err) {
    logger.error('Vision error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// COGNITIVE MEMORY DIRECT API
// ============================================================

app.post('/api/memory/store', async (req, res) => {
  try {
    const { userId, content, contentType = 'text', metadata = {} } = req.body;

    if (!userId || !content) {
      return res.status(400).json({ error: 'userId and content are required' });
    }

    const result = await memory.store({ userId, content, contentType, metadata });
    res.json(result);
  } catch (err) {
    logger.error('Memory store error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/memory/search', async (req, res) => {
  try {
    const { userId, query, limit = 5 } = req.body;

    if (!userId || !query) {
      return res.status(400).json({ error: 'userId and query are required' });
    }

    const results = await memory.search(userId, query, limit);
    res.json({ results });
  } catch (err) {
    logger.error('Memory search error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/memory/stats/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const stats = await memory.getStats(userId);
    res.json(stats);
  } catch (err) {
    logger.error('Memory stats error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// CINEMA STUDIO DIRECT API
// ============================================================

app.post('/api/cinema/generate-video', async (req, res) => {
  try {
    const { userId, prompt, duration = 5, aspectRatio = '16:9' } = req.body;

    if (!userId || !prompt) {
      return res.status(400).json({ error: 'userId and prompt are required' });
    }

    const result = await cinema.generateVideo({ userId, prompt, duration, aspectRatio });
    res.json(result);
  } catch (err) {
    logger.error('Video generation error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/cinema/status/:videoId', async (req, res) => {
  try {
    const { videoId } = req.params;
    const status = await cinema.getVideoStatus(videoId);
    res.json(status);
  } catch (err) {
    logger.error('Video status error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/cinema/generate-voice', async (req, res) => {
  try {
    const { text, voiceId = 'Lara' } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'text is required' });
    }

    const audioBuffer = await cinema.generateVoice(text, voiceId);

    res.set('Content-Type', 'audio/mpeg');
    res.set('Content-Length', audioBuffer.length);
    res.send(audioBuffer);
  } catch (err) {
    logger.error('Voice generation error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// SEO TOOLS DIRECT API
// ============================================================

app.post('/api/seo/analyze-serp', async (req, res) => {
  try {
    const { keyword, country = 'IT' } = req.body;

    if (!keyword) {
      return res.status(400).json({ error: 'keyword is required' });
    }

    const results = await seo.analyzeSERP(keyword, country);
    res.json(results);
  } catch (err) {
    logger.error('SERP analysis error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/seo/keyword-research', async (req, res) => {
  try {
    const { seedKeyword, country = 'IT' } = req.body;

    if (!seedKeyword) {
      return res.status(400).json({ error: 'seedKeyword is required' });
    }

    const keywords = await seo.keywordResearch(seedKeyword, country);
    res.json({ keywords });
  } catch (err) {
    logger.error('Keyword research error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/seo/generate-schema', async (req, res) => {
  try {
    const { data } = req.body;

    if (!data) {
      return res.status(400).json({ error: 'data is required' });
    }

    const schema = await seo.generateSchemaMarkup(data);
    res.json({ schema });
  } catch (err) {
    logger.error('Schema generation error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/seo/full-report', async (req, res) => {
  try {
    const { domain, keywords, country = 'IT' } = req.body;

    if (!domain || !keywords || !Array.isArray(keywords)) {
      return res.status(400).json({ error: 'domain and keywords array are required' });
    }

    const report = await seo.generateFullReport({ domain, keywords, country });
    res.json(report);
  } catch (err) {
    logger.error('SEO report error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// ERROR HANDLING
// ============================================================

app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);

  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal server error',
      status: err.status || 500
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// ============================================================
// SERVER STARTUP
// ============================================================

async function startServer() {
  try {
    // Initialize services
    logger.info('🧠 Initializing Cognitive Memory...');
    await memory.initialize();

    logger.info('🔌 Checking Ollama connection...');
    const ollamaConnected = await ollama.isConnected();
    logger.info(ollamaConnected ? '✅ Ollama connected' : '⚠️ Ollama not available');

    logger.info('🔌 Checking ChromaDB connection...');
    const chromaConnected = await chroma.isConnected();
    logger.info(chromaConnected ? '✅ ChromaDB connected' : '⚠️ ChromaDB not available');

    // Start server
    app.listen(PORT, '0.0.0.0', () => {
      logger.info(`🚀 Aethersy Backend running on port ${PORT}`);
      logger.info(`📍 Health: http://localhost:${PORT}/health`);
    });
  } catch (err) {
    logger.error('Failed to start server:', err);
    process.exit(1);
  }
}

startServer();

module.exports = app;
