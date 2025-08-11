const { DataTypes } = require('sequelize')
const { sequelize } = require('../database/connection')

// 用户模型
const User = sequelize.define('User', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    comment: '用户名'
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    },
    comment: '邮箱'
  },
  passwordHash: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'password_hash',
    comment: '密码哈希'
  },
  role: {
    type: DataTypes.ENUM('admin', 'developer', 'user'),
    defaultValue: 'user',
    comment: '用户角色'
  },
  avatarUrl: {
    type: DataTypes.STRING(500),
    field: 'avatar_url',
    comment: '头像URL'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active',
    comment: '是否激活'
  },
  lastLoginAt: {
    type: DataTypes.DATE,
    field: 'last_login_at',
    comment: '最后登录时间'
  }
}, {
  tableName: 'users',
  comment: '用户表',
  indexes: [
    { fields: ['username'] },
    { fields: ['email'] },
    { fields: ['role'] },
    { fields: ['created_at'] }
  ]
})

// Agent模板模型
const AgentTemplate = sequelize.define('AgentTemplate', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '模板名称'
  },
  description: {
    type: DataTypes.TEXT,
    comment: '模板描述'
  },
  type: {
    type: DataTypes.ENUM('planning', 'execution', 'audit', 'memory'),
    allowNull: false,
    comment: 'Agent类型'
  },
  category: {
    type: DataTypes.STRING(50),
    comment: '分类'
  },
  iconUrl: {
    type: DataTypes.STRING(500),
    field: 'icon_url',
    comment: '图标URL'
  },
  difficulty: {
    type: DataTypes.ENUM('beginner', 'intermediate', 'advanced'),
    defaultValue: 'beginner',
    comment: '难度等级'
  },
  featured: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: '是否推荐'
  },
  properties: {
    type: DataTypes.JSON,
    comment: '属性定义'
  },
  components: {
    type: DataTypes.JSON,
    comment: '组件配置'
  },
  capabilities: {
    type: DataTypes.JSON,
    comment: '能力配置'
  },
  tags: {
    type: DataTypes.JSON,
    comment: '标签'
  },
  authorId: {
    type: DataTypes.BIGINT,
    field: 'author_id',
    comment: '作者ID'
  },
  version: {
    type: DataTypes.STRING(20),
    defaultValue: '1.0.0',
    comment: '版本号'
  },
  downloadCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'download_count',
    comment: '下载次数'
  },
  rating: {
    type: DataTypes.DECIMAL(3, 2),
    defaultValue: 0.00,
    comment: '评分'
  },
  isPublic: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_public',
    comment: '是否公开'
  }
}, {
  tableName: 'agent_templates',
  comment: 'Agent模板表',
  indexes: [
    { fields: ['type'] },
    { fields: ['category'] },
    { fields: ['author_id'] },
    { fields: ['featured'] },
    { fields: ['is_public'] },
    { fields: ['created_at'] }
  ]
})

// Agent配置模型
const AgentConfig = sequelize.define('AgentConfig', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  templateId: {
    type: DataTypes.BIGINT,
    allowNull: false,
    field: 'template_id',
    comment: '模板ID'
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'Agent名称'
  },
  description: {
    type: DataTypes.TEXT,
    comment: 'Agent描述'
  },
  type: {
    type: DataTypes.ENUM('planning', 'execution', 'audit', 'memory'),
    allowNull: false,
    comment: 'Agent类型'
  },
  status: {
    type: DataTypes.ENUM('idle', 'running', 'stopped', 'paused', 'error', 'completed'),
    defaultValue: 'idle',
    comment: '状态'
  },
  properties: {
    type: DataTypes.JSON,
    comment: '属性配置'
  },
  components: {
    type: DataTypes.JSON,
    comment: '组件配置'
  },
  capabilities: {
    type: DataTypes.JSON,
    comment: '能力配置'
  },
  ownerId: {
    type: DataTypes.BIGINT,
    allowNull: false,
    field: 'owner_id',
    comment: '所有者ID'
  },
  lastRunAt: {
    type: DataTypes.DATE,
    field: 'last_run_at',
    comment: '最后运行时间'
  }
}, {
  tableName: 'agent_configs',
  comment: 'Agent配置表',
  indexes: [
    { fields: ['template_id'] },
    { fields: ['owner_id'] },
    { fields: ['type'] },
    { fields: ['status'] },
    { fields: ['created_at'] }
  ]
})

