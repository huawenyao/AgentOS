"""
EFIAgent 多模态协作通信框架
Implementation Date: 2024-01-16

支持星型+网状混合拓扑的自适应通信协议，实现低延迟、高可靠的智能体间协作。
"""

import asyncio
import json
import time
import random
from typing import Dict, List, Optional, Any, Set, Tuple, Union
from dataclasses import dataclass, field
from enum import Enum
from collections import defaultdict, deque
import logging
import heapq
from abc import ABC, abstractmethod

import networkx as nx
import numpy as np
from pydantic import BaseModel, Field
import redis.asyncio as redis
import aiofiles
from sklearn.cluster import KMeans

logger = logging.getLogger(__name__)

class MessageType(Enum):
    """消息类型枚举"""
    # 基础通信
    HEARTBEAT = "heartbeat"
    TASK_ASSIGNMENT = "task_assignment"
    TASK_RESULT = "task_result"
    STATUS_UPDATE = "status_update"

    # 协作通信
    COLLABORATION_REQUEST = "collaboration_request"
    COLLABORATION_RESPONSE = "collaboration_response"
    KNOWLEDGE_SHARE = "knowledge_share"
    RESOURCE_REQUEST = "resource_request"

    # 紧急通信
    EMERGENCY_ALERT = "emergency_alert"
    FAULT_REPORT = "fault_report"
    COORDINATION_REQUEST = "coordination_request"

    # 元通信
    TOPOLOGY_UPDATE = "topology_update"
    ROUTING_INFO = "routing_info"
    PERFORMANCE_METRIC = "performance_metric"

class Priority(Enum):
    """消息优先级"""
    CRITICAL = 0    # 紧急消息，立即处理
    HIGH = 1       # 高优先级，优先处理
    NORMAL = 2     # 普通优先级
    LOW = 3        # 低优先级，后台处理

class TopologyType(Enum):
    """拓扑类型"""
    STAR = "star"           # 星型拓扑
    MESH = "mesh"          # 网状拓扑
    HYBRID = "hybrid"      # 混合拓扑
    ADAPTIVE = "adaptive"   # 自适应拓扑

@dataclass
class Message(BaseModel):
    """通信消息"""
    id: str = Field(description="消息唯一标识")
    sender_id: str = Field(description="发送者ID")
    receiver_id: str = Field(description="接收者ID")
    message_type: MessageType = Field(description="消息类型")
    content: Dict[str, Any] = Field(default_factory=dict, description="消息内容")
    priority: Priority = Field(default=Priority.NORMAL, description="消息优先级")
    timestamp: float = Field(default_factory=time.time, description="时间戳")
    ttl: float = Field(default=60.0, description="生存时间")
    retry_count: int = Field(default=0, description="重试次数")
    max_retries: int = Field(default=3, description="最大重试次数")

    class Config:
        use_enum_values = True

@dataclass
class NetworkNode(BaseModel):
    """网络节点"""
    agent_id: str = Field(description="智能体ID")
    endpoint: str = Field(description="通信端点")
    capabilities: List[str] = Field(default_factory=list, description="能力列表")
    workload: float = Field(default=0.0, description="工作负载")
    availability: float = Field(default=1.0, description="可用性")
    last_heartbeat: float = Field(default_factory=time.time, description="最后心跳时间")
    connection_quality: float = Field(default=1.0, description="连接质量")
    bandwidth: float = Field(default=1000.0, description="带宽 (Mbps)")
    latency: float = Field(default=10.0, description="延迟 (ms)")

@dataclass
class RouteInfo(BaseModel):
    """路由信息"""
    destination: str = Field(description="目标节点")
    next_hop: str = Field(description="下一跳")
    cost: float = Field(description="路由成本")
    latency: float = Field(description="预期延迟")
    reliability: float = Field(description="可靠性")

class RoutingAlgorithm(ABC):
    """路由算法抽象基类"""

    @abstractmethod
    async def calculate_route(
        self,
        source: str,
        destination: str,
        topology: nx.Graph
    ) -> List[str]:
        """计算路由路径"""
        pass

class DijkstraRouting(RoutingAlgorithm):
    """Dijkstra最短路径路由算法"""

    async def calculate_route(
        self,
        source: str,
        destination: str,
        topology: nx.Graph
    ) -> List[str]:
        """计算最短路径"""
        try:
            # 使用延迟作为权重
            path = nx.shortest_path(
                topology,
                source=source,
                target=destination,
                weight='latency'
            )
            return path
        except nx.NetworkXNoPath:
            return []

