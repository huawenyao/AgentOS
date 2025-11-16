import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table, Button, Space, Input, Select, Tag, Badge, Card, Row, Col,
  Modal, Form, message, Tooltip, Dropdown, Menu, Drawer, Tabs,
  Statistic, Progress, Timeline, List, Avatar, Divider, Alert,
  Popconfirm, Switch, Rate, DatePicker, Upload, Checkbox
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, PlayCircleOutlined,
  PauseCircleOutlined, StopOutlined, EyeOutlined, CopyOutlined,
  DownloadOutlined, UploadOutlined, ShareAltOutlined, SettingOutlined,
  MonitorOutlined, TeamOutlined, CloudOutlined, SecurityScanOutlined,
  BranchesOutlined, ApiOutlined, DatabaseOutlined, BulbOutlined,
  ThunderboltOutlined, BookOutlined, StarOutlined,
  HeartOutlined, MessageOutlined, ExportOutlined, ImportOutlined,
  ReloadOutlined, FilterOutlined, SortAscendingOutlined,
  SearchOutlined, UserOutlined, CalendarOutlined, TagOutlined
} from '@ant-design/icons';
import {
  Agent2_0, AgentStatus, CoreCapabilityType, CapabilityMaturityLevel,
  AgentMetadata, DeploymentConfig, CapabilityOrchestrationMode
} from './CapabilitySystemTypes';
import { generateMockAgents } from '../data/mockData';
import './AgentManager2_0.css';

const { Search } = Input;
const { Option } = Select;
const { TabPane } = Tabs;
const { RangePicker } = DatePicker;

interface AgentManager2_0Props {
  onEditAgent?: (agent: Agent2_0) => void;
}

interface AgentStats {
  total: number;
  running: number;
  stopped: number;
  error: number;
  deployed: number;
  development: number;
}

interface FilterOptions {
  status: AgentStatus[];
  categories: string[];
  difficulties: string[];
  authors: string[];
  tags: string[];
  dateRange: [string, string] | null;
  ratingRange: [number, number];
}

