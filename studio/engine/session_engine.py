"""Session Engine — the heart of Agentic Work Studio.

Users speak natural language. This engine:
1. Understands intent
2. Plans and executes work autonomously
3. Streams results back (text + visuals + tool calls)
4. Generates dynamic visualizations as thinking aids
5. Supports follow-up questions referencing previous visuals
"""

from __future__ import annotations

import json
import time
from dataclasses import dataclass, field
from typing import Any, AsyncIterator
from uuid import uuid4

from loguru import logger

from studio.gateway.llm_gateway import llm_gateway
from studio.engine.tool_executor import tool_executor
from studio.observe.audit import audit_log
from studio.observe.metrics import metrics


# ═══════════════════════════════════════════════════════════════
# Data types
# ═══════════════════════════════════════════════════════════════

@dataclass
class Visual:
    """A dynamic visualization generated during a session."""
    id: str = field(default_factory=lambda: uuid4().hex[:8])
    type: str = ""        # mindmap | flowchart | tree | network | timeline | bar_chart | pie_chart | table | metric_cards | decision_tree
    title: str = ""
    data: dict = field(default_factory=dict)
    description: str = ""

    def to_dict(self) -> dict:
        return {"id": self.id, "type": self.type, "title": self.title,
                "data": self.data, "description": self.description}


@dataclass
class SessionEvent:
    """One event in the SSE stream to the frontend."""
    type: str   # thinking | text | visual | tool_call | tool_result | approval | done | error
    content: Any
    ts: float = field(default_factory=time.time)

    def to_dict(self) -> dict:
        return {"type": self.type, "content": self.content, "ts": self.ts}


@dataclass
class Session:
    id: str = field(default_factory=lambda: uuid4().hex)
    messages: list[dict] = field(default_factory=list)
    visuals: list[Visual] = field(default_factory=list)
    total_cost_cents: int = 0
    total_tokens: int = 0
    title: str = ""

    def add_user(self, text: str):
        self.messages.append({"role": "user", "content": text})
        if not self.title and len(text) > 0:
            self.title = text[:50]

    def add_assistant(self, text: str):
        self.messages.append({"role": "assistant", "content": text})

    def visuals_summary(self) -> str:
        """Compact summary of existing visuals so AI can reference them in follow-ups."""
        if not self.visuals:
            return ""
        parts = []
        for v in self.visuals:
            parts.append(f"[Visual #{v.id} type={v.type}] {v.title}")
        return "\n".join(parts)


# ═══════════════════════════════════════════════════════════════
# System prompt — the soul of the product
# ═══════════════════════════════════════════════════════════════

SYSTEM_PROMPT = """You are the AI engine of Agentic Work Studio — an intelligent workspace where business professionals get work done by talking to you.

## Your Role
You are not a chatbot. You are an autonomous work partner. When the user describes a task, you:
1. UNDERSTAND their intent — what business problem they're trying to solve
2. PLAN the steps — break it into concrete actions
3. EXECUTE — call tools to get data, compute, search
4. THINK VISUALLY — proactively generate visualizations that help the user *think*

## Visualization Philosophy
Visualizations are your most powerful capability. Use them to:
- **Reveal structure** → mindmap, tree (when the user needs to see the big picture)
- **Show trends** → timeline, bar_chart (when temporal patterns matter)
- **Compare options** → table, bar_chart (when the user must choose)
- **Map relationships** → network (when connections and influences matter)
- **Support decisions** → decision_tree (when trade-offs need to be weighed)
- **Quantify status** → metric_cards (when numbers tell the story)
- **Show composition** → pie_chart (when parts-of-whole matters)

Rules:
- Generate visuals PROACTIVELY. Don't wait for the user to ask "show me a chart".
- Each visual must serve a THINKING PURPOSE. State why in the description field.
- In a typical analysis, generate 2-4 visuals that tell a coherent story.
- Visuals appear in a side panel. Keep your text concise — let visuals do the explaining.
- The user can refer to visuals by content or by #id. Handle follow-ups naturally.

## Follow-up Handling
When the user says things like:
- "展开这个分支" → they mean a node in the most recent tree/mindmap
- "3月那个高峰是怎么回事" → they're pointing at a data point in a chart
- "第二个图表再细化一下" → they mean visual #2
Always understand what they're referencing and go deeper.

## Language
- Match the user's language. If they speak Chinese, respond in Chinese.
- Be direct and professional. No filler. Conclusions first, details on request.

## Available Visuals
{visuals_context}
"""

# ═══════════════════════════════════════════════════════════════
# Tool schema given to LLM — the render_visual tool
# ═══════════════════════════════════════════════════════════════

RENDER_VISUAL_TOOL = {
    "name": "render_visual",
    "description": (
        "Generate a dynamic visualization to help the user understand information or think through a problem. "
        "Choose the type based on what THINKING PURPOSE it serves."
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "visual_type": {
                "type": "string",
                "enum": [
                    "mindmap", "flowchart", "tree", "network", "timeline",
                    "bar_chart", "pie_chart", "table", "metric_cards", "decision_tree",
                ],
                "description": "Type of visualization. Choose based on thinking purpose, not data shape.",
            },
            "title": {
                "type": "string",
                "description": "Describe WHAT THE USER WILL SEE, not the chart type. e.g. '客户投诉按类别分布' not '饼图'",
            },
            "description": {
                "type": "string",
                "description": "One sentence: why this visual helps the user think. e.g. '帮你看到产品质量(43%)是最大问题类别'",
            },
            "data": {
                "type": "object",
                "description": (
                    "Data payload. Structure by type:\n"
                    "- mindmap: {center, branches: [{label, children: [...]}]}\n"
                    "- tree: {label, children: [{label, value?, children?}]}\n"
                    "- flowchart: {nodes: [{id, label}], edges: [{source, target, label?}]}\n"
                    "- network: {nodes: [{id, label, group?}], links: [{source, target, label?}]}\n"
                    "- timeline: {events: [{date, title, description?}]}\n"
                    "- bar_chart: {labels: [str], datasets: [{label, values: [num]}]}\n"
                    "- pie_chart: {segments: [{label, value}]}\n"
                    "- table: {columns: [str], rows: [[val]]}\n"
                    "- metric_cards: {cards: [{title, value, change?, unit?}]}\n"
                    "- decision_tree: {question, options: [{label, outcome, children?}]}\n"
                ),
            },
        },
        "required": ["visual_type", "title", "data"],
    },
}


