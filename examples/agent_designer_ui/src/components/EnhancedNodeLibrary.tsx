/**
 * EFIAgent 2.0 增强节点库组件
 * 提供完整的节点模板管理和拖拽功能
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Card, Input, Select, Tabs, List, Tag, Button, Space, Tooltip,
  Collapse, Badge, Empty, Spin, Drawer, Modal, Form, Rate,
  Typography, Divider, Avatar, Popover, Switch, Slider
} from 'antd';
import {
  SearchOutlined, FilterOutlined, StarOutlined, StarFilled,
  EyeOutlined, DownloadOutlined, ShareAltOutlined, SettingOutlined,
  PlusOutlined, DeleteOutlined, EditOutlined, CopyOutlined,
  DatabaseOutlined, ApiOutlined, BranchesOutlined, SwapOutlined,
  CheckCircleOutlined, BellOutlined, FileOutlined, RobotOutlined,
  FunctionOutlined, ThunderboltOutlined, CloudOutlined,
  BugOutlined, InfoCircleOutlined, QuestionCircleOutlined
} from '@ant-design/icons';
import {
  NODE_TEMPLATES,
  NodeTemplate,
  NodeCategory,
  getAllCategories,
  getTemplatesByCategory,
  searchTemplatesByTag,
  getTemplatesByComplexity,
  createNodeFromTemplate
} from './WorkflowNodeTemplates';
import { WorkflowNode } from './CapabilitySystemTypes';
import './EnhancedNodeLibrary.css';

const { Title, Text, Paragraph } = Typography;
const { Search } = Input;
const { Option } = Select;
const { TabPane } = Tabs;
const { Panel } = Collapse;

/**
 * 节点库属性接口
 */
interface EnhancedNodeLibraryProps {
  visible?: boolean;
  onNodeSelect?: (template: NodeTemplate) => void;
  onNodeDrag?: (template: NodeTemplate, event: React.DragEvent) => void;
  onNodeCreate?: (node: WorkflowNode) => void;
  favoriteTemplates?: string[];
  onToggleFavorite?: (templateId: string) => void;
  recentTemplates?: string[];
  customTemplates?: NodeTemplate[];
  onCreateCustomTemplate?: () => void;
  onEditTemplate?: (template: NodeTemplate) => void;
  onDeleteTemplate?: (templateId: string) => void;
}

/**
 * 过滤选项接口
 */
interface FilterOptions {
  category: NodeCategory | 'all';
  complexity: 'all' | 'simple' | 'medium' | 'complex';
  tags: string[];
  favorites: boolean;
  recent: boolean;
}

/**
 * 排序选项
 */
type SortOption = 'name' | 'category' | 'complexity' | 'recent' | 'popular';

/**
 * 增强节点库组件
 */
