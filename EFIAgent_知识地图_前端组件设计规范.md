# EFIAgent知识地图 - 前端组件设计规范

## 1. 设计系统概览

### 1.1 设计原则

- **一致性** - 统一的视觉语言和交互模式
- **可访问性** - 符合WCAG 2.1 AA标准
- **响应式** - 适配各种设备和屏幕尺寸
- **性能优先** - 快速加载和流畅交互
- **国际化** - 支持多语言和本地化

### 1.2 技术栈

```json
{
  "framework": "React 18.2+",
  "language": "TypeScript 5.0+",
  "ui_library": "Ant Design 5.0+",
  "styling": "Styled Components + CSS Modules",
  "state_management": "Redux Toolkit + RTK Query",
  "routing": "React Router 6.0+",
  "testing": "Jest + React Testing Library",
  "build_tool": "Vite 4.0+",
  "linting": "ESLint + Prettier"
}
```

### 1.3 项目结构

```
src/
├── components/              # 通用组件
│   ├── Layout/             # 布局组件
│   ├── Form/               # 表单组件
│   ├── Table/              # 表格组件
│   ├── Chart/              # 图表组件
│   └── Common/             # 基础组件
├── pages/                  # 页面组件
│   ├── KnowledgeMap/       # 知识地图页面
│   ├── Search/             # 搜索页面
│   ├── Analysis/           # 分析页面
│   └── Collaboration/      # 协作页面
├── hooks/                  # 自定义Hooks
├── services/               # API服务
├── store/                  # 状态管理
├── utils/                  # 工具函数
├── types/                  # TypeScript类型定义
├── styles/                 # 全局样式
└── assets/                 # 静态资源
```

## 2. 设计令牌 (Design Tokens)

### 2.1 颜色系统

```typescript
// tokens/colors.ts
export const colors = {
  // 主色调
  primary: {
    50: '#e6f7ff',
    100: '#bae7ff',
    200: '#91d5ff',
    300: '#69c0ff',
    400: '#40a9ff',
    500: '#1890ff',  // 主色
    600: '#096dd9',
    700: '#0050b3',
    800: '#003a8c',
    900: '#002766',
  },

  // 辅助色
  secondary: {
    50: '#f6ffed',
    100: '#d9f7be',
    200: '#b7eb8f',
    300: '#95de64',
    400: '#73d13d',
    500: '#52c41a',  // 成功色
    600: '#389e0d',
    700: '#237804',
    800: '#135200',
    900: '#092b00',
  },

  // 警告色
  warning: {
    50: '#fffbe6',
    100: '#fff1b8',
    200: '#ffe58f',
    300: '#ffd666',
    400: '#ffc53d',
    500: '#faad14',  // 警告色
    600: '#d48806',
    700: '#ad6800',
    800: '#874d00',
    900: '#613400',
  },

  // 错误色
  error: {
    50: '#fff2f0',
    100: '#ffccc7',
    200: '#ffa39e',
    300: '#ff7875',
    400: '#ff4d4f',
    500: '#f5222d',  // 错误色
    600: '#cf1322',
    700: '#a8071a',
    800: '#820014',
    900: '#5c0011',
  },

  // 中性色
  neutral: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#f0f0f0',
    300: '#d9d9d9',
    400: '#bfbfbf',
    500: '#8c8c8c',
    600: '#595959',
    700: '#434343',
    800: '#262626',
    900: '#1f1f1f',
    1000: '#141414',
  }
};
```

### 2.2 字体系统

```typescript
// tokens/typography.ts
export const typography = {
  fontFamily: {
    sans: ['Inter', 'Noto Sans SC', 'system-ui', 'sans-serif'],
    mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
  },

  fontSize: {
    xs: '12px',
    sm: '14px',
    base: '16px',
    lg: '18px',
    xl: '20px',
    '2xl': '24px',
    '3xl': '30px',
    '4xl': '36px',
    '5xl': '48px',
  },

  fontWeight: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },

  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
};
```

### 2.3 间距系统

```typescript
// tokens/spacing.ts
export const spacing = {
  0: '0px',
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
  10: '40px',
  12: '48px',
  16: '64px',
  20: '80px',
  24: '96px',
  32: '128px',
};
```

### 2.4 阴影系统

```typescript
// tokens/shadows.ts
export const shadows = {
  xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  base: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  md: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  lg: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  xl: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
};
```

## 3. 基础组件

### 3.1 按钮组件 (Button)

