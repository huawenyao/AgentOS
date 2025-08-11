/**
 * EFIAgent 2.0 工作流管理器 V2
 * 基于三层架构的工作流管理系统
 * 集成能力模块、Agent模块、工作流模块的完整管理功能
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Card, Button, Table, Modal, Form, Input, Select, Tag, Space, Tooltip,
  Popconfirm, message, Row, Col, Statistic, Progress, Avatar, Typography,
  Divider, Empty, Drawer, Tabs, List, Alert, Switch, Slider, Badge,
  Timeline, Collapse, Tree, Upload, Dropdown, Menu, Rate, DatePicker,
  AutoComplete, InputNumber, Descriptions, Steps, Result, Spin
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, PlayCircleOutlined,
  PauseCircleOutlined, StopOutlined, EyeOutlined, CopyOutlined,
  ExportOutlined, ImportOutlined, SettingOutlined, ClockCircleOutlined,
  CheckCircleOutlined, ExclamationCircleOutlined, UserOutlined,
  BranchesOutlined, NodeIndexOutlined, ApartmentOutlined,
  ThunderboltOutlined, BulbOutlined, BookOutlined, ApiOutlined,
  DatabaseOutlined, CloudOutlined, MonitorOutlined, ExperimentOutlined,
  RocketOutlined, SecurityScanOutlined, InteractionOutlined,
  FunctionOutlined, CodeOutlined, BugOutlined, InfoCircleOutlined,
  QuestionCircleOutlined, ReloadOutlined, DownloadOutlined,
  UploadOutlined, ShareAltOutlined, FilterOutlined, SearchOutlined,
  SortAscendingOutlined, SortDescendingOutlined, CalendarOutlined,
  TeamOutlined, FileTextOutlined, BarChartOutlined, LineChartOutlined,
  CloseCircleOutlined
} from '@ant-design/icons';
import {
  WorkflowEngine,
  WorkflowVariable,
  WorkflowTrigger,
  WorkflowMetadata,
  workflowEngine
} from './WorkflowEngine';
import {
  CoreCapabilityModule,
  CoreCapabilityType,
  CognitiveCapabilityType,
  ReasoningCapabilityType,
  Agent2_0,
  WorkflowNode,
  WorkflowEdge,
  WorkflowExecution,
  WorkflowDefinition,
  CapabilityOrchestrationMode
} from './CapabilitySystemTypes';
import { useGlobalState } from './StateManager';
import {
  generateMockCapabilities,
  generateMockAgents,
  generateMockWorkflows,
  generateMockExecutions
} from '../data/mockData';
import './WorkflowManagerV2.css';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { TabPane } = Tabs;
const { Panel } = Collapse;
const { Step } = Steps;
const { Search } = Input;
const { Option } = Select;

/**
 * 工作流状态枚举
 */
enum WorkflowStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  PAUSED = 'paused',
  STOPPED = 'stopped',
  ERROR = 'error'
}

/**
 * 工作流管理器属性接口
 */
interface WorkflowManagerV2Props {
  onWorkflowSelect?: (workflow: WorkflowDefinition) => void;
  onWorkflowCreate?: (workflow: WorkflowDefinition) => void;
  onWorkflowEdit?: (workflow: WorkflowDefinition) => void;
}

/**
 * 工作流过滤器接口
 */
interface WorkflowFilter {
  status?: WorkflowStatus[];
  author?: string[];
  tags?: string[];
  category?: string[];
  complexity?: ('simple' | 'medium' | 'complex')[];
  dateRange?: [Date, Date];
  searchText?: string;
}

/**
 * 工作流统计信息接口
 */
interface WorkflowStatistics {
  total: number;
  active: number;
  paused: number;
  error: number;
  draft: number;
  totalExecutions: number;
  averageSuccessRate: number;
  averageDuration: number;
  topCategories: { category: string; count: number }[];
  recentActivity: { date: string; count: number }[];
}

/**
 * EFIAgent 2.0 工作流管理器组件
 */
