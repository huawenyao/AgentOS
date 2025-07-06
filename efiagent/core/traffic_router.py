"""流量路由器模块

该模块实现了基于混合拓扑的消息路由功能，
包括消息转发、广播和组播等功能。
"""

import uuid
import time
import threading
from enum import Enum
from typing import Dict, List, Set, Optional, Any, Tuple, Callable, Union
from datetime import datetime
from loguru import logger

from efiagent.core.communication import Message, MessageType, MessageBroker
from efiagent.core.communication_topology import TopologyManager, CommunicationTopology, P2PGroup


class RoutingStrategy(str, Enum):
    """路由策略枚举"""
    DIRECT = "direct"          # 直接路由
    CENTRAL = "central"        # 中心节点路由
    FLOOD = "flood"            # 洪泛路由
    SELECTIVE = "selective"    # 选择性路由


class MessageRoute:
    """消息路由信息"""
    def __init__(self, message_id: str, source_id: str, target_id: str, 
                 route_path: List[str] = None, ttl: int = 10):
        """初始化消息路由信息
        
        Args:
            message_id: 消息ID
            source_id: 源节点ID
            target_id: 目标节点ID
            route_path: 路由路径
            ttl: 生存时间
        """
        self.message_id = message_id
        self.source_id = source_id
        self.target_id = target_id
        self.route_path = route_path or [source_id]
        self.ttl = ttl
        self.created_at = datetime.now()
        self.last_hop = source_id
    
    def add_hop(self, node_id: str) -> None:
        """添加跳点
        
        Args:
            node_id: 节点ID
        """
        if node_id not in self.route_path:
            self.route_path.append(node_id)
        self.last_hop = node_id
        self.ttl -= 1
    
    def is_expired(self) -> bool:
        """检查是否过期
        
        Returns:
            bool: 是否过期
        """
        return self.ttl <= 0
    
    def has_visited(self, node_id: str) -> bool:
        """检查是否已访问过节点
        
        Args:
            node_id: 节点ID
            
        Returns:
            bool: 是否已访问过
        """
        return node_id in self.route_path


