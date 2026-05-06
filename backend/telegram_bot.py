"""Telegram bot long-polling integration. Hooks into Lara's AI engine with RAG + memory + commands."""
import os
import asyncio
import logging
import uuid
from datetime import datetime, timezone
import httpx
from llm_service import llm_complete
from knowledge import (
    search as kb_search, format_context,
    telegram_get_memory, telegram_update_memory,
)


def _now():
    return datetime.now(timezone.utc).isoformat()

logger = logging.getLogger("telegram_bot")
TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN", "")
API = f"https://api.telegram.org/bot{TOKEN}"


class TelegramBot:
    def __init__(self, db):
        self.db = db
        self.task = None
        self.running = False
        self.offset = 0
        self.client = httpx.AsyncClient(timeout=35.0)

    async def get_me(self):
        if not TOKEN:
            return {"ok": False, "error": "no token"}
        r = await self.client.get(f"{API}/getMe")
        return r.json()

    async def send_message(self, chat_id: int, text: str):
        r = await self.client.post(f"{API}/sendMessage", json={"chat_id": chat_id, "text": text})
        data = r.json()
        if not data.get("ok"):
            raise RuntimeError(data.get("description", "Telegram send failed"))
        return data

    async def _process_update(self, update: dict):
        msg = update.get("message") or update.get("edited_message")
        if not msg:
            return
        text = msg.get("text", "")
        chat = msg.get("chat", {})
        chat_id = chat.get("id")
        from_user = msg.get("from", {})
        log_doc = {
            "id": str(uuid.uuid4()),
            "direction": "in",
            "chat_id": chat_id,
            "username": from_user.get("username") or from_user.get("first_name", "user"),
            "text": text,
            "ts": datetime.now(timezone.utc).isoformat(),
        }
        await self.db.telegram_messages.insert_one(log_doc)

        if not text:
            return

        if text.startswith("/start"):
            reply = (
                "Ciao, sono *Lara* — la tua AI co-founder di *Aethersy AI*.\n\n"
                "💬 Chiedimi qualsiasi cosa, oppure usa i comandi:\n"
                "• `/research <topic>` — ricerca rapida\n"
                "• `/plan <idea>` — business plan veloce\n"
                "• `/code <linguaggio> <descrizione>` — genera codice\n"
                "• `/lead <nome> | <email> | <azienda>` — aggiungi lead al CRM\n"
                "• `/email <prodotto> | <audience>` — bozza sequenza email\n"
                "• `/help` — mostra questi comandi"
            )
        elif text.startswith("/help"):
            reply = (
                "Comandi disponibili:\n"
                "• /research <topic>\n"
                "• /plan <idea>\n"
                "• /code <linguaggio> <prompt>\n"
                "• /lead <nome> | <email> | <azienda>\n"
                "• /email <prodotto> | <audience>\n"
                "Oppure scrivimi liberamente — rispondo come Lara."
            )
        elif text.startswith("/research"):
            topic = text.replace("/research", "", 1).strip()
            if not topic:
                reply = "Usa: /research <topic>"
            else:
                try:
                    reply = await llm_complete(
                        system_message=(
                            "Sei un analista business sharp. Sintetizza il topic in markdown breve "
                            "(max 500 parole): Riepilogo, 5 insight chiave, 3 opportunità, 3 rischi. "
                            "Rispondi nella lingua dell'utente."
                        ),
                        user_text=topic,
                        session_id=f"tg-research-{chat_id}",
                    )
                except Exception as e:
                    reply = f"Errore research: {e}"
        elif text.startswith("/plan"):
            idea = text.replace("/plan", "", 1).strip()
            if not idea:
                reply = "Usa: /plan <idea>"
            else:
                try:
                    reply = await llm_complete(
                        system_message=(
                            "Sei un consulente strategico. Crea un mini business plan in markdown: "
                            "Problema, Soluzione, Mercato, Modello di business, Go-to-market, Rischi. "
                            "Max 600 parole. Lingua = quella dell'utente."
                        ),
                        user_text=f"Idea: {idea}",
                        session_id=f"tg-plan-{chat_id}",
                    )
                except Exception as e:
                    reply = f"Errore plan: {e}"
        elif text.startswith("/code"):
            rest = text.replace("/code", "", 1).strip()
            if not rest:
                reply = "Usa: /code <linguaggio> <descrizione>"
            else:
                parts = rest.split(maxsplit=1)
                lang = parts[0]
                desc = parts[1] if len(parts) > 1 else ""
                try:
                    code = await llm_complete(
                        system_message=(
                            f"Sei un ingegnere {lang}. Output SOLO un blocco di codice "
                            f"in {lang}, niente prosa, racchiuso in triple backticks."
                        ),
                        user_text=desc,
                        session_id=f"tg-code-{chat_id}",
                    )
                    reply = code
                except Exception as e:
                    reply = f"Errore code: {e}"
        elif text.startswith("/lead"):
            rest = text.replace("/lead", "", 1).strip()
            if not rest:
                reply = "Usa: /lead <nome> | <email> | <azienda>"
            else:
                pieces = [p.strip() for p in rest.split("|")]
                while len(pieces) < 3:
                    pieces.append("")
                lead = {
                    "id": str(uuid.uuid4()),
                    "user_id": "telegram",
                    "name": pieces[0], "email": pieces[1], "company": pieces[2],
                    "phone": "", "stage": "new", "value": 0, "notes": "via Telegram",
                    "created_at": _now(), "updated_at": _now(),
                    "tg_chat_id": chat_id,
                }
                await self.db.leads.insert_one(lead)
                reply = f"✅ Lead aggiunto al CRM:\n• Nome: {pieces[0]}\n• Email: {pieces[1]}\n• Azienda: {pieces[2]}\nVisualizzalo su Aethersy AI → CRM."
        elif text.startswith("/email"):
            rest = text.replace("/email", "", 1).strip()
            if not rest or "|" not in rest:
                reply = "Usa: /email <prodotto> | <audience>"
            else:
                product, audience = [p.strip() for p in rest.split("|", 1)]
                try:
                    reply = await llm_complete(
                        system_message=(
                            "Genera una mini email sequence di 3 email (subject + body breve, max 80 parole "
                            "ciascuna) in markdown. Lingua = utente."
                        ),
                        user_text=f"Prodotto: {product}\nAudience: {audience}",
                        session_id=f"tg-email-{chat_id}",
                    )
                except Exception as e:
                    reply = f"Errore email: {e}"
        else:
            try:
                memory = await telegram_get_memory(self.db, chat_id)
                # Search shared (no specific user_id) — we'll use the bot's owner KB later
                kb_chunks = []
                kb_context = format_context(kb_chunks)

                sys_parts = [
                    "You are Lara, the AI co-founder persona of Aethersy AI — sharp, friendly, "
                    "strategic. Reply concisely (max 8 lines) over Telegram. "
                    "If the user writes in Italian, reply in Italian; otherwise match their language."
                ]
                if memory:
                    sys_parts.append(f"\n--- Long-term memory about this user ---\n{memory}\n--- End ---")
                if kb_context:
                    sys_parts.append(f"\n--- Knowledge base ---\n{kb_context}\n--- End ---")
                sys_msg = "\n".join(sys_parts)

                reply = await llm_complete(
                    system_message=sys_msg,
                    user_text=text,
                    session_id=f"tg-{chat_id}",
                )

                # Update Telegram-side memory periodically
                history_count = await self.db.telegram_messages.count_documents({"chat_id": chat_id})
                if history_count > 0 and history_count % 12 == 0:
                    try:
                        recent = await self.db.telegram_messages.find(
                            {"chat_id": chat_id}, {"_id": 0}
                        ).sort("ts", -1).limit(12).to_list(12)
                        recent.reverse()
                        recap = "\n".join(f"{m['username']}: {m['text'][:200]}" for m in recent)
                        prev = f"\n\nPrevious memory:\n{memory}" if memory else ""
                        new_mem = await llm_complete(
                            "Summarize durable facts about this Telegram user (name, business, "
                            "goals, preferences). 5-8 concise bullets. Merge with previous memory if present.",
                            f"Recent conversation:\n{recap}{prev}",
                            session_id=f"tg-mem-{chat_id}",
                        )
                        await telegram_update_memory(self.db, chat_id, new_mem.strip()[:2000])
                    except Exception:
                        logger.exception("Telegram memory update failed")
            except Exception as e:
                logger.exception("LLM error in Telegram handler")
                reply = f"Sorry, AI engine error: {e}"

        try:
            await self.send_message(chat_id, reply)
        except Exception:
            logger.exception("Telegram send failed in handler")
            return
        await self.db.telegram_messages.insert_one({
            "id": str(uuid.uuid4()),
            "direction": "out",
            "chat_id": chat_id,
            "username": "bot",
            "text": reply,
            "ts": datetime.now(timezone.utc).isoformat(),
        })

    async def _poll_loop(self):
        self.running = True
        logger.info("Telegram polling started")
        while self.running:
            try:
                r = await self.client.get(
                    f"{API}/getUpdates",
                    params={"offset": self.offset, "timeout": 25},
                )
                data = r.json()
                if data.get("ok"):
                    for upd in data.get("result", []):
                        self.offset = upd["update_id"] + 1
                        await self._process_update(upd)
                else:
                    logger.warning("Telegram getUpdates not ok: %s", data)
                    await asyncio.sleep(5)
            except Exception:
                logger.exception("Telegram poll error")
                await asyncio.sleep(5)

    async def start(self):
        if not TOKEN:
            logger.warning("Telegram bot disabled: no token")
            return
        # Release any existing webhook/polling from other instances
        await self.client.get(f"{API}/deleteWebhook")
        await asyncio.sleep(2)  # Wait for other poll to timeout
        self.offset = 0  # Start fresh
        self.task = asyncio.create_task(self._poll_loop())

    async def stop(self):
        self.running = False
        if self.task:
            self.task.cancel()
        await self.client.aclose()
