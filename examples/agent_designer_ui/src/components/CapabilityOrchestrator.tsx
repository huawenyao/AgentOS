/**
 * EFIAgent 2.0 能力编排器组件
 * 基于能力系统模型的智能化能力组合和调度系统
 * 支持任务规划、能力调度、协作协调、性能优化四大核心功能
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Card, Form, Select, Switch, Slider, InputNumber, Button, Space, 
  Tabs, Collapse, Tree, Table, Tag, Badge, Progress, Tooltip, 
  Modal, Input, Radio, Checkbox, Divider, Alert, Timeline,
  Drawer, List, Avatar, Statistic, Row, Col, message, Steps,
  Result, Empty, Spin, AutoComplete, Rate, Popconfirm, Typography
} from 'antd';

const { Text } = Typography;
import {
  ThunderboltOutlined, SettingOutlined, PlayCircleOutlined,
  PauseCircleOutlined, StopOutlined, ReloadOutlined,
  MonitorOutlined, BranchesOutlined,
  ClockCircleOutlined, CheckCircleOutlined, ExclamationCircleOutlined,
  InfoCircleOutlined, WarningOutlined, ApiOutlined,
  DatabaseOutlined, CloudOutlined, SecurityScanOutlined,
  LineChartOutlined, BarChartOutlined, PieChartOutlined,
  BulbOutlined, RocketOutlined, ExperimentOutlined, TeamOutlined,
  DashboardOutlined, InteractionOutlined, FunctionOutlined,
  CodeOutlined, BookOutlined, StarOutlined, CloseCircleOutlined,
  SyncOutlined, FireOutlined, NodeIndexOutlined, SearchOutlined
} from '@ant-design/icons';
import {
  OrchestrationConfig,
  CapabilityOrchestrationMode, OrchestrationRule,
  CapabilityMapping, ExecutionStrategy, OptimizationConfig,
  CoreCapabilityModule, CoreCapabilityType, CapabilityMaturityLevel,
  Agent2_0, TaskPlan, SubTask, TaskDependency, CapabilityAllocation, 
  CoordinationResult, OptimizationResult, Conflict, PerformanceEstimate,
  Improvement, OptimizationMetrics, TaskResourceAllocation
} from './CapabilitySystemTypes';
import './CapabilityOrchestrator.css';

const { TabPane } = Tabs;
const { Panel } = Collapse;
const { Option } = Select;
const { TextArea } = Input;

// 任务规划接口
// 本地接口定义已移至 CapabilitySystemTypes.ts

interface CapabilityOrchestratorProps {
  orchestrationConfig: OrchestrationConfig;
  capabilities: CoreCapabilityModule[];
  agent?: Agent2_0;
  onChange: (orchestrationConfig: OrchestrationConfig) => void;
  onTaskPlanChange?: (plan: TaskPlan) => void;
  onExecute?: () => void;
  onStop?: () => void;
  readonly?: boolean;
}

interface ExecutionStatus {
  isRunning: boolean;
  currentStep: string;
  progress: number;
  startTime?: Date;
  duration?: number;
  errors: string[];
  warnings: string[];
  metrics: {
    totalSteps: number;
    completedSteps: number;
    failedSteps: number;
    avgStepTime: number;
    throughput: number;
  }
}

const CapabilityOrchestrator: React.FC<CapabilityOrchestratorProps> = ({
  orchestrationConfig,
  capabilities,
  agent,
  onChange,
  onTaskPlanChange,
  onExecute,
  onStop,
  readonly = false
}) => {
  // 核心状态
  const [currentTaskPlan, setCurrentTaskPlan] = useState<TaskPlan | null>(null);
  const [capabilityAllocations, setCapabilityAllocations] = useState<CapabilityAllocation[]>([]);
  const [coordinationResult, setCoordinationResult] = useState<CoordinationResult | null>(null);
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResult | null>(null);
  
  // UI状态
  const [form] = Form.useForm();
  const [taskForm] = Form.useForm();
  const [optimizationForm] = Form.useForm();
  const [activeTab, setActiveTab] = useState('task-planning');
  const [executionStatus, setExecutionStatus] = useState<ExecutionStatus>({
    isRunning: false,
    currentStep: '',
    progress: 0,
    errors: [],
    warnings: [],
    metrics: {
      totalSteps: 0,
      completedSteps: 0,
      failedSteps: 0,
      avgStepTime: 0,
      throughput: 0
    }
  });
  const [ruleModalVisible, setRuleModalVisible] = useState(false);
  const [mappingModalVisible, setMappingModalVisible] = useState(false);
  const [taskPlanModalVisible, setTaskPlanModalVisible] = useState(false);
  const [optimizationModalVisible, setOptimizationModalVisible] = useState(false);
  const [selectedRule, setSelectedRule] = useState<OrchestrationRule | null>(null);
  const [selectedMapping, setSelectedMapping] = useState<CapabilityMapping | null>(null);
  const [selectedTask, setSelectedTask] = useState<SubTask | null>(null);
  const [monitoringDrawerVisible, setMonitoringDrawerVisible] = useState(false);
  
  /**
   * 初始化表单数据
   */
  useEffect(() => {
    form.setFieldsValue({
      name: orchestrationConfig.name,
      description: orchestrationConfig.description,
      mode: orchestrationConfig.mode,
      loadBalancing: orchestrationConfig.executionStrategy.loadBalancing,
      failover: orchestrationConfig.executionStrategy.failover,
      circuitBreakerEnabled: orchestrationConfig.executionStrategy.circuitBreaker.enabled,
      circuitBreakerFailureThreshold: orchestrationConfig.executionStrategy.circuitBreaker.failureThreshold,
      circuitBreakerRecoveryTimeout: orchestrationConfig.executionStrategy.circuitBreaker.recoveryTimeout,
      rateLimitEnabled: orchestrationConfig.executionStrategy.rateLimit.enabled,
      rateLimitRequestsPerSecond: orchestrationConfig.executionStrategy.rateLimit.requestsPerSecond,
      rateLimitBurstSize: orchestrationConfig.executionStrategy.rateLimit.burstSize,
      optimizationEnabled: orchestrationConfig.optimization.enabled,
      autoScalingEnabled: orchestrationConfig.optimization.autoScaling.enabled,
      autoScalingMinInstances: orchestrationConfig.optimization.autoScaling.minInstances,
      autoScalingMaxInstances: orchestrationConfig.optimization.autoScaling.maxInstances,
      autoScalingTargetCpuUtilization: orchestrationConfig.optimization.autoScaling.targetCpuUtilization,
      cachingEnabled: orchestrationConfig.optimization.caching.enabled,
      cachingStrategy: orchestrationConfig.optimization.caching.strategy,
      cachingMaxSize: orchestrationConfig.optimization.caching.maxSize,
      cachingTtl: orchestrationConfig.optimization.caching.ttl
    });
  }, [orchestrationConfig, form]);
  
  /**
   * 更新编排器配置
   */
  const updateOrchestrator = useCallback((updates: Partial<OrchestrationConfig>) => {
    const updatedOrchestrator = {
      ...orchestrationConfig,
      ...updates
    };
    onChange(updatedOrchestrator);
  }, [orchestrationConfig, onChange]);
  
  /**
   * 处理表单值变化
   */
  const handleFormChange = useCallback((changedValues: any, allValues: any) => {
    const updates: Partial<ICapabilityOrchestrator> = {};
    
    if ('name' in changedValues) updates.name = changedValues.name;
    if ('description' in changedValues) updates.description = changedValues.description;
    if ('mode' in changedValues) updates.mode = changedValues.mode;
    
    // 执行策略更新
    if (Object.keys(changedValues).some(key => key.startsWith('loadBalancing') || key.startsWith('failover') || key.startsWith('circuitBreaker') || key.startsWith('rateLimit'))) {
      updates.executionStrategy = {
        ...orchestrationConfig.executionStrategy,
        loadBalancing: allValues.loadBalancing || orchestrationConfig.executionStrategy.loadBalancing,
        failover: allValues.failover !== undefined ? allValues.failover : orchestrationConfig.executionStrategy.failover,
        circuitBreaker: {
          ...orchestrationConfig.executionStrategy.circuitBreaker,
          enabled: allValues.circuitBreakerEnabled !== undefined ? allValues.circuitBreakerEnabled : orchestrationConfig.executionStrategy.circuitBreaker.enabled,
          failureThreshold: allValues.circuitBreakerFailureThreshold || orchestrationConfig.executionStrategy.circuitBreaker.failureThreshold,
          recoveryTimeout: allValues.circuitBreakerRecoveryTimeout || orchestrationConfig.executionStrategy.circuitBreaker.recoveryTimeout
        },
        rateLimit: {
          ...orchestrationConfig.executionStrategy.rateLimit,
          enabled: allValues.rateLimitEnabled !== undefined ? allValues.rateLimitEnabled : orchestrationConfig.executionStrategy.rateLimit.enabled,
          requestsPerSecond: allValues.rateLimitRequestsPerSecond || orchestrationConfig.executionStrategy.rateLimit.requestsPerSecond,
          burstSize: allValues.rateLimitBurstSize || orchestrationConfig.executionStrategy.rateLimit.burstSize
        }
      };
    }
    
    // 优化配置更新
    if (Object.keys(changedValues).some(key => key.startsWith('optimization') || key.startsWith('autoScaling') || key.startsWith('caching'))) {
      updates.optimization = {
        ...orchestrationConfig.optimization,
        enabled: allValues.optimizationEnabled !== undefined ? allValues.optimizationEnabled : orchestrationConfig.optimization.enabled,
        autoScaling: {
          ...orchestrationConfig.optimization.autoScaling,
          enabled: allValues.autoScalingEnabled !== undefined ? allValues.autoScalingEnabled : orchestrationConfig.optimization.autoScaling.enabled,
          minInstances: allValues.autoScalingMinInstances || orchestrationConfig.optimization.autoScaling.minInstances,
          maxInstances: allValues.autoScalingMaxInstances || orchestrationConfig.optimization.autoScaling.maxInstances,
          targetCpuUtilization: allValues.autoScalingTargetCpuUtilization || orchestrationConfig.optimization.autoScaling.targetCpuUtilization
        },
        caching: {
          ...orchestrationConfig.optimization.caching,
          enabled: allValues.cachingEnabled !== undefined ? allValues.cachingEnabled : orchestrationConfig.optimization.caching.enabled,
          strategy: allValues.cachingStrategy || orchestrationConfig.optimization.caching.strategy,
          maxSize: allValues.cachingMaxSize || orchestrationConfig.optimization.caching.maxSize,
          ttl: allValues.cachingTtl || orchestrationConfig.optimization.caching.ttl
        }
      };
    }
    
    if (Object.keys(updates).length > 0) {
      updateOrchestrator(updates);
    }
  }, [orchestrationConfig, updateOrchestrator]);
  
  /**
   * 添加编排规则
   */
  const handleAddRule = () => {
    setSelectedRule(null);
    setRuleModalVisible(true);
  };
  
  /**
   * 编辑编排规则
   */
  const handleEditRule = (rule: OrchestrationRule) => {
    setSelectedRule(rule);
    setRuleModalVisible(true);
  };
  
  /**
   * 保存编排规则
   */
  const handleSaveRule = (rule: OrchestrationRule) => {
    const updatedRules = selectedRule
      ? orchestrator.rules.map(r => r.id === selectedRule.id ? rule : r)
      : [...orchestrator.rules, rule];
    
    updateOrchestrator({ rules: updatedRules });
    setRuleModalVisible(false);
    setSelectedRule(null);
    message.success(selectedRule ? '规则更新成功' : '规则添加成功');
  };
  
  /**
   * 删除编排规则
   */
  const handleDeleteRule = (ruleId: string) => {
    const updatedRules = orchestrator.rules.filter(r => r.id !== ruleId);
    updateOrchestrator({ rules: updatedRules });
    message.success('规则删除成功');
  };
  
  /**
   * 添加能力映射
   */
  const handleAddMapping = () => {
    setSelectedMapping(null);
    setMappingModalVisible(true);
  };
  
  /**
   * 编辑能力映射
   */
  const handleEditMapping = (mapping: CapabilityMapping) => {
    setSelectedMapping(mapping);
    setMappingModalVisible(true);
  };
  
  /**
   * 保存能力映射
   */
  const handleSaveMapping = (mapping: CapabilityMapping) => {
    const updatedMappings = selectedMapping
      ? orchestrator.capabilityMapping.map(m => m.id === selectedMapping.id ? mapping : m)
      : [...orchestrator.capabilityMapping, mapping];
    
    updateOrchestrator({ capabilityMapping: updatedMappings });
    setMappingModalVisible(false);
    setSelectedMapping(null);
    message.success(selectedMapping ? '映射更新成功' : '映射添加成功');
  };
  
  /**
   * 删除能力映射
   */
  const handleDeleteMapping = (mappingId: string) => {
    const updatedMappings = orchestrator.capabilityMapping.filter(m => m.id !== mappingId);
    updateOrchestrator({ capabilityMapping: updatedMappings });
    message.success('映射删除成功');
  };

  /**
   * 分析协作关系
   */
  const handleAnalyzeCollaboration = useCallback(async () => {
    try {
      setExecutionStatus(prev => ({ ...prev, isRunning: true, currentStep: '分析协作关系' }));
      
      // 模拟分析过程
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 生成协调结果
      const result: CoordinationResult = {
        success: true,
        coordinatedCapabilities: capabilities.slice(0, 3).map(cap => cap.id),
        conflictResolutions: [
          {
            conflictType: 'resource_competition',
            resolution: 'priority_based_allocation',
            affectedCapabilities: [capabilities[0]?.id || '', capabilities[1]?.id || '']
          }
        ],
        estimatedPerformance: {
          totalDuration: Math.floor(Math.random() * 500) + 200,
          resourceUtilization: Math.floor(Math.random() * 30) + 70,
          throughput: Math.floor(Math.random() * 100) + 50
        }
      };
      
      setCoordinationResult(result);
      message.success('协作关系分析完成');
    } catch (error) {
      message.error('协作关系分析失败');
    } finally {
      setExecutionStatus(prev => ({ ...prev, isRunning: false, currentStep: '' }));
    }
  }, [capabilities]);

  /**
   * 执行协调策略
   */
  const handleExecuteCoordination = useCallback(async () => {
    if (!coordinationResult) {
      message.warning('请先分析协作关系');
      return;
    }
    
    try {
      setExecutionStatus(prev => ({ ...prev, isRunning: true, currentStep: '执行协调策略' }));
      
      // 模拟执行过程
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      message.success('协调策略执行完成');
    } catch (error) {
      message.error('协调策略执行失败');
    } finally {
      setExecutionStatus(prev => ({ ...prev, isRunning: false, currentStep: '' }));
    }
  }, [coordinationResult]);
  
  /**
   * 执行编排
   */
  const handleExecute = () => {
    if (onExecute) {
      setExecutionStatus(prev => ({
        ...prev,
        isRunning: true,
        startTime: new Date(),
        progress: 0,
        currentStep: '初始化编排器',
        errors: [],
        warnings: []
      }));
      onExecute();
    }
  };

  /**
   * 停止执行
   */
  const handleStop = () => {
    if (onStop) {
      onStop();
    }
    setExecutionStatus(prev => ({
      ...prev,
      isRunning: false,
      currentStep: '执行已停止'
    }));
  };

  /**
   * 生成智能任务计划
   */
  const generateIntelligentPlan = async () => {
    try {
      // 模拟AI生成任务计划
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const aiGeneratedPlan: TaskPlan = {
        id: `ai-task-${Date.now()}`,
        name: 'AI生成的智能任务计划',
        description: '基于当前能力和需求自动生成的优化任务计划',
        tasks: [
          {
            id: 'task-1',
            name: '数据预处理',
            description: '清洗和准备输入数据',
            requiredCapabilities: [capabilities[0]?.id || 'cap-1'],
            inputs: { data: 'raw_data' },
            outputs: { processed_data: 'cleaned_data' },
            estimatedDuration: 15,
            status: 'pending'
          },
          {
            id: 'task-2',
            name: '模型推理',
            description: '执行AI模型推理',
            requiredCapabilities: [capabilities[1]?.id || 'cap-2'],
            inputs: { processed_data: 'cleaned_data' },
            outputs: { inference_result: 'predictions' },
            estimatedDuration: 30,
            status: 'pending'
          },
          {
            id: 'task-3',
            name: '结果后处理',
            description: '处理和格式化输出结果',
            requiredCapabilities: [capabilities[2]?.id || 'cap-3'],
            inputs: { inference_result: 'predictions' },
            outputs: { final_result: 'formatted_output' },
            estimatedDuration: 10,
            status: 'pending'
          }
        ],
        dependencies: [
          {
            sourceTaskId: 'task-1',
            targetTaskId: 'task-2',
            type: 'sequential',
            condition: 'task-1 completed successfully'
          },
          {
            sourceTaskId: 'task-2',
            targetTaskId: 'task-3',
            type: 'sequential',
            condition: 'task-2 completed successfully'
          }
        ],
        estimatedDuration: 55,
        priority: 'high',
        status: 'pending'
      };
      
      setCurrentTaskPlan(aiGeneratedPlan);
      if (onTaskPlanChange) {
        onTaskPlanChange(aiGeneratedPlan);
      }
      message.success('AI智能任务计划生成成功');
    } catch (error) {
      message.error('AI任务计划生成失败');
    }
  };

  /**
   * 刷新能力状态
   */
  const refreshCapabilityStatus = async () => {
    try {
      // 模拟刷新能力状态
      await new Promise(resolve => setTimeout(resolve, 1000));
      message.success('能力状态刷新成功');
    } catch (error) {
      message.error('能力状态刷新失败');
    }
  };

  /**
   * 执行能力调度
   */
  const executeScheduling = async () => {
    if (!currentTaskPlan) {
      message.warning('请先创建任务计划');
      return;
    }

    try {
      // 模拟执行调度
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 生成调度结果
      const newAllocations: CapabilityAllocation[] = currentTaskPlan.tasks.map(task => ({
        taskId: task.id,
        capabilityId: task.requiredCapabilities[0] || 'default-cap',
        instanceId: `instance-${task.id}`,
        priority: currentTaskPlan.priority === 'critical' ? 4 : currentTaskPlan.priority === 'high' ? 3 : currentTaskPlan.priority === 'medium' ? 2 : 1,
        estimatedCost: Math.random() * 100,
        resourceAllocation: {
          cpu: Math.floor(Math.random() * 80) + 20,
          memory: Math.floor(Math.random() * 80) + 20
        }
      }));
      
      setCapabilityAllocations(newAllocations);
      
      const result: CoordinationResult = {
        success: true,
        allocations: newAllocations,
        conflicts: [],
        recommendations: [
          '建议增加CPU资源以提高处理速度',
          '可以考虑并行执行部分任务以减少总时间'
        ],
        estimatedPerformance: {
          throughput: 1250,
          resourceUtilization: 75,
          totalDuration: currentTaskPlan.estimatedDuration * 60 * 1000,
          costEstimate: newAllocations.reduce((sum, alloc) => sum + alloc.estimatedCost, 0)
        }
      };
      
      setCoordinationResult(result);
      message.success('能力调度执行成功');
    } catch (error) {
      message.error('能力调度执行失败');
    }
  };

  /**
   * 获取能力名称
   */
  const getCapabilityName = (capabilityId: string): string => {
    const capability = capabilities.find(c => c.id === capabilityId);
    return capability?.name || capabilityId;
  };

  /**
   * 获取任务名称
   */
  const getTaskName = (taskId: string): string => {
    const task = currentTaskPlan?.tasks.find(t => t.id === taskId);
    return task?.name || taskId;
  };

  /**
   * 获取能力图标
   */
  const getCapabilityIcon = (type: CoreCapabilityType) => {
    switch (type) {
      case 'cognitive': return <BulbOutlined />;
      case 'reasoning': return <FunctionOutlined />;
      case 'decision': return <ThunderboltOutlined />;
      case 'learning': return <BookOutlined />;
      default: return <StarOutlined />;
    }
  };

  /**
   * 获取能力类型颜色
   */
  const getCapabilityTypeColor = (type: CoreCapabilityType): string => {
    switch (type) {
      case 'cognitive': return 'blue';
      case 'reasoning': return 'green';
      case 'decision': return 'orange';
      case 'learning': return 'purple';
      default: return 'default';
    }
  };

  /**
   * 获取成熟度颜色
   */
  const getMaturityColor = (level: CapabilityMaturityLevel): string => {
    switch (level) {
      case CapabilityMaturityLevel.INITIAL: return 'red';
      case CapabilityMaturityLevel.MANAGED: return 'orange';
      case CapabilityMaturityLevel.DEFINED: return 'blue';
      case CapabilityMaturityLevel.QUANTIFIED: return 'green';
      case CapabilityMaturityLevel.OPTIMIZED: return 'purple';
      default: return 'default';
    }
  };

  /**
   * 获取冲突警告类型
   */
  const getConflictAlertType = (severity: string) => {
    switch (severity) {
      case 'critical': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'success';
      default: return 'info';
    }
  };
  
  /**
   * 渲染编排模式配置
   */
  const renderModeConfig = () => {
    return (
      <Card title="编排模式" >
        <Form.Item name="mode" label="执行模式">
          <Select disabled={readonly}>
            <Option value={CapabilityOrchestrationMode.SEQUENTIAL}>顺序执行</Option>
            <Option value={CapabilityOrchestrationMode.PARALLEL}>并行执行</Option>
            <Option value={CapabilityOrchestrationMode.CONDITIONAL}>条件执行</Option>
            <Option value={CapabilityOrchestrationMode.PIPELINE}>流水线执行</Option>

            <Option value={CapabilityOrchestrationMode.ADAPTIVE}>自适应执行</Option>
          </Select>
        </Form.Item>
        
        <Alert
          message="编排模式说明"
          description={
            <div>
              <p><strong>顺序执行:</strong> 按照预定义顺序依次执行能力</p>
              <p><strong>并行执行:</strong> 同时执行多个独立的能力</p>
              <p><strong>条件执行:</strong> 根据条件判断选择执行路径</p>
              <p><strong>流水线执行:</strong> 能力间形成数据流水线</p>
              <p><strong>事件驱动:</strong> 基于事件触发能力执行</p>
              <p><strong>自适应执行:</strong> 根据运行时状态动态调整执行策略</p>
            </div>
          }
          type="info"
          showIcon
        />
      </Card>
    );
  }
  
  /**
   * 渲染执行策略配置
   */
  const renderExecutionStrategy = () => {
    return (
      <Card title="执行策略" >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="loadBalancing" label="负载均衡">
              <Select disabled={readonly}>
                <Option value="round_robin">轮询</Option>
                <Option value="least_connections">最少连接</Option>
                <Option value="weighted_round_robin">加权轮询</Option>
                <Option value="random">随机</Option>
                <Option value="hash">哈希</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="failover" label="故障转移" valuePropName="checked">
              <Switch disabled={readonly} />
            </Form.Item>
          </Col>
        </Row>
        
        <Divider orientation="left" orientationMargin="0">熔断器配置</Divider>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item name="circuitBreakerEnabled" label="启用熔断器" valuePropName="checked">
              <Switch disabled={readonly} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="circuitBreakerFailureThreshold" label="失败阈值">
              <InputNumber min={1} max={100} disabled={readonly} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="circuitBreakerRecoveryTimeout" label="恢复超时(ms)">
              <InputNumber min={1000} max={300000} step={1000} disabled={readonly} />
            </Form.Item>
          </Col>
        </Row>
        
        <Divider orientation="left" orientationMargin="0">限流配置</Divider>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item name="rateLimitEnabled" label="启用限流" valuePropName="checked">
              <Switch disabled={readonly} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="rateLimitRequestsPerSecond" label="每秒请求数">
              <InputNumber min={1} max={10000} disabled={readonly} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="rateLimitBurstSize" label="突发大小">
              <InputNumber min={1} max={1000} disabled={readonly} />
            </Form.Item>
          </Col>
        </Row>
      </Card>
    );
  }
  
  /**
   * 渲染优化配置
   */
  const renderOptimizationConfig = () => {
    return (
      <Card title="性能优化" >
        <Form.Item name="optimizationEnabled" label="启用优化" valuePropName="checked">
          <Switch disabled={readonly} />
        </Form.Item>
        
        <Divider orientation="left" orientationMargin="0">自动扩缩容</Divider>
        <Row gutter={16}>
          <Col span={6}>
            <Form.Item name="autoScalingEnabled" label="启用" valuePropName="checked">
              <Switch disabled={readonly} />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name="autoScalingMinInstances" label="最小实例">
              <InputNumber min={1} max={100} disabled={readonly} />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name="autoScalingMaxInstances" label="最大实例">
              <InputNumber min={1} max={1000} disabled={readonly} />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name="autoScalingTargetCpuUtilization" label="目标CPU(%)">
              <InputNumber min={10} max={90} disabled={readonly} />
            </Form.Item>
          </Col>
        </Row>
        
        <Divider orientation="left" orientationMargin="0">缓存配置</Divider>
        <Row gutter={16}>
          <Col span={6}>
            <Form.Item name="cachingEnabled" label="启用缓存" valuePropName="checked">
              <Switch disabled={readonly} />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name="cachingStrategy" label="策略">
              <Select disabled={readonly}>
                <Option value="lru">LRU</Option>
                <Option value="lfu">LFU</Option>
                <Option value="fifo">FIFO</Option>
                <Option value="ttl">TTL</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name="cachingMaxSize" label="最大大小">
              <InputNumber min={100} max={100000} disabled={readonly} />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name="cachingTtl" label="TTL(秒)">
              <InputNumber min={60} max={86400} disabled={readonly} />
            </Form.Item>
          </Col>
        </Row>
      </Card>
    );
  }
  
  /**
   * 渲染编排规则表格
   */
  const renderRulesTable = () => {
    const columns = [
      {
        title: '规则名称',
        dataIndex: 'name',
        key: 'name',
        render: (text: string, record: OrchestrationRule) => (
          <div>
            <strong>{text}</strong>
            <br />
            <small style={{ color: '#666' }}>{record.description}</small>
          </div>
        )
      },
      {
        title: '类型',
        dataIndex: 'type',
        key: 'type',
        render: (type: string) => (
          <Tag color={type === 'condition' ? 'blue' : type === 'trigger' ? 'green' : 'orange'}>
            {type === 'condition' ? '条件' : type === 'trigger' ? '触发器' : '过滤器'}
          </Tag>
        )
      },
      {
        title: '优先级',
        dataIndex: 'priority',
        key: 'priority',
        render: (priority: number) => (
          <Badge 
            count={priority} 
            style={{ backgroundColor: priority > 5 ? '#f50' : priority > 3 ? '#fa8c16' : '#52c41a' }}
          />
        )
      },
      {
        title: '状态',
        dataIndex: 'enabled',
        key: 'enabled',
        render: (enabled: boolean) => (
          <Badge status={enabled ? 'success' : 'default'} text={enabled ? '启用' : '禁用'} />
        )
      },
      {
        title: '操作',
        key: 'actions',
        render: (_: any, record: OrchestrationRule) => (
          <Space>
            <Button  onClick={() => handleEditRule(record)} disabled={readonly}>
              编辑
            </Button>
            <Button  danger onClick={() => handleDeleteRule(record.id)} disabled={readonly}>
              删除
            </Button>
          </Space>
        )
      }
    ];
    
    return (
      <Card 
        title="编排规则" 
        
        extra={
          !readonly && (
            <Button type="primary"  onClick={handleAddRule}>
              添加规则
            </Button>
          )
        }
      >
        <Table
          columns={columns}
          dataSource={orchestrator.rules}
          rowKey="id"
          
          pagination={false}
        />
      </Card>
    );
  }
  
  /**
   * 渲染能力映射表格
   */
  const renderMappingTable = () => {
    const columns = [
      {
        title: '映射名称',
        dataIndex: 'name',
        key: 'name',
        render: (text: string, record: CapabilityMapping) => (
          <div>
            <strong>{text}</strong>
            <br />
            <small style={{ color: '#666' }}>{record.description}</small>
          </div>
        )
      },
      {
        title: '源能力',
        dataIndex: 'sourceCapabilityId',
        key: 'sourceCapabilityId',
        render: (id: string) => (
          <Tag color="blue">{getCapabilityName(id)}</Tag>
        )
      },
      {
        title: '目标能力',
        dataIndex: 'targetCapabilityId',
        key: 'targetCapabilityId',
        render: (id: string) => (
          <Tag color="green">{getCapabilityName(id)}</Tag>
        )
      },
      {
        title: '映射类型',
        dataIndex: 'mappingType',
        key: 'mappingType',
        render: (type: string) => (
          <Tag color={type === 'direct' ? 'blue' : type === 'transform' ? 'orange' : 'purple'}>
            {type === 'direct' ? '直接映射' : type === 'transform' ? '转换映射' : '聚合映射'}
          </Tag>
        )
      },
      {
        title: '状态',
        dataIndex: 'enabled',
        key: 'enabled',
        render: (enabled: boolean) => (
          <Badge status={enabled ? 'success' : 'default'} text={enabled ? '启用' : '禁用'} />
        )
      },
      {
        title: '操作',
        key: 'actions',
        render: (_: any, record: CapabilityMapping) => (
          <Space>
            <Button  onClick={() => handleEditMapping(record)} disabled={readonly}>
              编辑
            </Button>
            <Button  danger onClick={() => handleDeleteMapping(record.id)} disabled={readonly}>
              删除
            </Button>
          </Space>
        )
      }
    ];
    
    return (
      <Card 
        title="能力映射" 
        
        extra={
          !readonly && (
            <Button type="primary"  onClick={handleAddMapping}>
              添加映射
            </Button>
          )
        }
      >
        <Table
          columns={columns}
          dataSource={orchestrator.capabilityMapping}
          rowKey="id"
          
          pagination={false}
        />
      </Card>
    );
  }

  /**
   * 渲染执行状态
   */
  const renderExecutionStatus = () => {
    return (
      <Card title="执行状态" >
        <Row gutter={[16, 16]}>
          <Col span={6}>
            <Statistic
              title="执行状态"
              value={executionStatus.isRunning ? '运行中' : '已停止'}
              valueStyle={{ color: executionStatus.isRunning ? '#3f8600' : '#cf1322' }}
              prefix={executionStatus.isRunning ? <PlayCircleOutlined /> : <StopOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="当前步骤"
              value={executionStatus.currentStep || '无'}
              prefix={<ClockCircleOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="执行进度"
              value={executionStatus.progress}
              suffix="%"
              prefix={<BarChartOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="运行时长"
              value={executionStatus.duration || 0}
              suffix="ms"
              prefix={<ClockCircleOutlined />}
            />
          </Col>
        </Row>

        <div style={{ marginTop: 16 }}>
          <Progress 
            percent={executionStatus.progress} 
            status={executionStatus.isRunning ? 'active' : 'normal'}
            strokeColor={{
              '0%': '#108ee9',
              '100%': '#87d068',
            }}
          />
        </div>

        {executionStatus.errors.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <h4>错误信息</h4>
            {executionStatus.errors.map((error, index) => (
              <Alert
                key={index}
                message={error}
                type="error"
                showIcon
                style={{ marginBottom: 8 }}
              />
            ))}
          </div>
        )}

        {executionStatus.warnings.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <h4>警告信息</h4>
            {executionStatus.warnings.map((warning, index) => (
              <Alert
                key={index}
                message={warning}
                type="warning"
                showIcon
                style={{ marginBottom: 8 }}
              />
            ))}
          </div>
        )}

        <div style={{ marginTop: 16 }}>
          <Space>
            <Button 
              type="primary" 
              icon={<PlayCircleOutlined />}
              onClick={handleExecute}
              disabled={readonly || executionStatus.isRunning}
            >
              开始执行
            </Button>
            <Button 
              icon={<StopOutlined />}
              onClick={handleStop}
              disabled={readonly || !executionStatus.isRunning}
            >
              停止执行
            </Button>
            <Button 
              icon={<ReloadOutlined />}
              onClick={() => {
                setExecutionStatus({
                  isRunning: false,
                  currentStep: '',
                  progress: 0,
                  errors: [],
                  warnings: [],
                  metrics: {
                    totalSteps: 0,
                    completedSteps: 0,
                    failedSteps: 0,
                    avgStepTime: 0,
                    throughput: 0
                  }
                });
              }}
              disabled={readonly}
            >
              重置状态
            </Button>
          </Space>
        </div>
      </Card>
    );
  }

  /**
   * 渲染性能指标
   */
  const renderMetrics = () => {
    return (
      <Card title="性能指标" >
        <Row gutter={[16, 16]}>
          <Col span={6}>
            <Statistic
              title="总步骤数"
              value={executionStatus.metrics.totalSteps}
              prefix={<NodeIndexOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="已完成"
              value={executionStatus.metrics.completedSteps}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="失败数"
              value={executionStatus.metrics.failedSteps}
              prefix={<CloseCircleOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="平均耗时"
              value={executionStatus.metrics.avgStepTime}
              suffix="ms"
              prefix={<ClockCircleOutlined />}
            />
          </Col>
        </Row>

        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col span={12}>
            <Statistic
              title="吞吐量"
              value={executionStatus.metrics.throughput}
              suffix="/s"
              prefix={<BarChartOutlined />}
            />
          </Col>
          <Col span={12}>
            <Statistic
              title="成功率"
              value={executionStatus.metrics.totalSteps > 0 ? 
                ((executionStatus.metrics.completedSteps / executionStatus.metrics.totalSteps) * 100).toFixed(1) : 0
              }
              suffix="%"
              prefix={<LineChartOutlined />}
              valueStyle={{ 
                color: executionStatus.metrics.totalSteps > 0 && 
                       (executionStatus.metrics.completedSteps / executionStatus.metrics.totalSteps) > 0.8 ? 
                       '#3f8600' : '#cf1322' 
              }}
            />
          </Col>
        </Row>

        <div style={{ marginTop: 16 }}>
          <h4>资源使用情况</h4>
          <Row gutter={[16, 16]}>
            <Col span={8}>
              <div>
                <span>CPU使用率</span>
                <Progress percent={65}  />
              </div>
            </Col>
            <Col span={8}>
              <div>
                <span>内存使用率</span>
                <Progress percent={78}  status="active" />
              </div>
            </Col>
            <Col span={8}>
              <div>
                <span>网络带宽</span>
                <Progress percent={45}  />
              </div>
            </Col>
          </Row>
        </div>
      </Card>
    );
  }
  
  /**
   * 渲染任务规划界面
   */
  const renderTaskPlanning = () => {
    return (
      <div className="task-planning-panel">
        <div className="task-planning-header">
          <Row justify="space-between" align="middle">
            <Col>
              <h3>智能任务规划</h3>
              <p>基于AI的复杂任务分解和执行计划生成</p>
            </Col>
            <Col>
              <Space>
                <Button 
                  type="primary" 
                  icon={<BulbOutlined />}
                  onClick={() => setTaskPlanModalVisible(true)}
                >
                  创建任务计划
                </Button>
                <Button 
                  icon={<RocketOutlined />}
                  onClick={() => message.info('AI智能规划功能开发中')}
                >
                  AI智能规划
                </Button>
              </Space>
            </Col>
          </Row>
        </div>

        {currentTaskPlan ? (
          <div className="task-plan-content">
            <Card title={currentTaskPlan?.name || '未命名任务计划'} extra={
              <Space>
                <Tag color={currentTaskPlan.status === 'completed' ? 'green' : currentTaskPlan.status === 'failed' ? 'red' : 'blue'}>
                  {currentTaskPlan.status}
                </Tag>
                <Tag color={currentTaskPlan.priority === 'critical' ? 'red' : currentTaskPlan.priority === 'high' ? 'orange' : 'blue'}>
                  {currentTaskPlan.priority}
                </Tag>
              </Space>
            }>
              <p>{currentTaskPlan.description}</p>
              
              <Row gutter={[16, 16]}>
                <Col span={8}>
                  <Statistic
                    title="子任务数量"
                    value={currentTaskPlan.tasks.length}
                    prefix={<NodeIndexOutlined />}
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title="预估时长"
                    value={currentTaskPlan.estimatedDuration}
                    suffix="分钟"
                    prefix={<ClockCircleOutlined />}
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title="依赖关系"
                    value={currentTaskPlan.dependencies.length}
                    prefix={<BranchesOutlined />}
                  />
                </Col>
              </Row>
            </Card>

            <div className="task-steps-container" style={{ marginTop: 16 }}>
              <h4>任务执行步骤</h4>
              <Steps
                direction="vertical"
                current={0}
                items={currentTaskPlan.tasks.map((task, index) => ({
                  title: task?.name || '未命名任务',
                  description: task.description,
                  status: task.status === 'completed' ? 'finish' : task.status === 'failed' ? 'error' : task.status === 'executing' ? 'process' : 'wait',
                  icon: <FunctionOutlined />
                }))}
              />
            </div>

            <div className="task-dependencies" style={{ marginTop: 16 }}>
              <h4>任务依赖关系</h4>
              <Timeline>
                {currentTaskPlan.dependencies.map((dep, index) => (
                  <Timeline.Item
                    key={index}
                    color={dep.type === 'sequential' ? 'blue' : dep.type === 'parallel' ? 'green' : 'orange'}
                    dot={<BranchesOutlined />}
                  >
                    <div>
                      <strong>{currentTaskPlan.tasks.find(t => t.id === dep.sourceTaskId)?.name || dep.sourceTaskId}</strong> → <strong>{currentTaskPlan.tasks.find(t => t.id === dep.targetTaskId)?.name || dep.targetTaskId}</strong>
                      <br />
                      <Tag>{dep.type}</Tag>
                      {dep.condition && <span className="dependency-condition">条件: {dep.condition}</span>}
                    </div>
                  </Timeline.Item>
                ))}
              </Timeline>
            </div>
          </div>
        ) : (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="暂无任务计划"
          >
            <Button 
              type="primary" 
              icon={<BulbOutlined />}
              onClick={() => setTaskPlanModalVisible(true)}
            >
              创建第一个任务计划
            </Button>
          </Empty>
        )}
      </div>
    );
  };

  /**
   * 渲染能力调度界面
   */
  const renderCapabilityScheduling = () => {
    return (
      <div className="capability-scheduling-panel">
        <div className="scheduling-header">
          <Row justify="space-between" align="middle">
            <Col>
              <h3>智能能力调度</h3>
              <p>基于需求匹配和资源优化的能力分配</p>
            </Col>
            <Col>
              <Space>
                <Button 
                  icon={<SyncOutlined />}
                  onClick={() => message.info('刷新能力状态')}
                >
                  刷新状态
                </Button>
                <Button 
                  type="primary"
                  icon={<ThunderboltOutlined />}
                  onClick={() => message.info('执行能力调度')}
                  disabled={!currentTaskPlan}
                >
                  执行调度
                </Button>
              </Space>
            </Col>
          </Row>
        </div>

        <Row gutter={[16, 16]}>
          <Col span={12}>
            <Card title="可用能力" >
              <List
                dataSource={capabilities}
                renderItem={(capability) => (
                  <List.Item
                    actions={[
                      <Button 
                         
                        type="link"
                        onClick={() => message.info(`查看${capability?.name || '未知能力'}详情`)}
                      >
                        详情
                      </Button>
                    ]}
                  >
                    <List.Item.Meta
                      avatar={<Avatar icon={<ThunderboltOutlined />} />}
                      title={capability?.name || '未知能力'}
                      description={
                        <Space>
                          <Tag color="blue">
                            {capability.type}
                          </Tag>
                          <Tag color="green">
                            {capability.maturityLevel}
                          </Tag>
                          <Rate disabled defaultValue={4} />
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            </Card>
          </Col>
          
          <Col span={12}>
            <Card title="能力分配" >
              {capabilityAllocations.length > 0 ? (
                <List
                  dataSource={capabilityAllocations}
                  renderItem={(allocation) => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={<Avatar icon={<ThunderboltOutlined />} />}
                        title={capabilities.find(c => c.id === allocation.capabilityId)?.name || allocation.capabilityId}
                        description={
                          <div>
                            <div>任务: {allocation.taskId}</div>
                            <div>优先级: <Tag>{allocation.priority}</Tag></div>
                            <div>预估成本: {allocation.estimatedCost}</div>
                            <Progress 
                              percent={allocation.resourceAllocation.cpu} 
                               
                              format={() => `CPU: ${allocation.resourceAllocation.cpu}%`}
                            />
                          </div>
                        }
                      />
                    </List.Item>
                  )}
                />
              ) : (
                <Empty description="暂无能力分配" />
              )}
            </Card>
          </Col>
        </Row>


      </div>
    );
  };

  /**
   * 渲染协作网络图
   */
  const renderCollaborationNetwork = () => {
    const networkData = {
      nodes: capabilities.slice(0, 6).map((cap, index) => ({
        id: cap.id,
        name: cap?.name || '未知能力',
        type: cap.type,
        status: index % 3 === 0 ? 'active' : index % 3 === 1 ? 'pending' : 'idle',
        x: 100 + (index % 3) * 120,
        y: 50 + Math.floor(index / 3) * 100
      })),
      edges: []
    };

    // 生成连接关系
    for (let i = 0; i < networkData.nodes.length - 1; i++) {
      networkData.edges.push({
        source: networkData.nodes[i].id,
        target: networkData.nodes[i + 1].id,
        type: 'data_flow'
      });
    }

    return (
      <div style={{ height: 280, border: '1px solid #d9d9d9', borderRadius: 6, padding: 16, background: '#fafafa', position: 'relative' }}>
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <Text strong>协作网络拓扑</Text>
          <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
            节点: {networkData.nodes.length} | 连接: {networkData.edges.length}
          </div>
        </div>
        
        <svg width="100%" height="200" style={{ overflow: 'visible' }}>
          {/* 渲染连接线 */}
          {networkData.edges.map((edge, index) => {
            const sourceNode = networkData.nodes.find(n => n.id === edge.source);
            const targetNode = networkData.nodes.find(n => n.id === edge.target);
            if (!sourceNode || !targetNode) return null;
            
            return (
              <g key={index}>
                <line
                  x1={sourceNode.x}
                  y1={sourceNode.y}
                  x2={targetNode.x}
                  y2={targetNode.y}
                  stroke="#1890ff"
                  strokeWidth="2"
                  strokeDasharray="5,5"
                  markerEnd="url(#arrowhead)"
                />
                <text
                  x={(sourceNode.x + targetNode.x) / 2}
                  y={(sourceNode.y + targetNode.y) / 2 - 5}
                  fontSize="10"
                  fill="#666"
                  textAnchor="middle"
                >
                  数据流
                </text>
              </g>
            );
          })}
          
          {/* 箭头标记 */}
          <defs>
            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="#1890ff" />
            </marker>
          </defs>
          
          {/* 渲染节点 */}
          {networkData.nodes.map((node, index) => (
            <g key={node.id}>
              <circle
                cx={node.x}
                cy={node.y}
                r="20"
                fill={node.status === 'active' ? '#52c41a' : node.status === 'pending' ? '#fa8c16' : '#d9d9d9'}
                stroke="#fff"
                strokeWidth="2"
              />
              <text
                x={node.x}
                y={node.y + 35}
                fontSize="11"
                fill="#262626"
                textAnchor="middle"
                fontWeight="500"
              >
                {(node?.name || '未知能力').length > 8 ? (node?.name || '未知能力').substring(0, 8) + '...' : (node?.name || '未知能力')}
              </text>
              <text
                x={node.x}
                y={node.y + 48}
                fontSize="9"
                fill="#8c8c8c"
                textAnchor="middle"
              >
                {node.status}
              </text>
            </g>
          ))}
        </svg>
        
        <div style={{ position: 'absolute', bottom: 8, right: 8, fontSize: 10, color: '#999' }}>
          <Space size={16}>
            <span><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#52c41a', marginRight: 4 }}></span>活跃</span>
            <span><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#fa8c16', marginRight: 4 }}></span>等待</span>
            <span><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#d9d9d9', marginRight: 4 }}></span>空闲</span>
          </Space>
        </div>
      </div>
    );
  };

  /**
   * 渲染协作协调界面
   */
  const renderCoordination = () => {
    return (
      <div className="coordination-panel">
        <div className="coordination-header">
          <Row justify="space-between" align="middle">
            <Col>
              <h3>协作协调</h3>
              <p>多能力协同工作的智能协调和冲突解决</p>
            </Col>
            <Col>
              <Space>
                <Button 
                  icon={<InteractionOutlined />}
                  onClick={handleAnalyzeCollaboration}
                  disabled={readonly}
                >
                  分析协作
                </Button>
                <Button 
                  type="primary"
                  icon={<TeamOutlined />}
                  onClick={handleExecuteCoordination}
                  disabled={readonly}
                >
                  执行协调
                </Button>
                <Button 
                  icon={<BarChartOutlined />}
                  onClick={() => setMonitoringDrawerVisible(true)}
                >
                  监控面板
                </Button>
              </Space>
            </Col>
          </Row>
        </div>

        <Row gutter={[16, 16]}>
          <Col span={14}>
            <Card title="协作网络"  extra={
              <Space>
                <Tag color="blue">实时更新</Tag>
                <Button  icon={<ReloadOutlined />} onClick={() => message.info('刷新网络状态')}>刷新</Button>
              </Space>
            }>
              {renderCollaborationNetwork()}
            </Card>
          </Col>
          
          <Col span={10}>
            <Card title="协调策略"  extra={
              <Button  type="link" onClick={() => message.info('配置策略')}>配置</Button>
            }>
              <List
                
                dataSource={[
                  { name: '资源竞争解决', status: 'active', description: '解决多个能力对同一资源的竞争', priority: 'high', conflicts: 2 },
                  { name: '数据流协调', status: 'pending', description: '协调能力间的数据传递', priority: 'medium', conflicts: 0 },
                  { name: '执行时序同步', status: 'active', description: '同步多个能力的执行时序', priority: 'high', conflicts: 1 },
                  { name: '故障恢复协调', status: 'inactive', description: '协调故障恢复过程', priority: 'low', conflicts: 0 },
                  { name: '负载均衡协调', status: 'active', description: '协调系统负载分配', priority: 'medium', conflicts: 0 }
                ]}
                renderItem={(strategy) => (
                  <List.Item actions={[
                    strategy.conflicts > 0 && (
                      <Badge count={strategy.conflicts} >
                        <ExclamationCircleOutlined style={{ color: '#fa541c' }} />
                      </Badge>
                    ),
                    <Tag color={strategy.priority === 'high' ? 'red' : strategy.priority === 'medium' ? 'orange' : 'green'} >
                      {strategy.priority === 'high' ? '高' : strategy.priority === 'medium' ? '中' : '低'}
                    </Tag>
                  ]}>
                    <List.Item.Meta
                      avatar={
                        <Badge 
                          status={strategy.status === 'active' ? 'success' : strategy.status === 'pending' ? 'processing' : 'default'}
                          dot
                        >
                          <Avatar  icon={<InteractionOutlined />} />
                        </Badge>
                      }
                      title={strategy?.name || '未命名策略'}
                      description={
                        <div>
                          <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>{strategy.description}</div>
                          {strategy.conflicts > 0 && (
                            <Text type="warning" style={{ fontSize: 11 }}>检测到 {strategy.conflicts} 个冲突</Text>
                          )}
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            </Card>
          </Col>
        </Row>

        <Card title="协调结果" style={{ marginTop: 16 }} extra={
          coordinationResult && (
            <Space>
              <Tag color={coordinationResult.success ? 'green' : 'red'}>
                {coordinationResult.success ? '协调成功' : '协调失败'}
              </Tag>
              <Text type="secondary" style={{ fontSize: 12 }}>
                更新时间: {new Date().toLocaleTimeString()}
              </Text>
            </Space>
          )
        }>
          {coordinationResult ? (
            <div>
              <Row gutter={[16, 16]}>
                <Col span={6}>
                  <Statistic
                    title="协调成功率"
                    value={coordinationResult.success ? 95 : 0}
                    suffix="%"
                    valueStyle={{ color: coordinationResult.success ? '#3f8600' : '#cf1322' }}
                    prefix={<TeamOutlined />}
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="资源利用率"
                    value={coordinationResult.estimatedPerformance.resourceUtilization}
                    suffix="%"
                    prefix={<DashboardOutlined />}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="协调延迟"
                    value={coordinationResult.estimatedPerformance.totalDuration}
                    suffix="ms"
                    prefix={<ClockCircleOutlined />}
                    valueStyle={{ color: '#fa8c16' }}
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="冲突解决数"
                    value={3}
                    prefix={<ExclamationCircleOutlined />}
                    valueStyle={{ color: '#722ed1' }}
                  />
                </Col>
              </Row>
              
              <Divider />
              
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Card title="协调时间线" >
                    <Timeline >
                      <Timeline.Item color="green" dot={<CheckCircleOutlined />}>
                        <div>
                          <Text strong>协调启动</Text>
                          <br />
                          <Text type="secondary" style={{ fontSize: 12 }}>开始分析协作关系和依赖</Text>
                        </div>
                      </Timeline.Item>
                      <Timeline.Item color="blue" dot={<SearchOutlined />}>
                        <div>
                          <Text strong>冲突检测</Text>
                          <br />
                          <Text type="secondary" style={{ fontSize: 12 }}>发现并分析 3 个潜在冲突</Text>
                        </div>
                      </Timeline.Item>
                      <Timeline.Item color="orange" dot={<SettingOutlined />}>
                        <div>
                          <Text strong>策略执行</Text>
                          <br />
                          <Text type="secondary" style={{ fontSize: 12 }}>应用资源竞争解决策略</Text>
                        </div>
                      </Timeline.Item>
                      <Timeline.Item color="green" dot={<CheckCircleOutlined />}>
                        <div>
                          <Text strong>协调完成</Text>
                          <br />
                          <Text type="secondary" style={{ fontSize: 12 }}>成功率 95%，延迟 {coordinationResult.estimatedPerformance.totalDuration}ms</Text>
                        </div>
                      </Timeline.Item>
                    </Timeline>
                  </Card>
                </Col>
                <Col span={12}>
                  <Card title="性能指标" >
                    <Space direction="vertical" style={{ width: '100%' }} size={12}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <Text style={{ fontSize: 12 }}>协调效率</Text>
                          <Text style={{ fontSize: 12, color: '#52c41a' }}>95%</Text>
                        </div>
                        <Progress 
                          percent={95} 
                           
                          status="success"
                          strokeColor="#52c41a"
                        />
                      </div>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <Text style={{ fontSize: 12 }}>资源优化</Text>
                          <Text style={{ fontSize: 12, color: '#1890ff' }}>{coordinationResult.estimatedPerformance.resourceUtilization}%</Text>
                        </div>
                        <Progress 
                          percent={coordinationResult.estimatedPerformance.resourceUtilization} 
                           
                          strokeColor="#1890ff"
                        />
                      </div>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <Text style={{ fontSize: 12 }}>响应速度</Text>
                          <Text style={{ fontSize: 12, color: '#fa8c16' }}>{Math.max(0, 100 - coordinationResult.estimatedPerformance.totalDuration / 10)}%</Text>
                        </div>
                        <Progress 
                          percent={Math.max(0, 100 - coordinationResult.estimatedPerformance.totalDuration / 10)} 
                           
                          strokeColor="#fa8c16"
                        />
                      </div>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <Text style={{ fontSize: 12 }}>稳定性</Text>
                          <Text style={{ fontSize: 12, color: '#722ed1' }}>88%</Text>
                        </div>
                        <Progress 
                          percent={88} 
                           
                          strokeColor="#722ed1"
                        />
                      </div>
                    </Space>
                  </Card>
                </Col>
              </Row>
            </div>
          ) : (
            <Empty 
              description="暂无协调结果" 
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            >
              <Button type="primary" onClick={handleAnalyzeCollaboration} disabled={readonly}>
                开始协调分析
              </Button>
            </Empty>
          )}
        </Card>
      </div>
    );
  };

  /**
   * 渲染性能优化界面
   */
  const renderOptimization = () => {
    return (
      <div className="optimization-panel">
        <div className="optimization-header">
          <Row justify="space-between" align="middle">
            <Col>
              <h3>性能优化</h3>
              <p>基于机器学习的智能性能优化和资源调度</p>
            </Col>
            <Col>
              <Space>
                <Button 
                  icon={<ExperimentOutlined />}
                  onClick={() => setOptimizationModalVisible(true)}
                >
                  优化配置
                </Button>
                <Button 
                  type="primary"
                  icon={<RocketOutlined />}
                  onClick={() => message.info('执行性能优化')}
                >
                  开始优化
                </Button>
              </Space>
            </Col>
          </Row>
        </div>

        <Row gutter={[16, 16]}>
          <Col span={12}>
            <Card title="优化策略" >
              <List
                dataSource={[
                  { name: '自动扩缩容', enabled: orchestrator.optimization.autoScaling.enabled, description: '根据负载自动调整实例数量' },
                  { name: '智能缓存', enabled: orchestrator.optimization.caching.enabled, description: '优化数据缓存策略' },
                  { name: '负载均衡', enabled: true, description: '智能分配请求负载' },
                  { name: '资源预测', enabled: false, description: '预测资源需求变化' }
                ]}
                renderItem={(strategy) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={<Avatar icon={<RocketOutlined />} />}
                      title={
                        <Space>
                          {strategy?.name || '未命名策略'}
                          <Switch  checked={strategy.enabled} disabled={readonly} />
                        </Space>
                      }
                      description={strategy.description}
                    />
                  </List.Item>
                )}
              />
            </Card>
          </Col>
          
          <Col span={12}>
            <Card title="优化指标" >
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Statistic
                    title="响应时间"
                    value={125}
                    suffix="ms"
                    prefix={<ClockCircleOutlined />}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="吞吐量"
                    value={1250}
                    suffix="/s"
                    prefix={<BarChartOutlined />}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="CPU利用率"
                    value={65}
                    suffix="%"
                    prefix={<DashboardOutlined />}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="内存使用"
                    value={78}
                    suffix="%"
                    prefix={<DatabaseOutlined />}
                  />
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>

        {optimizationResult && (
          <Card title="优化结果" style={{ marginTop: 16 }}>
            <Row gutter={[16, 16]}>
              <Col span={6}>
                <Statistic
                  title="性能提升"
                  value={optimizationResult.metrics.performanceGain}
                  suffix="%"
                  valueStyle={{ color: '#3f8600' }}
                  prefix={<LineChartOutlined />}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="成本降低"
                  value={optimizationResult.metrics.costReduction}
                  suffix="%"
                  valueStyle={{ color: '#3f8600' }}
                  prefix={<FireOutlined />}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="资源效率"
                  value={optimizationResult.metrics.resourceEfficiency}
                  suffix="%"
                  prefix={<DashboardOutlined />}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="可靠性提升"
                  value={optimizationResult.metrics.reliabilityImprovement}
                  suffix="%"
                  prefix={<SecurityScanOutlined />}
                />
              </Col>
            </Row>

            <div className="improvements-section" style={{ marginTop: 16 }}>
              <h4>改进详情</h4>
              <List
                dataSource={optimizationResult.improvements}
                renderItem={(improvement) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={<Avatar icon={<StarOutlined />} />}
                      title={
                        <Space>
                          {improvement.description}
                          <Tag color="green">+{improvement.impact}%</Tag>
                        </Space>
                      }
                      description={`类型: ${improvement.type}`}
                    />
                  </List.Item>
                )}
              />
            </div>
          </Card>
        )}
      </div>
    );
  };

  /**
   * 渲染任务计划模态框
   */
  const renderTaskPlanModal = () => {
    return (
      <Modal
        title="创建任务计划"
        open={taskPlanModalVisible}
        onCancel={() => setTaskPlanModalVisible(false)}
        onOk={() => {
          taskForm.validateFields().then(values => {
            const newTaskPlan: TaskPlan = {
              id: `task-${Date.now()}`,
              name: values.name,
              description: values.description,
              tasks: [],
              dependencies: [],
              estimatedDuration: values.estimatedDuration || 60,
              priority: values.priority || 'medium',
              status: 'pending'
            };
            setCurrentTaskPlan(newTaskPlan);
            if (onTaskPlanChange) {
              onTaskPlanChange(newTaskPlan);
            }
            setTaskPlanModalVisible(false);
            taskForm.resetFields();
            message.success('任务计划创建成功');
          });
        }}
        width={600}
      >
        <Form form={taskForm} layout="vertical">
          <Form.Item name="name" label="计划名称" rules={[{ required: true, message: '请输入计划名称' }]}>
            <Input placeholder="输入任务计划名称" />
          </Form.Item>
          <Form.Item name="description" label="计划描述">
            <TextArea rows={3} placeholder="输入任务计划描述" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="priority" label="优先级">
                <Select placeholder="选择优先级">
                  <Option value="low">低</Option>
                  <Option value="medium">中</Option>
                  <Option value="high">高</Option>
                  <Option value="critical">紧急</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="estimatedDuration" label="预估时长(分钟)">
                <InputNumber min={1} max={10080} placeholder="60" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    );
  };

  /**
   * 渲染优化配置模态框
   */
  const renderOptimizationModal = () => {
    return (
      <Modal
        title="优化配置"
        open={optimizationModalVisible}
        onCancel={() => setOptimizationModalVisible(false)}
        onOk={() => {
          optimizationForm.validateFields().then(values => {
            message.success('优化配置保存成功');
            setOptimizationModalVisible(false);
          });
        }}
        width={800}
      >
        <Form form={optimizationForm} layout="vertical">
          <h4>优化目标</h4>
          <Form.Item name="optimizationGoals" label="优化目标">
            <Checkbox.Group>
              <Row>
                <Col span={6}><Checkbox value="performance">性能优化</Checkbox></Col>
                <Col span={6}><Checkbox value="cost">成本优化</Checkbox></Col>
                <Col span={6}><Checkbox value="resource">资源优化</Checkbox></Col>
                <Col span={6}><Checkbox value="reliability">可靠性优化</Checkbox></Col>
              </Row>
            </Checkbox.Group>
          </Form.Item>
          
          <h4>优化策略</h4>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="optimizationStrategy" label="优化策略">
                <Select placeholder="选择优化策略">
                  <Option value="aggressive">激进优化</Option>
                  <Option value="balanced">平衡优化</Option>
                  <Option value="conservative">保守优化</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="optimizationInterval" label="优化间隔(分钟)">
                <InputNumber min={1} max={1440} placeholder="30" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          
          <h4>性能阈值</h4>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="maxResponseTime" label="最大响应时间(ms)">
                <InputNumber min={1} max={10000} placeholder="1000" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="minThroughput" label="最小吞吐量(/s)">
                <InputNumber min={1} max={100000} placeholder="100" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    );
  };

  /**
   * 渲染监控抽屉
   */
  const renderMonitoringDrawer = () => {
    return (
      <Drawer
        title="执行监控"
        placement="right"
        width={600}
        open={monitoringDrawerVisible}
        onClose={() => setMonitoringDrawerVisible(false)}
      >
        <div className="monitoring-content">
          <Timeline>
            <Timeline.Item color="green">
              <p>编排器初始化完成</p>
              <p style={{ color: '#666', fontSize: '12px' }}>2024-01-20 10:00:00</p>
            </Timeline.Item>
            <Timeline.Item color="blue">
              <p>开始执行能力编排</p>
              <p style={{ color: '#666', fontSize: '12px' }}>2024-01-20 10:00:01</p>
            </Timeline.Item>
            <Timeline.Item>
              <p>执行认知能力模块</p>
              <p style={{ color: '#666', fontSize: '12px' }}>2024-01-20 10:00:02</p>
            </Timeline.Item>
            <Timeline.Item>
              <p>执行推理能力模块</p>
              <p style={{ color: '#666', fontSize: '12px' }}>2024-01-20 10:00:05</p>
            </Timeline.Item>
            <Timeline.Item color="red">
              <p>决策能力模块执行失败</p>
              <p style={{ color: '#666', fontSize: '12px' }}>2024-01-20 10:00:08</p>
            </Timeline.Item>
            <Timeline.Item color="gray">
              <p>触发故障转移机制</p>
              <p style={{ color: '#666', fontSize: '12px' }}>2024-01-20 10:00:09</p>
            </Timeline.Item>
          </Timeline>
          
          <Divider />
          
          <div className="error-warnings">
            <h4>错误信息</h4>
            <List
              
              dataSource={[]}
              renderItem={error => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar icon={<ExclamationCircleOutlined />} style={{ backgroundColor: '#ff4d4f' }} />}
                    title="执行错误"
                    description={error}
                  />
                </List.Item>
              )}
            />
            
            <h4 style={{ marginTop: 16 }}>警告信息</h4>
            <List
              
              dataSource={[]}
              renderItem={(warning: string) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar icon={<WarningOutlined />} style={{ backgroundColor: '#faad14' }} />}
                    title="执行警告"
                    description={<span>{warning}</span>}
                  />
                </List.Item>
              )}
            />
          </div>
        </div>
      </Drawer>
    );
  }

  return (
    <div className="capability-orchestrator">
      <Form
        form={form}
        layout="vertical"
        onValuesChange={handleFormChange}
        disabled={readonly}
      >
        <div className="orchestrator-header">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="name" label="编排器名称" rules={[{ required: true }]}>
                <Input placeholder="输入编排器名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="description" label="描述">
                <Input placeholder="输入编排器描述" />
              </Form.Item>
            </Col>
          </Row>
        </div>
        
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab={<span><BulbOutlined />任务规划</span>} key="task-planning">
            <div className="task-planning-content">
              {renderTaskPlanning()}
            </div>
          </TabPane>
          
          <TabPane tab={<span><TeamOutlined />能力调度</span>} key="capability-scheduling">
            <div className="capability-scheduling-content">
              {renderCapabilityScheduling()}
            </div>
          </TabPane>
          
          <TabPane tab={<span><InteractionOutlined />协作协调</span>} key="coordination">
            <div className="coordination-content">
              {renderCoordination()}
            </div>
          </TabPane>
          
          <TabPane tab={<span><RocketOutlined />性能优化</span>} key="optimization">
            <div className="optimization-content">
              {renderOptimization()}
            </div>
          </TabPane>
          
          <TabPane tab={<span><SettingOutlined />基础配置</span>} key="config">
            <div className="config-content">
              {renderModeConfig()}
              <div style={{ marginTop: 16 }}>
                {renderExecutionStrategy()}
              </div>
              <div style={{ marginTop: 16 }}>
                {renderOptimizationConfig()}
              </div>
            </div>
          </TabPane>
          
          <TabPane tab={<span><BranchesOutlined />编排规则</span>} key="rules">
            <div className="rules-content">
              {renderRulesTable()}
            </div>
          </TabPane>
          
          <TabPane tab={<span><ApiOutlined />能力映射</span>} key="mapping">
            <div className="mapping-content">
              {renderMappingTable()}
            </div>
          </TabPane>
          
          <TabPane tab={<span><MonitorOutlined />执行监控</span>} key="monitoring">
            <div className="monitoring-content">
              {renderExecutionStatus()}
              <div style={{ marginTop: 16 }}>
                {renderMetrics()}
              </div>
            </div>
          </TabPane>
        </Tabs>
      </Form>
      
      {/* 监控抽屉 */}
      {renderMonitoringDrawer()}
      
      {/* 任务规划模态框 */}
      {renderTaskPlanModal()}
      
      {/* 优化配置模态框 */}
      {renderOptimizationModal()}
      
      {/* TODO: 添加规则编辑模态框 */}
      {/* TODO: 添加映射编辑模态框 */}
    </div>
  );
};

export default CapabilityOrchestrator;