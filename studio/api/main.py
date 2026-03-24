"""Agentic Work Studio — FastAPI application."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger

from studio.config import settings
from studio.models.base import engine, Base


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"Starting {settings.app_name}")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database ready")
    yield
    logger.info("Shutting down")
    await engine.dispose()


app = FastAPI(
    title=settings.app_name,
    version="0.2.0",
    description="Say what you need. AI works. Visuals help you think.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_credentials=True,
    allow_methods=["*"], allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {"status": "ok", "app": settings.app_name}


# ── Primary: Session (the main user interface) ──
from studio.api.sessions import router as sessions_router
app.include_router(sessions_router)

# ── Config backstage: data sources & tools ──
from studio.api.connections import router as connections_router, tools_router
app.include_router(connections_router)
app.include_router(tools_router)

# ── Config backstage: agent management ──
from studio.api.agents import router as agents_router
app.include_router(agents_router)

# ── Observability: runs & metrics ──
from studio.api.metrics_api import router as metrics_router
app.include_router(metrics_router)
