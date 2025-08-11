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

## 10. 分析洞察服务

### 10.1 性能分析

#### 10.1.1 获取性能分析数据
```
GET /analytics/performance
Authorization: Bearer {token}
```

**查询参数**:
- `timeRange`: 时间范围 (1h/6h/24h/7d/30d/90d/1y)
- `startDate`: 开始日期 (ISO 8601格式)
- `endDate`: 结束日期 (ISO 8601格式)
- `agentId`: Agent ID过滤
- `nodeId`: 节点ID过滤
- `metricTypes`: 指标类型数组

**响应**:
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalExecutions": 1000,
      "successRate": 95.5,
      "avgResponseTime": 150.5,
      "errorRate": 4.5
    },
    "metrics": {
      "raw": [
        {
          "id": "metric_1",
          "timestamp": "2024-01-01T00:00:00Z",
          "metricType": "response_time",
          "value": 150.5,
          "unit": "ms",
          "agentId": "agent_1",
          "nodeId": "node_1",
          "tags": {},
          "metadata": {}
        }
      ],
      "grouped": {
        "response_time": [],
        "throughput": [],
        "error_rate": []
      },
      "aggregated": {
        "response_time": {
          "avg": 150.5,
          "min": 100.0,
          "max": 200.0,
          "p95": 180.0,
          "p99": 195.0
        }
      },
      "summary": {
        "response_time": {
          "avg": 150.5,
          "p95": 180.0
        },
        "success_rate": {
          "avg": 95.5
        },
        "error_rate": {
          "avg": 4.5
        },
        "throughput": {
          "avg": 100.0
        }
      }
    },
    "systemPerformance": {
      "metrics": [
        {
          "timestamp": "2024-01-01T00:00:00Z",
          "cpuUsage": 65.2,
          "memoryUsage": 78.5,
          "diskUsage": 45.3,
          "networkIO": 1024
        }
      ],
      "summary": {
        "avgCpuUsage": 65.2,
        "avgMemoryUsage": 78.5,
        "peakCpuUsage": 85.0,
        "peakMemoryUsage": 90.0
      }
    },
    "agentPerformance": {
      "executions": [
        {
          "agentId": "agent_1",
          "executionCount": 100,
          "successCount": 95,
          "avgResponseTime": 150.5,
          "errorRate": 5.0
        }
      ],
      "statistics": {
        "totalExecutions": 1000,
        "uniqueAgents": 10,
        "avgExecutionsPerAgent": 100.0
      }
    },
    "trends": {
      "responseTimeTrend": "improving",
      "throughputTrend": "stable",
      "errorRateTrend": "worsening"
    },
    "anomalies": [
      {
        "timestamp": "2024-01-01T00:00:00Z",
        "metricType": "response_time",
        "value": 500.0,
        "threshold": 200.0,
        "severity": "high",
        "description": "响应时间异常升高"
      }
    ],
    "timeRange": {
      "start": "2024-01-01T00:00:00Z",
      "end": "2024-01-02T00:00:00Z"
    }
  }
}
```

#### 10.1.2 获取特定指标的性能数据
```
GET /analytics/performance/metrics/{metricType}
Authorization: Bearer {token}
```

**路径参数**:
- `metricType`: 指标类型 (response_time/throughput/error_rate/cpu_usage/memory_usage)

### 10.2 使用分析

#### 10.2.1 获取使用分析数据
```
GET /analytics/usage
Authorization: Bearer {token}
```

**查询参数**:
- `timeRange`: 时间范围
- `startDate`: 开始日期
- `endDate`: 结束日期
- `userId`: 用户ID过滤
- `agentId`: Agent ID过滤
- `granularity`: 粒度 (hour/day/week/month)

**响应**:
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalUsers": 100,
      "activeUsers": 80,
      "totalSessions": 500,
      "avgSessionDuration": 1800
    },
    "userUsage": {
      "activities": [
        {
          "userId": "user_1",
          "timestamp": "2024-01-01T00:00:00Z",
          "action": "agent_execution",
          "agentId": "agent_1",
          "duration": 300
        }
      ],
      "aggregated": {
        "daily": [
          {
            "date": "2024-01-01",
            "activeUsers": 50,
            "totalSessions": 100,
            "avgSessionDuration": 1800
          }
        ]
      },
      "statistics": {
        "uniqueUsers": 100,
        "avgSessionsPerUser": 5.0,
        "avgDurationPerSession": 1800
      }
    },
    "agentUsage": {
      "executions": [
        {
          "agentId": "agent_1",
          "executionCount": 100,
          "uniqueUsers": 20,
          "totalDuration": 30000,
          "avgDuration": 300
        }
      ],
      "aggregated": {
        "daily": [
          {
            "date": "2024-01-01",
            "totalExecutions": 100,
            "uniqueAgents": 10
          }
        ]
      },
      "statistics": {
        "totalExecutions": 1000,
        "uniqueAgents": 50,
        "avgExecutionsPerAgent": 20.0
      }
    },
    "workflowUsage": {
      "executions": [
        {
          "workflowId": "workflow_1",
          "executionCount": 50,
          "successCount": 48,
          "avgDuration": 600
        }
      ],
      "aggregated": {
        "daily": [
          {
            "date": "2024-01-01",
            "totalExecutions": 50,
            "uniqueWorkflows": 5
          }
        ]
      },
      "statistics": {
        "totalExecutions": 500,
        "uniqueWorkflows": 25,
        "avgExecutionsPerWorkflow": 20.0
      }
    },
    "apiUsage": {
      "calls": [
        {
          "endpoint": "/api/v1/agents",
          "method": "GET",
          "callCount": 1000,
          "avgResponseTime": 150.5,
          "errorRate": 2.0
        }
      ],
      "aggregated": {
        "hourly": [
          {
            "hour": "2024-01-01T00:00:00Z",
            "totalCalls": 100,
            "uniqueEndpoints": 10
          }
        ]
      },
      "statistics": {
        "totalCalls": 10000,
        "uniqueEndpoints": 50,
        "avgCallsPerEndpoint": 200.0
      }
    },
    "behaviorAnalysis": {
      "popularFeatures": [
        {
          "feature": "agent_designer",
          "usageCount": 500,
          "userCount": 80
        }
      ],
      "userJourney": [
        {
          "step": "login",
          "userCount": 100,
          "conversionRate": 100.0
        },
        {
          "step": "create_agent",
          "userCount": 80,
          "conversionRate": 80.0
        }
      ]
    },
    "trends": {
      "userGrowth": "increasing",
      "usageGrowth": "stable",
      "engagementTrend": "improving"
    },
    "timeRange": {
      "start": "2024-01-01T00:00:00Z",
      "end": "2024-01-02T00:00:00Z"
    }
  }
}
```

