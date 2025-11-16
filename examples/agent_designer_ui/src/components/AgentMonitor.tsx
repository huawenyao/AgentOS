import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, Tabs, Table, Tag, Button, Space, Tooltip, Badge, Empty, Spin, Alert, Typography } from 'antd';
import type { BadgeProps } from 'antd';
import { ReloadOutlined, DownloadOutlined, ClearOutlined, PauseOutlined, CaretRightOutlined } from '@ant-design/icons';
import apiService from './ApiService';
import './AgentMonitor.css';

const { Text } = Typography;

interface LogEntry {
  id: string;
  agent_id: string;
  level: 'info' | 'debug' | 'warning' | 'error';
  message: string;
  timestamp: string;
}

interface AgentMonitorProps {
  agentId: string | null;
  agentName?: string;
  agentStatus?: 'running' | 'stopped' | 'error';
  onRefresh?: () => void;
}

const AgentMonitor: React.FC<AgentMonitorProps> = ({ 
  agentId, 
  agentName = '未选择Agent', 
  agentStatus = 'stopped',
  onRefresh 
}) => {
  const [activeTab, setActiveTab] = useState('logs');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [autoScroll, setAutoScroll] = useState(true);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 加载日志数据
  const loadLogs = useCallback(async () => {
    if (!agentId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiService.getAgentLogs(agentId);
      
      if (response.success) {
        setLogs(response.data);
      } else {
        setError(response.error || '加载日志失败');
      }
    } catch (err) {
      setError('加载日志时发生错误');
      console.error('Error loading logs:', err);
    } finally {
      setLoading(false);
    }
  }, [agentId]);

  // 清除日志
  const clearLogs = () => {
    setLogs([]);
  };

  // 下载日志
  const downloadLogs = () => {
    if (logs.length === 0) return;
    
    const logText = logs.map(log => {
      return `[${log.timestamp}] [${log.level.toUpperCase()}] ${log.message}`;
    }).join('\n');
    
    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agent_${agentId}_logs_${new Date().toISOString().replace(/[:.]/g, '-')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 自动滚动到底部
  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  // 自动刷新
  useEffect(() => {
    if (autoRefresh && agentId && agentStatus === 'running') {
      loadLogs();
      refreshTimerRef.current = setInterval(loadLogs, 5000);
    } else if (refreshTimerRef.current) {
      clearInterval(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
    
    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
    };
  }, [autoRefresh, agentId, agentStatus, loadLogs]);

  // 初始加载和Agent ID变化时加载日志
  useEffect(() => {
    if (agentId) {
      loadLogs();
    } else {
      setLogs([]);
      setError(null);
    }
  }, [agentId, loadLogs]);

  // 日志级别对应的标签颜色
  const getLevelColor = (level: string) => {
    switch (level) {
      case 'info': return 'blue';
      case 'debug': return 'green';
      case 'warning': return 'orange';
      case 'error': return 'red';
      default: return 'default';
    }
  };

  // 获取Agent状态对应的标签
  const getStatusBadge = () => {
    const statusMap: Record<string, BadgeProps['status']> = {
      'running': 'processing',
      'error': 'error',
      'stopped': 'default'
    };
    
    const textMap = {
      'running': '运行中',
      'error': '错误',
      'stopped': '已停止'
    };

    return <Badge status={statusMap[agentStatus] || 'default'} text={textMap[agentStatus] || '未知'} />;
  };

  // 日志表格列定义
  const columns = [
    {
      title: '时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 180,
      render: (text: string) => {
        const date = new Date(text);
        return date.toLocaleString();
      }
    },
    {
      title: '级别',
      dataIndex: 'level',
      key: 'level',
      width: 100,
      render: (text: string) => (
        <Tag color={getLevelColor(text)}>{text.toUpperCase()}</Tag>
      )
    },
    {
      title: '消息',
      dataIndex: 'message',
      key: 'message',
      render: (text: string) => <Text>{text}</Text>
    }
  ];

  return (
    <Card 
      className="agent-monitor"
      title={
        <div className="agent-monitor-header">
          <span>{agentName}</span>
          <span className="agent-status">{getStatusBadge()}</span>
        </div>
      }
      extra={
        <Space>
          <Tooltip title="刷新">
            <Button 
              icon={<ReloadOutlined />}
              onClick={() => {
                loadLogs();
                if (onRefresh) onRefresh();
              }}
              loading={loading}
            />
          </Tooltip>
          <Tooltip title={autoRefresh ? "暂停自动刷新" : "启用自动刷新"}>
            <Button 
              icon={autoRefresh ? <PauseOutlined /> : <CaretRightOutlined />}
              onClick={() => setAutoRefresh(!autoRefresh)}
              type={autoRefresh ? "primary" : "default"}
            />
          </Tooltip>
        </Space>
      }
    >
      <Tabs activeKey={activeTab} onChange={setActiveTab} items={[
        {
          label: '日志',
          key: 'logs',
          children: (
            <div className="agent-monitor-toolbar">
              <Space>
                <Button 
                  onClick={clearLogs}
                  disabled={logs.length === 0}
                  icon={<ClearOutlined />}
                >
                  清除
                </Button>
                <Button 
                  onClick={downloadLogs}
                  disabled={logs.length === 0}
                  icon={<DownloadOutlined />}
                >
                  下载
                </Button>
                <Button 
                  onClick={() => setAutoScroll(!autoScroll)}
                  type={autoScroll ? "primary" : "default"}
                >
                  {autoScroll ? "自动滚动: 开" : "自动滚动: 关"}
                </Button>
              </Space>
              
              {error && (
                <Alert 
                  message="错误"
                  description={error}
                  type="error"
                  showIcon
                  className="agent-monitor-error"
                />
              )}
              
              {loading && logs.length === 0 ? (
                <div className="agent-monitor-loading">
                  <Spin tip="加载中..." />
                </div>
              ) : logs.length === 0 ? (
                <Empty description="暂无日志" />
              ) : (
                <div className="agent-monitor-logs">
                  <Table 
                    dataSource={logs}
                    columns={columns}
                    rowKey={(record) => record.id}
                    pagination={false}
                    
                    scroll={{ y: 300 }}
                  />
                  <div ref={logsEndRef} />
                </div>
              )}
            </div>
          )
        },
        {
          label: '性能',
          key: 'performance',
          children: (
            <div className="agent-monitor-performance">
              <Empty description="性能监控功能即将推出" />
            </div>
          )
        },
        {
          label: '状态',
          key: 'state',
          children: (
            <div className="agent-monitor-state">
              <Empty description="状态监控功能即将推出" />
            </div>
          )
        }
      ]} />
    </Card>
  );
};

export default AgentMonitor;
