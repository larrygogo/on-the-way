import { UIElement } from './UIElement';
import { UILayer } from './UILayer';
import { UIPanel } from './UIPanel';
import { PointerEvent } from './PointerEvent';
import { Layout, LayoutState, SafeInsets } from './Layout';

/**
 * UI 管理器配置
 */
export interface UIManagerConfig {
  designW?: number;
  designH?: number;
}

/**
 * UI 管理器
 */
export class UIManager {
  /** 根节点 */
  root: UIElement;
  /** 各层级 */
  layers: {
    hud: UILayer;
    ui: UILayer;
    modal: UILayer;
    toast: UILayer;
    debug: UILayer;
  };
  /** 面板栈 */
  panelStack: UIPanel[] = [];
  /** 布局计算器 */
  layout: Layout;
  /** 布局状态 */
  layoutState: LayoutState;

  constructor(config: UIManagerConfig = {}) {
    const designW = config.designW ?? 1280;
    const designH = config.designH ?? 720;

    // 创建根节点
    this.root = new UIElement();
    this.root.width = designW;
    this.root.height = designH;

    // 创建各层级（按 zIndex 排序）
    this.layers = {
      hud: new UILayer('hud', 0),
      ui: new UILayer('ui', 100),
      modal: new UILayer('modal', 200),
      toast: new UILayer('toast', 300),
      debug: new UILayer('debug', 400),
    };

    // 设置层级属性
    this.layers.modal.blockInputBelow = true;

    // 将层级添加到根节点
    this.root.addChild(this.layers.hud);
    this.root.addChild(this.layers.ui);
    this.root.addChild(this.layers.modal);
    this.root.addChild(this.layers.toast);
    this.root.addChild(this.layers.debug);

    // 初始化布局
    this.layout = new Layout(designW, designH);
    this.layoutState = this.layout.getState();

    // 挂载根节点
    this.root.onMount();
  }

  /**
   * 更新布局
   */
  resize(screenW: number, screenH: number, dpr: number, safeInsets: SafeInsets): void {
    this.layout.update(screenW, screenH, dpr, safeInsets);
    this.layoutState = this.layout.getState();
    
    // 更新根节点尺寸
    this.root.width = this.layoutState.designW;
    this.root.height = this.layoutState.designH;
    
    // 更新各层级尺寸
    for (const layer of Object.values(this.layers)) {
      layer.width = this.layoutState.designW;
      layer.height = this.layoutState.designH;
    }
  }

  /**
   * 更新（每帧调用）
   */
  update(dt: number): void {
    this.root.update(dt);
  }

  /**
   * 渲染
   */
  render(ctx: CanvasRenderingContext2D): void {
    // 应用布局缩放和偏移
    const { viewportRect, scale } = this.layoutState;
    
    ctx.save();
    ctx.scale(scale, scale);
    ctx.translate(-viewportRect.x, -viewportRect.y);
    
    // 渲染根节点（会按 zIndex 渲染各层级）
    this.root.render(ctx);
    
    ctx.restore();
  }

  /**
   * 打开面板
   */
  open(panel: UIPanel, options?: { layer?: 'ui' | 'modal' }): void {
    const layer = options?.layer ?? (panel instanceof UIPanel ? 'ui' : 'ui');
    const targetLayer = this.layers[layer];

    // 如果面板已在栈中，先移除
    const index = this.panelStack.indexOf(panel);
    if (index >= 0) {
      this.panelStack.splice(index, 1);
      targetLayer.removeChild(panel);
    }

    // 添加到对应层级
    targetLayer.addChild(panel);
    
    // 推入栈
    this.panelStack.push(panel);
    
    // 打开面板
    panel.open();
  }

  /**
   * 关闭面板
   */
  close(panel: UIPanel): void {
    const index = this.panelStack.indexOf(panel);
    if (index < 0) {
      return;
    }

    // 从栈中移除
    this.panelStack.splice(index, 1);
    
    // 从层级中移除
    for (const layer of Object.values(this.layers)) {
      if (layer.children.includes(panel)) {
        layer.removeChild(panel);
        break;
      }
    }
    
    // 关闭面板
    panel.close();
  }

  /**
   * 关闭最顶层面板
   */
  closeTop(): void {
    if (this.panelStack.length > 0) {
      const topPanel = this.panelStack[this.panelStack.length - 1];
      this.close(topPanel);
    }
  }

  /**
   * 检查是否有打开的面板
   */
  hasOpenPanels(): boolean {
    return this.panelStack.length > 0;
  }

  /**
   * 派发 Pointer 事件
   */
  dispatchPointer(event: PointerEvent): void {
    console.log(`[UIManager] dispatchPointer 被调用，事件类型: ${event.type}, 坐标: (${event.x.toFixed(1)}, ${event.y.toFixed(1)})`);
    
    // 按 zIndex 从高到低遍历层级
    const layerOrder = [
      this.layers.debug,
      this.layers.toast,
      this.layers.modal,
      this.layers.ui,
      this.layers.hud,
    ];

    for (const layer of layerOrder) {
      console.log(`[UIManager] 检查层级 ${layer.name}: enabled=${layer.enabled}, visible=${layer.visible}, children=${layer.children.length}`);
      
      if (!layer.enabled || !layer.visible) {
        console.log(`[UIManager] 层级 ${layer.name} 被跳过（enabled=${layer.enabled}, visible=${layer.visible}）`);
        continue;
      }

      // 命中检测
      const hit = layer.hitTest(event.x, event.y);
      if (hit) {
        console.log(`[UIManager] Layer ${layer.name} 命中元素:`, hit.constructor.name, '事件坐标:', event.x, event.y);
        // 调用命中元素的处理函数
        hit.onPointerEvent(event);
        
        // 如果事件被消费，停止传播
        if (event.consumed) {
          return;
        }
        
        // 如果层级阻止下层输入，且命中了元素，停止传播
        if (layer.blockInputBelow) {
          return;
        }
      } else if (layer.children.length > 0 && event.type === 'down') {
        // 调试：如果没有命中但有子元素，输出调试信息
        console.log(`[UIManager] Layer ${layer.name} 有 ${layer.children.length} 个子元素，但未命中。事件坐标: (${event.x}, ${event.y})`);
        // 输出子元素信息
        for (const child of layer.children) {
          const childLocal = child.worldToLocal(event.x, event.y);
          console.log(`  - 子元素 ${child.constructor.name}: 世界坐标(${event.x}, ${event.y}) -> 本地坐标(${childLocal.x.toFixed(1)}, ${childLocal.y.toFixed(1)}), 元素位置(${child.x.toFixed(1)}, ${child.y.toFixed(1)}), 尺寸(${child.width.toFixed(1)}, ${child.height.toFixed(1)}), 可见:${child.visible}, 交互:${child.interactive}`);
        }
      }
    }
  }

  /**
   * 获取布局状态
   */
  getLayoutState(): LayoutState {
    return this.layoutState;
  }

  /**
   * 将 Canvas 坐标转换为设计分辨率空间坐标
   */
  toDesignSpace(canvasX: number, canvasY: number): { x: number; y: number } {
    return this.layout.toDesignSpace(canvasX, canvasY);
  }
}
