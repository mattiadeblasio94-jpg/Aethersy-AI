# 📘 LARA AI CLUSTER - Manuale Completo

## 🎯 Panoramica

Lara AI Cluster è un sistema distribuito di 5 server che lavorano insieme per fornire:
- **Bot Telegram** con AI conversazionale
- **Cinema Studio** per generazione video/immagini/musica
- **Database** per memoria e cache
- **Worker** per job in background
- **Monitor** per health check e alert

---

## 🗺️ Architettura

```
┌─────────────────────────────────────────────────────────────┐
│                    LARA AI CLUSTER                          │
├─────────────────────────────────────────────────────────────┤
│  SERVER                 IP              RUOLO              │
├─────────────────────────────────────────────────────────────┤
│  Bot Telegram      47.87.134.105    Chat, Comandi          │
│  GPU Cinema        47.91.76.37      Video, Image, Music    │
│  Database          47.87.141.18     Redis, PostgreSQL      │
│  Worker            47.87.139.66     Background Jobs        │
│  Monitor           47.87.141.154    Health, Alerts         │
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 Installazione

### Prerequisiti
- Accesso SSH a ogni server
- Ubuntu 22.04 o superiore
- 2GB RAM minimo per server
- NVIDIA GPU (solo server Cinema)

### Comandi di installazione

**Ogni server ha il suo script dedicato:**

| Server | Comando |
|--------|---------|
| Bot Telegram | `curl -sL https://raw.githubusercontent.com/mattiadeblasio94-jpg/Aethersy-AI/master/cluster-agents/bot-telegram/install.sh \| bash` |
| GPU Cinema | `curl -sL https://raw.githubusercontent.com/mattiadeblasio94-jpg/Aethersy-AI/master/cluster-agents/gpu-cinema/install.sh \| bash` |
| Database | `curl -sL https://raw.githubusercontent.com/mattiadeblasio94-jpg/Aethersy-AI/master/cluster-agents/db-service/install.sh \| bash` |
| Worker | `curl -sL https://raw.githubusercontent.com/mattiadeblasio94-jpg/Aethersy-AI/master/cluster-agents/worker/install.sh \| bash` |
| Monitor | `curl -sL https://raw.githubusercontent.com/mattiadeblasio94-jpg/Aethersy-AI/master/cluster-agents/monitor/install.sh \| bash` |
| AI Models | `curl -sL https://raw.githubusercontent.com/mattiadeblasio94-jpg/Aethersy-AI/master/cluster-agents/ai-models/install.sh \| bash` |

---

## 🤖 Bot Telegram - Funzioni

### Comandi Disponibili

| Comando | Descrizione |
|---------|-------------|
| `/start` | Avvia il bot |
| `/help` | Mostra guida completa |
| `/status` | Verifica piano e limiti |
| `/reset` | Reset conversazione |
| `/models` | Scegli modello AI |

### Modelli AI

| Modello | Comando | Migliore per |
|---------|---------|--------------|
| Qwen 2.5 72B | `/qwen` | Chat generale, scrittura |
| DeepSeek V3 | `/deepseek` | Matematica, logica |
| Qwen 2.5 Coder | `/coder` | Programmazione |
| DeepSeek R1 | `/r1` | Ragionamento complesso |

### Cinema Studio

| Comando | Funzione |
|---------|----------|
| `/video` | Genera video |
| `/image` | Genera immagine |
| `/music` | Genera musica |

---

## 🔧 Gestione Cluster

### Dashboard Web

Accedi a: **https://aethersy.com/bot-manager**

Funzioni:
- Stato di tutti i server in tempo reale
- Start/Stop/Restart remoti
- Deploy aggiornamenti
- Log e metriche

### Comandi API

Ogni server espone un'agent su **porta 9999**:

```bash
# Stato server
curl http://47.87.134.105:9999 -d '{"cmd":"status"}'

# Restart
curl http://47.87.134.105:9999 -d '{"cmd":"restart"}'

# Deploy aggiornamenti
curl http://47.87.134.105:9999 -d '{"cmd":"deploy"}'

# Log (solo bot)
curl http://47.87.134.105:9999 -d '{"cmd":"logs"}'
```

### Script Python di Controllo

