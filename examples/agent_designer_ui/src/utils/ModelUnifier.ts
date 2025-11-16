/**
 * 数据模型统一化工具
 * 解决前后端数据模型不一致问题，提供类型转换和验证功能
 */

import {
  CoreCapabilityModule,
  Agent2_0,
  CoreCapabilityType,
  CapabilityMaturityLevel,
  CapabilitySource,
  CapabilitySourceType,
  CapabilityCategory,
  CapabilityOrchestrationMode,
  AgentStatus
} from '../components/CapabilitySystemTypes';

// 后端数据模型接口定义
interface BackendCapability {
  id: string;
  name: string;
  description: string;
  type: string;
  category: string;
  version: string;
  maturity_level: string;
  config: {
    timeout: number;
    retry_count: number;
    security_level: string;
    access_control: {
      authentication: boolean;
      authorization: boolean;
      encryption: boolean;
    };
  };
  input_schema: any;
  output_schema: any;
  dependencies: Array<{
    capability_id: string;
    type: string;
    version_constraint?: string;
  }>;
  resources: Array<{
    type: string;
    amount: number;
    unit: string;
  }>;
  metrics?: {
    avg_response_time?: number;
    throughput?: number;
    error_rate?: number;
    availability?: number;
  };
  sources: Array<{
    type: string;
    provider: string;
    model?: string;
    endpoint?: string;
    config?: any;
  }>;
  metadata: {
    created_at: string;
    updated_at: string;
    author: string;
    tags: string[];
    documentation?: string;
    examples?: any[];
  };
}

interface BackendAgent {
  id: string;
  name: string;
  description: string;
  version: string;
  status: string;
  capabilities: string[]; // capability IDs
  orchestrator: {
    pattern: string;
    config: any;
  };
  knowledge_graph: {
    enabled: boolean;
    config: any;
  };
  learning: {
    enabled: boolean;
    config: any;
  };
  collaboration: {
    enabled: boolean;
    config: any;
  };
  deployment: {
    environment: string;
    config: any;
  };
  metadata: {
    created_at: string;
    updated_at: string;
    author: string;
    tags: string[];
  };
}

interface BackendOrchestrator {
  id: string;
  pattern: string;
  config: {
    execution_strategy: string;
    parallel_execution: boolean;
    error_handling: string;
    optimization: any;
  };
  flow_definition: any;
  metadata: {
    created_at: string;
    updated_at: string;
  };
}

// API响应接口
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// 转换错误类
class ModelConversionError extends Error {
  constructor(message: string, public details?: any) {
    super(message);
    this.name = 'ModelConversionError';
  }
}

// 验证错误类
class ModelValidationError extends Error {
  constructor(message: string, public field: string, public value?: any) {
    super(message);
    this.name = 'ModelValidationError';
  }
}

/**
 * 数据模型统一化器
 */
