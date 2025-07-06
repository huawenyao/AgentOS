"""反思智能体模块

该模块实现了反思智能体，负责集体决策纠错机制，
包括错误分析、任务重规划和数据补全请求等功能。
"""

import json
import time
from typing import Dict, List, Any, Optional, Set, Tuple, Union
from enum import Enum, auto
from datetime import datetime
from pydantic import BaseModel, Field
from loguru import logger

from efiagent.agent.base_agent import BaseAgent, AgentType
from efiagent.core.memory import MemoryManager, MemoryLevel, MemoryType
from efiagent.core.communication import (
    Message, MessageType, MessagePriority, MessageBroker
)
from efiagent.core.task_dag import TaskNode, TaskStatus, TaskDAG
from efiagent.core.ontology import DynamicOntology
from efiagent.core.consensus import ConsensusVerifier


class ErrorType(Enum):
    """错误类型枚举"""
    LOGIC_ERROR = "logic_error"  # 逻辑错误
    DATA_ERROR = "data_error"    # 数据错误
    SEMANTIC_ERROR = "semantic_error"  # 语义错误
    RESOURCE_ERROR = "resource_error"  # 资源错误
    UNKNOWN_ERROR = "unknown_error"    # 未知错误


class ReviewResult(BaseModel):
    """审核结果模型"""
    task_id: str
    node_id: Optional[str] = None
    success: bool
    error_type: Optional[ErrorType] = None
    error_message: Optional[str] = None
    suggestions: List[str] = Field(default_factory=list)
    confidence: float = 1.0
    timestamp: datetime = Field(default_factory=datetime.now)


