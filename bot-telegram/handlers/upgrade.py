"""
Handler /upgrade, /pricing, /status - Gestione account.
"""

import logging
from telegram import Update
from telegram.ext import ContextTypes

logger = logging.getLogger("handlers.upgrade")

UPGRADE_MESSAGE = """🚀 <b>Upgrade il tuo piano</b>

<b>Piani disponibili:</b>

🆓 <b>FREE</b> - €0/mese
• 100 messaggi/giorno
• 10 ricerche/giorno
• Ideale per testare

⭐ <b>PRO</b> - €29/mese
• 1.000 messaggi/giorno
• Ricerche illimitate
• Priorità risposte
• Business plan incluso

🏢 <b>BUSINESS</b> - €99/mese
• 10.000 messaggi/giorno
• Tutto illimitato
• Supporto prioritario
• Account manager dedicato

<b>Vuoi fare upgrade?</b>
Scrivi /email per parlare con un consulente!"""

PRICING_MESSAGE = """💰 <b>Prezzi Aethersy OS</b>

<b>Piano FREE:</b> €0 - 100 msg/giorno

<b>Piano PRO:</b> €29/mese - Ideale per startup
• 1.000 msg/giorno
• Ricerche illimitate
• Priorità AI

<b>Piano BUSINESS:</b> €99/mese - Per team
• 10.000 msg/giorno
• Tutto illimitato
• Supporto 24/7

<b>Piano ENTERPRISE:</b> Contattaci
• Messaggi illimitati
• Deploy dedicato
• SLA garantito

Per upgrade: /email"""

STATUS_MESSAGE = """📊 <b>Il tuo stato</b>

<b>Piano:</b> FREE
<b>Messaggi oggi:</b> 12/100
<b>Ricerche oggi:</b> 3/10

<b>Vuoi vedere tutti i piani?</b> /pricing
<b>Vuoi fare upgrade?</b> /upgrade"""

async def handle_upgrade(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Gestisce /upgrade."""
    await update.message.reply_text(UPGRADE_MESSAGE, parse_mode="HTML")

async def handle_pricing(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Gestisce /pricing."""
    await update.message.reply_text(PRICING_MESSAGE, parse_mode="HTML")

async def handle_status(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Gestisce /status."""
    await update.message.reply_text(STATUS_MESSAGE, parse_mode="HTML")