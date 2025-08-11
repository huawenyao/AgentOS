import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  InputNumber,
  Switch,
  Select,
  Slider,
  DatePicker,
  TimePicker,
  ColorPicker,
  Upload,
  Button,
  Space,
  Divider,
  Collapse,
  Tag,
  Tooltip,
  Alert,
  Typography,
  Radio,
  Checkbox,
  Rate,
  Empty
} from 'antd';
import {
  SettingOutlined,
  InfoCircleOutlined,
  PlusOutlined,
  DeleteOutlined,
  CopyOutlined,
  SaveOutlined,
  ReloadOutlined,
  EyeOutlined,
  CodeOutlined
} from '@ant-design/icons';
import {
  BaseNode,
  Component,
  PropertyDefinition,
  PropertyType,
  AgentTemplate,
  CapabilityComponent,
  LLMConfig
} from './types';
import './PropertyPanel.css';

const { Panel } = Collapse;
const { Option } = Select;
const { TextArea } = Input;
const { Text, Title } = Typography;
const { Group: CheckboxGroup } = Checkbox;
const { Group: RadioGroup } = Radio;

interface PropertyPanelProps {
  selectedNode?: BaseNode | Component | null;
  onPropertyChange?: (nodeId: string, properties: Record<string, any>) => void;
  onNodeUpdate?: (node: BaseNode | Component) => void;
  className?: string;
}

