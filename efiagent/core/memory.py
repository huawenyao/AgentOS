"""分布式记忆体架构模块

该模块实现了三层记忆存储架构，包括工作记忆、短期记忆和长期记忆，
以及基于向量时钟的事件排序和状态冲突解决机制。
"""

import json
import time
import uuid
from enum import Enum
from typing import Dict, List, Any, Optional, Set, Tuple, Union
from datetime import datetime, timedelta
from pydantic import BaseModel, Field
from loguru import logger

# 尝试导入外部依赖
try:
    import redis
    import etcd3
    from neo4j import GraphDatabase
    EXTERNAL_DEPS_AVAILABLE = True
except ImportError:
    EXTERNAL_DEPS_AVAILABLE = False
    logger.warning("外部依赖未安装，将使用模拟存储")


class MemoryLevel(str, Enum):
    """记忆层级枚举"""
    WORKING = "working"  # 工作记忆
    SHORT_TERM = "short_term"  # 短期记忆
    LONG_TERM = "long_term"  # 长期记忆


class MemoryType(str, Enum):
    """记忆类型枚举"""
    TASK_CONTEXT = "task_context"  # 任务上下文
    STATE_SNAPSHOT = "state_snapshot"  # 状态快照
    DOMAIN_KNOWLEDGE = "domain_knowledge"  # 领域知识
    DECISION_HISTORY = "decision_history"  # 决策历史


class VectorClock(BaseModel):
    """向量时钟
    
    用于事件排序和冲突检测
    """
    agent_timestamps: Dict[str, int] = Field(default_factory=dict)  # 智能体时间戳字典
    
    def increment(self, agent_id: str) -> None:
        """递增智能体时间戳
        
        Args:
            agent_id: 智能体ID
        """
        self.agent_timestamps[agent_id] = self.agent_timestamps.get(agent_id, 0) + 1
    
    def merge(self, other: "VectorClock") -> None:
        """合并向量时钟
        
        取两个向量时钟中每个智能体的最大时间戳
        
        Args:
            other: 另一个向量时钟
        """
        for agent_id, timestamp in other.agent_timestamps.items():
            self.agent_timestamps[agent_id] = max(
                self.agent_timestamps.get(agent_id, 0),
                timestamp
            )
    
    def is_concurrent_with(self, other: "VectorClock") -> bool:
        """检查是否与另一个向量时钟并发
        
        如果两个向量时钟互不包含，则它们是并发的
        
        Args:
            other: 另一个向量时钟
            
        Returns:
            bool: 是否并发
        """
        # 检查self是否大于等于other
        self_gte_other = True
        for agent_id, timestamp in other.agent_timestamps.items():
            if self.agent_timestamps.get(agent_id, 0) < timestamp:
                self_gte_other = False
                break
        
        # 检查other是否大于等于self
        other_gte_self = True
        for agent_id, timestamp in self.agent_timestamps.items():
            if other.agent_timestamps.get(agent_id, 0) < timestamp:
                other_gte_self = False
                break
        
        # 如果两者互不包含，则它们是并发的
        return not (self_gte_other or other_gte_self)
    
    def is_before(self, other: "VectorClock") -> bool:
        """检查是否在另一个向量时钟之前
        
        如果self的所有时间戳都小于等于other的对应时间戳，且至少有一个小于，则self在other之前
        
        Args:
            other: 另一个向量时钟
            
        Returns:
            bool: 是否在之前
        """
        has_smaller = False
        for agent_id, timestamp in self.agent_timestamps.items():
            other_timestamp = other.agent_timestamps.get(agent_id, 0)
            if timestamp > other_timestamp:
                return False
            if timestamp < other_timestamp:
                has_smaller = True
        
        # 检查other中是否有self中不存在的智能体
        for agent_id in other.agent_timestamps:
            if agent_id not in self.agent_timestamps and other.agent_timestamps[agent_id] > 0:
                has_smaller = True
        
        return has_smaller


