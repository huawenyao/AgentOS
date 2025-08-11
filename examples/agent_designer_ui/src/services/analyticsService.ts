/**
 * 分析洞察服务层
 * 提供与后端分析API的交互接口
 * 基于EFIAgent产品设计文档实现
 */

import axios, { AxiosResponse } from 'axios';
import { message } from 'antd';

// API基础配置
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';
const ANALYTICS_API_PREFIX = '/api/analytics';

// 创建axios实例
const analyticsApi = axios.create({
  baseURL: `${API_BASE_URL}${ANALYTICS_API_PREFIX}`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器 - 添加认证token
analyticsApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器 - 统一错误处理
analyticsApi.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      
      switch (status) {
        case 401:
          message.error('认证失败，请重新登录');
          // 清除token并跳转到登录页
          localStorage.removeItem('authToken');
          window.location.href = '/login';
          break;
        case 403:
          message.error('权限不足，无法访问该资源');
          break;
        case 429:
          message.error('请求过于频繁，请稍后再试');
          break;
        case 500:
          message.error('服务器内部错误，请稍后再试');
          break;
        default:
          message.error(data?.error?.message || '请求失败');
      }
    } else if (error.request) {
      message.error('网络连接失败，请检查网络设置');
    } else {
      message.error('请求配置错误');
    }
    
    return Promise.reject(error);
  }
);

// 类型定义
export interface TimeRange {
  start: string;
  end: string;
}

export interface PerformanceMetric {
  id: string;
  timestamp: string;
  metricType: string;
  value: number;
  unit?: string;
  agentId?: string;
  nodeId?: string;
  tags?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface PerformanceAnalysisParams {
  timeRange?: string;
  startDate?: string;
  endDate?: string;
  agentId?: string;
  nodeId?: string;
  metricTypes?: string[];
}

export interface PerformanceAnalysisData {
  overview: Record<string, any>;
  metrics: {
    raw: PerformanceMetric[];
    grouped: Record<string, PerformanceMetric[]>;
    aggregated: Record<string, any>;
    summary: Record<string, any>;
  };
  systemPerformance: {
    metrics: any[];
    summary: Record<string, any>;
  };
  agentPerformance: {
    executions: any[];
    statistics: Record<string, any>;
  };
  trends: Record<string, any>;
  anomalies: any[];
  timeRange: TimeRange;
}

export interface UsageAnalysisParams {
  timeRange?: string;
  startDate?: string;
  endDate?: string;
  userId?: string;
  agentId?: string;
  granularity?: 'hour' | 'day' | 'week' | 'month';
}

export interface UsageAnalysisData {
  overview: Record<string, any>;
  userUsage: {
    activities: any[];
    aggregated: Record<string, any[]>;
    statistics: Record<string, any>;
  };
  agentUsage: {
    executions: any[];
    aggregated: Record<string, any[]>;
    statistics: Record<string, any>;
  };
  workflowUsage: {
    executions: any[];
    aggregated: Record<string, any[]>;
    statistics: Record<string, any>;
  };
  apiUsage: {
    calls: any[];
    aggregated: Record<string, any[]>;
    statistics: Record<string, any>;
  };
  behaviorAnalysis: Record<string, any>;
  trends: Record<string, any>;
  timeRange: TimeRange;
}

export interface TrendAnalysisParams {
  timeRange?: string;
  startDate?: string;
  endDate?: string;
  metrics?: string[];
  analysisTypes?: string[];
  predictionDays?: number;
}

export interface TrendAnalysisData {
  overview: Record<string, any>;
  trends: Record<string, any>;
  seasonality: Record<string, any>;
  anomalies: any[];
  predictions: Record<string, any>;
  correlations: Record<string, any>;
  impactFactors: Record<string, any>;
  historicalData: any[];
}

export interface RealtimeAnalysisParams {
  metrics?: string[];
  interval?: string;
}

export interface RealtimeAnalysisData {
  timestamp: string;
  metrics: Record<string, any>;
  anomalies: any[];
  alerts: any[];
}

export interface AnalysisReportParams {
  reportType?: 'performance' | 'usage' | 'trend' | 'comprehensive';
  timeRange?: string;
  startDate?: string;
  endDate?: string;
  modules?: string[];
  format?: 'json' | 'pdf' | 'excel' | 'csv';
  includeCharts?: boolean;
}

export interface AnalysisReportData {
  reportId: string;
  reportUrl: string;
  generatedAt: string;
  format: string;
  modules: string[];
}

export interface AnalysisConfig {
  performanceThresholds: Record<string, any>;
  alertRules: any[];
  retentionPeriod: number;
  samplingRate: number;
  enableRealtime: boolean;
  dashboardConfig: Record<string, any>;
  notificationSettings: Record<string, any>;
}

/**
 * 分析洞察服务类
 */
class AnalyticsService {
  /**
   * 获取性能分析数据
   */
  async getPerformanceAnalysis(params: PerformanceAnalysisParams = {}): Promise<PerformanceAnalysisData> {
    try {
      const response = await analyticsApi.get('/performance', { params });
      return response.data.data;
    } catch (error) {
      console.error('获取性能分析数据失败:', error);
      throw error;
    }
  }

