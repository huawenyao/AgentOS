# Agentic Work Studio — 体系化产品方案与技术方案

---

## 第一部分：产品方案

### 1. 产品定位

**一句话定义**：Agentic Work Studio 是一个让企业业务人员能够设计、测试、部署和运营 AI Agent 工作流的生产力平台。

**核心差异化**：不卖"AI技术"，卖"AI生产力"。

```
市面产品：给你一堆AI零件，自己组装
  LangChain —— 面向开发者的代码库
  Dify —— 面向应用开发的Prompt IDE
  Coze —— 面向C端的Bot搭建

Agentic Work Studio：给你一个AI工厂，直接生产
  面向企业业务团队
  从"业务问题"出发而非"技术能力"出发
  端到端闭环：接入数据 → 设计Agent → 编排流程 → 部署运营 → 度量优化
```

### 2. 目标用户与使用场景

| 用户角色 | 核心诉求 | 产品内使用场景 |
|---------|---------|--------------|
| **业务负责人** | 用AI降本增效，要看到ROI | 查看Dashboard：任务完成率、节省工时、API成本 |
| **业务分析师** | 把重复性分析工作交给AI | 设计"数据分析Agent"，配置数据源和分析模板 |
| **IT/运维工程师** | 接入企业系统，保障稳定运行 | 连接API/数据库，配置权限和监控告警 |
| **流程设计师** | 将业务SOP转化为Agent工作流 | 在可视化画布上编排Agent协作流程 |
| **AI工程师** | 调优Agent表现，管理提示词 | Playground调试、提示词版本管理、A/B测试 |

### 3. 产品核心理念：四步闭环

```
┌──────────────────────────────────────────────────────┐
│                                                        │
│    ①连接          ②设计          ③运行          ④度量  │
│                                                        │
│  接入企业    →   设计Agent   →  部署工作流  →  看效果   │
│  数据与API       和工作流        处理真实任务    持续优化 │
│                                                        │
│    Connect       Design         Run           Measure  │
│                                                        │
└──────────────────────────────────────────────────────┘
```

这四步对应四个产品模块，每一步都能独立交付价值，但连起来形成飞轮。

### 4. 产品模块体系

#### 模块一：Connect — 企业知识与能力接入

**解决的问题**：Agent需要"知道"企业有什么数据、什么API、什么业务规则。

| 功能 | 描述 | 复用现有资产 |
|------|------|-------------|
| **API接入器** | 导入OpenAPI/Swagger规范，自动生成Agent可用的工具 | `context_collector.py` + `tool_registry.py` |
| **数据库接入器** | 连接数据库，自动发现表结构和字段含义 | `context_collector.py` 扩展 |
| **文档知识库** | 上传SOP/手册/FAQ，向量化索引供Agent检索 | `context_collector.py` MarkdownDocCollector |
| **业务本体编辑器** | 定义业务实体、指标、关系——让Agent理解业务语言 | `ontology.py` OntologyManager |

**产品界面**：

```
┌─────────────────────────────────────────────────┐
│  Connect Hub                                     │
│                                                   │
│  已接入资产                        + 新建连接     │
│  ┌───────┐ ┌───────┐ ┌───────┐                  │
│  │ 📡    │ │ 🗄️    │ │ 📄    │                  │
│  │订单API │ │销售DB  │ │客服手册│                  │
│  │ 12工具 │ │ 8张表  │ │ 156段  │                  │
│  │ 在线 ✅│ │ 在线 ✅│ │ 已索引 │                  │
│  └───────┘ └───────┘ └───────┘                  │
│                                                   │
│  业务本体                                         │
│  [订单]──has_many──[商品]                         │
│    │                  │                           │
│    └──belongs_to──[客户]                          │
│                                                   │
│  业务指标：日销售额 | 客户满意度 | 订单完成率      │
└─────────────────────────────────────────────────┘
```

#### 模块二：Design — Agent与工作流设计

**解决的问题**：如何将业务需求转化为可执行的Agent工作流。

**2a. Agent设计器**

| 功能 | 描述 |
|------|------|
| **角色定义** | 用自然语言描述Agent的角色、职责、行为边界 |
| **工具绑定** | 从Connect Hub中选择Agent可用的工具 |
| **约束配置** | 设置成本上限、超时时间、需人工审批的操作 |
| **Playground** | 即时对话测试Agent表现，逐步调优 |

