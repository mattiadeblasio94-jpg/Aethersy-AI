#!/bin/bash
# ================================================================
# DEPLOY AUTOMATICO - WORM-GPT BOT + AETHERSY PLATFORM
# Server: 47.91.76.37 (Bot + AI)
# ================================================================

set -e

echo "🚀 Aethersy Platform - Deploy Automatico"
echo "=========================================="

# 1. Installa dipendenze di sistema
echo "📦 Installazione dipendenze..."
apt-get update -qq
apt-get install -y -qq python3 python3-pip python3-venv git curl

# 2. Prepara directory
cd /opt
rm -rf lara-bot 2>/dev/null || true
mkdir -p lara-bot
cd lara-bot

# 3. Clona repository
echo "📥 Cloning repository..."
git init
git remote add origin https://github.com/mattiadeblasio94-jpg/Aethersy-AI.git
git pull origin master

# 4. Crea ambiente virtuale
echo "🐍 Creazione virtual environment..."
python3 -m venv venv
source venv/bin/activate

# 5. Installa dipendenze Python
echo "📦 Installazione pacchetti Python..."
pip install --upgrade pip
pip install python-telegram-bot==21.0 groq python-dotenv requests flask

# 6. Configura variabili ambiente
echo "⚙️ Configurazione ambiente..."
# Le variabili devono essere impostate nel file .env o nel sistema
# export GROQ_API_KEY="your-groq-key"
# export TELEGRAM_BOT_TOKEN="your-telegram-token"

# 7. Ferma eventuali istanze precedenti
echo "🛑 Stop istanze precedenti..."
pkill -f "worm-gpt-bot" 2>/dev/null || true
pkill -f "main.py" 2>/dev/null || true

# 8. Avvia il bot
echo "✅ Avvio Worm-GPT Bot..."
cd /opt/lara-bot
nohup venv/bin/python bot-telegram/worm-gpt-bot.py > worm-gpt.log 2>&1 &

sleep 3

# 9. Verifica
echo ""
echo "=========================================="
echo "✅ DEPLOY COMPLETATO!"
echo "=========================================="
echo ""
ps aux | grep -E "worm-gpt|bot-telegram" | grep -v grep || echo "⚠️ Bot non trovato in esecuzione"
echo ""
echo "📱 Bot Telegram: @Lara_Aethersy_AI_bot"
echo "🧠 AI: Llama 3.3 70B via Groq"
echo "⚡ Velocità: ~500 token/sec"
echo ""
echo "🔧 Comandi utili:"
echo "  ps aux | grep worm-gpt"
echo "  tail -f /opt/lara-bot/worm-gpt.log"
echo "  systemctl status worm-gpt-bot (se installato come servizio)"
echo ""
