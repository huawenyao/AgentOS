import { WorkflowDefinition } from '../types/CapabilitySystemTypes';

/**
 * 版本状态枚举
 */
export enum VersionStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
  DEPRECATED = 'deprecated'
}

/**
 * 变更类型枚举
 */
export enum ChangeType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  MOVE = 'move',
  RENAME = 'rename'
}

/**
 * 变更记录接口
 */
export interface ChangeRecord {
  id: string;
  type: ChangeType;
  target: string; // 变更目标（节点ID、连接ID等）
  description: string;
  oldValue?: any;
  newValue?: any;
  timestamp: number;
  author: string;
}

/**
 * 版本信息接口
 */
export interface VersionInfo {
  id: string;
  version: string;
  workflowId: string;
  name: string;
  description?: string;
  status: VersionStatus;
  author: string;
  createdAt: number;
  updatedAt: number;
  parentVersion?: string;
  tags: string[];
  changes: ChangeRecord[];
  workflow: WorkflowDefinition;
  metadata: {
    nodeCount: number;
    connectionCount: number;
    complexity: number;
    size: number; // 序列化后的大小
  };
}

/**
 * 分支信息接口
 */
export interface BranchInfo {
  id: string;
  name: string;
  workflowId: string;
  baseVersion: string;
  currentVersion: string;
  author: string;
  createdAt: number;
  updatedAt: number;
  description?: string;
  status: 'active' | 'merged' | 'abandoned';
  mergeTarget?: string;
}

/**
 * 合并冲突接口
 */
export interface MergeConflict {
  id: string;
  type: 'node' | 'connection' | 'property';
  target: string;
  sourceValue: any;
  targetValue: any;
  baseValue?: any;
  resolution?: 'source' | 'target' | 'manual';
  manualValue?: any;
}

/**
 * 合并结果接口
 */
export interface MergeResult {
  success: boolean;
  conflicts: MergeConflict[];
  mergedWorkflow?: WorkflowDefinition;
  errors: string[];
}

/**
 * 差异比较结果接口
 */
export interface DiffResult {
  added: ChangeRecord[];
  modified: ChangeRecord[];
  removed: ChangeRecord[];
  nodeChanges: ChangeRecord[];
  edgeChanges: ChangeRecord[];
  configChanges: ChangeRecord[];
  summary: {
    totalChanges: number;
    nodeChanges: number;
    connectionChanges: number;
    propertyChanges: number;
  };
}

/**
 * 协作用户接口
 */
export interface CollaborationUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'owner' | 'editor' | 'viewer';
  lastActive: number;
  isOnline: boolean;
}

/**
 * 协作会话接口
 */
export interface CollaborationSession {
  id: string;
  workflowId: string;
  users: CollaborationUser[];
  createdAt: number;
  lastActivity: number;
  lockInfo?: {
    lockedBy: string;
    lockedAt: number;
    lockType: 'exclusive' | 'shared';
    lockScope: string[]; // 锁定的节点或区域
  };
}

/**
 * 工作流版本控制管理器
 */
export class WorkflowVersionControl {
  private versions: Map<string, VersionInfo> = new Map();
  private branches: Map<string, BranchInfo> = new Map();
  private collaborationSessions: Map<string, CollaborationSession> = new Map();
  private changeListeners: ((change: ChangeRecord) => void)[] = [];

