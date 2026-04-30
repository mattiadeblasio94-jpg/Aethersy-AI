#!/bin/bash
# ================================================================
# LARA BOT TELEGRAM - Install Script
# Server: 47.87.134.105 (Primary Bot Server)
# Usage: curl -sL https://raw.githubusercontent.com/mattiadeblasio94-jpg/Aethersy-AI/master/cluster-agents/bot-telegram/install.sh | bash
# ================================================================

set -e
echo "🤖 Lara Bot Telegram - Installation"
echo "===================================="

# Install dependencies
apt-get update -qq
apt-get install -y -qq python3 python3-pip python3-venv curl git

# Create directory
mkdir -p /opt/lara-bot
cd /opt/lara-bot

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install Python packages
pip install -q python-telegram-bot==21.0 requests python-dotenv websocket-client telethon

# Create .env file
cat > .env << 'ENVEOF'
TELEGRAM_BOT_TOKEN=8172610054:AAELb8rkIn9hWk15aKvxQB-gqoTuHeq1SiM
LARA_WEBHOOK_URL=https://aethersy.com/api/lara/chat
LARA_SERVER_URL=http://47.87.134.105:3000
NEXT_PUBLIC_APP_URL=https://aethersy.com
MAILERLITE_WEBHOOK_ID=fLJ2J3tSXO
ADMIN_TELEGRAM_ID=8074643162
USE_OPENCLAW=false
ENVEOF

# Create main bot script
cat > main.py << 'MAINEOF'
#!/usr/bin/env python3
"""
LARA Telegram Bot - Official Bot Mode
AI Model: Qwen 2.5 / DeepSeek (selectable)
"""
import os, asyncio, json
from telegram import Update
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes
import requests
from dotenv import load_dotenv

load_dotenv()

BOT_TOKEN = os.getenv('TELEGRAM_BOT_TOKEN', '8172610054:AAELb8rkIn9hWk15aKvxQB-gqoTuHeq1SiM')
LARA_URL = os.getenv('LARA_WEBHOOK_URL', 'https://aethersy.com/api/lara/chat')
LARA_SERVER = os.getenv('LARA_SERVER_URL', 'http://47.87.134.105:3000')

# AI Model selection
AI_MODELS = {
    'qwen': 'Qwen 2.5 72B - Reasoning & Code',
    'deepseek': 'DeepSeek V3 - Math & Logic',
    'qwen-coder': 'Qwen 2.5 Coder - Programming',
    'deepseek-r1': 'DeepSeek R1 - Chain of Thought'
}

conversation_history = {}
user_model_preference = {}

async def handle_start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    welcome = """
🤖 **Benvenuto su LARA AI Bot!**

Sono il tuo AI Agent personale di Aethersy-AI.

**Modelli AI disponibili:**
• `/qwen` - Qwen 2.5 72B (generale)
• `/deepseek` - DeepSeek V3 (matematica/logica)
• `/coder` - Qwen 2.5 Coder (programmazione)
• `/r1` - DeepSeek R1 (ragionamento profondo)

**Comandi:**
/help - Guida completa
/status - Il tuo piano
/reset - Reset conversazione
/models - Lista modelli

**Esempi:**
• "Cerca ultime news su AI"
• "Scrivi funzione Python per scraping"
• "Genera immagine di un tramonto"
• "Analizza questo codice"

Inizia con /help per la guida completa! 🚀
"""
    await update.message.reply_text(welcome, parse_mode='Markdown')

