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

// 获取Agent模板列表
const getAgentTemplates = handleResult(async (req, res) => {
  const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', q = '', category = '', isPublic = '', createdBy = '' } = req.query
  
  // 构建过滤条件
  const filters = {}
  
  // 权限过滤：普通用户只能看到公开模板和自己的模板
  if (req.user.role !== 'admin') {
    filters.isPublic = true
    filters.createdBy = req.user.id
  }
  
  if (q) filters.q = q
  if (category) filters.category = category
  if (isPublic !== '') filters.isPublic = isPublic === 'true'
  if (createdBy) filters.createdBy = createdBy
  
  // 构建分页参数
  const pagination = { page, limit, sortBy, sortOrder }
  
  // 查询数据
  const result = await dataService.getAgentTemplates(filters, pagination)
  
  return result
})

// 获取单个Agent模板
const getAgentTemplate = handleResult(async (req, res) => {
  const { id } = req.params
  
  // 查询模板
  const template = await dataService.getAgentTemplateById(id)
  
  if (!template) {
    throw createNotFoundError('模板不存在')
  }
  
  // 权限检查：普通用户只能查看公开模板和自己的模板
  if (req.user.role !== 'admin' && !template.isPublic && template.authorId !== req.user.id) {
    throw createPermissionError('无权访问此模板')
  }
  
  logger.info(`用户 ${req.user.id} 查看了模板 ${id}`)
  
  return { template }
})

// 创建Agent模板
const createAgentTemplate = handleResult(async (req, res) => {
  const templateData = {
    ...req.body,
    authorId: req.user.id
  }
  
  // 创建模板
  const template = await dataService.createAgentTemplate(templateData)
  
  logger.info(`用户 ${req.user.id} 创建了模板 ${template.id}`)
  
  return { template }
})

// 更新Agent模板
const updateAgentTemplate = handleResult(async (req, res) => {
  const { id } = req.params
  const updateData = req.body
  
  // 查询模板
  const template = await dataService.getAgentTemplateById(id)
  
  if (!template) {
    throw createNotFoundError('模板不存在')
  }
  
  // 权限检查：只有作者和管理员可以更新
  if (template.authorId !== req.user.id && req.user.role !== 'admin') {
    throw createPermissionError('无权修改此模板')
  }
  
  // 更新模板
  const updatedTemplate = await dataService.updateAgentTemplate(id, updateData)
  
  logger.info(`用户 ${req.user.id} 更新了模板 ${id}`)
  
  return { template: updatedTemplate }
})

// 删除Agent模板
const deleteAgentTemplate = handleResult(async (req, res) => {
  const { id } = req.params
  
  // 查询模板
  const template = await dataService.getAgentTemplateById(id)
  
  if (!template) {
    throw createNotFoundError('模板不存在')
  }
  
  // 权限检查：只有作者和管理员可以删除
  if (template.authorId !== req.user.id && req.user.role !== 'admin') {
    throw createPermissionError('无权删除此模板')
  }
  
  // 删除模板
  const success = await dataService.deleteAgentTemplate(id)
  
  if (!success) {
    throw createBusinessError('删除模板失败')
  }
  
  logger.info(`用户 ${req.user.id} 删除了模板 ${id}`)
  
  return {
    message: 'Agent模板删除成功'
  }
})

// 复制Agent模板
const cloneAgentTemplate = handleResult(async (req, res) => {
  const { id } = req.params
  const { name, description } = req.body
  
  const sourceTemplate = await dataService.getAgentTemplateById(id)
  if (!sourceTemplate) {
    throw createNotFoundError('源模板')
  }
  
  // 检查访问权限
  if (!sourceTemplate.isPublic && sourceTemplate.authorId !== req.user.id && req.user.role !== 'admin') {
    throw createPermissionError('无权复制此模板')
  }
  
  // 创建新模板数据
  const templateData = {
    name,
    description: description || `复制自: ${sourceTemplate.name}`,
    category: sourceTemplate.category,
    config: sourceTemplate.config,
    isPublic: false, // 复制的模板默认为私有
    authorId: req.user.id,
    usageCount: 0
  }
  
  const newTemplate = await dataService.createAgentTemplate(templateData)
  
  logger.info(`用户 ${req.user.id} 复制了模板 ${id} 为 ${newTemplate.id}`)
  
  return { template: newTemplate }
})

