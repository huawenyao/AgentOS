import React from 'react';
import { Card, Tag, Button, Tooltip, Typography } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import './CapabilityLibrary.css';

const { Title, Paragraph } = Typography;

/**
 * 能力组件库测试组件
 * 用于验证样式更新是否正确
 */
const CapabilityLibraryTest: React.FC = () => {
  const testCapabilities = [
    {
      id: '1',
      name: '自然语言处理',
      type: 'nlp',
      description: '提供文本分析、语义理解等自然语言处理能力',
      icon: 'NLP',
      category: '自然语言处理',
      tags: ['nlp', '自然语言处理', 'AI']
    },
    {
      id: '2',
      name: 'API调用',
      type: 'api_call',
      description: '支持调用外部API接口，实现系统集成',
      icon: 'API',
      category: '工具集成',
      tags: ['api_call', 'API', '集成']
    },
    {
      id: '3',
      name: '图像生成',
      type: 'image_generation',
      description: '基于AI的图像生成和处理能力',
      icon: 'IG',
      category: '多模态处理',
      tags: ['image_generation', '图像生成', 'AI']
    }
  ];

  const renderCapabilityCard = (capability: any) => {
    return (
      <Card
        key={capability.id}
        className="capability-card"
        hoverable
        actions={[
          <Tooltip title="查看详情">
            <Button 
              type="text" 
              icon={<InfoCircleOutlined />} 
            />
          </Tooltip>,
          <Button type="primary">
            添加
          </Button>
        ]}
      >
        <div className="capability-card-header">
          <span className="capability-icon">{capability.icon}</span>
          <Title level={4}>{capability.name}</Title>
          <Tag color="blue">{capability.type}</Tag>
        </div>
        
        <Paragraph ellipsis={{ rows: 3, expandable: true, symbol: '更多' }}>
          {capability.description}
        </Paragraph>
        
        <div className="capability-tags">
          {capability.tags.map((tag: string) => (
            <Tag key={tag}>{tag}</Tag>
          ))}
        </div>
      </Card>
    );
  };

  return (
    <div className="capability-library">
      <div className="capability-library-header">
        <Title level={3}>能力组件库样式测试</Title>
      </div>
      
      <div className="capability-library-content">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
          {testCapabilities.map(capability => renderCapabilityCard(capability))}
        </div>
      </div>
    </div>
  );
};

export default CapabilityLibraryTest;