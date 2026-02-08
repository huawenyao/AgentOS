"""Workflow definition database models."""

from sqlalchemy import Column, String, Text, JSON, Integer

from studio.models.base import Base, TimestampMixin, new_id


class Workflow(Base, TimestampMixin):
    __tablename__ = "workflows"

    id = Column(String(32), primary_key=True, default=new_id)
    workspace_id = Column(String(32), nullable=False, index=True, default="default")
    name = Column(String(200), nullable=False)
    description = Column(Text, default="")
    version = Column(Integer, default=1)
    # ── Graph definition ──
    nodes = Column(JSON, default=list)  # list[WorkflowNodeDict]
    edges = Column(JSON, default=list)  # list[WorkflowEdgeDict]
    # ── Trigger ──
    trigger_type = Column(String(50), default="manual")  # manual | api | cron | event
    trigger_config = Column(JSON, default=dict)
    # ── Lifecycle ──
    status = Column(String(20), default="draft")  # draft | published | archived


# ── Pydantic schemas for the JSON fields ──
from pydantic import BaseModel, Field
from typing import Optional, Any


class WorkflowNodeSchema(BaseModel):
    id: str
    type: str  # agent | rule | human | parallel_gate
    name: str
    config: dict = Field(default_factory=dict)
    position: dict = Field(default_factory=lambda: {"x": 0, "y": 0})


class WorkflowEdgeSchema(BaseModel):
    id: str
    source_node_id: str
    target_node_id: str
    condition: Optional[str] = None  # None=unconditional, python expr, or "llm_judge"
    label: Optional[str] = None
