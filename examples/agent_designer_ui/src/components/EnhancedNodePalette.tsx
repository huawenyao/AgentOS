import React, { useState, useMemo } from 'react';
import {
  Card,
  Collapse,
  Button,
  Tooltip,
  Input,
  Space,
  Badge,
  Tag,
  Rate,
  Avatar,
  Typography,
  Divider,
  Empty
} from 'antd';
import {
  PlayCircleOutlined,
  StopOutlined,
  ExclamationCircleOutlined,
  BranchesOutlined,
  RobotOutlined,
  ThunderboltOutlined,
  EyeOutlined,
  DatabaseOutlined,
  SearchOutlined,
  DragOutlined,
  ApiOutlined,
  FileTextOutlined,
  CloudOutlined,
  ToolOutlined,
  BulbOutlined,
  MessageOutlined,
  CodeOutlined,
  PictureOutlined,
  SoundOutlined,
  GlobalOutlined,
  MailOutlined,
  LinkOutlined,
  SettingOutlined,
  StarOutlined,
  UserOutlined,
  ClockCircleOutlined,
  SyncOutlined,
  MergeOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import {
  BaseNode,
  ControlNode,
  NodeCategory,
  ControlNodeType,
  CapabilityType,
  AgentType,
  IntegrationType,
  AgentTemplate,
  CapabilityComponent,
  PropertyDefinition,
  PropertyType
} from './types';
import './EnhancedNodePalette.css';

const { Panel } = Collapse;
const { Search } = Input;
const { Text } = Typography;

interface EnhancedNodePaletteProps {
  onAddNode: (nodeData: BaseNode) => void;
  onDragStart?: (nodeData: BaseNode) => void;
  onDragEnd?: () => void;
  className?: string;
}

// 控制节点模板
const controlNodeTemplates: ControlNode[] = [
  {
    id: 'start',
    name: '开始',
    description: '工作流开始节点',
    category: NodeCategory.CONTROL,
    type: ControlNodeType.START,
    icon: 'PlayCircleOutlined',
    color: '#52c41a',
    tags: ['控制', '开始'],
    connectionPoints: {
      inputs: [],
      outputs: [{ id: 'out', name: '输出', type: 'control' }]
    },
    properties: [
      {
        id: 'autoStart',
        name: 'autoStart',
        label: '自动启动',
        description: '工作流是否自动启动',
        type: PropertyType.BOOLEAN,
        required: false,
        group: 'basic',
        order: 1,
        defaultValue: true
      }
    ]
  },
  {
    id: 'end',
    name: '结束',
    description: '工作流结束节点',
    category: NodeCategory.CONTROL,
    type: ControlNodeType.END,
    icon: 'StopOutlined',
    color: '#ff4d4f',
    tags: ['控制', '结束'],
    connectionPoints: {
      inputs: [{ id: 'in', name: '输入', type: 'control' }],
      outputs: []
    },
    properties: [
      {
        id: 'returnCode',
        name: 'returnCode',
        label: '返回码',
        description: '工作流结束时的返回码',
        type: PropertyType.NUMBER,
        required: false,
        group: 'basic',
        order: 1,
        defaultValue: 0,
        validation: { min: 0, max: 255 }
      }
    ]
  },
  {
    id: 'condition',
    name: '条件判断',
    description: '根据条件进行分支控制',
    category: NodeCategory.CONTROL,
    type: ControlNodeType.CONDITION,
    icon: 'BranchesOutlined',
    color: '#722ed1',
    tags: ['控制', '条件', '分支'],
    connectionPoints: {
      inputs: [{ id: 'in', name: '输入', type: 'control' }],
      outputs: [
        { id: 'true', name: '真', type: 'control' },
        { id: 'false', name: '假', type: 'control' }
      ]
    },
    properties: [
      {
        id: 'condition',
        name: 'condition',
        label: '条件表达式',
        description: '用于判断的条件表达式',
        type: PropertyType.CODE,
        required: true,
        group: 'basic',
        order: 1
      },
      {
        id: 'operator',
        name: 'operator',
        label: '比较操作符',
        description: '条件比较的操作符',
        type: PropertyType.SELECT,
        required: true,
        group: 'basic',
        order: 2,
        options: [
          { label: '等于 (==)', value: 'eq' },
          { label: '不等于 (!=)', value: 'ne' },
          { label: '大于 (>)', value: 'gt' },
          { label: '小于 (<)', value: 'lt' },
          { label: '大于等于 (>=)', value: 'gte' },
          { label: '小于等于 (<=)', value: 'lte' },
          { label: '包含', value: 'contains' },
          { label: '正则匹配', value: 'regex' }
        ]
      }
    ]
  },
  {
    id: 'parallel',
    name: '并行执行',
    description: '并行执行多个分支',
    category: NodeCategory.CONTROL,
    type: ControlNodeType.PARALLEL,
    icon: 'SyncOutlined',
    color: '#13c2c2',
    tags: ['控制', '并行'],
    connectionPoints: {
      inputs: [{ id: 'in', name: '输入', type: 'control' }],
      outputs: [
        { id: 'out1', name: '分支1', type: 'control' },
        { id: 'out2', name: '分支2', type: 'control' }
      ]
    },
    properties: [
      {
        id: 'maxConcurrency',
        name: 'maxConcurrency',
        label: '最大并发数',
        description: '同时执行的最大分支数',
        type: PropertyType.NUMBER,
        required: false,
        group: 'basic',
        order: 1,
        defaultValue: 2,
        validation: { min: 1, max: 10 }
      },
      {
        id: 'waitForAll',
        name: 'waitForAll',
        label: '等待所有分支',
        description: '是否等待所有分支完成',
        type: PropertyType.BOOLEAN,
        required: false,
        group: 'basic',
        order: 2,
        defaultValue: true
      }
    ]
  },
  {
    id: 'merge',
    name: '合并',
    description: '合并多个分支',
    category: NodeCategory.CONTROL,
    type: ControlNodeType.MERGE,
    icon: 'MergeOutlined',
    color: '#fa8c16',
    tags: ['控制', '合并'],
    connectionPoints: {
      inputs: [
        { id: 'in1', name: '输入1', type: 'control' },
        { id: 'in2', name: '输入2', type: 'control' }
      ],
      outputs: [{ id: 'out', name: '输出', type: 'control' }]
    },
    properties: [
      {
        id: 'mergeStrategy',
        name: 'mergeStrategy',
        label: '合并策略',
        description: '多个输入的合并策略',
        type: PropertyType.SELECT,
        required: false,
        group: 'basic',
        order: 1,
        defaultValue: 'waitAll',
        options: [
          { label: '等待所有', value: 'waitAll' },
          { label: '等待任一', value: 'waitAny' },
          { label: '先到先得', value: 'firstWins' }
        ]
      }
    ]
  },
  {
    id: 'loop',
    name: '循环',
    description: '循环执行节点',
    category: NodeCategory.CONTROL,
    type: ControlNodeType.LOOP,
    icon: 'ReloadOutlined',
    color: '#eb2f96',
    tags: ['控制', '循环'],
    connectionPoints: {
      inputs: [{ id: 'in', name: '输入', type: 'control' }],
      outputs: [
        { id: 'loop', name: '循环', type: 'control' },
        { id: 'exit', name: '退出', type: 'control' }
      ]
    },
    properties: [
      {
        id: 'loopType',
        name: 'loopType',
        label: '循环类型',
        description: '循环的类型',
        type: PropertyType.SELECT,
        required: true,
        group: 'basic',
        order: 1,
        options: [
          { label: '固定次数', value: 'count' },
          { label: '条件循环', value: 'condition' },
          { label: '遍历数组', value: 'forEach' }
        ]
      },
      {
        id: 'maxIterations',
        name: 'maxIterations',
        label: '最大迭代次数',
        description: '防止无限循环的最大迭代次数',
        type: PropertyType.NUMBER,
        required: false,
        group: 'basic',
        order: 2,
        defaultValue: 100,
        validation: { min: 1, max: 10000 }
      }
    ]
  },
  {
    id: 'delay',
    name: '延时',
    description: '延时执行',
    category: NodeCategory.CONTROL,
    type: ControlNodeType.DELAY,
    icon: 'ClockCircleOutlined',
    color: '#faad14',
    tags: ['控制', '延时'],
    connectionPoints: {
      inputs: [{ id: 'in', name: '输入', type: 'control' }],
      outputs: [{ id: 'out', name: '输出', type: 'control' }]
    },
    properties: [
      {
        id: 'duration',
        name: 'duration',
        label: '延时时长',
        description: '延时的时长（毫秒）',
        type: PropertyType.NUMBER,
        required: true,
        group: 'basic',
        order: 1,
        defaultValue: 1000,
        validation: { min: 0, max: 3600000 }
      },
      {
        id: 'unit',
        name: 'unit',
        label: '时间单位',
        description: '时间的单位',
        type: PropertyType.SELECT,
        required: false,
        group: 'basic',
        order: 2,
        defaultValue: 'ms',
        options: [
          { label: '毫秒', value: 'ms' },
          { label: '秒', value: 's' },
          { label: '分钟', value: 'm' },
          { label: '小时', value: 'h' }
        ]
      }
    ]
  },
  {
    id: 'error_handler',
    name: '错误处理',
    description: '处理工作流中的错误',
    category: NodeCategory.CONTROL,
    type: ControlNodeType.ERROR_HANDLER,
    icon: 'ExclamationCircleOutlined',
    color: '#ff7a45',
    tags: ['控制', '错误', '异常'],
    connectionPoints: {
      inputs: [{ id: 'in', name: '输入', type: 'control' }],
      outputs: [
          { id: 'success', name: '成功', type: 'control' },
          { id: 'error', name: '错误', type: 'control' }
        ]
    },
    properties: [
      {
        id: 'errorType',
        name: 'errorType',
        label: '错误类型',
        description: '要处理的错误类型',
        type: PropertyType.MULTI_SELECT,
        required: false,
        group: 'basic',
        order: 1,
        options: [
          { label: '运行时错误', value: 'runtime' },
          { label: '网络错误', value: 'network' },
          { label: '超时错误', value: 'timeout' },
          { label: '验证错误', value: 'validation' },
          { label: '权限错误', value: 'permission' }
        ]
      },
      {
        id: 'retryCount',
        name: 'retryCount',
        label: '重试次数',
        description: '错误发生时的重试次数',
        type: PropertyType.NUMBER,
        required: false,
        group: 'basic',
        order: 2,
        defaultValue: 3,
        validation: { min: 0, max: 10 }
      }
    ]
  }
];

// Agent节点模板
const agentTemplates: AgentTemplate[] = [
  {
    id: 'planning_agent',
    name: '规划Agent',
    description: '负责任务分解和规划的智能体',
    category: NodeCategory.AGENT,
    type: AgentType.PLANNING,
    icon: 'RobotOutlined',
    color: '#1890ff',
    difficulty: 'intermediate',
    featured: true,
    capabilities: [],
    rating: 4.5,
    usageCount: 1250,
    tags: ['规划', '任务分解', '智能决策'],
    author: 'EFIAgent Team',
    version: '1.0.0',

    llmConfig: {
      provider: 'openai',
      model: 'gpt-4',
      temperature: 0.3,
      maxTokens: 4096,
      topP: 0.9,
      frequencyPenalty: 0.0,
      presencePenalty: 0.0
    },
    systemPrompt: '你是一个专业的任务规划专家。请将复杂任务分解为可执行的步骤，制定详细的执行计划。',
    workflow: {
      nodes: [],
      connections: [],
      variables: [
        { name: 'taskDescription', type: 'string', description: '任务描述' },
        { name: 'constraints', type: 'object', description: '约束条件' }
      ],
      triggers: [
        { type: 'event', config: { condition: 'taskDescription != null' } }
      ]
    },
    reviews: [
        {
          id: 'review1',
          userId: 'user1',
          rating: 5,
          comment: '规划能力很强，分解任务很合理！',
          createdAt: new Date('2024-01-15T10:30:00Z')
        }
      ],
    properties: [
      {
        id: 'planningDepth',
        name: 'planningDepth',
        label: '规划深度',
        description: '任务分解的详细程度',
        type: PropertyType.SELECT,
        required: false,
        group: 'agent',
        order: 1,
        defaultValue: 'detailed',
        options: [
          { label: '简单规划', value: 'simple' },
          { label: '标准规划', value: 'standard' },
          { label: '详细规划', value: 'detailed' },
          { label: '深度规划', value: 'deep' }
        ]
      }
    ]
  },
  {
    id: 'execution_agent',
    name: '执行Agent',
    description: '负责执行具体任务的智能体',
    category: NodeCategory.AGENT,
    type: AgentType.EXECUTION,
    icon: 'ThunderboltOutlined',
    color: '#13c2c2',
    difficulty: 'beginner',
    featured: true,
    capabilities: [],
    rating: 4.3,
    usageCount: 2100,
    tags: ['执行', '任务处理', '自动化'],
    author: 'EFIAgent Team',
    version: '1.0.0',

    llmConfig: {
      provider: 'openai',
      model: 'gpt-3.5-turbo',
      temperature: 0.5,
      maxTokens: 2048,
      topP: 1.0,
      frequencyPenalty: 0.0,
      presencePenalty: 0.0
    },
    systemPrompt: '你是一个高效的任务执行专家。请按照给定的计划执行任务，确保质量和效率。',
    workflow: {
      nodes: [],
      connections: [],
      variables: [
        { name: 'executionPlan', type: 'object', description: '执行计划' },
        { name: 'resources', type: 'object', description: '可用资源' }
      ],
      triggers: [
        { type: 'event', config: { condition: 'executionPlan != null' } }
      ]
    },
    reviews: [
        {
          id: 'review2',
          userId: 'user2',
          rating: 4,
          comment: '执行效率很高，结果准确！',
          createdAt: new Date('2024-01-14T15:20:00Z')
        }
      ],
    properties: [
      {
        id: 'executionMode',
        name: 'executionMode',
        label: '执行模式',
        description: '任务执行的模式',
        type: PropertyType.SELECT,
        required: false,
        group: 'agent',
        order: 1,
        defaultValue: 'sequential',
        options: [
          { label: '顺序执行', value: 'sequential' },
          { label: '并行执行', value: 'parallel' },
          { label: '优先级执行', value: 'priority' }
        ]
      }
    ]
  },
  {
    id: 'audit_agent',
    name: '审计Agent',
    description: '负责审计和监控的智能体',
    category: NodeCategory.AGENT,
    type: AgentType.AUDIT,
    icon: 'EyeOutlined',
    color: '#eb2f96',
    difficulty: 'advanced',
    featured: false,
    capabilities: [],
    rating: 4.1,
    usageCount: 680,
    tags: ['审计', '监控', '合规检查'],
    author: 'EFIAgent Team',
    version: '1.0.0',

    llmConfig: {
      provider: 'openai',
      model: 'gpt-4',
      temperature: 0.2,
      maxTokens: 8192,
      topP: 0.8,
      frequencyPenalty: 0.1,
      presencePenalty: 0.1
    },
    systemPrompt: '你是一个严谨的审计专家。请仔细检查数据和流程，识别风险和合规问题，提供详细的审计报告。',
    workflow: {
      nodes: [],
      connections: [],
      variables: [
        { name: 'auditData', type: 'object', description: '待审计数据' },
        { name: 'auditRules', type: 'object', description: '审计规则' }
      ],
      triggers: [
        { type: 'event', config: { condition: 'auditData != null' } }
      ]
    },
    reviews: [
        {
          id: 'review3',
          userId: 'user3',
          rating: 4,
          comment: '审计很全面，发现了重要问题。',
          createdAt: new Date('2024-01-13T09:45:00Z')
        }
      ],
    properties: [
      {
        id: 'auditScope',
        name: 'auditScope',
        label: '审计范围',
        description: '审计检查的范围',
        type: PropertyType.MULTI_SELECT,
        required: false,
        group: 'agent',
        order: 1,
        options: [
          { label: '数据完整性', value: 'data_integrity' },
          { label: '流程合规性', value: 'process_compliance' },
          { label: '安全风险', value: 'security_risk' },
          { label: '性能问题', value: 'performance_issue' }
        ]
      }
    ]
  },
  {
    id: 'memory_agent',
    name: '记忆Agent',
    description: '负责存储和检索信息的智能体',
    category: NodeCategory.AGENT,
    type: AgentType.MEMORY,
    icon: 'DatabaseOutlined',
    color: '#fa8c16',
    difficulty: 'intermediate',
    featured: true,
    capabilities: [],
    rating: 4.4,
    usageCount: 950,
    tags: ['记忆', '存储', '检索'],
    author: 'EFIAgent Team',
    version: '1.0.0',

    llmConfig: {
      provider: 'openai',
      model: 'gpt-3.5-turbo',
      temperature: 0.1,
      maxTokens: 4096,
      topP: 0.9,
      frequencyPenalty: 0.0,
      presencePenalty: 0.0
    },
    systemPrompt: '你是一个智能的记忆管理专家。请高效地存储、组织和检索信息，提供准确的记忆内容。',
    workflow: {
      nodes: [],
      connections: [],
      variables: [
        { name: 'memoryQuery', type: 'string', description: '记忆查询' },
        { name: 'memoryType', type: 'string', description: '记忆类型' }
      ],
      triggers: [
        { type: 'event', config: { condition: 'memoryQuery != null' } }
      ]
    },
    reviews: [
        {
          id: 'review4',
          userId: 'user4',
          rating: 5,
          comment: '记忆检索很准确，响应速度快！',
          createdAt: new Date('2024-01-12T14:30:00Z')
        }
      ],
    properties: [
      {
        id: 'memoryType',
        name: 'memoryType',
        label: '记忆类型',
        description: '记忆存储的类型',
        type: PropertyType.SELECT,
        required: false,
        group: 'agent',
        order: 1,
        defaultValue: 'semantic',
        options: [
          { label: '语义记忆', value: 'semantic' },
          { label: '情节记忆', value: 'episodic' },
          { label: '程序记忆', value: 'procedural' },
          { label: '工作记忆', value: 'working' }
        ]
      },
      {
        id: 'retentionPeriod',
        name: 'retentionPeriod',
        label: '保留期限',
        description: '记忆的保留时间（天）',
        type: PropertyType.NUMBER,
        required: false,
        group: 'agent',
        order: 2,
        defaultValue: 30,
        validation: { min: 1, max: 365 }
      }
    ]
  },
  {
    id: 'web_search_agent',
    name: '网络搜索Agent',
    description: '专注于网络搜索和信息收集的智能体',
    category: NodeCategory.AGENT,
    type: AgentType.EXECUTION,
    icon: 'GlobalOutlined',
    color: '#13c2c2',
    difficulty: 'intermediate',
    featured: true,
    capabilities: [],
    rating: 4.3,
    usageCount: 300,
    tags: ['搜索', '信息收集', '网络'],
    author: 'EFIAgent Team',
    version: '1.0.0',
    llmConfig: {
      provider: 'openai',
      model: 'gpt-3.5-turbo',
      temperature: 0.3,
      maxTokens: 2048,
      topP: 0.9,
      frequencyPenalty: 0.0,
      presencePenalty: 0.0
    },
    systemPrompt: '你是一个专业的网络搜索专家。请高效地搜索和收集相关信息，提供准确和有用的搜索结果。',
    workflow: {
      nodes: [],
      connections: [],
      variables: [
        { name: 'searchQuery', type: 'string', description: '搜索查询' },
        { name: 'searchResults', type: 'object', description: '搜索结果' }
      ],
      triggers: [
        { type: 'event', config: { condition: 'searchQuery != null' } }
      ]
    },
    reviews: [
      {
        id: 'review5',
        userId: 'user5',
        rating: 4,
        comment: '搜索结果很准确，覆盖面广！',
        createdAt: new Date('2024-01-11T16:45:00Z')
      }
    ],
    properties: [
      {
        id: 'searchEngine',
        name: 'searchEngine',
        label: '搜索引擎',
        description: '选择使用的搜索引擎',
        type: PropertyType.SELECT,
        required: false,
        group: 'agent',
        order: 1,
        defaultValue: 'google',
        options: [
          { label: 'Google', value: 'google' },
          { label: 'Bing', value: 'bing' },
          { label: 'DuckDuckGo', value: 'duckduckgo' }
        ]
      }
    ]
  },
  {
    id: 'code_assistant_agent',
    name: '代码助手Agent',
    description: '专注于代码生成和执行的智能体',
    category: NodeCategory.AGENT,
    type: AgentType.EXECUTION,
    icon: 'CodeOutlined',
    color: '#eb2f96',
    difficulty: 'advanced',
    featured: true,
    capabilities: [],
    rating: 4.6,
    usageCount: 200,
    tags: ['代码', '编程', '开发'],
    author: 'EFIAgent Team',
    version: '1.0.0',
    llmConfig: {
      provider: 'openai',
      model: 'gpt-4',
      temperature: 0.2,
      maxTokens: 4096,
      topP: 0.9,
      frequencyPenalty: 0.0,
      presencePenalty: 0.0
    },
    systemPrompt: '你是一个专业的代码助手。请帮助用户编写、调试和优化代码，提供高质量的编程解决方案。',
    workflow: {
      nodes: [],
      connections: [],
      variables: [
        { name: 'codeRequest', type: 'string', description: '代码需求' },
        { name: 'codeOutput', type: 'string', description: '生成的代码' }
      ],
      triggers: [
        { type: 'event', config: { condition: 'codeRequest != null' } }
      ]
    },
    reviews: [
      {
        id: 'review6',
        userId: 'user6',
        rating: 5,
        comment: '代码质量很高，解决方案很棒！',
        createdAt: new Date('2024-01-10T13:20:00Z')
      }
    ],
    properties: [
      {
        id: 'programmingLanguage',
        name: 'programmingLanguage',
        label: '编程语言',
        description: '主要使用的编程语言',
        type: PropertyType.SELECT,
        required: false,
        group: 'agent',
        order: 1,
        defaultValue: 'python',
        options: [
          { label: 'Python', value: 'python' },
          { label: 'JavaScript', value: 'javascript' },
          { label: 'Java', value: 'java' },
          { label: 'C++', value: 'cpp' },
          { label: 'Go', value: 'go' }
        ]
      }
    ]
  }
];

// 能力组件模板
const capabilityTemplates: CapabilityComponent[] = [
  // 感知能力
  {
    id: 'web_search',
    name: '网络搜索',
    description: '在互联网上搜索信息',
    category: NodeCategory.CAPABILITY,
    type: CapabilityType.WEB_SEARCH,
    icon: 'GlobalOutlined',
    color: '#1890ff',
    executionMode: 'async',
    timeout: 30000,
    retryCount: 3,
    tags: ['搜索', '网络', '信息获取'],
    author: 'EFIAgent Team',
    version: '1.2.0',
    dependencies: ['axios', 'cheerio'],
    resources: [
      { type: 'cpu', amount: 0.2, unit: 'cores', description: 'CPU处理能力' },
      { type: 'memory', amount: 256, unit: 'MB', description: '内存使用量' }
    ],
    configTemplate: [
      {
        id: 'searchEngine',
        name: 'searchEngine',
        label: '搜索引擎',
        description: '选择搜索引擎',
        type: PropertyType.SELECT,
        required: true,
        defaultValue: 'google',
        options: [
          { label: 'Google', value: 'google' },
          { label: 'Bing', value: 'bing' }
        ]
      }
    ],
    examples: [
      {
        name: '基础搜索',
        description: '搜索关于AI的信息',
        input: { query: '人工智能最新发展' },
        output: { results: [{ title: 'AI发展趋势', url: 'https://example.com', snippet: '...' }] },
        config: { searchEngine: 'google', maxResults: 10 }
      }
    ],
    metrics: {
      avgExecutionTime: 2000,
      successRate: 0.95,
      errorRate: 0.05,
      usageCount: 100
    },

    properties: [
      {
        id: 'searchEngine',
        name: 'searchEngine',
        label: '搜索引擎',
        description: '选择搜索引擎',
        type: PropertyType.SELECT,
        required: true,
        group: 'capability',
        order: 1,
        defaultValue: 'google',
        options: [
          { label: 'Google', value: 'google' },
          { label: 'Bing', value: 'bing' },
          { label: 'DuckDuckGo', value: 'duckduckgo' }
        ]
      }
    ]
  },
  {
    id: 'file_read',
    name: '文件读取',
    description: '读取本地或远程文件内容',
    category: NodeCategory.CAPABILITY,
    type: CapabilityType.FILE_READ,
    icon: 'FileTextOutlined',
    color: '#52c41a',
    executionMode: 'sync',
    timeout: 10000,
    retryCount: 2,
    tags: ['文件', '读取', 'IO'],
    author: 'EFIAgent Team',
    version: '1.1.0',
    dependencies: ['fs', 'path'],
    resources: [
      { type: 'cpu', amount: 0.1, unit: 'cores', description: 'CPU处理能力' },
      { type: 'memory', amount: 128, unit: 'MB', description: '内存使用量' }
    ],
    configTemplate: [
      {
        id: 'encoding',
        name: 'encoding',
        label: '文件编码',
        description: '文件的字符编码',
        type: PropertyType.SELECT,
        required: false,
        defaultValue: 'utf-8',
        options: [
          { label: 'UTF-8', value: 'utf-8' },
          { label: 'GBK', value: 'gbk' }
        ]
      }
    ],
    examples: [
      {
        name: '读取文本文件',
        description: '读取本地文本文件',
        input: { filePath: '/path/to/file.txt' },
        output: { content: '文件内容...' },
        config: { encoding: 'utf-8', bufferSize: 1024 }
      }
    ],
    metrics: {
      avgExecutionTime: 500,
      successRate: 0.98,
      errorRate: 0.02,
      usageCount: 500
    },

    properties: [
      {
        id: 'encoding',
        name: 'encoding',
        label: '文件编码',
        description: '文件的字符编码',
        type: PropertyType.SELECT,
        required: false,
        group: 'capability',
        order: 1,
        defaultValue: 'utf-8',
        options: [
          { label: 'UTF-8', value: 'utf-8' },
          { label: 'GBK', value: 'gbk' },
          { label: 'ASCII', value: 'ascii' }
        ]
      }
    ]
  },
  {
    id: 'image_recognition',
    name: '图像识别',
    description: '识别和分析图像内容',
    category: NodeCategory.CAPABILITY,
    type: CapabilityType.IMAGE_RECOGNITION,
    icon: 'PictureOutlined',
    color: '#722ed1',
    executionMode: 'async',
    timeout: 60000,
    retryCount: 2,
    tags: ['图像', '识别', 'AI'],
    author: 'EFIAgent Team',
    version: '1.0.0',
    dependencies: ['opencv', 'tensorflow'],
    resources: [
      { type: 'cpu', amount: 1.0, unit: 'cores', description: 'CPU处理能力' },
      { type: 'memory', amount: 2048, unit: 'MB', description: '内存使用量' },
      { type: 'gpu', amount: 1, unit: 'units', description: 'GPU计算单元' }
    ],
    configTemplate: [
      {
        id: 'model',
        name: 'model',
        label: '识别模型',
        description: '选择图像识别模型',
        type: PropertyType.SELECT,
        required: true,
        defaultValue: 'yolo-v8',
        options: [
          { label: 'YOLO v8', value: 'yolo-v8' },
          { label: 'ResNet', value: 'resnet' }
        ]
      }
    ],
    examples: [
      {
        name: '物体检测',
        description: '检测图像中的物体',
        input: { image: 'base64_encoded_image' },
        output: { result: [{ object: 'car', confidence: 0.95, bbox: [10, 20, 100, 200] }] },
        config: { model: 'yolo-v8', threshold: 0.5 }
      }
    ],
    metrics: {
      avgExecutionTime: 5000,
      successRate: 0.92,
      errorRate: 0.08,
      usageCount: 20
    },

    properties: [
      {
        id: 'model',
        name: 'model',
        label: '识别模型',
        description: '选择图像识别模型',
        type: PropertyType.SELECT,
        required: true,
        group: 'capability',
        order: 1,
        defaultValue: 'yolo-v8',
        options: [
          { label: 'YOLO v8', value: 'yolo-v8' },
          { label: 'ResNet', value: 'resnet' },
          { label: 'MobileNet', value: 'mobilenet' }
        ]
      }
    ]
  },
  // 推理能力
  {
    id: 'llm_reasoning',
    name: 'LLM推理',
    description: '使用大语言模型进行推理',
    category: NodeCategory.CAPABILITY,
    type: CapabilityType.LLM_REASONING,
    icon: 'BulbOutlined',
    color: '#faad14',
    executionMode: 'async',
    timeout: 120000,
    retryCount: 3,
    tags: ['LLM', '推理', '智能'],
    author: 'EFIAgent Team',
    version: '2.0.0',
    dependencies: ['openai', 'anthropic'],
    resources: [
      { type: 'cpu', amount: 0.5, unit: 'cores', description: 'CPU处理能力' },
      { type: 'memory', amount: 1024, unit: 'MB', description: '内存使用量' }
    ],
    configTemplate: [
      {
        id: 'model',
        name: 'model',
        label: '推理模型',
        description: '选择推理模型',
        type: PropertyType.SELECT,
        required: true,
        defaultValue: 'gpt-4',
        options: [
          { label: 'GPT-4', value: 'gpt-4' },
          { label: 'Claude-3', value: 'claude-3' }
        ]
      }
    ],
    examples: [
      {
        name: '逻辑推理',
        description: '进行逻辑推理分析',
        input: { prompt: '如果所有鸟都会飞，企鹅是鸟，那么企鹅会飞吗？' },
        output: { reasoning: '这是一个逻辑谬误的例子...' },
        config: { model: 'gpt-4', temperature: 0.7 }
      }
    ],
    metrics: {
      avgExecutionTime: 8000,
      successRate: 0.96,
      errorRate: 0.04,
      usageCount: 50
    },
    properties: [
      {
        id: 'model',
        name: 'model',
        label: '推理模型',
        description: '选择推理模型',
        type: PropertyType.SELECT,
        required: true,
        group: 'capability',
        order: 1,
        defaultValue: 'gpt-4',
        options: [
          { label: 'GPT-4', value: 'gpt-4' },
          { label: 'Claude-3', value: 'claude-3' },
          { label: 'Gemini Pro', value: 'gemini-pro' }
        ]
      }
    ]
  },
  {
    id: 'sentiment_analysis',
    name: '情感分析',
    description: '分析文本的情感倾向',
    category: NodeCategory.CAPABILITY,
    type: CapabilityType.SENTIMENT_ANALYSIS,
    icon: 'MessageOutlined',
    color: '#eb2f96',
    executionMode: 'sync',
    timeout: 5000,
    retryCount: 2,
    tags: ['情感', '分析', 'NLP'],
    author: 'EFIAgent Team',
    version: '1.0.0',
    dependencies: ['transformers', 'torch'],
    resources: [
      { type: 'cpu', amount: 0.3, unit: 'cores', description: 'CPU处理能力' },
      { type: 'memory', amount: 512, unit: 'MB', description: '内存使用量' }
    ],
    configTemplate: [
      {
        id: 'model',
        name: 'model',
        label: '分析模型',
        description: '选择情感分析模型',
        type: PropertyType.SELECT,
        required: true,
        defaultValue: 'bert-base-chinese',
        options: [
          { label: 'BERT中文', value: 'bert-base-chinese' },
          { label: 'RoBERTa', value: 'roberta-base' }
        ]
      }
    ],
    examples: [
      {
        name: '情感分析',
        description: '分析文本情感',
        input: { text: '今天天气真好，心情很愉快！' },
        output: { sentiment: 'positive', confidence: 0.95 },
        config: { model: 'bert-base-chinese', batchSize: 32 }
      }
    ],
    metrics: {
      avgExecutionTime: 1000,
      successRate: 0.94,
      errorRate: 0.06,
      usageCount: 200
    },

    properties: [
      {
        id: 'model',
        name: 'model',
        label: '分析模型',
        description: '选择情感分析模型',
        type: PropertyType.SELECT,
        required: true,
        group: 'capability',
        order: 1,
        defaultValue: 'bert-base-chinese',
        options: [
          { label: 'BERT中文', value: 'bert-base-chinese' },
          { label: 'RoBERTa', value: 'roberta-base' },
          { label: 'DistilBERT', value: 'distilbert-base' }
        ]
      }
    ]
  },
  // 行动能力
  {
    id: 'api_call',
    name: 'API调用',
    description: '调用外部API接口',
    category: NodeCategory.CAPABILITY,
    type: CapabilityType.API_CALL,
    icon: 'ApiOutlined',
    color: '#13c2c2',
    executionMode: 'async',
    timeout: 30000,
    retryCount: 3,
    tags: ['API', '调用', '集成'],
    author: 'EFIAgent Team',
    version: '1.3.0',
    dependencies: ['axios', 'fetch'],
    resources: [
      { type: 'cpu', amount: 0.1, unit: 'cores', description: 'CPU处理能力' },
      { type: 'memory', amount: 128, unit: 'MB', description: '内存使用量' }
    ],
    configTemplate: [
      {
        id: 'method',
        name: 'method',
        label: 'HTTP方法',
        description: 'HTTP请求方法',
        type: PropertyType.SELECT,
        required: true,
        defaultValue: 'GET',
        options: [
          { label: 'GET', value: 'GET' },
          { label: 'POST', value: 'POST' }
        ]
      }
    ],
    examples: [
      {
        name: 'REST API调用',
        description: '调用REST API获取数据',
        input: { request: { url: 'https://api.example.com/users', method: 'GET' } },
        output: { response: { status: 200, data: [{ id: 1, name: 'John' }] } },
        config: { method: 'GET', timeout: 30000 }
      }
    ],
    metrics: {
      avgExecutionTime: 1500,
      successRate: 0.95,
      errorRate: 0.05,
      usageCount: 200
    },

    properties: [
      {
        id: 'method',
        name: 'method',
        label: 'HTTP方法',
        description: 'HTTP请求方法',
        type: PropertyType.SELECT,
        required: true,
        group: 'capability',
        order: 1,
        defaultValue: 'GET',
        options: [
          { label: 'GET', value: 'GET' },
          { label: 'POST', value: 'POST' },
          { label: 'PUT', value: 'PUT' },
          { label: 'DELETE', value: 'DELETE' }
        ]
      }
    ]
  },
  {
    id: 'file_write',
    name: '文件写入',
    description: '写入内容到文件',
    category: NodeCategory.CAPABILITY,
    type: CapabilityType.FILE_WRITE,
    icon: 'FileTextOutlined',
    color: '#fa8c16',
    executionMode: 'sync',
    timeout: 10000,
    retryCount: 2,
    tags: ['文件', '写入', 'IO'],
    author: 'EFIAgent Team',
    version: '1.1.0',
    dependencies: ['fs', 'path'],
    resources: [
      { type: 'cpu', amount: 0.1, unit: 'cores', description: 'CPU处理能力' },
      { type: 'memory', amount: 128, unit: 'MB', description: '内存使用量' }
    ],
    configTemplate: [
      {
        id: 'encoding',
        name: 'encoding',
        label: '文件编码',
        description: '文件的字符编码',
        type: PropertyType.SELECT,
        required: false,
        defaultValue: 'utf-8',
        options: [
          { label: 'UTF-8', value: 'utf-8' },
          { label: 'GBK', value: 'gbk' }
        ]
      }
    ],
    examples: [
      {
        name: '写入文本文件',
        description: '将内容写入文本文件',
        input: { filePath: '/path/to/output.txt', content: '要写入的内容' },
        output: { success: true },
        config: { encoding: 'utf-8', append: false }
      }
    ],
    metrics: {
      avgExecutionTime: 300,
      successRate: 0.99,
      errorRate: 0.01,
      usageCount: 1000
    },

    properties: [
      {
        id: 'encoding',
        name: 'encoding',
        label: '文件编码',
        description: '文件的字符编码',
        type: PropertyType.SELECT,
        required: false,
        group: 'capability',
        order: 1,
        defaultValue: 'utf-8',
        options: [
          { label: 'UTF-8', value: 'utf-8' },
          { label: 'GBK', value: 'gbk' },
          { label: 'ASCII', value: 'ascii' }
        ]
      }
    ]
  },
  {
    id: 'email_send',
    name: '邮件发送',
    description: '发送电子邮件',
    category: NodeCategory.CAPABILITY,
    type: CapabilityType.EMAIL_SEND,
    icon: 'MailOutlined',
    color: '#ff4d4f',
    executionMode: 'async',
    timeout: 15000,
    retryCount: 3,
    tags: ['邮件', '发送', '通知'],
    author: 'EFIAgent Team',
    version: '1.0.0',
    dependencies: ['nodemailer'],
    resources: [
      { type: 'cpu', amount: 0.1, unit: 'cores', description: 'CPU处理能力' },
      { type: 'memory', amount: 128, unit: 'MB', description: '内存使用量' }
    ],
    configTemplate: [
      {
        id: 'smtpHost',
        name: 'smtpHost',
        label: 'SMTP服务器',
        description: 'SMTP服务器地址',
        type: PropertyType.STRING,
        required: true,
        defaultValue: 'smtp.gmail.com'
      }
    ],
    examples: [
      {
        name: '发送通知邮件',
        description: '发送系统通知邮件',
        input: { to: 'user@example.com', subject: '系统通知', body: '这是一条系统通知' },
        output: { success: true, messageId: 'msg123' },
        config: { smtpHost: 'smtp.gmail.com', port: 587 }
      }
    ],
    metrics: {
      avgExecutionTime: 3000,
      successRate: 0.97,
      errorRate: 0.03,
      usageCount: 100
    },

    properties: [
      {
        id: 'smtpHost',
        name: 'smtpHost',
        label: 'SMTP服务器',
        description: 'SMTP服务器地址',
        type: PropertyType.STRING,
        required: true,
        group: 'capability',
        order: 1,
        defaultValue: 'smtp.gmail.com'
      }
    ]
  },
  {
    id: 'code_execution',
    name: '代码执行',
    description: '执行代码片段',
    category: NodeCategory.CAPABILITY,
    type: CapabilityType.CODE_EXECUTION,
    icon: 'CodeOutlined',
    color: '#722ed1',
    executionMode: 'async',
    timeout: 60000,
    retryCount: 1,
    tags: ['代码', '执行', '编程'],
    author: 'EFIAgent Team',
    version: '1.0.0',
    dependencies: ['vm', 'child_process'],
    resources: [
      { type: 'cpu', amount: 1.0, unit: 'cores', description: 'CPU处理能力' },
      { type: 'memory', amount: 1024, unit: 'MB', description: '内存使用量' }
    ],
    configTemplate: [
      {
        id: 'language',
        name: 'language',
        label: '编程语言',
        description: '选择代码执行语言',
        type: PropertyType.SELECT,
        required: true,
        defaultValue: 'javascript',
        options: [
          { label: 'JavaScript', value: 'javascript' },
          { label: 'Python', value: 'python' }
        ]
      }
    ],
    examples: [
      {
        name: 'JavaScript执行',
        description: '执行JavaScript代码',
        input: { code: 'console.log("Hello World"); return 42;', language: 'javascript' },
        output: { result: 42, output: 'Hello World' },
        config: { language: 'javascript', timeout: 60000 }
      }
    ],
    metrics: {
      avgExecutionTime: 2000,
      successRate: 0.90,
      errorRate: 0.10,
      usageCount: 50
    },

    properties: [
      {
        id: 'language',
        name: 'language',
        label: '编程语言',
        description: '选择代码执行语言',
        type: PropertyType.SELECT,
        required: true,
        group: 'capability',
        order: 1,
        defaultValue: 'javascript',
        options: [
          { label: 'JavaScript', value: 'javascript' },
          { label: 'Python', value: 'python' },
          { label: 'Shell', value: 'shell' }
        ]
      }
    ]
  },
  // 记忆能力
  {
    id: 'memory_storage',
    name: '记忆存储',
    description: '存储和管理记忆信息',
    category: NodeCategory.CAPABILITY,
    type: CapabilityType.MEMORY_STORAGE,
    icon: 'DatabaseOutlined',
    color: '#52c41a',
    executionMode: 'sync',
    timeout: 5000,
    retryCount: 2,
    tags: ['记忆', '存储', '数据'],
    author: 'EFIAgent Team',
    version: '1.0.0',
    dependencies: ['mongodb', 'redis'],
    resources: [
      { type: 'cpu', amount: 0.2, unit: 'cores', description: 'CPU处理能力' },
      { type: 'memory', amount: 256, unit: 'MB', description: '内存使用量' }
    ],
    configTemplate: [
      {
        id: 'database',
        name: 'database',
        label: '数据库类型',
        description: '选择记忆存储的数据库类型',
        type: PropertyType.SELECT,
        required: true,
        defaultValue: 'mongodb',
        options: [
          { label: 'MongoDB', value: 'mongodb' },
          { label: 'Redis', value: 'redis' }
        ]
      }
    ],
    examples: [
      {
        name: '存储记忆',
        description: '存储用户对话记忆',
        input: { memory: { type: 'conversation', content: '用户询问了关于AI的问题', timestamp: '2024-01-01T10:00:00Z' } },
        output: { success: true, memoryId: 'mem123' },
        config: { database: 'mongodb', ttl: 86400 }
      }
    ],
    metrics: {
      avgExecutionTime: 200,
      successRate: 0.99,
      errorRate: 0.01,
      usageCount: 2000
    },
    properties: [
      {
        id: 'memoryType',
        name: 'memoryType',
        label: '记忆类型',
        description: '记忆的分类类型',
        type: PropertyType.SELECT,
        required: false,
        group: 'capability',
        order: 1,
        defaultValue: 'general',
        options: [
          { label: '通用记忆', value: 'general' },
          { label: '对话记忆', value: 'conversation' },
          { label: '任务记忆', value: 'task' }
        ]
      }
    ]
  },
  {
    id: 'vector_search',
    name: '向量搜索',
    description: '基于向量的相似性搜索',
    category: NodeCategory.CAPABILITY,
    type: CapabilityType.VECTOR_SEARCH,
    icon: 'SearchOutlined',
    color: '#1890ff',
    executionMode: 'async',
    timeout: 10000,
    retryCount: 2,
    tags: ['向量', '搜索', '相似性'],
    author: 'EFIAgent Team',
    version: '1.0.0',
    dependencies: ['faiss', 'numpy'],
    resources: [
      { type: 'cpu', amount: 0.5, unit: 'cores', description: 'CPU处理能力' },
      { type: 'memory', amount: 1024, unit: 'MB', description: '内存使用量' },
      { type: 'gpu', amount: 1, unit: 'units', description: 'GPU加速计算' }
    ],
    configTemplate: [
      {
        id: 'dimension',
        name: 'dimension',
        label: '向量维度',
        description: '向量的维度，用于表示文本的特征',
        type: PropertyType.NUMBER,
        required: true,
        defaultValue: 768
      }
    ],
    examples: [
      {
        name: '相似性搜索',
        description: '搜索相似的文本向量',
        input: { query: '人工智能的应用', topK: 5 },
        output: { results: [{ text: 'AI在医疗领域的应用', similarity: 0.85 }] },
        config: { dimension: 768, threshold: 0.7 }
      }
    ],
    metrics: {
      avgExecutionTime: 800,
      successRate: 0.96,
      errorRate: 0.04,
      usageCount: 300
    },

    properties: [
      {
        id: 'topK',
        name: 'topK',
        label: '返回数量',
        description: '返回最相似的结果数量',
        type: PropertyType.NUMBER,
        required: false,
        group: 'capability',
        order: 1,
        defaultValue: 10,
        validation: { min: 1, max: 100 }
      }
    ]
  },
  // 通信能力
  {
    id: 'webhook',
    name: 'Webhook',
    description: '接收和处理Webhook请求',
    category: NodeCategory.CAPABILITY,
    type: CapabilityType.WEBHOOK,
    icon: 'LinkOutlined',
    color: '#fa8c16',
    executionMode: 'async',
    timeout: 30000,
    retryCount: 3,
    tags: ['Webhook', '通信', '集成'],
    author: 'EFIAgent Team',
    version: '1.0.0',
    dependencies: ['express', 'body-parser'],
    resources: [
      { type: 'cpu', amount: 0.1, unit: 'cores', description: 'CPU处理能力' },
      { type: 'memory', amount: 128, unit: 'MB', description: '内存使用量' },
      { type: 'network', amount: 100, unit: 'Mbps', description: '网络带宽' }
    ],
    configTemplate: [
      {
        id: 'port',
        name: 'port',
        label: '监听端口',
        description: 'Webhook服务监听的端口',
        type: PropertyType.NUMBER,
        required: true,
        defaultValue: 3000
      }
    ],
    examples: [
      {
        name: 'GitHub Webhook',
        description: '处理GitHub推送事件',
        input: { event: 'push', repository: 'my-repo', commits: [] },
        output: { processed: true, action: 'deploy' },
        config: { port: 3000, secret: 'webhook_secret' }
      }
    ],
    metrics: {
      avgExecutionTime: 100,
      successRate: 0.98,
      errorRate: 0.02,
      usageCount: 500
    },

    properties: [
      {
        id: 'port',
        name: 'port',
        label: '监听端口',
        description: 'Webhook服务监听的端口',
        type: PropertyType.NUMBER,
        required: true,
        group: 'capability',
        order: 1,
        defaultValue: 3000,
        validation: { min: 1000, max: 65535 }
      }
    ]
  }
];

const EnhancedNodePalette: React.FC<EnhancedNodePaletteProps> = ({
  onAddNode,
  onDragStart,
  onDragEnd,
  className
}) => {
  const [searchText, setSearchText] = useState('');
  const [activeKey, setActiveKey] = useState(['control', 'agents', 'capabilities']);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // 图标映射
  const iconMap: Record<string, React.ReactNode> = {
    PlayCircleOutlined: <PlayCircleOutlined />,
    StopOutlined: <StopOutlined />,
    BranchesOutlined: <BranchesOutlined />,
    SyncOutlined: <SyncOutlined />,
    MergeOutlined: <MergeOutlined />,
    ReloadOutlined: <ReloadOutlined />,
    ClockCircleOutlined: <ClockCircleOutlined />,
    ExclamationCircleOutlined: <ExclamationCircleOutlined />,
    RobotOutlined: <RobotOutlined />,
    ThunderboltOutlined: <ThunderboltOutlined />,
    EyeOutlined: <EyeOutlined />,
    DatabaseOutlined: <DatabaseOutlined />,
    GlobalOutlined: <GlobalOutlined />,
    FileTextOutlined: <FileTextOutlined />,
    PictureOutlined: <PictureOutlined />,
    BulbOutlined: <BulbOutlined />,
    MessageOutlined: <MessageOutlined />,
    ApiOutlined: <ApiOutlined />,
    MailOutlined: <MailOutlined />,
    CodeOutlined: <CodeOutlined />,
    SearchOutlined: <SearchOutlined />,
    LinkOutlined: <LinkOutlined />
  };

  // 合并所有节点
  const allNodes = useMemo(() => {
    return [
      ...controlNodeTemplates,
      ...agentTemplates,
      ...capabilityTemplates
    ];
  }, []);

  // 过滤节点
  const filteredNodes = useMemo(() => {
    return allNodes.filter(node => {
      const matchesSearch = searchText === '' || 
        node.name.toLowerCase().includes(searchText.toLowerCase()) ||
        node.description.toLowerCase().includes(searchText.toLowerCase()) ||
        (node.tags && node.tags.some(tag => tag.toLowerCase().includes(searchText.toLowerCase())));
      
      const matchesCategory = selectedCategory === 'all' || node.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [allNodes, searchText, selectedCategory]);

  // 按类别分组
  const nodesByCategory = useMemo(() => {
    const grouped = filteredNodes.reduce((acc, node) => {
      if (!acc[node.category]) {
        acc[node.category] = [];
      }
      acc[node.category].push(node);
      return acc;
    }, {} as Record<string, BaseNode[]>);
    return grouped;
  }, [filteredNodes]);

  // 类别配置
  const categoryConfig = {
    [NodeCategory.CONTROL]: {
      title: '控制节点',
      description: '工作流控制和逻辑节点',
      icon: <SettingOutlined />
    },
    [NodeCategory.AGENT]: {
      title: 'Agent节点',
      description: '智能体执行节点',
      icon: <RobotOutlined />
    },
    [NodeCategory.CAPABILITY]: {
      title: '能力组件',
      description: '可复用的功能组件',
      icon: <ToolOutlined />
    }
  };

  // 处理拖拽开始
  const handleDragStart = (event: React.DragEvent, node: BaseNode) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify(node));
    event.dataTransfer.effectAllowed = 'move';
    onDragStart?.(node);
  };

  // 处理拖拽结束
  const handleDragEnd = () => {
    onDragEnd?.();
  };

  // 渲染节点项
  const renderNodeItem = (node: BaseNode) => {
    const isAgent = 'type' in node && 'rating' in node;
    const isCapability = 'executionMode' in node;
    
    return (
      <div
        key={node.id}
        className="enhanced-node-item"
        draggable
        onDragStart={(e) => handleDragStart(e, node)}
        onDragEnd={handleDragEnd}
        onClick={() => onAddNode(node)}
      >
        <div className="node-item-header">
          <div className="node-item-icon" style={{ color: node.color }}>
            {node.icon && iconMap[node.icon]}
          </div>
          <div className="node-item-meta">
            {isAgent && (
              <div className="node-item-rating">
                <Rate disabled defaultValue={(node as AgentTemplate).rating} />
                <Text type="secondary" style={{ fontSize: '11px', marginLeft: '4px' }}>
                  ({(node as AgentTemplate).usageCount})
                </Text>
              </div>
            )}
            {isCapability && (
              <div className="node-item-mode">
                <Tag color={(node as CapabilityComponent).executionMode === 'async' ? 'blue' : 'green'}>
                  {(node as CapabilityComponent).executionMode}
                </Tag>
              </div>
            )}
          </div>
          <div className="node-item-drag">
            <DragOutlined />
          </div>
        </div>
        
        <div className="node-item-content">
          <div className="node-item-name">{node.name}</div>
          <div className="node-item-description">{node.description}</div>
          
          {node.tags && node.tags.length > 0 && (
            <div className="node-item-tags">
              {node.tags.slice(0, 3).map(tag => (
                <Tag key={tag}>{tag}</Tag>
              ))}
            </div>
          )}
          
          <div className="node-item-footer">
            {node.author && (
              <div className="node-item-author">
                <Avatar size={16} icon={<UserOutlined />} />
                <Text type="secondary" style={{ fontSize: '11px', marginLeft: '4px' }}>
                  {node.author}
                </Text>
              </div>
            )}
            {node.version && (
              <Text type="secondary" style={{ fontSize: '11px' }}>
                v{node.version}
              </Text>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card 
      className={`enhanced-node-palette ${className || ''}`}
      title="组件库"
      
      extra={
        <Badge 
          count={filteredNodes.length} 
          style={{ backgroundColor: '#1890ff' }}
        />
      }
    >
      {/* 搜索框 */}
      <div className="palette-search">
        <Search
          placeholder="搜索组件..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          prefix={<SearchOutlined />}
          allowClear
          
        />
      </div>

      {/* 类别过滤 */}
      <div className="palette-filters">
        <Space wrap>
          <Button 
             
            type={selectedCategory === 'all' ? 'primary' : 'default'}
            onClick={() => setSelectedCategory('all')}
          >
            全部
          </Button>
          {Object.entries(categoryConfig).map(([category, config]) => (
            <Button 
              key={category}
               
              type={selectedCategory === category ? 'primary' : 'default'}
              icon={config.icon}
              onClick={() => setSelectedCategory(category)}
            >
              {config.title}
            </Button>
          ))}
        </Space>
      </div>

      <Divider style={{ margin: '12px 0' }} />

      {/* 节点分类 */}
      {Object.keys(nodesByCategory).length > 0 ? (
        <Collapse 
          activeKey={activeKey}
          onChange={setActiveKey}
          
          ghost
        >
          {Object.entries(nodesByCategory).map(([category, nodes]) => {
            const config = categoryConfig[category as keyof typeof categoryConfig];
            if (!config) return null;
            
            return (
              <Panel 
                key={category}
                header={
                  <div className="category-header">
                    <Space>
                      {config.icon}
                      <span className="category-title">{config.title}</span>
                    </Space>
                    <Badge 
                      count={nodes.length} 
                       
                      style={{ backgroundColor: '#f0f0f0', color: '#666' }}
                    />
                  </div>
                }
              >
                <div className="category-description">
                  {config.description}
                </div>
                <div className="node-grid">
                  {nodes.map(renderNodeItem)}
                </div>
              </Panel>
            );
          })}
        </Collapse>
      ) : (
        <Empty 
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="没有找到匹配的组件"
          style={{ margin: '20px 0' }}
        />
      )}

      {/* 使用提示 */}
      <div className="palette-tips">
        <div className="tip-item">
          <span className="tip-icon">💡</span>
          <span className="tip-text">拖拽组件到画布或点击添加</span>
        </div>
        <div className="tip-item">
          <span className="tip-icon">🔗</span>
          <span className="tip-text">连接组件创建工作流</span>
        </div>
        <div className="tip-item">
          <span className="tip-icon">⚙️</span>
          <span className="tip-text">双击组件进行配置</span>
        </div>
      </div>
    </Card>
  );
};

export default EnhancedNodePalette;