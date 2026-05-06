"""All feature routes for AI Entrepreneurship 360."""
import os
import io
import uuid
import asyncio
import httpx
import resend
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib.colors import HexColor
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak
from llm_service import llm_complete, llm_chat_with_history, FAST_MODEL
from knowledge import (
    add_document, list_documents, delete_document, search as kb_search,
    format_context, get_memory, update_memory,
)
from copilot import copilot_run
from billing import TIERS, get_user_tier, create_checkout, get_status, handle_stripe_webhook, has_tier, STRIPE_API_KEY
from seed_data import seed_demo_for_user
from fastapi import Request
import csv
import io as _io
import stripe as _stripe


def _make_require_tier(db):
    async def require_tier(required: str, user: dict):
        info = await get_user_tier(db, user["id"])
        if not has_tier(info["tier"], required):
            raise HTTPException(
                status_code=402,
                detail=f"Questa funzione richiede il piano {required.capitalize()} o superiore. Il tuo piano attuale: {info['label']}.",
            )
        return info
    return require_tier

resend.api_key = os.environ.get("RESEND_API_KEY", "")
RESEND_FROM = os.environ.get("RESEND_FROM", "onboarding@resend.dev")
RESEND_REPLY_TO = os.environ.get("RESEND_REPLY_TO", "")


def now_iso():
    return datetime.now(timezone.utc).isoformat()


