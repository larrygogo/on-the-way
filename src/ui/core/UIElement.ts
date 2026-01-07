import { PointerEvent } from './PointerEvent';

/**
 * UI 元素基类
 */
export class UIElement {
  /** 父元素 */
  parent: UIElement | null = null;
  /** 子元素列表 */
  children: UIElement[] = [];

  /** X 坐标（设计分辨率空间） */
  x: number = 0;
  /** Y 坐标（设计分辨率空间） */
  y: number = 0;
  /** 宽度（设计分辨率空间） */
  width: number = 0;
  /** 高度（设计分辨率空间） */
  height: number = 0;
  /** 锚点（0-1，相对于父元素） */
  anchor: { x: number; y: number } = { x: 0, y: 0 };
  /** 轴心点（0-1，相对于自身） */
  pivot: { x: number; y: number } = { x: 0, y: 0 };
  /** 缩放 */
  scale: { x: number; y: number } = { x: 1, y: 1 };
  /** 是否可见 */
  visible: boolean = true;
  /** 透明度（0-1） */
  alpha: number = 1;

  /** 是否可交互 */
  interactive: boolean = false;
  /** Pointer 事件处理 */
  pointerEvents: 'auto' | 'none' = 'auto';

  /** 是否已挂载 */
  private _mounted: boolean = false;
  /** 是否已显示 */
  private _shown: boolean = true;

  /**
   * 添加子元素
   */
  addChild(child: UIElement): void {
    if (child.parent) {
      child.parent.removeChild(child);
    }
    child.parent = this;
    this.children.push(child);
    if (this._mounted && !child._mounted) {
      child.onMount();
    }
  }

  /**
   * 移除子元素
   */
  removeChild(child: UIElement): void {
    const index = this.children.indexOf(child);
    if (index >= 0) {
      this.children.splice(index, 1);
      child.parent = null;
      if (child._mounted) {
        child.onUnmount();
      }
    }
  }

  /**
   * 移除所有子元素
   */
  removeAllChildren(): void {
    const children = [...this.children];
    for (const child of children) {
      this.removeChild(child);
    }
  }

  /**
   * 将世界坐标转换为本地坐标
   * 简化版本：只考虑位置偏移，不考虑锚点和轴心点（因为当前没有使用）
   */
  worldToLocal(worldX: number, worldY: number): { x: number; y: number } {
    let x = worldX;
    let y = worldY;
    let element: UIElement | null = this;

    // 从当前元素开始一路向上，依次应用逆变换（位置、缩放）
    // 这样可以保证得到的坐标是相对于当前元素自身 (0,0) 的本地坐标
    while (element) {
      x -= element.x;
      y -= element.y;

      x /= element.scale.x;
      y /= element.scale.y;

      element = element.parent;
    }

    return { x, y };
  }

  /**
   * 将本地坐标转换为世界坐标
   * 简化版本：只考虑位置偏移，不考虑锚点和轴心点（因为当前没有使用）
   */
  localToWorld(localX: number, localY: number): { x: number; y: number } {
    let x = localX;
    let y = localY;
    let element: UIElement | null = this;

    // 从当前元素向上遍历到根节点
    while (element && element.parent) {
      // 应用缩放
      x *= element.scale.x;
      y *= element.scale.y;

      // 加上元素位置
      x += element.x;
      y += element.y;

      element = element.parent;
    }

    return { x, y };
  }

  /**
   * 检查点是否在元素内（本地坐标）
   */
  containsPoint(localX: number, localY: number): boolean {
    return (
      localX >= 0 &&
      localX <= this.width &&
      localY >= 0 &&
      localY <= this.height
    );
  }

