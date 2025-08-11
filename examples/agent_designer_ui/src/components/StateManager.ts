/**
 * 状态管理服务
 * 用于管理可视化Agent开发模块的全局状态和组件间数据流
 */

import { useState, useEffect, useCallback } from 'react';
import { AgentTemplate, AgentInstance, Workflow, CapabilityConfig, AgentStatus, BaseNode } from './types';
// import ApiService from './ApiService'; // 未使用，已注释掉
import { templates, /* agentTypes, */ capabilities, agentInstances, workflows } from './mockData';

/**
 * 全局状态接口
 */
export interface GlobalState {
  // 模板相关
  templates: AgentTemplate[];
  selectedTemplate: AgentTemplate | null;
  
  // 实例相关
  agents: AgentInstance[];
  selectedAgent: AgentInstance | null;
  
  // 工作流相关
  workflows: Workflow[];
  selectedWorkflow: Workflow | null;
  
  // 设计器相关
  components: BaseNode[];
  selectedComponent: BaseNode | null;
  
  // 能力组件相关
  capabilities: CapabilityConfig[];
  
  // UI状态
  activeTab: string;
  loading: {
    templates: boolean;
    agents: boolean;
    workflows: boolean;
    capabilities: boolean;
  };
  errors: {
    templates: string | null;
    agents: string | null;
    workflows: string | null;
    capabilities: string | null;
  };
}

/**
 * 初始状态
 */
const initialState: GlobalState = {
  templates: [],
  selectedTemplate: null,
  agents: [],
  selectedAgent: null,
  workflows: [],
  selectedWorkflow: null,
  components: [],
  selectedComponent: null,
  capabilities: [],
  activeTab: 'designer',
  loading: {
    templates: false,
    agents: false,
    workflows: false,
    capabilities: false,
  },
  errors: {
    templates: null,
    agents: null,
    workflows: null,
    capabilities: null,
  },
};

/**
 * 使用全局状态钩子
 * 提供全局状态和操作方法
 */
