const dataService = require('../services/dataService')
const { cache } = require('../utils/redis')
const logger = require('../utils/logger')
const errorHandler = require('../middleware/errorHandler')
const { v4: uuidv4 } = require('uuid')
const semver = require('semver')

class ComponentController {
  // 获取组件列表
  async getComponents(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        search,
        category,
        type,
        status,
        featured,
        sortBy = 'createdAt',
        sortOrder = 'DESC'
      } = req.query

      const offset = (page - 1) * limit
      const whereClause = {}

      // 构建过滤条件
      const filters = {}
      
      if (req.user.role !== 'admin') {
        filters.ownerId = req.user.id
        filters.includePublished = true
      }
      
      if (search) filters.search = search
      if (category) filters.category = category
      if (type) filters.type = type
      if (status) filters.status = status
      if (featured === 'true') filters.featured = true
      
      const pagination = {
        page: parseInt(page),
        limit: parseInt(limit),
        sortBy,
        sortOrder: sortOrder.toUpperCase()
      }
      
      const result = await dataService.getComponents(filters, pagination)
      const { count, components } = result

      // 组件数据已包含评分信息
      const componentsWithRating = components

      logger.info('组件列表查询', {
        userId: req.user.id,
        action: 'GET_COMPONENTS',
        filters: { search, category, type, status, featured }
      })

