const logger = require('../utils/logger')

// 错误代码映射
const ERROR_CODES = {
  // 认证相关错误
  AUTH_001: { status: 401, message: '认证失败' },
  AUTH_002: { status: 403, message: '权限不足' },
  AUTH_003: { status: 401, message: '令牌已过期' },
  
  // 验证相关错误
  VALIDATION_001: { status: 400, message: '请求参数验证失败' },
  VALIDATION_002: { status: 400, message: '数据格式错误' },
  
  // 资源相关错误
  RESOURCE_001: { status: 404, message: '资源不存在' },
  RESOURCE_002: { status: 409, message: '资源已存在' },
  RESOURCE_003: { status: 410, message: '资源已被删除' },
  
  // 业务逻辑错误
  BUSINESS_001: { status: 400, message: '业务逻辑错误' },
  BUSINESS_002: { status: 422, message: '无法处理的实体' },
  
  // 系统错误
  SERVER_001: { status: 500, message: '服务器内部错误' },
  SERVER_002: { status: 503, message: '服务暂时不可用' },
  SERVER_003: { status: 502, message: '网关错误' },
  
  // 数据库错误
  DATABASE_001: { status: 500, message: '数据库连接错误' },
  DATABASE_002: { status: 500, message: '数据库操作失败' },
  DATABASE_003: { status: 409, message: '数据约束冲突' },
  
  // 外部服务错误
  EXTERNAL_001: { status: 502, message: '外部服务错误' },
  EXTERNAL_002: { status: 504, message: '外部服务超时' },
  
  // 限流错误
  RATE_LIMIT_001: { status: 429, message: '请求过于频繁' },
  RATE_LIMIT_002: { status: 429, message: '配额已用完' }
}

// 自定义错误类
class AppError extends Error {
  constructor(code, message = null, details = null) {
    const errorInfo = ERROR_CODES[code] || { status: 500, message: '未知错误' }
    super(message || errorInfo.message)
    
    this.name = 'AppError'
    this.code = code
    this.status = errorInfo.status
    this.details = details
    this.timestamp = new Date().toISOString()
    
    Error.captureStackTrace(this, this.constructor)
  }
}

// 数据库错误处理
const handleDatabaseError = (error) => {
  logger.error('数据库错误:', error)
  
  // Sequelize 错误处理
  if (error.name === 'SequelizeValidationError') {
    const details = error.errors.map(err => ({
      field: err.path,
      message: err.message,
      value: err.value
    }))
    return new AppError('VALIDATION_001', '数据验证失败', details)
  }
  
  if (error.name === 'SequelizeUniqueConstraintError') {
    const field = error.errors[0]?.path || 'unknown'
    return new AppError('DATABASE_003', `${field}已存在`)
  }
  
  if (error.name === 'SequelizeForeignKeyConstraintError') {
    return new AppError('DATABASE_003', '外键约束冲突')
  }
  
  if (error.name === 'SequelizeConnectionError') {
    return new AppError('DATABASE_001', '数据库连接失败')
  }
  
  if (error.name === 'SequelizeTimeoutError') {
    return new AppError('DATABASE_002', '数据库操作超时')
  }
  
  return new AppError('DATABASE_002', '数据库操作失败')
}

// JWT错误处理
const handleJWTError = (error) => {
  if (error.name === 'JsonWebTokenError') {
    return new AppError('AUTH_001', '无效令牌')
  }
  
  if (error.name === 'TokenExpiredError') {
    return new AppError('AUTH_003', '令牌已过期')
  }
  
  if (error.name === 'NotBeforeError') {
    return new AppError('AUTH_001', '令牌尚未生效')
  }
  
  return new AppError('AUTH_001', '令牌验证失败')
}

// 文件上传错误处理
const handleMulterError = (error) => {
  if (error.code === 'LIMIT_FILE_SIZE') {
    return new AppError('VALIDATION_001', '文件大小超出限制')
  }
  
  if (error.code === 'LIMIT_FILE_COUNT') {
    return new AppError('VALIDATION_001', '文件数量超出限制')
  }
  
  if (error.code === 'LIMIT_UNEXPECTED_FILE') {
    return new AppError('VALIDATION_001', '不支持的文件字段')
  }
  
  return new AppError('VALIDATION_001', '文件上传失败')
}

