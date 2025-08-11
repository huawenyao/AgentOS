import React, { useState, useEffect, useRef } from 'react';
import { Card, Button, Input, Progress, Tag, Space, Typography, Row, Col, Spin, Alert, Table, Statistic, Divider } from 'antd';
import { PlayCircleOutlined, StopOutlined, ReloadOutlined, TrophyOutlined, BookOutlined, BarChartOutlined, BulbOutlined } from '@ant-design/icons';
import './CollegeAdmissionAnalyzer.css';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

// 高考志愿填报相关数据结构
interface CollegeInfo {
  id: string;
  name: string;
  location: string;
  type: '985' | '211' | '双一流' | '普通本科';
  minScore2023: number;
  minScore2022: number;
  minScore2021: number;
  ranking: number;
  majorStrengths: string[];
  admissionRate: number;
}

interface AnalysisStep {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  progress: number;
  output?: string;
  data?: any;
  timestamp: number;
  duration?: number;
}

interface StudentProfile {
  score: number;
  province: string;
  category: '理科' | '文科' | '新高考';
  ranking?: number;
  preferences: string[];
}

interface AnalysisResult {
  recommendedColleges: CollegeInfo[];
  riskAnalysis: {
    safe: CollegeInfo[];
    moderate: CollegeInfo[];
    reach: CollegeInfo[];
  };
  trendAnalysis: {
    scoreTrend: number[];
    admissionTrend: string;
  };
  strategicAdvice: string[];
}

// 模拟高校数据
const MOCK_COLLEGES: CollegeInfo[] = [
  {
    id: 'tsinghua',
    name: '清华大学',
    location: '北京',
    type: '985',
    minScore2023: 685,
    minScore2022: 687,
    minScore2021: 684,
    ranking: 1,
    majorStrengths: ['计算机科学', '工程学', '物理学'],
    admissionRate: 0.02
  },
  {
    id: 'peking',
    name: '北京大学',
    location: '北京',
    type: '985',
    minScore2023: 683,
    minScore2022: 685,
    minScore2021: 682,
    ranking: 2,
    majorStrengths: ['文学', '哲学', '数学'],
    admissionRate: 0.025
  },
  {
    id: 'fudan',
    name: '复旦大学',
    location: '上海',
    type: '985',
    minScore2023: 675,
    minScore2022: 677,
    minScore2021: 673,
    ranking: 3,
    majorStrengths: ['医学', '经济学', '新闻学'],
    admissionRate: 0.03
  },
  {
    id: 'sjtu',
    name: '上海交通大学',
    location: '上海',
    type: '985',
    minScore2023: 673,
    minScore2022: 675,
    minScore2021: 671,
    ranking: 4,
    majorStrengths: ['机械工程', '电子信息', '船舶工程'],
    admissionRate: 0.035
  },
  {
    id: 'zju',
    name: '浙江大学',
    location: '浙江',
    type: '985',
    minScore2023: 670,
    minScore2022: 672,
    minScore2021: 668,
    ranking: 5,
    majorStrengths: ['计算机科学', '控制科学', '光学工程'],
    admissionRate: 0.04
  },
  {
    id: 'nanjing',
    name: '南京大学',
    location: '江苏',
    type: '985',
    minScore2023: 665,
    minScore2022: 667,
    minScore2021: 663,
    ranking: 6,
    majorStrengths: ['物理学', '化学', '地质学'],
    admissionRate: 0.045
  },
  {
    id: 'hust',
    name: '华中科技大学',
    location: '湖北',
    type: '985',
    minScore2023: 650,
    minScore2022: 652,
    minScore2021: 648,
    ranking: 10,
    majorStrengths: ['机械工程', '光学工程', '医学'],
    admissionRate: 0.06
  },
  {
    id: 'buaa',
    name: '北京航空航天大学',
    location: '北京',
    type: '985',
    minScore2023: 645,
    minScore2022: 647,
    minScore2021: 643,
    ranking: 12,
    majorStrengths: ['航空航天', '计算机科学', '自动化'],
    admissionRate: 0.065
  }
];

