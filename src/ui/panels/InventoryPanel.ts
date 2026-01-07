import { UIModal } from '../core/UIModal';
import { UIButton } from '../components/UIButton';
import { UIText } from '../components/UIText';
import { UIElement } from '../core/UIElement';
import { PointerEvent } from '../core/PointerEvent';
import { Bag } from '../../gameplay/systems/Bag';
import { Aura } from '../../gameplay/systems/Aura';
import { ItemInstance } from '../../gameplay/entities/Item';

/**
 * 背包面板（第一版）
 * 仅实现基本显示和格子点击
 */
export class InventoryPanel extends UIModal {
  private bag: Bag | null = null;
  private aura: Aura | null = null;
  private onCloseCallback?: () => void;
  private onItemClickCallback?: (area: 'safe' | 'unsafe', index: number) => void;

  private titleText: UIText;
  private closeButton: UIButton;
  private safeAreaGrid: UIElement;
  private unsafeAreaGrid: UIElement;

  constructor() {
    super('inventory');

    // 设置面板尺寸和位置（居中）
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

    // 绘制安全区
    const safeItems = this.bag.getSafeItems();
    const safeCap = this.bag.getSafeCap();
    const gridCols = 2;
    const gridRows = Math.ceil(safeCap / gridCols);
    const cellWidth = 170;
    const cellHeight = 50;
    const cellSpacing = 10;

    for (let i = 0; i < safeCap; i++) {
      const col = i % gridCols;
      const row = Math.floor(i / gridCols);
      const x = col * (cellWidth + cellSpacing);
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
    const unsafeGridCols = 4;
    const unsafeGridRows = Math.ceil(unsafeCap / unsafeGridCols);
    const unsafeCellWidth = 80;
    const unsafeCellHeight = 80;
    const unsafeCellSpacing = 10;

    for (let i = 0; i < unsafeCap; i++) {
      const col = i % unsafeGridCols;
      const row = Math.floor(i / unsafeGridCols);
      const x = col * (unsafeCellWidth + unsafeCellSpacing);
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
