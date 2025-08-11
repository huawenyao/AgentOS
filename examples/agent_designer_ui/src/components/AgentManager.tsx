import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  message,
  Popconfirm,
  Tooltip,
  Row,
  Col,
  Statistic,
  Typography,
  Divider,
  Avatar,
  Badge,
  Checkbox
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  StopOutlined,
  EyeOutlined,
  CopyOutlined,
  SettingOutlined,
  RobotOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  SyncOutlined
} from '@ant-design/icons';
import { AgentType, AgentStatus } from './types';
import ApiService from './ApiService';
import './AgentManager.css';

const { Title, Text } = Typography;
const { Option } = Select;

// 使用统一的Agent接口定义
interface Agent {
  id: string;
  name: string;
  description: string;
  type: AgentType;
  status: AgentStatus;
  createdAt: string;
  updatedAt: string;
  lastRunAt?: string;
  author: string;
  version: number;
  tags: string[];
  // 工作流配置
  workflow?: {
    nodes: any[];
    edges: any[];
  };
  // 组件配置
  components?: any[];
  // 配置信息
  config: {
    properties: Record<string, any>;
    settings?: {
      darkMode?: boolean;
      [key: string]: any;
    };
  };
  // 性能指标
  metrics: {
    totalRuns: number;
    successRate: number;
    avgExecutionTime: number;
  };
  // LLM配置（可选）
  llmConfig?: {
    provider: string;
    model: string;
    temperature?: number;
    maxTokens?: number;
  };
  // 系统提示词（可选）
  systemPrompt?: string;
  // 能力配置（可选）
  capabilities?: Array<{
    capabilityId: string;
    enabled: boolean;
    config: Record<string, any>;
  }>;
}

