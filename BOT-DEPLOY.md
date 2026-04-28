# Aethersy-AI - Deploy Bot Telegram su Render

## Configurazione Render.com

Il bot è configurato per Render.com con health check integrato.

### 1. Collega il Repository

1. Vai su https://dashboard.render.com
2. **New +** → **Web Service**
3. Connetti il repository GitHub: `mattiadeblasio94-jpg/Aethersy-AI`
4. Configura:
   - **Name:** `aethersy-telegram-bot`
   - **Region:** Oregon
   - **Branch:** `master`
   - **Root Directory:** `bot-telegram`
   - **Runtime:** `Python 3`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `python main.py`

### 2. Variabili d'Ambiente (Environment)

Aggiungi queste variabili nella sezione **Environment**:

| Key | Value |
|-----|-------|
| `TELEGRAM_BOT_TOKEN` | `8172610054:AAELb8rkIn9hWk15aKvxQB-gqoTuHeq1SiM` |
| `LARA_WEBHOOK_URL` | `https://aethersy.com/api/lara/chat` |
| `MAILERLITE_WEBHOOK_ID` | `fLJ2J3tSXO` |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://heydnqkuwvtbenpougno.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | *(la tua chiave Supabase)* |
| `ADMIN_TELEGRAM_ID` | `8074643162` |

### 3. Deploy

1. Clicca **Advanced** → **Auto-Deploy:** ✅ Enabled
2. Clicca **Create Web Service**
3. Attendere il deploy (~2-3 minuti)

### 4. Verifica

Dopo il deploy:

1. **Health Check:** `https://aethersy-telegram-bot.onrender.com/health` → Risponde "OK"
2. **Log:** Controlla i log nella dashboard Render
3. **Telegram:** Cerca `@Lara_Aethersy_AI_bot` e premi `/start`

### 5. Outbound IP

Render usa IP condivisi:
```
74.220.48.0/24
74.220.56.0/24
```

## Comandi Bot

| Comando | Descrizione |
|---------|-------------|
| `/start` | Inizia conversazione |
| `/status` | Verifica piano e limiti |
| `/upgrade` | Link upgrade piano |
| `/help` | Guida completa |
| `/reset` | Reset conversazione |
| `/email` | Invia email tramite Mailerlite |

### Admin Commands

| Comando | Descrizione |
|---------|-------------|
| `/stats` | Statistiche sistema |
| `/user [email]` | Dettagli utente |
| `/package [email] [pkg]` | Assegna pacchetto |
| `/alerts` | Gestisci notifiche |

## Troubleshooting

### Bot non risponde
1. Controlla i log su Render
2. Verifica che `TELEGRAM_BOT_TOKEN` sia corretto
3. Test: `curl https://api.telegram.org/bot<TOKEN>/getMe`

### Errori Lara API
- Verifica che `LARA_WEBHOOK_URL` sia raggiungibile
- Controlla che la piattaforma Vercel sia attiva

## Aggiornamenti

Con **Auto-Deploy** attivo, ogni push su `master` deploya automaticamente.

Per deploy manuale:
1. Dashboard Render → Il tuo servizio
2. **Manual Deploy** → **Clear build cache & deploy**

---

**Piattaforma Web:** https://aethersy.com (Vercel)
**Bot Telegram:** @Lara_Aethersy_AI_bot (Render)
