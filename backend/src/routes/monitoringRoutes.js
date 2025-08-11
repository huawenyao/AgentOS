const express = require('express')
const monitoringController = require('../controllers/monitoringController')
const { authenticate, authorize } = require('../middleware/auth')
const {
  validateUuidParam,
  validatePagination,
  handleValidationErrors
} = require('../middleware/validation')
const rateLimit = require('express-rate-limit')

const router = express.Router()

// 监控查询限流
const monitoringLimiter = rateLimit({
  windowMs: 60 * 1000, // 1分钟
  max: 60, // 最多60次查询
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: '监控查询过于频繁，请稍后再试'
    }
  }
})

/**
 * @swagger
 * /api/monitoring/health:
 *   get:
 *     summary: 系统健康检查
 *     tags: [Monitoring]
 *     responses:
 *       200:
 *         description: 系统健康
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [healthy, degraded, unhealthy]
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 services:
 *                   type: object
 *                   properties:
 *                     database:
 *                       type: object
 *                       properties:
 *                         status:
 *                           type: string
 *                         responseTime:
 *                           type: number
 *                     redis:
 *                       type: object
 *                       properties:
 *                         status:
 *                           type: string
 *                         responseTime:
 *                           type: number
 *                     external:
 *                       type: object
 *                       properties:
 *                         status:
 *                           type: string
 *                         responseTime:
 *                           type: number
 *       503:
 *         description: 系统不健康
 */
router.get('/health', monitoringController.getSystemHealth)

/**
 * @swagger
 * /api/monitoring/metrics:
 *   get:
 *     summary: 获取系统指标
 *     tags: [Monitoring]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: timeRange
 *         schema:
 *           type: string
 *           enum: [1h, 6h, 24h, 7d, 30d]
 *           default: 1h
 *         description: 时间范围
 *       - in: query
 *         name: metrics
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *             enum: [cpu, memory, disk, network, requests, errors, response_time]
 *         description: 指定要获取的指标
 *     responses:
 *       200:
 *         description: 获取成功
 *       401:
 *         description: 未认证
 *       403:
 *         description: 权限不足
 */
router.get('/metrics',
  authenticate,
  authorize(['admin']),
  monitoringLimiter,
  monitoringController.getSystemMetrics
)

/**
 * @swagger
 * /api/monitoring/performance:
 *   get:
 *     summary: 获取性能指标
 *     tags: [Monitoring]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: timeRange
 *         schema:
 *           type: string
 *           enum: [1h, 6h, 24h, 7d, 30d]
 *           default: 1h
 *       - in: query
 *         name: component
 *         schema:
 *           type: string
 *           enum: [api, workflow, agent, database]
 *         description: 组件筛选
 *     responses:
 *       200:
 *         description: 获取成功
 *       401:
 *         description: 未认证
 *       403:
 *         description: 权限不足
 */
router.get('/performance',
  authenticate,
  authorize(['admin']),
  monitoringLimiter,
  monitoringController.getPerformanceMetrics
)

/**
 * @swagger
 * /api/monitoring/logs:
 *   get:
 *     summary: 获取系统日志
 *     tags: [Monitoring]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 1000
 *           default: 100
 *       - in: query
 *         name: level
 *         schema:
 *           type: string
 *           enum: [error, warn, info, debug]
 *         description: 日志级别筛选
 *       - in: query
 *         name: component
 *         schema:
 *           type: string
 *         description: 组件筛选
 *       - in: query
 *         name: startTime
 *         schema:
 *           type: string
 *           format: date-time
 *         description: 开始时间
 *       - in: query
 *         name: endTime
 *         schema:
 *           type: string
 *           format: date-time
 *         description: 结束时间
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: 搜索关键词
 *     responses:
 *       200:
 *         description: 获取成功
 *       401:
 *         description: 未认证
 *       403:
 *         description: 权限不足
 */
router.get('/logs',
  authenticate,
  authorize(['admin']),
  validatePagination,
  handleValidationErrors,
  monitoringLimiter,
  monitoringController.getSystemLogs
)

/**
 * @swagger
 * /api/monitoring/alerts:
 *   get:
 *     summary: 获取告警列表
 *     tags: [Monitoring]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, resolved, acknowledged]
 *         description: 告警状态筛选
 *       - in: query
 *         name: severity
 *         schema:
 *           type: string
 *           enum: [critical, high, medium, low]
 *         description: 严重程度筛选
 *       - in: query
 *         name: component
 *         schema:
 *           type: string
 *         description: 组件筛选
 *     responses:
 *       200:
 *         description: 获取成功
 *       401:
 *         description: 未认证
 *       403:
 *         description: 权限不足
 */
