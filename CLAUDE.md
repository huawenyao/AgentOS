# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

EFIAgent是一个企业级多智能体协作系统，采用分层联邦架构设计，实现了动态分工、认知协同、弹性扩展、安全可控的智能体协作框架。

## 开发命令

### Python后端开发
```bash
# 安装依赖
pip install -r requirements.txt

# 开发模式安装
pip install -e .

# 启动CLI工具
efiagent start

# 运行测试
pytest

# 代码检查
efiagent lint
```

### React前端开发 (agent_designer_ui)
```bash
# 进入前端目录
cd examples/agent_designer_ui

# 安装依赖
npm install

# 启动开发服务器
npm start

# 构建生产版本
npm run build

# 运行测试
npm test
```

### 后端API服务 (Node.js)
```bash
# 进入后端目录
cd backend

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 启动生产服务器
npm start

# 数据库迁移
npm run migrate

# 填充测试数据
npm run seed
```

## 核心架构

### 分层联邦架构
- **协调层**：元调度中心、动态角色引擎、进化控制器
- **认知层**：规划Agent、执行Agent组、审核Agent组
- **数据层**：分布式记忆体、知识图谱、规则库

### 核心模块结构

#### 智能体框架 (`efiagent/agent/`)
- **BaseAgent**: 所有智能体的基类，定义统一接口
- **PlanningAgent**: 规划智能体，负责任务分解
- **ExecutionAgent**: 执行智能体，负责原子任务处理
- **AuditAgent**: 审核智能体，负责结果校验
- **MemoryAgent**: 记忆智能体，负责知识管理

#### 核心组件 (`efiagent/core/`)
- **Ontology**: 业务本体管理，定义实体和关系
- **ContextCollector**: 上下文收集器，整合业务资产
- **ToolRegistry**: 工具注册中心，管理API和能力
- **TaskDAG**: 任务有向无环图，管理任务依赖
- **ResourceScheduler**: 资源调度器，动态分配资源

#### 规划器 (`efiagent/planner/`)
- **TaskPlanner**: 任务规划器，将复杂任务分解为子任务
- **InteractivePlanner**: 交互式规划器，支持用户澄清
- **DAGPlanner**: 基于DAG的规划器，管理任务依赖

#### 安全框架 (`efiagent/security/`)
- **ZeroTrust**: 零信任安全架构
- **Sandbox**: 执行沙箱，隔离运行环境
- **SecurityManager**: 安全管理器，权限控制

### 技术栈

#### 后端技术
- **Python 3.9+**: 主要开发语言
- **FastAPI**: 现代Web框架
- **Pydantic**: 数据验证和序列化
- **LangChain**: LLM应用框架
- **OpenAI API**: 大语言模型接口

#### 数据存储
- **Neo4j**: 图数据库（知识存储）
- **Redis**: 缓存和消息队列
- **MongoDB**: 文档存储
- **FAISS/Chroma**: 向量数据库

#### 通信与协调
- **gRPC**: 高性能RPC通信
- **Protobuf**: 序列化协议
- **RabbitMQ**: 消息中间件
- **Socket.IO**: 实时通信

#### 前端技术
- **React + TypeScript**: 可视化开发界面
- **Ant Design**: UI组件库
- **Node.js**: 运行环境

## 重要设计模式

### AI驱动的智能体架构
- **意图理解**: 将用户自然语言转化为结构化意图
- **上下文感知**: 构建"超级上下文"整合业务知识
- **智能规划**: 基于DAG的任务分解和依赖管理
- **安全执行**: 零信任架构下的可控执行
- **反馈学习**: 结果评估和持续优化

### 动态角色分配
- 基于实时负载与能力画像动态重组分工
- 技能向量匹配实现精准任务分配
- 混合通信拓扑优化协作效率

### 多层记忆架构
- **工作记忆**: 当前任务上下文（共享内存）
- **短期记忆**: 任务链状态快照（etcd）
- **长期记忆**: 领域知识/历史决策（Neo4j）

## 开发指南

### 创建新智能体
1. 继承`BaseAgent`类
2. 实现`_act_impl()`方法
3. 定义能力参数和技能向量
4. 注册到智能体池

### 添加新工具
1. 在`ToolRegistry`中注册
2. 定义工具规范（ToolSpec）
3. 实现工具逻辑
4. 配置安全约束

### 设计工作流
1. 使用DAGPlanner定义任务依赖
2. 配置智能体间的通信协议
3. 设置错误处理和重试机制
4. 实现结果验证和反馈

## 配置文件

### 主配置文件 (`config_example.json`)
系统主要配置包括API端口、工作线程数、智能体模型参数等。

### 智能体配置
每个智能体都有独立的配置，包括模型参数、能力定义、资源限制等。

## 前端开发注意事项

### Agent Designer UI
- 位于 `examples/agent_designer_ui/` 目录
- 使用React + TypeScript开发
- 提供智能体设计和工作流可视化界面
- 支持拖拽式工作流编辑

### Mock数据
- 前端mock数据位于 `src/data/mockData.ts`
- 包含智能体模板、工作流模板等示例数据
- 开发时可用于测试前端功能

## 测试与质量保证

### 测试策略
- **单元测试**: 覆盖核心逻辑组件
- **集成测试**: 验证智能体间协作
- **性能测试**: 确保系统稳定性
- **安全测试**: 验证零信任架构

### 代码质量
- 使用Pydantic进行数据验证
- 统一的错误处理机制
- 完整的日志记录系统
- 模块化的组件设计

## 部署说明

### 分层部署方案
- **边缘层**: ARM芯片+8GB内存（执行Agent/轻量审核）
- **协调层**: CPU 16核+64GB内存（规划Agent/调度中心）
- **云端**: GPU V100×4（训练/进化模块）

### 性能目标
- **任务完成率**: ≥98%（千级节点并发）
- **任务响应延迟**: <300ms（边缘实时控制）
- **系统容错率**: 99.5%（单节点故障模拟）
- **资源利用率提升**: 40%（动态负载调度）

## 安全特性

### 零信任架构
- 所有操作经过动态权限校验
- 决策签名上链（私有链Hyperledger Fabric）
- 实时审计异常行为检测
- 差分隐私保护（ε=0.3）

## 扩展性

### 异构集成框架
- 强制实现核心接口（IMessageBus、ITaskScheduler）
- WebAssembly隔离执行环境
- 支持多语言Agent混部

## 常见问题

### 开发环境设置
1. 确保Python 3.9+和Node.js已安装
2. 安装后端Python依赖：`pip install -r requirements.txt`
3. 安装前端依赖：`cd examples/agent_designer_ui && npm install`
4. 配置OpenAI API密钥等环境变量

### 调试技巧
- 使用`efiagent lint`进行代码检查
- 查看日志文件了解系统运行状态
- 使用前端开发者工具调试UI界面
- 通过API文档测试后端接口