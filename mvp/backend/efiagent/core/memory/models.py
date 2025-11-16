"""
记忆系统数据模型
Memory System Data Models
"""

from dataclasses import dataclass, field
from typing import Dict, List, Optional, Any
from datetime import datetime
from enum import Enum
import numpy as np

class MemoryType(Enum):
    """记忆类型枚举"""
    WORKING = "working"
    LONG_TERM = "long_term"
    META = "meta"

class MemoryStatus(Enum):
    """记忆状态枚举"""
    ACTIVE = "active"
    ARCHIVED = "archived"
    DECAYING = "decaying"
    ENHANCED = "enhanced"

@dataclass
class MemoryChunk:
    """记忆片段基础结构"""
    id: str
    content: str
    embedding: np.ndarray
    timestamp: datetime
    memory_type: MemoryType
    status: MemoryStatus = MemoryStatus.ACTIVE
    access_count: int = 0
    last_access: Optional[datetime] = None
    importance_score: float = 0.5
    decay_rate: float = 0.01
    tags: List[str] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)

    def __post_init__(self):
        if self.last_access is None:
            self.last_access = self.timestamp

@dataclass
class WorkingMemoryState:
    """工作记忆状态"""
    active_chunks: Dict[str, MemoryChunk] = field(default_factory=dict)
    context_window_size: int = 32  # K tokens equivalent
    attention_weights: Dict[str, float] = field(default_factory=dict)
    current_goal: Optional[str] = None
    current_task: Optional[str] = None
    total_tokens: int = 0

    def add_chunk(self, chunk: MemoryChunk):
        """添加记忆片段到工作记忆"""
        # 检查容量限制
        if len(self.active_chunks) >= self.context_window_size:
            self._evict_least_important()

        self.active_chunks[chunk.id] = chunk
        self.attention_weights[chunk.id] = 1.0
        chunk.access_count += 1
        chunk.last_access = datetime.now()

    def _evict_least_important(self):
        """淘汰最不重要的记忆片段"""
        if not self.active_chunks:
            return

        # 基于重要度和访问频率选择淘汰片段
        least_important_id = min(
            self.active_chunks.keys(),
            key=lambda chunk_id: (
                self.active_chunks[chunk_id].importance_score,
                self.active_chunks[chunk_id].access_count
            )
        )

        del self.active_chunks[least_important_id]
        if least_important_id in self.attention_weights:
            del self.attention_weights[least_important_id]

@dataclass
class MetaMemoryEntry:
    """元记忆条目"""
    strategy_name: str
    strategy_description: str
    effectiveness_score: float
    usage_history: List[tuple] = field(default_factory=list)  # (timestamp, task_type, performance)
    learning_patterns: Dict[str, Any] = field(default_factory=dict)
    adaptation_rules: Dict[str, Any] = field(default_factory=dict)
    success_rate: float = 0.0
    last_updated: datetime = field(default_factory=datetime.now)

    def update_usage(self, task_type: str, performance: float):
        """更新策略使用记录"""
        self.usage_history.append((datetime.now(), task_type, performance))

        # 保留最近100次使用记录
        if len(self.usage_history) > 100:
            self.usage_history = self.usage_history[-100:]

        # 更新效果分数
        recent_performances = [record[2] for record in self.usage_history[-20:]]
        self.effectiveness_score = sum(recent_performances) / len(recent_performances)

        # 更新成功率
        success_count = sum(1 for p in recent_performances if p > 0.7)
        self.success_rate = success_count / len(recent_performances)

        self.last_updated = datetime.now()

@dataclass
class MemoryQuery:
    """记忆查询请求"""
    query_text: str
    query_type: MemoryType
    max_results: int = 10
    similarity_threshold: float = 0.7
    filters: Dict[str, Any] = field(default_factory=dict)

@dataclass
class MemorySearchResult:
    """记忆搜索结果"""
    chunks: List[MemoryChunk]
    total_found: int
    search_time: float
    query_embedding: np.ndarray