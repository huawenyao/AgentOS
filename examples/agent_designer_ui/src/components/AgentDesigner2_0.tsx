/**
 * EFIAgent 2.0 智能Agent设计器
 * 基于能力系统模型的下一代Agent可视化设计工具
 * 支持认知、推理、决策、学习四大核心能力维度的系统化建模
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Button, Tooltip, Tabs, Switch, Space, Modal, Form, Input, Select, 
  message, Card, Divider, Progress, Badge, Tag, Drawer, Tree, 
  Collapse, Slider, InputNumber, Radio, Checkbox, Upload
} from 'antd';
import {
  DeleteOutlined, SaveOutlined, MoonOutlined, SunOutlined, 
  ArrowLeftOutlined, PlusOutlined, SettingOutlined, 
  EyeOutlined, PlayCircleOutlined, StopOutlined,
  ThunderboltOutlined, BulbOutlined, 
  BookOutlined, ApiOutlined, DatabaseOutlined,
  CloudOutlined, SecurityScanOutlined, MonitorOutlined,
  CheckCircleOutlined, ExperimentOutlined, RobotOutlined
} from '@ant-design/icons';
import ReactFlow, {
  Controls, Background, MiniMap, addEdge, useNodesState, 
  useEdgesState, NodeTypes, OnSelectionChangeParams,
  Node, Edge, Connection
} from 'reactflow';
import {
  CoreCapabilityType, CognitiveCapabilityType, ReasoningCapabilityType,
  DecisionCapabilityType, LearningCapabilityType, CapabilitySourceType,
  CapabilityMaturityLevel, CapabilityOrchestrationMode, AgentStatus,
  CoreCapabilityModule, Agent2_0, CapabilityOrchestrator,
  KnowledgeGraphConfig, LearningConfig, CollaborationConfig,
  DeploymentConfig, AgentMetadata, CapabilitySource, CapabilityCategory
} from './CapabilitySystemTypes';
import AIAssistant from './AIAssistant';
import RealTimeValidator from './RealTimeValidator';
import CoreCapabilityModules from './CoreCapabilityModules';
import './AgentDesigner.css';
import './AgentDesigner2_0.css';
import './AIAssistant.css';
import './RealTimeValidator.css';
import './CoreCapabilityModules.css';

const { TabPane } = Tabs;
const { Panel } = Collapse;
const { Option } = Select;
const { TextArea } = Input;

// 能力图标映射
const CAPABILITY_ICONS = {
  [CoreCapabilityType.COGNITIVE]: <BulbOutlined />,
  [CoreCapabilityType.REASONING]: <ThunderboltOutlined />,
  [CoreCapabilityType.DECISION]: <BulbOutlined />,
  [CoreCapabilityType.LEARNING]: <BookOutlined />
};

// 能力颜色映射
const CAPABILITY_COLORS: { [key in CoreCapabilityType]: string } = {
  [CoreCapabilityType.COGNITIVE]: '#1890ff',
  [CoreCapabilityType.REASONING]: '#52c41a',
  [CoreCapabilityType.DECISION]: '#faad14',
  [CoreCapabilityType.LEARNING]: '#722ed1'
};

// 成熟度等级颜色
const MATURITY_COLORS = {
  [CapabilityMaturityLevel.INITIAL]: '#f5222d',
  [CapabilityMaturityLevel.MANAGED]: '#fa8c16',
  [CapabilityMaturityLevel.DEFINED]: '#fadb14',
  [CapabilityMaturityLevel.QUANTIFIED]: '#52c41a',
  [CapabilityMaturityLevel.OPTIMIZED]: '#1890ff'
};

interface AgentDesigner2_0Props {
  mode?: 'create' | 'edit' | 'view';
  agentId?: string;
}

const AgentDesigner2_0: React.FC<AgentDesigner2_0Props> = ({ mode = 'create', agentId }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [form] = Form.useForm();
  
  // 核心状态
  const [agent, setAgent] = useState<Agent2_0 | null>(null);
  const [capabilities, setCapabilities] = useState<CoreCapabilityModule[]>([]);
  const [selectedCapability, setSelectedCapability] = useState<CoreCapabilityModule | null>(null);
  const [orchestrator, setOrchestrator] = useState<CapabilityOrchestrator | null>(null);
  const [knowledgeGraph, setKnowledgeGraph] = useState<KnowledgeGraphConfig | null>(null);
  const [learning, setLearning] = useState<LearningConfig | null>(null);
  const [collaboration, setCollaboration] = useState<CollaborationConfig | null>(null);
  const [deployment, setDeployment] = useState<DeploymentConfig | null>(null);
  const [metadata, setMetadata] = useState<AgentMetadata | null>(null);
  
  // UI状态
  const [darkMode, setDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [loading, setLoading] = useState(false);
  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [capabilityDrawerVisible, setCapabilityDrawerVisible] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  
  // 新增功能状态
  const [aiAssistantVisible, setAiAssistantVisible] = useState(false);
  const [validatorVisible, setValidatorVisible] = useState(false);
  const [coreModulesVisible, setCoreModulesVisible] = useState(false);
  
  // ReactFlow状态
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  
  // 能力库数据
  const [availableCapabilities, setAvailableCapabilities] = useState<CoreCapabilityModule[]>([]);
  
  /**
   * 初始化组件
   */
  useEffect(() => {
    initializeDesigner();
    loadAvailableCapabilities();
  }, [mode, agentId]);
  
  /**
   * 初始化设计器
   */
  const initializeDesigner = async () => {
    setLoading(true);
    try {
      if (mode === 'edit' && agentId) {
        // 加载现有Agent配置
        const existingAgent = await loadAgent(agentId);
        if (existingAgent) {
          setAgent(existingAgent);
          setCapabilities(existingAgent.capabilities || []);
          setOrchestrator(existingAgent.orchestrator);
          setKnowledgeGraph(existingAgent.knowledgeGraph || null);
          setLearning(existingAgent.learning || null);
          setCollaboration(existingAgent.collaboration || null);
          setDeployment(existingAgent.deployment || null);
          setMetadata(existingAgent.metadata || null);
          
          // 设置表单基础信息
          form.setFieldsValue({
            name: existingAgent.name,
            description: existingAgent.description,
            version: existingAgent.version,
            category: existingAgent.category,
            difficulty: existingAgent.difficulty,
            tags: existingAgent.tags
          });
          
          // 生成能力流程图
          if (existingAgent.capabilities && existingAgent.capabilities.length > 0) {
            generateFlowFromCapabilities(existingAgent.capabilities);
          }
          
          console.log('Agent loaded successfully:', {
            id: existingAgent.id,
            name: existingAgent.name,
            capabilitiesCount: existingAgent.capabilities?.length || 0,
            hasKnowledgeGraph: !!existingAgent.knowledgeGraph,
            hasLearning: !!existingAgent.learning,
            hasCollaboration: !!existingAgent.collaboration,
            hasDeployment: !!existingAgent.deployment,
            hasMetadata: !!existingAgent.metadata
          });
        } else {
          message.error(`未找到ID为 ${agentId} 的Agent配置`);
          console.error('Agent not found:', agentId);
        }
      } else {
        // 创建新Agent的默认配置
        const newAgent = createDefaultAgent();
        setAgent(newAgent);
        setOrchestrator(newAgent.orchestrator);
      }
    } catch (error) {
      message.error('初始化设计器失败');
      console.error('Designer initialization error:', error);
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * 加载Agent配置
   */
  const loadAgent = async (id: string): Promise<Agent2_0 | null> => {
    // TODO: 实现从API加载Agent配置
    // 临时从localStorage加载
    const agents = JSON.parse(localStorage.getItem('agents_2_0') || '[]');
    return agents.find((a: Agent2_0) => a.id === id) || null;
  };
  
  /**
   * 创建默认Agent配置
   */
  const createDefaultAgent = (): Agent2_0 => {
    const now = new Date();
    return {
      id: `agent_2_0_${Date.now()}`,
      name: '',
      description: '',
      version: '1.0.0',
      status: AgentStatus.IDLE,
      capabilities: [],
      orchestrator: {
        id: `orchestrator_${Date.now()}`,
        name: '默认编排器',
        description: '基于规则的能力编排器',
        mode: CapabilityOrchestrationMode.SEQUENTIAL,
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
            lookaheadTime: 60
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
            normalization: true,
            deduplication: true,
            validation: true,
            transformation: []
          },
          privacy: {
            anonymization: true,
            encryption: true,
            accessControl: {
              authentication: true,
              authorization: [],
              encryption: true,
              auditLog: true
            },
            retentionPolicy: {
              enabled: true,
              retentionPeriod: 365,
              archiveStrategy: 'anonymize'
            }
          }
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
        },
        evaluation: {
          enabled: true,
          metrics: ['accuracy', 'precision', 'recall', 'f1_score'],
          frequency: 24,
          benchmarks: []
        }
      },
      collaborationConfig: {
        enabled: true,
        modes: [
          {
            type: 'hierarchical',
            config: {},
            enabled: true
          }
        ],
        protocols: [
          {
            type: 'http',
            config: {
              port: 8080,
              timeout: 30000
            },
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
                events: ['authentication', 'authorization', 'data_access'],
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
                method: 'quantitative',
                scale: 'numeric_1_10',
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
        environment: 'development',
        infrastructure: {
          platform: 'kubernetes',
          resources: {
            cpu: { request: 0.5, limit: 2, unit: 'cores' },
            memory: { request: 512, limit: 2048, unit: 'MB' },
            storage: { request: 1, limit: 10, unit: 'GB' }
          },
          networking: {
            ingress: {
              enabled: true,
              host: 'agent.example.com',
              tls: true,
              annotations: {}
            },
            service: {
              type: 'ClusterIP',
              ports: [
                {
                  name: 'http',
                  port: 80,
                  targetPort: 8080,
                  protocol: 'TCP'
                }
              ]
            },
            security: {
              networkPolicies: true,
              firewallRules: []
            }
          },
          storage: {
            type: 'persistent',
            size: '10Gi',
            storageClass: 'standard',
            backup: true
          }
        },
        scaling: {
          horizontal: {
            enabled: true,
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
            timeout: 5,
            failureThreshold: 3,
            successThreshold: 1
          }
        },
        backup: {
          enabled: true,
          schedule: '0 2 * * *',
          retention: 30,
          storage: {
            type: 'local',
            config: {},
            encryption: true
          }
        }
      },
      metadata: {
        author: 'current_user',
        organization: '',
        license: 'MIT',
        tags: [],
        category: 'general',
        difficulty: 'beginner',
        rating: 0,
        downloads: 0,
        featured: false,
        createdAt: now,
        updatedAt: now,
        changelog: [
          {
            version: '1.0.0',
            date: now,
            changes: ['初始版本'],
            breaking: false
          }
        ]
      }
    };
  };
  
  /**
   * 加载可用能力库
   */
  const loadAvailableCapabilities = async () => {
    // TODO: 从API加载能力库
    // 临时创建示例能力
    const sampleCapabilities: CoreCapabilityModule[] = [
      {
        id: 'cognitive_perception_001',
        name: '多模态感知',
        description: '处理文本、图像、音频等多种输入模态',
        type: CoreCapabilityType.COGNITIVE,
        subType: CognitiveCapabilityType.PERCEPTION,
        version: '1.0.0',
        maturityLevel: CapabilityMaturityLevel.DEFINED,
        source: CapabilitySource.BUILTIN,
        category: CapabilityCategory.PERCEPTION,
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
          qualityThreshold: 0.8,
          performanceTarget: {
            responseTime: 5000,
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
            supportedFormats: ['text', 'image', 'audio'],
            maxFileSize: '10MB',
            processingMode: 'batch'
          }
        },
        inputs: [
          {
            id: 'input_data',
            name: '输入数据',
            description: '待处理的多模态数据',
            dataType: 'multimodal',
            required: true,
            validation: {
              type: 'object',
              custom: 'validateMultimodalData'
            },
            examples: [
              { type: 'text', content: '这是一段文本' },
              { type: 'image', url: 'https://example.com/image.jpg' }
            ]
          }
        ],
        outputs: [
          {
            id: 'processed_data',
            name: '处理结果',
            description: '感知处理后的结构化数据',
            dataType: 'object',
            schema: {
              type: 'object',
              properties: {
                modality: { type: 'string' },
                content: { type: 'any' },
                confidence: { type: 'number' },
                metadata: { type: 'object' }
              }
            },
            examples: [
              {
                modality: 'text',
                content: { text: '这是一段文本', entities: [] },
                confidence: 0.95,
                metadata: { language: 'zh-CN' }
              }
            ]
          }
        ],
        dependencies: [],
        metrics: {
          avgResponseTime: 2500,
          throughput: 80,
          successRate: 0.95,
          errorRate: 0.05,
          accuracy: 0.92,
          precision: 0.90,
          recall: 0.88,
          f1Score: 0.89,
          usageCount: 1250,
          activeUsers: 45,
          avgCpuUsage: 65,
          avgMemoryUsage: 512,
          avgTokenUsage: 150,
          lastUpdated: new Date()
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
            priority: 'high'
          }
        ],
        sources: [
          {
            id: 'openai_gpt4v',
            type: CapabilitySourceType.LLM_MODELS,
            name: 'GPT-4 Vision',
            description: 'OpenAI GPT-4 with vision capabilities',
            config: {
              model: 'gpt-4-vision-preview',
              maxTokens: 4096
            },
            version: '1.0',
            reliability: 0.95
          }
        ],
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date(),
        author: 'EFIAgent Team',
        tags: ['multimodal', 'perception', 'ai'],
        metadata: {
          author: 'EFIAgent Team',
          organization: 'EFIAgent',
          license: 'MIT',
          tags: ['multimodal', 'perception', 'ai'],
          category: 'cognitive',
          difficulty: 'intermediate',
          rating: 4.5,
          downloads: 1250,
          featured: true,
          verified: true,
          documentation: 'https://docs.efiagent.com/capabilities/multimodal-perception',
          examples: [
            {
              name: '文本处理示例',
              description: '处理文本输入的基本示例',
              input: { type: 'text', content: '这是一段测试文本' },
              output: { modality: 'text', content: { text: '这是一段测试文本', entities: [] }, confidence: 0.95 },
              code: 'const result = await capability.process({ type: "text", content: "这是一段测试文本" });'
            }
          ],
          changelog: [
            {
              version: '1.0.0',
              date: new Date('2024-01-01'),
              changes: ['初始版本发布', '支持多模态感知'],
              breaking: false
            }
          ],
          implementation: {
            language: 'TypeScript',
            framework: 'React',
            dependencies: ['@openai/api', 'tensorflow'],
            resources: {
              cpu: '2 cores',
              memory: '4GB',
              gpu: 'optional'
            }
          }
        }
      },
      {
        id: 'reasoning_logical_001',
        name: '逻辑推理引擎',
        description: '基于规则和知识图谱的逻辑推理能力',
        type: CoreCapabilityType.REASONING,
        subType: ReasoningCapabilityType.LOGICAL,
        version: '1.2.0',
        maturityLevel: CapabilityMaturityLevel.QUANTIFIED,
        source: CapabilitySource.BUILTIN,
        category: CapabilityCategory.REASONING,
        author: 'EFIAgent Team',
        tags: ['logical', 'reasoning', 'knowledge-based'],
        config: {
          executionMode: 'sync',
          timeout: 15000,
          retryPolicy: {
            maxRetries: 2,
            backoffStrategy: 'linear',
            initialDelay: 500,
            maxDelay: 5000,
            retryableErrors: ['computation_error']
          },
          qualityThreshold: 0.9,
          performanceTarget: {
            responseTime: 3000,
            throughput: 200,
            accuracy: 0.95,
            availability: 0.999
          },
          securityLevel: 'high',
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
            alerting: {
              enabled: true,
              thresholds: [],
              channels: []
            },
            healthCheck: {
              enabled: true,
              interval: 15,
              timeout: 3,
              failureThreshold: 2,
              successThreshold: 1
            }
          },
          parameters: {
            reasoningDepth: 5,
            confidenceThreshold: 0.8,
            maxInferences: 100
          }
        },
        inputs: [
          {
            id: 'premises',
            name: '前提条件',
            description: '推理的前提条件和事实',
            dataType: 'array',
            required: true,
            validation: {
              type: 'array',
              minLength: 1
            },
            examples: [
              ['所有人都会死', '苏格拉底是人']
            ]
          },
          {
            id: 'query',
            name: '查询目标',
            description: '需要推理验证的目标',
            dataType: 'string',
            required: true,
            validation: {
              type: 'string',
              minLength: 1
            },
            examples: ['苏格拉底会死吗？']
          }
        ],
        outputs: [
          {
            id: 'conclusion',
            name: '推理结论',
            description: '逻辑推理的结论和置信度',
            dataType: 'object',
            schema: {
              type: 'object',
              properties: {
                result: { type: 'boolean' },
                confidence: { type: 'number' },
                reasoning_path: { type: 'array' },
                explanation: { type: 'string' }
              }
            },
            examples: [
              {
                result: true,
                confidence: 0.98,
                reasoning_path: ['premise1', 'premise2', 'modus_ponens'],
                explanation: '根据三段论推理，苏格拉底会死'
              }
            ]
          }
        ],
        dependencies: [
          {
            capabilityId: 'knowledge_graph_001',
            type: 'optional',
            condition: 'enhanced_reasoning'
          }
        ],
        metrics: {
          avgResponseTime: 1800,
          throughput: 150,
          successRate: 0.98,
          errorRate: 0.02,
          accuracy: 0.96,
          precision: 0.94,
          recall: 0.92,
          f1Score: 0.93,
          usageCount: 2100,
          activeUsers: 78,
          avgCpuUsage: 45,
          avgMemoryUsage: 256,
          avgTokenUsage: 80,
          lastUpdated: new Date()
        },
        resources: [
          {
            type: 'cpu',
            amount: 1,
            unit: 'cores',
            priority: 'medium'
          },
          {
            type: 'memory',
            amount: 2,
            unit: 'GB',
            priority: 'medium'
          }
        ],
        sources: [
          {
            id: 'prolog_engine',
            type: CapabilitySourceType.CUSTOM_MODULE,
            name: 'Prolog推理引擎',
            description: '基于Prolog的逻辑推理引擎',
            config: {
              engine: 'swi-prolog',
              timeout: 10000
            },
            version: '8.4.0',
            reliability: 0.99
          }
        ],
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date(),
        metadata: {
          author: 'Logic Team',
          organization: 'EFIAgent',
          license: 'MIT',
          tags: ['logic', 'reasoning', 'inference'],
          category: 'reasoning',
          difficulty: 'advanced',
          rating: 4.8,
          downloads: 2100,
          featured: true,
          verified: true,
          documentation: 'https://docs.efiagent.com/capabilities/logical-reasoning',
          examples: [
            {
              name: '三段论推理示例',
              description: '经典的三段论逻辑推理示例',
              input: { premises: ['所有人都会死', '苏格拉底是人'], query: '苏格拉底会死吗？' },
              output: { result: true, confidence: 0.98, reasoning_path: ['premise1', 'premise2', 'modus_ponens'], explanation: '根据三段论推理，苏格拉底会死' },
              code: 'const result = await capability.reason({ premises: ["所有人都会死", "苏格拉底是人"], query: "苏格拉底会死吗？" });'
            }
          ],
          changelog: [
            {
              version: '1.2.0',
              date: new Date('2024-01-15'),
              changes: ['增强推理深度', '优化性能', '支持更复杂的逻辑规则'],
              breaking: false
            }
          ],
          implementation: {
            language: 'TypeScript',
            framework: 'Prolog',
            dependencies: ['swi-prolog', 'logic-engine'],
            resources: {
              cpu: '1 core',
              memory: '2GB'
            }
          }
        }
      }
    ];
    
    setAvailableCapabilities(sampleCapabilities);
  };
  
  /**
   * 从能力生成流程图
   */
  const generateFlowFromCapabilities = (caps: CoreCapabilityModule[]) => {
    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];
    
    // 按能力类型分组
    const groupedCaps = caps.reduce((acc, cap) => {
      if (!acc[cap.type]) acc[cap.type] = [];
      acc[cap.type].push(cap);
      return acc;
    }, {} as Record<CoreCapabilityType, CoreCapabilityModule[]>);
    
    let yOffset = 0;
    const xSpacing = 300;
    const ySpacing = 150;
    
    // 为每个能力类型创建节点
    Object.entries(groupedCaps).forEach(([type, typeCaps], typeIndex) => {
      typeCaps.forEach((cap, capIndex) => {
        const getCapabilityTypeClass = (type: CoreCapabilityType) => {
          const typeMap = {
            [CoreCapabilityType.COGNITIVE]: 'capability-type-cognitive',
            [CoreCapabilityType.REASONING]: 'capability-type-reasoning',
            [CoreCapabilityType.DECISION]: 'capability-type-decision',
            [CoreCapabilityType.LEARNING]: 'capability-type-learning'
          };
          return typeMap[type] || 'capability-type-cognitive';
        };

        const node: Node = {
          id: cap.id,
          type: 'default',
          position: { x: typeIndex * xSpacing, y: yOffset + capIndex * ySpacing },
          data: {
            label: (
              <div className={`capability-node ${getCapabilityTypeClass(cap.type as CoreCapabilityType)} fade-in`}>
                <div className={`capability-type-badge ${getCapabilityTypeClass(cap.type as CoreCapabilityType)}`}>
                  {cap.type.charAt(0).toUpperCase()}
                </div>
                <div className="capability-header">
                  <div className="capability-icon" style={{ backgroundColor: CAPABILITY_COLORS[cap.type as CoreCapabilityType] }}>
                    {CAPABILITY_ICONS[cap.type as CoreCapabilityType]}
                  </div>
                  <div className="capability-info">
                    <h3>{cap.name}</h3>
                    <p>{cap.description}</p>
                  </div>
                </div>
                <div className="capability-description">
                  版本: {cap.version}
                </div>
                <div className="capability-metrics">
                  <div className="capability-metric">
                    <Badge 
                      color={MATURITY_COLORS[cap.maturityLevel]} 
                      text={cap.maturityLevel}
                      size="small"
                    />
                  </div>
                  <div className="capability-metric">
                    <Tag 
                      color={CAPABILITY_COLORS[cap.type as CoreCapabilityType]}
                    >
                      {cap.type}
                    </Tag>
                  </div>
                </div>
              </div>
            ),
            capability: cap
          },
          className: 'react-flow__node-capability',
          style: {
            background: 'transparent',
            border: 'none',
            padding: 0
          }
        };
        newNodes.push(node);
      });
      yOffset += typeCaps.length * ySpacing + 50;
    });
    
    // 根据依赖关系创建连接
    caps.forEach(cap => {
      cap.dependencies.forEach(dep => {
        const sourceNode = newNodes.find(n => n.id === dep.capabilityId);
        const targetNode = newNodes.find(n => n.id === cap.id);
        if (sourceNode && targetNode) {
          const edge: Edge = {
            id: `${dep.capabilityId}-${cap.id}`,
            source: dep.capabilityId,
            target: cap.id,
            type: 'smoothstep',
            style: {
              stroke: dep.type === 'required' ? '#ff4d4f' : '#52c41a',
              strokeWidth: 2
            },
            label: dep.type,
            labelStyle: {
              fontSize: 12,
              fontWeight: 'bold'
            }
          };
          newEdges.push(edge);
        }
      });
    });
    
    setNodes(newNodes);
    setEdges(newEdges);
  };
  
  /**
   * 添加能力到Agent
   */
  const handleAddCapability = (capability: CoreCapabilityModule) => {
    const newCapability = {
      ...capability,
      id: `${capability.id}_${Date.now()}`
    };
    
    setCapabilities(prev => [...prev, newCapability]);
    generateFlowFromCapabilities([...capabilities, newCapability]);
    setCapabilityDrawerVisible(false);
    message.success(`已添加能力: ${capability.name}`);
  };
  
  /**
   * 移除能力
   */
  const handleRemoveCapability = (capabilityId: string) => {
    const updatedCapabilities = capabilities.filter(cap => cap.id !== capabilityId);
    setCapabilities(updatedCapabilities);
    generateFlowFromCapabilities(updatedCapabilities);
    
    // 如果当前选中的能力被删除，清除选择
    if (selectedCapability?.id === capabilityId) {
      setSelectedCapability(null);
    }
    
    message.success('已移除能力');
  };
  
  /**
   * 保存Agent配置
   */
  const handleSaveAgent = async () => {
    try {
      const values = await form.validateFields();
      
      if (!agent) {
        message.error('Agent配置不存在');
        return;
      }
      
      const updatedAgent: Agent2_0 = {
        ...agent,
        name: values.name,
        description: values.description,
        version: values.version || agent.version,
        capabilities,
        orchestrator: orchestrator!,
        metadata: {
          ...agent.metadata,
          updatedAt: new Date(),
          tags: values.tags || agent.metadata.tags,
          category: values.category || agent.metadata.category,
          difficulty: values.difficulty || agent.metadata.difficulty
        }
      };
      
      // TODO: 调用API保存
      // 临时保存到localStorage
      const existingAgents = JSON.parse(localStorage.getItem('agents_2_0') || '[]');
      const agentIndex = existingAgents.findIndex((a: Agent2_0) => a.id === updatedAgent.id);
      
      if (agentIndex >= 0) {
        existingAgents[agentIndex] = updatedAgent;
        message.success('Agent更新成功');
      } else {
        existingAgents.push(updatedAgent);
        message.success('Agent创建成功');
      }
      
      localStorage.setItem('agents_2_0', JSON.stringify(existingAgents));
      setSaveModalVisible(false);
      
      // 返回Agent管理页面
      navigate('/agent-manager');
      
    } catch (error) {
      message.error('保存失败，请检查配置');
      console.error('Save error:', error);
    }
  };
  
  /**
   * 验证Agent配置
   */
  const validateAgentConfig = (): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (!agent?.name || agent.name.trim() === '') {
      errors.push('Agent名称不能为空');
    }
    
    if (capabilities.length === 0) {
      errors.push('至少需要添加一个能力模块');
    }
    
    // 检查能力依赖
    capabilities.forEach(cap => {
      cap.dependencies.forEach(dep => {
        if (dep.type === 'required') {
          const depExists = capabilities.some(c => c.id === dep.capabilityId);
          if (!depExists) {
            errors.push(`能力"${cap.name}"缺少必需的依赖: ${dep.capabilityId}`);
          }
        }
      });
    });
    
    return {
      isValid: errors.length === 0,
      errors
    };
  };
  
  /**
   * 渲染基础配置面板
   */
  const renderBasicConfigPanel = () => {
    return (
      <div className="basic-config-panel">
        <Form 
          layout="vertical" 
          size="small"
          initialValues={{
            name: agent?.name || '',
            description: agent?.description || '',
            version: agent?.version || '1.0.0',
            status: agent?.status || AgentStatus.IDLE
          }}
          onValuesChange={(changedValues, allValues) => {
            if (agent) {
              setAgent({
                ...agent,
                ...allValues,
                metadata: {
                  ...agent.metadata,
                  updatedAt: new Date()
                }
              });
            }
          }}
        >
          <Form.Item 
            name="name" 
            label="Agent名称" 
            rules={[{ required: true, message: '请输入Agent名称' }]}
          >
            <Input placeholder="输入Agent名称" />
          </Form.Item>
          
          <Form.Item 
            name="description" 
            label="描述"
            rules={[{ required: true, message: '请输入描述' }]}
          >
            <TextArea rows={3} placeholder="描述Agent的功能和用途" />
          </Form.Item>
          
          <Form.Item name="version" label="版本">
            <Input placeholder="1.0.0" />
          </Form.Item>
          
          <Form.Item name="status" label="状态">
            <Select>
              <Option value={AgentStatus.IDLE}>空闲</Option>
              <Option value={AgentStatus.RUNNING}>运行中</Option>
              <Option value={AgentStatus.PAUSED}>暂停</Option>
              <Option value={AgentStatus.STOPPED}>已停止</Option>
              <Option value={AgentStatus.ERROR}>错误</Option>
            </Select>
          </Form.Item>
          
          <Divider orientation="left">元数据配置</Divider>
          
          <Form.Item name="category" label="分类">
            <Select placeholder="选择分类">
              <Option value="general">通用</Option>
              <Option value="business">业务</Option>
              <Option value="technical">技术</Option>
              <Option value="research">研究</Option>
            </Select>
          </Form.Item>
          
          <Form.Item name="difficulty" label="难度">
            <Radio.Group>
              <Radio value="beginner">初级</Radio>
              <Radio value="intermediate">中级</Radio>
              <Radio value="advanced">高级</Radio>
              <Radio value="expert">专家</Radio>
            </Radio.Group>
          </Form.Item>
          
          <Form.Item name="tags" label="标签">
            <Select mode="tags" placeholder="添加标签">
              <Option value="ai">AI</Option>
              <Option value="automation">自动化</Option>
              <Option value="analysis">分析</Option>
              <Option value="processing">处理</Option>
              <Option value="nlp">自然语言处理</Option>
              <Option value="vision">计算机视觉</Option>
              <Option value="recommendation">推荐系统</Option>
            </Select>
          </Form.Item>
          
          <Divider orientation="left">运行时配置</Divider>
          
          <Form.Item label="最大并发数">
            <InputNumber 
              min={1} 
              max={100} 
              defaultValue={10}
              style={{ width: '100%' }}
            />
          </Form.Item>
          
          <Form.Item label="超时时间(秒)">
            <InputNumber 
              min={1} 
              max={3600} 
              defaultValue={300}
              style={{ width: '100%' }}
            />
          </Form.Item>
          
          <Form.Item label="启用监控">
            <Switch defaultChecked />
          </Form.Item>
          
          <Form.Item label="启用日志">
            <Switch defaultChecked />
          </Form.Item>
        </Form>
      </div>
    );
  };
  
  /**
   * 渲染能力配置面板
   */
  const renderCapabilityPanel = () => {
    if (!selectedCapability) {
      return (
        <div className="empty-panel">
          <div className="empty-content">
            <BulbOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />
            <p>选择一个能力模块查看详细配置</p>
          </div>
        </div>
      );
    }
    
    return (
      <div className="capability-config-panel">
        <div className="panel-header">
          <div className="capability-title">
            {CAPABILITY_ICONS[selectedCapability.type]}
            <span>{selectedCapability.name}</span>
            <Tag color={CAPABILITY_COLORS[selectedCapability.type]}>
              {selectedCapability.type}
            </Tag>
          </div>
          <Button 
            type="text" 
            danger 
            icon={<DeleteOutlined />}
            onClick={() => handleRemoveCapability(selectedCapability.id)}
          >
            移除
          </Button>
        </div>
        
        <Collapse defaultActiveKey={['basic', 'config']} ghost>
          <Panel header="基本信息" key="basic">
            <div className="capability-basic-info">
              <p><strong>描述:</strong> {selectedCapability.description}</p>
              <p><strong>版本:</strong> {selectedCapability.version}</p>
              <p><strong>成熟度:</strong> 
                <Badge 
                  color={MATURITY_COLORS[selectedCapability.maturityLevel]} 
                  text={selectedCapability.maturityLevel}
                />
              </p>
              <p><strong>作者:</strong> {selectedCapability.author}</p>
              <div className="capability-tags">
                {selectedCapability.tags.map(tag => (
                  <Tag key={tag}>{tag}</Tag>
                ))}
              </div>
            </div>
          </Panel>
          
          <Panel header="执行配置" key="config">
            <Form layout="vertical" size="small">
              <Form.Item label="执行模式">
                <Select 
                  value={selectedCapability.config.executionMode}
                  onChange={(value) => {
                    // TODO: 更新能力配置
                  }}
                >
                  <Option value="sync">同步</Option>
                  <Option value="async">异步</Option>
                  <Option value="stream">流式</Option>
                </Select>
              </Form.Item>
              
              <Form.Item label="超时时间(ms)">
                <InputNumber 
                  value={selectedCapability.config.timeout}
                  min={1000}
                  max={300000}
                  step={1000}
                  onChange={(value) => {
                    // TODO: 更新能力配置
                  }}
                />
              </Form.Item>
              
              <Form.Item label="质量阈值">
                <Slider 
                  value={selectedCapability.config.qualityThreshold}
                  min={0}
                  max={1}
                  step={0.01}
                  marks={{ 0: '0', 0.5: '0.5', 1: '1' }}
                  onChange={(value) => {
                    // TODO: 更新能力配置
                  }}
                />
              </Form.Item>
              
              <Form.Item label="安全级别">
                <Radio.Group 
                  value={selectedCapability.config.securityLevel}
                  onChange={(e) => {
                    // TODO: 更新能力配置
                  }}
                >
                  <Radio value="low">低</Radio>
                  <Radio value="medium">中</Radio>
                  <Radio value="high">高</Radio>
                  <Radio value="critical">关键</Radio>
                </Radio.Group>
              </Form.Item>
            </Form>
          </Panel>
          
          <Panel header="性能指标" key="metrics">
            <div className="capability-metrics">
              <div className="metric-item">
                <span>平均响应时间:</span>
                <span>{selectedCapability.metrics.avgResponseTime}ms</span>
              </div>
              <div className="metric-item">
                <span>吞吐量:</span>
                <span>{selectedCapability.metrics.throughput}/s</span>
              </div>
              <div className="metric-item">
                <span>成功率:</span>
                <Progress 
                  percent={selectedCapability.metrics.successRate * 100} 
                  size="small" 
                  status={selectedCapability.metrics.successRate > 0.9 ? 'success' : 'normal'}
                />
              </div>
              <div className="metric-item">
                <span>准确率:</span>
                <Progress 
                  percent={selectedCapability.metrics.accuracy * 100} 
                  size="small" 
                  status={selectedCapability.metrics.accuracy > 0.9 ? 'success' : 'normal'}
                />
              </div>
            </div>
          </Panel>
          
          <Panel header="资源需求" key="resources">
            <div className="resource-requirements">
              {selectedCapability.resources.map((resource, index) => (
                <div key={index} className="resource-item">
                  <span className="resource-type">{resource.type.toUpperCase()}:</span>
                  <span className="resource-amount">{resource.amount} {resource.unit}</span>
                  <Tag color={resource.priority === 'high' ? 'red' : resource.priority === 'medium' ? 'orange' : 'green'}>
                    {resource.priority}
                  </Tag>
                </div>
              ))}
            </div>
          </Panel>
        </Collapse>
      </div>
    );
  };
  
  /**
   * 渲染能力库抽屉
   */
  const renderCapabilityDrawer = () => {
    return (
      <Drawer
        title="能力库"
        placement="right"
        width={600}
        open={capabilityDrawerVisible}
        onClose={() => setCapabilityDrawerVisible(false)}
      >
        <div className="capability-library">
          <div className="library-header">
            <Input.Search 
              placeholder="搜索能力模块..."
              style={{ marginBottom: 16 }}
            />
            <div className="filter-tabs">
              <Tabs defaultActiveKey="all" size="small">
                <TabPane tab="全部" key="all" />
                <TabPane tab="认知" key="cognitive" />
                <TabPane tab="推理" key="reasoning" />
                <TabPane tab="决策" key="decision" />
                <TabPane tab="学习" key="learning" />
              </Tabs>
            </div>
          </div>
          
          <div className="capability-list">
            {availableCapabilities.map(capability => (
              <Card 
                key={capability.id}
                size="small"
                className="capability-card"
                title={
                  <div className="card-title">
                    {CAPABILITY_ICONS[capability.type]}
                    <span>{capability.name}</span>
                    <Tag color={CAPABILITY_COLORS[capability.type]}>
                      {capability.type}
                    </Tag>
                  </div>
                }
                extra={
                  <Button 
                    type="primary" 
                    size="small"
                    icon={<PlusOutlined />}
                    onClick={() => handleAddCapability(capability)}
                  >
                    添加
                  </Button>
                }
              >
                <p className="capability-description">{capability.description}</p>
                <div className="capability-meta">
                  <Badge 
                    color={MATURITY_COLORS[capability.maturityLevel]} 
                    text={capability.maturityLevel}
                  />
                  <span className="version">v{capability.version}</span>
                  <span className="author">by {capability.author}</span>
                </div>
                <div className="capability-stats">
                  <span>成功率: {(capability.metrics.successRate * 100).toFixed(1)}%</span>
                  <span>使用次数: {capability.metrics.usageCount}</span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </Drawer>
    );
  };
  
  /**
   * 渲染保存对话框
   */
  const renderSaveModal = () => {
    return (
      <Modal
        title="保存Agent配置"
        open={saveModalVisible}
        onOk={handleSaveAgent}
        onCancel={() => setSaveModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item 
            name="name" 
            label="Agent名称" 
            rules={[{ required: true, message: '请输入Agent名称' }]}
          >
            <Input placeholder="输入Agent名称" />
          </Form.Item>
          
          <Form.Item 
            name="description" 
            label="描述"
            rules={[{ required: true, message: '请输入描述' }]}
          >
            <TextArea rows={3} placeholder="描述Agent的功能和用途" />
          </Form.Item>
          
          <Form.Item name="version" label="版本">
            <Input placeholder="1.0.0" />
          </Form.Item>
          
          <Form.Item name="category" label="分类">
            <Select placeholder="选择分类">
              <Option value="general">通用</Option>
              <Option value="business">业务</Option>
              <Option value="technical">技术</Option>
              <Option value="research">研究</Option>
            </Select>
          </Form.Item>
          
          <Form.Item name="difficulty" label="难度">
            <Radio.Group>
              <Radio value="beginner">初级</Radio>
              <Radio value="intermediate">中级</Radio>
              <Radio value="advanced">高级</Radio>
              <Radio value="expert">专家</Radio>
            </Radio.Group>
          </Form.Item>
          
          <Form.Item name="tags" label="标签">
            <Select mode="tags" placeholder="添加标签">
              <Option value="ai">AI</Option>
              <Option value="automation">自动化</Option>
              <Option value="analysis">分析</Option>
              <Option value="processing">处理</Option>
            </Select>
          </Form.Item>
        </Form>
        
        <Divider />
        
        <div className="save-summary">
          <h4>配置摘要</h4>
          <p>能力模块数量: {capabilities.length}</p>
          <p>编排模式: {orchestrator?.mode}</p>
          <p>知识图谱: {agent?.knowledgeGraph.enabled ? '启用' : '禁用'}</p>
          <p>学习功能: {agent?.learningConfig.enabled ? '启用' : '禁用'}</p>
        </div>
      </Modal>
    );
  };
  
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <div className="loading-spinner" />
          <p>正在初始化Agent设计器...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`agent-designer-2-0 ${darkMode ? 'dark' : 'light'}`} data-theme={darkMode ? 'dark' : 'light'}>
      {/* 顶部工具栏 */}
      <div className="designer-header">
        <div className="header-left">
          <Button 
            type="text" 
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/agent-manager')}
          >
            返回
          </Button>
          <Divider type="vertical" />
          <h2 className="designer-title">
            <BulbOutlined /> EFIAgent 2.0 设计器
          </h2>
          {agent?.name && (
            <Tag color="blue">{agent.name}</Tag>
          )}
        </div>
        
        <div className="header-right">
          <div className="toolbar-button-group">
            <Tooltip title="预览模式">
              <Switch 
                checked={previewMode}
                onChange={setPreviewMode}
                checkedChildren={<EyeOutlined />}
                unCheckedChildren={<SettingOutlined />}
                size="small"
              />
            </Tooltip>
            
            <Tooltip title="深色模式">
              <Switch 
                checked={darkMode}
                onChange={setDarkMode}
                checkedChildren={<MoonOutlined />}
                unCheckedChildren={<SunOutlined />}
                size="small"
              />
            </Tooltip>
          </div>
          
          <Space>
            <Tooltip title="AI助手">
              <Button 
                icon={<RobotOutlined />}
                onClick={() => setAiAssistantVisible(true)}
                className="fade-in"
              >
                AI助手
              </Button>
            </Tooltip>
            
            <Tooltip title="实时验证">
              <Button 
                icon={<CheckCircleOutlined />}
                onClick={() => setValidatorVisible(true)}
                className="fade-in"
              >
                验证
              </Button>
            </Tooltip>
            
            <Tooltip title="核心能力模块">
              <Button 
                icon={<ApiOutlined />}
                onClick={() => setCoreModulesVisible(true)}
                className="fade-in"
              >
                核心模块
              </Button>
            </Tooltip>
            
            <Button 
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setCapabilityDrawerVisible(true)}
              className="fade-in"
            >
              添加能力
            </Button>
            
            <Button 
              type="primary"
              icon={<SaveOutlined />}
              onClick={() => {
                const validation = validateAgentConfig();
                if (validation.isValid) {
                  setSaveModalVisible(true);
                } else {
                  Modal.error({
                    title: '配置验证失败',
                    content: (
                      <ul>
                        {validation.errors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    )
                  });
                }
              }}
              className="fade-in"
            >
              保存
            </Button>
          </Space>
        </div>
      </div>
      
      {/* 主要内容区域 */}
      <div className="designer-content">
        <div className="content-left">
          {/* 能力流程图 */}
          <div className="flow-container">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onSelectionChange={(params: OnSelectionChangeParams) => {
                if (params.nodes.length > 0) {
                  const selectedNode = params.nodes[0];
                  const capability = selectedNode.data?.capability;
                  if (capability) {
                    setSelectedCapability(capability);
                  }
                }
              }}
              fitView
              attributionPosition="bottom-left"
            >
              <Background />
              <Controls />
              <MiniMap 
                nodeColor={(node) => {
                  const capability = node.data?.capability;
                  return capability ? CAPABILITY_COLORS[capability.type as CoreCapabilityType] : '#ddd';
                }}
              />
            </ReactFlow>
          </div>
        </div>
        
        <div className="content-right">
          {/* 配置面板 */}
          <div className="config-panel">
            <Tabs 
              activeKey={activeTab} 
              onChange={setActiveTab}
              items={[
                {
                  key: 'basic',
                  label: (
                    <span>
                      <SettingOutlined />
                      基础配置
                    </span>
                  ),
                  children: renderBasicConfigPanel()
                },
                {
                  key: 'capabilities',
                  label: (
                    <span>
                      <BulbOutlined />
                      能力配置
                    </span>
                  ),
                  children: renderCapabilityPanel()
                },
                {
                  key: 'orchestration',
                  label: (
                    <span>
                      <ThunderboltOutlined />
                      编排配置
                    </span>
                  ),
                  children: (
                    <div className="orchestration-panel">
                      <p>编排器配置面板</p>
                      {/* TODO: 实现编排器配置界面 */}
                    </div>
                  )
                },
                {
                  key: 'knowledge',
                  label: (
                    <span>
                      <DatabaseOutlined />
                      知识图谱
                    </span>
                  ),
                  children: (
                    <div className="knowledge-panel">
                      <p>知识图谱配置面板</p>
                      {/* TODO: 实现知识图谱配置界面 */}
                    </div>
                  )
                },
                {
                  key: 'learning',
                  label: (
                    <span>
                      <BookOutlined />
                      学习配置
                    </span>
                  ),
                  children: (
                    <div className="learning-panel">
                      <p>学习配置面板</p>
                      {/* TODO: 实现学习配置界面 */}
                    </div>
                  )
                },
                {
                  key: 'deployment',
                  label: (
                    <span>
                      <CloudOutlined />
                      部署配置
                    </span>
                  ),
                  children: (
                    <div className="deployment-panel">
                      <p>部署配置面板</p>
                      {/* TODO: 实现部署配置界面 */}
                    </div>
                  )
                }
              ]}
            />
          </div>
        </div>
      </div>
      
      {/* 能力库抽屉 */}
      {renderCapabilityDrawer()}
      
      {/* 保存对话框 */}
      {renderSaveModal()}
      
      {/* AI助手 */}
      <AIAssistant
        visible={aiAssistantVisible}
        onClose={() => setAiAssistantVisible(false)}
        agent={agent}
        capabilities={capabilities}
        onApplyRecommendation={(recommendation) => {
          // 应用AI推荐
          if (recommendation.type === 'capability') {
            setCapabilities(prev => [...prev, recommendation.capability]);
          } else if (recommendation.type === 'template') {
            setAgent(recommendation.agent);
            setCapabilities(recommendation.capabilities);
          }
          message.success('已应用AI推荐');
        }}
      />
      
      {/* 实时验证器 */}
      <RealTimeValidator
        visible={validatorVisible}
        onClose={() => setValidatorVisible(false)}
        agent={agent}
        capabilities={capabilities}
        orchestrator={orchestrator}
        onValidationComplete={(result) => {
          if (result.isValid) {
            message.success('验证通过');
          } else {
            message.warning(`发现 ${result.issues.length} 个问题`);
          }
        }}
      />
      
      {/* 核心能力模块 */}
      <CoreCapabilityModules
        visible={coreModulesVisible}
        onClose={() => setCoreModulesVisible(false)}
        onCapabilitySelect={(capability) => {
          setCapabilities(prev => [...prev, capability]);
          message.success('核心能力模块已添加');
        }}
        selectedCapabilities={capabilities}
      />
    </div>
  );
};

export default AgentDesigner2_0;