import React, { useState, useEffect, useCallback } from 'react';
import { Row, Col, Card, Button, Input, Select, Tag, Tooltip, Spin, Empty, Typography, Divider, Tabs, Modal, Form, message } from 'antd';
import { SearchOutlined, FilterOutlined, PlusOutlined, InfoCircleOutlined } from '@ant-design/icons';
import apiService from './ApiService';
import { useGlobalState } from './StateManager';
import { ComponentType, Component, ComponentCategory, NodeCategory } from './types';
import './CapabilityLibrary.css';

const { Title, Paragraph } = Typography;
const { Option } = Select;

interface Capability {
  id: string;
  name: string;
  type: string;
  description: string;
  config_schema: any;
  created_at: string;
  updated_at: string;
  category?: string;
  tags?: string[];
  icon?: string;
}

const CapabilityLibrary: React.FC = () => {
  const stateManager = useGlobalState();
  const [capabilities, setCapabilities] = useState<Capability[]>([]);
  const [filteredCapabilities, setFilteredCapabilities] = useState<Capability[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [typeFilter, setTypeFilter] = useState<string[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('all');
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedCapability, setSelectedCapability] = useState<Capability | null>(null);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [form] = Form.useForm();

  // 根据类型确定分类 - 更合理的分类逻辑
  const getCategoryFromType = useCallback((type: string): string => {
    switch (type) {
      case 'nlp':
      case 'text_summary':
      case 'translation':
      case 'sentiment_analysis':
        return '自然语言处理';
      case 'knowledge_graph':
      case 'data_processing':
        return '数据处理';
      case 'multimodal':
      case 'image_generation':
      case 'speech_recognition':
        return '多模态处理';
      case 'api_call':
      case 'code_generation':
        return '工具集成';
      case 'message_send':
      case 'message_receive':
        return '通信交互';
      default:
        return '其他';
    }
  }, []);
  
  // 从能力组件生成标签
  const getTagsFromCapability = useCallback((capability: Capability): string[] => {
    const tags: string[] = [capability.type];
    
    // 根据类型添加标签
    switch (capability.type) {
      case 'nlp':
        tags.push('自然语言处理', 'AI');
        break;
      case 'knowledge_graph':
        tags.push('知识图谱', '数据');
        break;
      case 'multimodal':
        tags.push('多模态', '图像', '视频');
        break;
      case 'api_call':
        tags.push('API', '集成');
        break;
      case 'message_send':
      case 'message_receive':
        tags.push('通信', '消息');
        break;
      case 'image_generation':
        tags.push('图像生成', 'AI');
        break;
      case 'code_generation':
        tags.push('代码生成', 'AI');
        break;
      case 'sentiment_analysis':
        tags.push('情感分析', 'AI');
        break;
      case 'text_summary':
        tags.push('文本摘要', 'AI');
        break;
      case 'translation':
        tags.push('翻译', 'AI');
        break;
      case 'speech_recognition':
        tags.push('语音识别', 'AI');
        break;
      case 'data_processing':
        tags.push('数据处理', '分析');
        break;
    }
    
    return tags;
  }, []);
  
  // 获取能力组件图标 - 使用字母缩写替代emoji以保持一致性
  const getIconForCapability = useCallback((type: string): string => {
    switch (type) {
      case 'nlp':
        return 'NLP';
      case 'knowledge_graph':
        return 'KG';
      case 'multimodal':
        return 'MM';
      case 'api_call':
        return 'API';
      case 'message_send':
        return 'MS';
      case 'message_receive':
        return 'MR';
      case 'image_generation':
        return 'IG';
      case 'code_generation':
        return 'CG';
      case 'sentiment_analysis':
        return 'SA';
      case 'text_summary':
        return 'TS';
      case 'translation':
        return 'TR';
      case 'speech_recognition':
        return 'SR';
      case 'data_processing':
        return 'DP';
      default:
        return 'CP';
    }
  }, []);
  
  // 加载能力组件数据
  const loadCapabilities = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiService.getCapabilities();
      
      if (response.success) {
        // 为能力组件添加额外的展示属性
        const enhancedCapabilities = response.data.map((capability: Capability) => ({
          ...capability,
          category: getCategoryFromType(capability.type),
          tags: getTagsFromCapability(capability),
          icon: getIconForCapability(capability.type)
        }));
        
        setCapabilities(enhancedCapabilities);
        setFilteredCapabilities(enhancedCapabilities);
      } else {
        setError(response.error || '加载能力组件失败');
      }
    } catch (err) {
      setError('加载能力组件时发生错误');
      console.error('Error loading capabilities:', err);
    } finally {
      setLoading(false);
    }
  }, [getCategoryFromType, getTagsFromCapability, getIconForCapability]);

  // 初始加载
  useEffect(() => {
    loadCapabilities();
  }, [loadCapabilities]);

  // 过滤能力组件
  useEffect(() => {
    let result = [...capabilities];
    
    // 标签页过滤
    if (activeTab !== 'all') {
      result = result.filter(capability => capability.category === activeTab);
    }
    
    // 搜索文本过滤
    if (searchText) {
      const lowerSearchText = searchText.toLowerCase();
      result = result.filter(capability => 
        capability.name.toLowerCase().includes(lowerSearchText) ||
        capability.description.toLowerCase().includes(lowerSearchText) ||
        capability.type.toLowerCase().includes(lowerSearchText) ||
        (capability.tags && capability.tags.some(tag => tag.toLowerCase().includes(lowerSearchText)))
      );
    }
    
    // 类型过滤
    if (typeFilter.length > 0) {
      result = result.filter(capability => typeFilter.includes(capability.type));
    }
    
    // 分类过滤
    if (categoryFilter.length > 0) {
      result = result.filter(capability => categoryFilter.includes(capability.category || ''));
    }
    
    setFilteredCapabilities(result);
  }, [capabilities, searchText, typeFilter, categoryFilter, activeTab]);

  // 添加能力组件到当前Agent
  const addCapabilityToAgent = (capability: Capability) => {
    const currentAgent = stateManager.getCurrentAgent();
    if (!currentAgent) {
      message.warning('请先选择或创建一个Agent实例');
      return;
    }
    
    const newComponent: Component = {
      id: `${capability.type}_${Date.now()}`,
      type: capability.type as unknown as ComponentType,
      name: capability.name,
      category: NodeCategory.CAPABILITY,
      description: capability.description,
      properties: [],
      position: { x: 0, y: 0 }
    };
    stateManager.addComponent(newComponent);
    
    message.success(`已添加${capability.name}组件到当前Agent`);
    stateManager.setActiveTab('designer');
  };

  // 查看能力组件详情
  const viewCapabilityDetail = (capability: Capability) => {
    setSelectedCapability(capability);
    setDetailModalVisible(true);
  };

  // 添加新能力组件
  const handleAddCapability = () => {
    form.resetFields();
    setAddModalVisible(true);
  };

  // 提交新能力组件
  const handleAddCapabilitySubmit = async () => {
    try {
      const values = await form.validateFields();
      
      // 这里应该调用API创建新的能力组件
      // 目前模拟添加
      const newCapability: Capability = {
        id: `cap_${Date.now()}`,
        name: values.name,
        type: values.type,
        description: values.description,
        config_schema: values.config_schema || {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      setCapabilities([...capabilities, {
        ...newCapability,
        category: getCategoryFromType(newCapability.type),
        tags: getTagsFromCapability(newCapability),
        icon: getIconForCapability(newCapability.type)
      }]);
      
      message.success('能力组件创建成功');
      setAddModalVisible(false);
    } catch (error) {
      console.error('Form validation failed:', error);
    }
  };

  // 渲染能力组件卡片
  const renderCapabilityCard = (capability: Capability) => {
    return (
      <Card
        key={capability.id}
        className="capability-card"
        hoverable
        data-testid="capability-card"
        actions={[
          <Tooltip title="查看详情">
            <Button 
              type="text" 
              icon={<InfoCircleOutlined />} 
              onClick={(e) => {
                e.stopPropagation();
                viewCapabilityDetail(capability);
              }}
            />
          </Tooltip>,
          <Button 
            type="primary" 
            onClick={() => addCapabilityToAgent(capability)}
            data-testid="add-capability-button"
          >
            添加
          </Button>
        ]}
      >
        <div className="capability-card-header">
          <span className="capability-icon">{capability.icon}</span>
          <Title level={4} data-testid="capability-name">{capability.name}</Title>
          <Tag color="blue" data-testid="capability-type">{capability.type}</Tag>
        </div>
        
        <Paragraph 
          ellipsis={{ rows: 3, expandable: true, symbol: '更多' }}
          data-testid="capability-description"
        >
          {capability.description}
        </Paragraph>
        
        <div className="capability-tags">
          {capability.tags && capability.tags.map(tag => (
            <Tag key={tag}>{tag}</Tag>
          ))}
        </div>
      </Card>
    );
  };

  // 获取所有分类
  const getAllCategories = () => {
    const categories = new Set<string>();
    capabilities.forEach(cap => {
      if (cap.category) {
        categories.add(cap.category);
      }
    });
    return Array.from(categories);
  };

  return (
    <div className="capability-library" data-testid="capabilities-panel">
      <div className="capability-library-header">
        <Title level={3}>能力组件库</Title>
        <div className="capability-library-actions">
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={handleAddCapability}
          >
            创建新组件
          </Button>
        </div>
      </div>
      
      <div className="capability-library-filters">
        <Input
          placeholder="搜索能力组件"
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
            style={{ width: 180 }}
            allowClear
          >
            <Option value="nlp">自然语言处理</Option>
            <Option value="knowledge_graph">知识图谱</Option>
            <Option value="multimodal">多模态理解</Option>
            <Option value="api_call">API调用</Option>
            <Option value="message_send">消息发送</Option>
            <Option value="message_receive">消息接收</Option>
            <Option value="image_generation">图像生成</Option>
            <Option value="code_generation">代码生成</Option>
            <Option value="sentiment_analysis">情感分析</Option>
            <Option value="text_summary">文本摘要</Option>
            <Option value="translation">翻译</Option>
            <Option value="speech_recognition">语音识别</Option>
            <Option value="data_processing">数据处理</Option>
          </Select>
          
          <Select
            mode="multiple"
            placeholder="分类"
            value={categoryFilter}
            onChange={setCategoryFilter}
            style={{ width: 150 }}
            allowClear
          >
            {getAllCategories().map(category => (
              <Option key={category} value={category}>{category}</Option>
            ))}
          </Select>
        </div>
      </div>
      
      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab}
        className="capability-tabs"
        items={[
          { label: "全部", key: "all" },
          { label: "自然语言处理", key: "自然语言处理" },
          { label: "数据处理", key: "数据处理" },
          { label: "多模态处理", key: "多模态处理" },
          { label: "工具集成", key: "工具集成" },
          { label: "通信交互", key: "通信交互" },
          { label: "其他", key: "其他" }
        ]}
      />
      
      {loading ? (
        <div className="capability-library-loading">
          <Spin size="large" tip="加载能力组件中..." />
        </div>
      ) : error ? (
        <div className="capability-library-error">
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <span>
                加载能力组件失败: {error}
                <Button type="link" onClick={loadCapabilities}>重试</Button>
              </span>
            }
          />
        </div>
      ) : filteredCapabilities.length === 0 ? (
        <div className="capability-library-empty">
          <Empty description="没有找到匹配的能力组件" />
        </div>
      ) : (
        <div className="capability-library-content">
          <Row gutter={[16, 16]}>
            {filteredCapabilities.map(capability => (
              <Col xs={24} sm={12} md={8} lg={6} key={capability.id}>
                {renderCapabilityCard(capability)}
              </Col>
            ))}
          </Row>
        </div>
      )}
      
      {/* 能力组件详情模态框 */}
      <Modal
        title={selectedCapability?.name}
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            关闭
          </Button>,
          <Button 
            key="add" 
            type="primary" 
            onClick={() => {
              if (selectedCapability) {
                addCapabilityToAgent(selectedCapability);
                setDetailModalVisible(false);
              }
            }}
          >
            添加到当前Agent
          </Button>
        ]}
        width={700}
      >
        {selectedCapability && (
          <div className="capability-detail">
            <div className="capability-detail-header">
              <div className="capability-detail-icon">
                {selectedCapability.icon}
              </div>
              <div className="capability-detail-info">
                <Title level={4}>{selectedCapability.name}</Title>
                <div className="capability-detail-meta">
                  <Tag color="blue">{selectedCapability.type}</Tag>
                  <Tag color="cyan">{selectedCapability.category}</Tag>
                </div>
              </div>
            </div>
            
            <Divider />
            
            <div className="capability-detail-description">
              <Title level={5}>描述</Title>
              <Paragraph>{selectedCapability.description}</Paragraph>
            </div>
            
            <div className="capability-detail-tags">
              <Title level={5}>标签</Title>
              <div>
                {selectedCapability.tags && selectedCapability.tags.map(tag => (
                  <Tag key={tag}>{tag}</Tag>
                ))}
              </div>
            </div>
            
            <div className="capability-detail-schema">
              <Title level={5}>配置模式</Title>
              <pre className="schema-preview">
                {JSON.stringify(selectedCapability.config_schema, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </Modal>
      
      {/* 添加能力组件模态框 */}
      <Modal
        title="创建新能力组件"
        open={addModalVisible}
        onCancel={() => setAddModalVisible(false)}
        onOk={handleAddCapabilitySubmit}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Form.Item
            name="name"
            label="名称"
            rules={[{ required: true, message: '请输入能力组件名称' }]}
          >
            <Input placeholder="请输入能力组件名称" />
          </Form.Item>
          
          <Form.Item
            name="type"
            label="类型"
            rules={[{ required: true, message: '请选择能力组件类型' }]}
          >
            <Select placeholder="请选择能力组件类型">
              <Option value="nlp">自然语言处理</Option>
              <Option value="knowledge_graph">知识图谱</Option>
              <Option value="multimodal">多模态理解</Option>
              <Option value="api_call">API调用</Option>
              <Option value="message_send">消息发送</Option>
              <Option value="message_receive">消息接收</Option>
              <Option value="image_generation">图像生成</Option>
              <Option value="code_generation">代码生成</Option>
              <Option value="sentiment_analysis">情感分析</Option>
              <Option value="text_summary">文本摘要</Option>
              <Option value="translation">翻译</Option>
              <Option value="speech_recognition">语音识别</Option>
              <Option value="data_processing">数据处理</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="description"
            label="描述"
            rules={[{ required: true, message: '请输入能力组件描述' }]}
          >
            <Input.TextArea 
              placeholder="请输入能力组件描述" 
              rows={4} 
            />
          </Form.Item>
          
          <Form.Item
            name="config_schema"
            label="配置模式"
            help="JSON格式的配置模式定义"
          >
            <Input.TextArea 
              placeholder="请输入JSON格式的配置模式定义" 
              rows={6} 
              defaultValue="{}"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CapabilityLibrary;
