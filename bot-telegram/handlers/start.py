"""
Handler /start, /chat, /help - Comandi base utente.
"""

import logging
from telegram import Update
from telegram.ext import ContextTypes

from lara_client import lara_client

logger = logging.getLogger("handlers.start")

WELCOME_MESSAGE = """👋 <b>Benvenuto in Aethersy OS!</b>

Io sono <b>Lara</b>, il tuo AI Agent senior.

<b>Cosa posso fare:</b>
🎯 Business Plan e strategia
📊 Marketing e vendite
💻 Coding e deploy
🔍 Analisi di mercato
📈 Scalare il tuo business

<b>Comandi:</b>
/chat - Parla con Lara
/help - Guida completa
/upgrade - Upgrade piano
/email - Configura email

<b>La nostra conversazione viene salvata per darti risposte sempre più precise.</b>

Scrivi un messaggio per iniziare! 🚀"""


HELP_MESSAGE = """📖 <b>Guida Aethersy OS</b>

<b>Comandi base:</b>
/start - Benvenuto
/chat - Parla con Lara
/help - Questa guida

<b>Gestione account:</b>
/email - Configura email
/upgrade - Upgrade piano

<b>Informazioni:</b>
/status - Il tuo stato
/pricing - Piani e prezzi

<b>Per assistenza:</b>
Scrivi @support

<b>Lara risponde a qualsiasi domanda sul tuo business!</b>"""


async def handle_start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Gestisce /start."""
    user = update.effective_user
    logger.info(f"/start from user_id={user.id} username={user.username}")

    await update.message.reply_text(
        WELCOME_MESSAGE,
        parse_mode="HTML",
        disable_web_page_preview=True,
    )


async def handle_chat(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Gestisce /chat - passa automaticamente a Lara."""
    user = update.effective_user
    logger.info(f"/chat from user_id={user.id}")

    session_id = str(update.effective_chat.id)
    resp = lara_client.chat(
        message="Ciao! Vorrei parlare con te.",
        user_id=str(user.id),
        session_id=session_id,
        platform="telegram",
    )

    await update.message.reply_text(resp.content[:4000])


async def handle_help(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Gestisce /help."""
    user = update.effective_user
    logger.info(f"/help from user_id={user.id}")

    await update.message.reply_text(HELP_MESSAGE, parse_mode="HTML")