import { Camera } from './Camera';
import { Renderable } from './Renderable';

/**
 * 干扰实体（扰动怪/扰动球）
 */
export class Interference implements Renderable {
  public readonly id: string;
  public x: number;
  public y: number;
  public z: number = 0;
  public radius: number = 12;
  public speed: number = 1.5;
  public damage: number = 10;
  private targetX: number;
  private targetY: number;

  constructor(x: number, y: number, targetX: number, targetY: number) {
    this.id = `interference_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.x = x;
    this.y = y;
    this.targetX = targetX;
    this.targetY = targetY;
  }

  /**
   * 获取深度键（用于排序）
   */
  getDepthKey(): number {
    return this.y;
  }

  /**
   * 更新位置（向目标移动）
   */
  update(): void {
    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 0.1) {
      this.x += (dx / distance) * this.speed;
      this.y += (dy / distance) * this.speed;
    }
  }

  /**
   * 检查是否与玩家碰撞
   */
  checkCollision(playerX: number, playerY: number, playerRadius: number = 8): boolean {
    const dx = this.x - playerX;
    const dy = this.y - playerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < (this.radius + playerRadius);
  }

  /**
   * 渲染干扰实体
   */
  render(ctx: CanvasRenderingContext2D, camera: Camera): void {
    const screenPos = camera.worldToScreen(this.x, this.y, this.z);

    // 绘制阴影
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(
      screenPos.sx,
      screenPos.sy,
      this.radius,
      this.radius / 2,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.restore();

    // 绘制干扰实体（红色球体）
    ctx.save();
    const gradient = ctx.createRadialGradient(
      screenPos.sx,
      screenPos.sy - 4,
      0,
      screenPos.sx,
      screenPos.sy - 4,
      this.radius
    );
    gradient.addColorStop(0, '#ff4444');
    gradient.addColorStop(1, '#cc0000');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(screenPos.sx, screenPos.sy - 4, this.radius, 0, Math.PI * 2);
    ctx.fill();
    
    // 描边
    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }
}
