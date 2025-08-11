/**
 * 模拟数据服务
 * 提供与数据库结构对应的模拟数据
 */

const { v4: uuidv4 } = require('uuid')
const moment = require('moment')

class MockDataService {
  constructor() {
    this.initializeData()
  }

  /**
   * 初始化模拟数据
   */
  initializeData() {
    // 用户数据
    this.users = [
      {
        id: 1,
        username: 'admin',
        email: 'admin@efiagent.com',
        role: 'admin',
        avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
        isActive: true,
        lastLoginAt: new Date(),
        createdAt: moment().subtract(30, 'days').toDate(),
        updatedAt: new Date()
      },
      {
        id: 2,
        username: 'developer',
        email: 'dev@efiagent.com',
        role: 'developer',
        avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=developer',
        isActive: true,
        lastLoginAt: moment().subtract(1, 'hour').toDate(),
        createdAt: moment().subtract(15, 'days').toDate(),
        updatedAt: new Date()
      }
    ]

    // Agent模板数据
    this.agentTemplates = [
      {
        id: 1,
        name: '智能对话助手',
        description: '基于大语言模型的智能对话助手，支持多轮对话和上下文理解',
        type: 'execution',
        category: '对话',
        iconUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=chat',
        difficulty: 'beginner',
        featured: true,
        properties: {
          model: 'gpt-3.5-turbo',
          temperature: 0.7,
          maxTokens: 2048,
          systemPrompt: '你是一个友善的AI助手，请用简洁明了的语言回答用户问题。'
        },
        components: [
          { type: 'llm_reasoning', config: { provider: 'openai' } },
          { type: 'message_process', config: { maxHistory: 10 } }
        ],
        capabilities: ['text_generation', 'conversation'],
        tags: ['对话', 'GPT', '智能助手'],
        authorId: 1,
        version: '1.0.0',
        downloadCount: 156,
        rating: 4.8,
        isPublic: true,
        createdAt: moment().subtract(20, 'days').toDate(),
        updatedAt: moment().subtract(5, 'days').toDate()
      },
      {
        id: 2,
        name: '文档分析专家',
        description: '专门用于分析和处理各种文档的AI助手，支持PDF、Word等格式',
        type: 'audit',
        category: '分析',
        iconUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=document',
        difficulty: 'intermediate',
        featured: true,
        properties: {
          model: 'gpt-4',
          temperature: 0.3,
          maxTokens: 4096,
          systemPrompt: '你是一个专业的文档分析专家，请仔细分析文档内容并提供详细的分析报告。'
        },
        components: [
          { type: 'file_operation', config: { supportedFormats: ['pdf', 'docx', 'txt'] } },
          { type: 'llm_reasoning', config: { provider: 'openai' } }
        ],
        capabilities: ['document_analysis', 'text_extraction'],
        tags: ['文档', '分析', 'PDF'],
        authorId: 1,
        version: '1.2.0',
        downloadCount: 89,
        rating: 4.6,
        isPublic: true,
        createdAt: moment().subtract(15, 'days').toDate(),
        updatedAt: moment().subtract(2, 'days').toDate()
      },
      {
        id: 3,
        name: '代码审查助手',
        description: '自动化代码审查工具，支持多种编程语言的代码质量检查',
        type: 'audit',
        category: '开发',
        iconUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=code',
        difficulty: 'advanced',
        featured: false,
        properties: {
          model: 'gpt-4',
          temperature: 0.2,
          maxTokens: 8192,
          systemPrompt: '你是一个资深的代码审查专家，请仔细检查代码质量、安全性和最佳实践。'
        },
        components: [
          { type: 'code_execution', config: { languages: ['python', 'javascript', 'java'] } },
          { type: 'llm_reasoning', config: { provider: 'openai' } }
        ],
        capabilities: ['code_review', 'static_analysis'],
        tags: ['代码', '审查', '质量'],
        authorId: 2,
        version: '2.1.0',
        downloadCount: 234,
        rating: 4.9,
        isPublic: true,
        createdAt: moment().subtract(25, 'days').toDate(),
        updatedAt: moment().subtract(1, 'day').toDate()
      }
    ]

    // Agent配置数据
    this.agentConfigs = [
      {
        id: 1,
        templateId: 1,
        name: '客服助手-001',
        description: '用于客户服务的智能对话助手',
        type: 'execution',
        status: 'running',
        properties: {
          model: 'gpt-3.5-turbo',
          temperature: 0.8,
          maxTokens: 1024,
          systemPrompt: '你是一个专业的客服助手，请耐心回答客户问题。'
        },
        components: [
          { type: 'llm_reasoning', config: { provider: 'openai' } }
        ],
        capabilities: ['customer_service', 'conversation'],
        ownerId: 1,
        lastRunAt: moment().subtract(30, 'minutes').toDate(),
        createdAt: moment().subtract(10, 'days').toDate(),
        updatedAt: moment().subtract(30, 'minutes').toDate()
      },
      {
        id: 2,
        templateId: 2,
        name: '合同分析器',
        description: '专门用于分析法律合同的AI助手',
        type: 'audit',
        status: 'idle',
        properties: {
          model: 'gpt-4',
          temperature: 0.1,
          maxTokens: 4096,
          systemPrompt: '你是一个专业的法律文档分析专家。'
        },
        components: [
          { type: 'file_operation', config: { supportedFormats: ['pdf', 'docx'] } },
          { type: 'llm_reasoning', config: { provider: 'openai' } }
        ],
        capabilities: ['legal_analysis', 'document_review'],
        ownerId: 2,
        lastRunAt: moment().subtract(2, 'hours').toDate(),
        createdAt: moment().subtract(5, 'days').toDate(),
        updatedAt: moment().subtract(1, 'hour').toDate()
      }
    ]

    // 工作流数据
    this.workflows = [
      {
        id: 1,
        name: '客户服务流程',
        description: '完整的客户服务处理流程，包括问题分类、回答生成和满意度调查',
        status: 'active',
        nodes: [
          {
            id: 'start',
            type: 'start',
            position: { x: 100, y: 100 },
            data: { label: '开始' }
          },
          {
            id: 'classify',
            type: 'agent',
            position: { x: 300, y: 100 },
            data: { label: '问题分类', agentId: 1 }
          },
          {
            id: 'answer',
            type: 'agent',
            position: { x: 500, y: 100 },
            data: { label: '生成回答', agentId: 1 }
          },
          {
            id: 'end',
            type: 'end',
            position: { x: 700, y: 100 },
            data: { label: '结束' }
          }
        ],
        connections: [
          { id: 'e1', source: 'start', target: 'classify' },
          { id: 'e2', source: 'classify', target: 'answer' },
          { id: 'e3', source: 'answer', target: 'end' }
        ],
        agents: [1],
        properties: {
          timeout: 300,
          retryCount: 3
        },
        tags: ['客服', '自动化'],
        authorId: 1,
        version: '1.0.0',
        executionCount: 45,
        successCount: 42,
        successRate: 93.33,
        lastExecutedAt: moment().subtract(1, 'hour').toDate(),
        createdAt: moment().subtract(8, 'days').toDate(),
        updatedAt: moment().subtract(1, 'day').toDate()
      }
    ]

    // 能力数据
    this.capabilities = [
      {
        id: 1,
        name: 'Web搜索',
        description: '通过搜索引擎获取实时信息',
        type: 'web_search',
        category: '工具能力',
        iconUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=search',
        components: [
          { type: 'api_call', config: { endpoint: 'search_api' } }
        ],
        properties: {
          searchEngine: 'google',
          maxResults: 10,
          language: 'zh-CN'
        },
        configOptions: {
          apiKey: { type: 'string', required: true, description: '搜索API密钥' },
          timeout: { type: 'number', default: 5000, description: '超时时间(毫秒)' }
        },
        tags: ['搜索', 'API', '实时'],
        authorId: 1,
        version: '1.0.0',
        downloadCount: 89,
        rating: 4.5,
        isPublic: true,
        createdAt: moment().subtract(12, 'days').toDate(),
        updatedAt: moment().subtract(3, 'days').toDate()
      },
      {
        id: 2,
        name: '文件处理',
        description: '读取和处理各种格式的文件',
        type: 'file_operation',
        category: '基础能力',
        iconUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=file',
        components: [
          { type: 'file_operation', config: { supportedFormats: ['pdf', 'docx', 'txt', 'csv'] } }
        ],
        properties: {
          maxFileSize: '10MB',
          supportedFormats: ['pdf', 'docx', 'txt', 'csv'],
          encoding: 'utf-8'
        },
        configOptions: {
          maxFileSize: { type: 'string', default: '10MB', description: '最大文件大小' },
          tempDir: { type: 'string', default: '/tmp', description: '临时目录' }
        },
        tags: ['文件', '处理', 'PDF'],
        authorId: 1,
        version: '1.1.0',
        downloadCount: 156,
        rating: 4.7,
        isPublic: true,
        createdAt: moment().subtract(18, 'days').toDate(),
        updatedAt: moment().subtract(1, 'day').toDate()
      },
      {
        id: 3,
        name: '图像识别',
        description: '识别和分析图像内容',
        type: 'image_processing',
        category: '认知能力',
        iconUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=image',
        components: [
          { type: 'image_processing', config: { provider: 'opencv' } }
        ],
        properties: {
          supportedFormats: ['jpg', 'png', 'gif', 'bmp'],
          maxResolution: '4096x4096',
          features: ['object_detection', 'text_recognition', 'face_detection']
        },
        configOptions: {
          apiKey: { type: 'string', required: true, description: '图像识别API密钥' },
          confidence: { type: 'number', default: 0.8, description: '置信度阈值' }
        },
        tags: ['图像', '识别', 'AI'],
        authorId: 2,
        version: '2.0.0',
        downloadCount: 67,
        rating: 4.3,
        isPublic: true,
        createdAt: moment().subtract(22, 'days').toDate(),
        updatedAt: moment().subtract(4, 'days').toDate()
      }
    ]

    // 组件数据
    this.components = [
      {
        id: 1,
        name: 'LLM推理组件',
        description: '基于大语言模型的推理组件',
        type: 'llm_reasoning',
        category: 'capability',
        iconUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=brain',
        properties: {
          provider: 'openai',
          model: 'gpt-3.5-turbo',
          temperature: 0.7,
          maxTokens: 2048
        },
        inputs: [
          { name: 'prompt', type: 'string', required: true, description: '输入提示' },
          { name: 'context', type: 'string', required: false, description: '上下文信息' }
        ],
        outputs: [
          { name: 'response', type: 'string', description: '模型响应' },
          { name: 'tokens_used', type: 'number', description: '使用的token数量' }
        ],
        configSchema: {
          type: 'object',
          properties: {
            provider: { type: 'string', enum: ['openai', 'anthropic', 'local'] },
            model: { type: 'string' },
            temperature: { type: 'number', minimum: 0, maximum: 2 },
            maxTokens: { type: 'number', minimum: 1, maximum: 8192 }
          },
          required: ['provider', 'model']
        },
        authorId: 1,
        version: '1.0.0',
        isPublic: true,
        createdAt: moment().subtract(30, 'days').toDate(),
        updatedAt: moment().subtract(10, 'days').toDate()
      },
      {
        id: 2,
        name: '消息处理组件',
        description: '处理和管理消息的组件',
        type: 'message_process',
        category: 'communication',
        iconUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=message',
        properties: {
          maxHistory: 10,
          filterProfanity: true,
          enableMarkdown: true
        },
        inputs: [
          { name: 'message', type: 'string', required: true, description: '输入消息' },
          { name: 'history', type: 'array', required: false, description: '历史消息' }
        ],
        outputs: [
          { name: 'processed_message', type: 'string', description: '处理后的消息' },
          { name: 'metadata', type: 'object', description: '消息元数据' }
        ],
        configSchema: {
          type: 'object',
          properties: {
            maxHistory: { type: 'number', minimum: 1, maximum: 100 },
            filterProfanity: { type: 'boolean' },
            enableMarkdown: { type: 'boolean' }
          }
        },
        authorId: 1,
        version: '1.1.0',
        isPublic: true,
        createdAt: moment().subtract(25, 'days').toDate(),
        updatedAt: moment().subtract(5, 'days').toDate()
      }
    ]

    // Agent实例数据
    this.agentInstances = [
      {
        id: 1,
        configId: 1,
        name: '客服助手-001-实例',
        status: 'running',
        processId: 'pid_12345',
        hostInfo: {
          hostname: 'server-01',
          ip: '192.168.1.100',
          port: 8001
        },
        startedAt: moment().subtract(2, 'hours').toDate(),
        stoppedAt: null,
        createdAt: moment().subtract(10, 'days').toDate(),
        updatedAt: moment().subtract(30, 'minutes').toDate()
      },
      {
        id: 2,
        configId: 2,
        name: '合同分析器-实例',
        status: 'idle',
        processId: null,
        hostInfo: {
          hostname: 'server-02',
          ip: '192.168.1.101',
          port: 8002
        },
        startedAt: moment().subtract(1, 'day').toDate(),
        stoppedAt: moment().subtract(2, 'hours').toDate(),
        createdAt: moment().subtract(5, 'days').toDate(),
        updatedAt: moment().subtract(2, 'hours').toDate()
      }
    ]

    // 性能指标数据
    this.performanceMetrics = this.generatePerformanceMetrics()

    // 系统日志数据
    this.systemLogs = this.generateSystemLogs()

    // 消息数据
    this.messages = this.generateMessages()
  }