  /**
   * 命中检测（世界坐标）
   * 从子元素末尾到开头遍历（后绘制优先）
   */
  hitTest(worldX: number, worldY: number): UIElement | null {
    if (!this.visible || this.alpha <= 0) {
      return null;
    }

    if (this.pointerEvents === 'none') {
      return null;
    }

    // 转换为本地坐标
    const local = this.worldToLocal(worldX, worldY);

    // 检查是否在元素内
    if (!this.containsPoint(local.x, local.y)) {
      return null;
    }
    
    // 调试：如果是按钮或面板，输出命中检测信息
    if (this.constructor.name === 'UIButton' || this.constructor.name === 'MainMenuPanel') {
      console.log(`[hitTest] ${this.constructor.name} 命中检测: 世界坐标(${worldX.toFixed(1)}, ${worldY.toFixed(1)}) -> 本地坐标(${local.x.toFixed(1)}, ${local.y.toFixed(1)}), 元素位置(${this.x.toFixed(1)}, ${this.y.toFixed(1)}), 尺寸(${this.width.toFixed(1)}, ${this.height.toFixed(1)}), 包含:${this.containsPoint(local.x, local.y)}`);
    }

    // 从后往前遍历子元素（后绘制优先）
    for (let i = this.children.length - 1; i >= 0; i--) {
      const child = this.children[i];
      const hit = child.hitTest(worldX, worldY);
      if (hit) {
        if (this.constructor.name === 'MainMenuPanel') {
          console.log(`[hitTest] MainMenuPanel 子元素 ${child.constructor.name} 命中`);
        }
        return hit;
      }
    }
    
    // 调试：如果是 MainMenuPanel 且没有子元素命中，输出子元素信息
    if (this.constructor.name === 'MainMenuPanel' && this.children.length > 0) {
      console.log(`[hitTest] MainMenuPanel 没有子元素命中，检查子元素:`);
      for (const child of this.children) {
        const childLocal = child.worldToLocal(worldX, worldY);
        const childWorldPos = child.localToWorld(0, 0);
        console.log(`  - 子元素 ${child.constructor.name}: 世界坐标(${worldX.toFixed(1)}, ${worldY.toFixed(1)}) -> 本地坐标(${childLocal.x.toFixed(1)}, ${childLocal.y.toFixed(1)}), 元素位置(${child.x.toFixed(1)}, ${child.y.toFixed(1)}), 元素世界位置(${childWorldPos.x.toFixed(1)}, ${childWorldPos.y.toFixed(1)}), 尺寸(${child.width.toFixed(1)}, ${child.height.toFixed(1)}), 可见:${child.visible}, 交互:${child.interactive}, 包含:${child.containsPoint(childLocal.x, childLocal.y)}`);
      }
    }

    // 如果没有子元素命中，且当前元素可交互，返回当前元素
    if (this.interactive) {
      return this;
    }

    return null;
  }

  /**
   * 处理 Pointer 事件
   */
  onPointerEvent(event: PointerEvent): void {
    // 子类可以重写此方法
  }

  /**
   * 挂载时调用
   */
  onMount(): void {
    this._mounted = true;
    for (const child of this.children) {
      if (!child._mounted) {
        child.onMount();
      }
    }
  }

  /**
   * 卸载时调用
   */
  onUnmount(): void {
    this._mounted = false;
    for (const child of this.children) {
      if (child._mounted) {
        child.onUnmount();
      }
    }
  }

  /**
   * 显示时调用
   */
  onShow(): void {
    this._shown = true;
    for (const child of this.children) {
      if (!child._shown) {
        child.onShow();
      }
    }
  }

  /**
   * 隐藏时调用
   */
  onHide(): void {
    this._shown = false;
    for (const child of this.children) {
      if (child._shown) {
        child.onHide();
      }
    }
  }

  /**
   * 更新（每帧调用）
   */
  update(dt: number): void {
    if (!this.visible) {
      return;
    }

    for (const child of this.children) {
      child.update(dt);
    }
  }

  /**
   * 渲染
   */
  render(ctx: CanvasRenderingContext2D): void {
    if (!this.visible || this.alpha <= 0) {
      return;
    }

    ctx.save();

    // 应用变换
    const worldPos = this.localToWorld(0, 0);
    const pivotOffsetX = this.width * this.pivot.x;
    const pivotOffsetY = this.height * this.pivot.y;

    ctx.translate(worldPos.x + pivotOffsetX, worldPos.y + pivotOffsetY);
    ctx.scale(this.scale.x, this.scale.y);
    ctx.translate(-pivotOffsetX, -pivotOffsetY);
    ctx.globalAlpha *= this.alpha;

    // 渲染子元素
    for (const child of this.children) {
      child.render(ctx);
    }

    ctx.restore();
  }
}
