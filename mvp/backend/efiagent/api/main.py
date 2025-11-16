"""
EFIAgent API主入口
EFIAgent API Main Entry Point
"""

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging
import time
from contextlib import asynccontextmanager

from ..core.memory.memory_system import ThreeLayerMemorySystem
from ..core.agents.agent_manager import AgentManager
from .routers import memory, agents, tasks, collaboration

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 全局实例
memory_system = None
agent_manager = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期管理"""
    # 启动时初始化
    logger.info("Starting EFIAgent API...")

    global memory_system, agent_manager

    try:
        # 初始化记忆系统
        memory_system = ThreeLayerMemorySystem()
        memory_init_success = await memory_system.initialize()

        if not memory_init_success:
            logger.error("Failed to initialize memory system")
            raise Exception("Memory system initialization failed")

        # 初始化智能体管理器
        agent_manager = AgentManager(memory_system)
        agent_init_success = await agent_manager.initialize()

        if not agent_init_success:
            logger.error("Failed to initialize agent manager")
            raise Exception("Agent manager initialization failed")

        logger.info("EFIAgent API initialized successfully")

        yield

    except Exception as e:
        logger.error(f"Failed to start EFIAgent API: {e}")
        raise
    finally:
        # 关闭时清理
        logger.info("Shutting down EFIAgent API...")

        if agent_manager:
            await agent_manager.shutdown()

        if memory_system:
            await memory_system.shutdown()

        logger.info("EFIAgent API shutdown completed")

# 创建FastAPI应用
app = FastAPI(
    title="EFIAgent API",
    description="以能力为中心的企业级多智能体协作系统API",
    version="0.1.0-mvp",
    lifespan=lifespan
)

# 添加CORS中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 生产环境中应该限制具体域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 添加请求日志中间件
@app.middleware("http")
async def log_requests(request, call_next):
    start_time = time.time()

    response = await call_next(request)

    process_time = time.time() - start_time
    logger.info(f"{request.method} {request.url.path} - {response.status_code} - {process_time:.4f}s")

    response.headers["X-Process-Time"] = str(process_time)
    return response

# 健康检查端点
@app.get("/health")
async def health_check():
    """健康检查"""
    return {
        "status": "healthy",
        "timestamp": time.time(),
        "version": "0.1.0-mvp",
        "services": {
            "memory_system": memory_system is not None,
            "agent_manager": agent_manager is not None
        }
    }

@app.get("/")
async def root():
    """根端点"""
    return {
        "message": "EFIAgent API - 企业级多智能体协作系统",
        "version": "0.1.0-mvp",
        "docs": "/docs",
        "health": "/health"
    }

# 依赖注入函数
def get_memory_system():
    """获取记忆系统实例"""
    if memory_system is None:
        raise HTTPException(status_code=503, detail="Memory system not available")
    return memory_system

def get_agent_manager():
    """获取智能体管理器实例"""
    if agent_manager is None:
        raise HTTPException(status_code=503, detail="Agent manager not available")
    return agent_manager

# 注册路由
app.include_router(memory.router, prefix="/api/v1/memory", tags=["Memory"])
app.include_router(agents.router, prefix="/api/v1/agents", tags=["Agents"])
app.include_router(tasks.router, prefix="/api/v1/tasks", tags=["Tasks"])
app.include_router(collaboration.router, prefix="/api/v1/collaboration", tags=["Collaboration"])

# 全局异常处理
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.error(f"Global exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "message": "An unexpected error occurred",
            "timestamp": time.time()
        }
    )

@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.detail,
            "status_code": exc.status_code,
            "timestamp": time.time()
        }
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)