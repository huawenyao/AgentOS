const express = require('express')
const router = express.Router()
const settingsController = require('../controllers/settingsController')
const { authenticate, authorize } = require('../middleware/auth')
const { handleValidationErrors } = require('../middleware/validation')
const { body } = require('express-validator')

/**
 * 设置路由
 * 处理系统设置和模型配置相关的API路由
 */

// ==================== 系统设置路由 ====================

/**
 * @route GET /api/settings/system
 * @desc 获取系统设置
 * @access Private (需要登录)
 */
router.get('/system', 
  authenticate,
  settingsController.getSystemSettings
)

/**
 * @route PUT /api/settings/system
 * @desc 更新系统设置
 * @access Private (仅管理员)
 */
router.put('/system',
  authenticate,
  authorize('admin'),
  [
    body('general.siteName').optional().isLength({ min: 1, max: 100 }).withMessage('站点名称长度必须在1-100字符之间'),
    body('general.siteDescription').optional().isLength({ max: 500 }).withMessage('站点描述不能超过500字符'),
    body('general.allowRegistration').optional().isBoolean().withMessage('允许注册必须是布尔值'),
    body('general.defaultUserRole').optional().isIn(['user', 'developer', 'admin']).withMessage('默认用户角色无效'),
    body('general.timezone').optional().isString().withMessage('时区必须是字符串'),
    body('general.language').optional().isString().withMessage('语言必须是字符串'),
    
    body('security.jwtExpiration').optional().isString().withMessage('JWT过期时间必须是字符串'),
    body('security.refreshTokenExpiration').optional().isString().withMessage('刷新令牌过期时间必须是字符串'),
    body('security.passwordMinLength').optional().isInt({ min: 6, max: 50 }).withMessage('密码最小长度必须在6-50之间'),
    body('security.maxLoginAttempts').optional().isInt({ min: 1, max: 20 }).withMessage('最大登录尝试次数必须在1-20之间'),
    body('security.enableTwoFactor').optional().isBoolean().withMessage('双因子认证必须是布尔值'),
    body('security.sessionTimeout').optional().isInt({ min: 300, max: 86400 }).withMessage('会话超时时间必须在300-86400秒之间'),
    
    body('features.enableWorkflows').optional().isBoolean().withMessage('启用工作流必须是布尔值'),
    body('features.enableComponents').optional().isBoolean().withMessage('启用组件必须是布尔值'),
    body('features.enableMonitoring').optional().isBoolean().withMessage('启用监控必须是布尔值'),
    body('features.enableVersionControl').optional().isBoolean().withMessage('启用版本控制必须是布尔值'),
    body('features.enableCollaboration').optional().isBoolean().withMessage('启用协作必须是布尔值'),
    
    body('limits.maxAgentsPerUser').optional().isInt({ min: 1, max: 1000 }).withMessage('每用户最大Agent数量必须在1-1000之间'),
    body('limits.maxWorkflowsPerUser').optional().isInt({ min: 1, max: 500 }).withMessage('每用户最大工作流数量必须在1-500之间'),
    body('limits.maxExecutionsPerDay').optional().isInt({ min: 1, max: 100000 }).withMessage('每日最大执行次数必须在1-100000之间'),
    body('limits.maxFileSize').optional().isInt({ min: 1024, max: 104857600 }).withMessage('最大文件大小必须在1KB-100MB之间'),
    body('limits.maxConcurrentExecutions').optional().isInt({ min: 1, max: 100 }).withMessage('最大并发执行数必须在1-100之间')
  ],
  handleValidationErrors,
  settingsController.updateSystemSettings
)

// ==================== 模型配置路由 ====================

/**
 * @route GET /api/settings/models
 * @desc 获取模型配置
 * @access Private (需要登录)
 */
router.get('/models',
  authenticate,
  settingsController.getModelConfigs
)

/**
 * @route PUT /api/settings/models
 * @desc 更新模型配置
 * @access Private (仅管理员)
 */
router.put('/models',
  authenticate,
  authorize('admin'),
  [
    body('defaultProvider').notEmpty().withMessage('默认提供商不能为空'),
    body('providers').isObject().withMessage('提供商配置必须是对象')
  ],
  handleValidationErrors,
  settingsController.updateModelConfigs
)

/**
 * @route POST /api/settings/models/test
 * @desc 测试模型连接
 * @access Private (仅管理员)
 */
router.post('/models/test',
  authenticate,
  authorize('admin'),
  [
    body('provider').notEmpty().withMessage('提供商不能为空'),
    body('config').isObject().withMessage('配置必须是对象')
  ],
  handleValidationErrors,
  settingsController.testModelConnection
)

/**
 * @route GET /api/settings/models/providers
 * @desc 获取可用的模型提供商
 * @access Private (需要登录)
 */
router.get('/models/providers',
  authenticate,
  settingsController.getAvailableProviders
)

// ==================== 配置管理路由 ====================

/**
 * @route POST /api/settings/reset
 * @desc 重置配置到默认值
 * @access Private (仅管理员)
 */
router.post('/reset',
  authenticate,
  authorize('admin'),
  [
    body('type').isIn(['system', 'models', 'all']).withMessage('重置类型必须是 system、models 或 all')
  ],
  handleValidationErrors,
  settingsController.resetToDefaults
)

module.exports = router