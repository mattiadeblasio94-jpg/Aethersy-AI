"""
Message handler - Gestisce i messaggi normali con sync alla piattaforma.
"""

import logging
import requests
import os
from telegram import Update
from telegram.ext import ContextTypes

from lara_client import lara_client

logger = logging.getLogger("handlers.message")

# URL piattaforma per sync
PLATFORM_URL = os.getenv('NEXT_PUBLIC_APP_URL', 'https://aethersy.com')
SYNC_ENABLED = os.getenv('TELEGRAM_SYNC_ENABLED', 'true').lower() == 'true'

async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Gestisce i messaggi - passa a Lara e sync alla piattaforma."""
    if not update.message or not update.message.text:
        return

    user = update.effective_user
    chat_id = str(update.effective_chat.id)
    user_message = update.message.text

    logger.info(f"Message from user_id={user.id}: {user_message[:50]}...")

    # 1. Sync messaggio a piattaforma web
    if SYNC_ENABLED:
        try:
            requests.post(
                f"{PLATFORM_URL}/api/telegram/sync",
                json={
                    'action': 'send',
                    'userId': str(user.id),
                    'chatId': chat_id,
                    'message': user_message,
                    'platform': 'telegram'
                },
                timeout=5
            )
            logger.info(f"Synced message to platform for user {user.id}")
        except Exception as e:
            logger.warning(f"Sync failed: {e}")

    # 2. Chiedi a Lara
    resp = lara_client.chat(
        message=user_message,
        user_id=str(user.id),
        session_id=chat_id,
        platform="telegram",
    )

    # 3. Rispondi su Telegram
    await update.message.reply_text(resp.content[:4000])

    # 4. Sync risposta a piattaforma web
    if SYNC_ENABLED:
        try:
            requests.post(
                f"{PLATFORM_URL}/api/telegram/sync",
                json={
                    'action': 'send',
                    'userId': str(user.id),
                    'chatId': chat_id,
                    'message': resp.content,
                    'platform': 'telegram'
                },
                timeout=5
            )
            logger.info(f"Synced response to platform for user {user.id}")
        except Exception as e:
            logger.warning(f"Response sync failed: {e}")