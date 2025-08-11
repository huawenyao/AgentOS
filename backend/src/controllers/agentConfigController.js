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
const { AgentConfig, AgentTemplate, User } = require('../models')

// 获取Agent配置列表
const getAgentConfigs = handleResult(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    q = '',
    templateId = '',
    status = '',
    type = ''
  } = req.query
  
  // 构建过滤条件
  const filters = {}
  
  if (q) filters.q = q
  if (templateId) filters.templateId = templateId
  if (status) filters.status = status
  if (type) filters.type = type
  
  // 非管理员只能看到自己创建的配置
  if (req.user.role !== 'admin') {
    filters.ownerId = req.user.id
  }
  
  // 构建分页参数
  const pagination = { page, limit, sortBy, sortOrder }
  
  // 查询数据
  const result = await dataService.getAgentConfigs(filters, pagination)
  
  return result
})

// 获取单个Agent配置
const getAgentConfig = handleResult(async (req, res) => {
  const { id } = req.params
  
  const config = await dataService.getAgentConfigById(id)
  
  if (!config) {
    throw createNotFoundError('Agent配置')
  }
  
  // 检查访问权限
  if (config.ownerId !== req.user.id && req.user.role !== 'admin') {
    throw createPermissionError('无权访问此配置')
  }
  
  return { config }
})

// 创建Agent配置
const createAgentConfig = handleResult(async (req, res) => {
  const configData = {
    ...req.body,
    ownerId: req.user.id
  }
  
  // 创建配置
  const config = await dataService.createAgentConfig(configData)
  
  logger.info(`用户 ${req.user.id} 创建了Agent配置 ${config.id}`)
  
  return { config }
})

// 更新Agent配置
const updateAgentConfig = handleResult(async (req, res) => {
  const { id } = req.params
  const updateData = req.body
  
  const config = await dataService.getAgentConfigById(id)
  if (!config) {
    throw createNotFoundError('Agent配置')
  }
  
  // 检查权限：只有创建者或管理员可以修改
  if (config.ownerId !== req.user.id && req.user.role !== 'admin') {
    throw createPermissionError('无权修改此配置')
  }
  
  // 更新配置
  const updatedConfig = await dataService.updateAgentConfig(id, updateData)
  
  // 清除相关缓存
  await cache.del(CacheKeys.agentConfig(id))
  
  logger.info(`用户 ${req.user.id} 更新了Agent配置 ${id}`)
  
  return { config: updatedConfig }
})

// 删除Agent配置
const deleteAgentConfig = handleResult(async (req, res) => {
  const { id } = req.params
  
  const config = await dataService.getAgentConfigById(id)
  if (!config) {
    throw createNotFoundError('Agent配置')
  }
  
  // 检查权限：只有创建者或管理员可以删除
  if (config.ownerId !== req.user.id && req.user.role !== 'admin') {
    throw createPermissionError('无权删除此配置')
  }
  
  // 删除配置
  const success = await dataService.deleteAgentConfig(id)
  
  if (!success) {
    throw createBusinessError('删除配置失败')
  }
  
  // 清除相关缓存
  await cache.del(CacheKeys.agentConfig(id))
  
  logger.info(`用户 ${req.user.id} 删除了Agent配置 ${id}`)
  
  return {
    message: 'Agent配置删除成功'
  }
})

// 复制Agent配置
const cloneAgentConfig = handleResult(async (req, res) => {
  const { id } = req.params
  const { name, description } = req.body
  
  const sourceConfig = await dataService.getAgentConfigById(id)
  if (!sourceConfig) {
    throw createNotFoundError('源配置')
  }
  
  // 检查访问权限
  if (sourceConfig.ownerId !== req.user.id && req.user.role !== 'admin') {
    throw createPermissionError('无权复制此配置')
  }
  
  // 创建新配置数据
  const configData = {
    name,
    description: description || `复制自: ${sourceConfig.name}`,
    templateId: sourceConfig.templateId,
    config: sourceConfig.config,
    isActive: false, // 复制的配置默认为非激活状态
    ownerId: req.user.id
  }
  
  const newConfig = await dataService.createAgentConfig(configData)
  
  logger.info(`用户 ${req.user.id} 复制了Agent配置 ${id} 为 ${newConfig.id}`)
  
  return { config: newConfig }
})