      res.json({
        success: true,
        data: {
          components: componentsWithRating,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: count,
            pages: Math.ceil(count / limit)
          }
        }
      })
    } catch (error) {
      logger.error('获取组件列表失败', {
        error: error.message,
        stack: error.stack,
        userId: req.user.id
      })
      errorHandler.handleError(error, res)
    }
  }

  // 获取组件统计
  async getComponentStatistics(req, res) {
    try {
      const cacheKey = `component:statistics:${req.user.role}:${req.user.id}`
      let statistics = await cache.get(cacheKey)

      if (!statistics) {
        const filters = {}
        if (req.user.role !== 'admin') {
          filters.ownerId = req.user.id
          filters.includePublished = true
        }
        
        statistics = await dataService.getComponentStatistics(filters)

        await cache.set(cacheKey, statistics, 300) // 缓存5分钟
      }

      logger.info('组件统计查询', {
        userId: req.user.id,
        action: 'GET_COMPONENT_STATISTICS'
      })

      res.json({
        success: true,
        data: statistics
      })
    } catch (error) {
      logger.error('获取组件统计失败', {
        error: error.message,
        stack: error.stack,
        userId: req.user.id
      })
      errorHandler.handleError(error, res)
    }
  }

  // 获取组件分类
  async getComponentCategories(req, res) {
    try {
      const cacheKey = 'component:categories'
      let categories = await cache.get(cacheKey)

      if (!categories) {
        categories = await dataService.getComponentCategories()
        await cache.set(cacheKey, categories, 3600) // 缓存1小时
      }

      logger.info('组件分类查询', {
        userId: req.user.id,
        action: 'GET_COMPONENT_CATEGORIES'
      })

      res.json({
        success: true,
        data: categories
      })
    } catch (error) {
      logger.error('获取组件分类失败', {
        error: error.message,
        stack: error.stack,
        userId: req.user.id
      })
      errorHandler.handleError(error, res)
    }
  }

  // 获取推荐组件
  async getFeaturedComponents(req, res) {
    try {
      const { limit = 10 } = req.query
      const cacheKey = `component:featured:${limit}`
      let components = await cache.get(cacheKey)

      if (!components) {
        const filters = {
          featured: true,
          status: 'published'
        }
        
        const pagination = {
          limit: parseInt(limit),
          sortBy: 'downloadCount',
          sortOrder: 'DESC'
        }
        
        const result = await dataService.getComponents(filters, pagination)
        components = result.components
        
        await cache.set(cacheKey, components, 600) // 缓存10分钟
      }

      logger.info('推荐组件查询', {
        userId: req.user.id,
        action: 'GET_FEATURED_COMPONENTS',
        limit
      })

      res.json({
        success: true,
        data: components
      })
    } catch (error) {
      logger.error('获取推荐组件失败', {
        error: error.message,
        stack: error.stack,
        userId: req.user.id
      })
      errorHandler.handleError(error, res)
    }
  }

  // 获取单个组件
  async getComponent(req, res) {
    try {
      const { id } = req.params

      const component = await dataService.getComponentById(id)

      if (!component) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'COMPONENT_NOT_FOUND',
            message: '组件不存在'
          }
        })
      }

      // 权限检查
      if (component.status !== 'published' && 
          component.ownerId !== req.user.id && 
          req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: {
            code: 'ACCESS_DENIED',
            message: '无权访问此组件'
          }
        })
      }

      // 组件数据已包含评分信息
      const componentData = component

      logger.info('组件详情查询', {
        userId: req.user.id,
        action: 'GET_COMPONENT',
        componentId: id
      })

      res.json({
        success: true,
        data: componentData
      })
    } catch (error) {
      logger.error('获取组件详情失败', {
        error: error.message,
        stack: error.stack,
        userId: req.user.id,
        componentId: req.params.id
      })
      errorHandler.handleError(error, res)
    }
  }

  // 搜索组件
  async searchComponents(req, res) {
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
      
      if (req.user.role !== 'admin') {
        filters.ownerId = req.user.id
        filters.includePublished = true
      }
      
      if (category) filters.category = category
      if (type) filters.type = type
      
      const pagination = {
        limit: parseInt(limit),
        sortBy: 'downloadCount',
        sortOrder: 'DESC'
      }
      
      const result = await dataService.getComponents(filters, pagination)
      const components = result.components

      logger.info('组件搜索', {
        userId: req.user.id,
        action: 'SEARCH_COMPONENTS',
        query,
        filters: { category, type },
        resultCount: components.length
      })

      res.json({
        success: true,
        data: {
          components,
          query,
          total: components.length
        }
      })
    } catch (error) {
      logger.error('搜索组件失败', {
        error: error.message,
        stack: error.stack,
        userId: req.user.id,
        query: req.query.q
      })
      errorHandler.handleError(error, res)
    }
  }

  // 创建组件
  async createComponent(req, res) {
    try {
      const {
        name,
        description,
        category,
        type,
        configuration,
        dependencies,
        documentation,
        tags,
        status = 'draft',
        version = '1.0.0'
      } = req.body

      // 验证组件配置
      this.validateComponentConfiguration(configuration)

      // 创建组件数据
      const componentData = {
        name,
        description,
        category,
        type,
        configuration,
        dependencies: dependencies || {},
        documentation: documentation || '',
        tags: Array.isArray(tags) ? tags.join(',') : tags || '',
        status,
        version,
        ownerId: req.user.id
      }
      
      const component = await dataService.createComponent(componentData)

      // 清理相关缓存
      await this.clearComponentCache()

      logger.info('组件创建', {
        userId: req.user.id,
        action: 'CREATE_COMPONENT',
        componentId: component.id,
        name,
        category,
        type
      })

      res.status(201).json({
        success: true,
        message: '组件创建成功',
        data: component
      })
    } catch (error) {
      logger.error('创建组件失败', {
        error: error.message,
        stack: error.stack,
        userId: req.user.id,
        requestBody: req.body
      })
      errorHandler.handleError(error, res)
    }
  }

  // 更新组件
  async updateComponent(req, res) {
    try {
      const { id } = req.params
      const {
        name,
        description,
        category,
        type,
        configuration,
        dependencies,
        documentation,
        tags,
        status,
        version
      } = req.body

      const component = await dataService.getComponentById(id)
      if (!component) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'COMPONENT_NOT_FOUND',
            message: '组件不存在'
          }
        })
      }

      // 权限检查
      if (component.ownerId !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: {
            code: 'ACCESS_DENIED',
            message: '只有创建者或管理员可以修改此组件'
          }
        })
      }

      // 验证组件配置
      if (configuration) {
        this.validateComponentConfiguration(configuration)
      }

      const updateData = {}
      if (name !== undefined) updateData.name = name
      if (description !== undefined) updateData.description = description
      if (category !== undefined) updateData.category = category
      if (type !== undefined) updateData.type = type
      if (configuration !== undefined) updateData.configuration = configuration
      if (dependencies !== undefined) updateData.dependencies = dependencies
      if (documentation !== undefined) updateData.documentation = documentation
      if (tags !== undefined) {
        updateData.tags = Array.isArray(tags) ? tags.join(',') : tags
      }
      if (status !== undefined) updateData.status = status
      if (version !== undefined) updateData.version = version
      
      const updatedComponent = await dataService.updateComponent(id, updateData)

      // 清理相关缓存
      await this.clearComponentCache()

      logger.info('组件更新', {
        userId: req.user.id,
        action: 'UPDATE_COMPONENT',
        componentId: id,
        changes: Object.keys(updateData)
      })

      res.json({
        success: true,
        message: '组件更新成功',
        data: updatedComponent
      })
    } catch (error) {
      logger.error('更新组件失败', {
        error: error.message,
        stack: error.stack,
        userId: req.user.id,
        componentId: req.params.id
      })
      errorHandler.handleError(error, res)
    }
  }

  // 删除组件
  async deleteComponent(req, res) {
    try {
      const { id } = req.params

      const component = await dataService.getComponentById(id)
      if (!component) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'COMPONENT_NOT_FOUND',
            message: '组件不存在'
          }
        })
      }

      // 权限检查
      if (component.ownerId !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: {
            code: 'ACCESS_DENIED',
            message: '只有创建者或管理员可以删除此组件'
          }
        })
      }

      // 删除组件
      const success = await dataService.deleteComponent(id)
      
      if (!success) {
        return res.status(500).json({
          success: false,
          error: {
            code: 'DELETE_FAILED',
            message: '删除组件失败'
          }
        })
      }

      // 清理相关缓存
      await this.clearComponentCache()

      logger.info('组件删除', {
        userId: req.user.id,
        action: 'DELETE_COMPONENT',
        componentId: id,
        componentName: component.name
      })

      res.json({
        success: true,
        message: '组件删除成功'
      })
    } catch (error) {
      logger.error('删除组件失败', {
        error: error.message,
        stack: error.stack,
        userId: req.user.id,
        componentId: req.params.id
      })
      errorHandler.handleError(error, res)
    }
  }

  // 克隆组件
  async cloneComponent(req, res) {
    try {
      const { id } = req.params
      const { name, description } = req.body

      const originalComponent = await dataService.getComponentById(id)
      if (!originalComponent) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'COMPONENT_NOT_FOUND',
            message: '原组件不存在'
          }
        })
      }

      // 权限检查
      if (originalComponent.status !== 'published' && 
          originalComponent.ownerId !== req.user.id && 
          req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: {
            code: 'ACCESS_DENIED',
            message: '无权克隆此组件'
          }
        })
      }

      const cloneName = name || `${originalComponent.name} (副本)`

      // 创建克隆组件数据
      const componentData = {
        name: cloneName,
        description: description || `${originalComponent.description} (克隆)`,
        category: originalComponent.category,
        type: originalComponent.type,
        configuration: originalComponent.configuration,
        dependencies: originalComponent.dependencies,
        documentation: originalComponent.documentation,
        tags: originalComponent.tags,
        status: 'draft', // 克隆的组件默认为草稿状态
        version: '1.0.0',
        clonedFrom: originalComponent.id,
        ownerId: req.user.id
      }

      const clonedComponent = await dataService.createComponent(componentData)

      // 清理相关缓存
      await this.clearComponentCache()

      logger.info('组件克隆', {
        userId: req.user.id,
        action: 'CLONE_COMPONENT',
        originalId: id,
        clonedId: clonedComponent.id,
        cloneName
      })

      res.status(201).json({
        success: true,
        message: '组件克隆成功',
        data: clonedComponent
      })
    } catch (error) {
      logger.error('克隆组件失败', {
        error: error.message,
        stack: error.stack,
        userId: req.user.id,
        componentId: req.params.id
      })
      errorHandler.handleError(error, res)
    }
  }

  // 安装组件
  async installComponent(req, res) {
    try {
      const { id } = req.params
      const { version } = req.body

      const component = await dataService.getComponentById(id)
      if (!component) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'COMPONENT_NOT_FOUND',
            message: '组件不存在'
          }
        })
      }

      if (component.status !== 'published') {
        return res.status(400).json({
          success: false,
          error: {
            code: 'COMPONENT_NOT_PUBLISHED',
            message: '只能安装已发布的组件'
          }
        })
      }

      // 执行组件安装逻辑
      const installResult = await this.executeComponentInstallation(component, version)

      // 增加下载次数
      await dataService.updateComponent(id, { downloadCount: (component.downloadCount || 0) + 1 })

      logger.info('组件安装', {
        userId: req.user.id,
        action: 'INSTALL_COMPONENT',
        componentId: id,
        version: version || component.version,
        success: installResult.success
      })

      res.json({
        success: true,
        message: '组件安装成功',
        data: installResult
      })
    } catch (error) {
      logger.error('安装组件失败', {
        error: error.message,
        stack: error.stack,
        userId: req.user.id,
        componentId: req.params.id
      })
      errorHandler.handleError(error, res)
    }
  }

  // 卸载组件
  async uninstallComponent(req, res) {
    try {
      const { id } = req.params

      const component = await dataService.getComponentById(id)
      if (!component) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'COMPONENT_NOT_FOUND',
            message: '组件不存在'
          }
        })
      }

      // 执行组件卸载逻辑
      const uninstallResult = await this.executeComponentUninstallation(component)

      logger.info('组件卸载', {
        userId: req.user.id,
        action: 'UNINSTALL_COMPONENT',
        componentId: id,
        success: uninstallResult.success
      })

      res.json({
        success: true,
        message: '组件卸载成功',
        data: uninstallResult
      })
    } catch (error) {
      logger.error('卸载组件失败', {
        error: error.message,
        stack: error.stack,
        userId: req.user.id,
        componentId: req.params.id
      })
      errorHandler.handleError(error, res)
    }
  }

  // 获取组件版本
  async getComponentVersions(req, res) {
    try {
      const { id } = req.params
      const { page = 1, limit = 10 } = req.query

      const component = await dataService.getComponentById(id)
      if (!component) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'COMPONENT_NOT_FOUND',
            message: '组件不存在'
          }
        })
      }

      // 权限检查
      if (component.status !== 'published' && 
          component.ownerId !== req.user.id && 
          req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: {
            code: 'ACCESS_DENIED',
            message: '无权访问此组件的版本信息'
          }
        })
      }

      const pagination = {
        page: parseInt(page),
        limit: parseInt(limit)
      }
      
      const result = await dataService.getComponentVersions(id, pagination)
      const { versions, total } = result

      logger.info('组件版本查询', {
        userId: req.user.id,
        action: 'GET_COMPONENT_VERSIONS',
        componentId: id
      })

      res.json({
        success: true,
        data: {
          versions,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit))
          }
        }
      })
    } catch (error) {
      logger.error('获取组件版本失败', {
        error: error.message,
        stack: error.stack,
        userId: req.user.id,
        componentId: req.params.id
      })
      errorHandler.handleError(error, res)
    }
  }

  // 导出组件
  async exportComponent(req, res) {
    try {
      const { id } = req.params
      const { version } = req.query

      const component = await dataService.getComponentById(id)

      if (!component) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'COMPONENT_NOT_FOUND',
            message: '组件不存在'
          }
        })
      }

      // 权限检查
      if (component.status !== 'published' && 
          component.ownerId !== req.user.id && 
          req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: {
            code: 'ACCESS_DENIED',
            message: '无权导出此组件'
          }
        })
      }

      let componentVersion = null
      if (version) {
        componentVersion = await dataService.getComponentVersion(id, version)
      }

      const exportData = {
        component: {
          name: component.name,
          description: component.description,
          category: component.category,
          type: component.type,
          configuration: componentVersion ? componentVersion.configuration : component.configuration,
          dependencies: componentVersion ? componentVersion.dependencies : component.dependencies,
          documentation: component.documentation,
          tags: component.tags,
          version: componentVersion ? componentVersion.version : component.version
        },
        metadata: {
          exportedAt: new Date(),
          exportedBy: req.user.username,
          originalCreator: component.ownerName || 'Unknown',
          platform: 'EFIAgent'
        }
      }

      logger.info('组件导出', {
        userId: req.user.id,
        action: 'EXPORT_COMPONENT',
        componentId: id,
        version: version || component.version
      })

      res.setHeader('Content-Type', 'application/json')
      res.setHeader('Content-Disposition', `attachment; filename="${component.name}_component.json"`)
      res.json(exportData)
    } catch (error) {
      logger.error('导出组件失败', {
        error: error.message,
        stack: error.stack,
        userId: req.user.id,
        componentId: req.params.id
      })
      errorHandler.handleError(error, res)
    }
  }

  // 导入组件
  async importComponent(req, res) {
    try {
      const { componentData, overwriteExisting = false } = req.body

      if (!componentData || !componentData.component) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_IMPORT_DATA',
            message: '导入数据格式无效'
          }
        })
      }

      const { component: compData } = componentData

      // 验证必要字段
      if (!compData.name || !compData.configuration) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_REQUIRED_FIELDS',
            message: '缺少必要字段：name 和 configuration'
          }
        })
      }

      // 验证组件配置
      this.validateComponentConfiguration(compData.configuration)

      // 创建组件数据
      const newComponentData = {
        name: compData.name,
        description: compData.description,
        category: compData.category,
        type: compData.type,
        configuration: compData.configuration,
        dependencies: compData.dependencies || {},
        documentation: compData.documentation || '',
        tags: compData.tags || '',
        status: 'draft', // 导入的组件默认为草稿状态
        version: compData.version || '1.0.0',
        ownerId: req.user.id,
        overwriteExisting
      }

      const component = await dataService.createComponent(newComponentData)

      // 清理相关缓存
      await this.clearComponentCache()

      logger.info('组件导入', {
        userId: req.user.id,
        action: 'IMPORT_COMPONENT',
        componentId: component.id,
        componentName: compData.name,
        overwriteExisting
      })

      res.status(201).json({
        success: true,
        message: '组件导入成功',
        data: component
      })
    } catch (error) {
      logger.error('导入组件失败', {
        error: error.message,
        stack: error.stack,
        userId: req.user.id
      })
      errorHandler.handleError(error, res)
    }
  }

  // 验证组件
  async validateComponent(req, res) {
    try {
      const { configuration } = req.body

      if (!configuration) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_CONFIGURATION',
            message: '组件配置不能为空'
          }
        })
      }

      const validation = this.validateComponentConfiguration(configuration)

      logger.info('组件配置验证', {
        userId: req.user.id,
        action: 'VALIDATE_COMPONENT',
        isValid: validation.isValid
      })

      res.json({
        success: true,
        data: validation
      })
    } catch (error) {
      logger.error('验证组件失败', {
        error: error.message,
        stack: error.stack,
        userId: req.user.id
      })
      errorHandler.handleError(error, res)
    }
  }

  // 评分组件
  async rateComponent(req, res) {
    try {
      const { id } = req.params
      const { rating, comment } = req.body

      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_RATING',
            message: '评分必须在1-5之间'
          }
        })
      }

      const component = await dataService.getComponentById(id)
      if (!component) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'COMPONENT_NOT_FOUND',
            message: '组件不存在'
          }
        })
      }

      if (component.status !== 'published') {
        return res.status(400).json({
          success: false,
          error: {
            code: 'COMPONENT_NOT_PUBLISHED',
            message: '只能对已发布的组件进行评分'
          }
        })
      }

      // 创建或更新评分
      const ratingData = {
        componentId: id,
        userId: req.user.id,
        rating,
        comment: comment || ''
      }

      const result = await dataService.createOrUpdateComponentRating(ratingData)
      
      if (!result.success) {
        return res.status(500).json({
          success: false,
          error: {
            code: 'RATING_FAILED',
            message: '评分失败'
          }
        })
      }
      logger.info('组件评分', {
        userId: req.user.id,
        action: 'RATE_COMPONENT',
        componentId: id,
        rating,
        isUpdate: result.isUpdate
      })

      res.json({
        success: true,
        message: result.isUpdate ? '评分更新成功' : '评分提交成功'
      })
    } catch (error) {
      logger.error('评分组件失败', {
        error: error.message,
        stack: error.stack,
        userId: req.user.id,
        componentId: req.params.id
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

  validateComponentConfiguration(configuration) {
    const errors = []
    const warnings = []

    // 基本结构验证
    if (!configuration.type) {
      errors.push('缺少组件类型 (type)')
    }

    if (!configuration.entry) {
      errors.push('缺少入口点定义 (entry)')
    }

    // 接口验证
    if (configuration.interfaces) {
      if (!Array.isArray(configuration.interfaces)) {
        errors.push('接口定义必须是数组')
      } else {
        configuration.interfaces.forEach((iface, index) => {
          if (!iface.name) {
            errors.push(`接口 ${index + 1} 缺少名称`)
          }
          if (!iface.type) {
            errors.push(`接口 ${index + 1} 缺少类型`)
          }
        })
      }
    }

    // 依赖验证
    if (configuration.dependencies && typeof configuration.dependencies !== 'object') {
      errors.push('依赖定义必须是对象')
    }

    if (errors.length > 0) {
      throw new Error(`组件配置验证失败: ${errors.join(', ')}`)
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  async executeComponentInstallation(component, version) {
    try {
      // TODO: 实现实际的组件安装逻辑
      // 这里应该根据组件类型执行实际的安装操作
      
      return {
        success: true,
        installedVersion: version || component.version,
        installPath: `/components/${component.name}`,
        dependencies: component.dependencies
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  async executeComponentUninstallation(component) {
    try {
      // TODO: 实现实际的组件卸载逻辑
      // 这里应该根据组件类型执行实际的卸载操作
      
      return {
        success: true,
        uninstalledVersion: component.version,
        cleanedPaths: [`/components/${component.name}`]
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  async clearComponentCache() {
    const patterns = [
      'component:*',
      'components:*'
    ]
    
    for (const pattern of patterns) {
      await cache.del(pattern)
    }
  }
}

module.exports = new ComponentController()