# 高考志愿填报系统 - API接口设计文档

## 📋 接口概述

本文档详细描述了高考志愿填报智能分析系统中各个组件之间的接口定义、数据格式和交互协议。系统采用TypeScript进行类型定义，确保数据传输的类型安全。

## 🏗️ 核心数据类型定义

### 1. 基础数据类型

```typescript
/**
 * 学生基本信息接口
 * 用于收集和传递学生的基本信息
 */
interface StudentInfo {
  /** 学生姓名 */
  name: string;
  /** 高考总分 */
  score: number;
  /** 所在省份 */
  province: string;
  /** 文理科类别 */
  category: 'liberal_arts' | 'science' | 'comprehensive';
  /** 专业偏好列表 */
  preferences: string[];
  /** 地区偏好 */
  location: string[];
  /** 家庭经济状况 */
  economicStatus?: 'low' | 'medium' | 'high';
  /** 特殊要求 */
  specialRequirements?: string[];
}

/**
 * 院校信息接口
 * 定义院校的基本属性和统计信息
 */
interface CollegeInfo {
  /** 院校ID */
  id: string;
  /** 院校名称 */
  name: string;
  /** 院校类型 */
  type: '985' | '211' | 'double_first_class' | 'regular';
  /** 所在城市 */
  city: string;
  /** 所在省份 */
  province: string;
  /** 院校排名 */
  ranking: number;
  /** 是否为公办 */
  isPublic: boolean;
  /** 学费范围 */
  tuitionRange: {
    min: number;
    max: number;
  };
}

/**
 * 专业信息接口
 * 定义专业的详细信息和就业数据
 */
interface MajorInfo {
  /** 专业ID */
  id: string;
  /** 专业名称 */
  name: string;
  /** 专业代码 */
  code: string;
  /** 学科门类 */
  category: string;
  /** 学制 */
  duration: number;
  /** 就业率 */
  employmentRate: number;
  /** 平均薪资 */
  averageSalary: number;
  /** 专业描述 */
  description: string;
  /** 主要课程 */
  mainCourses: string[];
}

/**
 * 历年录取数据接口
 * 存储院校专业的历年录取分数线
 */
interface AdmissionHistory {
  /** 年份 */
  year: number;
  /** 院校ID */
  collegeId: string;
  /** 专业ID */
  majorId: string;
  /** 最低录取分数 */
  minScore: number;
  /** 平均录取分数 */
  avgScore: number;
  /** 最高录取分数 */
  maxScore: number;
  /** 录取人数 */
  admissionCount: number;
  /** 报考人数 */
  applicationCount: number;
}
```

### 2. 分析结果类型

```typescript
/**
 * 录取概率等级枚举
 */
enum ProbabilityLevel {
  HIGH = 'high',      // 录取概率 > 80%
  MEDIUM = 'medium',  // 录取概率 50%-80%
  LOW = 'low'         // 录取概率 < 50%
}

/**
 * 风险等级枚举
 */
enum RiskLevel {
  SAFE = 'safe',        // 安全
  MODERATE = 'moderate', // 适中
  RISKY = 'risky'       // 风险
}

/**
 * 院校推荐结果接口
 * 包含推荐院校的详细分析数据
 */
interface CollegeRecommendation {
  /** 院校信息 */
  college: CollegeInfo;
  /** 专业信息 */
  major: MajorInfo;
  /** 录取概率 */
  probability: number;
  /** 概率等级 */
  probabilityLevel: ProbabilityLevel;
  /** 风险等级 */
  riskLevel: RiskLevel;
  /** 去年录取分数线 */
  lastYearScore: number;
  /** 分数差值 */
  scoreDifference: number;
  /** 推荐理由 */
  reason: string;
  /** 匹配度评分 */
  matchScore: number;
  /** 历年录取数据 */
  admissionHistory: AdmissionHistory[];
}

/**
 * 成绩分析结果接口
 * 提供学生成绩的详细分析
 */
interface ScoreAnalysis {
  /** 总分 */
  totalScore: number;
  /** 省内排名 */
  provinceRanking: number;
  /** 超越百分比 */
  percentile: number;
  /** 各科成绩分析 */
  subjectAnalysis: {
    subject: string;
    score: number;
    ranking: number;
    average: number;
  }[];
  /** 成绩趋势 */
  trend: 'improving' | 'stable' | 'declining';
}

/**
 * 完整分析结果接口
 * 包含所有分析维度的结果
 */
interface AnalysisResult {
  /** 推荐院校列表 */
  recommendations: CollegeRecommendation[];
  /** 成绩分析 */
  scoreAnalysis: ScoreAnalysis;
  /** 整体风险评估 */
  overallRisk: RiskLevel;
  /** 分析摘要 */
  summary: string;
  /** 建议 */
  suggestions: string[];
  /** 分析时间戳 */
  timestamp: number;
  /** 分析版本 */
  version: string;
}
```

