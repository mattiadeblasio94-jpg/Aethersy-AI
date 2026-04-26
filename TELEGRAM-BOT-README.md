# Bot Telegram Personale con AI

Bot Telegram che risponde automaticamente usando Lara AI (il tuo agent già configurato).
**Nessun costo OpenAI** - usa l'infrastruttura AI esistente.

## Installazione

### 1. Installa Python
Scarica da: https://www.python.org/downloads/
✅ Spunta "Add Python to PATH" durante l'installazione

### 2. Installa le dipendenze
```bash
pip install telethon python-dotenv requests
```

### 3. Configura (opzionale)
Il file `.env` è già configurato con:
- Credenziali Telegram
- URL di Lara API

Se vuoi cambiare qualcosa, modifica `.env`.

### 4. Avvia il bot
```bash
python telegram-bot-personal.py
```

### 5. Primo avvio
- Ti chiederà di inserire numero di telefono e codice OTP
- Completa l'autenticazione a 2 fattori se attiva
- Il bot è ora attivo e ascolta i messaggi privati

## Comandi

- `/start` - Inizia conversazione
- `/reset` - Resetta la memoria conversazione
- `/help` - Mostra aiuto

## Come funziona

1. Qualcuno ti invia un messaggio privato
2. Il bot intercetta il messaggio
3. Invia il testo a Lara AI (il tuo agent su Vercel)
4. Riceve la risposta AI
5. Risponde automaticamente a nome tuo

## Memoria

Il bot ricorda le ultime 5 conversazioni per utente.

## Stop

Premi `Ctrl+C` nel terminale per fermare il bot.

---

**Nota:** Le tue credenziali Telegram sono già configurate nel file `telegram-bot-personal.py`.
