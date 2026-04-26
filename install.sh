#!/bin/bash

# ============================================================
# 🚀 AETHERSY AI - Automated Installation Script
# ============================================================
# This script sets up the complete Aethersy AI platform with:
# - Ollama with required models
# - ChromaDB for vector storage
# - PostgreSQL for structured data
# - Redis for caching
# - Backend and Frontend services
# ============================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     🚀 AETHERSY AI - Installation Script           ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    echo -e "${RED}❌ Please do not run as root${NC}"
    exit 1
fi

# Check for Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed. Please install Docker first.${NC}"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not installed.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker and Docker Compose found${NC}"

# Check for Ollama (local installation for model downloads)
OLLAMA_AVAILABLE=false
if command -v ollama &> /dev/null; then
    OLLAMA_AVAILABLE=true
    echo -e "${GREEN}✅ Ollama found locally${NC}"
fi

# Create necessary directories
echo -e "${YELLOW}📁 Creating directories...${NC}"
mkdir -p backend/db
mkdir -p backend/uploads
mkdir -p logs

# Create .env file if not exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}📝 Creating .env file...${NC}"
    cat > .env << 'EOF'
# AETHERSY AI - Environment Variables

# ElevenLabs (Voice synthesis for Lara)
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here

# Serper.dev (Google Search API)
SERPER_API_KEY=your_serper_api_key_here

# Stripe (Payments)
STRIPE_SECRET_KEY=sk_live_your_stripe_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Telegram Bot
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_ADMIN_IDS=your_telegram_id

# OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# Replicate (AI Generations)
REPLICATE_API_TOKEN=your_replicate_token

# Upstash Redis (for Vercel deployment)
UPSTASH_REDIS_REST_URL=your_upstash_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_token
EOF
    echo -e "${GREEN}✅ .env file created. Please update with your API keys.${NC}"
else
    echo -e "${GREEN}✅ .env file already exists${NC}"
fi

# Create database init script
echo -e "${YELLOW}📝 Creating database initialization script...${NC}"
cat > backend/db/init.sql << 'EOF'
-- AETHERSY AI - PostgreSQL Database Schema

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    password_hash VARCHAR(255),
    telegram_id VARCHAR(50),
    plan VARCHAR(20) DEFAULT 'free',
    avatar_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Cognitive Memory (vector embeddings metadata)
CREATE TABLE IF NOT EXISTS memory_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    content_hash VARCHAR(64) UNIQUE NOT NULL,
    content_type VARCHAR(20) NOT NULL, -- 'text', 'image', 'video', 'document'
    importance_score FLOAT DEFAULT 0.5,
    temporal_decay FLOAT DEFAULT 1.0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_accessed TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Cinema Studio projects
CREATE TABLE IF NOT EXISTS cinema_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'draft',
    video_url TEXT,
    audio_url TEXT,
    thumbnail_url TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- SEO projects
CREATE TABLE IF NOT EXISTS seo_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    domain VARCHAR(255) NOT NULL,
    keywords JSONB DEFAULT '[]',
    serp_data JSONB,
    schema_markup JSONB,
    last_crawled TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    stripe_subscription_id VARCHAR(255) UNIQUE,
    plan VARCHAR(20) NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    current_period_start TIMESTAMP,
    current_period_end TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- API usage tracking
CREATE TABLE IF NOT EXISTS api_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    endpoint VARCHAR(100) NOT NULL,
    tokens_used INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_memory_user ON memory_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_memory_content_type ON memory_entries(content_type);
