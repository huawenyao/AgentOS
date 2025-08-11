const redis = require('redis')
require('dotenv').config()

// Redis配置
const config = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  db: process.env.REDIS_DB || 0
}

console.log('Redis配置:')
console.log('Host:', config.host)
console.log('Port:', config.port)
console.log('Password:', config.password ? '***' : 'empty')
console.log('Database:', config.db)

// 测试Redis连接
async function testRedisConnection() {
  let client = null
  
  try {
    console.log('\n正在测试Redis连接...')
    
    client = redis.createClient({
      socket: {
        host: config.host,
        port: config.port,
        connectTimeout: 5000,
        commandTimeout: 5000
      },
      password: config.password,
      database: config.db
    })

    // 错误处理
    client.on('error', (error) => {
      console.error('❌ Redis连接错误:', error.message)
    })

    client.on('connect', () => {
      console.log('✅ Redis连接建立')
    })

    client.on('ready', () => {
      console.log('✅ Redis连接就绪')
    })

    // 连接Redis
    await client.connect()
    
    // 测试连接
    const pong = await client.ping()
    console.log('✅ Redis ping测试成功:', pong)
    
    // 测试基本操作
    await client.set('test_key', 'test_value')
    const value = await client.get('test_key')
    console.log('✅ Redis读写测试成功:', value)
    
    await client.del('test_key')
    console.log('✅ Redis删除测试成功')
    
  } catch (error) {
    console.error('❌ Redis连接失败:')
    console.error('错误类型:', error.name)
    console.error('错误消息:', error.message)
    console.error('错误代码:', error.code)
    console.error('完整错误:', error)
  } finally {
    if (client) {
      try {
        await client.quit()
        console.log('\nRedis连接已关闭')
      } catch (closeError) {
        console.error('关闭Redis连接时出错:', closeError.message)
      }
    }
  }
}

testRedisConnection()