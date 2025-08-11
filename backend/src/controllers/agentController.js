const dataService = require('../services/dataService')
const { cache, CacheKeys } = require('../utils/redis')
const logger = require('../utils/logger')
const { 
  createValidationError, 
  createBusinessError,
  createNotFoundError,
  createPermissionError,
  handleResult 
} = require('../middleware/errorHandler')

/**
 * 获取Agent实例列表
 * 支持分页、排序、搜索和过滤
 */
const getAgents = handleResult(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    q = '',
    status = '',
    templateId = '',
    userId = ''
  } = req.query
  
  // 构建过滤条件
  const filters = {}
  
  if (q) {
    filters.q = q
  }
  
  if (status) {
    filters.status = status
  }
  
  if (templateId) {
    filters.templateId = templateId
  }
  
  // 非管理员只能查看自己的Agent
  if (req.user.role !== 'admin') {
    filters.userId = req.user.id
  } else if (userId) {
    filters.userId = userId
  }
  
  // 构建分页参数
  const pagination = {
    page: parseInt(page),
    limit: parseInt(limit),
    sortBy,
    sortOrder
  }
  
  const result = await dataService.getAgents(filters, pagination)
  
  return result
})

/**
 * 获取单个Agent实例详情
 */
const getAgent = handleResult(async (req, res) => {
  const { id } = req.params
  
  const agent = await dataService.getAgentById(id)
  
  if (!agent) {
    throw createNotFoundError('Agent实例')
  }
  
  // 权限检查：非管理员只能查看自己的Agent
  if (req.user.role !== 'admin' && agent.userId !== req.user.id) {
    throw createPermissionError('无权访问此Agent实例')
  }
  
  return { agent }
})

/**
 * 创建Agent实例
 */
const createAgent = handleResult(async (req, res) => {
  const { name, description, templateId, config = {} } = req.body
  
  // 验证模板是否存在
  const template = await dataService.getAgentTemplateById(templateId)
  if (!template) {
    throw createNotFoundError('Agent模板')
  }
  
  // 检查模板访问权限
  if (template.visibility === 'private' && template.userId !== req.user.id && req.user.role !== 'admin') {
    throw createPermissionError('无权使用此模板')
  }
  
  // 创建Agent数据
  const agentData = {
    name,
    description,
    templateId,
    userId: req.user.id,
    config,
    status: 'stopped',
    createdAt: new Date(),
    updatedAt: new Date()
  }
  
  const agent = await dataService.createAgent(agentData)
  
  logger.info(`用户 ${req.user.id} 创建了Agent实例 ${agent.id}`)
  
  return { agent }
})

/**
 * 更新Agent实例
 */
const updateAgent = handleResult(async (req, res) => {
  const { id } = req.params
  const { name, description, config } = req.body
  
  const agent = await dataService.getAgentById(id)
  if (!agent) {
    throw createNotFoundError('Agent实例')
  }
  
  // 权限检查：非管理员只能修改自己的Agent
  if (req.user.role !== 'admin' && agent.userId !== req.user.id) {
    throw createPermissionError('无权修改此Agent实例')
  }
  
  // 检查Agent状态，运行中的Agent不能修改配置
  if (agent.status === 'running' && config) {
    throw createBusinessError('运行中的Agent不能修改配置，请先停止Agent')
  }
  
  // 更新Agent信息
  const updateData = { updatedAt: new Date() }
  if (name !== undefined) updateData.name = name
  if (description !== undefined) updateData.description = description
  if (config !== undefined) updateData.config = config
  
  const updatedAgent = await dataService.updateAgent(id, updateData)
  
  // 清除缓存
  await cache.del(CacheKeys.agent(id))
  
  logger.info(`用户 ${req.user.id} 更新了Agent实例 ${id}`)
  
  return { agent: updatedAgent }
})

/**
 * 删除Agent实例
 */
