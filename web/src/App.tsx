/**
 * App — Workbench-first layout.
 * Workbench is the product. Config pages are backstage.
 */
import React from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { ConfigProvider, theme } from 'antd';

import Workbench from './pages/Workbench';
import ConnectHub from './pages/ConnectHub';
import AgentDesigner from './pages/AgentDesigner';
import MeasureDashboard from './pages/MeasureDashboard';

export default function App() {
  const { pathname } = useLocation();
  const isWorkbench = pathname === '/' || pathname === '/workbench';

  const navLinks = [
    { path: '/', label: '⚡ Workbench' },
    { path: '/connect', label: '🔌 Connect' },
    { path: '/agents', label: '🤖 Agents' },
    { path: '/measure', label: '📊 Measure' },
  ];

  return (
    <ConfigProvider theme={{ algorithm: theme.defaultAlgorithm, token: { borderRadius: 8 } }}>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        {/* Top nav — minimal */}
        <nav style={{
          height: 44, display: 'flex', alignItems: 'center', gap: 4,
          padding: '0 16px', borderBottom: '1px solid #e8e8e8', background: '#fff',
          fontSize: 13,
        }}>
          {navLinks.map(l => (
            <Link key={l.path} to={l.path} style={{
              padding: '6px 12px', borderRadius: 6, textDecoration: 'none',
              color: (pathname === l.path || (l.path === '/' && pathname === '/workbench')) ? '#1890ff' : '#666',
              background: (pathname === l.path || (l.path === '/' && pathname === '/workbench')) ? '#e6f7ff' : 'transparent',
              fontWeight: (pathname === l.path || (l.path === '/' && pathname === '/workbench')) ? 600 : 400,
            }}>{l.label}</Link>
          ))}
        </nav>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'hidden', background: isWorkbench ? '#fff' : '#f5f5f5' }}>
          <Routes>
            <Route path="/" element={<Workbench />} />
            <Route path="/workbench" element={<Workbench />} />
            <Route path="/connect" element={<div style={{ padding: 24 }}><ConnectHub /></div>} />
            <Route path="/agents" element={<div style={{ padding: 24 }}><AgentDesigner /></div>} />
            <Route path="/measure" element={<div style={{ padding: 24 }}><MeasureDashboard /></div>} />
          </Routes>
        </div>
      </div>
    </ConfigProvider>
  );
}
