import { Agent2_0, CoreCapabilityModule, AgentStatus, WorkflowDefinition } from '../components/CapabilitySystemTypes';

/**
 * 数据导入工具类
 * 用于将模拟数据导入到前端localStorage中
 */
export class DataImporter {
  /**
   * 导入数据分析专家模拟数据
   */
  static async importDataAnalysisExpertData(): Promise<void> {
    try {
      // 加载模拟数据文件
      const response = await fetch('/examples/data_analysis_expert_simulation.json');
      const simulationData = await response.json();

      // 转换并导入能力模块
      const capabilities = this.convertCapabilities(simulationData.capabilities);
      localStorage.setItem('capabilities_2_0', JSON.stringify(capabilities));

      // 转换并导入Agent
      const agents = this.convertAgents(simulationData.agents, capabilities);
      localStorage.setItem('agents_2_0', JSON.stringify(agents));

      // 转换并导入工作流
      const workflows = this.convertWorkflows(simulationData.workflows);
      localStorage.setItem('workflows_global', JSON.stringify(workflows));

      console.log('数据分析专家模拟数据导入成功');
    } catch (error) {
      console.error('导入数据失败:', error);
      throw error;
    }
  }

  /**
   * 转换能力模块数据
   */
  private static convertCapabilities(capabilitiesData: any): CoreCapabilityModule[] {
    return Object.values(capabilitiesData).map((cap: any) => ({
      id: cap.id,
      name: cap?.name || '未知能力',
      description: cap.description,
      type: this.mapCapabilityType(cap.type),
      subType: cap.sub_type || 'general',
      version: cap.version,
      maturityLevel: this.mapMaturityLevel(cap.maturity_level),
      source: 'CUSTOM' as any,
      category: this.mapCategory(cap.category),
      
      // 能力配置
      config: {
        executionMode: 'async' as const,
        timeout: cap.config?.timeout || 30000,
        retryPolicy: {
          maxRetries: cap.config?.retry_policy?.max_retries || 3,
          backoffStrategy: 'exponential' as const,
          initialDelay: 1000,
          maxDelay: 10000,
          retryableErrors: ['TIMEOUT', 'CONNECTION_ERROR']
        },
        qualityThreshold: cap.config?.quality_threshold || 0.8,
        performanceTarget: {
          responseTime: cap.config?.performance_target?.response_time || 5000,
          throughput: cap.config?.performance_target?.throughput || 100,
          accuracy: cap.config?.performance_target?.accuracy || 0.9,
          availability: cap.config?.performance_target?.availability || 0.99
        },
        securityLevel: 'medium' as const,
        accessControl: {
          authentication: true,
          authorization: ['user'],
          encryption: false,
          auditLog: true
        },
        monitoring: {
          enabled: true,
          metricsCollection: true,
          loggingLevel: 'info' as const,
          alerting: {
            enabled: true,
            thresholds: [],
            channels: []
          }
        },
        parameters: cap.config?.parameters || {}
      },
      
      // 输入输出定义
      inputs: cap.inputs || [],
      outputs: cap.outputs || [],
      
      // 依赖关系
      dependencies: cap.dependencies || [],
      
      // 性能指标
      metrics: cap.metrics || {
        executionTime: {
          average: 1000,
          p95: 2000,
          p99: 5000
        },
        accuracy: 0.95,
        throughput: {
          requestsPerSecond: 100,
          concurrentRequests: 10
        },
        reliability: {
          uptime: 0.99,
          errorRate: 0.01,
          mttr: 300
        }
      },
      
      // 资源需求
      resources: cap.resources || [],
      
      // 能力来源
      sources: cap.sources || [],
      
      // 创建和更新信息
      createdAt: cap.metadata?.created_at ? new Date(cap.metadata.created_at) : new Date(),
      updatedAt: cap.metadata?.updated_at ? new Date(cap.metadata.updated_at) : new Date(),
      author: cap.metadata?.author || 'System',
      tags: cap.metadata?.tags || [],
      
      // 元数据信息
      metadata: {
        author: cap.metadata?.author || 'System',
        organization: cap.metadata?.organization || 'EFIAgent',
        category: cap.metadata?.category || 'General',
        difficulty: cap.metadata?.difficulty || 'medium',
        rating: cap.metadata?.rating || 4.0,
        usageCount: cap.metadata?.usage_count || 0,
        lastUsed: cap.metadata?.last_used ? new Date(cap.metadata.last_used) : new Date(),
        createdAt: cap.metadata?.created_at ? new Date(cap.metadata.created_at) : new Date(),
        updatedAt: cap.metadata?.updated_at ? new Date(cap.metadata.updated_at) : new Date(),
        tags: cap.metadata?.tags || [],
        performanceMetrics: cap.metadata?.performance_metrics || {
          executionTime: 1000,
          accuracy: 0.95,
          resourceUsage: 0.7,
          errorRate: 0.01
        }
      }
    }));
  }

