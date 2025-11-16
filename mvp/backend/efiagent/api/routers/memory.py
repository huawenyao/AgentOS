"""
记忆系统API路由
Memory System API Routes
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import logging

from ...api.main import get_memory_system

logger = logging.getLogger(__name__)
router = APIRouter()

# 请求/响应模型
class MemoryStoreRequest(BaseModel):
    content: str
    importance: float = 0.5
    context: Optional[Dict[str, Any]] = None
    strategy_used: Optional[str] = None

class MemorySearchRequest(BaseModel):
    query: str
    max_results: int = 10
    include_working: bool = True
    include_long_term: bool = True

class MetaReasoningRequest(BaseModel):
    current_task: str
    performance_feedback: float
    task_context: Optional[Dict[str, Any]] = None

# 记忆系统API端点
@router.post("/store")
async def store_memory(
    request: MemoryStoreRequest,
    memory_system = Depends(get_memory_system)
):
    """存储记忆到三层记忆系统"""
    try:
        memory_id = await memory_system.store_experience(
            content=request.content,
            importance=request.importance,
            context=request.context,
            strategy_used=request.strategy_used
        )

        return {
            "success": True,
            "memory_id": memory_id,
            "message": "Memory stored successfully"
        }

    except Exception as e:
        logger.error(f"Error storing memory: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/search")
async def search_memories(
    request: MemorySearchRequest,
    memory_system = Depends(get_memory_system)
):
    """在三层记忆系统中搜索相关记忆"""
    try:
        results = await memory_system.retrieve_relevant_memories(
            query=request.query,
            max_results=request.max_results,
            include_working=request.include_working,
            include_long_term=request.include_long_term
        )

        # 转换结果为可序列化格式
        serialized_results = []
        for chunk in results:
            serialized_results.append({
                "id": chunk.id,
                "content": chunk.content,
                "importance_score": chunk.importance_score,
                "timestamp": chunk.timestamp,
                "tags": chunk.tags,
                "metadata": chunk.metadata,
                "source": chunk.metadata.get("source", "unknown")
            })

        return {
            "success": True,
            "query": request.query,
            "results": serialized_results,
            "total_found": len(serialized_results)
        }

    except Exception as e:
        logger.error(f"Error searching memories: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/meta-reasoning")
async def meta_reasoning(
    request: MetaReasoningRequest,
    memory_system = Depends(get_memory_system)
):
    """执行元认知推理"""
    try:
        reasoning_result = await memory_system.meta_reasoning(
            current_task=request.current_task,
            performance_feedback=request.performance_feedback,
            task_context=request.task_context
        )

        return {
            "success": True,
            "reasoning_result": reasoning_result
        }

    except Exception as e:
        logger.error(f"Error in meta-reasoning: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/context-summary")
async def get_context_summary(
    memory_system = Depends(get_memory_system)
):
    """获取当前上下文摘要"""
    try:
        summary = await memory_system.get_context_summary()

        return {
            "success": True,
            "context_summary": summary
        }

    except Exception as e:
        logger.error(f"Error getting context summary: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/consolidate")
async def consolidate_memories(
    force: bool = False,
    memory_system = Depends(get_memory_system)
):
    """整合和压缩记忆"""
    try:
        consolidated_count = await memory_system.consolidate_memories(force=force)

        return {
            "success": True,
            "consolidated_count": consolidated_count,
            "message": f"Consolidated {consolidated_count} memories"
        }

    except Exception as e:
        logger.error(f"Error consolidating memories: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/statistics")
async def get_memory_statistics(
    memory_system = Depends(get_memory_system)
):
    """获取记忆系统统计信息"""
    try:
        context_summary = await memory_system.get_context_summary()

        return {
            "success": True,
            "statistics": {
                "working_memory": context_summary.get("working_memory", {}),
                "long_term_memory": context_summary.get("long_term_memory", {}),
                "meta_memory": context_summary.get("meta_memory", {}),
                "system_stats": context_summary.get("system_stats", {})
            }
        }

    except Exception as e:
        logger.error(f"Error getting memory statistics: {e}")
        raise HTTPException(status_code=500, detail=str(e))