```typescript
// components/Common/Button/Button.tsx
import React from 'react';
import styled from 'styled-components';
import { Button as AntButton, ButtonProps as AntButtonProps } from 'antd';

interface ButtonProps extends AntButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

const StyledButton = styled(AntButton)<ButtonProps>`
  ${({ variant, theme }) => {
    switch (variant) {
      case 'secondary':
        return `
          background-color: ${theme.colors.secondary[500]};
          border-color: ${theme.colors.secondary[500]};
          color: white;

          &:hover {
            background-color: ${theme.colors.secondary[600]};
            border-color: ${theme.colors.secondary[600]};
          }
        `;
      case 'outline':
        return `
          background-color: transparent;
          border-color: ${theme.colors.primary[500]};
          color: ${theme.colors.primary[500]};

          &:hover {
            background-color: ${theme.colors.primary[50]};
            color: ${theme.colors.primary[600]};
          }
        `;
      case 'ghost':
        return `
          background-color: transparent;
          border-color: transparent;
          color: ${theme.colors.neutral[700]};

          &:hover {
            background-color: ${theme.colors.neutral[100]};
          }
        `;
      case 'danger':
        return `
          background-color: ${theme.colors.error[500]};
          border-color: ${theme.colors.error[500]};
          color: white;

          &:hover {
            background-color: ${theme.colors.error[600]};
            border-color: ${theme.colors.error[600]};
          }
        `;
      default:
        return '';
    }
  }}

  ${({ size }) => {
    switch (size) {
      case 'small':
        return `
          height: 32px;
          padding: 4px 12px;
          font-size: 14px;
        `;
      case 'large':
        return `
          height: 48px;
          padding: 12px 24px;
          font-size: 16px;
        `;
      default:
        return `
          height: 40px;
          padding: 8px 16px;
          font-size: 14px;
        `;
    }
  }}

  ${({ fullWidth }) => fullWidth && `
    width: 100%;
  `}

  transition: all 0.2s cubic-bezier(0.645, 0.045, 0.355, 1);
`;

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'medium',
  loading = false,
  icon,
  fullWidth = false,
  ...props
}) => {
  return (
    <StyledButton
      variant={variant}
      size={size}
      loading={loading}
      icon={icon}
      fullWidth={fullWidth}
      {...props}
    >
      {children}
    </StyledButton>
  );
};

export default Button;
```

### 3.2 输入框组件 (Input)

```typescript
// components/Common/Input/Input.tsx
import React, { forwardRef } from 'react';
import styled from 'styled-components';
import { Input as AntInput, InputProps as AntInputProps } from 'antd';

interface InputProps extends AntInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  fullWidth?: boolean;
}

const InputWrapper = styled.div<{ fullWidth?: boolean }>`
  ${({ fullWidth }) => fullWidth && `
    width: 100%;
  `}
`;

const Label = styled.label`
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.neutral[700]};
  font-size: ${({ theme }) => theme.fontSize.sm};
`;

const StyledInput = styled(AntInput)<{ hasError?: boolean }>`
  border-radius: 8px;
  border: 2px solid ${({ hasError, theme }) =>
    hasError ? theme.colors.error[400] : theme.colors.neutral[300]};

  &:focus {
    border-color: ${({ theme }) => theme.colors.primary[500]};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.primary[100]};
  }

  &:hover {
    border-color: ${({ hasError, theme }) =>
      hasError ? theme.colors.error[400] : theme.colors.neutral[400]};
  }
`;

const ErrorMessage = styled.div`
  color: ${({ theme }) => theme.colors.error[500]};
  font-size: ${({ theme }) => theme.fontSize.xs};
  margin-top: 4px;
`;

const HelperText = styled.div`
  color: ${({ theme }) => theme.colors.neutral[500]};
  font-size: ${({ theme }) => theme.fontSize.xs};
  margin-top: 4px;
`;

export const Input: React.FC<InputProps> = forwardRef<any, InputProps>(
  ({ label, error, helperText, required, fullWidth, ...props }, ref) => {
    return (
      <InputWrapper fullWidth={fullWidth}>
        {label && (
          <Label>
            {label}
            {required && <span style={{ color: 'red' }}> *</span>}
          </Label>
        )}
        <StyledInput
          ref={ref}
          hasError={!!error}
          {...props}
        />
        {error && <ErrorMessage>{error}</ErrorMessage>}
        {helperText && !error && <HelperText>{helperText}</HelperText>}
      </InputWrapper>
    );
  }
);

Input.displayName = 'Input';

export default Input;
```

