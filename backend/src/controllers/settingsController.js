const dataService = require('../services/dataService')
const { cache } = require('../utils/redis')
const logger = require('../utils/logger')
const { 
  createValidationError, 
  createBusinessError,
  createNotFoundError,
  createPermissionError,
  handleResult 
} = require('../middleware/errorHandler')

/**
 * 设置控制器
 * 处理系统设置和模型配置相关的API请求
 */
class SettingsController {
  
  // ==================== 系统设置相关 ====================
  
  /**
   * 获取系统设置
   */
  getSystemSettings = handleResult(async (req, res) => {
    const config = await dataService.getSystemConfig()
    
    logger.info('系统设置查询', {
      userId: req.user.id,
      action: 'GET_SYSTEM_SETTINGS'
    })
    
    return config
  })
  
  /**
   * 更新系统设置
   */
  updateSystemSettings = handleResult(async (req, res) => {
    // 权限检查：只有管理员可以修改系统设置
    if (req.user.role !== 'admin') {
      throw createPermissionError('只有管理员可以修改系统设置')
    }
    
    const { general, security, features, limits } = req.body
    
    // 验证配置格式
    this.validateSystemConfig({ general, security, features, limits })
    
    const newConfig = {
      general: {
        siteName: general?.siteName || 'EFIAgent',
        siteDescription: general?.siteDescription || 'AI Agent Platform',
        allowRegistration: general?.allowRegistration !== false,
        defaultUserRole: general?.defaultUserRole || 'user',
        timezone: general?.timezone || 'Asia/Shanghai',
        language: general?.language || 'zh-CN'
      },
      security: {
        jwtExpiration: security?.jwtExpiration || '24h',
        refreshTokenExpiration: security?.refreshTokenExpiration || '7d',
        passwordMinLength: security?.passwordMinLength || 8,
        maxLoginAttempts: security?.maxLoginAttempts || 5,
        enableTwoFactor: security?.enableTwoFactor || false,
        sessionTimeout: security?.sessionTimeout || 3600
      },
      features: {
        enableWorkflows: features?.enableWorkflows !== false,
        enableComponents: features?.enableComponents !== false,
        enableMonitoring: features?.enableMonitoring !== false,
        enableVersionControl: features?.enableVersionControl !== false,
        enableCollaboration: features?.enableCollaboration || false
      },
      limits: {
        maxAgentsPerUser: limits?.maxAgentsPerUser || 50,
        maxWorkflowsPerUser: limits?.maxWorkflowsPerUser || 20,
        maxExecutionsPerDay: limits?.maxExecutionsPerDay || 1000,
        maxFileSize: limits?.maxFileSize || 10485760,
        maxConcurrentExecutions: limits?.maxConcurrentExecutions || 10
      }
    }
    
    // 保留现有的模型配置
    const currentConfig = await dataService.getSystemConfig()
    newConfig.models = currentConfig.models
    
    const updatedConfig = await dataService.updateSystemConfig(newConfig, req.user.id)
    
    // 清除缓存
    await cache.del('system:config')
    
    logger.info('系统设置已更新', {
      userId: req.user.id,
      action: 'UPDATE_SYSTEM_SETTINGS'
    })
    
    return updatedConfig
  })
  
  // ==================== 模型配置相关 ====================
  
  /**
   * 获取模型配置
   */
  getModelConfigs = handleResult(async (req, res) => {
    const modelConfigs = await dataService.getModelConfigs()
    
    logger.info('模型配置查询', {
      userId: req.user.id,
      action: 'GET_MODEL_CONFIGS'
    })
    
    return modelConfigs
  })
  
  /**
   * 更新模型配置
   */
  updateModelConfigs = handleResult(async (req, res) => {
    // 权限检查：只有管理员可以修改模型配置
    if (req.user.role !== 'admin') {
      throw createPermissionError('只有管理员可以修改模型配置')
    }
    
    const { defaultProvider, providers } = req.body
    
    // 验证模型配置格式
    this.validateModelConfigs({ defaultProvider, providers })
    
    const modelConfigs = {
      defaultProvider: defaultProvider || 'openai',
      providers: providers || {}
    }
    
    const updatedConfigs = await dataService.updateModelConfigs(modelConfigs, req.user.id)
    
    // 清除缓存
    await cache.del('system:config')
    
    logger.info('模型配置已更新', {
      userId: req.user.id,
      action: 'UPDATE_MODEL_CONFIGS',
      defaultProvider
    })
    
    return updatedConfigs
  })
  
