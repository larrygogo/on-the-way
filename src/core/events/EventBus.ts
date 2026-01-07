import { EventEmitter } from './EventEmitter';
import { GameEventMap } from './GameEvents';

/**
 * 全局事件总线
 * 单例模式，提供全局事件订阅和发布功能
 */
export class EventBus extends EventEmitter<GameEventMap> {
  private static instance: EventBus | null = null;

  private constructor() {
    super();
  }

  /**
   * 获取全局事件总线实例
   */
  static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  /**
   * 销毁事件总线（用于测试或重置）
   */
  static destroy(): void {
    if (EventBus.instance) {
      EventBus.instance.removeAllListeners();
      EventBus.instance = null;
  }
  }
}

/**
 * 导出全局事件总线实例的便捷访问
 */
export const eventBus = EventBus.getInstance();