# Aethersy AI · Lara — PRD

## Original Problem Statement
Aethersy AI è una piattaforma full-stack futuristic dark-mode con Lara come AI co-founder. 10 moduli base + brain potenziato (RAG + memoria) + marketplace agenti + copilot terminale + Telegram bot con comandi.

## Stack
- Backend: FastAPI + Motor (Mongo async), Resend, reportlab, httpx
- Frontend: React 19 + Tailwind + shadcn/ui + recharts + sonner + lucide-react
- LLMs: Claude Sonnet 4.5 (chat), claude-haiku-4-5 (business plan), gpt-5-nano (copilot tool-calling) — tutti via Emergent Universal Key
- Telegram bot: long-poll, persona Lara, comandi /research /plan /code /lead /email
- Auth: JWT email/password + bridge Emergent Google OAuth → JWT

## What's Been Implemented
**Sprint 0 (MVP base):**
- 10 moduli: Dashboard, Research, BusinessPlan, Chat, Code, CRM, Finance/Crypto, Email, Funnels, Telegram

**Sprint 1 (PDF + Email reale):**
- PDF business plan server-side (reportlab) + bottone Download
- Resend email integration + bottone "Send first email" + log Mongo
- Sender: onboarding@resend.dev (fino a verifica dominio)

**Sprint 2 (Memoria + RAG):**
- Knowledge base: upload .txt/.md, list, delete, search
- Mongo text index per ricerca free senza embedding
- Lara usa top-K chunk RAG nel system prompt (Chat + Telegram)
- Persistent memory: long-term summary, auto-aggiornato ogni 12 messaggi (Chat + Telegram separati)
- Pagina /knowledge con upload + memory editor + test search

**Sprint 3 (Marketplace agenti):**
- 25 categorie verticali (AI Agents, RAG, SaaS, E-commerce, Marketing, etc.)
- CRUD agenti con system_prompt + Discover/My agents tabs
- Install-to-thread: clona l'agent come nuovo thread Smart Chat
- Counter installs

**Sprint 4 (Copilot + Telegram→app):**
- Copilot agent: GPT-5-nano con tool-calling (shell_exec, write_file, read_file, list_dir)
- Sandbox per-utente: /tmp/copilot/{user_id}/
- Hard timeout 20s per shell, deny-list pattern pericolosi
- Pagina /copilot con trace UI (tool call + result steps) + history
- Telegram comandi: /research, /plan, /code, /lead (aggiunge al CRM), /email, /help

**Sprint 5 (Google login):**
- Endpoint /api/auth/google/callback bridge Emergent OAuth → JWT
- Pagina /auth/callback gestisce hash session_id
- Bottone "Continue with Google" su Login
- AuthContext skip /me check durante callback

## Test Credentials
- demo@e360.com / demo1234

## Routes (frontend)
/login /register /auth/callback /dashboard /research /business-plan /chat /knowledge /marketplace /copilot /code /crm /finance /email /funnels /telegram

## Backlog
- P1: Verifica dominio Resend per inviare a clienti reali
- P1: PDF Business Plan styling avanzato (logo, copertina)
- P2: Vector embeddings reali (richiede OpenAI key esterna)
- P2: Telegram webhook mode
- P2: Stripe pricing tier
- P2: Per-user LLM rate limiting
- P3: Marketplace: rating + review + featured agents
