/**
 * 数据服务层
 * 根据配置决定使用模拟数据还是数据库数据
 */

const appConfig = require('../config/appConfig')
const mockDataService = require('./mockDataService')
const { 
  User, AgentTemplate, AgentConfig, Workflow, WorkflowExecution,
  Capability, Component, AgentInstance, PerformanceMetric,
  SystemLog, Message, VersionHistory, SystemSetting
} = require('../models')
const { Op } = require('sequelize')
const logger = require('../utils/logger')

class DataService {
  constructor() {
    this.useMockData = appConfig.dataSource.useMockData
    logger.info(`数据服务初始化: ${this.useMockData ? '使用模拟数据' : '使用数据库'}`)
  }

  /**
   * 切换数据源
   * @param {boolean} useMock - 是否使用模拟数据
   */
  switchDataSource(useMock) {
    this.useMockData = useMock
    logger.info(`数据源已切换: ${this.useMockData ? '模拟数据' : '数据库'}`)
  }

  /**
   * 构建分页参数
   */
  buildPaginationParams(page = 1, limit = 10) {
    const offset = (parseInt(page) - 1) * parseInt(limit)
    return {
      limit: parseInt(limit),
      offset,
      page: parseInt(page)
    }
  }

  /**
   * 构建排序参数
   */
  buildOrderParams(sortBy = 'createdAt', sortOrder = 'desc') {
    return [[sortBy, sortOrder.toUpperCase()]]
  }

  /**
   * 构建搜索条件
   */
  buildSearchCondition(q, fields = ['name', 'description']) {
    if (!q) return {}
    
    return {
      [Op.or]: fields.map(field => ({
        [field]: { [Op.like]: `%${q}%` }
      }))
    }
  }

  // ==================== 用户相关 ====================
  