export const useGlobalState = () => {
  // 状态
  const [state, setState] = useState<GlobalState>(initialState);
  
  /**
   * 更新状态的辅助函数
   * @param updates 要更新的状态部分
   */
  const updateState = useCallback((updates: Partial<GlobalState>) => {
    setState(prevState => ({ ...prevState, ...updates }));
  }, []);
  
  /**
   * 加载模板数据
   */
  const loadTemplates = useCallback(async () => {
    setState(prevState => ({ 
      ...prevState, 
      loading: { ...prevState.loading, templates: true } 
    }));
    try {
      // 在实际应用中，这里应该调用API获取模板
      // const templatesData = await ApiService.getTemplates();
      
      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 500));
      setState(prevState => ({ 
        ...prevState, 
        templates: templates, 
        loading: { ...prevState.loading, templates: false } 
      }));
    } catch (error) {
      console.error('加载模板失败:', error);
      setState(prevState => ({
        ...prevState,
        errors: { ...prevState.errors, templates: '加载模板失败' },
        loading: { ...prevState.loading, templates: false },
      }));
    }
  }, []);
  
  /**
   * 加载Agent实例数据
   */
  const loadAgents = useCallback(async () => {
    setState(prevState => ({ 
      ...prevState, 
      loading: { ...prevState.loading, agents: true } 
    }));
    try {
      // 在实际应用中，这里应该调用API获取Agent实例
      // const agents = await ApiService.getAgents();
      
      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 500));
      setState(prevState => ({ 
        ...prevState, 
        agents: agentInstances, 
        loading: { ...prevState.loading, agents: false } 
      }));
    } catch (error) {
      console.error('加载Agent实例失败:', error);
      setState(prevState => ({
        ...prevState,
        errors: { ...prevState.errors, agents: '加载Agent实例失败' },
        loading: { ...prevState.loading, agents: false },
      }));
    }
  }, []);
  
  /**
   * 加载工作流数据
   */
  const loadWorkflows = useCallback(async () => {
    setState(prevState => ({ 
      ...prevState, 
      loading: { ...prevState.loading, workflows: true } 
    }));
    try {
      // 在实际应用中，这里应该调用API获取工作流
      // const workflowsData = await ApiService.getWorkflows();
      
      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 500));
      setState(prevState => ({ 
        ...prevState, 
        workflows: workflows, 
        loading: { ...prevState.loading, workflows: false } 
      }));
    } catch (error) {
      console.error('加载工作流失败:', error);
      setState(prevState => ({
        ...prevState,
        errors: { ...prevState.errors, workflows: '加载工作流失败' },
        loading: { ...prevState.loading, workflows: false },
      }));
    }
  }, []);
  
  /**
   * 加载能力组件数据
   */
  const loadCapabilities = useCallback(async () => {
    setState(prevState => ({ 
      ...prevState, 
      loading: { ...prevState.loading, capabilities: true } 
    }));
    try {
      // 在实际应用中，这里应该调用API获取能力组件
      // const capabilities = await ApiService.getCapabilities();
      
      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 500));
      setState(prevState => ({ 
        ...prevState, 
        capabilities: [], 
        loading: { ...prevState.loading, capabilities: false } 
      }));
    } catch (error) {
      console.error('加载能力组件失败:', error);
      setState(prevState => ({
        ...prevState,
        errors: { ...prevState.errors, capabilities: '加载能力组件失败' },
        loading: { ...prevState.loading, capabilities: false },
      }));
    }
  }, []);
  
  /**
   * 加载所有数据
   */
  const loadAllData = useCallback(async () => {
    await Promise.all([
      loadTemplates(),
      loadAgents(),
      loadWorkflows(),
      loadCapabilities(),
    ]);
  }, [loadTemplates, loadAgents, loadWorkflows, loadCapabilities]);
  
  /**
   * 选择模板
   * @param template 要选择的模板
   */
  const selectTemplate = (template: AgentTemplate | null) => {
    updateState({ selectedTemplate: template });
    
    // 如果选择了模板，创建组件
    if (template) {
      updateState({ components: [] });
    }
  };
  
  /**
   * 选择Agent实例
   * @param agent 要选择的Agent实例
   */
  const selectAgent = (agent: AgentInstance | null) => {
    updateState({ selectedAgent: agent });
  };
  
  /**
   * 选择工作流
   * @param workflow 要选择的工作流
   */
  const selectWorkflow = (workflow: Workflow | null) => {
    updateState({ selectedWorkflow: workflow });
  };
  
  /**
   * 选择组件
   * @param component 要选择的组件
   */
  const selectComponent = (component: BaseNode | null) => {
    updateState({ selectedComponent: component });
  };
  
  /**
   * 添加组件
   * @param component 要添加的组件
   */
  const addComponent = (component: BaseNode) => {
    setState(prevState => ({ 
      ...prevState, 
      components: [...prevState.components, component] 
    }));
  };
  
  /**
   * 更新组件
   * @param component 要更新的组件
   */
  const updateComponent = (component: BaseNode) => {
    setState(prevState => {
      const updatedComponents = prevState.components.map(c =>
        c.id === component.id ? component : c
      );
      return { ...prevState, components: updatedComponents };
    });
  };
  
  /**
   * 删除组件
   * @param componentId 要删除的组件ID
   */
  const deleteComponent = (componentId: string) => {
    setState(prevState => {
      const updatedComponents = prevState.components.filter(c => c.id !== componentId);
      return {
        ...prevState,
        components: updatedComponents,
        selectedComponent: prevState.selectedComponent?.id === componentId ? null : prevState.selectedComponent,
      };
    });
  };
  
  /**
   * 更新组件属性
   * @param componentId 组件ID
   * @param propertyName 属性名
   * @param value 属性值
   */
  const updateComponentProperty = (componentId: string, propertyName: string, value: any) => {
    setState(prevState => {
      const updatedComponents = prevState.components.map(component => {
        if (component.id === componentId) {
          // 直接更新属性值，不需要查找属性定义
          const updatedProperties = component.properties?.map((p: any) => 
            p.name === propertyName ? {...p, defaultValue: value} : p
          ) || [];
          return {
            ...component,
            properties: updatedProperties
          };
        }
        return component;
      });
      
      // 如果更新的是当前选中的组件，也更新选中的组件
      const updatedSelectedComponent = prevState.selectedComponent?.id === componentId 
        ? updatedComponents.find(c => c.id === componentId) || prevState.selectedComponent
        : prevState.selectedComponent;
      
      return {
        ...prevState,
        components: updatedComponents,
        selectedComponent: updatedSelectedComponent
      };
    });
  };
  
  /**
   * 创建Agent实例
   * @param name 名称
   * @param description 描述
   * @param type 类型
   */
  const createAgent = async (name: string, description: string, type: string) => {
    try {
      // 在实际应用中，这里应该调用API创建Agent实例
      // const agent = await ApiService.createAgent({
      //   name,
      //   description,
      //   type,
      //   components: state.components,
      // });
      
      // 模拟API调用
      const newAgent: AgentInstance = {
        id: `agent-${Date.now()}`,
        configId: '',
        name,
        status: AgentStatus.STOPPED,
        createdAt: new Date(),
        startedAt: undefined,
        stoppedAt: undefined,
        metrics: undefined,
        resources: undefined
      };
      
      setState(prevState => ({
        ...prevState,
        agents: [...prevState.agents, newAgent],
        selectedAgent: newAgent,
      }));
      
      return newAgent;
    } catch (error) {
      console.error('创建Agent实例失败:', error);
      setState(prevState => ({
        ...prevState,
        errors: { ...prevState.errors, agents: '创建Agent实例失败' },
      }));
      throw error;
    }
  };
  
  /**
   * 创建工作流
   * @param name 名称
   * @param description 描述
   * @param nodes 节点
   * @param edges 边
   */
  const createWorkflow = async (name: string, description: string, nodes: any[], edges: any[]) => {
    try {
      // 在实际应用中，这里应该调用API创建工作流
      // const workflow = await ApiService.createWorkflow({
      //   name,
      //   description,
      //   nodes,
      //   edges,
      // });
      
      // 模拟API调用
      const newWorkflow: Workflow = {
        id: `workflow-${Date.now()}`,
        name,
        description,
        agents: [],
        nodes: [],
        connections: edges,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      setState(prevState => ({
        ...prevState,
        workflows: [...prevState.workflows, newWorkflow],
        selectedWorkflow: newWorkflow,
      }));
      
      return newWorkflow;
    } catch (error) {
      console.error('创建工作流失败:', error);
      setState(prevState => ({
        ...prevState,
        errors: { ...prevState.errors, workflows: '创建工作流失败' },
      }));
      throw error;
    }
  };
  
  /**
   * 切换活动标签页
   * @param tab 标签页名称
   */
  const setActiveTab = (tab: string) => {
    updateState({ activeTab: tab });
  };
  
  // 初始加载数据
  useEffect(() => {
    loadAllData();
  }, [loadAllData]);
  
  return {
    // 状态
    ...state,
    
    // 获取当前选中的Agent
    getCurrentAgent: () => state.selectedAgent,
    
    // 加载数据方法
    loadAllData,
    loadTemplates,
    loadAgents,
    loadWorkflows,
    loadCapabilities,
    
    // 选择方法
    selectTemplate,
    selectAgent,
    selectWorkflow,
    selectComponent,
    
    // 组件操作方法
    addComponent,
    updateComponent,
    deleteComponent,
    updateComponentProperty,
    
    // 创建方法
    createAgent,
    createWorkflow,
    
    // UI方法
    setActiveTab,
  };
};

export default useGlobalState;
