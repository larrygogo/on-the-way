import { Scene } from './Scene';
import { Game } from '../../gameplay/Game';
import { AppState } from '../../gameplay/state/AppState';
import { PlayerProfile } from '../../gameplay/state/PlayerProfile';
import { UIManager } from '../../ui/core/UIManager';

/**
 * 游戏场景
 * 处理游戏运行时的逻辑和渲染
 */
export class GameScene implements Scene {
  readonly name = 'GAME';
  
  private canvas: HTMLCanvasElement;
  private appState: AppState;
  private playerProfile: PlayerProfile;
  private uiManager: UIManager;
  private game: Game | null = null;
  private dungeonId: string | null = null;

  constructor(
    canvas: HTMLCanvasElement,
    appState: AppState,
    playerProfile: PlayerProfile,
    uiManager: UIManager
  ) {
    this.canvas = canvas;
    this.appState = appState;
    this.playerProfile = playerProfile;
    this.uiManager = uiManager;
  }

  /**
   * 设置要进入的秘境ID
   */
  setDungeonId(dungeonId: string): void {
    this.dungeonId = dungeonId;
  }

  async init(): Promise<void> {
    if (!this.dungeonId) {
      throw new Error('[GameScene] 未设置秘境ID');
    }

    // 创建游戏实例
    this.game = new Game(this.canvas, this.appState, this.playerProfile, this.uiManager);
    
    // 进入秘境
    await this.game.enterDungeon(this.dungeonId);
    
    // 启动游戏
    this.game.start();
    
    // 设置应用状态
    this.appState.setScreen('RUN');
  }

  update(deltaTime: number): void {
    // 游戏更新由 Game 类内部处理
    // 这里可以添加场景级别的更新逻辑
  }

  render(ctx: CanvasRenderingContext2D): void {
    // 游戏渲染由 Game 类内部处理
    // 这里可以添加场景级别的渲染逻辑
  }

  destroy(): void {
    // 停止并销毁游戏
    if (this.game) {
      // 注意：Game 类可能需要添加 stop() 或 destroy() 方法
      this.game = null;
    }
  }

  pause(): void {
    // 暂停游戏（可选）
  }

  resume(): void {
    // 恢复游戏（可选）
  }

  /**
   * 获取游戏实例
   */
  getGame(): Game | null {
    return this.game;
  }
}