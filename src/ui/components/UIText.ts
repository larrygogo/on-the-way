import { UIElement } from '../core/UIElement';

/**
 * 文本组件
 */
export class UIText extends UIElement {
  /** 文本内容 */
  text: string = '';
  /** 字体大小 */
  fontSize: number = 16;
  /** 文字颜色 */
  color: string = '#ffffff';
  /** 文字对齐方式 */
  align: CanvasTextAlign = 'left';
  /** 文字基线 */
  baseline: CanvasTextBaseline = 'top';
  /** 字体族 */
  fontFamily: string = 'Arial';

  constructor(text: string = '') {
    super();
    this.text = text;
    this.width = 100;
    this.height = this.fontSize;
  }

  /**
   * 设置文本
   */
  setText(text: string): void {
    this.text = text;
  }

  /**
   * 渲染
   */
  override render(ctx: CanvasRenderingContext2D): void {
    if (!this.visible || this.alpha <= 0 || !this.text) {
      return;
    }

    ctx.save();

    // 应用变换
    const worldPos = this.localToWorld(0, 0);
    ctx.translate(worldPos.x, worldPos.y);
    ctx.globalAlpha *= this.alpha;

    // 设置字体
    ctx.font = `${this.fontSize}px ${this.fontFamily}`;
    ctx.fillStyle = this.color;
    ctx.textAlign = this.align;
    ctx.textBaseline = this.baseline;

    // 绘制文字
    ctx.fillText(this.text, 0, 0);

    ctx.restore();

    // 渲染子元素
    super.render(ctx);
  }
}
