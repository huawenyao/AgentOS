"""Metrics API routes — aggregated dashboards."""

from __future__ import annotations

from fastapi import APIRouter
from sqlalchemy import select, func

from studio.models import WorkflowRun, NodeExecution, ApprovalRequest, async_session
from studio.api.schemas import MetricsOverview

router = APIRouter(prefix="/api/metrics", tags=["metrics"])


@router.get("/overview", response_model=MetricsOverview)
async def metrics_overview():
    async with async_session() as session:
        # Total runs
        total = await session.scalar(select(func.count(WorkflowRun.id)))
        completed = await session.scalar(
            select(func.count(WorkflowRun.id)).where(WorkflowRun.status == "completed")
        )
        failed = await session.scalar(
            select(func.count(WorkflowRun.id)).where(WorkflowRun.status == "failed")
        )
        total_cost = await session.scalar(
            select(func.coalesce(func.sum(WorkflowRun.total_cost_cents), 0))
        )

        # Success rate
        success_rate = (completed / total * 100) if total else 0.0

        # Average duration (completed runs only)
        avg_dur = 0.0  # would need timestamp math for real calc

        # Approval pass rate
        total_approvals = await session.scalar(
            select(func.count(ApprovalRequest.id)).where(ApprovalRequest.decision.isnot(None))
        )
        approved = await session.scalar(
            select(func.count(ApprovalRequest.id)).where(ApprovalRequest.decision == "approved")
        )
        approval_rate = (approved / total_approvals * 100) if total_approvals else 0.0

        return MetricsOverview(
            total_runs=total or 0,
            completed_runs=completed or 0,
            failed_runs=failed or 0,
            success_rate=round(success_rate, 1),
            total_cost_cents=total_cost or 0,
            avg_duration_seconds=avg_dur,
            approval_pass_rate=round(approval_rate, 1),
        )


@router.get("/costs")
async def cost_breakdown():
    """Cost breakdown by agent/workflow."""
    async with async_session() as session:
        result = await session.execute(
            select(
                NodeExecution.node_name,
                func.count(NodeExecution.id).label("calls"),
                func.sum(NodeExecution.cost_cents).label("total_cost"),
                func.sum(NodeExecution.llm_tokens).label("total_tokens"),
            )
            .where(NodeExecution.node_type == "agent")
            .group_by(NodeExecution.node_name)
            .order_by(func.sum(NodeExecution.cost_cents).desc())
        )
        rows = result.all()
        return [
            {
                "agent_name": r.node_name,
                "calls": r.calls,
                "total_cost_cents": r.total_cost or 0,
                "total_tokens": r.total_tokens or 0,
            }
            for r in rows
        ]
