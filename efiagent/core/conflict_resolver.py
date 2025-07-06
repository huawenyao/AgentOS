"""冲突消解机制模块

该模块实现了智能体之间的冲突检测和消解机制，支持基于规则、投票和元调度的三级仲裁协议。
"""

import uuid
from typing import Dict, List, Set, Optional, Any, Tuple, Callable, Union
from enum import Enum
from datetime import datetime
from pydantic import BaseModel, Field
from loguru import logger


class ConflictType(str, Enum):
    """冲突类型枚举"""
    RESOURCE_CONTENTION = "resource_contention"  # 资源争用
    GOAL_CONTRADICTION = "goal_contradiction"  # 目标矛盾
    KNOWLEDGE_INCONSISTENCY = "knowledge_inconsistency"  # 知识不一致
    PERMISSION_VIOLATION = "permission_violation"  # 权限违规
    COMPLIANCE_VIOLATION = "compliance_violation"  # 合规违规
    SAFETY_RISK = "safety_risk"  # 安全风险
    CUSTOM = "custom"  # 自定义


class ConflictSeverity(int, Enum):
    """冲突严重程度枚举"""
    LOW = 0  # 低严重度，可自动解决
    MEDIUM = 1  # 中等严重度，需要投票解决
    HIGH = 2  # 高严重度，需要元调度中心介入
    CRITICAL = 3  # 关键严重度，需要人工干预


class ConflictStatus(str, Enum):
    """冲突状态枚举"""
    DETECTED = "detected"  # 已检测
    RESOLVING = "resolving"  # 解决中
    RESOLVED = "resolved"  # 已解决
    ESCALATED = "escalated"  # 已升级
    REJECTED = "rejected"  # 已拒绝


class ConflictResolutionStrategy(str, Enum):
    """冲突解决策略枚举"""
    RULE_BASED = "rule_based"  # 基于规则
    VOTING = "voting"  # 投票
    PRIORITY_BASED = "priority_based"  # 基于优先级
    META_SCHEDULING = "meta_scheduling"  # 元调度
    HUMAN_INTERVENTION = "human_intervention"  # 人工干预


class VoteOption(str, Enum):
    """投票选项枚举"""
    APPROVE = "approve"  # 同意
    REJECT = "reject"  # 拒绝
    ABSTAIN = "abstain"  # 弃权


class Vote(BaseModel):
    """投票"""
    agent_id: str  # 投票智能体ID
    option: VoteOption  # 投票选项
    reason: Optional[str] = None  # 投票理由
    timestamp: datetime = Field(default_factory=datetime.now)  # 投票时间


class ConflictEvidence(BaseModel):
    """冲突证据"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    agent_id: str  # 提供证据的智能体ID
    evidence_type: str  # 证据类型
    content: Any  # 证据内容
    timestamp: datetime = Field(default_factory=datetime.now)  # 提交时间


class ConflictResolution(BaseModel):
    """冲突解决方案"""
    strategy: ConflictResolutionStrategy  # 解决策略
    resolution_agent_id: Optional[str] = None  # 解决冲突的智能体ID
    action: str  # 解决行动
    rationale: str  # 解决理由
    timestamp: datetime = Field(default_factory=datetime.now)  # 解决时间


class Conflict(BaseModel):
    """冲突"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    type: ConflictType  # 冲突类型
    severity: ConflictSeverity  # 严重程度
    status: ConflictStatus = ConflictStatus.DETECTED  # 冲突状态
    description: str  # 冲突描述
    involved_agents: List[str]  # 涉及的智能体ID列表
    detected_by: str  # 检测冲突的智能体ID
    resource_id: Optional[str] = None  # 冲突资源ID
    task_id: Optional[str] = None  # 相关任务ID
    evidences: List[ConflictEvidence] = Field(default_factory=list)  # 冲突证据列表
    votes: Dict[str, Vote] = Field(default_factory=dict)  # 投票字典，键为智能体ID
    resolution: Optional[ConflictResolution] = None  # 解决方案
    created_at: datetime = Field(default_factory=datetime.now)  # 创建时间
    updated_at: datetime = Field(default_factory=datetime.now)  # 更新时间
    resolved_at: Optional[datetime] = None  # 解决时间
    
    def add_evidence(self, agent_id: str, evidence_type: str, content: Any) -> str:
        """添加冲突证据
        
        Args:
            agent_id: 提供证据的智能体ID
            evidence_type: 证据类型
            content: 证据内容
            
        Returns:
            str: 证据ID
        """
        evidence = ConflictEvidence(
            agent_id=agent_id,
            evidence_type=evidence_type,
            content=content
        )
        self.evidences.append(evidence)
        self.updated_at = datetime.now()
        return evidence.id
    
    def add_vote(self, agent_id: str, option: VoteOption, reason: Optional[str] = None) -> None:
        """添加投票
        
        Args:
            agent_id: 投票智能体ID
            option: 投票选项
            reason: 投票理由
        """
        self.votes[agent_id] = Vote(
            agent_id=agent_id,
            option=option,
            reason=reason
        )
        self.updated_at = datetime.now()
    
    def resolve(self, strategy: ConflictResolutionStrategy, action: str, rationale: str, 
                resolution_agent_id: Optional[str] = None) -> None:
        """解决冲突
        
        Args:
            strategy: 解决策略
            action: 解决行动
            rationale: 解决理由
            resolution_agent_id: 解决冲突的智能体ID
        """
        self.resolution = ConflictResolution(
            strategy=strategy,
            resolution_agent_id=resolution_agent_id,
            action=action,
            rationale=rationale
        )
        self.status = ConflictStatus.RESOLVED
        self.resolved_at = datetime.now()
        self.updated_at = datetime.now()
    
    def escalate(self) -> None:
        """升级冲突"""
        self.status = ConflictStatus.ESCALATED
        self.updated_at = datetime.now()
    
    def reject(self) -> None:
        """拒绝冲突"""
        self.status = ConflictStatus.REJECTED
        self.updated_at = datetime.now()
    
    def get_vote_result(self) -> Tuple[int, int, int]:
        """获取投票结果
        
        Returns:
            Tuple[int, int, int]: (同意票数, 拒绝票数, 弃权票数)
        """
        approve_count = sum(1 for vote in self.votes.values() if vote.option == VoteOption.APPROVE)
        reject_count = sum(1 for vote in self.votes.values() if vote.option == VoteOption.REJECT)
        abstain_count = sum(1 for vote in self.votes.values() if vote.option == VoteOption.ABSTAIN)
        return approve_count, reject_count, abstain_count


