import React, { useEffect } from 'react';

/**
 * PromoPage组件 - 吾脉AI宣传页面
 * 集成promo.html的内容到React组件中
 */
interface PromoPageProps {
  onTabChange?: (tab: string) => void;
}

const PromoPage: React.FC<PromoPageProps> = ({ onTabChange }) => {
  useEffect(() => {
    /**
     * 监听来自iframe的消息
     * @param event - 消息事件
     */
    const handleMessage = (event: MessageEvent) => {
      // 验证消息来源和格式
      if (event.data && event.data.type === 'SWITCH_TAB' && event.data.tab) {
        if (onTabChange) {
          onTabChange(event.data.tab);
        }
      }
    };

    // 添加消息监听器
    window.addEventListener('message', handleMessage);

    // 清理函数
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [onTabChange]);

  return (
    <div style={{ width: '100%', height: '100vh', overflow: 'hidden' }}>
      <iframe
        src="/promo.html"
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          margin: 0,
          padding: 0
        }}
        title="吾脉AI宣传页面"
      />
    </div>
  );
};

export default PromoPage;