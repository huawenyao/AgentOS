"""弹性资源调度模块

该模块实现了基于博弈论的资源调度机制，支持智能体之间的资源共享和任务分配，以及边缘-云协同计算。
"""

import uuid
import math
import random
from enum import Enum
from typing import Dict, List, Set, Optional, Any, Tuple, Callable, Union
from datetime import datetime
from pydantic import BaseModel, Field, validator
from loguru import logger


class ResourceType(str, Enum):
    """资源类型枚举"""
    CPU = "cpu"  # CPU资源
    MEMORY = "memory"  # 内存资源
    GPU = "gpu"  # GPU资源
    STORAGE = "storage"  # 存储资源
    NETWORK = "network"  # 网络资源
    MODEL = "model"  # 模型资源


class NodeType(str, Enum):
    """节点类型枚举"""
    EDGE = "edge"  # 边缘节点
    CLOUD = "cloud"  # 云端节点
    HYBRID = "hybrid"  # 混合节点


class TaskRequirement(BaseModel):
    """任务资源需求"""
    cpu_cores: float = 0.0  # CPU核心数
    memory_mb: float = 0.0  # 内存（MB）
    gpu_cores: float = 0.0  # GPU核心数
    storage_mb: float = 0.0  # 存储（MB）
    network_mbps: float = 0.0  # 网络带宽（Mbps）
    model_size: float = 0.0  # 模型大小（MB）
    max_latency_ms: Optional[float] = None  # 最大延迟（毫秒）
    is_realtime: bool = False  # 是否为实时任务
    is_compute_intensive: bool = False  # 是否为计算密集型任务


class ResourceCapacity(BaseModel):
    """资源容量"""
    cpu_cores: float  # CPU核心数
    memory_mb: float  # 内存（MB）
    gpu_cores: float  # GPU核心数
    storage_mb: float  # 存储（MB）
    network_mbps: float  # 网络带宽（Mbps）
    model_capacity_mb: float  # 模型容量（MB）
    latency_ms: float  # 延迟（毫秒）


class ResourceUsage(BaseModel):
    """资源使用情况"""
    cpu_cores: float = 0.0  # CPU核心数
    memory_mb: float = 0.0  # 内存（MB）
    gpu_cores: float = 0.0  # GPU核心数
    storage_mb: float = 0.0  # 存储（MB）
    network_mbps: float = 0.0  # 网络带宽（Mbps）
    model_mb: float = 0.0  # 模型（MB）


