#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
协作平台使用示例

本示例展示了如何使用EFIAgent 2.0的协作平台进行多Agent协作，
包括Agent注册、任务规划、协作会话创建和性能优化等功能。
"""

import asyncio
import json
from datetime import datetime, timedelta
from typing import Dict, List, Any

from efiagent.core.communication import MessageBroker
from efiagent.core.consensus import ConsensusVerifier
from efiagent.core.collaboration_platform import (
    CollaborationPlatform,
    TaskPriority,
    CollaborationMode,
    CapabilityType,
    PerformanceMetrics
)
from efiagent.agent.base_agent import AgentConfig, AgentCapability, AgentType


class CollaborationPlatformExample:
    """协作平台使用示例类"""
    
    def __init__(self):
        """初始化示例"""
        # 创建核心组件
        self.message_broker = MessageBroker()
        self.consensus_verifier = ConsensusVerifier()
        
        # 创建协作平台
        self.platform = CollaborationPlatform(
            message_broker=self.message_broker,
            consensus_verifier=self.consensus_verifier
        )
        
        print("协作平台示例初始化完成")
    
    def create_sample_agents(self) -> List[AgentConfig]:
        """创建示例Agent配置
        
        Returns:
            List[AgentConfig]: Agent配置列表
        """
        agents = []
        
        # 数据分析Agent
        data_analyst = AgentConfig(
            id="agent-data-analyst-001",
            name="数据分析专家",
            type=AgentType.EXECUTION,
            description="专门负责数据分析和统计计算的Agent",
            capabilities=[
                AgentCapability(
                    name="data_analysis",
                    description="数据分析和统计",
                    parameters={"supported_formats": ["csv", "json", "xlsx"]},
                    skill_vector=[0.9, 0.8, 0.7, 0.6]
                ),
                AgentCapability(
                    name="visualization",
                    description="数据可视化",
                    parameters={"chart_types": ["bar", "line", "pie", "scatter"]},
                    skill_vector=[0.8, 0.9, 0.6, 0.7]
                )
            ],
            parameters={
                "max_concurrent_tasks": 3,
                "preferred_data_size": "medium"
            }
        )
        agents.append(data_analyst)
        
        # 自然语言处理Agent
        nlp_agent = AgentConfig(
            id="agent-nlp-001",
            name="自然语言处理专家",
            type=AgentType.EXECUTION,
            description="专门负责文本处理和语言理解的Agent",
            capabilities=[
                AgentCapability(
                    name="text_processing",
                    description="文本处理和分析",
                    parameters={"languages": ["zh", "en"], "max_length": 10000},
                    skill_vector=[0.95, 0.9, 0.8, 0.85]
                ),
                AgentCapability(
                    name="sentiment_analysis",
                    description="情感分析",
                    parameters={"accuracy": 0.92},
                    skill_vector=[0.9, 0.85, 0.8, 0.9]
                )
            ],
            parameters={
                "max_concurrent_tasks": 5,
                "model_type": "transformer"
            }
        )
        agents.append(nlp_agent)
        
        # 决策支持Agent
        decision_agent = AgentConfig(
            id="agent-decision-001",
            name="决策支持专家",
            type=AgentType.PLANNING,
            description="专门负责决策分析和建议的Agent",
            capabilities=[
                AgentCapability(
                    name="decision_analysis",
                    description="决策分析和建议",
                    parameters={"methods": ["ahp", "topsis", "fuzzy"]},
                    skill_vector=[0.88, 0.92, 0.85, 0.9]
                ),
                AgentCapability(
                    name="risk_assessment",
                    description="风险评估",
                    parameters={"risk_models": ["monte_carlo", "var"]},
                    skill_vector=[0.85, 0.88, 0.9, 0.87]
                )
            ],
            parameters={
                "max_concurrent_tasks": 2,
                "decision_framework": "multi_criteria"
            }
        )
        agents.append(decision_agent)
        
        # 知识管理Agent
        knowledge_agent = AgentConfig(
            id="agent-knowledge-001",
            name="知识管理专家",
            type=AgentType.MEMORY,
            description="专门负责知识存储和检索的Agent",
            capabilities=[
                AgentCapability(
                    name="knowledge_storage",
                    description="知识存储和管理",
                    parameters={"storage_types": ["graph", "vector", "relational"]},
                    skill_vector=[0.9, 0.85, 0.88, 0.92]
                ),
                AgentCapability(
                    name="information_retrieval",
                    description="信息检索和推荐",
                    parameters={"search_algorithms": ["semantic", "keyword", "hybrid"]},
                    skill_vector=[0.87, 0.9, 0.85, 0.88]
                )
            ],
            parameters={
                "max_concurrent_tasks": 4,
                "knowledge_base_size": "large"
            }
        )
        agents.append(knowledge_agent)
        
        return agents
    
    async def register_agents_example(self) -> None:
        """Agent注册示例"""
        print("\n=== Agent注册示例 ===")
        
        # 创建示例Agent
        agents = self.create_sample_agents()
        
        # 注册所有Agent
        for agent in agents:
            success = await self.platform.register_agent(agent)
            if success:
                print(f"✓ Agent注册成功: {agent.name} ({agent.id})")
            else:
                print(f"✗ Agent注册失败: {agent.name} ({agent.id})")
        
        # 显示平台状态
        status = self.platform.get_platform_status()
        print(f"\n注册完成后平台状态:")
        print(f"- 注册Agent数量: {status['statistics']['registered_agents']}")
        print(f"- 平台运行状态: {status['is_running']}")
    
    async def task_planning_example(self) -> None:
        """任务规划示例"""
        print("\n=== 任务规划示例 ===")
        
        # 创建复杂任务计划
        task_plan = await self.platform.create_task_plan(
            task_description="客户满意度分析项目",
            requirements={
                "data_sources": ["survey_data.csv", "feedback_comments.txt"],
                "analysis_types": ["statistical", "sentiment", "trend"],
                "output_format": "comprehensive_report",
                "languages": ["zh", "en"]
            },
            priority=TaskPriority.HIGH,
            deadline=datetime.now() + timedelta(hours=24)
        )
        
        if task_plan:
            print(f"✓ 任务计划创建成功: {task_plan.plan_id}")
            print(f"- 任务描述: {task_plan.description}")
            print(f"- 子任务数量: {len(task_plan.tasks)}")
            print(f"- 优先级: {task_plan.priority}")
            print(f"- 预计完成时间: {task_plan.estimated_completion_time}")
            
            # 显示任务分解结果
            print("\n任务分解结果:")
            for i, task in enumerate(task_plan.tasks, 1):
                print(f"  {i}. {task.name}")
                print(f"     - 类型: {task.task_type}")
                print(f"     - 预计时长: {task.estimated_duration}分钟")
                print(f"     - 所需能力: {[cap.value for cap in task.required_capabilities]}")
                if task.dependencies:
                    print(f"     - 依赖任务: {task.dependencies}")
            
            # 执行任务计划
            print("\n开始执行任务计划...")
            execution_success = await self.platform.execute_task_plan(task_plan)
            
            if execution_success:
                print("✓ 任务计划执行启动成功")
                print("\n任务分配结果:")
                for task in task_plan.tasks:
                    if task.assigned_agent:
                        print(f"  - {task.name} -> {task.assigned_agent}")
            else:
                print("✗ 任务计划执行启动失败")
        else:
            print("✗ 任务计划创建失败")
    
    async def collaboration_session_example(self) -> None:
        """协作会话示例"""
        print("\n=== 协作会话示例 ===")
        
        # 创建不同类型的协作会话
        
        # 1. 层次化协作会话（数据分析项目）
        hierarchical_session = await self.platform.create_collaboration_session(
            session_name="数据分析协作项目",
            mode=CollaborationMode.HIERARCHICAL,
            participants=[
                "agent-decision-001",  # 主导Agent
                "agent-data-analyst-001",
                "agent-nlp-001"
            ],
            context={
                "project_type": "data_analysis",
                "leader": "agent-decision-001",
                "deadline": (datetime.now() + timedelta(days=3)).isoformat()
            }
        )
        
        if hierarchical_session:
            print(f"✓ 层次化协作会话创建成功: {hierarchical_session}")
        
        # 2. 对等协作会话（知识共享）
        peer_session = await self.platform.create_collaboration_session(
            session_name="知识共享协作",
            mode=CollaborationMode.PEER_TO_PEER,
            participants=[
                "agent-nlp-001",
                "agent-knowledge-001",
                "agent-data-analyst-001"
            ],
            context={
                "collaboration_type": "knowledge_sharing",
                "shared_resources": ["knowledge_base", "analysis_tools"]
            }
        )
        
        if peer_session:
            print(f"✓ 对等协作会话创建成功: {peer_session}")
        
        # 3. 竞争协作会话（方案比较）
        competitive_session = await self.platform.create_collaboration_session(
            session_name="方案竞争评估",
            mode=CollaborationMode.COMPETITIVE,
            participants=[
                "agent-decision-001",
                "agent-data-analyst-001"
            ],
            context={
                "competition_type": "solution_comparison",
                "evaluation_criteria": ["accuracy", "efficiency", "cost"]
            }
        )
        
        if competitive_session:
            print(f"✓ 竞争协作会话创建成功: {competitive_session}")
        
        # 显示协作统计
        status = self.platform.get_platform_status()
        print(f"\n协作会话统计:")
        print(f"- 活跃会话数量: {status['statistics']['active_sessions']}")
        print(f"- 总创建会话数: {status['statistics']['total_collaborations_created']}")
    
    async def performance_monitoring_example(self) -> None:
        """性能监控示例"""
        print("\n=== 性能监控示例 ===")
        
        # 模拟性能数据记录
        sample_metrics = [
            PerformanceMetrics(
                agent_id="agent-data-analyst-001",
                task_id="task-001",
                execution_time=45.2,
                success_rate=0.95,
                error_rate=0.05,
                cpu_usage=0.65,
                memory_usage=0.72,
                throughput=2.3,
                communication_latency=120.5,
                collaboration_efficiency=0.88,
                output_quality=0.92
            ),
            PerformanceMetrics(
                agent_id="agent-nlp-001",
                task_id="task-002",
                execution_time=32.8,
                success_rate=0.98,
                error_rate=0.02,
                cpu_usage=0.58,
                memory_usage=0.64,
                throughput=3.1,
                communication_latency=95.2,
                collaboration_efficiency=0.91,
                output_quality=0.94
            ),
            PerformanceMetrics(
                agent_id="agent-decision-001",
                task_id="task-003",
                execution_time=78.5,
                success_rate=0.89,
                error_rate=0.11,
                cpu_usage=0.82,
                memory_usage=0.79,
                throughput=1.2,
                communication_latency=156.8,
                collaboration_efficiency=0.76,
                output_quality=0.87
            )
        ]
        
        # 记录性能指标
        for metrics in sample_metrics:
            self.platform.performance_optimizer.record_metrics(metrics)
        
        print("✓ 性能指标记录完成")
        
        # 分析性能趋势
        trends = self.platform.performance_optimizer.analyze_performance_trends()
        print(f"\n性能趋势分析:")
        print(f"- 分析的Agent数量: {trends['overall_trends']['total_agents']}")
        print(f"- 系统平均成功率: {trends['overall_trends']['system_avg_success_rate']:.2%}")
        print(f"- 系统平均CPU使用率: {trends['overall_trends']['system_avg_cpu_usage']:.2%}")
        
        # 识别瓶颈
        bottlenecks = self.platform.performance_optimizer.identify_bottlenecks()
        if bottlenecks:
            print(f"\n发现性能瓶颈:")
            for bottleneck in bottlenecks:
                print(f"- Agent: {bottleneck['agent_id']}")
                for issue in bottleneck['bottlenecks']:
                    print(f"  * {issue['type']}: {issue['value']:.2f} (阈值: {issue['threshold']:.2f})")
        else:
            print("\n✓ 未发现明显性能瓶颈")
        
        # 执行性能优化
        optimization_result = await self.platform.optimize_performance()
        print(f"\n性能优化结果:")
        print(f"- 优化建议总数: {optimization_result['total_recommendations']}")
        print(f"- 成功应用: {optimization_result['applied_count']}")
        print(f"- 应用失败: {optimization_result['failed_count']}")
    
    async def platform_status_example(self) -> None:
        """平台状态示例"""
        print("\n=== 平台状态示例 ===")
        
        # 获取完整平台状态
        status = self.platform.get_platform_status()
        
        print(f"平台基本信息:")
        print(f"- 平台ID: {status['platform_id']}")
        print(f"- 运行状态: {status['is_running']}")
        print(f"- 启动时间: {status['start_time']}")
        print(f"- 运行时长: {status['uptime_seconds']:.1f}秒" if status['uptime_seconds'] else "- 运行时长: 未启动")
        
        print(f"\n统计信息:")
        stats = status['statistics']
        print(f"- 处理任务总数: {stats['total_tasks_processed']}")
        print(f"- 创建协作总数: {stats['total_collaborations_created']}")
        print(f"- 应用优化总数: {stats['total_optimizations_applied']}")
        print(f"- 注册Agent数: {stats['registered_agents']}")
        print(f"- 活跃任务数: {stats['active_tasks']}")
        print(f"- 活跃会话数: {stats['active_sessions']}")
        
        print(f"\n组件状态:")
        components = status['components']
        print(f"- 任务规划器: {components['task_planner']['total_plans']}个计划, {components['task_planner']['decomposition_rules']}条规则")
        print(f"- 能力调度器: {components['capability_scheduler']['registered_agents']}个Agent")
        print(f"- 协作协调器: {components['collaboration_coordinator']['active_sessions']}个活跃会话")
        print(f"- 性能优化器: 监控{components['performance_optimizer']['metrics_agents']}个Agent")
        
        # 获取单个Agent状态
        agent_status = self.platform.get_agent_status("agent-data-analyst-001")
        if agent_status:
            print(f"\nAgent状态示例 (数据分析专家):")
            print(f"- 状态: {agent_status['status']}")
            print(f"- 负载: {agent_status['load']:.2f}")
            print(f"- 当前任务: {len(agent_status['current_tasks'])}个")
            print(f"- 能力数量: {len(agent_status['capabilities'])}个")
    
    async def health_check_example(self) -> None:
        """健康检查示例"""
        print("\n=== 健康检查示例 ===")
        
        # 执行健康检查
        health_result = await self.platform.health_check()
        
        print(f"健康检查结果:")
        print(f"- 平台健康状态: {'✓ 健康' if health_result['platform_healthy'] else '✗ 异常'}")
        print(f"- 系统健康评级: {health_result.get('system_health', 'unknown')}")
        print(f"- 检查时间: {health_result['check_time']}")
        
        if health_result['issues']:
            print(f"\n发现的问题:")
            for issue in health_result['issues']:
                print(f"  - {issue}")
        else:
            print(f"\n✓ 未发现问题")
        
        print(f"\n详细统计:")
        print(f"- 性能瓶颈数量: {health_result.get('bottlenecks_count', 0)}")
        print(f"- 不健康Agent数量: {health_result.get('unhealthy_agents_count', 0)}")
    
    async def run_complete_example(self) -> None:
        """运行完整示例"""
        print("开始运行协作平台完整示例...")
        
        try:
            # 启动平台
            await self.platform.start()
            print("✓ 协作平台启动成功")
            
            # 运行各个示例
            await self.register_agents_example()
            await self.task_planning_example()
            await self.collaboration_session_example()
            await self.performance_monitoring_example()
            await self.platform_status_example()
            await self.health_check_example()
            
            print("\n=== 示例运行完成 ===")
            print("协作平台功能演示成功完成！")
            
        except Exception as e:
            print(f"\n示例运行出错: {e}")
        
        finally:
            # 停止平台
            await self.platform.stop()
            print("\n协作平台已停止")


async def main():
    """主函数"""
    example = CollaborationPlatformExample()
    await example.run_complete_example()


if __name__ == "__main__":
    # 运行示例
    asyncio.run(main())