Agent配置界面（声明式）：

```
┌─────────────────────────────────────────────────┐
│  Agent设计器：数据分析师                          │
│                                                   │
│  角色指令 ──────────────────────────────────────  │
│  │ 你是企业数据分析专家。你的职责是：              │
│  │ 1. 理解用户的分析需求                          │
│  │ 2. 查询相关数据                                │
│  │ 3. 进行统计分析并生成洞察                      │
│  │ 4. 用简洁的语言汇报结果                        │
│  │ 限制：不要执行任何写操作。                      │
│  └──────────────────────────────────────────────  │
│                                                   │
│  可用工具 ──────────────────────────────────────  │
│  ☑ query_sales_data    ☑ compute_statistics      │
│  ☑ search_knowledge    ☐ write_database (🔒禁用) │
│                                                   │
│  运行约束 ──────────────────────────────────────  │
│  模型: Claude Sonnet    最大轮次: 15              │
│  单次成本上限: ¥5       超时: 3分钟               │
│  需审批操作: send_email, export_report            │
│                                                   │
│  [💬 Playground测试]  [💾 保存]  [📋 版本历史]    │
└─────────────────────────────────────────────────┘
```

**2b. 工作流编排器（核心差异化）**

| 功能 | 描述 |
|------|------|
| **可视化画布** | 拖拽Agent节点、连线定义流转条件 |
| **三种节点类型** | Agent节点（LLM决策）/ 规则节点（确定性逻辑）/ 人工节点（审批/介入） |
| **条件分支** | 支持LLM判断和规则判断两种分支方式 |
| **并行/串行** | 支持多Agent并行执行后汇聚 |
| **子工作流** | 工作流可嵌套复用 |

工作流编排界面：

```
┌──────────────────────────────────────────────────────────┐
│  工作流编排器：客服工单处理流程                              │
│                                                            │
│  ┌──────┐     ┌──────────┐     ┌──────────┐              │
│  │ 开始 │────→│ 🤖分类员 │──┬──│ 🤖简单处理│──┐           │
│  └──────┘     │ Agent    │  │  │ Agent    │  │           │
│               └──────────┘  │  └──────────┘  │           │
│                  │          │                  │           │
│                  │ 复杂     │ 简单             ├──→┌─────┐│
│                  ▼          │                  │   │🤖质检││
│             ┌──────────┐   │  ┌──────────┐   │   │Agent││
│             │ 🤖专家处理│───┼──│ 👤人工审批│──┘   └─────┘│
│             │ Agent    │   │  │ 等待审批  │      │      │
│             └──────────┘   │  └──────────┘      ▼      │
│                            │               ┌──────┐     │
│                            └──────────────→│ 结束 │     │
│                                            └──────┘     │
│                                                          │
│  节点面板        属性面板                                  │
│  🤖 Agent节点    选中：分类员Agent                         │
│  ⚙️ 规则节点     分支条件：                                │
│  👤 人工节点       简单 → result.complexity == "simple"    │
│  🔀 并行网关       复杂 → else                            │
│                                                          │
│  [▶️ 试运行]  [💾 保存]  [🚀 发布]                        │
└──────────────────────────────────────────────────────────┘
```

**关键设计决策——三种节点的分工**：

| 节点类型 | 标识 | 何时用 | 内部机制 | 成本 |
|---------|------|-------|---------|------|
| **Agent节点** | 🤖 | 需要理解、判断、生成 | LLM推理 + 工具调用 | 高（按token计费） |
| **规则节点** | ⚙️ | 确定性逻辑、数据转换 | Python表达式/规则引擎 | 零（纯计算） |
| **人工节点** | 👤 | 高风险操作审批、异常处理 | 暂停等待人工输入 | 零（等待时间） |

这是"确定性骨架 + LLM智能"在产品层面的具体体现——**不是所有节点都需要LLM**。

#### 模块三：Run — 部署与运行

**解决的问题**：把设计好的工作流变成7×24小时运行的生产系统。

