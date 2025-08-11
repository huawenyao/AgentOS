// mockData.ts
// EFIAgent 2.0 组件库模拟数据
// 提供能力模块、Agent、工作流等示例数据

import {
  CoreCapabilityModule,
  CoreCapabilityType,
  CognitiveCapabilityType,
  ReasoningCapabilityType,
  DecisionCapabilityType,
  LearningCapabilityType,
  CapabilityMaturityLevel,
  CapabilitySource,
  CapabilityCategory,
  CapabilitySourceType,
  Agent2_0,
  AgentStatus,
  CapabilityOrchestrationMode,
  WorkflowDefinition,
  WorkflowNode,
  WorkflowEdge,
  WorkflowExecution
} from '../components/CapabilitySystemTypes';

/**
 * 生成模拟能力模块数据
 * @returns 能力模块数组
 */
export const generateMockCapabilities = (): CoreCapabilityModule[] => {
  return [
    // ===== 1. 感知处理 (PERCEPTION) =====
    {
      id: 'cap-perception-multimodal-001',
      name: '多模态感知融合',
      description: '融合视觉、听觉、文本等多种模态信息，提供统一的感知理解',
      type: CoreCapabilityType.COGNITIVE,
      subType: CognitiveCapabilityType.MULTIMODAL,
      version: '2.0.0',
      maturityLevel: CapabilityMaturityLevel.OPTIMIZED,
      source: CapabilitySource.BUILTIN,
      category: CapabilityCategory.PERCEPTION,
      inputs: [
        {
          id: 'multimodal_input',
          name: 'multimodal_data',
          dataType: 'object',
          description: '多模态输入数据',
          required: true,
          validation: { type: 'object' },
          examples: [{
            name: '视频分析',
            description: '包含视频、音频和字幕的综合分析',
            value: {
              video: 'video_file.mp4',
              audio: 'audio_track.wav',
              text: '视频字幕内容'
            }
          }]
        }
      ],
      outputs: [],
      config: {
        executionMode: 'sync' as const,
        timeout: 30000,
        retryPolicy: {
          maxRetries: 3,
          backoffStrategy: 'exponential' as const,
          initialDelay: 1000,
          maxDelay: 10000,
          retryableErrors: ['timeout', 'network']
        },
        qualityThreshold: 0.8,
        performanceTarget: {
          responseTime: 1000,
          throughput: 100,
          accuracy: 0.9,
          availability: 0.99
        },
        securityLevel: 'medium' as const,
        accessControl: {
          authentication: true,
          authorization: ['read'],
          encryption: false,
          auditLog: true
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
      dependencies: [],
      metrics: {
        avgResponseTime: 500,
        throughput: 100,
        successRate: 0.95,
        errorRate: 0.05,
        accuracy: 0.9,
        precision: 0.88,
        recall: 0.92,
        f1Score: 0.9,
        usageCount: 1000,
        activeUsers: 50,
        avgCpuUsage: 0.3,
        avgMemoryUsage: 0.4,
        avgTokenUsage: 100,
        lastUpdated: new Date()
      },
      resources: [],
      sources: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      author: 'System',
      tags: [],
      metadata: {
        author: 'System',
        organization: 'EFIAgent',
        license: 'MIT',
        category: 'core',
        complexity: 'medium' as const,
        difficulty: 'intermediate' as const,
        rating: 4.5,
        downloads: 1000,
        featured: false,
        verified: true,
        documentation: 'Basic capability documentation',
        examples: [],
        changelog: [],
        tags: [],
        implementation: {
          language: 'TypeScript',
          framework: 'React',
          dependencies: [],
          resources: {
            cpu: '1 core',
            memory: '512MB'
          }
        }
      }
    },

    // ===== 6. 数据处理 (DATA_PROCESSING) =====
    {
      id: 'cap-data-etl-001',
      name: 'ETL数据处理',
      description: '提供数据提取、转换、加载的完整ETL流程处理能力',
      type: CoreCapabilityType.COGNITIVE,
      subType: CognitiveCapabilityType.UNDERSTANDING,
      version: '2.5.0',
      maturityLevel: CapabilityMaturityLevel.OPTIMIZED,
      source: CapabilitySource.BUILTIN,
      category: CapabilityCategory.DATA_ANALYSIS,
      inputs: [
        {
          id: 'data_source',
          name: 'source_config',
          dataType: 'object',
          description: '数据源配置',
          required: true,
          validation: { type: 'object' },
          examples: [{
            name: '数据库连接',
            description: '关系型数据库数据源',
            value: {
              type: 'mysql',
              host: 'localhost',
              database: 'sales_db',
              table: 'orders',
              query: 'SELECT * FROM orders WHERE date >= ?'
            }
          }]
        }
      ],
      outputs: [
        {
          id: 'processed_data',
          name: 'transformed_data',
          dataType: 'object',
          description: '处理后的数据',
          schema: undefined,
          examples: [{
            name: 'ETL结果',
            description: '数据处理输出',
            value: {
              records_processed: 15000,
              records_success: 14850,
              records_failed: 150,
              output_format: 'parquet',
              file_path: '/data/processed/orders_2024.parquet'
            }
          }]
        }
      ],
      config: {
        executionMode: 'async',
        timeout: 300000,
        retryPolicy: {
          maxRetries: 2,
          backoffStrategy: 'exponential',
          initialDelay: 5000,
          maxDelay: 30000,
          retryableErrors: ['connection_error', 'timeout']
        },
        qualityThreshold: 0.95,
        performanceTarget: {
          responseTime: 60000,
          throughput: 1000,
          accuracy: 0.98,
          availability: 0.99
        },
        securityLevel: 'high',
        accessControl: {
          authentication: true,
          authorization: ['read', 'execute', 'write'],
          encryption: true,
          auditLog: true
        },
        monitoring: {
          enabled: true,
          metricsCollection: true,
          loggingLevel: 'info',
          alerting: { enabled: true, thresholds: [], channels: [] },
          healthCheck: {
            enabled: true,
            interval: 120,
            timeout: 30,
            failureThreshold: 2,
            successThreshold: 1
          }
        },
        parameters: {
          batch_size: 1000,
          parallel_workers: 4,
          compression: 'gzip',
          data_validation: true
        }
      },
      dependencies: [],
      metrics: {
        avgResponseTime: 45000,
        throughput: 850,
        successRate: 0.99,
        errorRate: 0.01,
        accuracy: 0.98,
        precision: 0.97,
        recall: 0.99,
        f1Score: 0.98,
        usageCount: 2200,
        activeUsers: 65,
        avgCpuUsage: 60,
        avgMemoryUsage: 75,
        avgTokenUsage: 0,
        lastUpdated: new Date('2024-01-20')
      },
      resources: [
        { type: 'cpu', amount: 4, unit: 'cores', priority: 'high' },
        { type: 'memory', amount: 16, unit: 'GB', priority: 'high' }
      ],
      sources: [{
        id: 'etl_engine',
        type: CapabilitySourceType.BUILTIN,
        name: 'ETL Processing Engine',
        description: '内置ETL处理引擎',
        config: {},
        version: '2.5.0',
        reliability: 0.99
      }],
      createdAt: new Date('2023-05-10'),
      updatedAt: new Date('2024-01-18'),
      author: 'Data Engineering Team',
      tags: ['etl', 'data-processing', 'pipeline', 'transformation'],
      metadata: {
        author: 'Data Engineering Team',
        organization: 'EFIAgent Corp',
        license: 'MIT',
        category: 'data-engineering',
        complexity: 'medium',
        difficulty: 'intermediate',
        rating: 4.8,
        downloads: 3500,
        featured: true,
        verified: true,
        documentation: 'https://docs.efiagent.com/capabilities/etl-processing',
        examples: [],
        changelog: [],
        tags: ['etl', 'data-processing', 'pipeline', 'transformation'],
        implementation: {
          language: 'Python',
          framework: 'Apache Airflow',
          dependencies: ['pandas', 'sqlalchemy', 'pyarrow', 'apache-airflow'],
          runtime: 'Python 3.9+',
          gpu: false,
          distributed: true,
          resources: { cpu: '4 cores', memory: '16GB' }
        }
      }
    },

    // ===== 7. 工具集成 (TOOL_INTEGRATION) =====
    {
      id: 'cap-api-integration-001',
      name: 'API集成调用',
      description: '统一的API集成平台，支持REST、GraphQL、gRPC等多种协议',
      type: CoreCapabilityType.COGNITIVE,
      subType: CognitiveCapabilityType.INTEGRATION,
      version: '1.9.5',
      maturityLevel: CapabilityMaturityLevel.DEFINED,
      source: CapabilitySource.MARKETPLACE,
      category: CapabilityCategory.TOOL_INTEGRATION,
      inputs: [
        {
          id: 'api_request',
          name: 'request_config',
          dataType: 'object',
          description: 'API请求配置',
          required: true,
          validation: { type: 'object' },
          examples: [{
            name: 'REST API调用',
            description: '调用第三方REST API',
            value: {
              method: 'POST',
              url: 'https://api.example.com/v1/users',
              headers: { 'Content-Type': 'application/json' },
              body: { name: 'John Doe', email: 'john@example.com' }
            }
          }]
        }
      ],
      outputs: [
        {
          id: 'api_response',
          name: 'response_data',
          dataType: 'object',
          description: 'API响应数据',
          schema: undefined,
          examples: [{
            name: 'API响应',
            description: 'API调用返回结果',
            value: {
              status: 200,
              data: { id: 12345, name: 'John Doe', created_at: '2024-01-20T10:00:00Z' },
              headers: { 'content-type': 'application/json' },
              response_time: 250
            }
          }]
        }
      ],
      config: {
        executionMode: 'async',
        timeout: 30000,
        retryPolicy: {
          maxRetries: 3,
          backoffStrategy: 'exponential',
          initialDelay: 1000,
          maxDelay: 8000,
          retryableErrors: ['timeout', 'network_error', '5xx']
        },
        qualityThreshold: 0.9,
        performanceTarget: {
          responseTime: 2000,
          throughput: 200,
          accuracy: 0.95,
          availability: 0.98
        },
        securityLevel: 'high',
        accessControl: {
          authentication: true,
          authorization: ['read', 'execute'],
          encryption: true,
          auditLog: true
        },
        monitoring: {
          enabled: true,
          metricsCollection: true,
          loggingLevel: 'info',
          alerting: { enabled: true, thresholds: [], channels: [] },
          healthCheck: {
            enabled: true,
            interval: 60,
            timeout: 10,
            failureThreshold: 3,
            successThreshold: 1
          }
        },
        parameters: {
          connection_pool_size: 20,
          keep_alive: true,
          ssl_verify: true,
          follow_redirects: true
        }
      },
      dependencies: [],
      metrics: {
        avgResponseTime: 1800,
        throughput: 180,
        successRate: 0.97,
        errorRate: 0.03,
        accuracy: 0.96,
        precision: 0.95,
        recall: 0.97,
        f1Score: 0.96,
        usageCount: 15000,
        activeUsers: 250,
        avgCpuUsage: 30,
        avgMemoryUsage: 40,
        avgTokenUsage: 0,
        lastUpdated: new Date('2024-01-20')
      },
      resources: [
        { type: 'cpu', amount: 2, unit: 'cores', priority: 'medium' },
        { type: 'memory', amount: 4, unit: 'GB', priority: 'medium' }
      ],
      sources: [{
        id: 'api_gateway',
        type: CapabilitySourceType.EXTERNAL_API,
        name: 'Universal API Gateway',
        description: '通用API网关服务',
        config: { endpoint: 'https://gateway.efiagent.com' },
        version: '1.9.5',
        reliability: 0.97
      }],
      createdAt: new Date('2023-04-20'),
      updatedAt: new Date('2024-01-15'),
      author: 'Integration Team',
      tags: ['api', 'integration', 'rest', 'graphql', 'grpc'],
      metadata: {
        author: 'Integration Team',
        organization: 'EFIAgent Corp',
        license: 'Commercial',
        category: 'integration',
        complexity: 'medium',
        difficulty: 'beginner',
        rating: 4.4,
        downloads: 8500,
        featured: false,
        verified: true,
        documentation: 'https://docs.efiagent.com/capabilities/api-integration',
        examples: [],
        changelog: [],
        tags: ['api', 'integration', 'rest', 'graphql', 'grpc'],
        implementation: {
          language: 'Python',
          framework: 'FastAPI',
          dependencies: ['requests', 'aiohttp', 'graphql-core', 'grpcio'],
          runtime: 'Python 3.8+',
          gpu: false,
          distributed: false,
          resources: { cpu: '2 cores', memory: '4GB' }
        }
       }
     },

    // ===== 8. 情感分析 (SENTIMENT_ANALYSIS) =====
    {
      id: 'cap-sentiment-analysis-001',
      name: '情感分析',
      description: '基于深度学习的文本情感分析，支持多维度情感识别和情感强度评估',
      type: CoreCapabilityType.COGNITIVE,
      subType: CognitiveCapabilityType.UNDERSTANDING,
      version: '2.1.0',
      maturityLevel: CapabilityMaturityLevel.OPTIMIZED,
      source: CapabilitySource.BUILTIN,
      category: CapabilityCategory.SENTIMENT_ANALYSIS,
      inputs: [
        {
          id: 'text_input',
          name: 'text_content',
          dataType: 'string',
          description: '待分析的文本内容',
          required: true,
          validation: { type: 'string', minLength: 1, maxLength: 10000 },
          examples: [{
            name: '用户评论',
            description: '产品评论情感分析',
            value: '这个产品真的很棒，我非常满意！'
          }]
        }
      ],
      outputs: [
        {
          id: 'sentiment_result',
          name: 'sentiment_analysis',
          dataType: 'object',
          description: '情感分析结果',
          schema: undefined,
          examples: [{
            name: '情感分析结果',
            description: '包含情感极性、强度和置信度',
            value: {
              polarity: 'positive',
              intensity: 0.85,
              confidence: 0.92,
              emotions: {
                joy: 0.8,
                satisfaction: 0.9,
                excitement: 0.6
              }
            }
          }]
        }
      ],
      config: {
        executionMode: 'async',
        timeout: 5000,
        retryPolicy: {
          maxRetries: 2,
          backoffStrategy: 'exponential',
          initialDelay: 1000,
          maxDelay: 5000,
          retryableErrors: ['timeout', 'model_error']
        },
        qualityThreshold: 0.85,
        performanceTarget: {
          responseTime: 2000,
          throughput: 500,
          accuracy: 0.92,
          availability: 0.99
        },
        securityLevel: 'medium',
        accessControl: {
          authentication: true,
          authorization: ['read', 'execute'],
          encryption: false,
          auditLog: true
        },
        monitoring: {
          enabled: true,
          metricsCollection: true,
          loggingLevel: 'info',
          alerting: { enabled: true, thresholds: [], channels: [] },
          healthCheck: {
            enabled: true,
            interval: 60,
            timeout: 10,
            failureThreshold: 2,
            successThreshold: 1
          }
        },
        parameters: {
          model_type: 'transformer',
          language: 'zh-cn',
          multi_emotion: true,
          confidence_threshold: 0.7
        }
      },
      dependencies: [],
      metrics: {
        avgResponseTime: 1500,
        throughput: 450,
        successRate: 0.98,
        errorRate: 0.02,
        accuracy: 0.93,
        precision: 0.91,
        recall: 0.95,
        f1Score: 0.93,
        usageCount: 25000,
        activeUsers: 180,
        avgCpuUsage: 45,
        avgMemoryUsage: 60,
        avgTokenUsage: 150,
        lastUpdated: new Date('2024-01-20')
      },
      resources: [
        { type: 'cpu', amount: 2, unit: 'cores', priority: 'medium' },
        { type: 'memory', amount: 4, unit: 'GB', priority: 'medium' },
        { type: 'gpu', amount: 1, unit: 'units', priority: 'low' }
      ],
      sources: [{
        id: 'sentiment_model',
        type: CapabilitySourceType.LLM_MODELS,
        name: 'Sentiment Analysis Model',
        description: '基于BERT的情感分析模型',
        config: { model_path: '/models/sentiment_bert_v2.1' },
        version: '2.1.0',
        reliability: 0.98
      }],
      createdAt: new Date('2023-08-15'),
      updatedAt: new Date('2024-01-20'),
      author: 'NLP Team',
      tags: ['sentiment', 'emotion', 'nlp', 'analysis', 'bert'],
      metadata: {
        author: 'NLP Team',
        organization: 'EFIAgent Corp',
        license: 'MIT',
        category: 'nlp-analysis',
        complexity: 'medium',
        difficulty: 'intermediate',
        rating: 4.7,
        downloads: 12000,
        featured: true,
        verified: true,
        documentation: 'https://docs.efiagent.com/capabilities/sentiment-analysis',
        examples: [],
        changelog: [],
        tags: ['sentiment', 'emotion', 'nlp', 'analysis', 'bert'],
        implementation: {
          language: 'Python',
          framework: 'PyTorch',
          dependencies: ['transformers', 'torch', 'numpy', 'scikit-learn'],
          runtime: 'Python 3.8+',
          gpu: true,
          distributed: false,
          resources: { cpu: '2 cores', memory: '4GB', gpu: '1 GPU' }
        }
      }
    },

    // ===== 9. 意图识别 (INTENT_RECOGNITION) =====
    {
      id: 'cap-intent-recognition-001',
      name: '意图识别',
      description: '智能用户意图识别系统，支持多领域意图分类和实体抽取',
      type: CoreCapabilityType.COGNITIVE,
      subType: CognitiveCapabilityType.UNDERSTANDING,
      version: '1.8.0',
      maturityLevel: CapabilityMaturityLevel.DEFINED,
      source: CapabilitySource.BUILTIN,
      category: CapabilityCategory.INTENT_RECOGNITION,
      inputs: [
        {
          id: 'user_input',
          name: 'user_message',
          dataType: 'string',
          description: '用户输入的自然语言文本',
          required: true,
          validation: { type: 'string', minLength: 1, maxLength: 5000 },
          examples: [{
            name: '用户查询',
            description: '用户意图识别示例',
            value: '我想预订明天晚上8点的餐厅'
          }]
        }
      ],
      outputs: [
        {
          id: 'intent_result',
          name: 'recognized_intent',
          dataType: 'object',
          description: '识别的意图和实体信息',
          schema: undefined,
          examples: [{
            name: '意图识别结果',
            description: '包含意图类别、置信度和实体信息',
            value: {
              intent: 'book_restaurant',
              confidence: 0.89,
              entities: [
                { type: 'datetime', value: '明天晚上8点', normalized: '2024-01-21T20:00:00' },
                { type: 'service_type', value: '餐厅', normalized: 'restaurant' }
              ],
              domain: 'booking'
            }
          }]
        }
      ],
      config: {
        executionMode: 'async',
        timeout: 3000,
        retryPolicy: {
          maxRetries: 2,
          backoffStrategy: 'linear',
          initialDelay: 500,
          maxDelay: 2000,
          retryableErrors: ['timeout', 'model_unavailable']
        },
        qualityThreshold: 0.8,
        performanceTarget: {
          responseTime: 1500,
          throughput: 300,
          accuracy: 0.88,
          availability: 0.98
        },
        securityLevel: 'medium',
        accessControl: {
          authentication: true,
          authorization: ['read', 'execute'],
          encryption: false,
          auditLog: true
        },
        monitoring: {
          enabled: true,
          metricsCollection: true,
          loggingLevel: 'info',
          alerting: { enabled: true, thresholds: [], channels: [] },
          healthCheck: {
            enabled: true,
            interval: 30,
            timeout: 5,
            failureThreshold: 3,
            successThreshold: 1
          }
        },
        parameters: {
          model_type: 'joint_bert',
          domains: ['booking', 'weather', 'navigation', 'shopping'],
          entity_extraction: true,
          confidence_threshold: 0.6
        }
      },
      dependencies: [],
      metrics: {
        avgResponseTime: 1200,
        throughput: 280,
        successRate: 0.96,
        errorRate: 0.04,
        accuracy: 0.89,
        precision: 0.87,
        recall: 0.91,
        f1Score: 0.89,
        usageCount: 18000,
        activeUsers: 120,
        avgCpuUsage: 40,
        avgMemoryUsage: 55,
        avgTokenUsage: 120,
        lastUpdated: new Date('2024-01-18')
      },
      resources: [
        { type: 'cpu', amount: 2, unit: 'cores', priority: 'medium' },
        { type: 'memory', amount: 3, unit: 'GB', priority: 'medium' }
      ],
      sources: [{
        id: 'intent_model',
        type: CapabilitySourceType.LLM_MODELS,
        name: 'Intent Recognition Model',
        description: '基于Joint BERT的意图识别模型',
        config: { model_path: '/models/intent_joint_bert_v1.8' },
        version: '1.8.0',
        reliability: 0.96
      }],
      createdAt: new Date('2023-09-10'),
      updatedAt: new Date('2024-01-18'),
      author: 'Dialogue Team',
      tags: ['intent', 'nlu', 'entity', 'classification', 'bert'],
      metadata: {
        author: 'Dialogue Team',
        organization: 'EFIAgent Corp',
        license: 'MIT',
        category: 'dialogue-understanding',
        complexity: 'medium',
        difficulty: 'intermediate',
        rating: 4.5,
        downloads: 8500,
        featured: true,
        verified: true,
        documentation: 'https://docs.efiagent.com/capabilities/intent-recognition',
        examples: [],
        changelog: [],
        tags: ['intent', 'nlu', 'entity', 'classification', 'bert'],
        implementation: {
          language: 'Python',
          framework: 'PyTorch',
          dependencies: ['transformers', 'torch', 'spacy', 'numpy'],
          runtime: 'Python 3.8+',
          gpu: false,
          distributed: false,
          resources: { cpu: '2 cores', memory: '3GB' }
        }
      }
    },

    // ===== 10. 多理论对话管理 (DIALOGUE_MANAGEMENT) =====
    {
      id: 'cap-dialogue-management-001',
      name: '多理论对话管理',
      description: '基于多种对话理论的智能对话管理系统，支持任务导向、开放域和混合对话',
      type: CoreCapabilityType.REASONING,
      subType: ReasoningCapabilityType.LOGICAL,
      version: '2.3.0',
      maturityLevel: CapabilityMaturityLevel.OPTIMIZED,
      source: CapabilitySource.BUILTIN,
      category: CapabilityCategory.DIALOGUE_MANAGEMENT,
      inputs: [
        {
          id: 'dialogue_context',
          name: 'context_info',
          dataType: 'object',
          description: '对话上下文信息',
          required: true,
          validation: { type: 'object' },
          examples: [{
            name: '对话上下文',
            description: '包含历史对话和当前状态',
            value: {
              history: [
                { role: 'user', content: '我想预订酒店' },
                { role: 'assistant', content: '好的，请问您想预订哪个城市的酒店？' }
              ],
              current_intent: 'book_hotel',
              entities: { city: null, date: null, guests: null },
              dialogue_state: 'collecting_info'
            }
          }]
        }
      ],
      outputs: [
        {
          id: 'dialogue_action',
          name: 'next_action',
          dataType: 'object',
          description: '下一步对话动作',
          schema: undefined,
          examples: [{
            name: '对话动作',
            description: '系统下一步的对话策略',
            value: {
              action_type: 'request_info',
              response: '请问您想预订哪个城市的酒店？',
              slots_to_fill: ['city'],
              confidence: 0.92,
              strategy: 'task_oriented'
            }
          }]
        }
      ],
      config: {
        executionMode: 'async',
        timeout: 2000,
        retryPolicy: {
          maxRetries: 1,
          backoffStrategy: 'linear',
          initialDelay: 200,
          maxDelay: 1000,
          retryableErrors: ['timeout']
        },
        qualityThreshold: 0.85,
        performanceTarget: {
          responseTime: 800,
          throughput: 200,
          accuracy: 0.90,
          availability: 0.99
        },
        securityLevel: 'medium',
        accessControl: {
          authentication: true,
          authorization: ['read', 'execute'],
          encryption: false,
          auditLog: true
        },
        monitoring: {
          enabled: true,
          metricsCollection: true,
          loggingLevel: 'info',
          alerting: { enabled: true, thresholds: [], channels: [] },
          healthCheck: {
            enabled: true,
            interval: 30,
            timeout: 5,
            failureThreshold: 2,
            successThreshold: 1
          }
        },
        parameters: {
          dialogue_theories: ['task_oriented', 'open_domain', 'hybrid'],
          max_turns: 20,
          context_window: 10,
          fallback_strategy: 'clarification'
        }
      },
      dependencies: [
        {
          capabilityId: 'cap-intent-recognition-001',
          type: 'required',
          version: '1.8.0'
        }
      ],
      metrics: {
        avgResponseTime: 650,
        throughput: 180,
        successRate: 0.94,
        errorRate: 0.06,
        accuracy: 0.91,
        precision: 0.89,
        recall: 0.93,
        f1Score: 0.91,
        usageCount: 15000,
        activeUsers: 95,
        avgCpuUsage: 35,
        avgMemoryUsage: 50,
        avgTokenUsage: 200,
        lastUpdated: new Date('2024-01-19')
      },
      resources: [
        { type: 'cpu', amount: 2, unit: 'cores', priority: 'medium' },
        { type: 'memory', amount: 4, unit: 'GB', priority: 'medium' }
      ],
      sources: [{
        id: 'dialogue_engine',
        type: CapabilitySourceType.BUILTIN,
        name: 'Multi-Theory Dialogue Engine',
        description: '多理论对话管理引擎',
        config: { engine_version: '2.3.0' },
        version: '2.3.0',
        reliability: 0.94
      }],
      createdAt: new Date('2023-07-20'),
      updatedAt: new Date('2024-01-19'),
      author: 'Dialogue Team',
      tags: ['dialogue', 'conversation', 'management', 'multi-theory', 'nlg'],
      metadata: {
        author: 'Dialogue Team',
        organization: 'EFIAgent Corp',
        license: 'MIT',
        category: 'dialogue-system',
        complexity: 'complex',
        difficulty: 'advanced',
        rating: 4.6,
        downloads: 6500,
        featured: true,
        verified: true,
        documentation: 'https://docs.efiagent.com/capabilities/dialogue-management',
        examples: [],
        changelog: [],
        tags: ['dialogue', 'conversation', 'management', 'multi-theory', 'nlg'],
        implementation: {
          language: 'Python',
          framework: 'Custom',
          dependencies: ['rasa', 'transformers', 'networkx', 'numpy'],
          runtime: 'Python 3.9+',
          gpu: false,
          distributed: false,
          resources: { cpu: '2 cores', memory: '4GB' }
        }
      }
    },

    // ===== 11. 知识库查询 (KNOWLEDGE_BASE) =====
    {
      id: 'cap-knowledge-base-query-001',
      name: '知识库查询',
      description: '智能知识库查询系统，支持语义搜索、关联推理和知识融合',
      type: CoreCapabilityType.COGNITIVE,
      subType: CognitiveCapabilityType.INTEGRATION,
      version: '3.1.0',
      maturityLevel: CapabilityMaturityLevel.OPTIMIZED,
      source: CapabilitySource.BUILTIN,
      category: CapabilityCategory.KNOWLEDGE_BASE,
      inputs: [
        {
          id: 'query_input',
          name: 'search_query',
          dataType: 'object',
          description: '知识查询请求',
          required: true,
          validation: { type: 'object' },
          examples: [{
            name: '知识查询',
            description: '语义搜索查询示例',
            value: {
              query: '人工智能在医疗领域的应用',
              query_type: 'semantic_search',
              filters: { domain: 'healthcare', language: 'zh' },
              max_results: 10
            }
          }]
        }
      ],
      outputs: [
        {
          id: 'knowledge_results',
          name: 'search_results',
          dataType: 'object',
          description: '知识查询结果',
          schema: undefined,
          examples: [{
            name: '查询结果',
            description: '包含相关知识和置信度',
            value: {
              results: [
                {
                  id: 'kb_001',
                  title: 'AI在医疗诊断中的应用',
                  content: '人工智能技术在医疗诊断领域...',
                  relevance_score: 0.95,
                  source: 'medical_knowledge_base',
                  metadata: { domain: 'healthcare', type: 'article' }
                }
              ],
              total_count: 25,
              query_time: 150
            }
          }]
        }
      ],
      config: {
        executionMode: 'async',
        timeout: 5000,
        retryPolicy: {
          maxRetries: 2,
          backoffStrategy: 'exponential',
          initialDelay: 1000,
          maxDelay: 4000,
          retryableErrors: ['timeout', 'index_unavailable']
        },
        qualityThreshold: 0.8,
        performanceTarget: {
          responseTime: 2000,
          throughput: 100,
          accuracy: 0.88,
          availability: 0.98
        },
        securityLevel: 'high',
        accessControl: {
          authentication: true,
          authorization: ['read', 'execute'],
          encryption: true,
          auditLog: true
        },
        monitoring: {
          enabled: true,
          metricsCollection: true,
          loggingLevel: 'info',
          alerting: { enabled: true, thresholds: [], channels: [] },
          healthCheck: {
            enabled: true,
            interval: 60,
            timeout: 10,
            failureThreshold: 3,
            successThreshold: 1
          }
        },
        parameters: {
          search_engine: 'elasticsearch',
          embedding_model: 'sentence_transformers',
          similarity_threshold: 0.7,
          enable_reasoning: true
        }
      },
      dependencies: [],
      metrics: {
        avgResponseTime: 1800,
        throughput: 85,
        successRate: 0.97,
        errorRate: 0.03,
        accuracy: 0.89,
        precision: 0.86,
        recall: 0.92,
        f1Score: 0.89,
        usageCount: 22000,
        activeUsers: 150,
        avgCpuUsage: 50,
        avgMemoryUsage: 70,
        avgTokenUsage: 300,
        lastUpdated: new Date('2024-01-20')
      },
      resources: [
        { type: 'cpu', amount: 4, unit: 'cores', priority: 'high' },
        { type: 'memory', amount: 8, unit: 'GB', priority: 'high' },
        { type: 'storage', amount: 100, unit: 'GB', priority: 'medium' }
      ],
      sources: [{
        id: 'knowledge_engine',
        type: CapabilitySourceType.KNOWLEDGE_GRAPH,
        name: 'Knowledge Base Engine',
        description: '智能知识库查询引擎',
        config: { 
          index_path: '/data/knowledge_index',
          embedding_dim: 768
        },
        version: '3.1.0',
        reliability: 0.97
      }],
      createdAt: new Date('2023-06-15'),
      updatedAt: new Date('2024-01-20'),
      author: 'Knowledge Team',
      tags: ['knowledge', 'search', 'semantic', 'reasoning', 'qa'],
      metadata: {
        author: 'Knowledge Team',
        organization: 'EFIAgent Corp',
        license: 'MIT',
        category: 'knowledge-management',
        complexity: 'complex',
        difficulty: 'advanced',
        rating: 4.8,
        downloads: 9500,
        featured: true,
        verified: true,
        documentation: 'https://docs.efiagent.com/capabilities/knowledge-base-query',
        examples: [],
        changelog: [],
        tags: ['knowledge', 'search', 'semantic', 'reasoning', 'qa'],
        implementation: {
          language: 'Python',
          framework: 'Elasticsearch',
          dependencies: ['elasticsearch', 'sentence-transformers', 'faiss', 'numpy'],
          runtime: 'Python 3.9+',
          gpu: true,
          distributed: true,
          resources: { cpu: '4 cores', memory: '8GB' }
        }
      }
    },

    // ===== 12. 安全防护 (SECURITY) =====
    {
      id: 'cap-security-scan-001',
      name: '安全漏洞扫描',
      description: '全面的安全漏洞检测和风险评估系统',
      type: CoreCapabilityType.COGNITIVE,
      subType: ReasoningCapabilityType.LOGICAL,
      version: '3.2.1',
      maturityLevel: CapabilityMaturityLevel.OPTIMIZED,
      source: CapabilitySource.BUILTIN,
      category: CapabilityCategory.SECURITY,
      inputs: [
        {
          id: 'scan_target',
          name: 'target_config',
          dataType: 'object',
          description: '扫描目标配置',
          required: true,
          validation: { type: 'object' },
          examples: [{
            name: 'Web应用扫描',
            description: 'Web应用安全扫描配置',
            value: {
              type: 'web_application',
              url: 'https://example.com',
              scan_depth: 'deep',
              authentication: { type: 'basic', username: 'test', password: 'test' }
            }
          }]
        }
      ],
      outputs: [
        {
          id: 'security_report',
          name: 'vulnerability_report',
          dataType: 'object',
          description: '安全漏洞报告',
          schema: undefined,
          examples: [{
            name: '安全扫描报告',
            description: '漏洞扫描结果',
            value: {
              scan_id: 'scan_20240120_001',
              vulnerabilities_found: 12,
              critical: 2,
              high: 4,
              medium: 5,
              low: 1,
              risk_score: 7.8,
              recommendations: ['Update SSL certificate', 'Fix SQL injection']
            }
          }]
        }
      ],
      config: {
        executionMode: 'async',
        timeout: 600000,
        retryPolicy: {
          maxRetries: 1,
          backoffStrategy: 'linear',
          initialDelay: 10000,
          maxDelay: 30000,
          retryableErrors: ['network_error']
        },
        qualityThreshold: 0.98,
        performanceTarget: {
          responseTime: 300000,
          throughput: 10,
          accuracy: 0.99,
          availability: 0.99
        },
        securityLevel: 'critical',
        accessControl: {
          authentication: true,
          authorization: ['read', 'execute', 'admin'],
          encryption: true,
          auditLog: true
        },
        monitoring: {
          enabled: true,
          metricsCollection: true,
          loggingLevel: 'debug',
          alerting: { enabled: true, thresholds: [], channels: [] },
          healthCheck: {
            enabled: true,
            interval: 300,
            timeout: 60,
            failureThreshold: 1,
            successThreshold: 1
          }
        },
        parameters: {
          scan_intensity: 'aggressive',
          include_passive: true,
          check_ssl: true,
          check_headers: true
        }
      },
      dependencies: [],
      metrics: {
        avgResponseTime: 280000,
        throughput: 8,
        successRate: 0.99,
        errorRate: 0.01,
        accuracy: 0.99,
        precision: 0.98,
        recall: 0.99,
        f1Score: 0.985,
        usageCount: 850,
        activeUsers: 25,
        avgCpuUsage: 70,
        avgMemoryUsage: 60,
        avgTokenUsage: 0,
        lastUpdated: new Date('2024-01-20')
      },
      resources: [
        { type: 'cpu', amount: 8, unit: 'cores', priority: 'high' },
        { type: 'memory', amount: 32, unit: 'GB', priority: 'high' }
      ],
      sources: [{
        id: 'security_scanner',
        type: CapabilitySourceType.BUILTIN,
        name: 'Advanced Security Scanner',
        description: '高级安全扫描引擎',
        config: {},
        version: '3.2.1',
        reliability: 0.99
      }],
      createdAt: new Date('2023-03-15'),
      updatedAt: new Date('2024-01-18'),
      author: 'Security Team',
      tags: ['security', 'vulnerability', 'scanning', 'penetration-testing'],
      metadata: {
        author: 'Security Team',
        organization: 'EFIAgent Corp',
        license: 'Commercial',
        category: 'security',
        complexity: 'complex',
        difficulty: 'advanced',
        rating: 4.9,
        downloads: 1200,
        featured: true,
        verified: true,
        documentation: 'https://docs.efiagent.com/capabilities/security-scanning',
        examples: [],
        changelog: [],
        tags: ['security', 'vulnerability', 'scanning', 'penetration-testing'],
        implementation: {
          language: 'Python',
          framework: 'Custom Security Framework',
          dependencies: ['nmap', 'sqlmap', 'nikto', 'openvas'],
          runtime: 'Python 3.10+',
          gpu: false,
          distributed: true,
          resources: { cpu: '8 cores', memory: '32GB' }
        }
      }
    },

    // ===== 9. 监控分析 (MONITORING) =====
    {
      id: 'cap-system-monitor-001',
      name: '系统性能监控',
      description: '实时系统性能监控和异常检测',
      type: CoreCapabilityType.COGNITIVE,
      subType: CognitiveCapabilityType.PERCEPTION,
      version: '2.8.3',
      maturityLevel: CapabilityMaturityLevel.OPTIMIZED,
      source: CapabilitySource.BUILTIN,
      category: CapabilityCategory.MONITORING,
      inputs: [
        {
          id: 'monitor_config',
          name: 'monitoring_setup',
          dataType: 'object',
          description: '监控配置参数',
          required: true,
          validation: { type: 'object' },
          examples: [{
            name: '服务器监控',
            description: '服务器性能监控配置',
            value: {
              targets: ['server1.example.com', 'server2.example.com'],
              metrics: ['cpu', 'memory', 'disk', 'network'],
              interval: 60,
              thresholds: { cpu: 80, memory: 85, disk: 90 }
            }
          }]
        }
      ],
      outputs: [
        {
          id: 'monitor_data',
          name: 'performance_metrics',
          dataType: 'object',
          description: '性能监控数据',
          schema: undefined,
          examples: [{
            name: '监控报告',
            description: '系统性能数据',
            value: {
              timestamp: '2024-01-20T10:00:00Z',
              servers: {
                'server1': { cpu: 65, memory: 72, disk: 45, status: 'healthy' },
                'server2': { cpu: 78, memory: 68, disk: 52, status: 'warning' }
              },
              alerts: [{ server: 'server2', metric: 'cpu', value: 78, threshold: 75 }]
            }
          }]
        }
      ],
      config: {
        executionMode: 'stream',
        timeout: 0,
        retryPolicy: {
          maxRetries: 5,
          backoffStrategy: 'exponential',
          initialDelay: 1000,
          maxDelay: 10000,
          retryableErrors: ['connection_error', 'timeout']
        },
        qualityThreshold: 0.95,
        performanceTarget: {
          responseTime: 1000,
          throughput: 1000,
          accuracy: 0.98,
          availability: 0.999
        },
        securityLevel: 'medium',
        accessControl: {
          authentication: true,
          authorization: ['read', 'execute'],
          encryption: false,
          auditLog: true
        },
        monitoring: {
          enabled: true,
          metricsCollection: true,
          loggingLevel: 'info',
          alerting: { enabled: true, thresholds: [], channels: [] },
          healthCheck: {
            enabled: true,
            interval: 30,
            timeout: 10,
            failureThreshold: 3,
            successThreshold: 1
          }
        },
        parameters: {
          collection_interval: 60,
          retention_days: 30,
          aggregation_window: 300,
          alert_cooldown: 600
        }
      },
      dependencies: [],
      metrics: {
        avgResponseTime: 800,
        throughput: 950,
        successRate: 0.999,
        errorRate: 0.001,
        accuracy: 0.98,
        precision: 0.97,
        recall: 0.99,
        f1Score: 0.98,
        usageCount: 50000,
        activeUsers: 150,
        avgCpuUsage: 25,
        avgMemoryUsage: 30,
        avgTokenUsage: 0,
        lastUpdated: new Date('2024-01-20')
      },
      resources: [
        { type: 'cpu', amount: 2, unit: 'cores', priority: 'medium' },
        { type: 'memory', amount: 8, unit: 'GB', priority: 'medium' }
      ],
      sources: [{
        id: 'monitoring_engine',
        type: CapabilitySourceType.BUILTIN,
        name: 'Performance Monitoring Engine',
        description: '性能监控引擎',
        config: {},
        version: '2.8.3',
        reliability: 0.999
      }],
      createdAt: new Date('2023-02-10'),
      updatedAt: new Date('2024-01-19'),
      author: 'DevOps Team',
      tags: ['monitoring', 'performance', 'alerting', 'metrics'],
      metadata: {
        author: 'DevOps Team',
        organization: 'EFIAgent Corp',
        license: 'MIT',
        category: 'monitoring',
        complexity: 'medium',
        difficulty: 'intermediate',
        rating: 4.7,
        downloads: 5500,
        featured: true,
        verified: true,
        documentation: 'https://docs.efiagent.com/capabilities/system-monitoring',
        examples: [],
        changelog: [],
        tags: ['monitoring', 'performance', 'alerting', 'metrics'],
        implementation: {
          language: 'Go',
          framework: 'Prometheus + Grafana',
          dependencies: ['prometheus', 'grafana', 'alertmanager'],
          runtime: 'Go 1.19+',
          gpu: false,
          distributed: true,
          resources: { cpu: '2 cores', memory: '8GB' }
        }
      }
    },

    // ===== 10. 代码生成 (CODE_GENERATION) =====
    {
      id: 'cap-code-gen-001',
      name: '智能代码生成',
      description: '基于自然语言描述生成高质量代码',
      type: CoreCapabilityType.REASONING,
      subType: ReasoningCapabilityType.LOGICAL,
      version: '1.5.2',
      maturityLevel: CapabilityMaturityLevel.DEFINED,
      source: CapabilitySource.MARKETPLACE,
      category: CapabilityCategory.CODE_GENERATION,
      inputs: [
        {
          id: 'code_request',
          name: 'generation_spec',
          dataType: 'object',
          description: '代码生成规格',
          required: true,
          validation: { type: 'object' },
          examples: [{
            name: 'API接口生成',
            description: '生成REST API接口代码',
            value: {
              language: 'python',
              framework: 'fastapi',
              description: '创建用户管理API，包含CRUD操作',
              requirements: ['数据验证', '错误处理', '文档生成']
            }
          }]
        }
      ],
      outputs: [
        {
          id: 'generated_code',
          name: 'code_output',
          dataType: 'object',
          description: '生成的代码',
          schema: undefined,
          examples: [{
            name: '生成代码',
            description: '完整的代码实现',
            value: {
              files: [
                { name: 'main.py', content: 'from fastapi import FastAPI\napp = FastAPI()...' },
                { name: 'models.py', content: 'from pydantic import BaseModel...' }
              ],
              documentation: 'API文档说明',
              tests: 'pytest测试代码',
              dependencies: ['fastapi', 'pydantic', 'uvicorn']
            }
          }]
        }
      ],
      config: {
        executionMode: 'async',
        timeout: 120000,
        retryPolicy: {
          maxRetries: 2,
          backoffStrategy: 'exponential',
          initialDelay: 2000,
          maxDelay: 10000,
          retryableErrors: ['generation_error', 'timeout']
        },
        qualityThreshold: 0.85,
        performanceTarget: {
          responseTime: 60000,
          throughput: 20,
          accuracy: 0.9,
          availability: 0.95
        },
        securityLevel: 'medium',
        accessControl: {
          authentication: true,
          authorization: ['read', 'execute'],
          encryption: false,
          auditLog: true
        },
        monitoring: {
          enabled: true,
          metricsCollection: true,
          loggingLevel: 'info',
          alerting: { enabled: true, thresholds: [], channels: [] },
          healthCheck: {
            enabled: true,
            interval: 120,
            timeout: 30,
            failureThreshold: 3,
            successThreshold: 1
          }
        },
        parameters: {
          model_temperature: 0.3,
          max_tokens: 4000,
          include_comments: true,
          code_style: 'pep8'
        }
      },
      dependencies: [],
      metrics: {
        avgResponseTime: 45000,
        throughput: 18,
        successRate: 0.92,
        errorRate: 0.08,
        accuracy: 0.88,
        precision: 0.85,
        recall: 0.91,
        f1Score: 0.88,
        usageCount: 3200,
        activeUsers: 180,
        avgCpuUsage: 40,
        avgMemoryUsage: 50,
        avgTokenUsage: 2800,
        lastUpdated: new Date('2024-01-20')
      },
      resources: [
        { type: 'cpu', amount: 4, unit: 'cores', priority: 'high' },
        { type: 'memory', amount: 16, unit: 'GB', priority: 'high' },
        { type: 'gpu', amount: 1, unit: 'units', priority: 'medium' }
      ],
      sources: [{
        id: 'code_llm',
        type: CapabilitySourceType.EXTERNAL_API,
        name: 'Code Generation LLM',
        description: '代码生成大语言模型',
        config: { model: 'codegen-16b', endpoint: 'https://api.codegen.com' },
        version: '1.5.2',
        reliability: 0.92
      }],
      createdAt: new Date('2023-08-15'),
      updatedAt: new Date('2024-01-12'),
      author: 'AI Development Team',
      tags: ['code-generation', 'ai', 'programming', 'automation'],
      metadata: {
        author: 'AI Development Team',
        organization: 'EFIAgent Corp',
        license: 'Commercial',
        category: 'ai-development',
        complexity: 'complex',
        difficulty: 'advanced',
        rating: 4.3,
        downloads: 2800,
        featured: false,
        verified: true,
        documentation: 'https://docs.efiagent.com/capabilities/code-generation',
        examples: [],
        changelog: [],
        tags: ['code-generation', 'ai', 'programming', 'automation'],
        implementation: {
          language: 'Python',
          framework: 'Transformers',
          dependencies: ['transformers', 'torch', 'tokenizers'],
          runtime: 'Python 3.9+',
          gpu: true,
          distributed: false,
          resources: { cpu: '4 cores', memory: '16GB', gpu: '1 GPU' }
        }
      }
    },

    // ===== 11. 自动化控制 (AUTOMATION) =====
    {
      id: 'cap-workflow-automation-001',
      name: '工作流自动化',
      description: '智能工作流编排和自动化执行引擎',
      type: CoreCapabilityType.REASONING,
      subType: ReasoningCapabilityType.LOGICAL,
      version: '2.1.4',
      maturityLevel: CapabilityMaturityLevel.OPTIMIZED,
      source: CapabilitySource.BUILTIN,
      category: CapabilityCategory.CODE_GENERATION,
      inputs: [
        {
          id: 'workflow_definition',
          name: 'workflow_spec',
          dataType: 'object',
          description: '工作流定义',
          required: true,
          validation: { type: 'object' },
          examples: [{
            name: '数据处理流水线',
            description: '自动化数据处理工作流',
            value: {
              name: 'data_pipeline',
              steps: [
                { id: 'extract', type: 'data_extraction', config: {} },
                { id: 'transform', type: 'data_transformation', config: {} },
                { id: 'load', type: 'data_loading', config: {} }
              ],
              triggers: [{ type: 'schedule', cron: '0 2 * * *' }]
            }
          }]
        }
      ],
      outputs: [
        {
          id: 'execution_result',
          name: 'workflow_result',
          dataType: 'object',
          description: '工作流执行结果',
          schema: undefined,
          examples: [{
            name: '执行报告',
            description: '工作流运行结果',
            value: {
              workflow_id: 'wf_20240120_001',
              status: 'completed',
              duration: 1800,
              steps_completed: 3,
              steps_failed: 0,
              output_data: { records_processed: 10000 }
            }
          }]
        }
      ],
      config: {
        executionMode: 'async',
        timeout: 3600000,
        retryPolicy: {
          maxRetries: 3,
          backoffStrategy: 'exponential',
          initialDelay: 5000,
          maxDelay: 60000,
          retryableErrors: ['step_failure', 'timeout']
        },
        qualityThreshold: 0.95,
        performanceTarget: {
          responseTime: 1800000,
          throughput: 50,
          accuracy: 0.98,
          availability: 0.99
        },
        securityLevel: 'high',
        accessControl: {
          authentication: true,
          authorization: ['read', 'execute', 'write'],
          encryption: true,
          auditLog: true
        },
        monitoring: {
          enabled: true,
          metricsCollection: true,
          loggingLevel: 'info',
          alerting: { enabled: true, thresholds: [], channels: [] },
          healthCheck: {
            enabled: true,
            interval: 300,
            timeout: 60,
            failureThreshold: 2,
            successThreshold: 1
          }
        },
        parameters: {
          max_parallel_steps: 5,
          step_timeout: 600,
          enable_rollback: true,
          notification_enabled: true
        }
      },
      dependencies: [],
      metrics: {
        avgResponseTime: 1650000,
        throughput: 45,
        successRate: 0.97,
        errorRate: 0.03,
        accuracy: 0.98,
        precision: 0.96,
        recall: 0.98,
        f1Score: 0.97,
        usageCount: 1800,
        activeUsers: 85,
        avgCpuUsage: 45,
        avgMemoryUsage: 55,
        avgTokenUsage: 0,
        lastUpdated: new Date('2024-01-20')
      },
      resources: [
        { type: 'cpu', amount: 4, unit: 'cores', priority: 'high' },
        { type: 'memory', amount: 12, unit: 'GB', priority: 'high' }
      ],
      sources: [{
        id: 'workflow_engine',
        type: CapabilitySourceType.BUILTIN,
        name: 'Workflow Automation Engine',
        description: '工作流自动化引擎',
        config: {},
        version: '2.1.4',
        reliability: 0.97
      }],
      createdAt: new Date('2023-06-20'),
      updatedAt: new Date('2024-01-16'),
      author: 'Automation Team',
      tags: ['workflow', 'automation', 'orchestration', 'pipeline'],
      metadata: {
        author: 'Automation Team',
        organization: 'EFIAgent Corp',
        license: 'MIT',
        category: 'automation',
        complexity: 'complex',
        difficulty: 'intermediate',
        rating: 4.6,
        downloads: 2200,
        featured: true,
        verified: true,
        documentation: 'https://docs.efiagent.com/capabilities/workflow-automation',
        examples: [],
        changelog: [],
        tags: ['workflow', 'automation', 'orchestration', 'pipeline'],
        implementation: {
          language: 'Python',
          framework: 'Celery + Redis',
          dependencies: ['celery', 'redis', 'kombu', 'billiard'],
          runtime: 'Python 3.8+',
          gpu: false,
          distributed: true,
          resources: { cpu: '4 cores', memory: '12GB' }
        }
      }
    },

    // ===== 12. 学习优化 (LEARNING) =====
    {
      id: 'cap-adaptive-learning-001',
      name: '自适应学习优化',
      description: '基于反馈的自适应学习和模型优化系统',
      type: CoreCapabilityType.COGNITIVE,
      subType: LearningCapabilityType.SUPERVISED,
      version: '1.8.7',
      maturityLevel: CapabilityMaturityLevel.DEFINED,
      source: CapabilitySource.MARKETPLACE,
      category: CapabilityCategory.LEARNING,
      inputs: [
        {
          id: 'learning_data',
          name: 'training_dataset',
          dataType: 'object',
          description: '学习数据集',
          required: true,
          validation: { type: 'object' },
          examples: [{
            name: '用户行为数据',
            description: '用户交互行为学习数据',
            value: {
              data_source: 'user_interactions',
              features: ['click_rate', 'dwell_time', 'conversion'],
              labels: ['positive', 'negative'],
              sample_size: 50000
            }
          }]
        }
      ],
      outputs: [
        {
          id: 'optimized_model',
          name: 'learned_model',
          dataType: 'object',
          description: '优化后的模型',
          schema: undefined,
          examples: [{
            name: '学习结果',
            description: '模型优化输出',
            value: {
              model_version: 'v2.1.3',
              accuracy_improvement: 0.15,
              performance_metrics: { precision: 0.92, recall: 0.89, f1: 0.905 },
              optimization_summary: '通过强化学习提升了15%的准确率'
            }
          }]
        }
      ],
      config: {
        executionMode: 'async',
        timeout: 7200000,
        retryPolicy: {
          maxRetries: 2,
          backoffStrategy: 'exponential',
          initialDelay: 10000,
          maxDelay: 120000,
          retryableErrors: ['training_error', 'convergence_failure']
        },
        qualityThreshold: 0.8,
        performanceTarget: {
          responseTime: 3600000,
          throughput: 5,
          accuracy: 0.85,
          availability: 0.95
        },
        securityLevel: 'medium',
        accessControl: {
          authentication: true,
          authorization: ['read', 'execute'],
          encryption: false,
          auditLog: true
        },
        monitoring: {
          enabled: true,
          metricsCollection: true,
          loggingLevel: 'info',
          alerting: { enabled: true, thresholds: [], channels: [] },
          healthCheck: {
            enabled: true,
            interval: 600,
            timeout: 120,
            failureThreshold: 2,
            successThreshold: 1
          }
        },
        parameters: {
          learning_rate: 0.001,
          batch_size: 256,
          epochs: 100,
          early_stopping: true
        }
      },
      dependencies: [],
      metrics: {
        avgResponseTime: 3200000,
        throughput: 4,
        successRate: 0.88,
        errorRate: 0.12,
        accuracy: 0.86,
        precision: 0.84,
        recall: 0.88,
        f1Score: 0.86,
        usageCount: 450,
        activeUsers: 35,
        avgCpuUsage: 80,
        avgMemoryUsage: 85,
        avgTokenUsage: 0,
        lastUpdated: new Date('2024-01-20')
      },
      resources: [
        { type: 'cpu', amount: 8, unit: 'cores', priority: 'high' },
        { type: 'memory', amount: 32, unit: 'GB', priority: 'high' },
        { type: 'gpu', amount: 2, unit: 'units', priority: 'high' }
      ],
      sources: [{
        id: 'ml_platform',
        type: CapabilitySourceType.CUSTOM_MODULE,
        name: 'Adaptive Learning Platform',
        description: '自适应学习平台',
        config: { framework: 'pytorch', distributed: true },
        version: '1.8.7',
        reliability: 0.88
      }],
      createdAt: new Date('2023-09-10'),
      updatedAt: new Date('2024-01-14'),
      author: 'ML Research Team',
      tags: ['machine-learning', 'adaptive', 'optimization', 'reinforcement'],
      metadata: {
        author: 'ML Research Team',
        organization: 'EFIAgent Corp',
        license: 'Commercial',
        category: 'machine-learning',
        complexity: 'complex',
        difficulty: 'expert',
        rating: 4.2,
        downloads: 800,
        featured: false,
        verified: true,
        documentation: 'https://docs.efiagent.com/capabilities/adaptive-learning',
        examples: [],
        changelog: [],
        tags: ['machine-learning', 'adaptive', 'optimization', 'reinforcement'],
        implementation: {
          language: 'Python',
          framework: 'PyTorch + Ray',
          dependencies: ['torch', 'ray', 'scikit-learn', 'numpy'],
          runtime: 'Python 3.9+',
          gpu: true,
          distributed: true,
          resources: { cpu: '8 cores', memory: '32GB', gpu: '2 GPUs' }
        }
      }
    },

    // ===== 13. 协作通信 (COLLABORATION) =====
    {
      id: 'cap-agent-communication-001',
      name: 'Agent间通信协作',
      description: '多Agent系统间的智能通信和协作协调',
      type: CoreCapabilityType.COGNITIVE,
      subType: CognitiveCapabilityType.INTEGRATION,
      version: '1.6.8',
      maturityLevel: CapabilityMaturityLevel.DEFINED,
      source: CapabilitySource.BUILTIN,
      category: CapabilityCategory.COLLABORATION,
      inputs: [
        {
          id: 'communication_request',
          name: 'message_spec',
          dataType: 'object',
          description: '通信请求规格',
          required: true,
          validation: { type: 'object' },
          examples: [{
            name: '任务协调消息',
            description: 'Agent间任务分配协调',
            value: {
              sender_id: 'agent_001',
              receiver_ids: ['agent_002', 'agent_003'],
              message_type: 'task_assignment',
              content: { task_id: 'task_123', priority: 'high', deadline: '2024-01-21T10:00:00Z' }
            }
          }]
        }
      ],
      outputs: [
        {
          id: 'communication_result',
          name: 'coordination_result',
          dataType: 'object',
          description: '通信协作结果',
          schema: undefined,
          examples: [{
            name: '协作响应',
            description: 'Agent协作执行结果',
            value: {
              session_id: 'comm_20240120_001',
              participants: ['agent_001', 'agent_002', 'agent_003'],
              consensus_reached: true,
              task_allocation: { 'agent_002': 'data_processing', 'agent_003': 'result_analysis' },
              estimated_completion: '2024-01-21T09:30:00Z'
            }
          }]
        }
      ],
      config: {
        executionMode: 'sync',
        timeout: 30000,
        retryPolicy: {
          maxRetries: 3,
          backoffStrategy: 'exponential',
          initialDelay: 1000,
          maxDelay: 8000,
          retryableErrors: ['communication_failure', 'timeout']
        },
        qualityThreshold: 0.9,
        performanceTarget: {
          responseTime: 5000,
          throughput: 100,
          accuracy: 0.95,
          availability: 0.98
        },
        securityLevel: 'high',
        accessControl: {
          authentication: true,
          authorization: ['read', 'execute', 'communicate'],
          encryption: true,
          auditLog: true
        },
        monitoring: {
          enabled: true,
          metricsCollection: true,
          loggingLevel: 'info',
          alerting: { enabled: true, thresholds: [], channels: [] },
          healthCheck: {
            enabled: true,
            interval: 60,
            timeout: 15,
            failureThreshold: 3,
            successThreshold: 1
          }
        },
        parameters: {
          max_participants: 10,
          consensus_threshold: 0.8,
          message_ttl: 300,
          enable_broadcast: true
        }
      },
      dependencies: [],
      metrics: {
        avgResponseTime: 3500,
        throughput: 85,
        successRate: 0.94,
        errorRate: 0.06,
        accuracy: 0.93,
        precision: 0.91,
        recall: 0.95,
        f1Score: 0.93,
        usageCount: 12000,
        activeUsers: 200,
        avgCpuUsage: 35,
        avgMemoryUsage: 45,
        avgTokenUsage: 0,
        lastUpdated: new Date('2024-01-20')
      },
      resources: [
        { type: 'cpu', amount: 2, unit: 'cores', priority: 'medium' },
        { type: 'memory', amount: 6, unit: 'GB', priority: 'medium' }
      ],
      sources: [{
        id: 'communication_hub',
        type: CapabilitySourceType.BUILTIN,
        name: 'Agent Communication Hub',
        description: 'Agent通信中心',
        config: {},
        version: '1.6.8',
        reliability: 0.94
      }],
      createdAt: new Date('2023-07-25'),
      updatedAt: new Date('2024-01-17'),
      author: 'Collaboration Team',
      tags: ['communication', 'collaboration', 'multi-agent', 'coordination'],
      metadata: {
        author: 'Collaboration Team',
        organization: 'EFIAgent Corp',
        license: 'MIT',
        category: 'collaboration',
        complexity: 'medium',
        difficulty: 'intermediate',
        rating: 4.4,
        downloads: 4200,
        featured: false,
        verified: true,
        documentation: 'https://docs.efiagent.com/capabilities/agent-communication',
        examples: [],
        changelog: [],
        tags: ['communication', 'collaboration', 'multi-agent', 'coordination'],
        implementation: {
          language: 'Python',
          framework: 'AsyncIO + WebSockets',
          dependencies: ['websockets', 'asyncio', 'pydantic', 'redis'],
          runtime: 'Python 3.8+',
          gpu: false,
          distributed: true,
          resources: { cpu: '2 cores', memory: '6GB' }
        }
      }
    },
      // 实时环境感知
    {
      id: 'cap-perception-realtime-002',
      name: '实时环境感知',
      description: '实时监测和分析环境变化，支持IoT传感器数据融合',
      type: CoreCapabilityType.COGNITIVE,
      subType: CognitiveCapabilityType.PERCEPTION,
      version: '1.8.0',
      maturityLevel: CapabilityMaturityLevel.MANAGED,
      source: CapabilitySource.MARKETPLACE,
      category: CapabilityCategory.PERCEPTION,
      inputs: [
        {
          id: 'sensor_data',
          name: 'sensor_streams',
          dataType: 'array',
          description: '传感器数据流',
          required: true,
          validation: { type: 'array' },
          examples: [{
            name: '智能建筑传感器',
            description: '建筑物内各种传感器数据',
            value: [
              { type: 'temperature', value: 23.5, unit: '°C', location: 'room_101' },
              { type: 'humidity', value: 45, unit: '%', location: 'room_101' }
            ]
          }]
        }
      ],
      outputs: [
        {
          id: 'environment_analysis',
          name: 'environment_state',
          dataType: 'object',
          description: '环境状态分析',
          schema: undefined,
          examples: [{
            name: '环境分析结果',
            description: '实时环境状态',
            value: {
              overall_status: 'normal',
              anomalies: [],
              recommendations: ['保持当前温度'],
              alerts: []
            }
          }]
        }
      ],
      config: {
        executionMode: 'stream',
        timeout: 5000,
        retryPolicy: {
          maxRetries: 3,
          backoffStrategy: 'linear',
          initialDelay: 500,
          maxDelay: 2000,
          retryableErrors: ['network_error', 'sensor_timeout']
        },
        qualityThreshold: 0.9,
        performanceTarget: {
          responseTime: 200,
          throughput: 1000,
          accuracy: 0.95,
          availability: 0.99
        },
        securityLevel: 'medium',
        accessControl: {
          authentication: true,
          authorization: ['read', 'execute'],
          encryption: false,
          auditLog: true
        },
        monitoring: {
          enabled: true,
          metricsCollection: true,
          loggingLevel: 'warn',
          alerting: { enabled: true, thresholds: [], channels: [] },
          healthCheck: {
            enabled: true,
            interval: 10,
            timeout: 3,
            failureThreshold: 5,
            successThreshold: 2
          }
        },
        parameters: {
          sampling_rate: 1000,
          buffer_size: 100,
          anomaly_threshold: 2.0
        }
      },
      dependencies: [],
      metrics: {
        avgResponseTime: 180,
        throughput: 950,
        successRate: 0.98,
        errorRate: 0.02,
        accuracy: 0.96,
        precision: 0.95,
        recall: 0.97,
        f1Score: 0.96,
        usageCount: 25000,
        activeUsers: 150,
        avgCpuUsage: 35,
        avgMemoryUsage: 40,
        avgTokenUsage: 0,
        lastUpdated: new Date('2024-01-20')
      },
      resources: [
        { type: 'cpu', amount: 2, unit: 'cores', priority: 'medium' },
        { type: 'memory', amount: 4, unit: 'GB', priority: 'medium' }
      ],
      sources: [{
        id: 'iot_sensor_hub',
        type: CapabilitySourceType.EXTERNAL_API,
        name: 'IoT Sensor Hub',
        description: '物联网传感器数据中心',
        config: { endpoint: 'https://api.iot-hub.com' },
        version: '1.8.0',
        reliability: 0.95
      }],
      createdAt: new Date('2023-08-15'),
      updatedAt: new Date('2024-01-15'),
      author: 'IoT Team',
      tags: ['iot', 'sensors', 'realtime', 'monitoring'],
      metadata: {
        author: 'IoT Team',
        organization: 'EFIAgent Corp',
        license: 'Apache-2.0',
        category: 'iot-monitoring',
        complexity: 'medium',
        difficulty: 'intermediate',
        rating: 4.4,
        downloads: 3200,
        featured: false,
        verified: true,
        documentation: 'https://docs.efiagent.com/capabilities/realtime-perception',
        examples: [],
        changelog: [],
        tags: ['iot', 'sensors', 'realtime', 'monitoring'],
        implementation: {
          language: 'Python',
          framework: 'FastAPI',
          dependencies: ['fastapi', 'asyncio', 'numpy', 'pandas'],
          runtime: 'Python 3.8+',
          gpu: false,
          distributed: false,
          resources: { cpu: '2 cores', memory: '4GB' }
        }
      }
    },

    // ===== 2. 自然语言处理 (NLP) =====
    {
      id: 'cap-nlp-understanding-001',
      name: '自然语言理解',
      description: '深度理解文本语义、情感和意图，支持多语言处理',
      type: CoreCapabilityType.COGNITIVE,
      subType: CognitiveCapabilityType.UNDERSTANDING,
      version: '2.1.0',
      maturityLevel: CapabilityMaturityLevel.OPTIMIZED,
      source: CapabilitySource.BUILTIN,
      category: CapabilityCategory.NLP,
      inputs: [
        {
          id: 'input_text',
          name: 'text',
          dataType: 'string',
          description: '待分析的文本内容',
          required: true,
          validation: {
            type: 'string',
            maxLength: 10000,
            minLength: 1
          },
          examples: [
            {
              name: '情感分析示例',
              description: '分析用户评论情感',
              value: '这个产品真的很棒，我非常满意！'
            }
          ]
        }
      ],
      outputs: [
        {
          id: 'output_analysis',
          name: 'analysis_result',
          dataType: 'object',
          description: '文本分析结果',
          examples: [
            {
              name: '分析结果示例',
              description: '情感分析输出',
              value: {
                sentiment: 'positive',
                confidence: 0.95,
                entities: ['产品'],
                intent: 'praise',
                keywords: ['棒', '满意'],
                language: 'zh-CN'
              }
            }
          ],
          schema: undefined
        }
      ],
      config: {
        executionMode: 'async',
        timeout: 30000,
        retryPolicy: {
          maxRetries: 3,
          backoffStrategy: 'exponential',
          initialDelay: 1000,
          maxDelay: 10000,
          retryableErrors: ['timeout', 'network_error']
        },
        qualityThreshold: 0.85,
        performanceTarget: {
          responseTime: 1000,
          throughput: 100,
          accuracy: 0.9,
          availability: 0.99
        },
        securityLevel: 'medium',
        accessControl: {
          authentication: true,
          authorization: ['read', 'execute'],
          encryption: true,
          auditLog: true
        },
        monitoring: {
          enabled: true,
          metricsCollection: true,
          loggingLevel: 'info',
          alerting: {
            enabled: true,
            thresholds: [
              {
                metric: 'accuracy',
                operator: '<',
                value: 0.85,
                duration: 60,
                severity: 'medium'
              }
            ],
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
        parameters: {
          model: {
            name: 'bert-base-multilingual',
            version: '1.0',
            max_length: 512,
            batch_size: 32
          }
        }
      },
      dependencies: [],
      metrics: {
        avgResponseTime: 150,
        throughput: 1000,
        successRate: 0.98,
        errorRate: 0.02,
        accuracy: 0.95,
        precision: 0.94,
        recall: 0.96,
        f1Score: 0.95,
        usageCount: 15000,
        activeUsers: 500,
        avgCpuUsage: 45,
        avgMemoryUsage: 60,
        avgTokenUsage: 200,
        lastUpdated: new Date('2024-01-20')
      },
      resources: [
        {
          type: 'cpu',
          amount: 2,
          unit: 'cores',
          priority: 'medium'
        },
        {
          type: 'memory',
          amount: 4,
          unit: 'GB',
          priority: 'medium'
        }
      ],
      sources: [
        {
          id: 'source_nlp_001',
          type: CapabilitySourceType.BUILTIN,
          name: 'Internal NLP Engine',
          description: 'Built-in natural language processing engine',
          config: {},
          version: '2.1.0',
          reliability: 0.98
        }
      ],
      createdAt: new Date('2023-10-01'),
      updatedAt: new Date('2024-01-20'),
      author: 'NLP Team',
      tags: ['nlp', 'understanding', 'transformer', 'multilingual'],
      metadata: {
        author: 'NLP Team',
        organization: 'EFIAgent Corp',
        license: 'MIT',
        tags: ['nlp', 'understanding', 'transformer', 'multilingual'],
        category: 'ai-language',
        complexity: 'medium',
        difficulty: 'intermediate',
        rating: 4.8,
        downloads: 5200,
        featured: true,
        verified: true,
        documentation: 'https://docs.efiagent.com/capabilities/nlp-understanding',
        examples: [
          {
            name: '情感分析',
            description: '分析文本情感倾向',
            input: '这个产品质量很好，值得推荐！',
            output: {
              sentiment: 'positive',
              confidence: 0.92
            },
            tags: ['sentiment', 'analysis']
          }
        ],
        changelog: [
          {
            version: '2.1.0',
            date: new Date('2024-01-20'),
            changes: ['增加多语言支持', '优化模型性能', '修复已知问题'],
            type: 'minor'
          }
        ],
        implementation: {
          language: 'Python',
          framework: 'PyTorch',
          dependencies: ['transformers', 'torch', 'numpy'],
          runtime: 'Python 3.9+',
          gpu: false,
          distributed: true,
          resources: {
            cpu: '2 cores',
            memory: '4GB',
            gpu: '0'
          }
        }
      }
    },

    // 认知能力 - 图像识别
    {
      id: 'cap-vision-recognition-002',
      name: '图像识别与分析',
      description: '识别图像中的物体、场景、文字等，支持多种视觉任务',
      type: CoreCapabilityType.COGNITIVE,
      subType: CognitiveCapabilityType.PERCEPTION,
      version: '1.5.2',
      maturityLevel: CapabilityMaturityLevel.DEFINED,
      source: CapabilitySource.MARKETPLACE,
      category: CapabilityCategory.PERCEPTION,
      inputs: [
        {
          id: 'input_image',
          name: 'image',
          dataType: 'file',
          description: '待分析的图像文件',
          required: true,
          validation: {
            type: 'string'
          },
          examples: []
        }
      ],
      outputs: [
        {
          id: 'output_recognition',
          name: 'recognition_result',
          dataType: 'object',
          description: '图像识别结果',
          examples: [],
          schema: undefined
        }
      ],
      config: {
        executionMode: 'async',
        timeout: 45000,
        retryPolicy: {
          maxRetries: 2,
          backoffStrategy: 'linear',
          initialDelay: 2000,
          maxDelay: 8000,
          retryableErrors: ['timeout', 'processing_error']
        },
        qualityThreshold: 0.8,
        performanceTarget: {
          responseTime: 3000,
          throughput: 50,
          accuracy: 0.88,
          availability: 0.95
        },
        securityLevel: 'high',
        accessControl: {
          authentication: true,
          authorization: ['read', 'execute'],
          encryption: true,
          auditLog: true
        },
        monitoring: {
          enabled: true,
          metricsCollection: true,
          loggingLevel: 'info',
          alerting: {
            enabled: true,
            thresholds: [],
            channels: []
          },
          healthCheck: {
            enabled: true,
            interval: 60,
            timeout: 10,
            failureThreshold: 3,
            successThreshold: 1
          }
        },
        parameters: {
          model: {
            name: 'yolo-v8',
            version: '8.0',
            confidence_threshold: 0.5,
            nms_threshold: 0.4
          }
        }
      },
      dependencies: [],
      metrics: {
        avgResponseTime: 2800,
        throughput: 45,
        successRate: 0.94,
        errorRate: 0.06,
        accuracy: 0.89,
        precision: 0.87,
        recall: 0.91,
        f1Score: 0.89,
        usageCount: 8500,
        activeUsers: 280,
        avgCpuUsage: 65,
        avgMemoryUsage: 80,
        avgTokenUsage: 0,
        lastUpdated: new Date('2024-01-15')
      },
      resources: [
        {
          type: 'gpu',
          amount: 1,
          unit: 'cards',
          priority: 'high'
        },
        {
          type: 'memory',
          amount: 8,
          unit: 'GB',
          priority: 'high'
        }
      ],
      sources: [
        {
          id: 'source_vision_001',
          type: CapabilitySourceType.MARKETPLACE,
          name: 'Computer Vision API',
          description: 'Third-party computer vision service',
          config: {
            apiKey: 'encrypted',
            endpoint: 'https://api.vision-service.com'
          },
          version: '1.5.2',
          reliability: 0.94
        }
      ],
      createdAt: new Date('2023-08-15'),
      updatedAt: new Date('2024-01-15'),
      author: 'Vision AI Team',
      tags: ['computer-vision', 'object-detection', 'ocr', 'face-recognition'],
      metadata: {
        author: 'Vision AI Team',
        organization: 'AI Vision Corp',
        license: 'Commercial',
        tags: ['computer-vision', 'object-detection', 'ocr', 'face-recognition'],
        category: 'ai-vision',
        complexity: 'complex',
        difficulty: 'intermediate',
        rating: 4.5,
        downloads: 3200,
        featured: true,
        verified: true,
        documentation: 'https://docs.efiagent.com/capabilities/vision-recognition',
        examples: [
          {
            name: '物体检测',
            description: '检测图像中的物体',
            input: 'image_file.jpg',
            output: {
              objects: [
                { name: 'car', confidence: 0.95, bbox: [100, 100, 200, 200] },
                { name: 'person', confidence: 0.88, bbox: [50, 50, 150, 300] }
              ]
            },
            tags: ['detection', 'objects']
          }
        ],
        changelog: [
          {
            version: '1.5.2',
            date: new Date('2024-01-15'),
            changes: ['提升检测精度', '增加新的物体类别', '优化处理速度'],
            type: 'patch'
          }
        ],
        implementation: {
          language: 'Python',
          framework: 'TensorFlow',
          dependencies: ['tensorflow', 'opencv-python', 'pillow'],
          runtime: 'Python 3.8+',
          gpu: true,
          distributed: false,
          resources: {
            cpu: '4 cores',
            memory: '8GB',
            gpu: '1 GPU'
          }
        }
      }
    },

    // 推理能力 - 逻辑推理
    {
      id: 'cap-logical-reasoning-003',
      name: '逻辑推理引擎',
      description: '基于规则和知识图谱的逻辑推理，支持复杂推理链',
      type: CoreCapabilityType.REASONING,
      subType: ReasoningCapabilityType.LOGICAL,
      version: '3.0.1',
      maturityLevel: CapabilityMaturityLevel.OPTIMIZED,
      source: CapabilitySource.BUILTIN,
      category: CapabilityCategory.REASONING,
      inputs: [
        {
          id: 'input_facts',
          name: 'facts',
          dataType: 'array',
          description: '已知事实列表',
          required: true,
          validation: {
            type: 'array'
          },
          examples: [
            {
              name: '简单事实',
              description: '基础三元组事实',
              value: [
                { subject: '苏格拉底', predicate: '是', object: '人' },
                { subject: '人', predicate: '是', object: '有死的' }
              ]
            }
          ]
        },
        {
          id: 'input_query',
          name: 'query',
          dataType: 'string',
          description: '推理查询',
          required: true,
          validation: {
            type: 'string',
            maxLength: 500
          },
          examples: [
            {
              name: '推理查询',
              description: '询问推理结果',
              value: '苏格拉底是有死的吗？'
            }
          ]
        }
      ],
      outputs: [
        {
          id: 'output_reasoning',
          name: 'reasoning_result',
          dataType: 'object',
          description: '推理结果',
          schema: {
            type: 'object',
            properties: {
              conclusion: { type: 'string' },
              confidence: { type: 'number' },
              reasoning_chain: { type: 'array', items: { type: 'string' } },
              evidence: { type: 'array', items: { type: 'string' } }
            },
            required: ['conclusion', 'confidence']
          },
          examples: [
            {
              name: '推理结果',
              description: '逻辑推理输出',
              value: {
                conclusion: '是的，苏格拉底是有死的',
                confidence: 1.0,
                reasoning_chain: [
                  '苏格拉底是人',
                  '人是有死的',
                  '因此苏格拉底是有死的'
                ],
                evidence: ['fact_1', 'fact_2']
              }
            }
          ]
        }
      ],
      config: {
        executionMode: 'sync',
        timeout: 15000,
        retryPolicy: {
          maxRetries: 2,
          backoffStrategy: 'exponential',
          initialDelay: 500,
          maxDelay: 2000,
          retryableErrors: ['timeout']
        },
        qualityThreshold: 0.9,
        performanceTarget: {
          responseTime: 500,
          throughput: 200,
          accuracy: 0.95,
          availability: 0.99
        },
        securityLevel: 'medium',
        accessControl: {
          authentication: true,
          authorization: ['read', 'execute'],
          encryption: false,
          auditLog: true
        },
        monitoring: {
          enabled: true,
          metricsCollection: true,
          loggingLevel: 'debug',
          alerting: {
            enabled: true,
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
        parameters: {
          reasoning: {
            max_depth: 10,
            timeout_per_step: 1000,
            use_cache: true
          }
        }
      },
      dependencies: [],
      metrics: {
        avgResponseTime: 350,
        throughput: 180,
        successRate: 0.97,
        errorRate: 0.03,
        accuracy: 0.96,
        precision: 0.95,
        recall: 0.97,
        f1Score: 0.96,
        usageCount: 12000,
        activeUsers: 150,
        avgCpuUsage: 30,
        avgMemoryUsage: 40,
        avgTokenUsage: 0,
        lastUpdated: new Date('2024-01-18')
      },
      resources: [
        {
          type: 'cpu',
          amount: 1,
          unit: 'cores',
          priority: 'low'
        },
        {
          type: 'memory',
          amount: 2,
          unit: 'GB',
          priority: 'low'
        }
      ],
      sources: [
        {
          id: 'source_reasoning_001',
          type: CapabilitySourceType.BUILTIN,
          name: 'Logic Engine',
          description: 'Built-in logical reasoning engine',
          config: {},
          version: '3.0.1',
          reliability: 0.97
        }
      ],
      createdAt: new Date('2023-06-01'),
      updatedAt: new Date('2024-01-18'),
      author: 'Reasoning Team',
      tags: ['logic', 'reasoning', 'inference', 'knowledge-graph'],
      metadata: {
        author: 'Reasoning Team',
        organization: 'EFIAgent Corp',
        license: 'MIT',
        tags: ['logic', 'reasoning', 'inference', 'knowledge-graph'],
        category: 'ai-reasoning',
        difficulty: 'advanced',
        complexity: 'complex',
        rating: 4.9,
        downloads: 4800,
        featured: true,
        verified: true,
        documentation: 'https://docs.efiagent.com/capabilities/logical-reasoning',
        examples: [
          {
            name: '三段论推理',
            description: '经典逻辑推理示例',
            input: {
              facts: [
                { subject: '苏格拉底', predicate: '是', object: '人' },
                { subject: '人', predicate: '是', object: '有死的' }
              ],
              query: '苏格拉底是有死的吗？'
            },
            output: {
              conclusion: '是的，苏格拉底是有死的',
              confidence: 1.0
            },
            tags: ['syllogism', 'classical']
          }
        ],
        changelog: [
          {
            version: '3.0.1',
            date: new Date('2024-01-18'),
            changes: ['优化推理算法', '增加缓存机制', '提升性能'],
            type: 'patch'
          }
        ],
        implementation: {
          language: 'Python',
          framework: 'Custom',
          dependencies: ['networkx', 'rdflib', 'owlready2'],
          runtime: 'Python 3.9+',
          gpu: false,
          distributed: true,
          resources: {
            cpu: '2 cores',
            memory: '4GB',
            gpu: '0'
          }
        }
      }
    },

    // 决策能力 - 多标准决策
    {
      id: 'cap-decision-making-004',
      name: '多标准决策分析',
      description: '基于多个标准和权重进行决策分析，支持AHP、TOPSIS等方法',
      type: CoreCapabilityType.DECISION,
      subType: DecisionCapabilityType.OPTIMIZATION,
      version: '2.3.0',
      maturityLevel: CapabilityMaturityLevel.DEFINED,
      source: CapabilitySource.CUSTOM,
      category: CapabilityCategory.DECISION_MAKING,
      inputs: [
        {
          id: 'input_alternatives',
          name: 'alternatives',
          dataType: 'array',
          description: '决策备选方案',
          required: true,
          validation: {
            type: 'array'
          },
          examples: [
            {
              name: '供应商选择',
              description: '多个供应商方案',
              value: [
                {
                  id: 'supplier_a',
                  name: '供应商A',
                  criteria: { cost: 100, quality: 8, delivery: 7 }
                },
                {
                  id: 'supplier_b',
                  name: '供应商B',
                  criteria: { cost: 120, quality: 9, delivery: 8 }
                }
              ]
            }
          ]
        },
        {
          id: 'input_weights',
          name: 'criteria_weights',
          dataType: 'object',
          description: '决策标准权重',
          required: true,
          validation: {
            type: 'object'
          },
          examples: [
            {
              name: '权重设置',
              description: '各标准的重要性权重',
              value: {
                cost: 0.4,
                quality: 0.4,
                delivery: 0.2
              }
            }
          ]
        }
      ],
      outputs: [
        {
          id: 'output_decision',
          name: 'decision_result',
          dataType: 'object',
          description: '决策分析结果',
          schema: {
            ranking: 'array',
            scores: 'object',
            recommendation: 'string',
            analysis: 'object'
          },
          examples: [
            {
              name: '决策结果',
              description: '决策分析输出',
              value: {
                ranking: ['supplier_b', 'supplier_a'],
                scores: {
                  supplier_a: 0.72,
                  supplier_b: 0.84
                },
                recommendation: 'supplier_b',
                analysis: {
                  method: 'TOPSIS',
                  confidence: 0.88
                }
              }
            }
          ]
        }
      ],
      config: {
        executionMode: 'sync',
        timeout: 10000,
        retryPolicy: {
          maxRetries: 1,
          backoffStrategy: 'linear',
          initialDelay: 1000,
          maxDelay: 3000,
          retryableErrors: ['calculation_error']
        },
        qualityThreshold: 0.8,
        performanceTarget: {
          responseTime: 800,
          throughput: 150,
          accuracy: 0.85,
          availability: 0.98
        },
        securityLevel: 'low',
        accessControl: {
          authentication: false,
          authorization: ['read', 'execute'],
          encryption: false,
          auditLog: false
        },
        monitoring: {
          enabled: true,
          metricsCollection: true,
          loggingLevel: 'info',
          alerting: {
            enabled: false,
            thresholds: [],
            channels: []
          },
          healthCheck: {
            enabled: true,
            interval: 60,
            timeout: 5,
            failureThreshold: 5,
            successThreshold: 1
          }
        },
        parameters: {
          decision: {
            method: 'TOPSIS',
            normalize: true,
            distance_metric: 'euclidean'
          }
        }
      },
      dependencies: [],
      metrics: {
        avgResponseTime: 650,
        throughput: 120,
        successRate: 0.99,
        errorRate: 0.01,
        accuracy: 0.87,
        precision: 0.85,
        recall: 0.89,
        f1Score: 0.87,
        usageCount: 6500,
        activeUsers: 85,
        avgCpuUsage: 25,
        avgMemoryUsage: 30,
        avgTokenUsage: 0,
        lastUpdated: new Date('2024-01-12')
      },
      resources: [
        {
          type: 'cpu',
          amount: 0.5,
          unit: 'cores',
          priority: 'low'
        },
        {
          type: 'memory',
          amount: 1,
          unit: 'GB',
          priority: 'low'
        }
      ],
      sources: [
        {
          id: 'source_decision_001',
          type: CapabilitySourceType.CUSTOM_MODULE,
          name: 'Decision Analysis Module',
          description: 'Custom multi-criteria decision analysis module',
          config: {},
          version: '2.3.0',
          reliability: 0.99
        }
      ],
      createdAt: new Date('2023-09-10'),
      updatedAt: new Date('2024-01-12'),
      author: 'Decision Science Team',
      tags: ['decision-making', 'multi-criteria', 'ahp', 'topsis'],
      metadata: {
        author: 'Decision Science Team',
        organization: 'EFIAgent Corp',
        license: 'Apache-2.0',
        tags: ['decision-making', 'multi-criteria', 'ahp', 'topsis'],
        category: 'decision-support',
        difficulty: 'intermediate',
        complexity: 'medium',
        rating: 4.6,
        downloads: 2800,
        featured: false,
        verified: true,
        documentation: 'https://docs.efiagent.com/capabilities/decision-making',
        examples: [
          {
            name: '供应商选择',
            description: '多标准供应商决策',
            input: {
              alternatives: [
                { id: 'A', name: '供应商A', criteria: { cost: 100, quality: 8 } },
                { id: 'B', name: '供应商B', criteria: { cost: 120, quality: 9 } }
              ],
              weights: { cost: 0.6, quality: 0.4 }
            },
            output: {
              ranking: ['A', 'B'],
              recommendation: 'A'
            },
            tags: ['supplier', 'selection']
          }
        ],
        changelog: [
          {
            version: '2.3.0',
            date: new Date('2024-01-12'),
            changes: ['增加ELECTRE方法', '优化计算性能', '修复边界情况'],
            type: 'minor'
          }
        ],
        implementation: {
          language: 'Python',
          framework: 'NumPy',
          dependencies: ['numpy', 'scipy', 'pandas'],
          runtime: 'Python 3.8+',
          gpu: false,
          distributed: false,
          resources: {
            cpu: '2 cores',
            memory: '4GB',
            gpu: '0'
          }
        }
      }
    },

    // 学习能力 - 强化学习
    {
      id: 'cap-reinforcement-learning-005',
      name: '强化学习智能体',
      description: '基于强化学习的智能决策，支持Q-Learning、PPO等算法',
      type: CoreCapabilityType.LEARNING,
      subType: LearningCapabilityType.REINFORCEMENT,
      version: '1.8.3',
      maturityLevel: CapabilityMaturityLevel.DEFINED,
      source: CapabilitySource.MARKETPLACE,
      category: CapabilityCategory.LEARNING,
      inputs: [
        {
          id: 'input_state',
          name: 'current_state',
          dataType: 'object',
          description: '当前环境状态',
          required: true,
          validation: {
            type: 'object'
          },
          examples: [
            {
              name: '游戏状态',
              description: '游戏环境的当前状态',
              value: {
                features: [0.5, 0.8, 0.2],
                context: { level: 1, score: 100 }
              }
            }
          ]
        }
      ],
      outputs: [
        {
          id: 'output_action',
          name: 'recommended_action',
          dataType: 'object',
          description: '推荐的行动',
          schema: {
            action: 'string',
            confidence: 'number',
            q_values: 'array'
          },
          examples: [
            {
              name: '行动建议',
              description: '智能体推荐的行动',
              value: {
                action: 'move_right',
                confidence: 0.85,
                q_values: [0.2, 0.85, 0.3, 0.1]
              }
            }
          ]
        }
      ],
      config: {
        executionMode: 'async',
        timeout: 5000,
        retryPolicy: {
          maxRetries: 2,
          backoffStrategy: 'exponential',
          initialDelay: 500,
          maxDelay: 2000,
          retryableErrors: ['model_error', 'timeout']
        },
        qualityThreshold: 0.7,
        performanceTarget: {
          responseTime: 200,
          throughput: 300,
          accuracy: 0.8,
          availability: 0.95
        },
        securityLevel: 'medium',
        accessControl: {
          authentication: true,
          authorization: ['read', 'execute', 'train'],
          encryption: true,
          auditLog: true
        },
        monitoring: {
          enabled: true,
          metricsCollection: true,
          loggingLevel: 'debug',
          alerting: {
            enabled: true,
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
        parameters: {
          rl: {
            algorithm: 'PPO',
            learning_rate: 0.0003,
            discount_factor: 0.99,
            exploration_rate: 0.1
          }
        }
      },
      dependencies: [],
      metrics: {
        avgResponseTime: 180,
        throughput: 250,
        successRate: 0.92,
        errorRate: 0.08,
        accuracy: 0.82,
        precision: 0.80,
        recall: 0.84,
        f1Score: 0.82,
        usageCount: 3200,
        activeUsers: 45,
        avgCpuUsage: 70,
        avgMemoryUsage: 85,
        avgTokenUsage: 0,
        lastUpdated: new Date('2024-01-10')
      },
      resources: [
        {
          type: 'gpu',
          amount: 1,
          unit: 'cards',
          priority: 'high'
        },
        {
          type: 'memory',
          amount: 6,
          unit: 'GB',
          priority: 'medium'
        }
      ],
      sources: [
        {
          id: 'source_rl_001',
          type: CapabilitySourceType.MARKETPLACE,
          name: 'RL Framework',
          description: 'Third-party reinforcement learning framework',
          config: {
            apiKey: 'encrypted',
            endpoint: 'https://api.rl-service.com'
          },
          version: '1.8.3',
          reliability: 0.92
        }
      ],
      createdAt: new Date('2023-11-20'),
      updatedAt: new Date('2024-01-10'),
      author: 'ML Research Team',
      tags: ['reinforcement-learning', 'ai-agent', 'ppo', 'q-learning'],
      metadata: {
        author: 'ML Research Team',
        organization: 'AI Research Lab',
        license: 'GPL-3.0',
        tags: ['reinforcement-learning', 'ai-agent', 'ppo', 'q-learning'],
        category: 'ai-learning',
        difficulty: 'expert',
        complexity: 'complex',
        rating: 4.2,
        downloads: 1500,
        featured: false,
        verified: false,
        documentation: 'https://docs.efiagent.com/capabilities/reinforcement-learning',
        examples: [
          {
            name: '游戏AI',
            description: '游戏环境中的智能决策',
            input: {
              state: {
                features: [0.5, 0.8, 0.2],
                context: { level: 1 }
              }
            },
            output: {
              action: 'move_right',
              confidence: 0.85
            },
            tags: ['gaming', 'ai']
          }
        ],
        changelog: [
          {
            version: '1.8.3',
            date: new Date('2024-01-10'),
            changes: ['修复训练稳定性问题', '优化内存使用', '增加新的奖励函数'],
            type: 'patch'
          }
        ],
        implementation: {
          language: 'Python',
          framework: 'PyTorch',
          dependencies: ['torch', 'gym', 'stable-baselines3'],
          runtime: 'Python 3.9+',
          gpu: true,
          distributed: true,
          resources: {
            cpu: '4 cores',
            memory: '8GB',
            gpu: '1 GPU'
          }
        }
      }
    }
  ];
};

/**
 * 生成模拟Agent数据
 * @returns Agent数组
 */
export const generateMockAgents = (): Agent2_0[] => {
  const mockCapabilities = generateMockCapabilities();
  const now = new Date();
  
  return [
    {
      id: 'agent-nlp-specialist-001',
      name: 'NLP专家Agent',
      description: '专门处理自然语言相关任务的智能Agent，具备文本理解、情感分析、实体识别等能力',
      type: 'EXECUTION',
      status: AgentStatus.RUNNING,
      version: '2.1.0',
      capabilities: [mockCapabilities[0]], // 使用完整的能力对象
      orchestrator: {
        id: 'orch-nlp-001',
        name: 'NLP任务编排器',
        description: 'NLP任务的智能编排器',
        mode: CapabilityOrchestrationMode.PARALLEL,
        priority: 1,
        executionTimeout: 30000,
        retryCount: 3,
        errorHandling: 'continue' as 'stop' | 'continue' | 'fallback',
        rules: [],
        capabilityMapping: [],
        executionStrategy: {
          loadBalancing: 'round_robin',
          failover: true,
          circuitBreaker: {
            enabled: true,
            failureThreshold: 5,
            recoveryTimeout: 30000,
            halfOpenMaxCalls: 3
          },
          rateLimit: {
            enabled: true,
            requestsPerSecond: 100,
            burstSize: 200,
            strategy: 'token_bucket'
          }
        },
        optimization: {
          enabled: true,
          autoScaling: {
            enabled: true,
            minInstances: 1,
            maxInstances: 10,
            targetCpuUtilization: 70,
            targetMemoryUtilization: 80,
            scaleUpCooldown: 300,
            scaleDownCooldown: 600
          },
          caching: {
            enabled: true,
            strategy: 'lru',
            maxSize: 1000,
            ttl: 3600
          },
          prefetching: {
            enabled: false,
            strategy: 'predictive',
            lookaheadTime: 300
          }
        }
      },
      knowledgeGraph: {
        enabled: true,
        ontologyLayers: [],
        factLayers: [],
        ruleLayers: [],
        temporalLayers: [],
        updateStrategy: 'real_time'
      },
      learningConfig: {
        enabled: true,
        strategies: [],
        dataCollection: {
          enabled: true,
          sources: [],
          preprocessing: {
            normalization: false,
            deduplication: false,
            validation: false,
            transformation: []
          },
          privacy: {
            anonymization: true,
            encryption: true,
            accessControl: {
              authentication: true,
              authorization: ['read', 'write'],
              encryption: true,
              auditLog: true
            },
            retentionPolicy: {
              enabled: true,
              retentionPeriod: 30,
              archiveStrategy: 'archive'
            }
          }
        },
        evaluation: {
          enabled: true,
          metrics: [],
          frequency: 7,
          benchmarks: []
        },
        modelManagement: {
          versioning: true,
          autoUpdate: false,
          rollbackPolicy: {
            enabled: true,
            triggerConditions: ['performance_degradation', 'error_rate_increase'],
            maxRollbackVersions: 5
          },
          performance_monitoring: true
        }
      },
      collaborationConfig: {
        enabled: true,
        modes: [
          {
            type: 'hierarchical',
            config: {
              levels: 3,
              coordination: 'centralized'
            },
            enabled: true
          }
        ],
        protocols: [
          {
            type: 'http',
            config: {
              timeout: 30000,
              retries: 3
            },
            security: {
               authentication: {
                 method: 'jwt',
                 config: {
                   secret: 'default-secret',
                   expiration: '1h'
                 }
               },
               authorization: {
                 model: 'rbac',
                 policies: []
               },
               encryption: {
                 inTransit: true,
                 atRest: true,
                 algorithm: 'AES-256',
                 keyManagement: {
                   provider: 'local',
                   rotation: true,
                   rotationPeriod: 90
                 }
               },
               audit: {
                  enabled: true,
                  events: ['access', 'modification'],
                  retention: 365,
                  storage: 'database'
                }
             }
          }
        ],
        governance: {
          policies: [],
          compliance: {
            frameworks: ['GDPR'],
            requirements: [],
            monitoring: true
          },
          riskManagement: {
            enabled: true,
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
              automation: true
            },
            monitoring: {
              enabled: true,
              indicators: [],
              alerting: {
                enabled: true,
                thresholds: [],
                channels: []
              }
            }
          }
        }
      },
      deploymentConfig: {
        environment: 'production',
        infrastructure: {
          platform: 'kubernetes',
          resources: {
            cpu: { request: 2, limit: 4, unit: 'cores' },
            memory: { request: 4, limit: 8, unit: 'GB' },
            storage: { request: 10, limit: 20, unit: 'GB' }
          },
          networking: {
            ingress: {
              enabled: true,
              host: 'nlp-agent.example.com',
              tls: true,
              annotations: {}
            },
            service: {
              type: 'ClusterIP',
              ports: [{ name: 'http', port: 80, targetPort: 8080, protocol: 'TCP' }]
            },
            security: {
              networkPolicies: true,
              firewallRules: []
            }
          },
          storage: {
            type: 'persistent',
            size: '10Gi',
            storageClass: 'fast-ssd',
            backup: true
          }
        },
        scaling: {
          horizontal: {
            enabled: true,
            minReplicas: 2,
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
          enabled: true,
          metricsCollection: true,
          loggingLevel: 'info',
          alerting: {
            enabled: true,
            thresholds: [],
            channels: []
          },
          healthCheck: {
            enabled: true,
            interval: 30,
            timeout: 10,
            failureThreshold: 3,
            successThreshold: 1
          }
        },
        backup: {
          enabled: true,
          schedule: '0 2 * * *',
          retention: 30,
          storage: {
            type: 's3',
            config: {},
            encryption: true
          }
        }
      },
      metadata: {
        author: 'EFIAgent Team',
        organization: 'WumaiTech',
        license: 'MIT',
        tags: ['nlp', 'text-processing', 'ai'],
        category: 'language-processing',
        difficulty: 'intermediate',
        rating: 4.5,
        downloads: 1250,
        featured: true,
        usageCount: 856,
        lastUsed: new Date('2024-01-20'),
        createdAt: new Date('2024-01-15'),
        updatedAt: now,
        changelog: [
          {
            version: '1.2.0',
            date: new Date('2024-01-20'),
            changes: ['优化文本处理算法', '增加多语言支持'],
            breaking: false,
            type: 'feature'
          },
          {
            version: '2.1.0',
            date: now,
            changes: ['优化文本理解算法', '增加多语言支持', '提升处理性能'],
            breaking: false
          }
        ],
        performanceMetrics: {
          taskCompletionTime: 1.2,
          accuracy: 0.95,
          resourceUtilization: 0.78,
          learningImprovement: 0.02
        }
      }
    },
    {
      id: 'agent-vision-analyst-002',
      name: '视觉分析Agent',
      description: '专业的计算机视觉分析Agent，能够处理图像识别、物体检测、场景理解等任务',
      type: 'ANALYSIS',
      status: AgentStatus.RUNNING,
      version: '1.5.2',
      capabilities: [mockCapabilities[1] || mockCapabilities[0]], // 使用完整的能力对象
      orchestrator: {
        id: 'orch-vision-001',
        name: '视觉任务编排器',
        description: '计算机视觉任务的智能编排器',
        mode: CapabilityOrchestrationMode.SEQUENTIAL,
        priority: 1,
        executionTimeout: 30000,
        retryCount: 3,
        errorHandling: 'continue' as 'stop' | 'continue' | 'fallback',
        rules: [],
        capabilityMapping: [],
        executionStrategy: {
          loadBalancing: 'least_connections',
          failover: true,
          circuitBreaker: {
            enabled: true,
            failureThreshold: 3,
            recoveryTimeout: 60000,
            halfOpenMaxCalls: 2
          },
          rateLimit: {
            enabled: true,
            requestsPerSecond: 50,
            burstSize: 100,
            strategy: 'token_bucket'
          }
        },
        optimization: {
          enabled: true,
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
        enabled: false,
        ontologyLayers: [],
        factLayers: [],
        ruleLayers: [],
        temporalLayers: [],
        updateStrategy: 'batch'
      },
      learningConfig: {
        enabled: true,
        strategies: [],
        dataCollection: {
          enabled: true,
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
              enabled: true,
              retentionPeriod: 90,
              archiveStrategy: 'archive'
            }
          }
        },
        modelManagement: {
          versioning: true,
          autoUpdate: false,
          rollbackPolicy: {
            enabled: true,
            triggerConditions: ['performance_degradation'],
            maxRollbackVersions: 3
          },
          performance_monitoring: true
        },
        evaluation: {
           enabled: true,
           metrics: [],
           frequency: 24,
           benchmarks: []
         }
      },
      collaborationConfig: {
        enabled: false,
        modes: [],
        protocols: [],
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
        environment: 'production',
        infrastructure: {
          platform: 'docker',
          resources: {
            cpu: { request: 4, limit: 8, unit: 'cores' },
            memory: { request: 8, limit: 16, unit: 'GB' },
            storage: { request: 50, limit: 100, unit: 'GB' },
            gpu: { request: 1, limit: 2, unit: 'units' }
          },
          networking: {
            ingress: {
              enabled: true,
              host: 'vision-agent.example.com',
              tls: true,
              annotations: {}
            },
            service: {
              type: 'LoadBalancer',
              ports: [{ name: 'http', port: 80, targetPort: 8080, protocol: 'TCP' }]
            },
            security: {
              networkPolicies: true,
              firewallRules: []
            }
          },
          storage: {
            type: 'persistent',
            size: '50Gi',
            storageClass: 'fast-ssd',
            backup: true
          }
        },
        scaling: {
          horizontal: {
            enabled: true,
            minReplicas: 1,
            maxReplicas: 5,
            targetCpuUtilization: 80,
            targetMemoryUtilization: 85
          },
          vertical: {
            enabled: true,
            updateMode: 'Initial',
            resourcePolicy: []
          }
        },
        monitoring: {
          enabled: true,
          metricsCollection: true,
          loggingLevel: 'warn',
          alerting: {
            enabled: true,
            thresholds: [],
            channels: []
          },
          healthCheck: {
            enabled: true,
            interval: 60,
            timeout: 15,
            failureThreshold: 5,
            successThreshold: 2
          }
        },
        backup: {
          enabled: true,
          schedule: '0 3 * * 0',
          retention: 60,
          storage: {
            type: 'gcs',
            config: {},
            encryption: true
          }
        }
      },
      metadata: {
        author: 'Vision Team',
        organization: 'WumaiTech',
        license: 'Apache-2.0',
        tags: ['computer-vision', 'image-processing', 'detection'],
        category: 'vision-analysis',
        difficulty: 'advanced',
        rating: 4.2,
        downloads: 890,
        featured: false,
        usageCount: 423,
        lastUsed: new Date('2024-01-19'),
        createdAt: new Date('2024-02-01'),
        updatedAt: now,
        changelog: [
          {
            version: '1.5.2',
            date: now,
            changes: ['修复检测精度问题', '优化GPU使用效率'],
            breaking: false
          }
        ],
        performanceMetrics: {
          taskCompletionTime: 2.8,
          accuracy: 0.88,
          resourceUtilization: 0.65,
          learningImprovement: 0.05
        }
      }
    }
  ];
};

/**
 * 生成模拟工作流数据
 * @returns 工作流定义数组
 */
export const generateMockWorkflows = (): WorkflowDefinition[] => {
  return [
    {
      id: 'workflow-content-analysis-001',
      name: '内容分析工作流',
      description: '自动化内容分析流程，包括文本理解、情感分析和关键信息提取',
      version: '1.0.0',
      nodes: [
        {
          id: 'node-start-001',
          type: 'start',
          name: '开始',
          description: '工作流开始节点',
          position: { x: 100, y: 100 },
          size: { width: 120, height: 60 },
          config: {},
          inputs: [],
          outputs: [
            {
              id: 'start-output',
              name: 'trigger',
              dataType: 'object',
              description: '触发信号',
              value: null,
              connected: false
            }
          ],
          status: AgentStatus.IDLE
        },
        {
          id: 'node-nlp-001',
          type: 'capability',
          name: '文本理解',
          description: '自然语言理解处理',
          position: { x: 300, y: 100 },
          size: { width: 150, height: 80 },
          config: {
            capabilityId: 'cap-nlp-understanding-001',
            parameters: {
              language: 'auto',
              includeEntities: true,
              includeSentiment: true
            }
          },
          inputs: [
            {
              id: 'nlp-input-text',
              name: 'text',
              dataType: 'string',
              required: true,
              value: '',
              connected: true
            }
          ],
          outputs: [
            {
              id: 'nlp-output-result',
              name: 'analysis_result',
              dataType: 'object',
              description: '分析结果',
              value: null,
              connected: true
            }
          ],
          capability: generateMockCapabilities()[0],
          status: AgentStatus.IDLE
        },
        {
          id: 'node-decision-001',
          type: 'capability',
          name: '结果评估',
          description: '基于分析结果进行决策',
          position: { x: 500, y: 100 },
          size: { width: 150, height: 80 },
          config: {
            capabilityId: 'cap-decision-making-004',
            parameters: {
              method: 'TOPSIS',
              threshold: 0.7
            }
          },
          inputs: [
            {
              id: 'decision-input-data',
              name: 'analysis_data',
              dataType: 'object',
              required: true,
              value: '',
              connected: true
            }
          ],
          outputs: [
            {
              id: 'decision-output-result',
              name: 'decision_result',
              dataType: 'object',
              description: '决策结果',
              value: null,
              connected: true
            }
          ],
          capability: generateMockCapabilities()[3],
          status: 'idle'
        },
        {
          id: 'node-end-001',
          type: 'end',
          name: '结束',
          description: '工作流结束节点',
          position: { x: 700, y: 100 },
          size: { width: 120, height: 60 },
          config: {},
          inputs: [
            {
              id: 'end-input',
              name: 'result',
              dataType: 'object',
              required: true,
              value: '',
              connected: true
            }
          ],
          outputs: [],
          status: 'idle'
        }
      ],
      edges: [
        {
          id: 'edge-001',
          sourceNodeId: 'node-start-001',
          sourceOutputId: 'start-output',
          targetNodeId: 'node-nlp-001',
          targetInputId: 'nlp-input-text',
          status: 'idle'
        },
        {
          id: 'edge-002',
          sourceNodeId: 'node-nlp-001',
          sourceOutputId: 'nlp-output-result',
          targetNodeId: 'node-decision-001',
          targetInputId: 'decision-input-data',
          status: 'idle'
        },
        {
          id: 'edge-003',
          sourceNodeId: 'node-decision-001',
          sourceOutputId: 'decision-output-result',
          targetNodeId: 'node-end-001',
          targetInputId: 'end-input',
          status: 'idle'
        }
      ],
      variables: [
        {
          id: 'var-input-text',
          name: 'inputText',
          type: 'string',
          defaultValue: '',
          description: '输入文本内容'
        },
        {
          id: 'var-confidence-threshold',
          name: 'confidenceThreshold',
          type: 'number',
          defaultValue: 0.8,
          description: '置信度阈值'
        }
      ],
      triggers: [
        {
          id: 'trigger-manual-001',
          type: 'manual',
          config: {
            name: '手动触发',
            description: '手动启动工作流'
          },
          enabled: true
        },
        {
          id: 'trigger-webhook-001',
          type: 'webhook',
          config: {
            url: '/api/workflows/content-analysis/trigger',
            method: 'POST',
            authentication: true
          },
          enabled: false
        }
      ],
      orchestrationConfig: {
        mode: CapabilityOrchestrationMode.SEQUENTIAL,
        timeout: 300000,
        retryPolicy: {
          maxRetries: 3,
          backoffStrategy: 'exponential',
          initialDelay: 1000,
          maxDelay: 10000,
          retryableErrors: ['timeout', 'network']
        },
        errorHandling: 'stop'
      },
      metadata: {
        author: 'Workflow Team',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-20'),
        tags: ['content', 'analysis', 'nlp', 'decision'],
        category: 'content-processing',
        status: 'published',
        permissions: {
          read: ['*'],
          write: ['admin', 'developer'],
          execute: ['*']
        }
      }
    },
    {
      id: 'workflow-image-processing-002',
      name: '图像处理工作流',
      description: '智能图像处理流程，包括图像识别、分析和结果输出',
      version: '1.2.0',
      nodes: [
        {
          id: 'node-start-002',
          type: 'start',
          name: '开始',
          description: '工作流开始节点',
          position: { x: 100, y: 200 },
          size: { width: 120, height: 60 },
          config: {},
          inputs: [],
          outputs: [
            {
              id: 'start-output-002',
              name: 'trigger',
              dataType: 'object',
              value: null,
              connected: false
            }
          ],
          status: 'idle'
        },
        {
          id: 'node-vision-002',
          type: 'capability',
          name: '图像识别',
          description: '计算机视觉分析',
          position: { x: 300, y: 200 },
          size: { width: 150, height: 80 },
          config: {
            capabilityId: 'cap-vision-recognition-002',
            parameters: {
              confidence_threshold: 0.5,
              include_ocr: true,
              include_faces: false
            }
          },
          inputs: [
            {
              id: 'vision-input-image',
              name: 'image',
              dataType: 'file',
              required: true,
              value: '',
              connected: true
            }
          ],
          outputs: [
            {
              id: 'vision-output-result',
              name: 'recognition_result',
              dataType: 'object',
              value: null,
              connected: true
            }
          ],
          capability: generateMockCapabilities()[1],
          status: 'idle'
        },
        {
          id: 'node-end-002',
          type: 'end',
          name: '结束',
          description: '工作流结束节点',
          position: { x: 500, y: 200 },
          size: { width: 120, height: 60 },
          config: {},
          inputs: [
            {
              id: 'end-input-002',
              name: 'result',
              dataType: 'object',
              required: true,
              value: '',
              connected: true
            }
          ],
          outputs: [],
          status: 'idle'
        }
      ],
      edges: [
        {
          id: 'edge-004',
          sourceNodeId: 'node-start-002',
          sourceOutputId: 'start-output-002',
          targetNodeId: 'node-vision-002',
          targetInputId: 'vision-input-image',
          status: 'idle'
        },
        {
          id: 'edge-005',
          sourceNodeId: 'node-vision-002',
          sourceOutputId: 'vision-output-result',
          targetNodeId: 'node-end-002',
          targetInputId: 'end-input-002',
          status: 'idle'
        }
      ],
      variables: [
        {
          id: 'var-image-file',
          name: 'imageFile',
          type: 'file',
          defaultValue: null,
          description: '输入图像文件'
        }
      ],
      triggers: [
        {
          id: 'trigger-manual-002',
          type: 'manual',
          config: {
            name: '手动触发',
            description: '手动启动图像处理'
          },
          enabled: true
        }
      ],
      orchestrationConfig: {
        mode: CapabilityOrchestrationMode.SEQUENTIAL,
        timeout: 300000,
        retryPolicy: {
          maxRetries: 3,
          backoffStrategy: 'exponential',
          initialDelay: 1000,
          maxDelay: 10000,
          retryableErrors: ['timeout', 'network']
        },
        errorHandling: 'stop'
      },
      metadata: {
        author: 'Vision Team',
        createdAt: new Date('2023-12-15'),
        updatedAt: new Date('2024-01-18'),
        tags: ['image', 'vision', 'recognition', 'processing'],
        category: 'image-processing',
        status: 'published',
        permissions: {
          read: ['*'],
          write: ['admin', 'developer'],
          execute: ['*']
        }
      }
    }
  ];
};

/**
 * 生成模拟工作流执行历史
 * @returns 工作流执行数组
 */
export const generateMockExecutions = (): WorkflowExecution[] => {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
  
  return [
    {
      id: 'exec-001',
      workflowId: 'workflow-content-analysis-001',
      status: 'completed',
      startTime: twoHoursAgo,
      endTime: new Date(twoHoursAgo.getTime() + 25000),
      currentNode: 'node-end-001',
      nodeExecutions: [
        {
          nodeId: 'node-start-001',
          status: 'completed',
          startTime: twoHoursAgo,
          endTime: new Date(twoHoursAgo.getTime() + 1000),
          input: {},
          output: { trigger: true },
          metrics: {
            duration: 1000,
            cpuUsage: 15,
            memoryUsage: 20,
            retryCount: 0
          }
        },
        {
          nodeId: 'node-nlp-001',
          status: 'completed',
          startTime: new Date(twoHoursAgo.getTime() + 1000),
          endTime: new Date(twoHoursAgo.getTime() + 15000),
          input: { text: '这是一个很好的产品，我非常满意！' },
          output: {
            sentiment: 'positive',
            confidence: 0.95,
            entities: ['产品'],
            intent: 'praise'
          },
          metrics: {
            duration: 14000,
            cpuUsage: 40,
            memoryUsage: 50,
            retryCount: 0
          }
        },
        {
          nodeId: 'node-decision-001',
          status: 'completed',
          startTime: new Date(twoHoursAgo.getTime() + 15000),
          endTime: new Date(twoHoursAgo.getTime() + 24000),
          input: {
            analysis_data: {
              sentiment: 'positive',
              confidence: 0.95
            }
          },
          output: {
            recommendation: 'approve',
            confidence: 0.88
          },
          metrics: {
            duration: 9000,
            cpuUsage: 35,
            memoryUsage: 45,
            retryCount: 0
          }
        },
        {
          nodeId: 'node-end-001',
          status: 'completed',
          startTime: new Date(twoHoursAgo.getTime() + 24000),
          endTime: new Date(twoHoursAgo.getTime() + 25000),
          input: {
            result: {
              recommendation: 'approve',
              confidence: 0.88
            }
          },
          output: {},
          metrics: {
            duration: 1000,
            cpuUsage: 20,
            memoryUsage: 25,
            retryCount: 0
          }
        }
      ],
      metrics: {
        totalDuration: 25000,
        nodeCount: 4,
        successCount: 4,
        failureCount: 0,
        averageNodeDuration: 6250,
        throughput: 0.16
      },
      progress: 100
    },
    {
      id: 'exec-002',
      workflowId: 'workflow-image-processing-002',
      status: 'running',
      startTime: oneHourAgo,
      currentNode: 'node-vision-002',
      nodeExecutions: [
        {
          nodeId: 'node-start-002',
          status: 'completed',
          startTime: oneHourAgo,
          endTime: new Date(oneHourAgo.getTime() + 500),
          input: {},
          output: { trigger: true },
          metrics: {
            duration: 500,
            cpuUsage: 25,
            memoryUsage: 35,
            retryCount: 0
          }
        },
        {
          nodeId: 'node-vision-002',
          status: AgentStatus.RUNNING,
          startTime: new Date(oneHourAgo.getTime() + 500),
          input: { image: 'sample_image.jpg' },
          output: null,
          metrics: {
            duration: 0,
            cpuUsage: 45,
            memoryUsage: 60,
            retryCount: 0
          }
        }
      ],
      metrics: {
        totalDuration: 0,
        nodeCount: 3,
        successCount: 2,
        failureCount: 1,
        averageNodeDuration: 250,
        throughput: 1.2
      },
      progress: 66
    },
    {
      id: 'exec-003',
      workflowId: 'workflow-content-analysis-001',
      status: 'failed',
      startTime: new Date(now.getTime() - 30 * 60 * 1000),
      endTime: new Date(now.getTime() - 25 * 60 * 1000),
      currentNode: 'node-nlp-001',
      nodeExecutions: [
        {
          nodeId: 'node-start-001',
          status: 'completed',
          startTime: new Date(now.getTime() - 30 * 60 * 1000),
          endTime: new Date(now.getTime() - 29 * 60 * 1000),
          input: {},
          output: { trigger: true },
          metrics: {
            duration: 1000,
            cpuUsage: 20,
            memoryUsage: 30,
            retryCount: 0
          }
        },
        {
          nodeId: 'node-nlp-001',
          status: 'failed',
          startTime: new Date(now.getTime() - 29 * 60 * 1000),
          endTime: new Date(now.getTime() - 25 * 60 * 1000),
          input: { text: '这是一个测试文本' },
          output: null,
          error: 'TIMEOUT_ERROR: 处理超时 - NLP服务响应超时',
          metrics: {
            duration: 4000,
            cpuUsage: 30,
            memoryUsage: 40,
            retryCount: 2
          }
        }
      ],
      metrics: {
        totalDuration: 5000,
        nodeCount: 4,
        successCount: 1,
        failureCount: 3,
        averageNodeDuration: 2500,
        throughput: 0.8
      },
      progress: 25,
      error: '节点执行失败: node-nlp-001'
    }
  ];
};

/**
 * 获取所有模拟数据
 * @returns 包含所有模拟数据的对象
 */
export const getAllMockData = () => {
  return {
    capabilities: generateMockCapabilities(),
    agents: generateMockAgents(),
    workflows: generateMockWorkflows(),
    executions: generateMockExecutions()
  };
};

/**
 * 根据类型获取模拟数据
 * @param type 数据类型
 * @returns 对应类型的模拟数据
 */
export const getMockDataByType = (type: 'capabilities' | 'agents' | 'workflows' | 'executions') => {
  const allData = getAllMockData();
  return allData[type];
};

/**
 * 根据ID获取特定的能力模块
 * @param id 能力模块ID
 * @returns 能力模块或undefined
 */
export const getMockCapabilityById = (id: string): CoreCapabilityModule | undefined => {
  return generateMockCapabilities().find(cap => cap.id === id);
};

/**
 * 根据ID获取特定的Agent
 * @param id Agent ID
 * @returns Agent或undefined
 */
export const getMockAgentById = (id: string): Agent2_0 | undefined => {
  return generateMockAgents().find(agent => agent.id === id);
};

/**
 * 根据ID获取特定的工作流
 * @param id 工作流ID
 * @returns 工作流或undefined
 */
export const getMockWorkflowById = (id: string): WorkflowDefinition | undefined => {
  return generateMockWorkflows().find(workflow => workflow.id === id);
};

/**
 * 根据类型筛选能力模块
 * @param type 能力类型
 * @returns 筛选后的能力模块数组
 */
export const getMockCapabilitiesByType = (type: CoreCapabilityType): CoreCapabilityModule[] => {
  return generateMockCapabilities().filter(cap => cap.type === type);
};

/**
 * 根据状态筛选Agent
 * @param status Agent状态
 * @returns 筛选后的Agent数组
 */
export const getMockAgentsByStatus = (status: string): Agent2_0[] => {
  return generateMockAgents().filter(agent => agent.status === status);
};

/**
 * 根据状态筛选工作流执行
 * @param status 执行状态
 * @returns 筛选后的执行数组
 */
export const getMockExecutionsByStatus = (status: string): WorkflowExecution[] => {
  return generateMockExecutions().filter(exec => exec.status === status);
};

// 导出默认数据
export default {
  capabilities: generateMockCapabilities(),
  agents: generateMockAgents(),
  workflows: generateMockWorkflows(),
  executions: generateMockExecutions()
};