#### 10.2.2 获取特定用户的使用分析
```
GET /analytics/usage/users/{userId}
Authorization: Bearer {token}
```

#### 10.2.3 获取特定Agent的使用分析
```
GET /analytics/usage/agents/{agentId}
Authorization: Bearer {token}
```

### 10.3 趋势分析

#### 10.3.1 获取趋势分析数据
```
GET /analytics/trends
Authorization: Bearer {token}
```

**查询参数**:
- `timeRange`: 时间范围
- `startDate`: 开始日期
- `endDate`: 结束日期
- `metrics`: 指标数组
- `analysisTypes`: 分析类型数组
- `predictionDays`: 预测天数

**响应**:
```json
{
  "success": true,
  "data": {
    "overview": {
      "trendDirection": "upward",
      "growthRate": 15.5,
      "volatility": "low",
      "confidence": 85.0
    },
    "trends": {
      "response_time": {
        "direction": "improving",
        "changeRate": -10.5,
        "significance": "high"
      },
      "throughput": {
        "direction": "stable",
        "changeRate": 2.1,
        "significance": "low"
      }
    },
    "seasonality": {
      "daily": {
        "peakHours": [9, 10, 14, 15],
        "lowHours": [2, 3, 4, 5]
      },
      "weekly": {
        "peakDays": ["Tuesday", "Wednesday"],
        "lowDays": ["Saturday", "Sunday"]
      }
    },
    "anomalies": [
      {
        "timestamp": "2024-01-01T00:00:00Z",
        "metric": "response_time",
        "value": 500.0,
        "expectedValue": 150.0,
        "severity": "high",
        "type": "spike"
      }
    ],
    "predictions": {
      "response_time": {
        "nextWeek": {
          "predicted": 140.0,
          "confidence": 85.0,
          "range": [130.0, 150.0]
        },
        "nextMonth": {
          "predicted": 135.0,
          "confidence": 75.0,
          "range": [120.0, 150.0]
        }
      }
    },
    "correlations": {
      "response_time_vs_load": {
        "coefficient": 0.85,
        "strength": "strong",
        "direction": "positive"
      }
    },
    "impactFactors": {
      "response_time": [
        {
          "factor": "system_load",
          "impact": 0.7,
          "description": "系统负载对响应时间影响最大"
        }
      ]
    },
    "historicalData": [
      {
        "timestamp": "2024-01-01T00:00:00Z",
        "metric": "response_time",
        "value": 150.0
      }
    ]
  }
}
```

#### 10.3.2 获取预测分析数据
```
GET /analytics/trends/predictions
Authorization: Bearer {token}
```

#### 10.3.3 获取异常检测数据
```
GET /analytics/trends/anomalies
Authorization: Bearer {token}
```

**查询参数**:
- `sensitivity`: 敏感度 (low/medium/high)

### 10.4 实时分析

#### 10.4.1 获取实时分析数据
```
GET /analytics/realtime
Authorization: Bearer {token}
```

**查询参数**:
- `metrics`: 指标数组
- `interval`: 更新间隔

**响应**:
```json
{
  "success": true,
  "data": {
    "timestamp": "2024-01-01T00:00:00Z",
    "metrics": {
      "response_time": {
        "current": 150.5,
        "previous": 145.0,
        "change": 5.5,
        "trend": "increasing"
      },
      "throughput": {
        "current": 100.0,
        "previous": 98.0,
        "change": 2.0,
        "trend": "stable"
      },
      "active_users": {
        "current": 50,
        "previous": 48,
        "change": 2,
        "trend": "increasing"
      }
    },
    "anomalies": [
      {
        "metric": "response_time",
        "value": 500.0,
        "threshold": 200.0,
        "severity": "high"
      }
    ],
    "alerts": [
      {
        "id": "alert_1",
        "type": "performance",
        "severity": "warning",
        "message": "响应时间超过阈值",
        "timestamp": "2024-01-01T00:00:00Z"
      }
    ]
  }
}
```

### 10.5 分析报告

