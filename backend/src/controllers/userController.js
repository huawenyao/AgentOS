const bcrypt = require('bcryptjs')
const dataService = require('../services/dataService')
const { cache, CacheKeys } = require('../utils/redis')
const logger = require('../utils/logger')
const { 
  createValidationError, 
  createBusinessError,
  createNotFoundError,
  createPermissionError,
  handleResult 
} = require('../middleware/errorHandler')

// 获取用户列表
const getUsers = handleResult(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    q = '',
    role = '',
    isActive = ''
  } = req.query
  
  // 构建过滤条件
  const filters = {}
  
  if (q) {
    filters.q = q
  }
  
  if (role) {
    filters.role = role
  }
  
  if (isActive !== '') {
    filters.isActive = isActive === 'true'
  }
  
  // 构建分页参数
  const pagination = {
    page: parseInt(page),
    limit: parseInt(limit),
    sortBy,
    sortOrder
  }
  
  const result = await dataService.getUsers(filters, pagination)
  
  return result
})

// 获取单个用户
const getUser = handleResult(async (req, res) => {
  const { id } = req.params
  
  const user = await dataService.getUserById(id)
  
  if (!user) {
    throw createNotFoundError('用户')
  }
  
  return { user }
})

// 创建用户
const createUser = handleResult(async (req, res) => {
  const { username, email, password, role = 'user' } = req.body
  
  // 加密密码
  const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12
  const hashedPassword = await bcrypt.hash(password, saltRounds)
  
  // 创建用户数据
  const userData = {
    username,
    email,
    password: hashedPassword,
    role,
    isActive: true
  }
  
  const user = await dataService.createUser(userData)
  
  logger.info(`管理员 ${req.user.id} 创建了用户 ${user.id}`)
  
  return { user }
})

// 更新用户
const updateUser = handleResult(async (req, res) => {
  const { id } = req.params
  const { username, email, role, isActive } = req.body
  
  const user = await dataService.getUserById(id)
  if (!user) {
    throw createNotFoundError('用户')
  }
  
  // 检查是否尝试修改自己的角色或状态
  if (req.user.id === user.id) {
    if (role !== undefined && role !== user.role) {
      throw createPermissionError('不能修改自己的角色')
    }
    if (isActive !== undefined && isActive !== user.isActive) {
      throw createPermissionError('不能修改自己的状态')
    }
  }
  
  // 更新用户信息
  const updateData = {}
  if (username !== undefined) updateData.username = username
  if (email !== undefined) updateData.email = email
  if (role !== undefined) updateData.role = role
  if (isActive !== undefined) updateData.isActive = isActive
  
  const updatedUser = await dataService.updateUser(id, updateData)
  
  // 清除用户缓存
  await cache.del(CacheKeys.user(user.id))
  
  logger.info(`管理员 ${req.user.id} 更新了用户 ${id}`)
  
  return { user: updatedUser }
})

// 删除用户
const deleteUser = handleResult(async (req, res) => {
  const { id } = req.params
  
  const user = await dataService.getUserById(id)
  if (!user) {
    throw createNotFoundError('用户')
  }
  
  // 不能删除自己
  if (req.user.id === user.id) {
    throw createPermissionError('不能删除自己')
  }
  
  // 软删除：设置为非激活状态
  await dataService.updateUser(id, { isActive: false })
  
  // 清除用户相关缓存
  await Promise.all([
    cache.del(CacheKeys.user(user.id)),
    cache.del(CacheKeys.refreshToken(user.id))
  ])
  
  logger.info(`管理员 ${req.user.id} 删除了用户 ${id}`)
  
  return {
    message: '用户删除成功'
  }
})

// 重置用户密码
const resetPassword = handleResult(async (req, res) => {
  const { id } = req.params
  const { newPassword } = req.body
  
  const user = await dataService.getUserById(id)
  if (!user) {
    throw createNotFoundError('用户')
  }
  
  // 加密新密码
  const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12
  const hashedPassword = await bcrypt.hash(newPassword, saltRounds)
  
  // 更新密码
  await dataService.updateUser(id, {
    password: hashedPassword,
    passwordChangedAt: new Date()
  })
  
  // 清除用户相关缓存，强制重新登录
  await Promise.all([
    cache.del(CacheKeys.user(user.id)),
    cache.del(CacheKeys.refreshToken(user.id))
  ])
  
  logger.info(`管理员 ${req.user.id} 重置了用户 ${id} 的密码`)
  
  return {
    message: '密码重置成功'
  }
})

// 批量操作用户
const batchUpdateUsers = handleResult(async (req, res) => {
  const { userIds, action, data = {} } = req.body
  
  if (!Array.isArray(userIds) || userIds.length === 0) {
    throw createValidationError('用户ID列表不能为空')
  }
  
  // 检查是否包含当前用户
  if (userIds.includes(req.user.id)) {
    throw createPermissionError('不能对自己执行批量操作')
  }
  
  // 验证用户是否存在
  const users = await Promise.all(
    userIds.map(id => dataService.getUserById(id))
  )
  
  if (users.some(user => !user)) {
    throw createValidationError('部分用户不存在')
  }
  
  let updateData = {}
  let message = ''
  
  switch (action) {
    case 'activate':
      updateData = { isActive: true }
      message = '用户批量激活成功'
      break
    case 'deactivate':
      updateData = { isActive: false }
      message = '用户批量停用成功'
      break
    case 'updateRole':
      if (!data.role || !['admin', 'user'].includes(data.role)) {
        throw createValidationError('无效的角色')
      }
      updateData = { role: data.role }
      message = '用户角色批量更新成功'
      break
    default:
      throw createValidationError('无效的操作类型')
  }
  
  // 执行批量更新
  await Promise.all(
    userIds.map(id => dataService.updateUser(id, updateData))
  )
  
  // 清除相关用户缓存
  const cacheKeys = userIds.flatMap(id => [
    CacheKeys.user(id),
    CacheKeys.refreshToken(id)
  ])
  await cache.delBatch(cacheKeys)
  
  logger.info(`管理员 ${req.user.id} 批量操作用户: ${action}, 影响用户数: ${users.length}`)
  
  return {
    message,
    affectedCount: users.length
  }
})

// 获取用户统计信息
const getUserStats = handleResult(async (req, res) => {
  const stats = await dataService.getUserStatistics()
  
  return { stats }
})

// 搜索用户
const searchUsers = handleResult(async (req, res) => {
  const { q, limit = 10 } = req.query
  
  if (!q || q.trim().length < 2) {
    throw createValidationError('搜索关键词至少需要2个字符')
  }
  
  const filters = {
    search: q,
    isActive: true
  }
  
  const pagination = {
    limit: parseInt(limit),
    offset: 0
  }
  
  const result = await dataService.getUsers(filters, pagination)
  
  return { users: result.users }
})

// 更新用户个人资料
const updateProfile = handleResult(async (req, res) => {
  const { username, email } = req.body
  const { user } = req
  
  // 更新用户信息
  const updateData = {}
  if (username !== undefined) updateData.username = username
  if (email !== undefined) updateData.email = email
  
  const updatedUser = await dataService.updateUser(user.id, updateData)
  
  // 清除用户缓存
  await cache.del(CacheKeys.user(user.id))
  
  logger.info(`用户 ${user.id} 更新了个人资料`)
  
  return { user: updatedUser }
})

module.exports = {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  resetPassword,
  batchUpdateUsers,
  getUserStats,
  searchUsers,
  updateProfile
}