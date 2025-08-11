const logger = require('../utils/logger')
const EventEmitter = require('events')
const { PerformanceMetric, SystemLog, AgentInstance } = require('../models')
const { Op } = require('sequelize')

/**
 * 实时数据流服务
 * 负责实时数据的收集、处理、分析和推送
 */
class RealTimeDataService extends EventEmitter {
  constructor() {
    super()
    this.dataStreams = new Map() // 数据流注册表
    this.subscribers = new Map() // 订阅者注册表
    this.dataBuffer = new Map() // 数据缓冲区
    this.isRunning = false
    this.collectInterval = null
    this.analysisInterval = null
    
    // 配置参数
    this.config = {
      collectIntervalMs: 5000, // 数据收集间隔
      analysisIntervalMs: 10000, // 数据分析间隔
      bufferSize: 1000, // 缓冲区大小
      retentionPeriod: 24 * 60 * 60 * 1000, // 数据保留期（24小时）
      alertThresholds: {
        cpu: 80,
        memory: 85,
        responseTime: 5000,
        errorRate: 0.05
      }
    }
  }

  // ==================== 数据流管理 ====================

  /**
   * 启动实时数据服务
   */
  async start() {
    if (this.isRunning) {
      logger.warn('实时数据服务已在运行')
      return
    }
    
    try {
      this.isRunning = true
      
      // 启动数据收集
      this.collectInterval = setInterval(() => {
        this.collectRealTimeData()
      }, this.config.collectIntervalMs)
      
      // 启动数据分析
      this.analysisInterval = setInterval(() => {
        this.analyzeRealTimeData()
      }, this.config.analysisIntervalMs)
      
      // 清理过期数据
      setInterval(() => {
        this.cleanupExpiredData()
      }, 60 * 60 * 1000) // 每小时清理一次
      
      logger.info('实时数据服务已启动')
      this.emit('serviceStarted')
      
    } catch (error) {
      logger.error('启动实时数据服务失败:', error)
      throw error
    }
  }

  /**
   * 停止实时数据服务
   */
  async stop() {
    if (!this.isRunning) {
      logger.warn('实时数据服务未运行')
      return
    }
    
    try {
      this.isRunning = false
      
      // 清理定时器
      if (this.collectInterval) {
        clearInterval(this.collectInterval)
        this.collectInterval = null
      }
      
      if (this.analysisInterval) {
        clearInterval(this.analysisInterval)
        this.analysisInterval = null
      }
      
      logger.info('实时数据服务已停止')
      this.emit('serviceStopped')
      
    } catch (error) {
      logger.error('停止实时数据服务失败:', error)
      throw error
    }
  }

  /**
   * 注册数据流
   */
  registerDataStream(streamId, config) {
    try {
      const stream = {
        id: streamId,
        type: config.type || 'metric',
        source: config.source || 'system',
        interval: config.interval || 5000,
        enabled: config.enabled !== false,
        lastUpdate: null,
        dataPoints: [],
        ...config
      }
      
      this.dataStreams.set(streamId, stream)
      this.dataBuffer.set(streamId, [])
      
      logger.info(`数据流已注册: ${streamId}`)
      this.emit('streamRegistered', { streamId, config })
      
      return stream
    } catch (error) {
      logger.error('注册数据流失败:', error)
      throw error
    }
  }

  /**
   * 注销数据流
   */
  unregisterDataStream(streamId) {
    try {
      if (!this.dataStreams.has(streamId)) {
        throw new Error(`数据流不存在: ${streamId}`)
      }
      
      this.dataStreams.delete(streamId)
      this.dataBuffer.delete(streamId)
      
      // 移除相关订阅
      for (const [subscriberId, subscription] of this.subscribers) {
        if (subscription.streamIds.includes(streamId)) {
          subscription.streamIds = subscription.streamIds.filter(id => id !== streamId)
          if (subscription.streamIds.length === 0) {
            this.subscribers.delete(subscriberId)
          }
        }
      }
      
      logger.info(`数据流已注销: ${streamId}`)
      this.emit('streamUnregistered', { streamId })
      
      return true
    } catch (error) {
      logger.error('注销数据流失败:', error)
      throw error
    }
  }

