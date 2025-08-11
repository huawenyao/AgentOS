/**
 * 类型定义文件
 * 定义可视化Agent开发模块中使用的各种类型
 */

// 节点类别
export enum NodeCategory {
  CONTROL = 'control',           // 控制节点
  AGENT = 'agent',              // Agent节点
  CAPABILITY = 'capability',     // 能力组件
  INTEGRATION = 'integration',   // 集成组件
  TEMPLATE = 'template'          // 模板组件
}

// 组件类别
export enum ComponentCategory {
  BASE = 'base',                 // 基础组件
  CONTROL = 'control',           // 控制组件
  AGENT = 'agent',              // Agent组件
  CAPABILITY = 'capability',     // 能力组件
  COMMUNICATION = 'communication', // 通信组件
  RESOURCE = 'resource',         // 资源组件
  INTEGRATION = 'integration',   // 集成组件
  TEMPLATE = 'template',         // 模板组件
  WORKFLOW = 'workflow',         // 工作流组件
  UTILITY = 'utility'            // 工具组件
}

// 组件类型
export enum ComponentType {
  // 控制类型
  START_NODE = 'start_node',
  END_NODE = 'end_node',
  CONDITION_NODE = 'condition_node',
  PARALLEL_NODE = 'parallel_node',
  MERGE_NODE = 'merge_node',
  LOOP_NODE = 'loop_node',
  
  // Agent基础类型
  AGENT_TYPE = 'agent_type',
  AGENT_CONFIG = 'agent_config',
  STATE_MANAGEMENT = 'state_management',
  
  // Agent类型
  PLANNING_AGENT = 'planning_agent',
  EXECUTION_AGENT = 'execution_agent',
  AUDIT_AGENT = 'audit_agent',
  MEMORY_AGENT = 'memory_agent',
  
  // 能力类型
  OBSERVATION = 'observation',
  DECISION = 'decision',
  ACTION = 'action',
  WEB_SEARCH = 'web_search',
  FILE_OPERATION = 'file_operation',
  LLM_REASONING = 'llm_reasoning',
  API_CALL = 'api_call',
  DATABASE_ACCESS = 'database_access',
  CODE_EXECUTION = 'code_execution',
  IMAGE_PROCESSING = 'image_processing',
  TEXT_TO_SPEECH = 'text_to_speech',
  SPEECH_TO_TEXT = 'speech_to_text',
  MEMORY_STORAGE = 'memory_storage',
  
  // 通信类型
  MESSAGE_SEND = 'message_send',
  MESSAGE_RECEIVE = 'message_receive',
  MESSAGE_PROCESS = 'message_process',
  
  // 数据类型
  DATA_SOURCE = 'data_source',
  
  // 集成类型
  TOOL_INTEGRATION = 'tool_integration',
  EXTERNAL_SERVICE = 'external_service',
  DATABASE_INTEGRATION = 'database_integration',
  CLOUD_SERVICE_INTEGRATION = 'cloud_service_integration',
  THIRD_PARTY_API_INTEGRATION = 'third_party_api_integration',
  
  // 模板类型
  AGENT_TEMPLATE = 'agent_template',
  WORKFLOW_TEMPLATE = 'workflow_template',
  CAPABILITY_TEMPLATE = 'capability_template'
}

// 控制节点类型
export enum ControlNodeType {
  START = 'start',
  END = 'end',
  CONDITION = 'condition',
  PARALLEL = 'parallel',
  MERGE = 'merge',
  LOOP = 'loop',
  ERROR_HANDLER = 'error_handler',
  DELAY = 'delay'
}

// 能力组件类型
export enum CapabilityType {
  // 感知能力
  WEB_SEARCH = 'web_search',
  FILE_READ = 'file_read',
  IMAGE_RECOGNITION = 'image_recognition',
  SPEECH_TO_TEXT = 'speech_to_text',
  DATA_EXTRACTION = 'data_extraction',
  
  // 推理能力
  LLM_REASONING = 'llm_reasoning',
  RULE_ENGINE = 'rule_engine',
  DECISION_TREE = 'decision_tree',
  CLASSIFICATION = 'classification',
  SENTIMENT_ANALYSIS = 'sentiment_analysis',
  
