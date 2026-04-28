# Aethersy-AI - Deploy Guide

## Architettura

```
┌─────────────────────────────────────────────────────────────┐
│                    AETHERSY-AI PLATFORM                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  🌐 Web App: https://aethersy.com (Vercel)                  │
│     - Next.js 14                                            │
│     - Dashboard AI / Admin / Terminal                       │
│     - API: Groq (Llama 3.1) + Ollama (fallback)             │
│                                                              │
│  🤖 Telegram Bot: @Lara_Aethersy_AI_bot (Render)            │
│     - python-telegram-bot v21                               │
│     - Mailerlite email integration                          │
│     - Supabase user management                              │
│                                                              │
│  📊 Database: Supabase PostgreSQL                           │
│     - Users, Messages, Memory, Projects                     │
│                                                              │
│  🔧 AI Backend: Groq API (primario) + Ollama (locale)       │
└─────────────────────────────────────────────────────────────┘
```

## 1. Deploy Piattaforma Web (Vercel)

La piattaforma è deployata su: **https://aethersy.com**

### Variabili Vercel

```bash
# AI
GROQ_API_KEY=gsk_...
OLLAMA_BASE_URL=http://localhost:11434

# Database
NEXT_PUBLIC_SUPABASE_URL=https://heydnqkuwvtbenpougno.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY=...

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# API Esterne
SERPER_API_KEY=...
REPLICATE_API_TOKEN=...
```

### Trigger Deploy Manuale

1. Vai su https://vercel.com/dashboard
2. Trova progetto `aethersy-ai`
3. **...** → **Redeploy**

## 2. Deploy Bot Telegram (Render)

Bot: **@Lara_Aethersy_AI_bot**

### Configurazione Render

1. Vai su https://dashboard.render.com
2. **New +** → **Web Service**
3. Connetti repo: `mattiadeblasio94-jpg/Aethersy-AI`
4. Configura:
   - **Name:** `aethersy-telegram-bot`
   - **Region:** Oregon
   - **Branch:** `master`
   - **Root Directory:** `bot-telegram`
   - **Runtime:** `Python 3`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `python main.py`

### Variabili Environment Render

```
TELEGRAM_BOT_TOKEN=8172610054:AAELb8rkIn9hWk15aKvxQB-gqoTuHeq1SiM
LARA_WEBHOOK_URL=https://aethersy.com/api/lara/chat
MAILERLITE_WEBHOOK_ID=fLJ2J3tSXO
NEXT_PUBLIC_SUPABASE_URL=https://heydnqkuwvtbenpougno.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<tua-chiave>
ADMIN_TELEGRAM_ID=8074643162
```

### Verifica Deploy

1. Controlla log su Render dashboard
2. Test Telegram: cerca `@Lara_Aethersy_AI_bot` e premi `/start`
3. Test comandi: `/help`, `/status`

## 3. Struttura File

```
Aethersy-AI/
├── pages/                    # Next.js pages (Vercel)
│   ├── index.js             # Landing page
│   ├── dashboard.js         # Dashboard AI
│   ├── admin.js             # Admin panel
│   └── api/
│       ├── lara/chat.ts     # Lara chat API (Groq)
│       ├── project.js       # Project generator
│       └── ...
├── lib/
│   ├── lara-core.ts         # Core AI (Groq + Ollama)
│   ├── agents.js            # AI agents
│   ├── memory.js            # Memory management
│   └── supabase.js          # Database client
├── bot-telegram/
│   ├── main.py              # Official bot (Render)
│   ├── requirements.txt     # Python deps
│   └── .env.example         # Environment template
├── vercel.json              # Vercel config
└── next.config.js           # Next.js config
```

## 4. Comandi Bot

| Comando | Descrizione |
|---------|-------------|
| `/start` | Inizia conversazione |
| `/status` | Verifica piano |
| `/upgrade` | Link upgrade |
| `/help` | Guida |
| `/email` | Invia email |

### Admin

| Comando | Descrizione |
|---------|-------------|
| `/stats` | Statistiche |
| `/user [email]` | Dettagli utente |
| `/package [email] [pkg]` | Assegna pacchetto |

## 5. Troubleshooting

### Bot non risponde (Render)
1. Controlla log: https://dashboard.render.com
2. Verifica token: `curl https://api.telegram.org/bot<TOKEN>/getMe`
3. Redeploy: **Manual Deploy** → **Clear build cache & deploy**

### Piattaforma non carica (Vercel)
1. Controlla build log su Vercel dashboard
2. Verifica variabili d'ambiente
3. **Redeploy** dal dashboard

### Errori API Lara
- Groq key: controlla `GROQ_API_KEY` su Vercel
- Test endpoint: `curl https://aethersy.com/api/lara/chat -X POST -H "Content-Type: application/json" -d '{"message":"ciao"}'`

## 6. Sicurezza

- **MAI committare `.env`** (già in `.gitignore`)
- Usa **GitHub Secrets** o **Render/Vercel Environment Variables**
- **SSH key** per accesso server (no password)
- **Rate limiting** attivo su API

---

**Supporto:** Contatta admin o apri issue su GitHub.