| 功能 | 描述 |
|------|------|
| **一键发布** | 工作流从设计态变为运行态 |
| **触发方式** | 手动触发 / API触发 / 定时触发 / 事件触发 |
| **任务队列** | 查看排队、运行中、已完成的任务 |
| **实时追踪** | 查看每个任务在工作流中走到了哪一步 |
| **人工介入** | 审批队列：待处理的人工审批项 |
| **异常处理** | 失败任务的重试、跳过、回退 |

运行监控界面：

```
┌──────────────────────────────────────────────────────┐
│  Run — 客服工单处理流程                                │
│                                                        │
│  状态: 运行中 🟢    今日已处理: 847    失败: 3         │
│                                                        │
│  实时任务流                                            │
│  ┌─────────────────────────────────────────────────┐  │
│  │ #1052 "用户投诉发货延迟"                          │  │
│  │ ├─ ✅ 分类员 → 判定: 复杂 (0.3s, ¥0.02)        │  │
│  │ ├─ ✅ 专家处理 → 生成回复方案 (2.1s, ¥0.15)     │  │
│  │ ├─ ⏳ 人工审批 → 等待张经理审批...               │  │
│  │ └─ ⬜ 质检 → 待执行                              │  │
│  │                                                   │  │
│  │ #1053 "查询订单物流状态"                          │  │
│  │ ├─ ✅ 分类员 → 判定: 简单 (0.2s, ¥0.01)        │  │
│  │ ├─ ✅ 简单处理 → 查询完成 (1.5s, ¥0.08)         │  │
│  │ └─ ✅ 质检 → 通过 (0.8s, ¥0.05)                 │  │
│  └─────────────────────────────────────────────────┘  │
│                                                        │
│  审批队列 (3项待处理)                                   │
│  ┌─────────────────────────────────────────────────┐  │
│  │ ⏳ #1052 专家回复方案 → 待张经理审批  [通过][拒绝]│  │
│  │ ⏳ #1048 退款操作 → 待财务审批       [通过][拒绝]│  │
│  │ ⏳ #1045 VIP客户升级 → 待运营审批    [通过][拒绝]│  │
│  └─────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────┘
```

#### 模块四：Measure — 度量与优化

**解决的问题**：证明AI创造了价值，并持续优化。

| 功能 | 描述 |
|------|------|
| **效能仪表盘** | 任务量、成功率、平均耗时、总成本 |
| **成本分析** | 每个Agent的token消耗、每个工作流的运行成本 |
| **质量追踪** | 人工审批的通过率（衡量Agent决策质量） |
| **对比分析** | AI处理 vs 人工处理的效率/成本对比 |
| **提示词优化** | A/B测试不同版本提示词的效果差异 |

度量仪表盘：

```
┌──────────────────────────────────────────────────────────┐
│  Measure — 运营仪表盘                     本月 ▾         │
│                                                            │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐    │
│  │ 处理总量  │ │ 成功率   │ │ 平均耗时  │ │ 总成本   │    │
│  │  12,847  │ │  96.3%  │ │  4.2s   │ │  ¥1,847  │    │
│  │ ↑23%    │ │ ↑2.1%   │ │ ↓35%    │ │ vs人工   │    │
│  │         │ │         │ │         │ │ ¥48,200  │    │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘    │
│                                                            │
│  成本构成                    Agent决策质量                  │
│  ┌───────────────────┐      ┌───────────────────┐        │
│  │ 分类员    ¥128    │      │ 人工审批通过率      │        │
│  │ ■■                │      │ 分类员   98.5%     │        │
│  │ 简单处理  ¥412    │      │ 简单处理 94.2%     │        │
│  │ ■■■■■             │      │ 专家处理 87.6%     │        │
│  │ 专家处理  ¥923    │      │ (↑说明需优化指令)   │        │
│  │ ■■■■■■■■■■        │      │                    │        │
│  │ 质检      ¥384    │      │                    │        │
│  │ ■■■■■              │      │                    │        │
│  └───────────────────┘      └───────────────────┘        │
│                                                            │
│  ROI摘要：本月AI处理节省人工成本 ¥46,353，投入AI成本        │
│  ¥1,847，投资回报率 25.1 倍                                │
└──────────────────────────────────────────────────────────┘
```

### 5. 产品里程碑

