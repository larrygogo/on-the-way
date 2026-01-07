/**
 * 服务工厂函数类型
 */
export type ServiceFactory<T> = () => T;

/**
 * 服务生命周期
 */
export enum ServiceLifetime {
  /**
   * 单例：整个应用生命周期内只有一个实例
   */
  Singleton = 'singleton',
  
  /**
   * 瞬态：每次请求都创建新实例
   */
  Transient = 'transient',
  
  /**
   * 作用域：在特定作用域内共享实例
   */
  Scoped = 'scoped'
}

/**
 * 服务注册信息
 */
interface ServiceRegistration<T = any> {
  factory: ServiceFactory<T>;
  lifetime: ServiceLifetime;
  instance?: T;
}

/**
 * 服务容器
 * 管理服务的注册和解析，支持依赖注入
 */
export class ServiceContainer {
  private services: Map<string, ServiceRegistration> = new Map();
  private scopedInstances: Map<string, any> = new Map();
  private currentScope: string | null = null;

  /**
   * 注册服务
   * @param key 服务键（通常是类名或接口名）
   * @param factory 服务工厂函数
   * @param lifetime 服务生命周期
   */
  register<T>(
    key: string,
    factory: ServiceFactory<T>,
    lifetime: ServiceLifetime = ServiceLifetime.Singleton
  ): void {
    this.services.set(key, {
      factory,
      lifetime
    });
  }

  /**
   * 注册单例服务
   * @param key 服务键
   * @param factory 服务工厂函数
   */
  registerSingleton<T>(key: string, factory: ServiceFactory<T>): void {
    this.register(key, factory, ServiceLifetime.Singleton);
  }

  /**
   * 注册瞬态服务
   * @param key 服务键
   * @param factory 服务工厂函数
   */
  registerTransient<T>(key: string, factory: ServiceFactory<T>): void {
    this.register(key, factory, ServiceLifetime.Transient);
  }

  /**
   * 注册作用域服务
   * @param key 服务键
   * @param factory 服务工厂函数
   */
  registerScoped<T>(key: string, factory: ServiceFactory<T>): void {
    this.register(key, factory, ServiceLifetime.Scoped);
  }

  /**
   * 注册实例（直接注册已创建的实例）
   * @param key 服务键
   * @param instance 服务实例
   */
  registerInstance<T>(key: string, instance: T): void {
    this.services.set(key, {
      factory: () => instance,
      lifetime: ServiceLifetime.Singleton,
      instance
    });
  }

  /**
   * 解析服务
   * @param key 服务键
   * @returns 服务实例
   */
  resolve<T>(key: string): T {
    const registration = this.services.get(key);
    
    if (!registration) {
      throw new Error(`[ServiceContainer] 未找到服务: ${key}`);
    }

    switch (registration.lifetime) {
      case ServiceLifetime.Singleton:
        if (!registration.instance) {
          registration.instance = registration.factory();
        }
        return registration.instance as T;

      case ServiceLifetime.Transient:
        return registration.factory() as T;

      case ServiceLifetime.Scoped:
        if (!this.currentScope) {
          throw new Error(`[ServiceContainer] 作用域服务 ${key} 需要在作用域内解析`);
        }
        
        const scopedKey = `${this.currentScope}:${key}`;
        if (!this.scopedInstances.has(scopedKey)) {
          this.scopedInstances.set(scopedKey, registration.factory());
        }
        return this.scopedInstances.get(scopedKey) as T;

      default:
        throw new Error(`[ServiceContainer] 未知的服务生命周期: ${registration.lifetime}`);
    }
  }

  /**
   * 检查服务是否已注册
   * @param key 服务键
   * @returns 是否已注册
   */
  isRegistered(key: string): boolean {
    return this.services.has(key);
  }

  /**
   * 创建作用域
   * @param scopeId 作用域ID
   * @param callback 在作用域内执行的函数
   * @returns 回调函数的返回值
   */
  createScope<T>(scopeId: string, callback: () => T): T {
    const previousScope = this.currentScope;
    this.currentScope = scopeId;
    
    try {
      return callback();
    } finally {
      this.currentScope = previousScope;
      
      // 清理作用域实例
      if (previousScope === null) {
        // 如果退出到根作用域，清理所有作用域实例
        for (const [key] of this.scopedInstances.entries()) {
          if (key.startsWith(`${scopeId}:`)) {
            this.scopedInstances.delete(key);
          }
        }
      }
    }
  }

  /**
   * 清除所有服务（用于测试）
   */
  clear(): void {
    this.services.clear();
    this.scopedInstances.clear();
    this.currentScope = null;
  }
}