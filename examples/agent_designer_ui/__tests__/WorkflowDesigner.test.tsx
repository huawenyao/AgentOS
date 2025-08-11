import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import WorkflowDesigner from '../WorkflowDesigner';
import { apiService } from '../ApiService';

// 模拟依赖
jest.mock('../ApiService', () => ({
  apiService: {
    getAgentInstances: jest.fn(),
    getWorkflowById: jest.fn(),
    createWorkflow: jest.fn(),
    updateWorkflow: jest.fn(),
    runWorkflow: jest.fn()
  }
}));

// 模拟React Flow库
jest.mock('reactflow', () => {
  const ReactFlowMock = ({ children }: { children: React.ReactNode }) => (
    <div data-testid="react-flow-renderer">{children}</div>
  );
  
  ReactFlowMock.Controls = () => <div data-testid="react-flow-controls">Controls</div>;
  ReactFlowMock.MiniMap = () => <div data-testid="react-flow-minimap">MiniMap</div>;
  ReactFlowMock.Background = () => <div data-testid="react-flow-background">Background</div>;
  ReactFlowMock.useNodesState = jest.fn().mockReturnValue([[], jest.fn()]);
  ReactFlowMock.useEdgesState = jest.fn().mockReturnValue([[], jest.fn()]);
  ReactFlowMock.addEdge = jest.fn(edge => edge);
  ReactFlowMock.Panel = ({ children }: { children: React.ReactNode }) => (
    <div data-testid="react-flow-panel">{children}</div>
  );
  
  return ReactFlowMock;
});

