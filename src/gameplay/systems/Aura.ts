/**
 * 灵气系统
 */
export class Aura {
  private current: number = 0;
  private cap: number = 200;

  /**
   * 获取当前灵气值
   */
  getCurrent(): number {
    return this.current;
  }

  /**
   * 获取灵气上限
   */
  getCap(): number {
    return this.cap;
  }

  /**
   * 添加灵气（clamp 到 cap）
   */
  addAura(amount: number): void {
    this.current = Math.min(this.current + amount, this.cap);
  }

  /**
   * 检查是否可以消耗灵气
   */
  canSpendAura(cost: number): boolean {
    return this.current >= cost;
  }

  /**
   * 消耗灵气
   */
  spendAura(cost: number): boolean {
    if (this.canSpendAura(cost)) {
      this.current -= cost;
      return true;
    }
    return false;
  }

  /**
   * 设置当前灵气值（用于地图切换时恢复状态）
   */
  setCurrent(value: number): void {
    this.current = Math.max(0, Math.min(value, this.cap));
  }
}