const deleteAgent = handleResult(async (req, res) => {
  const { id } = req.params
  
  const agent = await dataService.getAgentById(id)
  if (!agent) {
    throw createNotFoundError('Agent实例')
  }
  
  // 权限检查：非管理员只能删除自己的Agent
  if (req.user.role !== 'admin' && agent.userId !== req.user.id) {
    throw createPermissionError('无权删除此Agent实例')
  }
  
  // 检查Agent状态，运行中的Agent不能删除
  if (agent.status === 'running') {
    throw createBusinessError('运行中的Agent不能删除，请先停止Agent')
  }
  
  await dataService.deleteAgent(id)
  
  // 清除相关缓存
  await Promise.all([
    cache.del(CacheKeys.agent(id)),
    cache.del(CacheKeys.agentMetrics(id))
  ])
  
  logger.info(`用户 ${req.user.id} 删除了Agent实例 ${id}`)
  
  return {
    message: 'Agent实例删除成功'
  }
})

/**
 * 启动Agent实例
 */
const startAgent = handleResult(async (req, res) => {
  const { id } = req.params
  
  const agent = await dataService.getAgentById(id)
  if (!agent) {
    throw createNotFoundError('Agent实例')
  }
  
  // 权限检查
  if (req.user.role !== 'admin' && agent.userId !== req.user.id) {
    throw createPermissionError('无权操作此Agent实例')
  }
  
  // 检查Agent状态
  if (agent.status === 'running') {
    throw createBusinessError('Agent已经在运行中')
  }
  
  // 更新状态为启动中
  await dataService.updateAgent(id, { 
    status: 'starting',
    lastStartedAt: new Date(),
    updatedAt: new Date()
  })
  
  try {
    // 这里应该调用实际的Agent启动逻辑
    // 暂时模拟启动过程
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // 更新状态为运行中
    const updatedAgent = await dataService.updateAgent(id, { 
      status: 'running',
      updatedAt: new Date()
    })
    
    // 清除缓存
    await cache.del(CacheKeys.agent(id))
    
    logger.info(`用户 ${req.user.id} 启动了Agent实例 ${id}`)
    
    return { 
      agent: updatedAgent,
      message: 'Agent启动成功'
    }
  } catch (error) {
    // 启动失败，更新状态
    await dataService.updateAgent(id, { 
      status: 'error',
      lastError: error.message,
      updatedAt: new Date()
    })
    
    logger.error(`Agent ${id} 启动失败: ${error.message}`)
    throw createBusinessError(`Agent启动失败: ${error.message}`)
  }
})

/**
 * 停止Agent实例
 */
const stopAgent = handleResult(async (req, res) => {
  const { id } = req.params
  
  const agent = await dataService.getAgentById(id)
  if (!agent) {
    throw createNotFoundError('Agent实例')
  }
  
  // 权限检查
  if (req.user.role !== 'admin' && agent.userId !== req.user.id) {
    throw createPermissionError('无权操作此Agent实例')
  }
  
  // 检查Agent状态
  if (agent.status === 'stopped') {
    throw createBusinessError('Agent已经停止')
  }
  
  // 更新状态为停止中
  await dataService.updateAgent(id, { 
    status: 'stopping',
    updatedAt: new Date()
  })
  
  try {
    // 这里应该调用实际的Agent停止逻辑
    // 暂时模拟停止过程
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // 更新状态为已停止
    const updatedAgent = await dataService.updateAgent(id, { 
      status: 'stopped',
      lastStoppedAt: new Date(),
      updatedAt: new Date()
    })
    
    // 清除缓存
    await cache.del(CacheKeys.agent(id))
    
    logger.info(`用户 ${req.user.id} 停止了Agent实例 ${id}`)
    
    return { 
      agent: updatedAgent,
      message: 'Agent停止成功'
    }
  } catch (error) {
    // 停止失败，恢复状态
    await dataService.updateAgent(id, { 
      status: 'running',
      lastError: error.message,
      updatedAt: new Date()
    })
    
    logger.error(`Agent ${id} 停止失败: ${error.message}`)
    throw createBusinessError(`Agent停止失败: ${error.message}`)
  }
})

/**
 * 重启Agent实例
 */
