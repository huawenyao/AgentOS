/**
 * 分析洞察服务层
 * 实现性能分析、使用分析、趋势分析的核心业务逻辑
 * 基于EFIAgent产品设计文档实现
 */

const db = require('../models');
const { Op, Sequelize } = require('sequelize');
const moment = require('moment');
const mathjs = require('mathjs');
const logger = require('../utils/logger');
const { cache } = require('../utils/redis');

class AnalyticsService {
  /**
   * 获取性能指标数据
   * @param {Object} params - 查询参数
   * @returns {Object} 性能指标数据
   */
  async getPerformanceMetrics(params) {
    const { startDate, endDate, agentId, nodeId, metricTypes } = params;
    
    try {
      const whereClause = {
        timestamp: {
          [Op.between]: [startDate, endDate]
        }
      };
      
      if (agentId) whereClause.agentId = agentId;
      if (nodeId) whereClause.nodeId = nodeId;
      if (metricTypes && metricTypes.length > 0) {
        whereClause.metricType = { [Op.in]: metricTypes };
      }
      
      const metrics = await db.PerformanceMetric.findAll({
        where: whereClause,
        order: [['timestamp', 'ASC']],
        attributes: [
          'id', 'timestamp', 'metricType', 'value', 'unit',
          'agentId', 'nodeId', 'tags', 'metadata'
        ]
      });
      
      // 按指标类型分组
      const groupedMetrics = this.groupMetricsByType(metrics);
      
      // 计算聚合统计
      const aggregatedData = await this.calculateMetricAggregations(groupedMetrics, params);
      
      return {
        raw: metrics,
        grouped: groupedMetrics,
        aggregated: aggregatedData,
        summary: this.generateMetricsSummary(groupedMetrics)
      };
      
    } catch (error) {
      logger.error('获取性能指标数据失败', { error: error.message, params });
      throw error;
    }
  }

  /**
   * 获取系统性能指标
   * @param {Object} params - 查询参数
   * @returns {Object} 系统性能数据
   */
  async getSystemPerformanceMetrics(params) {
    const { startDate, endDate, nodeId } = params;
    
    try {
      const whereClause = {
        timestamp: {
          [Op.between]: [startDate, endDate]
        }
      };
      
      if (nodeId) whereClause.nodeId = nodeId;
      
      const systemMetrics = await db.SystemMetric.findAll({
        where: whereClause,
        order: [['timestamp', 'ASC']],
        attributes: [
          'timestamp', 'cpuUsage', 'memoryUsage', 'diskUsage',
          'networkIn', 'networkOut', 'loadAverage', 'nodeId'
        ]
      });
      
      return {
        metrics: systemMetrics,
        summary: this.calculateSystemMetricsSummary(systemMetrics)
      };
      
    } catch (error) {
      logger.error('获取系统性能指标失败', { error: error.message, params });
      throw error;
    }
  }

  /**
   * 获取Agent性能指标
   * @param {Object} params - 查询参数
   * @returns {Object} Agent性能数据
   */
  async getAgentPerformanceMetrics(params) {
    const { startDate, endDate, agentId } = params;
    
    try {
      const whereClause = {
        createdAt: {
          [Op.between]: [startDate, endDate]
        }
      };
      
      if (agentId) whereClause.agentId = agentId;
      
      // 获取Agent执行记录
      const executions = await db.AgentExecution.findAll({
        where: whereClause,
        include: [
          {
            model: db.Agent,
            attributes: ['id', 'name', 'type', 'status']
          }
        ],
        attributes: [
          'id', 'agentId', 'status', 'startTime', 'endTime',
          'duration', 'inputTokens', 'outputTokens', 'cost',
          'errorMessage', 'metadata'
        ],
        order: [['startTime', 'ASC']]
      });
      
      // 计算Agent性能统计
      const agentStats = this.calculateAgentPerformanceStats(executions);
      
      return {
        executions,
        statistics: agentStats
      };
      
    } catch (error) {
      logger.error('获取Agent性能指标失败', { error: error.message, params });
      throw error;
    }
  }

