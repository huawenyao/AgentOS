import React, { useEffect, useState } from 'react';
import { Card, Table, Tag, Button, Drawer, Timeline, Descriptions, Space, Badge, Empty, Statistic, Row, Col } from 'antd';
import { ReloadOutlined, CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined, LoadingOutlined } from '@ant-design/icons';
import { runApi } from '../services/api';

const statusColors: any = {
  running: 'processing', completed: 'success', failed: 'error', waiting_approval: 'warning', cancelled: 'default',
};
const statusIcons: any = {
  running: <LoadingOutlined />, completed: <CheckCircleOutlined />, failed: <CloseCircleOutlined />,
  waiting_approval: <ClockCircleOutlined />,
};

export default function RunMonitor() {
  const [runs, setRuns] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<any>(null);
  const [nodeExecs, setNodeExecs] = useState<any[]>([]);

  const load = async () => {
    setLoading(true);
    const res = await runApi.list({ limit: 50 });
    setRuns(res.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openDetail = async (run: any) => {
    setDetail(run);
    const res = await runApi.getNodes(run.id);
    setNodeExecs(res.data);
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', render: (id: string) => id.substring(0, 8) },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (s: string) => <Badge status={statusColors[s]} text={s} /> },
    { title: 'Cost', dataIndex: 'total_cost_cents', key: 'cost', render: (c: number) => `¥${(c / 100).toFixed(2)}` },
    { title: 'Tokens', dataIndex: 'total_llm_tokens', key: 'tokens', render: (t: number) => t?.toLocaleString() },
    { title: 'Started', dataIndex: 'started_at', key: 'start', render: (t: string) => t ? new Date(t).toLocaleString() : '-' },
    { title: 'Actions', key: 'actions', render: (_: any, r: any) => <Button size="small" onClick={() => openDetail(r)}>Detail</Button> },
  ];

  // Summary stats
  const completed = runs.filter(r => r.status === 'completed').length;
  const failed = runs.filter(r => r.status === 'failed').length;
  const totalCost = runs.reduce((s, r) => s + (r.total_cost_cents || 0), 0);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>Run Monitor</h2>
        <Button icon={<ReloadOutlined />} onClick={load}>Refresh</Button>
      </div>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}><Card><Statistic title="Total Runs" value={runs.length} /></Card></Col>
        <Col span={6}><Card><Statistic title="Completed" value={completed} valueStyle={{ color: '#52c41a' }} /></Card></Col>
        <Col span={6}><Card><Statistic title="Failed" value={failed} valueStyle={{ color: '#ff4d4f' }} /></Card></Col>
        <Col span={6}><Card><Statistic title="Total Cost" value={`¥${(totalCost / 100).toFixed(2)}`} /></Card></Col>
      </Row>

      <Card>
        <Table dataSource={runs} columns={columns} rowKey="id" loading={loading} size="small" pagination={{ pageSize: 15 }} />
      </Card>

      <Drawer title={`Run ${detail?.id?.substring(0, 8)}`} open={!!detail} onClose={() => setDetail(null)} width={600}>
        {detail && (
          <>
            <Descriptions column={2} size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="Status"><Badge status={statusColors[detail.status]} text={detail.status} /></Descriptions.Item>
              <Descriptions.Item label="Cost">¥{(detail.total_cost_cents / 100).toFixed(2)}</Descriptions.Item>
              <Descriptions.Item label="Tokens">{detail.total_llm_tokens?.toLocaleString()}</Descriptions.Item>
              <Descriptions.Item label="Started">{detail.started_at ? new Date(detail.started_at).toLocaleString() : '-'}</Descriptions.Item>
            </Descriptions>
            {detail.error && <Card size="small" style={{ marginBottom: 16, background: '#fff1f0' }}><strong>Error:</strong> {detail.error}</Card>}

            <h4>Node Executions</h4>
            <Timeline>
              {nodeExecs.map(ne => (
                <Timeline.Item key={ne.id} color={ne.status === 'completed' ? 'green' : ne.status === 'failed' ? 'red' : 'blue'}
                  dot={statusIcons[ne.status]}>
                  <div>
                    <strong>{ne.node_name}</strong> <Tag>{ne.node_type}</Tag> <Badge status={statusColors[ne.status]} text={ne.status} />
                  </div>
                  <div style={{ fontSize: 12, color: '#888' }}>
                    {ne.cost_cents > 0 && <Tag>¥{(ne.cost_cents / 100).toFixed(2)}</Tag>}
                    {ne.llm_tokens > 0 && <Tag>{ne.llm_tokens} tokens</Tag>}
                  </div>
                  {ne.output_data && <pre style={{ fontSize: 11, maxHeight: 100, overflow: 'auto', background: '#f5f5f5', padding: 4, borderRadius: 4 }}>
                    {JSON.stringify(ne.output_data, null, 2).substring(0, 500)}
                  </pre>}
                  {ne.error && <div style={{ color: '#ff4d4f', fontSize: 12 }}>{ne.error}</div>}
                </Timeline.Item>
              ))}
            </Timeline>
          </>
        )}
      </Drawer>
    </div>
  );
}
