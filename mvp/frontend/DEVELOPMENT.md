# EFIAgent 前端开发指南

本文档提供EFIAgent前端应用的各种开发启动方式。

## 🚀 启动开发服务器

### 方式1：使用npm（推荐）

```bash
# 进入前端目录
cd frontend

# 启动开发服务器
npm run dev
```

### 方式2：使用yarn

```bash
# 进入前端目录
cd frontend

# 启动开发服务器
yarn dev
```

### 方式3：使用传统npm命令

```bash
# 进入前端目录
cd frontend

# 启动开发服务器
npm start
```

### 方式4：使用Make命令（Linux/macOS）

```bash
# 在项目根目录
make dev-frontend
```

## 🌐 访问地址

开发服务器启动后，可通过以下地址访问：

- **前端应用**: http://localhost:3000
- **API代理**: http://localhost:3000/api/* → http://localhost:8000/*

## 📋 可用脚本

### package.json中的所有脚本：

```json
{
  "scripts": {
    "start": "react-scripts start",    // 启动开发服务器
    "dev": "react-scripts start",      // 启动开发服务器（别名）
    "build": "react-scripts build",    // 构建生产版本
    "test": "react-scripts test",      // 运行测试
    "eject": "react-scripts eject"     // 弹出配置（不可逆）
  }
}
```

## 🔧 开发环境特性

### 热重载
- 代码修改时自动刷新页面
- 组件状态在热重载时保持
- CSS样式即时更新

### API代理
- 前端开发服务器自动代理API请求
- 无需配置CORS
- 支持WebSocket代理

### 错误提示
- 浏览器中显示编译错误
- 控制台输出详细错误信息
- 源码映射便于调试

## 🛠️ 开发工具

### VS Code推荐插件

1. **ES7+ React/Redux/React-Native snippets** - React代码片段
2. **TypeScript Importer** - 自动导入TypeScript类型
3. **Prettier - Code formatter** - 代码格式化
4. **ESLint** - 代码质量检查
5. **Auto Rename Tag** - 自动重命名配对标签

### 浏览器开发工具

1. **React Developer Tools** - React组件调试
2. **Redux DevTools** - 状态管理调试（如使用Redux）
3. **Network面板** - API请求监控

## 📁 项目结构说明

```
frontend/
├── public/              # 静态资源
│   ├── index.html      # HTML模板
│   ├── manifest.json   # PWA配置
│   └── robots.txt      # 爬虫配置
├── src/
│   ├── components/     # 可复用组件
│   │   └── Layout.tsx  # 布局组件
│   ├── pages/          # 页面组件
│   │   ├── Dashboard.tsx      # 仪表盘
│   │   ├── AgentManagement.tsx # 智能体管理
│   │   ├── MemorySystem.tsx    # 记忆系统
│   │   ├── TaskMonitor.tsx     # 任务监控
│   │   └── Collaboration.tsx   # 协作工作流
│   ├── App.tsx         # 主应用组件
│   ├── App.css         # 应用样式
│   ├── index.tsx       # 应用入口
│   └── ...             # 其他文件
├── package.json        # 项目配置
├── tsconfig.json       # TypeScript配置
└── README.md          # 项目说明
```

## 🎨 样式指南

### CSS-in-JS
- 使用内联样式进行动态样式
- 使用CSS Modules进行组件样式隔离
- 遵循Ant Design的设计规范

### 主题定制
```typescript
// 在App.tsx中定制主题
const theme = {
  token: {
    colorPrimary: '#1890ff',
    borderRadius: 6,
  },
};
```

## 🔗 路由配置

### 页面路由
- `/` - 仪表盘（默认）
- `/dashboard` - 仪表盘
- `/agents` - 智能体管理
- `/memory` - 记忆系统
- `/tasks` - 任务监控
- `/collaboration` - 协作工作流

### 路由导航
```typescript
// 使用React Router导航
import { useNavigate } from 'react-router-dom';

const navigate = useNavigate();
navigate('/agents');
```

## 📊 状态管理

### 使用Zustand进行状态管理
```typescript
// 创建store
import { create } from 'zustand';

interface AppState {
  user: User | null;
  setUser: (user: User) => void;
}

const useAppStore = create<AppState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
}));
```

## 🚨 常见问题

### Q: 端口被占用怎么办？
A: 可以指定其他端口：
```bash
PORT=3001 npm run dev
```

### Q: API请求失败？
A: 确保后端服务在8000端口运行，或修改package.json中的proxy配置。

### Q: 热重载不工作？
A: 检查文件保存和端口占用，重启开发服务器。

### Q: TypeScript编译错误？
A: 运行`npm install`确保依赖完整，检查tsconfig.json配置。

## 📝 开发建议

1. **组件开发**：先实现功能，再优化样式
2. **状态管理**：保持状态扁平化，避免深层嵌套
3. **错误处理**：使用try-catch包装异步操作
4. **性能优化**：使用React.memo和useMemo优化渲染
5. **代码规范**：遵循ESLint和Prettier配置

## 🔄 部署流程

1. **本地测试**：`npm run build`确保构建成功
2. **环境变量**：配置生产环境变量
3. **构建部署**：将build目录部署到服务器
4. **验证功能**：测试所有页面和API功能