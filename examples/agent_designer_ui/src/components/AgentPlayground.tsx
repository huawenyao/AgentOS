import React, { useState, useEffect, useRef } from 'react';
import { Card, Button, Select, Input, Progress, Tag, Space, Typography, Row, Col, Spin, Alert, Modal, Divider, List, Tooltip } from 'antd';
import { PlayCircleOutlined, StopOutlined, ReloadOutlined, RocketOutlined, BugOutlined, CheckCircleOutlined, TrophyOutlined, DownloadOutlined, LinkOutlined, EyeOutlined, FileTextOutlined, CodeOutlined, BarChartOutlined } from '@ant-design/icons';
import CollegeAdmissionAnalyzer from './CollegeAdmissionAnalyzer';
import './AgentPlayground.css';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;

interface AgentTask {
  id: string;
  name: string;
  description: string;
  category: string;
  estimatedTime: number;
  complexity: 'low' | 'medium' | 'high';
}

interface ExecutionStep {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  progress: number;
  output?: string;
  timestamp: number;
}

interface ExecutionResult {
  id: string;
  scenarioName: string;
  userInput: string;
  output: {
    type: 'text' | 'html' | 'json' | 'chart' | 'report';
    content: string;
    title: string;
    summary: string;
  };
  artifacts: {
    files: Array<{name: string, content: string, type: string}>;
    deployUrl?: string;
  };
  timestamp: number;
  executionTime: number;
}

interface SandboxState {
  isRunning: boolean;
  currentStep: number;
  steps: ExecutionStep[];
  totalProgress: number;
  logs: string[];
  result?: ExecutionResult;
}

// 预定义的Agent使用场景
const AGENT_SCENARIOS: AgentTask[] = [
  {
    id: 'data-analysis',
    name: '数据分析助手',
    description: '智能分析数据集，生成可视化报告和洞察',
    category: '数据科学',
    estimatedTime: 120,
    complexity: 'medium'
  },
  {
    id: 'code-review',
    name: '代码审查专家',
    description: '自动检测代码质量、安全漏洞和性能问题',
    category: '软件开发',
    estimatedTime: 90,
    complexity: 'high'
  },
  {
    id: 'content-generator',
    name: '内容创作大师',
    description: '根据主题和风格要求生成高质量文案内容',
    category: '创意写作',
    estimatedTime: 60,
    complexity: 'low'
  },
  {
    id: 'financial-advisor',
    name: '金融风控顾问',
    description: '分析投资组合风险，提供个性化理财建议',
    category: '金融服务',
    estimatedTime: 180,
    complexity: 'high'
  },
  {
    id: 'customer-service',
    name: '智能客服助手',
    description: '处理客户咨询，提供24/7专业服务支持',
    category: '客户服务',
    estimatedTime: 30,
    complexity: 'medium'
  },
  {
    id: 'research-assistant',
    name: '学术研究助理',
    description: '文献检索、数据收集和研究报告生成',
    category: '学术研究',
    estimatedTime: 240,
    complexity: 'high'
  }
];