  /**
   * 生成性能指标数据
   */
  generatePerformanceMetrics() {
    const metrics = []
    const metricTypes = ['response_time', 'throughput', 'success_rate', 'cpu_usage', 'memory_usage']
    const agentIds = [1, 2]
    
    for (let i = 0; i < 100; i++) {
      const agentId = agentIds[Math.floor(Math.random() * agentIds.length)]
      const metricType = metricTypes[Math.floor(Math.random() * metricTypes.length)]
      
      let value, unit
      switch (metricType) {
        case 'response_time':
          value = Math.random() * 2000 + 100 // 100-2100ms
          unit = 'ms'
          break
        case 'throughput':
          value = Math.random() * 100 + 10 // 10-110 requests/min
          unit = 'req/min'
          break
        case 'success_rate':
          value = Math.random() * 20 + 80 // 80-100%
          unit = '%'
          break
        case 'cpu_usage':
          value = Math.random() * 80 + 10 // 10-90%
          unit = '%'
          break
        case 'memory_usage':
          value = Math.random() * 70 + 20 // 20-90%
          unit = '%'
          break
      }
      
      metrics.push({
        id: i + 1,
        agentId,
        metricType,
        value: parseFloat(value.toFixed(2)),
        unit,
        timestamp: moment().subtract(Math.random() * 24, 'hours').toDate(),
        metadata: {
          source: 'system_monitor',
          version: '1.0.0'
        },
        createdAt: moment().subtract(Math.random() * 24, 'hours').toDate(),
        updatedAt: new Date()
      })
    }
    
    return metrics
  }

