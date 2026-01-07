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
 * 点坐标
 */
export interface Point {
  x: number;
  y: number;
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

  /**
   * 检查点是否在多边形内（使用射线法）
   * 核心函数：pointInPolygon
   * @param point 要检查的点
   * @param polygon 多边形顶点数组（按顺序排列）
   * @returns 点是否在多边形内
   */
  static pointInPolygon(point: Point, polygon: Point[]): boolean {
    if (polygon.length < 3) return false;

    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].x;
      const yi = polygon[i].y;
      const xj = polygon[j].x;
      const yj = polygon[j].y;

      const intersect = ((yi > point.y) !== (yj > point.y)) &&
        (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }

    return inside;
  }

  /**
   * 将点限制在多边形边界内
   * 如果点在多边形外，将其投影到最近的边界上
   * 核心函数：clampPointToPolygon
   * @param point 要限制的点
   * @param polygon 多边形顶点数组
   * @returns 限制后的点
   */
  static clampPointToPolygon(point: Point, polygon: Point[]): Point {
    // 如果点在多边形内，直接返回
    if (this.pointInPolygon(point, polygon)) {
      return point;
    }

    // 找到最近的边界点
    let minDist = Infinity;
    let closestPoint: Point = point;

    // 检查每条边
    for (let i = 0; i < polygon.length; i++) {
      const p1 = polygon[i];
      const p2 = polygon[(i + 1) % polygon.length];

      // 计算点到线段的最近点
      const closest = this.closestPointOnSegment(point, p1, p2);
      const dist = Math.sqrt(
        Math.pow(closest.x - point.x, 2) + Math.pow(closest.y - point.y, 2)
      );

      if (dist < minDist) {
        minDist = dist;
        closestPoint = closest;
      }
    }

    return closestPoint;
  }

  /**
   * 计算点到线段的最近点
   * @param point 点
   * @param segStart 线段起点
   * @param segEnd 线段终点
   * @returns 线段上的最近点
   */
  private static closestPointOnSegment(
    point: Point,
    segStart: Point,
    segEnd: Point
  ): Point {
    const dx = segEnd.x - segStart.x;
    const dy = segEnd.y - segStart.y;
    const length2 = dx * dx + dy * dy;

    if (length2 === 0) return segStart;

    const t = Math.max(0, Math.min(1,
      ((point.x - segStart.x) * dx + (point.y - segStart.y) * dy) / length2
    ));

    return {
      x: segStart.x + t * dx,
      y: segStart.y + t * dy
    };
  }

  /**
   * 获取多边形的边界框（AABB）
   * @param polygon 多边形顶点数组
   * @returns 边界矩形
   */
  static getPolygonBounds(polygon: Point[]): Rect {
    if (polygon.length === 0) {
      return { x: 0, y: 0, width: 0, height: 0 };
    }

    let minX = polygon[0].x;
    let minY = polygon[0].y;
    let maxX = polygon[0].x;
    let maxY = polygon[0].y;

    for (const point of polygon) {
      minX = Math.min(minX, point.x);
      minY = Math.min(minY, point.y);
      maxX = Math.max(maxX, point.x);
      maxY = Math.max(maxY, point.y);
    }

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    };
  }
}

