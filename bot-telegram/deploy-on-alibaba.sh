#!/bin/bash
# ============================================
# DEPLOY BOT UFFICIALE SU ALIBABA ECS
# Sostituisce userbot con official bot
# ============================================

set -e

echo "🚀 Deploy Bot Ufficiale Telegram su Alibaba ECS"
echo "================================================"

# 1. Kill vecchi processi bot
echo "[1/6] Uccido processi bot esistenti..."
pkill -9 -f 'python.*main.py' 2>/dev/null || true
pkill -9 -f 'python.*userbot' 2>/dev/null || true
pkill -9 -f 'telethon' 2>/dev/null || true
pkill -9 -f 'pyrogram' 2>/dev/null || true
sleep 2

# 2. Cerca e rimuovi file sessione userbot
echo "[2/6] Cerco file sessione userbot..."
SESSION_FILES=$(find /root -name "*.session" 2>/dev/null || true)
if [ -n "$SESSION_FILES" ]; then
    echo "⚠️  Trovati file sessione userbot:"
    echo "$SESSION_FILES"
    rm -f $SESSION_FILES 2>/dev/null || true
    echo "✅ Sessioni rimosse"
else
    echo "✅ Nessuna sessione userbot trovata"
fi

# 3. Vai alla directory del bot
echo "[3/6] Preparo directory bot..."
cd /root/aiforge-pro/bot-telegram

# Installa dipendenze se necessario
if [ ! -d "venv" ]; then
    echo "📦 Installo virtualenv..."
    python3 -m venv venv
fi

source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

# 4. Crea/aggiorna .env
echo "[4/6] Configuro variabili d'ambiente..."
cat > .env << 'EOF'
TELEGRAM_BOT_TOKEN=8172610054:AAELb8rkIn9hWk15aKvxQB-gqoTuHeq1SiM
LARA_WEBHOOK_URL=https://aethersy.com/api/lara/chat
NEXT_PUBLIC_APP_URL=https://aethersy.com
MAILERLITE_WEBHOOK_ID=fLJ2J3tSXO
ADMIN_TELEGRAM_ID=8074643162
USE_OPENCLAW=false
LARA_SERVER_URL=http://47.87.134.105:3000
EOF

echo "✅ .env configurato"

# 5. Crea log directory
echo "[5/6] Configuro log..."
mkdir -p /var/log/aiforge
touch /var/log/aiforge/telegram-bot.log

# 6. Crea servizio systemd
echo "[6/6] Creo servizio systemd per avvio automatico..."
cat > /etc/systemd/system/telegram-bot.service << 'EOF'
[Unit]
Description=Lara Telegram Official Bot
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/root/aiforge-pro/bot-telegram
Environment="PATH=/root/aiforge-pro/bot-telegram/venv/bin"
ExecStart=/root/aiforge-pro/bot-telegram/venv/bin/python main.py
Restart=always
RestartSec=5
StandardOutput=append:/var/log/aiforge/telegram-bot.log
StandardError=append:/var/log/aiforge/telegram-bot.log

[Install]
WantedBy=multi-user.target
EOF

# Ricarica e avvia systemd
systemctl daemon-reload
systemctl stop telegram-bot 2>/dev/null || true
systemctl enable telegram-bot
systemctl start telegram-bot

sleep 3

# Verifica stato
echo ""
echo "================================================"
echo "✅ DEPLOY COMPLETATO!"
echo "================================================"
echo ""
systemctl status telegram-bot --no-pager | head -15
echo ""
echo "📄 Log: tail -f /var/log/aiforge/telegram-bot.log"
echo "🔧 Comandi utili:"
echo "   systemctl status telegram-bot"
echo "   systemctl restart telegram-bot"
echo "   systemctl stop telegram-bot"
echo ""
echo "🤖 Bot: @Lara_Aethersy_AI_bot"
echo "================================================"
