/**
 * 事件监听器类型
 */
export type EventListener<T = any> = (event: T) => void | Promise<void>;

/**
 * 事件发射器基类
 * 提供类型安全的事件订阅和发布功能
 */
export class EventEmitter<TEventMap extends Record<string, any> = Record<string, any>> {
  private listeners: Map<keyof TEventMap, Set<EventListener>> = new Map();

  /**
   * 订阅事件
   * @param event 事件名称
   * @param listener 事件监听器
   * @returns 取消订阅的函数
   */
  on<K extends keyof TEventMap>(
    event: K,
    listener: EventListener<TEventMap[K]>
  ): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);

    // 返回取消订阅的函数
    return () => {
      this.off(event, listener);
    };
  }

  /**
   * 订阅事件（只触发一次）
   * @param event 事件名称
   * @param listener 事件监听器
   * @returns 取消订阅的函数
   */
  once<K extends keyof TEventMap>(
    event: K,
    listener: EventListener<TEventMap[K]>
  ): () => void {
    const onceWrapper = ((eventData: TEventMap[K]) => {
      listener(eventData);
      this.off(event, onceWrapper);
    }) as EventListener<TEventMap[K]>;

    return this.on(event, onceWrapper);
  }

  /**
   * 取消订阅事件
   * @param event 事件名称
   * @param listener 事件监听器（可选，不提供则移除所有监听器）
   */
  off<K extends keyof TEventMap>(
    event: K,
    listener?: EventListener<TEventMap[K]>
  ): void {
    const eventListeners = this.listeners.get(event);
    if (!eventListeners) {
      return;
    }

    if (listener) {
      eventListeners.delete(listener);
      if (eventListeners.size === 0) {
        this.listeners.delete(event);
      }
    } else {
      // 移除所有监听器
      this.listeners.delete(event);
    }
  }

  /**
   * 发布事件
   * @param event 事件名称
   * @param data 事件数据
   */
  emit<K extends keyof TEventMap>(event: K, data: TEventMap[K]): void {
    const eventListeners = this.listeners.get(event);
    if (!eventListeners) {
      return;
    }

    // 创建监听器副本，避免在迭代过程中修改集合
    const listeners = Array.from(eventListeners);
    for (const listener of listeners) {
      try {
        listener(data);
      } catch (error) {
        console.error(`[EventEmitter] 事件监听器执行错误 (${String(event)}):`, error);
      }
    }
  }

  /**
   * 异步发布事件
   * @param event 事件名称
   * @param data 事件数据
   */
  async emitAsync<K extends keyof TEventMap>(event: K, data: TEventMap[K]): Promise<void> {
    const eventListeners = this.listeners.get(event);
    if (!eventListeners) {
      return;
    }

    const listeners = Array.from(eventListeners);
    const promises = listeners.map(async (listener) => {
      try {
        await listener(data);
      } catch (error) {
        console.error(`[EventEmitter] 事件监听器执行错误 (${String(event)}):`, error);
      }
    });

    await Promise.all(promises);
  }

  /**
   * 移除所有事件监听器
   */
  removeAllListeners(): void {
    this.listeners.clear();
  }

  /**
   * 获取指定事件的监听器数量
   * @param event 事件名称
   */
  listenerCount<K extends keyof TEventMap>(event: K): number {
    return this.listeners.get(event)?.size ?? 0;
  }

  /**
   * 获取所有已订阅的事件名称
   */
  getEventNames(): Array<keyof TEventMap> {
    return Array.from(this.listeners.keys());
  }
}