  /**
   * 转换Agent数据
   */
  private static convertAgents(agentsData: any, capabilities: CoreCapabilityModule[]): Agent2_0[] {
    return Object.values(agentsData).map((agent: any) => {
      const agentCapabilities = agent.capabilities?.map((capId: string) => 
        capabilities.find(cap => cap.id === capId)
      ).filter(Boolean) || [];

      return {
        id: agent.id,
        name: agent.name,
        description: agent.description,
        version: agent.version,
        type: 'agent',
        status: AgentStatus.IDLE,
        capabilities: agentCapabilities,
        orchestrator: {
          id: `${agent.id}_orchestrator`,
          name: `${agent.name} Orchestrator`,
          description: agent.orchestrator?.description || `Orchestrator for ${agent.name}`,
          mode: this.mapOrchestrationMode(agent.orchestrator?.mode),
          priority: agent.orchestrator?.priority || 1,
          executionTimeout: agent.orchestrator?.execution_timeout || 30000,
          retryCount: agent.orchestrator?.retry_count || 3,
          errorHandling: agent.orchestrator?.error_handling || 'continue',
          rules: agent.orchestrator?.rules || [],
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
          enabled: agent.knowledge_graph?.enabled || false,
          ontologyLayers: agent.knowledge_graph?.ontology_layers || [],
          factLayers: agent.knowledge_graph?.fact_layers || [],
          reasoningEngine: {
            enabled: false,
            type: 'rule_based',
            config: {}
          },
          updateStrategy: {
            mode: 'incremental',
            frequency: 'daily',
            conflictResolution: 'latest_wins'
          }
        },
        learningConfig: {
          enabled: false,
          algorithms: [],
          dataCollection: {
            enabled: false,
            sources: [],
            privacy: {
              anonymization: true,
              retention: 30,
              consent: true
            }
          },
          modelUpdate: {
            frequency: 'weekly',
            trigger: 'performance_degradation',
            validation: {
              enabled: true,
              metrics: ['accuracy', 'precision', 'recall'],
              threshold: 0.8
            }
          },
          feedback: {
            enabled: false,
            sources: ['user', 'system'],
            processing: {
              realTime: false,
              batchSize: 100,
              aggregation: 'weighted_average'
            }
          }
        },
        collaborationConfig: {
          enabled: false,
          protocols: [],
          trustModel: {
            enabled: false,
            algorithm: 'reputation_based',
            parameters: {}
          },
          communicationChannels: [],
          sharedResources: []
        },
        deploymentConfig: {
          environment: 'development',
          scalingPolicy: {
            enabled: false,
            minInstances: 1,
            maxInstances: 5,
            targetMetrics: []
          },
          resourceRequirements: {
            cpu: '100m',
            memory: '128Mi'
          },
          networking: {
            ports: [],
            ingress: {
              enabled: false,
              rules: []
            },
            service: {
              type: 'ClusterIP',
              ports: []
            }
          },
          security: {
            runAsNonRoot: true,
            readOnlyRootFilesystem: true,
            allowPrivilegeEscalation: false,
            capabilities: {
              drop: ['ALL']
            }
          },
          monitoring: {
            enabled: true,
            healthCheck: {
              enabled: true,
              path: '/health',
              port: 8080,
              initialDelaySeconds: 30,
              periodSeconds: 10
            },
            metrics: {
              enabled: true,
              path: '/metrics',
              port: 8080
            },
            logging: {
              enabled: true,
              level: 'info',
              format: 'json'
            }
          }
        },
        metadata: {
          author: agent.metadata?.author || 'System',
          organization: agent.metadata?.organization || 'EFIAgent',
          license: agent.metadata?.license || 'MIT',
          tags: agent.metadata?.tags || [],
          category: agent.metadata?.category || 'General',
          difficulty: agent.metadata?.difficulty || 'medium',
          rating: agent.metadata?.rating || 4.0,
          downloads: agent.metadata?.downloads || 0,
          featured: agent.metadata?.featured || false,
          usageCount: agent.metadata?.usage_count || 0,
          lastUsed: agent.metadata?.last_used ? new Date(agent.metadata.last_used) : new Date(),
          createdAt: agent.metadata?.created_at ? new Date(agent.metadata.created_at) : new Date(),
          updatedAt: agent.metadata?.updated_at ? new Date(agent.metadata.updated_at) : new Date(),
          changelog: agent.metadata?.changelog || [],
          performanceMetrics: agent.metadata?.performance_metrics || {
            taskCompletionTime: 45000,
            accuracy: 0.94,
            resourceUtilization: 0.78,
            learningImprovement: 0.02
          }
        },
      };
    });
  }