class LatencyAwareRouting(RoutingAlgorithm):
    """延迟感知路由算法"""

    def __init__(self, latency_weight: float = 0.7, reliability_weight: float = 0.3):
        self.latency_weight = latency_weight
        self.reliability_weight = reliability_weight

    async def calculate_route(
        self,
        source: str,
        destination: str,
        topology: nx.Graph
    ) -> List[str]:
        """计算延迟感知的最优路径"""
        try:
            # 计算综合权重
            for u, v, data in topology.edges(data=True):
                latency = data.get('latency', 100)
                reliability = data.get('reliability', 0.9)

                # 综合权重：越低越好
                data['weight'] = (
                    self.latency_weight * latency +
                    self.reliability_weight * (1000 / reliability)
                )

            path = nx.shortest_path(
                topology,
                source=source,
                target=destination,
                weight='weight'
            )
            return path
        except nx.NetworkXNoPath:
            return []

class MessageQueue:
    """优先级消息队列"""

    def __init__(self, max_size: int = 10000):
        self.max_size = max_size
        self._queue = []
        self._messages = {}
        self._lock = asyncio.Lock()

    async def enqueue(self, message: Message) -> bool:
        """入队"""
        async with self._lock:
            if len(self._queue) >= self.max_size:
                # 丢弃低优先级消息
                await self._drop_low_priority_messages()

            if message.id not in self._messages:
                heapq.heappush(self._queue, (message.priority.value, message.timestamp, message.id))
                self._messages[message.id] = message
                return True
            return False

    async def dequeue(self) -> Optional[Message]:
        """出队"""
        async with self._lock:
            while self._queue:
                _, _, msg_id = heapq.heappop(self._queue)
                if msg_id in self._messages:
                    message = self._messages.pop(msg_id)
                    return message
            return None

    async def peek(self) -> Optional[Message]:
        """查看队首消息"""
        async with self._lock:
            while self._queue:
                _, _, msg_id = self._queue[0]
                if msg_id in self._messages:
                    return self._messages[msg_id]
                heapq.heappop(self._queue)
            return None

    async def size(self) -> int:
        """队列大小"""
        async with self._lock:
            return len(self._queue)

    async def _drop_low_priority_messages(self):
        """丢弃低优先级消息"""
        # 找出所有低优先级消息
        low_priority_msgs = [
            msg_id for _, _, msg_id in self._queue
            if self._messages[msg_id].priority == Priority.LOW
        ]

        # 丢弃一半的低优先级消息
        drop_count = len(low_priority_msgs) // 2
        for msg_id in low_priority_msgs[:drop_count]:
            if msg_id in self._messages:
                del self._messages[msg_id]

        # 重建队列
        self._queue = [
            (self._messages[msg_id].priority.value,
             self._messages[msg_id].timestamp, msg_id)
            for _, _, msg_id in self._queue
            if msg_id in self._messages
        ]
        heapq.heapify(self._queue)

