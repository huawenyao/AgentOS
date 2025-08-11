import axios from 'axios';
import config from './config.json';

/**
 * API服务类，用于处理与后端的通信
 */
class ApiService {
  private baseUrl: string;
  private timeout: number;
  private headers: Record<string, string>;

  /**
   * 构造函数
   */
  constructor() {
    this.baseUrl = config.api.baseUrl;
    this.timeout = config.api.timeout;
    this.headers = config.api.headers;
  }

  /**
   * 获取Agent模板列表
   * @returns Promise<Array> 模板列表
   */
  async getTemplates() {
    try {
      const response = await axios.get(`${this.baseUrl}${config.api.endpoints.templates}`, {
        headers: this.headers,
        timeout: this.timeout
      });
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
      const response = await axios.get(`${this.baseUrl}${config.api.endpoints.templates}/${id}`, {
        headers: this.headers,
        timeout: this.timeout
      });
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
      const response = await axios.post(`${this.baseUrl}${config.api.endpoints.templates}`, templateData, {
        headers: this.headers,
        timeout: this.timeout
      });
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
      const response = await axios.put(`${this.baseUrl}${config.api.endpoints.templates}/${id}`, templateData, {
        headers: this.headers,
        timeout: this.timeout
      });
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
      const response = await axios.delete(`${this.baseUrl}${config.api.endpoints.templates}/${id}`, {
        headers: this.headers,
        timeout: this.timeout
      });
      return response.data;
    } catch (error) {
      console.error(`删除模板失败 (ID: ${id}):`, error);
      throw error;
    }
  }

  /**
   * 获取Agent实例列表
   * @returns Promise<Array> 实例列表
   */
  async getAgents() {
    try {
      const response = await axios.get(`${this.baseUrl}${config.api.endpoints.agents}`, {
        headers: this.headers,
        timeout: this.timeout
      });
      return response.data;
    } catch (error) {
      console.error('获取Agent实例列表失败:', error);
      throw error;
    }
  }

  /**
   * 获取Agent实例详情
   * @param id 实例ID
   * @returns Promise<Object> 实例详情
   */
  async getAgentById(id: string) {
    try {
      const response = await axios.get(`${this.baseUrl}${config.api.endpoints.agents}/${id}`, {
        headers: this.headers,
        timeout: this.timeout
      });
      return response.data;
    } catch (error) {
      console.error(`获取Agent实例详情失败 (ID: ${id}):`, error);
      throw error;
    }
  }

  /**
   * 创建Agent实例
   * @param agentData 实例数据
   * @returns Promise<Object> 创建的实例
   */
  async createAgent(agentData: any) {
    try {
      const response = await axios.post(`${this.baseUrl}${config.api.endpoints.agents}`, agentData, {
        headers: this.headers,
        timeout: this.timeout
      });
      return response.data;
    } catch (error) {
      console.error('创建Agent实例失败:', error);
      throw error;
    }
  }

  /**
   * 更新Agent实例
   * @param id 实例ID
   * @param agentData 实例数据
   * @returns Promise<Object> 更新后的实例
   */
  async updateAgent(id: string, agentData: any) {
    try {
      const response = await axios.put(`${this.baseUrl}${config.api.endpoints.agents}/${id}`, agentData, {
        headers: this.headers,
        timeout: this.timeout
      });
      return response.data;
    } catch (error) {
      console.error(`更新Agent实例失败 (ID: ${id}):`, error);
      throw error;
    }
  }

  /**
   * 删除Agent实例
   * @param id 实例ID
   * @returns Promise<Object> 删除结果
   */
  async deleteAgent(id: string) {
    try {
      const response = await axios.delete(`${this.baseUrl}${config.api.endpoints.agents}/${id}`, {
        headers: this.headers,
        timeout: this.timeout
      });
      return response.data;
    } catch (error) {
      console.error(`删除Agent实例失败 (ID: ${id}):`, error);
      throw error;
    }
  }

  /**
   * 启动Agent实例
   * @param id 实例ID
   * @returns Promise<Object> 启动结果
   */
  async startAgent(id: string) {
    try {
      const response = await axios.post(`${this.baseUrl}${config.api.endpoints.agents}/${id}/start`, {}, {
        headers: this.headers,
        timeout: this.timeout
      });
      return response.data;
    } catch (error) {
      console.error(`启动Agent实例失败 (ID: ${id}):`, error);
      throw error;
    }
  }

  /**
   * 停止Agent实例
   * @param id 实例ID
   * @returns Promise<Object> 停止结果
   */
  async stopAgent(id: string) {
    try {
      const response = await axios.post(`${this.baseUrl}${config.api.endpoints.agents}/${id}/stop`, {}, {
        headers: this.headers,
        timeout: this.timeout
      });
      return response.data;
    } catch (error) {
      console.error(`停止Agent实例失败 (ID: ${id}):`, error);
      throw error;
    }
  }

  /**
   * 暂停Agent实例
   * @param id Agent实例ID
   * @returns Promise<any> 响应数据
   */
  async pauseAgent(id: string) {
    try {
      const response = await axios.post(`${this.baseUrl}${config.api.endpoints.agents}/${id}/pause`, {}, {
        headers: this.headers,
        timeout: this.timeout
      });
      return response.data;
    } catch (error) {
      console.error(`暂停Agent实例失败 (ID: ${id}):`, error);
      throw error;
    }
  }

