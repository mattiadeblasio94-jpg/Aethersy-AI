#!/usr/bin/env python3
"""
Bot Telegram Aethersy-AI con AI Cloud — LARA OS
USERBOT MODE - Risponde a tutti nei gruppi dove è aggiunto
Controllo piani Stripe e Supabase
"""

import os
import sys
import asyncio
import json
from datetime import datetime, timedelta
from telethon import TelegramClient, events
from telethon.tl.types import Message
import requests
from dotenv import load_dotenv

load_dotenv()

# Config - USERBOT MODE (il tuo account personale)
API_ID = int(os.getenv('TELEGRAM_API_ID', '30925326'))
API_HASH = os.getenv('TELEGRAM_API_HASH', 'd2885515f94c6bd123596801854f67a5')
PHONE = os.getenv('TELEGRAM_PHONE', '+393395093888')

LARA_URL = os.getenv('LARA_WEBHOOK_URL', 'https://aethersy.com/api/lara/chat')
APP_URL = os.getenv('NEXT_PUBLIC_APP_URL', 'https://aethersy.com')
LARA_SERVER_URL = os.getenv('LARA_SERVER_URL', 'http://47.87.134.105:3000')

# OpenClaw Gateway
OPENCLAW_GATEWAY_URL = os.getenv('OPENCLAW_GATEWAY_URL', 'ws://localhost:18789')
USE_OPENCLAW = os.getenv('USE_OPENCLAW', 'false').lower() == 'true'

# Supabase per controllo piani
SUPABASE_URL = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

# Session storage - USERBOT
SESSION_NAME = 'lara_userbot_session'
client = TelegramClient(SESSION_NAME, API_ID, API_HASH)

# Memoria conversazioni per utente
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

# ADMIN ID - Accesso illimitato (NASCOSTO, non mostrare mai in chat)
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

COME RAGIONI:
1. Ascolti il vero obiettivo dietro la richiesta
2. Analizzi il contesto business (mercato, competitor, timing)
3. Proponi una strategia chiara
4. Suggerisci azioni immediate
5. Offri di eseguire tu stessa le azioni

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

async def send_upgrade_prompt(chat_id, plan):
    """
    Invia prompt per upgrade piano
    """
    await client.send_message(chat_id, """
⚠️ **Hai raggiunto il limite del piano Free**

**Limiti piano Free:**
• 20 messaggi/giorno
• 5 ricerche web/giorno

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

Scrivi `/status` per verificare il tuo piano.""", parse_mode='md')

@client.on(events.NewMessage(incoming=True))
async def handle_msg(event: Message):
    """
    Gestisce messaggi in arrivo — USERBOT risponde a TUTTI gli utenti
    """
    if event.sender_id == (await client.get_me()).id:
        return  # Ignora messaggi del bot stesso

    uid = str(event.sender_id)
    msg = event.text or ''
    chat_id = event.chat_id

    # Skip comandi
    if msg.startswith('/'):
        return

    # Recupera piano utente e pacchetto personalizzato
    plan, custom_package = get_user_plan(uid)

    # Ottieni limiti (piano o pacchetto custom)
    limits = get_user_limits(plan, custom_package)

    # Controlla rate limit
    if not check_rate_limit(uid, plan, custom_package):
        await send_upgrade_prompt(chat_id, plan, custom_package)
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

        await event.respond(response, parse_mode='md')
    else:
        await event.respond("""
💡 **Sono Lara, la tua AI Agent di Aethersy!**

Posso aiutarti con:
- **Business Strategy** — Analisi mercato, competitor, positioning
- **Content** — Video, musica, immagini con Cinema Studio
- **Code** — Genera codice in 15+ linguaggi
- **Research** — Ricerca web approfondita
- **Email** — Scrivi e invia email automatiche

**Il tuo piano:** {plan}
Scrivi `/status` per dettagli.

Cosa ti serve ora? 🎯""".format(plan=plan.upper()), parse_mode='md')

@client.on(events.NewMessage(pattern='/start'))
async def handle_start(event: Message):
    """
    Comando /start
    """
    uid = str(event.sender_id)
    plan = get_user_plan(uid)

    await event.respond(f"""
🚀 **Benvenuto su Aethersy-AI!**

*"Sogna, Realizza, Guadagna"*

Sono Lara, la tua AI Agent imprenditoriale.

**Il tuo piano:** {plan.upper()}
**Limiti giornalieri:**
• Messaggi: {PLAN_LIMITS[plan]['daily_messages']}
• Ricerche: {PLAN_LIMITS[plan]['daily_searches']}

**Comandi:**
/status — Verifica il tuo piano
/upgrade — Link per upgrade
/help — Guida completa

**Esempi:**
• "Cerca ultime news su AI"
• "Genera video di tramonto"
• "Crea musica epic 120 BPM"
• "Scrivi funzione Python"

Cosa ti serve oggi? 🎯""".format(plan=plan), parse_mode='md')

