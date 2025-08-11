/**
 * EFIAgent 2.0 能力系统模型类型定义
 * 基于认知、推理、决策、学习四大核心能力维度的系统化建模
 */

// 核心能力类型枚举
export enum CoreCapabilityType {
  COGNITIVE = 'cognitive',     // 认知能力
  REASONING = 'reasoning',     // 推理能力
  DECISION = 'decision',       // 决策能力
  LEARNING = 'learning'        // 学习能力
}

// 认知能力子类型
export enum CognitiveCapabilityType {
  PERCEPTION = 'perception',           // 感知处理
  UNDERSTANDING = 'understanding',     // 语义理解
  INTEGRATION = 'integration',         // 上下文整合
  MULTIMODAL = 'multimodal'           // 多模态融合
}

// 推理能力子类型
export enum ReasoningCapabilityType {
  LOGICAL = 'logical',                 // 逻辑推理
  CAUSAL = 'causal',                  // 因果推理
  PROBABILISTIC = 'probabilistic',     // 概率推理
  ANALOGICAL = 'analogical',          // 类比推理
  TEMPORAL = 'temporal'               // 时序推理
}

// 决策能力子类型
export enum DecisionCapabilityType {
  STRATEGIC = 'strategic',             // 战略决策
  ADAPTIVE = 'adaptive',              // 自适应决策
  COLLABORATIVE = 'collaborative',     // 协作决策
  OPTIMIZATION = 'optimization',       // 优化决策
  RISK_ASSESSMENT = 'risk_assessment'  // 风险评估
}

// 学习能力子类型
export enum LearningCapabilityType {
  SUPERVISED = 'supervised',           // 监督学习
  REINFORCEMENT = 'reinforcement',     // 强化学习
  TRANSFER = 'transfer',              // 迁移学习
  META = 'meta',                      // 元学习
  CONTINUAL = 'continual'             // 持续学习
}

// 能力来源类型
export enum CapabilitySourceType {
  BUILTIN = 'builtin',         // 内置能力
  MARKETPLACE = 'marketplace', // 市场能力
  CUSTOM = 'custom',           // 自定义能力
  INPUT_TOOLS = 'input_tools',         // 输入工具集成
  LLM_MODELS = 'llm_models',          // 大模型集成
  KNOWLEDGE_GRAPH = 'knowledge_graph', // 知识图谱
  EXTERNAL_API = 'external_api',       // 外部API
  CUSTOM_MODULE = 'custom_module'      // 自定义模块
}

// 能力来源枚举
export enum CapabilitySource {
  BUILTIN = 'builtin',
  MARKETPLACE = 'marketplace',
  CUSTOM = 'custom',
}

// 能力分类枚举
export enum CapabilityCategory {
  PERCEPTION = 'perception',
  NLP = 'nlp',
  KNOWLEDGE_GRAPH = 'knowledge_graph',
  REASONING = 'reasoning',
  PLANNING = 'planning',
  DECISION_MAKING = 'decision_making',
  LEARNING = 'learning',
  CODE_GENERATION = 'code_generation',
  DATA_ANALYSIS = 'data_analysis',
  SIMULATION = 'simulation',
  AGENT_CONTROL = 'agent_control',
  SECURITY = 'security',
  MONITORING = 'monitoring',
  OTHER = 'other',
}

// 能力成熟度等级
export enum CapabilityMaturityLevel {
  INITIAL = 'initial',         // 初始级 - 基础能力部署
  MANAGED = 'managed',         // 管理级 - 能力标准化
  DEFINED = 'defined',         // 定义级 - 能力集成化
  QUANTIFIED = 'quantified',   // 量化级 - 能力优化化
  OPTIMIZED = 'optimized'      // 优化级 - 能力自进化
}

// 能力编排模式
export enum CapabilityOrchestrationMode {
  SEQUENTIAL = 'sequential',   // 顺序执行
  PARALLEL = 'parallel',       // 并行执行
  CONDITIONAL = 'conditional', // 条件执行
  PIPELINE = 'pipeline',       // 流水线执行
  ADAPTIVE = 'adaptive'        // 自适应执行
}

