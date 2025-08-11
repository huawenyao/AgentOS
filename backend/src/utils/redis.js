const redis = require('redis')
const logger = require('./logger')

let client = null

// Redis配置
const config = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  db: process.env.REDIS_DB || 0,
  retryDelayOnFailover: 100,
  enableReadyCheck: true,
  maxRetriesPerRequest: 3,
  lazyConnect: true
}

// 初始化Redis连接
async function initRedis() {
  try {
    client = redis.createClient({
      socket: {
        host: config.host,
        port: config.port,
        connectTimeout: 5000,
        commandTimeout: 5000,
        reconnectStrategy: false // 禁用自动重连
      },
      password: config.password,
      database: config.db
    })

    // 错误处理
    client.on('error', (error) => {
      logger.warn('Redis连接错误，将在无缓存模式下运行:', error.message)
      // 不再尝试重连，直接设置为null
      client = null
    })

    client.on('connect', () => {
      logger.info('Redis连接建立')
    })

    client.on('ready', () => {
      logger.info('Redis连接就绪')
    })

    client.on('end', () => {
      logger.info('Redis连接关闭')
    })

    // 连接Redis
    await client.connect()
    
    // 测试连接
    await client.ping()
    logger.info('Redis连接测试成功')
    
    return client
  } catch (error) {
    logger.warn('Redis初始化失败，应用将在无缓存模式下运行:', error.message)
    client = null
    return null
  }
}

// 关闭Redis连接
async function closeRedis() {
  if (client) {
    try {
      await client.quit()
      logger.info('Redis连接已关闭')
    } catch (error) {
      logger.error('关闭Redis连接失败:', error)
      throw error
    }
  }
}

// 获取Redis客户端
function getRedisClient() {
  if (!client) {
    throw new Error('Redis客户端未初始化')
  }
  return client
}

// 缓存操作类
class CacheManager {
  constructor() {
    this.defaultTTL = 3600 // 默认1小时过期
  }

  // 设置缓存
  async set(key, value, ttl = this.defaultTTL) {
    try {
      const client = getRedisClient()
      if (!client) {
        logger.debug('Redis不可用，跳过缓存设置')
        return false
      }
      const serializedValue = JSON.stringify(value)
      
      if (ttl > 0) {
        await client.setEx(key, ttl, serializedValue)
      } else {
        await client.set(key, serializedValue)
      }
      
      logger.debug(`缓存设置成功: ${key}`, { ttl })
      return true
    } catch (error) {
      logger.error(`缓存设置失败: ${key}`, error)
      return false
    }
  }

  // 获取缓存
  async get(key) {
    try {
      const client = getRedisClient()
      if (!client) {
        logger.debug('Redis不可用，跳过缓存获取')
        return null
      }
      const value = await client.get(key)
      
      if (value === null) {
        logger.debug(`缓存未命中: ${key}`)
        return null
      }
      
      const parsedValue = JSON.parse(value)
      logger.debug(`缓存命中: ${key}`)
      return parsedValue
    } catch (error) {
      logger.error(`缓存获取失败: ${key}`, error)
      return null
    }
  }

  // 删除缓存
  async del(key) {
    try {
      const client = getRedisClient()
      const result = await client.del(key)
      logger.debug(`缓存删除: ${key}`, { deleted: result })
      return result > 0
    } catch (error) {
      logger.error(`缓存删除失败: ${key}`, error)
      return false
    }
  }

  // 批量删除缓存
  async delPattern(pattern) {
    try {
      const client = getRedisClient()
      const keys = await client.keys(pattern)
      
      if (keys.length === 0) {
        return 0
      }
      
      const result = await client.del(keys)
      logger.debug(`批量缓存删除: ${pattern}`, { deleted: result })
      return result
    } catch (error) {
      logger.error(`批量缓存删除失败: ${pattern}`, error)
      return 0
    }
  }

  // 检查缓存是否存在
  async exists(key) {
    try {
      const client = getRedisClient()
      const result = await client.exists(key)
      return result === 1
    } catch (error) {
      logger.error(`缓存存在检查失败: ${key}`, error)
      return false
    }
  }

  // 设置缓存过期时间
  async expire(key, ttl) {
    try {
      const client = getRedisClient()
      const result = await client.expire(key, ttl)
      return result === 1
    } catch (error) {
      logger.error(`设置缓存过期时间失败: ${key}`, error)
      return false
    }
  }

  // 获取缓存剩余过期时间
  async ttl(key) {
    try {
      const client = getRedisClient()
      return await client.ttl(key)
    } catch (error) {
      logger.error(`获取缓存过期时间失败: ${key}`, error)
      return -1
    }
  }

  // 原子递增
  async incr(key, increment = 1) {
    try {
      const client = getRedisClient()
      return await client.incrBy(key, increment)
    } catch (error) {
      logger.error(`缓存递增失败: ${key}`, error)
      return null
    }
  }

