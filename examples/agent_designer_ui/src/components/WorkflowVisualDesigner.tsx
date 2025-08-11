/**
 * EFIAgent 2.0 工作流可视化设计器
 * 基于三层架构的拖拽式工作流设计组件
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  Card, Button, Space, Drawer, Tabs, List, Input, Select, Tag, Tooltip,
  Modal, message, Popover, Dropdown, Menu, Divider, Alert, Progress,
  Row, Col, Typography, Badge, Switch, Slider, InputNumber, Form,
  Tree, Collapse, Steps, Timeline, Descriptions, Table, Upload,
  AutoComplete, Cascader, DatePicker, TimePicker, ColorPicker,
  Checkbox, Radio, Rate, Mentions, Transfer, TreeSelect
} from 'antd';
import {
  PlusOutlined, DeleteOutlined, EditOutlined, CopyOutlined,
  SaveOutlined, PlayCircleOutlined, PauseCircleOutlined, StopOutlined,
  ReloadOutlined, SettingOutlined, EyeOutlined, DownloadOutlined,
  UploadOutlined, ShareAltOutlined, FullscreenOutlined, CompressOutlined,
  ZoomInOutlined, ZoomOutOutlined, DragOutlined, LinkOutlined,
  DisconnectOutlined, BranchesOutlined, NodeIndexOutlined,
  FunctionOutlined, ApiOutlined, DatabaseOutlined, CloudOutlined,
  ThunderboltOutlined, BugOutlined, InfoCircleOutlined,
  CheckCircleOutlined, ExclamationCircleOutlined, CloseCircleOutlined,
  QuestionCircleOutlined, BulbOutlined, RocketOutlined, CodeOutlined,
  FileTextOutlined, FolderOutlined, SearchOutlined, FilterOutlined,
  SortAscendingOutlined, MenuOutlined,
  UnorderedListOutlined, TableOutlined, BarChartOutlined,
  ImportOutlined, PartitionOutlined, ClearOutlined, MoreOutlined,
  MonitorOutlined
} from '@ant-design/icons';
import {
  WorkflowNode,
  WorkflowEdge,
  CoreCapabilityModule,
  Agent2_0,
  WorkflowExecution,
  CapabilityOrchestrationMode
} from './CapabilitySystemTypes';
import { WorkflowDefinition } from './CapabilitySystemTypes';
import { useWorkflowState, useWorkflowOperations } from './WorkflowStateManager';
import WorkflowNodeEditor from './WorkflowNodeEditor';
import { WorkflowExecutionEngine, DefaultCapabilityExecutor, DefaultAgentExecutor, ExecutionStrategy } from './WorkflowExecutionEngine';
// 移除EnhancedNodeLibrary导入
import { WorkflowValidator } from './WorkflowValidator';
import WorkflowDebugger from './WorkflowDebugger';
import WorkflowMonitor from './WorkflowMonitor';
import { WorkflowConnectionManager } from './WorkflowConnectionManager';
import { WorkflowVersionControl } from './WorkflowVersionControl';
import { WorkflowImportExport } from './WorkflowImportExport';
import { generateMockCapabilities, generateMockAgents } from '../data/mockData';
import './WorkflowVisualDesigner.css';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { TabPane } = Tabs;
const { Panel } = Collapse;
const { Step } = Steps;
const { Option } = Select;
const { SubMenu } = Menu;

/**
 * 画布配置接口
 */
interface CanvasConfig {
  width: number;
  height: number;
  scale: number;
  offsetX: number;
  offsetY: number;
  gridSize: number;
  showGrid: boolean;
  snapToGrid: boolean;
}

/**
 * 选择状态接口
 */
interface SelectionState {
  selectedNodes: Set<string>;
  selectedEdges: Set<string>;
  selectionBox?: {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
  };
}

/**
 * 拖拽状态接口
 */
interface DragState {
  isDragging: boolean;
  dragType: 'node' | 'edge' | 'canvas' | 'selection' | null;
  dragData?: any;
  startPosition?: { x: number; y: number };
  currentPosition?: { x: number; y: number };
}

/**
 * 工具栏配置接口
 */
interface ToolbarConfig {
  showMinimap: boolean;
  showProperties: boolean;
  showLibrary: boolean;
  showHistory: boolean;
  autoSave: boolean;
  gridSnap: boolean;
}

/**
 * 工作流可视化设计器属性接口
 */
interface WorkflowVisualDesignerProps {
  workflow?: WorkflowDefinition;
  onSave?: (workflow: WorkflowDefinition) => void;
  onExecute?: (workflow: WorkflowDefinition) => void;
  onWorkflowChange?: (workflow: WorkflowDefinition) => void;
  onNodeSelect?: (node: WorkflowNode | null) => void;
  capabilities?: CoreCapabilityModule[];
  availableAgents?: Agent2_0[];
  readonly?: boolean;
}

/**
 * 工作流可视化设计器组件
 */
