/**
 * EFIAgent 2.0 工作流执行监控器
 * 提供实时执行状态监控、性能分析和历史记录功能
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Progress,
  Table,
  Timeline,
  Tag,
  Button,
  Select,
  DatePicker,
  Space,
  Tooltip,
  Alert,
  Tabs,
  List,
  Avatar,
  Badge,
  Drawer,
  Typography,
  Divider,
  Empty,
  Spin,
  Switch,
  Input,
  Modal,
  Descriptions,
  Chart
} from 'antd';
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  ThunderboltOutlined,
  BarChartOutlined,
  LineChartOutlined,
  EyeOutlined,
  ReloadOutlined,
  DownloadOutlined,
  FilterOutlined,
  SearchOutlined,
  SettingOutlined,
  DashboardOutlined,
  HistoryOutlined,
  WarningOutlined,
  InfoCircleOutlined,
  AreaChartOutlined,
  PieChartOutlined
} from '@ant-design/icons';
import { Line, Column, Pie, Area } from '@ant-design/plots';
import {
  WorkflowDefinition,
  WorkflowNode,
  WorkflowExecution
} from './CapabilitySystemTypes';

const { TabPane } = Tabs;
const { Text, Title } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

/**
 * 执行状态枚举
 */
export enum ExecutionStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  TIMEOUT = 'timeout'
}

/**
 * 节点执行状态
 */
export enum NodeStatus {
  WAITING = 'waiting',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  SKIPPED = 'skipped'
}

/**
 * 实时执行信息
 */
export interface LiveExecution {
  id: string;
  workflowId: string;
  workflowName: string;
  status: ExecutionStatus;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  progress: number;
  currentNode?: string;
  totalNodes: number;
  completedNodes: number;
  failedNodes: number;
  nodeStatuses: Record<string, NodeStatus>;
  metrics: ExecutionMetrics;
  logs: ExecutionLog[];
}

/**
 * 执行指标
 */
export interface ExecutionMetrics {
  cpuUsage: number;
  memoryUsage: number;
  networkIO: number;
  diskIO: number;
  throughput: number;
  errorRate: number;
  avgResponseTime: number;
  peakMemory: number;
}

/**
 * 执行日志
 */
export interface ExecutionLog {
  id: string;
  timestamp: Date;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  nodeId?: string;
  data?: any;
}

/**
 * 历史执行记录
 */
export interface ExecutionHistory {
  id: string;
  workflowId: string;
  workflowName: string;
  status: ExecutionStatus;
  startTime: Date;
  endTime: Date;
  duration: number;
  triggeredBy: string;
  version: string;
  nodeCount: number;
  successRate: number;
  errorCount: number;
  metrics: ExecutionMetrics;
}

/**
 * 性能统计
 */
export interface PerformanceStats {
  totalExecutions: number;
  successRate: number;
  avgDuration: number;
  peakConcurrency: number;
  errorRate: number;
  throughput: number;
  trends: {
    executions: Array<{ date: string; count: number }>;
    duration: Array<{ date: string; avg: number; min: number; max: number }>;
    success: Array<{ date: string; rate: number }>;
    errors: Array<{ date: string; count: number }>;
  };
}

/**
 * 监控器属性
 */
export interface WorkflowMonitorProps {
  visible: boolean;
  onClose: () => void;
  workflowId?: string;
}

/**
 * 工作流监控器组件
 */
