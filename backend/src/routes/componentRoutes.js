const express = require('express')
const componentController = require('../controllers/componentController')
const { authenticate, authorize, optionalAuthenticate } = require('../middleware/auth')
const {
  validateCreateComponent,
  validateUpdateComponent,
  validateUuidParam,
  validatePagination,
  validateSearch,
  handleValidationErrors
} = require('../middleware/validation')
const rateLimit = require('express-rate-limit')

const router = express.Router()

// 安装限流
const installLimiter = rateLimit({
  windowMs: 60 * 1000, // 1分钟
  max: 5, // 最多5次安装
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: '组件安装过于频繁，请1分钟后再试'
    }
  }
})

/**
 * @swagger
 * /api/components:
 *   get:
 *     summary: 获取组件列表
 *     tags: [Components]
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
 *         description: 搜索组件名称或描述
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: 按分类筛选
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [ui, logic, data, integration]
 *         description: 按类型筛选
 *       - in: query
 *         name: isPublic
 *         schema:
 *           type: boolean
 *         description: 筛选公开组件
 *       - in: query
 *         name: isOfficial
 *         schema:
 *           type: boolean
 *         description: 筛选官方组件
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, updatedAt, name, downloadCount, rating]
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
  componentController.getComponents
)

/**
 * @swagger
 * /api/components/stats:
 *   get:
 *     summary: 获取组件统计信息
 *     tags: [Components]
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
  componentController.getComponentStatistics
)

/**
 * @swagger
 * /api/components/search:
 *   get:
 *     summary: 搜索组件
 *     tags: [Components]
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
 *           enum: [ui, logic, data, integration]
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
  componentController.searchComponents
)

/**
 * @swagger
 * /api/components/categories:
 *   get:
 *     summary: 获取组件分类列表
 *     tags: [Components]
 *     responses:
 *       200:
 *         description: 获取成功
 */
router.get('/categories', componentController.getComponentCategories)

/**
 * @swagger
 * /api/components/featured:
 *   get:
 *     summary: 获取推荐组件
 *     tags: [Components]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 20
 *           default: 10
 *     responses:
 *       200:
 *         description: 获取成功
 */
router.get('/featured',
  optionalAuthenticate,
  componentController.getFeaturedComponents
)

/**
 * @swagger
 * /api/components/{id}:
 *   get:
 *     summary: 获取指定组件
 *     tags: [Components]
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
 *         description: 组件不存在
 */
router.get('/:id',
  optionalAuthenticate,
  validateUuidParam('id'),
  handleValidationErrors,
  componentController.getComponent
)

/**
 * @swagger
 * /api/components:
 *   post:
 *     summary: 创建组件
 *     tags: [Components]
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
 *               - version
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
 *                 enum: [ui, logic, data, integration]
 *               version:
 *                 type: string
 *                 pattern: '^\d+\.\d+\.\d+$'
 *               definition:
 *                 type: object
 *                 description: 组件定义
 *               config:
 *                 type: object
 *                 description: 组件配置
 *               dependencies:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: 依赖的其他组件
 *               isPublic:
 *                 type: boolean
 *                 default: false
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
 *         description: 组件名称已存在
 */
router.post('/',
  authenticate,
  validateCreateComponent,
  handleValidationErrors,
  componentController.createComponent
)

/**
 * @swagger
 * /api/components/{id}:
 *   put:
 *     summary: 更新组件
 *     tags: [Components]
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
 *               version:
 *                 type: string
 *                 pattern: '^\d+\.\d+\.\d+$'
 *               definition:
 *                 type: object
 *               config:
 *                 type: object
 *               dependencies:
 *                 type: array
 *                 items:
 *                   type: string
 *               isPublic:
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
 *         description: 组件不存在
 *       409:
 *         description: 组件名称已存在
 */
router.put('/:id',
  authenticate,
  validateUuidParam('id'),
  validateUpdateComponent,
  handleValidationErrors,
  componentController.updateComponent
)

/**
 * @swagger
 * /api/components/{id}:
 *   delete:
 *     summary: 删除组件
 *     tags: [Components]
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
 *         description: 组件不存在
 *       409:
 *         description: 组件正在被使用，无法删除
 */
