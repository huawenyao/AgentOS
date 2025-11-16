# EFIAgent Phase 2 前端

企业级多智能体协作系统的前端界面，基于React + TypeScript + Ant Design构建。

## 🚀 快速开始

### 环境要求

- Node.js 16+
- npm 或 yarn

### 安装依赖

```bash
npm install
# 或
yarn install
```

### 开发服务器

```bash
# 使用npm
npm run dev

# 使用yarn
yarn dev

# 或者使用传统的start命令
npm start
```

前端开发服务器将在 http://localhost:3000 启动，并自动代理API请求到 http://localhost:8000。

### 构建生产版本

```bash
npm run build
# 或
yarn build
```

构建文件将输出到 `build/` 目录。

### 运行测试

```bash
npm test
# 或
yarn test
```

## 🔧 开发命令

### 使用Make命令（推荐）

```bash
# 启动前端开发服务器
make dev-frontend

# 查看所有可用命令
make help
```

### 直接使用npm/yarn

```bash
# 开发服务器
npm run dev
yarn dev

# 构建
npm run build
yarn build

# 测试
npm test
yarn test
```

## 📱 功能模块

- **仪表盘** - 系统概览和性能指标
- **智能体管理** - 智能体注册、配置和监控
- **记忆系统** - 三层记忆架构管理
- **任务监控** - 实时任务状态和进度跟踪
- **协作工作流** - 多智能体协作管理

## 🎨 技术栈

- **React 18** - UI框架
- **TypeScript** - 类型安全
- **Ant Design 5** - UI组件库
- **React Router 6** - 路由管理
- **Recharts** - 图表组件
- **Zustand** - 状态管理
- **Axios** - HTTP客户端

## 📦 项目结构

```
frontend/
├── public/           # 静态资源
├── src/
│   ├── components/   # 通用组件
│   ├── pages/        # 页面组件
│   ├── App.tsx       # 主应用组件
│   └── index.tsx     # 入口文件
├── package.json      # 依赖配置
└── tsconfig.json     # TypeScript配置
```

## 🔗 API代理

开发环境下，前端会自动代理 `/api` 请求到后端服务器 `http://localhost:8000`。

## 📈 性能指标

- 构建包大小: ~414KB (gzipped)
- 首屏加载时间: <2秒
- 交互响应时间: <100ms

## 🐛 故障排除

### 端口冲突

如果3000端口被占用，可以：

1. 停止占用进程：`lsof -ti:3000 | xargs kill`
2. 或使用不同端口：`PORT=3001 npm run dev`

### 依赖问题

```bash
# 清理并重新安装
rm -rf node_modules package-lock.json
npm install
```

### TypeScript错误

确保使用的是支持的TypeScript版本（4.9+），如需升级：

```bash
npm install typescript@latest
```