const restartAgent = handleResult(async (req, res) => {
  const { id } = req.params
  
  const agent = await dataService.getAgentById(id)
  if (!agent) {
    throw createNotFoundError('Agent实例')
  }
  
  // 权限检查
  if (req.user.role !== 'admin' && agent.userId !== req.user.id) {
    throw createPermissionError('无权操作此Agent实例')
  }
  
  // 先停止再启动
  if (agent.status === 'running') {
    await dataService.updateAgent(id, { 
      status: 'stopping',
      updatedAt: new Date()
    })
    
    // 模拟停止过程
    await new Promise(resolve => setTimeout(resolve, 500))
  }
  
  // 启动Agent
  await dataService.updateAgent(id, { 
    status: 'starting',
    lastStartedAt: new Date(),
    updatedAt: new Date()
  })
  
  try {
    // 模拟启动过程
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const updatedAgent = await dataService.updateAgent(id, { 
      status: 'running',
      updatedAt: new Date()
    })
    
    await cache.del(CacheKeys.agent(id))
    
    logger.info(`用户 ${req.user.id} 重启了Agent实例 ${id}`)
    
    return { 
      agent: updatedAgent,
      message: 'Agent重启成功'
    }
  } catch (error) {
    await dataService.updateAgent(id, { 
      status: 'error',
      lastError: error.message,
      updatedAt: new Date()
    })
    
    throw createBusinessError(`Agent重启失败: ${error.message}`)
  }
})

/**
 * 暂停Agent实例
 */
const pauseAgent = handleResult(async (req, res) => {
  const { id } = req.params
  
  const agent = await dataService.getAgentById(id)
  if (!agent) {
    throw createNotFoundError('Agent实例')
  }
  
  // 权限检查
  if (req.user.role !== 'admin' && agent.userId !== req.user.id) {
    throw createPermissionError('无权操作此Agent实例')
  }
  
  if (agent.status !== 'running') {
    throw createBusinessError('只能暂停运行中的Agent')
  }
  
  const updatedAgent = await dataService.updateAgent(id, { 
    status: 'paused',
    lastPausedAt: new Date(),
    updatedAt: new Date()
  })
  
  await cache.del(CacheKeys.agent(id))
  
  logger.info(`用户 ${req.user.id} 暂停了Agent实例 ${id}`)
  
  return { 
    agent: updatedAgent,
    message: 'Agent暂停成功'
  }
})

/**
 * 克隆Agent实例
 */
const cloneAgent = handleResult(async (req, res) => {
  const { id } = req.params
  const { name } = req.body
  
  const agent = await dataService.getAgentById(id)
  if (!agent) {
    throw createNotFoundError('Agent实例')
  }
  
  // 权限检查
  if (req.user.role !== 'admin' && agent.userId !== req.user.id) {
    throw createPermissionError('无权克隆此Agent实例')
  }
  
  // 创建克隆数据
  const cloneData = {
    name: name || `${agent.name} (副本)`,
    description: agent.description,
    templateId: agent.templateId,
    userId: req.user.id,
    config: { ...agent.config },
    status: 'stopped',
    createdAt: new Date(),
    updatedAt: new Date()
  }
  
  const clonedAgent = await dataService.createAgent(cloneData)
  
  logger.info(`用户 ${req.user.id} 克隆了Agent实例 ${id} 为 ${clonedAgent.id}`)
  
  return { 
    agent: clonedAgent,
    message: 'Agent克隆成功'
  }
})

/**
 * 批量操作Agent实例
 */
