const express = require('express')
const workflowController = require('../controllers/workflowController')
const { authenticate, authorize, checkOwnership } = require('../middleware/auth')
const {
  validateCreateWorkflow,
  validateUpdateWorkflow,
  validateExecuteWorkflow,
  validateUuidParam,
  validatePagination,
  validateSearch,
  handleValidationErrors
} = require('../middleware/validation')
const rateLimit = require('express-rate-limit')

const router = express.Router()

// 执行限流
const executeLimiter = rateLimit({
  windowMs: 60 * 1000, // 1分钟
  max: 10, // 最多10次执行
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: '工作流执行过于频繁，请1分钟后再试'
    }
  }
})

/**
 * @swagger
 * /api/workflows:
 *   get:
 *     summary: 获取工作流列表
 *     tags: [Workflows]
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
 *         name: search
 *         schema:
 *           type: string
 *         description: 搜索工作流名称或描述
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, active, inactive]
 *         description: 按状态筛选
 *       - in: query
 *         name: isPublished
 *         schema:
 *           type: boolean
 *         description: 筛选已发布的工作流
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, updatedAt, name, executionCount, lastExecutedAt]
 *           default: createdAt
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: 获取成功
 *       401:
 *         description: 未认证
 */
router.get('/',
  authenticate,
  validatePagination,
  ...validateSearch,
  handleValidationErrors,
  workflowController.getWorkflows
)

/**
 * @swagger
 * /api/workflows/stats:
 *   get:
 *     summary: 获取工作流统计信息
 *     tags: [Workflows]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 获取成功
 *       401:
 *         description: 未认证
 */
router.get('/stats',
  authenticate,
  workflowController.getWorkflowStats
)

/**
 * @swagger
 * /api/workflows/{id}:
 *   get:
 *     summary: 获取指定工作流
 *     tags: [Workflows]
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
 *         description: 工作流不存在
 */
router.get('/:id',
  authenticate,
  validateUuidParam('id'),
  handleValidationErrors,
  checkOwnership('Workflow'),
  workflowController.getWorkflowById
)

/**
 * @swagger
 * /api/workflows:
 *   post:
 *     summary: 创建工作流
 *     tags: [Workflows]
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
 *               - definition
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *               description:
 *                 type: string
 *                 maxLength: 500
 *               definition:
 *                 type: object
 *                 required:
 *                   - nodes
 *                   - edges
 *                 properties:
 *                   nodes:
 *                     type: array
 *                     items:
 *                       type: object
 *                       required:
 *                         - id
 *                         - type
 *                       properties:
 *                         id:
 *                           type: string
 *                         type:
 *                           type: string
 *                           enum: [start, end, agent, condition, loop]
 *                         agentConfigId:
 *                           type: string
 *                           format: uuid
 *                         config:
 *                           type: object
 *                   edges:
 *                     type: array
 *                     items:
 *                       type: object
 *                       required:
 *                         - id
 *                         - source
 *                         - target
 *                       properties:
 *                         id:
 *                           type: string
 *                         source:
 *                           type: string
 *                         target:
 *                           type: string
 *                         condition:
 *                           type: object
 *               status:
 *                 type: string
 *                 enum: [draft, active, inactive]
 *                 default: draft
 *               isPublished:
 *                 type: boolean
 *                 default: false
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: 创建成功
 *       400:
 *         description: 请求参数错误
 *       401:
 *         description: 未认证
 *       409:
 *         description: 工作流名称已存在
 */
router.post('/',
  authenticate,
  validateCreateWorkflow,
  handleValidationErrors,
  workflowController.createWorkflow
)

/**
 * @swagger
 * /api/workflows/{id}:
 *   put:
 *     summary: 更新工作流
 *     tags: [Workflows]
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
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *               description:
 *                 type: string
 *                 maxLength: 500
 *               definition:
 *                 type: object
 *               status:
 *                 type: string
 *                 enum: [draft, active, inactive]
 *               isPublished:
 *                 type: boolean
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: 更新成功
 *       400:
 *         description: 请求参数错误
 *       401:
 *         description: 未认证
 *       403:
 *         description: 权限不足
 *       404:
 *         description: 工作流不存在
 *       409:
 *         description: 工作流名称已存在
 */
router.put('/:id',
  authenticate,
  validateUuidParam('id'),
  validateUpdateWorkflow,
  handleValidationErrors,
  checkOwnership('Workflow'),
  workflowController.updateWorkflow
)

