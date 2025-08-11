/**
 * 分析洞察模块数据模型
 * 定义性能指标、用户活动、系统监控等数据表结构
 * 基于EFIAgent产品设计文档实现
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// 性能指标表
const PerformanceMetric = sequelize.define('PerformanceMetric', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  timestamp: {
    type: DataTypes.DATE,
    allowNull: false,
    index: true
  },
  metricType: {
    type: DataTypes.ENUM(
      'response_time',
      'throughput',
      'success_rate',
      'error_rate',
      'cpu_usage',
      'memory_usage',
      'disk_usage',
      'network_io',
      'queue_length',
      'connection_count'
    ),
    allowNull: false,
    index: true
  },
  value: {
    type: DataTypes.DECIMAL(15, 6),
    allowNull: false
  },
  unit: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  agentId: {
    type: DataTypes.UUID,
    allowNull: true,
    index: true,
    references: {
      model: 'Agents',
      key: 'id'
    }
  },
  nodeId: {
    type: DataTypes.UUID,
    allowNull: true,
    index: true
  },
  tags: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {}
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {}
  }
}, {
  tableName: 'performance_metrics',
  indexes: [
    {
      fields: ['timestamp', 'metricType']
    },
    {
      fields: ['agentId', 'timestamp']
    },
    {
      fields: ['nodeId', 'timestamp']
    },
    {
      fields: ['metricType', 'timestamp']
    }
  ],
  // 分区表配置（按时间分区）
  hooks: {
    beforeCreate: (metric) => {
      // 确保时间戳为UTC
      if (metric.timestamp) {
        metric.timestamp = new Date(metric.timestamp);
      }
    }
  }
});

// 系统指标表
const SystemMetric = sequelize.define('SystemMetric', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  timestamp: {
    type: DataTypes.DATE,
    allowNull: false,
    index: true
  },
  nodeId: {
    type: DataTypes.UUID,
    allowNull: false,
    index: true
  },
  cpuUsage: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    validate: {
      min: 0,
      max: 100
    }
  },
  memoryUsage: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    validate: {
      min: 0,
      max: 100
    }
  },
  diskUsage: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    validate: {
      min: 0,
      max: 100
    }
  },
  networkIn: {
    type: DataTypes.BIGINT,
    allowNull: true,
    defaultValue: 0
  },
  networkOut: {
    type: DataTypes.BIGINT,
    allowNull: true,
    defaultValue: 0
  },
  loadAverage: {
    type: DataTypes.DECIMAL(8, 4),
    allowNull: true
  },
  processCount: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  connectionCount: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {}
  }
}, {
  tableName: 'system_metrics',
  indexes: [
    {
      fields: ['nodeId', 'timestamp']
    },
    {
      fields: ['timestamp']
    }
  ]
});

// 用户活动表
const UserActivity = sequelize.define('UserActivity', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    index: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  sessionId: {
    type: DataTypes.UUID,
    allowNull: true,
    index: true
  },
  action: {
    type: DataTypes.STRING(100),
    allowNull: false,
    index: true
  },
  resource: {
    type: DataTypes.STRING(200),
    allowNull: true
  },
  resourceId: {
    type: DataTypes.UUID,
    allowNull: true
  },
  timestamp: {
    type: DataTypes.DATE,
    allowNull: false,
    index: true
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '持续时间（毫秒）'
  },
  ipAddress: {
    type: DataTypes.INET,
    allowNull: true
  },
  userAgent: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  referrer: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {}
  }
}, {
  tableName: 'user_activities',
  indexes: [
    {
      fields: ['userId', 'timestamp']
    },
    {
      fields: ['sessionId', 'timestamp']
    },
    {
      fields: ['action', 'timestamp']
    },
    {
      fields: ['timestamp']
    }
  ]
});

// Agent执行记录表
const AgentExecution = sequelize.define('AgentExecution', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  agentId: {
    type: DataTypes.UUID,
    allowNull: false,
    index: true,
    references: {
      model: 'Agents',
      key: 'id'
    }
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    index: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  workflowId: {
    type: DataTypes.UUID,
    allowNull: true,
    index: true
  },
  status: {
    type: DataTypes.ENUM(
      'pending',
      'running',
      'completed',
      'failed',
      'cancelled',
      'timeout'
    ),
    allowNull: false,
    defaultValue: 'pending',
    index: true
  },
  startTime: {
    type: DataTypes.DATE,
    allowNull: false,
    index: true
  },
  endTime: {
    type: DataTypes.DATE,
    allowNull: true
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '执行时长（毫秒）'
  },
  inputTokens: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0
  },
  outputTokens: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0
  },
  cost: {
    type: DataTypes.DECIMAL(10, 6),
    allowNull: true,
    defaultValue: 0
  },
  errorMessage: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  errorCode: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  input: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  output: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {}
  }
}, {
  tableName: 'agent_executions',
  indexes: [
    {
      fields: ['agentId', 'startTime']
    },
    {
      fields: ['userId', 'startTime']
    },
    {
      fields: ['status', 'startTime']
    },
    {
      fields: ['startTime']
    }
  ],
  hooks: {
    beforeUpdate: (execution) => {
      // 自动计算执行时长
      if (execution.endTime && execution.startTime && !execution.duration) {
        execution.duration = new Date(execution.endTime) - new Date(execution.startTime);
      }
    }
  }
});

// 工作流执行记录表
const WorkflowExecution = sequelize.define('WorkflowExecution', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  workflowId: {
    type: DataTypes.UUID,
    allowNull: false,
    index: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    index: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM(
      'pending',
      'running',
      'completed',
      'failed',
      'cancelled',
      'paused'
    ),
    allowNull: false,
    defaultValue: 'pending',
    index: true
  },
  startTime: {
    type: DataTypes.DATE,
    allowNull: false,
    index: true
  },
  endTime: {
    type: DataTypes.DATE,
    allowNull: true
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '执行时长（毫秒）'
  },
  stepCount: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0
  },
  successSteps: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0
  },
  failedSteps: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0
  },
  totalCost: {
    type: DataTypes.DECIMAL(10, 6),
    allowNull: true,
    defaultValue: 0
  },
  errorMessage: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  input: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  output: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {}
  }
}, {
  tableName: 'workflow_executions',
  indexes: [
    {
      fields: ['workflowId', 'startTime']
    },
    {
      fields: ['userId', 'startTime']
    },
    {
      fields: ['status', 'startTime']
    },
    {
      fields: ['startTime']
    }
  ]
});

// API调用记录表
const ApiCall = sequelize.define('ApiCall', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: true,
    index: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  endpoint: {
    type: DataTypes.STRING(500),
    allowNull: false,
    index: true
  },
  method: {
    type: DataTypes.ENUM('GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'),
    allowNull: false,
    index: true
  },
  statusCode: {
    type: DataTypes.INTEGER,
    allowNull: false,
    index: true
  },
  responseTime: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '响应时间（毫秒）'
  },
  requestSize: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0,
    comment: '请求大小（字节）'
  },
  responseSize: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0,
    comment: '响应大小（字节）'
  },
  timestamp: {
    type: DataTypes.DATE,
    allowNull: false,
    index: true
  },
  ipAddress: {
    type: DataTypes.INET,
    allowNull: true
  },
  userAgent: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  referrer: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  errorMessage: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {}
  }
}, {
  tableName: 'api_calls',
  indexes: [
    {
      fields: ['userId', 'timestamp']
    },
    {
      fields: ['endpoint', 'timestamp']
    },
    {
      fields: ['method', 'timestamp']
    },
    {
      fields: ['statusCode', 'timestamp']
    },
    {
      fields: ['timestamp']
    }
  ]
});

// 分析报告表
const AnalysisReport = sequelize.define('AnalysisReport', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    index: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  reportType: {
    type: DataTypes.ENUM(
      'performance',
      'usage',
      'trend',
      'comprehensive',
      'custom'
    ),
    allowNull: false,
    index: true
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  timeRange: {
    type: DataTypes.JSONB,
    allowNull: false,
    comment: '时间范围配置'
  },
  modules: {
    type: DataTypes.JSONB,
    allowNull: false,
    comment: '包含的分析模块'
  },
  format: {
    type: DataTypes.ENUM('json', 'pdf', 'excel', 'csv'),
    allowNull: false,
    defaultValue: 'json'
  },
  status: {
    type: DataTypes.ENUM(
      'pending',
      'generating',
      'completed',
      'failed'
    ),
    allowNull: false,
    defaultValue: 'pending',
    index: true
  },
  filePath: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  fileSize: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  downloadCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {}
  }
}, {
  tableName: 'analysis_reports',
  indexes: [
    {
      fields: ['userId', 'createdAt']
    },
    {
      fields: ['reportType', 'createdAt']
    },
    {
      fields: ['status']
    }
  ]
});

// 分析配置表
const AnalysisConfig = sequelize.define('AnalysisConfig', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    unique: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  performanceThresholds: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {
      responseTime: { warning: 1000, critical: 3000 },
      errorRate: { warning: 0.05, critical: 0.1 },
      cpuUsage: { warning: 80, critical: 95 },
      memoryUsage: { warning: 85, critical: 95 }
    }
  },
  alertRules: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: []
  },
  retentionPeriod: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 90,
    comment: '数据保留天数'
  },
  samplingRate: {
    type: DataTypes.DECIMAL(3, 2),
    allowNull: false,
    defaultValue: 1.0,
    validate: {
      min: 0.01,
      max: 1.0
    }
  },
  enableRealtime: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  dashboardConfig: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {}
  },
  notificationSettings: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {
      email: true,
      webhook: false,
      slack: false
    }
  }
}, {
  tableName: 'analysis_configs'
});

// 定义关联关系
PerformanceMetric.belongsTo(sequelize.models.Agent, {
  foreignKey: 'agentId',
  as: 'agent'
});

UserActivity.belongsTo(sequelize.models.User, {
  foreignKey: 'userId',
  as: 'user'
});

AgentExecution.belongsTo(sequelize.models.Agent, {
  foreignKey: 'agentId',
  as: 'agent'
});

AgentExecution.belongsTo(sequelize.models.User, {
  foreignKey: 'userId',
  as: 'user'
});

WorkflowExecution.belongsTo(sequelize.models.User, {
  foreignKey: 'userId',
  as: 'user'
});

ApiCall.belongsTo(sequelize.models.User, {
  foreignKey: 'userId',
  as: 'user'
});

AnalysisReport.belongsTo(sequelize.models.User, {
  foreignKey: 'userId',
  as: 'user'
});

AnalysisConfig.belongsTo(sequelize.models.User, {
  foreignKey: 'userId',
  as: 'user'
});

module.exports = {
  PerformanceMetric,
  SystemMetric,
  UserActivity,
  AgentExecution,
  WorkflowExecution,
  ApiCall,
  AnalysisReport,
  AnalysisConfig
};