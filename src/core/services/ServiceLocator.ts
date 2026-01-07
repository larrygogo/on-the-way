import { ServiceContainer, ServiceLifetime, ServiceFactory } from './ServiceContainer';

/**
 * 服务定位器
 * 提供全局服务访问，支持依赖注入
 */
export class ServiceLocator {
  private static instance: ServiceLocator | null = null;
  private container: ServiceContainer = new ServiceContainer();

  private constructor() {
    // 私有构造函数，确保单例
  }

  /**
   * 获取服务定位器实例（单例模式）
   */
  static getInstance(): ServiceLocator {
    if (!ServiceLocator.instance) {
      ServiceLocator.instance = new ServiceLocator();
    }
    return ServiceLocator.instance;
  }

  /**
   * 注册服务
   * @param key 服务键
   * @param factory 服务工厂函数
   * @param lifetime 服务生命周期
   */
  register<T>(
    key: string,
    factory: ServiceFactory<T>,
    lifetime: ServiceLifetime = ServiceLifetime.Singleton
  ): void {
    this.container.register(key, factory, lifetime);
  }

  /**
   * 注册单例服务
   * @param key 服务键
   * @param factory 服务工厂函数
   */
  registerSingleton<T>(key: string, factory: ServiceFactory<T>): void {
    this.container.registerSingleton(key, factory);
  }

  /**
   * 注册瞬态服务
   * @param key 服务键
   * @param factory 服务工厂函数
   */
  registerTransient<T>(key: string, factory: ServiceFactory<T>): void {
    this.container.registerTransient(key, factory);
  }

  /**
   * 注册作用域服务
   * @param key 服务键
   * @param factory 服务工厂函数
   */
  registerScoped<T>(key: string, factory: ServiceFactory<T>): void {
    this.container.registerScoped(key, factory);
  }

  /**
   * 注册实例
   * @param key 服务键
   * @param instance 服务实例
   */
  registerInstance<T>(key: string, instance: T): void {
    this.container.registerInstance(key, instance);
  }

  /**
   * 解析服务
   * @param key 服务键
   * @returns 服务实例
   */
  resolve<T>(key: string): T {
    return this.container.resolve<T>(key);
  }

  /**
   * 检查服务是否已注册
   * @param key 服务键
   * @returns 是否已注册
   */
  isRegistered(key: string): boolean {
    return this.container.isRegistered(key);
  }

  /**
   * 创建作用域
   * @param scopeId 作用域ID
   * @param callback 在作用域内执行的函数
   * @returns 回调函数的返回值
   */
  createScope<T>(scopeId: string, callback: () => T): T {
    return this.container.createScope(scopeId, callback);
  }

  /**
   * 获取服务容器（用于高级用法）
   */
  getContainer(): ServiceContainer {
    return this.container;
  }

  /**
   * 销毁服务定位器（用于测试或重置）
   */
  static destroy(): void {
    if (ServiceLocator.instance) {
      ServiceLocator.instance.container.clear();
      ServiceLocator.instance = null;
    }
  }
}

/**
 * 导出全局服务定位器实例的便捷访问
 */
export const serviceLocator = ServiceLocator.getInstance();

/**
 * 服务键常量（避免字符串硬编码）
 */
export const ServiceKeys = {
  // 核心服务
  EventBus: 'EventBus',
  ResourceManager: 'ResourceManager',
  ConfigManager: 'ConfigManager',
  Logger: 'Logger',
  
  // 引擎服务
  Renderer: 'Renderer',
  Camera: 'Camera',
  InputManager: 'InputManager',
  
  // 游戏服务
  Game: 'Game',
  GameSession: 'GameSession',
  GameWorld: 'GameWorld',
  
  // 状态服务
  AppState: 'AppState',
  PlayerProfile: 'PlayerProfile',
  
  // UI服务
  UIManager: 'UIManager',
} as const;