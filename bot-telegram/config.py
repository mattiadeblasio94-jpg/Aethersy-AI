"""
Configurazione Aethersy Bot.
Tutte le env vars e costanti in un posto solo.
"""

import os
import logging
from pathlib import Path

# Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)

# Paths
BASE_DIR = Path(__file__).parent
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(exist_ok=True)

# Telegram
BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "8172610054:AAELb8rkIn9hWk15aKvxQB-gqoTuHeq1SiM")
ADMIN_ID = int(os.getenv("TELEGRAM_ADMIN_ID", "8074643162"))

# Lara API
LARA_API_URL = os.getenv("LARA_API_URL", "http://47.87.134.105:3000/api/lara")
LARA_API_KEY = os.getenv("LARA_API_KEY", "")

# Supabase (per tracking)
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://yerpkwzodfedjuslqyts.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

# Groq (fallback)
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_API_KEY_2 = os.getenv("GROQ_API_KEY_2", "")

# Memory
MEMORY_DIR = os.getenv("MEMORY_DIR", "/root/bot-memory")

# Piani utente
PLAN_LIMITS = {
    "free": {"daily_messages": 100, "daily_searches": 10},
    "pro": {"daily_messages": 1000, "daily_searches": 1000},
    "business": {"daily_messages": 10000, "daily_searches": 10000},
    "enterprise": {"daily_messages": -1, "daily_searches": -1},
}

# Custom pacchetti
CUSTOM_PACKAGES = {
    "vip": {"daily_messages": 500, "daily_searches": 500},
    "trial": {"daily_messages": 50, "daily_searches": 10},
}

# Accesso libero su Telegram
ALLOW_ALL_USERS = True

logger = logging.getLogger("config")
logger.info(f"Config loaded - Admin ID: {ADMIN_ID}")