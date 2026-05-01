# Aethersy Gateway

Gateway agentico per Aethersy OS - Collega Telegram, Dashboard Web e AI Server.

## Architettura

```
┌─────────────────┐     WebSocket      ┌──────────────────┐
│  Telegram Bot   │ ◄────────────────► │   Dashboard Web  │
└────────┬────────┘                    └──────────────────┘
         │
         ▼
┌─────────────────┐
│  Bridge.ts      │ ← Ponte Telegram-WebSocket
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Agent-Core.ts  │ ← Loop ReAct (Think-Plan-Act-Verify)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Tools          │
│  ├─ obsidian.ts │ ← Gestione note Markdown
│  ├─ generate.ts │ ← Generazione immagini/video/audio
│  ├─ stripe.ts   │ ← Pagamenti e abbonamenti
│  ├─ lead-mgr.ts │ ← CRM e gestione lead
│  └─ market-deploy.ts │ ← Marketplace agenti
└─────────────────┘
```

## Installazione

### 1. Dipendenze

```bash
npm install
```

### 2. Variabili d'ambiente

Crea `.env.server` con:

```env
# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=eyJxxx

# Telegram
TELEGRAM_BOT_TOKEN=8172610054:AAELb8rkIn9hWk15aKvxQB-gqoTuHeq1SiM

# AI
GROQ_API_KEY=gsk_xxx
OLLAMA_URL=http://localhost:11434

# Stripe
STRIPE_SECRET_KEY=sk_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# WebSocket
WS_PORT=3001
```

### 3. Avvia server WebSocket

```bash
npx ts-node gateway/bridge.ts
```

Il server ascolterà su `ws://localhost:3001`

## Comandi Telegram

| Comando | Descrizione |
|---------|-------------|
| `/start` | Avvia il bot |
| `/help` | Mostra guida comandi |
| `/note <titolo>` | Crea nuova nota |
| `/search <query>` | Cerca nel vault |
| `/status` | Stato account |
| `/config <key>=<value>` | Modifica config (admin) |

## API Gateway

### WebSocket Events

**Client → Server:**
- `agent-start`: Inizia nuova sessione
- `terminal-output`: Stream output
- `agent-complete`: Sessione completata

**Server → Client:**
- `config-change`: Aggiornamento configurazione
- `note-created`: Nuova nota creata

### REST API

| Endpoint | Metodo | Descrizione |
|----------|--------|-------------|
| `/api/admin/config` | GET/POST | Gestione config |
| `/api/marketplace/agents` | GET | Lista agenti |
| `/api/marketplace/purchase` | POST | Acquista agente |
| `/api/logs?action=recent` | GET | Log attività |

## Tools Disponibili

### Obsidian Tool
```typescript
import { searchNotes, createNote } from './gateway/tools/obsidian';

// Cerca note
const notes = await searchNotes({ query: 'business', userId: 'user123' });

// Crea nota
const note = await createNote({
  title: 'Idea Startup',
  content: '# Descrizione\n...',
  userId: 'user123',
  folder: 'projects',
  tags: ['startup', 'idea']
});
```

### Generate Tool
```typescript
import { generateImage, generateVideo } from './gateway/tools/generate';

// Genera immagine
const image = await generateImage({
  prompt: 'Cyberpunk city at night',
  style: 'cyberpunk',
  size: '1024x1024',
  userId: 'user123'
});

// Genera video
const video = await generateVideo({
  prompt: 'Flying through cyberpunk city',
  duration: 4,
  userId: 'user123'
});
```

### Stripe Tool
```typescript
import { createCheckoutSession, getSubscriptionStatus } from './gateway/tools/stripe';

// Crea sessione checkout
const url = await createCheckoutSession(
  userId,
  'pro',
  'https://aethersy.com/success',
  'https://aethersy.com/cancel'
);

// Verifica abbonamento
const status = await getSubscriptionStatus(userId);
```

## Deploy in Produzione

### Docker

```dockerfile
FROM node:20-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
EXPOSE 3001

CMD ["npx", "ts-node", "gateway/bridge.ts"]
```

### Docker Compose

```yaml
version: '3.8'
services:
  gateway:
    build: .
    ports:
      - "3001:3001"
    env_file:
      - .env.server
    restart: unless-stopped
```

## Monitoraggio

### Log

```bash
# Log realtime
journalctl -u aethersy-gateway -f

# Log errori
journalctl -u aethersy-gateway -p err
```

### Health Check

```bash
curl http://localhost:3001/health
```

## Sicurezza

- ✅ Auth middleware per verifica abbonamento
- ✅ Rate limiting per utente
- ✅ Sandbox Docker per esecuzione codice
- ✅ Validazione input AI
- ✅ Encryption dati sensibili

## Troubleshooting

### "Connection refused" su WebSocket
Verifica che il server gateway sia attivo:
```bash
ps aux | grep bridge.ts
```

### Telegram bot non risponde
Controlla il token:
```bash
curl "https://api.telegram.org/bot<TOKEN>/getMe"
```

### Errori AI
Verifica connessione a Groq/Ollama:
```bash
curl http://localhost:11434/api/tags
```
