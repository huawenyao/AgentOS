import React, { useState, useEffect } from 'react';
import {
  Card, Row, Col, Input, Button, Select, Table, Tag, Space,
  Modal, Form, message, Tooltip, Divider, Typography,
  Progress, Timeline, Tabs, Statistic, List, Avatar,
  Rate, Badge, Collapse, Steps, Alert
} from 'antd';
import {
  SearchOutlined, PlusOutlined, EditOutlined, DeleteOutlined,
  BookOutlined, PlayCircleOutlined, TrophyOutlined,
  ClockCircleOutlined, UserOutlined, StarOutlined,
  FileTextOutlined, VideoCameraOutlined, AudioOutlined,
  DownloadOutlined, ShareAltOutlined, HeartOutlined,
  CheckCircleOutlined, ExclamationCircleOutlined
} from '@ant-design/icons';
import './LearningCenter.css';

const { Search } = Input;
const { Option } = Select;
const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { Panel } = Collapse;
const { Step } = Steps;

/**
 * 学习资源接口
 */
interface LearningResource {
  id: string;
  title: string;
  description: string;
  type: 'video' | 'document' | 'audio' | 'interactive';
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number; // 分钟
  rating: number;
  enrollments: number;
  author: string;
  authorAvatar: string;
  thumbnail: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  isCompleted: boolean;
  progress: number;
  isFavorite: boolean;
}

/**
 * 学习路径接口
 */
interface LearningPath {
  id: string;
  name: string;
  description: string;
  resources: string[];
  estimatedTime: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  completionRate: number;
  enrollments: number;
  rating: number;
  createdAt: Date;
}

/**
 * 学习进度接口
 */
interface LearningProgress {
  resourceId: string;
  progress: number;
  completedAt?: Date;
  timeSpent: number;
  notes: string;
}

/**
 * 学习中心组件
 */
