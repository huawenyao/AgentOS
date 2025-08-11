const express = require('express')
const userController = require('../controllers/userController')
const { authenticate, authorize, checkOwnership } = require('../middleware/auth')
const {
  userValidation,
  commonValidation,
  handleValidationErrors
} = require('../middleware/validation')
const rateLimit = require('express-rate-limit')

const router = express.Router()

// 批量操作限流
const batchLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5分钟
  max: 10, // 最多10次批量操作
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
 * /api/users:
 *   get:
 *     summary: 获取用户列表
 *     tags: [Users]
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
 *         description: 搜索用户名或邮箱
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [admin, user]
 *         description: 按角色筛选
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive]
 *         description: 按状态筛选
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, updatedAt, username, email]
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
 */
router.get('/',
  authenticate,
  authorize(['admin']),
  ...commonValidation.pagination,
  ...commonValidation.search,
  userController.getUsers
)

/**
 * @swagger
 * /api/users/stats:
 *   get:
 *     summary: 获取用户统计信息
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 获取成功
 *       401:
 *         description: 未认证
 *       403:
 *         description: 权限不足
 */
router.get('/stats',
  authenticate,
  authorize(['admin']),
  userController.getUserStats
)

/**
 * @swagger
 * /api/users/search:
 *   get:
 *     summary: 搜索用户
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 2
 *         description: 搜索关键词
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
 *       401:
 *         description: 未认证
 */
router.get('/search',
  authenticate,
  ...commonValidation.search,
  userController.searchUsers
)

/**
 * @swagger
 * /api/users/profile:
 *   get:
 *     summary: 获取当前用户资料
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 获取成功
 *       401:
 *         description: 未认证
 */
router.get('/profile', authenticate, userController.getUser)

/**
 * @swagger
 * /api/users/profile:
 *   put:
 *     summary: 更新当前用户资料
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *                 maxLength: 50
 *               lastName:
 *                 type: string
 *                 maxLength: 50
 *               email:
 *                 type: string
 *                 format: email
 *               avatar:
 *                 type: string
 *                 format: uri
 *               preferences:
 *                 type: object
 *     responses:
 *       200:
 *         description: 更新成功
 *       400:
 *         description: 请求参数错误
 *       401:
 *         description: 未认证
 *       409:
 *         description: 邮箱已存在
 */
router.put('/profile',
  authenticate,
  ...userValidation.update,
  userController.updateProfile
)

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: 获取指定用户信息
 *     tags: [Users]
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
 *         description: 用户不存在
 */
router.get('/:id',
  authenticate,
  authorize(['admin']),
  ...commonValidation.uuidParam('id'),
  userController.getUser
)

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: 创建新用户
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 50
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 6
 *               firstName:
 *                 type: string
 *                 maxLength: 50
 *               lastName:
 *                 type: string
 *                 maxLength: 50
 *               role:
 *                 type: string
 *                 enum: [admin, user]
 *                 default: user
 *               isActive:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       201:
 *         description: 创建成功
 *       400:
 *         description: 请求参数错误
 *       401:
 *         description: 未认证
 *       403:
 *         description: 权限不足
 *       409:
 *         description: 用户名或邮箱已存在
 */
router.post('/',
  authenticate,
  authorize(['admin']),
  ...userValidation.register,
  userController.createUser
)

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: 更新用户信息
 *     tags: [Users]
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
 *               username:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 50
 *               email:
 *                 type: string
 *                 format: email
 *               firstName:
 *                 type: string
 *                 maxLength: 50
 *               lastName:
 *                 type: string
 *                 maxLength: 50
 *               role:
 *                 type: string
 *                 enum: [admin, user]
 *               isActive:
 *                 type: boolean
 *               avatar:
 *                 type: string
 *                 format: uri
 *               preferences:
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
 *         description: 用户不存在
 *       409:
 *         description: 用户名或邮箱已存在
 */
router.put('/:id',
  authenticate,
  authorize(['admin']),
  ...commonValidation.uuidParam('id'),
  ...userValidation.update,
  userController.updateUser
)

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: 删除用户（软删除）
 *     tags: [Users]
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
 *         description: 用户不存在
 */
router.delete('/:id',
  authenticate,
  authorize(['admin']),
  ...commonValidation.uuidParam('id'),
  userController.deleteUser
)

/**
 * @swagger
 * /api/users/{id}/reset-password:
 *   post:
 *     summary: 重置用户密码
 *     tags: [Users]
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
 *               - newPassword
 *             properties:
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *     responses:
 *       200:
 *         description: 密码重置成功
 *       400:
 *         description: 请求参数错误
 *       401:
 *         description: 未认证
 *       403:
 *         description: 权限不足
 *       404:
 *         description: 用户不存在
 */
router.post('/:id/reset-password',
  authenticate,
  authorize(['admin']),
  ...commonValidation.uuidParam('id'),
  userController.resetPassword
)

/**
 * @swagger
 * /api/users/batch:
 *   post:
 *     summary: 批量操作用户
 *     tags: [Users]
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
 *               - userIds
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [activate, deactivate, updateRole]
 *               userIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *                 maxItems: 100
 *               data:
 *                 type: object
 *                 description: 操作相关数据（如角色更新时的新角色）
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
  authorize(['admin']),
  batchLimiter,
  userController.batchUpdateUsers
)

module.exports = router