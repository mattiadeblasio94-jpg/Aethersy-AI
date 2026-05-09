#!/usr/bin/env python3
"""
Configura il webhook Telegram per puntare a Vercel
"""
import sys
import io
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
import requests
import os

# Token bot
BOT_TOKEN = "8172610054:AAH4RDMjU3GkKvYil27hBKSiUJMi7SmMa8U"

# URL Vercel production
VERCEL_URL = "https://aiforge-pro-mattiadeblasio94-8016s-projects.vercel.app"
WEBHOOK_URL = f"{VERCEL_URL}/api/telegram/webhook"

# Configura webhook
res = requests.get(f"https://api.telegram.org/bot{BOT_TOKEN}/setWebhook?url={WEBHOOK_URL}")
data = res.json()

if data.get("ok"):
    print(f"✅ Webhook configurato: {WEBHOOK_URL}")
    print(f"Info: {data.get('result', {})}")
else:
    print(f"❌ Errore: {data}")