// 工作流模型
const Workflow = sequelize.define('Workflow', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '工作流名称'
  },
  description: {
    type: DataTypes.TEXT,
    comment: '工作流描述'
  },
  status: {
    type: DataTypes.ENUM('draft', 'active', 'paused', 'stopped', 'error'),
    defaultValue: 'draft',
    comment: '状态'
  },
  nodes: {
    type: DataTypes.JSON,
    comment: '节点配置'
  },
  connections: {
    type: DataTypes.JSON,
    comment: '连接配置'
  },
  agents: {
    type: DataTypes.JSON,
    comment: 'Agent配置'
  },
  properties: {
    type: DataTypes.JSON,
    comment: '属性配置'
  },
  tags: {
    type: DataTypes.JSON,
    comment: '标签'
  },
  authorId: {
    type: DataTypes.BIGINT,
    allowNull: false,
    field: 'author_id',
    comment: '作者ID'
  },
  version: {
    type: DataTypes.STRING(20),
    defaultValue: '1.0.0',
    comment: '版本号'
  },
  executionCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'execution_count',
    comment: '执行次数'
  },
  successCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'success_count',
    comment: '成功次数'
  },
  successRate: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0.00,
    field: 'success_rate',
    comment: '成功率'
  },
  lastExecutedAt: {
    type: DataTypes.DATE,
    field: 'last_executed_at',
    comment: '最后执行时间'
  }
}, {
  tableName: 'workflows',
  comment: '工作流表',
  indexes: [
    { fields: ['author_id'] },
    { fields: ['status'] },
    { fields: ['created_at'] }
  ]
})

// 工作流执行记录模型
const WorkflowExecution = sequelize.define('WorkflowExecution', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  workflowId: {
    type: DataTypes.BIGINT,
    allowNull: false,
    field: 'workflow_id',
    comment: '工作流ID'
  },
  status: {
    type: DataTypes.ENUM('running', 'completed', 'failed', 'cancelled'),
    defaultValue: 'running',
    comment: '执行状态'
  },
  startedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'started_at',
    comment: '开始时间'
  },
  completedAt: {
    type: DataTypes.DATE,
    field: 'completed_at',
    comment: '完成时间'
  },
  duration: {
    type: DataTypes.INTEGER,
    comment: '执行时长(秒)'
  },
  inputData: {
    type: DataTypes.JSON,
    field: 'input_data',
    comment: '输入数据'
  },
  outputData: {
    type: DataTypes.JSON,
    field: 'output_data',
    comment: '输出数据'
  },
  errorMessage: {
    type: DataTypes.TEXT,
    field: 'error_message',
    comment: '错误信息'
  },
  executionLog: {
    type: DataTypes.JSON,
    field: 'execution_log',
    comment: '执行日志'
  },
  triggeredBy: {
    type: DataTypes.BIGINT,
    field: 'triggered_by',
    comment: '触发用户ID'
  }
}, {
  tableName: 'workflow_executions',
  comment: '工作流执行记录表',
  indexes: [
    { fields: ['workflow_id'] },
    { fields: ['status'] },
    { fields: ['started_at'] },
    { fields: ['triggered_by'] }
  ]
})