const PropertyPanel: React.FC<PropertyPanelProps> = ({
  selectedNode,
  onPropertyChange,
  onNodeUpdate,
  className
}) => {
  const [form] = Form.useForm();
  const [activeKey, setActiveKey] = useState(['basic', 'advanced']);
  const [isModified, setIsModified] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  // 监听选中节点变化
  useEffect(() => {
    if (selectedNode) {
      // 重置表单并填充当前节点的属性值
      const initialValues = selectedNode.data || {};
      form.setFieldsValue(initialValues);
      setIsModified(false);
    } else {
      form.resetFields();
      setIsModified(false);
    }
  }, [selectedNode, form]);

  // 处理属性值变化
  const handleValueChange = (changedValues: any, allValues: any) => {
    setIsModified(true);
    if (selectedNode && onPropertyChange) {
      onPropertyChange(selectedNode.id, allValues);
    }
  };

  // 保存属性
  const handleSave = () => {
    if (!selectedNode) return;
    
    form.validateFields().then(values => {
      const updatedNode = {
        ...selectedNode,
        data: { ...selectedNode.data, ...values }
      };
      
      if (onNodeUpdate) {
        onNodeUpdate(updatedNode);
      }
      setIsModified(false);
    }).catch(error => {
      console.error('表单验证失败:', error);
    });
  };

  // 重置属性
  const handleReset = () => {
    if (selectedNode) {
      const initialValues = selectedNode.data || {};
      form.setFieldsValue(initialValues);
      setIsModified(false);
    }
  };

  // 渲染属性输入组件
  const renderPropertyInput = (property: PropertyDefinition) => {
    const { type, options, validation } = property;
    
    switch (type) {
      case PropertyType.STRING:
        return (
          <Input
            placeholder={property.description}
            maxLength={validation?.maxLength}
            showCount={!!validation?.maxLength}
          />
        );
        
      case PropertyType.TEXT_AREA:
        return (
          <TextArea
            placeholder={property.description}
            rows={4}
            maxLength={validation?.maxLength}
            showCount={!!validation?.maxLength}
          />
        );
        
      case PropertyType.NUMBER:
        return (
          <InputNumber
            placeholder={property.description}
            min={validation?.min}
            max={validation?.max}
            style={{ width: '100%' }}
          />
        );
        
      case PropertyType.BOOLEAN:
      case PropertyType.SWITCH:
        return (
          <Switch
            checkedChildren="是"
            unCheckedChildren="否"
          />
        );
        
      case PropertyType.SELECT:
        return (
          <Select placeholder={`请选择${property.label}`}>
            {options?.map(option => (
              <Option key={option.value} value={option.value} disabled={option.disabled}>
                {option.label}
                {option.description && (
                  <Text type="secondary" style={{ fontSize: '12px', marginLeft: '8px' }}>
                    {option.description}
                  </Text>
                )}
              </Option>
            ))}
          </Select>
        );
        
      case PropertyType.MULTI_SELECT:
        return (
          <Select mode="multiple" placeholder={`请选择${property.label}`}>
            {options?.map(option => (
              <Option key={option.value} value={option.value} disabled={option.disabled}>
                {option.label}
              </Option>
            ))}
          </Select>
        );
        
      case PropertyType.RADIO:
        return (
          <RadioGroup>
            {options?.map(option => (
              <Radio key={option.value} value={option.value} disabled={option.disabled}>
                {option.label}
              </Radio>
            ))}
          </RadioGroup>
        );
        
      case PropertyType.CHECKBOX:
        return (
          <CheckboxGroup>
            {options?.map(option => (
              <Checkbox key={option.value} value={option.value} disabled={option.disabled}>
                {option.label}
              </Checkbox>
            ))}
          </CheckboxGroup>
        );
        
      case PropertyType.SLIDER:
        return (
          <Slider
            min={validation?.min || 0}
            max={validation?.max || 100}
            marks={{
              [validation?.min || 0]: validation?.min || 0,
              [validation?.max || 100]: validation?.max || 100
            }}
          />
        );
        
      case PropertyType.COLOR:
        return (
          <ColorPicker showText />
        );
        
      case PropertyType.DATE:
        return (
          <DatePicker style={{ width: '100%' }} />
        );
        
      case PropertyType.TIME:
        return (
          <TimePicker style={{ width: '100%' }} />
        );
        
      case PropertyType.DATETIME:
        return (
          <DatePicker showTime style={{ width: '100%' }} />
        );
        
      case PropertyType.URL:
        return (
          <Input
            placeholder="https://example.com"
            addonBefore="🔗"
          />
        );
        
      case PropertyType.EMAIL:
        return (
          <Input
            placeholder="user@example.com"
            addonBefore="📧"
          />
        );
        
      case PropertyType.PASSWORD:
        return (
          <Input.Password
            placeholder="请输入密码"
          />
        );
        
      case PropertyType.CODE:
        return (
          <TextArea
            placeholder={property.description}
            rows={6}
            style={{ fontFamily: 'Monaco, Consolas, monospace' }}
          />
        );
        
      case PropertyType.JSON:
        return (
          <TextArea
            placeholder='{"key": "value"}'
            rows={6}
            style={{ fontFamily: 'Monaco, Consolas, monospace' }}
          />
        );
        
      case PropertyType.FILE:
        return (
          <Upload
            listType="text"
            maxCount={1}
            beforeUpload={() => false}
          >
            <Button icon={<PlusOutlined />}>选择文件</Button>
          </Upload>
        );
        
      case PropertyType.TAGS:
        return (
          <Select
            mode="tags"
            placeholder="输入标签后按回车"
            style={{ width: '100%' }}
          />
        );
        
      default:
        return (
          <Input placeholder={property.description} />
        );
    }
  };

  // 获取节点特定的属性定义
  const getNodeProperties = (): PropertyDefinition[] => {
    if (!selectedNode) return [];
    
    const baseProperties: PropertyDefinition[] = [
      {
        id: 'name',
        name: 'name',
        label: '节点名称',
        description: '节点的显示名称',
        type: PropertyType.STRING,
        required: true,
        group: 'basic',
        order: 1
      },
      {
        id: 'description',
        name: 'description',
        label: '节点描述',
        description: '节点的详细描述',
        type: PropertyType.TEXT_AREA,
        required: false,
        group: 'basic',
        order: 2
      }
    ];
    
    // Agent特定属性
    if ('type' in selectedNode && selectedNode.category === 'agent') {
      const agentNode = selectedNode as unknown as AgentTemplate;
      baseProperties.push(
        {
          id: 'systemPrompt',
          name: 'systemPrompt',
          label: '系统提示词',
          description: 'Agent的系统提示词',
          type: PropertyType.TEXT_AREA,
          required: false,
          group: 'agent',
          order: 1
        },
        {
          id: 'llmProvider',
          name: 'llmProvider',
          label: 'LLM提供商',
          description: '选择LLM服务提供商',
          type: PropertyType.SELECT,
          required: true,
          group: 'agent',
          order: 2,
          options: [
            { label: 'OpenAI', value: 'openai' },
            { label: 'Anthropic', value: 'anthropic' },
            { label: '本地模型', value: 'local' },
            { label: '自定义', value: 'custom' }
          ]
        },
        {
          id: 'llmModel',
          name: 'llmModel',
          label: 'LLM模型',
          description: '选择具体的模型',
          type: PropertyType.STRING,
          required: true,
          group: 'agent',
          order: 3
        },
        {
          id: 'temperature',
          name: 'temperature',
          label: '温度参数',
          description: '控制输出的随机性',
          type: PropertyType.SLIDER,
          required: false,
          group: 'agent',
          order: 4,
          defaultValue: 0.7,
          validation: { min: 0, max: 2 }
        },
        {
          id: 'maxTokens',
          name: 'maxTokens',
          label: '最大Token数',
          description: '限制输出的最大Token数量',
          type: PropertyType.NUMBER,
          required: false,
          group: 'agent',
          order: 5,
          defaultValue: 2048,
          validation: { min: 1, max: 32768 }
        }
      );
    }
    
    // 能力组件特定属性
    if ('executionMode' in selectedNode) {
      const capabilityNode = selectedNode as unknown as CapabilityComponent;
      baseProperties.push(
        {
          id: 'executionMode',
          name: 'executionMode',
          label: '执行模式',
          description: '组件的执行模式',
          type: PropertyType.SELECT,
          required: true,
          group: 'capability',
          order: 1,
          options: [
            { label: '同步', value: 'sync', description: '阻塞执行' },
            { label: '异步', value: 'async', description: '非阻塞执行' },
            { label: '流式', value: 'stream', description: '流式输出' }
          ]
        },
        {
          id: 'timeout',
          name: 'timeout',
          label: '超时时间',
          description: '执行超时时间（毫秒）',
          type: PropertyType.NUMBER,
          required: false,
          group: 'capability',
          order: 2,
          defaultValue: 30000,
          validation: { min: 1000, max: 300000 }
        },
        {
          id: 'retryCount',
          name: 'retryCount',
          label: '重试次数',
          description: '失败时的重试次数',
          type: PropertyType.NUMBER,
          required: false,
          group: 'capability',
          order: 3,
          defaultValue: 3,
          validation: { min: 0, max: 10 }
        }
      );
    }
    
    // 合并节点自定义属性
    if (selectedNode.properties) {
      baseProperties.push(...selectedNode.properties);
    }
    
    return baseProperties.sort((a, b) => (a.order || 999) - (b.order || 999));
  };

  // 按组分组属性
  const groupedProperties = () => {
    const properties = getNodeProperties();
    const grouped = properties.reduce((acc, prop) => {
      const group = prop.group || 'other';
      if (!acc[group]) {
        acc[group] = [];
      }
      acc[group].push(prop);
      return acc;
    }, {} as Record<string, PropertyDefinition[]>);
    
    return grouped;
  };

  // 组配置
  const groupConfig = {
    basic: { title: '基础配置', icon: <SettingOutlined /> },
    agent: { title: 'Agent配置', icon: <EyeOutlined /> },
    capability: { title: '能力配置', icon: <CodeOutlined /> },
    advanced: { title: '高级配置', icon: <SettingOutlined /> },
    other: { title: '其他配置', icon: <SettingOutlined /> }
  };

  if (!selectedNode) {
    return (
      <Card 
        className={`property-panel ${className || ''}`}
        title="属性配置"
        size="small"
      >
        <Empty 
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="请选择一个节点来配置属性"
          style={{ margin: '40px 0' }}
        />
      </Card>
    );
  }

  const grouped = groupedProperties();

  return (
    <Card 
      className={`property-panel ${className || ''}`}
      title={
        <Space>
          <span>属性配置</span>
          {isModified && (
            <Tag color="orange">已修改</Tag>
          )}
        </Space>
      }
      size="small"
      extra={
        <Space>
          <Tooltip title={previewMode ? '编辑模式' : '预览模式'}>
            <Button 
              type="text" 
              size="small" 
              icon={previewMode ? <CodeOutlined /> : <EyeOutlined />}
              onClick={() => setPreviewMode(!previewMode)}
            />
          </Tooltip>
          <Tooltip title="重置">
            <Button 
              type="text" 
              size="small" 
              icon={<ReloadOutlined />}
              onClick={handleReset}
              disabled={!isModified}
            />
          </Tooltip>
          <Tooltip title="保存">
            <Button 
              type="text" 
              size="small" 
              icon={<SaveOutlined />}
              onClick={handleSave}
              disabled={!isModified}
            />
          </Tooltip>
        </Space>
      }
    >
      {/* 节点信息 */}
      <div className="node-info">
        <div className="node-info-header">
          <div className="node-info-icon" style={{ color: selectedNode.color }}>
            {/* 这里可以根据icon字段渲染图标 */}
            <SettingOutlined />
          </div>
          <div className="node-info-content">
            <Title level={5} style={{ margin: 0 }}>{selectedNode?.name || '未命名节点'}</Title>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {selectedNode.description}
            </Text>
          </div>
        </div>
        
        {selectedNode.tags && selectedNode.tags.length > 0 && (
          <div className="node-info-tags">
            {selectedNode.tags.map(tag => (
              <Tag key={tag}>{tag}</Tag>
            ))}
          </div>
        )}
      </div>

      <Divider style={{ margin: '16px 0' }} />

      {/* 属性表单 */}
      <Form
        form={form}
        layout="vertical"
        onValuesChange={handleValueChange}
        disabled={previewMode}
      >
        {Object.keys(grouped).length > 0 ? (
          <Collapse 
            activeKey={activeKey}
            onChange={setActiveKey}
            size="small"
            ghost
          >
            {Object.entries(grouped).map(([groupKey, properties]) => {
              const config = groupConfig[groupKey as keyof typeof groupConfig] || groupConfig.other;
              
              return (
                <Panel 
                  key={groupKey}
                  header={
                    <Space>
                      {config.icon}
                      <span>{config.title}</span>
                      <Tag>{properties.length}</Tag>
                    </Space>
                  }
                >
                  {properties.map(property => (
                    <Form.Item
                      key={property.id}
                      name={property.name}
                      label={
                        <Space>
                          <span>{property.label}</span>
                          {property.required && (
                            <Text type="danger">*</Text>
                          )}
                          {property.description && (
                            <Tooltip title={property.description}>
                              <InfoCircleOutlined style={{ color: '#8c8c8c' }} />
                            </Tooltip>
                          )}
                        </Space>
                      }
                      rules={[
                        {
                          required: property.required,
                          message: `请输入${property.label}`
                        },
                        ...(property.validation?.pattern ? [{
                          pattern: new RegExp(property.validation.pattern),
                          message: '格式不正确'
                        }] : [])
                      ]}
                      initialValue={property.defaultValue}
                    >
                      {renderPropertyInput(property)}
                    </Form.Item>
                  ))}
                </Panel>
              );
            })}
          </Collapse>
        ) : (
          <Empty 
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="该节点没有可配置的属性"
            style={{ margin: '20px 0' }}
          />
        )}
      </Form>

      {/* 操作按钮 */}
      {isModified && (
        <>
          <Divider style={{ margin: '16px 0' }} />
          <div className="property-actions">
            <Space>
              <Button 
                type="primary" 
                icon={<SaveOutlined />}
                onClick={handleSave}
                size="small"
              >
                保存更改
              </Button>
              <Button 
                icon={<ReloadOutlined />}
                onClick={handleReset}
                size="small"
              >
                重置
              </Button>
            </Space>
          </div>
        </>
      )}
    </Card>
  );
};

export default PropertyPanel;
