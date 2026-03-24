"""Metrics API — session-centric usage stats."""

from __future__ import annotations
from fastapi import APIRouter
from studio.engine.session_engine import session_engine
from studio.observe.metrics import metrics as metrics_collector
from studio.gateway.llm_gateway import llm_gateway

router = APIRouter(prefix="/api/metrics", tags=["metrics"])


@router.get("/overview")
async def overview():
    sessions = session_engine.list_sessions()
    total_cost = sum(s["cost_cents"] for s in sessions)
    total_visuals = sum(s["visuals"] for s in sessions)
    return {
        "total_sessions": len(sessions),
        "total_cost_cents": total_cost,
        "total_visuals": total_visuals,
        "gateway_cost_cents": llm_gateway.total_cost_cents,
        "counters": metrics_collector.summary()["counters"],
    }
