"""Workflow run / node execution / approval models."""

from sqlalchemy import Column, String, Text, JSON, Integer, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship

from studio.models.base import Base, TimestampMixin, new_id, utcnow


class WorkflowRun(Base, TimestampMixin):
    __tablename__ = "workflow_runs"

    id = Column(String(32), primary_key=True, default=new_id)
    workflow_id = Column(String(32), ForeignKey("workflows.id"), nullable=False)
    workflow_version = Column(Integer, nullable=False)
    status = Column(String(30), default="running")
    # running | completed | failed | waiting_approval | cancelled
    input_data = Column(JSON, default=dict)
    output_data = Column(JSON, nullable=True)
    current_node_id = Column(String(100), nullable=True)
    total_cost_cents = Column(Integer, default=0)
    total_llm_tokens = Column(Integer, default=0)
    error = Column(Text, nullable=True)
    started_at = Column(DateTime(timezone=True), default=utcnow)
    completed_at = Column(DateTime(timezone=True), nullable=True)

    node_executions = relationship(
        "NodeExecution", back_populates="run", cascade="all, delete-orphan"
    )
    approvals = relationship(
        "ApprovalRequest", back_populates="run", cascade="all, delete-orphan"
    )


class NodeExecution(Base, TimestampMixin):
    __tablename__ = "node_executions"

    id = Column(String(32), primary_key=True, default=new_id)
    run_id = Column(String(32), ForeignKey("workflow_runs.id"), nullable=False, index=True)
    node_id = Column(String(100), nullable=False)
    node_type = Column(String(30), nullable=False)
    node_name = Column(String(200), default="")
    status = Column(String(30), default="running")
    # running | completed | failed | waiting_approval | skipped
    input_data = Column(JSON, default=dict)
    output_data = Column(JSON, nullable=True)
    error = Column(Text, nullable=True)
    cost_cents = Column(Integer, default=0)
    llm_tokens = Column(Integer, default=0)
    llm_messages = Column(JSON, default=list)  # full conversation for audit
    started_at = Column(DateTime(timezone=True), default=utcnow)
    completed_at = Column(DateTime(timezone=True), nullable=True)

    run = relationship("WorkflowRun", back_populates="node_executions")


class ApprovalRequest(Base, TimestampMixin):
    __tablename__ = "approval_requests"

    id = Column(String(32), primary_key=True, default=new_id)
    run_id = Column(String(32), ForeignKey("workflow_runs.id"), nullable=False, index=True)
    node_execution_id = Column(String(32), ForeignKey("node_executions.id"), nullable=False)
    tool_name = Column(String(200), nullable=False)
    tool_args = Column(JSON, default=dict)
    agent_reasoning = Column(Text, default="")
    assignee_role = Column(String(100), nullable=True)
    decision = Column(String(20), nullable=True)  # approved | rejected
    decided_at = Column(DateTime(timezone=True), nullable=True)
    decided_by = Column(String(200), nullable=True)

    run = relationship("WorkflowRun", back_populates="approvals")
