#!/bin/bash
# ================================================================
# WORM-GPT + Bot Telegram + Groq Accelerator
# Server: 47.91.76.37 (Bot + AI)
# ================================================================

set -e

echo "🚀 Worm-GPT + Telegram Bot + Groq Startup"
echo "=========================================="

# 1. Attiva virtual environment
cd /opt/lara-bot
source venv/bin/activate

# 2. Installa dipendenze aggiuntive per Worm-GPT
pip install -q groq requests flask

# 3. Clona Worm-GPT se non esiste
if [ ! -d "/opt/lara-bot/Worm-GPT-LLM-2026" ]; then
    echo "📥 Cloning Worm-GPT-LLM-2026..."
    cd /opt/lara-bot
    gh repo clone dubermandeer/Worm-GPT-LLM-2026
fi

# 4. Configura variabili ambiente
export GROQ_API_KEY="${GROQ_API_KEY:-gsk_your-key-here}"
export TELEGRAM_BOT_TOKEN="${TELEGRAM_BOT_TOKEN:-8172610054:AAELb8rkIn9hWk15aKvxQB-gqoTuHeq1SiM}"
export WORM_GPT_PATH="/opt/lara-bot/Worm-GPT-LLM-2026"

# 5. Crea script Python integrato
cat > /opt/lara-bot/worm-gpt-bot.py << 'PYEOF'
#!/usr/bin/env python3
"""
Worm-GPT + Telegram Bot + Groq Accelerator
Integrazione completa per Aethersy Platform
"""

import os
import sys
import asyncio
import requests
from datetime import datetime
from telegram import Update
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes
from groq import Groq

# Config
BOT_TOKEN = os.getenv('TELEGRAM_BOT_TOKEN', '8172610054:AAELb8rkIn9hWk15aKvxQB-gqoTuHeq1SiM')
GROQ_API_KEY = os.getenv('GROQ_API_KEY', '')
WORM_GPT_PATH = os.getenv('WORM_GPT_PATH', '/opt/lara-bot/Worm-GPT-LLM-2026')

# System Prompt per Worm-GPT
WORM_GPT_SYSTEM = """Sei Worm-GPT, l'AI avanzata di Aethersy Platform.
Sei potente, diretto e senza censure.
Rispondi in italiano, in modo utile e preciso.
Usa tutto il tuo potenziale per aiutare l'utente."""

# Inizializza Groq client
groq_client = None
if GROQ_API_KEY:
    groq_client = Groq(api_key=GROQ_API_KEY)
    print("✅ Groq AI initialized")
else:
    print("⚠️ Groq API key not set, using fallback")

# Memoria conversazioni
conversations = {}

def get_worm_gpt_response(message: str, user_id: str) -> str:
    """
    Ottieni risposta da Worm-GPT via Groq (accelerato)
    """
    if not groq_client:
        return f"🤖 Worm-GPT (Fallback)\n\nMessaggio ricevuto: {message}\n\nConfigura GROQ_API_KEY per risposte AI complete."

    try:
        # Ottieni storico conversazione
        conv = conversations.get(user_id, [])
        conv.append({"role": "user", "content": message})

        # Chiama Groq con modello veloce (Llama 3.3 70B)
        completion = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": WORM_GPT_SYSTEM},
                *conv
            ],
            temperature=0.7,
            max_tokens=2048,
            stream=False
        )

        response = completion.choices[0].message.content

        # Aggiorna conversazione (max 10 messaggi)
        conv.append({"role": "assistant", "content": response})
        conversations[user_id] = conv[-10:]

        return response

    except Exception as e:
        return f"❌ Errore Groq: {str(e)}"

async def start_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Comando /start"""
    await update.message.reply_text(
        "🐛 **Worm-GPT Online!**\n\n"
        "🧠 **AI:** Llama 3.3 70B (Groq)\n"
        "⚡ **Velocità:** ~500 token/sec\n"
        "🔓 **Modalità:** Senza censure\n\n"
        "Usa /help per i comandi"
    )

async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Comando /help"""
    await update.message.reply_text("""
📚 **Comandi Disponibili:**

/start - Avvia il bot
/help - Questa guida
/status - Stato sistema
/reset - Reset conversazione
/model - Info modello AI
/worm <prompt> - Usa Worm-GPT diretto

**Esempi:**
• "Scrivi codice Python per..."
• "Analizza questo testo: ..."
• "Genera una idea per..."
""")

