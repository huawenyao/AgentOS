import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import AgentManagement from './pages/AgentManagement';
import MemorySystem from './pages/MemorySystem';
import TaskMonitor from './pages/TaskMonitor';
import Collaboration from './pages/Collaboration';
import './App.css';

const App: React.FC = () => {
  return (
    <ConfigProvider locale={zhCN}>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/agents" element={<AgentManagement />} />
            <Route path="/memory" element={<MemorySystem />} />
            <Route path="/tasks" element={<TaskMonitor />} />
            <Route path="/collaboration" element={<Collaboration />} />
          </Routes>
        </Layout>
      </Router>
    </ConfigProvider>
  );
};

export default App;