/**
 * 读条类型
 */
export type ChannelType = 'COLLECT_AURA' | 'MOVE_TO_SAFE' | 'EXTRACT';

/**
 * 读条状态
 */
export interface ChannelState {
  type: ChannelType;
  duration: number; // 总时长（秒）
  elapsed: number; // 已过去的时间（秒）
  onFinish: () => void;
  onCancel?: () => void;
}

/**
 * 读条系统
 */
export class Channeling {
  private state: ChannelState | null = null;

  /**
   * 开始读条
   * 核心函数：startChannel
   */
  startChannel(type: ChannelType, duration: number, onFinish: () => void, onCancel?: () => void): void {
    this.state = {
      type,
      duration,
      elapsed: 0,
      onFinish,
      onCancel
    };
  }

  /**
   * 取消读条
   * 核心函数：cancelChannel
   */
  cancelChannel(): void {
    if (this.state) {
      if (this.state.onCancel) {
        this.state.onCancel();
      }
      this.state = null;
    }
  }

  /**
   * 更新读条进度
   * 核心函数：updateChannelProgress
   */
  updateChannelProgress(deltaTime: number): boolean {
    if (!this.state) return false;

    this.state.elapsed += deltaTime / 1000; // 转换为秒

    if (this.state.elapsed >= this.state.duration) {
      // 读条完成
      const onFinish = this.state.onFinish;
      this.state = null;
      onFinish();
      return true;
    }

    return false;
  }

  /**
   * 获取当前读条状态
   */
  getState(): ChannelState | null {
    return this.state;
  }

  /**
   * 获取读条进度（0-1）
   */
  getProgress(): number {
    if (!this.state) return 0;
    return Math.min(this.state.elapsed / this.state.duration, 1);
  }

  /**
   * 获取读条类型
   */
  getType(): ChannelType | null {
    return this.state ? this.state.type : null;
  }

  /**
   * 检查是否在读条中
   */
  isChanneling(): boolean {
    return this.state !== null;
  }
}

