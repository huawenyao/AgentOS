import React, { useState, useCallback, useEffect } from 'react';
import {
  Modal,
  Steps,
  Progress,
  Card,
  List,
  Tag,
  Button,
  Space,
  Typography,
  Divider,
  Timeline,
  Spin,
  Alert,
  Descriptions,
  message
} from 'antd';
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  StopOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  SyncOutlined,
  ClockCircleOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { Workflow, WorkflowExecution } from './types';

const { Step } = Steps;

interface WorkflowEngineProps {
  visible: boolean;
  workflow: Workflow | null;
  onClose: () => void;
  onExecutionComplete?: (execution: WorkflowExecution) => void;
}

interface ExecutionStep {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  startTime?: Date;
  endTime?: Date;
  duration?: number;
  result?: any;
  error?: string;
  logs: string[];
}

interface ExecutionState {
  id: string;
  status: 'pending' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';
  startTime: Date;
  endTime?: Date;
  progress: number;
  currentStep?: string;
  steps: ExecutionStep[];
  logs: string[];
  result?: any;
  error?: string;
}

const WorkflowEngine: React.FC<WorkflowEngineProps> = ({
  visible,
  workflow,
  onClose,
  onExecutionComplete
}) => {
  const [execution, setExecution] = useState<ExecutionState | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // 初始化执行状态
  const initializeExecution = useCallback(() => {
    if (!workflow) return;

    const steps: ExecutionStep[] = workflow.nodes.map(node => ({
      id: node.id,
      name: node.name,
      status: 'pending',
      logs: []
    }));

    const newExecution: ExecutionState = {
      id: `exec_${Date.now()}`,
      status: 'pending',
      startTime: new Date(),
      progress: 0,
      steps,
      logs: [`工作流 "${workflow.name}" 初始化完成`]
    };

    setExecution(newExecution);
  }, [workflow]);

  // 开始执行工作流
  const startExecution = useCallback(async () => {
    if (!workflow || !execution) return;

    setIsExecuting(true);
    setExecution(prev => prev ? {
      ...prev,
      status: 'running',
      logs: [...prev.logs, '开始执行工作流...']
    } : null);

    try {
      // 模拟工作流执行
      await executeWorkflowSteps();
    } catch (error) {
      console.error('工作流执行失败:', error);
      setExecution(prev => prev ? {
        ...prev,
        status: 'failed',
        endTime: new Date(),
        error: error instanceof Error ? error.message : '未知错误',
        logs: [...prev.logs, `执行失败: ${error instanceof Error ? error.message : '未知错误'}`]
      } : null);
      message.error('工作流执行失败');
    } finally {
      setIsExecuting(false);
    }
  }, [workflow, execution]);

  // 执行工作流步骤
  const executeWorkflowSteps = useCallback(async () => {
    if (!workflow || !execution) return;

    const { nodes, connections } = workflow;
    const executionOrder = getExecutionOrder(nodes, connections);

    for (let i = 0; i < executionOrder.length; i++) {
      if (isPaused) {
        setExecution(prev => prev ? {
          ...prev,
          status: 'paused',
          logs: [...prev.logs, '工作流执行已暂停']
        } : null);
        return;
      }

      const nodeId = executionOrder[i];
      const node = nodes.find(n => n.id === nodeId);
      if (!node) continue;

      // 更新当前步骤
      setExecution(prev => prev ? {
        ...prev,
        currentStep: nodeId,
        progress: Math.round(((i + 1) / executionOrder.length) * 100),
        steps: prev.steps.map(step => 
          step.id === nodeId 
            ? { ...step, status: 'running', startTime: new Date() }
            : step
        ),
        logs: [...prev.logs, `开始执行步骤: ${node.name}`]
      } : null);

      try {
        // 模拟步骤执行
        const result = await executeStep(node);
        
        // 更新步骤状态
        setExecution(prev => prev ? {
          ...prev,
          steps: prev.steps.map(step => 
            step.id === nodeId 
              ? { 
                  ...step, 
                  status: 'completed', 
                  endTime: new Date(),
                  duration: step.startTime ? Date.now() - step.startTime.getTime() : 0,
                  result,
                  logs: [...step.logs, `步骤执行完成，耗时: ${step.startTime ? Date.now() - step.startTime.getTime() : 0}ms`]
                }
              : step
          ),
          logs: [...prev.logs, `步骤 "${node.name}" 执行完成`]
        } : null);

      } catch (error) {
        // 更新步骤失败状态
        setExecution(prev => prev ? {
          ...prev,
          steps: prev.steps.map(step => 
            step.id === nodeId 
              ? { 
                  ...step, 
                  status: 'failed', 
                  endTime: new Date(),
                  error: error instanceof Error ? error.message : '未知错误',
                  logs: [...step.logs, `步骤执行失败: ${error instanceof Error ? error.message : '未知错误'}`]
                }
              : step
          ),
          logs: [...prev.logs, `步骤 "${node.name}" 执行失败: ${error instanceof Error ? error.message : '未知错误'}`]
        } : null);
        
        throw error;
      }

      // 添加延迟以便观察执行过程
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // 执行完成
    setExecution(prev => prev ? {
      ...prev,
      status: 'completed',
      endTime: new Date(),
      progress: 100,
      logs: [...prev.logs, '工作流执行完成']
    } : null);

    message.success('工作流执行完成');
    
    if (onExecutionComplete && execution) {
      onExecutionComplete({
        id: execution.id,
        workflowId: workflow.id,
        status: 'completed',
        startTime: execution.startTime,
        endTime: new Date(),
        result: execution.steps.map(step => ({
          stepId: step.id,
          result: step.result
        }))
      } as WorkflowExecution);
    }
  }, [workflow, execution, isPaused, onExecutionComplete]);

  // 模拟步骤执行
  const executeStep = useCallback(async (node: any): Promise<any> => {
    // 根据节点类型执行不同的逻辑
    switch (node.type) {
      case 'start':
        return { message: '工作流开始' };
      case 'end':
        return { message: '工作流结束' };
      case 'agent':
        // 模拟Agent执行
        const executionTime = Math.random() * 2000 + 500; // 0.5-2.5秒
        await new Promise(resolve => setTimeout(resolve, executionTime));
        
        // 模拟可能的失败
        if (Math.random() < 0.1) { // 10% 失败率
          throw new Error(`Agent ${node.name} 执行失败`);
        }
        
        return {
          agentType: node.agent_type,
          output: `Agent ${node.name} 执行结果`,
          executionTime
        };
      case 'condition':
        // 模拟条件判断
        const conditionResult = Math.random() > 0.5;
        return {
          condition: node.config?.condition || 'true',
          result: conditionResult
        };
      default:
        return { message: `节点 ${node.name} 执行完成` };
    }
  }, []);

  // 获取执行顺序（简化的拓扑排序）
  const getExecutionOrder = useCallback((nodes: any[], connections: any[]): string[] => {
    const startNode = nodes.find(node => node.type === 'start');
    if (!startNode) return nodes.map(n => n.id);

    const visited = new Set<string>();
    const order: string[] = [];

    const dfs = (nodeId: string) => {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);
      order.push(nodeId);

      // 找到所有连接到当前节点的下一个节点
      const nextConnections = connections.filter(conn => conn.source === nodeId);
      nextConnections.forEach(conn => {
        dfs(conn.target);
      });
    };

    dfs(startNode.id);
    return order;
  }, []);

  // 暂停执行
  const pauseExecution = useCallback(() => {
    setIsPaused(true);
    message.info('工作流执行已暂停');
  }, []);

  // 恢复执行
  const resumeExecution = useCallback(() => {
    setIsPaused(false);
    if (execution?.status === 'paused') {
      setExecution(prev => prev ? {
        ...prev,
        status: 'running',
        logs: [...prev.logs, '恢复工作流执行']
      } : null);
      executeWorkflowSteps();
    }
    message.info('工作流执行已恢复');
  }, [execution, executeWorkflowSteps]);

  // 停止执行
  const stopExecution = useCallback(() => {
    setIsExecuting(false);
    setIsPaused(false);
    setExecution(prev => prev ? {
      ...prev,
      status: 'cancelled',
      endTime: new Date(),
      logs: [...prev.logs, '工作流执行已停止']
    } : null);
    message.warning('工作流执行已停止');
  }, []);

  // 重置执行状态
  const resetExecution = useCallback(() => {
    setExecution(null);
    setIsExecuting(false);
    setIsPaused(false);
  }, []);

  // 获取步骤状态图标
  const getStepIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'failed':
        return <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />;
      case 'running':
        return <SyncOutlined spin style={{ color: '#1890ff' }} />;
      case 'pending':
        return <ClockCircleOutlined style={{ color: '#d9d9d9' }} />;
      default:
        return <InfoCircleOutlined style={{ color: '#d9d9d9' }} />;
    }
  };

  // 获取状态标签
  const getStatusTag = (status: string) => {
    const statusConfig = {
      pending: { color: 'default', text: '等待中' },
      running: { color: 'processing', text: '执行中' },
      paused: { color: 'warning', text: '已暂停' },
      completed: { color: 'success', text: '已完成' },
      failed: { color: 'error', text: '执行失败' },
      cancelled: { color: 'default', text: '已取消' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  // 当工作流变化时重置执行状态
  useEffect(() => {
    if (visible && workflow) {
      initializeExecution();
    } else {
      resetExecution();
    }
  }, [visible, workflow, initializeExecution, resetExecution]);

  return (
    <Modal
      title={`工作流执行 - ${workflow?.name || ''}`}
      open={visible}
      onCancel={onClose}
      width={800}
      footer={[
        <Button key="close" onClick={onClose}>
          关闭
        </Button>,
        !isExecuting && execution?.status === 'pending' && (
          <Button
            key="start"
            type="primary"
            icon={<PlayCircleOutlined />}
            onClick={startExecution}
          >
            开始执行
          </Button>
        ),
        isExecuting && !isPaused && (
          <Button
            key="pause"
            icon={<PauseCircleOutlined />}
            onClick={pauseExecution}
          >
            暂停
          </Button>
        ),
        isPaused && (
          <Button
            key="resume"
            type="primary"
            icon={<PlayCircleOutlined />}
            onClick={resumeExecution}
          >
            恢复
          </Button>
        ),
        (isExecuting || isPaused) && (
          <Button
            key="stop"
            danger
            icon={<StopOutlined />}
            onClick={stopExecution}
          >
            停止
          </Button>
        ),
        execution?.status && ['completed', 'failed', 'cancelled'].includes(execution.status) && (
          <Button
            key="restart"
            type="primary"
            icon={<PlayCircleOutlined />}
            onClick={() => {
              initializeExecution();
              setTimeout(startExecution, 100);
            }}
          >
            重新执行
          </Button>
        )
      ]}
    >
      {execution ? (
        <div>
          {/* 执行概览 */}
          <Card size="small" style={{ marginBottom: 16 }}>
            <Descriptions size="small" column={2}>
              <Descriptions.Item label="执行ID">{execution.id}</Descriptions.Item>
              <Descriptions.Item label="状态">{getStatusTag(execution.status)}</Descriptions.Item>
              <Descriptions.Item label="开始时间">
                {execution.startTime.toLocaleString()}
              </Descriptions.Item>
              <Descriptions.Item label="结束时间">
                {execution.endTime ? execution.endTime.toLocaleString() : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="执行进度" span={2}>
                <Progress percent={execution.progress} size="small" />
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {/* 步骤执行状态 */}
          <Card title="执行步骤" size="small" style={{ marginBottom: 16 }}>
            <Steps
              direction="vertical"
              size="small"
              current={execution.steps.findIndex(step => step.status === 'running')}
            >
              {execution.steps.map((step, index) => (
                <Step
                  key={step.id}
                  title={step.name}
                  status={
                    step.status === 'completed' ? 'finish' :
                    step.status === 'failed' ? 'error' :
                    step.status === 'running' ? 'process' : 'wait'
                  }
                  icon={getStepIcon(step.status)}
                  description={
                    <div>
                      <div>{getStatusTag(step.status)}</div>
                      {step.duration && (
                        <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
                          耗时: {step.duration}ms
                        </div>
                      )}
                      {step.error && (
                        <Alert
                          message={step.error}
                          type="error"
                          style={{ marginTop: 4 }}
                        />
                      )}
                    </div>
                  }
                />
              ))}
            </Steps>
          </Card>

          {/* 执行日志 */}
          <Card title="执行日志" size="small">
            <div style={{ maxHeight: 200, overflowY: 'auto' }}>
              <Timeline>
                {execution.logs.map((log, index) => (
                  <Timeline.Item key={index}>
                    <span style={{ fontSize: '12px' }}>{log}</span>
                  </Timeline.Item>
                ))}
              </Timeline>
            </div>
          </Card>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin size="large" tip="初始化执行环境..." />
        </div>
      )}
    </Modal>
  );
};

export default WorkflowEngine;