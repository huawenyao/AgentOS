"""任务DAG模型模块

该模块实现了任务有向无环图(DAG)的定义和管理，支持任务的拆解、依赖关系管理和执行调度。
"""

import uuid
from typing import Dict, List, Set, Optional, Any, Tuple, Callable
from datetime import datetime
from enum import Enum
from pydantic import BaseModel, Field
from loguru import logger


class TaskStatus(str, Enum):
    """任务状态枚举"""
    PENDING = "pending"  # 等待执行
    RUNNING = "running"  # 正在执行
    COMPLETED = "completed"  # 已完成
    FAILED = "failed"  # 执行失败
    CANCELED = "canceled"  # 已取消
    BLOCKED = "blocked"  # 被阻塞（依赖任务未完成）


class TaskPriority(int, Enum):
    """任务优先级枚举"""
    LOW = 0
    NORMAL = 1
    HIGH = 2
    CRITICAL = 3


class TaskType(str, Enum):
    """任务类型枚举"""
    DATA_EXTRACT = "data_extract"  # 数据抽取
    DATA_TRANSFORM = "data_transform"  # 数据转换
    DATA_LOAD = "data_load"  # 数据加载
    RISK_VALIDATE = "risk_validate"  # 风险校验
    DECISION_MAKING = "decision_making"  # 决策制定
    NOTIFICATION = "notification"  # 通知
    ACTION_EXECUTION = "action_execution"  # 动作执行
    MONITORING = "monitoring"  # 监控
    CUSTOM = "custom"  # 自定义


class TaskNode(BaseModel):
    """任务节点
    
    表示DAG中的一个任务节点，包含任务的基本信息和执行状态
    """
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = None
    agent_id: Optional[str] = None  # 执行该任务的智能体ID
    agent_type: Optional[str] = None  # 执行该任务的智能体类型
    task_type: TaskType = TaskType.CUSTOM
    status: TaskStatus = TaskStatus.PENDING
    priority: TaskPriority = TaskPriority.NORMAL
    params: Dict[str, Any] = Field(default_factory=dict)  # 任务参数
    result: Optional[Any] = None  # 任务结果
    error: Optional[str] = None  # 错误信息
    created_at: datetime = Field(default_factory=datetime.now)
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    timeout_seconds: int = 300  # 任务超时时间（秒）
    retry_count: int = 0  # 已重试次数
    max_retries: int = 3  # 最大重试次数
    
    def start(self) -> None:
        """开始执行任务"""
        self.status = TaskStatus.RUNNING
        self.started_at = datetime.now()
    
    def complete(self, result: Any = None) -> None:
        """完成任务
        
        Args:
            result: 任务执行结果
        """
        self.status = TaskStatus.COMPLETED
        self.result = result
        self.completed_at = datetime.now()
    
    def fail(self, error: str) -> None:
        """任务执行失败
        
        Args:
            error: 错误信息
        """
        self.status = TaskStatus.FAILED
        self.error = error
        self.completed_at = datetime.now()
    
    def cancel(self) -> None:
        """取消任务"""
        self.status = TaskStatus.CANCELED
        self.completed_at = datetime.now()
    
    def block(self) -> None:
        """阻塞任务"""
        self.status = TaskStatus.BLOCKED
    
    def retry(self) -> bool:
        """重试任务
        
        Returns:
            bool: 是否可以重试
        """
        if self.retry_count < self.max_retries:
            self.retry_count += 1
            self.status = TaskStatus.PENDING
            self.error = None
            return True
        return False
    
    def is_terminal_state(self) -> bool:
        """检查任务是否处于终止状态
        
        Returns:
            bool: 是否处于终止状态
        """
        return self.status in {
            TaskStatus.COMPLETED,
            TaskStatus.FAILED,
            TaskStatus.CANCELED
        }
    
    def execution_time(self) -> Optional[float]:
        """计算任务执行时间（秒）
        
        Returns:
            Optional[float]: 执行时间（秒），如果任务未完成则返回None
        """
        if self.started_at and self.completed_at:
            return (self.completed_at - self.started_at).total_seconds()
        return None


