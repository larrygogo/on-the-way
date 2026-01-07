import { Scene } from './Scene';
import { AppState } from '../../gameplay/state/AppState';
import { UIManager } from '../../ui/core/UIManager';

/**
 * 结算场景
 * 显示游戏结算结果
 */
export class ResultScene implements Scene {
  readonly name = 'RESULT';
  
  private canvas: HTMLCanvasElement;
  private appState: AppState;
  private uiManager: UIManager;
  private resultData: {
    reason: 'SUCCESS' | 'TIMEOUT' | 'DEAD' | 'EXTRACT_INTERRUPTED';
    safeItems: any[];
    unsafeItems: any[];
    lostItems: any[];
  } | null = null;

  constructor(
    canvas: HTMLCanvasElement,
    appState: AppState,
    uiManager: UIManager
  ) {
    this.canvas = canvas;
    this.appState = appState;
    this.uiManager = uiManager;
  }

  /**
   * 设置结算数据
   */
  setResultData(data: {
    reason: 'SUCCESS' | 'TIMEOUT' | 'DEAD' | 'EXTRACT_INTERRUPTED';
    safeItems: any[];
    unsafeItems: any[];
    lostItems: any[];
  }): void {
    this.resultData = data;
  }

  async init(): Promise<void> {
    // 设置应用状态
    this.appState.setScreen('RESULT');
    this.appState.setMenuPage('RESULT_SUMMARY');
    
    // 这里可以创建结算UI面板
    // 目前结算UI由 MainMenuUI 处理，后续可以迁移到新UI系统
  }

  update(deltaTime: number): void {
    // 结算场景的更新逻辑
  }

  render(ctx: CanvasRenderingContext2D): void {
    // 清空画布
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    
    // 结算界面的渲染由 UI 系统处理
  }

  destroy(): void {
    // 清理结算场景资源
    this.resultData = null;
  }

  pause(): void {
    // 暂停场景（可选）
  }

  resume(): void {
    // 恢复场景（可选）
  }
}