# EFIAgent 后端API设计文档

## 概述

本文档描述了EFIAgent可视化开发平台的后端API设计，包括所有RESTful接口的详细规范、请求/响应格式、错误处理和认证机制。

## API基础信息

- **Base URL**: `http://localhost:8080/api/v1`
- **Content-Type**: `application/json`
- **认证方式**: JWT Token
- **API版本**: v1

## 通用响应格式

### 成功响应
```json
{
  "success": true,
  "data": {},
  "message": "操作成功",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### 错误响应
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "错误描述",
    "details": {}
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### 分页响应
```json
{
  "success": true,
  "data": {
    "items": [],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 100,
      "totalPages": 5
    }
  },
  "message": "查询成功",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

## 错误代码

| 错误代码 | HTTP状态码 | 描述 |
|---------|-----------|------|
| AUTH_001 | 401 | 未授权访问 |
| AUTH_002 | 403 | 权限不足 |
| AUTH_003 | 401 | Token已过期 |
| VALID_001 | 400 | 请求参数验证失败 |
| VALID_002 | 400 | 请求体格式错误 |
| RESOURCE_001 | 404 | 资源不存在 |
| RESOURCE_002 | 409 | 资源已存在 |
| SERVER_001 | 500 | 内部服务器错误 |
| SERVER_002 | 503 | 服务不可用 |

## 1. 认证和用户管理

### 1.1 用户注册
```
POST /auth/register
```

**请求体**:
```json
{
  "username": "string",
  "email": "string",
  "password": "string"
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "username": "testuser",
      "email": "test@example.com",
      "role": "user",
      "createdAt": "2024-01-01T00:00:00Z"
    },
    "token": "jwt_token_string"
  }
}
```

### 1.2 用户登录
```
POST /auth/login
```

**请求体**:
```json
{
  "username": "string",
  "password": "string"
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "username": "testuser",
      "email": "test@example.com",
      "role": "user",
      "lastLoginAt": "2024-01-01T00:00:00Z"
    },
    "token": "jwt_token_string",
    "expiresIn": 86400
  }
}
```

### 1.3 获取当前用户信息
```
GET /auth/me
Authorization: Bearer {token}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "testuser",
    "email": "test@example.com",
    "role": "user",
    "avatarUrl": "string",
    "isActive": true,
    "lastLoginAt": "2024-01-01T00:00:00Z",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

### 1.4 更新用户信息
```
PUT /auth/profile
Authorization: Bearer {token}
```

**请求体**:
```json
{
  "email": "string",
  "avatarUrl": "string"
}
```

### 1.5 修改密码
```
PUT /auth/password
Authorization: Bearer {token}
```

**请求体**:
```json
{
  "currentPassword": "string",
  "newPassword": "string"
}
```

## 2. Agent模板管理

### 2.1 获取Agent模板列表
```
GET /agent-templates
```

**查询参数**:
- `page`: 页码 (默认: 1)
- `pageSize`: 每页数量 (默认: 20)
- `type`: Agent类型过滤
- `category`: 分类过滤
- `featured`: 是否推荐 (true/false)
- `search`: 搜索关键词
- `sortBy`: 排序字段 (name, createdAt, downloadCount, rating)
- `sortOrder`: 排序方向 (asc, desc)

**响应**:
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "name": "规划Agent模板",
        "description": "用于任务规划的Agent模板",
        "type": "planning",
        "category": "business",
        "iconUrl": "string",
        "difficulty": "beginner",
        "featured": true,
        "downloadCount": 100,
        "rating": 4.5,
        "author": {
          "id": 1,
          "username": "author"
        },
        "version": "1.0.0",
        "tags": ["planning", "business"],
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}
```