  /**
   * 获取数据流列表
   */
  getDataStreams() {
    const streams = []
    for (const [streamId, stream] of this.dataStreams) {
      streams.push({
        id: streamId,
        type: stream.type,
        source: stream.source,
        enabled: stream.enabled,
        lastUpdate: stream.lastUpdate,
        dataPointCount: stream.dataPoints.length
      })
    }
    return streams
  }

  /**
   * 更新数据流配置
   */
  updateDataStreamConfig(streamId, config) {
    try {
      const stream = this.dataStreams.get(streamId)
      if (!stream) {
        throw new Error(`数据流不存在: ${streamId}`)
      }
      
      Object.assign(stream, config)
      
      logger.info(`数据流配置已更新: ${streamId}`)
      this.emit('streamConfigUpdated', { streamId, config })
      
      return stream
    } catch (error) {
      logger.error('更新数据流配置失败:', error)
      throw error
    }
  }

  // ==================== 实时数据查询 ====================

  /**
   * 获取实时数据
   */
  async getRealTimeData(streamId, options = {}) {
    try {
      const {
        timeRange = '1h',
        limit = 100,
        aggregation = 'raw'
      } = options
      
      if (streamId && !this.dataStreams.has(streamId)) {
        throw new Error(`数据流不存在: ${streamId}`)
      }
      
      const endTime = new Date()
      const startTime = this.calculateStartTime(endTime, timeRange)
      
      if (streamId) {
        // 获取特定数据流的数据
        return await this.getStreamData(streamId, startTime, endTime, limit, aggregation)
      } else {
        // 获取所有数据流的数据
        const allData = {}
        for (const [id] of this.dataStreams) {
          allData[id] = await this.getStreamData(id, startTime, endTime, limit, aggregation)
        }
        return allData
      }
    } catch (error) {
      logger.error('获取实时数据失败:', error)
      throw error
    }
  }

  /**
   * 获取流数据
   */
  async getStreamData(streamId, startTime, endTime, limit, aggregation) {
    const stream = this.dataStreams.get(streamId)
    if (!stream) {
      return []
    }
    
    // 从缓冲区获取数据
    const buffer = this.dataBuffer.get(streamId) || []
    let data = buffer.filter(point => {
      const pointTime = new Date(point.timestamp)
      return pointTime >= startTime && pointTime <= endTime
    })
    
    // 如果缓冲区数据不足，从数据库查询
    if (data.length < limit && stream.type === 'metric') {
      const dbData = await this.queryMetricsFromDB(streamId, startTime, endTime, limit)
      data = [...data, ...dbData]
    }
    
    // 排序并限制数量
    data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    data = data.slice(0, limit)
    
    // 应用聚合
    if (aggregation !== 'raw') {
      data = this.aggregateData(data, aggregation)
    }
    
    return data
  }

  /**
   * 从数据库查询指标数据
   */
  async queryMetricsFromDB(streamId, startTime, endTime, limit) {
    try {
      const metrics = await PerformanceMetric.findAll({
        where: {
          metricType: streamId,
          timestamp: {
            [Op.between]: [startTime, endTime]
          }
        },
        order: [['timestamp', 'DESC']],
        limit
      })
      
      return metrics.map(metric => ({
        timestamp: metric.timestamp,
        value: metric.value,
        metadata: metric.metadata
      }))
    } catch (error) {
      logger.error('从数据库查询指标数据失败:', error)
      return []
    }
  }

  /**
   * 计算开始时间
   */
  calculateStartTime(endTime, timeRange) {
    const startTime = new Date(endTime)
    
    switch (timeRange) {
      case '5m':
        startTime.setMinutes(startTime.getMinutes() - 5)
        break
      case '15m':
        startTime.setMinutes(startTime.getMinutes() - 15)
        break
      case '1h':
        startTime.setHours(startTime.getHours() - 1)
        break
      case '6h':
        startTime.setHours(startTime.getHours() - 6)
        break
      case '24h':
        startTime.setDate(startTime.getDate() - 1)
        break
      case '7d':
        startTime.setDate(startTime.getDate() - 7)
        break
      default:
        startTime.setHours(startTime.getHours() - 1)
    }
    
    return startTime
  }