  // 行动能力
  API_CALL = 'api_call',
  FILE_WRITE = 'file_write',
  EMAIL_SEND = 'email_send',
  DATABASE_OPERATION = 'database_operation',
  CODE_EXECUTION = 'code_execution',
  TEXT_TO_SPEECH = 'text_to_speech',
  
  // 记忆能力
  MEMORY_STORAGE = 'memory_storage',
  KNOWLEDGE_GRAPH = 'knowledge_graph',
  VECTOR_SEARCH = 'vector_search',
  CACHE_MANAGEMENT = 'cache_management',
  
  // 通信能力
  MESSAGE_QUEUE = 'message_queue',
  WEBHOOK = 'webhook',
  WEBSOCKET = 'websocket',
  HTTP_CLIENT = 'http_client'
}

// 集成组件类型
export enum IntegrationType {
  DATABASE = 'database',
  CLOUD_SERVICE = 'cloud_service',
  THIRD_PARTY_API = 'third_party_api',
  MESSAGE_BROKER = 'message_broker',
  FILE_SYSTEM = 'file_system'
}

// Agent类型
export enum AgentType {
  PLANNING = 'planning',
  EXECUTION = 'execution',
  AUDIT = 'audit',
  MEMORY = 'memory',
  CONVERSATIONAL = 'conversational'
}

// Agent状态
export enum AgentStatus {
  IDLE = 'idle',
  RUNNING = 'running',
  STOPPED = 'stopped',
  PAUSED = 'paused',
  ERROR = 'error',
  COMPLETED = 'completed'
}