### 2.2 获取Agent模板详情
```
GET /agent-templates/{id}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "规划Agent模板",
    "description": "详细描述",
    "type": "planning",
    "category": "business",
    "iconUrl": "string",
    "difficulty": "beginner",
    "featured": true,
    "properties": {},
    "components": {},
    "capabilities": {},
    "tags": ["planning"],
    "author": {
      "id": 1,
      "username": "author",
      "email": "author@example.com"
    },
    "version": "1.0.0",
    "downloadCount": 100,
    "rating": 4.5,
    "isPublic": true,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

### 2.3 创建Agent模板
```
POST /agent-templates
Authorization: Bearer {token}
```

**请求体**:
```json
{
  "name": "string",
  "description": "string",
  "type": "planning|execution|audit|memory",
  "category": "string",
  "iconUrl": "string",
  "difficulty": "beginner|intermediate|advanced",
  "featured": false,
  "properties": {},
  "components": {},
  "capabilities": {},
  "tags": ["string"],
  "isPublic": true
}
```

### 2.4 更新Agent模板
```
PUT /agent-templates/{id}
Authorization: Bearer {token}
```

### 2.5 删除Agent模板
```
DELETE /agent-templates/{id}
Authorization: Bearer {token}
```

## 3. Agent配置管理

### 3.1 获取Agent配置列表
```
GET /agent-configs
Authorization: Bearer {token}
```

**查询参数**:
- `page`: 页码
- `pageSize`: 每页数量
- `type`: Agent类型过滤
- `status`: 状态过滤
- `search`: 搜索关键词

### 3.2 获取Agent配置详情
```
GET /agent-configs/{id}
Authorization: Bearer {token}
```

### 3.3 创建Agent配置
```
POST /agent-configs
Authorization: Bearer {token}
```

**请求体**:
```json
{
  "templateId": 1,
  "name": "string",
  "description": "string",
  "type": "planning|execution|audit|memory",
  "properties": {},
  "components": {},
  "capabilities": {}
}
```

### 3.4 更新Agent配置
```
PUT /agent-configs/{id}
Authorization: Bearer {token}
```

### 3.5 删除Agent配置
```
DELETE /agent-configs/{id}
Authorization: Bearer {token}
```

## 4. 工作流管理

### 4.1 获取工作流列表
```
GET /workflows
Authorization: Bearer {token}
```

**查询参数**:
- `page`: 页码
- `pageSize`: 每页数量
- `status`: 状态过滤
- `search`: 搜索关键词
- `sortBy`: 排序字段
- `sortOrder`: 排序方向

**响应**:
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "name": "数据处理工作流",
        "description": "自动化数据处理流程",
        "status": "active",
        "executionCount": 50,
        "successCount": 48,
        "successRate": 96.00,
        "lastExecutedAt": "2024-01-01T00:00:00Z",
        "author": {
          "id": 1,
          "username": "author"
        },
        "version": "1.0.0",
        "tags": ["data", "automation"],
        "createdAt": "2024-01-01T00:00:00Z",
        "updatedAt": "2024-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 10,
      "totalPages": 1
    }
  }
}
```