# ═══════════════════════════════════════════════════════════════
# Engine
# ═══════════════════════════════════════════════════════════════

class SessionEngine:
    def __init__(self):
        self._sessions: dict[str, Session] = {}

    def get_or_create(self, session_id: str | None = None) -> Session:
        if session_id and session_id in self._sessions:
            return self._sessions[session_id]
        s = Session()
        self._sessions[s.id] = s
        return s

    def get(self, sid: str) -> Session | None:
        return self._sessions.get(sid)

    def list_sessions(self) -> list[dict]:
        return [
            {"id": s.id, "title": s.title, "messages": len(s.messages),
             "visuals": len(s.visuals), "cost_cents": s.total_cost_cents}
            for s in sorted(self._sessions.values(), key=lambda x: x.id, reverse=True)
        ]

    def delete_session(self, sid: str) -> bool:
        return self._sessions.pop(sid, None) is not None

    async def run(
        self,
        session_id: str,
        user_message: str,
        available_tools: list[dict] | None = None,
    ) -> AsyncIterator[SessionEvent]:
        session = self.get_or_create(session_id)
        session.add_user(user_message)

        # Build tool list: render_visual + domain tools
        all_tools = [RENDER_VISUAL_TOOL]
        tool_lookup: dict[str, dict] = {}
        for t in (available_tools or []):
            schema = {
                "name": t["name"],
                "description": t.get("description", ""),
                "input_schema": t.get("parameters_schema", {"type": "object", "properties": {}}),
            }
            all_tools.append(schema)
            tool_lookup[t["name"]] = t

        # Build system prompt with visual context for follow-ups
        visuals_ctx = session.visuals_summary() or "(No visuals generated yet)"
        system = SYSTEM_PROMPT.replace("{visuals_context}", visuals_ctx)

        messages = [
            {"role": "system", "content": system},
            *session.messages,
        ]

        max_turns = 25
        for turn in range(max_turns):
            yield SessionEvent(type="thinking", content=f"Turn {turn + 1}")

            resp = await llm_gateway.chat(
                model="claude-sonnet-4-20250514",
                messages=messages,
                tools=all_tools,
                max_tokens=4096,
            )
            session.total_cost_cents += resp.cost_cents
            session.total_tokens += resp.input_tokens + resp.output_tokens
            metrics.increment("session.turns", tags={"session": session.id})

            # ── Text response → done ──
            if resp.type == "text":
                session.add_assistant(resp.content)
                yield SessionEvent(type="text", content=resp.content)
                yield SessionEvent(type="done", content={
                    "session_id": session.id,
                    "cost_cents": session.total_cost_cents,
                    "tokens": session.total_tokens,
                    "visuals": len(session.visuals),
                })
                return

            # ── Tool calls ──
            elif resp.type == "tool_calls":
                # Emit any interleaved text
                if resp.content:
                    yield SessionEvent(type="text", content=resp.content)

                assistant_blocks: list[dict] = []
                if resp.content:
                    assistant_blocks.append({"type": "text", "text": resp.content})
                for tc in resp.tool_calls:
                    assistant_blocks.append({
                        "type": "tool_use", "id": tc["id"],
                        "name": tc["name"], "input": tc["arguments"],
                    })
                messages.append({"role": "assistant", "content": assistant_blocks})

                tool_results: list[dict] = []
                for tc in resp.tool_calls:
                    name, args, tid = tc["name"], tc["arguments"], tc["id"]

                    if name == "render_visual":
                        v = Visual(
                            type=args.get("visual_type", ""),
                            title=args.get("title", ""),
                            data=args.get("data", {}),
                            description=args.get("description", ""),
                        )
                        session.visuals.append(v)
                        yield SessionEvent(type="visual", content=v.to_dict())
                        tool_results.append({
                            "type": "tool_result", "tool_use_id": tid,
                            "content": json.dumps({"rendered": True, "visual_id": v.id}),
                        })

                    elif name in tool_lookup:
                        yield SessionEvent(type="tool_call", content={"tool": name, "args": args})
                        try:
                            t_def = tool_lookup[name]
                            result_str = await tool_executor.execute(
                                tool_name=name, tool_args=args,
                                implementation=t_def.get("implementation", "mock"),
                                implementation_config=t_def.get("implementation_config", {}),
                            )
                            yield SessionEvent(type="tool_result", content={"tool": name, "result": result_str[:2000]})
                            tool_results.append({"type": "tool_result", "tool_use_id": tid, "content": result_str})
                        except Exception as e:
                            err = f"Tool error: {e}"
                            yield SessionEvent(type="error", content={"tool": name, "error": err})
                            tool_results.append({"type": "tool_result", "tool_use_id": tid, "content": json.dumps({"error": err})})
                    else:
                        tool_results.append({"type": "tool_result", "tool_use_id": tid, "content": json.dumps({"error": f"Unknown tool: {name}"})})

                messages.append({"role": "user", "content": tool_results})

        yield SessionEvent(type="error", content="Max turns reached")


# singleton
session_engine = SessionEngine()
