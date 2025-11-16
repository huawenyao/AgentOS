"""
EFIAgent 通信框架测试
Implementation Date: 2024-01-16

验证多模态协作通信框架的核心功能，包括拓扑自适应、分布式状态管理和协作协议。
"""

import pytest
import asyncio
import time
import json
from unittest.mock import AsyncMock, MagicMock
import redis.asyncio as redis

from efiagent.core.communication import (
    CollaborativeCommunicationFramework,
    DistributedStateManager,
    Message,
    MessageType,
    Priority,
    NetworkNode,
    TopologyType,
    StateOperation,
    NodeState
)
from efiagent.core.communication.communication_integration import (
    IntegratedCommunicationNode,
    create_collaboration_cluster
)

class TestMessage:
    """测试消息类"""

    def test_message_creation(self):
        """测试消息创建"""
        message = Message(
            id="test_msg_001",
            sender_id="agent_1",
            receiver_id="agent_2",
            message_type=MessageType.TASK_ASSIGNMENT,
            content={"task": "test_task"},
            priority=Priority.HIGH
        )

        assert message.id == "test_msg_001"
        assert message.sender_id == "agent_1"
        assert message.receiver_id == "agent_2"
        assert message.message_type == MessageType.TASK_ASSIGNMENT
        assert message.content["task"] == "test_task"
        assert message.priority == Priority.HIGH
        assert message.timestamp > 0

    def test_message_serialization(self):
        """测试消息序列化"""
        message = Message(
            id="test_msg_002",
            sender_id="agent_1",
            receiver_id="agent_2",
            message_type=MessageType.HEARTBEAT,
            content={"status": "alive"}
        )

        # 测试JSON序列化
        message_json = message.json()
        assert isinstance(message_json, str)

        # 测试反序列化
        parsed_message = Message.parse_raw(message_json)
        assert parsed_message.id == message.id
        assert parsed_message.sender_id == message.sender_id
        assert parsed_message.receiver_id == message.receiver_id

class TestNetworkNode:
    """测试网络节点"""

    def test_network_node_creation(self):
        """测试网络节点创建"""
        node = NetworkNode(
            agent_id="agent_1",
            endpoint="http://localhost:8001",
            capabilities=["data_analysis", "machine_learning"],
            workload=0.5,
            availability=0.95,
            bandwidth=1000.0,
            latency=15.0
        )

        assert node.agent_id == "agent_1"
        assert node.endpoint == "http://localhost:8001"
        assert len(node.capabilities) == 2
        assert "data_analysis" in node.capabilities
        assert node.workload == 0.5
        assert node.availability == 0.95
        assert node.bandwidth == 1000.0
        assert node.latency == 15.0

