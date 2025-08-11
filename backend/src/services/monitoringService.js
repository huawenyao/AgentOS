/**
 * 监控服务层
 * 实现系统监控、应用监控、业务监控、告警管理、日志管理、性能追踪的核心业务逻辑
 * 基于EFIAgent产品设计文档实现
 */

const db = require('../models');
const { Op, Sequelize } = require('sequelize');
const moment = require('moment');
const logger = require('../utils/logger');
const { cache } = require('../utils/redis');
const os = require('os');
const fs = require('fs');
const path = require('path');

class MonitoringService {
  constructor() {
    this.alertRules = new Map();
    this.monitoringInterval = null;
    this.initializeMonitoring();
  }

  /**
   * 初始化监控服务
   */
  async initializeMonitoring() {
    try {
      // 加载告警规则
      await this.loadAlertRules();
      
      // 启动系统监控
      this.startSystemMonitoring();
      
      logger.info('监控服务初始化完成');
    } catch (error) {
      logger.error('监控服务初始化失败', { error: error.message });
    }
  }

  // ==================== 系统监控 ====================

  /**
   * 获取系统监控数据
   * @param {Object} params - 查询参数
   * @returns {Object} 系统监控数据
   */
  async getSystemMonitoring(params) {
    const { startDate, endDate, nodeId, metricTypes } = params;
    
    try {
      const whereClause = {
        timestamp: {
          [Op.between]: [startDate, endDate]
        }
      };
      
      if (nodeId) whereClause.nodeId = nodeId;
      if (metricTypes && metricTypes.length > 0) {
        whereClause.metricType = { [Op.in]: metricTypes };
      }
      
      const systemMetrics = await db.SystemMetric.findAll({
        where: whereClause,
        order: [['timestamp', 'ASC']],
        attributes: [
          'id', 'timestamp', 'nodeId', 'metricType', 'value', 'unit',
          'cpuUsage', 'memoryUsage', 'diskUsage', 'networkIn', 'networkOut',
          'loadAverage', 'processCount', 'metadata'
        ]
      });
      
      // 计算系统健康状态
      const healthStatus = await this.calculateSystemHealth(systemMetrics);
      
      // 获取实时系统信息
      const realTimeMetrics = await this.getCurrentSystemMetrics();
      
      return {
        metrics: systemMetrics,
        realTime: realTimeMetrics,
        health: healthStatus,
        summary: this.generateSystemSummary(systemMetrics)
      };
      
    } catch (error) {
      logger.error('获取系统监控数据失败', { error: error.message, params });
      throw error;
    }
  }

  /**
   * 获取当前系统指标
   * @returns {Object} 实时系统指标
   */
  async getCurrentSystemMetrics() {
    try {
      const cpuUsage = await this.getCpuUsage();
      const memoryInfo = this.getMemoryInfo();
      const diskInfo = await this.getDiskInfo();
      const networkInfo = await this.getNetworkInfo();
      const loadAverage = os.loadavg();
      
      return {
        timestamp: new Date(),
        nodeId: os.hostname(),
        cpu: {
          usage: cpuUsage,
          cores: os.cpus().length,
          model: os.cpus()[0].model
        },
        memory: {
          total: memoryInfo.total,
          used: memoryInfo.used,
          free: memoryInfo.free,
          usage: memoryInfo.usage
        },
        disk: diskInfo,
        network: networkInfo,
        load: {
          avg1: loadAverage[0],
          avg5: loadAverage[1],
          avg15: loadAverage[2]
        },
        uptime: os.uptime(),
        platform: os.platform(),
        arch: os.arch()
      };
      
    } catch (error) {
      logger.error('获取当前系统指标失败', { error: error.message });
      throw error;
    }
  }

  /**
   * 启动系统监控
   */
  startSystemMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
    
