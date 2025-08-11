const express = require('express')
const statisticsController = require('../controllers/statisticsController')
const { authenticate, authorize } = require('../middleware/auth')
const {
  validatePagination,
  handleValidationErrors
} = require('../middleware/validation')
const rateLimit = require('express-rate-limit')

const router = express.Router()

// 统计查询限流
const statisticsLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1分钟
  max: 30, // 最多30次统计查询
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: '统计查询过于频繁，请1分钟后再试'
    }
  }
})

/**
 * @swagger
 * /api/statistics/overview:
 *   get:
 *     summary: 获取系统概览统计
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 获取成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     active:
 *                       type: integer
 *                     newThisMonth:
 *                       type: integer
 *                 agents:
 *                   type: object
 *                   properties:
 *                     templates:
 *                       type: integer
 *                     configurations:
 *                       type: integer
 *                     activeConfigs:
 *                       type: integer
 *                 workflows:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     active:
 *                       type: integer
 *                     executions:
 *                       type: integer
 *                     successRate:
 *                       type: number
 *                 system:
 *                   type: object
 *                   properties:
 *                     uptime:
 *                       type: number
 *                     version:
 *                       type: string
 *                     environment:
 *                       type: string
 *       401:
 *         description: 未认证
 *       403:
 *         description: 权限不足
 */
router.get('/overview',
  authenticate,
  authorize(['admin']),
  statisticsLimiter,
  statisticsController.getOverview
)

/**
 * @swagger
 * /api/statistics/users:
 *   get:
 *     summary: 获取用户统计
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [day, week, month, year]
 *           default: month
 *         description: 统计周期
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: 开始日期
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: 结束日期
 *     responses:
 *       200:
 *         description: 获取成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: integer
 *                 active:
 *                   type: integer
 *                 inactive:
 *                   type: integer
 *                 newUsers:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       date:
 *                         type: string
 *                         format: date
 *                       count:
 *                         type: integer
 *                 activeUsers:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       date:
 *                         type: string
 *                         format: date
 *                       count:
 *                         type: integer
 *                 roleDistribution:
 *                   type: object
 *                   properties:
 *                     admin:
 *                       type: integer
 *                     user:
 *                       type: integer
 *       401:
 *         description: 未认证
 *       403:
 *         description: 权限不足
 */
router.get('/users',
  authenticate,
  authorize(['admin']),
  statisticsLimiter,
  statisticsController.getUserStatistics
)

/**
 * @swagger
 * /api/statistics/agents:
 *   get:
 *     summary: 获取Agent统计
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [day, week, month, year]
 *           default: month
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 特定用户ID（管理员可查看所有用户）
 *     responses:
 *       200:
 *         description: 获取成功
 *       401:
 *         description: 未认证
 */
router.get('/agents',
  authenticate,
  statisticsLimiter,
  statisticsController.getAgentStatistics
)

/**
 * @swagger
 * /api/statistics/workflows:
 *   get:
 *     summary: 获取工作流统计
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [day, week, month, year]
 *           default: month
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 特定用户ID（管理员可查看所有用户）
 *     responses:
 *       200:
 *         description: 获取成功
 *       401:
 *         description: 未认证
 */
router.get('/workflows',
  authenticate,
  statisticsLimiter,
  statisticsController.getWorkflowStatistics
)

/**
 * @swagger
 * /api/statistics/usage:
 *   get:
 *     summary: 获取系统使用统计
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [day, week, month, year]
 *           default: month
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: metric
 *         schema:
 *           type: string
 *           enum: [requests, executions, errors, performance]
 *         description: 特定指标类型
 *     responses:
 *       200:
 *         description: 获取成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 requests:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     successful:
 *                       type: integer
 *                     failed:
 *                       type: integer
 *                     averageResponseTime:
 *                       type: number
 *                 executions:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     successful:
 *                       type: integer
 *                     failed:
 *                       type: integer
 *                     averageExecutionTime:
 *                       type: number
 *                 errors:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     byType:
 *                       type: object
 *                     byComponent:
 *                       type: object
 *                 performance:
 *                   type: object
 *                   properties:
 *                     cpu:
 *                       type: object
 *                     memory:
 *                       type: object
 *                     database:
 *                       type: object
 *                     cache:
 *                       type: object
 *       401:
 *         description: 未认证
 *       403:
 *         description: 权限不足
 */
router.get('/usage',
  authenticate,
  authorize(['admin']),
  statisticsLimiter,
  statisticsController.getUsageStatistics
)