#### 10.5.1 生成分析报告
```
POST /analytics/reports
Authorization: Bearer {token}
```

**请求体**:
```json
{
  "reportType": "performance|usage|trend|comprehensive",
  "timeRange": "7d",
  "startDate": "2024-01-01T00:00:00Z",
  "endDate": "2024-01-02T00:00:00Z",
  "modules": ["performance", "usage", "trends"],
  "format": "json|pdf|excel|csv",
  "includeCharts": true
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "reportId": "report_123",
    "reportUrl": "https://example.com/reports/report_123.pdf",
    "generatedAt": "2024-01-01T00:00:00Z",
    "format": "pdf",
    "modules": ["performance", "usage"]
  }
}
```

### 10.6 分析配置

#### 10.6.1 获取分析配置
```
GET /analytics/config
Authorization: Bearer {token}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "performanceThresholds": {
      "response_time": {
        "warning": 200.0,
        "critical": 500.0
      },
      "error_rate": {
        "warning": 5.0,
        "critical": 10.0
      }
    },
    "alertRules": [
      {
        "id": "rule_1",
        "metric": "response_time",
        "condition": ">",
        "threshold": 200.0,
        "severity": "warning",
        "enabled": true
      }
    ],
    "retentionPeriod": 90,
    "samplingRate": 1.0,
    "enableRealtime": true,
    "dashboardConfig": {
      "refreshInterval": 30,
      "defaultTimeRange": "24h",
      "defaultMetrics": ["response_time", "throughput"]
    },
    "notificationSettings": {
      "email": {
        "enabled": true,
        "recipients": ["admin@example.com"]
      },
      "webhook": {
        "enabled": false,
        "url": ""
      }
    }
  }
}
```

#### 10.6.2 更新分析配置
```
PUT /analytics/config
Authorization: Bearer {token}
```

### 10.7 健康检查

#### 10.7.1 检查分析服务健康状态
```
GET /analytics/health
Authorization: Bearer {token}
```

### 10.8 数据导出

#### 10.8.1 导出分析数据
```
GET /analytics/{type}/export
Authorization: Bearer {token}
```

**路径参数**:
- `type`: 数据类型 (performance/usage/trend)

**查询参数**:
- `format`: 导出格式 (csv/excel/json)
- `timeRange`: 时间范围
- `startDate`: 开始日期
- `endDate`: 结束日期

**响应**: 文件下载

### 10.9 分析数据摘要

#### 10.9.1 获取分析数据摘要
```
GET /analytics/summary
Authorization: Bearer {token}
```

**查询参数**:
- `timeRange`: 时间范围 (默认: 7d)

**响应**:
```json
{
  "success": true,
  "data": {
    "performance": {
      "overview": {
        "totalExecutions": 1000,
        "successRate": 95.5,
        "avgResponseTime": 150.5
      },
      "keyMetrics": {
        "avgResponseTime": 150.5,
        "p95ResponseTime": 180.0,
        "successRate": 95.5,
        "errorRate": 4.5,
        "throughput": 100.0
      },
      "alerts": 2
    },
    "usage": {
      "overview": {
        "totalUsers": 100,
        "activeUsers": 80,
        "totalSessions": 500
      },
      "activeUsers": 80,
      "totalExecutions": 1000
    },
    "trends": {
      "overview": {
        "trendDirection": "upward",
        "growthRate": 15.5
      },
      "predictions": 5,
      "anomalies": 3
    },
    "lastUpdated": "2024-01-01T00:00:00Z"
  }
}
```

## 11. 工作流引擎API

### 11.1 工作流定义管理

#### 11.1.1 创建工作流定义
```
POST /workflow-engine/workflows
Authorization: Bearer {token}
```

**请求体**:
```json
{
  "id": "workflow_123",
  "name": "数据处理工作流",
  "description": "自动化数据处理流程",
  "version": "1.0.0",
  "nodes": [
    {
      "id": "node_1",
      "type": "start|capability|condition|end",
      "name": "开始节点",
      "position": {
        "x": 100,
        "y": 100
      },
      "capability": {
        "id": "capability_1",
        "type": "web_search",
        "config": {}
      },
      "config": {
        "timeout": 30000,
        "retryPolicy": {
          "maxRetries": 3,
          "retryDelay": 1000
        }
      },
      "inputs": {
        "query": "string"
      },
      "outputs": {
        "results": "array"
      },
      "conditions": {
        "executeIf": "input.query !== ''"
      }
    }
  ],
  "edges": [
    {
      "id": "edge_1",
      "sourceNodeId": "node_1",
      "targetNodeId": "node_2",
      "condition": "success",
      "mapping": {
        "source.results": "target.input"
      }
    }
  ],
  "variables": [
    {
      "name": "globalVar",
      "type": "string",
      "defaultValue": "default",
      "validation": {
        "required": true,
        "pattern": "^[a-zA-Z]+$"
      }
    }
  ],
  "triggers": [
    {
      "type": "manual|scheduled|webhook|event",
      "config": {
        "schedule": "0 0 * * *",
        "webhook": {
          "url": "/webhook/trigger",
          "secret": "secret_key"
        }
      }
    }
  ],
  "orchestrationConfig": {
    "mode": "sequential|parallel|conditional|pipeline",
    "timeout": 3600000,
    "retryPolicy": {
      "maxRetries": 3,
      "retryDelay": 5000,
      "backoffMultiplier": 2.0
    },
    "errorHandling": {
      "strategy": "fail_fast|continue_on_error|retry",
      "fallbackNode": "error_handler"
    }
  },
  "metadata": {
    "author": "user_123",
    "tags": ["data", "automation"],
    "category": "data_processing",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "permissions": {
    "owner": "user_123",
    "viewers": ["user_456"],
    "editors": ["user_789"],
    "isPublic": false
  }
}
```

