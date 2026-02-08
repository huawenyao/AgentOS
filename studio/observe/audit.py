"""Audit log — lightweight hash-chain audit trail."""

from __future__ import annotations

import hashlib
import json
import time
from dataclasses import dataclass, field
from typing import Any

from loguru import logger


@dataclass
class AuditEntry:
    timestamp: float
    action: str
    subject: str
    detail: dict
    success: bool
    hash: str = ""


class AuditLog:
    """Append-only audit log with SHA-256 hash chain."""

    def __init__(self):
        self._entries: list[AuditEntry] = []
        self._last_hash = "0" * 64

    def record(
        self, *, action: str, subject: str, detail: dict[str, Any] | None = None, success: bool = True
    ) -> AuditEntry:
        entry = AuditEntry(
            timestamp=time.time(),
            action=action,
            subject=subject,
            detail=detail or {},
            success=success,
        )
        payload = json.dumps(
            {
                "prev": self._last_hash,
                "ts": entry.timestamp,
                "action": entry.action,
                "subject": entry.subject,
                "ok": entry.success,
            },
            sort_keys=True,
        )
        entry.hash = hashlib.sha256(payload.encode()).hexdigest()
        self._last_hash = entry.hash
        self._entries.append(entry)

        level = "INFO" if success else "WARNING"
        logger.log(level, f"[AUDIT] {action} | {subject} | ok={success}")
        return entry

    def verify_chain(self) -> bool:
        prev = "0" * 64
        for entry in self._entries:
            payload = json.dumps(
                {
                    "prev": prev,
                    "ts": entry.timestamp,
                    "action": entry.action,
                    "subject": entry.subject,
                    "ok": entry.success,
                },
                sort_keys=True,
            )
            expected = hashlib.sha256(payload.encode()).hexdigest()
            if entry.hash != expected:
                return False
            prev = entry.hash
        return True

    @property
    def entries(self) -> list[AuditEntry]:
        return list(self._entries)

    def recent(self, n: int = 50) -> list[AuditEntry]:
        return self._entries[-n:]


# singleton
audit_log = AuditLog()