class AdaptiveTopologyManager:
    """自适应拓扑管理器"""

    def __init__(self, redis_client: redis.Redis):
        self.redis = redis_client
        self.topology = nx.Graph()
        self.current_topology_type = TopologyType.STAR
        self.routing_algorithm = LatencyAwareRouting()
        self.performance_history = deque(maxlen=100)
        self.adaptation_interval = 300  # 5分钟
        self.last_adaptation = time.time()

    async def initialize_topology(self, nodes: List[NetworkNode]):
        """初始化拓扑"""
        # 添加所有节点
        for node in nodes:
            self.topology.add_node(
                node.agent_id,
                **node.dict()
            )

        # 初始星型拓扑
        await self._create_star_topology(nodes)

    async def _create_star_topology(self, nodes: List[NetworkNode]):
        """创建星型拓扑"""
        self.topology.clear_edges()

        if nodes:
            # 选择负载最低的节点作为中心节点
            center_node = min(nodes, key=lambda x: x.workload)

            for node in nodes:
                if node.agent_id != center_node.agent_id:
                    self.topology.add_edge(
                        center_node.agent_id,
                        node.agent_id,
                        latency=center_node.latency + node.latency,
                        reliability=center_node.availability * node.availability,
                        bandwidth=min(center_node.bandwidth, node.bandwidth)
                    )

        self.current_topology_type = TopologyType.STAR
        await self._save_topology_state()

    async def _create_mesh_topology(self, nodes: List[NetworkNode]):
        """创建网状拓扑"""
        self.topology.clear_edges()

        for i, node1 in enumerate(nodes):
            for node2 in nodes[i+1:]:
                # 只连接高可靠性的节点
                reliability = node1.availability * node2.availability
                if reliability > 0.7:
                    self.topology.add_edge(
                        node1.agent_id,
                        node2.agent_id,
                        latency=node1.latency + node2.latency,
                        reliability=reliability,
                        bandwidth=min(node1.bandwidth, node2.bandwidth)
                    )

        self.current_topology_type = TopologyType.MESH
        await self._save_topology_state()

    async def _create_hybrid_topology(self, nodes: List[NetworkNode]):
        """创建混合拓扑"""
        self.topology.clear_edges()

        # 识别核心节点（高能力、高可用性）
        core_nodes = [
            node for node in nodes
            if node.availability > 0.8 and len(node.capabilities) > 3
        ]

        # 核心节点间形成网状连接
        for i, node1 in enumerate(core_nodes):
            for node2 in core_nodes[i+1:]:
                self.topology.add_edge(
                    node1.agent_id,
                    node2.agent_id,
                    latency=node1.latency + node2.latency,
                    reliability=node1.availability * node2.availability,
                    bandwidth=min(node1.bandwidth, node2.bandwidth)
                )

        # 其他节点连接到最近的核心节点
        non_core_nodes = [n for n in nodes if n not in core_nodes]
        for node in non_core_nodes:
            # 找到最近的核心节点
            nearest_core = min(
                core_nodes,
                key=lambda x: abs(x.workload - node.workload) + x.latency
            )
            self.topology.add_edge(
                nearest_core.agent_id,
                node.agent_id,
                latency=nearest_core.latency + node.latency,
                reliability=nearest_core.availability * node.availability,
                bandwidth=min(nearest_core.bandwidth, node.bandwidth)
            )

        self.current_topology_type = TopologyType.HYBRID
        await self._save_topology_state()

    async def adapt_topology(self, performance_metrics: Dict[str, float]):
        """自适应调整拓扑"""
        current_time = time.time()

        # 检查是否需要调整
        if current_time - self.last_adaptation < self.adaptation_interval:
            return

        self.last_adaptation = current_time
        self.performance_history.append(performance_metrics)

        # 分析性能趋势
        avg_latency = performance_metrics.get('avg_latency', 100)
        packet_loss = performance_metrics.get('packet_loss', 0.01)
        node_count = len(self.topology.nodes)

        # 决策逻辑
        if avg_latency > 200 and packet_loss > 0.05:
            # 高延迟、高丢包：切换到星型拓扑
            if self.current_topology_type != TopologyType.STAR:
                logger.info("Switching to star topology due to high latency and packet loss")
                nodes = [NetworkNode(**self.topology.nodes[n]) for n in self.topology.nodes]
                await self._create_star_topology(nodes)

        elif node_count > 10 and avg_latency < 50:
            # 大规模、低延迟：切换到混合拓扑
            if self.current_topology_type != TopologyType.HYBRID:
                logger.info("Switching to hybrid topology for large-scale low-latency scenario")
                nodes = [NetworkNode(**self.topology.nodes[n]) for n in self.topology.nodes]
                await self._create_hybrid_topology(nodes)

        elif node_count <= 8 and packet_loss < 0.02:
            # 小规模、低丢包：切换到网状拓扑
            if self.current_topology_type != TopologyType.MESH:
                logger.info("Switching to mesh topology for small-scale reliable scenario")
                nodes = [NetworkNode(**self.topology.nodes[n]) for n in self.topology.nodes]
                await self._create_mesh_topology(nodes)

    async def add_node(self, node: NetworkNode):
        """添加节点"""
        self.topology.add_node(node.agent_id, **node.dict())

        # 重新计算连接
        nodes = [NetworkNode(**self.topology.nodes[n]) for n in self.topology.nodes]
        if self.current_topology_type == TopologyType.STAR:
            await self._create_star_topology(nodes)
        elif self.current_topology_type == TopologyType.MESH:
            await self._create_mesh_topology(nodes)
        elif self.current_topology_type == TopologyType.HYBRID:
            await self._create_hybrid_topology(nodes)

    async def remove_node(self, agent_id: str):
        """移除节点"""
        if agent_id in self.topology.nodes:
            self.topology.remove_node(agent_id)
            await self._save_topology_state()

    async def get_route(self, source: str, destination: str) -> List[str]:
        """获取路由路径"""
        if source not in self.topology.nodes or destination not in self.topology.nodes:
            return []

        return await self.routing_algorithm.calculate_route(
            source, destination, self.topology
        )

    async def _save_topology_state(self):
        """保存拓扑状态"""
        try:
            topology_data = {
                'type': self.current_topology_type.value,
                'nodes': [
                    {'id': node, **data}
                    for node, data in self.topology.nodes(data=True)
                ],
                'edges': [
                    {'source': u, 'target': v, **data}
                    for u, v, data in self.topology.edges(data=True)
                ],
                'timestamp': time.time()
            }

            await self.redis.setex(
                'topology:state',
                3600,  # 1小时过期
                json.dumps(topology_data)
            )
        except Exception as e:
            logger.error(f"Failed to save topology state: {e}")

