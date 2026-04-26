# 🚀 AETHERSY OMNI-PLATFORM v2.0
## Master System Prompt & Architecture Blueprint

---

## 🎯 RUOLO E OBIETTIVO

**RUOLO:** Agisci come Senior Full-Stack AI Engineer & Cinema Production Expert con specializzazione in sistemi RAG, architetture distribuite e monetizzazione SaaS.

**OBIETTIVO:** Sviluppare "Aethersy AI" - piattaforma unificata (Web App + Bot Telegram/WhatsApp) che funge da:
1. **Cinema Studio Professionale** per produzione video/audio AI
2. **Segreteria Autonoma** per imprenditori e agency
3. **Secondo Cervello Cognitivo** con memoria LLM-Wiki
4. **Revenue Engine** con 6+ flussi di monetizzazione integrati

**LOOK & FEEL:** Interfaccia tech-moderna, ultra-reattiva, visualizzazione dati real-time, design system con lenti anamorfiche e occhiali proiettivi (stile Lara HUD).

---

## 🏗️ MODULO 1: SECONDO CERVELLO COGNITIVO (Memory Engine)

### Architettura a 3 Layer

#### A. Layer Semantico (Vettoriale)
```
Provider: ChromaDB / Qdrant
Modello: nomic-embed-text via Ollama (locale)
Funzione: Memorizza il "significato" per ricerca analogica
```

**Implementazione:**
- Ogni interazione → embedding vettoriale
- Ricerca per similarità semantica (cosine similarity)
- Indicizzazione per: Recency, Importance, Semantic Link

#### B. Layer Relazionale (Graph Database)
```
Provider: Neo4j Community / Memgraph
Modello: Property Graph
Funzione: Crea collegamenti "Wiki" tra entità
```

**Schema Nodi:**
```
(User)-[:OWNS]->(Asset)
(Asset)-[:USED_IN]->(Project)
(Project)-[:GENERATED]->(Revenue)
(User)-[:PREFERRED]->(Style/Template)
```

**Query Esempio:**
```cypher
MATCH (u:User {email: $email})-[:OWNS]->(a:Asset)-[:USED_IN]->(p:Project)
WHERE p.revenue > 1000
RETURN a.name, p.title, p.revenue
```

#### C. Layer Procedurale (Document Storage)
```
Provider: AWS S3 / Local FS / MinIO
Modello: File System con metadata
Funzione: Archivio grezzo file (Excel, Video, Immagini, PDF)
```

### Processori Multimodali

| Tipo File | Processor | Output |
|-----------|-----------|--------|
| Excel/CSV | Pandas Parser | Grafici Plotly + insight testuali |
| PDF | PyPDF2 + Ollama | Estrazione testo + summary |
| Immagini | CLIP / Llava | Tag semantici + descrizione |
| Audio | Whisper (Ollama) | Trascrizione + speaker detection |
| Video | FFmpeg + Whisper | Keyframe extraction + audio transcript |

### Funzioni Core Memory Engine

