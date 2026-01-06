import { Camera } from './Camera';
import { Renderable } from './Renderable';
import { ItemInstance } from './Item';

/**
 * 地面掉落实体
 */
export class GroundLoot implements Renderable {
  public x: number;
  public y: number;
  public z: number = 0;
  public item: ItemInstance;

  constructor(x: number, y: number, item: ItemInstance) {
    this.x = x;
    this.y = y;
    this.item = item;
  }

  /**
   * 获取深度键（用于排序）- 按 y 值排序
   */
  getDepthKey(): number {
    return this.y;
  }

  /**
   * 渲染地面掉落物
   */
  render(ctx: CanvasRenderingContext2D, camera: Camera): void {
    const screenPos = camera.worldToScreen(this.x, this.y, this.z);

    // 绘制阴影（椭圆）
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.beginPath();
    ctx.ellipse(
      screenPos.sx,
      screenPos.sy,
      8,
      4,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.restore();

    // 根据物品类型绘制不同外观
    ctx.save();
    if (this.item.type === 'POTION') {
      // 药水：小圆形，绿色
      ctx.fillStyle = '#00ff00';
      ctx.beginPath();
      ctx.arc(screenPos.sx, screenPos.sy - 8, 6, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // 装备：矩形，金色
      ctx.fillStyle = '#ffd700';
      ctx.fillRect(
        screenPos.sx - 8,
        screenPos.sy - 12,
        16,
        12
      );
    }
    ctx.restore();
  }
}
