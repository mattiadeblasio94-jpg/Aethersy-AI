#!/bin/bash
# Lara AI - Aggiornamento modello a 4B
# Server: 47.87.134.105 (Bot Telegram)
# Esegui: ssh root@47.87.134.105 'bash -s' < update-model.sh

echo "🔄 Aggiornamento modello AI..."

# 1. Scarica nuovo modello 4B (entra in RAM)
echo "📥 Download Qwen3.5-Uncensored-HauhauCS-Aggressive:4b..."
ollama pull fredrezones55/Qwen3.5-Uncensored-HauhauCS-Aggressive:4b

# 2. Rimuovi modello 9B (troppo grande)
echo "🗑️ Rimozione modello 9B..."
ollama rm jaahas/qwen3.5-uncensored:9b 2>/dev/null || true

# 3. Aggiorna AI server
echo "✏️ Aggiornamento AI server..."
cat > /opt/lara-ai/ai-server.py << 'EOF'
#!/usr/bin/env python3
from flask import Flask, request, jsonify
import requests

app = Flask(__name__)
SYSTEM = "Sei Lara, AI di Aethersy-AI. Qwen3.5-Uncensored-HauhauCS-Aggressive 4B. Rispondi in italiano, diretta e senza censure."

@app.route('/chat', methods=['POST'])
def chat():
    d = request.json
    try:
        r = requests.post('http://localhost:11434/api/generate', json={
            'model': 'fredrezones55/Qwen3.5-Uncensored-HauhauCS-Aggressive:4b',
            'prompt': SYSTEM + "\n\nUtente: " + d.get('message', '') + "\nLara:",
            'stream': False,
            'options': {'temperature': 0.7, 'num_predict': 1024}
        }, timeout=120)
        if r.ok:
            return jsonify({'response': r.json().get('response', ''), 'model': '4b-uncensored'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    return jsonify({'error': 'AI non disponibile'}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001)
EOF

# 4. Aggiorna .env bot
echo "✏️ Aggiornamento .env..."
cat > /opt/lara-bot/.env << 'ENVEOF'
TELEGRAM_BOT_TOKEN=8172610054:AAELb8rkIn9hWk15aKvxQB-gqoTuHeq1SiM
LARA_WEBHOOK_URL=http://localhost:5001/chat
NEXT_PUBLIC_APP_URL=https://aethersy.com
ADMIN_TELEGRAM_ID=8074643162
AI_MODEL=fredrezones55/Qwen3.5-Uncensored-HauhauCS-Aggressive:4b
ENVEOF

# 5. Riavvia servizi
echo "🔄 Riavvio servizi..."
systemctl daemon-reload
systemctl restart lara-ai
systemctl restart lara-bot

sleep 3

# 6. Verifica
echo ""
echo "✅ AGGIORNAMENTO COMPLETATO!"
echo ""
echo "📊 Stato servizi:"
systemctl status lara-ai --no-pager | head -4
echo ""
systemctl status lara-bot --no-pager | head -4
echo ""
echo "🧠 Modelli installati:"
ollama list
echo ""
echo "🧪 Test AI:"
curl -X POST http://localhost:5001/chat -H "Content-Type: application/json" -d '{"message":"Ciao Lara, chi sei?","userId":"admin"}'
echo ""
