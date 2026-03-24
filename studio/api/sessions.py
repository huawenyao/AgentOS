"""Session API — conversation-driven task execution with streaming + dynamic visualization."""

from __future__ import annotations

import json
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from sqlalchemy import select

from studio.models import Tool, async_session
from studio.engine.session_engine import session_engine, SessionEvent

router = APIRouter(prefix="/api/sessions", tags=["sessions"])


class SessionMessage(BaseModel):
    message: str
    session_id: str | None = None


class SessionInfo(BaseModel):
    id: str
    message_count: int = 0
    cost_cents: int = 0
    visuals: int = 0


@router.post("/chat")
async def chat(body: SessionMessage):
    """Stream a session conversation — returns Server-Sent Events.

    Each event is a JSON object with {type, content, ts}.
    Event types: thinking, text, visual, tool_call, tool_result, step, done, error
    """
    session = session_engine.get_or_create_session(body.session_id)

    # Load available tools from DB
    available_tools = []
    async with async_session() as db:
        result = await db.execute(select(Tool).where(Tool.enabled == True))
        for tool in result.scalars().all():
            available_tools.append({
                "name": tool.name,
                "description": tool.description,
                "parameters_schema": tool.parameters_schema,
                "implementation": tool.implementation,
                "implementation_config": tool.implementation_config,
            })

    async def event_stream():
        # First event: session id
        yield _sse({"type": "session_id", "content": session.id, "ts": 0})
        async for event in session_engine.run(session.id, body.message, available_tools):
            yield _sse(event.to_dict())

    return StreamingResponse(event_stream(), media_type="text/event-stream")


@router.get("", response_model=list[SessionInfo])
async def list_sessions():
    return session_engine.list_sessions()


@router.get("/{session_id}")
async def get_session(session_id: str):
    session = session_engine.get_session(session_id)
    if not session:
        raise HTTPException(404, "Session not found")
    return {
        "id": session.id,
        "messages": session.messages,
        "visuals": [v.to_dict() for v in session.visuals],
        "total_cost_cents": session.total_cost_cents,
        "total_tokens": session.total_tokens,
    }


@router.get("/{session_id}/visuals")
async def get_session_visuals(session_id: str):
    session = session_engine.get_session(session_id)
    if not session:
        raise HTTPException(404, "Session not found")
    return [v.to_dict() for v in session.visuals]


def _sse(data: dict) -> str:
    return f"data: {json.dumps(data, ensure_ascii=False)}\n\n"
