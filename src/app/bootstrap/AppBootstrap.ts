import { ServiceLocator, ServiceKeys } from '../../core/services/ServiceLocator';
import { EventBus } from '../../core/events/EventBus';
import { ResourceManager } from '../../core/resources/ResourceManager';
import { ConfigManager } from '../../core/config/ConfigManager';
import { Logger } from '../../core/utils/Logger';
import { SceneManager } from '../scenes/SceneManager';
import { AppState } from '../../gameplay/state/AppState';
import { ProfileStore } from '../../gameplay/state/ProfileStore';
import { PlayerProfile } from '../../gameplay/state/PlayerProfile';
import { UIManager } from '../../ui/core/UIManager';
import { bindCanvasEvents } from '../../ui/integration/bindCanvasEvents';
import { bindResize } from '../../ui/integration/bindResize';

/**
 * 应用启动器
 * 负责应用的初始化、服务注册和启动流程
 */
export class AppBootstrap {
  private canvas: HTMLCanvasElement;
  private sceneManager: SceneManager;
  private appState: AppState;
  private playerProfile: PlayerProfile;
  private uiManager: UIManager;
  private isInitialized: boolean = false;
  private animationFrameId: number = 0;
  private lastTime: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.sceneManager = new SceneManager();
    this.appState = new AppState();
    this.playerProfile = ProfileStore.loadProfile();
    this.uiManager = new UIManager({ designW: 1280, designH: 720 });
  }

  /**
   * 初始化应用
   */
  async initialize(): Promise<void> {
    const logger = Logger.getInstance();
    
    if (this.isInitialized) {
      logger.warn('AppBootstrap', '应用已经初始化');
      return;
    }

    logger.info('AppBootstrap', '开始初始化应用...');

    try {
      // 1. 注册核心服务
      this.registerServices();

      // 2. 设置 Canvas
      this.setupCanvas();

      // 3. 绑定 UI 系统
      this.setupUI();

      // 4. 初始化配置
      await this.initializeConfig();

      this.isInitialized = true;
      logger.info('AppBootstrap', '应用初始化完成');
    } catch (error) {
      logger.error('AppBootstrap', '应用初始化失败:', error);
      throw error;
    }
  }

  /**
   * 注册服务到服务定位器
   */
  private registerServices(): void {
    const locator = ServiceLocator.getInstance();

    // 注册核心服务
    locator.registerInstance(ServiceKeys.EventBus, EventBus.getInstance());
    locator.registerInstance(ServiceKeys.ResourceManager, ResourceManager.getInstance());
    locator.registerInstance(ServiceKeys.ConfigManager, ConfigManager.getInstance());
    locator.registerInstance(ServiceKeys.Logger, Logger.getInstance());
    locator.registerInstance(ServiceKeys.AppState, this.appState);
    locator.registerInstance(ServiceKeys.PlayerProfile, this.playerProfile);
    locator.registerInstance(ServiceKeys.UIManager, this.uiManager);
    locator.registerInstance('SceneManager', this.sceneManager);

    const logger = Logger.getInstance();
    logger.info('AppBootstrap', '服务注册完成');
  }

  /**
   * 设置 Canvas
   */
  private setupCanvas(): void {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    
    const ctx = this.canvas.getContext('2d');
    if (ctx) {
      ctx.scale(dpr, dpr);
    }

    // 监听窗口大小变化
    window.addEventListener('resize', () => {
      const newDpr = window.devicePixelRatio || 1;
      const newRect = this.canvas.getBoundingClientRect();
      
      this.canvas.width = newRect.width * newDpr;
      this.canvas.height = newRect.height * newDpr;
      
      const newCtx = this.canvas.getContext('2d');
      if (newCtx) {
        newCtx.scale(newDpr, newDpr);
      }
    });

    const logger = Logger.getInstance();
    logger.debug('AppBootstrap', 'Canvas 设置完成');
  }

  /**
   * 设置 UI 系统
   */
  private setupUI(): void {
    bindResize(this.canvas, this.uiManager);
    bindCanvasEvents(this.canvas, this.uiManager);
    const logger = Logger.getInstance();
    logger.debug('AppBootstrap', 'UI 系统设置完成');
  }

  /**
   * 初始化配置
   */
  private async initializeConfig(): Promise<void> {
    const configManager = ConfigManager.getInstance();
    configManager.load();
    const logger = Logger.getInstance();
    logger.debug('AppBootstrap', '配置初始化完成');
  }

  /**
   * 启动应用
   */
  start(): void {
    if (!this.isInitialized) {
      throw new Error('[AppBootstrap] 应用尚未初始化，请先调用 initialize()');
    }

    const logger = Logger.getInstance();
    logger.info('AppBootstrap', '启动应用主循环');
    this.lastTime = performance.now();
    this.gameLoop();
  }

  /**
   * 游戏主循环
   */
  private gameLoop = (): void => {
    const currentTime = performance.now();
    const deltaTime = (currentTime - this.lastTime) / 1000; // 转换为秒
    this.lastTime = currentTime;

    // 更新场景
    this.sceneManager.update(deltaTime);

    // 更新 UI 管理器
    this.uiManager.update(deltaTime);

    // 渲染场景
    const ctx = this.canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.sceneManager.render(ctx);
      
      // 渲染 UI（在场景之后）
      this.uiManager.render(ctx);
    }

    this.animationFrameId = requestAnimationFrame(this.gameLoop);
  };

  /**
   * 停止应用
   */
  stop(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = 0;
    }
  }

  /**
   * 获取场景管理器
   */
  getSceneManager(): SceneManager {
    return this.sceneManager;
  }

  /**
   * 获取应用状态
   */
  getAppState(): AppState {
    return this.appState;
  }

  /**
   * 获取玩家档案
   */
  getPlayerProfile(): PlayerProfile {
    return this.playerProfile;
  }

  /**
   * 获取 UI 管理器
   */
  getUIManager(): UIManager {
    return this.uiManager;
  }

  /**
   * 获取 Canvas
   */
  getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  /**
   * 销毁应用
   */
  destroy(): void {
    this.stop();
    this.sceneManager.clear();
    this.isInitialized = false;
    const logger = Logger.getInstance();
    logger.info('AppBootstrap', '应用已销毁');
  }
}