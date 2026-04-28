#!/usr/bin/env python3
"""Script di autenticazione Telegram"""
import asyncio
from telethon import TelegramClient

API_ID = 30925326
API_HASH = 'd2885515f94c6bd123596801854f67a5'
PHONE = '+393395093888'

client = TelegramClient('lara_userbot_session', API_ID, API_HASH)

async def auth():
    await client.connect()
    if not await client.is_user_authorized():
        await client.send_code_request(PHONE)
        code = input('Codice Telegram: ')
        try:
            await client.sign_in(PHONE, code)
        except Exception as e:
            print(f'Errore: {e}')
            return
    print('✅ Autenticazione completata!')
    await client.disconnect()

asyncio.run(auth())
