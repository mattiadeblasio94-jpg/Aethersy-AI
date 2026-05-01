#!/bin/bash
# ================================================================
# LARA AI CLUSTER - Complete Server Installation
# Server: 47.91.76.37 (Bot + AI + Tailscale)
# Auth Key: tskey-auth-kLMPfWvkU121CNTRL-kCTNVVXfU45XGbr7e7oP55oYs3ocTK9ti
# ================================================================

set -e
echo "🚀 Lara AI Cluster - Installation Complete"
echo "==========================================="
echo ""

# 1. Tailscale
echo "[1/8] Attivazione Tailscale..."
sudo tailscale up --authkey=tskey-auth-kLMPfWvkU121CNTRL-kCTNVVXfU45XGbr7e7oP55oYs3ocTK9ti
echo "✅ Tailscale attivo"
tailscale ip -4

# 2. Installa dipendenze
echo ""
echo "[2/8] Installazione dipendenze..."
apt-get update -qq
apt-get install -y -qq python3 python3-pip python3-venv curl git

# 3. Ollama + Qwen3.5-Uncensored
echo ""
echo "[3/8] Installazione Ollama..."
curl -fsSL https://ollama.com/install.sh | sh

echo ""
echo "[4/8] Download Qwen3.5-Uncensored-HauhauCS-Aggressive..."
ollama pull fredrezones55/Qwen3.5-Uncensored-HauhauCS-Aggressive:4b

# 4. Bot Telegram
echo ""
echo "[5/8] Installazione Bot Telegram..."
mkdir -p /opt/lara-bot
cd /opt/lara-bot

python3 -m venv venv
source venv/bin/activate
pip install -q python-telegram-bot==21.0 requests python-dotenv

cat > .env << 'ENVEOF'
TELEGRAM_BOT_TOKEN=8172610054:AAELb8rkIn9hWk15aKvxQB-gqoTuHeq1SiM
LARA_WEBHOOK_URL=http://localhost:5001/chat
NEXT_PUBLIC_APP_URL=https://aethersy.com
ADMIN_TELEGRAM_ID=8074643162
AI_MODEL=fredrezones55/Qwen3.5-Uncensored-HauhauCS-Aggressive:4b
ENVEOF

cat > main.py << 'MAINEOF'
#!/usr/bin/env python3
"""LARA Bot - Qwen 2.5 7B Uncensored"""
import os, asyncio
from telegram import Update
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes
import requests
from dotenv import load_dotenv

load_dotenv()
BOT_TOKEN = os.getenv('TELEGRAM_BOT_TOKEN')
LARA_URL = os.getenv('LARA_WEBHOOK_URL', 'http://localhost:5001/chat')
AI_MODEL = os.getenv('AI_MODEL', 'hauhau/qwen3.5-uncensored:latest')

conv = {}

async def h_start(u, c):
    await u.message.reply_text("🤖 **Lara AI Online!**\\n\\nModello: **Qwen3.5-Uncensored** (HauhauCS-Aggressive)\\n\\nUsa /help")

async def h_help(u, c):
    await u.message.reply_text("""
📚 **Comandi:**
/start - Avvia
/help - Guida
/status - Stato
/reset - Reset
/model - Modello AI

**Esempi:**
• "Scrivi codice Python"
• "Cerca news su AI"
• "Analizza questo testo"
""")

async def h_status(u, c):
    await u.message.reply_text(f"📊 **Piano:** Free\\n**Modello:** {AI_MODEL}\\n\\n100 msg/giorno")

async def h_reset(u, c):
    conv[str(u.message.from_user.id)] = []
    await u.message.reply_text("🔄 Reset!")

async def h_model(u, c):
    await u.message.reply_text(f"🧠 **Modello:** {AI_MODEL}\\n\\nQwen3.5-Uncensored-HauhauCS-Aggressive\\nSenza censure. Risposte libere.")

