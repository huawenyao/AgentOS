# EFIAgent知识地图 - API接口规范

## 1. API概览

### 1.1 基本信息

- **API版本**: v1
- **基础URL**: `https://api.efiagent.com/v1`
- **认证方式**: JWT Bearer Token
- **数据格式**: JSON
- **字符编码**: UTF-8

### 1.2 通用响应格式

```json
{
  "code": 200,
  "message": "success",
  "data": {},
  "timestamp": "2024-01-20T10:30:00Z",
  "request_id": "req_123456789"
}
```

### 1.3 错误响应格式

```json
{
  "code": 400,
  "message": "请求参数错误",
  "error": {
    "type": "ValidationError",
    "details": [
      {
        "field": "entity_name",
        "message": "实体名称不能为空"
      }
    ]
  },
  "timestamp": "2024-01-20T10:30:00Z",
  "request_id": "req_123456789"
}
```

### 1.4 状态码说明

| 状态码 | 说明 |
|--------|------|
| 200 | 请求成功 |
| 201 | 资源创建成功 |
| 400 | 请求参数错误 |
| 401 | 未授权访问 |
| 403 | 权限不足 |
| 404 | 资源不存在 |
| 409 | 资源冲突 |
| 422 | 数据验证失败 |
| 429 | 请求频率限制 |
| 500 | 服务器内部错误 |

## 2. 认证与授权

### 2.1 用户认证

#### 用户登录

```http
POST /auth/login
Content-Type: application/json

{
  "username": "user@example.com",
  "password": "password123"
}
```

**响应示例:**
```json
{
  "code": 200,
  "message": "登录成功",
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_in": 3600,
    "user": {
      "id": "user_001",
      "username": "user@example.com",
      "display_name": "张三",
      "role": "analyst",
      "avatar": "https://example.com/avatar.jpg"
    }
  }
}
```

#### 刷新Token

```http
POST /auth/refresh
Content-Type: application/json
Authorization: Bearer <refresh_token>

{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 2.2 权限管理

#### 获取用户权限

```http
GET /auth/permissions
Authorization: Bearer <access_token>
```

**响应示例:**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "permissions": [
      "entity:read",
      "entity:create",
      "entity:update",
      "relationship:read",
      "relationship:create",
      "search:execute",
      "analysis:run"
    ],
    "roles": ["business_analyst", "editor"]
  }
}
```

## 3. 知识地图API

### 3.1 实体管理

#### 获取实体详情

```http
GET /entities/{entity_id}
Authorization: Bearer <access_token>
```

**查询参数:**
- `include_relationships` (boolean, optional): 是否包含关系信息，默认false
- `depth` (integer, optional): 关系深度，默认1

**响应示例:**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": "entity_001",
    "name": "销售订单",
    "type": "business_process",
    "category": "核心业务",
    "description": "客户购买产品的完整业务流程",
    "attributes": {
      "process_time": "2-3天",
      "departments": ["销售部", "财务部"],
      "key_metrics": ["订单量", "转化率", "平均金额"]
    },
    "metadata": {
      "created_by": "user_001",
      "created_at": "2024-01-15T10:30:00Z",
      "updated_by": "user_002",
      "updated_at": "2024-01-20T14:25:00Z",
      "version": "1.2"
    },
    "tags": ["核心流程", "B2B", "在线"],
    "relationships": {
      "incoming": [
        {
          "id": "rel_001",
          "source": "客户信息",
          "type": "depends_on",
          "strength": 0.9
        }
      ],
      "outgoing": [
        {
          "id": "rel_002",
          "target": "库存管理",
          "type": "triggers",
          "strength": 0.85
        }
      ]
    }
  }
}
```

#### 创建实体

```http
POST /entities
Content-Type: application/json
Authorization: Bearer <access_token>

