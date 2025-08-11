/**
 * 系统管理路由
 * 提供系统配置、用户管理、系统维护、系统信息的路由配置
 * 基于EFIAgent产品设计文档实现
 */

const express = require('express');
const router = express.Router();
const systemManagementController = require('../controllers/systemManagementController');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth'); // 管理员权限中间件
const { body, param, query } = require('express-validator');
const rateLimit = require('express-rate-limit');

// 速率限制配置
const systemRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 限制每个IP 15分钟内最多100个请求
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: '请求过于频繁，请稍后再试'
    }
  }
});

const configRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5分钟
  max: 50, // 限制每个IP 5分钟内最多50个配置请求
  message: {
    success: false,
    error: {
      code: 'CONFIG_RATE_LIMIT_EXCEEDED',
      message: '配置请求过于频繁，请稍后再试'
    }
  }
});

const maintenanceRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1小时
  max: 10, // 限制每个IP 1小时内最多10个维护请求
  message: {
    success: false,
    error: {
      code: 'MAINTENANCE_RATE_LIMIT_EXCEEDED',
      message: '维护请求过于频繁，请稍后再试'
    }
  }
});

// 系统配置管理路由
router.get('/config',
  auth,
  adminAuth,
  configRateLimit,
  [
    query('category').optional().isString().withMessage('分类必须是字符串'),
    query('key').optional().isString().withMessage('键名必须是字符串')
  ],
  systemManagementController.getSystemConfig
);

router.put('/config',
  auth,
  adminAuth,
  configRateLimit,
  [
    body('category').notEmpty().withMessage('分类不能为空'),
    body('key').notEmpty().withMessage('键名不能为空'),
    body('value').exists().withMessage('值不能为空')
  ],
  systemManagementController.updateSystemConfig
);

router.put('/config/batch',
  auth,
  adminAuth,
  configRateLimit,
  [
    body('configs').isArray().withMessage('配置必须是数组'),
    body('configs.*.category').notEmpty().withMessage('分类不能为空'),
    body('configs.*.key').notEmpty().withMessage('键名不能为空'),
    body('configs.*.value').exists().withMessage('值不能为空')
  ],
  systemManagementController.batchUpdateSystemConfig
);

router.delete('/config/:category/:key',
  auth,
  adminAuth,
  configRateLimit,
  [
    param('category').notEmpty().withMessage('分类不能为空'),
    param('key').notEmpty().withMessage('键名不能为空')
  ],
  systemManagementController.deleteSystemConfig
);

router.get('/config/categories',
  auth,
  adminAuth,
  configRateLimit,
  systemManagementController.getConfigCategories
);