async def handle_help(update: Update, context: ContextTypes.DEFAULT_TYPE):
    help_text = """
📚 **GUIDA COMPLETA LARA AI BOT**

╔═══════════════════════════════════════╗
║  🤖 COMANDI PRINCIPALI                ║
╠═══════════════════════════════════════╣
║  /start - Avvia il bot               ║
║  /help - Questa guida                ║
║  /status - Verifica piano            ║
║  /reset - Reset conversazione        ║
║  /models - Scegli modello AI         ║
╠═══════════════════════════════════════╣
║  🧠 MODELLI AI                        ║
╠═══════════════════════════════════════╣
║  /qwen - Qwen 2.5 72B                ║
║  /deepseek - DeepSeek V3             ║
║  /coder - Qwen 2.5 Coder             ║
║  /r1 - DeepSeek R1                   ║
╠═══════════════════════════════════════╣
║  🎬 CINEMA STUDIO                     ║
╠═══════════════════════════════════════╣
║  /video - Genera video               ║
║  /image - Genera immagine             ║
║  /music - Genera musica              ║
║  /voice - Text-to-speech             ║
╠═══════════════════════════════════════╣
║  📧 UTILITÀ                           ║
╠═══════════════════════════════════════╣
║  /email - Invia email                ║
║  /search - Ricerca web               ║
║  /code - Esegui codice               ║
╚═══════════════════════════════════════╝

**Piano Attuale:** Free
**Upgrade:** https://aethersy.com/pricing

Scrivi messaggi naturali per chattare! 💬
"""
    await update.message.reply_text(help_text, parse_mode='Markdown')

async def handle_status(update: Update, context: ContextTypes.DEFAULT_TYPE):
    uid = str(update.message.from_user.id)
    model = user_model_preference.get(uid, 'qwen')
    status = f"""
📊 **STATO UTENTE**

**Piano:** Free
**Limiti giornalieri:**
• Messaggi: 100
• Ricerche: 10
• Generazioni media: 5

**Modello AI preferito:** {AI_MODELS.get(model, model)}

**Utilizzo oggi:**
• Messaggi: {len(conversation_history.get(uid, []))}

**Upgrade a Pro (€49/mese):**
• 1000 messaggi/giorno
• Ricerche illimitate
• Priority AI access

👉 https://aethersy.com/pricing
"""
    await update.message.reply_text(status, parse_mode='Markdown')

async def handle_reset(update: Update, context: ContextTypes.DEFAULT_TYPE):
    uid = str(update.message.from_user.id)
    conversation_history[uid] = []
    await update.message.reply_text("🔄 **Conversazione reset!**\n\nNuova chat iniziata.")

async def handle_models(update: Update, context: ContextTypes.DEFAULT_TYPE):
    models_text = """
🧠 **SELEZIONE MODELLO AI**

Scegli il modello preferito:

**1. Qwen 2.5 72B** (`/qwen`)
• Migliore per: uso generale, chat, scrittura
• Velocità: ⚡⚡⚡
• Qualità: ⭐⭐⭐⭐

**2. DeepSeek V3** (`/deepseek`)
• Migliore per: matematica, logica, analisi
• Velocità: ⚡⚡⚡
• Qualità: ⭐⭐⭐⭐⭐

**3. Qwen 2.5 Coder** (`/coder`)
• Migliore per: programmazione, debugging
• Velocità: ⚡⚡⚡⚡
• Qualità: ⭐⭐⭐⭐⭐ (code)

**4. DeepSeek R1** (`/r1`)
• Migliore per: ragionamento complesso
• Velocità: ⚡⚡
• Qualità: ⭐⭐⭐⭐⭐⭐

Il modello resterà salvato per te.
"""
    await update.message.reply_text(models_text, parse_mode='Markdown')

async def handle_model_select(update: Update, context: ContextTypes.DEFAULT_TYPE, model: str):
    uid = str(update.message.from_user.id)
    user_model_preference[uid] = model
    await update.message.reply_text(f"✅ **Modello selezionato:** {AI_MODELS.get(model, model)}\n\nUserà questo modello per le tue richieste.")

