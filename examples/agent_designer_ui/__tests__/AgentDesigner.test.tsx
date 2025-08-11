import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AgentDesigner from '../src/components/AgentDesigner';
import ApiService from '../src/components/ApiService';
import useGlobalState from '../src/components/StateManager';

// 模拟依赖
jest.mock('../src/components/ApiService', () => ({
  __esModule: true,
  default: {
    getTemplates: jest.fn(),
    getCapabilities: jest.fn(),
    createAgentInstance: jest.fn(),
    startAgentInstance: jest.fn(),
    stopAgentInstance: jest.fn()
  }
}));

jest.mock('../src/components/StateManager', () => ({
  __esModule: true,
  default: jest.fn().mockReturnValue({
    initialize: jest.fn(),
    loadTemplates: jest.fn(),
    loadAgents: jest.fn(),
    loadWorkflows: jest.fn(),
    loadCapabilities: jest.fn(),
    selectTemplate: jest.fn(),
    selectAgent: jest.fn(),
    selectWorkflow: jest.fn(),
    selectComponent: jest.fn(),
    addComponent: jest.fn(),
    updateComponent: jest.fn(),
    deleteComponent: jest.fn(),
    updateComponentProperty: jest.fn(),
    createAgent: jest.fn(),
    createWorkflow: jest.fn(),
    setActiveTab: jest.fn(),
    templates: [],
    agents: [],
    workflows: [],
    capabilities: [],
    selectedTemplate: null,
    selectedAgent: null,
    selectedWorkflow: null,
    selectedComponent: null,
    components: [],
    activeTab: 'designer',
    loading: {
      templates: false,
      agents: false,
      workflows: false,
      capabilities: false
    },
    errors: {}
  })
}));

