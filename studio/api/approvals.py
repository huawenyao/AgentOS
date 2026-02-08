"""Approval API routes — list pending approvals and decide."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException
from sqlalchemy import select

from studio.models import ApprovalRequest, async_session
from studio.api.schemas import ApprovalOut, ApprovalDecision
from studio.engine.workflow_engine import workflow_engine

router = APIRouter(prefix="/api/approvals", tags=["approvals"])


@router.get("", response_model=list[ApprovalOut])
async def list_approvals(status: str | None = None):
    async with async_session() as session:
        q = select(ApprovalRequest).order_by(ApprovalRequest.created_at.desc())
        if status == "pending":
            q = q.where(ApprovalRequest.decision.is_(None))
        elif status:
            q = q.where(ApprovalRequest.decision == status)
        result = await session.execute(q)
        return result.scalars().all()


@router.get("/{approval_id}", response_model=ApprovalOut)
async def get_approval(approval_id: str):
    async with async_session() as session:
        result = await session.execute(
            select(ApprovalRequest).where(ApprovalRequest.id == approval_id)
        )
        approval = result.scalar_one_or_none()
        if not approval:
            raise HTTPException(404, "Approval not found")
        return approval


@router.post("/{approval_id}/decide", response_model=ApprovalOut)
async def decide_approval(approval_id: str, body: ApprovalDecision):
    """Approve or reject a pending approval and resume the workflow."""
    async with async_session() as session:
        result = await session.execute(
            select(ApprovalRequest).where(ApprovalRequest.id == approval_id)
        )
        approval = result.scalar_one_or_none()
        if not approval:
            raise HTTPException(404, "Approval not found")
        if approval.decision:
            raise HTTPException(400, "Approval already decided")

    # Resume workflow
    try:
        await workflow_engine.resume_after_approval(
            run_id=approval.run_id,
            approval_id=approval_id,
            decision=body.decision,
            decided_by=body.decided_by,
        )
    except Exception as e:
        raise HTTPException(500, f"Failed to resume workflow: {e}")

    # Return updated approval
    async with async_session() as session:
        result = await session.execute(
            select(ApprovalRequest).where(ApprovalRequest.id == approval_id)
        )
        return result.scalar_one()
