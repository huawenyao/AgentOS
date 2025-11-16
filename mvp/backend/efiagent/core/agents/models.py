"""
智能体框架数据模型
Agent Framework Data Models
"""

from dataclasses import dataclass, field
from typing import Dict, List, Optional, Any, Union
from datetime import datetime
from enum import Enum
import uuid

class AgentType(Enum):
    """智能体类型枚举"""
    PLANNING = "planning"
    EXECUTION = "execution"
    AUDIT = "audit"
    COORDINATION = "coordination"
    MEMORY = "memory"

class AgentStatus(Enum):
    """智能体状态枚举"""
    IDLE = "idle"
    BUSY = "busy"
    ERROR = "error"
    OFFLINE = "offline"
    INITIALIZING = "initializing"

class MessageType(Enum):
    """消息类型枚举"""
    TASK_REQUEST = "task_request"
    TASK_RESPONSE = "task_response"
    STATUS_UPDATE = "status_update"
    COLLABORATION_REQUEST = "collaboration_request"
    COLLABORATION_RESPONSE = "collaboration_response"
    ERROR_REPORT = "error_report"
    HEARTBEAT = "heartbeat"

class TaskStatus(Enum):
    """任务状态枚举"""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

@dataclass
class Capability:
    """能力定义"""
    id: str
    name: str
    description: str
    input_schema: Dict[str, Any]
    output_schema: Dict[str, Any]
    complexity_level: int = 1  # 1-10
    resource_requirements: Dict[str, Any] = field(default_factory=dict)
    dependencies: List[str] = field(default_factory=list)

@dataclass
class AgentProfile:
    """智能体画像"""
    agent_id: str
    agent_type: AgentType
    capabilities: List[Capability]
    max_concurrent_tasks: int = 5
    performance_metrics: Dict[str, float] = field(default_factory=dict)
    learning_history: List[Dict[str, Any]] = field(default_factory=list)
    collaboration_preferences: Dict[str, float] = field(default_factory=dict)

@dataclass
class Task:
    """任务定义"""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    name: str = ""
    description: str = ""
    task_type: str = "general"
    required_capabilities: List[str] = field(default_factory=list)
    input_data: Dict[str, Any] = field(default_factory=dict)
    output_data: Dict[str, Any] = field(default_factory=dict)
    priority: int = 5  # 1-10
    status: TaskStatus = TaskStatus.PENDING
    assigned_agent_id: Optional[str] = None
    created_at: datetime = field(default_factory=datetime.now)
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    error_message: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)

@dataclass
class Message:
    """消息定义"""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    sender_id: str = ""
    receiver_id: str = ""
    message_type: MessageType = MessageType.TASK_REQUEST
    payload: Dict[str, Any] = field(default_factory=dict)
    timestamp: datetime = field(default_factory=datetime.now)
    requires_ack: bool = True
    timeout: float = 30.0
    retry_count: int = 0
    max_retries: int = 3

@dataclass
class CollaborationPlan:
    """协作计划"""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    task_id: str = ""
    participating_agents: List[str] = field(default_factory=list)
    coordination_strategy: str = "sequential"  # sequential, parallel, pipeline
    dependencies: Dict[str, List[str]] = field(default_factory=dict)
    communication_patterns: Dict[str, str] = field(default_factory=dict)
    estimated_duration: float = 0.0
    created_at: datetime = field(default_factory=datetime.now)

@dataclass
class AgentMetrics:
    """智能体性能指标"""
    agent_id: str
    tasks_completed: int = 0
    tasks_failed: int = 0
    average_task_duration: float = 0.0
    success_rate: float = 0.0
    resource_usage: Dict[str, float] = field(default_factory=dict)
    collaboration_score: float = 0.0
    learning_velocity: float = 0.0
    last_updated: datetime = field(default_factory=datetime.now)

@dataclass
class AgentConfig:
    """智能体配置"""
    agent_id: str
    agent_type: AgentType
    capabilities: List[Dict[str, Any]]
    max_concurrent_tasks: int = 5
    resource_limits: Dict[str, Any] = field(default_factory=dict)
    communication_preferences: Dict[str, Any] = field(default_factory=dict)
    learning_config: Dict[str, Any] = field(default_factory=dict)
    security_config: Dict[str, Any] = field(default_factory=dict)