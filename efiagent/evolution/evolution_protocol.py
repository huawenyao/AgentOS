"""三阶段进化协议模块

该模块实现了系统的进化机制，包括提示词微调、工作流重构和模型热替换三个阶段。
"""

import uuid
import json
import time
from enum import Enum
from typing import Dict, List, Set, Optional, Any, Tuple, Callable, Union
from datetime import datetime, timedelta
from pydantic import BaseModel, Field, validator, root_validator
from loguru import logger


class EvolutionStage(str, Enum):
    """进化阶段枚举"""
    PROMPT_TUNING = "prompt_tuning"  # 提示词微调
    WORKFLOW_RESTRUCTURING = "workflow_restructuring"  # 工作流重构
    MODEL_SWAPPING = "model_swapping"  # 模型热替换


class EvolutionStatus(str, Enum):
    """进化状态枚举"""
    PENDING = "pending"  # 待处理
    TESTING = "testing"  # 测试中
    DEPLOYING = "deploying"  # 部署中
    COMPLETED = "completed"  # 已完成
    FAILED = "failed"  # 失败
    ROLLED_BACK = "rolled_back"  # 已回滚


class MetricType(str, Enum):
    """指标类型枚举"""
    TASK_COMPLETION_RATE = "task_completion_rate"  # 任务完成率
    RESPONSE_LATENCY = "response_latency"  # 响应延迟
    ERROR_RATE = "error_rate"  # 错误率
    RESOURCE_UTILIZATION = "resource_utilization"  # 资源利用率
    USER_SATISFACTION = "user_satisfaction"  # 用户满意度
    COST_EFFICIENCY = "cost_efficiency"  # 成本效率


class PromptTemplate(BaseModel):
    """提示词模板"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str  # 模板名称
    description: Optional[str] = None  # 模板描述
    template: str  # 模板内容
    variables: List[str] = Field(default_factory=list)  # 变量列表
    version: int = 1  # 版本号
    created_at: datetime = Field(default_factory=datetime.now)  # 创建时间
    updated_at: datetime = Field(default_factory=datetime.now)  # 更新时间
    tags: List[str] = Field(default_factory=list)  # 标签
    
    def render(self, variables: Dict[str, Any]) -> str:
        """渲染模板
        
        Args:
            variables: 变量字典
            
        Returns:
            str: 渲染后的模板
            
        Raises:
            KeyError: 缺少必要的变量
        """
        result = self.template
        for var in self.variables:
            if var not in variables:
                raise KeyError(f"缺少必要的变量: {var}")
            result = result.replace(f"{{{var}}}", str(variables[var]))
        return result


class WorkflowNode(BaseModel):
    """工作流节点"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str  # 节点名称
    description: Optional[str] = None  # 节点描述
    agent_type: str  # 智能体类型
    config: Dict[str, Any] = Field(default_factory=dict)  # 配置
    skills_required: List[str] = Field(default_factory=list)  # 所需技能
    
    def to_dict(self) -> Dict[str, Any]:
        """转换为字典
        
        Returns:
            Dict[str, Any]: 字典表示
        """
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "agent_type": self.agent_type,
            "config": self.config,
            "skills_required": self.skills_required
        }


