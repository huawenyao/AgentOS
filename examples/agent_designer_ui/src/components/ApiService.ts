import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import config from './config.json';

/**
 * API服务类，用于处理与后端的通信
 */
class ApiService {
  private baseUrl: string;
  private timeout: number;
  private headers: Record<string, string>;
  private axiosInstance: AxiosInstance;
  private token: string | null = null;

  /**
   * 构造函数
   */
  constructor() {
    this.baseUrl = config.api.baseUrl;
    this.timeout = config.api.timeout;
    this.headers = config.api.headers;
    
    // 创建axios实例
    this.axiosInstance = axios.create({
      baseURL: this.baseUrl,
      timeout: this.timeout,
      headers: this.headers
    });
    
    // 请求拦截器 - 添加认证token
    this.axiosInstance.interceptors.request.use(
      (config) => {
        if (this.token) {
          config.headers.Authorization = `Bearer ${this.token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );
    
    // 响应拦截器 - 统一处理响应和错误
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          this.clearToken();
          // 可以在这里触发重新登录
          window.dispatchEvent(new CustomEvent('auth:unauthorized'));
        }
        return Promise.reject(error);
      }
    );
    
    // 从localStorage恢复token
    this.loadToken();
  }
  
  /**
   * 设置认证token
   */
  setToken(token: string) {
    this.token = token;
    localStorage.setItem('efiagent_token', token);
  }
  
  /**
   * 清除认证token
   */
  clearToken() {
    this.token = null;
    localStorage.removeItem('efiagent_token');
  }
  
  /**
   * 从localStorage加载token
   */
  private loadToken() {
    const token = localStorage.getItem('efiagent_token');
    if (token) {
      this.token = token;
    }
  }
  
  /**
   * 获取当前token
   */
  getToken(): string | null {
    return this.token;
  }

  // ==================== 认证相关 ====================
  
  /**
   * 用户注册
   */
  async register(userData: { username: string; email: string; password: string }) {
    try {
      const response = await this.axiosInstance.post('/api/v1/auth/register', userData);
      if (response.data.success && response.data.data.token) {
        this.setToken(response.data.data.token);
      }
      return response.data;
    } catch (error) {
      console.error('用户注册失败:', error);
      throw error;
    }
  }
  
  /**
   * 用户登录
   */
  async login(credentials: { username: string; password: string }) {
    try {
      const response = await this.axiosInstance.post('/api/v1/auth/login', credentials);
      if (response.data.success && response.data.data.token) {
        this.setToken(response.data.data.token);
      }
      return response.data;
    } catch (error) {
      console.error('用户登录失败:', error);
      throw error;
    }
  }
  
  /**
   * 用户登出
   */
  async logout() {
    try {
      await this.axiosInstance.post('/api/v1/auth/logout');
      this.clearToken();
      return { success: true };
    } catch (error) {
      console.error('用户登出失败:', error);
      this.clearToken(); // 即使失败也清除本地token
      throw error;
    }
  }
  
  /**
   * 获取当前用户信息
   */
  async getCurrentUser() {
    try {
      const response = await this.axiosInstance.get('/api/v1/auth/me');
      return response.data;
    } catch (error) {
      console.error('获取用户信息失败:', error);
      throw error;
    }
  }
  
  /**
   * 更新用户信息
   */
  async updateProfile(profileData: { email?: string; avatarUrl?: string }) {
    try {
      const response = await this.axiosInstance.put('/api/v1/auth/profile', profileData);
      return response.data;
    } catch (error) {
      console.error('更新用户信息失败:', error);
      throw error;
    }
  }
  
  /**
   * 修改密码
   */
  async changePassword(passwordData: { currentPassword: string; newPassword: string }) {
    try {
      const response = await this.axiosInstance.put('/api/v1/auth/password', passwordData);
      return response.data;
    } catch (error) {
      console.error('修改密码失败:', error);
      throw error;
    }
  }
  
  // ==================== Agent模板相关 ====================
  
  /**
   * 获取Agent模板列表
   * @returns Promise<Array> 模板列表
   */
  async getTemplates(params?: {
    page?: number;
    pageSize?: number;
    type?: string;
    category?: string;
    featured?: boolean;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
  }) {
    try {
      const response = await this.axiosInstance.get('/api/v1/agent-templates', { params });
      return response.data;
    } catch (error) {
      console.error('获取模板列表失败:', error);
      throw error;
    }
  }

  /**
   * 获取Agent模板详情
   * @param id 模板ID
   * @returns Promise<Object> 模板详情
   */
  async getTemplateById(id: string) {
    try {
      const response = await this.axiosInstance.get(`/api/v1/agent-templates/${id}`);
      return response.data;
    } catch (error) {
      console.error(`获取模板详情失败 (ID: ${id}):`, error);
      throw error;
    }
  }

  /**
   * 创建Agent模板
   * @param templateData 模板数据
   * @returns Promise<Object> 创建的模板
   */
  async createTemplate(templateData: any) {
    try {
      const response = await this.axiosInstance.post('/api/v1/agent-templates', templateData);
      return response.data;
    } catch (error) {
      console.error('创建模板失败:', error);
      throw error;
    }
  }

  /**
   * 更新Agent模板
   * @param id 模板ID
   * @param templateData 模板数据
   * @returns Promise<Object> 更新后的模板
   */
  async updateTemplate(id: string, templateData: any) {
    try {
      const response = await this.axiosInstance.put(`/api/v1/agent-templates/${id}`, templateData);
      return response.data;
    } catch (error) {
      console.error(`更新模板失败 (ID: ${id}):`, error);
      throw error;
    }
  }

  /**
   * 删除Agent模板
   * @param id 模板ID
   * @returns Promise<Object> 删除结果
   */
  async deleteTemplate(id: string) {
    try {
      const response = await this.axiosInstance.delete(`/api/v1/agent-templates/${id}`);
      return response.data;
    } catch (error) {
      console.error(`删除模板失败 (ID: ${id}):`, error);
      throw error;
    }
  }
  
  /**
   * 复制Agent模板
   */
  async cloneTemplate(id: string, data: { name: string; description?: string }) {
    try {
      const response = await this.axiosInstance.post(`/api/v1/agent-templates/${id}/clone`, data);
      return response.data;
    } catch (error) {
      console.error(`复制模板失败 (ID: ${id}):`, error);
      throw error;
    }
  }
  
  /**
   * 验证模板配置
   */
  async validateTemplateConfig(config: any) {
    try {
      const response = await this.axiosInstance.post('/api/v1/agent-templates/validate', { config });
      return response.data;
    } catch (error) {
      console.error('验证模板配置失败:', error);
      throw error;
    }
  }
  
  /**
   * 导出模板
   */
  async exportTemplate(id: string) {
    try {
      const response = await this.axiosInstance.get(`/api/v1/agent-templates/${id}/export`);
      return response.data;
    } catch (error) {
      console.error(`导出模板失败 (ID: ${id}):`, error);
      throw error;
    }
  }
  
  /**
   * 导入模板
   */
  async importTemplate(templateData: any, name?: string) {
    try {
      const response = await this.axiosInstance.post('/api/v1/agent-templates/import', {
        templateData,
        name
      });
      return response.data;
    } catch (error) {
      console.error('导入模板失败:', error);
      throw error;
    }
  }

  /**
   * 获取Agent配置列表
   * @param params 查询参数
   * @returns Promise<Object> Agent配置列表
   */
  async getAgentConfigs(params?: any) {
    try {
      const response = await this.axiosInstance.get('/api/v1/agent-configs', { params });
      return response.data;
    } catch (error) {
      console.error('获取Agent配置列表失败:', error);
      throw error;
    }
  }

  /**
   * 获取Agent配置详情
   * @param id Agent配置ID
   * @returns Promise<Object> Agent配置详情
   */
  async getAgentConfigById(id: string) {
    try {
      const response = await this.axiosInstance.get(`/api/v1/agent-configs/${id}`);
      return response.data;
    } catch (error) {
      console.error(`获取Agent配置详情失败 (ID: ${id}):`, error);
      throw error;
    }
  }

  /**
   * 创建Agent配置
   * @param configData Agent配置数据
   * @returns Promise<Object> 创建的Agent配置
   */
  async createAgentConfig(configData: any) {
    try {
      const response = await this.axiosInstance.post('/api/v1/agent-configs', configData);
      return response.data;
    } catch (error) {
      console.error('创建Agent配置失败:', error);
      throw error;
    }
  }

  /**
   * 更新Agent配置
   * @param id Agent配置ID
   * @param configData Agent配置数据
   * @returns Promise<Object> 更新后的Agent配置
   */
  async updateAgentConfig(id: string, configData: any) {
    try {
      const response = await this.axiosInstance.put(`/api/v1/agent-configs/${id}`, configData);
      return response.data;
    } catch (error) {
      console.error(`更新Agent配置失败 (ID: ${id}):`, error);
      throw error;
    }
  }

  /**
   * 删除Agent配置
   * @param id Agent配置ID
   * @returns Promise<Object> 删除结果
   */
  async deleteAgentConfig(id: string) {
    try {
      const response = await this.axiosInstance.delete(`/api/v1/agent-configs/${id}`);
      return response.data;
    } catch (error) {
      console.error(`删除Agent配置失败 (ID: ${id}):`, error);
      throw error;
    }
  }
  
  /**
   * 获取Agent实例列表
   * @returns Promise<Array> Agent实例列表
   */
  async getAgents(params?: any) {
    try {
      const response = await this.axiosInstance.get('/api/v1/agents', { params });
      return response.data;
    } catch (error) {
      console.error('获取Agent实例列表失败:', error);
      throw error;
    }
  }

  /**
   * 获取Agent实例详情
   * @param id Agent实例ID
   * @returns Promise<Object> Agent实例详情
   */
  async getAgentById(id: string) {
    try {
      const response = await this.axiosInstance.get(`/api/v1/agents/${id}`);
      return response.data;
    } catch (error) {
      console.error(`获取Agent实例详情失败 (ID: ${id}):`, error);
      throw error;
    }
  }

  /**
   * 创建Agent实例
   * @param agentData Agent实例数据
   * @returns Promise<Object> 创建的Agent实例
   */
  async createAgent(agentData: any) {
    try {
      const response = await this.axiosInstance.post('/api/v1/agents', agentData);
      return response.data;
    } catch (error) {
      console.error('创建Agent实例失败:', error);
      throw error;
    }
  }

  /**
   * 更新Agent实例
   * @param id Agent实例ID
   * @param agentData Agent实例数据
   * @returns Promise<Object> 更新后的Agent实例
   */
  async updateAgent(id: string, agentData: any) {
    try {
      const response = await this.axiosInstance.put(`/api/v1/agents/${id}`, agentData);
      return response.data;
    } catch (error) {
      console.error(`更新Agent实例失败 (ID: ${id}):`, error);
      throw error;
    }
  }

  /**
   * 删除Agent实例
   * @param id Agent实例ID
   * @returns Promise<Object> 删除结果
   */
  async deleteAgent(id: string) {
    try {
      const response = await this.axiosInstance.delete(`/api/v1/agents/${id}`);
      return response.data;
    } catch (error) {
      console.error(`删除Agent实例失败 (ID: ${id}):`, error);
      throw error;
    }
  }

  /**
   * 获取能力列表
   * @param params 查询参数
   * @returns Promise<Object> 能力列表
   */
  async getCapabilities(params?: any) {
    try {
      const response = await this.axiosInstance.get('/api/v1/capabilities', { params });
      return response.data;
    } catch (error) {
      console.error('获取能力列表失败:', error);
      throw error;
    }
  }

  /**
   * 获取能力详情
   * @param id 能力ID
   * @returns Promise<Object> 能力详情
   */
  async getCapabilityById(id: string) {
    try {
      const response = await this.axiosInstance.get(`/api/v1/capabilities/${id}`);
      return response.data;
    } catch (error) {
      console.error(`获取能力详情失败 (ID: ${id}):`, error);
      throw error;
    }
  }

  /**
   * 创建能力
   * @param capabilityData 能力数据
   * @returns Promise<Object> 创建的能力
   */
  async createCapability(capabilityData: any) {
    try {
      const response = await this.axiosInstance.post('/api/v1/capabilities', capabilityData);
      return response.data;
    } catch (error) {
      console.error('创建能力失败:', error);
      throw error;
    }
  }

  /**
   * 更新能力
   * @param id 能力ID
   * @param capabilityData 能力数据
   * @returns Promise<Object> 更新后的能力
   */
  async updateCapability(id: string, capabilityData: any) {
    try {
      const response = await this.axiosInstance.put(`/api/v1/capabilities/${id}`, capabilityData);
      return response.data;
    } catch (error) {
      console.error(`更新能力失败 (ID: ${id}):`, error);
      throw error;
    }
  }

  /**
   * 删除能力
   * @param id 能力ID
   * @returns Promise<Object> 删除结果
   */
  async deleteCapability(id: string) {
    try {
      const response = await this.axiosInstance.delete(`/api/v1/capabilities/${id}`);
      return response.data;
    } catch (error) {
      console.error(`删除能力失败 (ID: ${id}):`, error);
      throw error;
    }
  }

  /**
   * 启动Agent实例
   * @param id Agent实例ID
   * @returns Promise<Object> 启动结果
   */
  async startAgent(id: string) {
    try {
      const response = await this.axiosInstance.post(`/api/v1/agents/${id}/start`);
      return response.data;
    } catch (error) {
      console.error(`启动Agent实例失败 (ID: ${id}):`, error);
      throw error;
    }
  }

  /**
   * 停止Agent实例
   * @param id Agent实例ID
   * @returns Promise<Object> 停止结果
   */
  async stopAgent(id: string) {
    try {
      const response = await this.axiosInstance.post(`/api/v1/agents/${id}/stop`);
      return response.data;
    } catch (error) {
      console.error(`停止Agent实例失败 (ID: ${id}):`, error);
      throw error;
    }
  }

  /**
   * 重启Agent实例
   * @param id Agent实例ID
   * @returns Promise<Object> 重启结果
   */
  async restartAgent(id: string) {
    try {
      const response = await this.axiosInstance.post(`/api/v1/agents/${id}/restart`);
      return response.data;
    } catch (error) {
      console.error(`重启Agent实例失败 (ID: ${id}):`, error);
      throw error;
    }
  }

  /**
   * 暂停Agent实例
   * @param id Agent实例ID
   * @returns Promise<Object> 暂停结果
   */
  async pauseAgent(id: string) {
    try {
      const response = await this.axiosInstance.post(`/api/v1/agents/${id}/pause`);
      return response.data;
    } catch (error) {
      console.error(`暂停Agent实例失败 (ID: ${id}):`, error);
      throw error;
    }
  }

  /**
   * 恢复Agent实例
   * @param id Agent实例ID
   * @returns Promise<Object> 恢复结果
   */
  async resumeAgent(id: string) {
    try {
      const response = await this.axiosInstance.post(`/api/v1/agents/${id}/resume`);
      return response.data;
    } catch (error) {
      console.error(`恢复Agent实例失败 (ID: ${id}):`, error);
      throw error;
    }
  }

  /**
   * 克隆Agent实例
   * @param id Agent实例ID
   * @param cloneData 克隆数据
   * @returns Promise<Object> 克隆结果
   */
  async cloneAgent(id: string, cloneData?: any) {
    try {
      const response = await this.axiosInstance.post(`/api/v1/agents/${id}/clone`, cloneData || {});
      return response.data;
    } catch (error) {
      console.error(`克隆Agent实例失败 (ID: ${id}):`, error);
      throw error;
    }
  }

  /**
   * 获取Agent性能指标
   * @param id Agent实例ID
   * @param params 查询参数
   * @returns Promise<Object> 性能指标
   */
  async getAgentMetrics(id: string, params?: any) {
    try {
      const response = await this.axiosInstance.get(`/api/v1/agents/${id}/metrics`, { params });
      return response.data;
    } catch (error) {
      console.error(`获取Agent性能指标失败 (ID: ${id}):`, error);
      throw error;
    }
  }

  /**
   * 获取Agent系统日志
   * @param id Agent实例ID
   * @param params 查询参数
   * @returns Promise<Object> 系统日志
   */
  async getAgentSystemLogs(id: string, params?: any) {
    try {
      const response = await this.axiosInstance.get(`/api/v1/agents/${id}/logs`, { params });
      return response.data;
    } catch (error) {
      console.error(`获取Agent系统日志失败 (ID: ${id}):`, error);
      throw error;
    }
  }

  /**
   * 获取Agent消息记录
   * @param id Agent实例ID
   * @param params 查询参数
   * @returns Promise<Object> 消息记录
   */
  async getAgentMessages(id: string, params?: any) {
    try {
      const response = await this.axiosInstance.get(`/api/v1/agents/${id}/messages`, { params });
      return response.data;
    } catch (error) {
      console.error(`获取Agent消息记录失败 (ID: ${id}):`, error);
      throw error;
    }
  }

  /**
   * 批量启动Agent实例
   * @param ids Agent实例ID数组
   * @returns Promise<Object> 批量启动结果
   */
  async batchStartAgents(ids: string[]) {
    try {
      const response = await this.axiosInstance.post('/api/v1/agents/batch/start', { agentIds: ids });
      return response.data;
    } catch (error) {
      console.error('批量启动Agent实例失败:', error);
      throw error;
    }
  }

  /**
   * 批量停止Agent实例
   * @param ids Agent实例ID数组
   * @returns Promise<Object> 批量停止结果
   */
  async batchStopAgents(ids: string[]) {
    try {
      const response = await this.axiosInstance.post('/api/v1/agents/batch/stop', { agentIds: ids });
      return response.data;
    } catch (error) {
      console.error('批量停止Agent实例失败:', error);
      throw error;
    }
  }

  /**
   * 批量删除Agent实例
   * @param ids Agent实例ID数组
   * @returns Promise<Object> 批量删除结果
   */
  async batchDeleteAgents(ids: string[]) {
    try {
      const response = await this.axiosInstance.delete('/api/v1/agents/batch', {
        data: { agentIds: ids }
      });
      return response.data;
    } catch (error) {
      console.error('批量删除Agent实例失败:', error);
      throw error;
    }
  }

  /**
   * 保存Agent配置（创建或更新）
   * @param agentData Agent数据
   * @returns Promise<any> 响应数据
   */
  async saveAgent(agentData: any) {
    try {
      // 数据验证
      if (!agentData.name || agentData.name.trim() === '') {
        throw new Error('Agent名称不能为空');
      }
      
      if (!agentData.type) {
        throw new Error('Agent类型不能为空');
      }

      // 清理数据
      const cleanData = {
        ...agentData,
        name: agentData.name.trim(),
        description: agentData.description?.trim() || '',
        updatedAt: new Date().toISOString()
      };

      let response;
      if (agentData.id && agentData.id.startsWith('agent_')) {
        // 更新现有Agent
        response = await this.updateAgent(agentData.id, cleanData);
      } else {
        // 创建新Agent
        cleanData.createdAt = new Date().toISOString();
        response = await this.createAgent(cleanData);
      }
      
      return response;
    } catch (error) {
      console.error('保存Agent失败:', error);
      throw error;
    }
  }

  /**
   * 获取工作流列表
   * @param params 查询参数
   * @returns Promise<Object> 工作流列表
   */
  async getWorkflows(params?: any) {
    try {
      const response = await this.axiosInstance.get('/api/v1/workflows', { params });
      return response.data;
    } catch (error) {
      console.error('获取工作流列表失败:', error);
      throw error;
    }
  }

  /**
   * 获取工作流详情
   * @param id 工作流ID
   * @returns Promise<Object> 工作流详情
   */
  async getWorkflowById(id: string) {
    try {
      const response = await this.axiosInstance.get(`/api/v1/workflows/${id}`);
      return response.data;
    } catch (error) {
      console.error(`获取工作流详情失败 (ID: ${id}):`, error);
      throw error;
    }
  }

  /**
   * 创建工作流
   * @param workflowData 工作流数据
   * @returns Promise<Object> 创建的工作流
   */
  async createWorkflow(workflowData: any) {
    try {
      const response = await this.axiosInstance.post('/api/v1/workflows', workflowData);
      return response.data;
    } catch (error) {
      console.error('创建工作流失败:', error);
      throw error;
    }
  }

  /**
   * 更新工作流
   * @param id 工作流ID
   * @param workflowData 工作流数据
   * @returns Promise<Object> 更新后的工作流
   */
  async updateWorkflow(id: string, workflowData: any) {
    try {
      const response = await this.axiosInstance.put(`/api/v1/workflows/${id}`, workflowData);
      return response.data;
    } catch (error) {
      console.error(`更新工作流失败 (ID: ${id}):`, error);
      throw error;
    }
  }

  /**
   * 删除工作流
   * @param id 工作流ID
   * @returns Promise<Object> 删除结果
   */
  async deleteWorkflow(id: string) {
    try {
      const response = await this.axiosInstance.delete(`/api/v1/workflows/${id}`);
      return response.data;
    } catch (error) {
      console.error(`删除工作流失败 (ID: ${id}):`, error);
      throw error;
    }
  }

  /**
   * 执行工作流
   * @param id 工作流ID
   * @param params 执行参数
   * @returns Promise<Object> 执行结果
   */
  async executeWorkflow(id: string, params?: any) {
    try {
      const response = await this.axiosInstance.post(`/api/v1/workflows/${id}/execute`, params || {});
      return response.data;
    } catch (error) {
      console.error(`执行工作流失败 (ID: ${id}):`, error);
      throw error;
    }
  }

  /**
   * 获取工作流执行记录
   * @param id 工作流ID
   * @param params 查询参数
   * @returns Promise<Object> 执行记录
   */
  async getWorkflowExecutions(id: string, params?: any) {
    try {
      const response = await this.axiosInstance.get(`/api/v1/workflows/${id}/executions`, { params });
      return response.data;
    } catch (error) {
      console.error(`获取工作流执行记录失败 (ID: ${id}):`, error);
      throw error;
    }
  }

  /**
   * 获取组件列表
   * @param params 查询参数
   * @returns Promise<Object> 组件列表
   */
  async getComponents(params?: any) {
    try {
      const response = await this.axiosInstance.get('/api/v1/components', { params });
      return response.data;
    } catch (error) {
      console.error('获取组件列表失败:', error);
      throw error;
    }
  }

  /**
   * 获取组件详情
   * @param id 组件ID
   * @returns Promise<Object> 组件详情
   */
  async getComponentById(id: string) {
    try {
      const response = await this.axiosInstance.get(`/api/v1/components/${id}`);
      return response.data;
    } catch (error) {
      console.error(`获取组件详情失败 (ID: ${id}):`, error);
      throw error;
    }
  }

  /**
   * 创建组件
   * @param componentData 组件数据
   * @returns Promise<Object> 创建的组件
   */
  async createComponent(componentData: any) {
    try {
      const response = await this.axiosInstance.post('/api/v1/components', componentData);
      return response.data;
    } catch (error) {
      console.error('创建组件失败:', error);
      throw error;
    }
  }

  /**
   * 更新组件
   * @param id 组件ID
   * @param componentData 组件数据
   * @returns Promise<Object> 更新后的组件
   */
  async updateComponent(id: string, componentData: any) {
    try {
      const response = await this.axiosInstance.put(`/api/v1/components/${id}`, componentData);
      return response.data;
    } catch (error) {
      console.error(`更新组件失败 (ID: ${id}):`, error);
      throw error;
    }
  }

  /**
   * 删除组件
   * @param id 组件ID
   * @returns Promise<Object> 删除结果
   */
  async deleteComponent(id: string) {
    try {
      const response = await this.axiosInstance.delete(`/api/v1/components/${id}`);
      return response.data;
    } catch (error) {
      console.error(`删除组件失败 (ID: ${id}):`, error);
      throw error;
    }
  }
  
  /**
   * 获取版本历史
   * @param resourceType 资源类型
   * @param resourceId 资源ID
   * @param params 查询参数
   * @returns Promise<Object> 版本历史
   */
  async getVersionHistory(resourceType: string, resourceId: string, params?: any) {
    try {
      const response = await this.axiosInstance.get(`/api/v1/versions/${resourceType}/${resourceId}`, { params });
      return response.data;
    } catch (error) {
      console.error('获取版本历史失败:', error);
      throw error;
    }
  }
  
  /**
   * 创建版本
   * @param resourceType 资源类型
   * @param resourceId 资源ID
   * @param versionData 版本数据
   * @returns Promise<Object> 创建的版本
   */
  async createVersion(resourceType: string, resourceId: string, versionData: any) {
    try {
      const response = await this.axiosInstance.post(`/api/v1/versions/${resourceType}/${resourceId}`, versionData);
      return response.data;
    } catch (error) {
      console.error('创建版本失败:', error);
      throw error;
    }
  }
  
  /**
   * 回滚版本
   * @param resourceType 资源类型
   * @param resourceId 资源ID
   * @param versionId 版本ID
   * @returns Promise<Object> 回滚结果
   */
  async rollbackVersion(resourceType: string, resourceId: string, versionId: string) {
    try {
      const response = await this.axiosInstance.post(`/api/v1/versions/${resourceType}/${resourceId}/${versionId}/rollback`);
      return response.data;
    } catch (error) {
      console.error('回滚版本失败:', error);
      throw error;
    }
  }
  
  /**
   * 获取系统设置
   * @returns Promise<Object> 系统设置
   */
  async getSystemSettings() {
    try {
      const response = await this.axiosInstance.get('/api/v1/system/settings');
      return response.data;
    } catch (error) {
      console.error('获取系统设置失败:', error);
      throw error;
    }
  }
  
  /**
   * 更新系统设置
   * @param settings 设置数据
   * @returns Promise<Object> 更新结果
   */
  async updateSystemSettings(settings: any) {
    try {
      const response = await this.axiosInstance.put('/api/v1/system/settings', settings);
      return response.data;
    } catch (error) {
      console.error('更新系统设置失败:', error);
      throw error;
    }
  }
  
  /**
   * 获取仪表板统计
   * @param params 查询参数
   * @returns Promise<Object> 统计数据
   */
  async getDashboardStats(params?: any) {
    try {
      const response = await this.axiosInstance.get('/api/v1/statistics/dashboard', { params });
      return response.data;
    } catch (error) {
      console.error('获取仪表板统计失败:', error);
      throw error;
    }
  }
  
  /**
   * 获取使用趋势
   * @param params 查询参数
   * @returns Promise<Object> 趋势数据
   */
  async getUsageTrends(params?: any) {
    try {
      const response = await this.axiosInstance.get('/api/v1/statistics/trends', { params });
      return response.data;
    } catch (error) {
      console.error('获取使用趋势失败:', error);
      throw error;
    }
  }
  
  /**
   * 上传头像
   * @param file 文件
   * @returns Promise<Object> 上传结果
   */
  async uploadAvatar(file: File) {
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const response = await this.axiosInstance.post('/api/v1/upload/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      console.error('上传头像失败:', error);
      throw error;
    }
  }
  
  /**
   * 上传图标
   * @param file 文件
   * @returns Promise<Object> 上传结果
   */
  async uploadIcon(file: File) {
    try {
      const formData = new FormData();
      formData.append('icon', file);
      const response = await this.axiosInstance.post('/api/v1/upload/icon', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      console.error('上传图标失败:', error);
      throw error;
    }
  }
  
  /**
   * 健康检查
   * @returns Promise<Object> 健康状态
   */
  async healthCheck() {
    try {
      const response = await this.axiosInstance.get('/health');
      return response.data;
    } catch (error) {
      console.error('健康检查失败:', error);
      throw error;
    }
  }

  /**
   * 生成统计报告
   * @param reportData 报告数据
   * @returns Promise<Object> 生成的报告
   */
  async generateReport(reportData: any) {
    try {
      const response = await this.axiosInstance.post('/api/v1/statistics/reports', reportData);
      return response.data;
    } catch (error) {
      console.error('生成报告失败:', error);
      throw error;
    }
  }

  /**
   * 获取报告列表
   * @param params 查询参数
   * @returns Promise<Array> 报告列表
   */
  async getReports(params: any = {}) {
    try {
      const response = await this.axiosInstance.get('/api/v1/statistics/reports', { params });
      return response.data;
    } catch (error) {
      console.error('获取报告列表失败:', error);
      throw error;
    }
  }

  /**
   * 获取报告详情
   * @param id 报告ID
   * @returns Promise<Object> 报告详情
   */
  async getReportById(id: string) {
    try {
      const response = await this.axiosInstance.get(`/api/v1/statistics/reports/${id}`);
      return response.data;
    } catch (error) {
      console.error(`获取报告详情失败 (ID: ${id}):`, error);
      throw error;
    }
  }

  /**
   * 预览报告HTML页面
   * @param id 报告ID
   * @returns Promise<string> HTML内容
   */
  async previewReport(id: string) {
    try {
      const response = await this.axiosInstance.get(`/api/v1/statistics/reports/${id}/preview`, {
        responseType: 'text'
      });
      return response.data;
    } catch (error) {
      console.error(`预览报告失败 (ID: ${id}):`, error);
      throw error;
    }
  }

  /**
   * 下载报告
   * @param id 报告ID
   * @param format 格式 (json, csv, pdf)
   * @returns Promise<Blob> 文件内容
   */
  async downloadReport(id: string, format: string = 'json') {
    try {
      const response = await this.axiosInstance.get(`/api/v1/statistics/reports/${id}/download`, {
        params: { format },
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error(`下载报告失败 (ID: ${id}):`, error);
      throw error;
    }
  }

  /**
   * 获取报告预览URL
   * @param id 报告ID
   * @returns string 预览URL
   */
  getReportPreviewUrl(id: string): string {
    return `${this.baseUrl}/api/v1/statistics/reports/${id}/preview`;
  }

  /**
   * 通用请求方法
   * @param method HTTP方法
   * @param url 请求URL
   * @param data 请求数据
   * @param config 请求配置
   * @returns Promise<any> 响应数据
   */
  async request(method: string, url: string, data?: any, config?: any) {
    try {
      const requestConfig: any = {
        method,
        url,
        ...config
      };

      if (data) {
        if (method.toLowerCase() === 'get') {
          requestConfig.params = data;
        } else {
          requestConfig.data = data;
        }
      }

      const response = await this.axiosInstance(requestConfig);
      return response.data;
    } catch (error) {
      console.error(`请求失败 (${method} ${url}):`, error);
      throw error;
    }
  }
}

// 创建API服务实例
const apiServiceInstance = new ApiService();

// 导出API服务实例
export default apiServiceInstance;
