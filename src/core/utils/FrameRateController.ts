/**
 * 帧率控制器
 * 用于控制游戏循环的帧率，避免过度渲染
 */
export class FrameRateController {
  private targetFPS: number;
  private frameInterval: number; // 每帧间隔（毫秒）
  private lastFrameTime: number = 0;
  private deltaTime: number = 0;
  private accumulatedTime: number = 0;

  constructor(targetFPS: number = 60) {
    this.setTargetFPS(targetFPS);
  }

  /**
   * 设置目标帧率
   * @param fps 目标帧率
   */
  setTargetFPS(fps: number): void {
    this.targetFPS = Math.max(1, Math.min(120, fps)); // 限制在 1-120 FPS
    this.frameInterval = 1000 / this.targetFPS;
  }

  /**
   * 获取目标帧率
   */
  getTargetFPS(): number {
    return this.targetFPS;
  }

  /**
   * 检查是否可以执行下一帧
   * @param currentTime 当前时间（毫秒）
   * @returns 是否可以执行下一帧
   */
  shouldUpdate(currentTime: number): boolean {
    const elapsed = currentTime - this.lastFrameTime;
    
    if (elapsed >= this.frameInterval) {
      this.deltaTime = elapsed / 1000; // 转换为秒
      this.lastFrameTime = currentTime - (elapsed % this.frameInterval); // 保留余数，避免时间漂移
      return true;
    }
    
    return false;
  }

  /**
   * 获取上一帧的 deltaTime（秒）
   */
  getDeltaTime(): number {
    return this.deltaTime;
  }

  /**
   * 获取实际帧率
   * @param currentTime 当前时间（毫秒）
   */
  getActualFPS(currentTime: number): number {
    const elapsed = currentTime - this.lastFrameTime;
    if (elapsed === 0) {
      return this.targetFPS;
    }
    return 1000 / elapsed;
  }

  /**
   * 重置帧率控制器
   */
  reset(): void {
    this.lastFrameTime = performance.now();
    this.deltaTime = 0;
    this.accumulatedTime = 0;
  }
}