#!/bin/bash
# Installa agent di gestione bot
# Esegui su OGNI server Alibaba

echo "🔧 Installazione agent di gestione..."

# 1. Crea directory
mkdir -p /opt/lara-agent
cd /opt/lara-agent

# 2. Crea script agent
cat > agent.py << 'AGENTEOF'
#!/usr/bin/env python3
"""Lara Bot Manager Agent - Gestisce bot Telegram"""
import os, subprocess, json
from http.server import HTTPServer, BaseHTTPRequestHandler

class Handler(BaseHTTPRequestHandler):
    def do_POST(self):
        length = int(self.headers.get('Content-Length', 0))
        data = json.loads(self.rfile.read(length)) if length else {}
        cmd = data.get('cmd', 'status')

        if cmd == 'start':
            subprocess.run(['systemctl', 'start', 'telegram-bot'])
        elif cmd == 'stop':
            subprocess.run(['systemctl', 'stop', 'telegram-bot'])
        elif cmd == 'restart':
            subprocess.run(['systemctl', 'restart', 'telegram-bot'])
        elif cmd == 'status':
            r = subprocess.run(['systemctl', 'is-active', 'telegram-bot'], capture_output=True, text=True)
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'status': r.stdout.strip()}).encode())
            return
        elif cmd == 'deploy':
            subprocess.run(['bash', '-c', 'cd /root/aiforge-pro/bot-telegram && curl -o main.py https://raw.githubusercontent.com/mattiadeblasio94-jpg/Aethersy-AI/master/bot-telegram/main.py && systemctl restart telegram-bot'])

        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps({'ok': True}).encode())

    def log_message(self, format, *args): pass

if __name__ == '__main__':
    print("🤖 Agent avviato su porta 9999")
    HTTPServer(('0.0.0.0', 9999), Handler).serve_forever()
AGENTEOF

# 3. Crea servizio systemd
cat > /etc/systemd/system/lara-agent.service << 'EOF'
[Unit]
Description=Lara Bot Manager Agent
After=network.target
[Service]
Restart=always
ExecStart=/usr/bin/python3 /opt/lara-agent/agent.py
[Install]
WantedBy=multi-user.target
EOF

# 4. Attiva agent
systemctl daemon-reload
systemctl enable lara-agent
systemctl start lara-agent

echo "✅ Agent installato!"
echo "📡 Porta: 9999"
echo "🔗 Comandi: curl -X POST http://SERVER_IP:9999 -d '{\"cmd\":\"start\"}'"
