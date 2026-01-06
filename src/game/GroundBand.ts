import { Camera } from './Camera';
import { Renderable } from './Renderable';

/**
 * 地面带
 * 绘制可走区域，显示上下边界线
 */
export class GroundBand implements Renderable {
  private x: number;
  private width: number;
  private height: number;
  private topY: number;  // 上边界 Y 坐标
  private bottomY: number; // 下边界 Y 坐标

  constructor(x: number = 0, y: number = 0, width: number = 2000, height: number = 400) {
    this.x = x;
    this.width = width;
    this.height = height;
    
    // 计算上下边界（可以做成轻微梯形）
    this.topY = y;
    this.bottomY = y + height;
  }

  /**
   * 获取可走区域矩形
   */
  getWalkRect(): { x: number; y: number; width: number; height: number } {
    return {
      x: this.x,
      y: this.topY,
      width: this.width,
      height: this.height
    };
  }

  /**
   * 获取深度键（用于排序）- 地面带始终在最底层
   */
  getDepthKey(): number {
    return -Infinity;
  }

  /**
   * 渲染地面带
   */
  render(ctx: CanvasRenderingContext2D, camera: Camera): void {
    // 获取屏幕坐标
    const topLeft = camera.worldToScreen(this.x, this.topY);
    const topRight = camera.worldToScreen(this.x + this.width, this.topY);
    const bottomLeft = camera.worldToScreen(this.x, this.bottomY);
    const bottomRight = camera.worldToScreen(this.x + this.width, this.bottomY);

    // 绘制地面区域（轻微梯形，扁平风格）
    ctx.save();
    ctx.fillStyle = '#2a2a2a';  // 深灰色地面
    ctx.beginPath();
    ctx.moveTo(topLeft.sx, topLeft.sy);
    ctx.lineTo(topRight.sx, topRight.sy);
    ctx.lineTo(bottomRight.sx, bottomRight.sy);
    ctx.lineTo(bottomLeft.sx, bottomLeft.sy);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // 绘制上边界线
    ctx.save();
    ctx.strokeStyle = '#666666';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(topLeft.sx, topLeft.sy);
    ctx.lineTo(topRight.sx, topRight.sy);
    ctx.stroke();
    ctx.restore();

    // 绘制下边界线
    ctx.save();
    ctx.strokeStyle = '#666666';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(bottomLeft.sx, bottomLeft.sy);
    ctx.lineTo(bottomRight.sx, bottomRight.sy);
    ctx.stroke();
    ctx.restore();
  }
}
