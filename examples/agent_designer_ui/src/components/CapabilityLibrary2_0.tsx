// CapabilityLibrary2_0.tsx
// EFIAgent 2.0 能力库组件
// 提供能力浏览、搜索、筛选、管理等功能

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Card,
  Row,
  Col,
  Input,
  Select,
  Button,
  Tag,
  Badge,
  Tooltip,
  Modal,
  Drawer,
  Tabs,
  List,
  Avatar,
  Rate,
  Progress,
  Statistic,
  Divider,
  Space,
  Menu,
  Dropdown,
  message,
  Form,
  Upload,
  Switch,
  Slider,
  Tree,
  Collapse,
  Timeline,
  Alert,
  Empty,
  Spin,
  Pagination,
  Checkbox,
  Radio,
  DatePicker,
  AutoComplete,
  Cascader,
} from 'antd';
import {
  SearchOutlined,
  FilterOutlined,
  PlusOutlined,
  DownloadOutlined,
  UploadOutlined,
  StarOutlined,
  HeartOutlined,
  ShareAltOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  CopyOutlined,
  ThunderboltOutlined,
  BulbOutlined,
  BookOutlined,
  ApiOutlined,
  DatabaseOutlined,
  CloudOutlined,
  SecurityScanOutlined,
  SettingOutlined,
  MonitorOutlined,
  TeamOutlined,
  RocketOutlined,
  ExperimentOutlined,
  FunctionOutlined,
  NodeIndexOutlined,
  ApartmentOutlined,
  InteractionOutlined,
  RobotOutlined,
  EyeInvisibleOutlined,
  LockOutlined,
  UnlockOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined,
  QuestionCircleOutlined,
  ReloadOutlined,
  SortAscendingOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
  TagOutlined,
  CalendarOutlined,
  UserOutlined,
  GlobalOutlined,
} from '@ant-design/icons';
import {
  CoreCapabilityModule,
  CoreCapabilityType,
  CapabilitySource,
  CapabilityMaturityLevel,
  CapabilityCategory,
  CapabilityMetadata,
  CapabilitySourceType,
  ReasoningCapabilityType,
  CognitiveCapabilityType,
  LearningCapabilityType,
  DecisionCapabilityType,
} from './CapabilitySystemTypes';
import './CapabilityLibrary2_0.css';

const { Search } = Input;
const { Option } = Select;
const { TabPane } = Tabs;
const { Panel } = Collapse;
const { CheckableTag } = Tag;

interface CapabilityLibrary2_0Props {
  onCapabilitySelect?: (capability: CoreCapabilityModule) => void;
  selectedCapabilities?: string[];
  mode?: 'selection' | 'management';
}

interface CapabilityStats {
  total: number;
  cognitive: number;
  reasoning: number;
  decision: number;
  learning: number;
  published: number;
  draft: number;
  deprecated: number;
}

interface FilterOptions {
  types: CoreCapabilityType[];
  sources: CapabilitySource[];
  maturityLevels: CapabilityMaturityLevel[];
  categories: string[];
  tags: string[];
  authors: string[];
  organizations: string[];
  ratingRange: [number, number];
  featured: boolean | null;
  verified: boolean | null;
}

