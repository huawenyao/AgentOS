"""Agent Runtime — ReAct loop with constraint enforcement, tool calls, and handoffs."""

from __future__ import annotations

import time
from dataclasses import dataclass, field
from typing import Any

from loguru import logger

from studio.gateway.llm_gateway import LLMResponse, llm_gateway
from studio.engine.tool_executor import tool_executor
from studio.observe.tracer import Trace, TraceSpan
from studio.observe.metrics import metrics
from studio.observe.audit import audit_log


# ── Exceptions ──


class AgentConstraintError(Exception):
    """Raised when an agent violates a runtime constraint."""
    pass


class ApprovalRequired(Exception):
    """Raised when a tool call requires human approval."""
    def __init__(self, tool_name: str, tool_args: dict, reasoning: str):
        self.tool_name = tool_name
        self.tool_args = tool_args
        self.reasoning = reasoning
        super().__init__(f"Approval required for tool '{tool_name}'")


# ── Agent definition (loaded from DB) ──


@dataclass
class AgentDef:
    """In-memory representation of an agent definition."""
    id: str
    name: str
    instructions: str
    model: str = "claude-sonnet-4-20250514"
    tools: list[dict] = field(default_factory=list)  # list of tool records
    max_turns: int = 20
    max_cost_cents: int = 500
    timeout_seconds: int = 300
    require_approval: list[str] = field(default_factory=list)
    forbidden_tools: list[str] = field(default_factory=list)
    handoff_agents: list[str] = field(default_factory=list)
    output_schema: dict | None = None


# ── Agent run result ──


@dataclass
class AgentRunResult:
    output: str
    cost_cents: int = 0
    llm_tokens: int = 0
    turn_count: int = 0
    tool_calls: list[dict] = field(default_factory=list)
    messages: list[dict] = field(default_factory=list)
    trace: Trace | None = None
    handoff_to: str | None = None  # agent_id to hand off to


# ── Runtime ──


