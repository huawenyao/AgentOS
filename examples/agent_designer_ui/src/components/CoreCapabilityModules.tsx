/**
 * 核心能力模块实现
 * 提供五层架构中能力来源层的具体实现
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Card, List, Tag, Button, Modal, Form, Input, Select, Switch,
  Tabs, Space, Tooltip, Progress, Alert, Divider, Badge,
  Collapse, Tree, Table, Upload, message, Spin
} from 'antd';
import {
  ApiOutlined, BulbOutlined, DatabaseOutlined, CloudOutlined,
  RobotOutlined, SettingOutlined, PlayCircleOutlined, PauseCircleOutlined,
  ReloadOutlined, DeleteOutlined, EditOutlined, PlusOutlined,
  DownloadOutlined, UploadOutlined, EyeOutlined, BugOutlined,
  ThunderboltOutlined, SafetyCertificateOutlined, MonitorOutlined
} from '@ant-design/icons';
import {
  CoreCapabilityModule, CapabilitySource, CapabilitySourceType, CapabilityCategory,
  CoreCapabilityType, CapabilityMaturityLevel
} from './CapabilitySystemTypes';

const { TabPane } = Tabs;
const { Panel } = Collapse;
const { Option } = Select;
const { TextArea } = Input;

interface CoreCapabilityModulesProps {
  visible: boolean;
  onClose: () => void;
  onCapabilitySelect: (capability: CoreCapabilityModule) => void;
  selectedCapabilities: CoreCapabilityModule[];
}

interface LLMProvider {
  id: string;
  name: string;
  type: 'openai' | 'anthropic' | 'google' | 'local' | 'custom';
  models: Array<{
    id: string;
    name: string;
    description: string;
    capabilities: string[];
    pricing?: {
      input: number;
      output: number;
      unit: string;
    };
  }>;
  config: {
    apiKey?: string;
    endpoint?: string;
    region?: string;
    version?: string;
  };
  status: 'connected' | 'disconnected' | 'error';
}

interface KnowledgeGraph {
  id: string;
  name: string;
  type: 'neo4j' | 'rdf' | 'property' | 'document';
  entities: number;
  relationships: number;
  config: {
    endpoint: string;
    database?: string;
    username?: string;
    password?: string;
  };
  status: 'connected' | 'disconnected' | 'syncing';
  lastSync?: Date;
}

interface ToolIntegration {
  id: string;
  name: string;
  type: 'api' | 'webhook' | 'rpc' | 'database' | 'file';
  description: string;
  config: {
    endpoint?: string;
    method?: string;
    headers?: Record<string, string>;
    authentication?: {
      type: 'none' | 'basic' | 'bearer' | 'oauth';
      credentials?: any;
    };
  };
  schema: {
    input: any;
    output: any;
  };
  status: 'active' | 'inactive' | 'error';
  metrics: {
    calls: number;
    successRate: number;
    avgResponseTime: number;
  };
}

const CoreCapabilityModules: React.FC<CoreCapabilityModulesProps> = ({
  visible,
  onClose,
  onCapabilitySelect,
  selectedCapabilities
}) => {
  const [activeTab, setActiveTab] = useState('llm');
  const [loading, setLoading] = useState(false);
  
  // LLM提供商状态
  const [llmProviders, setLlmProviders] = useState<LLMProvider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<LLMProvider | null>(null);
  const [providerModalVisible, setProviderModalVisible] = useState(false);
  
  // 知识图谱状态
  const [knowledgeGraphs, setKnowledgeGraphs] = useState<KnowledgeGraph[]>([]);
  const [selectedKG, setSelectedKG] = useState<KnowledgeGraph | null>(null);
  const [kgModalVisible, setKgModalVisible] = useState(false);
  
  // 工具集成状态
  const [toolIntegrations, setToolIntegrations] = useState<ToolIntegration[]>([]);
  const [selectedTool, setSelectedTool] = useState<ToolIntegration | null>(null);
  const [toolModalVisible, setToolModalVisible] = useState(false);
  
  // 表单实例
  const [providerForm] = Form.useForm();
  const [kgForm] = Form.useForm();
  const [toolForm] = Form.useForm();

  /**
   * 创建LLM能力
   */
  const createLLMCapability = (provider: LLMProvider, model: any): CoreCapabilityModule => {
    return {
      id: `llm_${provider.id}_${model.id}`,
      name: `${provider.name} ${model.name}`,
      description: model.description,
      type: CoreCapabilityType.COGNITIVE,
      subType: 'understanding' as any,
      version: '1.0.0',
      maturityLevel: CapabilityMaturityLevel.MANAGED,
      source: CapabilitySource.CUSTOM,
      category: CapabilityCategory.NLP,
      config: {
        executionMode: 'async' as const,
        timeout: 30000,
        retryPolicy: {
          maxRetries: 3,
          backoffStrategy: 'exponential' as const,
          initialDelay: 1000,
          maxDelay: 10000,
          retryableErrors: ['TIMEOUT', 'CONNECTION_ERROR']
        },
        qualityThreshold: 0.8,
        performanceTarget: {
          responseTime: 5000,
          throughput: 100,
          accuracy: 0.9,
          availability: 0.99
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
          },
          healthCheck: {
            enabled: true,
            interval: 60,
            timeout: 10,
            failureThreshold: 3,
            successThreshold: 1
          }
        },
        parameters: {}
      },
      inputs: [
        {
          id: 'prompt',
          name: 'Prompt',
          description: 'Input prompt for the model',
          dataType: 'string',
          required: true,
          validation: {
            type: 'string',
            minLength: 1
          },
          examples: ['Hello, how are you?']
        },
        {
          id: 'temperature',
          name: 'Temperature',
          description: 'Sampling temperature',
          dataType: 'number',
          required: false,
          validation: {
            type: 'number',
            min: 0,
            max: 2
          },
          defaultValue: 0.7,
          examples: [0.7]
        },
        {
          id: 'maxTokens',
          name: 'Max Tokens',
          description: 'Maximum number of tokens to generate',
          dataType: 'number',
          required: false,
          validation: {
            type: 'number',
            min: 1
          },
          defaultValue: 1000,
          examples: [1000]
        }
      ],
      outputs: [
        {
          id: 'response',
          name: 'Response',
          description: 'Generated response from the model',
          dataType: 'string',
          schema: {
            type: 'string'
          },
          examples: ['Hello! I am doing well, thank you for asking.']
        },
        {
          id: 'usage',
          name: 'Usage Statistics',
          description: 'Token usage information',
          dataType: 'object',
          schema: {
            type: 'object',
            properties: {
              promptTokens: { type: 'number' },
              completionTokens: { type: 'number' },
              totalTokens: { type: 'number' }
            }
          },
          examples: [{ promptTokens: 10, completionTokens: 20, totalTokens: 30 }]
        }
      ],
      dependencies: [],
      metrics: {
        avgResponseTime: 0,
        throughput: 0,
        successRate: 0,
        errorRate: 0,
        accuracy: 0,
        precision: 0,
        recall: 0,
        f1Score: 0,
        usageCount: 0,
        activeUsers: 0,
        avgCpuUsage: 0,
        avgMemoryUsage: 0,
        avgTokenUsage: 0,
        lastUpdated: new Date()
      },
      resources: [],
      sources: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      author: 'System',
      tags: ['llm', provider.type, model.name],
      metadata: {
        author: 'System',
        organization: 'EFIAgent',
        license: 'MIT',
        category: 'nlp',
        difficulty: 'beginner' as const,
        rating: 0,
        downloads: 0,
        featured: false,
        verified: false,
        documentation: `LLM capability powered by ${provider.name} ${model.name}`,
        examples: [
          {
            name: 'Basic Text Generation',
            description: 'Generate text using LLM',
            input: { prompt: 'Hello, world!' },
            output: { response: 'Hello! How can I help you today?' },
            code: '// Example usage code'
          }
        ],
        changelog: [],
        tags: ['llm', provider.type, model.name],
        implementation: {
          language: 'typescript',
          framework: 'react',
          dependencies: [],
          resources: {
            cpu: '500m',
            memory: '512Mi'
          }
        }
      }
    };
  };

  /**
   * 创建知识图谱能力
   */
  const createKGCapability = (kg: KnowledgeGraph): CoreCapabilityModule => {
    return {
      id: `kg_${kg.id}`,
      name: `${kg.name} Knowledge Graph`,
      description: `Knowledge graph capability using ${kg.name}`,
      type: CoreCapabilityType.COGNITIVE,
      subType: 'understanding' as any,
      version: '1.0.0',
      maturityLevel: CapabilityMaturityLevel.MANAGED,
      source: CapabilitySource.CUSTOM,
      category: CapabilityCategory.KNOWLEDGE_GRAPH,
      config: {
        executionMode: 'async' as const,
        timeout: 30000,
        retryPolicy: {
          maxRetries: 3,
          backoffStrategy: 'exponential' as const,
          initialDelay: 1000,
          maxDelay: 10000,
          retryableErrors: ['TIMEOUT', 'CONNECTION_ERROR']
        },
        qualityThreshold: 0.8,
        performanceTarget: {
          responseTime: 5000,
          throughput: 100,
          accuracy: 0.9,
          availability: 0.99
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
          },
          healthCheck: {
            enabled: true,
            interval: 60,
            timeout: 10,
            failureThreshold: 3,
            successThreshold: 1
          }
        },
        parameters: {}
      },
      inputs: [
        {
          id: 'query',
          name: 'Query',
          description: 'Knowledge graph query',
          dataType: 'string',
          required: true,
          validation: {
            type: 'string',
            minLength: 1
          },
          examples: ['Find all entities related to AI']
        },
        {
          id: 'entityType',
          name: 'Entity Type',
          description: 'Type of entities to search for',
          dataType: 'string',
          required: false,
          validation: {
            type: 'string'
          },
          examples: ['Person', 'Organization', 'Technology']
        },
        {
          id: 'limit',
          name: 'Result Limit',
          description: 'Maximum number of results to return',
          dataType: 'number',
          required: false,
          validation: {
            type: 'number',
            min: 1,
            max: 1000
          },
          defaultValue: 100,
          examples: [100]
        }
      ],
      outputs: [
        {
          id: 'entities',
          name: 'Entities',
          description: 'Found entities from knowledge graph',
          dataType: 'array',
          schema: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                type: { type: 'string' },
                properties: { type: 'object' },
                relationships: { type: 'array' }
              }
            }
          },
          examples: [[{ id: '1', type: 'Person', properties: { name: 'John' }, relationships: [] }]]
        },
        {
          id: 'metadata',
          name: 'Query Metadata',
          description: 'Query execution metadata',
          dataType: 'object',
          schema: {
            type: 'object',
            properties: {
              totalResults: { type: 'number' },
              queryTime: { type: 'number' }
            }
          },
          examples: [{ totalResults: 10, queryTime: 150 }]
        }
      ],
      dependencies: [],
      metrics: {
        avgResponseTime: 0,
        throughput: 0,
        successRate: 0,
        errorRate: 0,
        accuracy: 0,
        precision: 0,
        recall: 0,
        f1Score: 0,
        usageCount: 0,
        activeUsers: 0,
        avgCpuUsage: 0,
        avgMemoryUsage: 0,
        avgTokenUsage: 0,
        lastUpdated: new Date()
      },
      resources: [],
      sources: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      author: 'System',
      tags: ['knowledge-graph', kg.type, 'query'],
      metadata: {
        author: 'System',
        organization: 'EFIAgent',
        license: 'MIT',
        category: 'knowledge-graph',
        difficulty: 'beginner' as const,
        rating: 0,
        downloads: 0,
        featured: false,
        verified: false,
        documentation: `Knowledge graph capability for ${kg.name}`,
        examples: [
          {
            name: 'Entity Search',
            description: 'Search for entities in knowledge graph',
            input: { query: 'person', limit: 10 },
            output: { entities: [], metadata: { totalResults: 0, queryTime: 100 } },
            code: '// Example usage code'
          }
        ],
        changelog: [],
        tags: ['knowledge-graph', kg.type, 'query'],
        implementation: {
          language: 'typescript',
          framework: 'react',
          dependencies: [],
          resources: {
            cpu: '200m',
            memory: '256Mi'
          }
        }
      }
    };
  };

  /**
   * 创建工具能力
   */
  const createToolCapability = (tool: ToolIntegration): CoreCapabilityModule => {
    return {
      id: `tool_${tool.id}`,
      name: `${tool.name} Integration`,
      description: tool.description,
      type: CoreCapabilityType.COGNITIVE,
      subType: 'integration' as any,
      version: '1.0.0',
      maturityLevel: CapabilityMaturityLevel.MANAGED,
      source: CapabilitySource.CUSTOM,
      category: CapabilityCategory.OTHER,
      config: {
        executionMode: 'async' as const,
        timeout: 30000,
        retryPolicy: {
          maxRetries: 3,
          backoffStrategy: 'exponential' as const,
          initialDelay: 1000,
          maxDelay: 10000,
          retryableErrors: ['TIMEOUT', 'CONNECTION_ERROR']
        },
        qualityThreshold: 0.8,
        performanceTarget: {
          responseTime: 5000,
          throughput: 100,
          accuracy: 0.9,
          availability: 0.99
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
          },
          healthCheck: {
            enabled: true,
            interval: 60,
            timeout: 10,
            failureThreshold: 3,
            successThreshold: 1
          }
        },
        parameters: {}
      },
      inputs: [
        {
          id: 'toolInput',
          name: 'Tool Input',
          description: `Input data for ${tool.name}`,
          dataType: 'object',
          required: true,
          validation: {
            type: 'object'
          },
          examples: [{}]
        }
      ],
      outputs: [
        {
          id: 'toolOutput',
          name: 'Tool Output',
          description: `Output data from ${tool.name}`,
          dataType: 'object',
          schema: tool.schema.output,
          examples: [{}]
        }
      ],
      dependencies: [],
      metrics: {
        avgResponseTime: 0,
        throughput: 0,
        successRate: 0,
        errorRate: 0,
        accuracy: 0,
        precision: 0,
        recall: 0,
        f1Score: 0,
        usageCount: 0,
        activeUsers: 0,
        avgCpuUsage: 0,
        avgMemoryUsage: 0,
        avgTokenUsage: 0,
        lastUpdated: new Date()
      },
      resources: [],
      sources: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      author: 'System',
      tags: ['tool', tool.type, 'integration'],
      metadata: {
        author: 'System',
        organization: 'EFIAgent',
        license: 'MIT',
        category: 'integration',
        difficulty: 'beginner' as const,
        rating: 0,
        downloads: 0,
        featured: false,
        verified: false,
        documentation: `Tool integration for ${tool.name}`,
        examples: [
          {
            name: 'Basic Usage',
            description: 'Basic tool integration example',
            input: {},
            output: {},
            code: '// Example usage code'
          }
        ],
        changelog: [],
        tags: ['tool', tool.type, 'integration'],
        implementation: {
          language: 'typescript',
          framework: 'react',
          dependencies: [],
          resources: {
            cpu: '100m',
            memory: '128Mi'
          }
        }
      }
    };
  };

  useEffect(() => {
    if (visible) {
      loadCapabilitySources();
    }
  }, [visible]);

  /**
   * 加载能力来源
   */
  const loadCapabilitySources = async () => {
    setLoading(true);
    try {
      // 模拟加载LLM提供商
      const mockLLMProviders: LLMProvider[] = [
        {
          id: 'openai',
          name: 'OpenAI',
          type: 'openai',
          models: [
            {
              id: 'gpt-4',
              name: 'GPT-4',
              description: '最先进的大语言模型，支持复杂推理和多模态理解',
              capabilities: ['text-generation', 'reasoning', 'code-generation', 'multimodal'],
              pricing: { input: 0.03, output: 0.06, unit: '1K tokens' }
            },
            {
              id: 'gpt-3.5-turbo',
              name: 'GPT-3.5 Turbo',
              description: '高效的对话模型，适合大多数应用场景',
              capabilities: ['text-generation', 'conversation', 'code-generation'],
              pricing: { input: 0.001, output: 0.002, unit: '1K tokens' }
            }
          ],
          config: {
            apiKey: process.env.REACT_APP_OPENAI_API_KEY,
            endpoint: 'https://api.openai.com/v1'
          },
          status: 'connected'
        },
        {
          id: 'anthropic',
          name: 'Anthropic',
          type: 'anthropic',
          models: [
            {
              id: 'claude-3',
              name: 'Claude 3',
              description: '安全可靠的AI助手，擅长分析和推理',
              capabilities: ['text-generation', 'analysis', 'reasoning', 'safety'],
              pricing: { input: 0.015, output: 0.075, unit: '1K tokens' }
            }
          ],
          config: {
            apiKey: process.env.REACT_APP_ANTHROPIC_API_KEY,
            endpoint: 'https://api.anthropic.com'
          },
          status: 'disconnected'
        }
      ];

      // 模拟加载知识图谱
      const mockKnowledgeGraphs: KnowledgeGraph[] = [
        {
          id: 'enterprise-kg',
          name: '企业知识图谱',
          type: 'neo4j',
          entities: 125000,
          relationships: 450000,
          config: {
            endpoint: 'bolt://localhost:7687',
            database: 'enterprise',
            username: 'neo4j'
          },
          status: 'connected',
          lastSync: new Date(Date.now() - 3600000)
        },
        {
          id: 'domain-kg',
          name: '领域知识图谱',
          type: 'rdf',
          entities: 50000,
          relationships: 180000,
          config: {
            endpoint: 'http://localhost:3030/domain'
          },
          status: 'syncing'
        }
      ];

      // 模拟加载工具集成
      const mockToolIntegrations: ToolIntegration[] = [
        {
          id: 'weather-api',
          name: '天气查询API',
          type: 'api',
          description: '获取实时天气信息和预报',
          config: {
            endpoint: 'https://api.openweathermap.org/data/2.5',
            method: 'GET',
            authentication: {
              type: 'bearer',
              credentials: { token: 'your-api-key' }
            }
          },
          schema: {
            input: {
              type: 'object',
              properties: {
                city: { type: 'string', description: '城市名称' },
                country: { type: 'string', description: '国家代码' }
              },
              required: ['city']
            },
            output: {
              type: 'object',
              properties: {
                temperature: { type: 'number' },
                humidity: { type: 'number' },
                description: { type: 'string' }
              }
            }
          },
          status: 'active',
          metrics: {
            calls: 1250,
            successRate: 98.5,
            avgResponseTime: 245
          }
        },
        {
          id: 'database-query',
          name: '数据库查询',
          type: 'database',
          description: '执行SQL查询获取业务数据',
          config: {
            endpoint: 'postgresql://localhost:5432/business',
            authentication: {
              type: 'basic',
              credentials: { username: 'user', password: 'pass' }
            }
          },
          schema: {
            input: {
              type: 'object',
              properties: {
                query: { type: 'string', description: 'SQL查询语句' },
                params: { type: 'array', description: '查询参数' }
              },
              required: ['query']
            },
            output: {
              type: 'object',
              properties: {
                rows: { type: 'array' },
                count: { type: 'number' }
              }
            }
          },
          status: 'active',
          metrics: {
            calls: 850,
            successRate: 99.2,
            avgResponseTime: 120
          }
        }
      ];

      setLlmProviders(mockLLMProviders);
      setKnowledgeGraphs(mockKnowledgeGraphs);
      setToolIntegrations(mockToolIntegrations);
    } catch (error) {
      message.error('加载能力来源失败');
    } finally {
      setLoading(false);
    }
  };



  /**
   * 创建知识图谱能力
   */


  /**
   * 创建工具集成能力
   */


  /**
   * 测试连接
   */
  const testConnection = async (type: 'llm' | 'kg' | 'tool', item: any) => {
    setLoading(true);
    try {
      // 模拟测试连接
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (type === 'llm') {
        const updatedProviders = llmProviders.map(p => 
          p.id === item.id ? { ...p, status: 'connected' as const } : p
        );
        setLlmProviders(updatedProviders);
      } else if (type === 'kg') {
        const updatedKGs = knowledgeGraphs.map(kg => 
          kg.id === item.id ? { ...kg, status: 'connected' as const } : kg
        );
        setKnowledgeGraphs(updatedKGs);
      } else {
        const updatedTools = toolIntegrations.map(t => 
          t.id === item.id ? { ...t, status: 'active' as const } : t
        );
        setToolIntegrations(updatedTools);
      }
      
      message.success('连接测试成功');
    } catch (error) {
      message.error('连接测试失败');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 渲染LLM提供商
   */
  const renderLLMProviders = () => (
    <div className="llm-providers">
      <div className="providers-header">
        <Space>
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => setProviderModalVisible(true)}
          >
            添加提供商
          </Button>
          <Button icon={<ReloadOutlined />} onClick={loadCapabilitySources}>
            刷新
          </Button>
        </Space>
      </div>
      
      <List
        dataSource={llmProviders}
        renderItem={(provider) => (
          <List.Item
            actions={[
              <Button 
                 
                icon={<PlayCircleOutlined />}
                onClick={() => testConnection('llm', provider)}
              >
                测试连接
              </Button>,
              <Button 
                 
                icon={<SettingOutlined />}
                onClick={() => {
                  setSelectedProvider(provider);
                  setProviderModalVisible(true);
                }}
              >
                配置
              </Button>
            ]}
          >
            <List.Item.Meta
              avatar={
                <Badge 
                  status={provider.status === 'connected' ? 'success' : 'error'} 
                  dot
                >
                  <BulbOutlined style={{ fontSize: 24 }} />
                </Badge>
              }
              title={
                <Space>
                  <span>{provider.name}</span>
                  <Tag color={provider.status === 'connected' ? 'green' : 'red'}>
                    {provider.status}
                  </Tag>
                </Space>
              }
              description={
                <div>
                  <p>支持 {provider.models.length} 个模型</p>
                  <Collapse >
                    <Panel header="模型列表" key="models">
                      {provider.models.map(model => (
                        <div key={model.id} className="model-item">
                          <div className="model-header">
                            <Space>
                              <strong>{model.name}</strong>
                              <Button 
                                 
                                type="link"
                                onClick={() => {
                                  const capability = createLLMCapability(provider, model);
                                  onCapabilitySelect(capability);
                                  message.success(`已添加能力: ${capability?.name || '未知能力'}`);
                                }}
                              >
                                添加能力
                              </Button>
                            </Space>
                          </div>
                          <p className="model-description">{model.description}</p>
                          <div className="model-capabilities">
                            {model.capabilities.map(cap => (
                              <Tag key={cap}>{cap}</Tag>
                            ))}
                          </div>
                          {model.pricing && (
                            <div className="model-pricing">
                              <small>
                                输入: ${model.pricing.input}/{model.pricing.unit} | 
                                输出: ${model.pricing.output}/{model.pricing.unit}
                              </small>
                            </div>
                          )}
                        </div>
                      ))}
                    </Panel>
                  </Collapse>
                </div>
              }
            />
          </List.Item>
        )}
      />
    </div>
  );

  /**
   * 渲染知识图谱
   */
  const renderKnowledgeGraphs = () => (
    <div className="knowledge-graphs">
      <div className="kg-header">
        <Space>
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => setKgModalVisible(true)}
          >
            添加知识图谱
          </Button>
          <Button icon={<ReloadOutlined />} onClick={loadCapabilitySources}>
            刷新
          </Button>
        </Space>
      </div>
      
      <List
        dataSource={knowledgeGraphs}
        renderItem={(kg) => (
          <List.Item
            actions={[
              <Button 
                 
                icon={<PlayCircleOutlined />}
                onClick={() => testConnection('kg', kg)}
              >
                测试连接
              </Button>,
              <Button 
                 
                icon={<ThunderboltOutlined />}
                onClick={() => {
                  const capability = createKGCapability(kg);
                  onCapabilitySelect(capability);
                  message.success(`已添加能力: ${capability?.name || '未知能力'}`);
                }}
              >
                创建能力
              </Button>,
              <Button 
                 
                icon={<SettingOutlined />}
                onClick={() => {
                  setSelectedKG(kg);
                  setKgModalVisible(true);
                }}
              >
                配置
              </Button>
            ]}
          >
            <List.Item.Meta
              avatar={
                <Badge 
                  status={kg.status === 'connected' ? 'success' : kg.status === 'syncing' ? 'processing' : 'error'} 
                  dot
                >
                  <DatabaseOutlined style={{ fontSize: 24 }} />
                </Badge>
              }
              title={
                <Space>
                  <span>{kg.name}</span>
                  <Tag color={kg.status === 'connected' ? 'green' : kg.status === 'syncing' ? 'blue' : 'red'}>
                    {kg.status}
                  </Tag>
                  <Tag>{kg.type}</Tag>
                </Space>
              }
              description={
                <div>
                  <div className="kg-stats">
                    <Space>
                      <span>实体: {kg.entities.toLocaleString()}</span>
                      <span>关系: {kg.relationships.toLocaleString()}</span>
                    </Space>
                  </div>
                  {kg.lastSync && (
                    <div className="kg-sync">
                      <small>最后同步: {kg.lastSync.toLocaleString()}</small>
                    </div>
                  )}
                  <div className="kg-endpoint">
                    <small>端点: {kg.config.endpoint}</small>
                  </div>
                </div>
              }
            />
          </List.Item>
        )}
      />
    </div>
  );

  /**
   * 渲染工具集成
   */
  const renderToolIntegrations = () => (
    <div className="tool-integrations">
      <div className="tools-header">
        <Space>
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => setToolModalVisible(true)}
          >
            添加工具
          </Button>
          <Button icon={<ReloadOutlined />} onClick={loadCapabilitySources}>
            刷新
          </Button>
        </Space>
      </div>
      
      <List
        dataSource={toolIntegrations}
        renderItem={(tool: ToolIntegration) => (
          <List.Item
            actions={[
              <Button 
                 
                icon={<BugOutlined />}
                onClick={() => testConnection('tool', tool)}
              >
                测试
              </Button>,
              <Button 
                 
                icon={<ThunderboltOutlined />}
                onClick={() => {
                  const capability = createToolCapability(tool);
                  onCapabilitySelect(capability);
                  message.success(`已添加能力: ${capability?.name || '未知能力'}`);
                }}
              >
                创建能力
              </Button>,
              <Button 
                 
                icon={<MonitorOutlined />}
                onClick={() => {
                  Modal.info({
                    title: '工具指标',
                    content: (
                      <div>
                        <p>调用次数: {tool.metrics.calls}</p>
                        <p>成功率: {tool.metrics?.successRate || 0}%</p>
                        <p>平均响应时间: {tool.metrics.avgResponseTime}ms</p>
                      </div>
                    )
                  });
                }}
              >
                指标
              </Button>
            ]}
          >
            <List.Item.Meta
              avatar={
                <Badge 
                  status={tool.status === 'active' ? 'success' : 'error'} 
                  dot
                >
                  <ApiOutlined style={{ fontSize: 24 }} />
                </Badge>
              }
              title={
                <Space>
                  <span>{tool.name}</span>
                  <Tag color={tool.status === 'active' ? 'green' : 'red'}>
                    {tool.status}
                  </Tag>
                  <Tag>{tool.type}</Tag>
                </Space>
              }
              description={
                <div>
                  <p>{tool.description}</p>
                  <div className="tool-metrics">
                    <Space>
                      <span>调用: {tool.metrics.calls}</span>
                      <span>成功率: {tool.metrics?.successRate || 0}%</span>
                      <span>响应时间: {tool.metrics.avgResponseTime}ms</span>
                    </Space>
                  </div>
                  <div className="tool-endpoint">
                    <small>端点: {tool.config.endpoint}</small>
                  </div>
                </div>
              }
            />
          </List.Item>
        )}
      />
    </div>
  );

  return (
    <Modal
      title="核心能力模块"
      open={visible}
      onCancel={onClose}
      footer={null}
      width={1000}
      className="core-capability-modules-modal"
    >
      <div className="capability-modules-content">
        <Alert
          message="能力来源层"
          description="管理和配置Agent的核心能力来源，包括大语言模型、知识图谱和外部工具集成。"
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
        
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane 
            tab={
              <Space>
                <BulbOutlined />
                <span>大语言模型</span>
                <Badge count={llmProviders.length}  />
              </Space>
            } 
            key="llm"
          >
            {loading ? <Spin size="large" /> : renderLLMProviders()}
          </TabPane>
          
          <TabPane 
            tab={
              <Space>
                <DatabaseOutlined />
                <span>知识图谱</span>
                <Badge count={knowledgeGraphs.length}  />
              </Space>
            } 
            key="kg"
          >
            {loading ? <Spin size="large" /> : renderKnowledgeGraphs()}
          </TabPane>
          
          <TabPane 
            tab={
              <Space>
                <ApiOutlined />
                <span>工具集成</span>
                <Badge count={toolIntegrations.length}  />
              </Space>
            } 
            key="tools"
          >
            {loading ? <Spin size="large" /> : renderToolIntegrations()}
          </TabPane>
        </Tabs>
      </div>

      {/* LLM提供商配置模态框 */}
      <Modal
        title={selectedProvider ? '编辑LLM提供商' : '添加LLM提供商'}
        open={providerModalVisible}
        onCancel={() => {
          setProviderModalVisible(false);
          setSelectedProvider(null);
          providerForm.resetFields();
        }}
        onOk={() => {
          providerForm.validateFields().then(values => {
            // 处理提供商配置
            message.success('LLM提供商配置成功');
            setProviderModalVisible(false);
            setSelectedProvider(null);
            providerForm.resetFields();
          });
        }}
      >
        <Form form={providerForm} layout="vertical">
          <Form.Item name="name" label="提供商名称" rules={[{ required: true }]}>
            <Input placeholder="输入提供商名称" />
          </Form.Item>
          <Form.Item name="type" label="提供商类型" rules={[{ required: true }]}>
            <Select placeholder="选择提供商类型">
              <Option value="openai">OpenAI</Option>
              <Option value="anthropic">Anthropic</Option>
              <Option value="google">Google</Option>
              <Option value="local">本地部署</Option>
              <Option value="custom">自定义</Option>
            </Select>
          </Form.Item>
          <Form.Item name="endpoint" label="API端点" rules={[{ required: true }]}>
            <Input placeholder="输入API端点URL" />
          </Form.Item>
          <Form.Item name="apiKey" label="API密钥">
            <Input.Password placeholder="输入API密钥" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 知识图谱配置模态框 */}
      <Modal
        title={selectedKG ? '编辑知识图谱' : '添加知识图谱'}
        open={kgModalVisible}
        onCancel={() => {
          setKgModalVisible(false);
          setSelectedKG(null);
          kgForm.resetFields();
        }}
        onOk={() => {
          kgForm.validateFields().then(values => {
            // 处理知识图谱配置
            message.success('知识图谱配置成功');
            setKgModalVisible(false);
            setSelectedKG(null);
            kgForm.resetFields();
          });
        }}
      >
        <Form form={kgForm} layout="vertical">
          <Form.Item name="name" label="知识图谱名称" rules={[{ required: true }]}>
            <Input placeholder="输入知识图谱名称" />
          </Form.Item>
          <Form.Item name="type" label="图谱类型" rules={[{ required: true }]}>
            <Select placeholder="选择图谱类型">
              <Option value="neo4j">Neo4j</Option>
              <Option value="rdf">RDF</Option>
              <Option value="property">属性图</Option>
              <Option value="document">文档图</Option>
            </Select>
          </Form.Item>
          <Form.Item name="endpoint" label="连接端点" rules={[{ required: true }]}>
            <Input placeholder="输入连接端点" />
          </Form.Item>
          <Form.Item name="database" label="数据库名称">
            <Input placeholder="输入数据库名称" />
          </Form.Item>
          <Form.Item name="username" label="用户名">
            <Input placeholder="输入用户名" />
          </Form.Item>
          <Form.Item name="password" label="密码">
            <Input.Password placeholder="输入密码" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 工具集成配置模态框 */}
      <Modal
        title={selectedTool ? '编辑工具集成' : '添加工具集成'}
        open={toolModalVisible}
        onCancel={() => {
          setToolModalVisible(false);
          setSelectedTool(null);
          toolForm.resetFields();
        }}
        onOk={() => {
          toolForm.validateFields().then(values => {
            // 处理工具集成配置
            message.success('工具集成配置成功');
            setToolModalVisible(false);
            setSelectedTool(null);
            toolForm.resetFields();
          });
        }}
      >
        <Form form={toolForm} layout="vertical">
          <Form.Item name="name" label="工具名称" rules={[{ required: true }]}>
            <Input placeholder="输入工具名称" />
          </Form.Item>
          <Form.Item name="type" label="工具类型" rules={[{ required: true }]}>
            <Select placeholder="选择工具类型">
              <Option value="api">REST API</Option>
              <Option value="webhook">Webhook</Option>
              <Option value="rpc">RPC</Option>
              <Option value="database">数据库</Option>
              <Option value="file">文件系统</Option>
            </Select>
          </Form.Item>
          <Form.Item name="description" label="工具描述">
            <TextArea rows={3} placeholder="输入工具描述" />
          </Form.Item>
          <Form.Item name="endpoint" label="端点URL" rules={[{ required: true }]}>
            <Input placeholder="输入端点URL" />
          </Form.Item>
          <Form.Item name="method" label="HTTP方法">
            <Select placeholder="选择HTTP方法">
              <Option value="GET">GET</Option>
              <Option value="POST">POST</Option>
              <Option value="PUT">PUT</Option>
              <Option value="DELETE">DELETE</Option>
            </Select>
          </Form.Item>
          <Form.Item name="authType" label="认证类型">
            <Select placeholder="选择认证类型">
              <Option value="none">无认证</Option>
              <Option value="basic">Basic认证</Option>
              <Option value="bearer">Bearer Token</Option>
              <Option value="oauth">OAuth</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </Modal>
  );
};

export default CoreCapabilityModules;