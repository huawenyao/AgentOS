"""
EFIAgent 分布式状态管理系统
Implementation Date: 2024-01-16

基于Raft共识算法的分布式状态管理，确保智能体间状态一致性。
"""

import asyncio
import json
import time
import uuid
from typing import Dict, List, Optional, Any, Set, Tuple
from dataclasses import dataclass, field, asdict
from enum import Enum
from collections import defaultdict
import logging
import hashlib
import pickle
from abc import ABC, abstractmethod

import redis.asyncio as redis
import aiofiles
from pydantic import BaseModel, Field
import numpy as np

logger = logging.getLogger(__name__)

class StateOperation(Enum):
    """状态操作类型"""
    SET = "set"
    DELETE = "delete"
    INCREMENT = "increment"
    DECREMENT = "decrement"
    APPEND = "append"
    UPDATE = "update"

class LogEntry(BaseModel):
    """日志条目"""
    term: int = Field(description="任期号")
    index: int = Field(description="日志索引")
    operation: StateOperation = Field(description="操作类型")
    key: str = Field(description="键")
    value: Any = Field(description="值")
    timestamp: float = Field(default_factory=time.time, description="时间戳")
    client_id: str = Field(description="客户端ID")
    checksum: str = Field(description="数据校验和")

    def compute_checksum(self):
        """计算校验和"""
        data = f"{self.term}{self.index}{self.operation.value}{self.key}{self.value}{self.timestamp}{self.client_id}"
        self.checksum = hashlib.sha256(data.encode()).hexdigest()[:16]

class NodeState(Enum):
    """节点状态"""
    FOLLOWER = "follower"
    CANDIDATE = "candidate"
    LEADER = "leader"

@dataclass
class RaftNode:
    """Raft节点信息"""
    node_id: str
    endpoint: str
    last_heartbeat: float
    voted_for: Optional[str] = None
    current_term: int = 0
    commit_index: int = 0
    last_applied: int = 0
    state: NodeState = NodeState.FOLLOWER
    votes_received: Set[str] = field(default_factory=set)
    log: List[LogEntry] = field(default_factory=list)

class StateMachine(ABC):
    """状态机抽象基类"""

    @abstractmethod
    async def apply(self, entry: LogEntry) -> bool:
        """应用日志条目"""
        pass

    @abstractmethod
    async def get(self, key: str) -> Any:
        """获取状态值"""
        pass

    @abstractmethod
    async def snapshot(self) -> bytes:
        """创建快照"""
        pass

    @abstractmethod
    async def restore(self, snapshot: bytes) -> bool:
        """恢复快照"""
        pass

class MemoryStateMachine(StateMachine):
    """内存状态机"""

    def __init__(self):
        self.state = {}
        self._lock = asyncio.Lock()

    async def apply(self, entry: LogEntry) -> bool:
        """应用日志条目"""
        async with self._lock:
            try:
                if entry.operation == StateOperation.SET:
                    self.state[entry.key] = entry.value
                elif entry.operation == StateOperation.DELETE:
                    self.state.pop(entry.key, None)
                elif entry.operation == StateOperation.INCREMENT:
                    self.state[entry.key] = self.state.get(entry.key, 0) + entry.value
                elif entry.operation == StateOperation.DECREMENT:
                    self.state[entry.key] = self.state.get(entry.key, 0) - entry.value
                elif entry.operation == StateOperation.APPEND:
                    if entry.key not in self.state:
                        self.state[entry.key] = []
                    if isinstance(self.state[entry.key], list):
                        self.state[entry.key].append(entry.value)
                elif entry.operation == StateOperation.UPDATE:
                    if isinstance(self.state.get(entry.key), dict) and isinstance(entry.value, dict):
                        self.state[entry.key].update(entry.value)

                return True
            except Exception as e:
                logger.error(f"Failed to apply log entry: {e}")
                return False

    async def get(self, key: str) -> Any:
        """获取状态值"""
        async with self._lock:
            return self.state.get(key)

    async def snapshot(self) -> bytes:
        """创建快照"""
        async with self._lock:
            return pickle.dumps(self.state)

    async def restore(self, snapshot: bytes) -> bool:
        """恢复快照"""
        try:
            async with self._lock:
                self.state = pickle.loads(snapshot)
                return True
        except Exception as e:
            logger.error(f"Failed to restore snapshot: {e}")
            return False

