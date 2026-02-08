"""Tool Executor — runs tools with timeout, retry, and audit logging."""

from __future__ import annotations

import asyncio
import json
import time
from typing import Any

import httpx
from loguru import logger

from studio.observe.audit import audit_log


class ToolTimeoutError(Exception):
    pass


class ToolExecutionError(Exception):
    pass


class ToolExecutor:
    """Execute tools by implementation type with timeout and retry."""

    def __init__(self):
        self._http_client: httpx.AsyncClient | None = None

    async def _get_http(self) -> httpx.AsyncClient:
        if self._http_client is None or self._http_client.is_closed:
            self._http_client = httpx.AsyncClient(timeout=30)
        return self._http_client

    async def execute(
        self,
        *,
        tool_name: str,
        tool_args: dict[str, Any],
        implementation: str = "http",
        implementation_config: dict[str, Any] | None = None,
        timeout: int = 30,
        retry_count: int = 2,
    ) -> str:
        """Execute a tool and return the result as a JSON string."""
        config = implementation_config or {}
        last_error: Exception | None = None

        for attempt in range(retry_count + 1):
            t0 = time.monotonic()
            try:
                async with asyncio.timeout(timeout):
                    if implementation == "http":
                        result = await self._exec_http(tool_name, tool_args, config)
                    elif implementation == "python":
                        result = await self._exec_python(tool_name, tool_args, config)
                    elif implementation == "sql":
                        result = await self._exec_sql(tool_name, tool_args, config)
                    elif implementation == "retrieval":
                        result = await self._exec_retrieval(tool_name, tool_args, config)
                    elif implementation == "mock":
                        result = await self._exec_mock(tool_name, tool_args, config)
                    else:
                        raise ToolExecutionError(f"Unknown implementation: {implementation}")

                elapsed = int((time.monotonic() - t0) * 1000)
                audit_log.record(
                    action="tool_call",
                    subject=tool_name,
                    detail={"args": tool_args, "elapsed_ms": elapsed, "attempt": attempt},
                    success=True,
                )
                return json.dumps(result, ensure_ascii=False, default=str)

            except asyncio.TimeoutError:
                last_error = ToolTimeoutError(
                    f"Tool '{tool_name}' timed out after {timeout}s (attempt {attempt + 1})"
                )
                logger.warning(str(last_error))
            except Exception as e:
                last_error = e
                logger.warning(f"Tool '{tool_name}' failed (attempt {attempt + 1}): {e}")

            if attempt < retry_count:
                await asyncio.sleep(min(2**attempt, 8))

        audit_log.record(
            action="tool_call",
            subject=tool_name,
            detail={"args": tool_args, "error": str(last_error)},
            success=False,
        )
        raise last_error  # type: ignore

    # ── HTTP executor ──

    async def _exec_http(self, name: str, args: dict, config: dict) -> Any:
        client = await self._get_http()
        method = config.get("method", "GET").upper()
        url = config.get("url", "")
        headers = config.get("headers", {})
        # inject args into url path params or query
        for k, v in args.items():
            placeholder = f"{{{k}}}"
            if placeholder in url:
                url = url.replace(placeholder, str(v))
        if method == "GET":
            resp = await client.get(url, params=args, headers=headers)
        elif method == "POST":
            resp = await client.post(url, json=args, headers=headers)
        elif method == "PUT":
            resp = await client.put(url, json=args, headers=headers)
        elif method == "DELETE":
            resp = await client.delete(url, params=args, headers=headers)
        else:
            resp = await client.request(method, url, json=args, headers=headers)
        resp.raise_for_status()
        try:
            return resp.json()
        except Exception:
            return {"text": resp.text}

    # ── Python executor (sandboxed eval) ──

    async def _exec_python(self, name: str, args: dict, config: dict) -> Any:
        expression = config.get("expression", "")
        if not expression:
            return {"error": "No expression configured"}
        # safe eval with limited builtins
        allowed = {"__builtins__": {"len": len, "str": str, "int": int, "float": float, "sum": sum, "min": min, "max": max, "abs": abs, "round": round, "sorted": sorted, "list": list, "dict": dict, "True": True, "False": False, "None": None}}
        allowed.update(args)
        try:
            return {"result": eval(expression, allowed)}
        except Exception as e:
            return {"error": str(e)}

    # ── SQL executor (placeholder) ──

    async def _exec_sql(self, name: str, args: dict, config: dict) -> Any:
        # In production, this would connect to the configured database
        query = config.get("query", "")
        return {"query": query, "args": args, "note": "SQL execution placeholder"}

    # ── Retrieval executor (placeholder) ──

    async def _exec_retrieval(self, name: str, args: dict, config: dict) -> Any:
        question = args.get("question", args.get("query", ""))
        return {
            "results": [
                {"content": f"[Knowledge base result for: {question}]", "score": 0.95}
            ]
        }

    # ── Mock executor (for testing) ──

    async def _exec_mock(self, name: str, args: dict, config: dict) -> Any:
        mock_response = config.get("mock_response", {"status": "ok", "tool": name, "args": args})
        return mock_response

    async def close(self):
        if self._http_client and not self._http_client.is_closed:
            await self._http_client.aclose()


# singleton
tool_executor = ToolExecutor()