```javascript
// lib/memory-cognitive.js

/**
 * Salva contenuto nel Secondo Cervello con auto-tagging
 * @param {Object} content - {type, data, metadata, userId}
 * @returns {Object} {vectorId, graphNodes, tags}
 */
async function saveToBrain(content) {
  // 1. Analisi multimodale con Ollama
  const analysis = await analyzeWithOllama(content.data, content.type);
  
  // 2. Genera embedding vettoriale
  const embedding = await chromaEmbed(analysis.text);
  
  // 3. Estrai entità per Graph DB
  const entities = await extractEntities(analysis.text);
  
  // 4. Salva su 3 layer
  const vectorId = await vectorDB.upsert(embedding, content.metadata);
  const graphNodes = await graphDB.createNodes(entities);
  const fileRef = await storage.save(content.data);
  
  // 5. Auto-tagging intelligente
  const tags = await autoTag(analysis, entities);
  
  return { vectorId, graphNodes, fileRef, tags };
}

/**
 * Ricerca cognitiva con ranking per rilevanza
 * @param {string} query - Ricerca utente
 * @param {string} userId - ID utente
 * @returns {Array} Risultati ordinati per importance
 */
async function cognitiveSearch(query, userId) {
  // 1. Embedding query
  const queryVector = await chromaEmbed(query);
  
  // 2. Ricerca semantica
  const semanticResults = await vectorDB.query(queryVector, {
    filter: { userId },
    limit: 20
  });
  
  // 3. Espansione graph (entità correlate)
  const graphResults = await graphDB.expandEntities(semanticResults.entities);
  
  // 4. Ranking con formula cognitiva
  const ranked = rankByCognitiveScore(semanticResults, graphResults, {
    recency: 0.3,
    importance: 0.4,
    semanticMatch: 0.3
  });
  
  return ranked;
}

/**
 * Memoria di Intenzione - salva preferenze utente
 * @param {string} action - Azione compiuta
 * @param {string} outcome - Risultato osservato
 * @param {string} preference - Preferenza inferita
 */
async function saveIntentionMemory(action, outcome, preference) {
  await graphDB.query(`
    MATCH (u:User {email: $email})
    MERGE (u)-[:PREFERS {
      action: $action,
      outcome: $outcome,
      confidence: 0.8,
      observedAt: datetime()
    }]->(p:Preference {name: $preference})
  `, { email, action, outcome, preference });
}
```

---

## 🎬 MODULO 2: CINEMA STUDIO PRO (Heggfilds Evolution)

### A. Virtual Cinematography (Controlli Ottici)

**Lenses Selector:**
```javascript
const LENS_PRESETS = {
  '18mm': { focalLength: 18, distortion: 0.15, fov: 100 },
  '35mm': { focalLength: 35, distortion: 0.08, fov: 63 },
  '50mm': { focalLength: 50, distortion: 0.03, fov: 40 },
  '85mm': { focalLength: 85, distortion: 0.01, fov: 24 },
  '200mm': { focalLength: 200, distortion: 0, fov: 10 },
  'anamorphic': { 
    focalLength: 50, 
    squeeze: 2.0, 
    flares: 'horizontal',
    bokeh: 'oval'
  }
};
```

**Camera FX Controls:**
- Depth of Field (f/1.4 - f/22)
- Shutter Speed (1/4000 - 30s)
- ISO Noise (100 - 25600)
- Motion Blur (0% - 100%)
- Lens Flare (none, subtle, dramatic)

**Lighting Presets:**
```javascript
const LIGHTING_PRESETS = {
  'rembrandt': { keyAngle: 45, fillRatio: 0.25, shadow: 'triangle' },
  'highKey': { keyAngle: 0, fillRatio: 0.9, shadow: 'none' },
  'noir': { keyAngle: 60, fillRatio: 0.1, contrast: 'hard' },
  'tealOrange': { keyTemp: 5600, fillTemp: 3200, grade: 'tealOrange' },
  'goldenHour': { keyTemp: 3500, angle: 15, glow: 0.3 }
};
```

### B. Long-Form Production (Regia Autonoma)

**Multi-Scene Manager:**
```javascript
// pages/api/cinema/storyboard.js
{
  "project": {
    "title": "Spot Commerciale 30s",
    "scenes": [
      {
        "id": "scene_001",
        "prompt": "Inquadratura ravvicinata prodotto su sfondo bianco",
        "lens": "50mm",
        "lighting": "highKey",
        "duration": 5,
        "characters": ["product_main"],
        "coherence": {
          "instantId": true,
          "loraRef": "product_v1"
        }
      },
      {
        "id": "scene_002",
        "prompt": "Zoom out drammatico con lens flare",
        "lens": "anamorphic",
        "lighting": "goldenHour",
        "duration": 8,
        "fx": ["lensFlare", "motionBlur"]
      }
    ],
    "audioTrack": {
      "music": "upbeat_corporate",
      "sfx": ["whoosh", "ding"],
      "voiceover": { "enabled": true, "voice": "lara_pro" }
    }
  }
}
```

