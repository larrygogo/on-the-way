import { UIModal } from '../core/UIModal';
import { UIButton } from '../components/UIButton';
import { UIText } from '../components/UIText';
import { UIElement } from '../core/UIElement';
import { PointerEvent } from '../core/PointerEvent';
import { Bag } from '../../gameplay/systems/Bag';
import { Aura } from '../../gameplay/systems/Aura';
import { ItemInstance } from '../../gameplay/entities/Item';
import { LayoutState } from '../core/Layout';

/**
 * 背包面板（第一版）
 * 仅实现基本显示和格子点击
 */
export class InventoryPanel extends UIModal {
  private bag: Bag | null = null;
  private aura: Aura | null = null;
  private onCloseCallback?: () => void;
  private onItemClickCallback?: (area: 'safe' | 'unsafe', index: number) => void;
  private layoutState: LayoutState | null = null;

  private titleText: UIText;
  private closeButton: UIButton;
  private safeAreaGrid: UIElement;
  private unsafeAreaGrid: UIElement;

  constructor() {
    super('inventory');

    // 先设置默认尺寸和位置
    this.width = 800;
    this.height = 500;
    this.x = (1280 - this.width) / 2;
    this.y = (720 - this.height) / 2;

    // 创建标题
    this.titleText = new UIText('背包');
    this.titleText.fontSize = 24;
    this.titleText.color = '#ffffff';
    this.titleText.align = 'center';
    this.titleText.baseline = 'top';
    this.titleText.width = this.width;
    this.titleText.height = 30;
    this.titleText.x = 0;
    this.titleText.y = 20;
    this.addChild(this.titleText);

    // 创建关闭按钮
    this.closeButton = new UIButton('关闭');
    this.closeButton.width = 100;
    this.closeButton.height = 40;
    this.closeButton.x = this.width - this.closeButton.width - 20;
    this.closeButton.y = 20;
    this.closeButton.onClick = () => {
      this.onCloseCallback?.();
      this.close();
    };
    this.addChild(this.closeButton);

    // 创建安全区网格
    this.safeAreaGrid = new UIElement();
    this.safeAreaGrid.x = 20;
    this.safeAreaGrid.y = 70;
    this.safeAreaGrid.width = 360;
    this.safeAreaGrid.height = 400;
    this.addChild(this.safeAreaGrid);

    // 创建普通区网格
    this.unsafeAreaGrid = new UIElement();
    this.unsafeAreaGrid.x = 420;
    this.unsafeAreaGrid.y = 70;
    this.unsafeAreaGrid.width = 360;
    this.unsafeAreaGrid.height = 400;
    this.addChild(this.unsafeAreaGrid);

    // 现在可以安全地调用updateLayout（所有元素都已创建）
    this.updateLayout({
      designW: 1280,
      designH: 720,
      screenW: 1280,
      screenH: 720,
      dpr: 1,
      safeInsets: { top: 0, right: 0, bottom: 0, left: 0 },
      scale: 1,
      viewportRect: { x: 0, y: 0, width: 1280, height: 720 },
      safeRect: { x: 0, y: 0, width: 1280, height: 720 }
    });
  }

  /**
   * 设置数据
   */
  setData(bag: Bag, aura: Aura): void {
    this.bag = bag;
    this.aura = aura;
    this.updateGrids();
  }

  /**
   * 设置关闭回调
   */
  setOnClose(callback: () => void): void {
    this.onCloseCallback = callback;
  }

  /**
   * 设置物品点击回调
   */
  setOnItemClick(callback: (area: 'safe' | 'unsafe', index: number) => void): void {
    this.onItemClickCallback = callback;
  }

