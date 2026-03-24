"""Session Engine — conversation-driven task execution with dynamic visualization.

The user speaks intent in natural language. The engine:
1. Understands what the user wants (via LLM)
2. Plans the work autonomously (decides agents, tools, workflow)
3. Executes and streams results back
4. Generates dynamic visualizations as thinking aids along the way
"""

from __future__ import annotations

import json
import time
from dataclasses import dataclass, field
from typing import Any, AsyncIterator
from uuid import uuid4

from loguru import logger

from studio.gateway.llm_gateway import llm_gateway
from studio.engine.agent_runtime import AgentDef, agent_runtime, AgentRunResult
from studio.engine.tool_executor import tool_executor
from studio.observe.audit import audit_log
from studio.observe.metrics import metrics
from studio.observe.tracer import Trace, TraceSpan


# ── Visualization primitives ──

@dataclass
class VisualElement:
    """A single dynamic visualization element generated during a session."""
    type: str       # mindmap | flowchart | tree | network | timeline | chart | table | metric_card
    title: str
    data: dict      # shape depends on type
    description: str = ""

    def to_dict(self) -> dict:
        return {"type": self.type, "title": self.title, "data": self.data, "description": self.description}


# ── Session event stream ──

@dataclass
class SessionEvent:
    """A single event in the session stream — sent to the frontend via SSE."""
    type: str       # thinking | text | visual | tool_call | tool_result | step | done | error | approval_needed
    content: Any
    timestamp: float = field(default_factory=time.time)

    def to_dict(self) -> dict:
        return {"type": self.type, "content": self.content, "ts": self.timestamp}


# ── Session state ──

@dataclass
class Session:
    id: str = field(default_factory=lambda: uuid4().hex)
    messages: list[dict] = field(default_factory=list)
    visuals: list[VisualElement] = field(default_factory=list)
    total_cost_cents: int = 0
    total_tokens: int = 0

    def add_user_message(self, content: str):
        self.messages.append({"role": "user", "content": content})

    def add_assistant_message(self, content: str):
        self.messages.append({"role": "assistant", "content": content})


# ── The orchestration prompt ──

ORCHESTRATOR_SYSTEM = """You are the orchestrator of Agentic Work Studio. The user describes business tasks in natural language. You must:

1. UNDERSTAND: Analyze the user's intent and break it into concrete steps.
2. PLAN: Decide which tools to call or which analysis to perform.
3. EXECUTE: Call the tools, process data, generate insights.
4. VISUALIZE: When it helps the user think, generate dynamic visualizations.

You have access to tools. When you need to help the user visualize information, use the `render_visual` tool.

IMPORTANT RULES:
- Talk to the user in their language (Chinese if they speak Chinese).
- Don't ask the user to draw workflows. You plan and execute autonomously.
- Use visualizations proactively when they aid understanding — category breakdowns as tree maps, trends as timelines, relationships as networks, plans as flowcharts.
- Each visualization should serve a thinking purpose: reveal patterns, compare options, show structure, or guide decisions.
- Keep text responses concise. Let the visuals do the heavy explaining.
"""


# ── Visualization tool schema (given to LLM) ──

VISUAL_TOOL = {
    "name": "render_visual",
    "description": (
        "Render a dynamic visualization to help the user understand data or think through a problem. "
        "Choose the appropriate type based on what you want to communicate."
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "visual_type": {
                "type": "string",
                "enum": ["mindmap", "flowchart", "tree", "network", "timeline", "bar_chart", "pie_chart", "table", "metric_cards", "decision_tree"],
                "description": "The type of visualization to render",
            },
            "title": {
                "type": "string",
                "description": "Title of the visualization",
            },
            "description": {
                "type": "string",
                "description": "Brief explanation of what this visual shows and why",
            },
            "data": {
                "type": "object",
                "description": (
                    "Data for the visualization. Structure depends on visual_type:\n"
                    "- mindmap: {center: str, branches: [{label: str, children: [...]}]}\n"
                    "- flowchart: {nodes: [{id, label, type}], edges: [{source, target, label?}]}\n"
                    "- tree: {label: str, children: [{label, value?, children?}]}\n"
                    "- network: {nodes: [{id, label, group?}], links: [{source, target, label?}]}\n"
                    "- timeline: {events: [{date, title, description?}]}\n"
                    "- bar_chart: {labels: [str], datasets: [{label, values: [number]}]}\n"
                    "- pie_chart: {segments: [{label, value}]}\n"
                    "- table: {columns: [str], rows: [[any]]}\n"
                    "- metric_cards: {cards: [{title, value, change?, unit?}]}\n"
                    "- decision_tree: {question: str, options: [{label, outcome, children?}]}\n"
                ),
            },
        },
        "required": ["visual_type", "title", "data"],
    },
}


