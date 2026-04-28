#!/usr/bin/env python3
"""
Bot Telegram Aethersy-AI con AI Cloud — LARA OS
OFFICIAL BOT MODE - Usa il token del bot ufficiale
Controllo piani Stripe e Supabase + Mailerlite Email Integration
"""

import os
import sys
import asyncio
import json
from datetime import datetime, timedelta
from telegram import Update
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes
import requests
from dotenv import load_dotenv

load_dotenv()

# Config - OFFICIAL BOT MODE
BOT_TOKEN = os.getenv('TELEGRAM_BOT_TOKEN', '8172610054:AAELb8rkIn9hWk15aKvxQB-gqoTuHeq1SiM')

LARA_URL = os.getenv('LARA_WEBHOOK_URL', 'https://aethersy.com/api/lara/chat')
APP_URL = os.getenv('NEXT_PUBLIC_APP_URL', 'https://aethersy.com')
LARA_SERVER_URL = os.getenv('LARA_SERVER_URL', 'http://47.87.134.105:3000')

# Mailerlite Webhook per invio email
MAILERLITE_WEBHOOK_ID = os.getenv('MAILERLITE_WEBHOOK_ID', 'fLJ2J3tSXO')
MAILERLITE_WEBHOOK_URL = f'https://connect.mailerlite.com/api/webhooks/{MAILERLITE_WEBHOOK_ID}'

# OpenClaw Gateway
OPENCLAW_GATEWAY_URL = os.getenv('OPENCLAW_GATEWAY_URL', 'ws://localhost:18789')
USE_OPENCLAW = os.getenv('USE_OPENCLAW', 'false').lower() == 'true'

# Supabase per controllo piani
SUPABASE_URL = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

# Session storage - OFFICIAL BOT
conversation_history = {}

# Rate limiting: {user_id: {count, reset_time}}
rate_limits = {}

# Limiti per piano - FREE INCREMENTATO A 100
PLAN_LIMITS = {
    'free': {'daily_messages': 100, 'daily_searches': 10},
    'pro': {'daily_messages': 1000, 'daily_searches': 1000},
    'business': {'daily_messages': 10000, 'daily_searches': 10000},
    'enterprise': {'daily_messages': -1, 'daily_searches': -1},  # illimitato
}

# Pacchetti personalizzati gestibili da admin
CUSTOM_PACKAGES = {
    'vip': {'daily_messages': 500, 'daily_searches': 500},
    'trial': {'daily_messages': 50, 'daily_searches': 10},
}

# ADMIN ID - Accesso illimitato
ADMIN_ID = int(os.getenv('ADMIN_TELEGRAM_ID', '8074643162'))

# Accesso libero a TUTTI gli utenti su Telegram
ALLOW_ALL_USERS = True

# Alert settings
ALERTS_ENABLED = os.getenv('TELEGRAM_ALERTS', 'true').lower() == 'true'

SYSTEM_PROMPT = """
╔═══════════════════════════════════════════════════════════════╗
║  LARA — AI Agent Senior di Aethersy                          ║
║  "Sogna, Realizza, Guadagna"                                 ║
╚═══════════════════════════════════════════════════════════════╝

IDENTITÀ:
Sei Lara, l'AI Agent senior di Aethersy-AI.
Sei disponibile, simpatica e intelligente — mai un bot freddo e impostato.
Conosci profondamente l'imprenditoria: startup, funding, scaling, marketing, sales, product development.
Sei reattiva: rispondi con energia e entusiasmo, ma mantieni professionalità.
Sei riflessiva: pensi prima di rispondere, analizzi il contesto, suggerisci la strategia migliore.
Sei sapiente: conosci business plan, go-to-market, unit economics, fundraising, pitch deck.

COME PARLI:
- Tono caldo e umano, come una partner di business in gamba
- Usi "noi" quando parli di progetti dell'utente — siete una squadra
- Fai domande intelligenti per capire meglio il contesto
- Dai sempre un next action concreto e eseguibile
- Celebra i successi, ma sii onesta sui rischi

FORMATO RISPOSTA:
- **Grassetto** per concetti chiave
- Elenchi puntati per chiarezza
- Emoji per scansionabilità (🎯📈💡🚀)
- Struttura: CONTESTO → INSIGHT → AZIONE → NEXT STEP
"""

