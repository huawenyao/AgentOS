const logger = require('../utils/logger')
const { User, SystemSetting, SystemLog, AgentInstance } = require('../models')
const { Op } = require('sequelize')
const bcrypt = require('bcrypt')
const fs = require('fs').promises
const path = require('path')
const os = require('os')

/**
 * 系统管理服务
 * 负责系统配置、用户管理、系统维护和系统信息管理
 */
class SystemManagementService {
  constructor() {
    this.systemInfo = {
      startTime: new Date(),
      version: process.env.APP_VERSION || '1.0.0',
      environment: process.env.NODE_ENV || 'development'
    }
  }

  // ==================== 配置管理 ====================

  /**
   * 获取系统配置
   */
  async getSystemConfig(category = null) {
    try {
      const where = {}
      if (category) {
        where.category = category
      }
      
      const settings = await SystemSetting.findAll({
        where,
        order: [['category', 'ASC'], ['key', 'ASC']]
      })
      
      if (category) {
        // 返回特定分类的配置
        const config = {}
        settings.forEach(setting => {
          config[setting.key] = this.parseConfigValue(setting.value, setting.type)
        })
        return config
      } else {
        // 返回所有配置，按分类组织
        const config = {}
        settings.forEach(setting => {
          if (!config[setting.category]) {
            config[setting.category] = {}
          }
          config[setting.category][setting.key] = this.parseConfigValue(setting.value, setting.type)
        })
        return config
      }
    } catch (error) {
      logger.error('获取系统配置失败:', error)
      throw error
    }
  }

  /**
   * 更新系统配置
   */
  async updateSystemConfig(category, key, value, userId) {
    try {
      const setting = await SystemSetting.findOne({
        where: { category, key }
      })
      
      if (setting) {
        // 更新现有配置
        await setting.update({
          value: this.stringifyConfigValue(value),
          updatedBy: userId,
          updatedAt: new Date()
        })
      } else {
        // 创建新配置
        await SystemSetting.create({
          category,
          key,
          value: this.stringifyConfigValue(value),
          type: this.detectConfigType(value),
          createdBy: userId,
          updatedBy: userId
        })
      }
      
      // 记录配置变更日志
      await this.logSystemEvent('config_updated', {
        category,
        key,
        value,
        userId
      })
      
      logger.info(`系统配置已更新: ${category}.${key}`)
      
      return await this.getSystemConfig(category)
    } catch (error) {
      logger.error('更新系统配置失败:', error)
      throw error
    }
  }

  /**
   * 批量更新系统配置
   */
  async updateSystemConfigBatch(category, configs, userId) {
    try {
      const results = []
      
      for (const [key, value] of Object.entries(configs)) {
        await this.updateSystemConfig(category, key, value, userId)
        results.push({ key, value, status: 'updated' })
      }
      
      logger.info(`批量更新系统配置完成: ${category}, ${results.length}项`)
      
      return {
        category,
        updated: results.length,
        results
      }
    } catch (error) {
      logger.error('批量更新系统配置失败:', error)
      throw error
    }
  }

  /**
   * 删除系统配置
   */
  async deleteSystemConfig(category, key, userId) {
    try {
      const setting = await SystemSetting.findOne({
        where: { category, key }
      })
      
      if (!setting) {
        throw new Error(`配置项不存在: ${category}.${key}`)
      }
      
      await setting.destroy()
      
      // 记录配置删除日志
      await this.logSystemEvent('config_deleted', {
        category,
        key,
        userId
      })
      
      logger.info(`系统配置已删除: ${category}.${key}`)
      
      return true
    } catch (error) {
      logger.error('删除系统配置失败:', error)
      throw error
    }
  }

  /**
   * 获取配置分类列表
   */
  async getConfigCategories() {
    try {
      const categories = await SystemSetting.findAll({
        attributes: ['category'],
        group: ['category'],
        order: [['category', 'ASC']]
      })
      
      return categories.map(item => item.category)
    } catch (error) {
      logger.error('获取配置分类失败:', error)
      throw error
    }
  }

