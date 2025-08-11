/**
 * EFIAgent 2.0 智能Agent管理器
 * 基于能力系统模型的Agent生命周期管理平台
 * 支持Agent创建、编辑、部署、监控和协作管理
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table, Button, Space, Input, Select, Tag, Badge, Card, Row, Col,
  Modal, Form, message, Tooltip, Dropdown, Menu, Drawer, Tabs,
  Statistic, Progress, Timeline, List, Avatar, Divider, Alert,
  Popconfirm, Switch, Rate, DatePicker, Upload, Checkbox
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, PlayCircleOutlined,
  PauseCircleOutlined, StopOutlined, EyeOutlined, CopyOutlined,
  DownloadOutlined, UploadOutlined, ShareAltOutlined, SettingOutlined,
  MonitorOutlined, TeamOutlined, CloudOutlined, SecurityScanOutlined,
  BranchesOutlined, ApiOutlined, DatabaseOutlined, BulbOutlined,
  ThunderboltOutlined, BookOutlined, StarOutlined,
  HeartOutlined, MessageOutlined, ExportOutlined, ImportOutlined,
  ReloadOutlined, FilterOutlined, SortAscendingOutlined,
  SearchOutlined, UserOutlined, CalendarOutlined, TagOutlined
} from '@ant-design/icons';
import {
  Agent2_0, AgentStatus, CoreCapabilityType, CapabilityMaturityLevel,
  AgentMetadata, DeploymentConfig
} from './CapabilitySystemTypes';
import './AgentManager2_0.css';

const { Search } = Input;
const { Option } = Select;
const { TabPane } = Tabs;
const { RangePicker } = DatePicker;

interface AgentManager2_0Props {
  // 可选的初始化参数
}

interface AgentStats {
  total: number;
  running: number;
  stopped: number;
  error: number;
  deployed: number;
  development: number;
}

interface FilterOptions {
  status: AgentStatus[];
  categories: string[];
  difficulties: string[];
  authors: string[];
  tags: string[];
  dateRange: [string, string] | null;
  ratingRange: [number, number];
}

const AgentManager2_0: React.FC<AgentManager2_0Props> = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  
  // 核心状态
  const [agents, setAgents] = useState<Agent2_0[]>([]);
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    status: [],
    categories: [],
    difficulties: [],
    authors: [],
    tags: [],
    dateRange: null,
    ratingRange: [0, 5]
  });
  
  // UI状态
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent2_0 | null>(null);
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [batchOperationModalVisible, setBatchOperationModalVisible] = useState(false);
  const [statsCardExpanded, setStatsCardExpanded] = useState(true);
  
  // 分页和排序
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [sortField, setSortField] = useState<string>('updatedAt');
  const [sortOrder, setSortOrder] = useState<'ascend' | 'descend'>('descend');
  
  /**
   * 初始化组件
   */
  useEffect(() => {
    loadAgents();
  }, []);
  
  /**
   * 加载Agent列表
   */
  const loadAgents = async () => {
    setLoading(true);
    try {
      // TODO: 从API加载Agent列表
      // 临时从localStorage加载
      const storedAgents = localStorage.getItem('agents_2_0');
      const agentList: Agent2_0[] = storedAgents ? JSON.parse(storedAgents) : [];
      
      // 添加一些示例数据
      if (agentList.length === 0) {
        const sampleAgents = createSampleAgents();
        localStorage.setItem('agents_2_0', JSON.stringify(sampleAgents));
        setAgents(sampleAgents);
      } else {
        setAgents(agentList);
      }
      
      setPagination(prev => ({ ...prev, total: agentList.length }));
    } catch (error) {
      message.error('加载Agent列表失败');
      console.error('Load agents error:', error);
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * 创建示例Agent数据
   */
  const createSampleAgents = (): Agent2_0[] => {
    const now = new Date();
    return [
      {
        id: 'agent_001',
        name: '智能客服助手',
        description: '基于多模态感知和自然语言处理的智能客服系统，支持文本、语音、图像等多种交互方式，具备情感分析、意图识别、知识检索等核心能力',
        version: '2.1.0',
        status: AgentStatus.RUNNING,
        capabilities: [
          {
            id: 'nlp_understanding',
            name: '自然语言理解',
            description: '深度理解用户输入的自然语言，识别意图和实体',
            type: CoreCapabilityType.COGNITIVE,
            subType: 'understanding' as any,
            version: '1.0.0',
            maturityLevel: CapabilityMaturityLevel.OPTIMIZED,
            source: 'builtin' as any,
            category: 'nlp' as any,
            config: {
              executionMode: 'async',
              timeout: 5000,
              retryPolicy: { maxRetries: 3, backoffStrategy: 'exponential', initialDelay: 1000, maxDelay: 5000, retryableErrors: ['timeout', 'network'] },
              qualityThreshold: 0.85,
              performanceTarget: { responseTime: 2000, throughput: 100, accuracy: 0.9, availability: 0.99 },
              securityLevel: 'high',
              accessControl: { authentication: true, authorization: ['customer_service'], encryption: true, auditLog: true },
              monitoring: { enabled: true, metricsCollection: true, loggingLevel: 'info', alerting: { enabled: true, thresholds: [], channels: [] }, healthCheck: { enabled: true, interval: 30, timeout: 5, failureThreshold: 3, successThreshold: 2 } },
              parameters: { model: 'gpt-4', temperature: 0.3, maxTokens: 1000 }
            },
            inputs: [{
              id: 'user_input',
              name: '用户输入',
              description: '用户的自然语言输入',
              dataType: 'string',
              required: true,
              validation: { type: 'string', minLength: 1, maxLength: 1000 },
              examples: ['我想查询订单状态', '产品有什么优惠活动']
            }],
            outputs: [{
              id: 'intent_result',
              name: '意图识别结果',
              description: '识别出的用户意图和相关实体',
              dataType: 'object',
              schema: { intent: 'string', entities: 'array', confidence: 'number' },
              examples: [{ intent: 'order_inquiry', entities: ['order_id'], confidence: 0.95 }]
            }],
            dependencies: [],
            metrics: {
              avgResponseTime: 1500,
              throughput: 120,
              successRate: 0.98,
              errorRate: 0.02,
              accuracy: 0.92,
              precision: 0.91,
              recall: 0.93,
              f1Score: 0.92,
              usageCount: 15000,
              activeUsers: 500,
              avgCpuUsage: 45,
              avgMemoryUsage: 512,
              avgTokenUsage: 150,
              lastUpdated: now
            },
            resources: [{ type: 'cpu', amount: 2, unit: 'cores', priority: 'medium' }, { type: 'memory', amount: 4, unit: 'GB', priority: 'medium' }],
            sources: [{ id: 'openai_gpt4', type: 'llm_models' as any, name: 'OpenAI GPT-4', description: 'OpenAI GPT-4 模型', config: {}, version: '1.0', reliability: 0.99 }],
            createdAt: new Date('2024-01-10'),
            updatedAt: now,
            author: 'AI Team',
            tags: ['nlp', 'intent-recognition', 'entity-extraction'],
            metadata: {
              author: 'AI Team',
              organization: 'EFIAgent Corp',
              license: 'MIT',
              category: 'nlp',
              difficulty: 'intermediate',
              rating: 4.8,
              downloads: 1250,
              featured: true,
              verified: true,
              documentation: '自然语言理解能力模块，支持多种语言和领域',
              examples: [{
                name: '订单查询意图识别',
                description: '识别用户查询订单的意图',
                input: { user_input: '我想查看我的订单状态' },
                output: { intent: 'order_inquiry', entities: [], confidence: 0.95 },
                code: 'nlp.understand(input.user_input)'
              }],
              changelog: [],
              implementation: {
                language: 'Python',
                framework: 'Transformers',
                dependencies: ['torch', 'transformers', 'numpy'],
                resources: { cpu: '2 cores', memory: '4GB' }
              }
            }
          },
          {
            id: 'emotion_analysis',
            name: '情感分析',
            description: '分析用户情感状态，识别满意度和情绪倾向',
            type: CoreCapabilityType.COGNITIVE,
            subType: 'perception' as any,
            version: '1.2.0',
            maturityLevel: CapabilityMaturityLevel.DEFINED,
            source: 'marketplace' as any,
            category: 'nlp' as any,
            config: {
              executionMode: 'sync',
              timeout: 3000,
              retryPolicy: { maxRetries: 2, backoffStrategy: 'linear', initialDelay: 500, maxDelay: 2000, retryableErrors: ['timeout'] },
              qualityThreshold: 0.8,
              performanceTarget: { responseTime: 1500, throughput: 150, accuracy: 0.85, availability: 0.98 },
              securityLevel: 'medium',
              accessControl: { authentication: true, authorization: ['customer_service'], encryption: false, auditLog: true },
              monitoring: { enabled: true, metricsCollection: true, loggingLevel: 'info', alerting: { enabled: true, thresholds: [], channels: [] }, healthCheck: { enabled: true, interval: 60, timeout: 10, failureThreshold: 5, successThreshold: 3 } },
              parameters: { model: 'sentiment-bert', threshold: 0.7 }
            },
            inputs: [{
              id: 'text_input',
              name: '文本输入',
              description: '需要分析情感的文本',
              dataType: 'string',
              required: true,
              validation: { type: 'string', minLength: 1, maxLength: 500 },
              examples: ['这个产品真的很棒！', '服务态度有待改善']
            }],
            outputs: [{
              id: 'emotion_result',
              name: '情感分析结果',
              description: '情感极性和强度分析结果',
              dataType: 'object',
              schema: { sentiment: 'string', confidence: 'number', emotions: 'array' },
              examples: [{ sentiment: 'positive', confidence: 0.92, emotions: ['joy', 'satisfaction'] }]
            }],
            dependencies: [],
            metrics: {
              avgResponseTime: 800,
              throughput: 180,
              successRate: 0.96,
              errorRate: 0.04,
              accuracy: 0.87,
              precision: 0.86,
              recall: 0.88,
              f1Score: 0.87,
              usageCount: 8500,
              activeUsers: 300,
              avgCpuUsage: 30,
              avgMemoryUsage: 256,
              avgTokenUsage: 50,
              lastUpdated: now
            },
            resources: [{ type: 'cpu', amount: 1, unit: 'cores', priority: 'low' }, { type: 'memory', amount: 2, unit: 'GB', priority: 'low' }],
            sources: [{ id: 'huggingface_bert', type: 'llm_models' as any, name: 'HuggingFace BERT', description: 'BERT情感分析模型', config: {}, version: '1.0', reliability: 0.95 }],
            createdAt: new Date('2024-01-12'),
            updatedAt: now,
            author: 'NLP Team',
            tags: ['sentiment', 'emotion', 'analysis'],
            metadata: {
              author: 'NLP Team',
              organization: 'EFIAgent Corp',
              license: 'Apache-2.0',
              category: 'nlp',
              difficulty: 'beginner',
              rating: 4.5,
              downloads: 890,
              featured: false,
              verified: true,
              documentation: '情感分析能力模块，支持多种情感维度分析',
              examples: [{
                name: '客户满意度分析',
                description: '分析客户反馈的情感倾向',
                input: { text_input: '这次购物体验非常满意' },
                output: { sentiment: 'positive', confidence: 0.89, emotions: ['satisfaction', 'joy'] },
                code: 'emotion.analyze(input.text_input)'
              }],
              changelog: [],
              implementation: {
                language: 'Python',
                framework: 'HuggingFace',
                dependencies: ['transformers', 'torch', 'numpy'],
                resources: { cpu: '1 core', memory: '2GB' }
              }
            }
          }
        ],
        orchestrator: {
          id: 'orch_001',
          name: '客服编排器',
          description: '智能客服场景专用编排器，支持多轮对话和上下文管理',
          mode: CapabilityOrchestrationMode.ADAPTIVE,
          rules: [
            {
              id: 'rule_001',
              name: '情感优先路由',
              description: '根据用户情感状态调整服务策略',
              condition: 'emotion_result.sentiment == "negative"',
              action: { type: 'route', target: 'priority_service', parameters: { priority: 'high' } },
              priority: 1
            }
          ],
          capabilityMapping: [
            {
              id: 'map_001',
              sourceCapability: 'nlp_understanding',
              targetCapability: 'emotion_analysis',
              transformation: { type: 'map', expression: 'input.user_input', parameters: {} },
              description: '将NLP理解结果传递给情感分析'
            }
          ],
          executionStrategy: {
            loadBalancing: 'least_connections',
            failover: true,
            circuitBreaker: { enabled: true, failureThreshold: 5, recoveryTimeout: 30000, halfOpenMaxCalls: 3 },
            rateLimit: { enabled: true, requestsPerSecond: 100, burstSize: 200, strategy: 'token_bucket' }
          },
          optimization: {
            enabled: true,
            autoScaling: { enabled: true, minInstances: 2, maxInstances: 10, targetCpuUtilization: 70, targetMemoryUtilization: 80, scaleUpCooldown: 300, scaleDownCooldown: 600 },
            caching: { enabled: true, strategy: 'lru', maxSize: 1000, ttl: 3600 },
            prefetching: { enabled: false, strategy: 'predictive', lookaheadTime: 60 }
          }
        },
        knowledgeGraph: {
          enabled: true,
          ontologyLayers: [
            {
              id: 'customer_service_ontology',
              name: '客服领域本体',
              concepts: [
                {
                  id: 'customer',
                  name: '客户',
                  description: '使用服务的客户实体',
                  properties: [{ name: 'customer_id', type: 'string', required: true }, { name: 'level', type: 'string', required: false, defaultValue: 'regular' }],
                  parentConcepts: [],
                  childConcepts: ['vip_customer', 'regular_customer']
                },
                {
                  id: 'order',
                  name: '订单',
                  description: '客户订单实体',
                  properties: [{ name: 'order_id', type: 'string', required: true }, { name: 'status', type: 'string', required: true }, { name: 'amount', type: 'number', required: true }],
                  parentConcepts: [],
                  childConcepts: []
                }
              ],
              relations: [
                {
                  id: 'customer_has_order',
                  name: '客户拥有订单',
                  description: '客户与订单的关系',
                  sourceType: 'customer',
                  targetType: 'order',
                  properties: [{ name: 'order_date', type: 'date', required: true }]
                }
              ],
              constraints: [
                {
                  id: 'customer_order_constraint',
                  name: '客户订单约束',
                  type: 'cardinality',
                  expression: 'customer.orders.count >= 0'
                }
              ]
            }
          ],
          factLayers: [
            {
              id: 'customer_facts',
              name: '客户事实层',
              facts: [
                {
                  id: 'fact_001',
                  subject: 'customer_001',
                  predicate: 'has_level',
                  object: 'vip',
                  confidence: 1.0,
                  timestamp: now,
                  source: 'customer_database'
                }
              ],
              updateFrequency: 3600
            }
          ],
          ruleLayers: [
            {
              id: 'service_rules',
              name: '服务规则层',
              rules: [
                {
                  id: 'vip_priority_rule',
                  name: 'VIP客户优先规则',
                  condition: 'customer.level == "vip"',
                  conclusion: 'service.priority = "high"',
                  confidence: 1.0,
                  priority: 1
                }
              ]
            }
          ],
          temporalLayers: [],
          updateStrategy: 'real_time'
        },
        learningConfig: {
          enabled: true,
          strategies: [
            {
              id: 'conversation_learning',
              name: '对话学习策略',
              type: 'reinforcement' as any,
              description: '基于用户反馈优化对话策略',
              config: { learningRate: 0.01, explorationRate: 0.1, rewardFunction: 'user_satisfaction' },
              enabled: true
            }
          ],
          dataCollection: {
            enabled: true,
            sources: ['user_interactions', 'feedback_scores'],
            sampling: { strategy: 'random', rate: 0.1 },
            privacy: { anonymization: true, retention: 90 }
          } as any,
          modelManagement: {
            versioning: true,
            autoUpdate: false,
            rollback: true,
            testing: { enabled: true, testSet: 'validation_set', metrics: ['accuracy', 'f1_score'] }
          } as any,
          evaluation: {
            metrics: ['user_satisfaction', 'resolution_rate', 'response_time'],
            frequency: 'daily',
            thresholds: { user_satisfaction: 0.8, resolution_rate: 0.9 }
          } as any
        },
        collaborationConfig: {
          enabled: true,
          modes: ['human_in_loop', 'agent_handoff'],
          protocols: [
            {
              id: 'escalation_protocol',
              name: '升级协议',
              description: '复杂问题升级到人工客服',
              triggers: ['low_confidence', 'negative_emotion', 'explicit_request'],
              actions: ['transfer_to_human', 'notify_supervisor']
            }
          ],
          governance: {
            approvalRequired: false,
            auditTrail: true,
            accessControl: ['customer_service_team'],
            dataSharing: { allowed: true, restrictions: ['no_pii'] }
          } as any
        },
        deploymentConfig: {
          environment: 'production',
          infrastructure: {
            provider: 'aws',
            region: 'us-east-1',
            compute: { type: 'container', specs: { cpu: '2 cores', memory: '8GB', gpu: undefined } },
            network: { vpc: 'vpc-12345', subnets: ['subnet-1', 'subnet-2'], loadBalancer: true, ssl: true },
            security: { encryption: true, networkPolicies: true, firewallRules: [] },
            storage: { type: 'persistent', size: '100GB', storageClass: 'ssd', backup: true }
          } as any,
          scaling: {
            horizontal: { enabled: true, minReplicas: 2, maxReplicas: 10, targetCpuUtilization: 70, targetMemoryUtilization: 80 },
            vertical: { enabled: false, updateMode: 'Off', resourcePolicy: [] }
          } as any,
          monitoring: {
            enabled: true,
            metrics: ['cpu', 'memory', 'requests', 'errors'],
            logging: { level: 'info', retention: 30 },
            alerting: { enabled: true, channels: ['email', 'slack'] },
            healthChecks: { enabled: true, endpoint: '/health', interval: 30 }
          } as any,
          backup: {
            enabled: true,
            schedule: '0 2 * * *',
            retention: 30,
            storage: { type: 's3', config: { bucket: 'agent-backups' }, encryption: true }
          } as any
        },
        metadata: {
          author: 'AI Team',
          organization: 'EFIAgent Corp',
          license: 'MIT',
          tags: ['customer-service', 'multimodal', 'nlp', 'emotion-analysis'],
          category: 'business',
          difficulty: 'intermediate',
          rating: 4.8,
          downloads: 1250,
          featured: true,
          createdAt: new Date('2024-01-15'),
          updatedAt: now,
          changelog: [
            {
              version: '2.1.0',
              date: now,
              changes: ['添加情感分析能力', '优化对话流程', '增强知识图谱'],
              breaking: false
            },
            {
              version: '2.0.0',
              date: new Date('2024-01-01'),
              changes: ['重构架构', '支持多模态输入', '集成知识图谱'],
              breaking: true
            }
          ]
        }
      },
      {
        id: 'agent_002',
        name: '数据分析专家',
        description: '专业的数据分析和可视化Agent，具备统计分析、机器学习、数据挖掘和智能报告生成能力，支持多种数据源和分析算法',
        version: '1.5.2',
        status: AgentStatus.STOPPED,
        capabilities: [
          {
            id: 'data_preprocessing',
            name: '数据预处理',
            description: '数据清洗、转换、标准化和特征工程',
            type: CoreCapabilityType.COGNITIVE,
            subType: 'integration' as any,
            version: '2.0.0',
            maturityLevel: CapabilityMaturityLevel.QUANTIFIED,
            source: 'builtin' as any,
            category: 'data_analysis' as any,
            config: {
              executionMode: 'async',
              timeout: 30000,
              retryPolicy: { maxRetries: 2, backoffStrategy: 'exponential', initialDelay: 2000, maxDelay: 10000, retryableErrors: ['memory_error', 'timeout'] },
              qualityThreshold: 0.95,
              performanceTarget: { responseTime: 15000, throughput: 50, accuracy: 0.98, availability: 0.99 },
              securityLevel: 'high',
              accessControl: { authentication: true, authorization: ['data_analyst', 'data_scientist'], encryption: true, auditLog: true },
              monitoring: { enabled: true, metricsCollection: true, loggingLevel: 'debug', alerting: { enabled: true, thresholds: [], channels: [] }, healthCheck: { enabled: true, interval: 60, timeout: 10, failureThreshold: 3, successThreshold: 2 } },
              parameters: { maxMemoryUsage: '8GB', parallelProcessing: true, cacheResults: true }
            },
            inputs: [{
              id: 'raw_data',
              name: '原始数据',
              description: '需要处理的原始数据集',
              dataType: 'object',
              required: true,
              validation: { type: 'object' },
              examples: [{ format: 'csv', columns: ['id', 'name', 'value'], rows: 1000 }]
            }],
            outputs: [{
              id: 'processed_data',
              name: '处理后数据',
              description: '清洗和转换后的数据',
              dataType: 'object',
              schema: { data: 'array', metadata: 'object', statistics: 'object' },
              examples: [{ data: [], metadata: { rows: 950, columns: 15 }, statistics: { mean: 0, std: 1 } }]
            }],
            dependencies: [],
            metrics: {
              avgResponseTime: 12000,
              throughput: 60,
              successRate: 0.97,
              errorRate: 0.03,
              accuracy: 0.98,
              precision: 0.97,
              recall: 0.98,
              f1Score: 0.975,
              usageCount: 5000,
              activeUsers: 150,
              avgCpuUsage: 65,
              avgMemoryUsage: 6144,
              avgTokenUsage: 0,
              lastUpdated: now
            },
            resources: [{ type: 'cpu', amount: 4, unit: 'cores', priority: 'high' }, { type: 'memory', amount: 8, unit: 'GB', priority: 'high' }],
            sources: [{ id: 'pandas_numpy', type: 'custom_module' as any, name: 'Pandas & NumPy', description: '数据处理库', config: {}, version: '1.0', reliability: 0.99 }],
            createdAt: new Date('2024-01-08'),
            updatedAt: now,
            author: 'Data Team',
            tags: ['data-preprocessing', 'cleaning', 'feature-engineering'],
            metadata: {
              author: 'Data Team',
              organization: 'Analytics Inc',
              license: 'Apache-2.0',
              category: 'data_analysis',
              difficulty: 'advanced',
              rating: 4.6,
              downloads: 890,
              featured: true,
              verified: true,
              documentation: '数据预处理能力模块，支持多种数据格式和处理算法',
              examples: [{
                name: 'CSV数据清洗',
                description: '清洗CSV格式的销售数据',
                input: { raw_data: { format: 'csv', path: 'sales_data.csv' } },
                output: { data: [], metadata: { rows: 950, columns: 12 }, statistics: {} },
                code: 'preprocessor.clean_and_transform(input.raw_data)'
              }],
              changelog: [],
              implementation: {
                language: 'Python',
                framework: 'Pandas',
                dependencies: ['pandas', 'numpy', 'scikit-learn'],
                resources: { cpu: '4 cores', memory: '8GB' }
              }
            }
          },
          {
            id: 'statistical_analysis',
            name: '统计分析',
            description: '描述性统计、假设检验、相关性分析等统计方法',
            type: CoreCapabilityType.REASONING,
            subType: 'logical' as any,
            version: '1.8.0',
            maturityLevel: CapabilityMaturityLevel.OPTIMIZED,
            source: 'marketplace' as any,
            category: 'data_analysis' as any,
            config: {
              executionMode: 'sync',
              timeout: 10000,
              retryPolicy: { maxRetries: 1, backoffStrategy: 'fixed', initialDelay: 1000, maxDelay: 1000, retryableErrors: ['calculation_error'] },
              qualityThreshold: 0.9,
              performanceTarget: { responseTime: 5000, throughput: 100, accuracy: 0.95, availability: 0.98 },
              securityLevel: 'medium',
              accessControl: { authentication: true, authorization: ['data_analyst'], encryption: false, auditLog: true },
              monitoring: { enabled: true, metricsCollection: true, loggingLevel: 'info', alerting: { enabled: true, thresholds: [], channels: [] }, healthCheck: { enabled: true, interval: 30, timeout: 5, failureThreshold: 2, successThreshold: 1 } },
              parameters: { confidenceLevel: 0.95, significanceLevel: 0.05 }
            },
            inputs: [{
              id: 'dataset',
              name: '数据集',
              description: '用于统计分析的数据集',
              dataType: 'object',
              required: true,
              validation: { type: 'object' },
              examples: [{ columns: ['age', 'income', 'score'], data: [[25, 50000, 85], [30, 60000, 90]] }]
            }],
            outputs: [{
              id: 'analysis_result',
              name: '分析结果',
              description: '统计分析的结果报告',
              dataType: 'object',
              schema: { descriptive: 'object', correlations: 'object', tests: 'array' },
              examples: [{ descriptive: { mean: 27.5, std: 3.5 }, correlations: { age_income: 0.75 }, tests: [] }]
            }],
            dependencies: ['data_preprocessing'],
            metrics: {
              avgResponseTime: 3500,
              throughput: 120,
              successRate: 0.98,
              errorRate: 0.02,
              accuracy: 0.96,
              precision: 0.95,
              recall: 0.97,
              f1Score: 0.96,
              usageCount: 8000,
              activeUsers: 200,
              avgCpuUsage: 40,
              avgMemoryUsage: 2048,
              avgTokenUsage: 0,
              lastUpdated: now
            },
            resources: [{ type: 'cpu', amount: 2, unit: 'cores', priority: 'medium' }, { type: 'memory', amount: 4, unit: 'GB', priority: 'medium' }],
            sources: [{ id: 'scipy_stats', type: 'custom_module' as any, name: 'SciPy Stats', description: '统计分析库', config: {}, version: '1.0', reliability: 0.98 }],
            createdAt: new Date('2024-01-05'),
            updatedAt: now,
            author: 'Statistics Team',
            tags: ['statistics', 'hypothesis-testing', 'correlation'],
            metadata: {
              author: 'Statistics Team',
              organization: 'Analytics Inc',
              license: 'MIT',
              category: 'data_analysis',
              difficulty: 'intermediate',
              rating: 4.7,
              downloads: 1200,
              featured: false,
              verified: true,
              documentation: '统计分析能力模块，提供全面的统计方法',
              examples: [{
                name: '相关性分析',
                description: '分析变量间的相关关系',
                input: { dataset: { columns: ['x', 'y'], data: [[1, 2], [2, 4], [3, 6]] } },
                output: { correlations: { x_y: 1.0 }, tests: [] },
                code: 'stats.correlation_analysis(input.dataset)'
              }],
              changelog: [],
              implementation: {
                language: 'Python',
                framework: 'SciPy',
                dependencies: ['scipy', 'numpy', 'pandas'],
                resources: { cpu: '2 cores', memory: '4GB' }
              }
            }
          },
          {
            id: 'ml_modeling',
            name: '机器学习建模',
            description: '自动化机器学习建模，包括模型选择、训练和评估',
            type: CoreCapabilityType.LEARNING,
            subType: 'supervised' as any,
            version: '2.1.0',
            maturityLevel: CapabilityMaturityLevel.DEFINED,
            source: 'custom' as any,
            category: 'data_analysis' as any,
            config: {
              executionMode: 'async',
              timeout: 60000,
              retryPolicy: { maxRetries: 1, backoffStrategy: 'exponential', initialDelay: 5000, maxDelay: 15000, retryableErrors: ['training_error', 'memory_error'] },
              qualityThreshold: 0.85,
              performanceTarget: { responseTime: 45000, throughput: 10, accuracy: 0.9, availability: 0.95 },
              securityLevel: 'high',
              accessControl: { authentication: true, authorization: ['data_scientist', 'ml_engineer'], encryption: true, auditLog: true },
              monitoring: { enabled: true, metricsCollection: true, loggingLevel: 'debug', alerting: { enabled: true, thresholds: [], channels: [] }, healthCheck: { enabled: true, interval: 120, timeout: 30, failureThreshold: 2, successThreshold: 1 } },
              parameters: { autoML: true, crossValidation: 5, hyperparameterTuning: true }
            },
            inputs: [{
              id: 'training_data',
              name: '训练数据',
              description: '用于模型训练的数据集',
              dataType: 'object',
              required: true,
              validation: { type: 'object' },
              examples: [{ features: [], target: [], split: 0.8 }]
            }],
            outputs: [{
              id: 'model_result',
              name: '模型结果',
              description: '训练完成的模型和评估指标',
              dataType: 'object',
              schema: { model: 'object', metrics: 'object', predictions: 'array' },
              examples: [{ model: {}, metrics: { accuracy: 0.92, f1: 0.89 }, predictions: [] }]
            }],
            dependencies: ['data_preprocessing', 'statistical_analysis'],
            metrics: {
              avgResponseTime: 35000,
              throughput: 15,
              successRate: 0.94,
              errorRate: 0.06,
              accuracy: 0.91,
              precision: 0.90,
              recall: 0.92,
              f1Score: 0.91,
              usageCount: 2500,
              activeUsers: 80,
              avgCpuUsage: 80,
              avgMemoryUsage: 12288,
              avgTokenUsage: 0,
              lastUpdated: now
            },
            resources: [{ type: 'cpu', amount: 8, unit: 'cores', priority: 'high' }, { type: 'memory', amount: 16, unit: 'GB', priority: 'high' }, { type: 'gpu', amount: 1, unit: 'units', priority: 'medium' }],
            sources: [{ id: 'sklearn_automl', type: 'custom_module' as any, name: 'Scikit-learn AutoML', description: '自动化机器学习框架', config: {}, version: '1.0', reliability: 0.92 }],
            createdAt: new Date('2024-01-03'),
            updatedAt: now,
            author: 'ML Team',
            tags: ['machine-learning', 'automl', 'modeling'],
            metadata: {
              author: 'ML Team',
              organization: 'Analytics Inc',
              license: 'BSD-3-Clause',
              category: 'data_analysis',
              difficulty: 'expert',
              rating: 4.4,
              downloads: 650,
              featured: true,
              verified: false,
              documentation: '机器学习建模能力模块，支持自动化模型选择和优化',
              examples: [{
                name: '分类模型训练',
                description: '训练客户流失预测模型',
                input: { training_data: { features: [], target: [], task: 'classification' } },
                output: { model: {}, metrics: { accuracy: 0.88, precision: 0.85 } },
                code: 'ml.train_model(input.training_data)'
              }],
              changelog: [],
              implementation: {
                language: 'Python',
                framework: 'Scikit-learn',
                dependencies: ['scikit-learn', 'xgboost', 'lightgbm', 'optuna'],
                resources: { cpu: '8 cores', memory: '16GB', gpu: '1 GPU' }
              }
            }
          }
        ],
        orchestrator: {
          id: 'orch_002',
          name: '分析编排器',
          description: '数据分析专用编排器，支持复杂分析流水线和并行处理',
          mode: CapabilityOrchestrationMode.PIPELINE,
          rules: [
            {
              id: 'rule_002',
              name: '数据质量检查',
              description: '在分析前检查数据质量',
              condition: 'data_quality_score < 0.8',
              action: { type: 'route', target: 'data_preprocessing', parameters: { enhance_cleaning: true } },
              priority: 1
            },
            {
              id: 'rule_003',
              name: '模型性能优化',
              description: '根据数据规模选择合适的算法',
              condition: 'dataset_size > 100000',
              action: { type: 'transform', target: 'ml_modeling', parameters: { algorithm: 'gradient_boosting' } },
              priority: 2
            }
          ],
          capabilityMapping: [
            {
              id: 'map_002',
              sourceCapability: 'data_preprocessing',
              targetCapability: 'statistical_analysis',
              transformation: { type: 'map', expression: 'output.processed_data', parameters: {} },
              description: '将预处理后的数据传递给统计分析'
            },
            {
              id: 'map_003',
              sourceCapability: 'statistical_analysis',
              targetCapability: 'ml_modeling',
              transformation: { type: 'filter', expression: 'output.analysis_result.significant_features', parameters: {} },
              description: '将统计显著的特征传递给机器学习建模'
            }
          ],
          executionStrategy: {
            loadBalancing: 'weighted',
            failover: true,
            circuitBreaker: { enabled: true, failureThreshold: 3, recoveryTimeout: 60000, halfOpenMaxCalls: 2 },
            rateLimit: { enabled: true, requestsPerSecond: 20, burstSize: 50, strategy: 'sliding_window' }
          },
          optimization: {
            enabled: true,
            autoScaling: { enabled: true, minInstances: 1, maxInstances: 5, targetCpuUtilization: 75, targetMemoryUtilization: 85, scaleUpCooldown: 600, scaleDownCooldown: 1200 },
            caching: { enabled: true, strategy: 'ttl', maxSize: 500, ttl: 7200 },
            prefetching: { enabled: true, strategy: 'scheduled', lookaheadTime: 300 }
          }
        },
        knowledgeGraph: {
          enabled: true,
          ontologyLayers: [
            {
              id: 'data_analysis_ontology',
              name: '数据分析领域本体',
              concepts: [
                {
                  id: 'dataset',
                  name: '数据集',
                  description: '用于分析的数据集合',
                  properties: [{ name: 'format', type: 'string', required: true }, { name: 'size', type: 'number', required: true }, { name: 'quality_score', type: 'number', required: false }],
                  parentConcepts: [],
                  childConcepts: ['structured_data', 'unstructured_data']
                },
                {
                  id: 'model',
                  name: '模型',
                  description: '机器学习模型',
                  properties: [{ name: 'algorithm', type: 'string', required: true }, { name: 'accuracy', type: 'number', required: true }, { name: 'training_time', type: 'number', required: false }],
                  parentConcepts: [],
                  childConcepts: ['classification_model', 'regression_model']
                }
              ],
              relations: [
                {
                  id: 'dataset_trains_model',
                  name: '数据集训练模型',
                  description: '数据集用于训练模型的关系',
                  sourceType: 'dataset',
                  targetType: 'model',
                  properties: [{ name: 'training_date', type: 'date', required: true }]
                }
              ],
              constraints: [
                {
                  id: 'model_accuracy_constraint',
                  name: '模型准确率约束',
                  type: 'domain',
                  expression: 'model.accuracy >= 0 AND model.accuracy <= 1'
                }
              ]
            }
          ],
          factLayers: [
            {
              id: 'analysis_facts',
              name: '分析事实层',
              facts: [
                {
                  id: 'fact_002',
                  subject: 'sales_dataset_2024',
                  predicate: 'has_quality_score',
                  object: '0.92',
                  confidence: 0.95,
                  timestamp: now,
                  source: 'data_quality_service'
                }
              ],
              updateFrequency: 1800
            }
          ],
          ruleLayers: [
            {
              id: 'analysis_rules',
              name: '分析规则层',
              rules: [
                {
                  id: 'data_quality_rule',
                  name: '数据质量规则',
                  condition: 'dataset.quality_score < 0.7',
                  conclusion: 'preprocessing.required = true',
                  confidence: 0.9,
                  priority: 1
                }
              ]
            }
          ],
          temporalLayers: [],
          updateStrategy: 'batch'
        },
        learningConfig: {
          enabled: true,
          strategies: [
            {
              id: 'model_performance_learning',
              name: '模型性能学习策略',
              type: 'meta' as any,
              description: '基于历史模型性能优化算法选择',
              config: { metaLearningRate: 0.005, adaptationThreshold: 0.05 },
              enabled: true
            },
            {
              id: 'feature_importance_learning',
              name: '特征重要性学习',
              type: 'transfer' as any,
              description: '跨领域特征重要性知识迁移',
              config: { transferWeight: 0.3, domainSimilarity: 0.7 },
              enabled: true
            }
          ],
          dataCollection: {
            enabled: true,
            sources: ['model_performance', 'feature_importance', 'user_feedback'],
            sampling: { strategy: 'stratified', rate: 0.2 },
            privacy: { anonymization: true, retention: 180 }
          } as any,
          modelManagement: {
            versioning: true,
            autoUpdate: true,
            rollback: true,
            testing: { enabled: true, testSet: 'holdout_set', metrics: ['accuracy', 'precision', 'recall'] }
          } as any,
          evaluation: {
            metrics: ['model_accuracy', 'processing_time', 'resource_efficiency'],
            frequency: 'weekly',
            thresholds: { model_accuracy: 0.85, processing_time: 30000 }
          } as any
        },
        collaborationConfig: {
          enabled: false,
          modes: [],
          protocols: [],
          governance: {} as any
        },
        deploymentConfig: {
          environment: 'development',
          infrastructure: {
            provider: 'aws',
            region: 'us-west-2',
            vpc: 'vpc-analytics',
            subnets: ['subnet-private-1', 'subnet-private-2'],
            securityGroups: ['sg-analytics-compute'],
            instanceTypes: ['c5.2xlarge', 'p3.2xlarge'],
            storage: { type: 'ebs', size: '100GB', iops: 3000 }
          } as any,
          scaling: {
            enabled: true,
            minInstances: 1,
            maxInstances: 8,
            targetCpuUtilization: 70,
            targetMemoryUtilization: 80,
            scaleUpCooldown: 300,
            scaleDownCooldown: 600,
            metrics: ['cpu', 'memory', 'gpu_utilization', 'queue_length']
          } as any,
          monitoring: {
            enabled: true,
            provider: 'cloudwatch',
            metrics: ['cpu', 'memory', 'gpu', 'network', 'disk', 'model_accuracy', 'data_throughput'],
            alerting: {
              enabled: true,
              channels: ['email', 'slack', 'pagerduty'],
              thresholds: {
                cpu: 85,
                memory: 90,
                error_rate: 5,
                response_time: 30000
              }
            },
            dashboards: ['performance', 'ml_metrics', 'data_quality', 'cost_optimization'],
            logging: {
              level: 'info',
              retention: '30 days',
              structured: true
            }
          } as any,
          backup: {
            enabled: true,
            frequency: 'daily',
            retention: '30 days',
            crossRegion: true,
            encryption: true,
            includes: ['models', 'data', 'configurations']
          } as any
        },
        metadata: {
          author: 'Data Analytics Team',
          organization: 'Analytics Inc',
          license: 'Apache-2.0',
          tags: ['data-analysis', 'machine-learning', 'visualization', 'automl', 'statistics', 'data-mining'],
          category: 'technical',
          difficulty: 'expert',
          rating: 4.6,
          downloads: 2800,
          featured: true,
          verified: true,
          documentation: '专业的数据分析和机器学习Agent，支持端到端的数据科学工作流程，包括数据预处理、统计分析、机器学习建模和结果可视化',
          createdAt: new Date('2024-01-03'),
          updatedAt: new Date('2024-01-18'),
          changelog: [
            { version: '1.5.2', date: '2024-01-15', changes: ['优化机器学习模型性能', '增加GPU支持', '改进数据预处理算法'] },
            { version: '1.5.1', date: '2024-01-10', changes: ['修复统计分析bug', '增加新的可视化选项'] },
            { version: '1.5.0', date: '2024-01-05', changes: ['添加AutoML功能', '支持深度学习模型', '优化内存使用'] }
          ],
          examples: [
            {
              name: '销售数据分析',
              description: '分析电商销售数据，预测未来趋势',
              input: { data_source: 'sales_database', analysis_type: 'time_series_forecasting' },
              output: { forecast: [], insights: [], visualizations: [] },
              code: 'agent.analyze_sales_data(input.data_source, input.analysis_type)'
            },
            {
              name: '客户细分分析',
              description: '基于用户行为数据进行客户细分',
              input: { customer_data: [], segmentation_method: 'kmeans' },
              output: { segments: [], characteristics: [], recommendations: [] },
              code: 'agent.customer_segmentation(input.customer_data, input.segmentation_method)'
            }
          ],
          implementation: {
            language: 'Python',
            frameworks: ['Pandas', 'Scikit-learn', 'TensorFlow', 'PyTorch'],
            databases: ['PostgreSQL', 'MongoDB', 'InfluxDB'],
            visualization: ['Matplotlib', 'Plotly', 'Seaborn'],
            deployment: ['Docker', 'Kubernetes', 'AWS SageMaker']
          },
          performance: {
            benchmarks: {
              data_processing: '10GB/min',
              model_training: '1M samples/hour',
              inference: '1000 predictions/sec'
            },
            scalability: 'Horizontal scaling up to 100 nodes',
            availability: '99.9% uptime SLA'
          }
        }
      },
      {
        id: 'agent_003',
        name: '创意写作助手',
        description: '基于大语言模型的创意写作Agent，支持小说、诗歌、剧本等多种文体创作',
        version: '3.0.1',
        status: AgentStatus.RUNNING,
        capabilities: [
          {
            id: 'creative_generation',
            name: '创意内容生成',
            description: '基于大语言模型的创意文本生成，支持多种文体和风格',
            type: CoreCapabilityType.COGNITIVE,
            subType: 'generation' as any,
            version: '3.2.0',
            maturityLevel: CapabilityMaturityLevel.OPTIMIZED,
            source: 'llm_provider' as any,
            category: 'content_creation' as any,
            config: {
              executionMode: 'async',
              timeout: 45000,
              retryPolicy: { maxRetries: 2, backoffStrategy: 'exponential', initialDelay: 3000, maxDelay: 12000, retryableErrors: ['rate_limit', 'timeout'] },
              qualityThreshold: 0.85,
              performanceTarget: { responseTime: 30000, throughput: 20, accuracy: 0.88, availability: 0.98 },
              securityLevel: 'medium',
              accessControl: { authentication: true, authorization: ['writer', 'editor'], encryption: false, auditLog: true },
              monitoring: { enabled: true, metricsCollection: true, loggingLevel: 'info', alerting: { enabled: true, thresholds: [], channels: [] }, healthCheck: { enabled: true, interval: 60, timeout: 15, failureThreshold: 3, successThreshold: 2 } },
              parameters: { maxTokens: 4000, temperature: 0.8, topP: 0.9, frequencyPenalty: 0.1 }
            },
            inputs: [{
              id: 'writing_prompt',
              name: '写作提示',
              description: '创作的主题、风格和要求',
              dataType: 'object',
              required: true,
              validation: { type: 'object' },
              examples: [{ genre: 'novel', style: 'fantasy', theme: 'adventure', length: 'short_story' }]
            }],
            outputs: [{
              id: 'generated_content',
              name: '生成内容',
              description: '创作的文本内容',
              dataType: 'object',
              schema: { content: 'string', metadata: 'object', suggestions: 'array' },
              examples: [{ content: '在遥远的魔法王国...', metadata: { word_count: 1500, reading_time: '6分钟' }, suggestions: [] }]
            }],
            dependencies: [],
            metrics: {
              avgResponseTime: 25000,
              throughput: 25,
              successRate: 0.96,
              errorRate: 0.04,
              accuracy: 0.89,
              precision: 0.87,
              recall: 0.91,
              f1Score: 0.89,
              usageCount: 15000,
              activeUsers: 800,
              avgCpuUsage: 45,
              avgMemoryUsage: 3072,
              avgTokenUsage: 2500,
              lastUpdated: now
            },
            resources: [{ type: 'cpu', amount: 2, unit: 'cores', priority: 'medium' }, { type: 'memory', amount: 4, unit: 'GB', priority: 'medium' }],
            sources: [{ id: 'gpt4_turbo', type: 'llm_provider' as any, name: 'GPT-4 Turbo', description: '大语言模型API', config: {}, version: '1.0', reliability: 0.98 }],
            createdAt: new Date('2024-01-05'),
            updatedAt: now,
            author: 'Creative Team',
            tags: ['content-generation', 'creative-writing', 'llm'],
            metadata: {
              author: 'Creative Team',
              organization: 'WriteAI Studio',
              license: 'Creative Commons',
              category: 'content_creation',
              difficulty: 'intermediate',
              rating: 4.8,
              downloads: 3200,
              featured: true,
              verified: true,
              documentation: '创意内容生成能力模块，支持小说、诗歌、剧本等多种文体创作',
              examples: [{
                name: '奇幻小说创作',
                description: '生成奇幻题材的短篇小说',
                input: { writing_prompt: { genre: 'fantasy', theme: 'dragon_adventure', length: 2000 } },
                output: { content: '在古老的龙谷中...', metadata: { word_count: 2000 } },
                code: 'writer.generate_story(input.writing_prompt)'
              }],
              changelog: [],
              implementation: {
                language: 'Python',
                framework: 'OpenAI API',
                dependencies: ['openai', 'transformers', 'torch'],
                resources: { cpu: '2 cores', memory: '4GB' }
              }
            }
          },
          {
            id: 'style_adaptation',
            name: '风格适应',
            description: '根据指定作家或文学流派调整写作风格',
            type: CoreCapabilityType.REASONING,
            subType: 'analytical' as any,
            version: '2.5.0',
            maturityLevel: CapabilityMaturityLevel.DEFINED,
            source: 'custom' as any,
            category: 'content_creation' as any,
            config: {
              executionMode: 'sync',
              timeout: 15000,
              retryPolicy: { maxRetries: 1, backoffStrategy: 'fixed', initialDelay: 2000, maxDelay: 2000, retryableErrors: ['style_analysis_error'] },
              qualityThreshold: 0.8,
              performanceTarget: { responseTime: 10000, throughput: 50, accuracy: 0.85, availability: 0.97 },
              securityLevel: 'low',
              accessControl: { authentication: true, authorization: ['writer'], encryption: false, auditLog: false },
              monitoring: { enabled: true, metricsCollection: true, loggingLevel: 'info', alerting: { enabled: false, thresholds: [], channels: [] }, healthCheck: { enabled: true, interval: 30, timeout: 5, failureThreshold: 2, successThreshold: 1 } },
              parameters: { styleDatabase: 'comprehensive', adaptationStrength: 0.7 }
            },
            inputs: [{
              id: 'content_and_style',
              name: '内容和风格要求',
              description: '原始内容和目标风格',
              dataType: 'object',
              required: true,
              validation: { type: 'object' },
              examples: [{ content: '原始文本', target_style: 'hemingway', adaptation_level: 'moderate' }]
            }],
            outputs: [{
              id: 'adapted_content',
              name: '风格适应后内容',
              description: '调整风格后的文本',
              dataType: 'object',
              schema: { adapted_text: 'string', style_analysis: 'object', confidence: 'number' },
              examples: [{ adapted_text: '简洁有力的文本...', style_analysis: { tone: 'concise', vocabulary: 'simple' }, confidence: 0.85 }]
            }],
            dependencies: ['creative_generation'],
            metrics: {
              avgResponseTime: 8000,
              throughput: 60,
              successRate: 0.94,
              errorRate: 0.06,
              accuracy: 0.86,
              precision: 0.84,
              recall: 0.88,
              f1Score: 0.86,
              usageCount: 8500,
              activeUsers: 450,
              avgCpuUsage: 35,
              avgMemoryUsage: 2048,
              avgTokenUsage: 1200,
              lastUpdated: now
            },
            resources: [{ type: 'cpu', amount: 1, unit: 'cores', priority: 'low' }, { type: 'memory', amount: 2, unit: 'GB', priority: 'low' }],
            sources: [{ id: 'style_analyzer', type: 'custom_module' as any, name: 'Style Analyzer', description: '文本风格分析器', config: {}, version: '1.0', reliability: 0.94 }],
            createdAt: new Date('2024-01-08'),
            updatedAt: now,
            author: 'Style Team',
            tags: ['style-adaptation', 'text-analysis', 'writing-enhancement'],
            metadata: {
              author: 'Style Team',
              organization: 'WriteAI Studio',
              license: 'MIT',
              category: 'content_creation',
              difficulty: 'advanced',
              rating: 4.5,
              downloads: 1800,
              featured: false,
              verified: true,
              documentation: '风格适应能力模块，可以模仿不同作家和文学流派的写作风格',
              examples: [{
                name: '海明威风格改写',
                description: '将文本改写为海明威的简洁风格',
                input: { content_and_style: { content: '复杂的描述文本', target_style: 'hemingway' } },
                output: { adapted_text: '简洁的文本', style_analysis: { conciseness: 0.9 } },
                code: 'styler.adapt_style(input.content_and_style)'
              }],
              changelog: [],
              implementation: {
                language: 'Python',
                framework: 'NLTK',
                dependencies: ['nltk', 'spacy', 'textstat'],
                resources: { cpu: '1 core', memory: '2GB' }
              }
            }
          },
          {
            id: 'plot_development',
            name: '情节发展',
            description: '智能情节规划和故事结构优化',
            type: CoreCapabilityType.DECISION,
            subType: 'planning' as any,
            version: '1.8.0',
            maturityLevel: CapabilityMaturityLevel.QUANTIFIED,
            source: 'marketplace' as any,
            category: 'content_creation' as any,
            config: {
              executionMode: 'async',
              timeout: 20000,
              retryPolicy: { maxRetries: 1, backoffStrategy: 'linear', initialDelay: 3000, maxDelay: 3000, retryableErrors: ['plot_complexity_error'] },
              qualityThreshold: 0.75,
              performanceTarget: { responseTime: 15000, throughput: 30, accuracy: 0.82, availability: 0.96 },
              securityLevel: 'low',
              accessControl: { authentication: true, authorization: ['writer', 'editor'], encryption: false, auditLog: true },
              monitoring: { enabled: true, metricsCollection: true, loggingLevel: 'debug', alerting: { enabled: true, thresholds: [], channels: [] }, healthCheck: { enabled: true, interval: 45, timeout: 10, failureThreshold: 2, successThreshold: 1 } },
              parameters: { plotComplexity: 'medium', characterDevelopment: true, conflictTypes: ['internal', 'external'] }
            },
            inputs: [{
              id: 'story_elements',
              name: '故事元素',
              description: '角色、设定和基本情节要素',
              dataType: 'object',
              required: true,
              validation: { type: 'object' },
              examples: [{ characters: [], setting: {}, theme: 'redemption', target_length: 'novella' }]
            }],
            outputs: [{
              id: 'plot_structure',
              name: '情节结构',
              description: '完整的故事情节规划',
              dataType: 'object',
              schema: { acts: 'array', scenes: 'array', character_arcs: 'object', conflicts: 'array' },
              examples: [{ acts: [{ name: 'Setup', scenes: [] }], character_arcs: {}, conflicts: [] }]
            }],
            dependencies: [],
            metrics: {
              avgResponseTime: 12000,
              throughput: 35,
              successRate: 0.91,
              errorRate: 0.09,
              accuracy: 0.83,
              precision: 0.81,
              recall: 0.85,
              f1Score: 0.83,
              usageCount: 4200,
              activeUsers: 280,
              avgCpuUsage: 50,
              avgMemoryUsage: 3584,
              avgTokenUsage: 800,
              lastUpdated: now
            },
            resources: [{ type: 'cpu', amount: 2, unit: 'cores', priority: 'medium' }, { type: 'memory', amount: 4, unit: 'GB', priority: 'medium' }],
            sources: [{ id: 'plot_engine', type: 'custom_module' as any, name: 'Plot Engine', description: '情节生成引擎', config: {}, version: '1.0', reliability: 0.91 }],
            createdAt: new Date('2024-01-12'),
            updatedAt: now,
            author: 'Narrative Team',
            tags: ['plot-development', 'story-structure', 'narrative-planning'],
            metadata: {
              author: 'Narrative Team',
              organization: 'WriteAI Studio',
              license: 'GPL-3.0',
              category: 'content_creation',
              difficulty: 'expert',
              rating: 4.3,
              downloads: 950,
              featured: true,
              verified: false,
              documentation: '情节发展能力模块，提供智能的故事结构规划和情节发展建议',
              examples: [{
                name: '悬疑小说情节规划',
                description: '为悬疑小说生成完整的情节结构',
                input: { story_elements: { genre: 'mystery', protagonist: 'detective', setting: 'small_town' } },
                output: { acts: [], character_arcs: {}, conflicts: [] },
                code: 'plotter.develop_plot(input.story_elements)'
              }],
              changelog: [],
              implementation: {
                language: 'Python',
                framework: 'Custom',
                dependencies: ['networkx', 'matplotlib', 'pandas'],
                resources: { cpu: '2 cores', memory: '4GB' }
              }
            }
          }
        ],
        orchestrator: {
          id: 'orch_003',
          name: '创作编排器',
          description: '创意写作专用编排器，支持自适应创作流程和多模态内容生成',
          mode: CapabilityOrchestrationMode.ADAPTIVE,
          rules: [
            {
              id: 'rule_004',
              name: '创作质量检查',
              description: '检查生成内容的创意性和可读性',
              condition: 'content_quality_score < 0.7',
              action: { type: 'retry', target: 'creative_generation', parameters: { increase_creativity: true } },
              priority: 1
            },
            {
              id: 'rule_005',
              name: '风格一致性',
              description: '确保整篇作品风格一致',
              condition: 'style_consistency < 0.8',
              action: { type: 'route', target: 'style_adaptation', parameters: { enforce_consistency: true } },
              priority: 2
            },
            {
              id: 'rule_006',
              name: '情节连贯性',
              description: '检查情节发展的逻辑性',
              condition: 'plot_coherence < 0.75',
              action: { type: 'transform', target: 'plot_development', parameters: { fix_inconsistencies: true } },
              priority: 3
            }
          ],
          capabilityMapping: [
            {
              id: 'map_004',
              sourceCapability: 'plot_development',
              targetCapability: 'creative_generation',
              transformation: { type: 'map', expression: 'output.plot_structure', parameters: {} },
              description: '将情节结构传递给内容生成模块'
            },
            {
              id: 'map_005',
              sourceCapability: 'creative_generation',
              targetCapability: 'style_adaptation',
              transformation: { type: 'filter', expression: 'output.generated_content.content', parameters: {} },
              description: '将生成的内容传递给风格适应模块'
            }
          ],
          executionStrategy: {
            loadBalancing: 'round_robin',
            failover: true,
            circuitBreaker: { enabled: true, failureThreshold: 5, recoveryTimeout: 120000, halfOpenMaxCalls: 3 },
            rateLimit: { enabled: true, requestsPerSecond: 10, burstSize: 20, strategy: 'token_bucket' }
          },
          optimization: {
            enabled: true,
            autoScaling: { enabled: true, minInstances: 1, maxInstances: 3, targetCpuUtilization: 60, targetMemoryUtilization: 70, scaleUpCooldown: 300, scaleDownCooldown: 900 },
            caching: { enabled: true, strategy: 'lru', maxSize: 200, ttl: 3600 },
            prefetching: { enabled: false, strategy: 'none', lookaheadTime: 0 }
          }
        },
        knowledgeGraph: {
          enabled: true,
          ontologyLayers: [
            {
              id: 'creative_writing_ontology',
              name: '创意写作领域本体',
              concepts: [
                {
                  id: 'literary_genre',
                  name: '文学体裁',
                  description: '不同的文学创作类型',
                  properties: [{ name: 'style', type: 'string', required: true }, { name: 'structure', type: 'string', required: true }, { name: 'target_audience', type: 'string', required: false }],
                  parentConcepts: [],
                  childConcepts: ['novel', 'poetry', 'drama', 'essay']
                },
                {
                  id: 'character',
                  name: '角色',
                  description: '故事中的人物角色',
                  properties: [{ name: 'name', type: 'string', required: true }, { name: 'personality', type: 'object', required: true }, { name: 'background', type: 'string', required: false }],
                  parentConcepts: [],
                  childConcepts: ['protagonist', 'antagonist', 'supporting_character']
                },
                {
                  id: 'narrative_technique',
                  name: '叙事技巧',
                  description: '不同的叙事方法和技巧',
                  properties: [{ name: 'perspective', type: 'string', required: true }, { name: 'tense', type: 'string', required: true }, { name: 'voice', type: 'string', required: false }],
                  parentConcepts: [],
                  childConcepts: ['first_person', 'third_person', 'omniscient']
                }
              ],
              relations: [
                {
                  id: 'genre_uses_technique',
                  name: '体裁使用技巧',
                  description: '文学体裁与叙事技巧的关系',
                  sourceType: 'literary_genre',
                  targetType: 'narrative_technique',
                  properties: [{ name: 'frequency', type: 'number', required: true }]
                },
                {
                  id: 'character_appears_in_genre',
                  name: '角色出现在体裁中',
                  description: '角色类型与文学体裁的关系',
                  sourceType: 'character',
                  targetType: 'literary_genre',
                  properties: [{ name: 'importance', type: 'string', required: true }]
                }
              ],
              constraints: [
                {
                  id: 'genre_consistency_constraint',
                  name: '体裁一致性约束',
                  type: 'integrity',
                  expression: 'character.genre = story.genre'
                }
              ]
            }
          ],
          factLayers: [
            {
              id: 'writing_knowledge_facts',
              name: '写作知识事实层',
              facts: [
                {
                  id: 'fact_003',
                  subject: 'fantasy_genre',
                  predicate: 'commonly_uses',
                  object: 'third_person_omniscient',
                  confidence: 0.85,
                  timestamp: now,
                  source: 'literary_analysis_db'
                },
                {
                  id: 'fact_004',
                  subject: 'mystery_genre',
                  predicate: 'requires',
                  object: 'plot_twist',
                  confidence: 0.9,
                  timestamp: now,
                  source: 'genre_analysis_system'
                }
              ],
              updateFrequency: 3600
            }
          ],
          ruleLayers: [
            {
              id: 'creative_writing_rules',
              name: '创意写作规则层',
              rules: [
                {
                  id: 'show_dont_tell_rule',
                  name: '展示而非叙述规则',
                  condition: 'narrative_style = "descriptive"',
                  conclusion: 'use_sensory_details = true',
                  confidence: 0.8,
                  priority: 1
                },
                {
                  id: 'character_consistency_rule',
                  name: '角色一致性规则',
                  condition: 'character.established = true',
                  conclusion: 'maintain_personality_traits = true',
                  confidence: 0.95,
                  priority: 2
                }
              ]
            }
          ],
          temporalLayers: [
            {
              id: 'writing_trends',
              name: '写作趋势时序层',
              events: [
                {
                  id: 'trend_001',
                  timestamp: now,
                  event: 'dystopian_fiction_popularity_increase',
                  confidence: 0.75,
                  duration: 86400000,
                  source: 'market_analysis'
                }
              ],
              patterns: [
                {
                  id: 'seasonal_genre_pattern',
                  name: '季节性体裁模式',
                  description: '不同季节流行的文学体裁',
                  timeframe: 'seasonal',
                  confidence: 0.7
                }
              ]
            }
          ],
          updateStrategy: 'real_time'
        },
        learningConfig: {
          enabled: true,
          strategies: [
            {
              type: 'supervised' as any,
              config: {
                name: '写作风格学习策略',
                description: '通过分析优秀作品学习不同的写作风格',
                imitationAccuracy: 0.8,
                styleDatabase: 'comprehensive'
              },
              priority: 1,
              enabled: true
            },
            {
              type: 'reinforcement' as any,
              config: {
                name: '读者反馈学习',
                description: '基于读者评价和反馈优化创作质量',
                rewardFunction: 'engagement_score',
                learningRate: 0.01
              },
              priority: 2,
              enabled: true
            },
            {
              type: 'transfer' as any,
              config: {
                name: '体裁适应学习',
                description: '跨体裁知识迁移和适应',
                transferWeight: 0.4,
                adaptationThreshold: 0.6
              },
              priority: 3,
              enabled: true
            }
          ],
          dataCollection: {
            enabled: true,
            sources: ['user_ratings', 'engagement_metrics', 'style_preferences', 'genre_trends'],
            sampling: { strategy: 'importance', rate: 0.3 },
            privacy: { anonymization: true, retention: 365 }
          } as any,
          modelManagement: {
            versioning: true,
            autoUpdate: false,
            rollback: true,
            testing: { enabled: true, testSet: 'curated_samples', metrics: ['creativity_score', 'readability', 'engagement'] }
          } as any,
          evaluation: {
            metrics: ['creativity_score', 'style_consistency', 'reader_engagement', 'plot_coherence'],
            frequency: 'daily',
            thresholds: { creativity_score: 0.75, style_consistency: 0.8, reader_engagement: 0.7 }
          } as any
        },
        collaborationConfig: {
          enabled: true,
          modes: ['co_creation', 'peer_review', 'style_sharing'],
          protocols: [
            {
              id: 'creative_collaboration',
              name: '创意协作协议',
              description: '多个创作助手协同创作的协议',
              version: '1.2',
              config: { syncFrequency: 30, conflictResolution: 'voting' }
            }
          ],
          governance: {
            decisionMaking: 'consensus',
            conflictResolution: 'mediation',
            qualityControl: { enabled: true, threshold: 0.8 },
            accessControl: { authentication: true, authorization: ['writer', 'editor', 'reviewer'] }
          } as any
        },
        deploymentConfig: {
          environment: 'production',
          infrastructure: {
            provider: 'azure',
            region: 'east-us',
            resourceGroup: 'writeai-production',
            virtualNetwork: 'vnet-writeai',
            subnets: ['subnet-app', 'subnet-data'],
            securityGroups: ['nsg-writeai-app'],
            instanceTypes: ['Standard_D4s_v3', 'Standard_NC6s_v3'],
            storage: { type: 'premium_ssd', size: '50GB', iops: 2000 }
          } as any,
          scaling: {
            enabled: true,
            minInstances: 2,
            maxInstances: 10,
            targetCpuUtilization: 65,
            targetMemoryUtilization: 75,
            scaleUpCooldown: 180,
            scaleDownCooldown: 300,
            metrics: ['cpu', 'memory', 'request_count', 'response_time']
          } as any,
          monitoring: {
            enabled: true,
            provider: 'azure_monitor',
            metrics: ['cpu', 'memory', 'network', 'disk', 'llm_api_calls', 'content_quality_score'],
            alerting: {
              enabled: true,
              channels: ['email', 'teams', 'webhook'],
              thresholds: {
                cpu: 80,
                memory: 85,
                error_rate: 3,
                response_time: 45000,
                api_quota: 90
              }
            },
            dashboards: ['performance', 'content_metrics', 'user_engagement', 'api_usage'],
            logging: {
              level: 'info',
              retention: '90 days',
              structured: true,
              sensitiveDataMasking: true
            }
          } as any,
          backup: {
            enabled: true,
            frequency: 'hourly',
            retention: '7 days',
            crossRegion: false,
            encryption: true,
            includes: ['user_content', 'style_models', 'knowledge_base']
          } as any
        },
        metadata: {
          author: 'Creative Writing Team',
          organization: 'WriteAI Studio',
          license: 'Creative Commons BY-SA 4.0',
          tags: ['creative-writing', 'llm', 'content-generation', 'storytelling', 'style-adaptation', 'plot-development'],
          category: 'general',
          difficulty: 'intermediate',
          rating: 4.9,
          downloads: 5200,
          featured: true,
          verified: true,
          documentation: '基于大语言模型的创意写作助手，支持多种文体创作、风格适应和情节发展，为作家和内容创作者提供智能写作支持',
          createdAt: new Date('2024-01-05'),
          updatedAt: now,
          changelog: [
            { version: '3.0.1', date: '2024-01-18', changes: ['优化情节发展算法', '增加更多文学风格', '改进协作功能'] },
            { version: '3.0.0', date: '2024-01-15', changes: ['重大更新：添加情节发展能力', '支持多人协作创作', '增强风格适应功能'] },
            { version: '2.8.5', date: '2024-01-10', changes: ['修复风格一致性问题', '优化内容生成质量', '增加新的文学体裁支持'] }
          ],
          examples: [
            {
              name: '科幻小说创作',
              description: '创作一个关于时间旅行的科幻短篇小说',
              input: { writing_prompt: { genre: 'sci-fi', theme: 'time_travel', style: 'hard_science', length: 3000 } },
              output: { content: '2087年，物理学家陈博士发现了...', metadata: { word_count: 3000, reading_time: '12分钟' } },
              code: 'writer.create_story(input.writing_prompt)'
            },
            {
              name: '诗歌创作',
              description: '创作一首关于自然的现代诗',
              input: { writing_prompt: { genre: 'poetry', theme: 'nature', style: 'modern', form: 'free_verse' } },
              output: { content: '晨露滴落在青草上...', metadata: { lines: 24, stanzas: 4 } },
              code: 'writer.compose_poem(input.writing_prompt)'
            },
            {
              name: '剧本创作',
              description: '创作一个单幕话剧剧本',
              input: { writing_prompt: { genre: 'drama', theme: 'family_conflict', style: 'realistic', acts: 1 } },
              output: { content: '第一幕\n场景：客厅...', metadata: { characters: 4, scenes: 3 } },
              code: 'writer.write_script(input.writing_prompt)'
            }
          ],
          implementation: {
            language: 'Python',
            frameworks: ['OpenAI API', 'Transformers', 'NLTK', 'spaCy'],
            databases: ['MongoDB', 'Redis', 'Elasticsearch'],
            apis: ['OpenAI GPT-4', 'Claude', 'PaLM'],
            deployment: ['Docker', 'Kubernetes', 'Azure Container Instances']
          },
          performance: {
            benchmarks: {
              content_generation: '2000 words/min',
              style_adaptation: '500 words/sec',
              plot_development: '1 complete outline/min'
            },
            scalability: 'Auto-scaling up to 10 instances',
            availability: '99.5% uptime SLA',
            latency: 'Average 25s for 1000-word content'
          },
          integrations: [
            { name: 'Google Docs', type: 'plugin', status: 'active' },
            { name: 'Microsoft Word', type: 'add-in', status: 'beta' },
            { name: 'Notion', type: 'api', status: 'active' },
            { name: 'Scrivener', type: 'export', status: 'planned' }
          ],
          pricing: {
            model: 'usage-based',
            tiers: [
              { name: 'Free', limit: '10,000 words/month', price: 0 },
              { name: 'Pro', limit: '100,000 words/month', price: 29 },
              { name: 'Enterprise', limit: 'unlimited', price: 199 }
            ]
          }
        }
      }
    ];
  };
  
  /**
   * 计算Agent统计信息
   */
  const agentStats = useMemo((): AgentStats => {
    return {
      total: agents.length,
      running: agents.filter(a => a.status === AgentStatus.RUNNING).length,
      stopped: agents.filter(a => a.status === AgentStatus.STOPPED).length,
      error: agents.filter(a => a.status === AgentStatus.ERROR).length,
      deployed: agents.filter(a => a.deploymentConfig.environment === 'production').length,
      development: agents.filter(a => a.deploymentConfig.environment === 'development').length
    };
  }, [agents]);
  
  /**
   * 过滤和搜索Agent
   */
  const filteredAgents = useMemo(() => {
    let filtered = [...agents];
    
    // 文本搜索
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      filtered = filtered.filter(agent => 
        agent.name.toLowerCase().includes(searchLower) ||
        agent.description.toLowerCase().includes(searchLower) ||
        agent.metadata.tags.some(tag => tag.toLowerCase().includes(searchLower)) ||
        agent.metadata.author.toLowerCase().includes(searchLower)
      );
    }
    
    // 状态过滤
    if (filterOptions.status.length > 0) {
      filtered = filtered.filter(agent => filterOptions.status.includes(agent.status));
    }
    
    // 分类过滤
    if (filterOptions.categories.length > 0) {
      filtered = filtered.filter(agent => filterOptions.categories.includes(agent.metadata.category));
    }
    
    // 难度过滤
    if (filterOptions.difficulties.length > 0) {
      filtered = filtered.filter(agent => filterOptions.difficulties.includes(agent.metadata.difficulty));
    }
    
    // 标签过滤
    if (filterOptions.tags.length > 0) {
      filtered = filtered.filter(agent => 
        filterOptions.tags.some(tag => agent.metadata.tags.includes(tag))
      );
    }
    
    // 评分过滤
    filtered = filtered.filter(agent => 
      agent.metadata.rating >= filterOptions.ratingRange[0] &&
      agent.metadata.rating <= filterOptions.ratingRange[1]
    );
    
    // 排序
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortField) {
        case 'name':
          aValue = a.name;
          bValue = b.name;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'rating':
          aValue = a.metadata.rating;
          bValue = b.metadata.rating;
          break;
        case 'downloads':
          aValue = a.metadata.downloads;
          bValue = b.metadata.downloads;
          break;
        case 'createdAt':
          aValue = new Date(a.metadata.createdAt).getTime();
          bValue = new Date(b.metadata.createdAt).getTime();
          break;
        case 'updatedAt':
        default:
          aValue = new Date(a.metadata.updatedAt).getTime();
          bValue = new Date(b.metadata.updatedAt).getTime();
          break;
      }
      
      if (typeof aValue === 'string') {
        return sortOrder === 'ascend' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      } else {
        return sortOrder === 'ascend' ? aValue - bValue : bValue - aValue;
      }
    });
    
    return filtered;
  }, [agents, searchText, filterOptions, sortField, sortOrder]);
  
  /**
   * 创建新Agent
   */
  const handleCreateAgent = () => {
    navigate('/agent-designer?mode=create');
  };
  
  /**
   * 编辑Agent
   */
  const handleEditAgent = (agent: Agent2_0) => {
    // 将完整的agent配置数据存储到localStorage，供AgentDesigner2_0加载
    const agents = JSON.parse(localStorage.getItem('agents_2_0') || '[]');
    const existingIndex = agents.findIndex((a: Agent2_0) => a.id === agent.id);
    
    if (existingIndex >= 0) {
      // 更新现有agent数据
      agents[existingIndex] = agent;
    } else {
      // 添加新的agent数据
      agents.push(agent);
    }
    
    localStorage.setItem('agents_2_0', JSON.stringify(agents));
    
    // 导航到设计页面
    navigate(`/agent-designer?mode=edit&agentId=${agent.id}`);
  };
  
  /**
   * 查看Agent详情
   */
  const handleViewAgent = (agent: Agent2_0) => {
    setSelectedAgent(agent);
    setDetailDrawerVisible(true);
  };
  
  /**
   * 复制Agent
   */
  const handleCopyAgent = async (agent: Agent2_0) => {
    try {
      const newAgent: Agent2_0 = {
        ...agent,
        id: `agent_${Date.now()}`,
        name: `${agent.name} (副本)`,
        version: '1.0.0',
        status: AgentStatus.STOPPED,
        metadata: {
          ...agent.metadata,
          createdAt: new Date(),
          updatedAt: new Date(),
          downloads: 0,
          rating: 0,
          featured: false
        }
      };
      
      const updatedAgents = [...agents, newAgent];
      setAgents(updatedAgents);
      localStorage.setItem('agents_2_0', JSON.stringify(updatedAgents));
      
      message.success('Agent复制成功');
    } catch (error) {
      message.error('Agent复制失败');
      console.error('Copy agent error:', error);
    }
  };
  
  /**
   * 删除Agent
   */
  const handleDeleteAgent = async (agentId: string) => {
    try {
      const updatedAgents = agents.filter(a => a.id !== agentId);
      setAgents(updatedAgents);
      localStorage.setItem('agents_2_0', JSON.stringify(updatedAgents));
      
      message.success('Agent删除成功');
    } catch (error) {
      message.error('Agent删除失败');
      console.error('Delete agent error:', error);
    }
  };
  
  /**
   * 启动Agent
   */
  const handleStartAgent = async (agentId: string) => {
    try {
      const updatedAgents = agents.map(a => 
        a.id === agentId ? { ...a, status: AgentStatus.RUNNING } : a
      );
      setAgents(updatedAgents);
      localStorage.setItem('agents_2_0', JSON.stringify(updatedAgents));
      
      message.success('Agent启动成功');
    } catch (error) {
      message.error('Agent启动失败');
      console.error('Start agent error:', error);
    }
  };
  
  /**
   * 停止Agent
   */
  const handleStopAgent = async (agentId: string) => {
    try {
      const updatedAgents = agents.map(a => 
        a.id === agentId ? { ...a, status: AgentStatus.STOPPED } : a
      );
      setAgents(updatedAgents);
      localStorage.setItem('agents_2_0', JSON.stringify(updatedAgents));
      
      message.success('Agent停止成功');
    } catch (error) {
      message.error('Agent停止失败');
      console.error('Stop agent error:', error);
    }
  };
  
  /**
   * 批量操作
   */
  const handleBatchOperation = async (operation: string) => {
    if (selectedAgents.length === 0) {
      message.warning('请先选择要操作的Agent');
      return;
    }
    
    try {
      let updatedAgents = [...agents];
      
      switch (operation) {
        case 'start':
          updatedAgents = updatedAgents.map(a => 
            selectedAgents.includes(a.id) ? { ...a, status: AgentStatus.RUNNING } : a
          );
          message.success(`已启动 ${selectedAgents.length} 个Agent`);
          break;
        case 'stop':
          updatedAgents = updatedAgents.map(a => 
            selectedAgents.includes(a.id) ? { ...a, status: AgentStatus.STOPPED } : a
          );
          message.success(`已停止 ${selectedAgents.length} 个Agent`);
          break;
        case 'delete':
          updatedAgents = updatedAgents.filter(a => !selectedAgents.includes(a.id));
          message.success(`已删除 ${selectedAgents.length} 个Agent`);
          break;
        default:
          message.warning('未知操作');
          return;
      }
      
      setAgents(updatedAgents);
      localStorage.setItem('agents_2_0', JSON.stringify(updatedAgents));
      setSelectedAgents([]);
      setBatchOperationModalVisible(false);
    } catch (error) {
      message.error('批量操作失败');
      console.error('Batch operation error:', error);
    }
  };
  
  /**
   * 渲染状态标签
   */
  const renderStatusTag = (status: AgentStatus) => {
    const statusConfig = {
      [AgentStatus.RUNNING]: { color: 'green', text: '运行中' },
      [AgentStatus.STOPPED]: { color: 'default', text: '已停止' },
      [AgentStatus.ERROR]: { color: 'red', text: '错误' },
      [AgentStatus.DEPLOYING]: { color: 'blue', text: '部署中' },
      [AgentStatus.UPDATING]: { color: 'orange', text: '更新中' },
      [AgentStatus.IDLE]: { color: 'default', text: '空闲' },
      [AgentStatus.PAUSED]: { color: 'yellow', text: '已暂停' },
      [AgentStatus.COMPLETED]: { color: 'green', text: '已完成' }
    };
    
    const config = statusConfig[status] || { color: 'default', text: '未知' };
    return <Badge status={config.color as any} text={config.text} />;
  };
  
  /**
   * 渲染操作菜单
   */
  const renderActionMenu = (agent: Agent2_0) => {
    const menu = (
      <Menu>
        <Menu.Item key="view" icon={<EyeOutlined />} onClick={() => handleViewAgent(agent)}>
          查看详情
        </Menu.Item>
        <Menu.Item key="edit" icon={<EditOutlined />} onClick={() => handleEditAgent(agent)}>
          编辑
        </Menu.Item>
        <Menu.Item key="copy" icon={<CopyOutlined />} onClick={() => handleCopyAgent(agent)}>
          复制
        </Menu.Item>
        <Menu.Divider />
        {agent.status === AgentStatus.RUNNING ? (
          <Menu.Item key="stop" icon={<PauseCircleOutlined />} onClick={() => handleStopAgent(agent.id)}>
            停止
          </Menu.Item>
        ) : (
          <Menu.Item key="start" icon={<PlayCircleOutlined />} onClick={() => handleStartAgent(agent.id)}>
            启动
          </Menu.Item>
        )}
        <Menu.Item key="monitor" icon={<MonitorOutlined />}>
          监控
        </Menu.Item>
        <Menu.Divider />
        <Menu.Item key="export" icon={<ExportOutlined />}>
          导出
        </Menu.Item>
        <Menu.Item key="share" icon={<ShareAltOutlined />}>
          分享
        </Menu.Item>
        <Menu.Divider />
        <Menu.Item 
          key="delete" 
          icon={<DeleteOutlined />} 
          danger
          onClick={() => {
            Modal.confirm({
              title: '确认删除',
              content: `确定要删除Agent "${agent.name}" 吗？此操作不可恢复。`,
              onOk: () => handleDeleteAgent(agent.id)
            });
          }}
        >
          删除
        </Menu.Item>
      </Menu>
    );
    
    return (
      <Dropdown overlay={menu} trigger={['click']}>
        <Button type="text" icon={<SettingOutlined />} />
      </Dropdown>
    );
  };
  
  /**
   * 表格列定义
   */
  const columns = [
    {
      title: 'Agent名称',
      dataIndex: 'name',
      key: 'name',
      width: 250,
      render: (text: string, record: Agent2_0) => (
        <div className="agent-name-cell">
          <div className="agent-title">
            <strong>{text}</strong>
            {record.metadata.featured && (
              <StarOutlined style={{ color: '#faad14', marginLeft: 4 }} />
            )}
          </div>
          <div className="agent-subtitle">
            v{record.version} • {record.metadata.author}
          </div>
          <div className="agent-description">
            {record.description.length > 80 
              ? `${record.description.substring(0, 80)}...` 
              : record.description
            }
          </div>
        </div>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: AgentStatus) => renderStatusTag(status)
    },
    {
      title: '能力数量',
      key: 'capabilities',
      width: 100,
      render: (_: any, record: Agent2_0) => (
        <Badge count={record.capabilities.length} style={{ backgroundColor: '#52c41a' }} />
      )
    },
    {
      title: '分类',
      dataIndex: ['metadata', 'category'],
      key: 'category',
      width: 100,
      render: (category: string) => (
        <Tag color={category === 'business' ? 'blue' : category === 'technical' ? 'green' : 'orange'}>
          {category === 'business' ? '业务' : category === 'technical' ? '技术' : '通用'}
        </Tag>
      )
    },
    {
      title: '难度',
      dataIndex: ['metadata', 'difficulty'],
      key: 'difficulty',
      width: 100,
      render: (difficulty: string) => {
        const colors = {
          beginner: 'green',
          intermediate: 'orange',
          advanced: 'red',
          expert: 'purple'
        };
        const texts = {
          beginner: '初级',
          intermediate: '中级',
          advanced: '高级',
          expert: '专家'
        };
        return (
          <Tag color={colors[difficulty as keyof typeof colors]}>
            {texts[difficulty as keyof typeof texts]}
          </Tag>
        );
      }
    },
    {
      title: '评分',
      dataIndex: ['metadata', 'rating'],
      key: 'rating',
      width: 120,
      render: (rating: number) => (
        <div className="rating-cell">
          <Rate disabled value={rating} allowHalf style={{ fontSize: 12 }} />
          <span className="rating-text">{rating.toFixed(1)}</span>
        </div>
      )
    },
    {
      title: '下载量',
      dataIndex: ['metadata', 'downloads'],
      key: 'downloads',
      width: 100,
      render: (downloads: number) => (
        <span>{downloads.toLocaleString()}</span>
      )
    },
    {
      title: '更新时间',
      dataIndex: ['metadata', 'updatedAt'],
      key: 'updatedAt',
      width: 120,
      render: (date: Date) => (
        <span>{new Date(date).toLocaleDateString()}</span>
      )
    },
    {
      title: '操作',
      key: 'actions',
      width: 120,
      fixed: 'right' as const,
      render: (_: any, record: Agent2_0) => (
        <Space>
          <Tooltip title="查看详情">
            <Button 
              type="text" 
              size="small" 
              icon={<EyeOutlined />}
              onClick={() => handleViewAgent(record)}
            />
          </Tooltip>
          <Tooltip title="编辑">
            <Button 
              type="text" 
              size="small" 
              icon={<EditOutlined />}
              onClick={() => handleEditAgent(record)}
            />
          </Tooltip>
          {renderActionMenu(record)}
        </Space>
      )
    }
  ];
  
  /**
   * 渲染统计卡片
   */
  const renderStatsCards = () => {
    return (
      <Row gutter={16} className="stats-cards">
        <Col span={4}>
          <Card size="small">
            <Statistic
              title="总数"
              value={agentStats.total}
              prefix={<BulbOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small">
            <Statistic
              title="运行中"
              value={agentStats.running}
              prefix={<PlayCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small">
            <Statistic
              title="已停止"
              value={agentStats.stopped}
              prefix={<PauseCircleOutlined />}
              valueStyle={{ color: '#8c8c8c' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small">
            <Statistic
              title="错误"
              value={agentStats.error}
              prefix={<StopOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small">
            <Statistic
              title="已部署"
              value={agentStats.deployed}
              prefix={<CloudOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small">
            <Statistic
              title="开发中"
              value={agentStats.development}
              prefix={<BulbOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>
    );
  };
  
  /**
   * 渲染工具栏
   */
  const renderToolbar = () => {
    return (
      <div className="toolbar">
        <div className="toolbar-left">
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={handleCreateAgent}
          >
            创建Agent
          </Button>
          
          <Button 
            icon={<ImportOutlined />}
            onClick={() => setImportModalVisible(true)}
          >
            导入
          </Button>
          
          <Button 
            icon={<ExportOutlined />}
            onClick={() => setExportModalVisible(true)}
            disabled={selectedAgents.length === 0}
          >
            导出
          </Button>
          
          <Button 
            icon={<SettingOutlined />}
            onClick={() => setBatchOperationModalVisible(true)}
            disabled={selectedAgents.length === 0}
          >
            批量操作
          </Button>
        </div>
        
        <div className="toolbar-right">
          <Search
            placeholder="搜索Agent名称、描述、标签..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 300 }}
            allowClear
          />
          
          <Select
            placeholder="状态过滤"
            mode="multiple"
            allowClear
            style={{ width: 150 }}
            value={filterOptions.status}
            onChange={(value) => setFilterOptions(prev => ({ ...prev, status: value }))}
          >
            <Option value={AgentStatus.RUNNING}>运行中</Option>
            <Option value={AgentStatus.STOPPED}>已停止</Option>
            <Option value={AgentStatus.ERROR}>错误</Option>
            <Option value={AgentStatus.DEPLOYING}>部署中</Option>
            <Option value={AgentStatus.UPDATING}>更新中</Option>
          </Select>
          
          <Select
            placeholder="排序方式"
            style={{ width: 120 }}
            value={`${sortField}_${sortOrder}`}
            onChange={(value) => {
              const [field, order] = value.split('_');
              setSortField(field);
              setSortOrder(order as 'ascend' | 'descend');
            }}
          >
            <Option value="updatedAt_descend">最新更新</Option>
            <Option value="createdAt_descend">最新创建</Option>
            <Option value="name_ascend">名称升序</Option>
            <Option value="rating_descend">评分降序</Option>
            <Option value="downloads_descend">下载量降序</Option>
          </Select>
          
          <Button 
            icon={<ReloadOutlined />}
            onClick={loadAgents}
            loading={loading}
          >
            刷新
          </Button>
        </div>
      </div>
    );
  };
  
  /**
   * 渲染Agent详情抽屉
   */
  const renderDetailDrawer = () => {
    if (!selectedAgent) return null;
    
    return (
      <Drawer
        title={selectedAgent.name}
        placement="right"
        width={600}
        open={detailDrawerVisible}
        onClose={() => setDetailDrawerVisible(false)}
      >
        <div className="agent-detail">
          <div className="detail-header">
            <div className="agent-info">
              <h3>{selectedAgent.name}</h3>
              <p>{selectedAgent.description}</p>
              <div className="agent-meta">
                <Tag>v{selectedAgent.version}</Tag>
                {renderStatusTag(selectedAgent.status)}
                <Tag color="blue">{selectedAgent.metadata.category}</Tag>
                <Rate disabled value={selectedAgent.metadata.rating} allowHalf />
              </div>
            </div>
          </div>
          
          <Tabs defaultActiveKey="overview">
            <TabPane tab="概览" key="overview">
              <div className="overview-content">
                <Row gutter={16}>
                  <Col span={12}>
                    <Statistic title="能力数量" value={selectedAgent.capabilities.length} />
                  </Col>
                  <Col span={12}>
                    <Statistic title="下载量" value={selectedAgent.metadata.downloads} />
                  </Col>
                </Row>
                
                <Divider />
                
                <div className="detail-section">
                  <h4>基本信息</h4>
                  <p><strong>作者:</strong> {selectedAgent.metadata.author}</p>
                  <p><strong>组织:</strong> {selectedAgent.metadata.organization}</p>
                  <p><strong>许可证:</strong> {selectedAgent.metadata.license}</p>
                  <p><strong>创建时间:</strong> {new Date(selectedAgent.metadata.createdAt).toLocaleString()}</p>
                  <p><strong>更新时间:</strong> {new Date(selectedAgent.metadata.updatedAt).toLocaleString()}</p>
                </div>
                
                <div className="detail-section">
                  <h4>标签</h4>
                  <div className="tags-container">
                    {selectedAgent.metadata.tags.map(tag => (
                      <Tag key={tag}>{tag}</Tag>
                    ))}
                  </div>
                </div>
              </div>
            </TabPane>
            
            <TabPane tab="能力配置" key="capabilities">
              <div className="capabilities-content">
                <p>能力模块数量: {selectedAgent.capabilities.length}</p>
                <p>编排模式: {selectedAgent.orchestrator.mode}</p>
                <p>知识图谱: {selectedAgent.knowledgeGraph.enabled ? '启用' : '禁用'}</p>
                <p>学习功能: {selectedAgent.learningConfig.enabled ? '启用' : '禁用'}</p>
                <p>协作功能: {selectedAgent.collaborationConfig.enabled ? '启用' : '禁用'}</p>
              </div>
            </TabPane>
            
            <TabPane tab="部署配置" key="deployment">
              <div className="deployment-content">
                <p>环境: {selectedAgent.deploymentConfig.environment}</p>
                <p>平台: {selectedAgent.deploymentConfig.infrastructure.platform}</p>
                {/* TODO: 添加更多部署配置信息 */}
              </div>
            </TabPane>
            
            <TabPane tab="监控数据" key="monitoring">
              <div className="monitoring-content">
                <p>监控功能开发中...</p>
                {/* TODO: 添加监控图表和数据 */}
              </div>
            </TabPane>
          </Tabs>
        </div>
      </Drawer>
    );
  };
  
  return (
    <div className="agent-manager-2-0">
      <div className="manager-header">
        <div className="header-title">
          <h2>
            <BulbOutlined /> EFIAgent 2.0 管理器
          </h2>
          <p>基于能力系统模型的智能Agent生命周期管理平台</p>
        </div>
      </div>
      
      {/* 统计卡片 */}
      {renderStatsCards()}
      
      {/* 工具栏 */}
      {renderToolbar()}
      
      {/* Agent表格 */}
      <div className="agent-table-container">
        <Table
          columns={columns}
          dataSource={filteredAgents}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
            onChange: (page, pageSize) => {
              setPagination(prev => ({ ...prev, current: page, pageSize: pageSize || 10 }));
            }
          }}
          rowSelection={{
            selectedRowKeys: selectedAgents,
            onChange: (selectedRowKeys) => {
              setSelectedAgents(selectedRowKeys as string[]);
            }
          }}
          scroll={{ x: 1200 }}
          size="small"
        />
      </div>
      
      {/* Agent详情抽屉 */}
      {renderDetailDrawer()}
      
      {/* TODO: 添加导入、导出、批量操作等模态框 */}
    </div>
  );
};

export default AgentManager2_0;