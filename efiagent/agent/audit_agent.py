"""审核智能体模块

该模块实现了审核智能体，负责监督和审核其他智能体的行为和结果。
"""

import uuid
import json
import time
import hashlib
from enum import Enum
from typing import Dict, List, Set, Optional, Any, Tuple, Callable, Union
from datetime import datetime, timedelta
from pydantic import BaseModel, Field, validator
from loguru import logger

from efiagent.agent.base_agent import (
    BaseAgent, AgentConfig, AgentType, AgentStatus,
    AgentContext, AgentObservation, AgentAction, AgentResult
)
from efiagent.security.zero_trust import AuditRecord, AuditAction, TrustLevel


class AuditScope(str, Enum):
    """审核范围枚举"""
    PLAN = "plan"  # 计划审核
    EXECUTION = "execution"  # 执行审核
    COMMUNICATION = "communication"  # 通信审核
    RESOURCE = "resource"  # 资源审核
    SECURITY = "security"  # 安全审核
    COMPLIANCE = "compliance"  # 合规审核


class AuditSeverity(str, Enum):
    """审核严重性枚举"""
    INFO = "info"  # 信息
    WARNING = "warning"  # 警告
    ERROR = "error"  # 错误
    CRITICAL = "critical"  # 严重


class AuditFinding(BaseModel):
    """审核发现模型"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    timestamp: datetime = Field(default_factory=datetime.now)
    scope: AuditScope  # 审核范围
    severity: AuditSeverity  # 严重性
    agent_id: Optional[str] = None  # 相关智能体ID
    task_id: Optional[str] = None  # 相关任务ID
    description: str  # 描述
    details: Dict[str, Any] = Field(default_factory=dict)  # 详细信息
    recommendation: Optional[str] = None  # 建议
    resolved: bool = False  # 是否已解决
    resolution_timestamp: Optional[datetime] = None  # 解决时间
    resolution_description: Optional[str] = None  # 解决描述

    def resolve(self, description: str) -> None:
        """解决审核发现
        
        Args:
            description: 解决描述
        """
        self.resolved = True
        self.resolution_timestamp = datetime.now()
        self.resolution_description = description


class AuditRule(BaseModel):
    """审核规则模型"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str  # 规则名称
    description: str  # 规则描述
    scope: AuditScope  # 审核范围
    severity: AuditSeverity  # 严重性
    condition: Dict[str, Any]  # 条件
    recommendation: Optional[str] = None  # 建议
    enabled: bool = True  # 是否启用


