from typing import List, Dict, Set
from pydantic import BaseModel

from efiagent.core import ToolSpec
from efiagent.planner import Task

class SecurityPolicy(BaseModel):
    """Defines a security policy that grants certain permissions."""
    policy_id: str
    description: str
    granted_permissions: Set[str]

class SecurityManager:
    """
    Manages security policies and authorizes task execution.
    """

    def __init__(self, policies: List[SecurityPolicy] = None):
        self._policies: Dict[str, SecurityPolicy] = {p.policy_id: p for p in policies} if policies else {}
        self._active_permissions: Set[str] = set()
        self._rebuild_active_permissions()

    def add_policy(self, policy: SecurityPolicy):
        """Adds a new security policy."""
        self._policies[policy.policy_id] = policy
        self._rebuild_active_permissions()

    def _rebuild_active_permissions(self):
        """Recalculates the set of all currently granted permissions."""
        self._active_permissions.clear()
        for policy in self._policies.values():
            self._active_permissions.update(policy.granted_permissions)

    def is_authorized(self, task: Task) -> bool:
        """
        Checks if a task is authorized to run based on its required permissions.

        Args:
            task: The task to be checked.

        Returns:
            True if the task is authorized, False otherwise.
        """
        if not task.tool_spec.required_permissions:
            return True  # No permissions required

        required = set(task.tool_spec.required_permissions)
        return required.issubset(self._active_permissions)

if __name__ == '__main__':
    from pydantic import BaseModel
    from efiagent.core import ToolParameter

    # 1. Define some security policies
    api_read_policy = SecurityPolicy(
        policy_id="api-read-only",
        description="Allows reading from all APIs.",
        granted_permissions={"api:read:orders", "api:read:users"}
    )

    api_write_policy = SecurityPolicy(
        policy_id="api-write-access",
        description="Allows writing to specific APIs.",
        granted_permissions={"api:write:orders"}
    )

    # 2. Initialize the SecurityManager with a policy
    security_manager = SecurityManager(policies=[api_read_policy])
    print(f"Initial active permissions: {security_manager._active_permissions}")

    # 3. Define some mock tools and tasks
    list_orders_spec = ToolSpec(
        tool_id="api-list-orders",
        name="list_orders",
        description="Lists orders.",
        parameters=[],
        required_permissions=["api:read:orders"]
    )
    list_orders_task = Task(task_id="t1", tool_spec=list_orders_spec, parameters={})

    create_order_spec = ToolSpec(
        tool_id="api-create-order",
        name="create_order",
        description="Creates an order.",
        parameters=[],
        required_permissions=["api:write:orders", "api:read:users", "internal:billing:access"] # Added billing access
    )
    create_order_task = Task(task_id="t2", tool_spec=create_order_spec, parameters={})

    # 4. Test authorization
    print("\n--- Authorization Tests ---")
    
    # Test 1: Authorized task
    is_list_authorized = security_manager.is_authorized(list_orders_task)
    print(f"Is 'list_orders' authorized? {is_list_authorized}")
    assert is_list_authorized is True

    # Test 2: Unauthorized task (missing write permission)
    is_create_authorized = security_manager.is_authorized(create_order_task)
    print(f"Is 'create_order' authorized? {is_create_authorized}")
    assert is_create_authorized is False

    # 5. Add a new policy and re-test
    print("\n--- Adding new policy ---")
    security_manager.add_policy(api_write_policy)
    print(f"Updated active permissions: {security_manager._active_permissions}")

    # Test 3: Previously unauthorized task is now partially authorized (still missing one permission)
    is_create_authorized_again = security_manager.is_authorized(create_order_task)
    print(f"Is 'create_order' authorized now? {is_create_authorized_again}")
    assert is_create_authorized_again is False # Still needs internal:billing:access

    # Test 4: Grant all required permissions
    billing_policy = SecurityPolicy(policy_id="billing-access", description="", granted_permissions={"internal:billing:access"})
    security_manager.add_policy(billing_policy)
    print(f"Final active permissions: {security_manager._active_permissions}")
    is_create_authorized_final = security_manager.is_authorized(create_order_task)
    print(f"Is 'create_order' finally authorized? {is_create_authorized_final}")
    assert is_create_authorized_final is True

    print("\nAll tests passed!")