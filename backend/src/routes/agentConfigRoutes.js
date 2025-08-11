const express = require('express')
const agentConfigController = require('../controllers/agentConfigController')
const { authenticate, authorize, checkOwnership } = require('../middleware/auth')
const {
  agentConfigValidation,
  commonValidation,
  handleValidationErrors
} = require('../middleware/validation')
const rateLimit = require('express-rate-limit')

const router = express.Router()

// 测试限流
const testLimiter = rateLimit({
  windowMs: 60 * 1000, // 1分钟
  max: 10, // 最多10次测试
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: '测试请求过于频繁，请1分钟后再试'
    }
  }
})

// 批量操作限流
const batchLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5分钟
  max: 5, // 最多5次批量操作
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: '批量操作过于频繁，请5分钟后再试'
    }
  }
})

/**
 * @swagger
 * /api/agent-configs:
 *   get:
 *     summary: 获取Agent配置列表
 *     tags: [Agent Configs]
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
 *         description: 搜索配置名称或描述
 *       - in: query
 *         name: templateId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 按模板筛选
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: 筛选激活状态
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, updatedAt, name, lastUsedAt]
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
  agentConfigController.getAgentConfigs
)

/**
 * @swagger
 * /api/agent-configs/stats:
 *   get:
 *     summary: 获取Agent配置统计信息
 *     tags: [Agent Configs]
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
  agentConfigController.getConfigStats
)

/**
 * @swagger
 * /api/agent-configs/{id}:
 *   get:
 *     summary: 获取指定Agent配置
 *     tags: [Agent Configs]
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
 *         description: 配置不存在
 */
router.get('/:id',
  authenticate,
  ...commonValidation.uuidParam('id'),
  checkOwnership('AgentConfig'),
  agentConfigController.getAgentConfig
)

/**
 * @swagger
 * /api/agent-configs:
 *   post:
 *     summary: 创建Agent配置
 *     tags: [Agent Configs]
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
 *               configuration:
 *                 type: object
 *                 description: 自定义配置，会与模板配置合并
 *               isActive:
 *                 type: boolean
 *                 default: true
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
 *       404:
 *         description: 模板不存在
 *       409:
 *         description: 配置名称已存在
 */
router.post('/',
  authenticate,
  ...agentConfigValidation.create,
  agentConfigController.createAgentConfig
)

/**
 * @swagger
 * /api/agent-configs/{id}:
 *   put:
 *     summary: 更新Agent配置
 *     tags: [Agent Configs]
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
 *               configuration:
 *                 type: object
 *               isActive:
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
 *         description: 配置不存在
 *       409:
 *         description: 配置名称已存在
 */
router.put('/:id',
  authenticate,
  ...commonValidation.uuidParam('id'),
  ...agentConfigValidation.update,
  checkOwnership('AgentConfig'),
  agentConfigController.updateAgentConfig
)

/**
 * @swagger
 * /api/agent-configs/{id}:
 *   delete:
 *     summary: 删除Agent配置
 *     tags: [Agent Configs]
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
 *         description: 配置不存在
 */
router.delete('/:id',
  authenticate,
  ...commonValidation.uuidParam('id'),
  checkOwnership('AgentConfig'),
  agentConfigController.deleteAgentConfig
)

/**
 * @swagger
 * /api/agent-configs/{id}/clone:
 *   post:
 *     summary: 克隆Agent配置
 *     tags: [Agent Configs]
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
 *         description: 配置不存在
 *       409:
 *         description: 配置名称已存在
 */
router.post('/:id/clone',
  authenticate,
  ...commonValidation.uuidParam('id'),
  checkOwnership('AgentConfig'),
  agentConfigController.cloneAgentConfig
)

/**
 * @swagger
 * /api/agent-configs/{id}/test:
 *   post:
 *     summary: 测试Agent配置
 *     tags: [Agent Configs]
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
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *                 description: 测试消息
 *               context:
 *                 type: object
 *                 description: 测试上下文
 *     responses:
 *       200:
 *         description: 测试成功
 *       400:
 *         description: 请求参数错误
 *       401:
 *         description: 未认证
 *       403:
 *         description: 权限不足
 *       404:
 *         description: 配置不存在
 */
router.post('/:id/test',
  authenticate,
  testLimiter,
  ...commonValidation.uuidParam('id'),
  checkOwnership('AgentConfig'),
  agentConfigController.testAgentConfig
)

/**
 * @swagger
 * /api/agent-configs/{id}/export:
 *   get:
 *     summary: 导出Agent配置
 *     tags: [Agent Configs]
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
 *         description: 导出成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       401:
 *         description: 未认证
 *       403:
 *         description: 权限不足
 *       404:
 *         description: 配置不存在
 */
router.get('/:id/export',
  authenticate,
  ...commonValidation.uuidParam('id'),
  checkOwnership('AgentConfig'),
  agentConfigController.exportConfig
)

/**
 * @swagger
 * /api/agent-configs/batch:
 *   post:
 *     summary: 批量操作Agent配置
 *     tags: [Agent Configs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - action
 *               - configIds
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [activate, deactivate, updateConfig]
 *               configIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *                 maxItems: 50
 *               data:
 *                 type: object
 *                 description: 操作相关数据
 *     responses:
 *       200:
 *         description: 批量操作成功
 *       400:
 *         description: 请求参数错误
 *       401:
 *         description: 未认证
 *       403:
 *         description: 权限不足
 */
router.post('/batch',
  authenticate,
  batchLimiter,
  agentConfigController.batchUpdateConfigs
)

module.exports = router