// 获取模板分类统计
const getTemplateStats = handleResult(async (req, res) => {
  // 构建过滤条件
  const filters = {}
  
  // 权限过滤：普通用户只能看到公开模板和自己的模板
  if (req.user.role !== 'admin') {
    filters.isPublic = true
    filters.authorId = req.user.id
  }
  
  const stats = await dataService.getAgentTemplateStatistics(filters)
  
  return { stats }
})

// 搜索模板
const searchTemplates = handleResult(async (req, res) => {
  const { q, category, limit = 10 } = req.query
  
  if (!q || q.trim().length < 2) {
    throw createValidationError('搜索关键词至少需要2个字符')
  }
  
  // 构建过滤条件
  const filters = { q }
  
  if (category) {
    filters.category = category
  }
  
  // 权限过滤：普通用户只能搜索公开模板和自己的模板
  if (req.user.role !== 'admin') {
    filters.isPublic = true
    filters.authorId = req.user.id
  }
  
  // 构建分页参数
  const pagination = { 
    limit: parseInt(limit), 
    sortBy: 'usageCount', 
    sortOrder: 'desc' 
  }
  
  const result = await dataService.searchAgentTemplates(filters, pagination)
  
  return { templates: result.templates }
})

// 获取模板配置验证
const validateTemplateConfig = handleResult(async (req, res) => {
  const { config } = req.body
  
  const errors = []
  const warnings = []
  
  // 基本验证
  if (!config.model) {
    errors.push('缺少模型配置')
  }
  
  if (config.temperature !== undefined) {
    if (typeof config.temperature !== 'number' || config.temperature < 0 || config.temperature > 2) {
      errors.push('温度值必须在0-2之间')
    }
  }
  
  if (config.maxTokens !== undefined) {
    if (!Number.isInteger(config.maxTokens) || config.maxTokens < 1 || config.maxTokens > 32000) {
      errors.push('最大令牌数必须在1-32000之间')
    }
  }
  
  if (config.systemPrompt && config.systemPrompt.length > 4000) {
    warnings.push('系统提示词过长，可能影响性能')
  }
  
  // 高级验证
  if (config.functions && Array.isArray(config.functions)) {
    config.functions.forEach((func, index) => {
      if (!func.name) {
        errors.push(`函数${index + 1}缺少名称`)
      }
      if (!func.description) {
        warnings.push(`函数${index + 1}缺少描述`)
      }
    })
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  }
})

// 导出模板
const exportTemplate = handleResult(async (req, res) => {
  const { id } = req.params
  
  const template = await dataService.getAgentTemplateById(id)
  
  if (!template) {
    throw createNotFoundError('Agent模板')
  }
  
  // 检查访问权限
  if (!template.isPublic && template.authorId !== req.user.id && req.user.role !== 'admin') {
    throw createPermissionError('无权导出此模板')
  }
  
  const exportData = {
    name: template.name,
    description: template.description,
    category: template.category,
    config: template.config,
    creator: template.author?.username || 'Unknown',
    exportedAt: new Date().toISOString(),
    version: '1.0'
  }
  
  logger.info(`用户 ${req.user.id} 导出了模板 ${id}`)
  
  return { exportData }
})

// 导入模板
const importTemplate = handleResult(async (req, res) => {
  const { templateData, name } = req.body
  
  if (!templateData || !templateData.config) {
    throw createValidationError('无效的模板数据')
  }
  
  // 创建导入的模板数据
  const newTemplateData = {
    name: name || templateData.name,
    description: templateData.description || '导入的模板',
    category: templateData.category || 'custom',
    config: templateData.config,
    isPublic: false, // 导入的模板默认为私有
    authorId: req.user.id,
    usageCount: 0
  }
  
  const template = await dataService.createAgentTemplate(newTemplateData)
  
  logger.info(`用户 ${req.user.id} 导入了模板 ${template.id}`)
  
  return { template }
})

module.exports = {
  getAgentTemplates,
  getAgentTemplate,
  createAgentTemplate,
  updateAgentTemplate,
  deleteAgentTemplate,
  cloneAgentTemplate,
  getTemplateStats,
  searchTemplates,
  validateTemplateConfig,
  exportTemplate,
  importTemplate
}