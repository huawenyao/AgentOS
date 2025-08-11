const { body, param, query, validationResult } = require('express-validator')
const logger = require('../utils/logger')

// 验证结果处理中间件
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req)
  
  if (!errors.isEmpty()) {
    const errorDetails = errors.array().map(error => ({
      field: error.path || error.param,
      message: error.msg,
      value: error.value
    }))
    
    logger.warn('请求验证失败', {
      endpoint: req.path,
      method: req.method,
      errors: errorDetails,
      ip: req.ip
    })
    
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_001',
        message: '请求参数验证失败',
        details: errorDetails
      },
      timestamp: new Date().toISOString()
    })
  }
  
  next()
}

// 用户相关验证规则
const userValidation = {
  // 用户注册验证
  register: [
    body('username')
      .isLength({ min: 3, max: 50 })
      .withMessage('用户名长度必须在3-50个字符之间')
      .matches(/^[a-zA-Z0-9_-]+$/)
      .withMessage('用户名只能包含字母、数字、下划线和连字符'),
    body('email')
      .isEmail()
      .withMessage('请提供有效的邮箱地址')
      .normalizeEmail(),
    body('password')
      .isLength({ min: 8, max: 128 })
      .withMessage('密码长度必须在8-128个字符之间')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage('密码必须包含至少一个大写字母、一个小写字母、一个数字和一个特殊字符'),
    body('confirmPassword')
      .custom((value, { req }) => {
        if (value !== req.body.password) {
          throw new Error('确认密码与密码不匹配')
        }
        return true
      }),
    handleValidationErrors
  ],
  
  // 用户登录验证
  login: [
    body('username')
      .notEmpty()
      .withMessage('用户名不能为空'),
    body('password')
      .notEmpty()
      .withMessage('密码不能为空'),
    handleValidationErrors
  ],
  
  // 更新用户信息验证
  update: [
    body('username')
      .optional()
      .isLength({ min: 3, max: 50 })
      .withMessage('用户名长度必须在3-50个字符之间')
      .matches(/^[a-zA-Z0-9_-]+$/)
      .withMessage('用户名只能包含字母、数字、下划线和连字符'),
    body('email')
      .optional()
      .isEmail()
      .withMessage('请提供有效的邮箱地址')
      .normalizeEmail(),
    body('role')
      .optional()
      .isIn(['admin', 'user'])
      .withMessage('角色必须是admin或user'),
    handleValidationErrors
  ],
  
  // 修改密码验证
  changePassword: [
    body('currentPassword')
      .notEmpty()
      .withMessage('当前密码不能为空'),
    body('newPassword')
      .isLength({ min: 8, max: 128 })
      .withMessage('新密码长度必须在8-128个字符之间')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage('新密码必须包含至少一个大写字母、一个小写字母、一个数字和一个特殊字符'),
    body('confirmPassword')
      .custom((value, { req }) => {
        if (value !== req.body.newPassword) {
          throw new Error('确认密码与新密码不匹配')
        }
        return true
      }),
    handleValidationErrors
  ]
}

// Agent模板验证规则
const agentTemplateValidation = {
  // 创建Agent模板验证
  create: [
    body('name')
      .isLength({ min: 1, max: 100 })
      .withMessage('模板名称长度必须在1-100个字符之间'),
    body('description')
      .optional()
      .isLength({ max: 500 })
      .withMessage('描述长度不能超过500个字符'),
    body('category')
      .isIn(['assistant', 'automation', 'analysis', 'custom'])
      .withMessage('分类必须是assistant、automation、analysis或custom'),
    body('config')
      .isObject()
      .withMessage('配置必须是一个对象'),
    body('config.model')
      .notEmpty()
      .withMessage('模型不能为空'),
    body('config.temperature')
      .optional()
      .isFloat({ min: 0, max: 2 })
      .withMessage('温度值必须在0-2之间'),
    body('config.maxTokens')
      .optional()
      .isInt({ min: 1, max: 32000 })
      .withMessage('最大令牌数必须在1-32000之间'),
    body('isPublic')
      .optional()
      .isBoolean()
      .withMessage('公开状态必须是布尔值'),
    handleValidationErrors
  ],
  
  // 更新Agent模板验证
  update: [
    param('id')
      .isUUID()
      .withMessage('模板ID必须是有效的UUID'),
    body('name')
      .optional()
      .isLength({ min: 1, max: 100 })
      .withMessage('模板名称长度必须在1-100个字符之间'),
    body('description')
      .optional()
      .isLength({ max: 500 })
      .withMessage('描述长度不能超过500个字符'),
    body('category')
      .optional()
      .isIn(['assistant', 'automation', 'analysis', 'custom'])
      .withMessage('分类必须是assistant、automation、analysis或custom'),
    body('config')
      .optional()
      .isObject()
      .withMessage('配置必须是一个对象'),
    body('isPublic')
      .optional()
      .isBoolean()
      .withMessage('公开状态必须是布尔值'),
    handleValidationErrors
  ]
}