  /**
   * 生成系统日志数据
   */
  generateSystemLogs() {
    const logs = []
    const levels = ['info', 'warn', 'error', 'debug']
    const modules = ['agent_manager', 'workflow_engine', 'message_handler', 'capability_loader']
    const agentIds = [1, 2, null]
    
    const messages = {
      info: [
        'Agent started successfully',
        'Workflow execution completed',
        'Message processed',
        'Capability loaded'
      ],
      warn: [
        'High memory usage detected',
        'Slow response time',
        'Connection timeout',
        'Rate limit approaching'
      ],
      error: [
        'Failed to connect to external service',
        'Agent execution failed',
        'Invalid configuration',
        'Database connection lost'
      ],
      debug: [
        'Processing message: {messageId}',
        'Loading capability: {capabilityName}',
        'Executing workflow step: {stepName}',
        'Agent state changed: {oldState} -> {newState}'
      ]
    }
    
    for (let i = 0; i < 200; i++) {
      const level = levels[Math.floor(Math.random() * levels.length)]
      const module = modules[Math.floor(Math.random() * modules.length)]
      const agentId = agentIds[Math.floor(Math.random() * agentIds.length)]
      const messageList = messages[level]
      const message = messageList[Math.floor(Math.random() * messageList.length)]
      
      logs.push({
        id: i + 1,
        agentId,
        level,
        message,
        module,
        functionName: `${module}_${Math.floor(Math.random() * 10)}`,
        lineNumber: Math.floor(Math.random() * 1000) + 1,
        stackTrace: level === 'error' ? 'Error stack trace...' : null,
        metadata: {
          requestId: uuidv4(),
          userId: Math.floor(Math.random() * 2) + 1
        },
        timestamp: moment().subtract(Math.random() * 72, 'hours').toDate(),
        createdAt: moment().subtract(Math.random() * 72, 'hours').toDate(),
        updatedAt: new Date()
      })
    }
    
    return logs.sort((a, b) => b.timestamp - a.timestamp)
  }