const CollegeAdmissionAnalyzer: React.FC = () => {
  const [studentProfile, setStudentProfile] = useState<StudentProfile>({
    score: 0,
    province: '',
    category: '理科',
    preferences: []
  });
  const [analysisSteps, setAnalysisSteps] = useState<AnalysisStep[]>([]);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [totalProgress, setTotalProgress] = useState(0);
  const [waterfallNodes, setWaterfallNodes] = useState<Array<{id: string, x: number, y: number, status: string, data?: any}>>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  // 瀑布式可视化效果
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

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // 绘制瀑布式数据流
      waterfallNodes.forEach((node, index) => {
        const alpha = node.status === 'active' ? 1 : 0.3;
        
        // 绘制节点
        ctx.beginPath();
        ctx.arc(node.x, node.y, 8, 0, Math.PI * 2);
        ctx.fillStyle = node.status === 'completed' ? `rgba(82, 196, 26, ${alpha})` : 
                       node.status === 'active' ? `rgba(24, 144, 255, ${alpha})` : 
                       `rgba(140, 140, 140, ${alpha})`;
        ctx.fill();
        
        // 绘制连接线
        if (index < waterfallNodes.length - 1) {
          const nextNode = waterfallNodes[index + 1];
          ctx.beginPath();
          ctx.moveTo(node.x, node.y);
          ctx.lineTo(nextNode.x, nextNode.y);
          ctx.strokeStyle = `rgba(24, 144, 255, ${alpha * 0.5})`;
          ctx.lineWidth = 2;
          ctx.stroke();
        }
        
        // 绘制数据粒子效果
        if (node.status === 'active') {
          for (let i = 0; i < 5; i++) {
            const particleX = node.x + Math.sin(Date.now() * 0.01 + i) * 20;
            const particleY = node.y + Math.cos(Date.now() * 0.01 + i) * 20;
            ctx.beginPath();
            ctx.arc(particleX, particleY, 2, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(0, 245, 255, ${0.8 * Math.sin(Date.now() * 0.02 + i)})`;
            ctx.fill();
          }
        }
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
  }, [waterfallNodes]);

  // 初始化瀑布式节点
  const initializeWaterfallNodes = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const nodes = [
      { id: 'input', x: 100, y: 100, status: 'pending' },
      { id: 'parse', x: 250, y: 150, status: 'pending' },
      { id: 'analyze', x: 400, y: 200, status: 'pending' },
      { id: 'match', x: 550, y: 250, status: 'pending' },
      { id: 'risk', x: 700, y: 300, status: 'pending' },
      { id: 'result', x: 850, y: 350, status: 'pending' }
    ];
    
    setWaterfallNodes(nodes);
  };

  // 智能分析算法
  const performCollegeAnalysis = (profile: StudentProfile): AnalysisResult => {
    // 基于分数筛选合适的高校
    const suitableColleges = MOCK_COLLEGES.filter(college => {
      const avgScore = (college.minScore2023 + college.minScore2022 + college.minScore2021) / 3;
      return Math.abs(avgScore - profile.score) <= 50;
    });

    // 风险分析
    const riskAnalysis = {
      safe: suitableColleges.filter(c => c.minScore2023 <= profile.score - 20),
      moderate: suitableColleges.filter(c => 
        c.minScore2023 > profile.score - 20 && c.minScore2023 <= profile.score + 10
      ),
      reach: suitableColleges.filter(c => c.minScore2023 > profile.score + 10)
    };

    // 趋势分析
    const trendAnalysis = {
      scoreTrend: [680, 675, 670, 665, 660], // 模拟近5年分数线趋势
      admissionTrend: '整体录取分数线呈稳中有降趋势'
    };

    // 策略建议
    const strategicAdvice = [
      '建议采用"冲稳保"策略，合理分配志愿梯度',
      '重点关注目标专业的历年录取情况',
      '考虑地域因素对录取分数的影响',
      '关注高校的专业调剂政策'
    ];

    return {
      recommendedColleges: suitableColleges.slice(0, 10),
      riskAnalysis,
      trendAnalysis,
      strategicAdvice
    };
  };

  // 模拟分析过程
  const simulateAnalysisProcess = async () => {
    const steps: AnalysisStep[] = [
      { id: '1', name: '解析学生档案', status: 'pending', progress: 0, timestamp: Date.now() },
      { id: '2', name: '获取高校数据', status: 'pending', progress: 0, timestamp: Date.now() },
      { id: '3', name: '智能匹配分析', status: 'pending', progress: 0, timestamp: Date.now() },
      { id: '4', name: '风险评估计算', status: 'pending', progress: 0, timestamp: Date.now() },
      { id: '5', name: '趋势预测分析', status: 'pending', progress: 0, timestamp: Date.now() },
      { id: '6', name: '生成推荐方案', status: 'pending', progress: 0, timestamp: Date.now() }
    ];

    setAnalysisSteps(steps);
    setIsAnalyzing(true);
    setCurrentStep(0);
    setTotalProgress(0);
    initializeWaterfallNodes();

    for (let i = 0; i < steps.length; i++) {
      // 更新瀑布节点状态
      setWaterfallNodes(prev => 
        prev.map((node, index) => ({
          ...node,
          status: index === i ? 'active' : index < i ? 'completed' : 'pending'
        }))
      );

      // 开始执行步骤
      setAnalysisSteps(prev => {
        const newSteps = [...prev];
        newSteps[i] = { ...newSteps[i], status: 'running' };
        return newSteps;
      });

      setCurrentStep(i);

      // 模拟步骤执行时间和进度
      const stepDuration = 1500 + Math.random() * 2000;
      const startTime = Date.now();
      
      for (let progress = 0; progress <= 100; progress += 5) {
        await new Promise(resolve => setTimeout(resolve, stepDuration / 20));
        
        setAnalysisSteps(prev => {
          const newSteps = [...prev];
          newSteps[i] = { ...newSteps[i], progress };
          return newSteps;
        });

        setTotalProgress(((i * 100 + progress) / (steps.length * 100)) * 100);
      }

      // 完成步骤
      const endTime = Date.now();
      setAnalysisSteps(prev => {
        const newSteps = [...prev];
        newSteps[i] = { 
          ...newSteps[i], 
          status: 'completed',
          duration: endTime - startTime,
          output: getStepOutput(i)
        };
        return newSteps;
      });
    }

    // 生成最终分析结果
    const result = performCollegeAnalysis(studentProfile);
    setAnalysisResult(result);
    setIsAnalyzing(false);
    
    // 完成所有瀑布节点
    setWaterfallNodes(prev => 
      prev.map(node => ({ ...node, status: 'completed' }))
    );
  };

  const getStepOutput = (stepIndex: number): string => {
    const outputs = [
      `解析完成：${studentProfile.category} ${studentProfile.score}分 ${studentProfile.province}`,
      `获取${MOCK_COLLEGES.length}所高校近3年录取数据`,
      `智能匹配算法运行完成，找到${Math.floor(Math.random() * 20 + 10)}个潜在匹配`,
      `风险评估完成：安全${Math.floor(Math.random() * 5 + 3)}所，适中${Math.floor(Math.random() * 8 + 5)}所，冲刺${Math.floor(Math.random() * 5 + 2)}所`,
      `趋势分析完成：预测2024年分数线变化趋势`,
      `生成个性化推荐方案和填报策略`
    ];
    return outputs[stepIndex] || '步骤执行完成';
  };

  const handleStartAnalysis = () => {
    if (studentProfile.score > 0 && studentProfile.province) {
      simulateAnalysisProcess();
    }
  };

  const handleReset = () => {
    setAnalysisSteps([]);
    setAnalysisResult(null);
    setIsAnalyzing(false);
    setCurrentStep(0);
    setTotalProgress(0);
    setWaterfallNodes([]);
  };

  const getCollegeTypeColor = (type: string) => {
    switch (type) {
      case '985': return 'red';
      case '211': return 'orange';
      case '双一流': return 'blue';
      default: return 'green';
    }
  };

  const collegeColumns = [
    {
      title: '高校名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: CollegeInfo) => (
        <Space>
          <Text strong>{text}</Text>
          <Tag color={getCollegeTypeColor(record.type)}>{record.type}</Tag>
        </Space>
      )
    },
    {
      title: '所在地',
      dataIndex: 'location',
      key: 'location'
    },
    {
      title: '2023分数线',
      dataIndex: 'minScore2023',
      key: 'minScore2023',
      render: (score: number) => <Text strong>{score}</Text>
    },
    {
      title: '录取概率',
      dataIndex: 'admissionRate',
      key: 'admissionRate',
      render: (rate: number) => (
        <Progress 
          percent={Math.round(rate * 100)} 
          size="small" 
          status={rate > 0.05 ? 'success' : rate > 0.03 ? 'normal' : 'exception'}
        />
      )
    }
  ];

  return (
    <div className="college-admission-analyzer">
      <canvas ref={canvasRef} className="waterfall-canvas" />
      
      <div className="analyzer-header">
        <Title level={2} className="analyzer-title">
          <TrophyOutlined /> 高考志愿填报智能分析系统
        </Title>
        <Paragraph className="analyzer-subtitle">
          基于AI算法的个性化志愿填报策略，助您科学规划升学路径
        </Paragraph>
      </div>

      <Row gutter={[24, 24]} className="analyzer-content">
        <Col xs={24} lg={8}>
          <Card title="📊 学生档案" className="profile-card">
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              <div>
                <Text strong>高考分数</Text>
                <Input
                  placeholder="请输入高考总分"
                  type="number"
                  value={studentProfile.score || ''}
                  onChange={(e) => setStudentProfile(prev => ({ ...prev, score: parseInt(e.target.value) || 0 }))}
                  disabled={isAnalyzing}
                  size="large"
                  suffix="分"
                />
              </div>
              
              <div>
                <Text strong>所在省份</Text>
                <Input
                  placeholder="如：北京、上海、江苏等"
                  value={studentProfile.province}
                  onChange={(e) => setStudentProfile(prev => ({ ...prev, province: e.target.value }))}
                  disabled={isAnalyzing}
                  size="large"
                />
              </div>

              <div>
                <Text strong>专业偏好</Text>
                <TextArea
                  placeholder="请输入感兴趣的专业方向，如：计算机科学、医学、经济学等"
                  value={studentProfile.preferences.join(', ')}
                  onChange={(e) => setStudentProfile(prev => ({ 
                    ...prev, 
                    preferences: e.target.value.split(',').map(p => p.trim()).filter(p => p)
                  }))}
                  disabled={isAnalyzing}
                  rows={3}
                />
              </div>

              <Button
                type="primary"
                icon={<PlayCircleOutlined />}
                onClick={handleStartAnalysis}
                disabled={!studentProfile.score || !studentProfile.province || isAnalyzing}
                size="large"
                block
                className="analysis-button"
              >
                开始智能分析
              </Button>
              
              <Button
                icon={<ReloadOutlined />}
                onClick={handleReset}
                size="large"
                block
              >
                重置分析
              </Button>
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={16}>
          <Card title="🔬 分析过程" className="analysis-card">
            {analysisSteps.length > 0 && (
              <>
                <div className="progress-section">
                  <Row gutter={16}>
                    <Col span={12}>
                      <Statistic title="总体进度" value={Math.round(totalProgress)} suffix="%" />
                    </Col>
                    <Col span={12}>
                      <Statistic title="当前步骤" value={`${currentStep + 1}/${analysisSteps.length}`} />
                    </Col>
                  </Row>
                  <Progress 
                    percent={Math.round(totalProgress)} 
                    status={isAnalyzing ? 'active' : 'success'}
                    strokeColor={{
                      '0%': '#108ee9',
                      '100%': '#87d068',
                    }}
                    style={{ marginTop: 16 }}
                  />
                </div>

                <Divider />

                <div className="steps-section">
                  <Title level={4}>执行步骤</Title>
                  <div className="waterfall-steps">
                    {analysisSteps.map((step, index) => (
                      <div 
                        key={step.id} 
                        className={`waterfall-step ${step.status} ${index === currentStep ? 'current' : ''}`}
                      >
                        <div className="step-header">
                          <div className="step-number">{index + 1}</div>
                          <div className="step-info">
                            <div className="step-name">{step.name}</div>
                            {step.status === 'running' && (
                              <Progress 
                                percent={step.progress} 
                                size="small" 
                                status="active"
                                showInfo={false}
                              />
                            )}
                            {step.duration && (
                              <Text type="secondary" className="step-duration">
                                耗时: {step.duration}ms
                              </Text>
                            )}
                          </div>
                          <div className="step-status">
                            {step.status === 'running' && <Spin size="small" />}
                            {step.status === 'completed' && <TrophyOutlined style={{ color: '#52c41a' }} />}
                          </div>
                        </div>
                        {step.output && (
                          <div className="step-output">
                            <Text type="secondary">{step.output}</Text>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {analysisSteps.length === 0 && (
              <div className="empty-analysis">
                <BarChartOutlined className="empty-icon" />
                <Text type="secondary">填写学生档案信息并开始分析</Text>
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {analysisResult && (
        <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
          <Col span={24}>
            <Card title="📋 分析结果" className="result-card">
              <Row gutter={[16, 16]}>
                <Col xs={24} lg={12}>
                  <Card size="small" title="推荐高校" className="recommendation-card">
                    <Table
                      dataSource={analysisResult.recommendedColleges}
                      columns={collegeColumns}
                      pagination={{ pageSize: 5 }}
                      size="small"
                      rowKey="id"
                    />
                  </Card>
                </Col>
                
                <Col xs={24} lg={12}>
                  <Card size="small" title="风险分析" className="risk-card">
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <div>
                        <Tag color="green">安全院校 ({analysisResult.riskAnalysis.safe.length}所)</Tag>
                        <Text type="secondary">录取概率 &gt; 80%</Text>
                      </div>
                      <div>
                        <Tag color="orange">适中院校 ({analysisResult.riskAnalysis.moderate.length}所)</Tag>
                        <Text type="secondary">录取概率 50%-80%</Text>
                      </div>
                      <div>
                        <Tag color="red">冲刺院校 ({analysisResult.riskAnalysis.reach.length}所)</Tag>
                        <Text type="secondary">录取概率 &lt; 50%</Text>
                      </div>
                    </Space>
                  </Card>
                  
                  <Card size="small" title="策略建议" className="advice-card" style={{ marginTop: 16 }}>
                    <Space direction="vertical">
                      {analysisResult.strategicAdvice.map((advice, index) => (
                        <div key={index} className="advice-item">
                          <BulbOutlined style={{ color: '#faad14', marginRight: 8 }} />
                          <Text>{advice}</Text>
                        </div>
                      ))}
                    </Space>
                  </Card>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>
      )}
    </div>
  );
};

export default CollegeAdmissionAnalyzer;