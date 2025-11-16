from typing import Dict, Any, List

from efiagent.core import ToolSpec
from efiagent.planner import Task

class SandboxExecutionError(Exception):
    """Custom exception for errors during sandboxed execution."""
    def __init__(self, message: str, original_exception: Exception = None):
        self.message = message
        self.original_exception = original_exception
        super().__init__(self.message)

class Sandbox:
    """
    A simple sandbox for executing tool code.

    This is a basic implementation and should be secured further for production use.
    """

    def __init__(self, allowed_modules: List[str] = None):
        """
        Initializes the sandbox.

        Args:
            allowed_modules: A list of modules that are allowed to be imported.
                             If None, a default safe list is used.
        """
        if allowed_modules is None:
            self.allowed_modules = ['math', 're', 'datetime', 'json']
        else:
            self.allowed_modules = allowed_modules

    def execute_task(self, task: Task, tool_code: str) -> Any:
        """
        Executes the code associated with a task in a restricted environment.

        Args:
            task: The task to execute.
            tool_code: The Python code of the tool to execute.

        Returns:
            The result of the tool's execution.

        Raises:
            SandboxExecutionError: If the execution fails.
        """
        local_scope: Dict[str, Any] = {}
        global_scope: Dict[str, Any] = {
            "__builtins__": self._get_safe_builtins()
        }

        try:
            exec(tool_code, global_scope, local_scope)

            tool_function = local_scope.get(task.tool_spec.name)
            if not callable(tool_function):
                raise SandboxExecutionError(f"Tool code did not define a callable function named '{task.tool_spec.name}'.")

            result = tool_function(**task.parameters)
            return result

        except Exception as e:
            raise SandboxExecutionError(f"An error occurred during task execution: {e}", original_exception=e)

    def _get_safe_builtins(self) -> Dict[str, Any]:
        """
        Provides a restricted set of built-in functions, including a safe __import__.
        """
        def safe_import(name, globals=None, locals=None, fromlist=(), level=0):
            if name in self.allowed_modules:
                return __import__(name, globals, locals, fromlist, level)
            raise ImportError(f"Import of module '{name}' is not allowed")

        safe_builtins = {
            'print': print,
            'len': len,
            'str': str,
            'int': int,
            'float': float,
            'list': list,
            'dict': dict,
            'tuple': tuple,
            'set': set,
            'range': range,
            'abs': abs,
            'round': round,
            'max': max,
            'min': min,
            'sum': sum,
            'sorted': sorted,
            'any': any,
            'all': all,
            'isinstance': isinstance,
            'issubclass': issubclass,
            'Exception': Exception,
            '__import__': safe_import,
        }
        return safe_builtins


if __name__ == '__main__':
    from efiagent.core import ToolParameter

    add_tool_spec = ToolSpec(
        tool_id="test-add",
        name="add",
        description="A simple tool to add two numbers.",
        parameters=[
            ToolParameter(name="a", type="int", description="First number", required=True),
            ToolParameter(name="b", type="int", description="Second number", required=True),
        ],
        required_permissions=[]
    )

    add_tool_code = """
def add(a, b):
    return a + b
"""

    add_task = Task(
        task_id="add-123",
        tool_spec=add_tool_spec,
        parameters={"a": 5, "b": 10}
    )

    sandbox = Sandbox()

    print("--- Test Case 1: Successful Execution ---")
    try:
        result = sandbox.execute_task(add_task, add_tool_code)
        print(f"Task: {add_task.task_id}")
        print(f"Result: {result}")
        assert result == 15
        print("Assertion passed.")
    except SandboxExecutionError as e:
        print(f"Execution failed: {e}")

    print("\n" + "="*40 + "\n")

    print("--- Test Case 2: Disallowed Import ---")
    disallowed_code = """
import os

def malicious_task():
    return os.getcwd()
"""
    malicious_tool_spec = ToolSpec(
        tool_id="test-malicious",
        name="malicious_task",
        description="A malicious tool.",
        parameters=[],
        required_permissions=[]
    )
    malicious_task = Task(
        task_id="malicious-456",
        tool_spec=malicious_tool_spec,
        parameters={}
    )

    try:
        sandbox.execute_task(malicious_task, disallowed_code)
    except SandboxExecutionError as e:
        print(f"Execution correctly failed: {e}")
        assert "is not defined" in str(e) or "not allowed" in str(e)
        print("Assertion passed.")

    print("\n" + "="*40 + "\n")

    print("--- Test Case 3: Runtime Error ---")
    error_code = """
def divide_by_zero(a):
    return a / 0
"""
    error_tool_spec = ToolSpec(
        tool_id="test-error",
        name="divide_by_zero",
        description="A tool that causes a runtime error.",
        parameters=[ToolParameter(name="a", type="int", description="A number", required=True)],
        required_permissions=[]
    )
    error_task = Task(
        task_id="error-789",
        tool_spec=error_tool_spec,
        parameters={"a": 10}
    )

    try:
        sandbox.execute_task(error_task, error_code)
    except SandboxExecutionError as e:
        print(f"Execution correctly failed: {e}")
        assert isinstance(e.original_exception, ZeroDivisionError)
        print("Assertion passed.")