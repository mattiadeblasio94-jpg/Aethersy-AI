"""Copilot agent — LLM-driven loop with tool calling: shell exec, file ops, web fetch.

Per-user sandbox: /tmp/copilot/{user_id}/
Uses OpenAI gpt-5-nano via Emergent Universal Key (cheap & fast tool-calling).
"""
import os
import asyncio
import json
import logging
import shlex
import uuid
from datetime import datetime, timezone
from pathlib import Path
import httpx

logger = logging.getLogger("copilot")

OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")
# Cross-platform sandbox: /tmp on Unix, %TEMP%\copilot on Windows
SANDBOX_ROOT = Path(os.environ.get("COPILOT_SANDBOX_DIR", os.path.join(os.path.expanduser("~"), "aiforge-copilot")))
SANDBOX_ROOT.mkdir(exist_ok=True)

# Commands blocked entirely
DENY_PATTERNS = [
    "rm -rf /", "mkfs", ":(){:|:&};:", "dd if=/dev",
    "shutdown", "reboot", "halt", "poweroff",
    "/etc/passwd", "/etc/shadow",
    "curl http://169.254", "wget http://169.254",  # AWS metadata
]


def user_sandbox(user_id: str) -> Path:
    p = SANDBOX_ROOT / user_id
    p.mkdir(exist_ok=True)
    return p


def is_command_safe(cmd: str) -> tuple[bool, str]:
    low = cmd.lower()
    for bad in DENY_PATTERNS:
        if bad in low:
            return False, f"Blocked pattern: {bad}"
    return True, ""


TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "shell_exec",
            "description": "Execute a shell command in the user's sandbox directory. Use for running scripts, listing files, network requests with curl, etc. Output is captured. Hard timeout 20s.",
            "parameters": {
                "type": "object",
                "properties": {
                    "command": {"type": "string", "description": "Shell command to execute"}
                },
                "required": ["command"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "write_file",
            "description": "Write text content to a file in the sandbox. Creates parent dirs as needed. Path is relative to sandbox root.",
            "parameters": {
                "type": "object",
                "properties": {
                    "path": {"type": "string"},
                    "content": {"type": "string"},
                },
                "required": ["path", "content"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "read_file",
            "description": "Read a text file from the sandbox. Path is relative to sandbox root.",
            "parameters": {
                "type": "object",
                "properties": {"path": {"type": "string"}},
                "required": ["path"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "list_dir",
            "description": "List contents of a directory in the sandbox. Path relative to sandbox root, '' for root.",
            "parameters": {
                "type": "object",
                "properties": {"path": {"type": "string", "default": ""}},
            },
        },
    },
]


def _safe_path(sandbox: Path, rel: str) -> Path:
    p = (sandbox / rel.lstrip("/")).resolve()
    sandbox_resolved = sandbox.resolve()
    if not str(p).startswith(str(sandbox_resolved)):
        raise ValueError("Path escapes sandbox")
    return p


async def shell_exec(sandbox: Path, command: str) -> dict:
    ok, reason = is_command_safe(command)
    if not ok:
        return {"ok": False, "stdout": "", "stderr": reason, "code": -1}
    try:
        proc = await asyncio.create_subprocess_shell(
            command, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE,
            cwd=str(sandbox),
        )
        try:
            stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=20)
        except asyncio.TimeoutError:
            proc.kill()
            return {"ok": False, "stdout": "", "stderr": "Timeout (20s)", "code": -1}
        return {
            "ok": proc.returncode == 0,
            "stdout": stdout.decode("utf-8", errors="ignore")[:4000],
            "stderr": stderr.decode("utf-8", errors="ignore")[:1500],
            "code": proc.returncode,
        }
    except Exception as e:
        return {"ok": False, "stdout": "", "stderr": str(e), "code": -1}


def write_file_tool(sandbox: Path, path: str, content: str) -> dict:
    try:
        p = _safe_path(sandbox, path)
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(content, encoding="utf-8")
        return {"ok": True, "path": str(p.relative_to(sandbox)), "bytes": len(content)}
    except Exception as e:
        return {"ok": False, "error": str(e)}


def read_file_tool(sandbox: Path, path: str) -> dict:
    try:
        p = _safe_path(sandbox, path)
        if not p.exists():
            return {"ok": False, "error": "File not found"}
        text = p.read_text(encoding="utf-8", errors="ignore")
        return {"ok": True, "content": text[:8000], "truncated": len(text) > 8000}
    except Exception as e:
        return {"ok": False, "error": str(e)}


def list_dir_tool(sandbox: Path, path: str = "") -> dict:
    try:
        p = _safe_path(sandbox, path) if path else sandbox
        if not p.exists():
            return {"ok": False, "error": "Path not found"}
        items = []
        for item in sorted(p.iterdir()):
            items.append({
                "name": item.name,
                "type": "dir" if item.is_dir() else "file",
                "size": item.stat().st_size if item.is_file() else None,
            })
        return {"ok": True, "items": items[:200]}
    except Exception as e:
        return {"ok": False, "error": str(e)}


async def execute_tool(sandbox: Path, name: str, args: dict) -> dict:
    if name == "shell_exec":
        return await shell_exec(sandbox, args.get("command", ""))
    if name == "write_file":
        return write_file_tool(sandbox, args.get("path", ""), args.get("content", ""))
    if name == "read_file":
        return read_file_tool(sandbox, args.get("path", ""))
    if name == "list_dir":
        return list_dir_tool(sandbox, args.get("path", ""))
    return {"ok": False, "error": f"Unknown tool: {name}"}


async def copilot_run(
    db, user_id: str, prompt: str, max_iterations: int = 8
) -> dict:
    """Run copilot agent loop. Returns final answer + trace."""
    sandbox = user_sandbox(user_id)
    trace = []

    system = (
        f"You are Lara's Copilot — an AI engineer running inside the Aethersy AI platform. "
        f"You have a sandboxed terminal at {sandbox}/ and these tools: "
        "shell_exec (run shell commands), write_file, read_file, list_dir. "
        "Use the tools step by step to accomplish the user's task. "
        "When you're done, send a final assistant message with NO tool calls summarizing the result. "
        "Be concise. Match the user's language."
    )

    messages = [
        {"role": "system", "content": system},
        {"role": "user", "content": prompt},
    ]

    async with httpx.AsyncClient(timeout=60) as client:
        for iteration in range(max_iterations):
            payload = {
                "model": "llama-3.3-70b-versatile",
                "messages": messages,
                "tools": TOOLS,
                "tool_choice": "auto",
            }
            try:
                resp = await client.post(
                    "https://api.groq.com/openai/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {GROQ_API_KEY}",
                        "Content-Type": "application/json",
                    },
                    json=payload,
                )
            except Exception as e:
                trace.append({"type": "error", "message": f"LLM call failed: {e}"})
                return {"answer": f"LLM error: {e}", "trace": trace}

            if resp.status_code != 200:
                trace.append({"type": "error", "message": f"LLM {resp.status_code}: {resp.text[:300]}"})
                return {"answer": f"LLM error {resp.status_code}", "trace": trace}

            data = resp.json()
            msg = data["choices"][0]["message"]
            tool_calls = msg.get("tool_calls") or []

            # Append the assistant message to history (with tool_calls if any)
            messages.append({
                "role": "assistant",
                "content": msg.get("content") or "",
                "tool_calls": tool_calls,
            })

            if not tool_calls:
                # Final answer
                final = msg.get("content") or ""
                trace.append({"type": "final", "content": final})
                return {"answer": final, "trace": trace, "iterations": iteration + 1}

            # Execute each tool
            for tc in tool_calls:
                fn = tc["function"]
                name = fn["name"]
                try:
                    args = json.loads(fn.get("arguments") or "{}")
                except Exception:
                    args = {}
                trace.append({"type": "tool_call", "tool": name, "args": args})
                result = await execute_tool(sandbox, name, args)
                trace.append({"type": "tool_result", "tool": name, "result": result})
                messages.append({
                    "role": "tool",
                    "tool_call_id": tc["id"],
                    "content": json.dumps(result)[:5000],
                })

    trace.append({"type": "limit", "message": "Hit max iterations"})
    return {"answer": "Reached max iterations without final answer.", "trace": trace, "iterations": max_iterations}
