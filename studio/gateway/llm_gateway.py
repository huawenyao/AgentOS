"""LLM Gateway — multi-model routing, rate-limiting, cost tracking, fallback."""

from __future__ import annotations

import asyncio
import hashlib
import json
import time
from dataclasses import dataclass, field
from typing import Any, Optional

from loguru import logger

from studio.config import settings


# ── Response wrapper ──


@dataclass
class LLMResponse:
    type: str  # "text" | "tool_calls"
    content: str = ""
    tool_calls: list[dict] = field(default_factory=list)
    raw: dict = field(default_factory=dict)
    input_tokens: int = 0
    output_tokens: int = 0
    cost_cents: int = 0
    model: str = ""
    latency_ms: int = 0


# ── Cost table (per 1M tokens, in cents) ──

_COST_TABLE: dict[str, tuple[float, float]] = {
    # model_prefix: (input_cents_per_1M, output_cents_per_1M)
    "claude-sonnet-4": (300, 1500),
    "claude-3-5-sonnet": (300, 1500),
    "claude-3-5-haiku": (80, 400),
    "gpt-4o": (250, 1000),
    "gpt-4o-mini": (15, 60),
}


def _estimate_cost(model: str, input_tokens: int, output_tokens: int) -> int:
    for prefix, (inp, out) in _COST_TABLE.items():
        if model.startswith(prefix):
            return int((input_tokens * inp + output_tokens * out) / 1_000_000)
    return 0  # unknown model


# ── Simple token-bucket rate limiter ──


class _RateLimiter:
    def __init__(self, rpm: int = 60):
        self._rpm = rpm
        self._tokens = float(rpm)
        self._last = time.monotonic()
        self._lock = asyncio.Lock()

    async def acquire(self):
        async with self._lock:
            now = time.monotonic()
            elapsed = now - self._last
            self._tokens = min(self._rpm, self._tokens + elapsed * (self._rpm / 60.0))
            self._last = now
            if self._tokens < 1:
                wait = (1 - self._tokens) / (self._rpm / 60.0)
                await asyncio.sleep(wait)
                self._tokens = 0
            else:
                self._tokens -= 1


# ── Gateway ──


class LLMGateway:
    """Unified LLM gateway supporting Anthropic and OpenAI providers."""

    def __init__(self):
        self._anthropic = None
        self._openai = None
        self._limiters: dict[str, _RateLimiter] = {}
        self._cache: dict[str, LLMResponse] = {}
        self._total_cost_cents = 0

    # ── lazy init ──

    def _get_anthropic(self):
        if self._anthropic is None:
            import anthropic

            self._anthropic = anthropic.AsyncAnthropic(
                api_key=settings.anthropic_api_key or "sk-placeholder"
            )
        return self._anthropic

    def _get_openai(self):
        if self._openai is None:
            import openai

            self._openai = openai.AsyncOpenAI(
                api_key=settings.openai_api_key or "sk-placeholder"
            )
        return self._openai

    def _limiter(self, model: str) -> _RateLimiter:
        if model not in self._limiters:
            self._limiters[model] = _RateLimiter(rpm=50)
        return self._limiters[model]

    # ── public API ──

    async def chat(
        self,
        *,
        model: str,
        messages: list[dict],
        tools: list[dict] | None = None,
        temperature: float = 0.3,
        max_tokens: int = 4096,
    ) -> LLMResponse:
        await self._limiter(model).acquire()
        t0 = time.monotonic()

        try:
            if model.startswith("claude") or model.startswith("anthropic"):
                resp = await self._call_anthropic(model, messages, tools, temperature, max_tokens)
            elif model.startswith("gpt") or model.startswith("o1") or model.startswith("o3"):
                resp = await self._call_openai(model, messages, tools, temperature, max_tokens)
            else:
                # fallback to anthropic
                resp = await self._call_anthropic(
                    settings.default_model, messages, tools, temperature, max_tokens
                )
        except Exception as e:
            logger.warning(f"LLM call failed ({model}): {e}, trying fallback")
            fallback = "gpt-4o-mini" if model.startswith("claude") else settings.default_model
            resp = await self._call_fallback(fallback, messages, tools, temperature, max_tokens)

        resp.latency_ms = int((time.monotonic() - t0) * 1000)
        resp.cost_cents = _estimate_cost(model, resp.input_tokens, resp.output_tokens)
        self._total_cost_cents += resp.cost_cents
        return resp

    @property
    def total_cost_cents(self) -> int:
        return self._total_cost_cents

    # ── Anthropic ──

    async def _call_anthropic(self, model, messages, tools, temperature, max_tokens) -> LLMResponse:
        client = self._get_anthropic()
        system_msg = ""
        chat_msgs = []
        for m in messages:
            if m["role"] == "system":
                system_msg = m["content"]
            else:
                chat_msgs.append(m)

        kwargs: dict[str, Any] = {
            "model": model,
            "max_tokens": max_tokens,
            "temperature": temperature,
            "messages": chat_msgs,
        }
        if system_msg:
            kwargs["system"] = system_msg
        if tools:
            kwargs["tools"] = tools

        resp = await client.messages.create(**kwargs)

        # parse response
        tool_calls = []
        text_parts = []
        for block in resp.content:
            if block.type == "text":
                text_parts.append(block.text)
            elif block.type == "tool_use":
                tool_calls.append(
                    {"id": block.id, "name": block.name, "arguments": block.input}
                )

        return LLMResponse(
            type="tool_calls" if tool_calls else "text",
            content="\n".join(text_parts),
            tool_calls=tool_calls,
            raw=resp.model_dump() if hasattr(resp, "model_dump") else {},
            input_tokens=resp.usage.input_tokens,
            output_tokens=resp.usage.output_tokens,
            model=model,
        )

    # ── OpenAI ──

    async def _call_openai(self, model, messages, tools, temperature, max_tokens) -> LLMResponse:
        client = self._get_openai()
        kwargs: dict[str, Any] = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }
        if tools:
            kwargs["tools"] = [
                {"type": "function", "function": t} for t in tools
            ]

        resp = await client.chat.completions.create(**kwargs)
        choice = resp.choices[0]
        msg = choice.message

        tool_calls = []
        if msg.tool_calls:
            for tc in msg.tool_calls:
                tool_calls.append({
                    "id": tc.id,
                    "name": tc.function.name,
                    "arguments": json.loads(tc.function.arguments),
                })

        return LLMResponse(
            type="tool_calls" if tool_calls else "text",
            content=msg.content or "",
            tool_calls=tool_calls,
            raw=resp.model_dump() if hasattr(resp, "model_dump") else {},
            input_tokens=resp.usage.prompt_tokens if resp.usage else 0,
            output_tokens=resp.usage.completion_tokens if resp.usage else 0,
            model=model,
        )

    # ── Fallback ──

    async def _call_fallback(self, model, messages, tools, temperature, max_tokens) -> LLMResponse:
        try:
            if model.startswith("claude"):
                return await self._call_anthropic(model, messages, tools, temperature, max_tokens)
            else:
                return await self._call_openai(model, messages, tools, temperature, max_tokens)
        except Exception as e:
            logger.error(f"Fallback LLM call also failed: {e}")
            return LLMResponse(
                type="text",
                content=f"[LLM unavailable: {e}]",
                model=model,
            )


# singleton
llm_gateway = LLMGateway()
