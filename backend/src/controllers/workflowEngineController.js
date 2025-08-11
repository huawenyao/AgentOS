/**
 * 工作流引擎控制器
 * 提供工作流引擎管理、执行监控、能力模块管理的API接口
 * 基于EFIAgent产品设计文档实现
 */

const workflowEngineService = require('../services/workflowEngineService');
const logger = require('../utils/logger');
const errorHandler = require('../middleware/errorHandler');
const { validationResult } = require('express-validator');

class WorkflowEngineController {
  /**
   * 获取工作流定义列表
   */
  async getWorkflowDefinitions(req, res) {
    try {
      const { page = 1, limit = 20, status, category } = req.query;
      
      const filters = {};
      if (status) filters.status = status;
      if (category) filters.category = category;
      
      const pagination = {
        page: parseInt(page),
        limit: parseInt(limit)
      };
      
      const definitions = await workflowEngineService.getWorkflowDefinitions(filters, pagination);
      
      logger.info('工作流定义列表查询', {
        userId: req.user.id,
        action: 'GET_WORKFLOW_DEFINITIONS',
        filters
      });
      
      res.json({
        success: true,
        data: definitions
      });
      
    } catch (error) {
      logger.error('获取工作流定义列表失败', {
        error: error.message,
        stack: error.stack,
        userId: req.user.id
      });
      errorHandler.handleError(error, res);
    }
  }