/**
 * @swagger
 * /api/statistics/performance:
 *   get:
 *     summary: 获取性能统计
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [hour, day, week, month]
 *           default: day
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: component
 *         schema:
 *           type: string
 *           enum: [api, database, cache, workflow, agent]
 *         description: 特定组件
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
  statisticsLimiter,
  statisticsController.getPerformanceStatistics
)

/**
 * @swagger
 * /api/statistics/errors:
 *   get:
 *     summary: 获取错误统计
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [hour, day, week, month]
 *           default: day
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: level
 *         schema:
 *           type: string
 *           enum: [error, warn, info]
 *         description: 错误级别
 *       - in: query
 *         name: component
 *         schema:
 *           type: string
 *         description: 组件名称
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
  statisticsLimiter,
  statisticsController.getErrorStatistics
)

/**
 * @swagger
 * /api/statistics/reports:
 *   get:
 *     summary: 获取统计报告列表
 *     tags: [Statistics]
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
 *         name: type
 *         schema:
 *           type: string
 *           enum: [daily, weekly, monthly, custom]
 *         description: 报告类型
 *     responses:
 *       200:
 *         description: 获取成功
 *       401:
 *         description: 未认证
 *       403:
 *         description: 权限不足
 */
router.get('/reports',
  authenticate,
  authorize(['admin']),
  validatePagination,
  handleValidationErrors,
  statisticsController.getReports
)

/**
 * @swagger
 * /api/statistics/reports:
 *   post:
 *     summary: 生成统计报告
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - type
 *               - metrics
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 100
 *               description:
 *                 type: string
 *                 maxLength: 500
 *               type:
 *                 type: string
 *                 enum: [daily, weekly, monthly, custom]
 *               metrics:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [users, agents, workflows, usage, performance, errors]
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *               format:
 *                 type: string
 *                 enum: [json, csv, pdf]
 *                 default: json
 *               schedule:
 *                 type: object
 *                 properties:
 *                   enabled:
 *                     type: boolean
 *                   frequency:
 *                     type: string
 *                     enum: [daily, weekly, monthly]
 *                   time:
 *                     type: string
 *                     pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$'
 *                   recipients:
 *                     type: array
 *                     items:
 *                       type: string
 *                       format: email
 *     responses:
 *       201:
 *         description: 报告生成成功
 *       400:
 *         description: 请求参数错误
 *       401:
 *         description: 未认证
 *       403:
 *         description: 权限不足
 */
router.post('/reports',
  authenticate,
  authorize(['admin']),
  statisticsLimiter,
  statisticsController.generateReport
)

/**
 * @swagger
 * /api/statistics/reports/{id}:
 *   get:
 *     summary: 获取特定统计报告
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: 获取成功
 *       401:
 *         description: 未认证
 *       403:
 *         description: 权限不足
 *       404:
 *         description: 报告不存在
 */
router.get('/reports/:id',
  authenticate,
  authorize(['admin']),
  statisticsController.getReport
)

/**
 * @swagger
 * /api/statistics/reports/{id}/download:
 *   get:
 *     summary: 下载统计报告
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [json, csv, pdf]
 *           default: json
 *     responses:
 *       200:
 *         description: 下载成功
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         description: 未认证
 *       403:
 *         description: 权限不足
 *       404:
 *         description: 报告不存在
 */
router.get('/reports/:id/download',
  authenticate,
  authorize(['admin']),
  statisticsController.downloadReport
)

/**
 * @swagger
 * /api/statistics/reports/{id}/preview:
 *   get:
 *     summary: 预览统计报告HTML页面
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: 预览成功
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 *       401:
 *         description: 未认证
 *       403:
 *         description: 权限不足
 *       404:
 *         description: 报告不存在
 */
router.get('/reports/:id/preview',
  authenticate,
  authorize(['admin']),
  statisticsController.previewReport
)

/**
 * @swagger
 * /api/statistics/export:
 *   post:
 *     summary: 导出统计数据
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - metrics
 *             properties:
 *               metrics:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [users, agents, workflows, usage, performance, errors]
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *               format:
 *                 type: string
 *                 enum: [json, csv, excel]
 *                 default: json
 *               filters:
 *                 type: object
 *                 properties:
 *                   userId:
 *                     type: string
 *                     format: uuid
 *                   component:
 *                     type: string
 *                   level:
 *                     type: string
 *     responses:
 *       200:
 *         description: 导出成功
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: 请求参数错误
 *       401:
 *         description: 未认证
 *       403:
 *         description: 权限不足
 */
router.post('/export',
  authenticate,
  authorize(['admin']),
  statisticsLimiter,
  statisticsController.exportStatistics
)

module.exports = router