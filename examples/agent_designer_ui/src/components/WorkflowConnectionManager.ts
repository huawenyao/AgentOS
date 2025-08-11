import { WorkflowNode, WorkflowEdge } from '../types/CapabilitySystemTypes';

/**
 * 连接类型枚举
 */
export enum ConnectionType {
  DATA = 'data',
  CONTROL = 'control',
  EVENT = 'event',
  CONDITION = 'condition'
}

/**
 * 数据类型枚举
 */
export enum DataType {
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  OBJECT = 'object',
  ARRAY = 'array',
  FILE = 'file',
  IMAGE = 'image',
  JSON = 'json',
  ANY = 'any'
}

/**
 * 端口接口
 */
export interface Port {
  id: string;
  name: string;
  type: 'input' | 'output';
  dataType: DataType;
  required: boolean;
  description?: string;
  defaultValue?: any;
  validation?: PortValidation;
}

/**
 * 端口验证规则
 */
export interface PortValidation {
  min?: number;
  max?: number;
  pattern?: string;
  enum?: any[];
  custom?: (value: any) => boolean | string;
}

/**
 * 连接验证结果
 */
export interface ConnectionValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * 数据映射规则
 */
export interface DataMapping {
  sourceField: string;
  targetField: string;
  transform?: (value: any) => any;
  defaultValue?: any;
}

/**
 * 连接配置
 */
export interface ConnectionConfig {
  id: string;
  sourceNodeId: string;
  sourcePortId: string;
  targetNodeId: string;
  targetPortId: string;
  type: ConnectionType;
  dataMapping?: DataMapping[];
  condition?: string;
  priority?: number;
  enabled: boolean;
}

/**
 * 工作流连接管理器
 */
export class WorkflowConnectionManager {
  private nodes: Map<string, WorkflowNode> = new Map();
  private connections: Map<string, ConnectionConfig> = new Map();
  private portDefinitions: Map<string, Port[]> = new Map();

  /**
   * 添加节点
   */
  addNode(node: WorkflowNode): void {
    this.nodes.set(node.id, node);
    this.initializeNodePorts(node);
  }

  /**
   * 移除节点
   */
  removeNode(nodeId: string): void {
    // 移除相关连接
    const connectionsToRemove = Array.from(this.connections.values())
      .filter(conn => conn.sourceNodeId === nodeId || conn.targetNodeId === nodeId)
      .map(conn => conn.id);
    
    connectionsToRemove.forEach(connId => this.connections.delete(connId));
    
    // 移除节点
    this.nodes.delete(nodeId);
    this.portDefinitions.delete(nodeId);
  }

  /**
   * 初始化节点端口
   */
  private initializeNodePorts(node: WorkflowNode): void {
    const ports: Port[] = [];
    
    // 根据节点类型定义默认端口
    switch (node.type) {
      case 'START':
        ports.push({
          id: 'output',
          name: '输出',
          type: 'output',
          dataType: DataType.ANY,
          required: false
        });
        break;
        
      case 'END':
        ports.push({
          id: 'input',
          name: '输入',
          type: 'input',
          dataType: DataType.ANY,
          required: true
        });
        break;
        
      case 'CAPABILITY':
        // 基于能力类型定义端口
        if (node.config?.capability) {
          ports.push(
            {
              id: 'input',
              name: '输入数据',
              type: 'input',
              dataType: DataType.OBJECT,
              required: true
            },
            {
              id: 'output',
              name: '输出结果',
              type: 'output',
              dataType: DataType.OBJECT,
              required: false
            },
            {
              id: 'error',
              name: '错误输出',
              type: 'output',
              dataType: DataType.STRING,
              required: false
            }
          );
        }
        break;
        
      case 'CONDITION':
        ports.push(
          {
            id: 'input',
            name: '条件输入',
            type: 'input',
            dataType: DataType.ANY,
            required: true
          },
          {
            id: 'true',
            name: '真分支',
            type: 'output',
            dataType: DataType.ANY,
            required: false
          },
          {
            id: 'false',
            name: '假分支',
            type: 'output',
            dataType: DataType.ANY,
            required: false
          }
        );
        break;
        
      case 'CONTROL':
        // 控制节点端口根据具体控制类型定义
        const controlType = node.config?.controlType;
        if (controlType === 'parallel') {
          ports.push(
            {
              id: 'input',
              name: '输入',
              type: 'input',
              dataType: DataType.ANY,
              required: true
            },
            {
              id: 'branch1',
              name: '分支1',
              type: 'output',
              dataType: DataType.ANY,
              required: false
            },
            {
              id: 'branch2',
              name: '分支2',
              type: 'output',
              dataType: DataType.ANY,
              required: false
            }
          );
        }
        break;
    }
    
    this.portDefinitions.set(node.id, ports);
  }

