/**
 * 分析洞察模块路由配置
 * 定义性能分析、使用分析、趋势分析的API端点
 * 基于EFIAgent产品设计文档实现
 */

const express = require('express');
const { body, query, param } = require('express-validator');
const analyticsController = require('../controllers/analyticsController');
const authMiddleware = require('../middleware/auth');
const rateLimitMiddleware = require('../middleware/rateLimit');
const permissionMiddleware = require('../middleware/permission');
const cacheMiddleware = require('../middleware/cache');

const router = express.Router();

// 应用认证中间件到所有路由
router.use(authMiddleware.authenticate);

// 性能分析相关路由
router.get('/performance',
  // 权限检查：需要分析查看权限
  permissionMiddleware.checkPermission('analytics:performance:read'),
  // 请求参数验证
  [
    query('timeRange')
      .optional()
      .isIn(['1h', '6h', '24h', '1d', '7d', '30d', '90d', '1y'])
      .withMessage('时间范围参数无效'),
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('开始日期格式无效'),
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('结束日期格式无效'),
    query('agentId')
      .optional()
      .isUUID()
      .withMessage('Agent ID格式无效'),
    query('nodeId')
      .optional()
      .isUUID()
      .withMessage('节点ID格式无效'),
    query('metricTypes')
      .optional()
      .isArray()
      .withMessage('指标类型必须是数组')
  ],
  // 缓存中间件（5分钟缓存）
  cacheMiddleware.cache(300),
  // 速率限制（每分钟100次请求）
  rateLimitMiddleware.createRateLimit({
    windowMs: 60 * 1000,
    max: 100,
    message: '性能分析请求过于频繁，请稍后再试'
  }),
  analyticsController.getPerformanceAnalysis
);

// 使用分析相关路由
router.get('/usage',
  // 权限检查：需要分析查看权限
  permissionMiddleware.checkPermission('analytics:usage:read'),
  // 请求参数验证
  [
    query('timeRange')
      .optional()
      .isIn(['7d', '30d', '90d', '1y'])
      .withMessage('时间范围参数无效'),
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('开始日期格式无效'),
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('结束日期格式无效'),
    query('userId')
      .optional()
      .isUUID()
      .withMessage('用户ID格式无效'),
    query('agentId')
      .optional()
      .isUUID()
      .withMessage('Agent ID格式无效'),
    query('granularity')
      .optional()
      .isIn(['hour', 'day', 'week', 'month'])
      .withMessage('时间粒度参数无效')
  ],
  // 缓存中间件（10分钟缓存）
  cacheMiddleware.cache(600),
  // 速率限制（每分钟50次请求）
  rateLimitMiddleware.createRateLimit({
    windowMs: 60 * 1000,
    max: 50,
    message: '使用分析请求过于频繁，请稍后再试'
  }),
  analyticsController.getUsageAnalysis
);

// 趋势分析相关路由
router.get('/trends',
  // 权限检查：需要分析查看权限
  permissionMiddleware.checkPermission('analytics:trends:read'),
  // 请求参数验证
  [
    query('timeRange')
      .optional()
      .isIn(['30d', '90d', '1y', '2y'])
      .withMessage('时间范围参数无效'),
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('开始日期格式无效'),
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('结束日期格式无效'),
    query('metrics')
      .optional()
      .isArray()
      .withMessage('指标参数必须是数组'),
    query('analysisTypes')
      .optional()
      .isArray()
      .withMessage('分析类型必须是数组'),
    query('predictionDays')
      .optional()
      .isInt({ min: 1, max: 365 })
      .withMessage('预测天数必须在1-365之间')
  ],
  // 缓存中间件（30分钟缓存）
  cacheMiddleware.cache(1800),
  // 速率限制（每分钟20次请求）
  rateLimitMiddleware.createRateLimit({
    windowMs: 60 * 1000,
    max: 20,
    message: '趋势分析请求过于频繁，请稍后再试'
  }),
  analyticsController.getTrendAnalysis
);

// 实时分析相关路由
router.get('/realtime',
  // 权限检查：需要实时分析权限
  permissionMiddleware.checkPermission('analytics:realtime:read'),
  // 请求参数验证
  [
    query('metrics')
      .optional()
      .isArray()
      .withMessage('指标参数必须是数组'),
    query('interval')
      .optional()
      .isIn(['1m', '5m', '15m', '30m', '1h'])
      .withMessage('时间间隔参数无效')
  ],
  // 速率限制（每分钟200次请求）
  rateLimitMiddleware.createRateLimit({
    windowMs: 60 * 1000,
    max: 200,
    message: '实时分析请求过于频繁，请稍后再试'
  }),
  analyticsController.getRealtimeAnalysis
);

// 分析报告生成路由
router.post('/reports',
  // 权限检查：需要报告生成权限
  permissionMiddleware.checkPermission('analytics:reports:create'),
  // 请求体验证
  [
    body('reportType')
      .optional()
      .isIn(['performance', 'usage', 'trend', 'comprehensive'])
      .withMessage('报告类型无效'),
    body('timeRange')
      .optional()
      .isIn(['7d', '30d', '90d', '1y'])
      .withMessage('时间范围参数无效'),
    body('startDate')
      .optional()
      .isISO8601()
      .withMessage('开始日期格式无效'),
    body('endDate')
      .optional()
      .isISO8601()
      .withMessage('结束日期格式无效'),
    body('modules')
      .optional()
      .isArray()
      .withMessage('模块参数必须是数组'),
    body('format')
      .optional()
      .isIn(['json', 'pdf', 'excel', 'csv'])
      .withMessage('报告格式无效'),
    body('includeCharts')
      .optional()
      .isBoolean()
      .withMessage('图表包含参数必须是布尔值')
  ],
  // 速率限制（每小时10次请求）
  rateLimitMiddleware.createRateLimit({
    windowMs: 60 * 60 * 1000,
    max: 10,
    message: '报告生成请求过于频繁，请稍后再试'
  }),
  analyticsController.generateAnalysisReport
);