    // 每30秒收集一次系统指标
    this.monitoringInterval = setInterval(async () => {
      try {
        const metrics = await this.getCurrentSystemMetrics();
        await this.saveSystemMetrics(metrics);
        
        // 检查告警条件
        await this.checkSystemAlerts(metrics);
        
      } catch (error) {
        logger.error('系统监控数据收集失败', { error: error.message });
      }
    }, 30000);
  }

  /**
   * 保存系统指标到数据库
   * @param {Object} metrics - 系统指标数据
   */
  async saveSystemMetrics(metrics) {
    try {
      await db.SystemMetric.create({
        timestamp: metrics.timestamp,
        nodeId: metrics.nodeId,
        metricType: 'system',
        cpuUsage: metrics.cpu.usage,
        memoryUsage: metrics.memory.usage,
        diskUsage: metrics.disk.usage,
        networkIn: metrics.network.bytesIn,
        networkOut: metrics.network.bytesOut,
        loadAverage: metrics.load.avg1,
        processCount: metrics.processCount || 0,
        metadata: {
          cpu: metrics.cpu,
          memory: metrics.memory,
          disk: metrics.disk,
          network: metrics.network,
          load: metrics.load
        }
      });
      
    } catch (error) {
      logger.error('保存系统指标失败', { error: error.message });
    }
  }

  // ==================== 应用监控 ====================

  /**
   * 获取应用监控数据
   * @param {Object} params - 查询参数
   * @returns {Object} 应用监控数据
   */
  async getApplicationMonitoring(params) {
    const { startDate, endDate, applicationId, metricTypes } = params;
    
    try {
      const whereClause = {
        timestamp: {
          [Op.between]: [startDate, endDate]
        }
      };
      
      if (applicationId) whereClause.applicationId = applicationId;
      if (metricTypes && metricTypes.length > 0) {
        whereClause.metricType = { [Op.in]: metricTypes };
      }
      
      const appMetrics = await db.ApplicationMetric.findAll({
        where: whereClause,
        order: [['timestamp', 'ASC']],
        attributes: [
          'id', 'timestamp', 'applicationId', 'metricType', 'value', 'unit',
          'responseTime', 'throughput', 'errorRate', 'availability',
          'activeConnections', 'queueSize', 'metadata'
        ]
      });
      
      // 计算应用健康状态
      const healthStatus = await this.calculateApplicationHealth(appMetrics);
      
      return {
        metrics: appMetrics,
        health: healthStatus,
        summary: this.generateApplicationSummary(appMetrics)
      };
      
    } catch (error) {
      logger.error('获取应用监控数据失败', { error: error.message, params });
      throw error;
    }
  }

  /**
   * 记录应用指标
   * @param {Object} metricData - 应用指标数据
   */
  async recordApplicationMetric(metricData) {
    try {
      await db.ApplicationMetric.create({
        timestamp: new Date(),
        applicationId: metricData.applicationId,
        metricType: metricData.metricType,
        value: metricData.value,
        unit: metricData.unit,
        responseTime: metricData.responseTime,
        throughput: metricData.throughput,
        errorRate: metricData.errorRate,
        availability: metricData.availability,
        activeConnections: metricData.activeConnections,
        queueSize: metricData.queueSize,
        metadata: metricData.metadata
      });
      
    } catch (error) {
      logger.error('记录应用指标失败', { error: error.message });
      throw error;
    }
  }

  // ==================== 业务监控 ====================

  /**
   * 获取业务监控数据
   * @param {Object} params - 查询参数
   * @returns {Object} 业务监控数据
   */
  async getBusinessMonitoring(params) {
    const { startDate, endDate, businessMetricType } = params;
    
    try {
      const whereClause = {
        timestamp: {
          [Op.between]: [startDate, endDate]
        }
      };
      
      if (businessMetricType) whereClause.metricType = businessMetricType;
      
      const businessMetrics = await db.BusinessMetric.findAll({
        where: whereClause,
        order: [['timestamp', 'ASC']],
        attributes: [
          'id', 'timestamp', 'metricType', 'value', 'unit',
          'userCount', 'sessionCount', 'transactionCount',
          'revenue', 'conversionRate', 'metadata'
        ]
      });
      
      // 计算业务KPI
      const kpiData = await this.calculateBusinessKPIs(businessMetrics);
      
      return {
        metrics: businessMetrics,
        kpis: kpiData,
        summary: this.generateBusinessSummary(businessMetrics)
      };
      
    } catch (error) {
      logger.error('获取业务监控数据失败', { error: error.message, params });
      throw error;
    }
  }

  // ==================== 告警管理 ====================

  /**
   * 获取告警列表
   * @param {Object} params - 查询参数
   * @returns {Object} 告警列表
   */
  async getAlerts(params) {
    const { startDate, endDate, severity, status, alertType } = params;
    
    try {
      const whereClause = {};
      
      if (startDate && endDate) {
        whereClause.createdAt = {
          [Op.between]: [startDate, endDate]
        };
      }
      
      if (severity) whereClause.severity = severity;
      if (status) whereClause.status = status;
      if (alertType) whereClause.alertType = alertType;
      
      const alerts = await db.Alert.findAll({
        where: whereClause,
        order: [['createdAt', 'DESC']],
        attributes: [
          'id', 'alertType', 'severity', 'status', 'title', 'message',
          'source', 'sourceId', 'threshold', 'actualValue',
          'createdAt', 'acknowledgedAt', 'resolvedAt', 'metadata'
        ]
      });
      
      return {
        alerts,
        summary: this.generateAlertsSummary(alerts)
      };
      
    } catch (error) {
      logger.error('获取告警列表失败', { error: error.message, params });
      throw error;
    }
  }

  /**
   * 创建告警
   * @param {Object} alertData - 告警数据
   * @returns {Object} 创建的告警
   */
  async createAlert(alertData) {
    try {
      const alert = await db.Alert.create({
        alertType: alertData.alertType,
        severity: alertData.severity,
        status: 'active',
        title: alertData.title,
        message: alertData.message,
        source: alertData.source,
        sourceId: alertData.sourceId,
        threshold: alertData.threshold,
        actualValue: alertData.actualValue,
        metadata: alertData.metadata
      });
      
      // 发送告警通知
      await this.sendAlertNotification(alert);
      
      return alert;
      
    } catch (error) {
      logger.error('创建告警失败', { error: error.message });
      throw error;
    }
  }

  /**
   * 确认告警
   * @param {string} alertId - 告警ID
   * @param {string} userId - 用户ID
   * @returns {Object} 更新的告警
   */
  async acknowledgeAlert(alertId, userId) {
    try {
      const alert = await db.Alert.findByPk(alertId);
      if (!alert) {
        throw new Error('告警不存在');
      }
      
      await alert.update({
        status: 'acknowledged',
        acknowledgedAt: new Date(),
        acknowledgedBy: userId
      });
      
      return alert;
      
    } catch (error) {
      logger.error('确认告警失败', { error: error.message });
      throw error;
    }
  }

  /**
   * 解决告警
   * @param {string} alertId - 告警ID
   * @param {string} userId - 用户ID
   * @param {string} resolution - 解决方案
   * @returns {Object} 更新的告警
   */
  async resolveAlert(alertId, userId, resolution) {
    try {
      const alert = await db.Alert.findByPk(alertId);
      if (!alert) {
        throw new Error('告警不存在');
      }
      
      await alert.update({
        status: 'resolved',
        resolvedAt: new Date(),
        resolvedBy: userId,
        resolution
      });
      
      return alert;
      
    } catch (error) {
      logger.error('解决告警失败', { error: error.message });
      throw error;
    }
  }

  // ==================== 日志管理 ====================

  /**
   * 获取系统日志
   * @param {Object} params - 查询参数
   * @returns {Object} 系统日志
   */
  async getSystemLogs(params) {
    const { startDate, endDate, level, source, keyword } = params;
    
    try {
      const whereClause = {};
      
      if (startDate && endDate) {
        whereClause.timestamp = {
          [Op.between]: [startDate, endDate]
        };
      }
      
      if (level) whereClause.level = level;
      if (source) whereClause.source = source;
      if (keyword) {
        whereClause[Op.or] = [
          { message: { [Op.like]: `%${keyword}%` } },
          { details: { [Op.like]: `%${keyword}%` } }
        ];
      }
      
      const logs = await db.SystemLog.findAll({
        where: whereClause,
        order: [['timestamp', 'DESC']],
        attributes: [
          'id', 'timestamp', 'level', 'source', 'message',
          'details', 'userId', 'sessionId', 'ipAddress', 'metadata'
        ]
      });
      
      return {
        logs,
        summary: this.generateLogsSummary(logs)
      };
      
    } catch (error) {
      logger.error('获取系统日志失败', { error: error.message, params });
      throw error;
    }
  }

  /**
   * 记录系统日志
   * @param {Object} logData - 日志数据
   */
  async recordSystemLog(logData) {
    try {
      await db.SystemLog.create({
        timestamp: new Date(),
        level: logData.level,
        source: logData.source,
        message: logData.message,
        details: logData.details,
        userId: logData.userId,
        sessionId: logData.sessionId,
        ipAddress: logData.ipAddress,
        metadata: logData.metadata
      });
      
    } catch (error) {
      logger.error('记录系统日志失败', { error: error.message });
    }
  }

  // ==================== 性能追踪 ====================

  /**
   * 获取性能追踪数据
   * @param {Object} params - 查询参数
   * @returns {Object} 性能追踪数据
   */
  async getPerformanceTracing(params) {
    const { startDate, endDate, traceId, operationName } = params;
    
    try {
      const whereClause = {};
      
      if (startDate && endDate) {
        whereClause.startTime = {
          [Op.between]: [startDate, endDate]
        };
      }
      
      if (traceId) whereClause.traceId = traceId;
      if (operationName) whereClause.operationName = operationName;
      
      const traces = await db.PerformanceTrace.findAll({
        where: whereClause,
        order: [['startTime', 'DESC']],
        attributes: [
          'id', 'traceId', 'spanId', 'parentSpanId', 'operationName',
          'startTime', 'endTime', 'duration', 'status', 'tags', 'logs'
        ]
      });
      
      // 构建追踪树
      const traceTree = this.buildTraceTree(traces);
      
      return {
        traces,
        traceTree,
        summary: this.generateTracingSummary(traces)
      };
      
    } catch (error) {
      logger.error('获取性能追踪数据失败', { error: error.message, params });
      throw error;
    }
  }

  /**
   * 开始性能追踪
   * @param {Object} traceData - 追踪数据
   * @returns {string} 追踪ID
   */
  async startTrace(traceData) {
    try {
      const traceId = this.generateTraceId();
      const spanId = this.generateSpanId();
      
      await db.PerformanceTrace.create({
        traceId,
        spanId,
        parentSpanId: traceData.parentSpanId,
        operationName: traceData.operationName,
        startTime: new Date(),
        status: 'active',
        tags: traceData.tags,
        logs: []
      });
      
      return { traceId, spanId };
      
    } catch (error) {
      logger.error('开始性能追踪失败', { error: error.message });
      throw error;
    }
  }

  /**
   * 结束性能追踪
   * @param {string} traceId - 追踪ID
   * @param {string} spanId - Span ID
   * @param {Object} endData - 结束数据
   */
  async endTrace(traceId, spanId, endData) {
    try {
      const trace = await db.PerformanceTrace.findOne({
        where: { traceId, spanId }
      });
      
      if (!trace) {
        throw new Error('追踪记录不存在');
      }
      
      const endTime = new Date();
      const duration = endTime - trace.startTime;
      
      await trace.update({
        endTime,
        duration,
        status: endData.status || 'completed',
        logs: [...trace.logs, ...(endData.logs || [])]
      });
      
    } catch (error) {
      logger.error('结束性能追踪失败', { error: error.message });
      throw error;
    }
  }

  // ==================== 辅助方法 ====================

  /**
   * 获取CPU使用率
   * @returns {Promise<number>} CPU使用率
   */
  async getCpuUsage() {
    return new Promise((resolve) => {
      const startMeasure = this.cpuAverage();
      
      setTimeout(() => {
        const endMeasure = this.cpuAverage();
        const idleDifference = endMeasure.idle - startMeasure.idle;
        const totalDifference = endMeasure.total - startMeasure.total;
        const percentageCPU = 100 - ~~(100 * idleDifference / totalDifference);
        resolve(percentageCPU);
      }, 1000);
    });
  }

  /**
   * 计算CPU平均值
   * @returns {Object} CPU平均值
   */
  cpuAverage() {
    const cpus = os.cpus();
    let user = 0, nice = 0, sys = 0, idle = 0, irq = 0;
    
    for (let cpu of cpus) {
      user += cpu.times.user;
      nice += cpu.times.nice;
      sys += cpu.times.sys;
      idle += cpu.times.idle;
      irq += cpu.times.irq;
    }
    
    const total = user + nice + sys + idle + irq;
    return { idle, total };
  }

  /**
   * 获取内存信息
   * @returns {Object} 内存信息
   */
  getMemoryInfo() {
    const total = os.totalmem();
    const free = os.freemem();
    const used = total - free;
    const usage = (used / total) * 100;
    
    return {
      total: Math.round(total / 1024 / 1024), // MB
      free: Math.round(free / 1024 / 1024),   // MB
      used: Math.round(used / 1024 / 1024),   // MB
      usage: Math.round(usage * 100) / 100    // 百分比
    };
  }

  /**
   * 获取磁盘信息
   * @returns {Promise<Object>} 磁盘信息
   */
  async getDiskInfo() {
    try {
      // 简化的磁盘信息获取，实际项目中可能需要使用第三方库
      return {
        total: 0,
        used: 0,
        free: 0,
        usage: 0
      };
    } catch (error) {
      logger.error('获取磁盘信息失败', { error: error.message });
      return { total: 0, used: 0, free: 0, usage: 0 };
    }
  }

  /**
   * 获取网络信息
   * @returns {Promise<Object>} 网络信息
   */
  async getNetworkInfo() {
    try {
      // 简化的网络信息获取
      return {
        bytesIn: 0,
        bytesOut: 0,
        packetsIn: 0,
        packetsOut: 0
      };
    } catch (error) {
      logger.error('获取网络信息失败', { error: error.message });
      return { bytesIn: 0, bytesOut: 0, packetsIn: 0, packetsOut: 0 };
    }
  }

  /**
   * 计算系统健康状态
   * @param {Array} metrics - 系统指标
   * @returns {Object} 健康状态
   */
  async calculateSystemHealth(metrics) {
    if (!metrics || metrics.length === 0) {
      return { status: 'unknown', score: 0 };
    }
    
    const latest = metrics[metrics.length - 1];
    let score = 100;
    let issues = [];
    
    // CPU使用率检查
    if (latest.cpuUsage > 80) {
      score -= 20;
      issues.push('CPU使用率过高');
    }
    
    // 内存使用率检查
    if (latest.memoryUsage > 85) {
      score -= 20;
      issues.push('内存使用率过高');
    }
    
    // 磁盘使用率检查
    if (latest.diskUsage > 90) {
      score -= 15;
      issues.push('磁盘使用率过高');
    }
    
    // 负载平均值检查
    if (latest.loadAverage > os.cpus().length) {
      score -= 15;
      issues.push('系统负载过高');
    }
    
    let status = 'healthy';
    if (score < 60) status = 'critical';
    else if (score < 80) status = 'warning';
    
    return { status, score, issues };
  }

  /**
   * 生成追踪ID
   * @returns {string} 追踪ID
   */
  generateTraceId() {
    return Math.random().toString(36).substr(2, 16);
  }

  /**
   * 生成Span ID
   * @returns {string} Span ID
   */
  generateSpanId() {
    return Math.random().toString(36).substr(2, 8);
  }

  /**
   * 构建追踪树
   * @param {Array} traces - 追踪数据
   * @returns {Object} 追踪树
   */
  buildTraceTree(traces) {
    const traceMap = new Map();
    const rootTraces = [];
    
    // 构建映射
    traces.forEach(trace => {
      traceMap.set(trace.spanId, { ...trace, children: [] });
    });
    
    // 构建树结构
    traces.forEach(trace => {
      const node = traceMap.get(trace.spanId);
      if (trace.parentSpanId && traceMap.has(trace.parentSpanId)) {
        traceMap.get(trace.parentSpanId).children.push(node);
      } else {
        rootTraces.push(node);
      }
    });
    
    return rootTraces;
  }

  /**
   * 加载告警规则
   */
  async loadAlertRules() {
    try {
      const rules = await db.AlertRule.findAll({
        where: { isActive: true }
      });
      
      rules.forEach(rule => {
        this.alertRules.set(rule.id, rule);
      });
      
      logger.info(`加载了 ${rules.length} 条告警规则`);
    } catch (error) {
      logger.error('加载告警规则失败', { error: error.message });
    }
  }

  /**
   * 检查系统告警
   * @param {Object} metrics - 系统指标
   */
  async checkSystemAlerts(metrics) {
    try {
      for (const [ruleId, rule] of this.alertRules) {
        if (rule.metricType === 'system') {
          const shouldAlert = this.evaluateAlertRule(rule, metrics);
          if (shouldAlert) {
            await this.createAlert({
              alertType: 'system',
              severity: rule.severity,
              title: rule.title,
              message: rule.message,
              source: 'system',
              sourceId: metrics.nodeId,
              threshold: rule.threshold,
              actualValue: this.getMetricValue(metrics, rule.metricField),
              metadata: { rule: rule.id, metrics }
            });
          }
        }
      }
    } catch (error) {
      logger.error('检查系统告警失败', { error: error.message });
    }
  }

  /**
   * 评估告警规则
   * @param {Object} rule - 告警规则
   * @param {Object} metrics - 指标数据
   * @returns {boolean} 是否触发告警
   */
  evaluateAlertRule(rule, metrics) {
    const value = this.getMetricValue(metrics, rule.metricField);
    const threshold = rule.threshold;
    
    switch (rule.operator) {
      case 'gt': return value > threshold;
      case 'gte': return value >= threshold;
      case 'lt': return value < threshold;
      case 'lte': return value <= threshold;
      case 'eq': return value === threshold;
      case 'ne': return value !== threshold;
      default: return false;
    }
  }

  /**
   * 获取指标值
   * @param {Object} metrics - 指标数据
   * @param {string} field - 字段名
   * @returns {number} 指标值
   */
  getMetricValue(metrics, field) {
    switch (field) {
      case 'cpu': return metrics.cpu.usage;
      case 'memory': return metrics.memory.usage;
      case 'disk': return metrics.disk.usage;
      case 'load': return metrics.load.avg1;
      default: return 0;
    }
  }

  /**
   * 发送告警通知
   * @param {Object} alert - 告警数据
   */
  async sendAlertNotification(alert) {
    try {
      // 这里可以集成邮件、短信、钉钉等通知方式
      logger.warn('告警通知', {
        alertId: alert.id,
        severity: alert.severity,
        title: alert.title,
        message: alert.message
      });
      
      // TODO: 实现具体的通知逻辑
      
    } catch (error) {
      logger.error('发送告警通知失败', { error: error.message });
    }
  }

  /**
   * 生成系统摘要
   * @param {Array} metrics - 系统指标
   * @returns {Object} 系统摘要
   */
  generateSystemSummary(metrics) {
    if (!metrics || metrics.length === 0) {
      return { avgCpu: 0, avgMemory: 0, avgDisk: 0, avgLoad: 0 };
    }
    
    const avgCpu = metrics.reduce((sum, m) => sum + m.cpuUsage, 0) / metrics.length;
    const avgMemory = metrics.reduce((sum, m) => sum + m.memoryUsage, 0) / metrics.length;
    const avgDisk = metrics.reduce((sum, m) => sum + m.diskUsage, 0) / metrics.length;
    const avgLoad = metrics.reduce((sum, m) => sum + m.loadAverage, 0) / metrics.length;
    
    return {
      avgCpu: Math.round(avgCpu * 100) / 100,
      avgMemory: Math.round(avgMemory * 100) / 100,
      avgDisk: Math.round(avgDisk * 100) / 100,
      avgLoad: Math.round(avgLoad * 100) / 100
    };
  }

  /**
   * 生成应用摘要
   * @param {Array} metrics - 应用指标
   * @returns {Object} 应用摘要
   */
  generateApplicationSummary(metrics) {
    if (!metrics || metrics.length === 0) {
      return { avgResponseTime: 0, avgThroughput: 0, avgErrorRate: 0, avgAvailability: 0 };
    }
    
    const avgResponseTime = metrics.reduce((sum, m) => sum + (m.responseTime || 0), 0) / metrics.length;
    const avgThroughput = metrics.reduce((sum, m) => sum + (m.throughput || 0), 0) / metrics.length;
    const avgErrorRate = metrics.reduce((sum, m) => sum + (m.errorRate || 0), 0) / metrics.length;
    const avgAvailability = metrics.reduce((sum, m) => sum + (m.availability || 0), 0) / metrics.length;
    
    return {
      avgResponseTime: Math.round(avgResponseTime * 100) / 100,
      avgThroughput: Math.round(avgThroughput * 100) / 100,
      avgErrorRate: Math.round(avgErrorRate * 100) / 100,
      avgAvailability: Math.round(avgAvailability * 100) / 100
    };
  }

  /**
   * 计算应用健康状态
   * @param {Array} metrics - 应用指标
   * @returns {Object} 健康状态
   */
  async calculateApplicationHealth(metrics) {
    if (!metrics || metrics.length === 0) {
      return { status: 'unknown', score: 0 };
    }
    
    const latest = metrics[metrics.length - 1];
    let score = 100;
    let issues = [];
    
    // 响应时间检查
    if (latest.responseTime > 1000) {
      score -= 20;
      issues.push('响应时间过长');
    }
    
    // 错误率检查
    if (latest.errorRate > 5) {
      score -= 25;
      issues.push('错误率过高');
    }
    
    // 可用性检查
    if (latest.availability < 99) {
      score -= 30;
      issues.push('可用性不足');
    }
    
    let status = 'healthy';
    if (score < 60) status = 'critical';
    else if (score < 80) status = 'warning';
    
    return { status, score, issues };
  }

  /**
   * 计算业务KPI
   * @param {Array} metrics - 业务指标
   * @returns {Object} 业务KPI
   */
  async calculateBusinessKPIs(metrics) {
    if (!metrics || metrics.length === 0) {
      return {};
    }
    
    const totalUsers = metrics.reduce((sum, m) => sum + (m.userCount || 0), 0);
    const totalSessions = metrics.reduce((sum, m) => sum + (m.sessionCount || 0), 0);
    const totalTransactions = metrics.reduce((sum, m) => sum + (m.transactionCount || 0), 0);
    const totalRevenue = metrics.reduce((sum, m) => sum + (m.revenue || 0), 0);
    
    return {
      totalUsers,
      totalSessions,
      totalTransactions,
      totalRevenue,
      avgConversionRate: metrics.reduce((sum, m) => sum + (m.conversionRate || 0), 0) / metrics.length
    };
  }

  /**
   * 生成业务摘要
   * @param {Array} metrics - 业务指标
   * @returns {Object} 业务摘要
   */
  generateBusinessSummary(metrics) {
    if (!metrics || metrics.length === 0) {
      return { totalUsers: 0, totalRevenue: 0, avgConversionRate: 0 };
    }
    
    const totalUsers = metrics.reduce((sum, m) => sum + (m.userCount || 0), 0);
    const totalRevenue = metrics.reduce((sum, m) => sum + (m.revenue || 0), 0);
    const avgConversionRate = metrics.reduce((sum, m) => sum + (m.conversionRate || 0), 0) / metrics.length;
    
    return {
      totalUsers,
      totalRevenue,
      avgConversionRate: Math.round(avgConversionRate * 100) / 100
    };
  }

  /**
   * 生成告警摘要
   * @param {Array} alerts - 告警列表
   * @returns {Object} 告警摘要
   */
  generateAlertsSummary(alerts) {
    if (!alerts || alerts.length === 0) {
      return { total: 0, critical: 0, warning: 0, info: 0, active: 0, resolved: 0 };
    }
    
    const summary = {
      total: alerts.length,
      critical: alerts.filter(a => a.severity === 'critical').length,
      warning: alerts.filter(a => a.severity === 'warning').length,
      info: alerts.filter(a => a.severity === 'info').length,
      active: alerts.filter(a => a.status === 'active').length,
      resolved: alerts.filter(a => a.status === 'resolved').length
    };
    
    return summary;
  }

  /**
   * 生成日志摘要
   * @param {Array} logs - 日志列表
   * @returns {Object} 日志摘要
   */
  generateLogsSummary(logs) {
    if (!logs || logs.length === 0) {
      return { total: 0, error: 0, warning: 0, info: 0, debug: 0 };
    }
    
    const summary = {
      total: logs.length,
      error: logs.filter(l => l.level === 'error').length,
      warning: logs.filter(l => l.level === 'warning').length,
      info: logs.filter(l => l.level === 'info').length,
      debug: logs.filter(l => l.level === 'debug').length
    };
    
    return summary;
  }

  /**
   * 生成追踪摘要
   * @param {Array} traces - 追踪列表
   * @returns {Object} 追踪摘要
   */
  generateTracingSummary(traces) {
    if (!traces || traces.length === 0) {
      return { total: 0, avgDuration: 0, successRate: 0 };
    }
    
    const totalDuration = traces.reduce((sum, t) => sum + (t.duration || 0), 0);
    const avgDuration = totalDuration / traces.length;
    const successCount = traces.filter(t => t.status === 'completed').length;
    const successRate = (successCount / traces.length) * 100;
    
    return {
      total: traces.length,
      avgDuration: Math.round(avgDuration * 100) / 100,
      successRate: Math.round(successRate * 100) / 100
    };
  }

  /**
   * 停止监控服务
   */
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      logger.info('监控服务已停止');
    }
  }
}

module.exports = new MonitoringService();