"""
EFIAgent 通信框架集成示例
Implementation Date: 2024-01-16

演示协作通信框架与分布式状态管理的集成使用，支持企业级多智能体协作场景。
"""

import asyncio
import time
import random
from typing import Dict, List, Any, Optional
import logging

from .collaborative_framework import (
    CollaborativeCommunicationFramework,
    Message,
    MessageType,
    Priority,
    NetworkNode,
    TopologyType
)
from .distributed_state import (
    DistributedStateManager,
    StateOperation,
    NodeState
)

logger = logging.getLogger(__name__)

class IntegratedCommunicationNode:
    """集成通信节点"""

    def __init__(
        self,
        agent_id: str,
        node_capabilities: List[str],
        cluster_nodes: List[str],
        redis_url: str = "redis://localhost:6379"
    ):
        self.agent_id = agent_id
        self.node_capabilities = node_capabilities
        self.cluster_nodes = cluster_nodes
        self.redis_url = redis_url

        # 核心组件
        self.communication_framework = None
        self.state_manager = None
        self.node_info = None

        # 运行状态
        self.running = False
        self.current_tasks = {}
        self.collaboration_history = []

        # 性能指标
        self.performance_metrics = {
            'messages_sent': 0,
            'messages_received': 0,
            'collaborations_initiated': 0,
            'collaborations_completed': 0,
            'tasks_completed': 0,
            'avg_response_time': 0.0,
            'success_rate': 1.0
        }

    async def initialize(self):
        """初始化集成节点"""
        try:
            # 创建节点信息
            self.node_info = NetworkNode(
                agent_id=self.agent_id,
                endpoint=f"http://localhost:8000/{self.agent_id}",
                capabilities=self.node_capabilities,
                workload=0.0,
                availability=1.0,
                bandwidth=1000.0,
                latency=random.uniform(5, 20)
            )

            # 初始化通信框架
            self.communication_framework = CollaborativeCommunicationFramework(
                agent_id=self.agent_id,
                redis_url=self.redis_url
            )

            # 初始化状态管理器
            self.state_manager = DistributedStateManager(
                node_id=self.agent_id,
                cluster_nodes=self.cluster_nodes,
                redis_url=self.redis_url
            )

            # 启动组件
            await self.communication_framework.initialize(self.node_info)
            await self.state_manager.initialize()

            # 注册消息处理器
            await self._register_message_handlers()

            # 设置初始状态
            await self.state_manager.set(f"node:{self.agent_id}:capabilities", self.node_capabilities)
            await self.state_manager.set(f"node:{self.agent_id}:status", "active")
            await self.state_manager.set(f"node:{self.agent_id}:workload", 0.0)

            self.running = True
            logger.info(f"Integrated communication node {self.agent_id} initialized")

        except Exception as e:
            logger.error(f"Failed to initialize integrated node: {e}")
            raise

    async def shutdown(self):
        """关闭集成节点"""
        self.running = False

        if self.communication_framework:
            await self.communication_framework.shutdown()

        if self.state_manager:
            await self.state_manager.shutdown()

        logger.info(f"Integrated communication node {self.agent_id} shutdown")

    async def _register_message_handlers(self):
        """注册消息处理器"""
        # 任务协作请求
        self.communication_framework.register_handler(
            MessageType.COLLABORATION_REQUEST,
            self._handle_collaboration_request
        )

        # 知识分享
        self.communication_framework.register_handler(
            MessageType.KNOWLEDGE_SHARE,
            self._handle_knowledge_share
        )

        # 资源请求
        self.communication_framework.register_handler(
            MessageType.RESOURCE_REQUEST,
            self._handle_resource_request
        )

        # 紧急协调
        self.communication_framework.register_handler(
            MessageType.COORDINATION_REQUEST,
            self._handle_coordination_request
        )

    async def initiate_collaboration(
        self,
        task_id: str,
        required_capabilities: List[str],
        task_data: Dict[str, Any],
        max_collaborators: int = 3
    ) -> bool:
        """发起协作请求"""
        try:
            start_time = time.time()

            # 寻找合适的协作者
            collaborators = await self.communication_framework.find_optimal_collaborators(
                required_capabilities=required_capabilities,
                max_collaborators=max_collaborators
            )

            if not collaborators:
                logger.warning(f"No suitable collaborators found for task {task_id}")
                return False

            # 发送协作请求
            collaboration_request = {
                'task_id': task_id,
                'initiator': self.agent_id,
                'required_capabilities': required_capabilities,
                'task_data': task_data,
                'timestamp': time.time(),
                'estimated_duration': task_data.get('estimated_duration', 300)
            }

            success_count = 0
            for collaborator_id in collaborators:
                success = await self.communication_framework.send_message(
                    collaborator_id,
                    MessageType.COLLABORATION_REQUEST,
                    collaboration_request,
                    Priority.HIGH
                )
                if success:
                    success_count += 1

            # 更新协作状态
            await self.state_manager.set(
                f"collaboration:{task_id}:status",
                "requested"
            )
            await self.state_manager.set(
                f"collaboration:{task_id}:participants",
                [self.agent_id] + collaborators
            )

            # 记录协作历史
            self.collaboration_history.append({
                'task_id': task_id,
                'type': 'initiated',
                'collaborators': collaborators,
                'timestamp': time.time(),
                'success_rate': success_count / len(collaborators)
            })

            # 更新性能指标
            self.performance_metrics['collaborations_initiated'] += 1
            self.performance_metrics['messages_sent'] += len(collaborators)

            logger.info(f"Collaboration {task_id} initiated with {success_count}/{len(collaborators)} collaborators")
            return success_count > 0

        except Exception as e:
            logger.error(f"Failed to initiate collaboration {task_id}: {e}")
            return False

    async def share_knowledge(
        self,
        knowledge_type: str,
        knowledge_data: Dict[str, Any],
        target_agents: Optional[List[str]] = None
    ) -> int:
        """分享知识"""
        try:
            knowledge_message = {
                'sender': self.agent_id,
                'knowledge_type': knowledge_type,
                'knowledge_data': knowledge_data,
                'timestamp': time.time(),
                'confidence': knowledge_data.get('confidence', 0.8)
            }

            # 广播知识
            success_count = await self.communication_framework.broadcast_message(
                MessageType.KNOWLEDGE_SHARE,
                knowledge_message,
                Priority.NORMAL,
                target_agents
            )

            # 在分布式状态中存储知识
            await self.state_manager.set(
                f"knowledge:{knowledge_type}:{int(time.time())}",
                {
                    'sender': self.agent_id,
                    'data': knowledge_data,
                    'recipients_count': success_count
                }
            )

            self.performance_metrics['messages_sent'] += success_count
            logger.info(f"Knowledge {knowledge_type} shared with {success_count} agents")

            return success_count

        except Exception as e:
            logger.error(f"Failed to share knowledge {knowledge_type}: {e}")
            return 0

    async def request_resource(
        self,
        resource_type: str,
        resource_spec: Dict[str, Any],
        urgency: Priority = Priority.NORMAL
    ) -> Optional[str]:
        """请求资源"""
        try:
            resource_request = {
                'requester': self.agent_id,
                'resource_type': resource_type,
                'resource_spec': resource_spec,
                'timestamp': time.time(),
                'urgency': urgency.value
            }

            # 广播资源请求
            success_count = await self.communication_framework.broadcast_message(
                MessageType.RESOURCE_REQUEST,
                resource_request,
                urgency
            )

            # 在分布式状态中记录请求
            request_id = f"resource_req:{int(time.time() * 1000)}"
            await self.state_manager.set(
                f"resource_request:{request_id}",
                {
                    'requester': self.agent_id,
                    'resource_type': resource_type,
                    'spec': resource_spec,
                    'responses_received': 0
                }
            )

            self.performance_metrics['messages_sent'] += success_count
            logger.info(f"Resource request {request_id} sent to {success_count} agents")

            return request_id

        except Exception as e:
            logger.error(f"Failed to request resource {resource_type}: {e}")
            return None

    async def _handle_collaboration_request(self, message: Message):
        """处理协作请求"""
        try:
            content = message.content
            task_id = content['task_id']
            required_capabilities = content['required_capabilities']
            task_data = content['task_data']

            # 检查能力匹配
            my_capabilities = set(self.node_capabilities)
            required_caps = set(required_capabilities)
            capability_match = len(my_capabilities & required_caps) / len(required_caps) if required_caps else 0

            # 检查工作负载
            current_workload = await self.state_manager.get(f"node:{self.agent_id}:workload")
            if current_workload is None:
                current_workload = 0.0

            # 决定是否接受协作
            acceptance_threshold = 0.3  # 至少30%能力匹配
            workload_threshold = 0.8   # 工作负载不超过80%

            accept_collaboration = (
                capability_match >= acceptance_threshold and
                current_workload < workload_threshold
            )

            # 发送响应
            response = {
                'task_id': task_id,
                'responder': self.agent_id,
                'accept': accept_collaboration,
                'capability_match': capability_match,
                'current_workload': current_workload,
                'estimated_completion_time': task_data.get('estimated_duration', 300) * (1 + current_workload)
            }

            await self.communication_framework.send_message(
                message.sender_id,
                MessageType.COLLABORATION_RESPONSE,
                response,
                Priority.HIGH
            )

            if accept_collaboration:
                # 更新工作负载
                new_workload = min(1.0, current_workload + 0.2)
                await self.state_manager.set(f"node:{self.agent_id}:workload", new_workload)

                # 记录协作
                await self.state_manager.set(
                    f"collaboration:{task_id}:participant:{self.agent_id}",
                    {
                        'role': 'collaborator',
                        'acceptance_time': time.time(),
                        'capability_match': capability_match
                    }
                )

                # 更新节点信息
                self.node_info.workload = new_workload

                logger.info(f"Accepted collaboration {task_id} from {message.sender_id}")

        except Exception as e:
            logger.error(f"Error handling collaboration request: {e}")

    async def _handle_knowledge_share(self, message: Message):
        """处理知识分享"""
        try:
            content = message.content
            knowledge_type = content['knowledge_type']
            knowledge_data = content['knowledge_data']

            # 存储接收到的知识
            await self.state_manager.set(
                f"received_knowledge:{knowledge_type}:{int(time.time())}",
                {
                    'sender': content['sender'],
                    'data': knowledge_data,
                    'timestamp': time.time()
                }
            )

            # 如果是高置信度知识，可以更新自己的能力
            confidence = content.get('confidence', 0.0)
            if confidence > 0.8:
                # 根据知识类型更新能力或状态
                if knowledge_type == "capability_improvement":
                    improvements = knowledge_data.get('improvements', [])
                    for improvement in improvements:
                        if improvement not in self.node_capabilities:
                            self.node_capabilities.append(improvement)

                    await self.state_manager.set(
                        f"node:{self.agent_id}:capabilities",
                        self.node_capabilities
                    )

            logger.info(f"Received knowledge {knowledge_type} from {content['sender']}")

        except Exception as e:
            logger.error(f"Error handling knowledge share: {e}")

    async def _handle_resource_request(self, message: Message):
        """处理资源请求"""
        try:
            content = message.content
            resource_type = content['resource_type']
            resource_spec = content['resource_spec']
            requester = content['requester']

            # 检查是否有可用资源
            has_resource = await self._check_resource_availability(resource_type, resource_spec)

            if has_resource:
                # 提供资源
                resource_response = {
                    'request_id': f"{requester}_{int(time.time())}",
                    'provider': self.agent_id,
                    'resource_type': resource_type,
                    'resource_details': has_resource,
                    'availability_time': time.time()
                }

                await self.communication_framework.send_message(
                    requester,
                    MessageType.TASK_RESULT,
                    resource_response,
                    Priority.HIGH
                )

                # 记录资源提供
                await self.state_manager.increment(f"node:{self.agent_id}:resources_provided")

                logger.info(f"Provided {resource_type} resource to {requester}")

        except Exception as e:
            logger.error(f"Error handling resource request: {e}")

    async def _handle_coordination_request(self, message: Message):
        """处理协调请求"""
        try:
            content = message.content
            coordination_type = content.get('type', 'general')

            # 根据协调类型处理
            if coordination_type == "load_balancing":
                await self._handle_load_balancing_coordination(content)
            elif coordination_type == "emergency":
                await self._handle_emergency_coordination(content)
            elif coordination_type == "task_prioritization":
                await self._handle_task_prioritization_coordination(content)

        except Exception as e:
            logger.error(f"Error handling coordination request: {e}")

    async def _check_resource_availability(self, resource_type: str, resource_spec: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """检查资源可用性"""
        # 简化实现：基于能力检查资源可用性
        if resource_type == "computation":
            if "processing" in self.node_capabilities:
                return {
                    'type': 'computation',
                    'capacity': 'high',
                    'estimated_completion': resource_spec.get('complexity', 1) * 10
                }
        elif resource_type == "storage":
            if "data_analysis" in self.node_capabilities:
                return {
                    'type': 'storage',
                    'capacity': 'medium',
                    'availability': 'immediate'
                }
        elif resource_type == "analysis":
            if "data_analysis" in self.node_capabilities:
                return {
                    'type': 'analysis',
                    'methods': self.node_capabilities,
                    'accuracy': 0.95
                }

        return None

    async def _handle_load_balancing_coordination(self, content: Dict[str, Any]):
        """处理负载均衡协调"""
        current_workload = await self.state_manager.get(f"node:{self.agent_id}:workload")
        if current_workload is None:
            current_workload = 0.0

        response = {
            'coordinator': content.get('coordinator'),
            'responder': self.agent_id,
            'current_workload': current_workload,
            'available_capacity': 1.0 - current_workload,
            'timestamp': time.time()
        }

        await self.communication_framework.send_message(
            content.get('coordinator'),
            MessageType.TASK_RESULT,
            response,
            Priority.HIGH
        )

    async def _handle_emergency_coordination(self, content: Dict[str, Any]):
        """处理紧急协调"""
        emergency_type = content.get('emergency_type', 'unknown')

        # 根据紧急类型采取行动
        if emergency_type == "high_load":
            # 降低工作负载
            await self.state_manager.set(f"node:{self.agent_id}:workload", 0.5)
            self.node_info.workload = 0.5
        elif emergency_type == "node_failure":
            # 准备接管失败节点的任务
            logger.warning(f"Preparing to handle tasks from failed node: {content.get('failed_node')}")
        elif emergency_type == "security_alert":
            # 提高安全级别
            await self.state_manager.set(f"node:{self.agent_id}:security_level", "high")

        # 广播紧急响应
        emergency_response = {
            'responder': self.agent_id,
            'emergency_type': emergency_type,
            'action_taken': "mitigation",
            'timestamp': time.time()
        }

        await self.communication_framework.broadcast_message(
            MessageType.EMERGENCY_ALERT,
            emergency_response,
            Priority.CRITICAL
        )

    async def _handle_task_prioritization_coordination(self, content: Dict[str, Any]):
        """处理任务优先级协调"""
        # 提供当前任务状态
        current_tasks = list(self.current_tasks.keys())

        response = {
            'coordinator': content.get('coordinator'),
            'responder': self.agent_id,
            'current_tasks': current_tasks,
            'task_count': len(current_tasks),
            'willing_to_postpone': len(current_tasks) > 3,
            'timestamp': time.time()
        }

        await self.communication_framework.send_message(
            content.get('coordinator'),
            MessageType.TASK_RESULT,
            response,
            Priority.NORMAL
        )

    async def get_status(self) -> Dict[str, Any]:
        """获取节点状态"""
        try:
            # 获取通信框架状态
            comm_status = await self.communication_framework.get_network_status()

            # 获取状态管理器状态
            state_status = await self.state_manager.get_cluster_status()

            # 获取当前工作负载
            current_workload = await self.state_manager.get(f"node:{self.agent_id}:workload")
            if current_workload is None:
                current_workload = 0.0

            return {
                'agent_id': self.agent_id,
                'capabilities': self.node_capabilities,
                'current_workload': current_workload,
                'running': self.running,
                'communication_status': comm_status,
                'state_manager_status': state_status,
                'performance_metrics': self.performance_metrics.copy(),
                'collaboration_history_count': len(self.collaboration_history),
                'active_tasks_count': len(self.current_tasks)
            }

        except Exception as e:
            logger.error(f"Error getting node status: {e}")
            return {'error': str(e)}

    async def update_performance_metrics(self):
        """更新性能指标"""
        try:
            # 计算平均响应时间
            if self.performance_metrics['messages_received'] > 0:
                total_time = sum(
                    entry.get('response_time', 0)
                    for entry in self.collaboration_history[-10:]  # 最近10次协作
                )
                count = min(10, len(self.collaboration_history))
                self.performance_metrics['avg_response_time'] = total_time / count if count > 0 else 0

            # 计算成功率
            total_collaborations = self.performance_metrics['collaborations_initiated']
            if total_collaborations > 0:
                successful_collaborations = sum(
                    1 for entry in self.collaboration_history
                    if entry.get('success_rate', 0) > 0.5
                )
                self.performance_metrics['success_rate'] = successful_collaborations / total_collaborations

        except Exception as e:
            logger.error(f"Error updating performance metrics: {e}")

async def create_collaboration_cluster(
    cluster_size: int = 5,
    capabilities_per_node: int = 3,
    redis_url: str = "redis://localhost:6379"
) -> List[IntegratedCommunicationNode]:
    """创建协作集群"""

    # 定义所有可能的技能
    all_capabilities = [
        "data_analysis", "machine_learning", "natural_language_processing",
        "computer_vision", "optimization", "simulation", "prediction",
        "processing", "reasoning", "planning", "coordination", "monitoring"
    ]

    # 创建节点
    nodes = []
    cluster_nodes = []

    for i in range(cluster_size):
        agent_id = f"agent_{i+1}"

        # 随机分配能力
        node_capabilities = random.sample(all_capabilities, capabilities_per_node)
        cluster_nodes.append(agent_id)

        # 创建节点
        node = IntegratedCommunicationNode(
            agent_id=agent_id,
            node_capabilities=node_capabilities,
            cluster_nodes=cluster_nodes,
            redis_url=redis_url
        )

        nodes.append(node)

    return nodes

async def demonstrate_collaboration_scenario():
    """演示协作场景"""
    # 创建集群
    nodes = await create_collaboration_cluster(cluster_size=5)

    try:
        # 初始化所有节点
        for node in nodes:
            await node.initialize()
            await asyncio.sleep(1)  # 避免并发初始化冲突

        print("=== 协作集群初始化完成 ===")

        # 等待网络稳定
        await asyncio.sleep(5)

        # 获取每个节点的状态
        for node in nodes:
            status = await node.get_status()
            print(f"节点 {node.agent_id}: 能力={status['capabilities']}, 负载={status['current_workload']:.2f}")

        # 模拟协作场景：agent_1 发起复杂分析任务
        print("\n=== 开始协作场景演示 ===")

        initiator = nodes[0]  # agent_1 作为发起者

        # 发起需要多种能力的协作任务
        success = await initiator.initiate_collaboration(
            task_id="complex_analysis_001",
            required_capabilities=["data_analysis", "machine_learning", "optimization"],
            task_data={
                "description": "Complex data analysis with ML optimization",
                "estimated_duration": 600,
                "priority": "high"
            },
            max_collaborators=3
        )

        print(f"协作任务发起结果: {'成功' if success else '失败'}")

        # 等待协作处理
        await asyncio.sleep(10)

        # 分享知识
        await initiator.share_knowledge(
            knowledge_type="analysis_technique",
            knowledge_data={
                "technique": "Advanced ensemble methods",
                "accuracy": 0.95,
                "confidence": 0.9,
                "applicability": ["data_analysis", "machine_learning"]
            }
        )

        # 等待知识传播
        await asyncio.sleep(5)

        # 请求资源
        resource_request_id = await initiator.request_resource(
            resource_type="computation",
            resource_spec={
                "complexity": 8,
                "estimated_time": 300,
                "memory_requirement": "4GB"
            },
            Priority.HIGH
        )

        print(f"资源请求ID: {resource_request_id}")

        # 等待资源分配
        await asyncio.sleep(5)

        # 显示最终状态
        print("\n=== 最终状态 ===")
        for node in nodes:
            status = await node.get_status()
            print(f"节点 {node.agent_id}:")
            print(f"  - 消息发送: {status['performance_metrics']['messages_sent']}")
            print(f"  - 消息接收: {status['performance_metrics']['messages_received']}")
            print(f"  - 协作发起: {status['performance_metrics']['collaborations_initiated']}")
            print(f"  - 协作完成: {status['performance_metrics']['collaborations_completed']}")
            print(f"  - 平均响应时间: {status['performance_metrics']['avg_response_time']:.2f}ms")
            print(f"  - 成功率: {status['performance_metrics']['success_rate']:.2%}")

    finally:
        # 清理资源
        print("\n=== 清理资源 ===")
        for node in nodes:
            await node.shutdown()

if __name__ == "__main__":
    # 运行演示
    logging.basicConfig(level=logging.INFO)
    asyncio.run(demonstrate_collaboration_scenario())