// 开发环境错误响应
const sendErrorDev = (err, req, res) => {
  const response = {
    success: false,
    error: {
      code: err.code || 'SERVER_001',
      message: err.message,
      details: err.details || null,
      stack: err.stack
    },
    timestamp: err.timestamp || new Date().toISOString(),
    path: req.path,
    method: req.method
  }
  
  res.status(err.status || 500).json(response)
}

// 生产环境错误响应
const sendErrorProd = (err, req, res) => {
  // 只发送必要的错误信息
  const response = {
    success: false,
    error: {
      code: err.code || 'SERVER_001',
      message: err.isOperational ? err.message : '服务器内部错误'
    },
    timestamp: err.timestamp || new Date().toISOString()
  }
  
  // 只在客户端错误时包含详细信息
  if (err.status < 500 && err.details) {
    response.error.details = err.details
  }
  
  res.status(err.status || 500).json(response)
}

// 全局错误处理中间件
const globalErrorHandler = (err, req, res, next) => {
  // 设置默认值
  err.status = err.status || 500
  err.code = err.code || 'SERVER_001'
  
  let error = { ...err }
  error.message = err.message
  
  // 处理特定类型的错误
  if (err.name && err.name.startsWith('Sequelize')) {
    error = handleDatabaseError(err)
  } else if (err.name && (err.name.includes('JsonWebToken') || err.name.includes('Token'))) {
    error = handleJWTError(err)
  } else if (err.name === 'MulterError') {
    error = handleMulterError(err)
  } else if (err.type === 'entity.parse.failed') {
    error = new AppError('VALIDATION_002', 'JSON格式错误')
  } else if (err.code === 'ECONNREFUSED') {
    error = new AppError('EXTERNAL_001', '外部服务连接失败')
  } else if (err.code === 'ETIMEDOUT') {
    error = new AppError('EXTERNAL_002', '请求超时')
  }
  
  // 记录错误日志
  const logData = {
    error: {
      name: err.name,
      message: err.message,
      code: error.code,
      status: error.status,
      stack: err.stack
    },
    request: {
      method: req.method,
      url: req.url,
      headers: req.headers,
      body: req.body,
      params: req.params,
      query: req.query,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    },
    user: req.user ? {
      id: req.user.id,
      username: req.user.username,
      role: req.user.role
    } : null
  }
  
  if (error.status >= 500) {
    logger.error('服务器错误:', logData)
  } else if (error.status >= 400) {
    logger.warn('客户端错误:', logData)
  }
  
  // 发送错误响应
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(error, req, res)
  } else {
    sendErrorProd(error, req, res)
  }
}

// 404错误处理中间件
const notFoundHandler = (req, res, next) => {
  const error = new AppError('RESOURCE_001', `路径 ${req.originalUrl} 不存在`)
  next(error)
}

// 异步错误捕获包装器
const catchAsync = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

// 操作结果包装器
const handleResult = (operation) => {
  return catchAsync(async (req, res, next) => {
    try {
      const result = await operation(req, res, next)
      
      // 如果操作已经发送了响应，直接返回
      if (res.headersSent) {
        return
      }
      
      // 标准化成功响应
      const response = {
        success: true,
        data: result,
        timestamp: new Date().toISOString()
      }
      
      res.json(response)
    } catch (error) {
      next(error)
    }
  })
}

// 验证错误创建函数
const createValidationError = (message, details = null) => {
  return new AppError('VALIDATION_001', message, details)
}

// 业务错误创建函数
const createBusinessError = (message, details = null) => {
  return new AppError('BUSINESS_001', message, details)
}

// 资源不存在错误创建函数
const createNotFoundError = (resource = '资源') => {
  return new AppError('RESOURCE_001', `${resource}不存在`)
}

// 权限错误创建函数
const createPermissionError = (message = '权限不足') => {
  return new AppError('AUTH_002', message)
}

module.exports = {
  AppError,
  ERROR_CODES,
  globalErrorHandler,
  notFoundHandler,
  catchAsync,
  handleResult,
  createValidationError,
  createBusinessError,
  createNotFoundError,
  createPermissionError
}