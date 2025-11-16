import React, { useState, useEffect } from 'react';
import {
  Card, Button, List, Tag, Tooltip, Modal, Form, Input, Select,
  message, Spin, Empty, Space, Badge, Progress, Alert
} from 'antd';
import {
  BulbOutlined, RobotOutlined, ThunderboltOutlined,
  StarOutlined, CheckCircleOutlined, InfoCircleOutlined,
  ReloadOutlined, SendOutlined
} from '@ant-design/icons';
import {
  CoreCapabilityModule, Agent2_0, CoreCapabilityType,
  CapabilityMaturityLevel, CapabilityCategory
} from './CapabilitySystemTypes';

interface AIAssistantProps {
  agent: Agent2_0 | null;
  capabilities: CoreCapabilityModule[];
  availableCapabilities: CoreCapabilityModule[];
  onCapabilityRecommend: (capability: CoreCapabilityModule) => void;
  onTemplateApply: (template: AgentTemplate) => void;
  visible: boolean;
  onClose: () => void;
}

interface AgentTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  capabilities: string[];
  tags: string[];
  rating: number;
  downloads: number;
  preview: {
    image?: string;
    description: string;
  };
}

interface CapabilityRecommendation {
  capability: CoreCapabilityModule;
  score: number;
  reason: string;
  category: 'missing_dependency' | 'enhancement' | 'optimization' | 'best_practice';
}

interface DesignSuggestion {
  id: string;
  type: 'architecture' | 'performance' | 'security' | 'usability';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  actionable: boolean;
  action?: () => void;
}

const { Option } = Select;
const { TextArea } = Input;

