import { ResourceLoader } from './ResourceLoader';
import { JsonResourceLoader } from './JsonResourceLoader';

/**
 * 资源缓存项
 */
interface ResourceCacheItem<T = any> {
  data: T;
  timestamp: number;
  path: string;
}

/**
 * 资源管理器
 * 统一管理资源加载、缓存和释放
 */
export class ResourceManager {
  private static instance: ResourceManager | null = null;
  private loaders: Map<string, ResourceLoader> = new Map();
  private cache: Map<string, ResourceCacheItem> = new Map();
  private cacheTimeout: number = 0; // 0 表示永不过期

  private constructor() {
    // 注册默认加载器
    this.registerLoader(new JsonResourceLoader());
  }

  /**
   * 获取资源管理器实例（单例模式）
   */
  static getInstance(): ResourceManager {
    if (!ResourceManager.instance) {
      ResourceManager.instance = new ResourceManager();
    }
    return ResourceManager.instance;
  }

  /**
   * 注册资源加载器
   * @param loader 资源加载器
   */
  registerLoader(loader: ResourceLoader): void {
    this.loaders.set(loader.getType(), loader);
  }

  /**
   * 获取资源加载器
   * @param type 资源类型
   * @returns 资源加载器，如果不存在则返回 null
   */
  getLoader(type: string): ResourceLoader | null {
    return this.loaders.get(type) || null;
  }

  /**
   * 设置缓存超时时间（秒）
   * @param timeout 超时时间，0 表示永不过期
   */
  setCacheTimeout(timeout: number): void {
    this.cacheTimeout = timeout;
  }

  /**
   * 加载资源（带缓存）
   * @param path 资源路径
   * @param type 资源类型（默认为 'json'）
   * @param forceReload 是否强制重新加载（忽略缓存）
   * @returns 资源数据
   */
  async load<T = any>(
    path: string,
    type: string = 'json',
    forceReload: boolean = false
  ): Promise<T> {
    const cacheKey = `${type}:${path}`;

    // 检查缓存
    if (!forceReload) {
      const cached = this.cache.get(cacheKey);
      if (cached) {
        // 检查缓存是否过期
        if (this.cacheTimeout === 0 || 
            (Date.now() - cached.timestamp) / 1000 < this.cacheTimeout) {
          return cached.data as T;
        } else {
          // 缓存过期，移除
          this.cache.delete(cacheKey);
        }
      }
    }

    // 获取加载器
    const loader = this.getLoader(type);
    if (!loader) {
      throw new Error(`[ResourceManager] 未找到资源加载器: ${type}`);
    }

    // 加载资源
    const data = await loader.load(path);

    // 存入缓存
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now(),
      path
    });

    return data as T;
  }

  /**
   * 预加载资源
   * @param paths 资源路径数组
   * @param type 资源类型
   * @returns Promise，所有资源加载完成后解析
   */
  async preload(paths: string[], type: string = 'json'): Promise<void> {
    const promises = paths.map(path => this.load(path, type));
    await Promise.all(promises);
  }

  /**
   * 检查资源是否存在
   * @param path 资源路径
   * @param type 资源类型
   * @returns 是否存在
   */
  async exists(path: string, type: string = 'json'): Promise<boolean> {
    const loader = this.getLoader(type);
    if (!loader) {
      return false;
    }
    return loader.exists(path);
  }

  /**
   * 清除缓存
   * @param path 资源路径（可选，不提供则清除所有缓存）
   * @param type 资源类型（可选）
   */
  clearCache(path?: string, type?: string): void {
    if (path && type) {
      const cacheKey = `${type}:${path}`;
      this.cache.delete(cacheKey);
    } else if (path) {
      // 清除指定路径的所有类型缓存
      for (const [key, value] of this.cache.entries()) {
        if (value.path === path) {
          this.cache.delete(key);
        }
      }
    } else {
      // 清除所有缓存
      this.cache.clear();
    }
  }

  /**
   * 获取缓存统计信息
   */
  getCacheStats(): {
    size: number;
    entries: Array<{ key: string; path: string; age: number }>;
  } {
    const entries = Array.from(this.cache.entries()).map(([key, value]) => ({
      key,
      path: value.path,
      age: (Date.now() - value.timestamp) / 1000
    }));

    return {
      size: this.cache.size,
      entries
    };
  }

  /**
   * 销毁资源管理器（用于测试或重置）
   */
  static destroy(): void {
    if (ResourceManager.instance) {
      ResourceManager.instance.cache.clear();
      ResourceManager.instance.loaders.clear();
      ResourceManager.instance = null;
    }
  }
}

/**
 * 导出全局资源管理器实例的便捷访问
 */
export const resourceManager = ResourceManager.getInstance();