// Agent状态枚举
export enum AgentStatus {
  IDLE = 'idle',               // 空闲状态
  RUNNING = 'running',         // 运行中
  STOPPED = 'stopped',         // 已停止
  PAUSED = 'paused',          // 已暂停
  ERROR = 'error',            // 错误状态
  COMPLETED = 'completed',     // 已完成
  DEPLOYING = 'deploying',     // 部署中
  UPDATING = 'updating'        // 更新中
}

// 核心能力模块接口
export interface CoreCapabilityModule {
  id: string;
  name: string;
  description: string;
  type: CoreCapabilityType;
  subType: CognitiveCapabilityType | ReasoningCapabilityType | DecisionCapabilityType | LearningCapabilityType;
  version: string;
  maturityLevel: CapabilityMaturityLevel;
  source: CapabilitySource;
  category: CapabilityCategory;
  
  // 能力配置
  config: CapabilityModuleConfig;
  
  // 输入输出定义
  inputs: CapabilityInput[];
  outputs: CapabilityOutput[];
  
  // 依赖关系
  dependencies: CapabilityDependency[];
  
  // 性能指标
  metrics: CapabilityMetrics;
  
  // 资源需求
  resources: ResourceRequirement[];
  
  // 能力来源
  sources: CapabilitySourceDetail[];
  
  // 创建和更新信息
  createdAt: Date;
  updatedAt: Date;
  author: string;
  tags: string[];
  
  // 元数据信息
  metadata: CapabilityMetadata;
}

// 能力模块配置
export interface CapabilityModuleConfig {
  // 执行配置
  executionMode: 'sync' | 'async' | 'stream';
  timeout: number;
  retryPolicy: RetryPolicy;
  
  // 质量配置
  qualityThreshold: number;
  performanceTarget: PerformanceTarget;
  
  // 安全配置
  securityLevel: 'low' | 'medium' | 'high' | 'critical';
  accessControl: AccessControlConfig;
  
  // 监控配置
  monitoring: MonitoringConfig;
  
  // 自定义参数
  parameters: Record<string, any>;
}

// 能力输入定义
export interface CapabilityInput {
  id: string;
  name: string;
  description: string;
  dataType: string;
  required: boolean;
  validation: InputValidation;
  defaultValue?: any;
  examples: any[];
}

// 能力输出定义
export interface CapabilityOutput {
  id: string;
  name: string;
  description: string;
  dataType: string;
  schema: any;
  examples: any[];
}

// 能力依赖关系
export interface CapabilityDependency {
  capabilityId: string;
  type: 'required' | 'optional' | 'conditional';
  condition?: string;
  version?: string;
}

// 能力来源定义
export interface CapabilitySourceDetail {
  id: string;
  type: CapabilitySourceType;
  name: string;
  description: string;
  config: Record<string, any>;
  version: string;
  reliability: number; // 0-1之间的可靠性评分
}

// 输入验证规则
export interface InputValidation {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
  enum?: any[];
  custom?: string; // 自定义验证函数
}

// 性能目标
export interface PerformanceTarget {
  responseTime: number; // 毫秒
  throughput: number;   // 每秒处理数
  accuracy: number;     // 准确率 0-1
  availability: number; // 可用性 0-1
}

// 访问控制配置
export interface AccessControlConfig {
  authentication: boolean;
  authorization: string[];
  encryption: boolean;
  auditLog: boolean;
}

// 重试策略
export interface RetryPolicy {
  maxRetries: number;
  backoffStrategy: 'fixed' | 'exponential' | 'linear';
  initialDelay: number;
  maxDelay: number;
  retryableErrors: string[];
}