const AIAssistant: React.FC<AIAssistantProps> = ({
  agent,
  capabilities,
  availableCapabilities,
  onCapabilityRecommend,
  onTemplateApply,
  visible,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'recommendations' | 'templates' | 'chat'>('recommendations');
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<CapabilityRecommendation[]>([]);
  const [templates, setTemplates] = useState<AgentTemplate[]>([]);
  const [suggestions, setSuggestions] = useState<DesignSuggestion[]>([]);
  const [chatMessages, setChatMessages] = useState<Array<{role: 'user' | 'assistant', content: string}>>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      generateRecommendations();
      loadTemplates();
      generateDesignSuggestions();
    }
  }, [visible, agent, capabilities]);

  /**
   * 生成能力推荐
   */
  const generateRecommendations = async () => {
    if (!agent || !capabilities) return;

    setLoading(true);
    try {
      const recs: CapabilityRecommendation[] = [];

      // 分析缺失的依赖
      capabilities.forEach(cap => {
        cap.dependencies.forEach(dep => {
          if (dep.type === 'required') {
            const exists = capabilities.some(c => c.id === dep.capabilityId);
            if (!exists) {
              const missingCap = availableCapabilities.find(c => c.id === dep.capabilityId);
              if (missingCap) {
                recs.push({
                  capability: missingCap,
                  score: 0.9,
                  reason: `${cap?.name || '未知能力'} 需要此能力作为必需依赖`,
                  category: 'missing_dependency'
                });
              }
            }
          }
        });
      });

      // 基于能力类型推荐增强能力
      const capabilityTypes = capabilities.map(c => c.type);
      const typeCount = capabilityTypes.reduce((acc, type) => {
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {} as Record<CoreCapabilityType, number>);

      // 推荐互补能力
      if (typeCount[CoreCapabilityType.COGNITIVE] && !typeCount[CoreCapabilityType.REASONING]) {
        const reasoningCaps = availableCapabilities.filter(c => c.type === CoreCapabilityType.REASONING);
        reasoningCaps.slice(0, 2).forEach(cap => {
          recs.push({
            capability: cap,
            score: 0.8,
            reason: '认知能力通常需要推理能力来增强决策质量',
            category: 'enhancement'
          });
        });
      }

      if (typeCount[CoreCapabilityType.REASONING] && !typeCount[CoreCapabilityType.DECISION]) {
        const decisionCaps = availableCapabilities.filter(c => c.type === CoreCapabilityType.DECISION);
        decisionCaps.slice(0, 2).forEach(cap => {
          recs.push({
            capability: cap,
            score: 0.8,
            reason: '推理能力需要决策能力来执行具体行动',
            category: 'enhancement'
          });
        });
      }

      // 推荐高成熟度能力
      const highMaturityCaps = availableCapabilities.filter(c => 
        c.maturityLevel === CapabilityMaturityLevel.OPTIMIZED &&
        !capabilities.some(existing => existing.id === c.id)
      );
      
      highMaturityCaps.slice(0, 3).forEach(cap => {
        recs.push({
          capability: cap,
          score: 0.7,
          reason: '高成熟度能力，经过充分优化和验证',
          category: 'best_practice'
        });
      });

      // 按分数排序
      recs.sort((a, b) => b.score - a.score);
      setRecommendations(recs.slice(0, 10));

    } catch (error) {
      console.error('生成推荐失败:', error);
      message.error('生成推荐失败');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 加载Agent模板
   */
  const loadTemplates = async () => {
    // 模拟模板数据
    const sampleTemplates: AgentTemplate[] = [
      {
        id: 'template_data_analyst',
        name: '数据分析师Agent',
        description: '专门用于数据分析和洞察生成的智能Agent',
        category: 'analytics',
        difficulty: 'intermediate',
        capabilities: ['cognitive_perception_001', 'reasoning_logical_001'],
        tags: ['数据分析', '可视化', '报告生成'],
        rating: 4.8,
        downloads: 1250,
        preview: {
          description: '集成数据感知、逻辑推理和决策能力，能够自动分析数据并生成洞察报告'
        }
      },
      {
        id: 'template_customer_service',
        name: '客服助手Agent',
        description: '智能客服Agent，提供24/7客户支持',
        category: 'service',
        difficulty: 'beginner',
        capabilities: ['cognitive_perception_001'],
        tags: ['客服', '对话', '问答'],
        rating: 4.6,
        downloads: 2100,
        preview: {
          description: '基于自然语言理解的客服Agent，能够处理常见问题并提供个性化服务'
        }
      },
      {
        id: 'template_content_creator',
        name: '内容创作Agent',
        description: '自动化内容创作和编辑的智能Agent',
        category: 'creative',
        difficulty: 'advanced',
        capabilities: ['cognitive_perception_001', 'reasoning_logical_001'],
        tags: ['内容创作', '写作', '编辑'],
        rating: 4.9,
        downloads: 890,
        preview: {
          description: '结合创意思维和逻辑推理，能够生成高质量的文章、报告和创意内容'
        }
      }
    ];

    setTemplates(sampleTemplates);
  };

  /**
   * 生成设计建议
   */
  const generateDesignSuggestions = () => {
    if (!agent || !capabilities) return;

    const suggestions: DesignSuggestion[] = [];

    // 架构建议
    if (capabilities.length > 5) {
      suggestions.push({
        id: 'arch_complexity',
        type: 'architecture',
        title: '简化能力架构',
        description: '当前Agent包含较多能力模块，建议考虑拆分为多个专门化的Agent',
        priority: 'medium',
        actionable: true
      });
    }

    if (capabilities.length === 0) {
      suggestions.push({
        id: 'arch_empty',
        type: 'architecture',
        title: '添加核心能力',
        description: 'Agent需要至少一个核心能力模块才能正常工作',
        priority: 'high',
        actionable: true
      });
    }

    // 性能建议
    const hasHighResourceCaps = capabilities.some(cap => 
      cap.resources.some(res => res.priority === 'high')
    );
    if (hasHighResourceCaps) {
      suggestions.push({
        id: 'perf_resources',
        type: 'performance',
        title: '优化资源配置',
        description: '检测到高资源需求的能力，建议配置资源池和负载均衡',
        priority: 'medium',
        actionable: true
      });
    }

    // 安全建议
    const hasSecurityCaps = capabilities.some(cap => 
      cap.config.securityLevel === 'high'
    );
    if (hasSecurityCaps) {
      suggestions.push({
        id: 'security_audit',
        type: 'security',
        title: '启用安全审计',
        description: '高安全级别的能力建议启用详细的审计日志和访问控制',
        priority: 'high',
        actionable: true
      });
    }

    setSuggestions(suggestions);
  };

  /**
   * 处理AI聊天
   */
  const handleChatSubmit = async () => {
    if (!chatInput.trim()) return;

    const userMessage = chatInput.trim();
    setChatInput('');
    setChatLoading(true);

    // 添加用户消息
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);

    try {
      // 模拟AI响应
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      let response = '';
      
      if (userMessage.includes('推荐') || userMessage.includes('建议')) {
        response = '基于您当前的Agent配置，我建议添加以下能力：\n\n1. 如果您的Agent需要处理复杂逻辑，可以考虑添加逻辑推理能力\n2. 对于需要学习和适应的场景，建议集成自适应学习能力\n3. 如果涉及多模态数据处理，多模态感知能力会很有帮助\n\n您希望我详细解释哪个能力的配置吗？';
      } else if (userMessage.includes('性能') || userMessage.includes('优化')) {
        response = '关于性能优化，我有以下建议：\n\n1. 启用能力缓存来减少重复计算\n2. 配置合适的超时和重试策略\n3. 使用负载均衡分散计算压力\n4. 监控关键性能指标\n\n需要我帮您配置具体的优化参数吗？';
      } else if (userMessage.includes('安全') || userMessage.includes('权限')) {
        response = '安全配置建议：\n\n1. 为敏感能力启用身份验证和授权\n2. 配置数据加密和传输安全\n3. 启用审计日志记录所有操作\n4. 设置访问控制策略\n\n您需要针对哪个具体的安全场景进行配置？';
      } else {
        response = '我是您的AI设计助手，可以帮助您：\n\n• 推荐合适的能力模块\n• 优化Agent架构设计\n• 提供性能和安全建议\n• 解答配置相关问题\n\n请告诉我您需要什么帮助？';
      }

      setChatMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (error) {
      message.error('AI助手暂时无法响应，请稍后重试');
    } finally {
      setChatLoading(false);
    }
  };

  /**
   * 获取推荐类别颜色
   */
  const getCategoryColor = (category: string) => {
    const colors = {
      missing_dependency: '#ff4d4f',
      enhancement: '#52c41a',
      optimization: '#1890ff',
      best_practice: '#722ed1'
    };
    return colors[category as keyof typeof colors] || '#d9d9d9';
  };

  /**
   * 获取推荐类别标签
   */
  const getCategoryLabel = (category: string) => {
    const labels = {
      missing_dependency: '缺失依赖',
      enhancement: '功能增强',
      optimization: '性能优化',
      best_practice: '最佳实践'
    };
    return labels[category as keyof typeof labels] || category;
  };

  /**
   * 获取难度颜色
   */
  const getDifficultyColor = (difficulty: string) => {
    const colors = {
      beginner: '#52c41a',
      intermediate: '#faad14',
      advanced: '#ff4d4f'
    };
    return colors[difficulty as keyof typeof colors] || '#d9d9d9';
  };

  /**
   * 渲染推荐内容
   */
  const renderRecommendations = () => (
    <div className="ai-recommendations">
      <div className="section-header">
        <h3>智能推荐</h3>
        <Button 
          icon={<ReloadOutlined />} 
          onClick={generateRecommendations}
          loading={loading}
          
        >
          刷新推荐
        </Button>
      </div>
      
      {loading ? (
        <div className="loading-container">
          <Spin size="large" />
          <p>正在分析您的Agent配置...</p>
        </div>
      ) : recommendations.length > 0 ? (
        <List
          dataSource={recommendations}
          renderItem={(rec) => (
            <List.Item
              actions={[
                <Button 
                  type="primary" 
                  
                  onClick={() => onCapabilityRecommend(rec.capability)}
                >
                  添加能力
                </Button>
              ]}
            >
              <List.Item.Meta
                avatar={
                  <div className="capability-avatar">
                    <Badge 
                      count={Math.round(rec.score * 100)} 
                      style={{ backgroundColor: getCategoryColor(rec.category) }}
                    >
                      <div className="capability-icon">
                        <BulbOutlined />
                      </div>
                    </Badge>
                  </div>
                }
                title={
                  <Space>
                    <span>{rec.capability?.name || '未知能力'}</span>
                    <Tag color={getCategoryColor(rec.category)}>
                      {getCategoryLabel(rec.category)}
                    </Tag>
                  </Space>
                }
                description={
                  <div>
                    <p>{rec.capability.description}</p>
                    <p className="recommendation-reason">
                      <InfoCircleOutlined /> {rec.reason}
                    </p>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      ) : (
        <Empty description="暂无推荐内容" />
      )}
      
      {/* 设计建议 */}
      {suggestions.length > 0 && (
        <div className="design-suggestions">
          <h4>设计建议</h4>
          <List
            
            dataSource={suggestions}
            renderItem={(suggestion) => (
              <List.Item>
                <Alert
                  type={suggestion.priority === 'high' ? 'error' : suggestion.priority === 'medium' ? 'warning' : 'info'}
                  message={suggestion.title}
                  description={suggestion.description}
                  showIcon
                  style={{ width: '100%' }}
                />
              </List.Item>
            )}
          />
        </div>
      )}
    </div>
  );

  /**
   * 渲染模板内容
   */
  const renderTemplates = () => (
    <div className="ai-templates">
      <div className="section-header">
        <h3>Agent模板</h3>
        <Select
          placeholder="筛选分类"
          style={{ width: 120 }}
          allowClear
          
        >
          <Option value="analytics">数据分析</Option>
          <Option value="service">客户服务</Option>
          <Option value="creative">内容创作</Option>
        </Select>
      </div>
      
      <List
        grid={{ gutter: 16, column: 1 }}
        dataSource={templates}
        renderItem={(template) => (
          <List.Item>
            <Card
              
              title={
                <Space>
                  <span>{template.name}</span>
                  <Tag color={getDifficultyColor(template.difficulty)}>
                    {template.difficulty}
                  </Tag>
                </Space>
              }
              extra={
                <Space>
                  <span>{template.rating} ⭐</span>
                  <span>{template.downloads} 下载</span>
                </Space>
              }
              actions={[
                <Button 
                  type="primary" 
                  
                  onClick={() => onTemplateApply(template)}
                >
                  应用模板
                </Button>
              ]}
            >
              <p>{template.description}</p>
              <p>{template.preview.description}</p>
              <div className="template-tags">
                {template.tags.map(tag => (
                  <Tag key={tag}>{tag}</Tag>
                ))}
              </div>
            </Card>
          </List.Item>
        )}
      />
    </div>
  );

  /**
   * 渲染聊天内容
   */
  const renderChat = () => (
    <div className="ai-chat">
      <div className="chat-messages">
        {chatMessages.length === 0 ? (
          <div className="chat-welcome">
            <RobotOutlined style={{ fontSize: 48, color: '#1890ff' }} />
            <h3>AI设计助手</h3>
            <p>我可以帮助您优化Agent设计，推荐合适的能力模块，解答配置问题。</p>
            <p>请输入您的问题或需求...</p>
          </div>
        ) : (
          chatMessages.map((msg, index) => (
            <div key={index} className={`chat-message ${msg.role}`}>
              <div className="message-content">
                {msg.content.split('\n').map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </div>
            </div>
          ))
        )}
        {chatLoading && (
          <div className="chat-message assistant">
            <div className="message-content">
              <Spin  /> 正在思考...
            </div>
          </div>
        )}
      </div>
      
      <div className="chat-input">
        <Input.Group compact>
          <Input
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onPressEnter={handleChatSubmit}
            placeholder="输入您的问题..."
            disabled={chatLoading}
            style={{ width: 'calc(100% - 40px)' }}
          />
          <Button 
            type="primary" 
            icon={<SendOutlined />}
            onClick={handleChatSubmit}
            loading={chatLoading}
            disabled={!chatInput.trim()}
          />
        </Input.Group>
      </div>
    </div>
  );

  return (
    <Modal
      title="AI设计助手"
      open={visible}
      onCancel={onClose}
      footer={null}
      width={800}
      className="ai-assistant-modal"
    >
      <div className="ai-assistant-content">
        <div className="ai-tabs">
          <div className="tab-buttons">
            <Button 
              type={activeTab === 'recommendations' ? 'primary' : 'default'}
              onClick={() => setActiveTab('recommendations')}
              icon={<ThunderboltOutlined />}
            >
              智能推荐
            </Button>
            <Button 
              type={activeTab === 'templates' ? 'primary' : 'default'}
              onClick={() => setActiveTab('templates')}
              icon={<StarOutlined />}
            >
              模板库
            </Button>
            <Button 
              type={activeTab === 'chat' ? 'primary' : 'default'}
              onClick={() => setActiveTab('chat')}
              icon={<RobotOutlined />}
            >
              AI助手
            </Button>
          </div>
          
          <div className="tab-content">
            {activeTab === 'recommendations' && renderRecommendations()}
            {activeTab === 'templates' && renderTemplates()}
            {activeTab === 'chat' && renderChat()}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default AIAssistant;