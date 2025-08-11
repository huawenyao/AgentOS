const logger = require('../utils/logger')
const dataService = require('./dataService')
const { WorkflowExecution, AgentInstance } = require('../models')
const EventEmitter = require('events')

/**
 * 工作流引擎服务
 * 负责工作流的执行、调度和监控
 */
class WorkflowEngineService extends EventEmitter {
  constructor() {
    super()
    this.runningWorkflows = new Map() // 正在运行的工作流
    this.executionQueue = [] // 执行队列
    this.isProcessing = false
    this.capabilities = new Map() // 能力模块注册表
    this.agents = new Map() // Agent实例注册表
    
    // 启动执行队列处理
    this.startQueueProcessor()
  }

  // ==================== 工作流定义管理 ====================

  /**
   * 验证工作流定义
   */
  async validateWorkflowDefinition(definition) {
    try {
      const errors = []
      
      // 基本结构验证
      if (!definition.nodes || !Array.isArray(definition.nodes)) {
        errors.push('工作流必须包含节点数组')
      }
      
      if (!definition.edges || !Array.isArray(definition.edges)) {
        errors.push('工作流必须包含连接数组')
      }
      
      // 节点验证
      const nodeIds = new Set()
      for (const node of definition.nodes || []) {
        if (!node.id) {
          errors.push('节点必须有唯一ID')
          continue
        }
        
        if (nodeIds.has(node.id)) {
          errors.push(`重复的节点ID: ${node.id}`)
        }
        nodeIds.add(node.id)
        
        if (!node.type) {
          errors.push(`节点 ${node.id} 缺少类型`)
        }
        
        // 验证节点配置
        if (node.type === 'agent' && !node.config?.agentId) {
          errors.push(`Agent节点 ${node.id} 缺少agentId配置`)
        }
        
        if (node.type === 'capability' && !node.config?.capabilityId) {
          errors.push(`能力节点 ${node.id} 缺少capabilityId配置`)
        }
      }
      
      // 连接验证
      for (const edge of definition.edges || []) {
        if (!edge.source || !edge.target) {
          errors.push('连接必须有源节点和目标节点')
          continue
        }
        
        if (!nodeIds.has(edge.source)) {
          errors.push(`连接引用了不存在的源节点: ${edge.source}`)
        }
        
        if (!nodeIds.has(edge.target)) {
          errors.push(`连接引用了不存在的目标节点: ${edge.target}`)
        }
      }
      
      // 检查是否有开始节点
      const startNodes = definition.nodes.filter(node => node.type === 'start')
      if (startNodes.length === 0) {
        errors.push('工作流必须有开始节点')
      } else if (startNodes.length > 1) {
        errors.push('工作流只能有一个开始节点')
      }
      
      return {
        valid: errors.length === 0,
        errors
      }
    } catch (error) {
      logger.error('验证工作流定义失败:', error)
      return {
        valid: false,
        errors: ['工作流定义格式错误']
      }
    }
  }

  /**
   * 解析工作流依赖
   */
  async parseWorkflowDependencies(definition) {
    const dependencies = {
      agents: new Set(),
      capabilities: new Set(),
      components: new Set()
    }
    
    for (const node of definition.nodes || []) {
      if (node.type === 'agent' && node.config?.agentId) {
        dependencies.agents.add(node.config.agentId)
      }
      
      if (node.type === 'capability' && node.config?.capabilityId) {
        dependencies.capabilities.add(node.config.capabilityId)
      }
      
      if (node.type === 'component' && node.config?.componentId) {
        dependencies.components.add(node.config.componentId)
      }
    }
    
    return {
      agents: Array.from(dependencies.agents),
      capabilities: Array.from(dependencies.capabilities),
      components: Array.from(dependencies.components)
    }
  }

  // ==================== 工作流执行管理 ====================

