const express = require('express')
const capabilityController = require('../controllers/capabilityController')
const { authenticate, authorize, optionalAuthenticate } = require('../middleware/auth')
const {
  validateCreateCapability,
  validateUpdateCapability,
  validateUuidParam,
  validatePagination,
  validateSearch,
  handleValidationErrors
} = require('../middleware/validation')
const rateLimit = require('express-rate-limit')

const router = express.Router()

// 测试限流
const testLimiter = rateLimit({
  windowMs: 60 * 1000, // 1分钟
  max: 5, // 最多5次测试
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: '能力测试过于频繁，请1分钟后再试'
    }
  }
})

/**
 * @swagger
 * /api/capabilities:
 *   get:
 *     summary: 获取能力列表
 *     tags: [Capabilities]
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
 *         description: 搜索能力名称或描述
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: 按分类筛选
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [function, api, webhook, custom]
 *         description: 按类型筛选
 *       - in: query
 *         name: isPublic
 *         schema:
 *           type: boolean
 *         description: 筛选公开能力
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: 筛选激活状态
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
  validatePagination,
  ...validateSearch,
  handleValidationErrors,
  capabilityController.getCapabilities
)

/**
 * @swagger
 * /api/capabilities:
 *   post:
 *     summary: 创建新能力
 *     tags: [Capabilities]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CapabilityInput'
 *     responses:
 *       201:
 *         description: 创建成功
 *       400:
 *         description: 请求体格式错误
 *       401:
 *         description: 未认证
 */
router.post('/',
  authenticate,
  authorize(['admin', 'user']),
  validateCreateCapability,
  handleValidationErrors,
  capabilityController.createCapability
);

/**
 * @swagger
 * /api/capabilities/{id}:
 *   put:
 *     summary: 更新指定能力
 *     tags: [Capabilities]
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
 *             $ref: '#/components/schemas/CapabilityInput'
 *     responses:
 *       200:
 *         description: 更新成功
 *       400:
 *         description: 请求体格式错误
 *       401:
 *         description: 未认证
 *       403:
 *         description: 无权限
 *       404:
 *         description: 能力不存在
 */
router.put('/:id',
  authenticate,
  authorize(['admin', 'user']),
  validateUuidParam('id'),
  validateUpdateCapability,
  handleValidationErrors,
  capabilityController.updateCapability
);

/**
 * @swagger
 * /api/capabilities/{id}:
 *   delete:
 *     summary: 删除指定能力
 *     tags: [Capabilities]
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
 *       204:
 *         description: 删除成功
 *       401:
 *         description: 未认证
 *       403:
 *         description: 无权限
 *       404:
 *         description: 能力不存在
 */
router.delete('/:id',
  authenticate,
  authorize(['admin', 'user']),
  validateUuidParam('id'),
  handleValidationErrors,
  capabilityController.deleteCapability
);

/**
 * @swagger
 * /api/capabilities/stats:
 *   get:
 *     summary: 获取能力统计信息
 *     tags: [Capabilities]
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
  capabilityController.getCapabilityStatistics
)

/**
 * @swagger
 * /api/capabilities/search:
 *   get:
 *     summary: 搜索能力
 *     tags: [Capabilities]
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
 *         name: type
 *         schema:
 *           type: string
 *           enum: [function, api, webhook, custom]
 *         description: 类型筛选
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
  ...validateSearch,
  handleValidationErrors,
  capabilityController.searchCapabilities
)

/**
 * @swagger
 * /api/capabilities/categories:
 *   get:
 *     summary: 获取能力分类列表
 *     tags: [Capabilities]
 *     responses:
 *       200:
 *         description: 获取成功
 */
router.get('/categories', capabilityController.getCapabilityCategories)

/**
 * @swagger
 * /api/capabilities/{id}:
 *   get:
 *     summary: 获取指定能力
 *     tags: [Capabilities]
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
 *         description: 能力不存在
 */
router.get('/:id',
  optionalAuthenticate,
  validateUuidParam('id'),
  handleValidationErrors,
  capabilityController.getCapability
)

/**
 * @swagger
 * /api/capabilities:
 *   post:
 *     summary: 创建能力
 *     tags: [Capabilities]
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
 *               - type
 *               - definition
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
 *               type:
 *                 type: string
 *                 enum: [function, api, webhook, custom]
 *               definition:
 *                 type: object
 *                 description: 能力定义，根据类型不同结构不同
 *               parameters:
 *                 type: object
 *                 description: 参数定义
 *               isPublic:
 *                 type: boolean
 *                 default: false
 *               isActive:
 *                 type: boolean
 *                 default: true
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               metadata:
 *                 type: object
 *                 description: 元数据
 *     responses:
 *       201:
 *         description: 创建成功
 *       400:
 *         description: 请求参数错误
 *       401:
 *         description: 未认证
 *       409:
 *         description: 能力名称已存在
 */