class Workflow(BaseModel):
    """工作流"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str  # 工作流名称
    description: Optional[str] = None  # 工作流描述
    nodes: Dict[str, WorkflowNode] = Field(default_factory=dict)  # 节点字典，键为节点ID
    edges: List[Tuple[str, str]] = Field(default_factory=list)  # 边列表，每个元素为(源节点ID, 目标节点ID)
    version: int = 1  # 版本号
    created_at: datetime = Field(default_factory=datetime.now)  # 创建时间
    updated_at: datetime = Field(default_factory=datetime.now)  # 更新时间
    
    def add_node(self, node: WorkflowNode) -> str:
        """添加节点
        
        Args:
            node: 工作流节点
            
        Returns:
            str: 节点ID
        """
        self.nodes[node.id] = node
        self.updated_at = datetime.now()
        return node.id
    
    def remove_node(self, node_id: str) -> bool:
        """移除节点
        
        Args:
            node_id: 节点ID
            
        Returns:
            bool: 是否成功移除
        """
        if node_id not in self.nodes:
            return False
        
        # 移除节点
        del self.nodes[node_id]
        
        # 移除相关的边
        self.edges = [(src, dst) for src, dst in self.edges if src != node_id and dst != node_id]
        
        self.updated_at = datetime.now()
        return True
    
    def add_edge(self, source_id: str, target_id: str) -> bool:
        """添加边
        
        Args:
            source_id: 源节点ID
            target_id: 目标节点ID
            
        Returns:
            bool: 是否成功添加
        """
        if source_id not in self.nodes or target_id not in self.nodes:
            return False
        
        if (source_id, target_id) in self.edges:
            return False
        
        self.edges.append((source_id, target_id))
        self.updated_at = datetime.now()
        return True
    
    def remove_edge(self, source_id: str, target_id: str) -> bool:
        """移除边
        
        Args:
            source_id: 源节点ID
            target_id: 目标节点ID
            
        Returns:
            bool: 是否成功移除
        """
        if (source_id, target_id) not in self.edges:
            return False
        
        self.edges.remove((source_id, target_id))
        self.updated_at = datetime.now()
        return True
    
    def get_node_inputs(self, node_id: str) -> List[str]:
        """获取节点的输入节点
        
        Args:
            node_id: 节点ID
            
        Returns:
            List[str]: 输入节点ID列表
        """
        return [src for src, dst in self.edges if dst == node_id]
    
    def get_node_outputs(self, node_id: str) -> List[str]:
        """获取节点的输出节点
        
        Args:
            node_id: 节点ID
            
        Returns:
            List[str]: 输出节点ID列表
        """
        return [dst for src, dst in self.edges if src == node_id]
    
    def to_dict(self) -> Dict[str, Any]:
        """转换为字典
        
        Returns:
            Dict[str, Any]: 字典表示
        """
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "nodes": {node_id: node.to_dict() for node_id, node in self.nodes.items()},
            "edges": self.edges,
            "version": self.version,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat()
        }
    
    def has_cycles(self) -> bool:
        """检查是否有环
        
        Returns:
            bool: 是否有环
        """
        visited = set()
        path = set()
        
        def dfs(node_id):
            if node_id in path:
                return True
            if node_id in visited:
                return False
            
            visited.add(node_id)
            path.add(node_id)
            
            for dst in self.get_node_outputs(node_id):
                if dfs(dst):
                    return True
            
            path.remove(node_id)
            return False
        
        for node_id in self.nodes:
            if dfs(node_id):
                return True
        
        return False


class ModelInfo(BaseModel):
    """模型信息"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str  # 模型名称
    version: str  # 模型版本
    provider: str  # 提供商
    type: str  # 模型类型
    capabilities: List[str] = Field(default_factory=list)  # 能力列表
    parameters: Dict[str, Any] = Field(default_factory=dict)  # 参数
    endpoint: Optional[str] = None  # 端点
    api_key_env: Optional[str] = None  # API密钥环境变量名
    created_at: datetime = Field(default_factory=datetime.now)  # 创建时间
    
    def to_dict(self) -> Dict[str, Any]:
        """转换为字典
        
        Returns:
            Dict[str, Any]: 字典表示
        """
        return {
            "id": self.id,
            "name": self.name,
            "version": self.version,
            "provider": self.provider,
            "type": self.type,
            "capabilities": self.capabilities,
            "parameters": self.parameters,
            "endpoint": self.endpoint,
            "api_key_env": self.api_key_env,
            "created_at": self.created_at.isoformat()
        }


class MetricResult(BaseModel):
    """指标结果"""
    metric_type: MetricType  # 指标类型
    value: float  # 值
    timestamp: datetime = Field(default_factory=datetime.now)  # 时间戳
    details: Dict[str, Any] = Field(default_factory=dict)  # 详情