  /**
   * 获取特定指标的性能数据
   */
  async getPerformanceMetric(metricType: string, params: Omit<PerformanceAnalysisParams, 'metricTypes'> = {}): Promise<PerformanceAnalysisData> {
    try {
      const response = await analyticsApi.get(`/performance/metrics/${metricType}`, { params });
      return response.data.data;
    } catch (error) {
      console.error(`获取${metricType}性能指标失败:`, error);
      throw error;
    }
  }

  /**
   * 获取使用分析数据
   */
  async getUsageAnalysis(params: UsageAnalysisParams = {}): Promise<UsageAnalysisData> {
    try {
      const response = await analyticsApi.get('/usage', { params });
      return response.data.data;
    } catch (error) {
      console.error('获取使用分析数据失败:', error);
      throw error;
    }
  }

  /**
   * 获取特定用户的使用分析数据
   */
  async getUserUsageAnalysis(userId: string, params: Omit<UsageAnalysisParams, 'userId'> = {}): Promise<UsageAnalysisData> {
    try {
      const response = await analyticsApi.get(`/usage/users/${userId}`, { params });
      return response.data.data;
    } catch (error) {
      console.error(`获取用户${userId}使用分析数据失败:`, error);
      throw error;
    }
  }

  /**
   * 获取特定Agent的使用分析数据
   */
  async getAgentUsageAnalysis(agentId: string, params: Omit<UsageAnalysisParams, 'agentId'> = {}): Promise<UsageAnalysisData> {
    try {
      const response = await analyticsApi.get(`/usage/agents/${agentId}`, { params });
      return response.data.data;
    } catch (error) {
      console.error(`获取Agent${agentId}使用分析数据失败:`, error);
      throw error;
    }
  }

  /**
   * 获取趋势分析数据
   */
  async getTrendAnalysis(params: TrendAnalysisParams = {}): Promise<TrendAnalysisData> {
    try {
      const response = await analyticsApi.get('/trends', { params });
      return response.data.data;
    } catch (error) {
      console.error('获取趋势分析数据失败:', error);
      throw error;
    }
  }

  /**
   * 获取预测分析数据
   */
  async getPredictionAnalysis(params: Pick<TrendAnalysisParams, 'metrics' | 'predictionDays'> = {}): Promise<TrendAnalysisData> {
    try {
      const response = await analyticsApi.get('/trends/predictions', { params });
      return response.data.data;
    } catch (error) {
      console.error('获取预测分析数据失败:', error);
      throw error;
    }
  }

  /**
   * 获取异常检测数据
   */
  async getAnomalyDetection(params: Pick<TrendAnalysisParams, 'timeRange' | 'startDate' | 'endDate'> & { sensitivity?: 'low' | 'medium' | 'high' } = {}): Promise<TrendAnalysisData> {
    try {
      const response = await analyticsApi.get('/trends/anomalies', { params });
      return response.data.data;
    } catch (error) {
      console.error('获取异常检测数据失败:', error);
      throw error;
    }
  }

  /**
   * 获取实时分析数据
   */
  async getRealtimeAnalysis(params: RealtimeAnalysisParams = {}): Promise<RealtimeAnalysisData> {
    try {
      const response = await analyticsApi.get('/realtime', { params });
      return response.data.data;
    } catch (error) {
      console.error('获取实时分析数据失败:', error);
      throw error;
    }
  }

  /**
   * 生成分析报告
   */
  async generateAnalysisReport(params: AnalysisReportParams): Promise<AnalysisReportData> {
    try {
      const response = await analyticsApi.post('/reports', params);
      return response.data.data;
    } catch (error) {
      console.error('生成分析报告失败:', error);
      throw error;
    }
  }

  /**
   * 获取分析配置
   */
  async getAnalysisConfig(): Promise<AnalysisConfig> {
    try {
      const response = await analyticsApi.get('/config');
      return response.data.data;
    } catch (error) {
      console.error('获取分析配置失败:', error);
      throw error;
    }
  }

