import React, { useState, useCallback, useEffect, useMemo } from 'react';
import ReactFlow, {
  Controls,
  Background,
  MiniMap,
  addEdge,
  Node,
  Edge,
  Connection,
  useNodesState,
  useEdgesState,
  OnSelectionChangeParams,
  NodeTypes,
  EdgeTypes,
  Panel,
  MarkerType,
  NodeChange,
  EdgeChange,
  NodeMouseHandler,
  ConnectionLineType,
  ReactFlowProvider,
  Handle,
  Position
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Button, message, Tooltip, Drawer, Tabs, Input, Select, Form, Switch, Collapse, Tag, Card, Spin, Modal, Divider } from 'antd';
import { 
  PlusOutlined, 
  DeleteOutlined, 
  SaveOutlined, 
  ExportOutlined, 
  ImportOutlined, 
  ZoomInOutlined, 
  ZoomOutOutlined, 
  UndoOutlined, 
  RedoOutlined,
  SettingOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  QuestionCircleOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined,
  AppstoreOutlined
} from '@ant-design/icons';
import { BaseNode, AgentType, AgentStatus, Workflow, WorkflowStatus, Connection as WorkflowConnection } from './types';
import { useGlobalState } from './StateManager';
import WorkflowEngine from './WorkflowEngine';
import NodePalette from './NodePalette';
import './WorkflowDesigner.css';

// 工作流设计器属性接口
interface WorkflowDesignerProps {
  components: BaseNode[];
  onSaveWorkflow: (nodes: Node[], edges: Edge[]) => void;
}

// 节点类型定义
interface NodeData {
  label: string;
  type?: string;
  description?: string;
  agentId?: string;
  agentType?: AgentType;
  status?: AgentStatus;
  config?: any;
  icon?: string;
  inputs?: string[];
  outputs?: string[];
  properties?: any;
  isStartNode?: boolean;
  isEndNode?: boolean;
  isErrorNode?: boolean;
  isConditionNode?: boolean;
  condition?: string;
}

// 边类型定义
interface EdgeData {
  label?: string;
  condition?: string;
  animated?: boolean;
  style?: React.CSSProperties;
}

// 自定义节点组件
const CustomNode: React.FC<any> = ({ data, selected }) => {
  // 根据节点类型设置不同的样式和图标
  const getNodeStyle = () => {
    if (data.isStartNode) {
      return { background: '#13c2c2', color: 'white' };
    } else if (data.isEndNode) {
      return { background: '#722ed1', color: 'white' };
    } else if (data.isErrorNode) {
      return { background: '#f5222d', color: 'white' };
    } else if (data.isConditionNode) {
      return { background: '#faad14', color: 'white' };
    } else if (data.agentType === AgentType.PLANNING) {
      return { background: '#1890ff', color: 'white' };
    } else if (data.agentType === AgentType.EXECUTION) {
      return { background: '#52c41a', color: 'white' };
    } else if (data.agentType === AgentType.AUDIT) {
      return { background: '#fa8c16', color: 'white' };
    } else if (data.agentType === AgentType.MEMORY) {
      return { background: '#eb2f96', color: 'white' };
    }
    return {};
  };

  // 获取节点图标
  const getNodeIcon = () => {
    if (data.isStartNode) {
      return <PlayCircleOutlined />;
    } else if (data.isEndNode) {
      return <CheckCircleOutlined />;
    } else if (data.isErrorNode) {
      return <CloseCircleOutlined />;
    } else if (data.isConditionNode) {
      return <QuestionCircleOutlined />;
    } else if (data.agentType === AgentType.PLANNING) {
      return <SettingOutlined />;
    } else if (data.agentType === AgentType.EXECUTION) {
      return <PlayCircleOutlined />;
    } else if (data.agentType === AgentType.AUDIT) {
      return <InfoCircleOutlined />;
    } else if (data.agentType === AgentType.MEMORY) {
      return <SaveOutlined />;
    }
    return <InfoCircleOutlined />;
  };

  return (
    <>
      {/* 输入连接点 - 开始节点不需要输入 */}
      {!data.isStartNode && (
        <Handle
          type="target"
          position={Position.Left}
          style={{ background: '#555' }}
        />
      )}
      
      <div
        className={`custom-node ${selected ? 'selected' : ''}`}
        style={{
          border: selected ? '2px solid #1890ff' : '1px solid #ddd',
          borderRadius: '5px',
          padding: '10px',
          minWidth: '150px',
          backgroundColor: 'white',
          ...getNodeStyle()
        }}
      >
        <div className="node-header">
          {getNodeIcon()}
          <span className="node-title">{data.label}</span>
        </div>
        {data.description && (
          <div className="node-description">{data.description}</div>
        )}
        {data.status && (
          <div className="node-status">
            <Tag color={data.status === AgentStatus.RUNNING ? 'green' : data.status === AgentStatus.ERROR ? 'red' : 'default'}>
              {data.status}
            </Tag>
          </div>
        )}
      </div>
      
      {/* 输出连接点 - 结束节点不需要输出 */}
      {!data.isEndNode && (
        <Handle
          type="source"
          position={Position.Right}
          style={{ background: '#555' }}
        />
      )}
    </>
  );
};

