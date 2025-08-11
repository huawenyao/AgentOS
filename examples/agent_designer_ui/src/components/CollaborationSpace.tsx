import React, { useState, useEffect } from 'react';
import {
  Card, Row, Col, Input, Button, Select, Table, Tag, Space,
  Modal, Form, message, Tooltip, Divider, Typography,
  Avatar, List, Timeline, Tabs, Statistic, Badge,
  Rate, Upload, Drawer, Popover, Switch,
  Calendar, Alert, Progress, Steps, Collapse
} from 'antd';
import {
  SearchOutlined, PlusOutlined, EditOutlined, DeleteOutlined,
  TeamOutlined, MessageOutlined, ShareAltOutlined,
  UserOutlined, ClockCircleOutlined, StarOutlined,
  FileTextOutlined, VideoCameraOutlined, AudioOutlined,
  DownloadOutlined, UploadOutlined, EyeOutlined,
  CommentOutlined, LikeOutlined, DislikeOutlined,
  BellOutlined, SettingOutlined, GlobalOutlined,
  LockOutlined, UnlockOutlined, CopyOutlined,
  CalendarOutlined, ProjectOutlined, FolderOutlined
} from '@ant-design/icons';
import './CollaborationSpace.css';

const { Search } = Input;
const { Option } = Select;
const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { Panel } = Collapse;
const { Step } = Steps;
const { TextArea } = Input;

/**
 * 协作项目接口
 */
interface CollaborationProject {
  id: string;
  name: string;
  description: string;
  type: 'agent_design' | 'workflow' | 'knowledge_base' | 'research';
  status: 'active' | 'completed' | 'paused' | 'archived';
  visibility: 'public' | 'private' | 'team';
  owner: string;
  members: ProjectMember[];
  createdAt: Date;
  updatedAt: Date;
  deadline?: Date;
  progress: number;
  tags: string[];
  resources: ProjectResource[];
  discussions: Discussion[];
}

/**
 * 项目成员接口
 */
interface ProjectMember {
  id: string;
  name: string;
  avatar: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  joinedAt: Date;
  lastActive: Date;
  contributions: number;
}

/**
 * 项目资源接口
 */
interface ProjectResource {
  id: string;
  name: string;
  type: 'document' | 'code' | 'design' | 'data';
  size: number;
  uploadedBy: string;
  uploadedAt: Date;
  downloads: number;
}

/**
 * 讨论接口
 */
interface Discussion {
  id: string;
  title: string;
  content: string;
  author: string;
  authorAvatar: string;
  createdAt: Date;
  replies: Reply[];
  likes: number;
  tags: string[];
}

/**
 * 回复接口
 */
interface Reply {
  id: string;
  content: string;
  author: string;
  authorAvatar: string;
  createdAt: Date;
  likes: number;
}

/**
 * 协作空间组件
 */
