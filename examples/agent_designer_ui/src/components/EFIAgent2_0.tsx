/**
 * EFIAgent 2.0 主界面
 * 基于能力系统模型的智能协作平台
 * 整合Agent设计器、能力库、工作流设计器等核心功能
 */

import React, { useState, useEffect } from 'react';
import {
  Layout, Menu, Breadcrumb, Avatar, Dropdown, Badge, notification,
  Button, Space, Tooltip, Modal, Form, Input, Select, Card,
  Row, Col, Statistic, Progress, Timeline, List, Tag, Alert
} from 'antd';
import {
  MenuFoldOutlined, MenuUnfoldOutlined, BellOutlined, UserOutlined,
  SettingOutlined, LogoutOutlined, HomeOutlined, AppstoreOutlined,
  BranchesOutlined, DatabaseOutlined, TeamOutlined, MonitorOutlined,
  BookOutlined, ExperimentOutlined, CloudOutlined, SecurityScanOutlined,
  BulbOutlined, ThunderboltOutlined, RocketOutlined,
  ApiOutlined, InteractionOutlined, FunctionOutlined, CodeOutlined,
  DashboardOutlined, BarChartOutlined, LineChartOutlined,
  PieChartOutlined, AreaChartOutlined, DotChartOutlined
} from '@ant-design/icons';

// 导入EFIAgent 2.0组件
import { BrowserRouter as Router } from 'react-router-dom';
import AgentDesigner2_0 from './AgentDesigner2_0';
import AgentManager2_0 from './AgentManager2_0';
import CapabilityLibrary2_0 from './CapabilityLibrary2_0';
import CapabilityOrchestrator from './CapabilityOrchestrator';
import WorkflowDesigner2_0 from './WorkflowDesigner2_0';
import { Agent2_0, CoreCapabilityModule } from './CapabilitySystemTypes';
import './EFIAgent2_0.css';

const { Header, Sider, Content } = Layout;
const { SubMenu } = Menu;
const { Option } = Select;

interface EFIAgent2_0Props {
  initialView?: string;
  user?: {
    id: string;
    name: string;
    avatar?: string;
    role: string;
  };
}

interface SystemStats {
  totalAgents: number;
  activeAgents: number;
  totalCapabilities: number;
  totalWorkflows: number;
  systemLoad: number;
  memoryUsage: number;
  networkLatency: number;
}

