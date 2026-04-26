# 🧠 AETHERSY AI - Cognitive Memory & Ollama Integration

## Panoramica Architettura

```
┌─────────────────────────────────────────────────────────────────┐
│                    AETHERSY AI PLATFORM                          │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │  Telegram   │  │  Web App    │  │  API REST   │             │
│  │     Bot     │  │  (Next.js)  │  │  (Express)  │             │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘             │
│         │                │                │                     │
│         └────────────────┼────────────────┘                     │
│                          │                                      │
│         ┌────────────────▼────────────────┐                     │
│         │       OLLAMA AI SERVER          │                     │
│         │  ┌───────────────────────────┐  │                     │
│         │  │ llama3 (chat)             │  │                     │
│         │  │ llava (vision)            │  │                     │
│         │  │ nomic-embed-text          │  │                     │
│         │  └───────────────────────────┘  │                     │
│         └─────────────────────────────────┘                     │
│                          │                                      │
│         ┌────────────────▼────────────────┐                     │
│         │    VECTOR DATABASE (ChromaDB)   │                     │
│         │    - Memory embeddings          │                     │
│         │    - Semantic search            │                     │
│         └─────────────────────────────────┘                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📁 Struttura del Progetto

```
aethersy-pro/
├── backend/
│   ├── src/
│   │   ├── index.js              # Main server
│   │   ├── services/
│   │   │   ├── ollama.js         # Ollama integration
│   │   │   ├── chroma.js         # Vector DB operations
│   │   │   ├── memory.js         # Cognitive memory
│   │   │   ├── cinema.js         # Cinema Studio
│   │   │   └── seo.js            # SEO tools
│   │   └── routes/
│   │       ├── memory.js         # Memory API routes
│   │       ├── cinema.js         # Cinema API routes
│   │       └── seo.js            # SEO API routes
│   ├── db/
│   │   └── init.sql              # PostgreSQL schema
│   ├── uploads/                  # User uploaded files
│   └── package.json
├── pages/                        # Next.js pages
├── lib/                          # Shared utilities
├── docker-compose.yml
├── install.sh
└── .env
```

---

## 🔧 Setup Ollama

### Modelli Richiesti

| Modello | Scopo | Dimensione |
|---------|-------|------------|
| `llama3` | Chat, ragionamento | ~4.7GB |
| `llava` | Vision (immagini) | ~4.5GB |
| `nomic-embed-text` | Embeddings | ~270MB |

### Comandi Manuali

```bash
# Pull modelli
ollama pull llama3
ollama pull llava
ollama pull nomic-embed-text

# Verifica installazione
ollama list

# Test chat
ollama run llama3 "Ciao, come stai?"

# Test vision (da riga di comando)
ollama run llava "Descrivi questa immagine" /path/to/image.jpg

# Test embeddings
ollama embed nomic-embed-text "Questo è un testo di test"
```

---

## 🧠 Cognitive Memory - Come Funziona

### 1. Ingestion Pipeline

```
Input (testo/immagine/file)
         │
         ▼
┌─────────────────┐
│  Pre-processing │
│  - Estrazione   │
│    testo        │
│  - Normalizz.   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Ollama Embed   │
│  nomic-embed    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  ChromaDB       │
│  - Vector store │
│  - Metadata     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  PostgreSQL     │
│  - Metadati     │
│  - Relazioni    │
└─────────────────┘
```

### 2. API Memory

```javascript
// Store memory
POST /api/memory/store
{
  "userId": "user-123",
  "content": "L'utente preferisce comunicare in italiano",
  "contentType": "text",
  "metadata": { "importance": 0.8, "category": "preference" }
}

// Search memory
POST /api/memory/search
{
  "userId": "user-123",
  "query": "Cosa preferisce l'utente?",
  "limit": 5
}
```

### 3. Temporal Decay

Ogni memoria ha un punteggio di importanza che decade nel tempo:

```
importance(t) = importance_0 * e^(-λt)

dove:
- importance_0 = importanza iniziale (0-1)
- λ = tasso di decadimento (0.01 default)
- t = tempo in giorni
```

---

## 🎬 Cinema Studio API

### Generazione Video

```javascript
POST /api/cinema/generate-video
{
  "userId": "user-123",
  "prompt": "Un tramonto su una spiaggia tropicale",
  "duration": 5,
  "aspectRatio": "16:9",
  "style": "cinematic"
}

Response:
{
  "success": true,
  "videoId": "vid_1234567890",
  "estimatedTime": 120,
  "status": "processing"
}
```

### Check Status

```javascript
GET /api/cinema/status/:videoId

Response:
{
  "id": "vid_1234567890",
  "status": "completed",
  "videoUrl": "https://storage/...",
  "thumbnailUrl": "https://storage/..."
}
```

---

## 🔍 SEO Tools API

### Analisi Dominio

```javascript
POST /api/seo/analyze
{
  "domain": "example.com"
}

Response:
{
  "domain": "example.com",
  "serpResults": [...],
  "schemaMarkup": { ... },
  "keywords": [...],
  "analyzedAt": "2026-04-24T10:00:00Z"
}
```

### Keyword Research

```javascript
POST /api/seo/keywords
{
  "seed": "intelligenza artificiale",
  "country": "IT"
}
```

---

## 🐳 Docker Compose

### Avvio Rapido

```bash
# Avvia tutti i servizi
docker-compose up -d

# Vedi logs
docker-compose logs -f

# Stop
docker-compose down

# Reset completo
docker-compose down -v
```

### Servizi Attivi

| Servizio | Porta | Scopo |
|----------|-------|-------|
| Ollama | 11434 | AI models |
| ChromaDB | 8000 | Vector DB |
| PostgreSQL | 5432 | Dati strutturati |
| Redis | 6379 | Cache/sessions |
| Backend | 5000 | API REST |
| Frontend | 3000 | Next.js app |

---

## 🔐 Sicurezza

### Rate Limiting

```javascript
// 100 richieste per 15 minuti per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
```

### API Key Filtering

```javascript
// Filtra API key dai log
function sanitizeLog(obj) {
  const sensitive = ['API_KEY', 'SECRET', 'TOKEN', 'PASSWORD'];
  // ... implementazione
}
```

### Telegram Webhook Security

```javascript
// Verifica webhook Telegram
function verifyTelegramWebhook(req, res, next) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  // ... validazione
}
```

---

## 📊 Monitoring

### Health Check Endpoint

```bash
curl http://localhost:5000/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2026-04-24T10:00:00Z",
  "services": {
    "ollama": "connected",
    "chromadb": "connected",
    "postgres": "connected",
    "redis": "connected"
  }
}
```

### Logs

```bash
# Backend logs
docker-compose logs backend

# Ollama logs
docker-compose logs ollama

# Tutti i logs
docker-compose logs -f
```

---

## 🚀 Deployment in Produzione

### 1. Configura Variabili d'Ambiente

```bash
# Copia .env.example
cp .env.example .env

# Modifica con le tue chiavi
nano .env
```

### 2. Build e Avvio

```bash
# Build immagini
docker-compose build

# Avvia
docker-compose up -d

# Verifica
docker-compose ps
```

### 3. SSL/HTTPS (opzionale)

```bash
# Con nginx e certbot
docker-compose -f docker-compose.prod.yml up -d
```

---

## 📖 Risorse

- [Ollama Documentation](https://ollama.ai/docs)
- [ChromaDB Docs](https://docs.trychroma.com)
- [PostgreSQL Docs](https://www.postgresql.org/docs)
- [Next.js Docs](https://nextjs.org/docs)

---

*Ultimo aggiornamento: 2026-04-24*
