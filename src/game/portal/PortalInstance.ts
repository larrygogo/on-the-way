import { Camera } from '../Camera';
import { Renderable } from '../Renderable';
import { PortalTemplate } from '../PortalTemplate';
import { Point } from '../MapConfig';

/**
 * 传送门实例
 */
export class PortalInstance implements Renderable {
  public readonly portalId: string;
  public readonly templateId: string;
  public readonly fromMapId: string;
  public readonly toMapId: string;
  public readonly position: Point;
  public readonly radius: number;
  public readonly activationTime: number;
  public readonly costSpirit?: number;
  public readonly oneWay: boolean;
  public readonly hint?: string;
  public readonly cancelOnLeave: boolean;
  public readonly z: number = 0;

  constructor(
    portalId: string,
    fromMapId: string,
    toMapId: string,
    position: Point,
    template: PortalTemplate
  ) {
    this.portalId = portalId;
    this.templateId = template.templateId;
    this.fromMapId = fromMapId;
    this.toMapId = toMapId;
    this.position = position;
    this.radius = template.radius;
    this.activationTime = template.activationTime;
    this.costSpirit = template.costSpirit;
    this.oneWay = template.oneWay ?? false;
    this.hint = template.hint;
    this.cancelOnLeave = template.cancelOnLeave;
  }

  /**
   * 获取深度键（用于排序）
   */
  getDepthKey(): number {
    return this.position.y;
  }

  /**
   * 获取 x 坐标（兼容 Renderable）
   */
  get x(): number {
    return this.position.x;
  }

  /**
   * 获取 y 坐标（兼容 Renderable）
   */
  get y(): number {
    return this.position.y;
  }

  /**
   * 检查玩家是否在交互范围内
   */
  isPlayerInRange(playerX: number, playerY: number): boolean {
    const dx = this.position.x - playerX;
    const dy = this.position.y - playerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance <= this.radius;
  }

  /**
   * 渲染传送门（与撤离点区分：使用紫色/青色系）
   */
  render(ctx: CanvasRenderingContext2D, camera: Camera, isHighlighted: boolean = false): void {
    const screenPos = camera.worldToScreen(this.position.x, this.position.y, this.z);

    // 绘制传送门圈（扁平风格，紫色/青色系）
    ctx.save();
    
    // 外圈（半透明，紫色）
    ctx.strokeStyle = isHighlighted ? '#ff00ff' : '#9b59b6';
    ctx.lineWidth = isHighlighted ? 4 : 2;
    ctx.setLineDash([10, 5]);
    ctx.beginPath();
    ctx.arc(screenPos.sx, screenPos.sy, this.radius, 0, Math.PI * 2);
    ctx.stroke();
    
    // 内圈（实线，青色）
    ctx.setLineDash([]);
    ctx.strokeStyle = isHighlighted ? '#00ffff' : '#3498db';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(screenPos.sx, screenPos.sy, this.radius - 5, 0, Math.PI * 2);
    ctx.stroke();
    
    // 中心标记（紫色渐变）
    const gradient = ctx.createRadialGradient(
      screenPos.sx, screenPos.sy, 0,
      screenPos.sx, screenPos.sy, 8
    );
    gradient.addColorStop(0, isHighlighted ? '#ff00ff' : '#9b59b6');
    gradient.addColorStop(1, isHighlighted ? '#ff00ff' : '#6c3483');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(screenPos.sx, screenPos.sy, 8, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
  }
}