// 能力模型
const Capability = sequelize.define('Capability', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '能力名称'
  },
  description: {
    type: DataTypes.TEXT,
    comment: '能力描述'
  },
  type: {
    type: DataTypes.ENUM(
      'web_search', 'file_operation', 'llm_reasoning', 'api_call',
      'database_access', 'code_execution', 'image_processing',
      'text_to_speech', 'speech_to_text', 'memory_storage',
      'knowledge_graph', 'multimodal'
    ),
    allowNull: false,
    comment: '能力类型'
  },
  category: {
    type: DataTypes.STRING(50),
    comment: '分类'
  },
  iconUrl: {
    type: DataTypes.STRING(500),
    field: 'icon_url',
    comment: '图标URL'
  },
  components: {
    type: DataTypes.JSON,
    comment: '组件配置'
  },
  properties: {
    type: DataTypes.JSON,
    comment: '属性定义'
  },
  configOptions: {
    type: DataTypes.JSON,
    field: 'config_options',
    comment: '配置选项'
  },
  tags: {
    type: DataTypes.JSON,
    comment: '标签'
  },
  authorId: {
    type: DataTypes.BIGINT,
    field: 'author_id',
    comment: '作者ID'
  },
  version: {
    type: DataTypes.STRING(20),
    defaultValue: '1.0.0',
    comment: '版本号'
  },
  downloadCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'download_count',
    comment: '下载次数'
  },
  rating: {
    type: DataTypes.DECIMAL(3, 2),
    defaultValue: 0.00,
    comment: '评分'
  },
  isPublic: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_public',
    comment: '是否公开'
  }
}, {
  tableName: 'capabilities',
  comment: '能力表',
  indexes: [
    { fields: ['type'] },
    { fields: ['category'] },
    { fields: ['author_id'] },
    { fields: ['is_public'] },
    { fields: ['created_at'] }
  ]
})

// 组件模型
const Component = sequelize.define('Component', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '组件名称'
  },
  description: {
    type: DataTypes.TEXT,
    comment: '组件描述'
  },
  type: {
    type: DataTypes.ENUM(
      'agent_type', 'agent_config', 'state_management', 'observation',
      'decision', 'action', 'message_send', 'message_receive',
      'message_process', 'data_source', 'tool_integration', 'external_service'
    ),
    allowNull: false,
    comment: '组件类型'
  },
  category: {
    type: DataTypes.ENUM('base', 'capability', 'communication', 'resource'),
    allowNull: false,
    comment: '组件分类'
  },
  iconUrl: {
    type: DataTypes.STRING(500),
    field: 'icon_url',
    comment: '图标URL'
  },
  properties: {
    type: DataTypes.JSON,
    comment: '属性定义'
  },
  inputs: {
    type: DataTypes.JSON,
    comment: '输入定义'
  },
  outputs: {
    type: DataTypes.JSON,
    comment: '输出定义'
  },
  configSchema: {
    type: DataTypes.JSON,
    field: 'config_schema',
    comment: '配置模式'
  },
  authorId: {
    type: DataTypes.BIGINT,
    field: 'author_id',
    comment: '作者ID'
  },
  version: {
    type: DataTypes.STRING(20),
    defaultValue: '1.0.0',
    comment: '版本号'
  },
  isPublic: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_public',
    comment: '是否公开'
  }
}, {
  tableName: 'components',
  comment: '组件表',
  indexes: [
    { fields: ['type'] },
    { fields: ['category'] },
    { fields: ['author_id'] },
    { fields: ['is_public'] },
    { fields: ['created_at'] }
  ]
})

// Agent实例模型
const AgentInstance = sequelize.define('AgentInstance', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  configId: {
    type: DataTypes.BIGINT,
    allowNull: false,
    field: 'config_id',
    comment: '配置ID'
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '实例名称'
  },
  status: {
    type: DataTypes.ENUM('idle', 'running', 'stopped', 'paused', 'error', 'completed'),
    defaultValue: 'idle',
    comment: '状态'
  },
  processId: {
    type: DataTypes.STRING(50),
    field: 'process_id',
    comment: '进程ID'
  },
  hostInfo: {
    type: DataTypes.JSON,
    field: 'host_info',
    comment: '主机信息'
  },
  startedAt: {
    type: DataTypes.DATE,
    field: 'started_at',
    comment: '启动时间'
  },
  stoppedAt: {
    type: DataTypes.DATE,
    field: 'stopped_at',
    comment: '停止时间'
  }
}, {
  tableName: 'agent_instances',
  comment: 'Agent实例表',
  indexes: [
    { fields: ['config_id'] },
    { fields: ['status'] },
    { fields: ['started_at'] }
  ]
})

