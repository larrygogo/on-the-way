/**
 * 资源加载器接口
 * 所有资源加载器必须实现此接口
 */
export interface ResourceLoader<T = any> {
  /**
   * 加载资源
   * @param path 资源路径
   * @returns 资源数据
   */
  load(path: string): Promise<T>;

  /**
   * 检查资源是否存在
   * @param path 资源路径
   * @returns 是否存在
   */
  exists(path: string): Promise<boolean>;

  /**
   * 获取资源类型
   */
  getType(): string;
}