/**
 * @swagger
 * /api/workflows/{id}:
 *   delete:
 *     summary: 删除工作流
 *     tags: [Workflows]
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
 *         description: 删除成功
 *       401:
 *         description: 未认证
 *       403:
 *         description: 权限不足
 *       404:
 *         description: 工作流不存在
 *       409:
 *         description: 工作流正在执行中，无法删除
 */
router.delete('/:id',
  authenticate,
  validateUuidParam('id'),
  handleValidationErrors,
  checkOwnership('Workflow'),
  workflowController.deleteWorkflow
)

/**
 * @swagger
 * /api/workflows/{id}/execute:
 *   post:
 *     summary: 执行工作流
 *     tags: [Workflows]
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
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               input:
 *                 type: object
 *                 description: 工作流输入数据
 *               context:
 *                 type: object
 *                 description: 执行上下文
 *               options:
 *                 type: object
 *                 properties:
 *                   timeout:
 *                     type: integer
 *                     description: 超时时间（秒）
 *                   priority:
 *                     type: string
 *                     enum: [low, normal, high]
 *                     default: normal
 *     responses:
 *       201:
 *         description: 执行开始
 *       400:
 *         description: 请求参数错误
 *       401:
 *         description: 未认证
 *       403:
 *         description: 权限不足
 *       404:
 *         description: 工作流不存在
 *       409:
 *         description: 工作流状态不允许执行
 */
router.post('/:id/execute',
  authenticate,
  executeLimiter,
  validateUuidParam('id'),
  validateExecuteWorkflow,
  handleValidationErrors,
  checkOwnership('Workflow'),
  workflowController.executeWorkflow
)

/**
 * @swagger
 * /api/workflows/{id}/executions:
 *   get:
 *     summary: 获取工作流执行历史
 *     tags: [Workflows]
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
 *           enum: [pending, running, completed, failed, cancelled]
 *         description: 按执行状态筛选
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, startedAt, completedAt, duration]
 *           default: createdAt
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: 获取成功
 *       401:
 *         description: 未认证
 *       403:
 *         description: 权限不足
 *       404:
 *         description: 工作流不存在
 */
router.get('/:id/executions',
  authenticate,
  validateUuidParam('id'),
  validatePagination,
  handleValidationErrors,
  checkOwnership('Workflow'),
  workflowController.getWorkflowExecutions
)

/**
 * @swagger
 * /api/workflows/{id}/executions/{executionId}:
 *   get:
 *     summary: 获取工作流执行详情
 *     tags: [Workflows]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: executionId
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
 *         description: 执行记录不存在
 */
router.get('/:id/executions/:executionId',
  authenticate,
  validateUuidParam('id'),
  validateUuidParam('executionId'),
  handleValidationErrors,
  checkOwnership('Workflow'),
  workflowController.getExecutionDetail
)

/**
 * @swagger
 * /api/workflows/{id}/executions/{executionId}/stop:
 *   post:
 *     summary: 停止工作流执行
 *     tags: [Workflows]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: executionId
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
 *               reason:
 *                 type: string
 *                 description: 停止原因
 *     responses:
 *       200:
 *         description: 停止成功
 *       400:
 *         description: 执行状态不允许停止
 *       401:
 *         description: 未认证
 *       403:
 *         description: 权限不足
 *       404:
 *         description: 执行记录不存在
 */
router.post('/:id/executions/:executionId/stop',
  authenticate,
  validateUuidParam('id'),
  validateUuidParam('executionId'),
  handleValidationErrors,
  checkOwnership('Workflow'),
  workflowController.stopExecution
)

/**
 * @swagger
 * /api/workflows/{id}/clone:
 *   post:
 *     summary: 克隆工作流
 *     tags: [Workflows]
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
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *               description:
 *                 type: string
 *                 maxLength: 500
 *     responses:
 *       201:
 *         description: 克隆成功
 *       400:
 *         description: 请求参数错误
 *       401:
 *         description: 未认证
 *       403:
 *         description: 权限不足
 *       404:
 *         description: 工作流不存在
 *       409:
 *         description: 工作流名称已存在
 */
router.post('/:id/clone',
  authenticate,
  validateUuidParam('id'),
  handleValidationErrors,
  checkOwnership('Workflow'),
  workflowController.cloneWorkflow
)

module.exports = router