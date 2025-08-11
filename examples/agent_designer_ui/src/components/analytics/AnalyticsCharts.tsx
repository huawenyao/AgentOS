/**
 * 分析洞察图表组件
 * 提供各种数据可视化图表，支持性能分析、使用分析、趋势分析
 * 基于EFIAgent产品设计文档实现
 */

import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Brush
} from 'recharts';
import { Card, Empty, Spin, Typography, Tag, Row, Col } from 'antd';
import { TrendingUpOutlined, TrendingDownOutlined, MinusOutlined } from '@ant-design/icons';
import './AnalyticsCharts.css';

const { Title, Text } = Typography;

// 颜色主题
const CHART_COLORS = {
  primary: '#1890ff',
  success: '#52c41a',
  warning: '#faad14',
  error: '#ff4d4f',
  info: '#13c2c2',
  purple: '#722ed1',
  orange: '#fa8c16',
  cyan: '#13c2c2',
  geekblue: '#2f54eb',
  magenta: '#eb2f96'
};

const CHART_COLOR_PALETTE = [
  CHART_COLORS.primary,
  CHART_COLORS.success,
  CHART_COLORS.warning,
  CHART_COLORS.error,
  CHART_COLORS.info,
  CHART_COLORS.purple,
  CHART_COLORS.orange,
  CHART_COLORS.cyan,
  CHART_COLORS.geekblue,
  CHART_COLORS.magenta
];

// 通用接口定义
interface ChartProps {
  data: any[];
  loading?: boolean;
  title?: string;
  height?: number;
  className?: string;
}

interface MetricData {
  timestamp: string;
  value: number;
  [key: string]: any;
}

interface TrendData {
  name: string;
  value: number;
  trend?: 'up' | 'down' | 'stable';
  change?: number;
}

// 自定义Tooltip组件
const CustomTooltip = ({ active, payload, label, formatter }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="analytics-chart-tooltip">
        <p className="tooltip-label">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="tooltip-item" style={{ color: entry.color }}>
            <span className="tooltip-name">{entry.name}:</span>
            <span className="tooltip-value">
              {formatter ? formatter(entry.value, entry.name) : entry.value}
            </span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// 性能指标时间序列图表
export const PerformanceTimeSeriesChart: React.FC<ChartProps & {
  metrics: string[];
  thresholds?: Record<string, { warning: number; critical: number }>;
}> = ({ data, loading, title, height = 300, metrics, thresholds, className }) => {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    return data.map(item => ({
      timestamp: new Date(item.timestamp).toLocaleString(),
      ...metrics.reduce((acc, metric) => {
        acc[metric] = item[metric] || 0;
        return acc;
      }, {} as Record<string, number>)
    }));
  }, [data, metrics]);

  const formatValue = (value: number, name: string) => {
    if (name.includes('rate') || name.includes('Rate')) {
      return `${(value * 100).toFixed(2)}%`;
    }
    if (name.includes('time') || name.includes('Time')) {
      return `${value.toFixed(2)}ms`;
    }
    if (name.includes('usage') || name.includes('Usage')) {
      return `${value.toFixed(2)}%`;
    }
    return value.toFixed(2);
  };

  if (loading) {
    return (
      <Card className={`analytics-chart-card ${className || ''}`}>
        <Spin size="large" className="chart-loading" />
      </Card>
    );
  }

  if (!chartData || chartData.length === 0) {
    return (
      <Card className={`analytics-chart-card ${className || ''}`} title={title}>
        <Empty description="暂无数据" />
      </Card>
    );
  }

  return (
    <Card className={`analytics-chart-card ${className || ''}`} title={title}>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="timestamp" 
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => {
              const date = new Date(value);
              return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
            }}
          />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip content={<CustomTooltip formatter={formatValue} />} />
          <Legend />
          
          {/* 阈值线 */}
          {thresholds && Object.entries(thresholds).map(([metric, threshold]) => (
            <React.Fragment key={metric}>
              <ReferenceLine 
                y={threshold.warning} 
                stroke={CHART_COLORS.warning} 
                strokeDasharray="5 5"
                label={{ value: `${metric} 警告线`, position: 'topRight' }}
              />
              <ReferenceLine 
                y={threshold.critical} 
                stroke={CHART_COLORS.error} 
                strokeDasharray="5 5"
                label={{ value: `${metric} 危险线`, position: 'topRight' }}
              />
            </React.Fragment>
          ))}
          
          {/* 指标线 */}
          {metrics.map((metric, index) => (
            <Line
              key={metric}
              type="monotone"
              dataKey={metric}
              stroke={CHART_COLOR_PALETTE[index % CHART_COLOR_PALETTE.length]}
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
              name={metric}
            />
          ))}
          
          <Brush dataKey="timestamp" height={30} stroke={CHART_COLORS.primary} />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
};