### 3. 组件状态类型

```typescript
/**
 * 分析步骤枚举
 * 定义分析过程的各个阶段
 */
enum AnalysisStep {
  DATA_PREPROCESSING = 'data_preprocessing',
  SCORE_ANALYSIS = 'score_analysis',
  MAJOR_MATCHING = 'major_matching',
  COLLEGE_FILTERING = 'college_filtering',
  RISK_ASSESSMENT = 'risk_assessment',
  REPORT_GENERATION = 'report_generation'
}

/**
 * 步骤状态枚举
 */
enum StepStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  ERROR = 'error'
}

/**
 * 分析步骤信息接口
 */
interface AnalysisStepInfo {
  /** 步骤类型 */
  step: AnalysisStep;
  /** 步骤名称 */
  name: string;
  /** 步骤描述 */
  description: string;
  /** 当前状态 */
  status: StepStatus;
  /** 进度百分比 */
  progress: number;
  /** 开始时间 */
  startTime?: number;
  /** 结束时间 */
  endTime?: number;
  /** 输出日志 */
  logs: string[];
  /** 错误信息 */
  error?: string;
}

/**
 * 分析状态接口
 * 管理整个分析过程的状态
 */
interface AnalysisState {
  /** 是否正在分析 */
  isAnalyzing: boolean;
  /** 当前步骤索引 */
  currentStepIndex: number;
  /** 总体进度 */
  overallProgress: number;
  /** 步骤列表 */
  steps: AnalysisStepInfo[];
  /** 开始时间 */
  startTime?: number;
  /** 预计完成时间 */
  estimatedEndTime?: number;
  /** 分析结果 */
  result?: AnalysisResult;
}
```

## 🔧 组件接口定义

### 1. StudentForm 组件接口

```typescript
/**
 * StudentForm 组件属性接口
 */
interface StudentFormProps {
  /** 初始学生信息 */
  initialData?: Partial<StudentInfo>;
  /** 表单提交回调 */
  onSubmit: (data: StudentInfo) => void;
  /** 数据变更回调 */
  onChange?: (data: Partial<StudentInfo>) => void;
  /** 是否禁用表单 */
  disabled?: boolean;
  /** 验证规则 */
  validationRules?: ValidationRules;
  /** 自定义样式类名 */
  className?: string;
}

/**
 * 表单验证规则接口
 */
interface ValidationRules {
  /** 姓名验证规则 */
  name?: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
  };
  /** 分数验证规则 */
  score?: {
    required?: boolean;
    min?: number;
    max?: number;
  };
  /** 省份验证规则 */
  province?: {
    required?: boolean;
    allowedValues?: string[];
  };
}

/**
 * StudentForm 组件方法接口
 */
interface StudentFormMethods {
  /** 验证表单数据 */
  validate: () => Promise<boolean>;
  /** 重置表单 */
  reset: () => void;
  /** 获取表单数据 */
  getData: () => StudentInfo;
  /** 设置表单数据 */
  setData: (data: Partial<StudentInfo>) => void;
}
```

### 2. AnalysisProgress 组件接口