  /**
   * 更新网格显示
   */
  private updateGrids(): void {
    if (!this.bag) {
      return;
    }

    // 清空现有格子
    this.safeAreaGrid.removeAllChildren();
    this.unsafeAreaGrid.removeAllChildren();

    const isMobile = this.isMobile();

    // 绘制安全区
    const safeItems = this.bag.getSafeItems();
    const safeCap = this.bag.getSafeCap();
    const gridCols = 2;
    const gridRows = Math.ceil(safeCap / gridCols);
    const gridPadding = isMobile ? 5 : 10;
    const cellSpacing = isMobile ? 4 : 10;
    const availableWidth = Math.max(0, this.safeAreaGrid.width - gridPadding * 2);
    const cellWidth = Math.max(60, (availableWidth - cellSpacing * (gridCols - 1)) / gridCols);
    const cellHeight = isMobile ? 35 : 50;

    for (let i = 0; i < safeCap; i++) {
      const col = i % gridCols;
      const row = Math.floor(i / gridCols);
      const x = gridPadding + col * (cellWidth + cellSpacing);
      const y = row * (cellHeight + cellSpacing);

      const cell = new InventoryCell('safe', i, safeItems[i] || null);
      cell.x = x;
      cell.y = y;
      cell.width = cellWidth;
      cell.height = cellHeight;
      cell.onClick = () => {
        this.onItemClickCallback?.('safe', i);
      };
      this.safeAreaGrid.addChild(cell);
    }

    // 绘制普通区
    const unsafeItems = this.bag.getUnsafeItems();
    const unsafeCap = this.bag.getUnsafeCap();
    
    // 手机模式下根据可用宽度动态计算列数，确保不溢出
    let unsafeGridCols: number;
    if (isMobile) {
      const unsafeGridPadding = 5;
      const unsafeCellSpacing = 4;
      const unsafeAvailableWidth = Math.max(0, this.unsafeAreaGrid.width - unsafeGridPadding * 2);
      const minCellWidth = 50; // 手机模式下最小格子宽度
      // 计算最多能放几列
      const maxCols = Math.floor((unsafeAvailableWidth + unsafeCellSpacing) / (minCellWidth + unsafeCellSpacing));
      unsafeGridCols = Math.max(2, Math.min(maxCols, 4)); // 最少2列，最多4列
    } else {
      unsafeGridCols = 4;
    }
    
    const unsafeGridRows = Math.ceil(unsafeCap / unsafeGridCols);
    const unsafeGridPadding = isMobile ? 5 : 10;
    const unsafeCellSpacing = isMobile ? 4 : 10;
    const unsafeAvailableWidth = Math.max(0, this.unsafeAreaGrid.width - unsafeGridPadding * 2);
    const unsafeCellWidth = Math.max(isMobile ? 50 : 40, (unsafeAvailableWidth - unsafeCellSpacing * (unsafeGridCols - 1)) / unsafeGridCols);
    const unsafeCellHeight = isMobile ? unsafeCellWidth : 80;

    for (let i = 0; i < unsafeCap; i++) {
      const col = i % unsafeGridCols;
      const row = Math.floor(i / unsafeGridCols);
      const x = unsafeGridPadding + col * (unsafeCellWidth + unsafeCellSpacing);
      const y = row * (unsafeCellHeight + unsafeCellSpacing);

      const cell = new InventoryCell('unsafe', i, unsafeItems[i] || null);
      cell.x = x;
      cell.y = y;
      cell.width = unsafeCellWidth;
      cell.height = unsafeCellHeight;
      cell.onClick = () => {
        this.onItemClickCallback?.('unsafe', i);
      };
      this.unsafeAreaGrid.addChild(cell);
    }
  }

