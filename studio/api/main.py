"""Agentic Work Studio — FastAPI application entry point."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger

from studio.config import settings
from studio.models.base import engine, Base


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup / shutdown lifecycle."""
    logger.info(f"Starting {settings.app_name}")
    # Create tables (dev convenience — use Alembic in production)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database tables ready")
    yield
    logger.info("Shutting down")
    await engine.dispose()


app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    description="Design, Run, and Measure AI Agent Workflows",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Health ──

@app.get("/health")
async def health():
    return {"status": "ok", "app": settings.app_name}


# ── Register routers ──

from studio.api.sessions import router as sessions_router
from studio.api.connections import router as connections_router, tools_router
from studio.api.agents import router as agents_router
from studio.api.workflows import router as workflows_router, runs_router
from studio.api.approvals import router as approvals_router
from studio.api.metrics_api import router as metrics_router

app.include_router(sessions_router)
app.include_router(connections_router)
app.include_router(tools_router)
app.include_router(agents_router)
app.include_router(workflows_router)
app.include_router(runs_router)
app.include_router(approvals_router)
app.include_router(metrics_router)