```typescript
/**
 * AnalysisProgress 组件属性接口
 */
interface AnalysisProgressProps {
  /** 分析状态 */
  analysisState: AnalysisState;
  /** 是否显示详细日志 */
  showLogs?: boolean;
  /** 是否显示预计时间 */
  showEstimatedTime?: boolean;
  /** 自定义步骤渲染器 */
  stepRenderer?: (step: AnalysisStepInfo, index: number) => React.ReactNode;
  /** 进度变更回调 */
  onProgressChange?: (progress: number) => void;
  /** 步骤完成回调 */
  onStepComplete?: (step: AnalysisStepInfo) => void;
}

/**
 * 进度动画配置接口
 */
interface ProgressAnimationConfig {
  /** 动画持续时间 */
  duration: number;
  /** 缓动函数 */
  easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
  /** 是否循环播放 */
  loop: boolean;
  /** 延迟时间 */
  delay: number;
}
```

### 3. ResultDisplay 组件接口

```typescript
/**
 * ResultDisplay 组件属性接口
 */
interface ResultDisplayProps {
  /** 分析结果 */
  result: AnalysisResult;
  /** 是否显示详细信息 */
  showDetails?: boolean;
  /** 排序方式 */
  sortBy?: 'probability' | 'ranking' | 'score' | 'match';
  /** 排序方向 */
  sortOrder?: 'asc' | 'desc';
  /** 筛选条件 */
  filters?: ResultFilters;
  /** 院校选择回调 */
  onCollegeSelect?: (college: CollegeRecommendation) => void;
  /** 详情查看回调 */
  onViewDetails?: (college: CollegeRecommendation) => void;
  /** 比较回调 */
  onCompare?: (colleges: CollegeRecommendation[]) => void;
}

/**
 * 结果筛选条件接口
 */
interface ResultFilters {
  /** 概率等级筛选 */
  probabilityLevels?: ProbabilityLevel[];
  /** 风险等级筛选 */
  riskLevels?: RiskLevel[];
  /** 院校类型筛选 */
  collegeTypes?: string[];
  /** 地区筛选 */
  regions?: string[];
  /** 分数范围筛选 */
  scoreRange?: {
    min: number;
    max: number;
  };
}

/**
 * 结果展示配置接口
 */
interface ResultDisplayConfig {
  /** 每页显示数量 */
  pageSize: number;
  /** 是否启用虚拟滚动 */
  virtualScroll: boolean;
  /** 是否显示分页 */
  showPagination: boolean;
  /** 默认排序 */
  defaultSort: {
    field: string;
    order: 'asc' | 'desc';
  };
}
```

### 4. AnalysisChart 组件接口

```typescript
/**
 * AnalysisChart 组件属性接口
 */
interface AnalysisChartProps {
  /** 图表数据 */
  data: ChartData;
  /** 图表类型 */
  type: ChartType;
  /** 图表配置 */
  config?: ChartConfig;
  /** 图表尺寸 */
  size?: {
    width: number;
    height: number;
  };
  /** 是否响应式 */
  responsive?: boolean;
  /** 交互事件回调 */
  onInteraction?: (event: ChartInteractionEvent) => void;
}

/**
 * 图表类型枚举
 */
enum ChartType {
  SCORE_DISTRIBUTION = 'score_distribution',
  PROBABILITY_BAR = 'probability_bar',
  MAJOR_RADAR = 'major_radar',
  TREND_LINE = 'trend_line',
  RISK_PIE = 'risk_pie'
}

/**
 * 图表数据接口
 */
interface ChartData {
  /** 数据集 */
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string[];
    borderColor?: string[];
    borderWidth?: number;
  }[];
  /** 标签 */
  labels: string[];
  /** 元数据 */
  metadata?: Record<string, any>;
}

/**
 * 图表配置接口
 */
interface ChartConfig {
  /** 标题 */
  title?: string;
  /** 图例配置 */
  legend?: {
    display: boolean;
    position: 'top' | 'bottom' | 'left' | 'right';
  };
  /** 坐标轴配置 */
  axes?: {
    x?: AxisConfig;
    y?: AxisConfig;
  };
  /** 工具提示配置 */
  tooltip?: {
    enabled: boolean;
    format?: string;
  };
  /** 动画配置 */
  animation?: {
    duration: number;
    easing: string;
  };
}

/**
 * 坐标轴配置接口
 */
interface AxisConfig {
  /** 显示标题 */
  title?: string;
  /** 最小值 */
  min?: number;
  /** 最大值 */
  max?: number;
  /** 刻度间隔 */
  stepSize?: number;
  /** 是否显示网格线 */
  grid?: boolean;
}

/**
 * 图表交互事件接口
 */
interface ChartInteractionEvent {
  /** 事件类型 */
  type: 'click' | 'hover' | 'select';
  /** 数据点索引 */
  dataIndex: number;
  /** 数据集索引 */
  datasetIndex: number;
  /** 数据值 */
  value: number;
  /** 标签 */
  label: string;
}
```

