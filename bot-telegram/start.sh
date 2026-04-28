#!/bin/bash
# Avvio Bot Telegram LARA

cd /root/aiforge-pro/bot-telegram

# Kill vecchio processo
pkill -9 -f 'python3 main.py' 2>/dev/null
sleep 2

# Avvia nuovo processo
echo "🚀 Avvio LARA Userbot..."
python3 main.py &
BOT_PID=$!

# Salva PID
echo $BOT_PID > /tmp/lara-bot.pid

echo "✅ Bot avviato (PID: $BOT_PID)"
echo "📄 Log: tail -f /root/aiforge-pro/bot-telegram/bot.log"

# Attiva log
tail -f bot.log &
wait