### 4.2 获取工作流详情
```
GET /workflows/{id}
Authorization: Bearer {token}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "数据处理工作流",
    "description": "详细描述",
    "status": "active",
    "nodes": [
      {
        "id": "node1",
        "type": "start",
        "position": {"x": 100, "y": 100},
        "data": {"label": "开始"}
      }
    ],
    "connections": [
      {
        "id": "edge1",
        "source": "node1",
        "target": "node2"
      }
    ],
    "agents": {},
    "properties": {},
    "tags": ["data"],
    "author": {
      "id": 1,
      "username": "author"
    },
    "version": "1.0.0",
    "executionCount": 50,
    "successCount": 48,
    "successRate": 96.00,
    "lastExecutedAt": "2024-01-01T00:00:00Z",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

### 4.3 创建工作流
```
POST /workflows
Authorization: Bearer {token}
```

**请求体**:
```json
{
  "name": "string",
  "description": "string",
  "nodes": [],
  "connections": [],
  "agents": {},
  "properties": {},
  "tags": ["string"]
}
```

### 4.4 更新工作流
```
PUT /workflows/{id}
Authorization: Bearer {token}
```

### 4.5 删除工作流
```
DELETE /workflows/{id}
Authorization: Bearer {token}
```

### 4.6 执行工作流
```
POST /workflows/{id}/execute
Authorization: Bearer {token}
```

**请求体**:
```json
{
  "inputData": {},
  "options": {
    "async": true,
    "timeout": 3600
  }
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "executionId": 123,
    "status": "running",
    "startedAt": "2024-01-01T00:00:00Z"
  }
}
```

### 4.7 获取工作流执行记录
```
GET /workflows/{id}/executions
Authorization: Bearer {token}
```

**查询参数**:
- `page`: 页码
- `pageSize`: 每页数量
- `status`: 状态过滤
- `startDate`: 开始日期
- `endDate`: 结束日期

### 4.8 获取执行记录详情
```
GET /workflow-executions/{id}
Authorization: Bearer {token}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "id": 123,
    "workflowId": 1,
    "status": "completed",
    "startedAt": "2024-01-01T00:00:00Z",
    "completedAt": "2024-01-01T00:05:00Z",
    "duration": 300,
    "inputData": {},
    "outputData": {},
    "executionLog": [],
    "triggeredBy": {
      "id": 1,
      "username": "user"
    }
  }
}
```

## 5. 能力管理

### 5.1 获取能力列表
```
GET /capabilities
```

**查询参数**:
- `page`: 页码
- `pageSize`: 每页数量
- `type`: 能力类型过滤
- `category`: 分类过滤
- `search`: 搜索关键词

### 5.2 获取能力详情
```
GET /capabilities/{id}
```

### 5.3 创建能力
```
POST /capabilities
Authorization: Bearer {token}
```

**请求体**:
```json
{
  "name": "string",
  "description": "string",
  "type": "web_search|file_operation|llm_reasoning|api_call|database_access|code_execution|image_processing|text_to_speech|speech_to_text|memory_storage|knowledge_graph|multimodal",
  "category": "string",
  "iconUrl": "string",
  "components": {},
  "properties": {},
  "configOptions": {},
  "tags": ["string"],
  "isPublic": true
}
```

### 5.4 更新能力
```
PUT /capabilities/{id}
Authorization: Bearer {token}
```

### 5.5 删除能力
```
DELETE /capabilities/{id}
Authorization: Bearer {token}
```

## 6. 组件管理

### 6.1 获取组件列表
```
GET /components
```

**查询参数**:
- `page`: 页码
- `pageSize`: 每页数量
- `type`: 组件类型过滤
- `category`: 组件分类过滤
- `search`: 搜索关键词

### 6.2 获取组件详情
```
GET /components/{id}
```

### 6.3 创建组件
```
POST /components
Authorization: Bearer {token}
```

**请求体**:
```json
{
  "name": "string",
  "description": "string",
  "type": "agent_type|agent_config|state_management|observation|decision|action|message_send|message_receive|message_process|data_source|tool_integration|external_service",
  "category": "base|capability|communication|resource",
  "iconUrl": "string",
  "properties": {},
  "inputs": {},
  "outputs": {},
  "configSchema": {},
  "isPublic": true
}
```

### 6.4 更新组件
```
PUT /components/{id}
Authorization: Bearer {token}
```

### 6.5 删除组件
```
DELETE /components/{id}
Authorization: Bearer {token}
```

## 7. Agent实例监控

### 7.1 获取Agent实例列表
```
GET /agent-instances
Authorization: Bearer {token}
```

**查询参数**:
- `page`: 页码
- `pageSize`: 每页数量
- `status`: 状态过滤
- `configId`: 配置ID过滤

### 7.2 获取Agent实例详情
```
GET /agent-instances/{id}
Authorization: Bearer {token}
```

### 7.3 启动Agent实例
```
POST /agent-instances/{id}/start
Authorization: Bearer {token}
```

### 7.4 停止Agent实例
```
POST /agent-instances/{id}/stop
Authorization: Bearer {token}
```

### 7.5 重启Agent实例
```
POST /agent-instances/{id}/restart
Authorization: Bearer {token}
```

### 7.6 获取性能指标
```
GET /agent-instances/{id}/metrics
Authorization: Bearer {token}
```

**查询参数**:
- `metricType`: 指标类型
- `startTime`: 开始时间
- `endTime`: 结束时间
- `interval`: 时间间隔

**响应**:
```json
{
  "success": true,
  "data": {
    "metrics": [
      {
        "timestamp": "2024-01-01T00:00:00Z",
        "metricType": "response_time",
        "value": 150.5,
        "unit": "ms"
      }
    ],
    "summary": {
      "avg": 150.5,
      "min": 100.0,
      "max": 200.0,
      "count": 100
    }
  }
}
```

### 7.7 获取系统日志
```
GET /agent-instances/{id}/logs
Authorization: Bearer {token}
```

**查询参数**:
- `level`: 日志级别
- `startTime`: 开始时间
- `endTime`: 结束时间
- `page`: 页码
- `pageSize`: 每页数量
- `search`: 搜索关键词

### 7.8 获取消息记录
```
GET /agent-instances/{id}/messages
Authorization: Bearer {token}
```

**查询参数**:
- `direction`: 消息方向 (incoming/outgoing)
- `startTime`: 开始时间
- `endTime`: 结束时间
- `page`: 页码
- `pageSize`: 每页数量

## 8. 版本控制

### 8.1 获取版本历史
```
GET /version-history
Authorization: Bearer {token}
```

**查询参数**:
- `entityType`: 实体类型
- `entityId`: 实体ID
- `page`: 页码
- `pageSize`: 每页数量

### 8.2 创建版本
```
POST /version-history
Authorization: Bearer {token}
```

**请求体**:
```json
{
  "entityType": "agent_template|agent_config|workflow|capability|component",
  "entityId": 1,
  "version": "1.1.0",
  "changes": {},
  "changeSummary": "string"
}
```

### 8.3 版本回滚
```
POST /version-history/{id}/rollback
Authorization: Bearer {token}
```

## 9. 系统设置

### 9.1 获取系统设置
```
GET /system-settings
Authorization: Bearer {token}
```

**查询参数**:
- `category`: 设置分类
- `isPublic`: 是否公开

### 9.2 更新系统设置
```
PUT /system-settings
Authorization: Bearer {token}
```

**请求体**:
```json
{
  "settings": [
    {
      "category": "string",
      "keyName": "string",
      "value": "string",
      "dataType": "string|number|boolean|json"
    }
  ]
}
```

## 10. 统计和分析

### 10.1 获取仪表板统计
```
GET /dashboard/stats
Authorization: Bearer {token}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "totalAgents": 50,
    "runningAgents": 10,
    "totalWorkflows": 20,
    "activeWorkflows": 5,
    "totalExecutions": 1000,
    "successRate": 95.5,
    "avgResponseTime": 150.5,
    "systemLoad": 65.2
  }
}
```

### 10.2 获取使用趋势
```
GET /dashboard/trends
Authorization: Bearer {token}
```

**查询参数**:
- `period`: 时间周期 (day/week/month)
- `metric`: 指标类型

## 认证和权限

### JWT Token格式
```json
{
  "sub": "user_id",
  "username": "string",
  "role": "admin|developer|user",
  "iat": 1640995200,
  "exp": 1641081600
}
```

### 权限级别
- **admin**: 系统管理员，拥有所有权限
- **developer**: 开发者，可以创建和管理自己的资源
- **user**: 普通用户，只能查看和使用公开资源

### 权限验证
每个需要认证的接口都需要在请求头中包含有效的JWT Token:
```
Authorization: Bearer {jwt_token}
```

## 限流和配额

### API限流
- **普通用户**: 1000次/小时
- **开发者**: 5000次/小时
- **管理员**: 无限制

### 资源配额
- **普通用户**: 最多创建10个Agent配置
- **开发者**: 最多创建100个Agent配置
- **管理员**: 无限制

## WebSocket接口

### 实时监控连接
```
WS /ws/monitor
Authorization: Bearer {token}
```

**消息格式**:
```json
{
  "type": "agent_status|workflow_execution|system_metrics",
  "data": {},
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### 日志流连接
```
WS /ws/logs/{agentId}
Authorization: Bearer {token}
```

## 文件上传

### 上传头像
```
POST /upload/avatar
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

### 上传图标
```
POST /upload/icon
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**响应**:
```json
{
  "success": true,
  "data": {
    "url": "https://example.com/uploads/file.png",
    "filename": "file.png",
    "size": 1024
  }
}
```

## 健康检查

### 系统健康状态
```
GET /health
```

**响应**:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00Z",
  "services": {
    "database": "healthy",
    "redis": "healthy",
    "storage": "healthy"
  },
  "version": "1.0.0"
}
```