class MemoryEntry(BaseModel):
    """记忆条目
    
    记忆体中的基本存储单元
    """
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))  # 记忆条目ID
    key: str  # 记忆键
    value: Any  # 记忆值
    level: MemoryLevel  # 记忆层级
    type: MemoryType  # 记忆类型
    agent_id: str  # 创建智能体ID
    vector_clock: VectorClock  # 向量时钟
    created_at: datetime = Field(default_factory=datetime.now)  # 创建时间
    expires_at: Optional[datetime] = None  # 过期时间
    metadata: Dict[str, Any] = Field(default_factory=dict)  # 元数据
    
    def is_expired(self) -> bool:
        """检查是否过期
        
        Returns:
            bool: 是否过期
        """
        if self.expires_at is None:
            return False
        return datetime.now() > self.expires_at
    
    def to_dict(self) -> Dict[str, Any]:
        """转换为字典
        
        Returns:
            Dict[str, Any]: 字典表示
        """
        return {
            "id": self.id,
            "key": self.key,
            "value": self.value,
            "level": self.level.value,
            "type": self.type.value,
            "agent_id": self.agent_id,
            "vector_clock": self.vector_clock.dict(),
            "created_at": self.created_at.isoformat(),
            "expires_at": self.expires_at.isoformat() if self.expires_at else None,
            "metadata": self.metadata
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "MemoryEntry":
        """从字典创建
        
        Args:
            data: 字典数据
            
        Returns:
            MemoryEntry: 记忆条目
        """
        # 处理日期时间字段
        if isinstance(data.get("created_at"), str):
            data["created_at"] = datetime.fromisoformat(data["created_at"])
        if isinstance(data.get("expires_at"), str) and data["expires_at"] is not None:
            data["expires_at"] = datetime.fromisoformat(data["expires_at"])
        
        # 处理枚举字段
        if isinstance(data.get("level"), str):
            data["level"] = MemoryLevel(data["level"])
        if isinstance(data.get("type"), str):
            data["type"] = MemoryType(data["type"])
        
        # 处理向量时钟
        if isinstance(data.get("vector_clock"), dict):
            data["vector_clock"] = VectorClock(**data["vector_clock"])
        
        return cls(**data)


class WorkingMemory:
    """工作记忆
    
    存储当前任务上下文，使用共享内存（RAM）实现
    """
    def __init__(self):
        """初始化工作记忆"""
        self.memory: Dict[str, MemoryEntry] = {}
    
    def set(self, entry: MemoryEntry) -> None:
        """设置记忆条目
        
        Args:
            entry: 记忆条目
        """
        self.memory[entry.key] = entry
    
    def get(self, key: str) -> Optional[MemoryEntry]:
        """获取记忆条目
        
        Args:
            key: 记忆键
            
        Returns:
            Optional[MemoryEntry]: 记忆条目，如果不存在则返回None
        """
        entry = self.memory.get(key)
        if entry and entry.is_expired():
            del self.memory[key]
            return None
        return entry
    
    def delete(self, key: str) -> bool:
        """删除记忆条目
        
        Args:
            key: 记忆键
            
        Returns:
            bool: 是否成功删除
        """
        if key in self.memory:
            del self.memory[key]
            return True
        return False
    
    def list_keys(self, prefix: str = "") -> List[str]:
        """列出记忆键
        
        Args:
            prefix: 键前缀
            
        Returns:
            List[str]: 记忆键列表
        """
        return [k for k in self.memory.keys() if k.startswith(prefix)]


class ShortTermMemory:
    """短期记忆
    
    存储任务链状态快照，使用分布式KV存储（etcd）实现
    """
    def __init__(self, etcd_host: str = "localhost", etcd_port: int = 2379):
        """初始化短期记忆
        
        Args:
            etcd_host: etcd主机
            etcd_port: etcd端口
        """
        self.etcd_host = etcd_host
        self.etcd_port = etcd_port
        self.client = None
        
        if EXTERNAL_DEPS_AVAILABLE:
            try:
                self.client = etcd3.client(host=etcd_host, port=etcd_port)
                logger.info(f"已连接到etcd: {etcd_host}:{etcd_port}")
            except Exception as e:
                logger.error(f"连接etcd失败: {e}")
                self.client = None
        
        # 如果无法连接etcd，使用内存模拟
        if self.client is None:
            logger.warning("使用内存模拟短期记忆存储")
            self.memory = {}
    
    def set(self, entry: MemoryEntry) -> None:
        """设置记忆条目
        
        Args:
            entry: 记忆条目
        """
        value = json.dumps(entry.to_dict())
        if self.client:
            # 设置过期时间（如果有）
            lease = None
            if entry.expires_at:
                ttl = max(1, int((entry.expires_at - datetime.now()).total_seconds()))
                lease = self.client.lease(ttl)
            
            self.client.put(entry.key, value, lease=lease)
        else:
            # 内存模拟
            self.memory[entry.key] = value
    
    def get(self, key: str) -> Optional[MemoryEntry]:
        """获取记忆条目
        
        Args:
            key: 记忆键
            
        Returns:
            Optional[MemoryEntry]: 记忆条目，如果不存在则返回None
        """
        if self.client:
            result = self.client.get(key)
            if result[0] is None:
                return None
            data = json.loads(result[0].decode("utf-8"))
            return MemoryEntry.from_dict(data)
        else:
            # 内存模拟
            if key not in self.memory:
                return None
            data = json.loads(self.memory[key])
            entry = MemoryEntry.from_dict(data)
            if entry.is_expired():
                del self.memory[key]
                return None
            return entry
    
    def delete(self, key: str) -> bool:
        """删除记忆条目
        
        Args:
            key: 记忆键
            
        Returns:
            bool: 是否成功删除
        """
        if self.client:
            result = self.client.delete(key)
            return result is not None
        else:
            # 内存模拟
            if key in self.memory:
                del self.memory[key]
                return True
            return False
    
    def list_keys(self, prefix: str = "") -> List[str]:
        """列出记忆键
        
        Args:
            prefix: 键前缀
            
        Returns:
            List[str]: 记忆键列表
        """
        if self.client:
            keys = []
            for item in self.client.get_prefix(prefix):
                key = item[1].key.decode("utf-8")
                keys.append(key)
            return keys
        else:
            # 内存模拟
            return [k for k in self.memory.keys() if k.startswith(prefix)]


class LongTermMemory:
    """长期记忆
    
    存储领域知识和历史决策，使用图数据库（Neo4j）实现
    """
    def __init__(self, uri: str = "bolt://localhost:7687", user: str = "neo4j", password: str = "password"):
        """初始化长期记忆
        
        Args:
            uri: Neo4j URI
            user: 用户名
            password: 密码
        """
        self.uri = uri
        self.user = user
        self.password = password
        self.driver = None
        
        if EXTERNAL_DEPS_AVAILABLE:
            try:
                self.driver = GraphDatabase.driver(uri, auth=(user, password))
                logger.info(f"已连接到Neo4j: {uri}")
            except Exception as e:
                logger.error(f"连接Neo4j失败: {e}")
                self.driver = None
        
        # 如果无法连接Neo4j，使用内存模拟
        if self.driver is None:
            logger.warning("使用内存模拟长期记忆存储")
            self.memory = {}
    
    def set(self, entry: MemoryEntry) -> None:
        """设置记忆条目
        
        Args:
            entry: 记忆条目
        """
        if self.driver:
            with self.driver.session() as session:
                # 创建或更新记忆节点
                cypher = """
                MERGE (m:Memory {key: $key})
                SET m.value = $value,
                    m.level = $level,
                    m.type = $type,
                    m.agent_id = $agent_id,
                    m.vector_clock = $vector_clock,
                    m.created_at = $created_at,
                    m.expires_at = $expires_at,
                    m.metadata = $metadata
                RETURN m
                """
                
                session.run(
                    cypher,
                    key=entry.key,
                    value=json.dumps(entry.value),
                    level=entry.level.value,
                    type=entry.type.value,
                    agent_id=entry.agent_id,
                    vector_clock=json.dumps(entry.vector_clock.dict()),
                    created_at=entry.created_at.isoformat(),
                    expires_at=entry.expires_at.isoformat() if entry.expires_at else None,
                    metadata=json.dumps(entry.metadata)
                )
        else:
            # 内存模拟
            self.memory[entry.key] = json.dumps(entry.to_dict())
    
    def get(self, key: str) -> Optional[MemoryEntry]:
        """获取记忆条目
        
        Args:
            key: 记忆键
            
        Returns:
            Optional[MemoryEntry]: 记忆条目，如果不存在则返回None
        """
        if self.driver:
            with self.driver.session() as session:
                cypher = "MATCH (m:Memory {key: $key}) RETURN m"
                result = session.run(cypher, key=key).single()
                
                if result is None:
                    return None
                
                node = result["m"]
                data = {
                    "id": node.id,
                    "key": node["key"],
                    "value": json.loads(node["value"]),
                    "level": node["level"],
                    "type": node["type"],
                    "agent_id": node["agent_id"],
                    "vector_clock": json.loads(node["vector_clock"]),
                    "created_at": node["created_at"],
                    "expires_at": node["expires_at"],
                    "metadata": json.loads(node["metadata"])
                }
                
                entry = MemoryEntry.from_dict(data)
                if entry.is_expired():
                    self.delete(key)
                    return None
                return entry
        else:
            # 内存模拟
            if key not in self.memory:
                return None
            data = json.loads(self.memory[key])
            entry = MemoryEntry.from_dict(data)
            if entry.is_expired():
                del self.memory[key]
                return None
            return entry
    
    def delete(self, key: str) -> bool:
        """删除记忆条目
        
        Args:
            key: 记忆键
            
        Returns:
            bool: 是否成功删除
        """
        if self.driver:
            with self.driver.session() as session:
                cypher = "MATCH (m:Memory {key: $key}) DELETE m RETURN count(m) as count"
                result = session.run(cypher, key=key).single()
                return result and result["count"] > 0
        else:
            # 内存模拟
            if key in self.memory:
                del self.memory[key]
                return True
            return False
    
    def list_keys(self, prefix: str = "") -> List[str]:
        """列出记忆键
        
        Args:
            prefix: 键前缀
            
        Returns:
            List[str]: 记忆键列表
        """
        if self.driver:
            with self.driver.session() as session:
                cypher = "MATCH (m:Memory) WHERE m.key STARTS WITH $prefix RETURN m.key as key"
                result = session.run(cypher, prefix=prefix)
                return [record["key"] for record in result]
        else:
            # 内存模拟
            return [k for k in self.memory.keys() if k.startswith(prefix)]


class MemoryManager:
    """记忆管理器
    
    管理三层记忆存储，提供统一的接口
    """
    def __init__(self, config: Dict[str, Any] = None):
        """初始化记忆管理器
        
        Args:
            config: 配置字典
        """
        self.config = config or {}
        
        # 初始化三层记忆存储
        self.working_memory = WorkingMemory()
        
        # 短期记忆配置
        etcd_host = self.config.get("etcd_host", "localhost")
        etcd_port = self.config.get("etcd_port", 2379)
        self.short_term_memory = ShortTermMemory(etcd_host, etcd_port)
        
        # 长期记忆配置
        neo4j_uri = self.config.get("neo4j_uri", "bolt://localhost:7687")
        neo4j_user = self.config.get("neo4j_user", "neo4j")
        neo4j_password = self.config.get("neo4j_password", "password")
        self.long_term_memory = LongTermMemory(neo4j_uri, neo4j_user, neo4j_password)
        
        # 向量时钟
        self.vector_clock = VectorClock()
        
        # 冲突解决回调
        self.conflict_resolver = None
    
    def set_conflict_resolver(self, resolver: callable) -> None:
        """设置冲突解决器
        
        Args:
            resolver: 冲突解决回调函数，接收两个MemoryEntry参数，返回解决后的MemoryEntry
        """
        self.conflict_resolver = resolver
    
    def set(self, key: str, value: Any, level: MemoryLevel, type: MemoryType, 
            agent_id: str, ttl: Optional[int] = None, metadata: Dict[str, Any] = None) -> str:
        """设置记忆
        
        Args:
            key: 记忆键
            value: 记忆值
            level: 记忆层级
            type: 记忆类型
            agent_id: 智能体ID
            ttl: 生存时间（秒），如果为None则永不过期
            metadata: 元数据
            
        Returns:
            str: 记忆条目ID
        """
        # 更新向量时钟
        self.vector_clock.increment(agent_id)
        
        # 创建过期时间
        expires_at = None
        if ttl is not None:
            expires_at = datetime.now() + timedelta(seconds=ttl)
        
        # 创建记忆条目
        entry = MemoryEntry(
            key=key,
            value=value,
            level=level,
            type=type,
            agent_id=agent_id,
            vector_clock=self.vector_clock,
            expires_at=expires_at,
            metadata=metadata or {}
        )
        
        # 检查冲突
        existing_entry = self.get(key, level)
        if existing_entry is not None:
            # 如果现有条目的向量时钟与新条目的向量时钟并发，则存在冲突
            if existing_entry.vector_clock.is_concurrent_with(entry.vector_clock):
                if self.conflict_resolver:
                    # 使用冲突解决器解决冲突
                    entry = self.conflict_resolver(existing_entry, entry)
                else:
                    # 默认策略：保留最新的条目
                    if entry.created_at < existing_entry.created_at:
                        entry = existing_entry
        
        # 根据记忆层级存储
        if level == MemoryLevel.WORKING:
            self.working_memory.set(entry)
        elif level == MemoryLevel.SHORT_TERM:
            self.short_term_memory.set(entry)
        elif level == MemoryLevel.LONG_TERM:
            self.long_term_memory.set(entry)
        
        return entry.id
    
    def get(self, key: str, level: Optional[MemoryLevel] = None) -> Optional[MemoryEntry]:
        """获取记忆
        
        Args:
            key: 记忆键
            level: 记忆层级，如果为None则按工作记忆、短期记忆、长期记忆的顺序查找
            
        Returns:
            Optional[MemoryEntry]: 记忆条目，如果不存在则返回None
        """
        if level == MemoryLevel.WORKING:
            return self.working_memory.get(key)
        elif level == MemoryLevel.SHORT_TERM:
            return self.short_term_memory.get(key)
        elif level == MemoryLevel.LONG_TERM:
            return self.long_term_memory.get(key)
        else:
            # 按顺序查找
            entry = self.working_memory.get(key)
            if entry is not None:
                return entry
            
            entry = self.short_term_memory.get(key)
            if entry is not None:
                return entry
            
            return self.long_term_memory.get(key)
    
    def delete(self, key: str, level: Optional[MemoryLevel] = None) -> bool:
        """删除记忆
        
        Args:
            key: 记忆键
            level: 记忆层级，如果为None则删除所有层级中的记忆
            
        Returns:
            bool: 是否成功删除
        """
        if level == MemoryLevel.WORKING:
            return self.working_memory.delete(key)
        elif level == MemoryLevel.SHORT_TERM:
            return self.short_term_memory.delete(key)
        elif level == MemoryLevel.LONG_TERM:
            return self.long_term_memory.delete(key)
        else:
            # 删除所有层级
            result1 = self.working_memory.delete(key)
            result2 = self.short_term_memory.delete(key)
            result3 = self.long_term_memory.delete(key)
            return result1 or result2 or result3
    
    def list_keys(self, prefix: str = "", level: Optional[MemoryLevel] = None) -> List[str]:
        """列出记忆键
        
        Args:
            prefix: 键前缀
            level: 记忆层级，如果为None则列出所有层级的记忆键
            
        Returns:
            List[str]: 记忆键列表
        """
        if level == MemoryLevel.WORKING:
            return self.working_memory.list_keys(prefix)
        elif level == MemoryLevel.SHORT_TERM:
            return self.short_term_memory.list_keys(prefix)
        elif level == MemoryLevel.LONG_TERM:
            return self.long_term_memory.list_keys(prefix)
        else:
            # 合并所有层级的键
            keys = set()
            keys.update(self.working_memory.list_keys(prefix))
            keys.update(self.short_term_memory.list_keys(prefix))
            keys.update(self.long_term_memory.list_keys(prefix))
            return list(keys)
    
    def sync_vector_clock(self, other_clock: VectorClock) -> None:
        """同步向量时钟
        
        Args:
            other_clock: 另一个向量时钟
        """
        self.vector_clock.merge(other_clock)
    
    def create_snapshot(self, task_id: str, agent_id: str, state: Dict[str, Any], 
                       ttl: int = 3600) -> str:
        """创建状态快照
        
        Args:
            task_id: 任务ID
            agent_id: 智能体ID
            state: 状态字典
            ttl: 生存时间（秒）
            
        Returns:
            str: 快照ID
        """
        key = f"snapshot:{task_id}:{int(time.time())}"
        return self.set(
            key=key,
            value=state,
            level=MemoryLevel.SHORT_TERM,
            type=MemoryType.STATE_SNAPSHOT,
            agent_id=agent_id,
            ttl=ttl,
            metadata={"task_id": task_id}
        )
    
    def get_latest_snapshot(self, task_id: str) -> Optional[Dict[str, Any]]:
        """获取最新状态快照
        
        Args:
            task_id: 任务ID
            
        Returns:
            Optional[Dict[str, Any]]: 状态字典，如果不存在则返回None
        """
        prefix = f"snapshot:{task_id}:"
        keys = self.short_term_memory.list_keys(prefix)
        
        if not keys:
            return None
        
        # 按时间戳排序
        sorted_keys = sorted(keys, reverse=True)
        entry = self.short_term_memory.get(sorted_keys[0])
        
        if entry is None:
            return None
        
        return entry.value
    
    def store_decision(self, agent_id: str, decision: Dict[str, Any], 
                      context: Dict[str, Any], metadata: Dict[str, Any] = None) -> str:
        """存储决策历史
        
        Args:
            agent_id: 智能体ID
            decision: 决策字典
            context: 上下文字典
            metadata: 元数据
            
        Returns:
            str: 记忆条目ID
        """
        key = f"decision:{agent_id}:{int(time.time())}"
        value = {
            "decision": decision,
            "context": context
        }
        return self.set(
            key=key,
            value=value,
            level=MemoryLevel.LONG_TERM,
            type=MemoryType.DECISION_HISTORY,
            agent_id=agent_id,
            metadata=metadata
        )
    
    def query_decisions(self, agent_id: Optional[str] = None, 
                       start_time: Optional[datetime] = None,
                       end_time: Optional[datetime] = None,
                       limit: int = 10) -> List[Dict[str, Any]]:
        """查询决策历史
        
        Args:
            agent_id: 智能体ID，如果为None则查询所有智能体
            start_time: 开始时间
            end_time: 结束时间
            limit: 限制数量
            
        Returns:
            List[Dict[str, Any]]: 决策历史列表
        """
        prefix = "decision:"
        if agent_id:
            prefix = f"decision:{agent_id}:"
        
        keys = self.long_term_memory.list_keys(prefix)
        results = []
        
        for key in keys:
            entry = self.long_term_memory.get(key)
            if entry is None:
                continue
            
            # 时间过滤
            if start_time and entry.created_at < start_time:
                continue
            if end_time and entry.created_at > end_time:
                continue
            
            results.append({
                "id": entry.id,
                "agent_id": entry.agent_id,
                "decision": entry.value["decision"],
                "context": entry.value["context"],
                "created_at": entry.created_at,
                "metadata": entry.metadata
            })
            
            if len(results) >= limit:
                break
        
        # 按时间排序
        return sorted(results, key=lambda x: x["created_at"], reverse=True)
    
    def store_domain_knowledge(self, key: str, knowledge: Any, 
                             domains: List[str], metadata: Dict[str, Any] = None) -> str:
        """存储领域知识
        
        Args:
            key: 知识键
            knowledge: 知识内容
            domains: 领域列表
            metadata: 元数据
            
        Returns:
            str: 记忆条目ID
        """
        if metadata is None:
            metadata = {}
        metadata["domains"] = domains
        
        return self.set(
            key=f"knowledge:{key}",
            value=knowledge,
            level=MemoryLevel.LONG_TERM,
            type=MemoryType.DOMAIN_KNOWLEDGE,
            agent_id="system",  # 系统级知识
            metadata=metadata
        )
    
    def get_domain_knowledge(self, key: str) -> Optional[Any]:
        """获取领域知识
        
        Args:
            key: 知识键
            
        Returns:
            Optional[Any]: 知识内容，如果不存在则返回None
        """
        entry = self.long_term_memory.get(f"knowledge:{key}")
        if entry is None:
            return None
        return entry.value
    
    def query_domain_knowledge(self, domain: str, limit: int = 10) -> List[Dict[str, Any]]:
        """查询领域知识
        
        Args:
            domain: 领域
            limit: 限制数量
            
        Returns:
            List[Dict[str, Any]]: 知识列表
        """
        keys = self.long_term_memory.list_keys("knowledge:")
        results = []
        
        for key in keys:
            entry = self.long_term_memory.get(key)
            if entry is None or entry.type != MemoryType.DOMAIN_KNOWLEDGE:
                continue
            
            # 领域过滤
            domains = entry.metadata.get("domains", [])
            if domain not in domains:
                continue
            
            results.append({
                "id": entry.id,
                "key": key.replace("knowledge:", ""),
                "value": entry.value,
                "domains": domains,
                "created_at": entry.created_at,
                "metadata": entry.metadata
            })
            
            if len(results) >= limit:
                break
        
        return results