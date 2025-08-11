/**
 * EFIAgent 2.0 工作流状态管理器
 * 专门用于工作流模块的状态管理
 */

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import {
  WorkflowDefinition,
  WorkflowExecution,
  CoreCapabilityModule,
  Agent2_0
} from './CapabilitySystemTypes';

/**
 * 工作流状态接口
 */
export interface WorkflowState {
  // 工作流相关状态
  workflows: WorkflowDefinition[];
  currentWorkflow: WorkflowDefinition | null;
  workflowExecutions: WorkflowExecution[];
  
  // 能力模块相关状态
  capabilities: CoreCapabilityModule[];
  availableCapabilities: CoreCapabilityModule[];
  
  // Agent相关状态
  agents: Agent2_0[];
  currentAgent: Agent2_0 | null;
  
  // UI状态
  loading: boolean;
  error: string | null;
  
  // 过滤和搜索状态
  filters: {
    searchText: string;
    category: string[];
    status: string[];
    author: string[];
    tags: string[];
    complexity: string[];
  };
  
  // 分页状态
  pagination: {
    current: number;
    pageSize: number;
    total: number;
  };
  
  // 排序状态
  sorting: {
    field: string;
    order: 'asc' | 'desc';
  };
}

/**
 * 工作流状态动作类型
 */
export type WorkflowStateAction =
  // 工作流操作
  | { type: 'SET_WORKFLOWS'; payload: WorkflowDefinition[] }
  | { type: 'ADD_WORKFLOW'; payload: WorkflowDefinition }
  | { type: 'UPDATE_WORKFLOW'; payload: WorkflowDefinition }
  | { type: 'DELETE_WORKFLOW'; payload: string }
  | { type: 'SET_CURRENT_WORKFLOW'; payload: WorkflowDefinition | null }
  
  // 执行操作
  | { type: 'SET_EXECUTIONS'; payload: WorkflowExecution[] }
  | { type: 'ADD_EXECUTION'; payload: WorkflowExecution }
  | { type: 'UPDATE_EXECUTION'; payload: WorkflowExecution }
  
  // 能力操作
  | { type: 'SET_CAPABILITIES'; payload: CoreCapabilityModule[] }
  | { type: 'ADD_CAPABILITY'; payload: CoreCapabilityModule }
  | { type: 'UPDATE_CAPABILITY'; payload: CoreCapabilityModule }
  | { type: 'DELETE_CAPABILITY'; payload: string }
  
  // Agent操作
  | { type: 'SET_AGENTS'; payload: Agent2_0[] }
  | { type: 'ADD_AGENT'; payload: Agent2_0 }
  | { type: 'UPDATE_AGENT'; payload: Agent2_0 }
  | { type: 'DELETE_AGENT'; payload: string }
  | { type: 'SET_CURRENT_AGENT'; payload: Agent2_0 | null }
  
  // UI状态操作
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  
  // 过滤操作
  | { type: 'SET_SEARCH_TEXT'; payload: string }
  | { type: 'SET_CATEGORY_FILTER'; payload: string[] }
  | { type: 'SET_STATUS_FILTER'; payload: string[] }
  | { type: 'SET_AUTHOR_FILTER'; payload: string[] }
  | { type: 'SET_TAGS_FILTER'; payload: string[] }
  | { type: 'SET_COMPLEXITY_FILTER'; payload: string[] }
  | { type: 'RESET_FILTERS' }
  
  // 分页操作
  | { type: 'SET_PAGINATION'; payload: Partial<WorkflowState['pagination']> }
  
  // 排序操作
  | { type: 'SET_SORTING'; payload: WorkflowState['sorting'] }
  
  // 重置操作
  | { type: 'RESET_STATE' };

/**
 * 初始状态
 */
const initialWorkflowState: WorkflowState = {
  workflows: [],
  currentWorkflow: null,
  workflowExecutions: [],
  
  capabilities: [],
  availableCapabilities: [],
  
  agents: [],
  currentAgent: null,
  
  loading: false,
  error: null,
  
  filters: {
    searchText: '',
    category: [],
    status: [],
    author: [],
    tags: [],
    complexity: []
  },
  
  pagination: {
    current: 1,
    pageSize: 10,
    total: 0
  },
  
  sorting: {
    field: 'updatedAt',
    order: 'desc'
  }
};

/**
 * 状态reducer
 */
