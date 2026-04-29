# Deploy Bot Telegram su Fly.io (24/7 sempre attivo)

## Perché Fly.io?

- ✅ **Gratis**: 3 VM shared CPU, 256MB RAM ciascuna
- ✅ **Nessuno sleep**: Bot sempre attivo 24/7
- ✅ **Health check**: Monitoraggio automatico
- ✅ **Deploy automatico**: Da GitHub ad ogni push

---

## 1. Installa Fly CLI

### Windows (PowerShell)
```powershell
powershell -Command "iwr https://fly.io/install.sh -useb | iex"
```

### Mac/Linux
```bash
curl -L https://fly.io/install.sh | sh
```

### Dopo installazione
```bash
# Aggiungi al PATH (se necessario)
export PATH="$HOME/.fly/bin:$PATH"
```

---

## 2. Autenticazione

```bash
fly auth login
```

Si aprirà il browser per il login.

---

## 3. Deploy del Bot

```bash
# Naviga nella cartella del bot
cd bot-telegram

# Lancia il deploy
fly launch --name aethersy-telegram-bot --region ord --no-deploy

# Imposta i secrets (variabili d'ambiente)
fly secrets set TELEGRAM_BOT_TOKEN=8172610054:AAELb8rkIn9hWk15aKvxQB-gqoTuHeq1SiM
fly secrets set LARA_WEBHOOK_URL=https://aethersy.com/api/lara/chat
fly secrets set MAILERLITE_WEBHOOK_ID=fLJ2J3tSXO
fly secrets set NEXT_PUBLIC_SUPABASE_URL=https://heydnqkuwvtbenpougno.supabase.co
fly secrets set SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhleWRucWt1d3Z0YmVucG91Z25vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzEzNTQwNSwiZXhwIjoyMDkyNzExNDA1fQ.U_NTjlTb67HMH0a-D4XZA4IW_OAGZpNvEhS0s3eqsrE
fly secrets set ADMIN_TELEGRAM_ID=8074643162

# Deploy finale
fly deploy --remote-only
```

---

## 4. Verifica

### Controlla stato
```bash
fly status --app aethersy-telegram-bot
```

### Controlla log in tempo reale
```bash
fly logs --app aethersy-telegram-bot
```

### Test health check
```bash
curl https://aethersy-telegram-bot.fly.dev/health
# Deve rispondere: "OK - Bot running"
```

### Test Telegram
Cerca `@Lara_Aethersy_AI_bot` su Telegram e premi `/start`

---

## 5. Comandi Utili

```bash
# Vedi log
fly logs --app aethersy-telegram-bot

# Riavvia il bot
fly restart --app aethersy-telegram-bot

# Stop temporaneo
fly apps stop aethersy-telegram-bot

# Riavvio dopo modifiche
fly deploy --remote-only

# Vedi informazioni VM
fly vm status --app aethersy-telegram-bot

# Scala risorse (se necessario)
fly scale vm shared-cpu-2x --app aethersy-telegram-bot
```

---

## 6. Deploy Automatico (GitHub Actions)

### Crea GitHub Action

1. **Settings** → **Secrets and variables** → **Actions**
2. **New repository secret**: `FLY_API_TOKEN`
3. **Ottieni token:** https://fly.io/user/personal-access_tokens
4. **Crea file:** `.github/workflows/fly-deploy.yml`

```yaml
name: Deploy to Fly.io

on:
  push:
    branches: [master]
    paths:
      - 'bot-telegram/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: superfly/flyctl-actions/setup-flyctl@master
      
      - run: flyctl deploy --remote-only
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}
        working-directory: bot-telegram
```

---

## 7. Monitoraggio

### Dashboard Web
https://fly.io/dashboard

### App specifica
https://fly.io/apps/aethersy-telegram-bot

### Alert (opzionale)
```bash
# Configura alert email
fly alerting add your-email@example.com --app aethersy-telegram-bot
```

---

## 8. Risoluzione Problemi

### Bot non parte
```bash
# Controlla log
fly logs --app aethersy-telegram-bot

# Controlla secrets
fly secrets list --app aethersy-telegram-bot

# Riavvia
fly restart --app aethersy-telegram-bot
```

### Health check fallisce
```bash
# Test locale
curl https://aethersy-telegram-bot.fly.dev/health

# Deve rispondere: OK - Bot running
```

### Memoria insufficiente
```bash
# Aumenta RAM
fly scale memory 512 --app aethersy-telegram-bot
```

---

## 9. Costi

**Piano Free:**
- 3 VM shared-cpu-1x (256MB RAM ciascuna)
- 3GB persistent volume
- 160GB outbound transfer/mese
- **Gratis per sempre**

**Upgrade (se necessario):**
- shared-cpu-2x: $1.94/mese per VM
- shared-cpu-4x: $3.87/mese per VM

---

## ✅ Checklist Finale

- [ ] Fly CLI installato
- [ ] Login effettuato
- [ ] Secrets impostati
- [ ] Deploy completato
- [ ] Health check risponde
- [ ] Bot Telegram risponde a `/start`
- [ ] Log monitorati

---

**Supporto:** https://fly.io/docs/