  /**
   * 创建新版本
   */
  createVersion(
    workflowId: string,
    workflow: WorkflowDefinition,
    author: string,
    description?: string,
    parentVersion?: string
  ): VersionInfo {
    const versionId = `v_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const version = this.generateVersionNumber(workflowId, parentVersion);
    
    const versionInfo: VersionInfo = {
      id: versionId,
      version,
      workflowId,
      name: workflow.name,
      description,
      status: VersionStatus.DRAFT,
      author,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      parentVersion,
      tags: [],
      changes: [],
      workflow: JSON.parse(JSON.stringify(workflow)), // 深拷贝
      metadata: {
        nodeCount: workflow.nodes?.length || 0,
        connectionCount: workflow.edges?.length || 0,
        complexity: this.calculateComplexity(workflow),
        size: JSON.stringify(workflow).length
      }
    };
    
    // 如果有父版本，计算变更
    if (parentVersion) {
      const parentVersionInfo = this.getVersion(parentVersion);
      if (parentVersionInfo) {
        versionInfo.changes = this.calculateChanges(parentVersionInfo.workflow, workflow, author);
      }
    }
    
    this.versions.set(versionId, versionInfo);
    
    // 触发变更事件
    const changeRecord: ChangeRecord = {
      id: `change_${Date.now()}`,
      type: ChangeType.CREATE,
      target: 'version',
      description: `创建版本 ${version}`,
      newValue: versionInfo,
      timestamp: Date.now(),
      author
    };
    
    this.notifyChange(changeRecord);
    
    return versionInfo;
  }

  /**
   * 更新版本
   */
  updateVersion(
    versionId: string,
    workflow: WorkflowDefinition,
    author: string,
    description?: string
  ): VersionInfo | null {
    const versionInfo = this.versions.get(versionId);
    if (!versionInfo) {
      return null;
    }
    
    // 计算变更
    const changes = this.calculateChanges(versionInfo.workflow, workflow, author);
    
    // 更新版本信息
    const updatedVersion: VersionInfo = {
      ...versionInfo,
      workflow: JSON.parse(JSON.stringify(workflow)),
      updatedAt: Date.now(),
      description: description || versionInfo.description,
      changes: [...versionInfo.changes, ...changes],
      metadata: {
        nodeCount: workflow.nodes?.length || 0,
        connectionCount: workflow.edges?.length || 0,
        complexity: this.calculateComplexity(workflow),
        size: JSON.stringify(workflow).length
      }
    };
    
    this.versions.set(versionId, updatedVersion);
    
    // 触发变更事件
    changes.forEach(change => this.notifyChange(change));
    
    return updatedVersion;
  }

  /**
   * 获取版本
   */
  getVersion(versionId: string): VersionInfo | null {
    return this.versions.get(versionId) || null;
  }

  /**
   * 获取工作流的所有版本
   */
  getWorkflowVersions(workflowId: string): VersionInfo[] {
    return Array.from(this.versions.values())
      .filter(v => v.workflowId === workflowId)
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  /**
   * 获取所有版本
   */
  getVersions(workflowId: string): VersionInfo[] {
    return this.getWorkflowVersions(workflowId);
  }

  /**
   * 获取所有分支
   */
  getBranches(workflowId: string): BranchInfo[] {
    return Array.from(this.branches.values())
      .filter(b => b.workflowId === workflowId)
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  /**
   * 回滚到指定版本
   */
  async rollback(workflowId: string, version: string): Promise<WorkflowDefinition> {
    const versionInfo = this.versions.get(`${workflowId}_${version}`);
    if (!versionInfo) {
      throw new Error(`版本 ${version} 不存在`);
    }
    return versionInfo.workflow;
  }

  /**
   * 比较两个版本
   */
  async compareVersions(workflowId: string, version1: string | WorkflowDefinition, version2: string): Promise<DiffResult> {
    let workflow1: WorkflowDefinition;
    let workflow2: WorkflowDefinition;

    if (typeof version1 === 'string') {
      if (version1 === 'current') {
        throw new Error('需要提供当前工作流实例');
      }
      const v1 = this.versions.get(`${workflowId}_${version1}`);
      if (!v1) throw new Error(`版本 ${version1} 不存在`);
      workflow1 = v1.workflow;
    } else {
      workflow1 = version1;
    }

    const v2 = this.versions.get(`${workflowId}_${version2}`);
    if (!v2) throw new Error(`版本 ${version2} 不存在`);
    workflow2 = v2.workflow;

    return this.calculateDiff(workflow1, workflow2);
  }

  /**
   * 发布版本
   */
  publishVersion(versionId: string, author: string): boolean {
    const version = this.versions.get(versionId);
    if (!version || version.status !== VersionStatus.DRAFT) {
      return false;
    }
    
    version.status = VersionStatus.PUBLISHED;
    version.updatedAt = Date.now();
    
    const changeRecord: ChangeRecord = {
      id: `change_${Date.now()}`,
      type: ChangeType.UPDATE,
      target: 'version',
      description: `发布版本 ${version.version}`,
      oldValue: VersionStatus.DRAFT,
      newValue: VersionStatus.PUBLISHED,
      timestamp: Date.now(),
      author
    };
    
    this.notifyChange(changeRecord);
    
    return true;
  }

  /**
   * 归档版本
   */
  archiveVersion(versionId: string, author: string): boolean {
    const version = this.versions.get(versionId);
    if (!version) {
      return false;
    }
    
    version.status = VersionStatus.ARCHIVED;
    version.updatedAt = Date.now();
    
    const changeRecord: ChangeRecord = {
      id: `change_${Date.now()}`,
      type: ChangeType.UPDATE,
      target: 'version',
      description: `归档版本 ${version.version}`,
      newValue: VersionStatus.ARCHIVED,
      timestamp: Date.now(),
      author
    };
    
    this.notifyChange(changeRecord);
    
    return true;
  }

  /**
   * 创建分支
   */
  createBranch(
    workflowId: string,
    branchName: string,
    baseVersion: string,
    author: string,
    description?: string
  ): BranchInfo | null {
    const baseVersionInfo = this.getVersion(baseVersion);
    if (!baseVersionInfo) {
      return null;
    }
    
    const branchId = `branch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const branchInfo: BranchInfo = {
      id: branchId,
      name: branchName,
      workflowId,
      baseVersion,
      currentVersion: baseVersion,
      author,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      description,
      status: 'active'
    };
    
    this.branches.set(branchId, branchInfo);
    
    return branchInfo;
  }

