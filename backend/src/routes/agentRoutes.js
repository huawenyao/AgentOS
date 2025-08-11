const express = require('express')
const agentController = require('../controllers/agentController')
const { authenticate, authorize } = require('../middleware/auth')
const {
  agentValidation,
  commonValidation,
  handleValidationErrors
} = require('../middleware/validation')
const rateLimit = require('express-rate-limit')

const router = express.Router()

// 批量操作限流
const batchLimiter = rateLimit({
  windowMs: 60 * 1000, // 1分钟
  max: 5, // 最多5次批量操作
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: '批量操作过于频繁，请稍后再试'
    }
  }
})

/**
 * @swagger
 * /api/agents:
 *   get:
 *     summary: 获取Agent实例列表
 *     tags: [Agents]
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
 *           default: 10
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: 搜索Agent名称或描述
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [running, stopped, paused, error, starting, stopping]
 *         description: 按状态筛选
 *       - in: query
 *         name: templateId
 *         schema:
 *           type: string
 *         description: 按模板ID筛选
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: 按用户ID筛选（仅管理员）
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, updatedAt, name, lastStartedAt]
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
  ...commonValidation.pagination,
  ...commonValidation.search,
  agentController.getAgents
)

/**
 * @swagger
 * /api/agents/{id}:
 *   get:
 *     summary: 获取指定Agent实例详情
 *     tags: [Agents]
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
 *       404:
 *         description: Agent实例不存在
 *       403:
 *         description: 无权访问
 */
router.get('/:id',
  authenticate,
  ...commonValidation.uuidParam('id'),
  agentController.getAgent
)

/**
 * @swagger
 * /api/agents:
 *   post:
 *     summary: 创建Agent实例
 *     tags: [Agents]
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
 *               - templateId
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *               description:
 *                 type: string
 *                 maxLength: 500
 *               templateId:
 *                 type: string
 *                 format: uuid
 *               config:
 *                 type: object
 *     responses:
 *       201:
 *         description: 创建成功
 *       400:
 *         description: 请求参数错误
 *       401:
 *         description: 未认证
 */
router.post('/',
  authenticate,
  agentValidation.createAgent,
  handleValidationErrors,
  agentController.createAgent
)

/**
 * @swagger
 * /api/agents/{id}:
 *   put:
 *     summary: 更新Agent实例
 *     tags: [Agents]
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
 *               config:
 *                 type: object
 *     responses:
 *       200:
 *         description: 更新成功
 *       404:
 *         description: Agent实例不存在
 *       403:
 *         description: 无权修改
 */
router.put('/:id',
  authenticate,
  ...commonValidation.uuidParam('id'),
  agentValidation.updateAgent,
  handleValidationErrors,
  agentController.updateAgent
)

/**
 * @swagger
 * /api/agents/{id}:
 *   delete:
 *     summary: 删除Agent实例
 *     tags: [Agents]
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
 *       404:
 *         description: Agent实例不存在
 *       403:
 *         description: 无权删除
 */
router.delete('/:id',
  authenticate,
  ...commonValidation.uuidParam('id'),
  agentController.deleteAgent
)

/**
 * @swagger
 * /api/agents/{id}/start:
 *   post:
 *     summary: 启动Agent实例
 *     tags: [Agents]
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
 *         description: 启动成功
 *       404:
 *         description: Agent实例不存在
 *       403:
 *         description: 无权操作
 *       400:
 *         description: Agent状态不允许启动
 */
router.post('/:id/start',
  authenticate,
  ...commonValidation.uuidParam('id'),
  agentController.startAgent
)

/**
 * @swagger
 * /api/agents/{id}/stop:
 *   post:
 *     summary: 停止Agent实例
 *     tags: [Agents]
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
 *         description: 停止成功
 *       404:
 *         description: Agent实例不存在
 *       403:
 *         description: 无权操作
 *       400:
 *         description: Agent状态不允许停止
 */
router.post('/:id/stop',
  authenticate,
  ...commonValidation.uuidParam('id'),
  agentController.stopAgent
)

/**
 * @swagger
 * /api/agents/{id}/restart:
 *   post:
 *     summary: 重启Agent实例
 *     tags: [Agents]
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
 *         description: 重启成功
 *       404:
 *         description: Agent实例不存在
 *       403:
 *         description: 无权操作
 */
router.post('/:id/restart',
  authenticate,
  ...commonValidation.uuidParam('id'),
  agentController.restartAgent
)

/**
 * @swagger
 * /api/agents/{id}/pause:
 *   post:
 *     summary: 暂停Agent实例
 *     tags: [Agents]
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
 *         description: 暂停成功
 *       404:
 *         description: Agent实例不存在
 *       403:
 *         description: 无权操作
 *       400:
 *         description: 只能暂停运行中的Agent
 */
router.post('/:id/pause',
  authenticate,
  ...commonValidation.uuidParam('id'),
  agentController.pauseAgent
)

/**
 * @swagger
 * /api/agents/{id}/clone:
 *   post:
 *     summary: 克隆Agent实例
 *     tags: [Agents]
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
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *     responses:
 *       201:
 *         description: 克隆成功
 *       404:
 *         description: Agent实例不存在
 *       403:
 *         description: 无权克隆
 */
router.post('/:id/clone',
  authenticate,
  ...commonValidation.uuidParam('id'),
  agentValidation.cloneAgent,
  handleValidationErrors,
  agentController.cloneAgent
)

/**
 * @swagger
 * /api/agents/{id}/metrics:
 *   get:
 *     summary: 获取Agent实例指标
 *     tags: [Agents]
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
 *         name: timeRange
 *         schema:
 *           type: string
 *           enum: [1h, 6h, 24h, 7d, 30d]
 *           default: 1h
 *     responses:
 *       200:
 *         description: 获取成功
 *       404:
 *         description: Agent实例不存在
 *       403:
 *         description: 无权查看
 */
router.get('/:id/metrics',
  authenticate,
  ...commonValidation.uuidParam('id'),
  agentController.getAgentMetrics
)

/**
 * @swagger
 * /api/agents/{id}/logs:
 *   get:
 *     summary: 获取Agent实例日志
 *     tags: [Agents]
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
 *         name: level
 *         schema:
 *           type: string
 *           enum: [all, debug, info, warn, error]
 *           default: all
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 1000
 *           default: 100
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *     responses:
 *       200:
 *         description: 获取成功
 *       404:
 *         description: Agent实例不存在
 *       403:
 *         description: 无权查看
 */
router.get('/:id/logs',
  authenticate,
  ...commonValidation.uuidParam('id'),
  agentController.getAgentLogs
)

/**
 * @swagger
 * /api/agents/batch:
 *   post:
 *     summary: 批量操作Agent实例
 *     tags: [Agents]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - agentIds
 *               - action
 *             properties:
 *               agentIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *                 minItems: 1
 *                 maxItems: 50
 *               action:
 *                 type: string
 *                 enum: [start, stop, delete]
 *     responses:
 *       200:
 *         description: 批量操作完成
 *       400:
 *         description: 请求参数错误
 *       401:
 *         description: 未认证
 *       403:
 *         description: 无权操作部分Agent
 */
router.post('/batch',
  authenticate,
  batchLimiter,
  agentValidation.batchOperation,
  handleValidationErrors,
  agentController.batchOperateAgents
)

module.exports = router