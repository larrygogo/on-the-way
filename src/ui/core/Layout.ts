/**
 * Safe Area 边距
 */
export interface SafeInsets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/**
 * 布局状态
 */
export interface LayoutState {
  /** 设计分辨率宽度 */
  designW: number;
  /** 设计分辨率高度 */
  designH: number;
  /** 屏幕宽度（CSS 像素） */
  screenW: number;
  /** 屏幕高度（CSS 像素） */
  screenH: number;
  /** 设备像素比 */
  dpr: number;
  /** Safe Area 边距 */
  safeInsets: SafeInsets;
  /** 缩放比例（保持宽高比） */
  scale: number;
  /** 视口矩形（设计分辨率空间） */
  viewportRect: { x: number; y: number; width: number; height: number };
  /** 安全区域矩形（设计分辨率空间，考虑 Safe Area） */
  safeRect: { x: number; y: number; width: number; height: number };
}

/**
 * 布局计算器
 */
export class Layout {
  private state: LayoutState;

  constructor(designW: number = 1280, designH: number = 720) {
    this.state = {
      designW,
      designH,
      screenW: 0,
      screenH: 0,
      dpr: 1,
      safeInsets: { top: 0, right: 0, bottom: 0, left: 0 },
      scale: 1,
      viewportRect: { x: 0, y: 0, width: designW, height: designH },
      safeRect: { x: 0, y: 0, width: designW, height: designH },
    };
  }

  /**
   * 更新布局
   */
  update(screenW: number, screenH: number, dpr: number, safeInsets: SafeInsets): void {
    this.state.screenW = screenW;
    this.state.screenH = screenH;
    this.state.dpr = dpr;
    this.state.safeInsets = safeInsets;

    // 计算缩放比例（保持宽高比）
    const scaleX = screenW / this.state.designW;
    const scaleY = screenH / this.state.designH;
    this.state.scale = Math.min(scaleX, scaleY);

    // 计算视口矩形（设计分辨率空间）
    const scaledW = screenW / this.state.scale;
    const scaledH = screenH / this.state.scale;
    const offsetX = (this.state.designW - scaledW) / 2;
    const offsetY = (this.state.designH - scaledH) / 2;

    this.state.viewportRect = {
      x: offsetX,
      y: offsetY,
      width: scaledW,
      height: scaledH,
    };

    // 计算安全区域矩形（考虑 Safe Area）
    const safeTop = safeInsets.top / this.state.scale;
    const safeRight = safeInsets.right / this.state.scale;
    const safeBottom = safeInsets.bottom / this.state.scale;
    const safeLeft = safeInsets.left / this.state.scale;

    this.state.safeRect = {
      x: offsetX + safeLeft,
      y: offsetY + safeTop,
      width: scaledW - safeLeft - safeRight,
      height: scaledH - safeTop - safeBottom,
    };
  }

  /**
   * 获取布局状态
   */
  getState(): LayoutState {
    return { ...this.state };
  }

  /**
   * 将 Canvas 坐标转换为设计分辨率空间坐标
   */
  toDesignSpace(canvasX: number, canvasY: number): { x: number; y: number } {
    const { viewportRect, scale } = this.state;
    return {
      x: canvasX / scale + viewportRect.x,
      y: canvasY / scale + viewportRect.y,
    };
  }

  /**
   * 将设计分辨率空间坐标转换为 Canvas 坐标
   */
  toCanvasSpace(designX: number, designY: number): { x: number; y: number } {
    const { viewportRect, scale } = this.state;
    return {
      x: (designX - viewportRect.x) * scale,
      y: (designY - viewportRect.y) * scale,
    };
  }
}

/**
 * 从 CSS 变量获取 Safe Area
 */
export function getSafeInsets(): SafeInsets {
  const rootStyle = getComputedStyle(document.documentElement);
  return {
    top: parseFloat(rootStyle.getPropertyValue('--safe-area-inset-top') || '0'),
    right: parseFloat(rootStyle.getPropertyValue('--safe-area-inset-right') || '0'),
    bottom: parseFloat(rootStyle.getPropertyValue('--safe-area-inset-bottom') || '0'),
    left: parseFloat(rootStyle.getPropertyValue('--safe-area-inset-left') || '0'),
  };
}
