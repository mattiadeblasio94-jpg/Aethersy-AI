#!/bin/bash
# ================================================================
# LARA CINEMA STUDIO - GPU Server Install
# Server: 47.91.76.37 (GPU Instance)
# Usage: curl -sL https://raw.githubusercontent.com/mattiadeblasio94-jpg/Aethersy-AI/master/cluster-agents/gpu-cinema/install.sh | bash
# ================================================================

set -e
echo "🎬 Lara Cinema Studio - GPU Server Installation"
echo "================================================"

# Install dependencies
apt-get update -qq
apt-get install -y -qq python3 python3-pip nvidia-cuda-toolkit ffmpeg

# Create directory
mkdir -p /opt/cinema-studio
cd /opt/cinema-studio

# Install Python packages
pip3 install -q flask requests replicate Pillow numpy opencv-python

# Create main cinema server
cat > server.py << 'SERVEREOF'
#!/usr/bin/env python3
"""
LARA CINEMA STUDIO - GPU Video/Image/Music Generation
Server: 47.91.76.37
Models: Replicate FLUX, Wan 2.1, LTX Video, MusicGen
"""
from flask import Flask, request, jsonify
import requests, os, time
import threading

app = Flask(__name__)

REPLICATE_TOKEN = os.getenv('REPLICATE_API_TOKEN', '')

# Model versions
MODELS = {
    'video_wan': 'wan-ai/wan-2.1',
    'video_ltx': 'ltx-video/ltx-video',
    'image_flux': 'black-forest-labs/flux-1-pro',
    'music_audiocraft': 'meta/audiocraft-large'
}

jobs = {}

@app.route('/generate/video', methods=['POST'])
def generate_video():
    data = request.json
    prompt = data.get('prompt', '')
    model = data.get('model', 'wan')

    if not REPLICATE_TOKEN:
        return jsonify({'error': 'Replicate token not configured'})

    # Submit to Replicate
    resp = requests.post('https://api.replicate.com/v1/predictions',
        headers={'Authorization': f'Token {REPLICATE_TOKEN}'},
        json={
            'version': MODELS.get(f'video_{model}', MODELS['video_wan']),
            'input': {'prompt': prompt, 'duration': data.get('duration', 5)}
        })

    if resp.ok:
        job = resp.json()
        jobs[job['id']] = {'type': 'video', 'status': 'processing'}
        return jsonify({'job_id': job['id'], 'status': 'processing'})
    return jsonify({'error': resp.text}), 500

@app.route('/generate/image', methods=['POST'])
def generate_image():
    data = request.json
    prompt = data.get('prompt', '')

    resp = requests.post('https://api.replicate.com/v1/predictions',
        headers={'Authorization': f'Token {REPLICATE_TOKEN}'},
        json={
            'version': MODELS['image_flux'],
            'input': {'prompt': prompt, 'aspect_ratio': data.get('aspect', '16:9')}
        })

    if resp.ok:
        job = resp.json()
        jobs[job['id']] = {'type': 'image', 'status': 'processing'}
        return jsonify({'job_id': job['id'], 'status': 'processing'})
    return jsonify({'error': resp.text}), 500

@app.route('/generate/music', methods=['POST'])
def generate_music():
    data = request.json
    prompt = data.get('prompt', '')

    resp = requests.post('https://api.replicate.com/v1/predictions',
        headers={'Authorization': f'Token {REPLICATE_TOKEN}'},
        json={
            'version': MODELS['music_audiocraft'],
            'input': {'prompt': prompt, 'duration': data.get('duration', 30)}
        })

    if resp.ok:
        job = resp.json()
        jobs[job['id']] = {'type': 'music', 'status': 'processing'}
        return jsonify({'job_id': job['id'], 'status': 'processing'})
    return jsonify({'error': resp.text}), 500

@app.route('/status/<job_id>')
def job_status(job_id):
    if job_id not in jobs:
        return jsonify({'error': 'Job not found'}), 404

    resp = requests.get(f'https://api.replicate.com/v1/predictions/{job_id}',
        headers={'Authorization': f'Token {REPLICATE_TOKEN}'})

    if resp.ok:
        data = resp.json()
        jobs[job_id]['status'] = data.get('status', 'unknown')
        jobs[job_id]['output'] = data.get('output')
        return jsonify(jobs[job_id])
    return jsonify({'error': resp.text}), 500

@app.route('/models')
def list_models():
    return jsonify({
        'video': ['wan', 'ltx'],
        'image': ['flux-pro', 'sdxl'],
        'music': ['audiocraft', 'musicgen']
    })

@app.route('/health')
def health():
    return jsonify({'status': 'ok', 'gpu': 'active'})

if __name__ == '__main__':
    print("🎬 Cinema Studio Server starting...")
    print("   Port: 5000")
    print("   GPU: NVIDIA CUDA")
    app.run(host='0.0.0.0', port=5000)
SERVEREOF

# Create systemd service
cat > /etc/systemd/system/cinema-studio.service << 'EOF'
[Unit]
Description=Lara Cinema Studio GPU Server
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/cinema-studio
ExecStart=/usr/bin/python3 server.py
Restart=always

[Install]
WantedBy=multi-user.target
EOF

# Install cluster agent
mkdir -p /opt/lara-agent
cat > /opt/lara-agent/agent.py << 'AGENTEOF'
#!/usr/bin/env python3
import os, subprocess, json
from http.server import HTTPServer, BaseHTTPRequestHandler

class Handler(BaseHTTPRequestHandler):
    def do_POST(self):
        length = int(self.headers.get('Content-Length', 0))
        data = json.loads(self.rfile.read(length)) if length else {}
        cmd = data.get('cmd', 'status')
        result = {'ok': True, 'cmd': cmd, 'server': 'gpu-cinema'}

        if cmd == 'start': subprocess.run(['systemctl', 'start', 'cinema-studio'])
        elif cmd == 'stop': subprocess.run(['systemctl', 'stop', 'cinema-studio'])
        elif cmd == 'restart': subprocess.run(['systemctl', 'restart', 'cinema-studio'])
        elif cmd == 'status':
            r = subprocess.run(['systemctl', 'is-active', 'cinema-studio'], capture_output=True, text=True)
            result['status'] = r.stdout.strip()
        elif cmd == 'gpu':
            r = subprocess.run(['nvidia-smi', '--query-gpu=memory.used,memory.total', '--format=csv,noheader'], capture_output=True, text=True)
            result['gpu_memory'] = r.stdout.strip()

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

# Enable services
systemctl daemon-reload
systemctl enable cinema-studio lara-cluster-agent
systemctl start cinema-studio
systemctl start lara-cluster-agent

echo ""
echo "=============================="
echo "✅ CINEMA STUDIO READY!"
echo "=============================="
echo ""
systemctl status cinema-studio --no-pager | head -6
echo ""
echo "🎬 API: http://47.91.76.37:5000"
echo "📊 GPU: nvidia-smi"
echo "🔧 Agent: port 9999"
echo ""
