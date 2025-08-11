const { jwtManager } = require('../utils/jwt')
const { cache, CacheKeys } = require('../utils/redis')
const logger = require('../utils/logger')
const { User } = require('../models')

// 认证中间件
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    const token = jwtManager.extractTokenFromHeader(authHeader)
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTH_001',
          message: '未提供认证令牌'
        },
        timestamp: new Date().toISOString()
      })
    }

    // 验证令牌
    const decoded = jwtManager.verifyToken(token)
    
    // 检查令牌是否在黑名单中
    const isBlacklisted = await jwtManager.isTokenBlacklisted(token)
    if (isBlacklisted) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTH_003',
          message: '令牌已失效'
        },
        timestamp: new Date().toISOString()
      })
    }

    // 从缓存中获取用户信息
    let user = await cache.get(CacheKeys.user(decoded.sub))
    
    if (!user) {
      // 缓存中没有，从数据库获取
      user = await User.findByPk(decoded.sub, {
        attributes: ['id', 'username', 'email', 'role', 'isActive', 'lastLoginAt']
      })
      
      if (!user) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'AUTH_001',
            message: '用户不存在'
          },
          timestamp: new Date().toISOString()
        })
      }
      
      // 缓存用户信息
      await cache.set(CacheKeys.user(user.id), user.toJSON(), 1800) // 30分钟
    }

    // 检查用户是否激活
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTH_001',
          message: '用户账户已被禁用'
        },
        timestamp: new Date().toISOString()
      })
    }

    // 将用户信息添加到请求对象
    req.user = user
    req.token = token
    
    // 记录用户活动
    logger.business('用户访问', user.id, {
      endpoint: req.path,
      method: req.method,
      ip: req.ip
    })
    
    next()
  } catch (error) {
    logger.error('认证中间件错误:', error)
    
    let errorCode = 'AUTH_001'
    let errorMessage = '认证失败'
    
    if (error.message === '令牌已过期') {
      errorCode = 'AUTH_003'
      errorMessage = '令牌已过期'
    } else if (error.message === '无效令牌') {
      errorCode = 'AUTH_001'
      errorMessage = '无效令牌'
    }
    
    return res.status(401).json({
      success: false,
      error: {
        code: errorCode,
        message: errorMessage
      },
      timestamp: new Date().toISOString()
    })
  }
}

// 可选认证中间件（令牌可选）
const optionalAuthenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    const token = jwtManager.extractTokenFromHeader(authHeader)
    
    if (!token) {
      // 没有令牌，继续执行
      return next()
    }

    // 有令牌，尝试验证
    const decoded = jwtManager.verifyToken(token)
    
    // 检查令牌是否在黑名单中
    const isBlacklisted = await jwtManager.isTokenBlacklisted(token)
    if (isBlacklisted) {
      return next() // 令牌无效，但继续执行
    }

    // 获取用户信息
    let user = await cache.get(CacheKeys.user(decoded.sub))
    
    if (!user) {
      user = await User.findByPk(decoded.sub, {
        attributes: ['id', 'username', 'email', 'role', 'isActive']
      })
      
      if (user && user.isActive) {
        await cache.set(CacheKeys.user(user.id), user.toJSON(), 1800)
      }
    }

    if (user && user.isActive) {
      req.user = user
      req.token = token
    }
    
    next()
  } catch (error) {
    // 认证失败，但继续执行
    logger.debug('可选认证失败:', error.message)
    next()
  }
}

// 权限检查中间件
const authorize = (requiredRole) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTH_001',
          message: '需要认证'
        },
        timestamp: new Date().toISOString()
      })
    }

    if (!jwtManager.hasPermission(req.user.role, requiredRole)) {
      logger.security('权限不足', req.user.id, req.ip, {
        userRole: req.user.role,
        requiredRole,
        endpoint: req.path
      })
      
      return res.status(403).json({
        success: false,
        error: {
          code: 'AUTH_002',
          message: '权限不足'
        },
        timestamp: new Date().toISOString()
      })
    }

    next()
  }
}