```python
import requests

SERVERS = [
    {"name": "BOT", "ip": "47.87.134.105", "port": 9999},
    {"name": "GPU", "ip": "47.91.76.37", "port": 9999},
    {"name": "DB", "ip": "47.87.141.18", "port": 9999},
    {"name": "WRK", "ip": "47.87.139.66", "port": 9999},
    {"name": "MON", "ip": "47.87.141.154", "port": 9999},
]

def status():
    for s in SERVERS:
        try:
            r = requests.post(f"http://{s['ip']}:{s['port']}", json={"cmd": "status"}, timeout=3)
            print(f"{s['name']}: {r.json().get('status', 'offline')}")
        except:
            print(f"{s['name']}: OFFLINE")

status()
```

---

## 📊 Monitoraggio

### Log

```bash
# Bot Telegram
journalctl -u lara-bot -f

# Cinema Studio
journalctl -u cinema-studio -f

# Cluster Agent
journalctl -u lara-cluster-agent -f

# AI Server
journalctl -u lara-ai -f
```

### Health Check

```bash
# Tutti i server
curl http://47.87.134.105:9999 -d '{"cmd":"status"}'
curl http://47.91.76.37:9999 -d '{"cmd":"status"}'
curl http://47.87.141.18:9999 -d '{"cmd":"status"}'
curl http://47.87.139.66:9999 -d '{"cmd":"status"}'
curl http://47.87.141.154:9999 -d '{"cmd":"status"}'

# GPU status (solo cinema)
curl http://47.91.76.37:9999 -d '{"cmd":"gpu"}'

# Monitor health
curl http://47.87.141.154:9999 -d '{"cmd":"health"}'
```

---

## 🧠 Modelli AI

### Qwen 2.5 72B
- **Provider:** Alibaba Cloud
- **Use:** Chat generale, scrittura creativa
- **Endpoint:** `/api/lara/chat?model=qwen`

### Qwen 2.5 Coder
- **Provider:** Alibaba Cloud
- **Use:** Programmazione, debugging, code review
- **Endpoint:** `/api/lara/chat?model=qwen-coder`

### DeepSeek V3
- **Provider:** DeepSeek AI
- **Use:** Matematica, logica, analisi dati
- **Endpoint:** `/api/lara/chat?model=deepseek`

### DeepSeek R1
- **Provider:** DeepSeek AI
- **Use:** Ragionamento profondo, chain-of-thought
- **Endpoint:** `/api/lara/chat?model=deepseek-r1`

### Installazione Locale (Ollama)

```bash
# Installa Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Pull modelli
ollama pull qwen2.5:72b
ollama pull qwen2.5-coder:7b
ollama pull deepseek-v3
ollama pull deepseek-r1:7b

# Lista modelli installati
ollama list
```

---

## 🎬 Cinema Studio

### Generazione Video

```bash
curl -X POST http://47.91.76.37:5000/generate/video \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Tramonto su oceano, camera 35mm", "model": "wan"}'
```

### Generazione Immagini

```bash
curl -X POST http://47.91.76.37:5000/generate/image \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Ritratto cyberpunk, neon lights"}'
```

### Generazione Musica

```bash
curl -X POST http://47.91.76.37:5000/generate/music \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Epic orchestral, 120 BPM"}'
```

### Check Status

```bash
curl http://47.91.76.37:5000/status/<JOB_ID>
```

---

## 🔐 Sicurezza

### Chiavi API

- **Telegram Bot Token:** `.env` su bot server
- **Replicate Token:** Variabile ambiente su GPU server
- **SSH Keys:** Usa sempre chiavi, mai password

### Firewall

```bash
# Apri solo porte necessarie
ufw allow 22/tcp    # SSH
ufw allow 9999/tcp  # Cluster Agent
ufw allow 5000/tcp  # Cinema Studio (GPU only)
ufw allow 5001/tcp  # AI Server
ufw enable
```

---

## 🆘 Troubleshooting

### Bot non risponde

```bash
# Controlla stato
systemctl status lara-bot

# Vedi log
journalctl -u lara-bot -f

# Restart
systemctl restart lara-bot
```

### Cinema Studio lento

```bash
# Check GPU
nvidia-smi

# Check memoria
free -h

# Restart service
systemctl restart cinema-studio
```

### Cluster Agent offline

```bash
# Restart agent
systemctl restart lara-cluster-agent

# Verifica porta
netstat -tlnp | grep 9999
```

---

## 📞 Supporto

- **Dashboard:** https://aethersy.com/bot-manager
- **GitHub:** https://github.com/mattiadeblasio94-jpg/Aethersy-AI
- **Telegram:** @Lara_Aethersy_AI_bot

---

**"Sogna, Realizza, Guadagna"** 🚀
