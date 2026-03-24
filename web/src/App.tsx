/**
 * App layout — Workbench is the primary interface.
 *
 * The main screen is a conversation workspace with dynamic visualization.
 * Configuration pages (Connect, Agents, Measure) are secondary via top nav.
 */
import React from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { Layout, Menu, ConfigProvider, theme } from 'antd';
import {
  ThunderboltOutlined, ApiOutlined, RobotOutlined,
  DashboardOutlined, SettingOutlined,
} from '@ant-design/icons';

import Workbench from './pages/Workbench';
import ConnectHub from './pages/ConnectHub';
import AgentDesigner from './pages/AgentDesigner';
import RunMonitor from './pages/RunMonitor';
import MeasureDashboard from './pages/MeasureDashboard';

const { Content, Header } = Layout;

export default function App() {
  const location = useLocation();
  const path = location.pathname;

  const navItems = [
    { key: '/', icon: <ThunderboltOutlined />, label: <Link to="/">Workbench</Link> },
    { key: '/connect', icon: <ApiOutlined />, label: <Link to="/connect">Connect</Link> },
    { key: '/agents', icon: <RobotOutlined />, label: <Link to="/agents">Agents</Link> },
    { key: '/runs', icon: <SettingOutlined />, label: <Link to="/runs">Runs</Link> },
    { key: '/measure', icon: <DashboardOutlined />, label: <Link to="/measure">Measure</Link> },
  ];

  const isWorkbench = path === '/' || path === '/workbench';

  return (
    <ConfigProvider theme={{ algorithm: theme.defaultAlgorithm, token: { borderRadius: 8 } }}>
      <Layout style={{ minHeight: '100vh' }}>
        <Header style={{ background: '#fff', borderBottom: '1px solid #f0f0f0', padding: '0 24px', display: 'flex', alignItems: 'center', height: 48 }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginRight: 32, color: '#1890ff' }}>
            <ThunderboltOutlined /> AWS
          </div>
          <Menu
            mode="horizontal"
            selectedKeys={[path === '/workbench' ? '/' : path]}
            items={navItems}
            style={{ flex: 1, border: 'none', lineHeight: '46px' }}
          />
        </Header>
        <Content style={{ background: isWorkbench ? '#fff' : '#f5f5f5', padding: isWorkbench ? 0 : 24 }}>
          <Routes>
            <Route path="/" element={<Workbench />} />
            <Route path="/workbench" element={<Workbench />} />
            <Route path="/connect" element={<ConnectHub />} />
            <Route path="/agents" element={<AgentDesigner />} />
            <Route path="/runs" element={<RunMonitor />} />
            <Route path="/measure" element={<MeasureDashboard />} />
          </Routes>
        </Content>
      </Layout>
    </ConfigProvider>
  );
}