const CollaborationSpace: React.FC = () => {
  const [projects, setProjects] = useState<CollaborationProject[]>([]);
  const [selectedProject, setSelectedProject] = useState<CollaborationProject | null>(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isProjectModalVisible, setIsProjectModalVisible] = useState(false);
  const [isDiscussionModalVisible, setIsDiscussionModalVisible] = useState(false);
  const [isProjectDetailModalVisible, setIsProjectDetailModalVisible] = useState(false);
  const [editingProject, setEditingProject] = useState<CollaborationProject | null>(null);
  const [projectForm] = Form.useForm();
  const [discussionForm] = Form.useForm();
  const [activeTab, setActiveTab] = useState('overview');

  /**
   * 初始化模拟数据
   */
  useEffect(() => {
    initializeMockData();
  }, []);

  /**
   * 初始化模拟协作数据
   */
  const initializeMockData = () => {
    const mockProjects: CollaborationProject[] = [
      {
        id: 'project_1',
        name: '智能客服Agent设计',
        description: '设计和开发一个智能客服Agent，具备多轮对话、情感分析和知识检索能力。',
        type: 'agent_design',
        status: 'active',
        visibility: 'team',
        owner: '张工程师',
        members: [
          {
            id: 'member_1',
            name: '张工程师',
            avatar: '/avatars/zhang.jpg',
            role: 'owner',
            joinedAt: new Date('2024-01-10'),
            lastActive: new Date('2024-01-25'),
            contributions: 45
          },
          {
            id: 'member_2',
            name: '李设计师',
            avatar: '/avatars/li.jpg',
            role: 'admin',
            joinedAt: new Date('2024-01-12'),
            lastActive: new Date('2024-01-24'),
            contributions: 32
          },
          {
            id: 'member_3',
            name: '王开发者',
            avatar: '/avatars/wang.jpg',
            role: 'member',
            joinedAt: new Date('2024-01-15'),
            lastActive: new Date('2024-01-23'),
            contributions: 28
          }
        ],
        createdAt: new Date('2024-01-10'),
        updatedAt: new Date('2024-01-25'),
        deadline: new Date('2024-03-01'),
        progress: 65,
        tags: ['AI', '客服', '对话系统'],
        resources: [
          {
            id: 'resource_1',
            name: '需求文档.docx',
            type: 'document',
            size: 2048,
            uploadedBy: '张工程师',
            uploadedAt: new Date('2024-01-11'),
            downloads: 15
          },
          {
            id: 'resource_2',
            name: 'agent_design.py',
            type: 'code',
            size: 5120,
            uploadedBy: '王开发者',
            uploadedAt: new Date('2024-01-20'),
            downloads: 8
          }
        ],
        discussions: [
          {
            id: 'discussion_1',
            title: '对话流程设计讨论',
            content: '我们需要讨论一下多轮对话的流程设计，特别是上下文管理的部分。',
            author: '张工程师',
            authorAvatar: '/avatars/zhang.jpg',
            createdAt: new Date('2024-01-22'),
            replies: [
              {
                id: 'reply_1',
                content: '建议使用状态机来管理对话状态，这样更容易维护。',
                author: '李设计师',
                authorAvatar: '/avatars/li.jpg',
                createdAt: new Date('2024-01-22'),
                likes: 3
              }
            ],
            likes: 5,
            tags: ['设计', '对话流程']
          }
        ]
      },
      {
        id: 'project_2',
        name: '工作流引擎优化',
        description: '优化现有工作流引擎的性能，提升任务调度效率和并发处理能力。',
        type: 'workflow',
        status: 'active',
        visibility: 'public',
        owner: '陈架构师',
        members: [
          {
            id: 'member_4',
            name: '陈架构师',
            avatar: '/avatars/chen.jpg',
            role: 'owner',
            joinedAt: new Date('2024-01-08'),
            lastActive: new Date('2024-01-25'),
            contributions: 52
          },
          {
            id: 'member_5',
            name: '刘测试员',
            avatar: '/avatars/liu.jpg',
            role: 'member',
            joinedAt: new Date('2024-01-14'),
            lastActive: new Date('2024-01-24'),
            contributions: 23
          }
        ],
        createdAt: new Date('2024-01-08'),
        updatedAt: new Date('2024-01-25'),
        deadline: new Date('2024-02-28'),
        progress: 78,
        tags: ['工作流', '性能优化', '并发'],
        resources: [],
        discussions: []
      },
      {
        id: 'project_3',
        name: '知识图谱构建',
        description: '构建领域知识图谱，支持智能问答和知识推理功能。',
        type: 'knowledge_base',
        status: 'completed',
        visibility: 'team',
        owner: '赵研究员',
        members: [
          {
            id: 'member_6',
            name: '赵研究员',
            avatar: '/avatars/zhao.jpg',
            role: 'owner',
            joinedAt: new Date('2023-12-01'),
            lastActive: new Date('2024-01-20'),
            contributions: 67
          }
        ],
        createdAt: new Date('2023-12-01'),
        updatedAt: new Date('2024-01-20'),
        deadline: new Date('2024-01-20'),
        progress: 100,
        tags: ['知识图谱', '推理', '问答'],
        resources: [],
        discussions: []
      }
    ];

    setProjects(mockProjects);
    if (mockProjects.length > 0) {
      setSelectedProject(mockProjects[0]);
    }
  };

  /**
   * 过滤项目数据
   */
  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchKeyword.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchKeyword.toLowerCase());
    const matchesType = filterType === 'all' || project.type === filterType;
    const matchesStatus = filterStatus === 'all' || project.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  /**
   * 获取项目类型文本
   */
  const getProjectTypeText = (type: string) => {
    const typeMap = {
      agent_design: 'Agent设计',
      workflow: '工作流',
      knowledge_base: '知识库',
      research: '研究项目'
    };
    return typeMap[type as keyof typeof typeMap] || type;
  };

  /**
   * 获取项目状态颜色
   */
  const getStatusColor = (status: string) => {
    const colorMap = {
      active: 'processing',
      completed: 'success',
      paused: 'warning',
      archived: 'default'
    };
    return colorMap[status as keyof typeof colorMap] || 'default';
  };

  /**
   * 获取项目状态文本
   */
  const getStatusText = (status: string) => {
    const textMap = {
      active: '进行中',
      completed: '已完成',
      paused: '暂停',
      archived: '已归档'
    };
    return textMap[status as keyof typeof textMap] || status;
  };

  /**
   * 获取可见性图标
   */
  const getVisibilityIcon = (visibility: string) => {
    const iconMap = {
      public: <GlobalOutlined />,
      private: <LockOutlined />,
      team: <TeamOutlined />
    };
    return iconMap[visibility as keyof typeof iconMap] || <LockOutlined />;
  };

  /**
   * 处理项目创建/编辑
   */
  const handleProjectSubmit = async (values: any) => {
    try {
      if (editingProject) {
        // 编辑现有项目
        const updatedProjects = projects.map(project => 
          project.id === editingProject.id 
            ? { ...project, ...values, updatedAt: new Date() }
            : project
        );
        setProjects(updatedProjects);
        message.success('项目更新成功');
      } else {
        // 创建新项目
        const newProject: CollaborationProject = {
          id: `project_${Date.now()}`,
          ...values,
          owner: '当前用户',
          members: [{
            id: 'current_user',
            name: '当前用户',
            avatar: '/avatars/current.jpg',
            role: 'owner',
            joinedAt: new Date(),
            lastActive: new Date(),
            contributions: 0
          }],
          createdAt: new Date(),
          updatedAt: new Date(),
          progress: 0,
          resources: [],
          discussions: []
        };
        setProjects([...projects, newProject]);
        message.success('项目创建成功');
      }
      
      setIsProjectModalVisible(false);
      setEditingProject(null);
      projectForm.resetFields();
    } catch (error) {
      message.error('操作失败，请重试');
    }
  };

  /**
   * 渲染统计信息
   */
  const renderStatistics = () => {
    const activeCount = projects.filter(p => p.status === 'active').length;
    const completedCount = projects.filter(p => p.status === 'completed').length;
    const totalMembers = new Set(projects.flatMap(p => p.members.map(m => m.id))).size;
    const avgProgress = projects.reduce((sum, p) => sum + p.progress, 0) / projects.length || 0;

    return (
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="活跃项目"
              value={activeCount}
              prefix={<ProjectOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已完成项目"
              value={completedCount}
              prefix={<StarOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="协作成员"
              value={totalMembers}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="平均进度"
              value={Math.round(avgProgress)}
              suffix="%"
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>
    );
  };

  /**
   * 渲染项目列表表头
   */
  const renderProjectListHeader = () => {
    return (
      <div style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        padding: '12px 16px',
        backgroundColor: '#fafafa',
        borderBottom: '1px solid #f0f0f0',
        fontWeight: 600,
        fontSize: '13px',
        color: '#666'
      }}>
        <div style={{ flex: '0 0 200px', minWidth: '150px' }}>项目名称</div>
        <div style={{ flex: '0 0 100px' }}>类型</div>
        <div style={{ flex: '0 0 80px' }}>状态</div>
        <div style={{ flex: '0 0 120px' }}>负责人</div>
        <div style={{ flex: '0 0 80px' }}>成员</div>
        <div style={{ flex: '0 0 120px' }}>进度</div>
        <div style={{ flex: '0 0 100px' }}>更新时间</div>
        <div style={{ flex: '0 0 30px', textAlign: 'center' }}>可见性</div>
        <div style={{ flex: '0 0 120px', textAlign: 'center' }}>操作</div>
      </div>
    );
  };

  /**
   * 渲染项目列表
   */
  const renderProjectList = () => {
    return (
      <div style={{ width: '100%' }}>
        {renderProjectListHeader()}
        <List
          itemLayout="horizontal"
          dataSource={filteredProjects}
          style={{ width: '100%' }}
          renderItem={(project) => (
          <List.Item
             key={project.id}
             className="project-item"
             onClick={() => {
               setSelectedProject(project);
               setIsProjectDetailModalVisible(true);
             }}
             style={{ width: '100%', padding: '12px 16px' }}
           >
            <div style={{ 
              width: '100%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              gap: '16px'
            }}>
              {/* 项目名称 */}
              <div style={{ flex: '0 0 200px', minWidth: '150px' }}>
                <Text strong style={{ fontSize: '14px' }}>{project.name}</Text>
              </div>
              
              {/* 项目类型 */}
              <div style={{ flex: '0 0 100px' }}>
                <Tag style={{ margin: 0 }}>{getProjectTypeText(project.type)}</Tag>
              </div>
              
              {/* 状态 */}
              <div style={{ flex: '0 0 80px' }}>
                <Tag color={getStatusColor(project.status)} style={{ margin: 0 }}>
                  {getStatusText(project.status)}
                </Tag>
              </div>
              
              {/* 负责人 */}
              <div style={{ flex: '0 0 120px' }}>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  <UserOutlined /> {project.owner}
                </Text>
              </div>
              
              {/* 成员数量 */}
              <div style={{ flex: '0 0 80px' }}>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  <TeamOutlined /> {project.members.length}
                </Text>
              </div>
              
              {/* 进度 */}
              <div style={{ flex: '0 0 120px' }}>
                <Progress 
                  percent={project.progress} 
                  size="small" 
                  showInfo={true}
                  format={(percent) => `${percent}%`}
                  style={{ margin: 0 }}
                />
              </div>
              
              {/* 更新时间 */}
              <div style={{ flex: '0 0 100px' }}>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  <ClockCircleOutlined /> {project.updatedAt.toLocaleDateString()}
                </Text>
              </div>
              
              {/* 可见性 */}
              <div style={{ flex: '0 0 30px', textAlign: 'center' }}>
                {getVisibilityIcon(project.visibility)}
              </div>
              
              {/* 操作按钮 */}
              <div style={{ flex: '0 0 120px', textAlign: 'center' }}>
                <Space>
                  <Tooltip title="编辑">
                    <Button 
                      type="text" 
                      size="small"
                      icon={<EditOutlined />} 
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingProject(project);
                        projectForm.setFieldsValue(project);
                        setIsProjectModalVisible(true);
                      }}
                    />
                  </Tooltip>
                  <Tooltip title="分享">
                    <Button type="text" size="small" icon={<ShareAltOutlined />} />
                  </Tooltip>
                  <Tooltip title="复制">
                    <Button type="text" size="small" icon={<CopyOutlined />} />
                  </Tooltip>
                </Space>
              </div>
            </div>
          </List.Item>
        )}
        />
      </div>
    );
  };



  return (
    <div className="collaboration-space">
      <Title level={2}>
        <TeamOutlined /> 协作空间
      </Title>
      
      {/* 统计信息 */}
      {renderStatistics()}
      
      <Card 
        title="项目列表" 
        extra={
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingProject(null);
              projectForm.resetFields();
              setIsProjectModalVisible(true);
            }}
          >
            新建项目
          </Button>
        }
      >
        {/* 搜索和过滤 */}
        <div style={{ marginBottom: 16 }}>
          <Search
            placeholder="搜索项目"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            style={{ marginBottom: 8 }}
          />
          <Row gutter={8}>
            <Col span={12}>
              <Select
                value={filterType}
                onChange={setFilterType}
                style={{ width: '100%' }}
                size="small"
              >
                <Option value="all">全部类型</Option>
                <Option value="agent_design">Agent设计</Option>
                <Option value="workflow">工作流</Option>
                <Option value="knowledge_base">知识库</Option>
                <Option value="research">研究项目</Option>
              </Select>
            </Col>
            <Col span={12}>
              <Select
                value={filterStatus}
                onChange={setFilterStatus}
                style={{ width: '100%' }}
                size="small"
              >
                <Option value="all">全部状态</Option>
                <Option value="active">进行中</Option>
                <Option value="completed">已完成</Option>
                <Option value="paused">暂停</Option>
                <Option value="archived">已归档</Option>
              </Select>
            </Col>
          </Row>
        </div>
        
        {renderProjectList()}
      </Card>
      
      {/* 项目详情模态框 */}
      <Modal
        title={selectedProject?.name || '项目详情'}
        visible={isProjectDetailModalVisible}
        onCancel={() => {
          setIsProjectDetailModalVisible(false);
          setSelectedProject(null);
        }}
        footer={null}
        width={800}
        className="project-details-modal"
      >
        {selectedProject && (
          <Tabs activeKey={activeTab} onChange={setActiveTab}>
            <TabPane tab="概览" key="overview">
              <Row gutter={16}>
                <Col span={16}>
                  <div style={{ marginBottom: 16 }}>
                    <Title level={4}>项目描述</Title>
                    <Paragraph>{selectedProject.description}</Paragraph>
                  </div>
                  
                  <div style={{ marginBottom: 16 }}>
                    <Title level={4}>项目进度</Title>
                    <Progress 
                      percent={selectedProject.progress} 
                      status={selectedProject.status === 'completed' ? 'success' : 'active'}
                    />
                  </div>
                  
                  <div>
                    <Title level={4}>标签</Title>
                    <Space wrap>
                      {selectedProject.tags.map(tag => <Tag key={tag}>{tag}</Tag>)}
                    </Space>
                  </div>
                </Col>
                
                <Col span={8}>
                  <Card size="small" title="项目信息">
                    <div style={{ marginBottom: 12 }}>
                      <Text strong>项目类型：</Text>
                      <Text>{getProjectTypeText(selectedProject.type)}</Text>
                    </div>
                    <div style={{ marginBottom: 12 }}>
                      <Text strong>状态：</Text>
                      <Tag color={getStatusColor(selectedProject.status)}>
                        {getStatusText(selectedProject.status)}
                      </Tag>
                    </div>
                    <div style={{ marginBottom: 12 }}>
                      <Text strong>可见性：</Text>
                      <Space>
                        {getVisibilityIcon(selectedProject.visibility)}
                        <Text>{selectedProject.visibility}</Text>
                      </Space>
                    </div>
                    <div style={{ marginBottom: 12 }}>
                      <Text strong>创建时间：</Text>
                      <Text>{selectedProject.createdAt.toLocaleDateString()}</Text>
                    </div>
                    {selectedProject.deadline && (
                      <div style={{ marginBottom: 12 }}>
                        <Text strong>截止时间：</Text>
                        <Text>{selectedProject.deadline.toLocaleDateString()}</Text>
                      </div>
                    )}
                    <div>
                      <Text strong>负责人：</Text>
                      <Text>{selectedProject.owner}</Text>
                    </div>
                  </Card>
                </Col>
              </Row>
            </TabPane>
            
            <TabPane tab="成员" key="members">
              <List
                dataSource={selectedProject.members}
                renderItem={(member) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={<Avatar src={member.avatar} icon={<UserOutlined />} />}
                      title={member.name}
                      description={`角色: ${member.role} | 贡献: ${member.contributions}次 | 最后活跃: ${member.lastActive.toLocaleDateString()}`}
                    />
                  </List.Item>
                )}
              />
            </TabPane>
            
            <TabPane tab="资源" key="resources">
              <List
                dataSource={selectedProject.resources}
                renderItem={(resource) => (
                  <List.Item
                    actions={[
                      <Button type="link" icon={<DownloadOutlined />}>下载</Button>
                    ]}
                  >
                    <List.Item.Meta
                      avatar={<FileTextOutlined style={{ fontSize: 24 }} />}
                      title={resource.name}
                      description={`类型: ${resource.type} | 大小: ${(resource.size / 1024).toFixed(1)}KB | 上传者: ${resource.uploadedBy}`}
                    />
                  </List.Item>
                )}
              />
            </TabPane>
            
            <TabPane tab="讨论" key="discussions">
              <div style={{ marginBottom: 16 }}>
                <Button 
                  type="primary" 
                  icon={<PlusOutlined />}
                  onClick={() => setIsDiscussionModalVisible(true)}
                >
                  发起讨论
                </Button>
              </div>
              <List
                dataSource={selectedProject.discussions}
                renderItem={(discussion) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={<Avatar src={discussion.authorAvatar} icon={<UserOutlined />} />}
                      title={discussion.title}
                      description={
                        <div>
                          <Paragraph ellipsis={{ rows: 2 }}>{discussion.content}</Paragraph>
                          <Space>
                            <Text type="secondary">{discussion.author}</Text>
                            <Text type="secondary">{discussion.createdAt.toLocaleDateString()}</Text>
                            <Text type="secondary">{discussion.likes} 赞</Text>
                            <Text type="secondary">{discussion.replies.length} 回复</Text>
                          </Space>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            </TabPane>
          </Tabs>
        )}
      </Modal>
      
      {/* 项目创建/编辑模态框 */}
      <Modal
        title={editingProject ? '编辑项目' : '新建项目'}
        visible={isProjectModalVisible}
        onCancel={() => {
          setIsProjectModalVisible(false);
          setEditingProject(null);
          projectForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={projectForm}
          layout="vertical"
          onFinish={handleProjectSubmit}
        >
          <Form.Item
            name="name"
            label="项目名称"
            rules={[{ required: true, message: '请输入项目名称' }]}
          >
            <Input placeholder="输入项目名称" />
          </Form.Item>
          
          <Form.Item
            name="description"
            label="项目描述"
            rules={[{ required: true, message: '请输入项目描述' }]}
          >
            <TextArea rows={3} placeholder="输入项目描述" />
          </Form.Item>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="type"
                label="项目类型"
                rules={[{ required: true, message: '请选择项目类型' }]}
              >
                <Select placeholder="选择项目类型">
                  <Option value="agent_design">Agent设计</Option>
                  <Option value="workflow">工作流</Option>
                  <Option value="knowledge_base">知识库</Option>
                  <Option value="research">研究项目</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="visibility"
                label="可见性"
                rules={[{ required: true, message: '请选择可见性' }]}
              >
                <Select placeholder="选择可见性">
                  <Option value="public">公开</Option>
                  <Option value="team">团队</Option>
                  <Option value="private">私有</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item
            name="deadline"
            label="截止时间"
          >
            <Input type="date" />
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
                {editingProject ? '更新' : '创建'}
              </Button>
              <Button onClick={() => {
                setIsProjectModalVisible(false);
                setEditingProject(null);
                projectForm.resetFields();
              }}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
      
      {/* 讨论创建模态框 */}
      <Modal
        title="发起讨论"
        visible={isDiscussionModalVisible}
        onCancel={() => {
          setIsDiscussionModalVisible(false);
          discussionForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={discussionForm}
          layout="vertical"
          onFinish={(values) => {
            // 处理讨论创建逻辑
            message.success('讨论创建成功');
            setIsDiscussionModalVisible(false);
            discussionForm.resetFields();
          }}
        >
          <Form.Item
            name="title"
            label="讨论标题"
            rules={[{ required: true, message: '请输入讨论标题' }]}
          >
            <Input placeholder="输入讨论标题" />
          </Form.Item>
          
          <Form.Item
            name="content"
            label="讨论内容"
            rules={[{ required: true, message: '请输入讨论内容' }]}
          >
            <TextArea rows={4} placeholder="输入讨论内容" />
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
                发布讨论
              </Button>
              <Button onClick={() => {
                setIsDiscussionModalVisible(false);
                discussionForm.resetFields();
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

export default CollaborationSpace;