/**
 * 空间哈希表
 * 用于优化碰撞检测，将空间划分为网格，只检测同一网格或相邻网格的对象
 */
export class SpatialHash<T extends { x: number; y: number; width?: number; height?: number }> {
  private cellSize: number;
  private cells: Map<string, T[]> = new Map();

  /**
   * 创建空间哈希表
   * @param cellSize 网格大小（建议为对象平均大小的 2-4 倍）
   */
  constructor(cellSize: number = 100) {
    this.cellSize = cellSize;
  }

  /**
   * 将坐标转换为网格键
   */
  private getCellKey(x: number, y: number): string {
    const cellX = Math.floor(x / this.cellSize);
    const cellY = Math.floor(y / this.cellSize);
    return `${cellX},${cellY}`;
  }

  /**
   * 获取对象所在的网格键列表（对象可能跨越多个网格）
   */
  private getObjectCells(obj: T): string[] {
    const x = obj.x;
    const y = obj.y;
    const width = obj.width || 0;
    const height = obj.height || 0;

    const minX = Math.floor(x / this.cellSize);
    const maxX = Math.floor((x + width) / this.cellSize);
    const minY = Math.floor(y / this.cellSize);
    const maxY = Math.floor((y + height) / this.cellSize);

    const cells: string[] = [];
    for (let cx = minX; cx <= maxX; cx++) {
      for (let cy = minY; cy <= maxY; cy++) {
        cells.push(`${cx},${cy}`);
      }
    }

    return cells.length > 0 ? cells : [this.getCellKey(x, y)];
  }

  /**
   * 清空所有对象
   */
  clear(): void {
    this.cells.clear();
  }

  /**
   * 插入对象
   */
  insert(obj: T): void {
    const cellKeys = this.getObjectCells(obj);
    for (const key of cellKeys) {
      if (!this.cells.has(key)) {
        this.cells.set(key, []);
      }
      this.cells.get(key)!.push(obj);
    }
  }

  /**
   * 移除对象
   */
  remove(obj: T): void {
    const cellKeys = this.getObjectCells(obj);
    for (const key of cellKeys) {
      const cell = this.cells.get(key);
      if (cell) {
        const index = cell.indexOf(obj);
        if (index !== -1) {
          cell.splice(index, 1);
        }
        if (cell.length === 0) {
          this.cells.delete(key);
        }
      }
    }
  }

  /**
   * 查询指定区域内的对象
   * @param x 区域 x 坐标
   * @param y 区域 y 坐标
   * @param width 区域宽度
   * @param height 区域高度
   * @returns 区域内的对象数组（去重）
   */
  query(x: number, y: number, width: number = 0, height: number = 0): T[] {
    const minX = Math.floor(x / this.cellSize);
    const maxX = Math.floor((x + width) / this.cellSize);
    const minY = Math.floor(y / this.cellSize);
    const maxY = Math.floor((y + height) / this.cellSize);

    const results = new Set<T>();

    for (let cx = minX; cx <= maxX; cx++) {
      for (let cy = minY; cy <= maxY; cy++) {
        const key = `${cx},${cy}`;
        const cell = this.cells.get(key);
        if (cell) {
          for (const obj of cell) {
            results.add(obj);
          }
        }
      }
    }

    return Array.from(results);
  }

  /**
   * 查询指定点附近的对象
   * @param x 点 x 坐标
   * @param y 点 y 坐标
   * @param radius 查询半径
   * @returns 附近的对象数组
   */
  queryRadius(x: number, y: number, radius: number): T[] {
    return this.query(x - radius, y - radius, radius * 2, radius * 2);
  }

  /**
   * 获取所有对象
   */
  getAll(): T[] {
    const results = new Set<T>();
    for (const cell of this.cells.values()) {
      for (const obj of cell) {
        results.add(obj);
      }
    }
    return Array.from(results);
  }

  /**
   * 获取统计信息
   */
  getStats(): {
    cellCount: number;
    objectCount: number;
    averageObjectsPerCell: number;
  } {
    let totalObjects = 0;
    for (const cell of this.cells.values()) {
      totalObjects += cell.length;
    }
    
    return {
      cellCount: this.cells.size,
      objectCount: totalObjects,
      averageObjectsPerCell: this.cells.size > 0 ? totalObjects / this.cells.size : 0
    };
  }
}