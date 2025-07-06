"""执行智能体模块

该模块实现了执行智能体，负责执行具体任务。
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
from efiagent.core.task_dag import TaskNode, TaskStatus, TaskPriority, TaskType


class ExecutionStrategy(str, Enum):
    """执行策略枚举"""
    SEQUENTIAL = "sequential"  # 顺序执行
    PARALLEL = "parallel"  # 并行执行
    PRIORITY_BASED = "priority_based"  # 基于优先级执行
    RESOURCE_AWARE = "resource_aware"  # 资源感知执行


class ExecutionPhase(str, Enum):
    """执行阶段枚举"""
    PREPARATION = "preparation"  # 准备阶段
    EXECUTION = "execution"  # 执行阶段
    VERIFICATION = "verification"  # 验证阶段
    REPORTING = "reporting"  # 报告阶段


class ExecutionResult(BaseModel):
    """执行结果模型"""
    task_id: str  # 任务ID
    subtask_id: str  # 子任务ID
    success: bool = False  # 是否成功
    start_time: datetime = Field(default_factory=datetime.now)  # 开始时间
    end_time: Optional[datetime] = None  # 结束时间
    duration: float = 0.0  # 持续时间（秒）
    output: Dict[str, Any] = Field(default_factory=dict)  # 输出数据
    error: Optional[str] = None  # 错误信息
    metrics: Dict[str, Any] = Field(default_factory=dict)  # 性能指标
    resource_usage: Dict[str, float] = Field(default_factory=dict)  # 资源使用情况

    def mark_complete(self, success: bool = True, output: Dict[str, Any] = None, error: str = None) -> None:
        """标记执行完成
        
        Args:
            success: 是否成功
            output: 输出数据
            error: 错误信息
        """
        self.success = success
        self.end_time = datetime.now()
        self.duration = (self.end_time - self.start_time).total_seconds()
        
        if output:
            self.output = output
        
        if error:
            self.error = error
            self.success = False


class ToolRegistry(BaseModel):
    """工具注册表模型"""
    tools: Dict[str, Callable] = Field(default_factory=dict)  # 工具映射
    descriptions: Dict[str, str] = Field(default_factory=dict)  # 工具描述
    parameters: Dict[str, Dict[str, Any]] = Field(default_factory=dict)  # 工具参数
    
    def register_tool(self, name: str, func: Callable, description: str = "", parameters: Dict[str, Any] = None) -> None:
        """注册工具
        
        Args:
            name: 工具名称
            func: 工具函数
            description: 工具描述
            parameters: 工具参数
        """
        self.tools[name] = func
        self.descriptions[name] = description
        self.parameters[name] = parameters or {}
    
    def get_tool(self, name: str) -> Optional[Callable]:
        """获取工具
        
        Args:
            name: 工具名称
            
        Returns:
            Optional[Callable]: 工具函数
        """
        return self.tools.get(name)
    
    def get_description(self, name: str) -> str:
        """获取工具描述
        
        Args:
            name: 工具名称
            
        Returns:
            str: 工具描述
        """
        return self.descriptions.get(name, "")
    
    def get_parameters(self, name: str) -> Dict[str, Any]:
        """获取工具参数
        
        Args:
            name: 工具名称
            
        Returns:
            Dict[str, Any]: 工具参数
        """
        return self.parameters.get(name, {})
    
    def list_tools(self) -> List[Dict[str, Any]]:
        """列出所有工具
        
        Returns:
            List[Dict[str, Any]]: 工具列表
        """
        return [
            {
                "name": name,
                "description": self.descriptions.get(name, ""),
                "parameters": self.parameters.get(name, {})
            }
            for name in self.tools
        ]


class ExecutionAgent(BaseAgent):
    """执行智能体
    
    负责执行具体任务
    """
    def __init__(self, config: AgentConfig):
        """初始化执行智能体
        
        Args:
            config: 智能体配置
        """
        super().__init__(config)
        
        # 确保类型正确
        if self.type != AgentType.EXECUTION:
            raise ValueError(f"Invalid agent type: {self.type}, expected: {AgentType.EXECUTION}")
        
        # 执行相关属性
        self.strategy = ExecutionStrategy(self.parameters.get("strategy", ExecutionStrategy.RESOURCE_AWARE.value))
        self.current_phase = None
        self.current_task_id = None
        self.current_subtask_id = None
        self.current_subtask = None
        self.execution_results = {}
        
        # 工具注册表
        self.tool_registry = ToolRegistry()
        
        # LLM相关配置
        self.llm_config = self.model_config.get("llm", {})
        self.prompt_templates = self.model_config.get("prompt_templates", {})
    
    def _initialize_impl(self) -> None:
        """初始化实现"""
        # 初始化LLM客户端
        self._initialize_llm()
        
        # 注册内置工具
        self._register_built_in_tools()
        
        # 加载提示词模板
        self._load_prompt_templates()
        
        logger.info(f"Execution agent {self.id} initialized with strategy: {self.strategy}")
    
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
    
    def _register_built_in_tools(self) -> None:
        """注册内置工具"""
        # 数据处理工具
        self.tool_registry.register_tool(
            name="data_filter",
            func=self._tool_data_filter,
            description="过滤数据集中的记录",
            parameters={
                "data": "数据集",
                "condition": "过滤条件"
            }
        )
        
        self.tool_registry.register_tool(
            name="data_transform",
            func=self._tool_data_transform,
            description="转换数据格式",
            parameters={
                "data": "数据",
                "format": "目标格式"
            }
        )
        
        # 信息检索工具
        self.tool_registry.register_tool(
            name="search_information",
            func=self._tool_search_information,
            description="搜索信息",
            parameters={
                "query": "搜索查询",
                "sources": "搜索源"
            }
        )
        
        # 决策工具
        self.tool_registry.register_tool(
            name="make_decision",
            func=self._tool_make_decision,
            description="根据规则和数据做出决策",
            parameters={
                "data": "决策数据",
                "rules": "决策规则"
            }
        )
        
        # 模型推理工具
        self.tool_registry.register_tool(
            name="model_inference",
            func=self._tool_model_inference,
            description="使用模型进行推理",
            parameters={
                "model_name": "模型名称",
                "inputs": "输入数据"
            }
        )
        
        logger.info(f"Registered {len(self.tool_registry.tools)} built-in tools")
    
    def _load_prompt_templates(self) -> None:
        """加载提示词模板"""
        # 如果没有提供模板，使用默认模板
        if not self.prompt_templates:
            self.prompt_templates = {
                "task_preparation": (
                    "You are an AI execution agent responsible for preparing to execute tasks. "
                    "Please analyze the following task and provide preparation steps:\n\n"
                    "Task: {task_description}\n\n"
                    "Subtask: {subtask_description}\n\n"
                    "Parameters: {parameters}\n\n"
                    "Available Tools: {available_tools}\n\n"
                    "Please provide:\n"
                    "1. Required resources\n"
                    "2. Preparation steps\n"
                    "3. Tool selection\n"
                    "4. Expected outcomes"
                ),
                "tool_selection": (
                    "You are an AI execution agent responsible for selecting appropriate tools. "
                    "Please select the best tool for the following task:\n\n"
                    "Task: {task_description}\n\n"
                    "Subtask: {subtask_description}\n\n"
                    "Available Tools:\n{available_tools}\n\n"
                    "Please select the most appropriate tool and explain why."
                ),
                "result_verification": (
                    "You are an AI execution agent responsible for verifying task results. "
                    "Please verify the following execution result:\n\n"
                    "Task: {task_description}\n\n"
                    "Subtask: {subtask_description}\n\n"
                    "Expected Outcome: {expected_outcome}\n\n"
                    "Actual Result: {actual_result}\n\n"
                    "Please verify if the result meets the requirements and provide feedback."
                )
            }
            logger.info(f"Loaded default prompt templates for agent {self.id}")
    
    def _observe_impl(self, observation: AgentObservation) -> None:
        """观察实现
        
        Args:
            observation: 智能体观察
        """
        # 处理观察
        if observation.source == "task_manager" and "subtask" in observation.data:
            # 接收到新子任务
            subtask_data = observation.data["subtask"]
            self.current_task_id = subtask_data.get("task_id")
            self.current_subtask_id = subtask_data.get("id")
            self.current_subtask = subtask_data
            
            # 重置执行状态
            self.current_phase = ExecutionPhase.PREPARATION
            
            # 创建执行结果对象
            self.execution_results[self.current_subtask_id] = ExecutionResult(
                task_id=self.current_task_id,
                subtask_id=self.current_subtask_id
            )
            
            # 将子任务信息存储在上下文中
            if self.context:
                self.context.update_memory("current_subtask", subtask_data)
                self.context.update_memory("execution_phase", self.current_phase.value)
            
            logger.info(f"Execution agent {self.id} received new subtask: {self.current_subtask_id}")
        
        elif observation.source == "resource_scheduler" and "resource_allocation" in observation.data:
            # 接收到资源分配信息
            allocation = observation.data["resource_allocation"]
            subtask_id = allocation.get("subtask_id")
            
            # 将资源分配信息存储在上下文中
            if self.context and subtask_id == self.current_subtask_id:
                self.context.update_memory("resource_allocation", allocation)
                
                # 如果在准备阶段收到资源分配，可以进入执行阶段
                if self.current_phase == ExecutionPhase.PREPARATION:
                    self.current_phase = ExecutionPhase.EXECUTION
                    self.context.update_memory("execution_phase", self.current_phase.value)
                
                logger.info(f"Execution agent {self.id} received resource allocation for subtask: {subtask_id}")
    
    def _act_impl(self) -> Optional[AgentAction]:
        """行动实现
        
        Returns:
            Optional[AgentAction]: 智能体动作
        """
        # 检查是否有当前子任务
        if not self.current_subtask_id or not self.context:
            return None
        
        # 根据当前阶段执行相应的操作
        if self.current_phase == ExecutionPhase.PREPARATION:
            return self._perform_preparation()
        elif self.current_phase == ExecutionPhase.EXECUTION:
            return self._perform_execution()
        elif self.current_phase == ExecutionPhase.VERIFICATION:
            return self._perform_verification()
        elif self.current_phase == ExecutionPhase.REPORTING:
            return self._perform_reporting()
        else:
            logger.warning(f"Execution agent {self.id} in unknown phase: {self.current_phase}")
            return None
    
    def _perform_preparation(self) -> AgentAction:
        """执行准备阶段
        
        Returns:
            AgentAction: 智能体动作
        """
        # 获取子任务信息
        subtask_data = self.context.get_memory("current_subtask", {})
        task_id = subtask_data.get("task_id", "")
        subtask_id = subtask_data.get("id", "")
        subtask_description = subtask_data.get("description", "")
        parameters = subtask_data.get("parameters", {})
        
        # 检查是否已有资源分配
        resource_allocation = self.context.get_memory("resource_allocation", None)
        if resource_allocation:
            # 已有资源分配，进入执行阶段
            self.current_phase = ExecutionPhase.EXECUTION
            self.context.update_memory("execution_phase", self.current_phase.value)
            
            logger.info(f"Execution agent {self.id} moving to execution phase for subtask: {subtask_id}")
            return self._perform_execution()
        
        # 准备可用工具列表
        available_tools = self.tool_registry.list_tools()
        available_tools_text = "\n".join([
            f"{i+1}. {tool['name']}: {tool['description']}" 
            for i, tool in enumerate(available_tools)
        ])
        
        # 准备提示词
        prompt = self.prompt_templates.get("task_preparation", "")
        prompt = prompt.format(
            task_description=f"Task ID: {task_id}",
            subtask_description=subtask_description,
            parameters=json.dumps(parameters, indent=2),
            available_tools=available_tools_text
        )
        
        # 创建动作请求资源分配
        action = AgentAction(
            agent_id=self.id,
            action_type="request_resources",
            parameters={
                "task_id": task_id,
                "subtask_id": subtask_id,
                "required_skills": subtask_data.get("required_skills", []),
                "estimated_duration": subtask_data.get("estimated_duration", 0.0),
                "resource_requirements": {
                    "cpu": 1.0,  # 默认CPU需求
                    "memory": 512.0,  # 默认内存需求（MB）
                    "gpu": 0.0  # 默认GPU需求
                }
            }
        )
        
        logger.info(f"Execution agent {self.id} requesting resources for subtask: {subtask_id}")
        return action
    
    def _perform_execution(self) -> AgentAction:
        """执行执行阶段
        
        Returns:
            AgentAction: 智能体动作
        """
        # 获取子任务信息
        subtask_data = self.context.get_memory("current_subtask", {})
        task_id = subtask_data.get("task_id", "")
        subtask_id = subtask_data.get("id", "")
        subtask_description = subtask_data.get("description", "")
        parameters = subtask_data.get("parameters", {})
        task_type = subtask_data.get("type", TaskType.GENERAL.value)
        
        # 根据任务类型选择合适的工具
        tool_name = None
        tool_params = {}
        
        if task_type == TaskType.DATA_PROCESSING.value:
            # 数据处理任务
            if "filter" in subtask_description.lower():
                tool_name = "data_filter"
                tool_params = {
                    "data": parameters.get("data", []),
                    "condition": parameters.get("condition", {})
                }
            elif "transform" in subtask_description.lower():
                tool_name = "data_transform"
                tool_params = {
                    "data": parameters.get("data", {}),
                    "format": parameters.get("format", "json")
                }
        
        elif task_type == TaskType.INFORMATION_RETRIEVAL.value:
            # 信息检索任务
            tool_name = "search_information"
            tool_params = {
                "query": parameters.get("query", ""),
                "sources": parameters.get("sources", [])
            }
        
        elif task_type == TaskType.DECISION_MAKING.value:
            # 决策任务
            tool_name = "make_decision"
            tool_params = {
                "data": parameters.get("data", {}),
                "rules": parameters.get("rules", [])
            }
        
        elif task_type == TaskType.MODEL_INFERENCE.value:
            # 模型推理任务
            tool_name = "model_inference"
            tool_params = {
                "model_name": parameters.get("model_name", ""),
                "inputs": parameters.get("inputs", {})
            }
        
        # 如果没有找到合适的工具，使用LLM进行处理
        if not tool_name:
            # 准备可用工具列表
            available_tools = self.tool_registry.list_tools()
            available_tools_text = "\n".join([
                f"{i+1}. {tool['name']}: {tool['description']}" 
                for i, tool in enumerate(available_tools)
            ])
            
            # 准备提示词
            prompt = self.prompt_templates.get("tool_selection", "")
            prompt = prompt.format(
                task_description=f"Task ID: {task_id}",
                subtask_description=subtask_description,
                available_tools=available_tools_text
            )
            
            # 创建动作
            action = AgentAction(
                agent_id=self.id,
                action_type="llm_query",
                parameters={
                    "prompt": prompt,
                    "model": self.llm_config.get("model", "gpt-4"),
                    "temperature": self.llm_config.get("temperature", 0.2),
                    "max_tokens": self.llm_config.get("max_tokens", 1000),
                    "phase": ExecutionPhase.EXECUTION.value,
                    "subphase": "tool_selection"
                }
            )
            
            logger.info(f"Execution agent {self.id} selecting tool for subtask: {subtask_id}")
            return action
        
        # 使用选定的工具执行任务
        try:
            # 获取工具函数
            tool_func = self.tool_registry.get_tool(tool_name)
            if not tool_func:
                raise ValueError(f"Tool not found: {tool_name}")
            
            # 执行工具函数
            start_time = time.time()
            result = tool_func(**tool_params)
            end_time = time.time()
            
            # 更新执行结果
            execution_result = self.execution_results.get(subtask_id)
            if execution_result:
                execution_result.mark_complete(
                    success=True,
                    output={"result": result},
                    error=None
                )
                execution_result.resource_usage = {
                    "cpu_time": end_time - start_time
                }
            
            # 更新阶段
            self.current_phase = ExecutionPhase.VERIFICATION
            if self.context:
                self.context.update_memory("execution_phase", self.current_phase.value)
                self.context.update_memory("execution_result", {
                    "tool": tool_name,
                    "params": tool_params,
                    "result": result,
                    "duration": end_time - start_time
                })
            
            logger.info(f"Execution agent {self.id} executed tool {tool_name} for subtask: {subtask_id}")
            return self._perform_verification()
        
        except Exception as e:
            # 执行失败
            error_message = str(e)
            
            # 更新执行结果
            execution_result = self.execution_results.get(subtask_id)
            if execution_result:
                execution_result.mark_complete(
                    success=False,
                    output={},
                    error=error_message
                )
            
            # 创建动作报告错误
            action = AgentAction(
                agent_id=self.id,
                action_type="report_error",
                parameters={
                    "task_id": task_id,
                    "subtask_id": subtask_id,
                    "error": error_message,
                    "tool": tool_name,
                    "params": tool_params
                }
            )
            
            # 重置当前任务和阶段
            self.current_task_id = None
            self.current_subtask_id = None
            self.current_subtask = None
            self.current_phase = None
            
            logger.error(f"Execution agent {self.id} failed to execute tool {tool_name}: {error_message}")
            return action
    
    def _perform_verification(self) -> AgentAction:
        """执行验证阶段
        
        Returns:
            AgentAction: 智能体动作
        """
        # 获取子任务信息和执行结果
        subtask_data = self.context.get_memory("current_subtask", {})
        task_id = subtask_data.get("task_id", "")
        subtask_id = subtask_data.get("id", "")
        subtask_description = subtask_data.get("description", "")
        parameters = subtask_data.get("parameters", {})
        
        execution_data = self.context.get_memory("execution_result", {})
        result = execution_data.get("result")
        
        # 准备提示词
        prompt = self.prompt_templates.get("result_verification", "")
        prompt = prompt.format(
            task_description=f"Task ID: {task_id}",
            subtask_description=subtask_description,
            expected_outcome=parameters.get("expected_outcome", "Not specified"),
            actual_result=json.dumps(result, indent=2) if result else "No result"
        )
        
        # 创建动作
        action = AgentAction(
            agent_id=self.id,
            action_type="llm_query",
            parameters={
                "prompt": prompt,
                "model": self.llm_config.get("model", "gpt-4"),
                "temperature": self.llm_config.get("temperature", 0.2),
                "max_tokens": self.llm_config.get("max_tokens", 1000),
                "phase": ExecutionPhase.VERIFICATION.value
            }
        )
        
        logger.info(f"Execution agent {self.id} verifying result for subtask: {subtask_id}")
        return action
    
    def _perform_reporting(self) -> AgentAction:
        """执行报告阶段
        
        Returns:
            AgentAction: 智能体动作
        """
        # 获取子任务信息和执行结果
        subtask_data = self.context.get_memory("current_subtask", {})
        task_id = subtask_data.get("task_id", "")
        subtask_id = subtask_data.get("id", "")
        
        # 获取执行结果
        execution_result = self.execution_results.get(subtask_id)
        if not execution_result:
            logger.error(f"Execution agent {self.id} has no execution result for subtask: {subtask_id}")
            return None
        
        # 创建动作报告结果
        action = AgentAction(
            agent_id=self.id,
            action_type="report_result",
            parameters={
                "task_id": task_id,
                "subtask_id": subtask_id,
                "success": execution_result.success,
                "output": execution_result.output,
                "error": execution_result.error,
                "metrics": execution_result.metrics,
                "resource_usage": execution_result.resource_usage,
                "duration": execution_result.duration
            }
        )
        
        # 重置当前任务和阶段
        self.current_task_id = None
        self.current_subtask_id = None
        self.current_subtask = None
        self.current_phase = None
        
        logger.info(f"Execution agent {self.id} reported result for subtask: {subtask_id}")
        return action
    
    def _process_result_impl(self, result: AgentResult) -> None:
        """处理结果实现
        
        Args:
            result: 智能体结果
        """
        # 检查结果是否成功
        if not result.success:
            logger.error(f"Execution agent {self.id} received error: {result.error}")
            return
        
        # 获取动作类型和阶段
        action_type = result.data.get("action_type")
        phase = result.data.get("phase")
        
        # 处理LLM查询结果
        if action_type == "llm_query":
            if phase == ExecutionPhase.EXECUTION.value:
                self._process_tool_selection_result(result.data)
            elif phase == ExecutionPhase.VERIFICATION.value:
                self._process_verification_result(result.data)
    
    def _process_tool_selection_result(self, data: Dict[str, Any]) -> None:
        """处理工具选择结果
        
        Args:
            data: 结果数据
        """
        # 解析LLM响应
        response = data.get("response", "")
        subphase = data.get("subphase")
        
        if subphase == "tool_selection":
            # 尝试从响应中提取工具名称
            import re
            
            # 查找工具名称
            tool_match = re.search(r'tool:\s*([\w_]+)', response, re.IGNORECASE)
            if not tool_match:
                tool_match = re.search(r'select\s+([\w_]+)', response, re.IGNORECASE)
            
            if tool_match:
                tool_name = tool_match.group(1)
                
                # 获取子任务信息
                subtask_data = self.context.get_memory("current_subtask", {})
                parameters = subtask_data.get("parameters", {})
                
                # 设置工具参数
                tool_params = {}
                tool_description = self.tool_registry.get_description(tool_name)
                tool_parameters = self.tool_registry.get_parameters(tool_name)
                
                for param_name in tool_parameters:
                    if param_name in parameters:
                        tool_params[param_name] = parameters[param_name]
                
                # 将工具信息存储在上下文中
                if self.context:
                    self.context.update_memory("selected_tool", {
                        "name": tool_name,
                        "description": tool_description,
                        "parameters": tool_params
                    })
                
                logger.info(f"Execution agent {self.id} selected tool: {tool_name}")
            
            # 重新执行执行阶段
            self._act_impl()
    
    def _process_verification_result(self, data: Dict[str, Any]) -> None:
        """处理验证结果
        
        Args:
            data: 结果数据
        """
        # 解析LLM响应
        response = data.get("response", "")
        
        # 尝试从响应中提取验证结果
        import re
        
        # 查找验证结果
        success_match = re.search(r'(pass|success|meet|satisf|correct|valid)', response, re.IGNORECASE)
        failure_match = re.search(r'(fail|error|incorrect|invalid|not meet|not satisf)', response, re.IGNORECASE)
        
        # 获取子任务信息
        subtask_data = self.context.get_memory("current_subtask", {})
        subtask_id = subtask_data.get("id", "")
        
        # 获取执行结果
        execution_result = self.execution_results.get(subtask_id)
        if execution_result:
            # 更新验证结果
            if success_match and not failure_match:
                execution_result.success = True
            elif failure_match:
                execution_result.success = False
                execution_result.error = "Verification failed: " + response
            
            # 将验证结果存储在上下文中
            if self.context:
                self.context.update_memory("verification_result", {
                    "success": execution_result.success,
                    "feedback": response
                })
        
        # 更新阶段
        self.current_phase = ExecutionPhase.REPORTING
        if self.context:
            self.context.update_memory("execution_phase", self.current_phase.value)
        
        logger.info(f"Execution agent {self.id} verified result for subtask: {subtask_id}, success: {execution_result.success if execution_result else False}")
    
    def _shutdown_impl(self) -> None:
        """关闭实现"""
        # 清理资源
        self.current_task_id = None
        self.current_subtask_id = None
        self.current_subtask = None
        self.current_phase = None
        self.execution_results = {}
        
        logger.info(f"Execution agent {self.id} shut down")
    
    # 工具函数实现
    def _tool_data_filter(self, data: List[Dict[str, Any]], condition: Dict[str, Any]) -> List[Dict[str, Any]]:
        """数据过滤工具
        
        Args:
            data: 数据集
            condition: 过滤条件
            
        Returns:
            List[Dict[str, Any]]: 过滤后的数据
        """
        if not data or not condition:
            return data
        
        filtered_data = []
        for item in data:
            match = True
            for key, value in condition.items():
                if key not in item or item[key] != value:
                    match = False
                    break
            
            if match:
                filtered_data.append(item)
        
        return filtered_data
    
    def _tool_data_transform(self, data: Any, format: str) -> Any:
        """数据转换工具
        
        Args:
            data: 数据
            format: 目标格式
            
        Returns:
            Any: 转换后的数据
        """
        if format == "json":
            if isinstance(data, str):
                try:
                    return json.loads(data)
                except json.JSONDecodeError:
                    return {"error": "Invalid JSON string"}
            else:
                return data
        elif format == "string":
            if isinstance(data, (dict, list)):
                return json.dumps(data)
            else:
                return str(data)
        elif format == "list":
            if isinstance(data, dict):
                return list(data.items())
            elif isinstance(data, str):
                return list(data)
            else:
                return list(data)
        else:
            return data
    
    def _tool_search_information(self, query: str, sources: List[str]) -> Dict[str, Any]:
        """信息搜索工具
        
        Args:
            query: 搜索查询
            sources: 搜索源
            
        Returns:
            Dict[str, Any]: 搜索结果
        """
        # 模拟搜索结果
        return {
            "query": query,
            "sources": sources,
            "results": [
                {"title": "Mock Result 1", "content": "This is a mock search result."},
                {"title": "Mock Result 2", "content": "This is another mock search result."}
            ]
        }
    
    def _tool_make_decision(self, data: Dict[str, Any], rules: List[Dict[str, Any]]) -> Dict[str, Any]:
        """决策工具
        
        Args:
            data: 决策数据
            rules: 决策规则
            
        Returns:
            Dict[str, Any]: 决策结果
        """
        if not rules:
            return {"decision": "no_decision", "reason": "No rules provided"}
        
        for rule in rules:
            condition = rule.get("condition", {})
            action = rule.get("action", "")
            
            match = True
            for key, value in condition.items():
                if key not in data or data[key] != value:
                    match = False
                    break
            
            if match:
                return {
                    "decision": action,
                    "rule_matched": rule,
                    "data": data
                }
        
        return {"decision": "no_match", "reason": "No matching rule found"}
    
    def _tool_model_inference(self, model_name: str, inputs: Dict[str, Any]) -> Dict[str, Any]:
        """模型推理工具
        
        Args:
            model_name: 模型名称
            inputs: 输入数据
            
        Returns:
            Dict[str, Any]: 推理结果
        """
        # 模拟模型推理结果
        return {
            "model": model_name,
            "inputs": inputs,
            "outputs": {"prediction": "Mock prediction", "confidence": 0.95},
            "latency": 0.1
        }


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
        
        if "tool selection" in prompt.lower():
            return self._mock_tool_selection()
        elif "verification" in prompt.lower():
            return self._mock_verification()
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
    
    def _mock_tool_selection(self) -> Dict[str, Any]:
        """模拟工具选择响应
        
        Returns:
            Dict[str, Any]: 响应
        """
        return {
            "choices": [
                {
                    "message": {
                        "content": "Based on the task description, I recommend using the data_filter tool. This tool is designed to filter data based on specific conditions, which aligns perfectly with the current subtask."
                    }
                }
            ]
        }
    
    def _mock_verification(self) -> Dict[str, Any]:
        """模拟验证响应
        
        Returns:
            Dict[str, Any]: 响应
        """
        return {
            "choices": [
                {
                    "message": {
                        "content": "The execution result meets the requirements. The filtered data contains only the items that match the specified condition, which is exactly what was expected."
                    }
                }
            ]
        }