CREATE INDEX IF NOT EXISTS idx_cinema_user ON cinema_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_seo_domain ON seo_projects(domain);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_user ON api_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_date ON api_usage(created_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cinema_updated_at BEFORE UPDATE ON cinema_projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EOF
echo -e "${GREEN}✅ Database schema created${NC}"

# Create backend Dockerfile
echo -e "${YELLOW}📝 Creating backend Dockerfile...${NC}"
cat > backend/Dockerfile << 'EOF'
FROM node:20-alpine

WORKDIR /app

# Install Python and build tools for native modules
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:5000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start server
CMD ["npm", "run", "dev"]
EOF
echo -e "${GREEN}✅ Backend Dockerfile created${NC}"

# Create frontend Dockerfile
echo -e "${YELLOW}📝 Creating frontend Dockerfile...${NC}"
cat > Dockerfile.frontend << 'EOF'
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Build Next.js
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.js ./

EXPOSE 3000

ENV NODE_ENV=production

CMD ["npm", "start"]
EOF
echo -e "${GREEN}✅ Frontend Dockerfile created${NC}"

# Create backend package.json
echo -e "${YELLOW}📝 Creating backend package.json...${NC}"
cat > backend/package.json << 'EOF'
{
  "name": "aethersy-backend",
  "version": "1.0.0",
  "description": "Aethersy AI Backend API",
  "main": "src/index.js",
  "scripts": {
    "dev": "nodemon src/index.js",
    "start": "node src/index.js",
    "ollama:pull": "ollama pull llama3 && ollama pull llava && ollama pull nomic-embed-text"
  },
  "dependencies": {
    "@anthropic-ai/sdk": "^0.27.0",
    "@upstash/redis": "^1.37.0",
    "axios": "^1.6.0",
    "bcryptjs": "^2.4.3",
    "chromadb": "^1.8.0",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "elevenlabs": "^0.2.0",
    "express": "^4.18.2",
    "express-rate-limit": "^7.1.0",
    "ffmpeg-static": "^5.2.0",
    "fluent-ffmpeg": "^2.1.2",
    "helmet": "^7.1.0",
    "jsonwebtoken": "^9.0.2",
    "mongoose": "^8.0.0",
    "multer": "^1.4.5-lts.1",
    "nodemailer": "^6.9.0",
    "ollama": "^0.5.0",
    "pdf-parse": "^1.1.1",
    "playwright": "^1.40.0",
    "pg": "^8.11.0",
    "resend": "^4.0.0",
    "stripe": "^14.0.0",
    "winston": "^3.11.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.2"
  }
}
EOF
echo -e "${GREEN}✅ Backend package.json created${NC}"

# Pull Ollama models if Ollama is available locally
if [ "$OLLAMA_AVAILABLE" = true ]; then
    echo -e "${YELLOW}🤖 Pulling Ollama models (this may take a while)...${NC}"
    echo -e "${BLUE}   - llama3 (main conversation model)${NC}"
    echo -e "${BLUE}   - llava (vision/image understanding)${NC}"
    echo -e "${BLUE}   - nomic-embed-text (embeddings)${NC}"

    ollama pull llama3
    ollama pull llava
    ollama pull nomic-embed-text

    echo -e "${GREEN}✅ Ollama models downloaded${NC}"
fi

# Start Docker Compose
echo -e "${YELLOW}🐳 Starting Docker containers...${NC}"
docker-compose up -d

# Wait for services to be ready
echo -e "${YELLOW}⏳ Waiting for services to start...${NC}"
sleep 30

# Check service health
echo -e "${YELLOW}🔍 Checking service health...${NC}"

if docker ps | grep -q aethersy-ollama; then
    echo -e "${GREEN}✅ Ollama is running${NC}"
else
    echo -e "${RED}❌ Ollama failed to start${NC}"
fi

if docker ps | grep -q aethersy-chroma; then
    echo -e "${GREEN}✅ ChromaDB is running${NC}"
else
    echo -e "${RED}❌ ChromaDB failed to start${NC}"
fi

if docker ps | grep -q aethersy-postgres; then
    echo -e "${GREEN}✅ PostgreSQL is running${NC}"
else
    echo -e "${RED}❌ PostgreSQL failed to start${NC}"
fi

if docker ps | grep -q aethersy-redis; then
    echo -e "${GREEN}✅ Redis is running${NC}"
else
    echo -e "${RED}❌ Redis failed to start${NC}"
fi

# Create backend source directory
mkdir -p backend/src

# Create main backend server
echo -e "${YELLOW}📝 Creating backend server...${NC}"
cat > backend/src/index.js << 'EOF'
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const { Ollama } = require('ollama');
const { ChromaClient } = require('chromadb');
const { Pool } = require('pg');
const Redis = require('ioredis');
const winston = require('winston');
const rateLimit = require('express-rate-limit');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Logger configuration
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({ format: winston.format.simple() }));
}

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Initialize connections
const ollama = new Ollama({ host: process.env.OLLAMA_BASE_URL || 'http://localhost:11434' });

