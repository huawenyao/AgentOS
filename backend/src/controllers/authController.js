const bcrypt = require('bcryptjs')
const dataService = require('../services/dataService')
const { jwtManager } = require('../utils/jwt')
const { cache, CacheKeys } = require('../utils/redis')
const logger = require('../utils/logger')
const { 
  AppError, 
  createValidationError, 
  createBusinessError,
  handleResult 
} = require('../middleware/errorHandler')

// 用户注册
const register = handleResult(async (req, res) => {
  const { username, email, password } = req.body
  
  // 加密密码
  const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12
  const hashedPassword = await bcrypt.hash(password, saltRounds)
  
  // 创建用户
  const user = await dataService.createUser({
    username,
    email,
    password: hashedPassword,
    role: 'user', // 默认角色
    isActive: true
  })
  
  // 生成令牌
  const tokenPayload = {
    sub: user.id,
    username: user.username,
    email: user.email,
    role: user.role
  }
  
  const { accessToken, refreshToken } = jwtManager.generateTokenPair(tokenPayload)
  
  // 缓存用户信息
  await cache.set(CacheKeys.user(user.id), {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    isActive: user.isActive
  }, 1800) // 30分钟
  
  // 缓存刷新令牌
  await cache.set(CacheKeys.refreshToken(user.id), refreshToken, 7 * 24 * 60 * 60) // 7天
  
  logger.info(`用户 ${user.id} 注册成功`)
  
  return {
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt
    },
    tokens: {
      accessToken,
      refreshToken,
      expiresIn: process.env.JWT_EXPIRES_IN || '1h'
    }
  }
})

// 用户登录
const login = handleResult(async (req, res) => {
  const { username, password, rememberMe = false } = req.body
  
  // 查找用户（支持用户名或邮箱登录）
  const user = await dataService.getUserByUsernameOrEmail(username)
  
  if (!user) {
    throw createValidationError('用户名或密码错误')
  }
  
  // 检查用户是否激活
  if (!user.isActive) {
    throw createBusinessError('账户已被禁用，请联系管理员')
  }
  
  // 验证密码
  const isPasswordValid = await bcrypt.compare(password, user.password)
  if (!isPasswordValid) {
    // 记录登录失败
    logger.security('登录失败', user.id, req.ip, {
      username,
      reason: '密码错误'
    })
    throw createValidationError('用户名或密码错误')
  }
  
  // 生成令牌
  const tokenPayload = {
    sub: user.id,
    username: user.username,
    email: user.email,
    role: user.role
  }
  
  const expiresIn = rememberMe ? '30d' : (process.env.JWT_EXPIRES_IN || '1h')
  const { accessToken, refreshToken } = jwtManager.generateTokenPair(tokenPayload, expiresIn)
  
  // 更新最后登录时间
  await dataService.updateUser(user.id, {
    lastLoginAt: new Date(),
    lastLoginIp: req.ip
  })
  
  // 缓存用户信息
  await cache.set(CacheKeys.user(user.id), {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    lastLoginAt: user.lastLoginAt
  }, 1800) // 30分钟
  
  // 缓存刷新令牌
  const refreshTokenTTL = rememberMe ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60 // 30天或7天
  await cache.set(CacheKeys.refreshToken(user.id), refreshToken, refreshTokenTTL)
  
  logger.info(`用户 ${user.id} 登录成功`)
  
  return {
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      lastLoginAt: user.lastLoginAt
    },
    tokens: {
      accessToken,
      refreshToken,
      expiresIn
    }
  }
})

// 刷新令牌
const refreshToken = handleResult(async (req, res) => {
  const { refreshToken } = req.body
  
  if (!refreshToken) {
    throw createValidationError('刷新令牌不能为空')
  }
  
  // 验证刷新令牌
  const decoded = jwtManager.verifyRefreshToken(refreshToken)
  
  // 检查缓存中的刷新令牌
  const cachedToken = await cache.get(CacheKeys.refreshToken(decoded.sub))
  if (!cachedToken || cachedToken !== refreshToken) {
    throw new AppError('AUTH_003', '刷新令牌无效或已过期')
  }
  
  // 获取用户信息
  const user = await dataService.getUserById(decoded.sub)
  
  if (!user || !user.isActive) {
    throw new AppError('AUTH_001', '用户不存在或已被禁用')
  }
  
  // 生成新的令牌对
  const tokenPayload = {
    sub: user.id,
    username: user.username,
    email: user.email,
    role: user.role
  }
  
  const { accessToken, refreshToken: newRefreshToken } = jwtManager.generateTokenPair(tokenPayload)
  
  // 更新缓存中的刷新令牌
  await cache.set(CacheKeys.refreshToken(user.id), newRefreshToken, 7 * 24 * 60 * 60) // 7天
  
  // 将旧的刷新令牌加入黑名单
  await jwtManager.blacklistToken(refreshToken)
  
  logger.info(`用户 ${user.id} 刷新令牌`)
  
  return {
    tokens: {
      accessToken,
      refreshToken: newRefreshToken,
      expiresIn: process.env.JWT_EXPIRES_IN || '1h'
    }
  }
})

