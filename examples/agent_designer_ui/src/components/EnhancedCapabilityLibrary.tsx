/**
 * 增强的能力库组件
 * 提供高级搜索、智能过滤、能力推荐等功能
 * 支持虚拟化滚动和懒加载优化
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Card, Input, Select, Button, Space, Tag, Rate, Avatar, List, 
  Drawer, Modal, Tabs, Checkbox, Slider, Radio, Switch, Tooltip,
  Badge, Progress, Statistic, Empty, Spin, Alert, Divider,
  Row, Col, Typography, Collapse, Tree, Timeline, Popover,
  AutoComplete, Cascader, DatePicker, Upload, message
} from 'antd';
import {
  SearchOutlined, FilterOutlined, StarOutlined, DownloadOutlined,
  EyeOutlined, HeartOutlined, ShareAltOutlined, SettingOutlined,
  BulbOutlined, ThunderboltOutlined, ApartmentOutlined, BookOutlined,
  FireOutlined, TrophyOutlined, TeamOutlined, GlobalOutlined,
  ClockCircleOutlined, CheckCircleOutlined, ExclamationCircleOutlined,
  InfoCircleOutlined, QuestionCircleOutlined, PlusOutlined,
  DeleteOutlined, EditOutlined, CopyOutlined, CloudDownloadOutlined,
  RobotOutlined, ExperimentOutlined, DatabaseOutlined, ApiOutlined
} from '@ant-design/icons';
import { FixedSizeList as VirtualList } from 'react-window';
import {
  CoreCapabilityType, CapabilityMaturityLevel, CapabilitySourceType,
  CapabilityCategory, CoreCapabilityModule, CapabilityModuleConfig
} from './CapabilitySystemTypes';
import './EnhancedCapabilityLibrary.css';

const { Option } = Select;
const { Search } = Input;
const { TabPane } = Tabs;
const { Panel } = Collapse;
const { Text, Title, Paragraph } = Typography;
const { CheckableTag } = Tag;

// 搜索过滤器接口
interface SearchFilters {
  text: string;
  type: CoreCapabilityType | 'all';
  maturity: CapabilityMaturityLevel | 'all';
  source: CapabilitySourceType | 'all';
  category: CapabilityCategory | 'all';
  tags: string[];
  rating: [number, number];
  featured: boolean;
  verified: boolean;
  author: string;
  organization: string;
  dateRange: [string, string] | null;
}

// 排序选项
type SortOption = 'relevance' | 'rating' | 'downloads' | 'updated' | 'name' | 'popularity';

// 视图模式
type ViewMode = 'grid' | 'list' | 'compact';

// 能力推荐结果
interface CapabilityRecommendation {
  capability: CoreCapabilityModule;
  score: number;
  reason: string;
  tags: string[];
}

interface EnhancedCapabilityLibraryProps {
  visible: boolean;
  onClose: () => void;
  onCapabilitySelect: (capability: CoreCapabilityModule) => void;
  selectedCapabilities?: CoreCapabilityModule[];
  mode?: 'select' | 'browse';
  filters?: Partial<SearchFilters>;
}

const EnhancedCapabilityLibrary: React.FC<EnhancedCapabilityLibraryProps> = ({
  visible,
  onClose,
  onCapabilitySelect,
  selectedCapabilities = [],
  mode = 'select',
  filters: initialFilters
}) => {
  // 核心状态
  const [capabilities, setCapabilities] = useState<CoreCapabilityModule[]>([]);
  const [filteredCapabilities, setFilteredCapabilities] = useState<CoreCapabilityModule[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  
  // 搜索和过滤状态
  const [filters, setFilters] = useState<SearchFilters>({
    text: '',
    type: 'all',
    maturity: 'all',
    source: 'all',
    category: 'all',
    tags: [],
    rating: [0, 5],
    featured: false,
    verified: false,
    author: '',
    organization: '',
    dateRange: null,
    ...initialFilters
  });
  
  // UI状态
  const [sortBy, setSortBy] = useState<SortOption>('relevance');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedCapability, setSelectedCapability] = useState<CoreCapabilityModule | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [filterDrawerVisible, setFilterDrawerVisible] = useState(false);
  const [recommendationsVisible, setRecommendationsVisible] = useState(false);
  
  // 推荐和统计
  const [recommendations, setRecommendations] = useState<CapabilityRecommendation[]>([]);
  const [popularTags, setPopularTags] = useState<string[]>([]);
  const [statistics, setStatistics] = useState({
    total: 0,
    byType: {} as Record<CoreCapabilityType, number>,
    byMaturity: {} as Record<CapabilityMaturityLevel, number>,
    bySource: {} as Record<CapabilitySourceType, number>
  });
  
  /**
   * 初始化组件
   */
  useEffect(() => {
    if (visible) {
      loadCapabilities();
      loadRecommendations();
      loadStatistics();
    }
  }, [visible]);
  
  /**
   * 搜索和过滤效果
   */
  useEffect(() => {
    filterCapabilities();
  }, [capabilities, filters, sortBy]);
  
  /**
   * 加载能力库数据
   */
  const loadCapabilities = useCallback(async () => {
    setLoading(true);
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockCapabilities: CoreCapabilityModule[] = [
        {
          id: 'nlp_understanding',
          name: '自然语言理解',
          description: '基于深度学习的自然语言理解能力，支持多语言文本分析、语义理解和意图识别',
          type: CoreCapabilityType.COGNITIVE,
          subType: 'natural_language_processing',
          version: '2.1.0',
          source: {
            type: CapabilitySourceType.MARKETPLACE,
            details: {
              provider: 'OpenAI',
              repository: 'https://github.com/openai/nlp-models',
              version: '2.1.0',
              license: 'MIT',
              documentation: 'https://docs.openai.com/nlp',
              support: {
                email: 'support@openai.com',
                documentation: 'https://docs.openai.com',
                community: 'https://community.openai.com'
              }
            }
          },
          maturityLevel: CapabilityMaturityLevel.OPTIMIZED,
          category: CapabilityCategory.CORE,
          inputs: [],
          outputs: [],
          dependencies: [],
          config: {} as CapabilityModuleConfig,
          metadata: {
            tags: ['NLP', '自然语言', '文本分析', '语义理解'],
            author: 'OpenAI Team',
            organization: 'OpenAI',
            createdAt: new Date('2023-01-15'),
            updatedAt: new Date('2024-01-15'),
            rating: 4.8,
            downloads: 15420,
            featured: true,
            verified: true
          },
          metrics: {
            performance: {
              latency: { avg: 120, p95: 200, p99: 350 },
              throughput: { current: 1000, peak: 1500, avg: 800 },
              errorRate: { current: 0.1, avg: 0.2 },
              availability: { current: 99.9, avg: 99.8 }
            },
            usage: {
              totalRequests: 1500000,
              activeUsers: 2500,
              peakConcurrency: 500
            },
            resources: {
              cpu: { current: 45, avg: 40, peak: 80 },
              memory: { current: 512, avg: 480, peak: 1024 },
              storage: { used: 2048, available: 8192 },
              network: { inbound: 100, outbound: 80 }
            }
          }
        },
        {
          id: 'sentiment_analysis',
          name: '情感分析',
          description: '高精度情感分析模型，支持细粒度情感识别、情感强度评估和情感趋势分析',
          type: CoreCapabilityType.COGNITIVE,
          subType: 'sentiment_analysis',
          version: '1.5.2',
          source: {
            type: CapabilitySourceType.BUILTIN,
            details: {
              provider: 'EFIAgent',
              repository: '',
              version: '1.5.2',
              license: 'Apache-2.0',
              documentation: '',
              support: {
                email: 'support@efiagent.com',
                documentation: 'https://docs.efiagent.com',
                community: 'https://community.efiagent.com'
              }
            }
          },
          maturityLevel: CapabilityMaturityLevel.DEFINED,
          category: CapabilityCategory.CORE,
          inputs: [],
          outputs: [],
          dependencies: [],
          config: {} as CapabilityModuleConfig,
          metadata: {
            tags: ['情感分析', '文本挖掘', '情绪识别', 'AI'],
            author: 'EFIAgent Team',
            organization: 'EFIAgent',
            createdAt: new Date('2023-06-10'),
            updatedAt: new Date('2024-01-10'),
            rating: 4.5,
            downloads: 8750,
            featured: false,
            verified: true
          },
          metrics: {
            performance: {
              latency: { avg: 80, p95: 120, p99: 180 },
              throughput: { current: 1200, peak: 1800, avg: 1000 },
              errorRate: { current: 0.05, avg: 0.1 },
              availability: { current: 99.95, avg: 99.9 }
            },
            usage: {
              totalRequests: 850000,
              activeUsers: 1200,
              peakConcurrency: 300
            },
            resources: {
              cpu: { current: 35, avg: 30, peak: 60 },
              memory: { current: 256, avg: 240, peak: 512 },
              storage: { used: 1024, available: 4096 },
              network: { inbound: 60, outbound: 40 }
            }
          }
        },
        {
          id: 'logical_reasoning',
          name: '逻辑推理',
          description: '基于符号推理和神经网络的混合逻辑推理引擎，支持演绎推理、归纳推理和类比推理',
          type: CoreCapabilityType.REASONING,
          subType: 'logical_reasoning',
          version: '3.0.1',
          source: {
            type: CapabilitySourceType.COMMUNITY,
            details: {
              provider: 'Logic AI Lab',
              repository: 'https://github.com/logic-ai/reasoning-engine',
              version: '3.0.1',
              license: 'GPL-3.0',
              documentation: 'https://logic-ai.github.io/docs',
              support: {
                email: 'contact@logic-ai.org',
                documentation: 'https://logic-ai.github.io',
                community: 'https://discord.gg/logic-ai'
              }
            }
          },
          maturityLevel: CapabilityMaturityLevel.QUANTIFIED,
          category: CapabilityCategory.ADVANCED,
          inputs: [],
          outputs: [],
          dependencies: [],
          config: {} as CapabilityModuleConfig,
          metadata: {
            tags: ['逻辑推理', '符号推理', '知识图谱', '推理引擎'],
            author: 'Logic AI Team',
            organization: 'Logic AI Lab',
            createdAt: new Date('2023-03-20'),
            updatedAt: new Date('2024-01-05'),
            rating: 4.7,
            downloads: 5230,
            featured: true,
            verified: true
          },
          metrics: {
            performance: {
              latency: { avg: 200, p95: 350, p99: 500 },
              throughput: { current: 500, peak: 800, avg: 400 },
              errorRate: { current: 0.2, avg: 0.3 },
              availability: { current: 99.5, avg: 99.2 }
            },
            usage: {
              totalRequests: 320000,
              activeUsers: 450,
              peakConcurrency: 100
            },
            resources: {
              cpu: { current: 60, avg: 55, peak: 90 },
              memory: { current: 1024, avg: 900, peak: 2048 },
              storage: { used: 4096, available: 12288 },
              network: { inbound: 80, outbound: 60 }
            }
          }
        },
        {
          id: 'decision_optimization',
          name: '决策优化',
          description: '多目标决策优化算法，支持约束优化、风险评估和决策树生成',
          type: CoreCapabilityType.DECISION,
          subType: 'optimization',
          version: '1.8.0',
          source: {
            type: CapabilitySourceType.ENTERPRISE,
            details: {
              provider: 'DecisionTech Corp',
              repository: 'https://enterprise.decisiontech.com/api',
              version: '1.8.0',
              license: 'Commercial',
              documentation: 'https://docs.decisiontech.com',
              support: {
                email: 'enterprise@decisiontech.com',
                documentation: 'https://docs.decisiontech.com',
                community: 'https://forum.decisiontech.com'
              }
            }
          },
          maturityLevel: CapabilityMaturityLevel.OPTIMIZED,
          category: CapabilityCategory.ENTERPRISE,
          inputs: [],
          outputs: [],
          dependencies: [],
          config: {} as CapabilityModuleConfig,
          metadata: {
            tags: ['决策优化', '多目标优化', '风险评估', '运筹学'],
            author: 'DecisionTech Team',
            organization: 'DecisionTech Corp',
            createdAt: new Date('2023-08-15'),
            updatedAt: new Date('2024-01-20'),
            rating: 4.9,
            downloads: 3420,
            featured: true,
            verified: true
          },
          metrics: {
            performance: {
              latency: { avg: 300, p95: 500, p99: 800 },
              throughput: { current: 200, peak: 400, avg: 250 },
              errorRate: { current: 0.01, avg: 0.02 },
              availability: { current: 99.99, avg: 99.95 }
            },
            usage: {
              totalRequests: 180000,
              activeUsers: 280,
              peakConcurrency: 50
            },
            resources: {
              cpu: { current: 70, avg: 65, peak: 95 },
              memory: { current: 2048, avg: 1800, peak: 4096 },
              storage: { used: 8192, available: 16384 },
              network: { inbound: 120, outbound: 100 }
            }
          }
        },
        {
          id: 'adaptive_learning',
          name: '自适应学习',
          description: '在线学习和模型自适应更新系统，支持增量学习、迁移学习和元学习',
          type: CoreCapabilityType.LEARNING,
          subType: 'adaptive_learning',
          version: '2.3.1',
          source: {
            type: CapabilitySourceType.RESEARCH,
            details: {
              provider: 'MIT AI Lab',
              repository: 'https://github.com/mit-ai/adaptive-learning',
              version: '2.3.1',
              license: 'BSD-3-Clause',
              documentation: 'https://mit-ai.github.io/adaptive-learning',
              support: {
                email: 'ai-lab@mit.edu',
                documentation: 'https://mit-ai.github.io',
                community: 'https://groups.google.com/g/mit-ai-lab'
              }
            }
          },
          maturityLevel: CapabilityMaturityLevel.MANAGED,
          category: CapabilityCategory.RESEARCH,
          inputs: [],
          outputs: [],
          dependencies: [],
          config: {} as CapabilityModuleConfig,
          metadata: {
            tags: ['自适应学习', '在线学习', '迁移学习', '元学习'],
            author: 'MIT AI Lab',
            organization: 'MIT',
            createdAt: new Date('2023-04-10'),
            updatedAt: new Date('2023-12-15'),
            rating: 4.3,
            downloads: 2150,
            featured: false,
            verified: true
          },
          metrics: {
            performance: {
              latency: { avg: 150, p95: 250, p99: 400 },
              throughput: { current: 300, peak: 500, avg: 350 },
              errorRate: { current: 0.15, avg: 0.2 },
              availability: { current: 98.5, avg: 98.8 }
            },
            usage: {
              totalRequests: 120000,
              activeUsers: 180,
              peakConcurrency: 40
            },
            resources: {
              cpu: { current: 50, avg: 45, peak: 75 },
              memory: { current: 1536, avg: 1200, peak: 3072 },
              storage: { used: 6144, available: 10240 },
              network: { inbound: 90, outbound: 70 }
            }
          }
        }
      ];
      
      setCapabilities(mockCapabilities);
      
      // 提取热门标签
      const allTags = mockCapabilities.flatMap(cap => cap.metadata.tags);
      const tagCounts = allTags.reduce((acc, tag) => {
        acc[tag] = (acc[tag] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      const sortedTags = Object.entries(tagCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 20)
        .map(([tag]) => tag);
      setPopularTags(sortedTags);
      
    } catch (error) {
      message.error('加载能力库失败');
    } finally {
      setLoading(false);
    }
  }, []);
  
  /**
   * 加载推荐数据
   */
  const loadRecommendations = useCallback(async () => {
    try {
      // 基于已选择的能力生成推荐
      const mockRecommendations: CapabilityRecommendation[] = [
        {
          capability: capabilities[0], // 假设第一个能力
          score: 0.95,
          reason: '与您已选择的情感分析能力高度互补',
          tags: ['推荐', '高匹配度']
        }
      ];
      setRecommendations(mockRecommendations);
    } catch (error) {
      console.error('加载推荐失败:', error);
    }
  }, [capabilities, selectedCapabilities]);
  
  /**
   * 加载统计数据
   */
  const loadStatistics = useCallback(async () => {
    try {
      const stats = {
        total: capabilities.length,
        byType: capabilities.reduce((acc, cap) => {
          acc[cap.type] = (acc[cap.type] || 0) + 1;
          return acc;
        }, {} as Record<CoreCapabilityType, number>),
        byMaturity: capabilities.reduce((acc, cap) => {
          acc[cap.maturityLevel] = (acc[cap.maturityLevel] || 0) + 1;
          return acc;
        }, {} as Record<CapabilityMaturityLevel, number>),
        bySource: capabilities.reduce((acc, cap) => {
          acc[cap.source.type] = (acc[cap.source.type] || 0) + 1;
          return acc;
        }, {} as Record<CapabilitySourceType, number>)
      };
      setStatistics(stats);
    } catch (error) {
      console.error('加载统计数据失败:', error);
    }
  }, [capabilities]);
  
  /**
   * 过滤能力
   */
  const filterCapabilities = useCallback(async () => {
    setSearchLoading(true);
    
    try {
      // 模拟搜索延迟
      await new Promise(resolve => setTimeout(resolve, 300));
      
      let filtered = [...capabilities];
      
      // 文本搜索
      if (filters.text) {
        const searchText = filters.text.toLowerCase();
        filtered = filtered.filter(cap => 
          (cap?.name || '').toLowerCase().includes(searchText) ||
          cap.description.toLowerCase().includes(searchText) ||
          cap.metadata.tags.some(tag => tag.toLowerCase().includes(searchText))
        );
      }
      
      // 类型过滤
      if (filters.type !== 'all') {
        filtered = filtered.filter(cap => cap.type === filters.type);
      }
      
      // 成熟度过滤
      if (filters.maturity !== 'all') {
        filtered = filtered.filter(cap => cap.maturityLevel === filters.maturity);
      }
      
      // 来源过滤
      if (filters.source !== 'all') {
        filtered = filtered.filter(cap => cap.source.type === filters.source);
      }
      
      // 分类过滤
      if (filters.category !== 'all') {
        filtered = filtered.filter(cap => cap.category === filters.category);
      }
      
      // 标签过滤
      if (filters.tags.length > 0) {
        filtered = filtered.filter(cap => 
          filters.tags.some(tag => cap.metadata.tags.includes(tag))
        );
      }
      
      // 评分过滤
      filtered = filtered.filter(cap => 
        cap.metadata.rating >= filters.rating[0] && 
        cap.metadata.rating <= filters.rating[1]
      );
      
      // 特色过滤
      if (filters.featured) {
        filtered = filtered.filter(cap => cap.metadata.featured);
      }
      
      // 验证过滤
      if (filters.verified) {
        filtered = filtered.filter(cap => cap.metadata.verified);
      }
      
      // 作者过滤
      if (filters.author) {
        filtered = filtered.filter(cap => 
          cap.metadata.author.toLowerCase().includes(filters.author.toLowerCase())
        );
      }
      
      // 组织过滤
      if (filters.organization) {
        filtered = filtered.filter(cap => 
          cap.metadata.organization.toLowerCase().includes(filters.organization.toLowerCase())
        );
      }
      
      // 排序
      filtered.sort((a, b) => {
        switch (sortBy) {
          case 'rating':
            return b.metadata.rating - a.metadata.rating;
          case 'downloads':
            return b.metadata.downloads - a.metadata.downloads;
          case 'updated':
            return new Date(b.metadata.updatedAt).getTime() - new Date(a.metadata.updatedAt).getTime();
          case 'name':
            return a.name.localeCompare(b.name);
          case 'popularity':
            return b.metadata.downloads - a.metadata.downloads; // 简化为下载量
          default: // relevance
            return 0;
        }
      });
      
      setFilteredCapabilities(filtered);
    } catch (error) {
      message.error('搜索失败');
    } finally {
      setSearchLoading(false);
    }
  }, [capabilities, filters, sortBy]);
  
  /**
   * 处理搜索
   */
  const handleSearch = useCallback((value: string) => {
    setFilters(prev => ({ ...prev, text: value }));
  }, []);
  
  /**
   * 处理过滤器变更
   */
  const handleFilterChange = useCallback((key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);
  
  /**
   * 重置过滤器
   */
  const resetFilters = useCallback(() => {
    setFilters({
      text: '',
      type: 'all',
      maturity: 'all',
      source: 'all',
      category: 'all',
      tags: [],
      rating: [0, 5],
      featured: false,
      verified: false,
      author: '',
      organization: '',
      dateRange: null
    });
  }, []);
  
  /**
   * 处理能力选择
   */
  const handleCapabilitySelect = useCallback((capability: CoreCapabilityModule) => {
    onCapabilitySelect(capability);
    if (mode === 'select') {
      message.success(`已添加能力：${capability?.name || '未知能力'}`);
    }
  }, [onCapabilitySelect, mode]);
  
  /**
   * 处理能力详情查看
   */
  const handleCapabilityDetail = useCallback((capability: CoreCapabilityModule) => {
    setSelectedCapability(capability);
    setDetailVisible(true);
  }, []);
  
  /**
   * 获取能力类型图标
   */
  const getCapabilityIcon = (type: CoreCapabilityType) => {
    const iconMap = {
      [CoreCapabilityType.COGNITIVE]: <BulbOutlined />,
      [CoreCapabilityType.REASONING]: <ThunderboltOutlined />,
      [CoreCapabilityType.DECISION]: <ApartmentOutlined />,
      [CoreCapabilityType.LEARNING]: <BookOutlined />
    };
    return iconMap[type] || <SettingOutlined />;
  };
  
  /**
   * 获取能力类型颜色
   */
  const getCapabilityColor = (type: CoreCapabilityType) => {
    const colorMap = {
      [CoreCapabilityType.COGNITIVE]: '#1890ff',
      [CoreCapabilityType.REASONING]: '#52c41a',
      [CoreCapabilityType.DECISION]: '#fa8c16',
      [CoreCapabilityType.LEARNING]: '#eb2f96'
    };
    return colorMap[type] || '#666';
  };
  
  /**
   * 获取成熟度等级颜色
   */
  const getMaturityColor = (level: CapabilityMaturityLevel) => {
    const colorMap = {
      [CapabilityMaturityLevel.INITIAL]: '#ff4d4f',
      [CapabilityMaturityLevel.MANAGED]: '#fa8c16',
      [CapabilityMaturityLevel.DEFINED]: '#fadb14',
      [CapabilityMaturityLevel.QUANTIFIED]: '#52c41a',
      [CapabilityMaturityLevel.OPTIMIZED]: '#1890ff'
    };
    return colorMap[level] || '#666';
  };
  
  /**
   * 渲染能力卡片
   */
  const renderCapabilityCard = (capability: CoreCapabilityModule) => {
    const isSelected = selectedCapabilities.some(cap => cap.id === capability.id);
    
    return (
      <Card
        key={capability.id}
        className={`capability-card ${isSelected ? 'selected' : ''} ${viewMode}`}
        hoverable
        size="small"
        cover={
          viewMode === 'grid' ? (
            <div className="capability-cover">
              <div className="capability-icon" style={{ color: getCapabilityColor(capability.type) }}>
                {getCapabilityIcon(capability.type)}
              </div>
              <div className="capability-badges">
                {capability.metadata.featured && (
                  <Badge.Ribbon text="精选" color="gold" />
                )}
                {capability.metadata.verified && (
                  <Tooltip title="已验证">
                    <CheckCircleOutlined className="verified-icon" />
                  </Tooltip>
                )}
              </div>
            </div>
          ) : null
        }
        actions={[
          <Tooltip title="查看详情">
            <EyeOutlined onClick={() => handleCapabilityDetail(capability)} />
          </Tooltip>,
          <Tooltip title={mode === 'select' ? '添加能力' : '收藏'}>
            {mode === 'select' ? (
              <PlusOutlined onClick={() => handleCapabilitySelect(capability)} />
            ) : (
              <HeartOutlined />
            )}
          </Tooltip>,
          <Tooltip title="分享">
            <ShareAltOutlined />
          </Tooltip>,
          <Tooltip title="下载">
            <DownloadOutlined />
          </Tooltip>
        ]}
      >
        <Card.Meta
          avatar={
            viewMode === 'list' ? (
              <Avatar 
                icon={getCapabilityIcon(capability.type)}
                style={{ backgroundColor: getCapabilityColor(capability.type) }}
              />
            ) : null
          }
          title={capability?.name || '未知能力'}
          description={
            <div>
              <Paragraph ellipsis={{ rows: 2 }}>{capability.description}</Paragraph>
              <div>
                <Text type="secondary">评分：</Text>
                <Rate disabled defaultValue={capability.metadata.rating} size="small" />
              </div>
              <div style={{ marginTop: 4 }}>
                {capability.metadata.tags.map(tag => (
                  <Tag key={tag} size="small" color="blue">{tag}</Tag>
                ))}
              </div>
            </div>
          }
        />
      </Card>
    );
 };
 
  /**
   * 渲染过滤器抽屉
   */
  const renderFilterDrawer = () => {
    return (
      <Drawer
        title="高级过滤"
        placement="right"
        width={400}
        open={filterDrawerVisible}
        onClose={() => setFilterDrawerVisible(false)}
        extra={
          <Button onClick={resetFilters}>重置</Button>
        }
      >
        <div className="filter-content">
          <Collapse defaultActiveKey={['type', 'quality', 'source']} ghost>
            <Panel header="能力类型" key="type">
              <Radio.Group 
                value={filters.type} 
                onChange={(e) => handleFilterChange('type', e.target.value)}
              >
                <Space direction="vertical">
                  <Radio value="all">全部</Radio>
                  <Radio value={CoreCapabilityType.COGNITIVE}>认知能力</Radio>
                  <Radio value={CoreCapabilityType.REASONING}>推理能力</Radio>
                  <Radio value={CoreCapabilityType.DECISION}>决策能力</Radio>
                  <Radio value={CoreCapabilityType.LEARNING}>学习能力</Radio>
                </Space>
              </Radio.Group>
            </Panel>
            
            <Panel header="质量指标" key="quality">
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <Text>评分范围</Text>
                  <Slider
                    range
                    min={0}
                    max={5}
                    step={0.1}
                    value={filters.rating}
                    onChange={(value) => handleFilterChange('rating', value)}
                    marks={{ 0: '0', 2.5: '2.5', 5: '5' }}
                  />
                </div>
                
                <div>
                  <Text>成熟度等级</Text>
                  <Select 
                    value={filters.maturity} 
                    onChange={(value) => handleFilterChange('maturity', value)}
                    style={{ width: '100%', marginTop: 8 }}
                  >
                    <Option value="all">全部</Option>
                    <Option value={CapabilityMaturityLevel.INITIAL}>初始级</Option>
                    <Option value={CapabilityMaturityLevel.MANAGED}>管理级</Option>
                    <Option value={CapabilityMaturityLevel.DEFINED}>定义级</Option>
                    <Option value={CapabilityMaturityLevel.QUANTIFIED}>量化级</Option>
                    <Option value={CapabilityMaturityLevel.OPTIMIZED}>优化级</Option>
                  </Select>
                </div>
                
                <div>
                  <Checkbox 
                    checked={filters.featured}
                    onChange={(e) => handleFilterChange('featured', e.target.checked)}
                  >
                    仅显示精选能力
                  </Checkbox>
                </div>
                
                <div>
                  <Checkbox 
                    checked={filters.verified}
                    onChange={(e) => handleFilterChange('verified', e.target.checked)}
                  >
                    仅显示已验证能力
                  </Checkbox>
                </div>
              </Space>
            </Panel>
            
            <Panel header="来源" key="source">
              <Radio.Group 
                value={filters.source} 
                onChange={(e) => handleFilterChange('source', e.target.value)}
              >
                <Space direction="vertical">
                  <Radio value="all">全部</Radio>
                  <Radio value={CapabilitySourceType.BUILTIN}>内置</Radio>
                  <Radio value={CapabilitySourceType.MARKETPLACE}>市场</Radio>
                  <Radio value={CapabilitySourceType.COMMUNITY}>社区</Radio>
                  <Radio value={CapabilitySourceType.ENTERPRISE}>企业</Radio>
                  <Radio value={CapabilitySourceType.RESEARCH}>研究</Radio>
                </Space>
              </Radio.Group>
            </Panel>
            
            <Panel header="分类" key="category">
              <Select 
                value={filters.category} 
                onChange={(value) => handleFilterChange('category', value)}
                style={{ width: '100%' }}
              >
                <Option value="all">全部</Option>
                <Option value={CapabilityCategory.CORE}>核心</Option>
                <Option value={CapabilityCategory.ADVANCED}>高级</Option>
                <Option value={CapabilityCategory.SPECIALIZED}>专业</Option>
                <Option value={CapabilityCategory.EXPERIMENTAL}>实验</Option>
                <Option value={CapabilityCategory.ENTERPRISE}>企业</Option>
                <Option value={CapabilityCategory.RESEARCH}>研究</Option>
              </Select>
            </Panel>
            
            <Panel header="标签" key="tags">
              <div className="tag-filter">
                <Text style={{ marginBottom: 8, display: 'block' }}>热门标签</Text>
                <div className="popular-tags">
                  {popularTags.map(tag => (
                    <CheckableTag
                      key={tag}
                      checked={filters.tags.includes(tag)}
                      onChange={(checked) => {
                        const newTags = checked 
                          ? [...filters.tags, tag]
                          : filters.tags.filter(t => t !== tag);
                        handleFilterChange('tags', newTags);
                      }}
                    >
                      {tag}
                    </CheckableTag>
                  ))}
                </div>
              </div>
            </Panel>
            
            <Panel header="作者和组织" key="author">
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <Text>作者</Text>
                  <Input 
                    value={filters.author}
                    onChange={(e) => handleFilterChange('author', e.target.value)}
                    placeholder="输入作者名称"
                    style={{ marginTop: 8 }}
                  />
                </div>
                
                <div>
                  <Text>组织</Text>
                  <Input 
                    value={filters.organization}
                    onChange={(e) => handleFilterChange('organization', e.target.value)}
                    placeholder="输入组织名称"
                    style={{ marginTop: 8 }}
                  />
                </div>
              </Space>
            </Panel>
          </Collapse>
        </div>
      </Drawer>
    );
  };
  
  /**
   * 渲染能力详情模态框
   */
  const renderCapabilityDetail = () => {
    if (!selectedCapability) return null;
    
    return (
      <Modal
        title={
          <div className="detail-header">
            <Avatar 
              icon={getCapabilityIcon(selectedCapability.type)}
              style={{ backgroundColor: getCapabilityColor(selectedCapability.type) }}
            />
            <div className="detail-title">
              <Title level={4} style={{ margin: 0 }}>{selectedCapability?.name || '未知能力'}</Title>
              <Space>
                <Tag color={getCapabilityColor(selectedCapability.type)}>
                  {selectedCapability.type}
                </Tag>
                <Tag color={getMaturityColor(selectedCapability.maturityLevel)}>
                  {selectedCapability.maturityLevel}
                </Tag>
                {selectedCapability.metadata.verified && (
                  <Tag color="green">已验证</Tag>
                )}
                {selectedCapability.metadata.featured && (
                  <Tag color="gold">精选</Tag>
                )}
              </Space>
            </div>
          </div>
        }
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        width={800}
        footer={[
          <Button key="close" onClick={() => setDetailVisible(false)}>
            关闭
          </Button>,
          mode === 'select' && (
            <Button 
              key="add" 
              type="primary" 
              onClick={() => {
                handleCapabilitySelect(selectedCapability);
                setDetailVisible(false);
              }}
            >
              添加能力
            </Button>
          )
        ]}
      >
        <div className="capability-detail">
          <Tabs defaultActiveKey="overview">
            <TabPane tab="概览" key="overview">
              <div className="overview-content">
                <Paragraph>{selectedCapability.description}</Paragraph>
                
                <Row gutter={16}>
                  <Col span={8}>
                    <Statistic 
                      title="评分" 
                      value={selectedCapability.metadata.rating} 
                      precision={1}
                      suffix="/ 5"
                      prefix={<StarOutlined style={{ color: '#fadb14' }} />}
                    />
                  </Col>
                  <Col span={8}>
                    <Statistic 
                      title="下载量" 
                      value={selectedCapability.metadata.downloads}
                      prefix={<DownloadOutlined style={{ color: '#52c41a' }} />}
                    />
                  </Col>
                  <Col span={8}>
                    <Statistic 
                      title="版本" 
                      value={selectedCapability.version}
                      prefix={<ApiOutlined style={{ color: '#1890ff' }} />}
                    />
                  </Col>
                </Row>
                
                <Divider />
                
                <div className="capability-tags">
                  <Text strong>标签：</Text>
                  <div style={{ marginTop: 8 }}>
                    {selectedCapability.metadata.tags.map(tag => (
                      <Tag key={tag}>{tag}</Tag>
                    ))}
                  </div>
                </div>
                
                <Divider />
                
                <div className="capability-source">
                  <Text strong>来源信息：</Text>
                  <div style={{ marginTop: 8 }}>
                    <Space direction="vertical">
                      <div>提供商：{(selectedCapability.source as any)?.details?.provider || '未知'}</div>
                      <div>组织：{selectedCapability.metadata.organization}</div>
                      <div>作者：{selectedCapability.metadata.author}</div>
                      <div>许可证：{(selectedCapability.source as any)?.details?.license || '未知'}</div>
                      <div>更新时间：{selectedCapability.metadata.updatedAt ? new Date(selectedCapability.metadata.updatedAt).toLocaleDateString() : '未知'}</div>
                    </Space>
                  </div>
                </div>
              </div>
            </TabPane>
            
            <TabPane tab="性能指标" key="performance">
              <div className="performance-content">
                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <Card size="small" title="响应时间">
                      <Space direction="vertical" style={{ width: '100%' }}>
                        <div>平均：{selectedCapability.metrics.avgResponseTime}ms</div>
                        <div>响应时间：{selectedCapability.metrics.performance.responseTime}ms</div>
                      </Space>
                    </Card>
                  </Col>
                  
                  <Col span={12}>
                    <Card size="small" title="吞吐量">
                      <Space direction="vertical" style={{ width: '100%' }}>
                        <div>当前：{selectedCapability.metrics.throughput}/s</div>
                        <div>性能吞吐量：{selectedCapability.metrics.performance.throughput}/s</div>
                      </Space>
                    </Card>
                  </Col>
                  
                  <Col span={12}>
                    <Card size="small" title="错误率">
                      <Space direction="vertical" style={{ width: '100%' }}>
                        <div>当前：{selectedCapability.metrics.errorRate}%</div>
                        <div>成功率：{selectedCapability.metrics.successRate}%</div>
                        <Progress 
                          percent={selectedCapability.metrics.errorRate} 
                          size="small"
                          status={selectedCapability.metrics.errorRate > 1 ? 'exception' : 'success'}
                        />
                      </Space>
                    </Card>
                  </Col>
                  
                  <Col span={12}>
                    <Card size="small" title="可用性">
                      <Space direction="vertical" style={{ width: '100%' }}>
                        <div>可靠性：{selectedCapability.metrics.performance.reliability}%</div>
                        <div>准确性：{selectedCapability.metrics.performance.accuracy}%</div>
                        <Progress 
                          percent={selectedCapability.metrics.performance.reliability} 
                          size="small"
                          status={selectedCapability.metrics.performance.reliability > 99 ? 'success' : 'normal'}
                        />
                      </Space>
                    </Card>
                  </Col>
                </Row>
              </div>
            </TabPane>
            
            <TabPane tab="使用统计" key="usage">
              <div className="usage-content">
                <Row gutter={[16, 16]}>
                  <Col span={8}>
                    <Statistic 
                      title="总请求数" 
                      value={selectedCapability.metrics.usage.totalRequests}
                      prefix={<ApiOutlined />}
                    />
                  </Col>
                  <Col span={8}>
                    <Statistic 
                      title="活跃用户" 
                      value={selectedCapability.metrics.usage.activeUsers}
                      prefix={<TeamOutlined />}
                    />
                  </Col>
                  <Col span={8}>
                    <Statistic 
                      title="峰值并发" 
                      value={selectedCapability.metrics.usage.peakConcurrency}
                      prefix={<ThunderboltOutlined />}
                    />
                  </Col>
                </Row>
                
                <Divider />
                
                <div className="resource-usage">
                  <Title level={5}>资源使用情况</Title>
                  <Row gutter={[16, 16]}>
                    <Col span={12}>
                      <div className="resource-item">
                        <Text>CPU使用率</Text>
                        <Progress 
                          percent={selectedCapability.metrics.resources.cpu.current} 
                          strokeColor={selectedCapability.metrics.resources.cpu.current > 80 ? '#ff4d4f' : '#52c41a'}
                        />
                      </div>
                    </Col>
                    <Col span={12}>
                      <div className="resource-item">
                        <Text>内存使用 ({selectedCapability.metrics.resources.memory.current}MB)</Text>
                        <Progress 
                          percent={(selectedCapability.metrics.resources.memory.current / selectedCapability.metrics.resources.memory.peak) * 100} 
                          strokeColor={selectedCapability.metrics.resources.memory.current > selectedCapability.metrics.resources.memory.peak * 0.8 ? '#ff4d4f' : '#52c41a'}
                        />
                      </div>
                    </Col>
                  </Row>
                </div>
              </div>
            </TabPane>
            
            <TabPane tab="文档" key="documentation">
              <div className="documentation-content">
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Alert
                    message="文档链接"
                    description={
                      <Space direction="vertical">
                        {selectedCapability.source.details.documentation && (
                          <a href={selectedCapability.source.details.documentation} target="_blank" rel="noopener noreferrer">
                            官方文档
                          </a>
                        )}
                        {selectedCapability.source.details.repository && (
                          <a href={selectedCapability.source.details.repository} target="_blank" rel="noopener noreferrer">
                            源码仓库
                          </a>
                        )}
                        {selectedCapability.source.details.support.community && (
                          <a href={selectedCapability.source.details.support.community} target="_blank" rel="noopener noreferrer">
                            社区支持
                          </a>
                        )}
                      </Space>
                    }
                    type="info"
                    showIcon
                  />
                  
                  <div className="api-info">
                    <Title level={5}>API信息</Title>
                    <Paragraph>
                      该能力模块提供标准的RESTful API接口，支持JSON格式的输入输出。
                      详细的API文档请参考上方的官方文档链接。
                    </Paragraph>
                  </div>
                  
                  <div className="integration-guide">
                    <Title level={5}>集成指南</Title>
                    <Paragraph>
                      1. 安装依赖包<br/>
                      2. 配置API密钥<br/>
                      3. 初始化能力模块<br/>
                      4. 调用相关接口<br/>
                      5. 处理返回结果
                    </Paragraph>
                  </div>
                </Space>
              </div>
            </TabPane>
          </Tabs>
        </div>
      </Modal>
    );
  };
  
  return (
    <Drawer
      title={
        <div className="library-header">
          <div className="header-title">
            <DatabaseOutlined style={{ marginRight: 8 }} />
            <span>能力库</span>
            <Badge count={filteredCapabilities.length} style={{ marginLeft: 8 }} />
          </div>
          <div className="header-actions">
            <Space>
              <Tooltip title="智能推荐">
                <Button 
                  icon={<RobotOutlined />}
                  onClick={() => setRecommendationsVisible(true)}
                >
                  推荐
                </Button>
              </Tooltip>
              <Tooltip title="高级过滤">
                <Button 
                  icon={<FilterOutlined />}
                  onClick={() => setFilterDrawerVisible(true)}
                >
                  过滤
                </Button>
              </Tooltip>
            </Space>
          </div>
        </div>
      }
      placement="right"
      width={1000}
      open={visible}
      onClose={onClose}
      className="enhanced-capability-library"
    >
      <div className="library-content">
        {/* 搜索和工具栏 */}
        <div className="search-toolbar">
          <div className="search-section">
            <Search
              placeholder="搜索能力模块..."
              value={filters.text}
              onChange={(e) => handleSearch(e.target.value)}
              onSearch={handleSearch}
              loading={searchLoading}
              style={{ width: 300 }}
            />
            
            <Space style={{ marginLeft: 16 }}>
              <Select 
                value={sortBy} 
                onChange={setSortBy}
                style={{ width: 120 }}
              >
                <Option value="relevance">相关性</Option>
                <Option value="rating">评分</Option>
                <Option value="downloads">下载量</Option>
                <Option value="updated">更新时间</Option>
                <Option value="name">名称</Option>
                <Option value="popularity">热度</Option>
              </Select>
              
              <Radio.Group value={viewMode} onChange={(e) => setViewMode(e.target.value)}>
                <Radio.Button value="grid">网格</Radio.Button>
                <Radio.Button value="list">列表</Radio.Button>
                <Radio.Button value="compact">紧凑</Radio.Button>
              </Radio.Group>
            </Space>
          </div>
          
          <div className="quick-filters">
            <Space wrap>
              <Text type="secondary">快速过滤：</Text>
              {Object.values(CoreCapabilityType).map(type => (
                <CheckableTag
                  key={type}
                  checked={filters.type === type}
                  onChange={(checked) => handleFilterChange('type', checked ? type : 'all')}
                >
                  {type}
                </CheckableTag>
              ))}
              <CheckableTag
                checked={filters.featured}
                onChange={(checked) => handleFilterChange('featured', checked)}
              >
                精选
              </CheckableTag>
              <CheckableTag
                checked={filters.verified}
                onChange={(checked) => handleFilterChange('verified', checked)}
              >
                已验证
              </CheckableTag>
            </Space>
          </div>
        </div>
        
        {/* 统计信息 */}
        <div className="statistics-section">
          <Row gutter={16}>
            <Col span={6}>
              <Statistic title="总计" value={statistics.total} prefix={<DatabaseOutlined />} />
            </Col>
            <Col span={6}>
              <Statistic 
                title="认知能力" 
                value={statistics.byType[CoreCapabilityType.COGNITIVE] || 0} 
                prefix={<BulbOutlined style={{ color: '#1890ff' }} />}
              />
            </Col>
            <Col span={6}>
              <Statistic 
                title="推理能力" 
                value={statistics.byType[CoreCapabilityType.REASONING] || 0} 
                prefix={<ThunderboltOutlined style={{ color: '#52c41a' }} />}
              />
            </Col>
            <Col span={6}>
              <Statistic 
                title="决策能力" 
                value={statistics.byType[CoreCapabilityType.DECISION] || 0} 
                prefix={<ApartmentOutlined style={{ color: '#fa8c16' }} />}
              />
            </Col>
          </Row>
        </div>
        
        <Divider />
        
        {/* 能力列表 */}
        <div className="capabilities-section">
          {loading ? (
            <div className="loading-container">
              <Spin size="large" tip="加载能力库..." />
            </div>
          ) : filteredCapabilities.length === 0 ? (
            <Empty 
              description="未找到匹配的能力模块"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            >
              <Button type="primary" onClick={resetFilters}>
                重置过滤条件
              </Button>
            </Empty>
          ) : (
            <div className={`capabilities-grid ${viewMode}`}>
              {filteredCapabilities.map(capability => renderCapabilityCard(capability))}
            </div>
          )}
        </div>
      </div>
      
      {/* 过滤器抽屉 */}
      {renderFilterDrawer()}
      
      {/* 能力详情模态框 */}
      {renderCapabilityDetail()}
      
      {/* 推荐模态框 */}
      <Modal
        title="智能推荐"
        open={recommendationsVisible}
        onCancel={() => setRecommendationsVisible(false)}
        footer={null}
        width={600}
      >
        <div className="recommendations-content">
          {recommendations.length === 0 ? (
            <Empty description="暂无推荐" />
          ) : (
            <List
              dataSource={recommendations}
              renderItem={rec => (
                <List.Item
                  actions={[
                    <Button 
                      type="primary" 
                      size="small"
                      onClick={() => handleCapabilitySelect(rec.capability)}
                    >
                      添加
                    </Button>
                  ]}
                >
                  <List.Item.Meta
                    avatar={
                      <Avatar 
                        icon={getCapabilityIcon(rec.capability.type)}
                        style={{ backgroundColor: getCapabilityColor(rec.capability.type) }}
                      />
                    }
                    title={rec.capability?.name || '未知能力'}
                    description={
                      <div>
                        <Paragraph ellipsis={{ rows: 2 }}>{rec.reason}</Paragraph>
                        <div>
                          <Text type="secondary">匹配度：</Text>
                          <Progress 
                            percent={rec.score * 100} 
                            size="small" 
                            style={{ width: 100, display: 'inline-block', marginLeft: 8 }}
                          />
                        </div>
                        <div style={{ marginTop: 4 }}>
                          {rec.tags.map(tag => (
                            <Tag key={tag} size="small" color="blue">{tag}</Tag>
                          ))}
                        </div>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          )}
        </div>
      </Modal>
    </Drawer>
  );
};

export default EnhancedCapabilityLibrary;