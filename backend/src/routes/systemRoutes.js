const express = require('express')
const systemController = require('../controllers/systemController')
const { authenticate, authorize } = require('../middleware/auth')
const {
  validatePagination,
  handleValidationErrors
} = require('../middleware/validation')
const rateLimit = require('express-rate-limit')

const router = express.Router()

// 系统操作限流
const systemLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5分钟
  max: 10, // 最多10次系统操作
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: '系统操作过于频繁，请5分钟后再试'
    }
  }
})

/**
 * @swagger
 * /api/system/info:
 *   get:
 *     summary: 获取系统信息
 *     tags: [System]
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
 *                 version:
 *                   type: string
 *                 environment:
 *                   type: string
 *                 uptime:
 *                   type: number
 *                 nodeVersion:
 *                   type: string
 *                 platform:
 *                   type: string
 *                 architecture:
 *                   type: string
 *                 memory:
 *                   type: object
 *                 cpu:
 *                   type: object
 *                 database:
 *                   type: object
 *                 redis:
 *                   type: object
 *       401:
 *         description: 未认证
 *       403:
 *         description: 权限不足
 */
router.get('/info',
  authenticate,
  authorize(['admin']),
  systemController.getSystemInfo
)

/**
 * @swagger
 * /api/system/config:
 *   get:
 *     summary: 获取系统配置
 *     tags: [System]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 获取成功
 *       401:
 *         description: 未认证
 *       403:
 *         description: 权限不足
 */
router.get('/config',
  authenticate,
  authorize(['admin']),
  systemController.getSystemConfig
)

/**
 * @swagger
 * /api/system/config:
 *   put:
 *     summary: 更新系统配置
 *     tags: [System]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               general:
 *                 type: object
 *                 properties:
 *                   siteName:
 *                     type: string
 *                   siteDescription:
 *                     type: string
 *                   allowRegistration:
 *                     type: boolean
 *                   defaultUserRole:
 *                     type: string
 *                     enum: [user, admin]
 *               security:
 *                 type: object
 *                 properties:
 *                   jwtExpiration:
 *                     type: string
 *                   refreshTokenExpiration:
 *                     type: string
 *                   passwordMinLength:
 *                     type: integer
 *                   maxLoginAttempts:
 *                     type: integer
 *               features:
 *                 type: object
 *                 properties:
 *                   enableWorkflows:
 *                     type: boolean
 *                   enableComponents:
 *                     type: boolean
 *                   enableMonitoring:
 *                     type: boolean
 *               limits:
 *                 type: object
 *                 properties:
 *                   maxAgentsPerUser:
 *                     type: integer
 *                   maxWorkflowsPerUser:
 *                     type: integer
 *                   maxExecutionsPerDay:
 *                     type: integer
 *     responses:
 *       200:
 *         description: 更新成功
 *       400:
 *         description: 请求参数错误
 *       401:
 *         description: 未认证
 *       403:
 *         description: 权限不足
 */
router.put('/config',
  authenticate,
  authorize(['admin']),
  systemLimiter,
  systemController.updateSystemConfig
)

/**
 * @swagger
 * /api/system/backup:
 *   post:
 *     summary: 创建系统备份
 *     tags: [System]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [full, incremental]
 *                 default: full
 *               description:
 *                 type: string
 *                 maxLength: 200
 *               includeFiles:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       201:
 *         description: 备份创建成功
 *       401:
 *         description: 未认证
 *       403:
 *         description: 权限不足
 *       500:
 *         description: 备份创建失败
 */
router.post('/backup',
  authenticate,
  authorize(['admin']),
  systemLimiter,
  systemController.createBackup
)

/**
 * @swagger
 * /api/system/backups:
 *   get:
 *     summary: 获取备份列表
 *     tags: [System]
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
 *           enum: [full, incremental]
 *         description: 备份类型筛选
 *     responses:
 *       200:
 *         description: 获取成功
 *       401:
 *         description: 未认证
 *       403:
 *         description: 权限不足
 */
router.get('/backups',
  authenticate,
  authorize(['admin']),
  validatePagination,
  handleValidationErrors,
  systemController.getBackups
)

/**
 * @swagger
 * /api/system/backups/{id}/restore:
 *   post:
 *     summary: 恢复系统备份
 *     tags: [System]
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
 *               confirmRestore:
 *                 type: boolean
 *                 description: 确认恢复操作
 *               restoreFiles:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       200:
 *         description: 恢复成功
 *       400:
 *         description: 请求参数错误
 *       401:
 *         description: 未认证
 *       403:
 *         description: 权限不足
 *       404:
 *         description: 备份不存在
 *       500:
 *         description: 恢复失败
 */
