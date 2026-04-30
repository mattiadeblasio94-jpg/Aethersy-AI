#!/bin/bash
# ================================================================
# LARA WORKER SERVICE - Install
# Server: 47.87.139.66 (Background Jobs)
# Usage: curl -sL https://raw.githubusercontent.com/mattiadeblasio94-jpg/Aethersy-AI/master/cluster-agents/worker/install.sh | bash
# ================================================================

set -e
echo "⚙️ Lara Worker Service - Installation"
echo "======================================"

apt-get update -qq
apt-get install -y -qq python3 python3-pip

mkdir -p /opt/lara-worker
cd /opt/lara-worker

# Create worker script
cat > worker.py << 'WORKEREOF'
#!/usr/bin/env python3
"""Lara Background Worker - Jobs Queue Processor"""
import time, requests, os

QUEUE_URL = os.getenv('JOB_QUEUE_URL', 'http://47.87.134.105:3000/api/jobs')

print("🔄 Worker starting...")

while True:
    try:
        # Fetch pending jobs
        resp = requests.get(f'{QUEUE_URL}/pending', timeout=10)
        if resp.ok:
            jobs = resp.json()
            for job in jobs:
                print(f"Processing job: {job['id']}")
                # Process job here
                requests.post(f'{QUEUE_URL}/{job["id"]}/complete')
    except Exception as e:
        print(f"Worker error: {e}")
    time.sleep(5)
WORKEREOF

# Create service
cat > /etc/systemd/system/lara-worker.service << 'EOF'
[Unit]
Description=Lara Background Worker
After=network.target
[Service]
Restart=always
WorkingDirectory=/opt/lara-worker
ExecStart=/usr/bin/python3 worker.py
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
        result = {'ok': True, 'cmd': cmd, 'server': 'worker'}

        if cmd == 'start': subprocess.run(['systemctl', 'start', 'lara-worker'])
        elif cmd == 'stop': subprocess.run(['systemctl', 'stop', 'lara-worker'])
        elif cmd == 'restart': subprocess.run(['systemctl', 'restart', 'lara-worker'])
        elif cmd == 'status':
            r = subprocess.run(['systemctl', 'is-active', 'lara-worker'], capture_output=True, text=True)
            result['status'] = r.stdout.strip()

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
systemctl enable lara-worker lara-cluster-agent
systemctl start lara-worker
systemctl start lara-cluster-agent

echo ""
echo "=============================="
echo "✅ WORKER READY!"
echo "=============================="
systemctl status lara-worker --no-pager | head -5
echo ""
