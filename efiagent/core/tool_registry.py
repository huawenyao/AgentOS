"""
能力注册与工具封装 (Capability Registration and Tool Encapsulation)

该模块负责将从“超级上下文”中采集到的企业能力（尤其是 API）
转化为 Agent 可理解、可调用、并受安全策略约束的标准化工具 (Tools)。

核心功能:
1.  **工具规格定义 (ToolSpec)**: 提供一个标准化的数据结构来描述一个工具，
    包括其名称、功能描述、输入参数（带类型约束）、返回结果和所需权限。
2.  **工具注册表 (ToolRegistry)**: 维护一个所有可用工具的集合，支持工具的
    动态注册、查询和检索。
3.  **从 API 到工具的转换**: 提供将 OpenAPI 规范中的路径(path)转换为
    ToolSpec 的能力，实现 API 的自动化封装。
4.  **安全策略集成**: 在 ToolSpec 中嵌入安全相关字段，为后续的零信任
    执行代理提供决策依据。
"""

from typing import List, Dict, Any, Optional, Type
from pydantic import BaseModel, Field, create_model
from efiagent.core.context_collector import CollectedAsset

# ==============================================================================
# 工具规格 (ToolSpec) 定义
# ==============================================================================

class ToolParameter(BaseModel):
    """定义工具的一个输入参数"""
    name: str = Field(..., description="参数名称")
    description: str = Field(..., description="参数的详细描述")
    type: str = Field(..., description="参数的 JSON Schema 类型 (e.g., 'string', 'number', 'boolean')")
    required: bool = Field(..., description="该参数是否为必需")

class ToolSpec(BaseModel):
    """一个标准化的工具规格"""
    tool_id: str = Field(..., description="工具的唯一标识符 (e.g., 'api-OrderService-list_orders')")
    name: str = Field(..., description="工具的名称，供 Agent 调用时使用 (e.g., 'list_orders')")
    description: str = Field(..., description="对工具功能的详细、清晰的描述，供 Agent 理解其用途")
    parameters: List[ToolParameter] = Field(default_factory=list, description="工具的输入参数列表")
    
    # 安全与策略
    required_permissions: List[str] = Field(default_factory=list, description="执行此工具所需的安全权限列表")
    rate_limit: Optional[str] = Field(None, description="工具的调用频率限制 (e.g., '10/minute')")

    # 来源与元数据
    source_asset_id: Optional[str] = Field(None, description="该工具所来源的原始资产ID")

# ==============================================================================
# 工具注册表
# ==============================================================================

class ToolRegistry:
    """
    一个用于管理和查询所有可用工具的中央注册表。
    """
    def __init__(self):
        self._tools: Dict[str, ToolSpec] = {}

    def register_tool(self, tool_spec: ToolSpec):
        """向注册表中注册一个新工具。"""
        if tool_spec.tool_id in self._tools:
            print(f"Warning: Tool with id '{tool_spec.tool_id}' is being overwritten.")
        self._tools[tool_spec.tool_id] = tool_spec
        print(f"Successfully registered tool: {tool_spec.tool_id}")

    def get_tool(self, tool_id: str) -> Optional[ToolSpec]:
        """按 ID 查找工具。"""
        return self._tools.get(tool_id)

    def find_tools_by_name(self, name: str) -> List[ToolSpec]:
        """按名称查找工具 (可能存在重名)。"""
        return [tool for tool in self._tools.values() if tool.name == name]

    def get_all_tools(self) -> List[ToolSpec]:
        """返回所有已注册的工具。"""
        return list(self._tools.values())

    def __len__(self) -> int:
        return len(self._tools)

    def __repr__(self) -> str:
        return f"ToolRegistry(tool_count={len(self)})"
# ==============================================================================
# 从 API 资产到工具的转换器
# ==============================================================================

def convert_api_asset_to_tools(api_asset: CollectedAsset) -> List[ToolSpec]:
    """
    将一个从 OpenAPI 规范采集的资产转换为一个或多个 ToolSpec。
    这是一个简化的实现，仅用于演示目的。
    """
    if api_asset.asset_type != 'api_spec':
        return []

    tools = []
    api_spec = api_asset.content
    api_title = api_asset.metadata.get('title', 'UnknownAPI')

    for path, path_item in api_spec.get('paths', {}).items():
        for method, operation in path_item.items():
            if method.lower() not in ['get', 'post', 'put', 'delete']:
                continue

            clean_path = path.replace('/', '_').replace('{', '').replace('}', '')
            operation_id = operation.get('operationId', f'{method}{clean_path}')
            tool_id = f"api-{api_title.replace(' ', '')}-{operation_id}"
            
            parameters = []
            for param in operation.get('parameters', []):
                parameters.append(ToolParameter(
                    name=param['name'],
                    description=param.get('description', ''),
                    type=param.get('schema', {}).get('type', 'string'),
                    required=param.get('required', False)
                ))

            tool_spec = ToolSpec(
                tool_id=tool_id,
                name=operation.get('summary', tool_id),
                description=operation.get('description', operation.get('summary', '')),
                parameters=parameters,
                required_permissions=[f"api:{api_title}:read"], # 示例权限
                source_asset_id=api_asset.asset_id
            )
            tools.append(tool_spec)
    
    return tools

if __name__ == '__main__':
    # --- 演示如何使用 ---

    # 1. 创建一个假的 API 资产 (通常由 ContextPipeline 生成)
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
                        "parameters": [
                            {
                                "name": "limit",
                                "in": "query",
                                "description": "Maximum number of orders to return",
                                "schema": {"type": "integer"}
                            }
                        ]
                    }
                },
                "/orders/{orderId}": {
                    "get": {
                        "summary": "Get an order by ID",
                        "operationId": "getOrderById",
                        "parameters": [
                            {
                                "name": "orderId",
                                "in": "path",
                                "description": "ID of the order to retrieve",
                                "required": True,
                                "schema": {"type": "string"}
                            }
                        ]
                    }
                }
            }
        },
        metadata={'title': 'Order Service API'}
    )

    # 2. 将 API 资产转换为工具
    print("--- Converting API Asset to Tools ---")
    tool_specs = convert_api_asset_to_tools(fake_api_asset)
    for tool in tool_specs:
        print(f"  Converted Tool: {tool.name} (ID: {tool.tool_id})")

    # 3. 初始化注册表并注册工具
    print("\n--- Registering Tools ---")
    registry = ToolRegistry()
    for tool in tool_specs:
        registry.register_tool(tool)

    # 4. 查询和使用工具
    print("\n--- Verifying Tool Registry ---")
    print(registry)
    retrieved_tool = registry.get_tool('api-OrderServiceAPI-getOrderById')
    if retrieved_tool:
        print("\nFound Tool by ID:")
        print(f"  Name: {retrieved_tool.name}")
        print(f"  Description: {retrieved_tool.description}")
        print(f"  Permissions: {retrieved_tool.required_permissions}")
        print(f"  Parameters: {[p.name for p in retrieved_tool.parameters]}")