import React, { useState, useEffect, useCallback } from 'react';
import { Card, List, Button, Input, Tag, Tooltip, Empty, Spin, message, Rate, Avatar } from 'antd';
import { SearchOutlined, DownloadOutlined, ShoppingCartOutlined, AppstoreOutlined } from '@ant-design/icons';
import { Capability } from './types';
import ApiService from './ApiService';
import './CapabilityMarket.css';

const { Meta } = Card;

// 能力市场属性接口
interface CapabilityMarketProps {
  onSelectCapability: (capability: Capability) => void;
}

/**
 * 能力市场组件
 * 用于浏览和选择Agent能力
 */
const CapabilityMarket: React.FC<CapabilityMarketProps> = ({
  onSelectCapability
}) => {
  // 能力列表状态
  const [capabilities, setCapabilities] = useState<Capability[]>([]);
  // 搜索关键词状态
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  // 已安装能力ID列表
  const [installedIds, setInstalledIds] = useState<string[]>([]);
  // 加载状态
  const [loading, setLoading] = useState<boolean>(true);
  
  // 获取能力列表
  const fetchCapabilities = useCallback(async () => {
    setLoading(true);
    try {
      const response = await ApiService.getCapabilities();
      if (response.success && response.data) {
        setCapabilities(response.data);
      } else {
        console.error('Failed to get capabilities:', response.error);
      }
    } catch (error) {
      console.error('获取能力失败:', error);
      message.error('获取能力列表失败');
    } finally {
      setLoading(false);
    }
  }, []);
  
  // 加载能力数据
  useEffect(() => {
    fetchCapabilities();
    // 从本地存储加载已安装列表
    const savedInstalled = localStorage.getItem('installedCapabilities');
    if (savedInstalled) {
      setInstalledIds(JSON.parse(savedInstalled));
    }
  }, [fetchCapabilities]);
  

  
  // 处理搜索
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchKeyword(e.target.value);
  };
  
  // 过滤能力
  const filteredCapabilities = capabilities.filter(capability => {
    if (!searchKeyword) return true;
    
    const keyword = searchKeyword.toLowerCase();
    return (
      capability.name.toLowerCase().includes(keyword) ||
      capability.description.toLowerCase().includes(keyword) ||
      capability.category.toLowerCase().includes(keyword)
    );
  });
  
  // 安装能力
  const installCapability = (capability: Capability, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!installedIds.includes(capability.id)) {
      const newInstalled = [...installedIds, capability.id];
      setInstalledIds(newInstalled);
      localStorage.setItem('installedCapabilities', JSON.stringify(newInstalled));
      message.success(`已安装能力: ${capability.name}`);
    }
    
    onSelectCapability(capability);
  };
  
  // 处理能力选择
  const handleCapabilitySelect = (capability: Capability) => {
    onSelectCapability(capability);
    message.success(`已选择能力: ${capability.name}`);
  };
  
  // 获取能力分类颜色
  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'observation':
        return 'blue';
      case 'decision':
        return 'purple';
      case 'action':
        return 'green';
      case 'communication':
        return 'orange';
      default:
        return 'default';
    }
  };
  
  // 渲染能力卡片
  const renderCapabilityCard = (capability: Capability) => {
    const isInstalled = installedIds.includes(capability.id);
    
    return (
      <Card
        className="capability-card"
        hoverable
        cover={
          <div className="capability-icon">
            {capability.icon ? (
              <img alt={capability.name} src={capability.icon} />
            ) : (
              <Avatar 
                size={64} 
                icon={<AppstoreOutlined />} 
                className={`capability-icon-${capability.category.toLowerCase()}`}
              />
            )}
          </div>
        }
        actions={[
          <Tooltip title={isInstalled ? '已安装' : '安装'}>
            <Button 
              type="text" 
              icon={<DownloadOutlined />} 
              onClick={(e) => installCapability(capability, e)}
              disabled={isInstalled}
            />
          </Tooltip>,
          <Tooltip title="使用此能力">
            <Button 
              type="text" 
              icon={<ShoppingCartOutlined />} 
              onClick={() => handleCapabilitySelect(capability)}
            />
          </Tooltip>
        ]}
        onClick={() => handleCapabilitySelect(capability)}
      >
        <Meta
          title={
            <div className="capability-title">
              <span>{capability.name}</span>
              <Tag color={getCategoryColor(capability.category)}>{capability.category}</Tag>
            </div>
          }
          description={
            <div>
              <p className="capability-description">{capability.description}</p>
              <div className="capability-rating">
                <Rate disabled defaultValue={4.5} allowHalf />
                <span className="rating-count">(24)</span>
              </div>
            </div>
          }
        />
      </Card>
    );
  };
  
  return (
    <div className="capability-market">
      <div className="capability-search">
        <Input
          placeholder="搜索能力..."
          prefix={<SearchOutlined />}
          value={searchKeyword}
          onChange={handleSearch}
          allowClear
        />
      </div>
      
      {loading ? (
        <div className="loading-container">
          <Spin tip="加载中..." />
        </div>
      ) : filteredCapabilities.length > 0 ? (
        <List
          grid={{ gutter: 16, xs: 1, sm: 2, md: 2, lg: 3, xl: 3, xxl: 4 }}
          dataSource={filteredCapabilities}
          renderItem={renderCapabilityCard}
        />
      ) : (
        <Empty 
          description="未找到匹配的能力"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      )}
    </div>
  );
};

export default CapabilityMarket;
