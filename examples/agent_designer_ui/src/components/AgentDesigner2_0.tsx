/**
 * EFIAgent 2.0 智能Agent设计器
 * 基于能力系统模型的下一代Agent可视化设计工具
 * 支持认知、推理、决策、学习四大核心能力维度的系统化建模
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Button, Tooltip, Tabs, Switch, Space, Modal, Form, Input, Select, 
  message, Card, Divider, Progress, Badge, Tag, Drawer, Tree, 
  Collapse, Slider, InputNumber, Radio, Checkbox, Upload
} from 'antd';
import {
  DeleteOutlined, SaveOutlined, MoonOutlined, SunOutlined, 
  ArrowLeftOutlined, PlusOutlined, SettingOutlined, 
  EyeOutlined, PlayCircleOutlined, StopOutlined,
  ThunderboltOutlined, BulbOutlined, 
  BookOutlined, ApiOutlined, DatabaseOutlined,
  CloudOutlined, SecurityScanOutlined, MonitorOutlined,
  CheckCircleOutlined, ExperimentOutlined, RobotOutlined
} from '@ant-design/icons';
import ReactFlow, {
  Controls, Background, MiniMap, addEdge, useNodesState, 
  useEdgesState, NodeTypes, EdgeTypes, OnSelectionChangeParams,
  Node, Edge, Connection, ReactFlowProvider, ReactFlowInstance,
  MarkerType, Position, Panel as ReactFlowPanel
} from 'reactflow';
import 'reactflow/dist/style.css';
import {
  CoreCapabilityType, CognitiveCapabilityType, ReasoningCapabilityType,
  DecisionCapabilityType, LearningCapabilityType, CapabilitySourceType,
  CapabilityMaturityLevel, CapabilityOrchestrationMode, AgentStatus,
  CoreCapabilityModule, Agent2_0, CapabilityOrchestrator,
  KnowledgeGraphConfig, LearningConfig, CollaborationConfig,
  DeploymentConfig, AgentMetadata, CapabilitySource, CapabilityCategory
} from './CapabilitySystemTypes';
import {
  generateMockCapabilities,
  generateMockAgents,
  generateMockWorkflows
} from '../data/mockData';
import AIAssistant from './AIAssistant';
import RealTimeValidator from './RealTimeValidator';
import CoreCapabilityModules from './CoreCapabilityModules';
import CapabilityConfigPanel from './CapabilityConfigPanel';
import IntelligentCapabilityConfig from './IntelligentCapabilityConfig';
import EnhancedCapabilityLibrary from './EnhancedCapabilityLibrary';
import VisualCapabilityOrchestrator from './VisualCapabilityOrchestrator';
import './AgentDesigner.css';
import './AgentDesigner2_0.css';
import './AIAssistant.css';
import './RealTimeValidator.css';
import './CoreCapabilityModules.css';
import './CapabilityConfigPanel.css';
import './IntelligentCapabilityConfig.css';
import './EnhancedCapabilityLibrary.css';
import './VisualCapabilityOrchestrator.css';

const { TabPane } = Tabs;
const { Panel: CollapsePanel } = Collapse;
const { Option } = Select;
const { TextArea } = Input;

// 能力图标映射
const CAPABILITY_ICONS = {
  [CoreCapabilityType.COGNITIVE]: <BulbOutlined />,
  [CoreCapabilityType.REASONING]: <ThunderboltOutlined />,
  [CoreCapabilityType.DECISION]: <BulbOutlined />,
  [CoreCapabilityType.LEARNING]: <BookOutlined />
};

// 能力颜色映射
const CAPABILITY_COLORS: { [key in CoreCapabilityType]: string } = {
  [CoreCapabilityType.COGNITIVE]: '#1890ff',
  [CoreCapabilityType.REASONING]: '#52c41a',
  [CoreCapabilityType.DECISION]: '#faad14',
  [CoreCapabilityType.LEARNING]: '#722ed1'
};

// 成熟度等级颜色
const MATURITY_COLORS = {
  [CapabilityMaturityLevel.INITIAL]: '#f5222d',
  [CapabilityMaturityLevel.MANAGED]: '#fa8c16',
  [CapabilityMaturityLevel.DEFINED]: '#fadb14',
  [CapabilityMaturityLevel.QUANTIFIED]: '#52c41a',
  [CapabilityMaturityLevel.OPTIMIZED]: '#1890ff'
};

interface AgentDesigner2_0Props {
  mode?: 'create' | 'edit' | 'view';
  agentId?: string;
  editingAgent?: Agent2_0 | null;
  onBack?: () => void;
}

const AgentDesigner2_0: React.FC<AgentDesigner2_0Props> = ({ mode = 'create', agentId, editingAgent, onBack }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [form] = Form.useForm();
  
  // 核心状态
  const [agent, setAgent] = useState<Agent2_0 | null>(null);
  const [capabilities, setCapabilities] = useState<CoreCapabilityModule[]>([]);
  const [selectedCapability, setSelectedCapability] = useState<CoreCapabilityModule | null>(null);
  const [knowledgeGraph, setKnowledgeGraph] = useState<KnowledgeGraphConfig | null>(null);
  const [learning, setLearning] = useState<LearningConfig | null>(null);
  const [collaboration, setCollaboration] = useState<CollaborationConfig | null>(null);
  const [deployment, setDeployment] = useState<DeploymentConfig | null>(null);
  const [metadata, setMetadata] = useState<AgentMetadata | null>(null);
  
  // UI状态
  const [darkMode, setDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [loading, setLoading] = useState(false);
  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [capabilityDrawerVisible, setCapabilityDrawerVisible] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  
  // 新增功能状态
  const [aiAssistantVisible, setAiAssistantVisible] = useState(false);
  const [validatorVisible, setValidatorVisible] = useState(false);
  const [coreModulesVisible, setCoreModulesVisible] = useState(false);
  
  // 智能配置组件状态
  const [intelligentConfigVisible, setIntelligentConfigVisible] = useState(false);
  const [enhancedLibraryVisible, setEnhancedLibraryVisible] = useState(false);
  const [visualOrchestratorVisible, setVisualOrchestratorVisible] = useState(false);
  
  // ReactFlow状态
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);
  
  // 能力库数据
  const [availableCapabilities, setAvailableCapabilities] = useState<CoreCapabilityModule[]>([]);

  // 自定义节点组件
  const CapabilityNodeComponent: React.FC<{ data: any }> = ({ data }) => {
    const getStatusColor = (status: string) => {
      const colorMap = {
        idle: '#8c8c8c',
        running: '#1890ff',
        success: '#52c41a',
        error: '#ff4d4f',
        warning: '#fa8c16'
      };
      return colorMap[status as keyof typeof colorMap] || '#8c8c8c';
    };
    
    const getCapabilityIcon = (type: CoreCapabilityType) => {
      const iconMap = {
        [CoreCapabilityType.COGNITIVE]: <BulbOutlined />,
        [CoreCapabilityType.REASONING]: <ThunderboltOutlined />,
        [CoreCapabilityType.DECISION]: <BulbOutlined />,
        [CoreCapabilityType.LEARNING]: <BookOutlined />
      };
      return iconMap[type] || <SettingOutlined />;
    };
    
    return (
      <div className={`capability-node ${data.status || 'idle'}`}>
        <div className="node-header">
          <div className="node-icon" style={{ color: getStatusColor(data.status || 'idle') }}>
            {getCapabilityIcon(data.capability?.type)}
          </div>
          <div className="node-title">
            <span style={{ fontWeight: 'bold' }}>{data.capability?.name || '未知能力'}</span>
            <span style={{ fontSize: '11px', color: '#999' }}>v{data.capability?.version || '1.0.0'}</span>
          </div>
          <div className="node-status">
            <Badge 
              status={data.status === 'success' ? 'success' : 
                     data.status === 'error' ? 'error' : 
                     data.status === 'running' ? 'processing' : 'default'}
            />
          </div>
        </div>
        
        <div className="node-content">
          <div className="node-metrics">
            <div className="metric-item">
              <CheckCircleOutlined style={{ fontSize: 10 }} />
              <span>{((data.metrics?.successRate || 1.0) * 100).toFixed(1)}%</span>
            </div>
          </div>
          
          <div className="node-tags">
            <Tag  color={data.capability?.type === CoreCapabilityType.COGNITIVE ? 'blue' : 
                                     data.capability?.type === CoreCapabilityType.REASONING ? 'green' :
                                     data.capability?.type === CoreCapabilityType.DECISION ? 'orange' : 'purple'}>
              {data.capability?.type || 'unknown'}
            </Tag>
          </div>
        </div>
        
        {/* 连接点 */}
        <div className="node-handles">
          <div className="handle handle-input" />
          <div className="handle handle-output" />
        </div>
      </div>
    );
  };

  // 自定义边组件
  const CapabilityEdgeComponent: React.FC<any> = ({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    data
  }) => {
    const edgePath = `M${sourceX},${sourceY} C${sourceX + 50},${sourceY} ${targetX - 50},${targetY} ${targetX},${targetY}`;
    
    return (
      <>
        <path
          id={id}
          style={{
            stroke: data?.errorRate > 0.1 ? '#ff4d4f' : 
                   data?.latency > 1000 ? '#fa8c16' : '#52c41a',
            strokeWidth: Math.max(1, (data?.weight || 1) * 2),
            fill: 'none'
          }}
          className="react-flow__edge-path"
          d={edgePath}
          markerEnd={MarkerType.ArrowClosed}
        />
        {data && (
          <text>
            <textPath href={`#${id}`} style={{ fontSize: 10, fill: '#666' }} startOffset="50%" textAnchor="middle">
              {data.latency || 100}ms
            </textPath>
          </text>
        )}
      </>
    );
  };

  // 节点和边类型映射
  const nodeTypes: NodeTypes = {
    capability: CapabilityNodeComponent
  };

  const edgeTypes: EdgeTypes = {
    capability: CapabilityEdgeComponent
  };
  
  /**
   * 处理连接创建
   */
  const onConnect = useCallback((params: Connection) => {
    const newEdge = {
      ...params,
      id: `edge-${params.source}-${params.target}`,
      type: 'capability',
      data: {
        weight: 1.0,
        latency: 100,
        throughput: 1000,
        errorRate: 0.01
      }
    };
    
    setEdges((eds) => addEdge(newEdge, eds));
  }, [setEdges]);

  /**
   * 处理节点选择
   */
  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
    setSelectedEdge(null);
    
    // 更新节点选中状态
    setNodes(nds => nds.map(n => ({
      ...n,
      data: {
        ...n.data,
        isSelected: n.id === node.id
      }
    })));
    
    // 如果点击的是能力节点，设置选中的能力
    if (node.data.capability) {
      setSelectedCapability(node.data.capability);
    }
    
    console.log('Selected node:', node);
  }, [setNodes]);

  /**
   * 处理边选择
   */
  const onEdgeClick = useCallback((event: React.MouseEvent, edge: Edge) => {
    setSelectedEdge(edge);
    setSelectedNode(null);
    
    // 更新边选中状态
    setEdges(eds => eds.map(e => ({
      ...e,
      data: {
        ...e.data,
        isSelected: e.id === edge.id
      }
    })));
    
    console.log('Selected edge:', edge);
  }, [setEdges]);

  /**
   * 初始化组件
   */
  useEffect(() => {
    initializeDesigner();
    loadAvailableCapabilities();
  }, [mode, agentId]);
  
  /**
   * 初始化设计器
   */
  const initializeDesigner = async () => {
    setLoading(true);
    try {
      if (mode === 'edit') {
        // 优先使用传入的editingAgent数据
        let existingAgent = editingAgent;
        
        // 如果没有传入editingAgent，则从localStorage或API加载
        if (!existingAgent && agentId) {
          existingAgent = await loadAgent(agentId);
        }
        
        if (existingAgent) {
          setAgent(existingAgent);
          setCapabilities(existingAgent.capabilities || []);
          setKnowledgeGraph(existingAgent.knowledgeGraph || null);
          setLearning(existingAgent.learningConfig || null);
          setCollaboration(existingAgent.collaborationConfig || null);
          setDeployment(existingAgent.deploymentConfig || null);
          setMetadata(existingAgent.metadata || null);
          
          // 设置表单基础信息
          form.setFieldsValue({
            name: existingAgent.name,
            description: existingAgent.description,
            version: existingAgent.version,
            category: existingAgent.metadata?.category || '',
            difficulty: existingAgent.metadata?.difficulty || 'beginner',
            tags: existingAgent.metadata?.tags || []
          });
          
          // 生成能力流程图
          if (existingAgent.capabilities && existingAgent.capabilities.length > 0) {
            console.log('Found capabilities:', existingAgent.capabilities.length);
          }
          
          console.log('Agent loaded successfully:', {
            id: existingAgent.id,
            name: existingAgent.name,
            capabilitiesCount: existingAgent.capabilities?.length || 0,
            hasKnowledgeGraph: !!existingAgent.knowledgeGraph,
            hasLearning: !!existingAgent.learningConfig,
            hasCollaboration: !!existingAgent.collaborationConfig,
            hasDeployment: !!existingAgent.deploymentConfig,
            hasMetadata: !!existingAgent.metadata
          });
        } else {
          message.error(`未找到ID为 ${agentId} 的Agent配置`);
          console.error('Agent not found:', agentId);
        }
      } else {
        // 创建新Agent的默认配置
        const newAgent = createDefaultAgent();
        setAgent(newAgent);
        setKnowledgeGraph(newAgent.knowledgeGraph || null);
        setLearning(newAgent.learningConfig || null);
        setCollaboration(newAgent.collaborationConfig || null);
        setDeployment(newAgent.deploymentConfig || null);
        setMetadata(newAgent.metadata || null);
      }
    } catch (error) {
      message.error('初始化设计器失败');
      console.error('Designer initialization error:', error);
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * 加载Agent配置
   */
  const loadAgent = async (id: string): Promise<Agent2_0 | null> => {
    // TODO: 实现从API加载Agent配置
    // 临时从localStorage加载
    const agents = JSON.parse(localStorage.getItem('agents_2_0') || '[]');
    return agents.find((a: Agent2_0) => a.id === id) || null;
  };
  
  /**
   * 创建默认Agent配置
   */
  const createDefaultAgent = (): Agent2_0 => {
    const now = new Date();
    return {
      id: `agent_2_0_${Date.now()}`,
      name: '',
      description: '',
      version: '1.0.0',
      type: 'agent',
      status: AgentStatus.IDLE,
      capabilities: [],
      orchestrationConfig: {
        mode: CapabilityOrchestrationMode.SEQUENTIAL,
        priority: 50,
        executionTimeout: 30,
        retryCount: 0,
        errorHandling: 'stop',
        rules: [],
        capabilityMapping: [],
        executionStrategy: {
          loadBalancing: 'round_robin',
          failover: true,
          circuitBreaker: {
            enabled: true,
            failureThreshold: 5,
            recoveryTimeout: 30000,
            halfOpenMaxCalls: 3
          },
          rateLimit: {
            enabled: true,
            requestsPerSecond: 100,
            burstSize: 200,
            strategy: 'token_bucket'
          }
        },
        optimization: {
          enabled: true,
          autoScaling: {
            enabled: true,
            minInstances: 1,
            maxInstances: 10,
            targetCpuUtilization: 70,
            targetMemoryUtilization: 80,
            scaleUpCooldown: 300,
            scaleDownCooldown: 600
          },
          caching: {
            enabled: true,
            strategy: 'lru',
            maxSize: 1000,
            ttl: 3600
          },
          prefetching: {
            enabled: false,
            strategy: 'predictive',
            lookaheadTime: 60
          }
        }
      },
      knowledgeGraph: {
        enabled: true,
        ontologyLayers: [],
        factLayers: [],
        ruleLayers: [],
        temporalLayers: [],
        updateStrategy: 'real_time'
      },
      learningConfig: {
        enabled: true,
        strategies: [],
        dataCollection: {
          enabled: true,
          sources: [],
          preprocessing: {
            normalization: true,
            deduplication: true,
            validation: true,
            transformation: []
          },
          privacy: {
            anonymization: true,
            encryption: true,
            accessControl: {
              authentication: true,
              authorization: [],
              encryption: true,
              auditLog: true
            },
            retentionPolicy: {
              enabled: true,
              retentionPeriod: 365,
              archiveStrategy: 'anonymize'
            }
          }
        },
        modelManagement: {
          versioning: true,
          autoUpdate: false,
          rollbackPolicy: {
            enabled: true,
            triggerConditions: ['performance_degradation', 'error_rate_increase'],
            maxRollbackVersions: 5
          },
          performance_monitoring: true
        },
        evaluation: {
          enabled: true,
          metrics: ['accuracy', 'precision', 'recall', 'f1_score'],
          frequency: 24,
          benchmarks: []
        }
      },
      collaborationConfig: {
        enabled: true,
        modes: [
          {
            type: 'hierarchical',
            config: {},
            enabled: true
          }
        ],
        protocols: [
          {
            type: 'http',
            config: {
              port: 8080,
              timeout: 30000
            },
            security: {
              authentication: {
                method: 'jwt',
                config: {}
              },
              authorization: {
                model: 'rbac',
                policies: []
              },
              encryption: {
                inTransit: true,
                atRest: true,
                algorithm: 'AES-256',
                keyManagement: {
                  provider: 'local',
                  rotation: true,
                  rotationPeriod: 90
                }
              },
              audit: {
                enabled: true,
                events: ['authentication', 'authorization', 'data_access'],
                retention: 365,
                storage: 'database'
              }
            }
          }
        ],
        governance: {
          policies: [],
          compliance: {
            frameworks: ['GDPR'],
            requirements: [],
            monitoring: true
          },
          riskManagement: {
            enabled: true,
            riskAssessment: {
              frequency: 30,
              criteria: [],
              scoring: {
                method: 'quantitative',
                scale: 'numeric_1_10',
                thresholds: []
              }
            },
            mitigation: {
              strategies: [],
              automation: true
            },
            monitoring: {
              enabled: true,
              indicators: [],
              alerting: {
                enabled: true,
                thresholds: [],
                channels: []
              }
            }
          }
        }
      },
      deploymentConfig: {
        environment: 'development',
        infrastructure: {
          platform: 'kubernetes',
          resources: {
            cpu: { request: 0.5, limit: 2, unit: 'cores' },
            memory: { request: 512, limit: 2048, unit: 'MB' },
            storage: { request: 1, limit: 10, unit: 'GB' }
          },
          networking: {
            ingress: {
              enabled: true,
              host: 'agent.example.com',
              tls: true,
              annotations: {}
            },
            service: {
              type: 'ClusterIP',
              ports: [
                {
                  name: 'http',
                  port: 80,
                  targetPort: 8080,
                  protocol: 'TCP'
                }
              ]
            },
            security: {
              networkPolicies: true,
              firewallRules: []
            }
          },
          storage: {
            type: 'persistent',
            size: '10Gi',
            storageClass: 'standard',
            backup: true
          }
        },
        scaling: {
          horizontal: {
            enabled: true,
            minReplicas: 1,
            maxReplicas: 10,
            targetCpuUtilization: 70,
            targetMemoryUtilization: 80
          },
          vertical: {
            enabled: false,
            updateMode: 'Auto',
            resourcePolicy: []
          }
        },
        monitoring: {
          enabled: true,
          metricsCollection: true,
          loggingLevel: 'info',
          alerting: {
            enabled: true,
            thresholds: [],
            channels: []
          },
          healthCheck: {
            enabled: true,
            interval: 30,
            timeout: 5,
            failureThreshold: 3,
            successThreshold: 1
          }
        },
        backup: {
          enabled: true,
          schedule: '0 2 * * *',
          retention: 30,
          storage: {
            type: 'local',
            config: {},
            encryption: true
          }
        }
      },
      metadata: {
        author: 'current_user',
        organization: '',
        license: 'MIT',
        tags: [],
        category: 'general',
        difficulty: 'beginner',
        rating: 0,
        downloads: 0,
        featured: false,
        createdAt: now,
        updatedAt: now,
        changelog: [
          {
            version: '1.0.0',
            date: now,
            changes: ['初始版本'],
            breaking: false
          }
        ]
      }
    };
  };
  
  /**
   * 加载可用能力库
   */
  const loadAvailableCapabilities = async () => {
    try {
      const mockCapabilities = generateMockCapabilities();
      setAvailableCapabilities(mockCapabilities);
    } catch (error) {
      console.error('加载能力库失败:', error);
    }
  };
  
  /**
   * 从能力生成流程图
   */
  const generateFlowFromCapabilities = (caps: CoreCapabilityModule[]) => {
    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];
    
    // 按能力类型分组
    const groupedCaps = caps.reduce((acc, cap) => {
      if (!acc[cap.type]) acc[cap.type] = [];
      acc[cap.type].push(cap);
      return acc;
    }, {} as Record<CoreCapabilityType, CoreCapabilityModule[]>);
    
    let yOffset = 0;
    const xSpacing = 300;
    const ySpacing = 150;
    
    // 为每个能力类型创建节点
    Object.entries(groupedCaps).forEach(([type, typeCaps], typeIndex) => {
      typeCaps.forEach((cap, capIndex) => {
        const getCapabilityTypeClass = (type: CoreCapabilityType) => {
          const typeMap = {
            [CoreCapabilityType.COGNITIVE]: 'capability-type-cognitive',
            [CoreCapabilityType.REASONING]: 'capability-type-reasoning',
            [CoreCapabilityType.DECISION]: 'capability-type-decision',
            [CoreCapabilityType.LEARNING]: 'capability-type-learning'
          };
          return typeMap[type] || 'capability-type-cognitive';
        };

        const node: Node = {
          id: cap.id,
          type: 'capability',
          position: { x: typeIndex * xSpacing, y: yOffset + capIndex * ySpacing },
          data: {
            id: cap.id,
            name: cap?.name || '未知能力',
            description: cap.description,
            type: cap.type,
            version: cap.version,
            maturityLevel: cap.maturityLevel,
            capability: cap,
            isSelected: false,
            isConnecting: false
          },
          className: 'react-flow__node-capability',
          style: {
            background: 'transparent',
            border: 'none',
            padding: 0
          }
        };
        newNodes.push(node);
      });
      yOffset += typeCaps.length * ySpacing + 50;
    });
    
    // 根据依赖关系创建连接
    caps.forEach(cap => {
      cap.dependencies.forEach(dep => {
        const sourceNode = newNodes.find(n => n.id === dep.capabilityId);
        const targetNode = newNodes.find(n => n.id === cap.id);
        if (sourceNode && targetNode) {
          const edge: Edge = {
            id: `${dep.capabilityId}-${cap.id}`,
            source: dep.capabilityId,
            target: cap.id,
            type: 'capability',
            data: {
              dependencyType: dep.type,
              isSelected: false
            },
            style: {
              stroke: dep.type === 'required' ? '#ff4d4f' : '#52c41a',
              strokeWidth: 2
            },
            label: dep.type,
            labelStyle: {
              fontSize: 12,
              fontWeight: 'bold'
            },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              width: 20,
              height: 20,
              color: dep.type === 'required' ? '#ff4d4f' : '#52c41a'
            }
          };
          newEdges.push(edge);
        }
      });
    });
    
    setNodes(newNodes);
    setEdges(newEdges);
  };
  
  /**
   * 添加能力到Agent
   */
  const handleAddCapability = (capability: CoreCapabilityModule) => {
    const newCapability = {
      ...capability,
      id: `${capability.id}_${Date.now()}`
    };
    
    setCapabilities(prev => [...prev, newCapability]);
    generateFlowFromCapabilities([...capabilities, newCapability]);
    setCapabilityDrawerVisible(false);
    message.success(`已添加能力: ${capability?.name || '未知能力'}`);
  };
  
  /**
   * 移除能力
   */
  const handleRemoveCapability = (capabilityId: string) => {
    const updatedCapabilities = capabilities.filter(cap => cap.id !== capabilityId);
    setCapabilities(updatedCapabilities);
    generateFlowFromCapabilities(updatedCapabilities);
    
    // 如果当前选中的能力被删除，清除选择
    if (selectedCapability?.id === capabilityId) {
      setSelectedCapability(null);
    }
    
    message.success('已移除能力');
  };
  
  /**
   * 更新编排配置
   */
  const updateOrchestrationConfig = useCallback((updates: Partial<Agent2_0['orchestrationConfig']>) => {
    if (!agent) return;
    
    const updatedAgent = {
      ...agent,
      orchestrationConfig: {
        ...agent.orchestrationConfig,
        ...updates
      }
    };
    setAgent(updatedAgent);
  }, [agent]);

  /**
   * 保存Agent配置
   */
  const handleSaveAgent = async () => {
    try {
      const values = await form.validateFields();
      
      if (!agent) {
        message.error('Agent配置不存在');
        return;
      }
      
      const updatedAgent: Agent2_0 = {
        ...agent,
        name: values.name,
        description: values.description,
        version: values.version || agent.version,
        capabilities,
        orchestrationConfig: agent.orchestrationConfig,
        metadata: {
          ...agent.metadata,
          updatedAt: new Date(),
          tags: values.tags || agent.metadata.tags,
          category: values.category || agent.metadata.category,
          difficulty: values.difficulty || agent.metadata.difficulty
        }
      };
      
      // TODO: 调用API保存
      // 临时保存到localStorage
      const existingAgents = JSON.parse(localStorage.getItem('agents_2_0') || '[]');
      const agentIndex = existingAgents.findIndex((a: Agent2_0) => a.id === updatedAgent.id);
      
      if (agentIndex >= 0) {
        existingAgents[agentIndex] = updatedAgent;
        message.success('Agent更新成功');
      } else {
        existingAgents.push(updatedAgent);
        message.success('Agent创建成功');
      }
      
      localStorage.setItem('agents_2_0', JSON.stringify(existingAgents));
      setSaveModalVisible(false);
      
      // 返回Agent管理页面
      navigate('/agent-manager');
      
    } catch (error) {
      message.error('保存失败，请检查配置');
      console.error('Save error:', error);
    }
  };
  
  /**
   * 验证Agent配置
   */
  const validateAgentConfig = (): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (!(agent?.name || '').trim()) {
      errors.push('Agent名称不能为空');
    }
    
    if (capabilities.length === 0) {
      errors.push('至少需要添加一个能力模块');
    }
    
    // 检查能力依赖
    capabilities.forEach(cap => {
      cap.dependencies.forEach(dep => {
        if (dep.type === 'required') {
          const depExists = capabilities.some(c => c.id === dep.capabilityId);
          if (!depExists) {
            errors.push(`能力"${cap?.name || '未知能力'}"缺少必需的依赖: ${dep.capabilityId}`);
          }
        }
      });
    });
    
    return {
      isValid: errors.length === 0,
      errors
    };
  };
  
  /**
   * 渲染基础配置面板
   */
  const renderBasicConfigPanel = () => {
    return (
      <div className="basic-config-panel">
        <Form 
          layout="vertical" 
          
          initialValues={{
            name: agent?.name || '',
            description: agent?.description || '',
            version: agent?.version || '1.0.0',
            status: agent?.status || AgentStatus.IDLE
          }}
          onValuesChange={(changedValues, allValues) => {
            if (agent) {
              setAgent({
                ...agent,
                ...allValues,
                metadata: {
                  ...agent.metadata,
                  updatedAt: new Date()
                }
              });
            }
          }}
        >
          <Form.Item 
            name="name" 
            label="Agent名称" 
            rules={[{ required: true, message: '请输入Agent名称' }]}
          >
            <Input placeholder="输入Agent名称" />
          </Form.Item>
          
          <Form.Item 
            name="description" 
            label="描述"
            rules={[{ required: true, message: '请输入描述' }]}
          >
            <TextArea rows={3} placeholder="描述Agent的功能和用途" />
          </Form.Item>
          
          <Form.Item name="version" label="版本">
            <Input placeholder="1.0.0" />
          </Form.Item>
          
          <Form.Item name="status" label="状态">
            <Select>
              <Option value={AgentStatus.IDLE}>空闲</Option>
              <Option value={AgentStatus.RUNNING}>运行中</Option>
              <Option value={AgentStatus.PAUSED}>暂停</Option>
              <Option value={AgentStatus.STOPPED}>已停止</Option>
              <Option value={AgentStatus.ERROR}>错误</Option>
            </Select>
          </Form.Item>
          
          <Divider orientation="left">元数据配置</Divider>
          
          <Form.Item name="category" label="分类">
            <Select placeholder="选择分类">
              <Option value="general">通用</Option>
              <Option value="business">业务</Option>
              <Option value="technical">技术</Option>
              <Option value="research">研究</Option>
            </Select>
          </Form.Item>
          
          <Form.Item name="difficulty" label="难度">
            <Radio.Group>
              <Radio value="beginner">初级</Radio>
              <Radio value="intermediate">中级</Radio>
              <Radio value="advanced">高级</Radio>
              <Radio value="expert">专家</Radio>
            </Radio.Group>
          </Form.Item>
          
          <Form.Item name="tags" label="标签">
            <Select mode="tags" placeholder="添加标签">
              <Option value="ai">AI</Option>
              <Option value="automation">自动化</Option>
              <Option value="analysis">分析</Option>
              <Option value="processing">处理</Option>
              <Option value="nlp">自然语言处理</Option>
              <Option value="vision">计算机视觉</Option>
              <Option value="recommendation">推荐系统</Option>
            </Select>
          </Form.Item>
          
          <Divider orientation="left">运行时配置</Divider>
          
          <Form.Item label="最大并发数">
            <InputNumber 
              min={1} 
              max={100} 
              defaultValue={10}
              style={{ width: '100%' }}
            />
          </Form.Item>
          
          <Form.Item label="超时时间(秒)">
            <InputNumber 
              min={1} 
              max={3600} 
              defaultValue={300}
              style={{ width: '100%' }}
            />
          </Form.Item>
          
          <Form.Item label="启用监控">
            <Switch defaultChecked />
          </Form.Item>
          
          <Form.Item label="启用日志">
            <Switch defaultChecked />
          </Form.Item>
        </Form>
      </div>
    );
  };
  
  /**
   * 渲染能力配置面板
   */
  const renderCapabilityPanel = () => {
    return (
      <div className="capability-panel">
        {/* 已选择能力列表 */}
        <Card title="已选择的能力模块"  style={{ marginBottom: 16 }}>
          {capabilities.length === 0 ? (
            <div className="empty-capabilities">
              <BulbOutlined style={{ fontSize: 24, color: '#d9d9d9' }} />
              <p style={{ color: '#999', margin: '8px 0 0 0' }}>暂无能力模块</p>
            </div>
          ) : (
            <div className="capability-list">
              {capabilities.map(capability => (
                <Card 
                  key={capability.id}
                  
                  className={`capability-item ${selectedCapability?.id === capability.id ? 'selected' : ''}`}
                  style={{ 
                    marginBottom: 8, 
                    cursor: 'pointer',
                    border: selectedCapability?.id === capability.id ? '2px solid #1890ff' : '1px solid #d9d9d9'
                  }}
                  onClick={() => setSelectedCapability(capability)}
                  title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ color: CAPABILITY_COLORS[capability.type as CoreCapabilityType] }}>
                        {CAPABILITY_ICONS[capability.type as CoreCapabilityType]}
                      </span>
                      <span>{capability?.name || '未知能力'}</span>
                      <Tag color={CAPABILITY_COLORS[capability.type as CoreCapabilityType]} >
                        {capability.type}
                      </Tag>
                    </div>
                  }
                >
                  <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>
                    {capability.description}
                  </p>
                </Card>
              ))}
            </div>
          )}
        </Card>
        
        {/* 能力配置面板 */}
        {!selectedCapability ? (
          <div className="empty-panel">
            <div className="empty-content">
              <BulbOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />
              <p>选择一个能力模块查看详细配置</p>
            </div>
          </div>
        ) : (
          <CapabilityConfigPanel 
            capability={selectedCapability}
            onConfigChange={(config) => {
              // 更新能力配置
              const updatedCapabilities = capabilities.map(cap => 
                cap.id === selectedCapability.id 
                  ? { ...cap, config: { ...cap.config, ...config } }
                  : cap
              );
              setCapabilities(updatedCapabilities);
              setSelectedCapability({ ...selectedCapability, config: { ...selectedCapability.config, ...config } });
            }}
            onRemove={() => handleRemoveCapability(selectedCapability.id)}
          />
        )}
      </div>
    );
  };
  
  /**
   * 渲染能力库抽屉
   */
  const renderCapabilityDrawer = () => {
    return (
      <Drawer
        title="能力库"
        placement="right"
        width={600}
        open={capabilityDrawerVisible}
        onClose={() => setCapabilityDrawerVisible(false)}
      >
        <div className="capability-library">
          <div className="library-header">
            <Input.Search 
              placeholder="搜索能力模块..."
              style={{ marginBottom: 16 }}
            />
            <div className="filter-tabs">
              <Tabs defaultActiveKey="all" >
                <TabPane tab="全部" key="all" />
                <TabPane tab="认知" key="cognitive" />
                <TabPane tab="推理" key="reasoning" />
                <TabPane tab="决策" key="decision" />
                <TabPane tab="学习" key="learning" />
              </Tabs>
            </div>
          </div>
          
          <div className="capability-list">
            {availableCapabilities.map(capability => (
              <Card 
                key={capability.id}
                
                className="capability-card"
                title={
                  <div className="card-title">
                    {CAPABILITY_ICONS[capability.type]}
                    <span>{capability?.name || '未知能力'}</span>
                    <Tag color={CAPABILITY_COLORS[capability.type]}>
                      {capability.type}
                    </Tag>
                  </div>
                }
                extra={
                  <Button 
                    type="primary" 
                    
                    icon={<PlusOutlined />}
                    onClick={() => handleAddCapability(capability)}
                  >
                    添加
                  </Button>
                }
              >
                <p className="capability-description">{capability.description}</p>
                <div className="capability-meta">
                  <Badge 
                    color={MATURITY_COLORS[capability.maturityLevel]} 
                    text={capability.maturityLevel}
                  />
                  <span className="version">v{capability.version}</span>
                  <span className="author">by {capability.author}</span>
                </div>
                <div className="capability-stats">
                  <span>成功率: {((capability.metrics?.successRate || 0) * 100).toFixed(1)}%</span>
                  <span>使用次数: {capability.metrics?.usageCount || 0}</span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </Drawer>
    );
  };
  
  /**
   * 渲染编排配置面板
   */
  const renderOrchestrationPanel = () => {
    if (!agent?.orchestrationConfig) return <div>编排配置未初始化</div>;

    return (
      <div className="orchestration-panel">
        <Card title="编排模式配置"  style={{ marginBottom: 16 }}>
          <Form.Item label="编排模式">
            <Select
              value={agent.orchestrationConfig.mode}
              onChange={(value) => updateOrchestrationConfig({ mode: value })}
              style={{ width: '100%' }}
            >
              <Option value={CapabilityOrchestrationMode.SEQUENTIAL}>顺序执行</Option>
              <Option value={CapabilityOrchestrationMode.PARALLEL}>并行执行</Option>
              <Option value={CapabilityOrchestrationMode.CONDITIONAL}>条件执行</Option>
              <Option value={CapabilityOrchestrationMode.ADAPTIVE}>自适应执行</Option>
            </Select>
          </Form.Item>
          
          <Form.Item label="优先级权重">
            <Slider
              value={agent.orchestrationConfig.priority}
              onChange={(value) => updateOrchestrationConfig({ priority: value })}
              min={0}
              max={100}
              marks={{ 0: '低', 50: '中', 100: '高' }}
            />
          </Form.Item>
        </Card>

        <Card title="能力映射规则"  style={{ marginBottom: 16 }}>
          <div style={{ marginBottom: 12 }}>
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={() => {
                const newMapping = {
                  id: `mapping_${Date.now()}`,
                  sourceCapability: '',
                  targetCapability: '',
                  mappingType: 'direct' as const,
                  conditions: [],
                  priority: 50
                };
                updateOrchestrationConfig({ 
                  capabilityMapping: [...(agent?.orchestrationConfig?.capabilityMapping || []), newMapping] 
                });
              }}
            >
              添加映射规则
            </Button>
          </div>
          
          {(agent?.orchestrationConfig?.capabilityMapping || []).map((mapping, index) => (
            <Card key={mapping.id}  style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Select
                  placeholder="源能力"
                  value={mapping.sourceCapability}
                  onChange={(value) => {
                    const updatedMappings = [...(agent?.orchestrationConfig?.capabilityMapping || [])];
                    updatedMappings[index] = { ...mapping, sourceCapability: value };
                    updateOrchestrationConfig({ capabilityMapping: updatedMappings });
                  }}
                  style={{ flex: 1 }}
                >
                  {capabilities.map(cap => (
                    <Option key={cap.id} value={cap.id}>{cap?.name || '未知能力'}</Option>
                  ))}
                </Select>
                
                <span>→</span>
                
                <Select
                  placeholder="目标能力"
                  value={mapping.targetCapability}
                  onChange={(value) => {
                    const updatedMappings = [...(agent?.orchestrationConfig?.capabilityMapping || [])];
                    updatedMappings[index] = { ...mapping, targetCapability: value };
                    updateOrchestrationConfig({ capabilityMapping: updatedMappings });
                  }}
                  style={{ flex: 1 }}
                >
                  {capabilities.map(cap => (
                    <Option key={cap.id} value={cap.id}>{cap?.name || '未知能力'}</Option>
                  ))}
                </Select>
                
                <Button 
                  type="text" 
                  danger 
                  icon={<DeleteOutlined />}
                  onClick={() => {
                    const updatedMappings = (agent?.orchestrationConfig?.capabilityMapping || []).filter((_, i) => i !== index);
                    updateOrchestrationConfig({ capabilityMapping: updatedMappings });
                  }}
                />
              </div>
            </Card>
          ))}
        </Card>

        <Card title="执行策略" >
          <Form.Item label="超时设置 (秒)">
            <InputNumber
              value={agent?.orchestrationConfig?.executionTimeout}
              onChange={(value) => updateOrchestrationConfig({ executionTimeout: value || 30 })}
              min={1}
              max={3600}
              style={{ width: '100%' }}
            />
          </Form.Item>
          
          <Form.Item label="重试次数">
            <InputNumber
              value={agent?.orchestrationConfig?.retryCount}
              onChange={(value) => updateOrchestrationConfig({ retryCount: value || 0 })}
              min={0}
              max={10}
              style={{ width: '100%' }}
            />
          </Form.Item>
          
          <Form.Item label="错误处理策略">
            <Radio.Group
              value={agent?.orchestrationConfig?.errorHandling}
              onChange={(e) => updateOrchestrationConfig({ errorHandling: e.target.value })}
            >
              <Radio value="stop">停止执行</Radio>
              <Radio value="continue">继续执行</Radio>
              <Radio value="fallback">降级处理</Radio>
            </Radio.Group>
          </Form.Item>
        </Card>
      </div>
    );
  };

  /**
   * 渲染知识图谱配置面板
   */
  const renderKnowledgeGraphPanel = () => {
    if (!knowledgeGraph) return <div>知识图谱未初始化</div>;

    return (
      <div className="knowledge-graph-panel">
        <Card title="本体层配置"  style={{ marginBottom: 16 }}>
          <Form.Item label="本体层数量">
            <InputNumber
              value={knowledgeGraph.ontologyLayers?.length || 0}
              disabled
              style={{ width: '100%' }}
            />
          </Form.Item>
          
          <Form.Item label="概念总数">
            <InputNumber
              value={Number(knowledgeGraph.ontologyLayers?.reduce((sum, layer) => sum + (layer.concepts?.length || 0), 0)) || 0}
              disabled
              style={{ width: '100%' }}
            />
          </Form.Item>
          
          <Form.Item label="关系总数">
            <InputNumber
              value={knowledgeGraph.ontologyLayers?.reduce((sum, layer) => sum + (layer.relations?.length || 0), 0) || 0}
              disabled
              style={{ width: '100%' }}
            />
          </Form.Item>

          <div style={{ marginBottom: 12 }}>
            <strong>本体层管理</strong>
            <Button 
              type="link" 
              icon={<PlusOutlined />}
              onClick={() => {
                const newOntologyLayer = {
                  id: `ontology_${Date.now()}`,
                  name: '新本体层',
                  concepts: [],
                  relations: [],
                  constraints: []
                };
                setKnowledgeGraph({
                  ...knowledgeGraph,
                  ontologyLayers: [...knowledgeGraph.ontologyLayers, newOntologyLayer]
                });
              }}
            >
              添加本体层
            </Button>
          </div>
          
          {knowledgeGraph.ontologyLayers?.map((layer, index) => (
            <Card key={layer.id}  style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <Input
                  placeholder="本体层名称"
                  value={layer.name}
                  onChange={(e) => {
                    const updatedLayers = [...knowledgeGraph.ontologyLayers];
                    updatedLayers[index] = { ...layer, name: e.target.value };
                    setKnowledgeGraph({
                      ...knowledgeGraph,
                      ontologyLayers: updatedLayers
                    });
                  }}
                  style={{ flex: 1 }}
                />
                <span style={{ flex: 1 }}>概念: {layer.concepts?.length || 0}</span>
                <span style={{ flex: 1 }}>关系: {layer.relations?.length || 0}</span>
                <Button 
                  type="text" 
                  danger 
                  icon={<DeleteOutlined />}
                  onClick={() => {
                    const updatedLayers = knowledgeGraph.ontologyLayers.filter((_, i) => i !== index);
                    setKnowledgeGraph({
                      ...knowledgeGraph,
                      ontologyLayers: updatedLayers
                    });
                  }}
                />
              </div>
            </Card>
          )) || []}
        </Card>

        <Card title="事实层配置"  style={{ marginBottom: 16 }}>
          <Form.Item label="事实层数量">
            <InputNumber
              value={knowledgeGraph.factLayers?.length || 0}
              disabled
              style={{ width: '100%' }}
            />
          </Form.Item>
          
          <Form.Item label="事实总数">
            <InputNumber
              value={knowledgeGraph.factLayers?.reduce((sum, layer) => sum + (layer.facts?.length || 0), 0) || 0}
              disabled
              style={{ width: '100%' }}
            />
          </Form.Item>
          
          <Form.Item label="更新策略">
            <Select
              value={knowledgeGraph.updateStrategy || 'real_time'}
              onChange={(value) => setKnowledgeGraph({
                ...knowledgeGraph,
                updateStrategy: value
              })}
              style={{ width: '100%' }}
            >
              <Option value="real_time">实时更新</Option>
              <Option value="batch">批量更新</Option>
              <Option value="hybrid">混合模式</Option>
            </Select>
          </Form.Item>
        </Card>

        <Card title="规则层配置" >
          <Form.Item label="规则层数量">
            <InputNumber
              value={knowledgeGraph.ruleLayers?.length || 0}
              disabled
              style={{ width: '100%' }}
            />
          </Form.Item>
          
          <Form.Item label="时序层数量">
            <InputNumber
              value={knowledgeGraph.temporalLayers?.length || 0}
              disabled
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Card>
      </div>
    );
  };

  /**
   * 渲染学习配置面板
   */
  const renderLearningPanel = () => {
    if (!learning) return <div>学习配置未初始化</div>;

    return (
      <div className="learning-panel">
        <Card title="学习策略"  style={{ marginBottom: 16 }}>
          <Form.Item label="学习模式">
            <Radio.Group
              value={learning.mode || 'supervised'}
              onChange={(e) => setLearning({
                ...learning,
                mode: e.target.value
              })}
            >
              <Radio value="supervised">监督学习</Radio>
              <Radio value="unsupervised">无监督学习</Radio>
              <Radio value="reinforcement">强化学习</Radio>
              <Radio value="transfer">迁移学习</Radio>
            </Radio.Group>
          </Form.Item>
          
          <Form.Item label="学习率">
            <Slider
              value={learning.learningRate || 0.01}
              onChange={(value) => setLearning({
                ...learning,
                learningRate: value
              })}
              min={0.001}
              max={1}
              step={0.001}
              marks={{
                0.001: '0.001',
                0.01: '0.01',
                0.1: '0.1',
                1: '1'
              }}
            />
          </Form.Item>
          
          <Form.Item label="批次大小">
            <InputNumber
              value={learning.batchSize || 32}
              onChange={(value) => setLearning({
                ...learning,
                batchSize: value || 32
              })}
              min={1}
              max={1024}
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Card>
        
        <Card title="模型配置"  style={{ marginBottom: 16 }}>
          <Form.Item label="模型类型">
            <Select
              value={learning.modelType || 'neural_network'}
              onChange={(value) => setLearning({
                ...learning,
                modelType: value
              })}
              style={{ width: '100%' }}
            >
              <Option value="neural_network">神经网络</Option>
              <Option value="decision_tree">决策树</Option>
              <Option value="random_forest">随机森林</Option>
              <Option value="svm">支持向量机</Option>
              <Option value="transformer">Transformer</Option>
            </Select>
          </Form.Item>
          
          <Form.Item label="优化器">
            <Select
              value={learning.optimizer || 'adam'}
              onChange={(value) => setLearning({
                ...learning,
                optimizer: value
              })}
              style={{ width: '100%' }}
            >
              <Option value="adam">Adam</Option>
              <Option value="sgd">SGD</Option>
              <Option value="rmsprop">RMSprop</Option>
              <Option value="adagrad">Adagrad</Option>
            </Select>
          </Form.Item>
        </Card>
        
        <Card title="训练配置" >
          <Form.Item label="最大轮数">
            <InputNumber
              value={learning.maxEpochs || 100}
              onChange={(value) => setLearning({
                ...learning,
                maxEpochs: value || 100
              })}
              min={1}
              max={10000}
              style={{ width: '100%' }}
            />
          </Form.Item>
          
          <Form.Item label="早停耐心值">
            <InputNumber
              value={learning.patience || 10}
              onChange={(value) => setLearning({
                ...learning,
                patience: value || 10
              })}
              min={1}
              max={100}
              style={{ width: '100%' }}
            />
          </Form.Item>
          
          <Form.Item label="验证比例">
            <Slider
              value={learning.validationSplit || 0.2}
              onChange={(value) => setLearning({
                ...learning,
                validationSplit: value
              })}
              min={0.1}
              max={0.5}
              step={0.05}
              marks={{
                0.1: '10%',
                0.2: '20%',
                0.3: '30%',
                0.5: '50%'
              }}
            />
          </Form.Item>
        </Card>
      </div>
    );
  };

  /**
   * 渲染部署配置面板
   */
  const renderDeploymentPanel = () => {
    if (!deployment) return <div>部署配置未初始化</div>;

    return (
      <div className="deployment-panel">
        <Card title="环境配置"  style={{ marginBottom: 16 }}>
          <Form.Item label="部署环境">
            <Radio.Group
              value={deployment.environment || 'development'}
              onChange={(e) => setDeployment({
                ...deployment,
                environment: e.target.value
              })}
            >
              <Radio value="development">开发环境</Radio>
              <Radio value="staging">测试环境</Radio>
              <Radio value="production">生产环境</Radio>
            </Radio.Group>
          </Form.Item>
          
          <Form.Item label="基础设施平台">
            <Select
              value={deployment.infrastructure?.platform || 'kubernetes'}
              onChange={(value) => setDeployment({
                ...deployment,
                infrastructure: {
                  ...deployment.infrastructure,
                  platform: value
                }
              })}
              style={{ width: '100%' }}
            >
              <Option value="kubernetes">Kubernetes</Option>
              <Option value="docker">Docker</Option>
              <Option value="serverless">Serverless</Option>
              <Option value="vm">虚拟机</Option>
            </Select>
          </Form.Item>
        </Card>
        
        <Card title="资源配置"  style={{ marginBottom: 16 }}>
          <Form.Item label="CPU请求 (核)">
            <InputNumber
              value={deployment.infrastructure?.resources?.cpu?.request || 1}
              onChange={(value) => setDeployment({
                ...deployment,
                infrastructure: {
                  ...deployment.infrastructure,
                  resources: {
                    ...deployment.infrastructure?.resources,
                    cpu: {
                      ...deployment.infrastructure?.resources?.cpu,
                      request: value || 1
                    }
                  }
                }
              })}
              min={0.1}
              max={32}
              step={0.1}
              style={{ width: '100%' }}
            />
          </Form.Item>
          
          <Form.Item label="内存请求 (GB)">
            <InputNumber
              value={deployment.infrastructure?.resources?.memory?.request || 2}
              onChange={(value) => setDeployment({
                ...deployment,
                infrastructure: {
                  ...deployment.infrastructure,
                  resources: {
                    ...deployment.infrastructure?.resources,
                    memory: {
                      ...deployment.infrastructure?.resources?.memory,
                      request: value || 2
                    }
                  }
                }
              })}
              min={0.5}
              max={128}
              step={0.5}
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Card>
        
        <Card title="扩缩容配置" >
          <Form.Item label="启用水平扩缩容">
            <Switch
              checked={deployment.scaling?.horizontal?.enabled || false}
              onChange={(checked) => setDeployment({
                ...deployment,
                scaling: {
                  ...deployment.scaling,
                  horizontal: {
                    ...deployment.scaling?.horizontal,
                    enabled: checked
                  }
                }
              })}
            />
          </Form.Item>
          
          {deployment.scaling?.horizontal?.enabled && (
            <>
              <Form.Item label="最小副本数">
                <InputNumber
                  value={deployment.scaling?.horizontal?.minReplicas || 1}
                  onChange={(value) => setDeployment({
                    ...deployment,
                    scaling: {
                      ...deployment.scaling,
                      horizontal: {
                        ...deployment.scaling?.horizontal,
                        minReplicas: value || 1
                      }
                    }
                  })}
                  min={1}
                  max={100}
                  style={{ width: '100%' }}
                />
              </Form.Item>
              
              <Form.Item label="最大副本数">
                <InputNumber
                  value={deployment.scaling?.horizontal?.maxReplicas || 10}
                  onChange={(value) => setDeployment({
                    ...deployment,
                    scaling: {
                      ...deployment.scaling,
                      horizontal: {
                        ...deployment.scaling?.horizontal,
                        maxReplicas: value || 10
                      }
                    }
                  })}
                  min={1}
                  max={1000}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </>
          )}
        </Card>
      </div>
    );
  };

  /**
   * 渲染原始学习配置面板（保留原有逻辑）
   */
  const renderOriginalLearningPanel = () => {
    if (!learning) return <div>学习配置未初始化</div>;

    return (
      <div className="learning-panel">
        <Card title="学习策略"  style={{ marginBottom: 16 }}>
          <Form.Item label="学习类型">
            <Checkbox.Group
              value={learning.strategies?.map(s => s.type) || []}
              onChange={(checkedValues) => {
                const newStrategies = checkedValues.map(type => ({
                  type: type as LearningCapabilityType,
                  enabled: true,
                  parameters: {}
                }));
                setLearning({ ...learning, strategies: newStrategies });
              }}
            >
              <Checkbox value="supervised">监督学习</Checkbox>
              <Checkbox value="unsupervised">无监督学习</Checkbox>
              <Checkbox value="reinforcement">强化学习</Checkbox>
              <Checkbox value="transfer">迁移学习</Checkbox>
              <Checkbox value="meta">元学习</Checkbox>
            </Checkbox.Group>
          </Form.Item>
          
          <Form.Item label="学习频率">
            <Select
              value={learning.frequency}
              onChange={(value) => setLearning({ ...learning, frequency: value })}
              style={{ width: '100%' }}
            >
              <Option value="continuous">持续学习</Option>
              <Option value="batch">批量学习</Option>
              <Option value="scheduled">定时学习</Option>
              <Option value="triggered">触发学习</Option>
            </Select>
          </Form.Item>
          
          <Form.Item label="学习率">
            <Slider
              value={learning.learningRate}
              onChange={(value) => setLearning({ ...learning, learningRate: value })}
              min={0.001}
              max={1}
              step={0.001}
              marks={{ 0.001: '0.001', 0.1: '0.1', 1: '1.0' }}
            />
          </Form.Item>
        </Card>

        <Card title="数据收集配置"  style={{ marginBottom: 16 }}>
          <Form.Item label="数据源类型">
            <Select
              mode="multiple"
              value={learning.dataCollection.sources.map(s => s.type)}
              onChange={(values) => {
                const newSources = values.map(type => ({
                  type,
                  enabled: true,
                  config: {}
                }));
                setLearning({
                  ...learning,
                  dataCollection: {
                    ...learning.dataCollection,
                    sources: newSources
                  }
                });
              }}
              placeholder="选择数据源"
              style={{ width: '100%' }}
            >
              <Option value="interaction">交互数据</Option>
              <Option value="feedback">反馈数据</Option>
              <Option value="performance">性能数据</Option>
              <Option value="environment">环境数据</Option>
            </Select>
          </Form.Item>
          
          <Form.Item label="数据质量阈值">
            <Slider
              value={learning.dataCollection.qualityThreshold}
              onChange={(value) => setLearning({
                ...learning,
                dataCollection: {
                  ...learning.dataCollection,
                  qualityThreshold: value
                }
              })}
              min={0}
              max={100}
              marks={{ 0: '0%', 50: '50%', 100: '100%' }}
            />
          </Form.Item>
          
          <Form.Item label="存储策略">
            <Radio.Group
              value={learning.dataCollection.storageStrategy}
              onChange={(e) => setLearning({
                ...learning,
                dataCollection: {
                  ...learning.dataCollection,
                  storageStrategy: e.target.value
                }
              })}
            >
              <Radio value="memory">内存存储</Radio>
              <Radio value="disk">磁盘存储</Radio>
              <Radio value="cloud">云端存储</Radio>
            </Radio.Group>
          </Form.Item>
        </Card>

        <Card title="模型配置" >
          <Form.Item label="模型类型">
            <Select
              value={learning.modelConfig.type}
              onChange={(value) => setLearning({
                ...learning,
                modelConfig: {
                  ...learning.modelConfig,
                  type: value
                }
              })}
              style={{ width: '100%' }}
            >
              <Option value="neural_network">神经网络</Option>
              <Option value="decision_tree">决策树</Option>
              <Option value="svm">支持向量机</Option>
              <Option value="ensemble">集成模型</Option>
            </Select>
          </Form.Item>
          
          <Form.Item label="训练批次大小">
            <InputNumber
              value={learning.modelConfig.batchSize}
              onChange={(value) => setLearning({
                ...learning,
                modelConfig: {
                  ...learning.modelConfig,
                  batchSize: value || 32
                }
              })}
              min={1}
              max={1024}
              style={{ width: '100%' }}
            />
          </Form.Item>
          
          <Form.Item label="最大训练轮数">
            <InputNumber
              value={learning.modelConfig.maxEpochs}
              onChange={(value) => setLearning({
                ...learning,
                modelConfig: {
                  ...learning.modelConfig,
                  maxEpochs: value || 100
                }
              })}
              min={1}
              max={10000}
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Card>
      </div>
    );
  };



  /**
   * 渲染保存对话框
   */
  const renderSaveModal = () => {
    return (
      <Modal
        title="保存Agent配置"
        open={saveModalVisible}
        onOk={handleSaveAgent}
        onCancel={() => setSaveModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item 
            name="name" 
            label="Agent名称" 
            rules={[{ required: true, message: '请输入Agent名称' }]}
          >
            <Input placeholder="输入Agent名称" />
          </Form.Item>
          
          <Form.Item 
            name="description" 
            label="描述"
            rules={[{ required: true, message: '请输入描述' }]}
          >
            <TextArea rows={3} placeholder="描述Agent的功能和用途" />
          </Form.Item>
          
          <Form.Item name="version" label="版本">
            <Input placeholder="1.0.0" />
          </Form.Item>
          
          <Form.Item name="category" label="分类">
            <Select placeholder="选择分类">
              <Option value="general">通用</Option>
              <Option value="business">业务</Option>
              <Option value="technical">技术</Option>
              <Option value="research">研究</Option>
            </Select>
          </Form.Item>
          
          <Form.Item name="difficulty" label="难度">
            <Radio.Group>
              <Radio value="beginner">初级</Radio>
              <Radio value="intermediate">中级</Radio>
              <Radio value="advanced">高级</Radio>
              <Radio value="expert">专家</Radio>
            </Radio.Group>
          </Form.Item>
          
          <Form.Item name="tags" label="标签">
            <Select mode="tags" placeholder="添加标签">
              <Option value="ai">AI</Option>
              <Option value="automation">自动化</Option>
              <Option value="analysis">分析</Option>
              <Option value="processing">处理</Option>
            </Select>
          </Form.Item>
        </Form>
        
        <Divider />
        
        <div className="save-summary">
          <h4>配置摘要</h4>
          <p>能力模块数量: {capabilities.length}</p>
          <p>编排模式: {agent?.orchestrationConfig?.mode}</p>
          <p>知识图谱: {agent?.knowledgeGraph?.enabled ? '启用' : '禁用'}</p>
          <p>学习功能: {agent?.learningConfig?.enabled ? '启用' : '禁用'}</p>
        </div>
      </Modal>
    );
  };
  
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <div className="loading-spinner" />
          <p>正在初始化Agent设计器...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`agent-designer-2-0 ${darkMode ? 'dark' : 'light'}`} data-theme={darkMode ? 'dark' : 'light'}>
      {/* 顶部工具栏 */}
      <div className="designer-header">
        <div className="header-left">
          <Button 
            type="text" 
            icon={<ArrowLeftOutlined />}
            onClick={() => onBack ? onBack() : navigate('/agent-manager')}
          >
            返回
          </Button>
          <Divider type="vertical" />
          <h2 className="designer-title">
            <BulbOutlined /> EFIAgent 2.0 设计器
          </h2>
          {agent?.name && (
            <Tag color="blue">{agent.name}</Tag>
          )}
        </div>
        
        <div className="header-right">
          <div className="toolbar-button-group">
            <Tooltip title="预览模式">
              <Switch 
                checked={previewMode}
                onChange={setPreviewMode}
                checkedChildren={<EyeOutlined />}
                unCheckedChildren={<SettingOutlined />}
                
              />
            </Tooltip>
            
            <Tooltip title="深色模式">
              <Switch 
                checked={darkMode}
                onChange={setDarkMode}
                checkedChildren={<MoonOutlined />}
                unCheckedChildren={<SunOutlined />}
                
              />
            </Tooltip>
          </div>
          
          <Space>
            <Tooltip title="AI助手">
              <Button 
                icon={<RobotOutlined />}
                onClick={() => setAiAssistantVisible(true)}
                className="fade-in"
              >
                AI助手
              </Button>
            </Tooltip>
            
            <Tooltip title="实时验证">
              <Button 
                icon={<CheckCircleOutlined />}
                onClick={() => setValidatorVisible(true)}
                className="fade-in"
              >
                验证
              </Button>
            </Tooltip>
            
            <Tooltip title="核心能力模块">
              <Button 
                icon={<ApiOutlined />}
                onClick={() => setCoreModulesVisible(true)}
                className="fade-in"
              >
                核心模块
              </Button>
            </Tooltip>
            
            <Tooltip title="智能能力配置">
              <Button 
                icon={<ExperimentOutlined />}
                onClick={() => setIntelligentConfigVisible(true)}
                className="fade-in"
              >
                智能配置
              </Button>
            </Tooltip>
            
            <Tooltip title="增强能力库">
              <Button 
                icon={<DatabaseOutlined />}
                onClick={() => setEnhancedLibraryVisible(true)}
                className="fade-in"
              >
                能力库
              </Button>
            </Tooltip>
            
            <Tooltip title="可视化编排">
              <Button 
                icon={<ThunderboltOutlined />}
                onClick={() => setVisualOrchestratorVisible(true)}
                className="fade-in"
              >
                可视化编排
              </Button>
            </Tooltip>
            
            <Button 
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setCapabilityDrawerVisible(true)}
              className="fade-in"
            >
              添加能力
            </Button>
            
            <Button 
              type="primary"
              icon={<SaveOutlined />}
              onClick={() => {
                const validation = validateAgentConfig();
                if (validation.isValid) {
                  setSaveModalVisible(true);
                } else {
                  Modal.error({
                    title: '配置验证失败',
                    content: (
                      <ul>
                        {validation.errors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    )
                  });
                }
              }}
              className="fade-in"
            >
              保存
            </Button>
          </Space>
        </div>
      </div>
      
      {/* 主要内容区域 */}
      <div className="designer-content">
        <div className="content-left">
          {/* 能力流程图 */}
          <div className="flow-container">
            {/* ReactFlow 组件用于显示能力流程图 */}
            <div style={{ height: '600px', border: '1px solid #d9d9d9', borderRadius: '6px', marginBottom: '16px' }}>
              <ReactFlowProvider>
                <ReactFlow
                  nodes={nodes}
                  edges={edges}
                  onNodesChange={onNodesChange}
                  onEdgesChange={onEdgesChange}
                  onConnect={onConnect}
                  onNodeClick={onNodeClick}
                  onEdgeClick={onEdgeClick}
                  onInit={setReactFlowInstance}
                  nodeTypes={nodeTypes}
                  edgeTypes={edgeTypes}
                  fitView
                  attributionPosition="bottom-left"
                >
                  <Background color="#f0f0f0" gap={20} />
                  <Controls />
                  <MiniMap 
                    nodeColor={(node) => {
                      const nodeData = node.data;
                      const status = nodeData?.status || 'idle';
                      return status === 'success' ? '#52c41a' :
                             status === 'error' ? '#ff4d4f' :
                             status === 'running' ? '#1890ff' : '#8c8c8c';
                    }}
                    maskColor="rgba(255, 255, 255, 0.8)"
                  />
                </ReactFlow>
              </ReactFlowProvider>
            </div>
            
            <Button type="primary" onClick={() => setVisualOrchestratorVisible(true)}>
              打开可视化能力编排器
            </Button>
            <Drawer
              title="可视化能力编排器"
              placement="right"
              width={800}
              open={visualOrchestratorVisible}
              onClose={() => setVisualOrchestratorVisible(false)}
            >
              <VisualCapabilityOrchestrator
                visible={visualOrchestratorVisible}
                onClose={() => setVisualOrchestratorVisible(false)}
                capabilities={capabilities}
                orchestrationConfig={agent?.orchestrationConfig}
                onOrchestrationConfigChange={updateOrchestrationConfig}
                onCapabilitiesChange={setCapabilities}
              />
            </Drawer>
          </div>
        </div>
        
        <div className="content-right">
          {/* 配置面板 */}
          <div className="config-panel">
            <Tabs 
              activeKey={activeTab} 
              onChange={setActiveTab}
              items={[
                {
                  key: 'basic',
                  label: (
                    <span>
                      <SettingOutlined />
                      基础配置
                    </span>
                  ),
                  children: renderBasicConfigPanel()
                },
                {
                  key: 'capabilities',
                  label: (
                    <span>
                      <BulbOutlined />
                      能力配置
                    </span>
                  ),
                  children: renderCapabilityPanel()
                },
                {
                  key: 'orchestration',
                  label: (
                    <span>
                      <ThunderboltOutlined />
                      编排配置
                    </span>
                  ),
                  children: renderOrchestrationPanel()
                },
                {
                  key: 'knowledge',
                  label: (
                    <span>
                      <DatabaseOutlined />
                      知识图谱
                    </span>
                  ),
                  children: renderKnowledgeGraphPanel()
                },
                {
                  key: 'learning',
                  label: (
                    <span>
                      <BookOutlined />
                      学习配置
                    </span>
                  ),
                  children: renderLearningPanel()
                },
                {
                  key: 'deployment',
                  label: (
                    <span>
                      <CloudOutlined />
                      部署配置
                    </span>
                  ),
                  children: renderDeploymentPanel()
                }
              ]}
            />
          </div>
        </div>
      </div>
      
      {/* 能力库抽屉 */}
      {renderCapabilityDrawer()}
      
      {/* 保存对话框 */}
      {renderSaveModal()}
      
      {/* AI助手 */}
      <AIAssistant
        visible={aiAssistantVisible}
        onClose={() => setAiAssistantVisible(false)}
        agent={agent}
        capabilities={capabilities}
        availableCapabilities={[]}
        onCapabilityRecommend={(capability) => {
          setCapabilities(prev => [...prev, capability]);
          message.success('已添加推荐能力');
        }}
        onTemplateApply={(template) => {
          try {
            // 应用模板到当前Agent配置
            const newAgent: Agent2_0 = {
              id: template.id,
              name: template.name,
              description: template.description,
              version: template.version || '1.0.0',
              type: template.type,
              status: AgentStatus.IDLE,
              capabilities: template.capabilities?.map(cap => ({
                id: cap.capabilityId,
                name: cap.capabilityId,
                type: CoreCapabilityType.COGNITIVE, // 默认类型，需要根据实际情况映射
                category: CapabilityCategory.CORE,
                description: '',
                version: '1.0.0',
                maturityLevel: CapabilityMaturityLevel.DEFINED,
                dependencies: [],
                interfaces: { inputs: [], outputs: [] },
                implementation: { type: CapabilitySourceType.BUILTIN, source: '' },
                configuration: cap.config || {},
                enabled: cap.enabled
              })) || [],
              orchestrator: {
                mode: CapabilityOrchestrationMode.SEQUENTIAL,
                rules: [],
                priorities: {},
                constraints: []
              },
              metadata: {
                category: template.category || 'general',
                difficulty: template.difficulty,
                tags: template.tags || [],
                author: template.author || 'Unknown',
                version: template.version || '1.0.0',
                createdAt: new Date(),
                updatedAt: new Date()
              }
            };
            
            // 更新Agent状态
            setAgent(newAgent);
            setCapabilities(newAgent.capabilities);
            setOrchestrator(newAgent.orchestrator);
            setMetadata(newAgent.metadata);
            
            // 更新表单数据
            form.setFieldsValue({
              name: newAgent.name,
              description: newAgent.description,
              version: newAgent.version,
              category: newAgent.metadata?.category || '',
              difficulty: newAgent.metadata?.difficulty || 'beginner',
              tags: newAgent.metadata?.tags || []
            });
            
            // 关闭AI助手
            setAiAssistantVisible(false);
            
            message.success(`已成功应用模板: ${template.name}`);
          } catch (error) {
            console.error('应用模板失败:', error);
            message.error('应用模板失败，请重试');
          }
        }}
      />
      
      {/* 实时验证器 */}
      <RealTimeValidator
        visible={validatorVisible}
        onClose={() => setValidatorVisible(false)}
        agent={agent}
        capabilities={capabilities}
        orchestrator={agent?.orchestrationConfig}
        onValidationChange={(isValid, errors) => {
          if (isValid) {
            message.success('验证通过');
          } else {
            message.warning(`发现 ${errors.length} 个问题`);
          }
        }}
      />
      
      {/* 核心能力模块 */}
      <CoreCapabilityModules
        visible={coreModulesVisible}
        onClose={() => setCoreModulesVisible(false)}
        onCapabilitySelect={(capability) => {
          setCapabilities(prev => [...prev, capability]);
          message.success('核心能力模块已添加');
        }}
        selectedCapabilities={capabilities}
      />
      
      {/* 智能能力配置 */}
      {intelligentConfigVisible && agent && (
        <IntelligentCapabilityConfig
          visible={intelligentConfigVisible}
          onClose={() => setIntelligentConfigVisible(false)}
          agent={agent}
          capabilities={capabilities}
          onCapabilitiesChange={setCapabilities}
          onAgentChange={setAgent}
        />
      )}
      
      {/* 增强能力库 */}
      <EnhancedCapabilityLibrary
        visible={enhancedLibraryVisible}
        onClose={() => setEnhancedLibraryVisible(false)}
        onCapabilitySelect={(capability) => {
          setCapabilities(prev => [...prev, capability]);
          message.success('能力已添加到Agent');
        }}
        selectedCapabilities={capabilities}
      />
      
      {/* 可视化能力编排器 */}
      <VisualCapabilityOrchestrator
        visible={visualOrchestratorVisible}
        onClose={() => setVisualOrchestratorVisible(false)}
        capabilities={capabilities}
        orchestrationConfig={agent?.orchestrationConfig}
        onOrchestrationConfigChange={updateOrchestrationConfig}
        onCapabilitiesChange={setCapabilities}
      />
    </div>
  );
};

export default AgentDesigner2_0;