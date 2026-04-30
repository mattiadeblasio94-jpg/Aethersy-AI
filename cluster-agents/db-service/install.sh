#!/bin/bash
# ================================================================
# LARA DATABASE SERVICE - Install
# Server: 47.87.141.18 (Database & Cache)
# Usage: curl -sL https://raw.githubusercontent.com/mattiadeblasio94-jpg/Aethersy-AI/master/cluster-agents/db-service/install.sh | bash
# ================================================================

set -e
echo "🗄️ Lara Database Service - Installation"
echo "========================================"

# Install Redis and PostgreSQL
apt-get update -qq
apt-get install -y -qq redis-server postgresql postgresql-contrib python3-pip

# Configure Redis
sed -i 's/bind 127.0.0.1/bind 0.0.0.0/' /etc/redis/redis.conf
systemctl restart redis-server

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
        result = {'ok': True, 'cmd': cmd, 'server': 'db-service'}

        if cmd == 'status':
            result['redis'] = subprocess.run(['redis-cli', 'ping'], capture_output=True, text=True).stdout.strip()
            result['postgres'] = subprocess.run(['pg_isready'], capture_output=True, text=True).stdout.strip()
        elif cmd == 'restart':
            subprocess.run(['systemctl', 'restart', 'redis-server'])
            subprocess.run(['systemctl', 'restart', 'postgresql'])

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
systemctl enable lara-cluster-agent
systemctl start lara-cluster-agent

echo ""
echo "=============================="
echo "✅ DB SERVICE READY!"
echo "=============================="
echo "Redis: localhost:6379"
echo "PostgreSQL: localhost:5432"
echo "Agent: port 9999"
echo ""
