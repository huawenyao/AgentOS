/**
 * DataFlowService.ts
 * 用于管理前端组件之间的数据流和状态变化通知
 * 实现了发布-订阅模式，允许组件订阅特定的状态变化并接收通知
 */

// 定义事件类型
export enum EventType {
  // Agent相关事件
  AGENT_CREATED = 'agent:created',
  AGENT_UPDATED = 'agent:updated',
  AGENT_DELETED = 'agent:deleted',
  AGENT_STARTED = 'agent:started',
  AGENT_STOPPED = 'agent:stopped',
  AGENT_STATUS_CHANGED = 'agent:status_changed',
  AGENT_SELECTED = 'agent:selected',
  
  // 模板相关事件
  TEMPLATE_CREATED = 'template:created',
  TEMPLATE_UPDATED = 'template:updated',
  TEMPLATE_DELETED = 'template:deleted',
  TEMPLATE_SELECTED = 'template:selected',
  
  // 组件相关事件
  COMPONENT_ADDED = 'component:added',
  COMPONENT_UPDATED = 'component:updated',
  COMPONENT_DELETED = 'component:deleted',
  COMPONENT_SELECTED = 'component:selected',
  
  // 工作流相关事件
  WORKFLOW_CREATED = 'workflow:created',
  WORKFLOW_UPDATED = 'workflow:updated',
  WORKFLOW_DELETED = 'workflow:deleted',
  WORKFLOW_STARTED = 'workflow:started',
  WORKFLOW_STOPPED = 'workflow:stopped',
  WORKFLOW_NODE_ADDED = 'workflow:node_added',
  WORKFLOW_EDGE_ADDED = 'workflow:edge_added',
  WORKFLOW_NODE_DELETED = 'workflow:node_deleted',
  WORKFLOW_EDGE_DELETED = 'workflow:edge_deleted',
  
  // UI相关事件
  TAB_CHANGED = 'ui:tab_changed',
  MODAL_OPENED = 'ui:modal_opened',
  MODAL_CLOSED = 'ui:modal_closed',
  DRAWER_OPENED = 'ui:drawer_opened',
  DRAWER_CLOSED = 'ui:drawer_closed',
  
  // 数据加载相关事件
  DATA_LOADING_STARTED = 'data:loading_started',
  DATA_LOADING_FINISHED = 'data:loading_finished',
  DATA_LOADING_ERROR = 'data:loading_error',
  
  // 日志相关事件
  LOG_RECEIVED = 'log:received',
  LOG_CLEARED = 'log:cleared'
}

// 定义事件处理器类型
type EventHandler = (data: any) => void;

// 定义订阅选项
interface SubscriptionOptions {
  once?: boolean; // 是否只触发一次
  context?: any;  // 处理器的上下文
}

// 定义订阅信息
interface Subscription {
  handler: EventHandler;
  options: SubscriptionOptions;
}

/**
 * 数据流服务类
 * 实现发布-订阅模式，管理组件间的数据流
 */
class DataFlowService {
  private subscribers: Map<EventType, Subscription[]> = new Map();
  private eventHistory: Map<EventType, any[]> = new Map();
  private historyLimit: number = 10; // 每种事件类型保留的历史记录数量
  
  /**
   * 订阅事件
   * @param eventType 事件类型
   * @param handler 事件处理函数
   * @param options 订阅选项
   * @returns 取消订阅的函数
   */
  subscribe(eventType: EventType, handler: EventHandler, options: SubscriptionOptions = {}): () => void {
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, []);
    }
    
    const subscription: Subscription = {
      handler,
      options
    };
    
    this.subscribers.get(eventType)!.push(subscription);
    
    // 返回取消订阅的函数
    return () => {
      this.unsubscribe(eventType, handler);
    };
  }
  
  /**
   * 取消订阅
   * @param eventType 事件类型
   * @param handler 事件处理函数
   */
  unsubscribe(eventType: EventType, handler: EventHandler): void {
    if (!this.subscribers.has(eventType)) {
      return;
    }
    
    const subs = this.subscribers.get(eventType)!;
    this.subscribers.set(
      eventType,
      subs.filter(sub => sub.handler !== handler)
    );
  }
  
  /**
   * 发布事件
   * @param eventType 事件类型
   * @param data 事件数据
   */
  publish(eventType: EventType, data: any = {}): void {
    // 添加时间戳
    const eventData = {
      ...data,
      timestamp: new Date().toISOString()
    };
    
    // 保存到事件历史
    this.saveToHistory(eventType, eventData);
    
    // 如果没有订阅者，直接返回
    if (!this.subscribers.has(eventType)) {
      return;
    }
    
    const subs = this.subscribers.get(eventType)!;
    const remainingSubs: Subscription[] = [];
    
    // 通知所有订阅者
    subs.forEach(sub => {
      try {
        // 使用指定的上下文调用处理函数
        if (sub.options.context) {
          sub.handler.call(sub.options.context, eventData);
        } else {
          sub.handler(eventData);
        }
        
        // 如果不是一次性订阅，则保留
        if (!sub.options.once) {
          remainingSubs.push(sub);
        }
      } catch (error) {
        console.error(`Error in event handler for ${eventType}:`, error);
        // 即使出错，非一次性订阅也应该保留
        if (!sub.options.once) {
          remainingSubs.push(sub);
        }
      }
    });
    
    // 更新订阅列表
    this.subscribers.set(eventType, remainingSubs);
  }
  
  /**
   * 保存事件到历史记录
   * @param eventType 事件类型
   * @param data 事件数据
   */
  private saveToHistory(eventType: EventType, data: any): void {
    if (!this.eventHistory.has(eventType)) {
      this.eventHistory.set(eventType, []);
    }
    
    const history = this.eventHistory.get(eventType)!;
    history.push(data);
    
    // 限制历史记录数量
    if (history.length > this.historyLimit) {
      history.shift(); // 移除最旧的记录
    }
  }
  
  /**
   * 获取事件历史记录
   * @param eventType 事件类型
   * @returns 事件历史记录
   */
  getEventHistory(eventType: EventType): any[] {
    return this.eventHistory.get(eventType) || [];
  }
  
  /**
   * 清除事件历史记录
   * @param eventType 事件类型，如果不指定则清除所有
   */
  clearEventHistory(eventType?: EventType): void {
    if (eventType) {
      this.eventHistory.delete(eventType);
    } else {
      this.eventHistory.clear();
    }
  }
  
  /**
   * 一次性订阅事件
   * @param eventType 事件类型
   * @param handler 事件处理函数
   * @param context 处理函数上下文
   */
  once(eventType: EventType, handler: EventHandler, context?: any): () => void {
    return this.subscribe(eventType, handler, { once: true, context });
  }
  
  /**
   * 订阅多个事件
   * @param eventTypes 事件类型数组
   * @param handler 事件处理函数
   * @param options 订阅选项
   * @returns 取消所有订阅的函数
   */
  subscribeToMany(eventTypes: EventType[], handler: EventHandler, options: SubscriptionOptions = {}): () => void {
    const unsubscribeFunctions = eventTypes.map(eventType => 
      this.subscribe(eventType, handler, options)
    );
    
    // 返回取消所有订阅的函数
    return () => {
      unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
    };
  }
  
  /**
   * 获取订阅者数量
   * @param eventType 事件类型
   * @returns 订阅者数量
   */
  getSubscriberCount(eventType: EventType): number {
    return this.subscribers.has(eventType) ? this.subscribers.get(eventType)!.length : 0;
  }
}

// 创建单例实例
export const dataFlowService = new DataFlowService();

// 默认导出单例实例
export default dataFlowService;