router.post('/',
  authenticate,
  validateCreateCapability,
  handleValidationErrors,
  capabilityController.createCapability
)

/**
 * @swagger
 * /api/capabilities/{id}:
 *   put:
 *     summary: 更新能力
 *     tags: [Capabilities]
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
 *               definition:
 *                 type: object
 *               parameters:
 *                 type: object
 *               isPublic:
 *                 type: boolean
 *               isActive:
 *                 type: boolean
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               metadata:
 *                 type: object
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
 *         description: 能力不存在
 *       409:
 *         description: 能力名称已存在
 */
router.put('/:id',
  authenticate,
  validateUuidParam('id'),
  validateUpdateCapability,
  handleValidationErrors,
  capabilityController.updateCapability
)

/**
 * @swagger
 * /api/capabilities/{id}:
 *   delete:
 *     summary: 删除能力
 *     tags: [Capabilities]
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
 *         description: 能力不存在
 *       409:
 *         description: 能力正在被使用，无法删除
 */
router.delete('/:id',
  authenticate,
  validateUuidParam('id'),
  handleValidationErrors,
  capabilityController.deleteCapability
)

/**
 * @swagger
 * /api/capabilities/{id}/test:
 *   post:
 *     summary: 测试能力
 *     tags: [Capabilities]
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
 *               parameters:
 *                 type: object
 *                 description: 测试参数
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
 *         description: 能力不存在
 */
router.post('/:id/test',
  authenticate,
  testLimiter,
  validateUuidParam('id'),
  handleValidationErrors,
  capabilityController.testCapability
)

/**
 * @swagger
 * /api/capabilities/{id}/clone:
 *   post:
 *     summary: 克隆能力
 *     tags: [Capabilities]
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
 *         description: 能力不存在
 *       409:
 *         description: 能力名称已存在
 */
router.post('/:id/clone',
  authenticate,
  validateUuidParam('id'),
  handleValidationErrors,
  capabilityController.cloneCapability
)

/**
 * @swagger
 * /api/capabilities/{id}/export:
 *   get:
 *     summary: 导出能力
 *     tags: [Capabilities]
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
 *         description: 能力不存在
 */
router.get('/:id/export',
  authenticate,
  validateUuidParam('id'),
  handleValidationErrors,
  capabilityController.exportCapability
)

/**
 * @swagger
 * /api/capabilities/import:
 *   post:
 *     summary: 导入能力
 *     tags: [Capabilities]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - capability
 *             properties:
 *               capability:
 *                 type: object
 *                 description: 导出的能力数据
 *               overwrite:
 *                 type: boolean
 *                 default: false
 *                 description: 是否覆盖同名能力
 *     responses:
 *       201:
 *         description: 导入成功
 *       400:
 *         description: 请求参数错误
 *       401:
 *         description: 未认证
 *       409:
 *         description: 能力名称已存在
 */
router.post('/import',
  authenticate,
  capabilityController.importCapability
)

/**
 * @swagger
 * /api/capabilities/{id}/validate:
 *   post:
 *     summary: 验证能力定义
 *     tags: [Capabilities]
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
 *         description: 定义无效
 *       401:
 *         description: 未认证
 *       404:
 *         description: 能力不存在
 */
router.post('/:id/validate',
  authenticate,
  validateUuidParam('id'),
  handleValidationErrors,
  capabilityController.validateCapabilityDefinition
)

/**
 * @swagger
 * /api/capabilities/validate-agent:
 *   post:
 *     summary: 验证Agent配置
 *     tags: [Capabilities]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Agent名称
 *               description:
 *                 type: string
 *                 description: Agent描述
 *               capabilities:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: 能力ID列表
 *               orchestrator_config:
 *                 type: object
 *                 description: 编排器配置
 *               deployment_config:
 *                 type: object
 *                 description: 部署配置
 *     responses:
 *       200:
 *         description: 验证结果
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     isValid:
 *                       type: boolean
 *                     errors:
 *                       type: array
 *                       items:
 *                         type: string
 *                     warnings:
 *                       type: array
 *                       items:
 *                         type: string
 */
router.post('/validate-agent',
  authenticate,
  handleValidationErrors,
  capabilityController.validateAgent
)

module.exports = router