| 阶段 | 交付 | 周期 | 商业价值 |
|------|------|------|---------|
| **MVP** | Connect + 单Agent Playground | 6周 | 能演示"企业数据接入→Agent对话" |
| **V1.0** | + 工作流编排器 + Run基本功能 | +8周 | 能处理真实业务流程，开始付费试用 |
| **V1.5** | + Measure仪表盘 + 人工审批 | +4周 | 能证明ROI，转化付费客户 |
| **V2.0** | + 多租户 + 团队协作 + 模板市场 | +8周 | 规模化商业运营 |

---

## 第二部分：技术方案

### 1. 整体技术架构

```
┌──────────────────────────────────────────────────────────────┐
│                       前端（React + TypeScript）               │
│  Connect Hub │ Agent设计器 │ 工作流画布 │ 运行监控 │ 仪表盘   │
└──────────────────────────┬───────────────────────────────────┘
                           │ REST API + WebSocket
┌──────────────────────────┼───────────────────────────────────┐
│                     API 网关层                                  │
│  认证 │ 限流 │ 路由 │ WebSocket管理                            │
├──────────────────────────┼───────────────────────────────────┤
│                                                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │  设计服务    │  │  执行服务     │  │  度量服务    │        │
│  │              │  │              │  │              │        │
│  │ Agent CRUD   │  │ 工作流引擎   │  │ 指标收集     │        │
│  │ 工作流CRUD   │  │ Agent运行时  │  │ 成本计算     │        │
│  │ 版本管理     │  │ 工具执行器   │  │ 报告生成     │        │
│  │ 模板管理     │  │ 人工审批队列 │  │ A/B测试     │        │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘        │
│         │                  │                  │                │
│  ┌──────┴──────────────────┴──────────────────┴──────────┐    │
│  │                    运行时基座                           │    │
│  │  LLM网关 │ 状态存储 │ 工具执行器 │ 事件总线 │ 审计日志 │    │
│  └───────────────────────┬───────────────────────────────┘    │
│                          │                                     │
├──────────────────────────┼─────────────────────────────────────┤
│                     存储层                                      │
│  PostgreSQL(业务数据) │ Redis(状态/缓存) │ S3(文件/向量)       │
└──────────────────────────────────────────────────────────────────┘
```

### 2. 核心数据模型

#### 2.1 Agent模型

```python
# 存储在 PostgreSQL 中
class AgentDefinition:
    id: str                     # uuid
    workspace_id: str           # 所属工作空间
    name: str                   # "数据分析师"
    instructions: str           # 系统提示词（角色指令）
    instructions_version: int   # 提示词版本号
    model: str                  # "claude-sonnet-4-20250514"
    tools: list[str]            # 绑定的工具ID列表
    constraints: AgentConstraints
    status: str                 # draft / published / archived
    created_at: datetime
    updated_at: datetime

class AgentConstraints:
    max_turns: int = 20         # 最大对话轮次
    max_cost_cents: int = 500   # 单次运行最大成本（分）
    timeout_seconds: int = 300  # 超时时间
    require_approval: list[str] # 需人工审批的工具名列表
    forbidden_tools: list[str]  # 禁止使用的工具
    output_schema: dict | None  # 可选：要求输出的JSON结构
```

#### 2.2 工作流模型

```python
class WorkflowDefinition:
    id: str
    workspace_id: str
    name: str                   # "客服工单处理"
    description: str
    version: int
    nodes: list[WorkflowNode]
    edges: list[WorkflowEdge]
    trigger: TriggerConfig      # 触发方式
    status: str                 # draft / published / archived
    created_at: datetime

class WorkflowNode:
    id: str
    type: str                   # "agent" | "rule" | "human" | "parallel_gate"
    name: str
    config: dict
    # type=="agent" 时：config = {"agent_id": "...", "input_mapping": {...}}
    # type=="rule"  时：config = {"expression": "data.amount > 1000"}
    # type=="human" 时：config = {"assignee_role": "manager", "timeout_hours": 24}
    position: dict              # 画布坐标 {"x": 100, "y": 200}

class WorkflowEdge:
    id: str
    source_node_id: str
    target_node_id: str
    condition: str | None       # None=无条件, 否则为Python表达式或"llm_judge"
    label: str | None           # 在画布上显示的标签，如"简单"/"复杂"

class TriggerConfig:
    type: str                   # "manual" | "api" | "cron" | "event"
    config: dict
    # type=="cron"  时：config = {"schedule": "0 9 * * 1-5"}
    # type=="event" 时：config = {"event_type": "new_ticket", "source": "zendesk"}
```

