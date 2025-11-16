/**
 * 智能能力配置组件
 * 基于EFIAgent 2.0产品设计的下一代能力配置界面
 * 包含智能配置向导、AI推荐系统、可视化编排器等核心功能
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Card, Tabs, Steps, Button, Space, Drawer, Modal, Form, Input, Select,
  Tooltip, Tag, Badge, Progress, Alert, Divider, Collapse, Switch,
  Radio, Slider, InputNumber, Tree, Timeline, Spin, Empty, message,
  Row, Col, Typography, Avatar, List, Statistic, Rate, Popover
} from 'antd';
import {
  BulbOutlined, ThunderboltOutlined, ApartmentOutlined, BookOutlined,
  RobotOutlined, SettingOutlined, PlayCircleOutlined, EyeOutlined,
  StarOutlined, FilterOutlined, SearchOutlined, PlusOutlined,
  DeleteOutlined, EditOutlined, CopyOutlined, DownloadOutlined,
  UploadOutlined, ShareAltOutlined, QuestionCircleOutlined,
  CheckCircleOutlined, ExclamationCircleOutlined, ClockCircleOutlined,
  FireOutlined, TrophyOutlined, TeamOutlined, GlobalOutlined
} from '@ant-design/icons';
import ReactFlow, {
  Node, Edge, Controls, Background, MiniMap, addEdge,
  useNodesState, useEdgesState, Connection, NodeTypes
} from 'reactflow';
import {
  CoreCapabilityType, CapabilityMaturityLevel, CapabilitySourceType,
  CoreCapabilityModule, CapabilityModuleConfig, Agent2_0
} from './CapabilitySystemTypes';
import './IntelligentCapabilityConfig.css';

const { TabPane } = Tabs;
const { Step } = Steps;
const { Panel } = Collapse;
const { Option } = Select;
const { TextArea } = Input;
const { Title, Text, Paragraph } = Typography;
const { TreeNode } = Tree;

// 场景模板定义
interface ScenarioTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  estimatedTime: string;
  capabilities: string[];
  tags: string[];
  popularity: number;
  rating: number;
}

// AI推荐结果
interface AIRecommendation {
  id: string;
  type: 'capability' | 'combination' | 'optimization';
  title: string;
  description: string;
  confidence: number;
  reasoning: string;
  impact: 'low' | 'medium' | 'high';
  effort: 'low' | 'medium' | 'high';
  capabilities?: CoreCapabilityModule[];
  benefits: string[];
}

// 配置向导步骤
interface ConfigWizardStep {
  key: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  component: React.ReactNode;
  validation?: () => boolean;
}

interface IntelligentCapabilityConfigProps {
  agent: Agent2_0;
  onAgentChange: (agent: Agent2_0) => void;
  onClose?: () => void;
  mode?: 'wizard' | 'advanced' | 'visual';
}

const IntelligentCapabilityConfig: React.FC<IntelligentCapabilityConfigProps> = ({
  agent,
  onAgentChange,
  onClose,
  mode = 'wizard'
}) => {
  // ===== 所有React Hooks必须在条件检查之前调用 =====

  // 核心状态
  const [currentMode, setCurrentMode] = useState(mode);
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedScenario, setSelectedScenario] = useState<ScenarioTemplate | null>(null);
  const [selectedCapabilities, setSelectedCapabilities] = useState<CoreCapabilityModule[]>([]);
  const [aiRecommendations, setAiRecommendations] = useState<AIRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);

  // UI状态
  const [aiAssistantVisible, setAiAssistantVisible] = useState(true);
  const [capabilityLibraryVisible, setCapabilityLibraryVisible] = useState(false);
  const [configPanelVisible, setConfigPanelVisible] = useState(false);
  const [selectedCapability, setSelectedCapability] = useState<CoreCapabilityModule | null>(null);

  // 搜索和过滤状态
  const [searchText, setSearchText] = useState('');
  const [filterType, setFilterType] = useState<CoreCapabilityType | 'all'>('all');
  const [filterMaturity, setFilterMaturity] = useState<CapabilityMaturityLevel | 'all'>('all');
  const [filterSource, setFilterSource] = useState<CapabilitySourceType | 'all'>('all');

  // ReactFlow状态
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // 初始化selectedCapabilities - agent存在时初始化数据
  useEffect(() => {
    if (agent) {
      const validCapabilities = (agent?.capabilities || []).filter(cap =>
        cap &&
        typeof cap === 'object' &&
        cap.id &&
        typeof cap.id === 'string' &&
        cap.id.trim() !== ''
      );
      setSelectedCapabilities(validCapabilities);
    }
  }, [agent?.capabilities]);

  // 加载AI推荐的回调函数
  const loadAIRecommendations = useCallback(async () => {
    if (!agent) return;

    setLoading(true);
    try {
      // 模拟AI推荐API调用
      await new Promise(resolve => setTimeout(resolve, 1000));

      const recommendations: AIRecommendation[] = [
        {
          id: 'rec_1',
          type: 'capability',
          title: '建议添加情感分析能力',
          description: '基于当前配置，添加情感分析能力可以提升用户体验质量',
          confidence: 0.85,
          reasoning: '检测到对话管理能力，情感分析可以帮助更好地理解用户情绪',
          impact: 'high',
          effort: 'medium',
          benefits: ['提升用户满意度', '改善对话质量', '增强个性化体验']
        },
        {
          id: 'rec_2',
          type: 'optimization',
          title: '优化能力执行顺序',
          description: '调整能力执行顺序可以提升30%的响应速度',
          confidence: 0.92,
          reasoning: '分析发现当前配置存在不必要的依赖等待',
          impact: 'medium',
          effort: 'low',
          benefits: ['提升响应速度', '降低资源消耗', '改善用户体验']
        },
        {
          id: 'rec_3',
          type: 'combination',
          title: '推荐能力组合方案',
          description: '基于最佳实践，推荐一套经过验证的能力组合',
          confidence: 0.78,
          reasoning: '该组合在类似场景中表现优异，成功率达到95%',
          impact: 'high',
          effort: 'medium',
          benefits: ['降低配置复杂度', '提高成功率', '减少调试时间']
        }
      ];

      setAiRecommendations(recommendations);
    } catch (error) {
      message.error('加载AI推荐失败');
    } finally {
      setLoading(false);
    }
  }, [agent, selectedCapabilities]);

  // 从能力生成流程图的回调函数
  const generateFlowFromCapabilities = useCallback(() => {
    if (selectedCapabilities.length === 0) {
      setNodes([]);
      setEdges([]);
      return;
    }

    // 过滤掉null、undefined或没有id的能力对象
    const validCapabilities = selectedCapabilities.filter(capability =>
      capability &&
      capability.id &&
      typeof capability.id === 'string'
    );

    const newNodes = validCapabilities.map((capability, index) => ({
      id: capability.id,
      type: 'capabilityNode',
      position: { x: (index % 3) * 200, y: Math.floor(index / 3) * 120 },
      data: { capability }
    }));

    const newEdges = validCapabilities.slice(0, -1).map((capability, index) => ({
      id: `edge-${capability.id}-${validCapabilities[index + 1].id}`,
      source: capability.id,
      target: validCapabilities[index + 1].id,
      type: 'smoothstep'
    }));

    setNodes(newNodes);
    setEdges(newEdges);
  }, [selectedCapabilities, setNodes, setEdges]);

  // 初始化组件
  useEffect(() => {
    if (agent) {
      loadAIRecommendations();
      generateFlowFromCapabilities();
    }
  }, [agent, selectedCapabilities, loadAIRecommendations, generateFlowFromCapabilities]);

  // ===== 条件检查必须在所有Hook之后 =====

  // 如果agent为null，不渲染组件
  if (!agent) {
    return null;
  }

  /**
   * 获取指定类型的能力数量
   */
  const getCapabilityCount = (type: CoreCapabilityType) => {
    return selectedCapabilities.filter(cap => cap && cap.type === type).length;
  };
  
  /**
   * 渲染能力维度
   */
  const renderCapabilityDimension = (type: CoreCapabilityType) => {
    // 这里应该根据type返回对应的能力列表
    // 暂时返回模拟数据
    const mockCapabilities = [
      { id: '1', name: '自然语言理解', description: '理解和解析自然语言文本' },
      { id: '2', name: '语义分析', description: '分析文本的语义含义' },
      { id: '3', name: '实体识别', description: '识别文本中的命名实体' }
    ];
    
    return (
      <div className="capability-dimension">
        {mockCapabilities.map(cap => (
          <Card key={cap.id}  style={{ marginBottom: 8 }}>
            <div className="capability-item">
              <div className="capability-info">
                <Text strong>{cap?.name || '未知能力'}</Text>
                <br />
                <Text type="secondary" style={{ fontSize: 12 }}>{cap.description}</Text>
              </div>
              <div className="capability-actions">
                <Button type="link" >添加</Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  };
  
  /**
   * 渲染AI推荐面板
   */
  
  
  /**
   * 渲染已选择的能力
   */
  const renderSelectedCapabilities = () => {
    // 过滤掉null或undefined的能力对象
    const validCapabilities = selectedCapabilities.filter(capability => 
      capability && 
      typeof capability === 'object'
    );
    
    return (
      <Card title="已选择的能力"  className="selected-capabilities">
        {validCapabilities.length === 0 ? (
          <Empty 
            image={Empty.PRESENTED_IMAGE_SIMPLE} 
            description="暂未选择能力" 
            style={{ margin: '20px 0' }}
          />
        ) : (
          <List
            
            dataSource={validCapabilities}
            renderItem={capability => {
              // 确保capability不为null
              if (!capability) {
                return null;
              }
              
              return (
                <List.Item 
                  className="selected-capability-item"
                  actions={[
                    <Button 
                      type="text" 
                       
                      icon={<EditOutlined />}
                      onClick={() => handleEditCapability(capability)}
                    />,
                    <Button 
                      type="text" 
                       
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => handleRemoveCapability(capability?.id || '')}
                    />
                  ]}
                >
                  <List.Item.Meta
                    avatar={
                      <Avatar 
                        icon={getCapabilityIcon(capability?.type as CoreCapabilityType || CoreCapabilityType.COGNITIVE)}
                        style={{ backgroundColor: getCapabilityColor(capability?.type as CoreCapabilityType || CoreCapabilityType.COGNITIVE) }}
                        
                      />
                    }
                    title={<Text style={{ fontSize: 12 }}>{capability?.name || '未知能力'}</Text>}
                    description={
                      <Tag  color={getCapabilityColor(capability?.type as CoreCapabilityType || CoreCapabilityType.COGNITIVE)}>
                        {capability?.type || 'unknown'}
                      </Tag>
                    }
                  />
                </List.Item>
              );
            }}
          />
        )}
      </Card>
    );
  };
  
  /**
   * 获取能力图标
   */
  const getCapabilityIcon = (type: CoreCapabilityType) => {
    switch (type) {
      case CoreCapabilityType.COGNITIVE:
        return <BulbOutlined />;
      case CoreCapabilityType.REASONING:
        return <ThunderboltOutlined />;
      case CoreCapabilityType.DECISION:
        return <ApartmentOutlined />;
      case CoreCapabilityType.LEARNING:
        return <BookOutlined />;
      default:
        return <QuestionCircleOutlined />;
    }
  };
  
  /**
   * 获取能力颜色
   */
  const getCapabilityColor = (type: CoreCapabilityType) => {
    switch (type) {
      case CoreCapabilityType.COGNITIVE:
        return '#1890ff';
      case CoreCapabilityType.REASONING:
        return '#52c41a';
      case CoreCapabilityType.DECISION:
        return '#fa8c16';
      case CoreCapabilityType.LEARNING:
        return '#eb2f96';
      default:
        return '#666666';
    }
  };
  
  /**
   * 处理添加能力
   */
  const handleAddCapability = (capability: CoreCapabilityModule) => {
    if (capability && 
        capability.id && 
        typeof capability.id === 'string' && 
        capability.id.trim() !== '' &&
        !selectedCapabilities.find(cap => cap && cap.id === capability.id)) {
      setSelectedCapabilities([...selectedCapabilities, capability]);
    }
  };
  
  /**
   * 处理移除能力
   */
  const handleRemoveCapability = (capabilityId: string) => {
    if (!capabilityId || typeof capabilityId !== 'string') {
      return;
    }
    setSelectedCapabilities(selectedCapabilities.filter(cap => 
      cap && cap.id && cap.id !== capabilityId
    ));
  };
  


  // 场景模板数据
  const scenarioTemplates: ScenarioTemplate[] = [
    {
      id: 'customer_service',
      name: '智能客服',
      description: '构建具备自然语言理解、情感分析、知识检索和对话管理能力的智能客服系统',
      icon: <TeamOutlined />,
      category: '业务应用',
      difficulty: 'intermediate',
      estimatedTime: '2-3小时',
      capabilities: ['nlp_understanding', 'sentiment_analysis', 'knowledge_retrieval', 'dialogue_management'],
      tags: ['客服', 'NLP', '对话系统', '情感分析'],
      popularity: 95,
      rating: 4.8
    },
    {
      id: 'data_analysis',
      name: '数据分析专家',
      description: '创建能够进行数据清洗、统计分析、模式识别和可视化的智能数据分析系统',
      icon: <FireOutlined />,
      category: '数据科学',
      difficulty: 'advanced',
      estimatedTime: '3-4小时',
      capabilities: ['data_processing', 'statistical_analysis', 'pattern_recognition', 'visualization'],
      tags: ['数据分析', '机器学习', '统计', '可视化'],
      popularity: 87,
      rating: 4.6
    },
    {
      id: 'content_creation',
      name: '内容创作助手',
      description: '开发具备文本生成、图像处理、创意设计和内容优化能力的创作助手',
      icon: <BulbOutlined />,
      category: '创意工具',
      difficulty: 'intermediate',
      estimatedTime: '2-3小时',
      capabilities: ['text_generation', 'image_processing', 'creative_design', 'content_optimization'],
      tags: ['内容创作', '文本生成', '图像处理', '创意'],
      popularity: 78,
      rating: 4.5
    },
    {
      id: 'decision_support',
      name: '决策支持系统',
      description: '构建能够进行风险评估、方案比较、预测分析和决策推荐的智能决策系统',
      icon: <ApartmentOutlined />,
      category: '决策支持',
      difficulty: 'expert',
      estimatedTime: '4-5小时',
      capabilities: ['risk_assessment', 'scenario_analysis', 'predictive_modeling', 'decision_optimization'],
      tags: ['决策支持', '风险评估', '预测分析', '优化'],
      popularity: 72,
      rating: 4.7
    }
  ];
  
  // 配置向导步骤定义
  const wizardSteps: ConfigWizardStep[] = [
    {
      key: 'scenario',
      title: '场景选择',
      description: '选择适合的应用场景模板',
      icon: <GlobalOutlined />,
      component: renderScenarioSelection(),
      validation: () => selectedScenario !== null
    },
    {
      key: 'capabilities',
      title: '能力配置',
      description: '配置核心能力维度',
      icon: <SettingOutlined />,
      component: renderCapabilityConfiguration(),
      validation: () => selectedCapabilities.length > 0
    },
    {
      key: 'orchestration',
      title: '编排设计',
      description: '设计能力执行流程',
      icon: <ApartmentOutlined />,
      component: renderOrchestrationDesign(),
      validation: () => nodes.length > 0
    },
    {
      key: 'optimization',
      title: '优化配置',
      description: '性能和资源优化',
      icon: <ThunderboltOutlined />,
      component: renderOptimizationConfig(),
      validation: () => true
    }
  ];  
  /**
   * 渲染场景选择步骤
   */
  function renderScenarioSelection() {
    return (
      <div className="scenario-selection">
        <div className="section-header">
          <Title level={4}>选择应用场景</Title>
          <Paragraph type="secondary">
            选择一个预定义的场景模板，或者从空白开始创建自定义配置
          </Paragraph>
        </div>
        
        <Row gutter={[16, 16]}>
          {scenarioTemplates.map(scenario => (
            <Col key={scenario.id} xs={24} sm={12} lg={8}>
              <Card
                className={`scenario-card ${selectedScenario?.id === scenario.id ? 'selected' : ''}`}
                hoverable
                onClick={() => setSelectedScenario(scenario)}
                cover={
                  <div className="scenario-cover">
                    <div className="scenario-icon">{scenario.icon}</div>
                    <div className="scenario-stats">
                      <Space>
                        <Badge count={scenario.popularity} style={{ backgroundColor: '#52c41a' }} />
                        <Rate disabled defaultValue={scenario.rating} style={{ fontSize: 12 }} />
                      </Space>
                    </div>
                  </div>
                }
              >
                <Card.Meta
                  title={scenario.name}
                  description={scenario.description}
                />
                <div className="scenario-details">
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <div className="scenario-tags">
                      {scenario.tags.map(tag => (
                        <Tag key={tag} >{tag}</Tag>
                      ))}
                    </div>
                    <div className="scenario-meta">
                      <Space split={<Divider type="vertical" />}>
                        <Text type="secondary">{scenario.difficulty}</Text>
                        <Text type="secondary">{scenario.estimatedTime}</Text>
                        <Text type="secondary">{scenario.capabilities.length}个能力</Text>
                      </Space>
                    </div>
                  </Space>
                </div>
              </Card>
            </Col>
          ))}
          
          {/* 自定义场景选项 */}
          <Col xs={24} sm={12} lg={8}>
            <Card
              className="scenario-card custom-scenario"
              hoverable
              onClick={() => setSelectedScenario(null)}
            >
              <div className="custom-scenario-content">
                <PlusOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />
                <Title level={5} style={{ marginTop: 16 }}>自定义配置</Title>
                <Paragraph type="secondary">从空白开始创建自定义Agent配置</Paragraph>
              </div>
            </Card>
          </Col>
        </Row>
      </div>
    );
  }
  
  /**
   * 渲染能力配置步骤
   */
  function renderCapabilityConfiguration() {
    return (
      <div className="capability-configuration">
        <Row gutter={24}>
          {/* 左侧：能力维度配置 */}
          <Col span={16}>
            <Card title="核心能力维度" className="capability-dimensions">
              <Collapse defaultActiveKey={['cognitive']} ghost>
                <Panel
                  header={
                    <div className="dimension-header">
                      <BulbOutlined style={{ color: '#1890ff' }} />
                      <span>认知能力 (Cognitive)</span>
                      <Badge count={getCapabilityCount(CoreCapabilityType.COGNITIVE)} style={{ marginLeft: 8 }} />
                    </div>
                  }
                  key="cognitive"
                >
                  {renderCapabilityDimension(CoreCapabilityType.COGNITIVE)}
                </Panel>
                
                <Panel
                  header={
                    <div className="dimension-header">
                      <ThunderboltOutlined style={{ color: '#52c41a' }} />
                      <span>推理能力 (Reasoning)</span>
                      <Badge count={getCapabilityCount(CoreCapabilityType.REASONING)} style={{ marginLeft: 8 }} />
                    </div>
                  }
                  key="reasoning"
                >
                  {renderCapabilityDimension(CoreCapabilityType.REASONING)}
                </Panel>

                
                <Panel
                  header={
                    <div className="dimension-header">
                      <ApartmentOutlined style={{ color: '#fa8c16' }} />
                      <span>决策能力 (Decision)</span>
                      <Badge count={getCapabilityCount(CoreCapabilityType.DECISION)} style={{ marginLeft: 8 }} />
                    </div>
                  }
                  key="decision"
                >
                  {renderCapabilityDimension(CoreCapabilityType.DECISION)}
                </Panel>
                
                <Panel
                  header={
                    <div className="dimension-header">
                      <BookOutlined style={{ color: '#eb2f96' }} />
                      <span>学习能力 (Learning)</span>
                      <Badge count={getCapabilityCount(CoreCapabilityType.LEARNING)} style={{ marginLeft: 8 }} />
                    </div>
                  }
                  key="learning"
                >
                  {renderCapabilityDimension(CoreCapabilityType.LEARNING)}
                </Panel>
              </Collapse>
            </Card>
          </Col>
          
          {/* 右侧：AI推荐和已选能力 */}
          <Col span={8}>
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              {/* AI推荐面板 */}
              {renderAIRecommendationPanel()}
              
              {/* 已选能力列表 */}
              {renderSelectedCapabilities()}
            </Space>
          </Col>
        </Row>
      </div>
    );
  }
  
  /**
   * 渲染编排设计步骤
   */
  function renderOrchestrationDesign() {
    return (
      <div className="orchestration-design">
        <div className="design-header">
          <Space>
            <Title level={4}>能力编排设计</Title>
            <Button type="primary" icon={<PlayCircleOutlined />} onClick={() => setPreviewVisible(true)}>
              预览执行
            </Button>
            <Button icon={<EyeOutlined />} onClick={() => setPreviewVisible(true)}>
              实时预览
            </Button>
          </Space>
        </div>
        
        <div className="flow-container" style={{ height: 400, border: '1px solid #d9d9d9', borderRadius: 6 }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={(connection: Connection) => setEdges(eds => addEdge(connection, eds))}
            fitView
          >
            <Controls />
            <Background />
            <MiniMap />
          </ReactFlow>
        </div>
        
        <div className="orchestration-config">
          <Row gutter={16}>
            <Col span={8}>
              <Card  title="执行模式">
                <Radio.Group defaultValue="sequential">
                  <Space direction="vertical">
                    <Radio value="sequential">顺序执行</Radio>
                    <Radio value="parallel">并行执行</Radio>
                    <Radio value="conditional">条件执行</Radio>
                    <Radio value="adaptive">自适应执行</Radio>
                  </Space>
                </Radio.Group>
              </Card>
            </Col>
            
            <Col span={8}>
              <Card  title="性能配置">
                <Space direction="vertical" style={{ width: '100%' }}>
                  <div>
                    <Text>超时时间 (秒)</Text>
                    <Slider min={1} max={300} defaultValue={30} />
                  </div>
                  <div>
                    <Text>重试次数</Text>
                    <InputNumber min={0} max={5} defaultValue={3} style={{ width: '100%' }} />
                  </div>
                  <div>
                    <Text>并发限制</Text>
                    <InputNumber min={1} max={100} defaultValue={10} style={{ width: '100%' }} />
                  </div>
                </Space>
              </Card>
            </Col>
            
            <Col span={8}>
              <Card  title="监控配置">
                <Space direction="vertical">
                  <div>
                    <Switch defaultChecked /> 启用性能监控
                  </div>
                  <div>
                    <Switch defaultChecked /> 启用错误追踪
                  </div>
                  <div>
                    <Switch /> 启用调试模式
                  </div>
                  <div>
                    <Switch defaultChecked /> 启用日志记录
                  </div>
                </Space>
              </Card>
            </Col>
          </Row>
        </div>
      </div>
    );
  }
  
  /**
   * 渲染优化配置步骤
   */
  function renderOptimizationConfig() {
    return (
      <div className="optimization-config">
        <Title level={4}>性能优化配置</Title>
        
        <Row gutter={[16, 16]}>
          <Col span={12}>
            <Card title="资源配置" >
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <Text>CPU限制 (%)</Text>
                  <Slider min={10} max={100} defaultValue={70} marks={{ 10: '10%', 50: '50%', 100: '100%' }} />
                </div>
                <div>
                  <Text>内存限制 (GB)</Text>
                  <Slider min={1} max={32} defaultValue={8} marks={{ 1: '1GB', 16: '16GB', 32: '32GB' }} />
                </div>
                <div>
                  <Text>存储限制 (GB)</Text>
                  <Slider min={1} max={1000} defaultValue={100} marks={{ 1: '1GB', 500: '500GB', 1000: '1TB' }} />
                </div>
              </Space>
            </Card>
          </Col>
          
          <Col span={12}>
            <Card title="缓存配置" >
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <Switch defaultChecked /> 启用结果缓存
                </div>
                <div>
                  <Text>缓存大小 (MB)</Text>
                  <InputNumber min={10} max={1000} defaultValue={100} style={{ width: '100%' }} />
                </div>
                <div>
                  <Text>缓存TTL (分钟)</Text>
                  <InputNumber min={1} max={1440} defaultValue={60} style={{ width: '100%' }} />
                </div>
                <div>
                  <Text>缓存策略</Text>
                  <Select defaultValue="lru" style={{ width: '100%' }}>
                    <Option value="lru">LRU</Option>
                    <Option value="lfu">LFU</Option>
                    <Option value="fifo">FIFO</Option>
                  </Select>
                </div>
              </Space>
            </Card>
          </Col>
          
          <Col span={12}>
            <Card title="自动扩缩容" >
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <Switch defaultChecked /> 启用自动扩缩容
                </div>
                <div>
                  <Text>最小实例数</Text>
                  <InputNumber min={1} max={10} defaultValue={1} style={{ width: '100%' }} />
                </div>
                <div>
                  <Text>最大实例数</Text>
                  <InputNumber min={1} max={100} defaultValue={10} style={{ width: '100%' }} />
                </div>
                <div>
                  <Text>扩容阈值 (%)</Text>
                  <Slider min={50} max={95} defaultValue={80} />
                </div>
              </Space>
            </Card>
          </Col>
          
          <Col span={12}>
            <Card title="安全配置" >
              <Space direction="vertical">
                <div>
                  <Switch defaultChecked /> 启用访问控制
                </div>
                <div>
                  <Switch defaultChecked /> 启用数据加密
                </div>
                <div>
                  <Switch defaultChecked /> 启用审计日志
                </div>
                <div>
                  <Switch /> 启用匿名化
                </div>
              </Space>
            </Card>
          </Col>
        </Row>
        
        {/* 优化建议 */}
        <Card title="优化建议" style={{ marginTop: 16 }}>
          <List
            
            dataSource={[
              { title: '建议启用结果缓存', description: '可提升30%的响应速度', type: 'success' },
              { title: '建议调整并发限制', description: '当前配置可能导致资源竞争', type: 'warning' },
              { title: '建议启用自动扩缩容', description: '可根据负载自动调整资源', type: 'info' }
            ]}
            renderItem={item => (
              <List.Item>
                <List.Item.Meta
                  avatar={
                    <Avatar 
                      icon={
                        item.type === 'success' ? <CheckCircleOutlined /> :
                        item.type === 'warning' ? <ExclamationCircleOutlined /> :
                        <ClockCircleOutlined />
                      }
                      style={{
                        backgroundColor: 
                          item.type === 'success' ? '#52c41a' :
                          item.type === 'warning' ? '#faad14' :
                          '#1890ff'
                      }}
                    />
                  }
                  title={item.title}
                  description={item.description}
                />
              </List.Item>
            )}
          />
        </Card>
      </div>
    );
  }
  
  /**
   * 渲染AI推荐面板
   */
  function renderAIRecommendationPanel() {
    return (
      <Card 
        title={
          <Space>
            <RobotOutlined style={{ color: '#1890ff' }} />
            <span>AI智能推荐</span>
            {loading && <Spin  />}
          </Space>
        }
        
        className="ai-recommendation-panel"
      >
        {aiRecommendations.length === 0 ? (
          <Empty 
            image={Empty.PRESENTED_IMAGE_SIMPLE} 
            description="暂无推荐" 
            style={{ margin: '20px 0' }}
          />
        ) : (
          <List
            
            dataSource={aiRecommendations}
            renderItem={recommendation => (
              <List.Item className="recommendation-item">
                <div className="recommendation-content">
                  <div className="recommendation-header">
                    <Text strong style={{ fontSize: 12 }}>{recommendation.title}</Text>
                    <Progress 
                      percent={Math.round(recommendation.confidence * 100)} 
                       
                      style={{ width: 60 }}
                      strokeColor={recommendation.confidence > 0.8 ? '#52c41a' : '#faad14'}
                    />
                  </div>
                  <Paragraph 
                    style={{ fontSize: 11, margin: '4px 0', color: '#666' }}
                    ellipsis={{ rows: 2 }}
                  >
                    {recommendation.description}
                  </Paragraph>
                  <div className="recommendation-actions">
                    <Space >
                      <Button type="link" >应用</Button>
                      <Button type="link" >详情</Button>
                    </Space>
                  </div>
                </div>
              </List.Item>
            )}
          />
        )}
      </Card>
    );
  }
  

  

  
  /**
   * 处理编辑能力
   */
  const handleEditCapability = (capability: CoreCapabilityModule) => {
    // 确保capability不为null或undefined
    if (!capability || typeof capability !== 'object') {
      console.warn('尝试编辑无效的能力对象:', capability);
      message.warning('无法编辑该能力，数据无效');
      return;
    }
    
    setSelectedCapability(capability);
    setConfigPanelVisible(true);
  };
  

  
  /**
   * 处理步骤切换
   */
  const handleStepChange = (step: number) => {
    if (step < currentStep) {
      setCurrentStep(step);
      return;
    }
    
    // 验证当前步骤
    const currentStepConfig = wizardSteps[currentStep];
    if (currentStepConfig.validation && !currentStepConfig.validation()) {
      message.warning(`请完成${currentStepConfig.title}的配置`);
      return;
    }
    
    setCurrentStep(step);
  };
  
  /**
   * 处理完成配置
   */
  const handleFinishConfig = () => {
    const updatedAgent: Agent2_0 = {
      ...agent,
      capabilities: selectedCapabilities
    };
    
    onAgentChange(updatedAgent);
    message.success('能力配置已保存');
    
    if (onClose) {
      onClose();
    }
  };
  
  /**
   * 渲染主界面
   */
  const renderMainContent = () => {
    switch (currentMode) {
      case 'wizard':
        return (
          <div className="config-wizard">
            <div className="wizard-header">
              <Steps current={currentStep} onChange={handleStepChange}>
                {wizardSteps.map(step => (
                  <Step 
                    key={step.key}
                    title={step.title}
                    description={step.description}
                    icon={step.icon}
                  />
                ))}
              </Steps>
            </div>
            
            <div className="wizard-content">
              {wizardSteps[currentStep]?.component}
            </div>
            
            <div className="wizard-footer">
              <Space>
                {currentStep > 0 && (
                  <Button onClick={() => handleStepChange(currentStep - 1)}>
                    上一步
                  </Button>
                )}
                {currentStep < wizardSteps.length - 1 ? (
                  <Button type="primary" onClick={() => handleStepChange(currentStep + 1)}>
                    下一步
                  </Button>
                ) : (
                  <Button type="primary" onClick={handleFinishConfig}>
                    完成配置
                  </Button>
                )}
              </Space>
            </div>
          </div>
        );
        
      case 'visual':
        return (
          <div className="visual-config">
            {/* 可视化配置界面 */}
            <div style={{ height: 600 }}>
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={(connection: Connection) => setEdges(eds => addEdge(connection, eds))}
                fitView
              >
                <Controls />
                <Background />
                <MiniMap />
              </ReactFlow>
            </div>
          </div>
        );
        
      case 'advanced':
        return (
          <div className="advanced-config">
            {/* 高级配置界面 */}
            <Tabs defaultActiveKey="capabilities">
              <TabPane tab="能力配置" key="capabilities">
                {renderCapabilityConfiguration()}
              </TabPane>
              <TabPane tab="编排设计" key="orchestration">
                {renderOrchestrationDesign()}
              </TabPane>
              <TabPane tab="性能优化" key="optimization">
                {renderOptimizationConfig()}
              </TabPane>
            </Tabs>
          </div>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <div className="intelligent-capability-config">
      {/* 头部工具栏 */}
      <div className="config-header">
        <div className="header-left">
          <Title level={3} style={{ margin: 0 }}>智能能力配置</Title>
          <Text type="secondary">为 {agent.name || '新Agent'} 配置核心能力</Text>
        </div>
        
        <div className="header-right">
          <Space>
            <Radio.Group 
              value={currentMode} 
              onChange={(e) => setCurrentMode(e.target.value)}
              
            >
              <Radio.Button value="wizard">向导模式</Radio.Button>
              <Radio.Button value="visual">可视化模式</Radio.Button>
              <Radio.Button value="advanced">高级模式</Radio.Button>
            </Radio.Group>
            
            <Button 
              icon={<RobotOutlined />}
              onClick={() => setAiAssistantVisible(!aiAssistantVisible)}
            >
              AI助手
            </Button>
            
            <Button 
              icon={<PlayCircleOutlined />}
              onClick={() => setPreviewVisible(true)}
            >
              预览测试
            </Button>
            
            {onClose && (
              <Button onClick={onClose}>
                关闭
              </Button>
            )}
          </Space>
        </div>
      </div>
      
      {/* 主要内容区域 */}
      <div className="config-content">
        {renderMainContent()}
      </div>
      
      {/* AI助手侧边栏 */}
      <Drawer
        title="AI智能助手"
        placement="right"
        width={400}
        open={aiAssistantVisible}
        onClose={() => setAiAssistantVisible(false)}
        className="ai-assistant-drawer"
      >
        <div className="ai-assistant-content">
          <Alert
            message="AI助手已就绪"
            description="我可以帮助您优化能力配置、推荐最佳实践、解答配置问题。"
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
          
          <div className="chat-interface">
            {/* 这里可以集成聊天界面 */}
            <div className="chat-messages">
              <div className="message ai-message">
                <Avatar icon={<RobotOutlined />}  />
                <div className="message-content">
                  <Text>您好！我是AI配置助手。基于您当前的配置，我建议添加情感分析能力来提升用户体验。</Text>
                </div>
              </div>
            </div>
            
            <div className="chat-input">
              <Input.Search
                placeholder="输入您的问题..."
                enterButton="发送"
                size="large"
              />
            </div>
          </div>
        </div>
      </Drawer>
      
      {/* 预览测试模态框 */}
      <Modal
        title="能力配置预览"
        open={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        width={800}
        footer={[
          <Button key="close" onClick={() => setPreviewVisible(false)}>
            关闭
          </Button>,
          <Button key="test" type="primary" icon={<PlayCircleOutlined />}>
            开始测试
          </Button>
        ]}
      >
        <div className="preview-content">
          <Tabs defaultActiveKey="flow">
            <TabPane tab="执行流程" key="flow">
              <div style={{ height: 300 }}>
                <ReactFlow
                  nodes={nodes}
                  edges={edges}
                  fitView
                  nodesDraggable={false}
                  nodesConnectable={false}
                  elementsSelectable={false}
                >
                  <Background />
                </ReactFlow>
              </div>
            </TabPane>
            
            <TabPane tab="配置摘要" key="summary">
              <div className="config-summary">
                <Row gutter={16}>
                  <Col span={12}>
                    <Statistic title="已配置能力" value={selectedCapabilities.length} suffix="个" />
                  </Col>
                  <Col span={12}>
                    <Statistic title="预估响应时间" value={120} suffix="ms" />
                  </Col>
                </Row>
                
                <Divider />
                
                <div className="capability-summary">
                  <Title level={5}>能力分布</Title>
                  <div className="capability-stats">
                    <div className="stat-item">
                      <BulbOutlined style={{ color: '#1890ff' }} />
                      <span>认知能力: {getCapabilityCount(CoreCapabilityType.COGNITIVE)}个</span>
                    </div>
                    <div className="stat-item">
                      <ThunderboltOutlined style={{ color: '#52c41a' }} />
                      <span>推理能力: {getCapabilityCount(CoreCapabilityType.REASONING)}个</span>
                    </div>
                    <div className="stat-item">
                      <ApartmentOutlined style={{ color: '#fa8c16' }} />
                      <span>决策能力: {getCapabilityCount(CoreCapabilityType.DECISION)}个</span>
                    </div>
                    <div className="stat-item">
                      <BookOutlined style={{ color: '#eb2f96' }} />
                      <span>学习能力: {getCapabilityCount(CoreCapabilityType.LEARNING)}个</span>
                    </div>
                  </div>
                </div>
              </div>
            </TabPane>
            
            <TabPane tab="测试结果" key="test">
              <div className="test-results">
                <Timeline>
                  <Timeline.Item color="green">
                    <Text strong>配置验证</Text>
                    <br />
                    <Text type="secondary">所有能力配置验证通过</Text>
                  </Timeline.Item>
                  <Timeline.Item color="blue">
                    <Text strong>依赖检查</Text>
                    <br />
                    <Text type="secondary">能力依赖关系正常</Text>
                  </Timeline.Item>
                  <Timeline.Item color="orange">
                    <Text strong>性能评估</Text>
                    <br />
                    <Text type="secondary">预估性能良好，建议启用缓存</Text>
                  </Timeline.Item>
                </Timeline>
              </div>
            </TabPane>
          </Tabs>
        </div>
      </Modal>
    </div>
  );
};

export default IntelligentCapabilityConfig;