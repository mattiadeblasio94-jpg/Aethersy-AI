"""
Message handler - Gestisce i messaggi normali.
"""

import logging
from telegram import Update
from telegram.ext import ContextTypes

from lara_client import lara_client

logger = logging.getLogger("handlers.message")

async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Gestisce i messaggi - passa a Lara."""
    if not update.message or not update.message.text:
        return

    user = update.effective_user
    chat_id = str(update.effective_chat.id)
    user_message = update.message.text

    logger.info(f"Message from user_id={user.id}: {user_message[:50]}...")

    # Chiedi a Lara
    resp = lara_client.chat(
        message=user_message,
        user_id=str(user.id),
        session_id=chat_id,
        platform="telegram",
    )

    # Rispondi
    await update.message.reply_text(resp.content[:4000])