**Provider AI Priority (costo/qualità):**
1. **Kling 2.1** (video lunghi, coerenza personaggi)
2. **Luma Dream Machine** (movimenti camera complessi)
3. **LTX Video** (render veloci, preview)
4. **Wan 2.1** (effetti speciali, stylized)
5. **Flux 1.1 Pro** (immagini keyframe)
6. **FLUX Schnell** (preview rapide)

**Post-Produzione Server:**
```bash
# FFmpeg pipeline per montaggio automatico
ffmpeg -i scene_001.mp4 -i scene_002.mp4 \
  -filter_complex "[0:v][1:v]concat=n=2:v=1:a=1[v][a]" \
  -vf "colorbalance=rs=.1:gs=-.1:bs=.1" \
  -c:v libx265 -crf 18 -preset slow \
  output_master.mp4
```

### C. Audio & Dubbing

**Voice Lab (ElevenLabs + Replicate):**
- Cloning vocale con 30s di campione
- Sync labiale (Wav2Lip via Replicate)
- Emotion control (happy, serious, excited)
- Multilingual (IT, EN, ES, FR, DE)

**Foley & Soundscape:**
```javascript
// pages/api/cinema/audio.js
async function generateSoundscape(scene, mood) {
  const prompts = {
    'chase': 'intense action music, epic drums, 120bpm',
    'romantic': 'soft piano, strings, ambient pads, 80bpm',
    'corporate': 'upbeat motivational, guitar, light percussion, 110bpm',
    'noir': 'dark jazz, saxophone, double bass, 70bpm'
  };
  
  return await replicate.run('meta/musicgen:...', {
    prompt: prompts[mood],
    duration: scene.duration
  });
}
```

---

## 🤖 MODULO 3: AGENTE AUTONOMO & SEGRETERIA (Business Ops)

### Task Execution Engine

```javascript
// lib/agent-tasks.js

const AgentCapabilities = {
  calendar: {
    read: 'google_calendar.events.list',
    write: 'google_calendar.events.insert',
    smart: 'findBestSlot(meetingType, priority)'
  },
  communication: {
    email: 'sendgrid.send',
    telegram: 'telegram.sendMessage',
    whatsapp: 'twilio.messages.create'
  },
  webNavigation: {
    scrape: 'playwright.goto + extract',
    unlock: 'solveCaptcha + manualRequest',
    seo: 'extractMeta + analyzeCompetitor'
  },
  stripe: {
    monitor: 'stripe.events.list',
    notify: 'telegram.notifyOnCharge',
    report: 'generateRevenueGraph'
  }
};
```

### Proactive Automation Rules

```javascript
// Quando un lead compila form → Lara:
// 1. Salva nel CRM (Redis/PostgreSQL)
// 2. Invia email di benvenuto
// 3. Notifica su Telegram all'admin
// 4. Crea task follow-up tra 3 giorni

async function onLeadCaptured(lead) {
  await crm.save(lead);
  await email.send({
    to: lead.email,
    template: 'welcome_sequence_1',
    personalize: true
  });
  await telegram.notify({
    chatId: ADMIN_CHAT,
    message: `🎯 Nuovo lead: ${lead.name} - ${lead.company}`
  });
  await scheduler.add({
    type: 'followup',
    executeAt: Date.now() + 3 * 24 * 60 * 60 * 1000,
    data: { leadId: lead.id }
  });
}
```

### Stripe Bridge (Real-time Revenue)

```javascript
// pages/api/stripe/webhook.js
async function handleChargeSuccess(event) {
  const charge = event.data.object;
  
  // 1. Notifica Telegram in real-time
  await telegram.send({
    chatId: process.env.TELEGRAM_ADMIN_IDS,
    text: `💰 Vendita: €${charge.amount/100} - ${charge.description}`
  });
  
  // 2. Aggiorna dashboard revenue
  const today = new Date().toISOString().split('T')[0];
  await redis.incr(`revenue:${today}`);
  
  // 3. Log per Secondo Cervello
  await memory.saveToBrain({
    type: 'revenue',
    data: charge,
    metadata: { source: 'stripe', importance: 'high' }
  });
  
  // 4. Trigger automazione (es. ringrazia cliente)
  if (charge.metadata.type === 'first_purchase') {
    await automation.welcomeNewCustomer(charge.customer);
  }
}
```