export const WorkflowMonitor: React.FC<WorkflowMonitorProps> = ({
  visible,
  onClose,
  workflowId
}) => {
  // 状态管理
  const [activeTab, setActiveTab] = useState('live');
  const [liveExecutions, setLiveExecutions] = useState<LiveExecution[]>([]);
  const [executionHistory, setExecutionHistory] = useState<ExecutionHistory[]>([]);
  const [performanceStats, setPerformanceStats] = useState<PerformanceStats | null>(null);
  const [selectedExecution, setSelectedExecution] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(5000);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [dateRange, setDateRange] = useState<[Date, Date] | null>(null);
  const [searchText, setSearchText] = useState('');
  const [detailVisible, setDetailVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // 引用
  const refreshTimer = useRef<NodeJS.Timeout | null>(null);

  /**
   * 初始化数据
   */
  useEffect(() => {
    if (visible) {
      loadData();
      if (autoRefresh) {
        startAutoRefresh();
      }
    }
    
    return () => {
      stopAutoRefresh();
    };
  }, [visible, autoRefresh, refreshInterval]);

  /**
   * 加载数据
   */
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadLiveExecutions(),
        loadExecutionHistory(),
        loadPerformanceStats()
      ]);
    } catch (error) {
      console.error('加载监控数据失败:', error);
    } finally {
      setLoading(false);
    }
  }, [workflowId, dateRange, filterStatus]);

  /**
   * 加载实时执行数据
   */
  const loadLiveExecutions = async (): Promise<void> => {
    // 模拟实时执行数据
    const mockExecutions: LiveExecution[] = [
      {
        id: 'exec_001',
        workflowId: 'wf_001',
        workflowName: '客户服务工作流',
        status: ExecutionStatus.RUNNING,
        startTime: new Date(Date.now() - 300000),
        progress: 65,
        currentNode: 'node_003',
        totalNodes: 8,
        completedNodes: 5,
        failedNodes: 0,
        nodeStatuses: {
          'node_001': NodeStatus.COMPLETED,
          'node_002': NodeStatus.COMPLETED,
          'node_003': NodeStatus.RUNNING,
          'node_004': NodeStatus.WAITING
        },
        metrics: {
          cpuUsage: 45,
          memoryUsage: 512,
          networkIO: 1024,
          diskIO: 256,
          throughput: 150,
          errorRate: 0,
          avgResponseTime: 250,
          peakMemory: 768
        },
        logs: []
      },
      {
        id: 'exec_002',
        workflowId: 'wf_002',
        workflowName: '数据处理工作流',
        status: ExecutionStatus.COMPLETED,
        startTime: new Date(Date.now() - 600000),
        endTime: new Date(Date.now() - 60000),
        duration: 540000,
        progress: 100,
        totalNodes: 6,
        completedNodes: 6,
        failedNodes: 0,
        nodeStatuses: {
          'node_001': NodeStatus.COMPLETED,
          'node_002': NodeStatus.COMPLETED,
          'node_003': NodeStatus.COMPLETED
        },
        metrics: {
          cpuUsage: 0,
          memoryUsage: 0,
          networkIO: 0,
          diskIO: 0,
          throughput: 200,
          errorRate: 0,
          avgResponseTime: 180,
          peakMemory: 1024
        },
        logs: []
      }
    ];
    
    setLiveExecutions(mockExecutions);
  };

  /**
   * 渲染实时监控面板
   */
  const renderLiveMonitoring = () => (
    <div className="live-monitoring">
      <Row gutter={[16, 16]}>
        {/* 控制面板 */}
        <Col span={24}>
          <Card size="small">
            <Row justify="space-between" align="middle">
              <Col>
                <Space>
                  <Switch
                    checked={autoRefresh}
                    onChange={setAutoRefresh}
                    checkedChildren="自动刷新"
                    unCheckedChildren="手动刷新"
                  />
                  {autoRefresh && (
                    <Select
                      value={refreshInterval}
                      onChange={setRefreshInterval}
                      style={{ width: 120 }}
                    >
                      <Option value={1000}>1秒</Option>
                      <Option value={5000}>5秒</Option>
                      <Option value={10000}>10秒</Option>
                      <Option value={30000}>30秒</Option>
                    </Select>
                  )}
                </Space>
              </Col>
              <Col>
                <Space>
                  <Button icon={<ReloadOutlined />} onClick={loadData}>
                    刷新
                  </Button>
                  <Button icon={<SettingOutlined />}>
                    设置
                  </Button>
                </Space>
              </Col>
            </Row>
          </Card>
        </Col>

        {/* 实时执行列表 */}
        <Col span={24}>
          <Card title="实时执行" size="small">
            <Table
              columns={liveExecutionColumns}
              dataSource={liveExecutions}
              rowKey="id"
              size="small"
              pagination={false}
              loading={loading}
            />
          </Card>
        </Col>

        {/* 性能指标 */}
        {liveExecutions.length > 0 && (
          <Col span={24}>
            <Card title="性能指标" size="small">
              <Row gutter={[16, 16]}>
                {liveExecutions.map(execution => (
                  <Col span={12} key={execution.id}>
                    <Card size="small" title={execution.workflowName}>
                      <Row gutter={[8, 8]}>
                        <Col span={12}>
                          <Statistic
                            title="CPU使用率"
                            value={execution.metrics.cpuUsage}
                            suffix="%"
                            valueStyle={{ fontSize: 14 }}
                          />
                        </Col>
                        <Col span={12}>
                          <Statistic
                            title="内存使用"
                            value={execution.metrics.memoryUsage}
                            suffix="MB"
                            valueStyle={{ fontSize: 14 }}
                          />
                        </Col>
                        <Col span={12}>
                          <Statistic
                            title="吞吐量"
                            value={execution.metrics.throughput}
                            suffix="/s"
                            valueStyle={{ fontSize: 14 }}
                          />
                        </Col>
                        <Col span={12}>
                          <Statistic
                            title="响应时间"
                            value={execution.metrics.avgResponseTime}
                            suffix="ms"
                            valueStyle={{ fontSize: 14 }}
                          />
                        </Col>
                      </Row>
                    </Card>
                  </Col>
                ))}
              </Row>
            </Card>
          </Col>
        )}
      </Row>
    </div>
  );

  /**
   * 渲染执行历史面板
   */
  const renderExecutionHistory = () => (
    <div className="execution-history">
      <Row gutter={[16, 16]}>
        {/* 过滤器 */}
        <Col span={24}>
          <Card size="small">
            <Row gutter={[16, 16]} align="middle">
              <Col flex="auto">
                <Input.Search
                  placeholder="搜索工作流名称"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  style={{ width: 200 }}
                />
              </Col>
              <Col>
                <Select
                  value={filterStatus}
                  onChange={setFilterStatus}
                  style={{ width: 120 }}
                >
                  <Option value="all">全部状态</Option>
                  <Option value={ExecutionStatus.COMPLETED}>已完成</Option>
                  <Option value={ExecutionStatus.FAILED}>失败</Option>
                  <Option value={ExecutionStatus.RUNNING}>运行中</Option>
                  <Option value={ExecutionStatus.CANCELLED}>已取消</Option>
                </Select>
              </Col>
              <Col>
                <DatePicker.RangePicker
                  value={dateRange}
                  onChange={(dates) => setDateRange(dates as [Date, Date])}
                  style={{ width: 240 }}
                />
              </Col>
            </Row>
          </Card>
        </Col>

        {/* 历史记录表格 */}
        <Col span={24}>
          <Card title={`执行历史 (${filteredHistory.length})`} size="small">
            <Table
              columns={historyColumns}
              dataSource={filteredHistory}
              rowKey="id"
              size="small"
              pagination={{
                pageSize: 20,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => 
                  `第 ${range[0]}-${range[1]} 条，共 ${total} 条记录`
              }}
              loading={loading}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );

  /**
   * 渲染性能统计面板
   */
  const renderPerformanceStats = () => {
    if (!performanceStats) return null;

    return (
      <div className="performance-stats">
        <Row gutter={[16, 16]}>
          {/* 总体统计 */}
          <Col span={24}>
            <Card title="总体统计" size="small">
              <Row gutter={[16, 16]}>
                <Col span={6}>
                  <Statistic
                    title="总执行次数"
                    value={performanceStats.totalExecutions}
                    prefix={<PlayCircleOutlined />}
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="成功率"
                    value={performanceStats.successRate}
                    suffix="%"
                    prefix={<CheckCircleOutlined />}
                    valueStyle={{ color: '#3f8600' }}
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="平均执行时间"
                    value={formatDuration(performanceStats.avgDuration)}
                    prefix={<ClockCircleOutlined />}
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="峰值并发"
                    value={performanceStats.peakConcurrency}
                    prefix={<LineChartOutlined />}
                  />
                </Col>
              </Row>
            </Card>
          </Col>

          {/* 趋势图表 */}
          <Col span={12}>
            <Card title="执行次数趋势" size="small">
              <div style={{ height: 200 }}>
                {/* 这里可以集成图表库如 ECharts 或 Chart.js */}
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  height: '100%',
                  color: '#999'
                }}>
                  <LineChartOutlined style={{ fontSize: 48, marginRight: 16 }} />
                  <span>执行次数趋势图</span>
                </div>
              </div>
            </Card>
          </Col>

          <Col span={12}>
            <Card title="成功率趋势" size="small">
              <div style={{ height: 200 }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  height: '100%',
                  color: '#999'
                }}>
                  <AreaChartOutlined style={{ fontSize: 48, marginRight: 16 }} />
                  <span>成功率趋势图</span>
                </div>
              </div>
            </Card>
          </Col>

          <Col span={12}>
            <Card title="执行时间分布" size="small">
              <div style={{ height: 200 }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  height: '100%',
                  color: '#999'
                }}>
                  <BarChartOutlined style={{ fontSize: 48, marginRight: 16 }} />
                  <span>执行时间分布图</span>
                </div>
              </div>
            </Card>
          </Col>

          <Col span={12}>
            <Card title="错误统计" size="small">
              <div style={{ height: 200 }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  height: '100%',
                  color: '#999'
                }}>
                  <PieChartOutlined style={{ fontSize: 48, marginRight: 16 }} />
                  <span>错误分布图</span>
                </div>
              </div>
            </Card>
          </Col>
        </Row>
      </div>
    );
  };

  /**
   * 渲染执行详情模态框
   */
  const renderExecutionDetail = () => {
    const execution = selectedExecution 
      ? liveExecutions.find(e => e.id === selectedExecution) ||
        executionHistory.find(e => e.id === selectedExecution)
      : null;

    if (!execution) return null;

    return (
      <Modal
        title={`执行详情 - ${execution.workflowName}`}
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        width={800}
        footer={[
          <Button key="close" onClick={() => setDetailVisible(false)}>
            关闭
          </Button>
        ]}
      >
        <Tabs defaultActiveKey="basic">
          <TabPane tab="基本信息" key="basic">
            <Descriptions column={2} size="small">
              <Descriptions.Item label="执行ID">{execution.id}</Descriptions.Item>
              <Descriptions.Item label="工作流ID">{execution.workflowId}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Badge status={getStatusColor(execution.status)} text={execution.status} />
              </Descriptions.Item>
              <Descriptions.Item label="开始时间">
                {execution.startTime.toLocaleString()}
              </Descriptions.Item>
              {execution.endTime && (
                <Descriptions.Item label="结束时间">
                  {execution.endTime.toLocaleString()}
                </Descriptions.Item>
              )}
              <Descriptions.Item label="持续时间">
                {execution.duration ? formatDuration(execution.duration) : '进行中'}
              </Descriptions.Item>
              {'triggeredBy' in execution && (
                <Descriptions.Item label="触发者">{execution.triggeredBy}</Descriptions.Item>
              )}
              {'version' in execution && (
                <Descriptions.Item label="版本">{execution.version}</Descriptions.Item>
              )}
            </Descriptions>
          </TabPane>

          <TabPane tab="节点状态" key="nodes">
            {'nodeStatuses' in execution && execution.nodeStatuses && (
              <div>
                {Object.entries(execution.nodeStatuses).map(([nodeId, status]) => (
                  <div key={nodeId} style={{ marginBottom: 8 }}>
                    <Badge 
                      status={status === NodeStatus.COMPLETED ? 'success' : 
                             status === NodeStatus.RUNNING ? 'processing' :
                             status === NodeStatus.FAILED ? 'error' : 'default'}
                      text={`${nodeId}: ${status}`}
                    />
                  </div>
                ))}
              </div>
            )}
          </TabPane>

          <TabPane tab="性能指标" key="metrics">
            {'metrics' in execution && execution.metrics && (
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Statistic
                    title="CPU使用率"
                    value={execution.metrics.cpuUsage}
                    suffix="%"
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="内存使用"
                    value={execution.metrics.memoryUsage}
                    suffix="MB"
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="网络IO"
                    value={execution.metrics.networkIO}
                    suffix="KB/s"
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="磁盘IO"
                    value={execution.metrics.diskIO}
                    suffix="KB/s"
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="吞吐量"
                    value={execution.metrics.throughput}
                    suffix="/s"
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="错误率"
                    value={execution.metrics.errorRate}
                    suffix="%"
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="平均响应时间"
                    value={execution.metrics.avgResponseTime}
                    suffix="ms"
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="峰值内存"
                    value={execution.metrics.peakMemory}
                    suffix="MB"
                  />
                </Col>
              </Row>
            )}
          </TabPane>

          <TabPane tab="执行日志" key="logs">
            <div style={{ maxHeight: 400, overflow: 'auto' }}>
              {execution.logs && execution.logs.length > 0 ? (
                execution.logs.map((log, index) => (
                  <div key={index} style={{ marginBottom: 8, padding: 8, backgroundColor: '#f5f5f5' }}>
                    <Text type="secondary">[{log.timestamp}]</Text>
                    <Tag color={log.level === 'error' ? 'red' : log.level === 'warning' ? 'orange' : 'blue'}>
                      {log.level.toUpperCase()}
                    </Tag>
                    <span>{log.message}</span>
                    {log.nodeId && (
                      <Text type="secondary"> - 节点: {log.nodeId}</Text>
                    )}
                  </div>
                ))
              ) : (
                <Empty description="暂无日志" />
              )}
            </div>
          </TabPane>
        </Tabs>
      </Modal>
    );
  };

  /**
   * 实时执行表格列定义
   */
  const liveExecutionColumns = [
    {
      title: '工作流',
      dataIndex: 'workflowName',
      key: 'workflowName',
      render: (name: string, record: LiveExecution) => (
        <Space>
          <Avatar size="small" icon={getStatusIcon(record.status)} />
          <span>{name}</span>
        </Space>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: ExecutionStatus) => (
        <Badge status={getStatusColor(status)} text={status} />
      )
    },
    {
      title: '进度',
      dataIndex: 'progress',
      key: 'progress',
      render: (progress: number, record: LiveExecution) => (
        <div>
          <Progress percent={progress} size="small" />
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.completedNodes}/{record.totalNodes} 节点
          </Text>
        </div>
      )
    },
    {
      title: '开始时间',
      dataIndex: 'startTime',
      key: 'startTime',
      render: (time: Date) => time.toLocaleString()
    },
    {
      title: '持续时间',
      key: 'duration',
      render: (_, record: LiveExecution) => {
        const duration = record.endTime 
          ? record.endTime.getTime() - record.startTime.getTime()
          : Date.now() - record.startTime.getTime();
        return formatDuration(duration);
      }
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record: LiveExecution) => (
        <Space>
          <Button 
            size="small" 
            icon={<EyeOutlined />}
            onClick={() => {
              setSelectedExecution(record.id);
              setDetailVisible(true);
            }}
          >
            详情
          </Button>
        </Space>
      )
    }
  ];

  /**
   * 历史记录表格列定义
   */
  const historyColumns = [
    {
      title: '工作流',
      dataIndex: 'workflowName',
      key: 'workflowName'
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: ExecutionStatus) => (
        <Badge status={getStatusColor(status)} text={status} />
      )
    },
    {
      title: '开始时间',
      dataIndex: 'startTime',
      key: 'startTime',
      render: (time: Date) => time.toLocaleString()
    },
    {
      title: '持续时间',
      dataIndex: 'duration',
      key: 'duration',
      render: (duration: number) => formatDuration(duration)
    },
    {
      title: '触发者',
      dataIndex: 'triggeredBy',
      key: 'triggeredBy'
    },
    {
      title: '成功率',
      dataIndex: 'successRate',
      key: 'successRate',
      render: (rate: number) => `${rate.toFixed(1)}%`
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record: ExecutionHistory) => (
        <Space>
          <Button 
            size="small" 
            icon={<EyeOutlined />}
            onClick={() => {
              setSelectedExecution(record.id);
              setDetailVisible(true);
            }}
          >
            详情
          </Button>
        </Space>
      )
    }
  ];

  /**
   * 加载执行历史
   */
  const loadExecutionHistory = async (): Promise<void> => {
    // 模拟历史数据
    const mockHistory: ExecutionHistory[] = Array.from({ length: 50 }, (_, i) => {
      const startTime = new Date(Date.now() - (i + 1) * 3600000);
      const duration = Math.random() * 600000 + 60000;
      const endTime = new Date(startTime.getTime() + duration);
      const status = Math.random() > 0.1 ? ExecutionStatus.COMPLETED : ExecutionStatus.FAILED;
      
      return {
        id: `hist_${String(i + 1).padStart(3, '0')}`,
        workflowId: `wf_${Math.floor(Math.random() * 5) + 1}`,
        workflowName: `工作流 ${Math.floor(Math.random() * 5) + 1}`,
        status,
        startTime,
        endTime,
        duration,
        triggeredBy: ['用户A', '定时任务', '系统', 'API'][Math.floor(Math.random() * 4)],
        version: `v1.${Math.floor(Math.random() * 10)}`,
        nodeCount: Math.floor(Math.random() * 10) + 3,
        successRate: status === ExecutionStatus.COMPLETED ? 100 : Math.random() * 100,
        errorCount: status === ExecutionStatus.FAILED ? Math.floor(Math.random() * 3) + 1 : 0,
        metrics: {
          cpuUsage: Math.random() * 100,
          memoryUsage: Math.random() * 2048,
          networkIO: Math.random() * 5120,
          diskIO: Math.random() * 1024,
          throughput: Math.random() * 500,
          errorRate: status === ExecutionStatus.FAILED ? Math.random() * 10 : 0,
          avgResponseTime: Math.random() * 1000,
          peakMemory: Math.random() * 4096
        }
      };
    });
    
    setExecutionHistory(mockHistory);
  };

  /**
   * 加载性能统计
   */
  const loadPerformanceStats = async (): Promise<void> => {
    // 模拟性能统计数据
    const mockStats: PerformanceStats = {
      totalExecutions: 1250,
      successRate: 94.5,
      avgDuration: 285000,
      peakConcurrency: 12,
      errorRate: 5.5,
      throughput: 180,
      trends: {
        executions: Array.from({ length: 30 }, (_, i) => ({
          date: new Date(Date.now() - (29 - i) * 86400000).toISOString().split('T')[0],
          count: Math.floor(Math.random() * 50) + 20
        })),
        duration: Array.from({ length: 30 }, (_, i) => {
          const avg = Math.random() * 300000 + 100000;
          return {
            date: new Date(Date.now() - (29 - i) * 86400000).toISOString().split('T')[0],
            avg,
            min: avg * 0.5,
            max: avg * 1.8
          };
        }),
        success: Array.from({ length: 30 }, (_, i) => ({
          date: new Date(Date.now() - (29 - i) * 86400000).toISOString().split('T')[0],
          rate: Math.random() * 20 + 80
        })),
        errors: Array.from({ length: 30 }, (_, i) => ({
          date: new Date(Date.now() - (29 - i) * 86400000).toISOString().split('T')[0],
          count: Math.floor(Math.random() * 10)
        }))
      }
    };
    
    setPerformanceStats(mockStats);
  };

  /**
   * 开始自动刷新
   */
  const startAutoRefresh = () => {
    stopAutoRefresh();
    refreshTimer.current = setInterval(() => {
      loadLiveExecutions();
    }, refreshInterval);
  };

  /**
   * 停止自动刷新
   */
  const stopAutoRefresh = () => {
    if (refreshTimer.current) {
      clearInterval(refreshTimer.current);
      refreshTimer.current = null;
    }
  };

  /**
   * 格式化持续时间
   */
  const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  /**
   * 获取状态颜色
   */
  const getStatusColor = (status: ExecutionStatus): string => {
    switch (status) {
      case ExecutionStatus.RUNNING:
        return 'processing';
      case ExecutionStatus.COMPLETED:
        return 'success';
      case ExecutionStatus.FAILED:
        return 'error';
      case ExecutionStatus.CANCELLED:
        return 'warning';
      case ExecutionStatus.TIMEOUT:
        return 'warning';
      default:
        return 'default';
    }
  };

  /**
   * 获取状态图标
   */
  const getStatusIcon = (status: ExecutionStatus) => {
    switch (status) {
      case ExecutionStatus.RUNNING:
        return <PlayCircleOutlined />;
      case ExecutionStatus.COMPLETED:
        return <CheckCircleOutlined />;
      case ExecutionStatus.FAILED:
        return <ExclamationCircleOutlined />;
      case ExecutionStatus.CANCELLED:
        return <PauseCircleOutlined />;
      case ExecutionStatus.TIMEOUT:
        return <ClockCircleOutlined />;
      default:
        return <ClockCircleOutlined />;
    }
  };

  /**
   * 过滤历史记录
   */
  const filteredHistory = executionHistory.filter(record => {
    if (filterStatus !== 'all' && record.status !== filterStatus) {
      return false;
    }
    if (searchText && !record.workflowName.toLowerCase().includes(searchText.toLowerCase())) {
      return false;
    }
    if (dateRange) {
      const [start, end] = dateRange;
      if (record.startTime < start || record.startTime > end) {
        return false;
      }
    }
    return true;
  });

  return (
    <Modal
      title="工作流监控"
      open={visible}
      onCancel={onClose}
      width={1200}
      footer={null}
      destroyOnClose
    >
      <div className="workflow-monitor">
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane 
            tab={
              <span>
                <PlayCircleOutlined />
                实时监控
              </span>
            } 
            key="live"
          >
            {renderLiveMonitoring()}
          </TabPane>

          <TabPane 
            tab={
              <span>
                <HistoryOutlined />
                执行历史
              </span>
            } 
            key="history"
          >
            {renderExecutionHistory()}
          </TabPane>

          <TabPane 
            tab={
              <span>
                <LineChartOutlined />
                性能统计
              </span>
            } 
            key="stats"
          >
            {renderPerformanceStats()}
          </TabPane>
        </Tabs>

        {renderExecutionDetail()}
      </div>
    </Modal>
  );
};

export default WorkflowMonitor;