const chroma = new ChromaClient({
  path: process.env.CHROMA_HOST || 'http://localhost:8000'
});

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// Test connections on startup
async function testConnections() {
  try {
    await ollama.list();
    logger.info('✅ Ollama connected');
  } catch (err) {
    logger.error('❌ Ollama connection failed:', err.message);
  }

  try {
    await chroma heartbeat();
    logger.info('✅ ChromaDB connected');
  } catch (err) {
    logger.error('❌ ChromaDB connection failed:', err.message);
  }

  try {
    await pool.query('SELECT NOW()');
    logger.info('✅ PostgreSQL connected');
  } catch (err) {
    logger.error('❌ PostgreSQL connection failed:', err.message);
  }

  try {
    await redis.ping();
    logger.info('✅ Redis connected');
  } catch (err) {
    logger.error('❌ Redis connection failed:', err.message);
  }
}

// ============================================================
// COGNITIVE MEMORY API
// ============================================================

// Generate embeddings using Ollama
async function generateEmbedding(text) {
  const response = await ollama.embeddings({
    model: 'nomic-embed-text',
    prompt: text
  });
  return response.embedding;
}

// Create or get collection
async function getCollection(name) {
  const collections = await chroma.listCollections();
  let collection = collections.find(c => c.name === name);

  if (!collection) {
    collection = await chroma.createCollection({
      name,
      metadata: { description: 'Aethersy Cognitive Memory' }
    });
  }

  return collection;
}