  /**
   * 克隆Agent实例
   * @param id Agent实例ID
   * @returns Promise<any> 响应数据
   */
  async cloneAgent(id: string) {
    try {
      const response = await axios.post(`${this.baseUrl}${config.api.endpoints.agents}/${id}/clone`, {}, {
        headers: this.headers,
        timeout: this.timeout
      });
      return response.data;
    } catch (error) {
      console.error(`克隆Agent实例失败 (ID: ${id}):`, error);
      throw error;
    }
  }

  /**
   * 批量启动Agent实例
   * @param ids Agent实例ID数组
   * @returns Promise<any> 响应数据
   */
  async batchStartAgents(ids: string[]) {
    try {
      const response = await axios.post(`${this.baseUrl}${config.api.endpoints.agents}/batch/start`, 
        { agentIds: ids }, 
        {
          headers: this.headers,
          timeout: this.timeout
        }
      );
      return response.data;
    } catch (error) {
      console.error('批量启动Agent实例失败:', error);
      throw error;
    }
  }

  /**
   * 批量停止Agent实例
   * @param ids Agent实例ID数组
   * @returns Promise<any> 响应数据
   */
  async batchStopAgents(ids: string[]) {
    try {
      const response = await axios.post(`${this.baseUrl}${config.api.endpoints.agents}/batch/stop`, 
        { agentIds: ids }, 
        {
          headers: this.headers,
          timeout: this.timeout
        }
      );
      return response.data;
    } catch (error) {
      console.error('批量停止Agent实例失败:', error);
      throw error;
    }
  }

  /**
   * 批量删除Agent实例
   * @param ids Agent实例ID数组
   * @returns Promise<any> 响应数据
   */
  async batchDeleteAgents(ids: string[]) {
    try {
      const response = await axios.delete(`${this.baseUrl}${config.api.endpoints.agents}/batch`, {
        headers: this.headers,
        timeout: this.timeout,
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
   * @returns Promise<Array> 工作流列表
   */
  async getWorkflows() {
    try {
      const response = await axios.get(`${this.baseUrl}${config.api.endpoints.workflows}`, {
        headers: this.headers,
        timeout: this.timeout
      });
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
      const response = await axios.get(`${this.baseUrl}${config.api.endpoints.workflows}/${id}`, {
        headers: this.headers,
        timeout: this.timeout
      });
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
      const response = await axios.post(`${this.baseUrl}${config.api.endpoints.workflows}`, workflowData, {
        headers: this.headers,
        timeout: this.timeout
      });
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
      const response = await axios.put(`${this.baseUrl}${config.api.endpoints.workflows}/${id}`, workflowData, {
        headers: this.headers,
        timeout: this.timeout
      });
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
      const response = await axios.delete(`${this.baseUrl}${config.api.endpoints.workflows}/${id}`, {
        headers: this.headers,
        timeout: this.timeout
      });
      return response.data;
    } catch (error) {
      console.error(`删除工作流失败 (ID: ${id}):`, error);
      throw error;
    }
  }

  /**
   * 获取Agent日志
   * @param id Agent ID
   * @returns Promise<Array> 日志列表
   */
  async getAgentLogs(id: string) {
    try {
      const response = await axios.get(`${this.baseUrl}${config.api.endpoints.agents}/${id}/logs`, {
        headers: this.headers,
        timeout: this.timeout
      });
      return response.data;
    } catch (error) {
      console.error(`获取Agent日志失败 (ID: ${id}):`, error);
      throw error;
    }
  }

  /**
   * 获取能力组件列表
   * @returns Promise<Array> 能力组件列表
   */
  async getCapabilities() {
    try {
      const response = await axios.get(`${this.baseUrl}${config.api.endpoints.capabilities}`, {
        headers: this.headers,
        timeout: this.timeout
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('获取能力组件失败:', error);
      return { success: false, error: '获取能力组件失败' };
    }
  }

  /**
   * 生成统计报告
   * @param reportData 报告数据
   * @returns Promise<Object> 生成的报告
   */
  async generateReport(reportData: any) {
    try {
      const response = await axios.post(`${this.baseUrl}/api/statistics/reports`, reportData, {
        headers: this.headers,
        timeout: this.timeout
      });
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
      const response = await axios.get(`${this.baseUrl}/api/statistics/reports`, {
        headers: this.headers,
        timeout: this.timeout,
        params
      });
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
      const response = await axios.get(`${this.baseUrl}/api/statistics/reports/${id}`, {
        headers: this.headers,
        timeout: this.timeout
      });
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
      const response = await axios.get(`${this.baseUrl}/api/statistics/reports/${id}/preview`, {
        headers: this.headers,
        timeout: this.timeout,
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
      const response = await axios.get(`${this.baseUrl}/api/statistics/reports/${id}/download`, {
        headers: this.headers,
        timeout: this.timeout,
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
    return `${this.baseUrl}/api/statistics/reports/${id}/preview`;
  }

  /**
   * 通用请求方法
   * @param url 请求URL
   * @param method 请求方法
   * @param data 请求数据
   * @returns Promise<any> 响应数据
   */
  async request(url: string, method: string = 'GET', data?: any) {
    try {
      const config: any = {
        method: method.toLowerCase(),
        url: `${this.baseUrl}${url}`,
        headers: this.headers,
        timeout: this.timeout
      };

      if (data && (method.toUpperCase() === 'POST' || method.toUpperCase() === 'PUT' || method.toUpperCase() === 'PATCH')) {
        config.data = data;
      } else if (data && method.toUpperCase() === 'GET') {
        config.params = data;
      }

      const response = await axios(config);
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
