import React, { useCallback, useEffect, useState } from 'react';
import { Card, Button, Modal, Form, Input, Select, message, Tag, Space, Drawer, Table } from 'antd';
import { PlusOutlined, PlayCircleOutlined, SaveOutlined, RocketOutlined } from '@ant-design/icons';
import ReactFlow, { addEdge, Background, Controls, MiniMap, useNodesState, useEdgesState, MarkerType, Node, Edge, Connection } from 'reactflow';
import 'reactflow/dist/style.css';
import { workflowApi, agentApi, runApi } from '../services/api';

const nodeColors: any = { agent: '#1890ff', rule: '#52c41a', human: '#faad14' };
const nodeEmojis: any = { agent: '🤖', rule: '⚙️', human: '👤' };

export default function WorkflowCanvas() {
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [current, setCurrent] = useState<any>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [showList, setShowList] = useState(true);
  const [showAddNode, setShowAddNode] = useState(false);
  const [showRun, setShowRun] = useState(false);
  const [nodeForm] = Form.useForm();
  const [runForm] = Form.useForm();

  const load = async () => {
    const [w, a] = await Promise.all([workflowApi.list(), agentApi.list()]);
    setWorkflows(w.data);
    setAgents(a.data);
  };

  useEffect(() => { load(); }, []);

  const openWorkflow = (wf: any) => {
    setCurrent(wf);
    setShowList(false);
    // Convert stored nodes/edges to ReactFlow format
    const rfNodes: Node[] = (wf.nodes || []).map((n: any) => ({
      id: n.id,
      type: 'default',
      position: n.position || { x: 100, y: 100 },
      data: {
        label: (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 18 }}>{nodeEmojis[n.type] || '📦'}</div>
            <div style={{ fontWeight: 600 }}>{n.name}</div>
            <Tag color={nodeColors[n.type]}>{n.type}</Tag>
          </div>
        ),
      },
      style: { border: `2px solid ${nodeColors[n.type] || '#999'}`, borderRadius: 8, padding: 8, minWidth: 120 },
    }));
    const rfEdges: Edge[] = (wf.edges || []).map((e: any) => ({
      id: e.id,
      source: e.source_node_id,
      target: e.target_node_id,
      label: e.label || (e.condition ? '📋' : ''),
      markerEnd: { type: MarkerType.ArrowClosed },
      animated: true,
    }));
    setNodes(rfNodes);
    setEdges(rfEdges);
  };

  const createWorkflow = async () => {
    const res = await workflowApi.create({ name: `Workflow ${workflows.length + 1}`, nodes: [], edges: [] });
    message.success('Workflow created');
    load();
    openWorkflow(res.data);
  };

  const addNode = async (values: any) => {
    const nodeId = `node_${Date.now()}`;
    const newNode: Node = {
      id: nodeId,
      type: 'default',
      position: { x: 200 + Math.random() * 200, y: 100 + Math.random() * 200 },
      data: {
        label: (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 18 }}>{nodeEmojis[values.type]}</div>
            <div style={{ fontWeight: 600 }}>{values.name}</div>
            <Tag color={nodeColors[values.type]}>{values.type}</Tag>
          </div>
        ),
      },
      style: { border: `2px solid ${nodeColors[values.type]}`, borderRadius: 8, padding: 8, minWidth: 120 },
    };
    setNodes(nds => [...nds, newNode]);

    // Save to backend
    if (current) {
      const updatedNodes = [...(current.nodes || []), { id: nodeId, type: values.type, name: values.name, config: values.config || {}, position: newNode.position }];
      await workflowApi.update(current.id, { nodes: updatedNodes });
      current.nodes = updatedNodes;
    }
    setShowAddNode(false);
    nodeForm.resetFields();
  };

  const onConnect = useCallback(async (connection: Connection) => {
    setEdges(eds => addEdge({ ...connection, markerEnd: { type: MarkerType.ArrowClosed }, animated: true }, eds));
    if (current && connection.source && connection.target) {
      const edgeId = `edge_${Date.now()}`;
      const updatedEdges = [...(current.edges || []), { id: edgeId, source_node_id: connection.source, target_node_id: connection.target, condition: null, label: null }];
      await workflowApi.update(current.id, { edges: updatedEdges });
      current.edges = updatedEdges;
    }
  }, [current, setEdges]);

  const triggerRun = async (values: any) => {
    try {
      let inputData = {};
      try { inputData = JSON.parse(values.input_json || '{}'); } catch {}
      const res = await runApi.trigger(current.id, inputData);
      message.success(`Run started: ${res.data.id}`);
      setShowRun(false);
    } catch (e: any) {
      message.error(e.response?.data?.detail || 'Run failed');
    }
  };

  if (showList) {
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 style={{ margin: 0 }}>Workflows</h2>
          <Button type="primary" icon={<PlusOutlined />} onClick={createWorkflow}>New Workflow</Button>
        </div>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {workflows.map(wf => (
            <Card key={wf.id} style={{ width: 260, cursor: 'pointer' }} onClick={() => openWorkflow(wf)}
              actions={[<Tag color={wf.status === 'published' ? 'green' : 'blue'}>{wf.status}</Tag>]}>
              <Card.Meta title={wf.name} description={`${(wf.nodes || []).length} nodes · v${wf.version}`} />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <Space>
          <Button onClick={() => { setShowList(true); setCurrent(null); }}>← Back</Button>
          <h3 style={{ margin: 0 }}>{current?.name}</h3>
          <Tag>v{current?.version}</Tag>
        </Space>
        <Space>
          <Button icon={<PlusOutlined />} onClick={() => setShowAddNode(true)}>Add Node</Button>
          <Button type="primary" icon={<RocketOutlined />} onClick={() => setShowRun(true)}>Run</Button>
        </Space>
      </div>

      <Card style={{ height: 'calc(100vh - 160px)' }} bodyStyle={{ padding: 0, height: '100%' }}>
        <ReactFlow nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect} fitView>
          <Background />
          <Controls />
          <MiniMap />
        </ReactFlow>
      </Card>

      {/* Add Node */}
      <Modal title="Add Node" open={showAddNode} onCancel={() => setShowAddNode(false)} onOk={() => nodeForm.submit()}>
        <Form form={nodeForm} layout="vertical" onFinish={addNode}>
          <Form.Item name="name" label="Node Name" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="type" label="Node Type" initialValue="agent">
            <Select options={[
              { value: 'agent', label: '🤖 Agent Node' },
              { value: 'rule', label: '⚙️ Rule Node' },
              { value: 'human', label: '👤 Human Node' },
            ]} />
          </Form.Item>
          <Form.Item noStyle shouldUpdate={(prev, cur) => prev.type !== cur.type}>
            {({ getFieldValue }) => getFieldValue('type') === 'agent' ? (
              <Form.Item name={['config', 'agent_id']} label="Agent">
                <Select placeholder="Select agent" options={agents.map(a => ({ value: a.id, label: a.name }))} />
              </Form.Item>
            ) : getFieldValue('type') === 'rule' ? (
              <Form.Item name={['config', 'expression']} label="Rule Expression">
                <Input placeholder="e.g. data['amount'] > 1000" />
              </Form.Item>
            ) : (
              <Form.Item name={['config', 'instructions']} label="Review Instructions">
                <Input placeholder="Please review and approve." />
              </Form.Item>
            )}
          </Form.Item>
        </Form>
      </Modal>

      {/* Trigger Run */}
      <Modal title="Trigger Run" open={showRun} onCancel={() => setShowRun(false)} onOk={() => runForm.submit()}>
        <Form form={runForm} layout="vertical" onFinish={triggerRun}>
          <Form.Item name="input_json" label="Input Data (JSON)">
            <Input.TextArea rows={4} placeholder='{"message": "Hello"}' />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
