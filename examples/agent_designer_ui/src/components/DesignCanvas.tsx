import React, { useState, useRef } from 'react';
import { Empty, message } from 'antd';
import { Component, Capability, ComponentType, ComponentCategory, PropertyDefinition, NodeCategory } from './types';
import './AgentDesigner.css';

// 设计画布属性接口
interface DesignCanvasProps {
  components: Component[];
  onSelectComponent: (component: Component) => void;
  onUpdateComponent: (component: Component) => void;
  onDeleteComponent: (componentId: string) => void;
  onAddComponent: (component: Component) => void;
}

/**
 * 设计画布组件
 * 用于可视化设计Agent
 */
const DesignCanvas: React.FC<DesignCanvasProps> = ({
  components,
  onSelectComponent,
  onUpdateComponent,
  onDeleteComponent,
  onAddComponent,
}) => {
  // 拖拽状态
  const [isDragging, setIsDragging] = useState<boolean>(false);
  // 画布引用
  const canvasRef = useRef<HTMLDivElement>(null);
  
  // 处理拖拽进入
  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  };
  
  // 处理拖拽放置
  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    
    // 获取拖拽数据
    const componentData = event.dataTransfer.getData('component');
    const capabilityData = event.dataTransfer.getData('capability');
    
    if (componentData) {
      try {
        const component = JSON.parse(componentData);
        
        // 计算放置位置
        const canvasRect = canvasRef.current?.getBoundingClientRect();
        if (canvasRect) {
          const x = event.clientX - canvasRect.left;
          const y = event.clientY - canvasRect.top;
          
          // 更新组件位置
          const newComponent = {
            ...component,
            position: { x, y },
            id: `${component.type}_${Date.now()}`
          };
          
          onAddComponent(newComponent);
          message.success(`添加组件: ${newComponent.name}`);
        }
      } catch (error) {
        console.error('解析组件数据失败:', error);
        message.error('添加组件失败');
      }
    } else if (capabilityData) {
      try {
        const capability = JSON.parse(capabilityData) as Capability;
        
        // 计算放置位置
        const canvasRect = canvasRef.current?.getBoundingClientRect();
        if (canvasRect) {
          const x = event.clientX - canvasRect.left;
          const y = event.clientY - canvasRect.top;
          
          // 创建能力组件
          const newComponent: Component = {
            id: `capability_${Date.now()}`,
            name: capability?.name || '未知能力',
            type: capability?.type as unknown as ComponentType || 'unknown' as ComponentType,
            category: NodeCategory.CAPABILITY,
            description: capability?.description || '',
            position: { x, y },
            properties: capability?.properties || [],
            data: {
              capabilityId: capability?.id || ''
            }
          };
          
          onAddComponent(newComponent);
          message.success(`添加能力: ${capability?.name || '未知能力'}`);
        }
      } catch (error) {
        console.error('解析能力数据失败:', error);
        message.error('添加能力失败');
      }
    }
  };
  
  // 处理组件点击
  const handleComponentClick = (component: Component, event: React.MouseEvent) => {
    event.stopPropagation();
    onSelectComponent(component);
  };
  
  // 处理组件拖拽开始
  const handleComponentDragStart = (component: Component, event: React.DragEvent) => {
    event.dataTransfer.setData('component-move', JSON.stringify(component));
    event.dataTransfer.effectAllowed = 'move';
    setIsDragging(true);
  };
  
  // 处理组件拖拽结束
  const handleComponentDragEnd = () => {
    setIsDragging(false);
  };
  
  // 处理组件移动
  const handleComponentMove = (event: React.DragEvent) => {
    event.preventDefault();
    
    const componentData = event.dataTransfer.getData('component-move');
    if (componentData) {
      try {
        const component = JSON.parse(componentData);
        
        // 计算新位置
        const canvasRect = canvasRef.current?.getBoundingClientRect();
        if (canvasRect) {
          const x = event.clientX - canvasRect.left;
          const y = event.clientY - canvasRect.top;
          
          onUpdateComponent({
            ...component,
            position: { x, y }
          });
        }
      } catch (error) {
        console.error('移动组件失败:', error);
      }
    }
  };
  
  // 处理画布点击
  const handleCanvasClick = () => {
    onSelectComponent(null as unknown as Component);
  };
  
  return (
    <div 
      className="design-canvas"
      ref={canvasRef}
      onDragOver={handleDragOver}
      onDrop={(e) => {
        handleDrop(e);
        handleComponentMove(e);
      }}
      onClick={handleCanvasClick}
    >
      {components.length === 0 ? (
        <Empty 
          description="拖拽组件或能力到此处"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          className="canvas-empty"
        />
      ) : (
        components.map(component => (
          <div
            key={component.id}
            className="canvas-component"
            draggable
            style={{
              left: component.position?.x || 0,
              top: component.position?.y || 0,
            }}
            onClick={(e) => handleComponentClick(component, e)}
            onDragStart={(e) => handleComponentDragStart(component, e)}
            onDragEnd={handleComponentDragEnd}
          >
            <div className={`component-icon ${component.category}`}>
              {component.name.charAt(0)}
            </div>
            <div className="component-name">{component.name}</div>
          </div>
        ))
      )}
    </div>
  );
};

export default DesignCanvas;
