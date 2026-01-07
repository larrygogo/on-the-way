import { UIElement } from './UIElement';

/**
 * 面板基类
 */
export class UIPanel extends UIElement {
  /** 面板 ID */
  panelId: string;
  /** 是否打开 */
  isOpen: boolean = false;

  constructor(panelId: string) {
    super();
    this.panelId = panelId;
    this.interactive = true;
  }

  /**
   * 打开面板
   */
  open(): void {
    if (this.isOpen) {
      return;
    }
    this.isOpen = true;
    this.visible = true;
    this.onOpen();
    this.onShow();
  }

  /**
   * 关闭面板
   */
  close(): void {
    if (!this.isOpen) {
      return;
    }
    this.isOpen = false;
    this.visible = false;
    this.onClose();
    this.onHide();
  }

  /**
   * 打开时调用（子类可重写）
   */
  onOpen(): void {
    // 子类实现
  }

  /**
   * 关闭时调用（子类可重写）
   */
  onClose(): void {
    // 子类实现
  }
}