router.delete('/:id',
  authenticate,
  validateUuidParam('id'),
  handleValidationErrors,
  componentController.deleteComponent
)

/**
 * @swagger
 * /api/components/{id}/install:
 *   post:
 *     summary: 安装组件
 *     tags: [Components]
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
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               version:
 *                 type: string
 *                 description: 指定安装版本，默认最新版本
 *               config:
 *                 type: object
 *                 description: 安装配置
 *     responses:
 *       200:
 *         description: 安装成功
 *       400:
 *         description: 请求参数错误
 *       401:
 *         description: 未认证
 *       404:
 *         description: 组件不存在
 *       409:
 *         description: 组件已安装
 */
router.post('/:id/install',
  authenticate,
  installLimiter,
  validateUuidParam('id'),
  handleValidationErrors,
  componentController.installComponent
)

/**
 * @swagger
 * /api/components/{id}/uninstall:
 *   post:
 *     summary: 卸载组件
 *     tags: [Components]
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
 *         description: 卸载成功
 *       401:
 *         description: 未认证
 *       404:
 *         description: 组件不存在或未安装
 *       409:
 *         description: 组件正在被使用，无法卸载
 */
router.post('/:id/uninstall',
  authenticate,
  validateUuidParam('id'),
  handleValidationErrors,
  componentController.uninstallComponent
)

/**
 * @swagger
 * /api/components/{id}/versions:
 *   get:
 *     summary: 获取组件版本列表
 *     tags: [Components]
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
 *         description: 组件不存在
 */
router.get('/:id/versions',
  optionalAuthenticate,
  validateUuidParam('id'),
  handleValidationErrors,
  componentController.getComponentVersions
)

/**
 * @swagger
 * /api/components/{id}/clone:
 *   post:
 *     summary: 克隆组件
 *     tags: [Components]
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
 *               version:
 *                 type: string
 *                 pattern: '^\d+\.\d+\.\d+$'
 *                 default: '1.0.0'
 *     responses:
 *       201:
 *         description: 克隆成功
 *       400:
 *         description: 请求参数错误
 *       401:
 *         description: 未认证
 *       404:
 *         description: 组件不存在
 *       409:
 *         description: 组件名称已存在
 */
router.post('/:id/clone',
  authenticate,
  validateUuidParam('id'),
  handleValidationErrors,
  componentController.cloneComponent
)

/**
 * @swagger
 * /api/components/{id}/export:
 *   get:
 *     summary: 导出组件
 *     tags: [Components]
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
 *         description: 组件不存在
 */
router.get('/:id/export',
  authenticate,
  validateUuidParam('id'),
  handleValidationErrors,
  componentController.exportComponent
)

/**
 * @swagger
 * /api/components/import:
 *   post:
 *     summary: 导入组件
 *     tags: [Components]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - component
 *             properties:
 *               component:
 *                 type: object
 *                 description: 导出的组件数据
 *               overwrite:
 *                 type: boolean
 *                 default: false
 *                 description: 是否覆盖同名组件
 *     responses:
 *       201:
 *         description: 导入成功
 *       400:
 *         description: 请求参数错误
 *       401:
 *         description: 未认证
 *       409:
 *         description: 组件名称已存在
 */
router.post('/import',
  authenticate,
  componentController.importComponent
)

/**
 * @swagger
 * /api/components/{id}/validate:
 *   post:
 *     summary: 验证组件定义
 *     tags: [Components]
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
 *         description: 组件不存在
 */
router.post('/:id/validate',
  authenticate,
  validateUuidParam('id'),
  handleValidationErrors,
  componentController.validateComponent
)

/**
 * @swagger
 * /api/components/{id}/rate:
 *   post:
 *     summary: 评价组件
 *     tags: [Components]
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
 *               - rating
 *             properties:
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               comment:
 *                 type: string
 *                 maxLength: 500
 *     responses:
 *       200:
 *         description: 评价成功
 *       400:
 *         description: 请求参数错误
 *       401:
 *         description: 未认证
 *       404:
 *         description: 组件不存在
 */
router.post('/:id/rate',
  authenticate,
  validateUuidParam('id'),
  handleValidationErrors,
  componentController.rateComponent
)

module.exports = router