// 资源需求
export interface ResourceRequirement {
  type: 'cpu' | 'memory' | 'gpu' | 'storage' | 'network' | 'tokens';
  amount: number;
  unit: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

// 能力元数据
export interface CapabilityMetadata {
  author: string;
  organization: string;
  license: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  rating: number;
  downloads: number;
  featured: boolean;
  verified: boolean;
  documentation: string;
  examples: CapabilityExample[];
  changelog: ChangelogEntry[];
  tags: string[];
  implementation: {
    language: string;
    framework: string;
    dependencies: string[];
    resources: {
      cpu: string;
      memory: string;
      gpu?: string;
    };
  };
}

// 能力指标
export interface CapabilityMetrics {
  // 性能指标
  avgResponseTime: number;
  throughput: number;
  successRate: number;
  errorRate: number;
  
  // 质量指标
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  
  // 使用指标
  usageCount: number;
  activeUsers: number;
  
  // 资源指标
  avgCpuUsage: number;
  avgMemoryUsage: number;
  avgTokenUsage: number;
  
  // 时间戳
  lastUpdated: Date;
}

// 监控配置
export interface MonitoringConfig {
  enabled: boolean;
  metricsCollection: boolean;
  loggingLevel: 'debug' | 'info' | 'warn' | 'error';
  alerting: AlertingConfig;
  healthCheck: HealthCheckConfig;
}

// 告警配置
export interface AlertingConfig {
  enabled: boolean;
  thresholds: AlertThreshold[];
  channels: AlertChannel[];
}

// 告警阈值
export interface AlertThreshold {
  metric: string;
  operator: '>' | '<' | '>=' | '<=' | '==' | '!=';
  value: number;
  duration: number; // 持续时间（秒）
  severity: 'low' | 'medium' | 'high' | 'critical';
}

// 告警渠道
export interface AlertChannel {
  type: 'email' | 'slack' | 'webhook' | 'sms';
  config: Record<string, any>;
}

// 健康检查配置
export interface HealthCheckConfig {
  enabled: boolean;
  interval: number; // 检查间隔（秒）
  timeout: number;  // 超时时间（秒）
  failureThreshold: number;
  successThreshold: number;
}

// 能力编排器接口
export interface CapabilityOrchestrator {
  id: string;
  name: string;
  description: string;
  mode: CapabilityOrchestrationMode;
  
  // 编排规则
  rules: OrchestrationRule[];
  
  // 能力映射
  capabilityMapping: CapabilityMapping[];
  
  // 执行策略
  executionStrategy: ExecutionStrategy;
  
  // 优化配置
  optimization: OptimizationConfig;
}

// 编排规则
export interface OrchestrationRule {
  id: string;
  name: string;
  description?: string;
  condition: string; // 条件表达式
  action: OrchestrationAction;
  priority: number;
}

// 编排动作
export interface OrchestrationAction {
  type: 'route' | 'transform' | 'aggregate' | 'filter' | 'cache';
  target: string;
  parameters: Record<string, any>;
}

// 能力映射
export interface CapabilityMapping {
  id: string;
  sourceCapability: string;
  targetCapability: string;
  transformation?: DataTransformation;
  condition?: string;
  description?: string;
}

// 数据转换
export interface DataTransformation {
  type: 'map' | 'filter' | 'reduce' | 'custom';
  expression: string;
  parameters: Record<string, any>;
}

// 执行策略
export interface ExecutionStrategy {
  loadBalancing: 'round_robin' | 'least_connections' | 'weighted' | 'random';
  failover: boolean;
  circuitBreaker: CircuitBreakerConfig;
  rateLimit: RateLimitConfig;
}

// 断路器配置
export interface CircuitBreakerConfig {
  enabled: boolean;
  failureThreshold: number;
  recoveryTimeout: number;
  halfOpenMaxCalls: number;
}

// 限流配置
export interface RateLimitConfig {
  enabled: boolean;
  requestsPerSecond: number;
  burstSize: number;
  strategy: 'token_bucket' | 'sliding_window' | 'fixed_window';
}

// 优化配置
export interface OptimizationConfig {
  enabled: boolean;
  autoScaling: AutoScalingConfig;
  caching: CachingConfig;
  prefetching: PrefetchingConfig;
}

// 自动扩缩容配置
export interface AutoScalingConfig {
  enabled: boolean;
  minInstances: number;
  maxInstances: number;
  targetCpuUtilization: number;
  targetMemoryUtilization: number;
  scaleUpCooldown: number;
  scaleDownCooldown: number;
}

// 缓存配置
export interface CachingConfig {
  enabled: boolean;
  strategy: 'lru' | 'lfu' | 'ttl' | 'custom';
  maxSize: number;
  ttl: number; // 生存时间（秒）
}

// 预取配置
export interface PrefetchingConfig {
  enabled: boolean;
  strategy: 'predictive' | 'scheduled' | 'manual';
  lookaheadTime: number; // 预取提前时间（秒）
}

// Agent 2.0 定义
export interface Agent2_0 {
  id: string;
  name: string;
  description: string;
  version: string;
  status: AgentStatus;  // Agent运行状态
  
