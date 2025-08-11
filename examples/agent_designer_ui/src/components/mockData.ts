/**
 * 模拟数据文件
 * 用于前端开发和测试阶段使用
 */

import {
  Component,
  ComponentType,
  ComponentCategory,
  AgentType,
  AgentStatus,
  PropertyType,
  CapabilityConfig,
  AgentTemplate,
  AgentInstance,
  Workflow,
  NodeCategory
} from './types';

// Define ConnectionType if not in types.ts
// 未使用的变量已注释
// const ConnectionType = {
//   DEFAULT: 'default',
//   DATA_FLOW: 'data_flow',
//   CONTROL_FLOW: 'control_flow'
// } as const;

// 模拟Agent类型数据
export const agentTypes = [
  {
    id: 'planning',
    name: '规划Agent',
    description: '负责任务分解和规划的Agent',
    icon: 'planning-icon.svg'
  },
  {
    id: 'execution',
    name: '执行Agent',
    description: '负责执行具体任务的Agent',
    icon: 'execution-icon.svg'
  },
  {
    id: 'audit',
    name: '审计Agent',
    description: '负责审计和监控其他Agent的Agent',
    icon: 'audit-icon.svg'
  },
  {
    id: 'memory',
    name: '记忆Agent',
    description: '负责存储和检索信息的Agent',
    icon: 'memory-icon.svg'
  }
];

