#!/usr/bin/env python3
"""
Bot Telegram Personale con AI Cloud
Risponde automaticamente ai messaggi privati usando l'API Lara già configurata
Nessun costo OpenAI - usa il tuo AI Agent esistente
"""

from telethon import TelegramClient, events
import os
from dotenv import load_dotenv
import requests

# Carica variabili d'ambiente
load_dotenv()

# Configura le tue credenziali
API_ID = 30925326
API_HASH = 'd2885515f94c6bd123596801854f67a5'

# Usa AI cloud gratuita (Anthropic Claude o alternativa)
# Se non configurato, usa risposte base
CLAUDE_API_KEY = os.getenv('CLAUDE_API_KEY', '')

# Inizializza client Telegram
client = TelegramClient('session_name', API_ID, API_HASH)

# Sistema prompt per il bot
SYSTEM_PROMPT = """
Sei un assistente AI personale utile, amichevole e intelligente.
Rispondi in modo naturale e conversazionale, adattandoti al tono dell'utente.
Se l'utente scrive in italiano, rispondi in italiano.
Sii conciso ma completo. Usa emoji con moderazione.
"""

# Memoria conversazioni (per utente)
conversation_history = {}

def call_cloud_ai(messages):
    """Chiama API cloud per risposte AI (no OpenAI)"""

    # Opzione 1: Usa Lara (il tuo AI Agent già deployato)
    LARA_WEBHOOK_URL = os.getenv('LARA_WEBHOOK_URL', 'https://aiforge-pro-mattiadeblasio94-8016s-projects.vercel.app/api/lara/chat')

    try:
        # Estrai ultimo messaggio utente
        last_message = messages[-1]['content'] if messages else "Ciao"

        # Chiama la tua API Lara già configurata
        response = requests.post(LARA_WEBHOOK_URL,
            json={'message': last_message, 'userId': 'telegram_bot'},
            headers={'Content-Type': 'application/json'},
            timeout=30
        )

        if response.status_code == 200:
            data = response.json()
            return data.get('response', data.get('message', 'Non ho capito.'))
    except Exception as e:
        print(f"Errore chiamata AI: {e}")

    return None

@client.on(events.NewMessage(incoming=True, func=lambda e: e.is_private))
async def handle_new_message(event):
    # Ignora se il messaggio è nostro
    if event.sender_id == (await client.get_me()).id:
        return

    user_input = event.text or event.message
    user_id = event.sender_id

    # Inizializza storico conversazione se non esiste
    if user_id not in conversation_history:
        conversation_history[user_id] = []

    # Aggiungi messaggio utente
    conversation_history[user_id].append(str(user_input))

    # Mantieni solo ultimi 5 messaggi per economia
    if len(conversation_history[user_id]) > 6:
        conversation_history[user_id] = conversation_history[user_id][-6:]

    try:
        # Chiama AI cloud
        bot_response = call_cloud_ai(conversation_history[user_id])

        if bot_response:
            # Rispondi al messaggio
            await event.respond(bot_response)
        else:
            # Fallback con risposte base
            await event.respond("🤖 Ciao! Sono il tuo assistente personale.")

    except Exception as e:
        await event.respond(f"⚠️ Errore: {str(e)}")

@client.on(events.NewMessage(pattern='/start'))
async def handle_start(event):
    await event.respond("""
👋 <b>Ciao! Sono il tuo Assistente Personale AI</b>

Sono integrato nel tuo Telegram personale e posso:
• Rispondere a domande
• Aiutare con task e problemi
• Conversare in modo naturale
• Ricordare il contesto della conversazione

<b>Comandi:</b>
/reset - Resetta la conversazione
/help - Mostra questo messaggio

Inviami un messaggio privato per iniziare!
    """, parse_mode='html')

@client.on(events.NewMessage(pattern='/reset'))
async def handle_reset(event):
    user_id = event.sender_id
    if user_id in conversation_history:
        conversation_history[user_id] = [{"role": "system", "content": SYSTEM_PROMPT}]
    await event.respond("🔄 Conversazione resettata. Pronto a ricominciare!")

@client.on(events.NewMessage(pattern='/help'))
async def handle_help(event):
    await event.respond("""
<b>Comandi disponibili:</b>
/start - Inizia conversazione
/reset - Resetta la memoria
/help - Mostra aiuto

<b>Come usare:</b>
Inviami semplicemente un messaggio privato.
Risponderò automaticamente usando l'AI.
    """, parse_mode='html')

async def main():
    # Avvia client
    await client.start()
    print("✅ Bot avviato! In ascolto dei messaggi...")
    print("Premi Ctrl+C per fermare")

    # Mantieni attivo
    await client.run_until_disconnected()

if __name__ == '__main__':
    # Crea file .env se non esiste
    if not os.path.exists('.env'):
        with open('.env', 'w') as f:
            f.write("# Inserisci la tua chiave OpenAI qui\nOPENAI_API_KEY='sk-...'\n")
        print("⚠️ Creato file .env - inserisci la tua OPENAI_API_KEY")

    # Avvia bot
    with client:
        client.loop.run_until_complete(main())