  /**
   * 计算性能统计
   * @param {Array} metricsData - 指标数据
   * @returns {Object} 性能统计结果
   */
  async calculatePerformanceStats(metricsData) {
    try {
      const stats = {};
      
      if (metricsData.grouped) {
        for (const [metricType, values] of Object.entries(metricsData.grouped)) {
          const numericValues = values.map(v => parseFloat(v.value)).filter(v => !isNaN(v));
          
          if (numericValues.length > 0) {
            stats[metricType] = {
              count: numericValues.length,
              min: Math.min(...numericValues),
              max: Math.max(...numericValues),
              avg: numericValues.reduce((a, b) => a + b, 0) / numericValues.length,
              median: this.calculateMedian(numericValues),
              p95: this.calculatePercentile(numericValues, 95),
              p99: this.calculatePercentile(numericValues, 99),
              stdDev: this.calculateStandardDeviation(numericValues)
            };
          }
        }
      }
      
      return stats;
      
    } catch (error) {
      logger.error('计算性能统计失败', { error: error.message });
      throw error;
    }
  }

  /**
   * 分析性能趋势
   * @param {Object} metricsData - 指标数据
   * @returns {Object} 趋势分析结果
   */
  async analyzePerformanceTrends(metricsData) {
    try {
      const trends = {};
      
      if (metricsData.grouped) {
        for (const [metricType, values] of Object.entries(metricsData.grouped)) {
          const timeSeriesData = values.map(v => ({
            timestamp: new Date(v.timestamp),
            value: parseFloat(v.value)
          })).filter(v => !isNaN(v.value));
          
          if (timeSeriesData.length > 1) {
            trends[metricType] = {
              direction: this.calculateTrendDirection(timeSeriesData),
              slope: this.calculateTrendSlope(timeSeriesData),
              correlation: this.calculateTrendCorrelation(timeSeriesData),
              volatility: this.calculateVolatility(timeSeriesData),
              changeRate: this.calculateChangeRate(timeSeriesData)
            };
          }
        }
      }
      
      return trends;
      
    } catch (error) {
      logger.error('分析性能趋势失败', { error: error.message });
      throw error;
    }
  }

  /**
   * 检测性能异常
   * @param {Object} metricsData - 指标数据
   * @returns {Array} 异常检测结果
   */
  async detectPerformanceAnomalies(metricsData) {
    try {
      const anomalies = [];
      
      if (metricsData.grouped) {
        for (const [metricType, values] of Object.entries(metricsData.grouped)) {
          const numericValues = values.map(v => parseFloat(v.value)).filter(v => !isNaN(v));
          
          if (numericValues.length > 10) {
            const anomalyPoints = this.detectAnomaliesUsingIQR(values, numericValues);
            anomalies.push(...anomalyPoints.map(point => ({
              ...point,
              metricType,
              detectionMethod: 'IQR'
            })));
            
            // Z-Score异常检测
            const zScoreAnomalies = this.detectAnomaliesUsingZScore(values, numericValues);
            anomalies.push(...zScoreAnomalies.map(point => ({
              ...point,
              metricType,
              detectionMethod: 'Z-Score'
            })));
          }
        }
      }
      
      return anomalies;
      
    } catch (error) {
      logger.error('检测性能异常失败', { error: error.message });
      throw error;
    }
  }

  /**
   * 获取用户使用数据
   * @param {Object} params - 查询参数
   * @returns {Object} 用户使用数据
   */
  async getUserUsageData(params) {
    const { startDate, endDate, userId, granularity } = params;
    
    try {
      const whereClause = {
        createdAt: {
          [Op.between]: [startDate, endDate]
        }
      };
      
      if (userId) whereClause.userId = userId;
      
      // 获取用户活动记录
      const userActivities = await db.UserActivity.findAll({
        where: whereClause,
        attributes: [
          'id', 'userId', 'action', 'resource', 'timestamp',
          'duration', 'metadata', 'ipAddress', 'userAgent'
        ],
        include: [
          {
            model: db.User,
            attributes: ['id', 'username', 'email', 'role']
          }
        ],
        order: [['timestamp', 'ASC']]
      });
      
      // 按时间粒度聚合数据
      const aggregatedData = this.aggregateDataByGranularity(userActivities, granularity);
      
      // 计算用户使用统计
      const usageStats = this.calculateUserUsageStats(userActivities);
      
      return {
        activities: userActivities,
        aggregated: aggregatedData,
        statistics: usageStats
      };
      
    } catch (error) {
      logger.error('获取用户使用数据失败', { error: error.message, params });
      throw error;
    }
  }

