# Bot Telegram Personale - Cloud Deploy

Bot Telegram che risponde automaticamente usando Lara AI.

## Deploy su Railway

1. **Crea account** su https://railway.app

2. **Nuovo Progetto** → "Deploy from GitHub repo"

3. **Connetti il repo** `aiforge-pro`

4. **Aggiungi variabili d'ambiente** (Settings → Variables):
   ```
   TELEGRAM_BOT_TOKEN=8172610054:AAELb8rkIn9hWk15aKvxQB-gqoTuHeq1SiM
   LARA_WEBHOOK_URL=https://aethersy.com/api/lara/chat
   ```

5. **Deploy automatico** - Railway builda e deploya

## Deploy su Render

1. **Crea account** su https://render.com

2. **New Web Service** → Connect repo GitHub

3. **Build Command**: `pip install -r requirements.txt`

4. **Start Command**: `python bot-telegram/main.py`

5. **Environment Variables** (stesse di sopra)

## Deploy su Fly.io

```bash
# Installa Fly CLI
curl -L https://fly.io/install.sh | sh

# Login
fly auth login

# Crea app
fly launch --name lara-telegram-bot

# Configura variabili
fly secrets set TELEGRAM_BOT_TOKEN=8172610054:AAELb8rkIn9hWk15aKvxQB-gqoTuHeq1SiM

# Deploy
fly deploy
```

---