  /**
   * 聚合数据
   */
  aggregateData(data, aggregation) {
    if (data.length === 0) return data
    
    switch (aggregation) {
      case 'avg':
        return this.aggregateByAverage(data)
      case 'sum':
        return this.aggregateBySum(data)
      case 'min':
        return this.aggregateByMin(data)
      case 'max':
        return this.aggregateByMax(data)
      case '5min':
        return this.aggregateByTimeWindow(data, 5 * 60 * 1000)
      case '1hour':
        return this.aggregateByTimeWindow(data, 60 * 60 * 1000)
      default:
        return data
    }
  }

  /**
   * 按时间窗口聚合
   */
  aggregateByTimeWindow(data, windowMs) {
    const windows = new Map()
    
    for (const point of data) {
      const windowStart = Math.floor(new Date(point.timestamp).getTime() / windowMs) * windowMs
      
      if (!windows.has(windowStart)) {
        windows.set(windowStart, [])
      }
      windows.get(windowStart).push(point)
    }
    
    const result = []
    for (const [windowStart, points] of windows) {
      const avgValue = points.reduce((sum, p) => sum + (typeof p.value === 'number' ? p.value : 0), 0) / points.length
      result.push({
        timestamp: new Date(windowStart),
        value: avgValue,
        count: points.length
      })
    }
    
    return result.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
  }

  // ==================== 数据流分析 ====================

  /**
   * 收集实时数据
   */
  async collectRealTimeData() {
    try {
      for (const [streamId, stream] of this.dataStreams) {
        if (!stream.enabled) continue
        
        const data = await this.collectStreamData(stream)
        if (data) {
          this.addDataPoint(streamId, data)
        }
      }
    } catch (error) {
      logger.error('收集实时数据失败:', error)
    }
  }

  /**
   * 收集流数据
   */
  async collectStreamData(stream) {
    try {
      switch (stream.source) {
        case 'system':
          return await this.collectSystemMetrics(stream)
        case 'agent':
          return await this.collectAgentMetrics(stream)
        case 'workflow':
          return await this.collectWorkflowMetrics(stream)
        case 'api':
          return await this.collectApiMetrics(stream)
        default:
          return null
      }
    } catch (error) {
      logger.error(`收集流数据失败 [${stream.id}]:`, error)
      return null
    }
  }

  /**
   * 收集系统指标
   */
  async collectSystemMetrics(stream) {
    const os = require('os')
    const process = require('process')
    
    switch (stream.type) {
      case 'cpu':
        return {
          value: this.getCpuUsage(),
          timestamp: new Date(),
          metadata: { cores: os.cpus().length }
        }
      case 'memory':
        const memUsage = process.memoryUsage()
        return {
          value: (memUsage.heapUsed / memUsage.heapTotal) * 100,
          timestamp: new Date(),
          metadata: {
            heapUsed: memUsage.heapUsed,
            heapTotal: memUsage.heapTotal,
            external: memUsage.external
          }
        }
      case 'disk':
        return {
          value: await this.getDiskUsage(),
          timestamp: new Date()
        }
      default:
        return null
    }
  }

  /**
   * 收集Agent指标
   */
  async collectAgentMetrics(stream) {
    try {
      const agents = await AgentInstance.findAll({
        where: { status: 'running' }
      })
      
      switch (stream.type) {
        case 'agent_count':
          return {
            value: agents.length,
            timestamp: new Date(),
            metadata: { agents: agents.map(a => a.id) }
          }
        case 'agent_performance':
          const avgPerformance = agents.reduce((sum, agent) => {
            return sum + (agent.performance || 0)
          }, 0) / (agents.length || 1)
          
          return {
            value: avgPerformance,
            timestamp: new Date(),
            metadata: { agentCount: agents.length }
          }
        default:
          return null
      }
    } catch (error) {
      logger.error('收集Agent指标失败:', error)
      return null
    }
  }

  /**
   * 收集工作流指标
   */
  async collectWorkflowMetrics(stream) {
    // 这里可以集成工作流引擎的指标
    return {
      value: Math.random() * 100, // 示例数据
      timestamp: new Date()
    }
  }

  /**
   * 收集API指标
   */
  async collectApiMetrics(stream) {
    // 这里可以集成API监控的指标
    return {
      value: Math.random() * 1000, // 示例数据
      timestamp: new Date()
    }
  }