// 测试Agent配置
const testAgentConfig = handleResult(async (req, res) => {
  const { id } = req.params
  const { testInput = '你好' } = req.body
  
  const config = await dataService.getAgentConfigById(id)
  
  if (!config) {
    throw createNotFoundError('Agent配置')
  }
  
  // 检查访问权限
  if (config.ownerId !== req.user.id && req.user.role !== 'admin') {
    throw createPermissionError('无权测试此配置')
  }
  
  if (!config.isActive) {
    throw createBusinessError('配置未激活，无法测试')
  }
  
  // TODO: 实际的AI模型调用逻辑
  // 这里只是模拟测试结果
  const testResult = {
    success: true,
    input: testInput,
    output: `这是使用配置 "${config.name}" 的测试响应。输入: ${testInput}`,
    model: config.config.model,
    temperature: config.config.temperature || 0.7,
    maxTokens: config.config.maxTokens || 1000,
    responseTime: Math.floor(Math.random() * 2000) + 500, // 模拟响应时间
    timestamp: new Date().toISOString()
  }
  
  logger.business('测试Agent配置', req.user.id, {
    configId: id,
    testInput,
    success: testResult.success,
    ip: req.ip
  })
  
  return { testResult }
})

// 获取配置统计信息
const getConfigStats = handleResult(async (req, res) => {
  const filters = {}
  if (req.user.role !== 'admin') {
    filters.ownerId = req.user.id
  }
  
  const stats = await dataService.getAgentConfigStatistics(filters)
  
  return {
    stats
  }
})

// 批量操作配置
const batchUpdateConfigs = handleResult(async (req, res) => {
  const { configIds, action, data = {} } = req.body
  
  if (!Array.isArray(configIds) || configIds.length === 0) {
    throw createValidationError('配置ID列表不能为空')
  }
  
  const filters = {
    ids: configIds
  }
  if (req.user.role !== 'admin') {
    filters.ownerId = req.user.id
  }
  
  const result = await dataService.batchUpdateAgentConfigs(filters, action, data)
  
  if (!result.success) {
    throw createBusinessError(result.message || '批量操作失败')
  }
  
  // 清除相关缓存
  const cacheKeys = configIds.map(id => CacheKeys.agentConfig(id))
  await cache.delBatch(cacheKeys)
  
  logger.business('批量操作Agent配置', req.user.id, {
    action,
    configIds,
    data,
    ip: req.ip
  })
  
  return {
    message: result.message,
    affectedCount: result.affectedCount
  }
})

// 导出配置
const exportConfig = handleResult(async (req, res) => {
  const { id } = req.params

  const config = await dataService.getAgentConfigById(id, {
    include: [
      {
        model: 'template',
        attributes: ['name', 'category']
      },
      {
        model: 'creator',
        attributes: ['username']
      }
    ]
  });

  if (!config) {
    throw createNotFoundError('Agent配置');
  }

  // 权限检查
  if (config.ownerId !== req.user.id && req.user.role !== 'admin') {
    throw createPermissionError('无权导出此配置');
  }

  const exportData = {
    name: config.name,
    description: config.description,
    template: {
      name: config.template.name,
      category: config.template.category
    },
    config: config.config,
    creator: config.creator.username,
    exportedAt: new Date().toISOString(),
    version: '1.0'
  };

  logger.business('导出Agent配置', req.user.id, {
    configId: id,
    configName: config.name,
    ip: req.ip
  });

  res.setHeader('Content-Disposition', `attachment; filename="${config.name}.json"`);
  res.setHeader('Content-Type', 'application/json');
  res.status(200).json(exportData);
});

module.exports = {
  getAgentConfigs,
  getAgentConfig,
  createAgentConfig,
  updateAgentConfig,
  deleteAgentConfig,
  cloneAgentConfig,
  testAgentConfig,
  getConfigStats,
  batchUpdateConfigs,
  exportConfig
}