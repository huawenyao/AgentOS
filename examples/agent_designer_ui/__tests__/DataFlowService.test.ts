import { dataFlowService, EventType } from '../DataFlowService';

describe('DataFlowService', () => {
  // 每个测试后重置事件历史
  afterEach(() => {
    dataFlowService.clearEventHistory();
  });

  /**
   * 测试基本的订阅和发布功能
   */
  test('should allow subscribing to events and receive published events', () => {
    const mockHandler = jest.fn();
    dataFlowService.subscribe(EventType.AGENT_CREATED, mockHandler);
    
    const eventData = { id: 'agent1', name: 'Test Agent' };
    dataFlowService.publish(EventType.AGENT_CREATED, eventData);
    
    expect(mockHandler).toHaveBeenCalledTimes(1);
    expect(mockHandler).toHaveBeenCalledWith(expect.objectContaining({
      id: 'agent1',
      name: 'Test Agent',
      timestamp: expect.any(String)
    }));
  });

  /**
   * 测试取消订阅功能
   */
  test('should allow unsubscribing from events', () => {
    const mockHandler = jest.fn();
    const unsubscribe = dataFlowService.subscribe(EventType.AGENT_UPDATED, mockHandler);
    
    // 发布一次事件，处理器应该被调用
    dataFlowService.publish(EventType.AGENT_UPDATED, { id: 'agent1' });
    expect(mockHandler).toHaveBeenCalledTimes(1);
    
    // 取消订阅
    unsubscribe();
    
    // 再次发布事件，处理器不应该被调用
    dataFlowService.publish(EventType.AGENT_UPDATED, { id: 'agent1' });
    expect(mockHandler).toHaveBeenCalledTimes(1); // 仍然是1次
  });

  /**
   * 测试一次性订阅功能
   */
  test('should support one-time subscriptions with once()', () => {
    const mockHandler = jest.fn();
    dataFlowService.once(EventType.COMPONENT_ADDED, mockHandler);
    
    // 发布一次事件，处理器应该被调用
    dataFlowService.publish(EventType.COMPONENT_ADDED, { id: 'comp1' });
    expect(mockHandler).toHaveBeenCalledTimes(1);
    
    // 再次发布事件，处理器不应该被调用
    dataFlowService.publish(EventType.COMPONENT_ADDED, { id: 'comp2' });
    expect(mockHandler).toHaveBeenCalledTimes(1); // 仍然是1次
  });

  /**
   * 测试订阅多个事件功能
   */
  test('should allow subscribing to multiple events at once', () => {
    const mockHandler = jest.fn();
    const events = [
      EventType.WORKFLOW_CREATED,
      EventType.WORKFLOW_UPDATED,
      EventType.WORKFLOW_DELETED
    ];
    
    dataFlowService.subscribeToMany(events, mockHandler);
    
    // 发布多个事件
    dataFlowService.publish(EventType.WORKFLOW_CREATED, { id: 'wf1' });
    dataFlowService.publish(EventType.WORKFLOW_UPDATED, { id: 'wf1', name: 'Updated' });
    dataFlowService.publish(EventType.WORKFLOW_DELETED, { id: 'wf1' });
    
    expect(mockHandler).toHaveBeenCalledTimes(3);
  });

  /**
   * 测试事件历史记录功能
   */
  test('should maintain event history', () => {
    // 发布多个事件
    dataFlowService.publish(EventType.LOG_RECEIVED, { message: 'Log 1' });
    dataFlowService.publish(EventType.LOG_RECEIVED, { message: 'Log 2' });
    dataFlowService.publish(EventType.LOG_RECEIVED, { message: 'Log 3' });
    
    const history = dataFlowService.getEventHistory(EventType.LOG_RECEIVED);
    
    expect(history.length).toBe(3);
    expect(history[0].message).toBe('Log 1');
    expect(history[1].message).toBe('Log 2');
    expect(history[2].message).toBe('Log 3');
  });

  /**
   * 测试清除事件历史记录功能
   */
  test('should clear event history', () => {
    // 发布多个不同类型的事件
    dataFlowService.publish(EventType.LOG_RECEIVED, { message: 'Log 1' });
    dataFlowService.publish(EventType.AGENT_STARTED, { id: 'agent1' });
    
    // 清除特定类型的事件历史
    dataFlowService.clearEventHistory(EventType.LOG_RECEIVED);
    
    expect(dataFlowService.getEventHistory(EventType.LOG_RECEIVED).length).toBe(0);
    expect(dataFlowService.getEventHistory(EventType.AGENT_STARTED).length).toBe(1);
    
    // 清除所有事件历史
    dataFlowService.clearEventHistory();
    
    expect(dataFlowService.getEventHistory(EventType.AGENT_STARTED).length).toBe(0);
  });

  /**
   * 测试处理器上下文功能
   */
  test('should respect handler context', () => {
    const context = {
      value: 'contextValue',
      method: jest.fn(function(this: any, data: any) {
        this.value = data.id;
      })
    };
    
    dataFlowService.subscribe(EventType.TEMPLATE_SELECTED, context.method, { context });
    
    dataFlowService.publish(EventType.TEMPLATE_SELECTED, { id: 'template1' });
    
    expect(context.method).toHaveBeenCalledTimes(1);
    expect(context.value).toBe('template1');
  });

  /**
   * 测试错误处理功能
   */
  test('should handle errors in event handlers', () => {
    // 模拟控制台错误输出
    const originalConsoleError = console.error;
    console.error = jest.fn();
    
    // 创建一个会抛出错误的处理器
    const errorHandler = jest.fn(() => {
      throw new Error('Test error');
    });
    
    // 创建一个正常的处理器
    const normalHandler = jest.fn();
    
    // 订阅同一事件
    dataFlowService.subscribe(EventType.DATA_LOADING_ERROR, errorHandler);
    dataFlowService.subscribe(EventType.DATA_LOADING_ERROR, normalHandler);
    
    // 发布事件
    dataFlowService.publish(EventType.DATA_LOADING_ERROR, { message: 'Error data' });
    
    // 错误处理器应该被调用并抛出错误
    expect(errorHandler).toHaveBeenCalledTimes(1);
    expect(console.error).toHaveBeenCalled();
    
    // 正常处理器应该仍然被调用
    expect(normalHandler).toHaveBeenCalledTimes(1);
    
    // 恢复控制台错误输出
    console.error = originalConsoleError;
  });

  /**
   * 测试获取订阅者数量功能
   */
  test('should return correct subscriber count', () => {
    const handler1 = jest.fn();
    const handler2 = jest.fn();
    const handler3 = jest.fn();
    
    expect(dataFlowService.getSubscriberCount(EventType.UI_MODAL_OPENED)).toBe(0);
    
    dataFlowService.subscribe(EventType.UI_MODAL_OPENED, handler1);
    expect(dataFlowService.getSubscriberCount(EventType.UI_MODAL_OPENED)).toBe(1);
    
    dataFlowService.subscribe(EventType.UI_MODAL_OPENED, handler2);
    dataFlowService.subscribe(EventType.UI_MODAL_OPENED, handler3);
    expect(dataFlowService.getSubscriberCount(EventType.UI_MODAL_OPENED)).toBe(3);
    
    // 取消一个订阅
    dataFlowService.unsubscribe(EventType.UI_MODAL_OPENED, handler2);
    expect(dataFlowService.getSubscriberCount(EventType.UI_MODAL_OPENED)).toBe(2);
  });
});