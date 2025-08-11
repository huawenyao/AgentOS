import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Layout, Menu, Button, Dropdown, Avatar, Switch, theme, Tabs, Space } from 'antd';
import { 
  DashboardOutlined, 
  AppstoreOutlined, 
  BookOutlined, 
  ShopOutlined, 
  ApiOutlined,
  NodeIndexOutlined, 
  MonitorOutlined, 
  SettingOutlined, 
  QuestionCircleOutlined,
  HistoryOutlined,
  UserOutlined,
  LogoutOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  RocketOutlined,
  StarOutlined,
  ExperimentOutlined,
  DownOutlined,
  FileTextOutlined,
  RobotOutlined,
  DatabaseOutlined,
  BarChartOutlined
} from '@ant-design/icons';

// 导入组件
import AgentDesigner from './AgentDesigner';
import AgentManager from './AgentManager';
import AgentPlayground from './AgentPlayground';
import TemplateLibrary from './TemplateLibrary';
import TemplateGallery from './TemplateGallery';
import CapabilityMarket from './CapabilityMarket';
import CapabilityLibrary from './CapabilityLibrary';
import CapabilityManager from './CapabilityManager';
import WorkflowDesigner from './WorkflowDesigner';
import WorkflowManager from './WorkflowManager';
import WorkflowMonitor from './WorkflowMonitor';
import AgentMonitor from './AgentMonitor';
import PromoPage from './PromoPage';
import CollegeAdmissionDemo from './CollegeAdmissionDemo';
import ReportManager from './ReportManager';
import Settings from './Settings';
import DataImportManager from './DataImportManager';
import AnalyticsInsights from './analytics/AnalyticsInsights';

// 导入全局状态管理
import { useGlobalState } from './StateManager';

// 导入样式
import '../index.css';
import { AgentTemplate, Capability, Component } from './types';

const { Header, Sider, Content, Footer } = Layout;
const { TabPane } = Tabs;

/**
 * MainApp组件 - 应用的主入口组件
 * 负责整体布局、路由管理和主题切换
 */