async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not update.message or update.message.text.startswith('/'):
        return

    uid = str(update.message.from_user.id)
    msg = update.message.text
    model = user_model_preference.get(uid, 'qwen')

    # Conversation history
    if uid not in conversation_history:
        conversation_history[uid] = []
    conversation_history[uid].append(msg)
    if len(conversation_history[uid]) > 10:
        conversation_history[uid] = conversation_history[uid][-10:]

    # Call Lara API with model preference
    try:
        resp = requests.post(
            LARA_URL if LARA_URL else f'{LARA_SERVER}/api/lara/chat',
            json={
                'message': msg,
                'userId': uid,
                'sessionId': uid,
                'model': model,
                'history': conversation_history[uid]
            },
            timeout=60
        )
        if resp.status_code == 200:
            data = resp.json()
            response = data.get('response', 'Non ho capito.')
            # Handle long responses
            if len(response) > 4096:
                for i in range(0, len(response), 4096):
                    await update.message.reply_text(response[i:i+4096])
            else:
                await update.message.reply_text(response)
            return
    except Exception as e:
        print(f"Error: {e}")

    # Fallback
    await update.message.reply_text(f"🤔 Ho ricevuto: {msg}\n\nLara API non disponibile, riprova più tardi.")

async def handle_video(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text("""
🎬 **CINEMA STUDIO - Generazione Video**

**Comandi:**
`/video <prompt>` - Genera video

**Esempi:**
• `/video Tramonto su oceano, camera 35mm, golden hour`
• `/video Drone shot di montagna, 4K, cinematic`

**Parametri tecnici:**
• Camera: 35mm, 50mm, 85mm
• Lighting: 3-point, volumetric
• Duration: 5-10 secondi

**GPU Server:** 47.91.76.37
**Tempo di generazione:** ~2-5 minuti
""")

async def handle_image(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text("""
🖼️ **CINEMA STUDIO - Generazione Immagini**

**Comandi:**
`/image <prompt>` - Genera immagine

**Esempi:**
• `/image Ritratto cyberpunk, neon lights, f/1.8`
• `/image Paesaggio fantasy, montagne, tramonto`

**Modelli:**
• FLUX.1 Pro - Qualità massima
• SDXL - Veloce
• Midjourney-style - Artistico

**Aspect Ratio:** 16:9, 4:3, 1:1, 9:16
""")

async def handle_music(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text("""
🎵 **CINEMA STUDIO - Generazione Musica**

**Comandi:**
`/music <prompt>` - Genera traccia

**Esempi:**
• `/music Epic orchestral, 120 BPM, C major`
• `/music Lo-fi hip hop, chill, study beats`

**Parametri:**
• BPM: 60-180
• Key: C, D, E, F, G, A, B
• Duration: 30s - 3min
• Stems: separazione tracce
""")

async def post_init(application: Application):
    await application.bot.set_my_commands([
        ('start', 'Inizia'),
        ('help', 'Guida'),
        ('status', 'Stato'),
        ('reset', 'Reset'),
        ('models', 'Modelli AI'),
        ('qwen', 'Qwen 2.5'),
        ('deepseek', 'DeepSeek V3'),
        ('coder', 'Qwen Coder'),
        ('r1', 'DeepSeek R1'),
        ('video', 'Genera video'),
        ('image', 'Genera immagine'),
        ('music', 'Genera musica'),
    ])

async def run_bot():
    application = Application.builder().token(BOT_TOKEN).build()

    # Main commands
    application.add_handler(CommandHandler("start", handle_start))
    application.add_handler(CommandHandler("help", handle_help))
    application.add_handler(CommandHandler("status", handle_status))
    application.add_handler(CommandHandler("reset", handle_reset))
    application.add_handler(CommandHandler("models", handle_models))

    # Model selection
    application.add_handler(CommandHandler("qwen", lambda u,c: handle_model_select(u,c,'qwen')))
    application.add_handler(CommandHandler("deepseek", lambda u,c: handle_model_select(u,c,'deepseek')))
    application.add_handler(CommandHandler("coder", lambda u,c: handle_model_select(u,c,'qwen-coder')))
    application.add_handler(CommandHandler("r1", lambda u,c: handle_model_select(u,c,'deepseek-r1')))

    # Media commands
    application.add_handler(CommandHandler("video", handle_video))
    application.add_handler(CommandHandler("image", handle_image))
    application.add_handler(CommandHandler("music", handle_music))

    # Message handler
    application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))

    application.post_init = post_init

    print("🤖 Lara Bot avviato!")
    print(f"   Token: {BOT_TOKEN[:20]}...")
    print(f"   Lara URL: {LARA_URL}")
    print(f"   Modelli: {list(AI_MODELS.keys())}")

    await application.initialize()
    await application.start()
    await application.updater.start_polling()

    while True:
        await asyncio.sleep(1)

if __name__ == '__main__':
    asyncio.run(run_bot())
MAINEOF

# Create systemd service
cat > /etc/systemd/system/lara-bot.service << 'SVCEOF'
[Unit]
Description=Lara Telegram Bot
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/lara-bot
Environment="PATH=/opt/lara-bot/venv/bin"
ExecStart=/opt/lara-bot/venv/bin/python main.py
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
SVCEOF

# Enable and start
systemctl daemon-reload
systemctl enable lara-bot
systemctl start lara-bot

# Install cluster agent
echo ""
echo "📡 Installing cluster agent..."
mkdir -p /opt/lara-agent
cat > /opt/lara-agent/agent.py << 'AGENTEOF'
#!/usr/bin/env python3
"""Lara Cluster Agent - Remote management"""
import os, subprocess, json
from http.server import HTTPServer, BaseHTTPRequestHandler

class Handler(BaseHTTPRequestHandler):
    def do_POST(self):
        length = int(self.headers.get('Content-Length', 0))
        data = json.loads(self.rfile.read(length)) if length else {}
        cmd = data.get('cmd', 'status')
        result = {'ok': True, 'cmd': cmd, 'server': 'bot-telegram'}

        if cmd == 'start': subprocess.run(['systemctl', 'start', 'lara-bot'])
        elif cmd == 'stop': subprocess.run(['systemctl', 'stop', 'lara-bot'])
        elif cmd == 'restart': subprocess.run(['systemctl', 'restart', 'lara-bot'])
        elif cmd == 'status':
            r = subprocess.run(['systemctl', 'is-active', 'lara-bot'], capture_output=True, text=True)
            result['status'] = r.stdout.strip()
        elif cmd == 'logs':
            r = subprocess.run(['journalctl', '-u', 'lara-bot', '-n', '50'], capture_output=True, text=True)
            result['logs'] = r.stdout
        elif cmd == 'deploy':
            subprocess.run(['bash', '-c', 'cd /opt/lara-bot && git pull && systemctl restart lara-bot'])

        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(result).encode())

    def log_message(self, format, *args): pass

if __name__ == '__main__':
    print("📡 Cluster Agent on port 9999")
    HTTPServer(('0.0.0.0', 9999), Handler).serve_forever()
AGENTEOF

cat > /etc/systemd/system/lara-cluster-agent.service << 'EOF'
[Unit]
Description=Lara Cluster Agent
After=network.target
[Service]
Restart=always
ExecStart=/usr/bin/python3 /opt/lara-agent/agent.py
[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable lara-cluster-agent
systemctl start lara-cluster-agent

echo ""
echo "=============================="
echo "✅ INSTALLATION COMPLETE!"
echo "=============================="
echo ""
echo "Bot status:"
systemctl status lara-bot --no-pager | head -6
echo ""
echo "Agent status:"
systemctl status lara-cluster-agent --no-pager | head -6
echo ""
echo "📄 Logs: journalctl -u lara-bot -f"
echo "🔧 Test: curl http://localhost:9999 -d '{\"cmd\":\"status\"}'"
echo "🌐 Dashboard: https://aethersy.com/bot-manager"
echo ""