function workflowStateReducer(state: WorkflowState, action: WorkflowStateAction): WorkflowState {
  switch (action.type) {
    case 'SET_WORKFLOWS':
      return { ...state, workflows: action.payload };
    case 'ADD_WORKFLOW':
      return { ...state, workflows: [...state.workflows, action.payload] };
    case 'UPDATE_WORKFLOW':
      return {
        ...state,
        workflows: state.workflows.map(wf => 
          wf.id === action.payload.id ? action.payload : wf
        )
      };
    case 'DELETE_WORKFLOW':
      return {
        ...state,
        workflows: state.workflows.filter(wf => wf.id !== action.payload)
      };
    case 'SET_CURRENT_WORKFLOW':
      return { ...state, currentWorkflow: action.payload };
    
    case 'SET_EXECUTIONS':
      return { ...state, workflowExecutions: action.payload };
    case 'ADD_EXECUTION':
      return { ...state, workflowExecutions: [...state.workflowExecutions, action.payload] };
    case 'UPDATE_EXECUTION':
      return {
        ...state,
        workflowExecutions: state.workflowExecutions.map(exec => 
          exec.id === action.payload.id ? action.payload : exec
        )
      };
    
    case 'SET_CAPABILITIES':
      return { ...state, capabilities: action.payload };
    case 'ADD_CAPABILITY':
      return { ...state, capabilities: [...state.capabilities, action.payload] };
    case 'UPDATE_CAPABILITY':
      return {
        ...state,
        capabilities: state.capabilities.map(cap => 
          cap.id === action.payload.id ? action.payload : cap
        )
      };
    case 'DELETE_CAPABILITY':
      return {
        ...state,
        capabilities: state.capabilities.filter(cap => cap.id !== action.payload)
      };
    
    case 'SET_AGENTS':
      return { ...state, agents: action.payload };
    case 'ADD_AGENT':
      return { ...state, agents: [...state.agents, action.payload] };
    case 'UPDATE_AGENT':
      return {
        ...state,
        agents: state.agents.map(agent => 
          agent.id === action.payload.id ? action.payload : agent
        )
      };
    case 'DELETE_AGENT':
      return {
        ...state,
        agents: state.agents.filter(agent => agent.id !== action.payload)
      };
    case 'SET_CURRENT_AGENT':
      return { ...state, currentAgent: action.payload };
    
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    
    case 'SET_SEARCH_TEXT':
      return {
        ...state,
        filters: { ...state.filters, searchText: action.payload }
      };
    case 'SET_CATEGORY_FILTER':
      return {
        ...state,
        filters: { ...state.filters, category: action.payload }
      };
    case 'SET_STATUS_FILTER':
      return {
        ...state,
        filters: { ...state.filters, status: action.payload }
      };
    case 'SET_AUTHOR_FILTER':
      return {
        ...state,
        filters: { ...state.filters, author: action.payload }
      };
    case 'SET_TAGS_FILTER':
      return {
        ...state,
        filters: { ...state.filters, tags: action.payload }
      };
    case 'SET_COMPLEXITY_FILTER':
      return {
        ...state,
        filters: { ...state.filters, complexity: action.payload }
      };
    case 'RESET_FILTERS':
      return {
        ...state,
        filters: {
          searchText: '',
          category: [],
          status: [],
          author: [],
          tags: [],
          complexity: []
        }
      };
    
    case 'SET_PAGINATION':
      return {
        ...state,
        pagination: { ...state.pagination, ...action.payload }
      };
    
    case 'SET_SORTING':
      return { ...state, sorting: action.payload };
    
    case 'RESET_STATE':
      return initialWorkflowState;
    
    default:
      return state;
  }
}

/**
 * 工作流状态上下文
 */
const WorkflowStateContext = createContext<{
  state: WorkflowState;
  dispatch: React.Dispatch<WorkflowStateAction>;
} | null>(null);

/**
 * 工作流状态提供者属性
 */
interface WorkflowStateProviderProps {
  children: ReactNode;
  initialState?: Partial<WorkflowState>;
}

/**
 * 工作流状态提供者组件
 */
export const WorkflowStateProvider: React.FC<WorkflowStateProviderProps> = ({ 
  children, 
  initialState: customInitialState 
}) => {
  const [state, dispatch] = useReducer(
    workflowStateReducer,
    customInitialState ? { ...initialWorkflowState, ...customInitialState } : initialWorkflowState
  );

  return (
    <WorkflowStateContext.Provider value={{ state, dispatch }}>
      {children}
    </WorkflowStateContext.Provider>
  );
};

/**
 * 使用工作流状态Hook
 */
