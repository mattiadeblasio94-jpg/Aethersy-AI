#!/bin/bash
# Script di deploy per aiforge-pro su Alibaba Cloud ECS
# Nuovo server - IP: 47.87.134.105

set -e

echo "=== Deploy aiforge-pro su Alibaba Cloud ECS ==="
echo "Server: 47.87.134.105"
echo ""

# 1. Aggiornamento sistema
echo "[1/7] Aggiornamento sistema..."
apt update -qq

# 2. Installazione Node.js 20.x
echo "[2/7] Installazione Node.js..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# 3. Installazione dipendenze Python
echo "[3/7] Installazione dipendenze Python..."
apt install -y python3-pip python3-venv git

# 4. Installazione dipendenze Next.js
echo "[4/7] Installazione dipendenze Next.js..."
cd /root/aiforge-pro
npm install --production

# 5. Build Next.js
echo "[5/7] Build Next.js..."
npm run build

# 6. Setup Bot Telegram
echo "[6/7] Setup Bot Telegram..."
cd /root/aiforge-pro/bot-telegram
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# 7. Crea file .env
echo "[7/7] Configurazione ambiente..."
cat > /root/aiforge-pro/.env << 'EOF'
NODE_ENV=production
NEXT_PUBLIC_APP_URL=http://47.87.134.105:3000
TELEGRAM_API_ID=30925326
TELEGRAM_API_HASH=d2885515f94c6bd123596801854f67a5
TELEGRAM_BOT_TOKEN=
TELEGRAM_PHONE=
LARA_WEBHOOK_URL=http://localhost:3000/api/lara/chat
EOF

echo ""
echo "=== Deploy completato! ==="
echo ""
echo "Per avviare i servizi:"
echo "  cd /root/aiforge-pro"
echo "  npm start  # Next.js su porta 3000"
echo ""
echo "  cd bot-telegram"
echo "  source venv/bin/activate"
echo "  python main.py  # Bot Telegram"
echo ""