router.post('/backups/:id/restore',
  authenticate,
  authorize(['admin']),
  systemLimiter,
  systemController.restoreBackup
)

/**
 * @swagger
 * /api/system/maintenance:
 *   post:
 *     summary: 进入维护模式
 *     tags: [System]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *                 maxLength: 500
 *                 description: 维护提示信息
 *               estimatedDuration:
 *                 type: integer
 *                 description: 预计维护时长（分钟）
 *     responses:
 *       200:
 *         description: 进入维护模式成功
 *       401:
 *         description: 未认证
 *       403:
 *         description: 权限不足
 */
router.post('/maintenance',
  authenticate,
  authorize(['admin']),
  systemLimiter,
  systemController.enableMaintenance
)

/**
 * @swagger
 * /api/system/maintenance:
 *   delete:
 *     summary: 退出维护模式
 *     tags: [System]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 退出维护模式成功
 *       401:
 *         description: 未认证
 *       403:
 *         description: 权限不足
 */
router.delete('/maintenance',
  authenticate,
  authorize(['admin']),
  systemController.disableMaintenance
)

/**
 * @swagger
 * /api/system/cache/clear:
 *   post:
 *     summary: 清理系统缓存
 *     tags: [System]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cacheTypes:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [users, templates, configs, workflows, sessions]
 *                 description: 要清理的缓存类型，不指定则清理所有
 *     responses:
 *       200:
 *         description: 缓存清理成功
 *       401:
 *         description: 未认证
 *       403:
 *         description: 权限不足
 */
router.post('/cache/clear',
  authenticate,
  authorize(['admin']),
  systemLimiter,
  systemController.clearCache
)

/**
 * @swagger
 * /api/system/database/optimize:
 *   post:
 *     summary: 优化数据库
 *     tags: [System]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               operations:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [analyze, vacuum, reindex, cleanup]
 *                 description: 要执行的优化操作
 *     responses:
 *       200:
 *         description: 数据库优化成功
 *       401:
 *         description: 未认证
 *       403:
 *         description: 权限不足
 *       500:
 *         description: 优化失败
 */
router.post('/database/optimize',
  authenticate,
  authorize(['admin']),
  systemLimiter,
  systemController.optimizeDatabase
)

/**
 * @swagger
 * /api/system/logs/export:
 *   post:
 *     summary: 导出系统日志
 *     tags: [System]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *               level:
 *                 type: string
 *                 enum: [error, warn, info, debug]
 *               component:
 *                 type: string
 *               format:
 *                 type: string
 *                 enum: [json, csv, txt]
 *                 default: json
 *     responses:
 *       200:
 *         description: 导出成功
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         description: 未认证
 *       403:
 *         description: 权限不足
 */
router.post('/logs/export',
  authenticate,
  authorize(['admin']),
  systemLimiter,
  systemController.exportLogs
)

/**
 * @swagger
 * /api/system/security/scan:
 *   post:
 *     summary: 执行安全扫描
 *     tags: [System]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               scanTypes:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [vulnerabilities, permissions, configurations, dependencies]
 *                 description: 扫描类型
 *     responses:
 *       200:
 *         description: 扫描完成
 *       401:
 *         description: 未认证
 *       403:
 *         description: 权限不足
 */
router.post('/security/scan',
  authenticate,
  authorize(['admin']),
  systemLimiter,
  systemController.securityScan
)

/**
 * @swagger
 * /api/system/updates/check:
 *   get:
 *     summary: 检查系统更新
 *     tags: [System]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 检查完成
 *       401:
 *         description: 未认证
 *       403:
 *         description: 权限不足
 */
router.get('/updates/check',
  authenticate,
  authorize(['admin']),
  systemController.checkUpdates
)

/**
 * @swagger
 * /api/system/updates/apply:
 *   post:
 *     summary: 应用系统更新
 *     tags: [System]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - version
 *             properties:
 *               version:
 *                 type: string
 *                 description: 要更新到的版本
 *               autoRestart:
 *                 type: boolean
 *                 default: false
 *                 description: 是否自动重启
 *     responses:
 *       200:
 *         description: 更新成功
 *       400:
 *         description: 请求参数错误
 *       401:
 *         description: 未认证
 *       403:
 *         description: 权限不足
 *       500:
 *         description: 更新失败
 */
router.post('/updates/apply',
  authenticate,
  authorize(['admin']),
  systemLimiter,
  systemController.applyUpdate
)

module.exports = router