class AuditReport(BaseModel):
    """审核报告模型"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    timestamp: datetime = Field(default_factory=datetime.now)
    agent_id: str  # 审核智能体ID
    period_start: datetime  # 审核周期开始时间
    period_end: datetime  # 审核周期结束时间
    findings: List[AuditFinding] = Field(default_factory=list)  # 审核发现
    summary: Dict[str, Any] = Field(default_factory=dict)  # 摘要
    recommendations: List[str] = Field(default_factory=list)  # 建议


class AuditAgent(BaseAgent):
    """审核智能体
    
    负责监督和审核其他智能体的行为和结果
    """
    def __init__(self, config: AgentConfig):
        """初始化审核智能体
        
        Args:
            config: 智能体配置
        """
        super().__init__(config)
        
        # 确保类型正确
        if self.type != AgentType.AUDIT:
            raise ValueError(f"Invalid agent type: {self.type}, expected: {AgentType.AUDIT}")
        
        # 审核相关属性
        self.audit_rules = []  # 审核规则列表
        self.audit_findings = []  # 审核发现列表
        self.audit_reports = []  # 审核报告列表
        self.last_report_time = datetime.now()  # 上次报告时间
        self.report_interval = timedelta(hours=self.parameters.get("report_interval_hours", 24))  # 报告间隔
        
        # 监控的智能体和任务
        self.monitored_agents = set()  # 监控的智能体集合
        self.monitored_tasks = set()  # 监控的任务集合
        
        # 审核记录缓存
        self.audit_records_cache = []  # 审核记录缓存
        self.max_cache_size = self.parameters.get("max_cache_size", 1000)  # 最大缓存大小
        
        # LLM相关配置
        self.llm_config = self.model_config.get("llm", {})
        self.prompt_templates = self.model_config.get("prompt_templates", {})
    
    def _initialize_impl(self) -> None:
        """初始化实现"""
        # 初始化LLM客户端
        self._initialize_llm()
        
        # 加载审核规则
        self._load_audit_rules()
        
        # 加载提示词模板
        self._load_prompt_templates()
        
        logger.info(f"Audit agent {self.id} initialized")
    
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
    
    def _load_audit_rules(self) -> None:
        """加载审核规则"""
        # 从配置中加载规则
        rules_config = self.parameters.get("audit_rules", [])
        
        for rule_config in rules_config:
            rule = AuditRule(
                name=rule_config.get("name", ""),
                description=rule_config.get("description", ""),
                scope=AuditScope(rule_config.get("scope", AuditScope.PLAN.value)),
                severity=AuditSeverity(rule_config.get("severity", AuditSeverity.WARNING.value)),
                condition=rule_config.get("condition", {}),
                recommendation=rule_config.get("recommendation"),
                enabled=rule_config.get("enabled", True)
            )
            self.audit_rules.append(rule)
        
        # 如果没有规则，添加默认规则
        if not self.audit_rules:
            # 计划审核规则
            self.audit_rules.append(AuditRule(
                name="plan_cycle_detection",
                description="检测任务计划中的循环依赖",
                scope=AuditScope.PLAN,
                severity=AuditSeverity.ERROR,
                condition={"has_cycles": True},
                recommendation="移除循环依赖或重新设计任务流程"
            ))
            
            self.audit_rules.append(AuditRule(
                name="plan_unreachable_nodes",
                description="检测任务计划中的不可达节点",
                scope=AuditScope.PLAN,
                severity=AuditSeverity.WARNING,
                condition={"has_unreachable_nodes": True},
                recommendation="确保所有任务节点都有正确的依赖关系"
            ))
            
            # 执行审核规则
            self.audit_rules.append(AuditRule(
                name="execution_timeout",
                description="检测任务执行超时",
                scope=AuditScope.EXECUTION,
                severity=AuditSeverity.WARNING,
                condition={"execution_time": {"gt": "estimated_time * 2"}},
                recommendation="检查任务执行效率或调整估计时间"
            ))
            
            self.audit_rules.append(AuditRule(
                name="execution_error_rate",
                description="检测高错误率",
                scope=AuditScope.EXECUTION,
                severity=AuditSeverity.ERROR,
                condition={"error_rate": {"gt": 0.2}},
                recommendation="检查任务执行逻辑或提供更多错误处理"
            ))
            
            # 资源审核规则
            self.audit_rules.append(AuditRule(
                name="resource_overuse",
                description="检测资源过度使用",
                scope=AuditScope.RESOURCE,
                severity=AuditSeverity.WARNING,
                condition={"resource_usage": {"gt": "allocated_resources * 0.9"}},
                recommendation="增加资源分配或优化资源使用"
            ))
            
            # 安全审核规则
            self.audit_rules.append(AuditRule(
                name="security_permission_escalation",
                description="检测权限提升尝试",
                scope=AuditScope.SECURITY,
                severity=AuditSeverity.CRITICAL,
                condition={"permission_escalation_attempt": True},
                recommendation="检查安全策略并调查可能的安全漏洞"
            ))
        
        logger.info(f"Loaded {len(self.audit_rules)} audit rules")
    
    def _load_prompt_templates(self) -> None:
        """加载提示词模板"""
        # 如果没有提供模板，使用默认模板
        if not self.prompt_templates:
            self.prompt_templates = {
                "plan_audit": (
                    "You are an AI audit agent responsible for reviewing task plans. "
                    "Please review the following task plan and identify any issues:\n\n"
                    "Task Plan:\n{plan}\n\n"
                    "Please identify any issues related to:\n"
                    "1. Cycle dependencies\n"
                    "2. Unreachable nodes\n"
                    "3. Resource allocation\n"
                    "4. Task priorities\n"
                    "5. Any other potential problems\n\n"
                    "For each issue, provide:\n"
                    "1. Description of the issue\n"
                    "2. Severity (info, warning, error, critical)\n"
                    "3. Recommendation for resolution"
                ),
                "execution_audit": (
                    "You are an AI audit agent responsible for reviewing task execution results. "
                    "Please review the following execution results and identify any issues:\n\n"
                    "Task: {task_description}\n\n"
                    "Execution Results:\n{execution_results}\n\n"
                    "Please identify any issues related to:\n"
                    "1. Execution errors\n"
                    "2. Performance problems\n"
                    "3. Resource usage\n"
                    "4. Output quality\n"
                    "5. Any other potential problems\n\n"
                    "For each issue, provide:\n"
                    "1. Description of the issue\n"
                    "2. Severity (info, warning, error, critical)\n"
                    "3. Recommendation for resolution"
                ),
                "security_audit": (
                    "You are an AI audit agent responsible for reviewing security logs. "
                    "Please review the following security logs and identify any issues:\n\n"
                    "Security Logs:\n{security_logs}\n\n"
                    "Please identify any issues related to:\n"
                    "1. Unauthorized access attempts\n"
                    "2. Permission escalation\n"
                    "3. Unusual patterns\n"
                    "4. Policy violations\n"
                    "5. Any other security concerns\n\n"
                    "For each issue, provide:\n"
                    "1. Description of the issue\n"
                    "2. Severity (info, warning, error, critical)\n"
                    "3. Recommendation for resolution"
                ),
                "report_generation": (
                    "You are an AI audit agent responsible for generating audit reports. "
                    "Please generate a comprehensive audit report based on the following findings:\n\n"
                    "Audit Period: {period_start} to {period_end}\n\n"
                    "Audit Findings:\n{findings}\n\n"
                    "Please generate a report that includes:\n"
                    "1. Executive summary\n"
                    "2. Key findings by severity\n"
                    "3. Trends and patterns\n"
                    "4. Recommendations\n"
                    "5. Conclusion"
                )
            }
            logger.info(f"Loaded default prompt templates for agent {self.id}")
    
    def _observe_impl(self, observation: AgentObservation) -> None:
        """观察实现
        
        Args:
            observation: 智能体观察
        """
        # 处理观察
        if observation.source == "planning_agent" and "dag" in observation.data:
            # 接收到规划智能体的DAG
            self._audit_plan(observation.source, observation.data)
        
        elif observation.source == "execution_agent" and "result" in observation.data:
            # 接收到执行智能体的结果
            self._audit_execution(observation.source, observation.data)
        
        elif observation.source == "resource_scheduler" and "allocation" in observation.data:
            # 接收到资源调度器的分配
            self._audit_resource(observation.source, observation.data)
        
        elif observation.source == "security" and "audit_record" in observation.data:
            # 接收到安全审计记录
            self._audit_security(observation.source, observation.data)
        
        # 添加到监控列表
        if observation.source not in ["audit_agent", "system"]:
            self.monitored_agents.add(observation.source)
        
        if "task_id" in observation.data:
            self.monitored_tasks.add(observation.data["task_id"])
        
        # 缓存审计记录
        self._cache_audit_record(observation)
    
    def _act_impl(self) -> Optional[AgentAction]:
        """行动实现
        
        Returns:
            Optional[AgentAction]: 智能体动作
        """
        # 检查是否需要生成报告
        current_time = datetime.now()
        if current_time - self.last_report_time >= self.report_interval:
            return self._generate_audit_report()
        
        # 检查是否有未解决的严重发现
        critical_findings = [f for f in self.audit_findings if f.severity == AuditSeverity.CRITICAL and not f.resolved]
        if critical_findings:
            return self._alert_critical_findings(critical_findings)
        
        # 默认情况下不执行动作
        return None
    
    def _audit_plan(self, source: str, data: Dict[str, Any]) -> None:
        """审核计划
        
        Args:
            source: 来源
            data: 数据
        """
        # 获取DAG和任务ID
        dag = data.get("dag", {})
        task_id = data.get("task_id")
        
        if not dag or not task_id:
            return
        
        # 应用计划审核规则
        for rule in self.audit_rules:
            if rule.scope != AuditScope.PLAN or not rule.enabled:
                continue
            
            # 检查是否满足规则条件
            if self._check_rule_condition(rule, dag):
                # 创建审核发现
                finding = AuditFinding(
                    scope=rule.scope,
                    severity=rule.severity,
                    agent_id=source,
                    task_id=task_id,
                    description=rule.description,
                    details={"dag": dag},
                    recommendation=rule.recommendation
                )
                self.audit_findings.append(finding)
                
                logger.info(f"Audit agent {self.id} created finding: {finding.id} for rule: {rule.name}")
        
        # 使用LLM进行更深入的审核
        self._llm_audit_plan(source, task_id, dag)
    
    def _audit_execution(self, source: str, data: Dict[str, Any]) -> None:
        """审核执行
        
        Args:
            source: 来源
            data: 数据
        """
        # 获取执行结果和任务ID
        result = data.get("result", {})
        task_id = data.get("task_id")
        subtask_id = data.get("subtask_id")
        
        if not result or not task_id:
            return
        
        # 应用执行审核规则
        for rule in self.audit_rules:
            if rule.scope != AuditScope.EXECUTION or not rule.enabled:
                continue
            
            # 检查是否满足规则条件
            if self._check_rule_condition(rule, result):
                # 创建审核发现
                finding = AuditFinding(
                    scope=rule.scope,
                    severity=rule.severity,
                    agent_id=source,
                    task_id=task_id,
                    description=rule.description,
                    details={"result": result, "subtask_id": subtask_id},
                    recommendation=rule.recommendation
                )
                self.audit_findings.append(finding)
                
                logger.info(f"Audit agent {self.id} created finding: {finding.id} for rule: {rule.name}")
        
        # 使用LLM进行更深入的审核
        self._llm_audit_execution(source, task_id, subtask_id, result)
    
    def _audit_resource(self, source: str, data: Dict[str, Any]) -> None:
        """审核资源
        
        Args:
            source: 来源
            data: 数据
        """
        # 获取资源分配和任务ID
        allocation = data.get("allocation", {})
        task_id = data.get("task_id")
        
        if not allocation or not task_id:
            return
        
        # 应用资源审核规则
        for rule in self.audit_rules:
            if rule.scope != AuditScope.RESOURCE or not rule.enabled:
                continue
            
            # 检查是否满足规则条件
            if self._check_rule_condition(rule, allocation):
                # 创建审核发现
                finding = AuditFinding(
                    scope=rule.scope,
                    severity=rule.severity,
                    agent_id=source,
                    task_id=task_id,
                    description=rule.description,
                    details={"allocation": allocation},
                    recommendation=rule.recommendation
                )
                self.audit_findings.append(finding)
                
                logger.info(f"Audit agent {self.id} created finding: {finding.id} for rule: {rule.name}")
    
    def _audit_security(self, source: str, data: Dict[str, Any]) -> None:
        """审核安全
        
        Args:
            source: 来源
            data: 数据
        """
        # 获取审计记录
        audit_record = data.get("audit_record")
        
        if not isinstance(audit_record, dict):
            return
        
        # 尝试转换为AuditRecord对象
        try:
            record = AuditRecord(**audit_record)
        except Exception as e:
            logger.error(f"Failed to parse audit record: {e}")
            return
        
        # 应用安全审核规则
        for rule in self.audit_rules:
            if rule.scope != AuditScope.SECURITY or not rule.enabled:
                continue
            
            # 检查是否满足规则条件
            if self._check_rule_condition(rule, audit_record):
                # 创建审核发现
                finding = AuditFinding(
                    scope=rule.scope,
                    severity=rule.severity,
                    agent_id=record.subject_id,
                    task_id=None,
                    description=rule.description,
                    details={"audit_record": audit_record},
                    recommendation=rule.recommendation
                )
                self.audit_findings.append(finding)
                
                logger.info(f"Audit agent {self.id} created finding: {finding.id} for rule: {rule.name}")
        
        # 使用LLM进行更深入的审核
        self._llm_audit_security(source, audit_record)
    
    def _check_rule_condition(self, rule: AuditRule, data: Dict[str, Any]) -> bool:
        """检查规则条件
        
        Args:
            rule: 规则
            data: 数据
            
        Returns:
            bool: 是否满足条件
        """
        # 简单条件检查实现
        # 实际应用中可能需要更复杂的条件评估逻辑
        for key, condition in rule.condition.items():
            if key not in data:
                return False
            
            if isinstance(condition, dict):
                # 比较操作
                for op, value in condition.items():
                    if op == "eq" and data[key] != value:
                        return False
                    elif op == "ne" and data[key] == value:
                        return False
                    elif op == "gt":
                        # 处理表达式值
                        if isinstance(value, str) and "*" in value:
                            parts = value.split("*")
                            if len(parts) == 2:
                                try:
                                    ref_key = parts[0].strip()
                                    multiplier = float(parts[1].strip())
                                    if ref_key in data:
                                        value = data[ref_key] * multiplier
                                    else:
                                        return False
                                except (ValueError, TypeError):
                                    return False
                        
                        try:
                            if not float(data[key]) > float(value):
                                return False
                        except (ValueError, TypeError):
                            return False
                    elif op == "lt":
                        try:
                            if not float(data[key]) < float(value):
                                return False
                        except (ValueError, TypeError):
                            return False
            else:
                # 直接比较
                if data[key] != condition:
                    return False
        
        return True
    
    def _llm_audit_plan(self, source: str, task_id: str, dag: Dict[str, Any]) -> None:
        """使用LLM审核计划
        
        Args:
            source: 来源
            task_id: 任务ID
            dag: DAG
        """
        # 准备提示词
        prompt = self.prompt_templates.get("plan_audit", "")
        prompt = prompt.format(plan=json.dumps(dag, indent=2))
        
        try:
            # 调用LLM
            response = self._call_llm(prompt)
            
            # 解析响应
            findings = self._parse_llm_audit_response(response)
            
            # 创建审核发现
            for finding_data in findings:
                finding = AuditFinding(
                    scope=AuditScope.PLAN,
                    severity=AuditSeverity(finding_data.get("severity", AuditSeverity.INFO.value)),
                    agent_id=source,
                    task_id=task_id,
                    description=finding_data.get("description", ""),
                    details={"dag": dag, "llm_analysis": finding_data},
                    recommendation=finding_data.get("recommendation")
                )
                self.audit_findings.append(finding)
                
                logger.info(f"Audit agent {self.id} created LLM finding: {finding.id} for plan audit")
        
        except Exception as e:
            logger.error(f"Failed to perform LLM plan audit: {e}")
    
    def _llm_audit_execution(self, source: str, task_id: str, subtask_id: str, result: Dict[str, Any]) -> None:
        """使用LLM审核执行
        
        Args:
            source: 来源
            task_id: 任务ID
            subtask_id: 子任务ID
            result: 结果
        """
        # 准备提示词
        prompt = self.prompt_templates.get("execution_audit", "")
        prompt = prompt.format(
            task_description=f"Task ID: {task_id}, Subtask ID: {subtask_id}",
            execution_results=json.dumps(result, indent=2)
        )
        
        try:
            # 调用LLM
            response = self._call_llm(prompt)
            
            # 解析响应
            findings = self._parse_llm_audit_response(response)
            
            # 创建审核发现
            for finding_data in findings:
                finding = AuditFinding(
                    scope=AuditScope.EXECUTION,
                    severity=AuditSeverity(finding_data.get("severity", AuditSeverity.INFO.value)),
                    agent_id=source,
                    task_id=task_id,
                    description=finding_data.get("description", ""),
                    details={"result": result, "subtask_id": subtask_id, "llm_analysis": finding_data},
                    recommendation=finding_data.get("recommendation")
                )
                self.audit_findings.append(finding)
                
                logger.info(f"Audit agent {self.id} created LLM finding: {finding.id} for execution audit")
        
        except Exception as e:
            logger.error(f"Failed to perform LLM execution audit: {e}")
    
    def _llm_audit_security(self, source: str, audit_record: Dict[str, Any]) -> None:
        """使用LLM审核安全
        
        Args:
            source: 来源
            audit_record: 审计记录
        """
        # 准备提示词
        prompt = self.prompt_templates.get("security_audit", "")
        prompt = prompt.format(security_logs=json.dumps([audit_record], indent=2))
        
        try:
            # 调用LLM
            response = self._call_llm(prompt)
            
            # 解析响应
            findings = self._parse_llm_audit_response(response)
            
            # 创建审核发现
            for finding_data in findings:
                finding = AuditFinding(
                    scope=AuditScope.SECURITY,
                    severity=AuditSeverity(finding_data.get("severity", AuditSeverity.INFO.value)),
                    agent_id=audit_record.get("subject_id"),
                    task_id=None,
                    description=finding_data.get("description", ""),
                    details={"audit_record": audit_record, "llm_analysis": finding_data},
                    recommendation=finding_data.get("recommendation")
                )
                self.audit_findings.append(finding)
                
                logger.info(f"Audit agent {self.id} created LLM finding: {finding.id} for security audit")
        
        except Exception as e:
            logger.error(f"Failed to perform LLM security audit: {e}")
    
    def _call_llm(self, prompt: str) -> str:
        """调用LLM
        
        Args:
            prompt: 提示词
            
        Returns:
            str: 响应
        """
        try:
            # 调用LLM客户端
            response = self.llm_client.chat_completions_create(
                model=self.llm_config.get("model", "gpt-4"),
                messages=[
                    {"role": "system", "content": "You are an AI audit agent responsible for identifying issues and providing recommendations."},
                    {"role": "user", "content": prompt}
                ],
                temperature=self.llm_config.get("temperature", 0.2),
                max_tokens=self.llm_config.get("max_tokens", 2000)
            )
            
            # 提取响应内容
            return response["choices"][0]["message"]["content"]
        
        except Exception as e:
            logger.error(f"Failed to call LLM: {e}")
            raise
    
    def _parse_llm_audit_response(self, response: str) -> List[Dict[str, Any]]:
        """解析LLM审核响应
        
        Args:
            response: 响应
            
        Returns:
            List[Dict[str, Any]]: 解析后的发现列表
        """
        findings = []
        
        try:
            # 尝试解析JSON响应
            import re
            import json
            
            # 查找JSON块
            json_match = re.search(r'```json\s*([\s\S]*?)\s*```', response)
            if json_match:
                json_str = json_match.group(1)
                findings_data = json.loads(json_str)
                
                if isinstance(findings_data, list):
                    findings = findings_data
                elif isinstance(findings_data, dict) and "findings" in findings_data:
                    findings = findings_data["findings"]
                else:
                    findings = [findings_data]
            else:
                # 尝试从文本中提取结构化信息
                # 查找问题块
                issue_blocks = re.findall(r'(Issue|Finding|Problem)(\s\d+)?:\s*([^\n]+)\n((?:(?!Issue|Finding|Problem|Severity|Description|Recommendation)[^\n]*\n)*)', response, re.IGNORECASE)
                
                for _, _, issue_title, issue_content in issue_blocks:
                    finding = {"description": issue_title.strip()}
                    
                    # 提取严重性
                    severity_match = re.search(r'Severity:\s*([^\n]+)', issue_content, re.IGNORECASE)
                    if severity_match:
                        severity = severity_match.group(1).strip().lower()
                        if severity in [s.value for s in AuditSeverity]:
                            finding["severity"] = severity
                        else:
                            # 映射常见术语到严重性级别
                            if severity in ["critical", "severe", "high"]:
                                finding["severity"] = AuditSeverity.CRITICAL.value
                            elif severity in ["error", "major", "important"]:
                                finding["severity"] = AuditSeverity.ERROR.value
                            elif severity in ["warning", "moderate", "medium"]:
                                finding["severity"] = AuditSeverity.WARNING.value
                            else:
                                finding["severity"] = AuditSeverity.INFO.value
                    
                    # 提取建议
                    recommendation_match = re.search(r'Recommendation:\s*([^\n]+(?:\n(?!Severity|Description|Issue|Finding|Problem)[^\n]*)*)', issue_content, re.IGNORECASE)
                    if recommendation_match:
                        finding["recommendation"] = recommendation_match.group(1).strip()
                    
                    findings.append(finding)
        
        except Exception as e:
            logger.error(f"Failed to parse LLM audit response: {e}")
            # 创建一个基本的发现
            findings = [{
                "description": "Failed to parse LLM response",
                "severity": AuditSeverity.INFO.value,
                "recommendation": "Check the LLM response format"
            }]
        
        # 确保每个发现都有必要的字段
        for finding in findings:
            if "description" not in finding:
                finding["description"] = "Unspecified issue"
            
            if "severity" not in finding:
                finding["severity"] = AuditSeverity.INFO.value
        
        return findings
    
    def _generate_audit_report(self) -> AgentAction:
        """生成审核报告
        
        Returns:
            AgentAction: 智能体动作
        """
        # 设置报告周期
        period_start = self.last_report_time
        period_end = datetime.now()
        
        # 获取周期内的发现
        period_findings = [f for f in self.audit_findings if period_start <= f.timestamp <= period_end]
        
        # 准备发现摘要
        findings_summary = {}
        for severity in AuditSeverity:
            severity_findings = [f for f in period_findings if f.severity == severity]
            findings_summary[severity.value] = {
                "count": len(severity_findings),
                "resolved": len([f for f in severity_findings if f.resolved]),
                "unresolved": len([f for f in severity_findings if not f.resolved])
            }
        
        # 准备发现详情文本
        findings_text = ""
        for i, finding in enumerate(period_findings):
            findings_text += f"{i+1}. Severity: {finding.severity.value}\n"
            findings_text += f"   Description: {finding.description}\n"
            findings_text += f"   Scope: {finding.scope.value}\n"
            findings_text += f"   Agent: {finding.agent_id}\n"
            findings_text += f"   Task: {finding.task_id}\n"
            findings_text += f"   Resolved: {finding.resolved}\n"
            if finding.recommendation:
                findings_text += f"   Recommendation: {finding.recommendation}\n"
            findings_text += "\n"
        
        # 准备提示词
        prompt = self.prompt_templates.get("report_generation", "")
        prompt = prompt.format(
            period_start=period_start.isoformat(),
            period_end=period_end.isoformat(),
            findings=findings_text
        )
        
        try:
            # 调用LLM生成报告
            report_content = self._call_llm(prompt)
            
            # 创建审核报告
            report = AuditReport(
                agent_id=self.id,
                period_start=period_start,
                period_end=period_end,
                findings=period_findings,
                summary={
                    "findings_summary": findings_summary,
                    "monitored_agents": list(self.monitored_agents),
                    "monitored_tasks": list(self.monitored_tasks),
                    "report_content": report_content
                }
            )
            self.audit_reports.append(report)
            
            # 更新上次报告时间
            self.last_report_time = period_end
            
            # 创建动作发送报告
            action = AgentAction(
                agent_id=self.id,
                action_type="send_report",
                parameters={
                    "report_id": report.id,
                    "report_type": "audit",
                    "period_start": period_start.isoformat(),
                    "period_end": period_end.isoformat(),
                    "summary": report.summary,
                    "findings_count": len(period_findings)
                }
            )
            
            logger.info(f"Audit agent {self.id} generated report: {report.id}")
            return action
        
        except Exception as e:
            logger.error(f"Failed to generate audit report: {e}")
            
            # 创建一个基本的报告动作
            action = AgentAction(
                agent_id=self.id,
                action_type="report_error",
                parameters={
                    "error": f"Failed to generate audit report: {str(e)}",
                    "period_start": period_start.isoformat(),
                    "period_end": period_end.isoformat()
                }
            )
            return action
    
    def _alert_critical_findings(self, findings: List[AuditFinding]) -> AgentAction:
        """警报严重发现
        
        Args:
            findings: 发现列表
            
        Returns:
            AgentAction: 智能体动作
        """
        # 准备发现详情
        findings_details = []
        for finding in findings:
            findings_details.append({
                "id": finding.id,
                "timestamp": finding.timestamp.isoformat(),
                "scope": finding.scope.value,
                "agent_id": finding.agent_id,
                "task_id": finding.task_id,
                "description": finding.description,
                "recommendation": finding.recommendation
            })
        
        # 创建动作发送警报
        action = AgentAction(
            agent_id=self.id,
            action_type="send_alert",
            parameters={
                "alert_type": "critical_findings",
                "findings": findings_details,
                "count": len(findings),
                "timestamp": datetime.now().isoformat()
            }
        )
        
        logger.info(f"Audit agent {self.id} sent alert for {len(findings)} critical findings")
        return action
    
    def _cache_audit_record(self, observation: AgentObservation) -> None:
        """缓存审计记录
        
        Args:
            observation: 智能体观察
        """
        # 创建审计记录哈希
        record_hash = hashlib.sha256()
        record_hash.update(observation.source.encode())
        record_hash.update(str(observation.timestamp).encode())
        record_hash.update(json.dumps(observation.data, sort_keys=True).encode())
        
        # 创建审计记录
        audit_record = {
            "hash": record_hash.hexdigest(),
            "timestamp": observation.timestamp.isoformat(),
            "source": observation.source,
            "data": observation.data
        }
        
        # 添加到缓存
        self.audit_records_cache.append(audit_record)
        
        # 如果缓存超过最大大小，移除最旧的记录
        if len(self.audit_records_cache) > self.max_cache_size:
            self.audit_records_cache = self.audit_records_cache[-self.max_cache_size:]
    
    def get_findings(self, scope: Optional[AuditScope] = None, severity: Optional[AuditSeverity] = None, 
                     resolved: Optional[bool] = None, agent_id: Optional[str] = None, 
                     task_id: Optional[str] = None, start_time: Optional[datetime] = None, 
                     end_time: Optional[datetime] = None) -> List[AuditFinding]:
        """获取审核发现
        
        Args:
            scope: 审核范围
            severity: 严重性
            resolved: 是否已解决
            agent_id: 智能体ID
            task_id: 任务ID
            start_time: 开始时间
            end_time: 结束时间
            
        Returns:
            List[AuditFinding]: 审核发现列表
        """
        findings = self.audit_findings
        
        # 应用过滤器
        if scope is not None:
            findings = [f for f in findings if f.scope == scope]
        
        if severity is not None:
            findings = [f for f in findings if f.severity == severity]
        
        if resolved is not None:
            findings = [f for f in findings if f.resolved == resolved]
        
        if agent_id is not None:
            findings = [f for f in findings if f.agent_id == agent_id]
        
        if task_id is not None:
            findings = [f for f in findings if f.task_id == task_id]
        
        if start_time is not None:
            findings = [f for f in findings if f.timestamp >= start_time]
        
        if end_time is not None:
            findings = [f for f in findings if f.timestamp <= end_time]
        
        return findings
    
    def get_reports(self, start_time: Optional[datetime] = None, end_time: Optional[datetime] = None) -> List[AuditReport]:
        """获取审核报告
        
        Args:
            start_time: 开始时间
            end_time: 结束时间
            
        Returns:
            List[AuditReport]: 审核报告列表
        """
        reports = self.audit_reports
        
        # 应用过滤器
        if start_time is not None:
            reports = [r for r in reports if r.period_end >= start_time]
        
        if end_time is not None:
            reports = [r for r in reports if r.period_start <= end_time]
        
        return reports
    
    def resolve_finding(self, finding_id: str, resolution_description: str) -> bool:
        """解决审核发现
        
        Args:
            finding_id: 发现ID
            resolution_description: 解决描述
            
        Returns:
            bool: 是否成功
        """
        for finding in self.audit_findings:
            if finding.id == finding_id:
                finding.resolve(resolution_description)
                logger.info(f"Audit agent {self.id} resolved finding: {finding_id}")
                return True
        
        logger.warning(f"Audit agent {self.id} failed to resolve finding: {finding_id} (not found)")
        return False
    
    def add_audit_rule(self, rule: AuditRule) -> None:
        """添加审核规则
        
        Args:
            rule: 规则
        """
        self.audit_rules.append(rule)
        logger.info(f"Audit agent {self.id} added rule: {rule.id}")
    
    def remove_audit_rule(self, rule_id: str) -> bool:
        """移除审核规则
        
        Args:
            rule_id: 规则ID
            
        Returns:
            bool: 是否成功
        """
        for i, rule in enumerate(self.audit_rules):
            if rule.id == rule_id:
                self.audit_rules.pop(i)
                logger.info(f"Audit agent {self.id} removed rule: {rule_id}")
                return True
        
        logger.warning(f"Audit agent {self.id} failed to remove rule: {rule_id} (not found)")
        return False
    
    def enable_audit_rule(self, rule_id: str) -> bool:
        """启用审核规则
        
        Args:
            rule_id: 规则ID
            
        Returns:
            bool: 是否成功
        """
        for rule in self.audit_rules:
            if rule.id == rule_id:
                rule.enabled = True
                logger.info(f"Audit agent {self.id} enabled rule: {rule_id}")
                return True
        
        logger.warning(f"Audit agent {self.id} failed to enable rule: {rule_id} (not found)")
        return False
    
    def disable_audit_rule(self, rule_id: str) -> bool:
        """禁用审核规则
        
        Args:
            rule_id: 规则ID
            
        Returns:
            bool: 是否成功
        """
        for rule in self.audit_rules:
            if rule.id == rule_id:
                rule.enabled = False
                logger.info(f"Audit agent {self.id} disabled rule: {rule_id}")
                return True
        
        logger.warning(f"Audit agent {self.id} failed to disable rule: {rule_id} (not found)")
        return False
    
    def _process_result_impl(self, result: AgentResult) -> None:
        """处理结果实现
        
        Args:
            result: 智能体结果
        """
        # 检查结果是否成功
        if not result.success:
            logger.error(f"Audit agent {self.id} received error: {result.error}")
            return
        
        # 获取动作类型
        action_type = result.data.get("action_type")
        
        # 处理发送报告结果
        if action_type == "send_report":
            logger.info(f"Audit agent {self.id} successfully sent report")
        
        # 处理发送警报结果
        elif action_type == "send_alert":
            logger.info(f"Audit agent {self.id} successfully sent alert")
    
    def _shutdown_impl(self) -> None:
        """关闭实现"""
        # 生成最终报告
        try:
            self._generate_audit_report()
        except Exception as e:
            logger.error(f"Failed to generate final audit report: {e}")
        
        # 清理资源
        self.monitored_agents = set()
        self.monitored_tasks = set()
        self.audit_records_cache = []
        
        logger.info(f"Audit agent {self.id} shut down")


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
        
        if "plan audit" in prompt.lower():
            return self._mock_plan_audit()
        elif "execution audit" in prompt.lower():
            return self._mock_execution_audit()
        elif "security audit" in prompt.lower():
            return self._mock_security_audit()
        elif "report" in prompt.lower():
            return self._mock_report_generation()
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
    
    def _mock_plan_audit(self) -> Dict[str, Any]:
        """模拟计划审核响应
        
        Returns:
            Dict[str, Any]: 响应
        """
        return {
            "choices": [
                {
                    "message": {
                        "content": "```json\n[\n  {\n    \"description\": \"Potential cycle detected in task dependencies\",\n    \"severity\": \"warning\",\n    \"recommendation\": \"Review the dependencies between tasks A, B, and C to ensure there are no circular references.\"\n  },\n  {\n    \"description\": \"Unreachable node in the task graph\",\n    \"severity\": \"error\",\n    \"recommendation\": \"Add appropriate dependencies to ensure all nodes are reachable from the start node.\"\n  }\n]\n```"
                    }
                }
            ]
        }
    
    def _mock_execution_audit(self) -> Dict[str, Any]:
        """模拟执行审核响应
        
        Returns:
            Dict[str, Any]: 响应
        """
        return {
            "choices": [
                {
                    "message": {
                        "content": "```json\n[\n  {\n    \"description\": \"Execution time exceeded estimated duration\",\n    \"severity\": \"warning\",\n    \"recommendation\": \"Review the task implementation for potential optimizations or adjust the estimated duration.\"\n  },\n  {\n    \"description\": \"Memory usage approaching allocation limit\",\n    \"severity\": \"info\",\n    \"recommendation\": \"Monitor memory usage and consider increasing allocation if needed.\"\n  }\n]\n```"
                    }
                }
            ]
        }
    
    def _mock_security_audit(self) -> Dict[str, Any]:
        """模拟安全审核响应
        
        Returns:
            Dict[str, Any]: 响应
        """
        return {
            "choices": [
                {
                    "message": {
                        "content": "```json\n[\n  {\n    \"description\": \"Unusual access pattern detected\",\n    \"severity\": \"critical\",\n    \"recommendation\": \"Investigate the access pattern and verify if it's authorized.\"\n  }\n]\n```"
                    }
                }
            ]
        }
    
    def _mock_report_generation(self) -> Dict[str, Any]:
        """模拟报告生成响应
        
        Returns:
            Dict[str, Any]: 响应
        """
        return {
            "choices": [
                {
                    "message": {
                        "content": "# Audit Report\n\n## Executive Summary\nDuring the audit period, several issues were identified across different scopes. The most critical issues were related to security, while several warnings were found in task planning and execution.\n\n## Key Findings by Severity\n\n### Critical (1)\n- Unusual access pattern detected\n\n### Error (1)\n- Unreachable node in the task graph\n\n### Warning (2)\n- Potential cycle detected in task dependencies\n- Execution time exceeded estimated duration\n\n### Info (1)\n- Memory usage approaching allocation limit\n\n## Recommendations\n1. Investigate the unusual access pattern to ensure system security\n2. Review task dependencies to eliminate cycles and unreachable nodes\n3. Optimize task execution to reduce execution time\n4. Monitor memory usage and adjust allocations as needed\n\n## Conclusion\nThe system is generally functioning as expected, but there are several areas that require attention to improve reliability, performance, and security."
                    }
                }
            ]
        }