import { ConfigManager } from '../config/ConfigManager';

/**
 * 日志级别
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4
}

/**
 * 日志配置
 */
interface LogConfig {
  enabled: boolean;
  level: LogLevel;
  showTimestamp: boolean;
  showModule: boolean;
  modules: {
    [module: string]: {
      enabled: boolean;
      level: LogLevel;
    };
  };
}

/**
 * 日志管理器
 * 统一管理日志输出，支持按模块和级别控制
 */
export class Logger {
  private static instance: Logger | null = null;
  private configManager: ConfigManager;
  private config: LogConfig;
  private defaultLevel: LogLevel = LogLevel.INFO;

  private constructor() {
    this.configManager = ConfigManager.getInstance();
    this.config = this.loadConfig();
    
    // 监听配置变化
    this.configManager.addListener(() => {
      this.config = this.loadConfig();
    });
  }

  /**
   * 获取日志管理器实例（单例模式）
   */
  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  /**
   * 从配置加载日志设置
   */
  private loadConfig(): LogConfig {
    try {
      const settings = this.configManager.getCategory('debug');
      return {
        enabled: settings.logEnabled ?? true,
        level: this.parseLogLevel(settings.logLevel ?? 'INFO'),
        showTimestamp: settings.showTimestamp ?? false,
        showModule: settings.showModule ?? true,
        modules: settings.logModules ?? {}
      };
    } catch {
      // 如果配置不存在，使用默认值
      return {
        enabled: true,
        level: LogLevel.INFO,
        showTimestamp: false,
        showModule: true,
        modules: {}
      };
    }
  }

  /**
   * 解析日志级别字符串
   */
  private parseLogLevel(level: string): LogLevel {
    switch (level.toUpperCase()) {
      case 'DEBUG':
        return LogLevel.DEBUG;
      case 'INFO':
        return LogLevel.INFO;
      case 'WARN':
        return LogLevel.WARN;
      case 'ERROR':
        return LogLevel.ERROR;
      case 'NONE':
        return LogLevel.NONE;
      default:
        return LogLevel.INFO;
    }
  }

  /**
   * 检查是否应该输出日志
   */
  private shouldLog(module: string, level: LogLevel): boolean {
    if (!this.config.enabled) {
      return false;
    }

    // 检查模块特定配置
    const moduleConfig = this.config.modules[module];
    if (moduleConfig) {
      if (!moduleConfig.enabled) {
        return false;
      }
      return level >= moduleConfig.level;
    }

    // 使用全局级别
    return level >= this.config.level;
  }

  /**
   * 格式化日志消息
   */
  private formatMessage(module: string, level: string, message: string, ...args: any[]): string {
    const parts: string[] = [];

    if (this.config.showTimestamp) {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('zh-CN', { 
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        fractionalSecondDigits: 3
      });
      parts.push(`[${timeStr}]`);
    }

    if (this.config.showModule) {
      parts.push(`[${module}]`);
    }

    parts.push(`[${level}]`, message);

    return parts.join(' ');
  }

  /**
   * 输出调试日志
   */
  debug(module: string, message: string, ...args: any[]): void {
    if (this.shouldLog(module, LogLevel.DEBUG)) {
      console.debug(this.formatMessage(module, 'DEBUG', message, ...args), ...args);
    }
  }

  /**
   * 输出信息日志
   */
  info(module: string, message: string, ...args: any[]): void {
    if (this.shouldLog(module, LogLevel.INFO)) {
      console.info(this.formatMessage(module, 'INFO', message, ...args), ...args);
    }
  }

  /**
   * 输出警告日志
   */
  warn(module: string, message: string, ...args: any[]): void {
    if (this.shouldLog(module, LogLevel.WARN)) {
      console.warn(this.formatMessage(module, 'WARN', message, ...args), ...args);
    }
  }

  /**
   * 输出错误日志
   */
  error(module: string, message: string, ...args: any[]): void {
    if (this.shouldLog(module, LogLevel.ERROR)) {
      console.error(this.formatMessage(module, 'ERROR', message, ...args), ...args);
    }
  }

  /**
   * 设置模块日志级别
   */
  setModuleLevel(module: string, level: LogLevel, enabled: boolean = true): void {
    const settings = this.configManager.getCategory('debug');
    const modules = { ...(settings.logModules || {}) };
    modules[module] = { enabled, level };
    
    this.configManager.updateCategory('debug', { logModules: modules });
    this.config = this.loadConfig();
  }

  /**
   * 设置全局日志级别
   */
  setLevel(level: LogLevel): void {
    const levelStr = LogLevel[level];
    this.configManager.updateCategory('debug', { logLevel: levelStr });
    this.config = this.loadConfig();
  }

  /**
   * 启用/禁用日志
   */
  setEnabled(enabled: boolean): void {
    this.configManager.updateCategory('debug', { logEnabled: enabled });
    this.config = this.loadConfig();
  }
}

/**
 * 导出全局日志管理器实例的便捷访问
 */
export const logger = Logger.getInstance();

/**
 * 创建模块日志器（便捷方法）
 */
export function createModuleLogger(moduleName: string) {
  return {
    debug: (message: string, ...args: any[]) => logger.debug(moduleName, message, ...args),
    info: (message: string, ...args: any[]) => logger.info(moduleName, message, ...args),
    warn: (message: string, ...args: any[]) => logger.warn(moduleName, message, ...args),
    error: (message: string, ...args: any[]) => logger.error(moduleName, message, ...args),
  };
}