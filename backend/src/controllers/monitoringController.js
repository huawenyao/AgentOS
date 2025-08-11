const dataService = require('../services/dataService')
const monitoringService = require('../services/monitoringService')
const logger = require('../utils/logger')
const errorHandler = require('../middleware/errorHandler')
const os = require('os')
const process = require('process')

/**
 * 监控控制器
 * 处理系统监控相关的请求
 */
class MonitoringController {
  // 获取系统健康状态
  async getSystemHealth(req, res) {
    try {
      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
          database: 'healthy',
          redis: 'healthy',
          application: 'healthy'
        },
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0'
      }

      res.json({
        success: true,
        data: health
      })
    } catch (error) {
      logger.error('获取系统健康状态失败', {
        error: error.message,
        stack: error.stack
      })
      errorHandler.handleError(error, res)
    }
  }

  // 获取系统指标
  async getSystemMetrics(req, res) {
    try {
      const metrics = await monitoringService.getSystemMetrics()

      logger.info('系统指标查询', {
        action: 'GET_SYSTEM_METRICS',
        userId: req.user?.id
      })

      res.json({
        success: true,
        data: metrics
      })
    } catch (error) {
      logger.error('获取系统指标失败', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.id
      })
      errorHandler.handleError(error, res)
    }
  }

  // 获取性能指标
  async getPerformanceMetrics(req, res) {
    try {
      const { timeRange = '1h', agentId } = req.query
      const metrics = await monitoringService.getPerformanceMetrics({ timeRange, agentId })

      logger.info('性能指标查询', {
        action: 'GET_PERFORMANCE_METRICS',
        userId: req.user.id,
        timeRange,
        agentId
      })

      res.json({
        success: true,
        data: metrics
      })
    } catch (error) {
      logger.error('获取性能指标失败', {
        error: error.message,
        stack: error.stack,
        userId: req.user.id
      })
      errorHandler.handleError(error, res)
    }
  }

  // 获取系统日志
  async getSystemLogs(req, res) {
    try {
      const {
        page = 1,
        limit = 50,
        level,
        module,
        startTime,
        endTime
      } = req.query

      const filters = {}
      if (level) filters.level = level
      if (module) filters.module = module
      if (startTime) filters.startTime = startTime
      if (endTime) filters.endTime = endTime

      const pagination = {
        page: parseInt(page),
        limit: parseInt(limit)
      }

      const logs = await monitoringService.getLogs(filters, pagination)

      logger.info('系统日志查询', {
        action: 'GET_SYSTEM_LOGS',
        userId: req.user.id,
        filters
      })

      res.json({
        success: true,
        data: logs
      })
    } catch (error) {
      logger.error('获取系统日志失败', {
        error: error.message,
        stack: error.stack,
        userId: req.user.id
      })
      errorHandler.handleError(error, res)
    }
  }

  // 获取告警信息
  async getAlerts(req, res) {
    try {
      const { page = 1, limit = 20, status, severity } = req.query
      
      const filters = {}
      if (status) filters.status = status
      if (severity) filters.severity = severity
      
      const pagination = {
        page: parseInt(page),
        limit: parseInt(limit)
      }
      
      const alerts = await monitoringService.getAlerts(filters, pagination)

      res.json({
        success: true,
        data: alerts
      })
    } catch (error) {
      logger.error('获取告警信息失败', {
        error: error.message,
        stack: error.stack,
        userId: req.user.id
      })
      errorHandler.handleError(error, res)
    }
  }

  // 确认告警
  async acknowledgeAlert(req, res) {
    try {
      const { id } = req.params
      
      await monitoringService.acknowledgeAlert(id, req.user.id)

      logger.info('告警确认', {
        action: 'ACKNOWLEDGE_ALERT',
        userId: req.user.id,
        alertId: id
      })

      res.json({
        success: true,
        message: '告警已确认'
      })
    } catch (error) {
      logger.error('确认告警失败', {
        error: error.message,
        stack: error.stack,
        userId: req.user.id,
        alertId: req.params.id
      })
      errorHandler.handleError(error, res)
    }
  }

  // 解决告警
  async resolveAlert(req, res) {
    try {
      const { id } = req.params

      logger.info('告警解决', {
        action: 'RESOLVE_ALERT',
        userId: req.user.id,
        alertId: id
      })

      res.json({
        success: true,
        message: '告警已解决'
      })
    } catch (error) {
      logger.error('解决告警失败', {
        error: error.message,
        stack: error.stack,
        userId: req.user.id,
        alertId: req.params.id
      })
      errorHandler.handleError(error, res)
    }
  }

  // 获取使用统计
  async getUsageStats(req, res) {
    try {
      const { timeRange = '24h' } = req.query

      // 模拟使用统计数据
      const stats = {
        users: {
          active: 10,
          total: 50
        },
        agents: {
          running: 5,
          total: 20
        },
        workflows: {
          executed: 100,
          successful: 95
        },
        timeRange,
        timestamp: new Date().toISOString()
      }

      res.json({
        success: true,
        data: stats
      })
    } catch (error) {
      logger.error('获取使用统计失败', {
        error: error.message,
        stack: error.stack,
        userId: req.user.id
      })
      errorHandler.handleError(error, res)
    }
  }

  // 获取错误统计
  async getErrorStats(req, res) {
    try {
      const { page = 1, limit = 20, timeRange = '24h' } = req.query

      // 模拟错误统计数据
      const errorStats = {
        errors: [],
        summary: {
          total: 0,
          byType: {},
          byModule: {}
        },
        pagination: {
          total: 0,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: 0
        }
      }

      res.json({
        success: true,
        data: errorStats
      })
    } catch (error) {
      logger.error('获取错误统计失败', {
        error: error.message,
        stack: error.stack,
        userId: req.user.id
      })
      errorHandler.handleError(error, res)
    }
  }

  // 获取Agent监控
  async getAgentMonitoring(req, res) {
    try {
      const { page = 1, limit = 20 } = req.query

      // 模拟Agent监控数据
      const monitoring = {
        agents: [],
        pagination: {
          total: 0,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: 0
        }
      }

      res.json({
        success: true,
        data: monitoring
      })
    } catch (error) {
      logger.error('获取Agent监控失败', {
        error: error.message,
        stack: error.stack,
        userId: req.user.id
      })
      errorHandler.handleError(error, res)
    }
  }

  // 获取工作流监控
  async getWorkflowMonitoring(req, res) {
    try {
      const { page = 1, limit = 20 } = req.query

      // 模拟工作流监控数据
      const monitoring = {
        workflows: [],
        pagination: {
          total: 0,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: 0
        }
      }

      res.json({
        success: true,
        data: monitoring
      })
    } catch (error) {
      logger.error('获取工作流监控失败', {
        error: error.message,
        stack: error.stack,
        userId: req.user.id
      })
      errorHandler.handleError(error, res)
    }
  }

  // 获取仪表板数据
  async getDashboardData(req, res) {
    try {
      // 模拟仪表板数据
      const dashboard = {
        overview: {
          totalUsers: 50,
          activeAgents: 5,
          runningWorkflows: 3,
          systemHealth: 'healthy'
        },
        charts: {
          userActivity: [],
          agentPerformance: [],
          workflowExecution: []
        },
        timestamp: new Date().toISOString()
      }

      res.json({
        success: true,
        data: dashboard
      })
    } catch (error) {
      logger.error('获取仪表板数据失败', {
        error: error.message,
        stack: error.stack,
        userId: req.user.id
      })
      errorHandler.handleError(error, res)
    }
  }
}

module.exports = new MonitoringController()