  /**
   * 获取分支
   */
  getBranch(branchId: string): BranchInfo | null {
    return this.branches.get(branchId) || null;
  }

  /**
   * 获取工作流的所有分支
   */
  getWorkflowBranches(workflowId: string): BranchInfo[] {
    return Array.from(this.branches.values())
      .filter(b => b.workflowId === workflowId)
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }

  /**
   * 合并分支
   */
  mergeBranch(
    sourceBranchId: string,
    targetBranchId: string,
    author: string,
    resolveConflicts?: (conflicts: MergeConflict[]) => MergeConflict[]
  ): MergeResult {
    const sourceBranch = this.getBranch(sourceBranchId);
    const targetBranch = this.getBranch(targetBranchId);
    
    if (!sourceBranch || !targetBranch) {
      return {
        success: false,
        conflicts: [],
        errors: ['分支不存在']
      };
    }
    
    const sourceVersion = this.getVersion(sourceBranch.currentVersion);
    const targetVersion = this.getVersion(targetBranch.currentVersion);
    
    if (!sourceVersion || !targetVersion) {
      return {
        success: false,
        conflicts: [],
        errors: ['版本不存在']
      };
    }
    
    // 检测冲突
    const conflicts = this.detectMergeConflicts(sourceVersion.workflow, targetVersion.workflow);
    
    if (conflicts.length > 0 && !resolveConflicts) {
      return {
        success: false,
        conflicts,
        errors: []
      };
    }
    
    // 解决冲突
    let resolvedConflicts = conflicts;
    if (resolveConflicts) {
      resolvedConflicts = resolveConflicts(conflicts);
    }
    
    // 执行合并
    try {
      const mergedWorkflow = this.performMerge(
        sourceVersion.workflow,
        targetVersion.workflow,
        resolvedConflicts
      );
      
      // 创建合并后的版本
      const mergedVersion = this.createVersion(
        targetBranch.workflowId,
        mergedWorkflow,
        author,
        `合并分支 ${sourceBranch?.name || '未命名分支'} 到 ${targetBranch?.name || '未命名分支'}`,
        targetVersion.id
      );
      
      // 更新目标分支
      targetBranch.currentVersion = mergedVersion.id;
      targetBranch.updatedAt = Date.now();
      
      // 标记源分支为已合并
      sourceBranch.status = 'merged';
      sourceBranch.mergeTarget = targetBranchId;
      
      return {
        success: true,
        conflicts: resolvedConflicts,
        mergedWorkflow,
        errors: []
      };
    } catch (error) {
      return {
        success: false,
        conflicts: resolvedConflicts,
        errors: [error instanceof Error ? error.message : '合并失败']
      };
    }
  }

