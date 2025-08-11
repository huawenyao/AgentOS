import React, { useState, useEffect } from 'react';
import {
  Card,
  Tabs,
  Form,
  Input,
  Switch,
  Button,
  Select,
  InputNumber,
  Space,
  message,
  Divider,
  Alert,
  Modal,
  Table,
  Tag,
  Tooltip,
  Spin,
  Row,
  Col,
  Typography,
  Collapse
} from 'antd';
import {
  SettingOutlined,
  ApiOutlined,
  SecurityScanOutlined,
  ToolOutlined,
  ControlOutlined,
  ReloadOutlined,
  ExperimentOutlined,
  SaveOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import ApiService from './ApiService';

const { TabPane } = Tabs;
const { Option } = Select;
const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;
const { confirm } = Modal;

/**
 * 系统配置接口
 */
interface SystemConfig {
  general: {
    siteName: string;
    siteDescription: string;
    allowRegistration: boolean;
    defaultUserRole: string;
    timezone: string;
    language: string;
  };
  security: {
    jwtExpiration: string;
    refreshTokenExpiration: string;
    passwordMinLength: number;
    maxLoginAttempts: number;
    enableTwoFactor: boolean;
    sessionTimeout: number;
  };
  features: {
    enableWorkflows: boolean;
    enableComponents: boolean;
    enableMonitoring: boolean;
    enableVersionControl: boolean;
    enableCollaboration: boolean;
  };
  limits: {
    maxAgentsPerUser: number;
    maxWorkflowsPerUser: number;
    maxExecutionsPerDay: number;
    maxFileSize: number;
    maxConcurrentExecutions: number;
  };
}

/**
 * 模型配置接口
 */
interface ModelConfig {
  defaultProvider: string;
  providers: {
    [key: string]: {
      enabled: boolean;
      apiKey: string;
      baseUrl?: string;
      endpoint?: string;
      apiVersion?: string;
      models: {
        [key: string]: {
          enabled: boolean;
          maxTokens: number;
          temperature: number;
          costPer1kTokens: number;
        };
      };
    };
  };
}

/**
 * 模型提供商信息接口
 */
interface ProviderInfo {
  name: string;
  description: string;
  icon: string;
  supportedModels: string[];
  requiredFields: string[];
}

/**
 * 设置组件
 */
const Settings: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [systemConfig, setSystemConfig] = useState<SystemConfig | null>(null);
  const [modelConfig, setModelConfig] = useState<ModelConfig | null>(null);
  const [availableProviders, setAvailableProviders] = useState<Record<string, ProviderInfo>>({});
  const [activeTab, setActiveTab] = useState('general');
  const [testingConnection, setTestingConnection] = useState<string | null>(null);
  const [connectionResults, setConnectionResults] = useState<Record<string, any>>({});
  
  const [systemForm] = Form.useForm();
  const [modelForm] = Form.useForm();
  
  const apiService = ApiService;

  /**
   * 初始化数据
   */
  useEffect(() => {
    loadSettings();
    loadAvailableProviders();
  }, []);

  /**
   * 加载设置数据
   */
  const loadSettings = async () => {
    setLoading(true);
    try {
      const [systemResponse, modelResponse] = await Promise.all([
        apiService.request('/api/settings/system', 'GET'),
        apiService.request('/api/settings/models', 'GET')
      ]);
      
      setSystemConfig(systemResponse.data);
      setModelConfig(modelResponse.data);
      
      // 设置表单初始值
      systemForm.setFieldsValue(systemResponse.data);
      modelForm.setFieldsValue(modelResponse.data);
    } catch (error) {
      console.error('加载设置失败:', error);
      message.error('加载设置失败');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 加载可用的模型提供商
   */
  const loadAvailableProviders = async () => {
    try {
      const response = await apiService.request('/api/settings/models/providers', 'GET');
      setAvailableProviders(response.data);
    } catch (error) {
      console.error('加载模型提供商失败:', error);
    }
  };

  /**
   * 保存系统设置
   */
  const saveSystemSettings = async (values: any) => {
    setLoading(true);
    try {
      const response = await apiService.request('/api/settings/system', 'PUT', values);
      setSystemConfig(response.data);
      message.success('系统设置保存成功');
    } catch (error) {
      console.error('保存系统设置失败:', error);
      message.error('保存系统设置失败');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 保存模型配置
   */
  const saveModelConfig = async (values: any) => {
    setLoading(true);
    try {
      const response = await apiService.request('/api/settings/models', 'PUT', values);
      setModelConfig(response.data);
      message.success('模型配置保存成功');
    } catch (error) {
      console.error('保存模型配置失败:', error);
      message.error('保存模型配置失败');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 测试模型连接
   */
  const testModelConnection = async (provider: string, config: any) => {
    setTestingConnection(provider);
    try {
      const response = await apiService.request('/api/settings/models/test', 'POST', {
        provider,
        config
      });
      
      setConnectionResults(prev => ({
        ...prev,
        [provider]: response.data
      }));
      
      if (response.data.success) {
        message.success(`${availableProviders[provider]?.name} 连接测试成功`);
      } else {
        message.error(`${availableProviders[provider]?.name} 连接测试失败: ${response.data.error}`);
      }
    } catch (error) {
      console.error('测试连接失败:', error);
      message.error('测试连接失败');
      setConnectionResults(prev => ({
        ...prev,
        [provider]: { success: false, error: '网络错误' }
      }));
    } finally {
      setTestingConnection(null);
    }
  };

  /**
   * 重置配置
   */
  const resetConfig = (type: 'system' | 'models' | 'all') => {
    confirm({
      title: '确认重置',
      icon: <ExclamationCircleOutlined />,
      content: `确定要重置${type === 'system' ? '系统设置' : type === 'models' ? '模型配置' : '所有配置'}到默认值吗？此操作不可撤销。`,
      onOk: async () => {
        setLoading(true);
        try {
          await apiService.request('/api/settings/reset', 'POST', { type });
          message.success('配置重置成功');
          await loadSettings();
        } catch (error) {
          console.error('重置配置失败:', error);
          message.error('重置配置失败');
        } finally {
          setLoading(false);
        }
      }
    });
  };

  /**
   * 渲染连接状态
   */
  const renderConnectionStatus = (provider: string) => {
    const result = connectionResults[provider];
    if (!result) return null;
    
    return (
      <div style={{ marginTop: 8 }}>
        {result.success ? (
          <Tag color="success" icon={<CheckCircleOutlined />}>
            连接成功 ({result.latency}ms)
          </Tag>
        ) : (
          <Tag color="error" icon={<CloseCircleOutlined />}>
            连接失败: {result.error}
          </Tag>
        )}
      </div>
    );
  };

  /**
   * 渲染通用设置面板
   */
  const renderGeneralSettings = () => (
    <Card title="通用设置" extra={
      <Button 
        type="primary" 
        icon={<SaveOutlined />}
        onClick={() => systemForm.submit()}
        loading={loading}
      >
        保存设置
      </Button>
    }>
      <Form
        form={systemForm}
        layout="vertical"
        onFinish={saveSystemSettings}
        initialValues={systemConfig || undefined}
      >
        <Row gutter={24}>
          <Col span={12}>
            <Form.Item
              label="站点名称"
              name={['general', 'siteName']}
              rules={[{ required: true, message: '请输入站点名称' }]}
            >
              <Input placeholder="请输入站点名称" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="默认用户角色"
              name={['general', 'defaultUserRole']}
            >
              <Select>
                <Option value="user">普通用户</Option>
                <Option value="developer">开发者</Option>
                <Option value="admin">管理员</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>
        
        <Form.Item
          label="站点描述"
          name={['general', 'siteDescription']}
        >
          <Input.TextArea rows={3} placeholder="请输入站点描述" />
        </Form.Item>
        
        <Row gutter={24}>
          <Col span={12}>
            <Form.Item
              label="时区"
              name={['general', 'timezone']}
            >
              <Select>
                <Option value="Asia/Shanghai">Asia/Shanghai</Option>
                <Option value="UTC">UTC</Option>
                <Option value="America/New_York">America/New_York</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="语言"
              name={['general', 'language']}
            >
              <Select>
                <Option value="zh-CN">简体中文</Option>
                <Option value="en-US">English</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>
        
        <Form.Item
          label="允许用户注册"
          name={['general', 'allowRegistration']}
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>
      </Form>
    </Card>
  );

  /**
   * 渲染安全设置面板
   */
  const renderSecuritySettings = () => (
    <Card title="安全设置" extra={
      <Button 
        type="primary" 
        icon={<SaveOutlined />}
        onClick={() => systemForm.submit()}
        loading={loading}
      >
        保存设置
      </Button>
    }>
      <Row gutter={24}>
        <Col span={12}>
          <Form.Item
            label="JWT过期时间"
            name={['security', 'jwtExpiration']}
          >
            <Input placeholder="如: 24h, 7d" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label="刷新令牌过期时间"
            name={['security', 'refreshTokenExpiration']}
          >
            <Input placeholder="如: 7d, 30d" />
          </Form.Item>
        </Col>
      </Row>
      
      <Row gutter={24}>
        <Col span={12}>
          <Form.Item
            label="密码最小长度"
            name={['security', 'passwordMinLength']}
          >
            <InputNumber min={6} max={50} style={{ width: '100%' }} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label="最大登录尝试次数"
            name={['security', 'maxLoginAttempts']}
          >
            <InputNumber min={1} max={20} style={{ width: '100%' }} />
          </Form.Item>
        </Col>
      </Row>
      
      <Row gutter={24}>
        <Col span={12}>
          <Form.Item
            label="会话超时时间(秒)"
            name={['security', 'sessionTimeout']}
          >
            <InputNumber min={300} max={86400} style={{ width: '100%' }} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label="启用双因子认证"
            name={['security', 'enableTwoFactor']}
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </Col>
      </Row>
    </Card>
  );

  /**
   * 渲染功能设置面板
   */
  const renderFeatureSettings = () => (
    <Card title="功能设置" extra={
      <Button 
        type="primary" 
        icon={<SaveOutlined />}
        onClick={() => systemForm.submit()}
        loading={loading}
      >
        保存设置
      </Button>
    }>
      <Row gutter={24}>
        <Col span={12}>
          <Form.Item
            label="启用工作流"
            name={['features', 'enableWorkflows']}
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label="启用组件"
            name={['features', 'enableComponents']}
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </Col>
      </Row>
      
      <Row gutter={24}>
        <Col span={12}>
          <Form.Item
            label="启用监控"
            name={['features', 'enableMonitoring']}
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label="启用版本控制"
            name={['features', 'enableVersionControl']}
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </Col>
      </Row>
      
      <Form.Item
        label="启用协作功能"
        name={['features', 'enableCollaboration']}
        valuePropName="checked"
      >
        <Switch />
      </Form.Item>
    </Card>
  );

  /**
   * 渲染限制设置面板
   */
  const renderLimitSettings = () => (
    <Card title="限制设置" extra={
      <Button 
        type="primary" 
        icon={<SaveOutlined />}
        onClick={() => systemForm.submit()}
        loading={loading}
      >
        保存设置
      </Button>
    }>
      <Row gutter={24}>
        <Col span={12}>
          <Form.Item
            label="每用户最大Agent数量"
            name={['limits', 'maxAgentsPerUser']}
          >
            <InputNumber min={1} max={1000} style={{ width: '100%' }} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label="每用户最大工作流数量"
            name={['limits', 'maxWorkflowsPerUser']}
          >
            <InputNumber min={1} max={500} style={{ width: '100%' }} />
          </Form.Item>
        </Col>
      </Row>
      
      <Row gutter={24}>
        <Col span={12}>
          <Form.Item
            label="每日最大执行次数"
            name={['limits', 'maxExecutionsPerDay']}
          >
            <InputNumber min={1} max={100000} style={{ width: '100%' }} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label="最大文件大小(字节)"
            name={['limits', 'maxFileSize']}
          >
            <InputNumber min={1024} max={104857600} style={{ width: '100%' }} />
          </Form.Item>
        </Col>
      </Row>
      
      <Form.Item
        label="最大并发执行数"
        name={['limits', 'maxConcurrentExecutions']}
      >
        <InputNumber min={1} max={100} style={{ width: '100%' }} />
      </Form.Item>
    </Card>
  );

  /**
   * 渲染模型配置面板
   */
  const renderModelSettings = () => (
    <Card title="模型配置" extra={
      <Space>
        <Button 
          icon={<ReloadOutlined />}
          onClick={() => loadSettings()}
        >
          刷新
        </Button>
        <Button 
          type="primary" 
          icon={<SaveOutlined />}
          onClick={() => modelForm.submit()}
          loading={loading}
        >
          保存配置
        </Button>
      </Space>
    }>
      <Form
        form={modelForm}
        layout="vertical"
        onFinish={saveModelConfig}
        initialValues={modelConfig || undefined}
      >
        <Form.Item
          label="默认模型提供商"
          name="defaultProvider"
          rules={[{ required: true, message: '请选择默认模型提供商' }]}
        >
          <Select>
            {Object.entries(availableProviders).map(([key, provider]) => (
              <Option key={key} value={key}>
                {provider.name} - {provider.description}
              </Option>
            ))}
          </Select>
        </Form.Item>
        
        <Divider>模型提供商配置</Divider>
        
        <Collapse>
          {Object.entries(availableProviders).map(([providerKey, provider]) => (
            <Panel 
              key={providerKey}
              header={
                <Space>
                  <span>{provider.name}</span>
                  <Tag color={modelConfig?.providers?.[providerKey]?.enabled ? 'success' : 'default'}>
                    {modelConfig?.providers?.[providerKey]?.enabled ? '已启用' : '未启用'}
                  </Tag>
                </Space>
              }
            >
              <Form.Item
                label="启用此提供商"
                name={['providers', providerKey, 'enabled']}
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
              
              {provider.requiredFields.includes('apiKey') && (
                <Form.Item
                  label="API密钥"
                  name={['providers', providerKey, 'apiKey']}
                >
                  <Input.Password placeholder="请输入API密钥" />
                </Form.Item>
              )}
              
              {provider.requiredFields.includes('baseUrl') && (
                <Form.Item
                  label="基础URL"
                  name={['providers', providerKey, 'baseUrl']}
                >
                  <Input placeholder="请输入基础URL" />
                </Form.Item>
              )}
              
              {provider.requiredFields.includes('endpoint') && (
                <Form.Item
                  label="端点"
                  name={['providers', providerKey, 'endpoint']}
                >
                  <Input placeholder="请输入端点" />
                </Form.Item>
              )}
              
              {provider.requiredFields.includes('apiVersion') && (
                <Form.Item
                  label="API版本"
                  name={['providers', providerKey, 'apiVersion']}
                >
                  <Input placeholder="请输入API版本" />
                </Form.Item>
              )}
              
              <Space>
                <Button
                  icon={<ExperimentOutlined />}
                  loading={testingConnection === providerKey}
                  onClick={() => {
                    const values = modelForm.getFieldsValue();
                    const providerConfig = values.providers?.[providerKey];
                    if (providerConfig) {
                      testModelConnection(providerKey, providerConfig);
                    }
                  }}
                >
                  测试连接
                </Button>
              </Space>
              
              {renderConnectionStatus(providerKey)}
            </Panel>
          ))}
        </Collapse>
      </Form>
    </Card>
  );

  if (loading && !systemConfig) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>加载设置中...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={2}>
          <SettingOutlined /> 系统设置
        </Title>
        <Paragraph type="secondary">
          管理系统的各项配置，包括通用设置、安全配置、功能开关和模型配置等。
        </Paragraph>
      </div>
      
      <Alert
        message="重要提示"
        description="修改系统设置可能会影响整个平台的运行，请谨慎操作。建议在修改前备份当前配置。"
        type="warning"
        showIcon
        style={{ marginBottom: 24 }}
      />
      
      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab}
        tabBarExtraContent={
          <Space>
            <Button 
              danger 
              onClick={() => resetConfig('all')}
            >
              重置所有配置
            </Button>
          </Space>
        }
      >
        <TabPane 
          tab={<span><SettingOutlined />通用设置</span>} 
          key="general"
        >
          {renderGeneralSettings()}
        </TabPane>
        
        <TabPane 
          tab={<span><SecurityScanOutlined />安全设置</span>} 
          key="security"
        >
          {renderSecuritySettings()}
        </TabPane>
        
        <TabPane 
          tab={<span><ToolOutlined />功能设置</span>} 
          key="features"
        >
          {renderFeatureSettings()}
        </TabPane>
        
        <TabPane 
          tab={<span><ControlOutlined />限制设置</span>} 
          key="limits"
        >
          {renderLimitSettings()}
        </TabPane>
        
        <TabPane 
          tab={<span><ApiOutlined />模型配置</span>} 
          key="models"
        >
          {renderModelSettings()}
        </TabPane>
      </Tabs>
    </div>
  );
};

export default Settings;