class EvolutionExperiment(BaseModel):
    """进化实验"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str  # 实验名称
    description: Optional[str] = None  # 实验描述
    stage: EvolutionStage  # 进化阶段
    status: EvolutionStatus = EvolutionStatus.PENDING  # 状态
    created_at: datetime = Field(default_factory=datetime.now)  # 创建时间
    updated_at: datetime = Field(default_factory=datetime.now)  # 更新时间
    started_at: Optional[datetime] = None  # 开始时间
    completed_at: Optional[datetime] = None  # 完成时间
    traffic_percentage: float = 10.0  # 流量百分比
    success_criteria: Dict[MetricType, float] = Field(default_factory=dict)  # 成功标准
    results: Dict[MetricType, List[MetricResult]] = Field(default_factory=dict)  # 结果
    
    # 根据进化阶段的不同，以下字段可能为空
    prompt_template_id: Optional[str] = None  # 提示词模板ID
    workflow_id: Optional[str] = None  # 工作流ID
    model_id: Optional[str] = None  # 模型ID
    
    @root_validator
    def validate_stage_fields(cls, values):
        """验证阶段字段
        
        Args:
            values: 值字典
            
        Returns:
            Dict: 验证后的值字典
            
        Raises:
            ValueError: 验证失败
        """
        stage = values.get("stage")
        if stage == EvolutionStage.PROMPT_TUNING and not values.get("prompt_template_id"):
            raise ValueError("提示词微调阶段必须指定提示词模板ID")
        elif stage == EvolutionStage.WORKFLOW_RESTRUCTURING and not values.get("workflow_id"):
            raise ValueError("工作流重构阶段必须指定工作流ID")
        elif stage == EvolutionStage.MODEL_SWAPPING and not values.get("model_id"):
            raise ValueError("模型热替换阶段必须指定模型ID")
        return values
    
    def add_result(self, metric_type: MetricType, value: float, details: Dict[str, Any] = None) -> None:
        """添加结果
        
        Args:
            metric_type: 指标类型
            value: 值
            details: 详情
        """
        if details is None:
            details = {}
        
        if metric_type not in self.results:
            self.results[metric_type] = []
        
        result = MetricResult(
            metric_type=metric_type,
            value=value,
            details=details
        )
        
        self.results[metric_type].append(result)
        self.updated_at = datetime.now()
    
    def check_success(self) -> bool:
        """检查是否成功
        
        Returns:
            bool: 是否成功
        """
        for metric_type, threshold in self.success_criteria.items():
            if metric_type not in self.results or not self.results[metric_type]:
                return False
            
            # 计算平均值
            avg_value = sum(r.value for r in self.results[metric_type]) / len(self.results[metric_type])
            
            # 根据指标类型判断是否达到阈值
            if metric_type in [MetricType.RESPONSE_LATENCY, MetricType.ERROR_RATE]:
                # 这些指标越低越好
                if avg_value > threshold:
                    return False
            else:
                # 其他指标越高越好
                if avg_value < threshold:
                    return False
        
        return True
    
    def to_dict(self) -> Dict[str, Any]:
        """转换为字典
        
        Returns:
            Dict[str, Any]: 字典表示
        """
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "stage": self.stage.value,
            "status": self.status.value,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
            "started_at": self.started_at.isoformat() if self.started_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
            "traffic_percentage": self.traffic_percentage,
            "success_criteria": {k.value: v for k, v in self.success_criteria.items()},
            "prompt_template_id": self.prompt_template_id,
            "workflow_id": self.workflow_id,
            "model_id": self.model_id,
            "results": {
                k.value: [r.dict() for r in v] for k, v in self.results.items()
            }
        }


class EvolutionProtocol:
    """进化协议
    
    实现系统的进化机制，包括提示词微调、工作流重构和模型热替换三个阶段
    """
    def __init__(self):
        """初始化进化协议"""
        self.prompt_templates: Dict[str, PromptTemplate] = {}  # 提示词模板字典，键为模板ID
        self.workflows: Dict[str, Workflow] = {}  # 工作流字典，键为工作流ID
        self.models: Dict[str, ModelInfo] = {}  # 模型字典，键为模型ID
        self.experiments: Dict[str, EvolutionExperiment] = {}  # 实验字典，键为实验ID
        self.active_experiments: Dict[str, str] = {}  # 活跃实验字典，键为资源ID（模板ID、工作流ID或模型ID），值为实验ID
        self.traffic_router = TrafficRouter()  # 流量路由器
    
    def register_prompt_template(self, template: PromptTemplate) -> str:
        """注册提示词模板
        
        Args:
            template: 提示词模板
            
        Returns:
            str: 模板ID
        """
        self.prompt_templates[template.id] = template
        return template.id
    
    def update_prompt_template(self, template_id: str, template: str, variables: List[str] = None) -> bool:
        """更新提示词模板
        
        Args:
            template_id: 模板ID
            template: 模板内容
            variables: 变量列表
            
        Returns:
            bool: 是否成功更新
        """
        if template_id not in self.prompt_templates:
            return False
        
        existing_template = self.prompt_templates[template_id]
        
        # 更新模板内容
        existing_template.template = template
        
        # 更新变量列表（如果提供）
        if variables is not None:
            existing_template.variables = variables
        
        # 更新版本和时间
        existing_template.version += 1
        existing_template.updated_at = datetime.now()
        
        return True
    
    def register_workflow(self, workflow: Workflow) -> str:
        """注册工作流
        
        Args:
            workflow: 工作流
            
        Returns:
            str: 工作流ID
        """
        # 检查是否有环
        if workflow.has_cycles():
            raise ValueError("工作流不能包含环")
        
        self.workflows[workflow.id] = workflow
        return workflow.id
    
    def register_model(self, model: ModelInfo) -> str:
        """注册模型
        
        Args:
            model: 模型信息
            
        Returns:
            str: 模型ID
        """
        self.models[model.id] = model
        return model.id
    
    def create_experiment(self, experiment: EvolutionExperiment) -> str:
        """创建实验
        
        Args:
            experiment: 进化实验
            
        Returns:
            str: 实验ID
            
        Raises:
            ValueError: 验证失败
        """
        # 验证资源是否存在
        if experiment.stage == EvolutionStage.PROMPT_TUNING:
            if experiment.prompt_template_id not in self.prompt_templates:
                raise ValueError(f"提示词模板不存在: {experiment.prompt_template_id}")
        elif experiment.stage == EvolutionStage.WORKFLOW_RESTRUCTURING:
            if experiment.workflow_id not in self.workflows:
                raise ValueError(f"工作流不存在: {experiment.workflow_id}")
        elif experiment.stage == EvolutionStage.MODEL_SWAPPING:
            if experiment.model_id not in self.models:
                raise ValueError(f"模型不存在: {experiment.model_id}")
        
        # 检查是否已有活跃实验
        resource_id = self._get_resource_id_from_experiment(experiment)
        if resource_id in self.active_experiments:
            active_exp_id = self.active_experiments[resource_id]
            active_exp = self.experiments[active_exp_id]
            if active_exp.status in [EvolutionStatus.TESTING, EvolutionStatus.DEPLOYING]:
                raise ValueError(f"该资源已有活跃实验: {active_exp.name}")
        
        self.experiments[experiment.id] = experiment
        return experiment.id
    
    def start_experiment(self, experiment_id: str) -> bool:
        """开始实验
        
        Args:
            experiment_id: 实验ID
            
        Returns:
            bool: 是否成功开始
            
        Raises:
            ValueError: 验证失败
        """
        if experiment_id not in self.experiments:
            return False
        
        experiment = self.experiments[experiment_id]
        
        # 检查状态
        if experiment.status != EvolutionStatus.PENDING:
            return False
        
        # 更新状态
        experiment.status = EvolutionStatus.TESTING
        experiment.started_at = datetime.now()
        experiment.updated_at = datetime.now()
        
        # 注册为活跃实验
        resource_id = self._get_resource_id_from_experiment(experiment)
        self.active_experiments[resource_id] = experiment_id
        
        # 配置流量路由
        self.traffic_router.add_route(resource_id, experiment_id, experiment.traffic_percentage)
        
        return True
    
    def add_experiment_result(self, experiment_id: str, metric_type: MetricType, 
                             value: float, details: Dict[str, Any] = None) -> bool:
        """添加实验结果
        
        Args:
            experiment_id: 实验ID
            metric_type: 指标类型
            value: 值
            details: 详情
            
        Returns:
            bool: 是否成功添加
        """
        if experiment_id not in self.experiments:
            return False
        
        experiment = self.experiments[experiment_id]
        
        # 检查状态
        if experiment.status != EvolutionStatus.TESTING:
            return False
        
        # 添加结果
        experiment.add_result(metric_type, value, details)
        return True
    
    def complete_experiment(self, experiment_id: str, force_success: bool = False) -> bool:
        """完成实验
        
        Args:
            experiment_id: 实验ID
            force_success: 强制成功
            
        Returns:
            bool: 是否成功完成
        """
        if experiment_id not in self.experiments:
            return False
        
        experiment = self.experiments[experiment_id]
        
        # 检查状态
        if experiment.status != EvolutionStatus.TESTING:
            return False
        
        # 检查是否成功
        success = force_success or experiment.check_success()
        
        if success:
            # 更新状态为部署中
            experiment.status = EvolutionStatus.DEPLOYING
            experiment.updated_at = datetime.now()
            
            # 更新流量路由为100%
            resource_id = self._get_resource_id_from_experiment(experiment)
            self.traffic_router.update_route(resource_id, experiment_id, 100.0)
            
            # 应用更改
            self._apply_experiment_changes(experiment)
            
            # 更新状态为已完成
            experiment.status = EvolutionStatus.COMPLETED
            experiment.completed_at = datetime.now()
            experiment.updated_at = datetime.now()
        else:
            # 更新状态为失败
            experiment.status = EvolutionStatus.FAILED
            experiment.completed_at = datetime.now()
            experiment.updated_at = datetime.now()
            
            # 移除流量路由
            resource_id = self._get_resource_id_from_experiment(experiment)
            self.traffic_router.remove_route(resource_id, experiment_id)
        
        # 移除活跃实验
        resource_id = self._get_resource_id_from_experiment(experiment)
        if resource_id in self.active_experiments and self.active_experiments[resource_id] == experiment_id:
            del self.active_experiments[resource_id]
        
        return True
    
    def rollback_experiment(self, experiment_id: str) -> bool:
        """回滚实验
        
        Args:
            experiment_id: 实验ID
            
        Returns:
            bool: 是否成功回滚
        """
        if experiment_id not in self.experiments:
            return False
        
        experiment = self.experiments[experiment_id]
        
        # 检查状态
        if experiment.status not in [EvolutionStatus.TESTING, EvolutionStatus.DEPLOYING, EvolutionStatus.COMPLETED]:
            return False
        
        # 更新状态
        experiment.status = EvolutionStatus.ROLLED_BACK
        experiment.updated_at = datetime.now()
        
        # 移除流量路由
        resource_id = self._get_resource_id_from_experiment(experiment)
        self.traffic_router.remove_route(resource_id, experiment_id)
        
        # 移除活跃实验
        if resource_id in self.active_experiments and self.active_experiments[resource_id] == experiment_id:
            del self.active_experiments[resource_id]
        
        return True
    
    def get_active_resource(self, resource_type: str, resource_id: str, context: Dict[str, Any] = None) -> str:
        """获取活跃资源
        
        根据流量路由决定使用原始资源还是实验资源
        
        Args:
            resource_type: 资源类型（prompt_template, workflow, model）
            resource_id: 资源ID
            context: 上下文
            
        Returns:
            str: 活跃资源ID
        """
        if context is None:
            context = {}
        
        # 检查是否有活跃实验
        if resource_id in self.active_experiments:
            experiment_id = self.active_experiments[resource_id]
            experiment = self.experiments[experiment_id]
            
            # 检查实验状态
            if experiment.status in [EvolutionStatus.TESTING, EvolutionStatus.DEPLOYING]:
                # 根据流量路由决定使用哪个资源
                if self.traffic_router.should_route_to_experiment(resource_id, context):
                    # 根据实验阶段返回相应的资源ID
                    if experiment.stage == EvolutionStage.PROMPT_TUNING:
                        return experiment.prompt_template_id
                    elif experiment.stage == EvolutionStage.WORKFLOW_RESTRUCTURING:
                        return experiment.workflow_id
                    elif experiment.stage == EvolutionStage.MODEL_SWAPPING:
                        return experiment.model_id
        
        # 默认返回原始资源ID
        return resource_id
    
    def _get_resource_id_from_experiment(self, experiment: EvolutionExperiment) -> str:
        """从实验获取资源ID
        
        Args:
            experiment: 进化实验
            
        Returns:
            str: 资源ID
        """
        if experiment.stage == EvolutionStage.PROMPT_TUNING:
            return experiment.prompt_template_id
        elif experiment.stage == EvolutionStage.WORKFLOW_RESTRUCTURING:
            return experiment.workflow_id
        elif experiment.stage == EvolutionStage.MODEL_SWAPPING:
            return experiment.model_id
        else:
            raise ValueError(f"未知的进化阶段: {experiment.stage}")
    
    def _apply_experiment_changes(self, experiment: EvolutionExperiment) -> None:
        """应用实验更改
        
        Args:
            experiment: 进化实验
        """
        # 根据实验阶段应用更改
        if experiment.stage == EvolutionStage.PROMPT_TUNING:
            # 提示词微调不需要特殊处理，因为已经创建了新的模板
            pass
        elif experiment.stage == EvolutionStage.WORKFLOW_RESTRUCTURING:
            # 工作流重构不需要特殊处理，因为已经创建了新的工作流
            pass
        elif experiment.stage == EvolutionStage.MODEL_SWAPPING:
            # 模型热替换不需要特殊处理，因为已经创建了新的模型
            pass
    
    def get_experiment_status(self, experiment_id: str) -> Optional[Dict[str, Any]]:
        """获取实验状态
        
        Args:
            experiment_id: 实验ID
            
        Returns:
            Optional[Dict[str, Any]]: 实验状态
        """
        if experiment_id not in self.experiments:
            return None
        
        experiment = self.experiments[experiment_id]
        return experiment.to_dict()
    
    def list_experiments(self, stage: Optional[EvolutionStage] = None, 
                        status: Optional[EvolutionStatus] = None) -> List[Dict[str, Any]]:
        """列出实验
        
        Args:
            stage: 进化阶段
            status: 状态
            
        Returns:
            List[Dict[str, Any]]: 实验列表
        """
        filtered_experiments = self.experiments.values()
        
        if stage is not None:
            filtered_experiments = [e for e in filtered_experiments if e.stage == stage]
        
        if status is not None:
            filtered_experiments = [e for e in filtered_experiments if e.status == status]
        
        # 按创建时间排序
        filtered_experiments = sorted(filtered_experiments, key=lambda e: e.created_at, reverse=True)
        
        return [e.to_dict() for e in filtered_experiments]


class TrafficRouter:
    """流量路由器
    
    用于控制实验流量的分配
    """
    def __init__(self):
        """初始化流量路由器"""
        self.routes: Dict[str, Dict[str, float]] = {}  # 路由字典，键为资源ID，值为实验ID到百分比的映射
    
    def add_route(self, resource_id: str, experiment_id: str, percentage: float) -> None:
        """添加路由
        
        Args:
            resource_id: 资源ID
            experiment_id: 实验ID
            percentage: 百分比
        """
        if resource_id not in self.routes:
            self.routes[resource_id] = {}
        
        self.routes[resource_id][experiment_id] = percentage
    
    def update_route(self, resource_id: str, experiment_id: str, percentage: float) -> bool:
        """更新路由
        
        Args:
            resource_id: 资源ID
            experiment_id: 实验ID
            percentage: 百分比
            
        Returns:
            bool: 是否成功更新
        """
        if resource_id not in self.routes or experiment_id not in self.routes[resource_id]:
            return False
        
        self.routes[resource_id][experiment_id] = percentage
        return True
    
    def remove_route(self, resource_id: str, experiment_id: str) -> bool:
        """移除路由
        
        Args:
            resource_id: 资源ID
            experiment_id: 实验ID
            
        Returns:
            bool: 是否成功移除
        """
        if resource_id not in self.routes or experiment_id not in self.routes[resource_id]:
            return False
        
        del self.routes[resource_id][experiment_id]
        
        if not self.routes[resource_id]:
            del self.routes[resource_id]
        
        return True
    
    def should_route_to_experiment(self, resource_id: str, context: Dict[str, Any] = None) -> bool:
        """是否应该路由到实验
        
        Args:
            resource_id: 资源ID
            context: 上下文
            
        Returns:
            bool: 是否应该路由到实验
        """
        if context is None:
            context = {}
        
        if resource_id not in self.routes or not self.routes[resource_id]:
            return False
        
        # 获取实验ID和百分比
        experiment_id, percentage = next(iter(self.routes[resource_id].items()))
        
        # 计算哈希值
        hash_input = f"{resource_id}:{context.get('user_id', '')}:{context.get('session_id', '')}"
        hash_value = int(hashlib.md5(hash_input.encode()).hexdigest(), 16) % 100
        
        # 根据百分比决定是否路由到实验
        return hash_value < percentage