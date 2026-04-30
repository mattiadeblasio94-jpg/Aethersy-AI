#!/bin/bash
# ================================================================
# LARA AI MODELS - Qwen & DeepSeek Integration
# Install AI models for all servers
# Usage: curl -sL https://raw.githubusercontent.com/mattiadeblasio94-jpg/Aethersy-AI/master/cluster-agents/ai-models/install.sh | bash
# ================================================================

set -e
echo "🧠 Lara AI Models - Qwen & DeepSeek Installation"
echo "================================================="

# Install Ollama for local AI models
curl -fsSL https://ollama.com/install.sh | sh

# Pull models
echo "Downloading Qwen 2.5 72B..."
ollama pull qwen2.5:72b

echo "Downloading Qwen 2.5 Coder..."
ollama pull qwen2.5-coder:7b

echo "Downloading DeepSeek V3..."
ollama pull deepseek-v3

echo "Downloading DeepSeek R1..."
ollama pull deepseek-r1:7b

# Create AI API server
mkdir -p /opt/lara-ai
cd /opt/lara-ai

cat > ai-server.py << 'AIEOF'
#!/usr/bin/env python3
"""
LARA AI Server - Qwen & DeepSeek Models
Supports: Qwen 2.5, DeepSeek V3, DeepSeek R1, Qwen Coder
"""
from flask import Flask, request, jsonify
import requests, json

app = Flask(__name__)

OLLAMA_URL = 'http://localhost:11434'

MODELS = {
    'qwen': 'qwen2.5:72b',
    'qwen-coder': 'qwen2.5-coder:7b',
    'deepseek': 'deepseek-v3',
    'deepseek-r1': 'deepseek-r1:7b'
}

SYSTEM_PROMPTS = {
    'qwen': 'Sei Lara, AI Agent di Aethersy-AI. Rispondi in modo utile e professionale.',
    'qwen-coder': 'Sei un esperto programmatore. Scrivi codice pulito e ben commentato.',
    'deepseek': 'Sei un assistente AI specializzato in matematica e logica.',
    'deepseek-r1': 'Sei un modello di ragionamento profondo. Analizza passo-passo.'
}

@app.route('/chat', methods=['POST'])
def chat():
    data = request.json
    model = data.get('model', 'qwen')
    message = data.get('message', '')
    history = data.get('history', [])

    messages = [
        {'role': 'system', 'content': SYSTEM_PROMPTS.get(model, SYSTEM_PROMPTS['qwen'])}
    ] + history + [{'role': 'user', 'content': message}]

    resp = requests.post(f'{OLLAMA_URL}/api/chat',
        json={'model': MODELS.get(model, MODELS['qwen']), 'messages': messages, 'stream': False},
        timeout=120)

    if resp.ok:
        return jsonify({'response': resp.json()['message']['content'], 'model': model})
    return jsonify({'error': resp.text}), 500

@app.route('/models')
def list_models():
    return jsonify({
        'available': list(MODELS.keys()),
        'descriptions': SYSTEM_PROMPTS
    })

@app.route('/health')
def health():
    return jsonify({'status': 'ok'})

if __name__ == '__main__':
    print("🧠 Lara AI Server starting...")
    print(f"   Models: {list(MODELS.keys())}")
    print("   Port: 5001")
    app.run(host='0.0.0.0', port=5001)
AIEOF

# Install Flask
pip3 install -q flask requests

# Create service
cat > /etc/systemd/system/lara-ai.service << 'EOF'
[Unit]
Description=Lara AI Server
After=network.target
[Service]
Restart=always
WorkingDirectory=/opt/lara-ai
ExecStart=/usr/bin/python3 ai-server.py
[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable lara-ai
systemctl start lara-ai

echo ""
echo "=============================="
echo "✅ AI MODELS READY!"
echo "=============================="
echo ""
echo "🧠 Models installed:"
ollama list
echo ""
echo "API: http://localhost:5001"
echo "Chat endpoint: /chat"
echo "Models endpoint: /models"
echo ""
