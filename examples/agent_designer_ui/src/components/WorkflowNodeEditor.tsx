/**
 * EFIAgent 2.0 工作流节点编辑器
 * 基于三层架构的可视化节点编辑组件
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Modal, Form, Input, Select, Switch, InputNumber, Button, Space, Tabs,
  Card, Row, Col, Divider, Alert, Tooltip, Tag, List, Collapse, Tree,
  Upload, message, Typography, Descriptions, Steps, Progress, Badge,
  AutoComplete, Slider, Rate, DatePicker, TimePicker, ColorPicker,
  Checkbox, Radio, Cascader, Transfer, Table, Drawer, Popover
} from 'antd';
import {
  PlusOutlined, DeleteOutlined, EditOutlined, CopyOutlined,
  InfoCircleOutlined, SettingOutlined, BugOutlined, PlayCircleOutlined,
  SaveOutlined, ReloadOutlined, ExportOutlined, ImportOutlined,
  FunctionOutlined, ApiOutlined, DatabaseOutlined, CloudOutlined,
  ThunderboltOutlined, BranchesOutlined, NodeIndexOutlined,
  CheckCircleOutlined, ExclamationCircleOutlined, CloseCircleOutlined,
  QuestionCircleOutlined, BulbOutlined, RocketOutlined, CodeOutlined,
  FileTextOutlined, LinkOutlined, UnlinkOutlined, EyeOutlined,
  DownOutlined, RightOutlined, UpOutlined, LeftOutlined
} from '@ant-design/icons';
import {
  WorkflowNode,
  WorkflowEdge,
  CoreCapabilityModule,
  CoreCapabilityType,
  Agent2_0,
  WorkflowDefinition
} from './CapabilitySystemTypes';
import { useWorkflowState, useWorkflowOperations } from './WorkflowStateManager';
import './WorkflowNodeEditor.css';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { TabPane } = Tabs;
const { Panel } = Collapse;
const { Step } = Steps;
const { Option } = Select;
const { Group: CheckboxGroup } = Checkbox;
const { Group: RadioGroup } = Radio;

/**
 * 节点类型枚举
 */
enum NodeType {
  CAPABILITY = 'capability',
  CONDITION = 'condition',
  CONTROL = 'control',
  AGENT = 'agent',
  INTEGRATION = 'integration'
}

/**
 * 节点配置接口
 */
interface NodeConfig {
  [key: string]: any;
}

/**
 * 输入输出端口接口
 */
interface NodePort {
  id: string;
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  required?: boolean;
  description?: string;
  defaultValue?: any;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    enum?: any[];
  };
}

/**
 * 工作流节点编辑器属性接口
 */
interface WorkflowNodeEditorProps {
  visible: boolean;
  node: WorkflowNode | null;
  workflow: WorkflowDefinition;
  onSave: (node: WorkflowNode) => void;
  onCancel: () => void;
  onDelete?: (nodeId: string) => void;
  availableCapabilities: CoreCapabilityModule[];
  availableAgents: Agent2_0[];
}

/**
 * 工作流节点编辑器组件
 */
