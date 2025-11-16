import React from 'react';
import { Card, List, Avatar, Button, Tag, Progress, Timeline } from 'antd';
import { TeamOutlined, MessageOutlined, PlusOutlined } from '@ant-design/icons';

const Collaboration: React.FC = () => {
  const mockCollaborations = [
    {
      id: '1',
      name: '金融市场风险分析协作',
      participants: ['数据分析师', '机器学习工程师', '领域专家'],
      status: 'active',
      progress: 65,
      messageCount: 24,
      startTime: '2024-01-16 14:10:00'
    },
    {
      id: '2',
      name: '智能体系统优化',
      participants: ['协调员', '质量审核员'],
      status: 'completed',
      progress: 100,
      messageCount: 18,
      startTime: '2024-01-16 13:30:00'
    },
    {
      id: '3',
      name: '新功能开发规划',
      participants: ['规划智能体', '执行智能体'],
      status: 'pending',
      progress: 0,
      messageCount: 5,
      startTime: '2024-01-16 15:00:00'
    }
  ];

  const mockMessages = [
    {
      sender: '数据分析师',
      content: '请提供最新的市场数据和历史价格走势',
      timestamp: '14:25:15'
    },
    {
      sender: '领域专家',
      content: '重点关注流动性风险和信用风险指标',
      timestamp: '14:26:32'
    },
    {
      sender: '机器学习工程师',
      content: 'LSTM模型训练完成，准确率达到92%',
      timestamp: '14:28:45'
    },
    {
      sender: '数据分析师',
      content: '初步分析显示中等风险水平，建议增加对冲',
      timestamp: '14:30:12'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'processing';
      case 'completed': return 'success';
      case 'pending': return 'warning';
      default: return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return '进行中';
      case 'completed': return '已完成';
      case 'pending': return '等待中';
      default: return '未知';
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2>协作工作流</h2>
        <Button type="primary" icon={<PlusOutlined />}>
          发起协作
        </Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: 16 }}>
        {mockCollaborations.map(collab => (
          <Card key={collab.id} size="small">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h4 style={{ margin: '0 0 8px 0' }}>{collab.name}</h4>
                <div style={{ marginBottom: 8 }}>
                  {collab.participants.map((participant, index) => (
                    <Tag key={index} style={{ margin: '2px' }}>
                      {participant}
                    </Tag>
                  ))}
                </div>
                <div style={{ fontSize: '12px', color: '#999' }}>
                  开始时间: {collab.startTime}
                </div>
              </div>
              <div>
                <Tag color={getStatusColor(collab.status)}>
                  {getStatusText(collab.status)}
                </Tag>
              </div>
            </div>
            <div style={{ marginTop: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: '12px' }}>进度</span>
                <span style={{ fontSize: '12px' }}>{collab.progress}%</span>
              </div>
              <Progress percent={collab.progress} size="small" />
              <div style={{ marginTop: 8, textAlign: 'center' }}>
                <Button size="small" icon={<MessageOutlined />}>
                  查看消息 ({collab.messageCount})
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card title="最新协作消息" extra={<TeamOutlined />}>
        <Timeline>
          {mockMessages.map((message, index) => (
            <Timeline.Item key={index}>
              <div style={{ paddingBottom: index < mockMessages.length - 1 ? 16 : 0 }}>
                <div style={{ fontWeight: 'bold', marginBottom: 4 }}>
                  {message.sender}
                  <span style={{ fontWeight: 'normal', color: '#999', marginLeft: 8 }}>
                    {message.timestamp}
                  </span>
                </div>
                <div style={{ color: '#666' }}>
                  {message.content}
                </div>
              </div>
            </Timeline.Item>
          ))}
        </Timeline>
      </Card>
    </div>
  );
};

export default Collaboration;