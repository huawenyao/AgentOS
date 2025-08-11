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

// 获取工作流列表
const getWorkflows = handleResult(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    q = '',
    status = '',
    isActive = '',
    createdBy = ''
  } = req.query
  
  // 构建过滤条件
  const filters = {}
  
  if (q) {
    filters.search = q
  }
  
  if (status) {
    filters.status = status
  }
  
  if (isActive !== '') {
    filters.isActive = isActive === 'true'
  }
  
  if (createdBy) {
    filters.ownerId = createdBy
  }
  
  // 非管理员只能看到自己创建的工作流
  if (req.user.role !== 'admin') {
    filters.ownerId = req.user.id
  }
  
  const pagination = {
    page: parseInt(page),
    limit: parseInt(limit),
    sortBy,
    sortOrder
  }
  
  const result = await dataService.getWorkflows(filters, pagination)
  
  return result
})

// 获取单个工作流
const getWorkflowById = handleResult(async (req, res) => {
  const { id } = req.params
  
  const workflow = await dataService.getWorkflowById(id)
  
  if (!workflow) {
    throw createNotFoundError('工作流')
  }
  
  // 检查访问权限
  if (workflow.ownerId !== req.user.id && req.user.role !== 'admin') {
    throw createPermissionError('无权访问此工作流')
  }
  
  return { workflow }
})

// 创建工作流
const createWorkflow = handleResult(async (req, res) => {
  const { name, description, definition, isActive = true } = req.body
  
  // 验证工作流定义
  if (!definition.nodes || !Array.isArray(definition.nodes) || definition.nodes.length === 0) {
    throw createValidationError('工作流必须包含至少一个节点')
  }
  
  if (!definition.edges || !Array.isArray(definition.edges)) {
    throw createValidationError('工作流必须包含边定义')
  }
  
  // 验证节点配置
  for (const node of definition.nodes) {
    if (!node.id || !node.type) {
      throw createValidationError('节点必须包含ID和类型')
    }
    
    // 如果是Agent节点，验证配置是否存在
    if (node.type === 'agent' && node.config && node.config.agentConfigId) {
      const agentConfig = await dataService.getAgentConfigById(node.config.agentConfigId)
      if (!agentConfig) {
        throw createValidationError(`节点 ${node.id} 引用的Agent配置不存在`)
      }
      
      // 检查Agent配置访问权限
      if (agentConfig.ownerId !== req.user.id && req.user.role !== 'admin') {
        throw createPermissionError(`无权使用节点 ${node.id} 引用的Agent配置`)
      }
    }
  }
  
  // 创建工作流
  const workflowData = {
    name,
    description,
    definition,
    status: 'draft',
    isActive,
    ownerId: req.user.id,
    executionCount: 0,
    successRate: 0
  }
  
  const workflow = await dataService.createWorkflow(workflowData)
  
  logger.info(`用户 ${req.user.id} 创建了工作流 ${workflow.id}`)
  
  return { workflow }
})

// 更新工作流
const updateWorkflow = handleResult(async (req, res) => {
  const { id } = req.params
  const { name, description, definition, isActive, status } = req.body
  
  const workflow = await dataService.getWorkflowById(id)
  if (!workflow) {
    throw createNotFoundError('工作流')
  }
  
  // 检查权限：只有创建者或管理员可以修改
  if (workflow.ownerId !== req.user.id && req.user.role !== 'admin') {
    throw createPermissionError('无权修改此工作流')
  }
  
  // 验证工作流定义（如果提供）
  if (definition) {
    if (!definition.nodes || !Array.isArray(definition.nodes) || definition.nodes.length === 0) {
      throw createValidationError('工作流必须包含至少一个节点')
    }
    
    if (!definition.edges || !Array.isArray(definition.edges)) {
      throw createValidationError('工作流必须包含边定义')
    }
    
    // 验证节点配置
    for (const node of definition.nodes) {
      if (!node.id || !node.type) {
        throw createValidationError('节点必须包含ID和类型')
      }
      
      // 如果是Agent节点，验证配置是否存在
      if (node.type === 'agent' && node.config && node.config.agentConfigId) {
        const agentConfig = await dataService.getAgentConfigById(node.config.agentConfigId)
        if (!agentConfig) {
          throw createValidationError(`节点 ${node.id} 引用的Agent配置不存在`)
        }
        
        // 检查Agent配置访问权限
        if (agentConfig.ownerId !== req.user.id && req.user.role !== 'admin') {
          throw createPermissionError(`无权使用节点 ${node.id} 引用的Agent配置`)
        }
      }
    }
  }
  
  // 更新工作流
  const updateData = {}
  if (name !== undefined) updateData.name = name
  if (description !== undefined) updateData.description = description
  if (definition !== undefined) updateData.definition = definition
  if (isActive !== undefined) updateData.isActive = isActive
  if (status !== undefined) updateData.status = status
  
  const updatedWorkflow = await dataService.updateWorkflow(id, updateData)
  
  // 清除相关缓存
  await cache.del(CacheKeys.workflow(id))
  
  logger.info(`用户 ${req.user.id} 更新了工作流 ${id}`)
  
  return { workflow: updatedWorkflow }
})

