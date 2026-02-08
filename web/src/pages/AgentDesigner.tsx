import React, { useEffect, useState } from 'react';
import { Card, Button, Table, Modal, Form, Input, InputNumber, Select, Tag, message, Space, Drawer, List, Typography } from 'antd';
import { PlusOutlined, PlayCircleOutlined, SendOutlined, RobotOutlined, ToolOutlined } from '@ant-design/icons';
import { agentApi, toolApi } from '../services/api';

const { TextArea } = Input;
const { Text } = Typography;

export default function AgentDesigner() {
  const [agents, setAgents] = useState<any[]>([]);
  const [tools, setTools] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [editingAgent, setEditingAgent] = useState<any>(null);
  const [playground, setPlayground] = useState<{ agentId: string; name: string } | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [form] = Form.useForm();

  const load = async () => {
    setLoading(true);
    const [a, t] = await Promise.all([agentApi.list(), toolApi.list({ enabled: true })]);
    setAgents(a.data);
    setTools(t.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const saveAgent = async (values: any) => {
    if (editingAgent) {
      await agentApi.update(editingAgent.id, values);
      message.success('Agent updated');
    } else {
      await agentApi.create(values);
      message.success('Agent created');
    }
    setShowEditor(false);
    setEditingAgent(null);
    form.resetFields();
    load();
  };

  const openEditor = (agent?: any) => {
    setEditingAgent(agent || null);
    if (agent) form.setFieldsValue(agent);
    else form.resetFields();
    setShowEditor(true);
  };

  const openPlayground = (agent: any) => {
    setPlayground({ agentId: agent.id, name: agent.name });
    setChatMessages([]);
    setChatInput('');
  };

  const sendMessage = async () => {
    if (!chatInput.trim() || !playground) return;
    const userMsg = chatInput.trim();
    setChatMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setChatInput('');
    setChatLoading(true);
    try {
      const res = await agentApi.playground(playground.agentId, { message: userMsg });
      const d = res.data;
      setChatMessages(prev => [...prev, {
        role: 'assistant', content: d.output,
        meta: `${d.turn_count} turns · ${d.cost_cents}¢ · ${d.llm_tokens} tokens`,
        toolCalls: d.tool_calls,
      }]);
    } catch (e: any) {
      setChatMessages(prev => [...prev, { role: 'error', content: e.response?.data?.detail || 'Error' }]);
    }
    setChatLoading(false);
  };

  const columns = [
    { title: 'Name', dataIndex: 'name', render: (t: string) => <><RobotOutlined /> {t}</> },
    { title: 'Model', dataIndex: 'model', render: (m: string) => <Tag>{m}</Tag> },
    { title: 'Tools', dataIndex: 'tool_ids', render: (ids: string[]) => <Tag>{ids?.length || 0} tools</Tag> },
    { title: 'Constraints', key: 'constraints', render: (_: any, r: any) => (
      <Space size={4}>
        <Tag>max {r.max_turns} turns</Tag>
        <Tag>¥{(r.max_cost_cents / 100).toFixed(2)} limit</Tag>
        <Tag>{r.timeout_seconds}s timeout</Tag>
      </Space>
    )},
    { title: 'Status', dataIndex: 'status', render: (s: string) => <Tag color={s === 'published' ? 'green' : 'blue'}>{s}</Tag> },
    { title: 'Actions', key: 'actions', render: (_: any, r: any) => (
      <Space>
        <Button size="small" onClick={() => openEditor(r)}>Edit</Button>
        <Button size="small" type="primary" icon={<PlayCircleOutlined />} onClick={() => openPlayground(r)}>Playground</Button>
      </Space>
    )},
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>Agent Designer</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => openEditor()}>New Agent</Button>
      </div>

      <Card>
        <Table dataSource={agents} columns={columns} rowKey="id" loading={loading} size="small" />
      </Card>

      {/* ── Agent Editor Modal ── */}
      <Modal title={editingAgent ? 'Edit Agent' : 'Create Agent'} open={showEditor} onCancel={() => { setShowEditor(false); setEditingAgent(null); }} onOk={() => form.submit()} width={720} okText="Save">
        <Form form={form} layout="vertical" onFinish={saveAgent}>
          <Form.Item name="name" label="Agent Name" rules={[{ required: true }]}><Input placeholder="e.g. Data Analyst" /></Form.Item>
          <Form.Item name="instructions" label="Instructions (System Prompt)" rules={[{ required: true }]}>
            <TextArea rows={6} placeholder="You are a data analysis expert. Your job is to..." />
          </Form.Item>
          <Form.Item name="model" label="Model" initialValue="claude-sonnet-4-20250514">
            <Select options={[
              { value: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4' },
              { value: 'claude-3-5-haiku-20241022', label: 'Claude 3.5 Haiku' },
              { value: 'gpt-4o', label: 'GPT-4o' },
              { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
            ]} />
          </Form.Item>
          <Form.Item name="tool_ids" label="Tools">
            <Select mode="multiple" placeholder="Select tools" options={tools.map(t => ({ value: t.id, label: `${t.name} (${t.implementation})` }))} />
          </Form.Item>
          <Space size={16}>
            <Form.Item name="max_turns" label="Max Turns" initialValue={20}><InputNumber min={1} max={100} /></Form.Item>
            <Form.Item name="max_cost_cents" label="Max Cost (cents)" initialValue={500}><InputNumber min={1} max={10000} /></Form.Item>
            <Form.Item name="timeout_seconds" label="Timeout (s)" initialValue={300}><InputNumber min={10} max={3600} /></Form.Item>
          </Space>
        </Form>
      </Modal>

      {/* ── Playground Drawer ── */}
      <Drawer title={`Playground: ${playground?.name || ''}`} open={!!playground} onClose={() => setPlayground(null)} width={560} placement="right">
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div style={{ flex: 1, overflowY: 'auto', marginBottom: 12 }}>
            {chatMessages.map((m, i) => (
              <div key={i} style={{ marginBottom: 12, textAlign: m.role === 'user' ? 'right' : 'left' }}>
                <div style={{
                  display: 'inline-block', maxWidth: '85%', padding: '8px 12px', borderRadius: 8,
                  background: m.role === 'user' ? '#1890ff' : m.role === 'error' ? '#ff4d4f' : '#f0f0f0',
                  color: m.role === 'user' || m.role === 'error' ? '#fff' : '#333',
                }}>
                  <div style={{ whiteSpace: 'pre-wrap' }}>{m.content}</div>
                  {m.meta && <div style={{ fontSize: 11, opacity: 0.7, marginTop: 4 }}>{m.meta}</div>}
                  {m.toolCalls?.length > 0 && (
                    <div style={{ marginTop: 8, fontSize: 12 }}>
                      {m.toolCalls.map((tc: any, j: number) => (
                        <Tag key={j} icon={<ToolOutlined />} color="purple" style={{ marginBottom: 4 }}>
                          {tc.tool}
                        </Tag>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {chatLoading && <div style={{ color: '#888' }}>Thinking...</div>}
          </div>
          <Input.Search
            value={chatInput}
            onChange={e => setChatInput(e.target.value)}
            onSearch={sendMessage}
            enterButton={<SendOutlined />}
            placeholder="Type a message..."
            loading={chatLoading}
          />
        </div>
      </Drawer>
    </div>
  );
}
