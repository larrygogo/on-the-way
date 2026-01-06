import { Camera } from './Camera';
import { Renderable } from './Renderable';

/**
 * 障碍物实体
 */
export class Obstacle implements Renderable {
  public x: number;
  public y: number;
  public z: number = 0;
  
  // 脚底碰撞盒（用于碰撞检测）
  public footprintWidth: number;
  public footprintHeight: number;
  
  // 视觉大小（用于绘制）
  public visualWidth: number;
  public visualHeight: number;
  
  // 排序偏移（用于调整渲染顺序）
  public sortOffset: number = 0;

  constructor(
    x: number,
    y: number,
    footprintWidth: number,
    footprintHeight: number,
    visualWidth?: number,
    visualHeight?: number
  ) {
    this.x = x;
    this.y = y;
    this.footprintWidth = footprintWidth;
    this.footprintHeight = footprintHeight;
    
    // 如果没有指定视觉大小，使用 footprint 大小
    this.visualWidth = visualWidth ?? footprintWidth;
    this.visualHeight = visualHeight ?? footprintHeight;
  }

  /**
   * 获取深度键（用于排序）- 按 (y + sortOffset) 排序
   */
  getDepthKey(): number {
    return this.y + this.sortOffset;
  }

  /**
   * 渲染障碍物
   */
  render(ctx: CanvasRenderingContext2D, camera: Camera): void {
    const screenPos = camera.worldToScreen(this.x, this.y, this.z);

    // 绘制阴影（椭圆）
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(
      screenPos.sx,
      screenPos.sy,
      this.visualWidth / 2,
      this.visualWidth / 4,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.restore();

    // 绘制障碍物（箱子/柱子）
    ctx.save();
    ctx.fillStyle = '#8b4513'; // 棕色箱子
    ctx.fillRect(
      screenPos.sx - this.visualWidth / 2,
      screenPos.sy - this.visualHeight,
      this.visualWidth,
      this.visualHeight
    );

    // 绘制边框
    ctx.strokeStyle = '#654321';
    ctx.lineWidth = 2;
    ctx.strokeRect(
      screenPos.sx - this.visualWidth / 2,
      screenPos.sy - this.visualHeight,
      this.visualWidth,
      this.visualHeight
    );
    ctx.restore();
  }

  /**
   * 调试绘制：绘制 footprint（碰撞盒）
   */
  debugDrawFootprint(ctx: CanvasRenderingContext2D, camera: Camera): void {
    const screenPos = camera.worldToScreen(this.x, this.y, this.z);

    ctx.save();
    ctx.fillStyle = 'rgba(255, 0, 0, 0.3)'; // 半透明红色
    ctx.fillRect(
      screenPos.sx - this.footprintWidth / 2,
      screenPos.sy - this.footprintHeight / 2,
      this.footprintWidth,
      this.footprintHeight
    );
    ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
    ctx.lineWidth = 1;
    ctx.strokeRect(
      screenPos.sx - this.footprintWidth / 2,
      screenPos.sy - this.footprintHeight / 2,
      this.footprintWidth,
      this.footprintHeight
    );
    ctx.restore();
  }
}
