// enrichedCapabilityData.ts
// EFIAgent 2.0 能力库丰富模拟数据
// 为每个能力分类提供详细的示例数据

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
  CapabilitySourceType
} from '../components/CapabilitySystemTypes';

/**
 * 为能力库的每个分类生成丰富的模拟数据
 * 包含14个主要分类，每个分类3-5个详细的能力示例
 */
export const generateEnrichedCapabilityData = (): CoreCapabilityModule[] => {
  return [
    // ===== 1. PERCEPTION (感知处理) =====
    {
      id: 'cap-perception-001',
      name: '多模态感知融合',
      description: '融合视觉、听觉、文本等多种模态信息，提供统一的感知理解',
      type: CoreCapabilityType.COGNITIVE,
      subType: CognitiveCapabilityType.PERCEPTION,
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
      outputs: [
        {
          id: 'perception_result',
          name: 'unified_perception',
          dataType: 'object',
          description: '统一感知结果',
          schema: undefined,
          examples: [{
            name: '感知融合结果',
            description: '多模态感知的综合输出',
            value: {
              scene_understanding: '会议室场景',
              emotion_detected: 'positive',
              key_objects: ['人物', '投影仪', '文档'],
              audio_sentiment: 'professional',
              text_summary: '产品发布会议讨论'
            }
          }]
        }
      ],
      config: {
        executionMode: 'async',
        timeout: 60000,
        retryPolicy: {
          maxRetries: 2,
          backoffStrategy: 'exponential',
          initialDelay: 2000,
          maxDelay: 8000,
          retryableErrors: ['timeout', 'processing_error']
        },
        qualityThreshold: 0.85,
        performanceTarget: {
          responseTime: 5000,
          throughput: 20,
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
          fusion_weights: { vision: 0.4, audio: 0.3, text: 0.3 },
          confidence_threshold: 0.7
        }
      },
      dependencies: [],
      metrics: {
        avgResponseTime: 4200,
        throughput: 18,
        successRate: 0.92,
        errorRate: 0.08,
        accuracy: 0.89,
        precision: 0.87,
        recall: 0.91,
        f1Score: 0.89,
        usageCount: 3200,
        activeUsers: 85,
        avgCpuUsage: 70,
        avgMemoryUsage: 85,
        avgTokenUsage: 0,
        lastUpdated: new Date('2024-01-20')
      },
      resources: [
        { type: 'gpu', amount: 2, unit: 'cards', priority: 'high' },
        { type: 'memory', amount: 16, unit: 'GB', priority: 'high' }
      ],
      sources: [{
        id: 'multimodal_engine',
        type: CapabilitySourceType.BUILTIN,
        name: 'Multimodal Fusion Engine',
        description: '内置多模态融合引擎',
        config: {},
        version: '2.0.0',
        reliability: 0.92
      }],
      createdAt: new Date('2023-09-01'),
      updatedAt: new Date('2024-01-20'),
      author: 'Perception Team',
      tags: ['multimodal', 'fusion', 'perception', 'ai'],
      metadata: {
        author: 'Perception Team',
        organization: 'EFIAgent Corp',
        license: 'MIT',
        category: 'ai-perception',
        complexity: 'complex',
        difficulty: 'advanced',
        rating: 4.6,
        downloads: 1800,
        featured: true,
        verified: true,
        documentation: 'https://docs.efiagent.com/capabilities/multimodal-perception',
        examples: [],
        changelog: [],
        tags: ['multimodal', 'fusion', 'perception', 'ai'],
        implementation: {
          language: 'Python',
          framework: 'PyTorch',
          dependencies: ['torch', 'transformers', 'opencv-python', 'librosa'],
          runtime: 'Python 3.9+',
          gpu: true,
          distributed: true,
          resources: { cpu: '4 cores', memory: '16GB', gpu: '2 GPUs' }
        }
      }
    },

    {
      id: 'cap-perception-002',
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
              { type: 'humidity', value: 45, unit: '%', location: 'room_101' },
              { type: 'motion', value: true, location: 'corridor_a' }
            ]
          }]
        }
      ],
      outputs: [
        {
          id: 'environment_state',
          name: 'environment_analysis',
          dataType: 'object',
          description: '环境状态分析',
          schema: undefined,
          examples: [{
            name: '环境分析结果',
            description: '综合环境状态评估',
            value: {
              overall_status: 'normal',
              comfort_level: 8.5,
              anomalies: [],
              recommendations: ['调整空调温度', '增加通风'],
              energy_efficiency: 0.82
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
          retryableErrors: ['sensor_error', 'network_timeout']
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
        avgResponseTime: 150,
        throughput: 950,
        successRate: 0.98,
        errorRate: 0.02,
        accuracy: 0.96,
        precision: 0.94,
        recall: 0.98,
        f1Score: 0.96,
        usageCount: 25000,
        activeUsers: 120,
        avgCpuUsage: 25,
        avgMemoryUsage: 30,
        avgTokenUsage: 0,
        lastUpdated: new Date('2024-01-19')
      },
      resources: [
        { type: 'cpu', amount: 2, unit: 'cores', priority: 'medium' },
        { type: 'memory', amount: 4, unit: 'GB', priority: 'medium' }
      ],
      sources: [{
        id: 'iot_platform',
        type: CapabilitySourceType.EXTERNAL_API,
        name: 'IoT Platform API',
        description: '物联网平台接口',
        config: { endpoint: 'https://iot.platform.com/api' },
        version: '1.8.0',
        reliability: 0.98
      }],
      createdAt: new Date('2023-07-15'),
      updatedAt: new Date('2024-01-19'),
      author: 'IoT Team',
      tags: ['iot', 'sensors', 'real-time', 'environment'],
      metadata: {
        author: 'IoT Team',
        organization: 'Smart Building Corp',
        license: 'Commercial',
        category: 'iot-perception',
        complexity: 'medium',
        difficulty: 'intermediate',
        rating: 4.4,
        downloads: 2100,
        featured: false,
        verified: true,
        documentation: 'https://docs.efiagent.com/capabilities/environment-perception',
        examples: [],
        changelog: [],
        tags: ['iot', 'sensors', 'real-time', 'environment'],
        implementation: {
          language: 'Python',
          framework: 'FastAPI',
          dependencies: ['fastapi', 'pydantic', 'numpy', 'pandas'],
          runtime: 'Python 3.8+',
          gpu: false,
          distributed: true,
          resources: { cpu: '2 cores', memory: '4GB', gpu: '0' }
        }
      }
    },

    // ===== 2. NLP (自然语言处理) =====
    {
      id: 'cap-nlp-001',
      name: '高级文本生成',
      description: '基于大语言模型的高质量文本生成，支持多种写作风格和领域',
      type: CoreCapabilityType.COGNITIVE,
      subType: CognitiveCapabilityType.UNDERSTANDING,
      version: '3.2.1',
      maturityLevel: CapabilityMaturityLevel.OPTIMIZED,
      source: CapabilitySource.BUILTIN,
      category: CapabilityCategory.NLP,
      inputs: [
        {
          id: 'generation_prompt',
          name: 'prompt',
          dataType: 'string',
          description: '生成提示词',
          required: true,
          validation: { type: 'string', maxLength: 2000 },
          examples: [{
            name: '商业报告生成',
            description: '生成季度业务报告',
            value: '请生成一份关于Q4销售业绩的商业报告，包含数据分析和市场趋势'
          }]
        },
        {
          id: 'generation_config',
          name: 'config',
          dataType: 'object',
          description: '生成配置参数',
          required: false,
          validation: { type: 'object' },
          examples: [{
            name: '生成配置',
            description: '文本生成的详细配置',
            value: {
              style: 'professional',
              length: 'medium',
              tone: 'formal',
              language: 'zh-CN'
            }
          }]
        }
      ],
      outputs: [
        {
          id: 'generated_text',
          name: 'generated_content',
          dataType: 'object',
          description: '生成的文本内容',
          schema: undefined,
          examples: [{
            name: '生成结果',
            description: '高质量的文本生成输出',
            value: {
              content: '# Q4销售业绩报告\n\n## 概述\n本季度销售业绩表现优异...',
              metadata: {
                word_count: 1250,
                readability_score: 8.5,
                confidence: 0.92
              }
            }
          }]
        }
      ],
      config: {
        executionMode: 'async',
        timeout: 30000,
        retryPolicy: {
          maxRetries: 2,
          backoffStrategy: 'exponential',
          initialDelay: 1000,
          maxDelay: 5000,
          retryableErrors: ['timeout', 'model_error']
        },
        qualityThreshold: 0.85,
        performanceTarget: {
          responseTime: 3000,
          throughput: 50,
          accuracy: 0.9,
          availability: 0.98
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
          model: 'gpt-4-turbo',
          max_tokens: 2048,
          temperature: 0.7,
          top_p: 0.9
        }
      },
      dependencies: [],
      metrics: {
        avgResponseTime: 2800,
        throughput: 45,
        successRate: 0.96,
        errorRate: 0.04,
        accuracy: 0.91,
        precision: 0.89,
        recall: 0.93,
        f1Score: 0.91,
        usageCount: 18000,
        activeUsers: 320,
        avgCpuUsage: 40,
        avgMemoryUsage: 60,
        avgTokenUsage: 1200,
        lastUpdated: new Date('2024-01-21')
      },
      resources: [
        { type: 'gpu', amount: 1, unit: 'cards', priority: 'high' },
        { type: 'memory', amount: 8, unit: 'GB', priority: 'high' }
      ],
      sources: [{
        id: 'llm_service',
        type: CapabilitySourceType.LLM_MODELS,
        name: 'Large Language Model Service',
        description: '大语言模型服务',
        config: { model_name: 'gpt-4-turbo', api_version: 'v1' },
        version: '3.2.1',
        reliability: 0.96
      }],
      createdAt: new Date('2023-11-01'),
      updatedAt: new Date('2024-01-21'),
      author: 'NLP Advanced Team',
      tags: ['text-generation', 'llm', 'writing', 'content-creation'],
      metadata: {
        author: 'NLP Advanced Team',
        organization: 'EFIAgent Corp',
        license: 'MIT',
        category: 'ai-nlp',
        complexity: 'complex',
        difficulty: 'intermediate',
        rating: 4.8,
        downloads: 5600,
        featured: true,
        verified: true,
        documentation: 'https://docs.efiagent.com/capabilities/text-generation',
        examples: [],
        changelog: [],
        tags: ['text-generation', 'llm', 'writing', 'content-creation'],
        implementation: {
          language: 'Python',
          framework: 'Transformers',
          dependencies: ['transformers', 'torch', 'tokenizers'],
          runtime: 'Python 3.9+',
          gpu: true,
          distributed: false,
          resources: { cpu: '4 cores', memory: '8GB', gpu: '1 GPU' }
        }
      }
    },

    {
      id: 'cap-nlp-002',
      name: '智能对话管理',
      description: '多轮对话状态管理和上下文理解，支持复杂对话场景',
      type: CoreCapabilityType.COGNITIVE,
      subType: CognitiveCapabilityType.UNDERSTANDING,
      version: '2.5.0',
      maturityLevel: CapabilityMaturityLevel.DEFINED,
      source: CapabilitySource.BUILTIN,
      category: CapabilityCategory.NLP,
      inputs: [
        {
          id: 'conversation_history',
          name: 'dialogue_context',
          dataType: 'array',
          description: '对话历史记录',
          required: true,
          validation: { type: 'array' },
          examples: [{
            name: '客服对话',
            description: '客户服务对话历史',
            value: [
              { role: 'user', content: '我的订单什么时候能到？', timestamp: '2024-01-20T10:00:00Z' },
              { role: 'assistant', content: '请提供您的订单号，我来帮您查询。', timestamp: '2024-01-20T10:00:30Z' },
              { role: 'user', content: '订单号是12345', timestamp: '2024-01-20T10:01:00Z' }
            ]
          }]
        }
      ],
      outputs: [
        {
          id: 'dialogue_state',
          name: 'conversation_state',
          dataType: 'object',
          description: '对话状态和下一步建议',
          schema: undefined,
          examples: [{
            name: '对话状态',
            description: '当前对话的状态分析',
            value: {
              intent: 'order_inquiry',
              entities: { order_id: '12345' },
              context: { customer_type: 'returning', urgency: 'medium' },
              next_action: 'query_order_status',
              confidence: 0.94
            }
          }]
        }
      ],
      config: {
        executionMode: 'sync',
        timeout: 5000,
        retryPolicy: {
          maxRetries: 2,
          backoffStrategy: 'linear',
          initialDelay: 500,
          maxDelay: 2000,
          retryableErrors: ['timeout']
        },
        qualityThreshold: 0.9,
        performanceTarget: {
          responseTime: 500,
          throughput: 200,
          accuracy: 0.92,
          availability: 0.99
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
            interval: 30,
            timeout: 5,
            failureThreshold: 3,
            successThreshold: 1
          }
        },
        parameters: {
          max_context_length: 10,
          intent_confidence_threshold: 0.8,
          entity_extraction_model: 'bert-ner'
        }
      },
      dependencies: [],
      metrics: {
        avgResponseTime: 420,
        throughput: 180,
        successRate: 0.97,
        errorRate: 0.03,
        accuracy: 0.93,
        precision: 0.91,
        recall: 0.95,
        f1Score: 0.93,
        usageCount: 22000,
        activeUsers: 450,
        avgCpuUsage: 35,
        avgMemoryUsage: 45,
        avgTokenUsage: 300,
        lastUpdated: new Date('2024-01-20')
      },
      resources: [
        { type: 'cpu', amount: 2, unit: 'cores', priority: 'medium' },
        { type: 'memory', amount: 4, unit: 'GB', priority: 'medium' }
      ],
      sources: [{
        id: 'dialogue_engine',
        type: CapabilitySourceType.BUILTIN,
        name: 'Dialogue Management Engine',
        description: '内置对话管理引擎',
        config: {},
        version: '2.5.0',
        reliability: 0.97
      }],
      createdAt: new Date('2023-08-01'),
      updatedAt: new Date('2024-01-20'),
      author: 'Dialogue Team',
      tags: ['dialogue', 'conversation', 'context', 'state-management'],
      metadata: {
        author: 'Dialogue Team',
        organization: 'EFIAgent Corp',
        license: 'MIT',
        category: 'ai-dialogue',
        complexity: 'complex',
        difficulty: 'advanced',
        rating: 4.7,
        downloads: 3800,
        featured: true,
        verified: true,
        documentation: 'https://docs.efiagent.com/capabilities/dialogue-management',
        examples: [],
        changelog: [],
        tags: ['dialogue', 'conversation', 'context', 'state-management'],
        implementation: {
          language: 'Python',
          framework: 'Rasa',
          dependencies: ['rasa', 'spacy', 'transformers'],
          runtime: 'Python 3.8+',
          gpu: false,
          distributed: true,
          resources: { cpu: '2 cores', memory: '4GB', gpu: '0' }
        }
      }
    },

    // ===== 3. KNOWLEDGE_GRAPH (知识图谱) =====
    {
      id: 'cap-kg-001',
      name: '知识图谱构建',
      description: '从非结构化文本中自动抽取实体和关系，构建知识图谱',
      type: CoreCapabilityType.COGNITIVE,
      subType: CognitiveCapabilityType.UNDERSTANDING,
      version: '2.1.0',
      maturityLevel: CapabilityMaturityLevel.DEFINED,
      source: CapabilitySource.BUILTIN,
      category: CapabilityCategory.KNOWLEDGE_GRAPH,
      inputs: [
        {
          id: 'text_corpus',
          name: 'text_documents',
          dataType: 'array',
          description: '文本文档集合',
          required: true,
          validation: { type: 'array' },
          examples: [{
            name: '企业文档',
            description: '企业内部文档集合',
            value: [
              '张三是产品经理，负责移动应用开发项目。',
              '李四是技术总监，管理开发团队。',
              '移动应用项目使用React Native技术栈。'
            ]
          }]
        }
      ],
      outputs: [
        {
          id: 'knowledge_graph',
          name: 'extracted_graph',
          dataType: 'object',
          description: '构建的知识图谱',
          schema: undefined,
          examples: [{
            name: '知识图谱',
            description: '抽取的实体关系图',
            value: {
              entities: [
                { id: 'e1', name: '张三', type: 'Person' },
                { id: 'e2', name: '产品经理', type: 'Position' },
                { id: 'e3', name: '移动应用开发项目', type: 'Project' }
              ],
              relations: [
                { source: 'e1', target: 'e2', relation: '担任' },
                { source: 'e1', target: 'e3', relation: '负责' }
              ]
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
          initialDelay: 3000,
          maxDelay: 10000,
          retryableErrors: ['timeout', 'extraction_error']
        },
        qualityThreshold: 0.8,
        performanceTarget: {
          responseTime: 15000,
          throughput: 10,
          accuracy: 0.85,
          availability: 0.95
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
          entity_model: 'bert-ner',
          relation_model: 'bert-relation',
          confidence_threshold: 0.7
        }
      },
      dependencies: [],
      metrics: {
        avgResponseTime: 12000,
        throughput: 8,
        successRate: 0.91,
        errorRate: 0.09,
        accuracy: 0.86,
        precision: 0.84,
        recall: 0.88,
        f1Score: 0.86,
        usageCount: 1200,
        activeUsers: 45,
        avgCpuUsage: 60,
        avgMemoryUsage: 70,
        avgTokenUsage: 800,
        lastUpdated: new Date('2024-01-18')
      },
      resources: [
        { type: 'cpu', amount: 4, unit: 'cores', priority: 'high' },
        { type: 'memory', amount: 8, unit: 'GB', priority: 'high' }
      ],
      sources: [{
        id: 'kg_builder',
        type: CapabilitySourceType.BUILTIN,
        name: 'Knowledge Graph Builder',
        description: '知识图谱构建引擎',
        config: {},
        version: '2.1.0',
        reliability: 0.91
      }],
      createdAt: new Date('2023-09-15'),
      updatedAt: new Date('2024-01-18'),
      author: 'Knowledge Team',
      tags: ['knowledge-graph', 'entity-extraction', 'relation-extraction', 'nlp'],
      metadata: {
        author: 'Knowledge Team',
        organization: 'EFIAgent Corp',
        license: 'MIT',
        category: 'ai-knowledge',
        complexity: 'complex',
        difficulty: 'advanced',
        rating: 4.3,
        downloads: 980,
        featured: false,
        verified: true,
        documentation: 'https://docs.efiagent.com/capabilities/knowledge-graph-construction',
        examples: [],
        changelog: [],
        tags: ['knowledge-graph', 'entity-extraction', 'relation-extraction', 'nlp'],
        implementation: {
          language: 'Python',
          framework: 'spaCy',
          dependencies: ['spacy', 'networkx', 'transformers'],
          runtime: 'Python 3.9+',
          gpu: false,
          distributed: true,
          resources: { cpu: '4 cores', memory: '8GB', gpu: '0' }
        }
      }
    },

    // ===== 4. REASONING (推理) =====
    {
      id: 'cap-reasoning-001',
      name: '因果推理分析',
      description: '基于因果图和统计方法进行因果关系推理和分析',
      type: CoreCapabilityType.REASONING,
      subType: ReasoningCapabilityType.CAUSAL,
      version: '1.9.0',
      maturityLevel: CapabilityMaturityLevel.MANAGED,
      source: CapabilitySource.CUSTOM,
      category: CapabilityCategory.REASONING,
      inputs: [
        {
          id: 'causal_data',
          name: 'observational_data',
          dataType: 'object',
          description: '观察数据和变量定义',
          required: true,
          validation: { type: 'object' },
          examples: [{
            name: '营销效果分析',
            description: '分析广告投入对销售的因果影响',
            value: {
              variables: ['ad_spend', 'sales', 'season', 'competition'],
              data: [
                { ad_spend: 1000, sales: 5000, season: 'spring', competition: 'low' },
                { ad_spend: 1500, sales: 7000, season: 'summer', competition: 'medium' }
              ]
            }
          }]
        }
      ],
      outputs: [
        {
          id: 'causal_analysis',
          name: 'causal_effects',
          dataType: 'object',
          description: '因果效应分析结果',
          schema: undefined,
          examples: [{
            name: '因果分析结果',
            description: '因果关系和效应大小',
            value: {
              causal_effects: {
                'ad_spend -> sales': { effect: 3.2, confidence: 0.85, p_value: 0.02 }
              },
              confounders: ['season'],
              recommendations: ['增加广告投入可能提升销售']
            }
          }]
        }
      ],
      config: {
        executionMode: 'async',
        timeout: 60000,
        retryPolicy: {
          maxRetries: 2,
          backoffStrategy: 'exponential',
          initialDelay: 2000,
          maxDelay: 8000,
          retryableErrors: ['computation_error', 'timeout']
        },
        qualityThreshold: 0.8,
        performanceTarget: {
          responseTime: 10000,
          throughput: 15,
          accuracy: 0.82,
          availability: 0.96
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
            failureThreshold: 3,
            successThreshold: 1
          }
        },
        parameters: {
          method: 'do-calculus',
          significance_level: 0.05,
          bootstrap_samples: 1000
        }
      },
      dependencies: [],
      metrics: {
        avgResponseTime: 8500,
        throughput: 12,
        successRate: 0.89,
        errorRate: 0.11,
        accuracy: 0.83,
        precision: 0.81,
        recall: 0.85,
        f1Score: 0.83,
        usageCount: 650,
        activeUsers: 28,
        avgCpuUsage: 55,
        avgMemoryUsage: 65,
        avgTokenUsage: 0,
        lastUpdated: new Date('2024-01-17')
      },
      resources: [
        { type: 'cpu', amount: 4, unit: 'cores', priority: 'high' },
        { type: 'memory', amount: 6, unit: 'GB', priority: 'medium' }
      ],
      sources: [{
        id: 'causal_engine',
        type: CapabilitySourceType.CUSTOM_MODULE,
        name: 'Causal Inference Engine',
        description: '因果推理引擎',
        config: {},
        version: '1.9.0',
        reliability: 0.89
      }],
      createdAt: new Date('2023-10-01'),
      updatedAt: new Date('2024-01-17'),
      author: 'Causal AI Team',
      tags: ['causal-inference', 'statistics', 'reasoning', 'analysis'],
      metadata: {
        author: 'Causal AI Team',
        organization: 'Research Institute',
        license: 'Apache-2.0',
        category: 'ai-reasoning',
        complexity: 'complex',
        difficulty: 'expert',
        rating: 4.1,
        downloads: 420,
        featured: false,
        verified: true,
        documentation: 'https://docs.efiagent.com/capabilities/causal-reasoning',
        examples: [],
        changelog: [],
        tags: ['causal-inference', 'statistics', 'reasoning', 'analysis'],
        implementation: {
          language: 'Python',
          framework: 'DoWhy',
          dependencies: ['dowhy', 'numpy', 'pandas', 'scipy'],
          runtime: 'Python 3.9+',
          gpu: false,
          distributed: false,
          resources: { cpu: '4 cores', memory: '6GB', gpu: '0' }
        }
      }
    },

    // ===== 5. PLANNING (规划) =====
    {
      id: 'cap-planning-001',
      name: '智能任务规划',
      description: '基于约束和目标的智能任务规划和调度系统',
      type: CoreCapabilityType.REASONING,
      subType: ReasoningCapabilityType.LOGICAL,
      version: '2.4.0',
      maturityLevel: CapabilityMaturityLevel.OPTIMIZED,
      source: CapabilitySource.BUILTIN,
      category: CapabilityCategory.PLANNING,
      inputs: [
        {
          id: 'planning_problem',
          name: 'problem_definition',
          dataType: 'object',
          description: '规划问题定义',
          required: true,
          validation: { type: 'object' },
          examples: [{
            name: '项目任务规划',
            description: '软件开发项目的任务规划',
            value: {
              tasks: [
                { id: 't1', name: '需求分析', duration: 5, dependencies: [] },
                { id: 't2', name: '系统设计', duration: 8, dependencies: ['t1'] },
                { id: 't3', name: '编码实现', duration: 15, dependencies: ['t2'] }
              ],
              resources: [
                { id: 'r1', name: '产品经理', capacity: 1 },
                { id: 'r2', name: '开发工程师', capacity: 3 }
              ],
              constraints: {
                deadline: '2024-03-01',
                budget: 100000
              }
            }
          }]
        }
      ],
      outputs: [
        {
          id: 'execution_plan',
          name: 'optimized_plan',
          dataType: 'object',
          description: '优化的执行计划',
          schema: undefined,
          examples: [{
            name: '执行计划',
            description: '优化后的任务执行计划',
            value: {
              schedule: [
                { task: 't1', start: '2024-01-22', end: '2024-01-26', resource: 'r1' },
                { task: 't2', start: '2024-01-29', end: '2024-02-05', resource: 'r1' },
                { task: 't3', start: '2024-02-06', end: '2024-02-20', resource: 'r2' }
              ],
              metrics: {
                total_duration: 30,
                resource_utilization: 0.85,
                cost: 95000
              }
            }
          }]
        }
      ],
      config: {
        executionMode: 'async',
        timeout: 45000,
        retryPolicy: {
          maxRetries: 2,
          backoffStrategy: 'linear',
          initialDelay: 2000,
          maxDelay: 6000,
          retryableErrors: ['optimization_error', 'timeout']
        },
        qualityThreshold: 0.85,
        performanceTarget: {
          responseTime: 8000,
          throughput: 20,
          accuracy: 0.88,
          availability: 0.97
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
            failureThreshold: 3,
            successThreshold: 1
          }
        },
        parameters: {
          algorithm: 'genetic_algorithm',
          population_size: 100,
          generations: 50,
          mutation_rate: 0.1
        }
      },
      dependencies: [],
      metrics: {
        avgResponseTime: 7200,
        throughput: 18,
        successRate: 0.93,
        errorRate: 0.07,
        accuracy: 0.89,
        precision: 0.87,
        recall: 0.91,
        f1Score: 0.89,
        usageCount: 2800,
        activeUsers: 95,
        avgCpuUsage: 65,
        avgMemoryUsage: 55,
        avgTokenUsage: 0,
        lastUpdated: new Date('2024-01-19')
      },
      resources: [
        { type: 'cpu', amount: 4, unit: 'cores', priority: 'high' },
        { type: 'memory', amount: 6, unit: 'GB', priority: 'medium' }
      ],
      sources: [{
        id: 'planning_engine',
        type: CapabilitySourceType.BUILTIN,
        name: 'Task Planning Engine',
        description: '任务规划引擎',
        config: {},
        version: '2.4.0',
        reliability: 0.93
      }],
      createdAt: new Date('2023-07-01'),
      updatedAt: new Date('2024-01-19'),
      author: 'Planning Team',
      tags: ['planning', 'scheduling', 'optimization', 'project-management'],
      metadata: {
        author: 'Planning Team',
        organization: 'EFIAgent Corp',
        license: 'MIT',
        category: 'ai-planning',
        complexity: 'complex',
        difficulty: 'advanced',
        rating: 4.5,
        downloads: 1600,
        featured: true,
        verified: true,
        documentation: 'https://docs.efiagent.com/capabilities/task-planning',
        examples: [],
        changelog: [],
        tags: ['planning', 'scheduling', 'optimization', 'project-management'],
        implementation: {
          language: 'Python',
          framework: 'OR-Tools',
          dependencies: ['ortools', 'numpy', 'pandas'],
          runtime: 'Python 3.8+',
          gpu: false,
          distributed: true,
          resources: { cpu: '4 cores', memory: '6GB', gpu: '0' }
        }
      }
    },

    // ===== 6. DECISION_MAKING (决策制定) =====
    {
      id: 'cap-decision-001',
      name: '风险评估决策',
      description: '基于风险分析和概率模型的智能决策支持系统',
      type: CoreCapabilityType.DECISION,
      subType: DecisionCapabilityType.RISK_ASSESSMENT,
      version: '1.7.2',
      maturityLevel: CapabilityMaturityLevel.MANAGED,
      source: CapabilitySource.MARKETPLACE,
      category: CapabilityCategory.DECISION_MAKING,
      inputs: [
        {
          id: 'risk_factors',
          name: 'risk_data',
          dataType: 'object',
          description: '风险因素和历史数据',
          required: true,
          validation: { type: 'object' },
          examples: [{
            name: '投资风险评估',
            description: '股票投资的风险因素分析',
            value: {
              portfolio: {
                stocks: ['AAPL', 'GOOGL', 'MSFT'],
                weights: [0.4, 0.3, 0.3],
                investment_amount: 100000
              },
              market_data: {
                volatility: 0.25,
                correlation_matrix: [[1, 0.6, 0.7], [0.6, 1, 0.5], [0.7, 0.5, 1]]
              },
              risk_tolerance: 'moderate'
            }
          }]
        }
      ],
      outputs: [
        {
          id: 'risk_assessment',
          name: 'risk_analysis',
          dataType: 'object',
          description: '风险评估和决策建议',
          schema: undefined,
          examples: [{
            name: '风险分析结果',
            description: '详细的风险评估报告',
            value: {
              risk_score: 6.5,
              var_95: -8500,
              expected_return: 0.12,
              sharpe_ratio: 1.2,
              recommendations: [
                '当前组合风险适中',
                '建议增加债券配置降低风险',
                '定期重新平衡投资组合'
              ]
            }
          }]
        }
      ],
      config: {
        executionMode: 'sync',
        timeout: 15000,
        retryPolicy: {
          maxRetries: 2,
          backoffStrategy: 'exponential',
          initialDelay: 1000,
          maxDelay: 4000,
          retryableErrors: ['calculation_error', 'data_error']
        },
        qualityThreshold: 0.85,
        performanceTarget: {
          responseTime: 3000,
          throughput: 50,
          accuracy: 0.87,
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
            interval: 30,
            timeout: 5,
            failureThreshold: 3,
            successThreshold: 1
          }
        },
        parameters: {
          confidence_level: 0.95,
          time_horizon: 252,
          simulation_runs: 10000
        }
      },
      dependencies: [],
      metrics: {
        avgResponseTime: 2800,
        throughput: 45,
        successRate: 0.95,
        errorRate: 0.05,
        accuracy: 0.88,
        precision: 0.86,
        recall: 0.90,
        f1Score: 0.88,
        usageCount: 3500,
        activeUsers: 125,
        avgCpuUsage: 50,
        avgMemoryUsage: 60,
        avgTokenUsage: 0,
        lastUpdated: new Date('2024-01-18')
      },
      resources: [
        { type: 'cpu', amount: 3, unit: 'cores', priority: 'medium' },
        { type: 'memory', amount: 4, unit: 'GB', priority: 'medium' }
      ],
      sources: [{
        id: 'risk_engine',
        type: CapabilitySourceType.MARKETPLACE,
        name: 'Financial Risk Engine',
        description: '金融风险评估引擎',
        config: { api_key: 'encrypted' },
        version: '1.7.2',
        reliability: 0.95
      }],
      createdAt: new Date('2023-11-15'),
      updatedAt: new Date('2024-01-18'),
      author: 'FinTech Solutions',
      tags: ['risk-assessment', 'finance', 'decision-support', 'portfolio'],
      metadata: {
        author: 'FinTech Solutions',
        organization: 'Financial AI Corp',
        license: 'Commercial',
        category: 'fintech-risk',
        complexity: 'complex',
        difficulty: 'advanced',
        rating: 4.4,
        downloads: 2200,
        featured: true,
        verified: true,
        documentation: 'https://docs.efiagent.com/capabilities/risk-assessment',
        examples: [],
        changelog: [],
        tags: ['risk-assessment', 'finance', 'decision-support', 'portfolio'],
        implementation: {
          language: 'Python',
          framework: 'NumPy',
          dependencies: ['numpy', 'scipy', 'pandas', 'matplotlib'],
          runtime: 'Python 3.9+',
          gpu: false,
          distributed: false,
          resources: { cpu: '3 cores', memory: '4GB', gpu: '0' }
        }
      }
    },

    // ===== 7. LEARNING (学习) =====
    {
      id: 'cap-learning-001',
      name: '在线学习优化',
      description: '基于用户反馈和数据流的在线学习和模型自适应优化',
      type: CoreCapabilityType.LEARNING,
      subType: LearningCapabilityType.CONTINUAL,
      version: '1.6.0',
      maturityLevel: CapabilityMaturityLevel.DEFINED,
      source: CapabilitySource.BUILTIN,
      category: CapabilityCategory.LEARNING,
      inputs: [
        {
          id: 'training_data',
          name: 'streaming_data',
          dataType: 'stream',
          description: '实时训练数据流',
          required: true,
          validation: { type: 'object' },
          examples: [{
            name: '用户行为数据',
            description: '用户交互行为的实时数据',
            value: {
              user_id: 'user_123',
              action: 'click',
              item_id: 'item_456',
              timestamp: '2024-01-20T10:30:00Z',
              context: { page: 'product_list', device: 'mobile' }
            }
          }]
        }
      ],
      outputs: [
        {
          id: 'model_update',
          name: 'updated_model',
          dataType: 'object',
          description: '更新后的模型参数和性能指标',
          schema: undefined,
          examples: [{
            name: '模型更新结果',
            description: '在线学习后的模型状态',
            value: {
              model_version: '1.6.1',
              performance_metrics: {
                accuracy: 0.87,
                loss: 0.23,
                learning_rate: 0.001
              },
              updated_parameters: 1250,
              convergence_status: 'improving'
            }
          }]
        }
      ],
      config: {
        executionMode: 'stream',
        timeout: 10000,
        retryPolicy: {
          maxRetries: 3,
          backoffStrategy: 'exponential',
          initialDelay: 500,
          maxDelay: 2000,
          retryableErrors: ['training_error', 'convergence_error']
        },
        qualityThreshold: 0.8,
        performanceTarget: {
          responseTime: 500,
          throughput: 500,
          accuracy: 0.85,
          availability: 0.99
        },
        securityLevel: 'medium',
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
            interval: 30,
            timeout: 5,
            failureThreshold: 3,
            successThreshold: 1
          }
        },
        parameters: {
          learning_rate: 0.001,
          batch_size: 32,
          update_frequency: 100,
          decay_rate: 0.95
        }
      },
      dependencies: [],
      metrics: {
        avgResponseTime: 450,
        throughput: 480,
        successRate: 0.96,
        errorRate: 0.04,
        accuracy: 0.86,
        precision: 0.84,
        recall: 0.88,
        f1Score: 0.86,
        usageCount: 15000,
        activeUsers: 200,
        avgCpuUsage: 45,
        avgMemoryUsage: 55,
        avgTokenUsage: 0,
        lastUpdated: new Date('2024-01-20')
      },
      resources: [
        { type: 'gpu', amount: 1, unit: 'cards', priority: 'medium' },
        { type: 'memory', amount: 6, unit: 'GB', priority: 'medium' }
      ],
      sources: [{
        id: 'online_learning_engine',
        type: CapabilitySourceType.BUILTIN,
        name: 'Online Learning Engine',
        description: '在线学习引擎',
        config: {},
        version: '1.6.0',
        reliability: 0.96
      }],
      createdAt: new Date('2023-08-20'),
      updatedAt: new Date('2024-01-20'),
      author: 'ML Team',
      tags: ['online-learning', 'adaptive', 'real-time', 'optimization'],
      metadata: {
        author: 'ML Team',
        organization: 'EFIAgent Corp',
        license: 'MIT',
        category: 'ai-learning',
        complexity: 'complex',
        difficulty: 'advanced',
        rating: 4.3,
        downloads: 1400,
        featured: false,
        verified: true,
        documentation: 'https://docs.efiagent.com/capabilities/online-learning',
        examples: [],
        changelog: [],
        tags: ['online-learning', 'adaptive', 'real-time', 'optimization'],
        implementation: {
          language: 'Python',
          framework: 'TensorFlow',
          dependencies: ['tensorflow', 'numpy', 'scikit-learn'],
          runtime: 'Python 3.9+',
          gpu: true,
          distributed: true,
          resources: { cpu: '2 cores', memory: '6GB', gpu: '1 GPU' }
        }
      }
    },

    // ===== 8. CODE_GENERATION (代码生成) =====
    {
      id: 'cap-codegen-001',
      name: '智能代码生成',
      description: '基于自然语言描述生成高质量代码，支持多种编程语言',
      type: CoreCapabilityType.COGNITIVE,
      subType: CognitiveCapabilityType.UNDERSTANDING,
      version: '2.8.0',
      maturityLevel: CapabilityMaturityLevel.OPTIMIZED,
      source: CapabilitySource.BUILTIN,
      category: CapabilityCategory.CODE_GENERATION,
      inputs: [
        {
          id: 'code_requirement',
          name: 'requirement_description',
          dataType: 'string',
          description: '代码需求描述',
          required: true,
          validation: { type: 'string', maxLength: 2000 },
          examples: [{
            name: 'API接口需求',
            description: '创建REST API的需求描述',
            value: '创建一个用户管理的REST API，包含用户注册、登录、获取用户信息和更新用户信息的接口，使用Python Flask框架'
          }]
        },
        {
          id: 'code_config',
          name: 'generation_config',
          dataType: 'object',
          description: '代码生成配置',
          required: false,
          validation: { type: 'object' },
          examples: [{
            name: '生成配置',
            description: '代码生成的详细配置',
            value: {
              language: 'python',
              framework: 'flask',
              style: 'pep8',
              include_tests: true,
              include_docs: true
            }
          }]
        }
      ],
      outputs: [
        {
          id: 'generated_code',
          name: 'code_output',
          dataType: 'object',
          description: '生成的代码和相关文件',
          schema: undefined,
          examples: [{
            name: '代码生成结果',
            description: '完整的代码生成输出',
            value: {
              main_code: 'from flask import Flask, request, jsonify\n\napp = Flask(__name__)\n\n@app.route("/users", methods=["POST"])\ndef register_user():\n    # 用户注册逻辑\n    pass',
              test_code: 'import unittest\nfrom app import app\n\nclass TestUserAPI(unittest.TestCase):\n    def test_register_user(self):\n        # 测试用户注册\n        pass',
              documentation: '# 用户管理API\n\n## 接口说明\n\n### POST /users\n用户注册接口',
              quality_score: 0.92
            }
          }]
        }
      ],
      config: {
        executionMode: 'async',
        timeout: 45000,
        retryPolicy: {
          maxRetries: 2,
          backoffStrategy: 'exponential',
          initialDelay: 2000,
          maxDelay: 8000,
          retryableErrors: ['generation_error', 'timeout']
        },
        qualityThreshold: 0.85,
        performanceTarget: {
          responseTime: 8000,
          throughput: 25,
          accuracy: 0.88,
          availability: 0.96
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
          model: 'codegen-16b',
          max_tokens: 4096,
          temperature: 0.2,
          top_p: 0.95
        }
      },
      dependencies: [],
      metrics: {
        avgResponseTime: 7500,
        throughput: 22,
        successRate: 0.94,
        errorRate: 0.06,
        accuracy: 0.89,
        precision: 0.87,
        recall: 0.91,
        f1Score: 0.89,
        usageCount: 8500,
        activeUsers: 180,
        avgCpuUsage: 55,
        avgMemoryUsage: 70,
        avgTokenUsage: 2500,
        lastUpdated: new Date('2024-01-21')
      },
      resources: [
        { type: 'gpu', amount: 2, unit: 'cards', priority: 'high' },
        { type: 'memory', amount: 12, unit: 'GB', priority: 'high' }
      ],
      sources: [{
        id: 'codegen_model',
        type: CapabilitySourceType.LLM_MODELS,
        name: 'Code Generation Model',
        description: '代码生成大模型',
        config: { model_name: 'codegen-16b' },
        version: '2.8.0',
        reliability: 0.94
      }],
      createdAt: new Date('2023-10-15'),
      updatedAt: new Date('2024-01-21'),
      author: 'CodeGen Team',
      tags: ['code-generation', 'programming', 'ai-coding', 'automation'],
      metadata: {
        author: 'CodeGen Team',
        organization: 'EFIAgent Corp',
        license: 'MIT',
        category: 'ai-coding',
        complexity: 'complex',
        difficulty: 'intermediate',
        rating: 4.6,
        downloads: 4200,
        featured: true,
        verified: true,
        documentation: 'https://docs.efiagent.com/capabilities/code-generation',
        examples: [],
        changelog: [],
        tags: ['code-generation', 'programming', 'ai-coding', 'automation'],
        implementation: {
          language: 'Python',
          framework: 'Transformers',
          dependencies: ['transformers', 'torch', 'tokenizers'],
          runtime: 'Python 3.9+',
          gpu: true,
          distributed: false,
          resources: { cpu: '4 cores', memory: '12GB', gpu: '2 GPUs' }
        }
      }
    },

    // ===== 9. DATA_ANALYSIS (数据分析) =====
    {
      id: 'cap-analysis-001',
      name: '高级数据分析',
      description: '自动化数据探索、统计分析和可视化报告生成',
      type: CoreCapabilityType.COGNITIVE,
      subType: CognitiveCapabilityType.UNDERSTANDING,
      version: '3.1.0',
      maturityLevel: CapabilityMaturityLevel.OPTIMIZED,
      source: CapabilitySource.BUILTIN,
      category: CapabilityCategory.DATA_ANALYSIS,
      inputs: [
        {
          id: 'dataset',
          name: 'data_input',
          dataType: 'object',
          description: '待分析的数据集',
          required: true,
          validation: { type: 'object' },
          examples: [{
            name: '销售数据',
            description: '电商销售数据分析',
            value: {
              format: 'csv',
              columns: ['date', 'product_id', 'sales_amount', 'quantity', 'region'],
              sample_data: [
                { date: '2024-01-01', product_id: 'P001', sales_amount: 1500, quantity: 10, region: 'North' },
                { date: '2024-01-02', product_id: 'P002', sales_amount: 2300, quantity: 15, region: 'South' }
              ]
            }
          }]
        },
        {
          id: 'analysis_config',
          name: 'analysis_parameters',
          dataType: 'object',
          description: '分析配置参数',
          required: false,
          validation: { type: 'object' },
          examples: [{
            name: '分析配置',
            description: '数据分析的详细配置',
            value: {
              analysis_type: 'comprehensive',
              include_visualization: true,
              statistical_tests: ['correlation', 'regression'],
              time_series_analysis: true
            }
          }]
        }
      ],
      outputs: [
        {
          id: 'analysis_report',
          name: 'analysis_results',
          dataType: 'object',
          description: '数据分析报告',
          schema: undefined,
          examples: [{
            name: '分析报告',
            description: '完整的数据分析结果',
            value: {
              summary_statistics: {
                total_sales: 125000,
                avg_daily_sales: 4167,
                growth_rate: 0.15
              },
              correlations: {
                'quantity_sales': 0.87,
                'region_sales': 0.23
              },
              visualizations: [
                { type: 'line_chart', title: '销售趋势', data_url: '/charts/sales_trend.png' },
                { type: 'bar_chart', title: '区域销售分布', data_url: '/charts/region_sales.png' }
              ],
              insights: [
                '销售量与销售额呈强正相关',
                '北部地区销售表现最佳',
                '周末销售额显著高于工作日'
              ]
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
          initialDelay: 3000,
          maxDelay: 10000,
          retryableErrors: ['processing_error', 'memory_error']
        },
        qualityThreshold: 0.85,
        performanceTarget: {
          responseTime: 15000,
          throughput: 10,
          accuracy: 0.9,
          availability: 0.97
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
          max_data_size: '100MB',
          visualization_format: 'png',
          statistical_significance: 0.05
        }
      },
      dependencies: [],
      metrics: {
        avgResponseTime: 12000,
        throughput: 8,
        successRate: 0.93,
        errorRate: 0.07,
        accuracy: 0.91,
        precision: 0.89,
        recall: 0.93,
        f1Score: 0.91,
        usageCount: 5500,
        activeUsers: 150,
        avgCpuUsage: 70,
        avgMemoryUsage: 80,
        avgTokenUsage: 0,
        lastUpdated: new Date('2024-01-19')
      },
      resources: [
        { type: 'cpu', amount: 4, unit: 'cores', priority: 'high' },
        { type: 'memory', amount: 8, unit: 'GB', priority: 'high' }
      ],
      sources: [{
        id: 'analytics_engine',
        type: CapabilitySourceType.BUILTIN,
        name: 'Advanced Analytics Engine',
        description: '高级数据分析引擎',
        config: {},
        version: '3.1.0',
        reliability: 0.93
      }],
      createdAt: new Date('2023-09-01'),
      updatedAt: new Date('2024-01-19'),
      author: 'Analytics Team',
      tags: ['data-analysis', 'statistics', 'visualization', 'insights'],
      metadata: {
        author: 'Analytics Team',
        organization: 'EFIAgent Corp',
        license: 'MIT',
        category: 'ai-analytics',
        complexity: 'complex',
        difficulty: 'intermediate',
        rating: 4.5,
        downloads: 3100,
        featured: true,
        verified: true,
        documentation: 'https://docs.efiagent.com/capabilities/data-analysis',
        examples: [],
        changelog: [],
        tags: ['data-analysis', 'statistics', 'visualization', 'insights'],
        implementation: {
          language: 'Python',
          framework: 'Pandas',
          dependencies: ['pandas', 'numpy', 'matplotlib', 'seaborn', 'scipy'],
          runtime: 'Python 3.9+',
          gpu: false,
          distributed: true,
          resources: { cpu: '4 cores', memory: '8GB', gpu: '0' }
        }
      }
    },

    // ===== 10. SIMULATION (仿真) =====
    {
      id: 'cap-simulation-001',
      name: '业务流程仿真',
      description: '复杂业务流程的数字化仿真和优化分析',
      type: CoreCapabilityType.REASONING,
      subType: ReasoningCapabilityType.LOGICAL,
      version: '1.4.0',
      maturityLevel: CapabilityMaturityLevel.MANAGED,
      source: CapabilitySource.CUSTOM,
      category: CapabilityCategory.SIMULATION,
      inputs: [
        {
          id: 'process_model',
          name: 'business_process',
          dataType: 'object',
          description: '业务流程模型定义',
          required: true,
          validation: { type: 'object' },
          examples: [{
            name: '订单处理流程',
            description: '电商订单处理的业务流程',
            value: {
              process_name: '订单处理流程',
              steps: [
                { id: 'step1', name: '订单接收', duration: 2, resources: ['客服'] },
                { id: 'step2', name: '库存检查', duration: 5, resources: ['系统'] },
                { id: 'step3', name: '支付处理', duration: 10, resources: ['支付系统'] },
                { id: 'step4', name: '发货准备', duration: 30, resources: ['仓库人员'] }
              ],
              constraints: {
                max_concurrent_orders: 100,
                working_hours: '9:00-18:00'
              }
            }
          }]
        },
        {
          id: 'simulation_params',
          name: 'simulation_config',
          dataType: 'object',
          description: '仿真参数配置',
          required: false,
          validation: { type: 'object' },
          examples: [{
            name: '仿真配置',
            description: '仿真运行的参数设置',
            value: {
              simulation_time: 8760,
              time_unit: 'hours',
              replications: 100,
              warm_up_period: 168
            }
          }]
        }
      ],
      outputs: [
        {
          id: 'simulation_results',
          name: 'simulation_analysis',
          dataType: 'object',
          description: '仿真分析结果',
          schema: undefined,
          examples: [{
            name: '仿真结果',
            description: '业务流程仿真的分析结果',
            value: {
              performance_metrics: {
                avg_processing_time: 47,
                throughput: 85.2,
                resource_utilization: {
                  '客服': 0.65,
                  '仓库人员': 0.82,
                  '系统': 0.45
                }
              },
              bottlenecks: ['仓库人员', '支付系统'],
              optimization_suggestions: [
                '增加仓库人员数量',
                '优化支付处理流程',
                '实施并行处理机制'
              ]
            }
          }]
        }
      ],
      config: {
        executionMode: 'async',
        timeout: 180000,
        retryPolicy: {
          maxRetries: 1,
          backoffStrategy: 'linear',
          initialDelay: 5000,
          maxDelay: 15000,
          retryableErrors: ['simulation_error', 'convergence_error']
        },
        qualityThreshold: 0.8,
        performanceTarget: {
          responseTime: 30000,
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
            interval: 120,
            timeout: 30,
            failureThreshold: 3,
            successThreshold: 1
          }
        },
        parameters: {
          simulation_engine: 'discrete_event',
          random_seed: 12345,
          confidence_level: 0.95
        }
      },
      dependencies: [],
      metrics: {
        avgResponseTime: 25000,
        throughput: 4,
        successRate: 0.88,
        errorRate: 0.12,
        accuracy: 0.86,
        precision: 0.84,
        recall: 0.88,
        f1Score: 0.86,
        usageCount: 850,
        activeUsers: 35,
        avgCpuUsage: 80,
        avgMemoryUsage: 75,
        avgTokenUsage: 0,
        lastUpdated: new Date('2024-01-16')
      },
      resources: [
        { type: 'cpu', amount: 6, unit: 'cores', priority: 'high' },
        { type: 'memory', amount: 8, unit: 'GB', priority: 'medium' }
      ],
      sources: [{
        id: 'simulation_engine',
        type: CapabilitySourceType.CUSTOM_MODULE,
        name: 'Business Process Simulation Engine',
        description: '业务流程仿真引擎',
        config: {},
        version: '1.4.0',
        reliability: 0.88
      }],
      createdAt: new Date('2023-11-01'),
      updatedAt: new Date('2024-01-16'),
      author: 'Simulation Team',
      tags: ['simulation', 'business-process', 'optimization', 'modeling'],
      metadata: {
        author: 'Simulation Team',
        organization: 'Process Analytics Corp',
        license: 'Apache-2.0',
        category: 'business-simulation',
        complexity: 'complex',
        difficulty: 'expert',
        rating: 4.0,
        downloads: 520,
        featured: false,
        verified: true,
        documentation: 'https://docs.efiagent.com/capabilities/business-simulation',
        examples: [],
        changelog: [],
        tags: ['simulation', 'business-process', 'optimization', 'modeling'],
        implementation: {
          language: 'Python',
          framework: 'SimPy',
          dependencies: ['simpy', 'numpy', 'pandas', 'matplotlib'],
          runtime: 'Python 3.8+',
          gpu: false,
          distributed: false,
          resources: { cpu: '6 cores', memory: '8GB', gpu: '0' }
        }
      }
    },

    // ===== 11. AGENT_CONTROL (Agent控制) =====
    {
      id: 'cap-control-001',
      name: '多Agent协调控制',
      description: '多个Agent之间的协调、调度和冲突解决机制',
      type: CoreCapabilityType.DECISION,
      subType: DecisionCapabilityType.COLLABORATIVE,
      version: '2.2.0',
      maturityLevel: CapabilityMaturityLevel.DEFINED,
      source: CapabilitySource.BUILTIN,
      category: CapabilityCategory.AGENT_CONTROL,
      inputs: [
        {
          id: 'agent_states',
          name: 'multi_agent_status',
          dataType: 'array',
          description: '多个Agent的状态信息',
          required: true,
          validation: { type: 'array' },
          examples: [{
            name: 'Agent状态列表',
            description: '当前系统中所有Agent的状态',
            value: [
              {
                agent_id: 'agent_001',
                type: 'data_processor',
                status: 'busy',
                current_task: 'task_123',
                load: 0.8,
                capabilities: ['data_analysis', 'visualization']
              },
              {
                agent_id: 'agent_002',
                type: 'decision_maker',
                status: 'idle',
                current_task: null,
                load: 0.2,
                capabilities: ['risk_assessment', 'optimization']
              }
            ]
          }]
        },
        {
          id: 'coordination_request',
          name: 'coordination_task',
          dataType: 'object',
          description: '协调任务请求',
          required: true,
          validation: { type: 'object' },
          examples: [{
            name: '协调任务',
            description: '需要多Agent协作的任务',
            value: {
              task_id: 'task_456',
              task_type: 'complex_analysis',
              required_capabilities: ['data_analysis', 'risk_assessment'],
              priority: 'high',
              deadline: '2024-01-25T18:00:00Z'
            }
          }]
        }
      ],
      outputs: [
        {
          id: 'coordination_plan',
          name: 'execution_plan',
          dataType: 'object',
          description: 'Agent协调执行计划',
          schema: undefined,
          examples: [{
            name: '协调计划',
            description: 'Agent任务分配和协调方案',
            value: {
              task_allocation: [
                {
                  agent_id: 'agent_001',
                  subtask: 'data_preprocessing',
                  estimated_duration: 30,
                  dependencies: []
                },
                {
                  agent_id: 'agent_002',
                  subtask: 'risk_evaluation',
                  estimated_duration: 20,
                  dependencies: ['data_preprocessing']
                }
              ],
              coordination_strategy: 'sequential',
              conflict_resolution: 'priority_based',
              monitoring_checkpoints: [15, 30, 45]
            }
          }]
        }
      ],
      config: {
        executionMode: 'sync',
        timeout: 10000,
        retryPolicy: {
          maxRetries: 3,
          backoffStrategy: 'exponential',
          initialDelay: 1000,
          maxDelay: 5000,
          retryableErrors: ['coordination_error', 'agent_unavailable']
        },
        qualityThreshold: 0.9,
        performanceTarget: {
          responseTime: 2000,
          throughput: 100,
          accuracy: 0.92,
          availability: 0.99
        },
        securityLevel: 'high',
        accessControl: {
          authentication: true,
          authorization: ['read', 'execute', 'control'],
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
            interval: 30,
            timeout: 5,
            failureThreshold: 3,
            successThreshold: 1
          }
        },
        parameters: {
          coordination_algorithm: 'auction_based',
          load_balancing: true,
          conflict_resolution_strategy: 'priority'
        }
      },
      dependencies: [],
      metrics: {
        avgResponseTime: 1800,
        throughput: 95,
        successRate: 0.96,
        errorRate: 0.04,
        accuracy: 0.93,
        precision: 0.91,
        recall: 0.95,
        f1Score: 0.93,
        usageCount: 12000,
        activeUsers: 80,
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
        id: 'coordination_engine',
        type: CapabilitySourceType.BUILTIN,
        name: 'Multi-Agent Coordination Engine',
        description: '多Agent协调引擎',
        config: {},
        version: '2.2.0',
        reliability: 0.96
      }],
      createdAt: new Date('2023-08-01'),
      updatedAt: new Date('2024-01-20'),
      author: 'Agent Control Team',
      tags: ['multi-agent', 'coordination', 'scheduling', 'control'],
      metadata: {
        author: 'Agent Control Team',
        organization: 'EFIAgent Corp',
        license: 'MIT',
        category: 'agent-coordination',
        complexity: 'complex',
        difficulty: 'advanced',
        rating: 4.4,
        downloads: 2800,
        featured: true,
        verified: true,
        documentation: 'https://docs.efiagent.com/capabilities/agent-coordination',
        examples: [],
        changelog: [],
        tags: ['multi-agent', 'coordination', 'scheduling', 'control'],
        implementation: {
          language: 'Python',
          framework: 'Custom',
          dependencies: ['asyncio', 'networkx', 'redis'],
          runtime: 'Python 3.9+',
          gpu: false,
          distributed: true,
          resources: { cpu: '2 cores', memory: '4GB', gpu: '0' }
        }
      }
    },

    // ===== 12. SECURITY (安全) =====
    {
      id: 'cap-security-001',
      name: '智能威胁检测',
      description: '基于机器学习的网络安全威胁检测和防护系统',
      type: CoreCapabilityType.COGNITIVE,
      subType: CognitiveCapabilityType.PERCEPTION,
      version: '1.9.1',
      maturityLevel: CapabilityMaturityLevel.MANAGED,
      source: CapabilitySource.MARKETPLACE,
      category: CapabilityCategory.SECURITY,
      inputs: [
        {
          id: 'network_data',
          name: 'security_logs',
          dataType: 'stream',
          description: '网络安全日志数据流',
          required: true,
          validation: { type: 'object' },
          examples: [{
            name: '网络日志',
            description: '网络流量和安全事件日志',
            value: {
              timestamp: '2024-01-20T14:30:00Z',
              source_ip: '192.168.1.100',
              dest_ip: '10.0.0.50',
              port: 443,
              protocol: 'HTTPS',
              payload_size: 1024,
              user_agent: 'Mozilla/5.0...',
              request_type: 'GET'
            }
          }]
        }
      ],
      outputs: [
        {
          id: 'threat_analysis',
          name: 'security_assessment',
          dataType: 'object',
          description: '威胁检测和安全评估结果',
          schema: undefined,
          examples: [{
            name: '威胁分析',
            description: '安全威胁检测结果',
            value: {
              threat_level: 'medium',
              threat_type: 'suspicious_activity',
              confidence: 0.78,
              affected_assets: ['web_server_01'],
              recommended_actions: [
                '监控源IP活动',
                '检查访问日志',
                '更新防火墙规则'
              ],
              risk_score: 6.5
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
          retryableErrors: ['detection_error', 'model_error']
        },
        qualityThreshold: 0.9,
        performanceTarget: {
          responseTime: 100,
          throughput: 1000,
          accuracy: 0.95,
          availability: 0.999
        },
        securityLevel: 'critical',
        accessControl: {
          authentication: true,
          authorization: ['read', 'execute', 'security'],
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
            interval: 10,
            timeout: 3,
            failureThreshold: 2,
            successThreshold: 1
          }
        },
        parameters: {
          detection_model: 'ensemble',
          anomaly_threshold: 0.8,
          alert_threshold: 0.7
        }
      },
      dependencies: [],
      metrics: {
        avgResponseTime: 80,
        throughput: 950,
        successRate: 0.98,
        errorRate: 0.02,
        accuracy: 0.96,
        precision: 0.94,
        recall: 0.98,
        f1Score: 0.96,
        usageCount: 45000,
        activeUsers: 25,
        avgCpuUsage: 60,
        avgMemoryUsage: 70,
        avgTokenUsage: 0,
        lastUpdated: new Date('2024-01-21')
      },
      resources: [
        { type: 'cpu', amount: 4, unit: 'cores', priority: 'high' },
        { type: 'memory', amount: 8, unit: 'GB', priority: 'high' }
      ],
      sources: [{
        id: 'security_engine',
        type: CapabilitySourceType.MARKETPLACE,
        name: 'Cybersecurity Detection Engine',
        description: '网络安全检测引擎',
        config: { api_key: 'encrypted' },
        version: '1.9.1',
        reliability: 0.98
      }],
      createdAt: new Date('2023-12-01'),
      updatedAt: new Date('2024-01-21'),
      author: 'CyberSec Solutions',
      tags: ['cybersecurity', 'threat-detection', 'anomaly-detection', 'network-security'],
      metadata: {
        author: 'CyberSec Solutions',
        organization: 'Security AI Corp',
        license: 'Commercial',
        category: 'cybersecurity',
        complexity: 'complex',
        difficulty: 'expert',
        rating: 4.7,
        downloads: 1900,
        featured: true,
        verified: true,
        documentation: 'https://docs.efiagent.com/capabilities/threat-detection',
        examples: [],
        changelog: [],
        tags: ['cybersecurity', 'threat-detection', 'anomaly-detection', 'network-security'],
        implementation: {
          language: 'Python',
          framework: 'Scikit-learn',
          dependencies: ['scikit-learn', 'numpy', 'pandas', 'tensorflow'],
          runtime: 'Python 3.9+',
          gpu: true,
          distributed: true,
          resources: { cpu: '4 cores', memory: '8GB', gpu: '1 GPU' }
        }
      }
    },

    // ===== 13. MONITORING (监控) =====
    {
      id: 'cap-monitoring-001',
      name: '智能系统监控',
      description: '全方位系统性能监控、异常检测和预警系统',
      type: CoreCapabilityType.COGNITIVE,
      subType: CognitiveCapabilityType.PERCEPTION,
      version: '2.6.0',
      maturityLevel: CapabilityMaturityLevel.OPTIMIZED,
      source: CapabilitySource.BUILTIN,
      category: CapabilityCategory.MONITORING,
      inputs: [
        {
          id: 'system_metrics',
          name: 'metrics_data',
          dataType: 'stream',
          description: '系统性能指标数据流',
          required: true,
          validation: { type: 'object' },
          examples: [{
            name: '系统指标',
            description: '服务器性能监控数据',
            value: {
              timestamp: '2024-01-20T15:00:00Z',
              server_id: 'srv-001',
              cpu_usage: 0.75,
              memory_usage: 0.68,
              disk_usage: 0.45,
              network_io: { in: 1024000, out: 512000 },
              response_time: 250,
              error_rate: 0.02
            }
          }]
        },
        {
          id: 'monitoring_config',
          name: 'alert_rules',
          dataType: 'object',
          description: '监控和告警规则配置',
          required: false,
          validation: { type: 'object' },
          examples: [{
            name: '告警规则',
            description: '系统监控的告警配置',
            value: {
              cpu_threshold: 0.8,
              memory_threshold: 0.85,
              response_time_threshold: 1000,
              error_rate_threshold: 0.05,
              alert_channels: ['email', 'slack']
            }
          }]
        }
      ],
      outputs: [
        {
          id: 'monitoring_report',
          name: 'system_status',
          dataType: 'object',
          description: '系统监控状态报告',
          schema: undefined,
          examples: [{
            name: '监控报告',
            description: '系统健康状态和告警信息',
            value: {
              overall_health: 'good',
              alerts: [
                {
                  severity: 'warning',
                  metric: 'cpu_usage',
                  current_value: 0.82,
                  threshold: 0.8,
                  server: 'srv-001',
                  message: 'CPU使用率超过阈值'
                }
              ],
              performance_summary: {
                avg_response_time: 245,
                system_availability: 0.998,
                total_requests: 125000
              },
              recommendations: [
                '考虑增加服务器资源',
                '优化数据库查询性能'
              ]
            }
          }]
        }
      ],
      config: {
        executionMode: 'stream',
        timeout: 3000,
        retryPolicy: {
          maxRetries: 3,
          backoffStrategy: 'linear',
          initialDelay: 200,
          maxDelay: 1000,
          retryableErrors: ['metrics_error', 'alert_error']
        },
        qualityThreshold: 0.95,
        performanceTarget: {
          responseTime: 50,
          throughput: 2000,
          accuracy: 0.98,
          availability: 0.999
        },
        securityLevel: 'medium',
        accessControl: {
          authentication: true,
          authorization: ['read', 'execute', 'monitor'],
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
            interval: 10,
            timeout: 2,
            failureThreshold: 3,
            successThreshold: 1
          }
        },
        parameters: {
          aggregation_window: 60,
          anomaly_detection: true,
          predictive_alerts: true
        }
      },
      dependencies: [],
      metrics: {
        avgResponseTime: 45,
        throughput: 1800,
        successRate: 0.999,
        errorRate: 0.001,
        accuracy: 0.98,
        precision: 0.97,
        recall: 0.99,
        f1Score: 0.98,
        usageCount: 85000,
        activeUsers: 50,
        avgCpuUsage: 20,
        avgMemoryUsage: 25,
        avgTokenUsage: 0,
        lastUpdated: new Date('2024-01-21')
      },
      resources: [
        { type: 'cpu', amount: 1, unit: 'cores', priority: 'low' },
        { type: 'memory', amount: 2, unit: 'GB', priority: 'low' }
      ],
      sources: [{
        id: 'monitoring_engine',
        type: CapabilitySourceType.BUILTIN,
        name: 'System Monitoring Engine',
        description: '系统监控引擎',
        config: {},
        version: '2.6.0',
        reliability: 0.999
      }],
      createdAt: new Date('2023-06-01'),
      updatedAt: new Date('2024-01-21'),
      author: 'Monitoring Team',
      tags: ['monitoring', 'alerting', 'performance', 'observability'],
      metadata: {
        author: 'Monitoring Team',
        organization: 'EFIAgent Corp',
        license: 'MIT',
        category: 'system-monitoring',
        complexity: 'medium',
        difficulty: 'intermediate',
        rating: 4.8,
        downloads: 6500,
        featured: true,
        verified: true,
        documentation: 'https://docs.efiagent.com/capabilities/system-monitoring',
        examples: [],
        changelog: [],
        tags: ['monitoring', 'alerting', 'performance', 'observability'],
        implementation: {
          language: 'Python',
          framework: 'Prometheus',
          dependencies: ['prometheus-client', 'grafana-api', 'alertmanager'],
          runtime: 'Python 3.8+',
          gpu: false,
          distributed: true,
          resources: { cpu: '1 core', memory: '2GB', gpu: '0' }
        }
      }
    },

    // ===== 14. OTHER (其他) =====
    {
      id: 'cap-other-001',
      name: '通用工具集成',
      description: '集成各种第三方工具和服务的通用接口适配器',
      type: CoreCapabilityType.COGNITIVE,
      subType: CognitiveCapabilityType.INTEGRATION,
      version: '1.3.0',
      maturityLevel: CapabilityMaturityLevel.INITIAL,
      source: CapabilitySource.CUSTOM,
      category: CapabilityCategory.OTHER,
      inputs: [
        {
          id: 'tool_request',
          name: 'integration_request',
          dataType: 'object',
          description: '工具集成请求',
          required: true,
          validation: { type: 'object' },
          examples: [{
            name: 'API调用请求',
            description: '第三方API服务调用',
            value: {
              service_type: 'rest_api',
              endpoint: 'https://api.example.com/v1/data',
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              payload: { query: 'search_term', limit: 10 }
            }
          }]
        }
      ],
      outputs: [
        {
          id: 'integration_result',
          name: 'tool_response',
          dataType: 'object',
          description: '工具集成响应结果',
          schema: undefined,
          examples: [{
            name: '集成结果',
            description: '第三方工具的响应数据',
            value: {
              status: 'success',
              data: {
                results: ['result1', 'result2', 'result3'],
                total_count: 3,
                execution_time: 1.2
              },
              metadata: {
                service: 'external_api',
                version: '1.0',
                timestamp: '2024-01-20T16:00:00Z'
              }
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
          retryableErrors: ['network_error', 'service_unavailable']
        },
        qualityThreshold: 0.7,
        performanceTarget: {
          responseTime: 5000,
          throughput: 100,
          accuracy: 0.8,
          availability: 0.95
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
          alerting: { enabled: true, thresholds: [], channels: [] },
          healthCheck: {
            enabled: true,
            interval: 60,
            timeout: 10,
            failureThreshold: 5,
            successThreshold: 2
          }
        },
        parameters: {
          adapter_type: 'universal',
          timeout_per_request: 10000,
          max_concurrent_requests: 10
        }
      },
      dependencies: [],
      metrics: {
        avgResponseTime: 4200,
        throughput: 85,
        successRate: 0.89,
        errorRate: 0.11,
        accuracy: 0.82,
        precision: 0.80,
        recall: 0.84,
        f1Score: 0.82,
        usageCount: 3200,
        activeUsers: 65,
        avgCpuUsage: 30,
        avgMemoryUsage: 35,
        avgTokenUsage: 0,
        lastUpdated: new Date('2024-01-18')
      },
      resources: [
        { type: 'cpu', amount: 1, unit: 'cores', priority: 'low' },
        { type: 'memory', amount: 2, unit: 'GB', priority: 'low' }
      ],
      sources: [{
        id: 'integration_adapter',
        type: CapabilitySourceType.CUSTOM_MODULE,
        name: 'Universal Integration Adapter',
        description: '通用集成适配器',
        config: {},
        version: '1.3.0',
        reliability: 0.89
      }],
      createdAt: new Date('2023-12-15'),
      updatedAt: new Date('2024-01-18'),
      author: 'Integration Team',
      tags: ['integration', 'adapter', 'third-party', 'universal'],
      metadata: {
        author: 'Integration Team',
        organization: 'EFIAgent Corp',
        license: 'MIT',
        category: 'integration-tools',
        complexity: 'simple',
        difficulty: 'beginner',
        rating: 3.8,
        downloads: 1200,
        featured: false,
        verified: false,
        documentation: 'https://docs.efiagent.com/capabilities/tool-integration',
        examples: [],
        changelog: [],
        tags: ['integration', 'adapter', 'third-party', 'universal'],
        implementation: {
          language: 'Python',
          framework: 'Requests',
          dependencies: ['requests', 'aiohttp', 'pydantic'],
          runtime: 'Python 3.8+',
          gpu: false,
          distributed: false,
          resources: { cpu: '1 core', memory: '2GB', gpu: '0' }
        }
      }
    }
  ];
};

/**
 * 获取指定分类的能力数据
 * @param category 能力分类
 * @returns 该分类下的能力模块数组
 */
export const getCapabilitiesByCategory = (category: CapabilityCategory): CoreCapabilityModule[] => {
  return generateEnrichedCapabilityData().filter(cap => cap.category === category);
};

/**
 * 获取所有能力分类的统计信息
 * @returns 分类统计信息
 */
export const getCapabilityCategoryStats = () => {
  const capabilities = generateEnrichedCapabilityData();
  const stats: Record<string, number> = {};
  
  Object.values(CapabilityCategory).forEach(category => {
    stats[category] = capabilities.filter(cap => cap.category === category).length;
  });
  
  return stats;
};

/**
 * 根据成熟度等级筛选能力
 * @param maturityLevel 成熟度等级
 * @returns 符合条件的能力模块数组
 */
export const getCapabilitiesByMaturity = (maturityLevel: CapabilityMaturityLevel): CoreCapabilityModule[] => {
  return generateEnrichedCapabilityData().filter(cap => cap.maturityLevel === maturityLevel);
};

/**
 * 根据来源类型筛选能力
 * @param source 能力来源
 * @returns 符合条件的能力模块数组
 */
export const getCapabilitiesBySource = (source: CapabilitySource): CoreCapabilityModule[] => {
  return generateEnrichedCapabilityData().filter(cap => cap.source === source);
};

export default generateEnrichedCapabilityData;