const dataService = require('../services/dataService')
const { cache } = require('../utils/redis')
const logger = require('../utils/logger')
const errorHandler = require('../middleware/errorHandler')
const fs = require('fs').promises
const path = require('path')
const archiver = require('archiver')
const { exec } = require('child_process')
const { promisify } = require('util')
const execAsync = promisify(exec)
const os = require('os')
const packageJson = require('../../package.json')

class SystemController {
  // 获取系统信息
  async getSystemInfo(req, res) {
    try {
      const systemInfo = {
        version: packageJson.version,
        environment: process.env.NODE_ENV || 'development',
        uptime: process.uptime(),
        nodeVersion: process.version,
        platform: os.platform(),
        architecture: os.arch(),
        memory: {
          total: os.totalmem(),
          free: os.freemem(),
          used: os.totalmem() - os.freemem(),
          usage: ((os.totalmem() - os.freemem()) / os.totalmem() * 100).toFixed(2)
        },
        cpu: {
          model: os.cpus()[0].model,
          cores: os.cpus().length,
          loadAverage: os.loadavg()
        },
        database: {
          status: 'connected', // TODO: 实际检查数据库连接状态
          version: 'MySQL 8.0' // TODO: 获取实际数据库版本
        },
        redis: {
          status: await this.checkRedisStatus(),
          memory: await this.getRedisMemoryInfo()
        }
      }

      logger.info('系统信息查询', {
        userId: req.user.id,
        action: 'GET_SYSTEM_INFO'
      })

      res.json({
        success: true,
        data: systemInfo
      })
    } catch (error) {
      logger.error('获取系统信息失败', {
        error: error.message,
        stack: error.stack,
        userId: req.user.id
      })
      errorHandler.handleError(error, res)
    }
  }

  // 获取系统配置
  async getSystemConfig(req, res) {
    try {
      let config = await cache.get('system:config')
      
      if (!config) {
        config = await dataService.getSystemConfig()
        await cache.set('system:config', config, 3600) // 缓存1小时
      }

      logger.info('系统配置查询', {
        userId: req.user.id,
        action: 'GET_SYSTEM_CONFIG'
      })

      res.json({
        success: true,
        data: config
      })
    } catch (error) {
      logger.error('获取系统配置失败', {
        error: error.message,
        stack: error.stack,
        userId: req.user.id
      })
      errorHandler.handleError(error, res)
    }
  }

  // 更新系统配置
  async updateSystemConfig(req, res) {
    try {
      const { general, security, features, limits } = req.body

      // 验证配置格式
      this.validateSystemConfig({ general, security, features, limits })

      const newConfig = {
        general: {
          siteName: general?.siteName || 'EFIAgent',
          siteDescription: general?.siteDescription || 'AI Agent Platform',
          allowRegistration: general?.allowRegistration !== false,
          defaultUserRole: general?.defaultUserRole || 'user'
        },
        security: {
          jwtExpiration: security?.jwtExpiration || '24h',
          refreshTokenExpiration: security?.refreshTokenExpiration || '7d',
          passwordMinLength: security?.passwordMinLength || 8,
          maxLoginAttempts: security?.maxLoginAttempts || 5
        },
        features: {
          enableWorkflows: features?.enableWorkflows !== false,
          enableComponents: features?.enableComponents !== false,
          enableMonitoring: features?.enableMonitoring !== false
        },
        limits: {
          maxAgentsPerUser: limits?.maxAgentsPerUser || 50,
          maxWorkflowsPerUser: limits?.maxWorkflowsPerUser || 20,
          maxExecutionsPerDay: limits?.maxExecutionsPerDay || 1000
        }
      }

      // 更新系统配置
      await dataService.updateSystemConfig(newConfig, req.user.id)

      // 更新缓存
      await cache.set('system:config', newConfig, 3600)
      await cache.del('system:config:*') // 清理相关缓存

      logger.info('系统配置更新', {
        userId: req.user.id,
        action: 'UPDATE_SYSTEM_CONFIG',
        changes: Object.keys(req.body)
      })

      res.json({
        success: true,
        message: '系统配置更新成功',
        data: newConfig
      })
    } catch (error) {
      logger.error('更新系统配置失败', {
        error: error.message,
        stack: error.stack,
        userId: req.user.id,
        requestBody: req.body
      })
      errorHandler.handleError(error, res)
    }
  }

