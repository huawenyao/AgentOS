"""基础智能体模块

该模块定义了智能体的基本接口和通用功能。
"""

import uuid
import json
import time
from enum import Enum
from typing import Dict, List, Set, Optional, Any, Tuple, Callable, Union
from datetime import datetime
from pydantic import BaseModel, Field, validator
from loguru import logger


class AgentType(str, Enum):
    """智能体类型枚举"""
    PLANNING = "planning"  # 规划智能体
    EXECUTION = "execution"  # 执行智能体
    AUDIT = "audit"  # 审核智能体
    MEMORY = "memory"  # 记忆智能体
    META = "meta"  # 元智能体


class AgentStatus(str, Enum):
    """智能体状态枚举"""
    IDLE = "idle"  # 空闲
    BUSY = "busy"  # 忙碌
    ERROR = "error"  # 错误
    OFFLINE = "offline"  # 离线


class AgentCapability(BaseModel):
    """智能体能力"""
    name: str  # 能力名称
    description: Optional[str] = None  # 能力描述
    parameters: Dict[str, Any] = Field(default_factory=dict)  # 参数
    skill_vector: List[float] = Field(default_factory=list)  # 技能向量
    
    def to_dict(self) -> Dict[str, Any]:
        """转换为字典
        
        Returns:
            Dict[str, Any]: 字典表示
        """
        return {
            "name": self.name,
            "description": self.description,
            "parameters": self.parameters,
            "skill_vector": self.skill_vector
        }


class AgentConfig(BaseModel):
    """智能体配置"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str  # 名称
    type: AgentType  # 类型
    description: Optional[str] = None  # 描述
    capabilities: List[AgentCapability] = Field(default_factory=list)  # 能力列表
    parameters: Dict[str, Any] = Field(default_factory=dict)  # 参数
    agent_model_config: Dict[str, Any] = Field(default_factory=dict)  # 模型配置
    
    def to_dict(self) -> Dict[str, Any]:
        """转换为字典
        
        Returns:
            Dict[str, Any]: 字典表示
        """
        return {
            "id": self.id,
            "name": self.name,
            "type": self.type.value,
            "description": self.description,
            "capabilities": [c.to_dict() for c in self.capabilities],
            "parameters": self.parameters,
            "agent_model_config": self.agent_model_config
        }


class AgentContext(BaseModel):
    """智能体上下文"""
    agent_id: str  # 智能体ID
    session_id: str  # 会话ID
    task_id: Optional[str] = None  # 任务ID
    timestamp: datetime = Field(default_factory=datetime.now)  # 时间戳
    memory: Dict[str, Any] = Field(default_factory=dict)  # 记忆
    environment: Dict[str, Any] = Field(default_factory=dict)  # 环境
    
    def update_memory(self, key: str, value: Any) -> None:
        """更新记忆
        
        Args:
            key: 键
            value: 值
        """
        self.memory[key] = value
    
    def get_memory(self, key: str, default: Any = None) -> Any:
        """获取记忆
        
        Args:
            key: 键
            default: 默认值
            
        Returns:
            Any: 值
        """
        return self.memory.get(key, default)
    
    def clear_memory(self) -> None:
        """清除记忆"""
        self.memory.clear()
    
    def to_dict(self) -> Dict[str, Any]:
        """转换为字典
        
        Returns:
            Dict[str, Any]: 字典表示
        """
        return {
            "agent_id": self.agent_id,
            "session_id": self.session_id,
            "task_id": self.task_id,
            "timestamp": self.timestamp.isoformat(),
            "memory": self.memory,
            "environment": self.environment
        }


class AgentObservation(BaseModel):
    """智能体观察"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    agent_id: str  # 智能体ID
    timestamp: datetime = Field(default_factory=datetime.now)  # 时间戳
    data: Dict[str, Any] = Field(default_factory=dict)  # 数据
    source: str  # 来源
    confidence: float = 1.0  # 置信度
    
    def to_dict(self) -> Dict[str, Any]:
        """转换为字典
        
        Returns:
            Dict[str, Any]: 字典表示
        """
        return {
            "id": self.id,
            "agent_id": self.agent_id,
            "timestamp": self.timestamp.isoformat(),
            "data": self.data,
            "source": self.source,
            "confidence": self.confidence
        }


class AgentAction(BaseModel):
    """智能体动作"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    agent_id: str  # 智能体ID
    timestamp: datetime = Field(default_factory=datetime.now)  # 时间戳
    action_type: str  # 动作类型
    parameters: Dict[str, Any] = Field(default_factory=dict)  # 参数
    priority: int = 0  # 优先级
    timeout: Optional[float] = None  # 超时时间（秒）
    
    def to_dict(self) -> Dict[str, Any]:
        """转换为字典
        
        Returns:
            Dict[str, Any]: 字典表示
        """
        return {
            "id": self.id,
            "agent_id": self.agent_id,
            "timestamp": self.timestamp.isoformat(),
            "action_type": self.action_type,
            "parameters": self.parameters,
            "priority": self.priority,
            "timeout": self.timeout
        }


class AgentResult(BaseModel):
    """智能体结果"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    agent_id: str  # 智能体ID
    action_id: str  # 动作ID
    timestamp: datetime = Field(default_factory=datetime.now)  # 时间戳
    success: bool  # 是否成功
    data: Dict[str, Any] = Field(default_factory=dict)  # 数据
    error: Optional[str] = None  # 错误信息
    
    def to_dict(self) -> Dict[str, Any]:
        """转换为字典
        
        Returns:
            Dict[str, Any]: 字典表示
        """
        return {
            "id": self.id,
            "agent_id": self.agent_id,
            "action_id": self.action_id,
            "timestamp": self.timestamp.isoformat(),
            "success": self.success,
            "data": self.data,
            "error": self.error
        }


