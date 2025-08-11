import React, { useState } from 'react';
import { Card, Input, Tabs, Tag, Tooltip, Typography } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { ComponentCategory, ComponentType } from './types';
import './AgentDesigner.css';

const { TabPane } = Tabs;
const { Title } = Typography;

// 组件数据接口
interface ComponentData {
  type: ComponentType;
  category: ComponentCategory;
  name: string;
  description: string;
  icon: string;
}

// 组件面板属性接口
interface ComponentPanelProps {
  components: ComponentData[];
  onDragStart: (event: React.DragEvent, component: ComponentData) => void;
}

/**
 * 组件面板组件
 * 显示可用的Agent组件并支持拖拽功能
 */
const ComponentPanel: React.FC<ComponentPanelProps> = ({ components, onDragStart }) => {
  // 搜索关键词状态
  const [searchKeyword, setSearchKeyword] = useState('');
  
  // 根据类别对组件进行分组
  const groupedComponents = components.reduce((acc, component) => {
    if (!acc[component.category]) {
      acc[component.category] = [];
    }
    acc[component.category].push(component);
    return acc;
  }, {} as Record<ComponentCategory, ComponentData[]>);
  
  // 根据搜索关键词过滤组件
  const filterComponents = (components: ComponentData[]) => {
    if (!searchKeyword) return components;
    return components.filter(component => 
      component.name.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      component.description.toLowerCase().includes(searchKeyword.toLowerCase())
    );
  };
  
  // 获取类别名称
  const getCategoryName = (category: ComponentCategory) => {
    switch (category) {
      case ComponentCategory.BASE:
        return '基础组件';
      case ComponentCategory.CAPABILITY:
        return '能力组件';
      case ComponentCategory.COMMUNICATION:
        return '通信组件';
      case ComponentCategory.RESOURCE:
        return '资源组件';
      default:
        return '其他组件';
    }
  };
  
  // 获取组件图标
  const getComponentIcon = (icon: string) => {
    return <i className={`component-icon icon-${icon}`} />;
  };
  
  return (
    <div className="component-panel">
      <Title level={4}>组件库</Title>
      
      <Input
        placeholder="搜索组件..."
        prefix={<SearchOutlined />}
        value={searchKeyword}
        onChange={e => setSearchKeyword(e.target.value)}
        className="component-search"
      />
      
      <Tabs defaultActiveKey={ComponentCategory.BASE} className="component-tabs">
        {Object.entries(groupedComponents).map(([category, categoryComponents]) => (
          <TabPane 
            tab={getCategoryName(category as ComponentCategory)} 
            key={category}
          >
            <div className="component-list">
              {filterComponents(categoryComponents).map(component => (
                <Card
                  key={component.type}
                  className="component-card"
                  draggable
                  onDragStart={(e) => onDragStart(e, component)}
                >
                  <Tooltip title={component.description}>
                    <div className="component-card-content">
                      {getComponentIcon(component.icon)}
                      <div className="component-name">{component.name}</div>
                      <Tag color="blue">{component.type}</Tag>
                    </div>
                  </Tooltip>
                </Card>
              ))}
              
              {filterComponents(categoryComponents).length === 0 && (
                <div className="no-components">没有找到匹配的组件</div>
              )}
            </div>
          </TabPane>
        ))}
      </Tabs>
    </div>
  );
};

export default ComponentPanel;