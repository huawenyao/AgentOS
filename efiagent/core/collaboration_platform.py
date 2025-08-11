"""协作平台模块

该模块实现了EFIAgent 2.0的协作平台核心功能，包括任务规划器、能力调度器、
协作协调器和性能优化器等组件，支持多Agent智能协作和能力编排。
"""

import uuid
import json
import time
import asyncio
from enum import Enum
from typing import Dict, List, Set, Optional, Any, Tuple, Callable, Union
from datetime import datetime, timedelta
from pydantic import BaseModel, Field, validator
from loguru import logger
from dataclasses import dataclass
from collections import defaultdict, deque
import networkx as nx
import numpy as np
from concurrent.futures import ThreadPoolExecutor, as_completed

from efiagent.core.communication import MessageBroker, Message, MessageType, MessagePriority
from efiagent.core.consensus import ConsensusVerifier, ConsensusProposal, Vote, VoteType
from efiagent.agent.base_agent import AgentConfig, AgentCapability, AgentContext


class TaskStatus(str, Enum):
    """任务状态枚举"""
    PENDING = "pending"  # 待处理
    PLANNING = "planning"  # 规划中
    SCHEDULED = "scheduled"  # 已调度
    EXECUTING = "executing"  # 执行中
    COMPLETED = "completed"  # 已完成
    FAILED = "failed"  # 失败
    CANCELLED = "cancelled"  # 已取消


class CollaborationMode(str, Enum):
    """协作模式枚举"""
    HIERARCHICAL = "hierarchical"  # 层次化协作
    PEER_TO_PEER = "peer_to_peer"  # 对等协作
    COMPETITIVE = "competitive"  # 竞争协作
    COOPERATIVE = "cooperative"  # 合作协作
    SWARM = "swarm"  # 群体智能
    PIPELINE = "pipeline"  # 流水线协作


class CapabilityType(str, Enum):
    """能力类型枚举"""
    COGNITIVE = "cognitive"  # 认知能力
    REASONING = "reasoning"  # 推理能力
    DECISION = "decision"  # 决策能力
    LEARNING = "learning"  # 学习能力
    EXECUTION = "execution"  # 执行能力
    COMMUNICATION = "communication"  # 通信能力


class TaskPriority(int, Enum):
    """任务优先级枚举"""
    LOW = 0
    NORMAL = 1
    HIGH = 2
    CRITICAL = 3


@dataclass
class TaskNode:
    """任务节点"""
    id: str
    name: str
    description: str
    task_type: str
    parameters: Dict[str, Any]
    required_capabilities: List[str]
    estimated_duration: float  # 预估执行时间（秒）
    priority: TaskPriority
    dependencies: List[str]  # 依赖的任务ID列表
    status: TaskStatus = TaskStatus.PENDING
    assigned_agent: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    metadata: Dict[str, Any] = None

    def __post_init__(self):
        if self.metadata is None:
            self.metadata = {}


