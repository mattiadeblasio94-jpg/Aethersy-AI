# Deploy Bot Telegram su Railway

## Importante: Official Bot Mode

Questo bot usa il **token ufficiale** di Telegram (non userbot). Non serve completare login Telegram.

## Variabili d'ambiente richieste

| Nome | Valore | Descrizione |
|------|--------|-------------|
| `TELEGRAM_BOT_TOKEN` | `8172610054:AAELb8rkIn9hWk15aKvxQB-gqoTuHeq1SiM` | Token bot ufficiale |
| `LARA_WEBHOOK_URL` | `https://aethersy.com/api/lara/chat` | Endpoint Lara AI |
| `NEXT_PUBLIC_APP_URL` | `https://aethersy.com` | URL applicazione web |
| `MAILERLITE_WEBHOOK_ID` | `fLJ2J3tSXO` | Webhook per invio email |
| `NEXT_PUBLIC_SUPABASE_URL` | (opzionale) | URL Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | (opzionale) | Chiave Supabase |
| `ADMIN_TELEGRAM_ID` | `8074643162` | ID admin Telegram |

## Metodo 1: Railway (consigliato)

1. Su Railway: **New Project** → **Deploy from GitHub**
2. Configura **Root Directory**: `bot-telegram`
3. Aggiungi le variabili d'ambiente dalla tabella sopra
4. Deploy!

### Dockerfile incluso

Il bot include un Dockerfile che Railway userà automaticamente:
- Python 3.11-slim
- Installazione dipendenze
- Avvio automatico con `python main.py`

## Metodo 2: Render.com

1. Vai su https://render.com
2. New → **Web Service**
3. Connetti repo GitHub
4. **Root Directory:** `bot-telegram`
5. Build: `pip install -r requirements.txt`
6. Start: `python main.py`
7. Aggiungi variabili d'ambiente
8. Deploy!

## Metodo 3: Fly.io

```bash
cd bot-telegram
fly launch --name lara-telegram-bot
# Scegli "Existing Dockerfile" quando chiesto

fly secrets set TELEGRAM_BOT_TOKEN=8172610054:AAELb8rkIn9hWk15aKvxQB-gqoTuHeq1SiM
fly secrets set LARA_WEBHOOK_URL=https://aethersy.com/api/lara/chat
fly secrets set MAILERLITE_WEBHOOK_ID=fLJ2J3tSXO

fly deploy
```

## Metodo 4: Vercel (con serverless)

1. Crea nuovo progetto Vercel
2. Imposta root directory: `bot-telegram`
3. Aggiungi variabili d'ambiente
4. Deploy automatico

## Comandi disponibili

| Comando | Descrizione |
|---------|-------------|
| `/start` | Inizia conversazione |
| `/status` | Verifica piano e limiti |
| `/upgrade` | Link upgrade piano |
| `/help` | Guida completa |
| `/reset` | Reset conversazione |
| `/email` | Invia email tramite Mailerlite |

### Comandi Admin

| Comando | Descrizione |
|---------|-------------|
| `/stats` | Statistiche sistema |
| `/user [email]` | Dettagli utente |
| `/alerts` | Gestisci notifiche |
| `/grant [email]` | Concedi accesso admin |
| `/package [email] [pkg]` | Assegna pacchetto |
| `/limits` | Mostra pacchetti |

## Invio Email con Mailerlite

Il bot integra Mailerlite per l'invio email. Usa il comando:

```
/email destinatario@example.com Oggetto Testo del messaggio
```

**Esempio:**
```
/email mario@example.com Preventivo Ciao Mario, ecco il preventivo...
```

## Testing

Dopo il deploy:
1. Apri Telegram e cerca il tuo bot
2. Premi **Start**
3. Usa `/help` per vedere tutti i comandi
4. Prova a inviare un messaggio normale

## Risoluzione problemi

### Il bot non risponde
- Controlla i log su Railway/Render
- Verifica che `TELEGRAM_BOT_TOKEN` sia corretto
- Controlla che `LARA_WEBHOOK_URL` sia raggiungibile

### Errore Mailerlite
- Verifica che il webhook ID sia corretto
- Il destinatario deve essere iscritto alla tua mailing list

### Errori di piano/Supabase
- Le variabili Supabase sono opzionali
- Senza Supabase, tutti gli utenti sono 'free'
