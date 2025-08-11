import { apiService } from '../ApiService';
import fetchMock from 'jest-fetch-mock';

// 启用fetch模拟
fetchMock.enableMocks();

describe('ApiService', () => {
  beforeEach(() => {
    fetchMock.resetMocks();
    apiService.setMockMode(false); // 关闭模拟模式以测试实际API调用
    apiService.setBaseUrl('http://test-api');
  });

  afterEach(() => {
    apiService.setMockMode(true); // 测试后恢复模拟模式
  });

  describe('模板相关API', () => {
    it('应该获取模板列表', async () => {
      const mockTemplates = [
        { id: '1', name: '模板1' },
        { id: '2', name: '模板2' }
      ];

      fetchMock.mockResponseOnce(JSON.stringify(mockTemplates));

      const response = await apiService.getTemplates();

      expect(fetchMock).toHaveBeenCalledWith(
        'http://test-api/templates',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          })
        })
      );

      expect(response).toEqual({
        success: true,
        data: mockTemplates
      });
    });

    it('应该获取模板详情', async () => {
      const mockTemplate = { id: '1', name: '模板1' };

      fetchMock.mockResponseOnce(JSON.stringify(mockTemplate));

      const response = await apiService.getTemplateById('1');

      expect(fetchMock).toHaveBeenCalledWith(
        'http://test-api/templates/1',
        expect.objectContaining({
          method: 'GET'
        })
      );

      expect(response).toEqual({
        success: true,
        data: mockTemplate
      });
    });
  });

  describe('Agent实例相关API', () => {
    it('应该获取Agent实例列表', async () => {
      const mockAgents = [
        { id: '1', name: 'Agent1' },
        { id: '2', name: 'Agent2' }
      ];

      fetchMock.mockResponseOnce(JSON.stringify(mockAgents));

      const response = await apiService.getAgentInstances();

      expect(fetchMock).toHaveBeenCalledWith(
        'http://test-api/agent-instances',
        expect.objectContaining({
          method: 'GET'
        })
      );

      expect(response).toEqual({
        success: true,
        data: mockAgents
      });
    });

    it('应该创建Agent实例', async () => {
      const mockAgentData = { name: '新Agent', templateId: '1' };
      const mockCreatedAgent = { id: '3', name: '新Agent', templateId: '1' };

      fetchMock.mockResponseOnce(JSON.stringify(mockCreatedAgent));

      const response = await apiService.createAgentInstance(mockAgentData);

      expect(fetchMock).toHaveBeenCalledWith(
        'http://test-api/agent-instances',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(mockAgentData)
        })
      );

      expect(response).toEqual({
        success: true,
        data: mockCreatedAgent
      });
    });

    it('应该更新Agent实例', async () => {
      const mockAgentId = '1';
      const mockAgentData = { name: '更新的Agent' };
      const mockUpdatedAgent = { id: '1', name: '更新的Agent' };

      fetchMock.mockResponseOnce(JSON.stringify(mockUpdatedAgent));

      const response = await apiService.updateAgentInstance(mockAgentId, mockAgentData);

      expect(fetchMock).toHaveBeenCalledWith(
        'http://test-api/agent-instances/1',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(mockAgentData)
        })
      );

      expect(response).toEqual({
        success: true,
        data: mockUpdatedAgent
      });
    });

    it('应该删除Agent实例', async () => {
      const mockAgentId = '1';
      const mockResponse = { message: 'Agent deleted successfully' };

      fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

      const response = await apiService.deleteAgentInstance(mockAgentId);

      expect(fetchMock).toHaveBeenCalledWith(
        'http://test-api/agent-instances/1',
        expect.objectContaining({
          method: 'DELETE'
        })
      );

      expect(response).toEqual({
        success: true,
        data: mockResponse
      });
    });

    it('应该启动Agent实例', async () => {
      const mockAgentId = '1';
      const mockResponse = { message: 'Agent started successfully' };

      fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

      const response = await apiService.startAgentInstance(mockAgentId);

      expect(fetchMock).toHaveBeenCalledWith(
        'http://test-api/agent-instances/1/start',
        expect.objectContaining({
          method: 'POST'
        })
      );

      expect(response).toEqual({
        success: true,
        data: mockResponse
      });
    });

    it('应该停止Agent实例', async () => {
      const mockAgentId = '1';
      const mockResponse = { message: 'Agent stopped successfully' };

      fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

      const response = await apiService.stopAgentInstance(mockAgentId);

      expect(fetchMock).toHaveBeenCalledWith(
        'http://test-api/agent-instances/1/stop',
        expect.objectContaining({
          method: 'POST'
        })
      );

      expect(response).toEqual({
        success: true,
        data: mockResponse
      });
    });
  });

  describe('工作流相关API', () => {
    it('应该获取工作流列表', async () => {
      const mockWorkflows = [
        { id: '1', name: '工作流1' },
        { id: '2', name: '工作流2' }
      ];

      fetchMock.mockResponseOnce(JSON.stringify(mockWorkflows));

      const response = await apiService.getWorkflows();

      expect(fetchMock).toHaveBeenCalledWith(
        'http://test-api/workflows',
        expect.objectContaining({
          method: 'GET'
        })
      );

      expect(response).toEqual({
        success: true,
        data: mockWorkflows
      });
    });

    it('应该创建工作流', async () => {
      const mockWorkflowData = { name: '新工作流', nodes: [], edges: [] };
      const mockCreatedWorkflow = { id: '3', name: '新工作流', nodes: [], edges: [] };

      fetchMock.mockResponseOnce(JSON.stringify(mockCreatedWorkflow));

      const response = await apiService.createWorkflow(mockWorkflowData);

      expect(fetchMock).toHaveBeenCalledWith(
        'http://test-api/workflows',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(mockWorkflowData)
        })
      );

      expect(response).toEqual({
        success: true,
        data: mockCreatedWorkflow
      });
    });
  });

  describe('错误处理', () => {
    it('应该处理API错误响应', async () => {
      const errorMessage = '请求失败';
      
      fetchMock.mockResponseOnce(JSON.stringify({ error: errorMessage }), { status: 500 });

      const response = await apiService.getTemplates();

      expect(response).toEqual({
        success: false,
        error: errorMessage
      });
    });

    it('应该处理网络错误', async () => {
      const errorMessage = 'Network Error';
      
      fetchMock.mockRejectOnce(new Error(errorMessage));

      const response = await apiService.getTemplates();

      expect(response).toEqual({
        success: false,
        error: errorMessage
      });
    });
  });

  describe('模拟模式', () => {
    beforeEach(() => {
      apiService.setMockMode(true);
    });

    it('应该在模拟模式下返回模拟数据', async () => {
      const response = await apiService.getTemplates();

      expect(fetchMock).not.toHaveBeenCalled();
      expect(response.success).toBe(true);
      expect(Array.isArray(response.data)).toBe(true);
    });
  });
});