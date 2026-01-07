import { ResourceLoader } from './ResourceLoader';

/**
 * 图片资源加载器
 * 用于加载图片资源（预留，未来扩展）
 */
export class ImageResourceLoader implements ResourceLoader<HTMLImageElement> {
  getType(): string {
    return 'image';
  }

  /**
   * 加载图片资源
   * @param path 资源路径
   * @returns HTMLImageElement
   */
  async load(path: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`无法加载图片: ${path}`));
      img.src = path;
    });
  }

  /**
   * 检查资源是否存在
   * @param path 资源路径
   * @returns 是否存在
   */
  async exists(path: string): Promise<boolean> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = path;
    });
  }
}