const dataService = require('../services/dataService')
const { cache } = require('../utils/redis')
const logger = require('../utils/logger')
const errorHandler = require('../middleware/errorHandler')
const converter = require('json-2-csv')
const PDFDocument = require('pdfkit')
const fs = require('fs').promises
const path = require('path')
const os = require('os')
const packageJson = require('../../package.json')

class StatisticsController {
  // 获取系统概览统计
  async getOverview(req, res) {
    try {
      const cacheKey = 'statistics:overview'
      let overview = await cache.get(cacheKey)

      if (!overview) {
        const now = new Date()
        const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)

        // 获取系统统计数据
        const systemStats = await dataService.getSystemStatistics()

        overview = {
          ...systemStats,
          system: {
            uptime: process.uptime(),
            version: packageJson.version,
            environment: process.env.NODE_ENV || 'development'
          }
        }

        await cache.set(cacheKey, overview, 300) // 缓存5分钟
      }

      logger.info('系统概览统计查询', {
        userId: req.user.id,
        action: 'GET_OVERVIEW_STATISTICS'
      })

      res.json({
        success: true,
        data: overview
      })
    } catch (error) {
      logger.error('获取系统概览统计失败', {
        error: error.message,
        stack: error.stack,
        userId: req.user.id
      })
      errorHandler.handleError(error, res)
    }
  }

  // 获取用户统计
  async getUserStatistics(req, res) {
    try {
      const { period = 'month', startDate, endDate } = req.query
      
      const dateRange = this.getDateRange(period, startDate, endDate)
      const cacheKey = `statistics:users:${period}:${dateRange.start.getTime()}:${dateRange.end.getTime()}`
      
      let statistics = await cache.get(cacheKey)

      if (!statistics) {
        // 基础统计
        const userStats = await dataService.getUserStatistics()

        // 时间序列数据
        const timeSeriesData = await this.getUserTimeSeriesData(dateRange, period)
        
        statistics = {
          ...userStats,
          newUsers: timeSeriesData.newUsers,
          activeUsers: timeSeriesData.activeUsers
        }

        await cache.set(cacheKey, statistics, 600) // 缓存10分钟
      }

      logger.info('用户统计查询', {
        userId: req.user.id,
        action: 'GET_USER_STATISTICS',
        period,
        dateRange: { startDate, endDate }
      })

      res.json({
        success: true,
        data: statistics
      })
    } catch (error) {
      logger.error('获取用户统计失败', {
        error: error.message,
        stack: error.stack,
        userId: req.user.id
      })
      errorHandler.handleError(error, res)
    }
  }

  // 获取Agent统计
  async getAgentStatistics(req, res) {
    try {
      const { period = 'month', startDate, endDate, userId } = req.query
      
      // 权限检查：非管理员只能查看自己的统计
      const targetUserId = req.user.role === 'admin' ? userId : req.user.id
      
      const dateRange = this.getDateRange(period, startDate, endDate)
      const cacheKey = `statistics:agents:${period}:${targetUserId || 'all'}:${dateRange.start.getTime()}`
      
      let statistics = await cache.get(cacheKey)

      if (!statistics) {
        const whereClause = {}
        if (targetUserId) {
          whereClause.createdBy = targetUserId
        }

        // 获取Agent统计数据
        const agentStats = await dataService.getAgentStatistics(targetUserId)

        // 使用统计
        const usageStats = await this.getAgentUsageStats(dateRange, targetUserId)
        
        // 分类统计
        const categoryStats = await this.getAgentCategoryStats(targetUserId)

        statistics = {
          ...agentStats,
          usage: usageStats,
          categories: categoryStats
        }

        await cache.set(cacheKey, statistics, 600)
      }

      logger.info('Agent统计查询', {
        userId: req.user.id,
        action: 'GET_AGENT_STATISTICS',
        targetUserId,
        period
      })

      res.json({
        success: true,
        data: statistics
      })
    } catch (error) {
      logger.error('获取Agent统计失败', {
        error: error.message,
        stack: error.stack,
        userId: req.user.id
      })
      errorHandler.handleError(error, res)
    }
  }

  // 获取工作流统计
  async getWorkflowStatistics(req, res) {
    try {
      const { period = 'month', startDate, endDate, userId } = req.query
      
      const targetUserId = req.user.role === 'admin' ? userId : req.user.id
      const dateRange = this.getDateRange(period, startDate, endDate)
      const cacheKey = `statistics:workflows:${period}:${targetUserId || 'all'}:${dateRange.start.getTime()}`
      
      let statistics = await cache.get(cacheKey)

      if (!statistics) {
        const whereClause = {}
        if (targetUserId) {
          whereClause.createdBy = targetUserId
        }

        // 获取工作流统计数据
        const workflowStats = await dataService.getWorkflowStatistics(targetUserId)

        // 执行统计
        const executionStats = await this.getWorkflowExecutionStats(dateRange, targetUserId)
        
        // 性能统计
        const performanceStats = await this.getWorkflowPerformanceStats(dateRange, targetUserId)

        statistics = {
          ...workflowStats,
          executions: executionStats,
          performance: performanceStats
        }

        await cache.set(cacheKey, statistics, 600)
      }

      logger.info('工作流统计查询', {
        userId: req.user.id,
        action: 'GET_WORKFLOW_STATISTICS',
        targetUserId,
        period
      })

      res.json({
        success: true,
        data: statistics
      })
    } catch (error) {
      logger.error('获取工作流统计失败', {
        error: error.message,
        stack: error.stack,
        userId: req.user.id
      })
      errorHandler.handleError(error, res)
    }
  }

  // 获取系统使用统计
  async getUsageStatistics(req, res) {
    try {
      const { period = 'month', startDate, endDate, metric } = req.query
      
      const dateRange = this.getDateRange(period, startDate, endDate)
      const cacheKey = `statistics:usage:${period}:${metric || 'all'}:${dateRange.start.getTime()}`
      
      let statistics = await cache.get(cacheKey)

      if (!statistics) {
        const stats = {}

        if (!metric || metric === 'requests') {
          stats.requests = await this.getRequestStats(dateRange)
        }

        if (!metric || metric === 'executions') {
          stats.executions = await this.getExecutionStats(dateRange)
        }

        if (!metric || metric === 'errors') {
          stats.errors = await this.getErrorStats(dateRange)
        }

        if (!metric || metric === 'performance') {
          stats.performance = await this.getSystemPerformanceStats(dateRange)
        }

        statistics = stats
        await cache.set(cacheKey, statistics, 300) // 缓存5分钟
      }

      logger.info('系统使用统计查询', {
        userId: req.user.id,
        action: 'GET_USAGE_STATISTICS',
        period,
        metric
      })

      res.json({
        success: true,
        data: statistics
      })
    } catch (error) {
      logger.error('获取系统使用统计失败', {
        error: error.message,
        stack: error.stack,
        userId: req.user.id
      })
      errorHandler.handleError(error, res)
    }
  }

  // 获取性能统计
  async getPerformanceStatistics(req, res) {
    try {
      const { period = 'day', startDate, endDate, component } = req.query
      
      const dateRange = this.getDateRange(period, startDate, endDate)
      const cacheKey = `statistics:performance:${period}:${component || 'all'}:${dateRange.start.getTime()}`
      
      let statistics = await cache.get(cacheKey)

      if (!statistics) {
        statistics = await this.getDetailedPerformanceStats(dateRange, component)
        await cache.set(cacheKey, statistics, 180) // 缓存3分钟
      }

      logger.info('性能统计查询', {
        userId: req.user.id,
        action: 'GET_PERFORMANCE_STATISTICS',
        period,
        component
      })

      res.json({
        success: true,
        data: statistics
      })
    } catch (error) {
      logger.error('获取性能统计失败', {
        error: error.message,
        stack: error.stack,
        userId: req.user.id
      })
      errorHandler.handleError(error, res)
    }
  }

  // 获取错误统计
  async getErrorStatistics(req, res) {
    try {
      const { period = 'day', startDate, endDate, level, component } = req.query
      
      const dateRange = this.getDateRange(period, startDate, endDate)
      const cacheKey = `statistics:errors:${period}:${level || 'all'}:${component || 'all'}:${dateRange.start.getTime()}`
      
      let statistics = await cache.get(cacheKey)

      if (!statistics) {
        const whereClause = {
          createdAt: {
            [Op.between]: [dateRange.start, dateRange.end]
          }
        }

        if (level) whereClause.level = level
        if (component) whereClause.component = component

        // 错误总数
        const totalErrors = await SystemLog.count({
          where: {
            ...whereClause,
            level: { [Op.in]: ['error', 'warn'] }
          }
        })

        // 按级别分组
        const errorsByLevel = await SystemLog.findAll({
          attributes: [
            'level',
            [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
          ],
          where: whereClause,
          group: ['level'],
          raw: true
        })

        // 按组件分组
        const errorsByComponent = await SystemLog.findAll({
          attributes: [
            'component',
            [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
          ],
          where: whereClause,
          group: ['component'],
          raw: true,
          limit: 10
        })

        // 时间序列数据
        const timeSeriesData = await this.getErrorTimeSeriesData(dateRange, period, whereClause)

        statistics = {
          total: totalErrors,
          byLevel: this.formatGroupedData(errorsByLevel),
          byComponent: this.formatGroupedData(errorsByComponent),
          timeSeries: timeSeriesData
        }

        await cache.set(cacheKey, statistics, 300)
      }

      logger.info('错误统计查询', {
        userId: req.user.id,
        action: 'GET_ERROR_STATISTICS',
        period,
        level,
        component
      })

      res.json({
        success: true,
        data: statistics
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

  // 获取统计报告列表
  async getReports(req, res) {
    try {
      const { page = 1, limit = 20, type } = req.query
      const offset = (page - 1) * limit

      const whereClause = {}
      if (type) {
        whereClause.type = type
      }

      const { count, rows: reports } = await StatisticsReport.findAndCountAll({
        where: whereClause,
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset,
        include: [{
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'email']
        }]
      })

      logger.info('统计报告列表查询', {
        userId: req.user.id,
        action: 'GET_REPORTS',
        filters: { type }
      })

      res.json({
        success: true,
        data: {
          reports,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: count,
            pages: Math.ceil(count / limit)
          }
        }
      })
    } catch (error) {
      logger.error('获取统计报告列表失败', {
        error: error.message,
        stack: error.stack,
        userId: req.user.id
      })
      errorHandler.handleError(error, res)
    }
  }

  // 生成统计报告
  async generateReport(req, res) {
    try {
      const {
        name,
        description,
        type,
        metrics,
        startDate,
        endDate,
        format = 'json',
        schedule
      } = req.body

      // 验证输入
      if (!name || !type || !metrics || metrics.length === 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: '报告名称、类型和指标不能为空'
          }
        })
      }

      // 生成报告数据
      const reportData = await this.generateReportData(metrics, startDate, endDate)
      
      // 创建报告记录
      const report = await StatisticsReport.create({
        name,
        description,
        type,
        metrics,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        format,
        data: reportData,
        schedule,
        status: 'completed',
        createdBy: req.user.id
      })

      logger.info('统计报告生成', {
        userId: req.user.id,
        action: 'GENERATE_REPORT',
        reportId: report.id,
        type,
        metrics
      })

      res.status(201).json({
        success: true,
        message: '报告生成成功',
        data: {
          id: report.id,
          name: report.name,
          type: report.type,
          status: report.status,
          createdAt: report.createdAt
        }
      })
    } catch (error) {
      logger.error('生成统计报告失败', {
        error: error.message,
        stack: error.stack,
        userId: req.user.id,
        requestBody: req.body
      })
      errorHandler.handleError(error, res)
    }
  }

  // 获取特定统计报告
  async getReport(req, res) {
    try {
      const { id } = req.params

      const report = await StatisticsReport.findByPk(id, {
        include: [{
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'email']
        }]
      })

      if (!report) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'REPORT_NOT_FOUND',
            message: '报告不存在'
          }
        })
      }

      logger.info('统计报告查询', {
        userId: req.user.id,
        action: 'GET_REPORT',
        reportId: id
      })

      res.json({
        success: true,
        data: report
      })
    } catch (error) {
      logger.error('获取统计报告失败', {
        error: error.message,
        stack: error.stack,
        userId: req.user.id,
        reportId: req.params.id
      })
      errorHandler.handleError(error, res)
    }
  }

  // 下载统计报告
  async downloadReport(req, res) {
    try {
      const { id } = req.params
      const { format = 'json' } = req.query

      const report = await StatisticsReport.findByPk(id)
      if (!report) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'REPORT_NOT_FOUND',
            message: '报告不存在'
          }
        })
      }

      let fileContent
      let contentType
      let filename

      switch (format) {
        case 'csv':
          fileContent = this.convertToCSV(report.data)
          contentType = 'text/csv'
          filename = `${report.name}_${Date.now()}.csv`
          break
        case 'pdf':
          fileContent = await this.convertToPDF(report)
          contentType = 'application/pdf'
          filename = `${report.name}_${Date.now()}.pdf`
          break
        default:
          fileContent = JSON.stringify(report.data, null, 2)
          contentType = 'application/json'
          filename = `${report.name}_${Date.now()}.json`
      }

      logger.info('统计报告下载', {
        userId: req.user.id,
        action: 'DOWNLOAD_REPORT',
        reportId: id,
        format
      })

      res.setHeader('Content-Type', contentType)
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
      res.send(fileContent)
    } catch (error) {
      logger.error('下载统计报告失败', {
        error: error.message,
        stack: error.stack,
        userId: req.user.id,
        reportId: req.params.id
      })
      errorHandler.handleError(error, res)
    }
  }

  /**
   * 预览报告HTML页面
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   */
  async previewReport(req, res) {
    try {
      const { id } = req.params

      const report = await StatisticsReport.findByPk(id)
      if (!report) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'REPORT_NOT_FOUND',
            message: '报告不存在'
          }
        })
      }

      // 生成HTML预览内容
      const htmlContent = this.generateHTMLPreview(report)

      logger.info('统计报告预览', {
        userId: req.user.id,
        action: 'PREVIEW_REPORT',
        reportId: id
      })

      res.setHeader('Content-Type', 'text/html; charset=utf-8')
      res.send(htmlContent)
    } catch (error) {
      logger.error('预览统计报告失败', {
        error: error.message,
        stack: error.stack,
        userId: req.user.id,
        reportId: req.params.id
      })
      errorHandler.handleError(error, res)
    }
  }

  // 导出统计数据
  async exportStatistics(req, res) {
    try {
      const {
        metrics,
        startDate,
        endDate,
        format = 'json',
        filters = {}
      } = req.body

      if (!metrics || metrics.length === 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: '请选择要导出的指标'
          }
        })
      }

      // 生成导出数据
      const exportData = await this.generateExportData(metrics, startDate, endDate, filters)
      
      let fileContent
      let contentType
      let filename

      switch (format) {
        case 'csv':
          fileContent = this.convertToCSV(exportData)
          contentType = 'text/csv'
          filename = `statistics_export_${Date.now()}.csv`
          break
        case 'excel':
          fileContent = await this.convertToExcel(exportData)
          contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          filename = `statistics_export_${Date.now()}.xlsx`
          break
        default:
          fileContent = JSON.stringify(exportData, null, 2)
          contentType = 'application/json'
          filename = `statistics_export_${Date.now()}.json`
      }

      logger.info('统计数据导出', {
        userId: req.user.id,
        action: 'EXPORT_STATISTICS',
        metrics,
        format,
        filters
      })

      res.setHeader('Content-Type', contentType)
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
      res.send(fileContent)
    } catch (error) {
      logger.error('导出统计数据失败', {
        error: error.message,
        stack: error.stack,
        userId: req.user.id,
        requestBody: req.body
      })
      errorHandler.handleError(error, res)
    }
  }

  // 辅助方法
  getDateRange(period, startDate, endDate) {
    const now = new Date()
    let start, end

    if (startDate && endDate) {
      start = new Date(startDate)
      end = new Date(endDate)
    } else {
      switch (period) {
        case 'day':
          start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          end = new Date(start.getTime() + 24 * 60 * 60 * 1000)
          break
        case 'week':
          start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          end = now
          break
        case 'month':
          start = new Date(now.getFullYear(), now.getMonth(), 1)
          end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
          break
        case 'year':
          start = new Date(now.getFullYear(), 0, 1)
          end = new Date(now.getFullYear(), 11, 31)
          break
        default:
          start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          end = now
      }
    }

    return { start, end }
  }

  async getUserTimeSeriesData(dateRange, period) {
    // TODO: 实现用户时间序列数据获取
    return {
      newUsers: [],
      activeUsers: []
    }
  }

  async getAgentUsageStats(dateRange, userId) {
    // TODO: 实现Agent使用统计
    return {
      totalUsage: 0,
      averageUsage: 0,
      topTemplates: []
    }
  }

  async getAgentCategoryStats(userId) {
    // TODO: 实现Agent分类统计
    return {}
  }

  async getWorkflowExecutionStats(dateRange, userId) {
    // TODO: 实现工作流执行统计
    return {
      total: 0,
      successful: 0,
      failed: 0,
      successRate: 0
    }
  }

  async getWorkflowPerformanceStats(dateRange, userId) {
    // TODO: 实现工作流性能统计
    return {
      averageExecutionTime: 0,
      fastestExecution: 0,
      slowestExecution: 0
    }
  }

  async getRequestStats(dateRange) {
    // TODO: 实现请求统计
    return {
      total: 0,
      successful: 0,
      failed: 0,
      averageResponseTime: 0
    }
  }

  async getExecutionStats(dateRange) {
    // TODO: 实现执行统计
    return {
      total: 0,
      successful: 0,
      failed: 0,
      averageExecutionTime: 0
    }
  }

  async getErrorStats(dateRange) {
    // TODO: 实现错误统计
    return {
      total: 0,
      byType: {},
      byComponent: {}
    }
  }

  async getSystemPerformanceStats(dateRange) {
    // TODO: 实现系统性能统计
    return {
      cpu: { average: 0, peak: 0 },
      memory: { average: 0, peak: 0 },
      database: { connections: 0, queryTime: 0 },
      cache: { hitRate: 0, memory: 0 }
    }
  }

  async getDetailedPerformanceStats(dateRange, component) {
    // TODO: 实现详细性能统计
    return {}
  }

  async getErrorTimeSeriesData(dateRange, period, whereClause) {
    // TODO: 实现错误时间序列数据
    return []
  }

  formatGroupedData(data) {
    const result = {}
    data.forEach(item => {
      const key = Object.keys(item)[0]
      result[item[key]] = parseInt(item.count)
    })
    return result
  }

  async generateReportData(metrics, startDate, endDate) {
    // TODO: 实现报告数据生成
    return {}
  }

  async generateExportData(metrics, startDate, endDate, filters) {
    // TODO: 实现导出数据生成
    return {}
  }

  convertToCSV(data) {
    try {
      const parser = new Parser()
      return parser.parse(data)
    } catch (error) {
      return 'Error converting to CSV'
    }
  }

  /**
   * 将报告转换为PDF格式
   * @param {Object} report 报告对象
   * @returns {Buffer} PDF文件缓冲区
   */
  async convertToPDF(report) {
    try {
      const doc = new PDFDocument()
      const chunks = []
      
      doc.on('data', chunk => chunks.push(chunk))
      
      return new Promise((resolve, reject) => {
        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(chunks)
          resolve(pdfBuffer)
        })
        
        doc.on('error', reject)
        
        // 添加标题
        doc.fontSize(20).text(report.name, 50, 50)
        doc.fontSize(12).text(`生成时间: ${new Date(report.createdAt).toLocaleString('zh-CN')}`, 50, 80)
        
        if (report.description) {
          doc.text(`描述: ${report.description}`, 50, 100)
        }
        
        // 添加报告数据
        let yPosition = 140
        doc.fontSize(14).text('报告数据:', 50, yPosition)
        yPosition += 30
        
        if (report.data && typeof report.data === 'object') {
          const dataText = JSON.stringify(report.data, null, 2)
          doc.fontSize(10).text(dataText, 50, yPosition, {
            width: 500,
            height: 600
          })
        }
        
        doc.end()
      })
    } catch (error) {
      logger.error('PDF转换失败', { error: error.message, reportId: report.id })
      throw new Error('PDF转换失败')
    }
  }

  /**
   * 将数据转换为Excel格式
   * @param {Object} data 数据对象
   * @returns {Buffer} Excel文件缓冲区
   */
  async convertToExcel(data) {
    // TODO: 实现Excel转换，需要安装xlsx库
    return Buffer.from('Excel content')
  }

  /**
   * 生成HTML预览页面
   * @param {Object} report 报告对象
   * @returns {String} HTML内容
   */
  generateHTMLPreview(report) {
    const htmlTemplate = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${report.name} - 报告预览</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            border-bottom: 2px solid #1890ff;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .title {
            color: #1890ff;
            font-size: 28px;
            font-weight: bold;
            margin: 0;
        }
        .meta {
            color: #666;
            margin-top: 10px;
        }
        .description {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 4px;
            margin: 20px 0;
            border-left: 4px solid #1890ff;
        }
        .data-section {
            margin-top: 30px;
        }
        .section-title {
            font-size: 20px;
            color: #333;
            margin-bottom: 15px;
            border-bottom: 1px solid #e8e8e8;
            padding-bottom: 10px;
        }
        .data-content {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 4px;
            overflow-x: auto;
        }
        pre {
            margin: 0;
            white-space: pre-wrap;
            word-wrap: break-word;
        }
        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin: 20px 0;
        }
        .metric-card {
            background: white;
            border: 1px solid #e8e8e8;
            border-radius: 6px;
            padding: 20px;
            text-align: center;
        }
        .metric-value {
            font-size: 24px;
            font-weight: bold;
            color: #1890ff;
        }
        .metric-label {
            color: #666;
            margin-top: 5px;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e8e8e8;
            text-align: center;
            color: #666;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 class="title">${report.name}</h1>
            <div class="meta">
                <p>生成时间: ${new Date(report.createdAt).toLocaleString('zh-CN')}</p>
                <p>报告类型: ${report.type}</p>
                <p>状态: ${report.status}</p>
            </div>
        </div>
        
        ${report.description ? `
        <div class="description">
            <strong>描述:</strong> ${report.description}
        </div>
        ` : ''}
        
        <div class="data-section">
            <h2 class="section-title">报告数据</h2>
            ${this.formatReportDataForHTML(report.data)}
        </div>
        
        <div class="footer">
            <p>由 EFIAgent 系统生成 | ${new Date().toLocaleString('zh-CN')}</p>
        </div>
    </div>
</body>
</html>`
    
    return htmlTemplate
  }

  /**
   * 格式化报告数据为HTML
   * @param {Object} data 报告数据
   * @returns {String} 格式化的HTML
   */
  formatReportDataForHTML(data) {
    if (!data) return '<p>暂无数据</p>'
    
    try {
      // 如果数据包含指标，创建指标卡片
      if (data.metrics && Array.isArray(data.metrics)) {
        let metricsHTML = '<div class="metrics-grid">'
        data.metrics.forEach(metric => {
          metricsHTML += `
            <div class="metric-card">
              <div class="metric-value">${metric.value || 'N/A'}</div>
              <div class="metric-label">${metric.name || metric.label || 'Unknown'}</div>
            </div>
          `
        })
        metricsHTML += '</div>'
        
        // 添加原始数据
        metricsHTML += `
          <div class="data-content">
            <h3>详细数据</h3>
            <pre>${JSON.stringify(data, null, 2)}</pre>
          </div>
        `
        
        return metricsHTML
      }
      
      // 默认显示JSON格式
      return `
        <div class="data-content">
          <pre>${JSON.stringify(data, null, 2)}</pre>
        </div>
      `
    } catch (error) {
      return `<p>数据格式错误: ${error.message}</p>`
    }
  }
}

module.exports = new StatisticsController()