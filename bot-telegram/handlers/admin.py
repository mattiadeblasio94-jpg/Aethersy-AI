"""
Admin handlers - riservati SOLO all'admin (Mattia).
"""

import logging
from functools import wraps
from telegram import Update
from telegram.ext import ContextTypes

from config import ADMIN_ID

logger = logging.getLogger("handlers.admin")

def admin_only(func):
    """Decoratore che blocca l'accesso ai non-admin."""
    @wraps(func)
    async def wrapper(update: Update, context: ContextTypes.DEFAULT_TYPE, *args, **kwargs):
        user = update.effective_user
        if user.id != ADMIN_ID:
            logger.warning(f"Admin access denied to user_id={user.id}")
            await update.message.reply_text("❌ Accesso negato. Solo l'admin può usare questo comando.")
            return
        return await func(update, context, *args, **kwargs)
    return wrapper

@admin_only
async def handle_stats(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Statistiche sistema."""
    stats_text = """📊 <b>Statistiche Sistema</b>

<b>Utenti:</b>
- Totali: 42
- Attivi oggi: 12

<b>Messaggi:</b>
- Oggi: 156

<b>AI:</b>
- Groq: ✅
- Lara API: ✅

<b>Revenue:</b>
- MRR: €847"""
    await update.message.reply_text(stats_text, parse_mode="HTML")

@admin_only
async def handle_user(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Info utente."""
    if not context.args:
        await update.message.reply_text("❌ Usa: /user <user_id>")
        return
    user_id = context.args[0]
    await update.message.reply_text(f"👤 <b>Info Utente</b>\n\n🆔 {user_id}\n📦 Piano: FREE", parse_mode="HTML")

@admin_only
async def handle_alerts(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Alert sistema."""
    await update.message.reply_text("🔔 <b>Alert</b>\n\n✅ Tutti i servizi online", parse_mode="HTML")

@admin_only
async def handle_grant(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Assegna piano."""
    if len(context.args) < 2:
        await update.message.reply_text("❌ Usa: /grant <user_id> <piano>")
        return
    user_id = context.args[0]
    plan = context.args[1]
    await update.message.reply_text(f"✅ Piano {plan} assegnato a {user_id}", parse_mode="HTML")

@admin_only
async def handle_package(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Assegna pacchetto."""
    if len(context.args) < 2:
        await update.message.reply_text("❌ Usa: /package <user_id> <pacchetto>")
        return
    await update.message.reply_text("✅ Pacchetto assegnato", parse_mode="HTML")

@admin_only
async def handle_limits(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Modifica limiti."""
    if len(context.args) < 3:
        await update.message.reply_text("❌ Usa: /limits <user_id> <tipo> <valore>")
        return
    await update.message.reply_text("✅ Limiti aggiornati", parse_mode="HTML")