"""Pydantic request/response schemas for the API layer."""

from __future__ import annotations

from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, Field


# ── Connection ──

class ConnectionCreate(BaseModel):
    name: str
    type: str = "openapi"
    config: dict = Field(default_factory=dict)

class ConnectionOut(BaseModel):
    id: str
    name: str
    type: str
    config: dict
    status: str
    created_at: datetime | None = None
    model_config = {"from_attributes": True}


# ── Tool ──

class ToolOut(BaseModel):
    id: str
    connection_id: str | None = None
    name: str
    description: str
    parameters_schema: dict
    implementation: str
    enabled: bool
    created_at: datetime | None = None
    model_config = {"from_attributes": True}

class ToolUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    enabled: bool | None = None


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
    handoff_agent_ids: list[str] = Field(default_factory=list)

class AgentUpdate(BaseModel):
    name: str | None = None
    instructions: str | None = None
    model: str | None = None
    tool_ids: list[str] | None = None
    max_turns: int | None = None
    max_cost_cents: int | None = None
    timeout_seconds: int | None = None
    require_approval: list[str] | None = None
    forbidden_tools: list[str] | None = None
    handoff_agent_ids: list[str] | None = None
    status: str | None = None

class AgentOut(BaseModel):
    id: str
    name: str
    instructions: str
    instructions_version: int
    model: str
    tool_ids: list
    max_turns: int
    max_cost_cents: int
    timeout_seconds: int
    require_approval: list
    forbidden_tools: list
    handoff_agent_ids: list
    status: str
    created_at: datetime | None = None
    updated_at: datetime | None = None
    model_config = {"from_attributes": True}


# ── Workflow ──

class WorkflowCreate(BaseModel):
    name: str
    description: str = ""
    nodes: list[dict] = Field(default_factory=list)
    edges: list[dict] = Field(default_factory=list)
    trigger_type: str = "manual"
    trigger_config: dict = Field(default_factory=dict)

class WorkflowUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    nodes: list[dict] | None = None
    edges: list[dict] | None = None
    trigger_type: str | None = None
    trigger_config: dict | None = None
    status: str | None = None

class WorkflowOut(BaseModel):
    id: str
    name: str
    description: str
    version: int
    nodes: list
    edges: list
    trigger_type: str
    trigger_config: dict
    status: str
    created_at: datetime | None = None
    model_config = {"from_attributes": True}


# ── Run ──

class RunTrigger(BaseModel):
    input_data: dict = Field(default_factory=dict)

class RunOut(BaseModel):
    id: str
    workflow_id: str
    workflow_version: int
    status: str
    input_data: dict
    output_data: dict | None = None
    current_node_id: str | None = None
    total_cost_cents: int
    total_llm_tokens: int
    error: str | None = None
    started_at: datetime | None = None
    completed_at: datetime | None = None
    model_config = {"from_attributes": True}

class NodeExecutionOut(BaseModel):
    id: str
    node_id: str
    node_type: str
    node_name: str
    status: str
    input_data: dict
    output_data: dict | None = None
    error: str | None = None
    cost_cents: int
    llm_tokens: int
    started_at: datetime | None = None
    completed_at: datetime | None = None
    model_config = {"from_attributes": True}


# ── Approval ──

class ApprovalOut(BaseModel):
    id: str
    run_id: str
    node_execution_id: str
    tool_name: str
    tool_args: dict
    agent_reasoning: str
    assignee_role: str | None = None
    decision: str | None = None
    decided_by: str | None = None
    decided_at: datetime | None = None
    created_at: datetime | None = None
    model_config = {"from_attributes": True}

class ApprovalDecision(BaseModel):
    decision: str  # approved | rejected
    decided_by: str = "admin"


# ── Playground ──

class PlaygroundRequest(BaseModel):
    message: str
    context: dict = Field(default_factory=dict)

class PlaygroundResponse(BaseModel):
    output: str
    cost_cents: int = 0
    llm_tokens: int = 0
    turn_count: int = 0
    tool_calls: list[dict] = Field(default_factory=list)


# ── Metrics ──

class MetricsOverview(BaseModel):
    total_runs: int = 0
    completed_runs: int = 0
    failed_runs: int = 0
    success_rate: float = 0.0
    total_cost_cents: int = 0
    avg_duration_seconds: float = 0.0
    approval_pass_rate: float = 0.0
