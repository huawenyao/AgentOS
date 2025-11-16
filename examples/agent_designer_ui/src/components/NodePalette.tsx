import React, { useState } from 'react';
import {
  Card,
  Collapse,
  Button,
  Tooltip,
  Input,
  Space,
  Badge
} from 'antd';
import {
  PlayCircleOutlined,
  StopOutlined,
  ExclamationCircleOutlined,
  BranchesOutlined,
  RobotOutlined,
  ThunderboltOutlined,
  EyeOutlined,
  DatabaseOutlined,
  SearchOutlined,
  DragOutlined
} from '@ant-design/icons';
import { AgentType } from './types';
import './NodePalette.css';

const { Panel } = Collapse;
const { Search } = Input;

interface NodePaletteProps {
  onAddNode: (type: string) => void;
  onDragStart?: (nodeType: string) => void;
  onDragEnd?: () => void;
  className?: string;
}

interface NodeTemplate {
  id: string;
  type: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: string;
  color: string;
}

const NodePalette: React.FC<NodePaletteProps> = ({ onAddNode, onDragStart, onDragEnd, className }) => {
  const [searchText, setSearchText] = useState('');
  const [activeKey, setActiveKey] = useState(['control', 'agents']);

  // 节点模板定义
  const nodeTemplates: NodeTemplate[] = [
    // 控制节点
    {
      id: 'start',
      type: 'start',
      name: '开始',
      description: '工作流开始节点',
      icon: <PlayCircleOutlined />,
      category: 'control',
      color: '#52c41a'
    },
    {
      id: 'end',
      type: 'end',
      name: '结束',
      description: '工作流结束节点',
      icon: <StopOutlined />,
      category: 'control',
      color: '#ff4d4f'
    },
    {
      id: 'condition',
      type: 'condition',
      name: '条件判断',
      description: '根据条件进行分支控制',
      icon: <BranchesOutlined />,
      category: 'control',
      color: '#722ed1'
    },
    {
      id: 'error',
      type: 'error',
      name: '错误处理',
      description: '处理工作流中的错误',
      icon: <ExclamationCircleOutlined />,
      category: 'control',
      color: '#faad14'
    },
    
    // Agent节点
    {
      id: 'planning',
      type: 'planning',
      name: '规划Agent',
      description: '负责任务分解和规划',
      icon: <RobotOutlined />,
      category: 'agents',
      color: '#1890ff'
    },
    {
      id: 'execution',
      type: 'execution',
      name: '执行Agent',
      description: '负责执行具体任务',
      icon: <ThunderboltOutlined />,
      category: 'agents',
      color: '#13c2c2'
    },
    {
      id: 'audit',
      type: 'audit',
      name: '审计Agent',
      description: '负责审计和监控',
      icon: <EyeOutlined />,
      category: 'agents',
      color: '#eb2f96'
    },
    {
      id: 'memory',
      type: 'memory',
      name: '记忆Agent',
      description: '负责存储和检索信息',
      icon: <DatabaseOutlined />,
      category: 'agents',
      color: '#fa8c16'
    }
  ];

  // 按类别分组节点
  const nodesByCategory = nodeTemplates.reduce((acc, node) => {
    if (!acc[node.category]) {
      acc[node.category] = [];
    }
    acc[node.category].push(node);
    return acc;
  }, {} as Record<string, NodeTemplate[]>);

  // 过滤节点
  const filteredNodes = nodeTemplates.filter(node =>
    node.name.toLowerCase().includes(searchText.toLowerCase()) ||
    node.description.toLowerCase().includes(searchText.toLowerCase())
  );

  // 按类别过滤
  const filteredNodesByCategory = Object.keys(nodesByCategory).reduce((acc, category) => {
    const categoryNodes = nodesByCategory[category].filter(node =>
      filteredNodes.includes(node)
    );
    if (categoryNodes.length > 0) {
      acc[category] = categoryNodes;
    }
    return acc;
  }, {} as Record<string, NodeTemplate[]>);

  // 类别配置
  const categoryConfig = {
    control: {
      title: '控制节点',
      description: '工作流控制和逻辑节点'
    },
    agents: {
      title: 'Agent节点',
      description: '智能体执行节点'
    }
  };

  // 处理拖拽开始
  const handleDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
    onDragStart?.(nodeType);
  };
  
  // 处理拖拽结束
  const handleDragEnd = () => {
    onDragEnd?.();
  };

  // 渲染节点项
  const renderNodeItem = (node: NodeTemplate) => (
    <div
      key={node.id}
      className="node-palette-item"
      draggable
      onDragStart={(e) => handleDragStart(e, node.type)}
      onDragEnd={handleDragEnd}
      onClick={() => onAddNode(node.type)}
    >
      <div className="node-item-header">
        <div 
          className="node-item-icon" 
          style={{ color: node.color }}
        >
          {node.icon}
        </div>
        <div className="node-item-drag">
          <DragOutlined />
        </div>
      </div>
      <div className="node-item-content">
        <div className="node-item-name">{node.name}</div>
        <div className="node-item-description">{node.description}</div>
      </div>
    </div>
  );

  return (
    <Card 
      className={`node-palette ${className || ''}`}
      title="节点库"
      
      extra={
        <Badge 
          count={filteredNodes.length} 
          style={{ backgroundColor: '#1890ff' }}
        />
      }
    >
      {/* 搜索框 */}
      <div className="palette-search">
        <Search
          placeholder="搜索节点..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          prefix={<SearchOutlined />}
          allowClear
          
        />
      </div>

      {/* 节点分类 */}
      <Collapse 
        activeKey={activeKey}
        onChange={setActiveKey}
        
        ghost
      >
        {Object.entries(filteredNodesByCategory).map(([category, nodes]) => {
          const config = categoryConfig[category as keyof typeof categoryConfig];
          return (
            <Panel 
              key={category}
              header={
                <div className="category-header">
                  <span className="category-title">{config.title}</span>
                  <Badge 
                    count={nodes.length} 
                     
                    style={{ backgroundColor: '#f0f0f0', color: '#666' }}
                  />
                </div>
              }
            >
              <div className="category-description">
                {config.description}
              </div>
              <div className="node-grid">
                {nodes.map(renderNodeItem)}
              </div>
            </Panel>
          );
        })}
      </Collapse>

      {/* 使用提示 */}
      <div className="palette-tips">
        <div className="tip-item">
          <span className="tip-icon">💡</span>
          <span className="tip-text">拖拽节点到画布或点击添加</span>
        </div>
        <div className="tip-item">
          <span className="tip-icon">🔗</span>
          <span className="tip-text">连接节点创建工作流</span>
        </div>
      </div>
    </Card>
  );
};

export default NodePalette;