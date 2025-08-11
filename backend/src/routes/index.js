const express = require('express')
const authRoutes = require('./authRoutes')
const userRoutes = require('./userRoutes')
const agentTemplateRoutes = require('./agentTemplateRoutes')
const agentConfigRoutes = require('./agentConfigRoutes')
const agentRoutes = require('./agentRoutes')
const workflowRoutes = require('./workflowRoutes')
const capabilityRoutes = require('./capabilityRoutes')
const componentRoutes = require('./componentRoutes')
const monitoringRoutes = require('./monitoringRoutes')
const systemRoutes = require('./systemRoutes')
const statisticsRoutes = require('./statisticsRoutes')
const settingsRoutes = require('./settings')
// 新增的路由模块
const workflowEngineRoutes = require('./workflowEngine')
const realTimeDataRoutes = require('./realTimeData')
const systemManagementRoutes = require('./systemManagement')

const router = express.Router()

// API版本信息
router.get('/', (req, res) => {
  res.json({
    success: true,
    data: {
      name: 'EFIAgent API',
      version: '1.0.0',
      description: 'EFIAgent平台后端API',
      timestamp: new Date().toISOString(),
      endpoints: {
        auth: '/api/auth',
        users: '/api/users',
        agentTemplates: '/api/agent-templates',
        agentConfigs: '/api/agent-configs',
        agents: '/api/agents',
        workflows: '/api/workflows',
        capabilities: '/api/capabilities',
        components: '/api/components',
        monitoring: '/api/monitoring',
        system: '/api/system',
        statistics: '/api/statistics',
        settings: '/api/settings',
        workflowEngine: '/api/workflow-engine',
        realTimeData: '/api/realtime-data',
        systemManagement: '/api/system-management'
      }
    },
    timestamp: new Date().toISOString()
  })
})

// 健康检查
router.get('/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.version
    },
    timestamp: new Date().toISOString()
  })
})

// 注册路由
router.use('/auth', authRoutes)
router.use('/users', userRoutes)
router.use('/agent-templates', agentTemplateRoutes)
router.use('/agent-configs', agentConfigRoutes)
router.use('/agents', agentRoutes)
router.use('/workflows', workflowRoutes)
router.use('/capabilities', capabilityRoutes)
router.use('/components', componentRoutes)
router.use('/monitoring', monitoringRoutes)
router.use('/system', systemRoutes)
router.use('/statistics', statisticsRoutes)
router.use('/settings', settingsRoutes)
// 新增的路由注册
router.use('/workflow-engine', workflowEngineRoutes)
router.use('/realtime-data', realTimeDataRoutes)
router.use('/system-management', systemManagementRoutes)

module.exports = router