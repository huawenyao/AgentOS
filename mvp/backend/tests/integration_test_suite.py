"""
EFIAgent Phase 2 集成测试套件
Implementation Date: 2024-01-16

验证技能向量匹配、零信任安全架构和多模态协作通信框架的完整集成。
"""

import asyncio
import time
import pytest
import logging
from typing import Dict, List, Any, Optional
from unittest.mock import AsyncMock, MagicMock

from efiagent.core.communication import (
    CollaborativeCommunicationFramework,
    DistributedStateManager,
    NetworkNode,
    MessageType,
    Priority
)
from efiagent.core.communication.communication_integration import (
    IntegratedCommunicationNode,
    create_collaboration_cluster
)
from efiagent.core.capability.skill_vector_matcher import (
    AdvancedSkillVectorMatcher,
    MultiModalSkillEmbedding
)
from efiagent.core.security.zero_trust_manager import (
    ZeroTrustManager,
    SecurityContext,
    AccessLevel
)

logger = logging.getLogger(__name__)

class Phase2IntegrationTestSuite:
    """Phase 2 集成测试套件"""

    def __init__(self, redis_url: str = "redis://localhost:6379"):
        self.redis_url = redis_url
        self.test_nodes: List[IntegratedCommunicationNode] = []
        self.skill_matcher: Optional[AdvancedSkillVectorMatcher] = None
        self.security_manager: Optional[ZeroTrustManager] = None
        self.test_results: Dict[str, Any] = {}

    async def run_all_integration_tests(self) -> Dict[str, Any]:
        """运行所有集成测试"""
        logger.info("开始 Phase 2 集成测试")

        try:
            # 初始化测试环境
            await self.setup_integration_test_environment()

            # 执行集成测试
            await self.test_skill_matching_with_communication()
            await self.test_security_integration_with_collaboration()
            await self.test_end_to_end_workflow()
            await self.test_distributed_state_with_security()
            await self.test_multi_agent_coordination()
            await self.test_fault_tolerance_integration()
            await self.test_performance_under_load()

            # 生成集成测试报告
            report = await self.generate_integration_report()
            return report

        finally:
            await self.cleanup_integration_test_environment()

    async def setup_integration_test_environment(self):
        """设置集成测试环境"""
        logger.info("设置集成测试环境")

        # 创建测试集群
        self.test_nodes = await create_collaboration_cluster(
            cluster_size=8,
            capabilities_per_node=4,
            redis_url=self.redis_url
        )

        # 初始化所有节点
        for i, node in enumerate(self.test_nodes):
            await node.initialize()
            await asyncio.sleep(0.5)

        # 等待网络稳定
        await asyncio.sleep(3)

        # 初始化技能向量匹配器
        self.skill_matcher = AdvancedSkillVectorMatcher(dimension=128)

        # 注册智能体技能
        for i, node in enumerate(self.test_nodes):
            await self.skill_matcher.register_agent_skills(
                node.agent_id,
                node.node_capabilities,
                {
                    "experience_years": i + 1,
                    "success_rate": 0.8 + (i * 0.02),
                    "specialization": node.node_capabilities[0] if node.node_capabilities else "general"
                }
            )

        # 初始化安全管理器
        self.security_manager = ZeroTrustManager()

        logger.info(f"集成测试环境设置完成，节点数: {len(self.test_nodes)}")

    async def cleanup_integration_test_environment(self):
        """清理集成测试环境"""
        logger.info("清理集成测试环境")

        for node in self.test_nodes:
            try:
                await node.shutdown()
            except Exception as e:
                logger.warning(f"节点 {node.agent_id} 清理失败: {e}")

        self.test_nodes.clear()
        logger.info("集成测试环境清理完成")

    async def test_skill_matching_with_communication(self):
        """测试技能匹配与通信的集成"""
        logger.info("测试技能匹配与通信集成")

        test_results = {
            "test_name": "技能匹配与通信集成",
            "subtests": [],
            "overall_success": True
        }

        try:
            # 子测试1: 基于技能的协作请求
            subtest1_success = True
            initiator = self.test_nodes[0]

            # 查找具有特定技能的协作者
            required_skills = ["data_analysis", "machine_learning"]
            collaborators = await self.skill_matcher.find_best_matches(
                required_skills,
                context={"domain": "finance", "complexity": 0.8},
                top_k=3
            )

            # 验证技能匹配结果
            assert len(collaborators) > 0, "未找到匹配的协作者"
            assert all(hasattr(match, 'agent_id') for match in collaborators), "匹配结果格式错误"

            # 发起协作请求
            collaboration_success = await initiator.initiate_collaboration(
                task_id="skill_comm_test_001",
                required_capabilities=required_skills,
                task_data={
                    "description": "Test skill-based collaboration",
                    "domain": "finance",
                    "complexity": 0.8
                },
                max_collaborators=3
            )

            subtest1_success = collaboration_success
            test_results["subtests"].append({
                "name": "基于技能的协作请求",
                "success": subtest1_success,
                "details": {
                    "required_skills": required_skills,
                    "found_collaborators": len(collaborators),
                    "collaboration_success": collaboration_success
                }
            })

            # 子测试2: 动态技能学习与传播
            subtest2_success = True

            # 模拟技能学习
            learner_node = self.test_nodes[1]
            new_skill = "blockchain_analysis"

            # 分享新技能知识
            knowledge_success = await learner_node.share_knowledge(
                knowledge_type="new_skill",
                knowledge_data={
                    "skill": new_skill,
                    "confidence": 0.9,
                    "applicability": ["finance", "security"]
                }
            )

            # 验证知识传播
            await asyncio.sleep(2)

            # 测试技能匹配是否包含新技能
            updated_matches = await self.skill_matcher.find_best_matches(
                [new_skill],
                context={"domain": "finance"},
                top_k=1
            )

            subtest2_success = knowledge_success and len(updated_matches) > 0
            test_results["subtests"].append({
                "name": "动态技能学习与传播",
                "success": subtest2_success,
                "details": {
                    "new_skill": new_skill,
                    "knowledge_shared": knowledge_success,
                    "updated_matches": len(updated_matches)
                }
            })

            test_results["overall_success"] = subtest1_success and subtest2_success

        except Exception as e:
            logger.error(f"技能匹配与通信集成测试失败: {e}")
            test_results["overall_success"] = False
            test_results["error"] = str(e)

        self.test_results["skill_matching_communication"] = test_results

    async def test_security_integration_with_collaboration(self):
        """测试安全与协作的集成"""
        logger.info("测试安全与协作集成")

        test_results = {
            "test_name": "安全与协作集成",
            "subtests": [],
            "overall_success": True
        }

        try:
            # 子测试1: 协作请求的安全验证
            subtest1_success = True

            # 创建安全上下文
            security_context = SecurityContext(
                agent_id=self.test_nodes[0].agent_id,
                operation="initiate_collaboration",
                resource_id="financial_analysis",
                timestamp=time.time()
            )

            # 验证权限
            authorized = await self.security_manager.authorize_operation(security_context)

            # 模拟权限不足的情况
            restricted_context = SecurityContext(
                agent_id="unauthorized_agent",
                operation="access_sensitive_data",
                resource_id="classified_data",
                timestamp=time.time()
            )

            unauthorized = await self.security_manager.authorize_operation(restricted_context)

            subtest1_success = authorized and not unauthorized
            test_results["subtests"].append({
                "name": "协作请求安全验证",
                "success": subtest1_success,
                "details": {
                    "authorized_agent": authorized,
                    "unauthorized_agent": unauthorized
                }
            })

            # 子测试2: 消息传输安全
            subtest2_success = True

            # 测试加密消息传输
            sender = self.test_nodes[0]
            receiver = self.test_nodes[1]

            # 发送敏感信息
            secure_message_sent = await sender.communication_framework.send_message(
                receiver.agent_id,
                MessageType.TASK_ASSIGNMENT,
                {
                    "task": "sensitive_analysis",
                    "data": "confidential_information",
                    "security_level": "high"
                },
                Priority.HIGH
            )

            # 验证消息安全处理
            await asyncio.sleep(1)

            subtest2_success = secure_message_sent
            test_results["subtests"].append({
                "name": "消息传输安全",
                "success": subtest2_success,
                "details": {
                    "secure_message_sent": secure_message_sent,
                    "sender": sender.agent_id,
                    "receiver": receiver.agent_id
                }
            })

            # 子测试3: 动态权限管理
            subtest3_success = True

            # 模拟权限变更
            agent_id = self.test_nodes[2].agent_id
            original_permissions = await self.security_manager.get_agent_permissions(agent_id)

            # 授予临时权限
            await self.security_manager.grant_temporary_permission(
                agent_id,
                "emergency_analysis",
                300  # 5分钟有效期
            )

            updated_permissions = await self.security_manager.get_agent_permissions(agent_id)

            # 验证权限变更
            permission_granted = len(updated_permissions) > len(original_permissions)

            # 撤销权限
            await self.security_manager.revoke_permission(agent_id, "emergency_analysis")
            final_permissions = await self.security_manager.get_agent_permissions(agent_id)

            permission_revoked = len(final_permissions) <= len(original_permissions)

            subtest3_success = permission_granted and permission_revoked
            test_results["subtests"].append({
                "name": "动态权限管理",
                "success": subtest3_success,
                "details": {
                    "original_permissions": len(original_permissions),
                    "permission_granted": permission_granted,
                    "permission_revoked": permission_revoked
                }
            })

            test_results["overall_success"] = all([
                subtest1_success, subtest2_success, subtest3_success
            ])

        except Exception as e:
            logger.error(f"安全与协作集成测试失败: {e}")
            test_results["overall_success"] = False
            test_results["error"] = str(e)

        self.test_results["security_collaboration"] = test_results

    async def test_end_to_end_workflow(self):
        """测试端到端工作流"""
        logger.info("测试端到端工作流")

        test_results = {
            "test_name": "端到端工作流",
            "subtests": [],
            "overall_success": True
        }

        try:
            # 完整工作流：任务接收 -> 技能匹配 -> 安全验证 -> 协作执行 -> 结果聚合
            workflow_start_time = time.time()

            # 步骤1: 接收复杂任务
            task_data = {
                "task_id": "e2e_workflow_001",
                "description": "Complex financial risk analysis",
                "required_skills": ["data_analysis", "machine_learning", "optimization"],
                "security_level": "high",
                "domain": "finance",
                "complexity": 0.9,
                "deadline": time.time() + 3600  # 1小时后
            }

            # 步骤2: 技能匹配
            skill_matches = await self.skill_matcher.find_best_matches(
                task_data["required_skills"],
                context={
                    "domain": task_data["domain"],
                    "complexity": task_data["complexity"]
                },
                top_k=3
            )

            step2_success = len(skill_matches) >= 2
            test_results["subtests"].append({
                "name": "技能匹配步骤",
                "success": step2_success,
                "details": {
                    "required_skills": task_data["required_skills"],
                    "matched_agents": len(skill_matches)
                }
            })

            # 步骤3: 安全验证
            selected_agents = [match.agent_id for match in skill_matches[:2]]
            security_validations = []

            for agent_id in selected_agents:
                context = SecurityContext(
                    agent_id=agent_id,
                    operation="execute_financial_analysis",
                    resource_id="financial_data",
                    timestamp=time.time()
                )
                authorized = await self.security_manager.authorize_operation(context)
                security_validations.append(authorized)

            step3_success = all(security_validations)
            test_results["subtests"].append({
                "name": "安全验证步骤",
                "success": step3_success,
                "details": {
                    "agents_validated": len(selected_agents),
                    "validations_passed": sum(security_validations)
                }
            })

            # 步骤4: 协作执行
            initiator = self.test_nodes[0]
            collaboration_success = await initiator.initiate_collaboration(
                task_id=task_data["task_id"],
                required_capabilities=task_data["required_skills"],
                task_data=task_data,
                max_collaborators=2
            )

            step4_success = collaboration_success
            test_results["subtests"].append({
                "name": "协作执行步骤",
                "success": step4_success,
                "details": {
                    "task_id": task_data["task_id"],
                    "collaboration_initiated": collaboration_success
                }
            })

            # 步骤5: 状态同步和监控
            await asyncio.sleep(3)

            # 检查分布式状态一致性
            state_consistency_checks = []
            for node in self.test_nodes[:3]:  # 检查前3个节点
                try:
                    task_status = await node.state_manager.get(f"task:{task_data['task_id']}:status")
                    state_consistency_checks.append(task_status is not None)
                except Exception:
                    state_consistency_checks.append(False)

            step5_success = any(state_consistency_checks)
            test_results["subtests"].append({
                "name": "状态同步步骤",
                "success": step5_success,
                "details": {
                    "nodes_checked": len(state_consistency_checks),
                    "consistent_nodes": sum(state_consistency_checks)
                }
            })

            # 工作流总评估
            workflow_end_time = time.time()
            workflow_duration = workflow_end_time - workflow_start_time

            test_results["overall_success"] = all([
                step2_success, step3_success, step4_success, step5_success
            ])
            test_results["workflow_duration"] = workflow_duration
            test_results["workflow_efficiency"] = workflow_duration < 30  # 30秒内完成

        except Exception as e:
            logger.error(f"端到端工作流测试失败: {e}")
            test_results["overall_success"] = False
            test_results["error"] = str(e)

        self.test_results["end_to_end_workflow"] = test_results

    async def test_distributed_state_with_security(self):
        """测试分布式状态与安全的集成"""
        logger.info("测试分布式状态与安全集成")

        test_results = {
            "test_name": "分布式状态与安全集成",
            "subtests": [],
            "overall_success": True
        }

        try:
            # 子测试1: 安全状态存储
            subtest1_success = True

            # 存储敏感状态信息
            sensitive_state = {
                "financial_analysis_result": {
                    "risk_score": 0.75,
                    "confidence": 0.92,
                    "recommendations": ["reduce_exposure", "increase_hedging"]
                },
                "access_level": "confidential",
                "created_by": self.test_nodes[0].agent_id,
                "timestamp": time.time()
            }

            # 使用安全管理器加密状态
            encrypted_state = await self.security_manager.encrypt_sensitive_data(sensitive_state)

            # 存储到分布式状态管理器
            state_key = f"secure_analysis_{int(time.time())}"
            storage_success = await self.test_nodes[0].state_manager.set(state_key, encrypted_state)

            # 验证存储
            retrieved_encrypted = await self.test_nodes[1].state_manager.get(state_key)
            retrieved_state = await self.security_manager.decrypt_sensitive_data(retrieved_encrypted)

            subtest1_success = storage_success and retrieved_state == sensitive_state
            test_results["subtests"].append({
                "name": "安全状态存储",
                "success": subtest1_success,
                "details": {
                    "storage_success": storage_success,
                    "retrieval_success": retrieved_state == sensitive_state
                }
            })

            # 子测试2: 基于权限的状态访问控制
            subtest2_success = True

            # 创建不同权限级别的上下文
            high_privilege_context = SecurityContext(
                agent_id=self.test_nodes[0].agent_id,
                operation="read_confidential_data",
                resource_id=state_key,
                timestamp=time.time()
            )

            low_privilege_context = SecurityContext(
                agent_id="limited_agent",
                operation="read_confidential_data",
                resource_id=state_key,
                timestamp=time.time()
            )

            # 验证权限控制
            high_privilege_access = await self.security_manager.authorize_operation(high_privilege_context)
            low_privilege_access = await self.security_manager.authorize_operation(low_privilege_context)

            subtest2_success = high_privilege_access and not low_privilege_access
            test_results["subtests"].append({
                "name": "权限状态访问控制",
                "success": subtest2_success,
                "details": {
                    "high_privilege_access": high_privilege_access,
                    "low_privilege_access": low_privilege_access
                }
            })

            test_results["overall_success"] = subtest1_success and subtest2_success

        except Exception as e:
            logger.error(f"分布式状态与安全集成测试失败: {e}")
            test_results["overall_success"] = False
            test_results["error"] = str(e)

        self.test_results["distributed_state_security"] = test_results

    async def test_multi_agent_coordination(self):
        """测试多智能体协调"""
        logger.info("测试多智能体协调")

        test_results = {
            "test_name": "多智能体协调",
            "subtests": [],
            "overall_success": True
        }

        try:
            # 子测试1: 动态团队组成
            subtest1_success = True

            # 复杂任务需要多种技能
            complex_task = {
                "task_id": "coordination_test_001",
                "required_skills": ["data_analysis", "machine_learning", "optimization", "planning"],
                "context": {"domain": "supply_chain", "complexity": 0.85}
            }

            # 动态组建团队
            team_matches = await self.skill_matcher.dynamic_team_composition(
                task_requirements=complex_task["required_skills"],
                team_size=4,
                context=complex_task["context"]
            )

            subtest1_success = len(team_matches) >= 3
            test_results["subtests"].append({
                "name": "动态团队组成",
                "success": subtest1_success,
                "details": {
                    "required_skills": complex_task["required_skills"],
                    "team_size": len(team_matches),
                    "team_diversity": len(set(match.agent_id for match in team_matches))
                }
            })

            # 子测试2: 协调通信
            subtest2_success = True

            if team_matches:
                coordinator = self.test_nodes[0]
                team_members = [match.agent_id for match in team_matches[:3]]

                # 发送协调消息
                coordination_success = 0
                for member in team_members:
                    success = await coordinator.communication_framework.send_message(
                        member,
                        MessageType.COORDINATION_REQUEST,
                        {
                            "task_id": complex_task["task_id"],
                            "role": "team_member",
                            "coordination_type": "task_allocation"
                        },
                        Priority.HIGH
                    )
                    if success:
                        coordination_success += 1

                subtest2_success = coordination_success >= len(team_members) * 0.8
                test_results["subtests"].append({
                    "name": "协调通信",
                    "success": subtest2_success,
                    "details": {
                        "team_members": len(team_members),
                        "successful_communications": coordination_success
                    }
                })

            # 子测试3: 负载均衡协调
            subtest3_success = True

            # 模拟高负载情况
            high_load_nodes = self.test_nodes[:3]
            for node in high_load_nodes:
                await node.state_manager.set(f"node:{node.agent_id}:workload", 0.9)

            # 发起负载均衡协调
            coordinator = self.test_nodes[0]
            load_balance_success = await coordinator.communication_framework.broadcast_message(
                MessageType.COORDINATION_REQUEST,
                {
                    "coordination_type": "load_balancing",
                    "trigger": "high_load_detected",
                    "threshold": 0.8
                },
                Priority.HIGH
            )

            # 等待负载均衡响应
            await asyncio.sleep(2)

            subtest3_success = load_balance_success >= 3
            test_results["subtests"].append({
                "name": "负载均衡协调",
                "success": subtest3_success,
                "details": {
                    "high_load_nodes": len(high_load_nodes),
                    "load_balance_responses": load_balance_success
                }
            })

            test_results["overall_success"] = all([
                subtest1_success, subtest2_success, subtest3_success
            ])

        except Exception as e:
            logger.error(f"多智能体协调测试失败: {e}")
            test_results["overall_success"] = False
            test_results["error"] = str(e)

        self.test_results["multi_agent_coordination"] = test_results

    async def test_fault_tolerance_integration(self):
        """测试容错集成"""
        logger.info("测试容错集成")

        test_results = {
            "test_name": "容错集成",
            "subtests": [],
            "overall_success": True
        }

        try:
            # 子测试1: 节点故障恢复
            subtest1_success = True

            # 选择一个节点进行故障模拟
            fault_node = self.test_nodes[0]
            other_nodes = self.test_nodes[1:]

            # 记录故障前状态
            pre_fault_status = {}
            for node in other_nodes:
                try:
                    status = await node.get_status()
                    pre_fault_status[node.agent_id] = status.get('running', False)
                except Exception:
                    pre_fault_status[node.agent_id] = False

            # 模拟节点故障
            await fault_node.shutdown()
            await asyncio.sleep(2)

            # 检查其他节点状态
            during_fault_status = {}
            for node in other_nodes:
                try:
                    status = await node.get_status()
                    during_fault_status[node.agent_id] = status.get('running', False)
                except Exception:
                    during_fault_status[node.agent_id] = False

            # 恢复节点
            await fault_node.initialize()
            await asyncio.sleep(3)

            # 检查恢复后状态
            post_recovery_status = {}
            for node in self.test_nodes:
                try:
                    status = await node.get_status()
                    post_recovery_status[node.agent_id] = status.get('running', False)
                except Exception:
                    post_recovery_status[node.agent_id] = False

            # 评估容错能力
            resilience_rate = sum(during_fault_status.values()) / len(during_fault_status)
            recovery_rate = sum(post_recovery_status.values()) / len(post_recovery_status)

            subtest1_success = resilience_rate >= 0.7 and recovery_rate >= 0.9
            test_results["subtests"].append({
                "name": "节点故障恢复",
                "success": subtest1_success,
                "details": {
                    "resilience_rate": resilience_rate,
                    "recovery_rate": recovery_rate
                }
            })

            # 子测试2: 通信中断恢复
            subtest2_success = True

            # 测试消息重试机制
            sender = self.test_nodes[1] if self.test_nodes[1].running else self.test_nodes[2]
            receiver = fault_node if fault_node.running else self.test_nodes[3]

            # 发送消息（可能失败）
            messages_sent = 0
            successful_deliveries = 0

            for i in range(10):
                success = await sender.communication_framework.send_message(
                    receiver.agent_id,
                    MessageType.HEARTBEAT,
                    {"test_id": i, "timestamp": time.time()},
                    Priority.NORMAL
                )
                messages_sent += 1
                if success:
                    successful_deliveries += 1

                await asyncio.sleep(0.5)

            delivery_rate = successful_deliveries / messages_sent if messages_sent > 0 else 0
            subtest2_success = delivery_rate >= 0.5  # 至少50%的消息投递成功

            test_results["subtests"].append({
                "name": "通信中断恢复",
                "success": subtest2_success,
                "details": {
                    "messages_sent": messages_sent,
                    "successful_deliveries": successful_deliveries,
                    "delivery_rate": delivery_rate
                }
            })

            test_results["overall_success"] = subtest1_success and subtest2_success

        except Exception as e:
            logger.error(f"容错集成测试失败: {e}")
            test_results["overall_success"] = False
            test_results["error"] = str(e)

        self.test_results["fault_tolerance"] = test_results

    async def test_performance_under_load(self):
        """测试负载下的性能"""
        logger.info("测试负载下的性能")

        test_results = {
            "test_name": "负载性能测试",
            "subtests": [],
            "overall_success": True
        }

        try:
            # 子测试1: 高并发协作请求
            subtest1_success = True

            concurrent_requests = 50
            successful_requests = 0
            request_times = []

            async def make_collaboration_request(request_id):
                start_time = time.time()
                try:
                    initiator = self.test_nodes[request_id % len(self.test_nodes)]
                    success = await initiator.initiate_collaboration(
                        task_id=f"load_test_{request_id}",
                        required_capabilities=["data_analysis", "processing"],
                        task_data={"test": True, "request_id": request_id},
                        max_collaborators=2
                    )
                    end_time = time.time()
                    return success, (end_time - start_time) * 1000
                except Exception as e:
                    return False, 0

            # 并发执行协作请求
            tasks = [make_collaboration_request(i) for i in range(concurrent_requests)]
            results = await asyncio.gather(*tasks)

            for success, response_time in results:
                if success:
                    successful_requests += 1
                    request_times.append(response_time)

            success_rate = successful_requests / concurrent_requests
            avg_response_time = sum(request_times) / len(request_times) if request_times else 0

            subtest1_success = success_rate >= 0.8 and avg_response_time < 5000  # 5秒内完成
            test_results["subtests"].append({
                "name": "高并发协作请求",
                "success": subtest1_success,
                "details": {
                    "concurrent_requests": concurrent_requests,
                    "successful_requests": successful_requests,
                    "success_rate": success_rate,
                    "avg_response_time_ms": avg_response_time
                }
            })

            # 子测试2: 内存和CPU使用监控
            subtest2_success = True

            import psutil
            process = psutil.Process()
            initial_memory = process.memory_info().rss / 1024 / 1024  # MB
            initial_cpu = process.cpu_percent()

            # 执行密集操作
            await self.test_performance_operations()

            final_memory = process.memory_info().rss / 1024 / 1024  # MB
            final_cpu = process.cpu_percent()

            memory_increase = final_memory - initial_memory
            cpu_increase = final_cpu - initial_cpu

            subtest2_success = memory_increase < 500 and cpu_increase < 80  # 内存增长<500MB, CPU增长<80%
            test_results["subtests"].append({
                "name": "资源使用监控",
                "success": subtest2_success,
                "details": {
                    "initial_memory_mb": initial_memory,
                    "final_memory_mb": final_memory,
                    "memory_increase_mb": memory_increase,
                    "initial_cpu_percent": initial_cpu,
                    "final_cpu_percent": final_cpu,
                    "cpu_increase_percent": cpu_increase
                }
            })

            test_results["overall_success"] = subtest1_success and subtest2_success

        except Exception as e:
            logger.error(f"负载性能测试失败: {e}")
            test_results["overall_success"] = False
            test_results["error"] = str(e)

        self.test_results["performance_under_load"] = test_results

    async def test_performance_operations(self):
        """执行性能测试操作"""
        # 大量消息发送
        for i in range(100):
            for node in self.test_nodes[:5]:
                if node.running:
                    await node.communication_framework.send_message(
                        "test_target",
                        MessageType.HEARTBEAT,
                        {"load_test": True, "iteration": i},
                        Priority.NORMAL
                    )

        # 大量状态操作
        for i in range(200):
            if self.test_nodes[0].running:
                await self.test_nodes[0].state_manager.set(f"load_test_key_{i}", f"load_test_value_{i}")
                await self.test_nodes[0].state_manager.get(f"load_test_key_{i}")

        await asyncio.sleep(1)

    async def generate_integration_report(self) -> Dict[str, Any]:
        """生成集成测试报告"""
        logger.info("生成集成测试报告")

        total_tests = len(self.test_results)
        passed_tests = len([r for r in self.test_results.values() if r.get("overall_success", False)])
        failed_tests = total_tests - passed_tests

        report = {
            "test_time": time.strftime("%Y-%m-%d %H:%M:%S"),
            "test_environment": {
                "nodes_count": len(self.test_nodes),
                "redis_url": self.redis_url,
                "components": ["技能向量匹配", "零信任安全", "多模态通信", "分布式状态"]
            },
            "summary": {
                "total_tests": total_tests,
                "passed_tests": passed_tests,
                "failed_tests": failed_tests,
                "pass_rate": f"{(passed_tests/total_tests*100):.1f}%" if total_tests > 0 else "0%"
            },
            "detailed_results": {},
            "integration_assessment": "优秀" if passed_tests/total_tests >= 0.9 else "良好" if passed_tests/total_tests >= 0.7 else "需改进",
            "recommendations": []
        }

        # 添加详细结果
        for test_name, test_result in self.test_results.items():
            report["detailed_results"][test_name] = {
                "name": test_result.get("test_name", test_name),
                "overall_success": test_result.get("overall_success", False),
                "subtests": test_result.get("subtests", []),
                "error": test_result.get("error")
            }

        # 生成改进建议
        failed_test_names = [name for name, result in self.test_results.items() if not result.get("overall_success", False)]

        if "skill_matching_communication" in failed_test_names:
            report["recommendations"].append("优化技能向量匹配算法，提高匹配精度")
        if "security_collaboration" in failed_test_names:
            report["recommendations"].append("增强安全验证机制，优化权限检查性能")
        if "end_to_end_workflow" in failed_test_names:
            report["recommendations"].append("优化工作流协调机制，提高各组件协同效率")
        if "fault_tolerance" in failed_test_names:
            report["recommendations"].append("增强故障检测和自动恢复能力")
        if "performance_under_load" in failed_test_names:
            report["recommendations"].append("优化并发处理能力，提高系统负载性能")

        return report

