/**
 * EFIAgent 2.0 工作流验证器
 * 提供工作流完整性检查、语法验证和错误诊断功能
 */

import {
  WorkflowDefinition,
  WorkflowNode,
  WorkflowEdge,
  WorkflowVariable
} from './CapabilitySystemTypes';

/**
 * 验证错误类型
 */
export enum ValidationErrorType {
  CRITICAL = 'critical',
  WARNING = 'warning',
  INFO = 'info'
}

/**
 * 验证错误接口
 */
export interface ValidationError {
  id: string;
  type: ValidationErrorType;
  code: string;
  message: string;
  description?: string;
  nodeId?: string;
  edgeId?: string;
  position?: { x: number; y: number };
  suggestions?: string[];
  autoFixable?: boolean;
  severity: number; // 1-10, 10最严重
}

/**
 * 验证结果接口
 */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  infos: ValidationError[];
  score: number; // 0-100, 100表示完美
  summary: {
    totalIssues: number;
    criticalCount: number;
    warningCount: number;
    infoCount: number;
  };
}

/**
 * 验证规则接口
 */
interface ValidationRule {
  id: string;
  name: string;
  description: string;
  category: string;
  enabled: boolean;
  severity: ValidationErrorType;
  validate: (workflow: WorkflowDefinition) => ValidationError[];
}

/**
 * 工作流验证器类
 */
export class WorkflowValidator {
  private rules: ValidationRule[] = [];
  private customRules: ValidationRule[] = [];

  constructor() {
    this.initializeDefaultRules();
  }