const batchOperateAgents = handleResult(async (req, res) => {
  const { agentIds, action } = req.body
  
  if (!Array.isArray(agentIds) || agentIds.length === 0) {
    throw createValidationError('Agent ID列表不能为空')
  }
  
  // 验证所有Agent是否存在且有权限操作
  const agents = await Promise.all(
    agentIds.map(id => dataService.getAgentById(id))
  )
  
  if (agents.some(agent => !agent)) {
    throw createValidationError('部分Agent不存在')
  }
  
  // 权限检查
  const unauthorizedAgents = agents.filter(agent => 
    req.user.role !== 'admin' && agent.userId !== req.user.id
  )
  
  if (unauthorizedAgents.length > 0) {
    throw createPermissionError('无权操作部分Agent实例')
  }
  
  let successCount = 0
  let failureCount = 0
  const results = []
  
  for (const agent of agents) {
    try {
      let updateData = { updatedAt: new Date() }
      
      switch (action) {
        case 'start':
          if (agent.status === 'stopped' || agent.status === 'paused') {
            updateData.status = 'running'
            updateData.lastStartedAt = new Date()
          }
          break
        case 'stop':
          if (agent.status === 'running' || agent.status === 'paused') {
            updateData.status = 'stopped'
            updateData.lastStoppedAt = new Date()
          }
          break
        case 'delete':
          if (agent.status !== 'running') {
            await dataService.deleteAgent(agent.id)
            await cache.del(CacheKeys.agent(agent.id))
            successCount++
            results.push({ id: agent.id, success: true })
            continue
          } else {
            throw new Error('运行中的Agent不能删除')
          }
        default:
          throw new Error('无效的操作类型')
      }
      
      if (action !== 'delete') {
        await dataService.updateAgent(agent.id, updateData)
        await cache.del(CacheKeys.agent(agent.id))
      }
      
      successCount++
      results.push({ id: agent.id, success: true })
    } catch (error) {
      failureCount++
      results.push({ id: agent.id, success: false, error: error.message })
    }
  }
  
  logger.info(`用户 ${req.user.id} 批量操作Agent: ${action}, 成功: ${successCount}, 失败: ${failureCount}`)
  
  return {
    message: `批量操作完成，成功: ${successCount}, 失败: ${failureCount}`,
    successCount,
    failureCount,
    results
  }
})

/**
 * 获取Agent实例指标
 */
const getAgentMetrics = handleResult(async (req, res) => {
  const { id } = req.params
  const { timeRange = '1h' } = req.query
  
  const agent = await dataService.getAgentById(id)
  if (!agent) {
    throw createNotFoundError('Agent实例')
  }
  
  // 权限检查
  if (req.user.role !== 'admin' && agent.userId !== req.user.id) {
    throw createPermissionError('无权查看此Agent实例的指标')
  }
  
  // 从缓存或数据库获取指标数据
  const cacheKey = CacheKeys.agentMetrics(id)
  let metrics = await cache.get(cacheKey)
  
  if (!metrics) {
    // 模拟指标数据
    metrics = {
      cpu: Math.random() * 100,
      memory: Math.random() * 100,
      requests: Math.floor(Math.random() * 1000),
      errors: Math.floor(Math.random() * 10),
      uptime: agent.status === 'running' ? Date.now() - new Date(agent.lastStartedAt).getTime() : 0,
      lastUpdated: new Date()
    }
    
    // 缓存5分钟
    await cache.setex(cacheKey, 300, JSON.stringify(metrics))
  } else {
    metrics = JSON.parse(metrics)
  }
  
  return { metrics }
})

/**
 * 获取Agent实例日志
 */
const getAgentLogs = handleResult(async (req, res) => {
  const { id } = req.params
  const { level = 'all', limit = 100, offset = 0 } = req.query
  
  const agent = await dataService.getAgentById(id)
  if (!agent) {
    throw createNotFoundError('Agent实例')
  }
  
  // 权限检查
  if (req.user.role !== 'admin' && agent.userId !== req.user.id) {
    throw createPermissionError('无权查看此Agent实例的日志')
  }
  
  // 模拟日志数据
  const logs = [
    {
      id: 1,
      level: 'info',
      message: 'Agent started successfully',
      timestamp: new Date(Date.now() - 60000),
      source: 'system'
    },
    {
      id: 2,
      level: 'debug',
      message: 'Processing request',
      timestamp: new Date(Date.now() - 30000),
      source: 'agent'
    },
    {
      id: 3,
      level: 'warn',
      message: 'High memory usage detected',
      timestamp: new Date(),
      source: 'monitor'
    }
  ]
  
  const filteredLogs = level === 'all' ? logs : logs.filter(log => log.level === level)
  const paginatedLogs = filteredLogs.slice(offset, offset + limit)
  
  return {
    logs: paginatedLogs,
    total: filteredLogs.length,
    hasMore: offset + limit < filteredLogs.length
  }
})

module.exports = {
  getAgents,
  getAgent,
  createAgent,
  updateAgent,
  deleteAgent,
  startAgent,
  stopAgent,
  restartAgent,
  pauseAgent,
  cloneAgent,
  batchOperateAgents,
  getAgentMetrics,
  getAgentLogs
}