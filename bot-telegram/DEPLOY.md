# Deploy Bot Telegram su Railway

## Problema comune
Railway prova a buildare tutto il repo e fallisce. **Soluzione: deploya solo la cartella `bot-telegram/`**.

## Metodo 1: Docker (consigliato)

Railway userà automaticamente il Dockerfile.

### Passi:
1. Su Railway: New Project → Deploy from GitHub
2. **Importante:** Nel repo, metti i file del bot nella **root** oppure configura Railway per usare la cartella `bot-telegram/`
3. Aggiungi variabili:
   ```
   TELEGRAM_API_ID=30925326
   TELEGRAM_API_HASH=d2885515f94c6bd123596801854f67a5
   TELEGRAM_PHONE=+39_YOUR_NUMBER
   ```
4. Deploy!

## Metodo 2: Render.com (più semplice)

1. Vai su https://render.com
2. New → **Web Service**
3. Connetti repo GitHub
4. **Root Directory:** `bot-telegram`
5. Build: `pip install -r requirements.txt`
6. Start: `python main.py`
7. Environment variables (stesse di sopra)
8. Deploy!

## Metodo 3: Fly.io

```bash
cd bot-telegram
fly launch --name lara-telegram-bot
# Scegli "Existing Dockerfile" quando chiesto

fly secrets set TELEGRAM_API_ID=30925326
fly secrets set TELEGRAM_API_HASH=d2885515f94c6bd123596801854f67a5
fly secrets set TELEGRAM_PHONE=+39_YOUR_NUMBER

fly deploy
```

## Metodo 4: Railway (con root directory)

Se Railway non vede il Dockerfile:

1. Sposta **tutti i file** da `bot-telegram/` nella **root del repo**
2. Oppure crea un nuovo repo dedicato solo al bot
3. Deploy su Railway

---

## Variabili d'ambiente richieste

| Nome | Valore |
|------|--------|
| `TELEGRAM_API_ID` | `30925326` |
| `TELEGRAM_API_HASH` | `d2885515f94c6bd123596801854f67a5` |
| `TELEGRAM_PHONE` | `+39_YOUR_NUMBER` |
| `LARA_WEBHOOK_URL` | (opzionale) URL Lara API |

## Primo avvio

Railway/Render ti chiederà di completare il login Telegram:
1. Controlla i log del deploy
2. Vedrai un codice/fone number request
3. Inserisci il tuo numero Telegram
4. Inserisci codice OTP che ricevi su Telegram

## Testing

Dopo il deploy:
1. Manda un messaggio privato al tuo numero/bot
2. Dovresti ricevere risposta automatica
3. Usa `/help` per vedere comandi