class ResourceNode(BaseModel):
    """资源节点"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    type: NodeType
    capacity: ResourceCapacity
    usage: ResourceUsage = Field(default_factory=ResourceUsage)
    location: Optional[str] = None  # 节点位置
    online: bool = True  # 是否在线
    last_heartbeat: datetime = Field(default_factory=datetime.now)  # 最后心跳时间
    tags: List[str] = Field(default_factory=list)  # 标签
    cost_per_unit: Dict[str, float] = Field(default_factory=dict)  # 每单位资源成本
    
    def get_load(self, resource_type: ResourceType) -> float:
        """获取资源负载
        
        Args:
            resource_type: 资源类型
            
        Returns:
            float: 资源负载（0-1）
        """
        if resource_type == ResourceType.CPU:
            return self.usage.cpu_cores / self.capacity.cpu_cores if self.capacity.cpu_cores > 0 else 1.0
        elif resource_type == ResourceType.MEMORY:
            return self.usage.memory_mb / self.capacity.memory_mb if self.capacity.memory_mb > 0 else 1.0
        elif resource_type == ResourceType.GPU:
            return self.usage.gpu_cores / self.capacity.gpu_cores if self.capacity.gpu_cores > 0 else 1.0
        elif resource_type == ResourceType.STORAGE:
            return self.usage.storage_mb / self.capacity.storage_mb if self.capacity.storage_mb > 0 else 1.0
        elif resource_type == ResourceType.NETWORK:
            return self.usage.network_mbps / self.capacity.network_mbps if self.capacity.network_mbps > 0 else 1.0
        elif resource_type == ResourceType.MODEL:
            return self.usage.model_mb / self.capacity.model_capacity_mb if self.capacity.model_capacity_mb > 0 else 1.0
        else:
            return 0.0
    
    def get_average_load(self) -> float:
        """获取平均负载
        
        Returns:
            float: 平均负载（0-1）
        """
        loads = [
            self.get_load(ResourceType.CPU),
            self.get_load(ResourceType.MEMORY),
            self.get_load(ResourceType.GPU),
            self.get_load(ResourceType.STORAGE),
            self.get_load(ResourceType.NETWORK),
            self.get_load(ResourceType.MODEL)
        ]
        return sum(loads) / len(loads)
    
    def can_accommodate(self, requirement: TaskRequirement) -> bool:
        """检查是否可以容纳任务
        
        Args:
            requirement: 任务资源需求
            
        Returns:
            bool: 是否可以容纳
        """
        # 检查延迟要求
        if requirement.max_latency_ms is not None and self.capacity.latency_ms > requirement.max_latency_ms:
            return False
        
        # 检查实时任务要求
        if requirement.is_realtime and self.type != NodeType.EDGE:
            return False
        
        # 检查计算密集型任务要求
        if requirement.is_compute_intensive and self.type != NodeType.CLOUD and self.capacity.gpu_cores < 1:
            return False
        
        # 检查资源容量
        if self.usage.cpu_cores + requirement.cpu_cores > self.capacity.cpu_cores:
            return False
        if self.usage.memory_mb + requirement.memory_mb > self.capacity.memory_mb:
            return False
        if self.usage.gpu_cores + requirement.gpu_cores > self.capacity.gpu_cores:
            return False
        if self.usage.storage_mb + requirement.storage_mb > self.capacity.storage_mb:
            return False
        if self.usage.network_mbps + requirement.network_mbps > self.capacity.network_mbps:
            return False
        if self.usage.model_mb + requirement.model_size > self.capacity.model_capacity_mb:
            return False
        
        return True
    
    def allocate_resources(self, requirement: TaskRequirement) -> bool:
        """分配资源
        
        Args:
            requirement: 任务资源需求
            
        Returns:
            bool: 是否成功分配
        """
        if not self.can_accommodate(requirement):
            return False
        
        # 分配资源
        self.usage.cpu_cores += requirement.cpu_cores
        self.usage.memory_mb += requirement.memory_mb
        self.usage.gpu_cores += requirement.gpu_cores
        self.usage.storage_mb += requirement.storage_mb
        self.usage.network_mbps += requirement.network_mbps
        self.usage.model_mb += requirement.model_size
        
        return True
    
    def release_resources(self, requirement: TaskRequirement) -> None:
        """释放资源
        
        Args:
            requirement: 任务资源需求
        """
        # 释放资源
        self.usage.cpu_cores = max(0, self.usage.cpu_cores - requirement.cpu_cores)
        self.usage.memory_mb = max(0, self.usage.memory_mb - requirement.memory_mb)
        self.usage.gpu_cores = max(0, self.usage.gpu_cores - requirement.gpu_cores)
        self.usage.storage_mb = max(0, self.usage.storage_mb - requirement.storage_mb)
        self.usage.network_mbps = max(0, self.usage.network_mbps - requirement.network_mbps)
        self.usage.model_mb = max(0, self.usage.model_mb - requirement.model_size)
    
    def update_heartbeat(self) -> None:
        """更新心跳时间"""
        self.last_heartbeat = datetime.now()
    
    def is_alive(self, timeout_seconds: int = 60) -> bool:
        """检查节点是否存活
        
        Args:
            timeout_seconds: 超时时间（秒）
            
        Returns:
            bool: 是否存活
        """
        if not self.online:
            return False
        
        time_diff = (datetime.now() - self.last_heartbeat).total_seconds()
        return time_diff <= timeout_seconds


class AgentSkillVector(BaseModel):
    """智能体技能向量
    
    表示智能体在不同技能维度上的能力水平，取值范围为0-1。
    该类是资源调度系统中智能体能力表示的核心，用于：
    1. 记录和管理智能体在各个技能维度上的能力水平
    2. 支持标准技能（如自然语言处理、计算机视觉等）和自定义技能
    3. 提供技能向量间的相似度计算，用于智能体与任务的匹配
    4. 在find_best_agent方法中作为智能体选择的依据
    
    技能水平采用0-1的标准化表示：
    - 0表示完全不具备该技能
    - 1表示完全掌握该技能
    - 中间值表示部分掌握程度
    
    Example:
        ```python
        # 创建一个技能向量
        skills = AgentSkillVector(
            natural_language_processing=0.8,
            reasoning=0.7,
            planning=0.6
        )
        
        # 添加自定义技能
        skills.set_skill_level('domain_specific_knowledge', 0.9)
        ```
    """
    natural_language_processing: float = 0.0  # 自然语言处理
    computer_vision: float = 0.0  # 计算机视觉
    speech_recognition: float = 0.0  # 语音识别
    reasoning: float = 0.0  # 推理
    planning: float = 0.0  # 规划
    decision_making: float = 0.0  # 决策
    knowledge_retrieval: float = 0.0  # 知识检索
    code_generation: float = 0.0  # 代码生成
    data_analysis: float = 0.0  # 数据分析
    custom_skills: Dict[str, float] = Field(default_factory=dict)  # 自定义技能
    
    def get_skill_level(self, skill_name: str) -> float:
        """获取技能水平
        
        获取指定技能的水平值。该方法会先检查标准技能（类的属性），
        如果不是标准技能则检查自定义技能字典。如果两者都没有找到，则返回0.0。
        
        该方法在similarity和find_best_agent方法中被广泛使用，用于比较技能向量和计算匹配度。
        
        Args:
            skill_name: 技能名称，可以是标准技能（如'natural_language_processing'）
                        或自定义技能
            
        Returns:
            float: 技能水平（0-1范围内），0表示不具备该技能，1表示完全掌握
        """
        if hasattr(self, skill_name):
            return getattr(self, skill_name)
        elif skill_name in self.custom_skills:
            return self.custom_skills[skill_name]
        else:
            return 0.0
    
    def set_skill_level(self, skill_name: str, level: float) -> None:
        """设置技能水平
        
        设置指定技能的水平值。该方法会先验证技能水平是否在有效范围内（0-1），
        然后检查是否为标准技能（类的属性）。如果是标准技能，则直接设置属性值；
        如果不是标准技能，则添加或更新到自定义技能字典中。
        
        该方法在创建或更新智能体技能向量时使用，也在find_best_agent方法中用于
        创建任务需求的技能向量。
        
        Args:
            skill_name: 技能名称，可以是标准技能（如'natural_language_processing'）
                        或自定义技能
            level: 技能水平，必须在0-1范围内，0表示不具备该技能，1表示完全掌握
            
        Raises:
            ValueError: 当技能水平不在0-1范围内时抛出
        
        Example:
            ```python
            # 设置自然语言处理技能水平为0.8
            agent_skills.set_skill_level('natural_language_processing', 0.8)
            
            # 设置自定义技能
            agent_skills.set_skill_level('custom_skill_name', 0.6)
            ```
        """
        if level < 0 or level > 1:
            raise ValueError("技能水平必须在0-1范围内")
        
        if hasattr(self, skill_name):
            setattr(self, skill_name, level)
        else:
            self.custom_skills[skill_name] = level
    
    def similarity(self, other: "AgentSkillVector") -> float:
        """计算与另一个技能向量的相似度
        
        使用余弦相似度计算两个技能向量的相似度。余弦相似度衡量两个向量方向的相似程度，
        值越接近1表示两个技能向量越相似，值越接近0表示越不相似。
        
        该方法在资源调度器的find_best_agent方法中用于计算智能体与任务需求的匹配度。
        
        Args:
            other: 另一个技能向量，通常代表任务所需的技能要求
            
        Returns:
            float: 相似度（0-1范围内），1表示完全匹配，0表示完全不匹配
        
        Note:
            该方法会考虑所有标准技能和自定义技能，确保全面评估智能体能力
        """
        # 获取所有技能名称 - 合并两个技能向量中的所有技能维度
        all_skills = set()
        # 获取标准技能（类的属性，排除方法和特殊属性）
        for skill in dir(self):
            if not skill.startswith("_") and skill not in ["custom_skills", "similarity", "get_skill_level", "set_skill_level"]:
                all_skills.add(skill)
        
        # 添加两个向量中的所有自定义技能
        all_skills.update(self.custom_skills.keys())
        all_skills.update(other.custom_skills.keys())
        
        # 构建两个向量，确保维度一致 - 对于每个技能维度获取对应的技能水平
        vec1 = [self.get_skill_level(skill) for skill in all_skills]  # 当前智能体的技能水平
        vec2 = [other.get_skill_level(skill) for skill in all_skills]  # 目标技能水平（通常是任务需求）
        
        # 计算余弦相似度: cos(θ) = (A·B)/(|A|·|B|)
        # 1. 计算点积(A·B) - 两个向量对应元素相乘后求和
        dot_product = sum(a * b for a, b in zip(vec1, vec2))
        
        # 2. 计算两个向量的模长(magnitude)
        magnitude1 = math.sqrt(sum(a * a for a in vec1))  # |A| = √(a₁²+a₂²+...+aₙ²)
        magnitude2 = math.sqrt(sum(b * b for b in vec2))  # |B| = √(b₁²+b₂²+...+bₙ²)
        
        # 3. 处理零向量情况 - 避免除以零错误
        if magnitude1 == 0 or magnitude2 == 0:
            return 0.0  # 如果任一向量为零向量，相似度为0
        
        # 4. 返回余弦相似度 - 值域为[0,1]，1表示完全相似，0表示完全不相似
        return dot_product / (magnitude1 * magnitude2)


class TaskAllocation(BaseModel):
    """任务分配"""
    task_id: str  # 任务ID
    agent_id: str  # 智能体ID
    node_id: str  # 节点ID
    requirement: TaskRequirement  # 资源需求
    allocated_at: datetime = Field(default_factory=datetime.now)  # 分配时间
    expected_completion: Optional[datetime] = None  # 预期完成时间
    priority: int = 0  # 优先级


class ResourceScheduler:
    """资源调度器
    
    实现基于博弈论的资源调度机制和边缘-云协同计算
    """
    def __init__(self):
        """初始化资源调度器"""
        self.nodes: Dict[str, ResourceNode] = {}  # 节点字典，键为节点ID
        self.agent_skills: Dict[str, AgentSkillVector] = {}  # 智能体技能字典，键为智能体ID
        self.task_allocations: Dict[str, TaskAllocation] = {}  # 任务分配字典，键为任务ID
        self.alpha: float = 0.5  # 任务质量权重
        self.beta: float = 0.3  # 负载权重
        self.gamma: float = 0.2  # 能耗权重
    
    def register_node(self, node: ResourceNode) -> str:
        """注册节点
        
        Args:
            node: 资源节点
            
        Returns:
            str: 节点ID
        """
        self.nodes[node.id] = node
        return node.id
    
    def unregister_node(self, node_id: str) -> None:
        """注销节点
        
        Args:
            node_id: 节点ID
            
        Raises:
            ValueError: 节点ID不存在
        """
        if node_id not in self.nodes:
            raise ValueError(f"节点ID不存在: {node_id}")
        del self.nodes[node_id]
    
    def register_agent_skills(self, agent_id: str, skills: AgentSkillVector) -> None:
        """注册智能体技能
        
        Args:
            agent_id: 智能体ID
            skills: 技能向量
        """
        self.agent_skills[agent_id] = skills
    
    def update_agent_skills(self, agent_id: str, skills: AgentSkillVector) -> None:
        """更新智能体技能
        
        Args:
            agent_id: 智能体ID
            skills: 技能向量
            
        Raises:
            ValueError: 智能体ID不存在
        """
        if agent_id not in self.agent_skills:
            raise ValueError(f"智能体ID不存在: {agent_id}")
        self.agent_skills[agent_id] = skills
    
    def allocate_task(self, task_id: str, agent_id: str, requirement: TaskRequirement, 
                      priority: int = 0) -> Optional[str]:
        """分配任务
        
        Args:
            task_id: 任务ID
            agent_id: 智能体ID
            requirement: 资源需求
            priority: 优先级
            
        Returns:
            Optional[str]: 分配的节点ID，如果无法分配则返回None
        """
        # 找出可以容纳任务的节点
        suitable_nodes = [node for node in self.nodes.values() 
                         if node.online and node.can_accommodate(requirement)]
        
        if not suitable_nodes:
            return None
        
        # 根据任务特性选择合适的节点
        if requirement.is_realtime:
            # 实时任务优先选择边缘节点
            edge_nodes = [node for node in suitable_nodes if node.type == NodeType.EDGE]
            if edge_nodes:
                suitable_nodes = edge_nodes
        elif requirement.is_compute_intensive:
            # 计算密集型任务优先选择云端节点
            cloud_nodes = [node for node in suitable_nodes if node.type == NodeType.CLOUD]
            if cloud_nodes:
                suitable_nodes = cloud_nodes
        
        # 计算每个节点的效用值
        node_utilities = {}
        for node in suitable_nodes:
            # 计算任务质量（基于节点类型和延迟）
            task_quality = 1.0
            if requirement.max_latency_ms is not None:
                latency_ratio = node.capacity.latency_ms / requirement.max_latency_ms
                task_quality = max(0, 1 - latency_ratio)
            
            # 计算负载（负载越低越好）
            load = node.get_average_load()
            load_factor = 1 - load
            
            # 计算能耗（基于节点类型和资源使用）
            energy_cost = 0.5  # 默认中等能耗
            if node.type == NodeType.EDGE:
                energy_cost = 0.3  # 边缘节点能耗较低
            elif node.type == NodeType.CLOUD:
                energy_cost = 0.7  # 云端节点能耗较高
            
            # 计算效用值：U_i = α·TaskQuality + β·(1-Load) - γ·EnergyCost
            utility = self.alpha * task_quality + self.beta * load_factor - self.gamma * energy_cost
            node_utilities[node.id] = utility
        
        # 选择效用值最高的节点
        best_node_id = max(node_utilities.items(), key=lambda x: x[1])[0]
        best_node = self.nodes[best_node_id]
        
        # 分配资源
        if best_node.allocate_resources(requirement):
            # 创建任务分配记录
            allocation = TaskAllocation(
                task_id=task_id,
                agent_id=agent_id,
                node_id=best_node_id,
                requirement=requirement,
                priority=priority
            )
            self.task_allocations[task_id] = allocation
            return best_node_id
        
        return None
    
    def release_task(self, task_id: str) -> bool:
        """释放任务
        
        Args:
            task_id: 任务ID
            
        Returns:
            bool: 是否成功释放
        """
        if task_id not in self.task_allocations:
            return False
        
        allocation = self.task_allocations[task_id]
        node_id = allocation.node_id
        
        if node_id in self.nodes:
            self.nodes[node_id].release_resources(allocation.requirement)
        
        del self.task_allocations[task_id]
        return True
    
    def find_best_agent(self, required_skills: Dict[str, float], 
                       excluded_agents: List[str] = None) -> Optional[str]:
        """找出最适合的智能体
        
        根据技能需求找出最适合的智能体。该方法会检查每个智能体是否满足所有技能的最低要求，
        然后计算智能体技能向量与需求技能向量的相似度，选择相似度最高的智能体。
        
        Args:
            required_skills: 所需技能字典，键为技能名称，值为最低要求水平（0-1范围内）
            excluded_agents: 排除的智能体ID列表，这些智能体不会被考虑
            
        Returns:
            Optional[str]: 最适合的智能体ID，如果没有合适的智能体则返回None
            
        Example:
            ```python
            # 查找具有自然语言处理和推理能力的智能体
            best_agent_id = scheduler.find_best_agent({
                'natural_language_processing': 0.7,
                'reasoning': 0.5
            })
            ```
        """
        if excluded_agents is None:
            excluded_agents = []
        
        # 创建所需技能向量 - 将字典转换为AgentSkillVector对象
        required_vector = AgentSkillVector()
        for skill_name, level in required_skills.items():
            required_vector.set_skill_level(skill_name, level)
        
        # 计算每个智能体的适合度（fitness）
        agent_fitness = {}
        for agent_id, skills in self.agent_skills.items():
            # 跳过被排除的智能体
            if agent_id in excluded_agents:
                continue
            
            # 检查是否满足所有技能的最低要求
            meets_requirements = True
            for skill_name, level in required_skills.items():
                # 如果任一技能不满足要求，则标记为不符合并跳出循环
                if skills.get_skill_level(skill_name) < level:
                    meets_requirements = False
                    break
            
            # 只有满足所有最低要求的智能体才会被考虑
            if meets_requirements:
                # 使用余弦相似度计算技能向量的匹配程度作为适合度
                fitness = skills.similarity(required_vector)
                agent_fitness[agent_id] = fitness
        
        # 如果没有找到符合要求的智能体，返回None
        if not agent_fitness:
            return None
        
        # 返回适合度最高的智能体ID
        best_agent_id = max(agent_fitness.items(), key=lambda x: x[1])[0]
        
        # 注意：该方法是智能体选择的核心，通过技能匹配确保任务分配给最合适的智能体
        # 它与allocate_task方法配合使用，形成完整的任务分配流程：
        # 1. 先用find_best_agent找出最适合的智能体
        # 2. 再用allocate_task为该智能体分配合适的计算节点
        return best_agent_id
    
    def get_node_status(self) -> Dict[str, Dict[str, Any]]:
        """获取节点状态
        
        Returns:
            Dict[str, Dict[str, Any]]: 节点状态字典，键为节点ID
        """
        status = {}
        for node_id, node in self.nodes.items():
            status[node_id] = {
                "name": node.name,
                "type": node.type.value,
                "online": node.online,
                "load": node.get_average_load(),
                "cpu_load": node.get_load(ResourceType.CPU),
                "memory_load": node.get_load(ResourceType.MEMORY),
                "gpu_load": node.get_load(ResourceType.GPU),
                "is_alive": node.is_alive()
            }
        return status
    
    def get_task_status(self) -> Dict[str, Dict[str, Any]]:
        """获取任务状态
        
        Returns:
            Dict[str, Dict[str, Any]]: 任务状态字典，键为任务ID
        """
        status = {}
        for task_id, allocation in self.task_allocations.items():
            status[task_id] = {
                "agent_id": allocation.agent_id,
                "node_id": allocation.node_id,
                "allocated_at": allocation.allocated_at.isoformat(),
                "priority": allocation.priority
            }
        return status
    
    def optimize_allocations(self) -> int:
        """优化任务分配
        
        重新分配任务以优化资源利用率
        
        Returns:
            int: 重新分配的任务数量
        """
        # 按优先级排序任务分配
        sorted_allocations = sorted(
            self.task_allocations.values(),
            key=lambda a: a.priority,
            reverse=True
        )
        
        # 临时释放所有资源
        for node in self.nodes.values():
            node.usage = ResourceUsage()
        
        # 重新分配任务
        reallocated_count = 0
        failed_allocations = []
        
        for allocation in sorted_allocations:
            # 尝试重新分配任务
            node_id = self.allocate_task(
                allocation.task_id,
                allocation.agent_id,
                allocation.requirement,
                allocation.priority
            )
            
            if node_id is None:
                # 分配失败，记录下来稍后处理
                failed_allocations.append(allocation)
            elif node_id != allocation.node_id:
                # 分配到不同的节点，计数
                reallocated_count += 1
        
        # 处理分配失败的任务
        for allocation in failed_allocations:
            # 尝试降低资源需求
            reduced_requirement = TaskRequirement(
                cpu_cores=allocation.requirement.cpu_cores * 0.8,
                memory_mb=allocation.requirement.memory_mb * 0.8,
                gpu_cores=allocation.requirement.gpu_cores * 0.8,
                storage_mb=allocation.requirement.storage_mb,
                network_mbps=allocation.requirement.network_mbps,
                model_size=allocation.requirement.model_size,
                max_latency_ms=allocation.requirement.max_latency_ms,
                is_realtime=allocation.requirement.is_realtime,
                is_compute_intensive=allocation.requirement.is_compute_intensive
            )
            
            node_id = self.allocate_task(
                allocation.task_id,
                allocation.agent_id,
                reduced_requirement,
                allocation.priority
            )
            
            if node_id is None:
                # 仍然无法分配，记录错误
                logger.error(f"无法重新分配任务: {allocation.task_id}")
        
        return reallocated_count
    
    def handle_node_failure(self, node_id: str) -> List[str]:
        """处理节点故障
        
        将故障节点上的任务重新分配到其他节点
        
        Args:
            node_id: 故障节点ID
            
        Returns:
            List[str]: 无法重新分配的任务ID列表
        """
        if node_id not in self.nodes:
            return []
        
        # 将节点标记为离线
        self.nodes[node_id].online = False
        
        # 找出在故障节点上运行的任务
        affected_tasks = [allocation for allocation in self.task_allocations.values() 
                         if allocation.node_id == node_id]
        
        # 尝试重新分配任务
        failed_tasks = []
        for allocation in affected_tasks:
            # 释放任务
            self.release_task(allocation.task_id)
            
            # 尝试重新分配
            new_node_id = self.allocate_task(
                allocation.task_id,
                allocation.agent_id,
                allocation.requirement,
                allocation.priority
            )
            
            if new_node_id is None:
                failed_tasks.append(allocation.task_id)
        
        return failed_tasks
    
    def set_incentive_weights(self, alpha: float, beta: float, gamma: float) -> None:
        """设置激励权重
        
        Args:
            alpha: 任务质量权重
            beta: 负载权重
            gamma: 能耗权重
            
        Raises:
            ValueError: 权重和不为1
        """
        if abs(alpha + beta + gamma - 1.0) > 1e-6:
            raise ValueError("权重和必须为1")
        
        self.alpha = alpha
        self.beta = beta
        self.gamma = gamma