### 3.3 卡片组件 (Card)

```typescript
// components/Common/Card/Card.tsx
import React from 'react';
import styled from 'styled-components';
import { Card as AntCard, CardProps as AntCardProps } from 'antd';

interface CardProps extends AntCardProps {
  variant?: 'default' | 'outlined' | 'shadow';
  padding?: 'small' | 'medium' | 'large';
  hoverable?: boolean;
}

const StyledCard = styled(AntCard)<CardProps>`
  border-radius: 12px;

  ${({ variant, theme }) => {
    switch (variant) {
      case 'outlined':
        return `
          border: 2px solid ${theme.colors.neutral[200]};
          box-shadow: none;
        `;
      case 'shadow':
        return `
          border: none;
          box-shadow: ${theme.shadows.md};
        `;
      default:
        return `
          border: 1px solid ${theme.colors.neutral[200]};
          box-shadow: ${theme.shadows.sm};
        `;
    }
  }}

  ${({ padding, theme }) => {
    switch (padding) {
      case 'small':
        return `
          .ant-card-body {
            padding: ${theme.spacing[3]};
          }
        `;
      case 'large':
        return `
          .ant-card-body {
            padding: ${theme.spacing[8]};
          }
        `;
      default:
        return `
          .ant-card-body {
            padding: ${theme.spacing[6]};
          }
        `;
    }
  }}

  ${({ hoverable }) => hoverable && `
    transition: all 0.2s cubic-bezier(0.645, 0.045, 0.355, 1);

    &:hover {
      transform: translateY(-2px);
      box-shadow: ${({ theme }) => theme.shadows.lg};
    }
  `}
`;

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 'medium',
  hoverable = false,
  ...props
}) => {
  return (
    <StyledCard
      variant={variant}
      padding={padding}
      hoverable={hoverable}
      bordered={variant !== 'shadow'}
      {...props}
    >
      {children}
    </StyledCard>
  );
};

export default Card;
```

## 4. 知识地图专用组件

### 4.1 知识地图画布 (KnowledgeMapCanvas)

```typescript
// pages/KnowledgeMap/components/KnowledgeMapCanvas.tsx
import React, { useRef, useEffect, useState, useCallback } from 'react';
import styled from 'styled-components';
import * as d3 from 'd3';
import { Button, Slider, Select, Space } from 'antd';
import { ZoomInOutlined, ZoomOutOutlined, ExpandOutlined } from '@ant-design/icons';
import { GraphData, GraphNode, GraphEdge } from '@/types/graph';

interface KnowledgeMapCanvasProps {
  data: GraphData;
  onNodeClick?: (node: GraphNode) => void;
  onNodeDoubleClick?: (node: GraphNode) => void;
  onEdgeClick?: (edge: GraphEdge) => void;
  width?: number;
  height?: number;
}

const CanvasContainer = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: ${({ theme }) => theme.colors.neutral[50]};
  border-radius: 8px;
`;

const SVGContainer = styled.svg`
  width: 100%;
  height: 100%;
  cursor: grab;

  &:active {
    cursor: grabbing;
  }
`;

const ControlsContainer = styled.div`
  position: absolute;
  top: 16px;
  right: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: white;
  padding: 12px;
  border-radius: 8px;
  box-shadow: ${({ theme }) => theme.shadows.md};
  z-index: 10;
`;

const NodeGroup = styled.g`
  cursor: pointer;

  &:hover {
    .node-circle {
      stroke-width: 3px;
      filter: brightness(1.1);
    }
  }

  &.selected .node-circle {
    stroke: ${({ theme }) => theme.colors.primary[500]};
    stroke-width: 3px;
  }
`;

const EdgeLine = styled.line`
  stroke: ${({ theme }) => theme.colors.neutral[400]};
  stroke-width: 2;
  fill: none;

  &:hover {
    stroke: ${({ theme }) => theme.colors.primary[500]};
    stroke-width: 3px;
  }
`;

const NodeLabel = styled.text`
  font-size: 12px;
  font-weight: 500;
  text-anchor: middle;
  fill: ${({ theme }) => theme.colors.neutral[700]};
  pointer-events: none;
`;