// Store memory with embedding
app.post('/api/memory/store', async (req, res) => {
  try {
    const { userId, content, contentType = 'text', metadata = {} } = req.body;

    // Generate embedding
    const embedding = await generateEmbedding(content);

    // Get collection
    const collection = await getCollection(`memory_${userId}`);

    // Create unique ID
    const memoryId = `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Store in ChromaDB
    await collection.upsert({
      ids: [memoryId],
      embeddings: [embedding],
      documents: [content],
      metadatas: [{ contentType, userId, ...metadata }]
    });

    // Store metadata in PostgreSQL
    const client = await pool.connect();
    try {
      await client.query(
        `INSERT INTO memory_entries (user_id, content_hash, content_type, metadata)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (content_hash) DO UPDATE SET last_accessed = CURRENT_TIMESTAMP`,
        [userId, require('crypto').createHash('sha256').update(content).digest('hex'), contentType, JSON.stringify(metadata)]
      );
    } finally {
      client.release();
    }

    logger.info(`Memory stored for user ${userId}`);
    res.json({ success: true, memoryId });
  } catch (err) {
    logger.error('Memory store error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Search memories
app.post('/api/memory/search', async (req, res) => {
  try {
    const { userId, query, limit = 5 } = req.body;

    // Generate query embedding
    const queryEmbedding = await generateEmbedding(query);

    // Search in ChromaDB
    const collection = await getCollection(`memory_${userId}`);
    const results = await collection.query({
      queryEmbeddings: [queryEmbedding],
      nResults: limit,
      include: ['documents', 'metadatas', 'distances']
    });

    res.json({
      results: results.documents.map((docs, i) => ({
        content: docs[0],
        metadata: results.metadatas[i][0],
        distance: results.distances[i][0]
      }))
    });
  } catch (err) {
    logger.error('Memory search error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// CINEMA STUDIO API
// ============================================================

app.post('/api/cinema/generate-video', async (req, res) => {
  try {
    const { userId, prompt, duration = 5, aspectRatio = '16:9' } = req.body;

    // Generate video using Replicate or Runway API (placeholder)
    // In production, integrate with actual video generation API

    const videoData = {
      id: `vid_${Date.now()}`,
      status: 'processing',
      prompt,
      duration,
      aspectRatio,
      estimatedTime: 120 // seconds
    };

    // Store in Redis for status tracking
    await redis.setex(`video:${videoData.id}`, 3600, JSON.stringify(videoData));

    res.json({ success: true, videoId: videoData.id, estimatedTime: videoData.estimatedTime });
  } catch (err) {
    logger.error('Video generation error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/cinema/status/:videoId', async (req, res) => {
  try {
    const { videoId } = req.params;
    const status = await redis.get(`video:${videoId}`);

    if (!status) {
      return res.status(404).json({ error: 'Video not found' });
    }

    res.json(JSON.parse(status));
  } catch (err) {
    logger.error('Video status error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// SEO TOOLS API
// ============================================================

app.post('/api/seo/analyze', async (req, res) => {
  try {
    const { domain } = req.body;

    // Use Serper API for SERP analysis
    const serperResponse = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': process.env.SERPER_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ q: `site:${domain}` })
    });

    const serpResults = await serperResponse.json();

    // Generate schema markup using Ollama
    const schemaPrompt = `Generate Schema.org JSON-LD markup for a website with domain ${domain}.
    Include Organization, WebSite, and BreadcrumbList schemas.`;

    const schemaResponse = await ollama.generate({
      model: 'llama3',
      prompt: schemaPrompt,
      stream: false
    });

    res.json({
      domain,
      serpResults,
      schemaMarkup: schemaResponse.response,
      analyzedAt: new Date().toISOString()
    });
  } catch (err) {
    logger.error('SEO analysis error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// WEB SEARCH & SCRAPE API
// ============================================================

app.post('/api/search', async (req, res) => {
  try {
    const { query, numResults = 10 } = req.body;

    // Use Serper API
    const response = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': process.env.SERPER_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ q: query, num: numResults })
    });

    const results = await response.json();
    res.json(results);
  } catch (err) {
    logger.error('Search error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// HEALTH CHECK
// ============================================================

app.get('/health', async (req, res) => {
  try {
    await testConnections();
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ status: 'unhealthy', error: err.message });
  }
});

// Start server
app.listen(PORT, '0.0.0.0', async () => {
  logger.info(`🚀 Aethersy Backend running on port ${PORT}`);
  await testConnections();
});

module.exports = app;
EOF
echo -e "${GREEN}✅ Backend server created${NC}"

# Final summary
echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║     ✅ AETHERSY AI Installation Complete!          ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}📋 Next Steps:${NC}"
echo ""
echo "1. Update ${YELLOW}.env${NC} with your API keys:"
echo "   - ELEVENLABS_API_KEY (voice synthesis)"
echo "   - SERPER_API_KEY (Google Search)"
echo "   - STRIPE_SECRET_KEY (payments)"
echo "   - TELEGRAM_BOT_TOKEN (bot integration)"
echo ""
echo "2. Access the services:"
echo "   - Frontend: ${YELLOW}http://localhost:3000${NC}"
echo "   - Backend:  ${YELLOW}http://localhost:5000${NC}"
echo "   - Ollama:   ${YELLOW}http://localhost:11434${NC}"
echo "   - ChromaDB: ${YELLOW}http://localhost:8000${NC}"
echo ""
echo "3. View logs:"
echo "   ${YELLOW}docker-compose logs -f${NC}"
echo ""
echo "4. Stop services:"
echo "   ${YELLOW}docker-compose down${NC}"
echo ""
echo -e "${BLUE}📖 Documentation: Check the docs/ folder for API reference${NC}"
echo ""