  /**
   * 转换工作流数据
   */
  private static convertWorkflows(workflowsData: any): WorkflowDefinition[] {
    return Object.values(workflowsData).map((workflow: any) => ({
      id: workflow.id,
      name: workflow.name,
      description: workflow.description,
      version: workflow.version,
      nodes: workflow.nodes || [],
      edges: workflow.edges || workflow.connections || [],
      variables: workflow.variables || [],
      triggers: workflow.triggers || [],
      metadata: {
        createdAt: workflow.metadata?.created_at ? new Date(workflow.metadata.created_at) : new Date(),
        updatedAt: workflow.metadata?.updated_at ? new Date(workflow.metadata.updated_at) : new Date(),
        author: workflow.metadata?.author || 'System',
        tags: workflow.metadata?.tags || [],
        category: workflow.metadata?.category || 'General',
        status: 'draft' as const,
        permissions: {
          read: [],
          write: [],
          execute: []
        }
      },
      orchestrationConfig: {
        mode: 'sequential' as const,
        timeout: 300000,
        retryPolicy: {
          maxRetries: 3,
          backoffStrategy: 'exponential' as const,
          initialDelay: 1000,
          maxDelay: 10000,
          retryableErrors: ['TIMEOUT', 'NETWORK_ERROR']
        },
        errorHandling: 'stop' as const
      }
    }));
  }

  /**
   * 映射能力类型
   */
  private static mapCapabilityType(type: string): CoreCapabilityType {
    const typeMapping: Record<string, CoreCapabilityType> = {
      'cognitive': CoreCapabilityType.COGNITIVE,
      'reasoning': CoreCapabilityType.REASONING, 
      'decision': CoreCapabilityType.DECISION,
      'learning': CoreCapabilityType.LEARNING,
      'data_processing': CoreCapabilityType.COGNITIVE,
      'visualization': CoreCapabilityType.COGNITIVE
    };
    return typeMapping[type] || CoreCapabilityType.COGNITIVE;
  }

  /**
   * 映射成熟度级别
   */
  private static mapMaturityLevel(level: string): string {
    const levelMapping: Record<string, string> = {
      'experimental': 'EXPERIMENTAL',
      'beta': 'BETA',
      'stable': 'STABLE',
      'managed': 'MANAGED'
    };
    return levelMapping[level] || 'STABLE';
  }

  /**
   * 映射分类
   */
  private static mapCategory(category: string): string {
    const categoryMapping: Record<string, string> = {
      'nlp': 'NLP',
      'cv': 'COMPUTER_VISION',
      'ml': 'MACHINE_LEARNING',
      'data': 'DATA_PROCESSING',
      'integration': 'INTEGRATION',
      'security': 'SECURITY'
    };
    return categoryMapping[category] || 'GENERAL';
  }

  /**
   * 映射编排模式
   */
  private static mapOrchestrationMode(mode: string): string {
    const modeMapping: Record<string, string> = {
      'sequential': 'SEQUENTIAL',
      'parallel': 'PARALLEL',
      'conditional': 'CONDITIONAL',
      'pipeline': 'PIPELINE'
    };
    return modeMapping[mode] || 'SEQUENTIAL';
  }

  /**
   * 清除所有localStorage数据
   */
  static clearAllData(): void {
    localStorage.removeItem('capabilities_2_0');
    localStorage.removeItem('agents_2_0');
    localStorage.removeItem('workflows_global');
    console.log('所有数据已清除');
  }

  /**
   * 检查数据是否已导入
   */
  static isDataImported(): boolean {
    const capabilities = localStorage.getItem('capabilities_2_0');
    const agents = localStorage.getItem('agents_2_0');
    const workflows = localStorage.getItem('workflows_global');
    
    return !!(capabilities && agents && workflows);
  }
}

export default DataImporter;