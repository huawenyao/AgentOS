/**
 * EFIAgent 2.0 工作流设计器
 * 基于能力系统模型的智能工作流设计平台
 * 支持可视化拖拽、能力编排、流程优化等功能
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Card, Button, Space, Input, Select, Modal, Form, message, Tooltip,
  Drawer, Tabs, List, Divider, Alert, Switch, Slider, Progress,
  Row, Col, Statistic, Badge, Tag, Timeline, Collapse, Tree,
  Upload, Dropdown, Menu, Popconfirm, Rate, DatePicker, AutoComplete,
  InputNumber
} from 'antd';
import {
  PlusOutlined, DeleteOutlined, EditOutlined, CopyOutlined, SaveOutlined,
  PlayCircleOutlined, PauseCircleOutlined, StopOutlined, ReloadOutlined,
  SettingOutlined, EyeOutlined, ShareAltOutlined, DownloadOutlined,
  UploadOutlined, BranchesOutlined, NodeIndexOutlined, ApartmentOutlined,
  ThunderboltOutlined, BulbOutlined, BookOutlined,
  ApiOutlined, DatabaseOutlined, CloudOutlined, MonitorOutlined,
  ExperimentOutlined, RocketOutlined, SecurityScanOutlined,
  InteractionOutlined, FunctionOutlined, CodeOutlined, BugOutlined,
  CheckCircleOutlined, CloseCircleOutlined, ExclamationCircleOutlined,
  InfoCircleOutlined, QuestionCircleOutlined, ZoomInOutlined,
  ZoomOutOutlined, FullscreenOutlined, CompressOutlined,
  UndoOutlined, RedoOutlined, ScissorOutlined, ClearOutlined,
  AlignLeftOutlined, AlignCenterOutlined, AlignRightOutlined,
  VerticalAlignTopOutlined, VerticalAlignMiddleOutlined, VerticalAlignBottomOutlined
} from '@ant-design/icons';
import {
  CoreCapabilityModule, CoreCapabilityType, CapabilityOrchestrationMode,
  Agent2_0, WorkflowNode, WorkflowEdge, WorkflowExecution, WorkflowDefinition,
  WorkflowVariable, WorkflowTrigger, WorkflowMetadata
} from './CapabilitySystemTypes';
import { useWorkflowState, useWorkflowOperations } from './WorkflowStateManager';
import WorkflowVisualDesigner from './WorkflowVisualDesigner';
import WorkflowManagerV2 from './WorkflowManagerV2';
import { WorkflowEngine } from './WorkflowEngine';
import { generateMockCapabilities, generateMockAgents } from '../data/mockData';
import './WorkflowDesigner2_0.css';

const { Search } = Input;
const { Option } = Select;
const { TabPane } = Tabs;
const { Panel } = Collapse;
const { TextArea } = Input;

interface WorkflowDesigner2_0Props {
  agentId?: string;
  initialWorkflow?: WorkflowDefinition;
  onSave?: (workflow: WorkflowDefinition) => void;
  mode?: 'design' | 'view' | 'debug';
}

interface WorkflowVisualDesignerProps {
  workflow: WorkflowDefinition;
  capabilities: CoreCapabilityModule[];
  onWorkflowChange: (workflow: WorkflowDefinition) => void;
  onNodeSelect: (node: WorkflowNode | null) => void;
  mode: 'design' | 'view' | 'debug';
}



interface CanvasState {
  zoom: number;
  pan: { x: number; y: number };
  selection: string[];
  clipboard: WorkflowNode[];
}

const WorkflowDesigner2_0: React.FC<WorkflowDesigner2_0Props> = ({
  agentId,
  initialWorkflow,
  onSave,
  mode = 'design'
}) => {
  const [form] = Form.useForm();
  const canvasRef = useRef<HTMLDivElement>(null);
  
  // 状态管理
  const { state } = useWorkflowState();
  const operations = useWorkflowOperations();
  const [workflowEngine] = useState(() => new WorkflowEngine());
  const [designMode, setDesignMode] = useState<'visual' | 'manager'>('visual');
  
  // 核心状态
  const [workflow, setWorkflow] = useState<WorkflowDefinition>({
    id: initialWorkflow?.id || `workflow_${Date.now()}`,
    name: initialWorkflow?.name || '新工作流',
    description: initialWorkflow?.description || '',
    version: initialWorkflow?.version || '1.0.0',
    nodes: initialWorkflow?.nodes || [],
    edges: initialWorkflow?.edges || [],
    variables: initialWorkflow?.variables || [],
    triggers: initialWorkflow?.triggers || [],
    metadata: initialWorkflow?.metadata || {
      author: 'Current User',
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: [],
      category: 'general',
      complexity: 'simple',
      estimatedDuration: 0
    }
  });
  
  const [capabilities, setCapabilities] = useState<CoreCapabilityModule[]>(() => generateMockCapabilities());
  const [availableAgents] = useState<Agent2_0[]>(() => generateMockAgents());
  const [canvasState, setCanvasState] = useState<CanvasState>({
    zoom: 1,
    pan: { x: 0, y: 0 },
    selection: [],
    clipboard: []
  });
  
  // UI状态
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null);
  const [propertyDrawerVisible, setPropertyDrawerVisible] = useState(false);
  const [capabilityLibraryVisible, setCapabilityLibraryVisible] = useState(false);
  const [executionDrawerVisible, setExecutionDrawerVisible] = useState(false);
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  
  // 执行状态
  const [execution, setExecution] = useState<WorkflowExecution | null>(null);
  const [executionHistory, setExecutionHistory] = useState<WorkflowExecution[]>([]);
  
  /**
   * 执行工作流
   */
  const executeWorkflow = async () => {
    setExecuting(true);
    try {
      // 验证工作流
      const validation = validateWorkflow(workflow);
      if (!validation.valid) {
        message.error(`无法执行工作流: ${validation.errors.join(', ')}`);
        return;
      }
      
      // 创建执行实例
      const newExecution: WorkflowExecution = {
        id: `exec_${Date.now()}`,
        workflowId: workflow.id,
        status: 'running',
        startTime: new Date(),
        endTime: undefined,
        progress: 0,
        currentNode: undefined,
        nodeExecutions: [],
        metrics: {
          totalDuration: 0,
          nodeCount: workflow.nodes.length,
          successCount: 0,
          failureCount: 0,
          averageNodeDuration: 0,
          throughput: 0
        }
      };
      
      setExecution(newExecution);
      setExecutionDrawerVisible(true);
      
      // TODO: 实际执行工作流
      // 这里模拟执行过程
      await simulateExecution(newExecution);
      
    } catch (error) {
      message.error('工作流执行失败');
      console.error('Execute workflow error:', error);
    } finally {
      setExecuting(false);
    }
  };
  
  /**
   * 模拟工作流执行
   */
  const simulateExecution = async (execution: WorkflowExecution) => {
    const totalNodes = workflow.nodes.length;
    let completedNodes = 0;
    
    for (const node of workflow.nodes) {
      // 更新当前执行节点
      setExecution((prev: any) => prev ? {
        ...prev,
        currentNode: node.id,
        progress: (completedNodes / totalNodes) * 100
      } : null);
      
      // 模拟节点执行时间
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
      
      // 更新节点状态
      updateNode(node.id, { status: 'completed' });
      
      completedNodes++;
    }
    
    // 完成执行
    setExecution((prev: any) => prev ? {
      ...prev,
      status: 'completed',
      endTime: new Date(),
      progress: 100,
      currentNode: null
    } : null);
    
    message.success('工作流执行完成');
  };

  /**
   * 渲染工作流连接线
   */
  const renderWorkflowEdge = (edge: WorkflowEdge) => {
    const sourceNode = workflow.nodes.find(n => n.id === edge.sourceNodeId);
    const targetNode = workflow.nodes.find(n => n.id === edge.targetNodeId);
    
    if (!sourceNode || !targetNode) return null;
    
    const sourceX = sourceNode.position.x + sourceNode.size.width;
    const sourceY = sourceNode.position.y + sourceNode.size.height / 2;
    const targetX = targetNode.position.x;
    const targetY = targetNode.position.y + targetNode.size.height / 2;
    
    const path = `M ${sourceX} ${sourceY} L ${targetX} ${targetY}`;
    
    return (
      <g key={edge.id} className={`workflow-edge ${edge.status}`}>
        <path
          d={path}
          stroke="#1890ff"
          strokeWidth="2"
          fill="none"
          markerEnd="url(#arrowhead)"
        />
        <circle
          cx={(sourceX + targetX) / 2}
          cy={(sourceY + targetY) / 2}
          r="8"
          fill="white"
          stroke="#1890ff"
          strokeWidth="2"
          className="edge-control"
          onClick={() => deleteEdge(edge.id)}
        />
        <text
          x={(sourceX + targetX) / 2}
          y={(sourceY + targetY) / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="12"
          fill="#1890ff"
          className="edge-control-text"
        >
          ×
        </text>
      </g>
    );
  };
  
  /**
   * 渲染工具栏
   */
  const renderToolbar = () => {
    return (
      <div className="workflow-toolbar">
        <Space>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={saveWorkflow}
            loading={saving}
            disabled={mode === 'view'}
          >
            保存
          </Button>
          
          <Button
            icon={<PlayCircleOutlined />}
            onClick={executeWorkflow}
            loading={executing}
            disabled={workflow.nodes.length === 0}
          >
            执行
          </Button>
          
          <Divider type="vertical" />
          
          <Button
            icon={<PlusOutlined />}
            onClick={() => setCapabilityLibraryVisible(true)}
            disabled={mode === 'view'}
          >
            添加能力
          </Button>
          
          <Button
            icon={<SettingOutlined />}
            onClick={() => setSettingsModalVisible(true)}
          >
            设置
          </Button>
          
          <Divider type="vertical" />
          
          <Button
            icon={<ZoomInOutlined />}
            onClick={() => setCanvasState(prev => ({ ...prev, zoom: Math.min(prev.zoom * 1.2, 3) }))}
          />
          
          <span style={{ margin: '0 8px' }}>{Math.round(canvasState.zoom * 100)}%</span>
          
          <Button
            icon={<ZoomOutOutlined />}
            onClick={() => setCanvasState(prev => ({ ...prev, zoom: Math.max(prev.zoom / 1.2, 0.2) }))}
          />
          
          <Button
            icon={<FullscreenOutlined />}
            onClick={() => setCanvasState(prev => ({ ...prev, zoom: 1, pan: { x: 0, y: 0 } }))}
          >
            重置视图
          </Button>
          
          <Divider type="vertical" />
          
          <Button
            icon={<MonitorOutlined />}
            onClick={() => setExecutionDrawerVisible(true)}
            disabled={!execution}
          >
            执行监控
          </Button>
        </Space>
      </div>
    );
  };
  
  /**
   * 渲染画布
   */
  const renderCanvas = () => {
    return (
      <div 
        ref={canvasRef}
        className="workflow-canvas"
        style={{
          transform: `scale(${canvasState.zoom}) translate(${canvasState.pan.x}px, ${canvasState.pan.y}px)`
        }}
      >
        <svg className="workflow-svg">
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon
                points="0 0, 10 3.5, 0 7"
                fill="#1890ff"
              />
            </marker>
          </defs>
          
          {workflow.edges.map(edge => renderWorkflowEdge(edge))}
        </svg>
        
        <div className="workflow-nodes">
          {workflow.nodes.map(node => renderWorkflowNode(node))}
        </div>
        
        {workflow.nodes.length === 0 && (
          <div className="canvas-empty">
            <div className="empty-content">
              <BranchesOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />
              <h3>开始设计您的工作流</h3>
              <p>从能力库中拖拽能力模块到画布上</p>
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={() => setCapabilityLibraryVisible(true)}
              >
                添加第一个能力
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  };
  
  /**
   * 渲染能力库抽屉
   */
  const renderCapabilityLibrary = () => {
    return (
      <Drawer
        title="能力库"
        placement="left"
        width={400}
        open={capabilityLibraryVisible}
        onClose={() => setCapabilityLibraryVisible(false)}
      >
        <div className="capability-library">
          <Search
            placeholder="搜索能力"
            style={{ marginBottom: 16 }}
          />
          
          <Collapse defaultActiveKey={['cognitive', 'reasoning', 'decision', 'learning']}>
            <Panel header="认知能力" key="cognitive">
              <List
                size="small"
                dataSource={capabilities.filter(c => c.type === CoreCapabilityType.COGNITIVE)}
                renderItem={(capability) => (
                  <List.Item
                    className="capability-item"
                    onClick={() => {
                      const position = {
                        x: 100 + Math.random() * 200,
                        y: 100 + Math.random() * 200
                      };
                      createNode(capability, position);
                      setCapabilityLibraryVisible(false);
                    }}
                  >
                    <List.Item.Meta
                      avatar={renderCapabilityTypeIcon(capability.type)}
                      title={capability?.name || '未知能力'}
                      description={capability.description}
                    />
                    <Tag color="blue">{capability.maturityLevel}</Tag>
                  </List.Item>
                )}
              />
            </Panel>
            
            <Panel header="推理能力" key="reasoning">
              <List
                size="small"
                dataSource={capabilities.filter(c => c.type === CoreCapabilityType.REASONING)}
                renderItem={(capability) => (
                  <List.Item
                    className="capability-item"
                    onClick={() => {
                      const position = {
                        x: 100 + Math.random() * 200,
                        y: 100 + Math.random() * 200
                      };
                      createNode(capability, position);
                      setCapabilityLibraryVisible(false);
                    }}
                  >
                    <List.Item.Meta
                      avatar={renderCapabilityTypeIcon(capability.type)}
                      title={capability?.name || '未知能力'}
                      description={capability.description}
                    />
                    <Tag color="orange">{capability.maturityLevel}</Tag>
                  </List.Item>
                )}
              />
            </Panel>
            
            <Panel header="决策能力" key="decision">
              <List
                size="small"
                dataSource={capabilities.filter(c => c.type === CoreCapabilityType.DECISION)}
                renderItem={(capability) => (
                  <List.Item
                    className="capability-item"
                    onClick={() => {
                      const position = {
                        x: 100 + Math.random() * 200,
                        y: 100 + Math.random() * 200
                      };
                      createNode(capability, position);
                      setCapabilityLibraryVisible(false);
                    }}
                  >
                    <List.Item.Meta
                      avatar={renderCapabilityTypeIcon(capability.type)}
                      title={capability?.name || '未知能力'}
                      description={capability.description}
                    />
                    <Tag color="green">{capability.maturityLevel}</Tag>
                  </List.Item>
                )}
              />
            </Panel>
            
            <Panel header="学习能力" key="learning">
              <List
                size="small"
                dataSource={capabilities.filter(c => c.type === CoreCapabilityType.LEARNING)}
                renderItem={(capability) => (
                  <List.Item
                    className="capability-item"
                    onClick={() => {
                      const position = {
                        x: 100 + Math.random() * 200,
                        y: 100 + Math.random() * 200
                      };
                      createNode(capability, position);
                      setCapabilityLibraryVisible(false);
                    }}
                  >
                    <List.Item.Meta
                      avatar={renderCapabilityTypeIcon(capability.type)}
                      title={capability?.name || '未知能力'}
                      description={capability.description}
                    />
                    <Tag color="purple">{capability.maturityLevel}</Tag>
                  </List.Item>
                )}
              />
            </Panel>
          </Collapse>
        </div>
      </Drawer>
    );
  };
  
  /**
   * 渲染属性抽屉
   */
  const renderPropertyDrawer = () => {
    if (!selectedNode) return null;
    
    return (
      <Drawer
        title="节点属性"
        placement="right"
        width={400}
        open={propertyDrawerVisible}
        onClose={() => setPropertyDrawerVisible(false)}
      >
        <Form
          layout="vertical"
          initialValues={{
            name: selectedNode.name,
            description: selectedNode.description,
            ...selectedNode.config
          }}
          onValuesChange={(changedValues, allValues) => {
            updateNode(selectedNode.id, {
              name: allValues.name,
              description: allValues.description,
              config: { ...selectedNode.config, ...changedValues }
            });
          }}
        >
          <Form.Item name="name" label="节点名称" rules={[{ required: true }]}>
            <Input placeholder="输入节点名称" />
          </Form.Item>
          
          <Form.Item name="description" label="节点描述">
            <TextArea rows={3} placeholder="输入节点描述" />
          </Form.Item>
          
          <Divider>输入参数</Divider>
          
          {selectedNode.inputs.map((input: any) => (
            <Form.Item
              key={input.id}
              name={['inputs', input.name]}
              label={`${input.name} (${input.type})`}
              rules={input.required ? [{ required: true }] : []}
            >
              {input.type === 'string' && <Input placeholder={`输入${input.name}`} />}
              {input.type === 'number' && <InputNumber style={{ width: '100%' }} placeholder={`输入${input.name}`} />}
              {input.type === 'boolean' && <Switch />}
              {input.type === 'array' && <Select mode="tags" style={{ width: '100%' }} placeholder={`输入${input.name}`} />}
            </Form.Item>
          ))}
          
          <Divider>输出配置</Divider>
          
          {selectedNode.outputs.map((output: any) => (
            <div key={output.id} className="output-config">
              <strong>{output.name}</strong> ({output.type})
              <div style={{ color: '#666', fontSize: '12px' }}>
                {output.description || '无描述'}
              </div>
            </div>
          ))}
          
          <Divider>高级配置</Divider>
          
          <Form.Item name="timeout" label="超时时间(秒)">
            <InputNumber min={1} max={3600} placeholder="60" style={{ width: '100%' }} />
          </Form.Item>
          
          <Form.Item name="retryCount" label="重试次数">
            <InputNumber min={0} max={10} placeholder="3" style={{ width: '100%' }} />
          </Form.Item>
          
          <Form.Item name="priority" label="优先级">
            <Select placeholder="选择优先级">
              <Option value="low">低</Option>
              <Option value="medium">中</Option>
              <Option value="high">高</Option>
              <Option value="critical">紧急</Option>
            </Select>
          </Form.Item>
        </Form>
      </Drawer>
    );
  };
  
  /**
   * 渲染执行监控抽屉
   */
  const renderExecutionDrawer = () => {
    return (
      <Drawer
        title="执行监控"
        placement="bottom"
        height={400}
        open={executionDrawerVisible}
        onClose={() => setExecutionDrawerVisible(false)}
      >
        {execution ? (
          <div className="execution-monitor">
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={6}>
                <Statistic
                  title="执行状态"
                  value={execution.status === 'running' ? '运行中' : execution.status === 'completed' ? '已完成' : '失败'}
                  valueStyle={{ 
                    color: execution.status === 'running' ? '#1890ff' : 
                           execution.status === 'completed' ? '#52c41a' : '#ff4d4f' 
                  }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="执行进度"
                  value={execution.progress}
                  suffix="%"
                  prefix={<Progress type="circle" percent={execution.progress} size={24} />}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="当前节点"
                  value={execution.currentNode ? workflow.nodes.find(n => n.id === execution.currentNode)?.name || '未知' : '无'}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="运行时长"
                  value={execution.endTime ? 
                    Math.round((execution.endTime.getTime() - execution.startTime.getTime()) / 1000) :
                    Math.round((Date.now() - execution.startTime.getTime()) / 1000)
                  }
                  suffix="秒"
                />
              </Col>
            </Row>
            
            <Tabs defaultActiveKey="timeline">
              <TabPane tab="执行时间线" key="timeline">
                <Timeline>
                  <Timeline.Item color="green">
                    <p>工作流开始执行</p>
                    <p style={{ color: '#666', fontSize: '12px' }}>
                      {execution.startTime.toLocaleString()}
                    </p>
                  </Timeline.Item>
                  
                  {execution.nodeExecutions.map((nodeExec: any) => (
                    <Timeline.Item 
                      key={nodeExec.nodeId}
                      color={nodeExec.status === 'completed' ? 'green' : 
                             nodeExec.status === 'error' ? 'red' : 'blue'}
                    >
                      <p>{workflow.nodes.find(n => n.id === nodeExec.nodeId)?.name || '未知节点'}</p>
                      <p style={{ color: '#666', fontSize: '12px' }}>
                        {nodeExec.startTime?.toLocaleString()} - {nodeExec.endTime?.toLocaleString()}
                      </p>
                      {nodeExec.error && (
                        <Alert message={nodeExec.error} type="error" />
                      )}
                    </Timeline.Item>
                  ))}
                  
                  {execution.status === 'completed' && (
                    <Timeline.Item color="green">
                      <p>工作流执行完成</p>
                      <p style={{ color: '#666', fontSize: '12px' }}>
                        {execution.endTime?.toLocaleString()}
                      </p>
                    </Timeline.Item>
                  )}
                </Timeline>
              </TabPane>
              
              <TabPane tab="性能指标" key="metrics">
                <Row gutter={16}>
                  <Col span={8}>
                    <Statistic
                      title="总节点数"
                      value={execution.metrics.nodeCount}
                    />
                  </Col>
                  <Col span={8}>
                    <Statistic
                      title="成功节点"
                      value={execution.metrics.successCount}
                      valueStyle={{ color: '#52c41a' }}
                    />
                  </Col>
                  <Col span={8}>
                    <Statistic
                      title="失败节点"
                      value={execution.metrics.failureCount}
                      valueStyle={{ color: '#ff4d4f' }}
                    />
                  </Col>
                </Row>
                
                <Row gutter={16} style={{ marginTop: 16 }}>
                  <Col span={8}>
                    <Statistic
                      title="平均节点耗时"
                      value={execution.metrics.averageNodeDuration}
                      suffix="ms"
                    />
                  </Col>
                  <Col span={8}>
                    <Statistic
                      title="总耗时"
                      value={execution.metrics.totalDuration}
                      suffix="ms"
                    />
                  </Col>
                  <Col span={8}>
                    <Statistic
                      title="吞吐量"
                      value={execution.metrics.throughput}
                      suffix="节点/秒"
                    />
                  </Col>
                </Row>
              </TabPane>
            </Tabs>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <BranchesOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />
            <h3>暂无执行记录</h3>
            <p>执行工作流后将显示监控信息</p>
          </div>
        )}
      </Drawer>
    );
  };
  
  /**
   * 渲染设置模态框
   */
  const renderSettingsModal = () => {
    return (
      <Modal
        title="工作流设置"
        open={settingsModalVisible}
        onCancel={() => setSettingsModalVisible(false)}
        onOk={() => {
          form.validateFields().then(values => {
            setWorkflow(prev => ({
              ...prev,
              name: values.name,
              description: values.description,
              version: values.version,
              metadata: {
                ...prev.metadata,
                category: values.category,
                complexity: values.complexity,
                tags: values.tags || [],
                updatedAt: new Date()
              }
            }));
            setSettingsModalVisible(false);
            message.success('设置已保存');
          });
        }}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            name: workflow.name,
            description: workflow.description,
            version: workflow.version,
            category: workflow.metadata.category,
            complexity: workflow.metadata.complexity,
            tags: workflow.metadata.tags
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="name" label="工作流名称" rules={[{ required: true }]}>
                <Input placeholder="输入工作流名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="version" label="版本号" rules={[{ required: true }]}>
                <Input placeholder="1.0.0" />
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item name="description" label="描述">
            <TextArea rows={3} placeholder="输入工作流描述" />
          </Form.Item>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="category" label="分类">
                <Select placeholder="选择分类">
                  <Option value="general">通用</Option>
                  <Option value="data-processing">数据处理</Option>
                  <Option value="ai-inference">AI推理</Option>
                  <Option value="automation">自动化</Option>
                  <Option value="integration">集成</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="complexity" label="复杂度">
                <Select placeholder="选择复杂度">
                  <Option value="simple">简单</Option>
                  <Option value="medium">中等</Option>
                  <Option value="complex">复杂</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item name="tags" label="标签">
            <Select mode="tags" placeholder="添加标签" />
          </Form.Item>
        </Form>
      </Modal>
    );
  };
  
  /**
   * 初始化组件
   */
  useEffect(() => {
    loadCapabilities();
    if (initialWorkflow) {
      setWorkflow(initialWorkflow);
    }
  }, [initialWorkflow]);
  
  /**
   * 加载可用能力
   */
  const loadCapabilities = async () => {
    try {
      // TODO: 从API加载能力列表
      const storedCapabilities = localStorage.getItem('capabilities_2_0');
      const capabilityList: CoreCapabilityModule[] = storedCapabilities 
        ? JSON.parse(storedCapabilities) 
        : [];
      setCapabilities(capabilityList);
    } catch (error) {
      message.error('加载能力列表失败');
      console.error('Load capabilities error:', error);
    }
  };
  
  /**
   * 创建新节点
   */
  const createNode = useCallback((capability: CoreCapabilityModule, position: { x: number; y: number }) => {
    const newNode: WorkflowNode = {
      id: `node_${Date.now()}`,
      type: 'capability',
      name: capability?.name || '未知能力',
      description: capability.description,
      position,
      size: { width: 200, height: 120 },
      config: {},
      capability: capability,
      inputs: capability.inputs.map((input: any) => ({
        id: `input_${input.name}`,
        name: input.name,
        type: input.type,
        required: input.required,
        value: input.defaultValue
      })),
      outputs: capability.outputs.map((output: any) => ({
        id: `output_${output.name}`,
        name: output.name,
        type: output.type,
        value: null
      })),
      status: 'idle'
    };
    
    setWorkflow(prev => ({
      ...prev,
      nodes: [...prev.nodes, newNode],
      metadata: {
        ...prev.metadata,
        updatedAt: new Date()
      }
    }));
    
    return newNode;
  }, []);
  
  /**
   * 删除节点
   */
  const deleteNode = useCallback((nodeId: string) => {
    setWorkflow(prev => ({
      ...prev,
      nodes: prev.nodes.filter(node => node.id !== nodeId),
      edges: prev.edges.filter(edge => edge.sourceNodeId !== nodeId && edge.targetNodeId !== nodeId),
      metadata: {
        ...prev.metadata,
        updatedAt: new Date()
      }
    }));
  }, []);
  
  /**
   * 更新节点
   */
  const updateNode = useCallback((nodeId: string, updates: Partial<WorkflowNode>) => {
    setWorkflow(prev => ({
      ...prev,
      nodes: prev.nodes.map(node => 
        node.id === nodeId ? { ...node, ...updates } : node
      ),
      metadata: {
        ...prev.metadata,
        updatedAt: new Date()
      }
    }));
  }, []);
  
  /**
   * 创建连接
   */
  const createEdge = useCallback((source: string, target: string, sourcePort?: string, targetPort?: string) => {
    const newEdge: WorkflowEdge = {
      id: `edge_${Date.now()}`,
      sourceNodeId: source,
      targetNodeId: target,
      sourceOutputId: sourcePort || '',
      targetInputId: targetPort || '',
      status: 'idle'
    };
    
    setWorkflow(prev => ({
      ...prev,
      edges: [...prev.edges, newEdge],
      metadata: {
        ...prev.metadata,
        updatedAt: new Date()
      }
    }));
    
    return newEdge;
  }, []);
  
  /**
   * 删除连接
   */
  const deleteEdge = useCallback((edgeId: string) => {
    setWorkflow(prev => ({
      ...prev,
      edges: prev.edges.filter(edge => edge.id !== edgeId),
      metadata: {
        ...prev.metadata,
        updatedAt: new Date()
      }
    }));
  }, []);
  
  /**
   * 保存工作流
   */
  const saveWorkflow = async () => {
    setSaving(true);
    try {
      // 验证工作流
      const validation = validateWorkflow(workflow);
      if (!validation.valid) {
        message.error(`工作流验证失败: ${validation.errors.join(', ')}`);
        return;
      }
      
      // TODO: 保存到API
      const workflowsKey = `workflows_${agentId || 'global'}`;
      const storedWorkflows = localStorage.getItem(workflowsKey);
      const workflows = storedWorkflows ? JSON.parse(storedWorkflows) : [];
      
      const existingIndex = workflows.findIndex((w: WorkflowDefinition) => w.id === workflow.id);
      if (existingIndex >= 0) {
        workflows[existingIndex] = workflow;
      } else {
        workflows.push(workflow);
      }
      
      localStorage.setItem(workflowsKey, JSON.stringify(workflows));
      
      if (onSave) {
        onSave(workflow);
      }
      
      message.success('工作流保存成功');
    } catch (error) {
      message.error('工作流保存失败');
      console.error('Save workflow error:', error);
    } finally {
      setSaving(false);
    }
  };
  
  /**
   * 验证工作流
   */
  const validateWorkflow = (workflow: WorkflowDefinition) => {
    const errors: string[] = [];
    
    // 检查基本信息
    if (!(workflow.name || '').trim()) {
      errors.push('工作流名称不能为空');
    }
    
    // 检查节点
    if (workflow.nodes.length === 0) {
      errors.push('工作流至少需要一个节点');
    }
    
    // 检查孤立节点
    const connectedNodes = new Set();
    workflow.edges.forEach(edge => {
      connectedNodes.add(edge.sourceNodeId);
      connectedNodes.add(edge.targetNodeId);
    });
    
    const isolatedNodes = workflow.nodes.filter(node => !connectedNodes.has(node.id));
    if (isolatedNodes.length > 1) {
      errors.push(`发现 ${isolatedNodes.length} 个孤立节点`);
    }
    
    // 检查循环依赖
    if (hasCyclicDependency(workflow.nodes, workflow.edges)) {
      errors.push('工作流存在循环依赖');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  };
  
  /**
   * 检查循环依赖
   */
  const hasCyclicDependency = (nodes: WorkflowNode[], edges: WorkflowEdge[]): boolean => {
    const graph = new Map<string, string[]>();
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    
    // 构建邻接表
    nodes.forEach(node => {
      graph.set(node.id, []);
    });
    
    edges.forEach(edge => {
      const neighbors = graph.get(edge.sourceNodeId) || [];
      neighbors.push(edge.targetNodeId);
      graph.set(edge.sourceNodeId, neighbors);
    });
    
    // DFS检查循环
    const dfs = (nodeId: string): boolean => {
      visited.add(nodeId);
      recursionStack.add(nodeId);
      
      const neighbors = graph.get(nodeId) || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          if (dfs(neighbor)) {
            return true;
          }
        } else if (recursionStack.has(neighbor)) {
          return true;
        }
      }
      
      recursionStack.delete(nodeId);
      return false;
    };
    
    for (const node of nodes) {
      if (!visited.has(node.id)) {
        if (dfs(node.id)) {
          return true;
        }
      }
    }
    
    return false;
  };
  
  /**
   * 主渲染方法
   */
  return (
    <div className="workflow-designer-2-0">
      <Card 
        title={
          <div className="designer-header">
            <div className="header-info">
              <h3>{workflow.name}</h3>
              <div className="workflow-meta">
                <Tag color="blue">v{workflow.version}</Tag>
                <Tag color="green">{workflow.metadata.complexity}</Tag>
                <span style={{ color: '#666', marginLeft: 8 }}>
                  {workflow.nodes.length} 个节点 · {workflow.edges.length} 个连接
                </span>
              </div>
            </div>
            
            <div className="header-actions">
              {renderToolbar()}
            </div>
          </div>
        }
        bodyStyle={{ padding: 0, height: 'calc(100vh - 200px)' }}
      >
      <div className="designer-content">
        <WorkflowVisualDesigner
          workflow={workflow}
          capabilities={capabilities}
          onWorkflowChange={setWorkflow}
          onNodeSelect={setSelectedNode}
          mode={mode}
        />
      </div>
      </Card>
      
      {/* 能力库抽屉 */}
      {renderCapabilityLibrary()}
      
      {/* 属性抽屉 */}
      {renderPropertyDrawer()}
      
      {/* 执行监控抽屉 */}
      {renderExecutionDrawer()}
      
      {/* 设置模态框 */}
      {renderSettingsModal()}
    </div>
  );
  
  /**
   * 执行工作流
   */

  
  /**
   * 渲染能力类型图标
   */
  const renderCapabilityTypeIcon = (type: CoreCapabilityType) => {
    const iconMap = {
      [CoreCapabilityType.COGNITIVE]: <BulbOutlined />,
      [CoreCapabilityType.REASONING]: <ThunderboltOutlined />,
      [CoreCapabilityType.DECISION]: <BulbOutlined />,
      [CoreCapabilityType.LEARNING]: <BookOutlined />
    };
    return iconMap[type] || <FunctionOutlined />;
  };
  
  /**
   * 渲染工作流节点
   */
  const renderWorkflowNode = (node: WorkflowNode) => {
    const capability = node.capability || capabilities.find(c => c.id === node.capability?.id);
    const isSelected = canvasState.selection.includes(node.id);
    
    return (
      <div
        key={node.id}
        className={`workflow-node ${isSelected ? 'selected' : ''} ${node.status}`}
        style={{
          left: node.position.x,
          top: node.position.y,
          width: node.size.width,
          height: node.size.height
        }}
        onClick={() => {
          setSelectedNode(node);
          setPropertyDrawerVisible(true);
        }}
      >
        <div className="node-header">
          <div className="node-icon">
            {capability && renderCapabilityTypeIcon(capability.type)}
          </div>
          <div className="node-title">
            <span>{node.name}</span>
            <div className="node-actions">
              <Button 
                type="text" 
                size="small" 
                icon={<EditOutlined />}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedNode(node);
                  setPropertyDrawerVisible(true);
                }}
              />
              <Button 
                type="text" 
                size="small" 
                icon={<DeleteOutlined />}
                onClick={(e) => {
                  e.stopPropagation();
                  deleteNode(node.id);
                }}
              />
            </div>
          </div>
        </div>
        
        <div className="node-body">
          <div className="node-description">
            {node.description}
          </div>
          
          <div className="node-ports">
            <div className="input-ports">
              {node.inputs.map((input: any) => (
                <div key={input.id} className="port input-port">
                  <Tooltip title={`${input.name} (${input.type})`}>
                    <div className="port-dot" />
                  </Tooltip>
                </div>
              ))}
            </div>
            
            <div className="output-ports">
              {node.outputs.map((output: any) => (
                <div key={output.id} className="port output-port">
                  <Tooltip title={`${output.name} (${output.type})`}>
                    <div className="port-dot" />
                  </Tooltip>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="node-status">
          {node.status === 'running' && <Badge status="processing" text="运行中" />}
          {node.status === 'completed' && <Badge status="success" text="已完成" />}
          {node.status === 'error' && <Badge status="error" text="错误" />}
          {node.status === 'idle' && <Badge status="default" text="就绪" />}
        </div>
      </div>
    );
  };
  
  /**
   * 渲染工作流连接
   */
  const renderWorkflowEdges = () => {
    return workflow.edges.map(edge => {
      const sourceNode = workflow.nodes.find(n => n.id === edge.sourceNodeId);
      const targetNode = workflow.nodes.find(n => n.id === edge.targetNodeId);
      
      if (!sourceNode || !targetNode) return null;
      
      const sourceX = sourceNode.position.x + sourceNode.size.width;
      const sourceY = sourceNode.position.y + sourceNode.size.height / 2;
      const targetX = targetNode.position.x;
      const targetY = targetNode.position.y + targetNode.size.height / 2;
      
      const path = `M ${sourceX} ${sourceY} L ${targetX} ${targetY}`;
      
      return (
        <g key={edge.id}>
          <path
            d={path}
            stroke="#1890ff"
            strokeWidth="2"
            fill="none"
            markerEnd="url(#arrowhead)"
            className="workflow-edge"
            onClick={() => {
              Modal.confirm({
                title: '删除连接',
                content: '确定要删除这个连接吗？',
                onOk: () => deleteEdge(edge.id)
              });
            }}
          />
        </g>
      );
    });
  };
  
  /**
   * 渲染能力库抽屉
   */
  const renderCapabilityLibraryDrawer = () => {
    return (
      <Drawer
        title="能力库"
        placement="left"
        width={400}
        open={capabilityLibraryVisible}
        onClose={() => setCapabilityLibraryVisible(false)}
      >
        <div className="capability-library">
          <Search 
            placeholder="搜索能力..."
            style={{ marginBottom: 16 }}
          />
          
          <List
            dataSource={capabilities}
            renderItem={(capability) => (
              <List.Item
                className="capability-item"
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('capability-id', capability.id);
                }}
              >
                <List.Item.Meta
                  avatar={renderCapabilityTypeIcon(capability.type)}
                  title={capability?.name || '未知能力'}
                  description={capability.description}
                />
                <Button 
                  type="text" 
                  icon={<PlusOutlined />}
                  onClick={() => {
                    const position = {
                      x: Math.random() * 400,
                      y: Math.random() * 300
                    };
                    createNode(capability, position);
                  }}
                />
              </List.Item>
            )}
          />
        </div>
      </Drawer>
    );
  };
  

  
  return (
    <div className="workflow-designer-2-0">
      {/* 工具栏 */}
      <div className="designer-header">
        <div className="header-title">
          <h2>EFIAgent 2.0 工作流设计器</h2>
        </div>
        <div className="header-actions">
          {renderToolbar()}
          <Space style={{ marginLeft: 16 }}>
            <Button.Group>
              <Button 
                type={designMode === 'visual' ? 'primary' : 'default'}
                icon={<ApartmentOutlined />}
                onClick={() => setDesignMode('visual')}
              >
                可视化设计
              </Button>
              <Button 
                type={designMode === 'manager' ? 'primary' : 'default'}
                icon={<SettingOutlined />}
                onClick={() => setDesignMode('manager')}
              >
                工作流管理
              </Button>
            </Button.Group>
          </Space>
        </div>
      </div>
      
      {/* 主内容区域 */}
      <div className="designer-content">
        {designMode === 'visual' ? (
          <WorkflowVisualDesigner
            workflow={workflow}
            capabilities={capabilities}
            availableAgents={availableAgents}
            onWorkflowChange={setWorkflow}
            onNodeSelect={setSelectedNode}
            mode={mode}
          />
        ) : (
          <WorkflowManagerV2
            workflows={[workflow]}
            onWorkflowSelect={(w) => setWorkflow(w)}
            onWorkflowCreate={(w) => setWorkflow(w)}
            onWorkflowUpdate={setWorkflow}
            onWorkflowDelete={() => {}}
          />
        )}
      </div>
      
      {/* 属性面板 */}
      {renderPropertyDrawer()}
      
      {/* 能力库 */}
      {renderCapabilityLibraryDrawer()}
      
      {/* 执行监控 */}
      {renderExecutionDrawer()}
    </div>
  );
};

export default WorkflowDesigner2_0;