  /**
   * 执行工作流
   */
  async executeWorkflow(workflowId, input = {}, options = {}) {
    try {
      // 获取工作流定义
      const workflow = await dataService.getWorkflowById(workflowId)
      if (!workflow) {
        throw new Error(`工作流不存在: ${workflowId}`)
      }
      
      // 验证工作流定义
      const validation = await this.validateWorkflowDefinition(workflow.definition)
      if (!validation.valid) {
        throw new Error(`工作流定义无效: ${validation.errors.join(', ')}`)
      }
      
      // 创建执行记录
      const execution = await WorkflowExecution.create({
        workflowId,
        status: 'pending',
        input,
        startTime: new Date(),
        metadata: {
          options,
          nodeStates: {},
          executionPath: []
        }
      })
      
      // 添加到执行队列
      this.executionQueue.push({
        executionId: execution.id,
        workflowId,
        workflow,
        input,
        options,
        priority: options.priority || 0
      })
      
      // 排序队列（优先级高的先执行）
      this.executionQueue.sort((a, b) => b.priority - a.priority)
      
      logger.info(`工作流执行已加入队列: ${execution.id}`)
      
      return {
        executionId: execution.id,
        status: 'queued'
      }
    } catch (error) {
      logger.error('执行工作流失败:', error)
      throw error
    }
  }

  /**
   * 启动队列处理器
   */
  startQueueProcessor() {
    setInterval(async () => {
      if (!this.isProcessing && this.executionQueue.length > 0) {
        this.isProcessing = true
        const task = this.executionQueue.shift()
        
        try {
          await this.processWorkflowExecution(task)
        } catch (error) {
          logger.error('处理工作流执行失败:', error)
        } finally {
          this.isProcessing = false
        }
      }
    }, 1000) // 每秒检查一次
  }

  /**
   * 处理工作流执行
   */
  async processWorkflowExecution(task) {
    const { executionId, workflow, input } = task
    
    try {
      // 更新执行状态
      await WorkflowExecution.update(
        { status: 'running', startTime: new Date() },
        { where: { id: executionId } }
      )
      
      // 添加到运行中的工作流
      this.runningWorkflows.set(executionId, {
        ...task,
        startTime: Date.now(),
        currentNode: null,
        nodeStates: {},
        executionPath: []
      })
      
      // 发送开始事件
      this.emit('workflowStarted', { executionId, workflowId: workflow.id })
      
      // 执行工作流
      const result = await this.runWorkflowNodes(executionId, workflow, input)
      
      // 更新执行结果
      await WorkflowExecution.update(
        {
          status: 'completed',
          endTime: new Date(),
          output: result,
          metadata: {
            ...task.options,
            nodeStates: this.runningWorkflows.get(executionId)?.nodeStates || {},
            executionPath: this.runningWorkflows.get(executionId)?.executionPath || []
          }
        },
        { where: { id: executionId } }
      )
      
      // 发送完成事件
      this.emit('workflowCompleted', { executionId, result })
      
      logger.info(`工作流执行完成: ${executionId}`)
      
    } catch (error) {
      // 更新执行状态为失败
      await WorkflowExecution.update(
        {
          status: 'failed',
          endTime: new Date(),
          error: error.message,
          metadata: {
            ...task.options,
            nodeStates: this.runningWorkflows.get(executionId)?.nodeStates || {},
            executionPath: this.runningWorkflows.get(executionId)?.executionPath || []
          }
        },
        { where: { id: executionId } }
      )
      
      // 发送失败事件
      this.emit('workflowFailed', { executionId, error: error.message })
      
      logger.error(`工作流执行失败: ${executionId}`, error)
    } finally {
      // 从运行中的工作流移除
      this.runningWorkflows.delete(executionId)
    }
  }

  /**
   * 执行工作流节点
   */
  async runWorkflowNodes(executionId, workflow, input) {
    const { nodes, edges } = workflow.definition
    const execution = this.runningWorkflows.get(executionId)
    
    // 找到开始节点
    const startNode = nodes.find(node => node.type === 'start')
    if (!startNode) {
      throw new Error('找不到开始节点')
    }
    
    let currentData = input
    let currentNodeId = startNode.id
    
    while (currentNodeId) {
      const node = nodes.find(n => n.id === currentNodeId)
      if (!node) {
        throw new Error(`找不到节点: ${currentNodeId}`)
      }
      
      // 更新当前节点
      execution.currentNode = currentNodeId
      execution.executionPath.push(currentNodeId)
      
      // 发送节点开始事件
      this.emit('nodeStarted', { executionId, nodeId: currentNodeId })
      
      try {
        // 执行节点
        const nodeResult = await this.executeNode(node, currentData, execution)
        
        // 保存节点状态
        execution.nodeStates[currentNodeId] = {
          status: 'completed',
          input: currentData,
          output: nodeResult,
          timestamp: new Date().toISOString()
        }
        
        // 更新数据
        currentData = nodeResult
        
        // 发送节点完成事件
        this.emit('nodeCompleted', { executionId, nodeId: currentNodeId, result: nodeResult })
        
        // 如果是结束节点，退出循环
        if (node.type === 'end') {
          break
        }
        
        // 找到下一个节点
        currentNodeId = this.getNextNode(currentNodeId, edges, nodeResult)
        
      } catch (error) {
        // 保存节点错误状态
        execution.nodeStates[currentNodeId] = {
          status: 'failed',
          input: currentData,
          error: error.message,
          timestamp: new Date().toISOString()
        }
        
        // 发送节点失败事件
        this.emit('nodeFailed', { executionId, nodeId: currentNodeId, error: error.message })
        
        throw error
      }
    }
    
    return currentData
  }

