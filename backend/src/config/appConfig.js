/**
 * 应用配置文件
 * 用于控制应用的各种功能开关和配置参数
 */

module.exports = {
  // 数据源配置
  dataSource: {
    // 是否使用模拟数据 (true: 使用模拟数据, false: 使用数据库)
    useMockData: process.env.USE_MOCK_DATA === 'true' || false,
    
    // 模拟数据配置
    mockData: {
      // 是否启用模拟延迟
      enableDelay: true,
      // 模拟延迟时间范围 (毫秒)
      delayRange: {
        min: 100,
        max: 500
      },
      // 是否启用随机错误
      enableRandomErrors: false,
      // 随机错误概率 (0-1)
      errorProbability: 0.05
    }
  },
  
  // API配置
  api: {
    // 默认分页大小
    defaultPageSize: 10,
    // 最大分页大小
    maxPageSize: 100,
    // API版本
    version: 'v1',
    // 是否启用API文档
    enableDocs: process.env.NODE_ENV === 'development'
  },
  
  // 缓存配置
  cache: {
    // 是否启用缓存
    enabled: process.env.REDIS_URL ? true : false,
    // 默认缓存时间 (秒)
    defaultTTL: 300,
    // 缓存键前缀
    keyPrefix: 'efiagent:'
  },
  
  // 日志配置
  logging: {
    // 日志级别
    level: process.env.LOG_LEVEL || 'info',
    // 是否启用请求日志
    enableRequestLog: true,
    // 是否启用性能日志
    enablePerformanceLog: true
  },
  
  // 安全配置
  security: {
    // JWT密钥
    jwtSecret: process.env.JWT_SECRET || 'efiagent-secret-key',
    // JWT过期时间
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
    // 是否启用CORS
    enableCors: true,
    // 允许的源
    corsOrigins: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ['http://localhost:3000', 'http://localhost:3001']
  },
  
  // 功能开关
  features: {
    // 是否启用用户注册
    enableUserRegistration: true,
    // 是否启用邮件验证
    enableEmailVerification: false,
    // 是否启用文件上传
    enableFileUpload: true,
    // 是否启用WebSocket
    enableWebSocket: true,
    // 是否启用监控
    enableMonitoring: true
  }
}