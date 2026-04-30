#!/bin/bash
# ================================================================
# LARA MONITOR SERVICE - Install
# Server: 47.87.141.154 (Monitoring & Alerts)
# Usage: curl -sL https://raw.githubusercontent.com/mattiadeblasio94-jpg/Aethersy-AI/master/cluster-agents/monitor/install.sh | bash
# ================================================================

set -e
echo "📊 Lara Monitor Service - Installation"
echo "======================================="

apt-get update -qq
apt-get install -y -qq python3 python3-pip htop iotop

mkdir -p /opt/lara-monitor
cd /opt/lara-monitor

# Create monitor script
cat > monitor.py << 'MONITOREOF'
#!/usr/bin/env python3
"""Lara Cluster Monitor - Health Checks & Alerts"""
import requests, time, json
from datetime import datetime

SERVERS = [
    {'name': 'bot', 'ip': '47.87.134.105', 'port': 9999},
    {'name': 'gpu', 'ip': '47.91.76.37', 'port': 9999},
    {'name': 'db', 'ip': '47.87.141.18', 'port': 9999},
    {'name': 'worker', 'ip': '47.87.139.66', 'port': 9999},
]

TELEGRAM_ALERTS = os.getenv('TELEGRAM_ALERTS_CHAT', '')

def check_server(s):
    try:
        r = requests.post(f"http://{s['ip']}:{s['port']}", json={'cmd': 'status'}, timeout=5)
        return r.json().get('status', 'unknown')
    except:
        return 'offline'

def send_alert(message):
    if TELEGRAM_ALERTS:
        requests.post(f'https://api.telegram.org/bot{TELEGRAM_ALERTS}/sendMessage',
                     json={'chat_id': TELEGRAM_ALERTS, 'text': message})

print("📊 Monitor starting...")

while True:
    status = []
    for s in SERVERS:
        st = check_server(s)
        status.append({'server': s['name'], 'status': st})
        if st != 'active':
            send_alert(f"⚠️ {s['name']} is {st}")

    with open('/var/log/lara-monitor.json', 'w') as f:
        json.dump({'time': datetime.now().isoformat(), 'servers': status}, f)

    time.sleep(60)
MONITOREOF

# Create service
cat > /etc/systemd/system/lara-monitor.service << 'EOF'
[Unit]
Description=Lara Cluster Monitor
After=network.target
[Service]
Restart=always
WorkingDirectory=/opt/lara-monitor
ExecStart=/usr/bin/python3 monitor.py
[Install]
WantedBy=multi-user.target
EOF

# Install cluster agent
mkdir -p /opt/lara-agent
cat > /opt/lara-agent/agent.py << 'AGENTEOF'
#!/usr/bin/env python3
import subprocess, json
from http.server import HTTPServer, BaseHTTPRequestHandler

class Handler(BaseHTTPRequestHandler):
    def do_POST(self):
        length = int(self.headers.get('Content-Length', 0))
        data = json.loads(self.rfile.read(length)) if length else {}
        cmd = data.get('cmd', 'status')
        result = {'ok': True, 'cmd': cmd, 'server': 'monitor'}

        if cmd == 'status':
            r = subprocess.run(['systemctl', 'is-active', 'lara-monitor'], capture_output=True, text=True)
            result['status'] = r.stdout.strip()
        elif cmd == 'health':
            try:
                with open('/var/log/lara-monitor.json') as f:
                    result['health'] = json.load(f)
            except:
                result['health'] = 'no data'

        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(result).encode())

    def log_message(self, *a): pass

if __name__ == '__main__':
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
systemctl enable lara-monitor lara-cluster-agent
systemctl start lara-monitor
systemctl start lara-cluster-agent

echo ""
echo "=============================="
echo "✅ MONITOR READY!"
echo "=============================="
systemctl status lara-monitor --no-pager | head -5
echo ""