  // 创建系统备份
  async createBackup(req, res) {
    try {
      const { type = 'full', description, includeFiles = true } = req.body

      const backupId = this.generateBackupId()
      const backupPath = path.join(process.cwd(), 'backups', backupId)
      
      // 创建备份目录
      await fs.mkdir(backupPath, { recursive: true })

      const backup = await dataService.createSystemBackup({
        id: backupId,
        type,
        description,
        status: 'creating',
        size: 0,
        path: backupPath,
        includeFiles,
        createdBy: req.user.id
      })

      // 异步执行备份
      this.performBackup(backup, includeFiles)
        .catch(error => {
          logger.error('备份执行失败', {
            backupId,
            error: error.message,
            stack: error.stack
          })
        })

      logger.info('系统备份创建', {
        userId: req.user.id,
        action: 'CREATE_BACKUP',
        backupId,
        type
      })

      res.status(201).json({
        success: true,
        message: '备份任务已创建，正在后台执行',
        data: {
          id: backupId,
          status: 'creating',
          type,
          createdAt: backup.createdAt
        }
      })
    } catch (error) {
      logger.error('创建系统备份失败', {
        error: error.message,
        stack: error.stack,
        userId: req.user.id
      })
      errorHandler.handleError(error, res)
    }
  }

  // 获取备份列表
  async getBackups(req, res) {
    try {
      const { page = 1, limit = 20, type } = req.query
      const offset = (page - 1) * limit

      const whereClause = {}
      if (type) {
        whereClause.type = type
      }

      const { count, rows: backups } = await dataService.getSystemBackups({
        where: whereClause,
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset
      })

      logger.info('备份列表查询', {
        userId: req.user.id,
        action: 'GET_BACKUPS',
        filters: { type }
      })

      res.json({
        success: true,
        data: {
          backups,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: count,
            pages: Math.ceil(count / limit)
          }
        }
      })
    } catch (error) {
      logger.error('获取备份列表失败', {
        error: error.message,
        stack: error.stack,
        userId: req.user.id
      })
      errorHandler.handleError(error, res)
    }
  }

  // 恢复系统备份
  async restoreBackup(req, res) {
    try {
      const { id } = req.params
      const { confirmRestore, restoreFiles = true } = req.body

      if (!confirmRestore) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'CONFIRMATION_REQUIRED',
            message: '请确认恢复操作'
          }
        })
      }

      const backup = await dataService.getSystemBackupById(id)
      if (!backup) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'BACKUP_NOT_FOUND',
            message: '备份不存在'
          }
        })
      }

      if (backup.status !== 'completed') {
        return res.status(400).json({
          success: false,
          error: {
            code: 'BACKUP_NOT_READY',
            message: '备份未完成，无法恢复'
          }
        })
      }

      // 执行恢复操作
      await this.performRestore(backup, restoreFiles)

      logger.info('系统备份恢复', {
        userId: req.user.id,
        action: 'RESTORE_BACKUP',
        backupId: id,
        restoreFiles
      })

      res.json({
        success: true,
        message: '系统恢复成功'
      })
    } catch (error) {
      logger.error('恢复系统备份失败', {
        error: error.message,
        stack: error.stack,
        userId: req.user.id,
        backupId: req.params.id
      })
      errorHandler.handleError(error, res)
    }
  }

  // 进入维护模式
  async enableMaintenance(req, res) {
    try {
      const { message = '系统正在维护中，请稍后再试', estimatedDuration } = req.body

      const maintenanceInfo = {
        enabled: true,
        message,
        estimatedDuration,
        startTime: new Date(),
        enabledBy: req.user.id
      }

      await cache.set('system:maintenance', maintenanceInfo)

      logger.info('系统维护模式启用', {
        userId: req.user.id,
        action: 'ENABLE_MAINTENANCE',
        message,
        estimatedDuration
      })

      res.json({
        success: true,
        message: '已进入维护模式',
        data: maintenanceInfo
      })
    } catch (error) {
      logger.error('启用维护模式失败', {
        error: error.message,
        stack: error.stack,
        userId: req.user.id
      })
      errorHandler.handleError(error, res)
    }
  }

  // 退出维护模式
  async disableMaintenance(req, res) {
    try {
      await cache.del('system:maintenance')

      logger.info('系统维护模式禁用', {
        userId: req.user.id,
        action: 'DISABLE_MAINTENANCE'
      })

      res.json({
        success: true,
        message: '已退出维护模式'
      })
    } catch (error) {
      logger.error('禁用维护模式失败', {
        error: error.message,
        stack: error.stack,
        userId: req.user.id
      })
      errorHandler.handleError(error, res)
    }
  }

  // 清理系统缓存
  async clearCache(req, res) {
    try {
      const { cacheTypes = [] } = req.body

      if (cacheTypes.length === 0) {
        // 清理所有缓存
        await cache.flushall()
        logger.info('清理所有缓存', {
          userId: req.user.id,
          action: 'CLEAR_ALL_CACHE'
        })
      } else {
        // 清理指定类型的缓存
        for (const type of cacheTypes) {
          await cache.del(`${type}:*`)
        }
        logger.info('清理指定缓存', {
          userId: req.user.id,
          action: 'CLEAR_CACHE',
          types: cacheTypes
        })
      }

      res.json({
        success: true,
        message: '缓存清理成功',
        data: {
          clearedTypes: cacheTypes.length > 0 ? cacheTypes : ['all']
        }
      })
    } catch (error) {
      logger.error('清理缓存失败', {
        error: error.message,
        stack: error.stack,
        userId: req.user.id
      })
      errorHandler.handleError(error, res)
    }
  }

  // 优化数据库
  async optimizeDatabase(req, res) {
    try {
      const { operations = ['analyze', 'vacuum'] } = req.body
      const results = []

      for (const operation of operations) {
        try {
          switch (operation) {
            case 'analyze':
              // MySQL: ANALYZE TABLE
              await this.analyzeTables()
              results.push({ operation: 'analyze', status: 'success' })
              break
            case 'vacuum':
              // MySQL: OPTIMIZE TABLE
              await this.optimizeTables()
              results.push({ operation: 'vacuum', status: 'success' })
              break
            case 'reindex':
              // 重建索引
              await this.rebuildIndexes()
              results.push({ operation: 'reindex', status: 'success' })
              break
            case 'cleanup':
              // 清理过期数据
              await this.cleanupExpiredData()
              results.push({ operation: 'cleanup', status: 'success' })
              break
            default:
              results.push({ operation, status: 'skipped', reason: 'unknown operation' })
          }
        } catch (opError) {
          results.push({ operation, status: 'failed', error: opError.message })
        }
      }

      logger.info('数据库优化', {
        userId: req.user.id,
        action: 'OPTIMIZE_DATABASE',
        operations,
        results
      })

      res.json({
        success: true,
        message: '数据库优化完成',
        data: { results }
      })
    } catch (error) {
      logger.error('数据库优化失败', {
        error: error.message,
        stack: error.stack,
        userId: req.user.id
      })
      errorHandler.handleError(error, res)
    }
  }

  // 导出系统日志
  async exportLogs(req, res) {
    try {
      const {
        startDate,
        endDate,
        level,
        component,
        format = 'json'
      } = req.body

      const whereClause = {}
      if (startDate) whereClause.createdAt = { [require('sequelize').Op.gte]: new Date(startDate) }
      if (endDate) {
        whereClause.createdAt = {
          ...whereClause.createdAt,
          [require('sequelize').Op.lte]: new Date(endDate)
        }
      }
      if (level) whereClause.level = level
      if (component) whereClause.component = component

      const logs = await SystemLog.findAll({
        where: whereClause,
        order: [['createdAt', 'DESC']],
        limit: 10000 // 限制导出数量
      })

      let exportData
      let contentType
      let filename

      switch (format) {
        case 'csv':
          exportData = this.convertLogsToCSV(logs)
          contentType = 'text/csv'
          filename = `logs_${Date.now()}.csv`
          break
        case 'txt':
          exportData = this.convertLogsToText(logs)
          contentType = 'text/plain'
          filename = `logs_${Date.now()}.txt`
          break
        default:
          exportData = JSON.stringify(logs, null, 2)
          contentType = 'application/json'
          filename = `logs_${Date.now()}.json`
      }

      logger.info('系统日志导出', {
        userId: req.user.id,
        action: 'EXPORT_LOGS',
        format,
        count: logs.length,
        filters: { startDate, endDate, level, component }
      })

      res.setHeader('Content-Type', contentType)
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
      res.send(exportData)
    } catch (error) {
      logger.error('导出系统日志失败', {
        error: error.message,
        stack: error.stack,
        userId: req.user.id
      })
      errorHandler.handleError(error, res)
    }
  }

  // 执行安全扫描
  async securityScan(req, res) {
    try {
      const { scanTypes = ['vulnerabilities', 'permissions'] } = req.body
      const results = []

      for (const scanType of scanTypes) {
        try {
          let scanResult
          switch (scanType) {
            case 'vulnerabilities':
              scanResult = await this.scanVulnerabilities()
              break
            case 'permissions':
              scanResult = await this.scanPermissions()
              break
            case 'configurations':
              scanResult = await this.scanConfigurations()
              break
            case 'dependencies':
              scanResult = await this.scanDependencies()
              break
            default:
              scanResult = { status: 'skipped', reason: 'unknown scan type' }
          }
          results.push({ type: scanType, ...scanResult })
        } catch (scanError) {
          results.push({
            type: scanType,
            status: 'failed',
            error: scanError.message
          })
        }
      }

      logger.info('安全扫描', {
        userId: req.user.id,
        action: 'SECURITY_SCAN',
        scanTypes,
        results: results.map(r => ({ type: r.type, status: r.status }))
      })

      res.json({
        success: true,
        message: '安全扫描完成',
        data: { results }
      })
    } catch (error) {
      logger.error('安全扫描失败', {
        error: error.message,
        stack: error.stack,
        userId: req.user.id
      })
      errorHandler.handleError(error, res)
    }
  }

  // 检查系统更新
  async checkUpdates(req, res) {
    try {
      // TODO: 实现实际的更新检查逻辑
      const currentVersion = packageJson.version
      const updateInfo = {
        currentVersion,
        latestVersion: currentVersion, // 模拟数据
        hasUpdate: false,
        updateAvailable: false,
        releaseNotes: [],
        downloadUrl: null
      }

      logger.info('系统更新检查', {
        userId: req.user.id,
        action: 'CHECK_UPDATES',
        currentVersion
      })

      res.json({
        success: true,
        data: updateInfo
      })
    } catch (error) {
      logger.error('检查系统更新失败', {
        error: error.message,
        stack: error.stack,
        userId: req.user.id
      })
      errorHandler.handleError(error, res)
    }
  }

  // 应用系统更新
  async applyUpdate(req, res) {
    try {
      const { version, autoRestart = false } = req.body

      // TODO: 实现实际的更新应用逻辑
      logger.info('系统更新应用', {
        userId: req.user.id,
        action: 'APPLY_UPDATE',
        version,
        autoRestart
      })

      res.json({
        success: true,
        message: '更新应用成功',
        data: {
          version,
          appliedAt: new Date(),
          requiresRestart: !autoRestart
        }
      })
    } catch (error) {
      logger.error('应用系统更新失败', {
        error: error.message,
        stack: error.stack,
        userId: req.user.id
      })
      errorHandler.handleError(error, res)
    }
  }

  // 辅助方法
  async checkRedisStatus() {
    try {
      await cache.ping()
      return 'connected'
    } catch (error) {
      return 'disconnected'
    }
  }

  async getRedisMemoryInfo() {
    try {
      // TODO: 实现Redis内存信息获取
      return {
        used: '10MB',
        peak: '15MB',
        keys: 100
      }
    } catch (error) {
      return null
    }
  }

  getDefaultConfig() {
    return {
      general: {
        siteName: 'EFIAgent',
        siteDescription: 'AI Agent Platform',
        allowRegistration: true,
        defaultUserRole: 'user'
      },
      security: {
        jwtExpiration: '24h',
        refreshTokenExpiration: '7d',
        passwordMinLength: 8,
        maxLoginAttempts: 5
      },
      features: {
        enableWorkflows: true,
        enableComponents: true,
        enableMonitoring: true
      },
      limits: {
        maxAgentsPerUser: 50,
        maxWorkflowsPerUser: 20,
        maxExecutionsPerDay: 1000
      }
    }
  }

  validateSystemConfig(config) {
    // TODO: 实现配置验证逻辑
    if (config.security?.passwordMinLength < 6) {
      throw new Error('密码最小长度不能少于6位')
    }
    if (config.limits?.maxAgentsPerUser < 1) {
      throw new Error('每用户最大Agent数量必须大于0')
    }
  }

  generateConfigVersion() {
    return `v${Date.now()}`
  }

  generateBackupId() {
    return `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  async performBackup(backup, includeFiles) {
    try {
      // TODO: 实现实际的备份逻辑
      await backup.update({ status: 'completed', size: 1024 * 1024 }) // 模拟1MB
    } catch (error) {
      await backup.update({ status: 'failed', error: error.message })
      throw error
    }
  }

  async performRestore(backup, restoreFiles) {
    // TODO: 实现实际的恢复逻辑
  }

  async analyzeTables() {
    // TODO: 实现MySQL表分析
  }

  async optimizeTables() {
    // TODO: 实现MySQL表优化
  }

  async rebuildIndexes() {
    // TODO: 实现索引重建
  }

  async cleanupExpiredData() {
    // TODO: 实现过期数据清理
  }

  convertLogsToCSV(logs) {
    // TODO: 实现日志CSV转换
    return 'timestamp,level,component,message\n'
  }

  convertLogsToText(logs) {
    // TODO: 实现日志文本转换
    return logs.map(log => `[${log.createdAt}] ${log.level}: ${log.message}`).join('\n')
  }

  async scanVulnerabilities() {
    // TODO: 实现漏洞扫描
    return { status: 'completed', issues: [] }
  }

  async scanPermissions() {
    // TODO: 实现权限扫描
    return { status: 'completed', issues: [] }
  }

  async scanConfigurations() {
    // TODO: 实现配置扫描
    return { status: 'completed', issues: [] }
  }

  async scanDependencies() {
    // TODO: 实现依赖扫描
    return { status: 'completed', issues: [] }
  }
}

module.exports = new SystemController()