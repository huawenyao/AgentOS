"""Application configuration — loaded from environment variables."""

from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # ── App ──
    app_name: str = "Agentic Work Studio"
    debug: bool = False

    # ── Database ──
    database_url: str = "postgresql+asyncpg://studio:studio@localhost:5432/studio"

    # ── Redis ──
    redis_url: str = "redis://localhost:6379/0"

    # ── LLM Providers ──
    anthropic_api_key: Optional[str] = None
    openai_api_key: Optional[str] = None
    default_model: str = "claude-sonnet-4-20250514"

    # ── Runtime Defaults ──
    default_max_turns: int = 20
    default_max_cost_cents: int = 500
    default_timeout_seconds: int = 300

    model_config = {"env_prefix": "STUDIO_", "env_file": ".env"}


settings = Settings()
