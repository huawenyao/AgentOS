"""Pydantic request/response schemas."""

from __future__ import annotations
from datetime import datetime
from pydantic import BaseModel, Field


# ── Connection ──

class ConnectionCreate(BaseModel):
    name: str
    type: str = "openapi"
    config: dict = Field(default_factory=dict)

class ConnectionOut(BaseModel):
    id: str; name: str; type: str; config: dict; status: str
    created_at: datetime | None = None
    model_config = {"from_attributes": True}


# ── Tool ──

class ToolOut(BaseModel):
    id: str; connection_id: str | None = None; name: str; description: str
    parameters_schema: dict; implementation: str; enabled: bool
    created_at: datetime | None = None
    model_config = {"from_attributes": True}

class ToolUpdate(BaseModel):
    name: str | None = None; description: str | None = None; enabled: bool | None = None


# ── Agent ──

class AgentCreate(BaseModel):
    name: str
    instructions: str
    model: str = "claude-sonnet-4-20250514"
    tool_ids: list[str] = Field(default_factory=list)
    max_turns: int = 20
    max_cost_cents: int = 500
    timeout_seconds: int = 300
    require_approval: list[str] = Field(default_factory=list)
    forbidden_tools: list[str] = Field(default_factory=list)

class AgentUpdate(BaseModel):
    name: str | None = None; instructions: str | None = None; model: str | None = None
    tool_ids: list[str] | None = None; max_turns: int | None = None
    max_cost_cents: int | None = None; timeout_seconds: int | None = None
    require_approval: list[str] | None = None; forbidden_tools: list[str] | None = None
    status: str | None = None

class AgentOut(BaseModel):
    id: str; name: str; instructions: str; instructions_version: int; model: str
    tool_ids: list; max_turns: int; max_cost_cents: int; timeout_seconds: int
    require_approval: list; forbidden_tools: list; status: str
    created_at: datetime | None = None; updated_at: datetime | None = None
    model_config = {"from_attributes": True}


# ── Playground ──

class PlaygroundRequest(BaseModel):
    message: str
    context: dict = Field(default_factory=dict)

class PlaygroundResponse(BaseModel):
    output: str
    cost_cents: int = 0; llm_tokens: int = 0; turn_count: int = 0
    tool_calls: list[dict] = Field(default_factory=list)


# ── Metrics ──

class MetricsOverview(BaseModel):
    total_sessions: int = 0
    total_cost_cents: int = 0
    total_visuals: int = 0