// 性能指标模型
const PerformanceMetric = sequelize.define('PerformanceMetric', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  agentId: {
    type: DataTypes.BIGINT,
    allowNull: false,
    field: 'agent_id',
    comment: 'Agent实例ID'
  },
  metricType: {
    type: DataTypes.ENUM(
      'response_time', 'throughput', 'success_rate', 'error_rate',
      'cpu_usage', 'memory_usage', 'token_usage'
    ),
    allowNull: false,
    field: 'metric_type',
    comment: '指标类型'
  },
  value: {
    type: DataTypes.DECIMAL(10, 4),
    allowNull: false,
    comment: '指标值'
  },
  unit: {
    type: DataTypes.STRING(20),
    comment: '单位'
  },
  timestamp: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    comment: '时间戳'
  },
  metadata: {
    type: DataTypes.JSON,
    comment: '元数据'
  }
}, {
  tableName: 'performance_metrics',
  comment: '性能指标表',
  indexes: [
    { fields: ['agent_id'] },
    { fields: ['metric_type'] },
    { fields: ['timestamp'] },
    { fields: ['agent_id', 'metric_type', 'timestamp'] }
  ]
})

// 系统日志模型
const SystemLog = sequelize.define('SystemLog', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  agentId: {
    type: DataTypes.BIGINT,
    field: 'agent_id',
    comment: 'Agent实例ID'
  },
  level: {
    type: DataTypes.ENUM('debug', 'info', 'warn', 'error'),
    allowNull: false,
    comment: '日志级别'
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: '日志消息'
  },
  module: {
    type: DataTypes.STRING(100),
    comment: '模块名称'
  },
  functionName: {
    type: DataTypes.STRING(100),
    field: 'function_name',
    comment: '函数名称'
  },
  lineNumber: {
    type: DataTypes.INTEGER,
    field: 'line_number',
    comment: '行号'
  },
  stackTrace: {
    type: DataTypes.TEXT,
    field: 'stack_trace',
    comment: '堆栈跟踪'
  },
  metadata: {
    type: DataTypes.JSON,
    comment: '元数据'
  },
  timestamp: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    comment: '时间戳'
  }
}, {
  tableName: 'system_logs',
  comment: '系统日志表',
  indexes: [
    { fields: ['agent_id'] },
    { fields: ['level'] },
    { fields: ['timestamp'] },
    { fields: ['module'] }
  ]
})

// 消息模型
const Message = sequelize.define('Message', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  agentId: {
    type: DataTypes.BIGINT,
    allowNull: false,
    field: 'agent_id',
    comment: 'Agent实例ID'
  },
  direction: {
    type: DataTypes.ENUM('incoming', 'outgoing'),
    allowNull: false,
    comment: '消息方向'
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: '消息内容'
  },
  contentType: {
    type: DataTypes.STRING(50),
    defaultValue: 'text',
    field: 'content_type',
    comment: '内容类型'
  },
  sourceId: {
    type: DataTypes.BIGINT,
    field: 'source_id',
    comment: '来源ID'
  },
  targetId: {
    type: DataTypes.BIGINT,
    field: 'target_id',
    comment: '目标ID'
  },
  correlationId: {
    type: DataTypes.STRING(100),
    field: 'correlation_id',
    comment: '关联ID'
  },
  metadata: {
    type: DataTypes.JSON,
    comment: '元数据'
  },
  timestamp: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    comment: '时间戳'
  }
}, {
  tableName: 'messages',
  comment: '消息表',
  indexes: [
    { fields: ['agent_id'] },
    { fields: ['direction'] },
    { fields: ['timestamp'] },
    { fields: ['correlation_id'] }
  ]
})

// 版本历史模型
const VersionHistory = sequelize.define('VersionHistory', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  entityType: {
    type: DataTypes.ENUM('agent_template', 'agent_config', 'workflow', 'capability', 'component'),
    allowNull: false,
    field: 'entity_type',
    comment: '实体类型'
  },
  entityId: {
    type: DataTypes.BIGINT,
    allowNull: false,
    field: 'entity_id',
    comment: '实体ID'
  },
  version: {
    type: DataTypes.STRING(20),
    allowNull: false,
    comment: '版本号'
  },
  changes: {
    type: DataTypes.JSON,
    comment: '变更内容'
  },
  changeSummary: {
    type: DataTypes.TEXT,
    field: 'change_summary',
    comment: '变更摘要'
  },
  authorId: {
    type: DataTypes.BIGINT,
    allowNull: false,
    field: 'author_id',
    comment: '作者ID'
  }
}, {
  tableName: 'version_history',
  comment: '版本历史表',
  indexes: [
    { fields: ['entity_type', 'entity_id'] },
    { fields: ['version'] },
    { fields: ['author_id'] },
    { fields: ['created_at'] }
  ]
})