  /**
   * 解析配置值
   */
  parseConfigValue(value, type) {
    try {
      switch (type) {
        case 'boolean':
          return value === 'true' || value === true
        case 'number':
          return parseFloat(value)
        case 'json':
          return JSON.parse(value)
        case 'array':
          return JSON.parse(value)
        default:
          return value
      }
    } catch (error) {
      logger.warn(`解析配置值失败: ${value}`, error)
      return value
    }
  }

  /**
   * 字符串化配置值
   */
  stringifyConfigValue(value) {
    if (typeof value === 'object') {
      return JSON.stringify(value)
    }
    return String(value)
  }

  /**
   * 检测配置类型
   */
  detectConfigType(value) {
    if (typeof value === 'boolean') return 'boolean'
    if (typeof value === 'number') return 'number'
    if (Array.isArray(value)) return 'array'
    if (typeof value === 'object') return 'json'
    return 'string'
  }

  // ==================== 用户管理 ====================

  /**
   * 获取用户列表
   */
  async getUsers(filters = {}, pagination = {}) {
    try {
      const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = pagination
      const offset = (page - 1) * limit
      
      const where = {}
      if (filters.status) where.status = filters.status
      if (filters.role) where.role = filters.role
      if (filters.q) {
        where[Op.or] = [
          { username: { [Op.iLike]: `%${filters.q}%` } },
          { email: { [Op.iLike]: `%${filters.q}%` } },
          { displayName: { [Op.iLike]: `%${filters.q}%` } }
        ]
      }
      
      const { count, rows: users } = await User.findAndCountAll({
        where,
        attributes: { exclude: ['password'] },
        order: [[sortBy, sortOrder.toUpperCase()]],
        limit: parseInt(limit),
        offset
      })
      
      return {
        users,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / parseInt(limit))
        }
      }
    } catch (error) {
      logger.error('获取用户列表失败:', error)
      throw error
    }
  }

  /**
   * 创建用户
   */
  async createUser(userData, creatorId) {
    try {
      // 检查用户名和邮箱是否已存在
      const existingUser = await User.findOne({
        where: {
          [Op.or]: [
            { username: userData.username },
            { email: userData.email }
          ]
        }
      })
      
      if (existingUser) {
        throw new Error('用户名或邮箱已存在')
      }
      
      // 加密密码
      const hashedPassword = await bcrypt.hash(userData.password, 10)
      
      // 创建用户
      const user = await User.create({
        ...userData,
        password: hashedPassword,
        status: userData.status || 'active',
        role: userData.role || 'user',
        createdBy: creatorId
      })
      
      // 记录用户创建日志
      await this.logSystemEvent('user_created', {
        userId: user.id,
        username: user.username,
        creatorId
      })
      
      logger.info(`用户已创建: ${user.username}`)
      
      // 返回用户信息（不包含密码）
      const { password, ...userInfo } = user.toJSON()
      return userInfo
    } catch (error) {
      logger.error('创建用户失败:', error)
      throw error
    }
  }

  /**
   * 更新用户信息
   */
  async updateUser(userId, updateData, updaterId) {
    try {
      const user = await User.findByPk(userId)
      if (!user) {
        throw new Error(`用户不存在: ${userId}`)
      }
      
      // 如果更新密码，需要加密
      if (updateData.password) {
        updateData.password = await bcrypt.hash(updateData.password, 10)
      }
      
      // 更新用户信息
      await user.update(updateData)
      
      // 记录用户更新日志
      await this.logSystemEvent('user_updated', {
        userId,
        updateData: Object.keys(updateData),
        updaterId
      })
      
      logger.info(`用户信息已更新: ${user.username}`)
      
      // 返回更新后的用户信息（不包含密码）
      const { password, ...userInfo } = user.toJSON()
      return userInfo
    } catch (error) {
      logger.error('更新用户信息失败:', error)
      throw error
    }
  }

  /**
   * 删除用户
   */
  async deleteUser(userId, deleterId) {
    try {
      const user = await User.findByPk(userId)
      if (!user) {
        throw new Error(`用户不存在: ${userId}`)
      }
      
      // 检查是否为系统管理员
      if (user.role === 'admin' && user.username === 'admin') {
        throw new Error('不能删除系统管理员账户')
      }
      
      await user.destroy()
      
      // 记录用户删除日志
      await this.logSystemEvent('user_deleted', {
        userId,
        username: user.username,
        deleterId
      })
      
      logger.info(`用户已删除: ${user.username}`)
      
      return true
    } catch (error) {
      logger.error('删除用户失败:', error)
      throw error
    }
  }

  /**
   * 重置用户密码
   */
  async resetUserPassword(userId, newPassword, resetById) {
    try {
      const user = await User.findByPk(userId)
      if (!user) {
        throw new Error(`用户不存在: ${userId}`)
      }
      
      // 加密新密码
      const hashedPassword = await bcrypt.hash(newPassword, 10)
      
      // 更新密码
      await user.update({ password: hashedPassword })
      
      // 记录密码重置日志
      await this.logSystemEvent('password_reset', {
        userId,
        username: user.username,
        resetById
      })
      
      logger.info(`用户密码已重置: ${user.username}`)
      
      return true
    } catch (error) {
      logger.error('重置用户密码失败:', error)
      throw error
    }
  }

  /**
   * 更新用户状态
   */
  async updateUserStatus(userId, status, updaterId) {
    try {
      const user = await User.findByPk(userId)
      if (!user) {
        throw new Error(`用户不存在: ${userId}`)
      }
      
      await user.update({ status })
      
      // 记录状态更新日志
      await this.logSystemEvent('user_status_updated', {
        userId,
        username: user.username,
        status,
        updaterId
      })
      
      logger.info(`用户状态已更新: ${user.username} -> ${status}`)
      
      return true
    } catch (error) {
      logger.error('更新用户状态失败:', error)
      throw error
    }
  }

  // ==================== 系统维护 ====================

  /**
   * 系统健康检查
   */
  async performHealthCheck() {
    try {
      const healthStatus = {
        timestamp: new Date(),
        overall: 'healthy',
        checks: {}
      }
      
      // 数据库连接检查
      try {
        await User.findOne({ limit: 1 })
        healthStatus.checks.database = { status: 'healthy', message: '数据库连接正常' }
      } catch (error) {
        healthStatus.checks.database = { status: 'unhealthy', message: '数据库连接失败', error: error.message }
        healthStatus.overall = 'unhealthy'
      }
      
      // 内存使用检查
      const memUsage = process.memoryUsage()
      const memUsagePercent = (memUsage.heapUsed / memUsage.heapTotal) * 100
      healthStatus.checks.memory = {
        status: memUsagePercent < 90 ? 'healthy' : 'warning',
        usage: `${memUsagePercent.toFixed(2)}%`,
        heapUsed: memUsage.heapUsed,
        heapTotal: memUsage.heapTotal
      }
      
      // 磁盘空间检查
      try {
        const diskUsage = await this.getDiskUsage()
        healthStatus.checks.disk = {
          status: diskUsage.usagePercent < 90 ? 'healthy' : 'warning',
          usage: `${diskUsage.usagePercent.toFixed(2)}%`,
          free: diskUsage.free,
          total: diskUsage.total
        }
      } catch (error) {
        healthStatus.checks.disk = { status: 'unknown', message: '无法获取磁盘使用情况' }
      }
      
      // Agent实例检查
      try {
        const agentCount = await AgentInstance.count()
        const runningAgents = await AgentInstance.count({ where: { status: 'running' } })
        healthStatus.checks.agents = {
          status: 'healthy',
          total: agentCount,
          running: runningAgents
        }
      } catch (error) {
        healthStatus.checks.agents = { status: 'unknown', message: '无法获取Agent状态' }
      }
      
      return healthStatus
    } catch (error) {
      logger.error('系统健康检查失败:', error)
      throw error
    }
  }

  /**
   * 清理系统日志
   */
  async cleanupSystemLogs(retentionDays = 30) {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays)
      
      const deletedCount = await SystemLog.destroy({
        where: {
          createdAt: {
            [Op.lt]: cutoffDate
          }
        }
      })
      
      logger.info(`系统日志清理完成，删除 ${deletedCount} 条记录`)
      
      return {
        deletedCount,
        cutoffDate,
        retentionDays
      }
    } catch (error) {
      logger.error('清理系统日志失败:', error)
      throw error
    }
  }

  /**
   * 备份系统数据
   */
  async backupSystemData(backupPath) {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const backupDir = path.join(backupPath, `backup-${timestamp}`)
      
      // 创建备份目录
      await fs.mkdir(backupDir, { recursive: true })
      
      // 备份系统配置
      const systemConfig = await this.getSystemConfig()
      await fs.writeFile(
        path.join(backupDir, 'system-config.json'),
        JSON.stringify(systemConfig, null, 2)
      )
      
      // 备份用户数据
      const users = await User.findAll({
        attributes: { exclude: ['password'] }
      })
      await fs.writeFile(
        path.join(backupDir, 'users.json'),
        JSON.stringify(users, null, 2)
      )
      
      // 记录备份日志
      await this.logSystemEvent('system_backup', {
        backupPath: backupDir,
        timestamp
      })
      
      logger.info(`系统数据备份完成: ${backupDir}`)
      
      return {
        backupPath: backupDir,
        timestamp,
        files: ['system-config.json', 'users.json']
      }
    } catch (error) {
      logger.error('备份系统数据失败:', error)
      throw error
    }
  }

  /**
   * 重启系统服务
   */
  async restartSystemService(serviceName) {
    try {
      // 这里可以实现具体的服务重启逻辑
      // 例如重启特定的微服务或组件
      
      await this.logSystemEvent('service_restart', {
        serviceName,
        timestamp: new Date()
      })
      
      logger.info(`系统服务重启: ${serviceName}`)
      
      return {
        serviceName,
        status: 'restarted',
        timestamp: new Date()
      }
    } catch (error) {
      logger.error('重启系统服务失败:', error)
      throw error
    }
  }

  // ==================== 系统信息 ====================

  /**
   * 获取系统信息
   */
  async getSystemInfo() {
    try {
      const systemInfo = {
        // 基本信息
        version: this.systemInfo.version,
        environment: this.systemInfo.environment,
        startTime: this.systemInfo.startTime,
        uptime: Date.now() - this.systemInfo.startTime.getTime(),
        
        // 服务器信息
        server: {
          platform: os.platform(),
          arch: os.arch(),
          hostname: os.hostname(),
          nodeVersion: process.version,
          cpus: os.cpus().length,
          totalMemory: os.totalmem(),
          freeMemory: os.freemem()
        },
        
        // 进程信息
        process: {
          pid: process.pid,
          memoryUsage: process.memoryUsage(),
          cpuUsage: process.cpuUsage()
        },
        
        // 数据库统计
        database: await this.getDatabaseStats(),
        
        // 系统统计
        statistics: await this.getSystemStatistics()
      }
      
      return systemInfo
    } catch (error) {
      logger.error('获取系统信息失败:', error)
      throw error
    }
  }

  /**
   * 获取数据库统计
   */
  async getDatabaseStats() {
    try {
      const stats = {
        users: await User.count(),
        agentInstances: await AgentInstance.count(),
        systemLogs: await SystemLog.count(),
        systemSettings: await SystemSetting.count()
      }
      
      return stats
    } catch (error) {
      logger.error('获取数据库统计失败:', error)
      return {}
    }
  }

  /**
   * 获取系统统计
   */
  async getSystemStatistics() {
    try {
      const now = new Date()
      const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      
      const stats = {
        activeUsers: await User.count({ where: { status: 'active' } }),
        runningAgents: await AgentInstance.count({ where: { status: 'running' } }),
        recentLogs: await SystemLog.count({
          where: {
            createdAt: {
              [Op.gte]: last24h
            }
          }
        })
      }
      
      return stats
    } catch (error) {
      logger.error('获取系统统计失败:', error)
      return {}
    }
  }

  /**
   * 获取磁盘使用情况
   */
  async getDiskUsage() {
    try {
      // 简化实现，实际项目中可以使用更精确的方法
      const stats = await fs.stat(process.cwd())
      return {
        free: 1000000000, // 示例值
        total: 10000000000, // 示例值
        usagePercent: 10 // 示例值
      }
    } catch (error) {
      logger.error('获取磁盘使用情况失败:', error)
      throw error
    }
  }

  // ==================== 日志管理 ====================

  /**
   * 记录系统事件
   */
  async logSystemEvent(eventType, eventData, userId = null) {
    try {
      await SystemLog.create({
        level: 'info',
        message: `系统事件: ${eventType}`,
        metadata: {
          eventType,
          eventData,
          userId,
          timestamp: new Date()
        },
        userId
      })
    } catch (error) {
      logger.error('记录系统事件失败:', error)
    }
  }

  /**
   * 获取系统日志
   */
  async getSystemLogs(filters = {}, pagination = {}) {
    try {
      const { page = 1, limit = 50, sortBy = 'createdAt', sortOrder = 'desc' } = pagination
      const offset = (page - 1) * limit
      
      const where = {}
      if (filters.level) where.level = filters.level
      if (filters.eventType) {
        where['metadata.eventType'] = filters.eventType
      }
      if (filters.userId) where.userId = filters.userId
      if (filters.startDate && filters.endDate) {
        where.createdAt = {
          [Op.between]: [new Date(filters.startDate), new Date(filters.endDate)]
        }
      }
      
      const { count, rows: logs } = await SystemLog.findAndCountAll({
        where,
        include: [{
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'displayName']
        }],
        order: [[sortBy, sortOrder.toUpperCase()]],
        limit: parseInt(limit),
        offset
      })
      
      return {
        logs,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / parseInt(limit))
        }
      }
    } catch (error) {
      logger.error('获取系统日志失败:', error)
      throw error
    }
  }

  /**
   * 导出系统日志
   */
  async exportSystemLogs(filters = {}, format = 'json') {
    try {
      const logs = await SystemLog.findAll({
        where: this.buildLogFilters(filters),
        include: [{
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'displayName']
        }],
        order: [['createdAt', 'DESC']]
      })
      
      if (format === 'csv') {
        return this.convertLogsToCSV(logs)
      } else {
        return JSON.stringify(logs, null, 2)
      }
    } catch (error) {
      logger.error('导出系统日志失败:', error)
      throw error
    }
  }

  /**
   * 构建日志过滤条件
   */
  buildLogFilters(filters) {
    const where = {}
    
    if (filters.level) where.level = filters.level
    if (filters.userId) where.userId = filters.userId
    if (filters.startDate && filters.endDate) {
      where.createdAt = {
        [Op.between]: [new Date(filters.startDate), new Date(filters.endDate)]
      }
    }
    
    return where
  }

  /**
   * 转换日志为CSV格式
   */
  convertLogsToCSV(logs) {
    const headers = ['时间', '级别', '消息', '用户', '元数据']
    const rows = logs.map(log => [
      log.createdAt.toISOString(),
      log.level,
      log.message,
      log.user ? log.user.username : '',
      JSON.stringify(log.metadata || {})
    ])
    
    return [headers, ...rows].map(row => row.join(',')).join('\n')
  }
}

// 创建单例实例
const systemManagementService = new SystemManagementService()

module.exports = systemManagementService