{
  "name": "新业务流程",
  "type": "business_process",
  "category": "支持业务",
  "description": "业务流程描述",
  "attributes": {
    "process_time": "1-2天",
    "departments": ["运营部"]
  },
  "tags": ["新流程"]
}
```

**响应示例:**
```json
{
  "code": 201,
  "message": "实体创建成功",
  "data": {
    "id": "entity_123",
    "name": "新业务流程",
    "type": "business_process",
    "created_at": "2024-01-20T10:30:00Z",
    "version": "1.0"
  }
}
```

#### 更新实体

```http
PUT /entities/{entity_id}
Content-Type: application/json
Authorization: Bearer <access_token>

{
  "name": "更新后的业务流程",
  "description": "更新后的描述",
  "attributes": {
    "process_time": "2-3天",
    "new_field": "新值"
  },
  "version": "1.1"
}
```

#### 删除实体

```http
DELETE /entities/{entity_id}
Authorization: Bearer <access_token>
```

**响应示例:**
```json
{
  "code": 200,
  "message": "实体删除成功"
}
```

### 3.2 关系管理

#### 创建关系

```http
POST /relationships
Content-Type: application/json
Authorization: Bearer <access_token>

{
  "source_id": "entity_001",
  "target_id": "entity_002",
  "type": "depends_on",
  "strength": 0.8,
  "description": "源实体依赖目标实体",
  "attributes": {
    "dependency_type": "functional",
    "criticality": "high"
  }
}
```

**响应示例:**
```json
{
  "code": 201,
  "message": "关系创建成功",
  "data": {
    "id": "rel_123",
    "source_id": "entity_001",
    "target_id": "entity_002",
    "type": "depends_on",
    "strength": 0.8,
    "created_at": "2024-01-20T10:30:00Z"
  }
}
```

#### 更新关系

```http
PUT /relationships/{relationship_id}
Content-Type: application/json
Authorization: Bearer <access_token>

{
  "strength": 0.9,
  "description": "更新后的关系描述",
  "attributes": {
    "dependency_type": "technical",
    "criticality": "critical"
  }
}
```

#### 删除关系

```http
DELETE /relationships/{relationship_id}
Authorization: Bearer <access_token>
```

### 3.3 知识地图数据

#### 获取地图数据

```http
GET /knowledge-map
Authorization: Bearer <access_token>
```

**查询参数:**
- `center_node` (string, optional): 中心节点ID
- `depth` (integer, optional): 搜索深度，默认2
- `node_types` (array, optional): 节点类型过滤
- `relationship_types` (array, optional): 关系类型过滤
- `layout` (string, optional): 布局算法，默认"force"

**响应示例:**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "nodes": [
      {
        "id": "entity_001",
        "name": "销售订单",
        "type": "business_process",
        "x": 400,
        "y": 300,
        "size": 30,
        "color": "#1890ff",
        "attributes": {}
      },
      {
        "id": "entity_002",
        "name": "库存管理",
        "type": "it_system",
        "x": 200,
        "y": 200,
        "size": 25,
        "color": "#52c41a",
        "attributes": {}
      }
    ],
    "edges": [
      {
        "id": "rel_001",
        "source": "entity_001",
        "target": "entity_002",
        "type": "depends_on",
        "strength": 0.85,
        "width": 3,
        "color": "#faad14"
      }
    ],
    "metadata": {
      "total_nodes": 2,
      "total_edges": 1,
      "layout": "force_directed",
      "generated_at": "2024-01-20T10:30:00Z"
    }
  }
}
```

#### 获取地图快照

```http
POST /knowledge-map/snapshot
Content-Type: application/json
Authorization: Bearer <access_token>

{
  "name": "销售流程视图",
  "description": "销售相关业务流程快照",
  "center_node": "entity_001",
  "depth": 3,
  "filters": {
    "node_types": ["business_process", "it_system"],
    "relationship_types": ["depends_on", "triggers"]
  }
}
```

## 4. 智能搜索API

### 4.1 实体搜索

#### 搜索实体

```http
GET /search/entities
Authorization: Bearer <access_token>
```

**查询参数:**
- `q` (string, required): 搜索关键词
- `type` (string, optional): 实体类型过滤
- `category` (string, optional): 分类过滤
- `limit` (integer, optional): 返回数量限制，默认20
- `offset` (integer, optional): 偏移量，默认0
- `sort` (string, optional): 排序方式，默认"relevance"