export class ModelUnifier {
  /**
   * 将后端能力模型转换为前端模型
   */
  static backendToFrontendCapability(backend: BackendCapability): CoreCapabilityModule {
    try {
      // 类型映射
      const typeMapping: Record<string, CoreCapabilityType> = {
        'cognitive': CoreCapabilityType.COGNITIVE,
        'reasoning': CoreCapabilityType.REASONING,
        'decision': CoreCapabilityType.DECISION,
        'learning': CoreCapabilityType.LEARNING
      };

      // 成熟度映射
      const maturityMapping: Record<string, CapabilityMaturityLevel> = {
        'experimental': CapabilityMaturityLevel.INITIAL,
        'alpha': CapabilityMaturityLevel.INITIAL,
        'beta': CapabilityMaturityLevel.MANAGED,
        'stable': CapabilityMaturityLevel.DEFINED,
        'deprecated': CapabilityMaturityLevel.INITIAL
      };

      // 分类映射
      const categoryMapping: Record<string, CapabilityCategory> = {
        'perception': CapabilityCategory.PERCEPTION,
        'cognition': CapabilityCategory.NLP,
        'reasoning': CapabilityCategory.REASONING,
        'decision': CapabilityCategory.DECISION_MAKING,
        'action': CapabilityCategory.AGENT_CONTROL,
        'learning': CapabilityCategory.LEARNING,
        'memory': CapabilityCategory.DATA_ANALYSIS,
        'communication': CapabilityCategory.NLP
      };

      const frontend: CoreCapabilityModule = {
        id: backend.id,
        name: backend.name,
        description: backend.description,
        type: typeMapping[backend.type] || CoreCapabilityType.COGNITIVE,
        subType: 'understanding' as any,
        category: categoryMapping[backend.category] || CapabilityCategory.OTHER,
        version: backend.version,
        maturityLevel: maturityMapping[backend.maturity_level] || 'stable',
        source: CapabilitySource.CUSTOM,
        config: {
          executionMode: 'sync' as const,
          timeout: backend.config.timeout,
          retryPolicy: {
            maxRetries: backend.config.retry_count,
            backoffStrategy: 'exponential' as const,
            initialDelay: 1000,
            maxDelay: 30000,
            retryableErrors: ['timeout', 'network_error']
          },
          qualityThreshold: 0.8,
          performanceTarget: {
            responseTime: 5000,
            throughput: 100,
            accuracy: 0.95,
            availability: 0.99
          },
          securityLevel: backend.config.security_level as 'low' | 'medium' | 'high' | 'critical',
          accessControl: {
            authentication: backend.config.access_control.authentication,
            authorization: backend.config.access_control.authorization ? ['admin'] : [],
            encryption: backend.config.access_control.encryption,
            auditLog: false
          },
          monitoring: {
            enabled: true,
            metricsCollection: true,
            loggingLevel: 'info' as const,
            alerting: {
              enabled: false,
              thresholds: [],
              channels: []
            },
            healthCheck: {
              enabled: true,
              interval: 30,
              timeout: 5,
              failureThreshold: 3,
              successThreshold: 1
            }
          },
          parameters: {}
        },
        inputs: [],
        outputs: [],
        dependencies: backend.dependencies.map(dep => ({
          capabilityId: dep.capability_id,
          type: dep.type as 'required' | 'optional',
          versionConstraint: dep.version_constraint
        })),
        resources: backend.resources.map(res => ({
          type: res.type as 'cpu' | 'memory' | 'gpu' | 'storage' | 'network' | 'tokens',
          amount: res.amount,
          unit: res.unit,
          priority: 'medium' as const
        })),
        metrics: {
          avgResponseTime: backend.metrics?.avg_response_time || 0,
          throughput: backend.metrics?.throughput || 0,
          successRate: backend.metrics ? (1 - (backend.metrics.error_rate || 0)) : 1,
          errorRate: backend.metrics?.error_rate || 0,
          accuracy: 0.95,
          precision: 0.95,
          recall: 0.95,
          f1Score: 0.95,
          usageCount: 0,
          activeUsers: 0,
          avgCpuUsage: 0,
          avgMemoryUsage: 0,
          avgTokenUsage: 0,
          lastUpdated: new Date()
        },
        sources: backend.sources.map(source => ({
          id: source.provider,
          type: source.type as CapabilitySourceType,
          name: source.provider,
          description: `${source.type} source provided by ${source.provider}`,
          config: source.config || {},
          version: source.model || '1.0.0',
          reliability: 0.95
        })),
        createdAt: new Date(backend.metadata.created_at),
        updatedAt: new Date(backend.metadata.updated_at),
        author: backend.metadata.author,
        tags: backend.metadata.tags,
        metadata: {
          author: backend.metadata.author,
          organization: '',
          license: '',
          category: '',
          complexity: 'medium' as 'simple' | 'medium' | 'complex',
          difficulty: 'intermediate' as const,
          rating: 0,
          downloads: 0,
          featured: false,
          verified: false,
          documentation: backend.metadata.documentation || '',
          examples: backend.metadata.examples || [],
          changelog: [],
          tags: backend.metadata.tags,
          implementation: {
            language: 'typescript',
            framework: 'react',
            dependencies: [],
            resources: {
              cpu: '1 core',
              memory: '512MB'
            }
          }
        }
      };

      // 验证转换结果
      this.validateCapability(frontend);
      return frontend;
    } catch (error) {
      throw new ModelConversionError(
        `Failed to convert backend capability to frontend: ${error instanceof Error ? error.message : String(error)}`,
        { backend, error }
      );
    }
  }