@pytest.mark.asyncio
class TestCollaborativeCommunicationFramework:
    """测试协作通信框架"""

    @pytest.fixture
    async def mock_redis(self):
        """模拟Redis客户端"""
        mock_client = AsyncMock(spec=redis.Redis)
        mock_client.from_url = AsyncMock(return_value=mock_client)
        mock_client.lpush = AsyncMock()
        mock_client.brpop = AsyncMock(return_value=None)
        mock_client.expire = AsyncMock()
        mock_client.publish = AsyncMock()
        mock_client.close = AsyncMock()
        return mock_client

    @pytest.fixture
    def sample_nodes(self):
        """示例节点列表"""
        return [
            NetworkNode(
                agent_id="agent_1",
                endpoint="http://localhost:8001",
                capabilities=["data_analysis"],
                workload=0.3,
                availability=0.95
            ),
            NetworkNode(
                agent_id="agent_2",
                endpoint="http://localhost:8002",
                capabilities=["machine_learning"],
                workload=0.6,
                availability=0.90
            ),
            NetworkNode(
                agent_id="agent_3",
                endpoint="http://localhost:8003",
                capabilities=["optimization", "processing"],
                workload=0.2,
                availability=0.98
            )
        ]

    @pytest.fixture
    async def communication_framework(self, mock_redis):
        """通信框架实例"""
        framework = CollaborativeCommunicationFramework(
            agent_id="agent_1",
            redis_url="redis://localhost:6379"
        )
        framework.redis = mock_redis
        return framework

    async def test_framework_initialization(self, communication_framework, sample_nodes):
        """测试框架初始化"""
        node_info = sample_nodes[0]

        # 不启动后台任务，只测试初始化逻辑
        communication_framework.node_info = node_info
        communication_framework.topology_manager = MagicMock()
        communication_framework.topology_manager.initialize_topology = AsyncMock()

        assert communication_framework.agent_id == "agent_1"
        assert communication_framework.node_info == node_info

    async def test_message_sending(self, communication_framework):
        """测试消息发送"""
        # 模拟拓扑管理器
        communication_framework.topology_manager = MagicMock()
        communication_framework.topology_manager.get_route = AsyncMock(return_value=["agent_1", "agent_2"])

        # 测试发送消息
        success = await communication_framework.send_message(
            receiver_id="agent_2",
            message_type=MessageType.TASK_ASSIGNMENT,
            content={"task": "test_task"},
            priority=Priority.HIGH
        )

        assert success is True
        assert communication_framework.metrics['messages_sent'] == 1

    async def test_broadcast_message(self, communication_framework):
        """测试广播消息"""
        # 模拟拓扑管理器
        communication_framework.topology_manager = MagicMock()
        communication_framework.topology_manager.topology = MagicMock()
        communication_framework.topology_manager.topology.nodes = {"agent_1", "agent_2", "agent_3"}
        communication_framework.topology_manager.get_route = AsyncMock(return_value=["agent_1", "agent_2"])

        success_count = await communication_framework.broadcast_message(
            message_type=MessageType.HEARTBEAT,
            content={"status": "alive"},
            priority=Priority.NORMAL
        )

        assert success_count == 2  # agent_1 和 agent_2
        assert communication_framework.metrics['messages_sent'] == 2

    async def test_message_handler_registration(self, communication_framework):
        """测试消息处理器注册"""
        # 注册处理器
        async def test_handler(message):
            pass

        communication_framework.register_handler(MessageType.HEARTBEAT, test_handler)

        assert MessageType.HEARTBEAT in communication_framework.message_handlers
        assert communication_framework.message_handlers[MessageType.HEARTBEAT] == test_handler

    async def test_heartbeat_handling(self, communication_framework):
        """测试心跳处理"""
        communication_framework.topology_manager = MagicMock()
        communication_framework.topology_manager.topology = MagicMock()
        communication_framework.topology_manager.topology.nodes = {"agent_1", "agent_2"}
        communication_framework.topology_manager.topology.nodes.get = MagicMock(return_value={'last_heartbeat': 0})
        communication_framework.send_message = AsyncMock(return_value=True)

        heartbeat_message = Message(
            id="heartbeat_001",
            sender_id="agent_2",
            receiver_id="agent_1",
            message_type=MessageType.HEARTBEAT,
            content={"status": "alive"}
        )

        await communication_framework._handle_heartbeat(heartbeat_message)

        # 验证心跳回复
        communication_framework.send_message.assert_called_once()

@pytest.mark.asyncio
class TestDistributedStateManager:
    """测试分布式状态管理器"""

    @pytest.fixture
    async def mock_state_redis(self):
        """模拟状态管理Redis客户端"""
        mock_client = AsyncMock(spec=redis.Redis)
        mock_client.from_url = AsyncMock(return_value=mock_client)
        mock_client.get = AsyncMock(return_value=None)
        mock_client.set = AsyncMock()
        mock_client.setex = AsyncMock()
        mock_client.hset = AsyncMock()
        mock_client.publish = AsyncMock()
        mock_client.close = AsyncMock()
        return mock_client

    @pytest.fixture
    def state_manager(self, mock_state_redis):
        """状态管理器实例"""
        manager = DistributedStateManager(
            node_id="node_1",
            cluster_nodes=["node_1", "node_2", "node_3"],
            redis_url="redis://localhost:6379"
        )
        manager.redis = mock_state_redis
        return manager

    async def test_state_manager_initialization(self, state_manager):
        """测试状态管理器初始化"""
        assert state_manager.node_id == "node_1"
        assert len(state_manager.cluster_nodes) == 3
        assert state_manager.raft_node.state == NodeState.FOLLOWER
        assert state_manager.raft_node.current_term == 0

    async def test_set_operation(self, state_manager):
        """测试设置操作"""
        # 模拟领导者状态
        state_manager.raft_node.state = NodeState.LEADER

        # 模拟日志复制成功
        state_manager._replicate_log_entry = AsyncMock(return_value=True)

        success = await state_manager.set("test_key", "test_value")

        assert success is True
        state_manager._replicate_log_entry.assert_called_once()

    async def test_get_operation(self, state_manager):
        """测试获取操作"""
        # 模拟状态机返回值
        state_manager.state_machine.get = AsyncMock(return_value="test_value")

        value = await state_manager.get("test_key")

        assert value == "test_value"
        state_manager.state_machine.get.assert_called_once_with("test_key")

    async def test_increment_operation(self, state_manager):
        """测试递增操作"""
        state_manager.raft_node.state = NodeState.LEADER
        state_manager._replicate_log_entry = AsyncMock(return_value=True)

        success = await state_manager.increment("counter", 5)

        assert success is True
        state_manager._replicate_log_entry.assert_called_once()

    async def test_delete_operation(self, state_manager):
        """测试删除操作"""
        state_manager.raft_node.state = NodeState.LEADER
        state_manager._replicate_log_entry = AsyncMock(return_value=True)

        success = await state_manager.delete("test_key")

        assert success is True
        state_manager._replicate_log_entry.assert_called_once()

    async def test_cluster_status(self, state_manager):
        """测试集群状态获取"""
        status = await state_manager.get_cluster_status()

        assert 'node_id' in status
        assert 'state' in status
        assert 'term' in status
        assert 'cluster_size' in status
        assert status['node_id'] == "node_1"
        assert status['cluster_size'] == 3

