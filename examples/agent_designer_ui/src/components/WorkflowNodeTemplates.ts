/**
 * EFIAgent 2.0 工作流节点模板库
 * 提供预定义的常用节点模板和配置
 */

import {
  WorkflowNode,
  CoreCapabilityType,
  WorkflowNodeType
} from './CapabilitySystemTypes';

/**
 * 节点模板接口
 */
export interface NodeTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  type: WorkflowNodeType;
  defaultConfig: any;
  inputPorts: NodePortTemplate[];
  outputPorts: NodePortTemplate[];
  tags: string[];
  complexity: 'simple' | 'medium' | 'complex';
  documentation?: string;
  examples?: any[];
}

/**
 * 端口模板接口
 */
export interface NodePortTemplate {
  id: string;
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'any';
  required: boolean;
  description: string;
  defaultValue?: any;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    enum?: any[];
    format?: string;
  };
}

/**
 * 节点分类
 */
export enum NodeCategory {
  DATA_PROCESSING = 'data_processing',
  API_INTEGRATION = 'api_integration',
  CONTROL_FLOW = 'control_flow',
  TRANSFORMATION = 'transformation',
  VALIDATION = 'validation',
  NOTIFICATION = 'notification',
  DATABASE = 'database',
  FILE_OPERATIONS = 'file_operations',
  AI_CAPABILITIES = 'ai_capabilities',
  CUSTOM = 'custom'
}

/**
 * 预定义节点模板
 */
