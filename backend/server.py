"""AI Entrepreneurship 360 — main FastAPI app."""
import os
import logging
from pathlib import Path
from fastapi import FastAPI
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient

ROOT = Path(__file__).parent
load_dotenv(ROOT / ".env")

from auth import register_auth_routes
from routes import build_router
from telegram_bot import TelegramBot
from knowledge import ensure_indexes
from seed_data import seed_agents, seed_demo_user

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("server")

mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

app = FastAPI(title="Aethersy AI")

# Stripe webhook MUST be added at the app level (no auth, raw body)
from fastapi import Request
from billing import handle_stripe_webhook


@app.post("/api/webhook/stripe")
async def stripe_webhook(request: Request):
    body = await request.body()
    sig = request.headers.get("Stripe-Signature", "")
    origin = str(request.base_url).rstrip("/")
    try:
        return await handle_stripe_webhook(db, body, sig, origin)
    except Exception as exc:
        logger.exception("Stripe webhook failed")
        return {"error": str(exc)}

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Auth + dependencies
auth_router, get_current_user = register_auth_routes(db)

# Telegram bot
tg_bot = TelegramBot(db)

# Feature router
feature_router = build_router(db, get_current_user, tg_bot)

app.include_router(auth_router)
app.include_router(feature_router)


@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "aethersy-ai", "assistant": "Lara"}


@app.on_event("startup")
async def on_startup():
    logger.info("Starting Aethersy AI backend (Lara persona)")
    await ensure_indexes(db)
    seeded = await seed_agents(db)
    logger.info(f"Marketplace agents seeded: {seeded}")
    if await seed_demo_user(db):
        logger.info("Demo user demo@e360.com created")
    await tg_bot.start()


@app.on_event("shutdown")
async def on_shutdown():
    await tg_bot.stop()
    client.close()
