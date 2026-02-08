import React, { useEffect, useState } from 'react';
import { Card, Table, Tag, Button, Modal, Descriptions, message, Space, Badge, Empty } from 'antd';
import { CheckOutlined, CloseOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { approvalApi } from '../services/api';

export default function Approvals() {
  const [approvals, setApprovals] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<any>(null);

  const load = async () => {
    setLoading(true);
    const res = await approvalApi.list();
    setApprovals(res.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const decide = async (id: string, decision: string) => {
    try {
      await approvalApi.decide(id, decision, 'admin');
      message.success(`Approval ${decision}`);
      setSelected(null);
      load();
    } catch (e: any) {
      message.error(e.response?.data?.detail || 'Failed');
    }
  };

  const pending = approvals.filter(a => !a.decision);
  const decided = approvals.filter(a => a.decision);

  const columns = [
    { title: 'Tool', dataIndex: 'tool_name', key: 'tool', render: (t: string) => <Tag color="purple">{t}</Tag> },
    { title: 'Agent Reasoning', dataIndex: 'agent_reasoning', key: 'reason', ellipsis: true },
    { title: 'Status', key: 'status', render: (_: any, r: any) => (
      r.decision ? <Tag color={r.decision === 'approved' ? 'green' : 'red'}>{r.decision}</Tag> : <Tag color="orange">Pending</Tag>
    )},
    { title: 'Actions', key: 'actions', render: (_: any, r: any) => (
      !r.decision ? (
        <Space>
          <Button size="small" type="primary" icon={<CheckOutlined />} onClick={() => decide(r.id, 'approved')}>Approve</Button>
          <Button size="small" danger icon={<CloseOutlined />} onClick={() => decide(r.id, 'rejected')}>Reject</Button>
        </Space>
      ) : <span style={{ color: '#888' }}>Decided by {r.decided_by}</span>
    )},
  ];

  return (
    <div>
      <h2>Approval Queue</h2>

      {pending.length > 0 && (
        <Card title={<><ExclamationCircleOutlined style={{ color: '#faad14' }} /> Pending ({pending.length})</>} style={{ marginBottom: 16 }}>
          <Table dataSource={pending} columns={columns} rowKey="id" size="small" pagination={false} />
        </Card>
      )}

      {pending.length === 0 && (
        <Card style={{ marginBottom: 16 }}>
          <Empty description="No pending approvals" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        </Card>
      )}

      <Card title={`History (${decided.length})`}>
        <Table dataSource={decided} columns={columns} rowKey="id" size="small" pagination={{ pageSize: 10 }} />
      </Card>
    </div>
  );
}
