"""Metrics collector — aggregates run/cost/quality metrics."""

from __future__ import annotations

import time
from collections import defaultdict
from dataclasses import dataclass, field
from typing import Any


@dataclass
class MetricPoint:
    name: str
    value: float
    tags: dict[str, str] = field(default_factory=dict)
    timestamp: float = field(default_factory=time.time)


class MetricsCollector:
    """In-memory metrics aggregator.  In production, plug into Prometheus/InfluxDB."""

    def __init__(self):
        self._counters: dict[str, float] = defaultdict(float)
        self._gauges: dict[str, float] = {}
        self._history: list[MetricPoint] = []

    def increment(self, name: str, value: float = 1.0, tags: dict | None = None):
        key = self._key(name, tags)
        self._counters[key] += value
        self._history.append(MetricPoint(name=name, value=value, tags=tags or {}))

    def gauge(self, name: str, value: float, tags: dict | None = None):
        key = self._key(name, tags)
        self._gauges[key] = value

    def get_counter(self, name: str, tags: dict | None = None) -> float:
        return self._counters.get(self._key(name, tags), 0.0)

    def get_gauge(self, name: str, tags: dict | None = None) -> float:
        return self._gauges.get(self._key(name, tags), 0.0)

    def summary(self) -> dict[str, Any]:
        return {
            "counters": dict(self._counters),
            "gauges": dict(self._gauges),
        }

    @staticmethod
    def _key(name: str, tags: dict | None) -> str:
        if not tags:
            return name
        tag_str = ",".join(f"{k}={v}" for k, v in sorted((tags or {}).items()))
        return f"{name}{{{tag_str}}}"


# singleton
metrics = MetricsCollector()