export const KnowledgeMapCanvas: React.FC<KnowledgeMapCanvasProps> = ({
  data,
  onNodeClick,
  onNodeDoubleClick,
  onEdgeClick,
  width = 800,
  height = 600,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const simulationRef = useRef<d3.Simulation<any, any>>();
  const [zoom, setZoom] = useState(1);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  // 初始化D3力导向图
  const initializeSimulation = useCallback(() => {
    if (!svgRef.current || !data.nodes.length) return;

    // 清除之前的内容
    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3.select(svgRef.current);
    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    // 创建缩放行为
    const zoomBehavior = d3
      .zoom()
      .scaleExtent([0.1, 10])
      .on('zoom', (event) => {
        const { transform } = event;
        d3.select(svgRef.current)
          .select('.graph-container')
          .attr('transform', transform);

        setZoom(transform.k);
      });

    svg.call(zoomBehavior);

    // 创建力导向图模拟
    const simulation = d3
      .forceSimulation(data.nodes)
      .force('link', d3.forceLink(data.edges).id((d: any) => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(30));

    simulationRef.current = simulation;

    // 创建图形容器
    const graphContainer = svg.append('g').attr('class', 'graph-container');

    // 创建连线
    const link = graphContainer
      .append('g')
      .selectAll('line')
      .data(data.edges)
      .enter()
      .append('line')
      .attr('class', 'edge')
      .style('stroke', '#999')
      .style('stroke-width', 2)
      .on('click', (event, d) => onEdgeClick?.(d));

    // 创建节点组
    const node = graphContainer
      .append('g')
      .selectAll('g')
      .data(data.nodes)
      .enter()
      .append('g')
      .attr('class', 'node-group')
      .on('click', (event, d) => {
        setSelectedNode(d.id);
        onNodeClick?.(d);
      })
      .on('dblclick', (event, d) => {
        event.stopPropagation();
        onNodeDoubleClick?.(d);
      })
      .call(d3
        .drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended) as any
      );

    // 添加节点圆形
    node
      .append('circle')
      .attr('class', 'node-circle')
      .attr('r', (d: GraphNode) => d.size || 20)
      .style('fill', (d: GraphNode) => d.color || '#1890ff')
      .style('stroke', '#fff')
      .style('stroke-width', 2);

    // 添加节点标签
    node
      .append('text')
      .attr('class', 'node-label')
      .attr('dy', (d: GraphNode) => (d.size || 20) + 15)
      .text((d: GraphNode) => d.name)
      .style('font-size', '12px')
      .style('text-anchor', 'middle');

    // 更新力导向图
    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });

    // 拖拽事件处理
    function dragstarted(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: any, d: any) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }
  }, [data, onNodeClick, onNodeDoubleClick, onEdgeClick]);

  useEffect(() => {
    initializeSimulation();
  }, [initializeSimulation]);

  // 控件功能
  const handleZoomIn = () => {
    const svg = d3.select(svgRef.current);
    svg.transition().duration(300).call(
      d3.zoom().transform,
      d3.zoomIdentity.scale(zoom * 1.2)
    );
  };

  const handleZoomOut = () => {
    const svg = d3.select(svgRef.current);
    svg.transition().duration(300).call(
      d3.zoom().transform,
      d3.zoomIdentity.scale(zoom * 0.8)
    );
  };

  const handleReset = () => {
    const svg = d3.select(svgRef.current);
    svg.transition().duration(300).call(
      d3.zoom().transform,
      d3.zoomIdentity
    );
  };

  return (
    <CanvasContainer>
      <SVGContainer ref={svgRef} width={width} height={height} />

      <ControlsContainer>
        <Space direction="vertical">
          <Button
            icon={<ZoomInOutlined />}
            size="small"
            onClick={handleZoomIn}
          />
          <Button
            icon={<ZoomOutOutlined />}
            size="small"
            onClick={handleZoomOut}
          />
          <Button
            icon={<ExpandOutlined />}
            size="small"
            onClick={handleReset}
          />
        </Space>
      </ControlsContainer>
    </CanvasContainer>
  );
};

export default KnowledgeMapCanvas;
```

### 4.2 智能搜索框 (SmartSearch)

```typescript
// components/Search/SmartSearch.tsx
import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { AutoComplete, Input, Badge, Tag } from 'antd';
import { SearchOutlined, HistoryOutlined, FireOutlined } from '@ant-design/icons';
import { useSearchSuggestions } from '@/hooks/useSearch';
import { useSearchHistory } from '@/hooks/useSearchHistory';

const SearchContainer = styled.div`
  position: relative;
  width: 100%;
  max-width: 600px;
`;

