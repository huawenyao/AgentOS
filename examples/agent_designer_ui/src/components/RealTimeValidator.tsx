import React, { useState, useEffect, useCallback } from 'react';
import {
  Card, Alert, List, Tag, Progress, Tooltip, Button, Modal, 
  Collapse, Space, Badge, Spin, Empty, Divider
} from 'antd';
import {
  CheckCircleOutlined, ExclamationCircleOutlined, CloseCircleOutlined,
  InfoCircleOutlined, ThunderboltOutlined, EyeOutlined, 
  PlayCircleOutlined, BugOutlined, WarningOutlined, BulbOutlined
} from '@ant-design/icons';
import {
  CoreCapabilityModule, Agent2_0, CapabilityOrchestrator,
  CoreCapabilityType, CapabilityMaturityLevel
} from './CapabilitySystemTypes';

interface RealTimeValidatorProps {
  agent: Agent2_0 | null;
  capabilities: CoreCapabilityModule[];
  orchestrator: CapabilityOrchestrator | null;
  onValidationChange: (isValid: boolean, errors: ValidationError[]) => void;
  visible: boolean;
  onClose: () => void;
}

interface ValidationError {
  id: string;
  type: 'error' | 'warning' | 'info';
  category: 'structure' | 'dependency' | 'performance' | 'security' | 'compatibility';
  title: string;
  description: string;
  suggestion?: string;
  autoFix?: () => void;
  severity: 'critical' | 'high' | 'medium' | 'low';
  affectedComponents: string[];
}

interface ValidationResult {
  isValid: boolean;
  score: number;
  errors: ValidationError[];
  warnings: ValidationError[];
  infos: ValidationError[];
  performance: PerformanceMetrics;
  security: SecurityMetrics;
}

interface PerformanceMetrics {
  estimatedResponseTime: number;
  resourceUsage: {
    cpu: number;
    memory: number;
    network: number;
  };
  throughput: number;
  scalability: 'poor' | 'fair' | 'good' | 'excellent';
}

interface SecurityMetrics {
  securityLevel: 'low' | 'medium' | 'high' | 'critical';
  vulnerabilities: string[];
  recommendations: string[];
  complianceScore: number;
}

interface PreviewData {
  flowDiagram: string;
  executionPath: string[];
  dataFlow: {
    input: any;
    processing: any[];
    output: any;
  };
  estimatedCost: {
    computational: number;
    storage: number;
    network: number;
    total: number;
  };
}

const { Panel } = Collapse;

