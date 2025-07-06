"""共识验证算法模块

该模块实现了基于BFT的快速投票机制，确保智能体之间的语义理解一致性。
"""

import uuid
import time
import json
from enum import Enum
from typing import Dict, List, Set, Optional, Any, Tuple, Callable, Union
from datetime import datetime
from pydantic import BaseModel, Field, validator
from loguru import logger

from efiagent.core.ontology import DynamicOntology, OntologyConcept


class ConsensusStatus(str, Enum):
    """共识状态枚举"""
    PENDING = "pending"  # 待处理
    VOTING = "voting"  # 投票中
    ACHIEVED = "achieved"  # 已达成共识
    FAILED = "failed"  # 未达成共识
    TIMEOUT = "timeout"  # 超时


class VoteType(str, Enum):
    """投票类型枚举"""
    APPROVE = "approve"  # 同意
    REJECT = "reject"  # 拒绝
    ABSTAIN = "abstain"  # 弃权


class Vote(BaseModel):
    """投票"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    agent_id: str  # 投票智能体ID
    vote_type: VoteType  # 投票类型
    reason: Optional[str] = None  # 投票理由
    confidence: float = 1.0  # 置信度
    timestamp: datetime = Field(default_factory=datetime.now)  # 时间戳
    metadata: Dict[str, Any] = Field(default_factory=dict)  # 元数据


class ConsensusProposal(BaseModel):
    """共识提案"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    topic: str  # 提案主题
    description: str  # 提案描述
    proposer_id: str  # 提案者ID
    semantic_content: Dict[str, Any]  # 语义内容
    context: Dict[str, Any] = Field(default_factory=dict)  # 上下文
    created_at: datetime = Field(default_factory=datetime.now)  # 创建时间
    deadline: Optional[datetime] = None  # 截止时间
    min_votes_required: int = 1  # 最小投票数
    quorum_percentage: float = 0.75  # 法定人数百分比（默认3/4）
    metadata: Dict[str, Any] = Field(default_factory=dict)  # 元数据


