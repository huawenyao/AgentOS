"""OpenAPI importer — parse Swagger/OpenAPI specs into Tool records."""

from __future__ import annotations

from typing import Any

from studio.models.base import new_id


def import_openapi_spec(spec: dict[str, Any], connection_id: str) -> list[dict]:
    """Parse an OpenAPI spec and return a list of Tool dicts ready for DB insertion.

    Args:
        spec: Parsed OpenAPI JSON/dict.
        connection_id: The connection these tools belong to.

    Returns:
        List of tool dictionaries matching the Tool model fields.
    """
    tools = []
    api_title = spec.get("info", {}).get("title", "API")
    servers = spec.get("servers", [])
    base_url = servers[0]["url"] if servers else ""

    for path, path_item in spec.get("paths", {}).items():
        for method, operation in path_item.items():
            if method.lower() not in ("get", "post", "put", "delete", "patch"):
                continue

            op_id = operation.get("operationId", f"{method}_{path}")
            summary = operation.get("summary", op_id)
            description = operation.get("description", summary)

            # Build parameters schema
            properties: dict[str, Any] = {}
            required: list[str] = []
            for param in operation.get("parameters", []):
                p_name = param["name"]
                p_type = param.get("schema", {}).get("type", "string")
                p_desc = param.get("description", "")
                properties[p_name] = {"type": p_type, "description": p_desc}
                if param.get("required"):
                    required.append(p_name)

            # Also handle requestBody (simplified)
            req_body = operation.get("requestBody", {})
            if req_body:
                content = req_body.get("content", {})
                json_schema = content.get("application/json", {}).get("schema", {})
                if json_schema.get("properties"):
                    properties.update(json_schema["properties"])
                    required.extend(json_schema.get("required", []))

            parameters_schema = {
                "type": "object",
                "properties": properties,
            }
            if required:
                parameters_schema["required"] = required

            url = f"{base_url}{path}"
            tools.append({
                "id": new_id(),
                "connection_id": connection_id,
                "name": summary or op_id,
                "description": description,
                "parameters_schema": parameters_schema,
                "required_permissions": [f"api:{api_title}:access"],
                "implementation": "http",
                "implementation_config": {
                    "method": method.upper(),
                    "url": url,
                    "headers": {},
                },
                "enabled": True,
            })

    return tools
