#!/bin/bash
# ================================================================
# INIZIALIZZAZIONE SERVER ALIBABA - AETHERSY PLATFORM
# Da eseguire su ogni server
# ================================================================

set -e

echo "🚀 Aethersy Platform - Inizializzazione Server"
echo "==============================================="

# 1. Clona repository
echo "[1/4] Cloning repository..."
mkdir -p /root/aiforge-pro
cd /root/aiforge-pro

if [ ! -d ".git" ]; then
    git init
    git remote add origin https://github.com/mattiadeblasio94-jpg/Aethersy-AI.git
fi

git pull origin master

# 2. Installa dipendenze
echo "[2/4] Installing dependencies..."
npm install --production

# 3. Configura variabili ambiente
echo "[3/4] Configuring environment..."
cat > .env.production << 'EOF'
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://aethersy.com

# OpenClaw Gateway
OPENCLAW_GATEWAY_URL=ws://47.87.134.105:18789

# Ollama
OLLAMA_BASE_URL=http://47.87.134.105:11434
OLLAMA_MODEL=llama3.1:8b

# Groq - INSERISCI LA TUA KEY
GROQ_API_KEY=your_groq_key_here

# Alibaba Cloud - INSERISCI LA TUA KEY
ALIBABA_API_KEY=your_alibaba_key_here
ALIBABA_MODEL=qwen-max

# Replicate - INSERISCI LA TUA KEY
REPLICATE_API_TOKEN=your_replicate_token_here

# Telegram - INSERISCI IL TUO TOKEN
TELEGRAM_BOT_TOKEN=your_telegram_token_here

# Supabase - INSERISCI I TUOI DATI
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_key_here

# Google OAuth - INSERISCI I TUOI DATI
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# Stripe - INSERISCI LE TUE KEY
STRIPE_SECRET_KEY=your_stripe_key_here
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret_here
EOF

# 4. Avvia servizi
echo "[4/4] Starting services..."

# Build Next.js
npm run build

# Avvia con PM2
pm2 start ecosystem.config.js --env production || {
    # Se non esiste ecosystem.config.js, avvia bridge direttamente
    pm2 start gateway/bridge.ts --name lara
}

pm2 save

echo ""
echo "==============================================="
echo "✅ INIZIALIZZAZIONE COMPLETATA!"
echo "==============================================="
echo ""
pm2 status
echo ""
echo "📄 Log: pm2 logs"
echo "🔧 Restart: pm2 restart all"
echo "🛑 Stop: pm2 stop all"
echo ""
