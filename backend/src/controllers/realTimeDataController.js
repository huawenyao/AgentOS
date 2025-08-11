/**
 * 实时数据流控制器
 * 提供实时数据流管理、查询、分析的API接口
 * 基于EFIAgent产品设计文档实现
 */

const realTimeDataService = require('../services/realTimeDataService');
const logger = require('../utils/logger');
const errorHandler = require('../middleware/errorHandler');
const { validationResult } = require('express-validator');

class RealTimeDataController {
  /**
   * 获取数据流列表
   */
  async getDataStreams(req, res) {
    try {
      const { page = 1, limit = 20, type, status } = req.query;
      
      const filters = {};
      if (type) filters.type = type;
      if (status) filters.status = status;
      
      const pagination = {
        page: parseInt(page),
        limit: parseInt(limit)
      };
      
      const streams = await realTimeDataService.getDataStreams(filters, pagination);
      
      logger.info('数据流列表查询', {
        userId: req.user.id,
        action: 'GET_DATA_STREAMS',
        filters
      });
      
      res.json({
        success: true,
        data: streams
      });
      
    } catch (error) {
      logger.error('获取数据流列表失败', {
        error: error.message,
        stack: error.stack,
        userId: req.user.id
      });
      errorHandler.handleError(error, res);
    }
  }

