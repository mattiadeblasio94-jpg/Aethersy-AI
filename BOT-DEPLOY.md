# Bot Telegram Aethersy-AI - Deploy su Railway

## Problema risolto

Il Dockerfile nella root punta a `bot-telegram/` così Railway può vedere e buildare il bot.

## Variabili d'ambiente da configurare su Railway

Vai su Railway → Progetto → Variables e aggiungi:

| Nome | Valore |
|------|--------|
| `TELEGRAM_BOT_TOKEN` | `8172610054:AAELb8rkIn9hWk15aKvxQB-gqoTuHeq1SiM` |
| `LARA_WEBHOOK_URL` | `https://aethersy.com/api/lara/chat` |
| `NEXT_PUBLIC_APP_URL` | `https://aethersy.com` |
| `MAILERLITE_WEBHOOK_ID` | `fLJ2J3tSXO` |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://heydnqkuwvtbenpougno.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | (la tua chiave Supabase) |
| `ADMIN_TELEGRAM_ID` | `8074643162` |

## Dopo aver configurato le variabili

1. Railway rileverà automaticamente il Dockerfile
2. Il bot si deployerà in ~2 minuti
3. Controlla i log per verificare l'avvio
4. Testa il bot su Telegram: `@Lara_Aethersy_AI_bot`

## Comandi per testare il bot

```
/start - Inizia conversazione
/help - Guida completa
/status - Verifica piano
/email - Invia email
```

## Se il deploy fallisce

1. Controlla i log su Railway
2. Verifica che tutte le variabili siano impostate
3. Assicurati che il token bot sia corretto
4. Triggera un redeploy manuale (Deploy → Redeploy)
