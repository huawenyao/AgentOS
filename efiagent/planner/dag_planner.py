import networkx as nx
from typing import List, Dict, Any, Set

from efiagent.core import ToolRegistry, ToolSpec, ToolParameter
from efiagent.planner.task_planner import Task, Plan, BasePlanner

class DAGPlanner(BasePlanner):
    """
    A planner that represents the plan as a Directed Acyclic Graph (DAG),
    allowing for tasks with dependencies to be executed in the correct order.
    """

    def create_plan(self, intent: str, tool_registry: ToolRegistry) -> Plan:
        """
        Creates a task plan as a DAG based on the user's intent.

        This is a simplified implementation that relies on keyword matching and
        pre-defined dependency logic. A more advanced implementation would use
        an LLM to determine dependencies.

        Args:
            intent: The user's intent.
            tool_registry: The registry of available tools.

        Returns:
            A Plan object representing the DAG.
        """
        plan = Plan(intent=intent)
        tasks: Dict[str, Task] = {}

        # 1. Simple tool selection based on keywords
        matched_tools = self._find_matching_tools(intent, tool_registry)

        # 2. Create tasks for each matched tool and add to the plan
        for tool_spec in matched_tools:
            task_id = tool_spec.name # Use tool name as a simple task ID for now
            task = Task(
                task_id=task_id,
                tool_spec=tool_spec,
                parameters=self._extract_parameters(intent, tool_spec)
            )
            tasks[task_id] = task
            plan.add_task(task)

        # 3. Simplified dependency inference (example logic)
        if "get_order_details" in tasks and "list_orders" in tasks:
            print("INFO: Creating dependency: get_order_details -> list_orders")
            plan.add_dependency("list_orders", "get_order_details")

        if "calculate_order_amount" in tasks and "find_user_by_name" in tasks:
            print("INFO: Creating dependency: calculate_order_amount -> find_user_by_name")
            plan.add_dependency("find_user_by_name", "calculate_order_amount")

        return plan

    def _find_matching_tools(self, intent: str, tool_registry: ToolRegistry) -> List[ToolSpec]:
        """Finds tools that match keywords in the intent."""
        matched_tools = []
        all_tools = tool_registry.get_all_tools()
        for tool_spec in all_tools:
            if any(keyword in intent.lower() for keyword in self._get_tool_keywords(tool_spec)):
                matched_tools.append(tool_spec)
        return matched_tools

    def _get_tool_keywords(self, tool_spec: ToolSpec) -> Set[str]:
        """
        Generates keywords from tool name and description.
        """
        keywords = set(tool_spec.name.lower().split('_'))
        keywords.update(tool_spec.description.lower().split())
        if "order" in keywords:
            keywords.add("orders")
        return keywords

    def _extract_parameters(self, intent: str, tool_spec: ToolSpec) -> Dict[str, Any]:
        """
        A simple parameter extractor.
        """
        params = {}
        if tool_spec.name == "get_order_details":
            import re
            match = re.search(r"order_id=(\w+)", intent)
            if match:
                params["order_id"] = match.group(1)
        return params


if __name__ == '__main__':
    # 1. Setup a mock ToolRegistry
    tool_registry = ToolRegistry()

    tool_registry.register_tool(ToolSpec(
        tool_id="mock-list_orders",
        name="list_orders",
        description="List all recent orders for a user.",
        parameters=[],
        required_permissions=[]
    ))
    tool_registry.register_tool(ToolSpec(
        tool_id="mock-get_order_details",
        name="get_order_details",
        description="Get the details for a specific order ID.",
        parameters=[ToolParameter(name="order_id", description="The ID of the order", type="string", required=True)],
        required_permissions=[]
    ))
    tool_registry.register_tool(ToolSpec(
        tool_id="mock-find_user_by_name",
        name="find_user_by_name",
        description="Find a user's account details by their name.",
        parameters=[ToolParameter(name="user_name", description="The name of the user", type="string", required=True)],
        required_permissions=[]
    ))
    tool_registry.register_tool(ToolSpec(
        tool_id="mock-calculate_order_amount",
        name="calculate_order_amount",
        description="Calculate the total amount for a user's orders.",
        parameters=[ToolParameter(name="user_id", description="The ID of the user", type="string", required=True)],
        required_permissions=[]
    ))

    print("--- Tool Registry ---")
    all_tools = tool_registry.get_all_tools()
    for spec in all_tools:
        print(f"- {spec.name} (ID: {spec.tool_id}): {spec.description}")
    print("\n" + "="*40 + "\n")

    # 2. Initialize the DAGPlanner
    planner = DAGPlanner()

    # 3. Test Case 1: Intent with a clear dependency
    print("--- Test Case 1: Intent with dependency ---")
    intent_1 = "List all orders and then get details for order_id=123"
    print(f"Intent: {intent_1}")
    plan_1 = planner.create_plan(intent_1, tool_registry)

    print("\nExecution Order:")
    for task in plan_1.get_execution_order():
        print(f"-> {task}")

    print("\nIs plan valid (is a DAG)?", nx.is_directed_acyclic_graph(plan_1.dag))
    print("\n" + "="*40 + "\n")

    # 4. Test Case 2: Another dependency chain
    print("--- Test Case 2: Another dependency chain ---")
    intent_2 = "Find the user 'John Doe' and calculate their total order amount."
    print(f"Intent: {intent_2}")
    plan_2 = planner.create_plan(intent_2, tool_registry)

    print("\nExecution Order:")
    for task in plan_2.get_execution_order():
        print(f"-> {task}")
    print("\nIs plan valid (is a DAG)?", nx.is_directed_acyclic_graph(plan_2.dag))
    print("\n" + "="*40 + "\n")

    # 5. Test Case 3: No dependency
    print("--- Test Case 3: No dependency ---")
    intent_3 = "List all my recent orders."
    print(f"Intent: {intent_3}")
    plan_3 = planner.create_plan(intent_3, tool_registry)

    print("\nExecution Order:")
    for task in plan_3.get_execution_order():
        print(f"-> {task}")
    print("\nIs plan valid (is a DAG)?", nx.is_directed_acyclic_graph(plan_3.dag))