// 模拟组件类型数据
export const componentTypes: Component[] = [
  {
    id: 'agent_type',
    name: 'Agent类型',
    type: ComponentType.AGENT_TYPE,
    category: NodeCategory.CAPABILITY,
    description: '定义Agent的基本类型',
    properties: [
      {
        id: 'agent_type',
        name: 'type',
        label: 'Agent类型',
        type: PropertyType.SELECT,
        required: true,
        options: [
          { label: '规划Agent', value: 'PLANNING' },
          { label: '执行Agent', value: 'EXECUTION' },
          { label: '审计Agent', value: 'AUDIT' },
          { label: '记忆Agent', value: 'MEMORY' }
        ],
        description: 'Agent的类型'
      }
    ]
  },
  {
    id: 'agent_config',
    name: 'Agent配置',
    type: ComponentType.AGENT_CONFIG,
    category: NodeCategory.CAPABILITY,
    description: '配置Agent的基本参数',
    properties: [
      {
        id: 'agent_name',
        name: 'name',
        label: 'Agent名称',
        type: PropertyType.STRING,
        required: true,
        description: 'Agent的名称'
      },
      {
        id: 'agent_description',
        name: 'description',
        label: 'Agent描述',
        type: PropertyType.TEXT_AREA,
        required: false,
        description: 'Agent的描述'
      },
      {
        id: 'agent_priority',
        name: 'priority',
        label: '优先级',
        type: PropertyType.NUMBER,
        required: false,
        defaultValue: 5,
        description: 'Agent的执行优先级'
      }
    ]
  },
  {
    id: 'state_management',
    name: '状态管理',
    type: ComponentType.STATE_MANAGEMENT,
    category: NodeCategory.CAPABILITY,
    description: '管理Agent的状态',
    properties: [
      {
        id: 'state_persistence',
        name: 'persistence',
        label: '状态持久化',
        type: PropertyType.BOOLEAN,
        required: false,
        defaultValue: true,
        description: '是否持久化状态'
      },
      {
        id: 'state_storage_type',
        name: 'storage_type',
        label: '状态存储类型',
        type: PropertyType.SELECT,
        required: false,
        options: [
          { label: '内存', value: 'memory' },
          { label: '文件', value: 'file' },
          { label: '数据库', value: 'database' }
        ],
        defaultValue: 'memory',
        description: '状态存储类型'
      }
    ]
  },
  {
    id: 'observation',
    name: '观察能力',
    type: ComponentType.OBSERVATION,
    category: NodeCategory.CAPABILITY,
    description: 'Agent的观察能力',
    properties: [
      {
        id: 'observation_scope',
    name: 'scope',
    label: '观察范围',
    type: PropertyType.SELECT,
        required: true,
        options: [
          { label: '本地', value: 'local' },
          { label: '网络', value: 'network' },
          { label: '全局', value: 'global' }
        ],
        description: '观察的范围'
      },
      {
        id: 'observation_frequency',
        name: 'frequency',
        label: '观察频率',
        type: PropertyType.NUMBER,
        required: false,
        defaultValue: 1,
        description: '每秒观察次数'
      }
    ]
  },
  {
    id: 'decision',
    name: '决策能力',
    type: ComponentType.DECISION,
    category: NodeCategory.CAPABILITY,
    description: 'Agent的决策能力',
    properties: [
  {
    id: 'decision_model',
    name: 'model',
    label: '决策模型',
    type: PropertyType.SELECT,
    required: true,
    options: [
      { label: '规则引擎', value: 'rule_engine' },
      { label: '机器学习', value: 'machine_learning' },
      { label: '深度学习', value: 'deep_learning' }
    ],
    description: '决策使用的模型'
  },
  {
    id: 'decision_confidence',
    name: 'confidence_threshold',
    label: '置信度阈值',
    type: PropertyType.NUMBER,
    required: false,
    defaultValue: 0.7,
    description: '决策的置信度阈值'
  }
    ]
  },
  {
    id: 'action',
    name: '行动能力',
    type: ComponentType.ACTION,
    category: NodeCategory.CAPABILITY,
    description: 'Agent的行动能力',
    properties: [
  {
    id: 'action_type',
    name: 'action_type',
    label: '行动类型',
    type: PropertyType.SELECT,
    required: true,
    options: [
      { label: '文件操作', value: 'file_operation' },
      { label: '网络请求', value: 'network_request' },
      { label: '系统命令', value: 'system_command' }
    ],
    description: '行动的类型'
  },
  {
    id: 'action_timeout',
    name: 'timeout',
    label: '超时时间',
    type: PropertyType.NUMBER,
    required: false,
    defaultValue: 30,
    description: '行动的超时时间（秒）'
  }
    ]
  },
  {
    id: 'message_send',
    name: '消息发送',
    type: ComponentType.MESSAGE_SEND,
    category: NodeCategory.CAPABILITY,
    description: '发送消息给其他Agent',
    properties: [
  {
    id: 'message_protocol',
    name: 'protocol',
    label: '消息协议',
    type: PropertyType.SELECT,
    required: true,
    options: [
      { label: 'HTTP', value: 'http' },
      { label: 'WebSocket', value: 'websocket' },
      { label: 'gRPC', value: 'grpc' }
    ],
    description: '消息发送协议'
  },
  {
    id: 'message_retry',
    name: 'retry_count',
    label: '重试次数',
    type: PropertyType.NUMBER,
    required: false,
    defaultValue: 3,
    description: '发送失败时的重试次数'
  }
    ]
  },
  {
    id: 'message_receive',
    name: '消息接收',
    type: ComponentType.MESSAGE_RECEIVE,
    category: NodeCategory.CAPABILITY,
    description: '接收其他Agent的消息',
    properties: [
  {
    id: 'receive_queue_size',
    name: 'queue_size',
    label: '队列大小',
    type: PropertyType.NUMBER,
    required: false,
    defaultValue: 100,
    description: '消息队列大小'
  },
  {
    id: 'receive_filter',
    name: 'filter',
    label: '消息过滤',
    type: PropertyType.STRING,
    required: false,
    description: '消息过滤表达式'
  }
    ]
  },
  {
    id: 'message_process',
    name: '消息处理',
    type: ComponentType.MESSAGE_PROCESS,
    category: NodeCategory.CAPABILITY,
    description: '处理接收到的消息',
    properties: [
  {
    id: 'process_type',
    name: 'processor_type',
    label: '处理器类型',
    type: PropertyType.SELECT,
    required: true,
    options: [
      { label: '同步处理', value: 'sync' },
      { label: '异步处理', value: 'async' },
      { label: '批量处理', value: 'batch' }
    ],
    description: '消息处理器类型'
  },
  {
    id: 'process_batch_size',
    name: 'batch_size',
    label: '批处理大小',
    type: PropertyType.NUMBER,
    required: false,
    defaultValue: 10,
    description: '批量处理时的批大小'
  }
    ]
  },
  {
    id: 'cpu_resource',
    name: 'CPU资源',
    type: ComponentType.DATA_SOURCE,
    category: NodeCategory.CAPABILITY,
    description: '配置Agent的CPU资源',
    properties: [
  {
    id: 'cpu_limit',
    name: 'cpu_limit',
    label: 'CPU限制',
    type: PropertyType.NUMBER,
    required: true,
    defaultValue: 1,
    description: 'CPU核心数限制'
  },
  {
    id: 'cpu_priority',
    name: 'priority',
    label: 'CPU优先级',
    type: PropertyType.SELECT,
    required: false,
    options: [
      { label: '低', value: 'low' },
      { label: '中', value: 'medium' },
      { label: '高', value: 'high' }
    ],
    defaultValue: 'medium',
    description: 'CPU调度优先级'
  }
    ]
  },
  {
    id: 'memory_resource',
    name: '内存资源',
    type: ComponentType.TOOL_INTEGRATION,
    category: NodeCategory.CONTROL,
    description: '配置Agent的内存资源',
    properties: [
  {
    id: 'memory_limit',
    name: 'memory_limit',
    label: '内存限制',
    type: PropertyType.NUMBER,
    required: true,
    defaultValue: 512,
    description: '内存限制（MB）'
  },
  {
    id: 'memory_swap',
    name: 'swap_enabled',
    label: '是否启用内存交换',
    type: PropertyType.BOOLEAN,
    required: false,
    defaultValue: false,
    description: '是否启用内存交换'
  }
    ]
  },
  {
    id: 'gpu_resource',
    name: 'GPU资源',
    type: ComponentType.EXTERNAL_SERVICE,
    category: NodeCategory.CAPABILITY,
    description: '配置Agent的GPU资源',
    properties: [
  {
    id: 'gpu_enabled',
    name: 'gpu_enabled',
    label: '是否启用GPU',
    type: PropertyType.BOOLEAN,
    required: true,
    defaultValue: false,
    description: '是否启用GPU'
  },
  {
    id: 'gpu_memory',
    name: 'gpu_memory',
    label: 'GPU内存限制',
    type: PropertyType.NUMBER,
    required: false,
    defaultValue: 1024,
    description: 'GPU内存限制（MB）'
  }
    ]
  }
];