class ConsensusSession(BaseModel):
    """共识会话"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    proposal: ConsensusProposal  # 提案
    status: ConsensusStatus = ConsensusStatus.PENDING  # 状态
    votes: Dict[str, Vote] = Field(default_factory=dict)  # 投票，键为投票ID
    eligible_agents: List[str] = Field(default_factory=list)  # 有资格投票的智能体ID列表
    started_at: datetime = Field(default_factory=datetime.now)  # 开始时间
    ended_at: Optional[datetime] = None  # 结束时间
    result: Optional[bool] = None  # 结果
    result_reason: Optional[str] = None  # 结果理由
    metadata: Dict[str, Any] = Field(default_factory=dict)  # 元数据


class ConsensusVerifier:
    """共识验证器
    
    实现基于BFT的快速投票机制，确保3/4以上Agent确认语义理解一致性后方执行任务
    """
    def __init__(self, ontology: Optional[DynamicOntology] = None):
        """初始化共识验证器
        
        Args:
            ontology: 动态本体库，用于语义验证
        """
        self.sessions: Dict[str, ConsensusSession] = {}  # 会话字典，键为会话ID
        self.ontology = ontology or DynamicOntology()  # 动态本体库
        self.on_consensus_achieved: Optional[Callable[[str, ConsensusSession], None]] = None  # 达成共识回调
        self.on_consensus_failed: Optional[Callable[[str, ConsensusSession], None]] = None  # 未达成共识回调
        self.on_vote_received: Optional[Callable[[str, Vote], None]] = None  # 收到投票回调
    
    def create_session(self, proposal: ConsensusProposal, eligible_agents: List[str]) -> str:
        """创建共识会话
        
        Args:
            proposal: 提案
            eligible_agents: 有资格投票的智能体ID列表
            
        Returns:
            str: 会话ID
        """
        session = ConsensusSession(
            proposal=proposal,
            eligible_agents=eligible_agents,
            status=ConsensusStatus.PENDING
        )
        self.sessions[session.id] = session
        return session.id
    
    def start_session(self, session_id: str) -> bool:
        """开始共识会话
        
        Args:
            session_id: 会话ID
            
        Returns:
            bool: 是否成功
            
        Raises:
            ValueError: 会话不存在或状态不是待处理
        """
        if session_id not in self.sessions:
            raise ValueError(f"会话不存在: {session_id}")
        
        session = self.sessions[session_id]
        if session.status != ConsensusStatus.PENDING:
            raise ValueError(f"会话状态不是待处理: {session.status}")
        
        session.status = ConsensusStatus.VOTING
        session.started_at = datetime.now()
        return True
    
    def submit_vote(self, session_id: str, vote: Vote) -> bool:
        """提交投票
        
        Args:
            session_id: 会话ID
            vote: 投票
            
        Returns:
            bool: 是否成功
            
        Raises:
            ValueError: 会话不存在、状态不是投票中或智能体无资格投票
        """
        if session_id not in self.sessions:
            raise ValueError(f"会话不存在: {session_id}")
        
        session = self.sessions[session_id]
        if session.status != ConsensusStatus.VOTING:
            raise ValueError(f"会话状态不是投票中: {session.status}")
        
        if vote.agent_id not in session.eligible_agents:
            raise ValueError(f"智能体无资格投票: {vote.agent_id}")
        
        # 检查是否已投票
        for existing_vote in session.votes.values():
            if existing_vote.agent_id == vote.agent_id:
                # 更新投票
                session.votes[vote.id] = vote
                break
        else:
            # 添加新投票
            session.votes[vote.id] = vote
        
        # 触发回调
        if self.on_vote_received:
            self.on_vote_received(session_id, vote)
        
        # 检查是否达成共识
        self._check_consensus(session_id)
        
        return True
    
    def _check_consensus(self, session_id: str) -> None:
        """检查是否达成共识
        
        Args:
            session_id: 会话ID
        """
        session = self.sessions[session_id]
        proposal = session.proposal
        
        # 检查是否达到最小投票数
        if len(session.votes) < proposal.min_votes_required:
            return
        
        # 计算投票结果
        approve_votes = []
        reject_votes = []
        abstain_votes = []
        
        for vote in session.votes.values():
            if vote.vote_type == VoteType.APPROVE:
                approve_votes.append(vote)
            elif vote.vote_type == VoteType.REJECT:
                reject_votes.append(vote)
            elif vote.vote_type == VoteType.ABSTAIN:
                abstain_votes.append(vote)
        
        # 计算法定人数
        quorum = int(len(session.eligible_agents) * proposal.quorum_percentage)
        
        # 检查是否达成共识
        if len(approve_votes) >= quorum:
            self._achieve_consensus(session_id, True, f"达到法定人数: {len(approve_votes)}/{quorum}")
        elif len(reject_votes) >= quorum:
            self._achieve_consensus(session_id, False, f"拒绝票达到法定人数: {len(reject_votes)}/{quorum}")
        elif len(session.votes) == len(session.eligible_agents):
            # 所有智能体都已投票，但未达成共识
            self._achieve_consensus(session_id, False, "所有智能体都已投票，但未达成共识")
        
        # 检查截止时间
        if proposal.deadline and datetime.now() > proposal.deadline:
            if session.status == ConsensusStatus.VOTING:
                self._achieve_consensus(session_id, False, "投票超时")
                session.status = ConsensusStatus.TIMEOUT
    
    def _achieve_consensus(self, session_id: str, result: bool, reason: str) -> None:
        """达成共识
        
        Args:
            session_id: 会话ID
            result: 结果
            reason: 理由
        """
        session = self.sessions[session_id]
        session.status = ConsensusStatus.ACHIEVED if result else ConsensusStatus.FAILED
        session.ended_at = datetime.now()
        session.result = result
        session.result_reason = reason
        
        # 触发回调
        if result and self.on_consensus_achieved:
            self.on_consensus_achieved(session_id, session)
        elif not result and self.on_consensus_failed:
            self.on_consensus_failed(session_id, session)
    
    def get_session(self, session_id: str) -> Optional[ConsensusSession]:
        """获取会话
        
        Args:
            session_id: 会话ID
            
        Returns:
            Optional[ConsensusSession]: 会话，如果不存在则返回None
        """
        return self.sessions.get(session_id)
    
    def get_session_status(self, session_id: str) -> Optional[ConsensusStatus]:
        """获取会话状态
        
        Args:
            session_id: 会话ID
            
        Returns:
            Optional[ConsensusStatus]: 状态，如果会话不存在则返回None
        """
        session = self.get_session(session_id)
        return session.status if session else None
    
    def get_session_result(self, session_id: str) -> Tuple[Optional[bool], Optional[str]]:
        """获取会话结果
        
        Args:
            session_id: 会话ID
            
        Returns:
            Tuple[Optional[bool], Optional[str]]: (结果, 理由)，如果会话不存在或未结束则返回(None, None)
        """
        session = self.get_session(session_id)
        if not session or session.status in [ConsensusStatus.PENDING, ConsensusStatus.VOTING]:
            return None, None
        return session.result, session.result_reason
    
    def verify_semantic_consistency(self, semantic_content: Dict[str, Any], 
                                   context: Dict[str, Any] = None) -> Tuple[bool, float, str]:
        """验证语义一致性
        
        Args:
            semantic_content: 语义内容
            context: 上下文
            
        Returns:
            Tuple[bool, float, str]: (是否一致, 一致性分数, 原因)
        """
        # 如果没有本体库，无法验证
        if not self.ontology:
            return True, 1.0, "无本体库，跳过验证"
        
        # 提取概念和意图
        concept_name = semantic_content.get("concept")
        intent = semantic_content.get("action")
        
        if not concept_name:
            return False, 0.0, "缺少概念名称"
        
        # 查找概念
        concepts = self.ontology.find_concepts_by_name(concept_name)
        if not concepts:
            return False, 0.0, f"概念不存在: {concept_name}"
        
        # 消歧概念
        disambiguated_concepts = self.ontology.disambiguate_term(concept_name, context)
        if not disambiguated_concepts:
            return False, 0.0, f"无法消歧概念: {concept_name}"
        
        # 获取最匹配的概念
        best_concept, confidence = disambiguated_concepts[0]
        
        # 验证语义一致性
        interpretation = {
            "properties": semantic_content.get("params", {}),
            "relations": []
        }
        
        # 如果有意图，添加到关系中
        if intent:
            interpretation["relations"].append({
                "type": "has_action",
                "target": intent
            })
        
        # 验证一致性
        is_consistent, consistency_score, reason = self.ontology.verify_semantic_consistency(
            best_concept.id, interpretation
        )
        
        # 综合评分
        final_score = confidence * consistency_score
        final_consistent = final_score >= 0.75  # 阈值
        
        return final_consistent, final_score, reason
    
    def create_semantic_verification_session(self, semantic_content: Dict[str, Any], 
                                            context: Dict[str, Any], proposer_id: str, 
                                            eligible_agents: List[str], 
                                            deadline_seconds: int = 30) -> str:
        """创建语义验证会话
        
        Args:
            semantic_content: 语义内容
            context: 上下文
            proposer_id: 提案者ID
            eligible_agents: 有资格投票的智能体ID列表
            deadline_seconds: 截止时间（秒）
            
        Returns:
            str: 会话ID
        """
        # 创建提案
        concept_name = semantic_content.get("concept", "未知概念")
        action = semantic_content.get("action", "未知操作")
        
        proposal = ConsensusProposal(
            topic=f"语义验证: {concept_name}.{action}",
            description=f"验证语义理解的一致性: {json.dumps(semantic_content, ensure_ascii=False)}",
            proposer_id=proposer_id,
            semantic_content=semantic_content,
            context=context,
            min_votes_required=max(1, len(eligible_agents) // 2),  # 至少一半智能体投票
            quorum_percentage=0.75,  # 3/4法定人数
            deadline=datetime.now().timestamp() + deadline_seconds if deadline_seconds > 0 else None
        )
        
        # 创建会话
        session_id = self.create_session(proposal, eligible_agents)
        
        # 开始会话
        self.start_session(session_id)
        
        return session_id
    
    def cleanup_old_sessions(self, max_age_hours: int = 24) -> int:
        """清理旧会话
        
        Args:
            max_age_hours: 最大年龄（小时）
            
        Returns:
            int: 清理的会话数
        """
        now = datetime.now()
        max_age = now.timestamp() - (max_age_hours * 3600)
        
        to_remove = []
        for session_id, session in self.sessions.items():
            if session.started_at.timestamp() < max_age:
                to_remove.append(session_id)
        
        for session_id in to_remove:
            del self.sessions[session_id]
        
        return len(to_remove)