const AgentManager2_0: React.FC<AgentManager2_0Props> = ({ onEditAgent }) => {
  const navigate = useNavigate();
  const [agents, setAgents] = useState<Agent2_0[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent2_0 | null>(null);
  const [sortField, setSortField] = useState<string>('updatedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    status: [],
    categories: [],
    difficulties: [],
    authors: [],
    tags: [],
    dateRange: null,
    ratingRange: [0, 5]
  });

  // 加载Agents数据
  const loadAgents = useCallback(async () => {
    setLoading(true);
    try {
      // 从localStorage加载或生成模拟数据
      const savedAgents = localStorage.getItem('agents');
      if (savedAgents) {
        const parsedAgents = JSON.parse(savedAgents);
        setAgents(parsedAgents);
        setPagination(prev => ({ ...prev, total: parsedAgents.length }));
      } else {
        const mockAgents = generateMockAgents();
        setAgents(mockAgents);
        setPagination(prev => ({ ...prev, total: mockAgents.length }));
        localStorage.setItem('agents', JSON.stringify(mockAgents));
      }
    } catch (error) {
      console.error('加载Agents失败:', error);
      message.error('加载Agents失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAgents();
  }, [loadAgents]);

  // 计算统计数据
  const agentStats = useMemo((): AgentStats => {
    return {
      total: agents.length,
      running: agents.filter(a => a.status === AgentStatus.RUNNING).length,
      stopped: agents.filter(a => a.status === AgentStatus.STOPPED).length,
      error: agents.filter(a => a.status === AgentStatus.ERROR).length,
      deployed: agents.filter(a => a.deploymentConfig?.environment === 'production').length,
      development: agents.filter(a => a.deploymentConfig?.environment === 'development').length
    };
  }, [agents]);

  // 过滤和排序Agents
  const filteredAgents = useMemo(() => {
    let filtered = [...agents];

    // 搜索过滤
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      filtered = filtered.filter(agent => 
        agent.name.toLowerCase().includes(searchLower) ||
        agent.description.toLowerCase().includes(searchLower) ||
        agent.metadata.author.toLowerCase().includes(searchLower) ||
        agent.metadata.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    // 状态过滤
    if (filterOptions.status.length > 0) {
      filtered = filtered.filter(agent => filterOptions.status.includes(agent.status));
    }

    // 分类过滤
    if (filterOptions.categories.length > 0) {
      filtered = filtered.filter(agent => filterOptions.categories.includes(agent.metadata.category));
    }

    // 难度过滤
    if (filterOptions.difficulties.length > 0) {
      filtered = filtered.filter(agent => filterOptions.difficulties.includes(agent.metadata.difficulty));
    }

    // 作者过滤
    if (filterOptions.authors.length > 0) {
      filtered = filtered.filter(agent => filterOptions.authors.includes(agent.metadata.author));
    }

    // 标签过滤
    if (filterOptions.tags.length > 0) {
      filtered = filtered.filter(agent => 
        filterOptions.tags.some(tag => agent.metadata.tags.includes(tag))
      );
    }

    // 评分过滤
    filtered = filtered.filter(agent => 
      agent.metadata.rating >= filterOptions.ratingRange[0] && 
      agent.metadata.rating <= filterOptions.ratingRange[1]
    );

    // 日期范围过滤
    if (filterOptions.dateRange) {
      const [startDate, endDate] = filterOptions.dateRange;
      filtered = filtered.filter(agent => {
        const agentDate = new Date(agent.metadata.updatedAt).toISOString().split('T')[0];
        return agentDate >= startDate && agentDate <= endDate;
      });
    }

    // 排序
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortField) {
        case 'name':
          aValue = a.name;
          bValue = b.name;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'rating':
          aValue = a.metadata.rating;
          bValue = b.metadata.rating;
          break;
        case 'downloads':
          aValue = a.metadata.downloads;
          bValue = b.metadata.downloads;
          break;
        case 'updatedAt':
          aValue = new Date(a.metadata.updatedAt).getTime();
          bValue = new Date(b.metadata.updatedAt).getTime();
          break;
        default:
          aValue = a.metadata.updatedAt;
          bValue = b.metadata.updatedAt;
      }

      if (typeof aValue === 'string') {
        return sortOrder === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      } else {
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      }
    });

    return filtered;
  }, [agents, searchText, filterOptions, sortField, sortOrder]);

  // 事件处理函数
  const handleCreateAgent = () => {
    navigate('/agent-designer');
  };

  const handleEditAgent = (agent: Agent2_0) => {
    if (onEditAgent) {
      onEditAgent(agent);
    } else {
      // 将Agent数据存储到localStorage供AgentDesigner使用
      localStorage.setItem('editingAgent', JSON.stringify(agent));
      navigate(`/agent-designer/${agent.id}`);
    }
  };

  const handleViewAgent = (agent: Agent2_0) => {
    setSelectedAgent(agent);
    setDetailDrawerVisible(true);
  };

  const handleCopyAgent = async (agent: Agent2_0) => {
    try {
      const newAgent: Agent2_0 = {
        ...agent,
        id: `${agent.id}_copy_${Date.now()}`,
        name: `${agent.name} (副本)`,
        status: AgentStatus.COMPLETED,
        metadata: {
          ...agent.metadata,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      };
      
      const updatedAgents = [...agents, newAgent];
      setAgents(updatedAgents);
      localStorage.setItem('agents', JSON.stringify(updatedAgents));
      message.success('Agent复制成功');
    } catch (error) {
      message.error('Agent复制失败');
    }
  };

  const handleDeleteAgent = async (agentId: string) => {
    try {
      const updatedAgents = agents.filter(agent => agent.id !== agentId);
      setAgents(updatedAgents);
      localStorage.setItem('agents', JSON.stringify(updatedAgents));
      message.success('Agent删除成功');
    } catch (error) {
      message.error('Agent删除失败');
    }
  };

  const handleStartAgent = async (agentId: string) => {
    try {
      const updatedAgents = agents.map(agent => 
        agent.id === agentId 
          ? { ...agent, status: AgentStatus.RUNNING }
          : agent
      );
      setAgents(updatedAgents);
      localStorage.setItem('agents', JSON.stringify(updatedAgents));
      message.success('Agent启动成功');
    } catch (error) {
      message.error('Agent启动失败');
    }
  };

  const handleStopAgent = async (agentId: string) => {
    try {
      const updatedAgents = agents.map(agent => 
        agent.id === agentId 
          ? { ...agent, status: AgentStatus.STOPPED }
          : agent
      );
      setAgents(updatedAgents);
      localStorage.setItem('agents', JSON.stringify(updatedAgents));
      message.success('Agent停止成功');
    } catch (error) {
      message.error('Agent停止失败');
    }
  };

  const handleBatchOperation = async (operation: string) => {
    if (selectedAgents.length === 0) {
      message.warning('请先选择要操作的Agent');
      return;
    }

    try {
      let updatedAgents = [...agents];
      
      switch (operation) {
        case 'start':
          updatedAgents = updatedAgents.map(agent => 
            selectedAgents.includes(agent.id) 
              ? { ...agent, status: AgentStatus.RUNNING }
              : agent
          );
          message.success(`批量启动${selectedAgents.length}个Agent成功`);
          break;
        case 'stop':
          updatedAgents = updatedAgents.map(agent => 
            selectedAgents.includes(agent.id) 
              ? { ...agent, status: AgentStatus.STOPPED }
              : agent
          );
          message.success(`批量停止${selectedAgents.length}个Agent成功`);
          break;
        case 'delete':
          updatedAgents = updatedAgents.filter(agent => !selectedAgents.includes(agent.id));
          message.success(`批量删除${selectedAgents.length}个Agent成功`);
          break;
      }
      
      setAgents(updatedAgents);
      localStorage.setItem('agents', JSON.stringify(updatedAgents));
      setSelectedAgents([]);
    } catch (error) {
      message.error('批量操作失败');
    }
  };

  // 渲染函数
  const renderStatusTag = (status: AgentStatus) => {
    const statusConfig = {
      [AgentStatus.RUNNING]: { color: 'green', text: '运行中' },
      [AgentStatus.STOPPED]: { color: 'red', text: '已停止' },
      [AgentStatus.DEVELOPMENT]: { color: 'blue', text: '开发中' },
      [AgentStatus.ERROR]: { color: 'red', text: '错误' },
      [AgentStatus.DEPLOYING]: { color: 'orange', text: '部署中' }
    };
    
    const config = statusConfig[status] || { color: 'default', text: '未知' };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const renderActionMenu = (agent: Agent2_0) => {
    const menuItems = [
      {
        key: 'copy',
        icon: <CopyOutlined />,
        label: '复制Agent',
        onClick: () => handleCopyAgent(agent)
      },
      {
        key: 'export',
        icon: <ExportOutlined />,
        label: '导出配置',
        onClick: () => {
          const dataStr = JSON.stringify(agent, null, 2);
          const dataBlob = new Blob([dataStr], { type: 'application/json' });
          const url = URL.createObjectURL(dataBlob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${agent.name}_config.json`;
          link.click();
          URL.revokeObjectURL(url);
        }
      },
      {
        key: 'delete',
        icon: <DeleteOutlined />,
        label: '删除Agent',
        danger: true,
        onClick: () => {
          Modal.confirm({
            title: '确认删除',
            content: `确定要删除Agent "${agent.name}" 吗？此操作不可撤销。`,
            okText: '删除',
            okType: 'danger',
            cancelText: '取消',
            onOk: () => handleDeleteAgent(agent.id)
          });
        }
      }
    ];

    return (
      <Dropdown menu={{ items: menuItems }} trigger={['click']}>
        <Button type="text"  icon={<SettingOutlined />} />
      </Dropdown>
    );
  };

  const columns = [
    {
      title: 'Agent名称',
      dataIndex: 'name',
      key: 'name',
      width: 250,
      render: (text: string, record: Agent2_0) => (
        <div className="agent-name-cell">
          <div className="agent-title">
            <strong>{text}</strong>
            {record.metadata.featured && (
              <StarOutlined style={{ color: '#faad14', marginLeft: 4 }} />
            )}
          </div>
          <div className="agent-subtitle">
            v{record.version} • {record.metadata.author}
          </div>
          <div className="agent-description">
            {record.description.length > 80 
              ? `${record.description.substring(0, 80)}...` 
              : record.description
            }
          </div>
        </div>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: AgentStatus) => renderStatusTag(status)
    },
    {
      title: '能力数量',
      key: 'capabilities',
      width: 100,
      render: (_: any, record: Agent2_0) => (
        <Badge count={record.capabilities.length} style={{ backgroundColor: '#52c41a' }} />
      )
    },
    {
      title: '分类',
      dataIndex: ['metadata', 'category'],
      key: 'category',
      width: 100,
      render: (category: string) => (
        <Tag color={category === 'business' ? 'blue' : category === 'technical' ? 'green' : 'orange'}>
          {category === 'business' ? '业务' : category === 'technical' ? '技术' : '通用'}
        </Tag>
      )
    },
    {
      title: '难度',
      dataIndex: ['metadata', 'difficulty'],
      key: 'difficulty',
      width: 100,
      render: (difficulty: string) => {
        const colorMap = {
          'beginner': 'green',
          'intermediate': 'orange', 
          'advanced': 'red'
        };
        const textMap = {
          'beginner': '初级',
          'intermediate': '中级',
          'advanced': '高级'
        };
        return (
          <Tag color={colorMap[difficulty as keyof typeof colorMap] || 'default'}>
            {textMap[difficulty as keyof typeof textMap] || difficulty}
          </Tag>
        );
      }
    },
    {
      title: '评分',
      dataIndex: ['metadata', 'rating'],
      key: 'rating',
      width: 120,
      render: (rating: number) => (
        <div className="rating-cell">
          <Rate disabled value={rating} allowHalf style={{ fontSize: 12 }} />
          <span className="rating-text">{rating.toFixed(1)}</span>
        </div>
      )
    },
    {
      title: '下载量',
      dataIndex: ['metadata', 'downloads'],
      key: 'downloads',
      width: 100,
      render: (downloads: number) => (
        <span>{downloads.toLocaleString()}</span>
      )
    },
    {
      title: '更新时间',
      dataIndex: ['metadata', 'updatedAt'],
      key: 'updatedAt',
      width: 120,
      render: (date: Date) => (
        <span>{new Date(date).toLocaleDateString()}</span>
      )
    },
    {
      title: '操作',
      key: 'actions',
      width: 120,
      fixed: 'right' as const,
      render: (_: any, record: Agent2_0) => (
        <Space>
          <Tooltip title="查看详情">
            <Button 
              type="text" 
               
              icon={<EyeOutlined />}
              onClick={() => handleViewAgent(record)}
            />
          </Tooltip>
          <Tooltip title="编辑">
            <Button 
              type="text" 
               
              icon={<EditOutlined />}
              onClick={() => handleEditAgent(record)}
            />
          </Tooltip>
          {renderActionMenu(record)}
        </Space>
      )
    }
  ];

  const renderStatsCards = () => {
    return (
      <Row gutter={16} className="stats-cards">
        <Col span={4}>
          <Card>
            <Statistic
              title="总数"
              value={agentStats.total}
              prefix={<DatabaseOutlined />}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="运行中"
              value={agentStats.running}
              prefix={<PlayCircleOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="已停止"
              value={agentStats.stopped}
              prefix={<PauseCircleOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="错误"
              value={agentStats.error}
              prefix={<StopOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="已部署"
              value={agentStats.deployed}
              prefix={<CloudOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="开发中"
              value={agentStats.development}
              prefix={<BulbOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>
    );
  };

  const renderToolbar = () => {
    return (
      <div className="agent-toolbar">
        <div className="toolbar-left">
          <Space>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateAgent}>
              创建Agent
            </Button>
            <Button icon={<ImportOutlined />}>
              导入Agent
            </Button>
            <Button icon={<ExportOutlined />}>
              导出Agent
            </Button>
            <Divider type="vertical" />
            <Button 
              icon={<PlayCircleOutlined />} 
              onClick={() => handleBatchOperation('start')}
              disabled={selectedAgents.length === 0}
            >
              批量启动
            </Button>
            <Button 
              icon={<PauseCircleOutlined />} 
              onClick={() => handleBatchOperation('stop')}
              disabled={selectedAgents.length === 0}
            >
              批量停止
            </Button>
            <Button 
              danger 
              icon={<DeleteOutlined />} 
              onClick={() => handleBatchOperation('delete')}
              disabled={selectedAgents.length === 0}
            >
              批量删除
            </Button>
          </Space>
        </div>
        <div className="toolbar-right">
          <Space>
            <Search
              placeholder="搜索Agent名称、描述、作者或标签"
              allowClear
              style={{ width: 300 }}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
            <Select
              placeholder="状态筛选"
              style={{ width: 120 }}
              allowClear
              mode="multiple"
              value={filterOptions.status}
              onChange={(value) => setFilterOptions(prev => ({ ...prev, status: value }))}
            >
              <Option value={AgentStatus.RUNNING}>运行中</Option>
              <Option value={AgentStatus.STOPPED}>已停止</Option>
              <Option value={AgentStatus.DEVELOPMENT}>开发中</Option>
              <Option value={AgentStatus.ERROR}>错误</Option>
            </Select>
            <Button icon={<ReloadOutlined />} onClick={loadAgents}>
              刷新
            </Button>
          </Space>
        </div>
      </div>
    );
  };

  const renderDetailDrawer = () => {
    if (!selectedAgent) return null;

    return (
      <Drawer
        title={`Agent详情 - ${selectedAgent.name}`}
        placement="right"
        width={600}
        open={detailDrawerVisible}
        onClose={() => setDetailDrawerVisible(false)}
      >
        <Tabs defaultActiveKey="basic">
          <TabPane tab="基本信息" key="basic">
            <div className="agent-detail-basic">
              <div className="detail-item">
                <label>名称:</label>
                <span>{selectedAgent.name}</span>
              </div>
              <div className="detail-item">
                <label>版本:</label>
                <span>{selectedAgent.version}</span>
              </div>
              <div className="detail-item">
                <label>状态:</label>
                {renderStatusTag(selectedAgent.status)}
              </div>
              <div className="detail-item">
                <label>描述:</label>
                <span>{selectedAgent.description}</span>
              </div>
              <div className="detail-item">
                <label>作者:</label>
                <span>{selectedAgent.metadata.author}</span>
              </div>
              <div className="detail-item">
                <label>组织:</label>
                <span>{selectedAgent.metadata.organization}</span>
              </div>
              <div className="detail-item">
                <label>许可证:</label>
                <span>{selectedAgent.metadata.license}</span>
              </div>
              <div className="detail-item">
                <label>标签:</label>
                <div>
                  {selectedAgent.metadata.tags.map(tag => (
                    <Tag key={tag} style={{ margin: '2px' }}>{tag}</Tag>
                  ))}
                </div>
              </div>
            </div>
          </TabPane>
          <TabPane tab="能力列表" key="capabilities">
            <List
              dataSource={selectedAgent.capabilities}
              renderItem={(capability) => (
                <List.Item>
                  <List.Item.Meta
                    title={capability?.name || '未知能力'}
                    description={capability.description}
                  />
                  <div>
                    <Tag>{capability.type}</Tag>
                    <Tag color="blue">{capability.version}</Tag>
                  </div>
                </List.Item>
              )}
            />
          </TabPane>
          <TabPane tab="元数据" key="metadata">
            <div className="agent-detail-metadata">
              <div className="detail-item">
                <label>评分:</label>
                <Rate disabled value={selectedAgent.metadata.rating} allowHalf />
                <span style={{ marginLeft: 8 }}>{selectedAgent.metadata.rating.toFixed(1)}</span>
              </div>
              <div className="detail-item">
                <label>下载量:</label>
                <span>{selectedAgent.metadata.downloads.toLocaleString()}</span>
              </div>
              <div className="detail-item">
                <label>创建时间:</label>
                <span>{new Date(selectedAgent.metadata.createdAt).toLocaleString()}</span>
              </div>
              <div className="detail-item">
                <label>更新时间:</label>
                <span>{new Date(selectedAgent.metadata.updatedAt).toLocaleString()}</span>
              </div>
            </div>
          </TabPane>
        </Tabs>
      </Drawer>
    );
  };

  return (
    <div className="agent-manager-2-0">
      <div className="manager-header">
        <div className="header-title">
          <h2>
            <BulbOutlined /> EFIAgent 2.0 管理器
          </h2>
          <p>基于能力系统模型的智能Agent生命周期管理平台</p>
        </div>
      </div>

      {renderStatsCards()}

      {renderToolbar()}

      <div className="agent-table-container">
        <Table
          columns={columns}
          dataSource={filteredAgents}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
            onChange: (page, pageSize) => {
              setPagination({ current: page, pageSize, total: pagination.total });
            }
          }}
          rowSelection={{
            selectedRowKeys: selectedAgents,
            onChange: (selectedRowKeys) => {
              setSelectedAgents(selectedRowKeys as string[]);
            }
          }}
          scroll={{ x: 1200 }}
          
        />
      </div>

      {renderDetailDrawer()}

    </div>
  );
};

export default AgentManager2_0;