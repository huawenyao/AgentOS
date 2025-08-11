/**
 * 系统管理控制器
 * 提供系统配置、用户管理、系统维护、系统信息的API接口
 * 基于EFIAgent产品设计文档实现
 */

const systemManagementService = require('../services/systemManagementService');
const logger = require('../utils/logger');
const errorHandler = require('../middleware/errorHandler');
const { validationResult } = require('express-validator');

class SystemManagementController {
  /**
   * 获取系统配置
   */
  async getSystemConfig(req, res) {
    try {
      const { category, key } = req.query;
      
      const config = await systemManagementService.getSystemConfig(category, key);
      
      logger.info('系统配置查询', {
        userId: req.user.id,
        action: 'GET_SYSTEM_CONFIG',
        category,
        key
      });
      
      res.json({
        success: true,
        data: config
      });
      
    } catch (error) {
      logger.error('获取系统配置失败', {
        error: error.message,
        stack: error.stack,
        userId: req.user.id
      });
      errorHandler.handleError(error, res);
    }
  }

  /**
   * 更新系统配置
   */
  async updateSystemConfig(req, res) {
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

      const { category, key, value } = req.body;
      
      const config = await systemManagementService.updateSystemConfig(category, key, value, req.user.id);
      
      logger.info('系统配置更新', {
        userId: req.user.id,
        action: 'UPDATE_SYSTEM_CONFIG',
        category,
        key
      });
      
      res.json({
        success: true,
        data: config
      });
      
    } catch (error) {
      logger.error('更新系统配置失败', {
        error: error.message,
        stack: error.stack,
        userId: req.user.id
      });
      errorHandler.handleError(error, res);
    }
  }

  /**
   * 批量更新系统配置
   */
  async batchUpdateSystemConfig(req, res) {
    try {
      const { configs } = req.body;
      
      if (!Array.isArray(configs)) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_CONFIGS_FORMAT',
            message: 'configs必须是数组格式'
          }
        });
      }
      
      const result = await systemManagementService.batchUpdateSystemConfig(configs, req.user.id);
      
      logger.info('批量更新系统配置', {
        userId: req.user.id,
        action: 'BATCH_UPDATE_SYSTEM_CONFIG',
        configCount: configs.length
      });
      
      res.json({
        success: true,
        data: result
      });
      
    } catch (error) {
      logger.error('批量更新系统配置失败', {
        error: error.message,
        stack: error.stack,
        userId: req.user.id
      });
      errorHandler.handleError(error, res);
    }
  }

  /**
   * 删除系统配置
   */
  async deleteSystemConfig(req, res) {
    try {
      const { category, key } = req.params;
      
      const success = await systemManagementService.deleteSystemConfig(category, key);
      
      if (!success) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'CONFIG_NOT_FOUND',
            message: '配置项不存在'
          }
        });
      }
      
      logger.info('系统配置删除', {
        userId: req.user.id,
        action: 'DELETE_SYSTEM_CONFIG',
        category,
        key
      });
      
      res.json({
        success: true,
        message: '配置删除成功'
      });
      
    } catch (error) {
      logger.error('删除系统配置失败', {
        error: error.message,
        stack: error.stack,
        userId: req.user.id,
        category: req.params.category,
        key: req.params.key
      });
      errorHandler.handleError(error, res);
    }
  }

  /**
   * 获取配置分类
   */
  async getConfigCategories(req, res) {
    try {
      const categories = await systemManagementService.getConfigCategories();
      
      res.json({
        success: true,
        data: categories
      });
      
    } catch (error) {
      logger.error('获取配置分类失败', {
        error: error.message,
        stack: error.stack,
        userId: req.user.id
      });
      errorHandler.handleError(error, res);
    }
  }

  /**
   * 获取用户列表
   */
  async getUsers(req, res) {
    try {
      const { page = 1, limit = 20, status, role, keyword } = req.query;
      
      const filters = {};
      if (status) filters.status = status;
      if (role) filters.role = role;
      if (keyword) filters.keyword = keyword;
      
      const pagination = {
        page: parseInt(page),
        limit: parseInt(limit)
      };
      
      const users = await systemManagementService.getUsers(filters, pagination);
      
      logger.info('用户列表查询', {
        userId: req.user.id,
        action: 'GET_USERS',
        filters
      });
      
      res.json({
        success: true,
        data: users
      });
      
    } catch (error) {
      logger.error('获取用户列表失败', {
        error: error.message,
        stack: error.stack,
        userId: req.user.id
      });
      errorHandler.handleError(error, res);
    }
  }

  /**
   * 创建用户
   */
  async createUser(req, res) {
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

      const userData = {
        ...req.body,
        createdBy: req.user.id
      };
      
      const user = await systemManagementService.createUser(userData);
      
      logger.info('用户创建', {
        userId: req.user.id,
        action: 'CREATE_USER',
        newUserId: user.id
      });
      
      res.status(201).json({
        success: true,
        data: user
      });
      
    } catch (error) {
      logger.error('创建用户失败', {
        error: error.message,
        stack: error.stack,
        userId: req.user.id
      });
      errorHandler.handleError(error, res);
    }
  }

  /**
   * 更新用户
   */
  async updateUser(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      const user = await systemManagementService.updateUser(id, updateData);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: '用户不存在'
          }
        });
      }
      
      logger.info('用户更新', {
        userId: req.user.id,
        action: 'UPDATE_USER',
        targetUserId: id
      });
      
      res.json({
        success: true,
        data: user
      });
      
    } catch (error) {
      logger.error('更新用户失败', {
        error: error.message,
        stack: error.stack,
        userId: req.user.id,
        targetUserId: req.params.id
      });
      errorHandler.handleError(error, res);
    }
  }

  /**
   * 删除用户
   */
  async deleteUser(req, res) {
    try {
      const { id } = req.params;
      
      const success = await systemManagementService.deleteUser(id);
      
      if (!success) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: '用户不存在'
          }
        });
      }
      
      logger.info('用户删除', {
        userId: req.user.id,
        action: 'DELETE_USER',
        targetUserId: id
      });
      
      res.json({
        success: true,
        message: '用户删除成功'
      });
      
    } catch (error) {
      logger.error('删除用户失败', {
        error: error.message,
        stack: error.stack,
        userId: req.user.id,
        targetUserId: req.params.id
      });
      errorHandler.handleError(error, res);
    }
  }

  /**
   * 重置用户密码
   */
  async resetUserPassword(req, res) {
    try {
      const { id } = req.params;
      const { newPassword } = req.body;
      
      if (!newPassword) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_PASSWORD',
            message: '缺少新密码参数'
          }
        });
      }
      
      const success = await systemManagementService.resetUserPassword(id, newPassword);
      
      if (!success) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: '用户不存在'
          }
        });
      }
      
      logger.info('用户密码重置', {
        userId: req.user.id,
        action: 'RESET_USER_PASSWORD',
        targetUserId: id
      });
      
      res.json({
        success: true,
        message: '密码重置成功'
      });
      
    } catch (error) {
      logger.error('重置用户密码失败', {
        error: error.message,
        stack: error.stack,
        userId: req.user.id,
        targetUserId: req.params.id
      });
      errorHandler.handleError(error, res);
    }
  }

  /**
   * 更新用户状态
   */
  async updateUserStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      if (!status) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_STATUS',
            message: '缺少状态参数'
          }
        });
      }
      
      const success = await systemManagementService.updateUserStatus(id, status);
      
      if (!success) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: '用户不存在'
          }
        });
      }
      
      logger.info('用户状态更新', {
        userId: req.user.id,
        action: 'UPDATE_USER_STATUS',
        targetUserId: id,
        newStatus: status
      });
      
      res.json({
        success: true,
        message: '用户状态更新成功'
      });
      
    } catch (error) {
      logger.error('更新用户状态失败', {
        error: error.message,
        stack: error.stack,
        userId: req.user.id,
        targetUserId: req.params.id
      });
      errorHandler.handleError(error, res);
    }
  }

  /**
   * 系统健康检查
   */
  async healthCheck(req, res) {
    try {
      const health = await systemManagementService.healthCheck();
      
      res.json({
        success: true,
        data: health
      });
      
    } catch (error) {
      logger.error('系统健康检查失败', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.id
      });
      errorHandler.handleError(error, res);
    }
  }

  /**
   * 清理系统日志
   */
  async cleanupLogs(req, res) {
    try {
      const { retentionDays = 30, logLevel } = req.body;
      
      const result = await systemManagementService.cleanupLogs(retentionDays, logLevel);
      
      logger.info('系统日志清理', {
        userId: req.user.id,
        action: 'CLEANUP_LOGS',
        retentionDays,
        logLevel,
        deletedCount: result.deletedCount
      });
      
      res.json({
        success: true,
        data: result
      });
      
    } catch (error) {
      logger.error('清理系统日志失败', {
        error: error.message,
        stack: error.stack,
        userId: req.user.id
      });
      errorHandler.handleError(error, res);
    }
  }

  /**
   * 数据备份
   */
  async backupData(req, res) {
    try {
      const { tables, compressionLevel = 6 } = req.body;
      
      const backup = await systemManagementService.backupData(tables, compressionLevel);
      
      logger.info('数据备份', {
        userId: req.user.id,
        action: 'BACKUP_DATA',
        tables,
        backupId: backup.id
      });
      
      res.json({
        success: true,
        data: backup
      });
      
    } catch (error) {
      logger.error('数据备份失败', {
        error: error.message,
        stack: error.stack,
        userId: req.user.id
      });
      errorHandler.handleError(error, res);
    }
  }

  /**
   * 重启服务
   */
  async restartService(req, res) {
    try {
      const { serviceName, graceful = true } = req.body;
      
      if (!serviceName) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_SERVICE_NAME',
            message: '缺少服务名称参数'
          }
        });
      }
      
      const result = await systemManagementService.restartService(serviceName, graceful);
      
      logger.info('服务重启', {
        userId: req.user.id,
        action: 'RESTART_SERVICE',
        serviceName,
        graceful
      });
      
      res.json({
        success: true,
        data: result
      });
      
    } catch (error) {
      logger.error('重启服务失败', {
        error: error.message,
        stack: error.stack,
        userId: req.user.id,
        serviceName: req.body.serviceName
      });
      errorHandler.handleError(error, res);
    }
  }

  /**
   * 获取系统信息
   */
  async getSystemInfo(req, res) {
    try {
      const info = await systemManagementService.getSystemInfo();
      
      res.json({
        success: true,
        data: info
      });
      
    } catch (error) {
      logger.error('获取系统信息失败', {
        error: error.message,
        stack: error.stack,
        userId: req.user.id
      });
      errorHandler.handleError(error, res);
    }
  }

  /**
   * 获取数据库统计
   */
  async getDatabaseStats(req, res) {
    try {
      const stats = await systemManagementService.getDatabaseStats();
      
      res.json({
        success: true,
        data: stats
      });
      
    } catch (error) {
      logger.error('获取数据库统计失败', {
        error: error.message,
        stack: error.stack,
        userId: req.user.id
      });
      errorHandler.handleError(error, res);
    }
  }

  /**
   * 获取系统统计
   */
  async getSystemStats(req, res) {
    try {
      const { timeRange = '24h' } = req.query;
      
      const stats = await systemManagementService.getSystemStats(timeRange);
      
      res.json({
        success: true,
        data: stats
      });
      
    } catch (error) {
      logger.error('获取系统统计失败', {
        error: error.message,
        stack: error.stack,
        userId: req.user.id
      });
      errorHandler.handleError(error, res);
    }
  }

  /**
   * 获取磁盘使用情况
   */
  async getDiskUsage(req, res) {
    try {
      const usage = await systemManagementService.getDiskUsage();
      
      res.json({
        success: true,
        data: usage
      });
      
    } catch (error) {
      logger.error('获取磁盘使用情况失败', {
        error: error.message,
        stack: error.stack,
        userId: req.user.id
      });
      errorHandler.handleError(error, res);
    }
  }

  /**
   * 获取系统日志
   */
  async getSystemLogs(req, res) {
    try {
      const { page = 1, limit = 100, level, startTime, endTime, keyword } = req.query;
      
      const filters = {};
      if (level) filters.level = level;
      if (startTime) filters.startTime = new Date(startTime);
      if (endTime) filters.endTime = new Date(endTime);
      if (keyword) filters.keyword = keyword;
      
      const pagination = {
        page: parseInt(page),
        limit: parseInt(limit)
      };
      
      const logs = await systemManagementService.getSystemLogs(filters, pagination);
      
      res.json({
        success: true,
        data: logs
      });
      
    } catch (error) {
      logger.error('获取系统日志失败', {
        error: error.message,
        stack: error.stack,
        userId: req.user.id
      });
      errorHandler.handleError(error, res);
    }
  }

  /**
   * 导出系统日志
   */
  async exportSystemLogs(req, res) {
    try {
      const { format = 'csv', startTime, endTime, level } = req.query;
      
      const filters = {};
      if (startTime) filters.startTime = new Date(startTime);
      if (endTime) filters.endTime = new Date(endTime);
      if (level) filters.level = level;
      
      const exportData = await systemManagementService.exportSystemLogs(filters, format);
      
      logger.info('系统日志导出', {
        userId: req.user.id,
        action: 'EXPORT_SYSTEM_LOGS',
        format,
        filters
      });
      
      res.json({
        success: true,
        data: exportData
      });
      
    } catch (error) {
      logger.error('导出系统日志失败', {
        error: error.message,
        stack: error.stack,
        userId: req.user.id
      });
      errorHandler.handleError(error, res);
    }
  }
}

module.exports = new SystemManagementController();