@client.on(events.NewMessage(pattern='/status'))
async def handle_status(event: Message):
    """
    Comando /status — Verifica piano e limiti
    """
    uid = str(event.sender_id)
    plan, custom_package = get_user_plan(uid)
    limits = get_user_limits(plan, custom_package)

    # Calcola utilizzo oggi
    used = rate_limits.get(uid, {}).get('count', 0)
    remaining = limits['daily_messages'] - used if limits['daily_messages'] > 0 else '∞'

    pkg_text = f"\n**Pacchetto personalizzato:** {custom_package.upper()}" if custom_package else ""

    await event.respond(f"""
📊 **Il tuo piano: {plan.upper()}{pkg_text}**

**Utilizzo oggi:**
• Messaggi usati: {used}
• Messaggi rimanenti: {remaining}

**Limiti:**
• Messaggi/giorno: {limits['daily_messages']}
• Ricerche/giorno: {limits['daily_searches']}

**Upgrade:**
Pro: €49/mese → https://aethersy.com/pricing
Business: €199/mese → https://aethersy.com/pricing

Per collegare questo userbot al tuo account Aethersy:
1. Accedi su https://aethersy.com
2. Vai su Impostazioni
3. Collega Telegram""", parse_mode='md')

@client.on(events.NewMessage(pattern='/upgrade'))
async def handle_upgrade(event: Message):
    """
    Comando /upgrade — Link upgrade piano
    """
    await event.respond("""
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

Dopo l'upgrade, scrivi `/status` per verificare.""", parse_mode='md')

@client.on(events.NewMessage(pattern='/help'))
async def handle_help(event: Message):
    """
    Comando /help — Guida completa
    """
    is_admin_user = is_admin(event.sender_id)

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

    await event.respond(f"""
📚 **Guida Aethersy-AI Userbot**

**Comandi:**
/start — Inizia conversazione
/status — Verifica piano e limiti
/upgrade — Link per upgrade
/help — Questa guida
/reset — Reset conversazione
{admin_commands}
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
Free: 100 messaggi/giorno (aggiornato!)
Pro: 1000 messaggi/giorno
Business: 10000 messaggi/giorno
Enterprise: Illimitato

*Sogna, Realizza, Guadagna.*""", parse_mode='md')

@client.on(events.NewMessage(pattern='/reset'))
async def handle_reset(event: Message):
    """
    Comando /reset — Reset conversazione
    """
    uid = str(event.sender_id)
    conversation_history[uid] = [SYSTEM_PROMPT]
    await event.respond("🔄 **Context reset!**\n\nNuova conversazione iniziata.", parse_mode='md')

# ============================================
# COMANDI ADMIN - Monitoraggio Lead & System
# ============================================

def is_admin(sender_id):
    """
    Verifica se l'utente è admin (ID Telegram: 8074643162)
    """
    return sender_id == ADMIN_ID

@client.on(events.NewMessage(pattern='/stats'))
async def handle_stats(event: Message):
    """
    Comando /stats — Statistiche sistema (ADMIN ONLY)
    """
    sender_id = str(event.sender_id)

    if not is_admin(event.sender_id):
        await event.respond("⛔ **Comando riservato agli admin**\n\nSolo gli utenti con accesso admin possono usare questo comando.")
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

        await event.respond(f"""
📊 **Statistiche Sistema - Admin**

**Utenti:**
• Totali: {total_users}
• Nuovi oggi: {new_users_today}

**Lead:**
• Totali: {total_leads}

**Revenue:**
• MRR: €{mrr}

**Attività:**
• Sessioni attive (5min): {active_sessions}

_Ultimo aggiornamento: {datetime.now().strftime('%H:%M:%S')}_
""", parse_mode='md')

    except Exception as e:
        await event.respond(f"⚠️ **Errore recupero stats:**\n`{e}`", parse_mode='md')

@client.on(events.NewMessage(pattern='/user'))
async def handle_user(event: Message):
    """
    Comando /user [email] — Dettagli utente (ADMIN ONLY)
    """
    if not is_admin(event.sender_id):
        await event.respond("⛔ **Comando riservato agli admin**")
        return

    args = event.text.split()
    if len(args) < 2:
        await event.respond("📝 **Uso:** `/user email@esempio.com`\n\nFornisci l'email dell'utente da cercare.")
        return

    email = args[1]

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
                await event.respond(f"""
📋 **Profilo Utente**

**Email:** {user.get('email', 'N/A')}
**Nome:** {user.get('full_name', 'N/A')}
**Piano:** {user.get('plan', 'free').upper()}
**Telegram ID:** {user.get('telegram_id', 'N/A')}
**Stripe Customer:** `{user.get('stripe_customer_id', 'N/A')}`
**Iscritto dal:** {user.get('created_at', 'N/A')[:10]}

**Limiti giornalieri:**
• Messaggi: {PLAN_LIMITS.get(user.get('plan', 'free'), PLAN_LIMITS['free'])['daily_messages']}
• Ricerche: {PLAN_LIMITS.get(user.get('plan', 'free'), PLAN_LIMITS['free'])['daily_searches']}
""", parse_mode='md')
            else:
                await event.respond(f"❌ **Utente non trovato**\n\nNessun utente con email `{email}`.")
        else:
            await event.respond(f"⚠️ **Errore API:** {resp.status_code}")

    except Exception as e:
        await event.respond(f"⚠️ **Errore:** `{e}`", parse_mode='md')

