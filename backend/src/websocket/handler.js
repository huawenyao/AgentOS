const logger = require('../utils/logger')
const { cache, CacheKeys } = require('../utils/redis')
const { AgentInstance, PerformanceMetric, SystemLog, Message } = require('../models')

/**
 * WebSocket事件处理器
 * 处理实时监控、日志流、Agent状态等WebSocket连接
 */
class WebSocketHandler {
  constructor() {
    this.connections = new Map() // 存储活跃连接
    this.rooms = new Map() // 存储房间信息
  }

  /**
   * 处理新的WebSocket连接
   * @param {Object} socket - Socket.IO socket对象
   * @param {Object} io - Socket.IO服务器实例
   */
  handleConnection(socket, io) {
    const userId = socket.userId
    const userRole = socket.userRole

    // 存储连接信息
    this.connections.set(socket.id, {
      userId,
      userRole,
      socket,
      joinedRooms: new Set()
    })

    logger.info(`WebSocket连接建立`, {
      socketId: socket.id,
      userId,
      userRole
    })

    // 注册事件监听器
    this.registerEventListeners(socket, io)

    // 发送连接成功消息
    socket.emit('connected', {
      message: '连接成功',
      timestamp: new Date().toISOString()
    })
  }

  /**
   * 注册WebSocket事件监听器
   * @param {Object} socket - Socket.IO socket对象
   * @param {Object} io - Socket.IO服务器实例
   */
  registerEventListeners(socket, io) {
    // 加入监控房间
    socket.on('join_monitor', (data) => {
      this.handleJoinMonitor(socket, data)
    })

    // 离开监控房间
    socket.on('leave_monitor', (data) => {
      this.handleLeaveMonitor(socket, data)
    })

    // 订阅Agent日志
    socket.on('subscribe_logs', (data) => {
      this.handleSubscribeLogs(socket, data)
    })

    // 取消订阅Agent日志
    socket.on('unsubscribe_logs', (data) => {
      this.handleUnsubscribeLogs(socket, data)
    })

    // 获取实时指标
    socket.on('get_metrics', (data) => {
      this.handleGetMetrics(socket, data)
    })

    // 发送消息给Agent
    socket.on('send_message', (data) => {
      this.handleSendMessage(socket, data)
    })

    // 断开连接
    socket.on('disconnect', () => {
      this.handleDisconnect(socket)
    })

    // 错误处理
    socket.on('error', (error) => {
      logger.error('WebSocket错误:', {
        socketId: socket.id,
        userId: socket.userId,
        error: error.message
      })
    })
  }

  /**
   * 处理加入监控房间
   * @param {Object} socket - Socket.IO socket对象
   * @param {Object} data - 请求数据
   */
  async handleJoinMonitor(socket, data) {
    try {
      const { type, targetId } = data
      const connection = this.connections.get(socket.id)
      
      if (!connection) {
        socket.emit('error', { message: '连接不存在' })
        return
      }

      // 验证权限
      const hasPermission = await this.checkMonitorPermission(
        connection.userId,
        connection.userRole,
        type,
        targetId
      )

      if (!hasPermission) {
        socket.emit('error', { message: '权限不足' })
        return
      }

      const roomName = `${type}:${targetId}`
      socket.join(roomName)
      connection.joinedRooms.add(roomName)

      // 更新房间信息
      if (!this.rooms.has(roomName)) {
        this.rooms.set(roomName, new Set())
      }
      this.rooms.get(roomName).add(socket.id)

      logger.info('用户加入监控房间', {
        userId: connection.userId,
        roomName
      })

      socket.emit('monitor_joined', {
        type,
        targetId,
        message: '成功加入监控'
      })

      // 发送初始状态
      await this.sendInitialStatus(socket, type, targetId)
    } catch (error) {
      logger.error('加入监控房间失败:', error)
      socket.emit('error', { message: '加入监控失败' })
    }
  }

  /**
   * 处理离开监控房间
   * @param {Object} socket - Socket.IO socket对象
   * @param {Object} data - 请求数据
   */
  handleLeaveMonitor(socket, data) {
    try {
      const { type, targetId } = data
      const connection = this.connections.get(socket.id)
      
      if (!connection) {
        return
      }

      const roomName = `${type}:${targetId}`
      socket.leave(roomName)
      connection.joinedRooms.delete(roomName)

      // 更新房间信息
      if (this.rooms.has(roomName)) {
        this.rooms.get(roomName).delete(socket.id)
        if (this.rooms.get(roomName).size === 0) {
          this.rooms.delete(roomName)
        }
      }

      logger.info('用户离开监控房间', {
        userId: connection.userId,
        roomName
      })

      socket.emit('monitor_left', {
        type,
        targetId,
        message: '已离开监控'
      })
    } catch (error) {
      logger.error('离开监控房间失败:', error)
    }
  }

