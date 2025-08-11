/**
 * EFIAgent 2.0 工作流调试器
 * 提供断点设置、单步执行、变量监控和执行状态可视化功能
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Card,
  Button,
  Table,
  Tree,
  Tabs,
  Timeline,
  Tag,
  Progress,
  Drawer,
  Space,
  Input,
  Select,
  Switch,
  Tooltip,
  Badge,
  Alert,
  Collapse,
  Typography,
  Divider,
  Row,
  Col,
  Statistic,
  List,
  Avatar,
  Empty,
  Spin
} from 'antd';
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  StepForwardOutlined,
  StopOutlined,
  BugOutlined,
  EyeOutlined,
  ClockCircleOutlined,
  ThunderboltOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ReloadOutlined,
  SettingOutlined,
  FilterOutlined,
  SearchOutlined,
  DownloadOutlined,
  UploadOutlined
} from '@ant-design/icons';
import {
  WorkflowDefinition,
  WorkflowNode,
  WorkflowEdge,
  WorkflowVariable
} from './CapabilitySystemTypes';

const { TabPane } = Tabs;
const { Panel } = Collapse;
const { Text, Title } = Typography;
const { Option } = Select;

/**
 * 执行状态枚举
 */
export enum ExecutionStatus {
  IDLE = 'idle',
  RUNNING = 'running',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  ERROR = 'error',
  STOPPED = 'stopped'
}

/**
 * 节点执行状态
 */
export enum NodeExecutionStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  ERROR = 'error',
  SKIPPED = 'skipped'
}

/**
 * 断点类型
 */
export enum BreakpointType {
  UNCONDITIONAL = 'unconditional',
  CONDITIONAL = 'conditional',
  DATA_CHANGE = 'data_change',
  ERROR = 'error'
}

/**
 * 断点接口
 */
export interface Breakpoint {
  id: string;
  nodeId: string;
  type: BreakpointType;
  enabled: boolean;
  condition?: string;
  variableName?: string;
  hitCount: number;
  lastHit?: Date;
}

/**
 * 执行步骤接口
 */
export interface ExecutionStep {
  id: string;
  nodeId: string;
  nodeName: string;
  status: NodeExecutionStatus;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  input?: any;
  output?: any;
  error?: string;
  logs: LogEntry[];
}

/**
 * 日志条目接口
 */
export interface LogEntry {
  id: string;
  timestamp: Date;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  nodeId?: string;
  data?: any;
}

/**
 * 变量监控接口
 */
export interface VariableWatch {
  id: string;
  name: string;
  expression: string;
  value: any;
  type: string;
  lastChanged?: Date;
  changeCount: number;
}

/**
 * 调试器属性接口
 */
export interface WorkflowDebuggerProps {
  workflow: WorkflowDefinition;
  visible: boolean;
  onClose: () => void;
  onNodeHighlight: (nodeId: string | null) => void;
  onExecutionStart: () => void;
  onExecutionStop: () => void;
}

/**
 * 工作流调试器组件
 */