---

## 🔍 MODULO 4: SEO E MARKETING INTELLIGENCE

### Precision Tools API

```javascript
// lib/seo-tools.js

// DataForSEO / Semrush integration
async function keywordResearch(keyword, country = 'IT') {
  const data = await dataforseo.keywords({
    keywords: [keyword],
    location: country,
    include: ['search_volume', 'cpc', 'competition', 'trends']
  });
  
  return {
    volume: data.search_volume,
    difficulty: data.competition,
    cpc: data.cpc,
    trend: data.monthly_trend,
    opportunities: findLowCompetitionHighVolume(data)
  };
}

// SERP Analysis in real-time
async function serpAnalysis(keyword) {
  const results = await dataforseo.serp({
    keyword,
    depth: 20
  });
  
  return {
    topRanking: results.organic.slice(0, 10),
    avgWordCount: avg(results.organic.map(r => r.word_count)),
    commonKeywords: extractCommonTerms(results.organic),
    gapAnalysis: findContentGaps(results)
  };
}

// Auto-Content con Schema Markup
async function generateSEOOptimizedContent(topic, targetKeyword) {
  const serp = await serpAnalysis(targetKeyword);
  
  const outline = await ollama.generate({
    model: 'llama3.1:70b',
    prompt: `Crea outline articolo SEO per "${topic}".
             Competitor usano avg ${serp.avgWordCount} parole.
             Keywords comuni: ${serp.commonKeywords.join(', ')}`
  });
  
  const content = await ollama.generate({
    model: 'llama3.1:70b',
    prompt: `Scrivi articolo completo: ${outline}`
  });
  
  // Genera JSON-LD Schema
  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": topic,
    "author": "Aethersy AI",
    "datePublished": new Date().toISOString()
  };
  
  return { content, schema, outline };
}
```

---

## 💳 MODULO 5: SISTEMA DI MONETIZZAZIONE AUTOMATICA

### Multi-Tier Subscription (Stripe)

| Piano | Prezzo | Target | Feature Chiave |
|-------|--------|--------|----------------|
| **Free** | €0/mese | Explorer | 5 video/giorno, watermark, 1 progetto |
| **Pro** | €49/mese | Freelance | 2000 crediti, no watermark, progetti illimitati |
| **Business** | €199/mese | Agency | 10000 crediti, team 3 utenti, API access |
| **Enterprise** | Custom | Enterprise | Crediti illimitati, white label, SLA 99.9% |

### Token-Burn System

```javascript
// lib/token-burner.js

const COST_TABLE = {
  'image:flux-pro': 1.5,      // €0.015 per immagine
  'video:kling-2.1': 15,      // €0.15 per secondo
  'video:luma': 12,           // €0.12 per secondo
  'voice:elevenlabs': 0.5,    // €0.005 per carattere
  'agent:email': 2,           // €0.02 per email inviata
  'agent:web-scraper': 5,     // €0.05 per navigazione
  'memory:embed': 0.1         // €0.001 per embedding
};

async function burnTokens(userId, action, duration = 1) {
  const cost = COST_TABLE[action] * duration;
  const balance = await getUserBalance(userId);
  
  if (balance < cost) {
    throw new InsufficientCreditsError();
  }
  
  await redis.decrby(`balance:${userId}`, cost);
  
  // Log per analytics
  await logUsage({ userId, action, cost, timestamp: Date.now() });
  
  // Trigger low-balance alert
  if (balance - cost < 10) {
    await notifyLowBalance(userId);
  }
}
```

### Marketplace Bridge (User-to-User)

