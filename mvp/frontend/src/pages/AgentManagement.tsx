import React from 'react';
import { Card, Table, Button, Tag, Space, Modal, Form, Input, Select } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';

const AgentManagement: React.FC = () => {
  const mockAgents = [
    {
      id: '1',
      name: '数据分析师',
      type: 'execution',
      status: 'active',
      skills: ['数据分析', '统计', '可视化'],
      successRate: 95,
      tasksCompleted: 156,
      createdAt: '2024-01-10'
    },
    {
      id: '2',
      name: '机器学习工程师',
      type: 'execution',
      status: 'active',
      skills: ['机器学习', '深度学习', 'Python'],
      successRate: 88,
      tasksCompleted: 89,
      createdAt: '2024-01-12'
    },
    {
      id: '3',
      name: '领域专家',
      type: 'planning',
      status: 'idle',
      skills: ['领域知识', '风险评估', '合规'],
      successRate: 92,
      tasksCompleted: 234,
      createdAt: '2024-01-08'
    }
  ];

  const columns = [
    {
      title: '智能体名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Tag color={type === 'execution' ? 'blue' : 'green'}>
          {type === 'execution' ? '执行型' : '规划型'}
        </Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : 'default'}>
          {status === 'active' ? '活跃' : '空闲'}
        </Tag>
      ),
    },
    {
      title: '技能',
      dataIndex: 'skills',
      key: 'skills',
      render: (skills: string[]) => (
        <>
          {skills.map(skill => (
            <Tag key={skill}>{skill}</Tag>
          ))}
        </>
      ),
    },
    {
      title: '成功率',
      dataIndex: 'successRate',
      key: 'successRate',
      render: (rate: number) => `${rate}%`,
    },
    {
      title: '完成任务',
      dataIndex: 'tasksCompleted',
      key: 'tasksCompleted',
    },
    {
      title: '操作',
      key: 'actions',
      render: () => (
        <Space>
          <Button icon={<EditOutlined />} size="small" />
          <Button icon={<DeleteOutlined />} size="small" danger />
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2>智能体管理</h2>
        <Button type="primary" icon={<PlusOutlined />}>
          创建智能体
        </Button>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={mockAgents}
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

export default AgentManagement;