export const NODE_TEMPLATES: NodeTemplate[] = [
  // 数据处理类节点
  {
    id: 'data_filter',
    name: '数据过滤器',
    description: '根据指定条件过滤数据集合',
    category: NodeCategory.DATA_PROCESSING,
    icon: 'FilterOutlined',
    type: WorkflowNodeType.PROCESSING,
    defaultConfig: {
      filterType: 'include',
      conditions: [],
      caseSensitive: false
    },
    inputPorts: [
      {
        id: 'data',
        name: '输入数据',
        type: 'array',
        required: true,
        description: '需要过滤的数据集合'
      },
      {
        id: 'conditions',
        name: '过滤条件',
        type: 'object',
        required: true,
        description: '过滤条件配置'
      }
    ],
    outputPorts: [
      {
        id: 'filtered_data',
        name: '过滤结果',
        type: 'array',
        required: true,
        description: '过滤后的数据集合'
      },
      {
        id: 'count',
        name: '结果数量',
        type: 'number',
        required: true,
        description: '过滤后的数据数量'
      }
    ],
    tags: ['数据处理', '过滤', '筛选'],
    complexity: 'simple'
  },
  {
    id: 'data_mapper',
    name: '数据映射器',
    description: '将输入数据映射为指定格式的输出数据',
    category: NodeCategory.TRANSFORMATION,
    icon: 'SwapOutlined',
    type: WorkflowNodeType.PROCESSING,
    defaultConfig: {
      mappingRules: [],
      preserveOriginal: false,
      errorHandling: 'skip'
    },
    inputPorts: [
      {
        id: 'source_data',
        name: '源数据',
        type: 'any',
        required: true,
        description: '需要映射的源数据'
      },
      {
        id: 'mapping_config',
        name: '映射配置',
        type: 'object',
        required: true,
        description: '数据映射规则配置'
      }
    ],
    outputPorts: [
      {
        id: 'mapped_data',
        name: '映射结果',
        type: 'any',
        required: true,
        description: '映射后的数据'
      }
    ],
    tags: ['数据转换', '映射', '格式化'],
    complexity: 'medium'
  },
  
  // API集成类节点
  {
    id: 'http_request',
    name: 'HTTP请求',
    description: '发送HTTP请求并处理响应',
    category: NodeCategory.API_INTEGRATION,
    icon: 'ApiOutlined',
    type: WorkflowNodeType.INTEGRATION,
    defaultConfig: {
      method: 'GET',
      timeout: 30000,
      retries: 3,
      headers: {},
      validateSSL: true
    },
    inputPorts: [
      {
        id: 'url',
        name: '请求URL',
        type: 'string',
        required: true,
        description: 'HTTP请求的目标URL'
      },
      {
        id: 'headers',
        name: '请求头',
        type: 'object',
        required: false,
        description: 'HTTP请求头信息'
      },
      {
        id: 'body',
        name: '请求体',
        type: 'any',
        required: false,
        description: 'HTTP请求体数据'
      }
    ],
    outputPorts: [
      {
        id: 'response',
        name: '响应数据',
        type: 'any',
        required: true,
        description: 'HTTP响应数据'
      },
      {
        id: 'status_code',
        name: '状态码',
        type: 'number',
        required: true,
        description: 'HTTP响应状态码'
      },
      {
        id: 'headers',
        name: '响应头',
        type: 'object',
        required: true,
        description: 'HTTP响应头信息'
      }
    ],
    tags: ['API', 'HTTP', '网络请求'],
    complexity: 'medium'
  },
  
  // 控制流类节点
  {
    id: 'condition_branch',
    name: '条件分支',
    description: '根据条件判断选择执行路径',
    category: NodeCategory.CONTROL_FLOW,
    icon: 'BranchesOutlined',
    type: WorkflowNodeType.CONDITION,
    defaultConfig: {
      operator: 'equals',
      caseSensitive: false,
      defaultPath: 'false'
    },
    inputPorts: [
      {
        id: 'condition',
        name: '判断条件',
        type: 'any',
        required: true,
        description: '用于判断的条件值'
      },
      {
        id: 'compare_value',
        name: '比较值',
        type: 'any',
        required: false,
        description: '用于比较的参考值'
      }
    ],
    outputPorts: [
      {
        id: 'true_path',
        name: '真分支',
        type: 'any',
        required: true,
        description: '条件为真时的输出'
      },
      {
        id: 'false_path',
        name: '假分支',
        type: 'any',
        required: true,
        description: '条件为假时的输出'
      }
    ],
    tags: ['控制流', '条件', '分支'],
    complexity: 'simple'
  },
  {
    id: 'loop_iterator',
    name: '循环迭代器',
    description: '对数据集合进行循环迭代处理',
    category: NodeCategory.CONTROL_FLOW,
    icon: 'ReloadOutlined',
    type: WorkflowNodeType.CONTROL,
    defaultConfig: {
      maxIterations: 1000,
      breakOnError: true,
      collectResults: true
    },
    inputPorts: [
      {
        id: 'collection',
        name: '迭代集合',
        type: 'array',
        required: true,
        description: '需要迭代的数据集合'
      },
      {
        id: 'item_processor',
        name: '项目处理器',
        type: 'any',
        required: true,
        description: '处理每个迭代项的逻辑'
      }
    ],
    outputPorts: [
      {
        id: 'results',
        name: '迭代结果',
        type: 'array',
        required: true,
        description: '所有迭代项的处理结果'
      },
      {
        id: 'count',
        name: '处理数量',
        type: 'number',
        required: true,
        description: '成功处理的项目数量'
      }
    ],
    tags: ['控制流', '循环', '迭代'],
    complexity: 'medium'
  },
  
  // AI能力类节点
  {
    id: 'text_analysis',
    name: '文本分析',
    description: '使用AI能力分析文本内容',
    category: NodeCategory.AI_CAPABILITIES,
    icon: 'FileTextOutlined',
    type: WorkflowNodeType.CAPABILITY,
    defaultConfig: {
      analysisType: 'sentiment',
      language: 'auto',
      confidence: 0.8
    },
    inputPorts: [
      {
        id: 'text',
        name: '输入文本',
        type: 'string',
        required: true,
        description: '需要分析的文本内容'
      },
      {
        id: 'options',
        name: '分析选项',
        type: 'object',
        required: false,
        description: '文本分析的配置选项'
      }
    ],
    outputPorts: [
      {
        id: 'analysis_result',
        name: '分析结果',
        type: 'object',
        required: true,
        description: '文本分析的结果数据'
      },
      {
        id: 'confidence',
        name: '置信度',
        type: 'number',
        required: true,
        description: '分析结果的置信度'
      }
    ],
    tags: ['AI', '文本分析', 'NLP'],
    complexity: 'complex'
  },
  
  // 数据验证类节点
  {
    id: 'data_validator',
    name: '数据验证器',
    description: '验证数据是否符合指定的规则和格式',
    category: NodeCategory.VALIDATION,
    icon: 'CheckCircleOutlined',
    type: WorkflowNodeType.VALIDATION,
    defaultConfig: {
      strictMode: true,
      stopOnFirstError: false,
      validationRules: []
    },
    inputPorts: [
      {
        id: 'data',
        name: '待验证数据',
        type: 'any',
        required: true,
        description: '需要验证的数据'
      },
      {
        id: 'schema',
        name: '验证规则',
        type: 'object',
        required: true,
        description: '数据验证的规则定义'
      }
    ],
    outputPorts: [
      {
        id: 'is_valid',
        name: '验证结果',
        type: 'boolean',
        required: true,
        description: '数据是否通过验证'
      },
      {
        id: 'errors',
        name: '错误信息',
        type: 'array',
        required: true,
        description: '验证失败的错误详情'
      },
      {
        id: 'validated_data',
        name: '验证后数据',
        type: 'any',
        required: true,
        description: '经过验证处理的数据'
      }
    ],
    tags: ['验证', '数据质量', '规则检查'],
    complexity: 'medium'
  },
  
  // 通知类节点
  {
    id: 'notification_sender',
    name: '通知发送器',
    description: '发送各种类型的通知消息',
    category: NodeCategory.NOTIFICATION,
    icon: 'BellOutlined',
    type: WorkflowNodeType.ACTION,
    defaultConfig: {
      notificationType: 'email',
      priority: 'normal',
      retryOnFailure: true
    },
    inputPorts: [
      {
        id: 'recipients',
        name: '接收者',
        type: 'array',
        required: true,
        description: '通知接收者列表'
      },
      {
        id: 'message',
        name: '消息内容',
        type: 'string',
        required: true,
        description: '要发送的消息内容'
      },
      {
        id: 'template',
        name: '消息模板',
        type: 'object',
        required: false,
        description: '消息模板配置'
      }
    ],
    outputPorts: [
      {
        id: 'send_result',
        name: '发送结果',
        type: 'object',
        required: true,
        description: '通知发送的结果状态'
      },
      {
        id: 'delivery_status',
        name: '投递状态',
        type: 'array',
        required: true,
        description: '每个接收者的投递状态'
      }
    ],
    tags: ['通知', '消息', '邮件'],
    complexity: 'medium'
  }
];

