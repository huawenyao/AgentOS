const express = require('express')
const authController = require('../controllers/authController')
const { authenticate, optionalAuthenticate } = require('../middleware/auth')
const {
  userValidation
} = require('../middleware/validation')
const rateLimit = require('express-rate-limit')



const router = express.Router()

// 登录限流
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 5, // 最多5次尝试
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: '登录尝试次数过多，请15分钟后再试'
    }
  },
  standardHeaders: true,
  legacyHeaders: false
})

// 注册限流
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1小时
  max: 3, // 最多3次注册
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: '注册尝试次数过多，请1小时后再试'
    }
  },
  standardHeaders: true,
  legacyHeaders: false
})

// 密码重置限流
const passwordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1小时
  max: 3, // 最多3次密码修改
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: '密码修改尝试次数过多，请1小时后再试'
    }
  },
  standardHeaders: true,
  legacyHeaders: false
})

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: 用户注册
 *     tags: [Authentication]
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
 *     responses:
 *       201:
 *         description: 注册成功
 *       400:
 *         description: 请求参数错误
 *       409:
 *         description: 用户名或邮箱已存在
 */
router.post('/register', 
  registerLimiter,
  ...userValidation.register,
  authController.register
)

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: 用户登录
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - login
 *               - password
 *             properties:
 *               login:
 *                 type: string
 *                 description: 用户名或邮箱
 *               password:
 *                 type: string
 *               rememberMe:
 *                 type: boolean
 *                 default: false
 *     responses:
 *       200:
 *         description: 登录成功
 *       400:
 *         description: 请求参数错误
 *       401:
 *         description: 认证失败
 */
router.post('/login',
  loginLimiter,
  ...userValidation.login,
  authController.login
)

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: 刷新访问令牌
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: 令牌刷新成功
 *       401:
 *         description: 刷新令牌无效
 */
router.post('/refresh', authController.refreshToken)

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: 用户登出
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 登出成功
 *       401:
 *         description: 未认证
 */
router.post('/logout', authenticate, authController.logout)

/**
 * @swagger
 * /api/auth/change-password:
 *   post:
 *     summary: 修改密码
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *     responses:
 *       200:
 *         description: 密码修改成功
 *       400:
 *         description: 请求参数错误
 *       401:
 *         description: 当前密码错误
 */
router.post('/change-password',
  authenticate,
  passwordLimiter,
  ...userValidation.changePassword,
  authController.changePassword
)

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: 获取当前用户信息
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 获取成功
 *       401:
 *         description: 未认证
 */
router.get('/me', authenticate, authController.getCurrentUser)

/**
 * @swagger
 * /api/auth/api-key:
 *   post:
 *     summary: 生成API密钥
 *     tags: [Authentication]
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
 *             properties:
 *               name:
 *                 type: string
 *                 description: API密钥名称
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: 权限列表
 *               expiresIn:
 *                 type: string
 *                 description: 过期时间 (如: '30d', '1y')
 *                 default: '1y'
 *     responses:
 *       201:
 *         description: API密钥生成成功
 *       400:
 *         description: 请求参数错误
 *       401:
 *         description: 未认证
 */
router.post('/api-key', authenticate, authController.generateApiKey)

/**
 * @swagger
 * /api/auth/verify:
 *   post:
 *     summary: 验证令牌
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *     responses:
 *       200:
 *         description: 令牌有效
 *       401:
 *         description: 令牌无效
 */
router.post('/verify', authController.verifyToken)

module.exports = router