  /**
   * 比较版本差异
   */
  compareVersions(version1Id: string, version2Id: string): DiffResult | null {
    const version1 = this.getVersion(version1Id);
    const version2 = this.getVersion(version2Id);
    
    if (!version1 || !version2) {
      return null;
    }
    
    return this.calculateDiff(version1.workflow, version2.workflow);
  }

  /**
   * 回滚到指定版本
   */
  rollbackToVersion(
    workflowId: string,
    targetVersionId: string,
    author: string
  ): VersionInfo | null {
    const targetVersion = this.getVersion(targetVersionId);
    if (!targetVersion || targetVersion.workflowId !== workflowId) {
      return null;
    }
    
    // 创建回滚版本
    const rollbackVersion = this.createVersion(
      workflowId,
      targetVersion.workflow,
      author,
      `回滚到版本 ${targetVersion.version}`
    );
    
    return rollbackVersion;
  }

  /**
   * 添加版本标签
   */
  addVersionTag(versionId: string, tag: string): boolean {
    const version = this.versions.get(versionId);
    if (!version) {
      return false;
    }
    
    if (!version.tags.includes(tag)) {
      version.tags.push(tag);
      version.updatedAt = Date.now();
    }
    
    return true;
  }

  /**
   * 移除版本标签
   */
  removeVersionTag(versionId: string, tag: string): boolean {
    const version = this.versions.get(versionId);
    if (!version) {
      return false;
    }
    
    const index = version.tags.indexOf(tag);
    if (index > -1) {
      version.tags.splice(index, 1);
      version.updatedAt = Date.now();
    }
    
    return true;
  }

  /**
   * 开始协作会话
   */
  startCollaboration(workflowId: string, user: CollaborationUser): CollaborationSession {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const session: CollaborationSession = {
      id: sessionId,
      workflowId,
      users: [user],
      createdAt: Date.now(),
      lastActivity: Date.now()
    };
    
    this.collaborationSessions.set(sessionId, session);
    
    return session;
  }

  /**
   * 加入协作会话
   */
  joinCollaboration(sessionId: string, user: CollaborationUser): boolean {
    const session = this.collaborationSessions.get(sessionId);
    if (!session) {
      return false;
    }
    
    const existingUser = session.users.find(u => u.id === user.id);
    if (existingUser) {
      existingUser.isOnline = true;
      existingUser.lastActive = Date.now();
    } else {
      session.users.push(user);
    }
    
    session.lastActivity = Date.now();
    
    return true;
  }

  /**
   * 离开协作会话
   */
  leaveCollaboration(sessionId: string, userId: string): boolean {
    const session = this.collaborationSessions.get(sessionId);
    if (!session) {
      return false;
    }
    
    const user = session.users.find(u => u.id === userId);
    if (user) {
      user.isOnline = false;
      user.lastActive = Date.now();
    }
    
    session.lastActivity = Date.now();
    
    return true;
  }