**响应示例:**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "results": [
      {
        "entity": {
          "id": "entity_001",
          "name": "销售订单",
          "type": "business_process",
          "description": "客户购买产品的完整业务流程"
        },
        "relevance_score": 0.95,
        "highlight": {
          "name": ["<em>销售</em>订单"],
          "description": ["客户购买产品的完整业务流程"]
        },
        "match_type": "exact"
      }
    ],
    "total": 1,
    "took": 15,
    "suggestions": ["销售流程", "订单管理", "客户订单"]
  }
}
```

#### 搜索建议

```http
GET /search/suggestions
Authorization: Bearer <access_token>
```

**查询参数:**
- `q` (string, required): 输入关键词
- `limit` (integer, optional): 建议数量，默认10

**响应示例:**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "suggestions": [
      {
        "text": "销售订单",
        "type": "entity",
        "score": 0.9
      },
      {
        "text": "销售流程",
        "type": "entity",
        "score": 0.8
      },
      {
        "text": "订单管理系统",
        "type": "entity",
        "score": 0.7
      }
    ]
  }
}
```

### 4.2 智能问答

#### 提交问题

```http
POST /qa/ask
Content-Type: application/json
Authorization: Bearer <access_token>

{
  "question": "销售订单处理涉及哪些系统？",
  "context": {
    "domain": "sales",
    "time_range": "2024-01"
  },
  "options": {
    "include_visualization": true,
    "max_depth": 3
  }
}
```

**响应示例:**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "answer": {
      "text": "销售订单处理主要涉及以下3个系统：\n\n1. **订单管理系统(OMS)** - 核心系统，负责订单创建和状态跟踪\n2. **库存管理系统(WMS)** - 依赖系统，负责库存检查和预留\n3. **支付系统(Payment)** - 集成系统，负责支付处理",
      "confidence": 0.92,
      "answer_type": "factual",
      "sources": [
        {
          "entity_id": "entity_001",
          "name": "销售订单",
          "relevance": 0.95
        }
      ]
    },
    "visualizations": [
      {
        "type": "flow_diagram",
        "data": {
          "nodes": [
            {"id": "oms", "name": "订单管理系统"},
            {"id": "wms", "name": "库存管理系统"},
            {"id": "payment", "name": "支付系统"}
          ],
          "edges": [
            {"from": "oms", "to": "wms", "label": "检查库存"},
            {"from": "oms", "to": "payment", "label": "处理支付"}
          ]
        }
      }
    ],
    "related_questions": [
      "库存管理系统如何与订单系统集成？",
      "支付失败的处理流程是什么？",
      "订单状态变更的规则有哪些？"
    ]
  }
}
```

#### 问答历史

```http
GET /qa/history
Authorization: Bearer <access_token>
```

**查询参数:**
- `limit` (integer, optional): 返回数量，默认20
- `offset` (integer, optional): 偏移量，默认0

**响应示例:**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "questions": [
      {
        "id": "qa_001",
        "question": "销售订单处理涉及哪些系统？",
        "answer_preview": "销售订单处理主要涉及订单管理系统、库存管理系统...",
        "asked_at": "2024-01-20T10:30:00Z",
        "helpful": true
      }
    ],
    "total": 1
  }
}
```

## 5. 关系分析API

### 5.1 路径分析

#### 查找路径

```http
POST /analysis/paths
Content-Type: application/json
Authorization: Bearer <access_token>

{
  "source": "entity_001",
  "target": "entity_002",
  "max_depth": 5,
  "path_type": "shortest"
}
```

**响应示例:**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "paths": [
      {
        "id": "path_001",
        "nodes": ["entity_001", "entity_003", "entity_002"],
        "relationships": ["rel_001", "rel_002"],
        "length": 2,
        "weight": 0.85,
        "path_type": "shortest"
      }
    ],
    "total_paths": 1,
    "analysis_time": 45
  }
}
```

#### 影响分析

```http
POST /analysis/impact
Content-Type: application/json
Authorization: Bearer <access_token>