class BaseAgent:
    """基础智能体
    
    所有智能体的基类
    """
    def __init__(self, config: AgentConfig):
        """初始化基础智能体
        
        Args:
            config: 智能体配置
        """
        self.id = config.id
        self.name = config.name
        self.type = config.type
        self.description = config.description
        self.capabilities = config.capabilities
        self.parameters = config.parameters
        self.model_config = config.model_config
        self.status = AgentStatus.IDLE
        self.context = None
        self.last_error = None
        self.created_at = datetime.now()
        self.last_active_at = datetime.now()
    
    def initialize(self) -> bool:
        """初始化智能体
        
        Returns:
            bool: 是否成功初始化
        """
        try:
            self._initialize_impl()
            return True
        except Exception as e:
            self.status = AgentStatus.ERROR
            self.last_error = str(e)
            logger.error(f"Agent {self.id} initialization error: {e}")
            return False
    
    def _initialize_impl(self) -> None:
        """初始化实现
        
        子类应该重写此方法以实现特定的初始化逻辑
        """
        pass
    
    def set_context(self, context: AgentContext) -> None:
        """设置上下文
        
        Args:
            context: 智能体上下文
        """
        self.context = context
    
    def observe(self, observation: AgentObservation) -> None:
        """观察
        
        Args:
            observation: 智能体观察
        """
        try:
            self.last_active_at = datetime.now()
            self._observe_impl(observation)
        except Exception as e:
            self.status = AgentStatus.ERROR
            self.last_error = str(e)
            logger.error(f"Agent {self.id} observation error: {e}")
    
    def _observe_impl(self, observation: AgentObservation) -> None:
        """观察实现
        
        子类应该重写此方法以实现特定的观察逻辑
        
        Args:
            observation: 智能体观察
        """
        pass
    
    def act(self) -> Optional[AgentAction]:
        """行动
        
        Returns:
            Optional[AgentAction]: 智能体动作
        """
        try:
            self.status = AgentStatus.BUSY
            self.last_active_at = datetime.now()
            action = self._act_impl()
            self.status = AgentStatus.IDLE
            return action
        except Exception as e:
            self.status = AgentStatus.ERROR
            self.last_error = str(e)
            logger.error(f"Agent {self.id} action error: {e}")
            return None
    
    def _act_impl(self) -> Optional[AgentAction]:
        """行动实现
        
        子类应该重写此方法以实现特定的行动逻辑
        
        Returns:
            Optional[AgentAction]: 智能体动作
        """
        return None
    
    def process_result(self, result: AgentResult) -> None:
        """处理结果
        
        Args:
            result: 智能体结果
        """
        try:
            self.last_active_at = datetime.now()
            self._process_result_impl(result)
        except Exception as e:
            self.status = AgentStatus.ERROR
            self.last_error = str(e)
            logger.error(f"Agent {self.id} result processing error: {e}")
    
    def _process_result_impl(self, result: AgentResult) -> None:
        """处理结果实现
        
        子类应该重写此方法以实现特定的结果处理逻辑
        
        Args:
            result: 智能体结果
        """
        pass
    
    def get_status(self) -> AgentStatus:
        """获取状态
        
        Returns:
            AgentStatus: 智能体状态
        """
        return self.status
    
    def get_info(self) -> Dict[str, Any]:
        """获取信息
        
        Returns:
            Dict[str, Any]: 智能体信息
        """
        return {
            "id": self.id,
            "name": self.name,
            "type": self.type.value,
            "description": self.description,
            "status": self.status.value,
            "capabilities": [c.to_dict() for c in self.capabilities],
            "created_at": self.created_at.isoformat(),
            "last_active_at": self.last_active_at.isoformat(),
            "last_error": self.last_error
        }
    
    def shutdown(self) -> bool:
        """关闭智能体
        
        Returns:
            bool: 是否成功关闭
        """
        try:
            self._shutdown_impl()
            self.status = AgentStatus.OFFLINE
            return True
        except Exception as e:
            self.status = AgentStatus.ERROR
            self.last_error = str(e)
            logger.error(f"Agent {self.id} shutdown error: {e}")
            return False
    
    def _shutdown_impl(self) -> None:
        """关闭实现
        
        子类应该重写此方法以实现特定的关闭逻辑
        """
        pass
    
    def get_capability(self, name: str) -> Optional[AgentCapability]:
        """获取能力
        
        Args:
            name: 能力名称
            
        Returns:
            Optional[AgentCapability]: 智能体能力
        """
        for capability in self.capabilities:
            if capability.name == name:
                return capability
        return None
    
    def has_capability(self, name: str) -> bool:
        """是否有能力
        
        Args:
            name: 能力名称
            
        Returns:
            bool: 是否有能力
        """
        return self.get_capability(name) is not None
    
    def get_skill_vector(self) -> List[float]:
        """获取技能向量
        
        计算所有能力的技能向量的平均值
        
        Returns:
            List[float]: 技能向量
        """
        if not self.capabilities:
            return []
        
        # 确保所有技能向量的长度相同
        vector_length = len(self.capabilities[0].skill_vector)
        if not all(len(c.skill_vector) == vector_length for c in self.capabilities):
            logger.warning(f"Agent {self.id} has capabilities with different skill vector lengths")
            return []
        
        # 计算平均值
        result = [0.0] * vector_length
        for capability in self.capabilities:
            for i, value in enumerate(capability.skill_vector):
                result[i] += value
        
        for i in range(vector_length):
            result[i] /= len(self.capabilities)
        
        return result