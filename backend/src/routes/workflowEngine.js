/**
 * 工作流引擎路由
 * 提供工作流引擎管理、执行监控、能力模块管理的路由配置
 * 基于EFIAgent产品设计文档实现
 */

const express = require('express');
const router = express.Router();
const workflowEngineController = require('../controllers/workflowEngineController');
const auth = require('../middleware/auth');
const { body, param, query } = require('express-validator');
const rateLimit = require('express-rate-limit');

// 速率限制配置
const workflowRateLimit = rateLimit({
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

const executionRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5分钟
  max: 20, // 限制每个IP 5分钟内最多20个执行请求
  message: {
    success: false,
    error: {
      code: 'EXECUTION_RATE_LIMIT_EXCEEDED',
      message: '工作流执行请求过于频繁，请稍后再试'
    }
  }
});

// 工作流定义管理路由
router.get('/definitions',
  auth,
  workflowRateLimit,
  [
    query('page').optional().isInt({ min: 1 }).withMessage('页码必须是正整数'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('每页数量必须在1-100之间'),
    query('status').optional().isIn(['active', 'inactive', 'draft']).withMessage('状态值无效'),
    query('category').optional().isString().withMessage('分类必须是字符串')
  ],
  workflowEngineController.getWorkflowDefinitions
);

router.get('/definitions/:id',
  auth,
  workflowRateLimit,
  [
    param('id').isUUID().withMessage('工作流定义ID格式无效')
  ],
  workflowEngineController.getWorkflowDefinition
);

router.post('/definitions',
  auth,
  workflowRateLimit,
  [
    body('name').notEmpty().withMessage('工作流名称不能为空'),
    body('description').optional().isString().withMessage('描述必须是字符串'),
    body('definition').notEmpty().withMessage('工作流定义不能为空'),
    body('category').optional().isString().withMessage('分类必须是字符串'),
    body('version').optional().isString().withMessage('版本必须是字符串')
  ],
  workflowEngineController.createWorkflowDefinition
);

router.put('/definitions/:id',
  auth,
  workflowRateLimit,
  [
    param('id').isUUID().withMessage('工作流定义ID格式无效'),
    body('name').optional().notEmpty().withMessage('工作流名称不能为空'),
    body('description').optional().isString().withMessage('描述必须是字符串'),
    body('definition').optional().notEmpty().withMessage('工作流定义不能为空')
  ],
  workflowEngineController.updateWorkflowDefinition
);

router.delete('/definitions/:id',
  auth,
  workflowRateLimit,
  [
    param('id').isUUID().withMessage('工作流定义ID格式无效')
  ],
  workflowEngineController.deleteWorkflowDefinition
);

// 工作流执行管理路由
router.post('/definitions/:id/execute',
  auth,
  executionRateLimit,
  [
    param('id').isUUID().withMessage('工作流定义ID格式无效'),
    body('input').optional().isObject().withMessage('输入参数必须是对象'),
    body('priority').optional().isIn(['low', 'normal', 'high', 'urgent']).withMessage('优先级值无效')
  ],
  workflowEngineController.executeWorkflow
);

router.get('/executions',
  auth,
  workflowRateLimit,
  [
    query('page').optional().isInt({ min: 1 }).withMessage('页码必须是正整数'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('每页数量必须在1-100之间'),
    query('status').optional().isIn(['pending', 'running', 'completed', 'failed', 'cancelled']).withMessage('状态值无效'),
    query('workflowId').optional().isUUID().withMessage('工作流ID格式无效')
  ],
  workflowEngineController.getWorkflowExecutions
);

router.get('/executions/:id',
  auth,
  workflowRateLimit,
  [
    param('id').isUUID().withMessage('执行记录ID格式无效')
  ],
  workflowEngineController.getWorkflowExecution
);

router.post('/executions/:id/stop',
  auth,
  executionRateLimit,
  [
    param('id').isUUID().withMessage('执行记录ID格式无效')
  ],
  workflowEngineController.stopWorkflowExecution
);

router.post('/executions/:id/pause',
  auth,
  executionRateLimit,
  [
    param('id').isUUID().withMessage('执行记录ID格式无效')
  ],
  workflowEngineController.pauseWorkflowExecution
);

router.post('/executions/:id/resume',
  auth,
  executionRateLimit,
  [
    param('id').isUUID().withMessage('执行记录ID格式无效')
  ],
  workflowEngineController.resumeWorkflowExecution
);

// 能力模块管理路由
router.get('/capabilities',
  auth,
  workflowRateLimit,
  [
    query('page').optional().isInt({ min: 1 }).withMessage('页码必须是正整数'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('每页数量必须在1-100之间'),
    query('category').optional().isString().withMessage('分类必须是字符串'),
    query('status').optional().isIn(['active', 'inactive']).withMessage('状态值无效')
  ],
  workflowEngineController.getCapabilityModules
);

router.post('/capabilities',
  auth,
  workflowRateLimit,
  [
    body('name').notEmpty().withMessage('能力模块名称不能为空'),
    body('description').optional().isString().withMessage('描述必须是字符串'),
    body('category').notEmpty().withMessage('分类不能为空'),
    body('version').optional().isString().withMessage('版本必须是字符串'),
    body('config').optional().isObject().withMessage('配置必须是对象')
  ],
  workflowEngineController.registerCapabilityModule
);

router.delete('/capabilities/:id',
  auth,
  workflowRateLimit,
  [
    param('id').isUUID().withMessage('能力模块ID格式无效')
  ],
  workflowEngineController.unregisterCapabilityModule
);

// Agent管理路由
router.get('/agents',
  auth,
  workflowRateLimit,
  [
    query('page').optional().isInt({ min: 1 }).withMessage('页码必须是正整数'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('每页数量必须在1-100之间'),
    query('status').optional().isIn(['active', 'inactive']).withMessage('状态值无效'),
    query('type').optional().isString().withMessage('类型必须是字符串')
  ],
  workflowEngineController.getAgents
);

router.post('/agents',
  auth,
  workflowRateLimit,
  [
    body('name').notEmpty().withMessage('Agent名称不能为空'),
    body('description').optional().isString().withMessage('描述必须是字符串'),
    body('type').notEmpty().withMessage('Agent类型不能为空'),
    body('config').optional().isObject().withMessage('配置必须是对象')
  ],
  workflowEngineController.registerAgent
);

router.delete('/agents/:id',
  auth,
  workflowRateLimit,
  [
    param('id').isUUID().withMessage('Agent ID格式无效')
  ],
  workflowEngineController.unregisterAgent
);

// 工作流引擎监控路由
router.get('/status',
  auth,
  workflowRateLimit,
  workflowEngineController.getEngineStatus
);

router.get('/running-workflows',
  auth,
  workflowRateLimit,
  workflowEngineController.getRunningWorkflows
);

router.get('/execution-queue',
  auth,
  workflowRateLimit,
  workflowEngineController.getExecutionQueue
);

router.get('/execution-stats',
  auth,
  workflowRateLimit,
  [
    query('timeRange').optional().isIn(['1h', '6h', '24h', '7d', '30d']).withMessage('时间范围值无效')
  ],
  workflowEngineController.getExecutionStats
);

module.exports = router;