  /**
   * 获取Agent使用数据
   * @param {Object} params - 查询参数
   * @returns {Object} Agent使用数据
   */
  async getAgentUsageData(params) {
    const { startDate, endDate, agentId, userId, granularity } = params;
    
    try {
      const whereClause = {
        createdAt: {
          [Op.between]: [startDate, endDate]
        }
      };
      
      if (agentId) whereClause.agentId = agentId;
      if (userId) whereClause.userId = userId;
      
      // 获取Agent执行记录
      const agentExecutions = await db.AgentExecution.findAll({
        where: whereClause,
        include: [
          {
            model: db.Agent,
            attributes: ['id', 'name', 'type', 'category']
          },
          {
            model: db.User,
            attributes: ['id', 'username', 'role']
          }
        ],
        attributes: [
          'id', 'agentId', 'userId', 'status', 'startTime', 'endTime',
          'duration', 'inputTokens', 'outputTokens', 'cost', 'metadata'
        ],
        order: [['startTime', 'ASC']]
      });
      
      // 按时间粒度聚合数据
      const aggregatedData = this.aggregateDataByGranularity(agentExecutions, granularity, 'startTime');
      
      // 计算Agent使用统计
      const usageStats = this.calculateAgentUsageStats(agentExecutions);
      
      return {
        executions: agentExecutions,
        aggregated: aggregatedData,
        statistics: usageStats
      };
      
    } catch (error) {
      logger.error('获取Agent使用数据失败', { error: error.message, params });
      throw error;
    }
  }

  /**
   * 获取工作流使用数据
   * @param {Object} params - 查询参数
   * @returns {Object} 工作流使用数据
   */
  async getWorkflowUsageData(params) {
    const { startDate, endDate, userId, granularity } = params;
    
    try {
      const whereClause = {
        createdAt: {
          [Op.between]: [startDate, endDate]
        }
      };
      
      if (userId) whereClause.userId = userId;
      
      // 获取工作流执行记录
      const workflowExecutions = await db.WorkflowExecution.findAll({
        where: whereClause,
        include: [
          {
            model: db.Workflow,
            attributes: ['id', 'name', 'type', 'category']
          },
          {
            model: db.User,
            attributes: ['id', 'username', 'role']
          }
        ],
        attributes: [
          'id', 'workflowId', 'userId', 'status', 'startTime', 'endTime',
          'duration', 'stepCount', 'successSteps', 'failedSteps', 'metadata'
        ],
        order: [['startTime', 'ASC']]
      });
      
      // 按时间粒度聚合数据
      const aggregatedData = this.aggregateDataByGranularity(workflowExecutions, granularity, 'startTime');
      
      // 计算工作流使用统计
      const usageStats = this.calculateWorkflowUsageStats(workflowExecutions);
      
      return {
        executions: workflowExecutions,
        aggregated: aggregatedData,
        statistics: usageStats
      };
      
    } catch (error) {
      logger.error('获取工作流使用数据失败', { error: error.message, params });
      throw error;
    }
  }

  /**
   * 获取API使用数据
   * @param {Object} params - 查询参数
   * @returns {Object} API使用数据
   */
  async getApiUsageData(params) {
    const { startDate, endDate, userId, granularity } = params;
    
    try {
      const whereClause = {
        timestamp: {
          [Op.between]: [startDate, endDate]
        }
      };
      
      if (userId) whereClause.userId = userId;
      
      // 获取API调用记录
      const apiCalls = await db.ApiCall.findAll({
        where: whereClause,
        attributes: [
          'id', 'userId', 'endpoint', 'method', 'statusCode',
          'responseTime', 'requestSize', 'responseSize',
          'timestamp', 'userAgent', 'ipAddress'
        ],
        order: [['timestamp', 'ASC']]
      });
      
      // 按时间粒度聚合数据
      const aggregatedData = this.aggregateDataByGranularity(apiCalls, granularity, 'timestamp');
      
      // 计算API使用统计
      const usageStats = this.calculateApiUsageStats(apiCalls);
      
      return {
        calls: apiCalls,
        aggregated: aggregatedData,
        statistics: usageStats
      };
      
    } catch (error) {
      logger.error('获取API使用数据失败', { error: error.message, params });
      throw error;
    }
  }