export const WorkflowDebugger: React.FC<WorkflowDebuggerProps> = ({
  workflow,
  visible,
  onClose,
  onNodeHighlight,
  onExecutionStart,
  onExecutionStop
}) => {
  // 状态管理
  const [executionStatus, setExecutionStatus] = useState<ExecutionStatus>(ExecutionStatus.IDLE);
  const [currentStep, setCurrentStep] = useState<string | null>(null);
  const [breakpoints, setBreakpoints] = useState<Breakpoint[]>([]);
  const [executionSteps, setExecutionSteps] = useState<ExecutionStep[]>([]);
  const [variableWatches, setVariableWatches] = useState<VariableWatch[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [activeTab, setActiveTab] = useState('execution');
  const [stepMode, setStepMode] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [searchText, setSearchText] = useState('');
  
  // 引用
  const executionRef = useRef<any>(null);
  const logsRef = useRef<HTMLDivElement>(null);

  /**
   * 开始执行
   */
  const handleStartExecution = useCallback(async () => {
    try {
      setExecutionStatus(ExecutionStatus.RUNNING);
      setExecutionSteps([]);
      setLogs([]);
      
      addLog('info', '开始执行工作流', undefined, { workflowId: workflow.id });
      
      // 模拟执行过程
      await simulateExecution();
      
      onExecutionStart();
    } catch (error) {
      setExecutionStatus(ExecutionStatus.ERROR);
      addLog('error', '执行失败', undefined, { error: error.message });
    }
  }, [workflow, onExecutionStart]);

  /**
   * 暂停执行
   */
  const handlePauseExecution = useCallback(() => {
    setExecutionStatus(ExecutionStatus.PAUSED);
    addLog('info', '执行已暂停');
  }, []);

  /**
   * 继续执行
   */
  const handleResumeExecution = useCallback(() => {
    setExecutionStatus(ExecutionStatus.RUNNING);
    addLog('info', '继续执行');
  }, []);

  /**
   * 停止执行
   */
  const handleStopExecution = useCallback(() => {
    setExecutionStatus(ExecutionStatus.STOPPED);
    setCurrentStep(null);
    addLog('info', '执行已停止');
    onExecutionStop();
    onNodeHighlight(null);
  }, [onExecutionStop, onNodeHighlight]);

  /**
   * 单步执行
   */
  const handleStepExecution = useCallback(async () => {
    if (executionStatus === ExecutionStatus.PAUSED || stepMode) {
      // 执行下一步
      const nextNode = getNextExecutionNode();
      if (nextNode) {
        await executeNode(nextNode);
      }
    }
  }, [executionStatus, stepMode]);

  /**
   * 模拟执行过程
   */
  const simulateExecution = async (): Promise<void> => {
    const nodes = workflow.nodes || [];
    
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      
      // 检查断点
      const breakpoint = breakpoints.find(bp => bp.nodeId === node.id && bp.enabled);
      if (breakpoint) {
        setExecutionStatus(ExecutionStatus.PAUSED);
        setCurrentStep(node.id);
        onNodeHighlight(node.id);
        
        breakpoint.hitCount++;
        breakpoint.lastHit = new Date();
        
        addLog('info', `命中断点: ${node.name}`, node.id);
        
        // 等待用户继续
        await waitForResume();
      }
      
      // 执行节点
      await executeNode(node);
      
      // 检查是否需要停止
      if (executionStatus === ExecutionStatus.STOPPED) {
        break;
      }
    }
    
    if (executionStatus !== ExecutionStatus.STOPPED) {
      setExecutionStatus(ExecutionStatus.COMPLETED);
      addLog('info', '工作流执行完成');
    }
  };

  /**
   * 执行单个节点
   */
  const executeNode = async (node: WorkflowNode): Promise<void> => {
    const step: ExecutionStep = {
      id: `step_${Date.now()}_${node.id}`,
      nodeId: node.id,
      nodeName: node.name,
      status: NodeExecutionStatus.RUNNING,
      startTime: new Date(),
      logs: []
    };
    
    setExecutionSteps(prev => [...prev, step]);
    setCurrentStep(node.id);
    onNodeHighlight(node.id);
    
    addLog('debug', `开始执行节点: ${node.name}`, node.id);
    
    try {
      // 模拟节点执行
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
      
      // 模拟成功或失败
      const success = Math.random() > 0.1; // 90% 成功率
      
      if (success) {
        step.status = NodeExecutionStatus.COMPLETED;
        step.endTime = new Date();
        step.duration = step.endTime.getTime() - step.startTime.getTime();
        step.output = { result: `节点 ${node.name} 执行结果`, timestamp: new Date() };
        
        addLog('info', `节点执行成功: ${node.name}`, node.id, step.output);
        
        // 更新变量监控
        updateVariableWatches(node, step.output);
      } else {
        step.status = NodeExecutionStatus.ERROR;
        step.endTime = new Date();
        step.duration = step.endTime.getTime() - step.startTime.getTime();
        step.error = `节点 ${node.name} 执行失败: 模拟错误`;
        
        addLog('error', `节点执行失败: ${node.name}`, node.id, { error: step.error });
        
        throw new Error(step.error);
      }
    } catch (error) {
      step.status = NodeExecutionStatus.ERROR;
      step.endTime = new Date();
      step.duration = step.endTime ? step.endTime.getTime() - step.startTime.getTime() : 0;
      step.error = error.message;
      
      setExecutionStatus(ExecutionStatus.ERROR);
      throw error;
    } finally {
      setExecutionSteps(prev => 
        prev.map(s => s.id === step.id ? step : s)
      );
    }
  };

  /**
   * 等待恢复执行
   */
  const waitForResume = (): Promise<void> => {
    return new Promise((resolve) => {
      const checkStatus = () => {
        if (executionStatus === ExecutionStatus.RUNNING) {
          resolve();
        } else if (executionStatus === ExecutionStatus.STOPPED) {
          resolve();
        } else {
          setTimeout(checkStatus, 100);
        }
      };
      checkStatus();
    });
  };

  /**
   * 获取下一个执行节点
   */
  const getNextExecutionNode = (): WorkflowNode | null => {
    // 简化实现，实际应该根据工作流图结构确定
    const nodes = workflow.nodes || [];
    const currentIndex = currentStep ? nodes.findIndex(n => n.id === currentStep) : -1;
    return currentIndex < nodes.length - 1 ? nodes[currentIndex + 1] : null;
  };

  /**
   * 添加日志
   */
  const addLog = (level: LogEntry['level'], message: string, nodeId?: string, data?: any) => {
    const log: LogEntry = {
      id: `log_${Date.now()}_${Math.random()}`,
      timestamp: new Date(),
      level,
      message,
      nodeId,
      data
    };
    
    setLogs(prev => [...prev, log]);
    
    // 自动滚动到底部
    if (autoScroll && logsRef.current) {
      setTimeout(() => {
        logsRef.current?.scrollTo({ top: logsRef.current.scrollHeight, behavior: 'smooth' });
      }, 100);
    }
  };

  /**
   * 更新变量监控
   */
  const updateVariableWatches = (node: WorkflowNode, output: any) => {
    setVariableWatches(prev => 
      prev.map(watch => {
        try {
          // 简化的表达式求值
          const newValue = evaluateExpression(watch.expression, { node, output });
          if (JSON.stringify(newValue) !== JSON.stringify(watch.value)) {
            return {
              ...watch,
              value: newValue,
              lastChanged: new Date(),
              changeCount: watch.changeCount + 1
            };
          }
        } catch (error) {
          console.error('变量监控表达式求值失败:', error);
        }
        return watch;
      })
    );
  };

  /**
   * 简化的表达式求值
   */
  const evaluateExpression = (expression: string, context: any): any => {
    // 这里应该实现安全的表达式求值
    // 简化实现，实际应该使用安全的求值器
    try {
      return eval(`(${JSON.stringify(context)}) => ${expression}`)();
    } catch {
      return undefined;
    }
  };

  /**
   * 添加断点
   */
  const addBreakpoint = (nodeId: string, type: BreakpointType = BreakpointType.UNCONDITIONAL) => {
    const breakpoint: Breakpoint = {
      id: `bp_${Date.now()}_${nodeId}`,
      nodeId,
      type,
      enabled: true,
      hitCount: 0
    };
    
    setBreakpoints(prev => [...prev, breakpoint]);
  };

  /**
   * 移除断点
   */
  const removeBreakpoint = (breakpointId: string) => {
    setBreakpoints(prev => prev.filter(bp => bp.id !== breakpointId));
  };

  /**
   * 切换断点状态
   */
  const toggleBreakpoint = (breakpointId: string) => {
    setBreakpoints(prev => 
      prev.map(bp => 
        bp.id === breakpointId ? { ...bp, enabled: !bp.enabled } : bp
      )
    );
  };

  /**
   * 添加变量监控
   */
  const addVariableWatch = (name: string, expression: string) => {
    const watch: VariableWatch = {
      id: `watch_${Date.now()}_${name}`,
      name,
      expression,
      value: undefined,
      type: 'unknown',
      changeCount: 0
    };
    
    setVariableWatches(prev => [...prev, watch]);
  };

  /**
   * 移除变量监控
   */
  const removeVariableWatch = (watchId: string) => {
    setVariableWatches(prev => prev.filter(w => w.id !== watchId));
  };

  /**
   * 过滤日志
   */
  const filteredLogs = logs.filter(log => {
    if (filterLevel !== 'all' && log.level !== filterLevel) {
      return false;
    }
    if (searchText && !log.message.toLowerCase().includes(searchText.toLowerCase())) {
      return false;
    }
    return true;
  });

  /**
   * 获取执行统计
   */
  const getExecutionStats = () => {
    const total = executionSteps.length;
    const completed = executionSteps.filter(s => s.status === NodeExecutionStatus.COMPLETED).length;
    const errors = executionSteps.filter(s => s.status === NodeExecutionStatus.ERROR).length;
    const running = executionSteps.filter(s => s.status === NodeExecutionStatus.RUNNING).length;
    
    return { total, completed, errors, running };
  };

  const stats = getExecutionStats();

  return (
    <Drawer
      title={
        <Space>
          <BugOutlined />
          <span>工作流调试器</span>
          <Badge 
            status={executionStatus === ExecutionStatus.RUNNING ? 'processing' : 
                   executionStatus === ExecutionStatus.ERROR ? 'error' : 'default'} 
            text={executionStatus}
          />
        </Space>
      }
      width={800}
      visible={visible}
      onClose={onClose}
      extra={
        <Space>
          <Tooltip title="步进模式">
            <Switch 
              checked={stepMode} 
              onChange={setStepMode}
              checkedChildren="步进"
              unCheckedChildren="连续"
            />
          </Tooltip>
          <Button 
            type="primary" 
            icon={<PlayCircleOutlined />}
            onClick={handleStartExecution}
            disabled={executionStatus === ExecutionStatus.RUNNING}
          >
            开始
          </Button>
          {executionStatus === ExecutionStatus.RUNNING && (
            <Button 
              icon={<PauseCircleOutlined />}
              onClick={handlePauseExecution}
            >
              暂停
            </Button>
          )}
          {executionStatus === ExecutionStatus.PAUSED && (
            <Button 
              icon={<PlayCircleOutlined />}
              onClick={handleResumeExecution}
            >
              继续
            </Button>
          )}
          <Button 
            icon={<StepForwardOutlined />}
            onClick={handleStepExecution}
            disabled={executionStatus !== ExecutionStatus.PAUSED && !stepMode}
          >
            单步
          </Button>
          <Button 
            danger
            icon={<StopOutlined />}
            onClick={handleStopExecution}
            disabled={executionStatus === ExecutionStatus.IDLE}
          >
            停止
          </Button>
        </Space>
      }
    >
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* 执行统计 */}
        <Card size="small" style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={6}>
              <Statistic title="总节点" value={stats.total} />
            </Col>
            <Col span={6}>
              <Statistic title="已完成" value={stats.completed} valueStyle={{ color: '#3f8600' }} />
            </Col>
            <Col span={6}>
              <Statistic title="错误" value={stats.errors} valueStyle={{ color: '#cf1322' }} />
            </Col>
            <Col span={6}>
              <Statistic title="运行中" value={stats.running} valueStyle={{ color: '#1890ff' }} />
            </Col>
          </Row>
          {stats.total > 0 && (
            <Progress 
              percent={Math.round((stats.completed / stats.total) * 100)}
              status={stats.errors > 0 ? 'exception' : 'active'}
              style={{ marginTop: 8 }}
            />
          )}
        </Card>

        {/* 主要内容区域 */}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <Tabs activeKey={activeTab} onChange={setActiveTab} style={{ height: '100%' }}>
            <TabPane tab="执行状态" key="execution" style={{ height: '100%', overflow: 'auto' }}>
              <Timeline mode="left">
                {executionSteps.map(step => (
                  <Timeline.Item
                    key={step.id}
                    color={
                      step.status === NodeExecutionStatus.COMPLETED ? 'green' :
                      step.status === NodeExecutionStatus.ERROR ? 'red' :
                      step.status === NodeExecutionStatus.RUNNING ? 'blue' : 'gray'
                    }
                    dot={
                      step.status === NodeExecutionStatus.RUNNING ? <Spin size="small" /> :
                      step.status === NodeExecutionStatus.COMPLETED ? <CheckCircleOutlined /> :
                      step.status === NodeExecutionStatus.ERROR ? <ExclamationCircleOutlined /> :
                      <ClockCircleOutlined />
                    }
                  >
                    <Card size="small" style={{ marginBottom: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Space>
                          <Text strong>{step.nodeName}</Text>
                          <Tag color={
                            step.status === NodeExecutionStatus.COMPLETED ? 'success' :
                            step.status === NodeExecutionStatus.ERROR ? 'error' :
                            step.status === NodeExecutionStatus.RUNNING ? 'processing' : 'default'
                          }>
                            {step.status}
                          </Tag>
                        </Space>
                        <Text type="secondary">
                          {step.duration ? `${step.duration}ms` : '运行中...'}
                        </Text>
                      </div>
                      {step.error && (
                        <Alert 
                          message={step.error} 
                          type="error" 
                          size="small" 
                          style={{ marginTop: 8 }}
                        />
                      )}
                      {step.output && (
                        <Collapse size="small" style={{ marginTop: 8 }}>
                          <Panel header="输出数据" key="output">
                            <pre style={{ fontSize: 12, margin: 0 }}>
                              {JSON.stringify(step.output, null, 2)}
                            </pre>
                          </Panel>
                        </Collapse>
                      )}
                    </Card>
                  </Timeline.Item>
                ))}
              </Timeline>
              {executionSteps.length === 0 && (
                <Empty description="暂无执行记录" />
              )}
            </TabPane>

            <TabPane tab="断点管理" key="breakpoints">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Card size="small" title="添加断点">
                  <Select
                    placeholder="选择节点"
                    style={{ width: '100%' }}
                    onSelect={(nodeId: string) => addBreakpoint(nodeId)}
                  >
                    {workflow.nodes?.map(node => (
                      <Option key={node.id} value={node.id}>{node.name}</Option>
                    ))}
                  </Select>
                </Card>
                
                <Table
                  size="small"
                  dataSource={breakpoints}
                  rowKey="id"
                  columns={[
                    {
                      title: '节点',
                      dataIndex: 'nodeId',
                      render: (nodeId) => {
                        const node = workflow.nodes?.find(n => n.id === nodeId);
                        return node?.name || nodeId;
                      }
                    },
                    {
                      title: '类型',
                      dataIndex: 'type',
                      render: (type) => <Tag>{type}</Tag>
                    },
                    {
                      title: '状态',
                      dataIndex: 'enabled',
                      render: (enabled, record) => (
                        <Switch 
                          checked={enabled} 
                          onChange={() => toggleBreakpoint(record.id)}
                          size="small"
                        />
                      )
                    },
                    {
                      title: '命中次数',
                      dataIndex: 'hitCount'
                    },
                    {
                      title: '操作',
                      render: (_, record) => (
                        <Button 
                          size="small" 
                          danger 
                          onClick={() => removeBreakpoint(record.id)}
                        >
                          删除
                        </Button>
                      )
                    }
                  ]}
                />
              </Space>
            </TabPane>

            <TabPane tab="变量监控" key="variables">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Card size="small" title="添加监控">
                  <Space.Compact style={{ width: '100%' }}>
                    <Input placeholder="变量名" style={{ width: '30%' }} />
                    <Input placeholder="表达式" style={{ width: '50%' }} />
                    <Button type="primary" style={{ width: '20%' }}>添加</Button>
                  </Space.Compact>
                </Card>
                
                <Table
                  size="small"
                  dataSource={variableWatches}
                  rowKey="id"
                  columns={[
                    {
                      title: '名称',
                      dataIndex: 'name'
                    },
                    {
                      title: '表达式',
                      dataIndex: 'expression'
                    },
                    {
                      title: '值',
                      dataIndex: 'value',
                      render: (value) => (
                        <Text code style={{ fontSize: 12 }}>
                          {JSON.stringify(value)}
                        </Text>
                      )
                    },
                    {
                      title: '变更次数',
                      dataIndex: 'changeCount'
                    },
                    {
                      title: '操作',
                      render: (_, record) => (
                        <Button 
                          size="small" 
                          danger 
                          onClick={() => removeVariableWatch(record.id)}
                        >
                          删除
                        </Button>
                      )
                    }
                  ]}
                />
              </Space>
            </TabPane>

            <TabPane tab="执行日志" key="logs">
              <Space direction="vertical" style={{ width: '100%', height: '100%' }}>
                <Card size="small">
                  <Space>
                    <Select
                      value={filterLevel}
                      onChange={setFilterLevel}
                      style={{ width: 120 }}
                    >
                      <Option value="all">全部级别</Option>
                      <Option value="debug">调试</Option>
                      <Option value="info">信息</Option>
                      <Option value="warn">警告</Option>
                      <Option value="error">错误</Option>
                    </Select>
                    <Input
                      placeholder="搜索日志"
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      prefix={<SearchOutlined />}
                      style={{ width: 200 }}
                    />
                    <Switch
                      checked={autoScroll}
                      onChange={setAutoScroll}
                      checkedChildren="自动滚动"
                      unCheckedChildren="手动滚动"
                    />
                  </Space>
                </Card>
                
                <div 
                  ref={logsRef}
                  style={{ 
                    flex: 1, 
                    overflow: 'auto', 
                    border: '1px solid #d9d9d9', 
                    borderRadius: 6,
                    padding: 8,
                    backgroundColor: '#fafafa'
                  }}
                >
                  <List
                    size="small"
                    dataSource={filteredLogs}
                    renderItem={(log) => (
                      <List.Item style={{ padding: '4px 0', borderBottom: '1px solid #f0f0f0' }}>
                        <List.Item.Meta
                          avatar={
                            <Avatar 
                              size="small" 
                              style={{
                                backgroundColor: 
                                  log.level === 'error' ? '#ff4d4f' :
                                  log.level === 'warn' ? '#faad14' :
                                  log.level === 'info' ? '#1890ff' : '#52c41a'
                              }}
                            >
                              {log.level.charAt(0).toUpperCase()}
                            </Avatar>
                          }
                          title={
                            <Space>
                              <Text style={{ fontSize: 12 }}>
                                {log.timestamp.toLocaleTimeString()}
                              </Text>
                              <Text>{log.message}</Text>
                              {log.nodeId && (
                                <Tag size="small">{log.nodeId}</Tag>
                              )}
                            </Space>
                          }
                          description={
                            log.data && (
                              <pre style={{ fontSize: 10, margin: 0, color: '#666' }}>
                                {JSON.stringify(log.data, null, 2)}
                              </pre>
                            )
                          }
                        />
                      </List.Item>
                    )}
                  />
                  {filteredLogs.length === 0 && (
                    <Empty description="暂无日志" />
                  )}
                </div>
              </Space>
            </TabPane>
          </Tabs>
        </div>
      </div>
    </Drawer>
  );
};

export default WorkflowDebugger;