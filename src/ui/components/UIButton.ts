import { UIElement } from '../core/UIElement';
import { PointerEvent } from '../core/PointerEvent';

/**
 * 按钮状态
 */
export type ButtonState = 'normal' | 'pressed' | 'disabled';

/**
 * 按钮组件
 */
export class UIButton extends UIElement {
  /** 按钮文本 */
  text: string;
  /** 按钮状态 */
  state: ButtonState = 'normal';
  /** 点击回调 */
  onClick?: () => void;
  /** 点击区域扩展（移动端友好） */
  hitSlop: number = 0;

  /** 背景颜色 */
  backgroundColor: string = '#4a90e2';
  /** 按下时背景颜色 */
  pressedBackgroundColor: string = '#357abd';
  /** 禁用时背景颜色 */
  disabledBackgroundColor: string = '#666666';
  /** 文字颜色 */
  textColor: string = '#ffffff';
  /** 字体大小 */
  fontSize: number = 18;

  private pointerDown: boolean = false;

  constructor(text: string = '') {
    super();
    this.text = text;
    this.interactive = true;
    this.width = 200;
    this.height = 50;
  }

  /**
   * 处理 Pointer 事件
   */
  override onPointerEvent(event: PointerEvent): void {
    console.log(`[UIButton] ${this.text} 收到事件:`, event.type, '坐标:', event.x, event.y);
    if (this.state === 'disabled') {
      return;
    }

    if (event.type === 'down') {
      console.log(`[UIButton] ${this.text} 按下`);
      this.pointerDown = true;
      this.state = 'pressed';
      event.consumed = true;
    } else if (event.type === 'up' || event.type === 'cancel') {
      if (this.pointerDown && event.type === 'up') {
        // 检查是否仍在按钮内
        const local = this.worldToLocal(event.x, event.y);
        console.log(`[UIButton] ${this.text} 抬起，本地坐标:`, local.x, local.y, '按钮范围:', -this.hitSlop, -this.hitSlop, this.width + this.hitSlop, this.height + this.hitSlop);
        if (this.containsPointWithSlop(local.x, local.y)) {
          console.log(`[UIButton] ${this.text} 点击成功！`);
          this.onClick?.();
        } else {
          console.log(`[UIButton] ${this.text} 点击失败，不在按钮范围内`);
        }
      }
      this.pointerDown = false;
      this.state = 'normal';
      event.consumed = true;
    } else if (event.type === 'move') {
      if (this.pointerDown) {
        const local = this.worldToLocal(event.x, event.y);
        this.state = this.containsPointWithSlop(local.x, local.y) ? 'pressed' : 'normal';
      }
    }
  }

  /**
   * 检查点是否在按钮内（考虑 hitSlop）
   */
  private containsPointWithSlop(localX: number, localY: number): boolean {
    return (
      localX >= -this.hitSlop &&
      localX <= this.width + this.hitSlop &&
      localY >= -this.hitSlop &&
      localY <= this.height + this.hitSlop
    );
  }

  /**
   * 命中检测（考虑 hitSlop）
   */
  override hitTest(worldX: number, worldY: number): UIElement | null {
    const local = this.worldToLocal(worldX, worldY);
    if (this.containsPointWithSlop(local.x, local.y)) {
      return super.hitTest(worldX, worldY);
    }
    return null;
  }

  /**
   * 渲染
   */
  override render(ctx: CanvasRenderingContext2D): void {
    if (!this.visible || this.alpha <= 0) {
      return;
    }

    ctx.save();

    // 应用变换（与父元素 UIElement 的渲染逻辑一致）
    const worldPos = this.localToWorld(0, 0);
    const pivotOffsetX = this.width * this.pivot.x;
    const pivotOffsetY = this.height * this.pivot.y;

    ctx.translate(worldPos.x + pivotOffsetX, worldPos.y + pivotOffsetY);
    ctx.scale(this.scale.x, this.scale.y);
    ctx.translate(-pivotOffsetX, -pivotOffsetY);
    ctx.globalAlpha *= this.alpha;

    // 绘制背景
    let bgColor = this.backgroundColor;
    if (this.state === 'pressed') {
      bgColor = this.pressedBackgroundColor;
    } else if (this.state === 'disabled') {
      bgColor = this.disabledBackgroundColor;
    }

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, this.width, this.height);

    // 绘制边框
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, this.width, this.height);

    // 绘制文字
    if (this.text) {
      ctx.fillStyle = this.textColor;
      ctx.font = `${this.fontSize}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(this.text, this.width / 2, this.height / 2);
    }

    ctx.restore();
  }
}
