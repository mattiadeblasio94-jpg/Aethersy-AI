#!/bin/bash
# ================================================================
# LARA BOT - SETUP AUTOMATICO SERVER
# Esegui su OGNI server Alibaba per unire il cluster
# ================================================================
# Uso: curl -sL URL_DELLO_SCRIPT | bash
# Oppure: bash setup-all.sh
# ================================================================

set -e

echo "🚀 Lara Bot Cluster Setup"
echo "========================="
echo ""

# 1. Installa dipendenze base
echo "[1/6] Installo dipendenze..."
apt-get update -qq >/dev/null 2>&1 || true
apt-get install -y -qq python3-pip curl >/dev/null 2>&1 || true

# 2. Crea directory bot
echo "[2/6] Creo directory bot..."
mkdir -p /root/aiforge-pro/bot-telegram
cd /root/aiforge-pro/bot-telegram

# 3. Installa Python dependencies
echo "[3/6] Installo Python packages..."
pip3 install -q python-telegram-bot==21.0 python-dotenv requests

# 4. Crea file .env
echo "[4/6] Configuro .env..."
cat > .env << 'ENVEOF'
TELEGRAM_BOT_TOKEN=8172610054:AAELb8rkIn9hWk15aKvxQB-gqoTuHeq1SiM
LARA_WEBHOOK_URL=https://aethersy.com/api/lara/chat
NEXT_PUBLIC_APP_URL=https://aethersy.com
MAILERLITE_WEBHOOK_ID=fLJ2J3tSXO
ADMIN_TELEGRAM_ID=8074643162
ENVEOF

# 5. Crea main.py (bot ufficiale)
echo "[5/6] Creo main.py..."
cat > main.py << 'MAINEOF'
#!/usr/bin/env python3
"""Lara Telegram Bot - Official Bot Mode"""
import os, asyncio, json
from telegram import Update
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes
import requests
from dotenv import load_dotenv

load_dotenv()

BOT_TOKEN = os.getenv('TELEGRAM_BOT_TOKEN', '8172610054:AAELb8rkIn9hWk15aKvxQB-gqoTuHeq1SiM')
LARA_URL = os.getenv('LARA_WEBHOOK_URL', 'https://aethersy.com/api/lara/chat')
LARA_SERVER = os.getenv('LARA_SERVER_URL', 'http://47.87.134.105:3000')

conversation_history = {}

async def handle_start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text("🤖 **Lara AI Online!**\n\nBot ufficiale Aethersy-AI.\n\nUsa /help per i comandi.")

async def handle_help(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text("""
📚 **Comandi Disponibili:**
/start - Inizia conversazione
/help - Mostra questa guida
/status - Verifica il tuo piano
/reset - Reset conversazione

**Esempi:**
• "Cerca news su AI"
• "Genera immagine"
• "Scrivi codice Python"
""")

async def handle_status(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text("📊 **Il tuo piano:** Free\n\nLimiti:\n• 100 messaggi/giorno\n• 10 ricerche/giorno\n\nUpgrade: https://aethersy.com/pricing")

async def handle_reset(update: Update, context: ContextTypes.DEFAULT_TYPE):
    uid = str(update.message.from_user.id)
    conversation_history[uid] = []
    await update.message.reply_text("🔄 **Conversazione reset!**")

async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not update.message or update.message.text.startswith('/'):
        return

    uid = str(update.message.from_user.id)
    msg = update.message.text

    # Storico conversazione
    if uid not in conversation_history:
        conversation_history[uid] = []
    conversation_history[uid].append(msg)
    if len(conversation_history[uid]) > 10:
        conversation_history[uid] = conversation_history[uid][-10:]

    # Chiama Lara API
    try:
        resp = requests.post(
            LARA_URL if LARA_URL else f'{LARA_SERVER}/api/lara/chat',
            json={'message': msg, 'userId': uid, 'sessionId': uid},
            timeout=30
        )
        if resp.status_code == 200:
            data = resp.json()
            await update.message.reply_text(data.get('response', 'Non ho capito.'))
            return
    except Exception as e:
        print(f"Error: {e}")

    # Fallback
    await update.message.reply_text(f"🤔 Ho ricevuto: {msg}\n\nLara API non disponibile, riprova più tardi.")

async def post_init(application: Application):
    await application.bot.set_my_commands([
        ('start', 'Inizia'),
        ('help', 'Guida'),
        ('status', 'Stato'),
        ('reset', 'Reset'),
    ])

async def run_bot():
    application = Application.builder().token(BOT_TOKEN).build()

    application.add_handler(CommandHandler("start", handle_start))
    application.add_handler(CommandHandler("help", handle_help))
    application.add_handler(CommandHandler("status", handle_status))
    application.add_handler(CommandHandler("reset", handle_reset))
    application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))

    application.post_init = post_init

    print("🤖 Bot ufficiale avviato!")
    print(f"   Token: {BOT_TOKEN[:20]}...")
    print(f"   Lara URL: {LARA_URL}")

    await application.initialize()
    await application.start()
    await application.updater.start_polling()

    while True:
        await asyncio.sleep(1)