const SearchInput = styled(Input)`
  .ant-input {
    border-radius: 24px;
    padding: 12px 20px;
    font-size: 16px;

    &::placeholder {
      color: ${({ theme }) => theme.colors.neutral[400]};
    }
  }

  .ant-input-group-addon {
    background: transparent;
    border: none;
    padding-right: 16px;
  }
`;

const SuggestionsContainer = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border-radius: 8px;
  box-shadow: ${({ theme }) => theme.shadows.lg};
  border: 1px solid ${({ theme }) => theme.colors.neutral[200]};
  z-index: 1000;
  margin-top: 8px;
  display: ${({ show }) => (show ? 'block' : 'none')};
`;

const SuggestionSection = styled.div`
  padding: 8px 0;

  &:not(:last-child) {
    border-bottom: 1px solid ${({ theme }) => theme.colors.neutral[100]};
  }
`;

const SuggestionHeader = styled.div`
  display: flex;
  align-items: center;
  padding: 8px 16px;
  font-size: 12px;
  color: ${({ theme }) => theme.colors.neutral[500]};
  font-weight: 500;
`;

const SuggestionItem = styled.div`
  padding: 8px 16px 8px 40px;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: ${({ theme }) => theme.colors.neutral[50]};
  }

  .suggestion-text {
    font-size: 14px;
    color: ${({ theme }) => theme.colors.neutral[700]};
  }

  .suggestion-type {
    font-size: 12px;
    color: ${({ theme }) => theme.colors.neutral[500]};
    margin-left: 8px;
  }
`;

const RecentSearches = styled.div`
  padding: 8px 16px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const SearchTag = styled(Tag)`
  cursor: pointer;
  border-radius: 12px;
  font-size: 12px;

  &:hover {
    background-color: ${({ theme }) => theme.colors.primary[100]};
    border-color: ${({ theme }) => theme.colors.primary[300]};
  }
`;

interface SmartSearchProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  className?: string;
}

export const SmartSearch: React.FC<SmartSearchProps> = ({
  onSearch,
  placeholder = "搜索企业知识...",
  className,
}) => {
  const [query, setQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [focused, setFocused] = useState(false);

  const {
    suggestions,
    loading: suggestionsLoading,
    fetchSuggestions,
  } = useSearchSuggestions();

  const {
    history,
    addToHistory,
    removeFromHistory,
  } = useSearchHistory();

  const searchRef = useRef<any>(null);

  // 搜索建议获取
  useEffect(() => {
    if (query.length >= 2) {
      fetchSuggestions(query);
    }
  }, [query, fetchSuggestions]);

  // 搜索处理
  const handleSearch = (searchQuery: string) => {
    if (searchQuery.trim()) {
      onSearch(searchQuery);
      addToHistory(searchQuery);
      setShowSuggestions(false);
      setQuery(searchQuery);
    }
  };

  // 建议项选择
  const handleSuggestionSelect = (suggestion: string) => {
    handleSearch(suggestion);
  };

  // 键盘事件处理
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch(query);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setFocused(false);
    }
  };

  // 自动完成选项
  const options = suggestions.map((suggestion) => ({
    value: suggestion.text,
    label: (
      <div>
        <span>{suggestion.text}</span>
        <span className="suggestion-type">{suggestion.type}</span>
      </div>
    ),
  }));

  return (
    <SearchContainer className={className}>
      <AutoComplete
        ref={searchRef}
        style={{ width: '100%' }}
        options={options}
        onSelect={handleSuggestionSelect}
        onSearch={setQuery}
        value={query}
        open={focused && showSuggestions}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          setTimeout(() => {
            setFocused(false);
            setShowSuggestions(false);
          }, 200);
        }}
      >
        <SearchInput
          size="large"
          placeholder={placeholder}
          prefix={<SearchOutlined />}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowSuggestions(true)}
        />
      </AutoComplete>

      {(focused || showSuggestions) && (
        <SuggestionsContainer show>
          {/* 最近搜索 */}
          {history.length > 0 && (
            <SuggestionSection>
              <SuggestionHeader>
                <HistoryOutlined /> 最近搜索
              </SuggestionHeader>
              <RecentSearches>
                {history.slice(0, 5).map((item, index) => (
                  <SearchTag
                    key={index}
                    closable
                    onClose={() => removeFromHistory(index)}
                    onClick={() => handleSuggestionSelect(item)}
                  >
                    {item}
                  </SearchTag>
                ))}
              </RecentSearches>
            </SuggestionSection>
          )}

          {/* 热门搜索 */}
          <SuggestionSection>
            <SuggestionHeader>
              <FireOutlined /> 热门问题
            </SuggestionHeader>
            {[
              "销售订单处理涉及哪些系统？",
              "如何分析系统依赖关系？",
              "哪些业务流程影响最大？"
            ].map((hotQuery, index) => (
              <SuggestionItem
                key={index}
                onClick={() => handleSuggestionSelect(hotQuery)}
              >
                <span className="suggestion-text">{hotQuery}</span>
              </SuggestionItem>
            ))}
          </SuggestionSection>
        </SuggestionsContainer>
      )}
    </SearchContainer>
  );
};