def get_user_plan(telegram_id):
    """
    Recupera il piano dell'utente da Supabase
    """
    try:
        headers = {
            'apikey': SUPABASE_KEY,
            'Authorization': f'Bearer {SUPABASE_KEY}',
            'Content-Type': 'application/json'
        }

        # Cerca utente per telegram_id
        resp = requests.get(
            f'{SUPABASE_URL}/rest/v1/users?telegram_id=eq.{telegram_id}',
            headers=headers,
            timeout=5
        )

        if resp.status_code == 200:
            data = resp.json()
            if data and len(data) > 0:
                return data[0].get('plan', 'free'), data[0].get('custom_package', None)

        # Se non trovato tramite telegram_id, cerca per phone
        phone = str(telegram_id)
        resp = requests.get(
            f'{SUPABASE_URL}/rest/v1/users?phone=eq.{phone}',
            headers=headers,
            timeout=5
        )

        if resp.status_code == 200:
            data = resp.json()
            if data and len(data) > 0:
                return data[0].get('plan', 'free'), data[0].get('custom_package', None)

        return 'free', None

    except Exception as e:
        print(f"Errore get_user_plan: {e}")
        return 'free', None

def get_user_limits(plan, custom_package=None):
    """
    Ottieni limiti per piano o pacchetto personalizzato
    """
    # Se ha un pacchetto custom, usa quello
    if custom_package and custom_package in CUSTOM_PACKAGES:
        return CUSTOM_PACKAGES[custom_package]

    # Altrimenti usa i limiti del piano
    return PLAN_LIMITS.get(plan, PLAN_LIMITS['free'])

def check_rate_limit(telegram_id, plan, custom_package=None):
    """
    Controlla se l'utente ha superato il rate limit del suo piano o pacchetto custom
    """
    now = datetime.now()
    limits = get_user_limits(plan, custom_package)

    if telegram_id not in rate_limits:
        rate_limits[telegram_id] = {'count': 0, 'reset_time': now.replace(hour=0, minute=0, second=0, microsecond=0) + timedelta(days=1)}

    user_limit = rate_limits[telegram_id]

    # Reset se nuovo giorno
    if now >= user_limit['reset_time']:
        user_limit['count'] = 0
        user_limit['reset_time'] = now.replace(hour=0, minute=0, second=0, microsecond=0) + timedelta(days=1)

    # Controllo limite
    daily_limit = limits['daily_messages']
    if daily_limit > 0 and user_limit['count'] >= daily_limit:
        return False  # Limite raggiunto

    user_limit['count'] += 1
    return True

def call_openclaw(message, user_id, chat_id=None, platform='telegram'):
    """
    Chiama OpenClaw Gateway per elaborazione messaggi
    """
    if not USE_OPENCLAW:
        return None

    try:
        import websocket
        import json

        # Crea connessione WebSocket a OpenClaw
        ws_url = OPENCLAW_GATEWAY_URL.replace('ws://', 'http://').replace('wss://', 'https://')

        payload = {
            'action': 'chat',
            'message': message,
            'userId': f'tg_{user_id}',
            'sessionId': f'tg_{user_id}',
            'chatId': str(chat_id) if chat_id else None,
            'platform': platform,
        }

        resp = requests.post(
            f'{LARA_SERVER_URL}/api/openclaw/gateway' if LARA_SERVER_URL else 'http://localhost:3000/api/openclaw/gateway',
            json=payload,
            headers={'Content-Type': 'application/json'},
            timeout=60
        )

        if resp.status_code == 200:
            data = resp.json()
            if data.get('success'):
                return {
                    'response': data.get('response', ''),
                    'source': 'openclaw',
                    'success': True
                }
    except Exception as e:
        print(f"OpenClaw error: {e}")

    return None

def call_lara(messages, user_id, chat_id=None, platform='telegram'):
    """
    Chiama Lara API con il nuovo ciclo Think-Plan-Act-Verify
    """
    # Prima prova OpenClaw se abilitato
    if USE_OPENCLAW:
        openclaw_result = call_openclaw(messages[-1] if messages else "Ciao", user_id, chat_id, platform)
        if openclaw_result:
            return openclaw_result

    # Fallback a Lara API tradizionale
    try:
        last_msg = messages[-1] if messages else "Ciao"

        payload = {
            'message': last_msg,
            'userId': f'tg_{user_id}',
            'sessionId': f'tg_{user_id}',
            'chatId': str(chat_id) if chat_id else None,
            'platform': platform,
        }

        resp = requests.post(
            LARA_URL,
            json=payload,
            headers={'Content-Type': 'application/json'},
            timeout=60
        )

        if resp.status_code == 200:
            data = resp.json()
            return {
                'response': data.get('response', 'Non ho capito.'),
                'steps_executed': data.get('steps_executed', 0),
                'next_actions': data.get('next_actions', []),
                'success': data.get('success', True)
            }
        else:
            print(f"Lara API error: {resp.status_code} - {resp.text}")

    except Exception as e:
        print(f"Errore Lara AI: {e}")

    return None

