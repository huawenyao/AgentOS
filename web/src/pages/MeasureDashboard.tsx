import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, Empty } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, DollarOutlined, CheckCircleOutlined, ClockCircleOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { metricsApi } from '../services/api';

export default function MeasureDashboard() {
  const [overview, setOverview] = useState<any>(null);
  const [costs, setCosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [o, c] = await Promise.all([metricsApi.overview(), metricsApi.costs()]);
      setOverview(o.data);
      setCosts(c.data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const costColumns = [
    { title: 'Agent', dataIndex: 'agent_name', key: 'name' },
    { title: 'Calls', dataIndex: 'calls', key: 'calls' },
    { title: 'Total Cost', dataIndex: 'total_cost_cents', key: 'cost', render: (c: number) => `¥${((c || 0) / 100).toFixed(2)}` },
    { title: 'Total Tokens', dataIndex: 'total_tokens', key: 'tokens', render: (t: number) => (t || 0).toLocaleString() },
    { title: 'Avg Cost/Call', key: 'avg', render: (_: any, r: any) => r.calls > 0 ? `¥${((r.total_cost_cents || 0) / r.calls / 100).toFixed(3)}` : '-' },
  ];

  if (!overview && !loading) {
    return <div><h2>Measure</h2><Card><Empty description="No data yet. Run some workflows first." /></Card></div>;
  }

  return (
    <div>
      <h2>Measure Dashboard</h2>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Runs"
              value={overview?.total_runs || 0}
              prefix={<ThunderboltOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Success Rate"
              value={overview?.success_rate || 0}
              suffix="%"
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: (overview?.success_rate || 0) >= 90 ? '#3f8600' : '#cf1322' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Cost"
              value={`¥${((overview?.total_cost_cents || 0) / 100).toFixed(2)}`}
              prefix={<DollarOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Approval Pass Rate"
              value={overview?.approval_pass_rate || 0}
              suffix="%"
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={24}>
          <Card title="Cost Breakdown by Agent">
            <Table dataSource={costs} columns={costColumns} rowKey="agent_name" size="small" pagination={false} loading={loading} />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