  /**
   * 测试模型连接
   */
  testModelConnection = handleResult(async (req, res) => {
    // 权限检查：只有管理员可以测试模型连接
    if (req.user.role !== 'admin') {
      throw createPermissionError('只有管理员可以测试模型连接')
    }
    
    const { provider, config } = req.body
    
    if (!provider || !config) {
      throw createValidationError('缺少必要的参数：provider 和 config')
    }
    
    const result = await dataService.testModelConnection(provider, config)
    
    logger.info('模型连接测试', {
      userId: req.user.id,
      action: 'TEST_MODEL_CONNECTION',
      provider,
      success: result.success
    })
    
    return result
  })
  
  /**
   * 获取可用的模型提供商
   */
  getAvailableProviders = handleResult(async (req, res) => {
    const providers = {
      openai: {
        name: 'OpenAI',
        description: 'OpenAI GPT模型',
        icon: 'openai',
        supportedModels: ['gpt-4', 'gpt-3.5-turbo', 'gpt-4-turbo'],
        requiredFields: ['apiKey', 'baseUrl']
      },
      azure: {
        name: 'Azure OpenAI',
        description: 'Microsoft Azure OpenAI服务',
        icon: 'azure',
        supportedModels: ['gpt-4', 'gpt-35-turbo'],
        requiredFields: ['apiKey', 'endpoint', 'apiVersion']
      },
      anthropic: {
        name: 'Anthropic',
        description: 'Anthropic Claude模型',
        icon: 'anthropic',
        supportedModels: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'],
        requiredFields: ['apiKey', 'baseUrl']
      },
      local: {
        name: '本地模型',
        description: '本地部署的模型服务',
        icon: 'server',
        supportedModels: ['custom'],
        requiredFields: ['baseUrl']
      }
    }
    
    return providers
  })
  
  /**
   * 重置配置到默认值
   */
  resetToDefaults = handleResult(async (req, res) => {
    // 权限检查：只有管理员可以重置配置
    if (req.user.role !== 'admin') {
      throw createPermissionError('只有管理员可以重置配置')
    }
    
    const { type } = req.body // 'system' | 'models' | 'all'
    
    const defaultConfig = dataService.getDefaultSystemConfig()
    let updatedConfig
    
    if (type === 'models') {
      updatedConfig = await dataService.updateModelConfigs(defaultConfig.models, req.user.id)
    } else if (type === 'system') {
      const { models, ...systemConfig } = defaultConfig
      const currentConfig = await dataService.getSystemConfig()
      const newConfig = { ...systemConfig, models: currentConfig.models }
      updatedConfig = await dataService.updateSystemConfig(newConfig, req.user.id)
    } else {
      updatedConfig = await dataService.updateSystemConfig(defaultConfig, req.user.id)
    }
    
    // 清除缓存
    await cache.del('system:config')
    
    logger.info('配置已重置', {
      userId: req.user.id,
      action: 'RESET_CONFIG',
      type
    })
    
    return updatedConfig
  })
  
  // ==================== 验证方法 ====================
  
  /**
   * 验证系统配置
   */
  validateSystemConfig(config) {
    if (config.security?.passwordMinLength < 6) {
      throw createValidationError('密码最小长度不能少于6位')
    }
    if (config.limits?.maxAgentsPerUser < 1) {
      throw createValidationError('每用户最大Agent数量必须大于0')
    }
    if (config.limits?.maxWorkflowsPerUser < 1) {
      throw createValidationError('每用户最大工作流数量必须大于0')
    }
    if (config.limits?.maxExecutionsPerDay < 1) {
      throw createValidationError('每日最大执行次数必须大于0')
    }
  }
  
  /**
   * 验证模型配置
   */
  validateModelConfigs(config) {
    if (!config.defaultProvider) {
      throw createValidationError('必须指定默认模型提供商')
    }
    
    if (!config.providers || typeof config.providers !== 'object') {
      throw createValidationError('模型提供商配置格式错误')
    }
    
    // 验证默认提供商是否存在
    if (!config.providers[config.defaultProvider]) {
      throw createValidationError('默认模型提供商不存在于配置中')
    }
    
    // 验证每个提供商的配置
    Object.entries(config.providers).forEach(([provider, providerConfig]) => {
      if (providerConfig.enabled && !providerConfig.apiKey && provider !== 'local') {
        throw createValidationError(`${provider} 提供商缺少API密钥`)
      }
    })
  }
}

module.exports = new SettingsController()