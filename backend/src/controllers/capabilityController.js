const dataService = require('../services/dataService')
const { cache } = require('../utils/redis')
const logger = require('../utils/logger')
const errorHandler = require('../middleware/errorHandler')
const { v4: uuidv4 } = require('uuid')

class CapabilityController {
  // 获取能力列表
  async getCapabilities(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        search,
        category,
        type,
        status,
        sortBy = 'createdAt',
        sortOrder = 'DESC'
      } = req.query

      const filters = {}

      // 非管理员只能看到已发布的能力和自己创建的能力
      if (req.user.role !== 'admin') {
        filters.userRole = 'user'
        filters.ownerId = req.user.id
      }

      if (search) filters.search = search
      if (category) filters.category = category
      if (type) filters.type = type
      if (status) filters.status = status

      const pagination = {
        page: parseInt(page),
        limit: parseInt(limit),
        sortBy,
        sortOrder
      }

      const result = await dataService.getCapabilities(filters, pagination)

      // 转换为前端模型格式
      const convertedCapabilities = result.capabilities ? result.capabilities.map(capability => ({
        id: capability.id,
        name: capability.name,
        description: capability.description,
        type: capability.type,
        version: capability.version,
        config: capability.config || {},
        inputSchema: capability.input_schema || capability.parameters || {},
        outputSchema: capability.output_schema || {},
        dependencies: capability.dependencies || [],
        performanceMetrics: capability.performance_metrics || {},
        resourceRequirements: capability.resource_requirements || {},
        capabilitySources: capability.capability_sources || [],
        metadata: capability.metadata || {},
        createdAt: capability.createdAt,
        updatedAt: capability.updatedAt
      })) : []

      const convertedResult = {
        ...result,
        capabilities: convertedCapabilities
      }

      logger.info('能力列表查询', {
        userId: req.user.id,
        action: 'GET_CAPABILITIES',
        filters: { search, category, type, status }
      })

