import React, { useState, useEffect } from 'react';
import {
  Row,
  Col,
  Card,
  Statistic,
  Progress,
  Timeline,
  List,
  Avatar,
  Typography,
  Space,
  Badge,
  Table,
  Tag,
  Button
} from 'antd';
import {
  RobotOutlined,
  DatabaseOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  TrophyOutlined
} from '@ant-design/icons';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

interface DashboardData {
  agents: {
    total: number;
    active: number;
    idle: number;
    error: number;
  };
  tasks: {
    completed: number;
    running: number;
    failed: number;
    total: number;
  };
  memory: {
    working_usage: number;
    long_term_count: number;
    compression_efficiency: number;
  };
  performance: Array<{
    time: string;
    tasks: number;
    agents: number;
    success_rate: number;
  }>;
  recent_activities: Array<{
    id: string;
    type: string;
    description: string;
    timestamp: string;
    agent?: string;
  }>;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 模拟数据加载
    setTimeout(() => {
      setData({
        agents: {
          total: 12,
          active: 7,
          idle: 4,
          error: 1
        },
        tasks: {
          completed: 156,
          running: 8,
          failed: 3,
          total: 167
        },
        memory: {
          working_usage: 68,
          long_term_count: 2847,
          compression_efficiency: 85
        },
        performance: [
          { time: '00:00', tasks: 12, agents: 8, success_rate: 94 },
          { time: '04:00', tasks: 8, agents: 6, success_rate: 96 },
          { time: '08:00', tasks: 25, agents: 10, success_rate: 92 },
          { time: '12:00', tasks: 35, agents: 12, success_rate: 95 },
          { time: '16:00', tasks: 28, agents: 11, success_rate: 93 },
          { time: '20:00', tasks: 18, agents: 9, success_rate: 97 }
        ],
        recent_activities: [
          {
            id: '1',
            type: 'task_completed',
            description: '数据分析任务完成',
            timestamp: '2024-01-16 14:32:15',
            agent: 'execution_agent_analyst'
          },
          {
            id: '2',
            type: 'agent_created',
            description: '新的规划智能体已创建',
            timestamp: '2024-01-16 14:28:42'
          },
          {
            id: '3',
            type: 'memory_consolidated',
            description: '记忆系统完成压缩整合',
            timestamp: '2024-01-16 14:15:30'
          },
          {
            id: '4',
            type: 'collaboration_started',
            description: '多智能体协作任务启动',
            timestamp: '2024-01-16 14:10:22'
          }
        ]
      });
      setLoading(false);
    }, 1000);
  }, []);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'task_completed':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'agent_created':
        return <RobotOutlined style={{ color: '#1890ff' }} />;
      case 'memory_consolidated':
        return <DatabaseOutlined style={{ color: '#722ed1' }} />;
      case 'collaboration_started':
        return <TrophyOutlined style={{ color: '#fa8c16' }} />;
      default:
        return <ClockCircleOutlined style={{ color: '#8c8c8c' }} />;
    }
  };

  const getStatusColor = (value: number, type: 'success' | 'warning' | 'error') => {
    if (type === 'success') {
      return value > 80 ? '#52c41a' : value > 60 ? '#faad14' : '#ff4d4f';
    } else if (type === 'warning') {
      return value > 20 ? '#ff4d4f' : value > 10 ? '#faad14' : '#52c41a';
    } else {
      return value > 5 ? '#ff4d4f' : '#52c41a';
    }
  };

  if (loading) {
    return <div>加载中...</div>;
  }

  if (!data) {
    return <div>无法加载数据</div>;
  }

  return (
    <div>
      <Title level={2}>系统仪表盘</Title>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {/* 智能体状态统计 */}
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="智能体总数"
              value={data.agents.total}
              prefix={<RobotOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
            <div style={{ marginTop: 16 }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text type="secondary">活跃</Text>
                  <Badge count={data.agents.active} style={{ backgroundColor: '#52c41a' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text type="secondary">空闲</Text>
                  <Badge count={data.agents.idle} style={{ backgroundColor: '#1890ff' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text type="secondary">错误</Text>
                  <Badge count={data.agents.error} style={{ backgroundColor: '#ff4d4f' }} />
                </div>
              </Space>
            </div>
          </Card>
        </Col>

        {/* 任务统计 */}
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="任务完成率"
              value={Math.round((data.tasks.completed / data.tasks.total) * 100)}
              suffix="%"
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
            <div style={{ marginTop: 16 }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text type="secondary">已完成</Text>
                  <Text strong>{data.tasks.completed}</Text>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text type="secondary">进行中</Text>
                  <Text strong>{data.tasks.running}</Text>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text type="secondary">失败</Text>
                  <Text strong type="danger">{data.tasks.failed}</Text>
                </div>
              </Space>
            </div>
          </Card>
        </Col>

        {/* 记忆系统状态 */}
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="记忆使用率"
              value={data.memory.working_usage}
              suffix="%"
              prefix={<DatabaseOutlined />}
              valueStyle={{
                color: data.memory.working_usage > 80 ? '#ff4d4f' : '#1890ff'
              }}
            />
            <div style={{ marginTop: 16 }}>
              <Progress
                percent={data.memory.working_usage}
                size="small"
                strokeColor={data.memory.working_usage > 80 ? '#ff4d4f' : '#1890ff'}
              />
              <div style={{ marginTop: 8 }}>
                <Text type="secondary">长期记忆: {data.memory.long_term_count} 条</Text>
              </div>
            </div>
          </Card>
        </Col>

        {/* 系统效率 */}
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="压缩效率"
              value={data.memory.compression_efficiency}
              suffix="%"
              prefix={<TrophyOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
            <div style={{ marginTop: 16 }}>
              <Progress
                percent={data.memory.compression_efficiency}
                size="small"
                strokeColor="#52c41a"
              />
              <div style={{ marginTop: 8 }}>
                <Text type="secondary">系统运行良好</Text>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        {/* 性能趋势图 */}
        <Col xs={24} lg={16}>
          <Card title="系统性能趋势" extra={
            <Text type="secondary">过去24小时</Text>
          }>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.performance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="tasks"
                  stroke="#1890ff"
                  strokeWidth={2}
                  name="任务数"
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="agents"
                  stroke="#52c41a"
                  strokeWidth={2}
                  name="活跃智能体"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="success_rate"
                  stroke="#fa8c16"
                  strokeWidth={2}
                  name="成功率 (%)"
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        {/* 最近活动 */}
        <Col xs={24} lg={8}>
          <Card
            title="最近活动"
            extra={
              <Button
                type="link"
                onClick={() => navigate('/tasks')}
                style={{ padding: 0, height: 'auto' }}
              >
                查看全部
              </Button>
            }
          >
            <List
              dataSource={data.recent_activities}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar icon={getActivityIcon(item.type)} />}
                    title={
                      <Space>
                        <Text>{item.description}</Text>
                        {item.agent && (
                          <Tag color="blue">{item.agent}</Tag>
                        )}
                      </Space>
                    }
                    description={
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        {item.timestamp}
                      </Text>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;