// 使用分析饼图
export const UsageDistributionChart: React.FC<ChartProps & {
  dataKey: string;
  nameKey: string;
}> = ({ data, loading, title, height = 300, dataKey, nameKey, className }) => {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    return data.map((item, index) => ({
      ...item,
      fill: CHART_COLOR_PALETTE[index % CHART_COLOR_PALETTE.length]
    }));
  }, [data]);

  if (loading) {
    return (
      <Card className={`analytics-chart-card ${className || ''}`}>
        <Spin size="large" className="chart-loading" />
      </Card>
    );
  }

  if (!chartData || chartData.length === 0) {
    return (
      <Card className={`analytics-chart-card ${className || ''}`} title={title}>
        <Empty description="暂无数据" />
      </Card>
    );
  }

  return (
    <Card className={`analytics-chart-card ${className || ''}`} title={title}>
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey={dataKey}
            nameKey={nameKey}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => [value, '数量']} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </Card>
  );
};

// 趋势分析面积图
export const TrendAreaChart: React.FC<ChartProps & {
  metrics: string[];
  showPrediction?: boolean;
}> = ({ data, loading, title, height = 300, metrics, showPrediction, className }) => {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    return data.map(item => ({
      timestamp: new Date(item.timestamp).toLocaleString(),
      ...metrics.reduce((acc, metric) => {
        acc[metric] = item[metric] || 0;
        return acc;
      }, {} as Record<string, number>),
      isPrediction: item.isPrediction || false
    }));
  }, [data, metrics]);

  if (loading) {
    return (
      <Card className={`analytics-chart-card ${className || ''}`}>
        <Spin size="large" className="chart-loading" />
      </Card>
    );
  }

  if (!chartData || chartData.length === 0) {
    return (
      <Card className={`analytics-chart-card ${className || ''}`} title={title}>
        <Empty description="暂无数据" />
      </Card>
    );
  }

  return (
    <Card className={`analytics-chart-card ${className || ''}`} title={title}>
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="timestamp" 
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => {
              const date = new Date(value);
              return `${date.getMonth() + 1}/${date.getDate()}`;
            }}
          />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          
          {/* 历史数据区域 */}
          {metrics.map((metric, index) => (
            <Area
              key={`${metric}-historical`}
              type="monotone"
              dataKey={metric}
              stroke={CHART_COLOR_PALETTE[index % CHART_COLOR_PALETTE.length]}
              fill={CHART_COLOR_PALETTE[index % CHART_COLOR_PALETTE.length]}
              fillOpacity={0.3}
              strokeWidth={2}
              name={`${metric} (历史)`}
              connectNulls={false}
            />
          ))}
          
          {/* 预测数据线 */}
          {showPrediction && metrics.map((metric, index) => (
            <Line
              key={`${metric}-prediction`}
              type="monotone"
              dataKey={metric}
              stroke={CHART_COLOR_PALETTE[index % CHART_COLOR_PALETTE.length]}
              strokeDasharray="5 5"
              strokeWidth={2}
              dot={false}
              name={`${metric} (预测)`}
              connectNulls={false}
            />
          ))}
        </ComposedChart>
      </ResponsiveContainer>
    </Card>
  );
};

// 异常检测散点图
export const AnomalyScatterChart: React.FC<ChartProps & {
  xKey: string;
  yKey: string;
  anomalyKey?: string;
}> = ({ data, loading, title, height = 300, xKey, yKey, anomalyKey = 'isAnomaly', className }) => {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    return data.map(item => ({
      ...item,
      fill: item[anomalyKey] ? CHART_COLORS.error : CHART_COLORS.primary
    }));
  }, [data, anomalyKey]);

  if (loading) {
    return (
      <Card className={`analytics-chart-card ${className || ''}`}>
        <Spin size="large" className="chart-loading" />
      </Card>
    );
  }

  if (!chartData || chartData.length === 0) {
    return (
      <Card className={`analytics-chart-card ${className || ''}`} title={title}>
        <Empty description="暂无数据" />
      </Card>
    );
  }

  return (
    <Card className={`analytics-chart-card ${className || ''}`} title={title}>
      <ResponsiveContainer width="100%" height={height}>
        <ScatterChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey={xKey} tick={{ fontSize: 12 }} name={xKey} />
          <YAxis dataKey={yKey} tick={{ fontSize: 12 }} name={yKey} />
          <Tooltip 
            cursor={{ strokeDasharray: '3 3' }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                return (
                  <div className="analytics-chart-tooltip">
                    <p>{`${xKey}: ${data[xKey]}`}</p>
                    <p>{`${yKey}: ${data[yKey]}`}</p>
                    {data[anomalyKey] && (
                      <p style={{ color: CHART_COLORS.error }}>异常点</p>
                    )}
                  </div>
                );
              }
              return null;
            }}
          />
          <Scatter 
            name="数据点" 
            dataKey={yKey} 
            fill={CHART_COLORS.primary}
          />
        </ScatterChart>
      </ResponsiveContainer>
    </Card>
  );
};