// 自定义边组件
const CustomEdge: React.FC<any> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
  markerEnd
}) => {
  const edgePath = `M${sourceX},${sourceY} C${sourceX + 50},${sourceY} ${targetX - 50},${targetY} ${targetX},${targetY}`;
  
  return (
    <>
      <path
        id={id}
        className="react-flow__edge-path"
        d={edgePath}
        markerEnd={markerEnd}
        style={{
          strokeWidth: selected ? 2 : 1,
          stroke: selected ? '#1890ff' : '#b1b1b7',
          ...data?.style
        }}
      />
      {data?.label && (
        <text>
          <textPath
            href={`#${id}`}
            style={{ fontSize: '12px' }}
            startOffset="50%"
            textAnchor="middle"
          >
            {data.label}
          </textPath>
        </text>
      )}
    </>
  );
};

/**
 * 工作流设计器组件
 * 用于设计Agent组件之间的工作流
 */
const WorkflowDesigner: React.FC<WorkflowDesignerProps> = ({
  components,
  onSaveWorkflow
}) => {
  // 使用全局状态
  const globalState = useGlobalState();
  
  // 节点和边状态
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  
  // 选中元素状态
  const [selectedElements, setSelectedElements] = useState<(Node<any> | Edge<any>)[]>([]);
  const [selectedNode, setSelectedNode] = useState<Node<NodeData> | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<Edge<EdgeData> | null>(null);
  
  // 属性面板状态
  const [propertiesVisible, setPropertiesVisible] = useState<boolean>(false);
  const [propertiesForm] = Form.useForm();
  
  // 工作流状态
  const [workflowName, setWorkflowName] = useState<string>('新工作流');
  const [workflowDescription, setWorkflowDescription] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [saveModalVisible, setSaveModalVisible] = useState<boolean>(false);
  
  // 工作流执行状态
  const [executionEngineVisible, setExecutionEngineVisible] = useState<boolean>(false);
  const [currentWorkflow, setCurrentWorkflow] = useState<Workflow | null>(null);
  
  // 节点库状态
  const [nodePaletteVisible, setNodePaletteVisible] = useState<boolean>(true);
  const [draggedNodeType, setDraggedNodeType] = useState<string | null>(null);
  
  // 历史记录状态（用于撤销/重做）
  const [history, setHistory] = useState<{nodes: Node<NodeData>[]; edges: Edge<EdgeData>[]}[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  
  // 自定义节点和边类型
  const nodeTypes: NodeTypes = useMemo(() => ({
    custom: CustomNode,
  }), []);
  
  const edgeTypes: EdgeTypes = useMemo(() => ({
    custom: CustomEdge,
  }), []);
  
  // 初始化节点
  useEffect(() => {
    if (nodes.length === 0) {
      // 创建一些示例节点来测试画布
      const initialNodes = [
        {
          id: 'start-1',
          type: 'custom',
          data: {
            label: '开始节点',
            description: '工作流开始节点',
            isStartNode: true
          },
          position: { x: 100, y: 100 }
        },
        {
          id: 'planning-1',
          type: 'custom',
          data: {
            label: '规划Agent',
            description: '负责任务规划和分解',
            agentType: AgentType.PLANNING
          },
          position: { x: 300, y: 200 }
        },
        {
          id: 'execution-1',
          type: 'custom',
          data: {
            label: '执行Agent',
            description: '负责任务执行',
            agentType: AgentType.EXECUTION
          },
          position: { x: 500, y: 300 }
        },
        {
          id: 'end-1',
          type: 'custom',
          data: {
            label: '结束节点',
            description: '工作流结束节点',
            isEndNode: true
          },
          position: { x: 700, y: 400 }
        }
      ];
      
      setNodes(initialNodes);
      // 初始化历史记录
      setHistory([{nodes: initialNodes, edges: []}]);
      setHistoryIndex(0);
    }
  }, [setNodes]);
  
  // 加载选中的工作流
  useEffect(() => {
    if (globalState.selectedWorkflow) {
      setIsLoading(true);
      
      try {
        const workflow = globalState.selectedWorkflow;
        setWorkflowName(workflow.name);
        setWorkflowDescription(workflow.description);
        
        // 转换节点
        const workflowNodes = workflow.nodes.map((node: any) => ({
          id: node.id,
          type: 'custom',
          data: {
            label: node.name,
            description: node.description,
            agentId: node.agent_id,
            agentType: node.agent_type,
            config: node.config,
            isStartNode: node.type === 'start',
            isEndNode: node.type === 'end',
            isErrorNode: node.type === 'error_handler',
            isConditionNode: node.type === 'condition'
          },
          position: node.position
        }));
        
        // 转换边
        const workflowEdges = workflow.connections.map((connection: WorkflowConnection) => ({
          id: connection.id,
          source: connection.sourceId,
          target: connection.targetId,
          sourceHandle: connection.sourceHandle,
          targetHandle: connection.targetHandle,
          type: 'custom',
          data: {
            label: connection.label,
            condition: connection.data?.condition,
            animated: true
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 20,
            height: 20
          }
        }));
        
        setNodes(workflowNodes);
        setEdges(workflowEdges);
        
        // 更新历史记录
        setHistory([{nodes: workflowNodes, edges: workflowEdges}]);
        setHistoryIndex(0);
      } catch (error) {
        console.error('加载工作流失败:', error);
        message.error('加载工作流失败');
      } finally {
        setIsLoading(false);
      }
    }
  }, [globalState.selectedWorkflow, setNodes, setEdges]);
  
  // 保存当前状态到历史记录
  const saveToHistory = useCallback((newNodes: Node<NodeData>[], newEdges: Edge<EdgeData>[]) => {
    // 只有当节点或边发生实质性变化时才保存历史记录
    const lastHistoryState = history[historyIndex];
    if (!lastHistoryState ||
        JSON.stringify(lastHistoryState.nodes) !== JSON.stringify(newNodes) ||
        JSON.stringify(lastHistoryState.edges) !== JSON.stringify(newEdges)) {
      
      // 删除当前索引之后的所有历史记录
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push({nodes: newNodes, edges: newEdges});
      
      // 限制历史记录长度
      if (newHistory.length > 50) {
        newHistory.shift();
      }
      
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    }
  }, [history, historyIndex]);
  
  // 处理节点变化
  const handleNodesChange = useCallback((changes: NodeChange[]) => {
    onNodesChange(changes);
    
    // 节点位置变化完成后保存历史记录
    const positionChanges = changes.filter(change => change.type === 'position' && change.dragging === false);
    if (positionChanges.length > 0) {
      setNodes((currentNodes: Node<NodeData>[]) => {
        saveToHistory(currentNodes, edges);
        return currentNodes;
      });
    }
  }, [onNodesChange, edges, saveToHistory, setNodes]);
  
  // 处理边变化
  const handleEdgesChange = useCallback((changes: EdgeChange[]) => {
    onEdgesChange(changes);
    
    // 边删除后保存历史记录
    const removeChanges = changes.filter(change => change.type === 'remove');
    if (removeChanges.length > 0) {
      setEdges((currentEdges: Edge<EdgeData>[]) => {
        saveToHistory(nodes, currentEdges);
        return currentEdges;
      });
    }
  }, [onEdgesChange, nodes, saveToHistory, setEdges]);
  
  // 处理连接
  const onConnect = useCallback((params: Connection) => {
    // 创建自定义边
    const newEdge = {
      ...params,
      id: `edge_${Date.now()}`,
      type: 'custom',
      data: {
        label: '连接',
        animated: true
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 20,
        height: 20
      }
    };
    
    setEdges((eds: Edge<EdgeData>[]) => {
      const newEdges = addEdge(newEdge, eds);
      saveToHistory(nodes, newEdges);
      return newEdges;
    });
  }, [setEdges, nodes, saveToHistory]);
  
  // 处理选择
  const onSelectionChange = useCallback((params: OnSelectionChangeParams) => {
    const selected = [...(params.nodes || []), ...(params.edges || [])];
    setSelectedElements(selected);
    
    // 更新选中的节点或边
    if (params.nodes && params.nodes.length === 1) {
      setSelectedNode(params.nodes[0] as Node<NodeData>);
      setSelectedEdge(null);
      setPropertiesVisible(true);
      
      // 填充表单数据
      const node = params.nodes[0] as Node<NodeData>;
      propertiesForm.setFieldsValue({
        id: node.id,
        label: node.data.label,
        description: node.data.description,
        agentType: node.data.agentType,
        isStartNode: node.data.isStartNode,
        isEndNode: node.data.isEndNode,
        isErrorNode: node.data.isErrorNode,
        isConditionNode: node.data.isConditionNode,
        condition: node.data.condition
      });
    } else if (params.edges && params.edges.length === 1) {
      setSelectedNode(null);
      setSelectedEdge(params.edges[0] as Edge<EdgeData>);
      setPropertiesVisible(true);
      
      // 填充表单数据
      const edge = params.edges[0] as Edge<EdgeData>;
      propertiesForm.setFieldsValue({
        id: edge.id,
        label: edge.data?.label,
        condition: edge.data?.condition,
        animated: edge.data?.animated
      });
    } else {
      setSelectedNode(null);
      setSelectedEdge(null);
      setPropertiesVisible(false);
    }
  }, [propertiesForm]);
  
  // 删除选中元素
  const deleteSelected = useCallback(() => {
    if (selectedElements.length === 0) return;
    
    setNodes((nds: Node<NodeData>[]) => {
      const newNodes = nds.filter((node: Node<NodeData>) => !selectedElements.some(el => 'id' in el && el.id === node.id));
      setEdges((eds: Edge<EdgeData>[]) => {
        const newEdges = eds.filter((edge: Edge<EdgeData>) => !selectedElements.some(el => 'id' in el && el.id === edge.id));
        saveToHistory(newNodes, newEdges);
        return newEdges;
      });
      return newNodes;
    });
    
    setSelectedNode(null);
    setSelectedEdge(null);
    setPropertiesVisible(false);
    message.success('已删除选中元素');
  }, [selectedElements, setNodes, setEdges, saveToHistory]);
  
  // 保存工作流
  const saveWorkflow = useCallback(() => {
    setSaveModalVisible(true);
  }, []);
  
  // 确认保存工作流
  const confirmSaveWorkflow = useCallback(() => {
    setIsLoading(true);
    
    try {
      // 转换节点和边为工作流格式
      const workflowNodes = nodes.map((node: Node<NodeData>) => ({
        id: node.id,
        type: node.data.isStartNode ? 'start' : node.data.isEndNode ? 'end' : node.data.isErrorNode ? 'error_handler' : node.data.isConditionNode ? 'condition' : 'agent',
        name: node.data.label,
        description: node.data.description,
        position: node.position,
        agent_id: node.data.agentId,
        agent_type: node.data.agentType,
        config: node.data.config
      }));
      
      const workflowEdges = edges.map((edge: Edge<EdgeData>) => ({
        id: edge.id,
        sourceId: edge.source,
        targetId: edge.target,
        sourceHandle: edge.sourceHandle,
        targetHandle: edge.targetHandle,
        label: edge.data?.label,
        data: {
          condition: edge.data?.condition
        }
      }));
      
      // 调用保存回调
      onSaveWorkflow(nodes, edges);
      
      // 创建或更新工作流
      if (globalState.selectedWorkflow) {
        // 更新现有工作流
        const updatedWorkflow = {
          ...globalState.selectedWorkflow,
          name: workflowName,
          description: workflowDescription,
          nodes: workflowNodes,
          connections: workflowEdges,
          updatedAt: new Date()
        };
        
        // 在实际应用中，这里应该调用API更新工作流
        console.log('更新工作流:', updatedWorkflow);
        message.success('工作流已更新');
      } else {
        // 创建新工作流
        globalState.createWorkflow(workflowName, workflowDescription, workflowNodes, workflowEdges)
          .then(() => {
            message.success('工作流已创建');
          })
          .catch(error => {
            console.error('创建工作流失败:', error);
            message.error('创建工作流失败');
          });
      }
    } catch (error) {
      console.error('保存工作流失败:', error);
      message.error('保存工作流失败');
    } finally {
      setIsLoading(false);
      setSaveModalVisible(false);
    }
  }, [nodes, edges, onSaveWorkflow, globalState, workflowName, workflowDescription]);
  
  // 添加新节点
  const addNewNode = useCallback((type: string) => {
    const nodeId = `node_${Date.now()}`;
    let newNode: Node<NodeData>;
    
    switch (type) {
      case 'start':
        newNode = {
          id: nodeId,
          type: 'custom',
          data: { 
            label: '开始',
            description: '工作流开始节点',
            isStartNode: true
          },
          position: { x: 100, y: 100 }
        };
        break;
      case 'end':
        newNode = {
          id: nodeId,
          type: 'custom',
          data: { 
            label: '结束',
            description: '工作流结束节点',
            isEndNode: true
          },
          position: { x: 500, y: 100 }
        };
        break;
      case 'error':
        newNode = {
          id: nodeId,
          type: 'custom',
          data: { 
            label: '错误处理',
            description: '处理工作流中的错误',
            isErrorNode: true
          },
          position: { x: 300, y: 300 }
        };
        break;
      case 'condition':
        newNode = {
          id: nodeId,
          type: 'custom',
          data: { 
            label: '条件',
            description: '条件判断节点',
            isConditionNode: true,
            condition: ''
          },
          position: { x: 300, y: 100 }
        };
        break;
      case 'planning':
        newNode = {
          id: nodeId,
          type: 'custom',
          data: { 
            label: '规划Agent',
            description: '负责任务分解和规划',
            agentType: AgentType.PLANNING
          },
          position: { x: 300, y: 100 }
        };
        break;
      case 'execution':
        newNode = {
          id: nodeId,
          type: 'custom',
          data: { 
            label: '执行Agent',
            description: '负责执行具体任务',
            agentType: AgentType.EXECUTION
          },
          position: { x: 300, y: 200 }
        };
        break;
      case 'audit':
        newNode = {
          id: nodeId,
          type: 'custom',
          data: { 
            label: '审计Agent',
            description: '负责审计和监控',
            agentType: AgentType.AUDIT
          },
          position: { x: 300, y: 300 }
        };
        break;
      case 'memory':
        newNode = {
          id: nodeId,
          type: 'custom',
          data: { 
            label: '记忆Agent',
            description: '负责存储和检索信息',
            agentType: AgentType.MEMORY
          },
          position: { x: 300, y: 400 }
        };
        break;
      default:
        newNode = {
          id: nodeId,
          type: 'custom',
          data: { 
            label: '新节点',
            description: '自定义节点'
          },
          position: { x: 300, y: 100 }
        };
    }
    
    setNodes((nds: Node<NodeData>[]) => {
      const newNodes = [...nds, newNode];
      saveToHistory(newNodes, edges);
      return newNodes;
    });
  }, [setNodes, edges, saveToHistory]);
  
  // 在指定位置添加新节点
  const addNewNodeAtPosition = useCallback((type: string, position: { x: number; y: number }) => {
    const nodeId = `node_${Date.now()}`;
    let newNode: Node<NodeData>;
    
    switch (type) {
      case 'start':
        newNode = {
          id: nodeId,
          type: 'custom',
          data: { 
            label: '开始',
            description: '工作流开始节点',
            isStartNode: true
          },
          position
        };
        break;
      case 'end':
        newNode = {
          id: nodeId,
          type: 'custom',
          data: { 
            label: '结束',
            description: '工作流结束节点',
            isEndNode: true
          },
          position
        };
        break;
      case 'error':
        newNode = {
          id: nodeId,
          type: 'custom',
          data: { 
            label: '错误处理',
            description: '处理工作流中的错误',
            isErrorNode: true
          },
          position
        };
        break;
      case 'condition':
        newNode = {
          id: nodeId,
          type: 'custom',
          data: { 
            label: '条件',
            description: '条件判断节点',
            isConditionNode: true,
            condition: ''
          },
          position
        };
        break;
      case 'planning':
        newNode = {
          id: nodeId,
          type: 'custom',
          data: { 
            label: '规划Agent',
            description: '负责任务分解和规划',
            agentType: AgentType.PLANNING
          },
          position
        };
        break;
      case 'execution':
        newNode = {
          id: nodeId,
          type: 'custom',
          data: { 
            label: '执行Agent',
            description: '负责执行具体任务',
            agentType: AgentType.EXECUTION
          },
          position
        };
        break;
      case 'audit':
        newNode = {
          id: nodeId,
          type: 'custom',
          data: { 
            label: '审计Agent',
            description: '负责审计和监控',
            agentType: AgentType.AUDIT
          },
          position
        };
        break;
      case 'memory':
        newNode = {
          id: nodeId,
          type: 'custom',
          data: { 
            label: '记忆Agent',
            description: '负责存储和检索信息',
            agentType: AgentType.MEMORY
          },
          position
        };
        break;
      default:
        newNode = {
          id: nodeId,
          type: 'custom',
          data: { 
            label: '新节点',
            description: '自定义节点'
          },
          position
        };
    }
    
    setNodes((nds: Node<NodeData>[]) => {
      const newNodes = [...nds, newNode];
      saveToHistory(newNodes, edges);
      return newNodes;
    });
  }, [setNodes, edges, saveToHistory]);
  
  // 更新节点属性
  const updateNodeProperties = useCallback((values: any) => {
    if (!selectedNode) return;
    
    setNodes((nds: Node<NodeData>[]) => {
      const newNodes = nds.map((node: Node<NodeData>) => {
        if (node.id === selectedNode.id) {
          return {
            ...node,
            data: {
              ...node.data,
              label: values.label,
              description: values.description,
              agentType: values.agentType,
              isStartNode: values.isStartNode,
              isEndNode: values.isEndNode,
              isErrorNode: values.isErrorNode,
              isConditionNode: values.isConditionNode,
              condition: values.condition
            }
          };
        }
        return node;
      });
      
      saveToHistory(newNodes, edges);
      return newNodes;
    });
    
    message.success('节点属性已更新');
  }, [selectedNode, setNodes, edges, saveToHistory]);
  
  // 更新边属性
  const updateEdgeProperties = useCallback((values: any) => {
    if (!selectedEdge) return;
    
    setEdges(eds => {
      const newEdges = eds.map(edge => {
        if (edge.id === selectedEdge.id) {
          return {
            ...edge,
            data: {
              ...edge.data,
              label: values.label,
              condition: values.condition,
              animated: values.animated
            }
          };
        }
        return edge;
      });
      
      saveToHistory(nodes, newEdges);
      return newEdges;
    });
    
    message.success('连接属性已更新');
  }, [selectedEdge, setEdges, nodes, saveToHistory]);
  
  // 撤销操作
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const historyState = history[newIndex];
      
      setNodes(historyState.nodes);
      setEdges(historyState.edges);
      setHistoryIndex(newIndex);
    }
  }, [history, historyIndex, setNodes, setEdges]);
  
  // 重做操作
  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      const historyState = history[newIndex];
      
      setNodes(historyState.nodes);
      setEdges(historyState.edges);
      setHistoryIndex(newIndex);
    }
  }, [history, historyIndex, setNodes, setEdges]);
  
  // 导出工作流
  const exportWorkflow = useCallback(() => {
    try {
      // 转换节点和边为工作流格式
      const workflowData = {
        id: globalState.selectedWorkflow?.id || `workflow-${Date.now()}`,
        name: workflowName,
        description: workflowDescription,
        version: '1.0.0',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        author: 'EFIAgent用户',
        tags: [],
        nodes: nodes.map(node => ({
          id: node.id,
          type: node.data.isStartNode ? 'start' : node.data.isEndNode ? 'end' : node.data.isErrorNode ? 'error_handler' : node.data.isConditionNode ? 'condition' : 'agent',
          name: node.data.label,
          description: node.data.description,
          position: node.position,
          agent_id: node.data.agentId,
          agent_type: node.data.agentType,
          config: node.data.config
        })),
        edges: edges.map(edge => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          label: edge.data?.label,
          condition: edge.data?.condition
        })),
        settings: {
          execution: {
            timeout: 3600,
            retry_count: 3,
            retry_delay: 60,
            parallel_execution: true,
            max_parallel_nodes: 3
          },
          notification: {
            on_start: false,
            on_complete: true,
            on_error: true,
            channels: ['email']
          },
          logging: {
            level: 'info',
            include_input: true,
            include_output: true,
            retention_days: 30
          }
        }
      };
      
      // 创建下载链接
      const dataStr = JSON.stringify(workflowData, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `${workflowName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      
      message.success('工作流已导出');
    } catch (error) {
      console.error('导出工作流失败:', error);
      message.error('导出工作流失败');
    }
  }, [nodes, edges, workflowName, workflowDescription, globalState.selectedWorkflow]);
  
  // 导入工作流
  const importWorkflow = useCallback(() => {
    // 创建文件输入元素
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json';
    fileInput.onchange = (event: any) => {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e: any) => {
          try {
            const workflowData = JSON.parse(e.target.result);
            
            // 设置工作流名称和描述
            setWorkflowName(workflowData.name || '导入的工作流');
            setWorkflowDescription(workflowData.description || '从文件导入的工作流');
            
            // 转换节点
            const importedNodes = workflowData.nodes.map((node: any) => ({
              id: node.id,
              type: 'custom',
              data: {
                label: node.name,
                description: node.description,
                agentId: node.agent_id,
                agentType: node.agent_type,
                config: node.config,
                isStartNode: node.type === 'start',
                isEndNode: node.type === 'end',
                isErrorNode: node.type === 'error_handler',
                isConditionNode: node.type === 'condition'
              },
              position: node.position
            }));
            
            // 转换边
            const importedEdges = (workflowData.edges || []).map((edge: any) => ({
              id: edge.id,
              source: edge.source,
              target: edge.target,
              sourceHandle: edge.sourceHandle,
              targetHandle: edge.targetHandle,
              type: 'custom',
              data: {
                label: edge.label,
                condition: edge.condition,
                animated: true
              },
              markerEnd: {
                type: MarkerType.ArrowClosed,
                width: 20,
                height: 20
              }
            }));
            
            setNodes(importedNodes);
            setEdges(importedEdges);
            
            // 更新历史记录
            setHistory([{nodes: importedNodes, edges: importedEdges}]);
            setHistoryIndex(0);
            
            message.success('工作流已导入');
          } catch (error) {
            console.error('导入工作流失败:', error);
            message.error('导入工作流失败: 无效的工作流文件');
          }
        };
        reader.readAsText(file);
      }
    };
    fileInput.click();
  }, [setNodes, setEdges]);
  
  // 处理拖拽开始
  const onDragStart = useCallback((nodeType: string) => {
    setDraggedNodeType(nodeType);
  }, []);
  
  // 处理拖拽结束
  const onDragEnd = useCallback(() => {
    setDraggedNodeType(null);
  }, []);
  
  // 处理画布拖拽放置
  const onDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    
    console.log('Drop event triggered');
    
    // 获取节点类型
    const nodeType = event.dataTransfer.getData('application/reactflow') || draggedNodeType;
    console.log('Node type:', nodeType);
    
    if (!nodeType) {
      console.log('No node type found');
      return;
    }
    
    // 获取ReactFlow容器的边界
    const reactFlowWrapper = event.currentTarget as HTMLElement;
    const bounds = reactFlowWrapper.getBoundingClientRect();
    console.log('ReactFlow bounds:', bounds);
    
    // 计算相对于ReactFlow容器的位置
    const position = {
      x: event.clientX - bounds.left - 75, // 减去节点宽度的一半
      y: event.clientY - bounds.top - 25   // 减去节点高度的一半
    };
    
    console.log('Adding node at position:', position);
    addNewNodeAtPosition(nodeType, position);
    setDraggedNodeType(null);
  }, [draggedNodeType, addNewNodeAtPosition]);
  
  // 处理画布拖拽悬停
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    console.log('Drag over canvas');
  }, []);
  
  // 执行工作流
  const executeWorkflow = useCallback(() => {
    // 验证工作流
    if (nodes.length === 0) {
      message.warning('工作流为空，请先添加节点');
      return;
    }
    
    const startNodes = nodes.filter(node => node.data.isStartNode);
    if (startNodes.length === 0) {
      message.warning('工作流缺少开始节点，请添加开始节点');
      return;
    }
    
    if (startNodes.length > 1) {
      message.warning('工作流只能有一个开始节点');
      return;
    }
    
    const endNodes = nodes.filter(node => node.data.isEndNode);
    if (endNodes.length === 0) {
      message.warning('工作流缺少结束节点，请添加结束节点');
      return;
    }
    
    // 创建工作流对象
    const workflow: Workflow = {
      id: globalState.selectedWorkflow?.id || `workflow-${Date.now()}`,
      name: workflowName,
      description: workflowDescription,
      status: WorkflowStatus.DRAFT,
      agents: [], // 初始化为空数组，实际应用中应该从节点中提取agent配置
      nodes: nodes.map(node => ({
        id: node.id,
        type: node.data.isStartNode ? 'start' : node.data.isEndNode ? 'end' : node.data.isErrorNode ? 'error_handler' : node.data.isConditionNode ? 'condition' : 'agent',
        name: node.data.label,
        description: node.data.description,
        position: node.position,
        agent_id: node.data.agentId,
        agent_type: node.data.agentType,
        config: node.data.config
      })),
      connections: edges.map(edge => ({
        id: edge.id,
        sourceId: edge.source,
        targetId: edge.target,
        label: edge.data?.label,
        condition: edge.data?.condition
      })),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    setCurrentWorkflow(workflow);
    setExecutionEngineVisible(true);
  }, [nodes, edges, workflowName, workflowDescription, globalState.selectedWorkflow]);
  
  // 验证工作流
  const validateWorkflow = useCallback(() => {
    const errors: string[] = [];
    
    // 检查节点
    if (nodes.length === 0) {
      errors.push('工作流为空');
    }
    
    const startNodes = nodes.filter(node => node.data.isStartNode);
    if (startNodes.length === 0) {
      errors.push('缺少开始节点');
    } else if (startNodes.length > 1) {
      errors.push('只能有一个开始节点');
    }
    
    const endNodes = nodes.filter(node => node.data.isEndNode);
    if (endNodes.length === 0) {
      errors.push('缺少结束节点');
    }
    
    // 检查连接
    const nodeIds = new Set(nodes.map(n => n.id));
    const invalidEdges = edges.filter(edge => 
      !nodeIds.has(edge.source) || !nodeIds.has(edge.target)
    );
    
    if (invalidEdges.length > 0) {
      errors.push('存在无效的连接');
    }
    
    // 检查孤立节点
    const connectedNodes = new Set();
    edges.forEach(edge => {
      connectedNodes.add(edge.source);
      connectedNodes.add(edge.target);
    });
    
    const isolatedNodes = nodes.filter(node => 
      !connectedNodes.has(node.id) && !node.data.isStartNode && !node.data.isEndNode
    );
    
    if (isolatedNodes.length > 0) {
      errors.push(`存在 ${isolatedNodes.length} 个孤立节点`);
    }
    
    if (errors.length > 0) {
      Modal.warning({
        title: '工作流验证失败',
        content: (
          <div>
            <p>发现以下问题：</p>
            <ul>
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )
      });
      return false;
    }
    
    message.success('工作流验证通过');
    return true;
  }, [nodes, edges]);
  
  // 渲染属性面板内容
  const renderPropertiesPanel = () => {
    if (selectedNode) {
      return (
        <Form
          form={propertiesForm}
          layout="vertical"
          onFinish={updateNodeProperties}
        >
          <Form.Item name="id" label="节点ID">
            <Input disabled />
          </Form.Item>
          
          <Form.Item name="label" label="名称" rules={[{ required: true, message: '请输入节点名称' }]}>
            <Input />
          </Form.Item>
          
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={3} />
          </Form.Item>
          
          <Collapse defaultActiveKey={['basic']}>
            <Collapse.Panel header="基本属性" key="basic">
              <Form.Item name="isStartNode" valuePropName="checked" label="开始节点">
                <Switch />
              </Form.Item>
              
              <Form.Item name="isEndNode" valuePropName="checked" label="结束节点">
                <Switch />
              </Form.Item>
              
              <Form.Item name="isErrorNode" valuePropName="checked" label="错误处理节点">
                <Switch />
              </Form.Item>
              
              <Form.Item name="isConditionNode" valuePropName="checked" label="条件节点">
                <Switch />
              </Form.Item>
              
              {propertiesForm.getFieldValue('isConditionNode') && (
                <Form.Item name="condition" label="条件表达式">
                  <Input.TextArea rows={3} placeholder="${source.output.value} > 10" />
                </Form.Item>
              )}
            </Collapse.Panel>
            
            <Collapse.Panel header="Agent属性" key="agent">
              <Form.Item name="agentType" label="Agent类型">
                <Select>
                  <Select.Option value={AgentType.PLANNING}>规划Agent</Select.Option>
                  <Select.Option value={AgentType.EXECUTION}>执行Agent</Select.Option>
                  <Select.Option value={AgentType.AUDIT}>审计Agent</Select.Option>
                  <Select.Option value={AgentType.MEMORY}>记忆Agent</Select.Option>
                </Select>
              </Form.Item>
            </Collapse.Panel>
          </Collapse>
          
          <div style={{ marginTop: '20px', textAlign: 'right' }}>
            <Button type="primary" htmlType="submit">
              更新属性
            </Button>
          </div>
        </Form>
      );
    } else if (selectedEdge) {
      return (
        <Form
          form={propertiesForm}
          layout="vertical"
          onFinish={updateEdgeProperties}
        >
          <Form.Item name="id" label="连接ID">
            <Input disabled />
          </Form.Item>
          
          <Form.Item name="label" label="标签">
            <Input />
          </Form.Item>
          
          <Form.Item name="condition" label="条件表达式">
            <Input.TextArea rows={3} placeholder="${source.output.value} > 10" />
          </Form.Item>
          
          <Form.Item name="animated" valuePropName="checked" label="动画效果">
            <Switch />
          </Form.Item>
          
          <div style={{ marginTop: '20px', textAlign: 'right' }}>
            <Button type="primary" htmlType="submit">
              更新属性
            </Button>
          </div>
        </Form>
      );
    }
    
    return (
      <div className="empty-properties">
        <InfoCircleOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
        <p>请选择一个节点或连接来查看和编辑其属性</p>
      </div>
    );
  };
  
  return (
    <div className="workflow-designer">
      {isLoading && (
        <div className="loading-overlay">
          <Spin size="large" tip="加载中..." />
        </div>
      )}
      
      <div className="workflow-header">
        <div className="workflow-title">
          <h2>{workflowName}</h2>
          <p>{workflowDescription}</p>
        </div>
      </div>
      
      <div className="workflow-toolbar">
        <div className="toolbar-group">
          <Tooltip title="撤销">
            <Button 
              icon={<UndoOutlined />} 
              onClick={undo}
              disabled={historyIndex <= 0}
            />
          </Tooltip>
          <Tooltip title="重做">
            <Button 
              icon={<RedoOutlined />} 
              onClick={redo}
              disabled={historyIndex >= history.length - 1}
            />
          </Tooltip>
        </div>
        
        <Divider type="vertical" />
        
        <div className="toolbar-group">
          <Tooltip title="添加开始节点">
            <Button 
              type="primary" 
              onClick={() => addNewNode('start')}
            >
              开始
            </Button>
          </Tooltip>
          <Tooltip title="添加结束节点">
            <Button 
              type="primary" 
              onClick={() => addNewNode('end')}
            >
              结束
            </Button>
          </Tooltip>
          <Tooltip title="添加条件节点">
            <Button 
              onClick={() => addNewNode('condition')}
            >
              条件
            </Button>
          </Tooltip>
          <Tooltip title="添加错误处理节点">
            <Button 
              danger 
              onClick={() => addNewNode('error')}
            >
              错误处理
            </Button>
          </Tooltip>
        </div>
        
        <Divider type="vertical" />
        
        <div className="toolbar-group">
          <Tooltip title="添加规划Agent">
            <Button 
              onClick={() => addNewNode('planning')}
            >
              规划Agent
            </Button>
          </Tooltip>
          <Tooltip title="添加执行Agent">
            <Button 
              onClick={() => addNewNode('execution')}
            >
              执行Agent
            </Button>
          </Tooltip>
          <Tooltip title="添加审计Agent">
            <Button 
              onClick={() => addNewNode('audit')}
            >
              审计Agent
            </Button>
          </Tooltip>
          <Tooltip title="添加记忆Agent">
            <Button 
              onClick={() => addNewNode('memory')}
            >
              记忆Agent
            </Button>
          </Tooltip>
        </div>
        
        <Divider type="vertical" />
        
        <div className="toolbar-group">
          <Tooltip title="删除选中">
            <Button 
              danger 
              icon={<DeleteOutlined />} 
              onClick={deleteSelected}
              disabled={selectedElements.length === 0}
            />
          </Tooltip>
        </div>
        
        <div className="toolbar-spacer"></div>
        
        <div className="toolbar-group">
          <Tooltip title="验证工作流">
            <Button 
              icon={<InfoCircleOutlined />} 
              onClick={validateWorkflow}
            >
              验证
            </Button>
          </Tooltip>
          <Tooltip title="执行工作流">
            <Button 
              type="primary"
              icon={<PlayCircleOutlined />} 
              onClick={executeWorkflow}
            >
              执行
            </Button>
          </Tooltip>
          
          <Tooltip title={nodePaletteVisible ? '隐藏节点库' : '显示节点库'}>
            <Button 
              icon={<AppstoreOutlined />}
              onClick={() => setNodePaletteVisible(!nodePaletteVisible)}
            >
              节点库
            </Button>
          </Tooltip>
        </div>
        
        <Divider type="vertical" />
        
        <div className="toolbar-group">
          <Tooltip title="导入工作流">
            <Button 
              icon={<ImportOutlined />} 
              onClick={importWorkflow}
            />
          </Tooltip>
          <Tooltip title="导出工作流">
            <Button 
              icon={<ExportOutlined />} 
              onClick={exportWorkflow}
            />
          </Tooltip>
          <Tooltip title="保存工作流">
            <Button 
              type="primary" 
              icon={<SaveOutlined />} 
              onClick={saveWorkflow}
            >
              保存
            </Button>
          </Tooltip>
        </div>
      </div>
      
      <div className="workflow-content">
         {/* 节点库 */}
         <div className={`node-palette-container ${!nodePaletteVisible ? 'hidden' : ''}`}>
           <NodePalette
             onDragStart={onDragStart}
             onDragEnd={onDragEnd}
             onAddNode={addNewNode}
           />
         </div>
         
          <div className="workflow-container">
          <ReactFlowProvider>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={handleNodesChange}
              onEdgesChange={handleEdgesChange}
              onConnect={onConnect}
              onSelectionChange={onSelectionChange}
              onDrop={onDrop}
              onDragOver={onDragOver}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              deleteKeyCode={['Backspace', 'Delete']}
              multiSelectionKeyCode={['Control', 'Meta']}
              snapToGrid
              snapGrid={[15, 15]}
              defaultViewport={{ x: 0, y: 0, zoom: 1 }}
              minZoom={0.2}
              maxZoom={4}
              attributionPosition="bottom-right"
              connectionLineType={ConnectionLineType.SmoothStep}
              connectionLineStyle={{ stroke: '#1890ff' }}
              fitView
            >
              <Controls />
              <Background color="#aaa" gap={16} />
              <MiniMap
                nodeStrokeColor={(n) => {
                  if (n.selected) return '#ff0072';
                  return '#eee';
                }}
                nodeColor={(n) => {
                  if (n.selected) return '#ff0072';
                  return '#fff';
                }}
              />
              <Panel position="top-right">
                <Button
                  type="primary"
                  onClick={() => setPropertiesVisible(!propertiesVisible)}
                  icon={<SettingOutlined />}
                >
                  属性面板
                </Button>
              </Panel>
            </ReactFlow>
          </ReactFlowProvider>
        </div>
        
        <Drawer
          title="属性面板"
          placement="right"
          closable={true}
          onClose={() => setPropertiesVisible(false)}
          open={propertiesVisible}
          width={350}
        >
          {renderPropertiesPanel()}
        </Drawer>
      </div>
      
      <Modal
        title="保存工作流"
        open={saveModalVisible}
        onOk={confirmSaveWorkflow}
        onCancel={() => setSaveModalVisible(false)}
        confirmLoading={isLoading}
      >
        <Form layout="vertical">
          <Form.Item label="工作流名称" required>
            <Input 
              value={workflowName} 
              onChange={e => setWorkflowName(e.target.value)} 
              placeholder="请输入工作流名称"
            />
          </Form.Item>
          <Form.Item label="工作流描述">
            <Input.TextArea 
              value={workflowDescription} 
              onChange={e => setWorkflowDescription(e.target.value)} 
              placeholder="请输入工作流描述"
              rows={4}
            />
          </Form.Item>
        </Form>
        </Modal>
        
        {/* 工作流执行引擎 */}
        <WorkflowEngine
          visible={executionEngineVisible}
          workflow={currentWorkflow}
          onClose={() => {
            setExecutionEngineVisible(false);
            setCurrentWorkflow(null);
          }}
          onExecutionComplete={(execution) => {
            console.log('工作流执行完成:', execution);
            message.success('工作流执行完成');
          }}
        />
      </div>
    );
  };
  
  export default WorkflowDesigner;
