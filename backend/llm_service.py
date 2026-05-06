"""LLM service wrapper using Ollama locally."""
import os
import httpx
from typing import List, Optional

OLLAMA_URL = os.environ.get("OLLAMA_URL", "http://localhost:11434")
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")
GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")

# Default model bindings - Ollama local
DEFAULT_CHAT = ("ollama", "qwen2.5:0.5b")
FAST_MODEL = ("ollama", "qwen2.5:0.5b")


async def llm_complete(
    system_message: str,
    user_text: str,
    session_id: str,
    provider: str = DEFAULT_CHAT[0],
    model: str = DEFAULT_CHAT[1],
) -> str:
    """One-shot completion. Caller manages persistence/history."""
    if provider == "ollama":
        return await _ollama_complete(system_message, user_text, model)
    elif provider == "openai":
        return await _openai_complete(system_message, user_text, model)
    elif provider == "groq":
        return await _groq_complete(system_message, user_text, model)
    elif provider == "gemini":
        return await _gemini_complete(system_message, user_text, model)
    else:
        raise ValueError(f"Unknown provider: {provider}")


async def _openai_complete(system_message: str, user_text: str, model: str) -> str:
    """Call OpenAI API directly."""
    api_key = OPENAI_API_KEY
    if not api_key:
        raise RuntimeError("No OpenAI API key configured")

    async with httpx.AsyncClient(timeout=60.0) as client:
        resp = await client.post(
            "https://api.openai.com/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "content-type": "application/json",
            },
            json={
                "model": model or "gpt-4o",
                "messages": [
                    {"role": "system", "content": system_message},
                    {"role": "user", "content": user_text},
                ],
                "temperature": 0.7,
                "max_tokens": 4096,
            },
        )
        resp.raise_for_status()
        data = resp.json()
        return data["choices"][0]["message"]["content"]


async def _groq_complete(system_message: str, user_text: str, model: str) -> str:
    """Call Groq API directly."""
    api_key = GROQ_API_KEY
    if not api_key:
        raise RuntimeError("No Groq API key configured")

    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "content-type": "application/json",
            },
            json={
                "model": model or "llama-3.3-70b-versatile",
                "messages": [
                    {"role": "system", "content": system_message},
                    {"role": "user", "content": user_text},
                ],
                "temperature": 0.7,
                "max_tokens": 4096,
            },
        )
        resp.raise_for_status()
        data = resp.json()
        return data["choices"][0]["message"]["content"]


async def _gemini_complete(system_message: str, user_text: str, model: str) -> str:
    """Call Google Gemini API directly."""
    api_key = os.environ.get("GEMINI_API_KEY", "")
    if not api_key:
        raise RuntimeError("No Gemini API key configured")

    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(
            f"https://generativelanguage.googleapis.com/v1beta/models/{model or 'gemini-2.0-flash'}:generateContent?key={api_key}",
            headers={"content-type": "application/json"},
            json={
                "contents": [{"parts": [{"text": f"{system_message}\n\nUser: {user_text}"}]}],
            },
        )
        resp.raise_for_status()
        data = resp.json()
        return data["candidates"][0]["content"]["parts"][0]["text"]


async def _ollama_complete(system_message: str, user_text: str, model: str) -> str:
    """Call Ollama API locally."""
    async with httpx.AsyncClient(timeout=120.0) as client:
        resp = await client.post(
            f"{OLLAMA_URL}/api/chat",
            json={
                "model": model,
                "messages": [
                    {"role": "system", "content": system_message},
                    {"role": "user", "content": user_text},
                ],
                "stream": False,
            },
        )
        resp.raise_for_status()
        data = resp.json()
        return data["message"]["content"]


async def _ollama_chat_with_history(
    system_message: str,
    history: list,
    user_text: str,
    model: str,
) -> str:
    """Ollama chat with conversation history."""
    messages = [{"role": "system", "content": system_message}]
    for msg in history[-20:]:
        role = "user" if msg.get("role") == "user" else "assistant"
        messages.append({"role": role, "content": msg.get("content", "")})
    messages.append({"role": "user", "content": user_text})

    async with httpx.AsyncClient(timeout=120.0) as client:
        resp = await client.post(
            f"{OLLAMA_URL}/api/chat",
            json={
                "model": model,
                "messages": messages,
                "stream": False,
            },
        )
        resp.raise_for_status()
        data = resp.json()
        return data["message"]["content"]


async def llm_chat_with_history(
    system_message: str,
    history: list,
    user_text: str,
    session_id: str,
    provider: str = DEFAULT_CHAT[0],
    model: str = DEFAULT_CHAT[1],
) -> str:
    """Chat with history."""
    if provider == "ollama":
        return await _ollama_chat_with_history(system_message, history, user_text, model)
    elif provider == "openai":
        return await _openai_chat_with_history(system_message, history, user_text, model)
    elif provider == "groq":
        return await _groq_chat_with_history(system_message, history, user_text, model)
    else:
        raise ValueError(f"Unknown provider: {provider}")


async def _openai_chat_with_history(
    system_message: str,
    history: list,
    user_text: str,
    model: str,
) -> str:
    """OpenAI chat with conversation history."""
    api_key = OPENAI_API_KEY
    if not api_key:
        raise RuntimeError("No OpenAI API key configured")

    messages = [{"role": "system", "content": system_message}]
    for msg in history[-20:]:
        role = "user" if msg.get("role") == "user" else "assistant"
        messages.append({"role": role, "content": msg.get("content", "")})
    messages.append({"role": "user", "content": user_text})

    async with httpx.AsyncClient(timeout=60.0) as client:
        resp = await client.post(
            "https://api.openai.com/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "content-type": "application/json",
            },
            json={
                "model": model or "gpt-4o",
                "messages": messages,
                "temperature": 0.7,
                "max_tokens": 4096,
            },
        )
        resp.raise_for_status()
        data = resp.json()
        return data["choices"][0]["message"]["content"]


async def _groq_chat_with_history(
    system_message: str,
    history: list,
    user_text: str,
    model: str,
) -> str:
    """Groq chat with conversation history."""
    api_key = GROQ_API_KEY
    if not api_key:
        raise RuntimeError("No Groq API key configured")

    messages = [{"role": "system", "content": system_message}]
    for msg in history[-20:]:
        role = "user" if msg.get("role") == "user" else "assistant"
        messages.append({"role": role, "content": msg.get("content", "")})
    messages.append({"role": "user", "content": user_text})

    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "content-type": "application/json",
            },
            json={
                "model": model or "llama-3.3-70b-versatile",
                "messages": messages,
                "temperature": 0.7,
                "max_tokens": 4096,
            },
        )
        resp.raise_for_status()
        data = resp.json()
        return data["choices"][0]["message"]["content"]