  /**
   * 获取工作流定义详情
   */
  async getWorkflowDefinition(req, res) {
    try {
      const { id } = req.params;
      
      const definition = await workflowEngineService.getWorkflowDefinition(id);
      
      if (!definition) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'WORKFLOW_DEFINITION_NOT_FOUND',
            message: '工作流定义不存在'
          }
        });
      }
      
      logger.info('工作流定义详情查询', {
        userId: req.user.id,
        action: 'GET_WORKFLOW_DEFINITION',
        definitionId: id
      });
      
      res.json({
        success: true,
        data: definition
      });
      
    } catch (error) {
      logger.error('获取工作流定义详情失败', {
        error: error.message,
        stack: error.stack,
        userId: req.user.id,
        definitionId: req.params.id
      });
      errorHandler.handleError(error, res);
    }
  }

  /**
   * 创建工作流定义
   */
  async createWorkflowDefinition(req, res) {
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

      const definitionData = {
        ...req.body,
        createdBy: req.user.id
      };
      
      const definition = await workflowEngineService.createWorkflowDefinition(definitionData);
      
      logger.info('工作流定义创建', {
        userId: req.user.id,
        action: 'CREATE_WORKFLOW_DEFINITION',
        definitionId: definition.id
      });
      
      res.status(201).json({
        success: true,
        data: definition
      });
      
    } catch (error) {
      logger.error('创建工作流定义失败', {
        error: error.message,
        stack: error.stack,
        userId: req.user.id
      });
      errorHandler.handleError(error, res);
    }
  }

  /**
   * 更新工作流定义
   */
  async updateWorkflowDefinition(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      const definition = await workflowEngineService.updateWorkflowDefinition(id, updateData);
      
      if (!definition) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'WORKFLOW_DEFINITION_NOT_FOUND',
            message: '工作流定义不存在'
          }
        });
      }
      
      logger.info('工作流定义更新', {
        userId: req.user.id,
        action: 'UPDATE_WORKFLOW_DEFINITION',
        definitionId: id
      });
      
      res.json({
        success: true,
        data: definition
      });
      
    } catch (error) {
      logger.error('更新工作流定义失败', {
        error: error.message,
        stack: error.stack,
        userId: req.user.id,
        definitionId: req.params.id
      });
      errorHandler.handleError(error, res);
    }
  }

  /**
   * 删除工作流定义
   */
  async deleteWorkflowDefinition(req, res) {
    try {
      const { id } = req.params;
      
      const success = await workflowEngineService.deleteWorkflowDefinition(id);
      
      if (!success) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'WORKFLOW_DEFINITION_NOT_FOUND',
            message: '工作流定义不存在'
          }
        });
      }
      
      logger.info('工作流定义删除', {
        userId: req.user.id,
        action: 'DELETE_WORKFLOW_DEFINITION',
        definitionId: id
      });
      
      res.json({
        success: true,
        message: '工作流定义删除成功'
      });
      
    } catch (error) {
      logger.error('删除工作流定义失败', {
        error: error.message,
        stack: error.stack,
        userId: req.user.id,
        definitionId: req.params.id
      });
      errorHandler.handleError(error, res);
    }
  }

  /**
   * 执行工作流
   */
  async executeWorkflow(req, res) {
    try {
      const { id } = req.params;
      const { input, priority = 'normal' } = req.body;
      
      const execution = await workflowEngineService.executeWorkflow(id, {
        input,
        priority,
        executedBy: req.user.id
      });
      
      logger.info('工作流执行', {
        userId: req.user.id,
        action: 'EXECUTE_WORKFLOW',
        workflowId: id,
        executionId: execution.id
      });
      
      res.status(201).json({
        success: true,
        data: execution
      });
      
    } catch (error) {
      logger.error('执行工作流失败', {
        error: error.message,
        stack: error.stack,
        userId: req.user.id,
        workflowId: req.params.id
      });
      errorHandler.handleError(error, res);
    }
  }

  /**
   * 获取工作流执行列表
   */
  async getWorkflowExecutions(req, res) {
    try {
      const { page = 1, limit = 20, status, workflowId } = req.query;
      
      const filters = {};
      if (status) filters.status = status;
      if (workflowId) filters.workflowId = workflowId;
      
      const pagination = {
        page: parseInt(page),
        limit: parseInt(limit)
      };
      
      const executions = await workflowEngineService.getWorkflowExecutions(filters, pagination);
      
      logger.info('工作流执行列表查询', {
        userId: req.user.id,
        action: 'GET_WORKFLOW_EXECUTIONS',
        filters
      });
      
      res.json({
        success: true,
        data: executions
      });
      
    } catch (error) {
      logger.error('获取工作流执行列表失败', {
        error: error.message,
        stack: error.stack,
        userId: req.user.id
      });
      errorHandler.handleError(error, res);
    }
  }

  /**
   * 获取工作流执行详情
   */
  async getWorkflowExecution(req, res) {
    try {
      const { id } = req.params;
      
      const execution = await workflowEngineService.getWorkflowExecution(id);
      
      if (!execution) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'WORKFLOW_EXECUTION_NOT_FOUND',
            message: '工作流执行记录不存在'
          }
        });
      }
      
      logger.info('工作流执行详情查询', {
        userId: req.user.id,
        action: 'GET_WORKFLOW_EXECUTION',
        executionId: id
      });
      
      res.json({
        success: true,
        data: execution
      });
      
    } catch (error) {
      logger.error('获取工作流执行详情失败', {
        error: error.message,
        stack: error.stack,
        userId: req.user.id,
        executionId: req.params.id
      });
      errorHandler.handleError(error, res);
    }
  }

  /**
   * 停止工作流执行
   */
  async stopWorkflowExecution(req, res) {
    try {
      const { id } = req.params;
      
      const success = await workflowEngineService.stopWorkflowExecution(id, req.user.id);
      
      if (!success) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'WORKFLOW_EXECUTION_NOT_FOUND',
            message: '工作流执行记录不存在或无法停止'
          }
        });
      }
      
      logger.info('工作流执行停止', {
        userId: req.user.id,
        action: 'STOP_WORKFLOW_EXECUTION',
        executionId: id
      });
      
      res.json({
        success: true,
        message: '工作流执行已停止'
      });
      
    } catch (error) {
      logger.error('停止工作流执行失败', {
        error: error.message,
        stack: error.stack,
        userId: req.user.id,
        executionId: req.params.id
      });
      errorHandler.handleError(error, res);
    }
  }

  /**
   * 暂停工作流执行
   */
  async pauseWorkflowExecution(req, res) {
    try {
      const { id } = req.params;
      
      const success = await workflowEngineService.pauseWorkflowExecution(id, req.user.id);
      
      if (!success) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'WORKFLOW_EXECUTION_NOT_FOUND',
            message: '工作流执行记录不存在或无法暂停'
          }
        });
      }
      
      logger.info('工作流执行暂停', {
        userId: req.user.id,
        action: 'PAUSE_WORKFLOW_EXECUTION',
        executionId: id
      });
      
      res.json({
        success: true,
        message: '工作流执行已暂停'
      });
      
    } catch (error) {
      logger.error('暂停工作流执行失败', {
        error: error.message,
        stack: error.stack,
        userId: req.user.id,
        executionId: req.params.id
      });
      errorHandler.handleError(error, res);
    }
  }

  /**
   * 恢复工作流执行
   */
  async resumeWorkflowExecution(req, res) {
    try {
      const { id } = req.params;
      
      const success = await workflowEngineService.resumeWorkflowExecution(id, req.user.id);
      
      if (!success) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'WORKFLOW_EXECUTION_NOT_FOUND',
            message: '工作流执行记录不存在或无法恢复'
          }
        });
      }
      
      logger.info('工作流执行恢复', {
        userId: req.user.id,
        action: 'RESUME_WORKFLOW_EXECUTION',
        executionId: id
      });
      
      res.json({
        success: true,
        message: '工作流执行已恢复'
      });
      
    } catch (error) {
      logger.error('恢复工作流执行失败', {
        error: error.message,
        stack: error.stack,
        userId: req.user.id,
        executionId: req.params.id
      });
      errorHandler.handleError(error, res);
    }
  }

  /**
   * 获取能力模块列表
   */
  async getCapabilityModules(req, res) {
    try {
      const { page = 1, limit = 20, category, status } = req.query;
      
      const filters = {};
      if (category) filters.category = category;
      if (status) filters.status = status;
      
      const pagination = {
        page: parseInt(page),
        limit: parseInt(limit)
      };
      
      const modules = await workflowEngineService.getCapabilityModules(filters, pagination);
      
      logger.info('能力模块列表查询', {
        userId: req.user.id,
        action: 'GET_CAPABILITY_MODULES',
        filters
      });
      
      res.json({
        success: true,
        data: modules
      });
      
    } catch (error) {
      logger.error('获取能力模块列表失败', {
        error: error.message,
        stack: error.stack,
        userId: req.user.id
      });
      errorHandler.handleError(error, res);
    }
  }

  /**
   * 注册能力模块
   */
  async registerCapabilityModule(req, res) {
    try {
      const moduleData = {
        ...req.body,
        registeredBy: req.user.id
      };
      
      const module = await workflowEngineService.registerCapabilityModule(moduleData);
      
      logger.info('能力模块注册', {
        userId: req.user.id,
        action: 'REGISTER_CAPABILITY_MODULE',
        moduleId: module.id
      });
      
      res.status(201).json({
        success: true,
        data: module
      });
      
    } catch (error) {
      logger.error('注册能力模块失败', {
        error: error.message,
        stack: error.stack,
        userId: req.user.id
      });
      errorHandler.handleError(error, res);
    }
  }

  /**
   * 注销能力模块
   */
  async unregisterCapabilityModule(req, res) {
    try {
      const { id } = req.params;
      
      const success = await workflowEngineService.unregisterCapabilityModule(id);
      
      if (!success) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'CAPABILITY_MODULE_NOT_FOUND',
            message: '能力模块不存在'
          }
        });
      }
      
      logger.info('能力模块注销', {
        userId: req.user.id,
        action: 'UNREGISTER_CAPABILITY_MODULE',
        moduleId: id
      });
      
      res.json({
        success: true,
        message: '能力模块注销成功'
      });
      
    } catch (error) {
      logger.error('注销能力模块失败', {
        error: error.message,
        stack: error.stack,
        userId: req.user.id,
        moduleId: req.params.id
      });
      errorHandler.handleError(error, res);
    }
  }

  /**
   * 获取Agent列表
   */
  async getAgents(req, res) {
    try {
      const { page = 1, limit = 20, status, type } = req.query;
      
      const filters = {};
      if (status) filters.status = status;
      if (type) filters.type = type;
      
      const pagination = {
        page: parseInt(page),
        limit: parseInt(limit)
      };
      
      const agents = await workflowEngineService.getAgents(filters, pagination);
      
      logger.info('Agent列表查询', {
        userId: req.user.id,
        action: 'GET_AGENTS',
        filters
      });
      
      res.json({
        success: true,
        data: agents
      });
      
    } catch (error) {
      logger.error('获取Agent列表失败', {
        error: error.message,
        stack: error.stack,
        userId: req.user.id
      });
      errorHandler.handleError(error, res);
    }
  }

  /**
   * 注册Agent
   */
  async registerAgent(req, res) {
    try {
      const agentData = {
        ...req.body,
        registeredBy: req.user.id
      };
      
      const agent = await workflowEngineService.registerAgent(agentData);
      
      logger.info('Agent注册', {
        userId: req.user.id,
        action: 'REGISTER_AGENT',
        agentId: agent.id
      });
      
      res.status(201).json({
        success: true,
        data: agent
      });
      
    } catch (error) {
      logger.error('注册Agent失败', {
        error: error.message,
        stack: error.stack,
        userId: req.user.id
      });
      errorHandler.handleError(error, res);
    }
  }

  /**
   * 注销Agent
   */
  async unregisterAgent(req, res) {
    try {
      const { id } = req.params;
      
      const success = await workflowEngineService.unregisterAgent(id);
      
      if (!success) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'AGENT_NOT_FOUND',
            message: 'Agent不存在'
          }
        });
      }
      
      logger.info('Agent注销', {
        userId: req.user.id,
        action: 'UNREGISTER_AGENT',
        agentId: id
      });
      
      res.json({
        success: true,
        message: 'Agent注销成功'
      });
      
    } catch (error) {
      logger.error('注销Agent失败', {
        error: error.message,
        stack: error.stack,
        userId: req.user.id,
        agentId: req.params.id
      });
      errorHandler.handleError(error, res);
    }
  }

  /**
   * 获取工作流引擎状态
   */
  async getEngineStatus(req, res) {
    try {
      const status = await workflowEngineService.getEngineStatus();
      
      res.json({
        success: true,
        data: status
      });
      
    } catch (error) {
      logger.error('获取工作流引擎状态失败', {
        error: error.message,
        stack: error.stack,
        userId: req.user.id
      });
      errorHandler.handleError(error, res);
    }
  }

  /**
   * 获取运行中的工作流
   */
  async getRunningWorkflows(req, res) {
    try {
      const workflows = await workflowEngineService.getRunningWorkflows();
      
      res.json({
        success: true,
        data: workflows
      });
      
    } catch (error) {
      logger.error('获取运行中的工作流失败', {
        error: error.message,
        stack: error.stack,
        userId: req.user.id
      });
      errorHandler.handleError(error, res);
    }
  }

  /**
   * 获取执行队列状态
   */
  async getExecutionQueue(req, res) {
    try {
      const queue = await workflowEngineService.getExecutionQueue();
      
      res.json({
        success: true,
        data: queue
      });
      
    } catch (error) {
      logger.error('获取执行队列状态失败', {
        error: error.message,
        stack: error.stack,
        userId: req.user.id
      });
      errorHandler.handleError(error, res);
    }
  }

  /**
   * 获取执行统计
   */
  async getExecutionStats(req, res) {
    try {
      const { timeRange = '24h' } = req.query;
      
      const stats = await workflowEngineService.getExecutionStats(timeRange);
      
      res.json({
        success: true,
        data: stats
      });
      
    } catch (error) {
      logger.error('获取执行统计失败', {
        error: error.message,
        stack: error.stack,
        userId: req.user.id
      });
      errorHandler.handleError(error, res);
    }
  }
}

module.exports = new WorkflowEngineController();