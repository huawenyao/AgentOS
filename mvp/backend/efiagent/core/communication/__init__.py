"""
EFIAgent 通信框架模块
Implementation Date: 2024-01-16

提供企业级多智能体协作通信能力，包括：
- 混合拓扑自适应通信协议
- 分布式状态管理
- 优先级消息队列
- 实时性能监控
"""

from .collaborative_framework import (
    CollaborativeCommunicationFramework,
    Message,
    MessageType,
    Priority,
    NetworkNode,
    RouteInfo,
    TopologyType,
    MessageQueue,
    AdaptiveTopologyManager,
    RoutingAlgorithm,
    DijkstraRouting,
    LatencyAwareRouting
)

from .distributed_state import (
    DistributedStateManager,
    StateOperation,
    LogEntry,
    RaftNode,
    NodeState,
    StateMachine,
    MemoryStateMachine
)

__all__ = [
    # 协作框架
    'CollaborativeCommunicationFramework',
    'Message',
    'MessageType',
    'Priority',
    'NetworkNode',
    'RouteInfo',
    'TopologyType',
    'MessageQueue',
    'AdaptiveTopologyManager',
    'RoutingAlgorithm',
    'DijkstraRouting',
    'LatencyAwareRouting',

    # 分布式状态
    'DistributedStateManager',
    'StateOperation',
    'LogEntry',
    'RaftNode',
    'NodeState',
    'StateMachine',
    'MemoryStateMachine'
]