## 🔄 API 服务接口

### 1. 数据获取服务

```typescript
/**
 * 数据服务接口
 * 定义数据获取和处理的方法
 */
interface DataService {
  /**
   * 获取院校列表
   * @param filters 筛选条件
   * @returns Promise<CollegeInfo[]>
   */
  getColleges(filters?: CollegeFilters): Promise<CollegeInfo[]>;
  
  /**
   * 获取专业列表
   * @param collegeId 院校ID
   * @returns Promise<MajorInfo[]>
   */
  getMajors(collegeId?: string): Promise<MajorInfo[]>;
  
  /**
   * 获取历年录取数据
   * @param collegeId 院校ID
   * @param majorId 专业ID
   * @param years 年份范围
   * @returns Promise<AdmissionHistory[]>
   */
  getAdmissionHistory(
    collegeId: string,
    majorId: string,
    years?: number[]
  ): Promise<AdmissionHistory[]>;
  
  /**
   * 获取省份统计数据
   * @param province 省份
   * @param year 年份
   * @returns Promise<ProvinceStats>
   */
  getProvinceStats(province: string, year?: number): Promise<ProvinceStats>;
}

/**
 * 院校筛选条件接口
 */
interface CollegeFilters {
  /** 院校类型 */
  types?: string[];
  /** 所在省份 */
  provinces?: string[];
  /** 是否公办 */
  isPublic?: boolean;
  /** 排名范围 */
  rankingRange?: {
    min: number;
    max: number;
  };
}

/**
 * 省份统计数据接口
 */
interface ProvinceStats {
  /** 省份名称 */
  province: string;
  /** 年份 */
  year: number;
  /** 考生总数 */
  totalCandidates: number;
  /** 分数线统计 */
  scoreLines: {
    category: string;
    firstTier: number;
    secondTier: number;
    specialTier: number;
  }[];
  /** 录取率 */
  admissionRate: number;
}
```

### 2. 分析引擎服务

```typescript
/**
 * 分析引擎接口
 * 定义核心分析算法和方法
 */
interface AnalysisEngine {
  /**
   * 执行完整分析
   * @param studentInfo 学生信息
   * @param options 分析选项
   * @returns Promise<AnalysisResult>
   */
  analyze(
    studentInfo: StudentInfo,
    options?: AnalysisOptions
  ): Promise<AnalysisResult>;
  
  /**
   * 计算录取概率
   * @param studentScore 学生分数
   * @param admissionHistory 历年录取数据
   * @returns number
   */
  calculateProbability(
    studentScore: number,
    admissionHistory: AdmissionHistory[]
  ): number;
  
  /**
   * 评估风险等级
   * @param probability 录取概率
   * @param scoreDifference 分数差值
   * @returns RiskLevel
   */
  assessRisk(
    probability: number,
    scoreDifference: number
  ): RiskLevel;
  
  /**
   * 生成推荐列表
   * @param studentInfo 学生信息
   * @param colleges 院校列表
   * @param majors 专业列表
   * @returns Promise<CollegeRecommendation[]>
   */
  generateRecommendations(
    studentInfo: StudentInfo,
    colleges: CollegeInfo[],
    majors: MajorInfo[]
  ): Promise<CollegeRecommendation[]>;
}

/**
 * 分析选项接口
 */
interface AnalysisOptions {
  /** 推荐数量限制 */
  maxRecommendations?: number;
  /** 是否包含风险院校 */
  includeRiskyOptions?: boolean;
  /** 地区偏好权重 */
  locationWeight?: number;
  /** 专业匹配权重 */
  majorWeight?: number;
  /** 院校排名权重 */
  rankingWeight?: number;
  /** 经济因素权重 */
  economicWeight?: number;
}
```