  /**
   * 锁定工作流区域
   */
  lockWorkflowArea(
    sessionId: string,
    userId: string,
    lockScope: string[],
    lockType: 'exclusive' | 'shared' = 'exclusive'
  ): boolean {
    const session = this.collaborationSessions.get(sessionId);
    if (!session) {
      return false;
    }
    
    const user = session.users.find(u => u.id === userId);
    if (!user || user.role === 'viewer') {
      return false;
    }
    
    session.lockInfo = {
      lockedBy: userId,
      lockedAt: Date.now(),
      lockType,
      lockScope
    };
    
    session.lastActivity = Date.now();
    
    return true;
  }

  /**
   * 解锁工作流区域
   */
  unlockWorkflowArea(sessionId: string, userId: string): boolean {
    const session = this.collaborationSessions.get(sessionId);
    if (!session || !session.lockInfo) {
      return false;
    }
    
    if (session.lockInfo.lockedBy !== userId) {
      return false;
    }
    
    delete session.lockInfo;
    session.lastActivity = Date.now();
    
    return true;
  }

  /**
   * 添加变更监听器
   */
  addChangeListener(listener: (change: ChangeRecord) => void): void {
    this.changeListeners.push(listener);
  }

  /**
   * 移除变更监听器
   */
  removeChangeListener(listener: (change: ChangeRecord) => void): void {
    const index = this.changeListeners.indexOf(listener);
    if (index > -1) {
      this.changeListeners.splice(index, 1);
    }
  }

  /**
   * 通知变更
   */
  private notifyChange(change: ChangeRecord): void {
    this.changeListeners.forEach(listener => {
      try {
        listener(change);
      } catch (error) {
        console.error('变更监听器执行失败:', error);
      }
    });
  }

  /**
   * 生成版本号
   */
  private generateVersionNumber(workflowId: string, parentVersion?: string): string {
    const versions = this.getWorkflowVersions(workflowId);
    
    if (!parentVersion) {
      return '1.0.0';
    }
    
    const parent = versions.find(v => v.id === parentVersion);
    if (!parent) {
      return '1.0.0';
    }
    
    const [major, minor, patch] = parent.version.split('.').map(Number);
    return `${major}.${minor}.${patch + 1}`;
  }

  /**
   * 计算工作流复杂度
   */
  private calculateComplexity(workflow: WorkflowDefinition): number {
    const nodeCount = workflow.nodes?.length || 0;
    const edgeCount = workflow.edges?.length || 0;
    const conditionNodes = workflow.nodes?.filter(n => n.type === 'CONDITION').length || 0;
    
    // 简单的复杂度计算公式
    return nodeCount + edgeCount * 0.5 + conditionNodes * 2;
  }

