/**
 * 可视化能力编排器组件
 * 提供拖拽式的能力组合、流程设计和执行策略配置
 * 基于ReactFlow实现节点和连线的可视化编辑
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Card, Button, Space, Drawer, Modal, Form, Input, Select, Switch,
  Tabs, Divider, Typography, Alert, Tooltip, Badge, Tag, Progress,
  Row, Col, Statistic, Timeline, Tree, Collapse, Radio, Slider,
  InputNumber, Checkbox, Upload, message, Popover, Dropdown, Menu
} from 'antd';
import {
  PlusOutlined, DeleteOutlined, EditOutlined, CopyOutlined,
  PlayCircleOutlined, PauseCircleOutlined, StopOutlined,
  SettingOutlined, SaveOutlined, UndoOutlined, RedoOutlined,
  ZoomInOutlined, ZoomOutOutlined, FullscreenOutlined,
  CompressOutlined, BranchesOutlined, NodeIndexOutlined,
  ThunderboltOutlined, ClockCircleOutlined, CheckCircleOutlined,
  ExclamationCircleOutlined, InfoCircleOutlined, WarningOutlined,
  ApartmentOutlined, ShareAltOutlined, DownloadOutlined,
  UploadOutlined, EyeOutlined, BulbOutlined, RobotOutlined,
  ApiOutlined, DatabaseOutlined, CloudOutlined, SecurityScanOutlined
} from '@ant-design/icons';
import ReactFlow, {
  Node, Edge, Connection, useNodesState, useEdgesState,
  addEdge, Background, Controls, MiniMap, Panel,
  MarkerType, Position, NodeTypes, EdgeTypes,
  ReactFlowProvider, useReactFlow, ReactFlowInstance
} from 'reactflow';
import 'reactflow/dist/style.css';
import {
  CoreCapabilityType, CapabilityMaturityLevel, CoreCapabilityModule
} from './CapabilitySystemTypes';
import { ExecutionStrategy } from './WorkflowExecutionEngine';
import './VisualCapabilityOrchestrator.css';

const { Option } = Select;
const { TabPane } = Tabs;
const { Panel: CollapsePanel } = Collapse;
const { Text, Title, Paragraph } = Typography;
const { TextArea } = Input;

// 本地类型定义
interface CapabilityModuleConfig {
  [key: string]: any;
}

interface ExecutionStrategyConfig {
  type: ExecutionStrategy;
  maxConcurrency?: number;
  timeout?: number;
}

interface OptimizationConfig {
  enabled: boolean;
  caching?: boolean;
  prefetching?: boolean;
}

interface AutoScalingConfig {
  enabled: boolean;
  minInstances?: number;
  maxInstances?: number;
}

// 节点类型定义
interface CapabilityNode extends Node {
  data: {
    capability: CoreCapabilityModule;
    config: CapabilityModuleConfig;
    status: 'idle' | 'running' | 'success' | 'error' | 'warning';
    metrics: {
      executionTime: number;
      successRate: number;
      errorCount: number;
      lastExecution: Date;
    };
    position: {
      x: number;
      y: number;
    };
  };
}

// 连线类型定义
interface CapabilityEdge extends Edge {
  data: {
    condition?: string;
    weight: number;
    latency: number;
    throughput: number;
    errorRate: number;
  };
}

// 执行状态
type ExecutionStatus = 'idle' | 'running' | 'paused' | 'completed' | 'error';

// 编排器配置
interface OrchestratorConfig {
  strategy: ExecutionStrategyConfig;
  optimization: OptimizationConfig;
  autoScaling: AutoScalingConfig;
  monitoring: {
    enabled: boolean;
    metricsCollection: boolean;
    alerting: boolean;
    logging: boolean;
  };
  security: {
    authentication: boolean;
    authorization: boolean;
    encryption: boolean;
    auditLog: boolean;
  };
}

interface CapabilityOrchestrationConfig {
  strategy: ExecutionStrategyConfig;
  optimization: OptimizationConfig;
  autoScaling: AutoScalingConfig;
  [key: string]: any;
}

interface VisualCapabilityOrchestratorProps {
  visible: boolean;
  onClose: () => void;
  capabilities: CoreCapabilityModule[];
  orchestrationConfig: CapabilityOrchestrationConfig;
  onConfigChange: (config: CapabilityOrchestrationConfig) => void;
  onSave: () => void;
  mode?: 'design' | 'execute' | 'monitor';
}

// 自定义节点组件
const CapabilityNodeComponent: React.FC<{ data: CapabilityNode['data'] }> = ({ data }) => {
  const getStatusColor = (status: string) => {
    const colorMap = {
      idle: '#8c8c8c',
      running: '#1890ff',
      success: '#52c41a',
      error: '#ff4d4f',
      warning: '#fa8c16'
    };
    return colorMap[status as keyof typeof colorMap] || '#8c8c8c';
  };
  
  const getCapabilityIcon = (type: CoreCapabilityType) => {
    const iconMap = {
      [CoreCapabilityType.COGNITIVE]: <BulbOutlined />,
      [CoreCapabilityType.REASONING]: <ThunderboltOutlined />,
      [CoreCapabilityType.DECISION]: <ApartmentOutlined />,
      [CoreCapabilityType.LEARNING]: <RobotOutlined />
    };
    return iconMap[type] || <SettingOutlined />;
  };
  
  return (
    <div className={`capability-node ${data.status}`}>
      <div className="node-header">
        <div className="node-icon" style={{ color: getStatusColor(data.status) }}>
          {getCapabilityIcon(data.capability.type)}
        </div>
        <div className="node-title">
          <Text strong>{data.capability?.name || '未知能力'}</Text>
          <Text type="secondary" style={{ fontSize: 11 }}>v{data.capability.version}</Text>
        </div>
        <div className="node-status">
          <Badge 
            status={data.status === 'success' ? 'success' : 
                   data.status === 'error' ? 'error' : 
                   data.status === 'running' ? 'processing' : 'default'}
          />
        </div>
      </div>
      
      <div className="node-content">
        <div className="node-metrics">
          <div className="metric-item">
            <ClockCircleOutlined style={{ fontSize: 10 }} />
            <span>{data.metrics.executionTime}ms</span>
          </div>
          <div className="metric-item">
            <CheckCircleOutlined style={{ fontSize: 10 }} />
            <span>{(data.metrics.successRate * 100).toFixed(1)}%</span>
          </div>
        </div>
        
        <div className="node-tags">
          <Tag size="small" color={data.capability.type === CoreCapabilityType.COGNITIVE ? 'blue' : 
                                   data.capability.type === CoreCapabilityType.REASONING ? 'green' :
                                   data.capability.type === CoreCapabilityType.DECISION ? 'orange' : 'purple'}>
            {data.capability.type}
          </Tag>
        </div>
      </div>
      
      {/* 连接点 */}
      <div className="node-handles">
        <div className="handle handle-input" />
        <div className="handle handle-output" />
      </div>
    </div>
  );
};

