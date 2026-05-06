"""Knowledge base + persistent memory for Lara.

Uses Mongo text search (free, no embeddings needed) as the retrieval backend.
Upgrade path: drop in OpenAI text-embedding-3-small + Mongo Atlas Vector Search.
"""
import re
import uuid
from datetime import datetime, timezone
from typing import List, Optional


def _now():
    return datetime.now(timezone.utc).isoformat()


def chunk_text(text: str, max_chars: int = 1200) -> List[str]:
    """Split text into chunks of ~max_chars, preferring paragraph boundaries."""
    paragraphs = re.split(r"\n\s*\n", text.strip())
    chunks = []
    buf = []
    buf_len = 0
    for p in paragraphs:
        p = p.strip()
        if not p:
            continue
        if buf_len + len(p) + 2 > max_chars and buf:
            chunks.append("\n\n".join(buf))
            buf = [p]
            buf_len = len(p)
        else:
            buf.append(p)
            buf_len += len(p) + 2
    if buf:
        chunks.append("\n\n".join(buf))
    # Hard-split anything still too big
    final = []
    for c in chunks:
        if len(c) <= max_chars:
            final.append(c)
        else:
            for i in range(0, len(c), max_chars):
                final.append(c[i:i + max_chars])
    return [c for c in final if c.strip()]


async def ensure_indexes(db):
    """Create text index on knowledge_chunks for Mongo $text search."""
    try:
        await db.knowledge_chunks.create_index(
            [("text", "text"), ("title", "text")],
            name="kb_text_idx",
            default_language="english",
        )
    except Exception:
        pass


async def add_document(db, user_id: str, title: str, content: str, source: str = "upload") -> dict:
    doc_id = str(uuid.uuid4())
    chunks = chunk_text(content)
    chunk_docs = []
    for i, c in enumerate(chunks):
        chunk_docs.append({
            "id": str(uuid.uuid4()),
            "doc_id": doc_id,
            "user_id": user_id,
            "title": title,
            "text": c,
            "ordinal": i,
            "ts": _now(),
        })
    if chunk_docs:
        await db.knowledge_chunks.insert_many(chunk_docs)
    meta = {
        "id": doc_id,
        "user_id": user_id,
        "title": title,
        "source": source,
        "chars": len(content),
        "chunks": len(chunks),
        "ts": _now(),
    }
    await db.knowledge_docs.insert_one(meta.copy())
    meta.pop("_id", None)
    return meta


async def list_documents(db, user_id: str) -> List[dict]:
    return await db.knowledge_docs.find(
        {"user_id": user_id}, {"_id": 0}
    ).sort("ts", -1).to_list(200)


async def delete_document(db, user_id: str, doc_id: str) -> int:
    await db.knowledge_docs.delete_one({"id": doc_id, "user_id": user_id})
    res = await db.knowledge_chunks.delete_many({"doc_id": doc_id, "user_id": user_id})
    return res.deleted_count


async def search(db, user_id: str, query: str, k: int = 4) -> List[dict]:
    """Mongo text search. Returns top-k chunks with score."""
    if not query or not query.strip():
        return []
    cursor = db.knowledge_chunks.find(
        {"user_id": user_id, "$text": {"$search": query}},
        {"_id": 0, "score": {"$meta": "textScore"}},
    ).sort([("score", {"$meta": "textScore"})]).limit(k)
    return await cursor.to_list(k)


def format_context(chunks: List[dict]) -> str:
    if not chunks:
        return ""
    blocks = []
    for c in chunks:
        blocks.append(f"[{c.get('title', 'doc')}]\n{c['text']}")
    return "\n\n---\n\n".join(blocks)


# ---------- Persistent Memory ----------
async def get_memory(db, user_id: str) -> str:
    doc = await db.user_memory.find_one({"user_id": user_id}, {"_id": 0})
    return (doc or {}).get("summary", "")


async def update_memory(db, user_id: str, summary: str):
    await db.user_memory.update_one(
        {"user_id": user_id},
        {"$set": {"user_id": user_id, "summary": summary, "ts": _now()}},
        upsert=True,
    )


async def telegram_get_memory(db, chat_id: int) -> str:
    doc = await db.telegram_memory.find_one({"chat_id": chat_id}, {"_id": 0})
    return (doc or {}).get("summary", "")


async def telegram_update_memory(db, chat_id: int, summary: str):
    await db.telegram_memory.update_one(
        {"chat_id": chat_id},
        {"$set": {"chat_id": chat_id, "summary": summary, "ts": _now()}},
        upsert=True,
    )