// 删除工作流
const deleteWorkflow = handleResult(async (req, res) => {
  const { id } = req.params
  
  const workflow = await dataService.getWorkflowById(id)
  if (!workflow) {
    throw createNotFoundError('工作流')
  }
  
  // 检查权限：只有创建者或管理员可以删除
  if (workflow.ownerId !== req.user.id && req.user.role !== 'admin') {
    throw createPermissionError('无权删除此工作流')
  }
  
  // 删除工作流
  const success = await dataService.deleteWorkflow(id)
  
  if (!success) {
    throw createBusinessError('删除工作流失败')
  }
  
  // 清除相关缓存
  await cache.del(CacheKeys.workflow(id))
  
  logger.info(`用户 ${req.user.id} 删除了工作流 ${id}`)
  
  return {
    message: '工作流删除成功'
  }
})

// 执行工作流
const executeWorkflow = handleResult(async (req, res) => {
  const { id } = req.params
  const { input = {}, priority = 'normal' } = req.body
  
  const workflow = await dataService.getWorkflowById(id)
  if (!workflow) {
    throw createNotFoundError('工作流')
  }
  
  // 检查访问权限
  if (workflow.ownerId !== req.user.id && req.user.role !== 'admin') {
    throw createPermissionError('无权执行此工作流')
  }
  
  if (!workflow.isActive) {
    throw createBusinessError('工作流未激活，无法执行')
  }
  
  if (workflow.status !== 'published') {
    throw createBusinessError('只有已发布的工作流才能执行')
  }
  
  // 创建执行记录
  const executionData = {
    workflowId: id,
    input,
    status: 'pending',
    priority,
    startTime: new Date(),
    executedBy: req.user.id
  }
  
  const execution = await dataService.createWorkflowExecution(executionData)
  
  // TODO: 实际的工作流执行逻辑
  // 这里只是模拟执行过程
  setTimeout(async () => {
    try {
      // 模拟执行过程
      await dataService.updateWorkflowExecution(execution.id, {
        status: 'running',
        result: {
          message: '工作流执行中...',
          progress: 0
        }
      })
      
      // 模拟执行完成
      setTimeout(async () => {
        const success = Math.random() > 0.2 // 80%成功率
        await dataService.updateWorkflowExecution(execution.id, {
          status: success ? 'completed' : 'failed',
          endTime: new Date(),
          result: {
            success,
            message: success ? '工作流执行成功' : '工作流执行失败',
            output: success ? { result: '执行结果' } : null,
            error: success ? null : '模拟执行错误'
          }
        })
      }, 3000)
    } catch (error) {
      logger.error('工作流执行错误:', error)
      await dataService.updateWorkflowExecution(execution.id, {
        status: 'failed',
        endTime: new Date(),
        result: {
          success: false,
          error: error.message
        }
      })
    }
  }, 1000)
  
  logger.info(`用户 ${req.user.id} 执行了工作流 ${id}`)
  
  return {
    execution: {
      id: execution.id,
      workflowId: id,
      status: execution.status,
      startTime: execution.startTime,
      priority: execution.priority
    }
  }
})