  /**
   * 计算变更
   */
  private calculateChanges(
    oldWorkflow: WorkflowDefinition,
    newWorkflow: WorkflowDefinition,
    author: string
  ): ChangeRecord[] {
    const changes: ChangeRecord[] = [];
    const timestamp = Date.now();
    
    // 比较节点
    const oldNodes = new Map((oldWorkflow.nodes || []).map(n => [n.id, n]));
    const newNodes = new Map((newWorkflow.nodes || []).map(n => [n.id, n]));
    
    // 新增节点
    newNodes.forEach((node, id) => {
      if (!oldNodes.has(id)) {
        changes.push({
          id: `change_${timestamp}_${changes.length}`,
          type: ChangeType.CREATE,
          target: id,
          description: `添加节点: ${node.name || node.type}`,
          newValue: node,
          timestamp,
          author
        });
      }
    });
    
    // 删除节点
    oldNodes.forEach((node, id) => {
      if (!newNodes.has(id)) {
        changes.push({
          id: `change_${timestamp}_${changes.length}`,
          type: ChangeType.DELETE,
          target: id,
          description: `删除节点: ${node.name || node.type}`,
          oldValue: node,
          timestamp,
          author
        });
      }
    });
    
    // 修改节点
    newNodes.forEach((newNode, id) => {
      const oldNode = oldNodes.get(id);
      if (oldNode && JSON.stringify(oldNode) !== JSON.stringify(newNode)) {
        changes.push({
          id: `change_${timestamp}_${changes.length}`,
          type: ChangeType.UPDATE,
          target: id,
          description: `修改节点: ${newNode.name || newNode.type}`,
          oldValue: oldNode,
          newValue: newNode,
          timestamp,
          author
        });
      }
    });
    
    // 比较连接（类似节点的比较逻辑）
    const oldEdges = new Map((oldWorkflow.edges || []).map(e => [e.id, e]));
    const newEdges = new Map((newWorkflow.edges || []).map(e => [e.id, e]));
    
    // 新增连接
    newEdges.forEach((edge, id) => {
      if (!oldEdges.has(id)) {
        changes.push({
          id: `change_${timestamp}_${changes.length}`,
          type: ChangeType.CREATE,
          target: id,
          description: `添加连接: ${edge.source} -> ${edge.target}`,
          newValue: edge,
          timestamp,
          author
        });
      }
    });
    
    // 删除连接
    oldEdges.forEach((edge, id) => {
      if (!newEdges.has(id)) {
        changes.push({
          id: `change_${timestamp}_${changes.length}`,
          type: ChangeType.DELETE,
          target: id,
          description: `删除连接: ${edge.source} -> ${edge.target}`,
          oldValue: edge,
          timestamp,
          author
        });
      }
    });
    
    return changes;
  }

  /**
   * 检测合并冲突
   */
  private detectMergeConflicts(
    sourceWorkflow: WorkflowDefinition,
    targetWorkflow: WorkflowDefinition
  ): MergeConflict[] {
    const conflicts: MergeConflict[] = [];
    
    // 检测节点冲突
    const sourceNodes = new Map((sourceWorkflow.nodes || []).map((n: any) => [n.id, n]));
    const targetNodes = new Map((targetWorkflow.nodes || []).map((n: any) => [n.id, n]));
    
    sourceNodes.forEach((sourceNode, id) => {
      const targetNode = targetNodes.get(id);
      if (targetNode && JSON.stringify(sourceNode) !== JSON.stringify(targetNode)) {
        conflicts.push({
          id: `conflict_${Date.now()}_${conflicts.length}`,
          type: 'node',
          target: id as string,
          sourceValue: sourceNode,
          targetValue: targetNode
        });
      }
    });
    
    // 检测连接冲突
    const sourceEdges = new Map((sourceWorkflow.edges || []).map((e: any) => [e.id, e]));
    const targetEdges = new Map((targetWorkflow.edges || []).map((e: any) => [e.id, e]));
    
    sourceEdges.forEach((sourceEdge, id) => {
      const targetEdge = targetEdges.get(id);
      if (targetEdge && JSON.stringify(sourceEdge) !== JSON.stringify(targetEdge)) {
        conflicts.push({
          id: `conflict_${Date.now()}_${conflicts.length}`,
          type: 'connection',
          target: id as string,
          sourceValue: sourceEdge,
          targetValue: targetEdge
        });
      }
    });
    
    return conflicts;
  }