// 模拟能力数据
// 定义能力接口类型
interface Capability {
  id: string;
  name: string;
  description: string;
  type: ComponentType;
  category: ComponentCategory;
  icon: string;
  components: any[];
  configOptions: {
    name: string;
    type: PropertyType | string;
    defaultValue: any;
    description: string;
  }[];
  properties: {
    id: string;
    name: string;
    type: string;
    required: boolean;
    options?: { label?: string; value: string; description?: string }[];
    defaultValue?: any;
    description: string;
  }[];
}

export const capabilities: Capability[] = [
  {
    id: 'web_search',
    name: '网络搜索',
    description: '允许Agent在互联网上搜索信息',
    type: ComponentType.WEB_SEARCH,
    category: ComponentCategory.CAPABILITY,
    icon: '',
    components: [],
    configOptions: [
      {
        name: 'search_engine',
        type: PropertyType.SELECT,
        defaultValue: 'google',
        description: '使用的搜索引擎'
      },
      {
        name: 'result_count',
        type: PropertyType.NUMBER,
        defaultValue: 10,
        description: '返回的搜索结果数量'
      }
    ],
    properties: [
      {
        id: 'search_engine',
        name: 'search_engine',
        label: '搜索引擎',
        displayName: '搜索引擎',
        type: PropertyType.SELECT,
        required: true,
        options: [
          { label: 'Google', value: 'google' },
          { label: 'Bing', value: 'bing' },
          { label: 'Baidu', value: 'baidu' }
        ],
        defaultValue: 'google',
        description: '使用的搜索引擎'
      },
      {
        id: 'web_search_result_count',
        name: 'result_count',
        label: '结果数量',
        displayName: '结果数量',
        type: PropertyType.NUMBER,
        required: false,
        defaultValue: 10,
        description: '返回的搜索结果数量'
      }
    ]
  },
  {
    id: 'file_operation',
    name: '文件操作',
    description: '允许Agent读写文件',
    type: ComponentType.FILE_OPERATION,
    category: ComponentCategory.CAPABILITY,
    icon: '',
    components: [],
    configOptions: [
      {
        name: 'permission',
        type: 'select',
        defaultValue: 'read_only',
        description: '文件操作权限'
      },
      {
        name: 'base_path',
        type: PropertyType.STRING,
        defaultValue: './data',
        description: '文件操作的基础路径'
      }
    ],
    properties: [
      {
        id: 'file_operation_permission',
        name: 'permission',
        label: '操作权限',
        displayName: '操作权限',
        type: PropertyType.SELECT,
        required: true,
        options: [
          { label: '只读', value: 'read_only' },
          { label: '读写', value: 'read_write' }
        ],
        defaultValue: 'read_only',
        description: '文件操作权限'
      },
      {
        id: 'file_operation_base_path',
        name: 'base_path',
        label: '基础路径',
        displayName: '基础路径',
        type: PropertyType.STRING,
        required: true,
        defaultValue: './data',
        description: '文件操作的基础路径'
      }
    ]
  },
  {
    id: 'llm_reasoning',
    name: '大语言模型推理',
    description: '使用大语言模型进行推理',
    type: ComponentType.LLM_REASONING,
    category: ComponentCategory.CAPABILITY,
    icon: '',
    components: [],
    configOptions: [
      {
        name: 'model',
        type: 'select',
        defaultValue: 'gpt4',
        description: '使用的语言模型'
      },
      {
        name: 'temperature',
        type: 'number',
        defaultValue: 0.7,
        description: '生成文本的随机性'
      },
      {
        name: 'max_tokens',
        type: 'number',
        defaultValue: 1000,
        description: '生成文本的最大长度'
      }
    ],
    properties: [
      {
        id: 'llm_model',
        name: 'model',
        label: '语言模型',
        displayName: '语言模型',
        type: PropertyType.SELECT,
        required: true,
        options: [
          { label: 'GPT-4', value: 'gpt4' },
          { label: 'Claude', value: 'claude' },
          { label: 'Llama', value: 'llama' }
        ],
        defaultValue: 'gpt4',
        description: '使用的语言模型'
      },
      {
        id: 'llm_temperature',
        name: 'temperature',
        label: '随机性',
        displayName: '随机性',
        type: PropertyType.NUMBER,
        required: false,
        defaultValue: 0.7,
        description: '生成文本的随机性'
      },
      {
        id: 'llm_max_tokens',
        name: 'max_tokens',
        label: '最大长度',
        displayName: '最大长度',
        type: PropertyType.NUMBER,
        required: false,
        defaultValue: 1000,
        description: '生成文本的最大长度'
      }
    ]
  },
  {
    id: 'api_call',
    name: 'API调用',
    description: '调用外部API服务',
    type: ComponentType.API_CALL,
    category: ComponentCategory.CAPABILITY,
    icon: '',
    components: [],
    configOptions: [
      {
        name: 'method',
        type: 'select',
        defaultValue: 'get',
        description: 'HTTP请求方法'
      },
      {
        name: 'base_url',
        type: 'string',
        defaultValue: '',
        description: 'API的基础URL'
      },
      {
        name: 'headers',
        type: PropertyType.TEXT_AREA,
        defaultValue: '{}',
        description: 'HTTP请求头（JSON格式）'
      }
    ],
    properties: [
      {
        id: 'api_method',
        name: 'method',
        label: '请求方法',
        displayName: '请求方法',
        type: PropertyType.SELECT,
        required: true,
        options: [
          { label: 'GET', value: 'get' },
          { label: 'POST', value: 'post' },
          { label: 'PUT', value: 'put' },
          { label: 'DELETE', value: 'delete' }
        ],
        defaultValue: 'get',
        description: 'HTTP请求方法'
      },
      {
        id: 'api_base_url',
        name: 'base_url',
        label: '基础URL',
        displayName: '基础URL',
        type: PropertyType.STRING,
        required: true,
        description: 'API的基础URL'
      },
      {
        id: 'api_headers',
        name: 'headers',
        label: '请求头',
        displayName: '请求头',
        type: PropertyType.TEXT_AREA,
        required: false,
        defaultValue: '{}',
        description: 'HTTP请求头（JSON格式）'
      }
    ]
  },
  {
    id: 'database_access',
    name: '数据库访问',
    description: '访问和操作数据库',
    type: ComponentType.DATABASE_ACCESS,
    category: ComponentCategory.CAPABILITY,
    icon: '',
    components: [],
    configOptions: [
      {
        name: 'db_type',
        type: 'select',
        defaultValue: 'sqlite',
        description: '数据库类型'
      },
      {
        name: 'connection_string',
        type: 'string',
        defaultValue: '',
        description: '数据库连接字符串'
      },
      {
        name: 'query_timeout',
        type: 'number',
        defaultValue: 30,
        description: '查询超时时间（秒）'
      }
    ],
    properties: [
      {
        id: 'db_type',
        name: 'db_type',
        label: '数据库类型',
        displayName: '数据库类型',
        type: PropertyType.SELECT,
        required: true,
        options: [
          { label: 'MySQL', value: 'mysql' },
          { label: 'PostgreSQL', value: 'postgresql' },
          { label: 'MongoDB', value: 'mongodb' },
          { label: 'SQLite', value: 'sqlite' }
        ],
        defaultValue: 'sqlite',
        description: '数据库类型'
      },
      {
        id: 'db_connection_string',
        name: 'connection_string',
        label: '连接字符串',
        displayName: '连接字符串',
        type: PropertyType.STRING,
        required: true,
        description: '数据库连接字符串'
      },
      {
        id: 'db_query_timeout',
        name: 'query_timeout',
        label: '查询超时',
        displayName: '查询超时',
        type: PropertyType.NUMBER,
        required: false,
        defaultValue: 30,
        description: '查询超时时间（秒）'
      }
    ]
  },
  {
    id: 'code_execution',
    name: '代码执行',
    description: '执行代码片段',
    type: ComponentType.CODE_EXECUTION,
    category: ComponentCategory.CAPABILITY,
    icon: '',
    components: [],
    configOptions: [
      {
        name: 'language',
        type: 'select',
        defaultValue: 'python',
        description: '代码语言'
      },
      {
        name: 'timeout',
        type: 'number',
        defaultValue: 10,
        description: '执行超时时间（秒）'
      },
      {
        name: 'sandbox',
        type: 'boolean',
        defaultValue: true,
        description: '是否在沙箱中执行'
      }
    ],
    properties: [
      {
        id: 'code_language',
        name: 'language',
        label: '代码语言',
        displayName: '代码语言',
        type: PropertyType.SELECT,
        required: true,
        options: [
          { label: 'Python', value: 'python' },
          { label: 'JavaScript', value: 'javascript' },
          { label: 'Shell', value: 'shell' }
        ],
        defaultValue: 'python',
        description: '代码语言'
      },
      {
        id: 'code_timeout',
        name: 'timeout',
        label: '执行超时',
        displayName: '执行超时',
        type: PropertyType.NUMBER,
        required: false,
        defaultValue: 10,
        description: '执行超时时间（秒）'
      },
      {
        id: 'code_sandbox',
        name: 'sandbox',
        label: '沙箱执行',
        displayName: '沙箱执行',
        type: PropertyType.BOOLEAN,
        required: false,
        defaultValue: true,
        description: '是否在沙箱中执行'
      }
    ]
  },
  {
    id: 'image_processing',
    name: '图像处理',
    description: '处理和分析图像',
    type: ComponentType.IMAGE_PROCESSING,
    category: ComponentCategory.CAPABILITY,
    icon: '',
    components: [],
    configOptions: [
      {
        name: 'model',
        type: 'select',
        defaultValue: 'opencv',
        description: '图像处理模型'
      },
      {
        name: 'max_image_size',
        type: 'number',
        defaultValue: 1024,
        description: '处理的最大图像尺寸（像素）'
      }
    ],
    properties: [
      {
        id: 'image_model',
        name: 'model',
        label: '处理模型',
        displayName: '处理模型',
        type: PropertyType.SELECT,
        required: true,
        options: [
          { label: 'OpenCV', value: 'opencv' },
          { label: 'TensorFlow', value: 'tensorflow' },
          { label: 'PyTorch', value: 'pytorch' }
        ],
        defaultValue: 'opencv',
        description: '图像处理模型'
      },
      {
        id: 'image_max_size',
        name: 'max_image_size',
        label: '最大尺寸',
        displayName: '最大尺寸',
        type: PropertyType.NUMBER,
        required: false,
        defaultValue: 1024,
        description: '处理的最大图像尺寸（像素）'
      }
    ]
  },
  {
    id: 'text_to_speech',
    name: '文本转语音',
    description: '将文本转换为语音',
    type: ComponentType.TEXT_TO_SPEECH,
    category: ComponentCategory.CAPABILITY,
    icon: '',
    components: [],
    configOptions: [
      {
        name: 'voice',
        type: 'select',
        defaultValue: 'neutral',
        description: '语音类型'
      },
      {
        name: 'rate',
        type: 'number',
        defaultValue: 1.0,
        description: '语音速率'
      },
      {
        name: 'format',
        type: 'select',
        defaultValue: 'mp3',
        description: '音频格式'
      }
    ],
    properties: [
      {
        id: 'tts_voice',
        name: 'voice',
        label: '语音类型',
        displayName: '语音类型',
        type: PropertyType.SELECT,
        required: true,
        options: [
          { label: '男声', value: 'male' },
          { label: '女声', value: 'female' },
          { label: '中性', value: 'neutral' }
        ],
        defaultValue: 'neutral',
        description: '语音类型'
      },
      {
        id: 'tts_rate',
        name: 'rate',
        label: '语音速率',
        displayName: '语音速率',
        type: PropertyType.NUMBER,
        required: false,
        defaultValue: 1.0,
        description: '语音速率'
      },
      {
        id: 'tts_format',
        name: 'format',
        label: '音频格式',
        displayName: '音频格式',
        type: PropertyType.SELECT,
        required: false,
        options: [
          { label: 'MP3', value: 'mp3' },
          { label: 'WAV', value: 'wav' },
          { label: 'OGG', value: 'ogg' }
        ],
        defaultValue: 'mp3',
        description: '音频格式'
      }
    ]
  },
  {
    id: 'speech_to_text',
    name: '语音转文本',
    description: '将语音转换为文本',
    type: ComponentType.SPEECH_TO_TEXT,
    category: ComponentCategory.CAPABILITY,
    icon: '',
    components: [],
    configOptions: [
      {
        name: 'language',
        type: 'select',
        defaultValue: 'auto',
        description: '语音语言'
      },
      {
        name: 'model',
        type: 'select',
        defaultValue: 'standard',
        description: '识别模型'
      }
    ],
    properties: [
      {
        id: 'stt_language',
        name: 'language',
        label: '语音语言',
        displayName: '语音语言',
        type: PropertyType.SELECT,
        required: true,
        options: [
          { label: '中文', value: 'zh' },
          { label: '英语', value: 'en' },
          { label: '日语', value: 'ja' },
          { label: '自动检测', value: 'auto' }
        ],
        defaultValue: 'auto',
        description: '语音语言'
      },
      {
        id: 'stt_model',
        name: 'model',
        label: '识别模型',
        displayName: '识别模型',
        type: PropertyType.SELECT,
        required: false,
        options: [
          { label: '标准', value: 'standard' },
          { label: '增强', value: 'enhanced' }
        ],
        defaultValue: 'standard',
        description: '识别模型'
      }
    ]
  },
  {
    id: 'memory_storage',
    name: '记忆存储',
    description: '存储和检索Agent的记忆',
    type: ComponentType.MEMORY_STORAGE,
    category: ComponentCategory.CAPABILITY,
    icon: '',
    components: [],
    configOptions: [
      {
        name: 'storage_type',
        type: 'select',
        defaultValue: 'working',
        description: '记忆存储类型'
      },
      {
        name: 'capacity',
        type: 'number',
        defaultValue: 1000,
        description: '记忆存储容量'
      },
      {
        name: 'persistence',
        type: 'boolean',
        defaultValue: true,
        description: '是否持久化存储'
      }
    ],
    properties: [
      {
        id: 'memory_storage_type',
        name: 'storage_type',
        label: '存储类型',
        displayName: '存储类型',
        type: PropertyType.SELECT,
        required: true,
        options: [
          { label: '短期记忆', value: 'short_term' },
          { label: '长期记忆', value: 'long_term' },
          { label: '工作记忆', value: 'working' }
        ],
        defaultValue: 'working',
        description: '记忆存储类型'
      },
      {
        id: 'memory_capacity',
        name: 'capacity',
        label: '存储容量',
        displayName: '存储容量',
        type: PropertyType.NUMBER,
        required: false,
        defaultValue: 1000,
        description: '记忆存储容量'
      },
      {
        id: 'memory_persistence',
        name: 'persistence',
        label: '持久化',
        displayName: '持久化',
        type: PropertyType.BOOLEAN,
        required: false,
        defaultValue: true,
        description: '是否持久化存储'
      }
    ]
  }
];