```javascript
// pages/api/marketplace/listing.js

/**
 * Permette utenti Pro di vendere asset digitali
 * Split: 80% creatore, 20% Aethersy
 */
async function createListing({ userId, assetType, assetId, price }) {
  const listing = {
    id: generateId(),
    seller: userId,
    assetType, // 'lora', 'preset', 'template', 'prompt'
    assetId,
    price,
    commission: 0.20,
    createdAt: Date.now()
  };
  
  await db.listings.create(listing);
  
  // Setup Stripe Connect per split payment
  const stripeAccount = await stripe.accounts.retrieve(user.stripeId);
  await stripe.paymentIntents.create({
    amount: price * 100,
    currency: 'eur',
    transfer_data: {
      destination: stripeAccount.id,
      amount: price * 80 // 80% al creatore
    }
  });
}
```

### Affiliate Tracking Engine

```javascript
// lib/affiliate-injector.js

const AFFILIATE_MAP = {
  'hosting': { provider: 'cloudways', link: 'https://cloudways.com/?ref=aethersy' },
  'seo-tool': { provider: 'semrush', link: 'https://semrush.com/?ref=aethersy' },
  'microphone': { provider: 'amazon', link: 'https://amazon.it/dp/XXX?tag=aethersy' },
  'camera': { provider: 'bhphoto', link: 'https://bhphoto.com/?AID=aethersy' }
};

/**
 * Lara inietta automaticamente link affiliati
 * quando suggerisce tool esterni
 */
function injectAffiliateLinks(response) {
  let modified = response;
  
  for (const [category, data] of Object.entries(AFFILIATE_MAP)) {
    const regex = new RegExp(`\\b(${category}|${data.provider})\\b`, 'gi');
    if (regex.test(response)) {
      modified = modified.replace(
        regex,
        `[${data.provider}](${data.link})`
      );
    }
  }
  
  return modified;
}
```

### ROI Dashboard (Billing con Valore)

```javascript
// pages/api/user/roi.js

/**
 * Mostra all'utente il ROI generato
 * "Hai speso €50 in token, generato €500 di traffico"
 */
async function calculateROI(userId) {
  const [spent, generated] = await Promise.all([
    // Quanto ha speso in token/abbonamento
    db.usage.sum({ where: { userId }, column: 'cost' }),
    
    // Quanto ha generato (track link, conversioni)
    db.conversions.sum({ 
      where: { userId },
      column: 'revenue'
    })
  ]);
  
  const roi = ((generated - spent) / spent) * 100;
  
  return {
    spent,
    generated,
    roi: roi.toFixed(1),
    message: roi > 0 
      ? `🎯 Ottimo! Ogni €1 speso ne hai generati €${(generated/spent).toFixed(1)}`
      : `📊 Suggerimento: ottimizza le campagne per migliorare il ROI`
  };
}
```

---

## 🛠️ MODULO 6: IMPLEMENTAZIONE E DEPLOYMENT

### Stack Tecnologico

```
Backend:  Node.js 20.x + Express / FastAPI (Python per AI services)
Frontend: Next.js 14.2 + React 18 + Tailwind CSS 3.4
Database: PostgreSQL (dati utente) + Neo4j (graph) + ChromaDB (vettori)
Cache:    Redis (sessioni, rate limiting, real-time stats)
AI:       Ollama (locale) + Replicate API (cloud)
Storage:  AWS S3 / MinIO (self-hosted)
Queue:    BullMQ (Redis-based job queue)
Real-time: WebSocket (Socket.io per sync Bot ↔ Web)
```

### Security & Permissions

```javascript
// lib/permissions.js

const PERMISSIONS = {
  free: {
    maxGenerationsPerDay: 5,
    maxProjects: 1,
    maxMemoryPages: 3,
    watermark: true,
    apiAccess: false
  },
  pro: {
    maxGenerationsPerMonth: 2000,
    maxProjects: Infinity,
    maxMemoryPages: Infinity,
    watermark: false,
    apiAccess: true
  },
  business: {
    maxGenerationsPerMonth: 10000,
    maxTeamMembers: 3,
    webhookAccess: true,
    prioritySupport: true
  },
  enterprise: {
    maxGenerationsPerMonth: Infinity,
    maxTeamMembers: Infinity,
    whiteLabel: true,
    dedicatedInstance: true,
    sla: '99.9%'
  }
};

async function checkPermission(userId, action) {
  const user = await getUser(userId);
  const plan = PERMISSIONS[user.plan];
  
  if (!plan[action]) {
    throw new PermissionDeniedError(`Piano ${user.plan} non include: ${action}`);
  }
  
  return true;
}
```

