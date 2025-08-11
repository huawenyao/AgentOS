console.log('开始测试模块导入...')

try {
  console.log('1. 测试基础模块...')
  const express = require('express')
  const cors = require('cors')
  const helmet = require('helmet')
  console.log('✓ 基础模块导入成功')

  console.log('2. 测试dotenv...')
  require('dotenv').config()
  console.log('✓ dotenv配置成功')

  console.log('3. 测试logger...')
  const logger = require('./src/utils/logger')
  console.log('✓ logger导入成功')

  console.log('4. 测试数据库连接模块...')
  const { connectDatabase } = require('./src/database/connection')
  console.log('✓ 数据库连接模块导入成功')

  console.log('5. 测试Redis模块...')
  const { initRedis } = require('./src/utils/redis')
  console.log('✓ Redis模块导入成功')

  console.log('6. 测试错误处理中间件...')
  const errorHandler = require('./src/middleware/errorHandler')
  console.log('✓ 错误处理中间件导入成功')

  console.log('7. 测试认证中间件...')
  const authMiddleware = require('./src/middleware/auth')
  console.log('✓ 认证中间件导入成功')

  console.log('8. 测试路由模块...')
  const routes = require('./src/routes')
  console.log('✓ 路由模块导入成功')

  console.log('9. 测试WebSocket处理器...')
  const websocketHandler = require('./src/websocket/handler')
  console.log('✓ WebSocket处理器导入成功')

  console.log('\n🎉 所有模块导入测试完成！')

} catch (error) {
  console.error('❌ 模块导入失败:', error.message)
  console.error('错误堆栈:', error.stack)
  process.exit(1)
}