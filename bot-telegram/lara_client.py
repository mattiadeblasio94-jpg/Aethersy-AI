"""
Lara Client per Aethersy Bot.
Gestisce chiamate a Lara API con fallback Groq.
"""

import logging
import time
from typing import Optional
from dataclasses import dataclass
import requests
from groq import Groq

from config import LARA_API_URL, LARA_API_KEY, GROQ_API_KEY, GROQ_API_KEY_2

logger = logging.getLogger("lara_client")

# System prompt Lara
LARA_SYSTEM_PROMPT = """Sei Lara, AI Agent senior di Aethersy.
Sei disponibile, simpatica e intelligente.
Conosci: startup, funding, scaling, marketing, sales, product development, go-to-market.
Sei REATTIVA, RIFLESSIVA, CONCRETA - dai sempre next action eseguibile.
Format: CONTESTO → INSIGHT → AZIONE → NEXT STEP"""


@dataclass
class LaraResponse:
    content: str
    source: str  # "lara_api" | "groq" | "error"
    tokens_used: Optional[int] = None
    duration_ms: Optional[int] = None


class LaraClient:
    """Client per Lara API con fallback a Groq."""

    def __init__(self):
        self.lara_url = LARA_API_URL
        self.lara_key = LARA_API_KEY
        self.groq_key = GROQ_API_KEY or GROQ_API_KEY_2
        self.groq_client = Groq(api_key=self.groq_key) if self.groq_key else None
        logger.info(f"LaraClient init - API: {bool(self.lara_url)}, Groq: {bool(self.groq_client)}")

    def chat(
        self,
        message: str,
        user_id: str,
        session_id: str,
        platform: str = "telegram",
    ) -> LaraResponse:
        """
        Invia messaggio a Lara. Prova prima Lara API, poi Groq.
        """
        start = time.time()

        # Tentativo 1: Lara API
        try:
            response = self._call_lara_api(message, user_id, session_id, platform)
            if response:
                duration = int((time.time() - start) * 1000)
                return LaraResponse(
                    content=response,
                    source="lara_api",
                    duration_ms=duration,
                )
        except Exception as e:
            logger.warning(f"Lara API failed: {e}")

        # Tentativo 2: Groq fallback
        try:
            response = self._call_groq(message)
            duration = int((time.time() - start) * 1000)
            return LaraResponse(
                content=response,
                source="groq",
                duration_ms=duration,
            )
        except Exception as e:
            logger.error(f"Groq also failed: {e}")

        return LaraResponse(
            content="❌ Errore: tutti i provider AI non disponibili.",
            source="error",
        )

    def _call_lara_api(
        self,
        message: str,
        user_id: str,
        session_id: str,
        platform: str,
    ) -> Optional[str]:
        """Chiama Lara API su Vercel/server."""
        if not self.lara_url:
            return None

        headers = {"Content-Type": "application/json"}
        if self.lara_key:
            headers["Authorization"] = f"Bearer {self.lara_key}"

        payload = {
            "message": message,
            "userId": user_id,
            "sessionId": session_id,
            "platform": platform,
        }

        response = requests.post(
            f"{self.lara_url}/chat",
            headers=headers,
            json=payload,
            timeout=30,
        )

        if response.status_code == 200:
            data = response.json()
            return data.get("response")

        logger.warning(f"Lara API status: {response.status_code}")
        return None

    def _call_groq(self, message: str) -> str:
        """Fallback su Groq."""
        if not self.groq_client:
            raise RuntimeError("No Groq API key")

        MODELS = [
            "llama-3.3-70b-versatile",
            "llama-3.2-90b-vision-preview",
            "mixtral-8x7b-32768",
        ]

        for model in MODELS:
            try:
                resp = self.groq_client.chat.completions.create(
                    model=model,
                    messages=[
                        {"role": "system", "content": LARA_SYSTEM_PROMPT},
                        {"role": "user", "content": message},
                    ],
                    temperature=0.7,
                    max_tokens=1024,
                    timeout=30,
                )
                return resp.choices[0].message.content

            except Exception as e:
                logger.warning(f"Model {model} failed: {e}")
                continue

        raise RuntimeError("All Groq models failed")

    def chat_with_context(
        self,
        message: str,
        user_id: str,
        session_id: str,
        context: str,
        platform: str = "telegram",
    ) -> LaraResponse:
        """
        Variante con contesto (per memoria conversazione).
        """
        full_message = f"{context}\n\nUTENTE: {message}"
        return self.chat(full_message, user_id, session_id, platform)


# Istanza globale
lara_client = LaraClient()