      res.json({
        success: true,
        data: convertedResult
      })
    } catch (error) {
      logger.error('获取能力列表失败', {
        error: error.message,
        stack: error.stack,
        userId: req.user.id
      })
      errorHandler.handleError(error, res)
    }
  }

  // 获取能力统计
  async getCapabilityStatistics(req, res) {
    try {
      const cacheKey = `capability:statistics:${req.user.role}:${req.user.id}`
      let statistics = await cache.get(cacheKey)

      if (!statistics) {
        const filters = {}
        if (req.user.role !== 'admin') {
          filters.userRole = 'user'
          filters.ownerId = req.user.id
        }

        statistics = await dataService.getCapabilityStatistics(filters)

        await cache.set(cacheKey, statistics, 300) // 缓存5分钟
      }

      logger.info('能力统计查询', {
        userId: req.user.id,
        action: 'GET_CAPABILITY_STATISTICS'
      })

      res.json({
        success: true,
        data: statistics
      })
    } catch (error) {
      logger.error('获取能力统计失败', {
        error: error.message,
        stack: error.stack,
        userId: req.user.id
      })
      errorHandler.handleError(error, res)
    }
  }

  // 获取能力分类
  async getCapabilityCategories(req, res) {
    try {
      const cacheKey = 'capability:categories'
      let categories = await cache.get(cacheKey)

      if (!categories) {
        categories = await dataService.getCapabilityCategories()

        await cache.set(cacheKey, categories, 3600) // 缓存1小时
      }

      logger.info('能力分类查询', {
        userId: req.user.id,
        action: 'GET_CAPABILITY_CATEGORIES'
      })

      res.json({
        success: true,
        data: categories
      })
    } catch (error) {
      logger.error('获取能力分类失败', {
        error: error.message,
        stack: error.stack,
        userId: req.user.id
      })
      errorHandler.handleError(error, res)
    }
  }

  // 获取单个能力
  async getCapability(req, res) {
    try {
      const { id } = req.params

      const capability = await dataService.getCapabilityById(id)

      if (!capability) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'CAPABILITY_NOT_FOUND',
            message: '能力不存在'
          }
        })
      }

      // 权限检查
      if (capability.status !== 'published' && 
          capability.ownerId !== req.user.id && 
          req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: {
            code: 'ACCESS_DENIED',
            message: '无权访问此能力'
          }
        })
      }

      // 转换为前端模型格式
      const convertedCapability = {
        id: capability.id,
        name: capability.name,
        description: capability.description,
        type: capability.type,
        version: capability.version,
        config: capability.config || {},
        inputSchema: capability.input_schema || capability.parameters || {},
        outputSchema: capability.output_schema || {},
        dependencies: capability.dependencies || [],
        performanceMetrics: capability.performance_metrics || {},
        resourceRequirements: capability.resource_requirements || {},
        capabilitySources: capability.capability_sources || [],
        metadata: capability.metadata || {},
        createdAt: capability.createdAt,
        updatedAt: capability.updatedAt
      }

      logger.info('能力详情查询', {
        userId: req.user.id,
        action: 'GET_CAPABILITY',
        capabilityId: id
      })

      res.json({
        success: true,
        data: convertedCapability
      })
    } catch (error) {
      logger.error('获取能力详情失败', {
        error: error.message,
        stack: error.stack,
        userId: req.user.id,
        capabilityId: req.params.id
      })
      errorHandler.handleError(error, res)
    }
  }

  // 搜索能力
  async searchCapabilities(req, res) {
    try {
      const { q: query, category, type, limit = 10 } = req.query

      if (!query || query.trim().length < 2) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_QUERY',
            message: '搜索关键词至少需要2个字符'
          }
        })
      }

      const filters = {
        search: query
      }

      // 非管理员只能搜索已发布的能力和自己的能力
      if (req.user.role !== 'admin') {
        filters.userRole = 'user'
        filters.ownerId = req.user.id
      }

      if (category) filters.category = category
      if (type) filters.type = type

      const pagination = {
        limit: parseInt(limit),
        sortBy: 'usageCount',
        sortOrder: 'DESC'
      }

      const result = await dataService.searchCapabilities(filters, pagination)

      logger.info('能力搜索', {
        userId: req.user.id,
        action: 'SEARCH_CAPABILITIES',
        query,
        filters: { category, type },
        resultCount: result.capabilities.length
      })

      res.json({
        success: true,
        data: {
          capabilities: result.capabilities,
          query,
          total: result.capabilities.length
        }
      })
    } catch (error) {
      logger.error('搜索能力失败', {
        error: error.message,
        stack: error.stack,
        userId: req.user.id,
        query: req.query.q
      })
      errorHandler.handleError(error, res)
    }
  }

  // 创建能力
  async createCapability(req, res) {
    try {
      const {
        name,
        description,
        category,
        type,
        definition,
        parameters,
        examples,
        tags,
        status = 'draft',
        config,
        inputSchema,
        outputSchema,
        dependencies,
        performanceMetrics,
        resourceRequirements,
        capabilitySources,
        metadata
      } = req.body

      // 验证能力定义
      if (definition) {
        this.validateCapabilityDefinition(definition)
      }

      // 验证前端模型数据
      this.validateCapabilityModel({
        name,
        description,
        type,
        config,
        inputSchema,
        outputSchema
      })

      const capabilityData = {
        name,
        description,
        category,
        type,
        definition,
        parameters: parameters || inputSchema || {},
        examples: examples || [],
        tags: Array.isArray(tags) ? tags.join(',') : tags || '',
        status,
        version: '1.0.0',
        ownerId: req.user.id,
        config: config || {},
        input_schema: inputSchema || parameters || {},
        output_schema: outputSchema || {},
        dependencies: dependencies || [],
        performance_metrics: performanceMetrics || {},
        resource_requirements: resourceRequirements || {},
        capability_sources: capabilitySources || [],
        metadata: metadata || {}
      }

      const capability = await dataService.createCapability(capabilityData)

      // 转换为前端模型格式
      const convertedCapability = {
        id: capability.id,
        name: capability.name,
        description: capability.description,
        type: capability.type,
        version: capability.version,
        config: capability.config || {},
        inputSchema: capability.input_schema || capability.parameters || {},
        outputSchema: capability.output_schema || {},
        dependencies: capability.dependencies || [],
        performanceMetrics: capability.performance_metrics || {},
        resourceRequirements: capability.resource_requirements || {},
        capabilitySources: capability.capability_sources || [],
        metadata: capability.metadata || {},
        createdAt: capability.createdAt,
        updatedAt: capability.updatedAt
      }

      // 清理相关缓存
      await this.clearCapabilityCache()

      logger.info('能力创建', {
        userId: req.user.id,
        action: 'CREATE_CAPABILITY',
        capabilityId: capability.id,
        name,
        category,
        type
      })

      res.status(201).json({
        success: true,
        message: '能力创建成功',
        data: convertedCapability
      })
    } catch (error) {
      logger.error('创建能力失败', {
        error: error.message,
        stack: error.stack,
        userId: req.user.id,
        requestBody: req.body
      })
      errorHandler.handleError(error, res)
    }
  }

  // 更新能力
  async updateCapability(req, res) {
    try {
      const { id } = req.params
      const {
        name,
        description,
        category,
        type,
        definition,
        parameters,
        examples,
        tags,
        status
      } = req.body

      const capability = await dataService.getCapabilityById(id)
      if (!capability) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'CAPABILITY_NOT_FOUND',
            message: '能力不存在'
          }
        })
      }

      // 权限检查
      if (capability.ownerId !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: {
            code: 'ACCESS_DENIED',
            message: '只有创建者或管理员可以修改此能力'
          }
        })
      }

      // 验证能力定义
      if (definition) {
        this.validateCapabilityDefinition(definition)
      }

      const updateData = {}
      if (name !== undefined) updateData.name = name
      if (description !== undefined) updateData.description = description
      if (category !== undefined) updateData.category = category
      if (type !== undefined) updateData.type = type
      if (definition !== undefined) updateData.definition = definition
      if (parameters !== undefined) updateData.parameters = parameters
      if (examples !== undefined) updateData.examples = examples
      if (tags !== undefined) {
        updateData.tags = Array.isArray(tags) ? tags.join(',') : tags
      }
      if (status !== undefined) updateData.status = status

      const updatedCapability = await dataService.updateCapability(id, updateData)

      // 清理相关缓存
      await this.clearCapabilityCache()

      logger.info('能力更新', {
        userId: req.user.id,
        action: 'UPDATE_CAPABILITY',
        capabilityId: id,
        changes: Object.keys(updateData)
      })

      res.json({
        success: true,
        message: '能力更新成功',
        data: updatedCapability
      })
    } catch (error) {
      logger.error('更新能力失败', {
        error: error.message,
        stack: error.stack,
        userId: req.user.id,
        capabilityId: req.params.id
      })
      errorHandler.handleError(error, res)
    }
  }

  // 删除能力
  async deleteCapability(req, res) {
    try {
      const { id } = req.params

      const capability = await dataService.getCapabilityById(id)
      if (!capability) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'CAPABILITY_NOT_FOUND',
            message: '能力不存在'
          }
        })
      }

      // 权限检查
      if (capability.ownerId !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: {
            code: 'ACCESS_DENIED',
            message: '只有创建者或管理员可以删除此能力'
          }
        })
      }

      // TODO: 检查是否有Agent或工作流正在使用此能力

      await dataService.deleteCapability(id)

      // 清理相关缓存
      await this.clearCapabilityCache()

      logger.info('能力删除', {
        userId: req.user.id,
        action: 'DELETE_CAPABILITY',
        capabilityId: id,
        capabilityName: capability.name
      })

      res.json({
        success: true,
        message: '能力删除成功'
      })
    } catch (error) {
      logger.error('删除能力失败', {
        error: error.message,
        stack: error.stack,
        userId: req.user.id,
        capabilityId: req.params.id
      })
      errorHandler.handleError(error, res)
    }
  }

  // 克隆能力
  async cloneCapability(req, res) {
    try {
      const { id } = req.params
      const { name, description } = req.body

      const originalCapability = await dataService.getCapabilityById(id)
      if (!originalCapability) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'CAPABILITY_NOT_FOUND',
            message: '原能力不存在'
          }
        })
      }

      // 权限检查
      if (originalCapability.status !== 'published' && 
          originalCapability.ownerId !== req.user.id && 
          req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: {
            code: 'ACCESS_DENIED',
            message: '无权克隆此能力'
          }
        })
      }

      const cloneName = name || `${originalCapability.name} (副本)`

      const capabilityData = {
        name: cloneName,
        description: description || `${originalCapability.description} (克隆)`,
        category: originalCapability.category,
        type: originalCapability.type,
        definition: originalCapability.definition,
        parameters: originalCapability.parameters,
        examples: originalCapability.examples,
        tags: originalCapability.tags,
        status: 'draft', // 克隆的能力默认为草稿状态
        version: '1.0.0',
        ownerId: req.user.id
      }

      const clonedCapability = await dataService.createCapability(capabilityData)

      // 清理相关缓存
      await this.clearCapabilityCache()

      logger.info('能力克隆', {
        userId: req.user.id,
        action: 'CLONE_CAPABILITY',
        originalId: id,
        clonedId: clonedCapability.id,
        cloneName
      })

      res.status(201).json({
        success: true,
        message: '能力克隆成功',
        data: clonedCapability
      })
    } catch (error) {
      logger.error('克隆能力失败', {
        error: error.message,
        stack: error.stack,
        userId: req.user.id,
        capabilityId: req.params.id
      })
      errorHandler.handleError(error, res)
    }
  }

  // 测试能力
  async testCapability(req, res) {
    try {
      const { id } = req.params
      const { testData } = req.body

      const capability = await dataService.getCapabilityById(id)
      if (!capability) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'CAPABILITY_NOT_FOUND',
            message: '能力不存在'
          }
        })
      }

      // 权限检查
      if (capability.status !== 'published' && 
          capability.ownerId !== req.user.id && 
          req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: {
            code: 'ACCESS_DENIED',
            message: '无权测试此能力'
          }
        })
      }

      // 执行能力测试
      const testResult = await this.executeCapabilityTest(capability, testData)

      logger.info('能力测试', {
        userId: req.user.id,
        action: 'TEST_CAPABILITY',
        capabilityId: id,
        success: testResult.success
      })

      res.json({
        success: true,
        message: '能力测试完成',
        data: testResult
      })
    } catch (error) {
      logger.error('测试能力失败', {
        error: error.message,
        stack: error.stack,
        userId: req.user.id,
        capabilityId: req.params.id
      })
      errorHandler.handleError(error, res)
    }
  }

  // 验证能力定义
  async validateCapabilityDefinition(req, res) {
    try {
      const { definition } = req.body

      if (!definition) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_DEFINITION',
            message: '能力定义不能为空'
          }
        })
      }

      const validation = this.validateCapabilityDefinition(definition)

      logger.info('能力定义验证', {
        userId: req.user.id,
        action: 'VALIDATE_CAPABILITY_DEFINITION',
        isValid: validation.isValid
      })

      res.json({
        success: true,
        data: validation
      })
    } catch (error) {
      logger.error('验证能力定义失败', {
        error: error.message,
        stack: error.stack,
        userId: req.user.id
      })
      errorHandler.handleError(error, res)
    }
  }

  // 导出能力
  async exportCapability(req, res) {
    try {
      const { id } = req.params

      const capability = await dataService.getCapabilityById(id)

      if (!capability) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'CAPABILITY_NOT_FOUND',
            message: '能力不存在'
          }
        })
      }

      // 权限检查
      if (capability.status !== 'published' && 
          capability.ownerId !== req.user.id && 
          req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: {
            code: 'ACCESS_DENIED',
            message: '无权导出此能力'
          }
        })
      }

      const exportData = {
        capability: {
          name: capability.name,
          description: capability.description,
          category: capability.category,
          type: capability.type,
          definition: capability.definition,
          parameters: capability.parameters,
          examples: capability.examples,
          tags: capability.tags,
          version: capability.version
        },
        metadata: {
          exportedAt: new Date(),
          exportedBy: req.user.username,
          originalCreator: capability.creator?.username || 'Unknown',
          platform: 'EFIAgent'
        }
      }

      logger.info('能力导出', {
        userId: req.user.id,
        action: 'EXPORT_CAPABILITY',
        capabilityId: id
      })

      res.setHeader('Content-Type', 'application/json')
      res.setHeader('Content-Disposition', `attachment; filename="${capability.name}_capability.json"`)
      res.json(exportData)
    } catch (error) {
      logger.error('导出能力失败', {
        error: error.message,
        stack: error.stack,
        userId: req.user.id,
        capabilityId: req.params.id
      })
      errorHandler.handleError(error, res)
    }
  }

  // 导入能力
  async importCapability(req, res) {
    try {
      const { importData, overwriteExisting = false } = req.body

      if (!capabilityData || !capabilityData.capability) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_IMPORT_DATA',
            message: '导入数据格式无效'
          }
        })
      }

      const { capability: capData } = capabilityData

      // 验证必要字段
      if (!capData.name || !capData.definition) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_REQUIRED_FIELDS',
            message: '缺少必要字段：name 和 definition'
          }
        })
      }

      // 验证能力定义
      this.validateCapabilityDefinition(capData.definition)

      const capabilityData = {
        name: capData.name,
        description: capData.description,
        category: capData.category,
        type: capData.type,
        definition: capData.definition,
        parameters: capData.parameters || {},
        examples: capData.examples || [],
        tags: capData.tags || '',
        status: 'draft', // 导入的能力默认为草稿状态
        version: capData.version || '1.0.0',
        ownerId: req.user.id
      }

      const capability = await dataService.createCapability(capabilityData)

      // 清理相关缓存
      await this.clearCapabilityCache()

      logger.info('能力导入', {
        userId: req.user.id,
        action: 'IMPORT_CAPABILITY',
        capabilityId: capability.id,
        capabilityName: capData.name,
        overwriteExisting
      })

      res.status(201).json({
        success: true,
        message: '能力导入成功',
        data: capability
      })
    } catch (error) {
      logger.error('导入能力失败', {
        error: error.message,
        stack: error.stack,
        userId: req.user.id
      })
      errorHandler.handleError(error, res)
    }
  }

  // 辅助方法
  formatGroupedData(data) {
    const result = {}
    data.forEach(item => {
      const key = Object.keys(item)[0]
      result[item[key]] = parseInt(item.count)
    })
    return result
  }

  // 验证能力模型
  validateCapabilityModel(capabilityData) {
    const errors = []
    const warnings = []

    // 必填字段验证
    if (!capabilityData.name || capabilityData.name.trim().length === 0) {
      errors.push('能力名称不能为空')
    }

    if (!capabilityData.type) {
      errors.push('能力类型不能为空')
    }

    // 名称长度验证
    if (capabilityData.name && capabilityData.name.length > 100) {
      errors.push('能力名称不能超过100个字符')
    }

    // 描述长度验证
    if (capabilityData.description && capabilityData.description.length > 1000) {
      errors.push('能力描述不能超过1000个字符')
    }

    // 输入输出模式验证
    if (capabilityData.inputSchema && typeof capabilityData.inputSchema !== 'object') {
      errors.push('输入模式必须是对象类型')
    }

    if (capabilityData.outputSchema && typeof capabilityData.outputSchema !== 'object') {
      errors.push('输出模式必须是对象类型')
    }

    // 配置验证
    if (capabilityData.config && typeof capabilityData.config !== 'object') {
      errors.push('配置必须是对象类型')
    }

    // 类型验证
    const validTypes = ['api', 'function', 'workflow', 'tool', 'service']
    if (capabilityData.type && !validTypes.includes(capabilityData.type)) {
      warnings.push(`能力类型 '${capabilityData.type}' 不在推荐类型列表中: ${validTypes.join(', ')}`)
    }

    if (errors.length > 0) {
      throw new Error(`能力模型验证失败: ${errors.join(', ')}`)
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  validateCapabilityDefinition(definition) {
    const errors = []
    const warnings = []

    // 基本结构验证
    if (!definition.type) {
      errors.push('缺少能力类型 (type)')
    }

    if (!definition.handler) {
      errors.push('缺少处理器定义 (handler)')
    }

    // 参数验证
    if (definition.parameters) {
      if (!Array.isArray(definition.parameters)) {
        errors.push('参数定义必须是数组')
      } else {
        definition.parameters.forEach((param, index) => {
          if (!param.name) {
            errors.push(`参数 ${index + 1} 缺少名称`)
          }
          if (!param.type) {
            errors.push(`参数 ${index + 1} 缺少类型`)
          }
        })
      }
    }

    // 返回值验证
    if (definition.returns && !definition.returns.type) {
      warnings.push('建议定义返回值类型')
    }

    if (errors.length > 0) {
      throw new Error(`能力定义验证失败: ${errors.join(', ')}`)
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  async executeCapabilityTest(capability, testData) {
    try {
      // TODO: 实现实际的能力测试逻辑
      // 这里应该根据能力定义执行实际的测试
      
      return {
        success: true,
        result: {
          output: 'Test execution successful',
          executionTime: Math.random() * 1000,
          memoryUsage: Math.random() * 100
        },
        logs: [
          { level: 'info', message: 'Test started' },
          { level: 'info', message: 'Test completed successfully' }
        ]
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        logs: [
          { level: 'error', message: `Test failed: ${error.message}` }
        ]
      }
    }
  }

  async clearCapabilityCache() {
    const patterns = [
      'capability:*',
      'capabilities:*'
    ]
    
    for (const pattern of patterns) {
      await cache.del(pattern)
    }
  }
}

// Agent验证功能
const validateAgent = async (req, res) => {
  try {
    const agentData = req.body;
    const errors = [];
    const warnings = [];
    
    // 基础验证
    if (!agentData.name || agentData.name.trim().length === 0) {
      errors.push('Agent名称不能为空');
    }
    
    if (!agentData.description) {
      warnings.push('建议添加Agent描述');
    }
    
    // 能力验证
    if (!agentData.capabilities || agentData.capabilities.length === 0) {
      errors.push('Agent至少需要一个能力');
    }
    
    // 编排器验证
    if (!agentData.orchestrator_config) {
      warnings.push('建议配置编排器');
    }
    
    // 依赖验证
    if (agentData.capabilities && agentData.capabilities.length > 0) {
      for (const capabilityId of agentData.capabilities) {
        try {
          const capability = await dataService.getCapabilityById(capabilityId);
          if (!capability) {
            errors.push(`能力 ${capabilityId} 不存在`);
          }
        } catch (error) {
          errors.push(`验证能力 ${capabilityId} 时出错`);
        }
      }
    }
    
    // 配置验证
    if (agentData.deployment_config) {
      if (!agentData.deployment_config.environment) {
        warnings.push('建议指定部署环境');
      }
    }
    
    const isValid = errors.length === 0;
    
    res.json({
      success: true,
      data: {
        isValid,
        errors,
        warnings
      }
    });
  } catch (error) {
    console.error('Agent验证失败:', error);
    res.status(500).json({
      success: false,
      error: 'Agent验证失败'
    });
  }
};

// 添加validateAgent方法到CapabilityController类
CapabilityController.prototype.validateAgent = validateAgent;

module.exports = new CapabilityController()