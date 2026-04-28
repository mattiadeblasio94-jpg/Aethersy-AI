#!/usr/bin/env python3
"""Script di autenticazione Telegram con 2FA"""
import asyncio
from telethon import TelegramClient
from telethon.errors import SessionPasswordNeededError

API_ID = 30925326
API_HASH = 'd2885515f94c6bd123596801854f67a5'
PHONE = '+393395093888'

client = TelegramClient('lara_userbot_session', API_ID, API_HASH)

async def auth():
    await client.connect()

    if not await client.is_user_authorized():
        print(f'📲 Invio codice a {PHONE}...')
        await client.send_code_request(PHONE)

        try:
            code = input('Inserisci il codice ricevuto su Telegram: ')
            await client.sign_in(PHONE, code)
        except SessionPasswordNeededError:
            password = input('Inserisci password 2FA: ')
            await client.sign_in(password=password)
        except Exception as e:
            print(f'❌ Errore: {e}')
            return

    me = await client.get_me()
    print(f'✅ Autenticato come: {me.first_name} (@{me.username or "nessuno"})')
    print(f'📁 Sessione salvata: lara_userbot_session.session')
    await client.disconnect()

asyncio.run(auth())