const WorkflowVisualDesigner: React.FC<WorkflowVisualDesignerProps> = ({
  workflow: initialWorkflow,
  onSave,
  onExecute,
  onWorkflowChange,
  onNodeSelect,
  capabilities = [],
  availableAgents = [],
  readonly = false
}) => {
  // 初始化模拟数据
  const [mockCapabilities] = useState<CoreCapabilityModule[]>(() => {
    return capabilities.length > 0 ? capabilities : generateMockCapabilities();
  });
  
  const [mockAgents] = useState<Agent2_0[]>(() => {
    return availableAgents.length > 0 ? availableAgents : generateMockAgents();
  });
  // 状态管理
  const { state } = useWorkflowState();
  const operations = useWorkflowOperations();
  
  // 工作流状态
  const [workflow, setWorkflow] = useState<WorkflowDefinition>(
    initialWorkflow || {
      id: `workflow_${Date.now()}`,
      name: '新建工作流',
      description: '',
      version: '1.0.0',
      nodes: [],
      edges: [],
      variables: [],
      triggers: [],
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        author: 'EFIAgent Designer',
        tags: [],
        category: 'general',
        status: 'draft' as const,
        permissions: {
          read: ['*'],
          write: ['admin'],
          execute: ['user']
        }
      },
      orchestrationConfig: {
        mode: CapabilityOrchestrationMode.SEQUENTIAL,
        timeout: 300000,
        retryPolicy: {
          maxRetries: 3,
          backoffStrategy: 'exponential',
          initialDelay: 1000,
          maxDelay: 30000,
          retryableErrors: []
        },
        errorHandling: 'stop'
      }
    }
  );

  // Handle workflow changes
  const handleWorkflowChange = useCallback((newWorkflow: WorkflowDefinition) => {
    setWorkflow(newWorkflow);
    if (onWorkflowChange) {
      onWorkflowChange(newWorkflow);
    }
  }, [onWorkflowChange]);
  
  // 画布状态
  const [canvasConfig, setCanvasConfig] = useState<CanvasConfig>({
    width: 2000,
    height: 1500,
    scale: 1,
    offsetX: 0,
    offsetY: 0,
    gridSize: 20,
    showGrid: true,
    snapToGrid: true
  });
  
  // 选择状态
  const [selection, setSelection] = useState<SelectionState>({
    selectedNodes: new Set(),
    selectedEdges: new Set()
  });
  
  // 拖拽状态
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    dragType: null
  });
  
  // 工具栏状态
  const [toolbarConfig] = useState<ToolbarConfig>({
    showMinimap: true,
    showProperties: true,
    showLibrary: true,
    showHistory: false,
    autoSave: true,
    gridSnap: true
  });
  
  // UI状态
  const [nodeEditorVisible, setNodeEditorVisible] = useState<boolean>(false);
  const [editingNode, setEditingNode] = useState<WorkflowNode | null>(null);
  const [executionEngine] = useState(() => new WorkflowExecutionEngine(
    new DefaultCapabilityExecutor(),
    new DefaultAgentExecutor(),
    {} as any // 简化的编排器
  ));
  const [currentExecution] = useState<WorkflowExecution | null>(null);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  
  // 新功能模块状态
  // 移除节点库状态变量
  const [debuggerVisible, setDebuggerVisible] = useState<boolean>(false);
  const [monitorVisible, setMonitorVisible] = useState<boolean>(false);
  const [validationErrors, setValidationErrors] = useState<any[]>([]);
  const [importExportVisible, setImportExportVisible] = useState<boolean>(false);
  const [versionControlVisible, setVersionControlVisible] = useState<boolean>(false);
  
  // 功能模块实例
  const [validator] = useState(() => new WorkflowValidator());
  const [connectionManager] = useState(() => new WorkflowConnectionManager());
  const [versionControl] = useState(() => new WorkflowVersionControl());
  const [importExport] = useState(() => new WorkflowImportExport());
  
  // 引用
  const canvasRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  
  /**
   * 画布坐标转换
   */
  const screenToCanvas = useCallback((screenX: number, screenY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    const x = (screenX - rect.left - canvasConfig.offsetX) / canvasConfig.scale;
    const y = (screenY - rect.top - canvasConfig.offsetY) / canvasConfig.scale;
    
    return { x, y };
  }, [canvasConfig]);
  
  const canvasToScreen = useCallback((canvasX: number, canvasY: number) => {
    return {
      x: canvasX * canvasConfig.scale + canvasConfig.offsetX,
      y: canvasY * canvasConfig.scale + canvasConfig.offsetY
    };
  }, [canvasConfig]);
  
  /**
   * 网格对齐
   */
  const snapToGrid = useCallback((x: number, y: number) => {
    if (!canvasConfig.snapToGrid) return { x, y };
    
    const gridSize = canvasConfig.gridSize;
    return {
      x: Math.round(x / gridSize) * gridSize,
      y: Math.round(y / gridSize) * gridSize
    };
  }, [canvasConfig]);
  
  /**
   * 添加节点
   */
  const addNode = useCallback((type: 'capability' | 'condition' | 'start' | 'end', position: { x: number; y: number }) => {
    const newNode: WorkflowNode = {
      id: `node_${Date.now()}`,
      type,
      name: `${type}节点`,
      description: '',
      position: snapToGrid(position.x, position.y),
      size: { width: 200, height: 80 },
      inputs: [],
      outputs: [],
      config: {},
      status: 'idle'
    };
    
    const newWorkflow = {
      ...workflow,
      nodes: [...workflow.nodes, newNode],
      metadata: {
        ...workflow.metadata,
        updatedAt: new Date()
      }
    };
    
    handleWorkflowChange(newWorkflow);
    
    // 选中新节点
    setSelection(prev => ({
      ...prev,
      selectedNodes: new Set([newNode.id]),
      selectedEdges: new Set()
    }));
    
    message.success('节点添加成功');
  }, [snapToGrid, workflow, handleWorkflowChange]);
  
  /**
   * 删除节点
   */
  const deleteNode = useCallback((nodeId: string) => {
    const newWorkflow = {
      ...workflow,
      nodes: workflow.nodes.filter((node: WorkflowNode) => node.id !== nodeId),
      edges: workflow.edges.filter((edge: WorkflowEdge) => edge.sourceNodeId !== nodeId && edge.targetNodeId !== nodeId),
      metadata: {
        ...workflow.metadata,
        updatedAt: new Date()
      }
    };
    
    handleWorkflowChange(newWorkflow);
    
    // 清除选择
    setSelection(prev => ({
      ...prev,
      selectedNodes: new Set(Array.from(prev.selectedNodes).filter(id => id !== nodeId))
    }));
    
    message.success('节点删除成功');
  }, [workflow, handleWorkflowChange]);
  
  /**
   * 更新节点
   */
  const updateNode = useCallback((nodeId: string, updates: Partial<WorkflowNode>) => {
    const newWorkflow = {
      ...workflow,
      nodes: workflow.nodes.map((node: WorkflowNode) =>
        node.id === nodeId ? { ...node, ...updates } : node
      ),
      metadata: {
        ...workflow.metadata,
        updatedAt: new Date()
      }
    };
    
    handleWorkflowChange(newWorkflow);
  }, [workflow, handleWorkflowChange]);
  
  /**
   * 添加连接
   */
  // const addEdge = useCallback((sourceId: string, targetId: string, sourcePort?: string, targetPort?: string) => {
  //   // 检查是否已存在连接
  //   const existingEdge = workflow.edges.find(
  //     (edge: WorkflowEdge) => edge.sourceNodeId === sourceId && edge.targetNodeId === targetId
  //   );
  //   
  //   if (existingEdge) {
  //     message.warning('连接已存在');
  //     return;
  //   }
  //   
  //   // 检查是否会形成循环
  //   if (wouldCreateCycle(sourceId, targetId, workflow.edges)) {
  //     message.error('无法创建连接：会形成循环依赖');
  //     return;
  //   }
  //   
  //   const newEdge: WorkflowEdge = {
  //     id: `edge_${Date.now()}`,
  //     sourceNodeId: sourceId,
  //     sourceOutputId: sourcePort || 'output',
  //     targetNodeId: targetId,
  //     targetInputId: targetPort || 'input'
  //   };
  //   
  //   const newWorkflow = {
  //     ...workflow,
  //     edges: [...workflow.edges, newEdge],
  //     metadata: {
  //       ...workflow.metadata,
  //       updatedAt: new Date()
  //     }
  //   };
  //   
  //   handleWorkflowChange(newWorkflow);
  //   
  //   message.success('连接创建成功');
  // }, [workflow, handleWorkflowChange]);
  
  /**
   * 删除连接
   */
  const deleteEdge = useCallback((edgeId: string) => {
    const newWorkflow = {
      ...workflow,
      edges: workflow.edges.filter((edge: WorkflowEdge) => edge.id !== edgeId),
      metadata: {
        ...workflow.metadata,
        updatedAt: new Date()
      }
    };
    
    handleWorkflowChange(newWorkflow);
    
    // 清除选择
    setSelection(prev => ({
      ...prev,
      selectedEdges: new Set(Array.from(prev.selectedEdges).filter((id: string) => id !== edgeId))
    }));
    
    message.success('连接删除成功');
  }, [workflow, handleWorkflowChange]);
  
  /**
   * 检查是否会形成循环
   */
  const wouldCreateCycle = (sourceId: string, targetId: string, edges: WorkflowEdge[]): boolean => {
    const graph = new Map<string, string[]>();
    
    // 构建图
    for (const edge of edges) {
      if (!graph.has(edge.sourceNodeId)) {
        graph.set(edge.sourceNodeId, []);
      }
      graph.get(edge.sourceNodeId)!.push(edge.targetNodeId);
    }
    
    // 添加新边
    if (!graph.has(sourceId)) {
      graph.set(sourceId, []);
    }
    graph.get(sourceId)!.push(targetId);
    
    // DFS检查循环
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    
    const dfs = (nodeId: string): boolean => {
      visited.add(nodeId);
      recursionStack.add(nodeId);
      
      const neighbors = graph.get(nodeId) || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          if (dfs(neighbor)) {
            return true;
          }
        } else if (recursionStack.has(neighbor)) {
          return true;
        }
      }
      
      recursionStack.delete(nodeId);
      return false;
    };
    
    return dfs(sourceId);
  };
  
  /**
   * 执行工作流
   */
  const executeWorkflow = useCallback(async () => {
    if (workflow.nodes.length === 0) {
      message.warning('工作流为空，无法执行');
      return;
    }
    
    setIsExecuting(true);
    
    try {
      const execution = await executionEngine.executeWorkflow(workflow, {}, {
        strategy: ExecutionStrategy.SEQUENTIAL,
        timeout: 300000,
        monitoring: {
          enableMetrics: true,
          enableLogging: true,
          logLevel: 'info'
        }
      });
      
      setCurrentExecution(execution);
      message.success('工作流执行完成');
    } catch (error) {
      console.error('工作流执行失败:', error);
      message.error(`工作流执行失败: ${(error as Error).message}`);
    } finally {
      setIsExecuting(false);
    }
  }, [workflow, executionEngine]);
  
  /**
   * 保存工作流
   */
  const saveWorkflow = useCallback(() => {
    if (onSave) {
      onSave(workflow);
      message.success('工作流保存成功');
    }
  }, [workflow, onSave]);
  
  /**
   * 缩放控制
   */
  const zoomIn = useCallback(() => {
    setCanvasConfig(prev => ({
      ...prev,
      scale: Math.min(prev.scale * 1.2, 3)
    }));
  }, []);
  
  const zoomOut = useCallback(() => {
    setCanvasConfig(prev => ({
      ...prev,
      scale: Math.max(prev.scale / 1.2, 0.1)
    }));
  }, []);
  
  const resetZoom = useCallback(() => {
    setCanvasConfig(prev => ({
      ...prev,
      scale: 1,
      offsetX: 0,
      offsetY: 0
    }));
  }, []);
  
  /**
   * 鼠标事件处理
   */
  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    const { x, y } = screenToCanvas(event.clientX, event.clientY);
    
    // 检查是否点击在节点上
    const clickedNode = workflow.nodes.find((node: WorkflowNode) => {
      const nodeX = node.position.x;
      const nodeY = node.position.y;
      const nodeWidth = node.size?.width || 200;
      const nodeHeight = node.size?.height || 80;
      
      return x >= nodeX && x <= nodeX + nodeWidth && y >= nodeY && y <= nodeY + nodeHeight;
    });
    
    if (clickedNode) {
      // 节点拖拽
      setDragState({
        isDragging: true,
        dragType: 'node',
        dragData: clickedNode.id,
        startPosition: { x, y },
        currentPosition: { x, y }
      });
      
      // 选中节点
      if (!event.ctrlKey && !event.metaKey) {
        setSelection({
          selectedNodes: new Set([clickedNode.id]),
          selectedEdges: new Set()
        });
      } else {
        setSelection(prev => {
          const newSelected = new Set(prev.selectedNodes);
          if (newSelected.has(clickedNode.id)) {
            newSelected.delete(clickedNode.id);
          } else {
            newSelected.add(clickedNode.id);
          }
          return {
            ...prev,
            selectedNodes: newSelected
          };
        });
      }
    } else {
      // 画布拖拽或框选
      if (event.shiftKey) {
        // 框选模式
        setDragState({
          isDragging: true,
          dragType: 'selection',
          startPosition: { x, y },
          currentPosition: { x, y }
        });
        
        setSelection(prev => ({
          ...prev,
          selectionBox: {
            startX: x,
            startY: y,
            endX: x,
            endY: y
          }
        }));
      } else {
        // 画布拖拽
        setDragState({
          isDragging: true,
          dragType: 'canvas',
          startPosition: { x: event.clientX, y: event.clientY }
        });
        
        // 清除选择
        setSelection({
          selectedNodes: new Set(),
          selectedEdges: new Set()
        });
      }
    }
  }, [workflow.nodes, screenToCanvas]);
  
  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    if (!dragState.isDragging) return;
    
    const { x, y } = screenToCanvas(event.clientX, event.clientY);
    
    setDragState(prev => ({
      ...prev,
      currentPosition: { x, y }
    }));
    
    if (dragState.dragType === 'node' && dragState.dragData) {
      // 节点拖拽
      const deltaX = x - (dragState.startPosition?.x || 0);
      const deltaY = y - (dragState.startPosition?.y || 0);
      
      updateNode(dragState.dragData, {
        position: snapToGrid(
          workflow.nodes.find((n: WorkflowNode) => n.id === dragState.dragData)!.position.x + deltaX,
        workflow.nodes.find((n: WorkflowNode) => n.id === dragState.dragData)!.position.y + deltaY
        )
      });
      
      setDragState(prev => ({
        ...prev,
        startPosition: { x, y }
      }));
    } else if (dragState.dragType === 'canvas') {
      // 画布拖拽
      const deltaX = event.clientX - (dragState.startPosition?.x || 0);
      const deltaY = event.clientY - (dragState.startPosition?.y || 0);
      
      setCanvasConfig(prev => ({
        ...prev,
        offsetX: prev.offsetX + deltaX,
        offsetY: prev.offsetY + deltaY
      }));
      
      setDragState(prev => ({
        ...prev,
        startPosition: { x: event.clientX, y: event.clientY }
      }));
    } else if (dragState.dragType === 'selection') {
      // 框选
      setSelection(prev => ({
        ...prev,
        selectionBox: {
          ...prev.selectionBox!,
          endX: x,
          endY: y
        }
      }));
    }
  }, [dragState, screenToCanvas, snapToGrid, updateNode, workflow.nodes]);
  
  const handleMouseUp = useCallback(() => {
    if (dragState.dragType === 'selection' && selection.selectionBox) {
      // 完成框选
      const { startX, startY, endX, endY } = selection.selectionBox;
      const minX = Math.min(startX, endX);
      const maxX = Math.max(startX, endX);
      const minY = Math.min(startY, endY);
      const maxY = Math.max(startY, endY);
      
      const selectedNodes = workflow.nodes.filter((node: WorkflowNode) => {
        const nodeX = node.position.x;
        const nodeY = node.position.y;
        const nodeWidth = node.size?.width || 200;
        const nodeHeight = node.size?.height || 80;
        
        return nodeX >= minX && nodeX + nodeWidth <= maxX &&
               nodeY >= minY && nodeY + nodeHeight <= maxY;
      }).map((node: WorkflowNode) => node.id);
      
      setSelection({
        selectedNodes: new Set(selectedNodes),
        selectedEdges: new Set()
      });
    }
    
    setDragState({
      isDragging: false,
      dragType: null
    });
  }, [dragState.dragType, selection.selectionBox, workflow.nodes]);
  
  /**
   * 双击事件处理
   */
  const handleDoubleClick = useCallback((event: React.MouseEvent) => {
    const { x, y } = screenToCanvas(event.clientX, event.clientY);
    
    // 检查是否双击在节点上
    const clickedNode = workflow.nodes.find((node: WorkflowNode) => {
      const nodeX = node.position.x;
      const nodeY = node.position.y;
      const nodeWidth = node.size?.width || 200;
      const nodeHeight = node.size?.height || 80;
      
      return x >= nodeX && x <= nodeX + nodeWidth && y >= nodeY && y <= nodeY + nodeHeight;
    });
    
    if (clickedNode) {
      // 编辑节点
      setEditingNode(clickedNode);
      setNodeEditorVisible(true);
    } else {
      // 在空白处双击，添加新节点
      addNode('capability', { x, y });
    }
  }, [workflow.nodes, screenToCanvas, addNode]);
  
  /**
   * 键盘事件处理
   */
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Delete' || event.key === 'Backspace') {
        // 删除选中的节点和连接
        selection.selectedNodes.forEach(nodeId => deleteNode(nodeId));
        selection.selectedEdges.forEach(edgeId => deleteEdge(edgeId));
      } else if (event.key === 'Escape') {
        // 清除选择
        setSelection({
          selectedNodes: new Set(),
          selectedEdges: new Set()
        });
      } else if (event.ctrlKey || event.metaKey) {
        if (event.key === 's') {
          event.preventDefault();
          saveWorkflow();
        } else if (event.key === 'z') {
          event.preventDefault();
          // TODO: 撤销操作
        } else if (event.key === 'y') {
          event.preventDefault();
          // TODO: 重做操作
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selection, deleteNode, deleteEdge, saveWorkflow]);
  
  /**
   * 渲染网格
   */
  const renderGrid = () => {
    if (!canvasConfig.showGrid) return null;
    
    const gridSize = canvasConfig.gridSize * canvasConfig.scale;
    const offsetX = canvasConfig.offsetX % gridSize;
    const offsetY = canvasConfig.offsetY % gridSize;
    
    const lines = [];
    
    // 垂直线
    for (let x = offsetX; x < canvasConfig.width; x += gridSize) {
      lines.push(
        <line
          key={`v-${x}`}
          x1={x}
          y1={0}
          x2={x}
          y2={canvasConfig.height}
          stroke="#f0f0f0"
          strokeWidth={0.5}
        />
      );
    }
    
    // 水平线
    for (let y = offsetY; y < canvasConfig.height; y += gridSize) {
      lines.push(
        <line
          key={`h-${y}`}
          x1={0}
          y1={y}
          x2={canvasConfig.width}
          y2={y}
          stroke="#f0f0f0"
          strokeWidth={0.5}
        />
      );
    }
    
    return <g className="grid">{lines}</g>;
  };
  
  /**
   * 渲染节点
   */
  const renderNode = (node: WorkflowNode) => {
    const isSelected = selection.selectedNodes.has(node.id);
    const screenPos = canvasToScreen(node.position.x, node.position.y);
    const width = (node.size?.width || 200) * canvasConfig.scale;
    const height = (node.size?.height || 80) * canvasConfig.scale;
    
    return (
      <g key={node.id} className={`node ${isSelected ? 'selected' : ''}`}>
        <rect
          x={screenPos.x}
          y={screenPos.y}
          width={width}
          height={height}
          rx={6}
          fill={getNodeColor(node.type)}
          stroke={isSelected ? '#1890ff' : '#d9d9d9'}
          strokeWidth={isSelected ? 2 : 1}
        />
        
        <text
          x={screenPos.x + width / 2}
          y={screenPos.y + height / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={12 * canvasConfig.scale}
          fill="#262626"
        >
          {node?.name || '未命名节点'}
        </text>
        
        {/* 状态指示器 */}
        <circle
          cx={screenPos.x + width - 10}
          cy={screenPos.y + 10}
          r={4}
          fill={getStatusColor(node.status || 'idle')}
        />
      </g>
    );
  };
  
  /**
   * 渲染连接
   */
  const renderEdge = (edge: WorkflowEdge) => {
    const sourceNode = workflow.nodes.find((n: WorkflowNode) => n.id === edge.sourceNodeId);
    const targetNode = workflow.nodes.find((n: WorkflowNode) => n.id === edge.targetNodeId);
    
    if (!sourceNode || !targetNode) return null;
    
    const sourcePos = canvasToScreen(
      sourceNode.position.x + (sourceNode.size?.width || 200),
      sourceNode.position.y + (sourceNode.size?.height || 80) / 2
    );
    
    const targetPos = canvasToScreen(
      targetNode.position.x,
      targetNode.position.y + (targetNode.size?.height || 80) / 2
    );
    
    const isSelected = selection.selectedEdges.has(edge.id);
    
    return (
      <g key={edge.id} className={`edge ${isSelected ? 'selected' : ''}`}>
        <path
          d={`M ${sourcePos.x} ${sourcePos.y} Q ${(sourcePos.x + targetPos.x) / 2} ${sourcePos.y} ${targetPos.x} ${targetPos.y}`}
          fill="none"
          stroke={isSelected ? '#1890ff' : '#8c8c8c'}
          strokeWidth={isSelected ? 2 : 1}
          markerEnd="url(#arrowhead)"
        />
      </g>
    );
  };
  
  /**
   * 渲染框选
   */
  const renderSelectionBox = () => {
    if (!selection.selectionBox) return null;
    
    const { startX, startY, endX, endY } = selection.selectionBox;
    const startPos = canvasToScreen(startX, startY);
    const endPos = canvasToScreen(endX, endY);
    
    const x = Math.min(startPos.x, endPos.x);
    const y = Math.min(startPos.y, endPos.y);
    const width = Math.abs(endPos.x - startPos.x);
    const height = Math.abs(endPos.y - startPos.y);
    
    return (
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill="rgba(24, 144, 255, 0.1)"
        stroke="#1890ff"
        strokeWidth={1}
        strokeDasharray="5,5"
      />
    );
  };
  
  /**
   * 获取节点颜色
   */
  const getNodeColor = (type: string): string => {
    const colors: Record<string, string> = {
      capability: '#e6f7ff',
      condition: '#fff7e6',
      control: '#f6ffed',
      agent: '#f9f0ff',
      integration: '#fff0f6'
    };
    return colors[type] || '#fafafa';
  };
  
  /**
   * 获取状态颜色
   */
  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      idle: '#d9d9d9',
      running: '#1890ff',
      success: '#52c41a',
      error: '#ff4d4f',
      warning: '#fa8c16'
    };
    return colors[status] || '#d9d9d9';
  };
  
  /**
   * 渲染工具栏
   */
  const renderToolbar = () => (
    <div className="workflow-toolbar">
      <Space>
        <Button
          type="primary"
          icon={<SaveOutlined />}
          onClick={saveWorkflow}
          disabled={readonly}
        >
          保存
        </Button>
        
        <Button
          icon={<PlayCircleOutlined />}
          onClick={executeWorkflow}
          loading={isExecuting}
          disabled={readonly}
        >
          执行
        </Button>
        
        <Divider type="vertical" />
        
        {/* 移除节点库按钮 */}
        
        <Button
          icon={<BugOutlined />}
          onClick={() => setDebuggerVisible(!debuggerVisible)}
          type={debuggerVisible ? 'primary' : 'default'}
          size="small"
        >
          调试器
        </Button>
        
        <Button
          icon={<MonitorOutlined />}
          onClick={() => setMonitorVisible(true)}
          size="small"
        >
          监控
        </Button>
        
        <Dropdown
          menu={{
            items: [
              {
                key: 'validate',
                label: '验证工作流',
                icon: <CheckCircleOutlined />,
                onClick: async () => {
                  try {
                    const result = await validator.validateWorkflow(workflow);
                    setValidationErrors(result.errors);
                    if (result.isValid) {
                      message.success('工作流验证通过');
                    } else {
                      message.warning(`发现 ${result.errors.length} 个问题`);
                    }
                  } catch (error) {
                    message.error('验证失败: ' + (error as Error).message);
                  }
                }
              },
              {
                key: 'import-export',
                label: '导入/导出',
                icon: <ImportOutlined />,
                onClick: () => setImportExportVisible(true)
              },
              {
                key: 'version-control',
                label: '版本控制',
                icon: <BranchesOutlined />,
                onClick: () => setVersionControlVisible(true)
              },
              {
                type: 'divider'
              },
              {
                key: 'auto-layout',
                label: '自动布局',
                icon: <PartitionOutlined />,
                onClick: () => {
                  // TODO: 实现自动布局
                  message.info('自动布局功能开发中');
                }
              },
              {
                key: 'clear-canvas',
                label: '清空画布',
                icon: <ClearOutlined />,
                onClick: () => {
                  Modal.confirm({
                    title: '确认清空画布？',
                    content: '此操作将删除所有节点和连接，且无法撤销。',
                    onOk: () => {
                      handleWorkflowChange({
                        ...workflow,
                        nodes: [],
                        edges: []
                      });
                      message.success('画布已清空');
                    }
                  });
                }
              }
            ]
          }}
        >
          <Button icon={<MoreOutlined />} size="small" />
        </Dropdown>
        
        <Divider type="vertical" />
        
        <Button
          icon={<ZoomInOutlined />}
          onClick={zoomIn}
          size="small"
        />
        
        <Button
          icon={<ZoomOutOutlined />}
          onClick={zoomOut}
          size="small"
        />
        
        <Button
          icon={<ReloadOutlined />}
          onClick={resetZoom}
          size="small"
        />
        
        <Divider type="vertical" />
        
        <Switch
          checkedChildren="网格"
          unCheckedChildren="网格"
          checked={canvasConfig.showGrid}
          onChange={(checked) => setCanvasConfig(prev => ({ ...prev, showGrid: checked }))}
          size="small"
        />
        
        <Switch
          checkedChildren="对齐"
          unCheckedChildren="对齐"
          checked={canvasConfig.snapToGrid}
          onChange={(checked) => setCanvasConfig(prev => ({ ...prev, snapToGrid: checked }))}
          size="small"
        />
        
        {validationErrors.length > 0 && (
          <>
            <Divider type="vertical" />
            <Badge count={validationErrors.length}>
              <Button
                icon={<ExclamationCircleOutlined />}
                size="small"
                danger
                onClick={() => {
                  Modal.info({
                    title: '验证错误',
                    content: (
                      <List
                        size="small"
                        dataSource={validationErrors}
                        renderItem={(error) => (
                          <List.Item>
                            <Text type="danger">{error.message}</Text>
                          </List.Item>
                        )}
                      />
                    ),
                    width: 600
                  });
                }}
              >
                错误
              </Button>
            </Badge>
          </>
        )}
      </Space>
    </div>
  );
  
  /**
   * 渲染组件库
   */
  const renderLibrary = () => (
    <div className="workflow-library">
      <Title level={5}>组件库</Title>
      
      <Collapse defaultActiveKey={['capabilities', 'controls']}>
        <Panel header="能力模块" key="capabilities">
          <List
            size="small"
            dataSource={capabilities}
            renderItem={(capability) => (
              <List.Item
                className="library-item"
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('application/json', JSON.stringify({
                    type: 'capability',
                    data: capability
                  }));
                }}
              >
                <div>
                <Text strong>{capability?.name}</Text>
                <br />
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  {capability?.type} - {capability?.subType}
                </Text>
                </div>
              </List.Item>
            )}
          />
        </Panel>
        
        <Panel header="控制节点" key="controls">
          <List
            size="small"
            dataSource={[
              { type: 'condition', name: '条件节点', description: '条件判断' },
              { type: 'control', name: '控制节点', description: '流程控制' }
            ]}
            renderItem={(item) => (
              <List.Item
                className="library-item"
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('application/json', JSON.stringify({
                    type: item.type,
                    data: item
                  }));
                }}
              >
                <div>
                  <Text strong>{item.name}</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    {item.description}
                  </Text>
                </div>
              </List.Item>
            )}
          />
        </Panel>
        
        <Panel header="Agent模块" key="agents">
          <List
            size="small"
            dataSource={availableAgents}
            renderItem={(agent) => (
              <List.Item
                className="library-item"
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('application/json', JSON.stringify({
                    type: 'agent',
                    data: agent
                  }));
                }}
              >
                <div>
                  <Text strong>{agent?.name || '未命名Agent'}</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    {agent.type} - {agent.status}
                  </Text>
                </div>
              </List.Item>
            )}
          />
        </Panel>
      </Collapse>
    </div>
  );
  
  /**
   * 渲染属性面板
   */
  const renderProperties = () => {
    const selectedNode = selection.selectedNodes.size === 1 
      ? workflow.nodes.find((n: WorkflowNode) => n.id === Array.from(selection.selectedNodes)[0])
      : null;
    
    return (
      <div className="workflow-properties">
        <Title level={5}>属性</Title>
        
        {selectedNode ? (
          <Descriptions column={1} size="small" bordered>
            <Descriptions.Item label="ID">{selectedNode.id}</Descriptions.Item>
            <Descriptions.Item label="名称">{selectedNode?.name || '未命名节点'}</Descriptions.Item>
            <Descriptions.Item label="类型">{selectedNode.type}</Descriptions.Item>
            <Descriptions.Item label="状态">
              <Badge
                status={selectedNode.status === 'completed' ? 'success' : 
                       selectedNode.status === 'error' ? 'error' : 
                       selectedNode.status === 'running' ? 'processing' : 'default'}
                text={selectedNode.status}
              />
            </Descriptions.Item>
            <Descriptions.Item label="位置">
              ({selectedNode.position.x}, {selectedNode.position.y})
            </Descriptions.Item>
            <Descriptions.Item label="大小">
              {selectedNode.size?.width || 200} × {selectedNode.size?.height || 80}
            </Descriptions.Item>
          </Descriptions>
        ) : (
          <div style={{ textAlign: 'center', color: '#8c8c8c', padding: '20px' }}>
            选择一个节点查看属性
          </div>
        )}
        
        {selectedNode && (
          <div style={{ marginTop: '16px' }}>
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={() => {
                setEditingNode(selectedNode);
                setNodeEditorVisible(true);
              }}
              block
            >
              编辑节点
            </Button>
          </div>
        )}
      </div>
    );
  };
  
  /**
   * 处理拖放
   */
  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    
    try {
      const data = JSON.parse(event.dataTransfer.getData('application/json'));
      const { x, y } = screenToCanvas(event.clientX, event.clientY);
      
      addNode(data.type, { x, y });
    } catch (error) {
      console.error('拖放处理失败:', error);
    }
  }, [screenToCanvas, addNode]);
  
  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
  }, []);
  
  return (
    <div className="workflow-visual-designer">
      {renderToolbar()}
      
      <div className="designer-content">
        {/* 组件库 */}
        {toolbarConfig.showLibrary && (
          <div className="designer-sidebar left">
            {renderLibrary()}
          </div>
        )}
        
        {/* 画布 */}
        <div className="designer-canvas-container">
          <div
            ref={canvasRef}
            className="designer-canvas"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onDoubleClick={handleDoubleClick}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <svg
              ref={svgRef}
              width="100%"
              height="100%"
              style={{ cursor: dragState.isDragging ? 'grabbing' : 'grab' }}
            >
              <defs>
                <marker
                  id="arrowhead"
                  markerWidth="10"
                  markerHeight="7"
                  refX="9"
                  refY="3.5"
                  orient="auto"
                >
                  <polygon
                    points="0 0, 10 3.5, 0 7"
                    fill="#8c8c8c"
                  />
                </marker>
              </defs>
              
              {renderGrid()}
              
              {/* 连接 */}
              {workflow.edges.map(renderEdge)}
              
              {/* 节点 */}
              {workflow.nodes.map(renderNode)}
              
              {/* 框选 */}
              {renderSelectionBox()}
            </svg>
          </div>
        </div>
        
        {/* 属性面板 */}
        {toolbarConfig.showProperties && (
          <div className="designer-sidebar right">
            {renderProperties()}
          </div>
        )}
      </div>
      
      {/* 节点编辑器 */}
      <WorkflowNodeEditor
        visible={nodeEditorVisible}
        node={editingNode}
        workflow={workflow}
        onSave={(node) => {
          if (editingNode) {
            updateNode(node.id, node);
          } else {
            handleWorkflowChange({
              ...workflow,
              nodes: [...workflow.nodes, node]
            });
          }
          setNodeEditorVisible(false);
          setEditingNode(null);
        }}
        onCancel={() => {
          setNodeEditorVisible(false);
          setEditingNode(null);
        }}
        onDelete={(nodeId) => {
          deleteNode(nodeId);
          setNodeEditorVisible(false);
          setEditingNode(null);
        }}
        availableCapabilities={mockCapabilities}
        availableAgents={mockAgents}
      />
      
      {/* 移除增强节点库 */}
      
      {/* 工作流调试器 */}
      <Drawer
        title="工作流调试器"
        placement="bottom"
        height={400}
        open={debuggerVisible}
        onClose={() => setDebuggerVisible(false)}
        mask={false}
        getContainer={false}
        style={{ position: 'absolute' }}
      >
        <WorkflowDebugger
          workflow={workflow}
          visible={true}
          onClose={() => {
            // 处理关闭调试器
            console.log('关闭调试器');
          }}
          onNodeHighlight={(nodeId: string | null) => {
            // 处理节点高亮
            console.log('节点高亮:', nodeId);
          }}
          onExecutionStart={() => {
            // 处理执行开始
            console.log('执行开始');
          }}
          onExecutionStop={() => {
            // 处理执行停止
            console.log('执行停止');
          }}
        />
      </Drawer>
      
      {/* 工作流监控 */}
      <Modal
        title="工作流监控"
        open={monitorVisible}
        onCancel={() => setMonitorVisible(false)}
        width={1200}
        footer={null}
      >
        <WorkflowMonitor
          visible={monitorVisible}
          onClose={() => setMonitorVisible(false)}
          workflowId={workflow.id}
        />
      </Modal>
      
      {/* 导入导出 */}
      <Modal
        title="导入/导出工作流"
        open={importExportVisible}
        onCancel={() => setImportExportVisible(false)}
        width={800}
        footer={null}
      >
        <Tabs defaultActiveKey="export">
          <TabPane tab="导出" key="export">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Select
                placeholder="选择导出格式"
                style={{ width: '100%' }}
                options={[
                  { label: 'JSON', value: 'json' },
                  { label: 'YAML', value: 'yaml' },
                  { label: 'XML', value: 'xml' },
                  { label: 'BPMN', value: 'bpmn' }
                ]}
              />
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                onClick={async () => {
                  try {
                    const result = await importExport.exportWorkflow(workflow, {
                      format: 'json' as any,
                      includeMetadata: true,
                      includeComments: true,
                      minify: false
                    });
                    
                    // 创建下载链接
                    const blob = new Blob([result.content], { type: result.mimeType });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = result.filename;
                    a.click();
                    URL.revokeObjectURL(url);
                    
                    message.success('导出成功');
                  } catch (error) {
                    message.error('导出失败: ' + (error as Error).message);
                  }
                }}
                block
              >
                导出工作流
              </Button>
            </Space>
          </TabPane>
          <TabPane tab="导入" key="import">
            <Upload.Dragger
              accept=".json,.yaml,.yml,.xml,.bpmn"
              beforeUpload={async (file) => {
                try {
                  const result = await importExport.importWorkflow(file, {
                    source: 'file' as any,
                    validateSchema: true,
                    mergeStrategy: 'replace',
                    conflictResolution: 'overwrite',
                    preserveIds: false
                  });
                  
                  if (result.success && result.workflow) {
                    handleWorkflowChange(result.workflow);
                    message.success('导入成功');
                    setImportExportVisible(false);
                  } else {
                    message.error('导入失败: ' + result.errors.join(', '));
                  }
                } catch (error) {
                  message.error('导入失败: ' + (error as Error).message);
                }
                return false; // 阻止自动上传
              }}
            >
              <p className="ant-upload-drag-icon">
                <UploadOutlined />
              </p>
              <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
              <p className="ant-upload-hint">支持 JSON、YAML、XML、BPMN 格式</p>
            </Upload.Dragger>
          </TabPane>
        </Tabs>
       </Modal>
       
       {/* 版本控制 */}
       <Modal
         title="版本控制"
         open={versionControlVisible}
         onCancel={() => setVersionControlVisible(false)}
         width={1000}
         footer={null}
       >
         <Tabs defaultActiveKey="versions">
           <TabPane tab="版本历史" key="versions">
             <Space direction="vertical" style={{ width: '100%' }}>
               <Space>
                 <Button
                   type="primary"
                   icon={<SaveOutlined />}
                   onClick={async () => {
                     try {
                       const version = versionControl.createVersion(
                         workflow.id,
                         workflow,
                         'EFIAgent Designer',
                         '手动保存版本'
                       );
                       message.success(`版本 ${version.version} 创建成功`);
                     } catch (error) {
                       message.error('创建版本失败: ' + (error as Error).message);
                     }
                   }}
                 >
                   创建版本
                 </Button>
                 <Button
                   icon={<BranchesOutlined />}
                   onClick={async () => {
                     try {
                       const branch = versionControl.createBranch(
                         workflow.id,
                         'feature-branch',
                         'v1.0.0', // 基础版本
                         'EFIAgent Designer',
                         '功能开发分支'
                       );
                       if (branch) {
                         message.success(`分支 ${branch?.name || '未命名分支'} 创建成功`);
                       } else {
                         message.error('创建分支失败：基础版本不存在');
                       }
                     } catch (error) {
                       message.error('创建分支失败: ' + (error as Error).message);
                     }
                   }}
                 >
                   创建分支
                 </Button>
               </Space>
               
               <Table
                 size="small"
                 columns={[
                   {
                     title: '版本',
                     dataIndex: 'version',
                     key: 'version'
                   },
                   {
                     title: '描述',
                     dataIndex: 'description',
                     key: 'description'
                   },
                   {
                     title: '创建时间',
                     dataIndex: 'createdAt',
                     key: 'createdAt',
                     render: (date: Date) => new Date(date).toLocaleString()
                   },
                   {
                     title: '状态',
                     dataIndex: 'status',
                     key: 'status',
                     render: (status: string) => (
                       <Tag color={status === 'published' ? 'green' : 'blue'}>
                         {status}
                       </Tag>
                     )
                   },
                   {
                     title: '操作',
                     key: 'actions',
                     render: (_, record: any) => (
                       <Space>
                         <Button
                           size="small"
                           onClick={async () => {
                             try {
                               const restoredWorkflow = await versionControl.rollback(workflow.id, record.version);
                               handleWorkflowChange(restoredWorkflow);
                               message.success('版本回滚成功');
                             } catch (error) {
                               message.error('回滚失败: ' + (error as Error).message);
                             }
                           }}
                         >
                           回滚
                         </Button>
                         <Button
                           size="small"
                           onClick={async () => {
                             try {
                               const diff = await versionControl.compareVersions(workflow.id, workflow, record.version);
                               Modal.info({
                                 title: '版本对比',
                                 content: (
                                   <div>
                                     <p>节点变更: {diff?.nodeChanges?.length || 0}</p>
                                     <p>连接变更: {diff?.edgeChanges?.length || 0}</p>
                                     <p>配置变更: {diff?.configChanges?.length || 0}</p>
                                   </div>
                                 ),
                                 width: 600
                               });
                             } catch (error) {
                               message.error('对比失败: ' + (error as Error).message);
                             }
                           }}
                         >
                           对比
                         </Button>
                       </Space>
                     )
                   }
                 ]}
                 dataSource={versionControl.getVersions(workflow.id)}
                 pagination={{ pageSize: 10 }}
               />
             </Space>
           </TabPane>
           
           <TabPane tab="分支管理" key="branches">
             <Table
               size="small"
               columns={[
                 {
                   title: '分支名称',
                   dataIndex: 'name',
                   key: 'name'
                 },
                 {
                   title: '基于版本',
                   dataIndex: 'baseVersion',
                   key: 'baseVersion'
                 },
                 {
                   title: '创建时间',
                   dataIndex: 'createdAt',
                   key: 'createdAt',
                   render: (date: Date) => new Date(date).toLocaleString()
                 },
                 {
                   title: '操作',
                   key: 'actions',
                   render: (_, record: any) => (
                     <Space>
                       <Button
                         size="small"
                         onClick={async () => {
                           try {
                             const result = await versionControl.mergeBranch(workflow.id, record?.name || '', 'main');
                             if (result.success) {
                               message.success('分支合并成功');
                             } else {
                               message.warning(`合并冲突: ${result.conflicts.length} 个`);
                             }
                           } catch (error) {
                             message.error('合并失败: ' + (error as Error).message);
                           }
                         }}
                       >
                         合并
                       </Button>
                     </Space>
                   )
                 }
               ]}
               dataSource={versionControl.getBranches(workflow.id)}
               pagination={{ pageSize: 10 }}
             />
           </TabPane>
         </Tabs>
       </Modal>
     </div>
   );
};

export default WorkflowVisualDesigner;