// 用户登出
const logout = handleResult(async (req, res) => {
  const { user, token } = req
  
  // 将访问令牌加入黑名单
  await jwtManager.blacklistToken(token)
  
  // 删除缓存中的用户信息和刷新令牌
  await Promise.all([
    cache.del(CacheKeys.user(user.id)),
    cache.del(CacheKeys.refreshToken(user.id))
  ])
  
  logger.info(`用户 ${user.id} 登出`)
  
  return {
    message: '登出成功'
  }
})

// 修改密码
const changePassword = handleResult(async (req, res) => {
  const { currentPassword, newPassword } = req.body
  const { user } = req
  
  // 获取完整的用户信息（包括密码）
  const fullUser = await dataService.getUserById(user.id)
  if (!fullUser) {
    throw createBusinessError('用户不存在')
  }
  
  // 验证当前密码
  const isCurrentPasswordValid = await bcrypt.compare(currentPassword, fullUser.password)
  if (!isCurrentPasswordValid) {
    logger.security('修改密码失败', user.id, req.ip, {
      reason: '当前密码错误'
    })
    throw createValidationError('当前密码错误')
  }
  
  // 检查新密码是否与当前密码相同
  const isSamePassword = await bcrypt.compare(newPassword, fullUser.password)
  if (isSamePassword) {
    throw createValidationError('新密码不能与当前密码相同')
  }
  
  // 加密新密码
  const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12
  const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds)
  
  // 更新密码
  await dataService.updateUser(user.id, {
    password: hashedNewPassword,
    passwordChangedAt: new Date()
  })
  
  // 清除用户缓存，强制重新登录
  await Promise.all([
    cache.del(CacheKeys.user(user.id)),
    cache.del(CacheKeys.refreshToken(user.id))
  ])
  
  // 将当前令牌加入黑名单
  await jwtManager.blacklistToken(req.token)
  
  logger.info(`用户 ${user.id} 修改密码`)
  
  return {
    message: '密码修改成功，请重新登录'
  }
})

// 获取当前用户信息
const getCurrentUser = handleResult(async (req, res) => {
  const { user } = req
  
  // 从数据库获取最新的用户信息
  const currentUser = await dataService.getUserById(user.id)
  
  if (!currentUser) {
    throw createBusinessError('用户不存在')
  }
  
  return {
    user: currentUser
  }
})

// 生成API密钥
const generateApiKey = handleResult(async (req, res) => {
  const { name, permissions = [], expiresIn = '1y' } = req.body
  const { user } = req
  
  // 验证权限
  const validPermissions = ['read', 'write', 'admin', '*']
  const invalidPermissions = permissions.filter(p => !validPermissions.includes(p))
  if (invalidPermissions.length > 0) {
    throw createValidationError(`无效的权限: ${invalidPermissions.join(', ')}`)
  }
  
  // 生成API密钥
  const apiKey = jwtManager.generateApiKey({
    sub: user.id,
    username: user.username,
    permissions,
    name
  }, expiresIn)
  
  logger.info(`用户 ${user.id} 生成API密钥: ${name}`)
  
  return {
    apiKey,
    name,
    permissions,
    expiresIn,
    createdAt: new Date().toISOString()
  }
})

// 验证令牌（用于其他服务）
const verifyToken = handleResult(async (req, res) => {
  const { token } = req.body
  
  if (!token) {
    throw createValidationError('令牌不能为空')
  }
  
  try {
    const decoded = jwtManager.verifyToken(token)
    
    // 检查令牌是否在黑名单中
    const isBlacklisted = await jwtManager.isTokenBlacklisted(token)
    if (isBlacklisted) {
      throw new AppError('AUTH_003', '令牌已失效')
    }
    
    // 获取用户信息
    const user = await dataService.getUserById(decoded.sub)
    
    if (!user || !user.isActive) {
      throw new AppError('AUTH_001', '用户不存在或已被禁用')
    }
    
    return {
      valid: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      },
      tokenInfo: {
        sub: decoded.sub,
        iat: decoded.iat,
        exp: decoded.exp
      }
    }
  } catch (error) {
    return {
      valid: false,
      error: error.message
    }
  }
})



module.exports = {
  register,
  login,
  refreshToken,
  logout,
  changePassword,
  getCurrentUser,
  generateApiKey,
  verifyToken
}