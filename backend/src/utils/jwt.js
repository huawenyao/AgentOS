const jwt = require('jsonwebtoken')
const logger = require('./logger')
const { cache, CacheKeys } = require('./redis')

class JWTManager {
  constructor() {
    this.secret = process.env.JWT_SECRET || 'your-super-secret-jwt-key'
    this.expiresIn = process.env.JWT_EXPIRES_IN || '24h'
    this.refreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d'
    this.issuer = 'EFIAgent'
    this.audience = 'EFIAgent-Users'
  }

  // 生成访问令牌
  generateAccessToken(payload) {
    try {
      const token = jwt.sign(
        {
          sub: payload.id,
          username: payload.username,
          email: payload.email,
          role: payload.role,
          type: 'access'
        },
        this.secret,
        {
          expiresIn: this.expiresIn,
          issuer: this.issuer,
          audience: this.audience,
          algorithm: 'HS256'
        }
      )
      
      logger.debug('访问令牌生成成功', { userId: payload.id })
      return token
    } catch (error) {
      logger.error('访问令牌生成失败:', error)
      throw new Error('令牌生成失败')
    }
  }

  // 生成刷新令牌
  generateRefreshToken(payload) {
    try {
      const token = jwt.sign(
        {
          sub: payload.id,
          username: payload.username,
          type: 'refresh'
        },
        this.secret,
        {
          expiresIn: this.refreshExpiresIn,
          issuer: this.issuer,
          audience: this.audience,
          algorithm: 'HS256'
        }
      )
      
      logger.debug('刷新令牌生成成功', { userId: payload.id })
      return token
    } catch (error) {
      logger.error('刷新令牌生成失败:', error)
      throw new Error('刷新令牌生成失败')
    }
  }

