import { Camera } from './Camera';

/**
 * 可渲染接口
 * 所有需要在屏幕上渲染的对象都应实现此接口
 */
export interface Renderable {
  /**
   * 获取深度键，用于排序渲染顺序
   * 按 y 值排序：值越小越先渲染（在后面），值越大越后渲染（在前面）
   * 实现遮挡效果：越靠下（y 值大）的实体越在前
   */
  getDepthKey(): number;

  /**
   * 渲染对象
   * @param ctx Canvas 2D 上下文
   * @param camera 相机系统
   */
  render(ctx: CanvasRenderingContext2D, camera: Camera): void;
}