#### 2.3 运行实例模型

```python
class WorkflowRun:
    id: str
    workflow_id: str
    workflow_version: int       # 快照当前版本，不受后续编辑影响
    status: str                 # "running" | "completed" | "failed" | "waiting_approval"
    input_data: dict            # 触发时的输入
    current_node_id: str | None # 当前执行到的节点
    started_at: datetime
    completed_at: datetime | None
    total_cost_cents: int       # 累计成本
    total_llm_tokens: int       # 累计Token消耗

class NodeExecution:
    id: str
    run_id: str
    node_id: str
    node_type: str
    status: str                 # "running" | "completed" | "failed" | "waiting_approval"
    input_data: dict
    output_data: dict | None
    error: str | None
    started_at: datetime
    completed_at: datetime | None
    cost_cents: int
    llm_tokens: int
    llm_messages: list[dict]    # 完整的LLM对话记录（用于审计和调试）

class ApprovalRequest:
    id: str
    run_id: str
    node_execution_id: str
    tool_name: str              # 触发审批的工具
    tool_args: dict             # 工具参数
    agent_reasoning: str        # Agent给出的理由
    assignee_id: str | None     # 分配给谁
    decision: str | None        # "approved" | "rejected" | None(待处理)
    decided_at: datetime | None
    decided_by: str | None
```

#### 2.4 连接与工具模型

```python
class Connection:
    id: str
    workspace_id: str
    name: str                   # "订单服务API"
    type: str                   # "openapi" | "database" | "document"
    config: dict                # 连接配置（加密存储）
    status: str                 # "active" | "error" | "disabled"
    last_sync_at: datetime | None

class Tool:
    id: str
    connection_id: str | None   # 来自哪个连接，None=自定义工具
    name: str                   # "query_orders"
    description: str            # Agent看到的描述
    parameters_schema: dict     # JSON Schema
    required_permissions: list[str]
    rate_limit: str | None      # "10/minute"
    implementation: str         # "http" | "sql" | "python" | "retrieval"
    implementation_config: dict # 实现细节
```

### 3. 核心引擎设计

#### 3.1 工作流执行引擎

这是系统最关键的组件。设计原则：**确定性调度 + 智能节点执行**。

```python
class WorkflowEngine:
    """工作流执行引擎
    
    职责：
    1. 按DAG拓扑顺序调度节点执行
    2. 管理运行状态和检查点
    3. 处理分支条件（规则判断或LLM判断）
    4. 管理并行执行和汇聚
    5. 处理人工审批的暂停和恢复
    """
    
    async def start_run(self, workflow_id: str, input_data: dict) -> WorkflowRun:
        workflow = await self.load_workflow(workflow_id)
        run = WorkflowRun(workflow_id=workflow_id, input_data=input_data, status="running")
        await self.state_store.save_run(run)
        
        # 找到起始节点并开始执行
        start_nodes = self.find_start_nodes(workflow)
        for node in start_nodes:
            await self.execute_node(run, node, input_data)
        
        return run
    
    async def execute_node(self, run: WorkflowRun, node: WorkflowNode, input_data: dict):
        execution = NodeExecution(run_id=run.id, node_id=node.id, input_data=input_data)
        
        try:
            if node.type == "agent":
                result = await self.agent_runtime.run_agent(node.config, input_data)
            elif node.type == "rule":
                result = self.rule_engine.evaluate(node.config["expression"], input_data)
            elif node.type == "human":
                # 创建审批请求，暂停执行
                await self.create_approval(run, execution, node.config)
                return  # 等待人工恢复
            
            execution.output_data = result
            execution.status = "completed"
            await self.state_store.save_execution(execution)
            
            # 更新运行成本
            run.total_cost_cents += execution.cost_cents
            
            # 找到下一个要执行的节点
            next_nodes = await self.resolve_next_nodes(run, node, result)
            for next_node in next_nodes:
                await self.execute_node(run, next_node, result)
                
        except Exception as e:
            execution.status = "failed"
            execution.error = str(e)
            await self.handle_failure(run, execution)
    
    async def resolve_next_nodes(self, run, current_node, result) -> list:
        """解析下一步节点——这里是确定性骨架的核心"""
        edges = self.get_outgoing_edges(current_node.id)
        next_nodes = []
        
        for edge in edges:
            if edge.condition is None:
                # 无条件边：直接走
                next_nodes.append(self.get_node(edge.target_node_id))
            elif edge.condition == "llm_judge":
                # LLM判断：让当前Agent决定走哪条边
                should_take = await self.llm_judge(edge, result)
                if should_take:
                    next_nodes.append(self.get_node(edge.target_node_id))
            else:
                # 规则判断：求值Python表达式
                if self.rule_engine.evaluate(edge.condition, result):
                    next_nodes.append(self.get_node(edge.target_node_id))
        
        return next_nodes
```