class TaskPlan(BaseModel):
    """任务计划"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    tasks: Dict[str, TaskNode] = Field(default_factory=dict)
    dependencies: Dict[str, List[str]] = Field(default_factory=dict)  # 任务依赖关系
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
    status: TaskStatus = TaskStatus.PENDING
    metadata: Dict[str, Any] = Field(default_factory=dict)

    def add_task(self, task: TaskNode) -> None:
        """添加任务
        
        Args:
            task: 任务节点
        """
        self.tasks[task.id] = task
        self.dependencies[task.id] = task.dependencies.copy()
        self.updated_at = datetime.now()

    def get_ready_tasks(self) -> List[TaskNode]:
        """获取可执行的任务（所有依赖都已完成）
        
        Returns:
            List[TaskNode]: 可执行的任务列表
        """
        ready_tasks = []
        for task_id, task in self.tasks.items():
            if task.status == TaskStatus.PENDING:
                # 检查所有依赖是否已完成
                dependencies_completed = all(
                    self.tasks[dep_id].status == TaskStatus.COMPLETED
                    for dep_id in self.dependencies[task_id]
                    if dep_id in self.tasks
                )
                if dependencies_completed:
                    ready_tasks.append(task)
        return ready_tasks

    def get_task_graph(self) -> nx.DiGraph:
        """获取任务依赖图
        
        Returns:
            nx.DiGraph: 任务依赖图
        """
        graph = nx.DiGraph()
        
        # 添加节点
        for task_id, task in self.tasks.items():
            graph.add_node(task_id, task=task)
        
        # 添加边
        for task_id, deps in self.dependencies.items():
            for dep_id in deps:
                if dep_id in self.tasks:
                    graph.add_edge(dep_id, task_id)
        
        return graph


class TaskPlanner:
    """任务规划器
    
    负责复杂任务分解、依赖关系分析、执行计划生成和动态调整机制
    """
    
    def __init__(self):
        """初始化任务规划器"""
        self.task_plans: Dict[str, TaskPlan] = {}  # 任务计划字典
        self.task_templates: Dict[str, Dict[str, Any]] = {}  # 任务模板
        self.decomposition_rules: Dict[str, Callable] = {}  # 分解规则
        
        # 注册默认分解规则
        self._register_default_decomposition_rules()
    
    def _register_default_decomposition_rules(self) -> None:
        """注册默认分解规则"""
        
        def data_analysis_decomposition(task_desc: str, params: Dict[str, Any]) -> List[TaskNode]:
            """数据分析任务分解"""
            tasks = []
            base_id = str(uuid.uuid4())[:8]
            
            # 数据收集任务
            collect_task = TaskNode(
                id=f"collect_{base_id}",
                name="数据收集",
                description="收集和准备分析数据",
                task_type="data_collection",
                parameters={"data_source": params.get("data_source", "")},
                required_capabilities=["data_ingestion", "data_validation"],
                estimated_duration=300.0,  # 5分钟
                priority=TaskPriority.HIGH,
                dependencies=[]
            )
            tasks.append(collect_task)
            
            # 数据预处理任务
            preprocess_task = TaskNode(
                id=f"preprocess_{base_id}",
                name="数据预处理",
                description="清洗和转换数据",
                task_type="data_preprocessing",
                parameters={"cleaning_rules": params.get("cleaning_rules", [])},
                required_capabilities=["data_cleaning", "data_transformation"],
                estimated_duration=600.0,  # 10分钟
                priority=TaskPriority.NORMAL,
                dependencies=[collect_task.id]
            )
            tasks.append(preprocess_task)
            
            # 数据分析任务
            analyze_task = TaskNode(
                id=f"analyze_{base_id}",
                name="数据分析",
                description="执行统计分析和模式识别",
                task_type="data_analysis",
                parameters={"analysis_type": params.get("analysis_type", "descriptive")},
                required_capabilities=["statistical_analysis", "pattern_recognition"],
                estimated_duration=900.0,  # 15分钟
                priority=TaskPriority.HIGH,
                dependencies=[preprocess_task.id]
            )
            tasks.append(analyze_task)
            
            # 报告生成任务
            report_task = TaskNode(
                id=f"report_{base_id}",
                name="报告生成",
                description="生成分析报告和可视化",
                task_type="report_generation",
                parameters={"report_format": params.get("report_format", "pdf")},
                required_capabilities=["report_generation", "data_visualization"],
                estimated_duration=300.0,  # 5分钟
                priority=TaskPriority.NORMAL,
                dependencies=[analyze_task.id]
            )
            tasks.append(report_task)
            
            return tasks
        
        def workflow_automation_decomposition(task_desc: str, params: Dict[str, Any]) -> List[TaskNode]:
            """工作流自动化任务分解"""
            tasks = []
            base_id = str(uuid.uuid4())[:8]
            
            # 需求分析任务
            analysis_task = TaskNode(
                id=f"analysis_{base_id}",
                name="需求分析",
                description="分析工作流需求和约束",
                task_type="requirement_analysis",
                parameters={"requirements": params.get("requirements", {})},
                required_capabilities=["requirement_analysis", "process_modeling"],
                estimated_duration=600.0,
                priority=TaskPriority.HIGH,
                dependencies=[]
            )
            tasks.append(analysis_task)
            
            # 流程设计任务
            design_task = TaskNode(
                id=f"design_{base_id}",
                name="流程设计",
                description="设计自动化工作流程",
                task_type="process_design",
                parameters={"design_constraints": params.get("constraints", {})},
                required_capabilities=["process_design", "workflow_modeling"],
                estimated_duration=1200.0,
                priority=TaskPriority.HIGH,
                dependencies=[analysis_task.id]
            )
            tasks.append(design_task)
            
            # 实现任务
            implementation_task = TaskNode(
                id=f"implement_{base_id}",
                name="流程实现",
                description="实现和配置自动化流程",
                task_type="process_implementation",
                parameters={"implementation_platform": params.get("platform", "default")},
                required_capabilities=["process_implementation", "system_integration"],
                estimated_duration=1800.0,
                priority=TaskPriority.NORMAL,
                dependencies=[design_task.id]
            )
            tasks.append(implementation_task)
            
            # 测试任务
            test_task = TaskNode(
                id=f"test_{base_id}",
                name="流程测试",
                description="测试和验证自动化流程",
                task_type="process_testing",
                parameters={"test_scenarios": params.get("test_scenarios", [])},
                required_capabilities=["process_testing", "quality_assurance"],
                estimated_duration=900.0,
                priority=TaskPriority.HIGH,
                dependencies=[implementation_task.id]
            )
            tasks.append(test_task)
            
            return tasks
        
        # 注册分解规则
        self.decomposition_rules["data_analysis"] = data_analysis_decomposition
        self.decomposition_rules["workflow_automation"] = workflow_automation_decomposition
    
    def decompose_task(self, task_description: str, task_type: str, 
                      parameters: Dict[str, Any] = None) -> TaskPlan:
        """分解复杂任务
        
        Args:
            task_description: 任务描述
            task_type: 任务类型
            parameters: 任务参数
            
        Returns:
            TaskPlan: 任务计划
        """
        if parameters is None:
            parameters = {}
        
        # 创建任务计划
        plan = TaskPlan(
            name=f"{task_type}任务计划",
            description=task_description
        )
        
        # 根据任务类型选择分解规则
        if task_type in self.decomposition_rules:
            decomposition_func = self.decomposition_rules[task_type]
            subtasks = decomposition_func(task_description, parameters)
            
            # 添加子任务到计划
            for task in subtasks:
                plan.add_task(task)
        else:
            # 默认分解：创建单个任务
            task = TaskNode(
                id=str(uuid.uuid4()),
                name=task_description,
                description=task_description,
                task_type=task_type,
                parameters=parameters,
                required_capabilities=[task_type],
                estimated_duration=600.0,  # 默认10分钟
                priority=TaskPriority.NORMAL,
                dependencies=[]
            )
            plan.add_task(task)
        
        # 保存计划
        self.task_plans[plan.id] = plan
        
        logger.info(f"任务分解完成: {plan.id}, 包含 {len(plan.tasks)} 个子任务")
        return plan
    
    def create_task_plan(self, 
                        description: str,
                        requirements: Dict[str, Any],
                        priority: TaskPriority = TaskPriority.NORMAL,
                        deadline: Optional[datetime] = None) -> Optional[TaskPlan]:
        """创建任务计划
        
        Args:
            description: 任务描述
            requirements: 任务需求
            priority: 任务优先级
            deadline: 截止时间
            
        Returns:
            Optional[TaskPlan]: 任务计划，如果创建失败则返回None
        """
        try:
            # 从需求中提取任务类型
            task_type = requirements.get("task_type", "general")
            
            # 使用分解方法创建计划
            task_plan = self.decompose_task(
                task_description=description,
                task_type=task_type,
                parameters=requirements
            )
            
            # 设置优先级和截止时间
            for task in task_plan.tasks.values():
                task.priority = priority
                if deadline:
                    task.deadline = deadline
            
            # 分析依赖关系
            self.analyze_dependencies(task_plan)
            
            logger.info(f"任务计划创建成功: {task_plan.id}")
            return task_plan
            
        except Exception as e:
            logger.error(f"任务计划创建失败: {description}, 错误: {e}")
            return None
    
    def analyze_dependencies(self, plan: TaskPlan) -> Dict[str, List[str]]:
        """分析任务依赖关系
        
        Args:
            plan: 任务计划
            
        Returns:
            Dict[str, List[str]]: 依赖关系图
        """
        dependencies = {}
        
        for task_id, task in plan.tasks.items():
            dependencies[task_id] = task.dependencies.copy()
        
        # 检测循环依赖
        graph = plan.get_task_graph()
        if not nx.is_directed_acyclic_graph(graph):
            cycles = list(nx.simple_cycles(graph))
            logger.warning(f"检测到循环依赖: {cycles}")
            # 尝试解决循环依赖
            self._resolve_circular_dependencies(plan, cycles)
        
        return dependencies
    
    def _resolve_circular_dependencies(self, plan: TaskPlan, cycles: List[List[str]]) -> None:
        """解决循环依赖
        
        Args:
            plan: 任务计划
            cycles: 循环依赖列表
        """
        for cycle in cycles:
            # 简单策略：移除循环中最后一条边
            if len(cycle) >= 2:
                last_task_id = cycle[-1]
                first_task_id = cycle[0]
                
                if last_task_id in plan.tasks and first_task_id in plan.dependencies[last_task_id]:
                    plan.dependencies[last_task_id].remove(first_task_id)
                    plan.tasks[last_task_id].dependencies.remove(first_task_id)
                    logger.info(f"移除循环依赖: {last_task_id} -> {first_task_id}")
    
    def generate_execution_plan(self, plan: TaskPlan) -> List[List[str]]:
        """生成执行计划
        
        Args:
            plan: 任务计划
            
        Returns:
            List[List[str]]: 执行阶段列表，每个阶段包含可并行执行的任务ID
        """
        graph = plan.get_task_graph()
        
        # 拓扑排序
        try:
            topo_order = list(nx.topological_sort(graph))
        except nx.NetworkXError:
            logger.error("无法进行拓扑排序，可能存在循环依赖")
            return []
        
        # 按层级组织任务
        execution_stages = []
        remaining_tasks = set(topo_order)
        
        while remaining_tasks:
            current_stage = []
            
            # 找到当前可执行的任务（没有未完成的依赖）
            for task_id in list(remaining_tasks):
                dependencies = plan.dependencies.get(task_id, [])
                if all(dep_id not in remaining_tasks for dep_id in dependencies):
                    current_stage.append(task_id)
            
            # 从剩余任务中移除当前阶段的任务
            for task_id in current_stage:
                remaining_tasks.remove(task_id)
            
            if current_stage:
                execution_stages.append(current_stage)
            else:
                # 防止无限循环
                logger.error("无法生成执行计划，可能存在依赖问题")
                break
        
        logger.info(f"生成执行计划: {len(execution_stages)} 个阶段")
        return execution_stages
    
    def update_task_status(self, plan_id: str, task_id: str, status: TaskStatus, 
                          result: Dict[str, Any] = None, error: str = None) -> bool:
        """更新任务状态
        
        Args:
            plan_id: 计划ID
            task_id: 任务ID
            status: 新状态
            result: 执行结果
            error: 错误信息
            
        Returns:
            bool: 是否成功更新
        """
        if plan_id not in self.task_plans:
            logger.error(f"计划不存在: {plan_id}")
            return False
        
        plan = self.task_plans[plan_id]
        if task_id not in plan.tasks:
            logger.error(f"任务不存在: {task_id}")
            return False
        
        task = plan.tasks[task_id]
        old_status = task.status
        task.status = status
        
        if status == TaskStatus.EXECUTING and task.start_time is None:
            task.start_time = datetime.now()
        elif status in [TaskStatus.COMPLETED, TaskStatus.FAILED, TaskStatus.CANCELLED]:
            task.end_time = datetime.now()
            if result:
                task.result = result
            if error:
                task.error = error
        
        plan.updated_at = datetime.now()
        
        logger.info(f"任务状态更新: {task_id} {old_status} -> {status}")
        return True
    
    def get_plan(self, plan_id: str) -> Optional[TaskPlan]:
        """获取任务计划
        
        Args:
            plan_id: 计划ID
            
        Returns:
            Optional[TaskPlan]: 任务计划
        """
        return self.task_plans.get(plan_id)
    
    def get_plan_progress(self, plan_id: str) -> Dict[str, Any]:
        """获取计划进度
        
        Args:
            plan_id: 计划ID
            
        Returns:
            Dict[str, Any]: 进度信息
        """
        if plan_id not in self.task_plans:
            return {}
        
        plan = self.task_plans[plan_id]
        total_tasks = len(plan.tasks)
        
        if total_tasks == 0:
            return {"progress": 0.0, "status": "empty"}
        
        status_counts = defaultdict(int)
        for task in plan.tasks.values():
            status_counts[task.status] += 1
        
        completed = status_counts[TaskStatus.COMPLETED]
        failed = status_counts[TaskStatus.FAILED]
        cancelled = status_counts[TaskStatus.CANCELLED]
        executing = status_counts[TaskStatus.EXECUTING]
        pending = status_counts[TaskStatus.PENDING]
        
        progress = completed / total_tasks
        
        # 确定整体状态
        if completed == total_tasks:
            overall_status = "completed"
        elif failed > 0 or cancelled > 0:
            overall_status = "failed"
        elif executing > 0:
            overall_status = "executing"
        else:
            overall_status = "pending"
        
        return {
            "progress": progress,
            "status": overall_status,
            "total_tasks": total_tasks,
            "completed": completed,
            "failed": failed,
            "cancelled": cancelled,
            "executing": executing,
            "pending": pending
        }


class AgentResource(BaseModel):
    """Agent资源信息"""
    agent_id: str
    agent_config: AgentConfig
    current_load: float = 0.0  # 当前负载 (0.0-1.0)
    max_concurrent_tasks: int = 5  # 最大并发任务数
    current_tasks: List[str] = Field(default_factory=list)  # 当前执行的任务ID列表
    capabilities: List[AgentCapability] = Field(default_factory=list)
    performance_metrics: Dict[str, float] = Field(default_factory=dict)  # 性能指标
    last_heartbeat: datetime = Field(default_factory=datetime.now)
    status: str = "idle"  # idle, busy, offline, error
    metadata: Dict[str, Any] = Field(default_factory=dict)

    def is_available(self) -> bool:
        """检查Agent是否可用
        
        Returns:
            bool: 是否可用
        """
        return (
            self.status in ["idle", "busy"] and
            len(self.current_tasks) < self.max_concurrent_tasks and
            self.current_load < 0.9  # 负载阈值
        )

    def get_capability_score(self, required_capabilities: List[str]) -> float:
        """计算能力匹配分数
        
        Args:
            required_capabilities: 所需能力列表
            
        Returns:
            float: 匹配分数 (0.0-1.0)
        """
        if not required_capabilities:
            return 1.0
        
        agent_capabilities = {cap.name for cap in self.capabilities}
        matched = sum(1 for cap in required_capabilities if cap in agent_capabilities)
        return matched / len(required_capabilities)

    def add_task(self, task_id: str) -> None:
        """添加任务
        
        Args:
            task_id: 任务ID
        """
        if task_id not in self.current_tasks:
            self.current_tasks.append(task_id)
            self.current_load = min(1.0, len(self.current_tasks) / self.max_concurrent_tasks)
            self.status = "busy" if self.current_tasks else "idle"

    def remove_task(self, task_id: str) -> None:
        """移除任务
        
        Args:
            task_id: 任务ID
        """
        if task_id in self.current_tasks:
            self.current_tasks.remove(task_id)
            self.current_load = len(self.current_tasks) / self.max_concurrent_tasks
            self.status = "busy" if self.current_tasks else "idle"


class CapabilityScheduler:
    """能力调度器
    
    负责Agent能力匹配、资源分配、负载均衡和性能监控
    """
    
    def __init__(self, message_broker: MessageBroker):
        """初始化能力调度器
        
        Args:
            message_broker: 消息代理
        """
        self.message_broker = message_broker
        self.agents: Dict[str, AgentResource] = {}  # Agent资源字典
        self.capability_index: Dict[str, Set[str]] = defaultdict(set)  # 能力索引
        self.task_assignments: Dict[str, str] = {}  # 任务分配记录
        self.performance_history: Dict[str, deque] = defaultdict(lambda: deque(maxlen=100))  # 性能历史
        self.load_balancer_weights: Dict[str, float] = {}  # 负载均衡权重
        
        # 调度策略配置
        self.scheduling_strategy = "capability_first"  # capability_first, load_balanced, performance_based
        self.load_threshold = 0.8  # 负载阈值
        self.heartbeat_timeout = 300  # 心跳超时时间（秒）
    
    def register_agent(self, agent_config: AgentConfig, 
                      max_concurrent_tasks: int = 5) -> bool:
        """注册Agent
        
        Args:
            agent_config: Agent配置
            max_concurrent_tasks: 最大并发任务数
            
        Returns:
            bool: 是否成功注册
        """
        try:
            agent_resource = AgentResource(
                agent_id=agent_config.id,
                agent_config=agent_config,
                max_concurrent_tasks=max_concurrent_tasks,
                capabilities=agent_config.capabilities
            )
            
            self.agents[agent_config.id] = agent_resource
            
            # 更新能力索引
            for capability in agent_config.capabilities:
                self.capability_index[capability.name].add(agent_config.id)
            
            # 初始化负载均衡权重
            self.load_balancer_weights[agent_config.id] = 1.0
            
            logger.info(f"Agent注册成功: {agent_config.id}")
            return True
            
        except Exception as e:
            logger.error(f"Agent注册失败: {agent_config.id}, 错误: {e}")
            return False
    
    def unregister_agent(self, agent_id: str) -> bool:
        """注销Agent
        
        Args:
            agent_id: Agent ID
            
        Returns:
            bool: 是否成功注销
        """
        if agent_id not in self.agents:
            logger.warning(f"Agent不存在: {agent_id}")
            return False
        
        agent_resource = self.agents[agent_id]
        
        # 从能力索引中移除
        for capability in agent_resource.capabilities:
            self.capability_index[capability.name].discard(agent_id)
        
        # 移除Agent
        del self.agents[agent_id]
        
        # 清理相关数据
        if agent_id in self.load_balancer_weights:
            del self.load_balancer_weights[agent_id]
        if agent_id in self.performance_history:
            del self.performance_history[agent_id]
        
        logger.info(f"Agent注销成功: {agent_id}")
        return True
    
    def find_suitable_agents(self, required_capabilities: List[str], 
                           task_priority: TaskPriority = TaskPriority.NORMAL,
                           exclude_agents: Set[str] = None) -> List[Tuple[str, float]]:
        """查找合适的Agent
        
        Args:
            required_capabilities: 所需能力列表
            task_priority: 任务优先级
            exclude_agents: 排除的Agent集合
            
        Returns:
            List[Tuple[str, float]]: (Agent ID, 匹配分数) 列表，按分数降序排列
        """
        if exclude_agents is None:
            exclude_agents = set()
        
        candidates = []
        
        # 获取具有所需能力的Agent候选集合
        candidate_agents = set()
        if required_capabilities:
            # 取所有能力的交集
            for capability in required_capabilities:
                if capability in self.capability_index:
                    if not candidate_agents:
                        candidate_agents = self.capability_index[capability].copy()
                    else:
                        candidate_agents &= self.capability_index[capability]
        else:
            # 如果没有特定能力要求，考虑所有Agent
            candidate_agents = set(self.agents.keys())
        
        # 过滤和评分
        for agent_id in candidate_agents:
            if agent_id in exclude_agents:
                continue
                
            agent_resource = self.agents.get(agent_id)
            if not agent_resource or not agent_resource.is_available():
                continue
            
            # 计算综合分数
            score = self._calculate_agent_score(
                agent_resource, required_capabilities, task_priority
            )
            
            candidates.append((agent_id, score))
        
        # 按分数降序排列
        candidates.sort(key=lambda x: x[1], reverse=True)
        
        logger.debug(f"找到 {len(candidates)} 个合适的Agent")
        return candidates
    
    def _calculate_agent_score(self, agent_resource: AgentResource, 
                              required_capabilities: List[str],
                              task_priority: TaskPriority) -> float:
        """计算Agent综合分数
        
        Args:
            agent_resource: Agent资源
            required_capabilities: 所需能力
            task_priority: 任务优先级
            
        Returns:
            float: 综合分数
        """
        # 能力匹配分数 (权重: 0.4)
        capability_score = agent_resource.get_capability_score(required_capabilities)
        
        # 负载分数 (权重: 0.3) - 负载越低分数越高
        load_score = 1.0 - agent_resource.current_load
        
        # 性能分数 (权重: 0.2)
        performance_score = self._get_agent_performance_score(agent_resource.agent_id)
        
        # 可用性分数 (权重: 0.1)
        availability_score = 1.0 if agent_resource.is_available() else 0.0
        
        # 根据调度策略调整权重
        if self.scheduling_strategy == "capability_first":
            weights = [0.5, 0.2, 0.2, 0.1]
        elif self.scheduling_strategy == "load_balanced":
            weights = [0.3, 0.4, 0.2, 0.1]
        elif self.scheduling_strategy == "performance_based":
            weights = [0.3, 0.2, 0.4, 0.1]
        else:
            weights = [0.4, 0.3, 0.2, 0.1]
        
        # 计算加权分数
        total_score = (
            capability_score * weights[0] +
            load_score * weights[1] +
            performance_score * weights[2] +
            availability_score * weights[3]
        )
        
        # 根据任务优先级调整
        if task_priority == TaskPriority.CRITICAL:
            total_score *= 1.2  # 提高分数
        elif task_priority == TaskPriority.LOW:
            total_score *= 0.8  # 降低分数
        
        return min(1.0, total_score)
    
    def _get_agent_performance_score(self, agent_id: str) -> float:
        """获取Agent性能分数
        
        Args:
            agent_id: Agent ID
            
        Returns:
            float: 性能分数 (0.0-1.0)
        """
        if agent_id not in self.performance_history:
            return 0.5  # 默认中等性能
        
        history = self.performance_history[agent_id]
        if not history:
            return 0.5
        
        # 计算平均性能分数
        avg_score = sum(history) / len(history)
        return min(1.0, max(0.0, avg_score))
    
    def assign_task(self, task: TaskNode, preferred_agent: str = None) -> Optional[str]:
        """分配任务给Agent
        
        Args:
            task: 任务节点
            preferred_agent: 首选Agent ID
            
        Returns:
            Optional[str]: 分配的Agent ID，如果分配失败返回None
        """
        # 如果指定了首选Agent，先尝试分配给它
        if preferred_agent and preferred_agent in self.agents:
            agent_resource = self.agents[preferred_agent]
            if agent_resource.is_available():
                capability_score = agent_resource.get_capability_score(task.required_capabilities)
                if capability_score > 0.5:  # 能力匹配阈值
                    self._perform_assignment(task.id, preferred_agent)
                    return preferred_agent
        
        # 查找合适的Agent
        candidates = self.find_suitable_agents(
            task.required_capabilities, 
            task.priority
        )
        
        if not candidates:
            logger.warning(f"没有找到合适的Agent执行任务: {task.id}")
            return None
        
        # 选择最佳Agent
        best_agent_id = candidates[0][0]
        self._perform_assignment(task.id, best_agent_id)
        
        return best_agent_id
    
    def _perform_assignment(self, task_id: str, agent_id: str) -> None:
        """执行任务分配
        
        Args:
            task_id: 任务ID
            agent_id: Agent ID
        """
        agent_resource = self.agents[agent_id]
        agent_resource.add_task(task_id)
        self.task_assignments[task_id] = agent_id
        
        logger.info(f"任务分配成功: {task_id} -> {agent_id}")
    
    def release_task(self, task_id: str, performance_score: float = None) -> bool:
        """释放任务
        
        Args:
            task_id: 任务ID
            performance_score: 性能分数 (0.0-1.0)
            
        Returns:
            bool: 是否成功释放
        """
        if task_id not in self.task_assignments:
            logger.warning(f"任务分配记录不存在: {task_id}")
            return False
        
        agent_id = self.task_assignments[task_id]
        
        if agent_id in self.agents:
            agent_resource = self.agents[agent_id]
            agent_resource.remove_task(task_id)
            
            # 记录性能分数
            if performance_score is not None:
                self.performance_history[agent_id].append(performance_score)
        
        # 移除分配记录
        del self.task_assignments[task_id]
        
        logger.info(f"任务释放成功: {task_id}")
        return True
    
    def update_agent_heartbeat(self, agent_id: str, 
                              performance_metrics: Dict[str, float] = None) -> bool:
        """更新Agent心跳
        
        Args:
            agent_id: Agent ID
            performance_metrics: 性能指标
            
        Returns:
            bool: 是否成功更新
        """
        if agent_id not in self.agents:
            logger.warning(f"Agent不存在: {agent_id}")
            return False
        
        agent_resource = self.agents[agent_id]
        agent_resource.last_heartbeat = datetime.now()
        
        if performance_metrics:
            agent_resource.performance_metrics.update(performance_metrics)
        
        # 检查Agent状态
        if agent_resource.status == "offline":
            agent_resource.status = "idle" if not agent_resource.current_tasks else "busy"
            logger.info(f"Agent重新上线: {agent_id}")
        
        return True
    
    def check_agent_health(self) -> Dict[str, str]:
        """检查Agent健康状态
        
        Returns:
            Dict[str, str]: Agent健康状态字典
        """
        current_time = datetime.now()
        health_status = {}
        
        for agent_id, agent_resource in self.agents.items():
            time_since_heartbeat = (current_time - agent_resource.last_heartbeat).total_seconds()
            
            if time_since_heartbeat > self.heartbeat_timeout:
                if agent_resource.status != "offline":
                    agent_resource.status = "offline"
                    logger.warning(f"Agent离线: {agent_id}")
                health_status[agent_id] = "offline"
            else:
                health_status[agent_id] = agent_resource.status
        
        return health_status
    
    def get_load_statistics(self) -> Dict[str, Any]:
        """获取负载统计信息
        
        Returns:
            Dict[str, Any]: 负载统计
        """
        total_agents = len(self.agents)
        if total_agents == 0:
            return {"total_agents": 0, "average_load": 0.0}
        
        total_load = sum(agent.current_load for agent in self.agents.values())
        average_load = total_load / total_agents
        
        online_agents = sum(1 for agent in self.agents.values() if agent.status != "offline")
        busy_agents = sum(1 for agent in self.agents.values() if agent.status == "busy")
        
        return {
            "total_agents": total_agents,
            "online_agents": online_agents,
            "busy_agents": busy_agents,
            "average_load": average_load,
            "total_tasks": sum(len(agent.current_tasks) for agent in self.agents.values())
        }
    
    def rebalance_load(self) -> List[Tuple[str, str, str]]:
        """重新平衡负载
        
        Returns:
            List[Tuple[str, str, str]]: (任务ID, 源Agent ID, 目标Agent ID) 迁移列表
        """
        migrations = []
        
        # 找到高负载和低负载的Agent
        high_load_agents = []
        low_load_agents = []
        
        for agent_id, agent_resource in self.agents.items():
            if agent_resource.status == "offline":
                continue
                
            if agent_resource.current_load > self.load_threshold:
                high_load_agents.append((agent_id, agent_resource))
            elif agent_resource.current_load < 0.3 and agent_resource.is_available():
                low_load_agents.append((agent_id, agent_resource))
        
        # 执行负载迁移
        for high_agent_id, high_agent in high_load_agents:
            if not low_load_agents:
                break
                
            # 选择要迁移的任务（优先迁移优先级较低的任务）
            tasks_to_migrate = high_agent.current_tasks[:1]  # 简单策略：迁移一个任务
            
            for task_id in tasks_to_migrate:
                # 找到合适的目标Agent
                for low_agent_id, low_agent in low_load_agents:
                    if low_agent.is_available():
                        # 执行迁移
                        high_agent.remove_task(task_id)
                        low_agent.add_task(task_id)
                        self.task_assignments[task_id] = low_agent_id
                        
                        migrations.append((task_id, high_agent_id, low_agent_id))
                        logger.info(f"任务迁移: {task_id} {high_agent_id} -> {low_agent_id}")
                        break
        
        return migrations


class CollaborationSession(BaseModel):
    """协作会话"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    mode: CollaborationMode
    participants: List[str] = Field(default_factory=list)  # 参与的Agent ID列表
    coordinator: Optional[str] = None  # 协调者Agent ID
    task_plan_id: Optional[str] = None  # 关联的任务计划ID
    status: str = "active"  # active, paused, completed, failed
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
    metadata: Dict[str, Any] = Field(default_factory=dict)
    
    # 协作状态
    shared_context: Dict[str, Any] = Field(default_factory=dict)
    communication_history: List[Dict[str, Any]] = Field(default_factory=list)
    conflict_log: List[Dict[str, Any]] = Field(default_factory=list)
    consensus_sessions: List[str] = Field(default_factory=list)  # 共识会话ID列表


