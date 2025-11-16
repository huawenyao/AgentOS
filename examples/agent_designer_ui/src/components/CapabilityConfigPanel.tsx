import React, { useState, useEffect } from 'react';
import {
  Form,
  Input,
  InputNumber,
  Select,
  Slider,
  Switch,
  Radio,
  Checkbox,
  Card,
  Collapse,
  Divider,
  Tag,
  Tooltip,
  Alert,
  Space,
  Button,
  Badge,
  Progress,
  Tabs,
  Typography
} from 'antd';
import {
  InfoCircleOutlined,
  SettingOutlined,
  ExperimentOutlined,
  BulbOutlined,
  ThunderboltOutlined,
  ApartmentOutlined,
  BookOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import {
  CoreCapabilityType,
  CognitiveCapabilityType,
  ReasoningCapabilityType,
  DecisionCapabilityType,
  LearningCapabilityType,
  CapabilityModuleConfig,
  CoreCapabilityModule
} from './CapabilitySystemTypes';

const { Option } = Select;
const { Panel } = Collapse;
const { TextArea } = Input;

interface CapabilityConfigPanelProps {
  capability: CoreCapabilityModule;
  onConfigChange: (config: CapabilityModuleConfig) => void;
  onRemove?: () => void;
  className?: string;
}

/**
 * 能力配置面板组件
 * 基于输入输出和处理规则的能力配置
 */
const CapabilityConfigPanel: React.FC<CapabilityConfigPanelProps> = ({
  capability,
  onConfigChange,
  onRemove,
  className
}) => {
  const [form] = Form.useForm();
  const [config, setConfig] = useState<CapabilityModuleConfig>(capability.config);
  const [activeTab, setActiveTab] = useState('inputs');

  useEffect(() => {
    setConfig(capability.config);
    form.setFieldsValue(capability.config);
  }, [capability, form]);

  /**
   * 处理配置变更
   */
  const handleConfigChange = (changedValues: any, allValues: any) => {
    const newConfig = { ...config, ...changedValues };
    setConfig(newConfig);
    onConfigChange(newConfig);
  };

  /**
   * 添加新的输入参数
   */
  const addInputParameter = () => {
    const newInput = {
      id: `input_${Date.now()}`,
      name: '',
      description: '',
      dataType: 'string',
      required: false,
      validation: { type: 'string' as const },
      examples: []
    };
    // 这里需要更新capability的inputs数组
    console.log('添加输入参数:', newInput);
  };

  /**
   * 添加新的输出参数
   */
  const addOutputParameter = () => {
    const newOutput = {
      id: `output_${Date.now()}`,
      name: '',
      description: '',
      dataType: 'string',
      schema: {},
      examples: []
    };
    // 这里需要更新capability的outputs数组
    console.log('添加输出参数:', newOutput);
  };

  /**
   * 获取能力类型图标
   */
  const getCapabilityIcon = (type: CoreCapabilityType) => {
    switch (type) {
      case CoreCapabilityType.COGNITIVE:
        return <BulbOutlined style={{ color: '#1890ff' }} />;
      case CoreCapabilityType.REASONING:
        return <ThunderboltOutlined style={{ color: '#52c41a' }} />;
      case CoreCapabilityType.DECISION:
        return <ApartmentOutlined style={{ color: '#fa8c16' }} />;
      case CoreCapabilityType.LEARNING:
        return <BookOutlined style={{ color: '#eb2f96' }} />;
      default:
        return <SettingOutlined />;
    }
  };

  /**
   * 渲染输入参数配置
   */
  const renderInputsConfig = () => {
    return (
      <div className="inputs-config">
        <div className="section-header">
          <h4>输入参数配置</h4>
          <Button 
            type="primary" 
             
            onClick={addInputParameter}
            icon={<ExperimentOutlined />}
          >
            添加输入参数
          </Button>
        </div>
        
        {capability.inputs && capability.inputs.length > 0 ? (
          <div className="input-list">
            {capability.inputs.map((input, index) => (
              <Card key={input.id}  style={{ marginBottom: 12 }}>
                <Form.Item label="参数名称" style={{ marginBottom: 8 }}>
                  <Input 
                    value={input.name} 
                    placeholder="输入参数名称"
                    onChange={(e) => {
                      // 更新输入参数名称的逻辑
                      console.log('更新参数名称:', e.target.value);
                    }}
                  />
                </Form.Item>
                
                <Form.Item label="数据类型" style={{ marginBottom: 8 }}>
                  <Select value={input.dataType} placeholder="选择数据类型">
                    <Option value="string">字符串</Option>
                    <Option value="number">数字</Option>
                    <Option value="boolean">布尔值</Option>
                    <Option value="object">对象</Option>
                    <Option value="array">数组</Option>
                  </Select>
                </Form.Item>
                
                <Form.Item label="描述" style={{ marginBottom: 8 }}>
                  <TextArea 
                    value={input.description}
                    placeholder="输入参数描述"
                    rows={2}
                  />
                </Form.Item>
                
                <Form.Item style={{ marginBottom: 8 }}>
                  <Checkbox checked={input.required}>
                    必填参数
                  </Checkbox>
                </Form.Item>
                
                {input.validation && (
                  <Form.Item label="验证规则" style={{ marginBottom: 0 }}>
                    <div className="validation-rules">
                      {input.validation.minLength && (
                        <Tag>最小长度: {input.validation.minLength}</Tag>
                      )}
                      {input.validation.maxLength && (
                        <Tag>最大长度: {input.validation.maxLength}</Tag>
                      )}
                      {input.validation.pattern && (
                        <Tag>正则: {input.validation.pattern}</Tag>
                      )}
                    </div>
                  </Form.Item>
                )}
              </Card>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <InfoCircleOutlined style={{ fontSize: 24, color: '#d9d9d9' }} />
            <p>暂无输入参数，点击上方按钮添加</p>
          </div>
        )}
      </div>
    );
  };

  /**
   * 渲染输出参数配置
   */
  const renderOutputsConfig = () => {
    return (
      <div className="outputs-config">
        <div className="section-header">
          <h4>输出参数配置</h4>
          <Button 
            type="primary" 
             
            onClick={addOutputParameter}
            icon={<ExperimentOutlined />}
          >
            添加输出参数
          </Button>
        </div>
        
        {capability.outputs && capability.outputs.length > 0 ? (
          <div className="output-list">
            {capability.outputs.map((output, index) => (
              <Card key={output.id}  style={{ marginBottom: 12 }}>
                <Form.Item label="参数名称" style={{ marginBottom: 8 }}>
                  <Input 
                    value={output.name} 
                    placeholder="输出参数名称"
                  />
                </Form.Item>
                
                <Form.Item label="数据类型" style={{ marginBottom: 8 }}>
                  <Select value={output.dataType} placeholder="选择数据类型">
                    <Option value="string">字符串</Option>
                    <Option value="number">数字</Option>
                    <Option value="boolean">布尔值</Option>
                    <Option value="object">对象</Option>
                    <Option value="array">数组</Option>
                  </Select>
                </Form.Item>
                
                <Form.Item label="描述" style={{ marginBottom: 8 }}>
                  <TextArea 
                    value={output.description}
                    placeholder="输出参数描述"
                    rows={2}
                  />
                </Form.Item>
                
                <Form.Item label="数据结构" style={{ marginBottom: 0 }}>
                  <TextArea 
                    value={JSON.stringify(output.schema, null, 2)}
                    placeholder="JSON Schema定义"
                    rows={4}
                  />
                </Form.Item>
              </Card>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <InfoCircleOutlined style={{ fontSize: 24, color: '#d9d9d9' }} />
            <p>暂无输出参数，点击上方按钮添加</p>
          </div>
        )}
      </div>
    );
  };

  /**
   * 渲染处理规则配置
   */
  const renderProcessingRulesConfig = () => {
    return (
      <div className="processing-rules-config">
        <h4>处理规则配置</h4>
        
        <Collapse defaultActiveKey={['execution', 'validation', 'transformation']}>
          <Panel header="执行规则" key="execution">
            <Form.Item label="执行模式">
              <Select 
                value={config.executionMode} 
                onChange={(value) => handleConfigChange({ executionMode: value }, {})}
              >
                <Option value="sync">同步执行</Option>
                <Option value="async">异步执行</Option>
                <Option value="stream">流式执行</Option>
              </Select>
            </Form.Item>
            
            <Form.Item label="超时时间(ms)">
              <InputNumber 
                value={config.timeout}
                min={100}
                max={300000}
                step={1000}
                onChange={(value) => handleConfigChange({ timeout: value }, {})}
              />
            </Form.Item>
            
            <Form.Item label="重试策略">
              <div>
                <Form.Item label="最大重试次数" style={{ display: 'inline-block', width: '48%', marginRight: '4%' }}>
                  <InputNumber 
                    value={config.retryPolicy?.maxRetries || 3}
                    min={0}
                    max={10}
                  />
                </Form.Item>
                <Form.Item label="重试策略" style={{ display: 'inline-block', width: '48%' }}>
                  <Select value={config.retryPolicy?.backoffStrategy || 'exponential'}>
                    <Option value="fixed">固定间隔</Option>
                    <Option value="exponential">指数退避</Option>
                    <Option value="linear">线性增长</Option>
                  </Select>
                </Form.Item>
              </div>
            </Form.Item>
          </Panel>
          
          <Panel header="验证规则" key="validation">
            <Form.Item label="质量阈值">
              <Slider 
                value={config.qualityThreshold}
                min={0}
                max={1}
                step={0.01}
                marks={{ 0: '0%', 0.5: '50%', 1: '100%' }}
                tooltip={{ formatter: (value) => `${(value! * 100).toFixed(0)}%` }}
              />
            </Form.Item>
            
            <Form.Item label="性能目标">
              <div>
                <Form.Item label="响应时间(ms)" style={{ display: 'inline-block', width: '48%', marginRight: '4%' }}>
                  <InputNumber 
                    value={config.performanceTarget?.responseTime || 1000}
                    min={10}
                    max={60000}
                  />
                </Form.Item>
                <Form.Item label="准确率" style={{ display: 'inline-block', width: '48%' }}>
                  <InputNumber 
                    value={config.performanceTarget?.accuracy || 0.95}
                    min={0}
                    max={1}
                    step={0.01}
                  />
                </Form.Item>
              </div>
            </Form.Item>
          </Panel>
          
          <Panel header="数据转换规则" key="transformation">
            <Alert 
              message="数据转换配置"
              description="配置输入输出数据的转换规则，支持映射、过滤、聚合等操作"
              type="info"
              style={{ marginBottom: 16 }}
            />
            
            <Form.Item label="输入预处理">
              <TextArea 
                placeholder="输入数据预处理规则 (JavaScript表达式)"
                rows={3}
              />
            </Form.Item>
            
            <Form.Item label="输出后处理">
              <TextArea 
                placeholder="输出数据后处理规则 (JavaScript表达式)"
                rows={3}
              />
            </Form.Item>
          </Panel>
        </Collapse>
      </div>
    );
  };

  /**
   * 渲染推理能力特定配置
   */
  const renderReasoningConfig = () => {
    return (
      <>
        <Form.Item
          name={['parameters', 'uncertaintyHandling']}
          label="不确定性处理"
          tooltip="选择处理不确定信息的方式"
        >
          <Radio.Group>
            <Radio value="ignore">忽略</Radio>
            <Radio value="conservative">保守处理</Radio>
            <Radio value="probabilistic">概率处理</Radio>
            <Radio value="fuzzy">模糊处理</Radio>
          </Radio.Group>
        </Form.Item>
      </>
    );
  };

  /**
   * 渲染认知能力特定配置
   */
  const renderCognitiveConfig = () => {
    return (
      <>
        <Form.Item
          name={['parameters', 'processingDepth']}
          label="处理深度"
          tooltip="设置认知处理的深度级别"
        >
          <Select placeholder="选择处理深度">
            <Option value="shallow">浅层处理</Option>
            <Option value="medium">中等处理</Option>
            <Option value="deep">深度处理</Option>
            <Option value="comprehensive">全面处理</Option>
          </Select>
        </Form.Item>

        <Form.Item
          name={['parameters', 'attentionMechanism']}
          label="注意力机制"
          tooltip="选择注意力分配策略"
        >
          <Radio.Group>
            <Radio value="focused">聚焦注意</Radio>
            <Radio value="distributed">分布注意</Radio>
            <Radio value="selective">选择注意</Radio>
            <Radio value="adaptive">自适应注意</Radio>
          </Radio.Group>
        </Form.Item>

        <Form.Item
          name={['parameters', 'memoryIntegration']}
          label="记忆整合"
          tooltip="是否启用记忆整合功能"
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>
      </>
    );
  };

  /**
   * 渲染决策能力特定配置
   */
  const renderDecisionConfig = () => {
    return (
      <>
        <Form.Item
          name={['parameters', 'decisionCriteria']}
          label="决策准则"
          tooltip="选择决策制定的主要准则"
        >
          <Select placeholder="选择决策准则">
            <Option value="optimal">最优化</Option>
            <Option value="satisficing">满意化</Option>
            <Option value="minimax">最小最大</Option>
            <Option value="expected_utility">期望效用</Option>
            <Option value="multi_criteria">多准则</Option>
          </Select>
        </Form.Item>

        <Form.Item
          name={['parameters', 'riskTolerance']}
          label="风险容忍度"
          tooltip="设置决策过程中的风险承受水平"
        >
          <Radio.Group>
            <Radio value="low">低风险</Radio>
            <Radio value="medium">中等风险</Radio>
            <Radio value="high">高风险</Radio>
            <Radio value="adaptive">自适应</Radio>
          </Radio.Group>
        </Form.Item>

        <Form.Item
          name={['parameters', 'timeHorizon']}
          label="决策时间范围"
          tooltip="设置决策考虑的时间跨度"
        >
          <Select placeholder="选择时间范围">
            <Option value="immediate">即时</Option>
            <Option value="short_term">短期（1-30天）</Option>
            <Option value="medium_term">中期（1-12个月）</Option>
            <Option value="long_term">长期（1年以上）</Option>
          </Select>
        </Form.Item>

        <Form.Item
          name={['parameters', 'collaborativeMode']}
          label="协作决策"
          tooltip="是否启用多Agent协作决策"
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>
      </>
    );
  };

  /**
   * 渲染学习能力特定配置
   */
  const renderLearningConfig = () => {
    return (
      <>
        <Form.Item
          name={['parameters', 'learningRate']}
          label="学习率"
          tooltip="控制模型参数更新的步长"
        >
          <InputNumber
            min={0.0001}
            max={1}
            step={0.001}
            precision={4}
            placeholder="输入学习率"
          />
        </Form.Item>

        <Form.Item
          name={['parameters', 'adaptationMode']}
          label="适应模式"
          tooltip="选择学习和适应的方式"
        >
          <Select placeholder="选择适应模式">
            <Option value="incremental">增量学习</Option>
            <Option value="batch">批量学习</Option>
            <Option value="online">在线学习</Option>
            <Option value="transfer">迁移学习</Option>
            <Option value="meta">元学习</Option>
          </Select>
        </Form.Item>

        <Form.Item
          name={['parameters', 'memoryCapacity']}
          label="记忆容量"
          tooltip="设置学习过程中的记忆存储容量"
        >
          <InputNumber
            min={100}
            max={100000}
            step={100}
            addonAfter="条"
            placeholder="输入记忆容量"
          />
        </Form.Item>

        <Form.Item
          name={['parameters', 'forgettingFactor']}
          label="遗忘因子"
          tooltip="控制旧知识的遗忘速度"
        >
          <Slider
            min={0}
            max={1}
            step={0.01}
            marks={{ 0: '快速遗忘', 0.5: '平衡', 1: '永久记忆' }}
          />
        </Form.Item>

        <Form.Item
          name={['parameters', 'explorationRate']}
          label="探索率"
          tooltip="在强化学习中控制探索与利用的平衡"
        >
          <Slider
            min={0}
            max={1}
            step={0.01}
            marks={{ 0: '纯利用', 0.5: '平衡', 1: '纯探索' }}
          />
        </Form.Item>
      </>
    );
  };

  /**
   * 渲染通用执行配置
   */
  const renderExecutionConfig = () => {
    return (
      <>
        <Form.Item
          name="executionMode"
          label="执行模式"
          tooltip="选择能力的执行方式"
        >
          <Select placeholder="选择执行模式">
            <Option value="sync">同步执行</Option>
            <Option value="async">异步执行</Option>
            <Option value="stream">流式执行</Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="timeout"
          label="超时时间"
          tooltip="设置能力执行的最大等待时间"
        >
          <InputNumber
            min={1000}
            max={300000}
            step={1000}
            addonAfter="毫秒"
            placeholder="输入超时时间"
          />
        </Form.Item>

        <Form.Item
          name={['retryPolicy', 'maxRetries']}
          label="最大重试次数"
          tooltip="执行失败时的最大重试次数"
        >
          <InputNumber
            min={0}
            max={10}
            step={1}
            placeholder="输入重试次数"
          />
        </Form.Item>

        <Form.Item
          name={['retryPolicy', 'backoffStrategy']}
          label="重试策略"
          tooltip="选择重试间隔的计算方式"
        >
          <Select placeholder="选择重试策略">
            <Option value="fixed">固定间隔</Option>
            <Option value="linear">线性递增</Option>
            <Option value="exponential">指数退避</Option>
          </Select>
        </Form.Item>
      </>
    );
  };

  /**
   * 渲染质量配置
   */
  const renderQualityConfig = () => {
    return (
      <>
        <Form.Item
          name="qualityThreshold"
          label="质量阈值"
          tooltip="设置能力输出结果的最低质量要求"
        >
          <Slider
            min={0}
            max={1}
            step={0.01}
            marks={{ 0: '0%', 0.5: '50%', 1: '100%' }}
            tooltip={{ formatter: (value) => `${(value! * 100).toFixed(0)}%` }}
          />
        </Form.Item>

        <Form.Item
          name={['performanceTarget', 'responseTime']}
          label="目标响应时间"
          tooltip="期望的响应时间目标"
        >
          <InputNumber
            min={100}
            max={60000}
            step={100}
            addonAfter="毫秒"
            placeholder="输入响应时间"
          />
        </Form.Item>

        <Form.Item
          name={['performanceTarget', 'accuracy']}
          label="目标准确率"
          tooltip="期望达到的准确率水平"
        >
          <Slider
            min={0}
            max={1}
            step={0.01}
            marks={{ 0: '0%', 0.9: '90%', 1: '100%' }}
            tooltip={{ formatter: (value) => `${(value! * 100).toFixed(0)}%` }}
          />
        </Form.Item>

        <Form.Item
          name={['performanceTarget', 'availability']}
          label="目标可用性"
          tooltip="期望的服务可用性水平"
        >
          <Slider
            min={0.9}
            max={1}
            step={0.001}
            marks={{ 0.9: '90%', 0.99: '99%', 1: '100%' }}
            tooltip={{ formatter: (value) => `${(value! * 100).toFixed(1)}%` }}
          />
        </Form.Item>
      </>
    );
  };

  /**
   * 渲染安全配置
   */
  const renderSecurityConfig = () => {
    return (
      <>
        <Form.Item
          name="securityLevel"
          label="安全级别"
          tooltip="设置能力的安全防护级别"
        >
          <Radio.Group>
            <Radio value="low">低</Radio>
            <Radio value="medium">中</Radio>
            <Radio value="high">高</Radio>
            <Radio value="critical">关键</Radio>
          </Radio.Group>
        </Form.Item>

        <Form.Item
          name={['accessControl', 'authentication']}
          label="身份认证"
          tooltip="是否启用身份认证"
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>

        <Form.Item
          name={['accessControl', 'encryption']}
          label="数据加密"
          tooltip="是否启用数据传输加密"
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>

        <Form.Item
          name={['accessControl', 'auditLog']}
          label="审计日志"
          tooltip="是否记录操作审计日志"
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>
      </>
    );
  };

  /**
   * 根据能力类型渲染特定配置
   */
  const renderTypeSpecificConfig = () => {
    switch (capability.type) {
      case CoreCapabilityType.COGNITIVE:
        return renderCognitiveConfig();
      case CoreCapabilityType.REASONING:
        return renderReasoningConfig();
      case CoreCapabilityType.DECISION:
        return renderDecisionConfig();
      case CoreCapabilityType.LEARNING:
        return renderLearningConfig();
      default:
        return null;
    }
  };

  return (
    <div className={`capability-config-panel ${className || ''}`}>
      <Card
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Space>
              {getCapabilityIcon(capability.type)}
              <span>{capability?.name || '未知能力'} 配置</span>
              <Tag color="blue">{capability.type}</Tag>
            </Space>
            {onRemove && (
              <Button
                type="text"
                danger
                
                icon={<DeleteOutlined />}
                onClick={onRemove}
                title="移除此能力"
              >
                移除
              </Button>
            )}
          </div>
        }
        
      >
        <Alert
          message="配置说明"
          description={`正在配置 ${capability?.name || '未知能力'} 能力模块。请根据实际需求调整各项参数，配置将实时保存。`}
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        <Collapse defaultActiveKey={['inputs']} ghost>
          <Panel
            header={
              <Space>
                <ExperimentOutlined />
                <span>输入参数</span>
              </Space>
            }
            key="inputs"
          >
            {renderInputsConfig()}
          </Panel>

          <Panel
            header={
              <Space>
                <InfoCircleOutlined />
                <span>输出参数</span>
              </Space>
            }
            key="outputs"
          >
            {renderOutputsConfig()}
          </Panel>

          <Panel
            header={
              <Space>
                <SettingOutlined />
                <span>处理规则</span>
              </Space>
            }
            key="processing"
          >
            {renderProcessingRulesConfig()}
          </Panel>
        </Collapse>
      </Card>
    </div>
  );
};

export default CapabilityConfigPanel;