/**
 * 矩形结构（用于碰撞检测）
 */
export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * 碰撞检测工具函数
 */
export class Collision {
  /**
   * 将实体位置和尺寸转换为矩形
   * 核心函数：toRect
   */
  static toRect(x: number, y: number, width: number, height: number): Rect {
    return {
      x: x - width / 2,
      y: y - height / 2,
      width: width,
      height: height
    };
  }

  /**
   * AABB 碰撞检测
   * 核心函数：rectsIntersect
   */
  static rectsIntersect(rect1: Rect, rect2: Rect): boolean {
    return (
      rect1.x < rect2.x + rect2.width &&
      rect1.x + rect1.width > rect2.x &&
      rect1.y < rect2.y + rect2.height &&
      rect1.y + rect1.height > rect2.y
    );
  }

  /**
   * 检查两个矩形是否在指定方向上重叠
   */
  static rectsIntersectX(rect1: Rect, rect2: Rect): boolean {
    return (
      rect1.x < rect2.x + rect2.width &&
      rect1.x + rect1.width > rect2.x
    );
  }

  static rectsIntersectY(rect1: Rect, rect2: Rect): boolean {
    return (
      rect1.y < rect2.y + rect2.height &&
      rect1.y + rect1.height > rect2.y
    );
  }
}
