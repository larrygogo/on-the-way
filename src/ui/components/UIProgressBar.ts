import { UIElement } from '../core/UIElement';

/**
 * 进度条方向
 */
export type ProgressBarDirection = 'horizontal' | 'vertical';

/**
 * 进度条组件
 */
export class UIProgressBar extends UIElement {
  /** 进度值（0-1） */
  value: number = 0;
  /** 方向 */
  direction: ProgressBarDirection = 'horizontal';
  /** 背景颜色 */
  backgroundColor: string = '#333333';
  /** 进度颜色 */
  progressColor: string = '#4a90e2';
  /** 边框颜色 */
  borderColor: string = '#ffffff';
  /** 边框宽度 */
  borderWidth: number = 2;

  constructor(width: number = 200, height: number = 20) {
    super();
    this.width = width;
    this.height = height;
  }

  /**
   * 设置进度值
   */
  setValue(value: number): void {
    this.value = Math.max(0, Math.min(1, value));
  }

  /**
   * 渲染
   */
  override render(ctx: CanvasRenderingContext2D): void {
    if (!this.visible || this.alpha <= 0) {
      return;
    }

    ctx.save();

    // 应用变换
    const worldPos = this.localToWorld(0, 0);
    ctx.translate(worldPos.x, worldPos.y);
    ctx.globalAlpha *= this.alpha;

    // 绘制背景
    ctx.fillStyle = this.backgroundColor;
    ctx.fillRect(0, 0, this.width, this.height);

    // 绘制进度
    ctx.fillStyle = this.progressColor;
    if (this.direction === 'horizontal') {
      const progressWidth = this.width * this.value;
      ctx.fillRect(0, 0, progressWidth, this.height);
    } else {
      const progressHeight = this.height * this.value;
      ctx.fillRect(0, this.height - progressHeight, this.width, progressHeight);
    }

    // 绘制边框
    if (this.borderWidth > 0) {
      ctx.strokeStyle = this.borderColor;
      ctx.lineWidth = this.borderWidth;
      ctx.strokeRect(0, 0, this.width, this.height);
    }

    ctx.restore();

    // 渲染子元素
    super.render(ctx);
  }
}
