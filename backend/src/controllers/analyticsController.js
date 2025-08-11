/**
 * 分析洞察控制器
 * 提供性能分析、使用分析、趋势分析的API接口
 * 基于EFIAgent产品设计文档实现
 */

const dataService = require('../services/dataService');
const analyticsService = require('../services/analyticsService');
const { cache } = require('../utils/redis');
const logger = require('../utils/logger');
const errorHandler = require('../middleware/errorHandler');
const { validationResult } = require('express-validator');

class AnalyticsController {
  /**
   * 获取性能分析数据
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   */
  async getPerformanceAnalysis(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '参数验证失败',
            details: errors.array()
          }
        });
      }

      const { 
        timeRange = '7d', 
        startDate, 
        endDate, 
        agentId, 
        nodeId,
        metricTypes = ['response_time', 'throughput', 'success_rate', 'error_rate', 'cpu_usage', 'memory_usage']
      } = req.query;

      // 构建缓存键
      const cacheKey = `analytics:performance:${timeRange}:${agentId || 'all'}:${nodeId || 'all'}:${metricTypes.join(',')}`;
      
      // 尝试从缓存获取数据
      let performanceData = await cache.get(cacheKey);
      
      if (!performanceData) {
        // 获取时间范围
        const dateRange = this.getDateRange(timeRange, startDate, endDate);
        
        // 获取性能指标数据
        const metricsData = await analyticsService.getPerformanceMetrics({
          startDate: dateRange.start,
          endDate: dateRange.end,
          agentId,
          nodeId,
          metricTypes
        });
        
        // 获取系统性能数据
        const systemPerformance = await analyticsService.getSystemPerformanceMetrics({
          startDate: dateRange.start,
          endDate: dateRange.end,
          nodeId
        });
        
        // 获取Agent性能数据
        const agentPerformance = await analyticsService.getAgentPerformanceMetrics({
          startDate: dateRange.start,
          endDate: dateRange.end,
          agentId
        });
        
        // 计算性能统计
        const performanceStats = await analyticsService.calculatePerformanceStats(metricsData);
        
        // 性能趋势分析
        const trendAnalysis = await analyticsService.analyzePerformanceTrends(metricsData);
        
        // 性能异常检测
        const anomalies = await analyticsService.detectPerformanceAnomalies(metricsData);
        
        performanceData = {
          overview: performanceStats,
          metrics: metricsData,
          systemPerformance,
          agentPerformance,
          trends: trendAnalysis,
          anomalies,
          timeRange: dateRange
        };
        
        // 缓存结果（5分钟）
        await cache.set(cacheKey, performanceData, 300);
      }
      
      logger.info('性能分析数据查询', {
        userId: req.user.id,
        action: 'GET_PERFORMANCE_ANALYSIS',
        timeRange,
        agentId,
        nodeId
      });
      
      res.json({
        success: true,
        data: performanceData
      });
      
    } catch (error) {
      logger.error('获取性能分析数据失败', {
        error: error.message,
        stack: error.stack,
        userId: req.user.id
      });
      errorHandler.handleError(error, res);
    }
  }

  /**
   * 获取使用分析数据
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   */
  async getUsageAnalysis(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '参数验证失败',
            details: errors.array()
          }
        });
      }

      const { 
        timeRange = '30d', 
        startDate, 
        endDate, 
        userId, 
        agentId,
        granularity = 'day'
      } = req.query;

      // 权限检查：非管理员只能查看自己的数据
      const targetUserId = req.user.role === 'admin' ? userId : req.user.id;
      
      const cacheKey = `analytics:usage:${timeRange}:${targetUserId || 'all'}:${agentId || 'all'}:${granularity}`;
      
      let usageData = await cache.get(cacheKey);
      
      if (!usageData) {
        const dateRange = this.getDateRange(timeRange, startDate, endDate);
        
        // 获取用户使用数据
        const userUsage = await analyticsService.getUserUsageData({
          startDate: dateRange.start,
          endDate: dateRange.end,
          userId: targetUserId,
          granularity
        });
        
        // 获取Agent使用数据
        const agentUsage = await analyticsService.getAgentUsageData({
          startDate: dateRange.start,
          endDate: dateRange.end,
          agentId,
          userId: targetUserId,
          granularity
        });
        
        // 获取工作流使用数据
        const workflowUsage = await analyticsService.getWorkflowUsageData({
          startDate: dateRange.start,
          endDate: dateRange.end,
          userId: targetUserId,
          granularity
        });
        
        // 获取API使用数据
        const apiUsage = await analyticsService.getApiUsageData({
          startDate: dateRange.start,
          endDate: dateRange.end,
          userId: targetUserId,
          granularity
        });
        
        // 计算使用统计
        const usageStats = await analyticsService.calculateUsageStats({
          userUsage,
          agentUsage,
          workflowUsage,
          apiUsage
        });
        
        // 用户行为分析
        const behaviorAnalysis = await analyticsService.analyzeUserBehavior({
          userId: targetUserId,
          startDate: dateRange.start,
          endDate: dateRange.end
        });
        
        // 使用趋势分析
        const usageTrends = await analyticsService.analyzeUsageTrends({
          userUsage,
          agentUsage,
          workflowUsage
        });
        
        usageData = {
          overview: usageStats,
          userUsage,
          agentUsage,
          workflowUsage,
          apiUsage,
          behaviorAnalysis,
          trends: usageTrends,
          timeRange: dateRange
        };
        
        // 缓存结果（10分钟）
        await cache.set(cacheKey, usageData, 600);
      }
      
      logger.info('使用分析数据查询', {
        userId: req.user.id,
        action: 'GET_USAGE_ANALYSIS',
        timeRange,
        targetUserId,
        agentId
      });
      
      res.json({
        success: true,
        data: usageData
      });
      
    } catch (error) {
      logger.error('获取使用分析数据失败', {
        error: error.message,
        stack: error.stack,
        userId: req.user.id
      });
      errorHandler.handleError(error, res);
    }
  }

  /**
   * 获取趋势分析数据
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   */
  async getTrendAnalysis(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '参数验证失败',
            details: errors.array()
          }
        });
      }

      const { 
        timeRange = '90d', 
        startDate, 
        endDate, 
        metrics = ['user_activity', 'agent_executions', 'system_performance'],
        analysisTypes = ['trend', 'seasonality', 'anomaly', 'prediction'],
        predictionDays = 30
      } = req.query;

      const cacheKey = `analytics:trend:${timeRange}:${metrics.join(',')}:${analysisTypes.join(',')}:${predictionDays}`;
      
      let trendData = await cache.get(cacheKey);
      
      if (!trendData) {
        const dateRange = this.getDateRange(timeRange, startDate, endDate);
        
        // 获取历史数据
        const historicalData = await analyticsService.getHistoricalData({
          startDate: dateRange.start,
          endDate: dateRange.end,
          metrics
        });
        
        // 趋势分析
        const trendAnalysis = await analyticsService.performTrendAnalysis({
          data: historicalData,
          metrics,
          analysisTypes
        });
        
        // 季节性分析
        const seasonalityAnalysis = await analyticsService.performSeasonalityAnalysis({
          data: historicalData,
          metrics
        });
        
        // 异常检测
        const anomalyDetection = await analyticsService.performAnomalyDetection({
          data: historicalData,
          metrics
        });
        
        // 预测分析
        const predictions = await analyticsService.performPredictionAnalysis({
          data: historicalData,
          metrics,
          predictionDays
        });
        
        // 相关性分析
        const correlationAnalysis = await analyticsService.performCorrelationAnalysis({
          data: historicalData,
          metrics
        });
        
        // 影响因子分析
        const impactFactors = await analyticsService.analyzeImpactFactors({
          data: historicalData,
          metrics
        });
        
        trendData = {
          overview: {
            dataPoints: historicalData.length,
            timeSpan: dateRange,
            metricsAnalyzed: metrics.length,
            analysisTypes
          },
          trends: trendAnalysis,
          seasonality: seasonalityAnalysis,
          anomalies: anomalyDetection,
          predictions,
          correlations: correlationAnalysis,
          impactFactors,
          historicalData
        };
        
        // 缓存结果（30分钟）
        await cache.set(cacheKey, trendData, 1800);
      }
      
      logger.info('趋势分析数据查询', {
        userId: req.user.id,
        action: 'GET_TREND_ANALYSIS',
        timeRange,
        metrics,
        analysisTypes
      });
      
      res.json({
        success: true,
        data: trendData
      });
      
    } catch (error) {
      logger.error('获取趋势分析数据失败', {
        error: error.message,
        stack: error.stack,
        userId: req.user.id
      });
      errorHandler.handleError(error, res);
    }
  }

  /**
   * 获取实时分析数据
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   */
  async getRealtimeAnalysis(req, res) {
    try {
      const { 
        metrics = ['active_users', 'agent_executions', 'system_load'],
        interval = '1m'
      } = req.query;

      // 获取实时数据（不缓存）
      const realtimeData = await analyticsService.getRealtimeMetrics({
        metrics,
        interval
      });
      
      // 实时异常检测
      const realtimeAnomalies = await analyticsService.detectRealtimeAnomalies({
        data: realtimeData,
        metrics
      });
      
      // 实时告警检查
      const alerts = await analyticsService.checkRealtimeAlerts({
        data: realtimeData,
        metrics
      });
      
      logger.info('实时分析数据查询', {
        userId: req.user.id,
        action: 'GET_REALTIME_ANALYSIS',
        metrics
      });
      
      res.json({
        success: true,
        data: {
          timestamp: new Date(),
          metrics: realtimeData,
          anomalies: realtimeAnomalies,
          alerts
        }
      });
      
    } catch (error) {
      logger.error('获取实时分析数据失败', {
        error: error.message,
        stack: error.stack,
        userId: req.user.id
      });
      errorHandler.handleError(error, res);
    }
  }

  /**
   * 生成分析报告
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   */
  async generateAnalysisReport(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '参数验证失败',
            details: errors.array()
          }
        });
      }

      const { 
        reportType = 'comprehensive',
        timeRange = '30d',
        startDate,
        endDate,
        modules = ['performance', 'usage', 'trend'],
        format = 'json',
        includeCharts = true
      } = req.body;

      const dateRange = this.getDateRange(timeRange, startDate, endDate);
      
      // 生成报告
      const report = await analyticsService.generateAnalysisReport({
        reportType,
        dateRange,
        modules,
        format,
        includeCharts,
        userId: req.user.id
      });
      
      logger.info('分析报告生成', {
        userId: req.user.id,
        action: 'GENERATE_ANALYSIS_REPORT',
        reportType,
        modules,
        format
      });
      
      res.json({
        success: true,
        data: {
          reportId: report.id,
          reportUrl: report.url,
          generatedAt: report.createdAt,
          format,
          modules
        }
      });
      
    } catch (error) {
      logger.error('生成分析报告失败', {
        error: error.message,
        stack: error.stack,
        userId: req.user.id
      });
      errorHandler.handleError(error, res);
    }
  }

  /**
   * 获取分析配置
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   */
  async getAnalysisConfig(req, res) {
    try {
      const config = await analyticsService.getAnalysisConfig(req.user.id);
      
      res.json({
        success: true,
        data: config
      });
      
    } catch (error) {
      logger.error('获取分析配置失败', {
        error: error.message,
        stack: error.stack,
        userId: req.user.id
      });
      errorHandler.handleError(error, res);
    }
  }

  /**
   * 更新分析配置
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   */
  async updateAnalysisConfig(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '参数验证失败',
            details: errors.array()
          }
        });
      }

      const config = await analyticsService.updateAnalysisConfig(
        req.user.id,
        req.body
      );
      
      logger.info('分析配置更新', {
        userId: req.user.id,
        action: 'UPDATE_ANALYSIS_CONFIG'
      });
      
      res.json({
        success: true,
        data: config
      });
      
    } catch (error) {
      logger.error('更新分析配置失败', {
        error: error.message,
        stack: error.stack,
        userId: req.user.id
      });
      errorHandler.handleError(error, res);
    }
  }

  /**
   * 获取时间范围
   * @param {string} period - 时间周期
   * @param {string} startDate - 开始日期
   * @param {string} endDate - 结束日期
   * @returns {Object} 时间范围对象
   */
  getDateRange(period, startDate, endDate) {
    const now = new Date();
    let start, end;

    if (startDate && endDate) {
      start = new Date(startDate);
      end = new Date(endDate);
    } else {
      end = now;
      switch (period) {
        case '1h':
          start = new Date(now.getTime() - 60 * 60 * 1000);
          break;
        case '6h':
          start = new Date(now.getTime() - 6 * 60 * 60 * 1000);
          break;
        case '24h':
        case '1d':
          start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case '1y':
          start = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        default:
          start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      }
    }

    return { start, end };
  }
}

module.exports = new AnalyticsController();