#### 3.2 Agent运行时

```python
class AgentRuntime:
    """Agent运行时
    
    职责：
    1. 加载Agent定义，构造LLM对话
    2. 执行工具调用循环（ReAct模式）
    3. 执行约束检查（成本、轮次、超时、权限）
    4. 记录完整的决策轨迹
    """
    
    async def run_agent(self, agent_config: dict, input_data: dict) -> dict:
        agent_def = await self.load_agent(agent_config["agent_id"])
        tools = await self.load_tools(agent_def.tools)
        
        messages = [
            {"role": "system", "content": agent_def.instructions},
            {"role": "user", "content": self.format_input(input_data, agent_config)}
        ]
        
        turn_count = 0
        total_cost = 0
        start_time = time.time()
        
        while True:
            # ---- 约束检查（确定性） ----
            if turn_count >= agent_def.constraints.max_turns:
                raise AgentConstraintError("超过最大对话轮次")
            if total_cost >= agent_def.constraints.max_cost_cents:
                raise AgentConstraintError("超过成本上限")
            if time.time() - start_time > agent_def.constraints.timeout_seconds:
                raise AgentConstraintError("执行超时")
            
            # ---- LLM推理（智能） ----
            response = await self.llm_gateway.chat(
                model=agent_def.model,
                messages=messages,
                tools=self.format_tools_schema(tools)
            )
            total_cost += response.cost_cents
            turn_count += 1
            
            # ---- 处理响应 ----
            if response.type == "text":
                # Agent决定直接回复
                return {"output": response.content, "cost_cents": total_cost}
            
            elif response.type == "tool_call":
                tool_name = response.tool_name
                tool_args = response.tool_args
                
                # 权限检查（确定性）
                if tool_name in agent_def.constraints.forbidden_tools:
                    raise AgentConstraintError(f"禁止调用工具: {tool_name}")
                
                # 审批检查（确定性）
                if tool_name in agent_def.constraints.require_approval:
                    raise ApprovalRequired(tool_name, tool_args, response.reasoning)
                
                # 执行工具（确定性基座）
                tool_result = await self.tool_executor.execute(
                    tool_name, tool_args,
                    timeout=30,
                    retry_count=2
                )
                
                messages.append({"role": "assistant", "content": response.raw})
                messages.append({"role": "tool", "name": tool_name, "content": tool_result})
```

#### 3.3 LLM网关

```python
class LLMGateway:
    """LLM网关
    
    职责：
    1. 多模型路由（Claude / GPT / 开源模型）
    2. 请求限流（令牌桶算法）
    3. 语义缓存（相似请求复用响应）
    4. 故障降级（主模型不可用时切换备选）
    5. 成本记录
    """
    
    async def chat(self, model, messages, tools=None) -> LLMResponse:
        # 1. 检查缓存
        cache_key = self.compute_cache_key(model, messages)
        cached = await self.cache.get(cache_key)
        if cached:
            return cached
        
        # 2. 限流检查
        await self.rate_limiter.acquire(model)
        
        # 3. 调用LLM（带降级）
        try:
            response = await self.call_provider(model, messages, tools)
        except ProviderUnavailable:
            fallback_model = self.get_fallback(model)
            response = await self.call_provider(fallback_model, messages, tools)
        
        # 4. 计算成本
        response.cost_cents = self.calculate_cost(model, response.usage)
        
        # 5. 写入缓存
        if response.type == "text":  # 只缓存纯文本回复，不缓存工具调用
            await self.cache.set(cache_key, response, ttl=3600)
        
        return response
```