#### 11.1.2 更新工作流定义
```
PUT /workflow-engine/workflows/{id}
Authorization: Bearer {token}
```

#### 11.1.3 删除工作流定义
```
DELETE /workflow-engine/workflows/{id}
Authorization: Bearer {token}
```

#### 11.1.4 获取工作流定义
```
GET /workflow-engine/workflows/{id}
Authorization: Bearer {token}
```

### 11.2 工作流执行管理

#### 11.2.1 执行工作流
```
POST /workflow-engine/workflows/{id}/execute
Authorization: Bearer {token}
```

**请求体**:
```json
{
  "inputs": {
    "query": "search term",
    "options": {
      "maxResults": 10
    }
  },
  "variables": {
    "globalVar": "custom_value"
  },
  "options": {
    "async": true,
    "timeout": 3600000,
    "priority": "normal|high|low"
  }
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "id": "exec_123",
    "workflowId": "workflow_123",
    "status": "pending|running|completed|failed|cancelled|paused",
    "startTime": "2024-01-01T00:00:00Z",
    "progress": 0,
    "nodeExecutions": [],
    "metrics": {
      "totalDuration": 0,
      "nodeCount": 5,
      "successCount": 0,
      "failureCount": 0,
      "averageNodeDuration": 0,
      "throughput": 0
    },
    "inputs": {
      "query": "search term"
    },
    "variables": {
      "globalVar": "custom_value"
    }
  }
}
```

#### 11.2.2 暂停工作流执行
```
POST /workflow-engine/executions/{executionId}/pause
Authorization: Bearer {token}
```

#### 11.2.3 恢复工作流执行
```
POST /workflow-engine/executions/{executionId}/resume
Authorization: Bearer {token}
```

#### 11.2.4 停止工作流执行
```
POST /workflow-engine/executions/{executionId}/stop
Authorization: Bearer {token}
```

#### 11.2.5 获取执行状态
```
GET /workflow-engine/executions/{executionId}
Authorization: Bearer {token}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "id": "exec_123",
    "workflowId": "workflow_123",
    "status": "completed",
    "startTime": "2024-01-01T00:00:00Z",
    "endTime": "2024-01-01T00:05:00Z",
    "progress": 100,
    "nodeExecutions": [
      {
        "nodeId": "node_1",
        "status": "success|failure|skipped|timeout",
        "startTime": "2024-01-01T00:00:00Z",
        "endTime": "2024-01-01T00:01:00Z",
        "duration": 60000,
        "inputs": {
          "query": "search term"
        },
        "outputs": {
          "results": []
        },
        "error": null,
        "metrics": {
          "startTime": "2024-01-01T00:00:00Z",
          "endTime": "2024-01-01T00:01:00Z",
          "duration": 60000,
          "cpuUsage": 25.5,
          "memoryUsage": 128.0,
          "throughput": 10.0,
          "errorRate": 0.0
        },
        "logs": [
          {
            "timestamp": "2024-01-01T00:00:00Z",
            "level": "info",
            "message": "节点开始执行",
            "data": {}
          }
        ]
      }
    ],
    "metrics": {
      "totalDuration": 300000,
      "nodeCount": 5,
      "successCount": 5,
      "failureCount": 0,
      "averageNodeDuration": 60000,
      "throughput": 1.0
    },
    "inputs": {
      "query": "search term"
    },
    "outputs": {
      "finalResult": "processed_data"
    },
    "variables": {
      "globalVar": "custom_value"
    },
    "error": null
  }
}
```

#### 11.2.6 获取执行历史
```
GET /workflow-engine/workflows/{workflowId}/executions
Authorization: Bearer {token}
```

**查询参数**:
- `page`: 页码
- `pageSize`: 每页数量
- `status`: 状态过滤
- `startDate`: 开始日期
- `endDate`: 结束日期
- `sortBy`: 排序字段 (startTime/duration/status)
- `sortOrder`: 排序方向 (asc/desc)

### 11.3 能力模块管理

#### 11.3.1 注册能力模块
```
POST /workflow-engine/capabilities
Authorization: Bearer {token}
```

**请求体**:
```json
{
  "id": "capability_123",
  "name": "Web搜索能力",
  "description": "提供网络搜索功能",
  "type": "web_search|file_operation|llm_reasoning|api_call|database_access|code_execution|image_processing|text_to_speech|speech_to_text|memory_storage|knowledge_graph|multimodal",
  "version": "1.0.0",
  "config": {
    "apiKey": "required",
    "endpoint": "https://api.search.com",
    "timeout": 30000
  },
  "inputSchema": {
    "type": "object",
    "properties": {
      "query": {
        "type": "string",
        "required": true
      }
    }
  },
  "outputSchema": {
    "type": "object",
    "properties": {
      "results": {
        "type": "array"
      }
    }
  },
  "metadata": {
    "author": "user_123",
    "tags": ["search", "web"],
    "category": "data_source"
  }
}
```

#### 11.3.2 获取能力模块列表
```
GET /workflow-engine/capabilities
Authorization: Bearer {token}
```