  /**
   * 执行合并
   */
  private performMerge(
    sourceWorkflow: WorkflowDefinition,
    targetWorkflow: WorkflowDefinition,
    resolvedConflicts: MergeConflict[]
  ): WorkflowDefinition {
    const mergedWorkflow: WorkflowDefinition = JSON.parse(JSON.stringify(targetWorkflow));
    
    // 应用冲突解决方案
    resolvedConflicts.forEach(conflict => {
      if (conflict.resolution === 'source') {
        if (conflict.type === 'node') {
          const nodeIndex = mergedWorkflow.nodes?.findIndex(n => n.id === conflict.target);
          if (nodeIndex !== undefined && nodeIndex >= 0 && mergedWorkflow.nodes) {
            mergedWorkflow.nodes[nodeIndex] = conflict.sourceValue;
          }
        } else if (conflict.type === 'connection') {
          const edgeIndex = mergedWorkflow.edges?.findIndex(e => e.id === conflict.target);
          if (edgeIndex !== undefined && edgeIndex >= 0 && mergedWorkflow.edges) {
            mergedWorkflow.edges[edgeIndex] = conflict.sourceValue;
          }
        }
      } else if (conflict.resolution === 'manual' && conflict.manualValue) {
        if (conflict.type === 'node') {
          const nodeIndex = mergedWorkflow.nodes?.findIndex(n => n.id === conflict.target);
          if (nodeIndex !== undefined && nodeIndex >= 0 && mergedWorkflow.nodes) {
            mergedWorkflow.nodes[nodeIndex] = conflict.manualValue;
          }
        } else if (conflict.type === 'connection') {
          const edgeIndex = mergedWorkflow.edges?.findIndex(e => e.id === conflict.target);
          if (edgeIndex !== undefined && edgeIndex >= 0 && mergedWorkflow.edges) {
            mergedWorkflow.edges[edgeIndex] = conflict.manualValue;
          }
        }
      }
    });
    
    // 合并源工作流中的新节点和连接
    const targetNodeIds = new Set((mergedWorkflow.nodes || []).map(n => n.id));
    const targetEdgeIds = new Set((mergedWorkflow.edges || []).map(e => e.id));
    
    // 添加源工作流中的新节点
    (sourceWorkflow.nodes || []).forEach(node => {
      if (!targetNodeIds.has(node.id)) {
        if (!mergedWorkflow.nodes) {
          mergedWorkflow.nodes = [];
        }
        mergedWorkflow.nodes.push(node);
      }
    });
    
    // 添加源工作流中的新连接
    (sourceWorkflow.edges || []).forEach(edge => {
      if (!targetEdgeIds.has(edge.id)) {
        if (!mergedWorkflow.edges) {
          mergedWorkflow.edges = [];
        }
        mergedWorkflow.edges.push(edge);
      }
    });
    
    return mergedWorkflow;
  }