{
  "entity_id": "entity_001",
  "impact_type": "both",
  "max_depth": 3,
  "include_indirect": true
}
```

**响应示例:**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "impact_summary": {
      "direct_affected": 5,
      "indirect_affected": 12,
      "total_affected": 17,
      "risk_level": "medium"
    },
    "affected_entities": [
      {
        "entity_id": "entity_002",
        "entity_name": "库存管理",
        "impact_type": "direct",
        "impact_strength": 0.9,
        "impact_description": "销售订单状态变更会影响库存分配"
      }
    ],
    "recommendations": [
      "建议在修改销售订单前评估库存影响",
      "考虑设置库存预警机制"
    ]
  }
}
```

### 5.2 关联度分析

#### 计算关联度

```http
POST /analysis/correlation
Content-Type: application/json
Authorization: Bearer <access_token>

{
  "entities": ["entity_001", "entity_002", "entity_003"],
  "analysis_types": ["structural", "semantic", "temporal"],
  "time_range": {
    "start": "2024-01-01",
    "end": "2024-01-31"
  }
}
```

**响应示例:**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "correlation_matrix": [
      [1.0, 0.85, 0.42],
      [0.85, 1.0, 0.38],
      [0.42, 0.38, 1.0]
    ],
    "entity_pairs": [
      {
        "entity_a": "entity_001",
        "entity_b": "entity_002",
        "correlation_score": 0.85,
        "correlation_types": {
          "structural": 0.9,
          "semantic": 0.8,
          "temporal": 0.85
        },
        "explanation": "两个实体在结构、语义和时间维度上都表现出强关联"
      }
    ]
  }
}
```

## 6. 协作管理API

### 6.1 编辑权限

#### 获取编辑权限

```http
GET /collaboration/permissions/{entity_id}
Authorization: Bearer <access_token>
```

**响应示例:**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "entity_id": "entity_001",
    "user_permissions": {
      "can_read": true,
      "can_edit": true,
      "can_delete": false,
      "can_share": true,
      "can_manage_permissions": false
    },
    "collaborators": [
      {
        "user_id": "user_002",
        "display_name": "李四",
        "role": "editor",
        "joined_at": "2024-01-15T10:30:00Z"
      }
    ]
  }
}
```

#### 添加协作者

```http
POST /collaboration/collaborators
Content-Type: application/json
Authorization: Bearer <access_token>

{
  "entity_id": "entity_001",
  "user_emails": ["user2@example.com", "user3@example.com"],
  "role": "editor",
  "message": "邀请您参与知识库协作编辑"
}
```

### 6.2 实时协作

#### WebSocket连接

```
wss://api.efiagent.com/v1/collaboration/ws?entity_id={entity_id}&token={jwt_token}
```

**消息格式:**

**加入编辑:**
```json
{
  "type": "join",
  "data": {
    "user_id": "user_001",
    "entity_id": "entity_001"
  }
}
```

**编辑事件:**
```json
{
  "type": "edit",
  "data": {
    "operation": "update",
    "field": "description",
    "old_value": "旧描述",
    "new_value": "新描述",
    "timestamp": "2024-01-20T10:30:00Z"
  }
}
```

**光标位置:**
```json
{
  "type": "cursor",
  "data": {
    "user_id": "user_001",
    "position": 150,
    "selection": {
      "start": 150,
      "end": 160
    }
  }
}
```

### 6.3 版本管理

#### 获取版本历史

```http
GET /collaboration/versions/{entity_id}
Authorization: Bearer <access_token>
```

**查询参数:**
- `limit` (integer, optional): 返回数量，默认20
- `offset` (integer, optional): 偏移量，默认0

**响应示例:**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "versions": [
      {
        "version": "1.3",
        "created_by": "user_002",
        "created_at": "2024-01-20T14:25:00Z",
        "changes": [
          {
            "field": "description",
            "type": "update",
            "summary": "更新了业务流程描述"
          }
        ],
        "comment": "增加了处理时间信息"
      }
    ],
    "total": 5
  }
}
```

#### 恢复版本

```http
POST /collaboration/versions/{entity_id}/restore
Content-Type: application/json
Authorization: Bearer <access_token>