#### 3.4 工具执行器

```python
class ToolExecutor:
    """工具执行器
    
    职责：
    1. 根据工具类型分发执行（HTTP / SQL / Python / 向量检索）
    2. 超时控制
    3. 错误重试（指数退避）
    4. 审计日志
    """
    
    async def execute(self, tool_name, args, timeout=30, retry_count=2) -> str:
        tool = await self.tool_registry.get(tool_name)
        
        for attempt in range(retry_count + 1):
            try:
                async with asyncio.timeout(timeout):
                    if tool.implementation == "http":
                        result = await self.http_executor.call(tool, args)
                    elif tool.implementation == "sql":
                        result = await self.sql_executor.query(tool, args)
                    elif tool.implementation == "python":
                        result = await self.python_executor.run(tool, args)
                    elif tool.implementation == "retrieval":
                        result = await self.retrieval_executor.search(tool, args)
                
                # 审计日志
                await self.audit_log.record(tool_name, args, result, success=True)
                return json.dumps(result)
                
            except asyncio.TimeoutError:
                if attempt == retry_count:
                    await self.audit_log.record(tool_name, args, None, success=False)
                    raise ToolTimeoutError(f"{tool_name} 超时 ({timeout}s)")
                await asyncio.sleep(2 ** attempt)  # 指数退避
```

### 4. 项目目录结构

```
agentic-work-studio/
├── studio/                          # Python后端（核心）
│   ├── __init__.py
│   ├── api/                         # FastAPI路由
│   │   ├── agents.py                # Agent CRUD
│   │   ├── workflows.py             # 工作流 CRUD
│   │   ├── connections.py           # 连接管理
│   │   ├── runs.py                  # 运行管理
│   │   ├── approvals.py            # 审批处理
│   │   └── metrics.py              # 度量查询
│   │
│   ├── engine/                      # 核心引擎
│   │   ├── workflow_engine.py       # 工作流执行引擎 (~300行)
│   │   ├── agent_runtime.py         # Agent运行时 (~250行)
│   │   ├── rule_engine.py           # 规则引擎 (~80行)
│   │   └── tool_executor.py         # 工具执行器 (~200行)
│   │
│   ├── gateway/                     # 运行时基座
│   │   ├── llm_gateway.py           # LLM网关 (~200行)
│   │   ├── rate_limiter.py          # 限流器 (~60行)
│   │   └── cache.py                 # 语义缓存 (~80行)
│   │
│   ├── connect/                     # 企业接入（复用现有资产）
│   │   ├── collector.py             # 资产采集（源自context_collector.py）
│   │   ├── tool_registry.py         # 工具注册（源自tool_registry.py）
│   │   └── ontology.py              # 业务本体（源自ontology.py）
│   │
│   ├── observe/                     # 可观测性
│   │   ├── tracer.py                # 决策追踪 (~100行)
│   │   ├── metrics.py               # 指标收集 (~80行)
│   │   └── audit.py                 # 审计日志 (~60行)
│   │
│   ├── models/                      # 数据模型
│   │   ├── agent.py
│   │   ├── workflow.py
│   │   ├── run.py
│   │   ├── connection.py
│   │   └── tool.py
│   │
│   └── store/                       # 存储层
│       ├── database.py              # PostgreSQL
│       ├── state_store.py           # Redis状态
│       └── file_store.py            # S3文件
│
├── web/                             # 前端（React + TypeScript）
│   ├── src/
│   │   ├── pages/
│   │   │   ├── ConnectHub.tsx
│   │   │   ├── AgentDesigner.tsx
│   │   │   ├── WorkflowCanvas.tsx
│   │   │   ├── RunMonitor.tsx
│   │   │   └── MeasureDashboard.tsx
│   │   ├── components/
│   │   └── services/
│   └── package.json
│
├── pyproject.toml
└── README.md
```

**预估核心代码量**：

