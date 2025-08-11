import React, { useState, useEffect } from 'react';
import { Card, List, Button, Input, Tag, Tooltip, Empty, Spin, message } from 'antd';
import { SearchOutlined, StarOutlined, StarFilled, DownloadOutlined } from '@ant-design/icons';
import { AgentTemplate } from './types';
import apiService from './ApiService';
import './AgentDesigner.css';

const { Meta } = Card;

// 模板库属性接口
interface TemplateLibraryProps {
  onSelectTemplate: (template: AgentTemplate) => void;
}

/**
 * 模板库组件
 * 用于浏览和选择Agent模板
 */
const TemplateLibrary: React.FC<TemplateLibraryProps> = ({
  onSelectTemplate
}) => {
  // 模板列表状态
  const [templates, setTemplates] = useState<AgentTemplate[]>([]);
  // 搜索关键词状态
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  // 收藏模板ID列表
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  // 加载状态
  const [loading, setLoading] = useState<boolean>(true);
  
  // 加载模板数据
  useEffect(() => {
    fetchTemplates();
    // 从本地存储加载收藏列表
    const savedFavorites = localStorage.getItem('favoriteTemplates');
    if (savedFavorites) {
      setFavoriteIds(JSON.parse(savedFavorites));
    }
  }, []);
  
  // 获取模板列表
  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const data = await apiService.getTemplates();
      setTemplates(data);
    } catch (error) {
      console.error('获取模板失败:', error);
      message.error('获取模板列表失败');
    } finally {
      setLoading(false);
    }
  };
  
  // 处理搜索
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchKeyword(e.target.value);
  };
  
  // 过滤模板
  const filteredTemplates = templates.filter(template => {
    if (!searchKeyword) return true;
    
    const keyword = searchKeyword.toLowerCase();
    return (
      template.name.toLowerCase().includes(keyword) ||
      template.description.toLowerCase().includes(keyword) ||
      template.tags?.some(tag => tag.toLowerCase().includes(keyword))
    );
  });
  
  // 切换收藏状态
  const toggleFavorite = (templateId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    let newFavorites: string[];
    if (favoriteIds.includes(templateId)) {
      newFavorites = favoriteIds.filter(id => id !== templateId);
    } else {
      newFavorites = [...favoriteIds, templateId];
    }
    
    setFavoriteIds(newFavorites);
    localStorage.setItem('favoriteTemplates', JSON.stringify(newFavorites));
  };
  
  // 处理模板选择
  const handleTemplateSelect = (template: AgentTemplate) => {
    onSelectTemplate(template);
    message.success(`已选择模板: ${template.name}`);
  };
  
  // 获取Agent类型图标
  const getAgentTypeIcon = (type: string): string => {
    switch (type) {
      case 'PLANNING':
        return '🧠';
      case 'EXECUTION':
        return '⚡';
      case 'AUDIT':
        return '🔍';
      case 'MEMORY':
        return '🧠';
      default:
        return '';
    }
  };

  // 渲染模板卡片
  const renderTemplateCard = (template: AgentTemplate) => {
    const isFavorite = favoriteIds.includes(template.id);
    
    return (
      <Card
        className="template-card"
        hoverable
        cover={
          <div className="template-icon">
            {getAgentTypeIcon(template.type) || (
              <div className="template-icon-placeholder">{template.name.charAt(0)}</div>
            )}
          </div>
        }
        actions={[
          <Tooltip title={isFavorite ? '取消收藏' : '收藏'}>
            <Button 
              type="text" 
              icon={isFavorite ? <StarFilled /> : <StarOutlined />} 
              onClick={(e) => toggleFavorite(template.id, e)}
            />
          </Tooltip>,
          <Tooltip title="使用此模板">
            <Button 
              type="text" 
              icon={<DownloadOutlined />} 
              onClick={() => handleTemplateSelect(template)}
            />
          </Tooltip>
        ]}
        onClick={() => handleTemplateSelect(template)}
      >
        <Meta
          title={template.name}
          description={
            <div>
              <p className="template-description">{template.description}</p>
              <div className="template-tags">
                {template.tags?.map(tag => (
                  <Tag key={tag}>{tag}</Tag>
                ))}
              </div>
              <div className="template-meta">
                <span>作者: {template.author}</span>
                <span>版本: {template.version}</span>
              </div>
            </div>
          }
        />
      </Card>
    );
  };
  
  return (
    <div className="template-library">
      <div className="template-search">
        <Input
          placeholder="搜索模板..."
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
      ) : filteredTemplates.length > 0 ? (
        <List
          grid={{ gutter: 16, xs: 1, sm: 2, md: 2, lg: 3, xl: 3, xxl: 4 }}
          dataSource={filteredTemplates}
          renderItem={renderTemplateCard}
        />
      ) : (
        <Empty 
          description="未找到匹配的模板"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      )}
    </div>
  );
};

export default TemplateLibrary;