router.get('/alerts',
  authenticate,
  authorize(['admin']),
  validatePagination,
  handleValidationErrors,
  monitoringController.getAlerts
)

/**
 * @swagger
 * /api/monitoring/alerts/{id}/acknowledge:
 *   post:
 *     summary: 确认告警
 *     tags: [Monitoring]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               comment:
 *                 type: string
 *                 maxLength: 500
 *                 description: 确认备注
 *     responses:
 *       200:
 *         description: 确认成功
 *       401:
 *         description: 未认证
 *       403:
 *         description: 权限不足
 *       404:
 *         description: 告警不存在
 */
router.post('/alerts/:id/acknowledge',
  authenticate,
  authorize(['admin']),
  validateUuidParam('id'),
  handleValidationErrors,
  monitoringController.acknowledgeAlert
)

/**
 * @swagger
 * /api/monitoring/alerts/{id}/resolve:
 *   post:
 *     summary: 解决告警
 *     tags: [Monitoring]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               resolution:
 *                 type: string
 *                 maxLength: 1000
 *                 description: 解决方案描述
 *     responses:
 *       200:
 *         description: 解决成功
 *       401:
 *         description: 未认证
 *       403:
 *         description: 权限不足
 *       404:
 *         description: 告警不存在
 */
router.post('/alerts/:id/resolve',
  authenticate,
  authorize(['admin']),
  validateUuidParam('id'),
  handleValidationErrors,
  monitoringController.resolveAlert
)

/**
 * @swagger
 * /api/monitoring/usage:
 *   get:
 *     summary: 获取使用情况统计
 *     tags: [Monitoring]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: timeRange
 *         schema:
 *           type: string
 *           enum: [1h, 6h, 24h, 7d, 30d]
 *           default: 24h
 *       - in: query
 *         name: groupBy
 *         schema:
 *           type: string
 *           enum: [user, endpoint, agent, workflow]
 *         description: 分组方式
 *     responses:
 *       200:
 *         description: 获取成功
 *       401:
 *         description: 未认证
 *       403:
 *         description: 权限不足
 */
router.get('/usage',
  authenticate,
  authorize(['admin']),
  monitoringLimiter,
  monitoringController.getUsageStats
)

/**
 * @swagger
 * /api/monitoring/errors:
 *   get:
 *     summary: 获取错误统计
 *     tags: [Monitoring]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *       - in: query
 *         name: timeRange
 *         schema:
 *           type: string
 *           enum: [1h, 6h, 24h, 7d, 30d]
 *           default: 24h
 *       - in: query
 *         name: component
 *         schema:
 *           type: string
 *         description: 组件筛选
 *       - in: query
 *         name: errorType
 *         schema:
 *           type: string
 *         description: 错误类型筛选
 *     responses:
 *       200:
 *         description: 获取成功
 *       401:
 *         description: 未认证
 *       403:
 *         description: 权限不足
 */
router.get('/errors',
  authenticate,
  authorize(['admin']),
  validatePagination,
  handleValidationErrors,
  monitoringLimiter,
  monitoringController.getErrorStats
)

/**
 * @swagger
 * /api/monitoring/agents:
 *   get:
 *     summary: 获取Agent监控信息
 *     tags: [Monitoring]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, error]
 *         description: 状态筛选
 *     responses:
 *       200:
 *         description: 获取成功
 *       401:
 *         description: 未认证
 */
router.get('/agents',
  authenticate,
  validatePagination,
  handleValidationErrors,
  monitoringController.getAgentMonitoring
)

/**
 * @swagger
 * /api/monitoring/workflows:
 *   get:
 *     summary: 获取工作流监控信息
 *     tags: [Monitoring]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [running, completed, failed, cancelled]
 *         description: 状态筛选
 *       - in: query
 *         name: timeRange
 *         schema:
 *           type: string
 *           enum: [1h, 6h, 24h, 7d, 30d]
 *           default: 24h
 *     responses:
 *       200:
 *         description: 获取成功
 *       401:
 *         description: 未认证
 */
router.get('/workflows',
  authenticate,
  validatePagination,
  handleValidationErrors,
  monitoringController.getWorkflowMonitoring
)

/**
 * @swagger
 * /api/monitoring/dashboard:
 *   get:
 *     summary: 获取监控仪表板数据
 *     tags: [Monitoring]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: timeRange
 *         schema:
 *           type: string
 *           enum: [1h, 6h, 24h, 7d, 30d]
 *           default: 24h
 *     responses:
 *       200:
 *         description: 获取成功
 *       401:
 *         description: 未认证
 *       403:
 *         description: 权限不足
 */
router.get('/dashboard',
  authenticate,
  authorize(['admin']),
  monitoringLimiter,
  monitoringController.getDashboardData
)

module.exports = router