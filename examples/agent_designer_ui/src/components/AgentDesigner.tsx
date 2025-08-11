import React, { useState, useCallback, useEffect } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import ReactFlow, {
  Controls,
  Background,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  NodeTypes,
  OnSelectionChangeParams
} from 'reactflow';
import { Button, Tooltip, Tabs, Switch, Space, Modal, Form, Input, Select, message } from 'antd';
import { DeleteOutlined, SaveOutlined, MoonOutlined, SunOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { capabilities, componentTypes } from './mockData';
import {
  BaseNode,
  Component,
  ComponentType,
  NodeCategory,
  ComponentCategory,
  AgentType,
  AgentStatus
} from './types';
import PropertyPanel from './PropertyPanel';
import ComponentPanel from './ComponentPanel';
import DesignCanvas from './DesignCanvas';
import './AgentDesigner.css';

const AgentDesigner: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  
  // 状态管理
  const [selectedNodes, setSelectedNodes] = useState<any[]>([]);
  const [selectedEdges, setSelectedEdges] = useState<any[]>([]);
  const [components, setComponents] = useState<Component[]>([]);
  const [selectedComponent, setSelectedComponent] = useState<Component | null>(null);
  const [componentProperties, setComponentProperties] = useState<Record<string, any>>({});
  const [darkMode, setDarkMode] = useState(false);
  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [saveForm] = Form.useForm();
  const [editingAgent, setEditingAgent] = useState<any>(null);

  // 处理函数
  // 组件选择处理
  const handleSelectComponent = (component: Component) => {
    setSelectedComponent(component);
  };

  // 属性更新处理
  const handlePropertyUpdate = (propertyName: string, value: any) => {
    if (selectedComponent) {
      const updatedProperties = {
        ...componentProperties,
        [selectedComponent.id]: {
          ...componentProperties[selectedComponent.id],
          [propertyName]: value
        }
      };
      setComponentProperties(updatedProperties);
      
      // 如果是更新组件描述，同时更新组件对象
      if (propertyName === 'description') {
        const updatedComponent = {
          ...selectedComponent,
          description: value
        };
        handleUpdateComponent(updatedComponent);
      }
    }
  };

  // 组件更新处理
  const handleUpdateComponent = (updatedComponent: BaseNode | Component) => {
    // 确保updatedComponent有type属性，如果没有则保持原有的type
    const componentToUpdate = 'type' in updatedComponent 
      ? updatedComponent as Component
      : { ...updatedComponent, type: ComponentType.AGENT_CONFIG } as Component;
    
    setComponents(prev => 
      prev.map(comp => 
        comp.id === componentToUpdate.id ? componentToUpdate : comp
      )
    );
    if (selectedComponent?.id === componentToUpdate.id) {
      setSelectedComponent(componentToUpdate);
    }
  };

  // 添加组件处理
  const handleAddComponent = (component: Component) => {
    setComponents(prev => [...prev, component]);
  };

  // 删除组件处理
  const handleDeleteComponent = (componentId: string) => {
    setComponents(prev => prev.filter(comp => comp.id !== componentId));
    if (selectedComponent?.id === componentId) {
      setSelectedComponent(null);
    }
  };

  // 组件拖拽开始处理
  const handleDragStart = (event: React.DragEvent, component: any) => {
    event.dataTransfer.setData('component', JSON.stringify(component));
    event.dataTransfer.effectAllowed = 'copy';
  };

  // 能力拖拽开始处理
  const handleCapabilityDragStart = (event: React.DragEvent, capability: any) => {
    const componentData = {
      ...capability,
      type: capability.type as unknown as ComponentType
    };
    event.dataTransfer.setData('capability', JSON.stringify(componentData));
    event.dataTransfer.effectAllowed = 'copy';
  };

  /**
   * 验证Agent配置
   * @returns 验证结果和错误信息
   */
  const validateAgentConfig = (): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    // 检查是否有组件或节点
    if (components.length === 0 && nodes.length <= 1) {
      errors.push('请至少添加一个组件或节点');
    }
    
    // 检查组件配置完整性
    components.forEach((component, index) => {
      if (!component.name || component.name.trim() === '') {
        errors.push(`第${index + 1}个组件缺少名称`);
      }
      
      if (!component.type) {
        errors.push(`组件"${component.name || '未命名'}"缺少类型`);
      }
      
      // 检查必需属性
      if (component.properties) {
        const requiredProps = component.properties.filter(prop => prop.required);
        requiredProps.forEach(prop => {
          const value = componentProperties[`${component.id}_${prop.name}`];
          if (value === undefined || value === null || value === '') {
            errors.push(`组件"${component.name}"的必需属性"${prop.displayName || prop.name}"未设置`);
          }
        });
      }
    });
    
    // 检查节点连接
    if (nodes.length > 1) {
      const hasConnections = edges.length > 0;
      if (!hasConnections) {
        errors.push('多个节点之间缺少连接关系');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  };

  /**
   * 保存Agent前的验证和处理
   */
  const saveAgent = () => {
    const validation = validateAgentConfig();
    
    if (!validation.isValid) {
      Modal.error({
        title: '配置验证失败',
        content: (
          <div>
            <p>请修复以下问题后再保存：</p>
            <ul style={{ marginTop: 8, paddingLeft: 20 }}>
              {validation.errors.map((error, index) => (
                <li key={index} style={{ marginBottom: 4 }}>{error}</li>
              ))}
            </ul>
          </div>
        ),
        width: 500
      });
      return;
    }
    
    setSaveModalVisible(true);
  };

  /**
   * 处理保存Agent
   */
  const handleSaveAgent = async () => {
    // 再次验证配置
    const validation = validateAgentConfig();
    if (!validation.isValid) {
      message.error('配置验证失败，请检查Agent配置');
      return;
    }

    try {
      const values = await saveForm.validateFields();
      const mode = searchParams.get('mode');
      const isEditMode = mode === 'edit' && editingAgent;
      
      // 构建Agent数据
      const agentData = {
        ...values,
        id: isEditMode ? editingAgent.id : `agent_${Date.now()}`,
        status: isEditMode ? editingAgent.status : AgentStatus.IDLE,
        components: components.map(comp => ({
          ...comp,
          // 确保组件数据完整性
          properties: comp.properties || [],
          config: componentProperties[comp.id] || {}
        })),
        workflow: {
          nodes: nodes.map(node => ({
            ...node,
            // 清理节点数据
            data: {
              ...node.data,
              // 移除临时属性
              selected: undefined,
              dragging: undefined
            }
          })),
          edges: edges.map(edge => ({
            ...edge,
            // 清理边数据
            selected: undefined
          }))
        },
        config: {
          properties: componentProperties,
          settings: {
            darkMode,
            // 其他设置
          }
        },
        version: isEditMode && editingAgent?.version ? editingAgent.version + 1 : 1,
        createdAt: isEditMode ? editingAgent.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        author: (isEditMode ? editingAgent.author : values.author) || 'current_user',
        metrics: isEditMode ? editingAgent.metrics : {
          totalRuns: 0,
          successRate: 0,
          avgExecutionTime: 0
        }
      };

      // 数据验证
      if (!agentData.name || agentData.name.trim().length === 0) {
        message.error('Agent名称不能为空');
        return;
      }

      if (agentData.name.trim().length > 50) {
        message.error('Agent名称不能超过50个字符');
        return;
      }

      // TODO: 调用实际API保存Agent
      // const result = await apiService.saveAgent(agentData);
      
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 保存到localStorage作为临时存储
      const existingAgents = JSON.parse(localStorage.getItem('agents') || '[]');
      const agentIndex = existingAgents.findIndex((a: any) => a.id === agentData.id);
      
      if (agentIndex >= 0) {
        existingAgents[agentIndex] = agentData;
        message.success(`Agent "${values.name}" 更新成功！`);
      } else {
        existingAgents.push(agentData);
        message.success(`Agent "${values.name}" 创建成功！`);
      }
      
      localStorage.setItem('agents', JSON.stringify(existingAgents));
      
      setSaveModalVisible(false);
      if (!isEditMode) {
        saveForm.resetFields();
      }
      
      // 清理编辑状态
      localStorage.removeItem('editingAgent');
      localStorage.removeItem('agentDesignerState');
      
      // 返回Agent管理页面
      navigate('/agent-manager');
      
    } catch (error: any) {
      console.error('保存Agent失败:', error);
      if (error.errorFields) {
        message.error('请检查表单输入信息');
      } else {
        message.error(`保存Agent失败: ${error.message || '未知错误'}`);
      }
    }
  };

  const deleteSelected = () => {
    if (selectedComponent) {
      handleDeleteComponent(selectedComponent.id);
    } else if (selectedNodes.length > 0 || selectedEdges.length > 0) {
      console.log('删除选中元素:', { nodes: selectedNodes, edges: selectedEdges });
      // ReactFlow节点删除逻辑
      setNodes(nodes => nodes.filter(node => !selectedNodes.some(n => n.id === node.id)));
      setEdges(edges => edges.filter(edge => !selectedEdges.some(e => e.id === edge.id)));
    }
  };



  const addCapability = (capabilityId: string) => {
    console.log('添加能力组件:', capabilityId);
  };

  // 节点和连线状态管理
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const onConnect = useCallback((params: any) => {
    setEdges((eds: any) => addEdge(params, eds));
  }, [setEdges]);

  const onSelectionChange = useCallback(({ nodes, edges }: OnSelectionChangeParams) => {
    setSelectedNodes(nodes);
    setSelectedEdges(edges);
  }, [setSelectedNodes, setSelectedEdges]);

  const nodeTypes: NodeTypes = {
    default: ({ data }: { data: any }) => (
      <div className="react-flow__node-default">
        <div className="react-flow__node-header">
          <div className="react-flow__node-icon">
            {data.icon && <img src={data.icon} alt={data.name} width={24} height={24} />}
          </div>
          <div className="react-flow__node-title">{data.label}</div>
        </div>
        {data.description && (
          <div className="react-flow__node-description">{data.description}</div>
        )}
      </div>
    ),
  };

  /**
   * 保存当前设计状态到localStorage
   */
  const saveDesignState = useCallback(() => {
    const state = {
      components,
      nodes,
      edges,
      componentProperties,
      darkMode,
      selectedComponent: selectedComponent?.id || null,
      timestamp: Date.now()
    };
    
    try {
      localStorage.setItem('agentDesignerState', JSON.stringify(state));
    } catch (error) {
      console.warn('保存设计状态失败:', error);
    }
  }, [components, nodes, edges, componentProperties, darkMode, selectedComponent]);

  /**
   * 从localStorage恢复设计状态
   */
  const restoreDesignState = useCallback(() => {
    try {
      const savedState = localStorage.getItem('agentDesignerState');
      if (savedState) {
        const state = JSON.parse(savedState);
        
        // 检查状态是否过期（24小时）
        const isExpired = Date.now() - state.timestamp > 24 * 60 * 60 * 1000;
        if (isExpired) {
          localStorage.removeItem('agentDesignerState');
          return false;
        }
        
        // 恢复状态
        if (state.components) setComponents(state.components);
        if (state.nodes) setNodes(state.nodes);
        if (state.edges) setEdges(state.edges);
        if (state.componentProperties) setComponentProperties(state.componentProperties);
        if (state.darkMode !== undefined) setDarkMode(state.darkMode);
        
        // 恢复选中的组件
        if (state.selectedComponent) {
          const component = state.components?.find((c: Component) => c.id === state.selectedComponent);
          if (component) setSelectedComponent(component);
        }
        
        return true;
      }
    } catch (error) {
      console.warn('恢复设计状态失败:', error);
      localStorage.removeItem('agentDesignerState');
    }
    return false;
  }, [setNodes, setEdges]);

  // 检查是否为编辑模式并加载Agent数据
  useEffect(() => {
    const mode = searchParams.get('mode');
    const agentId = searchParams.get('id');
    
    if (mode === 'edit' && agentId) {
      // 从localStorage获取编辑的Agent数据
      const editingAgentData = localStorage.getItem('editingAgent');
      if (editingAgentData) {
        try {
          const agent = JSON.parse(editingAgentData);
          setEditingAgent(agent);
          
          // 加载Agent配置到设计器
          if (agent.config) {
            if (agent.config.nodes && agent.config.nodes.length > 0) {
              setNodes(agent.config.nodes);
            }
            if (agent.config.edges && agent.config.edges.length > 0) {
              setEdges(agent.config.edges);
            }
            if (agent.config.components && agent.config.components.length > 0) {
              setComponents(agent.config.components);
            }
            if (agent.config.properties) {
              setComponentProperties(agent.config.properties);
            }
          }
          
          // 预填充保存表单
          saveForm.setFieldsValue({
            name: agent.name,
            description: agent.description,
            type: agent.type,
            version: agent.version,
            author: agent.author,
            tags: agent.tags
          });
          
          message.success(`已加载Agent "${agent.name}" 的配置`);
          
          // 清除localStorage中的数据
          localStorage.removeItem('editingAgent');
        } catch (error) {
          console.error('解析Agent数据失败:', error);
          message.error('加载Agent配置失败');
        }
      }
    } else {
      // 如果没有编辑数据，尝试恢复设计状态
      const restored = restoreDesignState();
      if (restored) {
        message.info('已恢复上次的设计状态');
      }
    }
  }, [searchParams, setNodes, setEdges, saveForm, restoreDesignState]);

  // 定期保存设计状态
  useEffect(() => {
    const interval = setInterval(saveDesignState, 30000); // 每30秒保存一次
    return () => clearInterval(interval);
  }, [saveDesignState]);

  // 在组件卸载时保存状态
  useEffect(() => {
    return () => {
      saveDesignState();
    };
  }, [saveDesignState]);

  // Initialize with a default node if empty (only for new agents)
  useEffect(() => {
    const mode = searchParams.get('mode');
    if (nodes.length === 0 && mode !== 'edit') {
      setNodes([{
        id: '1',
        type: 'control',
        position: { x: 250, y: 100 },
        data: { 
          label: '开始节点',
          description: '拖拽组件到此处开始设计',
          icon: ''
        }
      }]);
    }
  }, [nodes.length, setNodes, searchParams]);



  useEffect(() => {
    document.body.setAttribute('data-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  const mode = searchParams.get('mode');
  const isEditMode = mode === 'edit';
  const agentName = editingAgent?.name || 'Agent';

  return (
    <div className="agent-designer">
      <div className="agent-toolbar">
        <Space>
          <Tooltip title="返回Agent管理" placement="bottom" arrow>
            <Button onClick={() => navigate('/agent-manager')} icon={<ArrowLeftOutlined />}>返回</Button>
          </Tooltip>
          <span style={{ fontSize: '16px', fontWeight: 'bold', marginLeft: '16px' }}>
            {isEditMode ? `编辑 ${agentName}` : '创建新Agent'}
          </span>
        </Space>
        <Space>
          <Tooltip title={isEditMode ? '更新Agent' : '保存Agent'} placement="bottom" arrow>
            <Button type="primary" onClick={saveAgent} icon={<SaveOutlined />}>
              {isEditMode ? '更新' : '保存'}
            </Button>
          </Tooltip>
          <Button danger onClick={deleteSelected} icon={<DeleteOutlined />}>删除</Button>
          <Switch
            checkedChildren={<MoonOutlined />}
            unCheckedChildren={<SunOutlined />}
            checked={darkMode}
            onChange={setDarkMode}
          />
        </Space>
      </div>

      <div className="agent-container">
        <div className="agent-sidebar">
          <Tabs
            defaultActiveKey="components"
            items={[
              {
                key: 'components',
                label: '组件库',
                children: (
                  <ComponentPanel 
                    components={componentTypes.map(comp => ({
                      type: comp.type,
                      category: comp.category as unknown as ComponentCategory,
                      name: comp.name,
                      description: comp.description,
                      icon: comp.icon || ''
                    }))}
                    onDragStart={handleDragStart}
                  />
                )
              },
              {
                key: 'capabilities',
                label: '能力组件',
                children: (
                  <div className="capability-list">
                    {capabilities.map(capability => (
                      <div 
                        key={capability.id}
                        className="capability-item"
                        draggable
                        onDragStart={(e) => handleCapabilityDragStart(e, capability)}
                        onClick={() => addCapability(capability.id)}
                      >
                        <div className="capability-icon">
                          <img src={capability.icon} alt={capability.name} />
                        </div>
                        <div className="capability-info">
                          <h4>{capability.name}</h4>
                          <p>{capability.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              }
            ]}
          />
        </div>
        
        <div className="agent-canvas">
          <DesignCanvas
            components={components}
            onSelectComponent={handleSelectComponent}
            onUpdateComponent={handleUpdateComponent}
            onDeleteComponent={handleDeleteComponent}
            onAddComponent={handleAddComponent}
          />
        </div>
        
        <div className="agent-property-panel">
          <PropertyPanel 
            selectedNode={selectedComponent}
            onPropertyChange={(nodeId, properties) => {
              setComponentProperties(prev => ({
                ...prev,
                [nodeId]: properties
              }));
            }}
            onNodeUpdate={handleUpdateComponent}
          />
        </div>
      </div>

      {/* 保存Agent Modal */}
      <Modal
        title={isEditMode ? `更新Agent - ${agentName}` : "保存新Agent"}
        open={saveModalVisible}
        onOk={handleSaveAgent}
        onCancel={() => {
          setSaveModalVisible(false);
          if (!isEditMode) {
            saveForm.resetFields();
          }
        }}
        width={600}
        okText={isEditMode ? "更新" : "保存"}
        cancelText="取消"
      >
        <Form
          form={saveForm}
          layout="vertical"
          initialValues={{
            type: AgentType.EXECUTION,
            author: '当前用户',
            version: '1.0.0'
          }}
        >
          <Form.Item
            name="name"
            label="Agent名称"
            rules={[{ required: true, message: '请输入Agent名称' }]}
          >
            <Input placeholder="请输入Agent名称" />
          </Form.Item>
          
          <Form.Item
            name="description"
            label="描述"
            rules={[{ required: true, message: '请输入Agent描述' }]}
          >
            <Input.TextArea rows={3} placeholder="请输入Agent描述" />
          </Form.Item>
          
          <div style={{ display: 'flex', gap: '16px' }}>
            <Form.Item
              name="type"
              label="Agent类型"
              rules={[{ required: true, message: '请选择Agent类型' }]}
              style={{ flex: 1 }}
            >
              <Select placeholder="请选择Agent类型">
                <Select.Option value={AgentType.PLANNING}>规划型</Select.Option>
                <Select.Option value={AgentType.EXECUTION}>执行型</Select.Option>
                <Select.Option value={AgentType.AUDIT}>审计型</Select.Option>
                <Select.Option value={AgentType.MEMORY}>记忆型</Select.Option>
              </Select>
            </Form.Item>
            
            <Form.Item
              name="version"
              label="版本"
              rules={[{ required: true, message: '请输入版本号' }]}
              style={{ flex: 1 }}
            >
              <Input placeholder="如: 1.0.0" />
            </Form.Item>
          </div>
          
          <Form.Item
            name="author"
            label="作者"
            rules={[{ required: true, message: '请输入作者名称' }]}
          >
            <Input placeholder="请输入作者名称" />
          </Form.Item>
          
          <Form.Item
            name="tags"
            label="标签"
          >
            <Select
              mode="tags"
              placeholder="请输入标签，按回车添加"
              style={{ width: '100%' }}
            >
              <Select.Option value="自然语言处理">自然语言处理</Select.Option>
              <Select.Option value="数据分析">数据分析</Select.Option>
              <Select.Option value="自动化">自动化</Select.Option>
              <Select.Option value="客服">客服</Select.Option>
              <Select.Option value="代码审查">代码审查</Select.Option>
            </Select>
          </Form.Item>
          
          <div style={{ 
            background: '#f5f5f5', 
            padding: '12px', 
            borderRadius: '6px',
            marginTop: '16px'
          }}>
            <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>设计概览</div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              <div>组件数量: {components.length}</div>
              <div>节点数量: {nodes.length}</div>
              <div>连接数量: {edges.length}</div>
            </div>
          </div>
        </Form>
      </Modal>

    </div>
  );
};

export default AgentDesigner;