// Agent配置验证规则
const agentConfigValidation = {
  // 创建Agent配置验证
  create: [
    body('name')
      .isLength({ min: 1, max: 100 })
      .withMessage('配置名称长度必须在1-100个字符之间'),
    body('templateId')
      .isUUID()
      .withMessage('模板ID必须是有效的UUID'),
    body('config')
      .isObject()
      .withMessage('配置必须是一个对象'),
    body('isActive')
      .optional()
      .isBoolean()
      .withMessage('激活状态必须是布尔值'),
    handleValidationErrors
  ],
  
  // 更新Agent配置验证
  update: [
    param('id')
      .isUUID()
      .withMessage('配置ID必须是有效的UUID'),
    body('name')
      .optional()
      .isLength({ min: 1, max: 100 })
      .withMessage('配置名称长度必须在1-100个字符之间'),
    body('config')
      .optional()
      .isObject()
      .withMessage('配置必须是一个对象'),
    body('isActive')
      .optional()
      .isBoolean()
      .withMessage('激活状态必须是布尔值'),
    handleValidationErrors
  ]
}

// 工作流验证规则
const workflowValidation = {
  // 创建工作流验证
  create: [
    body('name')
      .isLength({ min: 1, max: 100 })
      .withMessage('工作流名称长度必须在1-100个字符之间'),
    body('description')
      .optional()
      .isLength({ max: 500 })
      .withMessage('描述长度不能超过500个字符'),
    body('definition')
      .isObject()
      .withMessage('工作流定义必须是一个对象'),
    body('definition.nodes')
      .isArray()
      .withMessage('节点必须是一个数组'),
    body('definition.edges')
      .isArray()
      .withMessage('边必须是一个数组'),
    body('isActive')
      .optional()
      .isBoolean()
      .withMessage('激活状态必须是布尔值'),
    handleValidationErrors
  ],
  
  // 更新工作流验证
  update: [
    param('id')
      .isUUID()
      .withMessage('工作流ID必须是有效的UUID'),
    body('name')
      .optional()
      .isLength({ min: 1, max: 100 })
      .withMessage('工作流名称长度必须在1-100个字符之间'),
    body('description')
      .optional()
      .isLength({ max: 500 })
      .withMessage('描述长度不能超过500个字符'),
    body('definition')
      .optional()
      .isObject()
      .withMessage('工作流定义必须是一个对象'),
    body('isActive')
      .optional()
      .isBoolean()
      .withMessage('激活状态必须是布尔值'),
    handleValidationErrors
  ],
  
  // 执行工作流验证
  execute: [
    param('id')
      .isUUID()
      .withMessage('工作流ID必须是有效的UUID'),
    body('input')
      .optional()
      .isObject()
      .withMessage('输入参数必须是一个对象'),
    handleValidationErrors
  ]
}

// 能力验证规则
const capabilityValidation = {
  // 创建能力验证
  create: [
    body('name')
      .isLength({ min: 1, max: 100 })
      .withMessage('能力名称长度必须在1-100个字符之间'),
    body('description')
      .optional()
      .isLength({ max: 500 })
      .withMessage('描述长度不能超过500个字符'),
    body('type')
      .isIn(['api', 'function', 'tool', 'integration'])
      .withMessage('类型必须是api、function、tool或integration'),
    body('config')
      .isObject()
      .withMessage('配置必须是一个对象'),
    body('isActive')
      .optional()
      .isBoolean()
      .withMessage('激活状态必须是布尔值'),
    handleValidationErrors
  ],
  
  // 更新能力验证
  update: [
    param('id')
      .isUUID()
      .withMessage('能力ID必须是有效的UUID'),
    body('name')
      .optional()
      .isLength({ min: 1, max: 100 })
      .withMessage('能力名称长度必须在1-100个字符之间'),
    body('description')
      .optional()
      .isLength({ max: 500 })
      .withMessage('描述长度不能超过500个字符'),
    body('type')
      .optional()
      .isIn(['api', 'function', 'tool', 'integration'])
      .withMessage('类型必须是api、function、tool或integration'),
    body('config')
      .optional()
      .isObject()
      .withMessage('配置必须是一个对象'),
    body('isActive')
      .optional()
      .isBoolean()
      .withMessage('激活状态必须是布尔值'),
    handleValidationErrors
  ]
}

