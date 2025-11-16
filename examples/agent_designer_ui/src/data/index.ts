/**
 * EFIAgent 数据统一导出
 * 提供稳定、一致的mock数据和数据生成功能
 */

import { DataGenerator } from './generator';

// ===== 导出数据生成器 =====
export { DataGenerator };

// ===== 导出便捷的数据获取函数 =====

/**
 * 获取模拟能力数据
 */
export const getMockCapabilities = () => {
  return DataGenerator.generateCoreCapabilities(12);
};

/**
 * 获取模拟Agent数据
 */
export const getMockAgents = () => {
  return DataGenerator.generateAgents(8);
};

/**
 * 获取模拟消息数据
 */
export const getMockMessages = () => {
  return DataGenerator.generateMessages(25);
};

/**
 * 获取模拟监控指标
 */
export const getMockMetrics = () => {
  return DataGenerator.generateMonitoringMetrics(18);
};

/**
 * 获取模拟健康状态
 */
export const getMockHealthStatus = () => {
  return DataGenerator.generateHealthStatus();
};

/**
 * 获取模拟学习配置
 */
export const getMockLearningConfig = () => {
  return DataGenerator.generateLearningConfig();
};

/**
 * 获取模拟协作配置
 */
export const getMockCollaborationConfig = () => {
  return DataGenerator.generateCollaborationConfig();
};

// ===== 兼容性别名 =====

// 为了向后兼容，保留原有函数名
export const generateMockCapabilities = getMockCapabilities;
export const generateMockAgents = getMockAgents;
export const generateMockCapabilityModules = getMockCapabilities; // 别名

// ===== 预定义数据集合 =====

// 缓存的数据，避免重复生成
let cachedCapabilities: any[] | null = null;
let cachedAgents: any[] | null = null;

/**
 * 获取缓存的能力数据（性能优化）
 */
export const getCachedCapabilities = () => {
  if (!cachedCapabilities) {
    cachedCapabilities = getMockCapabilities();
  }
  return cachedCapabilities;
};

/**
 * 获取缓存的Agent数据（性能优化）
 */
export const getCachedAgents = () => {
  if (!cachedAgents) {
    cachedAgents = getMockAgents();
  }
  return cachedAgents;
};

/**
 * 刷新数据缓存
 */
export const refreshDataCache = () => {
  cachedCapabilities = null;
  cachedAgents = null;
};

// ===== 默认导出 =====
export default {
  DataGenerator,
  getMockCapabilities,
  getMockAgents,
  getMockMessages,
  getMockMetrics,
  getMockHealthStatus,
  getMockLearningConfig,
  getMockCollaborationConfig,
  getCachedCapabilities,
  getCachedAgents,
  refreshDataCache,
  generateMockCapabilities,
  generateMockAgents,
  generateMockCapabilityModules
};