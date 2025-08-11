const winston = require('winston')
const path = require('path')
const fs = require('fs')

// 确保日志目录存在
const logDir = process.env.LOG_DIR || 'logs'
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true })
}

// 自定义日志格式
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`
    
    // 添加元数据
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta)}`
    }
    
    // 添加堆栈跟踪
    if (stack) {
      log += `\n${stack}`
    }
    
    return log
  })
)

// 控制台格式
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'HH:mm:ss'
  }),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `${timestamp} ${level}: ${message}`
    
    // 在开发环境显示元数据
    if (process.env.NODE_ENV === 'development' && Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta, null, 2)}`
    }
    
    // 显示堆栈跟踪
    if (stack) {
      log += `\n${stack}`
    }
    
    return log
  })
)

// 创建传输器
const transports = [
  // 控制台输出
  new winston.transports.Console({
    format: consoleFormat,
    level: process.env.NODE_ENV === 'development' ? 'debug' : 'info'
  }),
  
  // 错误日志文件
  new winston.transports.File({
    filename: path.join(logDir, 'error.log'),
    level: 'error',
    format: logFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 5
  }),
  
  // 组合日志文件
  new winston.transports.File({
    filename: path.join(logDir, 'combined.log'),
    format: logFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 5
  })
]

// 在生产环境添加更多传输器
if (process.env.NODE_ENV === 'production') {
  // 警告日志
  transports.push(
    new winston.transports.File({
      filename: path.join(logDir, 'warn.log'),
      level: 'warn',
      format: logFormat,
      maxsize: 5242880,
      maxFiles: 3
    })
  )
  
  // 信息日志
  transports.push(
    new winston.transports.File({
      filename: path.join(logDir, 'info.log'),
      level: 'info',
      format: logFormat,
      maxsize: 10485760, // 10MB
      maxFiles: 3
    })
  )
}

// 创建logger实例
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports,
  // 处理未捕获的异常
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logDir, 'exceptions.log'),
      format: logFormat
    })
  ],
  // 处理未处理的Promise拒绝
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logDir, 'rejections.log'),
      format: logFormat
    })
  ],
  // 退出时不退出进程
  exitOnError: false
})

// 添加请求日志方法
logger.request = (req, res, responseTime) => {
  const { method, url, ip, headers } = req
  const { statusCode } = res
  
  logger.info('HTTP Request', {
    method,
    url,
    ip,
    statusCode,
    responseTime: `${responseTime}ms`,
    userAgent: headers['user-agent'],
    contentLength: headers['content-length']
  })
}

// 添加数据库日志方法
logger.database = (operation, table, duration, error = null) => {
  if (error) {
    logger.error('Database Error', {
      operation,
      table,
      duration: `${duration}ms`,
      error: error.message,
      stack: error.stack
    })
  } else {
    logger.debug('Database Operation', {
      operation,
      table,
      duration: `${duration}ms`
    })
  }
}

// 添加业务日志方法
logger.business = (action, userId, details = {}) => {
  logger.info('Business Action', {
    action,
    userId,
    ...details,
    timestamp: new Date().toISOString()
  })
}

// 添加安全日志方法
logger.security = (event, userId, ip, details = {}) => {
  logger.warn('Security Event', {
    event,
    userId,
    ip,
    ...details,
    timestamp: new Date().toISOString()
  })
}

// 添加性能日志方法
logger.performance = (operation, duration, details = {}) => {
  const level = duration > 1000 ? 'warn' : 'info'
  logger.log(level, 'Performance Metric', {
    operation,
    duration: `${duration}ms`,
    ...details
  })
}

module.exports = logger