@client.on(events.NewMessage(pattern='/alerts'))
async def handle_alerts(event: Message):
    """
    Comando /alerts — Gestisci notifiche admin (ADMIN ONLY)
    """
    if not is_admin(event.sender_id):
        await event.respond("⛔ **Comando riservato agli admin**")
        return

    args = event.text.split()

    if len(args) < 2:
        await event.respond("""
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
""", parse_mode='md')
        return

    action = args[1].lower()

    if action == 'on':
        await event.respond("✅ **Notifiche ATTIVATE**\n\nRiceverai alert in tempo reale su Telegram.")
    elif action == 'off':
        await event.respond("⏸️ **Notifiche DISATTIVATE**\n\nLe notifiche sono state sospese.")
    elif action == 'status':
        await event.respond(f"📊 **Stato notifiche:** {'✅ ATTIVE' if ALERTS_ENABLED else '⏸️ DISATTIVATE'}")
    else:
        await event.respond("❌ Comando non valido. Usa `/alerts` per la guida.")

@client.on(events.NewMessage(pattern='/grant'))
async def handle_grant_admin(event: Message):
    """
    Comando /grant [email] — Concedi accesso admin (ADMIN ONLY)
    """
    if not is_admin(event.sender_id):
        await event.respond("⛔ **Comando riservato agli admin**")
        return

    args = event.text.split()
    if len(args) < 2:
        await event.respond("📝 **Uso:** `/grant email@esempio.com`\n\nConcede accesso admin all'utente specificato.")
        return

    email = args[1]

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
                    await event.respond(f"✅ **Accesso ADMIN concesso!**\n\nUtente: `{email}`\nID: `{user_id}`\n\nPuò ora accedere al pannello admin su https://aethersy.com/admin-new")
                else:
                    await event.respond(f"⚠️ **Errore grant:** {resp.text}")
            else:
                await event.respond(f"❌ **Utente non trovato** con email `{email}`")
        else:
            await event.respond(f"⚠️ **Errore API:** {resp.status_code}")

    except Exception as e:
        await event.respond(f"⚠️ **Errore:** `{e}`", parse_mode='md')

@client.on(events.NewMessage(pattern='/package'))
async def handle_package(event: Message):
    """
    Comando /package [email] [pacchetto] — Assegna pacchetto personalizzato (ADMIN ONLY)
    Pacchetti: free, vip, trial, pro, business, enterprise
    """
    if not is_admin(event.sender_id):
        await event.respond("⛔ **Comando riservato agli admin**")
        return

    args = event.text.split()
    if len(args) < 3:
        await event.respond("""
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
""", parse_mode='md')
        return

    email = args[1]
    package = args[2].lower()

    valid_packages = ['free', 'trial', 'vip', 'pro', 'business', 'enterprise', 'none']
    if package not in valid_packages:
        await event.respond(f"❌ **Pacchetto non valido**\n\nUsa uno di questi: {', '.join(valid_packages)}")
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
                    await event.respond(f"""
✅ **Pacchetto assegnato!**

**Utente:** `{email}`
**Pacchetto:** {pkg_display}
**Limiti:**
• Messaggi/giorno: {limits['daily_messages']}
• Ricerche/giorno: {limits['daily_searches']}
""", parse_mode='md')
                else:
                    await event.respond(f"⚠️ **Errore update:** {resp.text}")
            else:
                await event.respond(f"❌ **Utente non trovato** con email `{email}`")
        else:
            await event.respond(f"⚠️ **Errore API:** {resp.status_code}")

    except Exception as e:
        await event.respond(f"⚠️ **Errore:** `{e}`", parse_mode='md')

@client.on(events.NewMessage(pattern='/limits'))
async def handle_limits(event: Message):
    """
    Comando /limits — Mostra limiti pacchetti (ADMIN ONLY)
    """
    if not is_admin(event.sender_id):
        await event.respond("⛔ **Comando riservato agli admin**")
        return

    await event.respond("""
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
""", parse_mode='md')

async def main():
    """
    Avvio principale - USERBOT MODE
    """
    await client.start(phone=PHONE)
    me = await client.get_me()
    print("✅ Aethersy-AI Userbot avviato!")
    print(f"   Account: @{me.username or 'nessuno'} ({me.first_name})")
    print(f"   Lara API: {LARA_URL}")
    print(f"   App URL: {APP_URL}")
    print(f"   Supabase: {SUPABASE_URL}")
    print()
    await client.run_until_disconnected()

if __name__ == '__main__':
    print("🚀 Aethersy-AI — Telegram Userbot")
    print(f"   Phone: {PHONE}")
    print(f"   Lara API: {LARA_URL}")
    print(f"   App URL: {APP_URL}")
    print()
    asyncio.run(main())