  /**
   * 将前端能力模型转换为后端模型
   */
  static frontendToBackendCapability(frontend: CoreCapabilityModule): BackendCapability {
    try {
      const backend: BackendCapability = {
        id: frontend.id,
        name: frontend.name,
        description: frontend.description,
        type: frontend.type,
        category: frontend.category,
        version: frontend.version,
        maturity_level: frontend.maturityLevel,
        config: {
          timeout: frontend.config.timeout,
          retry_count: frontend.config.retryPolicy.maxRetries,
          security_level: frontend.config.securityLevel,
          access_control: {
            authentication: frontend.config.accessControl.authentication,
            authorization: frontend.config.accessControl.authorization.length > 0,
            encryption: frontend.config.accessControl.encryption
          }
        },
        input_schema: frontend.inputs,
        output_schema: frontend.outputs,
        dependencies: frontend.dependencies.map(dep => ({
          capability_id: dep.capabilityId,
          type: dep.type,
          version: dep.version
        })),
        resources: frontend.resources.map(res => ({
          type: res.type,
          amount: res.amount,
          unit: res.unit
        })),
        metrics: frontend.metrics ? {
          avg_response_time: frontend.metrics.avgResponseTime,
          throughput: frontend.metrics.throughput,
          error_rate: frontend.metrics.errorRate
        } : undefined,
        sources: frontend.sources.map(source => ({
          type: source.type,
          provider: source.name || 'unknown',
          model: source.version,
          endpoint: source.description,
          config: source.config
        })),
        metadata: {
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          author: frontend.metadata.author,
          tags: frontend.metadata.tags,
          documentation: frontend.metadata.documentation,
          examples: frontend.metadata.examples
        }
      };

      return backend;
    } catch (error: any) {
      throw new ModelConversionError(
        `Failed to convert frontend capability to backend: ${error.message}`,
        { frontend, error }
      );
    }
  }

