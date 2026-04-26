# 🚀 AETHERSY AI - Quick Start Guide

## Prerequisites

Before starting, ensure you have:

- **Docker** and **Docker Compose** installed
- **Ollama** installed locally (for model downloads)
- **Node.js 20+** (for local development)
- API keys for:
  - Replicate (AI generations)
  - ElevenLabs (voice synthesis)
  - Serper.dev (Google Search API)
  - Stripe (payments)
  - Telegram Bot Token

---

## ⚡ Quick Start (3-Day Launch Plan)

### Day 1: Infrastructure Setup

```bash
# 1. Clone/navigate to project
cd C:\Users\PC\aiforge-pro

# 2. Run installation script
bash install.sh

# 3. Update .env with your API keys
nano .env

# 4. Verify all containers are running
docker-compose ps

# Expected output:
# aethersy-ollama      running
# aethersy-chroma      running
# aethersy-postgres    running
# aethersy-redis       running
# aethersy-backend     running
# aethersy-frontend    running
```

**Verify Ollama Models:**
```bash
docker exec aethersy-ollama ollama list

# Should show:
# llama3              latest
# llava               latest
# nomic-embed-text    latest
```

**Test Health Endpoint:**
```bash
curl http://localhost:5000/health

# Expected:
# {"status":"healthy","services":{"ollama":"connected","chromadb":"connected","postgres":"connected","redis":"connected"}}
```

---

### Day 2: Integration Testing

**1. Test Cognitive Memory:**
```bash
# Store a memory
curl -X POST http://localhost:5000/api/memory/store \
  -H "Content-Type: application/json" \
  -d '{"userId":"test-user","content":"L utente preferisce comunicare in italiano","contentType":"text"}'

# Search memories
curl -X POST http://localhost:5000/api/memory/search \
  -H "Content-Type: application/json" \
  -d '{"userId":"test-user","query":"preferenze lingua"}'
```

**2. Test Cinema Studio:**
```bash
# Generate voice
curl -X POST http://localhost:5000/api/cinema/generate-voice \
  -H "Content-Type: application/json" \
  -d '{"text":"Ciao, sono Lara la tua assistente AI","voiceId":"Lara"}' \
  --output voice.mp3
```

**3. Test SEO Tools:**
```bash
# Keyword research
curl -X POST http://localhost:5000/api/seo/keyword-research \
  -H "Content-Type: application/json" \
  -d '{"seedKeyword":"intelligenza artificiale","country":"IT"}'
```

**4. Test Web App:**
```bash
# Open browser
http://localhost:3000

# Test dashboard login
# Test Telegram link (if bot is configured)
```

---

### Day 3: Production Deployment

**1. Vercel Deployment (Frontend):**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel deploy --prod

# Link domain
vercel alias set <deployment-url> aethersy.com
```

**2. Update Environment Variables:**
- Add all API keys to Vercel project settings
- Update Telegram webhook URL

**3. Set Telegram Webhook:**
```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook?url=https://aethersy.com/api/telegram"
```

**4. Final Verification:**
- [ ] Health check passes
- [ ] All API endpoints respond
- [ ] Telegram bot responds to /start
- [ ] Web app loads at aethersy.com
- [ ] Admin panel accessible
- [ ] Cognitive Memory stores/searches work
- [ ] Cinema Studio generates content
- [ ] SEO tools return data

---

## 📁 File Structure

```
aethersy-pro/
├── backend/
│   ├── src/
│   │   ├── index.js              # Main server
│   │   ├── services/
│   │   │   ├── ollama.js         # Ollama AI
│   │   │   ├── chroma.js         # Vector DB
│   │   │   ├── memory.js         # Cognitive Memory
│   │   │   ├── cinema.js         # Cinema Studio
│   │   │   └── seo.js            # SEO Tools
│   │   └── routes/
│   │       ├── memory.js
│   │       ├── cinema.js
│   │       └── seo.js
│   ├── db/
│   │   └── init.sql
│   └── package.json
├── pages/                    # Next.js web app
├── lib/                      # Shared utilities
├── docs/
│   ├── architecture.md       # Full architecture docs
│   └── QUICKSTART.md         # This file
├── docker-compose.yml
├── install.sh
└── .env
```

---

## 🔧 Troubleshooting

### Ollama Not Connecting
```bash
# Check if Ollama is running
docker-compose ps ollama

# View logs
docker-compose logs ollama

# Restart
docker-compose restart ollama
```

### ChromaDB Errors
```bash
# Clear ChromaDB data
docker-compose down -v chroma_data

# Restart
docker-compose up -d chromadb
```

### Port Conflicts
```bash
# Check what's using ports
netstat -ano | findstr :5000
netstat -ano | findstr :3000
netstat -ano | findstr :11434

# Change ports in docker-compose.yml if needed
```

### Memory Issues
```bash
# Ollama requires significant RAM
# Reduce concurrent requests or add swap space

# Windows: Increase WSL2 memory
# Create .wslconfig in %USERPROFILE%
[ws12]
memory=8GB
swap=4GB
```

---

## 📊 API Reference

### Cognitive Memory
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/memory/store` | POST | Store new memory |
| `/api/memory/search` | POST | Search memories |
| `/api/memory/stats/:userId` | GET | User statistics |
| `/api/memory/context/:userId` | GET | Get chat context |

### Cinema Studio
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/cinema/generate-video` | POST | Generate video |
| `/api/cinema/status/:videoId` | GET | Check status |
| `/api/cinema/generate-voice` | POST | Generate voice |
| `/api/cinema/presets` | GET | Get presets |

### SEO Tools
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/seo/analyze-serp` | POST | SERP analysis |
| `/api/seo/keyword-research` | POST | Keyword research |
| `/api/seo/generate-schema` | POST | Schema markup |
| `/api/seo/full-report` | POST | Full report |

---

## 🎯 Next Steps

After successful deployment:

1. **Configure Stripe webhooks** for subscription handling
2. **Set up monitoring** (Sentry, LogRocket)
3. **Enable CDN** for static assets
4. **Configure backups** for PostgreSQL and ChromaDB
5. **Set up CI/CD** pipeline
6. **Document API** with Swagger/OpenAPI

---

## 📞 Support

- **Documentation**: `/docs/architecture.md`
- **API Logs**: `docker-compose logs -f backend`
- **Health Check**: `http://localhost:5000/health`

---

*Last updated: 2026-04-24*
