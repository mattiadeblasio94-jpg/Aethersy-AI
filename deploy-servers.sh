#!/bin/bash
# ================================================================
# DEPLOY COMPLETO - AETHERSY.COM
# Server Alibaba Cloud + Vercel
# ================================================================

set -e

echo "⚡ Aethersy.com - Deploy Automatico"
echo "===================================="

# Server IP
SERVER1="47.87.141.154"  # Frontend + Bridge
SERVER2="47.87.134.105"  # Lara AI + Database
SERVER3="47.87.141.18"   # Marketplace

# ============================================
# SERVER 1: Frontend + Bridge
# ============================================
echo ""
echo "📦 SERVER 1: $SERVER1 (Frontend + Bridge)"
echo "------------------------------------------"

ssh root@$SERVER1 << 'ENDSSH'
  cd /root/aiforge-pro || { echo "Directory non trovata"; exit 1; }

  # Pull aggiornamenti
  git pull origin master

  # Installa dipendenze
  npm install --production

  # Build
  npm run build

  # Riavvia servizi
  pm2 restart all || pm2 start ecosystem.config.js

  echo "✅ Server 1 aggiornato"
ENDSSH

# ============================================
# SERVER 2: Lara AI + Database
# ============================================
echo ""
echo "🧠 SERVER 2: $SERVER2 (Lara AI + Ollama)"
echo "------------------------------------------"

ssh root@$SERVER2 << 'ENDSSH'
  cd /root/aiforge-pro || { echo "Directory non trovata"; exit 1; }

  # Pull aggiornamenti
  git pull origin master

  # Riavvia Lara AI
  pm2 restart lara || pm2 start gateway/bridge.ts --name lara

  # Verifica Ollama
  systemctl status ollama || echo "Ollama non è un servizio systemd"

  echo "✅ Server 2 aggiornato"
ENDSSH

# ============================================
# SERVER 3: Marketplace (se attivo)
# ============================================
echo ""
echo "🛒 SERVER 3: $SERVER3 (Marketplace)"
echo "------------------------------------"

ssh root@$SERVER3 << 'ENDSSH'
  cd /root/aiforge-pro || { echo "Directory non trovata"; exit 1; }

  # Pull aggiornamenti
  git pull origin master

  # Installa dipendenze
  npm install --production

  # Build
  npm run build

  # Riavvia marketplace
  pm2 restart marketplace || echo "Marketplace non configurato"

  echo "✅ Server 3 aggiornato"
ENDSSH

# ============================================
# VERCEL DEPLOY
# ============================================
echo ""
echo "🌐 DEPLOY VERCEL"
echo "----------------"
vercel deploy --prod --yes

# ============================================
# TELEGRAM WEBHOOK
# ============================================
echo ""
echo "📱 TELEGRAM WEBHOOK"
echo "--------------------"
BOT_TOKEN="7912795396:AAHJmIdu4AmTzD3MhxmmfETNFEb73ZH5R_w"
WEBHOOK_URL="https://aethersy.com/api/telegram"

curl -X POST "https://api.telegram.org/bot$BOT_TOKEN/setWebhook?url=$WEBHOOK_URL"

echo ""
echo "===================================="
echo "✅ DEPLOY COMPLETATO!"
echo "===================================="
echo ""
echo "🌐 Production: https://aethersy.com"
echo "📱 Telegram: @Lara_Aethersy_AI_bot"
echo "🧠 Lara AI: http://$SERVER2:3000"
echo ""
