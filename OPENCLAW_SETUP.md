# OpenClaw + Lara OS Integration

## Configurazione OpenClaw Gateway

OpenClaw è stato configurato per accedere a Lara OS tramite SSH tunnel.

### 1. SSH Tunnel da Windows

```powershell
# Crea tunnel SSH dalla tua macchina locale al server Alibaba
ssh -N -L 18789:127.0.0.1:3000 -i C:\Users\PC\aiforge-pro\alibaba_key.pem root@47.87.134.105
```

### 2. Accedi a Lara UI

Dopo aver creato il tunnel, apri nel browser:
```
http://localhost:18789
```

Oppure usa direttamente l'URL pubblico del server:
```
http://47.87.134.105:3000
```

### 3. Comandi Utili OpenClaw

Una volta connesso, puoi usare OpenClaw per:

```
# Monitora risorse ECS
/monitor ecs

# Esegui script Lara
/run lara-core test

# Debugga API
/debug /api/lara/chat

# Deploy automatico
/deploy vercel
```

## Lara OS — Panoramica

### Architettura

```
┌─────────────────────────────────────────────────────────────┐
│                    LARA OS v2.0                             │
├─────────────────────────────────────────────────────────────┤
│  🧠 DUAL-LLM LOGIC                                          │
│     - Reasoning Layer (Think-Plan-Act-Verify)              │
│     - Memory Layer (pgvector RAG)                           │
│     - Execution Layer (Terminal, API, Workflow)             │
│     - Monitoring Layer (Proactive Engine)                   │
├─────────────────────────────────────────────────────────────┤
│  📦 MODULI                                                  │
│     - Cinema Studio (Video, Music, Image, Voice)            │
│     - Business Engine & Marketplace                         │
│     - Self-Coding Terminal                                  │
│     - Proactive Engine (Telegram Alerts)                    │
├─────────────────────────────────────────────────────────────┤
│  🔗 INTEGRAZIONI                                            │
│     - Google Workspace (Gmail, Sheets, Drive, Calendar)     │
│     - Replicate (FLUX, Wan 2.1, LTX, Music, Voice)          │
│     - Telegram (Bot + Userbot)                              │
│     - Alibaba ECS (Monitoraggio)                            │
│     - Vercel (Deploy)                                       │
│     - Supabase (Database + pgvector)                        │
└─────────────────────────────────────────────────────────────┘
```

### Think-Plan-Act-Verify Cycle

1. **THINK**: Analizza contesto, intenti, vincoli
2. **PLAN**: Decomponi in step eseguibili
3. **ACT**: Esegui con strumenti appropriati
4. **VERIFY**: Valuta risultati, itera se necessario

### Cinema Studio — Parametri Tecnici

**Video:**
- Camera: ISO, Shutter, Aperture, Focal Length (35/50/85mm)
- Lighting: 3-point, Volumetric, Kelvin Temperature
- Long-form: Character consistency, multi-scene

**Music:**
- Audio Rack: BPM, Key, Stem separation, Mastering
- Voice: Emotion mapping, Lip-sync metadata

**Image:**
- Depth-of-field, Texture mapping
- Aspect ratio: 16:9, 4:3, 1:1, 9:16, 21:9

### Proactive Engine

Lara invia alert proattivi su Telegram per:
- ⚠️ Risorse ECS critiche (CPU/RAM > 80%)
- 📈 Opportunità marketplace
- ❌ Errori workflow
- ✅ Task completati
- ⏰ Appuntamenti calendar

### Comandi Telegram

```
/start — Inizia
/status — Verifica operatività
/alerts — Gestisci notifiche
/help — Guida completa
/reset — Reset conversazione
```

## Database Schema

Lo schema completo con pgvector è in `lara-schema-pgvector.sql`.

Esegui su Supabase:
```sql
-- https://app.supabase.com/project/_/sql
-- Incolla contenuto di lara-schema-pgvector.sql
```

## Variabili Ambiente

Aggiorna `.env` sul server:

```bash
# OpenAI
OPENAI_API_KEY=sk-...

# Replicate
REPLICATE_API_TOKEN=r8_...

# Telegram
TELEGRAM_BOT_TOKEN=8172610054:AAELb8rkIn9hWk15aKvxQB-gqoTuHeq1SiM

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...

# Serper (Google Search)
SERPER_API_KEY=...

# App
NEXT_PUBLIC_APP_URL=http://47.87.134.105:3000
LARA_SANDBOX_DIR=/tmp/lara-sandbox
LARA_DOCKER_SANDBOX=true
```

## Test Rapidi

### 1. Test Lara API

```bash
curl -X POST http://47.87.134.105:3000/api/lara/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Ciao Lara, status sistema?", "userId": "test"}'
```

### 2. Test Health Check

```bash
curl http://47.87.134.105:3000/api/health
```

### 3. Test ECS Status

```bash
curl http://47.87.134.105:3000/api/ecs/status
```

### 4. Test Cinema Studio

```bash
curl -X POST http://47.87.134.105:3000/api/lara/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Genera immagine ritratto con camera 85mm f/1.8",
    "userId": "test"
  }'
```

## Debug

### Log Next.js

```bash
tail -f /var/log/nextjs.log
```

### Log Bot Telegram

```bash
tail -f /var/log/telegram-bot.log
```

### Restart Servizi

```bash
# Next.js
pkill -f 'next-server'
cd /root/aiforge-pro && npm start &

# Bot Telegram
pkill -f 'python.*main.py'
cd /root/aiforge-pro/bot-telegram
source venv/bin/activate
python main.py &
```

## Motto

**"Sogna, Realizza, Guadagna"**