const EnhancedNodeLibrary: React.FC<EnhancedNodeLibraryProps> = ({
  visible = true,
  onNodeSelect,
  onNodeDrag,
  onNodeCreate,
  favoriteTemplates = [],
  onToggleFavorite,
  recentTemplates = [],
  customTemplates = [],
  onCreateCustomTemplate,
  onEditTemplate,
  onDeleteTemplate
}) => {
  // 状态管理
  const [searchText, setSearchText] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('all');
  const [filters, setFilters] = useState<FilterOptions>({
    category: 'all',
    complexity: 'all',
    tags: [],
    favorites: false,
    recent: false
  });
  const [sortBy, setSortBy] = useState<SortOption>('category');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedTemplate, setSelectedTemplate] = useState<NodeTemplate | null>(null);
  const [previewVisible, setPreviewVisible] = useState<boolean>(false);
  const [filterDrawerVisible, setFilterDrawerVisible] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  // 获取所有模板（包括自定义模板）
  const allTemplates = useMemo(() => {
    return [...NODE_TEMPLATES, ...customTemplates];
  }, [customTemplates]);

  // 获取所有可用标签
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    allTemplates.forEach(template => {
      template.tags.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [allTemplates]);

  // 过滤和搜索模板
  const filteredTemplates = useMemo(() => {
    let result = [...allTemplates];

    // 文本搜索
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      result = result.filter(template =>
        template.name.toLowerCase().includes(searchLower) ||
        template.description.toLowerCase().includes(searchLower) ||
        template.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    // 分类过滤
    if (filters.category !== 'all') {
      result = result.filter(template => template.category === filters.category);
    }

    // 复杂度过滤
    if (filters.complexity !== 'all') {
      result = result.filter(template => template.complexity === filters.complexity);
    }

    // 标签过滤
    if (filters.tags.length > 0) {
      result = result.filter(template =>
        filters.tags.some(tag => template.tags.includes(tag))
      );
    }

    // 收藏过滤
    if (filters.favorites) {
      result = result.filter(template => favoriteTemplates.includes(template.id));
    }

    // 最近使用过滤
    if (filters.recent) {
      result = result.filter(template => recentTemplates.includes(template.id));
    }

    // 排序
    result.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'category':
          return a.category.localeCompare(b.category);
        case 'complexity':
          const complexityOrder = { simple: 1, medium: 2, complex: 3 };
          return complexityOrder[a.complexity] - complexityOrder[b.complexity];
        case 'recent':
          const aIndex = recentTemplates.indexOf(a.id);
          const bIndex = recentTemplates.indexOf(b.id);
          if (aIndex === -1 && bIndex === -1) return 0;
          if (aIndex === -1) return 1;
          if (bIndex === -1) return -1;
          return aIndex - bIndex;
        case 'popular':
          // 这里可以根据使用频率排序，暂时按收藏状态排序
          const aFav = favoriteTemplates.includes(a.id) ? 1 : 0;
          const bFav = favoriteTemplates.includes(b.id) ? 1 : 0;
          return bFav - aFav;
        default:
          return 0;
      }
    });

    return result;
  }, [allTemplates, searchText, filters, sortBy, favoriteTemplates, recentTemplates]);

  // 按分类分组的模板
  const templatesByCategory = useMemo(() => {
    const grouped: Record<string, NodeTemplate[]> = {};
    filteredTemplates.forEach(template => {
      if (!grouped[template.category]) {
        grouped[template.category] = [];
      }
      grouped[template.category].push(template);
    });
    return grouped;
  }, [filteredTemplates]);

  /**
   * 处理节点拖拽开始
   */
  const handleDragStart = useCallback((template: NodeTemplate, event: React.DragEvent) => {
    event.dataTransfer.setData('application/json', JSON.stringify({
      type: 'node-template',
      template
    }));
    event.dataTransfer.effectAllowed = 'copy';
    
    if (onNodeDrag) {
      onNodeDrag(template, event);
    }
  }, [onNodeDrag]);

  /**
   * 处理节点选择
   */
  const handleNodeSelect = useCallback((template: NodeTemplate) => {
    setSelectedTemplate(template);
    if (onNodeSelect) {
      onNodeSelect(template);
    }
  }, [onNodeSelect]);

  /**
   * 处理节点创建
   */
  const handleNodeCreate = useCallback((template: NodeTemplate) => {
    if (onNodeCreate) {
      const node = createNodeFromTemplate(template, { x: 0, y: 0 });
      onNodeCreate(node);
    }
  }, [onNodeCreate]);

  /**
   * 切换收藏状态
   */
  const handleToggleFavorite = useCallback((templateId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (onToggleFavorite) {
      onToggleFavorite(templateId);
    }
  }, [onToggleFavorite]);

  /**
   * 显示节点预览
   */
  const handleShowPreview = useCallback((template: NodeTemplate, event: React.MouseEvent) => {
    event.stopPropagation();
    setSelectedTemplate(template);
    setPreviewVisible(true);
  }, []);

  /**
   * 获取复杂度颜色
   */
  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'simple': return 'green';
      case 'medium': return 'orange';
      case 'complex': return 'red';
      default: return 'default';
    }
  };

  /**
   * 获取分类图标
   */
  const getCategoryIcon = (category: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      [NodeCategory.DATA_PROCESSING]: <DatabaseOutlined />,
      [NodeCategory.API_INTEGRATION]: <ApiOutlined />,
      [NodeCategory.CONTROL_FLOW]: <BranchesOutlined />,
      [NodeCategory.TRANSFORMATION]: <SwapOutlined />,
      [NodeCategory.VALIDATION]: <CheckCircleOutlined />,
      [NodeCategory.NOTIFICATION]: <BellOutlined />,
      [NodeCategory.DATABASE]: <DatabaseOutlined />,
      [NodeCategory.FILE_OPERATIONS]: <FileOutlined />,
      [NodeCategory.AI_CAPABILITIES]: <RobotOutlined />,
      [NodeCategory.CUSTOM]: <SettingOutlined />
    };
    return iconMap[category] || <FunctionOutlined />;
  };

  /**
   * 渲染节点卡片
   */
  const renderNodeCard = (template: NodeTemplate) => {
    const isFavorite = favoriteTemplates.includes(template.id);
    const isRecent = recentTemplates.includes(template.id);

    return (
      <Card
        key={template.id}
        className={`node-template-card ${viewMode}`}
        size="small"
        hoverable
        draggable
        onDragStart={(e) => handleDragStart(template, e)}
        onClick={() => handleNodeSelect(template)}
        actions={[
          <Tooltip title={isFavorite ? '取消收藏' : '添加收藏'}>
            <Button
              type="text"
              size="small"
              icon={isFavorite ? <StarFilled style={{ color: '#faad14' }} /> : <StarOutlined />}
              onClick={(e) => handleToggleFavorite(template.id, e)}
            />
          </Tooltip>,
          <Tooltip title="预览详情">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={(e) => handleShowPreview(template, e)}
            />
          </Tooltip>,
          <Tooltip title="添加到画布">
            <Button
              type="text"
              size="small"
              icon={<PlusOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                handleNodeCreate(template);
              }}
            />
          </Tooltip>
        ]}
      >
        <Card.Meta
          avatar={
            <Avatar
              icon={getCategoryIcon(template.category)}
              style={{ backgroundColor: '#1890ff' }}
            />
          }
          title={
            <Space>
              <Text strong>{template.name}</Text>
              {isRecent && <Badge status="processing" />}
            </Space>
          }
          description={
            <div className="node-template-description">
              <Paragraph
                ellipsis={{ rows: 2, tooltip: template.description }}
                style={{ marginBottom: 8 }}
              >
                {template.description}
              </Paragraph>
              <Space wrap>
                <Tag color={getComplexityColor(template.complexity)}>
                  {template.complexity}
                </Tag>
                {template.tags.slice(0, 2).map(tag => (
                  <Tag key={tag} size="small">{tag}</Tag>
                ))}
                {template.tags.length > 2 && (
                  <Tag size="small">+{template.tags.length - 2}</Tag>
                )}
              </Space>
            </div>
          }
        />
      </Card>
    );
  };

  /**
   * 渲染分类面板
   */
  const renderCategoryPanel = () => {
    const categories = getAllCategories();
    
    return (
      <Collapse
        defaultActiveKey={Object.keys(templatesByCategory)}
        className="category-collapse"
      >
        {categories.map(category => {
          const templates = templatesByCategory[category.key] || [];
          if (templates.length === 0) return null;
          
          return (
            <Panel
              key={category.key}
              header={
                <Space>
                  {getCategoryIcon(category.key)}
                  <Text strong>{category.label}</Text>
                  <Badge count={templates.length} style={{ backgroundColor: '#52c41a' }} />
                </Space>
              }
            >
              <div className={`node-grid ${viewMode}`}>
                {templates.map(renderNodeCard)}
              </div>
            </Panel>
          );
        })}
      </Collapse>
    );
  };

  /**
   * 渲染过滤器抽屉
   */
  const renderFilterDrawer = () => (
    <Drawer
      title="高级过滤"
      placement="right"
      width={320}
      visible={filterDrawerVisible}
      onClose={() => setFilterDrawerVisible(false)}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <div>
          <Title level={5}>分类</Title>
          <Select
            style={{ width: '100%' }}
            value={filters.category}
            onChange={(value) => setFilters(prev => ({ ...prev, category: value }))}
          >
            <Option value="all">全部分类</Option>
            {getAllCategories().map(category => (
              <Option key={category.key} value={category.key}>
                {category.label}
              </Option>
            ))}
          </Select>
        </div>
        
        <div>
          <Title level={5}>复杂度</Title>
          <Select
            style={{ width: '100%' }}
            value={filters.complexity}
            onChange={(value) => setFilters(prev => ({ ...prev, complexity: value }))}
          >
            <Option value="all">全部复杂度</Option>
            <Option value="simple">简单</Option>
            <Option value="medium">中等</Option>
            <Option value="complex">复杂</Option>
          </Select>
        </div>
        
        <div>
          <Title level={5}>标签</Title>
          <Select
            mode="multiple"
            style={{ width: '100%' }}
            placeholder="选择标签"
            value={filters.tags}
            onChange={(value) => setFilters(prev => ({ ...prev, tags: value }))}
          >
            {allTags.map(tag => (
              <Option key={tag} value={tag}>{tag}</Option>
            ))}
          </Select>
        </div>
        
        <div>
          <Title level={5}>其他选项</Title>
          <Space direction="vertical">
            <Switch
              checked={filters.favorites}
              onChange={(checked) => setFilters(prev => ({ ...prev, favorites: checked }))}
            />
            <Text>只显示收藏</Text>
            
            <Switch
              checked={filters.recent}
              onChange={(checked) => setFilters(prev => ({ ...prev, recent: checked }))}
            />
            <Text>只显示最近使用</Text>
          </Space>
        </div>
        
        <Button
          block
          onClick={() => setFilters({
            category: 'all',
            complexity: 'all',
            tags: [],
            favorites: false,
            recent: false
          })}
        >
          重置过滤器
        </Button>
      </Space>
    </Drawer>
  );

  /**
   * 渲染节点预览模态框
   */
  const renderPreviewModal = () => (
    <Modal
      title={selectedTemplate?.name}
      visible={previewVisible}
      onCancel={() => setPreviewVisible(false)}
      width={800}
      footer={[
        <Button key="close" onClick={() => setPreviewVisible(false)}>
          关闭
        </Button>,
        <Button
          key="add"
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            if (selectedTemplate) {
              handleNodeCreate(selectedTemplate);
              setPreviewVisible(false);
            }
          }}
        >
          添加到画布
        </Button>
      ]}
    >
      {selectedTemplate && (
        <div className="node-preview">
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <div>
              <Title level={4}>基本信息</Title>
              <Space wrap>
                <Tag color={getComplexityColor(selectedTemplate.complexity)}>
                  {selectedTemplate.complexity}
                </Tag>
                {selectedTemplate.tags.map(tag => (
                  <Tag key={tag}>{tag}</Tag>
                ))}
              </Space>
              <Paragraph>{selectedTemplate.description}</Paragraph>
            </div>
            
            <div>
              <Title level={4}>输入端口</Title>
              <List
                size="small"
                dataSource={selectedTemplate.inputPorts}
                renderItem={(port) => (
                  <List.Item>
                    <List.Item.Meta
                      title={
                        <Space>
                          <Text strong>{port.name}</Text>
                          <Tag color="blue">{port.type}</Tag>
                          {port.required && <Tag color="red">必需</Tag>}
                        </Space>
                      }
                      description={port.description}
                    />
                  </List.Item>
                )}
              />
            </div>
            
            <div>
              <Title level={4}>输出端口</Title>
              <List
                size="small"
                dataSource={selectedTemplate.outputPorts}
                renderItem={(port) => (
                  <List.Item>
                    <List.Item.Meta
                      title={
                        <Space>
                          <Text strong>{port.name}</Text>
                          <Tag color="green">{port.type}</Tag>
                          {port.required && <Tag color="red">必需</Tag>}
                        </Space>
                      }
                      description={port.description}
                    />
                  </List.Item>
                )}
              />
            </div>
          </Space>
        </div>
      )}
    </Modal>
  );

  if (!visible) {
    return null;
  }

  return (
    <div className="enhanced-node-library">
      {/* 工具栏 */}
      <div className="library-toolbar">
        <Space>
          <Search
            placeholder="搜索节点模板..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 200 }}
            allowClear
          />
          <Select
            value={sortBy}
            onChange={setSortBy}
            style={{ width: 120 }}
          >
            <Option value="category">按分类</Option>
            <Option value="name">按名称</Option>
            <Option value="complexity">按复杂度</Option>
            <Option value="recent">最近使用</Option>
            <Option value="popular">最受欢迎</Option>
          </Select>
          <Button
            icon={<FilterOutlined />}
            onClick={() => setFilterDrawerVisible(true)}
          >
            过滤器
          </Button>
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
        </Space>
        
        <Space>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={onCreateCustomTemplate}
          >
            自定义节点
          </Button>
        </Space>
      </div>
      
      <Divider style={{ margin: '12px 0' }} />
      
      {/* 标签页 */}
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab={`全部 (${filteredTemplates.length})`} key="all">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '50px' }}>
              <Spin size="large" />
            </div>
          ) : filteredTemplates.length === 0 ? (
            <Empty
              description="没有找到匹配的节点模板"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ) : (
            renderCategoryPanel()
          )}
        </TabPane>
        
        <TabPane tab={`收藏 (${favoriteTemplates.length})`} key="favorites">
          <div className={`node-grid ${viewMode}`}>
            {allTemplates
              .filter(template => favoriteTemplates.includes(template.id))
              .map(renderNodeCard)
            }
          </div>
        </TabPane>
        
        <TabPane tab={`最近 (${recentTemplates.length})`} key="recent">
          <div className={`node-grid ${viewMode}`}>
            {allTemplates
              .filter(template => recentTemplates.includes(template.id))
              .map(renderNodeCard)
            }
          </div>
        </TabPane>
        
        {customTemplates.length > 0 && (
          <TabPane tab={`自定义 (${customTemplates.length})`} key="custom">
            <div className={`node-grid ${viewMode}`}>
              {customTemplates.map(renderNodeCard)}
            </div>
          </TabPane>
        )}
      </Tabs>
      
      {/* 过滤器抽屉 */}
      {renderFilterDrawer()}
      
      {/* 预览模态框 */}
      {renderPreviewModal()}
    </div>
  );
};

export default EnhancedNodeLibrary;