export default SmartSearch;
```

### 4.3 实体详情面板 (EntityDetailPanel)

```typescript
// components/Entity/EntityDetailPanel.tsx
import React, { useState } from 'react';
import styled from 'styled-components';
import {
  Card,
  Tabs,
  Tag,
  Button,
  Space,
  Divider,
  Timeline,
  Avatar,
  List,
  Badge,
  EditOutlined,
  ShareAltOutlined,
  DeleteOutlined,
} from 'antd';
import {
  EditOutlined as EditIcon,
  UserOutlined,
  ClockCircleOutlined,
  LinkOutlined,
  TagsOutlined,
} from '@ant-design/icons';
import { Entity, Relationship, User } from '@/types';

const { TabPane } = Tabs;

const PanelContainer = styled.div`
  width: 400px;
  height: 100%;
  background: white;
  border-left: 1px solid ${({ theme }) => theme.colors.neutral[200]};
  overflow-y: auto;
`;

const HeaderSection = styled.div`
  padding: 24px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.neutral[100]};
`;

const EntityTitle = styled.h2`
  margin: 0 0 8px 0;
  font-size: 20px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.neutral[800]};
`;

const EntityMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
  font-size: 14px;
  color: ${({ theme }) => theme.colors.neutral[600]};
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 8px;
`;

const ContentSection = styled.div`
  padding: 24px;
`;

const AttributeItem = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.neutral[50]};

  &:last-child {
    border-bottom: none;
  }
`;

const AttributeLabel = styled.span`
  font-weight: 500;
  color: ${({ theme }) => theme.colors.neutral[600]};
`;

const AttributeValue = styled.span`
  color: ${({ theme }) => theme.colors.neutral[800]};
`;

const RelationshipItem = styled.div`
  padding: 12px;
  border: 1px solid ${({ theme }) => theme.colors.neutral[200]};
  border-radius: 8px;
  margin-bottom: 12px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary[300]};
    box-shadow: ${({ theme }) => theme.shadows.sm};
  }
`;

const RelationshipHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
`;

const RelationshipType = styled(Tag)`
  font-size: 12px;
`;

const CollaborationItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
`;

interface EntityDetailPanelProps {
  entity: Entity;
  onClose?: () => void;
  onEdit?: (entity: Entity) => void;
  onShare?: (entity: Entity) => void;
  onDelete?: (entity: Entity) => void;
}

