const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const compression = require('compression')
const rateLimit = require('express-rate-limit')
const { createServer } = require('http')
const { Server } = require('socket.io')
require('dotenv').config()

const logger = require('./utils/logger')
const { connectDatabase } = require('./database/connection')
const { initRedis } = require('./utils/redis')
const { globalErrorHandler } = require('./middleware/errorHandler')
const authMiddleware = require('./middleware/auth')
const routes = require('./routes')
const websocketHandler = require('./websocket/handler')

class Application {
  constructor() {
    this.app = express()
    this.server = createServer(this.app)
    this.io = new Server(this.server, {
      cors: {
        origin: process.env.WS_CORS_ORIGIN || 'http://localhost:3000',
        methods: ['GET', 'POST']
      }
    })
    this.port = process.env.PORT || 8080
  }

  async initialize() {
    try {
      // 连接数据库（可选）
      const db = await connectDatabase()
      if (db) {
        logger.info('数据库连接成功')
      } else {
        logger.warn('应用将在无数据库模式下运行')
      }

      // 连接Redis（可选）
      try {
        await initRedis()
        logger.info('Redis连接成功')
      } catch (error) {
        logger.warn('Redis连接失败，应用将在无缓存模式下运行')
      }

      // 设置中间件
      this.setupMiddleware()

      // 设置路由
      this.setupRoutes()

      // 设置WebSocket
      this.setupWebSocket()

      // 设置错误处理
      this.setupErrorHandling()

      logger.info('应用初始化完成')
    } catch (error) {
      logger.error('应用初始化失败:', error)
      process.exit(1)
    }
  }

  setupMiddleware() {
    // 安全中间件
    this.app.use(helmet({
      crossOriginEmbedderPolicy: false,
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
        },
      },
    }))

    // CORS配置
    this.app.use(cors({
      origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization']
    }))

    // 压缩响应
    this.app.use(compression())

    // 解析JSON
    this.app.use(express.json({ limit: '10mb' }))
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }))

    // 限流中间件
    const limiter = rateLimit({
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15分钟
      max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // 限制每个IP 100次请求
      message: {
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: '请求过于频繁，请稍后再试'
        }
      },
      standardHeaders: true,
      legacyHeaders: false
    })
    this.app.use('/api/', limiter)

    // 请求日志
    this.app.use((req, res, next) => {
      logger.info(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString()
      })
      next()
    })

    // 静态文件服务
    this.app.use('/uploads', express.static('uploads'))
  }

  setupRoutes() {
    // 健康检查
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        services: {
          database: 'healthy',
          redis: 'healthy'
        }
      })
    })

    // API路由
    this.app.use('/api/v1', routes)

    // 404处理
    this.app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        error: {
          code: 'ROUTE_NOT_FOUND',
          message: '请求的路由不存在'
        },
        timestamp: new Date().toISOString()
      })
    })
  }

  setupWebSocket() {
    // WebSocket认证中间件
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token
        if (!token) {
          return next(new Error('未提供认证令牌'))
        }

        const decoded = authMiddleware.verifyToken(token)
        socket.userId = decoded.sub
        socket.userRole = decoded.role
        next()
      } catch (error) {
        next(new Error('认证失败'))
      }
    })

    // WebSocket事件处理
    this.io.on('connection', (socket) => {
      logger.info(`用户 ${socket.userId} 建立WebSocket连接`)
      websocketHandler.handleConnection(socket, this.io)
    })
  }

  setupErrorHandling() {
    // 全局错误处理
    this.app.use(globalErrorHandler)

    // 未捕获的异常处理
    process.on('uncaughtException', (error) => {
      logger.error('未捕获的异常:', error)
      process.exit(1)
    })

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('未处理的Promise拒绝:', reason)
      process.exit(1)
    })

    // 优雅关闭
    process.on('SIGTERM', () => {
      logger.info('收到SIGTERM信号，开始优雅关闭...')
      this.gracefulShutdown()
    })

    process.on('SIGINT', () => {
      logger.info('收到SIGINT信号，开始优雅关闭...')
      this.gracefulShutdown()
    })
  }

  async gracefulShutdown() {
    try {
      // 关闭HTTP服务器
      this.server.close(() => {
        logger.info('HTTP服务器已关闭')
      })

      // 关闭WebSocket连接
      this.io.close(() => {
        logger.info('WebSocket服务器已关闭')
      })

      // 关闭数据库连接
      const { sequelize } = require('./database/connection')
      await sequelize.close()
      logger.info('数据库连接已关闭')

      // 关闭Redis连接
      const { closeRedis } = require('./utils/redis')
      await closeRedis()
      logger.info('Redis连接已关闭')

      logger.info('应用已优雅关闭')
      process.exit(0)
    } catch (error) {
      logger.error('优雅关闭失败:', error)
      process.exit(1)
    }
  }

  start() {
    this.server.listen(this.port, () => {
      logger.info(`服务器启动成功，端口: ${this.port}`)
      logger.info(`环境: ${process.env.NODE_ENV || 'development'}`)
      logger.info(`API文档: http://localhost:${this.port}/api/v1`)
    })
  }
}

// 启动应用
const app = new Application()
console.log('开始初始化应用...')
app.initialize().then(() => {
  console.log('应用初始化完成，开始启动服务器...')
  app.start()
}).catch((error) => {
  console.error('应用启动失败:', error)
  logger.error('应用启动失败:', error)
  process.exit(1)
})

module.exports = app