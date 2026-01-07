/**
 * 游戏循环管理器
 * 负责管理游戏的更新和渲染循环
 */
export class GameLoop {
  private animationFrameId: number = 0;
  private lastTime: number = 0;
  private isRunning: boolean = false;
  private updateCallback: (deltaTime: number) => void;
  private renderCallback: () => void;

  constructor(
    updateCallback: (deltaTime: number) => void,
    renderCallback: () => void
  ) {
    this.updateCallback = updateCallback;
    this.renderCallback = renderCallback;
  }

  /**
   * 启动游戏循环
   */
  start(): void {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    this.lastTime = performance.now();
    this.loop();
  }

  /**
   * 停止游戏循环
   */
  stop(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = 0;
    }
    this.isRunning = false;
  }

  /**
   * 游戏循环
   */
  private loop = (): void => {
    if (!this.isRunning) {
      return;
    }

    const currentTime = performance.now();
    const deltaTime = (currentTime - this.lastTime) / 1000; // 转换为秒
    this.lastTime = currentTime;

    // 更新
    this.updateCallback(deltaTime);

    // 渲染
    this.renderCallback();

    // 继续循环
    this.animationFrameId = requestAnimationFrame(this.loop);
  };

  /**
   * 检查循环是否正在运行
   */
  isLoopRunning(): boolean {
    return this.isRunning;
  }

  /**
   * 获取最后一帧的时间
   */
  getLastTime(): number {
    return this.lastTime;
  }
}