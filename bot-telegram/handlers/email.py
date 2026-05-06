"""
Handler /email - Gestione email Mailerlite.
"""

import logging
from telegram import Update
from telegram.ext import ContextTypes, ConversationHandler

logger = logging.getLogger("handlers.email")

WAITING_EMAIL = 1

EMAIL_MESSAGE = """📧 <b>Configura la tua email</b>

Inserisci l'email che vuoi usare per ricevere aggiornamenti e comunicazioni da Aethersy OS.

<b>Nota:</b> Non condivideremo mai la tua email con terze parti.

Inserisci la tua email:"""

EMAIL_CONFIRMED = """✅ <b>Email configurata!</b>

La tua email è stata salvata. Riceverai aggiornamenti importanti su:
• Nuove funzionalità
• Aethersy OS news
• Offerte speciali

<b>Grazie!</b> 🚀"""

async def handle_email(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Gestisce /email - richiede email."""
    await update.message.reply_text(EMAIL_MESSAGE, parse_mode="HTML")
    return WAITING_EMAIL

async def handle_email_received(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Gestisce ricezione email."""
    email = update.message.text.strip()

    if '@' not in email or '.' not in email:
        await update.message.reply_text("❌ Email non valida. Riprova con un'email corretta:")
        return WAITING_EMAIL

    logger.info(f"Email collected: {email}")
    await update.message.reply_text(EMAIL_CONFIRMED, parse_mode="HTML")
    return ConversationHandler.END

async def handle_email_cancel(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Annulla configurazione email."""
    await update.message.reply_text("❌ Configurazione email annullata.")
    return ConversationHandler.END