### 3. 缓存管理服务

```typescript
/**
 * 缓存管理接口
 * 定义数据缓存和性能优化方法
 */
interface CacheManager {
  /**
   * 设置缓存
   * @param key 缓存键
   * @param value 缓存值
   * @param ttl 过期时间(秒)
   */
  set<T>(key: string, value: T, ttl?: number): void;
  
  /**
   * 获取缓存
   * @param key 缓存键
   * @returns T | null
   */
  get<T>(key: string): T | null;
  
  /**
   * 删除缓存
   * @param key 缓存键
   */
  delete(key: string): void;
  
  /**
   * 清空所有缓存
   */
  clear(): void;
  
  /**
   * 检查缓存是否存在
   * @param key 缓存键
   * @returns boolean
   */
  has(key: string): boolean;
  
  /**
   * 获取缓存统计信息
   * @returns CacheStats
   */
  getStats(): CacheStats;
}

/**
 * 缓存统计信息接口
 */
interface CacheStats {
  /** 缓存命中次数 */
  hits: number;
  /** 缓存未命中次数 */
  misses: number;
  /** 缓存命中率 */
  hitRate: number;
  /** 缓存大小 */
  size: number;
  /** 内存使用量 */
  memoryUsage: number;
}
```

## 🔧 工具函数接口

### 1. 数据验证工具

```typescript
/**
 * 数据验证工具接口
 */
interface DataValidator {
  /**
   * 验证学生信息
   * @param data 学生信息
   * @returns ValidationResult
   */
  validateStudentInfo(data: Partial<StudentInfo>): ValidationResult;
  
  /**
   * 验证分数范围
   * @param score 分数
   * @param min 最小值
   * @param max 最大值
   * @returns boolean
   */
  validateScore(score: number, min: number, max: number): boolean;
  
  /**
   * 验证省份代码
   * @param province 省份
   * @returns boolean
   */
  validateProvince(province: string): boolean;
}

/**
 * 验证结果接口
 */
interface ValidationResult {
  /** 是否验证通过 */
  isValid: boolean;
  /** 错误信息列表 */
  errors: ValidationError[];
  /** 警告信息列表 */
  warnings: ValidationWarning[];
}

/**
 * 验证错误接口
 */
interface ValidationError {
  /** 字段名 */
  field: string;
  /** 错误消息 */
  message: string;
  /** 错误代码 */
  code: string;
}

/**
 * 验证警告接口
 */
interface ValidationWarning {
  /** 字段名 */
  field: string;
  /** 警告消息 */
  message: string;
  /** 警告代码 */
  code: string;
}
```

### 2. 数据格式化工具

```typescript
/**
 * 数据格式化工具接口
 */
interface DataFormatter {
  /**
   * 格式化分数
   * @param score 分数
   * @param precision 精度
   * @returns string
   */
  formatScore(score: number, precision?: number): string;
  
  /**
   * 格式化概率
   * @param probability 概率
   * @returns string
   */
  formatProbability(probability: number): string;
  
  /**
   * 格式化排名
   * @param ranking 排名
   * @returns string
   */
  formatRanking(ranking: number): string;
  
  /**
   * 格式化日期时间
   * @param timestamp 时间戳
   * @param format 格式
   * @returns string
   */
  formatDateTime(timestamp: number, format?: string): string;
}
```

