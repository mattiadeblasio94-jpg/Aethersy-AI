# Deploy Bot Telegram su Render.com

## Importante: Official Bot Mode

Questo bot usa il **token ufficiale** di Telegram. NON serve API_ID, API_HASH o telefono.

## Variabili d'ambiente richieste

| Nome | Valore | Descrizione |
|------|--------|-------------|
| `TELEGRAM_BOT_TOKEN` | `8172610054:AAELb8rkIn9hWk15aKvxQB-gqoTuHeq1SiM` | Token bot ufficiale |
| `LARA_WEBHOOK_URL` | `https://aethersy.com/api/lara/chat` | Endpoint Lara AI |
| `MAILERLITE_WEBHOOK_ID` | `fLJ2J3tSXO` | Webhook per invio email |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://heydnqkuwvtbenpougno.supabase.co` | URL Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | (la tua chiave) | Chiave Supabase |
| `ADMIN_TELEGRAM_ID` | `8074643162` | ID admin Telegram |

## Deploy su Render.com

1. Vai su https://dashboard.render.com
2. **New +** → **Web Service**
3. Connetti repo: `mattiadeblasio94-jpg/Aethersy-AI`
4. **Root Directory:** `bot-telegram`
5. **Build Command:** `pip install -r requirements.txt`
6. **Start Command:** `python main.py`
7. Aggiungi variabili d'ambiente (tabella sopra)
8. **Deploy!**

## Health Check

Il bot include health check automatico su porta 8000:
- URL: `https://your-bot.onrender.com/health`
- Risposta: `OK`

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
| `/package [email] [pkg]` | Assegna pacchetto |
| `/alerts` | Gestisci notifiche |
| `/limits` | Mostra pacchetti |

## Invio Email con Mailerlite

Usa il comando:
```
/email destinatario@example.com Oggetto Testo del messaggio
```

## Testing

1. Apri Telegram e cerca `@Lara_Aethersy_AI_bot`
2. Premi **Start**
3. Usa `/help` per vedere tutti i comandi

## Troubleshooting

### Bot non risponde
- Controlla log Render dashboard
- Verifica `TELEGRAM_BOT_TOKEN` sia corretto
- Test: `curl https://api.telegram.org/bot<TOKEN>/getMe`

### Errori Supabase
- Le variabili Supabase sono opzionali
- Senza Supabase, tutti utenti sono 'free'
