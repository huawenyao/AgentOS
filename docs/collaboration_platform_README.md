# 协作平台模块 (Collaboration Platform)

## 概述

协作平台模块是EFIAgent 2.0的核心组件之一，实现了多Agent智能协作和能力编排的完整解决方案。该模块包含四个主要组件：任务规划器、能力调度器、协作协调器和性能优化器，支持复杂的多Agent协作场景。

## 核心组件

### 1. 任务规划器 (TaskPlanner)

**功能特性：**
- 智能任务分解：将复杂任务分解为可执行的子任务
- 依赖关系分析：识别任务间的依赖关系，避免循环依赖
- 执行计划生成：基于拓扑排序生成最优执行顺序
- 动态调整：支持任务状态更新和计划调整

**支持的任务类型：**
- 数据分析任务
- 工作流自动化任务
- 自定义任务类型（通过规则扩展）

### 2. 能力调度器 (CapabilityScheduler)

**功能特性：**
- Agent注册管理：支持Agent的注册、注销和状态管理
- 能力匹配：基于能力向量进行精确的Agent-任务匹配
- 负载均衡：智能分配任务，避免Agent过载
- 健康监控：实时监控Agent健康状态

**调度策略：**
- 基于能力的调度
- 负载感知调度
- 优先级调度
- 地理位置感知调度

### 3. 协作协调器 (CollaborationCoordinator)

**功能特性：**
- 多种协作模式：支持层次化、对等、竞争、合作等协作模式
- 冲突解决：提供多种冲突解决策略
- 共识机制：集成BFT共识算法确保一致性
- 上下文管理：维护协作会话的共享上下文

**协作模式：**
- **层次化模式**：主从、委托、监督
- **对等模式**：点对点、竞争、合作
- **网络化模式**：群体智能、动态组织、自组织

### 4. 性能优化器 (PerformanceOptimizer)

**功能特性：**
- 实时性能监控：收集和分析Agent性能指标
- 瓶颈识别：自动识别系统性能瓶颈
- 优化建议生成：基于性能分析生成优化建议
- 自适应优化：自动应用优化策略

**监控指标：**
- 执行指标：执行时间、成功率、错误率、吞吐量
- 资源指标：CPU使用率、内存使用率、网络IO
- 协作指标：通信延迟、协作效率、冲突数量
- 质量指标：输出质量、用户满意度

## 使用方法

### 基本使用流程

```python
from efiagent.core.communication import MessageBroker
from efiagent.core.consensus import ConsensusVerifier
from efiagent.core.collaboration_platform import CollaborationPlatform

# 1. 初始化协作平台
message_broker = MessageBroker()
consensus_verifier = ConsensusVerifier()
platform = CollaborationPlatform(message_broker, consensus_verifier)

# 2. 启动平台
await platform.start()

# 3. 注册Agent
agent_config = AgentConfig(...)
await platform.register_agent(agent_config)

# 4. 创建任务计划
task_plan = await platform.create_task_plan(
    task_description="数据分析任务",
    requirements={"data_type": "csv", "analysis_type": "statistical"},
    priority=TaskPriority.HIGH
)

# 5. 执行任务
await platform.execute_task_plan(task_plan)

# 6. 创建协作会话
session_id = await platform.create_collaboration_session(
    session_name="数据分析协作",
    mode=CollaborationMode.HIERARCHICAL,
    participants=["agent1", "agent2", "agent3"]
)

# 7. 性能优化
optimization_result = await platform.optimize_performance()
```

### Agent注册示例

```python
from efiagent.agent.base_agent import AgentConfig, AgentCapability, AgentType

# 创建Agent配置
agent_config = AgentConfig(
    id="agent-data-analyst-001",
    name="数据分析专家",
    type=AgentType.EXECUTION,
    description="专门负责数据分析的Agent",
    capabilities=[
        AgentCapability(
            name="data_analysis",
            description="数据分析和统计",
            parameters={"supported_formats": ["csv", "json"]},
            skill_vector=[0.9, 0.8, 0.7, 0.6]
        )
    ],
    parameters={"max_concurrent_tasks": 3}
)

# 注册Agent
success = await platform.register_agent(agent_config)
```

### 任务规划示例

```python
from efiagent.core.collaboration_platform import TaskPriority
from datetime import datetime, timedelta

# 创建复杂任务计划
task_plan = await platform.create_task_plan(
    task_description="客户满意度分析项目",
    requirements={
        "data_sources": ["survey_data.csv", "feedback_comments.txt"],
        "analysis_types": ["statistical", "sentiment", "trend"],
        "output_format": "comprehensive_report"
    },
    priority=TaskPriority.HIGH,
    deadline=datetime.now() + timedelta(hours=24)
)

# 执行任务计划
if task_plan:
    success = await platform.execute_task_plan(task_plan)
```

### 协作会话示例

```python
from efiagent.core.collaboration_platform import CollaborationMode

# 创建层次化协作会话
session_id = await platform.create_collaboration_session(
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
```

### 性能监控示例

```python
from efiagent.core.collaboration_platform import PerformanceMetrics

# 记录性能指标
metrics = PerformanceMetrics(
    agent_id="agent-data-analyst-001",
    task_id="task-001",
    execution_time=45.2,
    success_rate=0.95,
    cpu_usage=0.65,
    memory_usage=0.72,
    output_quality=0.92
)
platform.performance_optimizer.record_metrics(metrics)

# 分析性能趋势
trends = platform.performance_optimizer.analyze_performance_trends()

# 识别瓶颈
bottlenecks = platform.performance_optimizer.identify_bottlenecks()

# 执行优化
optimization_result = await platform.optimize_performance()
```