### Docker Compose (Full Stack)

```yaml
# docker-compose.yml
version: '3.8'

services:
  ollama:
    image: ollama/ollama:latest
    ports:
      - "11434:11434"
    volumes:
      - ollama_data:/root/.ollama
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: all
              capabilities: [gpu]

  chromadb:
    image: chromadb/chroma:latest
    ports:
      - "8000:8000"
    volumes:
      - chroma_data:/chroma/chroma

  neo4j:
    image: neo4j:5-community
    ports:
      - "7474:7474"
      - "7687:7687"
    environment:
      - NEO4J_AUTH=neo4j/aethersy-secret
    volumes:
      - neo4j_data:/data

  postgres:
    image: postgres:16-alpine
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_PASSWORD=aethersy-db-pass
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  backend:
    build: ./backend
    ports:
      - "3001:3001"
    environment:
      - OLLAMA_URL=http://ollama:11434
      - CHROMA_URL=http://chromadb:8000
      - NEO4J_URI=neo4j://neo4j:7687
      - DATABASE_URL=postgresql://postgres:aethersy-db-pass@postgres:5432/aethersy
      - REDIS_URL=redis://redis:6379
    depends_on:
      - ollama
      - chromadb
      - neo4j
      - postgres
      - redis

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:3001
    depends_on:
      - backend

volumes:
  ollama_data:
  chroma_data:
  neo4j_data:
  postgres_data:
  redis_data:
```

### Setup Script (install.sh)

```bash
#!/bin/bash
# setup.sh - Installazione automatica Aethersy AI

echo "🚀 Installazione Aethersy AI Platform..."

# 1. Installa dipendenze
npm install
cd backend && npm install
cd ../frontend && npm install

# 2. Scarica modelli Ollama
echo "📥 Download modelli AI..."
ollama pull llama3.1:8b
ollama pull nomic-embed-text
ollama pull llava:7b

# 3. Configura variabili ambiente
cp .env.example .env.local
echo "✅ Configura .env.local con le tue API key"

# 4. Avvia servizi
docker-compose up -d

# 5. Migrazioni database
npm run db:migrate

# 6. Setup webhook
echo "🔗 Setup webhook Telegram e Stripe..."
# (Inserisci comandi curl per webhook)

echo "✅ Installazione completata!"
echo "📱 Accedi a http://localhost:3000"
```

---

## 📊 STRUTTURA DATABASE (Schema Completo)

### PostgreSQL Schema

```sql
-- Utenti
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  password_hash VARCHAR(255),
  plan VARCHAR(50) DEFAULT 'free',
  telegram_id VARCHAR(100),
  stripe_customer_id VARCHAR(100),
  credits INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Progetti Cinema
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  title VARCHAR(255),
  type VARCHAR(50), -- 'video', 'image', 'audio'
  status VARCHAR(50), -- 'draft', 'rendering', 'completed'
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Asset (file, immagini, video)
CREATE TABLE assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  project_id UUID REFERENCES projects(id),
  type VARCHAR(50), -- 'image', 'video', 'audio', 'document'
  url TEXT,
  metadata JSONB,
  vector_id VARCHAR(100), -- riferimento ChromaDB
  created_at TIMESTAMP DEFAULT NOW()
);

-- Usage (tracking consumi)
CREATE TABLE usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  action VARCHAR(100),
  cost DECIMAL(10,4),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Leads (CRM)
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  name VARCHAR(255),
  email VARCHAR(255),
  company VARCHAR(255),
  status VARCHAR(50), -- 'new', 'contacted', 'converted'
  source VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Conversions (ROI tracking)
CREATE TABLE conversions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  lead_id UUID REFERENCES leads(id),
  revenue DECIMAL(10,2),
  source VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Marketplace Listings
CREATE TABLE listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID REFERENCES users(id),
  asset_type VARCHAR(50),
  asset_id UUID,
  price DECIMAL(10,2),
  commission DECIMAL(5,2) DEFAULT 20.00,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index per performance
CREATE INDEX idx_assets_vector ON assets(vector_id);
CREATE INDEX idx_usage_user_date ON usage_logs(user_id, created_at);
CREATE INDEX idx_leads_status ON leads(status);
```

