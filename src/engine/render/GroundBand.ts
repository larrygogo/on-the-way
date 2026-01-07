import { Camera } from './Camera';
import { Renderable } from './Renderable';
import { WalkAreaConfig } from '../../content/config/MapConfig';

/**
 * 地面带
 * 绘制可走区域，显示边界线
 */
export class GroundBand implements Renderable {
  private walkArea: WalkAreaConfig;

  constructor(walkArea: WalkAreaConfig) {
    this.walkArea = walkArea;
  }

  /**
   * 获取可走区域
   */
  getWalkArea(): WalkAreaConfig {
    return this.walkArea;
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
    ctx.save();
    ctx.fillStyle = '#2a2a2a';  // 深灰色地面
    ctx.beginPath();

    if (this.walkArea.type === 'rect') {
      // 矩形区域
      const rect = this.walkArea.rect;
      const topLeft = camera.worldToScreen(rect.x, rect.y);
      const topRight = camera.worldToScreen(rect.x + rect.width, rect.y);
      const bottomLeft = camera.worldToScreen(rect.x, rect.y + rect.height);
      const bottomRight = camera.worldToScreen(rect.x + rect.width, rect.y + rect.height);

      ctx.moveTo(topLeft.sx, topLeft.sy);
      ctx.lineTo(topRight.sx, topRight.sy);
      ctx.lineTo(bottomRight.sx, bottomRight.sy);
      ctx.lineTo(bottomLeft.sx, bottomLeft.sy);
    } else {
      // 多边形区域
      const points = this.walkArea.points;
      if (points.length > 0) {
        const firstPoint = camera.worldToScreen(points[0].x, points[0].y);
        ctx.moveTo(firstPoint.sx, firstPoint.sy);
        for (let i = 1; i < points.length; i++) {
          const point = camera.worldToScreen(points[i].x, points[i].y);
          ctx.lineTo(point.sx, point.sy);
        }
      }
    }

    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // 绘制边界线
    ctx.save();
    ctx.strokeStyle = '#666666';
    ctx.lineWidth = 2;
    ctx.beginPath();

    if (this.walkArea.type === 'rect') {
      const rect = this.walkArea.rect;
      const topLeft = camera.worldToScreen(rect.x, rect.y);
      const topRight = camera.worldToScreen(rect.x + rect.width, rect.y);
      const bottomLeft = camera.worldToScreen(rect.x, rect.y + rect.height);
      const bottomRight = camera.worldToScreen(rect.x + rect.width, rect.y + rect.height);

      // 上边界
      ctx.moveTo(topLeft.sx, topLeft.sy);
      ctx.lineTo(topRight.sx, topRight.sy);
      ctx.stroke();

      // 下边界
      ctx.moveTo(bottomLeft.sx, bottomLeft.sy);
      ctx.lineTo(bottomRight.sx, bottomRight.sy);
      ctx.stroke();
    } else {
      // 多边形边界
      const points = this.walkArea.points;
      if (points.length > 0) {
        const firstPoint = camera.worldToScreen(points[0].x, points[0].y);
        ctx.moveTo(firstPoint.sx, firstPoint.sy);
        for (let i = 1; i < points.length; i++) {
          const point = camera.worldToScreen(points[i].x, points[i].y);
          ctx.lineTo(point.sx, point.sy);
        }
        ctx.closePath();
        ctx.stroke();
      }
    }

    ctx.restore();
  }
}