## 📊 事件系统接口

### 1. 事件定义

```typescript
/**
 * 系统事件类型枚举
 */
enum SystemEventType {
  ANALYSIS_STARTED = 'analysis_started',
  ANALYSIS_PROGRESS = 'analysis_progress',
  ANALYSIS_COMPLETED = 'analysis_completed',
  ANALYSIS_ERROR = 'analysis_error',
  DATA_LOADED = 'data_loaded',
  USER_INTERACTION = 'user_interaction'
}

/**
 * 系统事件接口
 */
interface SystemEvent {
  /** 事件类型 */
  type: SystemEventType;
  /** 事件数据 */
  data: any;
  /** 事件时间戳 */
  timestamp: number;
  /** 事件来源 */
  source: string;
}

/**
 * 事件监听器接口
 */
interface EventListener {
  /**
   * 处理事件
   * @param event 系统事件
   */
  handleEvent(event: SystemEvent): void;
}

/**
 * 事件管理器接口
 */
interface EventManager {
  /**
   * 注册事件监听器
   * @param type 事件类型
   * @param listener 监听器
   */
  addEventListener(type: SystemEventType, listener: EventListener): void;
  
  /**
   * 移除事件监听器
   * @param type 事件类型
   * @param listener 监听器
   */
  removeEventListener(type: SystemEventType, listener: EventListener): void;
  
  /**
   * 触发事件
   * @param event 系统事件
   */
  dispatchEvent(event: SystemEvent): void;
}
```

## 🚀 性能监控接口

### 1. 性能指标

```typescript
/**
 * 性能指标接口
 */
interface PerformanceMetrics {
  /** 页面加载时间 */
  pageLoadTime: number;
  /** 分析处理时间 */
  analysisTime: number;
  /** 渲染时间 */
  renderTime: number;
  /** 内存使用量 */
  memoryUsage: number;
  /** API响应时间 */
  apiResponseTime: number;
}

/**
 * 性能监控器接口
 */
interface PerformanceMonitor {
  /**
   * 开始性能监控
   * @param label 监控标签
   */
  start(label: string): void;
  
  /**
   * 结束性能监控
   * @param label 监控标签
   * @returns number 耗时(毫秒)
   */
  end(label: string): number;
  
  /**
   * 记录性能指标
   * @param metrics 性能指标
   */
  recordMetrics(metrics: PerformanceMetrics): void;
  
  /**
   * 获取性能报告
   * @returns PerformanceReport
   */
  getReport(): PerformanceReport;
}

/**
 * 性能报告接口
 */
interface PerformanceReport {
  /** 报告生成时间 */
  timestamp: number;
  /** 性能指标 */
  metrics: PerformanceMetrics;
  /** 性能评分 */
  score: number;
  /** 优化建议 */
  recommendations: string[];
}
```

---

## 📝 总结

本API接口设计文档详细定义了高考志愿填报智能分析系统中所有组件的接口规范，包括：

### 🎯 **核心特性**
- **类型安全**：使用TypeScript严格类型定义
- **模块化设计**：清晰的接口分层和职责划分
- **扩展性**：支持插件化和配置化扩展
- **性能优化**：内置缓存和性能监控机制

### 🔧 **接口覆盖**
- **数据模型**：完整的业务数据类型定义
- **组件接口**：所有UI组件的属性和方法规范
- **服务接口**：数据获取、分析引擎、缓存管理
- **工具函数**：验证、格式化、事件管理
- **性能监控**：完整的性能指标和监控体系

### 🚀 **实施建议**
1. **渐进式实现**：按模块优先级逐步实现接口
2. **单元测试**：为每个接口编写完整的测试用例
3. **文档维护**：保持接口文档与代码实现同步
4. **版本管理**：建立接口版本控制和兼容性策略

该接口设计为系统的开发、测试、维护和扩展提供了坚实的基础，确保了代码的可读性、可维护性和可扩展性。