  /**
   * 更新分析配置
   */
  async updateAnalysisConfig(config: Partial<AnalysisConfig>): Promise<AnalysisConfig> {
    try {
      const response = await analyticsApi.put('/config', config);
      return response.data.data;
    } catch (error) {
      console.error('更新分析配置失败:', error);
      throw error;
    }
  }

  /**
   * 检查分析服务健康状态
   */
  async checkHealth(): Promise<any> {
    try {
      const response = await analyticsApi.get('/health');
      return response.data.data;
    } catch (error) {
      console.error('检查分析服务健康状态失败:', error);
      throw error;
    }
  }

  /**
   * 导出分析数据
   */
  async exportAnalysisData(type: 'performance' | 'usage' | 'trend', params: any, format: 'csv' | 'excel' | 'json' = 'csv'): Promise<Blob> {
    try {
      const response = await analyticsApi.get(`/${type}/export`, {
        params: { ...params, format },
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('导出分析数据失败:', error);
      throw error;
    }
  }

  /**
   * 获取分析数据摘要
   */
  async getAnalyticsSummary(timeRange: string = '7d'): Promise<any> {
    try {
      const [performance, usage, trends] = await Promise.all([
        this.getPerformanceAnalysis({ timeRange }),
        this.getUsageAnalysis({ timeRange }),
        this.getTrendAnalysis({ timeRange })
      ]);

      return {
        performance: {
          overview: performance.overview,
          keyMetrics: this.extractKeyMetrics(performance.metrics.summary),
          alerts: performance.anomalies.length
        },
        usage: {
          overview: usage.overview,
          activeUsers: usage.userUsage.statistics.uniqueUsers || 0,
          totalExecutions: usage.agentUsage.statistics.totalExecutions || 0
        },
        trends: {
          overview: trends.overview,
          predictions: Object.keys(trends.predictions).length,
          anomalies: trends.anomalies.length
        },
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('获取分析数据摘要失败:', error);
      throw error;
    }
  }

  /**
   * 提取关键指标
   */
  private extractKeyMetrics(summary: Record<string, any>): Record<string, any> {
    const keyMetrics: Record<string, any> = {};
    
    // 提取响应时间相关指标
    if (summary.response_time) {
      keyMetrics.avgResponseTime = summary.response_time.avg;
      keyMetrics.p95ResponseTime = summary.response_time.p95;
    }
    
    // 提取成功率指标
    if (summary.success_rate) {
      keyMetrics.successRate = summary.success_rate.avg;
    }
    
    // 提取错误率指标
    if (summary.error_rate) {
      keyMetrics.errorRate = summary.error_rate.avg;
    }
    
    // 提取吞吐量指标
    if (summary.throughput) {
      keyMetrics.throughput = summary.throughput.avg;
    }
    
    return keyMetrics;
  }

  /**
   * 格式化时间范围
   */
  formatTimeRange(timeRange: string): { start: string; end: string } {
    const now = new Date();
    let start: Date;
    
    switch (timeRange) {
      case '1h':
        start = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case '6h':
        start = new Date(now.getTime() - 6 * 60 * 60 * 1000);
        break;
      case '24h':
      case '1d':
        start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        start = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }
    
    return {
      start: start.toISOString(),
      end: now.toISOString()
    };
  }

  /**
   * 创建WebSocket连接用于实时数据
   */
  createRealtimeConnection(onMessage: (data: any) => void, onError?: (error: any) => void): WebSocket | null {
    try {
      const wsUrl = `${API_BASE_URL.replace('http', 'ws')}/ws/analytics/realtime`;
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        console.log('实时分析WebSocket连接已建立');
      };
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          onMessage(data);
        } catch (error) {
          console.error('解析实时数据失败:', error);
        }
      };
      
      ws.onerror = (error) => {
        console.error('实时分析WebSocket连接错误:', error);
        if (onError) {
          onError(error);
        }
      };
      
      ws.onclose = () => {
        console.log('实时分析WebSocket连接已关闭');
      };
      
      return ws;
    } catch (error) {
      console.error('创建实时分析WebSocket连接失败:', error);
      return null;
    }
  }
}

// 创建并导出服务实例
const analyticsService = new AnalyticsService();
export default analyticsService;

// 导出类型
export {
  AnalyticsService
};

export type {
  PerformanceAnalysisParams,
  PerformanceAnalysisData,
  UsageAnalysisParams,
  UsageAnalysisData,
  TrendAnalysisParams,
  TrendAnalysisData,
  RealtimeAnalysisParams,
  RealtimeAnalysisData
};