  /**
   * 将后端Agent模型转换为前端模型
   */
  static backendToFrontendAgent(
    backend: BackendAgent, 
    capabilities: CoreCapabilityModule[]
  ): Agent2_0 {
    try {
      // 状态映射
      const statusMapping: Record<string, AgentStatus> = {
        'idle': AgentStatus.IDLE,
        'busy': AgentStatus.RUNNING,
        'error': AgentStatus.ERROR,
        'offline': AgentStatus.STOPPED
      };

      const frontend: Agent2_0 = {
        id: backend.id,
        name: backend.name,
        description: backend.description,
        version: backend.version,
        type: 'agent',  // 默认类型
        status: statusMapping[backend.status] || 'idle',
        capabilities: capabilities.filter(cap => backend.capabilities.includes(cap.id)),
        orchestrator: {
          id: `${backend.id}_orchestrator`,
          name: `${backend.name} Orchestrator`,
          description: `Orchestrator for ${backend.name}`,
          mode: backend.orchestrator.pattern as any,
          priority: 1,
          executionTimeout: 30000,
          retryCount: 3,
          errorHandling: 'continue' as 'stop' | 'continue' | 'fallback',
          rules: backend.orchestrator.config.flow_definition || [],
          capabilityMapping: [],
          executionStrategy: {
            loadBalancing: 'round_robin',
            failover: false,
            circuitBreaker: {
              enabled: false,
              failureThreshold: 5,
              recoveryTimeout: 30000,
              halfOpenMaxCalls: 3
            },
            rateLimit: {
              enabled: false,
              requestsPerSecond: 100,
              burstSize: 10,
              strategy: 'token_bucket'
            }
          },
          optimization: {
            enabled: false,
            autoScaling: {
              enabled: false,
              minInstances: 1,
              maxInstances: 10,
              targetCpuUtilization: 70,
              targetMemoryUtilization: 80,
              scaleUpCooldown: 300,
              scaleDownCooldown: 600
            },
            caching: {
              enabled: false,
              strategy: 'lru',
              maxSize: 1000,
              ttl: 3600
            },
            prefetching: {
              enabled: false,
              strategy: 'predictive',
              lookaheadTime: 60
            }
          }
        },
        knowledgeGraph: {
          enabled: backend.knowledge_graph.enabled,
          ontologyLayers: [],
          factLayers: [],
          ruleLayers: [],
          temporalLayers: [],
          updateStrategy: 'real_time'
        },
        learningConfig: {
          enabled: backend.learning.enabled,
          strategies: [],
          dataCollection: {
             enabled: false,
             sources: [],
             preprocessing: {
               normalization: false,
               deduplication: false,
               validation: false,
               transformation: []
             },
             privacy: {
               anonymization: false,
               encryption: false,
               accessControl: {
                  authentication: false,
                  authorization: [],
                  encryption: false,
                  auditLog: false
                },
               retentionPolicy: {
                  enabled: false,
                  retentionPeriod: 30,
                  archiveStrategy: 'delete'
                }
             }
           },
          modelManagement: {
            versioning: false,
            autoUpdate: false,
            rollbackPolicy: {
              enabled: false,
              triggerConditions: [],
              maxRollbackVersions: 3
            },
            performance_monitoring: false
          },
          evaluation: {
            enabled: false,
            metrics: [],
            frequency: 24,
            benchmarks: []
          }
        },
        collaborationConfig: {
          enabled: backend.collaboration?.enabled || false,
          modes: [{
            type: 'hierarchical',
            config: {},
            enabled: true
          }],
          protocols: [{
             type: 'http',
             config: {},
             security: {
               authentication: {
                 method: 'jwt',
                 config: {}
               },
               authorization: {
                 model: 'rbac',
                 policies: []
               },
               encryption: {
                 inTransit: false,
                 atRest: false,
                 algorithm: 'AES-256',
                 keyManagement: {
                   provider: 'local',
                   rotation: false,
                   rotationPeriod: 90
                 }
               },
               audit: {
                 enabled: false,
                 events: [],
                 retention: 30,
                 storage: 'local'
               }
             }
           }],
          governance: {
            policies: [],
            compliance: {
              frameworks: [],
              requirements: [],
              monitoring: false
            },
            riskManagement: {
              enabled: false,
              riskAssessment: {
                frequency: 30,
                criteria: [],
                scoring: {
                  method: 'qualitative',
                  scale: 'low_medium_high',
                  thresholds: []
                }
              },
              mitigation: {
                strategies: [],
                automation: false
              },
              monitoring: {
                enabled: false,
                indicators: [],
                alerting: {
                  enabled: false,
                  thresholds: [],
                  channels: []
                }
              }
            }
          }
         },
         deploymentConfig: {
          environment: (backend.deployment.environment as 'development' | 'staging' | 'production') || 'development',
          infrastructure: {
            platform: 'docker' as 'kubernetes' | 'docker' | 'serverless' | 'vm',
            resources: {
              cpu: { request: 100, limit: 500, unit: 'millicores' },
              memory: { request: 128, limit: 512, unit: 'MB' },
              storage: { request: 1, limit: 10, unit: 'GB' }
            },
            networking: {
              ingress: {
                enabled: false,
                host: '',
                tls: false,
                annotations: {}
              },
              service: {
                type: 'ClusterIP',
                ports: []
              },
              security: {
                networkPolicies: false,
                firewallRules: []
              }
            },
            storage: {
              type: 'ephemeral',
              size: '1Gi',
              storageClass: 'standard',
              backup: false
            }
          },
          scaling: {
            horizontal: {
              enabled: false,
              minReplicas: 1,
              maxReplicas: 10,
              targetCpuUtilization: 70,
              targetMemoryUtilization: 80
            },
            vertical: {
              enabled: false,
              updateMode: 'Auto',
              resourcePolicy: []
            }
          },
          monitoring: {
            enabled: false,
            metricsCollection: false,
            loggingLevel: 'info',
            alerting: {
              enabled: false,
              thresholds: [],
              channels: []
            },
            healthCheck: {
              enabled: false,
              interval: 30,
              timeout: 5,
              failureThreshold: 3,
              successThreshold: 1
            }
          },
          backup: {
            enabled: false,
            schedule: '0 2 * * *',
            retention: 7,
            storage: {
              type: 'local',
              config: {},
              encryption: false
            }
          }
        },
        metadata: {
          author: backend.metadata.author,
          organization: 'Unknown',
          license: 'MIT',
          tags: backend.metadata.tags,
          category: 'general',
          difficulty: 'intermediate' as const,
          rating: 0,
          downloads: 0,
          featured: false,
          usageCount: 0,
          lastUsed: new Date(),
          createdAt: new Date(backend.metadata.created_at),
          updatedAt: new Date(backend.metadata.updated_at),
          changelog: [],
          performanceMetrics: {
            taskCompletionTime: 0,
            accuracy: 0,
            resourceUtilization: 0,
            learningImprovement: 0
          }
        }
      };

      // 验证转换结果
      this.validateAgent(frontend);
      return frontend;
    } catch (error: any) {
      throw new ModelConversionError(
        `Failed to convert backend agent to frontend: ${error.message}`,
        { backend, error }
      );
    }
  }