const AgentPlayground: React.FC = () => {
  const [selectedScenario, setSelectedScenario] = useState<string>('');
  const [userInput, setUserInput] = useState<string>('');
  const [sandboxState, setSandboxState] = useState<SandboxState>({
    isRunning: false,
    currentStep: 0,
    steps: [],
    totalProgress: 0,
    logs: []
  });
  const [particles, setParticles] = useState<Array<{id: number, x: number, y: number, vx: number, vy: number}>>([]);
  const [showCollegeAnalyzer, setShowCollegeAnalyzer] = useState<boolean>(false);
  const [showResultModal, setShowResultModal] = useState<boolean>(false);
  const [executionStartTime, setExecutionStartTime] = useState<number>(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  // 粒子动画效果
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // 初始化粒子
    const initParticles = () => {
      const newParticles = [];
      for (let i = 0; i < 50; i++) {
        newParticles.push({
          id: i,
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 2,
          vy: (Math.random() - 0.5) * 2
        });
      }
      setParticles(newParticles);
    };

    initParticles();

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      setParticles(prevParticles => {
        return prevParticles.map(particle => {
          let newX = particle.x + particle.vx;
          let newY = particle.y + particle.vy;
          let newVx = particle.vx;
          let newVy = particle.vy;

          if (newX <= 0 || newX >= canvas.width) newVx = -newVx;
          if (newY <= 0 || newY >= canvas.height) newVy = -newVy;

          newX = Math.max(0, Math.min(canvas.width, newX));
          newY = Math.max(0, Math.min(canvas.height, newY));

          // 绘制粒子
          ctx.beginPath();
          ctx.arc(newX, newY, 2, 0, Math.PI * 2);
          ctx.fillStyle = sandboxState.isRunning ? '#00f5ff' : '#666';
          ctx.fill();

          return { ...particle, x: newX, y: newY, vx: newVx, vy: newVy };
        });
      });

      // 绘制连接线
      particles.forEach((particle, i) => {
        particles.slice(i + 1).forEach(otherParticle => {
          const distance = Math.sqrt(
            Math.pow(particle.x - otherParticle.x, 2) + 
            Math.pow(particle.y - otherParticle.y, 2)
          );
          
          if (distance < 100) {
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(otherParticle.x, otherParticle.y);
            ctx.strokeStyle = `rgba(0, 245, 255, ${0.3 * (1 - distance / 100)})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        });
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [particles, sandboxState.isRunning]);

  // 生成执行结果
  const generateExecutionResult = (scenario: AgentTask, userInput: string): ExecutionResult => {
    const resultId = `result_${Date.now()}`;
    const executionTime = Date.now() - executionStartTime;
    
    // 根据不同场景生成不同类型的结果
    let output, artifacts;
    
    switch (scenario.id) {
      case 'data-analysis':
        output = {
          type: 'report' as const,
          title: '数据分析报告',
          content: `
            <div style="padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; color: white;">
              <h2>📊 数据分析结果</h2>
              <p><strong>分析主题:</strong> ${userInput}</p>
              <div style="margin: 20px 0; padding: 15px; background: rgba(255,255,255,0.1); border-radius: 8px;">
                <h3>🔍 关键发现</h3>
                <ul>
                  <li>数据趋势显示明显的上升模式 (+23.5%)</li>
                  <li>异常值检测发现3个潜在问题点</li>
                  <li>相关性分析揭示了强正相关关系 (r=0.87)</li>
                </ul>
              </div>
              <div style="margin: 20px 0; padding: 15px; background: rgba(255,255,255,0.1); border-radius: 8px;">
                <h3>💡 建议行动</h3>
                <p>基于分析结果，建议优化数据收集流程并关注异常值处理机制。</p>
              </div>
            </div>
          `,
          summary: '完成数据分析，发现关键趋势和异常值，提供优化建议'
        };
        artifacts = {
          files: [
            { name: 'analysis_report.html', content: output.content, type: 'text/html' },
            { name: 'data_summary.json', content: JSON.stringify({trend: '+23.5%', anomalies: 3, correlation: 0.87}), type: 'application/json' }
          ],
          deployUrl: `http://localhost:3000/results/${resultId}/report.html`
        };
        break;
        
      case 'code-review':
        output = {
          type: 'html' as const,
          title: '代码审查报告',
          content: `
            <div style="padding: 20px; background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); border-radius: 12px; color: white;">
              <h2>🔍 代码审查结果</h2>
              <div style="margin: 20px 0; padding: 15px; background: rgba(255,255,255,0.1); border-radius: 8px;">
                <h3>⚠️ 发现的问题</h3>
                <ul>
                  <li><strong>安全漏洞:</strong> 2个高风险，5个中风险</li>
                  <li><strong>性能问题:</strong> 3个潜在瓶颈点</li>
                  <li><strong>代码质量:</strong> 12个改进建议</li>
                </ul>
              </div>
              <div style="margin: 20px 0; padding: 15px; background: rgba(255,255,255,0.1); border-radius: 8px;">
                <h3>✅ 修复建议</h3>
                <p>优先处理安全漏洞，优化数据库查询，重构重复代码块。</p>
              </div>
            </div>
          `,
          summary: '发现7个安全问题，3个性能瓶颈，提供详细修复方案'
        };
        artifacts = {
          files: [
            { name: 'security_report.html', content: output.content, type: 'text/html' },
            { name: 'fixes.patch', content: '// 修复补丁文件\n// 安全漏洞修复...', type: 'text/plain' }
          ]
        };
        break;
        
      case 'content-generator':
        output = {
          type: 'text' as const,
          title: '创作内容',
          content: `
            <div style="padding: 20px; background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%); border-radius: 12px; color: #333;">
              <h2>✍️ 创作结果</h2>
              <div style="margin: 20px 0; padding: 15px; background: rgba(255,255,255,0.7); border-radius: 8px;">
                <h3>📝 生成内容</h3>
                <p>基于您的需求「${userInput}」，我为您创作了以下内容：</p>
                <blockquote style="border-left: 4px solid #667eea; padding-left: 15px; margin: 15px 0; font-style: italic;">
                  这是一个充满创意和吸引力的内容示例，结合了您的具体需求和目标受众特点，
                  采用了现代化的表达方式和引人入胜的叙述结构...
                </blockquote>
              </div>
            </div>
          `,
          summary: '生成高质量创作内容，符合目标受众需求'
        };
        artifacts = {
          files: [
            { name: 'content.html', content: output.content, type: 'text/html' },
            { name: 'content.md', content: '# 创作内容\n\n生成的创作内容...', type: 'text/markdown' }
          ]
        };
        break;
        
      default:
        output = {
          type: 'text' as const,
          title: `${scenario.name}执行结果`,
          content: `
            <div style="padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; color: white;">
              <h2>🎯 执行完成</h2>
              <p><strong>任务:</strong> ${scenario.name}</p>
              <p><strong>输入:</strong> ${userInput}</p>
              <div style="margin: 20px 0; padding: 15px; background: rgba(255,255,255,0.1); border-radius: 8px;">
                <h3>✅ 执行结果</h3>
                <p>任务已成功完成，所有步骤均按预期执行。</p>
              </div>
            </div>
          `,
          summary: '任务执行完成，达到预期目标'
        };
        artifacts = {
          files: [
            { name: 'result.html', content: output.content, type: 'text/html' }
          ]
        };
    }
    
    return {
      id: resultId,
      scenarioName: scenario.name,
      userInput,
      output,
      artifacts,
      timestamp: Date.now(),
      executionTime
    };
  };

  // 模拟Agent执行过程
  const simulateAgentExecution = async (scenario: AgentTask) => {
    const steps: ExecutionStep[] = [
      { id: '1', name: '初始化Agent环境', status: 'pending', progress: 0, timestamp: Date.now() },
      { id: '2', name: '解析用户输入', status: 'pending', progress: 0, timestamp: Date.now() },
      { id: '3', name: '制定执行计划', status: 'pending', progress: 0, timestamp: Date.now() },
      { id: '4', name: '调用专业模块', status: 'pending', progress: 0, timestamp: Date.now() },
      { id: '5', name: '处理中间结果', status: 'pending', progress: 0, timestamp: Date.now() },
      { id: '6', name: '生成最终输出', status: 'pending', progress: 0, timestamp: Date.now() }
    ];

    setSandboxState({
      isRunning: true,
      currentStep: 0,
      steps,
      totalProgress: 0,
      logs: [`🚀 开始执行 ${scenario.name} 任务...`]
    });

    for (let i = 0; i < steps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
      
      setSandboxState(prev => {
        const newSteps = [...prev.steps];
        newSteps[i] = { ...newSteps[i], status: 'running' };
        
        const newLogs = [...prev.logs, `⚡ 正在执行: ${newSteps[i].name}`];
        
        return {
          ...prev,
          currentStep: i,
          steps: newSteps,
          logs: newLogs
        };
      });

      // 模拟进度更新
      for (let progress = 0; progress <= 100; progress += 10) {
        await new Promise(resolve => setTimeout(resolve, 100));
        setSandboxState(prev => {
          const newSteps = [...prev.steps];
          newSteps[i] = { ...newSteps[i], progress };
          return {
            ...prev,
            steps: newSteps,
            totalProgress: ((i * 100 + progress) / (steps.length * 100)) * 100
          };
        });
      }

      setSandboxState(prev => {
        const newSteps = [...prev.steps];
        newSteps[i] = { 
          ...newSteps[i], 
          status: 'completed',
          output: `步骤 ${i + 1} 执行完成 ✅`
        };
        
        const newLogs = [...prev.logs, `✅ 完成: ${newSteps[i].name}`];
        
        return {
          ...prev,
          steps: newSteps,
          logs: newLogs
        };
      });
    }

    // 生成执行结果
    const result = generateExecutionResult(scenario, userInput);
    
    setSandboxState(prev => ({
      ...prev,
      isRunning: false,
      result,
      logs: [...prev.logs, `🎉 ${scenario.name} 任务执行完成！`, `📋 生成结果报告和制品文件`]
    }));
    
    // 显示结果模态框
    setTimeout(() => {
      setShowResultModal(true);
    }, 1000);
  };

  const handleStartExecution = () => {
    const scenario = AGENT_SCENARIOS.find(s => s.id === selectedScenario);
    if (scenario && userInput.trim()) {
      setExecutionStartTime(Date.now());
      
      // 检查是否是数据分析助手且包含高考志愿相关关键词
      if (selectedScenario === 'data-analysis' && 
          (userInput.includes('高考') || userInput.includes('志愿') || userInput.includes('填报') || userInput.includes('分数'))) {
        setShowCollegeAnalyzer(true);
      } else {
        simulateAgentExecution(scenario);
      }
    }
  };

  const handleStopExecution = () => {
    setSandboxState(prev => ({
      ...prev,
      isRunning: false,
      logs: [...prev.logs, '⏹️ 执行已停止']
    }));
  };

  const handleReset = () => {
    setSandboxState({
      isRunning: false,
      currentStep: 0,
      steps: [],
      totalProgress: 0,
      logs: []
    });
    setUserInput('');
    setShowResultModal(false);
  };

  // 下载文件
  const handleDownloadFile = (file: {name: string, content: string, type: string}) => {
    const blob = new Blob([file.content], { type: file.type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 获取文件图标
  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'html': return <CodeOutlined style={{ color: '#e34c26' }} />;
      case 'json': return <FileTextOutlined style={{ color: '#f39c12' }} />;
      case 'md': return <FileTextOutlined style={{ color: '#2ecc71' }} />;
      case 'patch': return <CodeOutlined style={{ color: '#9b59b6' }} />;
      default: return <FileTextOutlined style={{ color: '#3498db' }} />;
    }
  };

  // 打开部署页面
  const handleOpenDeployedPage = (url: string) => {
    window.open(url, '_blank');
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'low': return 'green';
      case 'medium': return 'orange';
      case 'high': return 'red';
      default: return 'blue';
    }
  };

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'running': return <Spin  />;
      case 'completed': return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'error': return <BugOutlined style={{ color: '#ff4d4f' }} />;
      default: return <div className="step-pending" />;
    }
  };

  return (
    <div className="agent-playground">
      <canvas ref={canvasRef} className="particle-canvas" />
      
      <div className="playground-header">
        <Title level={2} className="playground-title">
          <RocketOutlined /> Agent 智能决策执行系统
        </Title>
        <Paragraph className="playground-subtitle">
          体验下一代AI Agent的强大能力，实时观察智能体的思考和执行过程
        </Paragraph>
      </div>

      <Row gutter={[24, 24]} className="playground-content">
        <Col xs={24} lg={12}>
          <Card title="🎯 场景选择" className="scenario-card">
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              <Select
                placeholder="选择一个Agent使用场景"
                style={{ width: '100%' }}
                value={selectedScenario}
                onChange={setSelectedScenario}
                size="large"
              >
                {AGENT_SCENARIOS.map(scenario => (
                  <Option key={scenario.id} value={scenario.id}>
                    <div className="scenario-option">
                      <div className="scenario-name">{scenario.name}</div>
                      <div className="scenario-meta">
                        <Tag color={getComplexityColor(scenario.complexity)}>
                          {scenario.complexity === 'low' ? '简单' : 
                           scenario.complexity === 'medium' ? '中等' : '复杂'}
                        </Tag>
                        <span className="scenario-time">~{scenario.estimatedTime}s</span>
                      </div>
                    </div>
                  </Option>
                ))}
              </Select>

              {selectedScenario && (
                <Card  className="scenario-detail">
                  {(() => {
                    const scenario = AGENT_SCENARIOS.find(s => s.id === selectedScenario);
                    return scenario ? (
                      <>
                        <Text strong>{scenario.name}</Text>
                        <br />
                        <Text type="secondary">{scenario.description}</Text>
                        <br />
                        <Tag color="blue" style={{ marginTop: 8 }}>{scenario.category}</Tag>
                      </>
                    ) : null;
                  })()} 
                </Card>
              )}

              <TextArea
                placeholder="请输入您的具体需求或问题..."
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                rows={4}
                disabled={sandboxState.isRunning}
              />

              <Space>
                <Button
                  type="primary"
                  icon={<PlayCircleOutlined />}
                  onClick={handleStartExecution}
                  disabled={!selectedScenario || !userInput.trim() || sandboxState.isRunning}
                  size="large"
                  className="start-button"
                >
                  启动Agent
                </Button>
                <Button
                  icon={<StopOutlined />}
                  onClick={handleStopExecution}
                  disabled={!sandboxState.isRunning}
                  size="large"
                >
                  停止
                </Button>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={handleReset}
                  size="large"
                >
                  重置
                </Button>
              </Space>
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="🔬 执行沙盒" className="sandbox-card">
            {sandboxState.steps.length > 0 && (
              <>
                <div className="progress-section">
                  <Text strong>总体进度</Text>
                  <Progress 
                    percent={Math.round(sandboxState.totalProgress)} 
                    status={sandboxState.isRunning ? 'active' : 'success'}
                    strokeColor={{
                      '0%': '#108ee9',
                      '100%': '#87d068',
                    }}
                  />
                </div>

                <div className="steps-section">
                  <Text strong>执行步骤</Text>
                  <div className="steps-container">
                    {sandboxState.steps.map((step, index) => (
                      <div 
                        key={step.id} 
                        className={`step-item ${step.status} ${index === sandboxState.currentStep ? 'current' : ''}`}
                      >
                        <div className="step-header">
                          <div className="step-icon">{getStepIcon(step.status)}</div>
                          <div className="step-info">
                            <div className="step-name">{step.name}</div>
                            {step.status === 'running' && (
                              <Progress 
                                percent={step.progress} 
                                 
                                status="active"
                                showInfo={false}
                              />
                            )}
                          </div>
                        </div>
                        {step.output && (
                          <div className="step-output">{step.output}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {sandboxState.logs.length > 0 && (
              <div className="logs-section">
                <Text strong>执行日志</Text>
                <div className="logs-container">
                  {sandboxState.logs.map((log, index) => (
                    <div key={index} className="log-item">
                      <span className="log-timestamp">
                        {new Date().toLocaleTimeString()}
                      </span>
                      <span className="log-content">{log}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {sandboxState.steps.length === 0 && (
              <div className="empty-sandbox">
                <RocketOutlined className="empty-icon" />
                <Text type="secondary">选择场景并启动Agent开始体验</Text>
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* 高考志愿填报专项分析器模态框 */}
      <Modal
        title={
          <Space>
            <TrophyOutlined style={{ color: '#00f5ff' }} />
            <span style={{ color: '#fff' }}>高考志愿填报智能分析</span>
          </Space>
        }
        open={showCollegeAnalyzer}
        onCancel={() => setShowCollegeAnalyzer(false)}
        footer={null}
        width="95%"
        style={{ top: 20 }}
        bodyStyle={{ 
          padding: 0, 
          background: 'transparent',
          maxHeight: '80vh',
          overflowY: 'auto'
        }}
        modalRender={(modal) => (
          <div style={{ 
            background: 'linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 50%, #16213e 100%)',
            borderRadius: '16px',
            border: '1px solid rgba(0, 245, 255, 0.3)'
          }}>
            {modal}
          </div>
        )}
      >
        <CollegeAdmissionAnalyzer />
      </Modal>

      {/* 执行结果展示模态框 */}
      <Modal
        title={
          <Space>
            <CheckCircleOutlined style={{ color: '#52c41a' }} />
            <span style={{ color: '#fff' }}>🎉 执行结果</span>
          </Space>
        }
        open={showResultModal}
        onCancel={() => setShowResultModal(false)}
        footer={[
          <Button key="close" onClick={() => setShowResultModal(false)}>
            关闭
          </Button>,
          sandboxState.result?.artifacts.deployUrl && (
            <Button 
              key="deploy" 
              type="primary" 
              icon={<LinkOutlined />}
              onClick={() => handleOpenDeployedPage(sandboxState.result!.artifacts.deployUrl!)}
            >
              访问部署页面
            </Button>
          )
        ]}
        width="90%"
        style={{ top: 20 }}
        bodyStyle={{ 
          maxHeight: '70vh',
          overflowY: 'auto',
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
          color: '#fff'
        }}
        modalRender={(modal) => (
          <div style={{ 
            background: 'linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 50%, #16213e 100%)',
            borderRadius: '16px',
            border: '1px solid rgba(82, 196, 26, 0.3)'
          }}>
            {modal}
          </div>
        )}
      >
        {sandboxState.result && (
          <div style={{ padding: '20px' }}>
            <Row gutter={[24, 24]}>
              <Col xs={24} lg={16}>
                <Card 
                  title={
                    <Space>
                      <EyeOutlined style={{ color: '#52c41a' }} />
                      <span>{sandboxState.result.output.title}</span>
                    </Space>
                  }
                  className="result-content-card"
                  style={{ 
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}
                  headStyle={{ 
                    background: 'rgba(82, 196, 26, 0.1)',
                    border: 'none',
                    color: '#fff'
                  }}
                  bodyStyle={{ 
                    background: 'transparent',
                    color: '#fff'
                  }}
                >
                  <div 
                    dangerouslySetInnerHTML={{ __html: sandboxState.result.output.content }}
                    style={{ minHeight: '200px' }}
                  />
                  
                  <Divider style={{ borderColor: 'rgba(255, 255, 255, 0.2)' }} />
                  
                  <div>
                    <Text strong style={{ color: '#52c41a' }}>📋 执行摘要：</Text>
                    <br />
                    <Text style={{ color: '#fff' }}>{sandboxState.result.output.summary}</Text>
                  </div>
                  
                  <div style={{ marginTop: 16 }}>
                    <Text strong style={{ color: '#52c41a' }}>⏱️ 执行信息：</Text>
                    <br />
                    <Space>
                      <Tag color="blue">场景: {sandboxState.result.scenarioName}</Tag>
                      <Tag color="green">耗时: {(sandboxState.result.executionTime / 1000).toFixed(1)}s</Tag>
                      <Tag color="orange">完成时间: {new Date(sandboxState.result.timestamp).toLocaleString()}</Tag>
                    </Space>
                  </div>
                </Card>
              </Col>
              
              <Col xs={24} lg={8}>
                <Card 
                  title={
                    <Space>
                      <DownloadOutlined style={{ color: '#1890ff' }} />
                      <span>制品文件</span>
                    </Space>
                  }
                  className="artifacts-card"
                  style={{ 
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}
                  headStyle={{ 
                    background: 'rgba(24, 144, 255, 0.1)',
                    border: 'none',
                    color: '#fff'
                  }}
                  bodyStyle={{ 
                    background: 'transparent',
                    color: '#fff'
                  }}
                >
                  <List
                    dataSource={sandboxState.result.artifacts.files}
                    renderItem={(file) => (
                      <List.Item
                        style={{ 
                          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                          padding: '12px 0'
                        }}
                        actions={[
                          <Tooltip title="下载文件">
                            <Button 
                              type="text" 
                              icon={<DownloadOutlined />} 
                              onClick={() => handleDownloadFile(file)}
                              style={{ color: '#1890ff' }}
                            />
                          </Tooltip>
                        ]}
                      >
                        <List.Item.Meta
                          avatar={getFileIcon(file.name)}
                          title={
                            <span style={{ color: '#fff' }}>{file.name}</span>
                          }
                          description={
                            <span style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                              {file.type}
                            </span>
                          }
                        />
                      </List.Item>
                    )}
                  />
                  
                  {sandboxState.result.artifacts.deployUrl && (
                    <>
                      <Divider style={{ borderColor: 'rgba(255, 255, 255, 0.2)' }} />
                      <div style={{ textAlign: 'center' }}>
                        <Button 
                          type="primary" 
                          icon={<LinkOutlined />}
                          onClick={() => handleOpenDeployedPage(sandboxState.result!.artifacts.deployUrl!)}
                          size="large"
                          style={{ 
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            border: 'none'
                          }}
                        >
                          🚀 访问部署页面
                        </Button>
                        <br />
                        <Text 
                          style={{ 
                            color: 'rgba(255, 255, 255, 0.6)', 
                            fontSize: '12px',
                            marginTop: '8px',
                            display: 'block'
                          }}
                        >
                          {sandboxState.result.artifacts.deployUrl}
                        </Text>
                      </div>
                    </>
                  )}
                </Card>
              </Col>
            </Row>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AgentPlayground;