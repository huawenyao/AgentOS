import React from 'react';
import ReactDOM from 'react-dom/client';
import { ConfigProvider, theme } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import EFIAgent2_0 from './components/EFIAgent2_0';

// 导入全局样式
import './index.css';

// 抑制ResizeObserver错误 - 这是一个已知的无害错误，通常由第三方库（如ReactFlow）引起
// 参考: https://stackoverflow.com/questions/76187282/how-to-fix-resizeobserver-loop-completed-with-undelivered-notifications
const suppressResizeObserverError = () => {
  const originalError = console.error;
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('ResizeObserver loop completed with undelivered notifications')
    ) {
      // 忽略ResizeObserver错误
      return;
    }
    originalError.apply(console, args);
  };

  // 同时处理window.onerror事件
  const originalWindowError = window.onerror;
  window.onerror = (message, source, lineno, colno, error) => {
    if (
      typeof message === 'string' &&
      message.includes('ResizeObserver loop completed with undelivered notifications')
    ) {
      // 忽略ResizeObserver错误
      return true;
    }
    if (originalWindowError) {
      return originalWindowError(message, source, lineno, colno, error);
    }
    return false;
  };
};

// 初始化错误抑制
suppressResizeObserverError();

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: '#1890ff',
          borderRadius: 8,
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        },
        algorithm: theme.defaultAlgorithm,
      }}
    >
      <EFIAgent2_0 />
    </ConfigProvider>
  </React.StrictMode>
);
