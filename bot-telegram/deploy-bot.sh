#!/bin/bash
# Deploy Bot Ufficiale Telegram - Alibaba ECS
# Esegui: curl -sL URL | bash

set -e
echo "🚀 Deploy Bot Telegram..."

cd /root/aiforge-pro/bot-telegram 2>/dev/null || { echo "Cartella non esiste"; exit 1; }

pkill -9 -f 'python.*main.py' 2>/dev/null || true
rm -f *.session *.session-journal 2>/dev/null || true

cat > .env << 'EOF'
TELEGRAM_BOT_TOKEN=8172610054:AAELb8rkIn9hWk15aKvxQB-gqoTuHeq1SiM
LARA_WEBHOOK_URL=https://aethersy.com/api/lara/chat
EOF

cat > requirements.txt << 'EOF'
python-telegram-bot==21.0
python-dotenv==1.0.1
requests==2.32.3
EOF

pip3 install -r requirements.txt -q 2>/dev/null || pip3 install python-telegram-bot python-dotenv requests -q

cat > main.py << 'MAINEOF'
#!/usr/bin/env python3
import os, asyncio
from telegram import Update
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes
import requests
from dotenv import load_dotenv
load_dotenv()
BOT_TOKEN = os.getenv('TELEGRAM_BOT_TOKEN')
LARA_URL = os.getenv('LARA_WEBHOOK_URL')
conv = {}
async def h_start(u, c): await u.message.reply_text("🤖 Lara AI online! /help")
async def h_help(u, c): await u.message.reply_text("/start /help /status /reset")
async def h_status(u, c): await u.message.reply_text("📊 Piano: Free")
async def h_reset(u, c): conv[str(u.message.from_user.id)] = []; await u.message.reply_text("🔄 Reset!")
async def h_msg(u, c):
    if not u.message or u.message.text.startswith('/'): return
    uid = str(u.message.from_user.id)
    conv.setdefault(uid, []).append(u.message.text)
    try:
        r = requests.post(LARA_URL, json={'message': u.message.text, 'userId': uid}, timeout=30)
        if r.ok: await u.message.reply_text(r.json().get('response', '?'))
    except: pass
async def main():
    app = Application.builder().token(BOT_TOKEN).build()
    app.add_handler(CommandHandler("start", h_start))
    app.add_handler(CommandHandler("help", h_help))
    app.add_handler(CommandHandler("status", h_status))
    app.add_handler(CommandHandler("reset", h_reset))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, h_msg))
    print("🤖 Bot avviato!")
    await app.initialize(); await app.start(); await app.updater.start_polling()
    while True: await asyncio.sleep(1)
if __name__ == '__main__': asyncio.run(main())
MAINEOF

cat > /etc/systemd/system/telegram-bot.service << 'EOF'
[Unit]
Description=Telegram Bot
After=network.target
[Service]
Restart=always
WorkingDirectory=/root/aiforge-pro/bot-telegram
ExecStart=/usr/bin/python3 main.py
[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload 2>/dev/null || true
systemctl enable telegram-bot 2>/dev/null || true
systemctl start telegram-bot 2>/dev/null || python3 main.py &

sleep 2
echo "✅ Fatto!"
systemctl status telegram-bot --no-pager 2>/dev/null || ps aux | grep main.py | grep -v grep
