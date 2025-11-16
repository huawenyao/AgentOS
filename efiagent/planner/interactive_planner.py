"""
交互式规划器 (Interactive Planner)

该模块在简单关键字规划器的基础上进行了扩展，引入了处理工具参数的核心能力。
当一个工具被选中，但其必需的参数在用户意图中缺失时，该规划器能够
生成一个特殊的“澄清任务”，用于向用户请求缺失的信息。

核心功能:
1.  **参数提取**: 尝试从用户意图中提取工具所需的参数值。
2.  **缺失参数识别**: 识别出哪些是必需但未被提供的参数。
3.  **澄清任务生成**: 当参数缺失时，创建一个特殊的任务，其目标是
    向用户提问以获取信息。
"""

import re
from typing import List, Dict, Any, Optional

from efiagent.core.tool_registry import ToolRegistry, ToolSpec
from efiagent.planner.task_planner import BasePlanner, Plan, Task

# ==============================================================================
# 扩展的任务类型
# ==============================================================================

class ClarificationTask(Task):
    """一种特殊的任务，代表需要向用户提问以获取信息。"""
    def __init__(self, task_id: str, question: str):
        # ClarificationTask 不需要一个真正的 ToolSpec
        # 我们用一个假的来满足基类要求
        fake_tool_spec = ToolSpec(
            tool_id="system.ask_user",
            name="ask_user",
            description="Asks the user a clarifying question.",
            parameters=[]
        )
        super().__init__(task_id, fake_tool_spec, {})
        self.question = question

    def __repr__(self) -> str:
        return f"ClarificationTask(id={self.task_id}, question='{self.question}')"

# ==============================================================================
# 交互式规划器 (Interactive Planner)
# ==============================================================================

class InteractivePlanner(BasePlanner):
    """
    一个能够识别缺失参数并生成提问任务的规划器。
    """
    def create_plan(self, intent: str, tool_registry: ToolRegistry) -> Plan:
        plan = Plan(intent=intent)
        intent_lower = intent.lower()
        all_tools = tool_registry.get_all_tools()
        task_counter = 1

        for tool in all_tools:
            # 使用更简单直接的触发方式：如果工具名在用户意图中，就选中它
            if tool.name.lower() in intent_lower:
                parameters = {}
                missing_params = []

                # 尝试为每个必需参数寻找值
                for param_spec in tool.parameters:
                    if param_spec.required:
                        # 这是一个改进的参数提取逻辑，它寻找 `key=value` 或 `key:value` 格式
                        # 真实场景需要更复杂的 NLP 技术
                        match = re.search(f"{param_spec.name.lower()}\s*[:=]\s*'?(\w+)'?", intent_lower)
                        if match:
                            parameters[param_spec.name] = match.group(1)
                        else:
                            missing_params.append(param_spec.name)
                
                # 如果有缺失的必需参数，则生成澄清任务
                if missing_params:
                    question = f"I need more information to use the tool '{tool.name}'. What is the value for: {', '.join(missing_params)}?"
                    clarification_task = ClarificationTask(
                        task_id=f"task_{task_counter}",
                        question=question
                    )
                    plan.add_task(clarification_task)
                else:
                    # 否则，创建正常的工具调用任务
                    task = Task(
                        task_id=f"task_{task_counter}",
                        tool_spec=tool,
                        parameters=parameters
                    )
                    plan.add_task(task)
                
                task_counter += 1
        
        return plan

if __name__ == '__main__':
    from efiagent.core.tool_registry import convert_api_asset_to_tools, ToolParameter
    from efiagent.core.context_collector import CollectedAsset

    # 1. 准备一个带参数的工具
    registry = ToolRegistry()
    tool_spec = ToolSpec(
        tool_id="api-UserService-getUserByName",
        name="get user by name",
        description="Retrieves a user's profile using their name.",
        parameters=[
            ToolParameter(name="name", description="The name of the user", type="string", required=True)
        ]
    )
    registry.register_tool(tool_spec)

    # 2. 场景一：意图中提供了参数 (使用 key=value 格式)
    intent_with_param = "I want to get user by name, with name='admin'"
    print(f"--- Scenario 1: Intent with parameter ---")
    print(f"Intent: '{intent_with_param}'")
    planner = InteractivePlanner()
    plan_1 = planner.create_plan(intent_with_param, registry)
    print(f"Generated Plan: {plan_1.get_execution_order()}")

    # 3. 场景二：意图中缺失参数
    intent_without_param = "I want to get user by name"
    print(f"\n--- Scenario 2: Intent without parameter ---")
    print(f"Intent: '{intent_without_param}'")
    plan_2 = planner.create_plan(intent_without_param, registry)
    print(f"Generated Plan: {plan_2.get_execution_order()}")