const WorkflowNodeEditor: React.FC<WorkflowNodeEditorProps> = ({
  visible,
  node,
  workflow,
  onSave,
  onCancel,
  onDelete,
  availableCapabilities,
  availableAgents
}) => {
  // 状态管理
  const { state } = useWorkflowState();
  const operations = useWorkflowOperations();
  
  // 表单状态
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState<string>('basic');
  const [nodeType, setNodeType] = useState<NodeType>(NodeType.CAPABILITY);
  const [selectedCapability, setSelectedCapability] = useState<CoreCapabilityModule | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<Agent2_0 | null>(null);
  
  // 端口配置状态
  const [inputPorts, setInputPorts] = useState<NodePort[]>([]);
  const [outputPorts, setOutputPorts] = useState<NodePort[]>([]);
  
  // 节点配置状态
  const [nodeConfig, setNodeConfig] = useState<NodeConfig>({});
  
  // UI状态
  const [loading, setLoading] = useState<boolean>(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [previewVisible, setPreviewVisible] = useState<boolean>(false);
  
  /**
   * 初始化表单数据
   */
  useEffect(() => {
    if (visible && node) {
      // 编辑模式
      setNodeType(node.type as NodeType);
      setSelectedCapability(node.capability || null);
      setInputPorts(node.inputs || []);
      setOutputPorts(node.outputs || []);
      setNodeConfig(node.config || {});
      
      form.setFieldsValue({
        name: node.name,
        description: node.description,
        type: node.type,
        capabilityId: node.capability?.id,
        agentId: node.agent?.id,
        timeout: node.config?.timeout || 30000,
        retries: node.config?.retries || 0,
        enabled: node.config?.enabled !== false,
        priority: node.config?.priority || 1,
        tags: node.config?.tags || [],
        ...node.config
      });
    } else if (visible) {
      // 创建模式
      resetForm();
    }
  }, [visible, node, form]);

  /**
   * 重置表单
   */
  const resetForm = () => {
    setNodeType(NodeType.CAPABILITY);
    setSelectedCapability(null);
    setSelectedAgent(null);
    setInputPorts([]);
    setOutputPorts([]);
    setNodeConfig({});
    setValidationErrors([]);
    
    form.resetFields();
    form.setFieldsValue({
      type: NodeType.CAPABILITY,
      timeout: 30000,
      retries: 0,
      enabled: true,
      priority: 1,
      tags: []
    });
  };

  /**
   * 处理节点类型变化
   */
  const handleNodeTypeChange = (type: NodeType) => {
    setNodeType(type);
    setSelectedCapability(null);
    setSelectedAgent(null);
    
    // 根据节点类型设置默认端口
    switch (type) {
      case NodeType.CAPABILITY:
        setInputPorts([{
          id: 'input',
          name: '输入',
          type: 'object',
          required: true,
          description: '节点输入数据'
        }]);
        setOutputPorts([{
          id: 'output',
          name: '输出',
          type: 'object',
          description: '节点输出数据'
        }]);
        break;
      
      case NodeType.CONDITION:
        setInputPorts([{
          id: 'condition',
          name: '条件',
          type: 'boolean',
          required: true,
          description: '条件判断结果'
        }]);
        setOutputPorts([
          {
            id: 'true',
            name: '真',
            type: 'object',
            description: '条件为真时的输出'
          },
          {
            id: 'false',
            name: '假',
            type: 'object',
            description: '条件为假时的输出'
          }
        ]);
        break;
      
      case NodeType.CONTROL:
        setInputPorts([{
          id: 'control',
          name: '控制信号',
          type: 'object',
          required: true,
          description: '控制流信号'
        }]);
        setOutputPorts([{
          id: 'next',
          name: '下一步',
          type: 'object',
          description: '控制流输出'
        }]);
        break;
      
      default:
        setInputPorts([]);
        setOutputPorts([]);
    }
  };

  /**
   * 处理能力选择变化
   */
  const handleCapabilityChange = (capabilityId: string) => {
    const capability = availableCapabilities.find(cap => cap.id === capabilityId);
    setSelectedCapability(capability || null);
    
    if (capability) {
      // 根据能力类型设置默认配置
      const defaultConfig = getDefaultCapabilityConfig(capability);
      setNodeConfig(prev => ({ ...prev, ...defaultConfig }));
      
      // 更新表单字段
      form.setFieldsValue({
        name: capability?.name || '未知能力',
        description: capability.description,
        ...defaultConfig
      });
    }
  };

  /**
   * 获取能力的默认配置
   */
  const getDefaultCapabilityConfig = (capability: CoreCapabilityModule): NodeConfig => {
    const config: NodeConfig = {
      capabilityType: capability.type,
      capabilitySubType: capability.subType,
      version: capability.version
    };
    
    // 根据能力类型设置特定配置
    switch (capability.type) {
      case CoreCapabilityType.COGNITIVE:
        config.perceptionMode = 'auto';
        config.confidenceThreshold = 0.8;
        break;
      
      case CoreCapabilityType.REASONING:
        config.reasoningStrategy = 'logical';
        config.maxIterations = 10;
        break;
      
      case CoreCapabilityType.DECISION:
        config.decisionCriteria = 'optimal';
        config.riskTolerance = 'medium';
        break;
      
      case CoreCapabilityType.LEARNING:
        config.learningRate = 0.01;
        config.adaptationMode = 'incremental';
        break;
    }
    
    return config;
  };

  /**
   * 添加输入端口
   */
  const addInputPort = () => {
    const newPort: NodePort = {
      id: `input_${Date.now()}`,
      name: `输入${inputPorts.length + 1}`,
      type: 'object',
      required: false,
      description: ''
    };
    setInputPorts(prev => [...prev, newPort]);
  };

  /**
   * 添加输出端口
   */
  const addOutputPort = () => {
    const newPort: NodePort = {
      id: `output_${Date.now()}`,
      name: `输出${outputPorts.length + 1}`,
      type: 'object',
      description: ''
    };
    setOutputPorts(prev => [...prev, newPort]);
  };

  /**
   * 更新端口
   */
  const updatePort = (portId: string, updates: Partial<NodePort>, isInput: boolean) => {
    if (isInput) {
      setInputPorts(prev => prev.map(port => 
        port.id === portId ? { ...port, ...updates } : port
      ));
    } else {
      setOutputPorts(prev => prev.map(port => 
        port.id === portId ? { ...port, ...updates } : port
      ));
    }
  };

  /**
   * 删除端口
   */
  const deletePort = (portId: string, isInput: boolean) => {
    if (isInput) {
      setInputPorts(prev => prev.filter(port => port.id !== portId));
    } else {
      setOutputPorts(prev => prev.filter(port => port.id !== portId));
    }
  };

  /**
   * 验证节点配置
   */
  const validateNode = (): string[] => {
    const errors: string[] = [];
    
    // 基本验证
    if (!form.getFieldValue('name')) {
      errors.push('节点名称不能为空');
    }
    
    if (!form.getFieldValue('description')) {
      errors.push('节点描述不能为空');
    }
    
    // 类型特定验证
    if (nodeType === NodeType.CAPABILITY && !selectedCapability) {
      errors.push('必须选择一个能力模块');
    }
    
    if (nodeType === NodeType.AGENT && !selectedAgent) {
      errors.push('必须选择一个Agent');
    }
    
    // 端口验证
    if (inputPorts.length === 0 && nodeType !== NodeType.CONTROL) {
      errors.push('至少需要一个输入端口');
    }
    
    if (outputPorts.length === 0) {
      errors.push('至少需要一个输出端口');
    }
    
    // 端口名称唯一性验证
    const inputNames = inputPorts.map(p => p.name);
    const outputNames = outputPorts.map(p => p.name);
    
    if (new Set(inputNames).size !== inputNames.length) {
      errors.push('输入端口名称必须唯一');
    }
    
    if (new Set(outputNames).size !== outputNames.length) {
      errors.push('输出端口名称必须唯一');
    }
    
    return errors;
  };

  /**
   * 保存节点
   */
  const handleSave = async () => {
    try {
      setLoading(true);
      
      // 验证表单
      const values = await form.validateFields();
      
      // 验证节点配置
      const errors = validateNode();
      if (errors.length > 0) {
        setValidationErrors(errors);
        return;
      }
      
      setValidationErrors([]);
      
      // 构建节点对象
      const updatedNode: WorkflowNode = {
        id: node?.id || `node_${Date.now()}`,
        type: nodeType,
        name: values.name,
        description: values.description,
        position: node?.position || { x: 100, y: 100 },
        size: node?.size || { width: 200, height: 80 },
        inputs: inputPorts,
        outputs: outputPorts,
        config: {
          ...nodeConfig,
          timeout: values.timeout,
          retries: values.retries,
          enabled: values.enabled,
          priority: values.priority,
          tags: values.tags,
          ...values
        },
        status: node?.status || 'idle'
      };
      
      // 添加能力或Agent引用
      if (nodeType === NodeType.CAPABILITY && selectedCapability) {
        updatedNode.capability = selectedCapability;
      }
      
      if (nodeType === NodeType.AGENT && selectedAgent) {
        updatedNode.agent = selectedAgent;
      }
      
      onSave(updatedNode);
      message.success('节点保存成功');
    } catch (error) {
      console.error('保存节点失败:', error);
      message.error('保存节点失败');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 删除节点
   */
  const handleDelete = () => {
    if (node && onDelete) {
      onDelete(node.id);
      message.success('节点删除成功');
    }
  };

  /**
   * 渲染端口编辑器
   */
  const renderPortEditor = (ports: NodePort[], isInput: boolean) => (
    <div className="port-editor">
      <div className="port-editor-header">
        <Title level={5}>{isInput ? '输入端口' : '输出端口'}</Title>
        <Button
          type="dashed"
          icon={<PlusOutlined />}
          onClick={isInput ? addInputPort : addOutputPort}
          size="small"
        >
          添加端口
        </Button>
      </div>
      
      <List
        dataSource={ports}
        renderItem={(port, index) => (
          <List.Item
            actions={[
              <Button
                type="text"
                icon={<DeleteOutlined />}
                onClick={() => deletePort(port.id, isInput)}
                size="small"
                danger
              />
            ]}
          >
            <div className="port-config">
              <Row gutter={8}>
                <Col span={8}>
                  <Input
                    placeholder="端口名称"
                    value={port.name}
                    onChange={(e) => updatePort(port.id, { name: e.target.value }, isInput)}
                    size="small"
                  />
                </Col>
                <Col span={6}>
                  <Select
                    placeholder="类型"
                    value={port.type}
                    onChange={(value) => updatePort(port.id, { type: value }, isInput)}
                    size="small"
                    style={{ width: '100%' }}
                  >
                    <Option value="string">字符串</Option>
                    <Option value="number">数字</Option>
                    <Option value="boolean">布尔</Option>
                    <Option value="object">对象</Option>
                    <Option value="array">数组</Option>
                  </Select>
                </Col>
                <Col span={6}>
                  <Switch
                    checkedChildren="必需"
                    unCheckedChildren="可选"
                    checked={port.required}
                    onChange={(checked) => updatePort(port.id, { required: checked }, isInput)}
                    size="small"
                  />
                </Col>
                <Col span={4}>
                  <Tooltip title="端口描述">
                    <Input
                      placeholder="描述"
                      value={port.description}
                      onChange={(e) => updatePort(port.id, { description: e.target.value }, isInput)}
                      size="small"
                    />
                  </Tooltip>
                </Col>
              </Row>
            </div>
          </List.Item>
        )}
      />
    </div>
  );

  /**
   * 渲染基本配置标签页
   */
  const renderBasicTab = () => (
    <div className="basic-config">
      <Form.Item
        name="name"
        label="节点名称"
        rules={[{ required: true, message: '请输入节点名称' }]}
      >
        <Input placeholder="请输入节点名称" />
      </Form.Item>
      
      <Form.Item
        name="description"
        label="节点描述"
        rules={[{ required: true, message: '请输入节点描述' }]}
      >
        <TextArea rows={3} placeholder="请输入节点描述" />
      </Form.Item>
      
      <Form.Item
        name="type"
        label="节点类型"
        rules={[{ required: true, message: '请选择节点类型' }]}
      >
        <Select
          placeholder="请选择节点类型"
          onChange={handleNodeTypeChange}
        >
          <Option value={NodeType.CAPABILITY}>能力节点</Option>
          <Option value={NodeType.CONDITION}>条件节点</Option>
          <Option value={NodeType.CONTROL}>控制节点</Option>
          <Option value={NodeType.AGENT}>Agent节点</Option>
          <Option value={NodeType.INTEGRATION}>集成节点</Option>
        </Select>
      </Form.Item>
      
      {nodeType === NodeType.CAPABILITY && (
        <Form.Item
          name="capabilityId"
          label="能力模块"
          rules={[{ required: true, message: '请选择能力模块' }]}
        >
          <Select
            placeholder="请选择能力模块"
            onChange={handleCapabilityChange}
            showSearch
            filterOption={(input, option) =>
              option?.children?.toString().toLowerCase().includes(input.toLowerCase()) || false
            }
          >
            {availableCapabilities.map(cap => (
              <Option key={cap.id} value={cap.id}>
                <div>
                  <Text strong>{cap?.name || '未知能力'}</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    {cap.type} - {cap.subType} - v{cap.version}
                  </Text>
                </div>
              </Option>
            ))}
          </Select>
        </Form.Item>
      )}
      
      {nodeType === NodeType.AGENT && (
        <Form.Item
          name="agentId"
          label="Agent"
          rules={[{ required: true, message: '请选择Agent' }]}
        >
          <Select
            placeholder="请选择Agent"
            onChange={(agentId) => {
              const agent = availableAgents.find(a => a.id === agentId);
              setSelectedAgent(agent || null);
            }}
            showSearch
            filterOption={(input, option) =>
              option?.children?.toString().toLowerCase().includes(input.toLowerCase()) || false
            }
          >
            {availableAgents.map(agent => (
              <Option key={agent.id} value={agent.id}>
                <div>
                  <Text strong>{agent.name}</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    {agent.type} - {agent.status} - v{agent.version}
                  </Text>
                </div>
              </Option>
            ))}
          </Select>
        </Form.Item>
      )}
      
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="timeout"
            label="超时时间(ms)"
            rules={[{ type: 'number', min: 1000, message: '超时时间不能少于1秒' }]}
          >
            <InputNumber
              placeholder="30000"
              style={{ width: '100%' }}
              min={1000}
              max={300000}
              step={1000}
            />
          </Form.Item>
        </Col>
        
        <Col span={12}>
          <Form.Item
            name="retries"
            label="重试次数"
            rules={[{ type: 'number', min: 0, max: 10, message: '重试次数范围0-10' }]}
          >
            <InputNumber
              placeholder="0"
              style={{ width: '100%' }}
              min={0}
              max={10}
            />
          </Form.Item>
        </Col>
      </Row>
      
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="enabled"
            label="启用状态"
            valuePropName="checked"
          >
            <Switch checkedChildren="启用" unCheckedChildren="禁用" />
          </Form.Item>
        </Col>
        
        <Col span={12}>
          <Form.Item
            name="priority"
            label="优先级"
            rules={[{ type: 'number', min: 1, max: 10, message: '优先级范围1-10' }]}
          >
            <Slider
              min={1}
              max={10}
              marks={{ 1: '低', 5: '中', 10: '高' }}
            />
          </Form.Item>
        </Col>
      </Row>
      
      <Form.Item
        name="tags"
        label="标签"
      >
        <Select
          mode="tags"
          placeholder="请输入标签"
          tokenSeparators={[',']}
        >
          <Option value="数据处理">数据处理</Option>
          <Option value="分析">分析</Option>
          <Option value="预测">预测</Option>
          <Option value="决策">决策</Option>
          <Option value="学习">学习</Option>
        </Select>
      </Form.Item>
    </div>
  );

  /**
   * 渲染高级配置标签页
   */
  const renderAdvancedTab = () => (
    <div className="advanced-config">
      {selectedCapability && (
        <Card title="能力特定配置" size="small" style={{ marginBottom: 16 }}>
          {selectedCapability.type === CoreCapabilityType.COGNITIVE && (
            <>
              <Form.Item
                name="perceptionMode"
                label="感知模式"
              >
                <Select placeholder="选择感知模式">
                  <Option value="auto">自动</Option>
                  <Option value="manual">手动</Option>
                  <Option value="hybrid">混合</Option>
                </Select>
              </Form.Item>
              
              <Form.Item
                name="confidenceThreshold"
                label="置信度阈值"
              >
                <Slider
                  min={0}
                  max={1}
                  step={0.1}
                  marks={{ 0: '0', 0.5: '0.5', 1: '1' }}
                />
              </Form.Item>
            </>
          )}
          
          {selectedCapability.type === CoreCapabilityType.REASONING && (
            <>
              <Form.Item
                name="reasoningStrategy"
                label="推理策略"
              >
                <Select placeholder="选择推理策略">
                  <Option value="logical">逻辑推理</Option>
                  <Option value="probabilistic">概率推理</Option>
                  <Option value="causal">因果推理</Option>
                  <Option value="analogical">类比推理</Option>
                </Select>
              </Form.Item>
              
              <Form.Item
                name="maxIterations"
                label="最大迭代次数"
              >
                <InputNumber
                  min={1}
                  max={100}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </>
          )}
          
          {selectedCapability.type === CoreCapabilityType.DECISION && (
            <>
              <Form.Item
                name="decisionCriteria"
                label="决策标准"
              >
                <Select placeholder="选择决策标准">
                  <Option value="optimal">最优</Option>
                  <Option value="satisficing">满意</Option>
                  <Option value="minimax">最小最大</Option>
                  <Option value="expected_value">期望值</Option>
                </Select>
              </Form.Item>
              
              <Form.Item
                name="riskTolerance"
                label="风险容忍度"
              >
                <Radio.Group>
                  <Radio value="low">低</Radio>
                  <Radio value="medium">中</Radio>
                  <Radio value="high">高</Radio>
                </Radio.Group>
              </Form.Item>
            </>
          )}
          
          {selectedCapability.type === CoreCapabilityType.LEARNING && (
            <>
              <Form.Item
                name="learningRate"
                label="学习率"
              >
                <InputNumber
                  min={0.001}
                  max={1}
                  step={0.001}
                  style={{ width: '100%' }}
                />
              </Form.Item>
              
              <Form.Item
                name="adaptationMode"
                label="适应模式"
              >
                <Select placeholder="选择适应模式">
                  <Option value="incremental">增量</Option>
                  <Option value="batch">批量</Option>
                  <Option value="online">在线</Option>
                  <Option value="offline">离线</Option>
                </Select>
              </Form.Item>
            </>
          )}
        </Card>
      )}
      
      <Card title="性能配置" size="small" style={{ marginBottom: 16 }}>
        <Form.Item
          name="maxMemory"
          label="最大内存(MB)"
        >
          <InputNumber
            min={128}
            max={8192}
            style={{ width: '100%' }}
            placeholder="1024"
          />
        </Form.Item>
        
        <Form.Item
          name="maxCpu"
          label="最大CPU使用率(%)"
        >
          <Slider
            min={10}
            max={100}
            marks={{ 10: '10%', 50: '50%', 100: '100%' }}
          />
        </Form.Item>
        
        <Form.Item
          name="cacheEnabled"
          label="启用缓存"
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>
      </Card>
      
      <Card title="监控配置" size="small">
        <Form.Item
          name="metricsEnabled"
          label="启用指标收集"
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>
        
        <Form.Item
          name="loggingLevel"
          label="日志级别"
        >
          <Select placeholder="选择日志级别">
            <Option value="debug">调试</Option>
            <Option value="info">信息</Option>
            <Option value="warn">警告</Option>
            <Option value="error">错误</Option>
          </Select>
        </Form.Item>
        
        <Form.Item
          name="alertThreshold"
          label="告警阈值"
        >
          <InputNumber
            min={0}
            max={100}
            style={{ width: '100%' }}
            placeholder="80"
            addonAfter="%"
          />
        </Form.Item>
      </Card>
    </div>
  );

  /**
   * 渲染端口配置标签页
   */
  const renderPortsTab = () => (
    <div className="ports-config">
      <Row gutter={16}>
        <Col span={12}>
          {renderPortEditor(inputPorts, true)}
        </Col>
        <Col span={12}>
          {renderPortEditor(outputPorts, false)}
        </Col>
      </Row>
    </div>
  );

  /**
   * 渲染预览标签页
   */
  const renderPreviewTab = () => {
    const previewData = {
      id: node?.id || 'new_node',
      type: nodeType,
      name: form.getFieldValue('name') || '未命名节点',
      description: form.getFieldValue('description') || '无描述',
      capability: selectedCapability,
      agent: selectedAgent,
      inputs: inputPorts,
      outputs: outputPorts,
      config: {
        ...nodeConfig,
        ...form.getFieldsValue()
      }
    };
    
    return (
      <div className="preview-config">
        <Descriptions title="节点预览" bordered column={2}>
          <Descriptions.Item label="节点ID">{previewData.id}</Descriptions.Item>
          <Descriptions.Item label="节点类型">{previewData.type}</Descriptions.Item>
          <Descriptions.Item label="节点名称">{previewData.name}</Descriptions.Item>
          <Descriptions.Item label="节点描述" span={2}>{previewData.description}</Descriptions.Item>
          
          {previewData.capability && (
            <>
              <Descriptions.Item label="能力名称">{previewData.capability?.name || '未知能力'}</Descriptions.Item>
              <Descriptions.Item label="能力类型">{previewData.capability.type}</Descriptions.Item>
              <Descriptions.Item label="能力子类型">{previewData.capability.subType}</Descriptions.Item>
              <Descriptions.Item label="能力版本">{previewData.capability.version}</Descriptions.Item>
            </>
          )}
          
          {previewData.agent && (
            <>
              <Descriptions.Item label="Agent名称">{previewData.agent.name || '未命名Agent'}</Descriptions.Item>
              <Descriptions.Item label="Agent类型">{previewData.agent.type}</Descriptions.Item>
              <Descriptions.Item label="Agent状态">{previewData.agent.status}</Descriptions.Item>
              <Descriptions.Item label="Agent版本">{previewData.agent.version}</Descriptions.Item>
            </>
          )}
          
          <Descriptions.Item label="输入端口数">{previewData.inputs.length}</Descriptions.Item>
          <Descriptions.Item label="输出端口数">{previewData.outputs.length}</Descriptions.Item>
        </Descriptions>
        
        <Divider />
        
        <Title level={5}>配置详情</Title>
        <pre style={{ background: '#f5f5f5', padding: '16px', borderRadius: '6px', overflow: 'auto' }}>
          {JSON.stringify(previewData.config, null, 2)}
        </pre>
      </div>
    );
  };

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <FunctionOutlined style={{ marginRight: 8 }} />
          {node ? '编辑节点' : '创建节点'}
        </div>
      }
      open={visible}
      onCancel={onCancel}
      width={900}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          取消
        </Button>,
        
        node && onDelete && (
          <Button
            key="delete"
            danger
            icon={<DeleteOutlined />}
            onClick={handleDelete}
          >
            删除
          </Button>
        ),
        
        <Button
          key="preview"
          icon={<EyeOutlined />}
          onClick={() => setPreviewVisible(true)}
        >
          预览
        </Button>,
        
        <Button
          key="save"
          type="primary"
          icon={<SaveOutlined />}
          loading={loading}
          onClick={handleSave}
        >
          保存
        </Button>
      ].filter(Boolean)}
      destroyOnClose
    >
      {validationErrors.length > 0 && (
        <Alert
          message="配置验证失败"
          description={
            <ul>
              {validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          }
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}
      
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          type: NodeType.CAPABILITY,
          timeout: 30000,
          retries: 0,
          enabled: true,
          priority: 1,
          tags: []
        }}
      >
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="基本配置" key="basic" icon={<SettingOutlined />}>
            {renderBasicTab()}
          </TabPane>
          
          <TabPane tab="高级配置" key="advanced" icon={<CodeOutlined />}>
            {renderAdvancedTab()}
          </TabPane>
          
          <TabPane tab="端口配置" key="ports" icon={<NodeIndexOutlined />}>
            {renderPortsTab()}
          </TabPane>
          
          <TabPane tab="预览" key="preview" icon={<EyeOutlined />}>
            {renderPreviewTab()}
          </TabPane>
        </Tabs>
      </Form>
    </Modal>
  );
};

export default WorkflowNodeEditor;