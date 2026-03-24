import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Empty } from 'antd';
import { ThunderboltOutlined, DollarOutlined, EyeOutlined } from '@ant-design/icons';
import { metricsApi } from '../services/api';

export default function MeasureDashboard() {
  const [data, setData] = useState<any>(null);
  useEffect(() => { metricsApi.overview().then(r => setData(r.data)).catch(() => {}); }, []);

  if (!data) return <Card><Empty description="No data yet" /></Card>;

  return (
    <div>
      <h2 style={{ marginBottom: 16 }}>Measure</h2>
      <Row gutter={16}>
        <Col span={8}>
          <Card><Statistic title="Total Sessions" value={data.total_sessions} prefix={<ThunderboltOutlined />} /></Card>
        </Col>
        <Col span={8}>
          <Card><Statistic title="Total Cost" value={`¥${(data.total_cost_cents / 100).toFixed(2)}`} prefix={<DollarOutlined />} /></Card>
        </Col>
        <Col span={8}>
          <Card><Statistic title="Visuals Generated" value={data.total_visuals} prefix={<EyeOutlined />} /></Card>
        </Col>
      </Row>
    </div>
  );
}
