import React, { useState, useEffect, useCallback } from 'react';
import { Row, Col, Card, Button, Input, Select, Tag, Tooltip, Spin, Empty, Typography, Divider, Badge } from 'antd';
import { SearchOutlined, FilterOutlined, StarOutlined, StarFilled, PlusOutlined } from '@ant-design/icons';
import apiService from './ApiService';
import useGlobalState from './StateManager';
import './TemplateGallery.css';
import { AgentTemplate, CapabilityType } from './types';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

const TemplateGallery: React.FC = () => {
  const [templates, setTemplates] = useState<AgentTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<AgentTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [typeFilter, setTypeFilter] = useState<string[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
  const [difficultyFilter, setDifficultyFilter] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // 根据类型确定分类
  const getCategoryFromType = useCallback((type: string): string => {
    switch (type) {
      case 'planner':
      case 'executor':
        return '任务处理';
      case 'assistant':
        return '用户交互';
      case 'analyst':
        return '数据分析';
      case 'creative':
        return '创意生成';
      default:
        return '其他';
    }
  }, []);

  // 根据组件数量和类型确定难度
  const getDifficultyFromComponents = useCallback((components: any[]): 'beginner' | 'intermediate' | 'advanced' => {
    if (components.length <= 3) {
      return 'beginner';
    } else if (components.length <= 6) {
      return 'intermediate';
    } else {
      return 'advanced';
    }
  }, []);

  // 从模板生成标签
  const getTagsFromTemplate = useCallback((template: AgentTemplate): string[] => {
    const tags: string[] = [template.type];
    
    // 根据能力ID添加标签
    const capabilityIds = template.capabilities.map(c => c.capabilityId);
    if (capabilityIds.includes('llm_reasoning')) tags.push('自然语言处理');
    if (capabilityIds.includes('knowledge_graph')) tags.push('知识图谱');
    if (capabilityIds.includes('api_call')) tags.push('API调用');
    if (capabilityIds.includes('message_queue')) tags.push('消息处理');
    if (capabilityIds.includes('image_recognition')) tags.push('图像识别');
    
    return tags;
  }, []);

  // 加载模板数据
  const loadTemplates = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiService.getTemplates();
      
      if (response.success) {
        // 为模板添加额外的展示属性
        const enhancedTemplates = response.data.map((template: AgentTemplate) => ({
          ...template,
          featured: ['planner', 'assistant'].includes(template.type),
          category: getCategoryFromType(template.type),
          difficulty: getDifficultyFromComponents(template.capabilities),
          tags: getTagsFromTemplate(template)
        }));
        
        setTemplates(enhancedTemplates);
        setFilteredTemplates(enhancedTemplates);
      } else {
        setError(response.error || '加载模板失败');
      }
    } catch (err) {
      setError('加载模板时发生错误');
      console.error('Error loading templates:', err);
    } finally {
      setLoading(false);
    }
  }, [getCategoryFromType, getDifficultyFromComponents, getTagsFromTemplate]);

  // 初始加载
  useEffect(() => {
    loadTemplates();
    
    // 从本地存储加载收藏夹
    const savedFavorites = localStorage.getItem('templateFavorites');
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }
  }, [loadTemplates]);

  // 过滤模板
  useEffect(() => {
    let result = [...templates];
    
    // 搜索文本过滤
    if (searchText) {
      const lowerSearchText = searchText.toLowerCase();
      result = result.filter(template => 
        (template.name || '').toLowerCase().includes(lowerSearchText) ||
        template.description.toLowerCase().includes(lowerSearchText) ||
        template.type.toLowerCase().includes(lowerSearchText) ||
        (template.tags && template.tags.some(tag => tag.toLowerCase().includes(lowerSearchText)))
      );
    }
    
    // 类型过滤
    if (typeFilter.length > 0) {
      result = result.filter(template => typeFilter.includes(template.type));
    }
    
    // 分类过滤
    if (categoryFilter.length > 0) {
      result = result.filter(template => categoryFilter.includes(template.category || ''));
    }
    
    // 难度过滤
    if (difficultyFilter.length > 0) {
      result = result.filter(template => difficultyFilter.includes(template.difficulty || ''));
    }
    
    setFilteredTemplates(result);
  }, [templates, searchText, typeFilter, categoryFilter, difficultyFilter]);

  // 切换收藏状态
  const toggleFavorite = (templateId: string) => {
    let newFavorites: string[];
    
    if (favorites.includes(templateId)) {
      newFavorites = favorites.filter(id => id !== templateId);
    } else {
      newFavorites = [...favorites, templateId];
    }
    
    setFavorites(newFavorites);
    localStorage.setItem('templateFavorites', JSON.stringify(newFavorites));
  };

  // 使用模板
  const globalState = useGlobalState();
  const { selectTemplate, setActiveTab } = globalState;

  const handleUseTemplate = (template: AgentTemplate) => {
    selectTemplate(template);
    setActiveTab('designer');
  };

  // 获取难度标签颜色
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'green';
      case 'intermediate': return 'blue';
      case 'advanced': return 'purple';
      default: return 'default';
    }
  };

  // 获取难度标签文本
  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return '初级';
      case 'intermediate': return '中级';
      case 'advanced': return '高级';
      default: return '未知';
    }
  };

  // 渲染模板卡片
  const renderTemplateCard = (template: AgentTemplate) => {
    const isFavorite = favorites.includes(template.id);
    
    return (
      <Card
        key={template.id}
        className={`template-card ${template.featured ? 'featured-template' : ''}`}
        hoverable
        data-testid="template-card"
        actions={[
          <Tooltip title={isFavorite ? '取消收藏' : '收藏'}>
            <Button 
              type="text" 
              icon={isFavorite ? <StarFilled style={{ color: '#faad14' }} /> : <StarOutlined />} 
              onClick={(e) => {
                e.stopPropagation();
                toggleFavorite(template.id);
              }}
            />
          </Tooltip>,
          <Button 
            type="primary" 
            onClick={() => handleUseTemplate(template)}
            data-testid="use-template-button"
          >
            使用
          </Button>
        ]}
      >
        <div className="template-card-header">
          {template.featured && (
            <Badge.Ribbon text="推荐" color="gold" />
          )}
          <Title level={4} data-testid="template-name">{template.name || '未命名模板'}</Title>
          <Tag color="blue" data-testid="template-type">{template.type}</Tag>
          <Tag color={getDifficultyColor(template.difficulty || '')}>
            {getDifficultyText(template.difficulty || '')}
          </Tag>
        </div>
        
        <Paragraph 
          ellipsis={{ rows: 3, expandable: true, symbol: '更多' }}
          data-testid="template-description"
        >
          {template.description}
        </Paragraph>
        
        <div className="template-tags">
          {template.tags && template.tags.map(tag => (
            <Tag key={tag}>{tag}</Tag>
          ))}
        </div>
        
        <div className="template-components">
          <Text type="secondary">能力数量: {template.capabilities.length}</Text>
        </div>
      </Card>
    );
  };

  // 渲染模板列表项
  const renderTemplateListItem = (template: AgentTemplate) => {
    const isFavorite = favorites.includes(template.id);
    
    return (
      <Card
        key={template.id}
        className={`template-list-item ${template.featured ? 'featured-template' : ''}`}
        hoverable
        data-testid="template-card"
      >
        <div className="template-list-item-content">
          <div className="template-list-item-info">
            <div className="template-list-item-header">
              {template.featured && (
                <Badge dot color="gold" />
              )}
              <Title level={5} data-testid="template-name">{template.name || '未命名模板'}</Title>
              <Tag color="blue" data-testid="template-type">{template.type}</Tag>
              <Tag color={getDifficultyColor(template.difficulty || '')}>
                {getDifficultyText(template.difficulty || '')}
              </Tag>
            </div>
            
            <Paragraph 
              ellipsis={{ rows: 2, expandable: true, symbol: '更多' }}
              data-testid="template-description"
            >
              {template.description}
            </Paragraph>
            
            <div className="template-tags">
              {template.tags && template.tags.map(tag => (
                <Tag key={tag}>{tag}</Tag>
              ))}
            </div>
          </div>
          
          <div className="template-list-item-actions">
            <Tooltip title={isFavorite ? '取消收藏' : '收藏'}>
              <Button 
                type="text" 
                icon={isFavorite ? <StarFilled style={{ color: '#faad14' }} /> : <StarOutlined />} 
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFavorite(template.id);
                }}
              />
            </Tooltip>
            <Button 
              type="primary" 
              onClick={() => handleUseTemplate(template)}
              data-testid="use-template-button"
            >
              使用
            </Button>
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="template-gallery" data-testid="templates-panel">
      <div className="template-gallery-header">
        <Title level={3}>Agent模板库</Title>
        <div className="template-gallery-actions">
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => {
              // 创建新模板的逻辑
              selectTemplate(null);
              setActiveTab('designer');
            }}
          >
            创建新模板
          </Button>
        </div>
      </div>
      
      <div className="template-gallery-filters">
        <Input
          placeholder="搜索模板"
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          allowClear
        />
        
        <div className="filter-group">
          <FilterOutlined />
          <Select
            mode="multiple"
            placeholder="类型"
            value={typeFilter}
            onChange={setTypeFilter}
            style={{ width: 150 }}
            allowClear
          >
            <Option value="planner">规划</Option>
            <Option value="executor">执行</Option>
            <Option value="assistant">助手</Option>
            <Option value="analyst">分析</Option>
            <Option value="creative">创意</Option>
          </Select>
          
          <Select
            mode="multiple"
            placeholder="分类"
            value={categoryFilter}
            onChange={setCategoryFilter}
            style={{ width: 150 }}
            allowClear
          >
            <Option value="任务处理">任务处理</Option>
            <Option value="用户交互">用户交互</Option>
            <Option value="数据分析">数据分析</Option>
            <Option value="创意生成">创意生成</Option>
            <Option value="其他">其他</Option>
          </Select>
          
          <Select
            mode="multiple"
            placeholder="难度"
            value={difficultyFilter}
            onChange={setDifficultyFilter}
            style={{ width: 150 }}
            allowClear
          >
            <Option value="beginner">初级</Option>
            <Option value="intermediate">中级</Option>
            <Option value="advanced">高级</Option>
          </Select>
        </div>
        
        <div className="view-mode-toggle">
          <Button.Group>
            <Button 
              type={viewMode === 'grid' ? 'primary' : 'default'}
              onClick={() => setViewMode('grid')}
            >
              网格
            </Button>
            <Button 
              type={viewMode === 'list' ? 'primary' : 'default'}
              onClick={() => setViewMode('list')}
            >
              列表
            </Button>
          </Button.Group>
        </div>
      </div>
      
      {loading ? (
        <div className="template-gallery-loading">
          <Spin size="large" tip="加载模板中..." />
        </div>
      ) : error ? (
        <div className="template-gallery-error">
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <span>
                加载模板失败: {error}
                <Button type="link" onClick={loadTemplates}>重试</Button>
              </span>
            }
          />
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="template-gallery-empty">
          <Empty description="没有找到匹配的模板" />
        </div>
      ) : (
        <div className="template-gallery-content">
          {/* 收藏的模板 */}
          {favorites.length > 0 && (
            <div className="template-section">
              <Title level={4}>收藏的模板</Title>
              <Divider />
              {viewMode === 'grid' ? (
                <Row gutter={[16, 16]}>
                  {filteredTemplates
                    .filter(template => favorites.includes(template.id))
                    .map(template => (
                      <Col xs={24} sm={12} md={8} lg={6} key={template.id}>
                        {renderTemplateCard(template)}
                      </Col>
                    ))}
                </Row>
              ) : (
                <div className="template-list">
                  {filteredTemplates
                    .filter(template => favorites.includes(template.id))
                    .map(template => renderTemplateListItem(template))}
                </div>
              )}
            </div>
          )}
          
          {/* 推荐的模板 */}
          <div className="template-section">
            <Title level={4}>推荐模板</Title>
            <Divider />
            {viewMode === 'grid' ? (
              <Row gutter={[16, 16]}>
                {filteredTemplates
                  .filter(template => template.featured)
                  .map(template => (
                    <Col xs={24} sm={12} md={8} lg={6} key={template.id}>
                      {renderTemplateCard(template)}
                    </Col>
                  ))}
              </Row>
            ) : (
              <div className="template-list">
                {filteredTemplates
                  .filter(template => template.featured)
                  .map(template => renderTemplateListItem(template))}
              </div>
            )}
          </div>
          
          {/* 所有模板 */}
          <div className="template-section">
            <Title level={4}>所有模板</Title>
            <Divider />
            {viewMode === 'grid' ? (
              <Row gutter={[16, 16]}>
                {filteredTemplates
                  .filter(template => !template.featured || !favorites.includes(template.id))
                  .map(template => (
                    <Col xs={24} sm={12} md={8} lg={6} key={template.id}>
                      {renderTemplateCard(template)}
                    </Col>
                  ))}
              </Row>
            ) : (
              <div className="template-list">
                {filteredTemplates
                  .filter(template => !template.featured || !favorites.includes(template.id))
                  .map(template => renderTemplateListItem(template))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplateGallery;
