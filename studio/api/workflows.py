"""Workflow API routes — CRUD + Run trigger."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException
from sqlalchemy import select

from studio.models import Workflow, WorkflowRun, NodeExecution, async_session
from studio.models.base import new_id
from studio.api.schemas import (
    WorkflowCreate, WorkflowUpdate, WorkflowOut,
    RunTrigger, RunOut, NodeExecutionOut,
)
from studio.engine.workflow_engine import workflow_engine

router = APIRouter(prefix="/api/workflows", tags=["workflows"])


@router.post("", response_model=WorkflowOut)
async def create_workflow(body: WorkflowCreate):
    async with async_session() as session:
        wf = Workflow(id=new_id(), **body.model_dump())
        session.add(wf)
        await session.commit()
        await session.refresh(wf)
        return wf


@router.get("", response_model=list[WorkflowOut])
async def list_workflows(status: str | None = None):
    async with async_session() as session:
        q = select(Workflow)
        if status:
            q = q.where(Workflow.status == status)
        result = await session.execute(q.order_by(Workflow.created_at.desc()))
        return result.scalars().all()


@router.get("/{wf_id}", response_model=WorkflowOut)
async def get_workflow(wf_id: str):
    async with async_session() as session:
        result = await session.execute(select(Workflow).where(Workflow.id == wf_id))
        wf = result.scalar_one_or_none()
        if not wf:
            raise HTTPException(404, "Workflow not found")
        return wf


@router.put("/{wf_id}", response_model=WorkflowOut)
async def update_workflow(wf_id: str, body: WorkflowUpdate):
    async with async_session() as session:
        result = await session.execute(select(Workflow).where(Workflow.id == wf_id))
        wf = result.scalar_one_or_none()
        if not wf:
            raise HTTPException(404, "Workflow not found")
        update = body.model_dump(exclude_unset=True)
        if "nodes" in update or "edges" in update:
            wf.version += 1
        for k, v in update.items():
            setattr(wf, k, v)
        await session.commit()
        await session.refresh(wf)
        return wf


@router.post("/{wf_id}/publish", response_model=WorkflowOut)
async def publish_workflow(wf_id: str):
    async with async_session() as session:
        result = await session.execute(select(Workflow).where(Workflow.id == wf_id))
        wf = result.scalar_one_or_none()
        if not wf:
            raise HTTPException(404, "Workflow not found")
        wf.status = "published"
        await session.commit()
        await session.refresh(wf)
        return wf


@router.delete("/{wf_id}")
async def delete_workflow(wf_id: str):
    async with async_session() as session:
        result = await session.execute(select(Workflow).where(Workflow.id == wf_id))
        wf = result.scalar_one_or_none()
        if not wf:
            raise HTTPException(404, "Workflow not found")
        await session.delete(wf)
        await session.commit()
        return {"ok": True}


# ── Runs ──

runs_router = APIRouter(prefix="/api/runs", tags=["runs"])


@runs_router.post("/workflows/{wf_id}/trigger", response_model=RunOut)
async def trigger_run(wf_id: str, body: RunTrigger):
    """Trigger a new workflow run."""
    try:
        run = await workflow_engine.start_run(wf_id, body.input_data)
        return run
    except ValueError as e:
        raise HTTPException(404, str(e))
    except Exception as e:
        raise HTTPException(500, f"Workflow execution failed: {e}")


@runs_router.get("", response_model=list[RunOut])
async def list_runs(workflow_id: str | None = None, status: str | None = None, limit: int = 50):
    async with async_session() as session:
        q = select(WorkflowRun)
        if workflow_id:
            q = q.where(WorkflowRun.workflow_id == workflow_id)
        if status:
            q = q.where(WorkflowRun.status == status)
        result = await session.execute(q.order_by(WorkflowRun.started_at.desc()).limit(limit))
        return result.scalars().all()


@runs_router.get("/{run_id}", response_model=RunOut)
async def get_run(run_id: str):
    async with async_session() as session:
        result = await session.execute(select(WorkflowRun).where(WorkflowRun.id == run_id))
        run = result.scalar_one_or_none()
        if not run:
            raise HTTPException(404, "Run not found")
        return run


@runs_router.get("/{run_id}/nodes", response_model=list[NodeExecutionOut])
async def get_run_nodes(run_id: str):
    async with async_session() as session:
        result = await session.execute(
            select(NodeExecution)
            .where(NodeExecution.run_id == run_id)
            .order_by(NodeExecution.started_at)
        )
        return result.scalars().all()
