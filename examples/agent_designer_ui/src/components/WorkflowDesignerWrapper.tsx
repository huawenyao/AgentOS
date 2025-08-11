/**
 * EFIAgent 2.0 工作流设计器包装组件
 * 提供工作流状态管理上下文
 */

import React from 'react';
import { WorkflowStateProvider } from './WorkflowStateManager';
import WorkflowDesigner2_0 from './WorkflowDesigner2_0';
import { WorkflowDefinition } from './CapabilitySystemTypes';

interface WorkflowDesignerWrapperProps {
  agentId?: string;
  initialWorkflow?: WorkflowDefinition;
  onSave?: (workflow: WorkflowDefinition) => void;
  mode?: 'design' | 'view' | 'debug';
}

const WorkflowDesignerWrapper: React.FC<WorkflowDesignerWrapperProps> = (props) => {
  return (
    <WorkflowStateProvider>
      <WorkflowDesigner2_0 {...props} />
    </WorkflowStateProvider>
  );
};

export default WorkflowDesignerWrapper;