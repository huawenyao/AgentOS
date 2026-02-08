import React, { useEffect, useState } from 'react';
import { Card, Button, Table, Modal, Form, Input, Select, Upload, message, Tag, Space, Empty } from 'antd';
import { PlusOutlined, UploadOutlined, ApiOutlined, DatabaseOutlined, FileTextOutlined } from '@ant-design/icons';
import { connectionApi, toolApi } from '../services/api';

const typeIcons: any = { openapi: <ApiOutlined />, database: <DatabaseOutlined />, document: <FileTextOutlined /> };

export default function ConnectHub() {
  const [connections, setConnections] = useState<any[]>([]);
  const [tools, setTools] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showImport, setShowImport] = useState<string | null>(null);
  const [form] = Form.useForm();

  const load = async () => {
    setLoading(true);
    try {
      const [c, t] = await Promise.all([connectionApi.list(), toolApi.list()]);
      setConnections(c.data);
      setTools(t.data);
    } catch (e: any) { message.error('Failed to load'); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const createConn = async (values: any) => {
    await connectionApi.create(values);
    message.success('Connection created');
    setShowCreate(false);
    form.resetFields();
    load();
  };

  const handleImport = async (file: File) => {
    if (!showImport) return false;
    try {
      const res = await connectionApi.importOpenAPI(showImport, file);
      message.success(`Imported ${res.data.length} tools`);
      setShowImport(null);
      load();
    } catch (e: any) { message.error('Import failed'); }
    return false;
  };

  const toolColumns = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Description', dataIndex: 'description', key: 'desc', ellipsis: true },
    { title: 'Type', dataIndex: 'implementation', key: 'impl', render: (t: string) => <Tag>{t}</Tag> },
    { title: 'Enabled', dataIndex: 'enabled', key: 'en', render: (v: boolean) => v ? <Tag color="green">Yes</Tag> : <Tag color="red">No</Tag> },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>Connect Hub</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setShowCreate(true)}>
          New Connection
        </Button>
      </div>

      <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        {connections.length === 0 && !loading && (
          <Card style={{ width: '100%' }}><Empty description="No connections yet. Click 'New Connection' to get started." /></Card>
        )}
        {connections.map(c => (
          <Card key={c.id} style={{ width: 280 }} actions={[
            <Button size="small" onClick={() => setShowImport(c.id)}>Import OpenAPI</Button>,
          ]}>
            <Card.Meta
              avatar={typeIcons[c.type] || <ApiOutlined />}
              title={c.name}
              description={<><Tag>{c.type}</Tag> <Tag color={c.status === 'active' ? 'green' : 'red'}>{c.status}</Tag></>}
            />
            <div style={{ marginTop: 8, color: '#888', fontSize: 12 }}>
              {tools.filter(t => t.connection_id === c.id).length} tools
            </div>
          </Card>
        ))}
      </div>

      <Card title={`Tools (${tools.length})`}>
        <Table dataSource={tools} columns={toolColumns} rowKey="id" size="small" pagination={{ pageSize: 10 }} loading={loading} />
      </Card>

      <Modal title="New Connection" open={showCreate} onCancel={() => setShowCreate(false)} onOk={() => form.submit()} okText="Create">
        <Form form={form} layout="vertical" onFinish={createConn}>
          <Form.Item name="name" label="Name" rules={[{ required: true }]}><Input placeholder="e.g. Order Service API" /></Form.Item>
          <Form.Item name="type" label="Type" initialValue="openapi">
            <Select options={[{ value: 'openapi', label: 'OpenAPI' }, { value: 'database', label: 'Database' }, { value: 'document', label: 'Document' }]} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="Import OpenAPI Spec" open={!!showImport} onCancel={() => setShowImport(null)} footer={null}>
        <Upload.Dragger beforeUpload={handleImport} accept=".json,.yaml,.yml" showUploadList={false}>
          <p className="ant-upload-drag-icon"><UploadOutlined style={{ fontSize: 32 }} /></p>
          <p>Click or drag OpenAPI spec file here</p>
          <p style={{ color: '#888' }}>Supports .json, .yaml, .yml</p>
        </Upload.Dragger>
      </Modal>
    </div>
  );
}
