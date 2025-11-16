/**
 * 向后兼容的类型别名
 * 将新的精炼类型映射到旧的类型名称，确保现有代码正常工作
 */

import {
  // 核心类型
  Agent,
  CoreCapability,
  CapabilityType,
  MaturityLevel,
  ExecutionStrategy,
  AgentState,
  AgentType,
  DataType,
  Message,
  MessageType,
  MessagePriority,
  MessageStatus,
  MonitoringMetric,
  MetricCategory,
  HealthStatus,
  LearningConfig,
  LearningStrategy,
  DataCollectionConfig,
  ModelManagementConfig,
  EvaluationConfig,
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
  CapabilityMetadata,
  HealthCheck
} from './core';

// ===== Agent相关类型别名 =====

export type Agent2_0 = Agent;
// AgentConfig和AgentMetadata已在core中定义，无需重复导出
export type AgentStatus = AgentState;
export type AgentTypeEnum = AgentType;

// ===== 能力相关类型别名 =====

export type CoreCapabilityModule = CoreCapability;
export type CapabilityMaturityLevel = MaturityLevel;
export type CoreCapabilityType = CapabilityType;

// 子类型别名（为了向后兼容）
export enum CognitiveCapabilityType {
  PERCEPTION = 'perception',
  UNDERSTANDING = 'understanding',
  INTEGRATION = 'integration',
  MULTIMODAL = 'multimodal'
}

export enum ReasoningCapabilityType {
  LOGICAL = 'logical',
  CAUSAL = 'causal',
  PROBABILISTIC = 'probabilistic',
  ANALOGICAL = 'analogical',
  TEMPORAL = 'temporal'
}

export enum DecisionCapabilityType {
  STRATEGIC = 'strategic',
  ADAPTIVE = 'adaptive',
  COLLABORATIVE = 'collaborative',
  OPTIMIZATION = 'optimization',
  RISK_ASSESSMENT = 'risk_assessment'
}

export enum LearningCapabilityType {
  SUPERVISED = 'supervised',
  REINFORCEMENT = 'reinforcement',
  TRANSFER = 'transfer',
  META = 'meta',
  CONTINUAL = 'continual'
}

// ===== 其他枚举别名 =====

export enum CapabilitySource {
  BUILTIN = 'builtin',
  MARKETPLACE = 'marketplace',
  CUSTOM = 'custom'
}

export enum CapabilityCategory {
  COGNITIVE = 'cognitive',
  NLP = 'nlp',
  VISION = 'vision',
  REASONING = 'reasoning',
  LEARNING = 'learning',
  SECURITY = 'security',
  MONITORING = 'monitoring',
  COLLABORATION = 'collaboration',
  OTHER = 'other'
}

export enum CapabilityOrchestrationMode {
  SEQUENTIAL = 'sequential',
  PARALLEL = 'parallel',
  CONDITIONAL = 'conditional',
  PIPELINE = 'pipeline',
  ADAPTIVE = 'adaptive'
}

// ===== 向后兼容的接口扩展 =====

// 扩展CoreCapability以兼容旧的接口
export interface ExtendedCoreCapability extends CoreCapability {
  // 添加旧接口中存在但新接口中没有的字段
  subType?: CognitiveCapabilityType | ReasoningCapabilityType | DecisionCapabilityType | LearningCapabilityType;
  source?: CapabilitySource;
  category?: CapabilityCategory;
  sources?: Array<{
    id: string;
    type: string;
    name: string;
    description: string;
    config: Record<string, any>;
    version: string;
    reliability: number;
  }>;
  createdAt?: Date;
  updatedAt?: Date;
  author?: string;
  tags?: string[];
  dependencies?: Array<{
    capabilityId: string;
    type: 'required' | 'optional' | 'conditional';
    condition?: string;
    version?: string;
  }>;
}