  // 验证令牌
  verifyToken(token) {
    try {
      const decoded = jwt.verify(token, this.secret, {
        issuer: this.issuer,
        audience: this.audience,
        algorithms: ['HS256']
      })
      
      logger.debug('令牌验证成功', { userId: decoded.sub, type: decoded.type })
      return decoded
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        logger.warn('令牌已过期', { error: error.message })
        throw new Error('令牌已过期')
      } else if (error.name === 'JsonWebTokenError') {
        logger.warn('无效令牌', { error: error.message })
        throw new Error('无效令牌')
      } else {
        logger.error('令牌验证失败:', error)
        throw new Error('令牌验证失败')
      }
    }
  }

  // 解码令牌（不验证）
  decodeToken(token) {
    try {
      return jwt.decode(token, { complete: true })
    } catch (error) {
      logger.error('令牌解码失败:', error)
      return null
    }
  }

  // 获取令牌过期时间
  getTokenExpiration(token) {
    try {
      const decoded = this.decodeToken(token)
      if (decoded && decoded.payload && decoded.payload.exp) {
        return new Date(decoded.payload.exp * 1000)
      }
      return null
    } catch (error) {
      logger.error('获取令牌过期时间失败:', error)
      return null
    }
  }

  // 检查令牌是否即将过期
  isTokenExpiringSoon(token, thresholdMinutes = 30) {
    try {
      const expiration = this.getTokenExpiration(token)
      if (!expiration) return true
      
      const now = new Date()
      const threshold = new Date(now.getTime() + thresholdMinutes * 60 * 1000)
      
      return expiration <= threshold
    } catch (error) {
      logger.error('检查令牌过期状态失败:', error)
      return true
    }
  }

  // 刷新访问令牌
  async refreshAccessToken(refreshToken) {
    try {
      const decoded = this.verifyToken(refreshToken)
      
      if (decoded.type !== 'refresh') {
        throw new Error('无效的刷新令牌类型')
      }

      // 检查刷新令牌是否在黑名单中
      const isBlacklisted = await this.isTokenBlacklisted(refreshToken)
      if (isBlacklisted) {
        throw new Error('刷新令牌已失效')
      }

      // 生成新的访问令牌
      const newAccessToken = this.generateAccessToken({
        id: decoded.sub,
        username: decoded.username
      })

      logger.info('访问令牌刷新成功', { userId: decoded.sub })
      return newAccessToken
    } catch (error) {
      logger.error('刷新访问令牌失败:', error)
      throw error
    }
  }

  // 将令牌加入黑名单
  async blacklistToken(token) {
    try {
      const decoded = this.decodeToken(token)
      if (!decoded || !decoded.payload) {
        throw new Error('无效令牌')
      }

      const { exp, jti } = decoded.payload
      const now = Math.floor(Date.now() / 1000)
      
      // 只有未过期的令牌才需要加入黑名单
      if (exp > now) {
        const ttl = exp - now
        const key = `blacklist:${jti || token}`
        await cache.set(key, true, ttl)
        
        logger.info('令牌已加入黑名单', { jti: jti || 'unknown' })
      }
    } catch (error) {
      logger.error('令牌黑名单操作失败:', error)
      throw error
    }
  }

  // 检查令牌是否在黑名单中
  async isTokenBlacklisted(token) {
    try {
      const decoded = this.decodeToken(token)
      if (!decoded || !decoded.payload) {
        return true
      }

      const { jti } = decoded.payload
      const key = `blacklist:${jti || token}`
      return await cache.exists(key)
    } catch (error) {
      logger.error('检查令牌黑名单状态失败:', error)
      return true
    }
  }

  // 生成令牌对
  generateTokenPair(payload) {
    try {
      const accessToken = this.generateAccessToken(payload)
      const refreshToken = this.generateRefreshToken(payload)
      
      return {
        accessToken,
        refreshToken,
        expiresIn: this.parseExpirationTime(this.expiresIn),
        tokenType: 'Bearer'
      }
    } catch (error) {
      logger.error('生成令牌对失败:', error)
      throw error
    }
  }

  // 解析过期时间
  parseExpirationTime(expiresIn) {
    const units = {
      s: 1,
      m: 60,
      h: 3600,
      d: 86400
    }

    const match = expiresIn.match(/^(\d+)([smhd])$/)
    if (!match) {
      return 3600 // 默认1小时
    }

    const [, value, unit] = match
    return parseInt(value) * units[unit]
  }

  // 从请求头中提取令牌
  extractTokenFromHeader(authHeader) {
    if (!authHeader) {
      return null
    }

    const parts = authHeader.split(' ')
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return null
    }

    return parts[1]
  }

  // 验证令牌权限
  hasPermission(userRole, requiredRole) {
    const roleHierarchy = {
      user: 1,
      developer: 2,
      admin: 3
    }

    const userLevel = roleHierarchy[userRole] || 0
    const requiredLevel = roleHierarchy[requiredRole] || 0

    return userLevel >= requiredLevel
  }

  // 生成API密钥
  generateApiKey(payload) {
    try {
      const apiKey = jwt.sign(
        {
          sub: payload.id,
          username: payload.username,
          type: 'api_key',
          permissions: payload.permissions || []
        },
        this.secret,
        {
          issuer: this.issuer,
          audience: this.audience,
          algorithm: 'HS256'
          // API密钥不设置过期时间
        }
      )
      
      logger.info('API密钥生成成功', { userId: payload.id })
      return apiKey
    } catch (error) {
      logger.error('API密钥生成失败:', error)
      throw new Error('API密钥生成失败')
    }
  }

  // 验证API密钥
  verifyApiKey(apiKey) {
    try {
      const decoded = jwt.verify(apiKey, this.secret, {
        issuer: this.issuer,
        audience: this.audience,
        algorithms: ['HS256']
      })
      
      if (decoded.type !== 'api_key') {
        throw new Error('无效的API密钥类型')
      }
      
      logger.debug('API密钥验证成功', { userId: decoded.sub })
      return decoded
    } catch (error) {
      logger.warn('API密钥验证失败:', error)
      throw new Error('无效的API密钥')
    }
  }
}

// 创建JWT管理器实例
const jwtManager = new JWTManager()

module.exports = {
  JWTManager,
  jwtManager
}