class CollaborationCoordinator:
    """协作协调器
    
    负责多Agent协作模式管理、关系建立、冲突解决和共识建立
    """
    
    def __init__(self, message_broker: MessageBroker, consensus_verifier: ConsensusVerifier):
        """初始化协作协调器
        
        Args:
            message_broker: 消息代理
            consensus_verifier: 共识验证器
        """
        self.message_broker = message_broker
        self.consensus_verifier = consensus_verifier
        self.sessions: Dict[str, CollaborationSession] = {}  # 协作会话字典
        self.agent_relationships: Dict[str, Dict[str, str]] = defaultdict(dict)  # Agent关系图
        self.collaboration_patterns: Dict[str, Dict[str, Any]] = {}  # 协作模式配置
        self.conflict_resolution_strategies: Dict[str, Callable] = {}  # 冲突解决策略
        
        # 初始化协作模式配置
        self._initialize_collaboration_patterns()
        
        # 注册冲突解决策略
        self._register_conflict_resolution_strategies()
    
    def _initialize_collaboration_patterns(self) -> None:
        """初始化协作模式配置"""
        
        # 层次化协作模式
        self.collaboration_patterns[CollaborationMode.HIERARCHICAL] = {
            "description": "层次化协作，有明确的主从关系",
            "roles": ["coordinator", "executor", "monitor"],
            "communication_pattern": "tree",
            "decision_making": "centralized",
            "conflict_resolution": "authority_based",
            "coordination_overhead": "low"
        }
        
        # 对等协作模式
        self.collaboration_patterns[CollaborationMode.PEER_TO_PEER] = {
            "description": "对等协作，所有Agent地位平等",
            "roles": ["peer"],
            "communication_pattern": "mesh",
            "decision_making": "consensus",
            "conflict_resolution": "negotiation",
            "coordination_overhead": "medium"
        }
        
        # 竞争协作模式
        self.collaboration_patterns[CollaborationMode.COMPETITIVE] = {
            "description": "竞争协作，Agent之间竞争资源和任务",
            "roles": ["competitor", "judge"],
            "communication_pattern": "broadcast",
            "decision_making": "competitive",
            "conflict_resolution": "performance_based",
            "coordination_overhead": "high"
        }
        
        # 合作协作模式
        self.collaboration_patterns[CollaborationMode.COOPERATIVE] = {
            "description": "合作协作，Agent共同完成目标",
            "roles": ["collaborator", "facilitator"],
            "communication_pattern": "group",
            "decision_making": "collaborative",
            "conflict_resolution": "mediation",
            "coordination_overhead": "medium"
        }
        
        # 群体智能模式
        self.collaboration_patterns[CollaborationMode.SWARM] = {
            "description": "群体智能，基于简单规则的自组织协作",
            "roles": ["swarm_member"],
            "communication_pattern": "local",
            "decision_making": "emergent",
            "conflict_resolution": "self_organization",
            "coordination_overhead": "low"
        }
        
        # 流水线协作模式
        self.collaboration_patterns[CollaborationMode.PIPELINE] = {
            "description": "流水线协作，任务按顺序在Agent间传递",
            "roles": ["processor", "buffer"],
            "communication_pattern": "pipeline",
            "decision_making": "sequential",
            "conflict_resolution": "queue_based",
            "coordination_overhead": "low"
        }
    
    def _register_conflict_resolution_strategies(self) -> None:
        """注册冲突解决策略"""
        
        def authority_based_resolution(conflict_data: Dict[str, Any]) -> Dict[str, Any]:
            """基于权威的冲突解决"""
            coordinator = conflict_data.get("coordinator")
            if coordinator:
                return {
                    "resolution": "authority_decision",
                    "decision_maker": coordinator,
                    "action": "coordinator_decides"
                }
            return {"resolution": "escalate", "action": "require_human_intervention"}
        
        def negotiation_resolution(conflict_data: Dict[str, Any]) -> Dict[str, Any]:
            """基于协商的冲突解决"""
            participants = conflict_data.get("participants", [])
            if len(participants) >= 2:
                return {
                    "resolution": "negotiation",
                    "participants": participants,
                    "action": "start_negotiation_round",
                    "timeout": 300  # 5分钟协商时间
                }
            return {"resolution": "no_conflict", "action": "continue"}
        
        def performance_based_resolution(conflict_data: Dict[str, Any]) -> Dict[str, Any]:
            """基于性能的冲突解决"""
            participants = conflict_data.get("participants", [])
            performance_scores = conflict_data.get("performance_scores", {})
            
            if participants and performance_scores:
                best_performer = max(participants, 
                                   key=lambda x: performance_scores.get(x, 0.0))
                return {
                    "resolution": "performance_winner",
                    "winner": best_performer,
                    "action": "assign_to_best_performer"
                }
            return {"resolution": "random_selection", "action": "random_assignment"}
        
        def mediation_resolution(conflict_data: Dict[str, Any]) -> Dict[str, Any]:
            """基于调解的冲突解决"""
            return {
                "resolution": "mediation",
                "action": "start_mediation_process",
                "mediator": "system",
                "steps": ["gather_positions", "find_common_ground", "propose_solution"]
            }
        
        def self_organization_resolution(conflict_data: Dict[str, Any]) -> Dict[str, Any]:
            """基于自组织的冲突解决"""
            return {
                "resolution": "self_organization",
                "action": "apply_swarm_rules",
                "rules": ["avoid_collision", "maintain_cohesion", "follow_neighbors"]
            }
        
        def queue_based_resolution(conflict_data: Dict[str, Any]) -> Dict[str, Any]:
            """基于队列的冲突解决"""
            return {
                "resolution": "queue_order",
                "action": "process_by_arrival_time",
                "queue_strategy": "fifo"  # first in, first out
            }
        
        # 注册策略
        self.conflict_resolution_strategies["authority_based"] = authority_based_resolution
        self.conflict_resolution_strategies["negotiation"] = negotiation_resolution
        self.conflict_resolution_strategies["performance_based"] = performance_based_resolution
        self.conflict_resolution_strategies["mediation"] = mediation_resolution
        self.conflict_resolution_strategies["self_organization"] = self_organization_resolution
        self.conflict_resolution_strategies["queue_based"] = queue_based_resolution
    
    def create_collaboration_session(self, name: str, description: str, 
                                   mode: CollaborationMode,
                                   participants: List[str],
                                   coordinator: str = None,
                                   task_plan_id: str = None) -> str:
        """创建协作会话
        
        Args:
            name: 会话名称
            description: 会话描述
            mode: 协作模式
            participants: 参与者Agent ID列表
            coordinator: 协调者Agent ID
            task_plan_id: 关联的任务计划ID
            
        Returns:
            str: 会话ID
        """
        session = CollaborationSession(
            name=name,
            description=description,
            mode=mode,
            participants=participants,
            coordinator=coordinator,
            task_plan_id=task_plan_id
        )
        
        self.sessions[session.id] = session
        
        # 建立Agent关系
        self._establish_agent_relationships(session)
        
        logger.info(f"协作会话创建成功: {session.id}, 模式: {mode}, 参与者: {len(participants)}")
        return session.id
    
    def _establish_agent_relationships(self, session: CollaborationSession) -> None:
        """建立Agent关系
        
        Args:
            session: 协作会话
        """
        mode = session.mode
        participants = session.participants
        coordinator = session.coordinator
        
        if mode == CollaborationMode.HIERARCHICAL:
            # 层次化关系：协调者 -> 执行者
            if coordinator:
                for participant in participants:
                    if participant != coordinator:
                        self.agent_relationships[coordinator][participant] = "supervises"
                        self.agent_relationships[participant][coordinator] = "reports_to"
        
        elif mode == CollaborationMode.PEER_TO_PEER:
            # 对等关系：所有Agent互为对等
            for i, agent1 in enumerate(participants):
                for j, agent2 in enumerate(participants):
                    if i != j:
                        self.agent_relationships[agent1][agent2] = "peer"
        
        elif mode == CollaborationMode.COMPETITIVE:
            # 竞争关系：Agent之间竞争
            for i, agent1 in enumerate(participants):
                for j, agent2 in enumerate(participants):
                    if i != j:
                        self.agent_relationships[agent1][agent2] = "competes_with"
        
        elif mode == CollaborationMode.COOPERATIVE:
            # 合作关系：Agent之间合作
            for i, agent1 in enumerate(participants):
                for j, agent2 in enumerate(participants):
                    if i != j:
                        self.agent_relationships[agent1][agent2] = "collaborates_with"
        
        elif mode == CollaborationMode.PIPELINE:
            # 流水线关系：顺序处理
            for i in range(len(participants) - 1):
                current_agent = participants[i]
                next_agent = participants[i + 1]
                self.agent_relationships[current_agent][next_agent] = "feeds_to"
                self.agent_relationships[next_agent][current_agent] = "receives_from"
    
    def add_participant(self, session_id: str, agent_id: str) -> bool:
        """添加参与者
        
        Args:
            session_id: 会话ID
            agent_id: Agent ID
            
        Returns:
            bool: 是否成功添加
        """
        if session_id not in self.sessions:
            logger.error(f"协作会话不存在: {session_id}")
            return False
        
        session = self.sessions[session_id]
        if agent_id not in session.participants:
            session.participants.append(agent_id)
            session.updated_at = datetime.now()
            
            # 重新建立关系
            self._establish_agent_relationships(session)
            
            logger.info(f"参与者添加成功: {agent_id} -> {session_id}")
            return True
        
        return False
    
    def remove_participant(self, session_id: str, agent_id: str) -> bool:
        """移除参与者
        
        Args:
            session_id: 会话ID
            agent_id: Agent ID
            
        Returns:
            bool: 是否成功移除
        """
        if session_id not in self.sessions:
            logger.error(f"协作会话不存在: {session_id}")
            return False
        
        session = self.sessions[session_id]
        if agent_id in session.participants:
            session.participants.remove(agent_id)
            session.updated_at = datetime.now()
            
            # 清理关系
            if agent_id in self.agent_relationships:
                del self.agent_relationships[agent_id]
            for other_agent in self.agent_relationships:
                if agent_id in self.agent_relationships[other_agent]:
                    del self.agent_relationships[other_agent][agent_id]
            
            # 重新建立关系
            self._establish_agent_relationships(session)
            
            logger.info(f"参与者移除成功: {agent_id} <- {session_id}")
            return True
        
        return False
    
    def detect_conflict(self, session_id: str, conflict_type: str, 
                       involved_agents: List[str], 
                       conflict_data: Dict[str, Any]) -> str:
        """检测和记录冲突
        
        Args:
            session_id: 会话ID
            conflict_type: 冲突类型
            involved_agents: 涉及的Agent列表
            conflict_data: 冲突数据
            
        Returns:
            str: 冲突ID
        """
        if session_id not in self.sessions:
            logger.error(f"协作会话不存在: {session_id}")
            return ""
        
        session = self.sessions[session_id]
        conflict_id = str(uuid.uuid4())
        
        conflict_record = {
            "id": conflict_id,
            "type": conflict_type,
            "involved_agents": involved_agents,
            "data": conflict_data,
            "timestamp": datetime.now().isoformat(),
            "status": "detected",
            "resolution": None
        }
        
        session.conflict_log.append(conflict_record)
        session.updated_at = datetime.now()
        
        logger.warning(f"冲突检测: {conflict_type} in {session_id}, 涉及: {involved_agents}")
        
        # 自动启动冲突解决
        self._resolve_conflict(session_id, conflict_id)
        
        return conflict_id
    
    def _resolve_conflict(self, session_id: str, conflict_id: str) -> bool:
        """解决冲突
        
        Args:
            session_id: 会话ID
            conflict_id: 冲突ID
            
        Returns:
            bool: 是否成功解决
        """
        session = self.sessions[session_id]
        
        # 找到冲突记录
        conflict_record = None
        for conflict in session.conflict_log:
            if conflict["id"] == conflict_id:
                conflict_record = conflict
                break
        
        if not conflict_record:
            logger.error(f"冲突记录不存在: {conflict_id}")
            return False
        
        # 获取协作模式的冲突解决策略
        pattern = self.collaboration_patterns.get(session.mode, {})
        strategy_name = pattern.get("conflict_resolution", "negotiation")
        
        if strategy_name not in self.conflict_resolution_strategies:
            logger.error(f"冲突解决策略不存在: {strategy_name}")
            return False
        
        # 准备冲突数据
        conflict_data = {
            "session_id": session_id,
            "conflict_type": conflict_record["type"],
            "participants": conflict_record["involved_agents"],
            "coordinator": session.coordinator,
            "mode": session.mode,
            "data": conflict_record["data"]
        }
        
        # 执行冲突解决策略
        strategy_func = self.conflict_resolution_strategies[strategy_name]
        resolution_result = strategy_func(conflict_data)
        
        # 更新冲突记录
        conflict_record["status"] = "resolved"
        conflict_record["resolution"] = resolution_result
        conflict_record["resolved_at"] = datetime.now().isoformat()
        
        logger.info(f"冲突解决完成: {conflict_id}, 策略: {strategy_name}")
        return True
    
    def initiate_consensus(self, session_id: str, topic: str, 
                          proposal_data: Dict[str, Any],
                          eligible_agents: List[str] = None) -> str:
        """发起共识
        
        Args:
            session_id: 会话ID
            topic: 共识主题
            proposal_data: 提案数据
            eligible_agents: 有投票权的Agent列表
            
        Returns:
            str: 共识会话ID
        """
        if session_id not in self.sessions:
            logger.error(f"协作会话不存在: {session_id}")
            return ""
        
        session = self.sessions[session_id]
        
        if eligible_agents is None:
            eligible_agents = session.participants.copy()
        
        # 创建共识提案
        proposal = ConsensusProposal(
            topic=topic,
            description=f"协作会话 {session_id} 的共识提案",
            proposer=session.coordinator or eligible_agents[0],
            content=proposal_data
        )
        
        # 创建共识会话
        consensus_session_id = self.consensus_verifier.create_session(
            proposal=proposal,
            eligible_agents=eligible_agents,
            deadline=datetime.now() + timedelta(minutes=30)  # 30分钟截止
        )
        
        if consensus_session_id:
            session.consensus_sessions.append(consensus_session_id)
            session.updated_at = datetime.now()
            
            logger.info(f"共识发起成功: {consensus_session_id} for {session_id}")
        
        return consensus_session_id
    
    def update_shared_context(self, session_id: str, context_updates: Dict[str, Any]) -> bool:
        """更新共享上下文
        
        Args:
            session_id: 会话ID
            context_updates: 上下文更新
            
        Returns:
            bool: 是否成功更新
        """
        if session_id not in self.sessions:
            logger.error(f"协作会话不存在: {session_id}")
            return False
        
        session = self.sessions[session_id]
        session.shared_context.update(context_updates)
        session.updated_at = datetime.now()
        
        # 广播上下文更新给所有参与者
        self._broadcast_context_update(session, context_updates)
        
        logger.debug(f"共享上下文更新: {session_id}")
        return True
    
    def _broadcast_context_update(self, session: CollaborationSession, 
                                 context_updates: Dict[str, Any]) -> None:
        """广播上下文更新
        
        Args:
            session: 协作会话
            context_updates: 上下文更新
        """
        message_content = {
            "type": "context_update",
            "session_id": session.id,
            "updates": context_updates,
            "timestamp": datetime.now().isoformat()
        }
        
        for participant in session.participants:
            try:
                # 这里应该通过消息代理发送消息
                # 简化实现，实际应该使用 message_broker
                logger.debug(f"发送上下文更新给 {participant}: {context_updates}")
            except Exception as e:
                logger.error(f"发送上下文更新失败 {participant}: {e}")
    
    def get_session(self, session_id: str) -> Optional[CollaborationSession]:
        """获取协作会话
        
        Args:
            session_id: 会话ID
            
        Returns:
            Optional[CollaborationSession]: 协作会话
        """
        return self.sessions.get(session_id)
    
    def get_agent_relationships(self, agent_id: str) -> Dict[str, str]:
        """获取Agent关系
        
        Args:
            agent_id: Agent ID
            
        Returns:
            Dict[str, str]: 关系字典
        """
        return self.agent_relationships.get(agent_id, {})
    
    def get_session_statistics(self, session_id: str) -> Dict[str, Any]:
        """获取会话统计信息
        
        Args:
            session_id: 会话ID
            
        Returns:
            Dict[str, Any]: 统计信息
        """
        if session_id not in self.sessions:
            return {}
        
        session = self.sessions[session_id]
        
        return {
            "session_id": session_id,
            "mode": session.mode,
            "participants_count": len(session.participants),
            "conflicts_count": len(session.conflict_log),
            "consensus_sessions_count": len(session.consensus_sessions),
            "communication_messages": len(session.communication_history),
            "status": session.status,
            "duration": (datetime.now() - session.created_at).total_seconds(),
            "last_activity": session.updated_at.isoformat()
         }