#### 11.3.3 获取能力模块详情
```
GET /workflow-engine/capabilities/{id}
Authorization: Bearer {token}
```

### 11.4 Agent管理

#### 11.4.1 注册Agent
```
POST /workflow-engine/agents
Authorization: Bearer {token}
```

**请求体**:
```json
{
  "id": "agent_123",
  "name": "数据处理Agent",
  "description": "专门处理数据的Agent",
  "type": "planning|execution|audit|memory",
  "version": "2.0.0",
  "capabilities": [
    {
      "capabilityId": "capability_123",
      "config": {
        "priority": "high"
      }
    }
  ],
  "config": {
    "maxConcurrency": 5,
    "timeout": 300000
  },
  "metadata": {
    "author": "user_123",
    "tags": ["data", "processing"]
  }
}
```

#### 11.4.2 获取Agent列表
```
GET /workflow-engine/agents
Authorization: Bearer {token}
```

#### 11.4.3 获取Agent详情
```
GET /workflow-engine/agents/{id}
Authorization: Bearer {token}
```

### 11.5 工作流引擎监控

#### 11.5.1 获取引擎状态
```
GET /workflow-engine/status
Authorization: Bearer {token}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "status": "running",
    "version": "2.0.0",
    "uptime": 86400,
    "statistics": {
      "totalWorkflows": 100,
      "activeExecutions": 10,
      "completedExecutions": 1000,
      "failedExecutions": 50,
      "queuedExecutions": 5
    },
    "performance": {
      "avgExecutionTime": 300000,
      "throughput": 10.0,
      "successRate": 95.0
    },
    "resources": {
      "cpuUsage": 65.5,
      "memoryUsage": 78.2,
      "diskUsage": 45.0
    }
  }
}
```

#### 11.5.2 获取执行队列状态
```
GET /workflow-engine/queue
Authorization: Bearer {token}
```

#### 11.5.3 获取引擎指标
```
GET /workflow-engine/metrics
Authorization: Bearer {token}
```

**查询参数**:
- `metricType`: 指标类型
- `startTime`: 开始时间
- `endTime`: 结束时间
- `interval`: 时间间隔

### 11.6 事件和通知

#### 11.6.1 获取工作流事件
```
GET /workflow-engine/events
Authorization: Bearer {token}
```

**查询参数**:
- `eventType`: 事件类型 (workflow:created/execution:started/execution:completed/execution:failed)
- `workflowId`: 工作流ID
- `executionId`: 执行ID
- `startTime`: 开始时间
- `endTime`: 结束时间