class SessionEngine:
    """Drives conversation sessions with dynamic visualization generation."""

    def __init__(self):
        self._sessions: dict[str, Session] = {}

    def get_or_create_session(self, session_id: str | None = None) -> Session:
        if session_id and session_id in self._sessions:
            return self._sessions[session_id]
        session = Session()
        self._sessions[session.id] = session
        return session

    def get_session(self, session_id: str) -> Session | None:
        return self._sessions.get(session_id)

    async def run(
        self,
        session_id: str,
        user_message: str,
        available_tools: list[dict] | None = None,
    ) -> AsyncIterator[SessionEvent]:
        """Process a user message and yield a stream of events."""
        session = self.get_or_create_session(session_id)
        session.add_user_message(user_message)

        # Build tools list: visualization tool + any domain tools
        all_tools = [VISUAL_TOOL]
        tool_lookup: dict[str, dict] = {}
        if available_tools:
            for t in available_tools:
                schema = {
                    "name": t["name"],
                    "description": t.get("description", ""),
                    "input_schema": t.get("parameters_schema", {"type": "object", "properties": {}}),
                }
                all_tools.append(schema)
                tool_lookup[t["name"]] = t

        messages = [
            {"role": "system", "content": ORCHESTRATOR_SYSTEM},
            *session.messages,
        ]

        max_turns = 25
        turn = 0

        while turn < max_turns:
            turn += 1

            yield SessionEvent(type="thinking", content=f"Reasoning (turn {turn})...")

            resp = await llm_gateway.chat(
                model="claude-sonnet-4-20250514",
                messages=messages,
                tools=all_tools,
                max_tokens=4096,
            )

            session.total_cost_cents += resp.cost_cents
            session.total_tokens += resp.input_tokens + resp.output_tokens
            metrics.increment("session.llm_calls", tags={"session": session_id})

            if resp.type == "text":
                session.add_assistant_message(resp.content)
                yield SessionEvent(type="text", content=resp.content)
                yield SessionEvent(type="done", content={
                    "cost_cents": session.total_cost_cents,
                    "tokens": session.total_tokens,
                    "visuals_count": len(session.visuals),
                })
                return

            elif resp.type == "tool_calls":
                # Build assistant message content
                assistant_content: list[dict] = []
                if resp.content:
                    assistant_content.append({"type": "text", "text": resp.content})
                    yield SessionEvent(type="text", content=resp.content)

                for tc in resp.tool_calls:
                    assistant_content.append({
                        "type": "tool_use",
                        "id": tc["id"],
                        "name": tc["name"],
                        "input": tc["arguments"],
                    })

                messages.append({"role": "assistant", "content": assistant_content})

                # Process each tool call
                tool_results: list[dict] = []
                for tc in resp.tool_calls:
                    name = tc["name"]
                    args = tc["arguments"]

                    if name == "render_visual":
                        visual = VisualElement(
                            type=args.get("visual_type", "flowchart"),
                            title=args.get("title", ""),
                            data=args.get("data", {}),
                            description=args.get("description", ""),
                        )
                        session.visuals.append(visual)
                        yield SessionEvent(type="visual", content=visual.to_dict())
                        tool_results.append({
                            "type": "tool_result",
                            "tool_use_id": tc["id"],
                            "content": json.dumps({"status": "rendered", "visual_type": visual.type}),
                        })

                    elif name in tool_lookup:
                        yield SessionEvent(type="tool_call", content={"tool": name, "args": args})
                        try:
                            t_def = tool_lookup[name]
                            result_str = await tool_executor.execute(
                                tool_name=name,
                                tool_args=args,
                                implementation=t_def.get("implementation", "mock"),
                                implementation_config=t_def.get("implementation_config", {}),
                            )
                            yield SessionEvent(type="tool_result", content={"tool": name, "result": result_str[:1000]})
                            tool_results.append({
                                "type": "tool_result",
                                "tool_use_id": tc["id"],
                                "content": result_str,
                            })
                        except Exception as e:
                            error_msg = f"Tool error: {e}"
                            yield SessionEvent(type="error", content={"tool": name, "error": error_msg})
                            tool_results.append({
                                "type": "tool_result",
                                "tool_use_id": tc["id"],
                                "content": json.dumps({"error": error_msg}),
                            })
                    else:
                        tool_results.append({
                            "type": "tool_result",
                            "tool_use_id": tc["id"],
                            "content": json.dumps({"error": f"Unknown tool: {name}"}),
                        })

                messages.append({"role": "user", "content": tool_results})

        yield SessionEvent(type="error", content="Max turns reached")

    def list_sessions(self) -> list[dict]:
        return [
            {"id": s.id, "message_count": len(s.messages), "cost_cents": s.total_cost_cents, "visuals": len(s.visuals)}
            for s in self._sessions.values()
        ]


# singleton
session_engine = SessionEngine()
