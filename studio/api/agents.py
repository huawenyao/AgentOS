"""Agent API routes — CRUD + Playground."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException
from sqlalchemy import select

from studio.models import Agent, Tool, async_session
from studio.models.base import new_id
from studio.api.schemas import AgentCreate, AgentUpdate, AgentOut, PlaygroundRequest, PlaygroundResponse
from studio.engine.agent_runtime import AgentDef, agent_runtime, AgentConstraintError
from studio.observe.tracer import Trace

router = APIRouter(prefix="/api/agents", tags=["agents"])


@router.post("", response_model=AgentOut)
async def create_agent(body: AgentCreate):
    async with async_session() as session:
        agent = Agent(id=new_id(), **body.model_dump())
        session.add(agent)
        await session.commit()
        await session.refresh(agent)
        return agent


@router.get("", response_model=list[AgentOut])
async def list_agents(status: str | None = None):
    async with async_session() as session:
        q = select(Agent)
        if status:
            q = q.where(Agent.status == status)
        result = await session.execute(q.order_by(Agent.created_at.desc()))
        return result.scalars().all()


@router.get("/{agent_id}", response_model=AgentOut)
async def get_agent(agent_id: str):
    async with async_session() as session:
        result = await session.execute(select(Agent).where(Agent.id == agent_id))
        agent = result.scalar_one_or_none()
        if not agent:
            raise HTTPException(404, "Agent not found")
        return agent


@router.put("/{agent_id}", response_model=AgentOut)
async def update_agent(agent_id: str, body: AgentUpdate):
    async with async_session() as session:
        result = await session.execute(select(Agent).where(Agent.id == agent_id))
        agent = result.scalar_one_or_none()
        if not agent:
            raise HTTPException(404, "Agent not found")

        update_data = body.model_dump(exclude_unset=True)
        if "instructions" in update_data and update_data["instructions"] != agent.instructions:
            agent.instructions_version += 1
        for k, v in update_data.items():
            setattr(agent, k, v)

        await session.commit()
        await session.refresh(agent)
        return agent


@router.delete("/{agent_id}")
async def delete_agent(agent_id: str):
    async with async_session() as session:
        result = await session.execute(select(Agent).where(Agent.id == agent_id))
        agent = result.scalar_one_or_none()
        if not agent:
            raise HTTPException(404, "Agent not found")
        await session.delete(agent)
        await session.commit()
        return {"ok": True}


# ── Playground ──

@router.post("/{agent_id}/playground", response_model=PlaygroundResponse)
async def playground(agent_id: str, body: PlaygroundRequest):
    """Run a single-turn agent interaction in the playground."""
    async with async_session() as session:
        result = await session.execute(select(Agent).where(Agent.id == agent_id))
        agent_row = result.scalar_one_or_none()
        if not agent_row:
            raise HTTPException(404, "Agent not found")

        # Load tools
        tool_dicts = []
        for tid in (agent_row.tool_ids or []):
            t_res = await session.execute(select(Tool).where(Tool.id == tid))
            tool = t_res.scalar_one_or_none()
            if tool and tool.enabled:
                tool_dicts.append({
                    "name": tool.name,
                    "description": tool.description,
                    "parameters_schema": tool.parameters_schema,
                    "implementation": tool.implementation,
                    "implementation_config": tool.implementation_config,
                })

        agent_def = AgentDef(
            id=agent_row.id,
            name=agent_row.name,
            instructions=agent_row.instructions,
            model=agent_row.model,
            tools=tool_dicts,
            max_turns=agent_row.max_turns,
            max_cost_cents=agent_row.max_cost_cents,
            timeout_seconds=agent_row.timeout_seconds,
            require_approval=[],  # no approval in playground
            forbidden_tools=agent_row.forbidden_tools or [],
            handoff_agents=agent_row.handoff_agent_ids or [],
        )

    try:
        trace = Trace(trace_id=f"playground-{agent_id}")
        run_result = await agent_runtime.run(agent_def, body.message, context=body.context, trace=trace)
        return PlaygroundResponse(
            output=run_result.output,
            cost_cents=run_result.cost_cents,
            llm_tokens=run_result.llm_tokens,
            turn_count=run_result.turn_count,
            tool_calls=run_result.tool_calls,
        )
    except AgentConstraintError as e:
        raise HTTPException(422, str(e))
    except Exception as e:
        raise HTTPException(500, f"Agent execution failed: {e}")
