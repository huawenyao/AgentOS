/**
 * EFIAgent 2.0 工作流引擎核心模块
 * 基于三层架构设计：能力模块层 -> Agent模块层 -> 工作流模块层
 * 实现智能工作流的编排、执行、监控和优化
 */

import { EventEmitter } from 'events';
import {
  CoreCapabilityModule,
  CoreCapabilityType,
  Agent2_0,
  WorkflowNode,
  WorkflowEdge,
  WorkflowExecution,
  WorkflowDefinition,
  CapabilityOrchestrationMode,
  WorkflowVariable,
  WorkflowTrigger,
  WorkflowMetadata,
  WorkflowOrchestrationConfig,
  RetryPolicy,
  OptimizationConfig,
  WorkflowPermissions
} from './CapabilitySystemTypes';

/**
 * 工作流引擎接口定义
 * 提供工作流的创建、执行、管理等核心功能
 */
export interface IWorkflowEngine {
  // 工作流管理
  createWorkflow(definition: WorkflowDefinition): Promise<string>;
  updateWorkflow(id: string, definition: WorkflowDefinition): Promise<void>;
  deleteWorkflow(id: string): Promise<void>;
  getWorkflow(id: string): Promise<WorkflowDefinition | null>;

  // 工作流执行
  executeWorkflow(id: string, inputs?: Record<string, any>): Promise<WorkflowExecution>;
  pauseWorkflow(executionId: string): Promise<void>;
  resumeWorkflow(executionId: string): Promise<void>;
  stopWorkflow(executionId: string): Promise<void>;

  // 执行状态查询
  getExecutionStatus(executionId: string): Promise<WorkflowExecution | null>;
  getExecutionHistory(workflowId: string): Promise<WorkflowExecution[]>;

  // 事件监听
  on(event: string, listener: (...args: any[]) => void): void;
  off(event: string, listener: (...args: any[]) => void): void;
}

/**
 * 节点执行上下文
 */
export interface NodeExecutionContext {
  nodeId: string;
  workflowId: string;
  executionId: string;
  inputs: Record<string, any>;
  variables: Record<string, any>;
  metadata: Record<string, any>;
  parentContext?: NodeExecutionContext;
}

/**
 * 节点执行结果
 */
export interface NodeExecutionResult {
  nodeId: string;
  status: 'success' | 'failure' | 'skipped' | 'timeout';
  outputs: Record<string, any>;
  error?: Error;
  duration: number;
  metrics: NodeMetrics;
  logs: LogEntry[];
}

/**
 * 节点指标
 */
export interface NodeMetrics {
  startTime: Date;
  endTime: Date;
  duration: number;
  cpuUsage: number;
  memoryUsage: number;
  throughput: number;
  errorRate: number;
}

/**
 * 日志条目
 */
export interface LogEntry {
  timestamp: Date;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  data?: any;
}

/**
 * 工作流引擎实现
 */
export class WorkflowEngine extends EventEmitter implements IWorkflowEngine {
  private workflows: Map<string, WorkflowDefinition> = new Map();
  private executions: Map<string, WorkflowExecution> = new Map();
  private capabilities: Map<string, CoreCapabilityModule> = new Map();
  private agents: Map<string, Agent2_0> = new Map();
  private executionQueue: WorkflowExecution[] = [];
  private isProcessing: boolean = false;
  
  constructor() {
    super();
    this.startExecutionProcessor();
  }

  /**
   * 创建工作流
   */
  async createWorkflow(definition: WorkflowDefinition): Promise<string> {
    try {
      // 验证工作流定义
      this.validateWorkflowDefinition(definition);
      
      // 存储工作流
      this.workflows.set(definition.id, definition);
      
      // 触发事件
      this.emit('workflow:created', definition);
      
      return definition.id;
    } catch (error) {
      this.emit('workflow:error', { operation: 'create', error });
      throw error;
    }
  }

  /**
   * 更新工作流
   */
  async updateWorkflow(id: string, definition: WorkflowDefinition): Promise<void> {
    try {
      if (!this.workflows.has(id)) {
        throw new Error(`工作流不存在: ${id}`);
      }
      
      // 验证工作流定义
      this.validateWorkflowDefinition(definition);
      
      // 更新工作流
      definition.metadata.updatedAt = new Date();
      this.workflows.set(id, definition);
      
      // 触发事件
      this.emit('workflow:updated', definition);
    } catch (error) {
      this.emit('workflow:error', { operation: 'update', error });
      throw error;
    }
  }