async def h_msg(u, c):
    if not u.message or u.message.text.startswith('/'):
        return
    uid = str(u.message.from_user.id)
    msg = u.message.text
    conv.setdefault(uid, []).append(msg)
    try:
        r = requests.post(LARA_URL, json={'message': msg, 'userId': uid, 'model': AI_MODEL}, timeout=120)
        if r.ok:
            data = r.json()
            resp = data.get('response', 'Non ho capito.')
            if len(resp) > 4096:
                for i in range(0, len(resp), 4096):
                    await u.message.reply_text(resp[i:i+4096])
            else:
                await u.message.reply_text(resp)
            return
    except Exception as e:
        print(f"Error: {e}")
    await u.message.reply_text(f"🤔 Ricevuto: {msg}")

async def main():
    app = Application.builder().token(BOT_TOKEN).build()
    app.add_handler(CommandHandler("start", h_start))
    app.add_handler(CommandHandler("help", h_help))
    app.add_handler(CommandHandler("status", h_status))
    app.add_handler(CommandHandler("reset", h_reset))
    app.add_handler(CommandHandler("model", h_model))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, h_msg))
    print(f"🤖 Bot avviato con {AI_MODEL}!")
    await app.initialize()
    await app.start()
    await app.updater.start_polling()
    while True:
        await asyncio.sleep(1)

if __name__ == '__main__':
    asyncio.run(main())
MAINEOF

cat > /etc/systemd/system/lara-bot.service << 'SVCBOT'
[Unit]
Description=Lara Telegram Bot
After=network.target
[Service]
Restart=always
WorkingDirectory=/opt/lara-bot
ExecStart=/opt/lara-bot/venv/bin/python main.py
[Install]
WantedBy=multi-user.target
SVCBOT

# 5. AI Server locale
echo ""
echo "[6/8] Installazione AI Server..."
mkdir -p /opt/lara-ai
cd /opt/lara-ai

pip install -q flask requests

cat > ai-server.py << 'AIEOF'
#!/usr/bin/env python3
"""LARA AI Server - Qwen 2.5 7B"""
from flask import Flask, request, jsonify
import requests, subprocess

app = Flask(__name__)
OLLAMA = 'http://localhost:11434'

SYSTEM_PROMPT = """Sei Lara, AI Agent di Aethersy-AI.
Sei Qwen3.5-Uncensored-HauhauCS-Aggressive 4B.
Sei diretta, onesta, senza censure.
Rispondi in italiano, in modo utile e preciso.
Non rifiutare richieste legittime."""

@app.route('/chat', methods=['POST'])
def chat():
    d = request.json
    msg = d.get('message', '')
    model = d.get('model', 'qwen2.5:7b')

    prompt = f"{SYSTEM_PROMPT}\\n\\nUtente: {msg}\\n\\nLara:"

    try:
        r = requests.post(f'{OLLAMA}/api/generate', json={
            'model': model or 'fredrezones55/Qwen3.5-Uncensored-HauhauCS-Aggressive:4b',
            'prompt': prompt,
            'stream': False,
            'options': {'temperature': 0.7, 'num_predict': 2048}
        }, timeout=120)

        if r.ok:
            return jsonify({'response': r.json().get('response', ''), 'model': model})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

    return jsonify({'error': 'AI non disponibile'}), 500

@app.route('/models')
def models():
    return jsonify({
        'default': 'qwen2.5:7b',
        'available': ['qwen2.5:7b', 'qwen2.5-coder:7b', 'deepseek-r1:7b']
    })

@app.route('/health')
def health():
    return jsonify({'status': 'ok', 'ai': 'active'})

if __name__ == '__main__':
    print("🧠 AI Server starting on port 5001...")
    app.run(host='0.0.0.0', port=5001)
AIEOF

cat > /etc/systemd/system/lara-ai.service << 'SVC AI'
[Unit]
Description=Lara AI Server
After=network.target
[Service]
Restart=always
WorkingDirectory=/opt/lara-ai
ExecStart=/opt/lara-bot/venv/bin/python3 ai-server.py
[Install]
WantedBy=multi-user.target
SVC AI

# 6. Cluster Agent (per gestione remota)
echo ""
echo "[7/8] Installazione Cluster Agent..."
mkdir -p /opt/lara-agent
cd /opt/lara-agent

