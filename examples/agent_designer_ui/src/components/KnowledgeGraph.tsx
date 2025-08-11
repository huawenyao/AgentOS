import React, { useState, useEffect } from 'react';
import {
  Card, Row, Col, Input, Button, Select, Table, Tag, Space,
  Modal, Form, message, Tooltip, Divider, Typography,
  Tabs, Statistic, Progress
} from 'antd';
import {
  SearchOutlined, PlusOutlined, EditOutlined, DeleteOutlined,
  NodeIndexOutlined, ShareAltOutlined, DatabaseOutlined,
  BranchesOutlined, TeamOutlined, BookOutlined,
  BarChartOutlined, LinkOutlined, ClusterOutlined
} from '@ant-design/icons';
import './KnowledgeGraph.css';

const { Search } = Input;
const { Option } = Select;
const { Title, Text } = Typography;
const { TabPane } = Tabs;

/**
 * 知识节点接口
 */
interface KnowledgeNode {
  id: string;
  name: string;
  type: 'concept' | 'entity' | 'relation' | 'attribute';
  description: string;
  properties: Record<string, any>;
  connections: string[];
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  confidence: number;
}

/**
 * 知识关系接口
 */
interface KnowledgeRelation {
  id: string;
  source: string;
  target: string;
  type: string;
  weight: number;
  properties: Record<string, any>;
  createdAt: Date;
}

/**
 * 知识图谱组件
 */