// 模拟模板数据
export const templates: AgentTemplate[] = [
  {
    id: 'planning_agent_template',
    name: '基础规划Agent',
    description: '用于任务分解和规划的基础Agent模板',
    type: AgentType.PLANNING,
    category: NodeCategory.AGENT,
    icon: '',
    color: '#1890ff',
    properties: [],
    capabilities: [
      { capabilityId: 'llm_reasoning', enabled: true, config: { name: 'LLM Reasoning', description: 'LLM reasoning capability' } } as CapabilityConfig,
         { capabilityId: 'memory_storage', enabled: true, config: { name: 'Memory Storage', description: 'Memory storage capability' } } as CapabilityConfig
    ],
    difficulty: 'beginner' as const,
    featured: false,
    usageCount: 100,
    rating: 4.2,
    author: 'System',
    version: '1.0.0',
    tags: ['规划', '基础', '任务分解'],
    createdAt: new Date('2023-01-01T00:00:00Z'),
    updatedAt: new Date('2023-01-01T00:00:00Z')
  },
  {
    id: 'execution_agent_template',
    name: '基础执行Agent',
    description: '用于执行具体任务的基础Agent模板',
    type: AgentType.EXECUTION,
    category: NodeCategory.AGENT,
    icon: '',
    color: '#52c41a',
    properties: [],
    capabilities: [
      { capabilityId: 'file_operation', enabled: true, config: { name: 'File Operation', description: 'File operation capability' } } as CapabilityConfig,
         { capabilityId: 'api_call', enabled: true, config: { name: 'API Call', description: 'API call capability' } } as CapabilityConfig,
         { capabilityId: 'code_execution', enabled: true, config: { name: 'Code Execution', description: 'Code execution capability' } } as CapabilityConfig
    ],
    difficulty: 'intermediate' as const,
    featured: true,
    usageCount: 250,
    rating: 4.5,
    author: 'System',
    version: '1.0.0',
    tags: ['执行', '基础', '任务执行'],
    createdAt: new Date('2023-01-01T00:00:00Z'),
    updatedAt: new Date('2023-01-01T00:00:00Z')
  },
  {
    id: 'audit_agent_template',
    name: '基础审计Agent',
    description: '用于审计和监控其他Agent的基础Agent模板',
    type: AgentType.AUDIT,
    category: NodeCategory.AGENT,
    icon: '',
    color: '#fa8c16',
    properties: [],
    capabilities: [
      { capabilityId: 'memory_storage', enabled: true, config: { name: 'Memory Storage', description: 'Memory storage capability' } } as CapabilityConfig,
          { capabilityId: 'llm_reasoning', enabled: true, config: { name: 'LLM Reasoning', description: 'LLM reasoning capability' } } as CapabilityConfig
    ],
    difficulty: 'advanced' as const,
    featured: false,
    usageCount: 80,
    rating: 4.0,
    author: 'System',
    version: '1.0.0',
    tags: ['审计', '基础', '监控'],
    createdAt: new Date('2023-01-01T00:00:00Z'),
    updatedAt: new Date('2023-01-01T00:00:00Z')
  },
  {
    id: 'memory_agent_template',
    name: '基础记忆Agent',
    description: '用于存储和检索信息的基础Agent模板',
    type: AgentType.MEMORY,
    category: NodeCategory.AGENT,
    icon: '',
    color: '#722ed1',
    properties: [],
    capabilities: [],
    difficulty: 'beginner' as const,
    featured: false,
    usageCount: 150,
    rating: 4.1,
    author: 'System',
    version: '1.0.0',
    tags: ['记忆', '基础', '存储'],
    createdAt: new Date('2023-01-01T00:00:00Z'),
    updatedAt: new Date('2023-01-01T00:00:00Z')
  },
  {
    id: 'web_search_agent_template',
    name: '网络搜索Agent',
    description: '专注于网络搜索和信息收集的Agent模板',
    type: AgentType.EXECUTION,
    category: NodeCategory.AGENT,
    icon: '',
    color: '#13c2c2',
    properties: [],
    capabilities: [],
    difficulty: 'intermediate' as const,
    featured: true,
    usageCount: 300,
    rating: 4.3,
    author: 'System',
    version: '1.0.0',
    tags: ['搜索', '信息收集', '网络'],
    createdAt: new Date('2023-01-01T00:00:00Z'),
    updatedAt: new Date('2023-01-01T00:00:00Z')
  },
  {
    id: 'code_assistant_agent_template',
    name: '代码助手Agent',
    description: '专注于代码生成和执行的Agent模板',
    type: AgentType.EXECUTION,
    category: NodeCategory.AGENT,
    icon: '',
    color: '#eb2f96',
    properties: [],
    capabilities: [],
    difficulty: 'advanced' as const,
    featured: true,
    usageCount: 200,
    rating: 4.6,
    author: 'System',
    version: '1.0.0',
    tags: ['代码', '编程', '开发'],
    createdAt: new Date('2023-01-01T00:00:00Z'),
    updatedAt: new Date('2023-01-01T00:00:00Z')
  }
];