## 配置选项

### 任务规划器配置

```python
# 自定义分解规则
task_planner.register_decomposition_rule(
    task_type="custom_analysis",
    rule=custom_decomposition_function
)
```

### 能力调度器配置

```python
# 设置调度策略
capability_scheduler.set_scheduling_strategy("load_balanced")

# 配置负载阈值
capability_scheduler.set_load_threshold(0.8)
```

### 协作协调器配置

```python
# 注册自定义冲突解决策略
collaboration_coordinator.register_conflict_resolution_strategy(
    "custom_strategy",
    custom_resolution_function
)
```

### 性能优化器配置

```python
# 设置性能阈值
performance_optimizer.performance_thresholds.update({
    "max_execution_time": 600.0,
    "min_success_rate": 0.9,
    "max_cpu_usage": 0.7
})

# 注册自定义优化策略
performance_optimizer.optimization_strategies["custom_optimization"] = custom_strategy
```

## 监控和管理

### 平台状态监控

```python
# 获取平台状态
status = platform.get_platform_status()
print(f"注册Agent数量: {status['statistics']['registered_agents']}")
print(f"活跃任务数: {status['statistics']['active_tasks']}")
print(f"活跃会话数: {status['statistics']['active_sessions']}")

# 获取Agent状态
agent_status = platform.get_agent_status("agent-id")
print(f"Agent状态: {agent_status['status']}")
print(f"Agent负载: {agent_status['load']}")
```

### 健康检查

```python
# 执行健康检查
health_result = await platform.health_check()
print(f"平台健康状态: {health_result['platform_healthy']}")
print(f"系统健康评级: {health_result['system_health']}")

if health_result['issues']:
    print("发现的问题:")
    for issue in health_result['issues']:
        print(f"  - {issue}")
```

## 最佳实践

### 1. Agent设计

- **能力定义明确**：为Agent定义清晰、具体的能力描述
- **技能向量优化**：合理设置技能向量以提高匹配精度
- **负载管理**：设置合适的并发任务数量限制

### 2. 任务规划

- **任务粒度适中**：避免任务过于细碎或过于复杂
- **依赖关系清晰**：明确定义任务间的依赖关系
- **优先级合理**：根据业务需求设置合适的任务优先级

### 3. 协作模式选择

- **层次化模式**：适用于有明确领导关系的场景
- **对等模式**：适用于Agent能力相当的协作场景
- **竞争模式**：适用于需要多方案比较的场景

### 4. 性能优化

- **定期监控**：建立定期的性能监控机制
- **阈值调优**：根据实际业务需求调整性能阈值
- **渐进优化**：采用渐进式的优化策略，避免系统震荡

## 扩展开发

### 自定义任务分解规则

```python
def custom_decomposition_rule(task_description: str, requirements: Dict[str, Any]) -> List[TaskNode]:
    """自定义任务分解规则"""
    # 实现自定义分解逻辑
    tasks = []
    # ... 分解逻辑
    return tasks

# 注册规则
task_planner.register_decomposition_rule("custom_task_type", custom_decomposition_rule)
```

### 自定义调度策略

```python
def custom_scheduling_strategy(agents: List[AgentResource], 
                              required_capabilities: List[CapabilityType]) -> List[AgentResource]:
    """自定义调度策略"""
    # 实现自定义调度逻辑
    suitable_agents = []
    # ... 调度逻辑
    return suitable_agents

# 注册策略
capability_scheduler.register_scheduling_strategy("custom_strategy", custom_scheduling_strategy)
```

### 自定义优化策略

```python
def custom_optimization_strategy(context: Dict[str, Any]) -> Dict[str, Any]:
    """自定义优化策略"""
    return {
        "action": "custom_optimization",
        "parameters": context,
        "reason": "Custom optimization applied"
    }

# 注册策略
performance_optimizer.optimization_strategies["custom_optimization"] = custom_optimization_strategy
```

## 故障排除

### 常见问题

1. **Agent注册失败**
   - 检查Agent配置是否完整
   - 确认Agent ID是否唯一
   - 验证能力定义是否正确

2. **任务分配失败**
   - 检查是否有合适的Agent可用
   - 确认Agent负载是否过高
   - 验证任务需求与Agent能力是否匹配

3. **协作会话创建失败**
   - 检查参与者Agent是否已注册
   - 确认协作模式是否支持
   - 验证会话上下文是否正确

4. **性能优化无效**
   - 检查性能阈值设置是否合理
   - 确认优化策略是否适用
   - 验证性能数据是否充足

### 日志分析

协作平台使用loguru进行日志记录，可以通过以下方式查看详细日志：

```python
from loguru import logger

# 设置日志级别
logger.add("collaboration_platform.log", level="DEBUG")

# 查看特定组件日志
logger.info("协作平台状态检查")
```

## 版本历史

- **v2.0.0**: 初始版本，包含四大核心组件
- **v2.0.1**: 优化性能监控和瓶颈识别算法
- **v2.0.2**: 增加更多协作模式和冲突解决策略

## 许可证

本模块遵循EFIAgent项目的许可证协议。

## 贡献指南

欢迎贡献代码和提出改进建议。请遵循项目的代码规范和提交流程。

## 联系方式

如有问题或建议，请通过项目的Issue系统提交。