  /**
   * 生成消息数据
   */
  generateMessages() {
    const messages = []
    const directions = ['incoming', 'outgoing']
    const contentTypes = ['text', 'json', 'markdown']
    const agentIds = [1, 2]
    
    const sampleMessages = [
      '你好，我需要帮助',
      '请分析这个文档',
      '系统运行正常',
      '处理完成，结果如下...',
      '发生了一个错误',
      '任务已经开始执行'
    ]
    
    for (let i = 0; i < 50; i++) {
      const agentId = agentIds[Math.floor(Math.random() * agentIds.length)]
      const direction = directions[Math.floor(Math.random() * directions.length)]
      const contentType = contentTypes[Math.floor(Math.random() * contentTypes.length)]
      const content = sampleMessages[Math.floor(Math.random() * sampleMessages.length)]
      
      messages.push({
        id: i + 1,
        agentId,
        direction,
        content,
        contentType,
        sourceId: direction === 'incoming' ? Math.floor(Math.random() * 2) + 1 : agentId,
        targetId: direction === 'outgoing' ? Math.floor(Math.random() * 2) + 1 : agentId,
        correlationId: uuidv4(),
        metadata: {
          sessionId: uuidv4(),
          channel: 'web'
        },
        timestamp: moment().subtract(Math.random() * 24, 'hours').toDate(),
        createdAt: moment().subtract(Math.random() * 24, 'hours').toDate(),
        updatedAt: new Date()
      })
    }
    
    return messages.sort((a, b) => b.timestamp - a.timestamp)
  }