const KnowledgeGraph: React.FC = () => {
  const [nodes, setNodes] = useState<KnowledgeNode[]>([]);
  const [relations, setRelations] = useState<KnowledgeRelation[]>([]);
  const [selectedNode, setSelectedNode] = useState<KnowledgeNode | null>(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingNode, setEditingNode] = useState<KnowledgeNode | null>(null);
  const [form] = Form.useForm();

  /**
   * 初始化模拟数据
   */
  useEffect(() => {
    initializeMockData();
  }, []);

  /**
   * 初始化模拟知识图谱数据
   */
  const initializeMockData = () => {
    const mockNodes: KnowledgeNode[] = [
      {
        id: 'node_1',
        name: 'Agent架构',
        type: 'concept',
        description: 'AI Agent的整体架构设计概念',
        properties: { domain: 'AI', complexity: 'high', category: 'architecture' },
        connections: ['node_2', 'node_3', 'node_8'],
        createdAt: new Date('2024-01-15T10:00:00Z'),
        updatedAt: new Date('2024-01-20T14:30:00Z'),
        tags: ['架构', 'AI', '设计'],
        confidence: 0.95
      },
      {
        id: 'node_2',
        name: '能力模块',
        type: 'entity',
        description: 'Agent的核心能力组件',
        properties: { reusable: true, category: 'core', version: '1.0.0' },
        connections: ['node_1', 'node_4', 'node_9'],
        createdAt: new Date('2024-01-16T09:15:00Z'),
        updatedAt: new Date('2024-01-21T16:45:00Z'),
        tags: ['能力', '模块', '组件'],
        confidence: 0.92
      },
      {
        id: 'node_3',
        name: '工作流引擎',
        type: 'entity',
        description: 'Agent工作流的执行引擎',
        properties: { performance: 'high', scalable: true, status: 'active' },
        connections: ['node_1', 'node_5', 'node_10'],
        createdAt: new Date('2024-01-17T11:20:00Z'),
        updatedAt: new Date('2024-01-22T13:10:00Z'),
        tags: ['工作流', '引擎', '执行'],
        confidence: 0.88
      },
      {
        id: 'node_4',
        name: 'NLP处理',
        type: 'attribute',
        description: '自然语言处理能力',
        properties: { language: 'multi', accuracy: 0.94 },
        connections: ['node_2'],
        createdAt: new Date('2024-01-18'),
        updatedAt: new Date('2024-01-23'),
        tags: ['NLP', '语言', '处理'],
        confidence: 0.90
      },
      {
        id: 'node_5',
        name: '任务调度',
        type: 'relation',
        description: '工作流中的任务调度机制',
        properties: { strategy: 'priority', concurrent: true },
        connections: ['node_3'],
        createdAt: new Date('2024-01-19'),
        updatedAt: new Date('2024-01-24'),
        tags: ['调度', '任务', '并发'],
        confidence: 0.87
      },
      {
        id: 'node_6',
        name: '数据存储',
        type: 'entity',
        description: 'Agent数据持久化存储',
        properties: { storage_type: 'database', capacity: '1TB', backup: true },
        connections: ['node_4', 'node_13'],
        createdAt: new Date('2024-01-20T14:15:00Z'),
        updatedAt: new Date('2024-01-25T11:40:00Z'),
        tags: ['存储', '数据库', '持久化'],
        confidence: 0.93
      },
      {
        id: 'node_7',
        name: '消息通信',
        type: 'entity',
        description: 'Agent间消息通信机制',
        properties: { protocol: 'websocket', encryption: true, qos: 'high' },
        connections: ['node_5', 'node_14'],
        createdAt: new Date('2024-01-21T16:00:00Z'),
        updatedAt: new Date('2024-01-26T13:25:00Z'),
        tags: ['通信', '消息', '协议'],
        confidence: 0.87
      },
      {
        id: 'node_8',
        name: '安全认证',
        type: 'attribute',
        description: 'Agent安全认证和授权',
        properties: { auth_type: 'oauth2', encryption: 'AES256', session_timeout: 3600 },
        connections: ['node_1', 'node_15'],
        createdAt: new Date('2024-01-22T10:30:00Z'),
        updatedAt: new Date('2024-01-27T14:50:00Z'),
        tags: ['安全', '认证', '授权'],
        confidence: 0.96
      },
      {
        id: 'node_9',
        name: '监控告警',
        type: 'entity',
        description: 'Agent运行状态监控和告警',
        properties: { monitor_interval: 30, alert_threshold: 0.8, notification: true },
        connections: ['node_2', 'node_16'],
        createdAt: new Date('2024-01-23T09:45:00Z'),
        updatedAt: new Date('2024-01-28T16:15:00Z'),
        tags: ['监控', '告警', '运维'],
        confidence: 0.89
      },
      {
        id: 'node_10',
        name: '配置管理',
        type: 'entity',
        description: 'Agent配置参数管理',
        properties: { config_format: 'json', versioning: true, hot_reload: true },
        connections: ['node_3', 'node_17'],
        createdAt: new Date('2024-01-24T11:20:00Z'),
        updatedAt: new Date('2024-01-29T12:35:00Z'),
        tags: ['配置', '管理', '参数'],
        confidence: 0.91
      },
      {
        id: 'node_11',
        name: '机器学习',
        type: 'concept',
        description: 'Agent的机器学习能力',
        properties: { model_type: 'neural_network', training_data: 'large', accuracy: 0.94 },
        connections: ['node_4', 'node_18'],
        createdAt: new Date('2024-01-25T13:10:00Z'),
        updatedAt: new Date('2024-01-30T10:20:00Z'),
        tags: ['机器学习', 'AI', '模型'],
        confidence: 0.88
      },
      {
        id: 'node_12',
        name: '负载均衡',
        type: 'entity',
        description: '任务负载均衡分配',
        properties: { algorithm: 'round_robin', health_check: true, failover: true },
        connections: ['node_5', 'node_19'],
        createdAt: new Date('2024-01-26T15:30:00Z'),
        updatedAt: new Date('2024-01-31T14:45:00Z'),
        tags: ['负载均衡', '分配', '高可用'],
        confidence: 0.92
      },
      {
        id: 'node_13',
        name: '缓存系统',
        type: 'entity',
        description: '高性能数据缓存',
        properties: { cache_type: 'redis', ttl: 3600, hit_rate: 0.85 },
        connections: ['node_6', 'node_20'],
        createdAt: new Date('2024-01-27T08:15:00Z'),
        updatedAt: new Date('2024-02-01T11:30:00Z'),
        tags: ['缓存', '性能', '存储'],
        confidence: 0.86
      },
      {
        id: 'node_14',
        name: '事件驱动',
        type: 'concept',
        description: '基于事件的异步处理机制',
        properties: { event_bus: 'kafka', async: true, reliability: 'high' },
        connections: ['node_7'],
        createdAt: new Date('2024-01-28T12:40:00Z'),
        updatedAt: new Date('2024-02-02T09:55:00Z'),
        tags: ['事件', '异步', '驱动'],
        confidence: 0.84
      },
      {
        id: 'node_15',
        name: '权限控制',
        type: 'attribute',
        description: '细粒度权限控制系统',
        properties: { rbac: true, acl: true, audit_log: true },
        connections: ['node_8'],
        createdAt: new Date('2024-01-29T14:25:00Z'),
        updatedAt: new Date('2024-02-03T16:10:00Z'),
        tags: ['权限', '控制', 'RBAC'],
        confidence: 0.95
      },
      {
        id: 'node_16',
        name: '性能指标',
        type: 'attribute',
        description: 'Agent性能监控指标',
        properties: { metrics: ['cpu', 'memory', 'latency'], collection_interval: 10 },
        connections: ['node_9'],
        createdAt: new Date('2024-01-30T10:50:00Z'),
        updatedAt: new Date('2024-02-04T13:20:00Z'),
        tags: ['性能', '指标', '监控'],
        confidence: 0.90
      },
      {
        id: 'node_17',
        name: '版本控制',
        type: 'entity',
        description: 'Agent配置版本管理',
        properties: { vcs: 'git', branching: true, rollback: true },
        connections: ['node_10'],
        createdAt: new Date('2024-01-31T16:35:00Z'),
        updatedAt: new Date('2024-02-05T12:45:00Z'),
        tags: ['版本', '控制', '管理'],
        confidence: 0.93
      },
      {
        id: 'node_18',
        name: '模型训练',
        type: 'entity',
        description: '机器学习模型训练流程',
        properties: { framework: 'pytorch', gpu_support: true, distributed: true },
        connections: ['node_11'],
        createdAt: new Date('2024-02-01T09:20:00Z'),
        updatedAt: new Date('2024-02-06T15:30:00Z'),
        tags: ['训练', '模型', '深度学习'],
        confidence: 0.87
      },
      {
        id: 'node_19',
        name: '服务发现',
        type: 'entity',
        description: 'Agent服务自动发现机制',
        properties: { discovery_type: 'consul', health_check: true, auto_register: true },
        connections: ['node_12'],
        createdAt: new Date('2024-02-02T11:45:00Z'),
        updatedAt: new Date('2024-02-07T14:15:00Z'),
        tags: ['服务发现', '注册', '微服务'],
        confidence: 0.89
      },
      {
        id: 'node_20',
        name: '数据同步',
        type: 'entity',
        description: '多节点数据同步机制',
        properties: { sync_type: 'eventual_consistency', conflict_resolution: 'timestamp' },
        connections: ['node_13'],
        createdAt: new Date('2024-02-03T13:30:00Z'),
        updatedAt: new Date('2024-02-08T10:40:00Z'),
        tags: ['同步', '一致性', '分布式'],
        confidence: 0.85
      }
    ];

    const mockRelations: KnowledgeRelation[] = [
      {
        id: 'rel_1',
        source: 'node_1',
        target: 'node_2',
        type: 'contains',
        weight: 0.8,
        properties: { relationship_type: 'composition', strength: 'strong' },
        createdAt: new Date('2024-01-20T10:00:00Z')
      },
      {
        id: 'rel_2',
        source: 'node_1',
        target: 'node_3',
        type: 'uses',
        weight: 0.9,
        properties: { relationship_type: 'dependency', critical: true },
        createdAt: new Date('2024-01-21T11:30:00Z')
      },
      {
        id: 'rel_3',
        source: 'node_2',
        target: 'node_4',
        type: 'implements',
        weight: 0.7,
        properties: { relationship_type: 'implementation', version: '1.0' },
        createdAt: new Date('2024-01-22T14:15:00Z')
      },
      {
        id: 'rel_4',
        source: 'node_3',
        target: 'node_5',
        type: 'manages',
        weight: 0.85,
        properties: { relationship_type: 'control', priority: 'high' },
        createdAt: new Date('2024-01-23T09:20:00Z')
      },
      {
        id: 'rel_5',
        source: 'node_4',
        target: 'node_6',
        type: 'stores_in',
        weight: 0.75,
        properties: { relationship_type: 'data_flow', persistence: true },
        createdAt: new Date('2024-01-24T16:45:00Z')
      },
      {
        id: 'rel_6',
        source: 'node_5',
        target: 'node_7',
        type: 'communicates_via',
        weight: 0.82,
        properties: { relationship_type: 'communication', protocol: 'async' },
        createdAt: new Date('2024-01-25T12:30:00Z')
      },
      {
        id: 'rel_7',
        source: 'node_1',
        target: 'node_8',
        type: 'secured_by',
        weight: 0.95,
        properties: { relationship_type: 'security', level: 'enterprise' },
        createdAt: new Date('2024-01-26T08:15:00Z')
      },
      {
        id: 'rel_8',
        source: 'node_2',
        target: 'node_9',
        type: 'monitored_by',
        weight: 0.88,
        properties: { relationship_type: 'monitoring', real_time: true },
        createdAt: new Date('2024-01-27T13:40:00Z')
      },
      {
        id: 'rel_9',
        source: 'node_3',
        target: 'node_10',
        type: 'configured_by',
        weight: 0.91,
        properties: { relationship_type: 'configuration', dynamic: true },
        createdAt: new Date('2024-01-28T15:25:00Z')
      },
      {
        id: 'rel_10',
        source: 'node_4',
        target: 'node_11',
        type: 'enhanced_by',
        weight: 0.86,
        properties: { relationship_type: 'enhancement', ai_powered: true },
        createdAt: new Date('2024-01-29T10:50:00Z')
      },
      {
        id: 'rel_11',
        source: 'node_5',
        target: 'node_12',
        type: 'balanced_by',
        weight: 0.89,
        properties: { relationship_type: 'load_balancing', algorithm: 'weighted' },
        createdAt: new Date('2024-01-30T14:35:00Z')
      },
      {
        id: 'rel_12',
        source: 'node_6',
        target: 'node_13',
        type: 'cached_by',
        weight: 0.83,
        properties: { relationship_type: 'caching', strategy: 'write_through' },
        createdAt: new Date('2024-01-31T11:20:00Z')
      },
      {
        id: 'rel_13',
        source: 'node_7',
        target: 'node_14',
        type: 'driven_by',
        weight: 0.84,
        properties: { relationship_type: 'event_driven', async: true },
        createdAt: new Date('2024-02-01T16:10:00Z')
      },
      {
        id: 'rel_14',
        source: 'node_8',
        target: 'node_15',
        type: 'controlled_by',
        weight: 0.93,
        properties: { relationship_type: 'access_control', granular: true },
        createdAt: new Date('2024-02-02T09:45:00Z')
      },
      {
        id: 'rel_15',
        source: 'node_9',
        target: 'node_16',
        type: 'measures',
        weight: 0.87,
        properties: { relationship_type: 'measurement', frequency: 'continuous' },
        createdAt: new Date('2024-02-03T13:55:00Z')
      },
      {
        id: 'rel_16',
        source: 'node_10',
        target: 'node_17',
        type: 'versioned_by',
        weight: 0.92,
        properties: { relationship_type: 'versioning', branching: true },
        createdAt: new Date('2024-02-04T12:30:00Z')
      },
      {
        id: 'rel_17',
        source: 'node_11',
        target: 'node_18',
        type: 'trained_by',
        weight: 0.85,
        properties: { relationship_type: 'training', distributed: true },
        createdAt: new Date('2024-02-05T15:15:00Z')
      },
      {
        id: 'rel_18',
        source: 'node_12',
        target: 'node_19',
        type: 'discovered_by',
        weight: 0.88,
        properties: { relationship_type: 'service_discovery', auto: true },
        createdAt: new Date('2024-02-06T10:40:00Z')
      },
      {
        id: 'rel_19',
        source: 'node_13',
        target: 'node_20',
        type: 'synchronized_with',
        weight: 0.81,
        properties: { relationship_type: 'synchronization', consistency: 'eventual' },
        createdAt: new Date('2024-02-07T14:25:00Z')
      },
      {
        id: 'rel_20',
        source: 'node_2',
        target: 'node_11',
        type: 'integrates',
        weight: 0.79,
        properties: { relationship_type: 'integration', seamless: true },
        createdAt: new Date('2024-02-08T11:50:00Z')
      }
    ];

    setNodes(mockNodes);
    setRelations(mockRelations);
  };

  /**
   * 过滤节点数据
   */
  const filteredNodes = nodes.filter(node => {
    const matchesSearch = node.name.toLowerCase().includes(searchKeyword.toLowerCase()) ||
                         node.description.toLowerCase().includes(searchKeyword.toLowerCase());
    const matchesType = filterType === 'all' || node.type === filterType;
    return matchesSearch && matchesType;
  });

  /**
   * 处理节点创建/编辑
   */
  const handleNodeSubmit = async (values: any) => {
    try {
      if (editingNode) {
        // 编辑现有节点
        const updatedNodes = nodes.map(node => 
          node.id === editingNode.id 
            ? { ...node, ...values, updatedAt: new Date() }
            : node
        );
        setNodes(updatedNodes);
        message.success('知识节点更新成功');
      } else {
        // 创建新节点
        const newNode: KnowledgeNode = {
          id: `node_${Date.now()}`,
          ...values,
          connections: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          confidence: 1.0
        };
        setNodes([...nodes, newNode]);
        message.success('知识节点创建成功');
      }
      
      setIsModalVisible(false);
      setEditingNode(null);
      form.resetFields();
    } catch (error) {
      message.error('操作失败，请重试');
    }
  };

  /**
   * 删除节点
   */
  const handleDeleteNode = (nodeId: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个知识节点吗？此操作不可撤销。',
      onOk: () => {
        setNodes(nodes.filter(node => node.id !== nodeId));
        setRelations(relations.filter(rel => rel.source !== nodeId && rel.target !== nodeId));
        message.success('知识节点删除成功');
      }
    });
  };

  /**
   * 渲染节点类型标签
   */
  const renderNodeTypeTag = (type: string) => {
    const typeConfig = {
      concept: { color: 'blue', text: '概念' },
      entity: { color: 'green', text: '实体' },
      relation: { color: 'orange', text: '关系' },
      attribute: { color: 'purple', text: '属性' }
    };
    
    const config = typeConfig[type as keyof typeof typeConfig] || { color: 'default', text: type };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  /**
   * 渲染知识图谱可视化
   */
  const renderGraphVisualization = () => {
    // 计算统计信息
    const nodeTypeStats = nodes.reduce((acc, node) => {
      acc[node.type] = (acc[node.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const relationTypeStats = relations.reduce((acc, relation) => {
      acc[relation.type] = (acc[relation.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const avgConfidence = nodes.reduce((sum, node) => sum + node.confidence, 0) / nodes.length;
    const avgWeight = relations.reduce((sum, relation) => sum + relation.weight, 0) / relations.length;

    return (
      <Card title="知识图谱可视化" className="graph-visualization">
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col span={6}>
            <Statistic
              title="节点总数"
              value={nodes.length}
              prefix={<NodeIndexOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="关系总数"
              value={relations.length}
              prefix={<ShareAltOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="平均置信度"
              value={avgConfidence}
              precision={2}
              suffix="%"
              prefix={<BarChartOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="平均权重"
              value={avgWeight}
              precision={2}
              prefix={<LinkOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Col>
        </Row>
        
        <div style={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5', border: '1px dashed #d9d9d9', borderRadius: 6 }}>
          <div style={{ textAlign: 'center' }}>
            <ClusterOutlined style={{ fontSize: 48, color: '#1890ff', marginBottom: 16 }} />
            <div>
              <Text strong style={{ fontSize: 16, display: 'block', marginBottom: 8 }}>知识图谱可视化</Text>
              <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>节点类型分布：</Text>
              <div style={{ marginBottom: 8 }}>
                {Object.entries(nodeTypeStats).map(([type, count]) => (
                  <Tag key={type} color={type === 'concept' ? 'blue' : type === 'entity' ? 'green' : type === 'attribute' ? 'orange' : 'purple'}>
                    {type}: {count}
                  </Tag>
                ))}
              </div>
              <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>关系类型分布：</Text>
              <div>
                {Object.entries(relationTypeStats).slice(0, 5).map(([type, count]) => (
                  <Tag key={type} color="cyan">
                    {type}: {count}
                  </Tag>
                ))}
                {Object.keys(relationTypeStats).length > 5 && (
                  <Tag color="default">+{Object.keys(relationTypeStats).length - 5} 更多</Tag>
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>
    );
  };

  /**
   * 渲染统计信息
   */
  const renderStatistics = () => {
    const typeStats = nodes.reduce((acc, node) => {
      acc[node.type] = (acc[node.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return (
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="总节点数"
              value={nodes.length}
              prefix={<NodeIndexOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="关系数"
              value={relations.length}
              prefix={<ShareAltOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="概念节点"
              value={typeStats.concept || 0}
              prefix={<BookOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="实体节点"
              value={typeStats.entity || 0}
              prefix={<DatabaseOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>
    );
  };

  /**
   * 渲染节点列表
   */
  const renderNodeList = () => {
    const columns = [
      {
        title: '节点名称',
        dataIndex: 'name',
        key: 'name',
        render: (text: string, record: KnowledgeNode) => (
          <Space>
            <Text strong>{text}</Text>
            {renderNodeTypeTag(record.type)}
          </Space>
        )
      },
      {
        title: '描述',
        dataIndex: 'description',
        key: 'description',
        ellipsis: true
      },
      {
        title: '标签',
        dataIndex: 'tags',
        key: 'tags',
        render: (tags: string[]) => (
          <Space wrap>
            {tags.map(tag => <Tag key={tag} size="small">{tag}</Tag>)}
          </Space>
        )
      },
      {
        title: '置信度',
        dataIndex: 'confidence',
        key: 'confidence',
        render: (confidence: number) => (
          <Progress 
            percent={Math.round(confidence * 100)} 
            size="small" 
            status={confidence > 0.8 ? 'success' : confidence > 0.6 ? 'normal' : 'exception'}
          />
        )
      },
      {
        title: '连接数',
        dataIndex: 'connections',
        key: 'connections',
        render: (connections: string[]) => connections.length
      },
      {
        title: '操作',
        key: 'actions',
        render: (_, record: KnowledgeNode) => (
          <Space>
            <Tooltip title="编辑">
              <Button 
                type="text" 
                icon={<EditOutlined />} 
                onClick={() => {
                  setEditingNode(record);
                  form.setFieldsValue(record);
                  setIsModalVisible(true);
                }}
              />
            </Tooltip>
            <Tooltip title="删除">
              <Button 
                type="text" 
                danger 
                icon={<DeleteOutlined />} 
                onClick={() => handleDeleteNode(record.id)}
              />
            </Tooltip>
          </Space>
        )
      }
    ];

    return (
      <Table
        columns={columns}
        dataSource={filteredNodes}
        rowKey="id"
        pagination={{ pageSize: 10 }}
        onRow={(record) => ({
          onClick: () => setSelectedNode(record)
        })}
      />
    );
  };

  return (
    <div className="knowledge-graph">
      <Title level={2}>
        <DatabaseOutlined /> 知识图谱
      </Title>
      
      {/* 统计信息 */}
      {renderStatistics()}
      
      <Tabs defaultActiveKey="graph">
        <TabPane tab="图谱视图" key="graph">
          <Row gutter={16}>
            <Col span={16}>
              {renderGraphVisualization()}
            </Col>
            <Col span={8}>
              <Card title="节点详情" size="small">
                {selectedNode ? (
                  <div>
                    <Title level={4}>{selectedNode.name}</Title>
                    {renderNodeTypeTag(selectedNode.type)}
                    <Divider />
                    <Text>{selectedNode.description}</Text>
                    <Divider />
                    <div>
                      <Text strong>标签：</Text>
                      <Space wrap style={{ marginTop: 8 }}>
                        {selectedNode.tags.map(tag => <Tag key={tag}>{tag}</Tag>)}
                      </Space>
                    </div>
                    <Divider />
                    <div>
                      <Text strong>置信度：</Text>
                      <Progress 
                        percent={Math.round(selectedNode.confidence * 100)} 
                        size="small" 
                        style={{ marginTop: 8 }}
                      />
                    </div>
                  </div>
                ) : (
                  <Text type="secondary">点击节点查看详情</Text>
                )}
              </Card>
            </Col>
          </Row>
        </TabPane>
        
        <TabPane tab="节点管理" key="nodes">
          <Card>
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={8}>
                <Search
                  placeholder="搜索知识节点"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  prefix={<SearchOutlined />}
                />
              </Col>
              <Col span={6}>
                <Select
                  value={filterType}
                  onChange={setFilterType}
                  style={{ width: '100%' }}
                  placeholder="节点类型"
                >
                  <Option value="all">全部类型</Option>
                  <Option value="concept">概念</Option>
                  <Option value="entity">实体</Option>
                  <Option value="relation">关系</Option>
                  <Option value="attribute">属性</Option>
                </Select>
              </Col>
              <Col span={4}>
                <Button 
                  type="primary" 
                  icon={<PlusOutlined />}
                  onClick={() => {
                    setEditingNode(null);
                    form.resetFields();
                    setIsModalVisible(true);
                  }}
                >
                  新建节点
                </Button>
              </Col>
            </Row>
            
            {renderNodeList()}
          </Card>
        </TabPane>
      </Tabs>
      
      {/* 节点编辑模态框 */}
      <Modal
        title={editingNode ? '编辑知识节点' : '新建知识节点'}
        visible={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          setEditingNode(null);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleNodeSubmit}
        >
          <Form.Item
            name="name"
            label="节点名称"
            rules={[{ required: true, message: '请输入节点名称' }]}
          >
            <Input placeholder="输入知识节点名称" />
          </Form.Item>
          
          <Form.Item
            name="type"
            label="节点类型"
            rules={[{ required: true, message: '请选择节点类型' }]}
          >
            <Select placeholder="选择节点类型">
              <Option value="concept">概念</Option>
              <Option value="entity">实体</Option>
              <Option value="relation">关系</Option>
              <Option value="attribute">属性</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="description"
            label="描述"
            rules={[{ required: true, message: '请输入节点描述' }]}
          >
            <Input.TextArea rows={3} placeholder="输入节点描述" />
          </Form.Item>
          
          <Form.Item
            name="tags"
            label="标签"
          >
            <Select
              mode="tags"
              placeholder="输入标签，按回车添加"
              style={{ width: '100%' }}
            />
          </Form.Item>
          
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingNode ? '更新' : '创建'}
              </Button>
              <Button onClick={() => {
                setIsModalVisible(false);
                setEditingNode(null);
                form.resetFields();
              }}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default KnowledgeGraph;