if __name__ == '__main__':
    asyncio.run(run_bot())
MAINEOF

# 6. Crea servizio systemd per il bot
echo "[6/6] Creo servizio systemd..."
cat > /etc/systemd/system/telegram-bot.service << 'SVCEOF'
[Unit]
Description=Lara Telegram Bot
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/root/aiforge-pro/bot-telegram
Environment="PATH=/root/aiforge-pro/bot-telegram/venv/bin"
ExecStart=/usr/bin/python3 main.py
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
SVCEOF

# Attiva servizi
systemctl daemon-reload 2>/dev/null || true
systemctl enable telegram-bot 2>/dev/null || true
systemctl start telegram-bot 2>/dev/null || true

# 7. Crea agent di gestione remota (opzionale, per cluster)
echo "[7/6] Installo agent di gestione..."
mkdir -p /opt/lara-agent
cat > /opt/lara-agent/agent.py << 'AGENTEOF'
#!/usr/bin/env python3
"""Lara Bot Cluster Agent - Gestisce bot remotamente"""
import os, subprocess, json
from http.server import HTTPServer, BaseHTTPRequestHandler

class Handler(BaseHTTPRequestHandler):
    def do_POST(self):
        length = int(self.headers.get('Content-Length', 0))
        data = json.loads(self.rfile.read(length)) if length else {}
        cmd = data.get('cmd', 'status')

        result = {'ok': True, 'cmd': cmd}

        if cmd == 'start':
            subprocess.run(['systemctl', 'start', 'telegram-bot'])
        elif cmd == 'stop':
            subprocess.run(['systemctl', 'stop', 'telegram-bot'])
        elif cmd == 'restart':
            subprocess.run(['systemctl', 'restart', 'telegram-bot'])
        elif cmd == 'status':
            r = subprocess.run(['systemctl', 'is-active', 'telegram-bot'], capture_output=True, text=True)
            result['status'] = r.stdout.strip()
        elif cmd == 'deploy':
            subprocess.run(['bash', '-c', 'cd /root/aiforge-pro/bot-telegram && python3 main.py &'])
            result['message'] = 'Deploy initiated'

        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(result).encode())

    def log_message(self, format, *args):
        pass  # Suppress logging

if __name__ == '__main__':
    print("📡 Lara Agent avviato su porta 9999")
    HTTPServer(('0.0.0.0', 9999), Handler).serve_forever()
AGENTEOF

cat > /etc/systemd/system/lara-agent.service << 'AGENTSVC'
[Unit]
Description=Lara Bot Cluster Agent
After=network.target

[Service]
Type=simple
Restart=always
ExecStart=/usr/bin/python3 /opt/lara-agent/agent.py

[Install]
WantedBy=multi-user.target
AGENTSVC

systemctl daemon-reload 2>/dev/null || true
systemctl enable lara-agent 2>/dev/null || true
systemctl start lara-agent 2>/dev/null || true

# Done!
echo ""
echo "========================="
echo "✅ SETUP COMPLETATO!"
echo "========================="
echo ""
echo "🤖 Bot Telegram:"
systemctl status telegram-bot --no-pager 2>/dev/null | head -5 || echo "   In avvio..."
echo ""
echo "📡 Agent Cluster (porta 9999):"
systemctl status lara-agent --no-pager 2>/dev/null | head -5 || echo "   In avvio..."
echo ""
echo "📊 Log bot: journalctl -u telegram-bot -f"
echo "🔧 Comandi agent: curl http://localhost:9999 -d '{\"cmd\":\"status\"}'"
echo ""
echo "🌐 Dashboard: https://aethersy.com/bot-manager"
echo ""