**响应**:
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "event_123",
        "type": "execution:completed",
        "workflowId": "workflow_123",
        "executionId": "exec_123",
        "timestamp": "2024-01-01T00:00:00Z",
        "data": {
          "duration": 300000,
          "status": "completed"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 100
    }
  }
}
```

## 12. WebSocket实时接口

### 12.1 分析数据实时推送
```
WS /ws/analytics/realtime
Authorization: Bearer {token}
```

**消息格式**:
```json
{
  "type": "metrics_update|anomaly_detected|alert_triggered",
  "timestamp": "2024-01-01T00:00:00Z",
  "data": {
    "metrics": {
      "response_time": 150.5,
      "throughput": 100.0
    },
    "anomaly": {
      "metric": "response_time",
      "value": 500.0,
      "severity": "high"
    },
    "alert": {
      "id": "alert_123",
      "message": "响应时间异常",
      "severity": "warning"
    }
  }
}
```

### 12.2 工作流执行实时监控
```
WS /ws/workflow-engine/executions/{executionId}
Authorization: Bearer {token}
```

**消息格式**:
```json
{
  "type": "execution_started|execution_progress|node_completed|execution_completed|execution_failed",
  "timestamp": "2024-01-01T00:00:00Z",
  "executionId": "exec_123",
  "data": {
    "status": "running",
    "progress": 50,
    "currentNode": "node_2",
    "nodeResult": {
      "nodeId": "node_1",
      "status": "success",
      "outputs": {}
    }
  }
}
```

### 12.3 系统监控实时数据
```
WS /ws/system/monitor
Authorization: Bearer {token}
```

**消息格式**:
```json
{
  "type": "system_metrics|agent_status|workflow_status",
  "timestamp": "2024-01-01T00:00:00Z",
  "data": {
    "systemMetrics": {
      "cpuUsage": 65.5,
      "memoryUsage": 78.2,
      "diskUsage": 45.0,
      "networkIO": 1024
    },
    "agentStatus": {
      "agentId": "agent_123",
      "status": "running",
      "lastHeartbeat": "2024-01-01T00:00:00Z"
    },
    "workflowStatus": {
      "workflowId": "workflow_123",
      "activeExecutions": 5,
      "queuedExecutions": 2
    }
  }
}
```

## 13. 监控服务API

### 13.1 系统监控

#### 13.1.1 获取系统状态
```
GET /monitoring/system/status
Authorization: Bearer {token}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "status": "healthy|degraded|unhealthy",
    "timestamp": "2024-01-01T00:00:00Z",
    "uptime": 86400,
    "version": "2.0.0",
    "environment": "production",
    "services": {
      "database": {
        "status": "healthy",
        "responseTime": 10.5,
        "lastCheck": "2024-01-01T00:00:00Z"
      },
      "redis": {
        "status": "healthy",
        "responseTime": 2.1,
        "lastCheck": "2024-01-01T00:00:00Z"
      },
      "workflow_engine": {
        "status": "healthy",
        "responseTime": 15.3,
        "lastCheck": "2024-01-01T00:00:00Z"
      }
    },
    "resources": {
      "cpu": {
        "usage": 65.5,
        "cores": 8,
        "loadAverage": [1.2, 1.5, 1.8]
      },
      "memory": {
        "usage": 78.2,
        "total": 16384,
        "used": 12800,
        "free": 3584
      },
      "disk": {
        "usage": 45.0,
        "total": 1000000,
        "used": 450000,
        "free": 550000
      },
      "network": {
        "bytesIn": 1024000,
        "bytesOut": 2048000,
        "packetsIn": 1000,
        "packetsOut": 1500
      }
    },
    "alerts": [
      {
        "id": "alert_123",
        "severity": "warning|critical|info",
        "message": "CPU使用率较高",
        "timestamp": "2024-01-01T00:00:00Z",
        "resolved": false
      }
    ]
  }
}
```

#### 13.1.2 获取系统指标历史
```
GET /monitoring/system/metrics
Authorization: Bearer {token}
```

**查询参数**:
- `metricType`: 指标类型 (cpu/memory/disk/network)
- `timeRange`: 时间范围
- `startTime`: 开始时间
- `endTime`: 结束时间
- `interval`: 时间间隔 (1m/5m/1h/1d)

#### 13.1.3 获取服务健康检查
```
GET /monitoring/services/health
Authorization: Bearer {token}
```

### 13.2 应用监控

#### 13.2.1 获取应用性能指标
```
GET /monitoring/application/performance
Authorization: Bearer {token}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "overview": {
      "requestCount": 10000,
      "errorCount": 50,
      "avgResponseTime": 150.5,
      "p95ResponseTime": 300.0,
      "p99ResponseTime": 500.0,
      "throughput": 100.0,
      "errorRate": 0.5
    },
    "endpoints": [
      {
        "path": "/api/v1/agents",
        "method": "GET",
        "requestCount": 1000,
        "avgResponseTime": 120.0,
        "errorRate": 0.1,
        "p95ResponseTime": 200.0
      }
    ],
    "errors": [
      {
        "type": "ValidationError",
        "count": 20,
        "percentage": 40.0,
        "lastOccurrence": "2024-01-01T00:00:00Z"
      }
    ],
    "slowQueries": [
      {
        "query": "SELECT * FROM agents WHERE...",
        "avgDuration": 1500.0,
        "count": 10,
        "lastExecution": "2024-01-01T00:00:00Z"
      }
    ]
  }
}
```

#### 13.2.2 获取错误日志
```
GET /monitoring/application/errors
Authorization: Bearer {token}
```

**查询参数**:
- `level`: 日志级别 (error/warning/info)
- `startTime`: 开始时间
- `endTime`: 结束时间
- `service`: 服务名称
- `limit`: 返回数量限制

### 13.3 业务监控

#### 13.3.1 获取业务指标
```
GET /monitoring/business/metrics
Authorization: Bearer {token}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "agents": {
      "total": 100,
      "active": 80,
      "created_today": 5,
      "execution_success_rate": 95.5
    },
    "workflows": {
      "total": 50,
      "active": 30,
      "executions_today": 200,
      "avg_execution_time": 300000
    },
    "users": {
      "total": 500,
      "active_today": 100,
      "new_registrations_today": 10,
      "retention_rate": 85.0
    },
    "capabilities": {
      "total": 20,
      "most_used": [
        {
          "name": "web_search",
          "usage_count": 1000
        }
      ]
    }
  }
}
```

### 13.4 告警管理

#### 13.4.1 获取告警列表
```
GET /monitoring/alerts
Authorization: Bearer {token}
```

**查询参数**:
- `severity`: 严重程度 (critical/warning/info)
- `status`: 状态 (active/resolved/acknowledged)
- `service`: 服务名称
- `startTime`: 开始时间
- `endTime`: 结束时间

#### 13.4.2 创建告警规则
```
POST /monitoring/alert-rules
Authorization: Bearer {token}
```

**请求体**:
```json
{
  "name": "CPU使用率告警",
  "description": "当CPU使用率超过80%时触发告警",
  "metric": "cpu_usage",
  "condition": ">",
  "threshold": 80.0,
  "duration": 300,
  "severity": "warning",
  "enabled": true,
  "notifications": {
    "email": {
      "enabled": true,
      "recipients": ["admin@example.com"]
    },
    "webhook": {
      "enabled": false,
      "url": ""
    }
  }
}
```

#### 13.4.3 确认告警
```
POST /monitoring/alerts/{alertId}/acknowledge
Authorization: Bearer {token}
```

#### 13.4.4 解决告警
```
POST /monitoring/alerts/{alertId}/resolve
Authorization: Bearer {token}
```

### 13.5 日志管理

#### 13.5.1 搜索日志
```
GET /monitoring/logs/search
Authorization: Bearer {token}
```

**查询参数**:
- `query`: 搜索关键词
- `level`: 日志级别
- `service`: 服务名称
- `startTime`: 开始时间
- `endTime`: 结束时间
- `limit`: 返回数量限制
- `offset`: 偏移量

**响应**:
```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "id": "log_123",
        "timestamp": "2024-01-01T00:00:00Z",
        "level": "error",
        "service": "workflow-engine",
        "message": "工作流执行失败",
        "metadata": {
          "workflowId": "workflow_123",
          "executionId": "exec_123",
          "error": "timeout"
        },
        "traceId": "trace_123"
      }
    ],
    "total": 1000,
    "hasMore": true
  }
}
```

#### 13.5.2 获取日志统计
```
GET /monitoring/logs/stats
Authorization: Bearer {token}
```

### 13.6 性能追踪

#### 13.6.1 获取追踪数据
```
GET /monitoring/traces
Authorization: Bearer {token}
```

**查询参数**:
- `traceId`: 追踪ID
- `service`: 服务名称
- `operation`: 操作名称
- `startTime`: 开始时间
- `endTime`: 结束时间
- `minDuration`: 最小持续时间
- `maxDuration`: 最大持续时间

**响应**:
```json
{
  "success": true,
  "data": {
    "traces": [
      {
        "traceId": "trace_123",
        "spans": [
          {
            "spanId": "span_123",
            "parentSpanId": null,
            "operationName": "workflow_execution",
            "service": "workflow-engine",
            "startTime": "2024-01-01T00:00:00Z",
            "endTime": "2024-01-01T00:05:00Z",
            "duration": 300000,
            "tags": {
              "workflowId": "workflow_123",
              "userId": "user_123"
            },
            "logs": [
              {
                "timestamp": "2024-01-01T00:01:00Z",
                "fields": {
                  "event": "node_started",
                  "nodeId": "node_1"
                }
              }
            ]
          }
        ],
        "duration": 300000,
        "services": ["workflow-engine", "analytics-service"]
      }
    ],
    "total": 100
  }
}
```

## 14. 实时数据流API

### 14.1 数据流管理

#### 14.1.1 创建数据流
```
POST /dataflow/streams
Authorization: Bearer {token}
```

**请求体**:
```json
{
  "name": "实时性能监控流",
  "description": "实时监控系统性能指标",
  "type": "metrics|events|logs|traces",
  "source": {
    "type": "kafka|rabbitmq|websocket|http",
    "config": {
      "topic": "performance_metrics",
      "brokers": ["localhost:9092"]
    }
  },
  "processors": [
    {
      "type": "filter|transform|aggregate|enrich",
      "config": {
        "condition": "value > 80",
        "fields": ["cpu_usage", "memory_usage"]
      }
    }
  ],
  "sinks": [
    {
      "type": "elasticsearch|influxdb|webhook|websocket",
      "config": {
        "index": "performance_metrics",
        "url": "http://elasticsearch:9200"
      }
    }
  ],
  "schema": {
    "type": "object",
    "properties": {
      "timestamp": {"type": "string"},
      "metric_type": {"type": "string"},
      "value": {"type": "number"}
    }
  },
  "config": {
    "batchSize": 100,
    "flushInterval": 5000,
    "retryPolicy": {
      "maxRetries": 3,
      "retryDelay": 1000
    }
  }
}
```

#### 14.1.2 启动数据流
```
POST /dataflow/streams/{streamId}/start
Authorization: Bearer {token}
```

#### 14.1.3 停止数据流
```
POST /dataflow/streams/{streamId}/stop
Authorization: Bearer {token}
```

#### 14.1.4 获取数据流状态
```
GET /dataflow/streams/{streamId}/status
Authorization: Bearer {token}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "id": "stream_123",
    "name": "实时性能监控流",
    "status": "running|stopped|error",
    "startTime": "2024-01-01T00:00:00Z",
    "metrics": {
      "messagesProcessed": 10000,
      "messagesPerSecond": 100.0,
      "errorCount": 5,
      "lastProcessedTime": "2024-01-01T00:00:00Z",
      "lag": 100
    },
    "health": {
      "source": "healthy",
      "processors": "healthy",
      "sinks": "healthy"
    }
  }
}
```

### 14.2 实时数据查询

#### 14.2.1 查询实时数据
```
GET /dataflow/query/realtime
Authorization: Bearer {token}
```

**查询参数**:
- `streamId`: 数据流ID
- `query`: 查询条件
- `timeWindow`: 时间窗口
- `aggregation`: 聚合方式
- `limit`: 返回数量限制

**响应**:
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "timestamp": "2024-01-01T00:00:00Z",
        "data": {
          "cpu_usage": 85.5,
          "memory_usage": 78.2
        }
      }
    ],
    "metadata": {
      "totalCount": 1000,
      "queryTime": 50.5,
      "timeRange": {
        "start": "2024-01-01T00:00:00Z",
        "end": "2024-01-01T00:01:00Z"
      }
    }
  }
}
```