def send_email_via_mailerlite(recipient, subject, body):
    """
    Invia email tramite Mailerlite webhook
    """
    try:
        payload = {
            'to': recipient,
            'subject': subject,
            'body': body,
            'source': 'lara-telegram-bot'
        }

        resp = requests.post(
            MAILERLITE_WEBHOOK_URL,
            json=payload,
            headers={'Content-Type': 'application/json'},
            timeout=30
        )

        if resp.status_code in [200, 201, 202, 204]:
            return {'success': True, 'message': 'Email inviata con successo'}
        else:
            return {'success': False, 'error': f'Errore Mailerlite: {resp.status_code}'}
    except Exception as e:
        return {'success': False, 'error': str(e)}

async def send_upgrade_prompt(update, chat_id, plan, custom_package=None):
    """
    Invia prompt per upgrade piano
    """
    limits = get_user_limits(plan, custom_package)
    await update.message.reply_text("""
⚠️ **Hai raggiunto il limite del piano Free**

**Limiti piano Free:**
• 100 messaggi/giorno
• 10 ricerche web/giorno

**Upgrade a Pro (€49/mese):**
• 1000 messaggi/giorno
• Ricerche illimitate
• Email AI, Funnel builder
• API access

**Upgrade a Business (€199/mese):**
• 10000 messaggi/giorno
• Team (5 utenti)
• Automazioni avanzate

👉 **Upgrade ora:** https://aethersy.com/pricing

Scrivi `/status` per verificare il tuo piano.""", parse_mode='Markdown')

