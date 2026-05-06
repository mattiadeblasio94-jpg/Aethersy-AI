# Aethersy AI — Lara OS

Piattaforma full-stack con Lara come AI co-founder.

## Stack

- **Backend**: FastAPI + Motor (MongoDB async) + Telegram Bot
- **Frontend**: React 19 + Tailwind + shadcn/ui
- **LLM**: Claude Sonnet 4.5, Gemini Flash — via Emergent Universal Key
- **Email**: Resend
- **Payments**: Stripe

## Struttura

```
aiforge-pro/
├── backend/          # FastAPI server (Lara AI + Telegram bot)
│   ├── server.py     # Main app
│   ├── auth.py       # JWT auth
│   ├── routes.py     # Feature routes
│   ├── telegram_bot.py
│   ├── knowledge.py  # RAG + memory
│   └── llm_service.py
├── frontend/         # React app
│   ├── src/
│   └── public/
├── memory/           # Documentazione progetto
└── tests/            # Test backend
```

## Setup Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn server:app --reload --port 8000
```

## Setup Frontend

```bash
cd frontend
yarn install
yarn start
```

## Variabili d'ambiente

Copia `.env.example` in `.env.local` e configura:

```bash
cp .env.example .env.local
```

## Test Credentials

- demo@e360.com / demo1234

## Comandi Telegram

- `/start` — Inizia conversazione
- `/research <topic>` — Ricerca business
- `/plan <idea>` — Business plan
- `/code <lang> <desc>` — Genera codice
- `/lead <nome> | <email> | <azienda>` — Aggiungi lead CRM
- `/email <prodotto> | <audience>` — Email sequence
