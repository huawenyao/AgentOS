/**
 * EFIAgent 数据生成器
 * 基于精炼数据模型的稳定、一致性数据生成工具
 */

import {
  Agent,
  AgentState,
  AgentType,
  CoreCapability,
  CapabilityType,
  MaturityLevel,
  ExecutionStrategy,
  DataType,
  Message,
  MessageType,
  MessagePriority,
  MessageStatus,
  MonitoringMetric,
  MetricCategory,
  HealthStatus,
  LearningConfig,
  CollaborationConfig,
  PerformanceMetrics,
  ResourceRequirement,
  ResourceUsage,
  DataPort,
  ValidationRule,
  CapabilityConfig,
  AgentConfig,
  RetryPolicy,
  LoggingConfig,
  AgentMetrics,
  AgentMetadata,
  CapabilityMetadata
} from '../types/core';

// ===== 配置常量 =====

const CAPABILITY_NAMES = {
  [CapabilityType.COGNITIVE]: [
    '自然语言理解', '视觉场景理解', '语音识别', '多模态融合', '上下文感知'
  ],
  [CapabilityType.REASONING]: [
    '逻辑推理引擎', '因果推理分析', '概率推理计算', '时序推理', '类比推理'
  ],
  [CapabilityType.DECISION]: [
    '多目标决策', '风险评估分析', '优化求解器', '策略规划', '自适应决策'
  ],
  [CapabilityType.LEARNING]: [
    '强化学习优化', '迁移学习', '持续学习', '元学习', '监督学习'
  ]
};

const AGENT_NAMES = [
  '智能客服专员', '数据分析专家', '流程协调器', '知识管理师', '安全审计员',
  '性能监控员', '学习助手', '决策顾问', '推理引擎', '感知处理器'
];

const ORGANIZATIONS = [
  'EFIAgent Corp', 'AI Lab', 'Research Institute', 'Tech Innovation', 'Data Science Team'
];

const LICENSES = [
  'Apache-2.0', 'MIT', 'GPL-3.0', 'BSD-3-Clause', 'Commercial'
];

// ===== 工具函数 =====

/**
 * 生成随机ID
 */
