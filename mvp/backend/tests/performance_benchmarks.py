"""
EFIAgent 性能基准测试
Implementation Date: 2024-01-16

Phase 2 完整集成测试和性能基准，验证系统在负载下的表现。
"""

import asyncio
import time
import psutil
import statistics
import json
import random
from typing import Dict, List, Any, Tuple
from dataclasses import dataclass
import logging
import pytest
from concurrent.futures import ThreadPoolExecutor
import numpy as np

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
    SecurityContext
)

logger = logging.getLogger(__name__)

@dataclass
class BenchmarkResult:
    """基准测试结果"""
    test_name: str
    metric_name: str
    value: float
    unit: str
    target_value: float
    achieved_target: bool
    details: Dict[str, Any] = None

class PerformanceBenchmark:
    """性能基准测试套件"""

    def __init__(self, redis_url: str = "redis://localhost:6379"):
        self.redis_url = redis_url
        self.results: List[BenchmarkResult] = []
        self.test_nodes: List[IntegratedCommunicationNode] = []

        # Phase 2 目标指标
        self.phase2_targets = {
            'concurrent_agents': 100,
            'response_time_ms': 100,
            'throughput_msg_per_sec': 1000,
            'availability_percent': 99.9,
            'memory_usage_mb': 2048,
            'cpu_usage_percent': 70,
            'skill_match_accuracy': 0.95,
            'security_overhead_ms': 10
        }

    async def run_all_benchmarks(self) -> Dict[str, Any]:
        """运行所有基准测试"""
        logger.info("开始 Phase 2 性能基准测试")

        try:
            # 初始化测试环境
            await self._setup_test_environment()

            # 通信框架性能测试
            await self._benchmark_communication_throughput()
            await self._benchmark_message_latency()
            await self._benchmark_network_scalability()

            # 技能向量匹配性能测试
            await self._benchmark_skill_matching_speed()
            await self._benchmark_skill_matching_accuracy()

            # 安全系统性能测试
            await self._benchmark_security_overhead()
            await self._benchmark_authorization_performance()

            # 分布式状态管理测试
            await self._benchmark_state_consistency()
            await self._benchmark_state_performance()

            # 系统资源使用测试
            await self._benchmark_memory_usage()
            await self._benchmark_cpu_usage()

            # 可用性和容错测试
            await self._benchmark_system_availability()
            await self._benchmark_fault_tolerance()

            # 生成测试报告
            report = await self._generate_performance_report()

            return report

        finally:
            await self._cleanup_test_environment()

    async def _setup_test_environment(self):
        """设置测试环境"""
        logger.info("设置测试环境")

        # 创建测试集群
        cluster_size = min(20, self.phase2_targets['concurrent_agents'] // 5)
        self.test_nodes = await create_collaboration_cluster(
            cluster_size=cluster_size,
            capabilities_per_node=3,
            redis_url=self.redis_url
        )

        # 初始化所有节点
        for i, node in enumerate(self.test_nodes):
            try:
                await node.initialize()
                await asyncio.sleep(0.5)  # 避免并发初始化冲突
                logger.info(f"节点 {node.agent_id} 初始化完成")
            except Exception as e:
                logger.warning(f"节点 {node.agent_id} 初始化失败: {e}")

        # 等待网络稳定
        await asyncio.sleep(5)

        logger.info(f"测试环境设置完成，成功初始化 {len([n for n in self.test_nodes if n.running])} 个节点")

    async def _cleanup_test_environment(self):
        """清理测试环境"""
        logger.info("清理测试环境")

        for node in self.test_nodes:
            try:
                await node.shutdown()
            except Exception as e:
                logger.warning(f"节点 {node.agent_id} 清理失败: {e}")

        self.test_nodes.clear()
        logger.info("测试环境清理完成")

    async def _benchmark_communication_throughput(self):
        """基准测试：通信吞吐量"""
        logger.info("开始通信吞吐量测试")

        target_throughput = self.phase2_targets['throughput_msg_per_sec']
        test_duration = 30  # 30秒测试
        message_count = 0

        # 选择发送者和接收者
        if len(self.test_nodes) >= 2:
            sender = self.test_nodes[0]
            receivers = self.test_nodes[1:6]  # 5个接收者

            start_time = time.time()
            end_time = start_time + test_duration

            # 持续发送消息
            while time.time() < end_time:
                for receiver in receivers:
                    success = await sender.communication_framework.send_message(
                        receiver.agent_id,
                        MessageType.HEARTBEAT,
                        {"sequence": message_count, "timestamp": time.time()},
                        Priority.NORMAL
                    )
                    if success:
                        message_count += 1

                await asyncio.sleep(0.01)  # 控制发送频率

            actual_duration = time.time() - start_time
            throughput = message_count / actual_duration

            result = BenchmarkResult(
                test_name="通信吞吐量测试",
                metric_name="消息吞吐量",
                value=throughput,
                unit="消息/秒",
                target_value=target_throughput,
                achieved_target=throughput >= target_throughput,
                details={
                    "消息总数": message_count,
                    "测试时长": actual_duration,
                    "发送节点": sender.agent_id,
                    "接收节点数量": len(receivers)
                }
            )

            self.results.append(result)
            logger.info(f"通信吞吐量: {throughput:.2f} 消息/秒 (目标: {target_throughput})")

    async def _benchmark_message_latency(self):
        """基准测试：消息延迟"""
        logger.info("开始消息延迟测试")

        target_latency = self.phase2_targets['response_time_ms']
        latencies = []

        if len(self.test_nodes) >= 2:
            sender = self.test_nodes[0]
            receiver = self.test_nodes[1]

            # 发送100条测试消息
            for i in range(100):
                start_time = time.time()

                success = await sender.communication_framework.send_message(
                    receiver.agent_id,
                    MessageType.HEARTBEAT,
                    {"test_id": i, "start_time": start_time},
                    Priority.HIGH
                )

                if success:
                    end_time = time.time()
                    latency_ms = (end_time - start_time) * 1000
                    latencies.append(latency_ms)

                await asyncio.sleep(0.1)  # 间隔发送

        if latencies:
            avg_latency = statistics.mean(latencies)
            p95_latency = np.percentile(latencies, 95)
            p99_latency = np.percentile(latencies, 99)

            result = BenchmarkResult(
                test_name="消息延迟测试",
                metric_name="平均延迟",
                value=avg_latency,
                unit="毫秒",
                target_value=target_latency,
                achieved_target=avg_latency <= target_latency,
                details={
                    "P95延迟": p95_latency,
                    "P99延迟": p99_latency,
                    "最小延迟": min(latencies),
                    "最大延迟": max(latencies),
                    "样本数量": len(latencies)
                }
            )

            self.results.append(result)
            logger.info(f"消息延迟: 平均 {avg_latency:.2f}ms (目标: {target_latency}ms)")

    async def _benchmark_network_scalability(self):
        """基准测试：网络可扩展性"""
        logger.info("开始网络可扩展性测试")

        scalability_results = {}

        # 测试不同节点数量的性能
        node_counts = [5, 10, 15] if len(self.test_nodes) >= 15 else [5, len(self.test_nodes)//2, len(self.test_nodes)]

        for node_count in node_counts:
            if node_count > len(self.test_nodes):
                continue

            active_nodes = self.test_nodes[:node_count]
            sender = active_nodes[0]
            receivers = active_nodes[1:]

            # 测试消息传输
            start_time = time.time()
            messages_sent = 0

            for _ in range(50):  # 每个配置发送50条消息
                for receiver in receivers:
                    success = await sender.communication_framework.send_message(
                        receiver.agent_id,
                        MessageType.HEARTBEAT,
                        {"test": "scalability"},
                        Priority.NORMAL
                    )
                    if success:
                        messages_sent += 1

            duration = time.time() - start_time
            throughput = messages_sent / duration if duration > 0 else 0

            scalability_results[node_count] = {
                "throughput": throughput,
                "messages_sent": messages_sent,
                "duration": duration
            }

        # 分析可扩展性
        if len(scalability_results) > 1:
            node_counts_sorted = sorted(scalability_results.keys())
            throughputs = [scalability_results[n]["throughput"] for n in node_counts_sorted]

            # 计算扩展效率 (吞吐量随节点数量的增长)
            if len(throughputs) > 1:
                scaling_efficiency = throughputs[-1] / throughputs[0]
                ideal_scaling = node_counts_sorted[-1] / node_counts_sorted[0]
                efficiency_ratio = scaling_efficiency / ideal_scaling

                result = BenchmarkResult(
                    test_name="网络可扩展性测试",
                    metric_name="扩展效率",
                    value=efficiency_ratio,
                    unit="比率",
                    target_value=0.8,  # 至少80%的理想扩展效率
                    achieved_target=efficiency_ratio >= 0.8,
                    details={
                        "节点数量": node_counts_sorted,
                        "吞吐量": throughputs,
                        "理想扩展效率": ideal_scaling,
                        "实际扩展效率": scaling_efficiency
                    }
                )

                self.results.append(result)
                logger.info(f"网络扩展效率: {efficiency_ratio:.2%} (目标: 80%)")

    async def _benchmark_skill_matching_speed(self):
        """基准测试：技能匹配速度"""
        logger.info("开始技能匹配速度测试")

        try:
            # 创建技能向量匹配器
            skill_matcher = AdvancedSkillVectorMatcher(dimension=128)

            # 模拟技能数据
            all_skills = [
                "data_analysis", "machine_learning", "deep_learning", "nlp",
                "computer_vision", "optimization", "simulation", "reasoning",
                "planning", "coordination", "monitoring", "prediction"
            ]

            # 生成测试数据
            test_tasks = []
            for _ in range(100):
                required_skills = random.sample(all_skills, random.randint(2, 5))
                task_context = {
                    "domain": random.choice(["finance", "healthcare", "technology", "education"]),
                    "complexity": random.uniform(0.3, 0.9),
                    "priority": random.choice(["low", "medium", "high"])
                }
                test_tasks.append((required_skills, task_context))

            # 注册智能体技能
            for i, node in enumerate(self.test_nodes[:10]):
                agent_skills = random.sample(all_skills, random.randint(3, 6))
                await skill_matcher.register_agent_skills(
                    f"agent_{i}",
                    agent_skills,
                    {
                        "experience_years": random.randint(1, 10),
                        "success_rate": random.uniform(0.7, 0.95),
                        "specialization": random.choice(all_skills)
                    }
                )

            # 性能测试
            start_time = time.time()

            for required_skills, context in test_tasks:
                matches = await skill_matcher.find_best_matches(
                    required_skills,
                    context=context,
                    top_k=3
                )
                # 不等待结果，只测试匹配速度

            end_time = time.time()
            total_time = end_time - start_time
            avg_time_per_match = total_time / len(test_tasks) * 1000  # 毫秒

            target_speed = 10  # 10ms内完成匹配

            result = BenchmarkResult(
                test_name="技能匹配速度测试",
                metric_name="平均匹配时间",
                value=avg_time_per_match,
                unit="毫秒",
                target_value=target_speed,
                achieved_target=avg_time_per_match <= target_speed,
                details={
                    "任务数量": len(test_tasks),
                    "总时间": total_time,
                    "智能体数量": min(10, len(self.test_nodes))
                }
            )

            self.results.append(result)
            logger.info(f"技能匹配速度: {avg_time_per_match:.2f}ms (目标: {target_speed}ms)")

        except Exception as e:
            logger.error(f"技能匹配速度测试失败: {e}")

    async def _benchmark_skill_matching_accuracy(self):
        """基准测试：技能匹配准确性"""
        logger.info("开始技能匹配准确性测试")

        try:
            # 创建技能向量匹配器
            skill_matcher = AdvancedSkillVectorMatcher(dimension=128)

            # 定义测试用例
            test_cases = [
                {
                    "required_skills": ["machine_learning", "data_analysis"],
                    "context": {"domain": "finance", "complexity": 0.8},
                    "expected_agents": ["agent_1", "agent_2"]  # 假设这些是ML专家
                },
                {
                    "required_skills": ["nlp", "reasoning"],
                    "context": {"domain": "healthcare", "complexity": 0.6},
                    "expected_agents": ["agent_3", "agent_4"]
                }
            ]

            # 注册已知能力的智能体
            agent_expertise = {
                "agent_1": ["machine_learning", "data_analysis", "optimization"],
                "agent_2": ["machine_learning", "deep_learning", "prediction"],
                "agent_3": ["nlp", "reasoning", "planning"],
                "agent_4": ["nlp", "computer_vision", "coordination"]
            }

            for agent_id, skills in agent_expertise.items():
                await skill_matcher.register_agent_skills(
                    agent_id,
                    skills,
                    {"domain": "expert", "experience_years": 5}
                )

            # 准确性测试
            correct_predictions = 0
            total_predictions = 0

            for case in test_cases:
                matches = await skill_matcher.find_best_matches(
                    case["required_skills"],
                    case["context"],
                    top_k=2
                )

                matched_agents = [match.agent_id for match in matches]
                expected_agents = case["expected_agents"]

                # 计算匹配准确性
                overlap = len(set(matched_agents) & set(expected_agents))
                accuracy = overlap / len(expected_agents)

                correct_predictions += overlap
                total_predictions += len(expected_agents)

            overall_accuracy = correct_predictions / total_predictions if total_predictions > 0 else 0
            target_accuracy = self.phase2_targets['skill_match_accuracy']

            result = BenchmarkResult(
                test_name="技能匹配准确性测试",
                metric_name="匹配准确率",
                value=overall_accuracy,
                unit="比率",
                target_value=target_accuracy,
                achieved_target=overall_accuracy >= target_accuracy,
                details={
                    "正确预测": correct_predictions,
                    "总预测数": total_predictions,
                    "测试用例数": len(test_cases)
                }
            )

            self.results.append(result)
            logger.info(f"技能匹配准确率: {overall_accuracy:.2%} (目标: {target_accuracy:.2%})")

        except Exception as e:
            logger.error(f"技能匹配准确性测试失败: {e}")

    async def _benchmark_security_overhead(self):
        """基准测试：安全开销"""
        logger.info("开始安全开销测试")

        try:
            # 创建零信任管理器
            zero_trust = ZeroTrustManager()

            # 测试授权操作的时间开销
            operation_times = []

            for i in range(50):
                # 创建安全上下文
                context = SecurityContext(
                    agent_id=f"agent_{i % 5}",
                    operation="execute_task",
                    resource_id=f"resource_{i}",
                    timestamp=time.time()
                )

                start_time = time.time()

                # 执行授权检查
                authorized = await zero_trust.authorize_operation(context)

                end_time = time.time()
                operation_time_ms = (end_time - start_time) * 1000
                operation_times.append(operation_time_ms)

            avg_security_overhead = statistics.mean(operation_times)
            target_overhead = self.phase2_targets['security_overhead_ms']

            result = BenchmarkResult(
                test_name="安全开销测试",
                metric_name="平均安全开销",
                value=avg_security_overhead,
                unit="毫秒",
                target_value=target_overhead,
                achieved_target=avg_security_overhead <= target_overhead,
                details={
                    "操作次数": len(operation_times),
                    "最小开销": min(operation_times),
                    "最大开销": max(operation_times),
                    "P95开销": np.percentile(operation_times, 95)
                }
            )

            self.results.append(result)
            logger.info(f"安全开销: {avg_security_overhead:.2f}ms (目标: {target_overhead}ms)")

        except Exception as e:
            logger.error(f"安全开销测试失败: {e}")

    async def _benchmark_authorization_performance(self):
        """基准测试：授权性能"""
        logger.info("开始授权性能测试")

        try:
            zero_trust = ZeroTrustManager()

            # 并发授权测试
            concurrent_operations = 100
            start_time = time.time()

            tasks = []
            for i in range(concurrent_operations):
                context = SecurityContext(
                    agent_id=f"agent_{i % 10}",
                    operation="read_data",
                    resource_id=f"data_{i}",
                    timestamp=time.time()
                )
                task = zero_trust.authorize_operation(context)
                tasks.append(task)

            results = await asyncio.gather(*tasks)
            end_time = time.time()

            total_time = end_time - start_time
            authorized_count = sum(results)
            authorization_rate = authorized_count / concurrent_operations
            throughput = concurrent_operations / total_time

            result = BenchmarkResult(
                test_name="授权性能测试",
                metric_name="授权吞吐量",
                value=throughput,
                unit="授权/秒",
                target_value=1000,  # 1000授权/秒
                achieved_target=throughput >= 1000,
                details={
                    "并发操作数": concurrent_operations,
                    "成功授权数": authorized_count,
                    "授权成功率": authorization_rate,
                    "总时间": total_time
                }
            )

            self.results.append(result)
            logger.info(f"授权吞吐量: {throughput:.2f} 授权/秒")

        except Exception as e:
            logger.error(f"授权性能测试失败: {e}")

    async def _benchmark_state_consistency(self):
        """基准测试：状态一致性"""
        logger.info("开始状态一致性测试")

        try:
            if len(self.test_nodes) < 3:
                logger.warning("节点数量不足，跳过状态一致性测试")
                return

            # 使用前3个节点进行一致性测试
            nodes = self.test_nodes[:3]

            # 在第一个节点设置状态
            leader = nodes[0]
            test_key = f"consistency_test_{int(time.time())}"
            test_value = {"timestamp": time.time(), "data": "test_value"}

            success = await leader.state_manager.set(test_key, test_value)
            if not success:
                logger.warning("状态设置失败，跳过一致性测试")
                return

            # 等待状态同步
            await asyncio.sleep(2)

            # 检查其他节点的状态
            consistent_reads = 0
            total_reads = 0

            for node in nodes[1:]:
                try:
                    read_value = await node.state_manager.get(test_key)
                    total_reads += 1

                    if read_value == test_value:
                        consistent_reads += 1
                except Exception as e:
                    logger.warning(f"节点 {node.agent_id} 状态读取失败: {e}")

            consistency_rate = consistent_reads / total_reads if total_reads > 0 else 0

            result = BenchmarkResult(
                test_name="状态一致性测试",
                metric_name="一致性率",
                value=consistency_rate,
                unit="比率",
                target_value=0.95,  # 95%一致性
                achieved_target=consistency_rate >= 0.95,
                details={
                    "总读取次数": total_reads,
                    "一致性读取": consistent_reads,
                    "测试键": test_key
                }
            )

            self.results.append(result)
            logger.info(f"状态一致性: {consistency_rate:.2%} (目标: 95%)")

        except Exception as e:
            logger.error(f"状态一致性测试失败: {e}")

    async def _benchmark_state_performance(self):
        """基准测试：状态管理性能"""
        logger.info("开始状态管理性能测试")

        try:
            if not self.test_nodes:
                logger.warning("没有可用节点，跳过状态管理性能测试")
                return

            state_manager = self.test_nodes[0].state_manager

            # 性能测试
            operation_count = 1000
            start_time = time.time()

            # 执行各种状态操作
            for i in range(operation_count):
                await state_manager.set(f"perf_test_{i}", f"value_{i}")
                await state_manager.get(f"perf_test_{i}")
                if i % 10 == 0:
                    await state_manager.increment("counter", 1)

            end_time = time.time()
            total_time = end_time - start_time
            ops_per_second = (operation_count * 2.5) / total_time  # set + get + 10% increment

            result = BenchmarkResult(
                test_name="状态管理性能测试",
                metric_name="操作吞吐量",
                value=ops_per_second,
                unit="操作/秒",
                target_value=5000,  # 5000操作/秒
                achieved_target=ops_per_second >= 5000,
                details={
                    "操作总数": int(operation_count * 2.5),
                    "总时间": total_time,
                    "平均操作时间": total_time / (operation_count * 2.5) * 1000
                }
            )

            self.results.append(result)
            logger.info(f"状态管理吞吐量: {ops_per_second:.2f} 操作/秒")

        except Exception as e:
            logger.error(f"状态管理性能测试失败: {e}")

    async def _benchmark_memory_usage(self):
        """基准测试：内存使用"""
        logger.info("开始内存使用测试")

        try:
            process = psutil.Process()
            initial_memory = process.memory_info().rss / 1024 / 1024  # MB

            # 执行密集操作
            for node in self.test_nodes:
                if not node.running:
                    continue

                # 发送大量消息
                for i in range(100):
                    await node.communication_framework.send_message(
                        "test_target",
                        MessageType.HEARTBEAT,
                        {"test_data": "x" * 1000},  # 1KB数据
                        Priority.NORMAL
                    )

                # 执行状态操作
                for i in range(50):
                    await node.state_manager.set(f"memory_test_{i}", "x" * 500)

            await asyncio.sleep(2)  # 等待操作完成

            final_memory = process.memory_info().rss / 1024 / 1024  # MB
            memory_increase = final_memory - initial_memory
            memory_per_agent = memory_increase / len(self.test_nodes) if self.test_nodes else 0

            target_memory = self.phase2_targets['memory_usage_mb']

            result = BenchmarkResult(
                test_name="内存使用测试",
                metric_name="内存增长",
                value=memory_increase,
                unit="MB",
                target_value=target_memory,
                achieved_target=memory_increase <= target_memory,
                details={
                    "初始内存": initial_memory,
                    "最终内存": final_memory,
                    "每智能体内存": memory_per_agent,
                    "智能体数量": len(self.test_nodes)
                }
            )

            self.results.append(result)
            logger.info(f"内存使用增长: {memory_increase:.2f}MB (目标: {target_memory}MB)")

        except Exception as e:
            logger.error(f"内存使用测试失败: {e}")

    async def _benchmark_cpu_usage(self):
        """基准测试：CPU使用"""
        logger.info("开始CPU使用测试")

        try:
            process = psutil.Process()

            # 测量负载下的CPU使用率
            cpu_samples = []

            # 执行CPU密集操作
            start_time = time.time()
            test_duration = 30  # 30秒测试

            while time.time() - start_time < test_duration:
                # 执行计算密集任务
                for _ in range(100):
                    sum(i * i for i in range(1000))

                # 记录CPU使用率
                cpu_percent = process.cpu_percent()
                cpu_samples.append(cpu_percent)

                await asyncio.sleep(0.1)

            if cpu_samples:
                avg_cpu_usage = statistics.mean(cpu_samples)
                max_cpu_usage = max(cpu_samples)
                target_cpu = self.phase2_targets['cpu_usage_percent']

                result = BenchmarkResult(
                    test_name="CPU使用测试",
                    metric_name="平均CPU使用率",
                    value=avg_cpu_usage,
                    unit="百分比",
                    target_value=target_cpu,
                    achieved_target=avg_cpu_usage <= target_cpu,
                    details={
                        "最大CPU使用率": max_cpu_usage,
                        "CPU样本数": len(cpu_samples),
                        "测试时长": test_duration
                    }
                )

                self.results.append(result)
                logger.info(f"CPU使用率: {avg_cpu_usage:.2f}% (目标: {target_cpu}%)")

        except Exception as e:
            logger.error(f"CPU使用测试失败: {e}")

    async def _benchmark_system_availability(self):
        """基准测试：系统可用性"""
        logger.info("开始系统可用性测试")

        try:
            if not self.test_nodes:
                logger.warning("没有可用节点，跳过可用性测试")
                return

            # 长时间运行测试
            test_duration = 60  # 1分钟
            availability_checks = []
            failed_checks = 0

            start_time = time.time()
            end_time = start_time + test_duration

            while time.time() < end_time:
                check_start = time.time()
                available_nodes = 0

                # 检查每个节点的可用性
                for node in self.test_nodes:
                    try:
                        status = await node.get_status()
                        if status.get('running', False):
                            available_nodes += 1
                    except Exception:
                        pass

                check_end = time.time()
                availability_rate = available_nodes / len(self.test_nodes)
                availability_checks.append(availability_rate)

                if availability_rate < 0.95:  # 低于95%可用性视为失败
                    failed_checks += 1

                await asyncio.sleep(2)  # 每2秒检查一次

            if availability_checks:
                overall_availability = statistics.mean(availability_checks)
                target_availability = self.phase2_targets['availability_percent']

                result = BenchmarkResult(
                    test_name="系统可用性测试",
                    metric_name="可用性",
                    value=overall_availability * 100,
                    unit="百分比",
                    target_value=target_availability,
                    achieved_target=overall_availability * 100 >= target_availability,
                    details={
                        "检查次数": len(availability_checks),
                        "失败次数": failed_checks,
                        "最小可用性": min(availability_checks) * 100,
                        "最大可用性": max(availability_checks) * 100,
                        "测试时长": test_duration
                    }
                )

                self.results.append(result)
                logger.info(f"系统可用性: {overall_availability:.2%} (目标: {target_availability}%)")

        except Exception as e:
            logger.error(f"系统可用性测试失败: {e}")

    async def _benchmark_fault_tolerance(self):
        """基准测试：容错能力"""
        logger.info("开始容错能力测试")

        try:
            if len(self.test_nodes) < 3:
                logger.warning("节点数量不足，跳过容错测试")
                return

            # 模拟节点故障
            original_node_count = len([n for n in self.test_nodes if n.running])
            failed_node = self.test_nodes[0]

            # 关闭一个节点
            await failed_node.shutdown()
            await asyncio.sleep(5)  # 等待故障检测

            # 检查剩余节点的状态
            remaining_nodes = [n for n in self.test_nodes[1:] if n.running]
            available_nodes = 0

            for node in remaining_nodes:
                try:
                    status = await node.get_status()
                    if status.get('running', False):
                        available_nodes += 1
                except Exception:
                    pass

            # 恢复节点
            await failed_node.initialize()

            # 计算容错率
            recovery_rate = available_nodes / len(remaining_nodes) if remaining_nodes else 0

            result = BenchmarkResult(
                test_name="容错能力测试",
                metric_name="容错恢复率",
                value=recovery_rate,
                unit="比率",
                target_value=0.9,  # 90%恢复率
                achieved_target=recovery_rate >= 0.9,
                details={
                    "原始节点数": original_node_count,
                    "故障节点数": 1,
                    "剩余节点数": len(remaining_nodes),
                    "可用节点数": available_nodes
                }
            )

            self.results.append(result)
            logger.info(f"容错恢复率: {recovery_rate:.2%} (目标: 90%)")

        except Exception as e:
            logger.error(f"容错测试失败: {e}")

    async def _generate_performance_report(self) -> Dict[str, Any]:
        """生成性能报告"""
        logger.info("生成性能报告")

        # 统计结果
        total_tests = len(self.results)
        passed_tests = len([r for r in self.results if r.achieved_target])
        failed_tests = total_tests - passed_tests

        # 按类别分组
        categories = {
            "通信性能": [],
            "技能匹配": [],
            "安全性能": [],
            "状态管理": [],
            "资源使用": [],
            "系统可靠性": []
        }

        for result in self.results:
            if "通信" in result.test_name or "网络" in result.test_name:
                categories["通信性能"].append(result)
            elif "技能" in result.test_name:
                categories["技能匹配"].append(result)
            elif "安全" in result.test_name or "授权" in result.test_name:
                categories["安全性能"].append(result)
            elif "状态" in result.test_name:
                categories["状态管理"].append(result)
            elif "内存" in result.test_name or "CPU" in result.test_name:
                categories["资源使用"].append(result)
            elif "可用性" in result.test_name or "容错" in result.test_name:
                categories["系统可靠性"].append(result)

        # 生成报告
        report = {
            "测试时间": time.strftime("%Y-%m-%d %H:%M:%S"),
            "Phase 2 目标": self.phase2_targets,
            "测试概要": {
                "总测试数": total_tests,
                "通过测试数": passed_tests,
                "失败测试数": failed_tests,
                "通过率": f"{(passed_tests/total_tests*100):.1f}%" if total_tests > 0 else "0%"
            },
            "详细结果": {},
            "性能评估": {},
            "改进建议": []
        }

        # 添加详细结果
        for category, results in categories.items():
            report["详细结果"][category] = []
            for result in results:
                report["详细结果"][category].append({
                    "测试名称": result.test_name,
                    "指标": result.metric_name,
                    "值": f"{result.value:.2f}",
                    "单位": result.unit,
                    "目标": f"{result.target_value}",
                    "是否达标": "✅" if result.achieved_target else "❌",
                    "详细信息": result.details or {}
                })

        # 性能评估
        critical_metrics = [
            "消息吞吐量", "平均延迟", "技能匹配准确率",
            "系统可用性", "容错恢复率"
        ]

        report["性能评估"] = {
            "关键指标达成情况": {},
            "整体评估": "优秀" if passed_tests/total_tests >= 0.9 else "良好" if passed_tests/total_tests >= 0.7 else "需改进"
        }

        # 生成改进建议
        failed_results = [r for r in self.results if not r.achieved_target]
        if failed_results:
            for result in failed_results:
                if "延迟" in result.test_name:
                    report["改进建议"].append("优化消息路由算法，减少网络跳数")
                elif "吞吐量" in result.test_name:
                    report["改进建议"].append("增加并发处理能力，优化消息队列")
                elif "内存" in result.test_name:
                    report["改进建议"].append("优化内存管理，实现更高效的缓存策略")
                elif "CPU" in result.test_name:
                    report["改进建议"].append("优化算法复杂度，减少计算开销")
                elif "安全" in result.test_name:
                    report["改进建议"].append("优化权限检查算法，使用缓存机制")
                elif "可用性" in result.test_name:
                    report["改进建议"].append("增强故障检测和自动恢复机制")

        # 保存报告到文件
        report_file = f"performance_report_{int(time.time())}.json"
        try:
            with open(report_file, 'w', encoding='utf-8') as f:
                # 转换结果为可序列化格式
                serializable_report = self._make_serializable(report)
                json.dump(serializable_report, f, ensure_ascii=False, indent=2)
            logger.info(f"性能报告已保存到: {report_file}")
        except Exception as e:
            logger.error(f"保存报告失败: {e}")

        return report

    def _make_serializable(self, obj):
        """转换对象为JSON可序列化格式"""
        if isinstance(obj, dict):
            return {k: self._make_serializable(v) for k, v in obj.items()}
        elif isinstance(obj, list):
            return [self._make_serializable(item) for item in obj]
        elif isinstance(obj, (str, int, float, bool)) or obj is None:
            return obj
        else:
            return str(obj)

async def run_phase2_performance_benchmarks():
    """运行Phase 2性能基准测试"""
    print("🚀 开始 EFIAgent Phase 2 性能基准测试")
    print("=" * 60)

    # 设置日志
    logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

    # 创建基准测试实例
    benchmark = PerformanceBenchmark(redis_url="redis://localhost:6379")

    try:
        # 运行所有测试
        report = await benchmark.run_all_benchmarks()

        # 显示摘要
        print("\n" + "=" * 60)
        print("📊 测试摘要")
        print("=" * 60)
        print(f"总测试数: {report['测试概要']['总测试数']}")
        print(f"通过测试数: {report['测试概要']['通过测试数']}")
        print(f"失败测试数: {report['测试概要']['失败测试数']}")
        print(f"整体通过率: {report['测试概要']['通过率']}")
        print(f"整体评估: {report['性能评估']['整体评估']}")

        # 显示关键指标
        print("\n🎯 关键指标达成情况")
        print("-" * 40)
        for category, results in report["详细结果"].items():
            print(f"\n{category}:")
            for result in results:
                status = "✅" if result["是否达标"] == "✅" else "❌"
                print(f"  {status} {result['指标']}: {result['值']} {result['单位']} (目标: {result['目标']})")

        # 显示改进建议
        if report["改进建议"]:
            print(f"\n💡 改进建议")
            print("-" * 40)
            for i, suggestion in enumerate(report["改进建议"], 1):
                print(f"{i}. {suggestion}")

        print(f"\n✅ Phase 2 性能基准测试完成!")

        return report

    except Exception as e:
        print(f"❌ 测试执行失败: {e}")
        logger.exception("Benchmark execution failed")
        raise

if __name__ == "__main__":
    # 运行基准测试
    asyncio.run(run_phase2_performance_benchmarks())