  /**
   * 删除工作流
   */
  async deleteWorkflow(id: string): Promise<void> {
    try {
      if (!this.workflows.has(id)) {
        throw new Error(`工作流不存在: ${id}`);
      }
      
      // 检查是否有正在执行的实例
      const runningExecutions = Array.from(this.executions.values())
        .filter(exec => exec.workflowId === id && exec.status === 'running');
      
      if (runningExecutions.length > 0) {
        throw new Error(`无法删除工作流，存在正在执行的实例: ${runningExecutions.length}个`);
      }
      
      // 删除工作流
      this.workflows.delete(id);
      
      // 触发事件
      this.emit('workflow:deleted', { id });
    } catch (error) {
      this.emit('workflow:error', { operation: 'delete', error });
      throw error;
    }
  }

  /**
   * 获取工作流
   */
  async getWorkflow(id: string): Promise<WorkflowDefinition | null> {
    return this.workflows.get(id) || null;
  }

  /**
   * 执行工作流
   */
  async executeWorkflow(id: string, inputs: Record<string, any> = {}): Promise<WorkflowExecution> {
    try {
      const workflow = this.workflows.get(id);
      if (!workflow) {
        throw new Error(`工作流不存在: ${id}`);
      }
      
      // 创建执行实例
      const execution: WorkflowExecution = {
        id: `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        workflowId: id,
        status: 'pending',
        startTime: new Date(),
        progress: 0,
        nodeExecutions: [],
        metrics: {
          totalDuration: 0,
          nodeCount: workflow.nodes.length,
          successCount: 0,
          failureCount: 0,
          averageNodeDuration: 0,
          throughput: 0
        },
        inputs,
        variables: this.initializeVariables(workflow.variables, inputs)
      };
      
      // 存储执行实例
      this.executions.set(execution.id, execution);
      
      // 加入执行队列
      this.executionQueue.push(execution);
      
      // 触发事件
      this.emit('execution:created', execution);
      
      return execution;
    } catch (error) {
      this.emit('execution:error', { operation: 'execute', error });
      throw error;
    }
  }

  /**
   * 暂停工作流执行
   */
  async pauseWorkflow(executionId: string): Promise<void> {
    const execution = this.executions.get(executionId);
    if (!execution) {
      throw new Error(`执行实例不存在: ${executionId}`);
    }
    
    if (execution.status !== 'running') {
      throw new Error(`无法暂停非运行状态的执行实例: ${execution.status}`);
    }
    
    execution.status = 'pending';
    this.emit('execution:paused', execution);
  }

  /**
   * 恢复工作流执行
   */
  async resumeWorkflow(executionId: string): Promise<void> {
    const execution = this.executions.get(executionId);
    if (!execution) {
      throw new Error(`执行实例不存在: ${executionId}`);
    }
    
    if (execution.status !== 'paused') {
      throw new Error(`无法恢复非暂停状态的执行实例: ${execution.status}`);
    }
    
    execution.status = 'running';
    this.emit('execution:resumed', execution);
  }

  /**
   * 停止工作流执行
   */
  async stopWorkflow(executionId: string): Promise<void> {
    const execution = this.executions.get(executionId);
    if (!execution) {
      throw new Error(`执行实例不存在: ${executionId}`);
    }
    
    if (!['running', 'paused'].includes(execution.status)) {
      throw new Error(`无法停止已完成的执行实例: ${execution.status}`);
    }
    
    execution.status = 'cancelled';
    execution.endTime = new Date();
    this.emit('execution:stopped', execution);
  }

  /**
   * 获取执行状态
   */
  async getExecutionStatus(executionId: string): Promise<WorkflowExecution | null> {
    return this.executions.get(executionId) || null;
  }

  /**
   * 获取执行历史
   */
  async getExecutionHistory(workflowId: string): Promise<WorkflowExecution[]> {
    return Array.from(this.executions.values())
      .filter(exec => exec.workflowId === workflowId)
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
  }

  /**
   * 注册能力模块
   */
  registerCapability(capability: CoreCapabilityModule): void {
    this.capabilities.set(capability.id, capability);
    this.emit('capability:registered', capability);
  }

  /**
   * 注册Agent
   */
  registerAgent(agent: Agent2_0): void {
    this.agents.set(agent.id, agent);
    this.emit('agent:registered', agent);
  }

  /**
   * 验证工作流定义
   */
  private validateWorkflowDefinition(definition: WorkflowDefinition): void {
    if (!definition.id || !(definition.name || '').trim()) {
      throw new Error('工作流ID和名称不能为空');
    }
    
    if (definition.nodes.length === 0) {
      throw new Error('工作流必须包含至少一个节点');
    }
    
    // 验证节点引用的能力是否存在
    for (const node of definition.nodes) {
      if (node.capability && !this.capabilities.has(node.capability.id)) {
        throw new Error(`节点 ${node.id} 引用的能力不存在: ${node.capability.id}`);
      }
    }
    
    // 验证边的连接是否有效
    for (const edge of definition.edges) {
      const sourceNode = definition.nodes.find(n => n.id === edge.sourceNodeId);
      const targetNode = definition.nodes.find(n => n.id === edge.targetNodeId);
      
      if (!sourceNode || !targetNode) {
        throw new Error(`边 ${edge.id} 连接的节点不存在`);
      }
    }
    
    // 检查是否存在循环依赖
    this.detectCycles(definition.nodes, definition.edges);
  }

  /**
   * 检测循环依赖
   */
  private detectCycles(nodes: WorkflowNode[], edges: WorkflowEdge[]): void {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    
    const hasCycle = (nodeId: string): boolean => {
      if (recursionStack.has(nodeId)) {
        return true;
      }
      
      if (visited.has(nodeId)) {
        return false;
      }
      
      visited.add(nodeId);
      recursionStack.add(nodeId);
      
      const outgoingEdges = edges.filter(e => e.sourceNodeId === nodeId);
      for (const edge of outgoingEdges) {
        if (hasCycle(edge.targetNodeId)) {
          return true;
        }
      }
      
      recursionStack.delete(nodeId);
      return false;
    };
    
    for (const node of nodes) {
      if (hasCycle(node.id)) {
        throw new Error('工作流中存在循环依赖');
      }
    }
  }

  /**
   * 初始化变量
   */
  private initializeVariables(
    variableDefinitions: WorkflowVariable[],
    inputs: Record<string, any>
  ): Record<string, any> {
    const variables: Record<string, any> = {};
    
    for (const varDef of variableDefinitions) {
      if (inputs.hasOwnProperty(varDef.name)) {
        variables[varDef.name] = inputs[varDef.name];
      } else if (varDef.defaultValue !== undefined) {
        variables[varDef.name] = varDef.defaultValue;
      } else if (varDef.validation?.required) {
        throw new Error(`必需变量未提供: ${varDef.name}`);
      }
    }
    
    return variables;
  }

  /**
   * 启动执行处理器
   */
  private startExecutionProcessor(): void {
    setInterval(() => {
      if (!this.isProcessing && this.executionQueue.length > 0) {
        this.processNextExecution();
      }
    }, 100);
  }

  /**
   * 处理下一个执行实例
   */
  private async processNextExecution(): Promise<void> {
    if (this.isProcessing || this.executionQueue.length === 0) {
      return;
    }
    
    this.isProcessing = true;
    const execution = this.executionQueue.shift()!;
    
    try {
      await this.executeWorkflowInstance(execution);
    } catch (error) {
      console.error('执行工作流实例失败:', error);
      execution.status = 'failed';
      execution.error = error instanceof Error ? error.message : String(error);
      execution.endTime = new Date();
      this.emit('execution:failed', execution);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * 执行工作流实例
   */
  private async executeWorkflowInstance(execution: WorkflowExecution): Promise<void> {
    const workflow = this.workflows.get(execution.workflowId);
    if (!workflow) {
      throw new Error(`工作流不存在: ${execution.workflowId}`);
    }
    
    execution.status = 'running';
    this.emit('execution:started', execution);
    
    try {
      // 根据编排模式执行节点
      switch (workflow.orchestrationConfig.mode) {
        case CapabilityOrchestrationMode.SEQUENTIAL:
          await this.executeSequential(workflow, execution);
          break;
        case CapabilityOrchestrationMode.PARALLEL:
          await this.executeParallel(workflow, execution);
          break;
        case CapabilityOrchestrationMode.CONDITIONAL:
          await this.executeConditional(workflow, execution);
          break;
        case CapabilityOrchestrationMode.PIPELINE:
          await this.executePipeline(workflow, execution);
          break;
        default:
          throw new Error(`不支持的编排模式: ${workflow.orchestrationConfig.mode}`);
      }
      
      execution.status = 'completed';
      execution.endTime = new Date();
      execution.progress = 100;
      
      // 计算指标
      this.calculateExecutionMetrics(execution);
      
      this.emit('execution:completed', execution);
    } catch (error) {
      execution.status = 'failed';
      execution.error = error instanceof Error ? error.message : String(error);
      execution.endTime = new Date();
      this.emit('execution:failed', execution);
      throw error;
    }
  }

  /**
   * 顺序执行模式
   */
  private async executeSequential(workflow: WorkflowDefinition, execution: WorkflowExecution): Promise<void> {
    const sortedNodes = this.topologicalSort(workflow.nodes, workflow.edges);
    
    for (let i = 0; i < sortedNodes.length; i++) {
      const node = sortedNodes[i];
      
      if (execution.status !== 'running') {
        break;
      }
      
      await this.executeNode(node, workflow, execution);
      
      // 更新进度
      execution.progress = ((i + 1) / sortedNodes.length) * 100;
      this.emit('execution:progress', execution);
    }
  }

  /**
   * 并行执行模式
   */
  private async executeParallel(workflow: WorkflowDefinition, execution: WorkflowExecution): Promise<void> {
    const nodePromises = workflow.nodes.map(node => 
      this.executeNode(node, workflow, execution)
    );
    
    await Promise.all(nodePromises);
  }

  /**
   * 条件执行模式
   */
  private async executeConditional(workflow: WorkflowDefinition, execution: WorkflowExecution): Promise<void> {
    // 找到起始节点
    const startNodes = workflow.nodes.filter(node => 
      !workflow.edges.some(edge => edge.targetNodeId === node.id)
    );
    
    for (const startNode of startNodes) {
      await this.executeNodeWithConditions(startNode, workflow, execution);
    }
  }

  /**
   * 流水线执行模式
   */
  private async executePipeline(workflow: WorkflowDefinition, execution: WorkflowExecution): Promise<void> {
    const sortedNodes = this.topologicalSort(workflow.nodes, workflow.edges);
    let pipelineData: any = execution.inputs;
    
    for (const node of sortedNodes) {
      if (execution.status !== 'running') {
        break;
      }
      
      const result = await this.executeNode(node, workflow, execution, pipelineData);
      pipelineData = result.outputs;
    }
  }

  /**
   * 执行单个节点
   */
  private async executeNode(
    node: WorkflowNode,
    workflow: WorkflowDefinition,
    execution: WorkflowExecution,
    inputs?: any
  ): Promise<NodeExecutionResult> {
    const startTime = new Date();
    
    try {
      // 创建执行上下文
      const context: NodeExecutionContext = {
        nodeId: node.id,
        workflowId: workflow.id,
        executionId: execution.id,
        inputs: inputs || this.collectNodeInputs(node, workflow, execution),
        variables: execution.variables || {},
        metadata: {
          nodeConfig: node.config,
          workflowMetadata: workflow.metadata
        }
      };
      
      let result: NodeExecutionResult;
      
      // 根据节点类型执行
      switch (node.type) {
        case 'capability':
          result = await this.executeCapabilityNode(node, context);
          break;
        case 'condition':
          result = await this.executeConditionNode(node, context);
          break;
        case 'start':
        case 'end':
          result = await this.executeControlNode(node, context);
          break;
        default:
          throw new Error(`不支持的节点类型: ${node.type}`);
      }
      
      // 记录执行结果
      execution.nodeExecutions.push({
        nodeId: node.id,
        status: result.status,
        startTime,
        endTime: new Date(),
        duration: result.duration,
        inputs: context.inputs,
        outputs: result.outputs,
        error: result.error?.message,
        metrics: result.metrics
      });
      
      // 更新节点状态
      node.status = result.status === 'success' ? 'completed' : 'error';
      
      this.emit('node:executed', { node, result, execution });
      
      return result;
    } catch (error) {
      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();
      
      const result: NodeExecutionResult = {
        nodeId: node.id,
        status: 'failure',
        outputs: {},
        error: error instanceof Error ? error : new Error(String(error)),
        duration,
        metrics: {
          startTime,
          endTime,
          duration,
          cpuUsage: 0,
          memoryUsage: 0,
          throughput: 0,
          errorRate: 1
        },
        logs: [{
          timestamp: new Date(),
          level: 'error',
          message: error instanceof Error ? error.message : String(error)
        }]
      };
      
      execution.nodeExecutions.push({
        nodeId: node.id,
        status: 'failure',
        startTime,
        endTime,
        duration,
        inputs: {},
        outputs: {},
        error: result.error?.message,
        metrics: result.metrics
      });
      
      node.status = 'error';
      
      this.emit('node:failed', { node, result, execution });
      
      throw error;
    }
  }

  /**
   * 执行能力节点
   */
  private async executeCapabilityNode(
    node: WorkflowNode,
    context: NodeExecutionContext
  ): Promise<NodeExecutionResult> {
    if (!node.capability) {
      throw new Error(`能力节点缺少能力定义: ${node.id}`);
    }
    
    const capability = this.capabilities.get(node.capability.id);
    if (!capability) {
      throw new Error(`能力不存在: ${node.capability.id}`);
    }
    
    const startTime = new Date();
    
    try {
      // 模拟能力执行
      // 实际实现中，这里会调用具体的能力模块
      const outputs = await this.simulateCapabilityExecution(capability, context.inputs);
      
      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();
      
      return {
        nodeId: node.id,
        status: 'success',
        outputs,
        duration,
        metrics: {
          startTime,
          endTime,
          duration,
          cpuUsage: Math.random() * 100,
          memoryUsage: Math.random() * 1000,
          throughput: Math.random() * 1000,
          errorRate: 0
        },
        logs: [{
          timestamp: new Date(),
          level: 'info',
          message: `能力 ${capability?.name || '未知能力'} 执行成功`
        }]
      };
    } catch (error) {
      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();
      
      throw new Error(`能力执行失败: ${error}`);
    }
  }

  /**
   * 执行条件节点
   */
  private async executeConditionNode(
    node: WorkflowNode,
    context: NodeExecutionContext
  ): Promise<NodeExecutionResult> {
    const startTime = new Date();
    
    try {
      // 评估条件
      const condition = node.config.condition || 'true';
      const result = this.evaluateCondition(condition, context);
      
      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();
      
      return {
        nodeId: node.id,
        status: 'success',
        outputs: { result },
        duration,
        metrics: {
          startTime,
          endTime,
          duration,
          cpuUsage: 0,
          memoryUsage: 0,
          throughput: 1,
          errorRate: 0
        },
        logs: [{
          timestamp: new Date(),
          level: 'info',
          message: `条件评估结果: ${result}`
        }]
      };
    } catch (error) {
      throw new Error(`条件评估失败: ${error}`);
    }
  }

  /**
   * 执行控制节点
   */
  private async executeControlNode(
    node: WorkflowNode,
    context: NodeExecutionContext
  ): Promise<NodeExecutionResult> {
    const startTime = new Date();
    const endTime = new Date();
    const duration = endTime.getTime() - startTime.getTime();
    
    return {
      nodeId: node.id,
      status: 'success',
      outputs: context.inputs,
      duration,
      metrics: {
        startTime,
        endTime,
        duration,
        cpuUsage: 0,
        memoryUsage: 0,
        throughput: 1,
        errorRate: 0
      },
      logs: [{
        timestamp: new Date(),
        level: 'info',
        message: `控制节点 ${node.type} 执行完成`
      }]
    };
  }

  /**
   * 模拟能力执行
   */
  private async simulateCapabilityExecution(
    capability: CoreCapabilityModule,
    inputs: any
  ): Promise<any> {
    // 模拟异步执行
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 500));
    
    // 根据能力类型返回模拟结果
    switch (capability.type) {
      case CoreCapabilityType.COGNITIVE:
        return {
          perception: `感知结果: ${JSON.stringify(inputs)}`,
          understanding: '理解完成',
          context: '上下文已建立'
        };
      case CoreCapabilityType.REASONING:
        return {
          analysis: '分析完成',
          inference: '推理结果',
          conclusion: '结论已得出'
        };
      case CoreCapabilityType.DECISION:
        return {
          options: ['选项A', '选项B', '选项C'],
          recommendation: '推荐选项A',
          confidence: 0.85
        };
      case CoreCapabilityType.LEARNING:
        return {
          model: '模型已更新',
          accuracy: 0.92,
          improvement: '性能提升5%'
        };
      default:
        return { result: '执行完成' };
    }
  }

  /**
   * 收集节点输入
   */
  private collectNodeInputs(
    node: WorkflowNode,
    workflow: WorkflowDefinition,
    execution: WorkflowExecution
  ): any {
    const inputs: any = {};
    
    // 从连接的边收集输入
    const incomingEdges = workflow.edges.filter(edge => edge.targetNodeId === node.id);
    
    for (const edge of incomingEdges) {
      const sourceExecution = execution.nodeExecutions.find(ne => ne.nodeId === edge.sourceNodeId);
      if (sourceExecution && sourceExecution.outputs) {
        const outputValue = sourceExecution.outputs[edge.sourceOutputId];
        if (outputValue !== undefined) {
          inputs[edge.targetInputId] = outputValue;
        }
      }
    }
    
    // 如果没有输入，使用执行的初始输入
    if (Object.keys(inputs).length === 0) {
      return execution.inputs;
    }
    
    return inputs;
  }

  /**
   * 带条件的节点执行
   */
  private async executeNodeWithConditions(
    node: WorkflowNode,
    workflow: WorkflowDefinition,
    execution: WorkflowExecution
  ): Promise<void> {
    await this.executeNode(node, workflow, execution);
    
    // 找到后续节点
    const outgoingEdges = workflow.edges.filter(edge => edge.sourceNodeId === node.id);
    
    for (const edge of outgoingEdges) {
      // 检查边的条件
      if (edge.condition) {
        const context: NodeExecutionContext = {
          nodeId: node.id,
          workflowId: workflow.id,
          executionId: execution.id,
          inputs: {},
          variables: execution.variables || {},
          metadata: {}
        };
        
        const conditionResult = this.evaluateCondition(edge.condition, context);
        if (!conditionResult) {
          continue; // 跳过此边
        }
      }
      
      // 执行目标节点
      const targetNode = workflow.nodes.find(n => n.id === edge.targetNodeId);
      if (targetNode) {
        await this.executeNodeWithConditions(targetNode, workflow, execution);
      }
    }
  }

  /**
   * 评估条件表达式
   */
  private evaluateCondition(condition: string, context: NodeExecutionContext): boolean {
    try {
      // 简单的条件评估实现
      // 实际实现中应该使用更安全的表达式评估器
      const func = new Function('context', `return ${condition}`);
      return Boolean(func(context));
    } catch (error) {
      console.warn('条件评估失败:', condition, error);
      return false;
    }
  }

  /**
   * 拓扑排序
   */
  private topologicalSort(nodes: WorkflowNode[], edges: WorkflowEdge[]): WorkflowNode[] {
    const inDegree = new Map<string, number>();
    const adjList = new Map<string, string[]>();
    
    // 初始化
    for (const node of nodes) {
      inDegree.set(node.id, 0);
      adjList.set(node.id, []);
    }
    
    // 构建邻接表和入度表
    for (const edge of edges) {
      adjList.get(edge.sourceNodeId)?.push(edge.targetNodeId);
      inDegree.set(edge.targetNodeId, (inDegree.get(edge.targetNodeId) || 0) + 1);
    }
    
    // 拓扑排序
    const queue: string[] = [];
    const result: WorkflowNode[] = [];
    
    // 找到所有入度为0的节点
    for (const [nodeId, degree] of inDegree) {
      if (degree === 0) {
        queue.push(nodeId);
      }
    }
    
    while (queue.length > 0) {
      const nodeId = queue.shift()!;
      const node = nodes.find(n => n.id === nodeId);
      if (node) {
        result.push(node);
      }
      
      // 更新邻接节点的入度
      for (const neighborId of adjList.get(nodeId) || []) {
        const newDegree = (inDegree.get(neighborId) || 0) - 1;
        inDegree.set(neighborId, newDegree);
        
        if (newDegree === 0) {
          queue.push(neighborId);
        }
      }
    }
    
    return result;
  }

  /**
   * 计算执行指标
   */
  private calculateExecutionMetrics(execution: WorkflowExecution): void {
    const nodeExecutions = execution.nodeExecutions;
    
    if (nodeExecutions.length === 0) {
      return;
    }
    
    const totalDuration = execution.endTime!.getTime() - execution.startTime.getTime();
    const successCount = nodeExecutions.filter(ne => ne.status === 'success').length;
    const failureCount = nodeExecutions.filter(ne => ne.status === 'failure').length;
    const averageNodeDuration = nodeExecutions.reduce((sum, ne) => sum + ne.duration, 0) / nodeExecutions.length;
    const throughput = nodeExecutions.length / (totalDuration / 1000); // 节点/秒
    
    execution.metrics = {
      totalDuration,
      nodeCount: nodeExecutions.length,
      successCount,
      failureCount,
      averageNodeDuration,
      throughput
    };
  }
}

/**
 * 工作流引擎单例
 */
export const workflowEngine = new WorkflowEngine();

/**
 * 导出类型
 */
export {
  NodeExecutionContext,
  NodeExecutionResult,
  NodeMetrics,
  LogEntry
};