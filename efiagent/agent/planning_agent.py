"""规划智能体模块

该模块实现了规划智能体，负责任务拆解和DAG构建。
"""

import uuid
import json
import time
from enum import Enum
from typing import Dict, List, Set, Optional, Any, Tuple, Callable, Union
from datetime import datetime
from pydantic import BaseModel, Field, validator
from loguru import logger

from efiagent.agent.base_agent import (
    BaseAgent, AgentConfig, AgentType, AgentStatus,
    AgentContext, AgentObservation, AgentAction, AgentResult
)
from efiagent.core.task_dag import TaskDAG, TaskNode, TaskStatus, TaskPriority, TaskType


class PlanningStrategy(str, Enum):
    """规划策略枚举"""
    SEQUENTIAL = "sequential"  # 顺序规划
    PARALLEL = "parallel"  # 并行规划
    HIERARCHICAL = "hierarchical"  # 层次规划
    ADAPTIVE = "adaptive"  # 自适应规划


class PlanningPhase(str, Enum):
    """规划阶段枚举"""
    TASK_ANALYSIS = "task_analysis"  # 任务分析
    SUBTASK_GENERATION = "subtask_generation"  # 子任务生成
    DEPENDENCY_ANALYSIS = "dependency_analysis"  # 依赖分析
    DAG_CONSTRUCTION = "dag_construction"  # DAG构建
    RESOURCE_ESTIMATION = "resource_estimation"  # 资源估计
    PLAN_OPTIMIZATION = "plan_optimization"  # 计划优化
    PLAN_VALIDATION = "plan_validation"  # 计划验证


class TaskAnalysisResult(BaseModel):
    """任务分析结果"""
    task_id: str  # 任务ID
    task_description: str  # 任务描述
    task_type: TaskType  # 任务类型
    complexity: int = 1  # 复杂度（1-10）
    estimated_duration: float = 0.0  # 估计持续时间（秒）
    required_skills: List[str] = Field(default_factory=list)  # 所需技能
    constraints: Dict[str, Any] = Field(default_factory=dict)  # 约束条件
    context_requirements: List[str] = Field(default_factory=list)  # 上下文需求


