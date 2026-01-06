import { Camera } from './Camera';
import { Renderable } from './Renderable';
import { Obstacle } from './Obstacle';
import { Collision, Rect } from './Collision';

/**
 * 可走区域矩形
 */
export interface WalkRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * 玩家实体
 */
export class Player implements Renderable {
  public x: number;
  public y: number;
  public z: number;  // 暂时不用，保留字段
  
  // 脚底碰撞盒（用于碰撞检测）
  public footprintWidth: number = 16;
  public footprintHeight: number = 16;
  
  // 玩家属性
  public hp: number = 100;
  public maxHp: number = 100;
  
  private speed: number = 2.5;
  private keys: Set<string> = new Set();
  private walkRect: WalkRect | null = null;
  private obstacles: Obstacle[] = [];

  constructor(x: number = 0, y: number = 0, z: number = 0) {
    this.x = x;
    this.y = y;
    this.z = z;
  }

  /**
   * 设置可走区域限制
   */
  setWalkRect(rect: WalkRect): void {
    this.walkRect = rect;
  }

  /**
   * 设置障碍物列表（用于碰撞检测）
   */
  setObstacles(obstacles: Obstacle[]): void {
    this.obstacles = obstacles;
  }

  /**
   * 处理键盘输入
   */
  handleKeyDown(key: string): void {
    this.keys.add(key.toLowerCase());
  }

  handleKeyUp(key: string): void {
    this.keys.delete(key.toLowerCase());
  }

  /**
   * 限制坐标在 walkRect 内
   */
  private clampPosition(): void {
    if (!this.walkRect) return;

    this.x = Math.max(this.walkRect.x, Math.min(this.walkRect.x + this.walkRect.width, this.x));
    this.y = Math.max(this.walkRect.y, Math.min(this.walkRect.y + this.walkRect.height, this.y));
  }

  /**
   * 获取玩家的 footprint 矩形
   */
  private getFootprintRect(): Rect {
    return Collision.toRect(this.x, this.y, this.footprintWidth, this.footprintHeight);
  }

  /**
   * 检查玩家是否与障碍物碰撞
   */
  private checkCollision(rect: Rect): boolean {
    for (const obstacle of this.obstacles) {
      const obstacleRect = Collision.toRect(
        obstacle.x,
        obstacle.y,
        obstacle.footprintWidth,
        obstacle.footprintHeight
      );
      if (Collision.rectsIntersect(rect, obstacleRect)) {
        return true;
      }
    }
    return false;
  }

  /**
   * 带碰撞的移动（axis-separate，实现滑墙效果）
   * 核心函数：moveWithCollisions
   */
  private moveWithCollisions(dx: number, dy: number): void {
    const originalX = this.x;
    const originalY = this.y;

    // 先处理 x 方向移动
    if (dx !== 0) {
      this.x += dx * this.speed;
      const newRect = this.getFootprintRect();
      if (this.checkCollision(newRect)) {
        // 碰撞了，回退 x
        this.x = originalX;
      }
    }

    // 再处理 y 方向移动
    if (dy !== 0) {
      this.y += dy * this.speed;
      const newRect = this.getFootprintRect();
      if (this.checkCollision(newRect)) {
        // 碰撞了，回退 y
        this.y = originalY;
      }
    }

    // 限制在可走区域内
    this.clampPosition();
  }

  /**
   * 更新玩家位置
   */
  update(): void {
    let dx = 0;
    let dy = 0;

    if (this.keys.has('w')) dy -= 1;
    if (this.keys.has('s')) dy += 1;
    if (this.keys.has('a')) dx -= 1;
    if (this.keys.has('d')) dx += 1;

    // 归一化对角线移动速度
    if (dx !== 0 && dy !== 0) {
      dx *= 0.707;
      dy *= 0.707;
    }

    // 使用碰撞检测移动
    this.moveWithCollisions(dx, dy);
  }

  /**
   * 获取深度键（用于排序）- 按 y 值排序，越靠下越在前
   */
  getDepthKey(): number {
    return this.y;
  }

  /**
   * 调试绘制：绘制 footprint（碰撞盒）
   */
  debugDrawFootprint(ctx: CanvasRenderingContext2D, camera: Camera): void {
    const screenPos = camera.worldToScreen(this.x, this.y, this.z);

    ctx.save();
    ctx.fillStyle = 'rgba(0, 255, 0, 0.3)'; // 半透明绿色
    ctx.fillRect(
      screenPos.sx - this.footprintWidth / 2,
      screenPos.sy - this.footprintHeight / 2,
      this.footprintWidth,
      this.footprintHeight
    );
    ctx.strokeStyle = 'rgba(0, 255, 0, 0.8)';
    ctx.lineWidth = 1;
    ctx.strokeRect(
      screenPos.sx - this.footprintWidth / 2,
      screenPos.sy - this.footprintHeight / 2,
      this.footprintWidth,
      this.footprintHeight
    );
    ctx.restore();
  }

  /**
   * 渲染玩家
   */
  render(ctx: CanvasRenderingContext2D, camera: Camera): void {
    const screenPos = camera.worldToScreen(this.x, this.y, this.z);

    // 绘制阴影（椭圆）- 在脚下
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(
      screenPos.sx,
      screenPos.sy,
      12,
      6,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.restore();

    // 绘制玩家身体（矩形）
    ctx.save();
    ctx.fillStyle = '#4a90e2';
    ctx.fillRect(
      screenPos.sx - 8,
      screenPos.sy - 20,
      16,
      20
    );

    // 绘制玩家头部（小矩形）
    ctx.fillStyle = '#2e5c8a';
    ctx.fillRect(
      screenPos.sx - 6,
      screenPos.sy - 24,
      12,
      8
    );
    ctx.restore();
  }

  /**
   * 获取玩家位置
   */
  getPosition(): { x: number; y: number } {
    return { x: this.x, y: this.y };
  }

  /**
   * 受到伤害
   * @param amount 伤害值
   * @param extractionZone 撤离区域（可选，用于检查是否在区域内免伤）
   */
  takeDamage(amount: number, extractionZone?: { isPlayerInRange: (x: number, y: number) => boolean }): void {
    // 如果提供了撤离区域，检查是否在区域内（区域内免伤）
    if (extractionZone && extractionZone.isPlayerInRange(this.x, this.y)) {
      return; // 区域内免伤
    }
    
    // 正常扣血
    this.hp = Math.max(0, this.hp - amount);
  }

  /**
   * 检查是否死亡
   */
  isDead(): boolean {
    return this.hp <= 0;
  }

  /**
   * 重置玩家状态
   */
  reset(): void {
    this.hp = this.maxHp;
    this.keys.clear();
  }
}