  /**
   * 执行单个节点
   */
  async executeNode(node, input, execution) {
    switch (node.type) {
      case 'start':
        return input
        
      case 'end':
        return input
        
      case 'agent':
        return await this.executeAgentNode(node, input, execution)
        
      case 'capability':
        return await this.executeCapabilityNode(node, input, execution)
        
      case 'condition':
        return await this.executeConditionNode(node, input, execution)
        
      case 'transform':
        return await this.executeTransformNode(node, input, execution)
        
      case 'delay':
        return await this.executeDelayNode(node, input, execution)
        
      default:
        throw new Error(`不支持的节点类型: ${node.type}`)
    }
  }

  /**
   * 执行Agent节点
   */
  async executeAgentNode(node, input, execution) {
    const { agentId, method = 'process', timeout = 30000 } = node.config || {}
    
    if (!agentId) {
      throw new Error('Agent节点缺少agentId配置')
    }
    
    // 获取Agent实例
    const agent = this.agents.get(agentId)
    if (!agent) {
      throw new Error(`Agent实例不存在: ${agentId}`)
    }
    
    // 执行Agent方法
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Agent执行超时: ${agentId}`)
      }, timeout)
      
      agent[method](input)
        .then(result => {
          clearTimeout(timer)
          resolve(result)
        })
        .catch(error => {
          clearTimeout(timer)
          reject(error)
        })
    })
  }

  /**
   * 执行能力节点
   */
  async executeCapabilityNode(node, input, execution) {
    const { capabilityId, method = 'execute', timeout = 30000 } = node.config || {}
    
    if (!capabilityId) {
      throw new Error('能力节点缺少capabilityId配置')
    }
    
    // 获取能力实例
    const capability = this.capabilities.get(capabilityId)
    if (!capability) {
      throw new Error(`能力实例不存在: ${capabilityId}`)
    }
    
    // 执行能力方法
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`能力执行超时: ${capabilityId}`))
      }, timeout)
      
      capability[method](input)
        .then(result => {
          clearTimeout(timer)
          resolve(result)
        })
        .catch(error => {
          clearTimeout(timer)
          reject(error)
        })
    })
  }

  /**
   * 执行条件节点
   */
  async executeConditionNode(node, input, execution) {
    const { condition, trueValue, falseValue } = node.config || {}
    
    if (!condition) {
      throw new Error('条件节点缺少condition配置')
    }
    
    try {
      // 简单的条件评估（可以扩展为更复杂的表达式引擎）
      const result = this.evaluateCondition(condition, input)
      
      return {
        ...input,
        conditionResult: result,
        selectedValue: result ? trueValue : falseValue
      }
    } catch (error) {
      throw new Error(`条件评估失败: ${error.message}`)
    }
  }

  /**
   * 执行转换节点
   */
  async executeTransformNode(node, input, execution) {
    const { transform } = node.config || {}
    
    if (!transform) {
      return input
    }
    
    try {
      // 简单的数据转换（可以扩展为更复杂的转换引擎）
      return this.applyTransform(transform, input)
    } catch (error) {
      throw new Error(`数据转换失败: ${error.message}`)
    }
  }

  /**
   * 执行延迟节点
   */
  async executeDelayNode(node, input, execution) {
    const { delay = 1000 } = node.config || {}
    
    await new Promise(resolve => setTimeout(resolve, delay))
    return input
  }

  /**
   * 获取下一个节点
   */
  getNextNode(currentNodeId, edges, nodeResult) {
    const outgoingEdges = edges.filter(edge => edge.source === currentNodeId)
    
    if (outgoingEdges.length === 0) {
      return null // 没有下一个节点
    }
    
    if (outgoingEdges.length === 1) {
      return outgoingEdges[0].target
    }
    
    // 多个出边，根据条件选择
    for (const edge of outgoingEdges) {
      if (this.evaluateEdgeCondition(edge, nodeResult)) {
        return edge.target
      }
    }
    
    // 如果没有条件匹配，选择默认边
    const defaultEdge = outgoingEdges.find(edge => edge.isDefault)
    return defaultEdge ? defaultEdge.target : outgoingEdges[0].target
  }

  /**
   * 评估条件
   */
  evaluateCondition(condition, data) {
    // 简单的条件评估实现
    // 实际项目中可以使用更强大的表达式引擎
    try {
      const func = new Function('data', `return ${condition}`)
      return func(data)
    } catch (error) {
      logger.error('条件评估错误:', error)
      return false
    }
  }

  /**
   * 评估边条件
   */
  evaluateEdgeCondition(edge, data) {
    if (!edge.condition) {
      return true
    }
    
    return this.evaluateCondition(edge.condition, data)
  }

  /**
   * 应用数据转换
   */
  applyTransform(transform, data) {
    // 简单的数据转换实现
    if (typeof transform === 'string') {
      try {
        const func = new Function('data', `return ${transform}`)
        return func(data)
      } catch (error) {
        logger.error('数据转换错误:', error)
        return data
      }
    }
    
    if (typeof transform === 'object') {
      const result = {}
      for (const [key, value] of Object.entries(transform)) {
        if (typeof value === 'string' && value.startsWith('data.')) {
          const path = value.substring(5)
          result[key] = this.getNestedValue(data, path)
        } else {
          result[key] = value
        }
      }
      return result
    }
    
    return data
  }

  /**
   * 获取嵌套值
   */
  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined
    }, obj)
  }

  /**
   * 停止工作流执行
   */
  async stopWorkflowExecution(executionId) {
    try {
      const execution = this.runningWorkflows.get(executionId)
      if (!execution) {
        throw new Error(`工作流执行不存在或未运行: ${executionId}`)
      }
      
      // 更新执行状态
      await WorkflowExecution.update(
        {
          status: 'stopped',
          endTime: new Date(),
          metadata: {
            ...execution.options,
            nodeStates: execution.nodeStates,
            executionPath: execution.executionPath,
            stopReason: 'manual'
          }
        },
        { where: { id: executionId } }
      )
      
      // 从运行中的工作流移除
      this.runningWorkflows.delete(executionId)
      
      // 发送停止事件
      this.emit('workflowStopped', { executionId })
      
      logger.info(`工作流执行已停止: ${executionId}`)
      
      return true
    } catch (error) {
      logger.error('停止工作流执行失败:', error)
      throw error
    }
  }

  /**
   * 暂停工作流执行
   */
  async pauseWorkflowExecution(executionId) {
    try {
      const execution = this.runningWorkflows.get(executionId)
      if (!execution) {
        throw new Error(`工作流执行不存在或未运行: ${executionId}`)
      }
      
      execution.paused = true
      
      // 更新执行状态
      await WorkflowExecution.update(
        { status: 'paused' },
        { where: { id: executionId } }
      )
      
      // 发送暂停事件
      this.emit('workflowPaused', { executionId })
      
      logger.info(`工作流执行已暂停: ${executionId}`)
      
      return true
    } catch (error) {
      logger.error('暂停工作流执行失败:', error)
      throw error
    }
  }

  /**
   * 恢复工作流执行
   */
  async resumeWorkflowExecution(executionId) {
    try {
      const execution = this.runningWorkflows.get(executionId)
      if (!execution) {
        throw new Error(`工作流执行不存在或未运行: ${executionId}`)
      }
      
      execution.paused = false
      
      // 更新执行状态
      await WorkflowExecution.update(
        { status: 'running' },
        { where: { id: executionId } }
      )
      
      // 发送恢复事件
      this.emit('workflowResumed', { executionId })
      
      logger.info(`工作流执行已恢复: ${executionId}`)
      
      return true
    } catch (error) {
      logger.error('恢复工作流执行失败:', error)
      throw error
    }
  }

  // ==================== 能力模块管理 ====================

  /**
   * 注册能力模块
   */
  registerCapability(capabilityId, capability) {
    this.capabilities.set(capabilityId, capability)
    logger.info(`能力模块已注册: ${capabilityId}`)
  }

  /**
   * 注销能力模块
   */
  unregisterCapability(capabilityId) {
    this.capabilities.delete(capabilityId)
    logger.info(`能力模块已注销: ${capabilityId}`)
  }

  /**
   * 获取已注册的能力模块
   */
  getRegisteredCapabilities() {
    return Array.from(this.capabilities.keys())
  }

  // ==================== Agent管理 ====================

  /**
   * 注册Agent实例
   */
  registerAgent(agentId, agent) {
    this.agents.set(agentId, agent)
    logger.info(`Agent实例已注册: ${agentId}`)
  }

  /**
   * 注销Agent实例
   */
  unregisterAgent(agentId) {
    this.agents.delete(agentId)
    logger.info(`Agent实例已注销: ${agentId}`)
  }

  /**
   * 获取已注册的Agent实例
   */
  getRegisteredAgents() {
    return Array.from(this.agents.keys())
  }

  // ==================== 工作流引擎监控 ====================

  /**
   * 获取引擎状态
   */
  getEngineStatus() {
    return {
      isRunning: true,
      runningWorkflows: this.runningWorkflows.size,
      queuedWorkflows: this.executionQueue.length,
      registeredCapabilities: this.capabilities.size,
      registeredAgents: this.agents.size,
      isProcessing: this.isProcessing
    }
  }

  /**
   * 获取运行中的工作流
   */
  getRunningWorkflows() {
    const workflows = []
    for (const [executionId, execution] of this.runningWorkflows) {
      workflows.push({
        executionId,
        workflowId: execution.workflowId,
        startTime: execution.startTime,
        currentNode: execution.currentNode,
        executionPath: execution.executionPath,
        paused: execution.paused || false
      })
    }
    return workflows
  }

  /**
   * 获取执行队列
   */
  getExecutionQueue() {
    return this.executionQueue.map(task => ({
      executionId: task.executionId,
      workflowId: task.workflowId,
      priority: task.priority
    }))
  }

  /**
   * 获取执行统计
   */
  async getExecutionStatistics(timeRange = '24h') {
    try {
      const endTime = new Date()
      const startTime = new Date()
      
      // 计算时间范围
      switch (timeRange) {
        case '1h':
          startTime.setHours(startTime.getHours() - 1)
          break
        case '24h':
          startTime.setDate(startTime.getDate() - 1)
          break
        case '7d':
          startTime.setDate(startTime.getDate() - 7)
          break
        case '30d':
          startTime.setDate(startTime.getDate() - 30)
          break
        default:
          startTime.setDate(startTime.getDate() - 1)
      }
      
      // 查询执行统计
      const executions = await WorkflowExecution.findAll({
        where: {
          createdAt: {
            [require('sequelize').Op.between]: [startTime, endTime]
          }
        },
        attributes: ['status', 'startTime', 'endTime']
      })
      
      // 统计数据
      const stats = {
        total: executions.length,
        completed: executions.filter(e => e.status === 'completed').length,
        failed: executions.filter(e => e.status === 'failed').length,
        running: executions.filter(e => e.status === 'running').length,
        pending: executions.filter(e => e.status === 'pending').length,
        stopped: executions.filter(e => e.status === 'stopped').length,
        averageExecutionTime: 0
      }
      
      // 计算平均执行时间
      const completedExecutions = executions.filter(e => e.status === 'completed' && e.endTime)
      if (completedExecutions.length > 0) {
        const totalTime = completedExecutions.reduce((sum, e) => {
          return sum + (new Date(e.endTime) - new Date(e.startTime))
        }, 0)
        stats.averageExecutionTime = Math.round(totalTime / completedExecutions.length)
      }
      
      return stats
    } catch (error) {
      logger.error('获取执行统计失败:', error)
      throw error
    }
  }
}

// 创建单例实例
const workflowEngineService = new WorkflowEngineService()

module.exports = workflowEngineService