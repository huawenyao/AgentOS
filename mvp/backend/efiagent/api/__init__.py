"""
EFIAgent API模块
EFIAgent API Module

提供RESTful API接口用于智能体管理和交互
"""

from .main import app
from .routers import memory, agents, tasks, collaboration

__all__ = ["app"]