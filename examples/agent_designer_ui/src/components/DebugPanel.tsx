import React, { useState } from 'react';
import { Button, Tabs, List, Typography, Tag, Collapse, Spin, message } from 'antd';
import { PlayCircleOutlined, StopOutlined, BugOutlined, InfoCircleOutlined, WarningOutlined } from '@ant-design/icons';
import { AgentStatus } from './types';
import ApiService from './ApiService';
import './AgentDesigner.css';

const { TabPane } = Tabs;
const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;

// 调试面板属性接口
interface DebugPanelProps {
  agentId: string;
  agentStatus: AgentStatus;
  onStatusChange: (status: AgentStatus) => void;
}

/**
 * 调试面板组件
 * 用于调试和监控Agent运行状态
 */
const DebugPanel: React.FC<DebugPanelProps> = ({
  agentId,
  agentStatus,
  onStatusChange
}) => {
  // 日志状态
  const [logs, setLogs] = useState<any[]>([]);
  // 错误状态
  const [errors, setErrors] = useState<any[]>([]);
  // 加载状态
  const [loading, setLoading] = useState<boolean>(false);
  
  // 启动Agent
  const handleStartAgent = async () => {
    if (!agentId) {
      message.error('请先保存Agent');
      return;
    }
    
    setLoading(true);
    try {
      await ApiService.startAgent(agentId);
      onStatusChange(AgentStatus.RUNNING);
      message.success('Agent启动成功');
      
      // 开始获取日志
      fetchLogs();
    } catch (error) {
      console.error('启动Agent失败:', error);
      message.error('启动Agent失败');
    } finally {
      setLoading(false);
    }
  };
  
  // 停止Agent
  const handleStopAgent = async () => {
    if (!agentId) {
      return;
    }
    
    setLoading(true);
    try {
      await ApiService.stopAgent(agentId);
      onStatusChange(AgentStatus.STOPPED);
      message.success('Agent已停止');
    } catch (error) {
      console.error('停止Agent失败:', error);
      message.error('停止Agent失败');
    } finally {
      setLoading(false);
    }
  };
  
  // 获取日志
  const fetchLogs = async () => {
    if (!agentId || agentStatus !== AgentStatus.RUNNING) {
      return;
    }
    
    try {
      const response = await ApiService.getAgentLogs(agentId);
      setLogs(response.logs || []);
      setErrors(response.errors || []);
      
      // 定时获取日志
      setTimeout(fetchLogs, 3000);
    } catch (error) {
      console.error('获取日志失败:', error);
    }
  };
  
  // 渲染日志项
  const renderLogItem = (log: any) => {
    const logLevel = log.level?.toLowerCase() || 'info';
    let icon = <InfoCircleOutlined />;
    let color = 'blue';
    
    if (logLevel === 'error') {
      icon = <BugOutlined />;
      color = 'red';
    } else if (logLevel === 'warning') {
      icon = <WarningOutlined />;
      color = 'orange';
    }
    
    return (
      <List.Item>
        <div className="log-item">
          <div className="log-time">{new Date(log.timestamp).toLocaleTimeString()}</div>
          <Tag color={color} icon={icon}>{log.level}</Tag>
          <div className="log-message">{log.message}</div>
        </div>
      </List.Item>
    );
  };
  
  // 渲染错误项
  const renderErrorItem = (error: any) => {
    return (
      <Panel 
        header={
          <div className="error-header">
            <Tag color="red">错误</Tag>
            <span>{error.message}</span>
            <span className="error-time">{new Date(error.timestamp).toLocaleTimeString()}</span>
          </div>
        } 
        key={error.id || error.timestamp}
      >
        <div className="error-detail">
          <Paragraph>
            <Text strong>错误类型:</Text> {error.type}
          </Paragraph>
          <Paragraph>
            <Text strong>位置:</Text> {error.location}
          </Paragraph>
          {error.stackTrace && (
            <Paragraph>
              <Text strong>堆栈跟踪:</Text>
              <pre>{error.stackTrace}</pre>
            </Paragraph>
          )}
        </div>
      </Panel>
    );
  };
  
  return (
    <div className="debug-panel">
      <div className="debug-header">
        <Title level={4}>调试面板</Title>
        <div className="debug-controls">
          {agentStatus === AgentStatus.RUNNING ? (
            <Button 
              type="primary" 
              danger
              icon={<StopOutlined />}
              onClick={handleStopAgent}
              loading={loading}
            >
              停止
            </Button>
          ) : (
            <Button 
              type="primary"
              icon={<PlayCircleOutlined />}
              onClick={handleStartAgent}
              loading={loading}
            >
              启动
            </Button>
          )}
        </div>
      </div>
      
      <Tabs defaultActiveKey="logs">
        <TabPane tab="日志" key="logs">
          {loading ? (
            <div className="loading-container">
              <Spin tip="加载中..." />
            </div>
          ) : (
            <List
              className="log-list"
              dataSource={logs}
              renderItem={renderLogItem}
              locale={{ emptyText: '暂无日志' }}
            />
          )}
        </TabPane>
        
        <TabPane tab={`错误 (${errors.length})`} key="errors">
          {loading ? (
            <div className="loading-container">
              <Spin tip="加载中..." />
            </div>
          ) : (
            <Collapse className="error-list">
              {errors.map(renderErrorItem)}
            </Collapse>
          )}
        </TabPane>
      </Tabs>
    </div>
  );
};

export default DebugPanel;