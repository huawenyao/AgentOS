/**
 * 实时数据流路由
 * 提供实时数据流管理、查询、分析的路由配置
 * 基于EFIAgent产品设计文档实现
 */

const express = require('express');
const router = express.Router();
const realTimeDataController = require('../controllers/realTimeDataController');
const auth = require('../middleware/auth');
const { body, param, query } = require('express-validator');
const rateLimit = require('express-rate-limit');

// 速率限制配置
const dataStreamRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 200, // 限制每个IP 15分钟内最多200个请求
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: '请求过于频繁，请稍后再试'
    }
  }
});

const dataCollectionRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1分钟
  max: 1000, // 限制每个IP 1分钟内最多1000个数据收集请求
  message: {
    success: false,
    error: {
      code: 'DATA_COLLECTION_RATE_LIMIT_EXCEEDED',
      message: '数据收集请求过于频繁，请稍后再试'
    }
  }
});

const analysisRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5分钟
  max: 50, // 限制每个IP 5分钟内最多50个分析请求
  message: {
    success: false,
    error: {
      code: 'ANALYSIS_RATE_LIMIT_EXCEEDED',
      message: '数据分析请求过于频繁，请稍后再试'
    }
  }
});

// 数据流管理路由
router.get('/streams',
  auth,
  dataStreamRateLimit,
  [
    query('page').optional().isInt({ min: 1 }).withMessage('页码必须是正整数'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('每页数量必须在1-100之间'),
    query('type').optional().isString().withMessage('类型必须是字符串'),
    query('status').optional().isIn(['active', 'inactive', 'error']).withMessage('状态值无效')
  ],
  realTimeDataController.getDataStreams
);

router.get('/streams/:id',
  auth,
  dataStreamRateLimit,
  [
    param('id').isUUID().withMessage('数据流ID格式无效')
  ],
  realTimeDataController.getDataStream
);

router.post('/streams',
  auth,
  dataStreamRateLimit,
  [
    body('name').notEmpty().withMessage('数据流名称不能为空'),
    body('description').optional().isString().withMessage('描述必须是字符串'),
    body('type').notEmpty().withMessage('数据流类型不能为空'),
    body('config').notEmpty().isObject().withMessage('配置不能为空且必须是对象'),
    body('source').notEmpty().withMessage('数据源不能为空')
  ],
  realTimeDataController.registerDataStream
);

router.delete('/streams/:id',
  auth,
  dataStreamRateLimit,
  [
    param('id').isUUID().withMessage('数据流ID格式无效')
  ],
  realTimeDataController.unregisterDataStream
);

router.put('/streams/:id/config',
  auth,
  dataStreamRateLimit,
  [
    param('id').isUUID().withMessage('数据流ID格式无效'),
    body('config').notEmpty().isObject().withMessage('配置不能为空且必须是对象')
  ],
  realTimeDataController.updateDataStreamConfig
);

// 实时数据查询路由
router.get('/data/realtime',
  auth,
  dataStreamRateLimit,
  [
    query('streamId').notEmpty().withMessage('数据流ID不能为空'),
    query('limit').optional().isInt({ min: 1, max: 1000 }).withMessage('限制数量必须在1-1000之间'),
    query('startTime').optional().isISO8601().withMessage('开始时间格式无效'),
    query('endTime').optional().isISO8601().withMessage('结束时间格式无效')
  ],
  realTimeDataController.getRealTimeData
);

router.get('/data/stream',
  auth,
  dataStreamRateLimit,
  [
    query('streamId').notEmpty().withMessage('数据流ID不能为空'),
    query('timeRange').optional().isIn(['5m', '15m', '1h', '6h', '24h', '7d']).withMessage('时间范围值无效'),
    query('aggregation').optional().isIn(['avg', 'sum', 'min', 'max', 'count']).withMessage('聚合方式无效')
  ],
  realTimeDataController.getStreamData
);

router.get('/data/metrics',
  auth,
  dataStreamRateLimit,
  [
    query('metric').notEmpty().withMessage('指标名称不能为空'),
    query('timeRange').optional().isIn(['5m', '15m', '1h', '6h', '24h', '7d']).withMessage('时间范围值无效'),
    query('filters').optional().isString().withMessage('过滤条件必须是字符串'),
    query('aggregation').optional().isIn(['avg', 'sum', 'min', 'max', 'count']).withMessage('聚合方式无效')
  ],
  realTimeDataController.queryMetrics
);

// 数据收集路由
router.post('/data/collect',
  auth,
  dataCollectionRateLimit,
  [
    body('streamId').notEmpty().withMessage('数据流ID不能为空'),
    body('data').notEmpty().withMessage('数据不能为空'),
    body('timestamp').optional().isISO8601().withMessage('时间戳格式无效')
  ],
  realTimeDataController.collectData
);

// 数据分析路由
router.post('/data/analyze',
  auth,
  analysisRateLimit,
  [
    body('streamId').notEmpty().withMessage('数据流ID不能为空'),
    body('analysisType').optional().isIn(['basic', 'statistical', 'trend', 'anomaly']).withMessage('分析类型无效'),
    body('timeRange').optional().isIn(['5m', '15m', '1h', '6h', '24h', '7d']).withMessage('时间范围值无效'),
    body('options').optional().isObject().withMessage('选项必须是对象')
  ],
  realTimeDataController.analyzeData
);

router.get('/data/trend',
  auth,
  analysisRateLimit,
  [
    query('streamId').notEmpty().withMessage('数据流ID不能为空'),
    query('metric').notEmpty().withMessage('指标名称不能为空'),
    query('timeRange').optional().isIn(['1h', '6h', '24h', '7d', '30d']).withMessage('时间范围值无效'),
    query('interval').optional().isIn(['1m', '5m', '15m', '1h', '6h', '24h']).withMessage('时间间隔值无效')
  ],
  realTimeDataController.calculateTrend
);

router.get('/data/anomalies',
  auth,
  analysisRateLimit,
  [
    query('streamId').notEmpty().withMessage('数据流ID不能为空'),
    query('metric').notEmpty().withMessage('指标名称不能为空'),
    query('sensitivity').optional().isIn(['low', 'medium', 'high']).withMessage('敏感度值无效'),
    query('timeRange').optional().isIn(['15m', '1h', '6h', '24h']).withMessage('时间范围值无效')
  ],
  realTimeDataController.detectAnomalies
);

// 订阅管理路由
router.post('/subscriptions',
  auth,
  dataStreamRateLimit,
  [
    body('streamId').notEmpty().withMessage('数据流ID不能为空'),
    body('filters').optional().isObject().withMessage('过滤条件必须是对象'),
    body('callback').optional().isString().withMessage('回调地址必须是字符串')
  ],
  realTimeDataController.subscribeToStream
);

router.delete('/subscriptions/:id',
  auth,
  dataStreamRateLimit,
  [
    param('id').isUUID().withMessage('订阅ID格式无效')
  ],
  realTimeDataController.unsubscribeFromStream
);

router.get('/subscriptions',
  auth,
  dataStreamRateLimit,
  [
    query('page').optional().isInt({ min: 1 }).withMessage('页码必须是正整数'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('每页数量必须在1-100之间'),
    query('streamId').optional().isUUID().withMessage('数据流ID格式无效')
  ],
  realTimeDataController.getSubscriptions
);

// 服务状态和维护路由
router.get('/status',
  auth,
  dataStreamRateLimit,
  realTimeDataController.getServiceStatus
);

router.post('/cleanup',
  auth,
  rateLimit({
    windowMs: 60 * 60 * 1000, // 1小时
    max: 5, // 限制每个IP 1小时内最多5个清理请求
    message: {
      success: false,
      error: {
        code: 'CLEANUP_RATE_LIMIT_EXCEEDED',
        message: '数据清理请求过于频繁，请稍后再试'
      }
    }
  }),
  [
    body('streamId').optional().isUUID().withMessage('数据流ID格式无效'),
    body('retentionDays').optional().isInt({ min: 1, max: 365 }).withMessage('保留天数必须在1-365之间')
  ],
  realTimeDataController.cleanupExpiredData
);

module.exports = router;