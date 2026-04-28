# Lara OS — Stack Open Source

## 🎯 Filosofia

**Priorità ad AI open source e self-hosted.** Nessun lock-in con provider proprietari.

---

## 🧠 Stack AI

### 1. Ollama (Locale - Priorità)
**Gratis, privacy totale, nessun API call esterno**

| Modello | Uso | Dimensione |
|---------|-----|------------|
| `llama3.1:8b` | Chat generale, reasoning | 8B |
| `qwen2.5-coder:7b` | Codice, automazioni | 7B |
| `mistral:7b` | Risposte veloci | 7B |
| `nomic-embed-text` | Embedding per RAG | 0.5B |

**Installazione:**
```bash
curl -fsSL https://ollama.com/install.sh | sh
ollama pull llama3.1:8b
ollama pull qwen2.5-coder:7b
ollama pull nomic-embed-text
```

**Endpoint locali:**
- Chat: `http://localhost:11434/api/generate`
- Embedding: `http://localhost:11434/api/embeddings`

---

### 2. Groq API (Fallback - Veloce)
**Tier gratis generoso, latenza ultra-bassa**

| Modello | Uso | Token/s |
|---------|-----|---------|
| `llama-3.1-8b-instant` | Chat | ~800 t/s |
| `mixtral-8x7b-32768` | Contesto lungo | ~500 t/s |

**Configurazione:**
```bash
# Ottieni API key gratis: https://console.groq.com
GROQ_API_KEY=gsk_...
```

**Endpoint:**
```
https://api.groq.com/openai/v1/chat/completions
```

---

### 3. Hugging Face Inference (Fallback Ultimo)
**Modelli open source, pay-per-use**

| Modello | Uso |
|---------|-----|
| `mistralai/Mistral-7B-Instruct-v0.3` | Chat |
| `Qwen/Qwen2.5-Coder-7B-Instruct` | Codice |
| `sentence-transformers/all-MiniLM-L6-v2` | Embedding |

**Configurazione:**
```bash
HF_API_KEY=hf_...
```

---

## 🎨 Media Generation

### Replicate (Open Weights)
**FLUX, Wan, LTX - modelli open weights**

| Modello | Tipo | Uso |
|---------|------|-----|
| FLUX Pro | Immagini | Photorealistic |
| Wan 2.1 | Video | Generazione video |
| LTX Video | Video | Alternative |
| MusicGen | Audio | Generazione musica |

**Configurazione:**
```bash
REPLICATE_API_TOKEN=r8_...
```

---

## 📊 Confronto Costi

| Provider | Gratis | A pagamento | Note |
|----------|--------|-------------|------|
| **Ollama** | ✅ 100% | ❌ N/A | Hardware locale necessario |
| **Groq** | ✅ 10k req/giorno | $0.05/1M tokens | Il migliore per velocità |
| **Hugging Face** | ✅ 30k req/mese | $9/mese | Più modelli disponibili |
| **Replicate** | ❌ Pay-per-use | ~$0.01/gen | Solo per media |
| ~~OpenAI~~ | ❌ $5/mese | ~$0.50/1M tokens | **NON USARE** |
| ~~Anthropic~~ | ❌ $5/mese | ~$3/1M tokens | **NON USARE** |

---

## 🔄 Gerarchia AI (Fallback Chain)

```
1. Ollama (locale)
   ↓ se non disponibile
2. Groq API (gratis, veloce)
   ↓ se non disponibile
3. Hugging Face Inference
   ↓ se non disponibile
4. Errore: "Configura un provider AI"
```

---

## 📦 Installazione Automatica

Sul server Alibaba ECS:

```bash
# 1. Installa Ollama
curl -fsSL https://ollama.com/install.sh | sh

# 2. Avvia Ollama
ollama serve &

# 3. Scarica modelli
ollama pull llama3.1:8b
ollama pull qwen2.5-coder:7b
ollama pull nomic-embed-text

# 4. Verifica
ollama list
```

---

## 🔧 Configurazione Lara OS

`.env` sul server:

```bash
# Ollama (priorità)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1:8b
OLLAMA_CODING_MODEL=qwen2.5-coder:7b
OLLAMA_EMBEDDING=nomic-embed-text

# Groq (fallback)
GROQ_API_KEY=gsk_...

# Hugging Face (fallback ultimo)
HF_API_KEY=hf_...

# Replicate (media)
REPLICATE_API_TOKEN=r8_...
```

---

## 🚀 Test Rapidi

### Test Ollama
```bash
curl http://localhost:11434/api/generate -d '{
  "model": "llama3.1:8b",
  "prompt": "Ciao, come stai?",
  "stream": false
}'
```

### Test Groq
```bash
curl https://api.groq.com/openai/v1/chat/completions \
  -H "Authorization: Bearer $GROQ_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "llama-3.1-8b-instant",
    "messages": [{"role": "user", "content": "Ciao!"}]
  }'
```

### Test Lara API
```bash
curl http://47.87.134.105:3000/api/lara/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Ciao Lara!", "userId": "test"}'
```

---

## 📈 Performance

| Modello | Latency | Quality | Cost |
|---------|---------|---------|------|
| Ollama Llama 3.1 | ~2s | 8/10 | Gratis |
| Groq Llama 3.1 | ~200ms | 8/10 | Gratis (tier) |
| HF Mistral 7B | ~5s | 7/10 | Gratis (limit) |

---

## 🛡️ Vantaggi Open Source

1. **Privacy**: I dati non lasciano il server
2. **Costo**: Gratis o quasi
3. **Controllo**: Modelli personalizzabili
4. **No Lock-in**: Cambia provider quando vuoi
5. **Offline**: Ollama funziona senza internet

---

**Motto:** *"Sogna, Realizza, Guadagna — con AI open source"* 🚀