  /**
   * 获取CPU使用率
   */
  getCpuUsage() {
    const os = require('os')
    const cpus = os.cpus()
    
    let totalIdle = 0
    let totalTick = 0
    
    for (const cpu of cpus) {
      for (const type in cpu.times) {
        totalTick += cpu.times[type]
      }
      totalIdle += cpu.times.idle
    }
    
    return 100 - (totalIdle / totalTick) * 100
  }

  /**
   * 获取磁盘使用率
   */
  async getDiskUsage() {
    // 简化实现，实际项目中可以使用更精确的方法
    return Math.random() * 100
  }

  /**
   * 添加数据点
   */
  addDataPoint(streamId, dataPoint) {
    const buffer = this.dataBuffer.get(streamId)
    if (!buffer) return
    
    buffer.push(dataPoint)
    
    // 限制缓冲区大小
    if (buffer.length > this.config.bufferSize) {
      buffer.shift()
    }
    
    // 更新流的最后更新时间
    const stream = this.dataStreams.get(streamId)
    if (stream) {
      stream.lastUpdate = dataPoint.timestamp
      stream.dataPoints.push(dataPoint)
      
      // 限制数据点数量
      if (stream.dataPoints.length > this.config.bufferSize) {
        stream.dataPoints.shift()
      }
    }
    
    // 推送给订阅者
    this.pushToSubscribers(streamId, dataPoint)
    
    // 检查告警阈值
    this.checkAlertThresholds(streamId, dataPoint)
  }

  /**
   * 分析实时数据
   */
  async analyzeRealTimeData() {
    try {
      for (const [streamId, stream] of this.dataStreams) {
        if (!stream.enabled || stream.dataPoints.length === 0) continue
        
        const analysis = this.analyzeStreamData(stream)
        if (analysis) {
          this.emit('dataAnalysis', {
            streamId,
            analysis,
            timestamp: new Date()
          })
        }
      }
    } catch (error) {
      logger.error('分析实时数据失败:', error)
    }
  }

  /**
   * 分析流数据
   */
  analyzeStreamData(stream) {
    const data = stream.dataPoints.slice(-100) // 分析最近100个数据点
    if (data.length < 10) return null
    
    const values = data.map(point => typeof point.value === 'number' ? point.value : 0)
    
    return {
      count: values.length,
      avg: values.reduce((sum, val) => sum + val, 0) / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      trend: this.calculateTrend(values),
      anomalies: this.detectAnomalies(values)
    }
  }

  /**
   * 计算趋势
   */
  calculateTrend(values) {
    if (values.length < 2) return 'stable'
    
    const firstHalf = values.slice(0, Math.floor(values.length / 2))
    const secondHalf = values.slice(Math.floor(values.length / 2))
    
    const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length
    const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length
    
    const change = (secondAvg - firstAvg) / firstAvg
    
    if (change > 0.1) return 'increasing'
    if (change < -0.1) return 'decreasing'
    return 'stable'
  }

  /**
   * 检测异常
   */
  detectAnomalies(values) {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
    const stdDev = Math.sqrt(variance)
    
    const anomalies = []
    for (let i = 0; i < values.length; i++) {
      if (Math.abs(values[i] - mean) > 2 * stdDev) {
        anomalies.push({
          index: i,
          value: values[i],
          deviation: Math.abs(values[i] - mean) / stdDev
        })
      }
    }
    
    return anomalies
  }

  /**
   * 检查告警阈值
   */
  checkAlertThresholds(streamId, dataPoint) {
    const stream = this.dataStreams.get(streamId)
    if (!stream || !stream.alertThreshold) return
    
    const value = typeof dataPoint.value === 'number' ? dataPoint.value : 0
    
    if (value > stream.alertThreshold) {
      this.emit('alert', {
        streamId,
        type: 'threshold_exceeded',
        value,
        threshold: stream.alertThreshold,
        timestamp: dataPoint.timestamp
      })
    }
  }

  // ==================== 订阅管理 ====================