// 扩展Agent以兼容旧的接口
export interface ExtendedAgent extends Agent {
  // 添加旧接口中存在的字段
  orchestrationConfig?: {
    mode: CapabilityOrchestrationMode;
    priority: number;
    executionTimeout: number;
    retryCount: number;
    errorHandling: 'stop' | 'continue' | 'fallback';
    rules: any[];
    capabilityMapping: any[];
    executionStrategy: ExecutionStrategy;
    optimization: any;
  };
  knowledgeGraph?: any;
  learningConfig?: LearningConfig;
  collaborationConfig?: CollaborationConfig;
  deploymentConfig?: any;
}

// ===== 工具类型 =====

/**
 * 将新的Agent类型转换为旧的Agent2_0类型
 */
export function toAgent2_0(agent: Agent): Agent2_0 {
  return agent as Agent2_0;
}

/**
 * 将新的CoreCapability转换为旧的CoreCapabilityModule
 */
export function toCoreCapabilityModule(capability: CoreCapability): ExtendedCoreCapability {
  const extended = capability as ExtendedCoreCapability;

  // 添加默认的兼容字段
  if (!extended.subType) {
    extended.subType = getDefaultSubType(capability.type);
  }

  if (!extended.source) {
    extended.source = CapabilitySource.BUILTIN;
  }

  if (!extended.category) {
    extended.category = getDefaultCategory(capability.type);
  }

  if (!extended.createdAt) {
    extended.createdAt = new Date();
  }

  if (!extended.updatedAt) {
    extended.updatedAt = new Date();
  }

  if (!extended.author) {
    extended.author = capability.metadata.author;
  }

  if (!extended.tags) {
    extended.tags = capability.metadata.tags;
  }

  if (!extended.dependencies) {
    extended.dependencies = capability.dependencies.map(dep => ({
      capabilityId: dep,
      type: 'required' as const
    }));
  }

  if (!extended.sources) {
    extended.sources = [{
      id: generateId('source'),
      type: 'builtin',
      name: 'Built-in Capability',
      description: 'System built-in capability',
      config: {},
      version: capability.version,
      reliability: capability.performance.reliability
    }];
  }

  return extended;
}

/**
 * 获取默认子类型
 */
function getDefaultSubType(type: CapabilityType): CognitiveCapabilityType | ReasoningCapabilityType | DecisionCapabilityType | LearningCapabilityType {
  switch (type) {
    case CapabilityType.COGNITIVE:
      return CognitiveCapabilityType.UNDERSTANDING;
    case CapabilityType.REASONING:
      return ReasoningCapabilityType.LOGICAL;
    case CapabilityType.DECISION:
      return DecisionCapabilityType.ADAPTIVE;
    case CapabilityType.LEARNING:
      return LearningCapabilityType.SUPERVISED;
    default:
      return LearningCapabilityType.SUPERVISED;
  }
}

/**
 * 获取默认类别
 */
function getDefaultCategory(type: CapabilityType): CapabilityCategory {
  switch (type) {
    case CapabilityType.COGNITIVE:
      return CapabilityCategory.COGNITIVE;
    case CapabilityType.REASONING:
      return CapabilityCategory.REASONING;
    case CapabilityType.DECISION:
      return CapabilityCategory.OTHER;
    case CapabilityType.LEARNING:
      return CapabilityCategory.LEARNING;
    default:
      return CapabilityCategory.OTHER;
  }
}

/**
 * 生成简单ID
 */
function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

// ===== 导出所有类型 =====

// 重新导出所有接口类型
export type {
  Agent,
  CoreCapability,
  CapabilityConfig,
  DataPort,
  ValidationRule,
  PerformanceMetrics,
  ResourceRequirement,
  ResourceUsage,
  CapabilityMetadata,
  AgentConfig,
  RetryPolicy,
  LoggingConfig,
  AgentMetrics,
  AgentMetadata,
  CollaborationConfig,
  Message,
  LearningConfig,
  LearningStrategy,
  DataCollectionConfig,
  ModelManagementConfig,
  EvaluationConfig,
  MonitoringMetric,
  HealthStatus,
  HealthCheck
};

// 重新导出所有枚举
export {
  AgentState,
  AgentType,
  CapabilityType,
  DataType,
  ExecutionStrategy,
  MaturityLevel,
  MessageType,
  MessagePriority,
  MessageStatus,
  MetricCategory
};