const CapabilityLibrary2_0: React.FC<CapabilityLibrary2_0Props> = ({
  onCapabilitySelect,
  selectedCapabilities = [],
  mode = 'management'
}) => {
  // 状态管理
  const [capabilities, setCapabilities] = useState<CoreCapabilityModule[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedCapability, setSelectedCapability] = useState<CoreCapabilityModule | null>(null);
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'rating' | 'downloads' | 'updated'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  
  // 筛选选项
  const [filters, setFilters] = useState<FilterOptions>({
    types: [],
    sources: [],
    maturityLevels: [],
    categories: [],
    tags: [],
    authors: [],
    organizations: [],
    ratingRange: [0, 5],
    featured: null,
    verified: null
  });

  // 模拟数据
  const mockCapabilities: CoreCapabilityModule[] = [
    {
      id: 'cap_001',
      name: '自然语言理解',
      description: '基于Transformer架构的多语言自然语言理解模块，支持文本分类、情感分析、实体识别等任务',
      type: CoreCapabilityType.COGNITIVE,
      subType: CognitiveCapabilityType.UNDERSTANDING,
      version: '2.1.0',
      maturityLevel: CapabilityMaturityLevel.OPTIMIZED,
      source: CapabilitySource.BUILTIN,
      category: CapabilityCategory.NLP,
      inputs: [
        { 
          id: 'input_001',
          name: 'text', 
          dataType: 'string', 
          description: '待处理的文本内容',
          required: true,
          validation: {
            type: 'string',
            minLength: 1,
            maxLength: 10000
          },
          defaultValue: undefined,
          examples: []
        }
      ],
      outputs: [
        {
          id: 'output_001',
          name: 'understanding_result',
          dataType: 'object',
          description: '文本理解结果',
          schema: {
            sentiment: 'string',
            entities: 'array',
            intent: 'string',
            confidence: 'number'
          },
          examples: []
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
              },
              {
                metric: 'latency',
                operator: '>',
                value: 1000,
                duration: 30,
                severity: 'high'
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
            batch_size: 32,
            learning_rate: 2e-5
          },
          runtime: {
            fallback: true
          },
          scaling: {
            min_instances: 1,
            max_instances: 10,
            target_utilization: 0.7
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
          id: 'source_001',
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
        difficulty: 'intermediate',
        rating: 4.8,
        downloads: 5200,
        featured: true,
        verified: true,
        documentation: 'https://docs.example.com/nlp',
        examples: [
          {
            name: '情感分析示例',
            description: '分析用户评论的情感倾向',
            input: { text: '这个产品很棒！' },
            output: { sentiment: 'positive', confidence: 0.95 },
            code: 'const result = await nlp.analyze("这个产品很棒！");'
          }
        ],
        implementation: {
          language: 'python',
          framework: 'transformers',
          dependencies: ['torch', 'transformers', 'numpy'],
          resources: {
            cpu: '2 cores',
            memory: '4GB',
            gpu: 'optional'
          }
        },
        changelog: [
          {
            version: '2.1.0',
            date: new Date('2024-01-20'),
            changes: ['增加多语言支持', '优化推理速度', '修复内存泄漏'],
            breaking: false
          }
        ]
      }
    },
    {
      id: 'cap_002',
      name: '逻辑推理引擎',
      description: '基于符号逻辑和神经网络的混合推理引擎，支持演绎、归纳、类比等多种推理模式',
      type: CoreCapabilityType.REASONING,
      subType: ReasoningCapabilityType.LOGICAL,
      version: '1.5.2',
      source: CapabilitySource.BUILTIN,
      maturityLevel: CapabilityMaturityLevel.DEFINED,
      category: CapabilityCategory.REASONING,
      inputs: [
        { 
          id: 'input_001',
          name: 'premises', 
          dataType: 'array', 
          description: '前提条件列表',
          required: true,
          validation: {
            type: 'array'
          },
          defaultValue: undefined,
          examples: []
        },
        {
          id: 'input_002',
          name: 'reasoning_type',
          dataType: 'string',
          description: '推理类型：deductive, inductive, abductive',
          required: true,
          validation: {
            type: 'string',
            enum: ['deductive', 'inductive', 'abductive']
          },
          defaultValue: undefined,
          examples: []
        }
      ],
      outputs: [
        {
          id: 'output_001',
          name: 'conclusion',
          dataType: 'object',
          description: '推理结论',
          schema: {
            result: 'string',
            confidence: 'number',
            reasoning_path: 'array'
          },
          examples: []
        }
      ],
      config: {
        executionMode: 'async',
        timeout: 60000,
        retryPolicy: {
          maxRetries: 2,
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
        securityLevel: 'high',
        accessControl: {
          authentication: true,
          authorization: ['reasoning_user', 'admin'],
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
                value: 0.8,
                duration: 300,
                severity: 'high'
              }
            ],
            channels: [
              {
                type: 'email',
                config: { recipients: ['admin@example.com'] }
              }
            ]
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
            name: 'hybrid-reasoning-v1',
            version: '1.5',
            max_depth: 10,
            confidence_threshold: 0.7
          },
          runtime: {
            fallback: false
          },
          scaling: {
            min_instances: 1,
            max_instances: 5,
            target_utilization: 0.8
          }
        }
      },
      dependencies: [],
      metrics: {
        avgResponseTime: 3500,
        throughput: 120,
        successRate: 0.92,
        errorRate: 0.08,
        accuracy: 0.89,
        precision: 0.87,
        recall: 0.91,
        f1Score: 0.89,
        usageCount: 3200,
        activeUsers: 85,
        avgCpuUsage: 65,
        avgMemoryUsage: 75,
        avgTokenUsage: 450,
        lastUpdated: new Date('2024-01-15')
      },
      resources: [
        {
          type: 'cpu',
          amount: 4,
          unit: 'cores',
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
          id: 'source_002',
          type: CapabilitySourceType.BUILTIN,
          name: 'Hybrid Reasoning Engine',
          description: 'Built-in hybrid reasoning engine combining symbolic and neural approaches',
          config: {},
          version: '1.5.2',
          reliability: 0.92
        }
      ],
      createdAt: new Date('2023-09-15'),
      updatedAt: new Date('2024-01-15'),
      author: 'Logic AI Team',
      tags: ['reasoning', 'logic', 'inference'],
      metadata: {
        author: 'Logic AI Team',
        organization: 'Reasoning Labs',
        license: 'Apache-2.0',
        tags: ['reasoning', 'logic', 'inference'],
        category: 'ai-reasoning',
        difficulty: 'advanced',
        rating: 4.5,
        downloads: 1800,
        featured: false,
        verified: true,
        documentation: 'https://docs.example.com/reasoning',
        examples: [],
        implementation: {
          language: 'python',
          framework: 'pytorch',
          dependencies: ['torch', 'transformers'],
          resources: {
            cpu: '4 cores',
            memory: '8GB',
            gpu: 'optional'
          }
        },
        changelog: [
          {
            version: '1.5.2',
            date: new Date('2024-01-15'),
            changes: ['修复归纳推理bug', '优化推理路径生成', '增加超时控制'],
            breaking: false
          }
        ]
      }
    }
  ];

  // 初始化数据
  useEffect(() => {
    setLoading(true);
    // 模拟API调用
    setTimeout(() => {
      setCapabilities(mockCapabilities);
      setLoading(false);
    }, 1000);
  }, []);

  // 筛选和搜索逻辑
  const filteredCapabilities = useMemo(() => {
    let result = capabilities.filter(cap => {
      // 搜索文本过滤
      if (searchText) {
        const searchLower = searchText.toLowerCase();
        const matchesSearch = 
          cap.name.toLowerCase().includes(searchLower) ||
          cap.description.toLowerCase().includes(searchLower) ||
          cap.metadata.tags.some(tag => tag.toLowerCase().includes(searchLower)) ||
          cap.metadata.author.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // 类型过滤
      if (filters.types.length > 0 && !filters.types.includes(cap.type)) {
        return false;
      }

      // 来源过滤
      if (filters.sources.length > 0 && !filters.sources.includes(cap.source)) {
        return false;
      }

      // 成熟度过滤
      if (filters.maturityLevels.length > 0 && !filters.maturityLevels.includes(cap.maturityLevel)) {
        return false;
      }

      // 评分范围过滤
      if (cap.metadata.rating < filters.ratingRange[0] || cap.metadata.rating > filters.ratingRange[1]) {
        return false;
      }

      // 特色过滤
      if (filters.featured !== null && cap.metadata.featured !== filters.featured) {
        return false;
      }

      // 验证过滤
      if (filters.verified !== null && cap.metadata.verified !== filters.verified) {
        return false;
      }

      return true;
    });

    // 排序
    result.sort((a, b) => {
      let aValue, bValue;
      switch (sortBy) {
        case 'name':
          aValue = a.name;
          bValue = b.name;
          break;
        case 'rating':
          aValue = a.metadata.rating;
          bValue = b.metadata.rating;
          break;
        case 'downloads':
          aValue = a.metadata.downloads;
          bValue = b.metadata.downloads;
          break;
        case 'updated':
          aValue = a.updatedAt.getTime();
          bValue = b.updatedAt.getTime();
          break;
        default:
          return 0;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      } else {
        return sortOrder === 'asc' ? (aValue as number) - (bValue as number) : (bValue as number) - (aValue as number);
      }
    });

    return result;
  }, [capabilities, searchText, filters, sortBy, sortOrder]);

  // 分页数据
  const paginatedCapabilities = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredCapabilities.slice(startIndex, startIndex + pageSize);
  }, [filteredCapabilities, currentPage, pageSize]);

  // 统计数据
  const stats: CapabilityStats = useMemo(() => {
    return {
      total: capabilities.length,
      cognitive: capabilities.filter(cap => cap.type === CoreCapabilityType.COGNITIVE).length,
      reasoning: capabilities.filter(cap => cap.type === CoreCapabilityType.REASONING).length,
      decision: capabilities.filter(cap => cap.type === CoreCapabilityType.DECISION).length,
      learning: capabilities.filter(cap => cap.type === CoreCapabilityType.LEARNING).length,
      published: capabilities.filter(cap => cap.metadata.verified).length,
      draft: capabilities.filter(cap => !cap.metadata.verified).length,
      deprecated: 0 // 暂时没有废弃的能力
    };
  }, [capabilities]);

  // 处理能力选择
  const handleCapabilitySelect = useCallback((capability: CoreCapabilityModule) => {
    if (mode === 'selection' && onCapabilitySelect) {
      onCapabilitySelect(capability);
    } else {
      setSelectedCapability(capability);
      setDetailDrawerVisible(true);
    }
  }, [mode, onCapabilitySelect]);

  // 渲染能力卡片
  const renderCapabilityCard = (capability: CoreCapabilityModule) => {
    const isSelected = selectedCapabilities.includes(capability.id);
    
    return (
      <Card
        key={capability.id}
        className={`capability-card ${isSelected ? 'selected' : ''}`}
        hoverable
        onClick={() => handleCapabilitySelect(capability)}
        actions={[
          <Tooltip title="查看详情">
            <EyeOutlined key="view" />
          </Tooltip>,
          <Tooltip title="复制">
            <CopyOutlined key="copy" />
          </Tooltip>,
          <Tooltip title="收藏">
            <StarOutlined key="star" />
          </Tooltip>
        ]}
      >
        <Card.Meta
          avatar={
            <Avatar 
              size={48} 
              icon={getCapabilityIcon(capability.type)}
              style={{ backgroundColor: getCapabilityColor(capability.type) }}
            />
          }
          title={
            <div className="capability-title">
              <span>{capability.name}</span>
              <div className="capability-badges">
                {capability.metadata.featured && (
                  <Badge.Ribbon text="推荐" color="gold" />
                )}
                {capability.metadata.verified && (
                  <CheckCircleOutlined className="verified-icon" />
                )}
              </div>
            </div>
          }
          description={
            <div className="capability-description">
              <p>{capability.description}</p>
              <div className="capability-meta">
                <Tag color={getMaturityColor(capability.maturityLevel)}>
                  {capability.maturityLevel}
                </Tag>
                <Rate disabled defaultValue={capability.metadata.rating} />
                <span className="downloads">
                  <DownloadOutlined /> {capability.metadata.downloads}
                </span>
              </div>
              <div className="capability-tags">
                {capability.metadata.tags.slice(0, 3).map(tag => (
                  <Tag key={tag}>{tag}</Tag>
                ))}
                {capability.metadata.tags.length > 3 && (
                  <Tag>+{capability.metadata.tags.length - 3}</Tag>
                )}
              </div>
            </div>
          }
        />
      </Card>
    );
  };

  // 渲染详情抽屉
  const renderDetailDrawer = () => {
    if (!selectedCapability) return null;

    return (
      <Drawer
        title={selectedCapability.name}
        placement="right"
        width={720}
        open={detailDrawerVisible}
        onClose={() => setDetailDrawerVisible(false)}
      >
        <div className="capability-detail">
          <div className="detail-header">
            <div className="capability-info">
              <Avatar 
                size={64} 
                icon={getCapabilityIcon(selectedCapability.type)}
                style={{ backgroundColor: getCapabilityColor(selectedCapability.type) }}
              />
              <div className="info-content">
                <h2>{selectedCapability.name}</h2>
                <p>{selectedCapability.description}</p>
                <div className="meta-info">
                  <Tag color={getMaturityColor(selectedCapability.maturityLevel)}>
                    {selectedCapability.maturityLevel}
                  </Tag>
                  <Rate disabled defaultValue={selectedCapability.metadata.rating} />
                  <span>版本: {selectedCapability.version}</span>
                </div>
              </div>
            </div>
          </div>

          <Tabs defaultActiveKey="overview">
            <TabPane tab="概览" key="overview">
              <div className="overview-content">
                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <Statistic title="下载量" value={selectedCapability.metadata.downloads} />
                  </Col>
                  <Col span={12}>
                    <Statistic title="评分" value={selectedCapability.metadata.rating} precision={1} />
                  </Col>
                </Row>
                
                <Divider />
                
                <div className="tags-section">
                  <h4>标签</h4>
                  {selectedCapability.metadata.tags.map(tag => (
                    <Tag key={tag}>{tag}</Tag>
                  ))}
                </div>
                
                <div className="author-section">
                  <h4>作者信息</h4>
                  <p>作者: {selectedCapability.metadata.author}</p>
                  <p>组织: {selectedCapability.metadata.organization}</p>
                  <p>许可证: {selectedCapability.metadata.license}</p>
                </div>
              </div>
            </TabPane>
            
            <TabPane tab="配置" key="configuration">
              <div className="configuration-content">
                <h4>执行配置</h4>
                <pre>{JSON.stringify({
                   executionMode: selectedCapability.config.executionMode,
                   timeout: selectedCapability.config.timeout,
                   retryPolicy: selectedCapability.config.retryPolicy
                 }, null, 2)}</pre>
                 
                 <h4>参数配置</h4>
                 <pre>{JSON.stringify(selectedCapability.config.parameters, null, 2)}</pre>
              </div>
            </TabPane>
            
            <TabPane tab="API" key="api">
              <div className="api-content">
                <h4>输入参数</h4>
                <List
                  dataSource={selectedCapability.inputs}
                  renderItem={input => (
                    <List.Item>
                      <List.Item.Meta
                        title={`${input.name} (${input.dataType})`}
                        description={input.description}
                      />
                      {input.required && <Tag color="red">必需</Tag>}
                    </List.Item>
                  )}
                />
                
                <h4>输出结果</h4>
                <List
                  dataSource={selectedCapability.outputs}
                  renderItem={output => (
                    <List.Item>
                      <List.Item.Meta
                        title={`${output.name} (${output.dataType})`}
                        description={output.description}
                      />
                    </List.Item>
                  )}
                />
              </div>
            </TabPane>
          </Tabs>
        </div>
      </Drawer>
    );
  };

  // 获取能力类型图标
  const getCapabilityIcon = (type: CoreCapabilityType) => {
    switch (type) {
      case CoreCapabilityType.COGNITIVE:
        return <BulbOutlined />;
      case CoreCapabilityType.REASONING:
        return <ThunderboltOutlined />;
      case CoreCapabilityType.DECISION:
        return <ApartmentOutlined />;
      case CoreCapabilityType.LEARNING:
        return <BookOutlined />;
      default:
        return <RobotOutlined />;
    }
  };

  // 获取能力类型颜色
  const getCapabilityColor = (type: CoreCapabilityType) => {
    switch (type) {
      case CoreCapabilityType.COGNITIVE:
        return '#1890ff';
      case CoreCapabilityType.REASONING:
        return '#52c41a';
      case CoreCapabilityType.DECISION:
        return '#faad14';
      case CoreCapabilityType.LEARNING:
        return '#722ed1';
      default:
        return '#8c8c8c';
    }
  };

  // 获取成熟度颜色
  const getMaturityColor = (level: CapabilityMaturityLevel) => {
    switch (level) {
      case CapabilityMaturityLevel.INITIAL:
        return 'red';
      case CapabilityMaturityLevel.MANAGED:
        return 'orange';
      case CapabilityMaturityLevel.DEFINED:
        return 'yellow';
      case CapabilityMaturityLevel.QUANTIFIED:
        return 'green';
      case CapabilityMaturityLevel.OPTIMIZED:
        return 'blue';
      default:
        return 'default';
    }
  };

  return (
    <div className="capability-library-2-0">
      {/* 头部统计 */}
      <div className="library-header">
        <Row gutter={16}>
          <Col span={4}>
            <Card>
              <Statistic title="总计" value={stats.total} prefix={<DatabaseOutlined />} />
            </Card>
          </Col>
          <Col span={4}>
            <Card>
              <Statistic title="认知" value={stats.cognitive} prefix={<BulbOutlined />} />
            </Card>
          </Col>
          <Col span={4}>
            <Card>
              <Statistic title="推理" value={stats.reasoning} prefix={<ThunderboltOutlined />} />
            </Card>
          </Col>
          <Col span={4}>
            <Card>
              <Statistic title="决策" value={stats.decision} prefix={<ApartmentOutlined />} />
            </Card>
          </Col>
          <Col span={4}>
            <Card>
              <Statistic title="学习" value={stats.learning} prefix={<BookOutlined />} />
            </Card>
          </Col>
          <Col span={4}>
            <Card>
              <Statistic title="已发布" value={stats.published} prefix={<CheckCircleOutlined />} />
            </Card>
          </Col>
        </Row>
      </div>

      {/* 搜索和筛选 */}
      <div className="library-controls">
        <Row gutter={16} align="middle">
          <Col flex="auto">
            <Search
              placeholder="搜索能力名称、描述、标签..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: '100%' }}
              size="large"
            />
          </Col>
          <Col>
            <Button icon={<FilterOutlined />} size="large">
              筛选
            </Button>
          </Col>
          <Col>
            <Button.Group size="large">
              <Button 
                icon={<AppstoreOutlined />} 
                type={viewMode === 'grid' ? 'primary' : 'default'}
                onClick={() => setViewMode('grid')}
              />
              <Button 
                icon={<UnorderedListOutlined />} 
                type={viewMode === 'list' ? 'primary' : 'default'}
                onClick={() => setViewMode('list')}
              />
            </Button.Group>
          </Col>
          <Col>
            <Select
              value={`${sortBy}-${sortOrder}`}
              onChange={(value) => {
                const [newSortBy, newSortOrder] = value.split('-');
                setSortBy(newSortBy as any);
                setSortOrder(newSortOrder as any);
              }}
              size="large"
              style={{ width: 150 }}
            >
              <Option value="name-asc">名称 ↑</Option>
              <Option value="name-desc">名称 ↓</Option>
              <Option value="rating-desc">评分 ↓</Option>
              <Option value="downloads-desc">下载量 ↓</Option>
              <Option value="updated-desc">更新时间 ↓</Option>
            </Select>
          </Col>
        </Row>
      </div>

      {/* 能力列表 */}
      <div className="library-content">
        {loading ? (
          <div className="loading-container">
            <Spin size="large" />
          </div>
        ) : filteredCapabilities.length === 0 ? (
          <Empty description="暂无能力数据" />
        ) : (
          <>
            <Row gutter={[16, 16]}>
              {paginatedCapabilities.map(capability => (
                <Col key={capability.id} xs={24} sm={12} md={8} lg={6}>
                  {renderCapabilityCard(capability)}
                </Col>
              ))}
            </Row>
            
            <div className="pagination-container">
              <Pagination
                current={currentPage}
                pageSize={pageSize}
                total={filteredCapabilities.length}
                onChange={(page, size) => {
                  setCurrentPage(page);
                  setPageSize(size || pageSize);
                }}
                showSizeChanger
                showQuickJumper
                showTotal={(total, range) => `${range[0]}-${range[1]} 共 ${total} 项`}
              />
            </div>
          </>
        )}
      </div>
      
      {/* 能力详情抽屉 */}
      {renderDetailDrawer()}
      
      {/* TODO: 添加创建、导入、过滤等模态框 */}
    </div>
  );
};

export default CapabilityLibrary2_0;