const RealTimeValidator: React.FC<RealTimeValidatorProps> = ({
  agent,
  capabilities,
  orchestrator,
  onValidationChange,
  visible,
  onClose
}) => {
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [validating, setValidating] = useState(false);
  const [previewMode, setPreviewMode] = useState<'validation' | 'preview' | 'simulation'>('validation');
  const [simulationRunning, setSimulationRunning] = useState(false);
  const [simulationResults, setSimulationResults] = useState<any[]>([]);

  // 实时验证
  useEffect(() => {
    if (visible && agent) {
      validateAgent();
      generatePreview();
    }
  }, [visible, agent, capabilities, orchestrator]);

  /**
   * 验证Agent配置
   */
  const validateAgent = useCallback(async () => {
    if (!agent) return;

    setValidating(true);
    try {
      const errors: ValidationError[] = [];
      const warnings: ValidationError[] = [];
      const infos: ValidationError[] = [];

      // 结构验证
      if (!agent.name || agent.name.trim() === '') {
        errors.push({
          id: 'missing_name',
          type: 'error',
          category: 'structure',
          title: 'Agent名称缺失',
          description: 'Agent必须有一个有效的名称',
          suggestion: '请为Agent设置一个描述性的名称',
          severity: 'high',
          affectedComponents: ['agent']
        });
      }

      if (!agent.description || agent.description.trim() === '') {
        warnings.push({
          id: 'missing_description',
          type: 'warning',
          category: 'structure',
          title: 'Agent描述缺失',
          description: '建议为Agent添加详细描述以便理解其用途',
          suggestion: '添加清晰的Agent功能描述',
          severity: 'medium',
          affectedComponents: ['agent']
        });
      }

      // 能力验证
      if (capabilities.length === 0) {
        errors.push({
          id: 'no_capabilities',
          type: 'error',
          category: 'structure',
          title: '缺少能力模块',
          description: 'Agent至少需要一个能力模块才能正常工作',
          suggestion: '从能力库中添加至少一个核心能力',
          severity: 'critical',
          affectedComponents: ['capabilities']
        });
      }

      // 依赖验证
      const dependencyErrors = validateDependencies();
      errors.push(...dependencyErrors.filter(e => e.type === 'error'));
      warnings.push(...dependencyErrors.filter(e => e.type === 'warning'));

      // 性能验证
      const performanceIssues = validatePerformance();
      warnings.push(...performanceIssues);

      // 安全验证
      const securityIssues = validateSecurity();
      errors.push(...securityIssues.filter(e => e.type === 'error'));
      warnings.push(...securityIssues.filter(e => e.type === 'warning'));
      infos.push(...securityIssues.filter(e => e.type === 'info'));

      // 兼容性验证
      const compatibilityIssues = validateCompatibility();
      warnings.push(...compatibilityIssues);

      // 计算性能指标
      const performance = calculatePerformanceMetrics();
      
      // 计算安全指标
      const security = calculateSecurityMetrics();

      // 计算总体分数
      const score = calculateOverallScore(errors, warnings, infos);

      const result: ValidationResult = {
        isValid: errors.length === 0,
        score,
        errors,
        warnings,
        infos,
        performance,
        security
      };

      setValidationResult(result);
      onValidationChange(result.isValid, [...errors, ...warnings, ...infos]);

    } catch (error) {
      console.error('验证失败:', error);
    } finally {
      setValidating(false);
    }
  }, [agent, capabilities, orchestrator]);

  /**
   * 验证依赖关系
   */
  const validateDependencies = (): ValidationError[] => {
    const issues: ValidationError[] = [];
    const capabilityIds = capabilities.map(c => c.id);

    capabilities.forEach(cap => {
      cap.dependencies.forEach(dep => {
        if (dep.type === 'required' && !capabilityIds.includes(dep.capabilityId)) {
          issues.push({
            id: `missing_dependency_${cap.id}_${dep.capabilityId}`,
            type: 'error',
            category: 'dependency',
            title: '缺少必需依赖',
            description: `能力"${cap.name}"需要依赖"${dep.capabilityId}"`,
            suggestion: '添加所需的依赖能力或移除当前能力',
            severity: 'high',
            affectedComponents: [cap.id]
          });
        }
        
        if (dep.type === 'optional' && !capabilityIds.includes(dep.capabilityId)) {
          issues.push({
            id: `optional_dependency_${cap.id}_${dep.capabilityId}`,
            type: 'warning',
            category: 'dependency',
            title: '缺少可选依赖',
            description: `能力"${cap.name}"建议添加依赖"${dep.capabilityId}"以获得更好的性能`,
            suggestion: '考虑添加可选依赖以增强功能',
            severity: 'medium',
            affectedComponents: [cap.id]
          });
        }
      });
    });

    // 检查循环依赖
    const circularDeps = detectCircularDependencies();
    circularDeps.forEach(cycle => {
      issues.push({
        id: `circular_dependency_${cycle.join('_')}`,
        type: 'error',
        category: 'dependency',
        title: '检测到循环依赖',
        description: `能力之间存在循环依赖: ${cycle.join(' -> ')}`,
        suggestion: '重新设计能力架构以消除循环依赖',
        severity: 'critical',
        affectedComponents: cycle
      });
    });

    return issues;
  };

  /**
   * 检测循环依赖
   */
  const detectCircularDependencies = (): string[][] => {
    const cycles: string[][] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const dfs = (capId: string, path: string[]): void => {
      if (recursionStack.has(capId)) {
        const cycleStart = path.indexOf(capId);
        if (cycleStart !== -1) {
          cycles.push(path.slice(cycleStart));
        }
        return;
      }

      if (visited.has(capId)) return;

      visited.add(capId);
      recursionStack.add(capId);

      const capability = capabilities.find(c => c.id === capId);
      if (capability) {
        capability.dependencies.forEach(dep => {
          dfs(dep.capabilityId, [...path, capId]);
        });
      }

      recursionStack.delete(capId);
    };

    capabilities.forEach(cap => {
      if (!visited.has(cap.id)) {
        dfs(cap.id, []);
      }
    });

    return cycles;
  };

  /**
   * 验证性能
   */
  const validatePerformance = (): ValidationError[] => {
    const issues: ValidationError[] = [];

    // 检查资源使用
    const totalCpu = capabilities.reduce((sum, cap) => {
      const cpuResource = cap.resources.find(r => r.type === 'cpu');
      return sum + (cpuResource ? cpuResource.amount : 0);
    }, 0);

    const totalMemory = capabilities.reduce((sum, cap) => {
      const memResource = cap.resources.find(r => r.type === 'memory');
      return sum + (memResource ? memResource.amount : 0);
    }, 0);

    if (totalCpu > 8) {
      issues.push({
        id: 'high_cpu_usage',
        type: 'warning',
        category: 'performance',
        title: 'CPU使用率过高',
        description: `预计CPU使用率: ${totalCpu} cores，可能影响性能`,
        suggestion: '考虑优化能力配置或增加计算资源',
        severity: 'medium',
        affectedComponents: capabilities.map(c => c.id)
      });
    }

    if (totalMemory > 16) {
      issues.push({
        id: 'high_memory_usage',
        type: 'warning',
        category: 'performance',
        title: '内存使用率过高',
        description: `预计内存使用: ${totalMemory} GB，可能导致性能问题`,
        suggestion: '优化内存使用或增加内存资源',
        severity: 'medium',
        affectedComponents: capabilities.map(c => c.id)
      });
    }

    // 检查超时配置
    capabilities.forEach(cap => {
      if (cap.config.timeout > 60000) {
        issues.push({
          id: `long_timeout_${cap.id}`,
          type: 'warning',
          category: 'performance',
          title: '超时时间过长',
          description: `能力"${cap.name}"的超时时间为${cap.config.timeout}ms，可能影响响应性`,
          suggestion: '考虑减少超时时间或优化处理逻辑',
          severity: 'low',
          affectedComponents: [cap.id]
        });
      }
    });

    return issues;
  };

  /**
   * 验证安全性
   */
  const validateSecurity = (): ValidationError[] => {
    const issues: ValidationError[] = [];

    capabilities.forEach(cap => {
      // 检查安全级别
      if (cap.config.securityLevel === 'low') {
        issues.push({
          id: `low_security_${cap.id}`,
          type: 'warning',
          category: 'security',
          title: '安全级别较低',
          description: `能力"${cap.name}"的安全级别为低，可能存在安全风险`,
          suggestion: '提升安全级别并启用相应的安全措施',
          severity: 'medium',
          affectedComponents: [cap.id]
        });
      }

      // 检查访问控制
      if (!cap.config.accessControl.authentication) {
        issues.push({
          id: `no_auth_${cap.id}`,
          type: 'error',
          category: 'security',
          title: '缺少身份验证',
          description: `能力"${cap.name}"未启用身份验证`,
          suggestion: '启用身份验证以保护能力访问',
          severity: 'high',
          affectedComponents: [cap.id]
        });
      }

      if (!cap.config.accessControl.encryption) {
        issues.push({
          id: `no_encryption_${cap.id}`,
          type: 'warning',
          category: 'security',
          title: '缺少数据加密',
          description: `能力"${cap.name}"未启用数据加密`,
          suggestion: '启用数据加密以保护敏感信息',
          severity: 'medium',
          affectedComponents: [cap.id]
        });
      }
    });

    return issues;
  };

  /**
   * 验证兼容性
   */
  const validateCompatibility = (): ValidationError[] => {
    const issues: ValidationError[] = [];

    // 检查能力版本兼容性
    const versionConflicts = checkVersionCompatibility();
    versionConflicts.forEach(conflict => {
      issues.push({
        id: `version_conflict_${conflict.cap1}_${conflict.cap2}`,
        type: 'warning',
        category: 'compatibility',
        title: '版本兼容性问题',
        description: `能力"${conflict.cap1}"和"${conflict.cap2}"可能存在版本兼容性问题`,
        suggestion: '检查能力版本并更新到兼容版本',
        severity: 'medium',
        affectedComponents: [conflict.cap1, conflict.cap2]
      });
    });

    return issues;
  };

  /**
   * 检查版本兼容性
   */
  const checkVersionCompatibility = () => {
    // 简化的版本兼容性检查
    const conflicts: Array<{cap1: string, cap2: string}> = [];
    
    for (let i = 0; i < capabilities.length; i++) {
      for (let j = i + 1; j < capabilities.length; j++) {
        const cap1 = capabilities[i];
        const cap2 = capabilities[j];
        
        // 检查是否有已知的不兼容组合
        if (hasKnownIncompatibility(cap1, cap2)) {
          conflicts.push({ cap1: cap1.id, cap2: cap2.id });
        }
      }
    }
    
    return conflicts;
  };

  /**
   * 检查已知的不兼容性
   */
  const hasKnownIncompatibility = (cap1: CoreCapabilityModule, cap2: CoreCapabilityModule): boolean => {
    // 简化的不兼容性检查逻辑
    const majorVersion1 = parseInt(cap1.version.split('.')[0]);
    const majorVersion2 = parseInt(cap2.version.split('.')[0]);
    
    // 如果主版本号相差超过2，可能存在兼容性问题
    return Math.abs(majorVersion1 - majorVersion2) > 2;
  };

  /**
   * 计算性能指标
   */
  const calculatePerformanceMetrics = (): PerformanceMetrics => {
    const avgResponseTime = capabilities.reduce((sum, cap) => {
      return sum + (cap.metrics?.avgResponseTime || 1000);
    }, 0) / capabilities.length;

    const totalCpu = capabilities.reduce((sum, cap) => {
      const cpuResource = cap.resources.find(r => r.type === 'cpu');
      return sum + (cpuResource ? cpuResource.amount : 1);
    }, 0);

    const totalMemory = capabilities.reduce((sum, cap) => {
      const memResource = cap.resources.find(r => r.type === 'memory');
      return sum + (memResource ? memResource.amount : 512);
    }, 0);

    const avgThroughput = capabilities.reduce((sum, cap) => {
      return sum + (cap.metrics?.throughput || 50);
    }, 0) / capabilities.length;

    let scalability: 'poor' | 'fair' | 'good' | 'excellent' = 'good';
    if (totalCpu > 8 || totalMemory > 16) scalability = 'poor';
    else if (totalCpu > 4 || totalMemory > 8) scalability = 'fair';
    else if (avgThroughput > 100) scalability = 'excellent';

    return {
      estimatedResponseTime: avgResponseTime,
      resourceUsage: {
        cpu: totalCpu,
        memory: totalMemory,
        network: capabilities.length * 10 // 简化计算
      },
      throughput: avgThroughput,
      scalability
    };
  };

  /**
   * 计算安全指标
   */
  const calculateSecurityMetrics = (): SecurityMetrics => {
    const securityLevels = capabilities.map(c => c.config.securityLevel);
    const hasHighSecurity = securityLevels.includes('high');
    const hasLowSecurity = securityLevels.includes('low');
    
    let securityLevel: 'low' | 'medium' | 'high' | 'critical' = 'medium';
    if (hasLowSecurity) securityLevel = 'low';
    else if (hasHighSecurity) securityLevel = 'high';

    const vulnerabilities: string[] = [];
    const recommendations: string[] = [];

    capabilities.forEach(cap => {
      if (!cap.config.accessControl.authentication) {
        vulnerabilities.push(`${cap.name}: 缺少身份验证`);
        recommendations.push(`为${cap.name}启用身份验证`);
      }
      if (!cap.config.accessControl.encryption) {
        vulnerabilities.push(`${cap.name}: 缺少数据加密`);
        recommendations.push(`为${cap.name}启用数据加密`);
      }
    });

    const complianceScore = Math.max(0, 100 - vulnerabilities.length * 10);

    return {
      securityLevel,
      vulnerabilities,
      recommendations,
      complianceScore
    };
  };

  /**
   * 计算总体分数
   */
  const calculateOverallScore = (errors: ValidationError[], warnings: ValidationError[], infos: ValidationError[]): number => {
    let score = 100;
    
    errors.forEach(error => {
      switch (error.severity) {
        case 'critical': score -= 25; break;
        case 'high': score -= 15; break;
        case 'medium': score -= 10; break;
        case 'low': score -= 5; break;
      }
    });
    
    warnings.forEach(warning => {
      switch (warning.severity) {
        case 'high': score -= 8; break;
        case 'medium': score -= 5; break;
        case 'low': score -= 2; break;
      }
    });
    
    return Math.max(0, score);
  };

  /**
   * 生成预览数据
   */
  const generatePreview = async () => {
    if (!agent || capabilities.length === 0) return;

    try {
      const executionPath = capabilities.map(cap => cap.name);
      
      const estimatedCost = {
        computational: capabilities.reduce((sum, cap) => {
          const cpuResource = cap.resources.find(r => r.type === 'cpu');
          return sum + (cpuResource ? cpuResource.amount * 0.1 : 0.05); // 每核心每小时0.1美元
        }, 0),
        storage: capabilities.length * 0.01, // 每个能力0.01美元存储
        network: capabilities.length * 0.005, // 每个能力0.005美元网络
        total: 0
      };
      estimatedCost.total = estimatedCost.computational + estimatedCost.storage + estimatedCost.network;

      const preview: PreviewData = {
        flowDiagram: 'Generated flow diagram', // 实际应用中生成流程图
        executionPath,
        dataFlow: {
          input: { type: 'multimodal', data: 'sample input' },
          processing: capabilities.map(cap => ({ capability: cap.name, status: 'ready' })),
          output: { type: 'structured', data: 'processed result' }
        },
        estimatedCost
      };

      setPreviewData(preview);
    } catch (error) {
      console.error('生成预览失败:', error);
    }
  };

  /**
   * 运行模拟
   */
  const runSimulation = async () => {
    setSimulationRunning(true);
    setSimulationResults([]);

    try {
      // 模拟执行过程
      for (let i = 0; i < capabilities.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const result = {
          step: i + 1,
          capability: capabilities[i].name,
          status: Math.random() > 0.1 ? 'success' : 'warning',
          duration: Math.round(Math.random() * 2000 + 500),
          output: `模拟输出 ${i + 1}`
        };
        
        setSimulationResults(prev => [...prev, result]);
      }
    } catch (error) {
      console.error('模拟执行失败:', error);
    } finally {
      setSimulationRunning(false);
    }
  };

  /**
   * 获取严重程度颜色
   */
  const getSeverityColor = (severity: string) => {
    const colors = {
      critical: '#ff4d4f',
      high: '#ff7a45',
      medium: '#faad14',
      low: '#52c41a'
    };
    return colors[severity as keyof typeof colors] || '#d9d9d9';
  };

  /**
   * 获取严重程度图标
   */
  const getSeverityIcon = (type: string) => {
    const icons = {
      error: <CloseCircleOutlined />,
      warning: <ExclamationCircleOutlined />,
      info: <InfoCircleOutlined />
    };
    return icons[type as keyof typeof icons] || <InfoCircleOutlined />;
  };

  /**
   * 渲染验证结果
   */
  const renderValidationResults = () => {
    if (!validationResult) return <Empty description="暂无验证结果" />;

    const { score, errors, warnings, infos, performance, security } = validationResult;

    return (
      <div className="validation-results">
        {/* 总体评分 */}
        <Card size="small" className="score-card">
          <div className="score-display">
            <Progress
              type="circle"
              percent={score}
              format={percent => `${percent}分`}
              strokeColor={score >= 80 ? '#52c41a' : score >= 60 ? '#faad14' : '#ff4d4f'}
              size={80}
            />
            <div className="score-info">
              <h3>配置质量评分</h3>
              <p>{score >= 80 ? '优秀' : score >= 60 ? '良好' : '需要改进'}</p>
            </div>
          </div>
        </Card>

        {/* 问题列表 */}
        <Collapse defaultActiveKey={['errors']} className="issues-collapse">
          {errors.length > 0 && (
            <Panel 
              header={
                <Space>
                  <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
                  <span>错误 ({errors.length})</span>
                </Space>
              } 
              key="errors"
            >
              <List
                size="small"
                dataSource={errors}
                renderItem={(error) => (
                  <List.Item
                    actions={[
                      error.autoFix && (
                        <Button size="small" onClick={error.autoFix}>
                          自动修复
                        </Button>
                      )
                    ].filter(Boolean)}
                  >
                    <List.Item.Meta
                      avatar={getSeverityIcon(error.type)}
                      title={
                        <Space>
                          <span>{error.title}</span>
                          <Tag color={getSeverityColor(error.severity)}>
                            {error.severity}
                          </Tag>
                        </Space>
                      }
                      description={
                        <div>
                          <p>{error.description}</p>
                          {error.suggestion && (
                            <p className="suggestion">
                              <BulbOutlined /> {error.suggestion}
                            </p>
                          )}
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            </Panel>
          )}

          {warnings.length > 0 && (
            <Panel 
              header={
                <Space>
                  <ExclamationCircleOutlined style={{ color: '#faad14' }} />
                  <span>警告 ({warnings.length})</span>
                </Space>
              } 
              key="warnings"
            >
              <List
                size="small"
                dataSource={warnings}
                renderItem={(warning) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={getSeverityIcon(warning.type)}
                      title={
                        <Space>
                          <span>{warning.title}</span>
                          <Tag color={getSeverityColor(warning.severity)}>
                            {warning.severity}
                          </Tag>
                        </Space>
                      }
                      description={
                        <div>
                          <p>{warning.description}</p>
                          {warning.suggestion && (
                            <p className="suggestion">
                              <BulbOutlined /> {warning.suggestion}
                            </p>
                          )}
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            </Panel>
          )}
        </Collapse>

        {/* 性能指标 */}
        <Card size="small" title="性能指标" className="metrics-card">
          <div className="metrics-grid">
            <div className="metric-item">
              <span className="metric-label">预计响应时间</span>
              <span className="metric-value">{performance.estimatedResponseTime}ms</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">CPU使用</span>
              <span className="metric-value">{performance.resourceUsage.cpu} cores</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">内存使用</span>
              <span className="metric-value">{performance.resourceUsage.memory} GB</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">吞吐量</span>
              <span className="metric-value">{performance.throughput} req/s</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">可扩展性</span>
              <Tag color={performance.scalability === 'excellent' ? 'green' : performance.scalability === 'good' ? 'blue' : 'orange'}>
                {performance.scalability}
              </Tag>
            </div>
          </div>
        </Card>

        {/* 安全指标 */}
        <Card size="small" title="安全指标" className="security-card">
          <div className="security-info">
            <div className="security-level">
              <span>安全级别: </span>
              <Tag color={security.securityLevel === 'high' ? 'green' : security.securityLevel === 'medium' ? 'blue' : 'red'}>
                {security.securityLevel}
              </Tag>
            </div>
            <div className="compliance-score">
              <span>合规评分: </span>
              <Progress 
                percent={security.complianceScore} 
                size="small" 
                strokeColor={security.complianceScore >= 80 ? '#52c41a' : '#faad14'}
              />
            </div>
            {security.vulnerabilities.length > 0 && (
              <div className="vulnerabilities">
                <p><WarningOutlined /> 发现 {security.vulnerabilities.length} 个安全问题</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    );
  };

  /**
   * 渲染预览内容
   */
  const renderPreview = () => {
    if (!previewData) return <Empty description="暂无预览数据" />;

    return (
      <div className="preview-content">
        <Card size="small" title="执行路径" className="execution-path-card">
          <div className="execution-path">
            {previewData.executionPath.map((step, index) => (
              <div key={index} className="path-step">
                <div className="step-number">{index + 1}</div>
                <div className="step-name">{step}</div>
                {index < previewData.executionPath.length - 1 && (
                  <div className="step-arrow">→</div>
                )}
              </div>
            ))}
          </div>
        </Card>

        <Card size="small" title="数据流" className="data-flow-card">
          <div className="data-flow">
            <div className="flow-stage">
              <h4>输入</h4>
              <pre>{JSON.stringify(previewData.dataFlow.input, null, 2)}</pre>
            </div>
            <div className="flow-stage">
              <h4>处理</h4>
              <List
                size="small"
                dataSource={previewData.dataFlow.processing}
                renderItem={(item: any) => (
                  <List.Item>
                    <Badge status="processing" text={item.capability} />
                  </List.Item>
                )}
              />
            </div>
            <div className="flow-stage">
              <h4>输出</h4>
              <pre>{JSON.stringify(previewData.dataFlow.output, null, 2)}</pre>
            </div>
          </div>
        </Card>

        <Card size="small" title="成本估算" className="cost-card">
          <div className="cost-breakdown">
            <div className="cost-item">
              <span>计算成本:</span>
              <span>${previewData.estimatedCost.computational.toFixed(3)}/小时</span>
            </div>
            <div className="cost-item">
              <span>存储成本:</span>
              <span>${previewData.estimatedCost.storage.toFixed(3)}/月</span>
            </div>
            <div className="cost-item">
              <span>网络成本:</span>
              <span>${previewData.estimatedCost.network.toFixed(3)}/GB</span>
            </div>
            <Divider />
            <div className="cost-total">
              <span>预计总成本:</span>
              <span className="total-amount">${previewData.estimatedCost.total.toFixed(3)}</span>
            </div>
          </div>
        </Card>
      </div>
    );
  };

  /**
   * 渲染模拟内容
   */
  const renderSimulation = () => (
    <div className="simulation-content">
      <div className="simulation-controls">
        <Button 
          type="primary" 
          icon={<PlayCircleOutlined />}
          onClick={runSimulation}
          loading={simulationRunning}
          disabled={capabilities.length === 0}
        >
          {simulationRunning ? '模拟运行中...' : '开始模拟'}
        </Button>
      </div>

      {simulationResults.length > 0 && (
        <Card size="small" title="模拟结果" className="simulation-results">
          <List
            dataSource={simulationResults}
            renderItem={(result: any) => (
              <List.Item>
                <List.Item.Meta
                  avatar={
                    <Badge 
                      status={result.status === 'success' ? 'success' : 'warning'} 
                      text={`步骤 ${result.step}`}
                    />
                  }
                  title={result.capability}
                  description={
                    <Space>
                      <span>耗时: {result.duration}ms</span>
                      <span>输出: {result.output}</span>
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        </Card>
      )}

      {simulationRunning && (
        <div className="simulation-progress">
          <Spin size="large" />
          <p>正在模拟Agent执行过程...</p>
        </div>
      )}
    </div>
  );

  return (
    <Modal
      title="实时验证与预览"
      open={visible}
      onCancel={onClose}
      footer={null}
      width={900}
      className="realtime-validator-modal"
    >
      <div className="validator-content">
        <div className="validator-tabs">
          <div className="tab-buttons">
            <Button 
              type={previewMode === 'validation' ? 'primary' : 'default'}
              onClick={() => setPreviewMode('validation')}
              icon={<CheckCircleOutlined />}
            >
              验证结果
            </Button>
            <Button 
              type={previewMode === 'preview' ? 'primary' : 'default'}
              onClick={() => setPreviewMode('preview')}
              icon={<EyeOutlined />}
            >
              预览
            </Button>
            <Button 
              type={previewMode === 'simulation' ? 'primary' : 'default'}
              onClick={() => setPreviewMode('simulation')}
              icon={<BugOutlined />}
            >
              模拟测试
            </Button>
          </div>
          
          <div className="tab-content">
            {validating && (
              <div className="validation-loading">
                <Spin size="large" />
                <p>正在验证Agent配置...</p>
              </div>
            )}
            
            {!validating && (
              <>
                {previewMode === 'validation' && renderValidationResults()}
                {previewMode === 'preview' && renderPreview()}
                {previewMode === 'simulation' && renderSimulation()}
              </>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default RealTimeValidator;