  /**
   * 获取数据流详情
   */
  async getDataStream(req, res) {
    try {
      const { id } = req.params;
      
      const stream = await realTimeDataService.getDataStream(id);
      
      if (!stream) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'DATA_STREAM_NOT_FOUND',
            message: '数据流不存在'
          }
        });
      }
      
      logger.info('数据流详情查询', {
        userId: req.user.id,
        action: 'GET_DATA_STREAM',
        streamId: id
      });
      
      res.json({
        success: true,
        data: stream
      });
      
    } catch (error) {
      logger.error('获取数据流详情失败', {
        error: error.message,
        stack: error.stack,
        userId: req.user.id,
        streamId: req.params.id
      });
      errorHandler.handleError(error, res);
    }
  }

  /**
   * 注册数据流
   */
  async registerDataStream(req, res) {
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

      const streamData = {
        ...req.body,
        registeredBy: req.user.id
      };
      
      const stream = await realTimeDataService.registerDataStream(streamData);
      
      logger.info('数据流注册', {
        userId: req.user.id,
        action: 'REGISTER_DATA_STREAM',
        streamId: stream.id
      });
      
      res.status(201).json({
        success: true,
        data: stream
      });
      
    } catch (error) {
      logger.error('注册数据流失败', {
        error: error.message,
        stack: error.stack,
        userId: req.user.id
      });
      errorHandler.handleError(error, res);
    }
  }

  /**
   * 注销数据流
   */
  async unregisterDataStream(req, res) {
    try {
      const { id } = req.params;
      
      const success = await realTimeDataService.unregisterDataStream(id);
      
      if (!success) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'DATA_STREAM_NOT_FOUND',
            message: '数据流不存在'
          }
        });
      }
      
      logger.info('数据流注销', {
        userId: req.user.id,
        action: 'UNREGISTER_DATA_STREAM',
        streamId: id
      });
      
      res.json({
        success: true,
        message: '数据流注销成功'
      });
      
    } catch (error) {
      logger.error('注销数据流失败', {
        error: error.message,
        stack: error.stack,
        userId: req.user.id,
        streamId: req.params.id
      });
      errorHandler.handleError(error, res);
    }
  }

  /**
   * 更新数据流配置
   */
  async updateDataStreamConfig(req, res) {
    try {
      const { id } = req.params;
      const configData = req.body;
      
      const stream = await realTimeDataService.updateDataStreamConfig(id, configData);
      
      if (!stream) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'DATA_STREAM_NOT_FOUND',
            message: '数据流不存在'
          }
        });
      }
      
      logger.info('数据流配置更新', {
        userId: req.user.id,
        action: 'UPDATE_DATA_STREAM_CONFIG',
        streamId: id
      });
      
      res.json({
        success: true,
        data: stream
      });
      
    } catch (error) {
      logger.error('更新数据流配置失败', {
        error: error.message,
        stack: error.stack,
        userId: req.user.id,
        streamId: req.params.id
      });
      errorHandler.handleError(error, res);
    }
  }

  /**
   * 获取实时数据
   */
  async getRealTimeData(req, res) {
    try {
      const { streamId, limit = 100, startTime, endTime } = req.query;
      
      if (!streamId) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_STREAM_ID',
            message: '缺少数据流ID参数'
          }
        });
      }
      
      const options = {
        limit: parseInt(limit),
        startTime: startTime ? new Date(startTime) : undefined,
        endTime: endTime ? new Date(endTime) : undefined
      };
      
      const data = await realTimeDataService.getRealTimeData(streamId, options);
      
      res.json({
        success: true,
        data
      });
      
    } catch (error) {
      logger.error('获取实时数据失败', {
        error: error.message,
        stack: error.stack,
        userId: req.user.id,
        streamId: req.query.streamId
      });
      errorHandler.handleError(error, res);
    }
  }

  /**
   * 获取流数据
   */
  async getStreamData(req, res) {
    try {
      const { streamId, timeRange = '1h', aggregation = 'avg' } = req.query;
      
      if (!streamId) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_STREAM_ID',
            message: '缺少数据流ID参数'
          }
        });
      }
      
      const data = await realTimeDataService.getStreamData(streamId, {
        timeRange,
        aggregation
      });
      
      res.json({
        success: true,
        data
      });
      
    } catch (error) {
      logger.error('获取流数据失败', {
        error: error.message,
        stack: error.stack,
        userId: req.user.id,
        streamId: req.query.streamId
      });
      errorHandler.handleError(error, res);
    }
  }

  /**
   * 查询指标数据
   */
  async queryMetrics(req, res) {
    try {
      const { metric, timeRange = '1h', filters = {}, aggregation = 'avg' } = req.query;
      
      if (!metric) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_METRIC',
            message: '缺少指标名称参数'
          }
        });
      }
      
      const data = await realTimeDataService.queryMetrics(metric, {
        timeRange,
        filters: typeof filters === 'string' ? JSON.parse(filters) : filters,
        aggregation
      });
      
      res.json({
        success: true,
        data
      });
      
    } catch (error) {
      logger.error('查询指标数据失败', {
        error: error.message,
        stack: error.stack,
        userId: req.user.id,
        metric: req.query.metric
      });
      errorHandler.handleError(error, res);
    }
  }

  /**
   * 收集数据
   */
  async collectData(req, res) {
    try {
      const { streamId, data, timestamp } = req.body;
      
      if (!streamId || !data) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_REQUIRED_FIELDS',
            message: '缺少必需的字段：streamId 和 data'
          }
        });
      }
      
      const result = await realTimeDataService.collectData(streamId, data, timestamp);
      
      res.json({
        success: true,
        data: result
      });
      
    } catch (error) {
      logger.error('收集数据失败', {
        error: error.message,
        stack: error.stack,
        userId: req.user.id,
        streamId: req.body.streamId
      });
      errorHandler.handleError(error, res);
    }
  }

  /**
   * 分析数据
   */
  async analyzeData(req, res) {
    try {
      const { streamId, analysisType = 'basic', timeRange = '1h', options = {} } = req.body;
      
      if (!streamId) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_STREAM_ID',
            message: '缺少数据流ID参数'
          }
        });
      }
      
      const result = await realTimeDataService.analyzeData(streamId, {
        analysisType,
        timeRange,
        options
      });
      
      logger.info('数据分析', {
        userId: req.user.id,
        action: 'ANALYZE_DATA',
        streamId,
        analysisType
      });
      
      res.json({
        success: true,
        data: result
      });
      
    } catch (error) {
      logger.error('分析数据失败', {
        error: error.message,
        stack: error.stack,
        userId: req.user.id,
        streamId: req.body.streamId
      });
      errorHandler.handleError(error, res);
    }
  }

  /**
   * 计算趋势
   */
  async calculateTrend(req, res) {
    try {
      const { streamId, metric, timeRange = '24h', interval = '1h' } = req.query;
      
      if (!streamId || !metric) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_REQUIRED_PARAMS',
            message: '缺少必需的参数：streamId 和 metric'
          }
        });
      }
      
      const trend = await realTimeDataService.calculateTrend(streamId, metric, {
        timeRange,
        interval
      });
      
      res.json({
        success: true,
        data: trend
      });
      
    } catch (error) {
      logger.error('计算趋势失败', {
        error: error.message,
        stack: error.stack,
        userId: req.user.id,
        streamId: req.query.streamId,
        metric: req.query.metric
      });
      errorHandler.handleError(error, res);
    }
  }

  /**
   * 检测异常
   */
  async detectAnomalies(req, res) {
    try {
      const { streamId, metric, sensitivity = 'medium', timeRange = '1h' } = req.query;
      
      if (!streamId || !metric) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_REQUIRED_PARAMS',
            message: '缺少必需的参数：streamId 和 metric'
          }
        });
      }
      
      const anomalies = await realTimeDataService.detectAnomalies(streamId, metric, {
        sensitivity,
        timeRange
      });
      
      res.json({
        success: true,
        data: anomalies
      });
      
    } catch (error) {
      logger.error('检测异常失败', {
        error: error.message,
        stack: error.stack,
        userId: req.user.id,
        streamId: req.query.streamId,
        metric: req.query.metric
      });
      errorHandler.handleError(error, res);
    }
  }

  /**
   * 订阅数据流
   */
  async subscribeToStream(req, res) {
    try {
      const { streamId, filters = {}, callback } = req.body;
      
      if (!streamId) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_STREAM_ID',
            message: '缺少数据流ID参数'
          }
        });
      }
      
      const subscription = await realTimeDataService.subscribeToStream(
        streamId,
        req.user.id,
        { filters, callback }
      );
      
      logger.info('数据流订阅', {
        userId: req.user.id,
        action: 'SUBSCRIBE_TO_STREAM',
        streamId,
        subscriptionId: subscription.id
      });
      
      res.status(201).json({
        success: true,
        data: subscription
      });
      
    } catch (error) {
      logger.error('订阅数据流失败', {
        error: error.message,
        stack: error.stack,
        userId: req.user.id,
        streamId: req.body.streamId
      });
      errorHandler.handleError(error, res);
    }
  }

  /**
   * 取消订阅
   */
  async unsubscribeFromStream(req, res) {
    try {
      const { id } = req.params;
      
      const success = await realTimeDataService.unsubscribeFromStream(id, req.user.id);
      
      if (!success) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'SUBSCRIPTION_NOT_FOUND',
            message: '订阅不存在或无权限取消'
          }
        });
      }
      
      logger.info('取消数据流订阅', {
        userId: req.user.id,
        action: 'UNSUBSCRIBE_FROM_STREAM',
        subscriptionId: id
      });
      
      res.json({
        success: true,
        message: '取消订阅成功'
      });
      
    } catch (error) {
      logger.error('取消订阅失败', {
        error: error.message,
        stack: error.stack,
        userId: req.user.id,
        subscriptionId: req.params.id
      });
      errorHandler.handleError(error, res);
    }
  }

  /**
   * 获取订阅列表
   */
  async getSubscriptions(req, res) {
    try {
      const { page = 1, limit = 20, streamId } = req.query;
      
      const filters = { userId: req.user.id };
      if (streamId) filters.streamId = streamId;
      
      const pagination = {
        page: parseInt(page),
        limit: parseInt(limit)
      };
      
      const subscriptions = await realTimeDataService.getSubscriptions(filters, pagination);
      
      res.json({
        success: true,
        data: subscriptions
      });
      
    } catch (error) {
      logger.error('获取订阅列表失败', {
        error: error.message,
        stack: error.stack,
        userId: req.user.id
      });
      errorHandler.handleError(error, res);
    }
  }

  /**
   * 获取服务状态
   */
  async getServiceStatus(req, res) {
    try {
      const status = await realTimeDataService.getServiceStatus();
      
      res.json({
        success: true,
        data: status
      });
      
    } catch (error) {
      logger.error('获取服务状态失败', {
        error: error.message,
        stack: error.stack,
        userId: req.user.id
      });
      errorHandler.handleError(error, res);
    }
  }

  /**
   * 清理过期数据
   */
  async cleanupExpiredData(req, res) {
    try {
      const { streamId, retentionDays = 30 } = req.body;
      
      const result = await realTimeDataService.cleanupExpiredData(streamId, retentionDays);
      
      logger.info('清理过期数据', {
        userId: req.user.id,
        action: 'CLEANUP_EXPIRED_DATA',
        streamId,
        retentionDays,
        deletedCount: result.deletedCount
      });
      
      res.json({
        success: true,
        data: result
      });
      
    } catch (error) {
      logger.error('清理过期数据失败', {
        error: error.message,
        stack: error.stack,
        userId: req.user.id,
        streamId: req.body.streamId
      });
      errorHandler.handleError(error, res);
    }
  }
}

module.exports = new RealTimeDataController();