class TaskDAG:
    """任务有向无环图
    
    管理任务节点和它们之间的依赖关系，支持任务的添加、删除、查询和执行调度
    """
    def __init__(self, name: str, description: Optional[str] = None):
        """初始化任务DAG
        
        Args:
            name: DAG名称
            description: DAG描述
        """
        self.id = str(uuid.uuid4())
        self.name = name
        self.description = description
        self.nodes: Dict[str, TaskNode] = {}  # 任务节点字典，键为节点ID
        self.edges: Dict[str, Set[str]] = {}  # 边字典，键为源节点ID，值为目标节点ID集合
        self.reverse_edges: Dict[str, Set[str]] = {}  # 反向边字典，键为目标节点ID，值为源节点ID集合
        self.created_at = datetime.now()
        self.on_node_status_change: Optional[Callable[[str, TaskStatus], None]] = None
    
    def add_node(self, node: TaskNode) -> str:
        """添加任务节点
        
        Args:
            node: 任务节点
            
        Returns:
            str: 节点ID
        """
        self.nodes[node.id] = node
        self.edges[node.id] = set()
        self.reverse_edges[node.id] = set()
        return node.id
    
    def add_edge(self, from_node_id: str, to_node_id: str) -> None:
        """添加任务依赖关系
        
        Args:
            from_node_id: 源节点ID
            to_node_id: 目标节点ID
            
        Raises:
            ValueError: 节点ID不存在或添加边会导致循环依赖
        """
        if from_node_id not in self.nodes:
            raise ValueError(f"源节点ID不存在: {from_node_id}")
        if to_node_id not in self.nodes:
            raise ValueError(f"目标节点ID不存在: {to_node_id}")
        
        # 检查是否会导致循环依赖
        if self._will_create_cycle(from_node_id, to_node_id):
            raise ValueError(f"添加边 {from_node_id} -> {to_node_id} 会导致循环依赖")
        
        self.edges[from_node_id].add(to_node_id)
        self.reverse_edges[to_node_id].add(from_node_id)
        
        # 更新目标节点状态
        self._update_node_status(to_node_id)
    
    def remove_node(self, node_id: str) -> None:
        """删除任务节点
        
        Args:
            node_id: 节点ID
            
        Raises:
            ValueError: 节点ID不存在
        """
        if node_id not in self.nodes:
            raise ValueError(f"节点ID不存在: {node_id}")
        
        # 删除与该节点相关的所有边
        for target_id in list(self.edges[node_id]):
            self.reverse_edges[target_id].remove(node_id)
        
        for source_id in list(self.reverse_edges[node_id]):
            self.edges[source_id].remove(node_id)
        
        # 删除节点
        del self.nodes[node_id]
        del self.edges[node_id]
        del self.reverse_edges[node_id]
    
    def remove_edge(self, from_node_id: str, to_node_id: str) -> None:
        """删除任务依赖关系
        
        Args:
            from_node_id: 源节点ID
            to_node_id: 目标节点ID
            
        Raises:
            ValueError: 节点ID不存在或边不存在
        """
        if from_node_id not in self.nodes:
            raise ValueError(f"源节点ID不存在: {from_node_id}")
        if to_node_id not in self.nodes:
            raise ValueError(f"目标节点ID不存在: {to_node_id}")
        
        if to_node_id not in self.edges[from_node_id]:
            raise ValueError(f"边不存在: {from_node_id} -> {to_node_id}")
        
        self.edges[from_node_id].remove(to_node_id)
        self.reverse_edges[to_node_id].remove(from_node_id)
        
        # 更新目标节点状态
        self._update_node_status(to_node_id)
    
    def get_node(self, node_id: str) -> TaskNode:
        """获取任务节点
        
        Args:
            node_id: 节点ID
            
        Returns:
            TaskNode: 任务节点
            
        Raises:
            ValueError: 节点ID不存在
        """
        if node_id not in self.nodes:
            raise ValueError(f"节点ID不存在: {node_id}")
        return self.nodes[node_id]
    
    def get_all_nodes(self) -> List[TaskNode]:
        """获取所有任务节点
        
        Returns:
            List[TaskNode]: 所有任务节点列表
        """
        return list(self.nodes.values())
    
    def get_dependencies(self, node_id: str) -> List[TaskNode]:
        """获取节点的依赖节点
        
        Args:
            node_id: 节点ID
            
        Returns:
            List[TaskNode]: 依赖节点列表
            
        Raises:
            ValueError: 节点ID不存在
        """
        if node_id not in self.nodes:
            raise ValueError(f"节点ID不存在: {node_id}")
        
        return [self.nodes[dep_id] for dep_id in self.reverse_edges[node_id]]
    
    def get_dependents(self, node_id: str) -> List[TaskNode]:
        """获取依赖于该节点的节点
        
        Args:
            node_id: 节点ID
            
        Returns:
            List[TaskNode]: 依赖于该节点的节点列表
            
        Raises:
            ValueError: 节点ID不存在
        """
        if node_id not in self.nodes:
            raise ValueError(f"节点ID不存在: {node_id}")
        
        return [self.nodes[dep_id] for dep_id in self.edges[node_id]]
    
    def get_ready_nodes(self) -> List[TaskNode]:
        """获取准备就绪的任务节点
        
        准备就绪的节点是指状态为PENDING且所有依赖节点都已完成的节点
        
        Returns:
            List[TaskNode]: 准备就绪的任务节点列表
        """
        ready_nodes = []
        for node_id, node in self.nodes.items():
            if node.status == TaskStatus.PENDING:
                # 检查所有依赖是否已完成
                all_deps_completed = True
                for dep_id in self.reverse_edges[node_id]:
                    dep_node = self.nodes[dep_id]
                    if dep_node.status != TaskStatus.COMPLETED:
                        all_deps_completed = False
                        break
                
                if all_deps_completed:
                    ready_nodes.append(node)
        
        # 按优先级排序
        ready_nodes.sort(key=lambda n: n.priority.value, reverse=True)
        return ready_nodes
    
    def update_node_status(self, node_id: str, status: TaskStatus, result: Any = None, error: Optional[str] = None) -> None:
        """更新节点状态
        
        Args:
            node_id: 节点ID
            status: 新状态
            result: 任务结果
            error: 错误信息
            
        Raises:
            ValueError: 节点ID不存在
        """
        if node_id not in self.nodes:
            raise ValueError(f"节点ID不存在: {node_id}")
        
        node = self.nodes[node_id]
        old_status = node.status
        
        # 更新节点状态
        if status == TaskStatus.RUNNING:
            node.start()
        elif status == TaskStatus.COMPLETED:
            node.complete(result)
        elif status == TaskStatus.FAILED:
            node.fail(error or "未知错误")
        elif status == TaskStatus.CANCELED:
            node.cancel()
        elif status == TaskStatus.BLOCKED:
            node.block()
        else:  # PENDING
            node.status = TaskStatus.PENDING
        
        # 如果状态发生变化，更新依赖于该节点的节点状态
        if old_status != node.status:
            # 通知状态变化
            if self.on_node_status_change:
                self.on_node_status_change(node_id, node.status)
            
            # 更新依赖于该节点的节点状态
            for dependent_id in self.edges[node_id]:
                self._update_node_status(dependent_id)
    
    def _update_node_status(self, node_id: str) -> None:
        """更新节点状态（内部方法）
        
        根据依赖节点的状态更新节点状态
        
        Args:
            node_id: 节点ID
        """
        node = self.nodes[node_id]
        
        # 如果节点已经处于终止状态，不进行更新
        if node.is_terminal_state():
            return
        
        # 检查所有依赖
        has_failed_deps = False
        has_pending_deps = False
        
        for dep_id in self.reverse_edges[node_id]:
            dep_node = self.nodes[dep_id]
            if dep_node.status == TaskStatus.FAILED or dep_node.status == TaskStatus.CANCELED:
                has_failed_deps = True
                break
            elif dep_node.status != TaskStatus.COMPLETED:
                has_pending_deps = True
        
        # 更新状态
        if has_failed_deps:
            # 如果有依赖失败，将节点标记为阻塞
            if node.status != TaskStatus.BLOCKED:
                self.update_node_status(node_id, TaskStatus.BLOCKED)
        elif has_pending_deps:
            # 如果有依赖未完成，将节点标记为阻塞
            if node.status != TaskStatus.BLOCKED:
                self.update_node_status(node_id, TaskStatus.BLOCKED)
        else:
            # 如果所有依赖都已完成，将节点标记为待处理
            if node.status == TaskStatus.BLOCKED:
                self.update_node_status(node_id, TaskStatus.PENDING)
    
    def _will_create_cycle(self, from_node_id: str, to_node_id: str) -> bool:
        """检查添加边是否会导致循环依赖
        
        Args:
            from_node_id: 源节点ID
            to_node_id: 目标节点ID
            
        Returns:
            bool: 是否会导致循环依赖
        """
        # 如果目标节点可以到达源节点，则添加边会导致循环
        visited = set()
        
        def dfs(node_id: str) -> bool:
            if node_id == from_node_id:
                return True
            if node_id in visited:
                return False
            
            visited.add(node_id)
            for next_id in self.edges[node_id]:
                if dfs(next_id):
                    return True
            return False
        
        return dfs(to_node_id)
    
    def get_execution_plan(self) -> List[List[str]]:
        """获取执行计划
        
        返回任务的执行层级，每个层级中的任务可以并行执行
        
        Returns:
            List[List[str]]: 执行计划，每个元素是一个层级，包含可并行执行的任务ID列表
        """
        # 计算每个节点的入度（依赖数量）
        in_degree = {node_id: len(deps) for node_id, deps in self.reverse_edges.items()}
        
        # 拓扑排序
        levels = []
        while in_degree:
            # 找出入度为0的节点
            current_level = [node_id for node_id, degree in in_degree.items() if degree == 0]
            if not current_level:
                # 存在循环依赖
                break
            
            levels.append(current_level)
            
            # 移除当前层级的节点，更新入度
            for node_id in current_level:
                for dependent_id in self.edges[node_id]:
                    if dependent_id in in_degree:
                        in_degree[dependent_id] -= 1
                del in_degree[node_id]
        
        return levels
    
    def get_critical_path(self) -> List[str]:
        """获取关键路径
        
        关键路径是指从起始节点到终止节点的最长路径，决定了整个DAG的最短完成时间
        
        Returns:
            List[str]: 关键路径上的节点ID列表
        """
        # 计算每个节点的最早完成时间
        earliest_finish_time = {}
        
        # 拓扑排序
        levels = self.get_execution_plan()
        flattened_order = [node_id for level in levels for node_id in level]
        
        # 计算最早完成时间
        for node_id in flattened_order:
            node = self.nodes[node_id]
            # 估计执行时间，如果有历史数据则使用，否则使用默认值
            execution_time = node.execution_time() or node.timeout_seconds
            
            # 计算最早开始时间（依赖节点的最大完成时间）
            earliest_start = 0
            for dep_id in self.reverse_edges[node_id]:
                if dep_id in earliest_finish_time:
                    earliest_start = max(earliest_start, earliest_finish_time[dep_id])
            
            # 计算最早完成时间
            earliest_finish_time[node_id] = earliest_start + execution_time
        
        # 找出终止节点（没有依赖它的节点）
        terminal_nodes = [node_id for node_id, deps in self.edges.items() if not deps]
        
        # 如果没有终止节点，返回空列表
        if not terminal_nodes:
            return []
        
        # 找出完成时间最晚的终止节点
        end_node = max(terminal_nodes, key=lambda node_id: earliest_finish_time.get(node_id, 0))
        
        # 从终止节点回溯找出关键路径
        critical_path = [end_node]
        current = end_node
        
        while self.reverse_edges[current]:
            # 找出最晚完成的依赖节点
            current = max(
                self.reverse_edges[current],
                key=lambda node_id: earliest_finish_time.get(node_id, 0)
            )
            critical_path.insert(0, current)
        
        return critical_path
    
    def to_dict(self) -> Dict[str, Any]:
        """将DAG转换为字典
        
        Returns:
            Dict[str, Any]: DAG字典表示
        """
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "nodes": {node_id: node.dict() for node_id, node in self.nodes.items()},
            "edges": {node_id: list(targets) for node_id, targets in self.edges.items()},
            "created_at": self.created_at.isoformat()
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "TaskDAG":
        """从字典创建DAG
        
        Args:
            data: DAG字典表示
            
        Returns:
            TaskDAG: 创建的DAG对象
        """
        dag = cls(data["name"], data.get("description"))
        dag.id = data["id"]
        dag.created_at = datetime.fromisoformat(data["created_at"])
        
        # 添加节点
        for node_id, node_data in data["nodes"].items():
            node = TaskNode.parse_obj(node_data)
            dag.nodes[node_id] = node
            dag.edges[node_id] = set()
            dag.reverse_edges[node_id] = set()
        
        # 添加边
        for node_id, targets in data["edges"].items():
            for target_id in targets:
                dag.edges[node_id].add(target_id)
                dag.reverse_edges[target_id].add(node_id)
        
        return dag