  /**
   * 计算使用统计
   * @param {Object} usageData - 使用数据
   * @returns {Object} 使用统计结果
   */
  async calculateUsageStats(usageData) {
    try {
      const { userUsage, agentUsage, workflowUsage, apiUsage } = usageData;
      
      const stats = {
        overview: {
          totalUsers: userUsage.statistics.uniqueUsers || 0,
          totalSessions: userUsage.statistics.totalSessions || 0,
          totalAgentExecutions: agentUsage.statistics.totalExecutions || 0,
          totalWorkflowExecutions: workflowUsage.statistics.totalExecutions || 0,
          totalApiCalls: apiUsage.statistics.totalCalls || 0
        },
        userEngagement: {
          avgSessionDuration: userUsage.statistics.avgSessionDuration || 0,
          avgActionsPerSession: userUsage.statistics.avgActionsPerSession || 0,
          returnUserRate: userUsage.statistics.returnUserRate || 0
        },
        agentPerformance: {
          avgExecutionTime: agentUsage.statistics.avgDuration || 0,
          successRate: agentUsage.statistics.successRate || 0,
          avgCost: agentUsage.statistics.avgCost || 0
        },
        workflowEfficiency: {
          avgWorkflowDuration: workflowUsage.statistics.avgDuration || 0,
          workflowSuccessRate: workflowUsage.statistics.successRate || 0,
          avgStepsPerWorkflow: workflowUsage.statistics.avgSteps || 0
        },
        apiPerformance: {
          avgResponseTime: apiUsage.statistics.avgResponseTime || 0,
          apiSuccessRate: apiUsage.statistics.successRate || 0,
          requestsPerMinute: apiUsage.statistics.requestsPerMinute || 0
        }
      };
      
      return stats;
      
    } catch (error) {
      logger.error('计算使用统计失败', { error: error.message });
      throw error;
    }
  }

  /**
   * 分析用户行为
   * @param {Object} params - 查询参数
   * @returns {Object} 用户行为分析结果
   */
  async analyzeUserBehavior(params) {
    const { userId, startDate, endDate } = params;
    
    try {
      // 获取用户行为数据
      const userActivities = await this.getUserActivitiesForBehaviorAnalysis({
        userId,
        startDate,
        endDate
      });
      
      // 行为模式分析
      const behaviorPatterns = this.analyzeBehaviorPatterns(userActivities);
      
      // 使用路径分析
      const userJourneys = this.analyzeUserJourneys(userActivities);
      
      // 功能使用偏好分析
      const featurePreferences = this.analyzeFeaturePreferences(userActivities);
      
      // 时间使用模式分析
      const timePatterns = this.analyzeTimeUsagePatterns(userActivities);
      
      return {
        behaviorPatterns,
        userJourneys,
        featurePreferences,
        timePatterns,
        summary: this.generateBehaviorSummary({
          behaviorPatterns,
          userJourneys,
          featurePreferences,
          timePatterns
        })
      };
      
    } catch (error) {
      logger.error('分析用户行为失败', { error: error.message, params });
      throw error;
    }
  }

  /**
   * 分析使用趋势
   * @param {Object} usageData - 使用数据
   * @returns {Object} 使用趋势分析结果
   */
  async analyzeUsageTrends(usageData) {
    try {
      const { userUsage, agentUsage, workflowUsage } = usageData;
      
      const trends = {
        userActivity: this.calculateUsageTrend(userUsage.aggregated),
        agentExecution: this.calculateUsageTrend(agentUsage.aggregated),
        workflowExecution: this.calculateUsageTrend(workflowUsage.aggregated)
      };
      
      // 综合趋势分析
      const overallTrend = this.calculateOverallUsageTrend(trends);
      
      return {
        individual: trends,
        overall: overallTrend,
        insights: this.generateTrendInsights(trends, overallTrend)
      };
      
    } catch (error) {
      logger.error('分析使用趋势失败', { error: error.message });
      throw error;
    }
  }

  // 辅助方法
  groupMetricsByType(metrics) {
    return metrics.reduce((acc, metric) => {
      if (!acc[metric.metricType]) {
        acc[metric.metricType] = [];
      }
      acc[metric.metricType].push(metric);
      return acc;
    }, {});
  }

  calculateMedian(values) {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  }