class DistributedStateManager:
    """分布式状态管理器"""

    def __init__(
        self,
        node_id: str,
        cluster_nodes: List[str],
        redis_url: str = "redis://localhost:6379",
        election_timeout: float = 5.0,
        heartbeat_interval: float = 1.0
    ):
        self.node_id = node_id
        self.cluster_nodes = cluster_nodes
        self.redis_url = redis_url
        self.election_timeout = election_timeout
        self.heartbeat_interval = heartbeat_interval

        # Raft组件
        self.raft_node = RaftNode(node_id=node_id, endpoint="", last_heartbeat=time.time())
        self.state_machine = MemoryStateMachine()
        self.redis = None

        # 日志管理
        self.next_index = {}  # 节点 -> 下一个日志索引
        self.match_index = {}  # 节点 -> 已匹配日志索引

        # 后台任务
        self.background_tasks = []
        self.running = False

        # 性能统计
        self.stats = {
            'leadership_changes': 0,
            'log_entries_applied': 0,
            'elections_won': 0,
            'elections_lost': 0,
            'snapshot_count': 0,
            'state_size': 0
        }

    async def initialize(self):
        """初始化状态管理器"""
        try:
            # 连接Redis
            self.redis = redis.from_url(self.redis_url)

            # 初始化日志索引
            for node in self.cluster_nodes:
                if node != self.node_id:
                    self.next_index[node] = 1
                    self.match_index[node] = 0

            # 加载持久化数据
            await self._load_persistent_state()

            # 启动后台任务
            self.running = True
            self.background_tasks = [
                asyncio.create_task(self._election_timer()),
                asyncio.create_task(self._heartbeat_sender()),
                asyncio.create_task(self._log_applier()),
                asyncio.create_task(self._snapshot_manager())
            ]

            logger.info(f"Distributed state manager initialized for node {self.node_id}")

        except Exception as e:
            logger.error(f"Failed to initialize state manager: {e}")
            raise

    async def shutdown(self):
        """关闭状态管理器"""
        self.running = False

        # 取消后台任务
        for task in self.background_tasks:
            task.cancel()
            try:
                await task
            except asyncio.CancelledError:
                pass

        # 保存持久化数据
        await self._save_persistent_state()

        # 关闭连接
        if self.redis:
            await self.redis.close()

        logger.info(f"Distributed state manager shutdown for node {self.node_id}")

    async def set(self, key: str, value: Any) -> bool:
        """设置键值对"""
        return await self._replicate_operation(
            StateOperation.SET,
            key,
            value
        )

    async def get(self, key: str) -> Any:
        """获取值"""
        return await self.state_machine.get(key)

    async def delete(self, key: str) -> bool:
        """删除键"""
        return await self._replicate_operation(
            StateOperation.DELETE,
            key,
            None
        )

    async def increment(self, key: str, delta: int = 1) -> bool:
        """增加计数器"""
        return await self._replicate_operation(
            StateOperation.INCREMENT,
            key,
            delta
        )

    async def append(self, key: str, value: Any) -> bool:
        """追加到列表"""
        return await self._replicate_operation(
            StateOperation.APPEND,
            key,
            value
        )

    async def update(self, key: str, updates: Dict[str, Any]) -> bool:
        """更新字典"""
        return await self._replicate_operation(
            StateOperation.UPDATE,
            key,
            updates
        )

    async def _replicate_operation(
        self,
        operation: StateOperation,
        key: str,
        value: Any
    ) -> bool:
        """复制操作到集群"""
        if self.raft_node.state == NodeState.LEADER:
            # 领导者直接处理
            entry = LogEntry(
                term=self.raft_node.current_term,
                index=len(self.raft_node.log) + 1,
                operation=operation,
                key=key,
                value=value,
                client_id=self.node_id
            )
            entry.compute_checksum()

            self.raft_node.log.append(entry)
            return await self._replicate_log_entry(entry)

        else:
            # 转发给领导者
            return await self._forward_to_leader(operation, key, value)

    async def _replicate_log_entry(self, entry: LogEntry) -> bool:
        """复制日志条目到跟随者"""
        success_count = 1  # 领导者自己

        for follower_id in self.cluster_nodes:
            if follower_id == self.node_id:
                continue

            success = await self._send_append_entries(follower_id)
            if success:
                success_count += 1

        # 检查是否达到多数派
        quorum_size = len(self.cluster_nodes) // 2 + 1
        if success_count >= quorum_size:
            # 提交日志条目
            await self._commit_log_entry(entry)
            return True

        return False

    async def _send_append_entries(self, follower_id: str) -> bool:
        """发送追加条目RPC"""
        try:
            # 获取要发送的日志条目
            prev_log_index = self.next_index[follower_id] - 1
            prev_log_term = self.raft_node.log[prev_log_index - 1].term if prev_log_index > 0 else 0

            entries = self.raft_node.log[self.next_index[follower_id] - 1:]

            # 构造RPC消息
            rpc_data = {
                'term': self.raft_node.current_term,
                'leader_id': self.node_id,
                'prev_log_index': prev_log_index,
                'prev_log_term': prev_log_term,
                'entries': [entry.dict() for entry in entries],
                'leader_commit': self.raft_node.commit_index
            }

            # 发送到跟随者
            await self.redis.publish(
                f"raft:{follower_id}:append_entries",
                json.dumps(rpc_data)
            )

            return True

        except Exception as e:
            logger.error(f"Failed to send append entries to {follower_id}: {e}")
            return False

    async def _handle_append_entries(self, data: Dict[str, Any]):
        """处理追加条目RPC"""
        try:
            term = data['term']
            leader_id = data['leader_id']
            prev_log_index = data['prev_log_index']
            prev_log_term = data['prev_log_term']
            entries = [LogEntry(**entry) for entry in data['entries']]
            leader_commit = data['leader_commit']

            # 更新任期
            if term > self.raft_node.current_term:
                self.raft_node.current_term = term
                self.raft_node.state = NodeState.FOLLOWER
                self.raft_node.voted_for = None

            # 检查日志一致性
            if prev_log_index > 0:
                if (prev_log_index > len(self.raft_node.log) or
                    self.raft_node.log[prev_log_index - 1].term != prev_log_term):
                    # 日志不一致，拒绝追加
                    await self._send_append_entries_response(
                        leader_id,
                        False,
                        self.next_index.get(leader_id, 0)
                    )
                    return

            # 追加新日志条目
            self.raft_node.log.extend(entries)
            await self._save_persistent_state()

            # 更新提交索引
            if leader_commit > self.raft_node.commit_index:
                self.raft_node.commit_index = min(leader_commit, len(self.raft_node.log))

            # 发送成功响应
            await self._send_append_entries_response(
                leader_id,
                True,
                len(self.raft_node.log) + 1
            )

        except Exception as e:
            logger.error(f"Error handling append entries: {e}")

    async def _send_append_entries_response(
        self,
        leader_id: str,
        success: bool,
        match_index: int
    ):
        """发送追加条目响应"""
        try:
            response = {
                'term': self.raft_node.current_term,
                'follower_id': self.node_id,
                'success': success,
                'match_index': match_index
            }

            await self.redis.publish(
                f"raft:{leader_id}:append_entries_response",
                json.dumps(response)
            )

        except Exception as e:
            logger.error(f"Failed to send append entries response: {e}")

    async def _handle_append_entries_response(self, data: Dict[str, Any]):
        """处理追加条目响应"""
        if self.raft_node.state != NodeState.LEADER:
            return

        follower_id = data['follower_id']
        success = data['success']
        match_index = data['match_index']

        if success:
            # 更新跟随者的匹配索引
            self.match_index[follower_id] = match_index
            self.next_index[follower_id] = match_index + 1

            # 检查是否可以提交新的日志条目
            await self._update_commit_index()
        else:
            # 减少跟随者的下一个索引并重试
            self.next_index[follower_id] = max(1, self.next_index[follower_id] - 1)

    async def _update_commit_index(self):
        """更新提交索引"""
        # 寻找可以提交的最大索引
        for i in range(len(self.raft_node.log), 0, -1):
            entry = self.raft_node.log[i - 1]

            # 检查是否在多数派节点上复制
            match_count = sum(1 for idx in self.match_index.values() if idx >= i)
            quorum_size = len(self.cluster_nodes) // 2 + 1

            if match_count >= quorum_size and entry.term == self.raft_node.current_term:
                if i > self.raft_node.commit_index:
                    self.raft_node.commit_index = i
                    await self._commit_log_entry(entry)
                break

    async def _commit_log_entry(self, entry: LogEntry):
        """提交日志条目"""
        # 应用到状态机
        success = await self.state_machine.apply(entry)
        if success:
            self.raft_node.last_applied = entry.index
            self.stats['log_entries_applied'] += 1

    async def _forward_to_leader(
        self,
        operation: StateOperation,
        key: str,
        value: Any
    ) -> bool:
        """转发操作给领导者"""
        # 这里应该实现寻找当前领导者并转发操作的逻辑
        # 简化实现：使用Redis作为中介
        try:
            request = {
                'operation': operation.value,
                'key': key,
                'value': value,
                'client_id': self.node_id,
                'timestamp': time.time()
            }

            # 发布请求
            await self.redis.publish("raft:client_requests", json.dumps(request))

            # 等待响应
            response_key = f"raft:response:{self.node_id}:{request['timestamp']}"
            response = await self.redis.blpop(response_key, timeout=5.0)

            return response is not None

        except Exception as e:
            logger.error(f"Failed to forward operation to leader: {e}")
            return False

    async def _election_timer(self):
        """选举定时器"""
        while self.running:
            try:
                if self.raft_node.state == NodeState.FOLLOWER:
                    # 检查是否超时
                    if time.time() - self.raft_node.last_heartbeat > self.election_timeout:
                        await self._start_election()

                elif self.raft_node.state == NodeState.CANDIDATE:
                    # 选举超时，重新开始选举
                    await self._start_election()

                await asyncio.sleep(0.1)

            except Exception as e:
                logger.error(f"Error in election timer: {e}")
                await asyncio.sleep(1.0)

    async def _start_election(self):
        """开始选举"""
        try:
            # 转换为候选人状态
            self.raft_node.state = NodeState.CANDIDATE
            self.raft_node.current_term += 1
            self.raft_node.voted_for = self.node_id
            self.raft_node.votes_received = {self.node_id}

            await self._save_persistent_state()

            # 发送投票请求
            for voter_id in self.cluster_nodes:
                if voter_id != self.node_id:
                    await self._send_vote_request(voter_id)

            # 检查是否获得多数票
            await self._check_election_results()

        except Exception as e:
            logger.error(f"Error starting election: {e}")

    async def _send_vote_request(self, voter_id: str):
        """发送投票请求"""
        try:
            last_log_index = len(self.raft_node.log)
            last_log_term = self.raft_node.log[-1].term if self.raft_node.log else 0

            request = {
                'term': self.raft_node.current_term,
                'candidate_id': self.node_id,
                'last_log_index': last_log_index,
                'last_log_term': last_log_term
            }

            await self.redis.publish(
                f"raft:{voter_id}:vote_request",
                json.dumps(request)
            )

        except Exception as e:
            logger.error(f"Failed to send vote request to {voter_id}: {e}")

    async def _handle_vote_request(self, data: Dict[str, Any]):
        """处理投票请求"""
        try:
            term = data['term']
            candidate_id = data['candidate_id']
            last_log_index = data['last_log_index']
            last_log_term = data['last_log_term']

            # 更新任期
            if term > self.raft_node.current_term:
                self.raft_node.current_term = term
                self.raft_node.state = NodeState.FOLLOWER
                self.raft_node.voted_for = None

            # 决定是否投票
            vote_granted = False

            if (self.raft_node.voted_for is None or self.raft_node.voted_for == candidate_id) and \
               term == self.raft_node.current_term:

                # 检查日志是否至少和自己一样新
                my_last_log_index = len(self.raft_node.log)
                my_last_log_term = self.raft_node.log[-1].term if self.raft_node.log else 0

                if (last_log_term > my_last_log_term or
                    (last_log_term == my_last_log_term and last_log_index >= my_last_log_index)):
                    vote_granted = True
                    self.raft_node.voted_for = candidate_id
                    await self._save_persistent_state()

            # 发送响应
            response = {
                'term': self.raft_node.current_term,
                'voter_id': self.node_id,
                'vote_granted': vote_granted
            }

            await self.redis.publish(
                f"raft:{candidate_id}:vote_response",
                json.dumps(response)
            )

        except Exception as e:
            logger.error(f"Error handling vote request: {e}")

    async def _handle_vote_response(self, data: Dict[str, Any]):
        """处理投票响应"""
        if self.raft_node.state != NodeState.CANDIDATE:
            return

        voter_id = data['voter_id']
        vote_granted = data['vote_granted']

        if vote_granted:
            self.raft_node.votes_received.add(voter_id)

            # 检查是否获得多数票
            await self._check_election_results()

    async def _check_election_results(self):
        """检查选举结果"""
        quorum_size = len(self.cluster_nodes) // 2 + 1

        if len(self.raft_node.votes_received) >= quorum_size:
            # 当选为领导者
            self.raft_node.state = NodeState.LEADER
            self.stats['elections_won'] += 1
            self.stats['leadership_changes'] += 1

            # 初始化领导者的状态
            for node in self.cluster_nodes:
                if node != self.node_id:
                    self.next_index[node] = len(self.raft_node.log) + 1
                    self.match_index[node] = 0

            # 立即发送心跳
            await self._send_heartbeat_to_all()

            logger.info(f"Node {self.node_id} became leader for term {self.raft_node.current_term}")

    async def _heartbeat_sender(self):
        """心跳发送器"""
        while self.running:
            try:
                if self.raft_node.state == NodeState.LEADER:
                    await self._send_heartbeat_to_all()

                await asyncio.sleep(self.heartbeat_interval)

            except Exception as e:
                logger.error(f"Error in heartbeat sender: {e}")
                await asyncio.sleep(self.heartbeat_interval)

    async def _send_heartbeat_to_all(self):
        """向所有跟随者发送心跳"""
        for follower_id in self.cluster_nodes:
            if follower_id != self.node_id:
                await self._send_append_entries(follower_id)

    async def _log_applier(self):
        """日志应用器"""
        while self.running:
            try:
                if self.raft_node.last_applied < self.raft_node.commit_index:
                    # 应用已提交的日志条目
                    for i in range(self.raft_node.last_applied, self.raft_node.commit_index):
                        entry = self.raft_node.log[i]
                        await self.state_machine.apply(entry)
                        self.raft_node.last_applied = i + 1

                await asyncio.sleep(0.1)

            except Exception as e:
                logger.error(f"Error in log applier: {e}")
                await asyncio.sleep(1.0)

    async def _snapshot_manager(self):
        """快照管理器"""
        while self.running:
            try:
                # 定期创建快照
                if len(self.raft_node.log) > 1000:  # 日志条目超过1000时创建快照
                    await self._create_snapshot()

                await asyncio.sleep(300)  # 5分钟检查一次

            except Exception as e:
                logger.error(f"Error in snapshot manager: {e}")
                await asyncio.sleep(300)

    async def _create_snapshot(self):
        """创建快照"""
        try:
            snapshot = await self.state_machine.snapshot()

            # 保存快照
            snapshot_key = f"raft:snapshot:{self.node_id}:{self.raft_node.last_applied}"
            await self.redis.setex(snapshot_key, 3600, snapshot)

            # 清理旧日志
            self.raft_node.log = self.raft_node.log[self.raft_node.last_applied:]

            self.stats['snapshot_count'] += 1
            logger.info(f"Snapshot created at index {self.raft_node.last_applied}")

        except Exception as e:
            logger.error(f"Error creating snapshot: {e}")

    async def _load_persistent_state(self):
        """加载持久化状态"""
        try:
            state_key = f"raft:state:{self.node_id}"
            state_data = await self.redis.get(state_key)

            if state_data:
                state = json.loads(state_data)
                self.raft_node.current_term = state.get('current_term', 0)
                self.raft_node.voted_for = state.get('voted_for')

                # 加载日志
                log_key = f"raft:log:{self.node_id}"
                log_data = await self.redis.get(log_key)

                if log_data:
                    logs = json.loads(log_data)
                    self.raft_node.log = [LogEntry(**entry) for entry in logs]

        except Exception as e:
            logger.error(f"Error loading persistent state: {e}")

    async def _save_persistent_state(self):
        """保存持久化状态"""
        try:
            # 保存状态
            state_data = {
                'current_term': self.raft_node.current_term,
                'voted_for': self.raft_node.voted_for,
                'timestamp': time.time()
            }

            state_key = f"raft:state:{self.node_id}"
            await self.redis.setex(state_key, 3600, json.dumps(state_data))

            # 保存日志
            log_data = [entry.dict() for entry in self.raft_node.log]
            log_key = f"raft:log:{self.node_id}"
            await self.redis.setex(log_key, 3600, json.dumps(log_data))

        except Exception as e:
            logger.error(f"Error saving persistent state: {e}")

    async def get_cluster_status(self) -> Dict[str, Any]:
        """获取集群状态"""
        return {
            'node_id': self.node_id,
            'state': self.raft_node.state.value,
            'term': self.raft_node.current_term,
            'leader': 'unknown',  # 需要实现领导者发现逻辑
            'log_length': len(self.raft_node.log),
            'commit_index': self.raft_node.commit_index,
            'last_applied': self.raft_node.last_applied,
            'cluster_size': len(self.cluster_nodes),
            'statistics': self.stats.copy()
        }