@pytest.mark.asyncio
class TestIntegratedCommunicationNode:
    """测试集成通信节点"""

    @pytest.fixture
    def integrated_node(self):
        """集成节点实例"""
        return IntegratedCommunicationNode(
            agent_id="test_agent",
            node_capabilities=["data_analysis", "machine_learning"],
            cluster_nodes=["test_agent", "agent_2", "agent_3"],
            redis_url="redis://localhost:6379"
        )

    async def test_node_creation(self, integrated_node):
        """测试节点创建"""
        assert integrated_node.agent_id == "test_agent"
        assert len(integrated_node.node_capabilities) == 2
        assert "data_analysis" in integrated_node.node_capabilities
        assert len(integrated_node.cluster_nodes) == 3
        assert integrated_node.running is False

    def test_performance_metrics_initialization(self, integrated_node):
        """测试性能指标初始化"""
        metrics = integrated_node.performance_metrics

        assert metrics['messages_sent'] == 0
        assert metrics['messages_received'] == 0
        assert metrics['collaborations_initiated'] == 0
        assert metrics['collaborations_completed'] == 0
        assert metrics['tasks_completed'] == 0
        assert metrics['avg_response_time'] == 0.0
        assert metrics['success_rate'] == 1.0

@pytest.mark.asyncio
class TestCollaborationScenarios:
    """测试协作场景"""

    async def test_create_collaboration_cluster(self):
        """测试创建协作集群"""
        # 使用模拟的Redis URL避免实际连接
        cluster = await create_collaboration_cluster(
            cluster_size=3,
            capabilities_per_node=2,
            redis_url="redis://mock:6379"
        )

        assert len(cluster) == 3

        # 验证每个节点的配置
        for i, node in enumerate(cluster):
            assert node.agent_id == f"agent_{i+1}"
            assert len(node.node_capabilities) == 2
            assert len(node.cluster_nodes) == 3

        # 清理
        for node in cluster:
            await node.shutdown()

    async def test_collaboration_request_handling(self):
        """测试协作请求处理"""
        # 创建模拟节点
        node = IntegratedCommunicationNode(
            agent_id="test_agent",
            node_capabilities=["data_analysis", "machine_learning"],
            cluster_nodes=["test_agent", "agent_2"],
            redis_url="redis://mock:6379"
        )

        # 模拟依赖
        node.communication_framework = MagicMock()
        node.communication_framework.send_message = AsyncMock(return_value=True)
        node.state_manager = MagicMock()
        node.state_manager.get = AsyncMock(return_value=0.3)
        node.state_manager.set = AsyncMock()

        # 创建协作请求消息
        collaboration_message = Message(
            id="collab_001",
            sender_id="agent_2",
            receiver_id="test_agent",
            message_type=MessageType.COLLABORATION_REQUEST,
            content={
                'task_id': 'task_001',
                'required_capabilities': ['data_analysis'],
                'task_data': {'description': 'Test task'}
            }
        )

        # 处理协作请求
        await node._handle_collaboration_request(collaboration_message)

        # 验证响应发送
        node.communication_framework.send_message.assert_called_once()

        # 验证状态更新
        node.state_manager.set.assert_called()

    async def test_knowledge_sharing(self):
        """测试知识分享"""
        node = IntegratedCommunicationNode(
            agent_id="test_agent",
            node_capabilities=["data_analysis"],
            cluster_nodes=["test_agent", "agent_2"],
            redis_url="redis://mock:6379"
        )

        # 模拟依赖
        node.communication_framework = MagicMock()
        node.communication_framework.broadcast_message = AsyncMock(return_value=2)
        node.state_manager = MagicMock()
        node.state_manager.set = AsyncMock()

        # 分享知识
        recipients_count = await node.share_knowledge(
            knowledge_type="new_technique",
            knowledge_data={
                "method": "Advanced ML",
                "accuracy": 0.95,
                "confidence": 0.9
            }
        )

        assert recipients_count == 2
        node.communication_framework.broadcast_message.assert_called_once()
        node.state_manager.set.assert_called_once()

    async def test_resource_request(self):
        """测试资源请求"""
        node = IntegratedCommunicationNode(
            agent_id="test_agent",
            node_capabilities=["processing"],
            cluster_nodes=["test_agent", "agent_2"],
            redis_url="redis://mock:6379"
        )

        # 模拟依赖
        node.communication_framework = MagicMock()
        node.communication_framework.broadcast_message = AsyncMock(return_value=2)
        node.state_manager = MagicMock()
        node.state_manager.set = AsyncMock()

        # 请求资源
        request_id = await node.request_resource(
            resource_type="computation",
            resource_spec={"complexity": 5, "memory": "2GB"},
            Priority.HIGH
        )

        assert request_id is not None
        assert request_id.startswith("resource_req:")
        node.communication_framework.broadcast_message.assert_called_once()
        node.state_manager.set.assert_called_once()

