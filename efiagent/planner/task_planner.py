"""
任务规划器 (Task Planner)

该模块负责将高层次的用户意图 (Intent) 转换为一个由具体任务组成的、
可执行的计划 (Plan)。规划是 Agent 实现自主性的核心。

核心功能:
1.  **任务定义 (Task)**: 将对工具的一次调用封装为一个独立的任务单元，
    包含工具 ID 和具体的参数绑定。
2.  **计划定义 (Plan)**: 将一系列任务组织成一个有向无环图 (DAG)，
    定义任务间的依赖关系和执行顺序。
3.  **意图到计划的转换**: 实现一个或多个规划器算法，根据用户意图、
    可用的工具集以及“超级上下文”中的知识，生成最优的执行计划。
4.  **简单的关键字规划器 (SimpleKeywordPlanner)**: 作为初始实现，
    提供一个基于关键字匹配的简单规划器，用于快速验证流程。
"""

from typing import List, Dict, Any, Optional, Set
import networkx as nx # 使用 networkx 库来方便地处理有向无环图 (DAG)

from efiagent.core.tool_registry import ToolRegistry, ToolSpec

# ==============================================================================
# 任务 (Task) 与 计划 (Plan) 的数据结构
# ==============================================================================

class Task:
    """表示计划中的一个独立任务，通常是对一个工具的单次调用。"""
    def __init__(self, task_id: str, tool_spec: ToolSpec, parameters: Dict[str, Any]):
        self.task_id = task_id
        self.tool_spec = tool_spec
        self.parameters = parameters

    def __repr__(self) -> str:
        return f"Task(id={self.task_id}, tool='{self.tool_spec.name}', params={self.parameters})"

class Plan:
    """表示一个由多个任务组成的执行计划，内部使用 DAG 来管理任务依赖。"""
    def __init__(self, intent: str):
        self.intent = intent
        self.dag = nx.DiGraph() # 创建一个有向图

    def add_task(self, task: Task):
        """向计划中添加一个任务节点。"""
        self.dag.add_node(task.task_id, task_instance=task)

    def add_dependency(self, from_task_id: str, to_task_id: str):
        """添加任务间的依赖关系 (from_task 必须在 to_task 之前完成)。"""
        if from_task_id not in self.dag or to_task_id not in self.dag:
            raise ValueError("One or both tasks not in the plan.")
        self.dag.add_edge(from_task_id, to_task_id)

    def get_execution_order(self) -> List[Task]:
        """使用拓扑排序确定任务的线性执行顺序。"""
        if not nx.is_directed_acyclic_graph(self.dag):
            raise ValueError("Plan contains a cycle and cannot be executed.")
        
        # 拓扑排序返回的是 task_id 的列表
        sorted_task_ids = list(nx.topological_sort(self.dag))
        return [self.dag.nodes[task_id]['task_instance'] for task_id in sorted_task_ids]

    def __repr__(self) -> str:
        return f"Plan(intent='{self.intent}', tasks={len(self.dag.nodes)})"

# ==============================================================================
# 规划器 (Planner) 实现
# ==============================================================================

class BasePlanner:
    """所有规划器的基类。"""
    def create_plan(self, intent: str, tool_registry: ToolRegistry) -> Plan:
        raise NotImplementedError

class SimpleKeywordPlanner(BasePlanner):
    """
    一个非常简单的规划器，通过匹配意图中的关键字和工具描述来选择工具。
    这个实现不处理参数绑定和任务依赖，仅用于演示目的。
    """
    def create_plan(self, intent: str, tool_registry: ToolRegistry) -> Plan:
        plan = Plan(intent=intent)
        intent_keywords = set(intent.lower().split())
        
        all_tools = tool_registry.get_all_tools()
        task_counter = 1

        for tool in all_tools:
            # 将工具的名称和描述也转换为关键字集合
            tool_keywords = set(tool.name.lower().split()) | set(tool.description.lower().split())
            
            # 如果意图和工具有重合的关键字，就将其加入计划
            if intent_keywords.intersection(tool_keywords):
                # 注意：这里的参数是空的，一个真正的规划器需要解决参数填充问题
                task = Task(
                    task_id=f"task_{task_counter}",
                    tool_spec=tool,
                    parameters={}
                )
                plan.add_task(task)
                task_counter += 1
        
        return plan

if __name__ == '__main__':
    # --- 演示如何使用 ---
    from efiagent.core.tool_registry import convert_api_asset_to_tools
    from efiagent.core.context_collector import CollectedAsset

    # 1. 准备一个工具注册表 (复用 tool_registry.py 中的示例)
    registry = ToolRegistry()
    fake_api_asset = CollectedAsset(
        asset_id="api-spec:Order Service API",
        source="temp_assets/order_api.json",
        asset_type='api_spec',
        content={
            "openapi": "3.0.0",
            "info": {"title": "Order Service API", "version": "1.0.0"},
            "paths": {
                "/orders": {
                    "get": {
                        "summary": "List all orders",
                        "operationId": "listOrders",
                    }
                },
                "/orders/{orderId}": {
                    "get": {
                        "summary": "Get an order by ID",
                        "description": "Retrieve details for a specific order.",
                        "operationId": "getOrderById",
                    }
                }
            }
        },
        metadata={'title': 'Order Service API'}
    )
    tool_specs = convert_api_asset_to_tools(fake_api_asset)
    for tool in tool_specs:
        registry.register_tool(tool)

    # 2. 定义用户意图
    user_intent = "I want to get details for a specific order"

    # 3. 使用简单规划器创建计划
    print(f"--- Creating Plan for Intent: '{user_intent}' ---")
    planner = SimpleKeywordPlanner()
    created_plan = planner.create_plan(user_intent, registry)

    # 4. 验证计划和执行顺序
    print(f"\nGenerated Plan: {created_plan}")
    try:
        execution_order = created_plan.get_execution_order()
        print("\nExecution Order:")
        for i, task in enumerate(execution_order):
            print(f"  Step {i+1}: {task}")
    except ValueError as e:
        print(f"Error getting execution order: {e}")

    # 演示一个更复杂的意图
    user_intent_2 = "list all orders and also get one order"
    print(f"\n--- Creating Plan for Intent: '{user_intent_2}' ---")
    plan_2 = planner.create_plan(user_intent_2, registry)
    print(f"\nGenerated Plan: {plan_2}")
    execution_order_2 = plan_2.get_execution_order()
    print("\nExecution Order:")
    for i, task in enumerate(execution_order_2):
        print(f"  Step {i+1}: {task}")