  /**
   * 模拟网络延迟
   */
  async simulateDelay(min = 100, max = 500) {
    const delay = Math.random() * (max - min) + min
    return new Promise(resolve => setTimeout(resolve, delay))
  }

  /**
   * 模拟随机错误
   */
  simulateRandomError(probability = 0.05) {
    if (Math.random() < probability) {
      const errors = [
        { code: 'NETWORK_ERROR', message: '网络连接失败' },
        { code: 'TIMEOUT_ERROR', message: '请求超时' },
        { code: 'SERVER_ERROR', message: '服务器内部错误' }
      ]
      const error = errors[Math.floor(Math.random() * errors.length)]
      throw new Error(`${error.code}: ${error.message}`)
    }
  }

  // 获取数据的方法
  async getUsers(filters = {}) {
    await this.simulateDelay()
    this.simulateRandomError()
    return this.users.filter(user => {
      if (filters.role && user.role !== filters.role) return false
      if (filters.isActive !== undefined && user.isActive !== filters.isActive) return false
      return true
    })
  }

  async getUserById(id) {
    await this.simulateDelay()
    return this.users.find(user => user.id === parseInt(id))
  }

  async createUser(data) {
    await this.simulateDelay()
    const newUser = {
      id: this.users.length + 1,
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    this.users.push(newUser)
    return newUser
  }

  async getAgentTemplates(filters = {}) {
    await this.simulateDelay()
    this.simulateRandomError()
    return this.agentTemplates.filter(template => {
      if (filters.type && template.type !== filters.type) return false
      if (filters.category && template.category !== filters.category) return false
      if (filters.isPublic !== undefined && template.isPublic !== filters.isPublic) return false
      if (filters.featured !== undefined && template.featured !== filters.featured) return false
      return true
    })
  }

  async getAgentTemplateById(id) {
    await this.simulateDelay()
    this.simulateRandomError()
    return this.agentTemplates.find(template => template.id === parseInt(id))
  }

  async getAgentConfigs(filters = {}) {
    await this.simulateDelay()
    this.simulateRandomError()
    return this.agentConfigs.filter(config => {
      if (filters.type && config.type !== filters.type) return false
      if (filters.status && config.status !== filters.status) return false
      if (filters.ownerId && config.ownerId !== filters.ownerId) return false
      return true
    })
  }

  async getAgentConfigById(id) {
    await this.simulateDelay()
    this.simulateRandomError()
    return this.agentConfigs.find(config => config.id === parseInt(id))
  }

  async getWorkflows(filters = {}) {
    await this.simulateDelay()
    this.simulateRandomError()
    return this.workflows.filter(workflow => {
      if (filters.status && workflow.status !== filters.status) return false
      if (filters.authorId && workflow.authorId !== filters.authorId) return false
      return true
    })
  }

  async getWorkflowById(id) {
    await this.simulateDelay()
    this.simulateRandomError()
    return this.workflows.find(workflow => workflow.id === parseInt(id))
  }

  async getCapabilities(filters = {}) {
    await this.simulateDelay()
    this.simulateRandomError()
    return this.capabilities.filter(capability => {
      if (filters.type && capability.type !== filters.type) return false
      if (filters.category && capability.category !== filters.category) return false
      if (filters.isPublic !== undefined && capability.isPublic !== filters.isPublic) return false
      return true
    })
  }

  async getCapabilityById(id) {
    await this.simulateDelay()
    this.simulateRandomError()
    return this.capabilities.find(capability => capability.id === parseInt(id))
  }

  async getComponents(filters = {}) {
    await this.simulateDelay()
    this.simulateRandomError()
    return this.components.filter(component => {
      if (filters.type && component.type !== filters.type) return false
      if (filters.category && component.category !== filters.category) return false
      if (filters.isPublic !== undefined && component.isPublic !== filters.isPublic) return false
      return true
    })
  }

  async getComponentById(id) {
    await this.simulateDelay()
    this.simulateRandomError()
    return this.components.find(component => component.id === parseInt(id))
  }

  async getAgentInstances(filters = {}) {
    await this.simulateDelay()
    this.simulateRandomError()
    return this.agentInstances.filter(instance => {
      if (filters.status && instance.status !== filters.status) return false
      if (filters.configId && instance.configId !== filters.configId) return false
      return true
    })
  }

  async getAgentInstanceById(id) {
    await this.simulateDelay()
    this.simulateRandomError()
    return this.agentInstances.find(instance => instance.id === parseInt(id))
  }

  async getPerformanceMetrics(filters = {}) {
    await this.simulateDelay()
    this.simulateRandomError()
    return this.performanceMetrics.filter(metric => {
      if (filters.agentId && metric.agentId !== filters.agentId) return false
      if (filters.metricType && metric.metricType !== filters.metricType) return false
      return true
    })
  }

  async getSystemLogs(filters = {}) {
    await this.simulateDelay()
    this.simulateRandomError()
    return this.systemLogs.filter(log => {
      if (filters.agentId && log.agentId !== filters.agentId) return false
      if (filters.level && log.level !== filters.level) return false
      if (filters.module && log.module !== filters.module) return false
      return true
    })
  }

  async getMessages(filters = {}) {
    await this.simulateDelay()
    this.simulateRandomError()
    return this.messages.filter(message => {
      if (filters.agentId && message.agentId !== filters.agentId) return false
      if (filters.direction && message.direction !== filters.direction) return false
      return true
    })
  }

  // 创建数据的方法
  async createAgentTemplate(data) {
    await this.simulateDelay()
    this.simulateRandomError()
    const newTemplate = {
      id: Math.max(...this.agentTemplates.map(t => t.id)) + 1,
      ...data,
      downloadCount: 0,
      rating: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    this.agentTemplates.push(newTemplate)
    return newTemplate
  }

  async createAgentConfig(data) {
    await this.simulateDelay()
    this.simulateRandomError()
    const newConfig = {
      id: Math.max(...this.agentConfigs.map(c => c.id)) + 1,
      ...data,
      status: 'idle',
      lastRunAt: null,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    this.agentConfigs.push(newConfig)
    return newConfig
  }

  async createWorkflow(data) {
    await this.simulateDelay()
    this.simulateRandomError()
    const newWorkflow = {
      id: Math.max(...this.workflows.map(w => w.id)) + 1,
      ...data,
      status: 'draft',
      executionCount: 0,
      successCount: 0,
      successRate: 0,
      lastExecutedAt: null,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    this.workflows.push(newWorkflow)
    return newWorkflow
  }

  // 更新数据的方法
  async updateAgentTemplate(id, data) {
    await this.simulateDelay()
    this.simulateRandomError()
    const index = this.agentTemplates.findIndex(t => t.id === parseInt(id))
    if (index === -1) return null
    
    this.agentTemplates[index] = {
      ...this.agentTemplates[index],
      ...data,
      updatedAt: new Date()
    }
    return this.agentTemplates[index]
  }

  async updateAgentConfig(id, data) {
    await this.simulateDelay()
    this.simulateRandomError()
    const index = this.agentConfigs.findIndex(c => c.id === parseInt(id))
    if (index === -1) return null
    
    this.agentConfigs[index] = {
      ...this.agentConfigs[index],
      ...data,
      updatedAt: new Date()
    }
    return this.agentConfigs[index]
  }

  async updateWorkflow(id, data) {
    await this.simulateDelay()
    this.simulateRandomError()
    const index = this.workflows.findIndex(w => w.id === parseInt(id))
    if (index === -1) return null
    
    this.workflows[index] = {
      ...this.workflows[index],
      ...data,
      updatedAt: new Date()
    }
    return this.workflows[index]
  }

  // 删除数据的方法
  async deleteAgentTemplate(id) {
    await this.simulateDelay()
    this.simulateRandomError()
    const index = this.agentTemplates.findIndex(t => t.id === parseInt(id))
    if (index === -1) return false
    
    this.agentTemplates.splice(index, 1)
    return true
  }

  async deleteAgentConfig(id) {
    await this.simulateDelay()
    this.simulateRandomError()
    const index = this.agentConfigs.findIndex(c => c.id === parseInt(id))
    if (index === -1) return false
    
    this.agentConfigs.splice(index, 1)
    return true
  }

  async deleteWorkflow(id) {
    await this.simulateDelay()
    this.simulateRandomError()
    const index = this.workflows.findIndex(w => w.id === parseInt(id))
    if (index === -1) return false
    
    this.workflows.splice(index, 1)
    return true
  }

  // Agent操作方法
  async startAgent(id) {
    await this.simulateDelay()
    this.simulateRandomError()
    const config = this.agentConfigs.find(c => c.id === parseInt(id))
    if (!config) return null
    
    config.status = 'running'
    config.lastRunAt = new Date()
    config.updatedAt = new Date()
    
    return { success: true, message: 'Agent启动成功' }
  }

  async stopAgent(id) {
    await this.simulateDelay()
    this.simulateRandomError()
    const config = this.agentConfigs.find(c => c.id === parseInt(id))
    if (!config) return null
    
    config.status = 'stopped'
    config.updatedAt = new Date()
    
    return { success: true, message: 'Agent停止成功' }
  }

  // ==================== 系统配置相关 ====================
  
  /**
   * 获取系统配置
   */
  async getSystemConfig() {
    await this.simulateDelay()
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
        maxFileSize: 10485760,
        maxConcurrentExecutions: 10
      },
      models: {
        defaultProvider: 'openai',
        providers: {
          openai: {
            enabled: true,
            apiKey: 'sk-***',
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
   * 更新系统配置
   */
  async updateSystemConfig(config, userId) {
    await this.simulateDelay()
    this.simulateRandomError()
    // 模拟配置更新
    return config
  }

  /**
   * 测试模型连接
   */
  async testModelConnection(provider, modelConfig) {
    await this.simulateDelay(500, 2000)
    
    // 模拟连接测试结果
    const success = Math.random() > 0.2 // 80%成功率
    
    if (success) {
      return {
        success: true,
        latency: Math.floor(Math.random() * 1000) + 100,
        message: '连接测试成功'
      }
    } else {
      return {
        success: false,
        error: '连接超时或API密钥无效',
        message: '连接测试失败'
      }
    }
  }
}

// 创建单例实例
const mockDataService = new MockDataService()

module.exports = mockDataService