  calculatePercentile(values, percentile) {
    const sorted = [...values].sort((a, b) => a - b);
    const index = (percentile / 100) * (sorted.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index % 1;
    return sorted[lower] * (1 - weight) + sorted[upper] * weight;
  }

  calculateStandardDeviation(values) {
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const squareDiffs = values.map(value => Math.pow(value - avg, 2));
    const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / squareDiffs.length;
    return Math.sqrt(avgSquareDiff);
  }

  calculateTrendDirection(timeSeriesData) {
    if (timeSeriesData.length < 2) return 'stable';
    
    const firstValue = timeSeriesData[0].value;
    const lastValue = timeSeriesData[timeSeriesData.length - 1].value;
    const change = (lastValue - firstValue) / firstValue;
    
    if (change > 0.05) return 'increasing';
    if (change < -0.05) return 'decreasing';
    return 'stable';
  }

  calculateTrendSlope(timeSeriesData) {
    if (timeSeriesData.length < 2) return 0;
    
    const n = timeSeriesData.length;
    const sumX = timeSeriesData.reduce((sum, point, index) => sum + index, 0);
    const sumY = timeSeriesData.reduce((sum, point) => sum + point.value, 0);
    const sumXY = timeSeriesData.reduce((sum, point, index) => sum + index * point.value, 0);
    const sumXX = timeSeriesData.reduce((sum, point, index) => sum + index * index, 0);
    
    return (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  }

  calculateTrendCorrelation(timeSeriesData) {
    if (timeSeriesData.length < 2) return 0;
    
    const xValues = timeSeriesData.map((_, index) => index);
    const yValues = timeSeriesData.map(point => point.value);
    
    return this.calculateCorrelation(xValues, yValues);
  }

  calculateCorrelation(x, y) {
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumYY = y.reduce((sum, yi) => sum + yi * yi, 0);
    
    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));
    
    return denominator === 0 ? 0 : numerator / denominator;
  }

  calculateVolatility(timeSeriesData) {
    if (timeSeriesData.length < 2) return 0;
    
    const values = timeSeriesData.map(point => point.value);
    return this.calculateStandardDeviation(values);
  }

  calculateChangeRate(timeSeriesData) {
    if (timeSeriesData.length < 2) return 0;
    
    const firstValue = timeSeriesData[0].value;
    const lastValue = timeSeriesData[timeSeriesData.length - 1].value;
    
    return firstValue === 0 ? 0 : (lastValue - firstValue) / firstValue;
  }

  detectAnomaliesUsingIQR(dataPoints, values) {
    const q1 = this.calculatePercentile(values, 25);
    const q3 = this.calculatePercentile(values, 75);
    const iqr = q3 - q1;
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;
    
    return dataPoints.filter((point, index) => {
      const value = values[index];
      return value < lowerBound || value > upperBound;
    }).map((point, index) => ({
      ...point,
      anomalyScore: Math.abs(values[index] - this.calculateMedian(values)) / this.calculateStandardDeviation(values),
      bounds: { lower: lowerBound, upper: upperBound }
    }));
  }

  detectAnomaliesUsingZScore(dataPoints, values) {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const stdDev = this.calculateStandardDeviation(values);
    const threshold = 2.5; // Z-score threshold
    
    return dataPoints.filter((point, index) => {
      const zScore = Math.abs((values[index] - mean) / stdDev);
      return zScore > threshold;
    }).map((point, index) => ({
      ...point,
      zScore: Math.abs((values[index] - mean) / stdDev),
      threshold
    }));
  }

  aggregateDataByGranularity(data, granularity, timestampField = 'timestamp') {
    const aggregated = {};
    
    data.forEach(item => {
      const timestamp = moment(item[timestampField]);
      let key;
      
      switch (granularity) {
        case 'hour':
          key = timestamp.format('YYYY-MM-DD HH:00');
          break;
        case 'day':
          key = timestamp.format('YYYY-MM-DD');
          break;
        case 'week':
          key = timestamp.startOf('week').format('YYYY-MM-DD');
          break;
        case 'month':
          key = timestamp.format('YYYY-MM');
          break;
        default:
          key = timestamp.format('YYYY-MM-DD');
      }
      
      if (!aggregated[key]) {
        aggregated[key] = [];
      }
      aggregated[key].push(item);
    });
    
    return aggregated;
  }
}

module.exports = new AnalyticsService();