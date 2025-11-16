import React, { useState } from 'react';
import { Layout as AntLayout, Menu, Typography, Avatar, Space, Badge } from 'antd';
import {
  DashboardOutlined,
  RobotOutlined,
  DatabaseOutlined,
  ScheduleOutlined,
  TeamOutlined,
  BellOutlined,
  UserOutlined,
  SettingOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';

const { Header, Sider, Content } = AntLayout;
const { Title } = Typography;

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: '仪表盘',
    },
    {
      key: '/agents',
      icon: <RobotOutlined />,
      label: '智能体管理',
    },
    {
      key: '/memory',
      icon: <DatabaseOutlined />,
      label: '记忆系统',
    },
    {
      key: '/tasks',
      icon: <ScheduleOutlined />,
      label: '任务监控',
    },
    {
      key: '/collaboration',
      icon: <TeamOutlined />,
      label: '协作工作流',
    },
  ];

  const handleMenuClick = (e: any) => {
    navigate(e.key);
  };

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        theme="dark"
        style={{
          background: '#001529',
        }}
      >
        <div style={{
          padding: '16px',
          textAlign: 'center',
          borderBottom: '1px solid #434343'
        }}>
          <Title
            level={4}
            style={{
              color: 'white',
              margin: 0,
              fontSize: collapsed ? '14px' : '16px'
            }}
          >
            {collapsed ? 'EFIA' : 'EFIAgent'}
          </Title>
        </div>

        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
        />
      </Sider>

      <AntLayout>
        <Header style={{
          padding: '0 16px',
          background: '#fff',
          borderBottom: '1px solid #f0f0f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Title level={4} style={{ margin: 0, color: '#1890ff' }}>
              EFIAgent - 企业级多智能体协作系统
            </Title>
          </div>

          <Space size="large">
            <Badge count={3} size="small">
              <BellOutlined style={{ fontSize: '18px', color: '#666' }} />
            </Badge>

            <Space>
              <Avatar size="small" icon={<UserOutlined />} />
              <span>管理员</span>
            </Space>

            <SettingOutlined style={{ fontSize: '18px', color: '#666', cursor: 'pointer' }} />
          </Space>
        </Header>

        <Content style={{
          margin: '16px',
          padding: '16px',
          background: '#fff',
          borderRadius: '6px',
          minHeight: 'calc(100vh - 112px)',
          overflow: 'auto'
        }}>
          {children}
        </Content>
      </AntLayout>
    </AntLayout>
  );
};

export default Layout;