// 获取工作流执行历史
const getWorkflowExecutions = handleResult(async (req, res) => {
  const { id } = req.params
  const {
    page = 1,
    limit = 10,
    status = '',
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query
  
  const workflow = await dataService.getWorkflowById(id)
  if (!workflow) {
    throw createNotFoundError('工作流')
  }
  
  // 检查访问权限
  if (workflow.ownerId !== req.user.id && req.user.role !== 'admin') {
    throw createPermissionError('无权查看此工作流的执行历史')
  }
  
  const filters = { workflowId: id }
  if (status) {
    filters.status = status
  }
  
  const pagination = {
    page: parseInt(page),
    limit: parseInt(limit),
    sortBy,
    sortOrder
  }
  
  const result = await dataService.getWorkflowExecutions(filters, pagination)
  
  return result
})

// 获取执行详情
const getExecutionDetail = handleResult(async (req, res) => {
  const { id, executionId } = req.params
  
  const execution = await dataService.getWorkflowExecutionById(executionId)
  
  if (!execution || execution.workflowId !== id) {
    throw createNotFoundError('执行记录')
  }
  
  // 获取工作流信息以检查权限
  const workflow = await dataService.getWorkflowById(id)
  if (!workflow) {
    throw createNotFoundError('工作流')
  }
  
  // 检查访问权限
  if (workflow.ownerId !== req.user.id && req.user.role !== 'admin') {
    throw createPermissionError('无权查看此执行记录')
  }
  
  return { execution }
})

// 停止工作流执行
const stopExecution = handleResult(async (req, res) => {
  const { id, executionId } = req.params
  
  const execution = await dataService.getWorkflowExecutionById(executionId)
  
  if (!execution || execution.workflowId !== id) {
    throw createNotFoundError('执行记录')
  }
  
  // 获取工作流信息以检查权限
  const workflow = await dataService.getWorkflowById(id)
  if (!workflow) {
    throw createNotFoundError('工作流')
  }
  
  // 检查权限
  if (workflow.ownerId !== req.user.id && req.user.role !== 'admin') {
    throw createPermissionError('无权停止此执行')
  }
  
  if (!['pending', 'running'].includes(execution.status)) {
    throw createBusinessError('只能停止正在执行或等待中的任务')
  }
  
  await dataService.updateWorkflowExecution(executionId, {
    status: 'cancelled',
    endTime: new Date(),
    result: {
      success: false,
      message: '执行被用户取消',
      cancelledBy: req.user.id
    }
  })
  
  logger.info(`用户 ${req.user.id} 停止了工作流执行 ${executionId}`)
  
  return {
    message: '执行已停止'
  }
})

// 获取工作流统计信息
const getWorkflowStats = handleResult(async (req, res) => {
  const filters = req.user.role === 'admin' ? {} : { ownerId: req.user.id }
  
  const stats = await dataService.getWorkflowStats(filters)
  
  return { stats }
})

// 复制工作流
const cloneWorkflow = handleResult(async (req, res) => {
  const { id } = req.params
  const { name, description } = req.body
  
  const sourceWorkflow = await dataService.getWorkflowById(id)
  if (!sourceWorkflow) {
    throw createNotFoundError('源工作流')
  }
  
  // 检查访问权限
  if (sourceWorkflow.ownerId !== req.user.id && req.user.role !== 'admin') {
    throw createPermissionError('无权复制此工作流')
  }
  
  // 创建新工作流
  const workflowData = {
    name,
    description: description || `复制自: ${sourceWorkflow.name}`,
    definition: sourceWorkflow.definition,
    status: 'draft', // 复制的工作流默认为草稿状态
    isActive: false, // 复制的工作流默认为非激活状态
    ownerId: req.user.id,
    executionCount: 0,
    successRate: 0
  }
  
  const newWorkflow = await dataService.createWorkflow(workflowData)
  
  logger.info(`用户 ${req.user.id} 复制了工作流 ${id} 为 ${newWorkflow.id}`)
  
  return { workflow: newWorkflow }
})

module.exports = {
  getWorkflows,
  getWorkflowById,
  createWorkflow,
  updateWorkflow,
  deleteWorkflow,
  executeWorkflow,
  getWorkflowExecutions,
  getExecutionDetail,
  stopExecution,
  getWorkflowStats,
  cloneWorkflow
}