  /**
   * 处理订阅Agent日志
   * @param {Object} socket - Socket.IO socket对象
   * @param {Object} data - 请求数据
   */
  async handleSubscribeLogs(socket, data) {
    try {
      const { agentId, level = 'info' } = data
      const connection = this.connections.get(socket.id)
      
      if (!connection) {
        socket.emit('error', { message: '连接不存在' })
        return
      }

      // 验证权限
      const hasPermission = await this.checkAgentPermission(
        connection.userId,
        connection.userRole,
        agentId
      )

      if (!hasPermission) {
        socket.emit('error', { message: '权限不足' })
        return
      }

      const roomName = `logs:${agentId}`
      socket.join(roomName)
      connection.joinedRooms.add(roomName)

      logger.info('用户订阅Agent日志', {
        userId: connection.userId,
        agentId,
        level
      })

      socket.emit('logs_subscribed', {
        agentId,
        level,
        message: '日志订阅成功'
      })

      // 发送最近的日志
      await this.sendRecentLogs(socket, agentId, level)
    } catch (error) {
      logger.error('订阅日志失败:', error)
      socket.emit('error', { message: '订阅日志失败' })
    }
  }

  /**
   * 处理取消订阅Agent日志
   * @param {Object} socket - Socket.IO socket对象
   * @param {Object} data - 请求数据
   */
  handleUnsubscribeLogs(socket, data) {
    try {
      const { agentId } = data
      const connection = this.connections.get(socket.id)
      
      if (!connection) {
        return
      }

      const roomName = `logs:${agentId}`
      socket.leave(roomName)
      connection.joinedRooms.delete(roomName)

      logger.info('用户取消订阅Agent日志', {
        userId: connection.userId,
        agentId
      })

      socket.emit('logs_unsubscribed', {
        agentId,
        message: '已取消日志订阅'
      })
    } catch (error) {
      logger.error('取消订阅日志失败:', error)
    }
  }

