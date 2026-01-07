import { Camera } from '../../engine/render/Camera';
import { Renderable } from '../../engine/render/Renderable';

/**
 * 灵气点（地图对象）
 */
export class AuraNode implements Renderable {
  public readonly id: string;
  public x: number;
  public y: number;
  public z: number = 0;
  public collectSeconds: number = 2.0;
  public gainAmount: number = 20;
  public radius: number = 28;

  constructor(x: number, y: number, collectSeconds: number = 2.0, gainAmount: number = 20) {
    this.id = `auranode_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.x = x;
    this.y = y;
    this.collectSeconds = collectSeconds;
    this.gainAmount = gainAmount;
  }

  /**
   * 获取深度键（用于排序）
   */
  getDepthKey(): number {
    return this.y;
  }

  /**
   * 检查玩家是否在交互范围内
   */
  isPlayerInRange(playerX: number, playerY: number): boolean {
    const dx = this.x - playerX;
    const dy = this.y - playerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance <= this.radius;
  }

  /**
   * 渲染灵气点（符合 Renderable 接口）
   */
  render(ctx: CanvasRenderingContext2D, camera: Camera): void {
    this.renderWithHighlight(ctx, camera, false);
  }

  /**
   * 渲染灵气点（带高亮选项）
   */
  renderWithHighlight(ctx: CanvasRenderingContext2D, camera: Camera, isHighlighted: boolean = false): void {
    const screenPos = camera.worldToScreen(this.x, this.y, this.z);

    // 绘制阴影
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.beginPath();
    ctx.ellipse(
      screenPos.sx,
      screenPos.sy,
      10,
      5,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.restore();

    // 绘制能量点（扁平风格）
    ctx.save();
    if (isHighlighted) {
      // 高亮描边
      ctx.strokeStyle = '#ffff00';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(screenPos.sx, screenPos.sy - 8, 12, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 能量点主体（蓝色渐变）
    const gradient = ctx.createRadialGradient(
      screenPos.sx,
      screenPos.sy - 8,
      0,
      screenPos.sx,
      screenPos.sy - 8,
      10
    );
    gradient.addColorStop(0, '#4a90e2');
    gradient.addColorStop(1, '#2e5c8a');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(screenPos.sx, screenPos.sy - 8, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