describe('AgentDesigner组件', () => {
  // 创建模拟的全局状态钩子
  const mockGlobalState = useGlobalState();
  
  beforeEach(() => {
    // 重置所有模拟
    jest.clearAllMocks();
    
    // 模拟模板数据
    (ApiService.getTemplates as jest.Mock).mockResolvedValue({
      success: true,
      data: [
        { id: '1', name: '规划智能体', type: 'planner', description: '用于任务规划的智能体' },
        { id: '2', name: '执行智能体', type: 'executor', description: '用于任务执行的智能体' }
      ]
    });
    
    // 模拟能力组件数据
    (ApiService.getCapabilities as jest.Mock).mockResolvedValue({
      success: true,
      data: [
        { id: '1', name: '自然语言处理', type: 'nlp', description: '处理自然语言输入' },
        { id: '2', name: '知识图谱查询', type: 'knowledge', description: '查询知识图谱' },
        { id: '3', name: 'API调用', type: 'api', description: '调用外部API' }
      ]
    });
    
    // 模拟创建Agent实例响应
    (ApiService.createAgentInstance as jest.Mock).mockResolvedValue({
      success: true,
      data: { id: 'new-agent', name: '新智能体' }
    });
    
    // 模拟启动Agent实例响应
    (ApiService.startAgentInstance as jest.Mock).mockResolvedValue({
      success: true,
      data: { message: 'Agent started successfully' }
    });
    
    // 模拟停止Agent实例响应
    (ApiService.stopAgentInstance as jest.Mock).mockResolvedValue({
      success: true,
      data: { message: 'Agent stopped successfully' }
    });
  });

  it('应该正确渲染Agent设计器组件', async () => {
    render(<AgentDesigner />);
    
    // 验证标签页是否渲染
    expect(screen.getByText('Agent设计器')).toBeInTheDocument();
    expect(screen.getByText('模板库')).toBeInTheDocument();
    expect(screen.getByText('能力市场')).toBeInTheDocument();
    expect(screen.getByText('工作流')).toBeInTheDocument();
    
    // 验证是否初始化状态管理器
    expect(mockGlobalState.initialize).toHaveBeenCalledTimes(1);
    
    // 验证是否加载模板和Agent实例
    expect(mockGlobalState.loadTemplates).toHaveBeenCalledTimes(1);
    expect(mockGlobalState.loadAgents).toHaveBeenCalledTimes(1);
  });

  it('应该切换标签页', async () => {
    render(<AgentDesigner />);
    
    // 点击模板库标签页
    fireEvent.click(screen.getByText('模板库'));
    
    // 验证是否切换标签页
    expect(stateManager.setActiveTab).toHaveBeenCalledWith('templates');
    
    // 点击能力市场标签页
    fireEvent.click(screen.getByText('能力市场'));
    
    // 验证是否切换标签页
    expect(stateManager.setActiveTab).toHaveBeenCalledWith('capabilities');
    
    // 点击工作流标签页
    fireEvent.click(screen.getByText('工作流'));
    
    // 验证是否切换标签页
    expect(stateManager.setActiveTab).toHaveBeenCalledWith('workflow');
    
    // 点击Agent设计器标签页
    fireEvent.click(screen.getByText('Agent设计器'));
    
    // 验证是否切换标签页
    expect(stateManager.setActiveTab).toHaveBeenCalledWith('designer');
  });

  it('应该打开创建Agent模态框', async () => {
    // 模拟状态管理器返回模板数据
    (stateManager.getState as jest.Mock).mockReturnValue({
      templates: [
        { id: '1', name: '规划智能体', type: 'planner', description: '用于任务规划的智能体' },
        { id: '2', name: '执行智能体', type: 'executor', description: '用于任务执行的智能体' }
      ],
      agentInstances: [],
      selectedTemplate: null,
      selectedAgentInstance: null,
      components: [],
      activeTab: 'designer'
    });
    
    render(<AgentDesigner />);
    
    // 点击创建Agent按钮
    fireEvent.click(screen.getByText('创建Agent'));
    
    // 验证模态框是否打开
    expect(screen.getByText('创建新的Agent实例')).toBeInTheDocument();
    expect(screen.getByLabelText('名称')).toBeInTheDocument();
    expect(screen.getByLabelText('描述')).toBeInTheDocument();
    expect(screen.getByLabelText('模板')).toBeInTheDocument();
  });

  it('应该创建Agent实例', async () => {
    // 模拟状态管理器返回模板数据
    Object.assign(mockGlobalState, {
      templates: [
        { id: '1', name: '规划智能体', type: 'planner', description: '用于任务规划的智能体' },
        { id: '2', name: '执行智能体', type: 'executor', description: '用于任务执行的智能体' }
      ],
      agents: [],
      selectedTemplate: null,
      selectedAgent: null,
      components: [],
      activeTab: 'designer'
    });
    
    render(<AgentDesigner />);
    
    // 点击创建Agent按钮
    fireEvent.click(screen.getByText('创建Agent'));
    
    // 填写表单
    fireEvent.change(screen.getByLabelText('名称'), { target: { value: '新智能体' } });
    fireEvent.change(screen.getByLabelText('描述'), { target: { value: '这是一个新的智能体' } });
    fireEvent.change(screen.getByLabelText('模板'), { target: { value: '1' } });
    
    // 提交表单
    fireEvent.click(screen.getByText('确定'));
    
    // 验证是否调用创建方法
    await waitFor(() => {
      expect(mockGlobalState.createAgent).toHaveBeenCalledWith({
        name: '新智能体',
        description: '这是一个新的智能体',
        templateId: '1'
      });
    });
  });

  it('应该保存Agent实例', async () => {
    // 模拟状态管理器返回选中的Agent实例
    (stateManager.getState as jest.Mock).mockReturnValue({
      templates: [],
      agentInstances: [],
      selectedTemplate: null,
      selectedAgentInstance: { id: '1', name: '测试智能体' },
      components: [],
      activeTab: 'designer'
    });
    
    render(<AgentDesigner />);
    
    // 点击保存按钮
    fireEvent.click(screen.getByText('保存'));
    
    // 验证是否显示成功消息
    await waitFor(() => {
      expect(screen.getByText('Agent保存成功')).toBeInTheDocument();
    });
  });

  it('应该启动Agent实例', async () => {
    // 模拟状态管理器返回选中的Agent实例
    Object.assign(mockGlobalState, {
      templates: [],
      agents: [],
      selectedTemplate: null,
      selectedAgent: { id: '1', name: '测试智能体', status: 'stopped' },
      components: [],
      activeTab: 'designer'
    });
    
    render(<AgentDesigner />);
    
    // 点击启动按钮
    fireEvent.click(screen.getByText('启动'));
    
    // 验证是否调用启动方法
    await waitFor(() => {
      expect(ApiService.startAgentInstance).toHaveBeenCalledWith('1');
    });
  });

  it('应该停止Agent实例', async () => {
    // 模拟状态管理器返回选中的Agent实例
    Object.assign(mockGlobalState, {
      templates: [],
      agents: [],
      selectedTemplate: null,
      selectedAgent: { id: '1', name: '测试智能体', status: 'running' },
      components: [],
      activeTab: 'designer'
    });
    
    render(<AgentDesigner />);
    
    // 点击停止按钮
    fireEvent.click(screen.getByText('停止'));
    
    // 验证是否调用停止方法
    await waitFor(() => {
      expect(ApiService.stopAgentInstance).toHaveBeenCalledWith('1');
    });
  });

  it('应该处理模板加载错误', async () => {
    // 模拟模板加载错误
    (stateManager.loadTemplates as jest.Mock).mockImplementation(() => {
      throw new Error('模板加载失败');
    });
    
    render(<AgentDesigner />);
    
    // 验证是否显示错误消息
    await waitFor(() => {
      expect(screen.getByText('模板加载失败')).toBeInTheDocument();
    });
  });

  it('应该处理Agent实例加载错误', async () => {
    // 模拟Agent实例加载错误
    (stateManager.loadAgentInstances as jest.Mock).mockImplementation(() => {
      throw new Error('Agent实例加载失败');
    });
    
    render(<AgentDesigner />);
    
    // 验证是否显示错误消息
    await waitFor(() => {
      expect(screen.getByText('Agent实例加载失败')).toBeInTheDocument();
    });
  });
});