// 节点基础接口
export interface BaseNode {
  id: string;
  name: string;
  description: string;
  category: NodeCategory;
  icon?: string;
  color?: string;
  position?: { x: number; y: number };
  data?: any;
  properties?: PropertyDefinition[];
  inputs?: ConnectionPoint[];
  outputs?: ConnectionPoint[];
  version?: string;
  author?: string;
  tags?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

// 连接点接口
export interface ConnectionPoint {
  id: string;
  name: string;
  type: 'data' | 'control' | 'event';
  dataType?: string; // string, number, object, array, any
  required?: boolean;
  description?: string;
}

// 属性定义接口
export interface PropertyDefinition {
  id: string;
  name: string;
  label: string;
  displayName?: string;
  description: string;
  type: PropertyType;
  required: boolean;
  defaultValue?: any;
  options?: PropertyOption[];
  validation?: PropertyValidation;
  group?: string; // 属性分组
  order?: number; // 显示顺序
  conditional?: PropertyCondition; // 条件显示
}

// 属性类型
export enum PropertyType {
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  SELECT = 'select',
  MULTI_SELECT = 'multi_select',
  TEXT_AREA = 'text_area',
  JSON = 'json',
  CODE = 'code',
  FILE = 'file',
  URL = 'url',
  EMAIL = 'email',
  PASSWORD = 'password',
  COLOR = 'color',
  DATE = 'date',
  TIME = 'time',
  DATETIME = 'datetime',
  SLIDER = 'slider',
  SWITCH = 'switch',
  RADIO = 'radio',
  CHECKBOX = 'checkbox',
  TAGS = 'tags',
  KEY_VALUE = 'key_value'
}

// 属性选项
export interface PropertyOption {
  label: string;
  value: any;
  description?: string;
  disabled?: boolean;
  group?: string;
}

// 属性验证
export interface PropertyValidation {
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  custom?: (value: any) => boolean | string;
  required?: boolean;
}

// 属性条件
export interface PropertyCondition {
  property: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains';
  value: any;
}

// 能力组件接口
export interface CapabilityComponent extends BaseNode {
  type: CapabilityType;
  category: NodeCategory.CAPABILITY;
  // 能力特定属性
  executionMode: 'sync' | 'async' | 'stream';
  timeout?: number; // 超时时间（毫秒）
  retryCount?: number; // 重试次数
  dependencies?: string[]; // 依赖的其他能力
  resources?: ResourceRequirement[]; // 资源需求
  // 配置模板
  configTemplate?: PropertyDefinition[];
  // 示例配置
  examples?: CapabilityExample[];
  // 性能指标
  metrics?: CapabilityMetrics;
}

// 资源需求
export interface ResourceRequirement {
  type: 'cpu' | 'memory' | 'gpu' | 'storage' | 'network';
  amount: number;
  unit: string;
  description?: string;
}

// 能力示例
export interface CapabilityExample {
  name: string;
  description: string;
  input: any;
  output: any;
  config: Record<string, any>;
}

// 能力指标
export interface CapabilityMetrics {
  avgExecutionTime: number; // 平均执行时间
  successRate: number; // 成功率
  errorRate: number; // 错误率
  usageCount: number; // 使用次数
}

// Agent模板接口
export interface AgentTemplate extends BaseNode {
  type: AgentType;
  category: NodeCategory.AGENT;
  // Agent特定属性
  llmConfig?: LLMConfig; // LLM配置
  systemPrompt?: string; // 系统提示词
  capabilities: CapabilityConfig[]; // 能力配置列表
  workflow?: WorkflowDefinition; // 内部工作流
  // 模板元数据
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  featured: boolean;
  usageCount?: number;
  rating?: number;
  reviews?: AgentReview[];
}

// LLM配置
export interface LLMConfig {
  provider: 'openai' | 'anthropic' | 'local' | 'custom';
  model: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stopSequences?: string[];
  customEndpoint?: string;
  apiKey?: string;
}

// 工作流定义
export interface WorkflowDefinition {
  nodes: BaseNode[];
  connections: Connection[];
  variables?: WorkflowVariable[];
  triggers?: WorkflowTrigger[];
}

// 工作流变量
export interface WorkflowVariable {
  name: string;
  type: string;
  defaultValue?: any;
  description?: string;
}

// 工作流触发器
export interface WorkflowTrigger {
  type: 'manual' | 'schedule' | 'event' | 'webhook';
  config: Record<string, any>;
}

// Agent评价
export interface AgentReview {
  id: string;
  userId: string;
  rating: number;
  comment: string;
  createdAt: Date;
}

// Agent配置接口
export interface AgentConfig {
  id: string;
  templateId: string;
  name: string;
  description: string;
  type: AgentType;
  status: AgentStatus;
  // 配置属性
  properties: Record<string, any>;
  llmConfig?: LLMConfig;
  systemPrompt?: string;
  // 能力配置
  capabilities: CapabilityConfig[];
  // 运行时配置
  runtime?: RuntimeConfig;
  // 监控配置
  monitoring?: MonitoringConfig;
  // 元数据
  createdAt?: Date;
  updatedAt?: Date;
  lastRunAt?: Date;
  deployedAt?: Date;
}

// 能力配置
export interface CapabilityConfig {
  capabilityId: string;
  enabled: boolean;
  config: Record<string, any>;
  priority?: number;
  conditions?: CapabilityCondition[];
}

// 控制节点接口
export interface ControlNode extends BaseNode {
  type: ControlNodeType;
  category: NodeCategory.CONTROL;
  // 控制节点特定属性
  connectionPoints: {
    inputs: ConnectionPoint[];
    outputs: ConnectionPoint[];
  };
}

// 通用组件接口
export interface Component extends BaseNode {
  type: ComponentType;
  // 组件特定属性
  executionMode?: 'sync' | 'async' | 'stream';
  timeout?: number;
  retryCount?: number;
  dependencies?: string[];
  resources?: ResourceRequirement[];
  configTemplate?: PropertyDefinition[];
  examples?: any[];
  componentCategory?: ComponentCategory; // 使用不同的属性名避免冲突
}

// 能力接口
export interface Capability extends BaseNode {
  type: CapabilityType;
  category: NodeCategory.CAPABILITY;
  // 能力特定属性
  executionMode: 'sync' | 'async' | 'stream';
  timeout?: number;
  retryCount?: number;
  dependencies?: string[];
  resources?: ResourceRequirement[];
  configTemplate?: PropertyDefinition[];
  examples?: CapabilityExample[];
  metrics?: CapabilityMetrics;
}

// 能力条件
export interface CapabilityCondition {
  type: 'input' | 'context' | 'state';
  field: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than';
  value: any;
}

// 运行时配置
export interface RuntimeConfig {
  maxConcurrency?: number;
  timeout?: number;
  retryPolicy?: RetryPolicy;
  resourceLimits?: ResourceLimits;
  scaling?: ScalingConfig;
}

// 重试策略
export interface RetryPolicy {
  maxRetries: number;
  backoffStrategy: 'fixed' | 'exponential' | 'linear';
  initialDelay: number;
  maxDelay?: number;
  retryableErrors?: string[];
}

// 资源限制
export interface ResourceLimits {
  cpu?: number;
  memory?: number;
  storage?: number;
  networkBandwidth?: number;
}

// 扩缩容配置
export interface ScalingConfig {
  enabled: boolean;
  minInstances: number;
  maxInstances: number;
  targetCpuUtilization?: number;
  targetMemoryUtilization?: number;
  scaleUpCooldown?: number;
  scaleDownCooldown?: number;
}

// 监控配置
export interface MonitoringConfig {
  enabled: boolean;
  metricsCollection?: boolean;
  loggingLevel?: 'debug' | 'info' | 'warn' | 'error';
  alerting?: AlertingConfig;
  healthCheck?: HealthCheckConfig;
}

// 告警配置
export interface AlertingConfig {
  enabled: boolean;
  channels: AlertChannel[];
  rules: AlertRule[];
}

// 告警渠道
export interface AlertChannel {
  type: 'email' | 'slack' | 'webhook' | 'sms';
  config: Record<string, any>;
}

// 告警规则
export interface AlertRule {
  name: string;
  condition: string;
  threshold: number;
  duration: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

// 健康检查配置
export interface HealthCheckConfig {
  enabled: boolean;
  interval: number;
  timeout: number;
  failureThreshold: number;
  successThreshold: number;
  endpoint?: string;
}

// 消息接口
export interface Message {
  id: string;
  agentId: string;
  content: string;
  timestamp: Date;
  direction: 'incoming' | 'outgoing';
  metadata?: Record<string, any>;
}

// 日志接口
export interface Log {
  id: string;
  agentId: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

// 错误接口
export interface Error {
  id: string;
  agentId: string;
  message: string;
  stack?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

// 资源使用接口
export interface ResourceUsage {
  id: string;
  agentId: string;
  cpu: number; // 百分比
  memory: number; // MB
  tokens: number; // 使用的令牌数
  timestamp: Date;
}

// 性能指标接口
export interface PerformanceMetrics {
  id: string;
  agentId: string;
  responseTime: number; // 毫秒
  throughput: number; // 每秒请求数
  successRate: number; // 百分比
  errorRate: number; // 百分比
  timestamp: Date;
}

// 用户接口
export interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'developer' | 'user';
  createdAt: Date;
  lastLoginAt?: Date;
}

// API响应接口
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    page?: number;
    pageSize?: number;
    total?: number;
  };
}

// 工作流状态
export enum WorkflowStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  PAUSED = 'paused',
  STOPPED = 'stopped',
  ERROR = 'error'
}

// 工作流接口
export interface Workflow {
  id: string;
  name: string;
  description: string;
  status?: WorkflowStatus;
  agents: AgentConfig[];
  nodes: any[];
  connections: Connection[];
  author?: string;
  version?: string;
  tags?: string[];
  executionCount?: number;
  successRate?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// 连接接口
export interface Connection {
  id: string;
  sourceId: string;
  targetId: string;
  sourceHandle?: string;
  targetHandle?: string;
  label?: string;
  condition?: any;
  data?: any;
}

// 工作流执行接口
export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: 'pending' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';
  startTime: Date;
  endTime?: Date;
  result?: any;
  error?: string;
}

// 实例接口
export interface AgentInstance {
  id: string;
  configId: string;
  name: string;
  status: AgentStatus;
  metrics?: PerformanceMetrics;
  resources?: ResourceUsage;
  createdAt: Date;
  startedAt?: Date;
  stoppedAt?: Date;
}