// 资源所有者检查中间件
const checkOwnership = (getResourceOwnerId) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'AUTH_001',
            message: '需要认证'
          },
          timestamp: new Date().toISOString()
        })
      }

      // 管理员可以访问所有资源
      if (req.user.role === 'admin') {
        return next()
      }

      const resourceOwnerId = await getResourceOwnerId(req)
      
      if (!resourceOwnerId) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'RESOURCE_001',
            message: '资源不存在'
          },
          timestamp: new Date().toISOString()
        })
      }

      if (resourceOwnerId !== req.user.id) {
        logger.security('非法访问资源', req.user.id, req.ip, {
          resourceOwnerId,
          endpoint: req.path
        })
        
        return res.status(403).json({
          success: false,
          error: {
            code: 'AUTH_002',
            message: '无权访问此资源'
          },
          timestamp: new Date().toISOString()
        })
      }

      next()
    } catch (error) {
      logger.error('所有权检查错误:', error)
      return res.status(500).json({
        success: false,
        error: {
          code: 'SERVER_001',
          message: '服务器内部错误'
        },
        timestamp: new Date().toISOString()
      })
    }
  }
}

// API密钥认证中间件
const authenticateApiKey = async (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'] || req.query.api_key
    
    if (!apiKey) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTH_001',
          message: '未提供API密钥'
        },
        timestamp: new Date().toISOString()
      })
    }

    // 验证API密钥
    const decoded = jwtManager.verifyApiKey(apiKey)
    
    // 获取用户信息
    let user = await cache.get(CacheKeys.user(decoded.sub))
    
    if (!user) {
      user = await User.findByPk(decoded.sub, {
        attributes: ['id', 'username', 'email', 'role', 'isActive']
      })
      
      if (!user) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'AUTH_001',
            message: '用户不存在'
          },
          timestamp: new Date().toISOString()
        })
      }
      
      await cache.set(CacheKeys.user(user.id), user.toJSON(), 1800)
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTH_001',
          message: '用户账户已被禁用'
        },
        timestamp: new Date().toISOString()
      })
    }

    req.user = user
    req.apiKey = apiKey
    req.permissions = decoded.permissions || []
    
    logger.business('API密钥访问', user.id, {
      endpoint: req.path,
      method: req.method,
      ip: req.ip
    })
    
    next()
  } catch (error) {
    logger.error('API密钥认证错误:', error)
    
    return res.status(401).json({
      success: false,
      error: {
        code: 'AUTH_001',
        message: '无效的API密钥'
      },
      timestamp: new Date().toISOString()
    })
  }
}

// 权限检查函数（用于API密钥）
const checkPermission = (requiredPermission) => {
  return (req, res, next) => {
    if (!req.permissions) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'AUTH_002',
          message: '权限不足'
        },
        timestamp: new Date().toISOString()
      })
    }

    if (!req.permissions.includes(requiredPermission) && !req.permissions.includes('*')) {
      logger.security('API权限不足', req.user.id, req.ip, {
        requiredPermission,
        userPermissions: req.permissions,
        endpoint: req.path
      })
      
      return res.status(403).json({
        success: false,
        error: {
          code: 'AUTH_002',
          message: '权限不足'
        },
        timestamp: new Date().toISOString()
      })
    }

    next()
  }
}

// 验证令牌函数（供其他模块使用）
const verifyToken = (token) => {
  return jwtManager.verifyToken(token)
}

// 生成令牌函数（供其他模块使用）
const generateTokenPair = (payload) => {
  return jwtManager.generateTokenPair(payload)
}

module.exports = {
  authenticate,
  optionalAuthenticate,
  authorize,
  checkOwnership,
  authenticateApiKey,
  checkPermission,
  verifyToken,
  generateTokenPair
}