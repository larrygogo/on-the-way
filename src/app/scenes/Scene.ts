/**
 * 场景接口
 * 所有场景必须实现此接口
 */
export interface Scene {
  /**
   * 场景名称
   */
  readonly name: string;

  /**
   * 初始化场景
   */
  init(): Promise<void> | void;

  /**
   * 更新场景
   * @param deltaTime 帧时间差（秒）
   */
  update(deltaTime: number): void;

  /**
   * 渲染场景
   * @param ctx Canvas 2D 上下文
   */
  render(ctx: CanvasRenderingContext2D): void;

  /**
   * 销毁场景（清理资源）
   */
  destroy(): void;

  /**
   * 场景暂停
   */
  pause?(): void;

  /**
   * 场景恢复
   */
  resume?(): void;
}