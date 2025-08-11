const express = require('express')
const agentTemplateController = require('../controllers/agentTemplateController')
const { authenticate, authorize, optionalAuthenticate } = require('../middleware/auth')
const {
  agentTemplateValidation,
  commonValidation,
  handleValidationErrors
} = require('../middleware/validation')
const rateLimit = require('express-rate-limit')

const router = express.Router()

// 导入限流
const importLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1小时
  max: 10, // 最多10次导入
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: '导入操作过于频繁，请1小时后再试'
    }
  }
})

/**
 * @swagger
 * /api/agent-templates:
 *   get:
 *     summary: 获取Agent模板列表
 *     tags: [Agent Templates]
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
 *         description: 搜索模板名称或描述
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: 按分类筛选
 *       - in: query
 *         name: isPublic
 *         schema:
 *           type: boolean
 *         description: 筛选公开模板
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, updatedAt, name, usageCount]
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
 *       400:
 *         description: 请求参数错误
 */
router.get('/',
  optionalAuthenticate,
  ...commonValidation.pagination,
  ...commonValidation.search,
  agentTemplateController.getAgentTemplates
)

/**
 * @swagger
 * /api/agent-templates/stats:
 *   get:
 *     summary: 获取Agent模板统计信息
 *     tags: [Agent Templates]
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
  agentTemplateController.getTemplateStats
)

/**
 * @swagger
 * /api/agent-templates/search:
 *   get:
 *     summary: 搜索Agent模板
 *     tags: [Agent Templates]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 2
 *         description: 搜索关键词
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: 分类筛选
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *     responses:
 *       200:
 *         description: 搜索成功
 *       400:
 *         description: 请求参数错误
 */
router.get('/search',
  optionalAuthenticate,
  ...commonValidation.search,
  agentTemplateController.searchTemplates
)

/**
 * @swagger
 * /api/agent-templates/{id}:
 *   get:
 *     summary: 获取指定Agent模板
 *     tags: [Agent Templates]
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
 *         description: 模板不存在
 */
router.get('/:id',
  optionalAuthenticate,
  ...commonValidation.uuidParam('id'),
  agentTemplateController.getAgentTemplate
)

/**
 * @swagger
 * /api/agent-templates:
 *   post:
 *     summary: 创建Agent模板
 *     tags: [Agent Templates]
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
 *               - description
 *               - configuration
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *               description:
 *                 type: string
 *                 maxLength: 500
 *               category:
 *                 type: string
 *                 maxLength: 50
 *               configuration:
 *                 type: object
 *                 required:
 *                   - model
 *                 properties:
 *                   model:
 *                     type: string
 *                   systemPrompt:
 *                     type: string
 *                   temperature:
 *                     type: number
 *                     minimum: 0
 *                     maximum: 2
 *                   maxTokens:
 *                     type: integer
 *                     minimum: 1
 *                     maximum: 32000
 *                   functions:
 *                     type: array
 *                     items:
 *                       type: object
 *               isPublic:
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
 *         description: 模板名称已存在
 */
router.post('/',
  authenticate,
  ...agentTemplateValidation.create,
  agentTemplateController.createAgentTemplate
)

/**
 * @swagger
 * /api/agent-templates/{id}:
 *   put:
 *     summary: 更新Agent模板
 *     tags: [Agent Templates]
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
 *               category:
 *                 type: string
 *                 maxLength: 50
 *               configuration:
 *                 type: object
 *               isPublic:
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
 *         description: 模板不存在
 *       409:
 *         description: 模板名称已存在
 */
router.put('/:id',
  authenticate,
  ...commonValidation.uuidParam('id'),
  ...agentTemplateValidation.update,
  agentTemplateController.updateAgentTemplate
)

/**
 * @swagger
 * /api/agent-templates/{id}:
 *   delete:
 *     summary: 删除Agent模板
 *     tags: [Agent Templates]
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
 *         description: 模板不存在
 */
router.delete('/:id',
  authenticate,
  ...commonValidation.uuidParam('id'),
  agentTemplateController.deleteAgentTemplate
)

/**
 * @swagger
 * /api/agent-templates/{id}/clone:
 *   post:
 *     summary: 克隆Agent模板
 *     tags: [Agent Templates]
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
 *       404:
 *         description: 模板不存在
 *       409:
 *         description: 模板名称已存在
 */
router.post('/:id/clone',
  authenticate,
  ...commonValidation.uuidParam('id'),
  agentTemplateController.cloneAgentTemplate
)

/**
 * @swagger
 * /api/agent-templates/{id}/validate:
 *   post:
 *     summary: 验证Agent模板配置
 *     tags: [Agent Templates]
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
 *         description: 验证成功
 *       400:
 *         description: 配置无效
 *       401:
 *         description: 未认证
 *       404:
 *         description: 模板不存在
 */
router.post('/:id/validate',
  authenticate,
  ...commonValidation.uuidParam('id'),
  agentTemplateController.validateTemplateConfig
)

/**
 * @swagger
 * /api/agent-templates/{id}/export:
 *   get:
 *     summary: 导出Agent模板
 *     tags: [Agent Templates]
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
 *         description: 模板不存在
 */
router.get('/:id/export',
  authenticate,
  ...commonValidation.uuidParam('id'),
  agentTemplateController.exportTemplate
)

/**
 * @swagger
 * /api/agent-templates/import:
 *   post:
 *     summary: 导入Agent模板
 *     tags: [Agent Templates]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - template
 *             properties:
 *               template:
 *                 type: object
 *                 description: 导出的模板数据
 *               overwrite:
 *                 type: boolean
 *                 default: false
 *                 description: 是否覆盖同名模板
 *     responses:
 *       201:
 *         description: 导入成功
 *       400:
 *         description: 请求参数错误
 *       401:
 *         description: 未认证
 *       409:
 *         description: 模板名称已存在
 */
router.post('/import',
  authenticate,
  importLimiter,
  agentTemplateController.importTemplate
)

module.exports = router