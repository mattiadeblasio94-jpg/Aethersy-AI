"""Stripe billing for Aethersy AI: 4 tiers (Free, Pro 29, Business 99, Enterprise 299)."""
import os
import uuid
import stripe
from datetime import datetime, timezone
from typing import Optional

STRIPE_API_KEY = os.environ.get("STRIPE_API_KEY", "sk_test_emergent")
stripe.api_key = STRIPE_API_KEY

# Server-side fixed packages — NEVER trust the frontend for prices
TIERS = {
    "free": {"id": "free", "label": "Free", "amount": 0.0, "amount_yearly": 0.0, "currency": "eur", "features": [
        "5 ricerche/giorno", "10 chat AI/giorno", "Generatore codice base", "50 template terminale", "Accesso dashboard",
    ]},
    "pro": {"id": "pro", "label": "Pro", "amount": 29.00, "amount_yearly": 278.40, "currency": "eur", "features": [
        "Ricerche illimitate", "Chat AI illimitata", "Email marketing AI", "Funnel builder",
        "Cervello AI 1 GB", "200+ template terminale", "Bot Telegram", "Supporto prioritario",
    ]},
    "business": {"id": "business", "label": "Business", "amount": 99.00, "amount_yearly": 950.40, "currency": "eur", "features": [
        "Tutto di Pro", "Generatore contratti AI", "CRM & Lead management", "Automazioni avanzate",
        "Cervello AI 10 GB", "Template illimitati", "SEO & Content AI", "Analytics avanzate", "API access", "Team 5 utenti",
    ]},
    "enterprise": {"id": "enterprise", "label": "Enterprise", "amount": 299.00, "amount_yearly": 2870.40, "currency": "eur", "features": [
        "Tutto di Business", "AI autonoma 24/7", "Integrazione Gmail/Outlook", "White-label",
        "Cervello AI 100 GB", "Team illimitato", "SLA 99.9%", "Onboarding dedicato", "Account manager", "Custom AI training",
    ]},
}

# Tier hierarchy for gating
TIER_RANK = {"free": 0, "pro": 1, "business": 2, "enterprise": 3}


def _now():
    return datetime.now(timezone.utc).isoformat()


def get_tier(tier_id: str):
    return TIERS.get(tier_id)


async def get_user_tier(db, user_id: str) -> dict:
    sub = await db.subscriptions.find_one({"user_id": user_id, "status": "active"}, {"_id": 0})
    tier_id = (sub or {}).get("tier", "free")
    return {"tier": tier_id, "label": TIERS[tier_id]["label"], "since": (sub or {}).get("started_at"), "billing_cycle": (sub or {}).get("billing_cycle", "monthly")}


def has_tier(current: str, required: str) -> bool:
    """Check if current tier is >= required tier."""
    return TIER_RANK.get(current, 0) >= TIER_RANK.get(required, 0)


async def create_checkout(db, user: dict, tier_id: str, origin: str, billing_cycle: str = "monthly") -> dict:
    tier = TIERS.get(tier_id)
    if not tier or tier["amount"] <= 0:
        raise ValueError("Invalid paid tier")

    amount = tier["amount_yearly"] if billing_cycle == "yearly" else tier["amount"]
    price_data = {
        "currency": tier["currency"],
        "unit_amount": int(amount * 100),
        "product_data": {"name": f"Aethersy AI - {tier['label']}"},
    }
    if billing_cycle == "yearly":
        price_data["recurring"] = {"interval": "year"}
    else:
        price_data["recurring"] = {"interval": "month"}

    success_url = f"{origin}/billing/return?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{origin}/pricing"

    session = stripe.checkout.Session.create(
        payment_method_types=["card"],
        line_items=[{"price_data": price_data, "quantity": 1}],
        mode="subscription" if billing_cycle != "one-time" else "payment",
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={
            "user_id": user["id"],
            "user_email": user["email"],
            "tier": tier_id,
            "billing_cycle": billing_cycle,
            "source": "aethersy_pricing",
        },
    )

    await db.payment_transactions.insert_one({
        "id": str(uuid.uuid4()),
        "session_id": session.id,
        "user_id": user["id"],
        "user_email": user["email"],
        "tier": tier_id,
        "billing_cycle": billing_cycle,
        "amount": float(amount),
        "currency": tier["currency"],
        "payment_status": "initiated",
        "status": "pending",
        "created_at": _now(),
    })

    return {"session_id": session.id, "url": session.url}


async def get_status(db, session_id: str, origin: str) -> dict:
    session = stripe.checkout.Session.retrieve(session_id)

    txn = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
    if not txn:
        return {"status": session.status, "payment_status": "paid" if session.payment_status == "paid" else "pending"}

    # Only update + activate sub once per session_id (idempotent)
    if session.payment_status == "paid" and txn.get("payment_status") != "paid":
        await db.payment_transactions.update_one(
            {"session_id": session_id},
            {"$set": {"payment_status": "paid", "status": session.status, "paid_at": _now()}},
        )
        # Activate subscription
        await db.subscriptions.update_one(
            {"user_id": txn["user_id"]},
            {"$set": {
                "user_id": txn["user_id"],
                "tier": txn["tier"],
                "status": "active",
                "started_at": _now(),
                "amount": txn["amount"],
                "currency": txn["currency"],
                "session_id": session_id,
            }},
            upsert=True,
        )
    elif session.status == "expired" and txn.get("status") != "expired":
        await db.payment_transactions.update_one(
            {"session_id": session_id},
            {"$set": {"status": "expired"}},
        )

    return {
        "status": session.status,
        "payment_status": "paid" if session.payment_status == "paid" else "pending",
        "tier": txn.get("tier"),
        "amount": session.amount_total / 100 if session.amount_total else 0,
        "currency": session.currency,
    }


async def handle_stripe_webhook(db, body: bytes, signature: str, origin: str) -> dict:
    webhook_secret = os.environ.get("STRIPE_WEBHOOK_SECRET", "")
    try:
        event = stripe.Webhook.construct_event(body, signature, webhook_secret)
    except (ValueError, stripe.error.SignatureVerificationError) as e:
        raise ValueError(f"Invalid webhook: {e}")

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        meta = session.get("metadata", {})
        user_id = meta.get("user_id")
        tier = meta.get("tier")
        if user_id and tier:
            txn = await db.payment_transactions.find_one({"session_id": session.id})
            if txn and txn.get("payment_status") != "paid":
                await db.payment_transactions.update_one(
                    {"session_id": session.id},
                    {"$set": {"payment_status": "paid", "paid_at": _now()}},
                )
                await db.subscriptions.update_one(
                    {"user_id": user_id},
                    {"$set": {
                        "user_id": user_id, "tier": tier, "status": "active",
                        "started_at": _now(), "session_id": session.id,
                    }},
                    upsert=True,
                )

    return {"event_type": event["type"], "processed": True}