#### 14.2.2 订阅实时数据
```
WS /ws/dataflow/subscribe
Authorization: Bearer {token}
```

**订阅消息**:
```json
{
  "action": "subscribe",
  "streamId": "stream_123",
  "filters": {
    "metric_type": "cpu_usage",
    "threshold": 80.0
  }
}
```

**数据消息**:
```json
{
  "type": "data",
  "streamId": "stream_123",
  "timestamp": "2024-01-01T00:00:00Z",
  "data": {
    "cpu_usage": 85.5,
    "memory_usage": 78.2
  }
}
```

### 14.3 数据流分析

#### 14.3.1 获取数据流指标
```
GET /dataflow/streams/{streamId}/metrics
Authorization: Bearer {token}
```

#### 14.3.2 获取数据流日志
```
GET /dataflow/streams/{streamId}/logs
Authorization: Bearer {token}
```

## 15. 系统管理API

### 15.1 配置管理

#### 15.1.1 获取系统配置
```
GET /admin/config
Authorization: Bearer {token}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "system": {
      "environment": "production",
      "debug": false,
      "logLevel": "info",
      "maxConcurrentExecutions": 100,
      "defaultTimeout": 300000
    },
    "database": {
      "connectionPool": {
        "maxConnections": 20,
        "minConnections": 5,
        "connectionTimeout": 30000
      }
    },
    "cache": {
      "redis": {
        "ttl": 3600,
        "maxMemory": "1gb"
      }
    },
    "security": {
      "jwt": {
        "expiresIn": 3600,
        "refreshExpiresIn": 86400
      },
      "rateLimit": {
        "enabled": true,
        "maxRequests": 100,
        "windowMs": 60000
      }
    },
    "monitoring": {
      "metricsEnabled": true,
      "tracingEnabled": true,
      "logRetentionDays": 30
    }
  }
}
```