  /**
   * 将前端Agent模型转换为后端模型
   */
  static frontendToBackendAgent(frontend: Agent2_0): BackendAgent {
    try {
      const backend: BackendAgent = {
        id: frontend.id,
        name: frontend.name,
        description: frontend.description,
        version: frontend.version,
        status: frontend.status,
        capabilities: frontend.capabilities.map(cap => cap.id),
        orchestrator: {
          pattern: frontend.orchestrationConfig.mode,
          config: {
            execution_strategy: frontend.orchestrationConfig.executionStrategy?.loadBalancing || 'round_robin',
            parallel_execution: frontend.orchestrationConfig.mode === 'parallel',
            error_handling: 'stop',
            optimization: frontend.orchestrationConfig.optimization || {},
            flow_definition: frontend.orchestrationConfig.rules || []
          }
        },
        knowledge_graph: {
          enabled: frontend.knowledgeGraph?.enabled || false,
          config: frontend.knowledgeGraph || {}
        },
        learning: {
          enabled: frontend.learningConfig?.enabled || false,
          config: frontend.learningConfig || {}
        },
        collaboration: {
          enabled: frontend.collaborationConfig?.enabled || false,
          config: frontend.collaborationConfig || {}
        },
        deployment: {
          environment: frontend.deploymentConfig?.environment || 'development',
          config: frontend.deploymentConfig?.infrastructure || {}
        },
        metadata: {
          created_at: frontend.metadata.createdAt.toISOString(),
          updated_at: frontend.metadata.updatedAt.toISOString(),
          author: frontend.metadata.author,
          tags: frontend.metadata.tags
        }
      };

      return backend;
    } catch (error: any) {
      throw new ModelConversionError(
        `Failed to convert frontend agent to backend: ${error.message}`,
        { frontend, error }
      );
    }
  }

