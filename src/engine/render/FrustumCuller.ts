import { Camera } from './Camera';
import { Renderable } from './Renderable';

/**
 * 视锥（视口）边界
 */
export interface ViewportBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

/**
 * 视锥剔除器
 * 用于剔除屏幕外的对象，优化渲染性能
 */
export class FrustumCuller {
  /**
   * 计算视口边界（考虑相机位置和屏幕尺寸）
   * @param camera 相机
   * @param screenWidth 屏幕宽度
   * @param screenHeight 屏幕高度
   * @param padding 边距（用于提前加载屏幕外的对象）
   */
  static calculateViewportBounds(
    camera: Camera,
    screenWidth: number,
    screenHeight: number,
    padding: number = 0
  ): ViewportBounds {
    const cameraPos = camera.getPosition();
    
    return {
      minX: cameraPos.x - padding,
      maxX: cameraPos.x + screenWidth + padding,
      minY: cameraPos.y - padding,
      maxY: cameraPos.y + screenHeight + padding
    };
  }

  /**
   * 检查点是否在视口内
   * @param x 点的 x 坐标
   * @param y 点的 y 坐标
   * @param bounds 视口边界
   */
  static isPointInViewport(x: number, y: number, bounds: ViewportBounds): boolean {
    return x >= bounds.minX && x <= bounds.maxX &&
           y >= bounds.minY && y <= bounds.maxY;
  }

  /**
   * 检查矩形是否在视口内（或与视口相交）
   * @param x 矩形 x 坐标
   * @param y 矩形 y 坐标
   * @param width 矩形宽度
   * @param height 矩形高度
   * @param bounds 视口边界
   */
  static isRectInViewport(
    x: number,
    y: number,
    width: number,
    height: number,
    bounds: ViewportBounds
  ): boolean {
    // AABB 碰撞检测
    return !(x + width < bounds.minX ||
             x > bounds.maxX ||
             y + height < bounds.minY ||
             y > bounds.maxY);
  }

  /**
   * 过滤可渲染对象，只保留视口内的对象
   * @param renderables 可渲染对象数组
   * @param bounds 视口边界
   * @returns 视口内的对象数组
   */
  static cull<T extends Renderable>(
    renderables: T[],
    bounds: ViewportBounds
  ): T[] {
    return renderables.filter(obj => {
      // 假设对象有 x, y 属性
      const x = (obj as any).x;
      const y = (obj as any).y;
      
      if (x === undefined || y === undefined) {
        return true; // 如果没有坐标，保留（可能是特殊情况）
      }

      // 简单检查：如果对象有尺寸，使用矩形检测，否则使用点检测
      const width = (obj as any).width || (obj as any).footprintWidth || 0;
      const height = (obj as any).height || (obj as any).footprintHeight || 0;

      if (width > 0 && height > 0) {
        return this.isRectInViewport(x, y, width, height, bounds);
      } else {
        return this.isPointInViewport(x, y, bounds);
      }
    });
  }
}