class TrafficRouter:
    """流量路由器
    
    负责基于混合拓扑的消息路由
    """
    def __init__(self, node_id: str, message_broker: MessageBroker, 
                 topology_manager: TopologyManager):
        """初始化流量路由器
        
        Args:
            node_id: 节点ID
            message_broker: 消息代理
            topology_manager: 拓扑管理器
        """
        self.node_id = node_id
        self.message_broker = message_broker
        self.topology_manager = topology_manager
        
        # 路由表缓存，键为消息ID，值为路由信息
        self.route_cache: Dict[str, MessageRoute] = {}
        
        # 已处理的消息ID集合，用于防止重复处理
        self.processed_messages: Set[str] = set()
        
        # 消息处理回调函数，键为消息类型，值为回调函数列表
        self.message_handlers: Dict[MessageType, List[Callable[[Message], None]]] = {}
        
        # 默认路由策略
        self.default_strategy = RoutingStrategy.SELECTIVE
        
        # 路由策略映射，键为消息类型，值为路由策略
        self.routing_strategies: Dict[MessageType, RoutingStrategy] = {}
        
        # 线程锁
        self.lock = threading.Lock()
        
        # 初始化默认路由策略
        self._init_default_strategies()
        
        # 注册消息处理器
        self._register_message_handlers()
    
    def _init_default_strategies(self) -> None:
        """初始化默认路由策略"""
        # 状态同步消息使用选择性路由
        self.routing_strategies[MessageType.STATE_SYNC] = RoutingStrategy.SELECTIVE
        
        # 任务分配消息使用中心节点路由
        self.routing_strategies[MessageType.TASK_ASSIGNMENT] = RoutingStrategy.CENTRAL
        
        # 任务完成消息使用中心节点路由
        self.routing_strategies[MessageType.TASK_COMPLETION] = RoutingStrategy.CENTRAL
        
        # 资源请求消息使用中心节点路由
        self.routing_strategies[MessageType.RESOURCE_REQUEST] = RoutingStrategy.CENTRAL
        
        # 资源响应消息使用直接路由
        self.routing_strategies[MessageType.RESOURCE_RESPONSE] = RoutingStrategy.DIRECT
        
        # 错误报告消息使用中心节点路由
        self.routing_strategies[MessageType.ERROR_REPORT] = RoutingStrategy.CENTRAL
        
        # 心跳消息使用直接路由
        self.routing_strategies[MessageType.HEARTBEAT] = RoutingStrategy.DIRECT
        
        # 广播消息使用洪泛路由
        self.routing_strategies[MessageType.BROADCAST] = RoutingStrategy.FLOOD
        
        # 查询消息使用选择性路由
        self.routing_strategies[MessageType.QUERY] = RoutingStrategy.SELECTIVE
        
        # 响应消息使用直接路由
        self.routing_strategies[MessageType.RESPONSE] = RoutingStrategy.DIRECT
    
    def _register_message_handlers(self) -> None:
        """注册消息处理器"""
        # 注册所有消息类型的处理器
        for message_type in MessageType:
            self.register_handler(message_type, self._handle_message)
    
    def register_handler(self, message_type: MessageType, 
                        handler: Callable[[Message], None]) -> None:
        """注册消息处理器
        
        Args:
            message_type: 消息类型
            handler: 处理器函数
        """
        with self.lock:
            if message_type not in self.message_handlers:
                self.message_handlers[message_type] = []
            
            if handler not in self.message_handlers[message_type]:
                self.message_handlers[message_type].append(handler)
    
    def unregister_handler(self, message_type: MessageType, 
                          handler: Callable[[Message], None]) -> None:
        """取消注册消息处理器
        
        Args:
            message_type: 消息类型
            handler: 处理器函数
        """
        with self.lock:
            if message_type in self.message_handlers and handler in self.message_handlers[message_type]:
                self.message_handlers[message_type].remove(handler)
    
    def set_routing_strategy(self, message_type: MessageType, 
                            strategy: RoutingStrategy) -> None:
        """设置路由策略
        
        Args:
            message_type: 消息类型
            strategy: 路由策略
        """
        with self.lock:
            self.routing_strategies[message_type] = strategy
    
    def route_message(self, message: Message) -> None:
        """路由消息
        
        Args:
            message: 消息对象
        """
        # 如果消息已处理过，直接返回
        if message.header.message_id in self.processed_messages:
            return
        
        # 标记消息为已处理
        with self.lock:
            self.processed_messages.add(message.header.message_id)
        
        # 如果是目标节点，处理消息
        if message.header.receiver_id == self.node_id or message.header.receiver_id == "*":
            self._process_message(message)
        
        # 如果TTL为0，不再转发
        if message.header.ttl <= 0:
            return
        
        # 根据消息类型获取路由策略
        strategy = self.routing_strategies.get(message.header.message_type, self.default_strategy)
        
        # 根据路由策略转发消息
        if strategy == RoutingStrategy.DIRECT:
            self._route_direct(message)
        elif strategy == RoutingStrategy.CENTRAL:
            self._route_central(message)
        elif strategy == RoutingStrategy.FLOOD:
            self._route_flood(message)
        elif strategy == RoutingStrategy.SELECTIVE:
            self._route_selective(message)
    
    def broadcast_message(self, message: Message) -> None:
        """广播消息
        
        Args:
            message: 消息对象
        """
        # 设置接收者为广播标识
        message.header.receiver_id = "*"
        
        # 设置消息类型为广播
        message.header.message_type = MessageType.BROADCAST
        
        # 使用洪泛路由策略
        self._route_flood(message)
    
    def group_broadcast(self, message: Message, group_id: str) -> None:
        """组播消息
        
        Args:
            message: 消息对象
            group_id: 组ID
        """
        # 获取组内所有成员
        members = self.topology_manager.get_group_broadcast_targets(group_id)
        
        # 向每个成员发送消息
        for member_id in members:
            # 克隆消息并设置接收者
            msg_copy = self._clone_message(message)
            msg_copy.header.receiver_id = member_id
            
            # 路由消息
            self.route_message(msg_copy)
    
    def _process_message(self, message: Message) -> None:
        """处理消息
        
        Args:
            message: 消息对象
        """
        # 调用消息处理器
        message_type = message.header.message_type
        
        with self.lock:
            handlers = self.message_handlers.get(message_type, [])
        
        for handler in handlers:
            try:
                handler(message)
            except Exception as e:
                logger.error(f"处理消息时出错: {e}")
    
    def _handle_message(self, message: Message) -> None:
        """默认消息处理器
        
        Args:
            message: 消息对象
        """
        # 更新发送者的最后活跃时间
        self.topology_manager.update_node_last_seen(message.header.sender_id)
        
        # 将消息发布到消息代理
        self.message_broker.publish(message)
    
    def _route_direct(self, message: Message) -> None:
        """直接路由
        
        Args:
            message: 消息对象
        """
        # 如果接收者是广播标识，不进行直接路由
        if message.header.receiver_id == "*":
            return
        
        # 获取到目标节点的下一跳
        next_hop = self.topology_manager.get_next_hop(message.header.receiver_id)
        
        # 如果没有路由，尝试通过中心节点路由
        if next_hop is None:
            self._route_central(message)
            return
        
        # 如果下一跳是自身，说明路由错误
        if next_hop == self.node_id:
            logger.warning(f"路由错误: 消息 {message.header.message_id} 的下一跳是自身")
            return
        
        # 转发消息
        self._forward_message(message, next_hop)
    
    def _route_central(self, message: Message) -> None:
        """中心节点路由
        
        Args:
            message: 消息对象
        """
        # 如果自身是中心节点
        if self.node_id in self.topology_manager.central_nodes:
            # 如果接收者是广播标识，广播给所有节点
            if message.header.receiver_id == "*":
                targets = self.topology_manager.get_broadcast_targets()
                for target_id in targets:
                    self._forward_message(message, target_id)
            else:
                # 否则，直接路由到目标节点
                self._route_direct(message)
        else:
            # 如果不是中心节点，转发给中心节点
            if self.topology_manager.central_nodes:
                central_node = next(iter(self.topology_manager.central_nodes))
                self._forward_message(message, central_node)
    
    def _route_flood(self, message: Message) -> None:
        """洪泛路由
        
        Args:
            message: 消息对象
        """
        # 获取广播目标
        targets = self.topology_manager.get_broadcast_targets()
        
        # 获取或创建路由信息
        route_info = self._get_or_create_route_info(message)
        
        # 向所有未访问过的目标转发消息
        for target_id in targets:
            if not route_info.has_visited(target_id):
                self._forward_message(message, target_id)
    
    def _route_selective(self, message: Message) -> None:
        """选择性路由
        
        Args:
            message: 消息对象
        """
        # 如果接收者是广播标识
        if message.header.receiver_id == "*":
            # 获取与发送者在同一P2P组的节点
            sender_groups = self.topology_manager.get_node_groups(message.header.sender_id)
            targets = set()
            
            for group_id in sender_groups:
                targets.update(self.topology_manager.get_group_broadcast_targets(group_id))
            
            # 获取路由信息
            route_info = self._get_or_create_route_info(message)
            
            # 向所有未访问过的目标转发消息
            for target_id in targets:
                if not route_info.has_visited(target_id):
                    self._forward_message(message, target_id)
        else:
            # 否则，使用直接路由
            self._route_direct(message)
    
    def _forward_message(self, message: Message, target_id: str) -> None:
        """转发消息
        
        Args:
            message: 消息对象
            target_id: 目标节点ID
        """
        # 克隆消息
        msg_copy = self._clone_message(message)
        
        # 减少TTL
        msg_copy.header.ttl -= 1
        
        # 更新跳数
        msg_copy.header.hops += 1
        
        # 更新路由信息
        route_info = self._get_or_create_route_info(msg_copy)
        route_info.add_hop(target_id)
        
        # 发送消息
        # 这里需要实际的消息发送逻辑，可能需要调用网络层的发送函数
        # 简化实现，假设直接调用目标节点的路由器的route_message方法
        logger.debug(f"转发消息: {msg_copy.header.message_id} -> {target_id}")
    
    def _get_or_create_route_info(self, message: Message) -> MessageRoute:
        """获取或创建路由信息
        
        Args:
            message: 消息对象
            
        Returns:
            MessageRoute: 路由信息
        """
        with self.lock:
            if message.header.message_id not in self.route_cache:
                route_info = MessageRoute(
                    message_id=message.header.message_id,
                    source_id=message.header.sender_id,
                    target_id=message.header.receiver_id,
                    ttl=message.header.ttl
                )
                self.route_cache[message.header.message_id] = route_info
            
            return self.route_cache[message.header.message_id]
    
    def _clone_message(self, message: Message) -> Message:
        """克隆消息
        
        Args:
            message: 消息对象
            
        Returns:
            Message: 克隆的消息对象
        """
        # 序列化和反序列化消息以创建深拷贝
        serialized = message.serialize()
        return Message.deserialize(serialized)
    
    def cleanup_cache(self, max_age: int = 300) -> None:
        """清理缓存
        
        Args:
            max_age: 最大缓存年龄（秒）
        """
        now = datetime.now()
        expired_routes = []
        expired_messages = set()
        
        with self.lock:
            # 清理路由缓存
            for message_id, route_info in self.route_cache.items():
                age = (now - route_info.created_at).total_seconds()
                if age > max_age or route_info.is_expired():
                    expired_routes.append(message_id)
            
            for message_id in expired_routes:
                del self.route_cache[message_id]
            
            # 清理已处理消息集合
            # 简化实现，实际应使用LRU缓存或时间戳
            if len(self.processed_messages) > 10000:  # 限制大小
                self.processed_messages.clear()
        
        if expired_routes:
            logger.debug(f"清理了 {len(expired_routes)} 条过期路由信息")
    
    def start_cleanup_task(self, interval: int = 60) -> None:
        """启动清理任务
        
        Args:
            interval: 清理间隔（秒）
        """
        def _cleanup_task():
            while True:
                try:
                    self.cleanup_cache()
                    self.topology_manager.cleanup_inactive_nodes()
                except Exception as e:
                    logger.error(f"清理任务出错: {e}")
                
                time.sleep(interval)
        
        # 启动清理线程
        cleanup_thread = threading.Thread(target=_cleanup_task, daemon=True)
        cleanup_thread.start()