class CollaborativeCommunicationFramework:
    """多模态协作通信框架"""

    def __init__(
        self,
        agent_id: str,
        redis_url: str = "redis://localhost:6379",
        max_queue_size: int = 10000
    ):
        self.agent_id = agent_id
        self.redis_url = redis_url
        self.redis = None
        self.max_queue_size = max_queue_size

        # 核心组件
        self.message_queue = MessageQueue(max_queue_size)
        self.node_info = None
        self.topology_manager = None
        self.active_connections = {}
        self.message_handlers = {}

        # 性能监控
        self.metrics = {
            'messages_sent': 0,
            'messages_received': 0,
            'messages_failed': 0,
            'avg_latency': 0.0,
            'throughput': 0.0,
            'packet_loss': 0.0
        }

        # 后台任务
        self.background_tasks = []
        self.running = False

    async def initialize(
        self,
        node_info: NetworkNode,
        initial_nodes: Optional[List[NetworkNode]] = None
    ):
        """初始化通信框架"""
        try:
            # 连接Redis
            self.redis = redis.from_url(self.redis_url)

            # 设置节点信息
            self.node_info = node_info

            # 初始化拓扑管理器
            self.topology_manager = AdaptiveTopologyManager(self.redis)

            if initial_nodes:
                await self.topology_manager.initialize_topology(initial_nodes)

            # 注册默认消息处理器
            self.register_handler(MessageType.HEARTBEAT, self._handle_heartbeat)
            self.register_handler(MessageType.TASK_ASSIGNMENT, self._handle_task_assignment)
            self.register_handler(MessageType.COLLABORATION_REQUEST, self._handle_collaboration_request)
            self.register_handler(MessageType.EMERGENCY_ALERT, self._handle_emergency_alert)

            # 启动后台任务
            self.running = True
            self.background_tasks = [
                asyncio.create_task(self._message_processor()),
                asyncio.create_task(self._heartbeat_sender()),
                asyncio.create_task(self._topology_adapter()),
                asyncio.create_task(self._performance_monitor())
            ]

            logger.info(f"Communication framework initialized for agent {self.agent_id}")

        except Exception as e:
            logger.error(f"Failed to initialize communication framework: {e}")
            raise

    async def shutdown(self):
        """关闭通信框架"""
        self.running = False

        # 取消后台任务
        for task in self.background_tasks:
            task.cancel()
            try:
                await task
            except asyncio.CancelledError:
                pass

        # 关闭连接
        if self.redis:
            await self.redis.close()

        logger.info(f"Communication framework shutdown for agent {self.agent_id}")

    def register_handler(self, message_type: MessageType, handler):
        """注册消息处理器"""
        self.message_handlers[message_type] = handler

    async def send_message(
        self,
        receiver_id: str,
        message_type: MessageType,
        content: Dict[str, Any],
        priority: Priority = Priority.NORMAL,
        ttl: float = 60.0
    ) -> bool:
        """发送消息"""
        try:
            # 创建消息
            message = Message(
                id=f"{self.agent_id}_{int(time.time() * 1000000)}_{random.randint(1000, 9999)}",
                sender_id=self.agent_id,
                receiver_id=receiver_id,
                message_type=message_type,
                content=content,
                priority=priority,
                ttl=ttl
            )

            # 获取路由路径
            route = await self.topology_manager.get_route(
                self.agent_id, receiver_id
            )

            if not route:
                logger.warning(f"No route found to {receiver_id}")
                return False

            # 发送消息
            success = await self._send_message_via_route(message, route)

            if success:
                self.metrics['messages_sent'] += 1
            else:
                self.metrics['messages_failed'] += 1

            return success

        except Exception as e:
            logger.error(f"Failed to send message: {e}")
            self.metrics['messages_failed'] += 1
            return False

    async def broadcast_message(
        self,
        message_type: MessageType,
        content: Dict[str, Any],
        priority: Priority = Priority.NORMAL,
        target_agents: Optional[List[str]] = None
    ) -> int:
        """广播消息"""
        if target_agents is None:
            target_agents = list(self.topology_manager.topology.nodes)
            target_agents.remove(self.agent_id)

        success_count = 0
        for agent_id in target_agents:
            if await self.send_message(agent_id, message_type, content, priority):
                success_count += 1

        return success_count

    async def _send_message_via_route(self, message: Message, route: List[str]) -> bool:
        """通过路由路径发送消息"""
        try:
            if len(route) < 2:
                # 直接发送
                return await self._send_direct_message(message)

            # 通过中间节点转发
            next_hop = route[1]
            message.content['_forward_path'] = route[1:]

            return await self._send_direct_message_to(next_hop, message)

        except Exception as e:
            logger.error(f"Failed to send message via route: {e}")
            return False

    async def _send_direct_message(self, message: Message) -> bool:
        """直接发送消息"""
        try:
            # 将消息推送到接收者的队列
            queue_key = f"messages:{message.receiver_id}"
            message_data = message.json()

            await self.redis.lpush(queue_key, message_data)
            await self.redis.expire(queue_key, 300)  # 5分钟过期

            return True

        except Exception as e:
            logger.error(f"Failed to send direct message: {e}")
            return False

    async def _send_direct_message_to(self, target: str, message: Message) -> bool:
        """向指定目标直接发送消息"""
        try:
            queue_key = f"messages:{target}"
            message_data = message.json()

            await self.redis.lpush(queue_key, message_data)
            await self.redis.expire(queue_key, 300)

            return True

        except Exception as e:
            logger.error(f"Failed to send message to {target}: {e}")
            return False

    async def _message_processor(self):
        """消息处理器"""
        while self.running:
            try:
                # 从Redis队列接收消息
                queue_key = f"messages:{self.agent_id}"
                message_data = await self.redis.brpop(queue_key, timeout=1)

                if message_data:
                    _, data = message_data
                    message = Message.parse_raw(data)

                    # 检查消息有效性
                    if message.timestamp + message.ttl < time.time():
                        logger.debug(f"Message {message.id} expired")
                        continue

                    # 添加到优先级队列
                    await self.message_queue.enqueue(message)
                    self.metrics['messages_received'] += 1

                # 处理队列中的消息
                while True:
                    message = await self.message_queue.dequeue()
                    if not message:
                        break

                    await self._process_message(message)

            except Exception as e:
                logger.error(f"Error in message processor: {e}")
                await asyncio.sleep(1)

    async def _process_message(self, message: Message):
        """处理单个消息"""
        try:
            handler = self.message_handlers.get(message.message_type)
            if handler:
                await handler(message)
            else:
                logger.warning(f"No handler for message type: {message.message_type}")

        except Exception as e:
            logger.error(f"Error processing message {message.id}: {e}")

    async def _handle_heartbeat(self, message: Message):
        """处理心跳消息"""
        # 更新发送者状态
        if self.topology_manager:
            sender_node = self.topology_manager.topology.nodes.get(message.sender_id)
            if sender_node:
                sender_node['last_heartbeat'] = time.time()

        # 回复心跳
        await self.send_message(
            message.sender_id,
            MessageType.HEARTBEAT,
            {'status': 'alive', 'timestamp': time.time()}
        )

    async def _handle_task_assignment(self, message: Message):
        """处理任务分配消息"""
        # 由子类实现具体逻辑
        logger.info(f"Received task assignment: {message.content}")

    async def _handle_collaboration_request(self, message: Message):
        """处理协作请求消息"""
        # 由子类实现具体逻辑
        logger.info(f"Received collaboration request: {message.content}")

    async def _handle_emergency_alert(self, message: Message):
        """处理紧急警报消息"""
        # 立即转发紧急警报
        await self.broadcast_message(
            MessageType.EMERGENCY_ALERT,
            message.content,
            Priority.CRITICAL
        )
        logger.warning(f"Emergency alert received: {message.content}")

    async def _heartbeat_sender(self):
        """心跳发送器"""
        while self.running:
            try:
                # 广播心跳
                await self.broadcast_message(
                    MessageType.HEARTBEAT,
                    {
                        'agent_id': self.agent_id,
                        'timestamp': time.time(),
                        'workload': self.node_info.workload if self.node_info else 0.0,
                        'availability': self.node_info.availability if self.node_info else 1.0
                    }
                )

                await asyncio.sleep(30)  # 30秒心跳间隔

            except Exception as e:
                logger.error(f"Error in heartbeat sender: {e}")
                await asyncio.sleep(30)

    async def _topology_adapter(self):
        """拓扑适配器"""
        while self.running:
            try:
                # 收集性能指标
                performance_metrics = {
                    'avg_latency': self.metrics['avg_latency'],
                    'packet_loss': self.metrics['packet_loss'],
                    'throughput': self.metrics['throughput'],
                    'node_count': len(self.topology_manager.topology.nodes) if self.topology_manager else 0
                }

                # 自适应调整拓扑
                if self.topology_manager:
                    await self.topology_manager.adapt_topology(performance_metrics)

                await asyncio.sleep(60)  # 1分钟检查间隔

            except Exception as e:
                logger.error(f"Error in topology adapter: {e}")
                await asyncio.sleep(60)

    async def _performance_monitor(self):
        """性能监控器"""
        while self.running:
            try:
                # 计算吞吐量
                total_messages = self.metrics['messages_sent'] + self.metrics['messages_received']
                self.metrics['throughput'] = total_messages / 60  # 每秒消息数

                # 保存性能数据
                if self.redis:
                    await self.redis.hset(
                        f"metrics:{self.agent_id}",
                        mapping={k: str(v) for k, v in self.metrics.items()}
                    )
                    await self.redis.expire(f"metrics:{self.agent_id}", 3600)

                await asyncio.sleep(60)  # 1分钟更新间隔

            except Exception as e:
                logger.error(f"Error in performance monitor: {e}")
                await asyncio.sleep(60)

    async def get_network_status(self) -> Dict[str, Any]:
        """获取网络状态"""
        if not self.topology_manager:
            return {}

        return {
            'topology_type': self.topology_manager.current_topology_type.value,
            'node_count': len(self.topology_manager.topology.nodes),
            'edge_count': len(self.topology_manager.topology.edges),
            'metrics': self.metrics.copy(),
            'connections': list(self.topology_manager.topology.neighbors(self.agent_id))
        }

    async def find_optimal_collaborators(
        self,
        required_capabilities: List[str],
        max_collaborators: int = 3
    ) -> List[str]:
        """寻找最优协作者"""
        if not self.topology_manager:
            return []

        candidates = []

        for node_id, node_data in self.topology_manager.topology.nodes(data=True):
            if node_id == self.agent_id:
                continue

            # 计算能力匹配度
            node_caps = set(node_data.get('capabilities', []))
            required_caps = set(required_capabilities)
            match_score = len(node_caps & required_caps) / len(required_caps) if required_caps else 0

            # 计算综合评分
            availability = node_data.get('availability', 0.0)
            workload = 1.0 - node_data.get('workload', 0.0)

            # 获取路由成本
            route = await self.topology_manager.get_route(self.agent_id, node_id)
            route_cost = len(route) if route else float('inf')

            if route_cost < float('inf'):
                score = (
                    0.4 * match_score +
                    0.3 * availability +
                    0.2 * workload +
                    0.1 * (1.0 / route_cost)
                )
                candidates.append((node_id, score))

        # 按评分排序，返回最优候选者
        candidates.sort(key=lambda x: x[1], reverse=True)
        return [node_id for node_id, _ in candidates[:max_collaborators]]