class PerformanceMetrics(BaseModel):
    """性能指标"""
    timestamp: datetime = Field(default_factory=datetime.now)
    agent_id: str
    task_id: Optional[str] = None
    session_id: Optional[str] = None
    
    # 执行指标
    execution_time: float = 0.0  # 执行时间（秒）
    success_rate: float = 1.0  # 成功率 (0.0-1.0)
    error_rate: float = 0.0  # 错误率 (0.0-1.0)
    throughput: float = 0.0  # 吞吐量（任务/秒）
    
    # 资源指标
    cpu_usage: float = 0.0  # CPU使用率 (0.0-1.0)
    memory_usage: float = 0.0  # 内存使用率 (0.0-1.0)
    network_io: float = 0.0  # 网络IO（字节/秒）
    
    # 协作指标
    communication_latency: float = 0.0  # 通信延迟（毫秒）
    collaboration_efficiency: float = 1.0  # 协作效率 (0.0-1.0)
    conflict_count: int = 0  # 冲突数量
    consensus_time: float = 0.0  # 共识时间（秒）
    
    # 质量指标
    output_quality: float = 1.0  # 输出质量 (0.0-1.0)
    user_satisfaction: float = 1.0  # 用户满意度 (0.0-1.0)
    
    metadata: Dict[str, Any] = Field(default_factory=dict)


