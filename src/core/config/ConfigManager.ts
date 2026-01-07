import { GameSettings, defaultGameSettings } from './GameSettings';

/**
 * 配置管理器
 * 统一管理游戏配置，支持加载、保存和热重载
 */
export class ConfigManager {
  private static instance: ConfigManager | null = null;
  private settings: GameSettings = { ...defaultGameSettings };
  private storageKey: string = 'game_settings';
  private listeners: Set<(settings: GameSettings) => void> = new Set();

  private constructor() {
    this.load();
  }

  /**
   * 获取配置管理器实例（单例模式）
   */
  static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  /**
   * 从本地存储加载配置
   */
  load(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.settings = this.mergeSettings(defaultGameSettings, parsed);
      }
    } catch (error) {
      console.warn('[ConfigManager] 加载配置失败，使用默认配置:', error);
      this.settings = { ...defaultGameSettings };
    }
  }

  /**
   * 保存配置到本地存储
   */
  save(): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.settings));
      this.notifyListeners();
    } catch (error) {
      console.error('[ConfigManager] 保存配置失败:', error);
    }
  }

  /**
   * 获取游戏设置
   */
  getSettings(): GameSettings {
    return { ...this.settings };
  }

  /**
   * 更新游戏设置
   * @param updates 部分设置更新
   */
  updateSettings(updates: Partial<GameSettings>): void {
    this.settings = this.mergeSettings(this.settings, updates);
    this.save();
  }

  /**
   * 重置为默认设置
   */
  reset(): void {
    this.settings = { ...defaultGameSettings };
    this.save();
  }

  /**
   * 获取特定类别的设置
   * @param category 设置类别
   */
  getCategory<K extends keyof GameSettings>(category: K): GameSettings[K] {
    return { ...this.settings[category] };
  }

  /**
   * 更新特定类别的设置
   * @param category 设置类别
   * @param updates 部分更新
   */
  updateCategory<K extends keyof GameSettings>(
    category: K,
    updates: Partial<GameSettings[K]>
  ): void {
    this.settings[category] = {
      ...this.settings[category],
      ...updates
    } as GameSettings[K];
    this.save();
  }

  /**
   * 添加配置变化监听器
   * @param listener 监听器函数
   * @returns 取消监听的函数
   */
  addListener(listener: (settings: GameSettings) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * 通知所有监听器
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.getSettings());
      } catch (error) {
        console.error('[ConfigManager] 监听器执行错误:', error);
      }
    });
  }

  /**
   * 深度合并设置对象
   */
  private mergeSettings<T extends Record<string, any>>(
    target: T,
    source: Partial<T>
  ): T {
    const result = { ...target };
    
    for (const key in source) {
      if (source[key] !== undefined) {
        if (
          typeof source[key] === 'object' &&
          source[key] !== null &&
          !Array.isArray(source[key]) &&
          typeof target[key] === 'object' &&
          target[key] !== null &&
          !Array.isArray(target[key])
        ) {
          result[key] = this.mergeSettings(target[key], source[key]);
        } else {
          result[key] = source[key] as T[Extract<keyof T, string>];
        }
      }
    }
    
    return result;
  }

  /**
   * 导出配置（用于备份）
   */
  export(): string {
    return JSON.stringify(this.settings, null, 2);
  }

  /**
   * 导入配置（用于恢复）
   * @param json 配置JSON字符串
   */
  import(json: string): void {
    try {
      const parsed = JSON.parse(json);
      this.settings = this.mergeSettings(defaultGameSettings, parsed);
      this.save();
    } catch (error) {
      throw new Error(`[ConfigManager] 导入配置失败: ${error}`);
    }
  }

  /**
   * 销毁配置管理器（用于测试或重置）
   */
  static destroy(): void {
    if (ConfigManager.instance) {
      ConfigManager.instance.listeners.clear();
      ConfigManager.instance = null;
    }
  }
}

/**
 * 导出全局配置管理器实例的便捷访问
 */
export const configManager = ConfigManager.getInstance();