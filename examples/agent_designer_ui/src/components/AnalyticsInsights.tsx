/**
 * 分析洞察模块 - 主组件
 * 包含性能分析、使用分析、趋势分析三个子模块
 * 基于EFIAgent产品设计文档实现
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Card, Tabs, Row, Col, Statistic, Progress, Table, Select, DatePicker,
  Button, Space, Tooltip, Alert, Spin, Empty, Tag, Badge, Divider,
  Radio, Switch, InputNumber, message, Modal, Form, Input
} from 'antd';
import {
  LineChartOutlined, BarChartOutlined, PieChartOutlined,
  RiseOutlined, FallOutlined, DashboardOutlined,
  ClockCircleOutlined, UserOutlined, RobotOutlined,
  WarningOutlined, CheckCircleOutlined, ExclamationCircleOutlined,
  DownloadOutlined, ReloadOutlined, SettingOutlined,
  EyeOutlined, FilterOutlined, CalendarOutlined
} from '@ant-design/icons';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie,
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend,
  ResponsiveContainer, Cell, ScatterChart, Scatter, RadarChart,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import dayjs, { Dayjs } from 'dayjs';
import './AnalyticsInsights.css';

const { TabPane } = Tabs;
const { RangePicker } = DatePicker;
const { Option } = Select;

// 颜色配置
const CHART_COLORS = {
  primary: '#1890ff',
  success: '#52c41a',
  warning: '#faad14',
  error: '#f5222d',
  info: '#722ed1',
  gradient: ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1']
};

// 性能指标类型
interface PerformanceMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  change: number;
  status: 'excellent' | 'good' | 'warning' | 'critical';
}

// 使用统计数据
interface UsageData {
  date: string;
  activeUsers: number;
  agentExecutions: number;
  workflowRuns: number;
  apiCalls: number;
}

// 趋势分析结果
interface TrendAnalysis {
  metric: string;
  trend: 'increasing' | 'decreasing' | 'stable' | 'volatile';
  confidence: number;
  prediction: number[];
  anomalies: Array<{
    date: string;
    value: number;
    severity: 'low' | 'medium' | 'high';
  }>;
}

interface AnalyticsInsightsProps {
  visible: boolean;
  onClose: () => void;
}

const AnalyticsInsights: React.FC<AnalyticsInsightsProps> = ({ visible, onClose }) => {
  // 状态管理
  const [activeTab, setActiveTab] = useState('performance');
  const [loading, setLoading] = useState(false);
  const [timeRange, setTimeRange] = useState<[Dayjs, Dayjs]>([
    dayjs().subtract(7, 'day'),
    dayjs()
  ]);
  const [refreshInterval, setRefreshInterval] = useState<number>(30); // 秒
  const [autoRefresh, setAutoRefresh] = useState(false);
  
  // 性能分析数据
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetric[]>([]);
  const [systemPerformance, setSystemPerformance] = useState<any[]>([]);
  const [agentPerformance, setAgentPerformance] = useState<any[]>([]);
  
  // 使用分析数据
  const [usageData, setUsageData] = useState<UsageData[]>([]);
  const [userStats, setUserStats] = useState<any>({});
  const [agentStats, setAgentStats] = useState<any>({});
  
  // 趋势分析数据
  const [trendAnalysis, setTrendAnalysis] = useState<TrendAnalysis[]>([]);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [anomalies, setAnomalies] = useState<any[]>([]);

  /**
   * 初始化数据加载
   */
  useEffect(() => {
    if (visible) {
      loadAllData();
    }
  }, [visible, timeRange]);

  /**
   * 自动刷新逻辑
   */
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (autoRefresh && visible) {
      interval = setInterval(() => {
        loadAllData();
      }, refreshInterval * 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, refreshInterval, visible]);

  /**
   * 加载所有数据
   */
  const loadAllData = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadPerformanceData(),
        loadUsageData(),
        loadTrendData()
      ]);
    } catch (error) {
      console.error('数据加载失败:', error);
      message.error('数据加载失败，请重试');
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  /**
   * 加载性能分析数据
   */
  const loadPerformanceData = async () => {
    // 模拟API调用
    const mockMetrics: PerformanceMetric[] = [
      {
        id: 'response_time',
        name: '平均响应时间',
        value: 245,
        unit: 'ms',
        trend: 'down',
        change: -12.5,
        status: 'good'
      },
      {
        id: 'throughput',
        name: '系统吞吐量',
        value: 1250,
        unit: 'req/s',
        trend: 'up',
        change: 8.3,
        status: 'excellent'
      },
      {
        id: 'success_rate',
        name: '成功率',
        value: 99.2,
        unit: '%',
        trend: 'stable',
        change: 0.1,
        status: 'excellent'
      },
      {
        id: 'error_rate',
        name: '错误率',
        value: 0.8,
        unit: '%',
        trend: 'up',
        change: 0.3,
        status: 'warning'
      },
      {
        id: 'cpu_usage',
        name: 'CPU使用率',
        value: 68.5,
        unit: '%',
        trend: 'up',
        change: 5.2,
        status: 'good'
      },
      {
        id: 'memory_usage',
        name: '内存使用率',
        value: 72.3,
        unit: '%',
        trend: 'stable',
        change: -1.1,
        status: 'good'
      }
    ];
    
    setPerformanceMetrics(mockMetrics);
    
    // 生成时间序列数据
    const timeSeriesData = generateTimeSeriesData();
    setSystemPerformance(timeSeriesData.system);
    setAgentPerformance(timeSeriesData.agent);
  };

  /**
   * 加载使用分析数据
   */
  const loadUsageData = async () => {
    // 生成模拟使用数据
    const mockUsageData: UsageData[] = [];
    const startDate = timeRange[0];
    const endDate = timeRange[1];
    
    for (let date = startDate; date.isBefore(endDate) || date.isSame(endDate); date = date.add(1, 'day')) {
      mockUsageData.push({
        date: date.format('YYYY-MM-DD'),
        activeUsers: Math.floor(Math.random() * 100) + 50,
        agentExecutions: Math.floor(Math.random() * 500) + 200,
        workflowRuns: Math.floor(Math.random() * 200) + 80,
        apiCalls: Math.floor(Math.random() * 2000) + 1000
      });
    }
    
    setUsageData(mockUsageData);
    
    // 设置统计数据
    setUserStats({
      totalUsers: 1250,
      activeUsers: 890,
      newUsers: 45,
      retentionRate: 85.6
    });
    
    setAgentStats({
      totalAgents: 156,
      activeAgents: 98,
      totalExecutions: 12450,
      avgExecutionTime: 2.3
    });
  };

  /**
   * 加载趋势分析数据
   */
  const loadTrendData = async () => {
    const mockTrendAnalysis: TrendAnalysis[] = [
      {
        metric: '用户活跃度',
        trend: 'increasing',
        confidence: 0.85,
        prediction: [920, 950, 980, 1010, 1040],
        anomalies: [
          { date: '2024-01-15', value: 650, severity: 'medium' },
          { date: '2024-01-22', value: 1200, severity: 'low' }
        ]
      },
      {
        metric: 'Agent执行次数',
        trend: 'stable',
        confidence: 0.92,
        prediction: [450, 460, 455, 465, 470],
        anomalies: []
      },
      {
        metric: '系统响应时间',
        trend: 'decreasing',
        confidence: 0.78,
        prediction: [240, 235, 230, 225, 220],
        anomalies: [
          { date: '2024-01-20', value: 380, severity: 'high' }
        ]
      }
    ];
    
    setTrendAnalysis(mockTrendAnalysis);
    
    // 生成预测数据
    const mockPredictions = generatePredictionData();
    setPredictions(mockPredictions);
    
    // 生成异常检测数据
    const mockAnomalies = generateAnomalyData();
    setAnomalies(mockAnomalies);
  };

  /**
   * 生成时间序列数据
   */
  const generateTimeSeriesData = () => {
    const data = [];
    const agentData = [];
    const startDate = timeRange[0];
    const endDate = timeRange[1];
    
    for (let date = startDate; date.isBefore(endDate) || date.isSame(endDate); date = date.add(1, 'hour')) {
      data.push({
        time: date.format('MM-DD HH:mm'),
        cpu: Math.random() * 30 + 40,
        memory: Math.random() * 20 + 60,
        responseTime: Math.random() * 100 + 200,
        throughput: Math.random() * 500 + 1000
      });
      
      agentData.push({
        time: date.format('MM-DD HH:mm'),
        executions: Math.floor(Math.random() * 50) + 20,
        successRate: Math.random() * 5 + 95,
        avgExecutionTime: Math.random() * 2 + 1.5
      });
    }
    
    return { system: data, agent: agentData };
  };

  /**
   * 生成预测数据
   */
  const generatePredictionData = () => {
    const data = [];
    const baseDate = dayjs();
    
    for (let i = 0; i < 30; i++) {
      data.push({
        date: baseDate.add(i, 'day').format('MM-DD'),
        predicted: Math.random() * 200 + 800,
        confidence: Math.random() * 0.3 + 0.7,
        upper: Math.random() * 100 + 950,
        lower: Math.random() * 100 + 650
      });
    }
    
    return data;
  };

  /**
   * 生成异常检测数据
   */
  const generateAnomalyData = () => {
    const data = [];
    const baseDate = dayjs().subtract(7, 'day');
    
    for (let i = 0; i < 7; i++) {
      const hasAnomaly = Math.random() > 0.7;
      if (hasAnomaly) {
        data.push({
          date: baseDate.add(i, 'day').format('YYYY-MM-DD'),
          metric: ['响应时间', '错误率', 'CPU使用率'][Math.floor(Math.random() * 3)],
          value: Math.random() * 100,
          severity: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
          description: '检测到异常波动'
        });
      }
    }
    
    return data;
  };

  /**
   * 获取状态颜色
   */
  const getStatusColor = (status: string) => {
    const colorMap = {
      excellent: CHART_COLORS.success,
      good: CHART_COLORS.info,
      warning: CHART_COLORS.warning,
      critical: CHART_COLORS.error
    };
    return colorMap[status as keyof typeof colorMap] || CHART_COLORS.primary;
  };

  /**
   * 获取趋势图标
   */
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
      case 'increasing':
        return <RiseOutlined style={{ color: CHART_COLORS.success }} />;
      case 'down':
      case 'decreasing':
        return <FallOutlined style={{ color: CHART_COLORS.error }} />;
      default:
        return <DashboardOutlined style={{ color: CHART_COLORS.info }} />;
    }
  };

  /**
   * 渲染性能分析面板
   */
  const renderPerformancePanel = () => (
    <div className="analytics-performance-panel">
      {/* 关键指标卡片 */}
      <Row gutter={[16, 16]} className="metrics-cards">
        {performanceMetrics.map((metric) => (
          <Col xs={24} sm={12} lg={8} xl={4} key={metric.id}>
            <Card className="metric-card" >
              <Statistic
                title={
                  <Space>
                    <span>{metric.name}</span>
                    <Tooltip title={`变化: ${metric.change > 0 ? '+' : ''}${metric.change}%`}>
                      {getTrendIcon(metric.trend)}
                    </Tooltip>
                  </Space>
                }
                value={metric.value}
                suffix={metric.unit}
                valueStyle={{ 
                  color: getStatusColor(metric.status),
                  fontSize: '20px'
                }}
              />
              <div className="metric-status">
                <Badge 
                  status={metric.status === 'excellent' ? 'success' : 
                         metric.status === 'good' ? 'processing' :
                         metric.status === 'warning' ? 'warning' : 'error'}
                  text={metric.status === 'excellent' ? '优秀' :
                        metric.status === 'good' ? '良好' :
                        metric.status === 'warning' ? '警告' : '严重'}
                />
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* 性能趋势图表 */}
      <Row gutter={[16, 16]} className="performance-charts">
        <Col xs={24} lg={12}>
          <Card title="系统性能趋势" >
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={systemPerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <RechartsTooltip />
                <Legend />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="cpu" 
                  stroke={CHART_COLORS.primary} 
                  name="CPU使用率(%)"
                />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="memory" 
                  stroke={CHART_COLORS.success} 
                  name="内存使用率(%)"
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="responseTime" 
                  stroke={CHART_COLORS.warning} 
                  name="响应时间(ms)"
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        
        <Col xs={24} lg={12}>
          <Card title="Agent性能分析" >
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={agentPerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <RechartsTooltip />
                <Legend />
                <Area 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="executions" 
                  stackId="1"
                  stroke={CHART_COLORS.info} 
                  fill={CHART_COLORS.info}
                  name="执行次数"
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="successRate" 
                  stroke={CHART_COLORS.success} 
                  name="成功率(%)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>
    </div>
  );

  /**
   * 渲染使用分析面板
   */
  const renderUsagePanel = () => (
    <div className="analytics-usage-panel">
      {/* 使用统计概览 */}
      <Row gutter={[16, 16]} className="usage-overview">
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="总用户数"
              value={userStats.totalUsers}
              prefix={<UserOutlined />}
              valueStyle={{ color: CHART_COLORS.primary }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="活跃用户"
              value={userStats.activeUsers}
              prefix={<UserOutlined />}
              valueStyle={{ color: CHART_COLORS.success }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="总Agent数"
              value={agentStats.totalAgents}
              prefix={<RobotOutlined />}
              valueStyle={{ color: CHART_COLORS.info }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="总执行次数"
              value={agentStats.totalExecutions}
              prefix={<LineChartOutlined />}
              valueStyle={{ color: CHART_COLORS.warning }}
            />
          </Card>
        </Col>
      </Row>

      {/* 使用趋势图表 */}
      <Row gutter={[16, 16]} className="usage-charts">
        <Col xs={24} lg={16}>
          <Card title="使用趋势分析" >
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={usageData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <RechartsTooltip />
                <Legend />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="activeUsers" 
                  stroke={CHART_COLORS.primary} 
                  name="活跃用户"
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="agentExecutions" 
                  stroke={CHART_COLORS.success} 
                  name="Agent执行次数"
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="workflowRuns" 
                  stroke={CHART_COLORS.warning} 
                  name="工作流运行次数"
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        
        <Col xs={24} lg={8}>
          <Card title="用户留存分析" >
            <div className="retention-analysis">
              <div className="retention-metric">
                <Progress 
                  type="circle" 
                  percent={userStats.retentionRate} 
                  format={percent => `${percent}%`}
                  strokeColor={CHART_COLORS.success}
                />
                <div className="retention-label">7日留存率</div>
              </div>
              
              <Divider />
              
              <div className="usage-distribution">
                <h4>使用分布</h4>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: '高频用户', value: 35, color: CHART_COLORS.success },
                        { name: '中频用户', value: 45, color: CHART_COLORS.primary },
                        { name: '低频用户', value: 20, color: CHART_COLORS.warning }
                      ]}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                    >
                      {[
                        { name: '高频用户', value: 35, color: CHART_COLORS.success },
                        { name: '中频用户', value: 45, color: CHART_COLORS.primary },
                        { name: '低频用户', value: 20, color: CHART_COLORS.warning }
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );

  /**
   * 渲染趋势分析面板
   */
  const renderTrendPanel = () => (
    <div className="analytics-trend-panel">
      {/* 趋势分析概览 */}
      <Row gutter={[16, 16]} className="trend-overview">
        {trendAnalysis.map((trend, index) => (
          <Col xs={24} lg={8} key={index}>
            <Card title={trend.metric} >
              <div className="trend-summary">
                <div className="trend-indicator">
                  {getTrendIcon(trend.trend)}
                  <span className="trend-text">
                    {trend.trend === 'increasing' ? '上升趋势' :
                     trend.trend === 'decreasing' ? '下降趋势' :
                     trend.trend === 'stable' ? '稳定趋势' : '波动趋势'}
                  </span>
                </div>
                <div className="confidence-score">
                  <Progress 
                    percent={trend.confidence * 100} 
                    
                    format={percent => `置信度 ${percent}%`}
                  />
                </div>
                {trend.anomalies.length > 0 && (
                  <div className="anomaly-alert">
                    <Alert
                      message={`检测到 ${trend.anomalies.length} 个异常点`}
                      type="warning"
                      
                      showIcon
                    />
                  </div>
                )}
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* 预测分析图表 */}
      <Row gutter={[16, 16]} className="prediction-charts">
        <Col xs={24} lg={16}>
          <Card title="趋势预测分析" >
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={predictions}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <RechartsTooltip />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="upper" 
                  stackId="1"
                  stroke="none"
                  fill={CHART_COLORS.primary}
                  fillOpacity={0.1}
                  name="置信区间上限"
                />
                <Area 
                  type="monotone" 
                  dataKey="lower" 
                  stackId="1"
                  stroke="none"
                  fill="#fff"
                  name="置信区间下限"
                />
                <Line 
                  type="monotone" 
                  dataKey="predicted" 
                  stroke={CHART_COLORS.primary} 
                  strokeWidth={2}
                  name="预测值"
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        
        <Col xs={24} lg={8}>
          <Card title="异常检测" >
            <div className="anomaly-detection">
              {anomalies.length > 0 ? (
                <div className="anomaly-list">
                  {anomalies.map((anomaly, index) => (
                    <div key={index} className="anomaly-item">
                      <div className="anomaly-header">
                        <Tag color={
                          anomaly.severity === 'high' ? 'red' :
                          anomaly.severity === 'medium' ? 'orange' : 'blue'
                        }>
                          {anomaly.severity === 'high' ? '高' :
                           anomaly.severity === 'medium' ? '中' : '低'}
                        </Tag>
                        <span className="anomaly-metric">{anomaly.metric}</span>
                      </div>
                      <div className="anomaly-details">
                        <div>时间: {anomaly.date}</div>
                        <div>数值: {anomaly.value.toFixed(2)}</div>
                        <div>描述: {anomaly.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <Empty 
                  description="暂无异常检测结果"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              )}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );

  return (
    <Modal
      title={
        <Space>
          <LineChartOutlined />
          <span>分析洞察</span>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      width="95%"
      style={{ top: 20 }}
      footer={null}
      className="analytics-insights-modal"
    >
      <div className="analytics-insights-container">
        {/* 工具栏 */}
        <div className="analytics-toolbar">
          <Row justify="space-between" align="middle">
            <Col>
              <Space>
                <RangePicker
                  value={timeRange}
                  onChange={(dates) => dates && setTimeRange(dates)}
                  format="YYYY-MM-DD"
                  allowClear={false}
                />
                <Button 
                  icon={<ReloadOutlined />} 
                  onClick={loadAllData}
                  loading={loading}
                >
                  刷新
                </Button>
              </Space>
            </Col>
            <Col>
              <Space>
                <span>自动刷新:</span>
                <Switch 
                  checked={autoRefresh}
                  onChange={setAutoRefresh}
                  
                />
                <InputNumber
                  value={refreshInterval}
                  onChange={(value) => value && setRefreshInterval(value)}
                  min={10}
                  max={300}
                  
                  addonAfter="秒"
                  style={{ width: 80 }}
                  disabled={!autoRefresh}
                />
                <Button icon={<DownloadOutlined />} >
                  导出
                </Button>
              </Space>
            </Col>
          </Row>
        </div>

        {/* 主要内容 */}
        <div className="analytics-content">
          <Spin spinning={loading}>
            <Tabs 
              activeKey={activeTab} 
              onChange={setActiveTab}
              type="card"
              className="analytics-tabs"
            >
              <TabPane 
                tab={
                  <Space>
                    <DashboardOutlined />
                    <span>性能分析</span>
                  </Space>
                } 
                key="performance"
              >
                {renderPerformancePanel()}
              </TabPane>
              
              <TabPane 
                tab={
                  <Space>
                    <BarChartOutlined />
                    <span>使用分析</span>
                  </Space>
                } 
                key="usage"
              >
                {renderUsagePanel()}
              </TabPane>
              
              <TabPane 
                tab={
                  <Space>
                    <RiseOutlined />
                    <span>趋势分析</span>
                  </Space>
                } 
                key="trend"
              >
                {renderTrendPanel()}
              </TabPane>
            </Tabs>
          </Spin>
        </div>
      </div>
    </Modal>
  );
};

export default AnalyticsInsights;