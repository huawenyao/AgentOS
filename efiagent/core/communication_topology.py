"""通信拓扑模块

该模块实现了混合通信拓扑（星型+网状）和P2P通信组，
用于优化智能体之间的通信效率。
"""

import uuid
import time
import threading
from enum import Enum
from typing import Dict, List, Set, Optional, Any, Tuple, Callable, Union
from datetime import datetime
from pydantic import BaseModel, Field
from loguru import logger


class CommunicationTopology(str, Enum):
    """通信拓扑枚举"""
    STAR = "star"          # 星型拓扑
    MESH = "mesh"          # 网状拓扑
    HYBRID = "hybrid"      # 混合拓扑（星型+网状）
    HIERARCHICAL = "hierarchical"  # 层次拓扑


class NodeRole(str, Enum):
    """节点角色枚举"""
    CENTRAL = "central"    # 中心节点
    EDGE = "edge"          # 边缘节点
    RELAY = "relay"        # 中继节点


class TopologyNode(BaseModel):
    """拓扑节点"""
    node_id: str  # 节点ID
    role: NodeRole  # 节点角色
    neighbors: Set[str] = Field(default_factory=set)  # 邻居节点集合
    groups: Set[str] = Field(default_factory=set)  # 所属P2P组集合
    is_active: bool = True  # 是否活跃
    last_seen: datetime = Field(default_factory=datetime.now)  # 最后活跃时间
    metadata: Dict[str, Any] = Field(default_factory=dict)  # 元数据


class P2PGroup(BaseModel):
    """点对点通信组
    
    用于局部Agent组的P2P通信
    """
    group_id: str  # 组ID
    name: str  # 组名称
    members: Set[str] = Field(default_factory=set)  # 成员集合
    created_at: datetime = Field(default_factory=datetime.now)  # 创建时间
    metadata: Dict[str, Any] = Field(default_factory=dict)  # 元数据


