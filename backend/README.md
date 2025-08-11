# EFIAgent 后端系统

## 项目概述

EFIAgent是一个基于Node.js和Express框架的可视化开发平台后端服务，提供了完整的Agent管理、工作流引擎、实时数据处理、系统监控和分析洞察等功能。

## 技术栈

- **框架**: Express.js 4.18.2
- **数据库**: MySQL (通过Sequelize ORM)
- **缓存**: Redis 4.6.11
- **认证**: JWT (jsonwebtoken)
- **日志**: Winston 3.11.0
- **实时通信**: Socket.IO 4.7.4
- **参数验证**: Express-validator 7.0.1
- **安全**: Helmet, CORS, Rate Limiting

## 项目结构

```
src/
├── app.js                 # 应用主入口文件
├── controllers/           # 控制器层
│   ├── agentController.js
│   ├── analyticsController.js
│   ├── authController.js
│   ├── monitoringController.js
│   ├── realTimeDataController.js
│   ├── systemController.js
│   ├── systemManagementController.js
│   ├── userController.js
│   ├── workflowController.js
│   └── workflowEngineController.js
├── services/              # 服务层
│   ├── agentService.js
│   ├── analyticsService.js
│   ├── authService.js
│   ├── dataService.js
│   ├── monitoringService.js
│   ├── realTimeDataService.js
│   ├── systemManagementService.js
│   ├── userService.js
│   └── workflowEngineService.js
├── routes/                # 路由层
│   ├── index.js
│   ├── authRoutes.js
│   ├── agentRoutes.js
│   ├── monitoringRoutes.js
│   ├── realTimeData.js
│   ├── systemManagement.js
│   ├── userRoutes.js
│   ├── workflowEngine.js
│   └── workflowRoutes.js
├── middleware/            # 中间件
│   ├── auth.js
│   ├── adminAuth.js
│   ├── errorHandler.js
│   ├── rateLimit.js
│   └── validation.js
├── models/                # 数据模型
├── database/              # 数据库配置
├── utils/                 # 工具类
├── websocket/             # WebSocket处理
└── config/                # 配置文件
```

## 核心功能模块

### 1. 认证与授权系统
- JWT令牌认证
- 基于角色的权限控制 (RBAC)
- 管理员权限验证
- 用户状态管理

### 2. Agent管理系统
- Agent模板管理
- Agent配置管理
- Agent实例管理
- Agent状态监控

### 3. 工作流引擎
- 工作流定义管理
- 工作流执行引擎
- 能力模块管理
- 执行状态跟踪
- 工作流监控

### 4. 实时数据流服务
- 数据流注册与管理
- 实时数据查询
- 数据流分析
- 订阅管理
- 异常检测

### 5. 系统监控
- 系统性能监控
- 应用监控
- 业务监控
- 告警管理
- 日志管理

### 6. 分析洞察
- 性能分析
- 使用分析
- 趋势分析
- 实时分析
- 报告生成

### 7. 系统管理
- 系统配置管理
- 用户管理
- 系统维护
- 系统信息查询
- 日志管理

## API接口

### 认证相关
- `POST /api/v1/auth/login` - 用户登录
- `POST /api/v1/auth/logout` - 用户登出
- `POST /api/v1/auth/refresh` - 刷新令牌

### Agent管理
- `GET /api/v1/agents` - 获取Agent列表
- `POST /api/v1/agents` - 创建Agent
- `PUT /api/v1/agents/:id` - 更新Agent
- `DELETE /api/v1/agents/:id` - 删除Agent

### 工作流引擎
- `GET /api/v1/workflow-engine/definitions` - 获取工作流定义
- `POST /api/v1/workflow-engine/definitions` - 创建工作流定义
- `POST /api/v1/workflow-engine/executions` - 执行工作流
- `GET /api/v1/workflow-engine/executions` - 获取执行列表

### 实时数据
- `GET /api/v1/realtime-data/streams` - 获取数据流列表
- `POST /api/v1/realtime-data/streams` - 注册数据流
- `GET /api/v1/realtime-data/data` - 获取实时数据
- `POST /api/v1/realtime-data/subscribe` - 订阅数据流

### 系统监控
- `GET /api/v1/monitoring/metrics` - 获取系统指标
- `GET /api/v1/monitoring/alerts` - 获取告警信息
- `GET /api/v1/monitoring/logs` - 获取系统日志

### 系统管理
- `GET /api/v1/system-management/config` - 获取系统配置
- `PUT /api/v1/system-management/config` - 更新系统配置
- `GET /api/v1/system-management/users` - 获取用户列表
- `POST /api/v1/system-management/users` - 创建用户

## 中间件

### 认证中间件
- `auth.js` - JWT令牌验证
- `adminAuth.js` - 管理员权限验证

### 安全中间件
- Helmet - 安全头设置
- CORS - 跨域资源共享
- Rate Limiting - 请求频率限制

### 验证中间件
- Express-validator - 参数验证
- 自定义验证规则

## 数据库设计

项目使用MySQL数据库，通过Sequelize ORM进行数据访问。主要数据表包括：

- `users` - 用户表
- `agents` - Agent表
- `workflows` - 工作流表
- `executions` - 执行记录表
- `data_streams` - 数据流表
- `system_configs` - 系统配置表
- `logs` - 日志表

## 缓存策略

使用Redis进行数据缓存，提高系统性能：

- 用户会话缓存
- API响应缓存
- 实时数据缓存
- 分析结果缓存

## WebSocket实时通信

支持实时数据推送和双向通信：

- 实时监控数据推送
- 工作流执行状态更新
- 系统告警通知
- 用户在线状态管理

## 日志系统

使用Winston进行日志管理：

- 分级日志记录
- 日志文件轮转
- 错误日志追踪
- 操作审计日志

## 错误处理

统一的错误处理机制：

- 全局错误捕获
- 错误分类处理
- 错误日志记录
- 友好错误响应

## 部署说明

### 环境要求
- Node.js >= 16.0.0
- MySQL >= 8.0
- Redis >= 6.0

### 安装依赖
```bash
npm install
```

### 环境配置
创建 `.env` 文件并配置以下环境变量：
```
NODE_ENV=production
PORT=8080
DB_HOST=localhost
DB_PORT=3306
DB_NAME=efiagent
DB_USER=root
DB_PASSWORD=password
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your_jwt_secret
CORS_ORIGIN=http://localhost:3000
```

### 数据库迁移
```bash
npm run migrate
```

### 启动服务
```bash
# 开发环境
npm run dev

# 生产环境
npm start
```

## 监控与维护

### 健康检查
访问 `GET /health` 端点检查服务状态

### 日志查看
日志文件位于 `logs/` 目录下

### 性能监控
通过监控接口获取系统性能指标

## 开发指南

### 代码规范
- 使用ESLint进行代码检查
- 遵循JavaScript Standard Style
- 编写单元测试

### 测试
```bash
# 运行测试
npm test

# 监听模式
npm run test:watch
```

### 代码检查
```bash
# 检查代码
npm run lint

# 自动修复
npm run lint:fix
```

## 版本信息

当前版本：1.0.0

## 许可证

MIT License

## 联系方式

EFIAgent Team