class ComplianceRule(BaseModel):
    """合规规则"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str  # 规则名称
    description: str  # 规则描述
    domain: str  # 适用领域
    priority: int = 0  # 规则优先级
    condition: str  # 触发条件（可以是代码或自然语言描述）
    action: str  # 触发动作（可以是代码或自然语言描述）
    created_at: datetime = Field(default_factory=datetime.now)  # 创建时间
    updated_at: datetime = Field(default_factory=datetime.now)  # 更新时间


class ConflictResolver:
    """冲突消解器
    
    实现三级仲裁协议：
    1. 规则引擎预过滤（如金融合规条款）
    2. Agent组投票（BFT共识）
    3. 元调度中心终裁
    """
    def __init__(self):
        """初始化冲突消解器"""
        self.conflicts: Dict[str, Conflict] = {}  # 冲突字典，键为冲突ID
        self.rules: Dict[str, ComplianceRule] = {}  # 规则字典，键为规则ID
        self.on_conflict_resolved: Optional[Callable[[Conflict], None]] = None  # 冲突解决回调
        self.on_conflict_escalated: Optional[Callable[[Conflict], None]] = None  # 冲突升级回调
    
    def add_rule(self, rule: ComplianceRule) -> str:
        """添加规则
        
        Args:
            rule: 合规规则
            
        Returns:
            str: 规则ID
        """
        self.rules[rule.id] = rule
        return rule.id
    
    def remove_rule(self, rule_id: str) -> None:
        """删除规则
        
        Args:
            rule_id: 规则ID
            
        Raises:
            ValueError: 规则ID不存在
        """
        if rule_id not in self.rules:
            raise ValueError(f"规则ID不存在: {rule_id}")
        del self.rules[rule_id]
    
    def register_conflict(self, conflict: Conflict) -> str:
        """注册冲突
        
        Args:
            conflict: 冲突对象
            
        Returns:
            str: 冲突ID
        """
        self.conflicts[conflict.id] = conflict
        return conflict.id
    
    def get_conflict(self, conflict_id: str) -> Conflict:
        """获取冲突
        
        Args:
            conflict_id: 冲突ID
            
        Returns:
            Conflict: 冲突对象
            
        Raises:
            ValueError: 冲突ID不存在
        """
        if conflict_id not in self.conflicts:
            raise ValueError(f"冲突ID不存在: {conflict_id}")
        return self.conflicts[conflict_id]
    
    def resolve_conflict_by_rule(self, conflict_id: str) -> bool:
        """通过规则解决冲突（第一级仲裁）
        
        Args:
            conflict_id: 冲突ID
            
        Returns:
            bool: 是否成功解决
            
        Raises:
            ValueError: 冲突ID不存在
        """
        conflict = self.get_conflict(conflict_id)
        
        # 按优先级排序规则
        sorted_rules = sorted(self.rules.values(), key=lambda r: r.priority, reverse=True)
        
        for rule in sorted_rules:
            # 这里简化了规则匹配逻辑，实际应用中可能需要更复杂的规则引擎
            if self._match_rule(conflict, rule):
                # 应用规则解决冲突
                conflict.resolve(
                    strategy=ConflictResolutionStrategy.RULE_BASED,
                    action=rule.action,
                    rationale=f"根据规则 '{rule.name}' 自动解决",
                    resolution_agent_id=None  # 规则引擎解决，没有具体智能体
                )
                
                # 触发回调
                if self.on_conflict_resolved:
                    self.on_conflict_resolved(conflict)
                
                return True
        
        return False
    
    def resolve_conflict_by_voting(self, conflict_id: str, quorum_percentage: float = 0.67, 
                                   min_voters: int = 3) -> bool:
        """通过投票解决冲突（第二级仲裁）
        
        使用拜占庭容错(BFT)共识机制，需要超过quorum_percentage的投票率和同意票
        
        Args:
            conflict_id: 冲突ID
            quorum_percentage: 法定人数百分比（默认2/3）
            min_voters: 最小投票人数
            
        Returns:
            bool: 是否成功解决
            
        Raises:
            ValueError: 冲突ID不存在
        """
        conflict = self.get_conflict(conflict_id)
        
        # 获取投票结果
        approve_count, reject_count, abstain_count = conflict.get_vote_result()
        total_votes = approve_count + reject_count + abstain_count
        total_agents = len(conflict.involved_agents)
        
        # 检查是否达到最小投票人数
        if total_votes < min_voters:
            return False
        
        # 检查是否达到法定人数
        if total_votes < total_agents * quorum_percentage:
            return False
        
        # 检查是否达成共识
        if approve_count > total_votes * quorum_percentage:
            # 同意票超过法定人数比例，解决冲突
            conflict.resolve(
                strategy=ConflictResolutionStrategy.VOTING,
                action="根据多数投票结果执行原提案",
                rationale=f"投票结果: {approve_count}同意, {reject_count}拒绝, {abstain_count}弃权",
                resolution_agent_id=None  # 集体决策，没有具体智能体
            )
            
            # 触发回调
            if self.on_conflict_resolved:
                self.on_conflict_resolved(conflict)
            
            return True
        elif reject_count > total_votes * quorum_percentage:
            # 拒绝票超过法定人数比例，拒绝冲突
            conflict.reject()
            return True
        
        return False
    
    def escalate_to_meta_scheduler(self, conflict_id: str) -> None:
        """升级到元调度中心（第三级仲裁）
        
        Args:
            conflict_id: 冲突ID
            
        Raises:
            ValueError: 冲突ID不存在
        """
        conflict = self.get_conflict(conflict_id)
        conflict.escalate()
        
        # 触发回调
        if self.on_conflict_escalated:
            self.on_conflict_escalated(conflict)
    
    def resolve_by_meta_scheduler(self, conflict_id: str, action: str, rationale: str, 
                                 resolution_agent_id: str) -> None:
        """由元调度中心解决冲突
        
        Args:
            conflict_id: 冲突ID
            action: 解决行动
            rationale: 解决理由
            resolution_agent_id: 解决冲突的智能体ID
            
        Raises:
            ValueError: 冲突ID不存在或冲突未升级
        """
        conflict = self.get_conflict(conflict_id)
        
        if conflict.status != ConflictStatus.ESCALATED:
            raise ValueError(f"冲突未升级，无法由元调度中心解决: {conflict_id}")
        
        conflict.resolve(
            strategy=ConflictResolutionStrategy.META_SCHEDULING,
            action=action,
            rationale=rationale,
            resolution_agent_id=resolution_agent_id
        )
        
        # 触发回调
        if self.on_conflict_resolved:
            self.on_conflict_resolved(conflict)
    
    def _match_rule(self, conflict: Conflict, rule: ComplianceRule) -> bool:
        """匹配规则
        
        检查冲突是否匹配规则条件
        
        Args:
            conflict: 冲突对象
            rule: 规则对象
            
        Returns:
            bool: 是否匹配
        """
        # 这里简化了规则匹配逻辑，实际应用中可能需要更复杂的规则引擎
        # 例如，可以使用规则语言或脚本引擎来评估条件
        
        # 简单示例：检查冲突类型和领域是否匹配
        if rule.domain == "all" or rule.domain in conflict.description.lower():
            if conflict.type.value in rule.condition.lower():
                return True
        
        return False
    
    def process_conflict(self, conflict_id: str) -> None:
        """处理冲突
        
        按照三级仲裁协议处理冲突：
        1. 尝试使用规则引擎解决
        2. 如果规则引擎无法解决，尝试使用投票解决
        3. 如果投票无法达成共识，升级到元调度中心
        
        Args:
            conflict_id: 冲突ID
            
        Raises:
            ValueError: 冲突ID不存在
        """
        conflict = self.get_conflict(conflict_id)
        
        # 检查冲突是否已解决
        if conflict.status in {ConflictStatus.RESOLVED, ConflictStatus.REJECTED}:
            return
        
        # 第一级：规则引擎
        if conflict.severity.value <= ConflictSeverity.LOW.value:
            if self.resolve_conflict_by_rule(conflict_id):
                return
        
        # 第二级：投票
        if conflict.severity.value <= ConflictSeverity.MEDIUM.value:
            if self.resolve_conflict_by_voting(conflict_id):
                return
        
        # 第三级：升级到元调度中心
        self.escalate_to_meta_scheduler(conflict_id)