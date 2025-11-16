/**
 * EFIAgent Mock 数据导出（向后兼容版本）
 * 这个文件保持与现有代码的兼容性，同时使用新的稳定数据生成器
 */

// 从新的数据生成器导入
import {
  DataGenerator,
  getMockCapabilities,
  getMockAgents,
  getMockMessages,
  getMockMetrics,
  getMockHealthStatus,
  getMockLearningConfig,
  getMockCollaborationConfig
} from './index';

// 从legacy类型导入兼容类型
import {
  Agent2_0,
  CoreCapabilityModule,
  toAgent2_0,
  toCoreCapabilityModule
} from '../types/legacy';

// ===== 向后兼容的数据生成函数 =====

/**
 * 生成模拟能力模块（兼容旧接口）
 */
export const generateMockCapabilityModules = (): CoreCapabilityModule[] => {
  const capabilities = getMockCapabilities();
  return capabilities.map(cap => toCoreCapabilityModule(cap));
};

/**
 * 生成模拟Agent（兼容旧接口）
 */
export const generateMockAgents = (): Agent2_0[] => {
  const agents = getMockAgents();
  return agents.map(agent => toAgent2_0(agent));
};

// ===== 导出别名以保持兼容性 =====

export const generateMockCapabilities = generateMockCapabilityModules;
export const mockCapabilityModules = generateMockCapabilityModules();
export const mockAgents = generateMockAgents();

// ===== 导出其他数据生成函数 =====

export const generateMockMessages = getMockMessages;
export const generateMockMetrics = getMockMetrics;
export const generateMockHealthStatus = getMockHealthStatus;
export const generateMockLearningConfig = getMockLearningConfig;
export const generateMockCollaborationConfig = getMockCollaborationConfig;

// ===== 导出数据生成器 =====

export { DataGenerator };

// ===== 默认数据实例 =====

export const mockData = {
  capabilities: mockCapabilityModules,
  agents: mockAgents,
  messages: generateMockMessages(),
  metrics: generateMockMetrics(),
  healthStatus: generateMockHealthStatus(),
  learningConfig: generateMockLearningConfig(),
  collaborationConfig: generateMockCollaborationConfig()
};

// ===== 导出便捷函数 =====

/**
 * 获取所有模拟数据
 */
export const getAllMockData = () => mockData;

/**
 * 刷新所有模拟数据
 */
export const refreshMockData = () => {
  const newData = {
    capabilities: generateMockCapabilityModules(),
    agents: generateMockAgents(),
    messages: generateMockMessages(),
    metrics: generateMockMetrics(),
    healthStatus: generateMockHealthStatus(),
    learningConfig: generateMockLearningConfig(),
    collaborationConfig: generateMockCollaborationConfig()
  };

  // 更新缓存数据
  Object.assign(mockData, newData);

  return newData;
};

// ===== 默认导出 =====
export default {
  generateMockCapabilityModules,
  generateMockAgents,
  generateMockCapabilities,
  generateMockMessages,
  generateMockMetrics,
  generateMockHealthStatus,
  generateMockLearningConfig,
  generateMockCollaborationConfig,
  getAllMockData,
  refreshMockData,
  DataGenerator,
  mockData
};