// 组件验证
const componentValidation = {
  // 创建组件验证
  create: [
    body('name')
      .isLength({ min: 1, max: 100 })
      .withMessage('组件名称长度必须在1-100个字符之间'),
    body('description')
      .optional()
      .isLength({ max: 500 })
      .withMessage('描述长度不能超过500个字符'),
    body('category')
      .isIn(['ui', 'logic', 'data', 'integration', 'utility'])
      .withMessage('分类必须是ui、logic、data、integration或utility'),
    body('type')
      .isIn(['component', 'plugin', 'widget', 'service'])
      .withMessage('类型必须是component、plugin、widget或service'),
    body('version')
      .matches(/^\d+\.\d+\.\d+$/)
      .withMessage('版本号必须符合语义化版本格式'),
    body('config')
      .isObject()
      .withMessage('配置必须是一个对象'),
    body('isPublic')
      .optional()
      .isBoolean()
      .withMessage('公开状态必须是布尔值'),
    handleValidationErrors
  ],
  
  // 更新组件验证
  update: [
    param('id')
      .isUUID()
      .withMessage('组件ID必须是有效的UUID'),
    body('name')
      .optional()
      .isLength({ min: 1, max: 100 })
      .withMessage('组件名称长度必须在1-100个字符之间'),
    body('description')
      .optional()
      .isLength({ max: 500 })
      .withMessage('描述长度不能超过500个字符'),
    body('category')
      .optional()
      .isIn(['ui', 'logic', 'data', 'integration', 'utility'])
      .withMessage('分类必须是ui、logic、data、integration或utility'),
    body('type')
      .optional()
      .isIn(['component', 'plugin', 'widget', 'service'])
      .withMessage('类型必须是component、plugin、widget或service'),
    body('config')
      .optional()
      .isObject()
      .withMessage('配置必须是一个对象'),
    body('isPublic')
      .optional()
      .isBoolean()
      .withMessage('公开状态必须是布尔值'),
    handleValidationErrors
  ]
}

// 通用验证规则
const commonValidation = {
  // UUID参数验证
  uuidParam: (paramName = 'id') => [
    param(paramName)
      .isUUID()
      .withMessage(`${paramName}必须是有效的UUID`),
    handleValidationErrors
  ],
  
  // 分页验证
  pagination: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('页码必须是大于0的整数'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('每页数量必须是1-100之间的整数'),
    query('sortBy')
      .optional()
      .isString()
      .withMessage('排序字段必须是字符串'),
    query('sortOrder')
      .optional()
      .isIn(['asc', 'desc'])
      .withMessage('排序方向必须是asc或desc'),
    handleValidationErrors
  ],
  
  // 搜索验证
  search: [
    query('q')
      .optional()
      .isLength({ min: 1, max: 100 })
      .withMessage('搜索关键词长度必须在1-100个字符之间'),
    query('category')
      .optional()
      .isString()
      .withMessage('分类必须是字符串')
  ],
  
  // 文件上传验证
  fileUpload: [
    body('type')
      .optional()
      .isIn(['image', 'document', 'data'])
      .withMessage('文件类型必须是image、document或data'),
    body('maxSize')
      .optional()
      .isInt({ min: 1 })
      .withMessage('最大文件大小必须是正整数'),
    handleValidationErrors
  ]
}

// 自定义验证函数
const customValidators = {
  // 验证JSON字符串
  isValidJSON: (value) => {
    try {
      JSON.parse(value)
      return true
    } catch (error) {
      throw new Error('必须是有效的JSON字符串')
    }
  },
  
  // 验证URL
  isValidURL: (value) => {
    try {
      new URL(value)
      return true
    } catch (error) {
      throw new Error('必须是有效的URL')
    }
  },
  
  // 验证CRON表达式
  isValidCron: (value) => {
    const cronRegex = /^(\*|([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])|\*\/([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])) (\*|([0-9]|1[0-9]|2[0-3])|\*\/([0-9]|1[0-9]|2[0-3])) (\*|([1-9]|1[0-9]|2[0-9]|3[0-1])|\*\/([1-9]|1[0-9]|2[0-9]|3[0-1])) (\*|([1-9]|1[0-2])|\*\/([1-9]|1[0-2])) (\*|([0-6])|\*\/([0-6]))$/
    if (!cronRegex.test(value)) {
      throw new Error('必须是有效的CRON表达式')
    }
    return true
  }
}

module.exports = {
  handleValidationErrors,
  userValidation,
  agentTemplateValidation,
  agentConfigValidation,
  workflowValidation,
  capabilityValidation,
  componentValidation,
  commonValidation,
  customValidators,
  // 导出常用的验证函数
  validateUuidParam: commonValidation.uuidParam,
  validatePagination: commonValidation.pagination,
  validateSearch: commonValidation.search,
  validateCreateAgentTemplate: agentTemplateValidation.create,
  validateUpdateAgentTemplate: agentTemplateValidation.update,
  validateCreateAgentConfig: agentConfigValidation.create,
  validateUpdateAgentConfig: agentConfigValidation.update,
  validateCreateWorkflow: workflowValidation.create,
  validateUpdateWorkflow: workflowValidation.update,
  validateExecuteWorkflow: workflowValidation.execute,
  validateCreateCapability: capabilityValidation.create,
  validateUpdateCapability: capabilityValidation.update,
  validateCreateComponent: componentValidation.create,
  validateUpdateComponent: componentValidation.update
}