  // 原子递减
  async decr(key, decrement = 1) {
    try {
      const client = getRedisClient()
      return await client.decrBy(key, decrement)
    } catch (error) {
      logger.error(`缓存递减失败: ${key}`, error)
      return null
    }
  }

  // 列表操作 - 左推
  async lpush(key, ...values) {
    try {
      const client = getRedisClient()
      const serializedValues = values.map(v => JSON.stringify(v))
      return await client.lPush(key, serializedValues)
    } catch (error) {
      logger.error(`列表左推失败: ${key}`, error)
      return 0
    }
  }

  // 列表操作 - 右推
  async rpush(key, ...values) {
    try {
      const client = getRedisClient()
      const serializedValues = values.map(v => JSON.stringify(v))
      return await client.rPush(key, serializedValues)
    } catch (error) {
      logger.error(`列表右推失败: ${key}`, error)
      return 0
    }
  }

  // 列表操作 - 左弹
  async lpop(key) {
    try {
      const client = getRedisClient()
      const value = await client.lPop(key)
      return value ? JSON.parse(value) : null
    } catch (error) {
      logger.error(`列表左弹失败: ${key}`, error)
      return null
    }
  }

  // 列表操作 - 右弹
  async rpop(key) {
    try {
      const client = getRedisClient()
      const value = await client.rPop(key)
      return value ? JSON.parse(value) : null
    } catch (error) {
      logger.error(`列表右弹失败: ${key}`, error)
      return null
    }
  }

  // 列表操作 - 获取长度
  async llen(key) {
    try {
      const client = getRedisClient()
      return await client.lLen(key)
    } catch (error) {
      logger.error(`获取列表长度失败: ${key}`, error)
      return 0
    }
  }

  // 集合操作 - 添加成员
  async sadd(key, ...members) {
    try {
      const client = getRedisClient()
      const serializedMembers = members.map(m => JSON.stringify(m))
      return await client.sAdd(key, serializedMembers)
    } catch (error) {
      logger.error(`集合添加失败: ${key}`, error)
      return 0
    }
  }

  // 集合操作 - 移除成员
  async srem(key, ...members) {
    try {
      const client = getRedisClient()
      const serializedMembers = members.map(m => JSON.stringify(m))
      return await client.sRem(key, serializedMembers)
    } catch (error) {
      logger.error(`集合移除失败: ${key}`, error)
      return 0
    }
  }

  // 集合操作 - 检查成员是否存在
  async sismember(key, member) {
    try {
      const client = getRedisClient()
      const serializedMember = JSON.stringify(member)
      return await client.sIsMember(key, serializedMember)
    } catch (error) {
      logger.error(`集合成员检查失败: ${key}`, error)
      return false
    }
  }

  // 哈希操作 - 设置字段
  async hset(key, field, value) {
    try {
      const client = getRedisClient()
      const serializedValue = JSON.stringify(value)
      return await client.hSet(key, field, serializedValue)
    } catch (error) {
      logger.error(`哈希设置失败: ${key}.${field}`, error)
      return 0
    }
  }

  // 哈希操作 - 获取字段
  async hget(key, field) {
    try {
      const client = getRedisClient()
      const value = await client.hGet(key, field)
      return value ? JSON.parse(value) : null
    } catch (error) {
      logger.error(`哈希获取失败: ${key}.${field}`, error)
      return null
    }
  }

  // 哈希操作 - 删除字段
  async hdel(key, ...fields) {
    try {
      const client = getRedisClient()
      return await client.hDel(key, fields)
    } catch (error) {
      logger.error(`哈希删除失败: ${key}`, error)
      return 0
    }
  }

  // 哈希操作 - 获取所有字段
  async hgetall(key) {
    try {
      const client = getRedisClient()
      const hash = await client.hGetAll(key)
      const result = {}
      
      for (const [field, value] of Object.entries(hash)) {
        result[field] = JSON.parse(value)
      }
      
      return result
    } catch (error) {
      logger.error(`哈希获取全部失败: ${key}`, error)
      return {}
    }
  }
}

// 创建缓存管理器实例
const cache = new CacheManager()

// 缓存键生成器
const CacheKeys = {
  user: (id) => `user:${id}`,
  userSession: (id) => `session:${id}`,
  refreshToken: (id) => `refresh_token:${id}`,
  agentTemplate: (id) => `agent_template:${id}`,
  agentConfig: (id) => `agent_config:${id}`,
  workflow: (id) => `workflow:${id}`,
  capability: (id) => `capability:${id}`,
  component: (id) => `component:${id}`,
  agentInstance: (id) => `agent_instance:${id}`,
  metrics: (agentId, type) => `metrics:${agentId}:${type}`,
  rateLimit: (ip) => `rate_limit:${ip}`,
  apiKey: (key) => `api_key:${key}`,
  systemStats: () => 'system:stats',
  userStats: (userId) => `user:${userId}:stats`
}

module.exports = {
  initRedis,
  closeRedis,
  getRedisClient,
  cache,
  CacheKeys
}