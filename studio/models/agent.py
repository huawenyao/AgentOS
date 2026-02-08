"""Agent database models."""

from sqlalchemy import Column, String, Text, JSON, Integer, Boolean

from studio.models.base import Base, TimestampMixin, new_id


class Agent(Base, TimestampMixin):
    __tablename__ = "agents"

    id = Column(String(32), primary_key=True, default=new_id)
    workspace_id = Column(String(32), nullable=False, index=True, default="default")
    name = Column(String(200), nullable=False)
    instructions = Column(Text, nullable=False)
    instructions_version = Column(Integer, default=1)
    model = Column(String(100), default="claude-sonnet-4-20250514")
    tool_ids = Column(JSON, default=list)  # list[str]
    # ── Constraints ──
    max_turns = Column(Integer, default=20)
    max_cost_cents = Column(Integer, default=500)
    timeout_seconds = Column(Integer, default=300)
    require_approval = Column(JSON, default=list)  # tool names requiring human approval
    forbidden_tools = Column(JSON, default=list)
    output_schema = Column(JSON, nullable=True)
    # ── Handoffs ──
    handoff_agent_ids = Column(JSON, default=list)
    # ── Lifecycle ──
    status = Column(String(20), default="draft")  # draft | published | archived