export const useWorkflowState = () => {
  const context = useContext(WorkflowStateContext);
  if (!context) {
    throw new Error('useWorkflowState must be used within a WorkflowStateProvider');
  }
  return context;
};

/**
 * 工作流操作Hook
 */
export const useWorkflowOperations = () => {
  const { dispatch } = useWorkflowState();
  
  return {
    // 工作流操作
    setWorkflows: (workflows: WorkflowDefinition[]) => 
      dispatch({ type: 'SET_WORKFLOWS', payload: workflows }),
    addWorkflow: (workflow: WorkflowDefinition) => 
      dispatch({ type: 'ADD_WORKFLOW', payload: workflow }),
    updateWorkflow: (workflow: WorkflowDefinition) => 
      dispatch({ type: 'UPDATE_WORKFLOW', payload: workflow }),
    deleteWorkflow: (id: string) => 
      dispatch({ type: 'DELETE_WORKFLOW', payload: id }),
    setCurrentWorkflow: (workflow: WorkflowDefinition | null) => 
      dispatch({ type: 'SET_CURRENT_WORKFLOW', payload: workflow }),
    
    // 执行操作
    setExecutions: (executions: WorkflowExecution[]) => 
      dispatch({ type: 'SET_EXECUTIONS', payload: executions }),
    addExecution: (execution: WorkflowExecution) => 
      dispatch({ type: 'ADD_EXECUTION', payload: execution }),
    updateExecution: (execution: WorkflowExecution) => 
      dispatch({ type: 'UPDATE_EXECUTION', payload: execution }),
    
    // 能力操作
    setCapabilities: (capabilities: CoreCapabilityModule[]) => 
      dispatch({ type: 'SET_CAPABILITIES', payload: capabilities }),
    addCapability: (capability: CoreCapabilityModule) => 
      dispatch({ type: 'ADD_CAPABILITY', payload: capability }),
    updateCapability: (capability: CoreCapabilityModule) => 
      dispatch({ type: 'UPDATE_CAPABILITY', payload: capability }),
    deleteCapability: (id: string) => 
      dispatch({ type: 'DELETE_CAPABILITY', payload: id }),
    
    // Agent操作
    setAgents: (agents: Agent2_0[]) => 
      dispatch({ type: 'SET_AGENTS', payload: agents }),
    addAgent: (agent: Agent2_0) => 
      dispatch({ type: 'ADD_AGENT', payload: agent }),
    updateAgent: (agent: Agent2_0) => 
      dispatch({ type: 'UPDATE_AGENT', payload: agent }),
    deleteAgent: (id: string) => 
      dispatch({ type: 'DELETE_AGENT', payload: id }),
    setCurrentAgent: (agent: Agent2_0 | null) => 
      dispatch({ type: 'SET_CURRENT_AGENT', payload: agent }),
    
    // UI状态操作
    setLoading: (loading: boolean) => 
      dispatch({ type: 'SET_LOADING', payload: loading }),
    setError: (error: string | null) => 
      dispatch({ type: 'SET_ERROR', payload: error }),
    
    // 过滤操作
    setSearchText: (text: string) => 
      dispatch({ type: 'SET_SEARCH_TEXT', payload: text }),
    setCategoryFilter: (categories: string[]) => 
      dispatch({ type: 'SET_CATEGORY_FILTER', payload: categories }),
    setStatusFilter: (statuses: string[]) => 
      dispatch({ type: 'SET_STATUS_FILTER', payload: statuses }),
    setAuthorFilter: (authors: string[]) => 
      dispatch({ type: 'SET_AUTHOR_FILTER', payload: authors }),
    setTagsFilter: (tags: string[]) => 
      dispatch({ type: 'SET_TAGS_FILTER', payload: tags }),
    setComplexityFilter: (complexity: string[]) => 
      dispatch({ type: 'SET_COMPLEXITY_FILTER', payload: complexity }),
    resetFilters: () => 
      dispatch({ type: 'RESET_FILTERS' }),
    
    // 分页操作
    setPagination: (pagination: Partial<WorkflowState['pagination']>) => 
      dispatch({ type: 'SET_PAGINATION', payload: pagination }),
    
    // 排序操作
    setSorting: (sorting: WorkflowState['sorting']) => 
      dispatch({ type: 'SET_SORTING', payload: sorting }),
    
    // 重置操作
    resetState: () => 
      dispatch({ type: 'RESET_STATE' })
  };
};

export default WorkflowStateProvider;