// 对比柱状图
export const ComparisonBarChart: React.FC<ChartProps & {
  metrics: string[];
  categoryKey: string;
}> = ({ data, loading, title, height = 300, metrics, categoryKey, className }) => {
  if (loading) {
    return (
      <Card className={`analytics-chart-card ${className || ''}`}>
        <Spin size="large" className="chart-loading" />
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className={`analytics-chart-card ${className || ''}`} title={title}>
        <Empty description="暂无数据" />
      </Card>
    );
  }

  return (
    <Card className={`analytics-chart-card ${className || ''}`} title={title}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey={categoryKey} tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          
          {metrics.map((metric, index) => (
            <Bar
              key={metric}
              dataKey={metric}
              fill={CHART_COLOR_PALETTE[index % CHART_COLOR_PALETTE.length]}
              name={metric}
              radius={[2, 2, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
};

// 指标卡片组件
export const MetricCard: React.FC<{
  title: string;
  value: number | string;
  trend?: 'up' | 'down' | 'stable';
  change?: number;
  unit?: string;
  precision?: number;
  loading?: boolean;
  className?: string;
}> = ({ title, value, trend, change, unit = '', precision = 2, loading, className }) => {
  const formatValue = (val: number | string) => {
    if (typeof val === 'number') {
      return val.toFixed(precision);
    }
    return val;
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUpOutlined style={{ color: CHART_COLORS.success }} />;
      case 'down':
        return <TrendingDownOutlined style={{ color: CHART_COLORS.error }} />;
      case 'stable':
        return <MinusOutlined style={{ color: CHART_COLORS.info }} />;
      default:
        return null;
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return CHART_COLORS.success;
      case 'down':
        return CHART_COLORS.error;
      case 'stable':
        return CHART_COLORS.info;
      default:
        return CHART_COLORS.primary;
    }
  };

  return (
    <Card className={`metric-card ${className || ''}`} loading={loading}>
      <div className="metric-card-content">
        <div className="metric-header">
          <Text type="secondary" className="metric-title">{title}</Text>
          {getTrendIcon()}
        </div>
        <div className="metric-value">
          <Title level={2} className="metric-number">
            {formatValue(value)}{unit}
          </Title>
        </div>
        {change !== undefined && (
          <div className="metric-change">
            <Tag color={getTrendColor()} className="change-tag">
              {change > 0 ? '+' : ''}{change.toFixed(2)}%
            </Tag>
            <Text type="secondary">较上期</Text>
          </div>
        )}
      </div>
    </Card>
  );
};

// 实时指标仪表盘
export const RealtimeMetricsDashboard: React.FC<{
  metrics: Array<{
    name: string;
    value: number;
    unit?: string;
    threshold?: { warning: number; critical: number };
  }>;
  loading?: boolean;
}> = ({ metrics, loading }) => {
  const getMetricStatus = (value: number, threshold?: { warning: number; critical: number }) => {
    if (!threshold) return 'normal';
    if (value >= threshold.critical) return 'critical';
    if (value >= threshold.warning) return 'warning';
    return 'normal';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critical':
        return CHART_COLORS.error;
      case 'warning':
        return CHART_COLORS.warning;
      case 'normal':
        return CHART_COLORS.success;
      default:
        return CHART_COLORS.primary;
    }
  };

  if (loading) {
    return (
      <div className="realtime-metrics-dashboard">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="realtime-metrics-dashboard">
      <Row gutter={[16, 16]}>
        {metrics.map((metric, index) => {
          const status = getMetricStatus(metric.value, metric.threshold);
          const color = getStatusColor(status);
          
          return (
            <Col key={index} xs={24} sm={12} md={8} lg={6}>
              <Card className="realtime-metric-card">
                <div className="metric-indicator" style={{ borderLeftColor: color }}>
                  <div className="metric-name">{metric.name}</div>
                  <div className="metric-value" style={{ color }}>
                    {metric.value.toFixed(2)}{metric.unit || ''}
                  </div>
                  {metric.threshold && (
                    <div className="metric-thresholds">
                      <Text type="secondary" className="threshold-text">
                        警告: {metric.threshold.warning} | 危险: {metric.threshold.critical}
                      </Text>
                    </div>
                  )}
                </div>
              </Card>
            </Col>
          );
        })}
      </Row>
    </div>
  );
};

export default {
  PerformanceTimeSeriesChart,
  UsageDistributionChart,
  TrendAreaChart,
  AnomalyScatterChart,
  ComparisonBarChart,
  MetricCard,
  RealtimeMetricsDashboard
};