interface NotificationItem {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

const EFIAgent2_0: React.FC<EFIAgent2_0Props> = ({
  initialView = 'dashboard',
  user = {
    id: 'user_1',
    name: 'EFI用户',
    role: 'Administrator'
  }
}) => {
  // 核心状态
  const [collapsed, setCollapsed] = useState(false);
  const [currentView, setCurrentView] = useState(initialView);
  const [selectedAgent, setSelectedAgent] = useState<Agent2_0 | null>(null);
  const [systemStats, setSystemStats] = useState<SystemStats>({
    totalAgents: 0,
    activeAgents: 0,
    totalCapabilities: 0,
    totalWorkflows: 0,
    systemLoad: 0,
    memoryUsage: 0,
    networkLatency: 0
  });
  
  // UI状态
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  
  /**
   * 初始化组件
   */
  useEffect(() => {
    loadSystemStats();
    loadNotifications();
    
    // 定期更新系统状态
    const interval = setInterval(loadSystemStats, 30000);
    return () => clearInterval(interval);
  }, []);
  
  /**
   * 加载系统统计信息
   */
  const loadSystemStats = async () => {
    try {
      // TODO: 从API加载实际数据
      const agents = JSON.parse(localStorage.getItem('agents_2_0') || '[]');
      const capabilities = JSON.parse(localStorage.getItem('capabilities_2_0') || '[]');
      const workflows = JSON.parse(localStorage.getItem('workflows_global') || '[]');
      
      setSystemStats({
        totalAgents: agents.length,
        activeAgents: agents.length, // 暂时使用总数，因为Agent2_0类型中没有status属性
        totalCapabilities: capabilities.length,
        totalWorkflows: workflows.length,
        systemLoad: Math.random() * 100,
        memoryUsage: 60 + Math.random() * 30,
        networkLatency: 10 + Math.random() * 50
      });
    } catch (error) {
      console.error('Load system stats error:', error);
    }
  };
  
  /**
   * 加载通知信息
   */
  const loadNotifications = async () => {
    try {
      // TODO: 从API加载实际通知
      const mockNotifications: NotificationItem[] = [
        {
          id: 'notif_1',
          type: 'success',
          title: 'Agent部署成功',
          message: '智能客服Agent已成功部署到生产环境',
          timestamp: new Date(Date.now() - 5 * 60 * 1000),
          read: false
        },
        {
          id: 'notif_2',
          type: 'warning',
          title: '能力库更新',
          message: '新版本的推理能力模块可用，建议升级',
          timestamp: new Date(Date.now() - 30 * 60 * 1000),
          read: false
        },
        {
          id: 'notif_3',
          type: 'info',
          title: '系统维护通知',
          message: '系统将于今晚22:00-24:00进行例行维护',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          read: true
        }
      ];
      
      setNotifications(mockNotifications);
    } catch (error) {
      console.error('Load notifications error:', error);
    }
  };
  
  /**
   * 渲染侧边栏菜单
   */
  const renderSideMenu = () => {
    return (
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[currentView]}
        onClick={({ key }) => setCurrentView(key)}
        style={{ height: '100%', borderRight: 0 }}
      >
        <Menu.Item key="dashboard" icon={<DashboardOutlined />}>
          控制台
        </Menu.Item>
        
        <SubMenu key="agents" icon={<BulbOutlined />} title="智能体管理">
          <Menu.Item key="agent-designer" icon={<AppstoreOutlined />}>
            Agent设计器
          </Menu.Item>
          <Menu.Item key="agent-manager" icon={<TeamOutlined />}>
            Agent管理
          </Menu.Item>
          <Menu.Item key="agent-monitor" icon={<MonitorOutlined />}>
            运行监控
          </Menu.Item>
        </SubMenu>
        
        <SubMenu key="capabilities" icon={<ThunderboltOutlined />} title="能力系统">
          <Menu.Item key="capability-library" icon={<BookOutlined />}>
            能力库
          </Menu.Item>
          <Menu.Item key="capability-orchestrator" icon={<ApiOutlined />}>
            能力编排
          </Menu.Item>
          <Menu.Item key="capability-market" icon={<CloudOutlined />}>
            能力市场
          </Menu.Item>
        </SubMenu>
        
        <SubMenu key="workflows" icon={<BranchesOutlined />} title="工作流">
          <Menu.Item key="workflow-designer" icon={<ExperimentOutlined />}>
            工作流设计
          </Menu.Item>
          <Menu.Item key="workflow-templates" icon={<FunctionOutlined />}>
            模板库
          </Menu.Item>
          <Menu.Item key="workflow-execution" icon={<RocketOutlined />}>
            执行历史
          </Menu.Item>
        </SubMenu>
        
        <SubMenu key="collaboration" icon={<InteractionOutlined />} title="协作平台">
          <Menu.Item key="knowledge-graph" icon={<DatabaseOutlined />}>
            知识图谱
          </Menu.Item>
          <Menu.Item key="learning-center" icon={<BulbOutlined />}>
            学习中心
          </Menu.Item>
          <Menu.Item key="collaboration-space" icon={<TeamOutlined />}>
            协作空间
          </Menu.Item>
        </SubMenu>
        
        <SubMenu key="analytics" icon={<BarChartOutlined />} title="分析洞察">
          <Menu.Item key="performance-analytics" icon={<LineChartOutlined />}>
            性能分析
          </Menu.Item>
          <Menu.Item key="usage-analytics" icon={<PieChartOutlined />}>
            使用分析
          </Menu.Item>
          <Menu.Item key="trend-analysis" icon={<AreaChartOutlined />}>
            趋势分析
          </Menu.Item>
        </SubMenu>
        
        <Menu.Item key="settings" icon={<SettingOutlined />}>
          系统设置
        </Menu.Item>
      </Menu>
    );
  };
  
  /**
   * 渲染用户菜单
   */
  const renderUserMenu = () => {
    const menu = (
      <Menu>
        <Menu.Item key="profile" icon={<UserOutlined />}>
          个人资料
        </Menu.Item>
        <Menu.Item key="settings" icon={<SettingOutlined />}>
          账户设置
        </Menu.Item>
        <Menu.Divider />
        <Menu.Item key="logout" icon={<LogoutOutlined />}>
          退出登录
        </Menu.Item>
      </Menu>
    );
    
    return (
      <Dropdown overlay={menu} placement="bottomRight">
        <Space style={{ cursor: 'pointer' }}>
          <Avatar src={user.avatar} icon={<UserOutlined />} />
          <span style={{ color: '#fff' }}>{user.name}</span>
        </Space>
      </Dropdown>
    );
  };
  
