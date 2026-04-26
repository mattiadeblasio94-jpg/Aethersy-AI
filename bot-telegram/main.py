#!/usr/bin/env python3
"""
Bot Telegram Personale con AI Cloud - Versione Cloud
Risponde automaticamente ai messaggi privati usando Lara AI
Nessun costo OpenAI - usa il tuo agent già configurato
"""

import os
import sys
from telethon import TelegramClient, events
import requests
from dotenv import load_dotenv

load_dotenv()

# Configura credenziali
API_ID = int(os.getenv('TELEGRAM_API_ID', '30925326'))
API_HASH = os.getenv('TELEGRAM_API_HASH', 'd2885515f94c6bd123596801854f67a5')
BOT_TOKEN = os.getenv('TELEGRAM_BOT_TOKEN', '')
PHONE = os.getenv('TELEGRAM_PHONE', '')

# Lara AI endpoint
LARA_URL = os.getenv('LARA_WEBHOOK_URL', 'https://aiforge-pro-mattiadeblasio94-8016s-projects.vercel.app/api/lara/chat')

# Memoria conversazioni
conversation_history = {}

SYSTEM_PROMPT = """
Sei un assistente AI personale utile, amichevole e intelligente.
Rispondi in modo naturale e conversazionale in italiano.
Sii conciso ma completo. Usa emoji con moderazione.
"""

def call_lara_ai(messages, user_id):
    """Chiama Lara AI per ottenere risposta"""
    try:
        last_message = messages[-1] if messages else "Ciao"
        response = requests.post(
            LARA_URL,
            json={
                'message': last_message,
                'userId': f'telegram_{user_id}',
                'sessionId': f'tg_session_{user_id}'
            },
            headers={'Content-Type': 'application/json'},
            timeout=30
        )
        if response.status_code == 200:
            data = response.json()
            return data.get('response', data.get('message', 'Non ho capito.'))
    except Exception as e:
        print(f"Errore chiamata Lara AI: {e}")
    return None

async def main():
    # Crea client
    if BOT_TOKEN:
        client = TelegramClient('bot_session', API_ID, API_HASH)
        await client.start(bot_token=BOT_TOKEN)
        print("✅ Bot avviato con token")
    else:
        client = TelegramClient('user_session', API_ID, API_HASH)
        await client.start(phone=PHONE)
        print("✅ Account personale avviato")

    @client.on(events.NewMessage(incoming=True, func=lambda e: e.is_private))
    async def handle_message(event):
        if event.sender_id == (await client.get_me()).id:
            return

        user_input = event.text or ''
        user_id = str(event.sender_id)

        if user_id not in conversation_history:
            conversation_history[user_id] = [SYSTEM_PROMPT]

        conversation_history[user_id].append(user_input)
        if len(conversation_history[user_id]) > 6:
            conversation_history[user_id] = conversation_history[user_id][-6:]

        bot_response = call_lara_ai(conversation_history[user_id], user_id)

        if bot_response:
            await event.respond(bot_response)
        else:
            await event.respond("🤖 Ciao! Sono il tuo assistente personale.")

    @client.on(events.NewMessage(pattern='/start'))
    async def handle_start(event):
        await event.respond("""
👋 **Ciao! Sono il tuo Assistente Personale AI**

Rispondo automaticamente ai tuoi messaggi usando l'intelligenza artificiale.

**Comandi:**
/reset - Resetta conversazione
/help - Mostra aiuto

Inviami un messaggio per iniziare!
        """, parse_mode='md')

    @client.on(events.NewMessage(pattern='/reset'))
    async def handle_reset(event):
        user_id = str(event.sender_id)
        conversation_history[user_id] = [SYSTEM_PROMPT]
        await event.respond("🔄 Conversazione resettata!")

    @client.on(events.NewMessage(pattern='/help'))
    async def handle_help(event):
        await event.respond("""
**Comandi disponibili:**
/start - Inizia
/reset - Resetta memoria
/help - Questo aiuto

Scrivi semplicemente un messaggio e risponderò automaticamente!
        """, parse_mode='md')

    print("🤖 Bot in ascolto...")
    await client.run_until_disconnected()

if __name__ == '__main__':
    import asyncio
    asyncio.run(main())
