/**
 * 全局倒计时系统
 */
export class SessionTimer {
  private totalSeconds: number;
  private currentSeconds: number;
  private isRunning: boolean = true;

  constructor(totalSeconds: number = 12 * 60) {
    this.totalSeconds = totalSeconds;
    this.currentSeconds = totalSeconds;
  }

  /**
   * 更新倒计时
   */
  update(deltaTime: number): void {
    if (!this.isRunning) return;
    
    this.currentSeconds -= deltaTime / 1000; // 转换为秒
    if (this.currentSeconds < 0) {
      this.currentSeconds = 0;
    }
  }

  /**
   * 获取剩余时间（秒）
   */
  getRemainingSeconds(): number {
    return Math.max(0, Math.ceil(this.currentSeconds));
  }

  /**
   * 检查是否已到时间
   */
  isExpired(): boolean {
    return this.currentSeconds <= 0;
  }

  /**
   * 停止倒计时
   */
  stop(): void {
    this.isRunning = false;
  }

  /**
   * 开始倒计时
   */
  start(): void {
    this.isRunning = true;
  }

  /**
   * 重置倒计时
   */
  reset(): void {
    this.currentSeconds = this.totalSeconds;
    this.isRunning = true;
  }

  /**
   * 格式化时间为 mm:ss
   */
  formatTime(): string {
    const seconds = this.getRemainingSeconds();
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
}