  /**
   * 获取节点端口
   */
  getNodePorts(nodeId: string): Port[] {
    return this.portDefinitions.get(nodeId) || [];
  }

  /**
   * 添加端口
   */
  addPort(nodeId: string, port: Port): void {
    const ports = this.getNodePorts(nodeId);
    if (!ports.find(p => p.id === port.id)) {
      ports.push(port);
      this.portDefinitions.set(nodeId, ports);
    }
  }

  /**
   * 移除端口
   */
  removePort(nodeId: string, portId: string): void {
    const ports = this.getNodePorts(nodeId).filter(p => p.id !== portId);
    this.portDefinitions.set(nodeId, ports);
    
    // 移除相关连接
    const connectionsToRemove = Array.from(this.connections.values())
      .filter(conn => 
        (conn.sourceNodeId === nodeId && conn.sourcePortId === portId) ||
        (conn.targetNodeId === nodeId && conn.targetPortId === portId)
      )
      .map(conn => conn.id);
    
    connectionsToRemove.forEach(connId => this.connections.delete(connId));
  }

  /**
   * 创建连接
   */
  createConnection(config: Omit<ConnectionConfig, 'id'>): ConnectionValidationResult {
    const connectionId = `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const fullConfig: ConnectionConfig = {
      ...config,
      id: connectionId
    };
    
    // 验证连接
    const validation = this.validateConnection(fullConfig);
    
    if (validation.valid) {
      this.connections.set(connectionId, fullConfig);
    }
    
    return validation;
  }

  /**
   * 删除连接
   */
  removeConnection(connectionId: string): void {
    this.connections.delete(connectionId);
  }

  /**
   * 验证连接
   */
  validateConnection(config: ConnectionConfig): ConnectionValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // 检查节点是否存在
    const sourceNode = this.nodes.get(config.sourceNodeId);
    const targetNode = this.nodes.get(config.targetNodeId);
    
    if (!sourceNode) {
      errors.push(`源节点 ${config.sourceNodeId} 不存在`);
    }
    
    if (!targetNode) {
      errors.push(`目标节点 ${config.targetNodeId} 不存在`);
    }
    
    if (errors.length > 0) {
      return { valid: false, errors, warnings };
    }
    
    // 检查端口是否存在
    const sourcePorts = this.getNodePorts(config.sourceNodeId);
    const targetPorts = this.getNodePorts(config.targetNodeId);
    
    const sourcePort = sourcePorts.find(p => p.id === config.sourcePortId);
    const targetPort = targetPorts.find(p => p.id === config.targetPortId);
    
    if (!sourcePort) {
      errors.push(`源端口 ${config.sourcePortId} 不存在`);
    }
    
    if (!targetPort) {
      errors.push(`目标端口 ${config.targetPortId} 不存在`);
    }
    
    if (errors.length > 0) {
      return { valid: false, errors, warnings };
    }
    
    // 检查端口类型
    if (sourcePort!.type !== 'output') {
      errors.push('源端口必须是输出端口');
    }
    
    if (targetPort!.type !== 'input') {
      errors.push('目标端口必须是输入端口');
    }
    
    // 检查数据类型兼容性
    const typeCompatibility = this.checkTypeCompatibility(sourcePort!.dataType, targetPort!.dataType);
    if (!typeCompatibility.compatible) {
      if (typeCompatibility.canConvert) {
        warnings.push(`数据类型不完全匹配，将尝试自动转换: ${sourcePort!.dataType} -> ${targetPort!.dataType}`);
      } else {
        errors.push(`数据类型不兼容: ${sourcePort!.dataType} -> ${targetPort!.dataType}`);
      }
    }
    
    // 检查循环依赖
    if (this.wouldCreateCycle(config)) {
      errors.push('连接会创建循环依赖');
    }
    
    // 检查重复连接
    const existingConnection = Array.from(this.connections.values())
      .find(conn => 
        conn.sourceNodeId === config.sourceNodeId &&
        conn.sourcePortId === config.sourcePortId &&
        conn.targetNodeId === config.targetNodeId &&
        conn.targetPortId === config.targetPortId
      );
    
    if (existingConnection) {
      errors.push('连接已存在');
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * 检查类型兼容性
   */
  private checkTypeCompatibility(sourceType: DataType, targetType: DataType): {
    compatible: boolean;
    canConvert: boolean;
  } {
    // 完全匹配
    if (sourceType === targetType || targetType === DataType.ANY) {
      return { compatible: true, canConvert: false };
    }
    
    // 可转换的类型组合
    const convertibleTypes: Record<DataType, DataType[]> = {
      [DataType.STRING]: [DataType.NUMBER, DataType.BOOLEAN, DataType.JSON],
      [DataType.NUMBER]: [DataType.STRING, DataType.BOOLEAN],
      [DataType.BOOLEAN]: [DataType.STRING, DataType.NUMBER],
      [DataType.OBJECT]: [DataType.JSON, DataType.STRING],
      [DataType.ARRAY]: [DataType.JSON, DataType.STRING],
      [DataType.JSON]: [DataType.OBJECT, DataType.ARRAY, DataType.STRING],
      [DataType.FILE]: [DataType.STRING],
      [DataType.IMAGE]: [DataType.FILE, DataType.STRING],
      [DataType.ANY]: Object.values(DataType)
    };
    
    const canConvert = convertibleTypes[sourceType]?.includes(targetType) || false;
    
    return {
      compatible: false,
      canConvert
    };
  }

  /**
   * 检查是否会创建循环
   */
  private wouldCreateCycle(newConnection: ConnectionConfig): boolean {
    // 构建图的邻接表
    const graph = new Map<string, string[]>();
    
    // 添加现有连接
    this.connections.forEach(conn => {
      if (!graph.has(conn.sourceNodeId)) {
        graph.set(conn.sourceNodeId, []);
      }
      graph.get(conn.sourceNodeId)!.push(conn.targetNodeId);
    });
    
    // 添加新连接
    if (!graph.has(newConnection.sourceNodeId)) {
      graph.set(newConnection.sourceNodeId, []);
    }
    graph.get(newConnection.sourceNodeId)!.push(newConnection.targetNodeId);
    
    // 使用DFS检测循环
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
      
      const neighbors = graph.get(nodeId) || [];
      for (const neighbor of neighbors) {
        if (hasCycle(neighbor)) {
          return true;
        }
      }
      
      recursionStack.delete(nodeId);
      return false;
    };
    
    // 检查所有节点
    for (const nodeId of this.nodes.keys()) {
      if (!visited.has(nodeId) && hasCycle(nodeId)) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * 获取节点的输入连接
   */
  getNodeInputConnections(nodeId: string): ConnectionConfig[] {
    return Array.from(this.connections.values())
      .filter(conn => conn.targetNodeId === nodeId);
  }

  /**
   * 获取节点的输出连接
   */
  getNodeOutputConnections(nodeId: string): ConnectionConfig[] {
    return Array.from(this.connections.values())
      .filter(conn => conn.sourceNodeId === nodeId);
  }

  /**
   * 获取所有连接
   */
  getAllConnections(): ConnectionConfig[] {
    return Array.from(this.connections.values());
  }

  /**
   * 数据类型转换
   */
  convertData(value: any, fromType: DataType, toType: DataType): any {
    if (fromType === toType || toType === DataType.ANY) {
      return value;
    }
    
    try {
      switch (toType) {
        case DataType.STRING:
          return String(value);
          
        case DataType.NUMBER:
          const num = Number(value);
          if (isNaN(num)) {
            throw new Error(`无法将 "${value}" 转换为数字`);
          }
          return num;
          
        case DataType.BOOLEAN:
          if (typeof value === 'string') {
            return value.toLowerCase() === 'true' || value === '1';
          }
          return Boolean(value);
          
        case DataType.OBJECT:
          if (typeof value === 'string') {
            return JSON.parse(value);
          }
          return value;
          
        case DataType.ARRAY:
          if (typeof value === 'string') {
            return JSON.parse(value);
          }
          if (Array.isArray(value)) {
            return value;
          }
          return [value];
          
        case DataType.JSON:
          return JSON.stringify(value);
          
        default:
          return value;
      }
    } catch (error) {
      throw new Error(`数据转换失败: ${fromType} -> ${toType}, 错误: ${error}`);
    }
  }

  /**
   * 验证端口数据
   */
  validatePortData(port: Port, value: any): { valid: boolean; error?: string } {
    if (port.required && (value === undefined || value === null)) {
      return { valid: false, error: `端口 ${port.name} 是必需的` };
    }
    
    if (value === undefined || value === null) {
      return { valid: true };
    }
    
    // 类型验证
    const typeValid = this.validateDataType(value, port.dataType);
    if (!typeValid) {
      return { valid: false, error: `数据类型不匹配，期望 ${port.dataType}` };
    }
    
    // 自定义验证
    if (port.validation) {
      const validation = port.validation;
      
      // 数值范围验证
      if (typeof value === 'number') {
        if (validation.min !== undefined && value < validation.min) {
          return { valid: false, error: `值不能小于 ${validation.min}` };
        }
        if (validation.max !== undefined && value > validation.max) {
          return { valid: false, error: `值不能大于 ${validation.max}` };
        }
      }
      
      // 字符串长度验证
      if (typeof value === 'string') {
        if (validation.min !== undefined && value.length < validation.min) {
          return { valid: false, error: `长度不能小于 ${validation.min}` };
        }
        if (validation.max !== undefined && value.length > validation.max) {
          return { valid: false, error: `长度不能大于 ${validation.max}` };
        }
        if (validation.pattern && !new RegExp(validation.pattern).test(value)) {
          return { valid: false, error: '格式不正确' };
        }
      }
      
      // 枚举值验证
      if (validation.enum && !validation.enum.includes(value)) {
        return { valid: false, error: `值必须是以下之一: ${validation.enum.join(', ')}` };
      }
      
      // 自定义验证函数
      if (validation.custom) {
        const result = validation.custom(value);
        if (result !== true) {
          return { valid: false, error: typeof result === 'string' ? result : '自定义验证失败' };
        }
      }
    }
    
    return { valid: true };
  }

  /**
   * 验证数据类型
   */
  private validateDataType(value: any, expectedType: DataType): boolean {
    switch (expectedType) {
      case DataType.ANY:
        return true;
      case DataType.STRING:
        return typeof value === 'string';
      case DataType.NUMBER:
        return typeof value === 'number' && !isNaN(value);
      case DataType.BOOLEAN:
        return typeof value === 'boolean';
      case DataType.OBJECT:
        return typeof value === 'object' && value !== null && !Array.isArray(value);
      case DataType.ARRAY:
        return Array.isArray(value);
      case DataType.JSON:
        try {
          JSON.parse(value);
          return true;
        } catch {
          return false;
        }
      case DataType.FILE:
        return value instanceof File || (typeof value === 'object' && value.type && value.name);
      case DataType.IMAGE:
        return value instanceof File && value.type.startsWith('image/');
      default:
        return false;
    }
  }

  /**
   * 清空所有数据
   */
  clear(): void {
    this.nodes.clear();
    this.connections.clear();
    this.portDefinitions.clear();
  }

  /**
   * 导出连接配置
   */
  exportConnections(): any {
    return {
      nodes: Array.from(this.nodes.entries()),
      connections: Array.from(this.connections.entries()),
      ports: Array.from(this.portDefinitions.entries())
    };
  }

  /**
   * 导入连接配置
   */
  importConnections(data: any): void {
    this.clear();
    
    if (data.nodes) {
      data.nodes.forEach(([id, node]: [string, WorkflowNode]) => {
        this.nodes.set(id, node);
      });
    }
    
    if (data.connections) {
      data.connections.forEach(([id, connection]: [string, ConnectionConfig]) => {
        this.connections.set(id, connection);
      });
    }
    
    if (data.ports) {
      data.ports.forEach(([id, ports]: [string, Port[]]) => {
        this.portDefinitions.set(id, ports);
      });
    }
  }
}

export default WorkflowConnectionManager;