const { Sequelize } = require('sequelize')
require('dotenv').config()

// 数据库配置
const config = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  dialect: process.env.DB_DIALECT || 'mysql',
  logging: console.log,
  pool: {
    min: 0,
    max: 5,
    acquire: 30000,
    idle: 10000
  }
}

console.log('数据库配置:')
console.log('Host:', config.host)
console.log('Port:', config.port)
console.log('Database:', config.database)
console.log('Username:', config.username)
console.log('Password:', config.password ? '***' : 'empty')
console.log('Dialect:', config.dialect)

// 创建Sequelize实例
const sequelize = new Sequelize(config.database, config.username, config.password, config)

// 测试数据库连接
async function testConnection() {
  try {
    console.log('\n正在测试数据库连接...')
    await sequelize.authenticate()
    console.log('✅ 数据库连接测试成功!')
    
    // 测试查询
    const [results] = await sequelize.query('SELECT 1 as test')
    console.log('✅ 数据库查询测试成功:', results)
    
  } catch (error) {
    console.error('❌ 数据库连接失败:')
    console.error('错误类型:', error.name)
    console.error('错误消息:', error.message)
    console.error('错误代码:', error.code)
    console.error('完整错误:', error)
  } finally {
    try {
      await sequelize.close()
      console.log('\n数据库连接已关闭')
    } catch (closeError) {
      console.error('关闭数据库连接时出错:', closeError.message)
    }
  }
}

testConnection()