  /**
   * 渲染通知菜单
   */
  const renderNotificationMenu = () => {
    const unreadCount = notifications.filter(n => !n.read).length;
    
    const menu = (
      <div style={{ width: 300, maxHeight: 400, overflow: 'auto' }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0' }}>
          <strong>通知中心</strong>
        </div>
        <List
          dataSource={notifications.slice(0, 5)}
          renderItem={(item) => (
            <List.Item
              style={{
                padding: '12px 16px',
                backgroundColor: item.read ? '#fff' : '#f6ffed'
              }}
            >
              <List.Item.Meta
                title={
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>{item.title}</span>
                    {!item.read && <Badge status="processing" />}
                  </div>
                }
                description={
                  <div>
                    <div style={{ marginBottom: 4 }}>{item.message}</div>
                    <small style={{ color: '#999' }}>
                      {item.timestamp.toLocaleString()}
                    </small>
                  </div>
                }
              />
            </List.Item>
          )}
        />
        {notifications.length > 5 && (
          <div style={{ padding: '8px 16px', textAlign: 'center', borderTop: '1px solid #f0f0f0' }}>
            <Button type="link" size="small">查看全部通知</Button>
          </div>
        )}
      </div>
    );
    
    return (
      <Dropdown overlay={menu} placement="bottomRight" trigger={['click']}>
        <Badge count={unreadCount} size="small">
          <Button type="text" icon={<BellOutlined />} style={{ color: '#fff' }} />
        </Badge>
      </Dropdown>
    );
  };
  
  /**
   * 渲染控制台仪表板
   */
  const renderDashboard = () => {
    return (
      <div className="dashboard">
        <Row gutter={[16, 16]}>
          {/* 系统统计 */}
          <Col span={24}>
            <Card title="系统概览" className="stats-card">
              <Row gutter={16}>
                <Col span={6}>
                  <Statistic
                    title="总Agent数"
                    value={systemStats.totalAgents}
                    prefix={<BulbOutlined />}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="活跃Agent"
                    value={systemStats.activeAgents}
                    prefix={<RocketOutlined />}
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="能力模块"
                    value={systemStats.totalCapabilities}
                    prefix={<ThunderboltOutlined />}
                    valueStyle={{ color: '#faad14' }}
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="工作流"
                    value={systemStats.totalWorkflows}
                    prefix={<BranchesOutlined />}
                    valueStyle={{ color: '#722ed1' }}
                  />
                </Col>
              </Row>
            </Card>
          </Col>
          
          {/* 系统性能 */}
          <Col span={12}>
            <Card title="系统性能" className="performance-card">
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span>CPU使用率</span>
                  <span>{systemStats.systemLoad.toFixed(1)}%</span>
                </div>
                <Progress percent={systemStats.systemLoad} status="active" />
              </div>
              
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span>内存使用率</span>
                  <span>{systemStats.memoryUsage.toFixed(1)}%</span>
                </div>
                <Progress percent={systemStats.memoryUsage} />
              </div>
              
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span>网络延迟</span>
                  <span>{systemStats.networkLatency.toFixed(0)}ms</span>
                </div>
                <Progress 
                  percent={(100 - systemStats.networkLatency) * 100 / 100} 
                  strokeColor={systemStats.networkLatency > 50 ? '#ff4d4f' : '#52c41a'}
                />
              </div>
            </Card>
          </Col>
          
          {/* 最近活动 */}
          <Col span={12}>
            <Card title="最近活动" className="activity-card">
              <Timeline>
                <Timeline.Item color="green">
                  <div>
                    <div>智能客服Agent部署成功</div>
                    <small style={{ color: '#999' }}>5分钟前</small>
                  </div>
                </Timeline.Item>
                <Timeline.Item color="blue">
                  <div>
                    <div>新增推理能力模块</div>
                    <small style={{ color: '#999' }}>30分钟前</small>
                  </div>
                </Timeline.Item>
                <Timeline.Item color="orange">
                  <div>
                    <div>工作流执行完成</div>
                    <small style={{ color: '#999' }}>1小时前</small>
                  </div>
                </Timeline.Item>
                <Timeline.Item>
                  <div>
                    <div>系统备份完成</div>
                    <small style={{ color: '#999' }}>2小时前</small>
                  </div>
                </Timeline.Item>
              </Timeline>
            </Card>
          </Col>
          
          {/* 快速操作 */}
          <Col span={24}>
            <Card title="快速操作" className="quick-actions-card">
              <Row gutter={16}>
                <Col span={6}>
                  <Button 
                    type="primary" 
                    block 
                    icon={<AppstoreOutlined />}
                    onClick={() => setCurrentView('agent-designer')}
                  >
                    创建新Agent
                  </Button>
                </Col>
                <Col span={6}>
                  <Button 
                    block 
                    icon={<BranchesOutlined />}
                    onClick={() => setCurrentView('workflow-designer')}
                  >
                    设计工作流
                  </Button>
                </Col>
                <Col span={6}>
                  <Button 
                    block 
                    icon={<BookOutlined />}
                    onClick={() => setCurrentView('capability-library')}
                  >
                    浏览能力库
                  </Button>
                </Col>
                <Col span={6}>
                  <Button 
                    block 
                    icon={<MonitorOutlined />}
                    onClick={() => setCurrentView('agent-monitor')}
                  >
                    监控中心
                  </Button>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>
      </div>
    );
  };
  
  /**
   * 渲染主内容区
   */
  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return renderDashboard();
      case 'agent-designer':
        return <Router><AgentDesigner2_0 /></Router>;
      case 'agent-manager':
        return <Router><AgentManager2_0 /></Router>;
      case 'capability-library':
        return <CapabilityLibrary2_0 />;
      case 'capability-orchestrator':
        return <CapabilityOrchestrator 
          orchestrator={{
            id: 'default',
            name: '默认编排器',
            description: '系统默认能力编排器',
            mode: 'sequential' as any,
            rules: [],
            capabilityMapping: [],
            executionStrategy: {
              loadBalancing: 'round_robin',
              failover: false,
              circuitBreaker: { enabled: false, failureThreshold: 5, recoveryTimeout: 30000, halfOpenMaxCalls: 3 },
              rateLimit: { enabled: false, requestsPerSecond: 100, burstSize: 10, strategy: 'token_bucket' }
            },
            optimization: {
              enabled: false,
              autoScaling: { enabled: false, minInstances: 1, maxInstances: 10, targetCpuUtilization: 70, targetMemoryUtilization: 80, scaleUpCooldown: 300, scaleDownCooldown: 600 },
              caching: { enabled: false, strategy: 'lru', maxSize: 1000, ttl: 3600 },
              prefetching: { enabled: false, strategy: 'predictive', lookaheadTime: 60 }
            }
          }}
          capabilities={[]}
          onChange={() => {}}
        />;
      case 'workflow-designer':
        return <WorkflowDesigner2_0 />;
      default:
        return (
          <div style={{ padding: 24, textAlign: 'center' }}>
            <Alert
              message="功能开发中"
              description={`${currentView} 功能正在开发中，敬请期待！`}
              type="info"
              showIcon
            />
          </div>
        );
    }
  };
  
  /**
   * 获取面包屑导航
   */
  const getBreadcrumb = () => {
    const breadcrumbMap: Record<string, string[]> = {
      'dashboard': ['控制台'],
      'agent-designer': ['智能体管理', 'Agent设计器'],
      'agent-manager': ['智能体管理', 'Agent管理'],
      'agent-monitor': ['智能体管理', '运行监控'],
      'capability-library': ['能力系统', '能力库'],
      'capability-orchestrator': ['能力系统', '能力编排'],
      'capability-market': ['能力系统', '能力市场'],
      'workflow-designer': ['工作流', '工作流设计'],
      'workflow-templates': ['工作流', '模板库'],
      'workflow-execution': ['工作流', '执行历史'],
      'knowledge-graph': ['协作平台', '知识图谱'],
      'learning-center': ['协作平台', '学习中心'],
      'collaboration-space': ['协作平台', '协作空间'],
      'performance-analytics': ['分析洞察', '性能分析'],
      'usage-analytics': ['分析洞察', '使用分析'],
      'trend-analysis': ['分析洞察', '趋势分析'],
      'settings': ['系统设置']
    };
    
    return breadcrumbMap[currentView] || ['未知页面'];
  };
  
  return (
    <Layout className="efi-agent-2-0">
      {/* 侧边栏 */}
      <Sider 
        trigger={null} 
        collapsible 
        collapsed={collapsed}
        width={240}
        className="sidebar"
      >
        <div className="logo">
          <img src="/logo.svg" alt="EFIAgent" />
          {!collapsed && <span>EFIAgent 2.0</span>}
        </div>
        {renderSideMenu()}
      </Sider>
      
      {/* 主布局 */}
      <Layout className="site-layout">
        {/* 顶部导航 */}
        <Header className="header">
          <div className="header-left">
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{ color: '#fff' }}
            />
            
            <Breadcrumb className="breadcrumb">
              <Breadcrumb.Item>
                <HomeOutlined />
              </Breadcrumb.Item>
              {getBreadcrumb().map((item, index) => (
                <Breadcrumb.Item key={index}>{item}</Breadcrumb.Item>
              ))}
            </Breadcrumb>
          </div>
          
          <div className="header-right">
            <Space size="middle">
              {renderNotificationMenu()}
              {renderUserMenu()}
            </Space>
          </div>
        </Header>
        
        {/* 内容区 */}
        <Content className="content">
          {renderContent()}
        </Content>
      </Layout>
    </Layout>
  );
};

export default EFIAgent2_0;