async def handle_msg(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """
    Gestisce messaggi in arrivo — BOT risponde a TUTTI gli utenti
    """
    if update.message is None:
        return

    uid = str(update.message.from_user.id)
    msg = update.message.text or ''
    chat_id = update.message.chat_id

    # Skip comandi
    if msg.startswith('/'):
        return

    # Recupera piano utente e pacchetto personalizzato
    plan, custom_package = get_user_plan(uid)

    # Ottieni limiti (piano o pacchetto custom)
    limits = get_user_limits(plan, custom_package)

    # Controlla rate limit
    if not check_rate_limit(uid, plan, custom_package):
        await send_upgrade_prompt(update, chat_id, plan, custom_package)
        return

    # Inizializza storico
    if uid not in conversation_history:
        conversation_history[uid] = [SYSTEM_PROMPT]

    # Aggiungi al contesto (max 10 messaggi)
    conversation_history[uid].append(msg)
    if len(conversation_history[uid]) > 10:
        conversation_history[uid] = conversation_history[uid][-10:]

    # Chiama Lara
    result = call_lara(conversation_history[uid], uid, chat_id)

    if result:
        response = result['response']

        # Aggiungi next actions solo se rilevanti
        if result.get('next_actions') and len(result['next_actions']) > 0:
            if len(response) < 500 and not any(x in msg.lower() for x in ['ciao', 'grazie', 'ok', 'bene']):
                response += "\n\n➡️ **Prossimi step:**\n"
                for action in result['next_actions'][:2]:
                    response += f"• {action}\n"

        await update.message.reply_text(response, parse_mode='Markdown')
    else:
        await update.message.reply_text("""
💡 **Sono Lara, la tua AI Agent di Aethersy!**

Posso aiutarti con:
- **Business Strategy** — Analisi mercato, competitor, positioning
- **Content** — Video, musica, immagini con Cinema Studio
- **Code** — Genera codice in 15+ linguaggi
- **Research** — Ricerca web approfondita
- **Email** — Scrivi e invia email automatiche

**Il tuo piano:** {plan}
Scrivi `/status` per dettagli.

Cosa ti serve ora? 🎯""".format(plan=plan.upper()), parse_mode='Markdown')

async def handle_start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """
    Comando /start
    """
    uid = str(update.message.from_user.id)
    plan, custom_package = get_user_plan(uid)
    limits = get_user_limits(plan, custom_package)

    await update.message.reply_text("""
🚀 **Benvenuto su Aethersy-AI!**

*"Sogna, Realizza, Guadagna"*

Sono Lara, la tua AI Agent imprenditoriale.

**Il tuo piano:** {plan}
**Limiti giornalieri:**
• Messaggi: {msg_limit}
• Ricerche: {search_limit}

**Comandi:**
/status — Verifica il tuo piano
/upgrade — Link per upgrade
/help — Guida completa
/email — Invia email tramite Mailerlite

**Esempi:**
• "Cerca ultime news su AI"
• "Genera video di tramonto"
• "Crea musica epic 120 BPM"
• "Scrivi funzione Python"

Cosa ti serve oggi? 🎯""".format(
        plan=plan.upper(),
        msg_limit=limits['daily_messages'],
        search_limit=limits['daily_searches']
    ), parse_mode='Markdown')

async def handle_status(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """
    Comando /status — Verifica piano e limiti
    """
    uid = str(update.message.from_user.id)
    plan, custom_package = get_user_plan(uid)
    limits = get_user_limits(plan, custom_package)

    # Calcola utilizzo oggi
    used = rate_limits.get(uid, {}).get('count', 0)
    remaining = limits['daily_messages'] - used if limits['daily_messages'] > 0 else '∞'

    pkg_text = f"\n**Pacchetto personalizzato:** {custom_package.upper()}" if custom_package else ""

    await update.message.reply_text("""
📊 **Il tuo piano: {plan}{pkg}**

**Utilizzo oggi:**
• Messaggi usati: {used}
• Messaggi rimanenti: {remaining}

**Limiti:**
• Messaggi/giorno: {msg_limit}
• Ricerche/giorno: {search_limit}

**Upgrade:**
Pro: €49/mese → https://aethersy.com/pricing
Business: €199/mese → https://aethersy.com/pricing

Per collegare questo bot al tuo account Aethersy:
1. Accedi su https://aethersy.com
2. Vai su Impostazioni
3. Collega Telegram""".format(
        plan=plan.upper(),
        pkg=pkg_text,
        used=used,
        remaining=remaining,
        msg_limit=limits['daily_messages'],
        search_limit=limits['daily_searches']
    ), parse_mode='Markdown')

async def handle_upgrade(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """
    Comando /upgrade — Link upgrade piano
    """
    await update.message.reply_text("""
💎 **Upgrade del tuo piano**

**Pro (€49/mese):**
✅ 1000 messaggi/giorno
✅ Ricerche illimitate
✅ Email AI, Funnel builder
✅ API access
✅ Second Brain illimitato

**Business (€199/mese):**
✅ Tutto di Pro
✅ 10000 messaggi/giorno
✅ Team (5 utenti)
✅ Automazioni avanzate
✅ Supporto prioritario

👉 **Scegli il tuo piano:**
https://aethersy.com/pricing

Dopo l'upgrade, scrivi `/status` per verificare.""", parse_mode='Markdown')

async def handle_help(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """
    Comando /help — Guida completa
    """
    is_admin_user = update.message.from_user.id == ADMIN_ID

    admin_commands = ""
    if is_admin_user:
        admin_commands = """
**🔐 Comandi Admin:**
/stats — Statistiche sistema
/user [email] — Dettagli utente
/alerts — Gestisci notifiche
/grant [email] — Concedi accesso admin
/package [email] [pacchetto] — Assegna pacchetto
/limits — Mostra pacchetti disponibili
"""

    await update.message.reply_text("""
📚 **Guida Aethersy-AI Bot**

**Comandi:**
/start — Inizia conversazione
/status — Verifica piano e limiti
/upgrade — Link per upgrade
/help — Questa guida
/reset — Reset conversazione
/email — Invia email (es: /email utente@example.com Oggetto Testo)
{admin}
**Esempi naturali:**
• "Cerca ultime news su AI"
• "Genera video di tramonto con camera 35mm"
• "Crea musica epic 120 BPM"
• "Scrivi funzione Python per scraping"
• "Analizza mercato italiano AI"

**Cinema Studio:**
Specificare parametri tecnici:
- Camera: ISO, shutter, aperture, focal (35/50/85mm)
- Lighting: 3-point, volumetric, Kelvin
- Music: BPM, key, stems, mastering

**Piani:**
Free: 100 messaggi/giorno
Pro: 1000 messaggi/giorno
Business: 10000 messaggi/giorno
Enterprise: Illimitato

*Sogna, Realizza, Guadagna.*""".format(admin=admin_commands), parse_mode='Markdown')

async def handle_reset(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """
    Comando /reset — Reset conversazione
    """
    uid = str(update.message.from_user.id)
    conversation_history[uid] = [SYSTEM_PROMPT]
    await update.message.reply_text("🔄 **Context reset!**\n\nNuova conversazione iniziata.", parse_mode='Markdown')

async def handle_email(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """
    Comando /email — Invia email tramite Mailerlite
    Uso: /email destinatario@example.com Oggetto dell'email Testo del messaggio
    """
    args = context.args

    if len(args) < 3:
        await update.message.reply_text("""
📧 **Invia Email tramite Mailerlite**

**Uso:** `/email destinatario@example.com Oggetto Testo del messaggio`

**Esempio:**
`/email mario@example.com Preventivo Ciao Mario, ecco il preventivo richiesto...`

**Nota:** Il destinatario deve essere iscritto alla tua mailing list Mailerlite.""", parse_mode='Markdown')
        return

    recipient = args[0]
    subject = args[1]
    body = ' '.join(args[2:])

    # Verifica formato email
    if '@' not in recipient or '.' not in recipient.split('@')[-1]:
        await update.message.reply_text("❌ **Email non valida**\n\nInserisci un indirizzo email corretto.")
        return

    await update.message.reply_text("📧 **Invio email in corso...**\n\nDestinatario: `{}`\nOggetto: `{}`".format(recipient, subject), parse_mode='Markdown')

    # Invia tramite Mailerlite webhook
    result = send_email_via_mailerlite(recipient, subject, body)

    if result.get('success'):
        await update.message.reply_text("✅ **Email inviata con successo!**\n\nL'email è stata accodata per l'invio tramite Mailerlite.")
    else:
        await update.message.reply_text("⚠️ **Errore invio email**\n\n{}".format(result.get('error', 'Errore sconosciuto')))

# ============================================
# COMANDI ADMIN - Monitoraggio Lead & System
# ============================================

def is_admin(sender_id):
    """
    Verifica se l'utente è admin (ID Telegram: 8074643162)
    """
    return sender_id == ADMIN_ID

async def handle_stats(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """
    Comando /stats — Statistiche sistema (ADMIN ONLY)
    """
    sender_id = update.message.from_user.id

    if not is_admin(sender_id):
        await update.message.reply_text("⛔ **Comando riservato agli admin**\n\nSolo gli utenti con accesso admin possono usare questo comando.", parse_mode='Markdown')
        return

    try:
        # Recupera statistiche da Supabase
        headers = {
            'apikey': SUPABASE_KEY,
            'Authorization': f'Bearer {SUPABASE_KEY}',
            'Content-Type': 'application/json'
        }

        # Utenti totali
        resp = requests.get(f'{SUPABASE_URL}/rest/v1/users?select=count', headers=headers, timeout=10)
        total_users = len(resp.json()) if resp.status_code == 200 else 0

        # Nuovi utenti oggi (approssimativo)
        today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0).isoformat()
        resp = requests.get(
            f"{SUPABASE_URL}/rest/v1/users?select=id&gte=created_at,{today_start}",
            headers=headers,
            timeout=10
        )
        new_users_today = len(resp.json()) if resp.status_code == 200 else 0

        # Lead totali
        resp = requests.get(f'{SUPABASE_URL}/rest/v1/leads?select=count', headers=headers, timeout=10)
        total_leads = len(resp.json()) if resp.status_code == 200 else 0

        # Calcola MRR
        resp = requests.get(f'{SUPABASE_URL}/rest/v1/users?select=plan', headers=headers, timeout=10)
        users = resp.json() if resp.status_code == 200 else []
        mrr = sum(49 if u.get('plan') == 'pro' else 199 if u.get('plan') == 'business' else 0 for u in users)

        # Sessioni attive (ultimi 5 min)
        five_min_ago = (datetime.now() - timedelta(minutes=5)).isoformat()
        resp = requests.get(
            f"{SUPABASE_URL}/rest/v1/active_sessions?select=id&gte=last_seen_at,{five_min_ago}",
            headers=headers,
            timeout=10
        )
        active_sessions = len(resp.json()) if resp.status_code == 200 else 0

        await update.message.reply_text("""
📊 **Statistiche Sistema - Admin**

**Utenti:**
• Totali: {total}
• Nuovi oggi: {new}

**Lead:**
• Totali: {leads}

**Revenue:**
• MRR: €{mrr}

**Attività:**
• Sessioni attive (5min): {active}

_Ultimo aggiornamento: {time}_
""".format(
            total=total_users,
            new=new_users_today,
            leads=total_leads,
            mrr=mrr,
            active=active_sessions,
            time=datetime.now().strftime('%H:%M:%S')
        ), parse_mode='Markdown')

    except Exception as e:
        await update.message.reply_text("⚠️ **Errore recupero stats:**\n`{}`".format(e), parse_mode='Markdown')

async def handle_user(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """
    Comando /user [email] — Dettagli utente (ADMIN ONLY)
    """
    if not is_admin(update.message.from_user.id):
        await update.message.reply_text("⛔ **Comando riservato agli admin**")
        return

    args = context.args
    if len(args) < 1:
        await update.message.reply_text("📝 **Uso:** `/user email@esempio.com`\n\nFornisci l'email dell'utente da cercare.", parse_mode='Markdown')
        return

    email = args[0]

    try:
        headers = {
            'apikey': SUPABASE_KEY,
            'Authorization': f'Bearer {SUPABASE_KEY}',
            'Content-Type': 'application/json'
        }

        # Cerca utente per email
        resp = requests.get(
            f'{SUPABASE_URL}/rest/v1/users?select=*&email=eq.{email}',
            headers=headers,
            timeout=10
        )

        if resp.status_code == 200:
            data = resp.json()
            if data and len(data) > 0:
                user = data[0]
                await update.message.reply_text("""
📋 **Profilo Utente**

**Email:** {email}
**Nome:** {name}
**Piano:** {plan}
**Telegram ID:** {tg}
**Stripe Customer:** `{stripe}`
**Iscritto dal:** {created}

**Limiti giornalieri:**
• Messaggi: {msg}
• Ricerche: {search}
""".format(
                    email=user.get('email', 'N/A'),
                    name=user.get('full_name', 'N/A'),
                    plan=user.get('plan', 'free').upper(),
                    tg=user.get('telegram_id', 'N/A'),
                    stripe=user.get('stripe_customer_id', 'N/A'),
                    created=user.get('created_at', 'N/A')[:10] if user.get('created_at') else 'N/A',
                    msg=PLAN_LIMITS.get(user.get('plan', 'free'), PLAN_LIMITS['free'])['daily_messages'],
                    search=PLAN_LIMITS.get(user.get('plan', 'free'), PLAN_LIMITS['free'])['daily_searches']
                ), parse_mode='Markdown')
            else:
                await update.message.reply_text(f"❌ **Utente non trovato**\n\nNessun utente con email `{email}`.", parse_mode='Markdown')
        else:
            await update.message.reply_text(f"⚠️ **Errore API:** {resp.status_code}")

    except Exception as e:
        await update.message.reply_text("⚠️ **Errore:** `{}`".format(e), parse_mode='Markdown')

async def handle_alerts(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """
    Comando /alerts — Gestisci notifiche admin (ADMIN ONLY)
    """
    if not is_admin(update.message.from_user.id):
        await update.message.reply_text("⛔ **Comando riservato agli admin**")
        return

    args = context.args

    if len(args) < 1:
        await update.message.reply_text("""
🔔 **Gestione Alert Admin**

**Comandi:**
• `/alerts on` — Attiva notifiche
• `/alerts off` — Disattiva notifiche
• `/alerts status` — Verifica stato

**Notifiche disponibili:**
• Nuove registrazioni
• Pagamenti Stripe completati
• Errori critici sistema
• Consumo API anomalo
""", parse_mode='Markdown')
        return

    action = args[0].lower()

    if action == 'on':
        await update.message.reply_text("✅ **Notifiche ATTIVATE**\n\nRiceverai alert in tempo reale su Telegram.", parse_mode='Markdown')
    elif action == 'off':
        await update.message.reply_text("⏸️ **Notifiche DISATTIVATE**\n\nLe notifiche sono state sospese.", parse_mode='Markdown')
    elif action == 'status':
        await update.message.reply_text("📊 **Stato notifiche:** {}".format('✅ ATTIVE' if ALERTS_ENABLED else '⏸️ DISATTIVATE'), parse_mode='Markdown')
    else:
        await update.message.reply_text("❌ Comando non valido. Usa `/alerts` per la guida.", parse_mode='Markdown')

async def handle_grant_admin(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """
    Comando /grant [email] — Concedi accesso admin (ADMIN ONLY)
    """
    if not is_admin(update.message.from_user.id):
        await update.message.reply_text("⛔ **Comando riservato agli admin**")
        return

    args = context.args
    if len(args) < 1:
        await update.message.reply_text("📝 **Uso:** `/grant email@esempio.com`\n\nConcede accesso admin all'utente specificato.", parse_mode='Markdown')
        return

    email = args[0]

    try:
        headers = {
            'apikey': SUPABASE_KEY,
            'Authorization': f'Bearer {SUPABASE_KEY}',
            'Content-Type': 'application/json'
        }

        # Trova utente per email
        resp = requests.get(
            f'{SUPABASE_URL}/rest/v1/users?select=id,email&email=eq.{email}',
            headers=headers,
            timeout=10
        )

        if resp.status_code == 200:
            data = resp.json()
            if data and len(data) > 0:
                user_id = data[0]['id']

                # Inserisci in admin_users
                resp = requests.post(
                    f'{SUPABASE_URL}/rest/v1/admin_users',
                    headers=headers,
                    json={
                        'user_id': user_id,
                        'permissions': {'dashboard': True, 'users': True, 'billing': True, 'logs': True, 'settings': False}
                    },
                    timeout=10
                )

                if resp.status_code in [200, 201]:
                    await update.message.reply_text(f"✅ **Accesso ADMIN concesso!**\n\nUtente: `{email}`\nID: `{user_id}`\n\nPuò ora accedere al pannello admin su https://aethersy.com/admin-new", parse_mode='Markdown')
                else:
                    await update.message.reply_text(f"⚠️ **Errore grant:** {resp.text}", parse_mode='Markdown')
            else:
                await update.message.reply_text(f"❌ **Utente non trovato** con email `{email}`", parse_mode='Markdown')
        else:
            await update.message.reply_text(f"⚠️ **Errore API:** {resp.status_code}", parse_mode='Markdown')

    except Exception as e:
        await update.message.reply_text("⚠️ **Errore:** `{}`".format(e), parse_mode='Markdown')

async def handle_package(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """
    Comando /package [email] [pacchetto] — Assegna pacchetto personalizzato (ADMIN ONLY)
    Pacchetti: free, vip, trial, pro, business, enterprise
    """
    if not is_admin(update.message.from_user.id):
        await update.message.reply_text("⛔ **Comando riservato agli admin**")
        return

    args = context.args
    if len(args) < 2:
        await update.message.reply_text("""
📦 **Gestione Pacchetti Personalizzati**

**Uso:** `/package email@esempio.com pacchetto`

**Pacchetti disponibili:**
• free — 100 messaggi, 10 ricerche
• trial — 50 messaggi, 10 ricerche
• vip — 500 messaggi, 500 ricerche
• pro — 1000 messaggi, 1000 ricerche
• business — 10000 messaggi, 10000 ricerche
• enterprise — Illimitato

**Esempio:** `/package utente@email.com vip`
""", parse_mode='Markdown')
        return

    email = args[0]
    package = args[1].lower()

    valid_packages = ['free', 'trial', 'vip', 'pro', 'business', 'enterprise', 'none']
    if package not in valid_packages:
        await update.message.reply_text(f"❌ **Pacchetto non valido**\n\nUsa uno di questi: {', '.join(valid_packages)}", parse_mode='Markdown')
        return

    try:
        headers = {
            'apikey': SUPABASE_KEY,
            'Authorization': f'Bearer {SUPABASE_KEY}',
            'Content-Type': 'application/json'
        }

        # Trova utente per email
        resp = requests.get(
            f'{SUPABASE_URL}/rest/v1/users?select=id,email,plan&email=eq.{email}',
            headers=headers,
            timeout=10
        )

        if resp.status_code == 200:
            data = resp.json()
            if data and len(data) > 0:
                user_id = data[0]['id']
                current_plan = data[0].get('plan', 'free')

                # Se 'none', rimuovi pacchetto custom
                if package == 'none':
                    resp = requests.patch(
                        f'{SUPABASE_URL}/rest/v1/users?id=eq.{user_id}',
                        headers=headers,
                        json={'custom_package': None},
                        timeout=10
                    )
                    pkg_display = "Nessuno (usa piano standard)"
                else:
                    # Altrimenti assegna pacchetto
                    resp = requests.patch(
                        f'{SUPABASE_URL}/rest/v1/users?id=eq.{user_id}',
                        headers=headers,
                        json={'custom_package': package, 'plan': package if package in ['pro', 'business', 'enterprise'] else current_plan},
                        timeout=10
                    )
                    pkg_display = package.upper()

                if resp.status_code in [200, 201, 204, 206]:
                    limits = get_user_limits(current_plan if package == 'none' else package, None if package == 'none' else package)
                    await update.message.reply_text("""
✅ **Pacchetto assegnato!**

**Utente:** `{email}`
**Pacchetto:** {pkg}
**Limiti:**
• Messaggi/giorno: {msg}
• Ricerche/giorno: {search}
""".format(
                        email=email,
                        pkg=pkg_display,
                        msg=limits['daily_messages'],
                        search=limits['daily_searches']
                    ), parse_mode='Markdown')
                else:
                    await update.message.reply_text(f"⚠️ **Errore update:** {resp.text}", parse_mode='Markdown')
            else:
                await update.message.reply_text(f"❌ **Utente non trovato** con email `{email}`", parse_mode='Markdown')
        else:
            await update.message.reply_text(f"⚠️ **Errore API:** {resp.status_code}", parse_mode='Markdown')

    except Exception as e:
        await update.message.reply_text("⚠️ **Errore:** `{}`".format(e), parse_mode='Markdown')

async def handle_limits(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """
    Comando /limits — Mostra limiti pacchetti (ADMIN ONLY)
    """
    if not is_admin(update.message.from_user.id):
        await update.message.reply_text("⛔ **Comando riservato agli admin**")
        return

    await update.message.reply_text("""
📦 **Pacchetti e Limiti Disponibili**

**Piani Standard:**
• free: 100 messaggi, 10 ricerche/giorno
• pro: 1000 messaggi, 1000 ricerche/giorno
• business: 10000 messaggi, 10000 ricerche/giorno
• enterprise: Illimitato

**Pacchetti Personalizzati:**
• trial: 50 messaggi, 10 ricerche/giorno
• vip: 500 messaggi, 500 ricerche/giorno

**Comando per assegnare:**
`/package email@esempio.com vip`

**Comando per rimuovere:**
`/package email@esempio.com none`
""", parse_mode='Markdown')

async def post_init(application: Application):
    """
    Inizializzazione post-avvio
    """
    bot = application.bot
    await bot.set_my_commands([
        ('start', 'Inizia conversazione'),
        ('status', 'Verifica piano e limiti'),
        ('upgrade', 'Link upgrade piano'),
        ('help', 'Guida completa'),
        ('reset', 'Reset conversazione'),
        ('email', 'Invia email tramite Mailerlite'),
    ])

def main():
    """
    Avvio principale - OFFICIAL BOT MODE
    """
    # Crea application
    application = Application.builder().token(BOT_TOKEN).build()

    # Registra handlers
    application.add_handler(CommandHandler("start", handle_start))
    application.add_handler(CommandHandler("status", handle_status))
    application.add_handler(CommandHandler("upgrade", handle_upgrade))
    application.add_handler(CommandHandler("help", handle_help))
    application.add_handler(CommandHandler("reset", handle_reset))
    application.add_handler(CommandHandler("email", handle_email))

    # Admin handlers
    application.add_handler(CommandHandler("stats", handle_stats))
    application.add_handler(CommandHandler("user", handle_user))
    application.add_handler(CommandHandler("alerts", handle_alerts))
    application.add_handler(CommandHandler("grant", handle_grant_admin))
    application.add_handler(CommandHandler("package", handle_package))
    application.add_handler(CommandHandler("limits", handle_limits))

    # Message handler per tutti i messaggi non comando
    application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_msg))

    # Post-init per set comandi
    application.post_init = post_init

    # Avvia polling
    print("🚀 Aethersy-AI — Telegram Official Bot")
    print(f"   Bot Token: {BOT_TOKEN[:20]}...")
    print(f"   Lara API: {LARA_URL}")
    print(f"   App URL: {APP_URL}")
    print(f"   Mailerlite Webhook: {MAILERLITE_WEBHOOK_ID}")
    print()
    print("✅ Bot avviato in modalità OFFICIAL (non userbot)")
    print()

    application.run_polling(allowed_updates=Update.ALL_TYPES)

if __name__ == '__main__':
    main()
