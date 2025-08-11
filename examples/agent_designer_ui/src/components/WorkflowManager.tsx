import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Button, 
  Table, 
  Modal, 
  Form, 
  Input, 
  Select, 
  Tag, 
  Space, 
  Tooltip, 
  Popconfirm, 
  message,
  Row,
  Col,
  Statistic,
  Progress,
  Avatar,
  Typography,
  Divider,
  Empty
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  StopOutlined,
  EyeOutlined,
  CopyOutlined,
  ExportOutlined,
  ImportOutlined,
  SettingOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  UserOutlined
} from '@ant-design/icons';
import { Workflow, WorkflowStatus } from './types';
import { useGlobalState } from './StateManager';
import './AgentDesigner.css';

const { Title, Text } = Typography;
const { TextArea } = Input;

// 使用从types.ts导入的WorkflowStatus枚举

/**
 * 工作流管理器组件
 * 提供工作流的创建、编辑、删除、执行等管理功能
 */
const WorkflowManager: React.FC = () => {
  // 全局状态
  const globalState = useGlobalState();
  
  // 本地状态
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  
  // 模态框状态
  const [createModalVisible, setCreateModalVisible] = useState<boolean>(false);
  const [editModalVisible, setEditModalVisible] = useState<boolean>(false);
  const [detailModalVisible, setDetailModalVisible] = useState<boolean>(false);
  
  // 表单
  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();
  
  // 统计数据
  const [statistics, setStatistics] = useState({
    total: 0,
    active: 0,
    paused: 0,
    error: 0
  });

  /**
   * 加载工作流列表
   */
  const loadWorkflows = async () => {
    setLoading(true);
    try {
      // 模拟API调用
      const mockWorkflows: Workflow[] = [
        {
          id: 'wf-001',
          name: '智能文档处理工作流',
          description: '自动处理、分析和总结文档的工作流',
          status: WorkflowStatus.ACTIVE,
          agents: [],
          nodes: [],
          connections: [],
          createdAt: new Date('2023-12-01'),
          updatedAt: new Date('2023-12-15'),
          author: 'Admin',
          version: '1.0.0',
          tags: ['文档处理', '自动化', 'NLP'],
          executionCount: 156,
          successRate: 94.2
        },
        {
          id: 'wf-002',
          name: '客户服务自动化流程',
          description: '处理客户咨询和问题解决的自动化工作流',
          status: WorkflowStatus.ACTIVE,
          agents: [],
          nodes: [],
          connections: [],
          createdAt: new Date('2023-11-20'),
          updatedAt: new Date('2023-12-10'),
          author: 'User1',
          version: '2.1.0',
          tags: ['客户服务', '自动化'],
          executionCount: 89,
          successRate: 97.8
        },
        {
          id: 'wf-003',
          name: '数据分析报告生成',
          description: '自动生成数据分析报告的工作流',
          status: WorkflowStatus.PAUSED,
          agents: [],
          nodes: [],
          connections: [],
          createdAt: new Date('2023-11-15'),
          updatedAt: new Date('2023-12-05'),
          author: 'User2',
          version: '1.5.0',
          tags: ['数据分析', '报告'],
          executionCount: 23,
          successRate: 91.3
        }
      ];
      
      setWorkflows(mockWorkflows);
      
      // 计算统计数据
      const stats = {
        total: mockWorkflows.length,
        active: mockWorkflows.filter(w => w.status === WorkflowStatus.ACTIVE).length,
        paused: mockWorkflows.filter(w => w.status === WorkflowStatus.PAUSED).length,
        error: mockWorkflows.filter(w => w.status === WorkflowStatus.ERROR).length
      };
      setStatistics(stats);
      
    } catch (error) {
      console.error('加载工作流失败:', error);
      message.error('加载工作流失败');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 创建新工作流
   */
  const handleCreateWorkflow = async (values: any) => {
    try {
      const newWorkflow: Workflow = {
        id: `wf-${Date.now()}`,
        name: values.name,
        description: values.description,
        status: WorkflowStatus.DRAFT,
        agents: [],
        nodes: [],
        connections: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        author: 'Current User',
        version: '1.0.0',
        tags: values.tags || [],
        executionCount: 0,
        successRate: 0
      };
      
      setWorkflows(prev => [...prev, newWorkflow]);
      setCreateModalVisible(false);
      createForm.resetFields();
      message.success('工作流创建成功');
      
      // 跳转到工作流设计器
      globalState.selectWorkflow(newWorkflow);
      
    } catch (error) {
      console.error('创建工作流失败:', error);
      message.error('创建工作流失败');
    }
  };

  /**
   * 编辑工作流
   */
  const handleEditWorkflow = async (values: any) => {
    if (!selectedWorkflow) return;
    
    try {
      const updatedWorkflow = {
        ...selectedWorkflow,
        name: values.name,
        description: values.description,
        tags: values.tags || [],
        updatedAt: new Date()
      };
      
      setWorkflows(prev => prev.map(w => w.id === selectedWorkflow.id ? updatedWorkflow : w));
      setEditModalVisible(false);
      setSelectedWorkflow(null);
      editForm.resetFields();
      message.success('工作流更新成功');
      
    } catch (error) {
      console.error('更新工作流失败:', error);
      message.error('更新工作流失败');
    }
  };

  /**
   * 删除工作流
   */
  const handleDeleteWorkflow = async (workflowId: string) => {
    try {
      setWorkflows(prev => prev.filter(w => w.id !== workflowId));
      message.success('工作流删除成功');
    } catch (error) {
      console.error('删除工作流失败:', error);
      message.error('删除工作流失败');
    }
  };

  /**
   * 复制工作流
   */
  const handleCopyWorkflow = async (workflow: Workflow) => {
    try {
      const copiedWorkflow: Workflow = {
        ...workflow,
        id: `wf-${Date.now()}`,
        name: `${workflow.name} (副本)`,
        status: WorkflowStatus.DRAFT,
        createdAt: new Date(),
        updatedAt: new Date(),
        executionCount: 0,
        successRate: 0
      };
      
      setWorkflows(prev => [...prev, copiedWorkflow]);
      message.success('工作流复制成功');
    } catch (error) {
      console.error('复制工作流失败:', error);
      message.error('复制工作流失败');
    }
  };

  /**
   * 启动/暂停/停止工作流
   */
  const handleWorkflowAction = async (workflowId: string, action: 'start' | 'pause' | 'stop') => {
    try {
      let newStatus: WorkflowStatus;
      let actionText: string;
      
      switch (action) {
        case 'start':
          newStatus = WorkflowStatus.ACTIVE;
          actionText = '启动';
          break;
        case 'pause':
          newStatus = WorkflowStatus.PAUSED;
          actionText = '暂停';
          break;
        case 'stop':
          newStatus = WorkflowStatus.STOPPED;
          actionText = '停止';
          break;
      }
      
      setWorkflows(prev => prev.map(w => 
        w.id === workflowId ? { ...w, status: newStatus, updatedAt: new Date() } : w
      ));
      
      message.success(`工作流${actionText}成功`);
    } catch (error) {
      console.error(`工作流操作失败:`, error);
      message.error('工作流操作失败');
    }
  };

  /**
   * 获取状态标签
   */
  const getStatusTag = (status: WorkflowStatus) => {
    const statusConfig = {
      [WorkflowStatus.DRAFT]: { color: 'default', text: '草稿' },
      [WorkflowStatus.ACTIVE]: { color: 'success', text: '运行中' },
      [WorkflowStatus.PAUSED]: { color: 'warning', text: '已暂停' },
      [WorkflowStatus.STOPPED]: { color: 'default', text: '已停止' },
      [WorkflowStatus.ERROR]: { color: 'error', text: '错误' }
    };
    
    const config = statusConfig[status] || statusConfig[WorkflowStatus.DRAFT];
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  /**
   * 表格列定义
   */
  const columns = [
    {
      title: '工作流名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: Workflow) => (
        <div>
          <div style={{ fontWeight: 500, marginBottom: 4 }}>{text}</div>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            版本 {record.version} • 创建于 {record.createdAt?.toLocaleDateString() || '未知'}
          </Text>
        </div>
      )
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (text: string) => (
        <Tooltip title={text}>
          <Text type="secondary">{text}</Text>
        </Tooltip>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: WorkflowStatus) => getStatusTag(status)
    },
    {
      title: '作者',
      dataIndex: 'author',
      key: 'author',
      width: 100,
      render: (author: string) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Avatar size="small" icon={<UserOutlined />} />
          <Text>{author}</Text>
        </div>
      )
    },
    {
      title: '执行统计',
      key: 'statistics',
      width: 150,
      render: (record: Workflow) => (
        <div>
          <div style={{ fontSize: '12px', marginBottom: 2 }}>
            执行次数: {record.executionCount || 0}
          </div>
          <div style={{ fontSize: '12px' }}>
            成功率: {(record.successRate || 0).toFixed(1)}%
          </div>
        </div>
      )
    },
    {
      title: '标签',
      dataIndex: 'tags',
      key: 'tags',
      width: 150,
      render: (tags: string[]) => (
        <div>
          {tags?.slice(0, 2).map(tag => (
            <Tag key={tag} style={{ marginBottom: 2, fontSize: '12px' }}>{tag}</Tag>
          ))}
          {tags?.length > 2 && (
            <Tag style={{ marginBottom: 2, fontSize: '12px' }}>+{tags.length - 2}</Tag>
          )}
        </div>
      )
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      render: (record: Workflow) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button 
              size="small" 
              icon={<EyeOutlined />} 
              onClick={() => {
                setSelectedWorkflow(record);
                setDetailModalVisible(true);
              }}
            />
          </Tooltip>
          
          <Tooltip title="编辑">
            <Button 
              size="small" 
              icon={<EditOutlined />} 
              onClick={() => {
                setSelectedWorkflow(record);
                editForm.setFieldsValue({
                  name: record.name,
                  description: record.description,
                  tags: record.tags
                });
                setEditModalVisible(true);
              }}
            />
          </Tooltip>
          
          {record.status === WorkflowStatus.ACTIVE ? (
            <Tooltip title="暂停">
              <Button 
                size="small" 
                icon={<PauseCircleOutlined />} 
                onClick={() => handleWorkflowAction(record.id, 'pause')}
              />
            </Tooltip>
          ) : (
            <Tooltip title="启动">
              <Button 
                size="small" 
                icon={<PlayCircleOutlined />} 
                type="primary"
                onClick={() => handleWorkflowAction(record.id, 'start')}
              />
            </Tooltip>
          )}
          
          <Tooltip title="复制">
            <Button 
              size="small" 
              icon={<CopyOutlined />} 
              onClick={() => handleCopyWorkflow(record)}
            />
          </Tooltip>
          
          <Popconfirm
            title="确定要删除这个工作流吗？"
            onConfirm={() => handleDeleteWorkflow(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Tooltip title="删除">
              <Button 
                size="small" 
                icon={<DeleteOutlined />} 
                danger
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      )
    }
  ];

  // 组件挂载时加载数据
  useEffect(() => {
    loadWorkflows();
  }, []);

  return (
    <div className="workflow-manager">
      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="总工作流"
              value={statistics.total}
              prefix={<SettingOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="运行中"
              value={statistics.active}
              prefix={<PlayCircleOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已暂停"
              value={statistics.paused}
              prefix={<PauseCircleOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="错误"
              value={statistics.error}
              prefix={<ExclamationCircleOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 工作流列表 */}
      <Card 
        title="工作流管理" 
        extra={
          <Space>
            <Button icon={<ImportOutlined />}>导入</Button>
            <Button icon={<ExportOutlined />}>导出</Button>
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={() => setCreateModalVisible(true)}
            >
              创建工作流
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={workflows}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 个工作流`
          }}
          locale={{
            emptyText: (
              <Empty
                description="暂无工作流"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              >
                <Button 
                  type="primary" 
                  icon={<PlusOutlined />}
                  onClick={() => setCreateModalVisible(true)}
                >
                  创建第一个工作流
                </Button>
              </Empty>
            )
          }}
        />
      </Card>

      {/* 创建工作流模态框 */}
      <Modal
        title="创建新工作流"
        open={createModalVisible}
        onCancel={() => {
          setCreateModalVisible(false);
          createForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={createForm}
          layout="vertical"
          onFinish={handleCreateWorkflow}
        >
          <Form.Item
            name="name"
            label="工作流名称"
            rules={[{ required: true, message: '请输入工作流名称' }]}
          >
            <Input placeholder="请输入工作流名称" />
          </Form.Item>
          
          <Form.Item
            name="description"
            label="描述"
            rules={[{ required: true, message: '请输入工作流描述' }]}
          >
            <TextArea rows={4} placeholder="请输入工作流描述" />
          </Form.Item>
          
          <Form.Item
            name="tags"
            label="标签"
          >
            <Select
              mode="tags"
              placeholder="请输入标签"
              options={[
                { value: '自动化', label: '自动化' },
                { value: '数据处理', label: '数据处理' },
                { value: '文档处理', label: '文档处理' },
                { value: '客户服务', label: '客户服务' },
                { value: 'NLP', label: 'NLP' },
                { value: '数据分析', label: '数据分析' }
              ]}
            />
          </Form.Item>
          
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => {
                setCreateModalVisible(false);
                createForm.resetFields();
              }}>
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                创建
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 编辑工作流模态框 */}
      <Modal
        title="编辑工作流"
        open={editModalVisible}
        onCancel={() => {
          setEditModalVisible(false);
          setSelectedWorkflow(null);
          editForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={handleEditWorkflow}
        >
          <Form.Item
            name="name"
            label="工作流名称"
            rules={[{ required: true, message: '请输入工作流名称' }]}
          >
            <Input placeholder="请输入工作流名称" />
          </Form.Item>
          
          <Form.Item
            name="description"
            label="描述"
            rules={[{ required: true, message: '请输入工作流描述' }]}
          >
            <TextArea rows={4} placeholder="请输入工作流描述" />
          </Form.Item>
          
          <Form.Item
            name="tags"
            label="标签"
          >
            <Select
              mode="tags"
              placeholder="请输入标签"
              options={[
                { value: '自动化', label: '自动化' },
                { value: '数据处理', label: '数据处理' },
                { value: '文档处理', label: '文档处理' },
                { value: '客户服务', label: '客户服务' },
                { value: 'NLP', label: 'NLP' },
                { value: '数据分析', label: '数据分析' }
              ]}
            />
          </Form.Item>
          
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => {
                setEditModalVisible(false);
                setSelectedWorkflow(null);
                editForm.resetFields();
              }}>
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                保存
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 工作流详情模态框 */}
      <Modal
        title="工作流详情"
        open={detailModalVisible}
        onCancel={() => {
          setDetailModalVisible(false);
          setSelectedWorkflow(null);
        }}
        footer={[
          <Button key="close" onClick={() => {
            setDetailModalVisible(false);
            setSelectedWorkflow(null);
          }}>
            关闭
          </Button>,
          <Button 
            key="edit" 
            type="primary"
            onClick={() => {
              if (selectedWorkflow) {
                globalState.selectWorkflow(selectedWorkflow);
                setDetailModalVisible(false);
                setSelectedWorkflow(null);
                // 这里可以跳转到工作流设计器页面
                window.location.href = '/workflow-designer';
              }
            }}
          >
            编辑工作流
          </Button>
        ]}
        width={800}
      >
        {selectedWorkflow && (
          <div>
            <Row gutter={16}>
              <Col span={12}>
                <div style={{ marginBottom: 16 }}>
                  <Text strong>工作流名称：</Text>
                  <div>{selectedWorkflow.name}</div>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <Text strong>描述：</Text>
                  <div>{selectedWorkflow.description}</div>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <Text strong>状态：</Text>
                  <div>{getStatusTag(selectedWorkflow.status || WorkflowStatus.DRAFT)}</div>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <Text strong>版本：</Text>
                  <div>{selectedWorkflow.version}</div>
                </div>
              </Col>
              <Col span={12}>
                <div style={{ marginBottom: 16 }}>
                  <Text strong>作者：</Text>
                  <div>{selectedWorkflow.author}</div>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <Text strong>创建时间：</Text>
                  <div>{selectedWorkflow.createdAt?.toLocaleString() || '未知'}</div>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <Text strong>更新时间：</Text>
                  <div>{selectedWorkflow.updatedAt?.toLocaleString() || '未知'}</div>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <Text strong>执行统计：</Text>
                  <div>
                    执行次数: {selectedWorkflow.executionCount || 0}<br/>
                    成功率: {(selectedWorkflow.successRate || 0).toFixed(1)}%
                  </div>
                </div>
              </Col>
            </Row>
            
            {selectedWorkflow.tags && selectedWorkflow.tags.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <Text strong>标签：</Text>
                <div style={{ marginTop: 8 }}>
                  {selectedWorkflow.tags.map(tag => (
                    <Tag key={tag}>{tag}</Tag>
                  ))}
                </div>
              </div>
            )}
            
            <Divider />
            
            <div>
              <Text strong>节点信息：</Text>
              <div style={{ marginTop: 8 }}>
                <Text type="secondary">
                  节点数量: {selectedWorkflow.nodes?.length || 0}<br/>
                  连接数量: {selectedWorkflow.connections?.length || 0}
                </Text>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default WorkflowManager;