  // 核心能力配置
  capabilities: CoreCapabilityModule[];
  
  // 能力编排器
  orchestrator: CapabilityOrchestrator;
  
  // 知识图谱配置
  knowledgeGraph: KnowledgeGraphConfig;
  
  // 学习配置
  learningConfig: LearningConfig;
  
  // 协作配置
  collaborationConfig: CollaborationConfig;
  
  // 部署配置
  deploymentConfig: DeploymentConfig;
  
  // 元数据
  metadata: AgentMetadata;
}

// 知识图谱配置
export interface KnowledgeGraphConfig {
  enabled: boolean;
  ontologyLayers: OntologyLayer[];
  factLayers: FactLayer[];
  ruleLayers: RuleLayer[];
  temporalLayers: TemporalLayer[];
  updateStrategy: 'real_time' | 'batch' | 'hybrid';
}

// 本体层
export interface OntologyLayer {
  id: string;
  name: string;
  concepts: Concept[];
  relations: Relation[];
  constraints: Constraint[];
}

// 概念定义
export interface Concept {
  id: string;
  name: string;
  description: string;
  properties: ConceptProperty[];
  parentConcepts: string[];
  childConcepts: string[];
}

// 概念属性
export interface ConceptProperty {
  name: string;
  type: string;
  required: boolean;
  defaultValue?: any;
}

// 关系定义
export interface Relation {
  id: string;
  name: string;
  description: string;
  sourceType: string;
  targetType: string;
  properties: RelationProperty[];
}

// 关系属性
export interface RelationProperty {
  name: string;
  type: string;
  required: boolean;
}

// 约束定义
export interface Constraint {
  id: string;
  name: string;
  type: 'cardinality' | 'domain' | 'range' | 'custom';
  expression: string;
}

// 事实层
export interface FactLayer {
  id: string;
  name: string;
  facts: Fact[];
  updateFrequency: number; // 更新频率（秒）
}

// 事实定义
export interface Fact {
  id: string;
  subject: string;
  predicate: string;
  object: string;
  confidence: number; // 置信度 0-1
  timestamp: Date;
  source: string;
}

// 规则层
export interface RuleLayer {
  id: string;
  name: string;
  rules: InferenceRule[];
}

// 推理规则
export interface InferenceRule {
  id: string;
  name: string;
  condition: string; // 条件表达式
  conclusion: string; // 结论表达式
  confidence: number; // 规则置信度
  priority: number;
}

// 时序层
export interface TemporalLayer {
  id: string;
  name: string;
  timeOntology: TimeOntology;
  temporalFacts: TemporalFact[];
  changeTracking: ChangeTrackingConfig;
}

// 时间本体
export interface TimeOntology {
  granularity: 'second' | 'minute' | 'hour' | 'day' | 'month' | 'year';
  timezone: string;
  calendar: string;
}

// 时序事实
export interface TemporalFact {
  id: string;
  fact: Fact;
  validTime: TimeInterval;
  transactionTime: TimeInterval;
}

// 时间间隔
export interface TimeInterval {
  start: Date;
  end?: Date;
}

// 变化追踪配置
export interface ChangeTrackingConfig {
  enabled: boolean;
  trackingLevel: 'entity' | 'property' | 'value';
  retentionPeriod: number; // 保留期（天）
}

// 学习配置
export interface LearningConfig {
  enabled: boolean;
  strategies: LearningStrategy[];
  dataCollection: DataCollectionConfig;
  modelManagement: ModelManagementConfig;
  evaluation: EvaluationConfig;
}

// 学习策略
export interface LearningStrategy {
  type: LearningCapabilityType;
  config: Record<string, any>;
  priority: number;
  enabled: boolean;
}

// 数据收集配置
export interface DataCollectionConfig {
  enabled: boolean;
  sources: DataSource[];
  preprocessing: PreprocessingConfig;
  privacy: PrivacyConfig;
}

// 数据源
export interface DataSource {
  id: string;
  type: 'interaction' | 'feedback' | 'performance' | 'external';
  config: Record<string, any>;
  enabled: boolean;
}

// 预处理配置
export interface PreprocessingConfig {
  normalization: boolean;
  deduplication: boolean;
  validation: boolean;
  transformation: DataTransformation[];
}

// 隐私配置
export interface PrivacyConfig {
  anonymization: boolean;
  encryption: boolean;
  accessControl: AccessControlConfig;
  retentionPolicy: RetentionPolicy;
}

// 保留策略
export interface RetentionPolicy {
  enabled: boolean;
  retentionPeriod: number; // 保留期（天）
  archiveStrategy: 'delete' | 'archive' | 'anonymize';
}

// 模型管理配置
export interface ModelManagementConfig {
  versioning: boolean;
  autoUpdate: boolean;
  rollbackPolicy: RollbackPolicy;
  performance_monitoring: boolean;
}

// 回滚策略
export interface RollbackPolicy {
  enabled: boolean;
  triggerConditions: string[];
  maxRollbackVersions: number;
}

// 评估配置
export interface EvaluationConfig {
  enabled: boolean;
  metrics: string[];
  frequency: number; // 评估频率（小时）
  benchmarks: Benchmark[];
}

// 基准测试
export interface Benchmark {
  id: string;
  name: string;
  description: string;
  dataset: string;
  metrics: string[];
  threshold: number;
}

// 协作配置
export interface CollaborationConfig {
  enabled: boolean;
  modes: CollaborationMode[];
  protocols: CommunicationProtocol[];
  governance: GovernanceConfig;
}

// 协作模式
export interface CollaborationMode {
  type: 'hierarchical' | 'peer_to_peer' | 'network' | 'hybrid';
  config: Record<string, any>;
  enabled: boolean;
}

// 通信协议
export interface CommunicationProtocol {
  type: 'http' | 'websocket' | 'grpc' | 'message_queue';
  config: Record<string, any>;
  security: SecurityConfig;
}

// 安全配置
export interface SecurityConfig {
  authentication: AuthenticationConfig;
  authorization: AuthorizationConfig;
  encryption: EncryptionConfig;
  audit: AuditConfig;
}

// 认证配置
export interface AuthenticationConfig {
  method: 'jwt' | 'oauth' | 'api_key' | 'certificate';
  config: Record<string, any>;
}

// 授权配置
export interface AuthorizationConfig {
  model: 'rbac' | 'abac' | 'custom';
  policies: AuthorizationPolicy[];
}

// 授权策略
export interface AuthorizationPolicy {
  id: string;
  name: string;
  rules: AuthorizationRule[];
}

// 授权规则
export interface AuthorizationRule {
  resource: string;
  action: string;
  condition?: string;
  effect: 'allow' | 'deny';
}

// 加密配置
export interface EncryptionConfig {
  inTransit: boolean;
  atRest: boolean;
  algorithm: string;
  keyManagement: KeyManagementConfig;
}

// 密钥管理配置
export interface KeyManagementConfig {
  provider: 'local' | 'hsm' | 'cloud_kms';
  rotation: boolean;
  rotationPeriod: number; // 轮换周期（天）
}

// 审计配置
export interface AuditConfig {
  enabled: boolean;
  events: string[];
  retention: number; // 保留期（天）
  storage: string;
}

// 治理配置
export interface GovernanceConfig {
  policies: GovernancePolicy[];
  compliance: ComplianceConfig;
  riskManagement: RiskManagementConfig;
}

// 治理策略
export interface GovernancePolicy {
  id: string;
  name: string;
  description: string;
  rules: GovernanceRule[];
  enforcement: 'advisory' | 'mandatory';
}

// 治理规则
export interface GovernanceRule {
  id: string;
  condition: string;
  action: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

// 合规配置
export interface ComplianceConfig {
  frameworks: string[]; // GDPR, HIPAA, SOX等
  requirements: ComplianceRequirement[];
  monitoring: boolean;
}

// 合规要求
export interface ComplianceRequirement {
  id: string;
  framework: string;
  requirement: string;
  implementation: string;
  status: 'compliant' | 'non_compliant' | 'partial';
}

// 风险管理配置
export interface RiskManagementConfig {
  enabled: boolean;
  riskAssessment: RiskAssessmentConfig;
  mitigation: RiskMitigationConfig;
  monitoring: RiskMonitoringConfig;
}

// 风险评估配置
export interface RiskAssessmentConfig {
  frequency: number; // 评估频率（天）
  criteria: RiskCriteria[];
  scoring: RiskScoringConfig;
}

// 风险标准
export interface RiskCriteria {
  category: string;
  factors: string[];
  weight: number;
}

// 风险评分配置
export interface RiskScoringConfig {
  method: 'qualitative' | 'quantitative' | 'hybrid';
  scale: 'low_medium_high' | 'numeric_1_10' | 'custom';
  thresholds: RiskThreshold[];
}

// 风险阈值
export interface RiskThreshold {
  level: string;
  minScore: number;
  maxScore: number;
  actions: string[];
}

// 风险缓解配置
export interface RiskMitigationConfig {
  strategies: RiskMitigationStrategy[];
  automation: boolean;
}

// 风险缓解策略
export interface RiskMitigationStrategy {
  riskType: string;
  actions: string[];
  priority: number;
  automated: boolean;
}

// 风险监控配置
export interface RiskMonitoringConfig {
  enabled: boolean;
  indicators: RiskIndicator[];
  alerting: AlertingConfig;
}

// 风险指标
export interface RiskIndicator {
  name: string;
  metric: string;
  threshold: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}

// 部署配置
export interface DeploymentConfig {
  environment: 'development' | 'staging' | 'production';
  infrastructure: InfrastructureConfig;
  scaling: ScalingConfig;
  monitoring: MonitoringConfig;
  backup: BackupConfig;
}

// 基础设施配置
export interface InfrastructureConfig {
  platform: 'kubernetes' | 'docker' | 'serverless' | 'vm';
  resources: ResourceAllocation;
  networking: NetworkingConfig;
  storage: StorageConfig;
}

// 资源分配
export interface ResourceAllocation {
  cpu: ResourceSpec;
  memory: ResourceSpec;
  storage: ResourceSpec;
  gpu?: ResourceSpec;
}

// 资源规格
export interface ResourceSpec {
  request: number;
  limit: number;
  unit: string;
}

// 网络配置
export interface NetworkingConfig {
  ingress: IngressConfig;
  service: ServiceConfig;
  security: NetworkSecurityConfig;
}

// 入口配置
export interface IngressConfig {
  enabled: boolean;
  host: string;
  tls: boolean;
  annotations: Record<string, string>;
}

// 服务配置
export interface ServiceConfig {
  type: 'ClusterIP' | 'NodePort' | 'LoadBalancer';
  ports: ServicePort[];
}

// 服务端口
export interface ServicePort {
  name: string;
  port: number;
  targetPort: number;
  protocol: 'TCP' | 'UDP';
}

// 网络安全配置
export interface NetworkSecurityConfig {
  networkPolicies: boolean;
  firewallRules: FirewallRule[];
}

// 防火墙规则
export interface FirewallRule {
  name: string;
  direction: 'ingress' | 'egress';
  protocol: string;
  ports: number[];
  sources: string[];
  action: 'allow' | 'deny';
}

// 存储配置
export interface StorageConfig {
  type: 'persistent' | 'ephemeral' | 'shared';
  size: string;
  storageClass: string;
  backup: boolean;
}

// 扩缩容配置
export interface ScalingConfig {
  horizontal: HorizontalScalingConfig;
  vertical: VerticalScalingConfig;
}

// 水平扩缩容配置
export interface HorizontalScalingConfig {
  enabled: boolean;
  minReplicas: number;
  maxReplicas: number;
  targetCpuUtilization: number;
  targetMemoryUtilization: number;
}

// 垂直扩缩容配置
export interface VerticalScalingConfig {
  enabled: boolean;
  updateMode: 'Auto' | 'Initial' | 'Off';
  resourcePolicy: ResourcePolicy[];
}

// 资源策略
export interface ResourcePolicy {
  containerName: string;
  minAllowed: ResourceSpec;
  maxAllowed: ResourceSpec;
}

// 备份配置
export interface BackupConfig {
  enabled: boolean;
  schedule: string; // Cron表达式
  retention: number; // 保留期（天）
  storage: BackupStorageConfig;
}

// 备份存储配置
export interface BackupStorageConfig {
  type: 'local' | 's3' | 'gcs' | 'azure';
  config: Record<string, any>;
  encryption: boolean;
}

// Agent元数据
export interface AgentMetadata {
  author: string;
  organization: string;
  license: string;
  tags: string[];
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  rating: number;
  downloads: number;
  featured: boolean;
  createdAt: Date;
  updatedAt: Date;
  changelog: ChangelogEntry[];
}

// 变更日志条目
export interface ChangelogEntry {
  version: string;
  date: Date;
  changes: string[];
  breaking: boolean;
}

// 能力市场接口
export interface CapabilityMarketplace {
  id: string;
  name: string;
  description: string;
  capabilities: MarketplaceCapability[];
  categories: CapabilityCategory[];
  providers: CapabilityProvider[];
}

// 市场能力
export interface MarketplaceCapability {
  id: string;
  name: string;
  description: string;
  provider: string;
  version: string;
  type: CoreCapabilityType;
  pricing: PricingModel;
  rating: number;
  downloads: number;
  documentation: string;
  examples: CapabilityExample[];
  support: SupportInfo;
}

// 定价模型
export interface PricingModel {
  type: 'free' | 'freemium' | 'subscription' | 'pay_per_use';
  price: number;
  currency: string;
  billing: 'monthly' | 'yearly' | 'usage';
  tiers: PricingTier[];
}

// 定价层级
export interface PricingTier {
  name: string;
  price: number;
  features: string[];
  limits: Record<string, number>;
}

// 能力示例
export interface CapabilityExample {
  name: string;
  description: string;
  input: any;
  output: any;
  code: string;
}

// 支持信息
export interface SupportInfo {
  documentation: string;
  community: string;
  email?: string;
  phone?: string;
  sla?: ServiceLevelAgreement;
}

// 服务级别协议
export interface ServiceLevelAgreement {
  availability: number; // 可用性百分比
  responseTime: number; // 响应时间（小时）
  resolution: number;   // 解决时间（小时）
}

// 能力分类
export interface CapabilityCategoryDetail {
  id: string;
  name: string;
  description: string;
  icon: string;
  parentId?: string;
  subcategories: string[];
}

// 能力提供商
export interface CapabilityProvider {
  id: string;
  name: string;
  description: string;
  website: string;
  contact: ContactInfo;
  verification: ProviderVerification;
  capabilities: string[];
}

// 联系信息
export interface ContactInfo {
  email: string;
  phone?: string;
  address?: string;
  support: SupportInfo;
}

// 提供商验证
export interface ProviderVerification {
  verified: boolean;
  verificationDate: Date;
  certifications: string[];
  trustScore: number; // 0-100
}

// 工作流节点
export interface WorkflowNode {
  id: string;
  type: 'capability' | 'condition' | 'start' | 'end';
  name: string;
  description?: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  config: Record<string, any>;
  inputs: WorkflowNodeInput[];
  outputs: WorkflowNodeOutput[];
  capability?: CoreCapabilityModule;
  status?: 'idle' | 'running' | 'completed' | 'error';
}

// 工作流节点输入
export interface WorkflowNodeInput {
  id: string;
  name: string;
  type: string;
  required: boolean;
  value?: any;
  connected?: boolean;
}

// 工作流节点输出
export interface WorkflowNodeOutput {
  id: string;
  name: string;
  type: string;
  value?: any;
  connected?: boolean;
}

// 工作流边
export interface WorkflowEdge {
  id: string;
  sourceNodeId: string;
  sourceOutputId: string;
  targetNodeId: string;
  targetInputId: string;
  condition?: string;
  transformation?: DataTransformation;
  status?: 'idle' | 'active' | 'completed' | 'error';
}

// 工作流执行
export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled' | 'error';
  startTime: Date;
  endTime?: Date;
  currentNode?: string;
  nodeExecutions: NodeExecution[];
  metrics: ExecutionMetrics;
  progress?: number;
  error?: string;
}

// 节点执行
export interface NodeExecution {
  nodeId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  startTime?: Date;
  endTime?: Date;
  input?: any;
  output?: any;
  error?: string;
  metrics: NodeExecutionMetrics;
}

// 执行指标
export interface ExecutionMetrics {
  totalDuration: number;
  nodeCount: number;
  successCount: number;
  failureCount: number;
  averageNodeDuration: number;
  throughput: number;
}

// 节点执行指标
export interface NodeExecutionMetrics {
  duration: number;
  cpuUsage: number;
  memoryUsage: number;
  tokenUsage?: number;
  retryCount: number;
}

// 任务规划相关接口
export interface TaskPlan {
  id: string;
  name: string;
  description: string;
  tasks: SubTask[];
  dependencies: TaskDependency[];
  estimatedDuration: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'planning' | 'ready' | 'executing' | 'completed' | 'failed';
}

export interface SubTask {
  id: string;
  name: string;
  description: string;
  requiredCapabilities: string[];
  inputs: Record<string, any>;
  outputs: Record<string, any>;
  estimatedDuration: number;
  status: 'pending' | 'ready' | 'executing' | 'completed' | 'failed';
}

export interface TaskDependency {
  sourceTaskId: string;
  targetTaskId: string;
  type: 'sequential' | 'parallel' | 'conditional';
  condition?: string;
}

// 能力分配相关接口
export interface CapabilityAllocation {
  taskId: string;
  capabilityId: string;
  instanceId: string;
  priority: number;
  resourceAllocation: TaskResourceAllocation;
  estimatedCost: number;
}

export interface TaskResourceAllocation {
  cpu: number;
  memory: number;
  gpu?: number;
  tokens?: number;
}

// 协调结果接口
export interface CoordinationResult {
  success: boolean;
  allocations: CapabilityAllocation[];
  conflicts: Conflict[];
  recommendations: string[];
  estimatedPerformance: PerformanceEstimate;
}

export interface Conflict {
  type: 'resource' | 'dependency' | 'capability';
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  resolution?: string;
}

export interface PerformanceEstimate {
  totalDuration: number;
  throughput: number;
  resourceUtilization: number;
  costEstimate: number;
}

// 优化结果接口
export interface OptimizationResult {
  originalPlan: TaskPlan;
  optimizedPlan: TaskPlan;
  improvements: Improvement[];
  metrics: OptimizationMetrics;
}

export interface Improvement {
  type: 'performance' | 'cost' | 'resource' | 'reliability';
  description: string;
  impact: number; // 改进幅度百分比
}

export interface OptimizationMetrics {
  performanceGain: number;
  costReduction: number;
  resourceEfficiency: number;
  reliabilityImprovement: number;
}