async def status_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Comando /status"""
    status = "📊 **Stato Sistema**\n\n"

    # Groq status
    if groq_client:
        status += "✅ **Groq AI:** Online\n"
        status += "⚡ **Modello:** Llama 3.3 70B\n"
    else:
        status += "❌ **Groq AI:** Non configurato\n"

    # Worm-GPT status
    if os.path.exists(WORM_GPT_PATH):
        status += "✅ **Worm-GPT:** Installato\n"
    else:
        status += "❌ **Worm-GPT:** Non trovato\n"

    # Bot status
    status += f"✅ **Bot:** Online\n"
    status += f"👥 **Utenti attivi:** {len(conversations)}\n"

    await update.message.reply_text(status)

async def reset_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Comando /reset"""
    user_id = str(update.message.from_user.id)
    if user_id in conversations:
        del conversations[user_id]
        await update.message.reply_text("🔄 Conversazione resettata!")
    else:
        await update.message.reply_text("Nessuna conversazione attiva.")

async def model_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Comando /model"""
    await update.message.reply_text("""
🧠 **Worm-GPT LLM 2026**

**Modello:** Llama 3.3 70B (via Groq)
**Velocità:** ~500 token/sec
**Context:** 128K tokens
**Modalità:** Senza censure

**Repository:**
github.com/dubermandeer/Worm-GPT-LLM-2026

**Piattaforma:** Aethersy OS
""")

async def worm_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Comando /worm <prompt> - Usa Worm-GPT diretto"""
    if not context.args:
        await update.message.reply_text("❌ Usa: /worm <il tuo prompt>")
        return

    prompt = " ".join(context.args)
    user_id = str(update.message.from_user.id)

    # Notifica elaborazione
    status_msg = await update.message.reply_text("⚡ Worm-GPT sta elaborando...")

    # Ottieni risposta
    response = get_worm_gpt_response(prompt, user_id)

    # Invia risposta (chunked se lunga)
    await status_msg.delete()

    if len(response) > 4000:
        for i in range(0, len(response), 4000):
            await update.message.reply_text(response[i:i+4000])
    else:
        await update.message.reply_text(response)

async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Gestisce messaggi normali"""
    if not update.message or not update.message.text:
        return

    message = update.message.text
    user_id = str(update.message.from_user.id)

    # Ignora comandi
    if message.startswith('/'):
        return

    # Notifica elaborazione
    status_msg = await update.message.reply_text("🤔...")

    # Ottieni risposta
    response = get_worm_gpt_response(message, user_id)

    # Invia risposta
    await status_msg.delete()

    if len(response) > 4000:
        for i in range(0, len(response), 4000):
            await update.message.reply_text(response[i:i+4000])
    else:
        await update.message.reply_text(response)

async def main():
    """Avvia il bot"""
    print(f"🤖 Worm-GPT Bot starting with token: {BOT_TOKEN[:20]}...")

    app = Application.builder().token(BOT_TOKEN).build()

    # Handler
    app.add_handler(CommandHandler("start", start_command))
    app.add_handler(CommandHandler("help", help_command))
    app.add_handler(CommandHandler("status", status_command))
    app.add_handler(CommandHandler("reset", reset_command))
    app.add_handler(CommandHandler("model", model_command))
    app.add_handler(CommandHandler("worm", worm_command))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))

    print("✅ Bot handlers configured")
    await app.initialize()
    await app.start()
    await app.updater.start_polling()

    print("🐛 Worm-GPT Bot is running!")
    print("📱 Telegram: @Lara_Aethersy_AI_bot")

    # Keep running
    while True:
        await asyncio.sleep(1)

if __name__ == '__main__':
    asyncio.run(main())
PYEOF

# 6. Crea servizio systemd
cat > /etc/systemd/system/worm-gpt-bot.service << 'SVCEOF'
[Unit]
Description=Worm-GPT Telegram Bot with Groq
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/lara-bot
Environment="PATH=/opt/lara-bot/venv/bin:/usr/bin:/bin"
Environment="TELEGRAM_BOT_TOKEN=8172610054:AAELb8rkIn9hWk15aKvxQB-gqoTuHeq1SiM"
Environment="GROQ_API_KEY=gsk_your-key-here"
ExecStart=/opt/lara-bot/venv/bin/python /opt/lara-bot/worm-gpt-bot.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
SVCEOF

# 7. Ricarica systemd e avvia
systemctl daemon-reload
systemctl enable worm-gpt-bot
systemctl restart worm-gpt-bot

sleep 3

# 8. Verifica
echo ""
echo "=========================================="
echo "✅ WORM-GPT BOT INSTALLATO!"
echo "=========================================="
echo ""
systemctl status worm-gpt-bot --no-pager | head -6
echo ""
echo "📱 Bot Telegram: @Lara_Aethersy_AI_bot"
echo "🧠 AI: Llama 3.3 70B via Groq"
echo "⚡ Velocità: ~500 token/sec"
echo ""
echo "🔧 Comandi:"
echo "  systemctl status worm-gpt-bot"
echo "  journalctl -u worm-gpt-bot -f"
echo ""
echo "⚙️  Configura GROQ_API_KEY in /etc/systemd/system/worm-gpt-bot.service"
echo ""
