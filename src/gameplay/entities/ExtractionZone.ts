import { Camera } from '../../engine/render/Camera';
import { Renderable } from '../../engine/render/Renderable';

/**
 * 撤离点
 */
export class ExtractionZone implements Renderable {
  public readonly id: string;
  public x: number;
  public y: number;
  public z: number = 0;
  public radius: number = 36;
  public channelSeconds: number = 15;
  public costAura: number = 100;

  constructor(x: number, y: number, channelSeconds: number = 15, costAura: number = 100) {
    this.id = `extraction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.x = x;
    this.y = y;
    this.channelSeconds = channelSeconds;
    this.costAura = costAura;
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
   * 渲染撤离点
   */
  render(ctx: CanvasRenderingContext2D, camera: Camera, isHighlighted: boolean = false): void {
    const screenPos = camera.worldToScreen(this.x, this.y, this.z);

    // 绘制撤离圈（扁平风格）
    ctx.save();
    
    // 外圈（半透明）
    ctx.strokeStyle = isHighlighted ? '#ffff00' : '#4a90e2';
    ctx.lineWidth = isHighlighted ? 4 : 2;
    ctx.setLineDash([10, 5]);
    ctx.beginPath();
    ctx.arc(screenPos.sx, screenPos.sy, this.radius, 0, Math.PI * 2);
    ctx.stroke();
    
    // 内圈（实线）
    ctx.setLineDash([]);
    ctx.strokeStyle = isHighlighted ? '#ffff00' : '#2e5c8a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(screenPos.sx, screenPos.sy, this.radius - 5, 0, Math.PI * 2);
    ctx.stroke();
    
    // 中心标记
    ctx.fillStyle = isHighlighted ? '#ffff00' : '#4a90e2';
    ctx.beginPath();
    ctx.arc(screenPos.sx, screenPos.sy, 8, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
  }
}