def build_router(db, get_current_user, telegram_bot):
    r = APIRouter(prefix="/api")
    require_tier = _make_require_tier(db)

    # ---------- Dashboard ----------
    @r.get("/dashboard/overview")
    async def dashboard_overview(user=Depends(get_current_user)):
        uid = user["id"]
        leads = await db.leads.count_documents({"user_id": uid})
        chats = await db.chat_threads.count_documents({"user_id": uid})
        plans = await db.business_plans.count_documents({"user_id": uid})
        funnels = await db.funnels.count_documents({"user_id": uid})
        recent_leads = await db.leads.find(
            {"user_id": uid}, {"_id": 0}
        ).sort("created_at", -1).limit(5).to_list(5)
        # Mock 14-day series
        import random
        random.seed(hash(uid) % 1000)
        series = [{"day": f"D{i+1}", "value": random.randint(40, 120)} for i in range(14)]
        return {
            "metrics": {
                "leads": leads,
                "chats": chats,
                "plans": plans,
                "funnels": funnels,
            },
            "series": series,
            "recent_leads": recent_leads,
        }

    # ---------- AI Web Research ----------
    class ResearchReq(BaseModel):
        query: str
        depth: str = "standard"  # quick | standard | deep

    @r.post("/research")
    async def research(req: ResearchReq, user=Depends(get_current_user)):
        sys = (
            "You are an elite market & business research analyst. Synthesize a structured, "
            "fact-grounded research brief in markdown with: Executive Summary, Key Insights "
            "(bulleted), Competitive Landscape, Risks, Opportunities, and Recommended Next "
            "Actions. Be concise, sharp, and decision-ready."
        )
        depth_hint = {"quick": "Keep under 250 words.", "deep": "Provide deep analysis ~700 words.", "standard": "~450 words."}
        text = await llm_complete(
            sys,
            f"{depth_hint.get(req.depth, '')}\nResearch topic: {req.query}",
            session_id=f"research-{user['id']}-{uuid.uuid4()}",
        )
        doc = {
            "id": str(uuid.uuid4()),
            "user_id": user["id"],
            "query": req.query,
            "depth": req.depth,
            "result": text,
            "created_at": now_iso(),
        }
        await db.research.insert_one(doc.copy())
        return {"id": doc["id"], "query": req.query, "result": text}

    @r.get("/research")
    async def list_research(user=Depends(get_current_user)):
        items = await db.research.find(
            {"user_id": user["id"]}, {"_id": 0}
        ).sort("created_at", -1).limit(50).to_list(50)
        return items

    # ---------- Business Plan ----------
    class BPReq(BaseModel):
        idea: str
        target_market: str = ""
        tone: str = "professional"

    BP_SECTIONS = [
        ("executive_summary", "Executive Summary"),
        ("problem", "Problem & Opportunity"),
        ("solution", "Proposed Solution"),
        ("market", "Market Analysis"),
        ("business_model", "Business Model"),
        ("go_to_market", "Go-to-Market Strategy"),
        ("competition", "Competitive Landscape"),
        ("financials", "Financial Projections"),
        ("team_ops", "Team & Operations"),
        ("risks", "Risks & Mitigation"),
    ]

    @r.post("/business-plan")
    async def gen_bp(req: BPReq, user=Depends(get_current_user)):
        plan_id = str(uuid.uuid4())
        user_text = f"Business idea: {req.idea}\nTarget market: {req.target_market or 'general'}"
        section_list = "\n".join(f"- {key}: {title}" for key, title in BP_SECTIONS)
        sys = (
            f"You are a senior strategy consultant writing a {req.tone} business plan. "
            f"Generate ALL of the following sections concisely (~80-100 words each, tight markdown). "
            f"Be concrete and specific. Output format: for EACH section, write "
            f"'===SECTION:<key>===' on its own line, then the markdown content, then a blank line.\n\n"
            f"Sections (in order):\n{section_list}"
        )
        try:
            raw = await asyncio.wait_for(
                llm_complete(
                    sys, user_text, session_id=f"bp-{plan_id}",
                    provider="anthropic", model="claude-haiku-4-5-20251001",
                ),
                timeout=45,
            )
        except Exception as exc:
            raise HTTPException(status_code=504, detail=f"LLM timeout: {exc.__class__.__name__}")

        sections = {}
        current_key = None
        current_buf = []
        for line in raw.splitlines():
            stripped = line.strip()
            if stripped.startswith("===SECTION:") and stripped.endswith("==="):
                if current_key is not None:
                    sections[current_key] = "\n".join(current_buf).strip()
                current_key = stripped.replace("===SECTION:", "").replace("===", "").strip()
                current_buf = []
            elif current_key is not None:
                current_buf.append(line)
        if current_key is not None:
            sections[current_key] = "\n".join(current_buf).strip()

        for k, t in BP_SECTIONS:
            if k not in sections or not sections[k]:
                sections[k] = f"## {t}\n\n_(Section not generated — please regenerate.)_"

        sections = {}
        current_key = None
        current_buf = []
        for line in raw.splitlines():
            stripped = line.strip()
            if stripped.startswith("===SECTION:") and stripped.endswith("==="):
                if current_key is not None:
                    sections[current_key] = "\n".join(current_buf).strip()
                current_key = stripped.replace("===SECTION:", "").replace("===", "").strip()
                current_buf = []
            elif current_key is not None:
                current_buf.append(line)
        if current_key is not None:
            sections[current_key] = "\n".join(current_buf).strip()

        for k, t in BP_SECTIONS:
            if k not in sections or not sections[k]:
                sections[k] = f"## {t}\n\n_(Section not generated — please regenerate.)_"
        doc = {
            "id": plan_id,
            "user_id": user["id"],
            "idea": req.idea,
            "target_market": req.target_market,
            "tone": req.tone,
            "sections": sections,
            "created_at": now_iso(),
        }
        await db.business_plans.insert_one(doc.copy())
        return {"id": plan_id, "sections": sections, "titles": dict(BP_SECTIONS)}

    @r.get("/business-plan")
    async def list_bp(user=Depends(get_current_user)):
        items = await db.business_plans.find(
            {"user_id": user["id"]}, {"_id": 0}
        ).sort("created_at", -1).to_list(50)
        return items

    @r.get("/business-plan/{plan_id}/pdf")
    async def bp_pdf(plan_id: str, user=Depends(get_current_user)):
        plan = await db.business_plans.find_one(
            {"id": plan_id, "user_id": user["id"]}, {"_id": 0}
        )
        if not plan:
            raise HTTPException(404, "Business plan not found")
        buf = io.BytesIO()
        doc_pdf = SimpleDocTemplate(
            buf, pagesize=A4, topMargin=2*cm, bottomMargin=2*cm,
            leftMargin=2*cm, rightMargin=2*cm,
        )
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            "TitleX", parent=styles["Title"], fontSize=24,
            textColor=HexColor("#0a0a0a"), spaceAfter=18,
        )
        h2 = ParagraphStyle(
            "H2X", parent=styles["Heading2"], fontSize=15,
            textColor=HexColor("#00838f"), spaceBefore=14, spaceAfter=8,
        )
        body = ParagraphStyle(
            "BodyX", parent=styles["BodyText"], fontSize=10.5,
            leading=15, spaceAfter=6,
        )
        meta = ParagraphStyle(
            "Meta", parent=styles["BodyText"], fontSize=9,
            textColor=HexColor("#666666"), spaceAfter=14,
        )
        flow = []
        flow.append(Paragraph("Aethersy AI &middot; Business Plan", title_style))
        flow.append(Paragraph(f"<b>Idea:</b> {plan.get('idea','')}", body))
        flow.append(Paragraph(f"<b>Target market:</b> {plan.get('target_market') or 'general'}", body))
        flow.append(Paragraph(
            f"Generated by Lara &middot; {plan.get('created_at','')[:10]}", meta
        ))
        for key, title in BP_SECTIONS:
            content = plan.get("sections", {}).get(key, "").strip()
            flow.append(Paragraph(title, h2))
            for para in content.split("\n\n"):
                if para.strip():
                    safe = para.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
                    flow.append(Paragraph(safe.replace("\n", "<br/>"), body))
            flow.append(Spacer(1, 0.3*cm))
        doc_pdf.build(flow)
        buf.seek(0)
        return StreamingResponse(
            buf,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=business-plan-{plan_id[:8]}.pdf"},
        )

    # ---------- Smart Chat (persistent memory) ----------
    class ChatThreadCreate(BaseModel):
        title: str = "New Chat"

    class ChatSendReq(BaseModel):
        thread_id: str
        text: str

    @r.get("/chat/threads")
    async def list_threads(user=Depends(get_current_user)):
        return await db.chat_threads.find(
            {"user_id": user["id"]}, {"_id": 0}
        ).sort("updated_at", -1).to_list(100)

    @r.post("/chat/threads")
    async def create_thread(req: ChatThreadCreate, user=Depends(get_current_user)):
        doc = {
            "id": str(uuid.uuid4()),
            "user_id": user["id"],
            "title": req.title,
            "created_at": now_iso(),
            "updated_at": now_iso(),
        }
        await db.chat_threads.insert_one(doc.copy())
        return doc

    @r.delete("/chat/threads/{thread_id}")
    async def delete_thread(thread_id: str, user=Depends(get_current_user)):
        await db.chat_threads.delete_one({"id": thread_id, "user_id": user["id"]})
        await db.chat_messages.delete_many({"thread_id": thread_id})
        return {"ok": True}

    @r.get("/chat/threads/{thread_id}/messages")
    async def list_messages(thread_id: str, user=Depends(get_current_user)):
        thread = await db.chat_threads.find_one({"id": thread_id, "user_id": user["id"]}, {"_id": 0})
        if not thread:
            raise HTTPException(404, "Thread not found")
        msgs = await db.chat_messages.find(
            {"thread_id": thread_id}, {"_id": 0}
        ).sort("ts", 1).to_list(1000)
        return msgs

    @r.post("/chat/send")
    async def chat_send(req: ChatSendReq, user=Depends(get_current_user)):
        thread = await db.chat_threads.find_one({"id": req.thread_id, "user_id": user["id"]}, {"_id": 0})
        if not thread:
            raise HTTPException(404, "Thread not found")
        history_docs = await db.chat_messages.find(
            {"thread_id": req.thread_id}, {"_id": 0}
        ).sort("ts", 1).to_list(1000)
        history = [{"role": m["role"], "content": m["text"]} for m in history_docs]

        user_msg = {
            "id": str(uuid.uuid4()),
            "thread_id": req.thread_id,
            "role": "user",
            "text": req.text,
            "ts": now_iso(),
        }
        await db.chat_messages.insert_one(user_msg.copy())

        # Persistent memory + RAG retrieval
        memory = await get_memory(db, user["id"])
        kb_chunks = await kb_search(db, user["id"], req.text, k=4)
        kb_context = format_context(kb_chunks)

        sys_parts = []
        if thread.get("agent_system_prompt"):
            sys_parts.append(thread["agent_system_prompt"])
        else:
            sys_parts.append(
                "You are Lara — Aethersy AI's Smart Chat persona. You're a strategic, witty, and sharp "
                "co-founder for the user. Use markdown when helpful. Match the user's language "
                "(Italian if they write Italian)."
            )
        if memory:
            sys_parts.append(f"\n--- Long-term memory about this user ---\n{memory}\n--- End memory ---")
        if kb_context:
            sys_parts.append(
                f"\n--- Relevant knowledge base excerpts (cite when used) ---\n{kb_context}\n--- End KB ---"
            )
        sys = "\n".join(sys_parts)

        ai_text = await llm_chat_with_history(
            sys, history, req.text, session_id=f"chat-{req.thread_id}"
        )
        ai_msg = {
            "id": str(uuid.uuid4()),
            "thread_id": req.thread_id,
            "role": "assistant",
            "text": ai_text,
            "ts": now_iso(),
        }
        await db.chat_messages.insert_one(ai_msg.copy())
        await db.chat_threads.update_one(
            {"id": req.thread_id},
            {"$set": {"updated_at": now_iso()}},
        )

        # Update long-term memory every 6 user messages
        total_msgs = len(history) + 2
        if total_msgs % 12 == 0:
            try:
                summary_prompt = (
                    "Summarize the most important durable facts about THIS user from the conversation: "
                    "their name (if shared), business, goals, preferences, current projects, decisions. "
                    "Output 5-10 concise bullet points. No fluff. If a previous memory exists, merge it "
                    "with new info, removing outdated facts."
                )
                conv_recap = "\n".join(f"{m['role']}: {m['content'][:300]}" for m in history[-12:])
                prev = f"\n\nPrevious memory:\n{memory}" if memory else ""
                new_mem = await llm_complete(
                    summary_prompt,
                    f"Conversation:\n{conv_recap}{prev}",
                    session_id=f"mem-{user['id']}",
                )
                await update_memory(db, user["id"], new_mem.strip()[:2000])
            except Exception:
                pass

        return {"user": user_msg, "assistant": ai_msg, "kb_used": len(kb_chunks)}

    # ---------- Code Generator ----------
    class CodeReq(BaseModel):
        prompt: str
        language: str = "python"

    @r.post("/code/generate")
    async def code_gen(req: CodeReq, user=Depends(get_current_user)):
        sys = (
            f"You are an elite {req.language} engineer. Output ONLY a clean, runnable code "
            f"block in {req.language}. No prose before or after. Include short inline comments. "
            f"Wrap in triple backticks with the language tag."
        )
        text = await llm_complete(
            sys, req.prompt,
            session_id=f"code-{user['id']}-{uuid.uuid4()}",
        )
        doc = {
            "id": str(uuid.uuid4()),
            "user_id": user["id"],
            "prompt": req.prompt,
            "language": req.language,
            "code": text,
            "created_at": now_iso(),
        }
        await db.code_snippets.insert_one(doc.copy())
        return {"id": doc["id"], "code": text, "language": req.language}

    @r.get("/code")
    async def list_code(user=Depends(get_current_user)):
        return await db.code_snippets.find(
            {"user_id": user["id"]}, {"_id": 0}
        ).sort("created_at", -1).limit(50).to_list(50)

    # ---------- CRM ----------
    class LeadIn(BaseModel):
        name: str
        email: Optional[str] = ""
        company: Optional[str] = ""
        phone: Optional[str] = ""
        stage: str = "new"  # new | contacted | qualified | proposal | won | lost
        value: float = 0
        notes: Optional[str] = ""

    class LeadUpdate(BaseModel):
        name: Optional[str] = None
        email: Optional[str] = None
        company: Optional[str] = None
        phone: Optional[str] = None
        stage: Optional[str] = None
        value: Optional[float] = None
        notes: Optional[str] = None

    @r.post("/crm/leads")
    async def create_lead(payload: LeadIn, user=Depends(get_current_user)):
        await require_tier("business", user)
        doc = payload.model_dump()
        doc["id"] = str(uuid.uuid4())
        doc["user_id"] = user["id"]
        doc["created_at"] = now_iso()
        doc["updated_at"] = now_iso()
        await db.leads.insert_one(doc.copy())
        doc.pop("_id", None)
        return doc

    @r.get("/crm/leads")
    async def list_leads(user=Depends(get_current_user)):
        return await db.leads.find(
            {"user_id": user["id"]}, {"_id": 0}
        ).sort("created_at", -1).to_list(500)

    @r.patch("/crm/leads/{lead_id}")
    async def update_lead(lead_id: str, payload: LeadUpdate, user=Depends(get_current_user)):
        update = {k: v for k, v in payload.model_dump().items() if v is not None}
        update["updated_at"] = now_iso()
        result = await db.leads.update_one(
            {"id": lead_id, "user_id": user["id"]}, {"$set": update}
        )
        if result.matched_count == 0:
            raise HTTPException(404, "Lead not found")
        doc = await db.leads.find_one({"id": lead_id}, {"_id": 0})
        return doc

    @r.delete("/crm/leads/{lead_id}")
    async def delete_lead(lead_id: str, user=Depends(get_current_user)):
        await db.leads.delete_one({"id": lead_id, "user_id": user["id"]})
        return {"ok": True}

    # ---------- Finance / Crypto (CoinGecko) ----------
    @r.get("/finance/markets")
    async def crypto_markets():
        async with httpx.AsyncClient(timeout=15) as c:
            resp = await c.get(
                "https://api.coingecko.com/api/v3/coins/markets",
                params={
                    "vs_currency": "usd",
                    "order": "market_cap_desc",
                    "per_page": 25,
                    "page": 1,
                    "sparkline": "true",
                    "price_change_percentage": "24h",
                },
            )
            if resp.status_code != 200:
                raise HTTPException(502, "CoinGecko unavailable")
            data = resp.json()
        return [
            {
                "id": x["id"],
                "symbol": x["symbol"].upper(),
                "name": x["name"],
                "image": x["image"],
                "price": x["current_price"],
                "change24h": x.get("price_change_percentage_24h") or 0,
                "market_cap": x.get("market_cap"),
                "sparkline": (x.get("sparkline_in_7d") or {}).get("price", []),
            }
            for x in data
        ]

    @r.get("/finance/coin/{coin_id}")
    async def coin_chart(coin_id: str, days: int = 7):
        async with httpx.AsyncClient(timeout=15) as c:
            resp = await c.get(
                f"https://api.coingecko.com/api/v3/coins/{coin_id}/market_chart",
                params={"vs_currency": "usd", "days": days},
            )
            if resp.status_code != 200:
                raise HTTPException(502, "CoinGecko unavailable")
            return resp.json()

    # ---------- Email Marketing AI ----------
    class EmailSeqReq(BaseModel):
        product: str
        audience: str
        steps: int = 5
        tone: str = "friendly-expert"

    @r.post("/email/sequences")
    async def gen_seq(req: EmailSeqReq, user=Depends(get_current_user)):
        await require_tier("pro", user)
        sys = (
            "You are a top-tier email marketing strategist. Generate a numbered cold-to-conversion "
            f"email sequence with EXACTLY {req.steps} emails. For each email return JSON-like "
            "markdown with: ## Email {n} — {Title}, then 'Subject:', 'Send delay:' (e.g. 'Day 0', 'Day 2'), "
            "and the body in 80-150 words. Focus on value, scarcity, social proof, CTA."
        )
        text = await llm_complete(
            sys,
            f"Product: {req.product}\nAudience: {req.audience}\nTone: {req.tone}",
            session_id=f"email-{user['id']}-{uuid.uuid4()}",
        )
        doc = {
            "id": str(uuid.uuid4()),
            "user_id": user["id"],
            "product": req.product,
            "audience": req.audience,
            "tone": req.tone,
            "steps": req.steps,
            "content": text,
            "status": "draft",
            "created_at": now_iso(),
        }
        await db.email_sequences.insert_one(doc.copy())
        doc.pop("_id", None)
        return doc

    @r.get("/email/sequences")
    async def list_seq(user=Depends(get_current_user)):
        return await db.email_sequences.find(
            {"user_id": user["id"]}, {"_id": 0}
        ).sort("created_at", -1).to_list(50)

    @r.delete("/email/sequences/{seq_id}")
    async def del_seq(seq_id: str, user=Depends(get_current_user)):
        await db.email_sequences.delete_one({"id": seq_id, "user_id": user["id"]})
        return {"ok": True}

    class EmailSendReq(BaseModel):
        to: EmailStr
        subject: str
        html: str
        sequence_id: Optional[str] = None

    @r.post("/email/send")
    async def send_email(payload: EmailSendReq, user=Depends(get_current_user)):
        await require_tier("pro", user)
        if not resend.api_key:
            raise HTTPException(500, "Resend not configured")
        try:
            params = {
                "from": f"Aethersy AI <{RESEND_FROM}>",
                "to": [payload.to],
                "subject": payload.subject,
                "html": payload.html,
            }
            if RESEND_REPLY_TO:
                params["reply_to"] = RESEND_REPLY_TO
            result = resend.Emails.send(params)
        except Exception as exc:
            raise HTTPException(502, f"Resend error: {exc}")
        await db.email_logs.insert_one({
            "id": str(uuid.uuid4()),
            "user_id": user["id"],
            "to": payload.to,
            "subject": payload.subject,
            "sequence_id": payload.sequence_id,
            "resend_id": result.get("id") if isinstance(result, dict) else str(result),
            "ts": now_iso(),
        })
        return {"ok": True, "id": result.get("id") if isinstance(result, dict) else str(result)}

    @r.get("/email/logs")
    async def email_logs(user=Depends(get_current_user)):
        return await db.email_logs.find(
            {"user_id": user["id"]}, {"_id": 0}
        ).sort("ts", -1).limit(50).to_list(50)

    # ---------- Funnel Builder ----------
    class FunnelStep(BaseModel):
        id: str
        type: str  # landing | optin | upsell | thankyou | email | webinar
        title: str
        description: str = ""

    class FunnelIn(BaseModel):
        name: str
        steps: List[FunnelStep] = []

    @r.get("/funnels")
    async def list_funnels(user=Depends(get_current_user)):
        return await db.funnels.find(
            {"user_id": user["id"]}, {"_id": 0}
        ).sort("updated_at", -1).to_list(100)

    @r.post("/funnels")
    async def create_funnel(payload: FunnelIn, user=Depends(get_current_user)):
        doc = payload.model_dump()
        doc["id"] = str(uuid.uuid4())
        doc["user_id"] = user["id"]
        doc["created_at"] = now_iso()
        doc["updated_at"] = now_iso()
        await db.funnels.insert_one(doc.copy())
        doc.pop("_id", None)
        return doc

    @r.put("/funnels/{funnel_id}")
    async def update_funnel(funnel_id: str, payload: FunnelIn, user=Depends(get_current_user)):
        update = payload.model_dump()
        update["updated_at"] = now_iso()
        result = await db.funnels.update_one(
            {"id": funnel_id, "user_id": user["id"]}, {"$set": update}
        )
        if result.matched_count == 0:
            raise HTTPException(404, "Funnel not found")
        return await db.funnels.find_one({"id": funnel_id}, {"_id": 0})

    @r.delete("/funnels/{funnel_id}")
    async def delete_funnel(funnel_id: str, user=Depends(get_current_user)):
        await db.funnels.delete_one({"id": funnel_id, "user_id": user["id"]})
        return {"ok": True}

    # ---------- Telegram ----------
    @r.get("/telegram/status")
    async def tg_status(user=Depends(get_current_user)):
        info = await telegram_bot.get_me()
        return {
            "running": telegram_bot.running,
            "info": info.get("result") if info.get("ok") else None,
            "ok": info.get("ok", False),
        }

    @r.get("/telegram/messages")
    async def tg_messages(user=Depends(get_current_user)):
        return await db.telegram_messages.find(
            {}, {"_id": 0}
        ).sort("ts", -1).limit(100).to_list(100)

    class TgSend(BaseModel):
        chat_id: int
        text: str

    @r.post("/telegram/send")
    async def tg_send(payload: TgSend, user=Depends(get_current_user)):
        try:
            await telegram_bot.send_message(payload.chat_id, payload.text)
        except Exception as exc:
            raise HTTPException(status_code=502, detail=f"Telegram send failed: {exc}")
        await db.telegram_messages.insert_one({
            "id": str(uuid.uuid4()),
            "direction": "out",
            "chat_id": payload.chat_id,
            "username": "operator",
            "text": payload.text,
            "ts": now_iso(),
        })
        return {"ok": True}

    # ---------- Knowledge Base / RAG ----------
    class KnowledgeTextIn(BaseModel):
        title: str
        content: str

    @r.get("/knowledge")
    async def kb_list(user=Depends(get_current_user)):
        return await list_documents(db, user["id"])

    @r.post("/knowledge")
    async def kb_create(payload: KnowledgeTextIn, user=Depends(get_current_user)):
        if not payload.content.strip():
            raise HTTPException(400, "Content is empty")
        return await add_document(db, user["id"], payload.title or "Untitled", payload.content, "manual")

    @r.post("/knowledge/upload")
    async def kb_upload(file: UploadFile = File(...), title: Optional[str] = Form(None), user=Depends(get_current_user)):
        raw = await file.read()
        try:
            text = raw.decode("utf-8", errors="ignore")
        except Exception:
            raise HTTPException(400, "Could not decode file as UTF-8")
        if not text.strip():
            raise HTTPException(400, "File is empty")
        ttl = title or file.filename or "Uploaded"
        return await add_document(db, user["id"], ttl, text, f"upload:{file.filename}")

    @r.delete("/knowledge/{doc_id}")
    async def kb_delete(doc_id: str, user=Depends(get_current_user)):
        deleted = await delete_document(db, user["id"], doc_id)
        return {"ok": True, "deleted_chunks": deleted}

    class KbSearchReq(BaseModel):
        query: str
        k: int = 4

    @r.post("/knowledge/search")
    async def kb_search_endpoint(payload: KbSearchReq, user=Depends(get_current_user)):
        results = await kb_search(db, user["id"], payload.query, payload.k)
        return {"results": results, "count": len(results)}

    @r.get("/memory")
    async def get_user_memory(user=Depends(get_current_user)):
        return {"summary": await get_memory(db, user["id"])}

    class MemoryUpdate(BaseModel):
        summary: str

    @r.put("/memory")
    async def put_user_memory(payload: MemoryUpdate, user=Depends(get_current_user)):
        await update_memory(db, user["id"], payload.summary[:2000])
        return {"ok": True}

    # ---------- Marketplace: AI Agents ----------
    AGENT_CATEGORIES = [
        {"id": "ai_agents", "label": "AI Agents", "icon": "🤖"},
        {"id": "rag", "label": "RAG Systems", "icon": "🧠"},
        {"id": "saas", "label": "SaaS App", "icon": "🚀"},
        {"id": "ecommerce", "label": "E-commerce", "icon": "🛒"},
        {"id": "marketing", "label": "Marketing", "icon": "📣"},
        {"id": "automation", "label": "Automazioni", "icon": "⚙️"},
        {"id": "api_backend", "label": "API & Backend", "icon": "🔌"},
        {"id": "landing", "label": "Landing Page", "icon": "🌐"},
        {"id": "chatbot", "label": "Chatbot", "icon": "💬"},
        {"id": "crm", "label": "CRM", "icon": "👥"},
        {"id": "dashboard", "label": "Dashboard", "icon": "📊"},
        {"id": "analytics", "label": "Analytics", "icon": "📈"},
        {"id": "scraping", "label": "Web Scraping", "icon": "🕷️"},
        {"id": "email", "label": "Email Marketing", "icon": "📧"},
        {"id": "content", "label": "Content AI", "icon": "✍️"},
        {"id": "finance", "label": "Finanza", "icon": "💰"},
        {"id": "real_estate", "label": "Immobiliare", "icon": "🏠"},
        {"id": "legal", "label": "Legale", "icon": "⚖️"},
        {"id": "hr", "label": "HR & Recruiting", "icon": "👔"},
        {"id": "seo", "label": "SEO Tools", "icon": "🔍"},
        {"id": "social", "label": "Social Media", "icon": "📱"},
        {"id": "education", "label": "Education", "icon": "🎓"},
        {"id": "healthcare", "label": "Healthcare", "icon": "🏥"},
        {"id": "productivity", "label": "Produttività", "icon": "⚡"},
        {"id": "blockchain", "label": "Blockchain", "icon": "🔗"},
    ]

    class AgentIn(BaseModel):
        name: str
        description: str = ""
        category: str
        system_prompt: str
        is_public: bool = True
        is_premium: bool = False
        price: float = 0
        tags: List[str] = []

    @r.get("/agents/categories")
    async def agent_categories():
        return AGENT_CATEGORIES

    @r.get("/agents")
    async def list_agents(category: Optional[str] = None, q: Optional[str] = None, mine: bool = False, user=Depends(get_current_user)):
        flt = {}
        if mine:
            flt["user_id"] = user["id"]
        else:
            flt["$or"] = [{"is_public": True}, {"user_id": user["id"]}]
        if category:
            flt["category"] = category
        if q:
            flt["name"] = {"$regex": q, "$options": "i"}
        return await db.agents.find(flt, {"_id": 0}).sort("created_at", -1).to_list(200)

    @r.post("/agents")
    async def create_agent(payload: AgentIn, user=Depends(get_current_user)):
        await require_tier("pro", user)
        if payload.category not in {c["id"] for c in AGENT_CATEGORIES}:
            raise HTTPException(400, "Invalid category")
        doc = payload.model_dump()
        doc["id"] = str(uuid.uuid4())
        doc["user_id"] = user["id"]
        doc["author_name"] = user.get("name", "Anon")
        doc["installs"] = 0
        doc["created_at"] = now_iso()
        doc["updated_at"] = now_iso()
        await db.agents.insert_one(doc.copy())
        doc.pop("_id", None)
        return doc

    @r.get("/agents/{agent_id}")
    async def get_agent(agent_id: str, user=Depends(get_current_user)):
        doc = await db.agents.find_one({"id": agent_id}, {"_id": 0})
        if not doc:
            raise HTTPException(404, "Agent not found")
        if not doc.get("is_public") and doc.get("user_id") != user["id"]:
            raise HTTPException(403, "Forbidden")
        return doc

    @r.put("/agents/{agent_id}")
    async def update_agent(agent_id: str, payload: AgentIn, user=Depends(get_current_user)):
        update = payload.model_dump()
        update["updated_at"] = now_iso()
        result = await db.agents.update_one(
            {"id": agent_id, "user_id": user["id"]}, {"$set": update}
        )
        if result.matched_count == 0:
            raise HTTPException(404, "Agent not found or not yours")
        return await db.agents.find_one({"id": agent_id}, {"_id": 0})

    @r.delete("/agents/{agent_id}")
    async def delete_agent(agent_id: str, user=Depends(get_current_user)):
        result = await db.agents.delete_one({"id": agent_id, "user_id": user["id"]})
        if result.deleted_count == 0:
            raise HTTPException(404, "Agent not found or not yours")
        return {"ok": True}

    @r.post("/agents/{agent_id}/install")
    async def install_agent(agent_id: str, request: Request, user=Depends(get_current_user)):
        agent = await db.agents.find_one({"id": agent_id}, {"_id": 0})
        if not agent:
            raise HTTPException(404, "Agent not found")
        if not agent.get("is_public") and agent.get("user_id") != user["id"]:
            raise HTTPException(403, "Forbidden")

        # If premium, check if user has paid for it OR is the author OR has Business+ plan
        if agent.get("is_premium") and agent.get("price", 0) > 0:
            tier_info = await get_user_tier(db, user["id"])
            already_paid = await db.agent_purchases.find_one(
                {"user_id": user["id"], "agent_id": agent_id, "payment_status": "paid"}
            )
            is_author = agent.get("user_id") == user["id"]
            is_business = has_tier(tier_info["tier"], "business")
            if not (already_paid or is_author or is_business):
                # Create Stripe checkout for premium agent
                origin = str(request.base_url).rstrip("/")
                from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionRequest
                sc = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=f"{origin}/api/webhook/stripe")
                req = CheckoutSessionRequest(
                    amount=float(agent["price"]),
                    currency="eur",
                    success_url=f"{origin}/marketplace?agent_paid={agent_id}",
                    cancel_url=f"{origin}/marketplace",
                    metadata={
                        "user_id": user["id"], "user_email": user["email"],
                        "agent_id": agent_id, "tier": "agent_purchase",
                        "source": "marketplace_premium",
                    },
                )
                session = await sc.create_checkout_session(req)
                await db.agent_purchases.insert_one({
                    "id": str(uuid.uuid4()),
                    "user_id": user["id"], "agent_id": agent_id,
                    "amount": float(agent["price"]), "currency": "eur",
                    "session_id": session.session_id, "payment_status": "initiated",
                    "ts": now_iso(),
                })
                return {"requires_payment": True, "checkout_url": session.url, "session_id": session.session_id, "price": agent["price"]}

        # Free or already paid → install immediately
        thread = {
            "id": str(uuid.uuid4()),
            "user_id": user["id"],
            "title": f"{agent['name']}",
            "agent_id": agent_id,
            "agent_system_prompt": agent["system_prompt"],
            "created_at": now_iso(),
            "updated_at": now_iso(),
        }
        await db.chat_threads.insert_one(thread.copy())
        await db.agents.update_one({"id": agent_id}, {"$inc": {"installs": 1}})
        thread.pop("_id", None)
        return thread

    # CSV bulk import (Pro+ users only)
    from fastapi import UploadFile as _UploadFile
    @r.post("/agents/import-csv")
    async def import_agents_csv(file: _UploadFile = File(...), user=Depends(get_current_user)):
        await require_tier("pro", user)
        raw = (await file.read()).decode("utf-8", errors="ignore")
        reader = csv.DictReader(_io.StringIO(raw))
        valid_cats = {c["id"] for c in AGENT_CATEGORIES}
        created = 0
        errors = []
        for i, row in enumerate(reader):
            try:
                cat = (row.get("category") or "").strip()
                if cat not in valid_cats:
                    errors.append(f"Row {i+2}: invalid category '{cat}'")
                    continue
                doc = {
                    "id": str(uuid.uuid4()), "user_id": user["id"],
                    "author_name": user.get("name", "Anon"),
                    "name": row.get("name", "Untitled").strip(),
                    "description": row.get("description", "").strip(),
                    "category": cat,
                    "system_prompt": row.get("system_prompt", "").strip(),
                    "is_public": str(row.get("is_public", "true")).lower() in ("true", "1", "yes", "si"),
                    "is_premium": str(row.get("is_premium", "false")).lower() in ("true", "1", "yes", "si"),
                    "price": float(row.get("price", 0) or 0),
                    "tags": [t.strip() for t in (row.get("tags", "") or "").split(",") if t.strip()],
                    "installs": 0, "avg_rating": 0, "reviews_count": 0,
                    "created_at": now_iso(), "updated_at": now_iso(),
                }
                if not doc["system_prompt"]:
                    errors.append(f"Row {i+2}: empty system_prompt")
                    continue
                await db.agents.insert_one(doc)
                created += 1
            except Exception as exc:
                errors.append(f"Row {i+2}: {exc}")
        return {"created": created, "errors": errors[:20]}

    # ---------- Copilot (terminal agent) ----------
    class CopilotReq(BaseModel):
        prompt: str

    @r.post("/copilot/run")
    async def copilot_endpoint(payload: CopilotReq, user=Depends(get_current_user)):
        await require_tier("pro", user)
        result = await copilot_run(db, user["id"], payload.prompt)
        # Persist run for history
        await db.copilot_runs.insert_one({
            "id": str(uuid.uuid4()),
            "user_id": user["id"],
            "prompt": payload.prompt,
            "answer": result.get("answer", ""),
            "trace": result.get("trace", []),
            "iterations": result.get("iterations", 0),
            "ts": now_iso(),
        })
        return result

    @r.get("/copilot/history")
    async def copilot_history(user=Depends(get_current_user)):
        return await db.copilot_runs.find(
            {"user_id": user["id"]}, {"_id": 0}
        ).sort("ts", -1).limit(30).to_list(30)

    # ---------- Marketplace: Reviews ----------
    class ReviewIn(BaseModel):
        rating: int = Field(ge=1, le=5)
        text: str = ""

    @r.get("/agents/{agent_id}/reviews")
    async def list_reviews(agent_id: str, user=Depends(get_current_user)):
        return await db.agent_reviews.find(
            {"agent_id": agent_id}, {"_id": 0}
        ).sort("ts", -1).limit(100).to_list(100)

    @r.post("/agents/{agent_id}/reviews")
    async def create_review(agent_id: str, payload: ReviewIn, user=Depends(get_current_user)):
        agent = await db.agents.find_one({"id": agent_id})
        if not agent:
            raise HTTPException(404, "Agent not found")
        # Upsert one review per (agent, user)
        await db.agent_reviews.update_one(
            {"agent_id": agent_id, "user_id": user["id"]},
            {"$set": {
                "id": str(uuid.uuid4()),
                "agent_id": agent_id,
                "user_id": user["id"],
                "author_name": user.get("name", "Anon"),
                "rating": payload.rating,
                "text": payload.text[:1000],
                "ts": now_iso(),
            }},
            upsert=True,
        )
        # Recompute aggregate
        cursor = db.agent_reviews.aggregate([
            {"$match": {"agent_id": agent_id}},
            {"$group": {"_id": None, "avg": {"$avg": "$rating"}, "count": {"$sum": 1}}},
        ])
        agg = await cursor.to_list(1)
        avg = round(agg[0]["avg"], 2) if agg else 0
        cnt = agg[0]["count"] if agg else 0
        await db.agents.update_one(
            {"id": agent_id},
            {"$set": {"avg_rating": avg, "reviews_count": cnt}},
        )
        return {"ok": True, "avg_rating": avg, "reviews_count": cnt}

    # ---------- Billing / Stripe ----------
    @r.get("/billing/tiers")
    async def billing_tiers():
        return list(TIERS.values())

    @r.get("/billing/me")
    async def billing_me(user=Depends(get_current_user)):
        return await get_user_tier(db, user["id"])

    class CheckoutReq(BaseModel):
        tier: str
        origin_url: str
        billing_cycle: str = "monthly"  # "monthly" or "yearly"

    @r.post("/billing/checkout")
    async def billing_checkout(payload: CheckoutReq, user=Depends(get_current_user)):
        if payload.tier == "free":
            await db.subscriptions.update_one(
                {"user_id": user["id"]},
                {"$set": {"user_id": user["id"], "tier": "free", "status": "active",
                          "billing_cycle": "monthly", "started_at": now_iso()}},
                upsert=True,
            )
            return {"free": True, "redirect": f"{payload.origin_url}/dashboard"}
        try:
            return await create_checkout(db, user, payload.tier, payload.origin_url, payload.billing_cycle)
        except Exception as exc:
            raise HTTPException(400, str(exc))

    @r.get("/billing/status/{session_id}")
    async def billing_status(session_id: str, request: Request, user=Depends(get_current_user)):
        origin = str(request.base_url).rstrip("/")
        try:
            return await get_status(db, session_id, origin)
        except Exception as exc:
            raise HTTPException(502, str(exc))

    @r.post("/billing/cancel")
    async def billing_cancel(user=Depends(get_current_user)):
        sub = await db.subscriptions.find_one({"user_id": user["id"], "status": "active"}, {"_id": 0})
        if not sub or sub.get("tier") == "free":
            raise HTTPException(400, "No active paid subscription")
        await db.subscriptions.update_one(
            {"user_id": user["id"]},
            {"$set": {"status": "cancelled", "cancelled_at": now_iso(), "tier": "free"}},
        )
        return {"ok": True, "new_tier": "free"}

    @r.post("/billing/portal")
    async def billing_portal(request: Request, user=Depends(get_current_user)):
        # Create Stripe billing portal session for users to manage payment methods
        try:
            _stripe.api_key = STRIPE_API_KEY
            sub = await db.subscriptions.find_one({"user_id": user["id"]}, {"_id": 0})
            if not sub or not sub.get("stripe_customer_id"):
                # Find from latest payment_transaction
                txn = await db.payment_transactions.find_one(
                    {"user_id": user["id"], "payment_status": "paid"},
                    sort=[("created_at", -1)],
                )
                if not txn:
                    raise HTTPException(400, "No previous payment found")
                # Best-effort: query Stripe by session_id to get customer
                session = _stripe.checkout.Session.retrieve(txn["session_id"])
                customer_id = session.get("customer")
                if customer_id and sub:
                    await db.subscriptions.update_one(
                        {"user_id": user["id"]},
                        {"$set": {"stripe_customer_id": customer_id}},
                    )
                if not customer_id:
                    raise HTTPException(400, "No Stripe customer linked")
            else:
                customer_id = sub["stripe_customer_id"]
            origin = str(request.base_url).rstrip("/")
            portal = _stripe.billing_portal.Session.create(
                customer=customer_id,
                return_url=f"{origin}/dashboard",
            )
            return {"url": portal.url}
        except _stripe.error.StripeError as exc:
            raise HTTPException(502, f"Stripe error: {exc}")

    @r.post("/onboarding/seed-demo")
    async def onboarding_seed(user=Depends(get_current_user)):
        return await seed_demo_for_user(db, user)

    # Telegram webhook (alternative to polling)
    @r.post("/telegram/webhook")
    async def tg_webhook(request: Request):
        update = await request.json()
        try:
            await telegram_bot._process_update(update)
        except Exception:
            import logging
            logging.exception("Telegram webhook error")
        return {"ok": True}

    return r
