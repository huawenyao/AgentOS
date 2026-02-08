"""Rule Engine — safe expression evaluation for rule nodes and edge conditions."""

from __future__ import annotations

from typing import Any

from loguru import logger


# Safe builtins allowed in rule expressions
_SAFE_BUILTINS = {
    "len": len, "str": str, "int": int, "float": float, "bool": bool,
    "sum": sum, "min": min, "max": max, "abs": abs, "round": round,
    "sorted": sorted, "list": list, "dict": dict, "tuple": tuple,
    "True": True, "False": False, "None": None,
    "any": any, "all": all,
}


class RuleEngine:
    """Evaluate Python expressions in a sandboxed environment."""

    def evaluate(self, expression: str, context: dict[str, Any]) -> Any:
        """Evaluate a rule expression against the given context.

        Args:
            expression: Python expression string (e.g. ``data['amount'] > 1000``)
            context: Variables available to the expression.

        Returns:
            The evaluation result (usually bool for conditions).
        """
        if not expression or not expression.strip():
            return True  # empty condition = always true

        namespace = {"__builtins__": _SAFE_BUILTINS}
        # flatten context — support both data.x and data['x'] access
        namespace.update(context)
        # also add a 'data' alias
        namespace.setdefault("data", context)

        try:
            result = eval(expression, namespace)  # noqa: S307
            return result
        except Exception as e:
            logger.warning(f"Rule evaluation failed: '{expression}' → {e}")
            return False

    def validate(self, expression: str) -> tuple[bool, str]:
        """Check if an expression is syntactically valid."""
        try:
            compile(expression, "<rule>", "eval")
            return True, "ok"
        except SyntaxError as e:
            return False, str(e)


# singleton
rule_engine = RuleEngine()