const LearningCenter: React.FC = () => {
  const [resources, setResources] = useState<LearningResource[]>([]);
  const [learningPaths, setLearningPaths] = useState<LearningPath[]>([]);
  const [progress, setProgress] = useState<LearningProgress[]>([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedResource, setSelectedResource] = useState<LearningResource | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();

  /**
   * 初始化模拟数据
   */
  useEffect(() => {
    initializeMockData();
  }, []);

  /**
   * 初始化模拟学习数据
   */
  const initializeMockData = () => {
    const mockResources: LearningResource[] = [
      {
        id: 'resource_1',
        title: 'Agent架构设计基础',
        description: '学习如何设计和构建AI Agent的基础架构，包括核心组件和设计模式。',
        type: 'video',
        category: 'AI架构',
        difficulty: 'beginner',
        duration: 45,
        rating: 4.8,
        enrollments: 1250,
        author: '张教授',
        authorAvatar: '/avatars/zhang.jpg',
        thumbnail: '/thumbnails/agent-architecture.jpg',
        tags: ['架构', 'AI', '基础'],
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-20'),
        isCompleted: true,
        progress: 100,
        isFavorite: true
      },
      {
        id: 'resource_2',
        title: '工作流引擎开发指南',
        description: '深入了解工作流引擎的设计原理和实现方法，包括任务调度和状态管理。',
        type: 'document',
        category: '工作流',
        difficulty: 'intermediate',
        duration: 90,
        rating: 4.6,
        enrollments: 890,
        author: '李工程师',
        authorAvatar: '/avatars/li.jpg',
        thumbnail: '/thumbnails/workflow-engine.jpg',
        tags: ['工作流', '引擎', '开发'],
        createdAt: new Date('2024-01-16'),
        updatedAt: new Date('2024-01-21'),
        isCompleted: false,
        progress: 65,
        isFavorite: false
      },
      {
        id: 'resource_3',
        title: 'NLP能力模块实战',
        description: '通过实际案例学习如何构建和集成自然语言处理能力模块。',
        type: 'interactive',
        category: 'NLP',
        difficulty: 'advanced',
        duration: 120,
        rating: 4.9,
        enrollments: 567,
        author: '王博士',
        authorAvatar: '/avatars/wang.jpg',
        thumbnail: '/thumbnails/nlp-module.jpg',
        tags: ['NLP', '实战', '模块'],
        createdAt: new Date('2024-01-17'),
        updatedAt: new Date('2024-01-22'),
        isCompleted: false,
        progress: 30,
        isFavorite: true
      },
      {
        id: 'resource_4',
        title: 'Agent测试与调试',
        description: '学习Agent系统的测试策略和调试技巧，确保系统稳定性和可靠性。',
        type: 'audio',
        category: '测试',
        difficulty: 'intermediate',
        duration: 60,
        rating: 4.5,
        enrollments: 723,
        author: '陈专家',
        authorAvatar: '/avatars/chen.jpg',
        thumbnail: '/thumbnails/testing-debugging.jpg',
        tags: ['测试', '调试', '质量'],
        createdAt: new Date('2024-01-18'),
        updatedAt: new Date('2024-01-23'),
        isCompleted: false,
        progress: 0,
        isFavorite: false
      }
    ];

    const mockPaths: LearningPath[] = [
      {
        id: 'path_1',
        name: 'AI Agent开发入门',
        description: '从零开始学习AI Agent开发的完整路径',
        resources: ['resource_1', 'resource_2'],
        estimatedTime: 135,
        difficulty: 'beginner',
        completionRate: 82,
        enrollments: 456,
        rating: 4.7,
        createdAt: new Date('2024-01-10')
      },
      {
        id: 'path_2',
        name: 'Agent高级开发技术',
        description: '深入学习Agent的高级开发技术和最佳实践',
        resources: ['resource_3', 'resource_4'],
        estimatedTime: 180,
        difficulty: 'advanced',
        completionRate: 45,
        enrollments: 234,
        rating: 4.8,
        createdAt: new Date('2024-01-12')
      }
    ];

    setResources(mockResources);
    setLearningPaths(mockPaths);
  };

  /**
   * 过滤资源数据
   */
  const filteredResources = resources.filter(resource => {
    const matchesSearch = resource.title.toLowerCase().includes(searchKeyword.toLowerCase()) ||
                         resource.description.toLowerCase().includes(searchKeyword.toLowerCase());
    const matchesCategory = filterCategory === 'all' || resource.category === filterCategory;
    const matchesDifficulty = filterDifficulty === 'all' || resource.difficulty === filterDifficulty;
    const matchesType = filterType === 'all' || resource.type === filterType;
    return matchesSearch && matchesCategory && matchesDifficulty && matchesType;
  });

  /**
   * 获取资源类型图标
   */
  const getResourceTypeIcon = (type: string) => {
    const iconMap = {
      video: <VideoCameraOutlined />,
      document: <FileTextOutlined />,
      audio: <AudioOutlined />,
      interactive: <PlayCircleOutlined />
    };
    return iconMap[type as keyof typeof iconMap] || <FileTextOutlined />;
  };

  /**
   * 获取难度标签颜色
   */
  const getDifficultyColor = (difficulty: string) => {
    const colorMap = {
      beginner: 'green',
      intermediate: 'orange',
      advanced: 'red'
    };
    return colorMap[difficulty as keyof typeof colorMap] || 'default';
  };

  /**
   * 获取难度文本
   */
  const getDifficultyText = (difficulty: string) => {
    const textMap = {
      beginner: '初级',
      intermediate: '中级',
      advanced: '高级'
    };
    return textMap[difficulty as keyof typeof textMap] || difficulty;
  };

  /**
   * 处理收藏/取消收藏
   */
  const handleToggleFavorite = (resourceId: string) => {
    setResources(resources.map(resource => 
      resource.id === resourceId 
        ? { ...resource, isFavorite: !resource.isFavorite }
        : resource
    ));
    message.success('操作成功');
  };

  /**
   * 开始学习资源
   */
  const handleStartLearning = (resource: LearningResource) => {
    setSelectedResource(resource);
    setIsModalVisible(true);
  };

  /**
   * 渲染统计信息
   */
  const renderStatistics = () => {
    const completedCount = resources.filter(r => r.isCompleted).length;
    const inProgressCount = resources.filter(r => r.progress > 0 && !r.isCompleted).length;
    const favoriteCount = resources.filter(r => r.isFavorite).length;
    const totalTime = resources.reduce((sum, r) => sum + (r.duration * r.progress / 100), 0);

    return (
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="已完成课程"
              value={completedCount}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="学习中课程"
              value={inProgressCount}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="收藏课程"
              value={favoriteCount}
              prefix={<HeartOutlined />}
              valueStyle={{ color: '#eb2f96' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="学习时长"
              value={Math.round(totalTime)}
              suffix="分钟"
              prefix={<TrophyOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>
    );
  };

  /**
   * 渲染资源卡片
   */
  const renderResourceCard = (resource: LearningResource) => {
    return (
      <Card
        key={resource.id}
        hoverable
        className="resource-card"
        cover={
          <div className="resource-cover">
            <div className="resource-type-icon">
              {getResourceTypeIcon(resource.type)}
            </div>
            <div className="resource-duration">
              <ClockCircleOutlined /> {resource.duration}分钟
            </div>
          </div>
        }
        actions={[
          <Tooltip title={resource.isFavorite ? '取消收藏' : '收藏'}>
            <HeartOutlined 
              style={{ color: resource.isFavorite ? '#eb2f96' : undefined }}
              onClick={() => handleToggleFavorite(resource.id)}
            />
          </Tooltip>,
          <Tooltip title="开始学习">
            <PlayCircleOutlined onClick={() => handleStartLearning(resource)} />
          </Tooltip>,
          <Tooltip title="分享">
            <ShareAltOutlined />
          </Tooltip>
        ]}
      >
        <Card.Meta
          title={
            <div>
              <Text strong ellipsis>{resource.title}</Text>
              <div style={{ marginTop: 8 }}>
                <Tag color={getDifficultyColor(resource.difficulty)}>
                  {getDifficultyText(resource.difficulty)}
                </Tag>
                <Tag>{resource.category}</Tag>
              </div>
            </div>
          }
          description={
            <div>
              <Paragraph ellipsis={{ rows: 2 }}>{resource.description}</Paragraph>
              <div style={{ marginTop: 12 }}>
                <Space>
                  <Avatar size="small" src={resource.authorAvatar} icon={<UserOutlined />} />
                  <Text type="secondary">{resource.author}</Text>
                </Space>
                <div style={{ marginTop: 8 }}>
                  <Space>
                    <Rate disabled defaultValue={resource.rating} allowHalf style={{ fontSize: 12 }} />
                    <Text type="secondary">({resource.enrollments})</Text>
                  </Space>
                </div>
                {resource.progress > 0 && (
                  <div style={{ marginTop: 8 }}>
                    <Progress 
                      percent={resource.progress} 
                      size="small" 
                      status={resource.isCompleted ? 'success' : 'active'}
                    />
                  </div>
                )}
              </div>
            </div>
          }
        />
      </Card>
    );
  };

  /**
   * 渲染学习路径
   */
  const renderLearningPaths = () => {
    return (
      <div>
        {learningPaths.map(path => (
          <Card key={path.id} style={{ marginBottom: 16 }}>
            <Row>
              <Col span={18}>
                <Title level={4}>{path.name}</Title>
                <Paragraph>{path.description}</Paragraph>
                <Space>
                  <Tag color={getDifficultyColor(path.difficulty)}>
                    {getDifficultyText(path.difficulty)}
                  </Tag>
                  <Text type="secondary">
                    <ClockCircleOutlined /> 预计 {path.estimatedTime} 分钟
                  </Text>
                  <Text type="secondary">
                    <UserOutlined /> {path.enrollments} 人学习
                  </Text>
                  <Rate disabled defaultValue={path.rating} allowHalf style={{ fontSize: 12 }} />
                </Space>
              </Col>
              <Col span={6} style={{ textAlign: 'right' }}>
                <div style={{ marginBottom: 16 }}>
                  <Progress 
                    type="circle" 
                    percent={path.completionRate} 
                    width={80}
                    status={path.completionRate === 100 ? 'success' : 'active'}
                  />
                </div>
                <Button type="primary" icon={<PlayCircleOutlined />}>
                  {path.completionRate > 0 ? '继续学习' : '开始学习'}
                </Button>
              </Col>
            </Row>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="learning-center">
      <Title level={2}>
        <BookOutlined /> 学习中心
      </Title>
      
      {/* 统计信息 */}
      {renderStatistics()}
      
      <Tabs defaultActiveKey="resources">
        <TabPane tab="学习资源" key="resources">
          {/* 搜索和过滤 */}
          <Card style={{ marginBottom: 16 }}>
            <Row gutter={16}>
              <Col span={8}>
                <Search
                  placeholder="搜索学习资源"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  prefix={<SearchOutlined />}
                />
              </Col>
              <Col span={4}>
                <Select
                  value={filterCategory}
                  onChange={setFilterCategory}
                  style={{ width: '100%' }}
                  placeholder="分类"
                >
                  <Option value="all">全部分类</Option>
                  <Option value="AI架构">AI架构</Option>
                  <Option value="工作流">工作流</Option>
                  <Option value="NLP">NLP</Option>
                  <Option value="测试">测试</Option>
                </Select>
              </Col>
              <Col span={4}>
                <Select
                  value={filterDifficulty}
                  onChange={setFilterDifficulty}
                  style={{ width: '100%' }}
                  placeholder="难度"
                >
                  <Option value="all">全部难度</Option>
                  <Option value="beginner">初级</Option>
                  <Option value="intermediate">中级</Option>
                  <Option value="advanced">高级</Option>
                </Select>
              </Col>
              <Col span={4}>
                <Select
                  value={filterType}
                  onChange={setFilterType}
                  style={{ width: '100%' }}
                  placeholder="类型"
                >
                  <Option value="all">全部类型</Option>
                  <Option value="video">视频</Option>
                  <Option value="document">文档</Option>
                  <Option value="audio">音频</Option>
                  <Option value="interactive">互动</Option>
                </Select>
              </Col>
              <Col span={4}>
                <Button type="primary" icon={<PlusOutlined />}>
                  上传资源
                </Button>
              </Col>
            </Row>
          </Card>
          
          {/* 资源列表 */}
          <Row gutter={[16, 16]}>
            {filteredResources.map(resource => (
              <Col key={resource.id} xs={24} sm={12} md={8} lg={6}>
                {renderResourceCard(resource)}
              </Col>
            ))}
          </Row>
        </TabPane>
        
        <TabPane tab="学习路径" key="paths">
          {renderLearningPaths()}
        </TabPane>
        
        <TabPane tab="我的学习" key="my-learning">
          <Row gutter={16}>
            <Col span={16}>
              <Card title="学习进度">
                <Timeline>
                  {resources.filter(r => r.progress > 0).map(resource => (
                    <Timeline.Item 
                      key={resource.id}
                      color={resource.isCompleted ? 'green' : 'blue'}
                      dot={resource.isCompleted ? <CheckCircleOutlined /> : <ClockCircleOutlined />}
                    >
                      <div>
                        <Text strong>{resource.title}</Text>
                        <br />
                        <Text type="secondary">{resource.category}</Text>
                        <div style={{ marginTop: 8 }}>
                          <Progress percent={resource.progress} size="small" />
                        </div>
                      </div>
                    </Timeline.Item>
                  ))}
                </Timeline>
              </Card>
            </Col>
            <Col span={8}>
              <Card title="学习成就">
                <Space direction="vertical" style={{ width: '100%' }}>
                  <div>
                    <TrophyOutlined style={{ color: '#faad14', marginRight: 8 }} />
                    <Text>完成课程达人</Text>
                    <br />
                    <Text type="secondary">完成 {resources.filter(r => r.isCompleted).length} 门课程</Text>
                  </div>
                  <Divider />
                  <div>
                    <StarOutlined style={{ color: '#1890ff', marginRight: 8 }} />
                    <Text>学习时长王者</Text>
                    <br />
                    <Text type="secondary">累计学习 {Math.round(resources.reduce((sum, r) => sum + (r.duration * r.progress / 100), 0))} 分钟</Text>
                  </div>
                  <Divider />
                  <div>
                    <HeartOutlined style={{ color: '#eb2f96', marginRight: 8 }} />
                    <Text>收藏专家</Text>
                    <br />
                    <Text type="secondary">收藏 {resources.filter(r => r.isFavorite).length} 门课程</Text>
                  </div>
                </Space>
              </Card>
            </Col>
          </Row>
        </TabPane>
      </Tabs>
      
      {/* 学习资源详情模态框 */}
      <Modal
        title={selectedResource?.title}
        visible={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          setSelectedResource(null);
        }}
        footer={[
          <Button key="cancel" onClick={() => {
            setIsModalVisible(false);
            setSelectedResource(null);
          }}>
            关闭
          </Button>,
          <Button key="start" type="primary" icon={<PlayCircleOutlined />}>
            开始学习
          </Button>
        ]}
        width={800}
      >
        {selectedResource && (
          <div>
            <Row gutter={16}>
              <Col span={16}>
                <Paragraph>{selectedResource.description}</Paragraph>
                <Space wrap>
                  {selectedResource.tags.map(tag => <Tag key={tag}>{tag}</Tag>)}
                </Space>
                <Divider />
                <div>
                  <Text strong>课程信息：</Text>
                  <ul style={{ marginTop: 8 }}>
                    <li>时长：{selectedResource.duration} 分钟</li>
                    <li>难度：{getDifficultyText(selectedResource.difficulty)}</li>
                    <li>分类：{selectedResource.category}</li>
                    <li>讲师：{selectedResource.author}</li>
                  </ul>
                </div>
              </Col>
              <Col span={8}>
                <Card size="small">
                  <Statistic
                    title="评分"
                    value={selectedResource.rating}
                    precision={1}
                    suffix="/ 5.0"
                    prefix={<StarOutlined />}
                  />
                  <Divider />
                  <Statistic
                    title="学习人数"
                    value={selectedResource.enrollments}
                    prefix={<UserOutlined />}
                  />
                  {selectedResource.progress > 0 && (
                    <>
                      <Divider />
                      <div>
                        <Text strong>学习进度</Text>
                        <Progress 
                          percent={selectedResource.progress} 
                          status={selectedResource.isCompleted ? 'success' : 'active'}
                          style={{ marginTop: 8 }}
                        />
                      </div>
                    </>
                  )}
                </Card>
              </Col>
            </Row>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default LearningCenter;