class PerformanceOptimizer:
    """性能优化器
    
    负责资源监控、性能分析、瓶颈识别和自适应优化
    """
    
    def __init__(self, message_broker: MessageBroker):
        """初始化性能优化器
        
        Args:
            message_broker: 消息代理
        """
        self.message_broker = message_broker
        self.metrics_history: Dict[str, deque] = defaultdict(lambda: deque(maxlen=1000))  # 性能历史
        self.optimization_rules: List[Dict[str, Any]] = []  # 优化规则
        self.performance_thresholds: Dict[str, float] = {}  # 性能阈值
        self.optimization_strategies: Dict[str, Callable] = {}  # 优化策略
        
        # 初始化默认配置
        self._initialize_default_thresholds()
        self._register_optimization_strategies()
        
        # 监控状态
        self.monitoring_active = False
        self.optimization_active = True
        self.last_optimization_time = datetime.now()
        self.optimization_interval = 60  # 优化间隔（秒）
    
    def _initialize_default_thresholds(self) -> None:
        """初始化默认性能阈值"""
        self.performance_thresholds = {
            "max_execution_time": 300.0,  # 最大执行时间（秒）
            "min_success_rate": 0.8,  # 最小成功率
            "max_error_rate": 0.2,  # 最大错误率
            "min_throughput": 0.1,  # 最小吞吐量
            "max_cpu_usage": 0.8,  # 最大CPU使用率
            "max_memory_usage": 0.8,  # 最大内存使用率
            "max_communication_latency": 1000.0,  # 最大通信延迟（毫秒）
            "min_collaboration_efficiency": 0.6,  # 最小协作效率
            "max_consensus_time": 180.0,  # 最大共识时间（秒）
            "min_output_quality": 0.7,  # 最小输出质量
            "min_user_satisfaction": 0.7  # 最小用户满意度
        }
    
    def _register_optimization_strategies(self) -> None:
        """注册优化策略"""
        
        def scale_up_strategy(context: Dict[str, Any]) -> Dict[str, Any]:
            """扩容策略"""
            return {
                "action": "scale_up",
                "target": context.get("bottleneck_component"),
                "scale_factor": 1.5,
                "reason": "High load detected"
            }
        
        def scale_down_strategy(context: Dict[str, Any]) -> Dict[str, Any]:
            """缩容策略"""
            return {
                "action": "scale_down",
                "target": context.get("underutilized_component"),
                "scale_factor": 0.7,
                "reason": "Low utilization detected"
            }
        
        def load_balance_strategy(context: Dict[str, Any]) -> Dict[str, Any]:
            """负载均衡策略"""
            return {
                "action": "rebalance_load",
                "source_agents": context.get("overloaded_agents", []),
                "target_agents": context.get("underloaded_agents", []),
                "reason": "Load imbalance detected"
            }
        
        def cache_optimization_strategy(context: Dict[str, Any]) -> Dict[str, Any]:
            """缓存优化策略"""
            return {
                "action": "optimize_cache",
                "cache_size": context.get("recommended_cache_size", 1000),
                "eviction_policy": "lru",
                "reason": "Cache miss rate too high"
            }
        
        def communication_optimization_strategy(context: Dict[str, Any]) -> Dict[str, Any]:
            """通信优化策略"""
            return {
                "action": "optimize_communication",
                "compression_enabled": True,
                "batch_size": context.get("optimal_batch_size", 10),
                "reason": "High communication latency"
            }
        
        def task_scheduling_optimization_strategy(context: Dict[str, Any]) -> Dict[str, Any]:
            """任务调度优化策略"""
            return {
                "action": "optimize_scheduling",
                "scheduling_algorithm": context.get("recommended_algorithm", "priority_based"),
                "priority_weights": context.get("priority_weights", {}),
                "reason": "Suboptimal task scheduling"
            }
        
        # 注册策略
        self.optimization_strategies["scale_up"] = scale_up_strategy
        self.optimization_strategies["scale_down"] = scale_down_strategy
        self.optimization_strategies["load_balance"] = load_balance_strategy
        self.optimization_strategies["cache_optimization"] = cache_optimization_strategy
        self.optimization_strategies["communication_optimization"] = communication_optimization_strategy
        self.optimization_strategies["task_scheduling_optimization"] = task_scheduling_optimization_strategy
    
    def record_metrics(self, metrics: PerformanceMetrics) -> None:
        """记录性能指标
        
        Args:
            metrics: 性能指标
        """
        agent_id = metrics.agent_id
        self.metrics_history[agent_id].append(metrics)
        
        # 检查是否需要立即优化
        if self.optimization_active:
            self._check_immediate_optimization(metrics)
        
        logger.debug(f"性能指标记录: {agent_id}")
    
    def _check_immediate_optimization(self, metrics: PerformanceMetrics) -> None:
        """检查是否需要立即优化
        
        Args:
            metrics: 性能指标
        """
        # 检查关键指标是否超过阈值
        critical_issues = []
        
        if metrics.execution_time > self.performance_thresholds["max_execution_time"]:
            critical_issues.append("execution_time_exceeded")
        
        if metrics.success_rate < self.performance_thresholds["min_success_rate"]:
            critical_issues.append("low_success_rate")
        
        if metrics.error_rate > self.performance_thresholds["max_error_rate"]:
            critical_issues.append("high_error_rate")
        
        if metrics.cpu_usage > self.performance_thresholds["max_cpu_usage"]:
            critical_issues.append("high_cpu_usage")
        
        if metrics.memory_usage > self.performance_thresholds["max_memory_usage"]:
            critical_issues.append("high_memory_usage")
        
        if critical_issues:
            logger.warning(f"检测到关键性能问题: {critical_issues} for {metrics.agent_id}")
            self._trigger_immediate_optimization(metrics.agent_id, critical_issues)
    
    def _trigger_immediate_optimization(self, agent_id: str, issues: List[str]) -> None:
        """触发立即优化
        
        Args:
            agent_id: Agent ID
            issues: 问题列表
        """
        optimization_context = {
            "agent_id": agent_id,
            "issues": issues,
            "timestamp": datetime.now(),
            "priority": "critical"
        }
        
        # 根据问题类型选择优化策略
        for issue in issues:
            if issue in ["high_cpu_usage", "high_memory_usage"]:
                strategy = self.optimization_strategies.get("scale_up")
                if strategy:
                    result = strategy(optimization_context)
                    logger.info(f"执行扩容优化: {result}")
            
            elif issue in ["low_success_rate", "high_error_rate"]:
                strategy = self.optimization_strategies.get("load_balance")
                if strategy:
                    result = strategy(optimization_context)
                    logger.info(f"执行负载均衡优化: {result}")
    
    def analyze_performance_trends(self, agent_id: str = None, 
                                 time_window: int = 3600) -> Dict[str, Any]:
        """分析性能趋势
        
        Args:
            agent_id: Agent ID，如果为None则分析所有Agent
            time_window: 时间窗口（秒）
            
        Returns:
            Dict[str, Any]: 性能趋势分析结果
        """
        current_time = datetime.now()
        cutoff_time = current_time - timedelta(seconds=time_window)
        
        if agent_id:
            agent_ids = [agent_id]
        else:
            agent_ids = list(self.metrics_history.keys())
        
        trends = {}
        
        for aid in agent_ids:
            if aid not in self.metrics_history:
                continue
            
            # 过滤时间窗口内的指标
            recent_metrics = [
                m for m in self.metrics_history[aid]
                if m.timestamp >= cutoff_time
            ]
            
            if not recent_metrics:
                continue
            
            # 计算趋势
            agent_trends = self._calculate_agent_trends(recent_metrics)
            trends[aid] = agent_trends
        
        # 计算整体趋势
        overall_trends = self._calculate_overall_trends(trends)
        
        return {
            "agent_trends": trends,
            "overall_trends": overall_trends,
            "analysis_time": current_time.isoformat(),
            "time_window": time_window
        }
    
    def _calculate_agent_trends(self, metrics: List[PerformanceMetrics]) -> Dict[str, Any]:
        """计算单个Agent的性能趋势
        
        Args:
            metrics: 性能指标列表
            
        Returns:
            Dict[str, Any]: 趋势分析结果
        """
        if not metrics:
            return {}
        
        # 提取各项指标的时间序列
        execution_times = [m.execution_time for m in metrics]
        success_rates = [m.success_rate for m in metrics]
        error_rates = [m.error_rate for m in metrics]
        cpu_usages = [m.cpu_usage for m in metrics]
        memory_usages = [m.memory_usage for m in metrics]
        
        # 计算趋势（简单的线性趋势）
        def calculate_trend(values: List[float]) -> str:
            if len(values) < 2:
                return "stable"
            
            # 计算斜率
            n = len(values)
            x = list(range(n))
            y = values
            
            x_mean = sum(x) / n
            y_mean = sum(y) / n
            
            numerator = sum((x[i] - x_mean) * (y[i] - y_mean) for i in range(n))
            denominator = sum((x[i] - x_mean) ** 2 for i in range(n))
            
            if denominator == 0:
                return "stable"
            
            slope = numerator / denominator
            
            if slope > 0.01:
                return "increasing"
            elif slope < -0.01:
                return "decreasing"
            else:
                return "stable"
        
        return {
            "execution_time_trend": calculate_trend(execution_times),
            "success_rate_trend": calculate_trend(success_rates),
            "error_rate_trend": calculate_trend(error_rates),
            "cpu_usage_trend": calculate_trend(cpu_usages),
            "memory_usage_trend": calculate_trend(memory_usages),
            "avg_execution_time": sum(execution_times) / len(execution_times),
            "avg_success_rate": sum(success_rates) / len(success_rates),
            "avg_error_rate": sum(error_rates) / len(error_rates),
            "avg_cpu_usage": sum(cpu_usages) / len(cpu_usages),
            "avg_memory_usage": sum(memory_usages) / len(memory_usages),
            "sample_count": len(metrics)
        }
    
    def _calculate_overall_trends(self, agent_trends: Dict[str, Dict[str, Any]]) -> Dict[str, Any]:
        """计算整体性能趋势
        
        Args:
            agent_trends: Agent趋势字典
            
        Returns:
            Dict[str, Any]: 整体趋势
        """
        if not agent_trends:
            return {}
        
        # 聚合所有Agent的平均值
        all_execution_times = []
        all_success_rates = []
        all_error_rates = []
        all_cpu_usages = []
        all_memory_usages = []
        
        for trends in agent_trends.values():
            if "avg_execution_time" in trends:
                all_execution_times.append(trends["avg_execution_time"])
            if "avg_success_rate" in trends:
                all_success_rates.append(trends["avg_success_rate"])
            if "avg_error_rate" in trends:
                all_error_rates.append(trends["avg_error_rate"])
            if "avg_cpu_usage" in trends:
                all_cpu_usages.append(trends["avg_cpu_usage"])
            if "avg_memory_usage" in trends:
                all_memory_usages.append(trends["avg_memory_usage"])
        
        def safe_avg(values: List[float]) -> float:
            return sum(values) / len(values) if values else 0.0
        
        return {
            "system_avg_execution_time": safe_avg(all_execution_times),
            "system_avg_success_rate": safe_avg(all_success_rates),
            "system_avg_error_rate": safe_avg(all_error_rates),
            "system_avg_cpu_usage": safe_avg(all_cpu_usages),
            "system_avg_memory_usage": safe_avg(all_memory_usages),
            "total_agents": len(agent_trends)
        }
    
    def identify_bottlenecks(self) -> List[Dict[str, Any]]:
        """识别系统瓶颈
        
        Returns:
            List[Dict[str, Any]]: 瓶颈列表
        """
        bottlenecks = []
        
        # 分析最近的性能数据
        trends = self.analyze_performance_trends(time_window=1800)  # 30分钟窗口
        
        for agent_id, agent_trends in trends["agent_trends"].items():
            agent_bottlenecks = []
            
            # 检查各项指标
            if agent_trends.get("avg_execution_time", 0) > self.performance_thresholds["max_execution_time"]:
                agent_bottlenecks.append({
                    "type": "execution_time",
                    "severity": "high",
                    "value": agent_trends["avg_execution_time"],
                    "threshold": self.performance_thresholds["max_execution_time"]
                })
            
            if agent_trends.get("avg_success_rate", 1.0) < self.performance_thresholds["min_success_rate"]:
                agent_bottlenecks.append({
                    "type": "success_rate",
                    "severity": "high",
                    "value": agent_trends["avg_success_rate"],
                    "threshold": self.performance_thresholds["min_success_rate"]
                })
            
            if agent_trends.get("avg_cpu_usage", 0) > self.performance_thresholds["max_cpu_usage"]:
                agent_bottlenecks.append({
                    "type": "cpu_usage",
                    "severity": "medium",
                    "value": agent_trends["avg_cpu_usage"],
                    "threshold": self.performance_thresholds["max_cpu_usage"]
                })
            
            if agent_trends.get("avg_memory_usage", 0) > self.performance_thresholds["max_memory_usage"]:
                agent_bottlenecks.append({
                    "type": "memory_usage",
                    "severity": "medium",
                    "value": agent_trends["avg_memory_usage"],
                    "threshold": self.performance_thresholds["max_memory_usage"]
                })
            
            if agent_bottlenecks:
                bottlenecks.append({
                    "agent_id": agent_id,
                    "bottlenecks": agent_bottlenecks,
                    "timestamp": datetime.now().isoformat()
                })
        
        return bottlenecks
    
    def generate_optimization_recommendations(self) -> List[Dict[str, Any]]:
        """生成优化建议
        
        Returns:
            List[Dict[str, Any]]: 优化建议列表
        """
        recommendations = []
        
        # 识别瓶颈
        bottlenecks = self.identify_bottlenecks()
        
        for bottleneck_info in bottlenecks:
            agent_id = bottleneck_info["agent_id"]
            agent_bottlenecks = bottleneck_info["bottlenecks"]
            
            for bottleneck in agent_bottlenecks:
                bottleneck_type = bottleneck["type"]
                severity = bottleneck["severity"]
                
                # 根据瓶颈类型生成建议
                if bottleneck_type == "execution_time":
                    recommendations.append({
                        "agent_id": agent_id,
                        "type": "performance_optimization",
                        "action": "optimize_algorithm",
                        "description": "优化算法或增加并行处理",
                        "priority": severity,
                        "estimated_impact": "high"
                    })
                
                elif bottleneck_type == "success_rate":
                    recommendations.append({
                        "agent_id": agent_id,
                        "type": "reliability_improvement",
                        "action": "add_error_handling",
                        "description": "增强错误处理和重试机制",
                        "priority": severity,
                        "estimated_impact": "high"
                    })
                
                elif bottleneck_type in ["cpu_usage", "memory_usage"]:
                    recommendations.append({
                        "agent_id": agent_id,
                        "type": "resource_optimization",
                        "action": "scale_resources",
                        "description": f"增加{bottleneck_type}资源或优化资源使用",
                        "priority": severity,
                        "estimated_impact": "medium"
                    })
        
        # 添加系统级建议
        trends = self.analyze_performance_trends()
        overall_trends = trends.get("overall_trends", {})
        
        if overall_trends.get("system_avg_cpu_usage", 0) > 0.7:
            recommendations.append({
                "agent_id": "system",
                "type": "system_optimization",
                "action": "load_balancing",
                "description": "实施负载均衡以分散CPU压力",
                "priority": "medium",
                "estimated_impact": "high"
            })
        
        if overall_trends.get("system_avg_error_rate", 0) > 0.1:
            recommendations.append({
                "agent_id": "system",
                "type": "system_reliability",
                "action": "improve_fault_tolerance",
                "description": "提高系统容错能力和故障恢复机制",
                "priority": "high",
                "estimated_impact": "high"
            })
        
        return recommendations
    
    def apply_optimization(self, recommendation: Dict[str, Any]) -> bool:
        """应用优化建议
        
        Args:
            recommendation: 优化建议
            
        Returns:
            bool: 是否成功应用
        """
        try:
            action = recommendation.get("action")
            agent_id = recommendation.get("agent_id")
            
            if action in self.optimization_strategies:
                strategy = self.optimization_strategies[action]
                context = {
                    "agent_id": agent_id,
                    "recommendation": recommendation
                }
                result = strategy(context)
                
                logger.info(f"优化应用成功: {action} for {agent_id}, 结果: {result}")
                return True
            else:
                logger.warning(f"未知的优化动作: {action}")
                return False
                
        except Exception as e:
            logger.error(f"优化应用失败: {e}")
            return False
    
    def get_performance_summary(self, time_window: int = 3600) -> Dict[str, Any]:
        """获取性能摘要
        
        Args:
            time_window: 时间窗口（秒）
            
        Returns:
            Dict[str, Any]: 性能摘要
        """
        trends = self.analyze_performance_trends(time_window=time_window)
        bottlenecks = self.identify_bottlenecks()
        recommendations = self.generate_optimization_recommendations()
        
        return {
            "summary_time": datetime.now().isoformat(),
            "time_window": time_window,
            "performance_trends": trends,
            "bottlenecks_count": len(bottlenecks),
            "recommendations_count": len(recommendations),
            "system_health": self._calculate_system_health(trends),
            "optimization_opportunities": len([r for r in recommendations if r["estimated_impact"] == "high"])
        }
    
    def _calculate_system_health(self, trends: Dict[str, Any]) -> str:
        """计算系统健康状态
        
        Args:
            trends: 性能趋势
            
        Returns:
            str: 健康状态 (excellent, good, fair, poor)
        """
        overall_trends = trends.get("overall_trends", {})
        
        success_rate = overall_trends.get("system_avg_success_rate", 0.0)
        error_rate = overall_trends.get("system_avg_error_rate", 1.0)
        cpu_usage = overall_trends.get("system_avg_cpu_usage", 1.0)
        memory_usage = overall_trends.get("system_avg_memory_usage", 1.0)
        
        # 计算健康分数
        health_score = 0.0
        
        if success_rate >= 0.95:
            health_score += 25
        elif success_rate >= 0.8:
            health_score += 15
        elif success_rate >= 0.6:
            health_score += 5
        
        if error_rate <= 0.05:
            health_score += 25
        elif error_rate <= 0.15:
            health_score += 15
        elif error_rate <= 0.3:
            health_score += 5
        
        if cpu_usage <= 0.6:
            health_score += 25
        elif cpu_usage <= 0.8:
            health_score += 15
        elif cpu_usage <= 0.9:
            health_score += 5
        
        if memory_usage <= 0.6:
            health_score += 25
        elif memory_usage <= 0.8:
            health_score += 15
        elif memory_usage <= 0.9:
            health_score += 5
        
        # 根据分数确定健康状态
        if health_score >= 80:
            return "excellent"
        elif health_score >= 60:
            return "good"
        elif health_score >= 40:
            return "fair"
        else:
            return "poor"