const WorkflowManagerV2: React.FC<WorkflowManagerV2Props> = ({
  onWorkflowSelect,
  onWorkflowCreate,
  onWorkflowEdit
}) => {
  // 全局状态
  const globalState = useGlobalState();
  
  // 核心状态
  const [workflows, setWorkflows] = useState<WorkflowDefinition[]>([]);
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [capabilities, setCapabilities] = useState<CoreCapabilityModule[]>([]);
  const [agents, setAgents] = useState<Agent2_0[]>([]);
  
  // UI状态
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowDefinition | null>(null);
  const [selectedExecution, setSelectedExecution] = useState<WorkflowExecution | null>(null);
  
  // 模态框状态
  const [createModalVisible, setCreateModalVisible] = useState<boolean>(false);
  const [editModalVisible, setEditModalVisible] = useState<boolean>(false);
  const [detailDrawerVisible, setDetailDrawerVisible] = useState<boolean>(false);
  const [executionDrawerVisible, setExecutionDrawerVisible] = useState<boolean>(false);
  const [statisticsDrawerVisible, setStatisticsDrawerVisible] = useState<boolean>(false);
  const [importModalVisible, setImportModalVisible] = useState<boolean>(false);
  const [exportModalVisible, setExportModalVisible] = useState<boolean>(false);
  
  // 表单
  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const [filterForm] = Form.useForm();
  
  // 过滤和搜索
  const [filter, setFilter] = useState<WorkflowFilter>({});
  const [sortField, setSortField] = useState<string>('updatedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  
  // 统计数据
  const [statistics, setStatistics] = useState<WorkflowStatistics>({
    total: 0,
    active: 0,
    paused: 0,
    error: 0,
    draft: 0,
    totalExecutions: 0,
    averageSuccessRate: 0,
    averageDuration: 0,
    topCategories: [],
    recentActivity: []
  });
  
  // 当前选中的标签页
  const [activeTab, setActiveTab] = useState<string>('workflows');

  /**
   * 组件初始化
   */
  useEffect(() => {
    initializeComponent();
    setupEventListeners();
    
    return () => {
      cleanupEventListeners();
    };
  }, []);

  /**
   * 初始化组件
   */
  const initializeComponent = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadWorkflows(),
        loadCapabilities(),
        loadAgents(),
        loadExecutions()
      ]);
    } catch (error) {
      console.error('初始化组件失败:', error);
      message.error('初始化失败');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 设置事件监听器
   */
  const setupEventListeners = () => {
    workflowEngine.on('workflow:created', handleWorkflowCreated);
    workflowEngine.on('workflow:updated', handleWorkflowUpdated);
    workflowEngine.on('workflow:deleted', handleWorkflowDeleted);
    workflowEngine.on('execution:started', handleExecutionStarted);
    workflowEngine.on('execution:completed', handleExecutionCompleted);
    workflowEngine.on('execution:failed', handleExecutionFailed);
  };

  /**
   * 清理事件监听器
   */
  const cleanupEventListeners = () => {
    workflowEngine.off('workflow:created', handleWorkflowCreated);
    workflowEngine.off('workflow:updated', handleWorkflowUpdated);
    workflowEngine.off('workflow:deleted', handleWorkflowDeleted);
    workflowEngine.off('execution:started', handleExecutionStarted);
    workflowEngine.off('execution:completed', handleExecutionCompleted);
    workflowEngine.off('execution:failed', handleExecutionFailed);
  };

  /**
   * 加载工作流列表
   */
  const loadWorkflows = async () => {
    try {
      const mockWorkflows = generateMockWorkflows(10);
      setWorkflows(mockWorkflows);
      calculateStatistics(mockWorkflows);
    } catch (error) {
      console.error('加载工作流失败:', error);
      message.error('加载工作流失败');
    }
  };

  /**
   * 加载能力模块
   */
  const loadCapabilities = async () => {
    try {
      const mockCapabilities = generateMockCapabilities(20);
      setCapabilities(mockCapabilities);
      
      // 注册到工作流引擎
      mockCapabilities.forEach(cap => {
        workflowEngine.registerCapability(cap);
      });
    } catch (error) {
      console.error('加载能力模块失败:', error);
    }
  };

  /**
   * 加载Agent列表
   */
  const loadAgents = async () => {
    try {
      const mockAgents = generateMockAgents(15);
      setAgents(mockAgents);
      
      // 注册到工作流引擎
      mockAgents.forEach(agent => {
        workflowEngine.registerAgent(agent);
      });
    } catch (error) {
      console.error('加载Agent失败:', error);
    }
  };

  /**
   * 加载执行历史
   */
  const loadExecutions = async () => {
    try {
      const mockExecutions = generateMockExecutions(50);
      setExecutions(mockExecutions);
    } catch (error) {
      console.error('加载执行历史失败:', error);
    }
  };

  /**
   * 计算统计信息
   */
  const calculateStatistics = (workflowList: WorkflowDefinition[]) => {
    const stats: WorkflowStatistics = {
      total: workflowList.length,
      active: 0,
      paused: 0,
      error: 0,
      draft: workflowList.length, // 暂时都设为draft
      totalExecutions: 0,
      averageSuccessRate: 0,
      averageDuration: 0,
      topCategories: [],
      recentActivity: []
    };
    
    // 计算分类统计
    const categoryCount = new Map<string, number>();
    workflowList.forEach(wf => {
      const category = wf.metadata.category;
      categoryCount.set(category, (categoryCount.get(category) || 0) + 1);
    });
    
    stats.topCategories = Array.from(categoryCount.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    setStatistics(stats);
  };

  /**
   * 事件处理器
   */
  const handleWorkflowCreated = (workflow: WorkflowDefinition) => {
    setWorkflows(prev => [...prev, workflow]);
    message.success(`工作流 "${workflow.name}" 创建成功`);
  };

  const handleWorkflowUpdated = (workflow: WorkflowDefinition) => {
    setWorkflows(prev => prev.map(wf => wf.id === workflow.id ? workflow : wf));
    message.success(`工作流 "${workflow.name}" 更新成功`);
  };

  const handleWorkflowDeleted = ({ id }: { id: string }) => {
    setWorkflows(prev => prev.filter(wf => wf.id !== id));
    message.success('工作流删除成功');
  };

  const handleExecutionStarted = (execution: WorkflowExecution) => {
    setExecutions(prev => [...prev, execution]);
    message.info(`工作流执行开始: ${execution.id}`);
  };

  const handleExecutionCompleted = (execution: WorkflowExecution) => {
    setExecutions(prev => prev.map(exec => exec.id === execution.id ? execution : exec));
    message.success(`工作流执行完成: ${execution.id}`);
  };

  const handleExecutionFailed = (execution: WorkflowExecution) => {
    setExecutions(prev => prev.map(exec => exec.id === execution.id ? execution : exec));
    message.error(`工作流执行失败: ${execution.id}`);
  };

  /**
   * 创建新工作流
   */
  const handleCreateWorkflow = async (values: any) => {
    try {
      const newWorkflow: WorkflowDefinition = {
        id: `wf-${Date.now()}`,
        name: values.name,
        description: values.description,
        version: '1.0.0',
        nodes: [],
        edges: [],
        variables: [],
        triggers: [],
        metadata: {
          author: 'Current User',
          organization: values.organization || 'Default',
          createdAt: new Date(),
          updatedAt: new Date(),
          tags: values.tags || [],
          category: values.category || 'general',
          complexity: values.complexity || 'simple',
          estimatedDuration: 0,
          resourceRequirements: {
            cpu: 1,
            memory: 1024,
            storage: 512,
            network: true
          },
          permissions: {
            read: ['user'],
            write: ['user'],
            execute: ['user'],
            admin: ['admin']
          }
        },
        orchestrationConfig: {
          mode: CapabilityOrchestrationMode.SEQUENTIAL,
          maxConcurrency: 1,
          timeout: 300000,
          retryPolicy: {
            enabled: false,
            maxAttempts: 1,
            backoffStrategy: 'fixed',
            initialDelay: 1000,
            maxDelay: 5000,
            retryableErrors: []
          },
          errorHandling: {
            strategy: 'fail-fast'
          },
          optimization: {
            enabled: false,
            strategies: []
          }
        }
      };
      
      await workflowEngine.createWorkflow(newWorkflow);
      
      setCreateModalVisible(false);
      createForm.resetFields();
      
      if (onWorkflowCreate) {
        onWorkflowCreate(newWorkflow);
      }
    } catch (error) {
      console.error('创建工作流失败:', error);
      message.error('创建工作流失败');
    }
  };

  /**
   * 编辑工作流
   */
  const handleEditWorkflow = async (values: any) => {
    if (!selectedWorkflow) return;
    
    try {
      const updatedWorkflow: WorkflowDefinition = {
        ...selectedWorkflow,
        name: values.name,
        description: values.description,
        metadata: {
          ...selectedWorkflow.metadata,
          updatedAt: new Date(),
          tags: values.tags || [],
          category: values.category || selectedWorkflow.metadata.category,
          complexity: values.complexity || selectedWorkflow.metadata.complexity
        }
      };
      
      await workflowEngine.updateWorkflow(selectedWorkflow.id, updatedWorkflow);
      
      setEditModalVisible(false);
      editForm.resetFields();
      setSelectedWorkflow(null);
      
      if (onWorkflowEdit) {
        onWorkflowEdit(updatedWorkflow);
      }
    } catch (error) {
      console.error('编辑工作流失败:', error);
      message.error('编辑工作流失败');
    }
  };

  /**
   * 删除工作流
   */
  const handleDeleteWorkflow = async (workflowId: string) => {
    try {
      await workflowEngine.deleteWorkflow(workflowId);
    } catch (error) {
      console.error('删除工作流失败:', error);
      message.error('删除工作流失败');
    }
  };

  /**
   * 执行工作流
   */
  const handleExecuteWorkflow = async (workflowId: string, inputs?: Record<string, any>) => {
    try {
      const execution = await workflowEngine.executeWorkflow(workflowId, inputs);
      setSelectedExecution(execution);
      setExecutionDrawerVisible(true);
    } catch (error) {
      console.error('执行工作流失败:', error);
      message.error('执行工作流失败');
    }
  };

  /**
   * 复制工作流
   */
  const handleCopyWorkflow = async (workflow: WorkflowDefinition) => {
    try {
      const copiedWorkflow: WorkflowDefinition = {
        ...workflow,
        id: `wf-${Date.now()}`,
        name: `${workflow.name} (副本)`,
        metadata: {
          ...workflow.metadata,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      };
      
      await workflowEngine.createWorkflow(copiedWorkflow);
    } catch (error) {
      console.error('复制工作流失败:', error);
      message.error('复制工作流失败');
    }
  };

  /**
   * 过滤工作流
   */
  const filteredWorkflows = useMemo(() => {
    let result = [...workflows];
    
    // 搜索文本过滤
    if (filter.searchText) {
      const searchLower = filter.searchText.toLowerCase();
      result = result.filter(wf => 
        wf.name.toLowerCase().includes(searchLower) ||
        wf.description.toLowerCase().includes(searchLower) ||
        wf.metadata.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }
    
    // 分类过滤
    if (filter.category && filter.category.length > 0) {
      result = result.filter(wf => filter.category!.includes(wf.metadata.category));
    }
    
    // 复杂度过滤
    if (filter.complexity && filter.complexity.length > 0) {
      result = result.filter(wf => filter.complexity!.includes(wf.metadata.complexity));
    }
    
    // 作者过滤
    if (filter.author && filter.author.length > 0) {
      result = result.filter(wf => filter.author!.includes(wf.metadata.author));
    }
    
    // 标签过滤
    if (filter.tags && filter.tags.length > 0) {
      result = result.filter(wf => 
        filter.tags!.some(tag => wf.metadata.tags.includes(tag))
      );
    }
    
    // 排序
    result.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortField) {
        case 'name':
          aValue = a.name;
          bValue = b.name;
          break;
        case 'createdAt':
          aValue = a.metadata.createdAt;
          bValue = b.metadata.createdAt;
          break;
        case 'updatedAt':
          aValue = a.metadata.updatedAt;
          bValue = b.metadata.updatedAt;
          break;
        case 'complexity':
          const complexityOrder = { simple: 1, medium: 2, complex: 3 };
          aValue = complexityOrder[a.metadata.complexity];
          bValue = complexityOrder[b.metadata.complexity];
          break;
        default:
          aValue = a.metadata.updatedAt;
          bValue = b.metadata.updatedAt;
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    
    return result;
  }, [workflows, filter, sortField, sortOrder]);

  /**
   * 分页数据
   */
  const paginatedWorkflows = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredWorkflows.slice(startIndex, endIndex);
  }, [filteredWorkflows, currentPage, pageSize]);

  /**
   * 渲染工作流状态标签
   */
  const renderStatusTag = (status: string) => {
    const statusConfig = {
      draft: { color: 'default', text: '草稿' },
      active: { color: 'success', text: '活跃' },
      paused: { color: 'warning', text: '暂停' },
      stopped: { color: 'default', text: '停止' },
      error: { color: 'error', text: '错误' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  /**
   * 渲染复杂度标签
   */
  const renderComplexityTag = (complexity: string) => {
    const complexityConfig = {
      simple: { color: 'green', text: '简单' },
      medium: { color: 'orange', text: '中等' },
      complex: { color: 'red', text: '复杂' }
    };
    
    const config = complexityConfig[complexity as keyof typeof complexityConfig] || complexityConfig.simple;
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  /**
   * 渲染工作流表格列
   */
  const workflowColumns = [
    {
      title: '工作流名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      render: (text: string, record: WorkflowDefinition) => (
        <div>
          <div style={{ fontWeight: 'bold', marginBottom: 4 }}>{text}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            版本: {record.version}
          </div>
        </div>
      )
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      width: 300,
      ellipsis: true
    },
    {
      title: '状态',
      key: 'status',
      width: 80,
      render: () => renderStatusTag('draft')
    },
    {
      title: '复杂度',
      dataIndex: ['metadata', 'complexity'],
      key: 'complexity',
      width: 80,
      render: (complexity: string) => renderComplexityTag(complexity)
    },
    {
      title: '分类',
      dataIndex: ['metadata', 'category'],
      key: 'category',
      width: 100,
      render: (category: string) => <Tag>{category}</Tag>
    },
    {
      title: '标签',
      dataIndex: ['metadata', 'tags'],
      key: 'tags',
      width: 200,
      render: (tags: string[]) => (
        <div>
          {tags.slice(0, 2).map(tag => (
            <Tag key={tag} size="small">{tag}</Tag>
          ))}
          {tags.length > 2 && (
            <Tag size="small">+{tags.length - 2}</Tag>
          )}
        </div>
      )
    },
    {
      title: '作者',
      dataIndex: ['metadata', 'author'],
      key: 'author',
      width: 100,
      render: (author: string) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Avatar size="small" icon={<UserOutlined />} style={{ marginRight: 8 }} />
          {author}
        </div>
      )
    },
    {
      title: '更新时间',
      dataIndex: ['metadata', 'updatedAt'],
      key: 'updatedAt',
      width: 120,
      render: (date: Date) => new Date(date).toLocaleDateString()
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      render: (_, record: WorkflowDefinition) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => {
                setSelectedWorkflow(record);
                setDetailDrawerVisible(true);
              }}
            />
          </Tooltip>
          
          <Tooltip title="编辑">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => {
                setSelectedWorkflow(record);
                editForm.setFieldsValue({
                  name: record.name,
                  description: record.description,
                  category: record.metadata.category,
                  complexity: record.metadata.complexity,
                  tags: record.metadata.tags
                });
                setEditModalVisible(true);
              }}
            />
          </Tooltip>
          
          <Tooltip title="执行">
            <Button
              type="text"
              size="small"
              icon={<PlayCircleOutlined />}
              onClick={() => handleExecuteWorkflow(record.id)}
            />
          </Tooltip>
          
          <Tooltip title="复制">
            <Button
              type="text"
              size="small"
              icon={<CopyOutlined />}
              onClick={() => handleCopyWorkflow(record)}
            />
          </Tooltip>
          
          <Popconfirm
            title="确定要删除这个工作流吗？"
            onConfirm={() => handleDeleteWorkflow(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Tooltip title="删除">
              <Button
                type="text"
                size="small"
                icon={<DeleteOutlined />}
                danger
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      )
    }
  ];

  /**
   * 渲染统计卡片
   */
  const renderStatisticsCards = () => (
    <Row gutter={16} style={{ marginBottom: 16 }}>
      <Col span={6}>
        <Card size="small">
          <Statistic
            title="总工作流"
            value={statistics.total}
            prefix={<BranchesOutlined />}
            valueStyle={{ color: '#1890ff' }}
          />
        </Card>
      </Col>
      <Col span={6}>
        <Card size="small">
          <Statistic
            title="活跃工作流"
            value={statistics.active}
            prefix={<PlayCircleOutlined />}
            valueStyle={{ color: '#52c41a' }}
          />
        </Card>
      </Col>
      <Col span={6}>
        <Card size="small">
          <Statistic
            title="总执行次数"
            value={statistics.totalExecutions}
            prefix={<RocketOutlined />}
            valueStyle={{ color: '#722ed1' }}
          />
        </Card>
      </Col>
      <Col span={6}>
        <Card size="small">
          <Statistic
            title="平均成功率"
            value={statistics.averageSuccessRate}
            suffix="%"
            prefix={<CheckCircleOutlined />}
            valueStyle={{ color: '#13c2c2' }}
          />
        </Card>
      </Col>
    </Row>
  );

  /**
   * 渲染工具栏
   */
  const renderToolbar = () => (
    <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <Space>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setCreateModalVisible(true)}
        >
          创建工作流
        </Button>
        
        <Button
          icon={<ImportOutlined />}
          onClick={() => setImportModalVisible(true)}
        >
          导入
        </Button>
        
        <Button
          icon={<ExportOutlined />}
          onClick={() => setExportModalVisible(true)}
        >
          导出
        </Button>
        
        <Button
          icon={<ReloadOutlined />}
          onClick={() => loadWorkflows()}
          loading={loading}
        >
          刷新
        </Button>
      </Space>
      
      <Space>
        <Search
          placeholder="搜索工作流..."
          allowClear
          style={{ width: 250 }}
          onSearch={(value) => setFilter(prev => ({ ...prev, searchText: value }))}
        />
        
        <Button
          icon={<FilterOutlined />}
          onClick={() => {/* 打开过滤器 */}}
        >
          过滤
        </Button>
        
        <Button
          icon={<BarChartOutlined />}
          onClick={() => setStatisticsDrawerVisible(true)}
        >
          统计
        </Button>
      </Space>
    </div>
  );

  /**
   * 渲染创建工作流模态框
   */
  const renderCreateModal = () => (
    <Modal
      title="创建新工作流"
      open={createModalVisible}
      onOk={() => createForm.submit()}
      onCancel={() => {
        setCreateModalVisible(false);
        createForm.resetFields();
      }}
      width={600}
      okText="创建"
      cancelText="取消"
    >
      <Form
        form={createForm}
        layout="vertical"
        onFinish={handleCreateWorkflow}
      >
        <Form.Item
          name="name"
          label="工作流名称"
          rules={[{ required: true, message: '请输入工作流名称' }]}
        >
          <Input placeholder="请输入工作流名称" />
        </Form.Item>
        
        <Form.Item
          name="description"
          label="描述"
          rules={[{ required: true, message: '请输入工作流描述' }]}
        >
          <TextArea rows={3} placeholder="请输入工作流描述" />
        </Form.Item>
        
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="category"
              label="分类"
              initialValue="general"
            >
              <Select>
                <Option value="general">通用</Option>
                <Option value="data-analysis">数据分析</Option>
                <Option value="automation">自动化</Option>
                <Option value="ai-ml">AI/ML</Option>
                <Option value="integration">集成</Option>
              </Select>
            </Form.Item>
          </Col>
          
          <Col span={12}>
            <Form.Item
              name="complexity"
              label="复杂度"
              initialValue="simple"
            >
              <Select>
                <Option value="simple">简单</Option>
                <Option value="medium">中等</Option>
                <Option value="complex">复杂</Option>
              </Select>
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
            <Option value="数据分析">数据分析</Option>
            <Option value="自动化">自动化</Option>
            <Option value="AI">AI</Option>
            <Option value="机器学习">机器学习</Option>
            <Option value="集成">集成</Option>
          </Select>
        </Form.Item>
        
        <Form.Item
          name="organization"
          label="组织"
        >
          <Input placeholder="请输入组织名称" />
        </Form.Item>
      </Form>
    </Modal>
  );

  /**
   * 渲染编辑工作流模态框
   */
  const renderEditModal = () => (
    <Modal
      title="编辑工作流"
      open={editModalVisible}
      onOk={() => editForm.submit()}
      onCancel={() => {
        setEditModalVisible(false);
        editForm.resetFields();
        setSelectedWorkflow(null);
      }}
      width={600}
      okText="保存"
      cancelText="取消"
    >
      <Form
        form={editForm}
        layout="vertical"
        onFinish={handleEditWorkflow}
      >
        <Form.Item
          name="name"
          label="工作流名称"
          rules={[{ required: true, message: '请输入工作流名称' }]}
        >
          <Input placeholder="请输入工作流名称" />
        </Form.Item>
        
        <Form.Item
          name="description"
          label="描述"
          rules={[{ required: true, message: '请输入工作流描述' }]}
        >
          <TextArea rows={3} placeholder="请输入工作流描述" />
        </Form.Item>
        
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="category"
              label="分类"
            >
              <Select>
                <Option value="general">通用</Option>
                <Option value="data-analysis">数据分析</Option>
                <Option value="automation">自动化</Option>
                <Option value="ai-ml">AI/ML</Option>
                <Option value="integration">集成</Option>
              </Select>
            </Form.Item>
          </Col>
          
          <Col span={12}>
            <Form.Item
              name="complexity"
              label="复杂度"
            >
              <Select>
                <Option value="simple">简单</Option>
                <Option value="medium">中等</Option>
                <Option value="complex">复杂</Option>
              </Select>
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
            <Option value="数据分析">数据分析</Option>
            <Option value="自动化">自动化</Option>
            <Option value="AI">AI</Option>
            <Option value="机器学习">机器学习</Option>
            <Option value="集成">集成</Option>
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );

  /**
   * 渲染工作流详情抽屉
   */
  const renderDetailDrawer = () => (
    <Drawer
      title="工作流详情"
      placement="right"
      width={800}
      open={detailDrawerVisible}
      onClose={() => {
        setDetailDrawerVisible(false);
        setSelectedWorkflow(null);
      }}
    >
      {selectedWorkflow && (
        <div>
          <Descriptions title="基本信息" bordered column={2}>
            <Descriptions.Item label="名称">{selectedWorkflow.name}</Descriptions.Item>
            <Descriptions.Item label="版本">{selectedWorkflow.version}</Descriptions.Item>
            <Descriptions.Item label="描述" span={2}>{selectedWorkflow.description}</Descriptions.Item>
            <Descriptions.Item label="分类">{selectedWorkflow.metadata.category}</Descriptions.Item>
            <Descriptions.Item label="复杂度">{renderComplexityTag(selectedWorkflow.metadata.complexity)}</Descriptions.Item>
            <Descriptions.Item label="作者">{selectedWorkflow.metadata.author}</Descriptions.Item>
            <Descriptions.Item label="组织">{selectedWorkflow.metadata.organization}</Descriptions.Item>
            <Descriptions.Item label="创建时间">{new Date(selectedWorkflow.metadata.createdAt).toLocaleString()}</Descriptions.Item>
            <Descriptions.Item label="更新时间">{new Date(selectedWorkflow.metadata.updatedAt).toLocaleString()}</Descriptions.Item>
          </Descriptions>
          
          <Divider />
          
          <Title level={4}>标签</Title>
          <div style={{ marginBottom: 16 }}>
            {selectedWorkflow.metadata.tags.map(tag => (
              <Tag key={tag} color="blue">{tag}</Tag>
            ))}
          </div>
          
          <Divider />
          
          <Title level={4}>节点信息</Title>
          <List
            dataSource={selectedWorkflow.nodes}
            renderItem={(node) => (
              <List.Item>
                <List.Item.Meta
                  avatar={<Avatar icon={<FunctionOutlined />} />}
                  title={node.name}
                  description={node.description}
                />
                <div>
                  <Tag color="green">{node.type}</Tag>
                  {node.capability && (
                    <Tag color="blue">{node.capability?.name || '未知能力'}</Tag>
                  )}
                </div>
              </List.Item>
            )}
          />
          
          <Divider />
          
          <Title level={4}>资源需求</Title>
          <Row gutter={16}>
            <Col span={6}>
              <Statistic title="CPU" value={selectedWorkflow.metadata.resourceRequirements.cpu} suffix="核" />
            </Col>
            <Col span={6}>
              <Statistic title="内存" value={selectedWorkflow.metadata.resourceRequirements.memory} suffix="MB" />
            </Col>
            <Col span={6}>
              <Statistic title="存储" value={selectedWorkflow.metadata.resourceRequirements?.storage || 0} suffix="MB" />
            </Col>
            <Col span={6}>
              <Statistic title="网络" value={selectedWorkflow.metadata.resourceRequirements?.network ? '需要' : '不需要'} />
            </Col>
          </Row>
        </div>
      )}
    </Drawer>
  );

  /**
   * 渲染执行监控抽屉
   */
  const renderExecutionDrawer = () => (
    <Drawer
      title="执行监控"
      placement="right"
      width={600}
      open={executionDrawerVisible}
      onClose={() => {
        setExecutionDrawerVisible(false);
        setSelectedExecution(null);
      }}
    >
      {selectedExecution && (
        <div>
          <Alert
            message={`执行状态: ${selectedExecution.status}`}
            type={selectedExecution.status === 'completed' ? 'success' : 
                  selectedExecution.status === 'failed' ? 'error' : 'info'}
            showIcon
            style={{ marginBottom: 16 }}
          />
          
          <Progress
            percent={selectedExecution.progress || 0}
            status={selectedExecution.status === 'failed' ? 'exception' : 'active'}
            style={{ marginBottom: 16 }}
          />
          
          <Descriptions bordered column={1}>
            <Descriptions.Item label="执行ID">{selectedExecution.id}</Descriptions.Item>
            <Descriptions.Item label="工作流ID">{selectedExecution.workflowId}</Descriptions.Item>
            <Descriptions.Item label="开始时间">{new Date(selectedExecution.startTime).toLocaleString()}</Descriptions.Item>
            {selectedExecution.endTime && (
              <Descriptions.Item label="结束时间">{new Date(selectedExecution.endTime).toLocaleString()}</Descriptions.Item>
            )}
            {selectedExecution.currentNode && (
              <Descriptions.Item label="当前节点">{selectedExecution.currentNode}</Descriptions.Item>
            )}
            {selectedExecution.error && (
              <Descriptions.Item label="错误信息">
                <Text type="danger">{selectedExecution.error}</Text>
              </Descriptions.Item>
            )}
          </Descriptions>
          
          <Divider />
          
          <Title level={4}>节点执行历史</Title>
          <Timeline>
            {selectedExecution.nodeExecutions.map((nodeExec, index) => (
              <Timeline.Item
                key={index}
                color={nodeExec.status === 'completed' ? 'green' : 
                       nodeExec.status === 'failed' ? 'red' : 'blue'}
                dot={nodeExec.status === 'completed' ? <CheckCircleOutlined /> :
                     nodeExec.status === 'failed' ? <CloseCircleOutlined /> :
                     <ClockCircleOutlined />}
              >
                <div>
                  <Text strong>{nodeExec.nodeId}</Text>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    {new Date(nodeExec.startTime).toLocaleString()} - 
                    {new Date(nodeExec.endTime).toLocaleString()}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    耗时: {nodeExec.duration}ms
                  </div>
                  {nodeExec.error && (
                    <div style={{ fontSize: '12px', color: 'red' }}>
                      错误: {nodeExec.error}
                    </div>
                  )}
                </div>
              </Timeline.Item>
            ))}
          </Timeline>
        </div>
      )}
    </Drawer>
  );

  /**
   * 渲染统计抽屉
   */
  const renderStatisticsDrawer = () => (
    <Drawer
      title="工作流统计"
      placement="right"
      width={500}
      open={statisticsDrawerVisible}
      onClose={() => setStatisticsDrawerVisible(false)}
    >
      <Row gutter={[16, 16]}>
        <Col span={12}>
          <Card size="small">
            <Statistic title="总工作流" value={statistics.total} />
          </Card>
        </Col>
        <Col span={12}>
          <Card size="small">
            <Statistic title="活跃工作流" value={statistics.active} />
          </Card>
        </Col>
        <Col span={12}>
          <Card size="small">
            <Statistic title="暂停工作流" value={statistics.paused} />
          </Card>
        </Col>
        <Col span={12}>
          <Card size="small">
            <Statistic title="错误工作流" value={statistics.error} />
          </Card>
        </Col>
      </Row>
      
      <Divider />
      
      <Title level={4}>分类分布</Title>
      <List
        dataSource={statistics.topCategories}
        renderItem={(item) => (
          <List.Item>
            <List.Item.Meta
              title={item.category}
              description={`${item.count} 个工作流`}
            />
            <Progress
              percent={(item.count / statistics.total) * 100}
              size="small"
              showInfo={false}
            />
          </List.Item>
        )}
      />
    </Drawer>
  );

  return (
    <div className="workflow-manager-v2">
      {/* 统计卡片 */}
      {renderStatisticsCards()}
      
      {/* 工具栏 */}
      {renderToolbar()}
      
      {/* 主要内容 */}
      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="工作流列表" key="workflows">
            <Table
              columns={workflowColumns}
              dataSource={paginatedWorkflows}
              rowKey="id"
              loading={loading}
              pagination={{
                current: currentPage,
                pageSize: pageSize,
                total: filteredWorkflows.length,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
                onChange: (page, size) => {
                  setCurrentPage(page);
                  setPageSize(size || 10);
                }
              }}
              scroll={{ x: 1200 }}
            />
          </TabPane>
          
          <TabPane tab="执行历史" key="executions">
            <List
              dataSource={executions}
              renderItem={(execution) => (
                <List.Item
                  actions={[
                    <Button
                      type="link"
                      onClick={() => {
                        setSelectedExecution(execution);
                        setExecutionDrawerVisible(true);
                      }}
                    >
                      查看详情
                    </Button>
                  ]}
                >
                  <List.Item.Meta
                    avatar={<Avatar icon={<RocketOutlined />} />}
                    title={`执行 ${execution.id}`}
                    description={`工作流: ${execution.workflowId} | 状态: ${execution.status} | 开始时间: ${new Date(execution.startTime).toLocaleString()}`}
                  />
                </List.Item>
              )}
              locale={{ emptyText: '暂无执行历史' }}
            />
          </TabPane>
        
        </Tabs>
      </Card>
      
      {/* 模态框和抽屉 */}
      {renderCreateModal()}
      {renderEditModal()}
      {renderDetailDrawer()}
      {renderExecutionDrawer()}
      {renderStatisticsDrawer()}
    </div>
  );
};

export default WorkflowManagerV2;