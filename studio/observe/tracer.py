"""Decision tracer — records the full decision chain for each agent run."""

from __future__ import annotations

import time
from dataclasses import dataclass, field
from typing import Any


@dataclass
class TraceSpan:
    name: str
    type: str  # llm_call | tool_call | decision | handoff
    started_at: float = field(default_factory=time.time)
    ended_at: float = 0.0
    input_data: dict = field(default_factory=dict)
    output_data: dict = field(default_factory=dict)
    metadata: dict = field(default_factory=dict)
    children: list["TraceSpan"] = field(default_factory=list)

    def end(self, output: dict | None = None):
        self.ended_at = time.time()
        if output:
            self.output_data = output

    @property
    def duration_ms(self) -> int:
        if self.ended_at:
            return int((self.ended_at - self.started_at) * 1000)
        return 0

    def to_dict(self) -> dict:
        return {
            "name": self.name,
            "type": self.type,
            "duration_ms": self.duration_ms,
            "input": self.input_data,
            "output": self.output_data,
            "metadata": self.metadata,
            "children": [c.to_dict() for c in self.children],
        }


@dataclass
class Trace:
    """Full trace for a single workflow run or agent session."""

    trace_id: str
    spans: list[TraceSpan] = field(default_factory=list)
    total_cost_cents: int = 0
    total_tokens: int = 0

    def add_span(self, span: TraceSpan):
        self.spans.append(span)

    def to_dict(self) -> dict:
        return {
            "trace_id": self.trace_id,
            "total_cost_cents": self.total_cost_cents,
            "total_tokens": self.total_tokens,
            "spans": [s.to_dict() for s in self.spans],
        }