function generateId(prefix: string): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}_${timestamp}_${random}`;
}

/**
 * 随机选择数组元素
 */
function randomChoice<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * 生成随机数
 */
function randomRange(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * 生成随机布尔值
 */
function randomBoolean(probability: number = 0.5): boolean {
  return Math.random() < probability;
}

/**
 * 生成随机日期（最近N天内）
 */
function randomDate(days: number = 30): Date {
  const now = new Date();
  const past = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));
  return new Date(past.getTime() + Math.random() * (now.getTime() - past.getTime()));
}

// ===== 数据端口生成器 =====

/**
 * 生成数据端口
 */
function generateDataPort(type: 'input' | 'output'): DataPort {
  const dataTypes = Object.values(DataType);
  const dataType = randomChoice(dataTypes);

  return {
    id: generateId(`${type}_port`),
    name: `${type === 'input' ? '输入' : '输出'}数据端口`,
    dataType,
    required: type === 'input' ? randomBoolean(0.7) : false,
    description: `${type === 'input' ? '接收' : '发送'}${dataType}类型数据`,
    validation: dataType === DataType.STRING ? {
      minLength: 1,
      maxLength: randomRange(100, 1000)
    } : dataType === DataType.NUMBER ? {
      min: 0,
      max: randomRange(100, 10000)
    } : undefined
  };
}

/**
 * 生成验证规则
 */
function generateValidationRule(): ValidationRule {
  const rules: ValidationRule = {};

  if (randomBoolean(0.3)) rules.minLength = randomRange(1, 10);
  if (randomBoolean(0.3)) rules.maxLength = randomRange(100, 1000);
  if (randomBoolean(0.3)) rules.min = 0;
  if (randomBoolean(0.3)) rules.max = randomRange(100, 10000);
  if (randomBoolean(0.2)) rules.pattern = '^[a-zA-Z0-9]+$';

  return rules;
}

// ===== 性能指标生成器 =====

/**
 * 生成性能指标
 */
function generatePerformanceMetrics(): PerformanceMetrics {
  return {
    latency: randomRange(50, 2000),
    throughput: randomRange(10, 1000),
    accuracy: randomRange(70, 99) / 100,
    reliability: randomRange(85, 99) / 100,
    resourceUsage: {
      cpu: randomRange(20, 90) / 100,
      memory: randomRange(30, 85) / 100,
      gpu: randomBoolean(0.3) ? randomRange(40, 80) / 100 : undefined
    }
  };
}

// ===== 资源需求生成器 =====

/**
 * 生成资源需求
 */
function generateResourceRequirement(): ResourceRequirement {
  return {
    cpu: `${randomRange(1, 8)} cores`,
    memory: `${randomRange(2, 32)}GB`,
    storage: randomBoolean(0.5) ? `${randomRange(10, 500)}GB` : undefined,
    gpu: randomBoolean(0.3) ? `${randomRange(1, 4)} GPU` : undefined,
    network: randomBoolean(0.4) ? `${randomRange(100, 1000)}Mbps` : undefined
  };
}

// ===== 元数据生成器 =====

/**
 * 生成能力元数据
 */
function generateCapabilityMetadata(): CapabilityMetadata {
  return {
    author: randomChoice(['AI Research Team', 'ML Engineering', 'Data Science Lab']),
    organization: randomChoice(ORGANIZATIONS),
    license: randomChoice(LICENSES),
    tags: [
      randomChoice(['ai', 'machine-learning', 'nlp', 'computer-vision', 'optimization']),
      randomChoice(['production', 'experimental', 'enterprise', 'opensource'])
    ],
    category: randomChoice(['nlp', 'vision', 'reasoning', 'optimization', 'learning']),
    complexity: randomChoice(['simple', 'moderate', 'complex']),
    rating: randomRange(30, 50) / 10,
    downloads: randomRange(100, 50000),
    verified: randomBoolean(0.7),
    documentation: randomBoolean(0.6) ? 'https://docs.efiagent.com' : undefined,
    lastUpdated: randomDate(90)
  };
}

/**
 * 生成Agent元数据
 */
function generateAgentMetadata(): AgentMetadata {
  const now = new Date();
  const created = randomDate(180);

  return {
    version: `${randomRange(1, 5)}.${randomRange(0, 9)}.${randomRange(0, 9)}`,
    author: randomChoice(['System Admin', 'AI Engineer', 'Platform Team']),
    organization: randomChoice(ORGANIZATIONS),
    createdAt: created,
    updatedAt: randomDate(30),
    tags: [
      randomChoice(['production', 'experimental', 'enterprise']),
      randomChoice(['ai', 'automation', 'intelligence'])
    ],
    description: randomChoice([
      '高性能智能体',
      '企业级解决方案',
      'AI原生架构设计',
      '可扩展智能服务'
    ]),
    usageCount: randomRange(0, 10000),
    lastUsed: randomBoolean(0.6) ? randomDate(7) : undefined
  };
}

// ===== 核心能力生成器 =====

/**
 * 生成核心能力模块
 */
export function generateCoreCapability(type?: CapabilityType): CoreCapability {
  const capabilityType = type || randomChoice(Object.values(CapabilityType));
  const name = randomChoice(CAPABILITY_NAMES[capabilityType]);

  return {
    id: generateId('capability'),
    name,
    description: `基于${capabilityType}能力的高性能${name}模块`,
    type: capabilityType,
    version: `${randomRange(1, 3)}.${randomRange(0, 9)}.${randomRange(0, 9)}`,
    maturityLevel: randomChoice(Object.values(MaturityLevel)),
    config: generateCapabilityConfig(),
    inputs: Array.from({ length: randomRange(1, 3) }, () => generateDataPort('input')),
    outputs: Array.from({ length: randomRange(1, 3) }, () => generateDataPort('output')),
    dependencies: randomBoolean(0.6) ? [generateId('capability')] : [],
    performance: generatePerformanceMetrics(),
    metadata: generateCapabilityMetadata()
  };
}

/**
 * 生成能力配置
 */
function generateCapabilityConfig(): CapabilityConfig {
  return {
    timeout: randomRange(5000, 60000),
    maxConcurrency: randomRange(1, 10),
    retryAttempts: randomRange(0, 3),
    features: {
      realtime: randomBoolean(0.5),
      batch: randomBoolean(0.7),
      streaming: randomBoolean(0.3),
      caching: randomBoolean(0.6),
      monitoring: randomBoolean(0.8)
    },
    resources: generateResourceRequirement()
  };
}

// ===== Agent生成器 =====

/**
 * 生成Agent
 */
export function generateAgent(type?: AgentType): Agent {
  const agentType = type || randomChoice(Object.values(AgentType));
  const name = randomChoice(AGENT_NAMES);

  // 生成关联的能力ID列表
  const capabilities = Array.from({ length: randomRange(2, 5) }, () => generateId('capability'));

  return {
    id: generateId('agent'),
    name,
    description: `基于AI原生架构的${name}，提供智能化的${agentType}服务`,
    type: agentType,
    state: randomChoice(Object.values(AgentState)),
    capabilities,
    config: generateAgentConfig(),
    metrics: generateAgentMetrics(),
    metadata: generateAgentMetadata()
  };
}

/**
 * 生成Agent配置
 */
function generateAgentConfig(): AgentConfig {
  return {
    maxConcurrency: randomRange(1, 20),
    timeout: randomRange(10000, 300000),
    retryPolicy: {
      maxAttempts: randomRange(1, 5),
      backoffStrategy: randomChoice(['linear', 'exponential']),
      baseDelay: randomRange(1000, 10000)
    },
    logging: {
      level: randomChoice(['debug', 'info', 'warn', 'error']),
      enableMetrics: randomBoolean(0.8),
      enableTracing: randomBoolean(0.6)
    },
    resources: generateResourceRequirement()
  };
}

/**
 * 生成Agent指标
 */
function generateAgentMetrics(): AgentMetrics {
  return {
    totalExecutions: randomRange(0, 10000),
    successRate: randomRange(70, 99) / 100,
    averageExecutionTime: randomRange(100, 10000),
    lastExecution: randomBoolean(0.7) ? randomDate(1) : undefined,
    errorCount: randomRange(0, 100),
    uptime: randomRange(1000, 1000000)
  };
}

// ===== 消息生成器 =====

/**
 * 生成消息
 */
export function generateMessage(): Message {
  const types = Object.values(MessageType);
  const priorities = Object.values(MessagePriority);
  const statuses = Object.values(MessageStatus);

  return {
    id: generateId('message'),
    senderId: generateId('agent'),
    receiverId: generateId('agent'),
    type: randomChoice(types),
    content: generateMessageContent(),
    priority: randomChoice(priorities),
    timestamp: randomDate(1),
    status: randomChoice(statuses)
  };
}

/**
 * 生成消息内容
 */
function generateMessageContent(): any {
  const contentTypes = ['task_request', 'data_response', 'status_update', 'error_report'];
  const type = randomChoice(contentTypes);

  switch (type) {
    case 'task_request':
      return {
        taskId: generateId('task'),
        taskType: 'data_analysis',
        parameters: { dataset: 'user_data_001' }
      };
    case 'data_response':
      return {
        requestId: generateId('request'),
        result: { status: 'success', data: [1, 2, 3, 4, 5] }
      };
    case 'status_update':
      return {
        agentId: generateId('agent'),
        status: 'running',
        progress: randomRange(0, 100)
      };
    case 'error_report':
      return {
        errorId: generateId('error'),
        message: 'Processing timeout',
        code: 500
      };
    default:
      return { message: 'Generic message content' };
  }
}

// ===== 监控数据生成器 =====

/**
 * 生成监控指标
 */
export function generateMonitoringMetric(): MonitoringMetric {
  const categories = Object.values(MetricCategory);
  const category = randomChoice(categories);

  return {
    id: generateId('metric'),
    name: generateMetricName(category),
    value: randomRange(0, 1000),
    unit: getMetricUnit(category),
    category,
    timestamp: new Date(),
    threshold: generateThreshold()
  };
}

/**
 * 生成指标名称
 */
function generateMetricName(category: MetricCategory): string {
  const names = {
    [MetricCategory.PERFORMANCE]: ['response_time', 'throughput', 'latency', 'cpu_usage'],
    [MetricCategory.RESOURCE]: ['memory_usage', 'disk_usage', 'network_io', 'gpu_usage'],
    [MetricCategory.ERROR]: ['error_rate', 'timeout_count', 'exception_count'],
    [MetricCategory.BUSINESS]: ['user_requests', 'task_completion', 'success_rate'],
    [MetricCategory.CUSTOM]: ['custom_metric_1', 'custom_metric_2']
  };

  return randomChoice(names[category] || [`${category}_metric`]);
}

/**
 * 获取指标单位
 */
function getMetricUnit(category: MetricCategory): string {
  const units = {
    [MetricCategory.PERFORMANCE]: randomChoice(['ms', 'req/s', '%']),
    [MetricCategory.RESOURCE]: randomChoice(['%', 'MB', 'GB', 'Mbps']),
    [MetricCategory.ERROR]: 'count',
    [MetricCategory.BUSINESS]: 'count',
    [MetricCategory.CUSTOM]: 'unit'
  };

  return units[category] || 'unit';
}

/**
 * 生成阈值
 */
function generateThreshold(): MonitoringMetric['threshold'] {
  return randomBoolean(0.6) ? {
    min: 0,
    max: randomRange(100, 1000),
    warning: randomRange(70, 90),
    critical: randomRange(85, 95)
  } : undefined;
}

/**
 * 生成健康状态
 */
export function generateHealthStatus(): HealthStatus {
  const statusOptions = ['healthy', 'degraded', 'unhealthy'];
  const checkStatuses = ['pass', 'fail', 'warn'];

  return {
    status: randomChoice(statusOptions) as HealthStatus['status'],
    checks: Array.from({ length: randomRange(3, 8) }, () => ({
      name: randomChoice(['database', 'api', 'service', 'cache', 'queue']),
      status: randomChoice(checkStatuses) as any,
      message: randomChoice(['All systems operational', 'Minor issues detected', 'Service unavailable']),
      duration: randomRange(10, 500),
      timestamp: new Date()
    })),
    timestamp: new Date()
  };
}

// ===== 配置生成器 =====

/**
 * 生成学习配置
 */
export function generateLearningConfig(): LearningConfig {
  return {
    enabled: randomBoolean(0.7),
    strategy: [
      {
        type: randomChoice(['supervised', 'reinforcement', 'unsupervised']),
        config: { learning_rate: randomRange(1, 100) / 100 },
        priority: randomRange(1, 5),
        enabled: true
      }
    ],
    dataCollection: {
      enabled: randomBoolean(0.8),
      anonymize: randomBoolean(0.9),
      retention: randomRange(30, 365),
      compression: randomBoolean(0.7)
    },
    modelManagement: {
      autoUpdate: randomBoolean(0.5),
      validationSet: generateId('dataset'),
      performanceThreshold: randomRange(70, 90) / 100,
      rollbackEnabled: randomBoolean(0.8)
    },
    evaluation: {
      metrics: ['accuracy', 'precision', 'recall', 'f1_score'],
      frequency: randomChoice(['real_time', 'batch', 'periodic']),
      reportGeneration: randomBoolean(0.6)
    }
  };
}

/**
 * 生成协作配置
 */
export function generateCollaborationConfig(): CollaborationConfig {
  return {
    enabled: randomBoolean(0.8),
    maxParticipants: randomRange(2, 20),
    communicationProtocol: randomChoice(['message_queue', 'direct', 'event_driven']),
    coordinationStrategy: randomChoice(['centralized', 'decentralized', 'hybrid'])
  };
}

// ===== 批量生成器 =====

/**
 * 生成批量核心能力
 */
export function generateCoreCapabilities(count: number = 10): CoreCapability[] {
  return Array.from({ length: count }, () => generateCoreCapability());
}

/**
 * 生成批量Agent
 */
export function generateAgents(count: number = 5): Agent[] {
  return Array.from({ length: count }, () => generateAgent());
}

/**
 * 生成批量消息
 */
export function generateMessages(count: number = 20): Message[] {
  return Array.from({ length: count }, () => generateMessage());
}

/**
 * 生成批量监控指标
 */
export function generateMonitoringMetrics(count: number = 15): MonitoringMetric[] {
  return Array.from({ length: count }, () => generateMonitoringMetric());
}

// ===== 默认导出 =====

export const DataGenerator = {
  // 单个生成器
  generateCoreCapability,
  generateAgent,
  generateMessage,
  generateMonitoringMetric,
  generateHealthStatus,
  generateLearningConfig,
  generateCollaborationConfig,

  // 批量生成器
  generateCoreCapabilities,
  generateAgents,
  generateMessages,
  generateMonitoringMetrics,

  // 工具函数
  generateId,
  randomChoice,
  randomRange,
  randomDate
};