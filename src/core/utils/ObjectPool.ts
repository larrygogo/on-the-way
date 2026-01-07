/**
 * 对象池
 * 用于重用对象，减少内存分配和垃圾回收
 */
export class ObjectPool<T> {
  private pool: T[] = [];
  private factory: () => T;
  private reset?: (obj: T) => void;
  private maxSize: number;

  /**
   * 创建对象池
   * @param factory 对象工厂函数
   * @param reset 对象重置函数（可选）
   * @param initialSize 初始池大小
   * @param maxSize 最大池大小
   */
  constructor(
    factory: () => T,
    reset?: (obj: T) => void,
    initialSize: number = 10,
    maxSize: number = 100
  ) {
    this.factory = factory;
    this.reset = reset;
    this.maxSize = maxSize;

    // 预创建初始对象
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(factory());
    }
  }

  /**
   * 从池中获取对象
   */
  acquire(): T {
    if (this.pool.length > 0) {
      return this.pool.pop()!;
    }
    // 池为空，创建新对象
    return this.factory();
  }

  /**
   * 将对象归还到池中
   * @param obj 要归还的对象
   */
  release(obj: T): void {
    if (this.pool.length >= this.maxSize) {
      // 池已满，丢弃对象
      return;
    }

    // 重置对象
    if (this.reset) {
      this.reset(obj);
    }

    this.pool.push(obj);
  }

  /**
   * 清空对象池
   */
  clear(): void {
    this.pool = [];
  }

  /**
   * 获取池中对象数量
   */
  getSize(): number {
    return this.pool.length;
  }

  /**
   * 预分配对象
   * @param count 要预分配的对象数量
   */
  preallocate(count: number): void {
    const toAdd = Math.min(count, this.maxSize - this.pool.length);
    for (let i = 0; i < toAdd; i++) {
      this.pool.push(this.factory());
    }
  }
}