  /**
   * 处理获取实时指标
   * @param {Object} socket - Socket.IO socket对象
   * @param {Object} data - 请求数据
   */
  async handleGetMetrics(socket, data) {
    try {
      const { agentId, metricTypes = [] } = data
      const connection = this.connections.get(socket.id)
      
      if (!connection) {
        socket.emit('error', { message: '连接不存在' })
        return
      }

      // 验证权限
      const hasPermission = await this.checkAgentPermission(
        connection.userId,
        connection.userRole,
        agentId
      )

      if (!hasPermission) {
        socket.emit('error', { message: '权限不足' })
        return
      }

      // 获取最新指标
      const metrics = await this.getLatestMetrics(agentId, metricTypes)
      
      socket.emit('metrics_data', {
        agentId,
        metrics,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      logger.error('获取指标失败:', error)
      socket.emit('error', { message: '获取指标失败' })
    }
  }

  /**
   * 处理发送消息给Agent
   * @param {Object} socket - Socket.IO socket对象
   * @param {Object} data - 请求数据
   */
  async handleSendMessage(socket, data) {
    try {
      const { agentId, content, contentType = 'text' } = data
      const connection = this.connections.get(socket.id)
      
      if (!connection) {
        socket.emit('error', { message: '连接不存在' })
        return
      }

      // 验证权限
      const hasPermission = await this.checkAgentPermission(
        connection.userId,
        connection.userRole,
        agentId
      )

      if (!hasPermission) {
        socket.emit('error', { message: '权限不足' })
        return
      }

      // 创建消息记录
      const message = await Message.create({
        agentId,
        direction: 'incoming',
        content,
        contentType,
        sourceId: connection.userId,
        correlationId: `ws_${socket.id}_${Date.now()}`
      })

      // 广播消息到Agent监控房间
      const roomName = `agent:${agentId}`
      socket.to(roomName).emit('agent_message', {
        messageId: message.id,
        agentId,
        content,
        contentType,
        direction: 'incoming',
        timestamp: message.timestamp
      })

      socket.emit('message_sent', {
        messageId: message.id,
        message: '消息发送成功'
      })

      logger.info('WebSocket消息发送成功', {
        userId: connection.userId,
        agentId,
        messageId: message.id
      })
    } catch (error) {
      logger.error('发送消息失败:', error)
      socket.emit('error', { message: '发送消息失败' })
    }
  }

  /**
   * 处理连接断开
   * @param {Object} socket - Socket.IO socket对象
   */
  handleDisconnect(socket) {
    const connection = this.connections.get(socket.id)
    
    if (connection) {
      // 清理房间信息
      connection.joinedRooms.forEach(roomName => {
        if (this.rooms.has(roomName)) {
          this.rooms.get(roomName).delete(socket.id)
          if (this.rooms.get(roomName).size === 0) {
            this.rooms.delete(roomName)
          }
        }
      })

      logger.info('WebSocket连接断开', {
        socketId: socket.id,
        userId: connection.userId
      })

      this.connections.delete(socket.id)
    }
  }

  /**
   * 检查监控权限
   * @param {number} userId - 用户ID
   * @param {string} userRole - 用户角色
   * @param {string} type - 监控类型
   * @param {number} targetId - 目标ID
   * @returns {boolean} 是否有权限
   */
  async checkMonitorPermission(userId, userRole, type, targetId) {
    try {
      // 管理员有所有权限
      if (userRole === 'admin') {
        return true
      }

      // 根据类型检查权限
      switch (type) {
        case 'agent':
          return await this.checkAgentPermission(userId, userRole, targetId)
        case 'workflow':
          return await this.checkWorkflowPermission(userId, userRole, targetId)
        case 'system':
          return userRole === 'admin' || userRole === 'developer'
        default:
          return false
      }
    } catch (error) {
      logger.error('检查监控权限失败:', error)
      return false
    }
  }

  /**
   * 检查Agent权限
   * @param {number} userId - 用户ID
   * @param {string} userRole - 用户角色
   * @param {number} agentId - Agent ID
   * @returns {boolean} 是否有权限
   */
  async checkAgentPermission(userId, userRole, agentId) {
    try {
      if (userRole === 'admin') {
        return true
      }

      const agent = await AgentInstance.findByPk(agentId, {
        include: [{
          model: require('../models').AgentConfig,
          as: 'config'
        }]
      })

      if (!agent) {
        return false
      }

      return agent.config.ownerId === userId
    } catch (error) {
      logger.error('检查Agent权限失败:', error)
      return false
    }
  }

  /**
   * 检查工作流权限
   * @param {number} userId - 用户ID
   * @param {string} userRole - 用户角色
   * @param {number} workflowId - 工作流ID
   * @returns {boolean} 是否有权限
   */
  async checkWorkflowPermission(userId, userRole, workflowId) {
    try {
      if (userRole === 'admin') {
        return true
      }

      const workflow = await require('../models').Workflow.findByPk(workflowId)
      if (!workflow) {
        return false
      }

      return workflow.authorId === userId
    } catch (error) {
      logger.error('检查工作流权限失败:', error)
      return false
    }
  }

  /**
   * 发送初始状态
   * @param {Object} socket - Socket.IO socket对象
   * @param {string} type - 监控类型
   * @param {number} targetId - 目标ID
   */
  async sendInitialStatus(socket, type, targetId) {
    try {
      switch (type) {
        case 'agent':
          const agent = await AgentInstance.findByPk(targetId)
          if (agent) {
            socket.emit('agent_status', {
              agentId: targetId,
              status: agent.status,
              timestamp: new Date().toISOString()
            })
          }
          break
        case 'workflow':
          const workflow = await require('../models').Workflow.findByPk(targetId)
          if (workflow) {
            socket.emit('workflow_status', {
              workflowId: targetId,
              status: workflow.status,
              timestamp: new Date().toISOString()
            })
          }
          break
        case 'system':
          const systemStats = await this.getSystemStats()
          socket.emit('system_status', {
            stats: systemStats,
            timestamp: new Date().toISOString()
          })
          break
      }
    } catch (error) {
      logger.error('发送初始状态失败:', error)
    }
  }

  /**
   * 发送最近的日志
   * @param {Object} socket - Socket.IO socket对象
   * @param {number} agentId - Agent ID
   * @param {string} level - 日志级别
   */
  async sendRecentLogs(socket, agentId, level) {
    try {
      const logs = await SystemLog.findAll({
        where: {
          agentId,
          level: level === 'all' ? undefined : level
        },
        order: [['timestamp', 'DESC']],
        limit: 50
      })

      socket.emit('recent_logs', {
        agentId,
        logs: logs.reverse(), // 按时间正序
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      logger.error('发送最近日志失败:', error)
    }
  }

  /**
   * 获取最新指标
   * @param {number} agentId - Agent ID
   * @param {Array} metricTypes - 指标类型列表
   * @returns {Object} 指标数据
   */
  async getLatestMetrics(agentId, metricTypes) {
    try {
      const whereClause = { agentId }
      if (metricTypes.length > 0) {
        whereClause.metricType = metricTypes
      }

      const metrics = await PerformanceMetric.findAll({
        where: whereClause,
        order: [['timestamp', 'DESC']],
        limit: 100
      })

      // 按指标类型分组
      const groupedMetrics = {}
      metrics.forEach(metric => {
        if (!groupedMetrics[metric.metricType]) {
          groupedMetrics[metric.metricType] = []
        }
        groupedMetrics[metric.metricType].push({
          value: metric.value,
          unit: metric.unit,
          timestamp: metric.timestamp,
          metadata: metric.metadata
        })
      })

      return groupedMetrics
    } catch (error) {
      logger.error('获取最新指标失败:', error)
      return {}
    }
  }

  /**
   * 获取系统统计信息
   * @returns {Object} 系统统计信息
   */
  async getSystemStats() {
    try {
      // 从缓存获取或计算系统统计信息
      const cacheKey = CacheKeys.systemStats()
      let stats = await cache.get(cacheKey)

      if (!stats) {
        const [totalAgents, runningAgents, totalWorkflows, activeWorkflows] = await Promise.all([
          AgentInstance.count(),
          AgentInstance.count({ where: { status: 'running' } }),
          require('../models').Workflow.count(),
          require('../models').Workflow.count({ where: { status: 'active' } })
        ])

        stats = {
          totalAgents,
          runningAgents,
          totalWorkflows,
          activeWorkflows,
          timestamp: new Date().toISOString()
        }

        await cache.set(cacheKey, stats, 60) // 缓存1分钟
      }

      return stats
    } catch (error) {
      logger.error('获取系统统计信息失败:', error)
      return {}
    }
  }

  /**
   * 广播Agent状态更新
   * @param {number} agentId - Agent ID
   * @param {string} status - 新状态
   * @param {Object} metadata - 元数据
   */
  broadcastAgentStatus(agentId, status, metadata = {}) {
    const roomName = `agent:${agentId}`
    if (this.rooms.has(roomName)) {
      const message = {
        type: 'agent_status',
        agentId,
        status,
        metadata,
        timestamp: new Date().toISOString()
      }

      this.rooms.get(roomName).forEach(socketId => {
        const connection = this.connections.get(socketId)
        if (connection) {
          connection.socket.emit('agent_status', message)
        }
      })

      logger.debug('广播Agent状态更新', { agentId, status })
    }
  }

  /**
   * 广播新日志
   * @param {number} agentId - Agent ID
   * @param {Object} logData - 日志数据
   */
  broadcastLog(agentId, logData) {
    const roomName = `logs:${agentId}`
    if (this.rooms.has(roomName)) {
      const message = {
        type: 'new_log',
        agentId,
        log: logData,
        timestamp: new Date().toISOString()
      }

      this.rooms.get(roomName).forEach(socketId => {
        const connection = this.connections.get(socketId)
        if (connection) {
          connection.socket.emit('new_log', message)
        }
      })
    }
  }

  /**
   * 广播新指标
   * @param {number} agentId - Agent ID
   * @param {Object} metricData - 指标数据
   */
  broadcastMetric(agentId, metricData) {
    const roomName = `agent:${agentId}`
    if (this.rooms.has(roomName)) {
      const message = {
        type: 'new_metric',
        agentId,
        metric: metricData,
        timestamp: new Date().toISOString()
      }

      this.rooms.get(roomName).forEach(socketId => {
        const connection = this.connections.get(socketId)
        if (connection) {
          connection.socket.emit('new_metric', message)
        }
      })
    }
  }

  /**
   * 获取连接统计信息
   * @returns {Object} 连接统计信息
   */
  getConnectionStats() {
    return {
      totalConnections: this.connections.size,
      totalRooms: this.rooms.size,
      connectionsByRole: this.getConnectionsByRole(),
      roomsInfo: this.getRoomsInfo()
    }
  }

  /**
   * 按角色统计连接
   * @returns {Object} 按角色分组的连接数
   */
  getConnectionsByRole() {
    const stats = { admin: 0, developer: 0, user: 0 }
    
    this.connections.forEach(connection => {
      if (stats.hasOwnProperty(connection.userRole)) {
        stats[connection.userRole]++
      }
    })

    return stats
  }

  /**
   * 获取房间信息
   * @returns {Array} 房间信息列表
   */
  getRoomsInfo() {
    const roomsInfo = []
    
    this.rooms.forEach((sockets, roomName) => {
      roomsInfo.push({
        name: roomName,
        connections: sockets.size
      })
    })

    return roomsInfo
  }
}

// 创建WebSocket处理器实例
const websocketHandler = new WebSocketHandler()

module.exports = {
  WebSocketHandler,
  handleConnection: (socket, io) => websocketHandler.handleConnection(socket, io),
  broadcastAgentStatus: (agentId, status, metadata) => 
    websocketHandler.broadcastAgentStatus(agentId, status, metadata),
  broadcastLog: (agentId, logData) => 
    websocketHandler.broadcastLog(agentId, logData),
  broadcastMetric: (agentId, metricData) => 
    websocketHandler.broadcastMetric(agentId, metricData),
  getConnectionStats: () => websocketHandler.getConnectionStats()
}