export const EntityDetailPanel: React.FC<EntityDetailPanelProps> = ({
  entity,
  onClose,
  onEdit,
  onShare,
  onDelete,
}) => {
  const [activeTab, setActiveTab] = useState('details');

  return (
    <PanelContainer>
      <HeaderSection>
        <EntityTitle>{entity.name}</EntityTitle>

        <EntityMeta>
          <Tag color="blue">{entity.type}</Tag>
          <Tag color="green">{entity.category}</Tag>
          <Badge status={entity.status === 'active' ? 'success' : 'default'} />
        </EntityMeta>

        <ActionButtons>
          <Button
            type="text"
            icon={<EditIcon />}
            onClick={() => onEdit?.(entity)}
          >
            编辑
          </Button>
          <Button
            type="text"
            icon={<ShareAltOutlined />}
            onClick={() => onShare?.(entity)}
          >
            分享
          </Button>
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => onDelete?.(entity)}
          >
            删除
          </Button>
        </ActionButtons>
      </HeaderSection>

      <ContentSection>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="基本信息" key="details">
            {/* 基本属性 */}
            <div style={{ marginBottom: 24 }}>
              <h4 style={{ marginBottom: 16 }}>描述</h4>
              <p style={{ color: '#666', lineHeight: 1.6 }}>
                {entity.description}
              </p>
            </div>

            {/* 自定义属性 */}
            {entity.attributes && Object.keys(entity.attributes).length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <h4 style={{ marginBottom: 16 }}>属性</h4>
                {Object.entries(entity.attributes).map(([key, value]) => (
                  <AttributeItem key={key}>
                    <AttributeLabel>{key}:</AttributeLabel>
                    <AttributeValue>{String(value)}</AttributeValue>
                  </AttributeItem>
                ))}
              </div>
            )}

            {/* 标签 */}
            {entity.tags && entity.tags.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <h4 style={{ marginBottom: 16 }}>
                  <TagsOutlined /> 标签
                </h4>
                <Space wrap>
                  {entity.tags.map((tag, index) => (
                    <Tag key={index}>{tag}</Tag>
                  ))}
                </Space>
              </div>
            )}

            {/* 元数据 */}
            <div>
              <h4 style={{ marginBottom: 16 }}>
                <ClockCircleOutlined /> 元数据
              </h4>
              <AttributeItem>
                <AttributeLabel>创建者:</AttributeLabel>
                <AttributeValue>{entity.metadata.created_by}</AttributeValue>
              </AttributeItem>
              <AttributeItem>
                <AttributeLabel>创建时间:</AttributeLabel>
                <AttributeValue>
                  {new Date(entity.metadata.created_at).toLocaleString()}
                </AttributeValue>
              </AttributeItem>
              <AttributeItem>
                <AttributeLabel>最后更新:</AttributeLabel>
                <AttributeValue>
                  {new Date(entity.metadata.updated_at).toLocaleString()}
                </AttributeValue>
              </AttributeItem>
              <AttributeItem>
                <AttributeLabel>版本:</AttributeLabel>
                <AttributeValue>{entity.metadata.version}</AttributeValue>
              </AttributeItem>
            </div>
          </TabPane>

          <TabPane tab={`关系 (${entity.relationships?.length || 0})`} key="relationships">
            {entity.relationships?.map((relationship, index) => (
              <RelationshipItem key={index}>
                <RelationshipHeader>
                  <span>{relationship.target_name}</span>
                  <RelationshipType color="blue">
                    {relationship.type}
                  </RelationshipType>
                </RelationshipHeader>
                <p style={{ margin: 0, fontSize: 12, color: '#666' }}>
                  {relationship.description}
                </p>
                {relationship.strength && (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>
                      关联强度: {Math.round(relationship.strength * 100)}%
                    </div>
                    <div
                      style={{
                        width: '100%',
                        height: 4,
                        backgroundColor: '#f0f0f0',
                        borderRadius: 2,
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: `${relationship.strength * 100}%`,
                          height: '100%',
                          backgroundColor: '#1890ff',
                        }}
                      />
                    </div>
                  </div>
                )}
              </RelationshipItem>
            ))}
          </TabPane>

          <TabPane tab="协作者" key="collaborators">
            <List
              dataSource={entity.collaborators || []}
              renderItem={(collaborator: User) => (
                <CollaborationItem>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar
                      size="small"
                      src={collaborator.avatar}
                      icon={<UserOutlined />}
                    />
                    <div style={{ marginLeft: 12 }}>
                      <div style={{ fontWeight: 500 }}>
                        {collaborator.display_name}
                      </div>
                      <div style={{ fontSize: 12, color: '#666' }}>
                        {collaborator.role}
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: '#666' }}>
                    {new Date(collaborator.joined_at).toLocaleDateString()}
                  </div>
                </CollaborationItem>
              )}
            />
          </TabPane>

          <TabPane tab="版本历史" key="history">
            <Timeline>
              <Timeline.Item color="green">
                <div>
                  <strong>创建实体</strong>
                  <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                    由 {entity.metadata.created_by} 创建
                  </div>
                  <div style={{ fontSize: 12, color: '#666' }}>
                    {new Date(entity.metadata.created_at).toLocaleString()}
                  </div>
                </div>
              </Timeline.Item>

              {entity.metadata.updated_by !== entity.metadata.created_by && (
                <Timeline.Item color="blue">
                  <div>
                    <strong>更新实体</strong>
                    <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                      由 {entity.metadata.updated_by} 更新
                    </div>
                    <div style={{ fontSize: 12, color: '#666' }}>
                      {new Date(entity.metadata.updated_at).toLocaleString()}
                    </div>
                  </div>
                </Timeline.Item>
              )}
            </Timeline>
          </TabPane>
        </Tabs>
      </ContentSection>
    </PanelContainer>
  );
};