/**
 * 根据分类获取节点模板
 */
export function getTemplatesByCategory(category: NodeCategory): NodeTemplate[] {
  return NODE_TEMPLATES.filter(template => template.category === category);
}

/**
 * 根据标签搜索节点模板
 */
export function searchTemplatesByTag(tag: string): NodeTemplate[] {
  return NODE_TEMPLATES.filter(template => 
    template.tags.some(t => t.toLowerCase().includes(tag.toLowerCase()))
  );
}

/**
 * 根据复杂度获取节点模板
 */
export function getTemplatesByComplexity(complexity: 'simple' | 'medium' | 'complex'): NodeTemplate[] {
  return NODE_TEMPLATES.filter(template => template.complexity === complexity);
}

/**
 * 获取所有节点分类
 */
export function getAllCategories(): { key: NodeCategory; label: string; icon: string }[] {
  return [
    { key: NodeCategory.DATA_PROCESSING, label: '数据处理', icon: 'DatabaseOutlined' },
    { key: NodeCategory.API_INTEGRATION, label: 'API集成', icon: 'ApiOutlined' },
    { key: NodeCategory.CONTROL_FLOW, label: '控制流', icon: 'BranchesOutlined' },
    { key: NodeCategory.TRANSFORMATION, label: '数据转换', icon: 'SwapOutlined' },
    { key: NodeCategory.VALIDATION, label: '数据验证', icon: 'CheckCircleOutlined' },
    { key: NodeCategory.NOTIFICATION, label: '通知服务', icon: 'BellOutlined' },
    { key: NodeCategory.DATABASE, label: '数据库', icon: 'DatabaseOutlined' },
    { key: NodeCategory.FILE_OPERATIONS, label: '文件操作', icon: 'FileOutlined' },
    { key: NodeCategory.AI_CAPABILITIES, label: 'AI能力', icon: 'RobotOutlined' },
    { key: NodeCategory.CUSTOM, label: '自定义', icon: 'SettingOutlined' }
  ];
}

/**
 * 创建节点实例
 */
export function createNodeFromTemplate(
  template: NodeTemplate,
  position: { x: number; y: number },
  customConfig?: any
): WorkflowNode {
  const nodeId = `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  return {
    id: nodeId,
    name: template.name,
    description: template.description,
    type: template.type,
    position,
    inputs: template.inputPorts.map(port => ({
      id: port.id,
      name: port.name,
      dataType: port.type,
      required: port.required,
      description: port.description,
      value: port.defaultValue,
      connected: false
    })),
    outputs: template.outputPorts.map(port => ({
      id: port.id,
      name: port.name,
      dataType: port.type,
      description: port.description,
      value: port.defaultValue,
      connected: false
    })),
    config: {
      ...template.defaultConfig,
      ...customConfig,
      templateId: template.id,
      category: template.category,
      tags: template.tags,
      complexity: template.complexity
    },
    metadata: {
      createdAt: new Date(),
      updatedAt: new Date(),
      version: '1.0.0',
      templateId: template.id
    }
  };
}