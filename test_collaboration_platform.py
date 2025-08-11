#!/usr/bin/env python3
"""协作平台功能测试脚本

该脚本用于测试协作平台的基本功能，包括：
- 平台初始化
- Agent注册
- 任务计划创建
- 协作会话创建
- 性能监控
"""

import asyncio
import sys
import os
from datetime import datetime, timedelta

# 添加项目根目录到Python路径
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    from efiagent.core.collaboration_platform import (
        CollaborationPlatform,
        TaskPriority,
        CollaborationMode,
        CapabilityType,
        AgentResource
    )
    from efiagent.core.communication import MessageBroker
    from efiagent.core.consensus import ConsensusVerifier
    from efiagent.agent.base_agent import AgentCapability, AgentConfig, AgentType
except ImportError as e:
    print(f"导入错误: {e}")
    print("请确保所有必要的模块都已正确实现")
    sys.exit(1)


def test_platform_initialization():
    """测试平台初始化"""
    print("\n=== 测试平台初始化 ===")
    
    try:
        # 创建依赖组件
        message_broker = MessageBroker()
        consensus_verifier = ConsensusVerifier()
        
        # 创建协作平台
        platform = CollaborationPlatform(
            message_broker=message_broker,
            consensus_verifier=consensus_verifier
        )
        
        print(f"✓ 平台初始化成功，ID: {platform.platform_id}")
        return platform
        
    except Exception as e:
        print(f"✗ 平台初始化失败: {e}")
        return None


def test_agent_registration(platform):
    """测试Agent注册"""
    print("\n=== 测试Agent注册 ===")
    
    try:
        # 创建测试Agent配置
        agent1_config = AgentConfig(
            id="agent_001",
            name="数据分析Agent",
            type=AgentType.EXECUTION,
            description="专门负责数据分析的Agent",
            capabilities=[
                AgentCapability(
                    name="data_analysis",
                    capability_type=CapabilityType.COGNITIVE,
                    description="数据分析能力",
                    parameters={"max_data_size": "1GB"}
                )
            ],
            parameters={"max_concurrent_tasks": 3}
        )
        
        agent2_config = AgentConfig(
            id="agent_002",
            name="工作流设计Agent",
            type=AgentType.EXECUTION,
            description="专门负责工作流自动化的Agent",
            capabilities=[
                AgentCapability(
                    name="workflow_automation",
                    capability_type=CapabilityType.EXECUTION,
                    description="工作流自动化能力",
                    parameters={"max_steps": 50}
                )
            ],
            parameters={"max_concurrent_tasks": 2}
        )
        
        # 注册Agent
        success1 = platform.capability_scheduler.register_agent(agent1_config, 3)
        success2 = platform.capability_scheduler.register_agent(agent2_config, 2)
        
        if success1 and success2:
            print(f"✓ Agent注册成功: {agent1_config.id}, {agent2_config.id}")
            return True
        else:
            print("✗ Agent注册失败")
            return False
            
    except Exception as e:
        print(f"✗ Agent注册异常: {e}")
        return False


async def test_task_plan_creation(platform):
    """测试任务计划创建"""
    print("\n=== 测试任务计划创建 ===")
    
    try:
        # 创建数据分析任务计划
        task_plan = await platform.create_task_plan(
            task_description="分析销售数据并生成报告",
            requirements={
                "task_type": "data_analysis",
                "data_source": "sales_database",
                "output_format": "pdf_report"
            },
            priority=TaskPriority.HIGH,
            deadline=datetime.now() + timedelta(hours=2)
        )
        
        if task_plan:
            print(f"✓ 任务计划创建成功: {task_plan.plan_id}")
            print(f"  - 任务数量: {len(task_plan.tasks)}")
            print(f"  - 计划状态: {task_plan.status}")
            return task_plan
        else:
            print("✗ 任务计划创建失败")
            return None
            
    except Exception as e:
        print(f"✗ 任务计划创建异常: {e}")
        return None


async def test_collaboration_session(platform):
    """测试协作会话创建"""
    print("\n=== 测试协作会话创建 ===")
    
    try:
        # 创建协作会话
        session_id = await platform.create_collaboration_session(
            session_name="数据分析协作",
            mode=CollaborationMode.COOPERATIVE,
            participants=["agent_001", "agent_002"],
            context={"project": "sales_analysis", "priority": "high"}
        )
        
        if session_id:
            print(f"✓ 协作会话创建成功: {session_id}")
            return session_id
        else:
            print("✗ 协作会话创建失败")
            return None
            
    except Exception as e:
        print(f"✗ 协作会话创建异常: {e}")
        return None


def test_platform_status(platform):
    """测试平台状态获取"""
    print("\n=== 测试平台状态获取 ===")
    
    try:
        # 启动平台
        platform.start()
        
        # 获取平台状态
        status = platform.get_platform_status()
        
        print(f"✓ 平台状态获取成功:")
        print(f"  - 运行状态: {status['is_running']}")
        print(f"  - 注册Agent数: {status['statistics']['registered_agents']}")
        print(f"  - 处理任务数: {status['statistics']['total_tasks_processed']}")
        print(f"  - 协作会话数: {status['statistics']['total_collaborations_created']}")
        
        return True
        
    except Exception as e:
        print(f"✗ 平台状态获取异常: {e}")
        return False


def test_health_check(platform):
    """测试健康检查"""
    print("\n=== 测试健康检查 ===")
    
    try:
        health_status = platform.health_check()
        
        print(f"✓ 健康检查完成:")
        print(f"  - 整体健康状态: {health_status['overall_health']}")
        print(f"  - 系统健康评分: {health_status['system_health_score']:.2f}")
        print(f"  - 不健康Agent数: {len(health_status['unhealthy_agents'])}")
        print(f"  - 性能瓶颈数: {len(health_status['performance_bottlenecks'])}")
        
        return True
        
    except Exception as e:
        print(f"✗ 健康检查异常: {e}")
        return False


async def main():
    """主测试函数"""
    print("开始协作平台功能测试...")
    
    # 测试平台初始化
    platform = test_platform_initialization()
    if not platform:
        print("\n❌ 平台初始化失败，终止测试")
        return
    
    # 测试Agent注册
    if not test_agent_registration(platform):
        print("\n❌ Agent注册失败，终止测试")
        return
    
    # 测试任务计划创建
    task_plan = await test_task_plan_creation(platform)
    if not task_plan:
        print("\n⚠️ 任务计划创建失败，继续其他测试")
    
    # 测试协作会话创建
    session_id = await test_collaboration_session(platform)
    if not session_id:
        print("\n⚠️ 协作会话创建失败，继续其他测试")
    
    # 测试平台状态
    if not test_platform_status(platform):
        print("\n⚠️ 平台状态获取失败，继续其他测试")
    
    # 测试健康检查
    if not test_health_check(platform):
        print("\n⚠️ 健康检查失败")
    
    # 停止平台
    try:
        platform.stop()
        print("\n✓ 平台已停止")
    except Exception as e:
        print(f"\n⚠️ 平台停止异常: {e}")
    
    print("\n🎉 协作平台功能测试完成！")


if __name__ == "__main__":
    asyncio.run(main())