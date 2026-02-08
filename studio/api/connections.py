"""Connection & Tool API routes."""

from __future__ import annotations

import json
from fastapi import APIRouter, HTTPException, UploadFile, File
from sqlalchemy import select

from studio.models import Connection, Tool, async_session
from studio.models.base import new_id
from studio.api.schemas import ConnectionCreate, ConnectionOut, ToolOut, ToolUpdate
from studio.connect.openapi_import import import_openapi_spec

router = APIRouter(prefix="/api/connections", tags=["connections"])


@router.post("", response_model=ConnectionOut)
async def create_connection(body: ConnectionCreate):
    async with async_session() as session:
        conn = Connection(id=new_id(), name=body.name, type=body.type, config=body.config)
        session.add(conn)
        await session.commit()
        await session.refresh(conn)
        return conn


@router.get("", response_model=list[ConnectionOut])
async def list_connections():
    async with async_session() as session:
        result = await session.execute(select(Connection).order_by(Connection.created_at.desc()))
        return result.scalars().all()


@router.get("/{conn_id}", response_model=ConnectionOut)
async def get_connection(conn_id: str):
    async with async_session() as session:
        result = await session.execute(select(Connection).where(Connection.id == conn_id))
        conn = result.scalar_one_or_none()
        if not conn:
            raise HTTPException(404, "Connection not found")
        return conn


@router.delete("/{conn_id}")
async def delete_connection(conn_id: str):
    async with async_session() as session:
        result = await session.execute(select(Connection).where(Connection.id == conn_id))
        conn = result.scalar_one_or_none()
        if not conn:
            raise HTTPException(404, "Connection not found")
        await session.delete(conn)
        await session.commit()
        return {"ok": True}


# ── OpenAPI import ──

@router.post("/{conn_id}/import-openapi", response_model=list[ToolOut])
async def import_openapi(conn_id: str, file: UploadFile = File(...)):
    """Upload an OpenAPI spec and auto-generate tools."""
    async with async_session() as session:
        result = await session.execute(select(Connection).where(Connection.id == conn_id))
        conn = result.scalar_one_or_none()
        if not conn:
            raise HTTPException(404, "Connection not found")

        content = await file.read()
        try:
            spec = json.loads(content)
        except json.JSONDecodeError:
            raise HTTPException(400, "Invalid JSON file")

        tool_dicts = import_openapi_spec(spec, conn_id)
        tools = []
        for td in tool_dicts:
            tool = Tool(**td)
            session.add(tool)
            tools.append(tool)

        await session.commit()
        for t in tools:
            await session.refresh(t)
        return tools


# ── Tool CRUD ──

tools_router = APIRouter(prefix="/api/tools", tags=["tools"])


@tools_router.get("", response_model=list[ToolOut])
async def list_tools(connection_id: str | None = None, enabled: bool | None = None):
    async with async_session() as session:
        q = select(Tool)
        if connection_id:
            q = q.where(Tool.connection_id == connection_id)
        if enabled is not None:
            q = q.where(Tool.enabled == enabled)
        result = await session.execute(q.order_by(Tool.created_at.desc()))
        return result.scalars().all()


@tools_router.get("/{tool_id}", response_model=ToolOut)
async def get_tool(tool_id: str):
    async with async_session() as session:
        result = await session.execute(select(Tool).where(Tool.id == tool_id))
        tool = result.scalar_one_or_none()
        if not tool:
            raise HTTPException(404, "Tool not found")
        return tool


@tools_router.patch("/{tool_id}", response_model=ToolOut)
async def update_tool(tool_id: str, body: ToolUpdate):
    async with async_session() as session:
        result = await session.execute(select(Tool).where(Tool.id == tool_id))
        tool = result.scalar_one_or_none()
        if not tool:
            raise HTTPException(404, "Tool not found")
        for k, v in body.model_dump(exclude_unset=True).items():
            setattr(tool, k, v)
        await session.commit()
        await session.refresh(tool)
        return tool