  /**
   * 验证能力模型
   */
  static validateCapability(capability: CoreCapabilityModule): void {
    if (!capability.id || typeof capability.id !== 'string') {
      throw new ModelValidationError('Capability ID is required and must be a string', 'id', capability.id);
    }

    if (!capability.name || typeof capability.name !== 'string') {
      throw new ModelValidationError('Capability name is required and must be a string', 'name', capability.name);
    }

    if (!capability.version || typeof capability.version !== 'string') {
      throw new ModelValidationError('Capability version is required and must be a string', 'version', capability.version);
    }

    // 验证版本格式 (semantic versioning)
    const versionRegex = /^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?(\+[a-zA-Z0-9.-]+)?$/;
    if (!versionRegex.test(capability.version)) {
      throw new ModelValidationError(
        'Capability version must follow semantic versioning format (x.y.z)',
        'version',
        capability.version
      );
    }

    // 验证配置
    if (capability.config.timeout <= 0) {
      throw new ModelValidationError(
        'Capability timeout must be greater than 0',
        'config.timeout',
        capability.config.timeout
      );
    }

    if (capability.config.retryPolicy && capability.config.retryPolicy.maxRetries < 0) {
      throw new ModelValidationError(
        'Capability retry count must be non-negative',
        'config.retryPolicy.maxRetries',
        capability.config.retryPolicy.maxRetries
      );
    }

    // 验证依赖
    capability.dependencies.forEach((dep, index) => {
      if (!dep.capabilityId || typeof dep.capabilityId !== 'string') {
        throw new ModelValidationError(
          `Dependency ${index} capability ID is required and must be a string`,
          `dependencies[${index}].capabilityId`,
          dep.capabilityId
        );
      }

      if (!['required', 'optional'].includes(dep.type)) {
        throw new ModelValidationError(
          `Dependency ${index} type must be 'required' or 'optional'`,
          `dependencies[${index}].type`,
          dep.type
        );
      }
    });

    // 验证资源
    capability.resources.forEach((res, index) => {
      if (res.amount <= 0) {
        throw new ModelValidationError(
          `Resource ${index} amount must be greater than 0`,
          `resources[${index}].amount`,
          res.amount
        );
      }
    });
  }

  /**
   * 验证Agent模型
   */
  static validateAgent(agent: Agent2_0): void {
    if (!agent.id || typeof agent.id !== 'string') {
      throw new ModelValidationError('Agent ID is required and must be a string', 'id', agent.id);
    }

    if (!agent.name || typeof agent.name !== 'string') {
      throw new ModelValidationError('Agent name is required and must be a string', 'name', agent.name);
    }

    if (!agent.version || typeof agent.version !== 'string') {
      throw new ModelValidationError('Agent version is required and must be a string', 'version', agent.version);
    }

    // 验证版本格式
    const versionRegex = /^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?(\+[a-zA-Z0-9.-]+)?$/;
    if (!versionRegex.test(agent.version)) {
      throw new ModelValidationError(
        'Agent version must follow semantic versioning format (x.y.z)',
        'version',
        agent.version
      );
    }

    // 验证能力列表
    if (!Array.isArray(agent.capabilities)) {
      throw new ModelValidationError('Agent capabilities must be an array', 'capabilities', agent.capabilities);
    }

    agent.capabilities.forEach((cap, index) => {
      try {
        this.validateCapability(cap);
      } catch (error: any) {
        throw new ModelValidationError(
          `Invalid capability at index ${index}: ${error.message}`,
          `capabilities[${index}]`,
          cap
        );
      }
    });

    // 验证编排器
    if (!agent.orchestrationConfig) {
      throw new ModelValidationError('Agent orchestrationConfig is required', 'orchestrationConfig', agent.orchestrationConfig);
    }

    if (!agent.orchestrationConfig.mode) {
      throw new ModelValidationError(
        'Agent orchestrationConfig mode is required',
        'orchestrationConfig.mode',
        agent.orchestrationConfig.mode
      );
    }
  }

  /**
   * 处理API响应
   */
  static handleApiResponse<T>(response: ApiResponse<T>): T {
    if (!response.success) {
      const error = response.error || { code: 'UNKNOWN_ERROR', message: 'Unknown error occurred' };
      throw new Error(`API Error [${error.code}]: ${error.message}`);
    }

    if (response.data === undefined) {
      throw new Error('API response data is missing');
    }

    return response.data;
  }