// 模拟Agent实例数据
export const agentInstances: AgentInstance[] = [
  {
    id: 'agent-1',
    configId: 'config-1',
    name: '任务规划Agent',
    status: AgentStatus.IDLE,
    createdAt: new Date('2023-06-01T10:00:00Z'),
    startedAt: undefined,
    stoppedAt: undefined,
    metrics: undefined,
    resources: undefined,
  },
  {
    id: 'agent-2',
    name: '代码执行Agent',
    status: AgentStatus.IDLE,
    configId: 'config-2',
    createdAt: new Date('2023-06-02T14:30:00Z'),
    startedAt: undefined,
    stoppedAt: undefined,
    metrics: undefined,
    resources: undefined,
  },
  {
    id: 'agent-3',
    name: '信息检索Agent',
    status: AgentStatus.IDLE,
    configId: 'config-3',
    createdAt: new Date('2023-06-03T09:15:00Z'),
    startedAt: undefined,
    stoppedAt: undefined,
    metrics: undefined,
    resources: undefined,
  }
];

// 模拟工作流数据
export const workflows: Workflow[] = [
  {
    id: 'workflow-1',
    name: '基础任务处理流程',
    description: '处理基本任务的工作流',
    agents: [
      { 
        id: 'agent-1',
        templateId: 'planning_agent_template',
        name: '任务规划Agent',
        description: '负责分解和规划复杂任务',
        type: AgentType.PLANNING,
        status: AgentStatus.IDLE,
        capabilities: [
          { capabilityId: 'llm_reasoning', enabled: true, config: { name: 'LLM Reasoning', description: 'LLM reasoning capability' } } as CapabilityConfig,
           { capabilityId: 'memory_storage', enabled: true, config: { name: 'Memory Storage', description: 'Memory storage capability' } } as CapabilityConfig
        ],
        properties: {},
        createdAt: new Date('2023-06-01T10:00:00Z')
      },
      {
        id: 'agent-2',
        templateId: 'execution_agent_template',
        name: '代码执行Agent',
        description: '负责执行代码和系统命令',
        type: AgentType.EXECUTION,
        status: AgentStatus.IDLE,
        capabilities: [
          { capabilityId: 'code_execution', enabled: true, config: { name: 'Code Execution', description: 'Code execution capability' } } as CapabilityConfig,
           { capabilityId: 'file_operation', enabled: true, config: { name: 'File Operation', description: 'File operation capability' } } as CapabilityConfig
        ],
        properties: {},
        createdAt: new Date('2023-06-02T14:30:00Z')
      },
      {
        id: 'agent-3',
        templateId: 'web_search_agent_template',
        name: '信息检索Agent',
        description: '负责搜索和检索信息',
        type: AgentType.EXECUTION,
        status: AgentStatus.IDLE,
        capabilities: [
          { capabilityId: 'web_search', enabled: true, config: { name: 'Web Search', description: 'Web search capability' } } as CapabilityConfig,
           { capabilityId: 'memory_storage', enabled: true, config: { name: 'Memory Storage', description: 'Memory storage capability' } } as CapabilityConfig
        ],
        properties: {},
        createdAt: new Date('2023-06-03T09:15:00Z')
      }
    ],
    nodes: [],
    connections: [
      { 
        id: 'conn-1',
        sourceId: 'agent-1',
        targetId: 'agent-2'
      },
      {
        id: 'conn-2',
        sourceId: 'agent-2',
        targetId: 'agent-3'
      }
    ],
    createdAt: new Date('2023-06-10T11:00:00Z'),
    updatedAt: new Date('2023-06-10T11:00:00Z'),
    author: 'System',
    version: '1.0.0',
    tags: ['基础', '任务处理'],
  },
  {
    id: 'workflow-2',
    name: '信息处理工作流',
    description: '处理和分析信息的工作流',
    agents: [
      { 
        id: 'agent-3',
        templateId: 'web_search_agent_template',
        name: '信息检索Agent',
        description: '负责搜索和检索信息',
        type: AgentType.EXECUTION,
        status: AgentStatus.IDLE,
        capabilities: [
          { capabilityId: 'web_search', enabled: true, config: { name: 'Web Search', description: 'Web search capability' } } as CapabilityConfig,
          { capabilityId: 'memory_storage', enabled: true, config: { name: 'Memory Storage', description: 'Memory storage capability' } } as CapabilityConfig
        ],
        properties: {}
      },
      {
        id: 'agent-1',
        templateId: 'planning_agent_template',
        name: '任务规划Agent',
        description: '负责分解和规划复杂任务',
        type: AgentType.PLANNING,
        status: AgentStatus.IDLE,
        capabilities: [
          { capabilityId: 'llm_reasoning', enabled: true, config: { name: 'LLM Reasoning', description: 'LLM reasoning capability' } } as CapabilityConfig,
          { capabilityId: 'memory_storage', enabled: true, config: { name: 'Memory Storage', description: 'Memory storage capability' } } as CapabilityConfig
        ],
        properties: {}
      }
    ],
    nodes: [],
    connections: [
      {
        id: 'conn-1',
        sourceId: 'agent-3',
        targetId: 'agent-1'
      }
    ],
    createdAt: new Date('2023-06-15T14:20:00Z'),
    updatedAt: new Date('2023-06-15T14:20:00Z'),
  }
];
