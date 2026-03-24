/**
 * DynamicVisual — renders AI-generated visualizations.
 *
 * NOT an editor. A read-only renderer with click-to-ask:
 * clicking an element suggests a follow-up question to the chat.
 */
import React from 'react';
import { Card, Tag, Table, Statistic, Row, Col, Typography, Tooltip } from 'antd';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip as RTooltip, ResponsiveContainer, Legend } from 'recharts';

const C = ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1', '#13c2c2', '#eb2f96', '#fa8c16'];

interface Props {
  id?: string; type: string; title: string; data: any; description?: string;
  onClick?: (detail?: string) => void;
}

export default function DynamicVisual({ id, type, title, data, description, onClick }: Props) {
  return (
    <Card size="small" title={<><Tag color="purple">{type}</Tag> {title}</>}
      style={{ marginBottom: 12, cursor: onClick ? 'pointer' : 'default' }}
      extra={id && <Tag style={{ fontSize: 10 }}>#{id}</Tag>}>
      {description && <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 8, fontSize: 12 }}>{description}</Typography.Text>}
      {render(type, data, onClick)}
    </Card>
  );
}

function render(type: string, data: any, onClick?: (d?: string) => void) {
  switch (type) {
    case 'mindmap': case 'tree': case 'decision_tree': return <Tree data={data} onClick={onClick} />;
    case 'flowchart': return <Flow data={data} />;
    case 'network': return <Flow data={{ nodes: data.nodes, edges: (data.links || []).map((l: any) => ({ source: l.source, target: l.target, label: l.label })) }} />;
    case 'timeline': return <Timeline data={data} onClick={onClick} />;
    case 'bar_chart': return <BarVis data={data} onClick={onClick} />;
    case 'pie_chart': return <PieVis data={data} onClick={onClick} />;
    case 'table': return <TableVis data={data} />;
    case 'metric_cards': return <MetricCards data={data} />;
    default: return <pre style={{ fontSize: 11, maxHeight: 200, overflow: 'auto' }}>{JSON.stringify(data, null, 2)}</pre>;
  }
}

function Tree({ data, onClick }: { data: any; onClick?: (d?: string) => void }) {
  const renderNode = (node: any, depth = 0): React.ReactNode => {
    const color = C[depth % C.length];
    const label = node.label || node.center || node.question || '';
    return (
      <div key={label + depth} style={{ marginLeft: depth * 20 }}>
        <Tooltip title="点击追问此项">
          <div onClick={(e) => { e.stopPropagation(); onClick?.(`关于"${label}"再展开分析`); }}
            style={{ padding: '3px 8px', margin: '2px 0', borderLeft: depth > 0 ? `3px solid ${color}` : 'none',
              background: depth === 0 ? '#f0f5ff' : 'transparent', borderRadius: 4,
              fontWeight: depth === 0 ? 600 : 400, cursor: 'pointer', fontSize: 13 }}>
            {label} {node.value !== undefined && <Tag size="small">{node.value}</Tag>}
          </div>
        </Tooltip>
        {(node.children || node.branches || node.options || []).map((c: any) => renderNode(c, depth + 1))}
      </div>
    );
  };
  return <div style={{ padding: 4 }}>{renderNode(data)}</div>;
}

function Flow({ data }: { data: any }) {
  const nodes = data.nodes || [];
  const edges = data.edges || [];
  return (
    <div style={{ padding: 8, fontSize: 12 }}>
      {nodes.map((n: any, i: number) => (
        <span key={n.id || i} style={{ display: 'inline-block', padding: '4px 10px', margin: 3, border: '1px solid #1890ff', borderRadius: 6, background: '#f0f5ff' }}>
          {n.label || n.id}
        </span>
      ))}
      {edges.length > 0 && (
        <div style={{ marginTop: 6, color: '#888' }}>
          {edges.map((e: any, i: number) => (
            <div key={i}>→ {e.source} → {e.target} {e.label && `(${e.label})`}</div>
          ))}
        </div>
      )}
    </div>
  );
}

function Timeline({ data, onClick }: { data: any; onClick?: (d?: string) => void }) {
  return (
    <div style={{ padding: 4 }}>
      {(data.events || []).map((ev: any, i: number) => (
        <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 6, cursor: 'pointer', alignItems: 'flex-start' }}
          onClick={() => onClick?.(`${ev.date || ''}${ev.title}这个时间点发生了什么`)}>
          <div style={{ minWidth: 80, color: '#1890ff', fontWeight: 600, fontSize: 12 }}>{ev.date}</div>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: C[i % C.length], marginTop: 4, flexShrink: 0 }} />
          <div><div style={{ fontWeight: 500, fontSize: 13 }}>{ev.title}</div>
            {ev.description && <div style={{ fontSize: 11, color: '#888' }}>{ev.description}</div>}</div>
        </div>
      ))}
    </div>
  );
}

function BarVis({ data, onClick }: { data: any; onClick?: (d?: string) => void }) {
  const chartData = (data.labels || []).map((l: string, i: number) => {
    const pt: any = { name: l };
    (data.datasets || []).forEach((ds: any) => { pt[ds.label] = ds.values?.[i] || 0; });
    return pt;
  });
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={chartData} onClick={(e) => { if (e?.activeLabel) onClick?.(`${e.activeLabel}这个数据点的详情`); }}>
        <XAxis dataKey="name" fontSize={11} /><YAxis fontSize={11} /><RTooltip /><Legend />
        {(data.datasets || []).map((ds: any, i: number) => <Bar key={ds.label} dataKey={ds.label} fill={C[i % C.length]} />)}
      </BarChart>
    </ResponsiveContainer>
  );
}

function PieVis({ data, onClick }: { data: any; onClick?: (d?: string) => void }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie data={data.segments || []} dataKey="value" nameKey="label" cx="50%" cy="50%" outerRadius={75} label
          onClick={(e: any) => { if (e?.label) onClick?.(`${e.label}这部分的详细构成`); }}>
          {(data.segments || []).map((_: any, i: number) => <Cell key={i} fill={C[i % C.length]} />)}
        </Pie>
        <RTooltip /><Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

function TableVis({ data }: { data: any }) {
  const cols = (data.columns || []).map((c: string) => ({ title: c, dataIndex: c, key: c, ellipsis: true }));
  const rows = (data.rows || []).map((r: any[], i: number) => {
    const o: any = { key: i };
    (data.columns || []).forEach((c: string, j: number) => { o[c] = r[j]; });
    return o;
  });
  return <Table dataSource={rows} columns={cols} size="small" pagination={false} scroll={{ y: 200 }} />;
}

function MetricCards({ data }: { data: any }) {
  return (
    <Row gutter={8}>
      {(data.cards || []).map((c: any, i: number) => (
        <Col key={i} span={Math.max(6, Math.floor(24 / (data.cards?.length || 1)))}>
          <Card size="small">
            <Statistic title={c.title} value={c.value} suffix={c.unit || ''} valueStyle={{ color: C[i % C.length], fontSize: 18 }} />
            {c.change && <div style={{ fontSize: 11, color: c.change.includes('+') || c.change.includes('↑') ? '#52c41a' : '#f5222d' }}>{c.change}</div>}
          </Card>
        </Col>
      ))}
    </Row>
  );
}
