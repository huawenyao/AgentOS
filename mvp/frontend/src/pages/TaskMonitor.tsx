import React from 'react';
import { Card, Table, Tag, Progress, Space, Button } from 'antd';
import { PlayCircleOutlined, PauseCircleOutlined, ReloadOutlined } from '@ant-design/icons';

const TaskMonitor: React.FC = () => {
  const mockTasks = [
    {
      id: '1',
      name: '金融风险评估分析',
      agent: '数据分析师',
      status: 'running',
      progress: 75,
      priority: 'high',
      startTime: '2024-01-16 14:25:00',
      estimatedTime: '15分钟'
    },
    {
      id: '2',
      name: '机器学习模型训练',
      agent: '机器学习工程师',
      status: 'completed',
      progress: 100,
      priority: 'medium',
      startTime: '2024-01-16 13:45:00',
      estimatedTime: '45分钟'
    },
    {
      id: '3',
      name: '合规性检查',
      agent: '质量审核员',
      status: 'pending',
      progress: 0,
      priority: 'low',
      startTime: '-',
      estimatedTime: '10分钟'
    },
    {
      id: '4',
      name: '投资组合分析',
      agent: '领域专家',
      status: 'failed',
      progress: 30,
      priority: 'high',
      startTime: '2024-01-16 14:10:00',
      estimatedTime: '20分钟'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'processing';
      case 'completed': return 'success';
      case 'failed': return 'error';
      case 'pending': return 'warning';
      default: return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'running': return '运行中';
      case 'completed': return '已完成';
      case 'failed': return '失败';
      case 'pending': return '等待中';
      default: return '未知';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'red';
      case 'medium': return 'orange';
      case 'low': return 'green';
      default: return 'default';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'high': return '高';
      case 'medium': return '中';
      case 'low': return '低';
      default: return '未知';
    }
  };

  const columns = [
    {
      title: '任务名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '执行智能体',
      dataIndex: 'agent',
      key: 'agent',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>
          {getStatusText(status)}
        </Tag>
      ),
    },
    {
      title: '进度',
      dataIndex: 'progress',
      key: 'progress',
      render: (progress: number) => (
        <Progress percent={progress} size="small" />
      ),
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority: string) => (
        <Tag color={getPriorityColor(priority)}>
          {getPriorityText(priority)}
        </Tag>
      ),
    },
    {
      title: '开始时间',
      dataIndex: 'startTime',
      key: 'startTime',
    },
    {
      title: '预计用时',
      dataIndex: 'estimatedTime',
      key: 'estimatedTime',
    },
    {
      title: '操作',
      key: 'actions',
      render: (record: any) => (
        <Space>
          {record.status === 'running' ? (
            <Button icon={<PauseCircleOutlined />} size="small" />
          ) : (
            <Button icon={<PlayCircleOutlined />} size="small" />
          )}
          <Button icon={<ReloadOutlined />} size="small" />
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2>任务监控</h2>
        <Space>
          <Button>刷新</Button>
          <Button type="primary">新建任务</Button>
        </Space>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={mockTasks}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
          }}
        />
      </Card>
    </div>
  );
};

export default TaskMonitor;