// 用户管理路由
router.get('/users',
  auth,
  adminAuth,
  systemRateLimit,
  [
    query('page').optional().isInt({ min: 1 }).withMessage('页码必须是正整数'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('每页数量必须在1-100之间'),
    query('status').optional().isIn(['active', 'inactive', 'suspended']).withMessage('状态值无效'),
    query('role').optional().isString().withMessage('角色必须是字符串'),
    query('keyword').optional().isString().withMessage('关键词必须是字符串')
  ],
  systemManagementController.getUsers
);

router.post('/users',
  auth,
  adminAuth,
  systemRateLimit,
  [
    body('username').notEmpty().withMessage('用户名不能为空'),
    body('email').isEmail().withMessage('邮箱格式无效'),
    body('password').isLength({ min: 8 }).withMessage('密码长度至少8位'),
    body('role').notEmpty().withMessage('角色不能为空'),
    body('profile').optional().isObject().withMessage('用户资料必须是对象')
  ],
  systemManagementController.createUser
);

router.put('/users/:id',
  auth,
  adminAuth,
  systemRateLimit,
  [
    param('id').isUUID().withMessage('用户ID格式无效'),
    body('username').optional().notEmpty().withMessage('用户名不能为空'),
    body('email').optional().isEmail().withMessage('邮箱格式无效'),
    body('role').optional().notEmpty().withMessage('角色不能为空'),
    body('profile').optional().isObject().withMessage('用户资料必须是对象')
  ],
  systemManagementController.updateUser
);

router.delete('/users/:id',
  auth,
  adminAuth,
  systemRateLimit,
  [
    param('id').isUUID().withMessage('用户ID格式无效')
  ],
  systemManagementController.deleteUser
);

router.post('/users/:id/reset-password',
  auth,
  adminAuth,
  systemRateLimit,
  [
    param('id').isUUID().withMessage('用户ID格式无效'),
    body('newPassword').isLength({ min: 8 }).withMessage('新密码长度至少8位')
  ],
  systemManagementController.resetUserPassword
);

router.put('/users/:id/status',
  auth,
  adminAuth,
  systemRateLimit,
  [
    param('id').isUUID().withMessage('用户ID格式无效'),
    body('status').isIn(['active', 'inactive', 'suspended']).withMessage('状态值无效')
  ],
  systemManagementController.updateUserStatus
);

// 系统维护路由
router.get('/health',
  systemRateLimit,
  systemManagementController.healthCheck
);

router.post('/maintenance/cleanup-logs',
  auth,
  adminAuth,
  maintenanceRateLimit,
  [
    body('retentionDays').optional().isInt({ min: 1, max: 365 }).withMessage('保留天数必须在1-365之间'),
    body('logLevel').optional().isIn(['debug', 'info', 'warn', 'error']).withMessage('日志级别无效')
  ],
  systemManagementController.cleanupLogs
);

router.post('/maintenance/backup',
  auth,
  adminAuth,
  maintenanceRateLimit,
  [
    body('tables').optional().isArray().withMessage('表名必须是数组'),
    body('compressionLevel').optional().isInt({ min: 1, max: 9 }).withMessage('压缩级别必须在1-9之间')
  ],
  systemManagementController.backupData
);

router.post('/maintenance/restart-service',
  auth,
  adminAuth,
  rateLimit({
    windowMs: 60 * 60 * 1000, // 1小时
    max: 3, // 限制每个IP 1小时内最多3个重启请求
    message: {
      success: false,
      error: {
        code: 'RESTART_RATE_LIMIT_EXCEEDED',
        message: '服务重启请求过于频繁，请稍后再试'
      }
    }
  }),
  [
    body('serviceName').notEmpty().withMessage('服务名称不能为空'),
    body('graceful').optional().isBoolean().withMessage('优雅重启标志必须是布尔值')
  ],
  systemManagementController.restartService
);

// 系统信息路由
router.get('/info',
  auth,
  systemRateLimit,
  systemManagementController.getSystemInfo
);

router.get('/stats/database',
  auth,
  adminAuth,
  systemRateLimit,
  systemManagementController.getDatabaseStats
);

router.get('/stats/system',
  auth,
  adminAuth,
  systemRateLimit,
  [
    query('timeRange').optional().isIn(['1h', '6h', '24h', '7d', '30d']).withMessage('时间范围值无效')
  ],
  systemManagementController.getSystemStats
);

router.get('/stats/disk',
  auth,
  adminAuth,
  systemRateLimit,
  systemManagementController.getDiskUsage
);

// 系统日志路由
router.get('/logs',
  auth,
  adminAuth,
  systemRateLimit,
  [
    query('page').optional().isInt({ min: 1 }).withMessage('页码必须是正整数'),
    query('limit').optional().isInt({ min: 1, max: 1000 }).withMessage('每页数量必须在1-1000之间'),
    query('level').optional().isIn(['debug', 'info', 'warn', 'error']).withMessage('日志级别无效'),
    query('startTime').optional().isISO8601().withMessage('开始时间格式无效'),
    query('endTime').optional().isISO8601().withMessage('结束时间格式无效'),
    query('keyword').optional().isString().withMessage('关键词必须是字符串')
  ],
  systemManagementController.getSystemLogs
);

router.get('/logs/export',
  auth,
  adminAuth,
  rateLimit({
    windowMs: 60 * 60 * 1000, // 1小时
    max: 5, // 限制每个IP 1小时内最多5个导出请求
    message: {
      success: false,
      error: {
        code: 'EXPORT_RATE_LIMIT_EXCEEDED',
        message: '日志导出请求过于频繁，请稍后再试'
      }
    }
  }),
  [
    query('format').optional().isIn(['csv', 'json', 'txt']).withMessage('导出格式无效'),
    query('startTime').optional().isISO8601().withMessage('开始时间格式无效'),
    query('endTime').optional().isISO8601().withMessage('结束时间格式无效'),
    query('level').optional().isIn(['debug', 'info', 'warn', 'error']).withMessage('日志级别无效')
  ],
  systemManagementController.exportSystemLogs
);

module.exports = router;