#### 15.1.2 更新系统配置
```
PUT /admin/config
Authorization: Bearer {token}
```

#### 15.1.3 重载配置
```
POST /admin/config/reload
Authorization: Bearer {token}
```

### 15.2 用户管理

#### 15.2.1 获取用户列表
```
GET /admin/users
Authorization: Bearer {token}
```

#### 15.2.2 创建用户
```
POST /admin/users
Authorization: Bearer {token}
```

**请求体**:
```json
{
  "username": "newuser",
  "email": "newuser@example.com",
  "password": "password123",
  "role": "user|admin|viewer",
  "profile": {
    "firstName": "张",
    "lastName": "三",
    "department": "技术部"
  },
  "permissions": {
    "agents": ["create", "read", "update", "delete"],
    "workflows": ["create", "read", "execute"]
  }
}
```

#### 15.2.3 更新用户
```
PUT /admin/users/{userId}
Authorization: Bearer {token}
```

#### 15.2.4 删除用户
```
DELETE /admin/users/{userId}
Authorization: Bearer {token}
```

#### 15.2.5 重置用户密码
```
POST /admin/users/{userId}/reset-password
Authorization: Bearer {token}
```

### 15.3 系统维护

#### 15.3.1 数据库维护
```
POST /admin/maintenance/database
Authorization: Bearer {token}
```

**请求体**:
```json
{
  "action": "vacuum|reindex|analyze|backup|restore",
  "options": {
    "tables": ["agents", "workflows"],
    "backupPath": "/backup/db_20240101.sql"
  }
}
```

#### 15.3.2 缓存管理
```
POST /admin/maintenance/cache
Authorization: Bearer {token}
```

**请求体**:
```json
{
  "action": "clear|flush|stats",
  "pattern": "user:*"
}
```

#### 15.3.3 日志清理
```
POST /admin/maintenance/logs
Authorization: Bearer {token}
```

**请求体**:
```json
{
  "action": "cleanup",
  "retentionDays": 30,
  "logTypes": ["application", "access", "error"]
}
```

### 15.4 系统信息

#### 15.4.1 获取系统信息
```
GET /admin/system/info
Authorization: Bearer {token}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "version": "2.0.0",
    "buildTime": "2024-01-01T00:00:00Z",
    "gitCommit": "abc123",
    "environment": "production",
    "uptime": 86400,
    "startTime": "2024-01-01T00:00:00Z",
    "runtime": {
      "platform": "linux",
      "architecture": "x64",
      "nodeVersion": "18.17.0",
      "memory": {
        "total": 16384,
        "used": 8192,
        "free": 8192
      }
    },
    "dependencies": {
      "database": "PostgreSQL 14.9",
      "cache": "Redis 7.0",
      "messageQueue": "RabbitMQ 3.12"
    }
  }
}
```

#### 15.4.2 获取系统统计
```
GET /admin/system/stats
Authorization: Bearer {token}
```

## 认证和权限

### 认证方式
本API使用JWT (JSON Web Token) 进行身份认证。

#### 获取访问令牌
```
POST /auth/login
Content-Type: application/json
```

**请求体**:
```json
{
  "username": "admin",
  "password": "password123"
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 3600,
    "tokenType": "Bearer",
    "user": {
      "id": "user_123",
      "username": "admin",
      "email": "admin@example.com",
      "role": "admin",
      "permissions": ["all"]
    }
  }
}
```

#### 刷新访问令牌
```
POST /auth/refresh
Content-Type: application/json
```

**请求体**:
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### 注销
```
POST /auth/logout
Authorization: Bearer {token}
```

#### 获取当前用户信息
```
GET /auth/me
Authorization: Bearer {token}
```

### 权限控制

#### 权限级别
- **admin**: 系统管理员，拥有所有权限
- **user**: 普通用户，可以创建和管理自己的Agent和工作流
- **viewer**: 只读用户，只能查看公开的资源

#### 资源权限
每个资源（Agent、工作流等）都有以下权限设置：
- **owner**: 资源所有者
- **editors**: 可编辑用户列表
- **viewers**: 可查看用户列表
- **isPublic**: 是否公开可见

#### 权限检查
```
GET /auth/permissions/check
Authorization: Bearer {token}
```

**查询参数**:
- `resource`: 资源类型 (agent/workflow/capability)
- `resourceId`: 资源ID
- `action`: 操作类型 (create/read/update/delete/execute)

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