class ReviewAgent(BaseAgent):
    """反思智能体
    
    负责集体决策纠错机制，包括错误分析、任务重规划和数据补全请求
    """
    def __init__(self, agent_id: str, config: Dict[str, Any] = None):
        """初始化反思智能体
        
        Args:
            agent_id: 智能体ID
            config: 配置字典
        """
        super().__init__(agent_id, AgentType.REVIEWER)
        self.config = config or {}
        
        # 初始化记忆管理器
        self.memory_manager = MemoryManager(self.config.get("memory", {}))
        
        # 初始化消息代理
        self.message_broker = MessageBroker()
        self.message_broker.subscribe(MessageType.REVIEW_REQUEST, self._handle_review_request)
        self.message_broker.subscribe(MessageType.TASK_COMPLETED, self._handle_task_completed)
        self.message_broker.subscribe(MessageType.TASK_FAILED, self._handle_task_failed)
        
        # 初始化动态本体库（用于知识映射）
        self.ontology = DynamicOntology()
        
        # 初始化共识验证器
        self.consensus_verifier = ConsensusVerifier()
        
        # 错误模式库（用于识别常见错误模式）
        self.error_patterns = self._load_error_patterns()
        
        # 任务DAG缓存
        self.task_dag_cache = {}
        
        # 知识蒸馏模型（用于轻量级校验）
        self.distilled_model = self._load_distilled_model()
        
        logger.info(f"反思智能体 {agent_id} 初始化完成")
    
    def observe(self, observation: Dict[str, Any]) -> Dict[str, Any]:
        """观察环境
        
        处理来自环境的观察，更新内部状态
        
        Args:
            observation: 观察字典
            
        Returns:
            Dict[str, Any]: 处理后的观察
        """
        # 更新任务DAG缓存
        if "task_dag" in observation and isinstance(observation["task_dag"], dict):
            task_id = observation["task_dag"].get("id")
            if task_id:
                self.task_dag_cache[task_id] = TaskDAG.from_dict(observation["task_dag"])
        
        # 更新错误模式库
        if "error_patterns" in observation and isinstance(observation["error_patterns"], list):
            for pattern in observation["error_patterns"]:
                if self._is_valid_error_pattern(pattern):
                    self.error_patterns.append(pattern)
        
        return observation
    
    def act(self, action_type: str, params: Dict[str, Any] = None) -> Dict[str, Any]:
        """执行动作
        
        Args:
            action_type: 动作类型
            params: 动作参数
            
        Returns:
            Dict[str, Any]: 动作结果
        """
        params = params or {}
        
        if action_type == "review_task":
            return self._review_task(params)
        elif action_type == "analyze_error":
            return self._analyze_error(params)
        elif action_type == "replan_task":
            return self._replan_task(params)
        elif action_type == "request_data":
            return self._request_data(params)
        elif action_type == "distill_knowledge":
            return self._distill_knowledge(params)
        else:
            logger.warning(f"未知动作类型: {action_type}")
            return {"success": False, "error": f"未知动作类型: {action_type}"}
    
    def _review_task(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """审核任务
        
        Args:
            params: 参数字典，包含task_id、result等
            
        Returns:
            Dict[str, Any]: 审核结果
        """
        try:
            task_id = params.get("task_id")
            node_id = params.get("node_id")
            result = params.get("result")
            context = params.get("context", {})
            
            if not task_id or result is None:
                return {"success": False, "error": "缺少必要参数: task_id, result"}
            
            # 获取任务DAG
            task_dag = self.task_dag_cache.get(task_id)
            if not task_dag and "task_dag" in context:
                task_dag = TaskDAG.from_dict(context["task_dag"])
                self.task_dag_cache[task_id] = task_dag
            
            # 使用轻量级模型进行初步校验
            preliminary_check = self._quick_validation(task_id, node_id, result, context)
            
            # 如果初步校验通过且置信度高，则直接返回成功
            if preliminary_check["success"] and preliminary_check["confidence"] > 0.9:
                review_result = ReviewResult(
                    task_id=task_id,
                    node_id=node_id,
                    success=True,
                    confidence=preliminary_check["confidence"]
                )
                
                # 存储审核结果
                self._store_review_result(review_result)
                
                return {
                    "success": True,
                    "review_result": review_result.dict()
                }
            
            # 否则进行深入分析
            error_analysis = self._analyze_error({
                "task_id": task_id,
                "node_id": node_id,
                "result": result,
                "context": context
            })
            
            # 创建审核结果
            review_result = ReviewResult(
                task_id=task_id,
                node_id=node_id,
                success=not error_analysis["error_detected"],
                error_type=ErrorType(error_analysis["error_type"]) if error_analysis["error_type"] else None,
                error_message=error_analysis["error_message"],
                suggestions=error_analysis["suggestions"],
                confidence=error_analysis["confidence"]
            )
            
            # 存储审核结果
            self._store_review_result(review_result)
            
            # 如果检测到错误，启动纠错流程
            if error_analysis["error_detected"]:
                self._start_correction_workflow(task_id, node_id, review_result, context)
            
            return {
                "success": True,
                "review_result": review_result.dict()
            }
        except Exception as e:
            logger.error(f"审核任务失败: {e}")
            return {"success": False, "error": str(e)}
    
    def _analyze_error(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """分析错误
        
        Args:
            params: 参数字典，包含task_id、result等
            
        Returns:
            Dict[str, Any]: 错误分析结果
        """
        try:
            task_id = params.get("task_id")
            node_id = params.get("node_id")
            result = params.get("result")
            context = params.get("context", {})
            
            if not task_id or result is None:
                return {
                    "success": False,
                    "error": "缺少必要参数: task_id, result",
                    "error_detected": False
                }
            
            # 初始化分析结果
            analysis_result = {
                "success": True,
                "error_detected": False,
                "error_type": None,
                "error_message": None,
                "suggestions": [],
                "confidence": 0.0
            }
            
            # 检查结果是否包含错误信息
            if isinstance(result, dict) and "error" in result:
                analysis_result["error_detected"] = True
                analysis_result["error_message"] = result["error"]
                
                # 匹配错误模式
                error_pattern_match = self._match_error_pattern(result["error"])
                if error_pattern_match:
                    analysis_result["error_type"] = error_pattern_match["type"]
                    analysis_result["suggestions"] = error_pattern_match["suggestions"]
                    analysis_result["confidence"] = error_pattern_match["confidence"]
                else:
                    # 默认为未知错误
                    analysis_result["error_type"] = ErrorType.UNKNOWN_ERROR.value
                    analysis_result["confidence"] = 0.5
            
            # 检查结果是否符合预期格式
            elif "expected_schema" in context:
                expected_schema = context["expected_schema"]
                validation_result = self._validate_schema(result, expected_schema)
                
                if not validation_result["valid"]:
                    analysis_result["error_detected"] = True
                    analysis_result["error_type"] = ErrorType.DATA_ERROR.value
                    analysis_result["error_message"] = validation_result["error"]
                    analysis_result["suggestions"] = [
                        "检查数据格式是否符合预期",
                        "确保所有必要字段都已提供",
                        "验证数据类型是否正确"
                    ]
                    analysis_result["confidence"] = 0.8
            
            # 检查任务上下文中的约束条件
            elif "constraints" in context and isinstance(context["constraints"], list):
                for constraint in context["constraints"]:
                    if not self._check_constraint(result, constraint):
                        analysis_result["error_detected"] = True
                        analysis_result["error_type"] = ErrorType.LOGIC_ERROR.value
                        analysis_result["error_message"] = f"违反约束条件: {constraint['description']}"
                        analysis_result["suggestions"] = constraint.get("suggestions", [])
                        analysis_result["confidence"] = 0.7
                        break
            
            # 如果没有检测到错误，则认为成功
            if not analysis_result["error_detected"]:
                analysis_result["confidence"] = 0.9
            
            return analysis_result
        except Exception as e:
            logger.error(f"分析错误失败: {e}")
            return {
                "success": False,
                "error": str(e),
                "error_detected": True,
                "error_type": ErrorType.UNKNOWN_ERROR.value,
                "error_message": f"分析过程发生异常: {str(e)}",
                "suggestions": ["检查系统日志以获取更多信息"],
                "confidence": 0.3
            }
    
    def _replan_task(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """重新规划任务
        
        Args:
            params: 参数字典，包含task_id、error_type等
            
        Returns:
            Dict[str, Any]: 重规划结果
        """
        try:
            task_id = params.get("task_id")
            error_type = params.get("error_type")
            error_message = params.get("error_message")
            node_id = params.get("node_id")
            
            if not task_id or not error_type:
                return {"success": False, "error": "缺少必要参数: task_id, error_type"}
            
            # 获取任务DAG
            task_dag = self.task_dag_cache.get(task_id)
            if not task_dag:
                return {"success": False, "error": f"找不到任务DAG: {task_id}"}
            
            # 创建新的任务DAG副本
            new_task_dag = task_dag.clone()
            
            # 根据错误类型进行不同的重规划策略
            if error_type == ErrorType.LOGIC_ERROR.value:
                # 对于逻辑错误，修改出错节点及其后续节点
                if node_id and node_id in new_task_dag.nodes:
                    # 标记节点为需要重新执行
                    node = new_task_dag.nodes[node_id]
                    node.status = TaskStatus.PENDING
                    node.metadata["error_history"] = node.metadata.get("error_history", []) + [{
                        "error_type": error_type,
                        "error_message": error_message,
                        "timestamp": datetime.now().isoformat()
                    }]
                    
                    # 添加校验节点
                    validation_node_id = f"validation_{node_id}_{int(time.time())}"
                    new_task_dag.add_node(
                        node_id=validation_node_id,
                        name=f"验证 {node.name}",
                        agent_type=AgentType.REVIEWER.value,
                        dependencies=[node_id],
                        metadata={
                            "is_validation": True,
                            "original_node_id": node_id
                        }
                    )
                    
                    # 更新后续节点的依赖关系
                    for successor_id in new_task_dag.get_successors(node_id):
                        if successor_id != validation_node_id:
                            successor = new_task_dag.nodes[successor_id]
                            # 添加对验证节点的依赖
                            if node_id in successor.dependencies:
                                successor.dependencies.remove(node_id)
                                successor.dependencies.append(validation_node_id)
            
            elif error_type == ErrorType.DATA_ERROR.value:
                # 对于数据错误，添加数据补全节点
                if node_id and node_id in new_task_dag.nodes:
                    # 创建数据补全节点
                    data_node_id = f"data_completion_{int(time.time())}"
                    new_task_dag.add_node(
                        node_id=data_node_id,
                        name="数据补全",
                        agent_type=AgentType.DATA.value,  # 数据智能体
                        dependencies=[],
                        metadata={
                            "error_context": {
                                "error_type": error_type,
                                "error_message": error_message,
                                "original_node_id": node_id
                            }
                        }
                    )
                    
                    # 更新出错节点的依赖
                    node = new_task_dag.nodes[node_id]
                    node.status = TaskStatus.PENDING
                    node.dependencies.append(data_node_id)
                    node.metadata["error_history"] = node.metadata.get("error_history", []) + [{
                        "error_type": error_type,
                        "error_message": error_message,
                        "timestamp": datetime.now().isoformat()
                    }]
            
            else:  # 其他类型错误
                # 添加通用错误处理节点
                error_handler_id = f"error_handler_{int(time.time())}"
                new_task_dag.add_node(
                    node_id=error_handler_id,
                    name="错误处理",
                    agent_type=AgentType.EXECUTOR.value,
                    dependencies=[],
                    metadata={
                        "error_context": {
                            "error_type": error_type,
                            "error_message": error_message,
                            "original_node_id": node_id
                        }
                    }
                )
                
                if node_id and node_id in new_task_dag.nodes:
                    # 更新出错节点
                    node = new_task_dag.nodes[node_id]
                    node.status = TaskStatus.PENDING
                    node.dependencies.append(error_handler_id)
                    node.metadata["error_history"] = node.metadata.get("error_history", []) + [{
                        "error_type": error_type,
                        "error_message": error_message,
                        "timestamp": datetime.now().isoformat()
                    }]
            
            # 更新任务DAG缓存
            self.task_dag_cache[task_id] = new_task_dag
            
            # 发送任务重规划消息
            self._send_replan_message(task_id, new_task_dag)
            
            return {
                "success": True,
                "task_id": task_id,
                "new_task_dag": new_task_dag.to_dict()
            }
        except Exception as e:
            logger.error(f"重新规划任务失败: {e}")
            return {"success": False, "error": str(e)}
    
    def _request_data(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """请求数据补全
        
        Args:
            params: 参数字典，包含task_id、data_requirements等
            
        Returns:
            Dict[str, Any]: 请求结果
        """
        try:
            task_id = params.get("task_id")
            node_id = params.get("node_id")
            data_requirements = params.get("data_requirements", [])
            context = params.get("context", {})
            
            if not task_id or not data_requirements:
                return {"success": False, "error": "缺少必要参数: task_id, data_requirements"}
            
            # 创建数据请求消息
            request_data = {
                "task_id": task_id,
                "node_id": node_id,
                "data_requirements": data_requirements,
                "context": context,
                "requester_id": self.id,
                "timestamp": datetime.now().isoformat()
            }
            
            # 发送数据请求消息
            request_id = self._send_data_request(request_data)
            
            return {
                "success": True,
                "request_id": request_id,
                "message": "数据请求已发送"
            }
        except Exception as e:
            logger.error(f"请求数据补全失败: {e}")
            return {"success": False, "error": str(e)}
    
    def _distill_knowledge(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """知识蒸馏
        
        从多个智能体的决策模式中提取知识，训练轻量级校验模型
        
        Args:
            params: 参数字典，包含agent_ids、time_range等
            
        Returns:
            Dict[str, Any]: 蒸馏结果
        """
        try:
            agent_ids = params.get("agent_ids", [])
            time_range = params.get("time_range", {})  # {"start": "ISO时间", "end": "ISO时间"}
            domains = params.get("domains", [])  # 领域限制
            
            # 收集决策数据
            decision_data = self._collect_decision_data(agent_ids, time_range, domains)
            
            if not decision_data:
                return {"success": False, "error": "没有找到符合条件的决策数据"}
            
            # 训练轻量级模型
            model_info = self._train_distilled_model(decision_data)
            
            # 更新模型
            self.distilled_model = model_info["model"]
            
            # 存储模型元数据
            model_metadata = {
                "id": model_info["id"],
                "version": model_info["version"],
                "created_at": datetime.now().isoformat(),
                "agent_count": len(agent_ids),
                "decision_count": len(decision_data),
                "domains": domains,
                "metrics": model_info["metrics"]
            }
            
            self.memory_manager.set(
                key=f"distilled_model:{model_info['id']}",
                value=model_metadata,
                level=MemoryLevel.LONG_TERM,
                type=MemoryType.MODEL_METADATA,
                agent_id=self.id
            )
            
            return {
                "success": True,
                "model_id": model_info["id"],
                "metrics": model_info["metrics"],
                "message": "知识蒸馏完成"
            }
        except Exception as e:
            logger.error(f"知识蒸馏失败: {e}")
            return {"success": False, "error": str(e)}
    
    def _handle_review_request(self, message: Message) -> None:
        """处理审核请求消息
        
        Args:
            message: 消息对象
        """
        try:
            data = message.payload.content
            if not isinstance(data, dict):
                logger.warning(f"无效的审核请求消息: {data}")
                return
            
            task_id = data.get("task_id")
            node_id = data.get("node_id")
            result = data.get("result")
            context = data.get("context", {})
            
            if not task_id or result is None:
                logger.warning(f"审核请求消息缺少必要参数: {data}")
                return
            
            # 执行审核
            review_result = self._review_task({
                "task_id": task_id,
                "node_id": node_id,
                "result": result,
                "context": context
            })
            
            # 发送审核响应
            self._send_review_response(message.header.sender_id, review_result)
        except Exception as e:
            logger.error(f"处理审核请求消息失败: {e}")
    
    def _handle_task_completed(self, message: Message) -> None:
        """处理任务完成消息
        
        Args:
            message: 消息对象
        """
        try:
            data = message.payload.content
            if not isinstance(data, dict):
                logger.warning(f"无效的任务完成消息: {data}")
                return
            
            task_id = data.get("task_id")
            node_id = data.get("node_id")
            result = data.get("result")
            
            if not task_id or not node_id:
                logger.warning(f"任务完成消息缺少必要参数: {data}")
                return
            
            # 更新任务DAG
            if task_id in self.task_dag_cache:
                task_dag = self.task_dag_cache[task_id]
                if node_id in task_dag.nodes:
                    node = task_dag.nodes[node_id]
                    node.status = TaskStatus.COMPLETED
                    node.result = result
                    node.completed_at = datetime.now()
            
            # 对于长流程任务（>10步），进行额外验证
            if task_id in self.task_dag_cache:
                task_dag = self.task_dag_cache[task_id]
                if len(task_dag.nodes) > 10:
                    # 检查是否需要进行审核
                    if self._should_review_node(task_id, node_id):
                        # 执行审核
                        self._review_task({
                            "task_id": task_id,
                            "node_id": node_id,
                            "result": result,
                            "context": {"task_dag": task_dag.to_dict()}
                        })
        except Exception as e:
            logger.error(f"处理任务完成消息失败: {e}")
    
    def _handle_task_failed(self, message: Message) -> None:
        """处理任务失败消息
        
        Args:
            message: 消息对象
        """
        try:
            data = message.payload.content
            if not isinstance(data, dict):
                logger.warning(f"无效的任务失败消息: {data}")
                return
            
            task_id = data.get("task_id")
            node_id = data.get("node_id")
            error = data.get("error")
            
            if not task_id or not node_id:
                logger.warning(f"任务失败消息缺少必要参数: {data}")
                return
            
            # 更新任务DAG
            if task_id in self.task_dag_cache:
                task_dag = self.task_dag_cache[task_id]
                if node_id in task_dag.nodes:
                    node = task_dag.nodes[node_id]
                    node.status = TaskStatus.FAILED
                    node.error = error
                    node.completed_at = datetime.now()
            
            # 分析错误
            error_analysis = self._analyze_error({
                "task_id": task_id,
                "node_id": node_id,
                "result": {"error": error},
                "context": {"task_dag": task_dag.to_dict() if task_id in self.task_dag_cache else {}}
            })
            
            # 创建审核结果
            review_result = ReviewResult(
                task_id=task_id,
                node_id=node_id,
                success=False,
                error_type=ErrorType(error_analysis["error_type"]) if error_analysis["error_type"] else ErrorType.UNKNOWN_ERROR,
                error_message=error,
                suggestions=error_analysis["suggestions"],
                confidence=error_analysis["confidence"]
            )
            
            # 存储审核结果
            self._store_review_result(review_result)
            
            # 启动纠错流程
            self._start_correction_workflow(task_id, node_id, review_result, {"task_dag": task_dag.to_dict() if task_id in self.task_dag_cache else {}})
        except Exception as e:
            logger.error(f"处理任务失败消息失败: {e}")
    
    def _load_error_patterns(self) -> List[Dict[str, Any]]:
        """加载错误模式库
        
        Returns:
            List[Dict[str, Any]]: 错误模式列表
        """
        # 从长期记忆中加载错误模式
        patterns = []
        
        # 添加一些默认的错误模式
        patterns.extend([
            {
                "pattern": ".*资源不足.*",
                "type": ErrorType.RESOURCE_ERROR.value,
                "suggestions": [
                    "检查资源分配是否合理",
                    "考虑降低资源需求",
                    "等待资源释放后重试"
                ],
                "confidence": 0.8
            },
            {
                "pattern": ".*超时.*|.*timeout.*",
                "type": ErrorType.RESOURCE_ERROR.value,
                "suggestions": [
                    "检查网络连接",
                    "增加超时时间",
                    "优化任务执行效率"
                ],
                "confidence": 0.7
            },
            {
                "pattern": ".*格式错误.*|.*invalid format.*|.*schema.*",
                "type": ErrorType.DATA_ERROR.value,
                "suggestions": [
                    "检查数据格式是否符合预期",
                    "验证输入数据的完整性",
                    "确保数据类型正确"
                ],
                "confidence": 0.8
            },
            {
                "pattern": ".*逻辑冲突.*|.*冲突.*|.*conflict.*",
                "type": ErrorType.LOGIC_ERROR.value,
                "suggestions": [
                    "检查业务逻辑是否存在矛盾",
                    "验证约束条件是否一致",
                    "确保状态转换合理"
                ],
                "confidence": 0.7
            },
            {
                "pattern": ".*语义不明确.*|.*歧义.*|.*ambiguous.*",
                "type": ErrorType.SEMANTIC_ERROR.value,
                "suggestions": [
                    "明确任务目标和要求",
                    "使用本体库解析术语",
                    "请求更详细的任务描述"
                ],
                "confidence": 0.6
            }
        ])
        
        return patterns
    
    def _load_distilled_model(self) -> Any:
        """加载知识蒸馏模型
        
        Returns:
            Any: 知识蒸馏模型
        """
        # 这里应该实现模型加载逻辑
        # 简化实现，返回一个空字典
        return {"version": "0.1", "rules": []}
    
    def _is_valid_error_pattern(self, pattern: Dict[str, Any]) -> bool:
        """检查错误模式是否有效
        
        Args:
            pattern: 错误模式字典
            
        Returns:
            bool: 是否有效
        """
        required_fields = ["pattern", "type", "suggestions"]
        return all(field in pattern for field in required_fields)
    
    def _match_error_pattern(self, error_message: str) -> Optional[Dict[str, Any]]:
        """匹配错误模式
        
        Args:
            error_message: 错误消息
            
        Returns:
            Optional[Dict[str, Any]]: 匹配的错误模式，如果没有匹配则返回None
        """
        import re
        
        for pattern in self.error_patterns:
            if re.search(pattern["pattern"], error_message, re.IGNORECASE):
                return pattern
        
        return None
    
    def _validate_schema(self, data: Any, schema: Dict[str, Any]) -> Dict[str, Any]:
        """验证数据是否符合模式
        
        Args:
            data: 要验证的数据
            schema: 模式定义
            
        Returns:
            Dict[str, Any]: 验证结果
        """
        # 简化实现，实际应使用JSON Schema验证
        try:
            if "type" in schema:
                if schema["type"] == "object" and not isinstance(data, dict):
                    return {"valid": False, "error": f"期望对象类型，实际为 {type(data).__name__}"}
                elif schema["type"] == "array" and not isinstance(data, list):
                    return {"valid": False, "error": f"期望数组类型，实际为 {type(data).__name__}"}
                elif schema["type"] == "string" and not isinstance(data, str):
                    return {"valid": False, "error": f"期望字符串类型，实际为 {type(data).__name__}"}
                elif schema["type"] == "number" and not isinstance(data, (int, float)):
                    return {"valid": False, "error": f"期望数字类型，实际为 {type(data).__name__}"}
                elif schema["type"] == "boolean" and not isinstance(data, bool):
                    return {"valid": False, "error": f"期望布尔类型，实际为 {type(data).__name__}"}
            
            if "required" in schema and isinstance(schema["required"], list) and isinstance(data, dict):
                for field in schema["required"]:
                    if field not in data:
                        return {"valid": False, "error": f"缺少必要字段: {field}"}
            
            if "properties" in schema and isinstance(schema["properties"], dict) and isinstance(data, dict):
                for field, field_schema in schema["properties"].items():
                    if field in data:
                        field_validation = self._validate_schema(data[field], field_schema)
                        if not field_validation["valid"]:
                            return {"valid": False, "error": f"字段 {field} 验证失败: {field_validation['error']}"}
            
            return {"valid": True}
        except Exception as e:
            return {"valid": False, "error": f"验证过程发生异常: {str(e)}"}
    
    def _check_constraint(self, data: Any, constraint: Dict[str, Any]) -> bool:
        """检查数据是否满足约束条件
        
        Args:
            data: 要检查的数据
            constraint: 约束条件
            
        Returns:
            bool: 是否满足约束
        """
        # 简化实现，实际应根据约束类型进行不同的检查
        constraint_type = constraint.get("type")
        condition = constraint.get("condition")
        
        if not constraint_type or not condition:
            return True
        
        try:
            if constraint_type == "range":
                field = condition.get("field")
                min_value = condition.get("min")
                max_value = condition.get("max")
                
                if not field or not isinstance(data, dict) or field not in data:
                    return True
                
                value = data[field]
                if not isinstance(value, (int, float)):
                    return False
                
                if min_value is not None and value < min_value:
                    return False
                if max_value is not None and value > max_value:
                    return False
            
            elif constraint_type == "dependency":
                if_field = condition.get("if_field")
                if_value = condition.get("if_value")
                then_field = condition.get("then_field")
                
                if not if_field or not then_field or not isinstance(data, dict):
                    return True
                
                if if_field in data and data[if_field] == if_value and then_field not in data:
                    return False
            
            elif constraint_type == "custom" and "eval" in condition:
                # 注意：在实际系统中，应避免使用eval，这里仅作示例
                # 应该使用更安全的方式，如预定义的规则引擎
                return False  # 安全起见，禁用自定义约束
            
            return True
        except Exception:
            return False
    
    def _quick_validation(self, task_id: str, node_id: Optional[str], result: Any, context: Dict[str, Any]) -> Dict[str, Any]:
        """使用轻量级模型进行快速验证
        
        Args:
            task_id: 任务ID
            node_id: 节点ID
            result: 任务结果
            context: 上下文信息
            
        Returns:
            Dict[str, Any]: 验证结果
        """
        # 简化实现，实际应使用训练好的轻量级模型
        validation_result = {
            "success": True,
            "confidence": 0.5  # 默认中等置信度
        }
        
        # 检查结果是否包含错误信息
        if isinstance(result, dict) and "error" in result:
            validation_result["success"] = False
            validation_result["confidence"] = 0.8
            return validation_result
        
        # 检查任务历史
        if node_id and task_id in self.task_dag_cache:
            task_dag = self.task_dag_cache[task_id]
            if node_id in task_dag.nodes:
                node = task_dag.nodes[node_id]
                # 如果节点有错误历史，降低置信度
                if "error_history" in node.metadata and node.metadata["error_history"]:
                    validation_result["confidence"] = 0.6
        
        # 根据结果类型进行简单检查
        if isinstance(result, dict):
            # 检查是否有空值或无效值
            for key, value in result.items():
                if value is None or (isinstance(value, str) and not value.strip()):
                    validation_result["success"] = False
                    validation_result["confidence"] = 0.7
                    break
        
        return validation_result
    
    def _store_review_result(self, review_result: ReviewResult) -> None:
        """存储审核结果
        
        Args:
            review_result: 审核结果
        """
        try:
            # 存储到短期记忆
            self.memory_manager.set(
                key=f"review:{review_result.task_id}:{review_result.node_id}:{int(time.time())}",
                value=review_result.dict(),
                level=MemoryLevel.SHORT_TERM,
                type=MemoryType.REVIEW_RESULT,
                agent_id=self.id,
                ttl=3600 * 24  # 24小时过期
            )
            
            # 如果是失败的审核，也存储到长期记忆用于模式学习
            if not review_result.success and review_result.error_type:
                self.memory_manager.set(
                    key=f"error_pattern:{review_result.error_type.value}:{int(time.time())}",
                    value={
                        "review_result": review_result.dict(),
                        "error_type": review_result.error_type.value,
                        "error_message": review_result.error_message,
                        "suggestions": review_result.suggestions
                    },
                    level=MemoryLevel.LONG_TERM,
                    type=MemoryType.ERROR_PATTERN,
                    agent_id=self.id
                )
        except Exception as e:
            logger.error(f"存储审核结果失败: {e}")
    
    def _start_correction_workflow(self, task_id: str, node_id: Optional[str], review_result: ReviewResult, context: Dict[str, Any]) -> None:
        """启动纠错工作流
        
        Args:
            task_id: 任务ID
            node_id: 节点ID
            review_result: 审核结果
            context: 上下文信息
        """
        try:
            if not review_result.error_type:
                return
            
            # 根据错误类型选择不同的纠错策略
            if review_result.error_type == ErrorType.LOGIC_ERROR:
                # 对于逻辑错误，重新规划任务
                self._replan_task({
                    "task_id": task_id,
                    "error_type": review_result.error_type.value,
                    "error_message": review_result.error_message,
                    "node_id": node_id
                })
            
            elif review_result.error_type == ErrorType.DATA_ERROR:
                # 对于数据错误，请求数据补全
                data_requirements = self._extract_data_requirements(review_result, context)
                self._request_data({
                    "task_id": task_id,
                    "node_id": node_id,
                    "data_requirements": data_requirements,
                    "context": context
                })
            
            elif review_result.error_type == ErrorType.SEMANTIC_ERROR:
                # 对于语义错误，使用本体库进行术语映射
                self._clarify_semantics(task_id, node_id, review_result, context)
            
            else:  # 其他类型错误
                # 通用错误处理，重新规划任务
                self._replan_task({
                    "task_id": task_id,
                    "error_type": review_result.error_type.value,
                    "error_message": review_result.error_message,
                    "node_id": node_id
                })
        except Exception as e:
            logger.error(f"启动纠错工作流失败: {e}")
    
    def _extract_data_requirements(self, review_result: ReviewResult, context: Dict[str, Any]) -> List[Dict[str, Any]]:
        """提取数据需求
        
        Args:
            review_result: 审核结果
            context: 上下文信息
            
        Returns:
            List[Dict[str, Any]]: 数据需求列表
        """
        # 简化实现，实际应根据错误消息和上下文提取具体的数据需求
        data_requirements = []
        
        # 从错误消息中提取字段名
        if review_result.error_message:
            import re
            field_match = re.search(r"缺少必要字段: (\w+)", review_result.error_message)
            if field_match:
                field_name = field_match.group(1)
                data_requirements.append({
                    "field": field_name,
                    "description": f"需要提供 {field_name} 字段的值",
                    "required": True
                })
        
        # 如果没有具体字段，添加一个通用的数据需求
        if not data_requirements:
            data_requirements.append({
                "description": "需要补充数据以解决错误",
                "error_context": review_result.error_message,
                "required": True
            })
        
        return data_requirements
    
    def _clarify_semantics(self, task_id: str, node_id: Optional[str], review_result: ReviewResult, context: Dict[str, Any]) -> None:
        """澄清语义
        
        使用本体库进行术语映射，解决语义歧义
        
        Args:
            task_id: 任务ID
            node_id: 节点ID
            review_result: 审核结果
            context: 上下文信息
        """
        try:
            # 从错误消息中提取术语
            terms = self._extract_ambiguous_terms(review_result.error_message)
            
            if not terms:
                logger.warning(f"无法从错误消息中提取歧义术语: {review_result.error_message}")
                return
            
            # 获取任务领域
            domain = self._get_task_domain(task_id, context)
            
            # 使用本体库解析术语
            clarifications = {}
            for term in terms:
                mappings = self.ontology.get_term_mapping(term, domain)
                if mappings:
                    clarifications[term] = mappings
            
            if not clarifications:
                logger.warning(f"无法为术语提供映射: {terms}")
                return
            
            # 创建语义澄清消息
            clarification_data = {
                "task_id": task_id,
                "node_id": node_id,
                "error_message": review_result.error_message,
                "clarifications": clarifications,
                "requester_id": self.id,
                "timestamp": datetime.now().isoformat()
            }
            
            # 发送语义澄清消息
            self._send_semantic_clarification(clarification_data)
        except Exception as e:
            logger.error(f"澄清语义失败: {e}")
    
    def _extract_ambiguous_terms(self, error_message: str) -> List[str]:
        """从错误消息中提取歧义术语
        
        Args:
            error_message: 错误消息
            
        Returns:
            List[str]: 歧义术语列表
        """
        # 简化实现，实际应使用NLP技术提取关键术语
        import re
        
        terms = []
        
        # 查找引号中的术语
        term_matches = re.findall(r'["\'](\w+)["\']', error_message)
        terms.extend(term_matches)
        
        # 查找"术语X"模式
        term_matches = re.findall(r'术语[：:](\w+)', error_message)
        terms.extend(term_matches)
        
        # 查找"X含义不明确"模式
        term_matches = re.findall(r'(\w+)含义不明确', error_message)
        terms.extend(term_matches)
        
        return list(set(terms))  # 去重
    
    def _get_task_domain(self, task_id: str, context: Dict[str, Any]) -> Optional[str]:
        """获取任务领域
        
        Args:
            task_id: 任务ID
            context: 上下文信息
            
        Returns:
            Optional[str]: 任务领域
        """
        # 从上下文中获取领域信息
        if "domain" in context:
            return context["domain"]
        
        # 从任务DAG中获取领域信息
        if task_id in self.task_dag_cache:
            task_dag = self.task_dag_cache[task_id]
            if "domain" in task_dag.metadata:
                return task_dag.metadata["domain"]
        
        # 从任务ID推断领域
        if task_id.startswith("power_"):
            return "power_grid"
        elif task_id.startswith("traffic_"):
            return "traffic_control"
        
        return None
    
    def _send_review_response(self, receiver_id: str, review_result: Dict[str, Any]) -> None:
        """发送审核响应消息
        
        Args:
            receiver_id: 接收者ID
            review_result: 审核结果
        """
        try:
            self.message_broker.publish(
                Message.create(
                    sender_id=self.id,
                    receiver_id=receiver_id,
                    message_type=MessageType.REVIEW_RESPONSE,
                    priority=MessagePriority.HIGH,
                    content=review_result
                )
            )
        except Exception as e:
            logger.error(f"发送审核响应消息失败: {e}")
    
    def _send_replan_message(self, task_id: str, task_dag: TaskDAG) -> None:
        """发送任务重规划消息
        
        Args:
            task_id: 任务ID
            task_dag: 任务DAG
        """
        try:
            replan_data = {
                "task_id": task_id,
                "task_dag": task_dag.to_dict(),
                "requester_id": self.id,
                "timestamp": datetime.now().isoformat()
            }
            
            self.message_broker.publish(
                Message.create(
                    sender_id=self.id,
                    receiver_id="*",  # 广播给所有智能体
                    message_type=MessageType.TASK_REPLAN,
                    priority=MessagePriority.HIGH,
                    content=replan_data
                )
            )
        except Exception as e:
            logger.error(f"发送任务重规划消息失败: {e}")
    
    def _send_data_request(self, request_data: Dict[str, Any]) -> str:
        """发送数据请求消息
        
        Args:
            request_data: 请求数据
            
        Returns:
            str: 请求ID
        """
        try:
            request_id = f"data_request_{int(time.time())}_{self.id}"
            request_data["request_id"] = request_id
            
            self.message_broker.publish(
                Message.create(
                    sender_id=self.id,
                    receiver_id="*",  # 广播给所有智能体
                    message_type=MessageType.DATA_REQUEST,
                    priority=MessagePriority.HIGH,
                    content=request_data
                )
            )
            
            return request_id
        except Exception as e:
            logger.error(f"发送数据请求消息失败: {e}")
            return f"error_{int(time.time())}"
    
    def _send_semantic_clarification(self, clarification_data: Dict[str, Any]) -> None:
        """发送语义澄清消息
        
        Args:
            clarification_data: 澄清数据
        """
        try:
            self.message_broker.publish(
                Message.create(
                    sender_id=self.id,
                    receiver_id="*",  # 广播给所有智能体
                    message_type=MessageType.SEMANTIC_CLARIFICATION,
                    priority=MessagePriority.HIGH,
                    content=clarification_data
                )
            )
        except Exception as e:
            logger.error(f"发送语义澄清消息失败: {e}")
    
    def _collect_decision_data(self, agent_ids: List[str], time_range: Dict[str, str], domains: List[str]) -> List[Dict[str, Any]]:
        """收集决策数据
        
        Args:
            agent_ids: 智能体ID列表
            time_range: 时间范围
            domains: 领域列表
            
        Returns:
            List[Dict[str, Any]]: 决策数据列表
        """
        # 简化实现，实际应从长期记忆中查询决策数据
        return []
    
    def _train_distilled_model(self, decision_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """训练知识蒸馏模型
        
        Args:
            decision_data: 决策数据列表
            
        Returns:
            Dict[str, Any]: 模型信息
        """
        # 简化实现，实际应训练轻量级模型
        return {
            "id": f"distilled_model_{int(time.time())}",
            "version": "0.1",
            "model": {"version": "0.1", "rules": []},
            "metrics": {
                "accuracy": 0.0,
                "precision": 0.0,
                "recall": 0.0,
                "f1": 0.0
            }
        }
    
    def _should_review_node(self, task_id: str, node_id: str) -> bool:
        """检查是否应该审核节点
        
        Args:
            task_id: 任务ID
            node_id: 节点ID
            
        Returns:
            bool: 是否应该审核
        """
        # 简化实现，实际应根据节点类型、重要性等因素决定
        if task_id not in self.task_dag_cache:
            return False
        
        task_dag = self.task_dag_cache[task_id]
        if node_id not in task_dag.nodes:
            return False
        
        node = task_dag.nodes[node_id]
        
        # 检查节点是否是关键节点
        is_critical = node.metadata.get("critical", False)
        if is_critical:
            return True
        
        # 检查节点是否有错误历史
        has_error_history = "error_history" in node.metadata and node.metadata["error_history"]
        if has_error_history:
            return True
        
        # 随机抽样审核（10%概率）
        import random
        return random.random() < 0.1