{
  "version": "1.2",
  "reason": "恢复到稳定版本"
}
```

## 7. 文件上传API

### 7.1 上传文档

```http
POST /files/upload
Content-Type: multipart/form-data
Authorization: Bearer <access_token>

file: [binary file data]
entity_id: entity_001
file_type: documentation
description: 业务流程文档
```

**响应示例:**
```json
{
  "code": 201,
  "message": "文件上传成功",
  "data": {
    "file_id": "file_001",
    "filename": "sales_process.pdf",
    "size": 2048576,
    "url": "https://cdn.example.com/files/file_001",
    "uploaded_at": "2024-01-20T10:30:00Z"
  }
}
```

### 7.2 下载文件

```http
GET /files/{file_id}
Authorization: Bearer <access_token>
```

## 8. 系统配置API

### 8.1 用户设置

#### 获取用户设置

```http
GET /users/settings
Authorization: Bearer <access_token>
```

**响应示例:**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "preferences": {
      "language": "zh-CN",
      "theme": "light",
      "default_view": "graph",
      "auto_save": true
    },
    "notifications": {
      "email_notifications": true,
      "web_notifications": true,
      "collaboration_alerts": true
    }
  }
}
```

#### 更新用户设置

```http
PUT /users/settings
Content-Type: application/json
Authorization: Bearer <access_token>

{
  "preferences": {
    "language": "en-US",
    "theme": "dark"
  },
  "notifications": {
    "email_notifications": false
  }
}
```

### 8.2 系统状态

#### 获取系统状态

```http
GET /system/health
Authorization: Bearer <access_token>
```

**响应示例:**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "status": "healthy",
    "services": {
      "api": "healthy",
      "database": "healthy",
      "redis": "healthy",
      "elasticsearch": "healthy"
    },
    "metrics": {
      "response_time_ms": 45,
      "active_connections": 156,
      "cpu_usage": 0.25,
      "memory_usage": 0.68
    },
    "version": "1.2.0",
    "uptime": 86400
  }
}
```

## 9. API使用示例

### 9.1 完整的知识地图探索流程

```javascript
// 1. 用户登录
const loginResponse = await fetch('/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    username: 'user@example.com',
    password: 'password123'
  })
});

const { access_token } = loginResponse.data;

// 2. 获取知识地图数据
const mapResponse = await fetch('/knowledge-map?center_node=entity_001&depth=2', {
  headers: {
    'Authorization': `Bearer ${access_token}`
  }
});

const { nodes, edges } = mapResponse.data;

// 3. 搜索相关实体
const searchResponse = await fetch('/search/entities?q=销售订单&limit=10', {
  headers: {
    'Authorization': `Bearer ${access_token}`
  }
});

// 4. 智能问答
const qaResponse = await fetch('/qa/ask', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${access_token}`
  },
  body: JSON.stringify({
    question: '销售订单处理涉及哪些系统？',
    options: {
      include_visualization: true
    }
  })
});
```

### 9.2 错误处理示例

```javascript
try {
  const response = await fetch('/entities/nonexistent', {
    headers: {
      'Authorization': `Bearer ${access_token}`
    }
  });

  if (!response.ok) {
    const error = await response.json();

    switch (response.status) {
      case 401:
        // 重新登录
        await refreshToken();
        break;
      case 403:
        // 权限不足提示
        showPermissionError(error.message);
        break;
      case 404:
        // 资源不存在
        showNotFoundError();
        break;
      default:
        // 通用错误处理
        showGenericError(error.message);
    }
  }
} catch (error) {
  // 网络错误或其他异常
  showNetworkError(error.message);
}
```

这个API接口规范为EFIAgent知识地图提供了完整、标准的接口定义，确保前后端开发团队能够高效协作，同时为第三方集成提供了清晰的接口文档。