  /**
   * 批量转换能力列表
   */
  static batchConvertCapabilities(
    backendCapabilities: BackendCapability[]
  ): CoreCapabilityModule[] {
    const results: CoreCapabilityModule[] = [];
    const errors: Array<{ index: number; error: Error }> = [];

    backendCapabilities.forEach((backend, index) => {
      try {
        const frontend = this.backendToFrontendCapability(backend);
        results.push(frontend);
      } catch (error: any) {
        errors.push({ index, error: error.message || error });
      }
    });

    if (errors.length > 0) {
      console.warn('Some capabilities failed to convert:', errors);
    }

    return results;
  }

  /**
   * 深度克隆对象
   */
  static deepClone<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    if (obj instanceof Date) {
      return new Date(obj.getTime()) as unknown as T;
    }

    if (obj instanceof Array) {
      return obj.map(item => this.deepClone(item)) as unknown as T;
    }

    if (typeof obj === 'object') {
      const cloned = {} as T;
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          cloned[key] = this.deepClone(obj[key]);
        }
      }
      return cloned;
    }

    return obj;
  }

  /**
   * 比较两个模型是否相等
   */
  static isEqual(obj1: any, obj2: any): boolean {
    if (obj1 === obj2) {
      return true;
    }

    if (obj1 == null || obj2 == null) {
      return obj1 === obj2;
    }

    if (typeof obj1 !== typeof obj2) {
      return false;
    }

    if (typeof obj1 !== 'object') {
      return obj1 === obj2;
    }

    if (obj1 instanceof Date && obj2 instanceof Date) {
      return obj1.getTime() === obj2.getTime();
    }

    if (Array.isArray(obj1) && Array.isArray(obj2)) {
      if (obj1.length !== obj2.length) {
        return false;
      }
      for (let i = 0; i < obj1.length; i++) {
        if (!this.isEqual(obj1[i], obj2[i])) {
          return false;
        }
      }
      return true;
    }

    if (Array.isArray(obj1) || Array.isArray(obj2)) {
      return false;
    }

    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    if (keys1.length !== keys2.length) {
      return false;
    }

    for (const key of keys1) {
      if (!keys2.includes(key)) {
        return false;
      }
      if (!this.isEqual(obj1[key], obj2[key])) {
        return false;
      }
    }

    return true;
  }

  /**
   * 获取模型差异
   */
  static getDifferences(obj1: any, obj2: any, path: string = ''): Array<{
    path: string;
    type: 'added' | 'removed' | 'changed';
    oldValue?: any;
    newValue?: any;
  }> {
    const differences: Array<{
      path: string;
      type: 'added' | 'removed' | 'changed';
      oldValue?: any;
      newValue?: any;
    }> = [];

    if (obj1 === obj2) {
      return differences;
    }

    if (typeof obj1 !== typeof obj2) {
      differences.push({
        path,
        type: 'changed',
        oldValue: obj1,
        newValue: obj2
      });
      return differences;
    }

    if (typeof obj1 !== 'object' || obj1 === null || obj2 === null) {
      if (obj1 !== obj2) {
        differences.push({
          path,
          type: 'changed',
          oldValue: obj1,
          newValue: obj2
        });
      }
      return differences;
    }

    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);
    const allKeys = new Set([...keys1, ...keys2]);

    Array.from(allKeys).forEach(key => {
      const newPath = path ? `${path}.${key}` : key;
      
      if (!(key in obj1)) {
        differences.push({
          path: newPath,
          type: 'added',
          newValue: obj2[key]
        });
      } else if (!(key in obj2)) {
        differences.push({
          path: newPath,
          type: 'removed',
          oldValue: obj1[key]
        });
      } else {
        const subDifferences = this.getDifferences(obj1[key], obj2[key], newPath);
        differences.push(...subDifferences);
      }
    });

    return differences;
  }
}

// 导出错误类
export { ModelConversionError, ModelValidationError };

// 导出类型
export type {
  BackendCapability,
  BackendAgent,
  BackendOrchestrator,
  ApiResponse
};