class SubtaskInfo(BaseModel):
    """子任务信息"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    parent_id: Optional[str] = None  # 父任务ID
    description: str  # 描述
    type: TaskType  # 类型
    priority: TaskPriority = TaskPriority.MEDIUM  # 优先级
    complexity: int = 1  # 复杂度（1-10）
    estimated_duration: float = 0.0  # 估计持续时间（秒）
    required_skills: List[str] = Field(default_factory=list)  # 所需技能
    parameters: Dict[str, Any] = Field(default_factory=dict)  # 参数
    constraints: Dict[str, Any] = Field(default_factory=dict)  # 约束条件


class PlanningAgent(BaseAgent):
    """规划智能体
    
    负责任务拆解和DAG构建
    """
    def __init__(self, config: AgentConfig):
        """初始化规划智能体
        
        Args:
            config: 智能体配置
        """
        super().__init__(config)
        
        # 确保类型正确
        if self.type != AgentType.PLANNING:
            raise ValueError(f"Invalid agent type: {self.type}, expected: {AgentType.PLANNING}")
        
        # 规划相关属性
        self.strategy = PlanningStrategy(self.parameters.get("strategy", PlanningStrategy.ADAPTIVE.value))
        self.current_phase = None
        self.current_task_id = None
        self.task_analysis_result = None
        self.subtasks = []
        self.dependencies = []
        self.task_dag = None
        
        # LLM相关配置
        self.llm_config = self.model_config.get("llm", {})
        self.prompt_templates = self.model_config.get("prompt_templates", {})
    
    def _initialize_impl(self) -> None:
        """初始化实现"""
        # 初始化LLM客户端
        self._initialize_llm()
        
        # 加载提示词模板
        self._load_prompt_templates()
        
        logger.info(f"Planning agent {self.id} initialized with strategy: {self.strategy}")
    
    def _initialize_llm(self) -> None:
        """初始化LLM客户端
        
        根据配置初始化大语言模型客户端
        """
        # 这里应该根据实际使用的LLM进行初始化
        # 例如OpenAI、Azure OpenAI、Anthropic等
        llm_provider = self.llm_config.get("provider", "openai")
        
        if llm_provider == "openai":
            # 初始化OpenAI客户端
            try:
                import openai
                self.llm_client = openai.Client(
                    api_key=self.llm_config.get("api_key"),
                    organization=self.llm_config.get("organization")
                )
                logger.info(f"Initialized OpenAI client for agent {self.id}")
            except ImportError:
                logger.warning("OpenAI package not installed, using mock client")
                self.llm_client = MockLLMClient()
            except Exception as e:
                logger.error(f"Failed to initialize OpenAI client: {e}")
                self.llm_client = MockLLMClient()
        elif llm_provider == "azure":
            # 初始化Azure OpenAI客户端
            try:
                import openai
                self.llm_client = openai.AzureOpenAI(
                    api_key=self.llm_config.get("api_key"),
                    azure_endpoint=self.llm_config.get("endpoint"),
                    api_version=self.llm_config.get("api_version", "2023-05-15")
                )
                logger.info(f"Initialized Azure OpenAI client for agent {self.id}")
            except ImportError:
                logger.warning("OpenAI package not installed, using mock client")
                self.llm_client = MockLLMClient()
            except Exception as e:
                logger.error(f"Failed to initialize Azure OpenAI client: {e}")
                self.llm_client = MockLLMClient()
        else:
            # 使用模拟客户端
            logger.warning(f"Unsupported LLM provider: {llm_provider}, using mock client")
            self.llm_client = MockLLMClient()
    
    def _load_prompt_templates(self) -> None:
        """加载提示词模板"""
        # 如果没有提供模板，使用默认模板
        if not self.prompt_templates:
            self.prompt_templates = {
                "task_analysis": (
                    "You are an AI planning agent responsible for analyzing tasks. "
                    "Please analyze the following task and provide structured information:\n\n"
                    "Task: {task_description}\n\n"
                    "Please provide:\n"
                    "1. Task type (data_processing, decision_making, information_retrieval, etc.)\n"
                    "2. Complexity (1-10)\n"
                    "3. Estimated duration (in seconds)\n"
                    "4. Required skills\n"
                    "5. Constraints\n"
                    "6. Context requirements"
                ),
                "subtask_generation": (
                    "You are an AI planning agent responsible for breaking down tasks into subtasks. "
                    "Please break down the following task into logical subtasks:\n\n"
                    "Task: {task_description}\n\n"
                    "Task Analysis: {task_analysis}\n\n"
                    "Please provide a list of subtasks, each with:\n"
                    "1. Description\n"
                    "2. Type (data_processing, decision_making, information_retrieval, etc.)\n"
                    "3. Priority (low, medium, high, critical)\n"
                    "4. Complexity (1-10)\n"
                    "5. Estimated duration (in seconds)\n"
                    "6. Required skills\n"
                    "7. Parameters\n"
                    "8. Constraints"
                ),
                "dependency_analysis": (
                    "You are an AI planning agent responsible for analyzing dependencies between subtasks. "
                    "Please analyze the dependencies between the following subtasks:\n\n"
                    "Task: {task_description}\n\n"
                    "Subtasks:\n{subtasks}\n\n"
                    "Please provide a list of dependencies, each with:\n"
                    "1. Source subtask ID\n"
                    "2. Target subtask ID\n"
                    "3. Dependency type (data, control, resource)\n"
                    "4. Criticality (optional, blocking, non-blocking)"
                )
            }
            logger.info(f"Loaded default prompt templates for agent {self.id}")
    
    def _observe_impl(self, observation: AgentObservation) -> None:
        """观察实现
        
        Args:
            observation: 智能体观察
        """
        # 处理观察
        if observation.source == "task_manager" and "task" in observation.data:
            # 接收到新任务
            task_data = observation.data["task"]
            self.current_task_id = task_data.get("id")
            
            # 重置规划状态
            self.current_phase = PlanningPhase.TASK_ANALYSIS
            self.task_analysis_result = None
            self.subtasks = []
            self.dependencies = []
            self.task_dag = None
            
            # 将任务信息存储在上下文中
            if self.context:
                self.context.update_memory("current_task", task_data)
                self.context.update_memory("planning_phase", self.current_phase.value)
            
            logger.info(f"Planning agent {self.id} received new task: {self.current_task_id}")
        
        elif observation.source == "execution_agent" and "subtask_result" in observation.data:
            # 接收到子任务执行结果
            subtask_result = observation.data["subtask_result"]
            subtask_id = subtask_result.get("subtask_id")
            success = subtask_result.get("success", False)
            
            # 更新任务DAG中的节点状态
            if self.task_dag and subtask_id:
                status = TaskStatus.COMPLETED if success else TaskStatus.FAILED
                self.task_dag.update_node_status(subtask_id, status)
                
                # 将结果存储在上下文中
                if self.context:
                    results = self.context.get_memory("subtask_results", {})
                    results[subtask_id] = subtask_result
                    self.context.update_memory("subtask_results", results)
                
                logger.info(f"Planning agent {self.id} updated subtask {subtask_id} status to {status}")
        
        elif observation.source == "audit_agent" and "plan_feedback" in observation.data:
            # 接收到审核智能体的反馈
            feedback = observation.data["plan_feedback"]
            
            # 将反馈存储在上下文中
            if self.context:
                feedbacks = self.context.get_memory("plan_feedbacks", [])
                feedbacks.append(feedback)
                self.context.update_memory("plan_feedbacks", feedbacks)
            
            logger.info(f"Planning agent {self.id} received feedback from audit agent")
    
    def _act_impl(self) -> Optional[AgentAction]:
        """行动实现
        
        Returns:
            Optional[AgentAction]: 智能体动作
        """
        # 检查是否有当前任务
        if not self.current_task_id or not self.context:
            return None
        
        # 根据当前阶段执行相应的操作
        if self.current_phase == PlanningPhase.TASK_ANALYSIS:
            return self._perform_task_analysis()
        elif self.current_phase == PlanningPhase.SUBTASK_GENERATION:
            return self._perform_subtask_generation()
        elif self.current_phase == PlanningPhase.DEPENDENCY_ANALYSIS:
            return self._perform_dependency_analysis()
        elif self.current_phase == PlanningPhase.DAG_CONSTRUCTION:
            return self._perform_dag_construction()
        elif self.current_phase == PlanningPhase.RESOURCE_ESTIMATION:
            return self._perform_resource_estimation()
        elif self.current_phase == PlanningPhase.PLAN_OPTIMIZATION:
            return self._perform_plan_optimization()
        elif self.current_phase == PlanningPhase.PLAN_VALIDATION:
            return self._perform_plan_validation()
        else:
            logger.warning(f"Planning agent {self.id} in unknown phase: {self.current_phase}")
            return None
    
    def _perform_task_analysis(self) -> AgentAction:
        """执行任务分析
        
        Returns:
            AgentAction: 智能体动作
        """
        # 获取任务信息
        task_data = self.context.get_memory("current_task", {})
        task_description = task_data.get("description", "")
        
        # 准备提示词
        prompt = self.prompt_templates.get("task_analysis", "")
        prompt = prompt.format(task_description=task_description)
        
        # 创建动作
        action = AgentAction(
            agent_id=self.id,
            action_type="llm_query",
            parameters={
                "prompt": prompt,
                "model": self.llm_config.get("model", "gpt-4"),
                "temperature": self.llm_config.get("temperature", 0.2),
                "max_tokens": self.llm_config.get("max_tokens", 1000),
                "phase": PlanningPhase.TASK_ANALYSIS.value
            }
        )
        
        logger.info(f"Planning agent {self.id} performing task analysis for task: {self.current_task_id}")
        return action
    
    def _perform_subtask_generation(self) -> AgentAction:
        """执行子任务生成
        
        Returns:
            AgentAction: 智能体动作
        """
        # 获取任务信息和分析结果
        task_data = self.context.get_memory("current_task", {})
        task_description = task_data.get("description", "")
        task_analysis = self.task_analysis_result.dict() if self.task_analysis_result else {}
        
        # 准备提示词
        prompt = self.prompt_templates.get("subtask_generation", "")
        prompt = prompt.format(
            task_description=task_description,
            task_analysis=json.dumps(task_analysis, indent=2)
        )
        
        # 创建动作
        action = AgentAction(
            agent_id=self.id,
            action_type="llm_query",
            parameters={
                "prompt": prompt,
                "model": self.llm_config.get("model", "gpt-4"),
                "temperature": self.llm_config.get("temperature", 0.2),
                "max_tokens": self.llm_config.get("max_tokens", 2000),
                "phase": PlanningPhase.SUBTASK_GENERATION.value
            }
        )
        
        logger.info(f"Planning agent {self.id} generating subtasks for task: {self.current_task_id}")
        return action
    
    def _perform_dependency_analysis(self) -> AgentAction:
        """执行依赖分析
        
        Returns:
            AgentAction: 智能体动作
        """
        # 获取任务信息和子任务
        task_data = self.context.get_memory("current_task", {})
        task_description = task_data.get("description", "")
        
        # 准备子任务信息
        subtasks_text = ""
        for i, subtask in enumerate(self.subtasks):
            subtasks_text += f"{i+1}. ID: {subtask.id}\n"
            subtasks_text += f"   Description: {subtask.description}\n"
            subtasks_text += f"   Type: {subtask.type.value}\n"
            subtasks_text += f"   Priority: {subtask.priority.value}\n\n"
        
        # 准备提示词
        prompt = self.prompt_templates.get("dependency_analysis", "")
        prompt = prompt.format(
            task_description=task_description,
            subtasks=subtasks_text
        )
        
        # 创建动作
        action = AgentAction(
            agent_id=self.id,
            action_type="llm_query",
            parameters={
                "prompt": prompt,
                "model": self.llm_config.get("model", "gpt-4"),
                "temperature": self.llm_config.get("temperature", 0.2),
                "max_tokens": self.llm_config.get("max_tokens", 2000),
                "phase": PlanningPhase.DEPENDENCY_ANALYSIS.value
            }
        )
        
        logger.info(f"Planning agent {self.id} analyzing dependencies for task: {self.current_task_id}")
        return action
    
    def _perform_dag_construction(self) -> AgentAction:
        """执行DAG构建
        
        Returns:
            AgentAction: 智能体动作
        """
        # 创建任务DAG
        self.task_dag = TaskDAG()
        
        # 添加节点
        for subtask in self.subtasks:
            node = TaskNode(
                id=subtask.id,
                name=subtask.description,
                task_type=subtask.type,
                priority=subtask.priority,
                parameters=subtask.parameters,
                estimated_duration=subtask.estimated_duration,
                required_skills=subtask.required_skills
            )
            self.task_dag.add_node(node)
        
        # 添加边（依赖关系）
        for src, dst, _ in self.dependencies:
            self.task_dag.add_edge(src, dst)
        
        # 检查是否有环
        if self.task_dag.has_cycles():
            logger.warning(f"Planning agent {self.id} detected cycles in task DAG")
            
            # 创建动作请求人工干预
            action = AgentAction(
                agent_id=self.id,
                action_type="request_intervention",
                parameters={
                    "issue": "cycle_detected",
                    "task_id": self.current_task_id,
                    "message": "Cycles detected in the task DAG. Please review the dependencies.",
                    "dag": self.task_dag.to_dict()
                }
            )
            return action
        
        # 更新阶段
        self.current_phase = PlanningPhase.RESOURCE_ESTIMATION
        if self.context:
            self.context.update_memory("planning_phase", self.current_phase.value)
            self.context.update_memory("task_dag", self.task_dag.to_dict())
        
        # 创建动作通知DAG构建完成
        action = AgentAction(
            agent_id=self.id,
            action_type="notify",
            parameters={
                "message": "dag_constructed",
                "task_id": self.current_task_id,
                "dag": self.task_dag.to_dict()
            }
        )
        
        logger.info(f"Planning agent {self.id} constructed DAG for task: {self.current_task_id}")
        return action
    
    def _perform_resource_estimation(self) -> AgentAction:
        """执行资源估计
        
        Returns:
            AgentAction: 智能体动作
        """
        # 为每个节点估计所需资源
        for node_id in self.task_dag.nodes:
            node = self.task_dag.nodes[node_id]
            
            # 根据任务类型和复杂度估计资源需求
            # 这里使用简单的启发式方法，实际应用中可能需要更复杂的模型
            cpu_requirement = 1.0  # 默认CPU需求
            memory_requirement = 512.0  # 默认内存需求（MB）
            gpu_requirement = 0.0  # 默认GPU需求
            
            # 根据任务类型调整资源需求
            if node.task_type == TaskType.DATA_PROCESSING:
                cpu_requirement = 2.0
                memory_requirement = 1024.0
            elif node.task_type == TaskType.MODEL_INFERENCE:
                cpu_requirement = 4.0
                memory_requirement = 2048.0
                gpu_requirement = 0.5
            elif node.task_type == TaskType.MODEL_TRAINING:
                cpu_requirement = 8.0
                memory_requirement = 4096.0
                gpu_requirement = 1.0
            
            # 更新节点的资源需求
            node.resource_requirements = {
                "cpu": cpu_requirement,
                "memory": memory_requirement,
                "gpu": gpu_requirement
            }
        
        # 更新阶段
        self.current_phase = PlanningPhase.PLAN_OPTIMIZATION
        if self.context:
            self.context.update_memory("planning_phase", self.current_phase.value)
            self.context.update_memory("task_dag", self.task_dag.to_dict())
        
        # 创建动作通知资源估计完成
        action = AgentAction(
            agent_id=self.id,
            action_type="notify",
            parameters={
                "message": "resource_estimated",
                "task_id": self.current_task_id,
                "dag": self.task_dag.to_dict()
            }
        )
        
        logger.info(f"Planning agent {self.id} estimated resources for task: {self.current_task_id}")
        return action
    
    def _perform_plan_optimization(self) -> AgentAction:
        """执行计划优化
        
        Returns:
            AgentAction: 智能体动作
        """
        # 优化任务计划
        # 1. 计算关键路径
        critical_path = self.task_dag.get_critical_path()
        
        # 2. 尝试并行化非关键路径上的任务
        # 这里使用简单的启发式方法，实际应用中可能需要更复杂的算法
        
        # 3. 平衡资源分配
        # 这里可以实现更复杂的资源平衡算法
        
        # 更新阶段
        self.current_phase = PlanningPhase.PLAN_VALIDATION
        if self.context:
            self.context.update_memory("planning_phase", self.current_phase.value)
            self.context.update_memory("critical_path", critical_path)
        
        # 创建动作通知计划优化完成
        action = AgentAction(
            agent_id=self.id,
            action_type="notify",
            parameters={
                "message": "plan_optimized",
                "task_id": self.current_task_id,
                "dag": self.task_dag.to_dict(),
                "critical_path": critical_path
            }
        )
        
        logger.info(f"Planning agent {self.id} optimized plan for task: {self.current_task_id}")
        return action
    
    def _perform_plan_validation(self) -> AgentAction:
        """执行计划验证
        
        Returns:
            AgentAction: 智能体动作
        """
        # 验证任务计划
        validation_errors = []
        
        # 1. 检查是否所有节点都可达
        unreachable_nodes = self.task_dag.get_unreachable_nodes()
        if unreachable_nodes:
            validation_errors.append({
                "type": "unreachable_nodes",
                "message": f"Found {len(unreachable_nodes)} unreachable nodes",
                "nodes": unreachable_nodes
            })
        
        # 2. 检查资源需求是否合理
        for node_id, node in self.task_dag.nodes.items():
            if node.resource_requirements.get("cpu", 0) > 16:
                validation_errors.append({
                    "type": "excessive_resource",
                    "message": f"Node {node_id} requires excessive CPU",
                    "node": node_id,
                    "resource": "cpu",
                    "value": node.resource_requirements.get("cpu")
                })
            
            if node.resource_requirements.get("memory", 0) > 16384:
                validation_errors.append({
                    "type": "excessive_resource",
                    "message": f"Node {node_id} requires excessive memory",
                    "node": node_id,
                    "resource": "memory",
                    "value": node.resource_requirements.get("memory")
                })
        
        # 如果有验证错误，请求人工干预
        if validation_errors:
            logger.warning(f"Planning agent {self.id} found validation errors: {validation_errors}")
            
            action = AgentAction(
                agent_id=self.id,
                action_type="request_intervention",
                parameters={
                    "issue": "validation_errors",
                    "task_id": self.current_task_id,
                    "message": "Validation errors found in the task plan.",
                    "errors": validation_errors,
                    "dag": self.task_dag.to_dict()
                }
            )
            return action
        
        # 计划验证通过，提交计划
        action = AgentAction(
            agent_id=self.id,
            action_type="submit_plan",
            parameters={
                "task_id": self.current_task_id,
                "dag": self.task_dag.to_dict()
            }
        )
        
        # 重置当前任务和阶段
        self.current_task_id = None
        self.current_phase = None
        
        logger.info(f"Planning agent {self.id} submitted plan for task: {self.current_task_id}")
        return action
    
    def _process_result_impl(self, result: AgentResult) -> None:
        """处理结果实现
        
        Args:
            result: 智能体结果
        """
        # 检查结果是否成功
        if not result.success:
            logger.error(f"Planning agent {self.id} received error: {result.error}")
            return
        
        # 获取动作类型和阶段
        action_type = result.data.get("action_type")
        phase = result.data.get("phase")
        
        # 处理LLM查询结果
        if action_type == "llm_query":
            if phase == PlanningPhase.TASK_ANALYSIS.value:
                self._process_task_analysis_result(result.data)
            elif phase == PlanningPhase.SUBTASK_GENERATION.value:
                self._process_subtask_generation_result(result.data)
            elif phase == PlanningPhase.DEPENDENCY_ANALYSIS.value:
                self._process_dependency_analysis_result(result.data)
    
    def _process_task_analysis_result(self, data: Dict[str, Any]) -> None:
        """处理任务分析结果
        
        Args:
            data: 结果数据
        """
        # 解析LLM响应
        response = data.get("response", "")
        
        try:
            # 尝试从响应中提取结构化信息
            # 这里假设LLM返回的是JSON格式的数据
            # 实际应用中可能需要更复杂的解析逻辑
            import re
            import json
            
            # 查找JSON块
            json_match = re.search(r'```json\s*([\s\S]*?)\s*```', response)
            if json_match:
                json_str = json_match.group(1)
                analysis_data = json.loads(json_str)
            else:
                # 尝试直接解析整个响应
                analysis_data = json.loads(response)
            
            # 创建任务分析结果
            self.task_analysis_result = TaskAnalysisResult(
                task_id=self.current_task_id,
                task_description=analysis_data.get("task_description", ""),
                task_type=TaskType(analysis_data.get("task_type", TaskType.GENERAL.value)),
                complexity=analysis_data.get("complexity", 1),
                estimated_duration=analysis_data.get("estimated_duration", 0.0),
                required_skills=analysis_data.get("required_skills", []),
                constraints=analysis_data.get("constraints", {}),
                context_requirements=analysis_data.get("context_requirements", [])
            )
            
            # 更新上下文
            if self.context:
                self.context.update_memory("task_analysis", self.task_analysis_result.dict())
            
            # 更新阶段
            self.current_phase = PlanningPhase.SUBTASK_GENERATION
            if self.context:
                self.context.update_memory("planning_phase", self.current_phase.value)
            
            logger.info(f"Planning agent {self.id} completed task analysis for task: {self.current_task_id}")
        
        except Exception as e:
            logger.error(f"Planning agent {self.id} failed to process task analysis result: {e}")
            
            # 创建一个基本的任务分析结果
            self.task_analysis_result = TaskAnalysisResult(
                task_id=self.current_task_id,
                task_description="",
                task_type=TaskType.GENERAL
            )
            
            # 更新阶段
            self.current_phase = PlanningPhase.SUBTASK_GENERATION
            if self.context:
                self.context.update_memory("planning_phase", self.current_phase.value)
    
    def _process_subtask_generation_result(self, data: Dict[str, Any]) -> None:
        """处理子任务生成结果
        
        Args:
            data: 结果数据
        """
        # 解析LLM响应
        response = data.get("response", "")
        
        try:
            # 尝试从响应中提取结构化信息
            import re
            import json
            
            # 查找JSON块
            json_match = re.search(r'```json\s*([\s\S]*?)\s*```', response)
            if json_match:
                json_str = json_match.group(1)
                subtasks_data = json.loads(json_str)
            else:
                # 尝试直接解析整个响应
                subtasks_data = json.loads(response)
            
            # 确保subtasks_data是列表
            if not isinstance(subtasks_data, list):
                if "subtasks" in subtasks_data and isinstance(subtasks_data["subtasks"], list):
                    subtasks_data = subtasks_data["subtasks"]
                else:
                    raise ValueError("Expected subtasks data to be a list")
            
            # 创建子任务
            self.subtasks = []
            for subtask_data in subtasks_data:
                subtask = SubtaskInfo(
                    parent_id=self.current_task_id,
                    description=subtask_data.get("description", ""),
                    type=TaskType(subtask_data.get("type", TaskType.GENERAL.value)),
                    priority=TaskPriority(subtask_data.get("priority", TaskPriority.MEDIUM.value)),
                    complexity=subtask_data.get("complexity", 1),
                    estimated_duration=subtask_data.get("estimated_duration", 0.0),
                    required_skills=subtask_data.get("required_skills", []),
                    parameters=subtask_data.get("parameters", {}),
                    constraints=subtask_data.get("constraints", {})
                )
                self.subtasks.append(subtask)
            
            # 更新上下文
            if self.context:
                self.context.update_memory("subtasks", [s.dict() for s in self.subtasks])
            
            # 更新阶段
            self.current_phase = PlanningPhase.DEPENDENCY_ANALYSIS
            if self.context:
                self.context.update_memory("planning_phase", self.current_phase.value)
            
            logger.info(f"Planning agent {self.id} generated {len(self.subtasks)} subtasks for task: {self.current_task_id}")
        
        except Exception as e:
            logger.error(f"Planning agent {self.id} failed to process subtask generation result: {e}")
            
            # 创建一个基本的子任务
            if not self.subtasks:
                subtask = SubtaskInfo(
                    parent_id=self.current_task_id,
                    description="Execute the task",
                    type=TaskType.GENERAL
                )
                self.subtasks = [subtask]
            
            # 更新阶段
            self.current_phase = PlanningPhase.DEPENDENCY_ANALYSIS
            if self.context:
                self.context.update_memory("planning_phase", self.current_phase.value)
    
    def _process_dependency_analysis_result(self, data: Dict[str, Any]) -> None:
        """处理依赖分析结果
        
        Args:
            data: 结果数据
        """
        # 解析LLM响应
        response = data.get("response", "")
        
        try:
            # 尝试从响应中提取结构化信息
            import re
            import json
            
            # 查找JSON块
            json_match = re.search(r'```json\s*([\s\S]*?)\s*```', response)
            if json_match:
                json_str = json_match.group(1)
                dependencies_data = json.loads(json_str)
            else:
                # 尝试直接解析整个响应
                dependencies_data = json.loads(response)
            
            # 确保dependencies_data是列表
            if not isinstance(dependencies_data, list):
                if "dependencies" in dependencies_data and isinstance(dependencies_data["dependencies"], list):
                    dependencies_data = dependencies_data["dependencies"]
                else:
                    raise ValueError("Expected dependencies data to be a list")
            
            # 创建依赖关系
            self.dependencies = []
            for dep_data in dependencies_data:
                source_id = dep_data.get("source")
                target_id = dep_data.get("target")
                dep_type = dep_data.get("type", "data")
                
                # 验证源和目标ID
                if not source_id or not target_id:
                    continue
                
                # 查找对应的子任务
                source_exists = any(s.id == source_id for s in self.subtasks)
                target_exists = any(s.id == target_id for s in self.subtasks)
                
                if not source_exists or not target_exists:
                    # 尝试通过索引查找
                    try:
                        source_index = int(source_id) - 1
                        target_index = int(target_id) - 1
                        
                        if 0 <= source_index < len(self.subtasks) and 0 <= target_index < len(self.subtasks):
                            source_id = self.subtasks[source_index].id
                            target_id = self.subtasks[target_index].id
                        else:
                            continue
                    except ValueError:
                        continue
                
                self.dependencies.append((source_id, target_id, dep_type))
            
            # 更新上下文
            if self.context:
                self.context.update_memory("dependencies", [
                    {"source": src, "target": dst, "type": typ} 
                    for src, dst, typ in self.dependencies
                ])
            
            # 更新阶段
            self.current_phase = PlanningPhase.DAG_CONSTRUCTION
            if self.context:
                self.context.update_memory("planning_phase", self.current_phase.value)
            
            logger.info(f"Planning agent {self.id} analyzed {len(self.dependencies)} dependencies for task: {self.current_task_id}")
        
        except Exception as e:
            logger.error(f"Planning agent {self.id} failed to process dependency analysis result: {e}")
            
            # 创建顺序依赖关系
            self.dependencies = []
            for i in range(len(self.subtasks) - 1):
                self.dependencies.append((self.subtasks[i].id, self.subtasks[i+1].id, "control"))
            
            # 更新阶段
            self.current_phase = PlanningPhase.DAG_CONSTRUCTION
            if self.context:
                self.context.update_memory("planning_phase", self.current_phase.value)
    
    def _shutdown_impl(self) -> None:
        """关闭实现"""
        # 清理资源
        self.current_task_id = None
        self.current_phase = None
        self.task_analysis_result = None
        self.subtasks = []
        self.dependencies = []
        self.task_dag = None
        
        logger.info(f"Planning agent {self.id} shut down")


class MockLLMClient:
    """模拟LLM客户端
    
    用于在没有实际LLM服务时进行测试
    """
    def __init__(self):
        """初始化模拟LLM客户端"""
        pass
    
    def chat_completions_create(self, model: str, messages: List[Dict[str, str]], **kwargs) -> Dict[str, Any]:
        """创建聊天完成
        
        Args:
            model: 模型名称
            messages: 消息列表
            **kwargs: 其他参数
            
        Returns:
            Dict[str, Any]: 响应
        """
        # 模拟响应
        prompt = messages[-1]["content"]
        
        if "task analysis" in prompt.lower():
            return self._mock_task_analysis()
        elif "subtask" in prompt.lower():
            return self._mock_subtask_generation()
        elif "dependenc" in prompt.lower():
            return self._mock_dependency_analysis()
        else:
            return {
                "choices": [
                    {
                        "message": {
                            "content": "I'm a mock LLM response."
                        }
                    }
                ]
            }
    
    def _mock_task_analysis(self) -> Dict[str, Any]:
        """模拟任务分析响应
        
        Returns:
            Dict[str, Any]: 响应
        """
        return {
            "choices": [
                {
                    "message": {
                        "content": "```json\n{\n  \"task_type\": \"data_processing\",\n  \"complexity\": 5,\n  \"estimated_duration\": 3600,\n  \"required_skills\": [\"python\", \"data_analysis\", \"machine_learning\"],\n  \"constraints\": {\"max_memory\": \"4GB\", \"deadline\": \"2023-12-31\"},\n  \"context_requirements\": [\"data_source\", \"output_format\"]\n}\n```"
                    }
                }
            ]
        }
    
    def _mock_subtask_generation(self) -> Dict[str, Any]:
        """模拟子任务生成响应
        
        Returns:
            Dict[str, Any]: 响应
        """
        return {
            "choices": [
                {
                    "message": {
                        "content": "```json\n[\n  {\n    \"description\": \"Data collection and validation\",\n    \"type\": \"data_processing\",\n    \"priority\": \"high\",\n    \"complexity\": 3,\n    \"estimated_duration\": 900,\n    \"required_skills\": [\"python\", \"data_validation\"],\n    \"parameters\": {\"source\": \"api\", \"format\": \"json\"},\n    \"constraints\": {\"max_size\": \"1GB\"}\n  },\n  {\n    \"description\": \"Data preprocessing and feature engineering\",\n    \"type\": \"data_processing\",\n    \"priority\": \"medium\",\n    \"complexity\": 4,\n    \"estimated_duration\": 1200,\n    \"required_skills\": [\"python\", \"feature_engineering\"],\n    \"parameters\": {\"methods\": [\"normalization\", \"encoding\"]},\n    \"constraints\": {}\n  },\n  {\n    \"description\": \"Model training and evaluation\",\n    \"type\": \"model_training\",\n    \"priority\": \"medium\",\n    \"complexity\": 5,\n    \"estimated_duration\": 1800,\n    \"required_skills\": [\"python\", \"machine_learning\"],\n    \"parameters\": {\"algorithm\": \"random_forest\", \"cv\": 5},\n    \"constraints\": {\"min_accuracy\": 0.8}\n  }\n]\n```"
                    }
                }
            ]
        }
    
    def _mock_dependency_analysis(self) -> Dict[str, Any]:
        """模拟依赖分析响应
        
        Returns:
            Dict[str, Any]: 响应
        """
        return {
            "choices": [
                {
                    "message": {
                        "content": "```json\n[\n  {\n    \"source\": \"1\",\n    \"target\": \"2\",\n    \"type\": \"data\",\n    \"criticality\": \"blocking\"\n  },\n  {\n    \"source\": \"2\",\n    \"target\": \"3\",\n    \"type\": \"data\",\n    \"criticality\": \"blocking\"\n  }\n]\n```"
                    }
                }
            ]
        }