@pytest.mark.asyncio
class TestPerformanceAndReliability:
    """测试性能和可靠性"""

    async def test_message_throughput(self):
        """测试消息吞吐量"""
        # 创建通信框架
        framework = CollaborativeCommunicationFramework(
            agent_id="perf_test_agent",
            redis_url="redis://mock:6379"
        )

        # 模拟依赖
        framework.topology_manager = MagicMock()
        framework.topology_manager.get_route = AsyncMock(return_value=["perf_test_agent", "target"])
        framework._send_message_via_route = AsyncMock(return_value=True)

        # 发送大量消息
        start_time = time.time()
        message_count = 100

        tasks = []
        for i in range(message_count):
            task = framework.send_message(
                receiver_id="target",
                message_type=MessageType.HEARTBEAT,
                content={"sequence": i},
                Priority.NORMAL
            )
            tasks.append(task)

        results = await asyncio.gather(*tasks)
        end_time = time.time()

        # 验证结果
        successful_messages = sum(results)
        duration = end_time - start_time
        throughput = successful_messages / duration

        assert successful_messages == message_count
        assert throughput > 50  # 至少50消息/秒
        assert framework.metrics['messages_sent'] == message_count

    async def test_error_handling(self):
        """测试错误处理"""
        framework = CollaborativeCommunicationFramework(
            agent_id="error_test_agent",
            redis_url="redis://mock:6379"
        )

        # 模拟网络错误
        framework.topology_manager = MagicMock()
        framework.topology_manager.get_route = AsyncMock(return_value=[])

        # 尝试发送消息到不存在的目标
        success = await framework.send_message(
            receiver_id="nonexistent",
            message_type=MessageType.HEARTBEAT,
            content={"test": "error"}
        )

        assert success is False
        assert framework.metrics['messages_failed'] == 1

    async def test_concurrent_operations(self):
        """测试并发操作"""
        state_manager = DistributedStateManager(
            node_id="concurrent_test",
            cluster_nodes=["concurrent_test", "node_2"],
            redis_url="redis://mock:6379"
        )

        # 模拟领导者状态和成功的日志复制
        state_manager.raft_node.state = NodeState.LEADER
        state_manager._replicate_log_entry = AsyncMock(return_value=True)

        # 并发执行多个操作
        tasks = [
            state_manager.set(f"key_{i}", f"value_{i}")
            for i in range(10)
        ]

        results = await asyncio.gather(*tasks)

        # 验证所有操作都成功
        assert all(results)
        assert state_manager._replicate_log_entry.call_count == 10

# 集成测试标记
pytestmark = pytest.mark.integration

@pytest.mark.asyncio
class TestIntegration:
    """集成测试"""

    async def test_full_collaboration_workflow(self):
        """测试完整的协作工作流"""
        # 这个测试需要真实的Redis连接，所以标记为集成测试
        # 在CI环境中应该跳过或使用测试Redis实例
        pytest.skip("Integration test requires Redis instance")

    async def test_multi_node_cluster_communication(self):
        """测试多节点集群通信"""
        pytest.skip("Integration test requires multiple nodes and Redis instance")