async def run_phase2_integration_tests():
    """运行Phase 2集成测试"""
    print("🔗 开始 EFIAgent Phase 2 集成测试")
    print("=" * 60)

    # 设置日志
    logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

    # 创建集成测试套件
    test_suite = Phase2IntegrationTestSuite(redis_url="redis://localhost:6379")

    try:
        # 运行所有集成测试
        report = await test_suite.run_all_integration_tests()

        # 显示测试摘要
        print("\n" + "=" * 60)
        print("📋 集成测试摘要")
        print("=" * 60)
        print(f"总测试数: {report['summary']['total_tests']}")
        print(f"通过测试数: {report['summary']['passed_tests']}")
        print(f"失败测试数: {report['summary']['failed_tests']}")
        print(f"通过率: {report['summary']['pass_rate']}")
        print(f"集成评估: {report['integration_assessment']}")

        # 显示详细结果
        print(f"\n📊 详细测试结果")
        print("-" * 40)
        for test_name, result in report["detailed_results"].items():
            status = "✅" if result["overall_success"] else "❌"
            print(f"{status} {result['name']}")

            if result.get("subtests"):
                for subtest in result["subtests"]:
                    subtest_status = "✅" if subtest["success"] else "❌"
                    print(f"  {subtest_status} {subtest['name']}")

            if result.get("error"):
                print(f"  ❌ 错误: {result['error']}")

        # 显示建议
        if report["recommendations"]:
            print(f"\n💡 改进建议")
            print("-" * 40)
            for i, recommendation in enumerate(report["recommendations"], 1):
                print(f"{i}. {recommendation}")

        print(f"\n✅ Phase 2 集成测试完成!")

        return report

    except Exception as e:
        print(f"❌ 集成测试执行失败: {e}")
        logger.exception("Integration test execution failed")
        raise

if __name__ == "__main__":
    # 运行集成测试
    asyncio.run(run_phase2_integration_tests())