  /**
   * 更新布局（响应式）
   */
  updateLayout(layoutState: LayoutState): void {
    this.layoutState = layoutState;
    const isMobile = this.isMobile();
    
    if (isMobile) {
      // 移动端：使用垂直堆叠布局，确保不溢出
      const viewportRect = layoutState.viewportRect;
      const safeRect = layoutState.safeRect;
      
      // 严格限制：使用 viewportRect 的实际可用宽度
      const padding = 10; // 增加边距以确保不溢出
      const maxAvailableWidth = Math.max(0, viewportRect.width - padding * 2);
      const maxAvailableHeight = Math.max(0, viewportRect.height - padding * 2);
      
      // 移动端：宽度使用屏幕的 90%，确保留出足够边距
      const maxWidth = Math.min(maxAvailableWidth, viewportRect.width * 0.9);
      this.width = Math.max(200, Math.min(maxWidth, maxAvailableWidth)); // 最小宽度 200
      
      // 最终确保宽度不超过可用宽度
      this.width = Math.min(this.width, maxAvailableWidth);
      
      // 计算所需高度：标题(50) + 安全区(120) + 间距(10) + 普通区(200) + 按钮(50) + 边距(20)
      const headerHeight = 50;
      const safeAreaHeight = 120;
      const spacing = 10;
      const unsafeAreaHeight = 200;
      const buttonAreaHeight = 50;
      const verticalPadding = 20;
      const calculatedHeight = headerHeight + safeAreaHeight + spacing + unsafeAreaHeight + buttonAreaHeight + verticalPadding;
      const maxHeight = Math.min(maxAvailableHeight, viewportRect.height * 0.9);
      this.height = Math.max(calculatedHeight, Math.min(maxHeight, maxAvailableHeight));
      
      // 确保面板完全在 viewportRect 内
      const minX = viewportRect.x + padding;
      const maxX = viewportRect.x + viewportRect.width - this.width - padding;
      const centerX = safeRect.x + (safeRect.width - this.width) / 2;
      this.x = Math.max(minX, Math.min(maxX, centerX));
      
      const minY = viewportRect.y + padding;
      const maxY = viewportRect.y + viewportRect.height - this.height - padding;
      const centerY = safeRect.y + (safeRect.height - this.height) / 2;
      this.y = Math.max(minY, Math.min(maxY, centerY));
      
      // 最终检查：确保 x + width 不超过 viewportRect 右边界
      if (this.x + this.width > viewportRect.x + viewportRect.width - padding) {
        this.width = Math.max(200, viewportRect.x + viewportRect.width - padding - this.x);
      }
      // 确保 x 不小于 viewportRect 左边界
      if (this.x < viewportRect.x + padding) {
        this.x = viewportRect.x + padding;
        // 重新调整宽度
        if (this.x + this.width > viewportRect.x + viewportRect.width - padding) {
          this.width = Math.max(200, viewportRect.x + viewportRect.width - padding - this.x);
        }
      }
      
      // 移动端：垂直堆叠布局
      const gridPadding = 5;
      const gridSpacing = 10;
      // 确保网格宽度不超过面板宽度，并留出足够的边距
      const availableGridWidth = Math.max(0, this.width - gridPadding * 2);
      
      // 安全区网格（上方，全宽）
      this.safeAreaGrid.x = gridPadding;
      this.safeAreaGrid.y = headerHeight;
      this.safeAreaGrid.width = Math.max(0, Math.min(availableGridWidth, this.width - gridPadding * 2));
      this.safeAreaGrid.height = safeAreaHeight;
      
      // 普通区网格（下方，全宽）
      this.unsafeAreaGrid.x = gridPadding;
      this.unsafeAreaGrid.y = headerHeight + safeAreaHeight + gridSpacing;
      this.unsafeAreaGrid.width = Math.max(0, Math.min(availableGridWidth, this.width - gridPadding * 2));
      this.unsafeAreaGrid.height = unsafeAreaHeight;
    } else {
      // 桌面端：使用原始布局
      this.width = 800;
      this.height = 500;
      this.x = (layoutState.designW - this.width) / 2;
      this.y = (layoutState.designH - this.height) / 2;
      
      // 安全区网格
      this.safeAreaGrid.x = 20;
      this.safeAreaGrid.y = 70;
      this.safeAreaGrid.width = 360;
      this.safeAreaGrid.height = 400;
      
      // 普通区网格
      this.unsafeAreaGrid.x = 420;
      this.unsafeAreaGrid.y = 70;
      this.unsafeAreaGrid.width = 360;
      this.unsafeAreaGrid.height = 400;
    }
    
    // 更新标题和按钮位置
    this.titleText.width = this.width;
    if (isMobile) {
      // 移动端：减小标题字体和按钮尺寸
      this.titleText.fontSize = 20;
      this.closeButton.width = 80;
      this.closeButton.height = 35;
      this.closeButton.x = this.width - this.closeButton.width - 10;
      this.closeButton.y = 15;
      this.titleText.y = 15;
    } else {
      this.titleText.fontSize = 24;
      this.closeButton.width = 100;
      this.closeButton.height = 40;
      this.closeButton.x = this.width - this.closeButton.width - 20;
      this.closeButton.y = 20;
      this.titleText.y = 20;
    }
    
    // 更新遮罩尺寸
    if (this['mask']) {
      this['mask'].width = layoutState.designW;
      this['mask'].height = layoutState.designH;
    }
    
    // 重新更新网格（使用新的尺寸）
    if (this.bag) {
      this.updateGrids();
    }
  }

  /**
   * 检测是否为移动端
   */
  private isMobile(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           (window.innerWidth <= 768);
  }

  /**
   * 打开时更新
   */
  override onOpen(): void {
    super.onOpen();
    this.updateGrids();
  }
}

/**
 * 背包格子元素
 */
class InventoryCell extends UIElement {
  private area: 'safe' | 'unsafe';
  private index: number;
  private item: ItemInstance | null;
  public onClick?: () => void;

  constructor(area: 'safe' | 'unsafe', index: number, item: ItemInstance | null) {
    super();
    this.area = area;
    this.index = index;
    this.item = item;
    this.interactive = true;
  }

  /**
   * 处理 Pointer 事件
   */
  override onPointerEvent(event: PointerEvent): void {
    if (event.type === 'up') {
      this.onClick?.();
      event.consumed = true;
    }
  }

  /**
   * 渲染
   */
  override render(ctx: CanvasRenderingContext2D): void {
    if (!this.visible || this.alpha <= 0) {
      return;
    }

    ctx.save();

    // 应用变换
    const worldPos = this.localToWorld(0, 0);
    ctx.translate(worldPos.x, worldPos.y);
    ctx.globalAlpha *= this.alpha;

    // 绘制格子背景
    if (this.item) {
      ctx.fillStyle = '#4a90e2';
    } else {
      ctx.fillStyle = '#2a2a2a';
    }
    ctx.fillRect(0, 0, this.width, this.height);

    // 绘制边框
    ctx.strokeStyle = '#666666';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, this.width, this.height);

    // 绘制物品信息
    if (this.item) {
      ctx.fillStyle = '#ffffff';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const text = this.item.name;
      const maxWidth = this.width - 4;
      if (ctx.measureText(text).width > maxWidth) {
        // 文字太长，截断
        let truncated = text;
        while (ctx.measureText(truncated + '...').width > maxWidth && truncated.length > 0) {
          truncated = truncated.slice(0, -1);
        }
        ctx.fillText(truncated + '...', this.width / 2, this.height / 2);
      } else {
        ctx.fillText(text, this.width / 2, this.height / 2);
      }
    }

    ctx.restore();

    // 渲染子元素
    super.render(ctx);
  }
}
