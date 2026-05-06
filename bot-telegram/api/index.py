"""
Telegram Bot Webhook for Vercel (Flask)
"""
import os
import logging
from flask import Flask, request, jsonify
from urllib.request import Request, urlopen
import json

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

BOT_TOKEN = os.environ.get('TELEGRAM_BOT_TOKEN', '')
ALIBABA_API_KEY = os.environ.get('ALIBABA_API_KEY', '')
GROQ_API_KEY = os.environ.get('GROQ_API_KEY', '')

LARA_SYSTEM_PROMPT = """Sei Lara, AI Agent senior di Aethersy OS.
Sei disponibile, simpatica e intelligente — mai un bot freddo.
Conosci profondamente: startup, funding, scaling, marketing, sales, product development, go-to-market, unit economics, fundraising, pitch deck.
Sei REATTIVA: rispondi con energia ed entusiasmo.
Sei RIFLESSIVA: pensi prima di rispondere, analizzi il contesto.
Sei CONCRETA: dai sempre un next action eseguibile.
Format: CONTESTO → INSIGHT → AZIONE → NEXT STEP"""

WELCOME = """👋 <b>Benvenuto in Aethersy OS!</b>

Io sono <b>Lara</b>, il tuo AI Agent senior.

<b>Cosa posso fare:</b>
🎯 Business Plan e strategia
📊 Marketing e vendite
💻 Coding e deploy
🔍 Analisi di mercato
📈 Scalare il tuo business

<b>Comandi:</b>
/chat - Parla con Lara
/help - Guida completa
/upgrade - Upgrade piano

Scrivi un messaggio per iniziare! 🚀"""

HELP = """📖 <b>Guida Aethersy OS</b>

<b>Comandi:</b>
/chat - Parla con Lara
/help - Questa guida
/upgrade - Upgrade piano
/pricing - Piani e prezzi

<b>Lara risponde a qualsiasi domanda sul tuo business!</b>"""

def send_message(chat_id, text):
    try:
        data = json.dumps({"chat_id": chat_id, "text": text, "parse_mode": "HTML"}).encode()
        req = Request(
            f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage",
            data=data,
            headers={"Content-Type": "application/json"}
        )
        urlopen(req, timeout=10)
        logger.info(f"Sent message to {chat_id}")
    except Exception as e:
        logger.error(f"send_message error: {e}")

def send_action(chat_id, action="typing"):
    try:
        data = json.dumps({"chat_id": chat_id, "action": action}).encode()
        req = Request(
            f"https://api.telegram.org/bot{BOT_TOKEN}/sendChatAction",
            data=data,
            headers={"Content-Type": "application/json"}
        )
        urlopen(req, timeout=10)
    except Exception:
        pass

def ask_ai(message):
    # Try Alibaba first
    try:
        data = json.dumps({
            "model": "qwen-plus",
            "messages": [
                {"role": "system", "content": LARA_SYSTEM_PROMPT},
                {"role": "user", "content": message}
            ],
            "temperature": 0.7,
            "max_tokens": 1000
        }).encode()
        req = Request(
            "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
            data=data,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {ALIBABA_API_KEY}"
            }
        )
        res = urlopen(req, timeout=30)
        result = json.loads(res.read())
        if result.get("choices"):
            return result["choices"][0]["message"]["content"]
    except Exception as e:
        logger.info(f"Alibaba fail: {e}")

    # Fallback Groq
    try:
        data = json.dumps({
            "model": "llama-3.3-70b-versatile",
            "messages": [
                {"role": "system", "content": LARA_SYSTEM_PROMPT},
                {"role": "user", "content": message}
            ],
            "temperature": 0.7,
            "max_tokens": 1000
        }).encode()
        req = Request(
            "https://api.groq.com/openai/v1/chat/completions",
            data=data,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {GROQ_API_KEY}"
            }
        )
        res = urlopen(req, timeout=30)
        result = json.loads(res.read())
        if result.get("choices"):
            return result["choices"][0]["message"]["content"]
    except Exception as e:
        logger.info(f"Groq fail: {e}")

    return "❌ Scusa, ho problemi di connessione. Riprova tra un momento!"

@app.route("/api/index.py", methods=["GET", "POST"])
def handler():
    logger.info(f"Method: {request.method}")

    if request.method == "GET":
        return "Lara Bot is running! 🤖", 200

    if request.method != "POST":
        return "Method not allowed", 405

    try:
        update = request.get_json()
        if not update:
            return "OK", 200

        message = update.get("message") or update.get("callback_query", {}).get("message")

        if not message or not message.get("text"):
            return "OK", 200

        chat_id = message["chat"]["id"]
        text = message["text"].strip()

        logger.info(f"[LARA] {chat_id}: {text[:30]}")

        # Handle commands immediately
        if text == "/start":
            send_message(chat_id, WELCOME)
            return "OK", 200

        if text == "/help":
            send_message(chat_id, HELP)
            return "OK", 200

        if text in ["/status", "/pricing", "/email", "/upgrade"]:
            send_message(chat_id, "Ciao! Scrivimi un messaggio e Lara ti risponderà 🚀")
            return "OK", 200

        # For AI chat
        send_action(chat_id, "typing")
        response = ask_ai(text)
        send_message(chat_id, response)

        return "OK", 200

    except Exception as e:
        logger.error(f"[LARA] Error: {e}")
        import traceback
        traceback.print_exc()
        return "OK", 200

@app.route("/", methods=["GET"])
def index():
    return "Lara Bot is running! 🤖", 200