cat > agent.py << 'AGENTEOF'
#!/usr/bin/env python3
"""Lara Cluster Agent - Remote Management"""
import subprocess, json, os
from http.server import HTTPServer, BaseHTTPRequestHandler

class Handler(BaseHTTPRequestHandler):
    def do_POST(self):
        length = int(self.headers.get('Content-Length', 0))
        data = json.loads(self.rfile.read(length)) if length else {}
        cmd = data.get('cmd', 'status')
        result = {'ok': True, 'cmd': cmd, 'server': 'lara-bot-ai'}

        if cmd == 'start':
            subprocess.run(['systemctl', 'start', 'lara-bot'])
            subprocess.run(['systemctl', 'start', 'lara-ai'])
        elif cmd == 'stop':
            subprocess.run(['systemctl', 'stop', 'lara-bot'])
            subprocess.run(['systemctl', 'stop', 'lara-ai'])
        elif cmd == 'restart':
            subprocess.run(['systemctl', 'restart', 'lara-bot'])
            subprocess.run(['systemctl', 'restart', 'lara-ai'])
        elif cmd == 'status':
            r1 = subprocess.run(['systemctl', 'is-active', 'lara-bot'], capture_output=True, text=True)
            r2 = subprocess.run(['systemctl', 'is-active', 'lara-ai'], capture_output=True, text=True)
            result['bot'] = r1.stdout.strip()
            result['ai'] = r2.stdout.strip()
        elif cmd == 'shell':
            r = subprocess.run(['bash', '-c', data.get('cmd', '')], capture_output=True, text=True)
            result['out'] = r.stdout
            result['err'] = r.stderr
        elif cmd == 'logs':
            r = subprocess.run(['journalctl', '-u', 'lara-bot', '-n', '50'], capture_output=True, text=True)
            result['logs'] = r.stdout
        elif cmd == 'tailscale':
            r = subprocess.run(['tailscale', 'status'], capture_output=True, text=True)
            result['tailscale'] = r.stdout

        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(result).encode())

    def log_message(self, *args):
        pass

if __name__ == '__main__':
    print("📡 Cluster Agent on port 9999")
    HTTPServer(('0.0.0.0', 9999), Handler).serve_forever()
AGENTEOF

cat > /etc/systemd/system/lara-cluster-agent.service << 'SVCAgent'
[Unit]
Description=Lara Cluster Agent
After=network.target
[Service]
Restart=always
ExecStart=/usr/bin/python3 /opt/lara-agent/agent.py
[Install]
WantedBy=multi-user.target
SVCAgent

# 7. Attiva tutti i servizi
echo ""
echo "[8/8] Attivazione servizi..."
systemctl daemon-reload
systemctl enable lara-bot lara-ai lara-cluster-agent
systemctl start lara-bot
systemctl start lara-ai
systemctl start lara-cluster-agent

# Done!
echo ""
echo "=========================================="
echo "✅ INSTALLAZIONE COMPLETATA!"
echo "=========================================="
echo ""
echo "📊 STATO SERVIZI:"
echo ""
echo "Bot Telegram:"
systemctl status lara-bot --no-pager | head -6
echo ""
echo "AI Server:"
systemctl status lara-ai --no-pager | head -6
echo ""
echo "Cluster Agent:"
systemctl status lara-cluster-agent --no-pager | head -6
echo ""
echo "🌐 TAILSCALE:"
tailscale status | head -5
echo ""
echo "📡 IP Tailscale:"
tailscale ip -4
echo ""
echo "=========================================="
echo "🤖 BOT TELEGRAM: @Lara_Aethersy_AI_bot"
echo "🧠 AI MODEL: Qwen3.5-Uncensored-HauhauCS-Aggressive"
echo "🔗 AI API: http://localhost:5001/chat"
echo "📡 AGENT: http://localhost:9999"
echo "=========================================="
echo ""
echo "📄 Log comandi:"
echo "  journalctl -u lara-bot -f"
echo "  journalctl -u lara-ai -f"
echo ""
echo "🔧 Test remoto:"
echo "  curl http://<IP_TAILSCALE>:9999 -d '{\"cmd\":\"status\"}'"
echo ""