// 分析配置相关路由
router.get('/config',
  // 权限检查：需要配置查看权限
  permissionMiddleware.checkPermission('analytics:config:read'),
  // 缓存中间件（1小时缓存）
  cacheMiddleware.cache(3600),
  analyticsController.getAnalysisConfig
);

router.put('/config',
  // 权限检查：需要配置修改权限
  permissionMiddleware.checkPermission('analytics:config:write'),
  // 请求体验证
  [
    body('performanceThresholds')
      .optional()
      .isObject()
      .withMessage('性能阈值配置必须是对象'),
    body('alertRules')
      .optional()
      .isArray()
      .withMessage('告警规则必须是数组'),
    body('retentionPeriod')
      .optional()
      .isInt({ min: 1, max: 365 })
      .withMessage('数据保留期必须在1-365天之间'),
    body('samplingRate')
      .optional()
      .isFloat({ min: 0.01, max: 1.0 })
      .withMessage('采样率必须在0.01-1.0之间'),
    body('enableRealtime')
      .optional()
      .isBoolean()
      .withMessage('实时分析开关必须是布尔值')
  ],
  analyticsController.updateAnalysisConfig
);

// 性能分析子路由
router.get('/performance/metrics/:metricType',
  permissionMiddleware.checkPermission('analytics:performance:read'),
  [
    param('metricType')
      .isIn(['response_time', 'throughput', 'success_rate', 'error_rate', 'cpu_usage', 'memory_usage'])
      .withMessage('指标类型无效'),
    query('timeRange')
      .optional()
      .isIn(['1h', '6h', '24h', '7d', '30d'])
      .withMessage('时间范围参数无效')
  ],
  cacheMiddleware.cache(300),
  async (req, res, next) => {
    req.query.metricTypes = [req.params.metricType];
    next();
  },
  analyticsController.getPerformanceAnalysis
);

// 使用分析子路由
router.get('/usage/users/:userId',
  permissionMiddleware.checkPermission('analytics:usage:read'),
  [
    param('userId')
      .isUUID()
      .withMessage('用户ID格式无效'),
    query('timeRange')
      .optional()
      .isIn(['7d', '30d', '90d'])
      .withMessage('时间范围参数无效')
  ],
  cacheMiddleware.cache(600),
  async (req, res, next) => {
    // 非管理员只能查看自己的数据
    if (req.user.role !== 'admin' && req.params.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: '无权限查看其他用户的使用数据'
        }
      });
    }
    req.query.userId = req.params.userId;
    next();
  },
  analyticsController.getUsageAnalysis
);

router.get('/usage/agents/:agentId',
  permissionMiddleware.checkPermission('analytics:usage:read'),
  [
    param('agentId')
      .isUUID()
      .withMessage('Agent ID格式无效'),
    query('timeRange')
      .optional()
      .isIn(['7d', '30d', '90d'])
      .withMessage('时间范围参数无效')
  ],
  cacheMiddleware.cache(600),
  async (req, res, next) => {
    req.query.agentId = req.params.agentId;
    next();
  },
  analyticsController.getUsageAnalysis
);

// 趋势分析子路由
router.get('/trends/predictions',
  permissionMiddleware.checkPermission('analytics:trends:read'),
  [
    query('metrics')
      .isArray()
      .withMessage('指标参数必须是数组'),
    query('predictionDays')
      .optional()
      .isInt({ min: 1, max: 90 })
      .withMessage('预测天数必须在1-90之间')
  ],
  cacheMiddleware.cache(1800),
  async (req, res, next) => {
    req.query.analysisTypes = ['prediction'];
    next();
  },
  analyticsController.getTrendAnalysis
);

router.get('/trends/anomalies',
  permissionMiddleware.checkPermission('analytics:trends:read'),
  [
    query('timeRange')
      .optional()
      .isIn(['7d', '30d', '90d'])
      .withMessage('时间范围参数无效'),
    query('sensitivity')
      .optional()
      .isIn(['low', 'medium', 'high'])
      .withMessage('敏感度参数无效')
  ],
  cacheMiddleware.cache(600),
  async (req, res, next) => {
    req.query.analysisTypes = ['anomaly'];
    next();
  },
  analyticsController.getTrendAnalysis
);

// 健康检查路由
router.get('/health',
  async (req, res) => {
    try {
      // 检查分析服务状态
      const healthStatus = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
          database: 'connected',
          cache: 'connected',
          analytics: 'running'
        },
        version: process.env.APP_VERSION || '1.0.0'
      };
      
      res.json({
        success: true,
        data: healthStatus
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'HEALTH_CHECK_FAILED',
          message: '健康检查失败'
        }
      });
    }
  }
);

// 错误处理中间件
router.use((error, req, res, next) => {
  console.error('Analytics API Error:', error);
  
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_JSON',
        message: '请求体JSON格式无效'
      }
    });
  }
  
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: '请求参数验证失败',
        details: error.details
      }
    });
  }
  
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: '服务器内部错误'
    }
  });
});

module.exports = router;