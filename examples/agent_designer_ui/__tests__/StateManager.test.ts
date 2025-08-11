import { renderHook, act } from '@testing-library/react-hooks';
import { useGlobalState } from '../StateManager';
import { apiService } from '../ApiService';

// 模拟ApiService
jest.mock('../ApiService', () => ({
  apiService: {
    getTemplates: jest.fn(),
    getAgentInstances: jest.fn(),
    getWorkflows: jest.fn(),
    getCapabilities: jest.fn(),
    createAgentInstance: jest.fn(),
    updateAgentInstance: jest.fn(),
    deleteAgentInstance: jest.fn(),
    startAgentInstance: jest.fn(),
    stopAgentInstance: jest.fn(),
    createWorkflow: jest.fn(),
    updateWorkflow: jest.fn(),
    deleteWorkflow: jest.fn(),
    runWorkflow: jest.fn(),
  }
}));

describe('useGlobalState', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('应该初始化状态', () => {
    const { result } = renderHook(() => useGlobalState());
    
    expect(result.current.templates).toEqual([]);
    expect(result.current.agentInstances).toEqual([]);
    expect(result.current.workflows).toEqual([]);
    expect(result.current.capabilities).toEqual([]);
    expect(result.current.selectedTemplate).toBeNull();
    expect(result.current.selectedAgentInstance).toBeNull();
    expect(result.current.selectedWorkflow).toBeNull();
    expect(result.current.selectedComponent).toBeNull();
    expect(result.current.activeTab).toBe('designer');
  });

  it('应该加载模板', async () => {
    const mockTemplates = [
      { id: '1', name: '模板1' },
      { id: '2', name: '模板2' }
    ];
    
    (apiService.getTemplates as jest.Mock).mockResolvedValue({
      success: true,
      data: mockTemplates
    });
    
    const { result, waitForNextUpdate } = renderHook(() => useGlobalState());
    
    act(() => {
      result.current.loadTemplates();
    });
    
    await waitForNextUpdate();
    
    expect(apiService.getTemplates).toHaveBeenCalled();
    expect(result.current.templates).toEqual(mockTemplates);
    expect(result.current.loadingState.templates).toBe(false);
  });

  it('应该处理模板加载错误', async () => {
    const errorMessage = '加载模板失败';
    
    (apiService.getTemplates as jest.Mock).mockResolvedValue({
      success: false,
      error: errorMessage
    });
    
    const { result, waitForNextUpdate } = renderHook(() => useGlobalState());
    
    act(() => {
      result.current.loadTemplates();
    });
    
    await waitForNextUpdate();
    
    expect(apiService.getTemplates).toHaveBeenCalled();
    expect(result.current.templates).toEqual([]);
    expect(result.current.loadingState.templates).toBe(false);
    expect(result.current.errorState.templates).toBe(errorMessage);
  });

  it('应该加载Agent实例', async () => {
    const mockAgentInstances = [
      { id: '1', name: 'Agent1' },
      { id: '2', name: 'Agent2' }
    ];
    
    (apiService.getAgentInstances as jest.Mock).mockResolvedValue({
      success: true,
      data: mockAgentInstances
    });
    
    const { result, waitForNextUpdate } = renderHook(() => useGlobalState());
    
    act(() => {
      result.current.loadAgentInstances();
    });
    
    await waitForNextUpdate();
    
    expect(apiService.getAgentInstances).toHaveBeenCalled();
    expect(result.current.agentInstances).toEqual(mockAgentInstances);
    expect(result.current.loadingState.agentInstances).toBe(false);
  });

  it('应该选择模板', () => {
    const mockTemplate = { id: '1', name: '模板1' };
    const { result } = renderHook(() => useGlobalState());
    
    act(() => {
      result.current.selectTemplate(mockTemplate);
    });
    
    expect(result.current.selectedTemplate).toEqual(mockTemplate);
  });

  it('应该选择Agent实例', () => {
    const mockAgentInstance = { id: '1', name: 'Agent1' };
    const { result } = renderHook(() => useGlobalState());
    
    act(() => {
      result.current.selectAgentInstance(mockAgentInstance);
    });
    
    expect(result.current.selectedAgentInstance).toEqual(mockAgentInstance);
  });

  it('应该添加组件', () => {
    const mockComponent = { id: 'comp1', name: '组件1', type: 'basic' };
    const { result } = renderHook(() => useGlobalState());
    
    act(() => {
      result.current.addComponent(mockComponent);
    });
    
    expect(result.current.components).toContainEqual(mockComponent);
  });

  it('应该更新组件', () => {
    const mockComponent = { id: 'comp1', name: '组件1', type: 'basic' };
    const updatedComponent = { id: 'comp1', name: '更新的组件1', type: 'basic' };
    const { result } = renderHook(() => useGlobalState());
    
    act(() => {
      result.current.addComponent(mockComponent);
    });
    
    act(() => {
      result.current.updateComponent('comp1', updatedComponent);
    });
    
    expect(result.current.components).toContainEqual(updatedComponent);
    expect(result.current.components).not.toContainEqual(mockComponent);
  });

  it('应该删除组件', () => {
    const mockComponent = { id: 'comp1', name: '组件1', type: 'basic' };
    const { result } = renderHook(() => useGlobalState());
    
    act(() => {
      result.current.addComponent(mockComponent);
    });
    
    act(() => {
      result.current.deleteComponent('comp1');
    });
    
    expect(result.current.components).not.toContainEqual(mockComponent);
  });

  it('应该创建Agent实例', async () => {
    const mockAgentData = { name: '新Agent', templateId: '1' };
    const mockCreatedAgent = { id: '3', name: '新Agent', templateId: '1' };
    
    (apiService.createAgentInstance as jest.Mock).mockResolvedValue({
      success: true,
      data: mockCreatedAgent
    });
    
    const { result, waitForNextUpdate } = renderHook(() => useGlobalState());
    
    act(() => {
      result.current.createAgentInstance(mockAgentData);
    });
    
    await waitForNextUpdate();
    
    expect(apiService.createAgentInstance).toHaveBeenCalledWith(mockAgentData);
    expect(result.current.agentInstances).toContainEqual(mockCreatedAgent);
  });

  it('应该切换活动标签页', () => {
    const { result } = renderHook(() => useGlobalState());
    
    act(() => {
      result.current.setActiveTab('templates');
    });
    
    expect(result.current.activeTab).toBe('templates');
    
    act(() => {
      result.current.setActiveTab('marketplace');
    });
    
    expect(result.current.activeTab).toBe('marketplace');
  });
});