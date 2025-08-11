/**
 * 模型统一服务
 * 提供前后端数据模型转换和同步的API服务
 */

import { ModelUnifier, BackendCapability, BackendAgent } from '../utils/ModelUnifier';
import {
  Agent2_0,
  CoreCapabilityModule,
  CapabilityOrchestrator
} from '../components/CapabilitySystemTypes';

// API基础配置
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api';

// API响应接口
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// 后端模型接口（从后端API获取的数据格式）




interface BackendOrchestrator {
  id: string;
  name: string;
  description: string;
  orchestration_mode: string;
  execution_strategy: any;
  optimization_settings: any;
  monitoring_config: any;
  created_at: string;
  updated_at: string;
}

/**
 * 模型统一服务类
 */
export class ModelUnifierService {
  /**
   * 获取Agent列表
   */
  static async getAgents(): Promise<Agent2_0[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/agents`);
      const result: ApiResponse<BackendAgent[]> = await response.json();
      
      if (!result.success || !result.data) {
        throw new Error(result.error || '获取Agent列表失败');
      }
      
      return result.data.map(backendAgent => 
        ModelUnifier.backendToFrontendAgent(backendAgent, [])
      );
    } catch (error) {
      console.error('获取Agent列表失败:', error);
      throw error;
    }
  }
  
  /**
   * 获取单个Agent
   */
  static async getAgent(id: string): Promise<Agent2_0> {
    try {
      const response = await fetch(`${API_BASE_URL}/agents/${id}`);
      const result: ApiResponse<BackendAgent> = await response.json();
      
      if (!result.success || !result.data) {
        throw new Error(result.error || '获取Agent失败');
      }
      
      return ModelUnifier.backendToFrontendAgent(result.data, []);
    } catch (error) {
      console.error('获取Agent失败:', error);
      throw error;
    }
  }
  
  /**
   * 创建Agent
   */
  static async createAgent(agent: Agent2_0): Promise<Agent2_0> {
    try {
      const backendAgent = ModelUnifier.frontendToBackendAgent(agent);
      
      const response = await fetch(`${API_BASE_URL}/agents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(backendAgent)
      });
      
      const result: ApiResponse<BackendAgent> = await response.json();
      
      if (!result.success || !result.data) {
        throw new Error(result.error || '创建Agent失败');
      }
      
      return ModelUnifier.backendToFrontendAgent(result.data, []);
    } catch (error) {
      console.error('创建Agent失败:', error);
      throw error;
    }
  }
  
  /**
   * 更新Agent
   */
  static async updateAgent(id: string, agent: Agent2_0): Promise<Agent2_0> {
    try {
      const backendAgent = ModelUnifier.frontendToBackendAgent(agent);
      
      const response = await fetch(`${API_BASE_URL}/agents/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(backendAgent)
      });
      
      const result: ApiResponse<BackendAgent> = await response.json();
      
      if (!result.success || !result.data) {
        throw new Error(result.error || '更新Agent失败');
      }
      
      return ModelUnifier.backendToFrontendAgent(result.data, []);
    } catch (error) {
      console.error('更新Agent失败:', error);
      throw error;
    }
  }
  
  /**
   * 删除Agent
   */
  static async deleteAgent(id: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/agents/${id}`, {
        method: 'DELETE'
      });
      
      const result: ApiResponse<void> = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || '删除Agent失败');
      }
    } catch (error) {
      console.error('删除Agent失败:', error);
      throw error;
    }
  }
  
  /**
   * 获取能力列表
   */
  static async getCapabilities(): Promise<CoreCapabilityModule[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/capabilities`);
      const result: ApiResponse<BackendCapability[]> = await response.json();
      
      if (!result.success || !result.data) {
        throw new Error(result.error || '获取能力列表失败');
      }
      
      return result.data.map(backendCapability => 
        ModelUnifier.backendToFrontendCapability(backendCapability)
      );
    } catch (error) {
      console.error('获取能力列表失败:', error);
      throw error;
    }
  }
  
  /**
   * 获取单个能力
   */
  static async getCapability(id: string): Promise<CoreCapabilityModule> {
    try {
      const response = await fetch(`${API_BASE_URL}/capabilities/${id}`);
      const result: ApiResponse<BackendCapability> = await response.json();
      
      if (!result.success || !result.data) {
        throw new Error(result.error || '获取能力失败');
      }
      
      return ModelUnifier.backendToFrontendCapability(result.data);
    } catch (error) {
      console.error('获取能力失败:', error);
      throw error;
    }
  }
  
  /**
   * 创建能力
   */
  static async createCapability(capability: CoreCapabilityModule): Promise<CoreCapabilityModule> {
    try {
      const backendCapability = ModelUnifier.frontendToBackendCapability(capability);
      
      const response = await fetch(`${API_BASE_URL}/capabilities`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(backendCapability)
      });
      
      const result: ApiResponse<BackendCapability> = await response.json();
      
      if (!result.success || !result.data) {
        throw new Error(result.error || '创建能力失败');
      }
      
      return ModelUnifier.backendToFrontendCapability(result.data);
    } catch (error) {
      console.error('创建能力失败:', error);
      throw error;
    }
  }
  
  /**
   * 更新能力
   */
  static async updateCapability(id: string, capability: CoreCapabilityModule): Promise<CoreCapabilityModule> {
    try {
      const backendCapability = ModelUnifier.frontendToBackendCapability(capability);
      
      const response = await fetch(`${API_BASE_URL}/capabilities/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(backendCapability)
      });
      
      const result: ApiResponse<BackendCapability> = await response.json();
      
      if (!result.success || !result.data) {
        throw new Error(result.error || '更新能力失败');
      }
      
      return ModelUnifier.backendToFrontendCapability(result.data);
    } catch (error) {
      console.error('更新能力失败:', error);
      throw error;
    }
  }
  
  /**
   * 删除能力
   */
  static async deleteCapability(id: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/capabilities/${id}`, {
        method: 'DELETE'
      });
      
      const result: ApiResponse<void> = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || '删除能力失败');
      }
    } catch (error) {
      console.error('删除能力失败:', error);
      throw error;
    }
  }
  
  /**
   * 获取编排器列表
   */
  static async getOrchestrators(): Promise<CapabilityOrchestrator[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/orchestrators`);
      const result: ApiResponse<BackendOrchestrator[]> = await response.json();
      
      if (!result.success || !result.data) {
        throw new Error(result.error || '获取编排器列表失败');
      }
      
      return result.data.map(backendOrchestrator => ({
        id: backendOrchestrator.id,
        name: backendOrchestrator.name,
        description: backendOrchestrator.description,
        mode: backendOrchestrator.orchestration_mode as any,
        priority: 1,
        executionTimeout: 30000,
        retryCount: 3,
        errorHandling: 'continue' as 'stop' | 'continue' | 'fallback',
        rules: [],
        capabilityMapping: [],
        executionStrategy: backendOrchestrator.execution_strategy || {
          loadBalancing: 'round_robin',
          failover: false,
          circuitBreaker: { enabled: false, failureThreshold: 5, recoveryTimeout: 30000, halfOpenMaxCalls: 3 },
          rateLimit: { enabled: false, requestsPerSecond: 100, burstSize: 10, strategy: 'token_bucket' }
        },
        optimization: backendOrchestrator.optimization_settings || {
          enabled: false,
          autoScaling: { enabled: false, minInstances: 1, maxInstances: 10, targetCpuUtilization: 70, targetMemoryUtilization: 80, scaleUpCooldown: 300, scaleDownCooldown: 300 },
          caching: { enabled: false, strategy: 'lru', maxSize: 1000, ttl: 3600 },
          prefetching: { enabled: false, strategy: 'predictive', lookaheadTime: 60 }
        }
      }));
    } catch (error) {
      console.error('获取编排器列表失败:', error);
      throw error;
    }
  }
  
  /**
   * 验证Agent配置
   */
  static async validateAgent(agent: Agent2_0): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    try {
      const backendAgent = ModelUnifier.frontendToBackendAgent(agent);
      
      const response = await fetch(`${API_BASE_URL}/agents/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(backendAgent)
      });
      
      const result = await response.json();
      return result.data || { isValid: false, errors: ['验证失败'], warnings: [] };
    } catch (error) {
      console.error('验证Agent失败:', error);
      return {
        isValid: false,
        errors: ['验证服务不可用'],
        warnings: []
      };
    }
  }
  
  /**
   * 批量同步数据
   */
  static async syncData(): Promise<{
    agents: Agent2_0[];
    capabilities: CoreCapabilityModule[];
    orchestrators: CapabilityOrchestrator[];
  }> {
    try {
      const [agents, capabilities, orchestrators] = await Promise.all([
        this.getAgents(),
        this.getCapabilities(),
        this.getOrchestrators()
      ]);
      
      return {
        agents,
        capabilities,
        orchestrators
      };
    } catch (error) {
      console.error('数据同步失败:', error);
      throw error;
    }
  }
  
  /**
   * 获取模型差异
   */
  static async getModelDifferences(localAgent: Agent2_0, remoteAgentId: string): Promise<{
    hasDifferences: boolean;
    differences: string[];
  }> {
    try {
      const remoteAgent = await this.getAgent(remoteAgentId);
      const differences = ModelUnifier.getDifferences(localAgent, remoteAgent);
      
      return {
        hasDifferences: differences.length > 0,
        differences: differences.map(diff => `${diff.path}: ${diff.type}`)
      };
    } catch (error) {
      console.error('获取模型差异失败:', error);
      throw error;
    }
  }
}

export default ModelUnifierService;