class TopologyManager:
    """拓扑管理器
    
    负责管理通信拓扑和P2P通信组
    """
    def __init__(self, node_id: str, topology_type: CommunicationTopology = CommunicationTopology.HYBRID):
        """初始化拓扑管理器
        
        Args:
            node_id: 节点ID
            topology_type: 拓扑类型
        """
        self.node_id = node_id
        self.topology_type = topology_type
        self.nodes: Dict[str, TopologyNode] = {}  # 节点字典，键为节点ID
        self.groups: Dict[str, P2PGroup] = {}  # P2P组字典，键为组ID
        self.central_nodes: Set[str] = set()  # 中心节点集合
        self.routing_table: Dict[str, str] = {}  # 路由表，键为目标节点ID，值为下一跳节点ID
        self.lock = threading.Lock()  # 线程锁
        
        # 注册自身节点
        self._register_self()
    
    def _register_self(self) -> None:
        """注册自身节点"""
        # 确定自身角色
        role = NodeRole.CENTRAL if self.topology_type == CommunicationTopology.STAR else NodeRole.EDGE
        
        # 创建节点对象
        node = TopologyNode(
            node_id=self.node_id,
            role=role
        )
        
        # 添加到节点字典
        with self.lock:
            self.nodes[self.node_id] = node
            
            # 如果是中心节点，添加到中心节点集合
            if role == NodeRole.CENTRAL:
                self.central_nodes.add(self.node_id)
    
    def add_node(self, node_id: str, role: NodeRole = NodeRole.EDGE, 
                metadata: Dict[str, Any] = None) -> None:
        """添加节点
        
        Args:
            node_id: 节点ID
            role: 节点角色
            metadata: 元数据
        """
        with self.lock:
            # 如果节点已存在，更新信息
            if node_id in self.nodes:
                node = self.nodes[node_id]
                node.role = role
                node.is_active = True
                node.last_seen = datetime.now()
                if metadata:
                    node.metadata.update(metadata)
                return
            
            # 创建新节点
            node = TopologyNode(
                node_id=node_id,
                role=role,
                metadata=metadata or {}
            )
            
            # 添加到节点字典
            self.nodes[node_id] = node
            
            # 如果是中心节点，添加到中心节点集合
            if role == NodeRole.CENTRAL:
                self.central_nodes.add(node_id)
            
            # 更新路由表
            self._update_routing_table(node_id)
            
            logger.info(f"添加节点: {node_id}, 角色: {role.value}")
    
    def remove_node(self, node_id: str) -> None:
        """移除节点
        
        Args:
            node_id: 节点ID
        """
        with self.lock:
            # 如果节点不存在，直接返回
            if node_id not in self.nodes:
                return
            
            # 获取节点
            node = self.nodes[node_id]
            
            # 从所有组中移除该节点
            for group_id in node.groups:
                if group_id in self.groups:
                    self.groups[group_id].members.remove(node_id)
            
            # 从所有节点的邻居集合中移除该节点
            for other_node in self.nodes.values():
                if node_id in other_node.neighbors:
                    other_node.neighbors.remove(node_id)
            
            # 从中心节点集合中移除
            if node_id in self.central_nodes:
                self.central_nodes.remove(node_id)
            
            # 从节点字典中移除
            del self.nodes[node_id]
            
            # 更新路由表
            self._update_routing_table_after_removal(node_id)
            
            logger.info(f"移除节点: {node_id}")
    
    def mark_node_inactive(self, node_id: str) -> None:
        """标记节点为非活跃
        
        Args:
            node_id: 节点ID
        """
        with self.lock:
            if node_id in self.nodes:
                self.nodes[node_id].is_active = False
                logger.info(f"标记节点为非活跃: {node_id}")
    
    def update_node_last_seen(self, node_id: str) -> None:
        """更新节点最后活跃时间
        
        Args:
            node_id: 节点ID
        """
        with self.lock:
            if node_id in self.nodes:
                self.nodes[node_id].last_seen = datetime.now()
                self.nodes[node_id].is_active = True
    
    def add_neighbor(self, node_id: str, neighbor_id: str) -> None:
        """添加邻居关系
        
        Args:
            node_id: 节点ID
            neighbor_id: 邻居节点ID
        """
        with self.lock:
            # 确保两个节点都存在
            if node_id not in self.nodes or neighbor_id not in self.nodes:
                return
            
            # 添加邻居关系（双向）
            self.nodes[node_id].neighbors.add(neighbor_id)
            self.nodes[neighbor_id].neighbors.add(node_id)
            
            # 更新路由表
            self._update_routing_table(node_id)
            self._update_routing_table(neighbor_id)
            
            logger.debug(f"添加邻居关系: {node_id} <-> {neighbor_id}")
    
    def remove_neighbor(self, node_id: str, neighbor_id: str) -> None:
        """移除邻居关系
        
        Args:
            node_id: 节点ID
            neighbor_id: 邻居节点ID
        """
        with self.lock:
            # 确保两个节点都存在
            if node_id not in self.nodes or neighbor_id not in self.nodes:
                return
            
            # 移除邻居关系（双向）
            if neighbor_id in self.nodes[node_id].neighbors:
                self.nodes[node_id].neighbors.remove(neighbor_id)
            
            if node_id in self.nodes[neighbor_id].neighbors:
                self.nodes[neighbor_id].neighbors.remove(node_id)
            
            # 更新路由表
            self._update_routing_table(node_id)
            self._update_routing_table(neighbor_id)
            
            logger.debug(f"移除邻居关系: {node_id} <-> {neighbor_id}")
    
    def create_group(self, name: str, members: List[str] = None, 
                    metadata: Dict[str, Any] = None) -> str:
        """创建P2P通信组
        
        Args:
            name: 组名称
            members: 成员列表
            metadata: 元数据
            
        Returns:
            str: 组ID
        """
        group_id = str(uuid.uuid4())
        
        # 创建组对象
        group = P2PGroup(
            group_id=group_id,
            name=name,
            members=set(members or []),
            metadata=metadata or {}
        )
        
        # 确保自身节点是成员
        group.members.add(self.node_id)
        
        with self.lock:
            # 添加到组字典
            self.groups[group_id] = group
            
            # 更新节点的组集合
            for member_id in group.members:
                if member_id in self.nodes:
                    self.nodes[member_id].groups.add(group_id)
            
            logger.info(f"创建P2P通信组: {name}, ID: {group_id}, 成员数: {len(group.members)}")
            
            return group_id
    
    def delete_group(self, group_id: str) -> bool:
        """删除P2P通信组
        
        Args:
            group_id: 组ID
            
        Returns:
            bool: 是否成功
        """
        with self.lock:
            # 如果组不存在，返回失败
            if group_id not in self.groups:
                return False
            
            # 获取组
            group = self.groups[group_id]
            
            # 从所有成员的组集合中移除该组
            for member_id in group.members:
                if member_id in self.nodes:
                    self.nodes[member_id].groups.remove(group_id)
            
            # 从组字典中移除
            del self.groups[group_id]
            
            logger.info(f"删除P2P通信组: {group.name}, ID: {group_id}")
            
            return True
    
    def add_group_member(self, group_id: str, member_id: str) -> bool:
        """添加组成员
        
        Args:
            group_id: 组ID
            member_id: 成员ID
            
        Returns:
            bool: 是否成功
        """
        with self.lock:
            # 如果组不存在或节点不存在，返回失败
            if group_id not in self.groups or member_id not in self.nodes:
                return False
            
            # 获取组
            group = self.groups[group_id]
            
            # 如果已经是成员，返回成功
            if member_id in group.members:
                return True
            
            # 添加成员
            group.members.add(member_id)
            self.nodes[member_id].groups.add(group_id)
            
            logger.debug(f"添加组成员: {member_id} -> {group.name} ({group_id})")
            
            return True
    
    def remove_group_member(self, group_id: str, member_id: str) -> bool:
        """移除组成员
        
        Args:
            group_id: 组ID
            member_id: 成员ID
            
        Returns:
            bool: 是否成功
        """
        with self.lock:
            # 如果组不存在，返回失败
            if group_id not in self.groups:
                return False
            
            # 获取组
            group = self.groups[group_id]
            
            # 如果不是成员，返回成功
            if member_id not in group.members:
                return True
            
            # 移除成员
            group.members.remove(member_id)
            
            # 如果节点存在，从其组集合中移除该组
            if member_id in self.nodes:
                self.nodes[member_id].groups.remove(group_id)
            
            logger.debug(f"移除组成员: {member_id} -> {group.name} ({group_id})")
            
            return True
    
    def get_group_members(self, group_id: str) -> List[str]:
        """获取组成员
        
        Args:
            group_id: 组ID
            
        Returns:
            List[str]: 成员ID列表
        """
        with self.lock:
            if group_id in self.groups:
                return list(self.groups[group_id].members)
            return []
    
    def get_node_groups(self, node_id: str) -> List[str]:
        """获取节点所属的组
        
        Args:
            node_id: 节点ID
            
        Returns:
            List[str]: 组ID列表
        """
        with self.lock:
            if node_id in self.nodes:
                return list(self.nodes[node_id].groups)
            return []
    
    def get_next_hop(self, target_id: str) -> Optional[str]:
        """获取到目标节点的下一跳
        
        Args:
            target_id: 目标节点ID
            
        Returns:
            Optional[str]: 下一跳节点ID，如果不存在路由则返回None
        """
        with self.lock:
            # 如果目标是自身，返回自身
            if target_id == self.node_id:
                return self.node_id
            
            # 如果目标是邻居，直接返回目标
            if target_id in self.nodes.get(self.node_id, TopologyNode(node_id=self.node_id, role=NodeRole.EDGE)).neighbors:
                return target_id
            
            # 查找路由表
            return self.routing_table.get(target_id)
    
    def get_broadcast_targets(self) -> List[str]:
        """获取广播目标
        
        根据拓扑类型返回广播目标节点ID列表
        
        Returns:
            List[str]: 目标节点ID列表
        """
        with self.lock:
            if self.topology_type == CommunicationTopology.STAR:
                # 星型拓扑：如果是中心节点，广播给所有边缘节点；否则只发送给中心节点
                if self.node_id in self.central_nodes:
                    return [node_id for node_id, node in self.nodes.items() 
                            if node_id != self.node_id and node.role != NodeRole.CENTRAL and node.is_active]
                else:
                    return list(self.central_nodes)
            
            elif self.topology_type == CommunicationTopology.MESH:
                # 网状拓扑：广播给所有邻居
                if self.node_id in self.nodes:
                    return list(self.nodes[self.node_id].neighbors)
                return []
            
            elif self.topology_type == CommunicationTopology.HYBRID:
                # 混合拓扑：如果是中心节点，广播给所有邻居；否则广播给邻居和中心节点
                if self.node_id in self.central_nodes:
                    if self.node_id in self.nodes:
                        return list(self.nodes[self.node_id].neighbors)
                    return []
                else:
                    targets = set()
                    if self.node_id in self.nodes:
                        targets.update(self.nodes[self.node_id].neighbors)
                    targets.update(self.central_nodes)
                    if self.node_id in targets:
                        targets.remove(self.node_id)
                    return list(targets)
            
            elif self.topology_type == CommunicationTopology.HIERARCHICAL:
                # 层次拓扑：广播给上级节点和下级节点
                # 简化实现，实际应根据层次结构确定
                if self.node_id in self.nodes:
                    return list(self.nodes[self.node_id].neighbors)
                return []
            
            return []
    
    def get_group_broadcast_targets(self, group_id: str) -> List[str]:
        """获取组内广播目标
        
        Args:
            group_id: 组ID
            
        Returns:
            List[str]: 目标节点ID列表
        """
        with self.lock:
            if group_id in self.groups:
                # 获取组内所有成员（除了自身）
                members = self.groups[group_id].members.copy()
                if self.node_id in members:
                    members.remove(self.node_id)
                
                # 只返回活跃的成员
                return [member_id for member_id in members 
                        if member_id in self.nodes and self.nodes[member_id].is_active]
            return []
    
    def _update_routing_table(self, node_id: str) -> None:
        """更新路由表
        
        Args:
            node_id: 节点ID
        """
        # 根据拓扑类型更新路由表
        if self.topology_type == CommunicationTopology.STAR:
            self._update_star_routing(node_id)
        elif self.topology_type == CommunicationTopology.MESH:
            self._update_mesh_routing(node_id)
        elif self.topology_type == CommunicationTopology.HYBRID:
            self._update_hybrid_routing(node_id)
        elif self.topology_type == CommunicationTopology.HIERARCHICAL:
            self._update_hierarchical_routing(node_id)
    
    def _update_star_routing(self, node_id: str) -> None:
        """更新星型拓扑路由
        
        Args:
            node_id: 节点ID
        """
        # 在星型拓扑中，所有通信都经过中心节点
        if node_id == self.node_id:
            return
        
        # 如果是中心节点，可以直接路由到所有边缘节点
        if self.node_id in self.central_nodes:
            self.routing_table[node_id] = node_id
        else:
            # 如果是边缘节点，通过中心节点路由到其他边缘节点
            if self.central_nodes:
                central_node = next(iter(self.central_nodes))
                self.routing_table[node_id] = central_node
    
    def _update_mesh_routing(self, node_id: str) -> None:
        """更新网状拓扑路由
        
        Args:
            node_id: 节点ID
        """
        # 在网状拓扑中，使用简化的路由算法
        # 实际应使用更复杂的路由算法，如OSPF或BGP
        if node_id == self.node_id:
            return
        
        # 如果是邻居，直接路由
        if node_id in self.nodes.get(self.node_id, TopologyNode(node_id=self.node_id, role=NodeRole.EDGE)).neighbors:
            self.routing_table[node_id] = node_id
        else:
            # 否则，尝试找到一个可以到达目标的邻居
            # 简化实现，实际应使用最短路径算法
            for neighbor_id in self.nodes.get(self.node_id, TopologyNode(node_id=self.node_id, role=NodeRole.EDGE)).neighbors:
                if neighbor_id in self.nodes and node_id in self.nodes[neighbor_id].neighbors:
                    self.routing_table[node_id] = neighbor_id
                    break
    
    def _update_hybrid_routing(self, node_id: str) -> None:
        """更新混合拓扑路由
        
        Args:
            node_id: 节点ID
        """
        # 在混合拓扑中，结合星型和网状拓扑的路由策略
        if node_id == self.node_id:
            return
        
        # 如果是邻居，直接路由
        if node_id in self.nodes.get(self.node_id, TopologyNode(node_id=self.node_id, role=NodeRole.EDGE)).neighbors:
            self.routing_table[node_id] = node_id
            return
        
        # 如果是中心节点，尝试通过其他中心节点路由
        if self.node_id in self.central_nodes:
            for central_node in self.central_nodes:
                if central_node != self.node_id and central_node in self.nodes:
                    if node_id in self.nodes[central_node].neighbors:
                        self.routing_table[node_id] = central_node
                        return
        
        # 如果是边缘节点，优先通过本地P2P组路由，其次通过中心节点
        if self.node_id in self.nodes:
            # 检查是否有共同的P2P组
            node_groups = self.nodes[self.node_id].groups
            if node_id in self.nodes:
                target_groups = self.nodes[node_id].groups
                common_groups = node_groups.intersection(target_groups)
                
                if common_groups:
                    # 如果有共同的P2P组，尝试在组内找到一个中继节点
                    group_id = next(iter(common_groups))
                    if group_id in self.groups:
                        for member_id in self.groups[group_id].members:
                            if member_id != self.node_id and member_id != node_id and member_id in self.nodes:
                                if (member_id in self.nodes[self.node_id].neighbors and 
                                    node_id in self.nodes[member_id].neighbors):
                                    self.routing_table[node_id] = member_id
                                    return
        
        # 最后，通过中心节点路由
        if self.central_nodes:
            central_node = next(iter(self.central_nodes))
            self.routing_table[node_id] = central_node
    
    def _update_hierarchical_routing(self, node_id: str) -> None:
        """更新层次拓扑路由
        
        Args:
            node_id: 节点ID
        """
        # 简化实现，实际应根据层次结构确定
        # 在层次拓扑中，节点通过上级节点路由到其他分支
        if node_id == self.node_id:
            return
        
        # 如果是邻居，直接路由
        if node_id in self.nodes.get(self.node_id, TopologyNode(node_id=self.node_id, role=NodeRole.EDGE)).neighbors:
            self.routing_table[node_id] = node_id
        else:
            # 否则，通过上级节点路由
            # 简化实现，假设第一个邻居是上级节点
            if self.node_id in self.nodes and self.nodes[self.node_id].neighbors:
                parent_id = next(iter(self.nodes[self.node_id].neighbors))
                self.routing_table[node_id] = parent_id
    
    def _update_routing_table_after_removal(self, removed_node_id: str) -> None:
        """节点移除后更新路由表
        
        Args:
            removed_node_id: 被移除的节点ID
        """
        # 移除直接路由
        if removed_node_id in self.routing_table:
            del self.routing_table[removed_node_id]
        
        # 移除通过该节点的路由
        to_update = []
        for target_id, next_hop in self.routing_table.items():
            if next_hop == removed_node_id:
                to_update.append(target_id)
        
        # 为受影响的目标重新计算路由
        for target_id in to_update:
            self._update_routing_table(target_id)
    
    def cleanup_inactive_nodes(self, max_inactive_time: int = 300) -> None:
        """清理非活跃节点
        
        Args:
            max_inactive_time: 最大非活跃时间（秒）
        """
        now = datetime.now()
        to_remove = []
        
        with self.lock:
            for node_id, node in self.nodes.items():
                if node_id != self.node_id and node.is_active:
                    inactive_time = (now - node.last_seen).total_seconds()
                    if inactive_time > max_inactive_time:
                        node.is_active = False
                        logger.info(f"节点 {node_id} 已超过 {max_inactive_time} 秒未活跃")
                        
                        # 如果配置为自动移除，添加到待移除列表
                        # 这里简化为不自动移除，只标记为非活跃
                        # to_remove.append(node_id)
        
        # 移除非活跃节点
        for node_id in to_remove:
            self.remove_node(node_id)
    
    def get_topology_info(self) -> Dict[str, Any]:
        """获取拓扑信息
        
        Returns:
            Dict[str, Any]: 拓扑信息
        """
        with self.lock:
            nodes_info = {}
            for node_id, node in self.nodes.items():
                nodes_info[node_id] = {
                    "role": node.role.value,
                    "is_active": node.is_active,
                    "neighbors": list(node.neighbors),
                    "groups": list(node.groups),
                    "last_seen": node.last_seen.isoformat()
                }
            
            groups_info = {}
            for group_id, group in self.groups.items():
                groups_info[group_id] = {
                    "name": group.name,
                    "members": list(group.members),
                    "created_at": group.created_at.isoformat()
                }
            
            return {
                "topology_type": self.topology_type.value,
                "node_id": self.node_id,
                "central_nodes": list(self.central_nodes),
                "nodes": nodes_info,
                "groups": groups_info,
                "routing_table": self.routing_table
            }