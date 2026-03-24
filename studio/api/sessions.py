"""Session API — the primary user-facing interface.

POST /api/sessions/chat  → SSE stream (main interaction)
GET  /api/sessions        → list sessions
GET  /api/sessions/:id    → session detail + visuals
DELETE /api/sessions/:id  → delete session
"""

from __future__ import annotations

import json
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from sqlalchemy import select

from studio.models import Tool, async_session
from studio.engine.session_engine import session_engine

router = APIRouter(prefix="/api/sessions", tags=["sessions"])


class ChatRequest(BaseModel):
    message: str
    session_id: str | None = None


@router.post("/chat")
async def chat(body: ChatRequest):
    """Stream a conversation turn. Returns Server-Sent Events."""
    session = session_engine.get_or_create(body.session_id)

    # Load enabled tools from DB
    tools = []
    async with async_session() as db:
        result = await db.execute(select(Tool).where(Tool.enabled == True))
        for t in result.scalars().all():
            tools.append({
                "name": t.name,
                "description": t.description,
                "parameters_schema": t.parameters_schema,
                "implementation": t.implementation,
                "implementation_config": t.implementation_config,
            })

    async def stream():
        yield _sse({"type": "session_id", "content": session.id})
        async for event in session_engine.run(session.id, body.message, tools):
            yield _sse(event.to_dict())

    return StreamingResponse(stream(), media_type="text/event-stream")


@router.get("")
async def list_sessions():
    return session_engine.list_sessions()


@router.get("/{sid}")
async def get_session(sid: str):
    s = session_engine.get(sid)
    if not s:
        raise HTTPException(404, "Session not found")
    return {
        "id": s.id, "title": s.title,
        "messages": s.messages,
        "visuals": [v.to_dict() for v in s.visuals],
        "cost_cents": s.total_cost_cents,
        "tokens": s.total_tokens,
    }


@router.delete("/{sid}")
async def delete_session(sid: str):
    if not session_engine.delete_session(sid):
        raise HTTPException(404, "Session not found")
    return {"ok": True}


def _sse(data: dict) -> str:
    return f"data: {json.dumps(data, ensure_ascii=False)}\n\n"
