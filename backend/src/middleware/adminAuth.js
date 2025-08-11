/**
 * 管理员权限认证中间件
 * 验证用户是否具有管理员权限
 * 基于EFIAgent产品设计文档实现
 */

const logger = require('../utils/logger');

/**
 * 管理员权限验证中间件
 * 检查用户是否具有管理员或超级管理员权限
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - Express下一个中间件函数
 */
const adminAuth = (req, res, next) => {
  try {
    // 检查用户是否已通过基础认证
    if (!req.user) {
      logger.warn('管理员权限验证失败：用户未认证', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path
      });
      
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: '用户未认证'
        }
      });
    }

    // 检查用户角色
    const userRole = req.user.role;
    const adminRoles = ['admin', 'super_admin', 'system_admin'];
    
    if (!adminRoles.includes(userRole)) {
      logger.warn('管理员权限验证失败：权限不足', {
        userId: req.user.id,
        userRole: userRole,
        requiredRoles: adminRoles,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
        method: req.method
      });
      
      return res.status(403).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: '权限不足，需要管理员权限'
        }
      });
    }

    // 检查用户状态
    if (req.user.status !== 'active') {
      logger.warn('管理员权限验证失败：用户状态异常', {
        userId: req.user.id,
        userStatus: req.user.status,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path
      });
      
      return res.status(403).json({
        success: false,
        error: {
          code: 'USER_STATUS_INVALID',
          message: '用户状态异常，无法访问管理功能'
        }
      });
    }

    // 记录管理员操作日志
    logger.info('管理员权限验证通过', {
      userId: req.user.id,
      username: req.user.username,
      userRole: userRole,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path,
      method: req.method,
      action: 'ADMIN_ACCESS'
    });

    // 在请求对象中添加管理员标识
    req.isAdmin = true;
    req.adminLevel = userRole;
    
    next();
    
  } catch (error) {
    logger.error('管理员权限验证中间件错误', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path
    });
    
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: '服务器内部错误'
      }
    });
  }
};

/**
 * 超级管理员权限验证中间件
 * 检查用户是否具有超级管理员权限
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - Express下一个中间件函数
 */
const superAdminAuth = (req, res, next) => {
  try {
    // 先进行基础管理员权限验证
    adminAuth(req, res, (err) => {
      if (err) {
        return next(err);
      }
      
      // 检查是否为超级管理员
      if (req.user.role !== 'super_admin') {
        logger.warn('超级管理员权限验证失败：权限不足', {
          userId: req.user.id,
          userRole: req.user.role,
          requiredRole: 'super_admin',
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          path: req.path,
          method: req.method
        });
        
        return res.status(403).json({
          success: false,
          error: {
            code: 'INSUFFICIENT_PERMISSIONS',
            message: '权限不足，需要超级管理员权限'
          }
        });
      }
      
      // 记录超级管理员操作日志
      logger.info('超级管理员权限验证通过', {
        userId: req.user.id,
        username: req.user.username,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
        method: req.method,
        action: 'SUPER_ADMIN_ACCESS'
      });
      
      req.isSuperAdmin = true;
      next();
    });
    
  } catch (error) {
    logger.error('超级管理员权限验证中间件错误', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path
    });
    
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: '服务器内部错误'
      }
    });
  }
};

/**
 * 检查特定权限的中间件工厂函数
 * @param {string|Array} permissions - 需要的权限或权限数组
 * @returns {Function} 权限验证中间件
 */
const checkPermissions = (permissions) => {
  return (req, res, next) => {
    try {
      // 确保用户已通过基础认证
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: '用户未认证'
          }
        });
      }

      // 将权限转换为数组
      const requiredPermissions = Array.isArray(permissions) ? permissions : [permissions];
      const userPermissions = req.user.permissions || [];
      
      // 超级管理员拥有所有权限
      if (req.user.role === 'super_admin') {
        return next();
      }
      
      // 检查用户是否拥有所需权限
      const hasPermission = requiredPermissions.every(permission => 
        userPermissions.includes(permission)
      );
      
      if (!hasPermission) {
        logger.warn('权限验证失败：缺少必要权限', {
          userId: req.user.id,
          userPermissions: userPermissions,
          requiredPermissions: requiredPermissions,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          path: req.path,
          method: req.method
        });
        
        return res.status(403).json({
          success: false,
          error: {
            code: 'INSUFFICIENT_PERMISSIONS',
            message: '权限不足，缺少必要权限'
          }
        });
      }
      
      logger.info('权限验证通过', {
        userId: req.user.id,
        requiredPermissions: requiredPermissions,
        ip: req.ip,
        path: req.path,
        method: req.method
      });
      
      next();
      
    } catch (error) {
      logger.error('权限验证中间件错误', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.id,
        requiredPermissions: permissions,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path
      });
      
      return res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: '服务器内部错误'
        }
      });
    }
  };
};

module.exports = {
  adminAuth,
  superAdminAuth,
  checkPermissions
};

// 默认导出管理员权限验证中间件
module.exports = adminAuth;
module.exports.superAdminAuth = superAdminAuth;
module.exports.checkPermissions = checkPermissions;