import { Camera } from './Camera';
import { Renderable } from './Renderable';

/**
 * 可调试绘制的接口
 */
export interface DebugDrawable {
  debugDrawFootprint(ctx: CanvasRenderingContext2D, camera: Camera): void;
}

/**
 * 渲染器
 * 管理 Canvas 上下文和 DPR 自适应，提供深度排序渲染接口
 */
export class Renderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private dpr: number = 1;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('无法获取 Canvas 2D 上下文');
    }
    this.ctx = context;
    this.setupDPR();
  }

  /**
   * 设置 DPR 自适应
   */
  private setupDPR(): void {
    this.dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    
    // 设置实际渲染尺寸
    this.canvas.width = rect.width * this.dpr;
    this.canvas.height = rect.height * this.dpr;
    
    // 缩放上下文以匹配 DPR
    this.ctx.scale(this.dpr, this.dpr);
    
    // 设置样式尺寸
    this.canvas.style.width = `${rect.width}px`;
    this.canvas.style.height = `${rect.height}px`;
  }

  /**
   * 处理窗口大小变化
   */
  handleResize(): void {
    this.setupDPR();
  }

  /**
   * 清空画布并填充背景色
   */
  clear(): void {
    const rect = this.canvas.getBoundingClientRect();
    // 填充背景色
    this.ctx.fillStyle = '#1a1a1a';
    this.ctx.fillRect(0, 0, rect.width, rect.height);
  }

  /**
   * 获取屏幕中心位置（考虑 DPR）
   */
  getScreenCenter(): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: rect.width / 2,
      y: rect.height / 2
    };
  }

  /**
   * 渲染可渲染对象数组（按 y + sortOffset 排序，越靠下越在前）
   * 关键函数：sortRenderItems
   */
  render(renderables: Renderable[], camera: Camera, _debugDraw: boolean = false): void {
    // 按深度键排序（从小到大，y + sortOffset 值小的先绘制，值大的后绘制，实现遮挡）
    // 核心函数：sortRenderItems
    const sorted = [...renderables].sort((a, b) => a.getDepthKey() - b.getDepthKey());

    // 清空画布
    this.clear();

    // 依次渲染
    for (const renderable of sorted) {
      renderable.render(this.ctx, camera);
    }
  }

  /**
   * 调试绘制：绘制所有实体的 footprint
   */
  debugDrawFootprints(player: DebugDrawable, obstacles: DebugDrawable[], camera: Camera): void {
    // 绘制玩家 footprint
    player.debugDrawFootprint(this.ctx, camera);
    
    // 绘制障碍物 footprint
    for (const obstacle of obstacles) {
      obstacle.debugDrawFootprint(this.ctx, camera);
    }
  }

  /**
   * 获取 Canvas 上下文
   */
  getContext(): CanvasRenderingContext2D {
    return this.ctx;
  }

  /**
   * 获取 Canvas 元素
   */
  getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }
}