describe('WorkflowDesigner组件', () => {
  beforeEach(() => {
    // 重置所有模拟
    jest.clearAllMocks();
    
    // 模拟Agent实例数据
    (apiService.getAgentInstances as jest.Mock).mockResolvedValue({
      success: true,
      data: [
        { id: '1', name: 'Agent 1', type: 'planner' },
        { id: '2', name: 'Agent 2', type: 'executor' }
      ]
    });
    
    // 模拟工作流数据
    (apiService.getWorkflowById as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        id: 'wf1',
        name: '测试工作流',
        description: '这是一个测试工作流',
        nodes: [],
        edges: []
      }
    });
    
    // 模拟创建工作流响应
    (apiService.createWorkflow as jest.Mock).mockResolvedValue({
      success: true,
      data: { id: 'new-wf', name: '新工作流' }
    });
    
    // 模拟更新工作流响应
    (apiService.updateWorkflow as jest.Mock).mockResolvedValue({
      success: true,
      data: { id: 'wf1', name: '更新的工作流' }
    });
  });

  it('应该正确渲染工作流设计器组件', async () => {
    render(<WorkflowDesigner />);
    
    // 验证工具栏是否渲染
    expect(screen.getByTestId('workflow-toolbar')).toBeInTheDocument();
    
    // 验证React Flow组件是否渲染
    expect(screen.getByTestId('react-flow-renderer')).toBeInTheDocument();
    expect(screen.getByTestId('react-flow-controls')).toBeInTheDocument();
    expect(screen.getByTestId('react-flow-minimap')).toBeInTheDocument();
    expect(screen.getByTestId('react-flow-background')).toBeInTheDocument();
    
    // 验证是否加载了Agent实例
    await waitFor(() => {
      expect(apiService.getAgentInstances).toHaveBeenCalledTimes(1);
    });
  });

  it('应该打开添加节点模态框', async () => {
    render(<WorkflowDesigner />);
    
    // 点击添加节点按钮
    fireEvent.click(screen.getByText('添加节点'));
    
    // 验证模态框是否打开
    expect(screen.getByText('添加工作流节点')).toBeInTheDocument();
    expect(screen.getByLabelText('节点名称')).toBeInTheDocument();
    expect(screen.getByLabelText('节点类型')).toBeInTheDocument();
  });

  it('应该打开添加连接模态框', async () => {
    render(<WorkflowDesigner />);
    
    // 点击添加连接按钮
    fireEvent.click(screen.getByText('添加连接'));
    
    // 验证模态框是否打开
    expect(screen.getByText('添加工作流连接')).toBeInTheDocument();
    expect(screen.getByLabelText('源节点')).toBeInTheDocument();
    expect(screen.getByLabelText('目标节点')).toBeInTheDocument();
    expect(screen.getByLabelText('标签')).toBeInTheDocument();
    expect(screen.getByLabelText('条件表达式')).toBeInTheDocument();
  });

  it('应该保存工作流', async () => {
    render(<WorkflowDesigner />);
    
    // 点击保存按钮
    fireEvent.click(screen.getByText('保存'));
    
    // 验证是否调用了保存API
    await waitFor(() => {
      expect(apiService.updateWorkflow).toHaveBeenCalledTimes(1);
    });
  });

  it('应该运行工作流', async () => {
    render(<WorkflowDesigner />);
    
    // 点击运行按钮
    fireEvent.click(screen.getByText('运行'));
    
    // 验证是否调用了运行API
    await waitFor(() => {
      expect(apiService.runWorkflow).toHaveBeenCalledTimes(1);
    });
  });

  it('应该添加Agent节点', async () => {
    render(<WorkflowDesigner />);
    
    // 点击添加节点按钮
    fireEvent.click(screen.getByText('添加节点'));
    
    // 填写节点表单
    fireEvent.change(screen.getByLabelText('节点名称'), { target: { value: '新Agent节点' } });
    fireEvent.change(screen.getByLabelText('节点类型'), { target: { value: 'agent' } });
    
    // 等待Agent实例选择器出现
    await waitFor(() => {
      expect(screen.getByLabelText('Agent实例')).toBeInTheDocument();
    });
    
    // 选择Agent实例
    fireEvent.change(screen.getByLabelText('Agent实例'), { target: { value: '1' } });
    
    // 提交表单
    fireEvent.click(screen.getByText('确定'));
    
    // 验证节点是否添加
    await waitFor(() => {
      expect(screen.queryByText('添加工作流节点')).not.toBeInTheDocument();
    });
  });

  it('应该添加处理节点', async () => {
    render(<WorkflowDesigner />);
    
    // 点击添加节点按钮
    fireEvent.click(screen.getByText('添加节点'));
    
    // 填写节点表单
    fireEvent.change(screen.getByLabelText('节点名称'), { target: { value: '新处理节点' } });
    fireEvent.change(screen.getByLabelText('节点类型'), { target: { value: 'processor' } });
    
    // 提交表单
    fireEvent.click(screen.getByText('确定'));
    
    // 验证节点是否添加
    await waitFor(() => {
      expect(screen.queryByText('添加工作流节点')).not.toBeInTheDocument();
    });
  });

  it('应该添加连接', async () => {
    render(<WorkflowDesigner />);
    
    // 点击添加连接按钮
    fireEvent.click(screen.getByText('添加连接'));
    
    // 填写连接表单
    fireEvent.change(screen.getByLabelText('源节点'), { target: { value: 'node1' } });
    fireEvent.change(screen.getByLabelText('目标节点'), { target: { value: 'node2' } });
    fireEvent.change(screen.getByLabelText('标签'), { target: { value: '测试连接' } });
    fireEvent.change(screen.getByLabelText('条件表达式'), { target: { value: 'true' } });
    
    // 提交表单
    fireEvent.click(screen.getByText('确定'));
    
    // 验证连接是否添加
    await waitFor(() => {
      expect(screen.queryByText('添加工作流连接')).not.toBeInTheDocument();
    });
  });

  it('应该处理工作流加载错误', async () => {
    // 模拟工作流加载错误
    (apiService.getWorkflowById as jest.Mock).mockResolvedValue({
      success: false,
      error: '工作流加载失败'
    });
    
    render(<WorkflowDesigner workflowId="wf1" />);
    
    // 验证是否显示错误消息
    await waitFor(() => {
      expect(screen.getByText('工作流加载失败')).toBeInTheDocument();
    });
  });

  it('应该处理Agent实例加载错误', async () => {
    // 模拟Agent实例加载错误
    (apiService.getAgentInstances as jest.Mock).mockResolvedValue({
      success: false,
      error: 'Agent实例加载失败'
    });
    
    render(<WorkflowDesigner />);
    
    // 验证是否显示错误消息
    await waitFor(() => {
      expect(screen.getByText('Agent实例加载失败')).toBeInTheDocument();
    });
  });
});