  /**
   * 获取用户列表
   */
  async getUsers(filters = {}, pagination = {}) {
    if (this.useMockData) {
      const users = await mockDataService.getUsers(filters)
      const { page = 1, limit = 10 } = pagination
      const { offset } = this.buildPaginationParams(page, limit)
      
      return {
        users: users.slice(offset, offset + parseInt(limit)),
        pagination: {
          total: users.length,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(users.length / parseInt(limit))
        }
      }
    }

    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = pagination
    const { offset } = this.buildPaginationParams(page, limit)
    const order = this.buildOrderParams(sortBy, sortOrder)
    
    const where = {}
    if (filters.role) where.role = filters.role
    if (filters.isActive !== undefined) where.isActive = filters.isActive
    if (filters.q) Object.assign(where, this.buildSearchCondition(filters.q, ['username', 'email']))

    const { count, rows: users } = await User.findAndCountAll({
      where,
      order,
      limit: parseInt(limit),
      offset,
      attributes: { exclude: ['passwordHash'] }
    })

    return {
      users,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / parseInt(limit))
      }
    }
  }

  /**
   * 根据ID获取用户
   */
  async getUserById(id) {
    if (this.useMockData) {
      return await mockDataService.getUserById(id)
    }

    return await User.findByPk(id, {
      attributes: { exclude: ['passwordHash'] }
    })
  }

  /**
   * 创建用户
   */
  async createUser(data) {
    if (this.useMockData) {
      return await mockDataService.createUser(data)
    }

    return await User.create(data)
  }

  // ==================== Agent模板相关 ====================
  
  /**
   * 获取Agent模板列表
   */
  async getAgentTemplates(filters = {}, pagination = {}) {
    if (this.useMockData) {
      const templates = await mockDataService.getAgentTemplates(filters)
      const { page = 1, limit = 10 } = pagination
      const { offset } = this.buildPaginationParams(page, limit)
      
      return {
        templates: templates.slice(offset, offset + parseInt(limit)),
        pagination: {
          total: templates.length,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(templates.length / parseInt(limit))
        }
      }
    }

    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = pagination
    const { offset } = this.buildPaginationParams(page, limit)
    const order = this.buildOrderParams(sortBy, sortOrder)
    
    const where = {}
    if (filters.type) where.type = filters.type
    if (filters.category) where.category = filters.category
    if (filters.isPublic !== undefined) where.isPublic = filters.isPublic
    if (filters.featured !== undefined) where.featured = filters.featured
    if (filters.authorId) where.authorId = filters.authorId
    if (filters.q) Object.assign(where, this.buildSearchCondition(filters.q, ['name', 'description']))

    const { count, rows: templates } = await AgentTemplate.findAndCountAll({
      where,
      include: [{
        model: User,
        as: 'author',
        attributes: ['id', 'username', 'avatarUrl']
      }],
      order,
      limit: parseInt(limit),
      offset
    })

    return {
      templates,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / parseInt(limit))
      }
    }
  }

  /**
   * 根据ID获取Agent模板
   */
  async getAgentTemplateById(id) {
    if (this.useMockData) {
      return await mockDataService.getAgentTemplateById(id)
    }

    return await AgentTemplate.findByPk(id, {
      include: [{
        model: User,
        as: 'author',
        attributes: ['id', 'username', 'avatarUrl']
      }]
    })
  }

  /**
   * 创建Agent模板
   */
  async createAgentTemplate(data) {
    if (this.useMockData) {
      return await mockDataService.createAgentTemplate(data)
    }

    const template = await AgentTemplate.create(data)
    return await this.getAgentTemplateById(template.id)
  }

  /**
   * 更新Agent模板
   */
  async updateAgentTemplate(id, data) {
    if (this.useMockData) {
      return await mockDataService.updateAgentTemplate(id, data)
    }

    const template = await AgentTemplate.findByPk(id)
    if (!template) return null
    
    await template.update(data)
    return await this.getAgentTemplateById(id)
  }

  /**
   * 删除Agent模板
   */
  async deleteAgentTemplate(id) {
    if (this.useMockData) {
      return await mockDataService.deleteAgentTemplate(id)
    }

    const template = await AgentTemplate.findByPk(id)
    if (!template) return false
    
    await template.destroy()
    return true
  }

  // ==================== Agent配置相关 ====================
  
  /**
   * 获取Agent配置列表
   */
  async getAgentConfigs(filters = {}, pagination = {}) {
    if (this.useMockData) {
      const configs = await mockDataService.getAgentConfigs(filters)
      const { page = 1, limit = 10 } = pagination
      const { offset } = this.buildPaginationParams(page, limit)
      
      return {
        configs: configs.slice(offset, offset + parseInt(limit)),
        pagination: {
          total: configs.length,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(configs.length / parseInt(limit))
        }
      }
    }

    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = pagination
    const { offset } = this.buildPaginationParams(page, limit)
    const order = this.buildOrderParams(sortBy, sortOrder)
    
    const where = {}
    if (filters.type) where.type = filters.type
    if (filters.status) where.status = filters.status
    if (filters.ownerId) where.ownerId = filters.ownerId
    if (filters.templateId) where.templateId = filters.templateId
    if (filters.q) Object.assign(where, this.buildSearchCondition(filters.q, ['name', 'description']))

    const { count, rows: configs } = await AgentConfig.findAndCountAll({
      where,
      include: [
        {
          model: AgentTemplate,
          as: 'template',
          attributes: ['id', 'name', 'type', 'iconUrl']
        },
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'username', 'avatarUrl']
        }
      ],
      order,
      limit: parseInt(limit),
      offset
    })

    return {
      configs,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / parseInt(limit))
      }
    }
  }

  /**
   * 根据ID获取Agent配置
   */
  async getAgentConfigById(id) {
    if (this.useMockData) {
      return await mockDataService.getAgentConfigById(id)
    }

    return await AgentConfig.findByPk(id, {
      include: [
        {
          model: AgentTemplate,
          as: 'template',
          attributes: ['id', 'name', 'type', 'iconUrl']
        },
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'username', 'avatarUrl']
        }
      ]
    })
  }

  /**
   * 创建Agent配置
   */
  async createAgentConfig(data) {
    if (this.useMockData) {
      return await mockDataService.createAgentConfig(data)
    }

    const config = await AgentConfig.create(data)
    return await this.getAgentConfigById(config.id)
  }

  /**
   * 更新Agent配置
   */
  async updateAgentConfig(id, data) {
    if (this.useMockData) {
      return await mockDataService.updateAgentConfig(id, data)
    }

    const config = await AgentConfig.findByPk(id)
    if (!config) return null
    
    await config.update(data)
    return await this.getAgentConfigById(id)
  }

  /**
   * 删除Agent配置
   */
  async deleteAgentConfig(id) {
    if (this.useMockData) {
      return await mockDataService.deleteAgentConfig(id)
    }

    const config = await AgentConfig.findByPk(id)
    if (!config) return false
    
    await config.destroy()
    return true
  }

  /**
   * 启动Agent
   */
  async startAgent(id) {
    if (this.useMockData) {
      return await mockDataService.startAgent(id)
    }

    const config = await AgentConfig.findByPk(id)
    if (!config) return null
    
    await config.update({
      status: 'running',
      lastRunAt: new Date()
    })
    
    return { success: true, message: 'Agent启动成功' }
  }

  /**
   * 停止Agent
   */
  async stopAgent(id) {
    if (this.useMockData) {
      return await mockDataService.stopAgent(id)
    }

    const config = await AgentConfig.findByPk(id)
    if (!config) return null
    
    await config.update({
      status: 'stopped'
    })
    
    return { success: true, message: 'Agent停止成功' }
  }

  // ==================== 工作流相关 ====================
  
  /**
   * 获取工作流列表
   */
  async getWorkflows(filters = {}, pagination = {}) {
    if (this.useMockData) {
      const workflows = await mockDataService.getWorkflows(filters)
      const { page = 1, limit = 10 } = pagination
      const { offset } = this.buildPaginationParams(page, limit)
      
      return {
        workflows: workflows.slice(offset, offset + parseInt(limit)),
        pagination: {
          total: workflows.length,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(workflows.length / parseInt(limit))
        }
      }
    }

    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = pagination
    const { offset } = this.buildPaginationParams(page, limit)
    const order = this.buildOrderParams(sortBy, sortOrder)
    
    const where = {}
    if (filters.status) where.status = filters.status
    if (filters.authorId) where.authorId = filters.authorId
    if (filters.q) Object.assign(where, this.buildSearchCondition(filters.q, ['name', 'description']))

    const { count, rows: workflows } = await Workflow.findAndCountAll({
      where,
      include: [{
        model: User,
        as: 'author',
        attributes: ['id', 'username', 'avatarUrl']
      }],
      order,
      limit: parseInt(limit),
      offset
    })

    return {
      workflows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / parseInt(limit))
      }
    }
  }

  /**
   * 根据ID获取工作流
   */
  async getWorkflowById(id) {
    if (this.useMockData) {
      return await mockDataService.getWorkflowById(id)
    }

    return await Workflow.findByPk(id, {
      include: [{
        model: User,
        as: 'author',
        attributes: ['id', 'username', 'avatarUrl']
      }]
    })
  }

  /**
   * 创建工作流
   */
  async createWorkflow(data) {
    if (this.useMockData) {
      return await mockDataService.createWorkflow(data)
    }

    const workflow = await Workflow.create(data)
    return await this.getWorkflowById(workflow.id)
  }

  /**
   * 更新工作流
   */
  async updateWorkflow(id, data) {
    if (this.useMockData) {
      return await mockDataService.updateWorkflow(id, data)
    }

    const workflow = await Workflow.findByPk(id)
    if (!workflow) return null
    
    await workflow.update(data)
    return await this.getWorkflowById(id)
  }

  /**
   * 删除工作流
   */
  async deleteWorkflow(id) {
    if (this.useMockData) {
      return await mockDataService.deleteWorkflow(id)
    }

    const workflow = await Workflow.findByPk(id)
    if (!workflow) return false
    
    await workflow.destroy()
    return true
  }

  // ==================== 能力相关 ====================
  
  /**
   * 获取能力列表
   */
  async getCapabilities(filters = {}, pagination = {}) {
    if (this.useMockData) {
      const capabilities = await mockDataService.getCapabilities(filters)
      const { page = 1, limit = 10 } = pagination
      const { offset } = this.buildPaginationParams(page, limit)
      
      return {
        capabilities: capabilities.slice(offset, offset + parseInt(limit)),
        pagination: {
          total: capabilities.length,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(capabilities.length / parseInt(limit))
        }
      }
    }

    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = pagination
    const { offset } = this.buildPaginationParams(page, limit)
    const order = this.buildOrderParams(sortBy, sortOrder)
    
    const where = {}
    if (filters.type) where.type = filters.type
    if (filters.category) where.category = filters.category
    if (filters.isPublic !== undefined) where.isPublic = filters.isPublic
    if (filters.authorId) where.authorId = filters.authorId
    if (filters.q) Object.assign(where, this.buildSearchCondition(filters.q, ['name', 'description']))

    const { count, rows: capabilities } = await Capability.findAndCountAll({
      where,
      include: [{
        model: User,
        as: 'author',
        attributes: ['id', 'username', 'avatarUrl']
      }],
      order,
      limit: parseInt(limit),
      offset
    })

    return {
      capabilities,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / parseInt(limit))
      }
    }
  }

  /**
   * 根据ID获取能力
   */
  async getCapabilityById(id) {
    if (this.useMockData) {
      return await mockDataService.getCapabilityById(id)
    }

    return await Capability.findByPk(id, {
      include: [{
        model: User,
        as: 'author',
        attributes: ['id', 'username', 'avatarUrl']
      }]
    })
  }

  // ==================== 组件相关 ====================
  
  /**
   * 获取组件列表
   */
  async getComponents(filters = {}, pagination = {}) {
    if (this.useMockData) {
      const components = await mockDataService.getComponents(filters)
      const { page = 1, limit = 10 } = pagination
      const { offset } = this.buildPaginationParams(page, limit)
      
      return {
        components: components.slice(offset, offset + parseInt(limit)),
        pagination: {
          total: components.length,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(components.length / parseInt(limit))
        }
      }
    }

    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = pagination
    const { offset } = this.buildPaginationParams(page, limit)
    const order = this.buildOrderParams(sortBy, sortOrder)
    
    const where = {}
    if (filters.type) where.type = filters.type
    if (filters.category) where.category = filters.category
    if (filters.isPublic !== undefined) where.isPublic = filters.isPublic
    if (filters.authorId) where.authorId = filters.authorId
    if (filters.q) Object.assign(where, this.buildSearchCondition(filters.q, ['name', 'description']))

    const { count, rows: components } = await Component.findAndCountAll({
      where,
      include: [{
        model: User,
        as: 'author',
        attributes: ['id', 'username', 'avatarUrl']
      }],
      order,
      limit: parseInt(limit),
      offset
    })

    return {
      components,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / parseInt(limit))
      }
    }
  }

  /**
   * 根据ID获取组件
   */
  async getComponentById(id) {
    if (this.useMockData) {
      return await mockDataService.getComponentById(id)
    }

    return await Component.findByPk(id, {
      include: [{
        model: User,
        as: 'author',
        attributes: ['id', 'username', 'avatarUrl']
      }]
    })
  }

  // ==================== Agent实例相关 ====================
  
  /**
   * 获取Agent实例列表
   */
  async getAgents(filters = {}, pagination = {}) {
    if (this.useMockData) {
      const agents = await mockDataService.getAgentInstances(filters)
      const { page = 1, limit = 10 } = pagination
      const { offset } = this.buildPaginationParams(page, limit)
      
      return {
        agents: agents.slice(offset, offset + parseInt(limit)),
        pagination: {
          total: agents.length,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(agents.length / parseInt(limit))
        }
      }
    }

    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = pagination
    const { offset } = this.buildPaginationParams(page, limit)
    const order = this.buildOrderParams(sortBy, sortOrder)
    
    const where = {}
    if (filters.status) where.status = filters.status
    if (filters.configId) where.configId = filters.configId
    if (filters.environment) where.environment = filters.environment
    if (filters.ownerId) where.ownerId = filters.ownerId
    if (filters.q) Object.assign(where, this.buildSearchCondition(filters.q, ['name', 'description']))

    const { count, rows: agents } = await AgentInstance.findAndCountAll({
      where,
      include: [
        {
          model: AgentConfig,
          as: 'config',
          attributes: ['id', 'name', 'type'],
          include: [{
            model: AgentTemplate,
            as: 'template',
            attributes: ['id', 'name', 'iconUrl']
          }]
        },
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'username', 'avatarUrl']
        }
      ],
      order,
      limit: parseInt(limit),
      offset
    })

    return {
      agents,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / parseInt(limit))
      }
    }
  }

  /**
   * 根据ID获取Agent实例
   */
  async getAgentById(id) {
    if (this.useMockData) {
      return await mockDataService.getAgentInstanceById(id)
    }

    return await AgentInstance.findByPk(id, {
      include: [
        {
          model: AgentConfig,
          as: 'config',
          include: [{
            model: AgentTemplate,
            as: 'template'
          }]
        },
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'username', 'avatarUrl']
        }
      ]
    })
  }

  /**
   * 创建Agent实例
   */
  async createAgent(data) {
    if (this.useMockData) {
      return await mockDataService.createAgentInstance(data)
    }

    const agent = await AgentInstance.create(data)
    return await this.getAgentById(agent.id)
  }

  /**
   * 更新Agent实例
   */
  async updateAgent(id, data) {
    if (this.useMockData) {
      return await mockDataService.updateAgentInstance(id, data)
    }

    const agent = await AgentInstance.findByPk(id)
    if (!agent) return null
    
    await agent.update(data)
    return await this.getAgentById(id)
  }

  /**
   * 删除Agent实例
   */
  async deleteAgent(id) {
    if (this.useMockData) {
      return await mockDataService.deleteAgentInstance(id)
    }

    const agent = await AgentInstance.findByPk(id)
    if (!agent) return false
    
    await agent.destroy()
    return true
  }

  /**
   * 启动Agent实例
   */
  async startAgentInstance(id) {
    if (this.useMockData) {
      return await mockDataService.startAgentInstance(id)
    }

    const agent = await AgentInstance.findByPk(id)
    if (!agent) return null
    
    await agent.update({
      status: 'running',
      startedAt: new Date(),
      stoppedAt: null
    })
    
    return { success: true, message: 'Agent启动成功' }
  }

  /**
   * 停止Agent实例
   */
  async stopAgentInstance(id) {
    if (this.useMockData) {
      return await mockDataService.stopAgentInstance(id)
    }

    const agent = await AgentInstance.findByPk(id)
    if (!agent) return null
    
    await agent.update({
      status: 'stopped',
      stoppedAt: new Date()
    })
    
    return { success: true, message: 'Agent停止成功' }
  }

  /**
   * 重启Agent实例
   */
  async restartAgentInstance(id) {
    if (this.useMockData) {
      return await mockDataService.restartAgentInstance(id)
    }

    const agent = await AgentInstance.findByPk(id)
    if (!agent) return null
    
    await agent.update({
      status: 'running',
      startedAt: new Date(),
      stoppedAt: null
    })
    
    return { success: true, message: 'Agent重启成功' }
  }

  /**
   * 暂停Agent实例
   */
  async pauseAgentInstance(id) {
    if (this.useMockData) {
      return await mockDataService.pauseAgentInstance(id)
    }

    const agent = await AgentInstance.findByPk(id)
    if (!agent) return null
    
    await agent.update({
      status: 'paused'
    })
    
    return { success: true, message: 'Agent暂停成功' }
  }

  /**
   * 获取Agent实例列表（兼容旧接口）
   */
  async getAgentInstances(filters = {}, pagination = {}) {
    if (this.useMockData) {
      const instances = await mockDataService.getAgentInstances(filters)
      const { page = 1, limit = 10 } = pagination
      const { offset } = this.buildPaginationParams(page, limit)
      
      return {
        instances: instances.slice(offset, offset + parseInt(limit)),
        pagination: {
          total: instances.length,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(instances.length / parseInt(limit))
        }
      }
    }

    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = pagination
    const { offset } = this.buildPaginationParams(page, limit)
    const order = this.buildOrderParams(sortBy, sortOrder)
    
    const where = {}
    if (filters.status) where.status = filters.status
    if (filters.configId) where.configId = filters.configId

    const { count, rows: instances } = await AgentInstance.findAndCountAll({
      where,
      include: [{
        model: AgentConfig,
        as: 'config',
        attributes: ['id', 'name', 'type'],
        include: [{
          model: AgentTemplate,
          as: 'template',
          attributes: ['id', 'name', 'iconUrl']
        }]
      }],
      order,
      limit: parseInt(limit),
      offset
    })

    return {
      instances,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / parseInt(limit))
      }
    }
  }

  /**
   * 获取性能指标
   */
  async getPerformanceMetrics(filters = {}, pagination = {}) {
    if (this.useMockData) {
      const metrics = await mockDataService.getPerformanceMetrics(filters)
      const { page = 1, limit = 50 } = pagination
      const { offset } = this.buildPaginationParams(page, limit)
      
      return {
        metrics: metrics.slice(offset, offset + parseInt(limit)),
        pagination: {
          total: metrics.length,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(metrics.length / parseInt(limit))
        }
      }
    }

    const { page = 1, limit = 50, sortBy = 'timestamp', sortOrder = 'desc' } = pagination
    const { offset } = this.buildPaginationParams(page, limit)
    const order = this.buildOrderParams(sortBy, sortOrder)
    
    const where = {}
    if (filters.agentId) where.agentId = filters.agentId
    if (filters.metricType) where.metricType = filters.metricType
    if (filters.startTime) where.timestamp = { [Op.gte]: filters.startTime }
    if (filters.endTime) {
      where.timestamp = where.timestamp || {}
      where.timestamp[Op.lte] = filters.endTime
    }

    const { count, rows: metrics } = await PerformanceMetric.findAndCountAll({
      where,
      include: [{
        model: AgentInstance,
        as: 'agent',
        attributes: ['id', 'name']
      }],
      order,
      limit: parseInt(limit),
      offset
    })

    return {
      metrics,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / parseInt(limit))
      }
    }
  }

  /**
   * 获取系统日志
   */
  async getSystemLogs(filters = {}, pagination = {}) {
    if (this.useMockData) {
      const logs = await mockDataService.getSystemLogs(filters)
      const { page = 1, limit = 50 } = pagination
      const { offset } = this.buildPaginationParams(page, limit)
      
      return {
        logs: logs.slice(offset, offset + parseInt(limit)),
        pagination: {
          total: logs.length,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(logs.length / parseInt(limit))
        }
      }
    }

    const { page = 1, limit = 50, sortBy = 'timestamp', sortOrder = 'desc' } = pagination
    const { offset } = this.buildPaginationParams(page, limit)
    const order = this.buildOrderParams(sortBy, sortOrder)
    
    const where = {}
    if (filters.agentId) where.agentId = filters.agentId
    if (filters.level) where.level = filters.level
    if (filters.module) where.module = filters.module
    if (filters.startTime) where.timestamp = { [Op.gte]: filters.startTime }
    if (filters.endTime) {
      where.timestamp = where.timestamp || {}
      where.timestamp[Op.lte] = filters.endTime
    }

    const { count, rows: logs } = await SystemLog.findAndCountAll({
      where,
      include: [{
        model: AgentInstance,
        as: 'agent',
        attributes: ['id', 'name'],
        required: false
      }],
      order,
      limit: parseInt(limit),
      offset
    })

    return {
      logs,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / parseInt(limit))
      }
    }
  }

  /**
   * 获取消息列表
   */
  async getMessages(filters = {}, pagination = {}) {
    if (this.useMockData) {
      const messages = await mockDataService.getMessages(filters)
      const { page = 1, limit = 50 } = pagination
      const { offset } = this.buildPaginationParams(page, limit)
      
      return {
        messages: messages.slice(offset, offset + parseInt(limit)),
        pagination: {
          total: messages.length,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(messages.length / parseInt(limit))
        }
      }
    }

    const { page = 1, limit = 50, sortBy = 'timestamp', sortOrder = 'desc' } = pagination
    const { offset } = this.buildPaginationParams(page, limit)
    const order = this.buildOrderParams(sortBy, sortOrder)
    
    const where = {}
    if (filters.agentId) where.agentId = filters.agentId
    if (filters.direction) where.direction = filters.direction
    if (filters.startTime) where.timestamp = { [Op.gte]: filters.startTime }
    if (filters.endTime) {
      where.timestamp = where.timestamp || {}
      where.timestamp[Op.lte] = filters.endTime
    }

    const { count, rows: messages } = await Message.findAndCountAll({
      where,
      include: [{
        model: AgentInstance,
        as: 'agent',
        attributes: ['id', 'name']
      }],
      order,
      limit: parseInt(limit),
      offset
    })

    return {
      messages,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / parseInt(limit))
      }
    }
  }

  // ==================== 统计相关 ====================
  
  /**
   * 获取统计数据
   */
  async getStatistics() {
    if (this.useMockData) {
      return {
        totalTemplates: this.mockDataService.agentTemplates.length,
        totalConfigs: this.mockDataService.agentConfigs.length,
        totalWorkflows: this.mockDataService.workflows.length,
        totalCapabilities: this.mockDataService.capabilities.length,
        runningAgents: this.mockDataService.agentConfigs.filter(c => c.status === 'running').length,
        activeWorkflows: this.mockDataService.workflows.filter(w => w.status === 'active').length
      }
    }

    const [totalTemplates, totalConfigs, totalWorkflows, totalCapabilities, runningAgents, activeWorkflows] = await Promise.all([
      AgentTemplate.count(),
      AgentConfig.count(),
      Workflow.count(),
      Capability.count(),
      AgentConfig.count({ where: { status: 'running' } }),
      Workflow.count({ where: { status: 'active' } })
    ])

    return {
      totalTemplates,
      totalConfigs,
      totalWorkflows,
      totalCapabilities,
      runningAgents,
      activeWorkflows
    }
  }

  // ==================== 系统配置相关 ====================
  
  /**
   * 获取系统配置
   */
  async getSystemConfig() {
    if (this.useMockData) {
      return await mockDataService.getSystemConfig()
    }

    const settings = await SystemSetting.findAll()
    const config = {
      general: {},
      security: {},
      features: {},
      limits: {},
      models: {}
    }

    // 将数据库中的设置转换为配置对象
    settings.forEach(setting => {
      const keys = setting.key.split('.')
      let current = config
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) current[keys[i]] = {}
        current = current[keys[i]]
      }
      current[keys[keys.length - 1]] = setting.value
    })

    // 如果没有配置，返回默认配置
    if (settings.length === 0) {
      return this.getDefaultSystemConfig()
    }

    return config
  }

  /**
   * 更新系统配置
   */
  async updateSystemConfig(config, userId) {
    if (this.useMockData) {
      return await mockDataService.updateSystemConfig(config, userId)
    }

    // 将配置对象扁平化为键值对
    const flattenConfig = (obj, prefix = '') => {
      const result = []
      for (const [key, value] of Object.entries(obj)) {
        const fullKey = prefix ? `${prefix}.${key}` : key
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          result.push(...flattenConfig(value, fullKey))
        } else {
          result.push({ key: fullKey, value })
        }
      }
      return result
    }

    const settings = flattenConfig(config)
    
    // 批量更新或创建设置
    for (const setting of settings) {
      await SystemSetting.upsert({
        key: setting.key,
        value: setting.value,
        updatedBy: userId,
        updatedAt: new Date()
      })
    }

    logger.info('系统配置已更新', { userId, settingsCount: settings.length })
    return await this.getSystemConfig()
  }

  /**
   * 获取默认系统配置
   */
  getDefaultSystemConfig() {
    return {
      general: {
        siteName: 'EFIAgent',
        siteDescription: 'AI Agent Platform',
        allowRegistration: true,
        defaultUserRole: 'user',
        timezone: 'Asia/Shanghai',
        language: 'zh-CN'
      },
      security: {
        jwtExpiration: '24h',
        refreshTokenExpiration: '7d',
        passwordMinLength: 8,
        maxLoginAttempts: 5,
        enableTwoFactor: false,
        sessionTimeout: 3600
      },
      features: {
        enableWorkflows: true,
        enableComponents: true,
        enableMonitoring: true,
        enableVersionControl: true,
        enableCollaboration: false
      },
      limits: {
        maxAgentsPerUser: 50,
        maxWorkflowsPerUser: 20,
        maxExecutionsPerDay: 1000,
        maxFileSize: 10485760, // 10MB
        maxConcurrentExecutions: 10
      },
      models: {
        defaultProvider: 'openai',
        providers: {
          openai: {
            enabled: true,
            apiKey: '',
            baseUrl: 'https://api.openai.com/v1',
            models: {
              'gpt-4': {
                enabled: true,
                maxTokens: 8192,
                temperature: 0.7,
                costPer1kTokens: 0.03
              },
              'gpt-3.5-turbo': {
                enabled: true,
                maxTokens: 4096,
                temperature: 0.7,
                costPer1kTokens: 0.002
              }
            }
          },
          azure: {
            enabled: false,
            apiKey: '',
            endpoint: '',
            apiVersion: '2023-12-01-preview',
            models: {}
          },
          anthropic: {
            enabled: false,
            apiKey: '',
            baseUrl: 'https://api.anthropic.com',
            models: {
              'claude-3-opus': {
                enabled: false,
                maxTokens: 4096,
                temperature: 0.7,
                costPer1kTokens: 0.015
              }
            }
          },
          local: {
            enabled: false,
            baseUrl: 'http://localhost:11434',
            models: {}
          }
        }
      }
    }
  }

  /**
   * 获取模型配置
   */
  async getModelConfigs() {
    const systemConfig = await this.getSystemConfig()
    return systemConfig.models || this.getDefaultSystemConfig().models
  }

  /**
   * 更新模型配置
   */
  async updateModelConfigs(modelConfigs, userId) {
    const currentConfig = await this.getSystemConfig()
    currentConfig.models = modelConfigs
    return await this.updateSystemConfig(currentConfig, userId)
  }

  /**
   * 测试模型连接
   */
  async testModelConnection(provider, modelConfig) {
    if (this.useMockData) {
      return await mockDataService.testModelConnection(provider, modelConfig)
    }

    try {
      // 这里应该实现实际的模型连接测试逻辑
      // 暂时返回模拟结果
      return {
        success: true,
        latency: Math.floor(Math.random() * 1000) + 100,
        message: '连接测试成功'
      }
    } catch (error) {
      logger.error('模型连接测试失败', { provider, error: error.message })
      return {
        success: false,
        error: error.message,
        message: '连接测试失败'
      }
    }
  }
}

// 创建单例实例
const dataService = new DataService()

module.exports = dataService