  /**
   * 初始化默认验证规则
   */
  private initializeDefaultRules(): void {
    this.rules = [
      // 基础结构验证
      {
        id: 'empty_workflow',
        name: '空工作流检查',
        description: '工作流必须包含至少一个节点',
        category: 'structure',
        enabled: true,
        severity: ValidationErrorType.CRITICAL,
        validate: (workflow) => {
          if (!workflow.nodes || workflow.nodes.length === 0) {
            return [{
              id: 'empty_workflow_001',
              type: ValidationErrorType.CRITICAL,
              code: 'EMPTY_WORKFLOW',
              message: '工作流为空',
              description: '工作流必须包含至少一个节点才能执行',
              suggestions: ['添加一个起始节点', '从节点库中拖拽节点到画布'],
              autoFixable: false,
              severity: 10
            }];
          }
          return [];
        }
      },
      
      {
        id: 'isolated_nodes',
        name: '孤立节点检查',
        description: '检查没有连接的孤立节点',
        category: 'connectivity',
        enabled: true,
        severity: ValidationErrorType.WARNING,
        validate: (workflow) => {
          const errors: ValidationError[] = [];
          const connectedNodes = new Set<string>();
          
          // 收集所有连接的节点
          workflow.edges?.forEach(edge => {
            connectedNodes.add(edge.sourceNodeId);
            connectedNodes.add(edge.targetNodeId);
          });
          
          // 检查孤立节点
          workflow.nodes.forEach(node => {
            if (!connectedNodes.has(node.id) && workflow.nodes.length > 1) {
              errors.push({
                id: `isolated_node_${node.id}`,
                type: ValidationErrorType.WARNING,
                code: 'ISOLATED_NODE',
                message: `节点 "${node.name}" 没有连接`,
                description: '孤立的节点不会被执行',
                nodeId: node.id,
                position: node.position,
                suggestions: ['连接此节点到工作流', '删除不需要的节点'],
                autoFixable: false,
                severity: 5
              });
            }
          });
          
          return errors;
        }
      },
      
      {
        id: 'circular_dependency',
        name: '循环依赖检查',
        description: '检查工作流中的循环依赖',
        category: 'logic',
        enabled: true,
        severity: ValidationErrorType.CRITICAL,
        validate: (workflow) => {
          const errors: ValidationError[] = [];
          const visited = new Set<string>();
          const recursionStack = new Set<string>();
          
          const hasCycle = (nodeId: string): boolean => {
            visited.add(nodeId);
            recursionStack.add(nodeId);
            
            const outgoingEdges = workflow.edges?.filter(edge => edge.sourceNodeId === nodeId) || [];
            
            for (const edge of outgoingEdges) {
              const targetId = edge.targetNodeId;
              
              if (!visited.has(targetId)) {
                if (hasCycle(targetId)) {
                  return true;
                }
              } else if (recursionStack.has(targetId)) {
                errors.push({
                  id: `cycle_${nodeId}_${targetId}`,
                  type: ValidationErrorType.CRITICAL,
                  code: 'CIRCULAR_DEPENDENCY',
                  message: '检测到循环依赖',
                  description: `节点 "${nodeId}" 和 "${targetId}" 之间存在循环依赖`,
                  edgeId: edge.id,
                  suggestions: ['移除造成循环的连接', '重新设计工作流结构'],
                  autoFixable: false,
                  severity: 9
                });
                return true;
              }
            }
            
            recursionStack.delete(nodeId);
            return false;
          };
          
          workflow.nodes.forEach(node => {
            if (!visited.has(node.id)) {
              hasCycle(node.id);
            }
          });
          
          return errors;
        }
      },
      
      {
        id: 'missing_start_node',
        name: '起始节点检查',
        description: '检查是否有起始节点',
        category: 'structure',
        enabled: true,
        severity: ValidationErrorType.WARNING,
        validate: (workflow) => {
          const incomingConnections = new Set<string>();
          
          workflow.edges?.forEach(edge => {
            incomingConnections.add(edge.targetNodeId);
          });
          
          const startNodes = workflow.nodes.filter(node => !incomingConnections.has(node.id));
          
          if (startNodes.length === 0 && workflow.nodes.length > 0) {
            return [{
              id: 'missing_start_node_001',
              type: ValidationErrorType.WARNING,
              code: 'NO_START_NODE',
              message: '没有找到起始节点',
              description: '工作流应该有至少一个没有输入连接的起始节点',
              suggestions: ['确保有一个节点作为工作流的入口点'],
              autoFixable: false,
              severity: 6
            }];
          }
          
          if (startNodes.length > 1) {
            return [{
              id: 'multiple_start_nodes_001',
              type: ValidationErrorType.INFO,
              code: 'MULTIPLE_START_NODES',
              message: `发现 ${startNodes.length} 个起始节点`,
              description: '多个起始节点将并行执行',
              suggestions: ['确认这是预期的行为'],
              autoFixable: false,
              severity: 2
            }];
          }
          
          return [];
        }
      },
      
      {
        id: 'missing_end_node',
        name: '结束节点检查',
        description: '检查是否有结束节点',
        category: 'structure',
        enabled: true,
        severity: ValidationErrorType.INFO,
        validate: (workflow) => {
          const outgoingConnections = new Set<string>();
          
          workflow.edges?.forEach(edge => {
            outgoingConnections.add(edge.sourceNodeId);
          });
          
          const endNodes = workflow.nodes.filter(node => !outgoingConnections.has(node.id));
          
          if (endNodes.length === 0 && workflow.nodes.length > 0) {
            return [{
              id: 'missing_end_node_001',
              type: ValidationErrorType.INFO,
              code: 'NO_END_NODE',
              message: '没有找到结束节点',
              description: '工作流应该有至少一个没有输出连接的结束节点',
              suggestions: ['确保有节点作为工作流的终点'],
              autoFixable: false,
              severity: 3
            }];
          }
          
          return [];
        }
      },
      
      {
        id: 'node_configuration',
        name: '节点配置检查',
        description: '检查节点配置的完整性',
        category: 'configuration',
        enabled: true,
        severity: ValidationErrorType.WARNING,
        validate: (workflow) => {
          const errors: ValidationError[] = [];
          
          workflow.nodes.forEach(node => {
            // 检查节点名称
            if (!node.name || node.name.trim() === '') {
              errors.push({
                id: `node_name_${node.id}`,
                type: ValidationErrorType.WARNING,
                code: 'MISSING_NODE_NAME',
                message: '节点缺少名称',
                description: '节点应该有一个描述性的名称',
                nodeId: node.id,
                position: node.position,
                suggestions: ['为节点添加有意义的名称'],
                autoFixable: true,
                severity: 4
              });
            }
            
            // 检查必需的输入端口
            if (node.inputs) {
              node.inputs.forEach(input => {
                if (input.required && !input.defaultValue) {
                  const hasConnection = workflow.edges?.some(edge =>
                    edge.targetNodeId === node.id && edge.targetInputId === input.id
                  );
                  
                  if (!hasConnection) {
                    errors.push({
                      id: `required_input_${node.id}_${input.id}`,
                      type: ValidationErrorType.WARNING,
                      code: 'MISSING_REQUIRED_INPUT',
                      message: `节点 "${node.name || '未命名节点'}" 缺少必需的输入 "${input.name || '未命名输入'}"`,
                      description: '必需的输入端口没有连接或默认值',
                      nodeId: node.id,
                      position: node.position,
                      suggestions: ['连接输入端口', '设置默认值'],
                      autoFixable: false,
                      severity: 6
                    });
                  }
                }
              });
            }
          });
          
          return errors;
        }
      },
      
      {
        id: 'data_type_compatibility',
        name: '数据类型兼容性检查',
        description: '检查连接的端口数据类型是否兼容',
        category: 'data_flow',
        enabled: true,
        severity: ValidationErrorType.WARNING,
        validate: (workflow) => {
          const errors: ValidationError[] = [];
          
          workflow.edges?.forEach(edge => {
            const sourceNode = workflow.nodes.find(n => n.id === edge.sourceNodeId);
            const targetNode = workflow.nodes.find(n => n.id === edge.targetNodeId);
            
            if (sourceNode && targetNode) {
              const sourcePort = sourceNode.outputs?.find(p => p.id === edge.sourceOutputId);
              const targetPort = targetNode.inputs?.find(p => p.id === edge.targetInputId);
              
              if (sourcePort && targetPort) {
                if (!this.isTypeCompatible(sourcePort.dataType, targetPort.dataType)) {
                  errors.push({
                    id: `type_mismatch_${edge.id}`,
                    type: ValidationErrorType.WARNING,
                    code: 'TYPE_MISMATCH',
                    message: '数据类型不匹配',
                    description: `输出类型 "${sourcePort.type}" 与输入类型 "${targetPort.type}" 不兼容`,
                    edgeId: edge.id,
                    suggestions: ['添加数据转换节点', '检查端口类型定义'],
                    autoFixable: false,
                    severity: 5
                  });
                }
              }
            }
          });
          
          return errors;
        }
      },
      
      {
        id: 'variable_usage',
        name: '变量使用检查',
        description: '检查变量的定义和使用',
        category: 'variables',
        enabled: true,
        severity: ValidationErrorType.INFO,
        validate: (workflow) => {
          const errors: ValidationError[] = [];
          const definedVariables = new Set(workflow.variables?.map(v => v.name) || []);
          const usedVariables = new Set<string>();
          
          // 收集使用的变量（这里需要根据实际的变量引用机制来实现）
          workflow.nodes.forEach(node => {
            // 检查节点配置中的变量引用
            const configStr = JSON.stringify(node.config || {});
            const variableMatches = configStr.match(/\$\{([^}]+)\}/g);
            
            if (variableMatches) {
              variableMatches.forEach(match => {
                const varName = match.slice(2, -1);
                usedVariables.add(varName);
                
                if (!definedVariables.has(varName)) {
                  errors.push({
                    id: `undefined_variable_${node.id}_${varName}`,
                    type: ValidationErrorType.WARNING,
                    code: 'UNDEFINED_VARIABLE',
                    message: `未定义的变量 "${varName}"`,
                    description: '节点引用了未定义的变量',
                    nodeId: node.id,
                    position: node.position,
                    suggestions: ['定义变量', '检查变量名拼写'],
                    autoFixable: false,
                    severity: 5
                  });
                }
              });
            }
          });
          
          // 检查未使用的变量
          definedVariables.forEach(varName => {
            if (!usedVariables.has(varName)) {
              errors.push({
                id: `unused_variable_${varName}`,
                type: ValidationErrorType.INFO,
                code: 'UNUSED_VARIABLE',
                message: `未使用的变量 "${varName}"`,
                description: '定义了但未使用的变量',
                suggestions: ['删除未使用的变量', '检查是否遗漏了变量引用'],
                autoFixable: true,
                severity: 2
              });
            }
          });
          
          return errors;
        }
      }
    ];
  }

  /**
   * 检查数据类型兼容性
   */
  private isTypeCompatible(sourceType: string, targetType: string): boolean {
    // 基本类型兼容性规则
    if (sourceType === targetType) return true;
    if (targetType === 'any') return true;
    if (sourceType === 'any') return true;
    
    // 数字类型兼容性
    if ((sourceType === 'number' || sourceType === 'integer') && 
        (targetType === 'number' || targetType === 'integer')) {
      return true;
    }
    
    // 字符串和其他类型的转换
    if (targetType === 'string') return true;
    
    return false;
  }

  /**
   * 验证工作流
   */
  public validateWorkflow(workflow: WorkflowDefinition): ValidationResult {
    const allErrors: ValidationError[] = [];
    
    // 执行所有启用的验证规则
    this.rules.concat(this.customRules).forEach(rule => {
      if (rule.enabled) {
        try {
          const ruleErrors = rule.validate(workflow);
          allErrors.push(...ruleErrors);
        } catch (error) {
          console.error(`验证规则 ${rule.id} 执行失败:`, error);
        }
      }
    });
    
    // 按类型分类错误
    const errors = allErrors.filter(e => e.type === ValidationErrorType.CRITICAL);
    const warnings = allErrors.filter(e => e.type === ValidationErrorType.WARNING);
    const infos = allErrors.filter(e => e.type === ValidationErrorType.INFO);
    
    // 计算质量分数
    const score = this.calculateQualityScore(errors, warnings, infos);
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      infos,
      score,
      summary: {
        totalIssues: allErrors.length,
        criticalCount: errors.length,
        warningCount: warnings.length,
        infoCount: infos.length
      }
    };
  }

  /**
   * 计算工作流质量分数
   */
  private calculateQualityScore(errors: ValidationError[], warnings: ValidationError[], infos: ValidationError[]): number {
    let score = 100;
    
    // 严重错误扣分更多
    errors.forEach(error => {
      score -= error.severity * 2;
    });
    
    // 警告扣分中等
    warnings.forEach(warning => {
      score -= warning.severity;
    });
    
    // 信息扣分较少
    infos.forEach(info => {
      score -= info.severity * 0.5;
    });
    
    return Math.max(0, Math.min(100, score));
  }

  /**
   * 添加自定义验证规则
   */
  public addCustomRule(rule: ValidationRule): void {
    this.customRules.push(rule);
  }

  /**
   * 移除自定义验证规则
   */
  public removeCustomRule(ruleId: string): void {
    this.customRules = this.customRules.filter(rule => rule.id !== ruleId);
  }

  /**
   * 启用/禁用验证规则
   */
  public toggleRule(ruleId: string, enabled: boolean): void {
    const rule = this.rules.find(r => r.id === ruleId) || 
                this.customRules.find(r => r.id === ruleId);
    if (rule) {
      rule.enabled = enabled;
    }
  }

  /**
   * 获取所有验证规则
   */
  public getAllRules(): ValidationRule[] {
    return [...this.rules, ...this.customRules];
  }

  /**
   * 自动修复可修复的错误
   */
  public autoFix(workflow: WorkflowDefinition, errors: ValidationError[]): WorkflowDefinition {
    const fixedWorkflow = JSON.parse(JSON.stringify(workflow));
    
    errors.forEach(error => {
      if (error.autoFixable) {
        switch (error.code) {
          case 'MISSING_NODE_NAME':
            if (error.nodeId) {
              const node = fixedWorkflow.nodes.find((n: WorkflowNode) => n.id === error.nodeId);
              if (node && (!node.name || node.name.trim() === '')) {
                node.name = `节点_${node.id.slice(-4)}`;
              }
            }
            break;
            
          case 'UNUSED_VARIABLE':
            const varName = error.message.match(/"([^"]+)"/)?.[1];
            if (varName) {
              fixedWorkflow.variables = fixedWorkflow.variables?.filter(
                (v: WorkflowVariable) => v.name !== varName
              ) || [];
            }
            break;
        }
      }
    });
    
    return fixedWorkflow;
  }

  /**
   * 实时验证（用于编辑时的即时反馈）
   */
  public validateRealtime(workflow: WorkflowDefinition, changedNodeId?: string): ValidationError[] {
    // 只运行快速验证规则，避免影响性能
    const quickRules = this.rules.filter(rule => 
      rule.category === 'structure' || rule.category === 'configuration'
    );
    
    const errors: ValidationError[] = [];
    
    quickRules.forEach(rule => {
      if (rule.enabled) {
        try {
          const ruleErrors = rule.validate(workflow);
          errors.push(...ruleErrors);
        } catch (error) {
          console.error(`实时验证规则 ${rule.id} 执行失败:`, error);
        }
      }
    });
    
    return errors;
  }
}

// 导出单例实例
export const workflowValidator = new WorkflowValidator();