  /**
   * 计算差异
   */
  private calculateDiff(
    workflow1: WorkflowDefinition,
    workflow2: WorkflowDefinition
  ): DiffResult {
    const added: ChangeRecord[] = [];
    const modified: ChangeRecord[] = [];
    const removed: ChangeRecord[] = [];
    
    const timestamp = Date.now();
    
    // 比较节点
    const nodes1 = new Map((workflow1.nodes || []).map((n: any) => [n.id, n]));
    const nodes2 = new Map((workflow2.nodes || []).map((n: any) => [n.id, n]));
    
    // 新增的节点
    nodes2.forEach((node, id) => {
      if (!nodes1.has(id)) {
        added.push({
          id: `diff_${timestamp}_${added.length}`,
          type: ChangeType.CREATE,
          target: id,
          description: `新增节点: ${node.name || node.type}`,
          newValue: node,
          timestamp,
          author: 'system'
        });
      }
    });
    
    // 删除的节点
    nodes1.forEach((node, id) => {
      if (!nodes2.has(id)) {
        removed.push({
          id: `diff_${timestamp}_${removed.length}`,
          type: ChangeType.DELETE,
          target: id,
          description: `删除节点: ${node.name || node.type}`,
          oldValue: node,
          timestamp,
          author: 'system'
        });
      }
    });
    
    // 修改的节点
    nodes2.forEach((node2, id) => {
      const node1 = nodes1.get(id);
      if (node1 && JSON.stringify(node1) !== JSON.stringify(node2)) {
        modified.push({
          id: `diff_${timestamp}_${modified.length}`,
          type: ChangeType.UPDATE,
          target: id,
          description: `修改节点: ${node2.name || node2.type}`,
          oldValue: node1,
          newValue: node2,
          timestamp,
          author: 'system'
        });
      }
    });
    
    // 比较连接（类似逻辑）
    const edges1 = new Map((workflow1.edges || []).map(e => [e.id, e]));
    const edges2 = new Map((workflow2.edges || []).map(e => [e.id, e]));
    
    // 新增的连接
    edges2.forEach((edge, id) => {
      if (!edges1.has(id)) {
        added.push({
          id: `diff_${timestamp}_${added.length}`,
          type: ChangeType.CREATE,
          target: id,
          description: `新增连接: ${edge.source} -> ${edge.target}`,
          newValue: edge,
          timestamp,
          author: 'system'
        });
      }
    });
    
    // 删除的连接
    edges1.forEach((edge, id) => {
      if (!edges2.has(id)) {
        removed.push({
          id: `diff_${timestamp}_${removed.length}`,
          type: ChangeType.DELETE,
          target: id,
          description: `删除连接: ${edge.source} -> ${edge.target}`,
          oldValue: edge,
          timestamp,
          author: 'system'
        });
      }
    });
    
    // 修改的连接
    edges2.forEach((edge2, id) => {
      const edge1 = edges1.get(id);
      if (edge1 && JSON.stringify(edge1) !== JSON.stringify(edge2)) {
        modified.push({
          id: `diff_${timestamp}_${modified.length}`,
          type: ChangeType.UPDATE,
          target: id,
          description: `修改连接: ${edge2.source} -> ${edge2.target}`,
          oldValue: edge1,
          newValue: edge2,
          timestamp,
          author: 'system'
        });
      }
    });
    
    const nodeChangesCount = added.filter(c => nodes2.has(c.target)).length +
                       modified.filter(c => nodes2.has(c.target)).length +
                       removed.filter(c => nodes1.has(c.target)).length;
    
    const connectionChanges = added.filter(c => edges2.has(c.target)).length +
                             modified.filter(c => edges2.has(c.target)).length +
                             removed.filter(c => edges1.has(c.target)).length;
    
    // 分离节点、边和配置变更
    const nodeChanges = [...added, ...modified, ...removed].filter(c => 
      nodes1.has(c.target) || nodes2.has(c.target)
    );
    const edgeChanges = [...added, ...modified, ...removed].filter(c => 
      edges1.has(c.target) || edges2.has(c.target)
    );
    const configChanges: ChangeRecord[] = []; // 配置变更暂时为空
    
    return {
      added,
      modified,
      removed,
      nodeChanges,
      edgeChanges,
      configChanges,
      summary: {
        totalChanges: added.length + modified.length + removed.length,
        nodeChanges: nodeChangesCount,
        connectionChanges: edgeChanges.length,
        propertyChanges: configChanges.length
      }
    };
  }

  /**
   * 清空所有数据
   */
  clear(): void {
    this.versions.clear();
    this.branches.clear();
    this.collaborationSessions.clear();
  }

  /**
   * 导出版本控制数据
   */
  exportData(): any {
    return {
      versions: Array.from(this.versions.entries()),
      branches: Array.from(this.branches.entries()),
      sessions: Array.from(this.collaborationSessions.entries())
    };
  }

  /**
   * 导入版本控制数据
   */
  importData(data: any): void {
    this.clear();
    
    if (data.versions) {
      data.versions.forEach(([id, version]: [string, VersionInfo]) => {
        this.versions.set(id, version);
      });
    }
    
    if (data.branches) {
      data.branches.forEach(([id, branch]: [string, BranchInfo]) => {
        this.branches.set(id, branch);
      });
    }
    
    if (data.sessions) {
      data.sessions.forEach(([id, session]: [string, CollaborationSession]) => {
        this.collaborationSessions.set(id, session);
      });
    }
  }
}

export default WorkflowVersionControl;