import { ItemInstance } from './Item';

/**
 * 储物袋
 */
export class Bag {
  private safeCap: number = 2;
  private unsafeCap: number = 8;
  private safe: ItemInstance[] = [];
  private unsafe: ItemInstance[] = [];

  /**
   * 获取安全区已使用容量
   */
  usedSafe(): number {
    return this.safe.reduce((sum, item) => sum + item.size, 0);
  }

  /**
   * 获取普通区已使用容量
   */
  usedUnsafe(): number {
    return this.unsafe.reduce((sum, item) => sum + item.size, 0);
  }

  /**
   * 检查安全区是否可以添加物品
   */
  canAddSafe(item: ItemInstance): boolean {
    return this.usedSafe() + item.size <= this.safeCap;
  }

  /**
   * 检查普通区是否可以添加物品
   */
  canAddUnsafe(item: ItemInstance): boolean {
    return this.usedUnsafe() + item.size <= this.unsafeCap;
  }

  /**
   * 添加物品到安全区
   */
  addSafe(item: ItemInstance): boolean {
    if (this.canAddSafe(item)) {
      this.safe.push(item);
      return true;
    }
    return false;
  }

  /**
   * 添加物品到普通区
   */
  addUnsafe(item: ItemInstance): boolean {
    if (this.canAddUnsafe(item)) {
      this.unsafe.push(item);
      return true;
    }
    return false;
  }

  /**
   * 从安全区移除物品（按索引）
   */
  removeFromSafe(index: number): ItemInstance | null {
    if (index >= 0 && index < this.safe.length) {
      return this.safe.splice(index, 1)[0];
    }
    return null;
  }

  /**
   * 从普通区移除物品（按索引）
   */
  removeFromUnsafe(index: number): ItemInstance | null {
    if (index >= 0 && index < this.unsafe.length) {
      return this.unsafe.splice(index, 1)[0];
    }
    return null;
  }

  /**
   * 从普通区丢弃物品（按索引）
   */
  dropFromUnsafe(index: number): ItemInstance | null {
    return this.removeFromUnsafe(index);
  }

  /**
   * 从安全区丢弃物品（按索引）
   */
  dropFromSafe(index: number): ItemInstance | null {
    return this.removeFromSafe(index);
  }

  /**
   * 从普通区丢弃物品（按 id）
   */
  dropFromUnsafeById(id: string): ItemInstance | null {
    const index = this.unsafe.findIndex(item => item.id === id);
    if (index !== -1) {
      return this.unsafe.splice(index, 1)[0];
    }
    return null;
  }

  /**
   * 从安全区移动到普通区（按索引）
   */
  moveSafeToUnsafe(index: number): boolean {
    const item = this.removeFromSafe(index);
    if (item && this.canAddUnsafe(item)) {
      this.addUnsafe(item);
      return true;
    } else if (item) {
      // 如果普通区放不下，放回安全区
      this.safe.splice(index, 0, item);
      return false;
    }
    return false;
  }

  /**
   * 从普通区移动到安全区（按索引）
   */
  moveUnsafeToSafe(index: number): boolean {
    const item = this.removeFromUnsafe(index);
    if (item && this.canAddSafe(item)) {
      this.addSafe(item);
      return true;
    } else if (item) {
      // 如果安全区放不下，放回普通区
      this.unsafe.splice(index, 0, item);
      return false;
    }
    return false;
  }

  /**
   * 获取安全区物品列表
   */
  getSafeItems(): ItemInstance[] {
    return [...this.safe];
  }

  /**
   * 获取普通区物品列表
   */
  getUnsafeItems(): ItemInstance[] {
    return [...this.unsafe];
  }

  /**
   * 获取安全区容量
   */
  getSafeCap(): number {
    return this.safeCap;
  }

  /**
   * 获取普通区容量
   */
  getUnsafeCap(): number {
    return this.unsafeCap;
  }
}
