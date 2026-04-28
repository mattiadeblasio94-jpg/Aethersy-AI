#!/bin/bash
# Script di deploy per aiforge-pro su Alibaba Cloud ECS
# Ubuntu 24.04 - 512MB RAM

set -e

echo "=== Deploy aiforge-pro su Alibaba Cloud ECS ==="

# 1. Aggiornamento sistema
echo "[1/6] Aggiornamento sistema..."
sudo apt update -qq

# 2. Installazione Node.js 20.x
echo "[2/6] Installazione Node.js..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 3. Installazione dipendenze Python
echo "[3/6] Installazione dipendenze Python..."
sudo apt install -y python3-pip python3-venv

# 4. Installazione dipendenze progetto
echo "[4/6] Installazione dipendenze Next.js..."
cd /home/ecs-user/aiforge-pro
npm install --production

# 5. Setup Bot Telegram
echo "[5/6] Setup Bot Telegram..."
cd /home/ecs-user/aiforge-pro/bot-telegram
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# 6. Crea file .env
echo "[6/6] Configurazione ambiente..."
cat > /home/ecs-user/aiforge-pro/.env << 'EOF'
NODE_ENV=production
NEXT_PUBLIC_APP_URL=http://47.87.139.66:3000
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
echo "  cd /home/ecs-user/aiforge-pro"
echo "  npm run build && npm start  # Next.js su porta 3000"
echo ""
echo "  cd bot-telegram"
echo "  source venv/bin/activate"
echo "  python main.py  # Bot Telegram"
echo ""