| 模块 | 行数 | 说明 |
|------|------|------|
| engine/ | ~830 | 工作流引擎+Agent运行时+规则引擎+工具执行器 |
| gateway/ | ~340 | LLM网关+限流+缓存 |
| connect/ | ~500 | 复用现有资产，简化重构 |
| observe/ | ~240 | 追踪+指标+审计 |
| api/ | ~600 | FastAPI路由 |
| models/ | ~300 | Pydantic数据模型 |
| store/ | ~200 | 存储层 |
| **后端合计** | **~3,010** | 符合"~3000行"目标 |

### 5. 关键技术决策

| 决策 | 选择 | 原因 |
|------|------|------|
| 后端框架 | FastAPI | 异步原生、类型安全、自动文档 |
| 数据库 | PostgreSQL | 关系数据+JSON支持，企业级可靠 |
| 状态存储 | Redis | 工作流运行状态、LLM缓存 |
| 前端 | React + TypeScript + ReactFlow | 复用现有UI资产，ReactFlow做工作流画布 |
| LLM接入 | Anthropic SDK + OpenAI SDK | 多模型支持 |
| 异步 | Python asyncio | Agent/工具调用天然异步 |
| 部署 | Docker Compose → K8s | 从单机到集群的渐进路径 |

### 6. API设计概要

```
# Agent管理
POST   /api/agents                    创建Agent
GET    /api/agents                    列出Agent
GET    /api/agents/{id}               获取Agent详情
PUT    /api/agents/{id}               更新Agent
POST   /api/agents/{id}/playground    Playground对话

# 工作流管理
POST   /api/workflows                 创建工作流
GET    /api/workflows                 列出工作流
PUT    /api/workflows/{id}            更新工作流
POST   /api/workflows/{id}/publish    发布工作流

# 运行管理
POST   /api/workflows/{id}/runs       触发运行
GET    /api/runs                      列出运行
GET    /api/runs/{id}                 运行详情（含节点执行历史）
GET    /api/runs/{id}/trace           运行追踪（完整决策链）
POST   /api/runs/{id}/retry           重试失败的运行

# 审批
GET    /api/approvals                 待审批列表
POST   /api/approvals/{id}/decide     审批决定（approve/reject）

# 连接管理
POST   /api/connections               创建连接
GET    /api/connections/{id}/tools     查看连接发现的工具

# 度量
GET    /api/metrics/overview          总览仪表盘数据
GET    /api/metrics/costs             成本分析
GET    /api/metrics/quality           质量指标

# WebSocket
WS     /ws/runs/{id}                  实时运行状态推送
```

---

## 第三部分：EFIAgent资产复用计划

| 现有文件 | 复用方式 | 修改程度 |
|---------|---------|---------|
| `context_collector.py` | → `studio/connect/collector.py` | 轻度：保留核心，去掉demo代码 |
| `tool_registry.py` | → `studio/connect/tool_registry.py` | 轻度：保留ToolSpec/ToolRegistry |
| `ontology.py` | → `studio/connect/ontology.py` | 保留：OntologyEntity/Metric模型 |
| `task_dag.py` | 部分逻辑融入 `workflow_engine.py` | 中度：简化拓扑排序，去掉冗余模型 |
| `resource_scheduler.py` 技能匹配 | 融入 Agent选择逻辑 | 重度：只保留余弦相似度核心 |
| `zero_trust.py` | → `studio/observe/audit.py` | 重度：保留审计哈希链，简化RBAC |
| 前端 `AgentDesigner.tsx` | 适配新数据模型 | 中度 |
| 前端 `ReactFlow` 画布 | 改造为工作流编排器 | 中度 |

---

## 总结

Agentic Work Studio 的产品和技术设计遵循三个核心原则：

1. **业务闭环优先于技术完备** — 四步闭环（Connect→Design→Run→Measure）每一步都能独立交付价值
2. **确定性骨架 + LLM智能** — 工作流引擎是确定性的图执行器，Agent节点内部是LLM智能决策
3. **面向度量的设计** — 每一次运行都记录成本、耗时、决策轨迹，让客户能计算ROI

核心指标目标：
- 后端核心代码 ~3,000行
- 从"有想法"到MVP可运行：6周
- 每个工作流运行都有完整的成本和决策追踪
- 企业客户能在30分钟内完成：接入API → 设计Agent → 跑通第一个工作流

---

*版本：v1.0*
*日期：2026年2月8日*
