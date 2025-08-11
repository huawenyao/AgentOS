const { Sequelize } = require('sequelize')
const logger = require('../utils/logger')

// 数据库配置
const config = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  database: process.env.DB_NAME || 'efiagent',
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  dialect: process.env.DB_DIALECT || 'mysql',
  logging: process.env.NODE_ENV === 'development' ? (msg) => logger.debug(msg) : false,
  pool: {
    min: parseInt(process.env.DB_POOL_MIN) || 0,
    max: parseInt(process.env.DB_POOL_MAX) || 10,
    acquire: parseInt(process.env.DB_POOL_ACQUIRE) || 30000,
    idle: parseInt(process.env.DB_POOL_IDLE) || 10000
  },
  define: {
    timestamps: true,
    underscored: true,
    freezeTableName: true
  },
  timezone: '+08:00'
}

// 创建Sequelize实例
const sequelize = new Sequelize(config.database, config.username, config.password, config)

// 测试数据库连接
async function connectDatabase() {
  try {
    await sequelize.authenticate()
    logger.info('数据库连接测试成功')
    
    // 同步模型（仅在开发环境）
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true })
      logger.info('数据库模型同步完成')
    }
    
    return sequelize
  } catch (error) {
    logger.warn('数据库连接失败，应用将在无数据库模式下运行:', error.message)
    return null
  }
}

// 关闭数据库连接
async function closeDatabase() {
  try {
    await sequelize.close()
    logger.info('数据库连接已关闭')
  } catch (error) {
    logger.error('关闭数据库连接失败:', error)
    throw error
  }
}

module.exports = {
  sequelize,
  connectDatabase,
  closeDatabase
}