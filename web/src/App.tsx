import React from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { Layout, Menu, ConfigProvider, theme } from 'antd';
import {
  ApiOutlined, RobotOutlined, ApartmentOutlined,
  PlayCircleOutlined, DashboardOutlined, CheckCircleOutlined
} from '@ant-design/icons';

import ConnectHub from './pages/ConnectHub';
import AgentDesigner from './pages/AgentDesigner';
import WorkflowCanvas from './pages/WorkflowCanvas';
import RunMonitor from './pages/RunMonitor';
import Approvals from './pages/Approvals';
import MeasureDashboard from './pages/MeasureDashboard';

const { Sider, Content, Header } = Layout;

const menuItems = [
  { key: '/connect', icon: <ApiOutlined />, label: <Link to="/connect">Connect</Link> },
  { key: '/agents', icon: <RobotOutlined />, label: <Link to="/agents">Agents</Link> },
  { key: '/workflows', icon: <ApartmentOutlined />, label: <Link to="/workflows">Workflows</Link> },
  { key: '/runs', icon: <PlayCircleOutlined />, label: <Link to="/runs">Run</Link> },
  { key: '/approvals', icon: <CheckCircleOutlined />, label: <Link to="/approvals">Approvals</Link> },
  { key: '/measure', icon: <DashboardOutlined />, label: <Link to="/measure">Measure</Link> },
];

export default function App() {
  const location = useLocation();
  const selected = '/' + (location.pathname.split('/')[1] || 'connect');

  return (
    <ConfigProvider theme={{ algorithm: theme.defaultAlgorithm }}>
      <Layout style={{ minHeight: '100vh' }}>
        <Sider width={200} theme="light" style={{ borderRight: '1px solid #f0f0f0' }}>
          <div style={{ padding: '16px 24px', fontWeight: 700, fontSize: 16 }}>
            Agentic Work Studio
          </div>
          <Menu mode="inline" selectedKeys={[selected]} items={menuItems} />
        </Sider>
        <Layout>
          <Content style={{ padding: 24, background: '#f5f5f5' }}>
            <Routes>
              <Route path="/" element={<ConnectHub />} />
              <Route path="/connect" element={<ConnectHub />} />
              <Route path="/agents" element={<AgentDesigner />} />
              <Route path="/workflows" element={<WorkflowCanvas />} />
              <Route path="/runs" element={<RunMonitor />} />
              <Route path="/approvals" element={<Approvals />} />
              <Route path="/measure" element={<MeasureDashboard />} />
            </Routes>
          </Content>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
}