const AgentManager: React.FC = () => {
  const navigate = useNavigate();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [batchDeleteVisible, setBatchDeleteVisible] = useState(false);
  const [form] = Form.useForm();
  const apiService = ApiService;

  // 模拟数据
  const mockAgents: Agent[] = [
    {
      id: '1',
      name: '智能客服助手',
      description: '基于自然语言处理的智能客服系统，能够处理常见问题咨询',
      type: AgentType.EXECUTION,
      status: AgentStatus.RUNNING,
      createdAt: '2024-01-15T10:30:00Z',
      updatedAt: '2024-01-20T14:20:00Z',
      lastRunAt: '2024-01-20T14:20:00Z',
      author: '张三',
      version: 1,
      tags: ['客服', '自然语言处理', '对话系统'],
      workflow: {
          nodes: [
            {
              id: 'input-1',
              type: 'input',
              position: { x: 100, y: 100 },
              data: { label: '用户输入', type: 'text' }
            },
            {
              id: 'nlp-1',
              type: 'capability',
              position: { x: 300, y: 100 },
              data: { label: 'NLP处理', capability: 'natural-language-processing' }
            },
            {
              id: 'intent-1',
              type: 'capability',
              position: { x: 500, y: 100 },
              data: { label: '意图识别', capability: 'intent-recognition' }
            },
            {
              id: 'response-1',
              type: 'capability',
              position: { x: 700, y: 100 },
              data: { label: '响应生成', capability: 'response-generation' }
            },
            {
              id: 'output-1',
              type: 'output',
              position: { x: 900, y: 100 },
              data: { label: '客服回复', type: 'text' }
            }
          ],
          edges: [
            { id: 'e1-2', source: 'input-1', target: 'nlp-1' },
            { id: 'e2-3', source: 'nlp-1', target: 'intent-1' },
            { id: 'e3-4', source: 'intent-1', target: 'response-1' },
            { id: 'e4-5', source: 'response-1', target: 'output-1' }
          ]
        },
        components: [
          { id: 'nlp-component', type: 'natural-language-processing', name: 'NLP处理器' },
          { id: 'intent-component', type: 'intent-recognition', name: '意图识别器' },
          { id: 'response-component', type: 'response-generation', name: '响应生成器' }
        ],
        config: {
          properties: {
            maxResponseTime: 3000,
            language: 'zh-CN',
            confidenceThreshold: 0.8
          }
        },
      metrics: {
        totalRuns: 1250,
        successRate: 95.8,
        avgExecutionTime: 1.2
      },
      llmConfig: {
        provider: 'openai',
        model: 'gpt-3.5-turbo',
        temperature: 0.3,
        maxTokens: 1024
      },
      systemPrompt: '你是一个专业的客服助手，能够理解用户问题并提供准确、友好的回复。',
      capabilities: [
        {
          capabilityId: 'natural_language_processing',
          enabled: true,
          config: {
            language: 'zh-CN',
            confidenceThreshold: 0.8
          }
        },
        {
          capabilityId: 'intent_recognition',
          enabled: true,
          config: {
            maxIntents: 50,
            threshold: 0.7
          }
        }
      ]
    },
    {
      id: '2',
      name: '数据分析专家',
      description: '专门用于数据分析和报告生成的智能Agent',
      type: AgentType.PLANNING,
      status: AgentStatus.IDLE,
      createdAt: '2024-01-10T09:15:00Z',
      updatedAt: '2024-01-18T16:45:00Z',
      lastRunAt: '2024-01-18T16:45:00Z',
      author: '李四',
      version: 2,
      tags: ['数据分析', '报告生成', '统计'],
      workflow: {
          nodes: [
            {
              id: 'data-input-1',
              type: 'input',
              position: { x: 50, y: 50 },
              data: { label: '数据源', type: 'dataset' }
            },
            {
              id: 'data-clean-1',
              type: 'capability',
              position: { x: 250, y: 50 },
              data: { label: '数据清洗', capability: 'data-cleaning' }
            },
            {
              id: 'analysis-1',
              type: 'capability',
              position: { x: 450, y: 50 },
              data: { label: '统计分析', capability: 'statistical-analysis' }
            },
            {
              id: 'viz-1',
              type: 'capability',
              position: { x: 250, y: 200 },
              data: { label: '数据可视化', capability: 'data-visualization' }
            },
            {
              id: 'report-1',
              type: 'capability',
              position: { x: 450, y: 200 },
              data: { label: '报告生成', capability: 'report-generation' }
            },
            {
              id: 'output-1',
              type: 'output',
              position: { x: 650, y: 125 },
              data: { label: '分析报告', type: 'document' }
            }
          ],
          edges: [
            { id: 'e1-2', source: 'data-input-1', target: 'data-clean-1' },
            { id: 'e2-3', source: 'data-clean-1', target: 'analysis-1' },
            { id: 'e2-4', source: 'data-clean-1', target: 'viz-1' },
            { id: 'e3-5', source: 'analysis-1', target: 'report-1' },
            { id: 'e4-5', source: 'viz-1', target: 'report-1' },
            { id: 'e5-6', source: 'report-1', target: 'output-1' }
          ]
        },
        components: [
          { id: 'clean-component', type: 'data-cleaning', name: '数据清洗器' },
          { id: 'analysis-component', type: 'statistical-analysis', name: '统计分析器' },
          { id: 'viz-component', type: 'data-visualization', name: '可视化引擎' },
          { id: 'report-component', type: 'report-generation', name: '报告生成器' }
        ],
        config: {
          properties: {
            dataFormat: 'csv,json,xlsx',
            analysisType: 'descriptive,predictive',
            outputFormat: 'pdf,html,docx'
          }
        },
      metrics: {
        totalRuns: 856,
        successRate: 92.3,
        avgExecutionTime: 3.5
      },
      llmConfig: {
        provider: 'anthropic',
        model: 'claude-3-sonnet',
        temperature: 0.1,
        maxTokens: 4096
      },
      systemPrompt: '你是一个专业的数据分析师，能够处理各种数据格式，进行深度分析并生成详细的报告。',
      capabilities: [
        {
          capabilityId: 'data_cleaning',
          enabled: true,
          config: {
            supportedFormats: ['csv', 'json', 'xlsx'],
            autoDetectEncoding: true
          }
        },
        {
          capabilityId: 'statistical_analysis',
          enabled: true,
          config: {
            analysisTypes: ['descriptive', 'predictive', 'correlation'],
            confidenceLevel: 0.95
          }
        },
        {
          capabilityId: 'data_visualization',
          enabled: true,
          config: {
            chartTypes: ['bar', 'line', 'scatter', 'heatmap'],
            outputFormat: 'svg'
          }
        }
      ]
    },
    {
      id: '3',
      name: '代码审查助手',
      description: '自动化代码审查和质量检测Agent',
      type: AgentType.AUDIT,
      status: AgentStatus.PAUSED,
      createdAt: '2024-01-08T14:20:00Z',
      updatedAt: '2024-01-19T11:30:00Z',
      lastRunAt: '2024-01-19T11:30:00Z',
      author: '王五',
      version: 1,
      tags: ['代码审查', '质量检测', '自动化'],
      workflow: {
          nodes: [
            {
              id: 'code-input-1',
              type: 'input',
              position: { x: 100, y: 50 },
              data: { label: '代码输入', type: 'code' }
            },
            {
              id: 'syntax-check-1',
              type: 'capability',
              position: { x: 300, y: 50 },
              data: { label: '语法检查', capability: 'syntax-analysis' }
            },
            {
              id: 'quality-check-1',
              type: 'capability',
              position: { x: 500, y: 50 },
              data: { label: '质量检测', capability: 'code-quality-analysis' }
            },
            {
              id: 'security-check-1',
              type: 'capability',
              position: { x: 300, y: 200 },
              data: { label: '安全检测', capability: 'security-analysis' }
            },
            {
              id: 'performance-check-1',
              type: 'capability',
              position: { x: 500, y: 200 },
              data: { label: '性能分析', capability: 'performance-analysis' }
            },
            {
              id: 'report-gen-1',
              type: 'capability',
              position: { x: 700, y: 125 },
              data: { label: '报告生成', capability: 'audit-report-generation' }
            },
            {
              id: 'audit-output-1',
              type: 'output',
              position: { x: 900, y: 125 },
              data: { label: '审查报告', type: 'report' }
            }
          ],
          edges: [
            { id: 'e1-2', source: 'code-input-1', target: 'syntax-check-1' },
            { id: 'e2-3', source: 'syntax-check-1', target: 'quality-check-1' },
            { id: 'e2-4', source: 'syntax-check-1', target: 'security-check-1' },
            { id: 'e3-6', source: 'quality-check-1', target: 'report-gen-1' },
            { id: 'e4-5', source: 'security-check-1', target: 'performance-check-1' },
            { id: 'e5-6', source: 'performance-check-1', target: 'report-gen-1' },
            { id: 'e6-7', source: 'report-gen-1', target: 'audit-output-1' }
          ]
        },
        components: [
          { id: 'syntax-component', type: 'syntax-analysis', name: '语法分析器' },
          { id: 'quality-component', type: 'code-quality-analysis', name: '质量检测器' },
          { id: 'security-component', type: 'security-analysis', name: '安全扫描器' },
          { id: 'performance-component', type: 'performance-analysis', name: '性能分析器' },
          { id: 'audit-report-component', type: 'audit-report-generation', name: '审查报告生成器' }
        ],
        config: {
          properties: {
            supportedLanguages: 'javascript,python,java,go',
            severityLevels: 'low,medium,high,critical',
            reportFormat: 'json,html,pdf'
          }
        },
      metrics: {
        totalRuns: 423,
        successRate: 88.7,
        avgExecutionTime: 2.8
      },
      llmConfig: {
        provider: 'openai',
        model: 'gpt-4',
        temperature: 0.2,
        maxTokens: 3000
      },
      systemPrompt: '你是一个专业的代码审查专家，能够识别代码中的问题、安全漏洞和性能瓶颈，并提供改进建议。',
      capabilities: [
        {
          capabilityId: 'syntax_analysis',
          enabled: true,
          config: {
            languages: ['javascript', 'python', 'java', 'go'],
            strictMode: true
          }
        },
        {
          capabilityId: 'code_quality_analysis',
          enabled: true,
          config: {
            rules: ['complexity', 'duplication', 'maintainability'],
            threshold: 'medium'
          }
        },
        {
          capabilityId: 'security_analysis',
          enabled: true,
          config: {
            scanTypes: ['vulnerability', 'injection', 'authentication'],
            severity: 'high'
          }
        }
      ]
    },
    {
      id: '4',
      name: '知识管理系统',
      description: '企业知识库管理和智能问答Agent',
      type: AgentType.MEMORY,
      status: AgentStatus.ERROR,
      createdAt: '2024-01-12T16:45:00Z',
      updatedAt: '2024-01-21T09:10:00Z',
      lastRunAt: '2024-01-21T09:10:00Z',
      author: '赵六',
      version: 1,
      tags: ['知识管理', '问答系统', '企业应用'],
      workflow: {
          nodes: [
            {
              id: 'query-input-1',
              type: 'input',
              position: { x: 50, y: 100 },
              data: { label: '用户查询', type: 'text' }
            },
            {
              id: 'knowledge-input-1',
              type: 'input',
              position: { x: 50, y: 250 },
              data: { label: '知识库', type: 'database' }
            },
            {
              id: 'query-process-1',
              type: 'capability',
              position: { x: 250, y: 100 },
              data: { label: '查询处理', capability: 'query-processing' }
            },
            {
              id: 'knowledge-search-1',
              type: 'capability',
              position: { x: 450, y: 175 },
              data: { label: '知识检索', capability: 'knowledge-retrieval' }
            },
            {
              id: 'context-analysis-1',
              type: 'capability',
              position: { x: 650, y: 100 },
              data: { label: '上下文分析', capability: 'context-analysis' }
            },
            {
              id: 'answer-gen-1',
              type: 'capability',
              position: { x: 850, y: 175 },
              data: { label: '答案生成', capability: 'answer-generation' }
            },
            {
              id: 'knowledge-update-1',
              type: 'capability',
              position: { x: 450, y: 300 },
              data: { label: '知识更新', capability: 'knowledge-update' }
            },
            {
              id: 'answer-output-1',
              type: 'output',
              position: { x: 1050, y: 175 },
              data: { label: '智能回答', type: 'text' }
            }
          ],
          edges: [
            { id: 'e1-3', source: 'query-input-1', target: 'query-process-1' },
            { id: 'e2-4', source: 'knowledge-input-1', target: 'knowledge-search-1' },
            { id: 'e3-4', source: 'query-process-1', target: 'knowledge-search-1' },
            { id: 'e3-5', source: 'query-process-1', target: 'context-analysis-1' },
            { id: 'e4-6', source: 'knowledge-search-1', target: 'answer-gen-1' },
            { id: 'e4-7', source: 'knowledge-search-1', target: 'knowledge-update-1' },
            { id: 'e5-6', source: 'context-analysis-1', target: 'answer-gen-1' },
            { id: 'e6-8', source: 'answer-gen-1', target: 'answer-output-1' }
          ]
        },
        components: [
          { id: 'query-component', type: 'query-processing', name: '查询处理器' },
          { id: 'retrieval-component', type: 'knowledge-retrieval', name: '知识检索器' },
          { id: 'context-component', type: 'context-analysis', name: '上下文分析器' },
          { id: 'answer-component', type: 'answer-generation', name: '答案生成器' },
          { id: 'update-component', type: 'knowledge-update', name: '知识更新器' }
        ],
        config: {
          properties: {
            searchAlgorithm: 'semantic,keyword,hybrid',
            maxResults: 10,
            confidenceThreshold: 0.7,
            updateFrequency: 'daily'
          }
        },
      metrics: {
        totalRuns: 672,
        successRate: 76.2,
        avgExecutionTime: 4.1
      },
      llmConfig: {
        provider: 'openai',
        model: 'gpt-4-turbo',
        temperature: 0.5,
        maxTokens: 2048
      },
      systemPrompt: '你是一个企业知识管理专家，能够理解用户查询意图，从知识库中检索相关信息，并生成准确的答案。',
      capabilities: [
        {
          capabilityId: 'query_processing',
          enabled: true,
          config: {
            language: 'zh-CN',
            intentRecognition: true,
            entityExtraction: true
          }
        },
        {
          capabilityId: 'knowledge_retrieval',
          enabled: true,
          config: {
            searchAlgorithm: 'hybrid',
            maxResults: 10,
            threshold: 0.7
          }
        },
        {
          capabilityId: 'vector_search',
          enabled: true,
          config: {
            embeddingModel: 'text-embedding-ada-002',
            similarity: 'cosine'
          }
        }
      ]
    },
    {
      id: '5',
      name: '文档生成器',
      description: '自动生成技术文档和API文档的Agent',
      type: AgentType.EXECUTION,
      status: AgentStatus.COMPLETED,
      createdAt: '2024-01-05T11:20:00Z',
      updatedAt: '2024-01-17T13:55:00Z',
      lastRunAt: '2024-01-17T13:55:00Z',
      author: '孙七',
      version: 2,
      tags: ['文档生成', '自动化', 'API文档'],
      workflow: {
        nodes: [
          {
            id: 'start_1',
            type: 'start_node',
            position: { x: 100, y: 100 },
            data: { label: '开始' }
          },
          {
            id: 'doc_gen_1',
            type: 'llm_reasoning',
            position: { x: 300, y: 100 },
            data: { label: '文档生成' }
          }
        ],
        edges: [
          {
            id: 'e1',
            source: 'start_1',
            target: 'doc_gen_1'
          }
        ]
      },
      components: [
        {
          id: 'comp_1',
          name: 'LLM推理组件',
          type: 'llm_reasoning',
          category: 'capability'
        }
      ],
      config: {
        properties: {
          outputFormat: 'markdown',
          includeExamples: true,
          language: 'zh-CN'
        },
        settings: {
          darkMode: false,
          autoSave: true
        }
      },
      metrics: {
        totalRuns: 234,
        successRate: 97.4,
        avgExecutionTime: 5.2
      },
      llmConfig: {
        provider: 'openai',
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 2048
      },
      systemPrompt: '你是一个专业的技术文档生成助手，能够根据代码和需求生成高质量的技术文档。',
      capabilities: [
        {
          capabilityId: 'llm_reasoning',
          enabled: true,
          config: {
            model: 'gpt-4',
            temperature: 0.7
          }
        },
        {
          capabilityId: 'file_operation',
          enabled: true,
          config: {
            allowedFormats: ['md', 'txt', 'json']
          }
        }
      ]
    }
  ];

  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    setLoading(true);
    try {
      // 使用模拟数据
      setAgents(mockAgents);
      // 实际API调用
      // const response = await apiService.getAgents();
      // setAgents(response.data || []);
    } catch (error) {
      console.error('加载Agent列表失败:', error);
      message.error('加载Agent列表失败');
      // 出错时使用模拟数据
      setAgents(mockAgents);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: AgentStatus) => {
    const statusColors = {
      [AgentStatus.IDLE]: 'default',
      [AgentStatus.RUNNING]: 'processing',
      [AgentStatus.STOPPED]: 'default',
      [AgentStatus.PAUSED]: 'warning',
      [AgentStatus.ERROR]: 'error',
      [AgentStatus.COMPLETED]: 'success'
    };
    return statusColors[status] || 'default';
  };

  const getStatusText = (status: AgentStatus) => {
    const statusTexts = {
      [AgentStatus.IDLE]: '空闲',
      [AgentStatus.RUNNING]: '运行中',
      [AgentStatus.STOPPED]: '已停止',
      [AgentStatus.PAUSED]: '已暂停',
      [AgentStatus.ERROR]: '错误',
      [AgentStatus.COMPLETED]: '已完成'
    };
    return statusTexts[status] || status;
  };

  const getTypeText = (type: AgentType) => {
    const typeTexts = {
      [AgentType.PLANNING]: '规划型',
      [AgentType.EXECUTION]: '执行型',
      [AgentType.AUDIT]: '审计型',
      [AgentType.MEMORY]: '记忆型',
      [AgentType.CONVERSATIONAL]: '对话型'
    };
    return typeTexts[type] || type;
  };

  const getTypeColor = (type: AgentType) => {
    const typeColors = {
      [AgentType.PLANNING]: 'blue',
      [AgentType.EXECUTION]: 'green',
      [AgentType.AUDIT]: 'orange',
      [AgentType.MEMORY]: 'purple',
      [AgentType.CONVERSATIONAL]: 'cyan'
    };
    return typeColors[type] || 'default';
  };

  /**
   * 验证Agent状态转换是否合法
   * @param currentStatus 当前状态
   * @param targetStatus 目标状态
   * @returns 是否允许转换
   */
  const validateStatusTransition = (currentStatus: AgentStatus, targetStatus: AgentStatus): boolean => {
    const validTransitions: Record<AgentStatus, AgentStatus[]> = {
      [AgentStatus.IDLE]: [AgentStatus.RUNNING],
      [AgentStatus.RUNNING]: [AgentStatus.PAUSED, AgentStatus.STOPPED, AgentStatus.COMPLETED],
      [AgentStatus.PAUSED]: [AgentStatus.RUNNING, AgentStatus.STOPPED],
      [AgentStatus.STOPPED]: [AgentStatus.RUNNING],
      [AgentStatus.ERROR]: [AgentStatus.RUNNING, AgentStatus.STOPPED],
      [AgentStatus.COMPLETED]: [AgentStatus.RUNNING]
    };
    
    return validTransitions[currentStatus]?.includes(targetStatus) || false;
  };

  /**
   * 更新Agent状态（本地状态管理）
   * @param agentId Agent ID
   * @param newStatus 新状态
   */
  const updateAgentStatus = (agentId: string, newStatus: AgentStatus) => {
    setAgents(prevAgents => 
      prevAgents.map(agent => 
        agent.id === agentId 
          ? { 
              ...agent, 
              status: newStatus, 
              updatedAt: new Date().toISOString(),
              lastRunAt: newStatus === AgentStatus.RUNNING ? new Date().toISOString() : agent.lastRunAt
            }
          : agent
      )
    );
  };

  /**
   * 启动Agent
   * @param agent Agent对象
   */
  const handleStartAgent = async (agent: Agent) => {
    // 验证状态转换
    if (!validateStatusTransition(agent.status, AgentStatus.RUNNING)) {
      message.error(`Agent当前状态为"${getStatusText(agent.status)}"，无法启动`);
      return;
    }

    setLoading(true);
    try {
      // TODO: 实际API调用
      // await apiService.startAgent(agent.id);
      
      // 模拟API延迟
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      updateAgentStatus(agent.id, AgentStatus.RUNNING);
      message.success(`Agent "${agent.name}" 启动成功`);
    } catch (error: any) {
      console.error('启动Agent失败:', error);
      message.error(`启动Agent失败: ${error.message || '未知错误'}`);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 停止Agent
   * @param agent Agent对象
   */
  const handleStopAgent = async (agent: Agent) => {
    if (!validateStatusTransition(agent.status, AgentStatus.STOPPED)) {
      message.error(`Agent当前状态为"${getStatusText(agent.status)}"，无法停止`);
      return;
    }

    setLoading(true);
    try {
      // TODO: 实际API调用
      // await apiService.stopAgent(agent.id);
      
      await new Promise(resolve => setTimeout(resolve, 800));
      
      updateAgentStatus(agent.id, AgentStatus.STOPPED);
      message.success(`Agent "${agent.name}" 停止成功`);
    } catch (error: any) {
      console.error('停止Agent失败:', error);
      message.error(`停止Agent失败: ${error.message || '未知错误'}`);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 暂停Agent
   * @param agent Agent对象
   */
  const handlePauseAgent = async (agent: Agent) => {
    if (!validateStatusTransition(agent.status, AgentStatus.PAUSED)) {
      message.error(`Agent当前状态为"${getStatusText(agent.status)}"，无法暂停`);
      return;
    }

    setLoading(true);
    try {
      // TODO: 实际API调用
      // await apiService.pauseAgent(agent.id);
      
      await new Promise(resolve => setTimeout(resolve, 600));
      
      updateAgentStatus(agent.id, AgentStatus.PAUSED);
      message.success(`Agent "${agent.name}" 暂停成功`);
    } catch (error: any) {
      console.error('暂停Agent失败:', error);
      message.error(`暂停Agent失败: ${error.message || '未知错误'}`);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 删除Agent（需要确认）
   * @param agent Agent对象
   */
  const handleDeleteAgent = async (agent: Agent) => {
    setLoading(true);
    try {
      // TODO: 实际API调用
      // await apiService.deleteAgent(agent.id);
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // 从列表中移除Agent
      setAgents(prevAgents => prevAgents.filter(a => a.id !== agent.id));
      message.success(`Agent "${agent.name}" 删除成功`);
    } catch (error: any) {
      console.error('删除Agent失败:', error);
      message.error(`删除Agent失败: ${error.message || '未知错误'}`);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 批量删除Agent
   */
  const handleBatchDelete = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择要删除的Agent');
      return;
    }

    setLoading(true);
    try {
      // TODO: 实际API调用
      // await apiService.batchDeleteAgents(selectedRowKeys);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 从列表中移除选中的Agent
      setAgents(prevAgents => prevAgents.filter(a => !selectedRowKeys.includes(a.id)));
      setSelectedRowKeys([]);
      setBatchDeleteVisible(false);
      message.success(`成功删除 ${selectedRowKeys.length} 个Agent`);
    } catch (error: any) {
      console.error('批量删除Agent失败:', error);
      message.error(`批量删除Agent失败: ${error.message || '未知错误'}`);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 批量启动Agent
   */
  const handleBatchStart = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择要启动的Agent');
      return;
    }

    const selectedAgents = agents.filter(a => selectedRowKeys.includes(a.id));
    const validAgents = selectedAgents.filter(a => validateStatusTransition(a.status, AgentStatus.RUNNING));
    
    if (validAgents.length === 0) {
      message.warning('所选Agent均无法启动');
      return;
    }

    setLoading(true);
    try {
      // TODO: 实际API调用
      // await apiService.batchStartAgents(validAgents.map(a => a.id));
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // 更新Agent状态
      validAgents.forEach(agent => {
        updateAgentStatus(agent.id, AgentStatus.RUNNING);
      });
      
      setSelectedRowKeys([]);
      message.success(`成功启动 ${validAgents.length} 个Agent`);
    } catch (error: any) {
      console.error('批量启动Agent失败:', error);
      message.error(`批量启动Agent失败: ${error.message || '未知错误'}`);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 批量停止Agent
   */
  const handleBatchStop = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择要停止的Agent');
      return;
    }

    const selectedAgents = agents.filter(a => selectedRowKeys.includes(a.id));
    const validAgents = selectedAgents.filter(a => validateStatusTransition(a.status, AgentStatus.STOPPED));
    
    if (validAgents.length === 0) {
      message.warning('所选Agent均无法停止');
      return;
    }

    setLoading(true);
    try {
      // TODO: 实际API调用
      // await apiService.batchStopAgents(validAgents.map(a => a.id));
      
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      // 更新Agent状态
      validAgents.forEach(agent => {
        updateAgentStatus(agent.id, AgentStatus.STOPPED);
      });
      
      setSelectedRowKeys([]);
      message.success(`成功停止 ${validAgents.length} 个Agent`);
    } catch (error: any) {
      console.error('批量停止Agent失败:', error);
      message.error(`批量停止Agent失败: ${error.message || '未知错误'}`);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 克隆Agent
   * @param agent Agent对象
   */
  const handleCloneAgent = async (agent: Agent) => {
    setLoading(true);
    try {
      // TODO: 实际API调用
      // const clonedAgent = await apiService.cloneAgent(agent.id);
      
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      // 创建克隆的Agent
      const clonedAgent: Agent = {
        ...agent,
        id: `${agent.id}_clone_${Date.now()}`,
        name: `${agent.name} (副本)`,
        status: AgentStatus.IDLE,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastRunAt: undefined,
        metrics: {
          totalRuns: 0,
          successRate: 0,
          avgExecutionTime: 0
        }
      };
      
      setAgents(prevAgents => [...prevAgents, clonedAgent]);
      message.success(`Agent "${agent.name}" 克隆成功`);
    } catch (error: any) {
      console.error('克隆Agent失败:', error);
      message.error(`克隆Agent失败: ${error.message || '未知错误'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEditAgent = (agent: Agent) => {
    // 将Agent配置数据存储到localStorage，供Agent设计器使用
    localStorage.setItem('editingAgent', JSON.stringify(agent));
    // 跳转到Agent设计器页面
    navigate('/agent-designer?mode=edit&id=' + agent.id);
  };

  const handleSaveAgent = async () => {
    try {
      const values = await form.validateFields();
      if (editingAgent) {
        // await apiService.updateAgent(editingAgent.id, values);
        message.success('Agent更新成功');
      } else {
        // await apiService.createAgent(values);
        message.success('Agent创建成功');
      }
      setModalVisible(false);
      setEditingAgent(null);
      form.resetFields();
      loadAgents();
    } catch (error) {
      message.error('保存Agent失败');
    }
  };

  const columns = [
    {
      title: 'Agent信息',
      key: 'info',
      width: 300,
      render: (record: Agent) => (
        <div className="agent-info">
          <div className="agent-header">
            <Avatar 
              size={40} 
              icon={<RobotOutlined />} 
              style={{ backgroundColor: getTypeColor(record.type) }}
            />
            <div className="agent-details">
              <div className="agent-name">{record.name}</div>
              <div className="agent-author">作者: {record.author}</div>
            </div>
          </div>
          <div className="agent-description">{record.description}</div>
          <div className="agent-tags">
            {record.tags.map(tag => (
              <Tag key={tag}>{tag}</Tag>
            ))}
          </div>
        </div>
      )
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: AgentType) => (
        <Tag color={getTypeColor(type)}>{getTypeText(type)}</Tag>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: AgentStatus) => (
        <Badge 
          status={getStatusColor(status) as any} 
          text={getStatusText(status)}
        />
      )
    },
    {
      title: '版本',
      dataIndex: 'version',
      key: 'version',
      width: 80
    },
    {
      title: '运行指标',
      key: 'metrics',
      width: 200,
      render: (record: Agent) => (
        <div className="agent-metrics">
          <div className="metric-item">
            <Text type="secondary">运行次数: </Text>
            <Text strong>{record.metrics?.totalRuns || 0}</Text>
          </div>
          <div className="metric-item">
            <Text type="secondary">成功率: </Text>
            <Text strong>{record.metrics?.successRate || 0}%</Text>
          </div>
          <div className="metric-item">
            <Text type="secondary">平均耗时: </Text>
            <Text strong>{record.metrics?.avgExecutionTime || 0}s</Text>
          </div>
        </div>
      )
    },
    {
      title: '最后运行',
      dataIndex: 'lastRunAt',
      key: 'lastRunAt',
      width: 150,
      render: (lastRunAt: string) => (
        <div>
          <ClockCircleOutlined style={{ marginRight: 4 }} />
          {lastRunAt ? new Date(lastRunAt).toLocaleString() : '从未运行'}
        </div>
      )
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      render: (record: Agent) => (
        <Space size="small">
          {record.status === AgentStatus.IDLE && (
            <Tooltip title="启动">
              <Button 
                type="text" 
                icon={<PlayCircleOutlined />} 
                onClick={() => handleStartAgent(record)}
                style={{ color: '#52c41a' }}
              />
            </Tooltip>
          )}
          {record.status === AgentStatus.RUNNING && (
            <Tooltip title="暂停">
              <Button 
                type="text" 
                icon={<PauseCircleOutlined />} 
                onClick={() => handlePauseAgent(record)}
                style={{ color: '#faad14' }}
              />
            </Tooltip>
          )}
          {(record.status === AgentStatus.RUNNING || record.status === AgentStatus.PAUSED) && (
            <Tooltip title="停止">
              <Button 
                type="text" 
                icon={<StopOutlined />} 
                onClick={() => handleStopAgent(record)}
                style={{ color: '#ff4d4f' }}
              />
            </Tooltip>
          )}
          <Tooltip title="查看详情">
            <Button 
              type="text" 
              icon={<EyeOutlined />} 
              onClick={() => message.info('查看详情功能开发中')}
            />
          </Tooltip>
          <Tooltip title="编辑">
            <Button 
              type="text" 
              icon={<EditOutlined />} 
              onClick={() => handleEditAgent(record)}
            />
          </Tooltip>
          <Tooltip title="克隆">
            <Button 
              type="text" 
              icon={<CopyOutlined />} 
              onClick={() => handleCloneAgent(record)}
            />
          </Tooltip>
          <Popconfirm
            title={`确定要删除Agent "${record.name}" 吗？`}
            description="删除后将无法恢复，请谨慎操作。"
            onConfirm={() => handleDeleteAgent(record)}
            okText="确定删除"
            cancelText="取消"
            okType="danger"
          >
            <Tooltip title="删除">
              <Button 
                type="text" 
                icon={<DeleteOutlined />} 
                danger
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      )
    }
  ];

  // 计算统计数据
  const stats = {
    total: agents.length,
    running: agents.filter(a => a.status === AgentStatus.RUNNING).length,
    idle: agents.filter(a => a.status === AgentStatus.IDLE).length,
    error: agents.filter(a => a.status === AgentStatus.ERROR).length
  };

  return (
    <div className="agent-manager">
      <div className="agent-manager-header">
        <Title level={2}>Agent管理</Title>
        <Space>
          {selectedRowKeys.length > 0 && (
            <>
              <Button 
                type="primary"
                icon={<PlayCircleOutlined />}
                onClick={handleBatchStart}
                disabled={loading}
              >
                批量启动 ({selectedRowKeys.length})
              </Button>
              <Button 
                icon={<StopOutlined />}
                onClick={handleBatchStop}
                disabled={loading}
              >
                批量停止
              </Button>
              <Button 
                danger
                icon={<DeleteOutlined />}
                onClick={() => setBatchDeleteVisible(true)}
                disabled={loading}
              >
                批量删除
              </Button>
            </>
          )}
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingAgent(null);
              form.resetFields();
              setModalVisible(true);
            }}
          >
            创建Agent
          </Button>
        </Space>
      </div>

      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="总Agent数"
              value={stats.total}
              prefix={<RobotOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="运行中"
              value={stats.running}
              prefix={<SyncOutlined spin />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="空闲"
              value={stats.idle}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="错误"
              value={stats.error}
              prefix={<ExclamationCircleOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Agent列表 */}
      <Card>
        <Table
          columns={columns}
          dataSource={agents}
          rowKey="id"
          loading={loading}
          rowSelection={{
            selectedRowKeys,
            onChange: (keys) => setSelectedRowKeys(keys as string[]),
            getCheckboxProps: (record: Agent) => ({
              disabled: false,
              name: record.name,
            }),
          }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 个Agent`
          }}
        />
      </Card>

      {/* 编辑/创建Modal */}
      <Modal
        title={editingAgent ? '编辑Agent' : '创建Agent'}
        open={modalVisible}
        onOk={handleSaveAgent}
        onCancel={() => {
          setModalVisible(false);
          setEditingAgent(null);
          form.resetFields();
        }}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            type: AgentType.EXECUTION,
            status: AgentStatus.IDLE
          }}
        >
          <Form.Item
            name="name"
            label="Agent名称"
            rules={[{ required: true, message: '请输入Agent名称' }]}
          >
            <Input placeholder="请输入Agent名称" />
          </Form.Item>
          
          <Form.Item
            name="description"
            label="描述"
            rules={[{ required: true, message: '请输入Agent描述' }]}
          >
            <Input.TextArea rows={3} placeholder="请输入Agent描述" />
          </Form.Item>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="type"
                label="Agent类型"
                rules={[{ required: true, message: '请选择Agent类型' }]}
              >
                <Select placeholder="请选择Agent类型">
                  <Option value={AgentType.PLANNING}>规划型</Option>
                  <Option value={AgentType.EXECUTION}>执行型</Option>
                  <Option value={AgentType.AUDIT}>审计型</Option>
                  <Option value={AgentType.MEMORY}>记忆型</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="version"
                label="版本"
                rules={[{ required: true, message: '请输入版本号' }]}
              >
                <Input placeholder="如: 1.0.0" />
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item
            name="author"
            label="作者"
            rules={[{ required: true, message: '请输入作者名称' }]}
          >
            <Input placeholder="请输入作者名称" />
          </Form.Item>
          
          <Form.Item
            name="tags"
            label="标签"
          >
            <Select
              mode="tags"
              placeholder="请输入标签，按回车添加"
              style={{ width: '100%' }}
            >
              <Option value="自然语言处理">自然语言处理</Option>
              <Option value="数据分析">数据分析</Option>
              <Option value="自动化">自动化</Option>
              <Option value="客服">客服</Option>
              <Option value="代码审查">代码审查</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* 批量删除确认对话框 */}
      <Modal
        title="批量删除确认"
        open={batchDeleteVisible}
        onOk={handleBatchDelete}
        onCancel={() => setBatchDeleteVisible(false)}
        okText="确定删除"
        cancelText="取消"
        okType="danger"
        confirmLoading={loading}
      >
        <div style={{ marginBottom: 16 }}>
          <ExclamationCircleOutlined style={{ color: '#faad14', marginRight: 8 }} />
          确定要删除以下 {selectedRowKeys.length} 个Agent吗？删除后将无法恢复。
        </div>
        <div style={{ maxHeight: 200, overflowY: 'auto', border: '1px solid #d9d9d9', borderRadius: 4, padding: 8 }}>
          {agents
            .filter(agent => selectedRowKeys.includes(agent.id))
            .map(agent => (
              <div key={agent.id} style={{ padding: '4px 0', borderBottom: '1px solid #f0f0f0' }}>
                <Checkbox checked disabled style={{ marginRight: 8 }} />
                <Avatar 
                  size="small" 
                  icon={<RobotOutlined />} 
                  style={{ marginRight: 8, backgroundColor: getTypeColor(agent.type) }}
                />
                <span>{agent.name}</span>
                <Tag style={{ marginLeft: 8, fontSize: '12px' }}>{getTypeText(agent.type)}</Tag>
              </div>
            ))
          }
        </div>
      </Modal>
    </div>
  );
};

export default AgentManager;