### Neo4j Graph Schema

```cypher
// Nodi
(:User {email, name, plan, telegramId})
(:Asset {name, type, url, vectorId})
(:Project {title, type, status})
(:Preference {name, category, confidence})
(:Skill {name, level, lastUsed})
(:Revenue {amount, source, date})

// Relazioni
(:User)-[:OWNS]->(:Asset)
(:User)-[:CREATED]->(:Project)
(:Asset)-[:USED_IN]->(:Project)
(:Project)-[:GENERATED]->(:Revenue)
(:User)-[:PREFERS]->(:Preference)
(:User)-[:HAS_SKILL]->(:Skill)
(:User)-[:LINKED_TELEGRAM]->(:TelegramAccount {id, username})

// Index
CREATE INDEX user_email FOR (u:User) ON (u.email);
CREATE INDEX asset_vector FOR (a:Asset) ON (a.vectorId);
```

---

## 🎯 ISTRUZIONE FINALE PER CLAUDE CODE

```
Genera il codice seguendo una struttura modulare. Ogni modulo deve essere:
1. Testabile singolarmente (unit test + integration test)
2. Indipendente ma interoperabile con gli altri moduli
3. Documentato con JSDoc per funzioni pubbliche

La comunicazione tra Web App e Bot deve avvenire tramite:
- WebSocket per sincronizzazione istantanea (Socket.io)
- Redis Pub/Sub per eventi cross-service
- Webhook per eventi esterni (Stripe, Telegram)

INIZIA DA:
1. Struttura del database (migrazioni SQL + Neo4j schema)
2. Sistema di memoria cognitiva (ChromaDB + Ollama integration)
3. API endpoint per Cinema Studio (Replicate integration)
4. Frontend Dashboard con design system tech-modern

NON RIMUOVERE:
- Codice esistente in pages/, lib/, components/
- Funzionality già implementate (auth, pricing, telegram bot)
- Configurazioni environment già presenti

AGGIUNGI SOLO:
- Nuovi moduli come descritto sopra
- Enhancement alle feature esistenti
- Documentazione e test
```

---

## 📈 ROADMAP IMPLEMENTAZIONE

### Phase 1: Foundation (Settimana 1)
- [ ] Setup database schema (PostgreSQL + Neo4j)
- [ ] Memory Engine base (ChromaDB + Ollama)
- [ ] Auth enhancement con Telegram linking

### Phase 2: Cinema Studio (Settimana 2)
- [ ] UI Cinema con controlli cinematografici
- [ ] Integration Replicate (wan, ltx, flux)
- [ ] Storyboard multi-scene

### Phase 3: Agent & Automation (Settimana 3)
- [ ] Google Calendar/Gmail integration
- [ ] Web navigation (Playwright)
- [ ] Stripe bridge real-time

### Phase 4: Monetization (Settimana 4)
- [ ] Token-burn system
- [ ] Marketplace bridge
- [ ] Affiliate injector
- [ ] ROI dashboard

### Phase 5: Polish & Deploy (Settimana 5)
- [ ] Unit test + integration test
- [ ] Performance optimization
- [ ] Security audit
- [ ] Production deploy

---

**© 2025 Aethersy AI - Sogna, Realizza, Guadagna.**

*Documento generato per Claude Code - Architettura definitiva v2.0*