// 系统设置模型
const SystemSetting = sequelize.define('SystemSetting', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  category: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '设置分类'
  },
  keyName: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'key_name',
    comment: '设置键'
  },
  value: {
    type: DataTypes.TEXT,
    comment: '设置值'
  },
  dataType: {
    type: DataTypes.ENUM('string', 'number', 'boolean', 'json'),
    defaultValue: 'string',
    field: 'data_type',
    comment: '数据类型'
  },
  description: {
    type: DataTypes.TEXT,
    comment: '描述'
  },
  isPublic: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_public',
    comment: '是否公开'
  }
}, {
  tableName: 'system_settings',
  comment: '系统设置表',
  indexes: [
    { fields: ['category', 'key_name'], unique: true },
    { fields: ['category'] },
    { fields: ['is_public'] }
  ]
})

// 定义关联关系

// 用户关联
User.hasMany(AgentTemplate, { foreignKey: 'authorId', as: 'agentTemplates' })
User.hasMany(AgentConfig, { foreignKey: 'ownerId', as: 'agentConfigs' })
User.hasMany(Workflow, { foreignKey: 'authorId', as: 'workflows' })
User.hasMany(Capability, { foreignKey: 'authorId', as: 'capabilities' })
User.hasMany(Component, { foreignKey: 'authorId', as: 'components' })
User.hasMany(WorkflowExecution, { foreignKey: 'triggeredBy', as: 'workflowExecutions' })
User.hasMany(VersionHistory, { foreignKey: 'authorId', as: 'versionHistory' })

// Agent模板关联
AgentTemplate.belongsTo(User, { foreignKey: 'authorId', as: 'author' })
AgentTemplate.hasMany(AgentConfig, { foreignKey: 'templateId', as: 'configs' })

// Agent配置关联
AgentConfig.belongsTo(AgentTemplate, { foreignKey: 'templateId', as: 'template' })
AgentConfig.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' })
AgentConfig.hasMany(AgentInstance, { foreignKey: 'configId', as: 'instances' })

// 工作流关联
Workflow.belongsTo(User, { foreignKey: 'authorId', as: 'author' })
Workflow.hasMany(WorkflowExecution, { foreignKey: 'workflowId', as: 'executions' })

// 工作流执行关联
WorkflowExecution.belongsTo(Workflow, { foreignKey: 'workflowId', as: 'workflow' })
WorkflowExecution.belongsTo(User, { foreignKey: 'triggeredBy', as: 'triggeredByUser' })

// 能力关联
Capability.belongsTo(User, { foreignKey: 'authorId', as: 'author' })

// 组件关联
Component.belongsTo(User, { foreignKey: 'authorId', as: 'author' })

// Agent实例关联
AgentInstance.belongsTo(AgentConfig, { foreignKey: 'configId', as: 'config' })
AgentInstance.hasMany(PerformanceMetric, { foreignKey: 'agentId', as: 'metrics' })
AgentInstance.hasMany(SystemLog, { foreignKey: 'agentId', as: 'logs' })
AgentInstance.hasMany(Message, { foreignKey: 'agentId', as: 'messages' })

// 性能指标关联
PerformanceMetric.belongsTo(AgentInstance, { foreignKey: 'agentId', as: 'agent' })

// 系统日志关联
SystemLog.belongsTo(AgentInstance, { foreignKey: 'agentId', as: 'agent' })

// 消息关联
Message.belongsTo(AgentInstance, { foreignKey: 'agentId', as: 'agent' })

// 版本历史关联
VersionHistory.belongsTo(User, { foreignKey: 'authorId', as: 'author' })

module.exports = {
  User,
  AgentTemplate,
  AgentConfig,
  Workflow,
  WorkflowExecution,
  Capability,
  Component,
  AgentInstance,
  PerformanceMetric,
  SystemLog,
  Message,
  VersionHistory,
  SystemSetting
}