class CollaborationPlatform:
    """协作平台主类
    
    整合任务规划器、能力调度器、协作协调器和性能优化器，
    提供完整的多Agent协作解决方案。
    """
    
    def __init__(self, message_broker: MessageBroker, consensus_verifier: ConsensusVerifier):
        """初始化协作平台
        
        Args:
            message_broker: 消息代理
            consensus_verifier: 共识验证器
        """
        self.message_broker = message_broker
        self.consensus_verifier = consensus_verifier
        
        # 初始化核心组件
        self.task_planner = TaskPlanner()
        self.capability_scheduler = CapabilityScheduler(message_broker)
        self.collaboration_coordinator = CollaborationCoordinator(
            message_broker=message_broker,
            consensus_verifier=consensus_verifier
        )
        self.performance_optimizer = PerformanceOptimizer(message_broker)
        
        # 平台状态
        self.platform_id = str(uuid.uuid4())
        self.is_running = False
        self.start_time: Optional[datetime] = None
        
        # 统计信息
        self.total_tasks_processed = 0
        self.total_collaborations_created = 0
        self.total_optimizations_applied = 0
        
        logger.info(f"协作平台初始化完成: {self.platform_id}")
    
    async def start(self) -> None:
        """启动协作平台"""
        if self.is_running:
            logger.warning("协作平台已在运行中")
            return
        
        self.is_running = True
        self.start_time = datetime.now()
        
        # 启动性能监控
        self.performance_optimizer.monitoring_active = True
        
        logger.info(f"协作平台启动成功: {self.platform_id}")
    
    async def stop(self) -> None:
        """停止协作平台"""
        if not self.is_running:
            logger.warning("协作平台未在运行")
            return
        
        self.is_running = False
        
        # 停止性能监控
        self.performance_optimizer.monitoring_active = False
        
        logger.info(f"协作平台停止: {self.platform_id}")
    
    async def register_agent(self, agent_config: AgentConfig) -> bool:
        """注册Agent
        
        Args:
            agent_config: Agent配置
            
        Returns:
            bool: 是否注册成功
        """
        try:
            # 在能力调度器中注册Agent
            success = self.capability_scheduler.register_agent(
                agent_id=agent_config.id,
                capabilities=agent_config.capabilities,
                max_concurrent_tasks=agent_config.parameters.get("max_concurrent_tasks", 5),
                metadata={
                    "name": agent_config.name,
                    "type": agent_config.type,
                    "description": agent_config.description
                }
            )
            
            if success:
                logger.info(f"Agent注册成功: {agent_config.id}")
            else:
                logger.error(f"Agent注册失败: {agent_config.id}")
            
            return success
            
        except Exception as e:
            logger.error(f"Agent注册异常: {agent_config.id}, 错误: {e}")
            return False
    
    async def unregister_agent(self, agent_id: str) -> bool:
        """注销Agent
        
        Args:
            agent_id: Agent ID
            
        Returns:
            bool: 是否注销成功
        """
        try:
            success = self.capability_scheduler.unregister_agent(agent_id)
            
            if success:
                logger.info(f"Agent注销成功: {agent_id}")
            else:
                logger.error(f"Agent注销失败: {agent_id}")
            
            return success
            
        except Exception as e:
            logger.error(f"Agent注销异常: {agent_id}, 错误: {e}")
            return False
    
    async def create_task_plan(self, 
                              task_description: str,
                              requirements: Dict[str, Any],
                              priority: TaskPriority = TaskPriority.NORMAL,
                              deadline: Optional[datetime] = None) -> Optional[TaskPlan]:
        """创建任务计划
        
        Args:
            task_description: 任务描述
            requirements: 任务需求
            priority: 任务优先级
            deadline: 截止时间
            
        Returns:
            Optional[TaskPlan]: 任务计划，如果创建失败则返回None
        """
        try:
            # 使用任务规划器创建计划
            task_plan = self.task_planner.create_task_plan(
                description=task_description,
                requirements=requirements,
                priority=priority,
                deadline=deadline
            )
            
            if task_plan:
                self.total_tasks_processed += 1
                logger.info(f"任务计划创建成功: {task_plan.plan_id}")
            else:
                logger.error(f"任务计划创建失败: {task_description}")
            
            return task_plan
            
        except Exception as e:
            logger.error(f"任务计划创建异常: {task_description}, 错误: {e}")
            return None
    
    async def execute_task_plan(self, task_plan: TaskPlan) -> bool:
        """执行任务计划
        
        Args:
            task_plan: 任务计划
            
        Returns:
            bool: 是否执行成功
        """
        try:
            # 为每个任务节点分配Agent
            for task_node in task_plan.tasks:
                if task_node.status != TaskStatus.PENDING:
                    continue
                
                # 查找合适的Agent
                suitable_agents = self.capability_scheduler.find_suitable_agents(
                    required_capabilities=task_node.required_capabilities,
                    min_agents=1
                )
                
                if not suitable_agents:
                    logger.error(f"未找到合适的Agent执行任务: {task_node.task_id}")
                    return False
                
                # 分配任务给最合适的Agent
                best_agent = suitable_agents[0]
                success = self.capability_scheduler.assign_task(
                    agent_id=best_agent.agent_id,
                    task_id=task_node.task_id,
                    estimated_duration=task_node.estimated_duration
                )
                
                if success:
                    task_node.assigned_agent = best_agent.agent_id
                    task_node.status = TaskStatus.ASSIGNED
                    logger.info(f"任务分配成功: {task_node.task_id} -> {best_agent.agent_id}")
                else:
                    logger.error(f"任务分配失败: {task_node.task_id}")
                    return False
            
            # 更新任务计划状态
            task_plan.status = TaskStatus.EXECUTING
            task_plan.start_time = datetime.now()
            
            logger.info(f"任务计划执行开始: {task_plan.plan_id}")
            return True
            
        except Exception as e:
            logger.error(f"任务计划执行异常: {task_plan.plan_id}, 错误: {e}")
            return False
    
    async def create_collaboration_session(self,
                                         session_name: str,
                                         mode: CollaborationMode,
                                         participants: List[str],
                                         context: Dict[str, Any] = None) -> Optional[str]:
        """创建协作会话
        
        Args:
            session_name: 会话名称
            mode: 协作模式
            participants: 参与者列表
            context: 协作上下文
            
        Returns:
            Optional[str]: 会话ID，如果创建失败则返回None
        """
        try:
            session_id = self.collaboration_coordinator.create_collaboration_session(
                name=session_name,
                description=f"协作会话: {session_name}",
                mode=mode,
                participants=participants
            )
            
            if session_id:
                self.total_collaborations_created += 1
                logger.info(f"协作会话创建成功: {session_id}, 模式: {mode}, 参与者: {participants}")
            else:
                logger.error(f"协作会话创建失败: {session_name}")
            
            return session_id
            
        except Exception as e:
            logger.error(f"协作会话创建异常: {session_name}, 错误: {e}")
            return None
    
    async def optimize_performance(self) -> Dict[str, Any]:
        """执行性能优化
        
        Returns:
            Dict[str, Any]: 优化结果
        """
        try:
            # 生成优化建议
            recommendations = self.performance_optimizer.generate_optimization_recommendations()
            
            applied_optimizations = []
            failed_optimizations = []
            
            # 应用优化建议
            for recommendation in recommendations:
                success = self.performance_optimizer.apply_optimization(recommendation)
                
                if success:
                    applied_optimizations.append(recommendation)
                    self.total_optimizations_applied += 1
                else:
                    failed_optimizations.append(recommendation)
            
            result = {
                "total_recommendations": len(recommendations),
                "applied_count": len(applied_optimizations),
                "failed_count": len(failed_optimizations),
                "applied_optimizations": applied_optimizations,
                "failed_optimizations": failed_optimizations,
                "optimization_time": datetime.now().isoformat()
            }
            
            logger.info(f"性能优化完成: 应用 {len(applied_optimizations)}/{len(recommendations)} 项建议")
            return result
            
        except Exception as e:
            logger.error(f"性能优化异常: {e}")
            return {
                "error": str(e),
                "optimization_time": datetime.now().isoformat()
            }
    
    def get_platform_status(self) -> Dict[str, Any]:
        """获取平台状态
        
        Returns:
            Dict[str, Any]: 平台状态信息
        """
        uptime = None
        if self.start_time:
            uptime = (datetime.now() - self.start_time).total_seconds()
        
        # 获取各组件状态
        registered_agents = len(self.capability_scheduler.agents)
        active_tasks = len([agent for agent in self.capability_scheduler.agents.values() 
                           if agent.current_tasks])
        active_sessions = len(self.collaboration_coordinator.sessions)
        
        # 获取性能摘要
        performance_summary = self.performance_optimizer.get_performance_summary()
        
        return {
            "platform_id": self.platform_id,
            "is_running": self.is_running,
            "start_time": self.start_time.isoformat() if self.start_time else None,
            "uptime_seconds": uptime,
            "statistics": {
                "total_tasks_processed": self.total_tasks_processed,
                "total_collaborations_created": self.total_collaborations_created,
                "total_optimizations_applied": self.total_optimizations_applied,
                "registered_agents": registered_agents,
                "active_tasks": active_tasks,
                "active_sessions": active_sessions
            },
            "performance_summary": performance_summary,
            "components": {
                "task_planner": {
                    "total_plans": len(self.task_planner.task_plans),
                    "decomposition_rules": len(self.task_planner.decomposition_rules)
                },
                "capability_scheduler": {
                    "registered_agents": registered_agents,
                    "scheduling_strategy": "capability_based"  # 可以从调度器获取
                },
                "collaboration_coordinator": {
                    "active_sessions": active_sessions,
                    "supported_modes": list(self.collaboration_coordinator.collaboration_patterns.keys())
                },
                "performance_optimizer": {
                    "monitoring_active": self.performance_optimizer.monitoring_active,
                    "optimization_active": self.performance_optimizer.optimization_active,
                    "metrics_agents": len(self.performance_optimizer.metrics_history)
                }
            }
        }
    
    def get_agent_status(self, agent_id: str) -> Optional[Dict[str, Any]]:
        """获取Agent状态
        
        Args:
            agent_id: Agent ID
            
        Returns:
            Optional[Dict[str, Any]]: Agent状态信息
        """
        agent_resource = self.capability_scheduler.agents.get(agent_id)
        if not agent_resource:
            return None
        
        # 获取性能趋势
        performance_trends = self.performance_optimizer.analyze_performance_trends(
            agent_id=agent_id,
            time_window=3600  # 1小时窗口
        )
        
        return {
            "agent_id": agent_id,
            "status": agent_resource.status.value,
            "load": agent_resource.load,
            "current_tasks": list(agent_resource.current_tasks),
            "capabilities": [cap.name for cap in agent_resource.capabilities],
            "last_heartbeat": agent_resource.last_heartbeat.isoformat(),
            "performance_trends": performance_trends.get("agent_trends", {}).get(agent_id, {}),
            "metadata": agent_resource.metadata
        }
    
    async def health_check(self) -> Dict[str, Any]:
        """健康检查
        
        Returns:
            Dict[str, Any]: 健康检查结果
        """
        health_status = {
            "platform_healthy": True,
            "issues": [],
            "check_time": datetime.now().isoformat()
        }
        
        try:
            # 检查平台运行状态
            if not self.is_running:
                health_status["platform_healthy"] = False
                health_status["issues"].append("Platform is not running")
            
            # 检查Agent健康状态
            unhealthy_agents = self.capability_scheduler.check_agent_health()
            if unhealthy_agents:
                health_status["issues"].append(f"Unhealthy agents: {unhealthy_agents}")
            
            # 检查性能瓶颈
            bottlenecks = self.performance_optimizer.identify_bottlenecks()
            if bottlenecks:
                health_status["issues"].append(f"Performance bottlenecks detected: {len(bottlenecks)}")
            
            # 检查系统健康分数
            performance_summary = self.performance_optimizer.get_performance_summary()
            system_health = performance_summary.get("system_health", "unknown")
            
            if system_health in ["poor", "fair"]:
                health_status["platform_healthy"] = False
                health_status["issues"].append(f"System health is {system_health}")
            
            health_status["system_health"] = system_health
            health_status["bottlenecks_count"] = len(bottlenecks)
            health_status["unhealthy_agents_count"] = len(unhealthy_agents)
            
        except Exception as e:
            health_status["platform_healthy"] = False
            health_status["issues"].append(f"Health check error: {str(e)}")
            logger.error(f"健康检查异常: {e}")
        
        return health_status


# 导出主要类和枚举
__all__ = [
    # 枚举
    "TaskStatus",
    "CollaborationMode", 
    "CapabilityType",
    "TaskPriority",
    
    # 数据模型
    "TaskNode",
    "TaskPlan",
    "AgentResource",
    "CollaborationSession",
    "PerformanceMetrics",
    
    # 核心组件
    "TaskPlanner",
    "CapabilityScheduler",
    "CollaborationCoordinator",
    "PerformanceOptimizer",
    
    # 主要集成类
    "CollaborationPlatform"
]