  /**
   * 订阅数据流
   */
  subscribe(subscriberId, streamIds, callback) {
    try {
      if (!Array.isArray(streamIds)) {
        streamIds = [streamIds]
      }
      
      // 验证数据流是否存在
      for (const streamId of streamIds) {
        if (!this.dataStreams.has(streamId)) {
          throw new Error(`数据流不存在: ${streamId}`)
        }
      }
      
      this.subscribers.set(subscriberId, {
        streamIds,
        callback,
        subscribedAt: new Date()
      })
      
      logger.info(`订阅者已注册: ${subscriberId}, 数据流: ${streamIds.join(', ')}`)
      
      return true
    } catch (error) {
      logger.error('订阅数据流失败:', error)
      throw error
    }
  }

  /**
   * 取消订阅
   */
  unsubscribe(subscriberId) {
    try {
      if (!this.subscribers.has(subscriberId)) {
        throw new Error(`订阅者不存在: ${subscriberId}`)
      }
      
      this.subscribers.delete(subscriberId)
      
      logger.info(`订阅者已取消订阅: ${subscriberId}`)
      
      return true
    } catch (error) {
      logger.error('取消订阅失败:', error)
      throw error
    }
  }

  /**
   * 推送给订阅者
   */
  pushToSubscribers(streamId, dataPoint) {
    for (const [subscriberId, subscription] of this.subscribers) {
      if (subscription.streamIds.includes(streamId)) {
        try {
          subscription.callback({
            streamId,
            data: dataPoint,
            timestamp: new Date()
          })
        } catch (error) {
          logger.error(`推送数据给订阅者失败 [${subscriberId}]:`, error)
        }
      }
    }
  }

  /**
   * 获取订阅者列表
   */
  getSubscribers() {
    const subscribers = []
    for (const [subscriberId, subscription] of this.subscribers) {
      subscribers.push({
        id: subscriberId,
        streamIds: subscription.streamIds,
        subscribedAt: subscription.subscribedAt
      })
    }
    return subscribers
  }

  // ==================== 数据清理 ====================

  /**
   * 清理过期数据
   */
  async cleanupExpiredData() {
    try {
      const cutoffTime = new Date(Date.now() - this.config.retentionPeriod)
      
      // 清理缓冲区中的过期数据
      for (const [streamId, buffer] of this.dataBuffer) {
        const filteredBuffer = buffer.filter(point => {
          return new Date(point.timestamp) > cutoffTime
        })
        this.dataBuffer.set(streamId, filteredBuffer)
      }
      
      // 清理流中的过期数据点
      for (const [streamId, stream] of this.dataStreams) {
        stream.dataPoints = stream.dataPoints.filter(point => {
          return new Date(point.timestamp) > cutoffTime
        })
      }
      
      logger.info('过期数据清理完成')
      
    } catch (error) {
      logger.error('清理过期数据失败:', error)
    }
  }

  // ==================== 服务状态 ====================

  /**
   * 获取服务状态
   */
  getServiceStatus() {
    return {
      isRunning: this.isRunning,
      dataStreams: this.dataStreams.size,
      subscribers: this.subscribers.size,
      totalDataPoints: Array.from(this.dataBuffer.values()).reduce((sum, buffer) => sum + buffer.length, 0),
      config: this.config,
      uptime: this.isRunning ? Date.now() - (this.startTime || Date.now()) : 0
    }
  }

  /**
   * 更新服务配置
   */
  updateConfig(newConfig) {
    try {
      Object.assign(this.config, newConfig)
      
      // 重启定时器以应用新配置
      if (this.isRunning) {
        if (this.collectInterval) {
          clearInterval(this.collectInterval)
          this.collectInterval = setInterval(() => {
            this.collectRealTimeData()
          }, this.config.collectIntervalMs)
        }
        
        if (this.analysisInterval) {
          clearInterval(this.analysisInterval)
          this.analysisInterval = setInterval(() => {
            this.analyzeRealTimeData()
          }, this.config.analysisIntervalMs)
        }
      }
      
      logger.info('服务配置已更新')
      this.emit('configUpdated', newConfig)
      
      return this.config
    } catch (error) {
      logger.error('更新服务配置失败:', error)
      throw error
    }
  }
}

// 创建单例实例
const realTimeDataService = new RealTimeDataService()

module.exports = realTimeDataService