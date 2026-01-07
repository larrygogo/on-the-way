import { Scene } from './Scene';
import { AppState } from '../../gameplay/state/AppState';
import { PlayerProfile } from '../../gameplay/state/PlayerProfile';
import { UIManager } from '../../ui/core/UIManager';
import { MainMenuPanel } from '../../ui/panels/MainMenuPanel';

/**
 * 主菜单场景
 * 处理主菜单的显示和交互
 */
export class MainMenuScene implements Scene {
  readonly name = 'MAIN_MENU';
  
  private canvas: HTMLCanvasElement;
  private appState: AppState;
  private playerProfile: PlayerProfile;
  private uiManager: UIManager;
  private mainMenuPanel: MainMenuPanel | null = null;

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

  async init(): Promise<void> {
    // 创建主菜单面板
    const layoutState = this.uiManager.getLayoutState();
    this.mainMenuPanel = new MainMenuPanel(layoutState, this.playerProfile);
    
    // 打开主菜单面板
    this.uiManager.open(this.mainMenuPanel, { layer: 'ui' });
    
    // 设置初始状态
    this.appState.setScreen('MAIN_MENU');
    this.appState.setMenuPage('HOME');
  }

  update(deltaTime: number): void {
    // 主菜单场景的更新逻辑
    // 可以在这里处理动画、定时器等
  }

  render(ctx: CanvasRenderingContext2D): void {
    // 清空画布
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    
    // 主菜单的渲染由 UI 系统处理
    // SceneManager 会在场景渲染后渲染 UI
  }

  destroy(): void {
    // 关闭主菜单面板
    if (this.mainMenuPanel) {
      this.uiManager.close(this.mainMenuPanel);
      this.mainMenuPanel = null;
    }
  }

  pause(): void {
    // 暂停场景（可选）
  }

  resume(): void {
    // 恢复场景（可选）
    if (this.mainMenuPanel) {
      this.mainMenuPanel.updateProfile(this.playerProfile);
    }
  }
}