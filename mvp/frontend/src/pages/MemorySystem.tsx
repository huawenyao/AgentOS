import React from 'react';
import { Card, Row, Col, Statistic, Progress, List, Avatar, Button } from 'antd';
import { DatabaseOutlined, CloudUploadOutlined, DeleteOutlined } from '@ant-design/icons';

const MemorySystem: React.FC = () => {
  const mockMemories = [
    {
      id: '1',
      type: '工作记忆',
      content: '当前任务：金融风险评估分析',
      size: '2.3MB',
      timestamp: '2024-01-16 14:32:15'
    },
    {
      id: '2',
      type: '短期记忆',
      content: '任务链状态：数据分析 -> 模型训练 -> 结果验证',
      size: '1.8MB',
      timestamp: '2024-01-16 14:28:42'
    },
    {
      id: '3',
      type: '长期记忆',
      content: '领域知识：金融市场分析框架和风险评估模型',
      size: '15.6MB',
      timestamp: '2024-01-16 14:15:30'
    }
  ];

  return (
    <div>
      <h2>记忆系统</h2>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="工作记忆"
              value={68}
              suffix="%"
              prefix={<DatabaseOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
            <Progress percent={68} size="small" style={{ marginTop: 16 }} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="短期记忆"
              value={2847}
              suffix="条"
              prefix={<DatabaseOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="压缩效率"
              value={85}
              suffix="%"
              prefix={<DatabaseOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      <Card title="记忆条目" extra={
        <Button type="primary" icon={<CloudUploadOutlined />}>
          备份记忆
        </Button>
      }>
        <List
          dataSource={mockMemories}
          renderItem={(item) => (
            <List.Item
              actions={[
                <Button icon={<DeleteOutlined />} size="small" danger />
              ]}
            >
              <List.Item.Meta
                avatar={<Avatar icon={<DatabaseOutlined />} />}
                title={item.type}
                description={
                  <div>
                    <div>{item.content}</div>
                    <div style={{ marginTop: 4 }}>
                      <span style={{ marginRight: 16 }}>大小: {item.size}</span>
                      <span style={{ color: '#999' }}>{item.timestamp}</span>
                    </div>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
};

export default MemorySystem;