const MainApp: React.FC = () => {
  // 状态管理
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('agent-management');
  const globalState = useGlobalState();
  
  // 主题配置
  const { token } = theme.useToken();
  // 移除未使用的 themeConfig 状态

  // 切换主题模式
  const toggleTheme = (checked: boolean) => {
    setDarkMode(checked);
    // 移除对 setThemeConfig 的调用，因为它未被使用
  };

  // 用户菜单项
  const userMenuItems = [
    {
      key: 'profile',
      label: '个人资料',
      icon: <UserOutlined />
    },
    {
      key: 'settings',
      label: '账户设置',
      icon: <SettingOutlined />
    },
    {
      key: 'logout',
      label: '退出登录',
      icon: <LogoutOutlined />
    }
  ];

  // 侧边栏菜单项（Agent管理模式下显示）
  const agentManagementMenuItems = [
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: <Link to="/">仪表盘</Link>,
    },
    {
      key: 'agent-designer',
      icon: <AppstoreOutlined />,
      label: <Link to="/agent-designer">Agent设计器</Link>,
    },
    {
      key: 'agent-manager',
      icon: <RobotOutlined />,
      label: <Link to="/agent-manager">Agent管理</Link>,
    },
    {
      key: 'template-library',
      icon: <BookOutlined />,
      label: <Link to="/template-library">模板库</Link>,
    },
    {
      key: 'capability-market',
      icon: <ShopOutlined />,
      label: <Link to="/capability-market">能力市场</Link>,
    },
    {
      key: 'capability-library',
      icon: <ApiOutlined />,
      label: <Link to="/capability-library">能力库</Link>,
    },
    {
      key: 'capability-manager',
      icon: <ApiOutlined />,
      label: <Link to="/capability-manager">能力管理</Link>,
    },
    {
      key: 'workflow-manager',
      icon: <NodeIndexOutlined />,
      label: <Link to="/workflow-manager">工作流管理</Link>,
    },
    {
      key: 'workflow-designer',
      icon: <NodeIndexOutlined />,
      label: <Link to="/workflow-designer">工作流设计器</Link>,
    },
    {
      key: 'workflow-monitor',
      icon: <MonitorOutlined />,
      label: <Link to="/workflow-monitor">工作流监控</Link>,
    },
    {
      key: 'agent-monitor',
      icon: <MonitorOutlined />,
      label: <Link to="/agent-monitor">Agent监控</Link>,
    },
    {
      key: 'analytics-insights',
      icon: <BarChartOutlined />,
      label: <Link to="/analytics-insights">分析洞察</Link>,
    },
    {
      key: 'report-manager',
      icon: <FileTextOutlined />,
      label: <Link to="/report-manager">报告管理</Link>,
    },
    {
      key: 'data-import',
      icon: <DatabaseOutlined />,
      label: <Link to="/data-import">数据管理</Link>,
    },
    {
      key: 'version-control',
      icon: <HistoryOutlined />,
      label: <Link to="/version-control">版本控制</Link>,
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: <Link to="/settings">设置</Link>,
    },
    {
      key: 'help',
      icon: <QuestionCircleOutlined />,
      label: <Link to="/help">帮助中心</Link>,
    },
  ];

  // 案例下拉菜单项
  const caseMenuItems = [
    {
      key: 'college-admission',
      label: '高考志愿填报演示',
      onClick: () => setActiveTab('college-admission')
    }
  ];

  // 顶部Tab项
  const tabItems = [
    {
      key: 'agent-management',
      label: (
        <span>
          <AppstoreOutlined />
          Agent管理
        </span>
      ),
    },
    {
      key: 'agent-playground',
      label: (
        <span>
          <RocketOutlined />
          AI-OS
        </span>
      ),
    },
    {
      key: 'wumai-ai',
      label: (
        <span>
          <StarOutlined />
          吾脉AI
        </span>
      ),
    },
  ];

  // 自定义案例Tab渲染
  const renderCasesTab = () => (
    <Dropdown menu={{ items: caseMenuItems }} trigger={['click']}>
      <span 
        style={{ 
           cursor: 'pointer',
           display: 'inline-flex',
           alignItems: 'center',
           padding: '2px 12px',
            fontSize: '14px',
            fontWeight: 400,
            lineHeight: '20px',
           minHeight: '28px',
           borderRadius: '6px 6px 0 0',
           border: '1px solid #d9d9d9',
           borderBottom: 'none',
           background: '#fafafa',
           color: 'rgba(0, 0, 0, 0.88)',
           transition: 'all 0.2s',
           marginLeft: '2px'
         }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#e6f4ff';
          e.currentTarget.style.borderColor = '#91caff';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = activeTab === 'cases' || activeTab === 'college-admission' ? '#fff' : '#fafafa';
          e.currentTarget.style.borderColor = activeTab === 'cases' || activeTab === 'college-admission' ? '#1677ff' : '#d9d9d9';
        }}
        className={activeTab === 'cases' || activeTab === 'college-admission' ? 'active-cases-tab' : ''}
      >
        <Space size={8}>
          <ExperimentOutlined style={{ fontSize: '14px' }} />
          <span>案例</span>
          <DownOutlined style={{ fontSize: '12px' }} />
        </Space>
      </span>
    </Dropdown>
  );

  // 处理Tab切换
  const handleTabChange = (key: string) => {
    setActiveTab(key);
  };

  // 根据当前Tab获取菜单项
  const getCurrentMenuItems = () => {
    if (activeTab === 'agent-playground' || activeTab === 'wumai-ai' || activeTab === 'cases' || activeTab === 'college-admission') {
      return []; // Agent智能沙盒模式、吾脉AI和案例模式下隐藏侧边栏菜单
    }
    return agentManagementMenuItems;
  };

  // 渲染主要内容
  const renderMainContent = () => {
    if (activeTab === 'agent-playground') {
      return <AgentPlayground />;
    }
    
    if (activeTab === 'wumai-ai') {
      return <PromoPage onTabChange={handleTabChange} />;
    }
    
    if (activeTab === 'cases' || activeTab === 'college-admission') {
      return <CollegeAdmissionDemo />;
    }
    
    // Agent管理模式下显示路由内容
    return (
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/agent-designer" element={<AgentDesigner />} />
        <Route path="/agent-designer/:agentId" element={<AgentDesigner />} />
        <Route path="/agent-manager" element={<AgentManager />} />
        <Route path="/template-library" element={<TemplateLibrary onSelectTemplate={(template: AgentTemplate) => globalState.selectTemplate(template)} />} />
        <Route path="/template-gallery" element={<TemplateGallery />} />
        <Route path="/capability-market" element={<CapabilityMarket onSelectCapability={(capability: Capability) => globalState.selectComponent(capability as unknown as Component)} />} />
        <Route path="/capability-library" element={<CapabilityLibrary />} />
          <Route path="/capability-manager" element={<CapabilityManager />} />
        <Route path="/workflow-manager" element={<WorkflowManager />} />
        <Route path="/workflow-designer" element={<WorkflowDesigner components={globalState.components} onSaveWorkflow={(nodes, edges) => console.log('保存工作流', nodes, edges)} />} />
        <Route path="/workflow-monitor" element={<WorkflowMonitor />} />
        <Route path="/agent-monitor" element={<AgentMonitor agentId={globalState.selectedAgent?.id || null} />} />
        <Route path="/analytics-insights" element={<AnalyticsInsights />} />
        <Route path="/report-manager" element={<ReportManager />} />
        <Route path="/data-import" element={<DataImportManager onDataImported={() => { globalState.loadCapabilities(); globalState.loadAgents(); globalState.loadWorkflows(); }} />} />
        <Route path="/version-control" element={<VersionControl />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/help" element={<HelpCenter />} />
      </Routes>
    );
  };

  // 加载初始数据
  useEffect(() => {
    // 加载模板、Agent、工作流和能力数据
    globalState.loadTemplates();
    globalState.loadAgents();
    globalState.loadWorkflows();
    globalState.loadCapabilities();
  }, []); // 移除依赖项，因为这些方法现在是稳定的

  return (
    <Router>
      <style>
        {`
          .active-cases-tab {
            background: #fff !important;
            border-color: #1677ff !important;
            color: #1677ff !important;
            position: relative;
          }
          .active-cases-tab::after {
            content: '';
            position: absolute;
            bottom: -1px;
            left: 0;
            right: 0;
            height: 2px;
            background: #fff;
            z-index: 1;
          }
        `}
      </style>
      <Layout style={{ minHeight: '100vh' }}>
        {activeTab === 'agent-management' && (
          <Sider 
            trigger={null} 
            collapsible 
            collapsed={collapsed}
            theme={darkMode ? 'dark' : 'light'}
            width={250}
          >
            <div className="logo">
              {!collapsed && <span>EFIAgent设计器</span>}
            </div>
            <Menu
              theme={darkMode ? 'dark' : 'light'}
              mode="inline"
              defaultSelectedKeys={['dashboard']}
              items={getCurrentMenuItems()}
            />
          </Sider>
        )}
        <Layout>
          <Header style={{ 
            padding: '0 16px', 
            background: token.colorBgContainer,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: '48px',
            lineHeight: '48px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Button
                type="text"
                icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                onClick={() => setCollapsed(!collapsed)}
                style={{
                  fontSize: '16px',
                  width: 64,
                  height: 64,
                  display: activeTab === 'agent-management' ? 'block' : 'none'
                }}
              />
            </div>
            
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Tabs
                  activeKey={activeTab === 'college-admission' ? 'cases' : activeTab}
                  onChange={handleTabChange}
                  size="middle"
                  type="card"
                  style={{ marginBottom: 0, height: '28px' }}
                  items={tabItems}
                />
                {renderCasesTab()}
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <Switch
                checked={darkMode}
                onChange={toggleTheme}
                checkedChildren="🌙"
                unCheckedChildren="☀️"
              />
              <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
                <Avatar 
                  style={{ backgroundColor: '#1890ff', cursor: 'pointer' }}
                  icon={<UserOutlined />}
                />
              </Dropdown>
            </div>
          </Header>
          <Content style={{
            margin: activeTab === 'agent-management' ? '24px 16px' : '0',
            padding: activeTab === 'agent-management' ? 24 : 0,
            minHeight: 280,
            background: activeTab === 'agent-management' ? token.colorBgContainer : 'transparent',
            borderRadius: activeTab === 'agent-management' ? token.borderRadiusLG : 0,
          }}>
            {renderMainContent()}
          </Content>
          <Footer style={{ textAlign: 'center' }}>
            EFIAgent设计器 ©{new Date().getFullYear()} 吾脉新技术
          </Footer>
        </Layout>
      </Layout>
    </Router>
  );
};

// 仪表盘组件（占位）
const Dashboard: React.FC = () => {
  return (
    <div className="dashboard-container">
      <h1>仪表盘</h1>
      <div className="dashboard-grid">
        <div className="dashboard-card">
          <h2>Agent统计</h2>
          <div className="stat-container">
            <div className="stat-item">
              <span className="stat-value">5</span>
              <span className="stat-label">已创建Agent</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">2</span>
              <span className="stat-label">运行中Agent</span>
            </div>
          </div>
          <div style={{ marginTop: '16px' }}>
            <Link to="/agent-manager">
              <Button type="primary" size="small" icon={<RobotOutlined />}>
                管理Agent
              </Button>
            </Link>
          </div>
        </div>
        <div className="dashboard-card">
          <h2>快速操作</h2>
          <div className="quick-actions">
            <Link to="/agent-designer">
              <Button type="default" icon={<AppstoreOutlined />} style={{ marginBottom: '8px', width: '100%' }}>
                创建新Agent
              </Button>
            </Link>
            <Link to="/template-library">
              <Button type="default" icon={<BookOutlined />} style={{ marginBottom: '8px', width: '100%' }}>
                浏览模板
              </Button>
            </Link>
            <Link to="/capability-library">
              <Button type="default" icon={<ApiOutlined />} style={{ width: '100%' }}>
                能力库
              </Button>
            </Link>
          </div>
        </div>
        <div className="dashboard-card">
          <h2>最近活动</h2>
          <ul className="activity-list">
            <li>Agent "智能客服助手" 已创建 - 10分钟前</li>
            <li>Agent "数据分析专家" 已暂停 - 1小时前</li>
            <li>Agent "代码审查助手" 已更新 - 3小时前</li>
            <li>Agent "知识管理系统" 出现错误 - 5小时前</li>
          </ul>
        </div>
        <div className="dashboard-card">
          <h2>系统状态</h2>
          <div className="system-status">
            <div className="status-item">
              <span className="status-indicator status-running"></span>
              <span className="status-text">系统运行正常</span>
            </div>
            <div className="status-item">
              <span className="status-indicator status-warning"></span>
              <span className="status-text">1个Agent需要关注</span>
            </div>
          </div>
          <div style={{ marginTop: '16px' }}>
            <Link to="/agent-monitor">
              <Button type="default" size="small" icon={<MonitorOutlined />}>
                查看监控
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

// 版本控制组件（占位）
const VersionControl: React.FC = () => {
  return (
    <div>
      <h1>版本控制</h1>
      <p>此功能正在开发中...</p>
    </div>
  );
};

// 设置组件（占位）
// Settings组件已从外部导入

// 帮助中心组件（占位）
const HelpCenter: React.FC = () => {
  return (
    <div>
      <h1>帮助中心</h1>
      <p>此功能正在开发中...</p>
    </div>
  );
};

export default MainApp;