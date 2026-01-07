import { UIPanel } from './UIPanel';
import { UIElement } from './UIElement';

/**
 * 模态框基类
 * 默认带遮罩，默认阻止下层输入
 */
export class UIModal extends UIPanel {
  /** 遮罩元素 */
  private mask: UIElement;

  constructor(panelId: string) {
    super(panelId);
    
    // 创建遮罩
    this.mask = new UIElement();
    this.mask.width = 1280;
    this.mask.height = 720;
    this.mask.x = 0;
    this.mask.y = 0;
    this.mask.interactive = true;
    this.mask.visible = true;
    
    // 渲染遮罩
    const originalRender = this.mask.render.bind(this.mask);
    this.mask.render = (ctx: CanvasRenderingContext2D) => {
      ctx.save();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(0, 0, this.mask.width, this.mask.height);
      ctx.restore();
      originalRender(ctx);
    };
    
    this.addChild(this.mask);
  }

  /**
   * 打开模态框
   */
  override open(): void {
    super.open();
    this.mask.visible = true;
  }

  /**
   * 关闭模态框
   */
  override close(): void {
    super.close();
    this.mask.visible = false;
  }
}