export default EntityDetailPanel;
```

## 5. 自定义Hooks

### 5.1 搜索Hook

```typescript
// hooks/useSearch.ts
import { useState, useCallback, useMemo } from 'react';
import { useDebounce } from './useDebounce';
import { searchAPI } from '@/services/search';

interface SearchSuggestion {
  text: string;
  type: string;
  score: number;
}

export const useSearchSuggestions = () => {
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSuggestions = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      const response = await searchAPI.getSuggestions(query);
      setSuggestions(response.data.suggestions);
    } catch (error) {
      console.error('获取搜索建议失败:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    suggestions,
    loading,
    fetchSuggestions,
  };
};

export const useSearch = () => {
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');

  const debouncedQuery = useDebounce(query, 300);

  const search = useCallback(async (searchQuery: string, filters?: any) => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      const response = await searchAPI.search(searchQuery, filters);
      setSearchResults(response.data.results);
    } catch (error) {
      console.error('搜索失败:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // 当防抖查询变化时自动搜索
  React.useEffect(() => {
    if (debouncedQuery) {
      search(debouncedQuery);
    }
  }, [debouncedQuery, search]);

  return {
    query,
    setQuery,
    searchResults,
    loading,
    search,
  };
};
```

### 5.2 防抖Hook

```typescript
// hooks/useDebounce.ts
import { useState, useEffect } from 'react';

export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};
```

### 5.3 WebSocket Hook

```typescript
// hooks/useWebSocket.ts
import { useEffect, useRef, useState } from 'react';

interface WebSocketMessage {
  type: string;
  data: any;
}

export const useWebSocket = (url: string) => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = useCallback(() => {
    try {
      wsRef.current = new WebSocket(url);

      wsRef.current.onopen = () => {
        setIsConnected(true);
        setError(null);
        reconnectAttempts.current = 0;
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          setLastMessage(message);
        } catch (err) {
          console.error('解析WebSocket消息失败:', err);
        }
      };

      wsRef.current.onclose = (event) => {
        setIsConnected(false);

        // 自动重连
        if (!event.wasClean && reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++;
          setTimeout(() => {
            connect();
          }, 1000 * reconnectAttempts.current);
        }
      };

      wsRef.current.onerror = (event) => {
        setError('WebSocket连接错误');
        setIsConnected(false);
      };

    } catch (err) {
      setError('无法建立WebSocket连接');
      setIsConnected(false);
    }
  }, [url]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
  }, []);

  const sendMessage = useCallback((message: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket未连接，无法发送消息');
    }
  }, []);

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    isConnected,
    lastMessage,
    error,
    sendMessage,
    disconnect,
  };
};
```

## 6. 性能优化

### 6.1 组件懒加载

```typescript
// 路由懒加载
import { lazy, Suspense } from 'react';
import { Spin } from 'antd';

const KnowledgeMapPage = lazy(() => import('@/pages/KnowledgeMap'));
const SearchPage = lazy(() => import('@/pages/Search'));
const AnalysisPage = lazy(() => import('@/pages/Analysis'));

const AppRoutes = () => (
  <Suspense fallback={<Spin size="large" />}>
    <Routes>
      <Route path="/map" element={<KnowledgeMapPage />} />
      <Route path="/search" element={<SearchPage />} />
      <Route path="/analysis" element={<AnalysisPage />} />
    </Routes>
  </Suspense>
);
```

### 6.2 虚拟化长列表

```typescript
// components/Common/VirtualizedList/VirtualizedList.tsx
import React, { useMemo } from 'react';
import { FixedSizeList as List } from 'react-window';

interface VirtualizedListProps {
  items: any[];
  itemHeight: number;
  height: number;
  renderItem: (index: number, style: any) => React.ReactNode;
}

export const VirtualizedList: React.FC<VirtualizedListProps> = ({
  items,
  itemHeight,
  height,
  renderItem,
}) => {
  const Row = useMemo(() => ({ index, style }) => {
    return renderItem(index, style);
  }, [renderItem]);

  return (
    <List
      height={height}
      itemCount={items.length}
      itemSize={itemHeight}
      itemData={items}
    >
      {Row}
    </List>
  );
};
```

这个前端组件设计规范为EFIAgent知识地图提供了完整、可维护、高性能的前端组件库，确保用户界面的一致性和良好的用户体验。