import { ResourceLoader } from './ResourceLoader';

/**
 * JSON 资源加载器
 * 用于加载 JSON 格式的配置文件
 */
export class JsonResourceLoader implements ResourceLoader<any> {
  getType(): string {
    return 'json';
  }

  /**
   * 加载 JSON 资源
   * @param path 资源路径（相对于 public 目录）
   * @returns 解析后的 JSON 对象
   */
  async load(path: string): Promise<any> {
    try {
      const response = await fetch(path);
      
      if (!response.ok) {
        throw new Error(`无法加载资源: ${path} (HTTP ${response.status})`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      if (error instanceof Error) {
        console.error(`[JsonResourceLoader] 加载失败: ${error.message}`);
        throw error;
      }
      throw new Error(`[JsonResourceLoader] 未知错误: ${String(error)}`);
    }
  }

  /**
   * 检查资源是否存在
   * @param path 资源路径
   * @returns 是否存在
   */
  async exists(path: string): Promise<boolean> {
    try {
      const response = await fetch(path, { method: 'HEAD' });
      return response.ok;
    } catch {
      return false;
    }
  }
}