// 自定义边组件
const CapabilityEdgeComponent: React.FC<any> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data
}) => {
  const edgePath = `M${sourceX},${sourceY} C${sourceX + 50},${sourceY} ${targetX - 50},${targetY} ${targetX},${targetY}`;
  
  return (
    <>
      <path
        id={id}
        style={{
          stroke: data?.errorRate > 0.1 ? '#ff4d4f' : 
                 data?.latency > 1000 ? '#fa8c16' : '#52c41a',
          strokeWidth: Math.max(1, (data?.weight || 1) * 2),
          fill: 'none'
        }}
        className="react-flow__edge-path"
        d={edgePath}
        markerEnd={MarkerType.ArrowClosed}
      />
      {data && (
        <text>
          <textPath href={`#${id}`} style={{ fontSize: 10, fill: '#666' }} startOffset="50%" textAnchor="middle">
            {data.latency}ms
          </textPath>
        </text>
      )}
    </>
  );
};

// 节点类型映射
const nodeTypes: NodeTypes = {
  capability: CapabilityNodeComponent
};

// 边类型映射
const edgeTypes: EdgeTypes = {
  capability: CapabilityEdgeComponent
};

const VisualCapabilityOrchestrator: React.FC<VisualCapabilityOrchestratorProps> = ({
  visible,
  onClose,
  capabilities,
  orchestrationConfig,
  onConfigChange,
  onSave,
  mode = 'design'
}) => {
  // ReactFlow状态
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  
  // UI状态
  const [selectedNode, setSelectedNode] = useState<CapabilityNode | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<CapabilityEdge | null>(null);
  const [configDrawerVisible, setConfigDrawerVisible] = useState(false);
  const [executionStatus, setExecutionStatus] = useState<ExecutionStatus>('idle');
  const [executionProgress, setExecutionProgress] = useState(0);
  const [executionLogs, setExecutionLogs] = useState<string[]>([]);
  
  // 编排器配置
  const [config, setConfig] = useState<OrchestratorConfig>({
    strategy: {
      type: ExecutionStrategy.SEQUENTIAL,
      maxConcurrency: 5,
      timeout: 30000
    },
    optimization: {
      enabled: true,
      caching: true,
      prefetching: false,
      loadBalancing: true,
      resourcePooling: true
    },
    autoScaling: {
      enabled: false,
      minInstances: 1,
      maxInstances: 10,
      targetCPU: 70,
      targetMemory: 80,
      scaleUpCooldown: 300,
      scaleDownCooldown: 600
    },
    monitoring: {
      enabled: true,
      metricsCollection: true,
      alerting: true,
      logging: true
    },
    security: {
      authentication: true,
      authorization: true,
      encryption: true,
      auditLog: true
    }
  });
  
  // 表单实例
  const [form] = Form.useForm();
  
  /**
   * 初始化编排器
   */
  useEffect(() => {
    if (visible) {
      initializeOrchestrator();
    }
  }, [visible, capabilities]);
  
  /**
   * 初始化编排器数据
   */
  const initializeOrchestrator = useCallback(() => {
    // 创建初始节点
    const initialNodes: CapabilityNode[] = capabilities.map((capability, index) => ({
      id: capability.id,
      type: 'capability',
      position: { x: 100 + (index % 3) * 300, y: 100 + Math.floor(index / 3) * 200 },
      data: {
        capability,
        config: capability.config,
        status: 'idle',
        metrics: {
          executionTime: 0,
          successRate: 1.0,
          errorCount: 0,
          lastExecution: new Date()
        },
        position: { x: 100 + (index % 3) * 300, y: 100 + Math.floor(index / 3) * 200 }
      }
    }));
    
    setNodes(initialNodes);
    setEdges([]);
  }, [capabilities, setNodes, setEdges]);
  
  /**
   * 处理连接创建
   */
  const onConnect = useCallback((params: Connection) => {
    const newEdge: CapabilityEdge = {
      ...params,
      id: `edge-${params.source}-${params.target}`,
      type: 'capability',
      data: {
        weight: 1.0,
        latency: 100,
        throughput: 1000,
        errorRate: 0.01
      }
    };
    
    setEdges((eds) => addEdge(newEdge, eds));
  }, [setEdges]);
  
  /**
   * 处理节点选择
   */
  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node as CapabilityNode);
    setSelectedEdge(null);
    setConfigDrawerVisible(true);
  }, []);
  
  /**
   * 处理边选择
   */
  const onEdgeClick = useCallback((event: React.MouseEvent, edge: Edge) => {
    setSelectedEdge(edge as CapabilityEdge);
    setSelectedNode(null);
    setConfigDrawerVisible(true);
  }, []);
  
  /**
   * 添加新能力节点
   */
  const addCapabilityNode = useCallback((capability: CoreCapabilityModule) => {
    const newNode: CapabilityNode = {
      id: `${capability.id}-${Date.now()}`,
      type: 'capability',
      position: { x: Math.random() * 400 + 100, y: Math.random() * 300 + 100 },
      data: {
        capability,
        config: capability.config,
        status: 'idle',
        metrics: {
          executionTime: 0,
          successRate: 1.0,
          errorCount: 0,
          lastExecution: new Date()
        },
        position: { x: Math.random() * 400 + 100, y: Math.random() * 300 + 100 }
      }
    };
    
    setNodes((nds) => [...nds, newNode]);
    message.success(`已添加能力节点：${capability?.name || '未知能力'}`);
  }, [setNodes]);
  
  /**
   * 删除选中节点
   */
  const deleteSelectedNode = useCallback(() => {
    if (selectedNode) {
      setNodes((nds) => nds.filter(node => node.id !== selectedNode.id));
      setEdges((eds) => eds.filter(edge => 
        edge.source !== selectedNode.id && edge.target !== selectedNode.id
      ));
      setSelectedNode(null);
      setConfigDrawerVisible(false);
      message.success('已删除节点');
    }
  }, [selectedNode, setNodes, setEdges]);
  
  /**
   * 删除选中边
   */
  const deleteSelectedEdge = useCallback(() => {
    if (selectedEdge) {
      setEdges((eds) => eds.filter(edge => edge.id !== selectedEdge.id));
      setSelectedEdge(null);
      setConfigDrawerVisible(false);
      message.success('已删除连接');
    }
  }, [selectedEdge, setEdges]);
  
  /**
   * 执行编排流程
   */
  const executeOrchestration = useCallback(async () => {
    if (nodes.length === 0) {
      message.warning('请先添加能力节点');
      return;
    }
    
    setExecutionStatus('running');
    setExecutionProgress(0);
    setExecutionLogs(['开始执行编排流程...']);
    
    try {
      // 模拟执行过程
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        
        // 更新节点状态
        setNodes((nds) => nds.map(n => 
          n.id === node.id 
            ? { ...n, data: { ...n.data, status: 'running' } }
            : n
        ));
        
        setExecutionLogs(prev => [...prev, `执行节点：${node.data.capability?.name || '未知能力'}`]);
        
        // 模拟执行时间
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // 更新进度
        setExecutionProgress(((i + 1) / nodes.length) * 100);
        
        // 更新节点状态为成功
        setNodes((nds) => nds.map(n => 
          n.id === node.id 
            ? { 
                ...n, 
                data: { 
                  ...n.data, 
                  status: 'success',
                  metrics: {
                    ...n.data.metrics,
                    executionTime: Math.random() * 500 + 100,
                    lastExecution: new Date()
                  }
                }
              }
            : n
        ));
        
        setExecutionLogs(prev => [...prev, `节点 ${node.data.capability?.name || '未知能力'} 执行完成`]);
      }
      
      setExecutionStatus('completed');
      setExecutionLogs(prev => [...prev, '编排流程执行完成']);
      message.success('编排流程执行完成');
      
    } catch (error) {
      setExecutionStatus('error');
      setExecutionLogs(prev => [...prev, `执行失败：${error}`]);
      message.error('编排流程执行失败');
    }
  }, [nodes, setNodes]);
  
  /**
   * 停止执行
   */
  const stopExecution = useCallback(() => {
    setExecutionStatus('idle');
    setExecutionProgress(0);
    setExecutionLogs(prev => [...prev, '执行已停止']);
    
    // 重置所有节点状态
    setNodes((nds) => nds.map(node => ({
      ...node,
      data: { ...node.data, status: 'idle' }
    })));
    
    message.info('已停止执行');
  }, [setNodes]);
  
  /**
   * 保存编排配置
   */
  const saveOrchestration = useCallback(() => {
    const orchestrationData = {
      nodes: nodes.map(node => ({
        id: node.id,
        capability: node.data.capability,
        config: node.data.config,
        position: node.position
      })),
      edges: edges.map(edge => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        data: edge.data
      })),
      config
    };
    
    // 更新编排配置
    const updatedConfig: CapabilityOrchestrationConfig = {
      ...orchestrationConfig,
      strategy: config.strategy,
      optimization: config.optimization,
      autoScaling: config.autoScaling
    };
    
    onConfigChange(updatedConfig);
    onSave();
    
    message.success('编排配置已保存');
  }, [nodes, edges, config, orchestrationConfig, onConfigChange, onSave]);
  
  /**
   * 渲染工具栏
   */
  const renderToolbar = () => {
    return (
      <div className="orchestrator-toolbar">
        <div className="toolbar-section">
          <Space>
            <Button 
              type="primary" 
              icon={<PlayCircleOutlined />}
              onClick={executeOrchestration}
              disabled={executionStatus === 'running' || nodes.length === 0}
            >
              执行
            </Button>
            <Button 
              icon={<StopOutlined />}
              onClick={stopExecution}
              disabled={executionStatus === 'idle'}
            >
              停止
            </Button>
            <Divider type="vertical" />
            <Button icon={<SaveOutlined />} onClick={saveOrchestration}>
              保存
            </Button>
            <Button icon={<UndoOutlined />} disabled>
              撤销
            </Button>
            <Button icon={<RedoOutlined />} disabled>
              重做
            </Button>
          </Space>
        </div>
        
        <div className="toolbar-section">
          <Space>
            <Text type="secondary">执行状态：</Text>
            <Badge 
              status={executionStatus === 'running' ? 'processing' :
                     executionStatus === 'completed' ? 'success' :
                     executionStatus === 'error' ? 'error' : 'default'}
              text={executionStatus === 'idle' ? '空闲' :
                   executionStatus === 'running' ? '运行中' :
                   executionStatus === 'completed' ? '已完成' :
                   executionStatus === 'error' ? '错误' : '暂停'}
            />
            {executionStatus === 'running' && (
              <Progress 
                percent={executionProgress} 
                size="small" 
                style={{ width: 100 }}
              />
            )}
          </Space>
        </div>
        
        <div className="toolbar-section">
          <Space>
            <Text type="secondary">节点：{nodes.length}</Text>
            <Text type="secondary">连接：{edges.length}</Text>
            <Dropdown
              overlay={
                <Menu>
                  {capabilities.map(capability => (
                    <Menu.Item 
                      key={capability.id}
                      onClick={() => addCapabilityNode(capability)}
                    >
                      {capability?.name || '未知能力'}
                    </Menu.Item>
                  ))}
                </Menu>
              }
            >
              <Button icon={<PlusOutlined />}>
                添加节点
              </Button>
            </Dropdown>
          </Space>
        </div>
      </div>
    );
  };
  
  /**
   * 渲染配置抽屉
   */
  const renderConfigDrawer = () => {
    return (
      <Drawer
        title={selectedNode ? '节点配置' : selectedEdge ? '连接配置' : '编排配置'}
        placement="right"
        width={400}
        open={configDrawerVisible}
        onClose={() => setConfigDrawerVisible(false)}
        extra={
          <Space>
            {selectedNode && (
              <Button 
                danger 
                icon={<DeleteOutlined />}
                onClick={deleteSelectedNode}
              >
                删除节点
              </Button>
            )}
            {selectedEdge && (
              <Button 
                danger 
                icon={<DeleteOutlined />}
                onClick={deleteSelectedEdge}
              >
                删除连接
              </Button>
            )}
          </Space>
        }
      >
        <div className="config-content">
          {selectedNode && (
            <Tabs defaultActiveKey="basic">
              <TabPane tab="基本信息" key="basic">
                <div className="node-info">
                  <div className="info-item">
                    <Text strong>能力名称：</Text>
                    <Text>{selectedNode.data.capability?.name || '未知能力'}</Text>
                  </div>
                  <div className="info-item">
                    <Text strong>类型：</Text>
                    <Tag color="blue">{selectedNode.data.capability.type}</Tag>
                  </div>
                  <div className="info-item">
                    <Text strong>版本：</Text>
                    <Text>{selectedNode.data.capability.version}</Text>
                  </div>
                  <div className="info-item">
                    <Text strong>状态：</Text>
                    <Badge 
                      status={selectedNode.data.status === 'success' ? 'success' :
                             selectedNode.data.status === 'error' ? 'error' :
                             selectedNode.data.status === 'running' ? 'processing' : 'default'}
                      text={selectedNode.data.status}
                    />
                  </div>
                  <Divider />
                  <Paragraph>{selectedNode.data.capability.description}</Paragraph>
                </div>
              </TabPane>
              
              <TabPane tab="执行配置" key="config">
                <Form layout="vertical">
                  <Form.Item label="超时时间（秒）">
                    <InputNumber min={1} max={3600} defaultValue={30} style={{ width: '100%' }} />
                  </Form.Item>
                  <Form.Item label="重试次数">
                    <InputNumber min={0} max={10} defaultValue={3} style={{ width: '100%' }} />
                  </Form.Item>
                  <Form.Item label="并发限制">
                    <InputNumber min={1} max={100} defaultValue={10} style={{ width: '100%' }} />
                  </Form.Item>
                  <Form.Item label="缓存策略">
                    <Select defaultValue="auto" style={{ width: '100%' }}>
                      <Option value="none">不缓存</Option>
                      <Option value="auto">自动</Option>
                      <Option value="always">总是缓存</Option>
                    </Select>
                  </Form.Item>
                  <Form.Item>
                    <Checkbox defaultChecked>启用监控</Checkbox>
                  </Form.Item>
                  <Form.Item>
                    <Checkbox>启用日志</Checkbox>
                  </Form.Item>
                </Form>
              </TabPane>
              
              <TabPane tab="性能指标" key="metrics">
                <div className="metrics-content">
                  <Row gutter={[16, 16]}>
                    <Col span={12}>
                      <Statistic 
                        title="执行时间" 
                        value={selectedNode.data.metrics.executionTime} 
                        suffix="ms"
                        prefix={<ClockCircleOutlined />}
                      />
                    </Col>
                    <Col span={12}>
                      <Statistic 
                        title="成功率" 
                        value={selectedNode.data.metrics.successRate * 100} 
                        suffix="%"
                        precision={1}
                        prefix={<CheckCircleOutlined />}
                      />
                    </Col>
                    <Col span={12}>
                      <Statistic 
                        title="错误次数" 
                        value={selectedNode.data.metrics.errorCount}
                        prefix={<ExclamationCircleOutlined />}
                      />
                    </Col>
                    <Col span={12}>
                      <Statistic 
                        title="最后执行" 
                        value={selectedNode.data.metrics.lastExecution.toLocaleTimeString()}
                        prefix={<InfoCircleOutlined />}
                      />
                    </Col>
                  </Row>
                </div>
              </TabPane>
            </Tabs>
          )}
          
          {selectedEdge && (
            <Tabs defaultActiveKey="basic">
              <TabPane tab="连接信息" key="basic">
                <Form layout="vertical">
                  <Form.Item label="权重">
                    <Slider 
                      min={0.1} 
                      max={2.0} 
                      step={0.1}
                      defaultValue={selectedEdge.data?.weight || 1.0}
                      marks={{ 0.1: '0.1', 1.0: '1.0', 2.0: '2.0' }}
                    />
                  </Form.Item>
                  <Form.Item label="条件表达式">
                    <TextArea 
                      rows={3}
                      placeholder="输入执行条件（可选）"
                      defaultValue={selectedEdge.data?.condition}
                    />
                  </Form.Item>
                  <Form.Item label="超时时间（毫秒）">
                    <InputNumber 
                      min={100} 
                      max={10000} 
                      defaultValue={selectedEdge.data?.latency || 1000}
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                </Form>
              </TabPane>
              
              <TabPane tab="性能指标" key="metrics">
                <div className="edge-metrics">
                  <Row gutter={[16, 16]}>
                    <Col span={12}>
                      <Statistic 
                        title="延迟" 
                        value={selectedEdge.data?.latency || 0} 
                        suffix="ms"
                      />
                    </Col>
                    <Col span={12}>
                      <Statistic 
                        title="吞吐量" 
                        value={selectedEdge.data?.throughput || 0} 
                        suffix="/s"
                      />
                    </Col>
                    <Col span={24}>
                      <div className="metric-item">
                        <Text>错误率：</Text>
                        <Progress 
                          percent={(selectedEdge.data?.errorRate || 0) * 100}
                          size="small"
                          status={selectedEdge.data?.errorRate > 0.1 ? 'exception' : 'success'}
                        />
                      </div>
                    </Col>
                  </Row>
                </div>
              </TabPane>
            </Tabs>
          )}
        </div>
      </Drawer>
    );
  };
  
  /**
   * 渲染执行日志面板
   */
  const renderExecutionPanel = () => {
    return (
      <Panel position="bottom-right" className="execution-panel">
        <Card 
          size="small" 
          title="执行日志" 
          style={{ width: 300, maxHeight: 200 }}
          bodyStyle={{ padding: 8, maxHeight: 150, overflow: 'auto' }}
        >
          <div className="execution-logs">
            {executionLogs.map((log, index) => (
              <div key={index} className="log-item">
                <Text style={{ fontSize: 11 }}>
                  [{new Date().toLocaleTimeString()}] {log}
                </Text>
              </div>
            ))}
          </div>
        </Card>
      </Panel>
    );
  };
  
  return (
    <Modal
      title="可视化能力编排器"
      open={visible}
      onCancel={onClose}
      width="90vw"
      style={{ top: 20 }}
      footer={[
        <Button key="close" onClick={onClose}>
          关闭
        </Button>,
        <Button key="save" type="primary" onClick={saveOrchestration}>
          保存配置
        </Button>
      ]}
      className="visual-capability-orchestrator"
    >
      <div className="orchestrator-container">
        {renderToolbar()}
        
        <div className="orchestrator-canvas">
          <ReactFlowProvider>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={onNodeClick}
              onEdgeClick={onEdgeClick}
              onInit={setReactFlowInstance}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              fitView
              attributionPosition="bottom-left"
            >
              <Background color="#f0f0f0" gap={20} />
              <Controls />
              <MiniMap 
                nodeColor={(node) => {
                  const status = (node as CapabilityNode).data.status;
                  return status === 'success' ? '#52c41a' :
                         status === 'error' ? '#ff4d4f' :
                         status === 'running' ? '#1890ff' : '#8c8c8c';
                }}
                maskColor="rgba(255, 255, 255, 0.8)"
              />
              
              {mode === 'execute' && renderExecutionPanel()}
            </ReactFlow>
          </ReactFlowProvider>
        </div>
        
        {renderConfigDrawer()}
      </div>
    </Modal>
  );
};

export default VisualCapabilityOrchestrator;