class AgentRuntime:
    """Execute an agent with ReAct loop, constraint checking, and observability."""

    def __init__(self):
        self.gateway = llm_gateway

    async def run(
        self,
        agent: AgentDef,
        input_text: str,
        context: dict[str, Any] | None = None,
        trace: Trace | None = None,
    ) -> AgentRunResult:
        """Run an agent on the given input.  Returns when the agent produces text output,
        requests a handoff, or violates a constraint."""

        messages: list[dict] = [
            {"role": "system", "content": agent.instructions},
            {"role": "user", "content": input_text},
        ]
        if context:
            ctx_text = "\n".join(f"{k}: {v}" for k, v in context.items())
            messages[0]["content"] += f"\n\n<context>\n{ctx_text}\n</context>"

        tools_schema = self._build_tools_schema(agent)
        turn_count = 0
        total_cost = 0
        total_tokens = 0
        all_tool_calls: list[dict] = []
        start_time = time.monotonic()

        while True:
            # ── Constraint checks (deterministic) ──
            if turn_count >= agent.max_turns:
                raise AgentConstraintError(
                    f"Agent '{agent.name}' exceeded max turns ({agent.max_turns})"
                )
            if total_cost >= agent.max_cost_cents:
                raise AgentConstraintError(
                    f"Agent '{agent.name}' exceeded cost limit ({agent.max_cost_cents} cents)"
                )
            elapsed = time.monotonic() - start_time
            if elapsed > agent.timeout_seconds:
                raise AgentConstraintError(
                    f"Agent '{agent.name}' timed out ({agent.timeout_seconds}s)"
                )

            # ── LLM call (intelligent) ──
            span = TraceSpan(name=f"llm_call_{turn_count}", type="llm_call")
            resp = await self.gateway.chat(
                model=agent.model,
                messages=messages,
                tools=tools_schema if tools_schema else None,
                max_tokens=4096,
            )
            span.end({"type": resp.type, "cost": resp.cost_cents})
            if trace:
                trace.add_span(span)

            total_cost += resp.cost_cents
            total_tokens += resp.input_tokens + resp.output_tokens
            turn_count += 1
            metrics.increment("agent.llm_calls", tags={"agent": agent.name})
            metrics.increment("agent.cost_cents", value=resp.cost_cents, tags={"agent": agent.name})

            # ── Handle response ──
            if resp.type == "text":
                # Agent decided to produce final output
                messages.append({"role": "assistant", "content": resp.content})
                audit_log.record(
                    action="agent_complete",
                    subject=agent.name,
                    detail={"turns": turn_count, "cost": total_cost},
                )
                return AgentRunResult(
                    output=resp.content,
                    cost_cents=total_cost,
                    llm_tokens=total_tokens,
                    turn_count=turn_count,
                    tool_calls=all_tool_calls,
                    messages=messages,
                    trace=trace,
                )

            elif resp.type == "tool_calls":
                # Process each tool call
                assistant_content: list[dict] = []
                for tc in resp.tool_calls:
                    if tc.get("name", "").startswith("text"):
                        assistant_content.append({"type": "text", "text": resp.content})
                    else:
                        assistant_content.append({
                            "type": "tool_use",
                            "id": tc["id"],
                            "name": tc["name"],
                            "input": tc["arguments"],
                        })

                messages.append({"role": "assistant", "content": assistant_content or resp.content})

                tool_results_content: list[dict] = []
                for tc in resp.tool_calls:
                    tool_name = tc["name"]
                    tool_args = tc["arguments"]

                    # ── Check handoff ──
                    if tool_name == "__handoff__":
                        target = tool_args.get("target_agent", "")
                        return AgentRunResult(
                            output=f"[Handoff to {target}]",
                            cost_cents=total_cost,
                            llm_tokens=total_tokens,
                            turn_count=turn_count,
                            tool_calls=all_tool_calls,
                            messages=messages,
                            trace=trace,
                            handoff_to=target,
                        )

                    # ── Forbidden check (deterministic) ──
                    if tool_name in agent.forbidden_tools:
                        raise AgentConstraintError(f"Forbidden tool: {tool_name}")

                    # ── Approval check (deterministic) ──
                    if tool_name in agent.require_approval:
                        raise ApprovalRequired(tool_name, tool_args, resp.content)

                    # ── Execute tool ──
                    tool_span = TraceSpan(
                        name=f"tool_{tool_name}", type="tool_call",
                        input_data={"args": tool_args}
                    )
                    tool_def = self._find_tool(agent, tool_name)
                    result_str = await tool_executor.execute(
                        tool_name=tool_name,
                        tool_args=tool_args,
                        implementation=tool_def.get("implementation", "mock"),
                        implementation_config=tool_def.get("implementation_config", {}),
                        timeout=min(30, agent.timeout_seconds - int(elapsed)),
                    )
                    tool_span.end({"result_length": len(result_str)})
                    if trace:
                        trace.add_span(tool_span)

                    all_tool_calls.append({"tool": tool_name, "args": tool_args, "result": result_str[:500]})
                    tool_results_content.append({
                        "type": "tool_result",
                        "tool_use_id": tc["id"],
                        "content": result_str,
                    })

                messages.append({"role": "user", "content": tool_results_content})

    # ── Schema builders ──

    def _build_tools_schema(self, agent: AgentDef) -> list[dict]:
        """Build the tools schema for the LLM from agent's tool definitions."""
        schemas = []
        for tool in agent.tools:
            schema = {
                "name": tool["name"],
                "description": tool.get("description", ""),
                "input_schema": tool.get("parameters_schema", {"type": "object", "properties": {}}),
            }
            schemas.append(schema)

        # Add handoff tool if agent has handoff targets
        if agent.handoff_agents:
            schemas.append({
                "name": "__handoff__",
                "description": (
                    f"Hand off this conversation to another specialist agent. "
                    f"Available agents: {', '.join(agent.handoff_agents)}"
                ),
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "target_agent": {
                            "type": "string",
                            "description": "The name/id of the agent to hand off to",
                        },
                        "reason": {
                            "type": "string",
                            "description": "Why you are handing off",
                        },
                    },
                    "required": ["target_agent"],
                },
            })
        return schemas

    def _find_tool(self, agent: AgentDef, tool_name: str) -> dict:
        for t in agent.tools:
            if t["name"] == tool_name:
                return t
        return {"name": tool_name, "implementation": "mock", "implementation_config": {}}


# singleton
agent_runtime = AgentRuntime()
