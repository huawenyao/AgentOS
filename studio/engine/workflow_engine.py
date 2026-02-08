"""Workflow Engine — DAG-based scheduling with deterministic skeleton + LLM intelligence."""

from __future__ import annotations

import asyncio
import time
from typing import Any

import networkx as nx
from loguru import logger
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from studio.models import (
    Agent as AgentModel,
    Tool as ToolModel,
    Workflow,
    WorkflowRun,
    NodeExecution,
    ApprovalRequest,
    WorkflowNodeSchema,
    WorkflowEdgeSchema,
    async_session,
)
from studio.models.base import new_id, utcnow
from studio.engine.agent_runtime import AgentDef, AgentRunResult, AgentRuntime, ApprovalRequired, AgentConstraintError, agent_runtime
from studio.engine.rule_engine import rule_engine
from studio.observe.tracer import Trace, TraceSpan
from studio.observe.metrics import metrics
from studio.observe.audit import audit_log


class WorkflowEngine:
    """Execute a workflow definition as a DAG — deterministic scheduling, intelligent nodes."""

    async def start_run(
        self,
        workflow_id: str,
        input_data: dict[str, Any],
        session: AsyncSession | None = None,
    ) -> WorkflowRun:
        """Start a new workflow run."""
        own_session = session is None
        if own_session:
            session = async_session()

        try:
            # Load workflow
            result = await session.execute(select(Workflow).where(Workflow.id == workflow_id))
            workflow = result.scalar_one_or_none()
            if not workflow:
                raise ValueError(f"Workflow not found: {workflow_id}")

            # Create run record
            run = WorkflowRun(
                id=new_id(),
                workflow_id=workflow_id,
                workflow_version=workflow.version,
                input_data=input_data,
                status="running",
            )
            session.add(run)
            await session.commit()
            await session.refresh(run)

            audit_log.record(action="workflow_start", subject=workflow.name, detail={"run_id": run.id})
            metrics.increment("workflow.runs_started", tags={"workflow": workflow.name})

            # Parse graph
            nodes = [WorkflowNodeSchema(**n) for n in (workflow.nodes or [])]
            edges = [WorkflowEdgeSchema(**e) for e in (workflow.edges or [])]
            graph = self._build_graph(nodes, edges)
            node_map = {n.id: n for n in nodes}

            # Find start nodes (no incoming edges)
            start_ids = [nid for nid in graph.nodes if graph.in_degree(nid) == 0]
            if not start_ids:
                start_ids = [nodes[0].id] if nodes else []

            # Execute starting from root nodes
            trace = Trace(trace_id=run.id)
            for start_id in start_ids:
                await self._execute_node(
                    session=session,
                    run=run,
                    node=node_map[start_id],
                    node_map=node_map,
                    graph=graph,
                    input_data=input_data,
                    trace=trace,
                )

            # Final status
            if run.status == "running":
                run.status = "completed"
                run.completed_at = utcnow()
            await session.commit()

            metrics.increment("workflow.runs_completed", tags={"workflow": workflow.name})
            audit_log.record(
                action="workflow_complete",
                subject=workflow.name,
                detail={"run_id": run.id, "status": run.status, "cost": run.total_cost_cents},
            )
            return run

        except Exception as e:
            if run:
                run.status = "failed"
                run.error = str(e)
                run.completed_at = utcnow()
                await session.commit()
            logger.error(f"Workflow run failed: {e}")
            raise
        finally:
            if own_session:
                await session.close()

    async def _execute_node(
        self,
        *,
        session: AsyncSession,
        run: WorkflowRun,
        node: WorkflowNodeSchema,
        node_map: dict[str, WorkflowNodeSchema],
        graph: nx.DiGraph,
        input_data: dict[str, Any],
        trace: Trace,
    ):
        """Execute a single node and then recursively execute successors."""
        if run.status in ("failed", "cancelled", "waiting_approval"):
            return

        run.current_node_id = node.id

        # Create execution record
        execution = NodeExecution(
            id=new_id(),
            run_id=run.id,
            node_id=node.id,
            node_type=node.type,
            node_name=node.name,
            input_data=input_data,
            status="running",
        )
        session.add(execution)
        await session.commit()

        span = TraceSpan(name=f"node:{node.name}", type=f"node_{node.type}", input_data=input_data)
        output: dict[str, Any] = {}

        try:
            if node.type == "agent":
                output = await self._execute_agent_node(session, run, execution, node, input_data, trace)
            elif node.type == "rule":
                output = self._execute_rule_node(node, input_data)
            elif node.type == "human":
                await self._execute_human_node(session, run, execution, node, input_data)
                return  # pause — human will resume later
            else:
                output = input_data

            execution.output_data = output
            execution.status = "completed"
            execution.completed_at = utcnow()
            run.total_cost_cents += execution.cost_cents
            run.total_llm_tokens += execution.llm_tokens

        except ApprovalRequired as ar:
            execution.status = "waiting_approval"
            run.status = "waiting_approval"
            approval = ApprovalRequest(
                id=new_id(),
                run_id=run.id,
                node_execution_id=execution.id,
                tool_name=ar.tool_name,
                tool_args=ar.tool_args,
                agent_reasoning=ar.reasoning,
            )
            session.add(approval)
            await session.commit()
            logger.info(f"Approval required: {ar.tool_name} in node '{node.name}'")
            return

        except AgentConstraintError as ce:
            execution.status = "failed"
            execution.error = str(ce)
            execution.completed_at = utcnow()
            run.status = "failed"
            run.error = str(ce)
            await session.commit()
            return

        except Exception as e:
            execution.status = "failed"
            execution.error = str(e)
            execution.completed_at = utcnow()
            logger.error(f"Node '{node.name}' failed: {e}")
            # don't fail the whole run for a single node failure — mark and continue
            await session.commit()
            span.end({"error": str(e)})
            trace.add_span(span)
            return

        span.end(output)
        trace.add_span(span)
        await session.commit()

        # ── Resolve and execute next nodes ──
        next_nodes = self._resolve_next(graph, node_map, node.id, output)
        for next_node in next_nodes:
            await self._execute_node(
                session=session,
                run=run,
                node=next_node,
                node_map=node_map,
                graph=graph,
                input_data=output,
                trace=trace,
            )

    # ── Node type executors ──

    async def _execute_agent_node(
        self,
        session: AsyncSession,
        run: WorkflowRun,
        execution: NodeExecution,
        node: WorkflowNodeSchema,
        input_data: dict,
        trace: Trace,
    ) -> dict:
        agent_id = node.config.get("agent_id")
        if not agent_id:
            raise ValueError(f"Agent node '{node.name}' has no agent_id configured")

        # Load agent definition from DB
        result = await session.execute(select(AgentModel).where(AgentModel.id == agent_id))
        agent_row = result.scalar_one_or_none()
        if not agent_row:
            raise ValueError(f"Agent not found: {agent_id}")

        # Load tools
        tool_dicts = []
        if agent_row.tool_ids:
            for tid in agent_row.tool_ids:
                t_result = await session.execute(select(ToolModel).where(ToolModel.id == tid))
                tool = t_result.scalar_one_or_none()
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
            require_approval=agent_row.require_approval or [],
            forbidden_tools=agent_row.forbidden_tools or [],
            handoff_agents=agent_row.handoff_agent_ids or [],
        )

        # Format input
        input_text = node.config.get("input_template", "{input}")
        if isinstance(input_data, dict):
            input_text = input_text.format(input=_dict_to_text(input_data), **input_data)
        else:
            input_text = input_text.format(input=str(input_data))

        # Run agent
        result = await agent_runtime.run(agent_def, input_text, trace=trace)
        execution.cost_cents = result.cost_cents
        execution.llm_tokens = result.llm_tokens
        execution.llm_messages = result.messages

        return {"output": result.output, "cost_cents": result.cost_cents, "turns": result.turn_count}

    def _execute_rule_node(self, node: WorkflowNodeSchema, input_data: dict) -> dict:
        expression = node.config.get("expression", "True")
        result = rule_engine.evaluate(expression, input_data)
        return {"result": result, **input_data}

    async def _execute_human_node(
        self, session: AsyncSession, run: WorkflowRun,
        execution: NodeExecution, node: WorkflowNodeSchema, input_data: dict
    ):
        """Pause workflow and create an approval request."""
        execution.status = "waiting_approval"
        run.status = "waiting_approval"
        approval = ApprovalRequest(
            id=new_id(),
            run_id=run.id,
            node_execution_id=execution.id,
            tool_name=f"human_review:{node.name}",
            tool_args=input_data,
            agent_reasoning=node.config.get("instructions", "Please review and approve."),
            assignee_role=node.config.get("assignee_role"),
        )
        session.add(approval)
        await session.commit()

    # ── Routing ──

    def _resolve_next(
        self,
        graph: nx.DiGraph,
        node_map: dict[str, WorkflowNodeSchema],
        current_id: str,
        output: dict,
    ) -> list[WorkflowNodeSchema]:
        """Determine which successor nodes to execute based on edge conditions."""
        next_nodes = []
        for _, target_id, edge_data in graph.out_edges(current_id, data=True):
            condition = edge_data.get("condition")
            if condition is None or condition == "":
                next_nodes.append(node_map[target_id])
            elif condition == "llm_judge":
                # For simplicity, treat LLM judge as true in this version
                next_nodes.append(node_map[target_id])
            else:
                if rule_engine.evaluate(condition, output):
                    next_nodes.append(node_map[target_id])
        return next_nodes

    # ── Graph builder ──

    @staticmethod
    def _build_graph(
        nodes: list[WorkflowNodeSchema], edges: list[WorkflowEdgeSchema]
    ) -> nx.DiGraph:
        g = nx.DiGraph()
        for n in nodes:
            g.add_node(n.id)
        for e in edges:
            g.add_edge(e.source_node_id, e.target_node_id, condition=e.condition, label=e.label)
        return g

    # ── Resume after approval ──

    async def resume_after_approval(
        self, run_id: str, approval_id: str, decision: str, decided_by: str
    ):
        """Resume a paused workflow after human approval/rejection."""
        async with async_session() as session:
            # Update approval
            result = await session.execute(
                select(ApprovalRequest).where(ApprovalRequest.id == approval_id)
            )
            approval = result.scalar_one_or_none()
            if not approval:
                raise ValueError(f"Approval not found: {approval_id}")
            approval.decision = decision
            approval.decided_at = utcnow()
            approval.decided_by = decided_by

            # Update run status
            r_result = await session.execute(select(WorkflowRun).where(WorkflowRun.id == run_id))
            run = r_result.scalar_one_or_none()
            if not run:
                raise ValueError(f"Run not found: {run_id}")

            if decision == "rejected":
                run.status = "failed"
                run.error = f"Approval rejected by {decided_by}"
                run.completed_at = utcnow()
                await session.commit()
                return run

            # Resume — mark run as running again
            run.status = "running"
            await session.commit()

            # Find the paused node execution and continue
            ne_result = await session.execute(
                select(NodeExecution).where(NodeExecution.id == approval.node_execution_id)
            )
            node_exec = ne_result.scalar_one_or_none()
            if node_exec:
                node_exec.status = "completed"
                node_exec.output_data = {"approved_by": decided_by, **approval.tool_args}
                node_exec.completed_at = utcnow()
                await session.commit()

                # Continue workflow from next nodes
                wf_result = await session.execute(
                    select(Workflow).where(Workflow.id == run.workflow_id)
                )
                workflow = wf_result.scalar_one_or_none()
                if workflow:
                    nodes = [WorkflowNodeSchema(**n) for n in (workflow.nodes or [])]
                    edges = [WorkflowEdgeSchema(**e) for e in (workflow.edges or [])]
                    graph = self._build_graph(nodes, edges)
                    node_map = {n.id: n for n in nodes}
                    trace = Trace(trace_id=run.id)

                    next_nodes = self._resolve_next(
                        graph, node_map, node_exec.node_id, node_exec.output_data or {}
                    )
                    for nn in next_nodes:
                        await self._execute_node(
                            session=session, run=run, node=nn,
                            node_map=node_map, graph=graph,
                            input_data=node_exec.output_data or {},
                            trace=trace,
                        )

                    if run.status == "running":
                        run.status = "completed"
                        run.completed_at = utcnow()
                    await session.commit()

            return run


def _dict_to_text(d: dict) -> str:
    parts = []
    for k, v in d.items():
        parts.append(f"{k}: {v}")
    return "\n".join(parts)


# singleton
workflow_engine = WorkflowEngine()
